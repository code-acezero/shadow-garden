'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { X, ExternalLink, Sparkles, Megaphone } from 'lucide-react';
import { GuildBoardPopup } from '@/components/Admin/GuildBoardsPanel';

export default function GuildBoardPopupRenderer() {
  const pathname = usePathname();
  const [activePopup, setActivePopup] = useState<GuildBoardPopup | null>(null);
  const [visible, setVisible] = useState(false);

  // Check if current page is explicitly allowed to display Guild Boards
  const isAllowedPage = React.useMemo(() => {
    if (!pathname) return false;
    // Watch pages and all other pages are stripped off
    if (
      pathname.includes('/watch') || 
      pathname.includes('-watch')
    ) return false;

    return (
      pathname === '/' ||
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

  if (!isAllowedPage || !activePopup || !visible) return null;

  // Render Placement Styles
  const placement = activePopup.placement || 'center_modal';

  if (placement === 'center_modal') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
        <div className="relative w-full max-w-md bg-[#0d0b1a]/95 border border-fuchsia-500/40 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9)] space-y-4 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-600/10 blur-[80px] pointer-events-none" />

          <button
            onClick={() => setVisible(false)}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors z-20"
          >
            <X size={18} />
          </button>

          {activePopup.image_url && (
            <div className="w-full h-44 rounded-2xl overflow-hidden border border-white/10">
              <img src={activePopup.image_url} alt={activePopup.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-fuchsia-400 tracking-widest flex items-center gap-1.5">
              <Sparkles size={12} /> Official Announcement
            </span>
            <h3 className="text-xl font-black text-white">{activePopup.title}</h3>
            {activePopup.subtitle && <p className="text-xs text-fuchsia-300 font-medium">{activePopup.subtitle}</p>}
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">{activePopup.content}</p>

          {activePopup.button_text && (
            <a
              href={activePopup.button_url || '#'}
              onClick={() => setVisible(false)}
              className="w-full py-3 px-4 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-600/30 transition-all hover:scale-[1.02] block text-center"
            >
              {activePopup.button_text} <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    );
  }

  if (placement === 'top_banner') {
    return (
      <div className="fixed top-4 left-4 right-4 z-[100] max-w-4xl mx-auto bg-[#0d0b1a]/95 border border-fuchsia-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 shrink-0">
            <Megaphone size={18} />
          </div>
          <div className="truncate">
            <h4 className="text-xs font-black text-white truncate">{activePopup.title}</h4>
            <p className="text-[11px] text-zinc-300 truncate">{activePopup.content}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {activePopup.button_text && (
            <a
              href={activePopup.button_url || '#'}
              onClick={() => setVisible(false)}
              className="px-4 py-2 rounded-xl bg-fuchsia-600 text-white text-xs font-black hover:bg-fuchsia-500 transition-colors"
            >
              {activePopup.button_text}
            </a>
          )}
          <button onClick={() => setVisible(false)} className="p-1 text-zinc-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Floating Bottom Right Toast/Card Default
  return (
    <div className="fixed bottom-6 right-6 z-[100] w-full max-w-sm bg-[#0d0b1a]/95 border border-fuchsia-500/40 rounded-3xl p-5 shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-md space-y-3 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <span className="text-[9px] font-black text-fuchsia-400 uppercase tracking-widest">Guild Notice</span>
          <h4 className="text-sm font-black text-white">{activePopup.title}</h4>
        </div>
        <button onClick={() => setVisible(false)} className="p-1 text-zinc-400 hover:text-white">
          <X size={16} />
        </button>
      </div>

      <p className="text-xs text-zinc-300 line-clamp-3">{activePopup.content}</p>

      {activePopup.button_text && (
        <a
          href={activePopup.button_url || '#'}
          onClick={() => setVisible(false)}
          className="w-full py-2 px-3 rounded-xl bg-fuchsia-600 text-white text-xs font-black text-center block hover:bg-fuchsia-500 transition-colors"
        >
          {activePopup.button_text}
        </a>
      )}
    </div>
  );
}
