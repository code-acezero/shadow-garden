"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // ✅ IMPORT SINGLETON
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { triggerTelepathy } from '@/lib/voice';
import { Plus, Eye, CheckCircle, XCircle, Clock, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
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
}

export default function WatchListButton({ animeId, animeTitle, animeImage, currentEp, mediaType = 'anime', totalEpisodes, type }: WatchListButtonProps) {
    const { user, isLoading: isAuthLoading } = useAuth();
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

    // 1. Initial Check: Is this anime in the user's DB?
    useEffect(() => {
        let isMounted = true;

        const checkStatus = async () => {
            if (!supabase || !user) return;

            try {
                // ✅ Check using the Shared Client
                const { data, error } = await supabase
                    .from('watchlist')
                    .select('status')
                    .eq('user_id', user.id)
                    .eq('anime_id', animeId)
                    .maybeSingle();
                
                if (error) throw error;
                
                if (isMounted && data) {
                    setStatus(data.status);
                }
            } catch (err: any) {
                if (err.name === 'AbortError') return;
                console.error("WatchList Check Error:", err);
            }
        };

        if (!isAuthLoading) {
            checkStatus();
        }

        return () => { isMounted = false; };
    }, [animeId, user, isAuthLoading]);

    const handleUpdate = async (newStatus: string) => {
        if (!user) {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('shadow-open-auth', { detail: { view: 'ENTER' } }));
            }
            return;
        }

        setLoading(true);
        try {
            const payload: any = {
                user_id: user.id,
                anime_id: animeId,
                status: newStatus,
                media_type: mediaType,
                title: animeTitle,
                poster: animeImage,
                updated_at: new Date().toISOString()
            };

            if (currentEp !== undefined) payload.current_episode = currentEp;
            if (totalEpisodes !== undefined) payload.total_episodes = totalEpisodes;

            // ✅ Upsert using the Shared Client
            const { error } = await supabase
                .from('watchlist')
                .upsert(payload, { onConflict: 'user_id, anime_id' });

            if (error) throw error;

            setStatus(newStatus);
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
        if (!user) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('watchlist')
                .delete()
                .eq('user_id', user.id)
                .eq('anime_id', animeId);

            if (error) throw error;

            setStatus(null);
            toast.success("Removed from library.");
        } catch (err: any) {
            console.error("Remove Error:", err);
            toast.error("Could not remove entry.");
        } finally {
            setLoading(false);
        }
    };

    const activeConfig = status ? statusMap[status] : null;

    const triggerButton = (
        <button 
            disabled={loading || isAuthLoading}
            className={cn(
                "flex items-center justify-center gap-2 rounded-full px-4 h-8 text-[9px] sm:text-[10px] font-black transition-all shadow-lg active:scale-95 border outline-none focus:outline-none focus:ring-0 whitespace-nowrap flex-shrink-0 cursor-pointer",
                activeConfig 
                    ? activeConfig.color 
                    : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white"
            )}
        >
            {loading ? <Loader2 size={14} className="animate-spin"/> : (activeConfig ? activeConfig.icon : <Plus size={14}/>)}
            <span className="uppercase tracking-wider">{activeConfig ? activeConfig.label : "Add to List"}</span>
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
            <DropdownMenuContent className="min-w-[150px]">
                {Object.keys(statusMap).map((key) => (
                    <DropdownMenuItem 
                        key={key} 
                        onClick={() => handleUpdate(key)} 
                        className={cn(
                            "gap-2 uppercase tracking-wide font-bold",
                            status === key && "text-primary bg-primary/15"
                        )}
                    >
                        {statusMap[key].icon} {statusMap[key].label}
                    </DropdownMenuItem>
                ))}
                
                {status && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleRemove} className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-2 font-bold uppercase tracking-wide focus:bg-rose-500/10">
                            <Trash2 size={14} /> Remove
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
