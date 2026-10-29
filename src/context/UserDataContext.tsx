"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { AnimeService } from '@/lib/api';
import { usePathname } from 'next/navigation';
import { formatAnimeTitle } from '@/lib/utils';
import { recordDeletedMedia } from '@/lib/anilistSync';

export const isReadingMedia = (type?: string) => {
    if (!type) return false;
    const t = type.toLowerCase();
    return ['manga', 'manhwa', 'manhua', 'light_novel', 'web_novel', 'novel', 'comic', 'webtoon'].includes(t);
};

export interface ReadlistItem {
    id: string;
    anime_id: string;
    title: string;
    anime_title: string;
    poster: string;
    anime_image: string;
    status: 'reading' | 'plan_to_read' | 'completed' | 'on_hold' | 'dropped' | string;
    progress: number;
    chapters_read: number;
    total_chapters?: number | null;
    totalEpisodes?: string | number;
    media_type: string;
    score?: number;
    updated_at: string;
}

export interface ContinueReadingItem {
    id: string;
    manga_id: string;
    title: string;
    cover_image: string;
    chapter_id: string;
    chapter_number: number;
    chapter_title?: string;
    page_progress?: number;
    total_pages?: number;
    media_type: string;
    last_read: string;
}

interface UserDataContextType {
    library: any[];
    watchlist: any[];
    readlist: any[];
    continueData: any[];
    continueReadingData: any[];
    loadingData: boolean;
    refreshData: () => Promise<void>;
    updateLibraryStatus: (animeId: string, newStatus: string) => void;
    addToLibrary: (item: any) => void;
    removeFromLibrary: (animeId: string) => void;
    removeFromContinue: (animeId: string) => void;
    clearContinueData: () => void;

    // Watchlist & Anime methods
    syncWatchingProgress: (item: {
        anime_id: string;
        title: string;
        poster?: string;
        episode_number: number;
        episode_id?: string;
        total_episodes?: number | string | null;
        is_completed?: boolean;
        type?: string;
        media_type?: string;
    }) => Promise<void>;
    updateLibraryProgress: (animeId: string, newEpisode: number, totalEpisodes?: number) => Promise<void>;

