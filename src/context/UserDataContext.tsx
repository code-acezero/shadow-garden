"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { AnimeService } from '@/lib/api';

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

export const UserDataProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [library, setLibrary] = useState<any[]>([]);
    const [continueData, setContinueData] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const refreshData = useCallback(async () => {
        if (!user) {
            setLibrary([]);
            setContinueData([]);
            setLoadingData(false);
            return;
        }

        setLoadingData(true);
        try {
            const [watchlistRes, continueRes] = await Promise.all([
                supabase.from('watchlist').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
                supabase.from('user_continue_watching').select('*').eq('user_id', user.id).eq('is_completed', false).order('last_updated', { ascending: false })
            ]);

            if (watchlistRes.data) {
                const dbData = watchlistRes.data;
                const enrichedLibrary = dbData.map((item: any) => ({
                    ...item,
                    id: item.anime_id,
                    title: item.anime_title || "Unknown",
                    poster: item.anime_image || "/images/no-poster.png",
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
                
                const enriched = Array.from(uniqueMap.values()).map((item) => ({
                    ...item,
                    id: item.anime_id,
                    anime_id: item.anime_id,
                    title: item.anime_title || "Unknown",
                    poster: item.episode_image || item.anime_image || "/images/no-poster.png",
                    episode: item.episode_number,
                    episodeId: item.episode_id,
                    progress: Math.min(Math.round((item.progress / (item.duration || 1350)) * 100), 100),
                    totalEpisodes: item.total_episodes || "?",
                    type: item.type || "TV",
                    ageRating: item.ageRating || null,
                    isAdult: item.isAdult || false,
                    sub: undefined,
                    dub: undefined
                }));
                setContinueData(enriched);
            }
        } catch (error) {
            console.error('Failed to load user data', error);
        } finally {
            setLoadingData(false);
        }
    }, [user]);

    useEffect(() => {
        refreshData();
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
