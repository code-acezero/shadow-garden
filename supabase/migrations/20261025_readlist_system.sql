-- ==============================================================================
-- SHADOW GARDEN V2: READLIST SYSTEM & WATCHLIST UNIFIED MIGRATION
-- ==============================================================================
-- Description:
-- Extends the existing `watchlist` table to seamlessly support Reading materials
-- (Manga, Manhwa, Light Novels, Web Novels, Manhua) alongside Anime.
-- Also creates `user_continue_reading` for chapter reading progress tracking,
-- creates the `readlist` convenience view, and sets up robust RLS policies.
-- ==============================================================================

-- 1. Ensure `watchlist` supports media_type and chapter progress columns
ALTER TABLE public.watchlist 
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'anime';

ALTER TABLE public.watchlist 
ADD COLUMN IF NOT EXISTS chapters_read INTEGER DEFAULT 0;

ALTER TABLE public.watchlist 
ADD COLUMN IF NOT EXISTS total_chapters INTEGER DEFAULT NULL;

ALTER TABLE public.watchlist 
ADD COLUMN IF NOT EXISTS last_chapter_id TEXT DEFAULT NULL;

ALTER TABLE public.watchlist 
ADD COLUMN IF NOT EXISTS reading_format TEXT DEFAULT NULL;

-- 2. Update status constraint if any check constraint exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'watchlist' AND constraint_name LIKE '%status%'
    ) THEN
        ALTER TABLE public.watchlist DROP CONSTRAINT IF EXISTS watchlist_status_check;
        ALTER TABLE public.watchlist ADD CONSTRAINT watchlist_status_check 
        CHECK (status IN (
            'watching', 'plan_to_watch', 
            'reading', 'plan_to_read', 
            'completed', 'on_hold', 'dropped'
        ));
    END IF;
END $$;

-- 3. Create high-performance indexes for unified library queries
CREATE INDEX IF NOT EXISTS idx_watchlist_user_media 
ON public.watchlist (user_id, media_type, status);

CREATE INDEX IF NOT EXISTS idx_watchlist_user_updated 
ON public.watchlist (user_id, updated_at DESC);

-- 4. Create `user_continue_reading` table for chapter progress tracking
CREATE TABLE IF NOT EXISTS public.user_continue_reading (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    manga_id TEXT NOT NULL,
    title TEXT NOT NULL,
    cover_image TEXT,
    chapter_id TEXT NOT NULL,
    chapter_number NUMERIC NOT NULL,
    chapter_title TEXT,
    page_progress INTEGER DEFAULT 1,
    total_pages INTEGER DEFAULT 1,
    media_type TEXT DEFAULT 'manga',
    last_read TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_manga_continue UNIQUE(user_id, manga_id)
);

CREATE INDEX IF NOT EXISTS idx_continue_reading_user 
ON public.user_continue_reading (user_id, last_read DESC);

-- 5. Enable Row Level Security (RLS) on `user_continue_reading`
ALTER TABLE public.user_continue_reading ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_continue_reading' AND policyname = 'Users can view their own reading history'
    ) THEN
        CREATE POLICY "Users can view their own reading history" 
        ON public.user_continue_reading 
        FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_continue_reading' AND policyname = 'Users can insert their own reading history'
    ) THEN
        CREATE POLICY "Users can insert their own reading history" 
        ON public.user_continue_reading 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_continue_reading' AND policyname = 'Users can update their own reading history'
    ) THEN
        CREATE POLICY "Users can update their own reading history" 
        ON public.user_continue_reading 
        FOR UPDATE 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_continue_reading' AND policyname = 'Users can delete their own reading history'
    ) THEN
        CREATE POLICY "Users can delete their own reading history" 
        ON public.user_continue_reading 
        FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- 6. Create `readlist` view for quick SQL inspection
CREATE OR REPLACE VIEW public.readlist AS 
SELECT 
    id,
    user_id,
    anime_id AS manga_id,
    anime_title AS title,
    anime_image AS cover,
    status,
    COALESCE(chapters_read, last_episode_number, 0) AS progress,
    COALESCE(total_chapters, total_episodes) AS total_chapters,
    media_type,
    score,
    updated_at
FROM public.watchlist 
WHERE media_type IN ('manga', 'manhwa', 'manhua', 'light_novel', 'web_novel', 'novel');

COMMENT ON TABLE public.user_continue_reading IS 'Tracks chapter reading history for manga and novel readers';
COMMENT ON VIEW public.readlist IS 'Unified view of reading materials stored within the user watchlist archive';
