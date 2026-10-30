-- ==============================================================================
-- SHADOW GARDEN V2: USER TITLES ISOLATION & INSTAGRAM-GRADE FRIENDSHIPS MIGRATION
-- Date: 2026-10-29
-- Description:
--   1. Isolates title selection (`equipped_title`, `custom_title`, `unlocked_titles`, `show_title`)
--      preventing collision between level milestones and admin/moderator roles.
--   2. Ensures robust indexing and RLS on `follows` table for rapid mutual friend discovery.
-- ==============================================================================

-- 1. Upgrade Profiles Table with Isolated Title Columns
ALTER TABLE IF EXISTS profiles
  ADD COLUMN IF NOT EXISTS equipped_title TEXT,
  ADD COLUMN IF NOT EXISTS custom_title TEXT,
  ADD COLUMN IF NOT EXISTS unlocked_titles JSONB DEFAULT '["Novice"]'::jsonb,
  ADD COLUMN IF NOT EXISTS show_title BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_profiles_equipped_title ON profiles (equipped_title);

-- 2. Ensure Follows Table with Clean Mutual Relationship Indices
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows (following_id);
CREATE INDEX IF NOT EXISTS idx_follows_composite ON follows (follower_id, following_id);

-- 3. Row Level Security for Follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Public read follows'
  ) THEN
    CREATE POLICY "Public read follows" ON follows FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Users can follow'
  ) THEN
    CREATE POLICY "Users can follow" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Users can unfollow'
  ) THEN
    CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);
  END IF;
END $$;

-- 4. Helper Function: Get Mutual Friends Count & Sample
CREATE OR REPLACE FUNCTION get_mutual_friends_summary(user_a UUID, user_b UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  mutual_count INTEGER;
  sample_profiles JSONB;
BEGIN
  -- Count users that user_a follows AND who also follow user_b
  SELECT COUNT(DISTINCT f1.following_id)
  INTO mutual_count
  FROM follows f1
  INNER JOIN follows f2 ON f1.following_id = f2.follower_id
  WHERE f1.follower_id = user_a AND f2.following_id = user_b;

  -- Grab up to 2 mutual friend profiles for the "Followed by X, Y and Z others" display
  SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb)
  INTO sample_profiles
  FROM (
    SELECT p.id, p.username, p.avatar_url, p.frame_id
    FROM follows f1
    INNER JOIN follows f2 ON f1.following_id = f2.follower_id
    INNER JOIN profiles p ON p.id = f1.following_id
    WHERE f1.follower_id = user_a AND f2.following_id = user_b
    LIMIT 2
  ) sub;

  RETURN jsonb_build_object(
    'count', mutual_count,
    'samples', sample_profiles
  );
END;
$$;

