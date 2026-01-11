"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Plus, Eye, CheckCircle, XCircle, Clock, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // IMPORT USEAUTH
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
}

export default function WatchListButton({ animeId, animeTitle, animeImage, currentEp }: WatchListButtonProps) {
    const { user, isLoading: isAuthLoading } = useAuth(); // USE GLOBAL AUTH
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Status Configurations
    const statusMap: any = {
        "watching": { label: "Watching", icon: <Eye size={14}/>, color: "text-green-400 border-green-500/20 bg-green-500/10" },
        "completed": { label: "Completed", icon: <CheckCircle size={14}/>, color: "text-blue-400 border-blue-500/20 bg-blue-500/10" },
        "plan_to_watch": { label: "Planning", icon: <Clock size={14}/>, color: "text-purple-400 border-purple-500/20 bg-purple-500/10" },
        "on_hold": { label: "On Hold", icon: <Clock size={14}/>, color: "text-yellow-400 border-yellow-500/20 bg-yellow-500/10" },
        "dropped": { label: "Dropped", icon: <XCircle size={14}/>, color: "text-red-400 border-red-500/20 bg-red-500/10" },
    };

    // 1. Initial Check: Is this anime in the user's DB?
    useEffect(() => {
        let isMounted = true;

        const checkStatus = async () => {
            if (!supabase || !user) return; // Wait for user to exist

            try {
                // Using correct table 'watchlist'
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
                // Ignore AbortError silently
                if (err.name === 'AbortError') return;
                console.error("WatchList Check Error:", err);
            }
        };

        if (!isAuthLoading) {
            checkStatus();
        }

        return () => { isMounted = false; };
    }, [animeId, user, isAuthLoading]); // Re-run when User loads

    // 2. Handle Add / Update Status
    const handleUpdate = async (newStatus: string) => {
        if (!supabase) return;
        if (!user) { toast.error("Log in to track your journey."); return; }
        
        setLoading(true);

        try {
            const { error } = await supabase
                .from('watchlist') 
                .upsert({
                    user_id: user.id,
                    anime_id: animeId,
                    status: newStatus,
                    anime_title: animeTitle,
                    anime_image: animeImage,
                    last_episode_number: currentEp || 1, 
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id, anime_id' });

            if (error) throw error;

            setStatus(newStatus);
            toast.success(`Moved to ${statusMap[newStatus].label}`);
        } catch (err: any) {
            console.error("Supabase Update Error:", err); 
            toast.error("Failed to update status");
        } finally {
            setLoading(false);
        }
    };

    // 3. Handle Remove
    const handleRemove = async () => {
        if (!supabase || !user) return;
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

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button 
                    disabled={loading || isAuthLoading}
                    className={cn(
                        "flex items-center gap-2 rounded-full px-4 h-8 text-[10px] font-bold transition-all shadow-lg active:scale-95 border",
                        activeConfig 
                            ? activeConfig.color 
                            : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white"
                    )}
                >
                    {loading ? <Loader2 size={14} className="animate-spin"/> : (activeConfig ? activeConfig.icon : <Plus size={14}/>)}
                    <span className="uppercase tracking-wider">{activeConfig ? activeConfig.label : "Add to List"}</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0a0a0a] border-white/10 text-zinc-300 z-[100] shadow-2xl shadow-red-900/20 min-w-[150px]">
                {Object.keys(statusMap).map((key) => (
                    <DropdownMenuItem 
                        key={key} 
                        onClick={() => handleUpdate(key)} 
                        className={cn(
                            "text-xs cursor-pointer hover:bg-white/5 gap-2 uppercase tracking-wide font-bold",
                            status === key && "text-red-500 bg-red-900/10"
                        )}
                    >
                        {statusMap[key].icon} {statusMap[key].label}
                    </DropdownMenuItem>
                ))}
                
                {status && (
                    <>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem onClick={handleRemove} className="text-xs cursor-pointer text-red-500 hover:bg-red-900/20 gap-2 font-bold uppercase tracking-wide">
                            <Trash2 size={14} /> Remove
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}