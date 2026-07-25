"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { AnimeService } from '@/lib/api';
import { usePathname } from 'next/navigation';
import { formatAnimeTitle } from '@/lib/utils';

interface UserDataContextType {
    library: any[];
    continueData: any[];
    loadingData: boolean;
    refreshData: () => Promise<void>;
    updateLibraryStatus: (animeId: string, newStatus: string) => void;
    addToLibrary: (item: any) => void;
    removeFromLibrary: (animeId: string) => void;
    removeFromContinue: (animeId: string) => void;
    clearContinueData: () => void;
}

const UserDataContext = createContext<UserDataContextType>({
    library: [],
    continueData: [],
    loadingData: true,
    refreshData: async () => {},
    updateLibraryStatus: () => {},
    addToLibrary: () => {},
    removeFromLibrary: () => {},
    removeFromContinue: () => {},
    clearContinueData: () => {}
});

const getValidPoster = (...candidates: any[]) => {
    for (const c of candidates) {
        if (typeof c === 'string' && c.trim() !== '') return c.trim();
    }
    return "/images/no-poster.png";
};

export const UserDataProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const pathname = usePathname();
    const [library, setLibrary] = useState<any[]>([]);
    const [continueData, setContinueData] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const refreshData = useCallback(async (isSilent = false) => {
        if (!user) {
            setLibrary([]);
            try {
                const localData = JSON.parse(localStorage.getItem('shadow_continue_watching') || '{}');
                const items = Object.values(localData).map((item: any) => {
                    const rawProg = typeof item.progress === 'number' ? item.progress : 0;
                    const calculatedProgress = rawProg <= 100 ? rawProg : Math.min(Math.round((rawProg / (item.duration || 1350)) * 100), 100);
                    return {
                        id: item.animeId || item.anime_id,
                        anime_id: item.animeId || item.anime_id,
                        title: formatAnimeTitle(item.title || item.anime_title, item.animeId || item.anime_id),
                        poster: getValidPoster(item.poster, item.episode_image, item.anime_image),
                        episode: item.episodeNumber || item.episode_number || 1,
                        episodeId: item.episodeId || item.episode_id,
                        progress: calculatedProgress,
                        totalEpisodes: item.totalEpisodes || "?",
                        type: item.type || "TV",
                        ageRating: item.ageRating || item.age_rating || (item.isAdult || item.is_adult ? '18+' : null),
                        isAdult: item.isAdult || item.is_adult || false,
                        last_updated: item.lastUpdated ? new Date(item.lastUpdated).toISOString() : new Date().toISOString()
                    };
                });
                items.sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime());
                setContinueData(items);
            } catch (e) {
                setContinueData([]);
            }
            setLoadingData(false);
            return;
        }

        // Only show loading spinner if data is not loaded yet (silent background refresh otherwise)
        if (!isSilent && library.length === 0 && continueData.length === 0) {
            setLoadingData(true);
        }

        try {
            const [watchlistRes, continueRes] = await Promise.all([
                supabase.from('watchlist').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
                supabase.from('user_continue_watching').select('*').eq('user_id', user.id).order('last_updated', { ascending: false })
            ]);

            if (watchlistRes.data) {
                const dbData = watchlistRes.data;
                const enrichedLibrary = dbData.map((item: any) => ({
                    ...item,
                    id: item.anime_id,
                    title: formatAnimeTitle(item.anime_title, item.anime_id),
                    poster: getValidPoster(item.anime_image, item.poster),
                    totalEpisodes: item.total_episodes || "?",
                    type: item.type || "TV",
                    description: item.description || "",
                    ageRating: item.ageRating || null,
                    isAdult: item.isAdult || false,
                    status: item.status,
                    updated_at: item.updated_at
                }));
                setLibrary(enrichedLibrary);
            }
            
            if (continueRes.data) {
                const dbData = continueRes.data;
                const uniqueMap = new Map<string, any>();
                dbData.forEach((item: any) => {
                    if (!uniqueMap.has(item.anime_id)) uniqueMap.set(item.anime_id, item);
                });
                
                const enriched = Array.from(uniqueMap.values()).map((item) => {
                    const rawProg = item.progress || 0;
                    const calculatedProgress = rawProg <= 100 ? rawProg : Math.min(Math.round((rawProg / (item.duration || 1350)) * 100), 100);
                    return {
                        ...item,
                        id: item.anime_id,
                        anime_id: item.anime_id,
                        title: formatAnimeTitle(item.title || item.anime_title, item.anime_id),
                        poster: getValidPoster(item.banner_image, item.episode_image, item.anime_image, item.poster),
                        episode: item.episode_number,
                        episodeId: item.episode_id,
                        progress: calculatedProgress,
                        totalEpisodes: item.total_episodes || "?",
                        type: item.type || "TV",
                        ageRating: item.age_rating || item.ageRating || (item.is_adult || item.isAdult ? '18+' : null),
                        isAdult: item.is_adult || item.isAdult || false,
                        sub: undefined,
                        dub: undefined
                    };
                });
                setContinueData(enriched);
            }
        } catch (error) {
            console.error('Failed to load user data', error);
        } finally {
            setLoadingData(false);
        }
    }, [user, library.length, continueData.length]);

    useEffect(() => {
        refreshData();
    }, [user]);

    useEffect(() => {
        const handleUpdate = () => {
            refreshData(true);
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('shadow-continue-updated', handleUpdate);
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('shadow-continue-updated', handleUpdate);
            }
        };
    }, [refreshData]);

    const updateLibraryStatus = (animeId: string, newStatus: string) => {
        setLibrary(prev => prev.map(item => item.anime_id === animeId ? { ...item, status: newStatus } : item));
    };

    const addToLibrary = (item: any) => {
        setLibrary(prev => {
            const exists = prev.find(i => i.anime_id === item.anime_id);
            if (exists) {
                return prev.map(i => i.anime_id === item.anime_id ? { ...i, status: item.status } : i);
            }
            return [item, ...prev];
        });
    };

    const removeFromLibrary = (animeId: string) => {
        setLibrary(prev => prev.filter(item => item.anime_id !== animeId));
    };

    const removeFromContinue = useCallback((animeId: string) => {
        setContinueData(prev => prev.filter(item => item.anime_id !== animeId));
    }, []);

    const clearContinueData = useCallback(() => {
        setContinueData([]);
    }, []);

    return (
        <UserDataContext.Provider value={{ library, continueData, loadingData, refreshData, updateLibraryStatus, addToLibrary, removeFromLibrary, removeFromContinue, clearContinueData }}>
            {children}
        </UserDataContext.Provider>
    );
};

export const useUserData = () => useContext(UserDataContext);
