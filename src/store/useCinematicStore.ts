import { create } from 'zustand';

export type CinematicPhase = 
  | 0  // Merged Cookie & Audio Permission Grant Modal
  | 1  // The Void & Interstellar Title Fade
  | 2  // Solo Leveling Gender Selection (Male/Female)
  | 3  // Hyper-Travel & Drone View Orbit around 3D Gate
  | 4  // System Instructions (3-Page Guide) & Main Landing UI
  | 5  // First-Person Drop & Confusion (Look down at hands, left/right)
  | 6  // The Walk down Stone Path & Gate Entrance Quest Prompt
  | 7  // Pushing the Gate (God-rays, camera shake, door cracking)
  | 8  // The Black Hole & Time Tunnel Wormhole Sucking Sequence
  | 9; // Whiteout Flash & Arrival at /home

export type Gender = 'male' | 'female';

interface CinematicState {
  currentPhase: CinematicPhase;
  gender: Gender;
  audioMuted: boolean;
  audioPermitted: boolean;
  cookieAccepted: boolean;
  instructionPage: number; // 1, 2, 3
  isInstructionsOpen: boolean;
  
  // Actions
  setPhase: (phase: CinematicPhase) => void;
  nextPhase: () => void;
  setGender: (gender: Gender) => void;
  toggleAudioMute: () => void;
  permitAudioAndCookies: () => void;
  setInstructionPage: (page: number) => void;
  setIsInstructionsOpen: (isOpen: boolean) => void;
  resetSequence: () => void;
}

export const useCinematicStore = create<CinematicState>((set, get) => ({
  currentPhase: 0,
  gender: 'male',
  audioMuted: false,
  audioPermitted: false,
  cookieAccepted: false,
  instructionPage: 1,
  isInstructionsOpen: false,

  setPhase: (phase) => set({ currentPhase: phase }),

  nextPhase: () => {
    const current = get().currentPhase;
    if (current < 9) {
      set({ currentPhase: (current + 1) as CinematicPhase });
    }
  },

  setGender: (gender) => set({ gender }),

  toggleAudioMute: () => set((state) => ({ audioMuted: !state.audioMuted })),

  permitAudioAndCookies: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('shadow_audio_permitted', 'true');
      localStorage.setItem('shadow_cookie_consent', 'accepted');
    }
    set({ audioPermitted: true, cookieAccepted: true, currentPhase: 1 });
  },

  setInstructionPage: (page) => set({ instructionPage: Math.min(Math.max(1, page), 3) }),

  setIsInstructionsOpen: (isOpen) => set({ isInstructionsOpen: isOpen }),

  resetSequence: () => set({ currentPhase: 0, instructionPage: 1, isInstructionsOpen: false }),
}));
