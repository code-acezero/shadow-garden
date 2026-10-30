"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ImageAPI } from '@/lib/api'; 
import { getOptimizedImageUrl } from '@/lib/imageUtils'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Grid, Heart, Bookmark, Settings, Upload, Trash2, Link as LinkIcon, Camera, LayoutGrid, CheckCircle, MessageSquare, History, Users, Award, Star, Lock, ShieldAlert, Pencil, Save, X, Move, Image as ImageIcon, Check, Loader2, ChevronRight, Crop, Eye, EyeOff, Zap, Shield, Bell, Tv, AlertTriangle, ShoppingBag, Coins, Music2, MoreHorizontal, ChevronDown, SlidersHorizontal, Share2, LogOut, CalendarCheck, Instagram, Youtube, Github, Twitter, Globe, Plus, Search, MessageCircle, ExternalLink, Layers, Crown, Flame, Swords, Gem, Gift, Trophy, Compass, Cpu, Feather, Trees, Cat, Ghost, Sun, Waves, Moon, type LucideIcon
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { playGummyTap, playGummyPop, playSquishyJelly, playGummyBubble } from '@/lib/audioManager';
import AuthModal from '@/components/Auth/AuthModal';
import ShadowAvatar from '@/components/User/ShadowAvatar'; 
import ProfileAvatar from '@/components/User/ProfileAvatar';
import FantasyFrame from '@/components/User/FantasyFrame';
import FilledCoinIcon from '@/components/UIx/FilledCoinIcon';
import DailyTasksSection from '@/components/User/DailyTasksSection';
import { ALL_ATELIER_STORE_FRAMES, ATELIER_CATEGORIES } from '@/lib/atelierFrames';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import UserTitleBadge from '@/components/ui/UserTitleBadge';
import { getFrameForTitle } from '@/lib/userTitles';
import { getAvailableTitles, getEquippedTitle, getTitleDefinition, getNextMilestone, ALL_TITLES, TitleDefinition } from '@/lib/userTitles';
import Footer from '@/components/Anime/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AvatarSelectorModal, { getRandomAvatar, getRandomGuestName } from '@/components/User/AvatarSelectorModal';
import AvatarCropperModal from '@/components/User/AvatarCropperModal';
import { useTravellerProfile, saveTravellerProfile } from '@/hooks/useTravellerProfile';
import { getWatchRoute, formatAnimeTitle } from '@/lib/utils';

