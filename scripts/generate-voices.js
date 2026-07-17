const fs = require('fs');
const path = require('path');
const https = require('https');

// --- 1. CONFIGURATION ---
// PASTE YOUR FRIEND'S KEY HERE
const API_KEY = "sk_b89a9df42275166f5d6d7d51fcd0069a10c0a79952f23e6e"; 

// The Anime Voice Roster (Standard ElevenLabs IDs)
const VOICES = {
    hina:    { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Hina" },    // Mimi (Anime Girl)
    ritsuto: { id: "ErXwobaYiN019PkySvjV", name: "Ritsuto" }, // Antoni (Butler)
    yuki:    { id: "piTKgcLEGmPE4e6mEKli", name: "Yuki" },    // Nicole (Soft Whisper)
    sakuya:  { id: "z9fAny0nU8X9L57sLVZZ", name: "Sakuya" },  // Glinda (Mature)
    veteran: { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Veteran" }, // Liam (Gritty)
    hero:    { id: "D38z5RcWu1voky8WSVqt", name: "Hero" },    // Fin (Energetic)
    saware:  { id: "pqHfZKP75CvOlQylNhV4", name: "Saware" }   // Bill (Guest Guide)
};

// --- 2. THE IMMERSIVE SCRIPTS ---
const SCRIPTS = {
    // 👑 For Admins & Moderators
    welcome_master: "Welcome back, Master. The shadows await your command.",
    
    // ⚔️ For Registered Users
    welcome_adventurer: "Welcome back, Adventurer. It is good to see you again.",
    
    // 🎒 For Returning Guests
    welcome_traveler: "Greetings, Traveler. Do you wish to join our ranks today?",

    // 🌟 Special First Time Intro (Saware Only)
    first_visit: "Welcome to Shadow Garden. This is a sanctuary for those who seek knowledge. Proceed with caution."
};

const OUTPUT_DIR = path.join(__dirname, '../public/voices');

// --- 3. GENERATOR ENGINE ---
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generate(voiceKey, type, text) {
    const voice = VOICES[voiceKey];
    const fileName = `${voiceKey}_${type}.mp3`;
    const filePath = path.join(OUTPUT_DIR, fileName);

    if (fs.existsSync(filePath)) {
        console.log(`⏩ Skipping ${fileName} (Exists)`);
        return;
    }

    console.log(`🎙️ Generating ${fileName} (${voice.name})...`);

    const options = {
        hostname: 'api.elevenlabs.io',
        path: `/v1/text-to-speech/${voice.id}`,
        method: 'POST',
        headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': API_KEY
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            if (res.statusCode !== 200) {
                console.error(`❌ Error ${res.statusCode} on ${fileName}`);
                res.resume();
                return resolve(); // Skip to next
            }

            const fileStream = fs.createWriteStream(filePath);
            res.pipe(fileStream);
            
            fileStream.on('finish', () => {
                fileStream.close();
                console.log(`✅ Saved ${fileName}`);
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`Req Error: ${e.message}`);
            reject(e);
        });

        req.write(JSON.stringify({
            text: text,
            model_id: "eleven_turbo_v2_5",
            voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.2 }
        }));
        req.end();
    });
}

async function run() {
    console.log("--- STARTING GENERATION ---");
    
    // 1. Special Intro
    await generate('saware', 'first_visit', SCRIPTS.first_visit);

    // 2. Loop through all characters
    for (const [key, voice] of Object.entries(VOICES)) {
        if (key === 'saware') continue; 
        
        await generate(key, 'welcome_master', SCRIPTS.welcome_master);
        await generate(key, 'welcome_adventurer', SCRIPTS.welcome_adventurer);
        await generate(key, 'welcome_traveler', SCRIPTS.welcome_traveler);
    }

    console.log("\n✨ Voice Pack Complete! Check /public/voices folder.");
}

run();