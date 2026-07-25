import { NextResponse } from 'next/server';

export const runtime = 'edge';

function prepareTextForSpeech(text: string) {
  // 1. Handle gaps/pauses by replacing newlines with ellipses BEFORE stripping
  // Fish Audio responds well to ellipses for pauses.
  let speechText = text.replace(/\n\n+/g, ' ... ... ... ');
  speechText = speechText.replace(/\n/g, ' ... ');

  // 2. Aggressively strip symbols so they aren't spoken out loud (like "dash", "asterisk")
  // Only keep alphanumeric, basic punctuation, and spaces
  speechText = speechText.replace(/[^a-zA-Z0-9\s.,!?'’…-]/g, ' ');

  // 3. Clean up excessive spaces
  speechText = speechText.replace(/\s+/g, ' ').trim();

  // 4. Add natural emotional cues (fillers) to guide the autoregressive model
  const parts = speechText.split(/([.!?]+)/);
  let processedText = '';
  
  const emotionKeywords = {
    happy: {
      words: ['happy', 'joy', 'love', 'amazing', 'wonderful', 'great', 'excellent', 'fantastic', 'haha', 'hehe', 'lol', 'yay', 'glad', 'smile', 'beautiful', 'perfect', 'delighted', 'pleased', 'thrilled', 'lord shadow', 'master shadow', 'master cid', 'shadow-sama', 'cid-sama', 'our master', 'his grace', 'as expected', 'perfection', 'magnificent'],
      fillers: ['Hehe! ', 'Ah, wonderful. ', 'Mhm! ']
    },
    sad: {
      words: ['sorry', 'sad', 'unfortunate', 'depressed', 'cry', 'hurt', 'broken', 'tragic', 'pity', 'apologize', 'grief', 'sorrow', 'mourn', 'pain', 'lonely', 'tear', 'regret', 'abandoned', 'failed', 'failure', 'disappointed him', 'before i met him', 'could not save', "couldn't save"],
      fillers: ['Sigh... ', 'Oh... ', '...I see... ']
    },
    angry: {
      words: ['hate', 'stupid', 'idiot', 'furious', 'angry', 'mad', 'hell', 'damn', 'curse', 'fool', 'useless', 'pathetic', 'ridiculous', 'rage', 'wrath', 'destroy', 'kill', 'eliminate', 'disgusting', 'filth', 'trash', 'cult of diablos', 'diablos cult', 'the cult', 'order of diablos', 'knight of rounds', 'enemy', 'target', 'eliminate the target', 'no mercy', 'shall perish', 'sinner', 'traitors'],
      fillers: ['Tch! ', 'Hmph! ', 'Silence! ', 'How dare you... ']
    },
    nervous: {
      words: ['maybe', 'perhaps', 'worried', 'anxious', 'nervous', 'hesitant', 'unsure', 'scared', 'fear', 'afraid', 'panic', 'did i misunderstand', 'have we failed', "shadow's true intent", "i don't understand", 'we must hurry', 'displeased'],
      fillers: ['Um... ', 'Uh... ', 'Ah... wait... ']
    },
    excited: {
      words: ['wow', 'omg', 'yes', 'incredible', 'exactly', 'absolutely', 'brilliant', 'genius', 'masterpiece', 'unbelievable', 'astonishing', 'marvelous', 'his master plan', 'the true plan', 'shadow garden', 'lurk in the shadows', 'awaken', 'true power', 'the world', 'our time has come', 'mitsugoshi'],
      fillers: ['Oh! ', 'Ah! ', 'Yes! ', 'Amazing! ']
    }
  };

  let usedFillers = 0; // limit fillers so it doesn't sound too crazy

  for (let i = 0; i < parts.length; i += 2) {
    const sentence = parts[i].trim();
    const punctuation = parts[i + 1] || '';
    
    if (sentence) {
      const lowerSentence = sentence.toLowerCase();
      let addedEmotion = false;
      
      // Inject at most 2 emotional fillers per message to keep it natural
      if (usedFillers < 2 && sentence.length > 10) {
        for (const [emotion, data] of Object.entries(emotionKeywords)) {
          if (data.words.some(word => lowerSentence.match(new RegExp(`\\b${word}\\b`, 'i')))) {
            const filler = data.fillers[Math.floor(Math.random() * data.fillers.length)];
            // Only prepend if the sentence doesn't already start with a similar short expression
            if (!/^(ah|oh|um|uh|mm|hehe|haha|sigh|tch|hmph|yes|no)/i.test(sentence)) {
               processedText += `${filler}`;
               usedFillers++;
            }
            addedEmotion = true;
            break;
          }
        }
        
        if (!addedEmotion && punctuation.includes('!') && usedFillers < 2) {
            if (!/^(ah|oh|um|uh|mm|hehe|haha|sigh|tch|hmph|yes|no)/i.test(sentence)) {
               processedText += `Oh! `;
               usedFillers++;
            }
        }
      }
      
      processedText += `${sentence}${punctuation} `;
    }
  }

  // Final cleanup: ensure we don't have weird spacing around punctuation
  processedText = processedText.replace(/\s+([.,!?])/g, '$1').trim();
  
  return processedText || speechText;
}

async function handleTTS(text: string) {
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  const apiKey = process.env.FISH_AUDIO_API_KEY;
  const voiceId = process.env.FISH_AUDIO_MODEL_ID;

  if (!apiKey) {
    console.warn("FISH_AUDIO_API_KEY is not configured");
    return NextResponse.json({ error: 'TTS API not configured' }, { status: 500 });
  }

  const processedText = prepareTextForSpeech(text);

  const payload = {
    text: processedText,
    format: "mp3",
    reference_id: voiceId || undefined,
  };

  const response = await fetch("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "model": "s2.1-pro-free"
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Fish Audio API Error: ${response.status} ${errorText}`);
    return NextResponse.json({ error: `Fish Audio API Error: ${response.status}` }, { status: response.status });
  }

  // Stream the response directly to the client
  return new NextResponse(response.body, {
    headers: {
      'Content-Type': 'audio/mpeg',
    },
  });
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    return await handleTTS(text);
  } catch (error: any) {
    console.error('TTS Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    return await handleTTS(text || '');
  } catch (error: any) {
    console.error('TTS Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
