const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const API_KEY = process.env.FISH_AUDIO_API_KEY || '231edfbf8cfd47fa951d1b5bbb87dbfc';

// Character models
const MODELS = {
  fern: '1dac8f5fd50648388edfcb4ca6cfb378',
  alpha: '1a60cc7f4eff4664b2090c5ea7f2aa35',
  nanami: 'de2879fba3144cb3b56bb2b42d2a1816',
};

const CUES = [
  {
    start: '00:00:00.800',
    end: '00:00:05.000',
    model: 'fern',
    text: "Is it true? Does the sanctuary truly possess the lost knowledge of eternity?"
  },
  {
    start: '00:00:05.600',
    end: '00:00:11.200',
    model: 'alpha',
    text: "Indeed. Within the shadows of Kagemi, all ancient wisdom has been preserved. Watch closely."
  },
  {
    start: '00:00:11.800',
    end: '00:00:15.400',
    model: 'fern',
    text: "Incredible... The clarity of this realm is beyond anything I have witnessed!"
  },
  {
    start: '00:00:16.000',
    end: '00:00:19.600',
    model: 'alpha',
    text: "Calibrate your senses. The supreme journey begins now."
  }
];

async function generateTTS(modelId, text, outFile) {
  const payload = { text, format: "mp3", reference_id: modelId };
  const res = await fetch("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "model": "s2.1-pro-free"
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outFile, buf);
}

async function main() {
  const scratchDir = path.join(__dirname, '..', 'public', 'videos', 'temp');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  console.log('Generating audio cues for Omni Preview video...');
  const audioFiles = [];
  for (let i = 0; i < CUES.length; i++) {
    const cue = CUES[i];
    const file = path.join(scratchDir, `cue_${i}.mp3`);
    process.stdout.write(`Generating cue ${i + 1}... `);
    await generateTTS(MODELS[cue.model], cue.text, file);
    console.log('OK');
    audioFiles.push(file);
    await new Promise(r => setTimeout(r, 600));
  }

  // Create WebVTT file
  let vtt = `WEBVTT - Omni Calibration Subtitle Track\n\n`;
  CUES.forEach((cue, i) => {
    vtt += `${i + 1}\n${cue.start} --> ${cue.end}\n${cue.text}\n\n`;
  });
  const vttPath = path.join(__dirname, '..', 'public', 'videos', 'preview.vtt');
  fs.writeFileSync(vttPath, vtt);
  console.log(`Saved WebVTT subtitles to ${vttPath}`);

  // Create composite audio track using ffmpeg
  // Cue 0: 0.8s, Cue 1: 5.6s, Cue 2: 11.8s, Cue 3: 16.0s
  const outAudio = path.join(scratchDir, 'combined.wav');
  const filter = `[0:a]adelay=800|800[a0];[1:a]adelay=5600|5600[a1];[2:a]adelay=11800|11800[a2];[3:a]adelay=16000|16000[a3];[a0][a1][a2][a3]amix=inputs=4:dropout_transition=0:normalize=0[aout]`;
  
  const ffmpegCmd = `ffmpeg -y -i "${audioFiles[0]}" -i "${audioFiles[1]}" -i "${audioFiles[2]}" -i "${audioFiles[3]}" -filter_complex "${filter}" -map "[aout]" "${outAudio}"`;
  execSync(ffmpegCmd, { stdio: 'inherit' });

  // Now mux combined audio with video of demo.mp4 to make preview.mp4
  const demoVideo = path.join(__dirname, '..', 'public', 'videos', 'demo.mp4');
  const previewVideo = path.join(__dirname, '..', 'public', 'videos', 'preview.mp4');
  
  // Mix original ambient sound at 30% with dialogue at 100%
  const muxCmd = `ffmpeg -y -i "${demoVideo}" -i "${outAudio}" -filter_complex "[0:a]volume=0.25[bg];[1:a]volume=1.3[fg];[bg][fg]amix=inputs=2:duration=first[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest "${previewVideo}"`;
  execSync(muxCmd, { stdio: 'inherit' });

  console.log(`Successfully created ${previewVideo} with actual dialogue & sound!`);
  
  // Clean up scratch files
  fs.rmSync(scratchDir, { recursive: true, force: true });
}

main().catch(console.error);

