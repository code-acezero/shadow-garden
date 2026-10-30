import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CHAR_META: Record<string, { name: string; gender: string }> = {
  alpha: { name: 'Alpha', gender: 'Female' },
  hana: { name: 'Hana', gender: 'Female' },
  miku: { name: 'Miku', gender: 'Female' },
  nanami: { name: 'Nanami', gender: 'Female' },
  rei: { name: 'Rei', gender: 'Female' },
  sakura: { name: 'Sakura', gender: 'Female' },
  aila: { name: 'Aila', gender: 'Female' },
  alice: { name: 'Alice', gender: 'Female' },
  aoi: { name: 'Aoi', gender: 'Female' },
  ehon: { name: 'Ehon', gender: 'Male' },
  fern: { name: 'Fern', gender: 'Female' },
  gojo: { name: 'Gojo', gender: 'Male' },
  gojo2: { name: 'Gojo (Domain)', gender: 'Male' },
  light: { name: 'Light', gender: 'Male' },
  madara: { name: 'Madara', gender: 'Male' },
  minami: { name: 'Minami', gender: 'Female' },
  rizin: { name: 'Rizin', gender: 'Male' },
  shigeru: { name: 'Shigeru', gender: 'Male' },
  sofitia: { name: 'Sofitia', gender: 'Female' },
};

export async function GET() {
  const voicesDir = path.join(process.cwd(), 'public', 'voices');
  
  if (!fs.existsSync(voicesDir)) {
    return NextResponse.json({ staticVoices: [], error: "Directory not found" });
  }

  const staticVoices: any[] = [];
  const seen = new Set<string>();

  const scanDir = (dir: string, lang: string) => {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    items.forEach(item => {
      if (item.isDirectory()) {
        if (dir === voicesDir) scanDir(path.join(dir, item.name), item.name);
        else scanDir(path.join(dir, item.name), lang);
      } else if (item.name.endsWith('.mp3') || item.name.endsWith('.wav')) {
        let cleanName = item.name.replace(/\.[^/.]+$/, "");
        
        // Remove trailing language code if present (e.g. -jp)
        if (cleanName.endsWith(`-${lang}`)) {
            cleanName = cleanName.slice(0, -(lang.length + 1));
        }

        const parts = cleanName.split('-');
        const pack = parts[0].toLowerCase(); // "hana", "aila"
        const type = parts.slice(1).join('-'); // "greet-master"

        const eventTrigger = type.toUpperCase().replace(/-/g, '_');
        const uniqueKey = `${lang}-${pack}-${eventTrigger}`;

        if (!seen.has(uniqueKey)) {
          seen.add(uniqueKey);
          const meta = CHAR_META[pack] || { 
            name: pack.charAt(0).toUpperCase() + pack.slice(1), 
            gender: 'Unknown' 
          };

          staticVoices.push({
            id: `file-${lang}-${cleanName}`,
            name: meta.name,
            character: pack,
            language: lang,
            gender: meta.gender,
            event_trigger: eventTrigger,
            file_url: `/voices/${lang}/${pack}-${type}.mp3`,
            preview: `/voices/${lang}/${pack}-${type}.mp3`,
            source: 'FILE'
          });
        }
      }
    });
  };

  try {
    scanDir(voicesDir, 'en');
    return NextResponse.json({ staticVoices });
  } catch (error) {
    return NextResponse.json({ staticVoices: [] });
  }
}
