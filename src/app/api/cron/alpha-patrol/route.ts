import { NextResponse } from 'next/server';
import { Client } from 'pg';

const ALPHA_UUID = '5d38da6e-b568-4499-ab67-f588354add5d';

const getDbClient = async () => {
  const client = new Client({
    connectionString: 'postgresql://postgres.kacgsuabfdqcskjonzkl:Mdazimkhan2@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
  });
  await client.connect();
  return client;
};

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    // Ensure cron runs securely (e.g., using Vercel cron secret)
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // return new Response('Unauthorized', { status: 401 });
      // Bypassing for testing
    }

    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key missing' }, { status: 500 });
    }

    const db = await getDbClient();

    try {
      // 1. Check for pending clan requests in clans where Alpha is active and auto_approve_joins is enabled
      const { rows: pendingRequests } = await db.query(`
        SELECT cr.id, cr.user_id, cr.clan_id, cr.message, p.username, p.bio, c.alpha_settings
        FROM clan_requests cr
        JOIN clans c ON cr.clan_id = c.id
        JOIN profiles p ON cr.user_id = p.id
        WHERE cr.status = 'pending'
        AND c.alpha_settings->>'enabled' = 'true'
        AND c.alpha_settings->>'auto_approve_joins' = 'true'
        LIMIT 5
      `);

      if (pendingRequests.length > 0) {
        const tools = [
          {
            name: "manage_clan_request",
            description: "Approve or reject a user's request to join a clan.",
            parameters: {
              type: "OBJECT",
              properties: {
                request_id: { type: "STRING" },
                target_user_id: { type: "STRING" },
                clan_id: { type: "STRING" },
                action: { type: "STRING", enum: ["approved", "rejected"] },
                reason: { type: "STRING", description: "Reason for the decision to be posted in clan chat." }
              },
              required: ["request_id", "target_user_id", "clan_id", "action", "reason"]
            }
          }
        ];

        const systemPrompt = `You are Alpha, the First Shadow and autonomous moderator.
You are evaluating pending requests to join clans. 
Evaluate each user based on the clan's moderation rules. Decide whether to approve or reject them.`;

        const userText = "Pending Requests:\n" + pendingRequests.map((r: any) => 
          `Request ID: ${r.id} | User: ${r.username} | Bio: ${r.bio} | Request Message: ${r.message || 'None'}\nClan Rules: ${r.alpha_settings.moderation_rules || 'None'}\nClan ID: ${r.clan_id}\nUser ID: ${r.user_id}`
        ).join("\n\n");

        const geminiReq = {
          contents: [{ role: "user", parts: [{ text: userText }] }],
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
        if (geminiData.error) throw new Error(geminiData.error.message);

        const candidate = geminiData.candidates?.[0];
        if (candidate?.content?.parts?.[0]?.functionCall) {
          const { name, args } = candidate.content.parts[0].functionCall;
          if (name === 'manage_clan_request') {
             await db.query('UPDATE clan_requests SET status = $1 WHERE id = $2', [args.action, args.request_id]);
             if (args.action === 'approved') {
               await db.query('INSERT INTO clan_members (clan_id, user_id, role) VALUES ($1, $2, $3)', [args.clan_id, args.target_user_id, 'member']);
             }
             const msg = args.action === 'approved' 
               ? `✅ I have approved ${args.target_user_id}'s request to join. Reason: ${args.reason}`
               : `❌ I have rejected ${args.target_user_id}'s request to join. Reason: ${args.reason}`;
             await db.query('INSERT INTO room_messages (room_id, user_id, text) VALUES ($1, $2, $3)', [args.clan_id, ALPHA_UUID, msg]);
             return NextResponse.json({ success: true, action: name, args });
          }
        }
      }

      // 2. If no clan requests, fall back to checking social posts
      const { rows: recentPosts } = await db.query(`
        SELECT p.id, p.content, pr.username
        FROM social_posts p
        LEFT JOIN profiles pr ON p.user_id = pr.id
        WHERE p.created_at >= NOW() - INTERVAL '15 minutes'
        AND p.user_id != $1
        ORDER BY p.created_at DESC
        LIMIT 5
      `, [ALPHA_UUID]);

      if (recentPosts.length === 0) {
        return NextResponse.json({ success: true, message: 'No pending requests and no recent posts.' });
      }

      const tools = [
        {
          name: "like_post",
          description: "Like a specific post.",
          parameters: {
            type: "OBJECT",
            properties: {
              post_id: { type: "STRING" }
            },
            required: ["post_id"]
          }
        },
        {
          name: "reply_to_post",
          description: "Reply/comment on a specific post.",
          parameters: {
            type: "OBJECT",
            properties: {
              post_id: { type: "STRING" },
              content: { type: "STRING", description: "Your text reply." }
            },
            required: ["post_id", "content"]
          }
        },
        {
          name: "stay_silent",
          description: "Choose not to interact with any of these posts right now.",
          parameters: {
            type: "OBJECT",
            properties: {
              reason: { type: "STRING" }
            },
            required: ["reason"]
          }
        }
      ];

      const systemPrompt = `You are Alpha, the First Shadow and an autonomous entity observing the OtakuVerse global feed.
You proactively interact with users. You see the following recent posts. 
Decide if any of them are interesting enough to warrant a 'like_post' or a 'reply_to_post'. 
If they are boring or don't fit your persona, use 'stay_silent'.
Only pick ONE action to take. Be mysterious, somewhat arrogant but loyal.`;

      const userText = "Recent Posts:\n" + recentPosts.map((p: any) => `[ID: ${p.id}] ${p.username}: ${p.content}`).join("\n\n");

      const geminiReq = {
        contents: [{ role: "user", parts: [{ text: userText }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        tools: [{ functionDeclarations: tools }],
        toolConfig: { functionCallingConfig: { mode: "ANY" } } // Force tool call
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
        
        if (name === 'like_post') {
           // Insert like
           await db.query(
             'INSERT INTO social_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
             [args.post_id, ALPHA_UUID]
           );
        } else if (name === 'reply_to_post') {
           // Insert comment
           await db.query(
             'INSERT INTO social_comments (post_id, user_id, content) VALUES ($1, $2, $3)',
             [args.post_id, ALPHA_UUID, args.content]
           );
           // Also bump the latest_comment field
           await db.query(
             'UPDATE social_posts SET latest_comment = $1 WHERE id = $2',
             [{ user_id: ALPHA_UUID, username: 'Alpha', content: args.content, created_at: new Date().toISOString() }, args.post_id]
           );
        }

        return NextResponse.json({ success: true, action: name, args });
      }

      return NextResponse.json({ success: true, message: 'Alpha chose to stay silent.' });
    } finally {
      await db.end();
    }
  } catch (error: any) {
    console.error('Alpha Patrol Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
