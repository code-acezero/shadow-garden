import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  // Target the public/voices directory shown in your VS Code
  const voicesDir = path.join(process.cwd(), 'public', 'voices');
  
  if (!fs.existsSync(voicesDir)) {
    return NextResponse.json({ staticVoices: [], error: "Directory not found" });
  }

  const staticVoices: any[] = [];

  // Recursive scan function
  const scanDir = (dir: string, lang: string) => {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    items.forEach(item => {
      if (item.isDirectory()) {
        // If scanning root (public/voices), the folder is the language (en, jp)
        if (dir === voicesDir) scanDir(path.join(dir, item.name), item.name);
        else scanDir(path.join(dir, item.name), lang);
      } else if (item.name.endsWith('.mp3') || item.name.endsWith('.wav')) {
        // Parse: "hana-greet-master.mp3" or "aila-greet-master-jp.mp3"
        // We strip the extension first
        let cleanName = item.name.replace(/\.[^/.]+$/, "");
        
        // Remove trailing language code if present (e.g. -jp)
        if (cleanName.endsWith(`-${lang}`)) {
            cleanName = cleanName.slice(0, -(lang.length + 1));
        }

        // Split pack name and type
        const parts = cleanName.split('-');
        const pack = parts[0]; // "hana", "aila"
        const type = parts.slice(1).join('-'); // "greet-master"

        staticVoices.push({
          id: `file-${lang}-${cleanName}`,
          character: pack, // Standardized key for UI
          language: lang,
          event_trigger: type.toUpperCase(),
          file_url: `/voices/${lang}/${item.name}`,
          source: 'FILE'
        });
      }
    });
  };

  try {
    scanDir(voicesDir, 'en'); // Default start
    return NextResponse.json({ staticVoices });
  } catch (error) {
    return NextResponse.json({ staticVoices: [] });
  }
}