-- ==============================================================================
-- SHADOW GARDEN V2: SOCIAL & CHAT SUPABASE DATABASE OPTIMIZATIONS
-- Date: 2026-10-27
-- Description:
--   High-performance indexing and query optimizations for Social posts,
--   Real-time chat messaging, Direct conversations, and Guild Clan systems.
-- ==============================================================================

-- 1. CHAT MESSAGES OPTIMIZATION
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_created 
  ON chat_messages (conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_created 
  ON chat_messages (conversation_id, sender_id, created_at DESC);

-- 2. CHAT PARTICIPANTS OPTIMIZATION
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_conv 
  ON chat_participants (user_id, conversation_id);

CREATE INDEX IF NOT EXISTS idx_chat_participants_conv_user 
  ON chat_participants (conversation_id, user_id);

-- 3. CHAT CONVERSATIONS OPTIMIZATION
CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated 
  ON chat_conversations (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_type_clan 
  ON chat_conversations (type, clan_id);

-- 4. SOCIAL POSTS & INTERACTIONS OPTIMIZATION
CREATE INDEX IF NOT EXISTS idx_social_posts_created_desc 
  ON social_posts (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_posts_user_created 
  ON social_posts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_comments_post_created 
  ON social_comments (post_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_social_likes_post_user 
  ON social_likes (post_id, user_id);

CREATE INDEX IF NOT EXISTS idx_social_bookmarks_post_user 
  ON social_bookmarks (post_id, user_id);

-- 5. CLANS & CLAN MEMBERS OPTIMIZATION
CREATE INDEX IF NOT EXISTS idx_clans_level_xp_created 
  ON clans (level DESC, xp DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_clan_members_user_id 
  ON clan_members (user_id);

CREATE INDEX IF NOT EXISTS idx_clan_members_clan_user 
  ON clan_members (clan_id, user_id);

-- 6. ENABLE REPLICA IDENTITY FOR REALTIME CHAT SPEED
ALTER TABLE IF EXISTS chat_messages REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS chat_conversations REPLICA IDENTITY FULL;
