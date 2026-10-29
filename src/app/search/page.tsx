"use client";

import React, { useState, useEffect, Suspense, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, ChevronDown, Check, SlidersHorizontal,
  RotateCcw, Compass, Tv, Film, BookOpen, Layers, Flame, Star,
  Calendar, ArrowUpDown, Clock, PlaySquare, ChevronLeft, ChevronRight,
  Loader2, Activity, Tag, Hash, Globe, Filter, CheckCircle,
  PlusCircle, ThumbsUp, ScanSearch, Upload, Crop, Zap, Info
} from 'lucide-react';

import AnimeCard from '@/components/Anime/AnimeCard';
import { MediaCard } from '@/components/Anime/MediaCard';
import MangaCard from '@/components/Manga/MangaCard';
import { AnimeService } from '@/lib/api';
import { dpi } from '@/lib/dpi';
import { hpi } from '@/lib/hpi';
import { omni } from '@/lib/omni';
import { mangaService, ReadingItem } from '@/lib/manga';
import { MoeAPI } from '@/lib/moeApi';
import ImageCropper from '@/components/AI/ImageCropper';
import { cn } from '@/lib/utils';
import Footer from '@/components/Anime/Footer';
import { SimpleGridSkeleton } from '@/components/UIx/SkeletonLoaders';
import { playGummyTap } from '@/lib/audioManager';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// ─── CONFIG & CONSTANTS ────────────────────────────────────────────────────────

export interface LibraryOption {
  id: string;
  label: string;
  shortLabel: string;
  sublabel: string;
  icon: any;
  color: string;
  borderActive: string;
  bgActive: string;
  bgLight: string;
  textActive: string;
  accentHex: string;
}

const LIBRARIES: LibraryOption[] = [
  {
    id: 'all',
    label: 'Global (All Media)',
    shortLabel: 'Global',
    sublabel: 'Unified Search Across Anime, Manga, Movies, Drama & Donghua',
    icon: Globe,
    color: 'text-indigo-400',
    borderActive: 'border-indigo-500/40',
    bgActive: 'bg-indigo-500/20',
    bgLight: 'bg-indigo-500/10',
    textActive: 'text-indigo-400',
    accentHex: '#6366f1'
  },
  {
    id: 'main',
    label: 'Anime',
    shortLabel: 'Anime',
    sublabel: 'Japanese Series, Movies & OVAs',
    icon: Tv,
    color: 'text-red-400',
    borderActive: 'border-red-500/40',
    bgActive: 'bg-red-500/20',
    bgLight: 'bg-red-500/10',
    textActive: 'text-red-400',
    accentHex: '#ef4444'
  },
  {
    id: 'manga',
    label: 'Manga & Webtoons',
    shortLabel: 'Manga',
    sublabel: 'Manhwa, Manhua, Comics & Novels',
    icon: BookOpen,
    color: 'text-purple-400',
    borderActive: 'border-purple-500/40',
    bgActive: 'bg-purple-500/20',
    bgLight: 'bg-purple-500/10',
    textActive: 'text-purple-400',
    accentHex: '#a855f7'
  },
  {
    id: 'movies',
    label: 'Cinema & Movies',
    shortLabel: 'Movies',
    sublabel: 'Hollywood, Bollywood & HD Box Office',
    icon: PlaySquare,
    color: 'text-emerald-400',
    borderActive: 'border-emerald-500/40',
    bgActive: 'bg-emerald-500/20',
    bgLight: 'bg-emerald-500/10',
    textActive: 'text-emerald-400',
    accentHex: '#10b981'
  },
  {
    id: 'drama',
    label: 'Asian Drama',
    shortLabel: 'Drama',
    sublabel: 'K-Drama, C-Drama & Romantic Series',
    icon: Layers,
    color: 'text-cyan-400',
    borderActive: 'border-cyan-500/40',
    bgActive: 'bg-cyan-500/20',
    bgLight: 'bg-cyan-500/10',
    textActive: 'text-cyan-400',
    accentHex: '#06b6d4'
  },
  {
    id: 'donghua',
    label: 'Donghua',
    shortLabel: 'Donghua',
    sublabel: 'Chinese Animation & 3D Cultivation',
    icon: Flame,
    color: 'text-amber-400',
    borderActive: 'border-amber-500/40',
    bgActive: 'bg-amber-500/20',
    bgLight: 'bg-amber-500/10',
    textActive: 'text-amber-400',
    accentHex: '#f59e0b'
  },
  {
    id: 'hindi',
    label: 'Hindi Dubbed',
    shortLabel: 'Hindi Dub',
    sublabel: 'Hindi Voiced Anime & Series',
    icon: Film,
    color: 'text-orange-400',
    borderActive: 'border-orange-500/40',
    bgActive: 'bg-orange-500/20',
    bgLight: 'bg-orange-500/10',
    textActive: 'text-orange-400',
    accentHex: '#f97316'
  }
];

const ANIME_GENRES = [
  "Action", "Adventure", "Cars", "Comedy", "Dementia", "Demons", "Drama",
  "Ecchi", "Fantasy", "Game", "Harem", "Historical", "Horror", "Isekai",
  "Josei", "Kids", "Magic", "Martial Arts", "Mecha", "Military", "Music",
  "Mystery", "Parody", "Police", "Psychological", "Romance", "Samurai",
  "School", "Sci-Fi", "Seinen", "Shoujo", "Shounen", "Slice of Life",
  "Space", "Sports", "Super Power", "Supernatural", "Suspense", "Thriller", "Vampire"
];

const MANGA_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Isekai",
  "Martial Arts", "Mecha", "Mystery", "Psychological", "Romance", "Sci-Fi",
  "Shounen", "Shoujo", "Seinen", "Josei", "Slice of Life", "Supernatural", "Thriller"
];

const DRAMA_GENRES = [
  "korean-drama", "chinese-drama", "japanese-drama", "hindi-dubbed",
  "Romance", "Action", "Comedy", "Thriller", "Historical", "Fantasy", "Mystery", "Family"
];

const MOVIES_GENRES = [
  "action", "adventure", "animation", "comedy", "crime", "documentary",
  "drama", "family", "fantasy", "history", "horror", "mystery", "romance",
  "sci-fi", "sports", "thriller", "war", "hollywood", "bollywood"
];

const DONGHUA_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Harem",
  "Historical", "Martial Arts", "Mecha", "Mystery", "Romance", "Sci-Fi", "Cultivation"
];

const HINDI_GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Drama",
  "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller"
];

const GLOBAL_GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Cultivation",
  "Documentary", "Donghua", "Drama", "Ecchi", "Fantasy", "Historical",
  "Hollywood", "Bollywood", "Horror", "Isekai", "Korean Drama", "Chinese Drama",
  "Japanese Drama", "Hindi Dubbed", "Magic", "Martial Arts", "Mecha", "Mystery",
  "Psychological", "Romance", "Sci-Fi", "Seinen", "Shoujo", "Shounen",
  "Slice of Life", "Sports", "Supernatural", "Suspense", "Thriller"
];

const FORMAT_OPTIONS: Record<string, string[]> = {
  all: ["TV", "Movie", "Series", "Manga", "Manhwa", "Webtoon", "OVA", "ONA", "Special"],
  main: ["TV", "Movie", "OVA", "ONA", "Special", "TV_SHORT"],
  manga: ["manga", "manhwa", "manhua", "webtoon", "comic", "light_novel", "web_novel"],
  movies: ["Movie", "Series"],
  drama: ["Drama", "Series", "Movie"],
  donghua: ["TV", "Movie"],
  hindi: ["Series", "Movie"]
};

const STATUS_OPTIONS: Record<string, { id: string; label: string }[]> = {
  all: [
    { id: 'ongoing', label: 'Ongoing / Airing' },
    { id: 'completed', label: 'Completed' }
  ],
  main: [
    { id: 'currently-airing', label: 'Currently Airing' },
    { id: 'finished-airing', label: 'Finished Airing' },
    { id: 'not-yet-aired', label: 'Not Yet Aired' }
  ],
  manga: [
    { id: 'ongoing', label: 'Ongoing' },
    { id: 'completed', label: 'Completed' },
    { id: 'hiatus', label: 'On Hiatus' },
    { id: 'cancelled', label: 'Cancelled' }
  ],
  donghua: [
    { id: 'ongoing', label: 'Ongoing' },
    { id: 'completed', label: 'Completed' }
  ],
  hindi: [
    { id: 'Ongoing', label: 'Ongoing' },
    { id: 'Completed', label: 'Completed' }
  ]
};

const SEASONS = ["winter", "spring", "summer", "fall"];
const YEARS = Array.from({ length: 2027 - 1990 }, (_, i) => (2026 - i).toString());

