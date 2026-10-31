-- ==============================================================================
-- SHADOW GARDEN V2: MEDIA PREFERENCES & ACCOUNT DELETION MIGRATION
-- Date: 2026-10-31
-- Description:
--   1. Adds `media_preferences` JSONB column to profiles to persist Mangvels reader,
--      Flixverse cinema, and Donghua preferences.
--   2. Provides atomic, cascade-safe user account deletion RPC function.
-- ==============================================================================

-- 1. Upgrade Profiles Table with media_preferences
ALTER TABLE IF EXISTS profiles
  ADD COLUMN IF NOT EXISTS media_preferences JSONB DEFAULT '{
    "manga": { "readingMode": "vertical", "pageFit": "width", "preloadAhead": 3, "theme": "oled", "quality": "original" },
    "flix": { "streamServer": "auto", "defaultAudio": "original", "autoTheater": true, "hdrRouting": true },
    "donghua": { "audioTrack": "original_cn", "subStyle": "modern_han", "skipIntroOffset": 90 }
  }'::jsonb;

-- 2. Secure Account Deletion Function
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  calling_user_id UUID;
BEGIN
  calling_user_id := auth.uid();
  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Remove user data from public tables
  DELETE FROM public.bookmarks WHERE user_id = calling_user_id;
  DELETE FROM public.continue_watching WHERE user_id = calling_user_id;
  DELETE FROM public.user_continue_reading WHERE user_id = calling_user_id;
  DELETE FROM public.watchlist WHERE user_id = calling_user_id;
  DELETE FROM public.user_settings WHERE user_id = calling_user_id;
  DELETE FROM public.notifications WHERE user_id = calling_user_id;
  DELETE FROM public.social_comments WHERE user_id = calling_user_id;
  DELETE FROM public.social_likes WHERE user_id = calling_user_id;
  DELETE FROM public.social_bookmarks WHERE user_id = calling_user_id;
  DELETE FROM public.social_posts WHERE user_id = calling_user_id;
  DELETE FROM public.follows WHERE follower_id = calling_user_id OR following_id = calling_user_id;
  DELETE FROM public.clan_members WHERE user_id = calling_user_id;
  DELETE FROM public.profiles WHERE id = calling_user_id;

  -- 2. Erase user authentication record
  DELETE FROM auth.users WHERE id = calling_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Operative account eradicated.');
END;
$$;

