import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CHAR_META: Record<string, { name: string; gender: string }> = {
  alpha: { name: 'Alpha', gender: 'Female' },
  gojo: { name: 'Satoru Gojo', gender: 'Male' },
  nanami: { name: 'Kento Nanami', gender: 'Male' },
  sukuna: { name: 'Ryomen Sukuna', gender: 'Male' },
  levi: { name: 'Levi Ackerman', gender: 'Male' },
  zoro: { name: 'Roronoa Zoro', gender: 'Male' },
  makima: { name: 'Makima', gender: 'Female' },
  rem: { name: 'Rem', gender: 'Female' },
  alice: { name: 'Alice Zuberg', gender: 'Female' },
  madara: { name: 'Madara Uchiha', gender: 'Male' },
  fern: { name: 'Fern', gender: 'Female' },
  light: { name: 'Light Yagami', gender: 'Male' },
  miku: { name: 'Hatsune Miku', gender: 'Female' },
  rei: { name: 'Rei Ayanami', gender: 'Female' },
  sakura: { name: 'Sakura Haruno', gender: 'Female' },
  hana: { name: 'Hana', gender: 'Female' }
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
        const pack = parts[0].toLowerCase();
        const type = parts.slice(1).join('-');

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
            file_url: `/voices/${lang}/${item.name}`,
            preview: `/voices/${lang}/${item.name}`,
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