    // Readlist methods
    addToReadlist: (item: {
        id: string;
        title: string;
        image?: string;
        poster?: string;
        status?: string;
        media_type?: string;
        progress?: number;
        total_chapters?: number;
    }) => Promise<void>;
    updateReadlistStatus: (mangaId: string, newStatus: string) => Promise<void>;
    updateReadlistProgress: (mangaId: string, newChapter: number, totalChapters?: number) => Promise<void>;
    removeFromReadlist: (mangaId: string) => Promise<void>;
    saveReadingProgress: (item: {
        manga_id: string;
        title: string;
        cover_image?: string;
        chapter_id: string;
        chapter_number: number;
        chapter_title?: string;
        page_progress?: number;
        total_pages?: number;
        total_chapters?: number;
        is_completed?: boolean;
        media_type?: string;
    }) => Promise<void>;
    removeFromContinueReading: (mangaId: string) => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType>({
    library: [],
    watchlist: [],
    readlist: [],
    continueData: [],
    continueReadingData: [],
    loadingData: true,
    refreshData: async () => {},
    updateLibraryStatus: () => {},
    addToLibrary: () => {},
    removeFromLibrary: () => {},
    removeFromContinue: () => {},
    clearContinueData: () => {},

    syncWatchingProgress: async () => {},
    updateLibraryProgress: async () => {},
    addToReadlist: async () => {},
    updateReadlistStatus: async () => {},
    updateReadlistProgress: async () => {},
    removeFromReadlist: async () => {},
    saveReadingProgress: async () => {},
    removeFromContinueReading: async () => {},
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
    const [continueReadingData, setContinueReadingData] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const refreshData = useCallback(async (isSilent = false) => {
        if (!user) {
            // Guest mode: load from localStorage
            try {
                const localReadlist = JSON.parse(localStorage.getItem('shadow_readlist') || '[]');
                const localWatchlist = JSON.parse(localStorage.getItem('shadow_watchlist') || '[]');
                const merged = [...localWatchlist, ...localReadlist];
                setLibrary(merged);
            } catch (e) {
                setLibrary([]);
            }

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

            try {
                const localReading = JSON.parse(localStorage.getItem('shadow_continue_reading') || '{}');
                const readingItems = Object.values(localReading).map((item: any) => ({
                    id: item.manga_id,
                    manga_id: item.manga_id,
                    title: item.title,
                    cover_image: getValidPoster(item.cover_image, item.cover),
                    chapter_id: item.chapter_id,
                    chapter_number: item.chapter_number || 1,
                    chapter_title: item.chapter_title || '',
                    page_progress: item.page_progress || 1,
                    total_pages: item.total_pages || 1,
                    media_type: item.media_type || 'manga',
                    last_read: item.last_read || new Date().toISOString()
                }));
                readingItems.sort((a, b) => new Date(b.last_read).getTime() - new Date(a.last_read).getTime());
                setContinueReadingData(readingItems);
            } catch (e) {
                setContinueReadingData([]);
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
                const enrichedLibrary = dbData.map((item: any) => {
                    const isRead = isReadingMedia(item.media_type || item.type);
                    return {
                        ...item,
                        id: item.anime_id,
                        title: formatAnimeTitle(item.anime_title, item.anime_id),
                        poster: getValidPoster(item.anime_image, item.poster),
                        totalEpisodes: item.total_episodes || item.total_chapters || "?",
                        total_episodes: item.total_episodes || item.total_chapters || "?",
                        total_chapters: item.total_chapters || item.total_episodes || null,
                        chapters_read: item.chapters_read || item.last_episode_number || item.progress || 0,
                        progress: isRead ? (item.chapters_read || item.progress || 0) : (item.last_episode_number || item.progress || 0),
                        media_type: item.media_type || item.type || "anime",
                        type: item.type || item.media_type || (isRead ? "MANGA" : "TV"),
                        description: item.description || "",
                        ageRating: item.ageRating || null,
                        isAdult: item.isAdult || false,
                        status: item.status,
                        updated_at: item.updated_at
                    };
                });
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

            // Try to load user_continue_reading (with graceful fallback if table not yet migrated)
            try {
                const readingRes = await supabase
                    .from('user_continue_reading')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('last_read', { ascending: false });

                if (readingRes.data) {
                    setContinueReadingData(readingRes.data);
                }
            } catch (err) {
                // Table might not exist yet before SQL execution
                console.warn('user_continue_reading check skipped:', err);
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
            window.addEventListener('shadow-readlist-updated', handleUpdate);
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('shadow-continue-updated', handleUpdate);
                window.removeEventListener('shadow-readlist-updated', handleUpdate);
            }
        };
    }, [refreshData]);

    // ─── WATCHLIST HELPERS ───────────────────────────────────────────────────
    const watchlist = useMemo(() => {
        return library.filter(i => !isReadingMedia(i.media_type));
    }, [library]);

    const readlist = useMemo(() => {
        return library.filter(i => isReadingMedia(i.media_type));
    }, [library]);

    const updateLibraryStatus = useCallback((animeId: string, newStatus: string) => {
        setLibrary(prev => prev.map(item => (item.anime_id === animeId || item.id === animeId) ? { ...item, status: newStatus } : item));

        if (user) {
            supabase
                .from('watchlist')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('user_id', user.id)
                .eq('anime_id', animeId)
                .then(() => {})
                .catch((err: any) => console.error("Failed to update status in Supabase:", err));
        } else {
            try {
                const target = library.find(i => (i.anime_id === animeId || i.id === animeId));
                const isRead = target ? isReadingMedia(target.media_type) : false;
                const storageKey = isRead ? 'shadow_readlist' : 'shadow_watchlist';
                const current = JSON.parse(localStorage.getItem(storageKey) || '[]');
                const updated = current.map((x: any) => (x.id || x.anime_id) === animeId ? { ...x, status: newStatus } : x);
                localStorage.setItem(storageKey, JSON.stringify(updated));
            } catch (_) {}
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('shadow-watchlist-updated'));
            window.dispatchEvent(new CustomEvent('shadow-readlist-updated'));
        }
    }, [user, library]);

    const addToLibrary = useCallback((item: any) => {
        const id = item.anime_id || item.id;
        const isRead = isReadingMedia(item.media_type || item.type);
        setLibrary(prev => {
            const exists = prev.find(i => (i.anime_id === id || i.id === id));
            if (exists) {
                return prev.map(i => (i.anime_id === id || i.id === id) ? { ...i, ...item } : i);
            }
            return [item, ...prev];
        });

        if (!user) {
            try {
                const storageKey = isRead ? 'shadow_readlist' : 'shadow_watchlist';
                const current = JSON.parse(localStorage.getItem(storageKey) || '[]');
                const filtered = current.filter((x: any) => (x.id || x.anime_id) !== id);
                filtered.unshift(item);
                localStorage.setItem(storageKey, JSON.stringify(filtered));
            } catch (_) {}
        }
    }, [user]);

    const removeFromLibrary = useCallback((animeId: string) => {
        setLibrary(prev => prev.filter(item => item.anime_id !== animeId && item.id !== animeId));
        recordDeletedMedia(animeId);

        if (user) {
            supabase
                .from('watchlist')
                .delete()
                .eq('user_id', user.id)
                .eq('anime_id', animeId)
                .then(() => {})
                .catch((err: any) => console.error("Failed to delete from Supabase:", err));
        } else {
            try {
                const currentWatch = JSON.parse(localStorage.getItem('shadow_watchlist') || '[]');
                const filteredWatch = currentWatch.filter((x: any) => (x.id || x.anime_id) !== animeId);
                localStorage.setItem('shadow_watchlist', JSON.stringify(filteredWatch));

                const currentRead = JSON.parse(localStorage.getItem('shadow_readlist') || '[]');
                const filteredRead = currentRead.filter((x: any) => (x.id || x.anime_id) !== animeId);
                localStorage.setItem('shadow_readlist', JSON.stringify(filteredRead));
            } catch (_) {}
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('shadow-watchlist-updated'));
            window.dispatchEvent(new CustomEvent('shadow-readlist-updated'));
        }
    }, [user]);

    const updateLibraryProgress = useCallback(async (animeId: string, newEpisode: number, totalEpisodes?: number) => {
        const isCompleted = !!(totalEpisodes && totalEpisodes > 0 && newEpisode >= totalEpisodes);
        let newStatus: string | undefined = undefined;

        setLibrary(prev => prev.map(item => {
            if (item.anime_id === animeId || item.id === animeId) {
                const updatedStatus = isCompleted ? 'completed' : (item.status === 'plan_to_watch' ? 'watching' : item.status);
                newStatus = updatedStatus;
                return {
                    ...item,
                    last_episode_number: newEpisode,
                    progress: newEpisode,
                    status: updatedStatus
                };
            }
            return item;
        }));

        if (user) {
            try {
                const payload: any = {
                    last_episode_number: newEpisode,
                    updated_at: new Date().toISOString()
                };
                if (newStatus) payload.status = newStatus;
                if (totalEpisodes) payload.total_episodes = totalEpisodes;

                await supabase
                    .from('watchlist')
                    .update(payload)
                    .eq('user_id', user.id)
                    .eq('anime_id', animeId);
            } catch (err) {
                console.error("Failed to update episode progress in Supabase:", err);
            }
        } else {
            try {
                const current = JSON.parse(localStorage.getItem('shadow_watchlist') || '[]');
                const updated = current.map((x: any) => (x.id || x.anime_id) === animeId ? {
                    ...x,
                    last_episode_number: newEpisode,
                    progress: newEpisode,
                    status: isCompleted ? 'completed' : (x.status === 'plan_to_watch' ? 'watching' : x.status)
                } : x);
                localStorage.setItem('shadow_watchlist', JSON.stringify(updated));
            } catch (_) {}
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('shadow-watchlist-updated'));
            if (isCompleted) {
                window.dispatchEvent(new CustomEvent('shadow-whisper', {
                    detail: {
                        id: Date.now(),
                        type: 'success',
                        title: "Mission Accomplished! 🎉",
                        message: `Anime finished! Moved to your Completed list.`
                    }
                }));
            }
        }
    }, [user]);

