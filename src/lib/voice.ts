import { createBrowserClient } from '@supabase/ssr';

// ✅ HELPER: Trigger Whisper Island Notification
const notifyIsland = (title: string, message: string) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('shadow-whisper', {
            detail: { 
                id: Date.now(), 
                type: 'system', // Use 'system' for that nice red/black styling
                title, 
                message 
            }
        }));
    }
};

// --- 1. THE SCRIPTS ---
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
    pack: string;
    language: 'en' | 'jp' | string;
    enabled: boolean;
}

// --- 2. SETTINGS MANAGER ---
export const getVoiceSettings = (): VoicePreference => {
    if (typeof window === 'undefined') return { pack: 'hana', language: 'en', enabled: true };
    const stored = localStorage.getItem('shadow_voice_settings');
    if (stored) return JSON.parse(stored);
    return { pack: 'hana', language: 'en', enabled: true };
};

// --- 3. THE PLAYER ---
export const playVoice = (event: VoiceEvent) => {
    const settings = getVoiceSettings();
    const scriptText = VOICE_SCRIPTS[event];
    
    // ✅ SEND TO WHISPER ISLAND
    if (scriptText) {
        let title = "Guild Receptionist";
        if (event.includes('MASTER')) title = "Shadow Garden";
        
        notifyIsland(title, scriptText);
    }

    if (!settings.enabled) return;

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

    const suffix = settings.language === 'jp' ? '-jp' : '';
    const basePath = `/voices/${settings.language}`; 
    const fileUrl = `${basePath}/${settings.pack}-${action}${suffix}.mp3`;

    console.log(`🔊 [ShadowVoice] Playing: ${fileUrl}`);
    const audio = new Audio(fileUrl);
    
    // ✅ INCREASED VOLUME TO MAX (Was 0.6)
    audio.volume = 1.0; 
    
    audio.play().catch(e => console.warn("Autoplay blocked."));
};

// --- 4. BACKWARD COMPATIBILITY ---
export const speakGuild = (text: string, userProfile?: any, eventType?: string) => {
    if (eventType === 'WELCOME') return playVoice('WELCOME');
    if (eventType === 'GUEST') return playVoice('GREET_TRAVELER');
    
    if (eventType === 'REGISTERED' || (!eventType && userProfile)) {
        const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'owner';
        return playVoice(isAdmin ? 'GREET_MASTER' : 'GREET_ADVENTURER');
    }
    
    if (eventType === 'GOODBYE') {
        const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'owner';
        return playVoice(isAdmin ? 'BYE_MASTER' : 'BYE_ADVENTURER');
    }
    
    if (text) notifyIsland("Guild Message", text);
};

// --- 5. DB SYNC UTILS ---
const createClient = () => {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export const syncVoiceProfile = async (userId: string) => {
    const supabase = createClient();
    const localSettings = getVoiceSettings();
    if (supabase) {
        await supabase.from('profiles').update({ voice_pack: localSettings.pack }).eq('id', userId);
    }
};

export const loadVoiceProfile = async (userId: string) => {
    const supabase = createClient();
    if (!supabase) return;
    const { data } = await supabase.from('profiles').select('voice_pack').eq('id', userId).single();
    if (data) {
        const current = getVoiceSettings();
        const newSettings = { ...current, pack: data.voice_pack || 'hana' };
        if (typeof window !== 'undefined') {
            localStorage.setItem('shadow_voice_settings', JSON.stringify(newSettings));
        }
    }
};