"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { triggerTelepathy } from '@/lib/voice';
import { Plus, Eye, CheckCircle, XCircle, Clock, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/context/UserDataContext';
import {
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface WatchListButtonProps {
    animeId: string;
    animeTitle: string;
    animeImage: string;
    currentEp?: number; 
    mediaType?: string;
    totalEpisodes?: number;
    type?: string;
    compact?: boolean;
    labelMode?: 'full' | 'short' | 'icon';
}

export default function WatchListButton({ animeId, animeTitle, animeImage, currentEp, mediaType = 'anime', totalEpisodes, type, compact = false, labelMode }: WatchListButtonProps) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { watchlist, library, addToLibrary, updateLibraryStatus, removeFromLibrary } = useUserData();
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Status Configurations (Material Purple/Violet aligned, no random blue)
    const statusMap: any = {
        "watching": { label: "Watching", icon: <Eye size={14}/>, color: "text-purple-400 border-purple-500/20 bg-purple-500/10" },
        "completed": { label: "Completed", icon: <CheckCircle size={14}/>, color: "text-primary-400 border-primary-500/20 bg-primary-500/10" },
        "plan_to_watch": { label: "Planning", icon: <Clock size={14}/>, color: "text-violet-400 border-violet-500/20 bg-violet-500/10" },
        "on_hold": { label: "On Hold", icon: <Clock size={14}/>, color: "text-amber-400 border-amber-500/20 bg-amber-500/10" },
        "dropped": { label: "Dropped", icon: <XCircle size={14}/>, color: "text-rose-400 border-rose-500/20 bg-rose-500/10" },
    };

    // 1. Synchronize Status with UserDataContext
    useEffect(() => {
        const item = watchlist.find((i: any) => String(i.anime_id) === String(animeId) || String(i.id) === String(animeId))
            || library.find((i: any) => String(i.anime_id) === String(animeId) || String(i.id) === String(animeId));
        if (item?.status) {
            setStatus(item.status);
        } else if (!user) {
            try {
                const localWatch = JSON.parse(localStorage.getItem('shadow_watchlist') || '[]');
                const localItem = localWatch.find((i: any) => String(i.anime_id) === String(animeId) || String(i.id) === String(animeId));
                if (localItem?.status) setStatus(localItem.status);
            } catch (_) {}
        }
    }, [animeId, watchlist, library, user]);

    // 2. Initial Fallback Check from Supabase if not yet in context cache
    useEffect(() => {
        let isMounted = true;

        const checkStatus = async () => {
            if (!supabase || !user) return;

            try {
                const { data, error } = await supabase
                    .from('watchlist')
                    .select('status')
                    .eq('user_id', user.id)
                    .eq('anime_id', animeId)
                    .maybeSingle();
                
                if (error) throw error;
                
                if (isMounted && data?.status) {
                    setStatus(data.status);
                }
            } catch (err: any) {
                if (err.name === 'AbortError') return;
                console.error("WatchList Check Error:", err);
            }
        };

        if (!isAuthLoading && user && !status) {
            checkStatus();
        }

        return () => { isMounted = false; };
    }, [animeId, user, isAuthLoading, status]);

    const handleUpdate = async (newStatus: string) => {
        setLoading(true);
        const epNum = Number(currentEp || 1);
        const total = totalEpisodes ? Number(totalEpisodes) : null;

        const optimisticItem = {
            id: animeId,
            anime_id: animeId,
            title: animeTitle,
            anime_title: animeTitle,
            poster: animeImage,
            anime_image: animeImage,
            status: newStatus,
            last_episode_number: epNum,
            progress: epNum,
            total_episodes: total,
            media_type: mediaType || 'anime',
            type: (type || 'TV').toUpperCase(),
            updated_at: new Date().toISOString()
        };

        // 1. Immediately update global UserDataContext (instant UI reactivity)
        addToLibrary(optimisticItem);
        updateLibraryStatus(animeId, newStatus);
        setStatus(newStatus);

        try {
            if (user && supabase) {
                // ✅ Exact Supabase column schema matching
                const payload: any = {
                    user_id: user.id,
                    anime_id: animeId,
                    anime_title: animeTitle,
                    anime_image: animeImage,
                    status: newStatus,
                    media_type: mediaType || 'anime',
                    last_episode_number: epNum,
                    updated_at: new Date().toISOString()
                };

                if (total !== null) payload.total_episodes = total;

                const { error } = await supabase
                    .from('watchlist')
                    .upsert(payload, { onConflict: 'user_id,anime_id' });

                if (error) throw error;
            }

            // Always update client-side storage cache for instant reactivity
            try {
                const current = JSON.parse(localStorage.getItem('shadow_watchlist') || '[]');
                const filtered = current.filter((x: any) => String(x.id || x.anime_id) !== String(animeId));
                filtered.unshift(optimisticItem);
                localStorage.setItem('shadow_watchlist', JSON.stringify(filtered));
            } catch (_) {}

            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('shadow-watchlist-updated'));
            }

            toast.success(`Marked as ${statusMap[newStatus]?.label || newStatus}`);
            triggerTelepathy('BOOKMARK', `Marked ${animeTitle} as ${statusMap[newStatus]?.label || newStatus}`);
        } catch (err: any) {
            console.error("WatchList Update Error:", err);
            toast.error("Failed to update status.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async () => {
        setLoading(true);
        removeFromLibrary(animeId);
        setStatus(null);

        try {
            if (user && supabase) {
                const { error } = await supabase
                    .from('watchlist')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('anime_id', animeId);

                if (error) throw error;
            }

            try {
                const current = JSON.parse(localStorage.getItem('shadow_watchlist') || '[]');
                const filtered = current.filter((x: any) => String(x.id || x.anime_id) !== String(animeId));
                localStorage.setItem('shadow_watchlist', JSON.stringify(filtered));
            } catch (_) {}

            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('shadow-watchlist-updated'));
            }

            toast.success("Removed from library.");
        } catch (err: any) {
            console.error("Remove Error:", err);
            toast.error("Could not remove entry.");
        } finally {
            setLoading(false);
        }
    };

    const activeConfig = status ? statusMap[status] : null;
    const effectiveMode = labelMode ?? (compact ? 'short' : 'full');
    const isIconOnly = effectiveMode === 'icon';
    const buttonText = activeConfig ? activeConfig.label : (effectiveMode === 'short' ? "List" : "Add to List");

    const triggerButton = (
        <button 
            disabled={loading || isAuthLoading}
            className={cn(
                "flex items-center justify-center rounded-full h-8 font-black transition-all shadow-sm active:scale-95 border outline-none focus:outline-none focus:ring-0 whitespace-nowrap flex-shrink-0 cursor-pointer atrax-bubbly-btn atrax-squish-tap",
                isIconOnly
                    ? "w-8 p-0"
                    : compact
                        ? "gap-1.5 px-3 text-[10px]"
                        : "gap-2 px-4 text-[9px] sm:text-[10px] shadow-lg",
                activeConfig 
                    ? activeConfig.color 
                    : "bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:bg-white/10 hover:text-white"
            )}
            title={buttonText}
            aria-label={buttonText}
        >
            {loading ? <Loader2 size={compact || isIconOnly ? 12 : 14} className="animate-spin"/> : (activeConfig ? activeConfig.icon : <Plus size={compact || isIconOnly ? 12 : 14}/>)}
            {!isIconOnly && (
                <span className="uppercase tracking-wider">{buttonText}</span>
            )}
        </button>
    );

    if (!mounted) {
        return triggerButton;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {triggerButton}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[150px] bg-[#0c1322] border-white/10 text-zinc-200">
                {Object.keys(statusMap).map((key) => (
                    <DropdownMenuItem 
                        key={key} 
                        onSelect={() => handleUpdate(key)}
                        onClick={() => handleUpdate(key)} 
                        className={cn(
                            "gap-2 uppercase tracking-wide font-bold cursor-pointer transition-colors focus:bg-white/10",
                            status === key && "text-primary bg-primary/15"
                        )}
                    >
                        {statusMap[key].icon} {statusMap[key].label}
                    </DropdownMenuItem>
                ))}
                
                {status && (
                    <>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem 
                            onSelect={handleRemove}
                            onClick={handleRemove} 
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-2 font-bold uppercase tracking-wide focus:bg-rose-500/10 cursor-pointer"
                        >
                            <Trash2 size={14} /> Remove
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
