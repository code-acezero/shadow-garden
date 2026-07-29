import { NextResponse } from 'next/server';

function prepareTextForSpeech(text: string) {
  // 1. Handle gaps/pauses by replacing newlines with ellipses BEFORE stripping
  let speechText = text.replace(/\n\n+/g, ' ... ... ... ');
  speechText = speechText.replace(/\n/g, ' ... ');

  // 2. Aggressively strip symbols so they aren't spoken out loud (like "dash", "asterisk")
  speechText = speechText.replace(/[^a-zA-Z0-9\s.,!?'’…-]/g, ' ');

  // 3. Clean up excessive spaces
  speechText = speechText.replace(/\s+/g, ' ').trim();

  // 4. Clean up spacing around punctuation
  speechText = speechText.replace(/\s+([.,!?])/g, '$1').trim();
  
  return speechText;
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
