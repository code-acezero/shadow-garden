"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { useAuth } from '@/context/AuthContext';
import { useTravellerProfile, saveTravellerProfile } from '@/hooks/useTravellerProfile';
import AuthModal from '@/components/Auth/AuthModal';
import AvatarSelectorModal, { getRandomGuestName } from '@/components/User/AvatarSelectorModal';
import { 
    ThumbsUp, ThumbsDown, MoreVertical, Flag, Trash2, Edit2, 
    ChevronDown, ChevronUp, Bold, Italic, Strikethrough, EyeOff, ArrowUpDown, 
    X, Check, CornerDownRight, Smile, Image as ImageIcon, Search,
    Sticker, Share2, Link2, Copy, Flame, MessageSquare, Loader2,
    Clock, RefreshCw, ExternalLink, Maximize2, Heart, Film
} from 'lucide-react';
import { RoleTitleBadge } from '@/components/ui/RoleTitleBadge';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link'; 
import { usePathname, useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { RenderMentions, processMentionsAndNotify } from '@/lib/mentions';

// --- TYPES ---
export interface CommentProfile {
    id?: string;
    username: string;
    avatar_url: string | null;
    full_name: string | null;
    role?: string;
    admin_title?: string;
}

export interface Comment {
    id: string;
    content: string;
    user_id: string;
    parent_id: string | null;
    created_at: string;
    is_spoiler: boolean;
    is_edited: boolean;
    is_pinned?: boolean;
    profiles?: CommentProfile;
    replies?: Comment[];
    replyingToName?: string;
    likes_count?: number;
}

export type PageThemeKey = 'shorts' | 'donghua' | 'hindi' | 'movies' | 'drama' | 'stream' | 'anime' | 'youtube' | 'auto';

export interface PageThemeStyles {
    name: string;
    buttonActive: string;
    focusUnderline: string;
    focusBorder: string;
    accentText: string;
    activeChipBg: string;
    borderAccent: string;
    trayTabActive: string;
}

export const PAGE_THEMES: Record<string, PageThemeStyles> = {
    // 1. Shorts Watch: YouTube Shorts Crimson / Red
    shorts: {
        name: 'Shorts',
        buttonActive: 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.45)]',
        focusUnderline: 'bg-red-500',
        focusBorder: 'focus:border-red-500',
        accentText: 'text-red-400 hover:text-red-300',
        activeChipBg: 'bg-red-600/20 text-red-400 border-red-500/40',
        borderAccent: 'border-red-500',
        trayTabActive: 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.4)]',
    },
    // 2. Donghua Watch: Signature Jade / Emerald
    donghua: {
        name: 'Donghua',
        buttonActive: 'bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-[0_0_15px_rgba(16,185,129,0.45)]',
        focusUnderline: 'bg-emerald-400',
        focusBorder: 'focus:border-emerald-400',
        accentText: 'text-emerald-400 hover:text-emerald-300',
        activeChipBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        borderAccent: 'border-emerald-500',
        trayTabActive: 'bg-emerald-500 text-black font-bold shadow-[0_0_10px_rgba(16,185,129,0.4)]',
    },
    // 3. Hindi Watch: Hindi Dub Saffron / Warm Orange
    hindi: {
        name: 'Hindi',
        buttonActive: 'bg-orange-500 hover:bg-orange-400 text-black font-bold shadow-[0_0_15px_rgba(249,115,22,0.45)]',
        focusUnderline: 'bg-orange-400',
        focusBorder: 'focus:border-orange-400',
        accentText: 'text-orange-400 hover:text-orange-300',
        activeChipBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        borderAccent: 'border-orange-500',
        trayTabActive: 'bg-orange-500 text-black font-bold shadow-[0_0_10px_rgba(249,115,22,0.4)]',
    },
    // 4. Movies & Cinema: Sleek Indigo / Midnight Blue
    movies: {
        name: 'Movies',
        buttonActive: 'bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-[0_0_15px_rgba(79,70,229,0.45)]',
        focusUnderline: 'bg-indigo-400',
        focusBorder: 'focus:border-indigo-400',
        accentText: 'text-indigo-400 hover:text-indigo-300',
        activeChipBg: 'bg-indigo-600/25 text-indigo-300 border-indigo-500/40',
        borderAccent: 'border-indigo-500',
        trayTabActive: 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]',
    },
    // 5. Asian Drama: Vibrant Cyan / Teal
    drama: {
        name: 'Drama',
        buttonActive: 'bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-[0_0_15px_rgba(6,182,212,0.45)]',
        focusUnderline: 'bg-cyan-400',
        focusBorder: 'focus:border-cyan-400',
        accentText: 'text-cyan-400 hover:text-cyan-300',
        activeChipBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        borderAccent: 'border-cyan-500',
        trayTabActive: 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]',
    },
    // 6. Stream: Neon Violet / Purple
    stream: {
        name: 'Stream',
        buttonActive: 'bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-[0_0_15px_rgba(168,85,247,0.45)]',
        focusUnderline: 'bg-purple-400',
        focusBorder: 'focus:border-purple-400',
        accentText: 'text-purple-400 hover:text-purple-300',
        activeChipBg: 'bg-purple-600/25 text-purple-300 border-purple-500/40',
        borderAccent: 'border-purple-500',
        trayTabActive: 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]',
    },
    // 7. Anime Watch / General: Dynamic Brand Primary Theme
    anime: {
        name: 'Anime',
        buttonActive: 'bg-primary hover:bg-primary/90 text-white font-semibold shadow-[0_0_15px_rgba(220,38,38,0.4)]',
        focusUnderline: 'bg-primary',
        focusBorder: 'focus:border-primary',
        accentText: 'text-primary hover:opacity-80',
        activeChipBg: 'bg-primary/20 text-primary border-primary/40',
        borderAccent: 'border-primary',
        trayTabActive: 'bg-primary text-white shadow-[0_0_10px_rgba(220,38,38,0.35)]',
    },
    // 8. Classic YouTube Blue
    youtube: {
        name: 'YouTube',
        buttonActive: 'bg-[#3ea6ff] hover:bg-[#65b8ff] text-black font-semibold shadow-[0_0_15px_rgba(62,166,255,0.4)]',
        focusUnderline: 'bg-[#3ea6ff]',
        focusBorder: 'focus:border-[#3ea6ff]',
        accentText: 'text-[#3ea6ff] hover:text-[#65b8ff]',
        activeChipBg: 'bg-[#3ea6ff]/20 text-[#3ea6ff] border-[#3ea6ff]/40',
        borderAccent: 'border-[#3ea6ff]',
        trayTabActive: 'bg-[#3ea6ff] text-black shadow-[0_0_10px_rgba(62,166,255,0.35)]',
    }
};

export function resolvePageTheme(
    pathname?: string | null, 
    searchOrTheme?: string | null, 
    themeProp?: string
): PageThemeStyles {
    const themeKey = themeProp || (searchOrTheme && PAGE_THEMES[searchOrTheme] ? searchOrTheme : undefined);
    if (themeKey && PAGE_THEMES[themeKey]) {
        return PAGE_THEMES[themeKey];
    }
    const path = (pathname || '').toLowerCase();
    const search = (searchOrTheme && !PAGE_THEMES[searchOrTheme] ? searchOrTheme : '').toLowerCase();
    const full = `${path} ${search}`;
    if (full.includes('/shorts')) return PAGE_THEMES.shorts;
    if (full.includes('/donghua')) return PAGE_THEMES.donghua;
    if (full.includes('/hindi') || full.includes('audio=hi')) return PAGE_THEMES.hindi;
    if (full.includes('/movies') || full.includes('/cinema')) return PAGE_THEMES.movies;
    if (full.includes('/drama')) return PAGE_THEMES.drama;
    if (full.includes('/stream')) return PAGE_THEMES.stream;
    if (full.includes('/watch')) return PAGE_THEMES.anime;
    return PAGE_THEMES.anime;
}

interface ShadowCommentsProps {
    episodeId: string;
    compact?: boolean;
    onClose?: () => void;
    themeColor?: PageThemeKey | string;
    onToggleSnap?: () => void;
    isSnappedFull?: boolean;
}

export interface AttachedMedia {
    url: string;
    title: string;
    type: 'gif' | 'sticker' | 'image';
}

// Fallback avatar URL for default YouTube look
const DEFAULT_AVATAR = "https://cdn.myanimelist.net/images/characters/9/310307.jpg";

// Verified public Giphy API Key for live GIF & Sticker search
const GIPHY_API_KEY = 'sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh';

// YouTube relative time formatter
function formatYouTubeTime(dateString: string): string {
    try {
        const date = new Date(dateString);
        const distance = formatDistanceToNow(date, { addSuffix: true });
        return distance
            .replace('about ', '')
            .replace('less than a minute ago', 'Just now')
            .replace('almost ', '');
    } catch {
        return 'Just now';
    }
}

// Quick Emoji Row for YouTube 1-Tap Reactions
const QUICK_EMOJIS = ["❤️", "👏", "🔥", "😭", "💀", "😍", "😂", "💯", "⚔️", "🍿", "🫡", "😎"];

// Popular Emojis Categorized
const EMOJI_CATEGORIES = [
    {
        name: "Top Reactions",
        emojis: ["😂", "😭", "🔥", "💀", "❤️", "👏", "😍", "🥺", "🙌", "💯", "👑", "🎯", "🗿", "🫡", "😱", "🤯", "🤩", "😡", "🥳", "😎"]
    },
    {
        name: "Anime & Action",
        emojis: ["⚔️", "🌸", "⚡", "🍿", "🍜", "🍥", "🍡", "🏮", "🥋", "🗡️", "🩸", "💤", "👁️", "🕶️", "💫", "💥", "💢", "🐉", "🦊", "🥷"]
    },
    {
        name: "Vibes & Hearts",
        emojis: ["💖", "💔", "🖤", "🤍", "🌟", "⭐", "💠", "🛡️", "🏆", "🎖️", "🥇", "🤤", "🥶", "🥵", "🤫", "🤔", "🫠", "🤝", "🙏", "🦾"]
    },
    {
        name: "Faces & Gestures",
        emojis: ["😎", "🤓", "🧐", "🤖", "👻", "👽", "🤠", "🥺", "🥹", "🤭", "🤥", "😶", "🤐", "😏", "😴", "🤮", "🤧", "🤕", "🤐", "😇"]
    }
];

