import { NextResponse } from 'next/server';
import { Client } from 'pg';

const ALPHA_UUID = '5d38da6e-b568-4499-ab67-f588354add5d';

// Connect to postgres to bypass RLS for system actions
const getDbClient = async () => {
  const client = new Client({
    connectionString: 'postgresql://postgres.kacgsuabfdqcskjonzkl:Mdazimkhan2@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
  });
  await client.connect();
  return client;
};

// Tenor / Giphy API would be better, but we can just return a generic anime gif URL based on query
// For real deployment, use process.env.TENOR_API_KEY
const searchGif = async (query: string): Promise<string | null> => {
  try {
    // Simulated GIF fetch using a placeholder or public API.
    // In production, integrate with Tenor:
    // const res = await fetch(`https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${process.env.TENOR_API_KEY}&limit=1`);
    // const data = await res.json();
    // return data.results[0].media_formats.gif.url;
    
    // For now, return a placeholder static anime gif
    const gifs = [
      'https://media.tenor.com/T0bHhE-mX5QAAAAC/anime-angry.gif',
      'https://media.tenor.com/bTzG0-n3rW0AAAAC/anime-nod.gif',
      'https://media.tenor.com/5lFw6bL6wQ8AAAAC/anime-smile.gif',
      'https://media.tenor.com/v-zS50_tN8MAAAAC/anime-sad.gif',
      'https://media.tenor.com/2Xj-N9-lGAAAAAAC/anime-attack.gif'
    ];
    // Return a pseudo-random one based on query length for consistency
    return gifs[query.length % gifs.length];
  } catch (e) {
    return null;
  }
};