const PRESET_COVERS = [
    { name: 'Nebula Dreams', url: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2000' },
    { name: 'Sakura Night', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=2000' },
    { name: 'Cosmic Cyber', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2000' },
    { name: 'Aetherial Mountains', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000' },
    { name: 'Anime Sunset Coast', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000' },
    { name: 'Celestial Aurora', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2000' },
];



function isDeadAvatarUrl(url?: any): boolean {
  if (!url || typeof url !== 'string') return true;
  return url.includes('ibb.co') || url.includes('imgbb.com') || url.trim() === '';
}

function resolveSafeAvatar(...candidates: any[]): string {
  const GOOGLE_FALLBACK = 'https://lh3.googleusercontent.com/a/ACg8ocLnpRFtv4bK_qXzuqBG4vBF6UzrdAwPBOCPYofJ0tSYCc5RyKz4=s96-c';
  for (const c of candidates) {
    if (typeof c === 'string' && !isDeadAvatarUrl(c)) {
      return c;
    }
  }
  return GOOGLE_FALLBACK;
}

const TITLE_RANKS = [
    { title: 'Novice', minLevel: 1, desc: 'Granted upon entering the Shadow realm.' },
    { title: 'Pathfinder', minLevel: 5, desc: 'Beginning exploration into uncharted territory.' },
    { title: 'Champion', minLevel: 10, desc: 'Battle-tested initiate displaying martial potential.' },
    { title: 'Commander', minLevel: 20, desc: 'Skilled operative executing guild missions.' },
    { title: 'Vanguard', minLevel: 35, desc: 'Frontline leader of Shadow expeditionary forces.' },
    { title: 'Grandmaster', minLevel: 50, desc: 'Master of shadow magic and battlefield tactics.' },
    { title: 'Sovereign', minLevel: 65, desc: 'Eradicator of high-level realm threats.' },
    { title: 'Conqueror', minLevel: 80, desc: 'Legendary warrior revered across kingdoms.' },
    { title: 'Overlord', minLevel: 90, desc: 'Wielder of ancient dark arts & shadow domain.' },
    { title: 'Monarch', minLevel: 100, desc: 'The ultimate level 100 supreme peak of power.' },
];

const MILESTONE_FRAMES: Record<number, { id: string; name: string }> = {
    5: { id: 'iron', name: 'Iron Seal' },
    10: { id: 'bronze', name: 'Bronze Crest' },
    20: { id: 'silver', name: 'Silver Knight' },
    35: { id: 'crimson', name: 'Crimson Blade' },
    50: { id: 'sapphire', name: 'Sapphire Arc' },
    65: { id: 'emerald', name: 'Emerald Wilds' },
    75: { id: 'golden', name: 'Golden Realm' },
    85: { id: 'shadow', name: 'Shadow Void' },
    95: { id: 'celestial', name: 'Celestial Rift' },
    100: { id: 'divine', name: 'Divine Archon' },
};

export type SocialPlatform = 'instagram' | 'twitter' | 'discord' | 'youtube' | 'tiktok' | 'github' | 'website';

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

const parseSocialLinks = (raw?: string | null): SocialLink[] => {
  if (!raw || typeof raw !== 'string' || !raw.trim()) return [];
  const clean = raw.trim();
  if (clean.startsWith('[') || clean.startsWith('{')) {
    try {
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => item && item.url && item.url.trim().length > 0);
      }
    } catch (_) {}
  }
  let platform: SocialPlatform = 'website';
  const lower = clean.toLowerCase();
  if (lower.includes('instagram.com')) platform = 'instagram';
  else if (lower.includes('twitter.com') || lower.includes('x.com')) platform = 'twitter';
  else if (lower.includes('discord.gg') || lower.includes('discord.com')) platform = 'discord';
  else if (lower.includes('youtube.com') || lower.includes('youtu.be')) platform = 'youtube';
  else if (lower.includes('tiktok.com')) platform = 'tiktok';
  else if (lower.includes('github.com')) platform = 'github';

  return [{ platform, url: clean }];
};

const formatSocialHref = (link: SocialLink): string => {
  const val = link.url.trim();
  if (val.startsWith('http://') || val.startsWith('https://')) return val;
  if (link.platform === 'instagram') return `https://instagram.com/${val.replace(/^@/, '')}`;
  if (link.platform === 'twitter') return `https://x.com/${val.replace(/^@/, '')}`;
  if (link.platform === 'github') return `https://github.com/${val.replace(/^@/, '')}`;
  if (link.platform === 'youtube') return `https://youtube.com/@${val.replace(/^@/, '')}`;
  if (link.platform === 'tiktok') return `https://tiktok.com/@${val.replace(/^@/, '')}`;
  if (link.platform === 'discord') return val.startsWith('discord.gg') ? `https://${val}` : `https://discord.gg/${val}`;
  return `https://${val}`;
};

const formatSocialLabel = (link: SocialLink): string => {
  const val = link.url.trim().replace(/^https?:\/\/(www\.)?/, '');
  if (link.platform === 'instagram') {
    const handle = val.replace(/^instagram\.com\/?/, '').replace(/^@+/, '').replace(/\/$/, '');
    return handle ? `@${handle}` : 'Instagram';
  }
  if (link.platform === 'twitter') {
    const handle = val.replace(/^(x|twitter)\.com\/?/, '').replace(/^@+/, '').replace(/\/$/, '');
    return handle ? `@${handle}` : 'X';
  }
  if (link.platform === 'github') {
    const handle = val.replace(/^github\.com\/?/, '').replace(/^@+/, '').replace(/\/$/, '');
    return handle || 'GitHub';
  }
  if (link.platform === 'youtube') {
    const handle = val.replace(/^youtube\.com\/?(@)?/, '').replace(/^@+/, '').replace(/\/$/, '');
    return handle ? `@${handle}` : 'YouTube';
  }
  if (link.platform === 'discord') {
    const handle = val.replace(/^discord\.(gg|com\/invite)\/?/, '').replace(/\/$/, '');
    return handle || 'Discord';
  }
  if (link.platform === 'tiktok') {
    const handle = val.replace(/^tiktok\.com\/@?/, '').replace(/^@+/, '').replace(/\/$/, '');
    return handle ? `@${handle}` : 'TikTok';
  }
  return val.replace(/\/$/, '') || 'Website';
};

const renderSocialIcon = (platform: SocialPlatform, size: number = 13) => {
  switch (platform) {
    case 'instagram':
      return <Instagram size={size} className="text-pink-400" />;
    case 'twitter':
      return <Twitter size={size} className="text-sky-400" />;
    case 'discord':
      return <MessageCircle size={size} className="text-indigo-400" />;
    case 'youtube':
      return <Youtube size={size} className="text-red-400" />;
    case 'github':
      return <Github size={size} className="text-zinc-300" />;
    case 'tiktok':
      return <Music2 size={size} className="text-cyan-400 shrink-0" />;
    case 'website':
    default:
      return <Globe size={size} className="text-emerald-400" />;
  }
};

const ProfilePostGridItem = React.memo(function ProfilePostGridItem({ post }: { post: any }) {
    const rawImage = post.images && post.images.length > 0 ? post.images[0] : null;
    const [imgFailed, setImgFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [imgSrc, setImgSrc] = useState<string | null>(rawImage ? getOptimizedImageUrl(rawImage) : null);

    useEffect(() => {
        setImgSrc(rawImage ? getOptimizedImageUrl(rawImage) : null);
        setAttempt(0);
        setImgFailed(false);
    }, [rawImage]);
    
    const hasImage = !!imgSrc && !imgFailed;

    const handleImgError = () => {
        if (!rawImage) {
            setImgFailed(true);
            return;
        }
        if (attempt === 0) {
            setAttempt(1);
            setImgSrc(`https://images.weserv.nl/?url=${encodeURIComponent(rawImage)}`);
        } else if (attempt === 1) {
            setAttempt(2);
            setImgSrc(rawImage);
        } else {
            setImgFailed(true);
        }
    };

    const likes = post.social_likes?.[0]?.count ?? post.likes_count ?? 0;
    const comments = post.social_comments?.[0]?.count ?? post.comments_count ?? 0;

    return (
        <Link 
            href={`/social/post/${post.id}`} 
            key={post.id} 
            className="relative aspect-square bg-[#0e0e12] group overflow-hidden cursor-pointer rounded-lg border border-white/5 hover:border-white/20 transition-all select-none"
        >
            {hasImage ? (
                <img 
                    src={imgSrc!} 
                    alt="Post image"
                    referrerPolicy="no-referrer"
                    onError={handleImgError}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-4 bg-gradient-to-br from-[#131318] to-[#0a0a0d] text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.03),_transparent_70%)] pointer-events-none" />
                    {post.content ? (
                        <p className="text-xs sm:text-sm text-zinc-300 font-medium line-clamp-4 overflow-hidden break-words relative z-10 leading-relaxed px-1">
                            {post.content}
                        </p>
                    ) : (
                        <div className="flex flex-col items-center gap-1.5 text-zinc-500 relative z-10">
                            <ImageIcon size={22} className="opacity-40" />
                            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Post Media</span>
                        </div>
                    )}
                </div>
            )}
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 sm:gap-6 z-10 backdrop-blur-[2px]">
                <div className="flex items-center gap-1.5 font-bold text-white text-xs sm:text-sm">
                    <Heart className="fill-rose-500 text-rose-500" size={15} /> 
                    <span>{likes}</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-white text-xs sm:text-sm">
                    <MessageSquare className="fill-white text-white" size={15} /> 
                    <span>{comments}</span>
                </div>
            </div>
        </Link>
    );
});

export default function ProfilePage() {
    const { user, profile: rawProfile, refreshSession, isLoading } = useAuth();
    const profile = rawProfile as any;
    const router = useRouter();

    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => { setHasMounted(true); }, []);

    const [isEditing, setIsEditing] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [avatarLibraryModalOpen, setAvatarLibraryModalOpen] = useState(false);
    const [cropperModalOpen, setCropperModalOpen] = useState(false);
    const [pendingAvatarSrc, setPendingAvatarSrc] = useState<string | null>(null);
    const [showTitleState, setShowTitleState] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<string>('posts');
    const [isStoreOpen, setIsStoreOpen] = useState<boolean>(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            const subParam = params.get('sub');
            if (tabParam === 'frames' || tabParam === 'vault') {
                setActiveTab('vault');
                if (subParam === 'tasks') setActiveTab('tasks');
                if (subParam === 'store') setIsStoreOpen(true);
            } else if (tabParam === 'tasks') {
                setActiveTab('tasks');
            } else if (tabParam && ['posts', 'favorites', 'vault', 'watchlist', 'notifications'].includes(tabParam)) {
                setActiveTab(tabParam);
            }
        }
    }, []);

    const handleShareProfile = () => {
        if (typeof window !== 'undefined') {
            if (navigator.share) {
                navigator.share({ title: `${profile?.username || 'Shadow Member'} - Profile`, url: window.location.href }).catch(() => {});
            } else {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Profile link copied to clipboard!');
            }
        }
    };

    useEffect(() => {
        if (profile && typeof profile.show_title === 'boolean') {
            setShowTitleState(profile.show_title);
        } else if (user?.id && typeof window !== 'undefined') {
            const localVal = localStorage.getItem(`shadow_show_title_${user.id}`);
            if (localVal !== null) setShowTitleState(localVal !== 'false');
        }
    }, [profile, user]);

    // Traveller profile (localStorage-backed, no auth required)
    const traveller = useTravellerProfile();
    const [travellerAvatarModalOpen, setTravellerAvatarModalOpen] = useState(false);
    const [travellerEditing, setTravellerEditing] = useState(false);
    const [travellerDraft, setTravellerDraft] = useState('');

    useEffect(() => {
        if (!user && traveller.name) {
            setTravellerDraft(traveller.name);
        }
    }, [user, traveller.name]);

    const handleSaveTraveller = () => {
        const name = travellerDraft.trim() || traveller.name;
        saveTravellerProfile({ name, avatar: traveller.avatar });
        toast.success('Profile saved!');
        setTravellerEditing(false);
    };
    
    // Form State
    const [fullName, setFullName] = useState("");
    const [bio, setBio] = useState("");
    const [website, setWebsite] = useState("");
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    const [gender, setGender] = useState("male");
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // Stats State
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [posts, setPosts] = useState<any[]>([]);
    const [likedPosts, setLikedPosts] = useState<any[]>([]);
    const [watchHistory, setWatchHistory] = useState<any[]>([]);
    
    const [followersList, setFollowersList] = useState<any[]>([]);
    const [followingList, setFollowingList] = useState<any[]>([]);
    const [showFollowersModal, setShowFollowersModal] = useState(false);
    const [showFollowingModal, setShowFollowingModal] = useState(false);

    // Frame State
    const [activeFrame, setActiveFrame] = useState('none');
    const [userCoins, setUserCoins] = useState<number>(50);
    const [purchasedFrames, setPurchasedFrames] = useState<string[]>(['none', 'iron']);
    const [equippedTitle, setEquippedTitle] = useState<string>('');
    const [titleFilter, setTitleFilter] = useState<'all' | 'level' | 'staff' | 'former' | 'special'>('all');
    const [followerSearchQuery, setFollowerSearchQuery] = useState('');
    const [followingSearchQuery, setFollowingSearchQuery] = useState('');
    const [myFollowingIds, setMyFollowingIds] = useState<Set<string>>(new Set());
    const [frameFilterTab, setFrameFilterTab] = useState<string>('all');
    const [storeDisplayLimit, setStoreDisplayLimit] = useState<number>(24);
    const [claimedLevels, setClaimedLevels] = useState<number[]>([]);
    const [isLevelProgressOpen, setIsLevelProgressOpen] = useState(false);
    const [claimCelebration, setClaimCelebration] = useState<{ active: boolean; coins: number; level: number } | null>(null);
    const [inspectedLevelReward, setInspectedLevelReward] = useState<number | null>(null);

    useEffect(() => {
        if (profile) {
            setEquippedTitle(getEquippedTitle(profile));
        }
    }, [profile]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const key = user?.id ? `shadow_claimed_levels_${user.id}` : 'shadow_claimed_levels_guest';
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                setClaimedLevels(JSON.parse(saved));
            } catch {}
        } else if (profile?.settings?.claimed_levels && Array.isArray(profile.settings.claimed_levels)) {
            setClaimedLevels(profile.settings.claimed_levels);
        }
    }, [user, profile]);

    useEffect(() => {
        const handleTitleUpdate = (e: any) => {
            if (e.detail?.title) {
                setEquippedTitle(e.detail.title);
            }
        };
        window.addEventListener('shadow-title-updated', handleTitleUpdate);
        return () => window.removeEventListener('shadow-title-updated', handleTitleUpdate);
    }, []);

    const handleClaimLevelReward = async (targetLevel?: number) => {
        const currentLvl = profile?.level || 1;
        const unclaimed = Array.from({ length: currentLvl }, (_, i) => i + 1).filter(
            lvl => !claimedLevels.includes(lvl)
        );
        const levelsToClaim = targetLevel ? [targetLevel] : unclaimed;
        if (levelsToClaim.length === 0) {
            toast.info("No unclaimed rewards for this level.");
            return;
        }

        playSquishyJelly();
        const coinsWon = levelsToClaim.reduce((sum, lvl) => sum + (lvl * 30), 0);
        const newCoins = userCoins + coinsWon;
        const newClaimed = Array.from(new Set([...claimedLevels, ...levelsToClaim]));

        setUserCoins(newCoins);
        setClaimedLevels(newClaimed);
        setClaimCelebration({ active: true, coins: coinsWon, level: targetLevel || currentLvl });

        if (typeof window !== 'undefined') {
            const coinKey = user?.id ? `shadow_coins_${user.id}` : 'shadow_coins_guest';
            const claimKey = user?.id ? `shadow_claimed_levels_${user.id}` : 'shadow_claimed_levels_guest';
            localStorage.setItem(coinKey, String(newCoins));
            localStorage.setItem(claimKey, JSON.stringify(newClaimed));
            window.dispatchEvent(new CustomEvent('shadow-coins-updated', { detail: { coins: newCoins } }));
        }

        if (user?.id) {
            try {
                const currentSettings = profile?.settings || {};
                await supabase.from('profiles').update({
                    coins: newCoins,
                    settings: { ...currentSettings, claimed_levels: newClaimed },
                    updated_at: new Date().toISOString()
                }).eq('id', user.id);

                const notifMsg = levelsToClaim.length === 1
                    ? `You reached Level ${levelsToClaim[0]} and claimed +${coinsWon} Shadow Coins!`
                    : `You claimed +${coinsWon} Shadow Coins across ${levelsToClaim.length} mastery levels!`;

                const newNotif = {
                    id: `notif_${Date.now()}`,
                    user_id: user.id,
                    type: 'LEVEL_REWARD',
                    title: 'Level Mastery Reward Claimed!',
                    message: notifMsg,
                    is_read: false,
                    created_at: new Date().toISOString()
                };

                setUserNotifications(prev => [newNotif, ...prev]);

                await supabase.from('notifications').insert({
                    user_id: user.id,
                    type: 'LEVEL_REWARD',
                    title: 'Level Mastery Reward Claimed!',
                    message: notifMsg,
                    is_read: false
                }).catch(() => {});
            } catch (e) {
                console.error("Error updating claimed level in Supabase:", e);
            }
        }

        toast.success(`🎉 Claimed +${coinsWon} Coins!`);
        setTimeout(() => {
            setClaimCelebration(null);
        }, 3200);
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const coinKey = user?.id ? `shadow_coins_${user.id}` : 'shadow_coins_guest';
            const frameKey = user?.id ? `shadow_purchased_frames_${user.id}` : 'shadow_purchased_frames_guest';
            const activeFrameKey = user?.id ? `shadow_active_frame_${user.id}` : 'shadow_active_frame_guest';
            
            const savedCoins = localStorage.getItem(coinKey);
            if (savedCoins !== null) {
                setUserCoins(parseInt(savedCoins) || 50);
            } else if (profile?.coins !== undefined && profile.coins !== null) {
                setUserCoins(profile.coins);
            } else {
                setUserCoins(50);
            }

            const savedFrames = localStorage.getItem(frameKey) || localStorage.getItem('shadow_purchased_frames') || localStorage.getItem('shadow_purchased_frames_guest');
            if (savedFrames) {
                try {
                    const parsed = JSON.parse(savedFrames);
                    if (Array.isArray(parsed)) {
                        setPurchasedFrames(prev => Array.from(new Set([...prev, ...parsed, ...(Array.isArray(profile?.purchased_frames) ? profile.purchased_frames : [])])));
                    }
                } catch {}
            } else if (profile?.purchased_frames && Array.isArray(profile.purchased_frames)) {
                setPurchasedFrames(prev => Array.from(new Set([...prev, ...profile.purchased_frames])));
            }

            const savedActiveFrame = (user?.id ? localStorage.getItem(`shadow_active_frame_${user.id}`) : null)
                || localStorage.getItem('shadow_active_frame')
                || localStorage.getItem('shadow_active_frame_guest');
            if (savedActiveFrame) {
                setActiveFrame(savedActiveFrame);
            } else if (profile?.frame_id) {
                setActiveFrame(profile.frame_id);
            }

            // Self-healing: if avatar URL in database is the dead 503 imgbb URL, heal it to Google avatar
            if (profile?.avatar_url && typeof profile.avatar_url === 'string' && (profile.avatar_url.includes('ibb.co') || profile.avatar_url.includes('imgbb.com')) && user?.id) {
                const healthyAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || 'https://lh3.googleusercontent.com/a/ACg8ocLnpRFtv4bK_qXzuqBG4vBF6UzrdAwPBOCPYofJ0tSYCc5RyKz4=s96-c';
                supabase.from('profiles').update({ avatar_url: healthyAvatar }).eq('id', user.id).then(() => {
                    refreshSession();
                }).catch(() => {});
            }
        }
    }, [user, profile]);

    // Keep activeFrame in strict real-time sync with cross-component events
    useEffect(() => {
        const handleFrameUpdate = (e: any) => {
            if (e.detail?.frameId) {
                setActiveFrame(e.detail.frameId);
            }
        };
        window.addEventListener('shadow-frame-updated', handleFrameUpdate);
        return () => window.removeEventListener('shadow-frame-updated', handleFrameUpdate);
    }, []);

    // Cover Photo State & Drag Handlers
    const [coverYPercent, setCoverYPercent] = useState(50);
    const [isRepositioning, setIsRepositioning] = useState(false);
    const [isDraggingCover, setIsDraggingCover] = useState(false);
    const [coverDragStartY, setCoverDragStartY] = useState(0);
    const [initialCoverY, setInitialCoverY] = useState(50);
    const [tempCoverSrc, setTempCoverSrc] = useState<string | null>(null);
    const [coverMenuOpen, setCoverMenuOpen] = useState(false);
    const [presetCoverModalOpen, setPresetCoverModalOpen] = useState(false);
    const [savingCover, setSavingCover] = useState(false);
    const coverBannerRef = useRef<HTMLDivElement>(null);
    const coverFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (profile?.banner_pos !== undefined && profile?.banner_pos !== null) {
            setCoverYPercent(Number(profile.banner_pos));
        }
    }, [profile?.banner_pos]);

    const handleCoverMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isRepositioning) return;
        setIsDraggingCover(true);
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        setCoverDragStartY(clientY);
    };

    const handleCoverMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDraggingCover || !coverBannerRef.current) return;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        const deltaY = clientY - coverDragStartY;
        const bannerHeight = coverBannerRef.current.clientHeight || 240;
        
        const percentDelta = (deltaY / bannerHeight) * 100;
        const newPercent = Math.max(0, Math.min(100, coverYPercent - percentDelta));
        
        setCoverYPercent(newPercent);
        setCoverDragStartY(clientY);
    };

    const handleCoverMouseUp = () => {
        setIsDraggingCover(false);
    };

    const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            toast.loading("Uploading cover photo...");
            const uploadedUrl = await ImageAPI.uploadImage(file);
            toast.dismiss();

            if (uploadedUrl) {
                setTempCoverSrc(uploadedUrl);
                setCoverYPercent(50);
                setIsRepositioning(true);
                toast.success("Cover uploaded! Drag vertically to reposition, then save.");
            } else {
                toast.error("Failed to upload cover photo.");
            }
        } catch (error) {
            toast.dismiss();
            toast.error("Upload failed. Try again.");
        }
    };

    const handleSaveCover = async () => {
        if (!user) return;
        setSavingCover(true);
        try {
            const updates: any = {
                banner_pos: Math.round(coverYPercent),
                updated_at: new Date().toISOString(),
            };
            if (tempCoverSrc) {
                updates.banner_url = tempCoverSrc;
            }

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            toast.success("Cover photo saved!");
            setIsRepositioning(false);
            setTempCoverSrc(null);
            refreshSession();
        } catch (error) {
            toast.error("Failed to save cover photo.");
        } finally {
            setSavingCover(false);
        }
    };

    const handleCancelCoverReposition = () => {
        setCoverYPercent(profile?.banner_pos !== undefined && profile?.banner_pos !== null ? Number(profile.banner_pos) : initialCoverY);
        setTempCoverSrc(null);
        setIsRepositioning(false);
    };

    const handleSelectPresetCover = (url: string) => {
        setTempCoverSrc(url);
        setCoverYPercent(50);
        setPresetCoverModalOpen(false);
        setIsRepositioning(true);
        toast.info("Preset chosen! Drag vertically to reposition, then click Save.");
    };

    const handleRemoveCover = async () => {
        if (!user) return;
        setCoverMenuOpen(false);
        try {
            toast.loading("Removing cover photo...");
            const { error } = await supabase
                .from('profiles')
                .update({ banner_url: null, banner_pos: 50, updated_at: new Date().toISOString() })
                .eq('id', user.id);
            toast.dismiss();
            if (error) throw error;
            setTempCoverSrc(null);
            setCoverYPercent(50);
            toast.success("Cover photo removed.");
            refreshSession();
        } catch (error) {
            toast.dismiss();
            toast.error("Failed to remove cover photo.");
        }
    };

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || "");
            setBio(profile.bio || "");
            setWebsite(profile.website || "");
            setSocialLinks(parseSocialLinks(profile.website));
            setGender(profile.gender || "male");
            const cachedFrame = (user?.id ? localStorage.getItem(`shadow_active_frame_${user.id}`) : null)
                || localStorage.getItem('shadow_active_frame')
                || localStorage.getItem('shadow_active_frame_guest');
            if (cachedFrame) {
                setActiveFrame(cachedFrame);
            } else if (profile.frame_id) {
                setActiveFrame(profile.frame_id);
            }
        }
    }, [profile, user]);



    const [userNotifications, setUserNotifications] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            // Fetch Followers Count
            const { count: f1 } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id);
            // Fetch Following Count
            const { count: f2 } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id);
            // Fetch Posts with likes & comments counts
            const { data: pData } = await supabase
                .from('social_posts')
                .select('*, social_likes(count), social_comments(count)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            // Fetch Saved Posts (both bookmarks and liked posts with counts)
            const [{ data: bookmarksData }, { data: likesData }] = await Promise.all([
                supabase.from('social_bookmarks').select('post_id, social_posts(*, social_likes(count), social_comments(count))').eq('user_id', user.id),
                supabase.from('social_likes').select('post_id, social_posts(*, social_likes(count), social_comments(count))').eq('user_id', user.id)
            ]);
            
            // Fetch Watch History
            const { data: historyData } = await supabase.from('user_continue_watching').select('*').eq('user_id', user.id).order('last_updated', { ascending: false });

            // Fetch Notifications
            const { data: notifData } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

            setFollowersCount(f1 || 0);
            setFollowingCount(f2 || 0);
            setPosts(pData || []);
            
            // Deduplicate and merge saved posts
            const savedMap = new Map();
            (bookmarksData || []).forEach((b: any) => {
                if (b.social_posts) savedMap.set(b.social_posts.id, b.social_posts);
            });
            (likesData || []).forEach((l: any) => {
                if (l.social_posts && !savedMap.has(l.social_posts.id)) {
                    savedMap.set(l.social_posts.id, l.social_posts);
                }
            });
            setLikedPosts(Array.from(savedMap.values()));
            if (historyData) setWatchHistory(historyData);
            if (notifData) setUserNotifications(notifData);
        };
        fetchData();
    }, [user]);

    const handleClearNotifications = async () => {
        if (!user || userNotifications.length === 0) return;
        const realIds = userNotifications.map(n => n.id).filter(Boolean);
        try {
            setUserNotifications([]);
            if (realIds.length > 0) {
                await supabase.from('notifications').delete().in('id', realIds);
            }
            toast.success("Notifications cleared");
        } catch (e) {
            toast.error("Failed to clear notifications");
        }
    };

    const handleMarkAllNotifsRead = async () => {
        if (!user || userNotifications.length === 0) return;
        try {
            setUserNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
            toast.success("All marked as read");
        } catch (e) {
            toast.error("Failed to mark notifications");
        }
    };

    const handleDeleteSingleNotif = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;
        try {
            setUserNotifications(prev => prev.filter(n => n.id !== id));
            await supabase.from('notifications').delete().eq('id', id);
        } catch (e) {
            console.error("Error deleting single notification:", e);
        }
    };

    const handleClearHistory = async () => {
        if (watchHistory.length === 0) return;
        try {
            setWatchHistory([]);
            if (typeof window !== 'undefined') {
                localStorage.removeItem('shadow_continue_watching');
            }
            if (user) {
                await supabase.from('user_continue_watching').delete().eq('user_id', user.id);
            }
            toast.success("Watch history cleared");
        } catch (e) {
            toast.error("Failed to clear history");
        }
    };

    const handleUpdateProfile = async () => {
        if (!user) return;
        try {
            playSquishyJelly();
            const validLinks = socialLinks.filter(l => l.url && l.url.trim().length > 0);
            const serializedWebsite = validLinks.length > 0 ? JSON.stringify(validLinks) : "";
            const { error } = await supabase.from('profiles').update({ 
                full_name: fullName, 
                bio, 
                website: serializedWebsite, 
                gender 
            }).eq('id', user.id);
            if (error) throw error;
            toast.success("Profile updated");
            setIsEditing(false);
            refreshSession();
        } catch (e) { toast.error("Failed to update profile"); }
    };

    const handleImgBBUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result) {
                setPendingAvatarSrc(reader.result as string);
                setShowAvatarModal(false);
                setCropperModalOpen(true);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSelectAvatarFromLibrary = (url: string) => {
        setPendingAvatarSrc(url);
        setAvatarLibraryModalOpen(false);
        setShowAvatarModal(false);
        setCropperModalOpen(true);
    };

    const handleCropComplete = async (croppedDataUrl: string) => {
        setCropperModalOpen(false);
        if (!user) {
            saveTravellerProfile({ avatar: croppedDataUrl });
            toast.success("Guest avatar updated!");
            return;
        }

        const tid = toast.loading("Saving avatar...");
        try {
            let finalUrl = croppedDataUrl;
            try {
                const res = await fetch(croppedDataUrl);
                const blob = await res.blob();
                const file = new File([blob], `cropped_avatar_${Date.now()}.png`, { type: 'image/png' });
                finalUrl = await ImageAPI.uploadImage(file);
            } catch (uploadErr) {
                // If cloud upload fails, fallback to cropped data URL directly
                console.warn('Cloud upload fallback to DataURL:', uploadErr);
            }

            const newHistory = [finalUrl, ...(profile?.pfp_history || [])].slice(0, 15);
            await supabase.from('profiles').update({ avatar_url: finalUrl, pfp_history: newHistory }).eq('id', user.id);
            toast.success("Avatar updated!");
            refreshSession();
        } catch (err) {
            toast.error("Failed to save avatar.");
        } finally {
            toast.dismiss(tid);
        }
    };

    const fetchFollowList = async (type: 'followers'|'following') => {
        if (!user) return;
        const targetField = type === 'followers' ? 'following_id' : 'follower_id';
        const joinField = type === 'followers' ? 'follower_id' : 'following_id';
        
        const { data } = await supabase
            .from('follows')
            .select(`
                ${joinField},
                profiles!follows_${joinField}_fkey (
                    id, username, full_name, avatar_url, level, frame_id, show_level,
                    equipped_title, title, admin_title, custom_title, role, show_title
                )
            `)
            .eq(targetField, user.id);
            
        if (data) {
            const list = data.map((d: any) => d.profiles);
            if (type === 'followers') { setFollowersList(list); setShowFollowersModal(true); }
            else { setFollowingList(list); setShowFollowingModal(true); }
        }
    };

    if (!hasMounted || isLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

    // Traveller (not logged-in) profile view
    if (!profile || !user) return (
        <div className="min-h-screen bg-black text-white flex flex-col justify-between">
            <div className="px-4 pt-12 pb-16 w-full max-w-md sm:max-w-lg mx-auto flex flex-col items-center">
                {/* Header */}
                <div className="flex flex-col items-center gap-6 mb-8 w-full text-center">
                    <div className="relative group">
                        <div
                            className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/10 shadow-xl cursor-pointer"
                            onClick={() => setTravellerAvatarModalOpen(true)}
                        >
                            <img src={traveller.avatar} alt="avatar" className="w-full h-full object-cover" />
                        </div>
                        <button
                            onClick={() => setTravellerAvatarModalOpen(true)}
                            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                            <Camera size={24} className="text-white" />
                        </button>
                    </div>

                    {travellerEditing ? (
                        <div className="flex items-center gap-2 w-full max-w-xs mx-auto">
                            <input
                                autoFocus
                                value={travellerDraft}
                                onChange={e => setTravellerDraft(e.target.value)}
                                maxLength={30}
                                placeholder="Your name…"
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none text-center"
                            />
                            <button onClick={handleSaveTraveller} className="p-2.5 bg-primary-600 rounded-xl hover:bg-primary-500 transition-colors"><Save size={16} /></button>
                            <button onClick={() => setTravellerEditing(false)} className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><X size={16} /></button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2">
                            <h1 className="text-2xl font-black text-white">{traveller.name}</h1>
                            <button onClick={() => { setTravellerDraft(traveller.name); setTravellerEditing(true); }} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors">
                                <Pencil size={14} />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 w-fit mx-auto">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Traveller</span>
                    </div>
                </div>

                {/* Avatar selector shortcut */}
                <button
                    onClick={() => setTravellerAvatarModalOpen(true)}
                    className="w-full max-w-md flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/5 transition-colors mb-6"
                >
                    <div className="flex items-center gap-3">
                        <img src={traveller.avatar} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                        <div className="text-left">
                            <p className="text-sm font-bold text-white">Change Avatar</p>
                            <p className="text-xs text-zinc-500">Pick from curated anime characters</p>
                        </div>
                    </div>
                    <Camera size={16} className="text-zinc-500" />
                </button>

                {/* Sign-in prompt */}
                <div className="w-full max-w-md p-6 bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-3xl text-center">
                    <h3 className="font-black text-white text-lg mb-1">Unlock your full profile</h3>
                    <p className="text-sm text-zinc-400 mb-5 leading-relaxed">Create an account to sync your progress, post in the community, and access all features.</p>
                    <Button
                        onClick={() => window.dispatchEvent(new CustomEvent('shadow-open-auth', { detail: { view: 'ENTER' } }))}
                        className="w-full max-w-xs h-12 bg-primary hover:bg-primary-600 text-white font-bold rounded-xl mx-auto shadow-lg"
                    >
                        Create Account
                    </Button>
                </div>
            </div>

            <AvatarSelectorModal
                isOpen={travellerAvatarModalOpen}
                onClose={() => setTravellerAvatarModalOpen(false)}
                onSelect={(url) => {
                    saveTravellerProfile({ avatar: url });
                }}
                currentUrl={traveller.avatar}
                isGuest={true}
            />
            {showAuthModal && <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuthSuccess={() => setShowAuthModal(false)} />}
        </div>
    );

    return (
        <div className="bg-[#000] text-white w-full h-full pb-8">
            {/* PROFILE COVER BANNER CONTAINER */}
            <div className="relative w-full mb-2 group">
                <div 
                    ref={coverBannerRef}
                    onMouseDown={handleCoverMouseDown}
                    onMouseMove={handleCoverMouseMove}
                    onMouseUp={handleCoverMouseUp}
                    onTouchStart={handleCoverMouseDown}
                    onTouchMove={handleCoverMouseMove}
                    onTouchEnd={handleCoverMouseUp}
                    className={`w-full h-48 sm:h-64 md:h-80 rounded-b-3xl relative overflow-hidden bg-zinc-900 shadow-2xl border-b border-white/10 ${isRepositioning ? 'cursor-grab active:cursor-grabbing select-none' : ''}`}
                >
                    {(() => {
                        const coverSrc = tempCoverSrc || profile.banner_url || "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2000";
                        return (
                            <img 
                                src={coverSrc} 
                                alt="Cover Banner" 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover pointer-events-none transition-all duration-75"
                                style={{ objectPosition: `center ${coverYPercent}%` }}
                                onError={(e) => { 
                                    const target = e.target as HTMLImageElement;
                                    if (profile.banner_url && !target.src.includes('wsrv.nl')) {
                                        target.src = `https://wsrv.nl/?url=${encodeURIComponent(profile.banner_url)}`;
                                    } else {
                                        target.src = "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2000"; 
                                    }
                                }}
                            />
                        );
                    })()}
                    
                    {/* Ambient Bottom Gradient for Text Legibility & Contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

                    {/* REPOSITION DIRECTIVE OVERLAY */}
                    {isRepositioning && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none z-20">
                            <div className="bg-black/80 border border-white/20 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-2xl">
                                <Move size={14} /> Drag vertically to reposition cover
                            </div>
                        </div>
                    )}

                    {/* COVER EDIT BUTTON & DROPDOWN MENU */}
                    {!isRepositioning && (
                        <div className="absolute top-4 right-4 z-30">
                            <button
                                type="button"
                                onClick={() => setCoverMenuOpen(!coverMenuOpen)}
                                className="bg-black/60 hover:bg-black/80 text-white backdrop-blur-md px-3.5 py-2 rounded-full border border-white/20 text-xs font-bold flex items-center gap-2 shadow-xl opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            >
                                <Camera size={14} />
                                <span>Edit Cover</span>
                            </button>

                            {coverMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-[#0c0c12]/95 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-xl p-1.5 z-40 space-y-1">
                                    <button
                                        onClick={() => { setCoverMenuOpen(false); coverFileInputRef.current?.click(); }}
                                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-white/10 flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <Upload size={13} /> Upload Photo
                                    </button>
                                    <button
                                        onClick={() => { setCoverMenuOpen(false); setInitialCoverY(coverYPercent); setIsRepositioning(true); }}
                                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-white/10 flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <Move size={13} /> Reposition Cover
                                    </button>
                                    <button
                                        onClick={() => { setCoverMenuOpen(false); setPresetCoverModalOpen(true); }}
                                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-white/10 flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <ImageIcon size={13} /> Choose Preset Cover
                                    </button>
                                    {profile.banner_url && (
                                        <button
                                            onClick={handleRemoveCover}
                                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                                        >
                                            <Trash2 size={13} /> Remove Cover
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* REPOSITION SAVE / CANCEL CONTROL BAR */}
                    {isRepositioning && (
                        <div className="absolute bottom-4 left-4 right-4 z-40 flex items-center justify-between bg-black/85 backdrop-blur-xl p-2.5 rounded-2xl border border-white/20 shadow-2xl">
                            <span className="text-xs font-bold text-white px-2 hidden sm:inline flex items-center gap-2">
                                <Move size={14} className="text-primary-400" /> Repositioning Cover Photo
                            </span>
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <button
                                    onClick={handleCancelCoverReposition}
                                    className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/10 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveCover}
                                    disabled={savingCover}
                                    className="px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer border border-white/10 flex items-center gap-1.5"
                                >
                                    {savingCover ? <Loader2 className="animate-spin" size={13} /> : <Check size={13} />} Save Position
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <input 
                    ref={coverFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileChange}
                    className="hidden"
                />
            </div>

            <div className="w-full px-2 sm:px-4 md:px-6 relative z-20">
                {(() => {
                    const currentLevel = profile?.level || 1;
                    const xp = profile?.xp || 0;
                    const isMaxLevel = currentLevel >= 100;
                    const xpForNext = currentLevel * 100;
                    const xpProgress = isMaxLevel ? 100 : Math.min(Math.round((xp % xpForNext) / xpForNext * 100), 100);
                    const unclaimedLevels = Array.from({ length: currentLevel }, (_, i) => i + 1).filter(
                        lvl => !claimedLevels.includes(lvl)
                    );
                    const hasUnclaimedRewards = unclaimedLevels.length > 0;
                    const totalUnclaimedCoins = unclaimedLevels.reduce((sum, lvl) => sum + (lvl * 30), 0);
                    const milestoneInfo = getNextMilestone(currentLevel);
                    const currentRank = [...TITLE_RANKS].reverse().find(r => r.minLevel <= currentLevel) || TITLE_RANKS[0];
                    const nextRank = TITLE_RANKS.find(r => r.minLevel > currentLevel);

                    const rewardLevelsList = Array.from(new Set([
                        ...Array.from({ length: Math.min(10, currentLevel + 4) }, (_, i) => Math.max(1, currentLevel - 2 + i)),
                        5, 10, 20, 35, 50, 65, 75, 80, 85, 90, 95, 100
                    ])).sort((a, b) => a - b).filter(l => l <= 100);

                    const userAvatarUrl = resolveSafeAvatar(
                        profile?.avatar_url,
                        (profile as any)?.avatar,
                        user?.user_metadata?.avatar_url,
                        user?.user_metadata?.picture
                    );

                    return (
                        <>
                            {/* ── 1. INSTAGRAM PROFILE HEADER - DESKTOP (md:flex) ── */}
                            <div className="hidden md:flex items-start gap-10 lg:gap-14 mb-8 pb-2 -mt-16 md:-mt-20">
                                {/* Left: Large Circular Avatar with Frame (Parallel aligned with contents) */}
                                <div className="shrink-0 relative group">
                                    <div className="w-36 h-36 md:w-40 md:h-40 rounded-full flex items-center justify-center cursor-pointer">
                                        <ProfileAvatar 
                                            profile={profile ? {...profile, frame_id: activeFrame || profile.frame_id} : null} 
                                            className="w-full h-full"
                                        />
                                        <div 
                                            onClick={() => setShowAvatarModal(true)} 
                                            className="absolute inset-0 bg-black/50 rounded-full z-30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center backdrop-blur-xs"
                                            title="Change Avatar"
                                        >
                                            <Camera className="text-white" size={28} />
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Instagram Details Column (Parallel aligned with top of avatar) */}
                                <div className="flex-1 flex flex-col gap-3.5 min-w-0 pt-0">
                                    {/* Line 1: Username + Title Badge + Flat Action Buttons */}
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h1 className="text-xl md:text-2xl font-normal text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                                            {profile?.username || 'Shadow Member'}
                                        </h1>
                                        {showTitleState && <UserTitleBadge user={profile} variant="bracket" />}

                                        {/* Flat Instagram Action Buttons (No heavy boxes, no glass containers) */}
                                        <div className="flex items-center gap-2 ml-2">
                                            <button 
                                                onClick={() => setIsEditing(true)} 
                                                className="h-8 px-4 bg-[#363636] hover:bg-[#262626] active:scale-95 text-white font-semibold text-sm rounded-lg transition-all cursor-pointer flex items-center justify-center"
                                            >
                                                Edit profile
                                            </button>
                                            <button 
                                                onClick={() => router.push('/library')} 
                                                className="h-8 px-4 bg-[#363636] hover:bg-[#262626] active:scale-95 text-white font-semibold text-sm rounded-lg transition-all cursor-pointer flex items-center justify-center"
                                            >
                                                Library
                                            </button>
                                            {/* Instagram 3-Dots Options Menu */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button 
                                                        className="h-8 w-8 bg-[#363636] hover:bg-[#262626] active:scale-95 text-white rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0"
                                                        title="More Options"
                                                    >
                                                        <MoreHorizontal size={18} />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-[#262626] border border-zinc-700/80 text-white rounded-xl p-1.5 min-w-[190px] shadow-2xl z-[9999]">
                                                    <DropdownMenuItem onClick={() => router.push('/messages')} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-white/10 cursor-pointer">
                                                        <MessageSquare size={15} className="text-zinc-400" /> Messages
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => { playSquishyJelly(); setActiveTab('tasks'); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-white/10 cursor-pointer">
                                                        <CalendarCheck size={15} className="text-amber-400" /> Daily Tasks & Streak
                                                    </DropdownMenuItem>
                                                    {(profile?.role === 'admin' || profile?.role === 'moderator') && (
                                                        <DropdownMenuItem onClick={() => router.push('/manager')} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-red-950/40 text-red-300 cursor-pointer">
                                                            <ShieldAlert size={15} className="text-red-400" /> Admin Panel
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => router.push('/settings')} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-white/10 cursor-pointer">
                                                        <Settings size={15} className="text-zinc-400" /> Settings
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={handleShareProfile} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-white/10 cursor-pointer">
                                                        <Share2 size={15} className="text-zinc-400" /> Share Profile
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-zinc-700/50 my-1" />
                                                    <DropdownMenuItem onClick={async () => { await supabase.auth.signOut(); router.push('/home'); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-rose-400 hover:bg-rose-950/30 cursor-pointer">
                                                        <LogOut size={15} className="text-rose-400" /> Log Out
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {/* Line 2: Instagram Unboxed Stats */}
                                    <div className="flex items-center gap-7 text-sm md:text-base">
                                        <div>
                                            <span className="font-semibold text-white">{posts.length}</span> <span className="text-zinc-300">posts</span>
                                        </div>
                                        <div onClick={()=>fetchFollowList('followers')} className="cursor-pointer hover:opacity-80 transition-opacity">
                                            <span className="font-semibold text-white">{followersCount}</span> <span className="text-zinc-300">followers</span>
                                        </div>
                                        <div onClick={()=>fetchFollowList('following')} className="cursor-pointer hover:opacity-80 transition-opacity">
                                            <span className="font-semibold text-white">{followingCount}</span> <span className="text-zinc-300">following</span>
                                        </div>
                                        <motion.button
                                            type="button"
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.96 }}
                                            onClick={() => {
                                                playSquishyJelly();
                                                setIsLevelProgressOpen(prev => !prev);
                                            }}
                                            className="flex items-center gap-1.5 cursor-pointer group py-0.5 px-2 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-zinc-800"
                                            title="Click to view Level Progress & Rewards"
                                        >
                                            <span className="font-semibold text-white group-hover:text-amber-300 transition-colors">Lvl {currentLevel}</span>
                                            <span className="text-zinc-400 text-xs">({xpProgress}%)</span>
                                            {hasUnclaimedRewards && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                                                    Claim
                                                </span>
                                            )}
                                            <ChevronDown size={13} className={`text-zinc-400 transition-transform duration-300 ${isLevelProgressOpen ? 'rotate-180 text-amber-300' : ''}`} />
                                        </motion.button>
                                    </div>

                                    {/* Line 3: Bio Block */}
                                    <div className="flex flex-col text-sm max-w-xl">
                                        {fullName && fullName.trim().toLowerCase() !== (profile?.username || '').trim().toLowerCase() && (
                                            <span className="font-semibold text-white">{fullName}</span>
                                        )}
                                        {profile?.bio && <span className="text-zinc-300 whitespace-pre-line mt-0.5 leading-relaxed">{profile.bio}</span>}
                                        {socialLinks.length > 0 ? (
                                            <div className="flex items-center gap-3.5 flex-wrap mt-2">
                                                {socialLinks.map((link, idx) => {
                                                    const href = formatSocialHref(link);
                                                    const label = formatSocialLabel(link);
                                                    return (
                                                        <motion.a 
                                                            key={idx}
                                                            whileHover={{ scale: 1.04 }}
                                                            whileTap={{ scale: 0.96 }}
                                                            transition={{ type: "spring", stiffness: 450, damping: 20 }}
                                                            onClick={() => playGummyTap()}
                                                            href={href} 
                                                            target="_blank" 
                                                            rel="noreferrer" 
                                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer group"
                                                            title={`${link.platform}: ${link.url}`}
                                                        >
                                                            {renderSocialIcon(link.platform, 13)}
                                                            <span className="truncate max-w-[160px] group-hover:underline underline-offset-2">{label}</span>
                                                        </motion.a>
                                                    );
                                                })}
                                            </div>
                                        ) : profile?.website ? (
                                            <motion.a 
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                transition={{ type: "spring", stiffness: 450, damping: 20 }}
                                                onClick={() => playGummyTap()}
                                                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="text-[#0095f6] hover:underline font-semibold flex items-center gap-1.5 text-sm mt-1.5"
                                            >
                                                <LinkIcon size={13} /> {profile.website.replace(/^https?:\/\//, '')}
                                            </motion.a>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            {/* ── 2. INSTAGRAM PROFILE HEADER - MOBILE & TABLET (md:hidden) ── */}
                            <div className="flex md:hidden flex-col mb-6 pb-2">
                                {/* Top Row: Avatar overlapping Banner, Stats below Banner on right */}
                                <div className="flex items-end gap-4 sm:gap-7 mb-3">
                                    <div className="shrink-0 relative group -mt-10 sm:-mt-14">
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center cursor-pointer">
                                            <ProfileAvatar 
                                                profile={profile ? {...profile, frame_id: activeFrame || profile.frame_id} : null} 
                                                className="w-full h-full"
                                            />
                                            <div 
                                                onClick={() => setShowAvatarModal(true)} 
                                                className="absolute inset-0 bg-black/40 rounded-full z-30 opacity-0 active:opacity-100 flex items-center justify-center"
                                            >
                                                <Camera className="text-white" size={20} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4 Equal Stat Columns on Dark Background */}
                                    <div className="flex-1 grid grid-cols-4 gap-1 text-center pt-2 pb-1">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-base text-white">{posts.length}</span>
                                            <span className="text-xs text-zinc-400">posts</span>
                                        </div>
                                        <div onClick={()=>fetchFollowList('followers')} className="flex flex-col cursor-pointer active:opacity-70">
                                            <span className="font-bold text-base text-white">{followersCount}</span>
                                            <span className="text-xs text-zinc-400">followers</span>
                                        </div>
                                        <div onClick={()=>fetchFollowList('following')} className="flex flex-col cursor-pointer active:opacity-70">
                                            <span className="font-bold text-base text-white">{followingCount}</span>
                                            <span className="text-xs text-zinc-400">following</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-base text-amber-300 flex items-center justify-center gap-1">
                                                <FilledCoinIcon size={13} /> {userCoins.toLocaleString()}
                                            </span>
                                            <span className="text-xs text-zinc-400">coins</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Username, Title & Bio Block */}
                                <div className="flex flex-col mb-4">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-white text-base">{profile?.username || 'Shadow Member'}</span>
                                        {showTitleState && <UserTitleBadge user={profile} variant="bracket" />}
                                        <motion.button
                                            type="button"
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                playSquishyJelly();
                                                setIsLevelProgressOpen(prev => !prev);
                                            }}
                                            className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full bg-zinc-900 border border-zinc-800 hover:border-amber-400/40 text-xs cursor-pointer shadow-sm ml-auto"
                                            title="Click to view Level Progress & Rewards"
                                        >
                                            <Award size={11} className="text-amber-400" />
                                            <span className="font-semibold text-white text-[11px]">Lvl {currentLevel}</span>
                                            <span className="text-zinc-400 text-[10px]">({xpProgress}%)</span>
                                            {hasUnclaimedRewards && (
                                                <span className="text-[9px] font-bold px-1 py-0.1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                                                    Claim
                                                </span>
                                            )}
                                            <ChevronDown size={11} className={`text-zinc-400 transition-transform duration-300 ${isLevelProgressOpen ? 'rotate-180 text-amber-300' : ''}`} />
                                        </motion.button>
                                    </div>
                                    {fullName && fullName.trim().toLowerCase() !== (profile?.username || '').trim().toLowerCase() && (
                                        <span className="font-medium text-xs text-zinc-300 mt-0.5">{fullName}</span>
                                    )}
                                    {profile?.bio && <span className="text-xs sm:text-sm text-zinc-300 whitespace-pre-line mt-1 leading-snug">{profile.bio}</span>}
                                    {socialLinks.length > 0 ? (
                                        <div className="flex items-center gap-3 flex-wrap mt-2">
                                            {socialLinks.map((link, idx) => {
                                                const href = formatSocialHref(link);
                                                const label = formatSocialLabel(link);
                                                return (
                                                    <motion.a 
                                                        key={idx}
                                                        whileHover={{ scale: 1.04 }}
                                                        whileTap={{ scale: 0.96 }}
                                                        transition={{ type: "spring", stiffness: 450, damping: 20 }}
                                                        onClick={() => playGummyTap()}
                                                        href={href} 
                                                        target="_blank" 
                                                        rel="noreferrer" 
                                                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer group"
                                                        title={`${link.platform}: ${link.url}`}
                                                    >
                                                        {renderSocialIcon(link.platform, 12)}
                                                        <span className="truncate max-w-[130px] group-hover:underline underline-offset-2">{label}</span>
                                                    </motion.a>
                                                );
                                            })}
                                        </div>
                                    ) : profile?.website ? (
                                        <motion.a 
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={{ type: "spring", stiffness: 450, damping: 20 }}
                                            onClick={() => playGummyTap()}
                                            href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="text-[#0095f6] font-semibold text-xs flex items-center gap-1 mt-1.5"
                                        >
                                            <LinkIcon size={12} /> {profile.website.replace(/^https?:\/\//, '')}
                                        </motion.a>
                                    ) : null}
                                </div>

                                {/* Flat Instagram Button Row */}
                                <div className="flex items-center gap-2 w-full">
                                    <button 
                                        onClick={() => setIsEditing(true)} 
                                        className="flex-1 h-8 bg-[#363636] hover:bg-[#262626] active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-lg transition-all cursor-pointer flex items-center justify-center"
                                    >
                                        Edit profile
                                    </button>
                                    <button 
                                        onClick={() => router.push('/library')} 
                                        className="flex-1 h-8 bg-[#363636] hover:bg-[#262626] active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-lg transition-all cursor-pointer flex items-center justify-center"
                                    >
                                        Library
                                    </button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button 
                                                className="h-8 w-8 bg-[#363636] hover:bg-[#262626] active:scale-95 text-white rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0"
                                                title="More Options"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-[#262626] border border-zinc-700/80 text-white rounded-xl p-1.5 min-w-[190px] shadow-2xl z-[9999]">
                                            <DropdownMenuItem onClick={() => router.push('/messages')} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-white/10 cursor-pointer">
                                                <MessageSquare size={15} className="text-zinc-400" /> Messages
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setActiveTab('tasks')} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-white/10 cursor-pointer">
                                                <CalendarCheck size={15} className="text-amber-400" /> Daily Tasks & Streak
                                            </DropdownMenuItem>
                                            {(profile?.role === 'admin' || profile?.role === 'moderator') && (
                                                <DropdownMenuItem onClick={() => router.push('/manager')} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-red-950/40 text-red-300 cursor-pointer">
                                                    <ShieldAlert size={15} className="text-red-400" /> Admin Panel
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={() => router.push('/settings')} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-white/10 cursor-pointer">
                                                <Settings size={15} className="text-zinc-400" /> Settings
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={handleShareProfile} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-white/10 cursor-pointer">
                                                <Share2 size={15} className="text-zinc-400" /> Share Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-zinc-700/50 my-1" />
                                            <DropdownMenuItem onClick={async () => { await supabase.auth.signOut(); router.push('/home'); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-rose-400 hover:bg-rose-950/30 cursor-pointer">
                                                <LogOut size={15} className="text-rose-400" /> Log Out
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* ── 3. EXPANDING DOWNWARDS LEVEL PROGRESSION & REWARDS ACCORDION ── */}
                            <AnimatePresence>
                                {isLevelProgressOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, y: -10 }}
                                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                                        exit={{ opacity: 0, height: 0, y: -10 }}
                                        transition={{ duration: 0.28, ease: "easeInOut" }}
                                        className="w-full overflow-hidden mb-6"
                                    >
                                        <div className="w-full rounded-2xl bg-gradient-to-b from-[#18181b]/95 to-[#121214] border border-zinc-800/90 p-4 sm:p-5 shadow-2xl backdrop-blur-md relative">
                                            {/* Confetti & Coin Burst Animation Overlay */}
                                            {claimCelebration?.active && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute inset-0 pointer-events-none z-50 flex flex-col items-center justify-center bg-black/65 rounded-2xl backdrop-blur-xs"
                                                >
                                                    <motion.div
                                                        animate={{ rotate: [0, -12, 12, -6, 6, 0], scale: [1, 1.25, 1] }}
                                                        transition={{ duration: 0.6 }}
                                                        className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.7)] mb-2.5"
                                                    >
                                                        <FilledCoinIcon size={34} />
                                                    </motion.div>
                                                    <span className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight drop-shadow-md">
                                                        +{claimCelebration.coins.toLocaleString()} Coins Claimed!
                                                    </span>
                                                    <span className="text-xs text-zinc-300 mt-1 font-medium">Level Rewards Added to Arsenal</span>
                                                </motion.div>
                                            )}

                                            {/* Top Row: Current Level & XP stats + Claim All button */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center shrink-0">
                                                        <Trophy size={22} className="text-amber-400" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-base font-bold text-white tracking-tight">Level {currentLevel} Mastery</h4>
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold">
                                                                {currentRank.title}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-zinc-400 mt-0.5">
                                                            {isMaxLevel ? 'Maximum level attained!' : `${xp % xpForNext} / ${xpForNext} XP (${xpProgress}%) to Level ${currentLevel + 1}`}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Claim All Button if unclaimed rewards available */}
                                                {hasUnclaimedRewards ? (
                                                    <motion.button
                                                        type="button"
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.96 }}
                                                        onClick={() => handleClaimLevelReward()}
                                                        className="h-9 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.35)] cursor-pointer self-start sm:self-auto transition-all"
                                                    >
                                                        <Gift size={15} />
                                                        <span>Claim All Rewards (+{totalUnclaimedCoins} Coins)</span>
                                                    </motion.button>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 self-start sm:self-auto font-medium">
                                                        <CheckCircle size={14} className="text-emerald-400" />
                                                        <span>All Reached Rewards Claimed</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Progress Bar & Milestone Info */}
                                            <div className="py-3">
                                                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                                                    <span className="text-zinc-300">Level Progression</span>
                                                    <span className="text-amber-300">{xpProgress}%</span>
                                                </div>
                                                <div className="h-2.5 w-full bg-zinc-800/80 rounded-full overflow-hidden p-0.5 border border-zinc-700/50">
                                                    <motion.div 
                                                        className="h-full bg-gradient-to-r from-amber-500 via-purple-500 to-fuchsia-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${xpProgress}%` }}
                                                        transition={{ duration: 0.7, ease: "easeOut" }}
                                                    />
                                                </div>
                                                {nextRank && (
                                                    <div className="flex justify-between items-center text-[11px] text-zinc-400 mt-1.5">
                                                        <span>Current Rank: <strong className="text-zinc-200">{currentRank.title}</strong></span>
                                                        <span>Next Major Milestone: <strong className="text-amber-300">{nextRank.title}</strong> (Lv. {nextRank.minLevel})</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Level Rewards Track (Scrollable list of upcoming & unlocked levels) */}
                                            <div className="mt-2 pt-3 border-t border-zinc-800/70">
                                                <div className="flex items-center justify-between mb-2.5">
                                                    <span className="text-xs font-bold text-zinc-300 tracking-wider uppercase">Level Rewards Track</span>
                                                    <span className="text-[11px] text-zinc-500">+30 Coins per level</span>
                                                </div>
                                                <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700">
                                                    {rewardLevelsList.map((lvl) => {
                                                        const isReached = currentLevel >= lvl;
                                                        const isClaimed = claimedLevels.includes(lvl);
                                                        const coinReward = lvl * 30;
                                                        const milestoneDef = TITLE_RANKS.find(r => r.minLevel === lvl);
                                                        const frameMilestone = MILESTONE_FRAMES[lvl];

                                                        return (
                                                            <motion.div
                                                                key={lvl}
                                                                whileHover={{ scale: 1.03, y: -2 }}
                                                                whileTap={{ scale: 0.97 }}
                                                                onClick={() => {
                                                                    playGummyTap();
                                                                    setInspectedLevelReward(lvl);
                                                                }}
                                                                title={`Click to inspect Level ${lvl} rewards`}
                                                                className={`shrink-0 w-28 sm:w-30 p-2.5 rounded-2xl border flex flex-col justify-between items-center text-center transition-all cursor-pointer ${
                                                                    isReached
                                                                        ? isClaimed
                                                                            ? 'bg-zinc-900/60 border-zinc-800/70 text-zinc-400 hover:border-zinc-600'
                                                                            : 'bg-amber-950/25 border-amber-500/40 text-zinc-200 shadow-[0_0_12px_rgba(245,158,11,0.15)] hover:border-amber-400'
                                                                        : 'bg-zinc-950/50 border-zinc-800/40 text-zinc-500 opacity-60 hover:opacity-85 hover:border-zinc-700'
                                                                }`}
                                                            >
                                                                {/* Top: Level & Status */}
                                                                <div className="w-full flex items-center justify-center gap-1.5 text-xs font-bold mb-1">
                                                                    <span className={isReached ? 'text-white' : 'text-zinc-400'}>Lv. {lvl}</span>
                                                                    {!isReached ? (
                                                                        <Lock size={11} className="text-zinc-500" />
                                                                    ) : !isClaimed ? (
                                                                        <span className="text-[9.5px] text-amber-300 font-extrabold tracking-tight">
                                                                            READY
                                                                        </span>
                                                                    ) : null}
                                                                </div>

                                                                {/* Center: Coins Only (Uncontained, clean and no overlapping) */}
                                                                <div className="flex flex-col items-center justify-center gap-1.5 my-2 w-full">
                                                                    <FilledCoinIcon size={30} className="shrink-0 drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]" />
                                                                    <span className="text-xs font-bold text-amber-300 tracking-tight">
                                                                        +{coinReward}
                                                                    </span>
                                                                </div>

                                                                {/* Bottom: Action Button */}
                                                                <div className="w-full mt-1.5">
                                                                    {isReached ? (
                                                                        isClaimed ? (
                                                                            <div className="h-6 w-full rounded-lg bg-zinc-800/60 text-[10px] font-semibold text-zinc-400 flex items-center justify-center select-none">
                                                                                Claimed
                                                                            </div>
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleClaimLevelReward(lvl);
                                                                                }}
                                                                                className="h-6 w-full rounded-lg bg-amber-400 hover:bg-amber-300 active:scale-95 text-zinc-950 text-[10px] font-bold flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                                                                            >
                                                                                Claim
                                                                            </button>
                                                                        )
                                                                    ) : (
                                                                        <div className="h-6 w-full rounded-lg bg-zinc-900 text-[10px] text-zinc-600 flex items-center justify-center select-none">
                                                                            Locked
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    );
                })()}
                
                {/* TABS (POSTS, FAVORITES, WATCH HISTORY, FRAMES) */}
                <Tabs value={activeTab} onValueChange={(tab) => { playGummyTap(); setActiveTab(tab); }} className="w-full border-t border-zinc-800">
                    <TabsList className="bg-transparent w-full justify-center h-auto p-0 rounded-none flex items-center gap-2 sm:gap-8 md:gap-14 border-t border-zinc-800">
                        {/* Tab 1: POSTS */}
                        <TabsTrigger value="posts" className="data-[state=active]:bg-transparent data-[state=active]:border-t-[1px] data-[state=active]:border-white data-[state=active]:text-white rounded-none px-4 sm:px-6 py-3 text-xs font-semibold text-zinc-500 hover:text-zinc-300 uppercase tracking-widest flex items-center gap-1.5 -mt-[1px] shrink-0 transition-colors">
                            <Grid size={13}/> Posts
                        </TabsTrigger>

                        {/* Tab 2: SAVED */}
                        <TabsTrigger value="favorites" className="data-[state=active]:bg-transparent data-[state=active]:border-t-[1px] data-[state=active]:border-white data-[state=active]:text-white rounded-none px-4 sm:px-6 py-3 text-xs font-semibold text-zinc-500 hover:text-zinc-300 uppercase tracking-widest flex items-center gap-1.5 -mt-[1px] shrink-0 transition-colors">
                            <Bookmark size={13}/> Saved
                        </TabsTrigger>

                        {/* Tab 3: VAULT (Frames & Store) */}
                        <TabsTrigger value="vault" className="data-[state=active]:bg-transparent data-[state=active]:border-t-[1px] data-[state=active]:border-white data-[state=active]:text-white rounded-none px-4 sm:px-6 py-3 text-xs font-semibold text-zinc-500 hover:text-zinc-300 uppercase tracking-widest flex items-center gap-1.5 -mt-[1px] shrink-0 transition-colors">
                            <Shield size={13}/> Vault
                        </TabsTrigger>

                        {/* 4th: MORE DROPDOWN MENU */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button 
                                    className={`rounded-none px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5 -mt-[1px] shrink-0 transition-colors cursor-pointer outline-none ${
                                        ['watchlist', 'notifications', 'tasks'].includes(activeTab)
                                            ? 'border-t-[1px] border-white text-white'
                                            : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                                >
                                    {activeTab === 'watchlist' ? (
                                        <><History size={13}/> History</>
                                    ) : activeTab === 'notifications' ? (
                                        <><Bell size={13}/> Alerts</>
                                    ) : activeTab === 'tasks' ? (
                                        <><CalendarCheck size={13}/> Tasks</>
                                    ) : (
                                        <><MoreHorizontal size={14}/> More</>
                                    )}
                                    <ChevronDown size={12} className="opacity-60" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#262626] border border-zinc-700 text-white rounded-xl p-1.5 min-w-[180px] shadow-2xl z-[9999]">
                                <DropdownMenuItem onClick={() => { playGummyTap(); setActiveTab('watchlist'); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-white/10 cursor-pointer">
                                    <History size={14} className="text-zinc-400" /> Watch History
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { playGummyTap(); setActiveTab('notifications'); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-white/10 cursor-pointer justify-between">
                                    <span className="flex items-center gap-2.5">
                                        <Bell size={14} className="text-zinc-400" /> Alerts
                                    </span>
                                    {userNotifications.filter(n => !n.is_read).length > 0 && (
                                        <span className="text-[10px] font-bold text-amber-300 bg-amber-400/10 px-1.5 py-0.2 rounded-full border border-amber-400/20">
                                            {userNotifications.filter(n => !n.is_read).length}
                                        </span>
                                    )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setActiveTab('tasks')} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-white/10 cursor-pointer">
                                    <CalendarCheck size={14} className="text-amber-400" /> Daily Tasks & Streak
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TabsList>

                    <TabsContent value="posts" className="mt-4 outline-none">
                        {posts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                                <div className="w-24 h-24 rounded-full border-2 border-zinc-800 flex items-center justify-center mb-6">
                                    <Camera size={40} className="text-zinc-700"/>
                                </div>
                                <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">Share Photos</h2>
                                <p className="text-sm text-zinc-400">When you share photos, they will appear on your profile.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-1 md:gap-4">
                                {posts.map(post => (
                                    <ProfilePostGridItem key={post.id} post={post} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* LIKED POSTS / FAVORITES */}
                    <TabsContent value="favorites" className="mt-4 outline-none">
                        {likedPosts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                                <div className="w-24 h-24 rounded-full border-2 border-zinc-800 flex items-center justify-center mb-6">
                                    <Heart size={40} className="text-zinc-700"/>
                                </div>
                                <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">No Favorites Yet</h2>
                                <p className="text-sm text-zinc-400">Posts you like or save will appear here.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-1 md:gap-4">
                                {likedPosts.map(post => (
                                    <ProfilePostGridItem key={post.id} post={post} />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                    
                    {/* WATCH HISTORY */}
                    <TabsContent value="watchlist" className="mt-6 outline-none">
                        {activeTab === "watchlist" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2 pb-2 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <History className="text-primary-400" size={18} />
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Watch History</h3>
                                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-mono text-zinc-300">
                                        {watchHistory.length}
                                    </span>
                                </div>
                                {watchHistory.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleClearHistory}
                                        className="px-3.5 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-xs font-bold text-red-300 border border-red-500/30 transition-all cursor-pointer flex items-center gap-1.5 backdrop-blur-md shadow-sm active:scale-95"
                                    >
                                        <Trash2 size={13} />
                                        Clear History
                                    </button>
                                )}
                            </div>

                            {watchHistory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                                    <div className="w-20 h-20 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mb-4 backdrop-blur-md">
                                        <History size={32} className="text-zinc-600"/>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">Watch History Empty</h3>
                                    <p className="text-xs text-zinc-400">Shows you've watched will appear here.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                                    {watchHistory.map((item, idx) => {
                                        const route = getWatchRoute(item.anime_id, item.episode_id, item.type);
                                        const title = formatAnimeTitle(item.anime_title || item.title, item.anime_id);
                                        const poster = item.episode_image || item.anime_image || item.poster || '/images/no-poster.png';
                                        const epNum = item.episode_number || 1;
                                        const progressPct = item.duration > 0 ? Math.min((item.progress / item.duration) * 100, 100) : 0;

                                        return (
                                            <Link 
                                                href={route} 
                                                key={item.id || idx} 
                                                className="group relative flex flex-col rounded-2xl bg-zinc-900/60 border border-white/10 hover:border-primary-500/50 overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-lg backdrop-blur-md"
                                            >
                                                <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
                                                    <img 
                                                        src={poster} 
                                                        alt={title}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                                                    
                                                    {/* Category Tag */}
                                                    {item.type && (
                                                        <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-black/70 border border-white/15 text-[9px] font-black text-primary-300 uppercase tracking-wider backdrop-blur-md">
                                                            {item.type}
                                                        </span>
                                                    )}

                                                    {/* Episode Badge */}
                                                    <span className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded-md bg-primary-600/90 text-[10px] font-black text-white shadow-md">
                                                        EP {epNum}
                                                    </span>

                                                    {/* Playback Progress */}
                                                    {progressPct > 0 && (
                                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                                                            <div className="h-full bg-primary-500" style={{ width: `${progressPct}%` }} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Card Content with Anime Title */}
                                                <div className="p-2.5 flex flex-col gap-0.5 bg-zinc-900/80">
                                                    <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-primary-400 transition-colors">
                                                        {title}
                                                    </h4>
                                                    <span className="text-[10px] text-zinc-400 font-medium">
                                                        Episode {epNum}
                                                    </span>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        )}
                    </TabsContent>

                    {/* NOTIFICATIONS TAB */}
                    <TabsContent value="notifications" className="mt-6 outline-none">
                        {activeTab === "notifications" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2 pb-2 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <Bell className="text-primary-400" size={18} />
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">All Notifications</h3>
                                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-mono text-zinc-300">
                                        {userNotifications.length}
                                    </span>
                                </div>
                                {userNotifications.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleMarkAllNotifsRead}
                                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                                        >
                                            Mark Read
                                        </button>
                                        <button
                                            onClick={handleClearNotifications}
                                            className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-xs font-bold text-red-300 border border-red-500/30 transition-all cursor-pointer"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                )}
                            </div>

                            {userNotifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                                    <div className="w-20 h-20 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mb-4 backdrop-blur-md">
                                        <Bell size={32} className="text-zinc-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">No Notifications</h3>
                                    <p className="text-xs text-zinc-400">You're all caught up! New alerts will show here.</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {userNotifications.map(notif => {
                                        let icon = <Bell size={16} className="text-primary-400" />;
                                        if (notif.type === 'EPISODE_ALERT' || notif.type === 'anime_update') icon = <Tv size={16} className="text-emerald-400" />;
                                        else if (notif.type === 'GUILD_WARNING') icon = <AlertTriangle size={16} className="text-yellow-400" />;
                                        else if (notif.type === 'REPLY') icon = <MessageSquare size={16} className="text-sky-400" />;

                                        return (
                                            <div
                                                key={notif.id}
                                                onClick={() => {
                                                    if (notif.link) router.push(notif.link);
                                                }}
                                                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 cursor-pointer backdrop-blur-xl ${
                                                    notif.is_read
                                                        ? 'bg-black/40 border-white/10 hover:border-white/20 text-zinc-400'
                                                        : 'bg-gradient-to-r from-primary-950/40 via-black to-zinc-950 border-primary-500/40 text-white shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className="p-2.5 rounded-full bg-white/5 border border-white/10 shrink-0">
                                                        {icon}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-xs font-bold text-white truncate">{notif.title || 'Notification'}</h4>
                                                            {!notif.is_read && (
                                                                <span className="text-[9px] font-bold text-amber-300 bg-amber-400/15 px-1.5 py-0.5 rounded">NEW</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-zinc-300 mt-0.5 line-clamp-2">{notif.message || notif.content}</p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={(e) => handleDeleteSingleNotif(notif.id, e)}
                                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                                                    title="Delete notification"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        )}
                    </TabsContent>

                    {/* PROFILE VAULT: FRAMES & STORE */}
                    <TabsContent value="vault" className="mt-6 outline-none">
                        {activeTab === "vault" && (() => {
                            const currentLevel = profile?.level || 1;
                            const role = profile?.role || 'user';
                            const userAvatarUrl = resolveSafeAvatar(
                                profile?.avatar_url,
                                (profile as any)?.avatar,
                                user?.user_metadata?.avatar_url,
                                user?.user_metadata?.picture
                            );
                            
                                                                                    const ALL_FRAMES = ALL_ATELIER_STORE_FRAMES;

                            const handleBuyFrame = async (frame: any) => {
                                if (userCoins < frame.price) {
                                    toast.error(`Not enough coins! You need ${frame.price} coins.`);
                                    return;
                                }

                                const newCoins = userCoins - frame.price;
                                const newPurchased = Array.from(new Set([...purchasedFrames, frame.id]));

                                setUserCoins(newCoins);
                                setPurchasedFrames(newPurchased);
                                setActiveFrame(frame.id);

                                if (typeof window !== 'undefined') {
                                    const coinKey = user?.id ? `shadow_coins_${user.id}` : 'shadow_coins_guest';
                                    const frameKey = user?.id ? `shadow_purchased_frames_${user.id}` : 'shadow_purchased_frames_guest';
                                    const activeFrameKey = user?.id ? `shadow_active_frame_${user.id}` : 'shadow_active_frame_guest';
                                    localStorage.setItem(coinKey, String(newCoins));
                                    localStorage.setItem(frameKey, JSON.stringify(newPurchased));
                                    localStorage.setItem('shadow_purchased_frames', JSON.stringify(newPurchased));
                                    localStorage.setItem('shadow_purchased_frames_guest', JSON.stringify(newPurchased));
                                    localStorage.setItem(activeFrameKey, frame.id);
                                    localStorage.setItem('shadow_active_frame', frame.id);
                                    if (user?.id) localStorage.setItem('shadow_active_frame_guest', frame.id);
                                    window.dispatchEvent(new CustomEvent('shadow-frame-updated', { detail: { frameId: frame.id } }));
                                }

                                if (user) {
                                    try {
                                        await supabase.from('profiles').update({ 
                                            frame_id: frame.id,
                                            coins: newCoins,
                                            purchased_frames: newPurchased,
                                            updated_at: new Date().toISOString()
                                        }).eq('id', user.id);

                                        await supabase.from('user_frame_inventory').upsert({
                                            user_id: user.id,
                                            frame_id: frame.id,
                                            cost: frame.price
                                        }).catch(() => {});

                                        await refreshSession();
                                    } catch (e) {
                                        try {
                                            await supabase.from('profiles').update({ frame_id: frame.id }).eq('id', user.id);
                                            await refreshSession();
                                        } catch {}
                                    }
                                }

                                toast.success(`🎉 Unlocked ${frame.name}! Equipped to profile.`);
                                playGummyTap();
                            };

                            const handleEquipFrame = async (frameId: string) => {
                                setActiveFrame(frameId);
                                if (typeof window !== 'undefined') {
                                    const activeFrameKey = user?.id ? `shadow_active_frame_${user.id}` : 'shadow_active_frame_guest';
                                    localStorage.setItem(activeFrameKey, frameId);
                                    localStorage.setItem('shadow_active_frame', frameId);
                                    if (user?.id) localStorage.setItem('shadow_active_frame_guest', frameId);
                                    window.dispatchEvent(new CustomEvent('shadow-frame-updated', { detail: { frameId } }));
                                }
                                if (user) {
                                    try {
                                        const { error } = await supabase.from('profiles').update({ frame_id: frameId }).eq('id', user.id);
                                        if (error) throw error;
                                        toast.success(frameId === 'none' ? 'Frame removed' : 'Frame equipped!');
                                        await refreshSession();
                                    } catch {
                                        toast.success('Frame equipped!');
                                    }
                                } else {
                                    toast.success(frameId === 'none' ? 'Frame removed' : 'Frame equipped!');
                                }
                                playGummyTap();
                            };

                            const handleEquipTitle = async (titleName: string) => {
        playGummyPop();
        setEquippedTitle(titleName);
        if (typeof window !== 'undefined') {
            const titleKey = user?.id ? `shadow_equipped_title_${user.id}` : 'shadow_equipped_title_guest';
            localStorage.setItem(titleKey, titleName);
            window.dispatchEvent(new CustomEvent('shadow-title-updated', { detail: { title: titleName } }));
        }
        if (user?.id) {
            try {
                const currentSettings = profile?.settings || {};
                await supabase.from('profiles').update({ 
                    title: titleName,
                    settings: { ...currentSettings, equipped_title: titleName }
                }).eq('id', user.id);
                toast.success(`Title equipped: (${titleName})`);
                refreshSession();
            } catch {
                toast.success(`Title equipped: (${titleName})`);
            }
        } else {
            toast.success(`Title equipped: (${titleName})`);
        }
    };

    const handleToggleShowTitle = async (newVal: boolean) => {
                                setShowTitleState(newVal);
                                if (!user) return;
                                try {
                                    if (typeof window !== 'undefined') {
                                        localStorage.setItem(`shadow_show_title_${user.id}`, String(newVal));
                                    }
                                    await supabase.from('profiles').update({ show_title: newVal }).eq('id', user.id);
                                    toast.success(newVal ? "Title visible on profile & chats" : "Title hidden globally");
                                    refreshSession();
                                } catch {
                                    toast.success(newVal ? "Title visible" : "Title hidden");
                                }
                            };


                            const nextRank = TITLE_RANKS.find(r => r.minLevel > currentLevel);
                            const currentRank = [...TITLE_RANKS].reverse().find(r => r.minLevel <= currentLevel) || TITLE_RANKS[0];
                            const isLeaderUser = profile?.role === 'leader' || profile?.role === 'admin' || profile?.admin_title === 'Shadow' || profile?.title === 'Shadow' || (typeof window !== 'undefined' && user?.id === profile?.id);
                            const isSpecialTitle = isLeaderUser || (typeof profile?.admin_title === 'string' && profile.admin_title.trim().length > 0);

                            // ── 1. VAULT INVENTORY (Player's Personal Collection - Only Owned / Unlocked) ──
                            const staffBestowed = getFrameForTitle(profile?.admin_title || profile?.title, role);
                            const ownedFrames = ALL_FRAMES.filter(f => {
                                const isOwned = purchasedFrames.includes(f.id) || f.id === 'none';
                                const isLevelUnlocked = f.type === 'level' && currentLevel >= f.minLevel;
                                const isRoleUnlocked = f.type === 'role' && (role === 'admin' || role === 'moderator');
                                const isBestowed = staffBestowed ? (f.id === staffBestowed || ((f as any).aliases && (f as any).aliases.includes(staffBestowed))) : false;
                                const isStaffGroupUnlocked = (role === 'admin' && f.category === 'bd') || (role === 'moderator' && f.category === 'cs');
                                return isOwned || isLevelUnlocked || isRoleUnlocked || isBestowed || isStaffGroupUnlocked;
                            });

                            // ── 2. STORE CATALOG (All Coin Frames & Level Progression Milestones) ──
                            const storeFrames = ALL_FRAMES.filter(f => {
                                if (f.id === 'none') return false;
                                if (f.type === 'role' && role !== 'admin' && role !== 'moderator') return false;
                                if (frameFilterTab === 'all') return true;
                                if (frameFilterTab === 'lv' || frameFilterTab === 'level') return f.type === 'level';
                                if (frameFilterTab === 'cs') return f.category === 'cs';
                                if (frameFilterTab === 'bd') return f.category === 'bd';
                                return f.category === frameFilterTab;
                            });

                            const STORE_FILTER_OPTIONS: Array<{ id: string; label: string; icon: LucideIcon; count: number }> = [
                                { id: 'all', label: 'All Frames', icon: Layers, count: ALL_FRAMES.filter(f => f.id !== 'none' && (f.type !== 'role' || role === 'admin' || role === 'moderator')).length },
                                { id: 'cs', label: 'Council of Shadows', icon: Crown, count: ALL_FRAMES.filter(f => f.category === 'cs').length },
                                { id: 'bd', label: 'Board of Darkness', icon: ShieldAlert, count: ALL_FRAMES.filter(f => f.category === 'bd').length },
                                { id: 'ce', label: 'Celestial', icon: Moon, count: ALL_FRAMES.filter(f => f.category === 'ce').length },
                                { id: 'yo', label: 'Yokai & Sakura', icon: Flame, count: ALL_FRAMES.filter(f => f.category === 'yo').length },
                                { id: 'ho', label: 'Holy & Angelic', icon: Sun, count: ALL_FRAMES.filter(f => f.category === 'ho').length },
                                { id: 'da', label: 'Dark Aura', icon: Ghost, count: ALL_FRAMES.filter(f => f.category === 'da').length },
                                { id: 'el', label: 'Elemental', icon: Zap, count: ALL_FRAMES.filter(f => f.category === 'el').length },
                                { id: 'cu', label: 'Cute & Kawaii', icon: Heart, count: ALL_FRAMES.filter(f => f.category === 'cu').length },
                                { id: 'kn', label: 'Knights', icon: Swords, count: ALL_FRAMES.filter(f => f.category === 'kn').length },
                                { id: 'em', label: 'Emperors', icon: Gem, count: ALL_FRAMES.filter(f => f.category === 'em').length },
                                { id: 'lo', label: 'Lords', icon: Award, count: ALL_FRAMES.filter(f => f.category === 'lo').length },
                                { id: 'st', label: 'Steampunk', icon: Compass, count: ALL_FRAMES.filter(f => f.category === 'st').length },
                                { id: 'me', label: 'Mechanical', icon: Cpu, count: ALL_FRAMES.filter(f => f.category === 'me').length },
                                { id: 'ru', label: 'Runes', icon: Feather, count: ALL_FRAMES.filter(f => f.category === 'ru').length },
                                { id: 'ju', label: 'Jungle', icon: Trees, count: ALL_FRAMES.filter(f => f.category === 'ju').length },
                                { id: 'an', label: 'Animals', icon: Cat, count: ALL_FRAMES.filter(f => f.category === 'an').length },
                                { id: 'sa', label: 'Sea & Abyss', icon: Waves, count: ALL_FRAMES.filter(f => f.category === 'sa').length },
                                { id: 'lv', label: 'Level Milestones', icon: Trophy, count: ALL_FRAMES.filter(f => f.type === 'level').length },
                            ];
                            const activeFilterOption = STORE_FILTER_OPTIONS.find(o => o.id === frameFilterTab) || STORE_FILTER_OPTIONS[0];

                            const displayedFrames = frameFilterTab === 'all' 
                                ? storeFrames.slice(0, storeDisplayLimit)
                                : storeFrames;

                            return (
                                <div className="space-y-8">
                                    {/* ── A. VAULT INVENTORY MODE (Personal Collection Only) ── */}
                                    {!isStoreOpen ? (
                                        <div className="space-y-6">
                                            {/* Vault Header */}
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <Shield className="text-purple-400" size={20} />
                                                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                                                            Vault
                                                        </h3>
                                                        <span className="text-xs text-zinc-400 font-medium">
                                                            • {ownedFrames.length} Unlocked Frames
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-zinc-400 mt-1">
                                                        Your private collection. Equip your unlocked anime frames and milestone auras below.
                                                    </p>
                                                </div>

                                                {/* Refined Monet UI Store Pill Button */}
                                                <motion.button
                                                    type="button"
                                                    whileTap={{ scale: 0.94 }}
                                                    whileHover={{ scale: 1.02 }}
                                                    transition={{ type: "spring", stiffness: 450, damping: 20 }}
                                                    onClick={() => {
                                                        playSquishyJelly();
                                                        setIsStoreOpen(true);
                                                        setFrameFilterTab('all');
                                                    }}
                                                    className="h-8.5 px-4 rounded-full bg-amber-400/15 hover:bg-amber-400/25 active:scale-95 text-amber-300 hover:text-amber-200 font-bold text-xs flex items-center gap-2 border border-amber-400/30 shadow-sm transition-all cursor-pointer"
                                                >
                                                    <ShoppingBag size={14} strokeWidth={2.5} />
                                                    <span>Frame Store</span>
                                                </motion.button>
                                            </div>

                                            {/* Owned Frames Grid */}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
                                                {ownedFrames.map(frame => {
                                                    const isActive = activeFrame === frame.id;

                                                    return (
                                                        <motion.div
                                                            key={frame.id}
                                                            style={{ contentVisibility: 'auto', containIntrinsicSize: '0 260px' }}
                                                            whileHover={{ y: -3, scale: 1.015 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                            className={`group relative flex flex-col items-center justify-between p-4 rounded-2xl transition-all transform-gpu ${
                                                                isActive 
                                                                    ? 'bg-[#202024] border border-white/15 shadow-md' 
                                                                    : 'bg-[#18181b] hover:bg-[#202024] border border-white/[0.04]'
                                                            }`}
                                                        >
                                                            {/* Frame Preview */}
                                                            <div className="w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center my-2 relative">
                                                                <FantasyFrame frameId={frame.id} avatarUrl={userAvatarUrl} level={currentLevel} showLevelTag={false} size={72} previewMode={true} />
                                                            </div>

                                                            {/* Title & Description */}
                                                            <div className="text-center w-full my-2">
                                                                <h4 className="text-sm font-bold text-white truncate tracking-tight" title={frame.name}>
                                                                    {frame.name}
                                                                </h4>
                                                                <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5" title={frame.description}>
                                                                    {frame.description}
                                                                </p>
                                                            </div>

                                                            {/* Action Button */}
                                                            <div className="w-full mt-1.5">
                                                                {isActive ? (
                                                                    <button 
                                                                        disabled 
                                                                        className="w-full h-8 rounded-xl bg-emerald-500/15 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-default select-none"
                                                                    >
                                                                        <Check size={13} strokeWidth={2.5} /> Equipped
                                                                    </button>
                                                                ) : (
                                                                    <motion.button
                                                                        type="button"
                                                                        whileTap={{ scale: 0.94 }}
                                                                        transition={{ type: "spring", stiffness: 450, damping: 20 }}
                                                                        onClick={() => {
                                                                            playGummyPop();
                                                                            handleEquipFrame(frame.id);
                                                                        }}
                                                                        className="w-full h-8 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center"
                                                                    >
                                                                        Equip
                                                                    </motion.button>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        /* ── B. FRAME STORE MODE (Game Shop: Coin Items & Level Milestone Items) ── */
                                        <div className="space-y-6">
                                            {/* Store Header: Clean Single Row with Dropdown & Back Button */}
                                            <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800/80 flex-wrap">
                                                {/* Left: Store Title & Live Coins */}
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <ShoppingBag className="text-amber-400 shrink-0" size={19} />
                                                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                                                        Frame Store
                                                    </h3>
                                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 font-semibold border border-amber-400/20 flex items-center gap-1.5">
                                                        <FilledCoinIcon size={13} />
                                                        <span>{userCoins.toLocaleString()}</span>
                                                    </span>
                                                </div>

                                                {/* Right: Unified Single Dropdown Filter + View My Vault Button */}
                                                <div className="flex items-center gap-2">
                                                    <DropdownMenu modal={false}>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                type="button"
                                                                className="h-8 px-3 bg-[#262626] hover:bg-[#323232] active:scale-95 text-zinc-200 hover:text-white rounded-lg border border-zinc-700/80 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                                                            >
                                                                <activeFilterOption.icon size={13} className="text-amber-400 shrink-0" />
                                                                <span>{activeFilterOption.label}</span>
                                                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-zinc-300 font-semibold">
                                                                    {activeFilterOption.count}
                                                                </span>
                                                                <ChevronDown size={13} className="text-zinc-400 ml-0.5" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" style={{ maxHeight: "320px", overflowY: "auto" }} className="bg-[#1f1f1f] border border-zinc-800 text-white rounded-xl p-1.5 min-w-[220px] max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 shadow-2xl z-[9999]">
                                                            {STORE_FILTER_OPTIONS.map(opt => (
                                                                <DropdownMenuItem
                                                                    key={opt.id}
                                                                    onClick={() => {
                                                                        playGummyTap();
                                                                        setFrameFilterTab(opt.id as any);
                                                                        setStoreDisplayLimit(24);
                                                                    }}
                                                                    className={`text-xs px-2.5 py-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                                                                        frameFilterTab === opt.id
                                                                            ? 'bg-amber-400/15 text-amber-300 font-semibold'
                                                                            : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <opt.icon size={13} className={frameFilterTab === opt.id ? 'text-amber-300 shrink-0' : 'text-zinc-400 shrink-0'} />
                                                                        <span>{opt.label}</span>
                                                                    </div>
                                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                                                        frameFilterTab === opt.id ? 'bg-amber-400/25 text-amber-300' : 'bg-white/5 text-zinc-400'
                                                                    }`}>
                                                                        {opt.count}
                                                                    </span>
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>

                                                    {/* Back to Vault button */}
                                                    <motion.button
                                                        type="button"
                                                        whileTap={{ scale: 0.94 }}
                                                        transition={{ type: "spring", stiffness: 450, damping: 20 }}
                                                        onClick={() => {
                                                            playGummyTap();
                                                            setIsStoreOpen(false);
                                                        }}
                                                        className="h-8 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-white/5"
                                                    >
                                                        <Shield size={13} />
                                                        <span>My Vault</span>
                                                    </motion.button>
                                                </div>
                                            </div>

                                            {/* Store Grid (Optimized with contentVisibility for 60fps rendering) */}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
                                                {displayedFrames.map(frame => {
                                                    const isOwned = purchasedFrames.includes(frame.id) || (frame.type === 'level' && currentLevel >= frame.minLevel) || (frame.type === 'role' && (role === 'admin' || role === 'moderator'));
                                                    const isActive = activeFrame === frame.id;
                                                    const isLevelItem = frame.type === 'level';
                                                    const isStoreItem = frame.type === 'store';
                                                    const isLevelUnlocked = isLevelItem && currentLevel >= frame.minLevel;
                                                    const levelsNeeded = isLevelItem ? Math.max(0, frame.minLevel - currentLevel) : 0;

                                                    return (
                                                        <motion.div
                                                            key={frame.id}
                                                            style={{ contentVisibility: 'auto', containIntrinsicSize: '0 260px' }}
                                                            whileHover={{ y: -3, scale: 1.015 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                            className={`group relative flex flex-col items-center justify-between p-4 rounded-2xl transition-all transform-gpu ${
                                                                isActive 
                                                                    ? 'bg-[#202024] border border-white/15 shadow-md' 
                                                                    : 'bg-[#18181b] hover:bg-[#202024] border border-white/[0.04]'
                                                            }`}
                                                        >
                                                            {/* Frame Preview */}
                                                            <div className="w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center my-2 relative">
                                                                <FantasyFrame frameId={frame.id} avatarUrl={userAvatarUrl} level={currentLevel} showLevelTag={false} size={72} previewMode={true} />
                                                            </div>

                                                            {/* Title & Description */}
                                                            <div className="text-center w-full my-2">
                                                                <h4 className="text-sm font-bold text-white truncate tracking-tight" title={frame.name}>
                                                                    {frame.name}
                                                                </h4>
                                                                <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5" title={frame.description}>
                                                                    {isLevelItem && !isLevelUnlocked 
                                                                        ? `Reach Lv. ${frame.minLevel} to unlock (${levelsNeeded} lvls away)` 
                                                                        : frame.description}
                                                                </p>
                                                            </div>

                                                            {/* Action Button: Coin Store vs Level Progression Buttons */}
                                                            <div className="w-full mt-1.5">
                                                                {isActive ? (
                                                                    <button 
                                                                        disabled 
                                                                        className="w-full h-8 rounded-xl bg-emerald-500/15 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-default select-none"
                                                                    >
                                                                        <Check size={13} strokeWidth={2.5} /> Equipped
                                                                    </button>
                                                                ) : isOwned ? (
                                                                    <motion.button
                                                                        type="button"
                                                                        whileTap={{ scale: 0.94 }}
                                                                        transition={{ type: "spring", stiffness: 450, damping: 20 }}
                                                                        onClick={() => {
                                                                            playGummyPop();
                                                                            handleEquipFrame(frame.id);
                                                                        }}
                                                                        className="w-full h-8 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center"
                                                                    >
                                                                        Equip
                                                                    </motion.button>
                                                                ) : isStoreItem ? (
                                                                    userCoins >= frame.price ? (
                                                                        <motion.button
                                                                            type="button"
                                                                            whileTap={{ scale: 0.94 }}
                                                                            transition={{ type: "spring", stiffness: 450, damping: 20 }}
                                                                            onClick={() => {
                                                                                playSquishyJelly();
                                                                                handleBuyFrame(frame);
                                                                            }}
                                                                            className="w-full h-8 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                                                                        >
                                                                            <FilledCoinIcon size={12} />
                                                                            <span>{frame.price} Buy</span>
                                                                        </motion.button>
                                                                    ) : (
                                                                        <button
                                                                            disabled
                                                                            className="w-full h-8 rounded-xl bg-zinc-900 text-zinc-500 text-xs font-medium flex items-center justify-center gap-1.5 cursor-not-allowed select-none border border-white/5"
                                                                            title={`You need ${frame.price - userCoins} more coins`}
                                                                        >
                                                                            <FilledCoinIcon size={12} className="opacity-60" />
                                                                            <span>{frame.price} (Need {frame.price - userCoins})</span>
                                                                        </button>
                                                                    )
                                                                ) : isLevelItem ? (
                                                                    <button
                                                                        disabled
                                                                        className="w-full h-8 rounded-xl bg-zinc-900/80 text-zinc-500 text-xs font-medium flex items-center justify-center gap-1.5 cursor-not-allowed select-none border border-white/[0.04]"
                                                                        title={`Level ${frame.minLevel} required`}
                                                                    >
                                                                        <Lock size={12} /> Level {frame.minLevel} to Unlock
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        disabled
                                                                        className="w-full h-8 rounded-xl bg-zinc-900/60 text-zinc-600 text-xs font-medium flex items-center justify-center gap-1.5 cursor-not-allowed select-none"
                                                                    >
                                                                        <Lock size={12} /> {frame.tag} Exclusive
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>

                                            {/* Smooth Show More / Pagination for 'all' tab (Prevents lag) */}
                                            {frameFilterTab === 'all' && storeFrames.length > storeDisplayLimit && (
                                                <div className="w-full flex justify-center mt-6">
                                                    <motion.button
                                                        type="button"
                                                        whileTap={{ scale: 0.95 }}
                                                        whileHover={{ scale: 1.02 }}
                                                        transition={{ type: "spring", stiffness: 450, damping: 20 }}
                                                        onClick={() => {
                                                            playGummyPop();
                                                            setStoreDisplayLimit(prev => prev + 24);
                                                        }}
                                                        className="h-10 px-6 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-white/10 shadow-sm"
                                                    >
                                                        <span>Show More Frames (+24)</span>
                                                        <span className="text-zinc-400 text-[11px]">
                                                            ({storeDisplayLimit} of {storeFrames.length})
                                                        </span>
                                                    </motion.button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ── 3. TITLE ARSENAL & RANK PROGRESSION (Full User Control) ── */}
                                    {(() => {
                                        const availableTitles = getAvailableTitles({
                                            ...profile,
                                            level: currentLevel,
                                            role: profile?.role || role,
                                        });
                                        const currentEquippedTitle = equippedTitle || getEquippedTitle(profile);
                                        const milestoneInfo = getNextMilestone(currentLevel);

                                        const filteredTitles = availableTitles.filter(t => {
                                            if (titleFilter === 'level') return t.category === 'level';
                                            if (titleFilter === 'staff') return t.category === 'staff';
                                            if (titleFilter === 'former') return t.category === 'former';
                                            if (titleFilter === 'special') return t.category === 'special';
                                            return true;
                                        });

                                        const upcomingMilestones = ALL_TITLES.filter(t => t.category === 'level' && t.minLevel !== undefined && t.minLevel > currentLevel)
                                            .sort((a, b) => (a.minLevel || 0) - (b.minLevel || 0));

                                        return (
                                            <div className="pt-6 border-t border-zinc-800">
                                                {/* Title Arsenal Header */}
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <Award size={18} className="text-amber-400" />
                                                        <h3 className="text-base font-bold text-white tracking-tight">Title Arsenal</h3>
                                                        <span className="text-[11px] text-zinc-400 font-medium">({availableTitles.length} Unlocked)</span>
                                                    </div>

                                                    {/* Show / Hide Title Toggle Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleShowTitle(!showTitleState)}
                                                        className="px-3.5 py-1.5 rounded-lg bg-[#262626] hover:bg-[#323232] text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0"
                                                    >
                                                        {showTitleState ? <Eye size={13} className="text-purple-300" /> : <EyeOff size={13} />}
                                                        <span>{showTitleState ? 'Title Visible' : 'Title Hidden'}</span>
                                                    </button>
                                                </div>

                                                {/* Sleek, Compact Active Title & Milestone Strip */}
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-3 text-xs">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 shrink-0">Active:</span>
                                                        <UserTitleBadge user={{ ...profile, equipped_title: currentEquippedTitle }} variant="bracket" className="text-sm font-bold truncate" />
                                                        <span className="text-[11px] text-zinc-500 font-medium truncate hidden sm:inline">
                                                            • {getTitleDefinition(currentEquippedTitle).category === 'level' ? `Lv. ${getTitleDefinition(currentEquippedTitle).minLevel || 1} Rank` : getTitleDefinition(currentEquippedTitle).category === 'staff' ? (currentEquippedTitle.toLowerCase() === 'shadow' ? 'Apex Guild Master' : 'Staff Rank') : getTitleDefinition(currentEquippedTitle).category === 'former' ? 'Bestowed Legacy' : 'Honorary Title'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-zinc-400 text-[11px] shrink-0">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Next Milestone:</span>
                                                        {milestoneInfo.nextTitle ? (
                                                            <span className="font-semibold text-zinc-300">
                                                                <span className="text-amber-300 font-bold">({milestoneInfo.nextTitle.title})</span> at Lv. {milestoneInfo.nextTitle.minLevel}
                                                                <span className="text-zinc-500 font-normal ml-1">({milestoneInfo.levelsRemaining} lvls to go)</span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-amber-400 font-semibold">
                                                                Supreme Level 100 Achieved
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Filter Tabs for Unlocked Titles (Fit and center aligned on mobile & tablet) */}
                                                <div className="flex items-center justify-center flex-wrap gap-2 py-1 my-3 text-xs w-full">
                                                    {[
                                                        { id: 'all', label: 'All Unlocked', count: availableTitles.length },
                                                        { id: 'level', label: 'Milestones', count: availableTitles.filter(t => t.category === 'level').length },
                                                        ...(availableTitles.some(t => t.category === 'former') ? [{ id: 'former', label: 'Bestowed Legacy', count: availableTitles.filter(t => t.category === 'former').length }] : []),
                                                        ...(availableTitles.some(t => t.category === 'staff') ? [{ id: 'staff', label: 'Staff Ranks', count: availableTitles.filter(t => t.category === 'staff').length }] : []),
                                                        ...(availableTitles.some(t => t.category === 'special') ? [{ id: 'special', label: 'Special Honors', count: availableTitles.filter(t => t.category === 'special').length }] : []),
                                                    ].map(tab => {
                                                        const isSelected = titleFilter === tab.id;
                                                        return (
                                                            <button
                                                                key={tab.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    playGummyTap();
                                                                    setTitleFilter(tab.id as any);
                                                                }}
                                                                className={`h-7.5 px-3.5 rounded-full font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95 ${
                                                                    isSelected
                                                                        ? 'bg-white text-black shadow-sm'
                                                                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.05]'
                                                                }`}
                                                            >
                                                                <span>{tab.label}</span>
                                                                <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-400'}`}>
                                                                    {tab.count}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Unlocked Titles Grid */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 my-3">
                                                    {filteredTitles.map(t => {
                                                        const isEquipped = currentEquippedTitle.toLowerCase() === t.title.toLowerCase();

                                                        return (
                                                            <div 
                                                                key={t.id}
                                                                className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                                                                    isEquipped 
                                                                        ? 'border-amber-400/40 bg-amber-400/[0.04] shadow-sm' 
                                                                        : 'border-white/[0.06] bg-[#141416] hover:bg-[#1a1a1e]'
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                                                        {t.category === 'level' ? `Lv. ${t.minLevel}` : t.category === 'former' ? 'Legacy' : t.category === 'staff' ? 'Staff' : 'Special'}
                                                                    </span>
                                                                    {isEquipped ? (
                                                                        <span className="text-[9px] font-bold text-black bg-emerald-400 px-2 py-0.2 rounded-full flex items-center gap-1 shadow-sm">
                                                                            <Check size={10} strokeWidth={3} /> Equipped
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[9px] font-medium text-emerald-400/80 bg-emerald-500/10 px-2 py-0.2 rounded-full">
                                                                            Unlocked
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="my-1">
                                                                    <div className="text-sm font-bold">
                                                                        <span className={t.badgeStyle.bracketColor}>({t.title})</span>
                                                                    </div>
                                                                    <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5 leading-snug">
                                                                        {t.description}
                                                                    </p>
                                                                </div>

                                                                <div className="mt-2.5 pt-2 border-t border-white/[0.04]">
                                                                    {isEquipped ? (
                                                                        <button
                                                                            disabled
                                                                            className="w-full h-7 rounded-lg bg-emerald-500/15 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1 cursor-default select-none"
                                                                        >
                                                                            <Check size={12} strokeWidth={2.5} /> Equipped
                                                                        </button>
                                                                    ) : (
                                                                        <motion.button
                                                                            type="button"
                                                                            whileTap={{ scale: 0.95 }}
                                                                            transition={{ type: "spring", stiffness: 450, damping: 20 }}
                                                                            onClick={() => handleEquipTitle(t.title)}
                                                                            className="w-full h-7 rounded-lg bg-white/10 hover:bg-white/15 active:scale-95 text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center"
                                                                        >
                                                                            Equip Title
                                                                        </motion.button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Locked Upcoming Milestones Preview */}
                                                {upcomingMilestones.length > 0 && (
                                                    <div className="mt-6 pt-4 border-t border-zinc-800/80">
                                                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                                            <Lock size={12} /> Upcoming Level Milestones
                                                        </h4>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 opacity-60">
                                                            {upcomingMilestones.map(r => (
                                                                <div key={r.id} className="p-2.5 rounded-lg border border-zinc-900 bg-zinc-950/40 flex flex-col justify-between">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <span className="text-xs font-semibold text-zinc-400">({r.title})</span>
                                                                        <span className="text-[9px] font-semibold text-zinc-500">Lv. {r.minLevel}</span>
                                                                    </div>
                                                                    <p className="text-[9px] text-zinc-500 line-clamp-1">{r.description}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            );
                        })()}
                    </TabsContent>
                
                    {/* DAILY TASKS & 7-DAY STREAK TAB */}
                    <TabsContent value="tasks" className="mt-4 outline-none">
                        {activeTab === "tasks" && <DailyTasksSection 
                            userId={user?.id || 'guest'} 
                            onCoinsUpdated={() => {
                                if (typeof window !== 'undefined') {
                                    const coinKey = user?.id ? `shadow_coins_${user.id}` : 'shadow_coins_guest';
                                    const c = localStorage.getItem(coinKey);
                                    if (c) setUserCoins(parseInt(c, 10));
                                }
                            }} 
                        />}
                    </TabsContent>
                </Tabs>
            </div>

            {/* EDIT PROFILE MODAL */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="bg-[#262626] border-none text-white max-w-md rounded-xl p-0 overflow-hidden" aria-describedby={undefined}>
                    <DialogHeader className="p-4 border-b border-zinc-700">
                        <DialogTitle className="text-center font-bold text-base">Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="p-4 space-y-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-zinc-400">Name</label>
                            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-transparent border-zinc-700 text-white h-12" placeholder="Full Name" />
                        </div>
                        {/* SOCIAL LINKS MANAGER (Filled Monet UI) */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                                    <Globe size={13} className="text-purple-400" /> Social Links
                                </label>
                                {socialLinks.length < 5 && (
                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.94 }}
                                        transition={{ type: "spring", stiffness: 450, damping: 20 }}
                                        onClick={() => {
                                            playGummyPop();
                                            setSocialLinks([...socialLinks, { platform: 'instagram', url: '' }]);
                                        }}
                                        className="text-[11px] font-semibold text-purple-300 hover:text-purple-200 bg-purple-500/15 hover:bg-purple-500/25 active:scale-95 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all"
                                    >
                                        <Plus size={12} strokeWidth={2.5} /> Add Link
                                    </motion.button>
                                )}
                            </div>

                            {socialLinks.length === 0 ? (
                                <div className="p-3.5 rounded-xl bg-zinc-800/40 border border-zinc-800 text-center flex flex-col items-center justify-center gap-1.5">
                                    <p className="text-xs text-zinc-400">No social links added yet.</p>
                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.94 }}
                                        transition={{ type: "spring", stiffness: 450, damping: 20 }}
                                        onClick={() => {
                                            playGummyPop();
                                            setSocialLinks([{ platform: 'instagram', url: '' }]);
                                        }}
                                        className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-0.5 cursor-pointer"
                                    >
                                        <Plus size={13} /> Add your first social link
                                    </motion.button>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                    {socialLinks.map((link, idx) => (
                                        <div key={idx} className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
                                            {/* Platform selector */}
                                            <div className="w-28 shrink-0">
                                                <Select 
                                                    value={link.platform} 
                                                    onValueChange={(val: any) => {
                                                        playGummyTap();
                                                        const updated = [...socialLinks];
                                                        updated[idx].platform = val;
                                                        setSocialLinks(updated);
                                                    }}
                                                >
                                                    <SelectTrigger className="bg-transparent border-0 text-xs font-medium h-9 text-zinc-200 focus:ring-0 px-2">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#262626] border-zinc-700 text-white text-xs">
                                                        <SelectItem value="instagram">Instagram</SelectItem>
                                                        <SelectItem value="twitter">X / Twitter</SelectItem>
                                                        <SelectItem value="discord">Discord</SelectItem>
                                                        <SelectItem value="youtube">YouTube</SelectItem>
                                                        <SelectItem value="tiktok">TikTok</SelectItem>
                                                        <SelectItem value="github">GitHub</SelectItem>
                                                        <SelectItem value="website">Website</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* URL / Handle Input */}
                                            <div className="flex-1">
                                                <Input 
                                                    value={link.url}
                                                    onChange={(e) => {
                                                        const updated = [...socialLinks];
                                                        updated[idx].url = e.target.value;
                                                        setSocialLinks(updated);
                                                    }}
                                                    placeholder={
                                                        link.platform === 'instagram' ? '@username' :
                                                        link.platform === 'twitter' ? '@handle' :
                                                        link.platform === 'discord' ? 'discord.gg/...' :
                                                        link.platform === 'youtube' ? '@channel' :
                                                        link.platform === 'github' ? 'username' :
                                                        'https://...'
                                                    }
                                                    className="bg-transparent border-0 text-white text-xs h-9 focus-visible:ring-0 placeholder:text-zinc-500 px-2"
                                                />
                                            </div>

                                            {/* Remove button */}
                                            <motion.button
                                                type="button"
                                                whileTap={{ scale: 0.9 }}
                                                transition={{ type: "spring", stiffness: 450, damping: 20 }}
                                                onClick={() => {
                                                    playGummyTap();
                                                    setSocialLinks(socialLinks.filter((_, i) => i !== idx));
                                                }}
                                                className="w-7 h-7 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 active:scale-95 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                                                title="Remove link"
                                            >
                                                <Trash2 size={13} />
                                            </motion.button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-zinc-400">Bio</label>
                            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="bg-transparent border-zinc-700 text-white resize-none" placeholder="Bio" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-zinc-400">Gender</label>
                            <Select value={gender} onValueChange={setGender}>
                                <SelectTrigger className="bg-transparent border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-[#262626] border-zinc-700 text-white">
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Prefer not to say</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="p-4 border-t border-zinc-700/80 flex justify-end gap-3">
                        <motion.button 
                            type="button"
                            whileTap={{ scale: 0.94 }}
                            transition={{ type: "spring", stiffness: 450, damping: 20 }}
                            onClick={() => { playGummyTap(); setIsEditing(false); }} 
                            className="px-4 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 active:scale-95 text-sm font-semibold transition-colors cursor-pointer"
                        >
                            Cancel
                        </motion.button>
                        <motion.button 
                            type="button"
                            whileTap={{ scale: 0.94 }}
                            transition={{ type: "spring", stiffness: 450, damping: 20 }}
                            onClick={() => { playSquishyJelly(); handleUpdateProfile(); }} 
                            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-sm font-bold shadow-md transition-all cursor-pointer"
                        >
                            Done
                        </motion.button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* AVATAR UPLOAD MODAL (Antigravity Redesign) */}
            <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
                <DialogContent className="bg-[#0a0a12]/90 backdrop-blur-3xl border border-white/15 text-white max-w-[420px] rounded-[32px] p-0 overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)]" aria-describedby={undefined}>
                    {/* Header with background blur gradient */}
                    <div className="relative px-6 pt-6 pb-4 border-b border-white/10 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                                <Camera className="text-purple-400" size={18} /> Update Profile Avatar
                            </h2>
                            <p className="text-xs text-zinc-400 mt-0.5">Customize your adventuring persona</p>
                        </div>
                    </div>

                    {/* Current Avatar Mini Preview */}
                    <div className="px-6 py-3.5 flex items-center gap-4 bg-white/[0.02] border-b border-white/5">
                        <div className="relative shrink-0">
                            <ProfileAvatar profile={{...profile, frame_id: activeFrame || profile?.frame_id}} className="w-12 h-12" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Current Identity</p>
                            <p className="text-sm font-bold text-white truncate">{profile?.username || 'Traveller'}</p>
                        </div>
                    </div>

                    {/* Action Cards Grid */}
                    <div className="p-5 space-y-3">
                        {/* Option 1: Avatar Library */}
                        <button 
                            onClick={() => { setShowAvatarModal(false); setAvatarLibraryModalOpen(true); }}
                            className="group w-full p-3.5 bg-white/[0.04] hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/40 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer shadow-lg text-left"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    <LayoutGrid size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">Choose from Avatar Library</h4>
                                    <p className="text-xs text-zinc-400">Explore 500+ anime characters</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-zinc-500 group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>

                        {/* Option 2: Upload Custom Photo */}
                        <button 
                            onClick={() => avatarInputRef.current?.click()} 
                            className="group w-full p-3.5 bg-white/[0.04] hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/40 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer shadow-lg text-left"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    <Upload size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">Upload Custom Photo</h4>
                                    <p className="text-xs text-zinc-400">PNG, JPG, WEBP from your device</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-zinc-500 group-hover:text-blue-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>

                        {/* Option 3: Reposition & Resize Photo */}
                        <button 
                            onClick={() => {
                                const currentSrc = profile?.avatar_url || profile?.avatar || traveller?.avatar || (typeof window !== 'undefined' ? localStorage.getItem('shadow_traveller_avatar') : null) || 'https://cdn.myanimelist.net/images/characters/9/310307.jpg';
                                setPendingAvatarSrc(currentSrc);
                                setShowAvatarModal(false);
                                setCropperModalOpen(true);
                            }} 
                            className="group w-full p-3.5 bg-white/[0.04] hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/40 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer shadow-lg text-left"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    <Crop size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">Reposition & Resize Photo</h4>
                                    <p className="text-xs text-zinc-400">Zoom, drag & align in frame</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-zinc-500 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>

                        {/* Option 4: Remove Current Photo */}
                        {profile?.avatar_url && (
                            <button 
                                onClick={async () => { if(!user)return; await supabase.from('profiles').update({avatar_url: null}).eq('id', user.id); refreshSession(); setShowAvatarModal(false); }} 
                                className="group w-full p-3.5 bg-white/[0.02] hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer shadow-md text-left"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                        <Trash2 size={19} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-red-400">Remove Current Photo</h4>
                                        <p className="text-xs text-zinc-500">Reset back to default shadow avatar</p>
                                    </div>
                                </div>
                            </button>
                        )}
                    </div>
                    <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={handleImgBBUpload} />
                </DialogContent>
            </Dialog>

            {/* AVATAR SELECTOR LIBRARY MODAL FOR LOGGED IN USER */}
            <AvatarSelectorModal
                isOpen={avatarLibraryModalOpen}
                onClose={() => setAvatarLibraryModalOpen(false)}
                onSelect={handleSelectAvatarFromLibrary}
                onBack={() => { setAvatarLibraryModalOpen(false); setShowAvatarModal(true); }}
                currentUrl={profile?.avatar_url}
                isGuest={false}
            />

            {/* AVATAR CROPPER & REPOSITIONER MODAL */}
            <AvatarCropperModal
                isOpen={cropperModalOpen}
                imageSrc={pendingAvatarSrc || profile?.avatar_url || (profile as any)?.avatar || traveller?.avatar || (typeof window !== 'undefined' ? localStorage.getItem('shadow_traveller_avatar') : null) || 'https://cdn.myanimelist.net/images/characters/9/310307.jpg'}
                activeFrameId={activeFrame || profile?.frame_id}
                onClose={() => setCropperModalOpen(false)}
                onCropComplete={handleCropComplete}
            />

            {/* FOLLOWERS MODAL (INSTAGRAM-STYLE) */}
            <Dialog open={showFollowersModal} onOpenChange={setShowFollowersModal}>
                <DialogContent className="bg-[#1c1c20] border border-white/10 text-white max-w-md rounded-2xl p-0 overflow-hidden shadow-2xl" aria-describedby={undefined}>
                    <DialogHeader className="p-4 border-b border-zinc-800">
                        <DialogTitle className="text-center font-bold text-base text-white">Followers</DialogTitle>
                    </DialogHeader>

                    {/* Search Bar */}
                    <div className="p-3 border-b border-zinc-800/80">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/5">
                            <Search size={14} className="text-zinc-400" />
                            <input 
                                value={followerSearchQuery}
                                onChange={(e) => setFollowerSearchQuery(e.target.value)}
                                placeholder="Search followers..."
                                className="w-full bg-transparent border-0 text-white text-xs focus:outline-none placeholder:text-zinc-500"
                            />
                            {followerSearchQuery && (
                                <button onClick={() => setFollowerSearchQuery('')} className="text-zinc-500 hover:text-white text-xs">✕</button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-zinc-800/40">
                        {followersList
                            .filter(u => !followerSearchQuery.trim() || (u.username && u.username.toLowerCase().includes(followerSearchQuery.toLowerCase())) || (u.full_name && u.full_name.toLowerCase().includes(followerSearchQuery.toLowerCase())))
                            .map(u => (
                                <div key={u.id} className="flex items-center justify-between p-2.5 hover:bg-white/[0.03] rounded-xl transition-colors">
                                    <Link href={`/profile/${u.username || u.id}`} onClick={() => setShowFollowersModal(false)} className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-10 h-10 shrink-0">
                                            <ProfileAvatar profile={u} className="w-10 h-10" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-xs sm:text-sm text-white truncate">{u.username}</span>
                                                <UserTitleBadge user={u} variant="bracket" className="shrink-0 text-[10px]" />
                                            </div>
                                            <span className="text-[11px] text-zinc-400 truncate">{u.full_name || `@${u.username}`}</span>
                                        </div>
                                    </Link>
                                    <Link
                                        href={`/profile/${u.username || u.id}`}
                                        onClick={() => setShowFollowersModal(false)}
                                        className="h-7 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center shrink-0 ml-2"
                                    >
                                        View
                                    </Link>
                                </div>
                            ))}
                        {followersList.length === 0 && (
                            <div className="text-center py-12 text-zinc-500 text-xs">No followers yet.</div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* FOLLOWING MODAL (INSTAGRAM-STYLE) */}
            <Dialog open={showFollowingModal} onOpenChange={setShowFollowingModal}>
                <DialogContent className="bg-[#1c1c20] border border-white/10 text-white max-w-md rounded-2xl p-0 overflow-hidden shadow-2xl" aria-describedby={undefined}>
                    <DialogHeader className="p-4 border-b border-zinc-800">
                        <DialogTitle className="text-center font-bold text-base text-white">Following</DialogTitle>
                    </DialogHeader>

                    {/* Search Bar */}
                    <div className="p-3 border-b border-zinc-800/80">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/5">
                            <Search size={14} className="text-zinc-400" />
                            <input 
                                value={followingSearchQuery}
                                onChange={(e) => setFollowingSearchQuery(e.target.value)}
                                placeholder="Search following..."
                                className="w-full bg-transparent border-0 text-white text-xs focus:outline-none placeholder:text-zinc-500"
                            />
                            {followingSearchQuery && (
                                <button onClick={() => setFollowingSearchQuery('')} className="text-zinc-500 hover:text-white text-xs">✕</button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-zinc-800/40">
                        {followingList
                            .filter(u => !followingSearchQuery.trim() || (u.username && u.username.toLowerCase().includes(followingSearchQuery.toLowerCase())) || (u.full_name && u.full_name.toLowerCase().includes(followingSearchQuery.toLowerCase())))
                            .map(u => (
                                <div key={u.id} className="flex items-center justify-between p-2.5 hover:bg-white/[0.03] rounded-xl transition-colors">
                                    <Link href={`/profile/${u.username || u.id}`} onClick={() => setShowFollowingModal(false)} className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-10 h-10 shrink-0">
                                            <ProfileAvatar profile={u} className="w-10 h-10" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-xs sm:text-sm text-white truncate">{u.username}</span>
                                                <UserTitleBadge user={u} variant="bracket" className="shrink-0 text-[10px]" />
                                            </div>
                                            <span className="text-[11px] text-zinc-400 truncate">{u.full_name || `@${u.username}`}</span>
                                        </div>
                                    </Link>
                                    <Link
                                        href={`/profile/${u.username || u.id}`}
                                        onClick={() => setShowFollowingModal(false)}
                                        className="h-7 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center shrink-0 ml-2"
                                    >
                                        View
                                    </Link>
                                </div>
                            ))}
                        {followingList.length === 0 && (
                            <div className="text-center py-12 text-zinc-500 text-xs">Not following anyone yet.</div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* PRESET COVER GALLERY MODAL */}
            <Dialog open={presetCoverModalOpen} onOpenChange={setPresetCoverModalOpen}>
                <DialogContent className="bg-[#0c0c12] border-white/10 text-white max-w-2xl rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                            <ImageIcon size={18} className="text-primary-400" /> Choose Preset Cover
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-4 max-h-[60vh] overflow-y-auto">
                        {PRESET_COVERS.map((preset, idx) => (
                            <div 
                                key={idx}
                                onClick={() => handleSelectPresetCover(preset.url)}
                                className="group relative h-28 rounded-2xl overflow-hidden border border-white/10 hover:border-primary-500/50 cursor-pointer transition-all shadow-lg"
                            >
                                <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                                    <span className="text-xs font-bold text-white group-hover:text-primary-400 transition-colors">{preset.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* LEVEL REWARD INSPECTOR MODAL (PUBG / Game-Style Compact Reward Popup) */}
            <Dialog open={inspectedLevelReward !== null} onOpenChange={(open) => !open && setInspectedLevelReward(null)}>
                <DialogContent className="bg-[#141418] border border-white/10 text-white max-w-[340px] sm:max-w-[360px] w-full rounded-2xl p-4 overflow-hidden shadow-2xl z-[9999]" aria-describedby={undefined}>
                    {(() => {
                        if (inspectedLevelReward === null) return null;
                        const lvl = inspectedLevelReward;
                        const currentLvl = profile?.level || 1;
                        const isReached = currentLvl >= lvl;
                        const isClaimed = claimedLevels.includes(lvl);
                        const coinReward = lvl * 30;
                        const milestoneDef = TITLE_RANKS.find(r => r.minLevel === lvl);
                        const frameMilestone = MILESTONE_FRAMES[lvl];
                        const userAvatarUrl = resolveSafeAvatar(
                            profile?.avatar_url,
                            (profile as any)?.avatar,
                            user?.user_metadata?.avatar_url,
                            user?.user_metadata?.picture
                        );

                        return (
                            <div className="flex flex-col items-center text-center">
                                {/* Title Header - Clean without top right tag to avoid collision with dialog close button */}
                                <div className="w-full flex items-center justify-start pb-2.5 mb-2.5 border-b border-white/10 pr-6">
                                    <h3 className="text-sm font-black text-white tracking-tight">
                                        Level {lvl} Rewards
                                    </h3>
                                </div>

                                {/* Visual Rewards Row (PUBG / Game Loot Slot Layout) */}
                                <div className="flex items-start justify-center gap-3 sm:gap-3.5 my-3 w-full">
                                    {/* 1. Coin Reward */}
                                    <div className="flex flex-col items-center min-w-0 flex-1">
                                        <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/[0.08] border border-amber-400/25 flex items-center justify-center relative shadow-inner">
                                            <FilledCoinIcon size={34} className="drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                                        </div>
                                        <span className="text-xs font-bold text-amber-300 mt-1.5 truncate max-w-[85px]">
                                            +{coinReward.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] text-zinc-400 font-medium">Coins</span>
                                    </div>

                                    {/* 2. Milestone Title Rank (if any) */}
                                    {milestoneDef && (
                                        <div className="flex flex-col items-center min-w-0 flex-1">
                                            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-purple-500/[0.08] border border-purple-500/25 flex items-center justify-center relative shadow-inner">
                                                <Award size={32} className="text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.45)]" />
                                            </div>
                                            <span className={`${getTitleDefinition(milestoneDef.title).badgeStyle.bracketColor} text-xs font-bold mt-1.5 truncate max-w-[85px]`}>
                                                ({milestoneDef.title})
                                            </span>
                                            <span className="text-[10px] text-zinc-400 font-medium">Title</span>
                                        </div>
                                    )}

                                    {/* 3. Milestone Frame (if any) */}
                                    {frameMilestone && (
                                        <div className="flex flex-col items-center min-w-0 flex-1">
                                            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-sky-500/[0.08] border border-sky-400/25 flex items-center justify-center relative shadow-inner">
                                                <FantasyFrame frameId={frameMilestone.id} avatarUrl={userAvatarUrl} size={48} showLevelTag={false}>
                                                    <div className="w-full h-full bg-zinc-950 rounded-full overflow-hidden flex items-center justify-center">
                                                        <img src={userAvatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                                                    </div>
                                                </FantasyFrame>
                                            </div>
                                            <span className="text-xs font-bold text-zinc-200 mt-1.5 truncate max-w-[85px]">
                                                {frameMilestone.name}
                                            </span>
                                            <span className="text-[10px] text-zinc-400 font-medium">Frame</span>
                                        </div>
                                    )}

                                    {/* Standard Level Mastery perk if no title and no frame */}
                                    {!milestoneDef && !frameMilestone && (
                                        <div className="flex flex-col items-center min-w-0 flex-1">
                                            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-sky-500/[0.08] border border-sky-400/25 flex items-center justify-center relative shadow-inner">
                                                <Zap size={30} className="text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.45)]" />
                                            </div>
                                            <span className="text-xs font-bold text-sky-300 mt-1.5 truncate max-w-[85px]">
                                                Mastery
                                            </span>
                                            <span className="text-[10px] text-zinc-400 font-medium">+1 Level</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Button */}
                                <div className="w-full mt-2 pt-2">
                                    {isReached ? (
                                        isClaimed ? (
                                            <div className="w-full h-9 rounded-xl bg-white/[0.04] text-zinc-400 text-xs font-semibold flex items-center justify-center gap-1.5 select-none border border-white/5">
                                                <Check size={13} className="text-emerald-400" strokeWidth={2.5} />
                                                <span>Claimed</span>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    playSquishyJelly();
                                                    await handleClaimLevelReward(lvl);
                                                }}
                                                className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all cursor-pointer"
                                            >
                                                <Gift size={14} />
                                                <span>Claim Rewards</span>
                                            </button>
                                        )
                                    ) : (
                                        <div className="w-full h-9 rounded-xl bg-white/[0.03] text-zinc-500 text-xs font-medium flex items-center justify-center gap-1.5 select-none border border-white/5">
                                            <Lock size={12} className="text-zinc-600" />
                                            <span>Unlocks at Level {lvl}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            <Footer />
        </div>
    );
}
