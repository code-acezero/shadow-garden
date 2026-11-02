'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { X, ExternalLink, Megaphone, Bell } from 'lucide-react';
import { GuildBoardPopup } from '@/components/Admin/GuildBoardsPanel';

export default function GuildBoardPopupRenderer() {
  const pathname = usePathname();
  const [activePopup, setActivePopup] = useState<GuildBoardPopup | null>(null);
  const [visible, setVisible] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);

  // Admin instant preview listener (bypasses page whitelist for testing)
  useEffect(() => {
    const handleTest = (e: any) => {
      if (e.detail) {
        setActivePopup(e.detail);
        setIsTestMode(true);
        setVisible(true);
      }
    };
    window.addEventListener('shadow_trigger_test_popup', handleTest);
    return () => window.removeEventListener('shadow_trigger_test_popup', handleTest);
  }, []);

  // Check if current page is explicitly allowed to display Guild Boards
  const isAllowedPage = React.useMemo(() => {
    if (!pathname) return false;
    // Watch pages and landing page are stripped off
    if (
      pathname === '/' ||
      pathname.includes('/watch') || 
      pathname.includes('-watch')
    ) return false;

    return (
      pathname === '/home' ||
      pathname === '/drama' ||
      pathname.startsWith('/drama/') ||
      pathname === '/movies' ||
      pathname.startsWith('/movies/') ||
      pathname === '/donghua' ||
      pathname.startsWith('/search/donghua') ||
      pathname.startsWith('/download')
    );
  }, [pathname]);

  useEffect(() => {
    if (!isAllowedPage) return;

    let timer: NodeJS.Timeout;

    const checkAndShowPopups = async () => {
      let popups: GuildBoardPopup[] = [];

      try {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('shadow_guild_boards') : null;
        if (saved) {
          popups = JSON.parse(saved).filter((p: GuildBoardPopup) => p.is_active);
        }
        
        if (popups.length === 0) {
          const { data, error } = await supabase
            .from('guild_boards')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            popups = data;
          }
        }
      } catch (err) {
        const saved = localStorage.getItem('shadow_guild_boards');
        if (saved) {
          popups = JSON.parse(saved).filter((p: GuildBoardPopup) => p.is_active);
        }
      }

      if (!popups || popups.length === 0) return;

      // Find matching popup for current pathname
      const matching = popups.find(p => {
        if (p.target_page === 'all') return true;
        if (p.target_page === '/' && pathname === '/') return true;
        if (p.target_page === '/social' && pathname?.startsWith('/social')) return true;
        if (p.target_page === '/clans' && pathname?.startsWith('/clans')) return true;
        if (p.target_page === '/master' && pathname?.startsWith('/master')) return true;
        return p.target_page === pathname;
      });

      if (!matching) return;

      // Check max display count
      const viewKey = `shadow_popup_views_${matching.id}`;
      const viewCount = Number(localStorage.getItem(viewKey) || 0);

      if (viewCount >= matching.max_display_count) return;

      // Set active popup and handle trigger timing
      setActivePopup(matching);

      const showModal = () => {
        setVisible(true);
        localStorage.setItem(viewKey, String(viewCount + 1));

        // Auto close timer if specified
        if (matching.duration_seconds && matching.duration_seconds > 0) {
          setTimeout(() => {
            setVisible(false);
          }, matching.duration_seconds * 1000);
        }
      };

      if (matching.trigger_type === 'on_load') {
        showModal();
      } else if (matching.trigger_type === 'delay') {
        timer = setTimeout(showModal, (matching.delay_seconds || 2) * 1000);
      } else if (matching.trigger_type === 'scroll') {
        const handleScroll = () => {
          if (window.scrollY > window.innerHeight * 0.4) {
            showModal();
            window.removeEventListener('scroll', handleScroll);
          }
        };
        window.addEventListener('scroll', handleScroll);
      } else if (matching.trigger_type === 'exit_intent') {
        const handleExit = (e: MouseEvent) => {
          if (e.clientY <= 0) {
            showModal();
            document.removeEventListener('mouseleave', handleExit);
          }
        };
        document.addEventListener('mouseleave', handleExit);
      }
    };

    checkAndShowPopups();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [pathname, isAllowedPage]);

  if ((!isAllowedPage && !isTestMode) || !activePopup || !visible) return null;

  // Render Placement Styles
  const placement = activePopup.placement || 'center_modal';

  if (placement === 'center_modal') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-250 select-none">
        <div className="relative w-full max-w-lg bg-[#0b0c13] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.9)] space-y-4 overflow-hidden">
          {/* Subtle top ambient sheen */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          <button
            onClick={() => setVisible(false)}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-white/[0.04] hover:bg-white/[0.08] transition-colors z-20 cursor-pointer"
            aria-label="Close Notice"
          >
            <X size={16} />
          </button>

          {activePopup.image_url && (
            <div className="w-full h-48 rounded-xl overflow-hidden border border-white/[0.06] bg-black/40">
              <img src={activePopup.image_url} alt={activePopup.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-400 flex items-center gap-1.5 font-bold">
              <Megaphone size={12} className="text-zinc-300" /> Guild Announcement
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">{activePopup.title}</h3>
            {activePopup.subtitle && <p className="text-xs text-zinc-400 font-medium tracking-wide">{activePopup.subtitle}</p>}
          </div>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line font-sans">{activePopup.content}</p>

          {activePopup.button_text && (
            <div className="pt-2">
              <a
                href={activePopup.button_url || '#'}
                onClick={() => setVisible(false)}
                className="w-full py-3 px-5 rounded-full bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98] text-center"
              >
                {activePopup.button_text} <ExternalLink size={13} />
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (placement === 'top_banner') {
    return (
      <div className="fixed top-4 inset-x-3 sm:inset-x-6 z-[100] max-w-4xl mx-auto bg-[#0b0c13]/95 border border-white/[0.08] rounded-full px-4 sm:px-6 py-2.5 shadow-[0_16px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-full bg-white/[0.06] text-white flex items-center justify-center shrink-0">
            <Megaphone size={13} />
          </div>
          <div className="truncate">
            <h4 className="text-xs font-bold text-white truncate">{activePopup.title}</h4>
            <p className="text-[11px] text-zinc-400 truncate">{activePopup.content}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {activePopup.button_text && (
            <a
              href={activePopup.button_url || '#'}
              onClick={() => setVisible(false)}
              className="px-3.5 py-1.5 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors"
            >
              {activePopup.button_text}
            </a>
          )}
          <button onClick={() => setVisible(false)} className="p-1.5 text-zinc-400 hover:text-white rounded-full transition-colors cursor-pointer" aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      </div>
    );
  }

  // Floating Bottom Right Toast/Card Default
  return (
    <div className="fixed bottom-6 right-6 z-[100] w-full max-w-sm bg-[#0b0c13]/95 border border-white/[0.08] rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl space-y-2.5 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest font-bold">Guild Notice</span>
          <h4 className="text-sm font-bold text-white">{activePopup.title}</h4>
        </div>
        <button onClick={() => setVisible(false)} className="p-1 text-zinc-400 hover:text-white rounded-full transition-colors cursor-pointer" aria-label="Dismiss">
          <X size={15} />
        </button>
      </div>

      <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed font-sans">{activePopup.content}</p>

      {activePopup.button_text && (
        <a
          href={activePopup.button_url || '#'}
          onClick={() => setVisible(false)}
          className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold text-center block transition-all"
        >
          {activePopup.button_text}
        </a>
      )}
    </div>
  );
}
