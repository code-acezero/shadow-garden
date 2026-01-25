"use client";

import React, { useState, useEffect } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { supabase, AnimeService } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

// Tactical schema matching the database structure
interface ContinueWatchingRow {
  anime_id: string;
  anime_title?: string;
  episode_id: string;
  episode_number: number;
  progress: number;
  last_updated: string;
  episode_image: string;
  total_episodes: number;
  type: string;
  is_completed: boolean;
}

export default function ContinueWatching() {
    const { user, isLoading: authLoading } = useAuth();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProgressWithMetadata = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // Querying strictly based on your last_updated schema
                const { data: dbData, error } = await supabase
                    .from('user_continue_watching')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('is_completed', false) 
                    .order('last_updated', { ascending: false });

                if (error) throw error;

                // Unique Mission Logic: One entry per anime ID
                const uniqueMissions = new Map<string, ContinueWatchingRow>();
                if (dbData) {
                    (dbData as ContinueWatchingRow[]).forEach((item) => {
                        if (!uniqueMissions.has(item.anime_id)) {
                            uniqueMissions.set(item.anime_id, item);
                        }
                    });
                }

                const missionArray = Array.from(uniqueMissions.values()).slice(0, 6);

                // QTIP Data Enrichment
                const enrichedItems = await Promise.all(missionArray.map(async (item: ContinueWatchingRow) => {
                    try {
                        const info = await AnimeService.getAnimeInfo(item.anime_id) as any;
                        if (!info) throw new Error("Info offline");

                        const currentEpisode = info.episodes?.find((ep: any) => ep.number === item.episode_number);
                        const progressPercent = Math.min(Math.round((item.progress / 1440) * 100), 100);

                        // Tactical Age Tag Logic
                        const rawRating = info.rating || '13+';
                        const formattedRating = rawRating.replace('13+', 'PG-13');

                        return {
                            id: item.anime_id,
                            title: info.title?.english || info.title?.userPreferred || info.title?.romaji || item.anime_id,
                            episodeTitle: currentEpisode?.title || `Episode ${item.episode_number}`,
                            poster: item.episode_image || info.image || info.poster,
                            episode: item.episode_number,
                            totalEpisodes: info.totalEpisodes || item.total_episodes || '??',
                            progress: progressPercent,
                            type: info.type || item.type || 'TV',
                            ageRating: formattedRating,
                            episodeId: item.episode_id
                        };
                    } catch (apiErr) {
                        return {
                            id: item.anime_id,
                            title: item.anime_id.replace(/-/g, ' ').toUpperCase(),
                            episodeTitle: `Episode ${item.episode_number}`,
                            poster: item.episode_image,
                            episode: item.episode_number,
                            totalEpisodes: item.total_episodes || '??',
                            progress: 0,
                            type: item.type || 'TV',
                            ageRating: 'PG-13'
                        };
                    }
                }));

                setItems(enrichedItems);
            } catch (e: any) {
                console.error("Shadow Garden Q-Tip Failure:", e.message);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) fetchProgressWithMetadata();
    }, [user, authLoading]);

    if (!user || items.length === 0) return null;

    return (
        <section className="relative animate-in fade-in slide-in-from-left-6 duration-1000">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-violet-600 to-red-600 shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                            Continue <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-red-500">Journey</span>
                        </h2>
                        <span className="text-[10px] text-zinc-500 font-bold tracking-[0.3em] uppercase">Tactical Progress Synced</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48 bg-white/5 rounded-2xl border border-white/5">
                    <Loader2 className="animate-spin text-violet-500 w-8 h-8" />
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {items.map((anime) => (
                        <div key={anime.id} className="relative aspect-[2/3] group overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/20 shadow-xl transition-all duration-300 hover:border-red-500/30">
                            
                            <img 
                                src={anime.poster} 
                                alt={anime.title}
                                className="absolute inset-0 w-full h-full object-cover select-none transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                            />

                            {/* --- TOP CAPSULE HUD --- */}
                            <div className="absolute top-2 left-2 z-20">
                                <div className="px-3 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
                                    <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">{anime.type}</span>
                                </div>
                            </div>

                            <div className="absolute top-2 right-2 z-20">
                                <div className="px-3 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
                                    <span className="text-[8px] font-black text-white/80 uppercase">{anime.ageRating}</span>
                                </div>
                            </div>

                            {/* Fade Blend HUD Background */}
                            <div 
                                className="absolute bottom-0 left-0 right-0 h-[30%] z-10 pointer-events-none bg-gradient-to-t from-black/95 via-black/80 to-transparent backdrop-blur-[6px]"
                                style={{
                                    maskImage: 'linear-gradient(to top, black 60%, transparent 100%)',
                                    WebkitMaskImage: 'linear-gradient(to top, black 60%, transparent 100%)'
                                }}
                            />

                            {/* Q-TIP Data Intel */}
                            <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                                <p className="text-[9px] font-bold text-violet-400 uppercase tracking-[0.2em] line-clamp-1 italic">
                                    {anime.episodeTitle}
                                </p>
                            </div>

                            {/* BOTTOM CONTENT HUD */}
                            <div className="absolute bottom-2.5 left-0 right-0 px-3 z-20 pointer-events-none flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-950/70 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                                        <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-red-200 tracking-tighter italic">{anime.episode}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[9px] font-black text-white/40 tracking-widest">{anime.totalEpisodes}</span>
                                    </div>
                                </div>

                                <h3 className="text-[11px] font-black text-white uppercase tracking-tighter truncate drop-shadow-md leading-none">
                                    {anime.title}
                                </h3>
                            </div>

                            {/* Progress Pulse Line */}
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black/60 z-30">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${anime.progress}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-violet-600 to-red-600 relative"
                                />
                            </div>

                            {/* Play Action Hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-900/10 to-red-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center z-40">
                                <div className="bg-red-600 p-2.5 rounded-full shadow-[0_0_25px_rgba(220,38,38,0.4)] transform scale-50 group-hover:scale-100 transition-transform duration-500 cursor-pointer pointer-events-auto">
                                    <Play size={18} className="fill-white text-white ml-0.5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}