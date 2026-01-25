// A lightweight event emitter for local "Toasts" inside the Island
export const triggerWhisper = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('shadow-whisper', { 
      detail: { title, message, type, id: Date.now() } 
    }));
  }
};