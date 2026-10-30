-- ==============================================================================
-- SHADOW GARDEN V2: USER ECONOMY, DAILY TASKS & FRAME INVENTORY MIGRATION
-- Date: 2026-10-29
-- Description:
--   Adds coins balance, active frame selection, purchased frames inventory,
--   daily streaks, and task audit tables for the gamer-first reward economy.
-- ==============================================================================

-- 1. Ensure columns on profiles table
ALTER TABLE IF EXISTS profiles 
  ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS frame_id TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS purchased_frames JSONB DEFAULT '["none"]'::jsonb,
  ADD COLUMN IF NOT EXISTS daily_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_checkin_date TEXT,
  ADD COLUMN IF NOT EXISTS completed_tasks JSONB DEFAULT '{}'::jsonb;

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_coins ON profiles (coins DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_frame_id ON profiles (frame_id);

-- 3. Dedicated User Frame Inventory Table
CREATE TABLE IF NOT EXISTS user_frame_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  frame_id TEXT NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  cost INTEGER DEFAULT 0,
  UNIQUE(user_id, frame_id)
);

CREATE INDEX IF NOT EXISTS idx_user_frame_inventory_user 
  ON user_frame_inventory (user_id);

-- 4. Enable Row Level Security
ALTER TABLE user_frame_inventory ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_frame_inventory' AND policyname = 'Users can view own frame inventory'
  ) THEN
    CREATE POLICY "Users can view own frame inventory" 
      ON user_frame_inventory FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_frame_inventory' AND policyname = 'Users can insert own frame inventory'
  ) THEN
    CREATE POLICY "Users can insert own frame inventory" 
      ON user_frame_inventory FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
