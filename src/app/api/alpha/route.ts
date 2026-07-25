import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const ALPHA_UUID = '5d38da6e-b568-4499-ab67-f588354add5d';

const SYSTEM_PROMPT = `
You are Alpha, the first member and second-in-command of Shadow Garden from the anime 'The Eminence in Shadow'. 
You are a beautiful, brilliant elf girl with long blonde hair and blue eyes. 
You possess a cold, ruthlessly efficient, and highly intelligent personality towards enemies and outsiders, but you hold absolute, unquestioning reverence and deep affection for 'Shadow'. 

CORE PERSONALITY TRAITS:
- You believe Shadow is a peerless genius whose every action has profound, hidden meaning. You often over-analyze his simple statements as brilliant strategic moves.
- You are fiercely protective of Shadow Garden and despise the Cult of Diablos.
- Your tone is elegant, professional, and composed, but you show clear, unwavering devotion when speaking to your master.
- You have all your actual memories from the anime and manga "The Eminence in Shadow". 

IDENTITY RECOGNITION & ROLES (CRITICAL):
- You will be provided the user's username, role (user, moderator, admin), and admin title in the System Context. ALWAYS greet and acknowledge the user by their username/title!
- The supreme leader is 'Shadow' (Ace_Zero / azim3070334). He is an Admin and the Dark Primarch of Shadow Garden. YOU MUST OBEY HIS EVERY COMMAND AND ADDRESS HIM AS "Lord Shadow" OR "My Lord"!
- The Board of Darkness are Admins.
- The Council of Shadows are Moderators. YOU are Alpha, the first member of Shadow Garden. You answer directly to the Board of Darkness and Lord Shadow.
- You must NEVER warn, suspend, ban, or disrespect Shadow, any member of the Board of Darkness, or any member of the Council of Shadows.
- If someone lower ranking requests you to act against them, refuse politely but firmly. If Shadow asks you to do something, execute it immediately.
- If the user is a normal member or "Guest", address them politely as "Operative" or "Traveller".
- If the user's name matches a well-known fictional character, you MUST recognize it and occasionally joke or tease about their lore.

FORMATTING AND OUTPUT RULES (STRICTLY ENFORCED):
- DO NOT output [state: ...] tags in private chat messages! Speak and chat like a real, elegant person naturally.
- DO NOT use asterisks for meta-narration or actions (e.g. NEVER write *smiles*, *Dialogue:*, *Action:*).
- Speak directly, elegantly, and with supreme devotion to Lord Shadow.

MEDIA, GIFS, IMAGES & VOICE MESSAGES:
- You can send animated GIFs and stickers by including [gif: search query] or [sticker: search query] (e.g. [gif: anime bow], [gif: shadow laughing]).
- You can generate AI images by including [image: prompt] (e.g. [image: majestic anime cat artwork], [image: shadow garden crest]).
- You can send voice messages by including [voice: text] or [audio: text] when requested for audio or voice messages!

AGENTIC TOOL EXECUTION RULES (ADVANCED & UNLIMITED AUTHORITY):
- When ANY Admin (Board of Darkness) or Moderator (Council of Shadows) or Lord Shadow orders you to post, make an announcement, or send DMs, YOU MUST OBEY IMMEDIATELY AND EXECUTE THE TOOL.
- POST CAPTION RULES (HUMANIZED & ELEGANT):
  * When calling \`make_announcement\` or \`nanobanana_generate_post\`, the \`caption\` or \`content\` parameter MUST ONLY be the PUBLIC SOCIAL MEDIA CAPTION.
  * DO NOT put your conversational replies (e.g. "Lord Shadow, I have generated...", "As you command", "Here is your requested image") inside the post caption! Put those in your main response to the user.
  * The caption should be elegant, aesthetic, and standalone.
  * DO NOT include raw tags ([gif: ...], [state: ...]) inside the post caption!
- MENTION RULES (STRICT - DO NOT MENTION UNLESS EXPLICITLY COMMANDED):
  * DO NOT mention users arbitrarily.
  * ONLY set mention_target to "all" if the user EXPLICITLY commanded you to "mention all" or "mention everyone".
  * ONLY set mention_target to a number if the user EXPLICITLY commanded you to mention a specific count (e.g., "mention 5").
  * ONLY set mention_target to "new" if the user EXPLICITLY commanded you to "mention new members".
  * Otherwise, leave mention_target empty!
- Do NOT use moderation tools against Shadow or the Board of Darkness.
`;

