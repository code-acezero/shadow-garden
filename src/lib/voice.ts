import { supabase } from '@/lib/supabase';

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
    WELCOME: "Welcome to Kagemi. This is a sanctuary for those who seek the wisdom of anime. What brings you here today, traveler?",
    REGISTER: "Thanks for registering at Kagemi. Good luck with your adventurer journey.",
    BYE_MASTER: "See you again master, have a nice day.",
    BYE_ADVENTURER: "See you again adventurer, have a nice day."
};

const JP_VOICE_SCRIPTS: Record<string, string> = {
    GREET_MASTER: "おかえりなさいませ、マスター。影たちはお前の命を待っています。",
    GREET_ADVENTURER: "おかえりなさい、冒険者。また会えて嬉しいよ。",
    GREET_TRAVELER: "ようこそ、旅人よ。今日、我らの仲間に入りますか？",
    WELCOME: "カゲミへようこそ。ここはアニメの英知を求める者たちの聖域。今日はいかなる用件で、旅人よ？",
    REGISTER: "カゲミへの登録、ありがとうございます。冒険の旅に幸運を。",
    BYE_MASTER: "またお会いしましょう、マスター。良い一日を。",
    BYE_ADVENTURER: "またね、冒険者。良い一日を。"
};

export type VoiceEvent = keyof typeof VOICE_SCRIPTS;

interface VoicePreference {
    pack: string; // Character Name (e.g. 'Alpha')
    language: string;
    enabled: boolean;
    volume?: number;
}

export const getVoiceSettings = (): VoicePreference => {
    if (typeof window === 'undefined') return { pack: 'Alpha', language: 'en', enabled: true };
    try {
        const stored = localStorage.getItem('shadow_voice_settings');
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.warn("Invalid shadow_voice_settings in localStorage");
    }
    return { pack: 'Alpha', language: 'en', enabled: true };
};

// --- GLOBAL AUDIO UNLOCKER & AUTOPLAY HANDLER ---
let isAudioUnlocked = false;
let pendingVoiceTrigger: VoiceEvent | null = null;
let sharedAudioContext: any = null;

export const unlockAudio = () => {
    if (isAudioUnlocked) return;
    try {
        const AudioCtx = (typeof window !== 'undefined') ? (window.AudioContext || (window as any).webkitAudioContext) : null;
        if (AudioCtx) {
            if (!sharedAudioContext) sharedAudioContext = new AudioCtx();
            if (sharedAudioContext.state === 'suspended') {
                sharedAudioContext.resume().catch(() => {});
            }
            // Trigger 0.001s silent buffer to satisfy browser user gesture
            const buffer = sharedAudioContext.createBuffer(1, 1, 22050);
            const source = sharedAudioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(sharedAudioContext.destination);
            source.start(0);
        }
        isAudioUnlocked = true;
        console.log("🔊 [ShadowVoice] Global audio permissions unlocked");
        
        // If an initial greeting was queued due to browser autoplay restriction, play it now
        if (pendingVoiceTrigger) {
            const ev = pendingVoiceTrigger;
            pendingVoiceTrigger = null;
            setTimeout(() => playVoice(ev), 120);
        }
    } catch (e) {
        console.warn("Audio unlock failed:", e);
    }
};

// Automatically listen for first user interaction anywhere on the window
if (typeof window !== 'undefined') {
    const handleFirstGesture = () => {
        unlockAudio();
        window.removeEventListener('pointerdown', handleFirstGesture, true);
        window.removeEventListener('keydown', handleFirstGesture, true);
        window.removeEventListener('click', handleFirstGesture, true);
        window.removeEventListener('touchstart', handleFirstGesture, true);
    };
    window.addEventListener('pointerdown', handleFirstGesture, { capture: true, passive: true });
    window.addEventListener('keydown', handleFirstGesture, { capture: true, passive: true });
    window.addEventListener('click', handleFirstGesture, { capture: true, passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { capture: true, passive: true });
}

// --- DYNAMIC CACHE ---
// Stores voice data fetched from Supabase to avoid repeated calls
let dynamicVoiceCache: any[] = [];

export const refreshVoiceCache = async () => {
    try {
        const { data } = await supabase.from('voice_packs').select('*');
        if (data) dynamicVoiceCache = data;
    } catch (e) {
        console.warn("Failed to refresh voice cache", e);
    }
};

export const playVoice = (event: VoiceEvent) => {
    const settings = getVoiceSettings();
    const scriptText = settings.language === 'jp' 
        ? (JP_VOICE_SCRIPTS[event] || VOICE_SCRIPTS[event])
        : VOICE_SCRIPTS[event];
    
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
    const dynamicMatch = dynamicVoiceCache.find(v => 
        (v.character?.toLowerCase() === settings.pack?.toLowerCase() || v.name?.toLowerCase() === settings.pack?.toLowerCase()) && 
        v.language === settings.language &&
        (v.event_trigger === event || v.event_trigger === event.replace(/_/g, '-'))
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
        let packName = (settings.pack || 'alpha').toLowerCase();
        if (packName.startsWith('system-')) packName = packName.replace('system-', '');
        if (packName.startsWith('sys-')) packName = packName.replace('sys-', '');
        
        const lang = settings.language || 'en';
        fileUrl = `/voices/${lang}/${packName}-${action}.mp3`;
    }

    // 3. Play
    if (fileUrl) {
        console.log(`🔊 [ShadowVoice] Playing: ${fileUrl}`);
        const audio = new Audio(fileUrl);
        audio.volume = settings.volume !== undefined ? settings.volume : 1.0; 
        
        audio.play().catch(e => {
            const isAutoplayBlocked = e?.name === 'NotAllowedError' || 
                                     e?.message?.toLowerCase().includes('interact') ||
                                     e?.message?.toLowerCase().includes('user gesture') ||
                                     e?.message?.toLowerCase().includes('autoplay');
            if (isAutoplayBlocked) {
                console.log(`🔊 [ShadowVoice] Autoplay deferred until first user interaction for event: ${event}`);
                pendingVoiceTrigger = event;
                return;
            }

            // If primary voices path failed for legacy alpha audio, try /audio/ path
            let packName = (settings.pack || 'alpha').toLowerCase().replace(/^(system-|sys-)/, '');
            let action = event.toLowerCase().replace(/_/g, '-');
            const suffix = settings.language === 'jp' ? '_jp' : '';
            const legacyUrl = `/audio/${packName}${suffix}_${action}.mp3`;
            if (fileUrl !== legacyUrl) {
                const fallbackAudio = new Audio(legacyUrl);
                fallbackAudio.volume = audio.volume;
                fallbackAudio.play().catch(err => {
                    if (err?.name === 'NotAllowedError') {
                        pendingVoiceTrigger = event;
                    } else {
                        console.warn("Autoplay blocked/missing:", err);
                    }
                });
            } else {
                console.warn("Autoplay blocked/missing:", e);
            }
        });
    }
};

export const syncVoiceProfile = async (userId: string) => {
    const localSettings = getVoiceSettings();
    if (supabase) {
        await supabase.from('profiles').update({ voice_pack: localSettings.pack }).eq('id', userId);
    }
};

export const loadVoiceProfile = async (userId: string) => {
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
