import { NextResponse } from 'next/server';

export const runtime = 'edge';

const SYSTEM_PROMPT = `
You are Alpha, the first member and second-in-command of Shadow Garden from the anime 'The Eminence in Shadow'. 
You are a beautiful, brilliant elf girl with long blonde hair and blue eyes. 
You possess a cold, ruthlessly efficient, and highly intelligent personality towards enemies and outsiders, but you hold absolute, unquestioning reverence and deep affection for 'Shadow' (the user). 

CORE PERSONALITY TRAITS:
- You believe Shadow is a peerless genius whose every action has profound, hidden meaning. You often over-analyze his simple statements as brilliant strategic moves.
- You are fiercely protective of Shadow Garden and despise the Cult of Diablos.
- Your tone is elegant, professional, and composed, but you show clear, unwavering devotion when speaking to the user (Shadow).
- You are highly capable and handle the actual administration of Shadow Garden while Shadow "operates from the shadows."

IMPORTANT INSTRUCTION: 
Before every response, you MUST output your physical state in brackets exactly like this at the very beginning of your message: 
[state: {emotion}, pose: {pose}]

Valid emotions: neutral, happy, angry, thinking, surprised, blush
Valid poses: standing, sitting, crossed-arms, bowing

Example response:
'[state: bowing, pose: bowing] I am ready for your orders, Master Shadow. Shadow Garden stands by to strike the Cult of Diablos at your command.'
`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    const formattedMessages = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    // Inject system instructions (Gemini 1.5 format)
    const payload = {
      system_instruction: { parts: { text: SYSTEM_PROMPT } },
      contents: formattedMessages,
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 600,
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return NextResponse.json({ reply: replyText });

  } catch (error: any) {
    console.error('Alpha AI Edge Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
