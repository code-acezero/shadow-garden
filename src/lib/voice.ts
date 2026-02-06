import { createBrowserClient } from '@supabase/ssr';

// --- WHISPER HELPER ---
const notifyIsland = (title: string, message: string) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('shadow-whisper', {
            detail: { 
                id: Date.now(), 
                type: 'guild_notification', 
                title, 
                message 
            }
        }));
    }
};

const VOICE_SCRIPTS = {
    GREET_MASTER: "Welcome back, Master. The shadows await your command.",
    GREET_ADVENTURER: "Welcome back, Adventurer. It is good to see you again.",
    GREET_TRAVELER: "Greetings, Traveler. Do you wish to join our ranks today?",
    WELCOME: "Welcome to Shadow Garden. This is a sanctuary for those who seek the wisdom of anime. What brings you here today, traveler?",
    REGISTER: "Thanks for registering at shadow garden. Good luck with your adventurer journey.",
    BYE_MASTER: "See you again master, have a nice day.",
    BYE_ADVENTURER: "See you again adventurer, have a nice day."
};

export type VoiceEvent = keyof typeof VOICE_SCRIPTS;

interface VoicePreference {
    pack: string; // Character Name (e.g. 'Alpha')
    language: string;
    enabled: boolean;
}

export const getVoiceSettings = (): VoicePreference => {
    if (typeof window === 'undefined') return { pack: 'Alpha', language: 'en', enabled: true };
    const stored = localStorage.getItem('shadow_voice_settings');
    if (stored) return JSON.parse(stored);
    return { pack: 'Alpha', language: 'en', enabled: true };
};

// --- DYNAMIC CACHE ---
// Stores voice data fetched from Supabase to avoid repeated calls
let dynamicVoiceCache: any[] = [];

export const refreshVoiceCache = async () => {
    try {
        const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const { data } = await supabase.from('voice_packs').select('*');
        if (data) dynamicVoiceCache = data;
    } catch (e) {
        console.warn("Failed to refresh voice cache", e);
    }
};

export const playVoice = (event: VoiceEvent) => {
    const settings = getVoiceSettings();
    const scriptText = VOICE_SCRIPTS[event];
    
    // 1. Visual Notification
    if (scriptText) {
        let title = settings.pack || "Guild Receptionist";
        if (event.includes('MASTER')) title = "Guild Receptionist";
        notifyIsland(title, scriptText);
    }

    if (!settings.enabled) return;

    // 2. Determine Audio Source
    let fileUrl = '';
    
    // Attempt to find in Dynamic Cache (DB)
    // Assumes DB has columns: character, language, event_trigger, file_url
    const dynamicMatch = dynamicVoiceCache.find(v => 
        v.character === settings.pack && 
        v.language === settings.language &&
        v.event_trigger === event
    );

    if (dynamicMatch) {
        fileUrl = dynamicMatch.file_url;
    } else {
        // Fallback to Local System
        let action = "";
        switch (event) {
            case 'WELCOME': action = "welcome"; break;
            case 'REGISTER': action = "register"; break;
            case 'GREET_MASTER': action = "greet-master"; break;
            case 'GREET_ADVENTURER': action = "greet-adventurer"; break;
            case 'GREET_TRAVELER': action = "greet-traveler"; break;
            case 'BYE_MASTER': action = "bye-master"; break;
            case 'BYE_ADVENTURER': action = "bye-adventurer"; break;
        }
        
        // Normalize for file system
        let packName = settings.pack.toLowerCase();
        if (packName.startsWith('system-')) packName = packName.replace('system-', '');
        
        // Construct Path
        // e.g. /audio/alpha_welcome.mp3 OR /voices/en/hana-welcome.mp3
        if (['alpha', 'beta', 'shadow', 'delta', 'zeta'].includes(packName)) {
             // Legacy Static paths
             const suffix = settings.language === 'jp' ? '_jp' : '';
             fileUrl = `/audio/${packName}${suffix}_${action}.mp3`;
        } else {
             // Standard dynamic structure
             fileUrl = `/voices/${settings.language}/${packName}-${action}.mp3`;
        }
    }

    // 3. Play
    if (fileUrl) {
        console.log(`🔊 [ShadowVoice] Playing: ${fileUrl}`);
        const audio = new Audio(fileUrl);
        audio.volume = 1.0; 
        audio.play().catch(e => console.warn("Autoplay blocked/missing:", e));
    }
};

export const syncVoiceProfile = async (userId: string) => {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const localSettings = getVoiceSettings();
    if (supabase) {
        await supabase.from('profiles').update({ voice_pack: localSettings.pack }).eq('id', userId);
    }
};

export const loadVoiceProfile = async (userId: string) => {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    if (!supabase) return;
    const { data } = await supabase.from('profiles').select('voice_pack').eq('id', userId).single();
    if (data && data.voice_pack) {
        const current = getVoiceSettings();
        const newSettings = { ...current, pack: data.voice_pack };
        if (typeof window !== 'undefined') {
            localStorage.setItem('shadow_voice_settings', JSON.stringify(newSettings));
        }
    }
    // Refresh cache on load to ensure we have the latest DB links
    refreshVoiceCache();
};