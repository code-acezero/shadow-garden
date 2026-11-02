'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, RotateCcw, Check, Loader2, CheckCircle2 } from 'lucide-react';
import { useAdminSave } from './AdminSaveContext';
import { useSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';

export default function AdminFloatingSaveBar() {
  const {
    isDirty,
    dirtySection,
    isSaving,
    autoSave,
    lastSavedAt,
    triggerSave,
    triggerReset,
    toggleAutoSave,
  } = useAdminSave();
  const { settings } = useSettings();
  const isLight = settings.themeMode === 'light';

  return (
    <AnimatePresence>
      {isDirty && (
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed bottom-5 inset-x-0 mx-auto w-fit max-w-[94vw] z-50 pointer-events-auto"
        >
          <div className={cn(
            "flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full border backdrop-blur-2xl select-none transition-colors",
            isLight
              ? "bg-white/95 border-black/10 shadow-[0_16px_40px_rgba(0,0,0,0.12)] text-zinc-900"
              : "bg-[#0c101c]/95 border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.85)] text-white"
          )}>
            
            {/* Status & Label (Clean typography, zero dots) */}
            <div className={cn(
              "flex items-center gap-2 pr-2 sm:pr-3 border-r min-w-0",
              isLight ? "border-black/10" : "border-white/10"
            )}>
              {isSaving && (
                <Loader2 size={13} className="text-primary-400 animate-spin shrink-0" />
              )}
              <span className={cn(
                "text-[11px] sm:text-xs font-semibold truncate max-w-[130px] sm:max-w-[200px]",
                isLight ? "text-zinc-800" : "text-zinc-300"
              )}>
                {isSaving
                  ? 'Saving changes...'
                  : dirtySection
                  ? `Unsaved: ${dirtySection}`
                  : 'Unsaved changes'}
              </span>
            </div>

            {/* Autosave Toggle Button (Clean typography, zero dots) */}
            <button
              type="button"
              onClick={toggleAutoSave}
              className={cn(
                "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] font-medium transition-all cursor-pointer",
                autoSave
                  ? (isLight 
                      ? "bg-primary-500/15 text-primary-700 border border-primary-500/30" 
                      : "bg-primary-500/20 text-primary-300 border border-primary-500/30")
                  : (isLight
                      ? "bg-black/[0.04] text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.08] border border-black/10"
                      : "bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.08]")
              )}
              title={autoSave ? "Auto-save is enabled" : "Auto-save is disabled"}
            >
              <span>Auto-save: {autoSave ? 'ON' : 'OFF'}</span>
            </button>

            {/* Reset / Discard Button */}
            <button
              type="button"
              disabled={isSaving}
              onClick={triggerReset}
              className={cn(
                "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] font-medium transition-all cursor-pointer active:scale-95 disabled:opacity-50",
                isLight
                  ? "text-zinc-600 hover:text-zinc-950 bg-black/[0.04] hover:bg-black/[0.08] border border-black/10"
                  : "text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08]"
              )}
              title="Discard changes and revert"
            >
              <RotateCcw size={12} className="shrink-0" />
              <span>Reset</span>
            </button>

            {/* Save / Force Save Button */}
            <button
              type="button"
              disabled={isSaving}
              onClick={() => triggerSave()}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold text-white bg-primary hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
              title="Force Save (Ctrl+S / Cmd+S)"
            >
              {isSaving ? (
                <Loader2 size={13} className="animate-spin shrink-0" />
              ) : (
                <Save size={13} className="shrink-0" />
              )}
              <span>Save</span>
              <kbd className="hidden sm:inline-block text-[9px] font-mono opacity-70 bg-black/30 px-1 py-0.5 rounded ml-0.5">
                Ctrl+S
              </kbd>
            </button>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