const SORT_OPTIONS: Record<string, { id: string; label: string; icon: any }[]> = {
  all: [
    { id: 'default', label: 'Best Match', icon: ThumbsUp },
    { id: 'popular', label: 'Most Popular', icon: Flame },
    { id: 'latest', label: 'Latest Updated', icon: Clock },
    { id: 'score', label: 'Top Rated', icon: Star }
  ],
  main: [
    { id: 'default', label: 'Default', icon: SlidersHorizontal },
    { id: 'latest-updated', label: 'Latest Updated', icon: Clock },
    { id: 'latest-added', label: 'Recently Added', icon: PlusCircle },
    { id: 'score', label: 'Top Score', icon: Star },
    { id: 'most-viewed', label: 'Most Viewed', icon: Flame },
    { id: 'name-az', label: 'Name A-Z', icon: ArrowUpDown },
    { id: 'release-date', label: 'Release Date', icon: Calendar }
  ],
  manga: [
    { id: 'default', label: 'Best Match', icon: ThumbsUp },
    { id: 'latest', label: 'Latest Uploaded', icon: Clock },
    { id: 'popular', label: 'Most Followed', icon: Flame }
  ],
  movies: [
    { id: 'newest', label: 'Latest Releases', icon: Clock },
    { id: 'popular', label: 'Most Popular', icon: Flame },
    { id: 'score', label: 'Top Rated', icon: Star }
  ],
  drama: [
    { id: 'newest', label: 'Latest Episodes', icon: Clock },
    { id: 'popular', label: 'Most Popular', icon: Flame },
    { id: 'score', label: 'Top Rated', icon: Star }
  ],
  donghua: [
    { id: 'update', label: 'Latest Updated', icon: Clock },
    { id: 'popular', label: 'Popular', icon: Flame },
    { id: 'rating', label: 'Top Rated', icon: Star }
  ],
  hindi: [
    { id: 'newest', label: 'Recently Added', icon: Clock },
    { id: 'score', label: 'Top Rated', icon: Star }
  ]
};