    const syncWatchingProgress = useCallback(async (item: {
        anime_id: string;
        title: string;
        poster?: string;
        episode_number: number;
        episode_id?: string;
        total_episodes?: number | string | null;
        is_completed?: boolean;
        type?: string;
        media_type?: string;
    }) => {
        if (!item || !item.anime_id) return;
        const animeId = item.anime_id;
        const epNum = Number(item.episode_number) || 1;
        const rawTotal = item.total_episodes ? parseInt(String(item.total_episodes), 10) : null;
        const totalEps = (rawTotal && !isNaN(rawTotal) && rawTotal > 0) ? rawTotal : null;
        const poster = getValidPoster(item.poster);
        const title = item.title;
        const mediaType = item.media_type || (item.type?.toLowerCase() === 'movie' ? 'movie' : 'anime');

        const isMovie = mediaType === 'movie' || item.type?.toLowerCase() === 'movie' || totalEps === 1;
        const isSeriesFinished = !!(item.is_completed && (isMovie || (totalEps && epNum >= totalEps)));

        const existing = library.find(i => (i.anime_id === animeId || i.id === animeId));
        const prevEp = Number(existing?.last_episode_number || existing?.progress || 0);
        const newEp = Math.max(epNum, prevEp);

        let newStatus = existing?.status || 'watching';
        if (isSeriesFinished) {
            newStatus = 'completed';
        } else if (!existing) {
            newStatus = 'watching';
        } else if (existing.status === 'plan_to_watch') {
            newStatus = 'watching';
        }

        // Avoid re-writing to Supabase/localStorage if unchanged
        if (existing && existing.last_episode_number === newEp && existing.status === newStatus) {
            return;
        }

        const isNewlyCompleted = newStatus === 'completed' && existing?.status !== 'completed';

        const updatedItem = {
            ...(existing || {}),
            id: animeId,
            anime_id: animeId,
            title: title || existing?.title || 'Anime',
            anime_title: title || existing?.anime_title || 'Anime',
            poster: poster || existing?.poster,
            anime_image: poster || existing?.anime_image,
            status: newStatus,
            progress: newEp,
            last_episode_number: newEp,
            total_episodes: totalEps || existing?.total_episodes || null,
            totalEpisodes: totalEps || existing?.totalEpisodes || "?",
            media_type: mediaType,
            type: (item.type || existing?.type || (isMovie ? 'MOVIE' : 'TV')).toUpperCase(),
            updated_at: new Date().toISOString()
        };

        setLibrary(prev => {
            const found = prev.some(x => (x.anime_id === animeId || x.id === animeId));
            if (found) {
                return prev.map(x => (x.anime_id === animeId || x.id === animeId) ? { ...x, ...updatedItem } : x);
            }
            return [updatedItem, ...prev];
        });

        if (user) {
            try {
                await supabase.from('watchlist').upsert({
                    user_id: user.id,
                    anime_id: animeId,
                    anime_title: updatedItem.anime_title,
                    anime_image: updatedItem.anime_image,
                    status: newStatus,
                    last_episode_number: newEp,
                    total_episodes: totalEps || existing?.total_episodes || null,
                    media_type: mediaType,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id, anime_id' });
            } catch (err) {
                console.error("Failed to sync watchlist to Supabase:", err);
            }
        } else {
            try {
                const current = JSON.parse(localStorage.getItem('shadow_watchlist') || '[]');
                const filtered = current.filter((x: any) => (x.id || x.anime_id) !== animeId);
                filtered.unshift(updatedItem);
                localStorage.setItem('shadow_watchlist', JSON.stringify(filtered));
            } catch (_) {}
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('shadow-watchlist-updated'));
            if (isNewlyCompleted) {
                window.dispatchEvent(new CustomEvent('shadow-whisper', {
                    detail: {
                        id: Date.now(),
                        type: 'success',
                        title: "Mission Accomplished! 🎉",
                        message: `Completed "${title}"! Moved to your Completed list.`
                    }
                }));
            }
        }
    }, [user, library]);

    const removeFromContinue = useCallback((animeId: string) => {
        setContinueData(prev => prev.filter(item => item.anime_id !== animeId));
    }, []);

    const clearContinueData = useCallback(() => {
        setContinueData([]);
    }, []);

    // ─── READLIST OPERATIONS ─────────────────────────────────────────────────
    const addToReadlist = useCallback(async (item: {
        id: string;
        title: string;
        image?: string;
        poster?: string;
        status?: string;
        media_type?: string;
        progress?: number;
        total_chapters?: number;
    }) => {
        const mangaId = item.id;
        const status = item.status || 'reading';
        const mediaType = item.media_type || 'manga';
        const cover = getValidPoster(item.image, item.poster);
        const progress = item.progress || 0;

        const optimisticItem = {
            id: mangaId,
            anime_id: mangaId,
            title: item.title,
            anime_title: item.title,
            poster: cover,
            anime_image: cover,
            status,
            progress,
            chapters_read: progress,
            last_episode_number: progress,
            total_chapters: item.total_chapters || null,
            total_episodes: item.total_chapters || null,
            media_type: mediaType,
            type: mediaType.toUpperCase(),
            updated_at: new Date().toISOString()
        };

        addToLibrary(optimisticItem);

        if (user) {
            try {
                await supabase.from('watchlist').upsert({
                    user_id: user.id,
                    anime_id: mangaId,
                    anime_title: item.title,
                    anime_image: cover,
                    status,
                    chapters_read: progress,
                    last_episode_number: progress,
                    total_chapters: item.total_chapters || null,
                    media_type: mediaType,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id, anime_id' });
            } catch (err) {
                console.error("Failed to sync readlist to Supabase:", err);
            }
        } else {
            // Guest mode
            try {
                const current = JSON.parse(localStorage.getItem('shadow_readlist') || '[]');
                const filtered = current.filter((x: any) => (x.id || x.anime_id) !== mangaId);
                filtered.unshift(optimisticItem);
                localStorage.setItem('shadow_readlist', JSON.stringify(filtered));
            } catch (_) {}
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('shadow-readlist-updated'));
            window.dispatchEvent(new CustomEvent('shadow-whisper', {
                detail: { id: Date.now(), type: 'success', title: "Readlist Updated", message: `Saved "${item.title}" to Readlist` }
            }));
        }
    }, [user]);

    const updateReadlistStatus = useCallback(async (mangaId: string, newStatus: string) => {
        updateLibraryStatus(mangaId, newStatus);

        if (user) {
            try {
                await supabase
                    .from('watchlist')
                    .update({ status: newStatus, updated_at: new Date().toISOString() })
                    .eq('user_id', user.id)
                    .eq('anime_id', mangaId);
            } catch (err) {
                console.error("Failed to update readlist status:", err);
            }
        } else {
            try {
                const current = JSON.parse(localStorage.getItem('shadow_readlist') || '[]');
                const updated = current.map((x: any) => (x.id || x.anime_id) === mangaId ? { ...x, status: newStatus } : x);
                localStorage.setItem('shadow_readlist', JSON.stringify(updated));
            } catch (_) {}
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('shadow-readlist-updated'));
        }
    }, [user]);

    const updateReadlistProgress = useCallback(async (mangaId: string, newChapter: number, totalChapters?: number) => {
        const isCompleted = !!(totalChapters && totalChapters > 0 && newChapter >= totalChapters);
        let newStatus: string | undefined = undefined;

        setLibrary(prev => prev.map(item => {
            if (item.anime_id === mangaId || item.id === mangaId) {
                const updatedStatus = isCompleted ? 'completed' : (item.status === 'plan_to_read' ? 'reading' : item.status);
                newStatus = updatedStatus;
                return {
                    ...item,
                    chapters_read: newChapter,
                    last_episode_number: newChapter,
                    progress: newChapter,
                    status: updatedStatus
                };
            }
            return item;
        }));

        if (user) {
            try {
                const payload: any = {
                    chapters_read: newChapter,
                    last_episode_number: newChapter,
                    updated_at: new Date().toISOString()
                };
                if (newStatus) payload.status = newStatus;
                if (totalChapters) payload.total_chapters = totalChapters;

                await supabase
                    .from('watchlist')
                    .update(payload)
                    .eq('user_id', user.id)
                    .eq('anime_id', mangaId);
            } catch (err) {
                console.error("Failed to update chapter progress:", err);
            }
        } else {
            try {
                const current = JSON.parse(localStorage.getItem('shadow_readlist') || '[]');
                const updated = current.map((x: any) => (x.id || x.anime_id) === mangaId ? {
                    ...x,
                    chapters_read: newChapter,
                    progress: newChapter,
                    status: isCompleted ? 'completed' : (x.status === 'plan_to_read' ? 'reading' : x.status)
                } : x);
                localStorage.setItem('shadow_readlist', JSON.stringify(updated));
            } catch (_) {}
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('shadow-readlist-updated'));
            if (isCompleted) {
                window.dispatchEvent(new CustomEvent('shadow-whisper', {
                    detail: {
                        id: Date.now(),
                        type: 'success',
                        title: "Mission Accomplished! 📚",
                        message: `Reading completed! Moved to your Completed list.`
                    }
                }));
            }
        }
    }, [user]);

