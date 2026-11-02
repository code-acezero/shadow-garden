const fs = require('fs');
const path = require('path');

const API_KEY = process.env.FISH_AUDIO_API_KEY || '231edfbf8cfd47fa951d1b5bbb87dbfc';
const ALPHA_MODEL = '1a60cc7f4eff4664b2090c5ea7f2aa35';

const EN_LINES = {
  'alpha-greet-master.mp3': "Welcome back, adventurer. All seven shades remain poised at your command.",
  'alpha-greet-adventurer.mp3': "Welcome back, adventurer. The Shadow Garden honors your continued dedication.",
  'alpha-greet-traveler.mp3': "Greetings, traveler. If you seek the wisdom of our realm, let us guide your steps.",
  'alpha-welcome.mp3': "Welcome to Kagemi Sanctuary. Here, wisdom and power lurk beneath the surface. Walk carefully.",
  'alpha-register.mp3': "Your covenant with Shadow Garden is sealed. Let no one stand in your path.",
  'alpha-bye-master.mp3': "Until our next encounter, adventurer. May the shadows guide your path.",
  'alpha-bye-adventurer.mp3': "Farewell, adventurer. May the shadows guide and protect your steps."
};

const JP_LINES = {
  'alpha-greet-master.mp3': "おかえりなさいませ、冒険者。七陰は常に貴方のご命令に従います。",
  'alpha-greet-adventurer.mp3': "おかえり、冒険者。シャドウガーデンはお前の忠誠を認めているわ。",
  'alpha-greet-traveler.mp3': "ようこそ、旅人よ。我らの聖域で何を求めるのかしら？",
  'alpha-welcome.mp3': "カゲミへようこそ。ここは知恵と力が集う聖域。足元には気をつけて。",
  'alpha-register.mp3': "カゲミへの誓約、確認したわ。これよりお前も陰の盟友よ。",
  'alpha-bye-master.mp3': "またお会いできる時まで、冒険者。陰より見守っております。",
  'alpha-bye-adventurer.mp3': "また会いましょう、冒険者。影があなたの歩みを守らんことを。"
};

async function generateTTS(text, outputPath) {
  const payload = {
    text: text,
    format: "mp3",
    reference_id: ALPHA_MODEL,
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

async function run() {
  console.log('Generating updated Alpha voice lines (addressing adventurers/travelers)...');
  
  const enDir = path.join(__dirname, '..', 'public', 'voices', 'en');
  for (const [file, text] of Object.entries(EN_LINES)) {
    process.stdout.write(`Generating EN ${file}... `);
    try {
      const bytes = await generateTTS(text, path.join(enDir, file));
      console.log(`OK (${bytes} bytes)`);
    } catch (e) {
      console.error(`FAILED: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 600));
  }

  const jpDir = path.join(__dirname, '..', 'public', 'voices', 'jp');
  for (const [file, text] of Object.entries(JP_LINES)) {
    process.stdout.write(`Generating JP ${file}... `);
    try {
      const bytes = await generateTTS(text, path.join(jpDir, file));
      console.log(`OK (${bytes} bytes)`);
    } catch (e) {
      console.error(`FAILED: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 600));
  }

  console.log('Alpha voice generation complete.');
}

run().catch(console.error);