// ─── EXPLORE MAIN CLIENT COMPONENT ──────────────────────────────────────────

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read URL params
  const urlKeyword = searchParams.get('keyword') || searchParams.get('q') || searchParams.get('search') || '';
  const urlLibrary = searchParams.get('library') || searchParams.get('target') || 'all';
  const urlCategory = searchParams.get('category') || searchParams.get('section') || '';
  const rawType = searchParams.get('type') || searchParams.get('format') || '';
  const knownFormats = ["tv", "movie", "ova", "ona", "special", "tv_short", "manga", "manhwa", "manhua", "webtoon", "comic", "light_novel", "web_novel", "drama", "series"];
  const isTypeActuallyGenre = Boolean(rawType && !knownFormats.includes(rawType.toLowerCase()));

  const urlGenres = searchParams.get('genres') || searchParams.get('genre') || (isTypeActuallyGenre ? rawType.toLowerCase() : '');
  const urlType = isTypeActuallyGenre ? '' : rawType;
  const urlSort = searchParams.get('sort') || '';
  const urlStatus = searchParams.get('status') || '';
  const urlSeason = searchParams.get('season') || '';
  const urlYear = searchParams.get('year') || '';
  const urlCountry = searchParams.get('country') || '';
  const urlPage = parseInt(searchParams.get('page') || '1', 10);
  const urlMode = searchParams.get('mode') || '';

  // Synchronized state
  const [selectedLibrary, setSelectedLibrary] = useState<string>(urlLibrary);
  const [keyword, setKeyword] = useState<string>(urlKeyword);
  const [searchInput, setSearchInput] = useState<string>(urlKeyword);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(urlGenres ? urlGenres.split(',').filter(Boolean) : []);
  const [selectedType, setSelectedType] = useState<string>(urlType);
  const [selectedStatus, setSelectedStatus] = useState<string>(urlStatus);
  const [selectedSeason, setSelectedSeason] = useState<string>(urlSeason);
  const [selectedYear, setSelectedYear] = useState<string>(urlYear);
  const [selectedCountry, setSelectedCountry] = useState<string>(urlCountry);
  const [selectedSort, setSelectedSort] = useState<string>(urlSort);
  const [currentPage, setCurrentPage] = useState<number>(urlPage);
  const [activeCategory, setActiveCategory] = useState<string>(urlCategory);

  // Results state
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [maxPage, setMaxPage] = useState<number | undefined>();

  // Image Search states
  const [imageSearchOpen, setImageSearchOpen] = useState(false);
  const [imageDragActive, setImageDragActive] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [imageSearching, setImageSearching] = useState(false);
  const [imageResults, setImageResults] = useState<any[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dropdown open states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [genreFilterSearch, setGenreFilterSearch] = useState<string>('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-migrate legacy /search URL to /explore or /explore/search
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/search') {
      const kw = searchParams.get('keyword') || searchParams.get('q') || '';
      const baseRoute = kw.trim() ? '/explore/search' : '/explore';
      const qs = searchParams.toString();
      router.replace(qs ? `${baseRoute}?${qs}` : baseRoute, { scroll: false });
    }
  }, []);

  // Image file drop & select handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setImageDragActive(true);
    else if (e.type === "dragleave") setImageDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setImageDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError('Please upload a valid image file.');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setRawImageSrc(objectUrl);
    setImagePreviewUrl(objectUrl);
    setSelectedImageFile(file);
    setIsCropping(false);
    setImageError(null);
    setImageResults([]);
  };

  const handleCropComplete = (croppedFile: File, croppedUrl: string) => {
    setSelectedImageFile(croppedFile);
    setImagePreviewUrl(croppedUrl);
    setIsCropping(false);
    setImageResults([]);
  };

  const handleClearImage = () => {
    setImagePreviewUrl(null);
    setSelectedImageFile(null);
    setRawImageSrc(null);
    setImageResults([]);
    setImageError(null);
    setIsCropping(false);
  };

  const doImageSearch = async () => {
    if (!selectedImageFile) return;
    setImageSearching(true);
    setImageError(null);
    try {
      const moeRes = await MoeAPI.searchByImage(selectedImageFile, { anilistInfo: true });
      if (moeRes.error) throw new Error(moeRes.error);
      if (!moeRes.result || moeRes.result.length === 0) throw new Error("No matching anime scenes found.");

      const uniqueResults = moeRes.result.filter((r: any, idx: number, arr: any[]) => 
        arr.findIndex((x: any) => (x.anilist as any)?.id === (r.anilist as any)?.id) === idx
      ).slice(0, 5);

      const mappedResults = await Promise.all(uniqueResults.map(async (res: any) => {
        const anilistInfo = res.anilist as any;
        const title = anilistInfo?.title?.romaji || anilistInfo?.title?.english || anilistInfo?.title?.native || "Unknown";
        
        let matchedId = null;
        let displayTitle = title;
        let image = res.image;
        let targetUrl = '';

        try {
          const anikotoRes = await AnimeService.search(title, 1);
          if (anikotoRes && anikotoRes.results && anikotoRes.results.length > 0) {
            matchedId = anikotoRes.results[0].id;
            displayTitle = anikotoRes.results[0].title || title;
            image = anikotoRes.results[0].poster || res.image;
            targetUrl = `/watch/${matchedId}?ep=${res.episode}&t=${Math.floor(res.from)}`;
          }
        } catch (err) {}

        return {
          id: matchedId || (res.anilist as any)?.id,
          title: displayTitle,
          image: image,
          episode: res.episode,
          similarity: Math.round(res.similarity * 100),
          videoPreview: res.video,
          targetUrl: targetUrl,
          timeStr: formatTime(res.from)
        };
      }));

      setImageResults(mappedResults);
    } catch (err: any) {
      setImageError(err.message || 'Scene recognition failed.');
    } finally {
      setImageSearching(false);
    }
  };

  // Sync state when URL searchParams change
  useEffect(() => {
    setSelectedLibrary(urlLibrary);
    setKeyword(urlKeyword);
    setSearchInput(urlKeyword);
    setSelectedGenres(urlGenres ? urlGenres.split(',').filter(Boolean) : []);
    setSelectedType(urlType);
    setSelectedStatus(urlStatus);
    setSelectedSeason(urlSeason);
    setSelectedYear(urlYear);
    setSelectedCountry(urlCountry);
    setSelectedSort(urlSort);
    setCurrentPage(urlPage);
    setActiveCategory(urlCategory);
  }, [
    urlLibrary, urlKeyword, urlGenres, urlType, urlStatus,
    urlSeason, urlYear, urlCountry, urlSort, urlPage, urlCategory
  ]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLibObj = useMemo(() => {
    return LIBRARIES.find(l => l.id === selectedLibrary) || LIBRARIES[0];
  }, [selectedLibrary]);

  // Available genres for current library
  const availableGenres = useMemo(() => {
    switch (selectedLibrary) {
      case 'all': return GLOBAL_GENRES;
      case 'manga': return MANGA_GENRES;
      case 'drama': return DRAMA_GENRES;
      case 'movies': return MOVIES_GENRES;
      case 'donghua': return DONGHUA_GENRES;
      case 'hindi': return HINDI_GENRES;
      default: return ANIME_GENRES;
    }
  }, [selectedLibrary]);

  const filteredGenresList = useMemo(() => {
    if (!genreFilterSearch.trim()) return availableGenres;
    const q = genreFilterSearch.toLowerCase();
    return availableGenres.filter(g => g.toLowerCase().includes(q));
  }, [availableGenres, genreFilterSearch]);

  const availableTypes = useMemo(() => {
    return FORMAT_OPTIONS[selectedLibrary] || FORMAT_OPTIONS.main;
  }, [selectedLibrary]);

  const availableStatuses = useMemo(() => {
    return STATUS_OPTIONS[selectedLibrary] || STATUS_OPTIONS.main;
  }, [selectedLibrary]);

  const availableSorts = useMemo(() => {
    return SORT_OPTIONS[selectedLibrary] || SORT_OPTIONS.main;
  }, [selectedLibrary]);

  // Sync state changes into URL params
  const updateUrlParams = useCallback((overrides: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(overrides).forEach(([key, val]) => {
      if (val === null || val === undefined || val === '') {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    // Reset page to 1 whenever filters change (unless page itself is specifically overridden)
    if (!('page' in overrides)) {
      params.delete('page');
      setCurrentPage(1);
    }

    const currentKeyword = overrides.keyword !== undefined ? (overrides.keyword || '') : (params.get('keyword') || params.get('q') || '');
    const baseRoute = currentKeyword.trim() ? '/explore/search' : '/explore';
    const qs = params.toString();
    const finalUrl = qs ? `${baseRoute}?${qs}` : baseRoute;

    router.replace(finalUrl, { scroll: false });
  }, [searchParams, router]);

  // ─── DATA FETCHING ──────────────────────────────────────────────────────────

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      let data: any = { results: [], hasNextPage: false };

      // 0. GLOBAL (ALL MEDIA TARGETS UNIFIED)
      if (selectedLibrary === 'all') {
        const queryTerm = keyword.trim();
        if (queryTerm) {
          const [animeRes, mangaRes, moviesRes, dramaRes, donghuaRes] = await Promise.allSettled([
            AnimeService.search(queryTerm, currentPage),
            mangaService.search({ query: queryTerm, page: currentPage, limit: 14 }),
            omni.movies.search(queryTerm, currentPage),
            omni.drama.search(queryTerm, currentPage),
            dpi.search(queryTerm, currentPage)
          ]);

          const animeItems = (animeRes.status === 'fulfilled' && (animeRes.value?.results || Array.isArray(animeRes.value) ? (animeRes.value.results || animeRes.value) : [])) ? (animeRes.value.results || animeRes.value).map((x: any) => ({ ...x, _kind: 'anime' })) : [];
          const mangaItems = (mangaRes.status === 'fulfilled' && mangaRes.value?.items) ? mangaRes.value.items.map((x: any) => ({ ...x, image: x.cover, poster: x.cover, _kind: 'manga' })) : [];
          const movieItems = (moviesRes.status === 'fulfilled' && moviesRes.value?.items) ? moviesRes.value.items.map((x: any) => ({ ...x, _kind: 'movies' })) : [];
          const dramaItems = (dramaRes.status === 'fulfilled' && dramaRes.value?.items) ? dramaRes.value.items.map((x: any) => ({ ...x, _kind: 'drama' })) : [];
          const donghuaItems = (donghuaRes.status === 'fulfilled' && Array.isArray(donghuaRes.value)) ? donghuaRes.value.map((x: any) => ({ ...x, _kind: 'donghua' })) : [];

          // Interleave results cleanly
          const combined: any[] = [];
          const maxLen = Math.max(animeItems.length, mangaItems.length, movieItems.length, dramaItems.length, donghuaItems.length);
          for (let i = 0; i < maxLen; i++) {
            if (animeItems[i]) combined.push(animeItems[i]);
            if (mangaItems[i]) combined.push(mangaItems[i]);
            if (movieItems[i]) combined.push(movieItems[i]);
            if (dramaItems[i]) combined.push(dramaItems[i]);
            if (donghuaItems[i]) combined.push(donghuaItems[i]);
          }

          const animeMax = (animeRes.status === 'fulfilled' && animeRes.value) ? ((animeRes.value as any)?.maxPage || (animeRes.value as any)?.pageInfo?.lastPage || (animeItems.length >= 14 ? currentPage + 1 : currentPage)) : 1;
          const mangaMax = (mangaRes.status === 'fulfilled' && mangaRes.value) ? ((mangaRes.value as any)?.totalPages || Math.ceil(((mangaRes.value as any)?.total || 0) / 14) || 1) : 1;
          const moviesMax = (moviesRes.status === 'fulfilled' && moviesRes.value?.pagination?.totalPages) || 1;
          const dramaMax = (dramaRes.status === 'fulfilled' && dramaRes.value?.pagination?.totalPages) || 1;
          const calcMax = Math.max(animeMax, mangaMax, moviesMax, dramaMax, 1);

          data = {
            results: combined.slice(0, 28),
            currentPage,
            hasNextPage: calcMax > currentPage || combined.length >= 28,
            maxPage: calcMax
          };
        } else {
          // If no keyword, get popular items or filter across all targets
          let animePromise: Promise<any>;
          let mangaPromise: Promise<any>;
          let moviesPromise: Promise<any>;
          let dramaPromise: Promise<any>;

          if (selectedGenres.length > 0) {
            const g = selectedGenres[0];
            animePromise = AnimeService.filter({ genres: selectedGenres.join(','), page: currentPage, perPage: 14 });
            mangaPromise = mangaService.search({ query: '', type: selectedType as any, page: currentPage, limit: 14 });
            moviesPromise = omni.movies.getByGenre(g.toLowerCase(), currentPage);
            dramaPromise = omni.drama.getByCountry(g.toLowerCase().replace('-drama', ''), currentPage);
          } else {
            const animeCategory = activeCategory || (selectedSort === 'score' ? 'favorite' : selectedSort === 'latest' ? 'recent' : 'popular');
            animePromise = AnimeService.getFilteredAnime(animeCategory as any, currentPage);
            mangaPromise = mangaService.search({ query: '', type: selectedType as any, page: currentPage, limit: 14 });
            moviesPromise = omni.movies.getCategory(selectedSort === 'score' ? 'top_rated' : 'popular', currentPage);
            dramaPromise = omni.drama.getDramas('all', currentPage);
          }

          const [animeRes, mangaRes, moviesRes, dramaRes] = await Promise.allSettled([
            animePromise,
            mangaPromise,
            moviesPromise,
            dramaPromise
          ]);

          const animeItems = (animeRes.status === 'fulfilled' && (animeRes.value?.results || (Array.isArray(animeRes.value) ? animeRes.value : []))) ? (animeRes.value.results || animeRes.value).map((x: any) => ({ ...x, _kind: 'anime' })) : [];
          const mangaItems = (mangaRes.status === 'fulfilled' && mangaRes.value?.items) ? mangaRes.value.items.map((x: any) => ({ ...x, image: x.cover, poster: x.cover, _kind: 'manga' })) : [];
          const movieItems = (moviesRes.status === 'fulfilled' && moviesRes.value?.items) ? moviesRes.value.items.map((x: any) => ({ ...x, _kind: 'movies' })) : [];
          const dramaItems = (dramaRes.status === 'fulfilled' && dramaRes.value?.items) ? dramaRes.value.items.map((x: any) => ({ ...x, _kind: 'drama' })) : [];

          const combined: any[] = [];
          const maxLen = Math.max(animeItems.length, mangaItems.length, movieItems.length, dramaItems.length);
          for (let i = 0; i < maxLen; i++) {
            if (animeItems[i]) combined.push(animeItems[i]);
            if (mangaItems[i]) combined.push(mangaItems[i]);
            if (movieItems[i]) combined.push(movieItems[i]);
            if (dramaItems[i]) combined.push(dramaItems[i]);
          }

          const animeMax = (animeRes.status === 'fulfilled' && animeRes.value) ? ((animeRes.value as any)?.maxPage || (animeRes.value as any)?.pageInfo?.lastPage || (animeItems.length >= 14 ? currentPage + 1 : currentPage)) : 1;
          const mangaMax = (mangaRes.status === 'fulfilled' && mangaRes.value) ? ((mangaRes.value as any)?.totalPages || Math.ceil(((mangaRes.value as any)?.total || 0) / 14) || 1) : 1;
          const moviesMax = (moviesRes.status === 'fulfilled' && moviesRes.value?.pagination?.totalPages) || 1;
          const dramaMax = (dramaRes.status === 'fulfilled' && dramaRes.value?.pagination?.totalPages) || 1;
          const calcMax = Math.max(animeMax, mangaMax, moviesMax, dramaMax, 1);

          data = {
            results: combined.slice(0, 28),
            currentPage,
            hasNextPage: calcMax > currentPage || combined.length >= 28,
            maxPage: calcMax
          };
        }
      }

      // 1. MANGA & WEBTOONS
      else if (selectedLibrary === 'manga') {
        const queryTerm = keyword.trim();
        const typeParam = selectedType || undefined;
        const res = await mangaService.search({
          query: queryTerm,
          type: typeParam as any,
          page: currentPage,
          limit: 28
        });
        const total = (res as any)?.total || 0;
        const calcMax = (res as any)?.totalPages || (total > 0 ? Math.ceil(total / 28) : ((res.items || []).length >= 28 ? currentPage + 1 : currentPage));
        data = {
          results: (res.items || []).map((m: any) => ({
            ...m,
            id: m.id,
            title: m.title,
            image: m.cover,
            poster: m.cover,
            type: (m.type || 'MANGA').toUpperCase(),
            totalChapters: m.totalChapters,
            availableLanguages: m.availableLanguages || ['en'],
            _kind: 'manga'
          })),
          currentPage,
          hasNextPage: (res.items || []).length >= 28,
          maxPage: calcMax
        };
      }

      // 2. ASIAN DRAMA
      else if (selectedLibrary === 'drama') {
        if (keyword.trim()) {
          const res = await omni.drama.search(keyword.trim(), currentPage);
          data = {
            results: (res.items || []).slice(0, 28),
            hasNextPage: res.pagination?.hasNextPage ?? false,
            currentPage: res.pagination?.currentPage ?? currentPage,
            maxPage: res.pagination?.totalPages || (res.pagination?.hasNextPage ? currentPage + 1 : currentPage)
          };
        } else if (selectedGenres.length > 0) {
          const res = await omni.drama.getByCountry(selectedGenres[0].replace('-drama', ''), currentPage);
          data = {
            results: (res.items || []).slice(0, 28),
            hasNextPage: res.pagination?.hasNextPage ?? false,
            currentPage: res.pagination?.currentPage ?? currentPage,
            maxPage: res.pagination?.totalPages || (res.pagination?.hasNextPage ? currentPage + 1 : currentPage)
          };
        } else if (selectedCountry) {
          const res = await omni.drama.getByCountry(selectedCountry, currentPage);
          data = {
            results: (res.items || []).slice(0, 28),
            hasNextPage: res.pagination?.hasNextPage ?? false,
            currentPage: res.pagination?.currentPage ?? currentPage,
            maxPage: res.pagination?.totalPages || (res.pagination?.hasNextPage ? currentPage + 1 : currentPage)
          };
        } else {
          const res = await omni.drama.getDramas('all', currentPage);
          data = {
            results: (res.items || []).slice(0, 28),
            hasNextPage: res.pagination?.hasNextPage ?? false,
            currentPage: res.pagination?.currentPage ?? currentPage,
            maxPage: res.pagination?.totalPages || (res.pagination?.hasNextPage ? currentPage + 1 : currentPage)
          };
        }
      }

      // 3. MOVIES & CINEMA
      else if (selectedLibrary === 'movies') {
        if (keyword.trim()) {
          const res = await omni.movies.search(keyword.trim(), currentPage);
          data = {
            results: (res.items || []).slice(0, 28),
            hasNextPage: res.pagination?.hasNextPage ?? false,
            currentPage: res.pagination?.currentPage ?? currentPage,
            maxPage: res.pagination?.totalPages || (res.pagination?.hasNextPage ? currentPage + 1 : currentPage)
          };
        } else if (selectedGenres.length > 0) {
          const cat = selectedGenres[0].toLowerCase();
          if (['hollywood', 'bollywood'].includes(cat)) {
            const res = await omni.movies.getByCountry(cat, currentPage);
            data = {
              results: (res.items || []).slice(0, 28),
              hasNextPage: res.pagination?.hasNextPage ?? false,
              currentPage: res.pagination?.currentPage ?? currentPage,
              maxPage: res.pagination?.totalPages || (res.pagination?.hasNextPage ? currentPage + 1 : currentPage)
            };
          } else {
            const res = await omni.movies.getByGenre(cat, currentPage);
            data = {
              results: (res.items || []).slice(0, 28),
              hasNextPage: res.pagination?.hasNextPage ?? false,
              currentPage: res.pagination?.currentPage ?? currentPage,
              maxPage: res.pagination?.totalPages || (res.pagination?.hasNextPage ? currentPage + 1 : currentPage)
            };
          }
        } else {
          const cat = activeCategory || (selectedSort === 'score' ? 'top_rated' : selectedSort === 'popular' ? 'popular' : 'popular');
          const res = await omni.movies.getCategory(cat, currentPage);
          data = {
            results: (res.items || []).slice(0, 28),
            hasNextPage: res.pagination?.hasNextPage ?? false,
            currentPage: res.pagination?.currentPage ?? currentPage,
            maxPage: res.pagination?.totalPages || (res.pagination?.hasNextPage ? currentPage + 1 : currentPage)
          };
        }
      }

      // 4. DONGHUA (CHINESE ANIME)
      else if (selectedLibrary === 'donghua') {
        if (keyword.trim()) {
          const res = await dpi.search(keyword.trim(), currentPage);
          const sliced = (res || []).slice(0, 28);
          data = {
            results: sliced,
            currentPage,
            hasNextPage: (res || []).length >= 28,
            maxPage: (res || []).length >= 28 ? currentPage + 1 : currentPage
          };
        } else {
          const params: Record<string, any> = { page: currentPage };
          if (selectedGenres.length) params.genre = selectedGenres.join(',');
          if (selectedType) params.type = selectedType;
          if (selectedStatus) params.status = selectedStatus;
          params.order = selectedSort === 'popular' ? 'popular' : selectedSort === 'rating' ? 'rating' : 'update';
          const res = await dpi.filter(params);
          const sliced = (res || []).slice(0, 28);
          data = {
            results: sliced,
            currentPage,
            hasNextPage: (res || []).length >= 28,
            maxPage: (res || []).length >= 28 ? currentPage + 1 : currentPage
          };
        }
      }

      // 5. HINDI DUBBED
      else if (selectedLibrary === 'hindi') {
        if (keyword.trim()) {
          const res = await hpi.hindi.search(keyword.trim(), currentPage);
          data = {
            results: (res.items || []).slice(0, 28),
            hasNextPage: res.pagination?.hasNextPage ?? false,
            currentPage: res.pagination?.currentPage ?? currentPage,
            maxPage: res.pagination?.totalPages || (res.pagination?.hasNextPage ? currentPage + 1 : currentPage)
          };
        } else {
          const params: Record<string, any> = { page: currentPage };
          if (selectedGenres.length) params.genre = selectedGenres.join(',');
          if (selectedType) params.type = selectedType;
          if (selectedStatus) params.status = selectedStatus;
          if (selectedSort) params.sort = selectedSort;
          const res = await hpi.hindi.filter(params);
          data = {
            results: (res.items || []).slice(0, 28),
            hasNextPage: res.pagination?.hasNextPage ?? false,
            currentPage: res.pagination?.currentPage ?? currentPage,
            maxPage: res.pagination?.totalPages || (res.pagination?.hasNextPage ? currentPage + 1 : currentPage)
          };
        }
      }

      // 6. MAIN ANIME
      else {
        const hasFilters = selectedGenres.length > 0 || selectedType || selectedStatus ||
          selectedSeason || selectedYear || (selectedSort && selectedSort !== 'default');

        if (urlMode === 'az' && !keyword.trim() && !hasFilters) {
          data = await AnimeService.getFilteredAnime('az-list', currentPage);
        } else if (activeCategory === 'trending' || activeCategory === 'popular' || selectedSort === 'most-viewed') {
          data = await AnimeService.getFilteredAnime('popular', currentPage);
        } else if (activeCategory === 'recent' || activeCategory === 'latest-updated') {
          data = await AnimeService.getFilteredAnime('recent', currentPage);
        } else if (activeCategory === 'favorite') {
          data = await AnimeService.getFilteredAnime('favorite', currentPage);
        } else if (activeCategory === 'airing') {
          data = await AnimeService.getFilteredAnime('airing', currentPage);
        } else if (activeCategory === 'upcoming') {
          data = await AnimeService.getFilteredAnime('upcoming', currentPage);
        } else if (keyword.trim() && !hasFilters) {
          data = await AnimeService.search(keyword.trim(), currentPage);
        } else if (hasFilters || keyword.trim()) {
          const params: Record<string, any> = { page: currentPage, perPage: 28 };
          if (keyword.trim()) params.keyword = keyword.trim();
          if (selectedGenres.length) params.genres = selectedGenres.join(',');
          if (selectedType) params.type = selectedType;
          if (selectedStatus) params.status = selectedStatus;
          if (selectedSeason) params.season = selectedSeason;
          if (selectedYear) params.year = selectedYear;
          if (selectedSort && selectedSort !== 'default') params.sort = selectedSort;

          let filterResults = await AnimeService.filter(params);
          if ((!filterResults || filterResults.length === 0) && selectedSort === 'name-az') {
            const azRes = await AnimeService.getFilteredAnime('az-list', currentPage);
            filterResults = azRes.results || [];
          }
          const hasNext = (filterResults as any)?.hasNextPage ?? ((filterResults || []).length >= 28);
          const dynamicMax = (filterResults as any)?.maxPage || (filterResults as any)?.pageInfo?.lastPage || (hasNext ? currentPage + 1 : currentPage);
          data = {
            results: (filterResults || []).slice(0, 28),
            currentPage,
            hasNextPage: hasNext,
            maxPage: dynamicMax
          };
        } else {
          data = await AnimeService.getFilteredAnime('popular', currentPage);
        }
      }

      setResults(data?.results || data || []);
      setHasNextPage(Boolean(data?.hasNextPage));
      setMaxPage(data?.maxPage);
    } catch (err) {
      console.error('Explore data fetch error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [
    selectedLibrary, keyword, selectedGenres, selectedType,
    selectedStatus, selectedSeason, selectedYear, selectedCountry,
    selectedSort, currentPage, activeCategory, urlMode
  ]);

  useEffect(() => {
    fetchResults();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchResults]);

  // ─── SEARCH HANDLER ─────────────────────────────────────────────────────────

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    playGummyTap();
    const cleanKw = searchInput.trim();
    setKeyword(cleanKw);
    updateUrlParams({ keyword: cleanKw || null });
  };

  const handleClearSearch = () => {
    playGummyTap();
    setSearchInput('');
    setKeyword('');
    updateUrlParams({ keyword: null });
  };

  const handleResetAll = () => {
    playGummyTap();
    setSelectedLibrary('all');
    setKeyword('');
    setSearchInput('');
    setSelectedGenres([]);
    setSelectedType('');
    setSelectedStatus('');
    setSelectedSeason('');
    setSelectedYear('');
    setSelectedCountry('');
    setSelectedSort('');
    setActiveCategory('');
    router.replace('/explore', { scroll: false });
  };

  // ─── DYNAMIC HEADINGS & LABELS ──────────────────────────────────────────────

  const pageTitle = useMemo(() => {
    if (keyword.trim()) return `Results for "${keyword.trim()}"`;
    if (activeCategory) {
      if (activeCategory === 'trending' || activeCategory === 'popular') return 'Trending & Popular Archive';
      if (activeCategory === 'recent' || activeCategory === 'latest-updated') return 'Latest Updates & Releases';
      if (activeCategory === 'favorite') return 'All-Time Fan Favorites';
      if (activeCategory === 'airing') return 'Top Airing Broadcasts';
      if (activeCategory === 'upcoming') return 'Anticipated Upcoming Titles';
      return `Explore ${activeCategory.replace(/-/g, ' ')}`;
    }
    if (selectedGenres.length > 0) return `${selectedGenres.map(g => g.replace(/-/g, ' ')).join(', ')} Archive`;
    if (selectedCountry) return `${selectedCountry.toUpperCase()} Drama Collection`;
    if (selectedLibrary === 'all') return 'Explore All Media';
    return `Explore ${activeLibObj.label}`;
  }, [keyword, activeCategory, selectedGenres, selectedCountry, selectedLibrary, activeLibObj]);

  const displayMaxPage = useMemo(() => {
    if (maxPage && maxPage > 0) return maxPage;
    if (hasNextPage) return currentPage + 1;
    return currentPage;
  }, [maxPage, hasNextPage, currentPage]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedLibrary !== 'all') count++;
    if (keyword.trim()) count++;
    if (selectedGenres.length > 0) count += selectedGenres.length;
    if (selectedType) count++;
    if (selectedStatus) count++;
    if (selectedSeason) count++;
    if (selectedYear) count++;
    if (selectedCountry) count++;
    if (selectedSort && selectedSort !== 'default' && selectedSort !== 'newest') count++;
    if (activeCategory) count++;
    return count;
  }, [
    selectedLibrary, keyword, selectedGenres, selectedType,
    selectedStatus, selectedSeason, selectedYear, selectedCountry,
    selectedSort, activeCategory
  ]);

  return (
    <div className="w-full min-h-screen bg-[#07090e] text-white selection:bg-white/20">
      
      {/* ============================================================== */}
      {/* 1. COMPACT SLEEK HERO HEADER & TRANSFORMABLE SEARCHBAR */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden border-b border-white/[0.08] pt-4 sm:pt-6 pb-4 sm:pb-6 px-2 sm:px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-transparent pointer-events-none" />

        {/* Ambient Glow Blob */}
        <motion.div
          animate={{
            opacity: [0.12, 0.2, 0.12],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ backgroundColor: activeLibObj.accentHex }}
          className="absolute top-[-50%] left-1/2 -translate-x-1/2 w-[500px] md:w-[750px] h-[280px] rounded-full blur-[130px] pointer-events-none"
        />

        <div className="relative z-10 w-full flex flex-col items-center text-center">
          
          {/* Top Pill Badge */}
          <div className="flex items-center gap-2 mb-2 px-3 py-0.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-sm">
            <Compass size={12} className={activeLibObj.color} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
              {keyword ? 'Search' : 'Explore'}
            </span>
            <span className="text-zinc-600">•</span>
            <span className={cn("text-[10px] font-bold uppercase tracking-wider", activeLibObj.color)}>
              {activeLibObj.shortLabel}
            </span>
          </div>

          {/* Dynamic Headline */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-wide uppercase font-lemon drop-shadow-lg mb-1.5 max-w-3xl">
            {pageTitle}
          </h1>

          <p className="text-xs text-zinc-400 max-w-xl font-medium mb-3.5">
            {selectedLibrary === 'all'
              ? 'Unified discovery across Anime, Manga, Movies, Drama & Donghua.'
              : `${activeLibObj.sublabel}. Real-time filtering and discoverability.`}
          </p>

          {/* Transformable Search Bar & Image Search Panel */}
          <AnimatePresence mode="wait">
            {imageSearchOpen ? (
              <motion.div
                key="image-search-panel"
                initial={{ opacity: 0, scale: 0.98, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -6 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-2xl bg-[#0c1322] border border-white/20 rounded-3xl p-4 sm:p-5 shadow-2xl relative text-left"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
                      <ScanSearch size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-white font-lemon">
                        Visual Scene Search
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Upload an anime screenshot to identify title, episode & exact timestamp
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      playGummyTap();
                      setImageSearchOpen(false);
                    }}
                    className="p-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Close image search"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Crop View or Dropzone */}
                {isCropping && rawImageSrc ? (
                  <ImageCropper
                    imageSrc={rawImageSrc}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setIsCropping(false)}
                  />
                ) : (
                  <div className="space-y-3">
                    {!imagePreviewUrl ? (
                      <div
                        className={cn(
                          "w-full h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer",
                          imageDragActive
                            ? "border-orange-500 bg-orange-500/10 scale-[1.01]"
                            : "border-white/15 hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.04]"
                        )}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-zinc-400 border border-white/10">
                          <Upload size={18} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-white mb-0.5">Drop anime scene screenshot here</p>
                          <p className="text-[10px] text-zinc-500">or click to browse from device</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full relative rounded-2xl overflow-hidden border border-white/15 bg-black/60">
                        <div className="h-44 w-full flex items-center justify-center bg-black/80">
                          <img
                            src={imagePreviewUrl}
                            alt="Preview"
                            className="max-h-44 max-w-full object-contain"
                          />
                        </div>
                        <div className="absolute top-2 right-2 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsCropping(true)}
                            className="px-2.5 py-1 bg-black/80 hover:bg-black text-white text-[10px] font-bold rounded-lg border border-white/20 flex items-center gap-1 transition-all"
                          >
                            <Crop size={12} /> Crop
                          </button>
                          <button
                            type="button"
                            onClick={handleClearImage}
                            className="p-1 bg-black/80 hover:bg-red-500/80 text-white rounded-lg border border-white/20 transition-all"
                            title="Remove image"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Scan Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={doImageSearch}
                        disabled={!selectedImageFile || imageSearching}
                        className={cn(
                          "flex-1 py-2 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all shadow-md",
                          !selectedImageFile || imageSearching
                            ? "bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed"
                            : "bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:brightness-110 active:scale-95"
                        )}
                      >
                        {imageSearching ? (
                          <>
                            <Loader2 className="animate-spin" size={14} />
                            <span>Scanning Scene...</span>
                          </>
                        ) : (
                          <>
                            <Zap size={14} />
                            <span>Scan Anime Scene</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setImageSearchOpen(false)}
                        className="px-3 py-2 rounded-xl font-bold text-xs bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-colors"
                      >
                        Text Search
                      </button>
                    </div>

                    {imageError && (
                      <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-medium flex items-center gap-1.5">
                        <Info size={13} className="shrink-0" />
                        <span>{imageError}</span>
                      </div>
                    )}

                    {/* Scan Matches */}
                    {imageResults.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-2 max-h-56 overflow-y-auto pr-1">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                          <span>Matched Anime Scenes ({imageResults.length})</span>
                          <span className="text-orange-400 font-mono text-[9px]">Moe Engine</span>
                        </div>
                        {imageResults.map((match, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3 hover:bg-white/[0.06] transition-all"
                          >
                            <img
                              src={match.image}
                              alt={match.title}
                              className="w-16 h-12 rounded-lg object-cover shrink-0 border border-white/10"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-white truncate">{match.title}</div>
                              <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                                <span className="text-orange-400 font-bold">{match.similarity}% Match</span>
                                <span>•</span>
                                <span>Ep {match.episode}</span>
                                <span>•</span>
                                <span className="font-mono">{match.timeStr}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {match.targetUrl && (
                                <Link
                                  href={match.targetUrl}
                                  className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider transition-all"
                                >
                                  Watch
                                </Link>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setKeyword(match.title);
                                  setSearchInput(match.title);
                                  setSelectedLibrary('main');
                                  setImageSearchOpen(false);
                                  updateUrlParams({ keyword: match.title, library: null });
                                }}
                                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white text-[10px] font-bold transition-all"
                              >
                                Explore
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              /* Sleek Compact Search Bar */
              <div
                key="normal-search-bar"
                className="w-full max-w-2xl relative flex items-center bg-[#0c1322] border border-white/15 focus-within:border-white/30 rounded-full h-11 sm:h-12 shadow-2xl px-2.5 sm:px-3 transition-all"
              >
                <div className={cn("w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0", activeLibObj.bgLight)}>
                  <Search size={14} className={activeLibObj.color} />
                </div>

                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchSubmit();
                    }
                  }}
                  placeholder={
                    selectedLibrary === 'all'
                      ? "Search everything (Anime, Manga, Movies, Drama, Donghua)..."
                      : `Search in ${activeLibObj.shortLabel} (title, creator, genre)...`
                  }
                  className="flex-1 bg-transparent border-none outline-none text-white text-xs sm:text-sm px-2.5 placeholder-zinc-500 font-medium h-full"
                />

                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="p-1 text-zinc-400 hover:text-white transition-colors mr-1"
                    title="Clear input"
                  >
                    <X size={14} />
                  </button>
                )}

                {/* Image Search Button */}
                <button
                  type="button"
                  onClick={() => {
                    playGummyTap();
                    setImageSearchOpen(true);
                  }}
                  className="px-2 sm:px-2.5 py-1 rounded-full text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1.5 text-[11px] font-bold mr-1.5 active:scale-95"
                  title="Search by Scene Screenshot"
                >
                  <ScanSearch size={13} className="text-orange-400" />
                  <span className="hidden sm:inline">Image</span>
                </button>

                {/* Search Button (changed from Explore to Search) */}
                <button
                  type="button"
                  onClick={() => handleSearchSubmit()}
                  className={cn(
                    "px-4 sm:px-5 h-7 sm:h-8 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md active:scale-95 text-white border",
                    activeLibObj.bgActive,
                    activeLibObj.borderActive
                  )}
                >
                  <Search size={12} />
                  <span>Search</span>
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. UNIFIED DROPDOWN CONTROLS BAR (No Huge Rows!) */}
      {/* ============================================================== */}
      <div className="sticky top-[52px] sm:top-[56px] z-30 bg-[#07090e]/95 backdrop-blur-xl border-b border-white/[0.08] py-2.5 px-2 sm:px-4">
        <div ref={dropdownRef} className="w-full flex items-center justify-between gap-2 overflow-visible">
          
          {/* Unified Dropdown Controls Row */}
          <div className="flex flex-wrap items-center gap-2 py-1 flex-1 overflow-visible">
            
            {/* 1. Target / Library Dropdown */}
            <div className={cn("relative shrink-0", openDropdown === 'library' && "z-50")}>
              <button
                onClick={() => {
                  playGummyTap();
                  setOpenDropdown(openDropdown === 'library' ? null : 'library');
                }}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm whitespace-nowrap active:scale-95",
                  openDropdown === 'library'
                    ? "bg-white/15 text-white border-white/30"
                    : "bg-white/[0.05] hover:bg-white/[0.09] text-zinc-300 border-white/10"
                )}
              >
                <Compass size={13} className={activeLibObj.color} />
                <span>{activeLibObj.shortLabel}</span>
                <ChevronDown size={12} className={cn("text-zinc-400 transition-transform", openDropdown === 'library' && "rotate-180")} />
              </button>

              <AnimatePresence>
                {openDropdown === 'library' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    style={{ backgroundColor: '#0c1322' }}
                    className="absolute left-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-[#0c1322] border border-white/15 rounded-2xl shadow-2xl p-2 z-50 ring-1 ring-white/10"
                  >
                    <div className="px-2.5 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-white/[0.06] mb-1">
                      Explore Media Target
                    </div>
                    <div className="space-y-1">
                      {LIBRARIES.map(lib => {
                        const isSel = selectedLibrary === lib.id;
                        const Icon = lib.icon;
                        return (
                          <button
                            key={lib.id}
                            onClick={() => {
                              playGummyTap();
                              setSelectedLibrary(lib.id);
                              setSelectedGenres([]);
                              setSelectedType('');
                              setSelectedStatus('');
                              setSelectedSort('');
                              updateUrlParams({
                                library: lib.id === 'all' ? null : lib.id,
                                genres: null,
                                type: null,
                                status: null,
                                sort: null,
                                category: null
                              });
                              setOpenDropdown(null);
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all border",
                              isSel
                                ? `${lib.bgLight} ${lib.borderActive} text-white`
                                : "border-transparent hover:bg-white/[0.06] text-zinc-300 hover:text-white"
                            )}
                          >
                            <div className={cn("p-1.5 rounded-lg border", lib.bgLight, lib.borderActive, lib.color)}>
                              <Icon size={14} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold truncate flex items-center justify-between">
                                <span>{lib.label}</span>
                                {isSel && <Check size={12} className={lib.color} />}
                              </div>
                              <div className="text-[10px] text-zinc-400 truncate">{lib.sublabel}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Genre Dropdown with in-menu search */}
            <div className={cn("relative shrink-0", openDropdown === 'genre' && "z-50")}>
              <button
                onClick={() => {
                  playGummyTap();
                  setOpenDropdown(openDropdown === 'genre' ? null : 'genre');
                  setGenreFilterSearch('');
                }}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm whitespace-nowrap active:scale-95",
                  selectedGenres.length > 0
                    ? `${activeLibObj.bgLight} ${activeLibObj.borderActive} ${activeLibObj.color}`
                    : openDropdown === 'genre'
                    ? "bg-white/15 text-white border-white/30"
                    : "bg-white/[0.05] hover:bg-white/[0.09] text-zinc-300 border-white/10"
                )}
              >
                <Tag size={13} className={selectedGenres.length > 0 ? activeLibObj.color : "text-zinc-400"} />
                <span>
                  {selectedGenres.length === 0
                    ? 'All Genres'
                    : selectedGenres.length === 1
                    ? selectedGenres[0].replace(/-/g, ' ')
                    : `${selectedGenres.length} Genres`}
                </span>
                <ChevronDown size={12} className={cn("text-zinc-400 transition-transform", openDropdown === 'genre' && "rotate-180")} />
              </button>

              <AnimatePresence>
                {openDropdown === 'genre' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    style={{ backgroundColor: '#0c1322' }}
                    className="absolute left-0 top-full mt-2 w-64 sm:w-72 max-w-[calc(100vw-2rem)] bg-[#0c1322] border border-white/15 rounded-2xl shadow-2xl p-2 z-50 ring-1 ring-white/10"
                  >
                    {/* Filter mini search */}
                    <div className="relative mb-2">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        autoFocus
                        value={genreFilterSearch}
                        onChange={(e) => setGenreFilterSearch(e.target.value)}
                        placeholder="Search genres..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-1 pl-7 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20"
                      />
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-0.5 scrollbar-hide pr-1">
                      <button
                        onClick={() => {
                          playGummyTap();
                          setSelectedGenres([]);
                          updateUrlParams({ genres: null });
                          setOpenDropdown(null);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors",
                          selectedGenres.length === 0 ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <span>Any Genre</span>
                        {selectedGenres.length === 0 && <Check size={12} className={activeLibObj.color} />}
                      </button>

                      {filteredGenresList.map(g => {
                        const gLower = g.toLowerCase();
                        const isChecked = selectedGenres.includes(gLower);
                        return (
                          <button
                            key={g}
                            onClick={() => {
                              playGummyTap();
                              let newGenres: string[];
                              // Drama & Movies support single category selection for clean endpoints
                              if (selectedLibrary === 'drama' || selectedLibrary === 'movies') {
                                newGenres = isChecked ? [] : [gLower];
                              } else {
                                newGenres = isChecked ? selectedGenres.filter(x => x !== gLower) : [...selectedGenres, gLower];
                              }
                              setSelectedGenres(newGenres);
                              updateUrlParams({ genres: newGenres.join(',') || null });
                              if (selectedLibrary === 'drama' || selectedLibrary === 'movies') {
                                setOpenDropdown(null);
                              }
                            }}
                            className={cn(
                              "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors",
                              isChecked
                                ? `${activeLibObj.bgLight} ${activeLibObj.color}`
                                : "text-zinc-300 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <span className="capitalize">{g.replace(/-/g, ' ')}</span>
                            {isChecked && <Check size={12} className={activeLibObj.color} />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Format / Type Dropdown */}
            {availableTypes && availableTypes.length > 0 && (
              <div className={cn("relative shrink-0", openDropdown === 'type' && "z-50")}>
                <button
                  onClick={() => {
                    playGummyTap();
                    setOpenDropdown(openDropdown === 'type' ? null : 'type');
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm whitespace-nowrap active:scale-95",
                    selectedType
                      ? `${activeLibObj.bgLight} ${activeLibObj.borderActive} ${activeLibObj.color}`
                      : openDropdown === 'type'
                      ? "bg-white/15 text-white border-white/30"
                      : "bg-white/[0.05] hover:bg-white/[0.09] text-zinc-300 border-white/10"
                  )}
                >
                  <Tv size={13} className={selectedType ? activeLibObj.color : "text-zinc-400"} />
                  <span>{selectedType ? selectedType.replace(/_/g, ' ').toUpperCase() : 'All Types'}</span>
                  <ChevronDown size={12} className={cn("text-zinc-400 transition-transform", openDropdown === 'type' && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {openDropdown === 'type' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      style={{ backgroundColor: '#0c1322' }}
                      className="absolute left-0 top-full mt-2 w-48 max-w-[calc(100vw-2rem)] bg-[#0c1322] border border-white/15 rounded-2xl shadow-2xl p-1.5 z-50 ring-1 ring-white/10"
                    >
                      <button
                        onClick={() => {
                          playGummyTap();
                          setSelectedType('');
                          updateUrlParams({ type: null });
                          setOpenDropdown(null);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors",
                          !selectedType ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <span>Any Format</span>
                        {!selectedType && <Check size={12} className={activeLibObj.color} />}
                      </button>

                      {availableTypes.map(t => {
                        const isChecked = selectedType === t;
                        return (
                          <button
                            key={t}
                            onClick={() => {
                              playGummyTap();
                              setSelectedType(t);
                              updateUrlParams({ type: t });
                              setOpenDropdown(null);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors uppercase",
                              isChecked ? `${activeLibObj.bgLight} ${activeLibObj.color}` : "text-zinc-300 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <span>{t.replace(/_/g, ' ')}</span>
                            {isChecked && <Check size={12} className={activeLibObj.color} />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 4. Status Dropdown */}
            {availableStatuses && availableStatuses.length > 0 && (
              <div className={cn("relative shrink-0", openDropdown === 'status' && "z-50")}>
                <button
                  onClick={() => {
                    playGummyTap();
                    setOpenDropdown(openDropdown === 'status' ? null : 'status');
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm whitespace-nowrap active:scale-95",
                    selectedStatus
                      ? `${activeLibObj.bgLight} ${activeLibObj.borderActive} ${activeLibObj.color}`
                      : openDropdown === 'status'
                      ? "bg-white/15 text-white border-white/30"
                      : "bg-white/[0.05] hover:bg-white/[0.09] text-zinc-300 border-white/10"
                  )}
                >
                  <Activity size={13} className={selectedStatus ? activeLibObj.color : "text-zinc-400"} />
                  <span>
                    {selectedStatus
                      ? availableStatuses.find(s => s.id === selectedStatus)?.label || selectedStatus
                      : 'All Status'}
                  </span>
                  <ChevronDown size={12} className={cn("text-zinc-400 transition-transform", openDropdown === 'status' && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {openDropdown === 'status' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      style={{ backgroundColor: '#0c1322' }}
                      className="absolute left-0 top-full mt-2 w-52 max-w-[calc(100vw-2rem)] bg-[#0c1322] border border-white/15 rounded-2xl shadow-2xl p-1.5 z-50 ring-1 ring-white/10"
                    >
                      <button
                        onClick={() => {
                          playGummyTap();
                          setSelectedStatus('');
                          updateUrlParams({ status: null });
                          setOpenDropdown(null);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors",
                          !selectedStatus ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <span>Any Status</span>
                        {!selectedStatus && <Check size={12} className={activeLibObj.color} />}
                      </button>

                      {availableStatuses.map(s => {
                        const isChecked = selectedStatus === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => {
                              playGummyTap();
                              setSelectedStatus(s.id);
                              updateUrlParams({ status: s.id });
                              setOpenDropdown(null);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors",
                              isChecked ? `${activeLibObj.bgLight} ${activeLibObj.color}` : "text-zinc-300 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <span>{s.label}</span>
                            {isChecked && <Check size={12} className={activeLibObj.color} />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 5. Season & Year (Anime library) */}
            {selectedLibrary === 'main' && (
              <div className={cn("relative shrink-0", openDropdown === 'season_year' && "z-50")}>
                <button
                  onClick={() => {
                    playGummyTap();
                    setOpenDropdown(openDropdown === 'season_year' ? null : 'season_year');
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm whitespace-nowrap active:scale-95",
                    selectedSeason || selectedYear
                      ? `${activeLibObj.bgLight} ${activeLibObj.borderActive} ${activeLibObj.color}`
                      : openDropdown === 'season_year'
                      ? "bg-white/15 text-white border-white/30"
                      : "bg-white/[0.05] hover:bg-white/[0.09] text-zinc-300 border-white/10"
                  )}
                >
                  <Calendar size={13} className={selectedSeason || selectedYear ? activeLibObj.color : "text-zinc-400"} />
                  <span>
                    {selectedSeason && selectedYear
                      ? `${selectedSeason.toUpperCase()} ${selectedYear}`
                      : selectedSeason
                      ? selectedSeason.toUpperCase()
                      : selectedYear
                      ? selectedYear
                      : 'Season & Year'}
                  </span>
                  <ChevronDown size={12} className={cn("text-zinc-400 transition-transform", openDropdown === 'season_year' && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {openDropdown === 'season_year' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      style={{ backgroundColor: '#0c1322' }}
                      className="absolute left-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-[#0c1322] border border-white/15 rounded-2xl shadow-2xl p-3 z-50 ring-1 ring-white/10"
                    >
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Seasons</div>
                      <div className="grid grid-cols-2 gap-1.5 mb-3">
                        <button
                          onClick={() => {
                            playGummyTap();
                            setSelectedSeason('');
                            updateUrlParams({ season: null });
                          }}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-bold border",
                            !selectedSeason ? "bg-white/10 text-white border-white/20" : "border-white/5 text-zinc-400 hover:bg-white/5"
                          )}
                        >
                          Any Season
                        </button>
                        {SEASONS.map(s => (
                          <button
                            key={s}
                            onClick={() => {
                              playGummyTap();
                              setSelectedSeason(s);
                              updateUrlParams({ season: s });
                            }}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-xs font-bold border uppercase",
                              selectedSeason === s ? `${activeLibObj.bgLight} ${activeLibObj.color} ${activeLibObj.borderActive}` : "border-white/5 text-zinc-300 hover:bg-white/5"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>

                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Year</div>
                      <div className="max-h-36 overflow-y-auto grid grid-cols-3 gap-1 scrollbar-hide pr-1">
                        <button
                          onClick={() => {
                            playGummyTap();
                            setSelectedYear('');
                            updateUrlParams({ year: null });
                            setOpenDropdown(null);
                          }}
                          className={cn(
                            "px-2 py-1 rounded-lg text-xs font-bold border text-center col-span-3 mb-1",
                            !selectedYear ? "bg-white/10 text-white border-white/20" : "border-white/5 text-zinc-400 hover:bg-white/5"
                          )}
                        >
                          Any Year
                        </button>
                        {YEARS.map(y => (
                          <button
                            key={y}
                            onClick={() => {
                              playGummyTap();
                              setSelectedYear(y);
                              updateUrlParams({ year: y });
                              setOpenDropdown(null);
                            }}
                            className={cn(
                              "px-2 py-1 rounded-lg text-xs font-bold border text-center",
                              selectedYear === y ? `${activeLibObj.bgLight} ${activeLibObj.color} ${activeLibObj.borderActive}` : "border-white/5 text-zinc-300 hover:bg-white/5"
                            )}
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 6. Sort Order Dropdown */}
            {availableSorts && availableSorts.length > 0 && (
              <div className={cn("relative shrink-0", openDropdown === 'sort' && "z-50")}>
                <button
                  onClick={() => {
                    playGummyTap();
                    setOpenDropdown(openDropdown === 'sort' ? null : 'sort');
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm whitespace-nowrap active:scale-95",
                    selectedSort && selectedSort !== 'default' && selectedSort !== 'newest'
                      ? `${activeLibObj.bgLight} ${activeLibObj.borderActive} ${activeLibObj.color}`
                      : openDropdown === 'sort'
                      ? "bg-white/15 text-white border-white/30"
                      : "bg-white/[0.05] hover:bg-white/[0.09] text-zinc-300 border-white/10"
                  )}
                >
                  <ArrowUpDown size={13} className={selectedSort ? activeLibObj.color : "text-zinc-400"} />
                  <span>
                    {availableSorts.find(s => s.id === selectedSort)?.label || 'Sort Order'}
                  </span>
                  <ChevronDown size={12} className={cn("text-zinc-400 transition-transform", openDropdown === 'sort' && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {openDropdown === 'sort' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      style={{ backgroundColor: '#0c1322' }}
                      className="absolute right-0 sm:left-0 top-full mt-2 w-52 max-w-[calc(100vw-2rem)] bg-[#0c1322] border border-white/15 rounded-2xl shadow-2xl p-1.5 z-50 ring-1 ring-white/10"
                    >
                      {availableSorts.map(s => {
                        const isChecked = selectedSort === s.id || (!selectedSort && (s.id === 'default' || s.id === 'newest'));
                        const Icon = s.icon;
                        return (
                          <button
                            key={s.id}
                            onClick={() => {
                              playGummyTap();
                              setSelectedSort(s.id);
                              updateUrlParams({ sort: s.id === 'default' || s.id === 'newest' ? null : s.id });
                              setOpenDropdown(null);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-colors",
                              isChecked ? `${activeLibObj.bgLight} ${activeLibObj.color}` : "text-zinc-300 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <span className="flex items-center gap-2">
                              <Icon size={13} className="text-zinc-400" />
                              <span>{s.label}</span>
                            </span>
                            {isChecked && <Check size={12} className={activeLibObj.color} />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Quick Clear All Button (if any filters active) */}
          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetAll}
              title="Reset all filters"
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 text-xs font-bold transition-all active:scale-95"
            >
              <RotateCcw size={12} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. ACTIVE FILTERS BADGES BAR (Synced with URL) */}
      {/* ============================================================== */}
      <div className="w-full px-2 sm:px-4 pt-4 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Active Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mr-1">
              Active:
            </span>

            {/* Library Chip (if not all) */}
            {selectedLibrary !== 'all' && (
              <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border", activeLibObj.bgLight, activeLibObj.borderActive, activeLibObj.color)}>
                <span>Target: {activeLibObj.shortLabel}</span>
                <button onClick={() => { setSelectedLibrary('all'); updateUrlParams({ library: null }); }}>
                  <X size={11} className="hover:opacity-75" />
                </button>
              </span>
            )}

            {/* Keyword Chip */}
            {keyword && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 border border-white/15 text-white">
                <span>"{keyword}"</span>
                <button onClick={handleClearSearch}>
                  <X size={11} className="hover:opacity-75" />
                </button>
              </span>
            )}

            {/* Section/Category Chip */}
            {activeCategory && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 border border-white/15 text-white capitalize">
                <span>Category: {activeCategory.replace(/-/g, ' ')}</span>
                <button onClick={() => { setActiveCategory(''); updateUrlParams({ category: null, section: null }); }}>
                  <X size={11} className="hover:opacity-75" />
                </button>
              </span>
            )}

            {/* Genre Chips */}
            {selectedGenres.map(g => (
              <span key={g} className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize", activeLibObj.bgLight, activeLibObj.borderActive, activeLibObj.color)}>
                <span>{g.replace(/-/g, ' ')}</span>
                <button onClick={() => {
                  const updated = selectedGenres.filter(x => x !== g);
                  setSelectedGenres(updated);
                  updateUrlParams({ genres: updated.join(',') || null });
                }}>
                  <X size={11} className="hover:opacity-75" />
                </button>
              </span>
            ))}

            {/* Format Chip */}
            {selectedType && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 border border-white/15 text-zinc-300 uppercase">
                <span>Type: {selectedType.replace(/_/g, ' ')}</span>
                <button onClick={() => { setSelectedType(''); updateUrlParams({ type: null }); }}>
                  <X size={11} className="hover:opacity-75" />
                </button>
              </span>
            )}

            {/* Status Chip */}
            {selectedStatus && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 border border-white/15 text-zinc-300 capitalize">
                <span>Status: {selectedStatus}</span>
                <button onClick={() => { setSelectedStatus(''); updateUrlParams({ status: null }); }}>
                  <X size={11} className="hover:opacity-75" />
                </button>
              </span>
            )}

            {/* Season Chip */}
            {selectedSeason && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 border border-white/15 text-zinc-300 uppercase">
                <span>Season: {selectedSeason}</span>
                <button onClick={() => { setSelectedSeason(''); updateUrlParams({ season: null }); }}>
                  <X size={11} className="hover:opacity-75" />
                </button>
              </span>
            )}

            {/* Year Chip */}
            {selectedYear && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 border border-white/15 text-zinc-300">
                <span>Year: {selectedYear}</span>
                <button onClick={() => { setSelectedYear(''); updateUrlParams({ year: null }); }}>
                  <X size={11} className="hover:opacity-75" />
                </button>
              </span>
            )}

            {/* Sort Chip */}
            {selectedSort && selectedSort !== 'default' && selectedSort !== 'newest' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 border border-white/15 text-zinc-300">
                <span>Sort: {selectedSort}</span>
                <button onClick={() => { setSelectedSort(''); updateUrlParams({ sort: null }); }}>
                  <X size={11} className="hover:opacity-75" />
                </button>
              </span>
            )}

            {activeFiltersCount === 0 && (
              <span className="text-xs text-zinc-500 font-medium">
                None (Showing all titles)
              </span>
            )}
          </div>

          {/* Result Count Indicator */}
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
            {loading ? (
              <div className="flex items-center gap-1.5 text-zinc-500">
                <Loader2 size={13} className="animate-spin text-zinc-400" />
                <span>Loading titles...</span>
              </div>
            ) : (
              <div className="text-xs font-bold text-zinc-400">
                {results.length > 0 ? `${results.length}+ titles available` : '0 titles found'}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. RESULTS GRID & MEDIA CARDS */}
      {/* ============================================================== */}
      <div className="w-full px-2 sm:px-4 mt-4">
        {loading ? (
          <SimpleGridSkeleton />
        ) : results.length === 0 ? (
          <div className="h-[45vh] flex flex-col items-center justify-center gap-5 text-center px-4">
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden shadow-2xl">
              <Search size={32} className="text-zinc-600" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider mb-1.5 font-lemon">
                No Titles Discovered
              </h3>
              <p className="text-zinc-400 text-xs sm:text-sm max-w-md mx-auto">
                {keyword
                  ? `No matches found for "${keyword}" under ${activeLibObj.label}. Try adjusting your filters or search keywords.`
                  : 'No titles match this filter combination. Try resetting your filter tags.'}
              </p>
            </div>
            <button
              onClick={handleResetAll}
              className={cn(
                "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all border shadow-lg active:scale-95 text-white",
                activeLibObj.bgActive,
                activeLibObj.borderActive
              )}
            >
              Reset Everything
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 md:gap-5"
          >
            {results.map((item: any, i: number) => {
              // 1. MANGA & NOVELS
              if (selectedLibrary === 'manga' || item._kind === 'manga') {
                return (
                  <div key={item.id || i} className="h-full">
                    <MangaCard item={item as ReadingItem} />
                  </div>
                );
              }

              // 2. DRAMA & MOVIES
              if (selectedLibrary === 'drama' || selectedLibrary === 'movies' || item._kind === 'drama' || item._kind === 'movies' || item.isMovie !== undefined || item.slug) {
                return (
                  <div key={item.id || item.slug || i} className="h-full">
                    <MediaCard item={item} theme={selectedLibrary === 'drama' || item._kind === 'drama' ? 'cyan' : 'emerald'} />
                  </div>
                );
              }

              // 3. ANIME & DONGHUA & HINDI
              return (
                <div key={item.id || item.slug || i} className="h-full">
                  <AnimeCard anime={item} />
                </div>
              );
            })}
          </motion.div>
        )}

        {/* ============================================================== */}
        {/* 5. PAGINATION CONTROLS */}
        {/* ============================================================== */}
        {!loading && results.length > 0 && (
          <div className="mt-16 flex justify-center items-center gap-3">
            <button
              onClick={() => {
                if (currentPage > 1) {
                  playGummyTap();
                  setCurrentPage(currentPage - 1);
                  updateUrlParams({ page: String(currentPage - 1) });
                }
              }}
              disabled={currentPage <= 1}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all uppercase tracking-wider border shadow-sm",
                currentPage <= 1
                  ? "opacity-25 cursor-not-allowed border-transparent bg-white/5 text-zinc-600"
                  : "bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95"
              )}
            >
              <ChevronLeft size={15} /> Prev
            </button>

            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/[0.04] border border-white/10 text-xs font-bold text-zinc-400">
              <span>Page</span>
              <span className="text-white font-black">{currentPage}</span>
              <span className="text-zinc-500">of</span>
              <span className="text-white font-black">{displayMaxPage}</span>
            </div>

            <button
              onClick={() => {
                if (hasNextPage || currentPage < displayMaxPage) {
                  playGummyTap();
                  setCurrentPage(currentPage + 1);
                  updateUrlParams({ page: String(currentPage + 1) });
                }
              }}
              disabled={!hasNextPage && currentPage >= displayMaxPage}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all uppercase tracking-wider border shadow-sm",
                (!hasNextPage && currentPage >= displayMaxPage)
                  ? "opacity-25 cursor-not-allowed border-transparent bg-white/5 text-zinc-600"
                  : "bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95"
              )}
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function SearchAndExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07090e]" />}>
      <ExploreContent />
    </Suspense>
  );
}