    const removeFromReadlist = useCallback(async (mangaId: string) => {
        removeFromLibrary(mangaId);

        if (user) {
            try {
                await supabase
                    .from('watchlist')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('anime_id', mangaId);
            } catch (err) {
                console.error("Failed to remove from readlist:", err);
            }
        } else {
            try {
                const current = JSON.parse(localStorage.getItem('shadow_readlist') || '[]');
                const updated = current.filter((x: any) => (x.id || x.anime_id) !== mangaId);
                localStorage.setItem('shadow_readlist', JSON.stringify(updated));
            } catch (_) {}
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('shadow-readlist-updated'));
            window.dispatchEvent(new CustomEvent('shadow-whisper', {
                detail: { id: Date.now(), type: 'success', title: "Readlist Archive", message: "Removed item from Readlist" }
            }));
        }
    }, [user]);

    const saveReadingProgress = useCallback(async (item: {
        manga_id: string;
        title: string;
        cover_image?: string;
        chapter_id: string;
        chapter_number: number;
        chapter_title?: string;
        page_progress?: number;
        total_pages?: number;
        total_chapters?: number;
        is_completed?: boolean;
        media_type?: string;
    }) => {
        if (!item || !item.manga_id) return;
        const mangaId = item.manga_id;
        const chapNum = Number(item.chapter_number) || 1;
        const rawTotalChaps = item.total_chapters ? parseInt(String(item.total_chapters), 10) : null;
        const totalChaps = (rawTotalChaps && !isNaN(rawTotalChaps) && rawTotalChaps > 0) ? rawTotalChaps : null;
        const cover = getValidPoster(item.cover_image);
        const title = item.title;
        const mediaType = item.media_type || 'manga';

        // 1. Continue Reading entry
        const record = {
            id: mangaId,
            manga_id: mangaId,
            title: title,
            cover_image: cover,
            chapter_id: item.chapter_id,
            chapter_number: chapNum,
            chapter_title: item.chapter_title || '',
            page_progress: item.page_progress || 1,
            total_pages: item.total_pages || 1,
            media_type: mediaType,
            last_read: new Date().toISOString()
        };

        setContinueReadingData(prev => {
            const filtered = prev.filter(x => x.manga_id !== mangaId);
            return [record, ...filtered];
        });

        try {
            const current = JSON.parse(localStorage.getItem('shadow_continue_reading') || '{}');
            current[mangaId] = record;
            localStorage.setItem('shadow_continue_reading', JSON.stringify(current));
        } catch (_) {}

        if (user) {
            try {
                await supabase.from('user_continue_reading').upsert({
                    user_id: user.id,
                    manga_id: mangaId,
                    title: title,
                    cover_image: record.cover_image,
                    chapter_id: item.chapter_id,
                    chapter_number: chapNum,
                    chapter_title: item.chapter_title,
                    page_progress: item.page_progress || 1,
                    total_pages: item.total_pages || 1,
                    media_type: mediaType,
                    last_read: new Date().toISOString()
                }, { onConflict: 'user_id, manga_id' });
            } catch (err) {}
        }

        // 2. Readlist Auto-Update & Completion Detection
        const isReadingFinished = !!(item.is_completed || (totalChaps && chapNum >= totalChaps && item.is_completed));

        const existing = library.find(i => (i.anime_id === mangaId || i.id === mangaId));
        const prevChap = Number(existing?.chapters_read || existing?.progress || 0);
        const newChap = Math.max(chapNum, prevChap);

        let newStatus = existing?.status || 'reading';
        if (isReadingFinished) {
            newStatus = 'completed';
        } else if (!existing) {
            newStatus = 'reading';
        } else if (existing.status === 'plan_to_read') {
            newStatus = 'reading';
        }

        const isNewlyCompleted = newStatus === 'completed' && existing?.status !== 'completed';

        const updatedReadlistItem = {
            ...(existing || {}),
            id: mangaId,
            anime_id: mangaId,
            title: title || existing?.title || 'Manga',
            anime_title: title || existing?.anime_title || 'Manga',
            poster: cover || existing?.poster,
            anime_image: cover || existing?.anime_image,
            status: newStatus,
            progress: newChap,
            chapters_read: newChap,
            last_episode_number: newChap,
            total_chapters: totalChaps || existing?.total_chapters || null,
            total_episodes: totalChaps || existing?.total_episodes || null,
            media_type: mediaType,
            type: mediaType.toUpperCase(),
            updated_at: new Date().toISOString()
        };

        setLibrary(prev => {
            const found = prev.some(x => (x.anime_id === mangaId || x.id === mangaId));
            if (found) {
                return prev.map(x => (x.anime_id === mangaId || x.id === mangaId) ? { ...x, ...updatedReadlistItem } : x);
            }
            return [updatedReadlistItem, ...prev];
        });

        if (user) {
            try {
                await supabase.from('watchlist').upsert({
                    user_id: user.id,
                    anime_id: mangaId,
                    anime_title: updatedReadlistItem.anime_title,
                    anime_image: updatedReadlistItem.anime_image,
                    status: newStatus,
                    chapters_read: newChap,
                    last_episode_number: newChap,
                    total_chapters: totalChaps || existing?.total_chapters || null,
                    media_type: mediaType,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id, anime_id' });
            } catch (err) {
                console.error("Failed to sync readlist to Supabase:", err);
            }
        } else {
            try {
                const current = JSON.parse(localStorage.getItem('shadow_readlist') || '[]');
                const filtered = current.filter((x: any) => (x.id || x.anime_id) !== mangaId);
                filtered.unshift(updatedReadlistItem);
                localStorage.setItem('shadow_readlist', JSON.stringify(filtered));
            } catch (_) {}
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('shadow-readlist-updated'));
            window.dispatchEvent(new CustomEvent('shadow-continue-updated'));
            if (isNewlyCompleted) {
                window.dispatchEvent(new CustomEvent('shadow-whisper', {
                    detail: {
                        id: Date.now(),
                        type: 'success',
                        title: "Tome Completed! 🎉",
                        message: `Finished reading "${title}"! Moved to your Completed list.`
                    }
                }));
            }
        }
    }, [user, library]);

    const removeFromContinueReading = useCallback(async (mangaId: string) => {
        setContinueReadingData(prev => prev.filter(x => x.manga_id !== mangaId));
        try {
            const current = JSON.parse(localStorage.getItem('shadow_continue_reading') || '{}');
            delete current[mangaId];
            localStorage.setItem('shadow_continue_reading', JSON.stringify(current));
        } catch (_) {}

        if (user) {
            try {
                await supabase
                    .from('user_continue_reading')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('manga_id', mangaId);
            } catch (_) {}
        }
    }, [user]);

    // Global listener for sync events across players, readers, and UI actions
    useEffect(() => {
        const handleSyncWatching = (e: any) => {
            if (e.detail) syncWatchingProgress(e.detail);
        };
        const handleSyncReading = (e: any) => {
            if (e.detail) saveReadingProgress(e.detail);
        };
        const handleWatchlistUpdated = () => {
            refreshData(true);
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('shadow-sync-watching', handleSyncWatching);
            window.addEventListener('shadow-sync-reading', handleSyncReading);
            window.addEventListener('shadow-watchlist-updated', handleWatchlistUpdated);
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('shadow-sync-watching', handleSyncWatching);
                window.removeEventListener('shadow-sync-reading', handleSyncReading);
                window.removeEventListener('shadow-watchlist-updated', handleWatchlistUpdated);
            }
        };
    }, [syncWatchingProgress, saveReadingProgress, refreshData]);

    return (
        <UserDataContext.Provider value={{
            library,
            watchlist,
            readlist,
            continueData,
            continueReadingData,
            loadingData,
            refreshData,
            updateLibraryStatus,
            addToLibrary,
            removeFromLibrary,
            removeFromContinue,
            clearContinueData,
            syncWatchingProgress,
            updateLibraryProgress,
            addToReadlist,
            updateReadlistStatus,
            updateReadlistProgress,
            removeFromReadlist,
            saveReadingProgress,
            removeFromContinueReading
        }}>
            {children}
        </UserDataContext.Provider>
    );
};

export const useUserData = () => useContext(UserDataContext);