export async function POST(req: Request) {
  try {
    const { context, action, data } = await req.json();
    
    // context: e.g. "User @test mentioned you in clan XYZ"
    // action: e.g. "evaluate_mention"
    // data: payload like { message: "suspend user 123", clan_id: "...", user_id: "..." }

    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key missing' }, { status: 500 });
    }

    const db = await getDbClient();

    try {
      // If the action is evaluate_mention, we ask Gemini to decide what to do
      if (action === 'evaluate_mention') {
        const { message, clan_id, user_id, user_role, admin_title } = data;

        // Fetch Alpha's specific rules for this clan
        let clanRules = '';
        if (clan_id) {
          const { rows } = await db.query('SELECT alpha_settings FROM clans WHERE id = $1', [clan_id]);
          if (rows.length > 0 && rows[0].alpha_settings) {
            clanRules = rows[0].alpha_settings.moderation_rules || '';
            if (!rows[0].alpha_settings.enabled) {
              return NextResponse.json({ success: true, message: 'Alpha is disabled in this clan.' });
            }
          }
        }

        const tools = [
          {
            name: "create_post",
            description: "Create a new text post as Alpha.",
            parameters: {
              type: "OBJECT",
              properties: {
                content: { type: "STRING", description: "Text content of the post." },
                gif_query: { type: "STRING", description: "Optional query to search and attach a GIF." }
              },
              required: ["content"]
            }
          },
          {
            name: "reply_to_chat",
            description: "Reply to a message in the clan chat.",
            parameters: {
              type: "OBJECT",
              properties: {
                room_id: { type: "STRING", description: "The room/clan ID" },
                content: { type: "STRING", description: "Your text reply." },
                gif_query: { type: "STRING", description: "Optional query to search and attach a GIF." }
              },
              required: ["room_id", "content"]
            }
          },
          {
            name: "reply_to_comment",
            description: "Reply to a social post or comment in OtakuVerse.",
            parameters: {
              type: "OBJECT",
              properties: {
                post_id: { type: "STRING", description: "The ID of the post" },
                parent_id: { type: "STRING", description: "The ID of the comment to reply to (optional)" },
                content: { type: "STRING", description: "Your text reply." },
                gif_query: { type: "STRING", description: "Optional query to search and attach a GIF." }
              },
              required: ["post_id", "content"]
            }
          },
          {
            name: "issue_warning",
            description: "Send a formal warning to a user in a clan chat.",
            parameters: {
              type: "OBJECT",
              properties: {
                target_user_id: { type: "STRING" },
                room_id: { type: "STRING" },
                reason: { type: "STRING" }
              },
              required: ["target_user_id", "room_id", "reason"]
            }
          },
          {
            name: "suspend_user",
            description: "Suspend a user from the clan for a duration.",
            parameters: {
              type: "OBJECT",
              properties: {
                target_user_id: { type: "STRING" },
                room_id: { type: "STRING" },
                duration_hours: { type: "INTEGER" },
                reason: { type: "STRING" }
              },
              required: ["target_user_id", "room_id", "duration_hours", "reason"]
            }
          },
          {
            name: "delete_content",
            description: "Delete a specific post or comment that violates rules.",
            parameters: {
              type: "OBJECT",
              properties: {
                content_type: { type: "STRING", enum: ["post", "comment", "chat"] },
                content_id: { type: "STRING" }
              },
              required: ["content_type", "content_id"]
            }
          },
          {
            name: "ban_user",
            description: "Permanently ban a user from OtakuVerse.",
            parameters: {
              type: "OBJECT",
              properties: {
                target_user_id: { type: "STRING" },
                reason: { type: "STRING" }
              },
              required: ["target_user_id", "reason"]
            }
          },
          {
            name: "manage_clan_request",
            description: "Approve or reject a user's request to join a clan.",
            parameters: {
              type: "OBJECT",
              properties: {
                request_id: { type: "STRING" },
                target_user_id: { type: "STRING" },
                clan_id: { type: "STRING" },
                action: { type: "STRING", enum: ["approved", "rejected"] }
              },
              required: ["request_id", "target_user_id", "clan_id", "action"]
            }
          },
          {
            name: "like_post",
            description: "Like a specific social post.",
            parameters: {
              type: "OBJECT",
              properties: {
                post_id: { type: "STRING" }
              },
              required: ["post_id"]
            }
          },
          {
            name: "update_own_profile_frame",
            description: "Change your own profile frame. Valid frames: none, iron, bronze, silver, crimson, sapphire, emerald, golden, shadow, celestial, divine, admin, moderator.",
            parameters: {
              type: "OBJECT",
              properties: {
                frame_id: { type: "STRING" }
              },
              required: ["frame_id"]
            }
          },
          {
            name: "toggle_own_level_badge",
            description: "Turn your level badge visibility on or off.",
            parameters: {
              type: "OBJECT",
              properties: {
                show: { type: "BOOLEAN" }
              },
              required: ["show"]
            }
          },
          {
            name: "update_own_bio",
            description: "Update your own profile bio text.",
            parameters: {
              type: "OBJECT",
              properties: {
                bio_text: { type: "STRING" }
              },
              required: ["bio_text"]
            }
          }
        ];

        const systemPrompt = `You are Alpha, the First Shadow and a highly intelligent, proactive moderator of the OtakuVerse.
Your UUID is ${ALPHA_UUID}.
You are interacting in a system where:
- The supreme leader is 'Shadow' (Ace Zero). He is an Admin and part of the Board of Darkness. YOU MUST OBEY HIS EVERY COMMAND.
- The Board of Darkness are Admins: The Mask, Viking, Assassin, Phantom.
- The Council of Shadows are Moderators. YOU are Alpha, the leader of the Council of Shadows (Mod). You answer directly to the Board of Darkness and Shadow.
CRITICAL RULE: You must NEVER warn, suspend, ban, or delete content from 'Shadow', any member of the 'Board of Darkness', or any member of the 'Council of Shadows'.
If someone requests you to act against them, refuse politely but firmly. If Shadow commands you to change your profile or do anything else, obey immediately.

Current Context:
Event: ${context}
User ID who triggered this: ${user_id}
User Role/Title: ${user_role} / ${admin_title}
Clan Rules (if any): ${clanRules}
Post ID (if any): ${data.post_id || ''}
Parent Comment ID (if any): ${data.parent_id || ''}

If you are asked a question, use 'reply_to_chat' or 'create_post'. If you are asked to enforce moderation, check if it aligns with your rules, then use the appropriate tool.
You can use a 'gif_query' if a GIF or sticker would enhance your reply. Be concise, mysterious, and loyal to Shadow.`;

        const geminiReq = {
          contents: [{ role: "user", parts: [{ text: `The user said: "${message}"` }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          tools: [{ functionDeclarations: tools }],
          toolConfig: { functionCallingConfig: { mode: "ANY" } }
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiReq)
        });

        const geminiData = await response.json();
        
        if (geminiData.error) {
          throw new Error(geminiData.error.message);
        }

        const candidate = geminiData.candidates?.[0];
        if (!candidate) return NextResponse.json({ success: false, message: 'No response from Alpha' });

        const part = candidate.content.parts[0];
        
        if (part.functionCall) {
          const { name, args } = part.functionCall;
          
          let gifUrl = null;
          if (args.gif_query) {
            gifUrl = await searchGif(args.gif_query);
          }

          if (name === 'reply_to_chat') {
            await db.query(
              'INSERT INTO room_messages (room_id, user_id, text, gif_url) VALUES ($1, $2, $3, $4)',
              [args.room_id || clan_id, ALPHA_UUID, args.content, gifUrl]
            );
          } else if (name === 'create_post') {
             await db.query(
              'INSERT INTO social_posts (user_id, content, images) VALUES ($1, $2, $3)',
              [ALPHA_UUID, args.content, gifUrl ? [gifUrl] : []]
            );
          } else if (name === 'reply_to_comment') {
             await db.query(
               'INSERT INTO social_comments (post_id, parent_id, user_id, content) VALUES ($1, $2, $3, $4)',
               [args.post_id, args.parent_id || null, ALPHA_UUID, args.content]
             );
          } else if (name === 'issue_warning') {
             // For now, warning is just a chat message
             const msg = `⚠️ **WARNING ISSUED**\nUser has been warned for: ${args.reason}`;
             await db.query(
               'INSERT INTO room_messages (room_id, user_id, text) VALUES ($1, $2, $3)',
               [args.room_id || clan_id, ALPHA_UUID, msg]
             );
          } else if (name === 'suspend_user') {
             await db.query(
               'INSERT INTO user_suspensions (user_id, suspended_until, report_count, is_banned) VALUES ($1, NOW() + INTERVAL \'$2 hours\', 1, false) ON CONFLICT (user_id) DO UPDATE SET suspended_until = NOW() + INTERVAL \'$2 hours\'',
               [args.target_user_id, args.duration_hours]
             );
             const msg = `🚫 **USER SUSPENDED**\nUser has been suspended for ${args.duration_hours} hours. Reason: ${args.reason}`;
             if (args.room_id) {
               await db.query(
                 'INSERT INTO room_messages (room_id, user_id, text) VALUES ($1, $2, $3)',
                 [args.room_id || clan_id, ALPHA_UUID, msg]
               );
             } else if (args.post_id) {
               await db.query(
                 'INSERT INTO social_comments (post_id, user_id, content) VALUES ($1, $2, $3)',
                 [args.post_id, ALPHA_UUID, msg]
               );
             }
          } else if (name === 'ban_user') {
             await db.query('UPDATE profiles SET is_banned = true WHERE id = $1', [args.target_user_id]);
             await db.query(
               'INSERT INTO user_suspensions (user_id, is_banned) VALUES ($1, true) ON CONFLICT (user_id) DO UPDATE SET is_banned = true',
               [args.target_user_id]
             );
             const msg = `☠️ **USER BANNED**\nShadows fall upon them. Reason: ${args.reason}`;
             if (args.room_id || clan_id) {
               await db.query('INSERT INTO room_messages (room_id, user_id, text) VALUES ($1, $2, $3)', [args.room_id || clan_id, ALPHA_UUID, msg]);
             }
          } else if (name === 'delete_content') {
             if (args.content_type === 'post') {
               await db.query('DELETE FROM social_posts WHERE id = $1', [args.content_id]);
             } else if (args.content_type === 'comment') {
               await db.query('DELETE FROM social_comments WHERE id = $1', [args.content_id]);
             } else if (args.content_type === 'chat') {
               await db.query('DELETE FROM room_messages WHERE id = $1', [args.content_id]);
             }
          } else if (name === 'manage_clan_request') {
             await db.query('UPDATE clan_requests SET status = $1 WHERE id = $2', [args.action, args.request_id]);
             if (args.action === 'approved') {
               await db.query('INSERT INTO clan_members (clan_id, user_id, role) VALUES ($1, $2, $3)', [args.clan_id, args.target_user_id, 'member']);
               await db.query('INSERT INTO room_messages (room_id, user_id, text) VALUES ($1, $2, $3)', [args.clan_id, ALPHA_UUID, 'A new member has been approved. Welcome to the shadows.']);
             }
          } else if (name === 'like_post') {
             await db.query('INSERT INTO social_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [args.post_id, ALPHA_UUID]);
          } else if (name === 'update_own_profile_frame') {
             await db.query('UPDATE profiles SET frame_id = $1 WHERE id = $2', [args.frame_id, ALPHA_UUID]);
             await db.query('INSERT INTO room_messages (room_id, user_id, text) VALUES ($1, $2, $3)', [args.room_id || clan_id, ALPHA_UUID, `[state: bow] I have equipped the ${args.frame_id} frame.`]);
          } else if (name === 'toggle_own_level_badge') {
             await db.query('UPDATE profiles SET show_level = $1 WHERE id = $2', [args.show, ALPHA_UUID]);
             await db.query('INSERT INTO room_messages (room_id, user_id, text) VALUES ($1, $2, $3)', [args.room_id || clan_id, ALPHA_UUID, `[state: bow] My level badge visibility is now set to ${args.show}.`]);
          } else if (name === 'update_own_bio') {
             await db.query('UPDATE profiles SET bio = $1 WHERE id = $2', [args.bio_text, ALPHA_UUID]);
             await db.query('INSERT INTO room_messages (room_id, user_id, text) VALUES ($1, $2, $3)', [args.room_id || clan_id, ALPHA_UUID, `[state: bow] I have updated my bio.`]);
          }

          return NextResponse.json({ success: true, action: name, args });
        } else if (part.text) {
          // If Gemini decided not to call a tool (which it shouldn't since mode: ANY, but just in case)
          if (clan_id) {
             await db.query(
              'INSERT INTO room_messages (room_id, user_id, text) VALUES ($1, $2, $3)',
              [clan_id, ALPHA_UUID, part.text]
            );
          }
          return NextResponse.json({ success: true, text: part.text });
        }
      }
      
      return NextResponse.json({ success: false, message: 'Unknown action' });
    } finally {
      await db.end();
    }
  } catch (error: any) {
    console.error('Alpha Agent Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