// Curated Popular Anime GIFs (100% verified permanent Giphy CDN URLs)
const CURATED_ANIME_GIFS = [
    {
        id: 'luffy-gear5',
        title: 'Gear 5 Laugh',
        preview: 'https://media1.giphy.com/media/v1.Y2lkPTlmMGY2NDI1cjE1bHFnbTdvODZ4a3gxMWQ2Mmt0eGJtMzg1OWxycTN2eTFzdHppNiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/4eTuzu8xIEqdDfPu9J/200.gif',
        url: 'https://media1.giphy.com/media/v1.Y2lkPTlmMGY2NDI1cjE1bHFnbTdvODZ4a3gxMWQ2Mmt0eGJtMzg1OWxycTN2eTFzdHppNiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/4eTuzu8xIEqdDfPu9J/giphy.gif'
    },
    {
        id: 'anime-hype',
        title: 'Hype / Cinema',
        preview: 'https://media0.giphy.com/media/v1.Y2lkPTlmMGY2NDI1NTFneDU2dml3bWlxdTR5dXhzaml5ZjNma2RjaTYwaXA1end0ejRibiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/naiatn5LxTOsU/200.gif',
        url: 'https://media0.giphy.com/media/v1.Y2lkPTlmMGY2NDI1NTFneDU2dml3bWlxdTR5dXhzaml5ZjNma2RjaTYwaXA1end0ejRibiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/naiatn5LxTOsU/giphy.gif'
    },
    {
        id: 'luffy-laugh',
        title: 'Luffy Laugh',
        preview: 'https://media0.giphy.com/media/v1.Y2lkPTlmMGY2NDI1b214NzR2M2J6Y2hjZGo5bTN5aXd0aTl5ZndvM2lkOGx6eHN4a2VjNCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/s55XB0bzfwo9y/200.gif',
        url: 'https://media0.giphy.com/media/v1.Y2lkPTlmMGY2NDI1b214NzR2M2J6Y2hjZGo5bTN5aXd0aTl5ZndvM2lkOGx6eHN4a2VjNCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/s55XB0bzfwo9y/giphy.gif'
    },
    {
        id: 'anya-smug',
        title: 'Anya Smug',
        preview: 'https://media2.giphy.com/media/v1.Y2lkPTlmMGY2NDI1OXF5ajZvcTd2aTVqZWs0emNxcXJ6ZHdsODBvYzdqbjlmN2k5ZzA5YSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/XTr2Us5PyK2u7fRnTq/200.gif',
        url: 'https://media2.giphy.com/media/v1.Y2lkPTlmMGY2NDI1OXF5ajZvcTd2aTVqZWs0emNxcXJ6ZHdsODBvYzdqbjlmN2k5ZzA5YSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/XTr2Us5PyK2u7fRnTq/giphy.gif'
    },
    {
        id: 'gojo-void',
        title: 'Gojo Satoru',
        preview: 'https://media0.giphy.com/media/v1.Y2lkPTlmMGY2NDI1ZjN5d3NnbTJjOXQ3N2V0ZGR5c2Q2MzJqanVtdThqdG00aW92ZDhsbiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/aYQSXVlQXF7hgWvfri/200.gif',
        url: 'https://media0.giphy.com/media/v1.Y2lkPTlmMGY2NDI1ZjN5d3NnbTJjOXQ3N2V0ZGR5c2Q2MzJqanVtdThqdG00aW92ZDhsbiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/aYQSXVlQXF7hgWvfri/giphy-downsized-medium.gif'
    },
    {
        id: 'dragon-ball',
        title: 'Power Up',
        preview: 'https://media4.giphy.com/media/v1.Y2lkPTlmMGY2NDI1ZGdrbHd5MGFjMzltMXk4bTBkOXl3a2RncWg5aWVna3lidmpqdng0OCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/13SBMZWCrSjw6A/200.gif',
        url: 'https://media4.giphy.com/media/v1.Y2lkPTlmMGY2NDI1ZGdrbHd5MGFjMzltMXk4bTBkOXl3a2RncWg5aWVna3lidmpqdng0OCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/13SBMZWCrSjw6A/giphy.gif'
    },
    {
        id: 'anime-cry',
        title: 'Tears / Peak Fiction',
        preview: 'https://media2.giphy.com/media/v1.Y2lkPTlmMGY2NDI1YjNhcnByN252MWhsNXNycjBwaHRwMHpvb3c5em9kejJudjljMDVocCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/CFJzEKHnTknlqG01Hr/200.gif',
        url: 'https://media2.giphy.com/media/v1.Y2lkPTlmMGY2NDI1YjNhcnByN252MWhsNXNycjBwaHRwMHpvb3c5em9kejJudjljMDVocCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/CFJzEKHnTknlqG01Hr/giphy.gif'
    },
    {
        id: 'anime-popcorn',
        title: 'Popcorn Time',
        preview: 'https://media0.giphy.com/media/v1.Y2lkPTlmMGY2NDI1eXZzbGY0eG1laXFxMHNoOTVsdWY4M3ZoMW9nN3Bxdjl2bXBjOHA1byZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ggephz889OmiVCWfsZ/200.gif',
        url: 'https://media0.giphy.com/media/v1.Y2lkPTlmMGY2NDI1eXZzbGY0eG1laXFxMHNoOTVsdWY4M3ZoMW9nN3Bxdjl2bXBjOHA1byZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ggephz889OmiVCWfsZ/giphy.gif'
    },
    {
        id: 'anime-fight',
        title: 'Epic Fight',
        preview: 'https://media0.giphy.com/media/v1.Y2lkPTlmMGY2NDI1eXhhaTRtNGR6ZDZneDUyYnR6cDJ0Y215MGNtZnBsOXdwMm9hOWNpMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/6ULDGyRw0uhECEhAaQ/200.gif',
        url: 'https://media0.giphy.com/media/v1.Y2lkPTlmMGY2NDI1eXhhaTRtNGR6ZDZneDUyYnR6cDJ0Y215MGNtZnBsOXdwMm9hOWNpMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/6ULDGyRw0uhECEhAaQ/giphy-downsized-medium.gif'
    }
];