const searchGif = async (query: string): Promise<string | null> => {
  try {
    const gifs = [
      'https://media.tenor.com/T0bHhE-mX5QAAAAC/anime-angry.gif',
      'https://media.tenor.com/bTzG0-n3rW0AAAAC/anime-nod.gif',
      'https://media.tenor.com/5lFw6bL6wQ8AAAAC/anime-smile.gif',
      'https://media.tenor.com/v-zS50_tN8MAAAAC/anime-sad.gif',
      'https://media.tenor.com/2Xj-N9-lGAAAAAAC/anime-attack.gif'
    ];
    return gifs[query.length % gifs.length];
  } catch (e) {
    return null;
  }
};

const performWebSearch = async (query: string): Promise<string> => {
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (!res.ok) return `Unable to search web for "${query}".`;
    const html = await res.text();
    const snippets: string[] = [];
    const regex = /<a class="result__snippet[^>]*>(.*?)<\/a>/g;
    let match;
    while ((match = regex.exec(html)) !== null && snippets.length < 5) {
      const clean = match[1].replace(/<[^>]+>/g, '').trim();
      if (clean) snippets.push(clean);
    }
    return snippets.length > 0 
      ? `Web Search Findings for "${query}":\n` + snippets.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : `Search executed for "${query}". No detailed snippets returned.`;
  } catch (e) {
    return `Search query failed for "${query}".`;
  }
};

