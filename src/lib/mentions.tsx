import React from 'react';
import Link from 'next/link';

interface RenderMentionsProps {
  content: string;
  className?: string;
}

/**
 * Parses content text and renders any @username mention in red text
 * with a direct clickable link to /profile/username.
 */
export function RenderMentions({ content, className = '' }: RenderMentionsProps) {
  if (!content) return null;

  // Regex to match @username or @[username]
  const mentionRegex = /(@[a-zA-Z0-9_-]+|@\[[a-zA-Z0-9_\s-]+\])/g;
  const parts = content.split(mentionRegex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.match(/^@[a-zA-Z0-9_-]+$/)) {
          const username = part.slice(1);
          return (
            <Link
              key={index}
              href={`/profile/${encodeURIComponent(username)}`}
              onClick={(e) => e.stopPropagation()}
              className="text-red-500 hover:text-red-400 font-bold hover:underline cursor-pointer transition-colors inline-block mx-0.5"
            >
              {part}
            </Link>
          );
        } else if (part.match(/^@\[[a-zA-Z0-9_\s-]+\]$/)) {
          const username = part.slice(2, -1);
          return (
            <Link
              key={index}
              href={`/profile/${encodeURIComponent(username)}`}
              onClick={(e) => e.stopPropagation()}
              className="text-red-500 hover:text-red-400 font-bold hover:underline cursor-pointer transition-colors inline-block mx-0.5"
            >
              @{username}
            </Link>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
}

/**
 * Extracts mentions from text and inserts permanent notifications into database.
 */
export async function processMentionsAndNotify(
  supabase: any,
  content: string,
  senderId: string,
  senderName: string,
  targetType: 'post' | 'comment' = 'post'
) {
  if (!supabase || !content || !senderId) return;

  const matches = content.match(/@([a-zA-Z0-9_-]+)/g);
  if (!matches || matches.length === 0) return;

  const rawUsernames = Array.from(new Set(matches.map(m => m.slice(1))));

  // Ignore @all or system tags
  const validUsernames = rawUsernames.filter(u => u.toLowerCase() !== 'all' && u.toLowerCase() !== 'everyone');
  if (validUsernames.length === 0) return;

  try {
    const { data: targetUsers } = await supabase
      .from('profiles')
      .select('id, username')
      .in('username', validUsernames);

    if (targetUsers && targetUsers.length > 0) {
      const notifications = targetUsers
        .filter((u: any) => u.id !== senderId) // Don't notify self
        .map((u: any) => ({
          user_id: u.id,
          type: 'MENTION',
          content: `🔔 @${senderName || 'Someone'} mentioned you in a ${targetType}: "${content.slice(0, 100)}..."`
        }));

      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }
    }
  } catch (err) {
    console.error('Error processing mention notifications:', err);
  }
}