// Curated High-Res Anime & Twitch Reaction Stickers
const CURATED_STICKERS = [
    { id: 'st-anya', name: 'Anya Heh', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f60f.png' },
    { id: 'st-fire', name: 'Hype Flame', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f525.png' },
    { id: 'st-swords', name: 'Battle Ready', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2694.png' },
    { id: 'st-skull', name: 'Dead / Cinema', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f480.png' },
    { id: 'st-100', name: '100% Peak', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4af.png' },
    { id: 'st-popcorn', name: 'Popcorn Time', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f37f.png' },
    { id: 'st-star', name: 'Star Badge', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2b50.png' },
    { id: 'st-heart', name: 'Love it', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f496.png' },
    { id: 'st-goat', name: 'The GOAT', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f410.png' },
    { id: 'st-trophy', name: 'Huge W', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3c6.png' },
    { id: 'st-crown', name: 'King / Crown', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f451.png' },
    { id: 'st-shocked', name: 'Shocked', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f640.png' },
    { id: 'st-cool', name: 'Badass Cool', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f60e.png' },
    { id: 'st-eyes', name: 'Looking / Sus', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f440.png' },
    { id: 'st-cry', name: 'Cry River', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f62d.png' },
    { id: 'st-chef', name: 'Let Him Cook', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f9d1-200d-1f373.png' }
];

// Helper to detect if content is only 1-4 emojis
function isOnlyEmojis(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) return false;
    // Regex matching unicode emojis
    const emojiRegex = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji_Modifier_Base}|\p{Emoji_Component}|\s){1,8}$/u;
    return emojiRegex.test(trimmed) && trimmed.length <= 16;
}

// Helper to seek video if clickable timestamp is clicked
function handleSeekVideo(timestamp: string) {
    try {
        const parts = timestamp.split(':').map(Number);
        let seconds = 0;
        if (parts.length === 2) {
            seconds = parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
            seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        }

        const video = document.querySelector('video');
        if (video) {
            video.currentTime = seconds;
            video.play().catch(() => {});
            toast.success(`Jumped to ${timestamp}`);
        } else {
            window.dispatchEvent(new CustomEvent('shadow-video-seek', { detail: { seconds, timestamp } }));
            toast.info(`Timestamp: ${timestamp}`);
        }
    } catch {
        toast.info(`Timestamp: ${timestamp}`);
    }
}

// Get current video timestamp formatted (e.g. 02:45)
function getCurrentVideoTimestamp(): string {
    try {
        const video = document.querySelector('video');
        if (video && video.currentTime) {
            const total = Math.floor(video.currentTime);
            const m = Math.floor(total / 60);
            const s = total % 60;
            return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        }
    } catch {}
    return "00:00";
}

// --- SUB-COMPONENT: Inline Spoiler ---
const InlineSpoiler = ({ text }: { text: string }) => {
    const [revealed, setRevealed] = useState(false);
    return (
        <span
            onClick={() => setRevealed(prev => !prev)}
            title={revealed ? "Click to conceal" : "Click to reveal spoiler"}
            className={cn(
                "cursor-pointer rounded px-1.5 py-0.5 transition-all select-none inline-block font-sans",
                revealed
                    ? "bg-zinc-800 text-zinc-100 border border-zinc-700/60"
                    : "bg-[#272727] text-transparent hover:bg-[#333333] blur-[4px] hover:blur-[2px]"
            )}
        >
            {text}
        </span>
    );
};

// --- SUB-COMPONENT: Media Lightbox Modal ---
const MediaLightbox = ({ 
    media, 
    onClose 
}: { 
    media: { url: string; alt: string } | null; 
    onClose: () => void; 
}) => {
    if (!media) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(media.url);
        toast.success("Media link copied to clipboard");
    };

    return (
        <div 
            onClick={onClose}
            className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-zoom-out"
        >
            <div 
                onClick={(e) => e.stopPropagation()} 
                className="relative max-w-4xl max-h-[90vh] flex flex-col items-center bg-[#181818] border border-zinc-800 rounded-2xl p-3 shadow-2xl cursor-default"
            >
                <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
                    <span className="text-xs font-semibold text-zinc-400 truncate max-w-[280px]">
                        {media.alt || "GIF / Sticker Preview"}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Copy media URL"
                        >
                            <Copy size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-center overflow-hidden rounded-xl max-h-[75vh]">
                    <img 
                        src={media.url} 
                        alt={media.alt} 
                        className="max-h-[75vh] w-auto object-contain rounded-xl"
                    />
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: YouTube Comment Text (Formatted + Media/GIF + Timestamps) ---
const YouTubeCommentText = ({ 
    content, 
    isSpoiler: initialSpoiler, 
    replyingToName,
    onOpenMedia
}: { 
    content: string; 
    isSpoiler?: boolean; 
    replyingToName?: string;
    onOpenMedia?: (url: string, alt: string) => void;
}) => {
    const [spoilerRevealed, setSpoilerRevealed] = useState(!initialSpoiler);
    const [isExpanded, setIsExpanded] = useState(false);

    // Parse image markdown: ![alt](url) or standalone gif/image url
    const parsedMedia = useMemo(() => {
        const matches: Array<{ alt: string; url: string }> = [];
        
        // 1. Markdown syntax ![alt](url)
        const mdImgRegex = /!\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g;
        let match;
        while ((match = mdImgRegex.exec(content)) !== null) {
            matches.push({ alt: match[1] || 'media', url: match[2] });
        }

        // 2. Direct gif or giphy urls without markdown
        const directUrlRegex = /(https?:\/\/[^\s]+\.(?:gif|webp|png|jpe?g)(?:\?[^\s]*)?|https?:\/\/(?:media\d*|i)\.giphy\.com\/[^\s]+)/gi;
        let directMatch;
        while ((directMatch = directUrlRegex.exec(content)) !== null) {
            const url = directMatch[1];
            if (!matches.some(m => m.url === url)) {
                matches.push({ alt: 'media', url });
            }
        }

        return matches;
    }, [content]);

    // Text content stripped of image markdown for cleaner text layout
    const textWithoutMedia = useMemo(() => {
        let clean = content.replace(/!\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '');
        // Also strip standalone media urls if already extracted
        clean = clean.replace(/(https?:\/\/[^\s]+\.(?:gif|webp|png|jpe?g)(?:\?[^\s]*)?|https?:\/\/(?:media\d*|i)\.giphy\.com\/[^\s]+)/gi, '');
        return clean.trim();
    }, [content]);

    const isJumbo = useMemo(() => {
        return parsedMedia.length === 0 && isOnlyEmojis(textWithoutMedia);
    }, [textWithoutMedia, parsedMedia]);

    // Truncation threshold
    const lineCount = (textWithoutMedia.match(/\n/g) || []).length;
    const shouldTruncate = textWithoutMedia.length > 320 || lineCount > 4;
    const displayedText = (!isExpanded && shouldTruncate) 
        ? textWithoutMedia.slice(0, 280) + '...' 
        : textWithoutMedia;

    const renderFormatted = (text: string) => {
        // Split by Spoilers ||x||, Bold **x**, Italic *x*, Strikethrough ~~x~~, and Timestamps mm:ss
        const parts = text.split(/(\|\|[\s\S]*?\|\||\*\*[\s\S]*?\*\*|\*[\s\S]*?\*|~~[\s\S]*?~~|\b\d{1,2}:\d{2}(?::\d{2})?\b)/g);
        return parts.map((part, index) => {
            if (part.startsWith('||') && part.endsWith('||')) {
                return <InlineSpoiler key={index} text={part.slice(2, -2)} />;
            }
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('~~') && part.endsWith('~~')) {
                return <span key={index} className="line-through text-zinc-400">{part.slice(2, -2)}</span>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={index} className="italic text-zinc-300">{part.slice(1, -1)}</em>;
            }
            // Timestamp match
            if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(part)) {
                return (
                    <button
                        key={index}
                        type="button"
                        onClick={() => handleSeekVideo(part)}
                        className="text-[#3ea6ff] hover:underline font-medium inline-flex items-center gap-0.5 cursor-pointer select-none"
                    >
                        <span>{part}</span>
                    </button>
                );
            }
            return <RenderMentions key={index} content={part} />;
        });
    };

    return (
        <div className="mt-1 text-[14px] text-[#f1f1f1] leading-[20px] whitespace-pre-wrap break-words font-sans">
            {replyingToName && (
                <span className="text-[#3ea6ff] hover:underline cursor-pointer font-medium mr-1.5 select-none">
                    @{replyingToName}
                </span>
            )}

            {initialSpoiler && !spoilerRevealed ? (
                <button
                    onClick={() => setSpoilerRevealed(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer transition-colors border border-zinc-700/60 my-0.5"
                >
                    <EyeOff size={13} className="text-zinc-400" />
                    <span>Spoiler · Click to reveal</span>
                </button>
            ) : (
                <>
                    {displayedText && (
                        <div className={cn(isJumbo ? "text-3xl leading-relaxed py-1" : "")}>
                            {renderFormatted(displayedText)}
                        </div>
                    )}

                    {/* Attached GIFs / Stickers / Media */}
                    {parsedMedia.length > 0 && (
                        <div className="flex flex-wrap gap-2.5 mt-2.5">
                            {parsedMedia.map((media, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => onOpenMedia && onOpenMedia(media.url, media.alt)}
                                    className="relative group/media rounded-2xl overflow-hidden border border-zinc-800 bg-black/40 max-w-[280px] max-h-[220px] cursor-pointer hover:border-[#3ea6ff]/60 transition-all shadow-md"
                                    title="Click to zoom media"
                                >
                                    <img
                                        src={media.url}
                                        alt={media.alt}
                                        loading="lazy"
                                        className="w-auto h-auto max-h-[220px] object-contain rounded-2xl transition-transform duration-200 group-hover/media:scale-[1.02]"
                                    />
                                    <div className="absolute top-2 right-2 opacity-0 group-hover/media:opacity-100 p-1 rounded-full bg-black/60 text-white transition-opacity">
                                        <Maximize2 size={13} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {shouldTruncate && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="block text-[14px] font-semibold text-[#aaaaaa] hover:text-[#f1f1f1] mt-1 select-none transition-colors"
                >
                    {isExpanded ? 'Show less' : 'Read more'}
                </button>
            )}
        </div>
    );
};

// --- SUB-COMPONENT: GIF & Sticker & Emoji Drawer ---
interface MediaTrayProps {
    isOpen: boolean;
    initialTab?: 'emoji' | 'gif' | 'sticker';
    isSignedIn?: boolean;
    onClose: () => void;
    onRequireAuth?: () => void;
    onSelectEmoji: (emoji: string) => void;
    onSelectMedia: (media: AttachedMedia) => void;
    themeStyles?: PageThemeStyles;
}

const YouTubeMediaTray = ({ 
    isOpen, 
    initialTab = 'emoji', 
    isSignedIn = false,
    onClose, 
    onRequireAuth,
    onSelectEmoji, 
    onSelectMedia,
    themeStyles
}: MediaTrayProps) => {
    const [activeTab, setActiveTab] = useState<'emoji' | 'gif' | 'sticker'>(initialTab);
    const [gifQuery, setGifQuery] = useState('');
    const [gifResults, setGifResults] = useState(CURATED_ANIME_GIFS);
    const [isSearchingGifs, setIsSearchingGifs] = useState(false);

    const [stickerQuery, setStickerQuery] = useState('');
    const [stickerResults, setStickerResults] = useState(CURATED_STICKERS);
    const [isSearchingStickers, setIsSearchingStickers] = useState(false);

    const [emojiSearch, setEmojiSearch] = useState('');

    useEffect(() => {
        if (isOpen && initialTab) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    // Live Giphy GIFs Search
    const searchGiphyGifs = useCallback(async (query: string) => {
        if (!query.trim()) {
            setGifResults(CURATED_ANIME_GIFS);
            return;
        }
        setIsSearchingGifs(true);
        try {
            const endpoint = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=16&rating=g`;
            const res = await fetch(endpoint);
            const json = await res.json();
            if (json.data && json.data.length > 0) {
                const mapped = json.data.map((g: any) => ({
                    id: g.id,
                    title: g.title || query,
                    preview: g.images?.fixed_height?.url || g.images?.downsized_medium?.url,
                    url: g.images?.downsized_medium?.url || g.images?.original?.url || g.images?.fixed_height?.url
                })).filter((g: any) => g.url);
                setGifResults(mapped.length > 0 ? mapped : CURATED_ANIME_GIFS);
            } else {
                setGifResults(CURATED_ANIME_GIFS);
            }
        } catch {
            setGifResults(CURATED_ANIME_GIFS);
        } finally {
            setIsSearchingGifs(false);
        }
    }, []);

    // Live Giphy Stickers Search
    const searchGiphyStickers = useCallback(async (query: string) => {
        if (!query.trim()) {
            setStickerResults(CURATED_STICKERS);
            return;
        }
        setIsSearchingStickers(true);
        try {
            const endpoint = `https://api.giphy.com/v1/stickers/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=16&rating=g`;
            const res = await fetch(endpoint);
            const json = await res.json();
            if (json.data && json.data.length > 0) {
                const mapped = json.data.map((s: any) => ({
                    id: s.id,
                    name: s.title || query,
                    url: s.images?.fixed_height?.url || s.images?.downsized_medium?.url
                })).filter((s: any) => s.url);
                setStickerResults(mapped.length > 0 ? mapped : CURATED_STICKERS);
            } else {
                setStickerResults(CURATED_STICKERS);
            }
        } catch {
            setStickerResults(CURATED_STICKERS);
        } finally {
            setIsSearchingStickers(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'gif' && gifQuery.trim()) {
            const timer = setTimeout(() => searchGiphyGifs(gifQuery), 350);
            return () => clearTimeout(timer);
        }
    }, [gifQuery, activeTab, searchGiphyGifs]);

    useEffect(() => {
        if (activeTab === 'sticker' && stickerQuery.trim()) {
            const timer = setTimeout(() => searchGiphyStickers(stickerQuery), 350);
            return () => clearTimeout(timer);
        }
    }, [stickerQuery, activeTab, searchGiphyStickers]);

    if (!isOpen) return null;

    return (
        <div className="w-full bg-[#181818] border border-zinc-800 rounded-2xl p-3 my-2 shadow-2xl animate-in fade-in duration-200">
            {/* Header Tabs */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setActiveTab('emoji')}
                        className={cn(
                            "text-xs font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1",
                            activeTab === 'emoji' ? (themeStyles?.trayTabActive || "bg-white text-black") : "text-[#aaaaaa] hover:text-white hover:bg-white/10"
                        )}
                    >
                        <span>😊</span>
                        <span>Emojis</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('gif')}
                        className={cn(
                            "text-xs font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1",
                            activeTab === 'gif' ? (themeStyles?.trayTabActive || "bg-white text-black") : "text-[#aaaaaa] hover:text-white hover:bg-white/10"
                        )}
                    >
                        <span>🎬</span>
                        <span>GIFs</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('sticker')}
                        className={cn(
                            "text-xs font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5",
                            activeTab === 'sticker' ? (themeStyles?.trayTabActive || "bg-white text-black") : "text-[#aaaaaa] hover:text-white hover:bg-white/10"
                        )}
                    >
                        <Sticker size={13} />
                        <span>Stickers</span>
                    </button>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="p-1 rounded-full text-[#aaaaaa] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Close Tray"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Friendly traveler sync banner */}
            {!isSignedIn && (
                <div className="mt-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-[11px] text-zinc-300">
                    <span>💡 Posting as Traveler · GIFs, Stickers & Emojis supported</span>
                    {onRequireAuth && (
                        <button
                            type="button"
                            onClick={onRequireAuth}
                            className={cn("hover:underline font-semibold ml-2 cursor-pointer shrink-0", themeStyles?.accentText || "text-[#3ea6ff]")}
                        >
                            Sign In
                        </button>
                    )}
                </div>
            )}

            {/* TAB 1: EMOJIS */}
            {activeTab === 'emoji' && (
                <div className="pt-2">
                    <div className="relative mb-2">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            value={emojiSearch}
                            onChange={(e) => setEmojiSearch(e.target.value)}
                            placeholder="Search emojis..."
                            className={cn(
                                "w-full bg-[#121212] border border-zinc-800 text-xs text-white rounded-lg pl-8 pr-3 py-1.5 placeholder-zinc-500 focus:outline-none",
                                themeStyles?.focusBorder || "focus:border-[#3ea6ff]"
                            )}
                        />
                    </div>
                    <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                        {EMOJI_CATEGORIES.map((cat, idx) => {
                            const filtered = cat.emojis.filter(e => !emojiSearch || e.includes(emojiSearch));
                            if (filtered.length === 0) return null;
                            return (
                                <div key={idx}>
                                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                                        {cat.name}
                                    </span>
                                    <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 text-xl">
                                        {filtered.map((emoji, eIdx) => (
                                            <button
                                                key={eIdx}
                                                type="button"
                                                onClick={() => onSelectEmoji(emoji)}
                                                className="h-8 flex items-center justify-center hover:bg-white/10 rounded-lg active:scale-125 transition-transform cursor-pointer"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 2: GIFS */}
            {activeTab === 'gif' && (
                <div className="pt-2">
                    <div className="relative mb-2">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            value={gifQuery}
                            onChange={(e) => setGifQuery(e.target.value)}
                            placeholder="Search Giphy GIFs (e.g. anime, luffy, hype, fight)..."
                            className={cn(
                                "w-full bg-[#121212] border border-zinc-800 text-xs text-white rounded-lg pl-8 pr-3 py-1.5 placeholder-zinc-500 focus:outline-none",
                                themeStyles?.focusBorder || "focus:border-[#3ea6ff]"
                            )}
                        />
                    </div>

                    {/* Quick filter chips */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1.5 mb-1.5">
                        {['Anime', 'Shadow', 'Luffy', 'Gojo', 'Hype', 'Funny', 'Cry', 'Fight', 'Solo Leveling', 'Popcorn'].map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => { setGifQuery(tag); searchGiphyGifs(tag); }}
                                className="text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-0.5 rounded-full shrink-0 transition-colors cursor-pointer"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    <div className="max-h-52 overflow-y-auto custom-scrollbar pr-1">
                        {isSearchingGifs ? (
                            <div className="flex items-center justify-center py-8 text-zinc-500">
                                <Loader2 size={18} className={cn("animate-spin", themeStyles?.accentText || "text-[#3ea6ff]")} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                {gifResults.map((gif) => (
                                    <div
                                        key={gif.id}
                                        onClick={() => onSelectMedia({ url: gif.url, title: gif.title, type: 'gif' })}
                                        className={cn(
                                            "relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 cursor-pointer group transition-all",
                                            themeStyles?.borderAccent ? `hover:${themeStyles.borderAccent}` : "hover:border-[#3ea6ff]"
                                        )}
                                        title={gif.title}
                                    >
                                        <img
                                            src={gif.preview || gif.url}
                                            alt={gif.title}
                                            loading="lazy"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: STICKERS */}
            {activeTab === 'sticker' && (
                <div className="pt-2">
                    <div className="relative mb-2">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            value={stickerQuery}
                            onChange={(e) => setStickerQuery(e.target.value)}
                            placeholder="Search Giphy Stickers (e.g. anime, heart, cute)..."
                            className={cn(
                                "w-full bg-[#121212] border border-zinc-800 text-xs text-white rounded-lg pl-8 pr-3 py-1.5 placeholder-zinc-500 focus:outline-none",
                                themeStyles?.focusBorder || "focus:border-[#3ea6ff]"
                            )}
                        />
                    </div>

                    {/* Quick filter chips */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1.5 mb-1.5">
                        {['Anya', 'Anime Emotes', 'Hype', 'Heart', 'Cat', 'Reaction'].map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => { setStickerQuery(tag); searchGiphyStickers(tag); }}
                                className="text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-0.5 rounded-full shrink-0 transition-colors cursor-pointer"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    <div className="max-h-52 overflow-y-auto custom-scrollbar pr-1">
                        {isSearchingStickers ? (
                            <div className="flex items-center justify-center py-8 text-zinc-500">
                                <Loader2 size={18} className={cn("animate-spin", themeStyles?.accentText || "text-[#3ea6ff]")} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                {stickerResults.map((st) => (
                                    <button
                                        key={st.id}
                                        type="button"
                                        onClick={() => onSelectMedia({ url: st.url, title: st.name, type: 'sticker' })}
                                        className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-700 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                                        title={st.name}
                                    >
                                        <img src={st.url} alt={st.name} className="w-10 h-10 object-contain" />
                                        <span className="text-[9px] text-zinc-400 truncate max-w-full">{st.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- SUB-COMPONENT: YouTube Style Comment Input ---
interface CommentInputProps {
    episodeId: string;
    currentUserAvatar?: string | null;
    currentDisplayName?: string | null;
    isTraveler?: boolean;
    focusOnMount?: boolean;
    replyingTo?: { id: string; username: string } | null;
    onCancelReply?: () => void;
    onPost: (text: string, isSpoiler: boolean, parentId?: string | null) => void;
    onRequireAuth?: () => void;
    onAvatarClick?: () => void;
    placeholder?: string;
    buttonText?: string;
    isReply?: boolean;
    themeStyles?: PageThemeStyles;
}

const YouTubeCommentInput = ({
    currentUserAvatar,
    currentDisplayName,
    isTraveler = false,
    focusOnMount = false,
    replyingTo,
    onCancelReply,
    onPost,
    onRequireAuth,
    onAvatarClick,
    placeholder = "Add a comment...",
    buttonText = "Comment",
    isReply = false,
    themeStyles
}: CommentInputProps) => {
    const [text, setText] = useState("");
    const [isFocused, setIsFocused] = useState(focusOnMount);
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [attachedMedia, setAttachedMedia] = useState<AttachedMedia | null>(null);
    const [showMediaTray, setShowMediaTray] = useState(false);
    const [mediaTrayTab, setMediaTrayTab] = useState<'emoji' | 'gif' | 'sticker'>('emoji');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea to fit content
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 260)}px`;
        }
    }, [text]);

    useEffect(() => {
        if (focusOnMount && textareaRef.current) {
            textareaRef.current.focus();
            setIsFocused(true);
        }
    }, [focusOnMount, replyingTo]);

    const handleFormat = (type: 'bold' | 'italic' | 'strike' | 'spoiler') => {
        if (!textareaRef.current) return;
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selText = text.substring(start, end) || "text";
        const wrapper = type === 'bold' ? '**' : type === 'italic' ? '*' : type === 'strike' ? '~~' : '||';
        const newText = text.substring(0, start) + wrapper + selText + wrapper + text.substring(end);
        setText(newText);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + wrapper.length, start + wrapper.length + selText.length);
        }, 10);
    };

    const handleInsertTimestamp = () => {
        const time = getCurrentVideoTimestamp();
        if (!textareaRef.current) {
            setText(prev => (prev ? `${prev} ${time} ` : `${time} `));
            return;
        }
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const next = text.substring(0, start) + `${time} ` + text.substring(end);
        setText(next);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + time.length + 1, start + time.length + 1);
        }, 10);
    };

    const handleSelectEmoji = (emoji: string) => {
        if (!textareaRef.current) {
            setText(prev => prev + emoji);
            return;
        }
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const next = text.substring(0, start) + emoji + text.substring(end);
        setText(next);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + emoji.length, start + emoji.length);
        }, 10);
    };

    const handleSelectMedia = (media: AttachedMedia) => {
        setAttachedMedia(media);
        setShowMediaTray(false);
        setIsFocused(true);
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    const handleCancel = () => {
        setText("");
        setAttachedMedia(null);
        setIsSpoiler(false);
        setIsFocused(false);
        setShowMediaTray(false);
        if (onCancelReply) onCancelReply();
    };

    const handleSubmit = () => {
        let finalContent = text.trim();
        if (attachedMedia) {
            const md = `![${attachedMedia.title || attachedMedia.type}](${attachedMedia.url})`;
            finalContent = finalContent ? `${finalContent}\n\n${md}` : md;
        }

        if (!finalContent) return;

        // Non-signed in users can simply post directly!
        onPost(finalContent, isSpoiler, replyingTo ? replyingTo.id : null);
        setText("");
        setAttachedMedia(null);
        setIsSpoiler(false);
        setIsFocused(false);
        setShowMediaTray(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
        if (e.key === 'Escape' && isReply) {
            handleCancel();
        }
    };

    const openTray = (tab: 'emoji' | 'gif' | 'sticker') => {
        setMediaTrayTab(tab);
        setShowMediaTray(prev => (prev && mediaTrayTab === tab ? false : true));
    };

    const showActions = isFocused || text.length > 0 || !!attachedMedia || !!replyingTo || showMediaTray;

    return (
        <div className="flex gap-3 md:gap-4 w-full font-sans">
            {/* User Avatar */}
            <div className="shrink-0 pt-0.5">
                <button
                    type="button"
                    onClick={onAvatarClick}
                    className={cn(
                        "rounded-full transition-transform active:scale-95 group/av relative block outline-none",
                        onAvatarClick && "cursor-pointer"
                    )}
                    title={isTraveler ? `Click to customize avatar (@${currentDisplayName})` : `@${currentDisplayName}`}
                >
                    <img
                        src={currentUserAvatar || DEFAULT_AVATAR}
                        alt={currentDisplayName || "You"}
                        className={cn(
                            "rounded-full object-cover bg-zinc-800 ring-1 ring-white/10 group-hover/av:ring-white/30 transition-all",
                            isReply ? "w-6 h-6 md:w-7 md:h-7" : "w-9 h-9 md:w-10 md:h-10"
                        )}
                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                    />
                    {isTraveler && !isReply && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#202020] border border-zinc-700 flex items-center justify-center text-zinc-400 group-hover/av:text-white group-hover/av:bg-[#303030] transition-colors shadow-sm">
                            <Edit2 size={9} />
                        </div>
                    )}
                </button>
            </div>

            {/* Input Box & YouTube Animated Underline */}
            <div className="flex-1 min-w-0 flex flex-col">
                {replyingTo && (
                    <div className="flex items-center gap-1.5 mb-1.5 text-[12px] text-[#aaaaaa]">
                        <CornerDownRight size={13} className={themeStyles?.accentText || "text-[#3ea6ff]"} />
                        <span>Replying to</span>
                        <span className={cn("font-medium", themeStyles?.accentText || "text-[#3ea6ff]")}>@{replyingTo.username}</span>
                    </div>
                )}

                <div className="relative">
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onKeyDown={handleKeyDown}
                        placeholder={replyingTo ? "Add a reply..." : placeholder}
                        rows={1}
                        className="w-full bg-transparent border-0 text-[14px] text-[#f1f1f1] placeholder:text-[#aaaaaa] focus:outline-none resize-none overflow-hidden py-1 leading-[20px] transition-colors"
                    />

                    {/* Resting Underline */}
                    <div className="h-[1px] w-full bg-[#3f3f3f]" />

                    {/* Active Focus Underline (YouTube smooth expansion with page color matching) */}
                    <div 
                        className={cn(
                            "absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] transition-all duration-300 ease-out",
                            themeStyles?.focusUnderline || "bg-white",
                            isFocused ? "w-full" : "w-0"
                        )} 
                    />
                </div>

                {/* Attached Media Preview Card (GIF or Sticker) */}
                {attachedMedia && (
                    <div className="relative inline-flex items-center gap-2 mt-2.5 p-1.5 pr-3 rounded-2xl bg-[#1c1c1c] border border-zinc-700/80 w-fit animate-in fade-in duration-150">
                        <img 
                            src={attachedMedia.url} 
                            alt={attachedMedia.title} 
                            className="w-14 h-14 object-cover rounded-xl bg-black/40"
                        />
                        <div className="flex flex-col min-w-0 pr-1">
                            <span className={cn("text-[10px] font-semibold uppercase tracking-wider", themeStyles?.accentText || "text-[#3ea6ff]")}>
                                Attached {attachedMedia.type}
                            </span>
                            <span className="text-xs text-zinc-300 truncate max-w-[160px]">
                                {attachedMedia.title || "Media attachment"}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setAttachedMedia(null)}
                            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors ml-1 cursor-pointer"
                            title="Remove attachment"
                        >
                            <X size={15} />
                        </button>
                    </div>
                )}

                {/* Media Drawer (GIFs, Emojis, Stickers) */}
                <YouTubeMediaTray
                    isOpen={showMediaTray}
                    initialTab={mediaTrayTab}
                    isSignedIn={!isTraveler}
                    onRequireAuth={onRequireAuth}
                    onClose={() => setShowMediaTray(false)}
                    onSelectEmoji={handleSelectEmoji}
                    onSelectMedia={handleSelectMedia}
                    themeStyles={themeStyles}
                />

                {/* YouTube Action Row (Formatting tools + Cancel / Comment Buttons) */}
                {showActions && (
                    <div className="flex items-center justify-between pt-2.5 flex-wrap gap-2 animate-in fade-in duration-200">
                        {/* Formatting & Media Tools */}
                        <div className="flex items-center gap-0.5 -ml-1 text-[#aaaaaa] flex-wrap">
                            {/* Emoji Drawer Toggle */}
                            <button
                                type="button"
                                onClick={() => openTray('emoji')}
                                className={cn(
                                    "p-1.5 md:p-2 rounded-full transition-colors cursor-pointer",
                                    showMediaTray && mediaTrayTab === 'emoji'
                                        ? (themeStyles?.activeChipBg || "bg-[#3ea6ff]/20 text-[#3ea6ff]")
                                        : "hover:bg-white/10 hover:text-white"
                                )}
                                title="Add emoji"
                            >
                                <Smile size={17} />
                            </button>

                            {/* GIF Drawer Toggle */}
                            <button
                                type="button"
                                onClick={() => openTray('gif')}
                                className={cn(
                                    "px-2 py-1 rounded-full text-[11px] font-bold tracking-wider transition-colors cursor-pointer border",
                                    showMediaTray && mediaTrayTab === 'gif'
                                        ? (themeStyles?.trayTabActive || "bg-[#3ea6ff] text-black border-[#3ea6ff]")
                                        : "border-zinc-700/80 text-zinc-300 hover:text-white hover:bg-white/10"
                                )}
                                title="Add GIF"
                            >
                                GIF
                            </button>

                            {/* Sticker Drawer Toggle */}
                            <button
                                type="button"
                                onClick={() => openTray('sticker')}
                                className={cn(
                                    "p-1.5 md:p-2 rounded-full transition-colors cursor-pointer",
                                    showMediaTray && mediaTrayTab === 'sticker'
                                        ? (themeStyles?.activeChipBg || "bg-[#3ea6ff]/20 text-[#3ea6ff]")
                                        : "hover:bg-white/10 hover:text-white"
                                )}
                                title="Add Sticker"
                            >
                                <Sticker size={16} />
                            </button>

                            {/* Bold */}
                            <button
                                type="button"
                                onClick={() => handleFormat('bold')}
                                className="p-1.5 md:p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                                title="Bold (**text**)"
                            >
                                <Bold size={15} />
                            </button>

                            {/* Italic */}
                            <button
                                type="button"
                                onClick={() => handleFormat('italic')}
                                className="p-1.5 md:p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                                title="Italic (*text*)"
                            >
                                <Italic size={15} />
                            </button>

                            {/* Strikethrough */}
                            <button
                                type="button"
                                onClick={() => handleFormat('strike')}
                                className="p-1.5 md:p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                                title="Strikethrough (~~text~~)"
                            >
                                <Strikethrough size={15} />
                            </button>

                            {/* Spoiler */}
                            <button
                                type="button"
                                onClick={() => setIsSpoiler(!isSpoiler)}
                                className={cn(
                                    "p-1.5 md:p-2 rounded-full transition-colors cursor-pointer",
                                    isSpoiler 
                                        ? (themeStyles?.activeChipBg || "bg-zinc-800 text-[#3ea6ff] border border-[#3ea6ff]/40")
                                        : "hover:bg-white/10 hover:text-white"
                                )}
                                title={isSpoiler ? "Spoiler enabled" : "Tag comment as spoiler"}
                            >
                                <EyeOff size={15} />
                            </button>

                            {/* Current Timestamp */}
                            <button
                                type="button"
                                onClick={handleInsertTimestamp}
                                className={cn("p-1.5 md:p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer", themeStyles?.accentText || "hover:text-[#3ea6ff]")}
                                title="Insert current playback timestamp"
                            >
                                <Clock size={15} />
                            </button>

                            {isSpoiler && (
                                <span className={cn("text-[11px] font-medium ml-1 select-none", themeStyles?.accentText || "text-[#3ea6ff]")}>
                                    Spoiler Tagged
                                </span>
                            )}
                        </div>

                        {/* Subtle Traveler identity reminder */}
                        {isTraveler && (
                            <div className="flex items-center gap-1.5 text-[11px] text-[#aaaaaa] mr-auto pl-1 truncate">
                                <span>Posting as <strong className="text-zinc-200 font-medium">@{currentDisplayName}</strong></span>
                                <span>·</span>
                                <button
                                    type="button"
                                    onClick={onRequireAuth}
                                    className={cn("hover:underline font-medium cursor-pointer", themeStyles?.accentText || "text-[#3ea6ff]")}
                                >
                                    Sign in
                                </button>
                            </div>
                        )}

                        {/* Cancel & Submit Button (Matches page colors dynamically) */}
                        <div className="flex items-center gap-2 ml-auto">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="text-[13px] md:text-[14px] font-semibold text-white hover:bg-white/10 px-3.5 py-1.5 md:px-4 md:py-2 rounded-full transition-colors active:scale-95 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!text.trim() && !attachedMedia}
                                className={cn(
                                    "text-[13px] md:text-[14px] font-semibold px-4 py-1.5 md:py-2 rounded-full transition-all active:scale-95",
                                    (text.trim() || attachedMedia)
                                        ? (themeStyles?.buttonActive || "bg-[#3ea6ff] hover:bg-[#65b8ff] text-black cursor-pointer shadow-sm")
                                        : "bg-[#272727] text-[#717171] cursor-not-allowed"
                                )}
                            >
                                {buttonText}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: Single YouTube Comment Item ---
interface CommentItemProps {
    comment: Comment;
    currentUserId: string | null;
    currentUserAvatar?: string | null;
    currentDisplayName?: string | null;
    isTraveler?: boolean;
    onReply: (text: string, isSpoiler: boolean, parentId: string) => void;
    onReport: (commentId: string, reportedUserId: string) => void;
    onDelete: (id: string) => void;
    onEdit: (id: string, newContent: string) => void;
    onLikeToggle: (id: string) => void;
    onDislikeToggle: (id: string) => void;
    onRequireAuth?: () => void;
    onOpenMedia?: (url: string, alt: string) => void;
    isLiked: boolean;
    isDisliked: boolean;
    likesCount: number;
    isReply?: boolean;
    themeStyles?: PageThemeStyles;
}

const YouTubeCommentItem = ({
    comment,
    currentUserId,
    currentUserAvatar,
    currentDisplayName,
    isTraveler,
    onReply,
    onReport,
    onDelete,
    onEdit,
    onLikeToggle,
    onDislikeToggle,
    onRequireAuth,
    onOpenMedia,
    isLiked,
    isDisliked,
    likesCount,
    isReply = false,
    themeStyles
}: CommentItemProps) => {
    const [showReplyBox, setShowReplyBox] = useState(false);
    const [showRepliesToggle, setShowRepliesToggle] = useState(false);

    const parsed = useMemo(() => {
        const match = comment.content.match(/^<!--traveller:(\{.*?\})-->([\s\S]*)$/);
        if (match) {
            try {
                const meta = JSON.parse(match[1]);
                return {
                    cleanContent: match[2],
                    isTraveler: true,
                    displayName: meta.name || 'Traveler',
                    avatarUrl: meta.avatar || DEFAULT_AVATAR
                };
            } catch {}
        }
        return {
            cleanContent: comment.content,
            isTraveler: false,
            displayName: comment.profiles?.username || comment.profiles?.full_name || `User_${comment.user_id.slice(0, 5)}`,
            avatarUrl: comment.profiles?.avatar_url || DEFAULT_AVATAR
        };
    }, [comment.content, comment.profiles, comment.user_id]);

    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(parsed.cleanContent);

    const displayName = parsed.displayName;
    const avatarUrl = parsed.avatarUrl;
    const isAuthor = currentUserId === comment.user_id && !parsed.isTraveler;

    // Flatten nested replies for YouTube-style single-indented discussion
    const flattenReplies = (replies: Comment[], parentName?: string): Comment[] => {
        if (!replies || replies.length === 0) return [];
        const result: Comment[] = [];
        for (const reply of replies) {
            const replyParsed = (() => {
                const m = reply.content.match(/^<!--traveller:(\{.*?\})-->([\s\S]*)$/);
                if (m) {
                    try {
                        const meta = JSON.parse(m[1]);
                        return { clean: m[2], name: meta.name || 'Traveler' };
                    } catch {}
                }
                return { clean: reply.content, name: reply.profiles?.username || reply.profiles?.full_name || `User_${reply.user_id.slice(0, 5)}` };
            })();

            result.push({ ...reply, content: replyParsed.clean, replyingToName: parentName });
            if (reply.replies && reply.replies.length > 0) {
                result.push(...flattenReplies(reply.replies, replyParsed.name));
            }
        }
        return result;
    };

    const allReplies = !isReply ? flattenReplies(comment.replies || []) : [];
    const hasReplies = allReplies.length > 0;

    const handleSaveEdit = () => {
        if (!editContent.trim()) return;
        onEdit(comment.id, editContent.trim());
        setIsEditing(false);
    };

    const handleCopyLink = () => {
        try {
            const url = `${window.location.origin}${window.location.pathname}#comment-${comment.id}`;
            navigator.clipboard.writeText(url);
            toast.success("Comment link copied to clipboard");
        } catch {
            toast.success("Link copied");
        }
    };

    return (
        <div id={`comment-${comment.id}`} className="group/comment font-sans animate-in fade-in duration-200">
            <div className={cn("flex gap-3 md:gap-4", isReply ? "mt-3" : "mt-4")}>
                {/* Avatar */}
                {parsed.isTraveler ? (
                    <div className="shrink-0 pt-0.5">
                        <img
                            src={avatarUrl}
                            alt={displayName}
                            className={cn(
                                "rounded-full object-cover bg-zinc-800 ring-1 ring-white/10",
                                isReply ? "w-6 h-6 md:w-7 md:h-7" : "w-9 h-9 md:w-10 md:h-10"
                            )}
                            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                        />
                    </div>
                ) : (
                    <Link 
                        href={`/profile/${comment.profiles?.username || comment.user_id}`} 
                        onClick={(e) => e.stopPropagation()} 
                        className="shrink-0 pt-0.5"
                    >
                        <img
                            src={avatarUrl}
                            alt={displayName}
                            className={cn(
                                "rounded-full object-cover bg-zinc-800 transition-opacity hover:opacity-90 ring-1 ring-white/10",
                                isReply ? "w-6 h-6 md:w-7 md:h-7" : "w-9 h-9 md:w-10 md:h-10"
                            )}
                            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                        />
                    </Link>
                )}

                {/* Right Container */}
                <div className="flex-1 min-w-0">
                    {/* Author Meta Row */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {parsed.isTraveler ? (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[13px] font-semibold text-[#f1f1f1] truncate">
                                        @{displayName}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 font-mono font-medium">
                                        Traveler
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <Link
                                        href={`/profile/${comment.profiles?.username || comment.user_id}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-[13px] font-semibold text-[#f1f1f1] hover:underline truncate cursor-pointer"
                                    >
                                        @{displayName}
                                    </Link>

                                    {comment.profiles?.role && (
                                        <RoleTitleBadge 
                                            role={comment.profiles.role} 
                                            adminTitle={comment.profiles.admin_title} 
                                        />
                                    )}
                                </div>
                            )}

                            <span className="text-[12px] text-[#aaaaaa] hover:text-[#f1f1f1] cursor-pointer ml-1 select-none">
                                {formatYouTubeTime(comment.created_at)}
                            </span>

                            {comment.is_edited && (
                                <span className="text-[11px] text-[#aaaaaa] select-none">(edited)</span>
                            )}
                        </div>

                        {/* YouTube Three-Dot Options Menu */}
                        <div className="shrink-0">
                            <DropdownMenu>
                                <DropdownMenuTrigger className="opacity-0 group-hover/comment:opacity-100 p-1.5 hover:bg-white/10 rounded-full outline-none text-[#aaaaaa] hover:text-white transition-opacity cursor-pointer">
                                    <MoreVertical size={16} />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#282828] border-none text-[#f1f1f1] shadow-2xl rounded-xl py-1.5 min-w-[140px]">
                                    <DropdownMenuItem 
                                        onClick={handleCopyLink} 
                                        className="text-[13px] gap-2.5 cursor-pointer focus:bg-white/10 px-3.5 py-2"
                                    >
                                        <Copy size={15} /> Copy link
                                    </DropdownMenuItem>

                                    {isAuthor ? (
                                        <>
                                            <DropdownMenuItem 
                                                onClick={() => setIsEditing(true)} 
                                                className="text-[13px] gap-2.5 cursor-pointer focus:bg-white/10 px-3.5 py-2"
                                            >
                                                <Edit2 size={15} /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                onClick={() => onDelete(comment.id)} 
                                                className="text-[13px] gap-2.5 cursor-pointer focus:bg-white/10 px-3.5 py-2 text-red-400 focus:text-red-300"
                                            >
                                                <Trash2 size={15} /> Delete
                                            </DropdownMenuItem>
                                        </>
                                    ) : (
                                        <DropdownMenuItem 
                                            onClick={() => onReport(comment.id, comment.user_id)} 
                                            className="text-[13px] gap-2.5 cursor-pointer focus:bg-white/10 px-3.5 py-2"
                                        >
                                            <Flag size={15} /> Report
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Comment Content / In-place Edit Box */}
                    {isEditing ? (
                        <div className="flex flex-col gap-2 mt-2 mb-3">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={2}
                                className="w-full bg-transparent border-0 border-b-2 border-white rounded-none focus:outline-none text-[14px] text-white py-1 leading-[20px] resize-none"
                            />
                            <div className="flex gap-2 justify-end items-center mt-1">
                                <button
                                    onClick={() => { setEditContent(comment.content); setIsEditing(false); }}
                                    className="text-[14px] font-semibold text-white hover:bg-white/10 px-4 py-2 rounded-full transition-colors active:scale-95 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={!editContent.trim()}
                                    className={cn(
                                        "text-[14px] font-semibold px-4 py-2 rounded-full transition-all active:scale-95",
                                        editContent.trim()
                                            ? (themeStyles?.buttonActive || "bg-[#3ea6ff] hover:bg-[#65b8ff] text-black cursor-pointer shadow-sm")
                                            : "bg-[#272727] text-[#717171] cursor-not-allowed"
                                    )}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <YouTubeCommentText 
                            content={parsed.cleanContent} 
                            isSpoiler={comment.is_spoiler} 
                            replyingToName={comment.replyingToName}
                            onOpenMedia={onOpenMedia}
                        />
                    )}

                    {/* YouTube Action Bar: ThumbsUp, ThumbsDown, Reply */}
                    <div className="flex items-center gap-1 mt-1 -ml-2 text-[#f1f1f1]">
                        <button
                            type="button"
                            onClick={() => onLikeToggle(comment.id)}
                            className={cn(
                                "flex items-center gap-1.5 p-2 rounded-full hover:bg-white/10 active:scale-90 transition-all select-none cursor-pointer",
                                isLiked ? (themeStyles?.accentText || "text-[#3ea6ff]") : "text-[#aaaaaa] hover:text-[#f1f1f1]"
                            )}
                            title="Like"
                        >
                            <ThumbsUp size={16} className={cn(isLiked && (themeStyles?.accentText ? "fill-current" : "fill-[#3ea6ff]"))} />
                            {likesCount > 0 && (
                                <span className="text-[12px] font-medium leading-none">{likesCount}</span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => onDislikeToggle(comment.id)}
                            className={cn(
                                "p-2 rounded-full hover:bg-white/10 active:scale-90 transition-all select-none cursor-pointer",
                                isDisliked ? "text-white" : "text-[#aaaaaa] hover:text-[#f1f1f1]"
                            )}
                            title="Dislike"
                        >
                            <ThumbsDown size={16} className={cn(isDisliked && "fill-white")} />
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowReplyBox(!showReplyBox)}
                            className="text-[12px] font-semibold text-[#f1f1f1] hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors active:scale-95 cursor-pointer select-none"
                        >
                            Reply
                        </button>
                    </div>

                    {/* Inline Reply Input Box */}
                    {showReplyBox && (
                        <div className="mt-3 mb-3">
                            <YouTubeCommentInput
                                episodeId=""
                                currentUserAvatar={currentUserAvatar}
                                currentDisplayName={currentDisplayName}
                                isTraveler={isTraveler}
                                focusOnMount={true}
                                replyingTo={{ id: comment.id, username: displayName }}
                                onCancelReply={() => setShowReplyBox(false)}
                                onRequireAuth={onRequireAuth}
                                onPost={(text, spoiler, pid) => {
                                    onReply(text, spoiler, pid || comment.id);
                                    setShowReplyBox(false);
                                    setShowRepliesToggle(true);
                                }}
                                placeholder="Add a reply..."
                                buttonText="Reply"
                                isReply={true}
                                themeStyles={themeStyles}
                            />
                        </div>
                    )}

                    {/* YouTube Nested Replies Toggle Accordion */}
                    {!isReply && hasReplies && (
                        <div className="mt-1">
                            <button
                                type="button"
                                onClick={() => setShowRepliesToggle(!showRepliesToggle)}
                                className={cn(
                                    "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors active:scale-95 select-none w-fit cursor-pointer",
                                    themeStyles?.accentText || "text-[#3ea6ff]",
                                    themeStyles ? "hover:bg-white/10" : "hover:bg-[#263850]/40"
                                )}
                            >
                                {showRepliesToggle ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                <span>{allReplies.length} {allReplies.length === 1 ? 'reply' : 'replies'}</span>
                            </button>

                            {showRepliesToggle && (
                                <div className="mt-2 space-y-2 pl-3 md:pl-4 border-l border-zinc-800/80">
                                    {allReplies.map((reply) => (
                                        <YouTubeCommentItem
                                            key={reply.id}
                                            comment={{ ...reply, replies: [] }}
                                            currentUserId={currentUserId}
                                            currentUserAvatar={currentUserAvatar}
                                            currentDisplayName={currentDisplayName}
                                            isTraveler={isTraveler}
                                            onReply={onReply}
                                            onReport={onReport}
                                            onDelete={onDelete}
                                            onEdit={onEdit}
                                            onLikeToggle={onLikeToggle}
                                            onDislikeToggle={onDislikeToggle}
                                            onRequireAuth={onRequireAuth}
                                            onOpenMedia={onOpenMedia}
                                            isLiked={isLiked}
                                            isDisliked={isDisliked}
                                            likesCount={reply.likes_count || 0}
                                            isReply={true}
                                            themeStyles={themeStyles}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT: 100% YouTube Comments with Full Profile Sync & Media ---
export default function ShadowComments({ 
    episodeId, 
    compact = false, 
    onClose, 
    themeColor,
    onToggleSnap,
    isSnappedFull = false
}: ShadowCommentsProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const searchStr = searchParams ? searchParams.toString() : '';
    const themeStyles = useMemo(() => resolvePageTheme(pathname, searchStr, themeColor), [pathname, searchStr, themeColor]);

    const { user, profile } = useAuth();
    const travellerProfile = useTravellerProfile();

    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'top' | 'newest'>('top');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [pendingPost, setPendingPost] = useState<{ content: string; isSpoiler: boolean; parentId: string | null } | null>(null);

    // Profile modals & in-place edit state
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isEditingGuestName, setIsEditingGuestName] = useState(false);
    const [guestNameInput, setGuestNameInput] = useState('');

    // Media lightbox state
    const [lightboxMedia, setLightboxMedia] = useState<{ url: string; alt: string } | null>(null);

    // Likes & Dislikes local storage state for instantaneous user feedback
    const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
    const [userDislikes, setUserDislikes] = useState<Record<string, boolean>>({});
    const [extraLikes, setExtraLikes] = useState<Record<string, number>>({});

    // Profile Synchronization: Adventurer (Signed In) vs Traveler (Not Signed In)
    const isSignedIn = !!user;
    const isTraveler = !isSignedIn;

    const currentUserId = user?.id || null;
    const currentUserAvatar = isSignedIn
        ? (profile?.avatar_url || user?.user_metadata?.avatar_url || travellerProfile.avatar || DEFAULT_AVATAR)
        : (travellerProfile.avatar || DEFAULT_AVATAR);

    const currentDisplayName = isSignedIn
        ? (profile?.username || user?.user_metadata?.username || 'Adventurer')
        : (travellerProfile.name || 'Shadow Traveller');

    // Load user's like/dislike cache
    useEffect(() => {
        try {
            const storedLikes = localStorage.getItem('yt_comment_likes');
            const storedDislikes = localStorage.getItem('yt_comment_dislikes');
            if (storedLikes) setUserLikes(JSON.parse(storedLikes));
            if (storedDislikes) setUserDislikes(JSON.parse(storedDislikes));
        } catch {}
    }, []);

    // Handle guest name change
    const handleSaveGuestName = () => {
        if (!guestNameInput.trim()) {
            setIsEditingGuestName(false);
            return;
        }
        saveTravellerProfile({ name: guestNameInput.trim() });
        setIsEditingGuestName(false);
        toast.success(`Traveler name updated to @${guestNameInput.trim()}`);
    };

    const handleRandomizeGuestName = () => {
        const random = getRandomGuestName();
        saveTravellerProfile({ name: random });
        setGuestNameInput(random);
        toast.success(`Assigned: @${random}`);
    };

    // Handle guest avatar change
    const handleSelectGuestAvatar = (url: string) => {
        saveTravellerProfile({ avatar: url });
        setIsAvatarModalOpen(false);
        toast.success("Traveler avatar updated successfully!");
    };

    // FETCH COMMENTS
    const fetchComments = async () => {
        if (!supabase) return;

        try {
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    id,
                    content,
                    user_id,
                    parent_id,
                    created_at,
                    is_spoiler,
                    is_edited,
                    profiles (
                        id,
                        username,
                        avatar_url,
                        full_name,
                        role,
                        admin_title
                    )
                `)
                .eq('episode_id', episodeId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Comments Fetch Error:", error);
                setIsLoading(false);
                return;
            }

            if (data) {
                const typedData = data as unknown as Comment[];
                const commentMap = new Map<string, Comment>();
                const roots: Comment[] = [];

                // 1st pass: build mapping
                typedData.forEach(c => {
                    c.replies = [];
                    commentMap.set(c.id, c);
                });

                // 2nd pass: organize parent-child hierarchy
                typedData.forEach(c => {
                    if (c.parent_id) {
                        const parent = commentMap.get(c.parent_id);
                        if (parent) {
                            parent.replies!.push(c);
                        } else {
                            roots.push(c);
                        }
                    } else {
                        roots.push(c);
                    }
                });

                setComments(roots);
            }
        } catch (err) {
            console.error("Error fetching comments:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        fetchComments();

        if (!supabase) return;

        // Realtime Subscription
        const channel = supabase
            .channel(`comments-realtime-${episodeId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'comments',
                filter: `episode_id=eq.${episodeId}`
            }, () => {
                fetchComments();
            })
            .subscribe();

        return () => {
            supabase?.removeChannel(channel);
        };
    }, [episodeId]);

    // ACTIONS
    const handlePost = async (content: string, isSpoiler: boolean, parentId: string | null = null) => {
        if (!content.trim()) return;

        // Authenticated Adventurers post directly via Supabase client
        if (user && user.id && supabase) {
            const { error } = await (supabase.from('comments') as any).insert({
                episode_id: episodeId,
                user_id: user.id,
                content,
                is_spoiler: isSpoiler,
                parent_id: parentId
            });

            if (!error) {
                toast.success("Comment added");
                fetchComments();
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('shadow-comment-added', { detail: { episodeId } }));
                }
                const authorName = currentDisplayName || 'Adventurer';
                processMentionsAndNotify(supabase, content, user.id, authorName, 'comment');
            } else {
                toast.error("Failed to post comment");
            }
            return;
        }

        // Non-signed in Travelers post directly via server admin API without requiring login
        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    episode_id: episodeId,
                    content,
                    parent_id: parentId,
                    is_spoiler: isSpoiler,
                    traveler_name: travellerProfile.name,
                    traveler_avatar: travellerProfile.avatar
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                toast.success("Comment added");
                fetchComments();
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('shadow-comment-added', { detail: { episodeId } }));
                }
            } else {
                toast.error(data.error || "Failed to post comment");
            }
        } catch (err) {
            console.error('Failed to post guest comment:', err);
            toast.error("Failed to post comment");
        }
    };

    const handleAuthSuccess = () => {
        setShowAuthModal(false);
        if (pendingPost) {
            handlePost(pendingPost.content, pendingPost.isSpoiler, pendingPost.parentId);
            setPendingPost(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('comments').delete().eq('id', id);
        if (!error) {
            toast.success("Comment deleted");
            setComments(prev => prev.filter(c => c.id !== id));
        } else {
            toast.error("Failed to delete comment");
        }
    };

    const handleEdit = async (id: string, newContent: string) => {
        if (!supabase) return;
        const { error } = await (supabase.from('comments') as any).update({ 
            content: newContent, 
            is_edited: true 
        }).eq('id', id);

        if (!error) {
            toast.success("Comment updated");
            fetchComments();
        } else {
            toast.error("Failed to update comment");
        }
    };

    const handleReport = async (commentId: string, reportedUserId: string) => {
        if (!supabase) return;
        if (!user) {
            setShowAuthModal(true);
            return;
        }
        const { error } = await (supabase.from('comment_reports') as any).insert({
            comment_id: commentId,
            reporter_id: user.id,
            reported_user_id: reportedUserId,
            reason: "User Report"
        });
        if (!error) toast.success("Report submitted. Thank you for keeping the community safe.");
        else toast.error("Already reported.");
    };

    // Like / Dislike optimistic toggle
    const handleLikeToggle = (commentId: string) => {
        const currentlyLiked = !!userLikes[commentId];
        const currentlyDisliked = !!userDislikes[commentId];

        const newUserLikes = { ...userLikes };
        const newUserDislikes = { ...userDislikes };
        let diff = 0;

        if (currentlyLiked) {
            delete newUserLikes[commentId];
            diff = -1;
        } else {
            newUserLikes[commentId] = true;
            diff = 1;
            if (currentlyDisliked) {
                delete newUserDislikes[commentId];
            }
        }

        setUserLikes(newUserLikes);
        setUserDislikes(newUserDislikes);
        setExtraLikes(prev => ({ ...prev, [commentId]: (prev[commentId] || 0) + diff }));

        try {
            localStorage.setItem('yt_comment_likes', JSON.stringify(newUserLikes));
            localStorage.setItem('yt_comment_dislikes', JSON.stringify(newUserDislikes));
        } catch {}
    };

    const handleDislikeToggle = (commentId: string) => {
        const currentlyDisliked = !!userDislikes[commentId];
        const currentlyLiked = !!userLikes[commentId];

        const newUserLikes = { ...userLikes };
        const newUserDislikes = { ...userDislikes };

        if (currentlyDisliked) {
            delete newUserDislikes[commentId];
        } else {
            newUserDislikes[commentId] = true;
            if (currentlyLiked) {
                delete newUserLikes[commentId];
                setExtraLikes(prev => ({ ...prev, [commentId]: (prev[commentId] || 0) - 1 }));
            }
        }

        setUserLikes(newUserLikes);
        setUserDislikes(newUserDislikes);

        try {
            localStorage.setItem('yt_comment_likes', JSON.stringify(newUserLikes));
            localStorage.setItem('yt_comment_dislikes', JSON.stringify(newUserDislikes));
        } catch {}
    };

    // Total comments count including replies
    const totalCommentsCount = useMemo(() => {
        return comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);
    }, [comments]);

    // Filter comments by search query if active
    const filteredComments = useMemo(() => {
        if (!searchQuery.trim()) return comments;
        const q = searchQuery.toLowerCase();
        return comments.filter(c => 
            c.content.toLowerCase().includes(q) ||
            (c.profiles?.username && c.profiles.username.toLowerCase().includes(q)) ||
            (c.replies && c.replies.some(r => r.content.toLowerCase().includes(q)))
        );
    }, [comments, searchQuery]);

    // Sorted root comments based on selected YouTube filter
    const sortedComments = useMemo(() => {
        const cloned = [...filteredComments];
        if (sortBy === 'top') {
            return cloned.sort((a, b) => {
                const scoreA = (a.likes_count || 0) + (extraLikes[a.id] || 0) + (a.replies?.length || 0);
                const scoreB = (b.likes_count || 0) + (extraLikes[b.id] || 0) + (b.replies?.length || 0);
                if (scoreB !== scoreA) return scoreB - scoreA;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
        }
        return cloned.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [filteredComments, sortBy, extraLikes]);

    // --- RENDER COMPACT / YOUTUBE SHORTS DRAWER VIEW ---
    if (compact) {
        return (
            <div className="w-full flex flex-col font-sans text-[#f1f1f1]">
                {/* YOUTUBE SHORTS DRAWER HEADER */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#272727] shrink-0">
                    <div className="flex items-center gap-2.5">
                        <h3 className="text-[17px] md:text-[18px] font-bold text-white tracking-tight">Comments</h3>
                        <span className="text-[14px] text-[#aaaaaa] font-medium">
                            {totalCommentsCount}
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Search toggle */}
                        <button
                            type="button"
                            onClick={() => setShowSearch(!showSearch)}
                            className={cn(
                                "p-2 rounded-full transition-colors cursor-pointer",
                                showSearch ? cn("bg-white/10", themeStyles.accentText) : "text-[#aaaaaa] hover:text-white hover:bg-white/10"
                            )}
                            title="Search comments"
                        >
                            <Search size={17} />
                        </button>

                        {/* Sort Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger className="p-2 rounded-full hover:bg-white/10 text-[#aaaaaa] hover:text-white transition-colors outline-none cursor-pointer" title="Sort comments">
                                <ArrowUpDown size={17} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#282828] border-none text-[#f1f1f1] shadow-2xl rounded-xl py-1.5 min-w-[150px]">
                                <DropdownMenuItem 
                                    onClick={() => setSortBy('top')} 
                                    className={cn("text-[14px] px-4 py-2 cursor-pointer focus:bg-white/10 flex items-center justify-between", sortBy === 'top' && "font-semibold bg-white/5")}
                                >
                                    <span>Top comments</span>
                                    {sortBy === 'top' && <Check size={16} className={cn(themeStyles.accentText)} />}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    onClick={() => setSortBy('newest')} 
                                    className={cn("text-[14px] px-4 py-2 cursor-pointer focus:bg-white/10 flex items-center justify-between", sortBy === 'newest' && "font-semibold bg-white/5")}
                                >
                                    <span>Newest first</span>
                                    {sortBy === 'newest' && <Check size={16} className={cn(themeStyles.accentText)} />}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Expand / Collapse Snap Toggle */}
                        {onToggleSnap && (
                            <button
                                type="button"
                                onClick={onToggleSnap}
                                className="p-1.5 rounded-full hover:bg-white/10 text-[#aaaaaa] hover:text-white transition-colors cursor-pointer"
                                title={isSnappedFull ? "Collapse to bottom" : "Expand to full screen"}
                                aria-label="Toggle Comments Sheet Height"
                            >
                                {isSnappedFull ? <ChevronDown size={19} /> : <ChevronUp size={19} />}
                            </button>
                        )}

                        {/* Optional Close Button */}
                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 rounded-full hover:bg-white/10 text-[#aaaaaa] hover:text-white transition-colors cursor-pointer"
                                aria-label="Close comments"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Inline Comment Search Bar */}
                {showSearch && (
                    <div className="relative mb-3 animate-in fade-in duration-200">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter comments by keywords or @username..."
                            className={cn(
                                "w-full bg-[#181818] border border-zinc-800 text-xs text-white rounded-full pl-8 pr-8 py-2 placeholder-zinc-500 focus:outline-none",
                                themeStyles.focusBorder
                            )}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                )}

                {/* YOUTUBE SHORTS COMMENT INPUT */}
                <div className="mb-4">
                    <YouTubeCommentInput
                        episodeId={episodeId}
                        currentUserAvatar={currentUserAvatar}
                        currentDisplayName={currentDisplayName}
                        isTraveler={isTraveler}
                        onPost={handlePost}
                        onRequireAuth={() => setShowAuthModal(true)}
                        onAvatarClick={isTraveler ? () => setIsAvatarModalOpen(true) : undefined}
                        placeholder="Add a comment..."
                        buttonText="Comment"
                        themeStyles={themeStyles}
                    />
                </div>

                {/* COMMENTS FEED */}
                <div className="space-y-4">
                    {sortedComments.length === 0 ? (
                        <div className="py-12 text-center text-[#aaaaaa] text-[14px]">
                            {searchQuery ? `No comments found matching "${searchQuery}"` : "No comments yet. Say something to start the conversation."}
                        </div>
                    ) : (
                        sortedComments.map(c => (
                            <YouTubeCommentItem
                                key={c.id}
                                comment={c}
                                currentUserId={currentUserId}
                                currentUserAvatar={currentUserAvatar}
                                currentDisplayName={currentDisplayName}
                                isTraveler={isTraveler}
                                onReply={handlePost}
                                onReport={handleReport}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                                onLikeToggle={handleLikeToggle}
                                onDislikeToggle={handleDislikeToggle}
                                onRequireAuth={() => setShowAuthModal(true)}
                                onOpenMedia={(url, alt) => setLightboxMedia({ url, alt })}
                                isLiked={!!userLikes[c.id]}
                                isDisliked={!!userDislikes[c.id]}
                                likesCount={(c.likes_count || 0) + (extraLikes[c.id] || 0)}
                                themeStyles={themeStyles}
                            />
                        ))
                    )}
                </div>

                {/* Avatar Selector Modal for Traveler Profile Customization */}
                <div onClick={(e) => e.stopPropagation()}>
                    <AvatarSelectorModal
                        isOpen={isAvatarModalOpen}
                        onClose={() => setIsAvatarModalOpen(false)}
                        onSelect={handleSelectGuestAvatar}
                        currentUrl={travellerProfile.avatar}
                        isGuest={true}
                    />
                </div>

                {/* Auth Modal */}
                <div onClick={(e) => e.stopPropagation()}>
                    <AuthModal
                        isOpen={showAuthModal}
                        onClose={() => setShowAuthModal(false)}
                        onAuthSuccess={handleAuthSuccess}
                    />
                </div>

                {/* Media Lightbox Zoom Modal */}
                <div onClick={(e) => e.stopPropagation()}>
                    <MediaLightbox
                        media={lightboxMedia}
                        onClose={() => setLightboxMedia(null)}
                    />
                </div>
            </div>
        );
    }

    // --- RENDER FULL WATCH PAGE YOUTUBE VIEW ---
    return (
        <div className="w-full mt-10 mb-14 font-sans text-[#f1f1f1] animate-in fade-in duration-300">
            {/* YOUTUBE DESKTOP HEADER */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-8">
                    <h2 className="text-[20px] font-bold text-white tracking-normal font-sans">
                        {totalCommentsCount} {totalCommentsCount === 1 ? 'Comment' : 'Comments'}
                    </h2>

                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-2 text-[14px] font-semibold text-white hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors outline-none cursor-pointer select-none">
                            <ArrowUpDown size={16} />
                            <span>Sort by</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-[#282828] border-none text-[#f1f1f1] shadow-2xl rounded-xl py-1.5 min-w-[150px]">
                            <DropdownMenuItem 
                                onClick={() => setSortBy('top')} 
                                className={cn("text-[14px] px-4 py-2 cursor-pointer focus:bg-white/10 flex items-center justify-between", sortBy === 'top' && "font-semibold bg-white/5")}
                            >
                                <span>Top comments</span>
                                {sortBy === 'top' && <Check size={16} className={cn(themeStyles.accentText)} />}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => setSortBy('newest')} 
                                className={cn("text-[14px] px-4 py-2 cursor-pointer focus:bg-white/10 flex items-center justify-between", sortBy === 'newest' && "font-semibold bg-white/5")}
                            >
                                <span>Newest first</span>
                                {sortBy === 'newest' && <Check size={16} className={cn(themeStyles.accentText)} />}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Search Toggle Button */}
                <div className="flex items-center gap-2">
                    {showSearch && (
                        <div className="relative animate-in fade-in duration-200">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Filter comments..."
                                className={cn(
                                    "w-56 bg-[#181818] border border-zinc-800 text-xs text-white rounded-full pl-8 pr-7 py-1.5 placeholder-zinc-500 focus:outline-none",
                                    themeStyles.focusBorder
                                )}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowSearch(!showSearch)}
                        className={cn(
                            "p-2 rounded-full transition-colors cursor-pointer",
                            showSearch ? cn("bg-white/10", themeStyles.accentText) : "text-[#aaaaaa] hover:text-white hover:bg-white/10"
                        )}
                        title="Search comments"
                    >
                        <Search size={18} />
                    </button>
                </div>
            </div>

            {/* TOP COMMENT INPUT (Desktop YouTube format) */}
            <div className="mb-8">
                <YouTubeCommentInput
                    episodeId={episodeId}
                    currentUserAvatar={currentUserAvatar}
                    currentDisplayName={currentDisplayName}
                    isTraveler={isTraveler}
                    onPost={handlePost}
                    onRequireAuth={() => setShowAuthModal(true)}
                    onAvatarClick={isTraveler ? () => setIsAvatarModalOpen(true) : undefined}
                    placeholder="Add a comment..."
                    buttonText="Comment"
                    themeStyles={themeStyles}
                />
            </div>

            {/* COMMENTS LIST */}
            <div className="space-y-6">
                {sortedComments.length === 0 ? (
                    <div className="py-14 text-center text-[#aaaaaa] text-[14px]">
                        {searchQuery ? `No comments found matching "${searchQuery}"` : "No comments yet. Say something to start the conversation."}
                    </div>
                ) : (
                    sortedComments.map(c => (
                        <YouTubeCommentItem
                            key={c.id}
                            comment={c}
                            currentUserId={currentUserId}
                            currentUserAvatar={currentUserAvatar}
                            currentDisplayName={currentDisplayName}
                            isTraveler={isTraveler}
                            onReply={handlePost}
                            onReport={handleReport}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onLikeToggle={handleLikeToggle}
                            onDislikeToggle={handleDislikeToggle}
                            onRequireAuth={() => setShowAuthModal(true)}
                            onOpenMedia={(url, alt) => setLightboxMedia({ url, alt })}
                            isLiked={!!userLikes[c.id]}
                            isDisliked={!!userDislikes[c.id]}
                            likesCount={(c.likes_count || 0) + (extraLikes[c.id] || 0)}
                            themeStyles={themeStyles}
                        />
                    ))
                )}
            </div>

            {/* Avatar Selector Modal for Traveler Profile Customization */}
            <div onClick={(e) => e.stopPropagation()}>
                <AvatarSelectorModal
                    isOpen={isAvatarModalOpen}
                    onClose={() => setIsAvatarModalOpen(false)}
                    onSelect={handleSelectGuestAvatar}
                    currentUrl={travellerProfile.avatar}
                    isGuest={true}
                />
            </div>

            {/* Auth Modal */}
            <div onClick={(e) => e.stopPropagation()}>
                <AuthModal
                    isOpen={showAuthModal}
                    onClose={() => setShowAuthModal(false)}
                    onAuthSuccess={handleAuthSuccess}
                />
            </div>

            {/* Media Lightbox Zoom Modal */}
            <div onClick={(e) => e.stopPropagation()}>
                <MediaLightbox
                    media={lightboxMedia}
                    onClose={() => setLightboxMedia(null)}
                />
            </div>
        </div>
    );
}
