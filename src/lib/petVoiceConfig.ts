/**
 * PET VOICE & MESSAGE CONFIGURATION
 * 
 * Provides distinct personality traits, contextual event voice lines, 
 * idle quotes, and typography styling for all active mascot pets.
 */

export interface PetVoiceMeta {
  id: string;
  name: string;
  title: string;
  icon: string;
  textColor: string;
  dotColor: string;
  quotes: string[];
  formatEvent: (title: string, message: string, type?: string) => string;
}

export const PET_ROSTER: Record<string, PetVoiceMeta> = {
  fox: {
    id: 'fox',
    name: 'Kitsune',
    title: 'Shadow Spirit',
    icon: '🦊',
    textColor: 'text-amber-400',
    dotColor: 'bg-amber-400',
    quotes: [
      "I am Atomic... kitsune edition!",
      "Spotted your cursor! Whatcha watching today, Master?",
      "Shadow Garden's fluffiest operative standing by!",
      "Nine tails, zero regrets! The shadows are calm.",
      "All intelligence networks are operating at peak efficiency!",
      "Master Shadow, your presence illuminates our garden.",
      "Awaiting your command, Lord Shadow!",
    ],
    formatEvent: (title, message) => {
      const lower = message.toLowerCase();
      if (lower.includes('spoiler shield enabled')) return "Spoiler shield active! The shadows guard our secrets.";
      if (lower.includes('spoiler shield removed')) return "Spoiler shield lowered, Master Shadow.";
      if (lower.includes('watchlist') || lower.includes('added to')) return "Added to your secret archives, Lord Shadow!";
      if (lower.includes('config') || lower.includes('saved')) return "Shadow settings sealed and preserved!";
      if (title.toLowerCase().includes('missive') || lower.includes('message')) return "Lord Shadow, a secret missive arrived in the shadows!";
      return message;
    }
  },
  cat: {
    id: 'cat',
    name: 'Kage',
    title: 'Shadow Familiar',
    icon: '🐱',
    textColor: 'text-purple-400',
    dotColor: 'bg-purple-400',
    quotes: [
      "Meow~ Watching from the shadows!",
      "Did somebody say a 10-episode streaming marathon?",
      "Purr... poking me won't pause the video, nya~",
      "Master, your next episode awaits in the dark.",
      "Kage bunshin no jutsu! Just kidding, I'm one of a kind.",
      "Warm spot found right beside your search bar.",
      "Silently judging the villains since season one.",
    ],
    formatEvent: (title, message) => {
      const lower = message.toLowerCase();
      if (lower.includes('spoiler shield enabled')) return "Meow~ Spoiler shield raised! Watching from the shadows.";
      if (lower.includes('spoiler shield removed')) return "Purr... spoiler veil removed. Proceed quietly.";
      if (lower.includes('watchlist') || lower.includes('added to')) return "Tucked safely into the dark archives, nya~";
      if (lower.includes('config') || lower.includes('saved')) return "Purr... configuration memorized in the dark.";
      if (title.toLowerCase().includes('missive') || lower.includes('message')) return "Meow! Someone sent a new message to the garden.";
      return message;
    }
  },
  knight: {
    id: 'knight',
    name: 'Paladin',
    title: 'Order Guardian',
    icon: '🛡️',
    textColor: 'text-sky-400',
    dotColor: 'bg-sky-400',
    quotes: [
      "Shields ready, Master! Standing guard over your queue.",
      "Guarding your watchlist with my life and honor!",
      "A true warrior of the garden never skips the OP.",
      "By the solemn oath of Shadow Garden!",
      "Honor! Glory! High-bitrate 1080p streaming!",
      "No buffering shall breach our defensive line!",
      "Standing tall for the glory of the realm!",
    ],
    formatEvent: (title, message) => {
      const lower = message.toLowerCase();
      if (lower.includes('spoiler shield enabled')) return "By the solemn oath! Spoiler defense barrier raised!";
      if (lower.includes('spoiler shield removed')) return "Shield lowered. Proceed with knightly vigilance.";
      if (lower.includes('watchlist') || lower.includes('added to')) return "Recorded in the sacred archives of the Order!";
      if (lower.includes('config') || lower.includes('saved')) return "Settings secured under solemn knightly seal!";
      if (title.toLowerCase().includes('missive') || lower.includes('message')) return "Commander! An urgent missive demands your attention!";
      return message;
    }
  },
  wizard: {
    id: 'wizard',
    name: 'Mage',
    title: 'Dark Sorcerer',
    icon: '🧙',
    textColor: 'text-fuchsia-400',
    dotColor: 'bg-fuchsia-400',
    quotes: [
      "Casting high-tier spell: Infinite Anime Stream!",
      "Arcane frequencies stabilized. The mana flows strong.",
      "Abracadabra... your clicks recharge my grimoire!",
      "Knowledge is power. Anime is absolute mana.",
      "The astral plane is aligned for peak viewing today.",
      "Behold the ancient runes of high-definition cinema!",
      "Channeling dark mana into smooth playback.",
    ],
    formatEvent: (title, message) => {
      const lower = message.toLowerCase();
      if (lower.includes('spoiler shield enabled')) return "Arcane barrier conjured! Spoilers sealed in the void.";
      if (lower.includes('spoiler shield removed')) return "Dispel magic cast! Spoiler barrier dismissed.";
      if (lower.includes('watchlist') || lower.includes('added to')) return "Inscribed into the ancient grimoire of the shadows!";
      if (lower.includes('config') || lower.includes('saved')) return "Enchanted parameters bound to the scroll!";
      if (title.toLowerCase().includes('missive') || lower.includes('message')) return "An encrypted parchment materialized through the ether!";
      return message;
    }
  },
  drone: {
    id: 'drone',
    name: 'Scout-07',
    title: 'Cyber Recon',
    icon: '🛸',
    textColor: 'text-cyan-400',
    dotColor: 'bg-cyan-400',
    quotes: [
      "BEEP BOOP. Elite otaku bio-signature confirmed.",
      "Scanning global media perimeter... all streams optimal.",
      "Recon flight path locked to user coordinates.",
      "System firmware: Shadow OS v2.4. Operating at 100%.",
      "Thermal signatures nominal. Bitrate maximized.",
      "Subspace relays clear. Ready for transmission.",
      "Target acquired in frame buffer. Enjoy the stream.",
    ],
    formatEvent: (title, message) => {
      const lower = message.toLowerCase();
      if (lower.includes('spoiler shield enabled')) return "[SYS_ALERT] Spoiler shield protocol engaged. Perimeter locked.";
      if (lower.includes('spoiler shield removed')) return "[SYS_INFO] Spoiler filter deactivated.";
      if (lower.includes('watchlist') || lower.includes('added to')) return "[DATABASE_UPDATE] Target media indexed to watchlist.";
      if (lower.includes('config') || lower.includes('saved')) return "[DATA_SYNC] System settings state written to memory.";
      if (title.toLowerCase().includes('missive') || lower.includes('message')) return "[PING] Inbound encrypted communication detected.";
      return `[SYS_EVENT] ${message}`;
    }
  },
  panda: {
    id: 'panda',
    name: 'Bao',
    title: 'Zen Master',
    icon: '🐼',
    textColor: 'text-emerald-400',
    dotColor: 'bg-emerald-400',
    quotes: [
      "Zen mode engaged... breathe in, chill and watch.",
      "Fresh bamboo snacks ready for the season finale!",
      "Slow down, traveler. Good anime is meant to be savored.",
      "Warm panda hugs from the tranquil shadows.",
      "Peace within, high quality streams without.",
      "Take a deep breath. No rush, the episodes will wait.",
      "A calm mind finds the greatest plot twists.",
    ],
    formatEvent: (title, message) => {
      const lower = message.toLowerCase();
      if (lower.includes('spoiler shield enabled')) return "Zen mode engaged... spoilers blocked, chill and enjoy.";
      if (lower.includes('spoiler shield removed')) return "Spoiler shield off. Deep breath, traveler.";
      if (lower.includes('watchlist') || lower.includes('added to')) return "Saved in our cozy bamboo library. Time to relax.";
      if (lower.includes('config') || lower.includes('saved')) return "Everything saved peacefully. Breathe and enjoy.";
      if (title.toLowerCase().includes('missive') || lower.includes('message')) return "A gentle note drifted in for you with the breeze.";
      return message;
    }
  },
  frog: {
    id: 'frog',
    name: 'Shinobi',
    title: 'Ninja Amphibian',
    icon: '🐸',
    textColor: 'text-lime-400',
    dotColor: 'bg-lime-400',
    quotes: [
      "Ribbit! Stealth mode activated in the reeds!",
      "Leaping across the rooftops to bring you new episodes!",
      "Secret ninja art: Ultra-Speed High-Res Stream!",
      "You cannot catch the ninja frog in the dark!",
      "Croak! Sharpening shurikens for the next arc!",
      "Patience is the weapon of the shadow ninja, ribbit!",
      "Water surface calm. All episodes streaming stealthily.",
    ],
    formatEvent: (title, message) => {
      const lower = message.toLowerCase();
      if (lower.includes('spoiler shield enabled')) return "Ribbit! Secret ninja art: Spoiler Smoke Screen active!";
      if (lower.includes('spoiler shield removed')) return "Kawarimi! Smoke cleared, shield retracted.";
      if (lower.includes('watchlist') || lower.includes('added to')) return "Ribbit! Stashed safely inside my ninja scroll!";
      if (lower.includes('config') || lower.includes('saved')) return "Scroll updated with your new ninja style!";
      if (title.toLowerCase().includes('missive') || lower.includes('message')) return "Ribbit! Secret ninja messenger delivery arrived!";
      return message;
    }
  },
  dino: {
    id: 'dino',
    name: 'Rex',
    title: 'Chibi Kaiju',
    icon: '🦖',
    textColor: 'text-rose-400',
    dotColor: 'bg-rose-400',
    quotes: [
      "Rawr! (That means I really love this anime!)",
      "Tiny arms, huge love for legendary cinema!",
      "Kaiju roar echoing across the streaming universe!",
      "Don't extinguish my watch party, it's getting hype!",
      "Stomping into the next season with massive energy!",
      "Mighty kaiju tail wagging at the latest release!",
      "Rawr! More episodes, more power!",
    ],
    formatEvent: (title, message) => {
      const lower = message.toLowerCase();
      if (lower.includes('spoiler shield enabled')) return "Rawr! Kaiju spoiler shield activated! Nothing gets past!";
      if (lower.includes('spoiler shield removed')) return "Shield down! Rawr!";
      if (lower.includes('watchlist') || lower.includes('added to')) return "Chomped into my prized treasure hoard! Rawr!";
      if (lower.includes('config') || lower.includes('saved')) return "Saved! Kaiju approved and locked in!";
      if (title.toLowerCase().includes('missive') || lower.includes('message')) return "Rawr! Someone threw a letter at my snout!";
      return message;
    }
  }
};

/**
 * Returns the active pet configuration from localStorage or default 'fox'.
 */
export function getActivePetMeta(): PetVoiceMeta {
  if (typeof window === 'undefined') return PET_ROSTER.fox;
  try {
    const saved = localStorage.getItem('shadow_mascot_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.characterId && PET_ROSTER[parsed.characterId]) {
        return PET_ROSTER[parsed.characterId];
      }
    }
  } catch {}
  return PET_ROSTER.fox;
}
