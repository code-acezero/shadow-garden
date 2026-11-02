'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

export interface AdminSaveContextType {
  isDirty: boolean;
  dirtySection: string | null;
  isSaving: boolean;
  autoSave: boolean;
  lastSavedAt: Date | null;
  markDirty: (section: string, onSave: () => Promise<void> | void, onReset?: () => void) => void;
  markClean: () => void;
  triggerSave: () => Promise<boolean>;
  triggerReset: () => void;
  toggleAutoSave: () => void;
  setAutoSave: (val: boolean) => void;
}

const AdminSaveContext = createContext<AdminSaveContextType | null>(null);

export const useAdminSave = () => {
  const context = useContext(AdminSaveContext);
  if (!context) {
    throw new Error('useAdminSave must be used within an AdminSaveProvider');
  }
  return context;
};

interface AdminSaveProviderProps {
  children: React.ReactNode;
  onNotify?: (title: string, message: string, type: 'success' | 'error' | 'system') => void;
}

export function AdminSaveProvider({ children, onNotify }: AdminSaveProviderProps) {
  const [isDirty, setIsDirty] = useState(false);
  const [dirtySection, setDirtySection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [autoSave, setAutoSaveState] = useState(false);

  const saveHandlerRef = useRef<(() => Promise<void> | void) | null>(null);
  const resetHandlerRef = useRef<(() => void) | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize autoSave preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('shadow_admin_autosave');
      if (stored !== null) {
        setAutoSaveState(stored === 'true');
      }
    }
  }, []);

  const setAutoSave = useCallback((val: boolean) => {
    setAutoSaveState(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('shadow_admin_autosave', String(val));
    }
    if (onNotify) {
      onNotify('Auto-save Preference', val ? 'Auto-save enabled' : 'Auto-save disabled', 'system');
    }
  }, [onNotify]);

  const toggleAutoSave = useCallback(() => {
    setAutoSave(!autoSave);
  }, [autoSave, setAutoSave]);

  const markClean = useCallback(() => {
    setIsDirty(false);
    setDirtySection(null);
    saveHandlerRef.current = null;
    resetHandlerRef.current = null;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  const triggerSave = useCallback(async (): Promise<boolean> => {
    if (!saveHandlerRef.current) {
      // If no custom handler registered, still broadcast a global save event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('shadow_admin_force_save'));
      }
      setIsDirty(false);
      setLastSavedAt(new Date());
      if (onNotify) onNotify('Changes Saved', 'All settings persisted successfully', 'success');
      return true;
    }

    try {
      setIsSaving(true);
      await Promise.resolve(saveHandlerRef.current());
      setIsSaving(false);
      setIsDirty(false);
      setLastSavedAt(new Date());
      saveHandlerRef.current = null;
      resetHandlerRef.current = null;
      if (onNotify) {
        onNotify('Saved Successfully', `${dirtySection || 'Section'} changes persisted`, 'success');
      }
      return true;
    } catch (err: any) {
      setIsSaving(false);
      console.error('[AdminSaveContext] Save error:', err);
      if (onNotify) {
        onNotify('Save Failed', err?.message || 'Could not save changes', 'error');
      }
      return false;
    }
  }, [dirtySection, onNotify]);

  const triggerReset = useCallback(() => {
    if (resetHandlerRef.current) {
      try {
        resetHandlerRef.current();
      } catch (err) {
        console.error('[AdminSaveContext] Reset error:', err);
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('shadow_admin_reset_section', { detail: { section: dirtySection } }));
    }
    markClean();
    if (onNotify) {
      onNotify('Changes Discarded', `Reverted uncommitted changes in ${dirtySection || 'section'}`, 'system');
    }
  }, [dirtySection, markClean, onNotify]);

  const markDirty = useCallback((
    section: string,
    onSave: () => Promise<void> | void,
    onReset?: () => void
  ) => {
    setIsDirty(true);
    setDirtySection(section);
    saveHandlerRef.current = onSave;
    if (onReset) resetHandlerRef.current = onReset;

    // Handle Auto-save if enabled
    if (autoSave) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        triggerSave();
      }, 1400);
    }
  }, [autoSave, triggerSave]);

  // Global Keyboard Shortcut: Ctrl+S / Cmd+S to force save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        triggerSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerSave]);

  // Listen to cross-component window events
  useEffect(() => {
    const handleWindowDirty = (e: any) => {
      const { section, onSave, onReset } = e.detail || {};
      if (section && onSave) {
        markDirty(section, onSave, onReset);
      } else {
        setIsDirty(true);
        if (section) setDirtySection(section);
      }
    };

    window.addEventListener('shadow_admin_notify_dirty', handleWindowDirty);
    return () => window.removeEventListener('shadow_admin_notify_dirty', handleWindowDirty);
  }, [markDirty]);

  return (
    <AdminSaveContext.Provider
      value={{
        isDirty,
        dirtySection,
        isSaving,
        autoSave,
        lastSavedAt,
        markDirty,
        markClean,
        triggerSave,
        triggerReset,
        toggleAutoSave,
        setAutoSave,
      }}
    >
      {children}
    </AdminSaveContext.Provider>
  );
}

