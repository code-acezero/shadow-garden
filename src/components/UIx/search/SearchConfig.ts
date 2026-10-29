import React from 'react';
import { 
  Tv, BookOpen, Film, Layers, Clapperboard, Flame, 
  Languages, Smartphone, FileText, Users, Hash, Globe,
  Search, AtSign, Clock, Star, ArrowDownAZ, Calendar
} from 'lucide-react';

export interface SearchTargetConfig {
  id: 'all' | 'anime' | 'manga' | 'movies' | 'series' | 'drama' | 'donghua' | 'hindi' | 'shorts' | 'novels' | 'users' | 'posts';
  prefix: string;
  aliases: string[];
  label: string;
  hint: string;
  description: string;
  category: 'all' | 'anime' | 'manga' | 'movies' | 'series' | 'drama' | 'donghua' | 'hindi' | 'shorts' | 'novels' | 'users' | 'posts';
  color: string;
  badgeBg: string;
  badgeColor: string;
  borderColor: string;
  icon: any;
}

export const SEARCH_TARGETS: SearchTargetConfig[] = [
  {
    id: 'all',
    prefix: '',
    aliases: ['/all'],
    label: 'All Media',
    hint: 'Unified search across entire universe',
    description: 'Anime, donghua, movies, drama, manga, novels & users',
    category: 'all',
    color: 'text-zinc-200',
    badgeBg: 'bg-white/10',
    badgeColor: 'text-zinc-300 border-white/20 bg-white/10',
    borderColor: 'border-white/20',
    icon: Globe,
  },
  {
    id: 'anime',
    prefix: '/anime',
    aliases: ['/a', '/ani'],
    label: 'Anime',
    hint: 'TV Series, Movies & OVAs',
    description: 'Japanese anime series, movies & OVAs',
    category: 'anime',
    color: 'text-primary-400',
    badgeBg: 'bg-primary-500/10',
    badgeColor: 'text-primary-400 border-primary-500/30 bg-primary-500/10',
    borderColor: 'border-primary-500/30',
    icon: Tv,
  },
  {
    id: 'manga',
    prefix: '/manga',
    aliases: ['/m', '/webtoon', '/manhwa', '/manhua'],
    label: 'Manga',
    hint: 'Manga, Manhwa & Webtoons',
    description: 'Manga, manhwa, comics & webtoons',
    category: 'manga',
    color: 'text-purple-400',
    badgeBg: 'bg-purple-500/10',
    badgeColor: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    icon: BookOpen,
  },
  {
    id: 'movies',
    prefix: '/movies',
    aliases: ['/movie', '/cinema', '/film'],
    label: 'Movies',
    hint: 'Cinema & Feature Films',
    description: 'HD movies & blockbusters',
    category: 'movies',
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10',
    badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: Film,
  },
  {
    id: 'series',
    prefix: '/series',
    aliases: ['/shows', '/show', '/tv'],
    label: 'Series',
    hint: 'TV & Web Shows',
    description: 'Global television and web series',
    category: 'series',
    color: 'text-blue-400',
    badgeBg: 'bg-blue-500/10',
    badgeColor: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    icon: Layers,
  },
  {
    id: 'drama',
    prefix: '/drama',
    aliases: ['/kdrama', '/cdrama', '/jdrama'],
    label: 'Drama',
    hint: 'K-Drama, C-Drama & Asian Dramas',
    description: 'Korean, Chinese & Japanese dramas',
    category: 'drama',
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10',
    badgeColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    icon: Clapperboard,
  },
  {
    id: 'donghua',
    prefix: '/donghua',
    aliases: ['/d', '/chinese'],
    label: 'Donghua',
    hint: 'Chinese 3D/2D Animation',
    description: 'Chinese anime & 3D cultivation donghua',
    category: 'donghua',
    color: 'text-red-400',
    badgeBg: 'bg-red-500/10',
    badgeColor: 'text-red-400 border-red-500/30 bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: Flame,
  },
  {
    id: 'hindi',
    prefix: '/hindi',
    aliases: ['/animehindi', '/h', '/dub'],
    label: 'Hindi Dubs',
    hint: 'Hindi Dubbed Anime & Shows',
    description: 'Hindi & Indian regional dubbed anime',
    category: 'hindi',
    color: 'text-orange-400',
    badgeBg: 'bg-orange-500/10',
    badgeColor: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    icon: Languages,
  },
  {
    id: 'shorts',
    prefix: '/shorts',
    aliases: ['/short', '/reels', '/mini'],
    label: 'Shorts',
    hint: 'Vertical Mini-Series & Drama Shorts',
    description: 'Vertical format drama & mini-series',
    category: 'shorts',
    color: 'text-rose-400',
    badgeBg: 'bg-rose-500/10',
    badgeColor: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    icon: Smartphone,
  },
  {
    id: 'novels',
    prefix: '/novels',
    aliases: ['/novel', '/ln', '/wn'],
    label: 'Novels',
    hint: 'Light Novels & Web Novels',
    description: 'Light novels, web novels & fiction',
    category: 'novels',
    color: 'text-amber-400',
    badgeBg: 'bg-amber-500/10',
    badgeColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    icon: FileText,
  },
  {
    id: 'users',
    prefix: '@',
    aliases: ['/user', '/users', '/clan'],
    label: 'Profiles',
    hint: 'Adventurers, Guild Masters & Clans',
    description: 'User profiles, adventurer cards & clans',
    category: 'users',
    color: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/10',
    badgeColor: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    icon: Users,
  },
  {
    id: 'posts',
    prefix: '/posts',
    aliases: ['/post', '/news', '/p', '/feed'],
    label: 'Discussions',
    hint: 'Otakuverse Posts & News Threads',
    description: 'Social missives, discussions & AniList news',
    category: 'posts',
    color: 'text-zinc-300',
    badgeBg: 'bg-white/10',
    badgeColor: 'text-zinc-300 border-white/20 bg-white/10',
    borderColor: 'border-white/20',
    icon: Hash,
  },
];

