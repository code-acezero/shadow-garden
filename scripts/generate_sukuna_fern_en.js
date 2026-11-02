const fs = require('fs');
const path = require('path');

const API_KEY = process.env.FISH_AUDIO_API_KEY || '231edfbf8cfd47fa951d1b5bbb87dbfc';

// Japanese models to generate authentic English speech
const MODELS = {
  sukuna: 'eb277e741a714d92b8ba0a6ca29f08bc', // Japanese Ryomen Sukuna (Jujutsu Kaisen)
  fern: '1dac8f5fd50648388edfcb4ca6cfb378'     // Japanese Fern (Frieren)
};

const SCRIPTS = {
  sukuna: {
    'greet-master': "You return, brat. Do not presume your presence pleases me... entertain me instead.",
    'greet-adventurer': "Crawling back already? Let us see if you have grown strong enough to stand before me.",
    'greet-traveler': "Who permitted a worm like you to step into my domain? State your purpose.",
    'welcome': "Welcome to Kagemi... Bow your head before the King of Curses, and revel in pure dominance.",
    'register': "You have inscribed your name into this realm. Pray you never bore me.",
    'bye-master': "Begone from my sight. Next time you appear, bring something worth my time.",
    'bye-adventurer': "Scatter into the wind. Do not dare to fall before I choose to crush you."
  },
  fern: {
    'greet-master': "Welcome back, Master. I have kept the records organized in your absence.",
    'greet-adventurer': "Welcome back. Did you find any useful grimoires during your journey?",
    'greet-traveler': "Hello. If you need assistance with magic, I can help you find what you need.",
    'welcome': "Welcome to Kagemi. It is a quiet, comfortable place to study and enjoy anime.",
    'register': "Thank you for registering. Let us take things steadily, one step at a time.",
    'bye-master': "Goodbye, Master. Please be careful on your travels, and stay warm.",
    'bye-adventurer': "Take care. Remember to rest properly between journeys."
  }
};

async function generateTTS(modelId, text, outputPath) {
  const payload = {
    text: text,
    format: "mp3",
    reference_id: modelId,
  };

  const response = await fetch("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "model": "s2.1-pro-free"
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TTS Error ${response.status}: ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
  return arrayBuffer.byteLength;
}

async function main() {
  const outDir = path.join(__dirname, '..', 'public', 'voices', 'en');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('Generating English voice lines for Sukuna & Fern using their authentic Japanese voice models...');

  for (const [charKey, modelId] of Object.entries(MODELS)) {
    console.log(`\n=== Processing [${charKey}] with JP model: ${modelId} ===`);
    const charScripts = SCRIPTS[charKey];

    for (const [action, text] of Object.entries(charScripts)) {
      const fileName = `${charKey}-${action}.mp3`;
      const filePath = path.join(outDir, fileName);
      process.stdout.write(`Generating ${fileName}... `);
      try {
        const bytes = await generateTTS(modelId, text, filePath);
        console.log(`OK (${bytes} bytes)`);
      } catch (err) {
        console.error(`FAILED: ${err.message}`);
      }
      // Brief pause between requests to prevent rate limit
      await new Promise(r => setTimeout(r, 600));
    }
  }

  console.log('\nAll Sukuna & Fern English voice lines generated successfully!');
}

main().catch(console.error);