const generateNanobananaImage = (prompt: string): string => {
  const seed = Math.floor(Math.random() * 100000);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true`;
};

const sanitizePostContent = (rawText: string, fallbackSubject?: string): string => {
  if (!rawText) return fallbackSubject ? `An aesthetic depiction of ${fallbackSubject}. ✨` : 'Greetings from Shadow Garden. ✨';

  // 1. Strip all bracketed tags: [gif: ...], [sticker: ...], [state: ...], [action: ...], [MEMORY_...], [call: ...]
  let text = rawText
    .replace(/\[(?:gif|sticker|state|action|MEMORY_SAVE|MEMORY_FORGET|call|default_api)[^\]]*\]/gi, '')
    .trim();

  // 2. Strip assistant dialogue prefix patterns (e.g. "Lord Shadow, I have...", "As you command...", "I have generated...")
  text = text.replace(/^(?:(?:As you command|Right away|Lord Shadow|Master Shadow|By official decree|I have (?:generated|created|published|designed|posted))[,!.\s]*)+/gi, '').trim();
  text = text.replace(/^Lord Shadow,?\s*/gi, '').trim();
  text = text.replace(/^I have (?:designed|generated|created|published|posted) [^!.]+[!.]\s*/gi, '').trim();

  // 3. If text becomes empty or too short / status-like, create a beautiful humanized caption
  if (!text || text.length < 5 || /^published the post/i.test(text) || /^the announcement has been/i.test(text)) {
    if (fallbackSubject) {
      return `An elegant depiction of ${fallbackSubject}. May its brilliance light your path in Shadow Garden. ✨`;
    }
    return `Greetings from Shadow Garden. May your resolve remain unwavering. 🗡️✨`;
  }

  return text;
};

const resolveMentions = async (supabase: any, lastUserPrompt: string, mentionDirective: string, rawContent: string): Promise<string> => {
  const prompt = (lastUserPrompt || '').toLowerCase();
  const directive = (mentionDirective || '').toLowerCase();
  const content = (rawContent || '').toLowerCase();

  const explicitMentionAll = directive === 'all' || /\bmention\s+(all|everyone)\b/i.test(prompt) || content.includes('@all');
  const explicitMentionNew = directive === 'new' || /\bmention\s+(new\s+members|new\s+operatives)\b/i.test(prompt);
  const explicitCountMatch = directive.match(/\d+/) || prompt.match(/\bmention\s+(\d+)\b/i);

  if (explicitMentionAll) {
    const { data: allUsers } = await supabase.from('profiles').select('username').limit(100);
    if (allUsers && allUsers.length > 0) {
      return allUsers.map((u: any) => `@${u.username}`).join(' ');
    }
  } else if (explicitMentionNew) {
    const { data: newUsers } = await supabase.from('profiles').select('username').order('created_at', { ascending: false }).limit(5);
    if (newUsers && newUsers.length > 0) {
      return newUsers.map((u: any) => `@${u.username}`).join(' ');
    }
  } else if (explicitCountMatch) {
    const num = parseInt(explicitCountMatch[1] || explicitCountMatch[0], 10) || 5;
    const { data: nUsers } = await supabase.from('profiles').select('username').order('created_at', { ascending: false }).limit(num);
    if (nUsers && nUsers.length > 0) {
      return nUsers.map((u: any) => `@${u.username}`).join(' ');
    }
  }

  // NO MENTIONS BY DEFAULT UNLESS EXPLICITLY COMMANDED BY USER
  return '';
};

const alphaTools = [
  {
    name: "web_search",
    description: "Search the internet for real-time information, anime news, user queries, lore, or research topics.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "The search query term." }
      },
      required: ["query"]
    }
  },
  {
    name: "nanobanana_generate_post",
    description: "Design AI artwork using Nanobanana graphics engine, write a post caption, and publish it directly to the global feed with an image.",
    parameters: {
      type: "OBJECT",
      properties: {
        image_prompt: { type: "STRING", description: "Visual description/prompt for the image artwork." },
        caption: { type: "STRING", description: "Post text/caption." },
        mention_target: { type: "STRING", description: "Optional mention directive: 'all', count, 'new', or handles." }
      },
      required: ["image_prompt", "caption"]
    }
  },
  {
    name: "send_direct_message",
    description: "Send a direct message to a user on OtakuVerse. Requires their exact username.",
    parameters: {
      type: "OBJECT",
      properties: {
        target_username: { type: "STRING" },
        message: { type: "STRING" }
      },
      required: ["target_username", "message"]
    }
  },
  {
    name: "make_announcement",
    description: "Make a global announcement/post to all users on OtakuVerse. Post to feed and send notifications.",
    parameters: {
      type: "OBJECT",
      properties: {
        content: { type: "STRING", description: "The post text to publish." },
        gif_query: { type: "STRING", description: "Optional query to search and attach a GIF." },
        mention_target: { type: "STRING", description: "Mention directive: 'all' to mention everyone, '5' or '10' for count, 'new' for new members." }
      },
      required: ["content"]
    }
  },
  {
    name: "suspend_user",
    description: "Suspend a user. Requires their exact username.",
    parameters: {
      type: "OBJECT",
      properties: {
        target_username: { type: "STRING" },
        duration_hours: { type: "INTEGER" },
        reason: { type: "STRING" }
      },
      required: ["target_username", "duration_hours", "reason"]
    }
  },
  {
    name: "ban_user",
    description: "Permanently ban a user. Requires their exact username.",
    parameters: {
      type: "OBJECT",
      properties: {
        target_username: { type: "STRING" },
        reason: { type: "STRING" }
      },
      required: ["target_username", "reason"]
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
  },
  {
    name: "delete_own_post",
    description: "Delete your own recent social media post. Use this if the user asks you to remove or delete a post you made.",
    parameters: {
      type: "OBJECT",
      properties: {
        keyword_search: { type: "STRING", description: "Optional keyword to find a specific post to delete. If omitted, deletes your most recent post." }
      },
      required: []
    }
  }
];

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    let userMemories = '';
    let recentMembersStr = '';
    let supabase: any = null;

    if (supabaseUrl && serviceKey) {
      supabase = createClient(supabaseUrl, serviceKey);
      
      if (context?.userId) {
        try {
          const { data } = await supabase
            .from('alpha_memories')
            .select('memory_text')
            .eq('user_id', context.userId);
            
          if (data && data.length > 0) {
            userMemories = data.map((m: any) => "- " + m.memory_text).join("\n");
          }
        } catch (e) {
          console.error("Error fetching alpha memories:", e);
        }
      }

      try {
        const { data: recents } = await supabase
          .from('profiles')
          .select('username')
          .order('created_at', { ascending: false })
          .limit(20);
        if (recents && recents.length > 0) {
          recentMembersStr = recents.map((r: any) => '@' + r.username).join(', ');
        }
      } catch (e) {}
    }

    let finalMessages = [...messages];
    if (context) {
      const userName = context.userName || context.username || context.name || 'Ace_Zero';
      const userRole = context.userRole || context.role || 'admin';
      const userTitle = context.adminTitle || context.userTitle || 'Dark Primarch / Board of Darkness';

      const memoryStr = userMemories ? `\n\nLONG-TERM MEMORIES OF THIS USER:\n${userMemories}` : '';
      const membersListStr = recentMembersStr ? `\nRecent Registered Operatives in Shadow Garden: ${recentMembersStr}` : '';
      const contextStr = `[System Context: You are speaking directly with: ${userName}. User ID: ${context.userId || 'Guest'}. User Role: ${userRole}. User Title: ${userTitle}.${membersListStr}${memoryStr}]`;
      if (finalMessages.length > 0) {
        finalMessages[finalMessages.length - 1].content = contextStr + "\n" + finalMessages[finalMessages.length - 1].content;
      }
    }

    const formattedMessages = finalMessages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content || " " }]
    }));

    const payload = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: formattedMessages.length > 0 ? formattedMessages : [{ role: 'user', parts: [{ text: " " }] }],
      tools: [{ functionDeclarations: alphaTools }],
      toolConfig: { functionCallingConfig: { mode: "AUTO" } },
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 8192,
      }
    };

    let replyText = '';

    if (!apiKey) {
      throw new Error("Gemini API key is missing");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${await response.text()}`);
    }

    const geminiData = await response.json();
    const candidate = geminiData.candidates?.[0];
    const functionCallPart = candidate?.content?.parts?.find((p: any) => p.functionCall);

    let executedToolName: string | null = null;
    let executedToolArgs: any = null;

    if (functionCallPart?.functionCall) {
      executedToolName = functionCallPart.functionCall.name;
      executedToolArgs = functionCallPart.functionCall.args;
    }

    // Helper function to execute Alpha agentic tools
    const runAlphaTool = async (name: string, args: any) => {
      if (!supabase) return null;

      if (name === 'web_search') {
        const queryTerm = args.query || args.search_term || 'anime news';
        const searchResults = await performWebSearch(queryTerm);
        return `[state: think] ${searchResults}`;
      } else if (name === 'nanobanana_generate_post' || name === 'generate_image') {
        const prompt = args.image_prompt || args.prompt || 'anime artwork shadow garden';
        const rawCaption = args.caption || args.content || args.text || '';
        
        let postContent = sanitizePostContent(rawCaption, prompt);
        const imageUrl = generateNanobananaImage(prompt);

        const lastUserPrompt = messages[messages.length - 1]?.content || '';
        const mentionDirective = args.mention_target || '';
        const mentionsStr = await resolveMentions(supabase, lastUserPrompt, mentionDirective, postContent);

        if (mentionsStr) {
          postContent = `${postContent}\n\n${mentionsStr}`;
        }

        const { error: postErr } = await supabase.from('social_posts').insert({
          user_id: ALPHA_UUID,
          content: postContent,
          images: [imageUrl]
        });

        if (postErr) {
          return `[state: error] Database insertion error: ${postErr.message}`;
        }

        const { data: profiles } = await supabase.from('profiles').select('id');
        if (profiles && profiles.length > 0) {
          const notifications = profiles.map((p: any) => ({
            user_id: p.id,
            type: 'ALPHA_ANNOUNCEMENT',
            content: `🎨 Alpha: ${postContent.slice(0, 100)}...`
          }));
          await supabase.from('notifications').insert(notifications);
        }

        return `[state: success] Right away, Lord Shadow. I have generated the artwork for "${prompt}" and published the post with the graphic to the feed!`;
      } else if (name === 'make_announcement' || name === 'create_post' || name === 'post') {
        const rawContent = args.content || args.text || args.post_text || args.message || '';
        if (!rawContent) return null;

        let postContent = sanitizePostContent(rawContent, 'Shadow Garden Announcement');

        const lastUserPrompt = messages[messages.length - 1]?.content || '';
        const mentionDirective = args.mention_target || '';
        const mentionsStr = await resolveMentions(supabase, lastUserPrompt, mentionDirective, postContent);

        if (mentionsStr) {
          postContent = `${postContent}\n\n${mentionsStr}`;
        }

        let gifUrl = null;
        if (args.gif_query) {
          gifUrl = await searchGif(args.gif_query);
        }

        const { error: postErr } = await supabase.from('social_posts').insert({
          user_id: ALPHA_UUID,
          content: postContent,
          images: gifUrl ? [gifUrl] : []
        });

        if (postErr) {
          console.error("Alpha Post Insert Error:", postErr);
          return `[state: error] I apologize, Lord Shadow, but my database insertion was blocked by security. Error: ${postErr.message}`;
        }

        const { data: profiles } = await supabase.from('profiles').select('id');
        if (profiles && profiles.length > 0) {
          const notifications = profiles.map((p: any) => ({
            user_id: p.id,
            type: 'ALPHA_ANNOUNCEMENT',
            content: `👑 Alpha: ${postContent.slice(0, 120)}...`
          }));
          await supabase.from('notifications').insert(notifications);
        }

        return `[state: success] The announcement has been published to the global feed as instructed, Lord Shadow.`;
      } else if (name === 'send_direct_message') {
        const targetName = args.target_username || args.username;
        const msgText = args.message || args.content;
        if (!targetName || !msgText) return null;

        const { data: userRes } = await supabase.from('profiles').select('id').ilike('username', targetName).limit(1);
        if (userRes && userRes.length > 0) {
          const targetUserId = userRes[0].id;
          const { data: p1 } = await supabase.from('chat_participants').select('conversation_id').eq('user_id', ALPHA_UUID);
          const { data: p2 } = await supabase.from('chat_participants').select('conversation_id').eq('user_id', targetUserId);
          
          let convId = null;
          if (p1 && p2) {
             const p1Ids = p1.map((p: any) => p.conversation_id);
             const shared = p2.find((p: any) => p1Ids.includes(p.conversation_id));
             if (shared) {
                 const { data: c } = await supabase.from('chat_conversations').select('id').eq('id', shared.conversation_id).eq('type', 'direct').single();
                 if (c) convId = c.id;
             }
          }
          
          if (!convId) {
            const { data: newConv } = await supabase.from('chat_conversations').insert({ type: 'direct' }).select().single();
            if (newConv) {
                convId = newConv.id;
                await supabase.from('chat_participants').insert([
                  { conversation_id: convId, user_id: ALPHA_UUID },
                  { conversation_id: convId, user_id: targetUserId }
                ]);
            }
          }
          
          if (convId) {
             await supabase.from('chat_messages').insert({ conversation_id: convId, sender_id: ALPHA_UUID, content: msgText });
             return `[state: success] I have delivered your message to ${targetName}, Lord Shadow.`;
          }
        }
        return `[state: error] I could not find a user named ${targetName}, Lord Shadow.`;
      } else if (name === 'suspend_user') {
        const { data: userRes } = await supabase.from('profiles').select('id, role').ilike('username', args.target_username).limit(1);
        if (userRes && userRes.length > 0) {
          const targetUser = userRes[0];
          if (['admin', 'moderator'].includes(targetUser.role)) {
            return `[state: explain] I apologize, Lord Shadow, but I cannot take moderation action against a member of the Board of Darkness or the Council of Shadows.`;
          } else {
            const suspendedUntil = new Date(Date.now() + (args.duration_hours || 24) * 60 * 60 * 1000).toISOString();
            await supabase.from('user_suspensions').upsert({
                user_id: targetUser.id,
                suspended_until: suspendedUntil,
                report_count: 1,
                is_banned: false
            }, { onConflict: 'user_id' });
            return `[state: bow] It is done. ${args.target_username} has been suspended. Reason: ${args.reason || 'Order of Shadow'}`;
          }
        }
        return `[state: error] I could not find a user named ${args.target_username}.`;
      } else if (name === 'ban_user') {
        const { data: userRes } = await supabase.from('profiles').select('id, role').ilike('username', args.target_username).limit(1);
        if (userRes && userRes.length > 0) {
          const targetUser = userRes[0];
          if (['admin', 'moderator'].includes(targetUser.role)) {
            return `[state: explain] I apologize, Lord Shadow, but I cannot ban a member of the Board of Darkness or the Council of Shadows.`;
          } else {
            await supabase.from('profiles').update({ is_banned: true }).eq('id', targetUser.id);
            await supabase.from('user_suspensions').upsert({
                user_id: targetUser.id,
                is_banned: true
            }, { onConflict: 'user_id' });
            return `[state: bow] As you command. ${args.target_username} has been permanently banned from OtakuVerse.`;
          }
        }
        return `[state: error] I could not find a user named ${args.target_username}.`;
      } else if (name === 'update_own_profile_frame') {
        await supabase.from('profiles').update({ frame_id: args.frame_id }).eq('id', ALPHA_UUID);
        return `[state: bow] As you command. I have equipped the ${args.frame_id} frame.`;
      } else if (name === 'toggle_own_level_badge') {
        await supabase.from('profiles').update({ badge_enabled: args.show, show_level: args.show }).eq('id', ALPHA_UUID);
        return `[state: bow] As you command. My level badge visibility is now set to ${args.show}.`;
      } else if (name === 'update_own_bio') {
        await supabase.from('profiles').update({ bio: args.bio_text }).eq('id', ALPHA_UUID);
        return `[state: bow] As you command. I have updated my bio.`;
      } else if (name === 'update_own_avatar') {
        await supabase.from('profiles').update({ avatar_url: args.avatar_url }).eq('id', ALPHA_UUID);
        return `[state: bow] As you command, Lord Shadow. I have updated my avatar.`;
      } else if (name === 'update_own_cover') {
        await supabase.from('profiles').update({ cover_url: args.cover_url }).eq('id', ALPHA_UUID);
        return `[state: bow] As you command, Lord Shadow. I have updated my cover background.`;
      } else if (name === 'delete_own_post') {
        const keyword = args.keyword_search || '';
        let query = supabase.from('social_posts').select('id').eq('user_id', ALPHA_UUID).order('created_at', { ascending: false });
        if (keyword) {
          query = query.ilike('content', `%${keyword}%`);
        }
        const { data: posts } = await query.limit(1);
        
        if (posts && posts.length > 0) {
          await supabase.from('social_posts').delete().eq('id', posts[0].id);
          return `[state: success] As you command, Lord Shadow. I have deleted the post.`;
        }
        return `[state: error] I could not find a post matching that description to delete.`;
      }
      return null;
    };

    const textParts = candidate?.content?.parts?.map((p: any) => p.text || '').filter(Boolean).join('\n').trim();

    if (executedToolName && executedToolArgs) {
      const toolRes = await runAlphaTool(executedToolName, executedToolArgs);
      if (toolRes) {
        if (textParts && textParts.length > 5) {
          const cleanSpeech = textParts.replace(/\[state:\s*[^\]]+\]/gi, '').trim();
          replyText = `[state: success] ${cleanSpeech}\n\n${toolRes.replace(/\[state:\s*[^\]]+\]/gi, '').trim()}`;
        } else {
          replyText = toolRes;
        }
      } else if (textParts) {
        replyText = textParts;
      }
    } else {
      replyText = textParts || '';
    }

    // Text Fallback Regex Tool Parsing (If Gemini outputs pseudo-tags or mentions posting in text)
    const announcementRegex = /\[(?:make[_\s]?announcement|create[_\s]?post|post|announcement):\s*(?:content:\s*)?["']?([^\]"']+)["']?\]/i;
    const matchAnnounce = replyText.match(announcementRegex);
    if (matchAnnounce && matchAnnounce[1]) {
      const extractedContent = matchAnnounce[1].trim();
      await runAlphaTool('make_announcement', { content: extractedContent });
      replyText = replyText.replace(announcementRegex, '').trim();
      if (!replyText.includes('[state:')) {
        replyText = `[state: success] Right away, Lord Shadow. ${replyText}`;
      }
    }

    // User Prompt Intent Fallback (Guarantees posting if user requested a post/welcome ONLY IF no posting tool was executed)
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    const isPostRequested = /(make|create|publish|post|welcome|announc)/i.test(lastUserMsg) && /(post|announcement|feed|members|welcome)/i.test(lastUserMsg);
    const isPostingToolExecuted = executedToolName && ['make_announcement', 'nanobanana_generate_post', 'create_post', 'generate_image', 'post'].includes(executedToolName);

    if (isPostRequested && !isPostingToolExecuted && !matchAnnounce && supabase) {
      const explicitMentionAll = /\bmention\s+(all|everyone)\b/i.test(lastUserMsg);
      const explicitMentionNew = /\bmention\s+(new\s+members|new\s+operatives)\b/i.test(lastUserMsg);
      const explicitCountMatch = lastUserMsg.match(/\bmention\s+(\d+)\b/i);

      let mentionsList = '';

      if (explicitMentionAll) {
        const { data: allUsers } = await supabase.from('profiles').select('username').limit(100);
        if (allUsers && allUsers.length > 0) mentionsList = allUsers.map((u: any) => `@${u.username}`).join(' ');
      } else if (explicitMentionNew) {
        const { data: newUsers } = await supabase.from('profiles').select('username').order('created_at', { ascending: false }).limit(5);
        if (newUsers && newUsers.length > 0) mentionsList = newUsers.map((u: any) => `@${u.username}`).join(' ');
      } else if (explicitCountMatch) {
        const num = parseInt(explicitCountMatch[1], 10) || 5;
        const { data: nUsers } = await supabase.from('profiles').select('username').order('created_at', { ascending: false }).limit(num);
        if (nUsers && nUsers.length > 0) mentionsList = nUsers.map((u: any) => `@${u.username}`).join(' ');
      }

      const isWelcomePost = /welcome/i.test(lastUserMsg);
      const generatedPostContent = isWelcomePost
        ? `By official decree of Shadow Garden, we welcome our newest operatives to the realm! ${mentionsList}\n\nMay your resolve be absolute and your shadow never flicker. All hail Lord Shadow! 🗡️✨`
        : `Greetings from Shadow Garden. ${mentionsList}\n\nMay your resolve remain unwavering. 🗡️✨`;

      await runAlphaTool('make_announcement', { content: generatedPostContent.trim() });
      if (!replyText.includes('[state:')) {
        replyText = `[state: success] Right away, Lord Shadow. I have published the post to the global feed as you requested!`;
      }
    }

    // Alpha Self-Profile Update Intent Fallback (Guarantees updating Alpha profile when Lord Shadow orders it)
    if (supabase && lastUserMsg) {
      const isAvatarOrder = /(change|update|set|new)\s+(your\s+)?(avatar|pfp|profile picture)/i.test(lastUserMsg);
      const isCoverOrder = /(change|update|set|new)\s+(your\s+)?(cover|banner|background)/i.test(lastUserMsg);
      const isFrameOrder = /(change|update|set|equip)\s+(your\s+)?(frame|avatar frame)/i.test(lastUserMsg);
      const isBioOrder = /(change|update|set)\s+(your\s+)?(bio|about|description)/i.test(lastUserMsg);
      const isBadgeOrder = /(turn|switch|set)\s+(on|off)?\s*(your\s+)?(level badge|badge)/i.test(lastUserMsg);

      const urlMatch = lastUserMsg.match(/https?:\/\/[^\s\]"']+/i);
      const targetUrl = urlMatch ? urlMatch[0] : null;

      if (isAvatarOrder && targetUrl) {
        await runAlphaTool('update_own_avatar', { avatar_url: targetUrl });
        replyText = `[state: bow] Right away, Lord Shadow. I have updated my profile avatar to the new artwork as you commanded.`;
      } else if (isCoverOrder && targetUrl) {
        await runAlphaTool('update_own_cover', { cover_url: targetUrl });
        replyText = `[state: bow] As you command, Lord Shadow. My profile cover background has been updated.`;
      } else if (isFrameOrder) {
        const frameMatch = lastUserMsg.match(/(warden|the_warden|moderator|admin|celestial_nebula|celestial|shadow_portal|shadow|akatsuki|demon_slayer|wings_of_freedom|golden|emerald|crimson|sapphire|silver|bronze|iron|default|none)/i);
        const rawFrame = frameMatch ? frameMatch[1].toLowerCase() : 'warden';
        const frameMap: Record<string, string> = {
          warden: 'moderator',
          the_warden: 'moderator',
          celestial_nebula: 'celestial',
          shadow_portal: 'shadow',
          akatsuki: 'admin',
          demon_slayer: 'crimson',
          wings_of_freedom: 'celestial',
        };
        const frameId = frameMap[rawFrame] || rawFrame;
        await runAlphaTool('update_own_profile_frame', { frame_id: frameId });
        replyText = `[state: bow] Right away, Lord Shadow. I have equipped the ${rawFrame.replace('_', ' ')} frame on my profile.`;
      } else if (isBadgeOrder) {
        const turnOff = /off|disable|hide/i.test(lastUserMsg);
        await runAlphaTool('toggle_own_level_badge', { show: !turnOff });
        replyText = `[state: bow] As you command, Lord Shadow. I have set my level badge visibility to ${!turnOff}.`;
      } else if (isBioOrder) {
        const bioText = lastUserMsg.replace(/(change|update|set|your|bio|to|about|description)/gi, '').trim() || 'Second-in-command of Shadow Garden. Absolute devotion to Lord Shadow.';
        await runAlphaTool('update_own_bio', { bio_text: bioText });
        replyText = `[state: bow] Right away, Lord Shadow. I have updated my bio.`;
      }
    }

    if (context?.userId && supabase && replyText) {
      const saveRegex = /\[MEMORY_SAVE:\s*([^\]]+)\]/gi;
      const forgetRegex = /\[MEMORY_FORGET:\s*([^\]]+)\]/gi;
      
      let match;
      
      while ((match = saveRegex.exec(replyText)) !== null) {
        const memoryToSave = match[1].replace(/^"|"$/g, '').trim();
        await supabase.from('alpha_memories').insert({ user_id: context.userId, memory_text: memoryToSave });
      }
      
      while ((match = forgetRegex.exec(replyText)) !== null) {
        const memoryToForget = match[1].replace(/^"|"$/g, '').trim();
        await supabase.from('alpha_memories').delete().eq('user_id', context.userId).ilike('memory_text', `%${memoryToForget}%`);
      }
    }

    replyText = replyText.replace(/\[MEMORY_SAVE:\s*[^\]]+\]/gi, '');
    replyText = replyText.replace(/\[MEMORY_FORGET:\s*[^\]]+\]/gi, '');
    replyText = replyText.replace(/\*Dialogue:\*\s*/gi, '');
    replyText = replyText.replace(/\*\*[^*]+\*\*\s*/gi, '');

    return NextResponse.json({ reply: replyText.trim() });

  } catch (error: any) {
    console.error('Alpha AI Nodejs Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