export const GUIDE_PROMPTS = [
  { text: "Search anime, manga, movies, drama, shorts, novels...", icon: Search, prefix: "" },
  { text: "Type /anime <title> to target anime series & movies...", icon: Tv, prefix: "/anime " },
  { text: "Type /manga <title> to search manga & webtoons...", icon: BookOpen, prefix: "/manga " },
  { text: "Type /movies <title> to target cinema & movies...", icon: Film, prefix: "/movies " },
  { text: "Type /drama <title> for Asian K/C/J-dramas...", icon: Clapperboard, prefix: "/drama " },
  { text: "Type /donghua <title> for Chinese animation...", icon: Flame, prefix: "/donghua " },
  { text: "Type /hindi <title> for Hindi dubbed releases...", icon: Languages, prefix: "/hindi " },
  { text: "Type /shorts <title> for vertical mini-series...", icon: Smartphone, prefix: "/shorts " },
  { text: "Type /novels <title> for light & web novels...", icon: FileText, prefix: "/novels " },
  { text: "Type @username to search users & clans...", icon: AtSign, prefix: "@" },
  { text: "Type /posts <query> to search discussions & news...", icon: Hash, prefix: "/posts " },
];

export function parseSearchQuery(input: string): {
  prefix: string;
  target: SearchTargetConfig;
  cleanQuery: string;
} {
  const defaultTarget = SEARCH_TARGETS[0];
  const trimmed = input.trim();
  if (!trimmed) {
    return { prefix: '', target: defaultTarget, cleanQuery: '' };
  }

  // @ prefix (username / clan)
  if (trimmed.startsWith('@')) {
    const userTarget = SEARCH_TARGETS.find(t => t.id === 'users') || defaultTarget;
    return {
      prefix: '@',
      target: userTarget,
      cleanQuery: trimmed.slice(1).trim()
    };
  }

  // Slash commands
  if (trimmed.startsWith('/')) {
    const spaceIndex = trimmed.indexOf(' ');
    const potentialPrefix = spaceIndex === -1 ? trimmed.toLowerCase() : trimmed.slice(0, spaceIndex).toLowerCase();
    const cleanQuery = spaceIndex === -1 ? '' : trimmed.slice(spaceIndex + 1).trim();

    const matchedTarget = SEARCH_TARGETS.find(
      t => t.prefix === potentialPrefix || t.aliases.includes(potentialPrefix)
    );

    if (matchedTarget) {
      return {
        prefix: potentialPrefix,
        target: matchedTarget,
        cleanQuery
      };
    }
  }

  return {
    prefix: '',
    target: defaultTarget,
    cleanQuery: trimmed
  };
}

export const UNIFIED_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", 
  "Horror", "Isekai", "Martial Arts", "Mecha", "Mystery", 
  "Psychological", "Romance", "Sci-Fi", "Seinen", "Shounen", 
  "Slice of Life", "Sports", "Supernatural", "Thriller"
];

export const MEDIA_FORMATS = [
  { value: "", label: "All Formats" },
  { value: "tv", label: "TV Series" },
  { value: "movie", label: "Movies" },
  { value: "ova", label: "OVA" },
  { value: "ona", label: "ONA" },
  { value: "special", label: "Special" },
  { value: "manga", label: "Manga" },
  { value: "webtoon", label: "Webtoon" },
  { value: "novel", label: "Light Novel" },
];

export const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "ongoing", label: "Ongoing / Releasing" },
  { value: "completed", label: "Completed" },
  { value: "upcoming", label: "Upcoming" },
];

export const AUDIO_LANGUAGES = [
  { value: "", label: "Any Audio" },
  { value: "sub", label: "Original / Subbed" },
  { value: "dub", label: "English Dub" },
  { value: "hindi", label: "Hindi Dub" },
  { value: "tamil", label: "Tamil Dub" },
  { value: "telugu", label: "Telugu Dub" },
];

export const SEASONS = ["spring", "summer", "fall", "winter"];
export const YEARS = Array.from({ length: 2027 - 2000 }, (_, i) => (2026 - i).toString());

export const UNIFIED_SORT_OPTIONS = [
  { value: "newest", label: "Latest Updated", icon: Clock },
  { value: "score", label: "Top Rated", icon: Star },
  { value: "popular", label: "Most Popular", icon: Flame },
  { value: "name-az", label: "Name A-Z", icon: ArrowDownAZ },
  { value: "release-date", label: "Release Year", icon: Calendar },
];
