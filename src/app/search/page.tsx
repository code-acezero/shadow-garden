"use client";

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AnimeCard from '@/components/Anime/AnimeCard';
import { AnimeService } from '@/lib/api';
import { dpi } from '@/lib/dpi';
import { hpi } from '@/lib/hpi';
import { omni } from '@/lib/omni';
import { demoness, hunters } from '@/lib/fonts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Loader2, ChevronLeft, ChevronRight, Filter, X, SlidersHorizontal,
  Flame, TrendingUp, Clock, Star, Tv, Film, LayoutGrid, List,
  Calendar, Layers, Info, CheckCircle, RotateCcw, ArrowDownAZ, Hash
} from 'lucide-react';

// --- CONSTANTS ---

const GENRES = ["Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Horror", "Isekai", "Mecha", "Mystery", "Psychological", "Romance", "Sci-Fi", "Seinen", "Shoujo", "Shounen", "Slice of Life", "Sports", "Supernatural", "Thriller"];
const TYPES = ["tv", "movie", "ova", "ona", "special"];
const STATUS_OPTIONS = ["currently-airing", "finished-airing", "not-yet-aired"];
const SEASONS = ["spring", "summer", "fall", "winter"];
const YEARS = Array.from({ length: 2027 - 2000 }, (_, i) => (2027 - i).toString());
const SORT_OPTIONS = [
  { value: "newest", label: "Latest", icon: Clock },
  { value: "popular", label: "Popular", icon: Flame },
  { value: "trending", label: "Trending", icon: TrendingUp },
  { value: "rating", label: "Top Rated", icon: Star },
];

const DONGHUA_GENRES = ["Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Harem", "Historical", "Martial Arts", "Mecha", "Mystery", "Romance", "Sci-Fi", "Shounen", "Slice of Life"];
const DONGHUA_STATUS = ["ongoing", "completed"];
const DONGHUA_SORT = [{value: 'update', label: 'Latest', icon: Clock}, {value: 'popular', label: 'Popular', icon: Flame}, {value: 'rating', label: 'Top Rated', icon: Star}];

const HINDI_GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery", "Romance", "Science Fiction", "TV Movie", "Thriller", "War", "Western"];
const HINDI_TYPES = ["Movie", "Series", "Drama"];
const HINDI_STATUS = ["Ongoing", "Completed"];
const HINDI_SORT = [{value: 'newest', label: 'Latest', icon: Clock}, {value: 'score', label: 'Top Rated', icon: Star}];

const DRAMA_CATEGORIES = ["korean-drama", "chinese-drama", "japanese-drama", "hindi-dubbed"];
const DRAMA_SORT = [{value: 'newest', label: 'Latest', icon: Clock}];

// --- SUB COMPONENTS ---
function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 ${
        active
          ? 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-600/20'
          : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

function SelectDropdown({ label, icon: Icon, options, value, onChange }: any) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 text-xs font-bold hover:bg-white/10 transition-colors w-full"
      >
        <Icon size={14} className="text-zinc-500" />
        <span className="flex-1 text-left truncate uppercase">{value?.replace(/-/g, ' ') || label}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronLeft size={12} className="rotate-[-90deg] text-zinc-500" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute top-full mt-1 left-0 right-0 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="max-h-48 overflow-y-auto p-1 scrollbar-hide">
              <button
                onClick={() => { onChange(""); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:bg-white/10 rounded-lg transition-colors"
              >
                Any
              </button>
              {options.map((opt: string) => (
                <button
                  key={opt}
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex justify-between items-center uppercase ${
                    value === opt ? 'bg-primary-600/20 text-primary-400' : 'text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  {opt.replace(/-/g, ' ')}
                  {value === opt && <CheckCircle size={12} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- MAIN CONTENT ---
function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const keyword = searchParams.get('keyword') || '';
  const genresParam = searchParams.get('genres') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const pageParam = parseInt(searchParams.get('page') || '1');
  const modeParam = searchParams.get('mode') || '';
  const libraryParam = searchParams.get('library') || 'main';

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(pageParam);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [maxPage, setMaxPage] = useState<number | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedLibrary, setSelectedLibrary] = useState(libraryParam);

  // Filter state
  const [query, setQuery] = useState(keyword);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(genresParam ? genresParam.split(',') : []);
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSort, setSelectedSort] = useState(sortParam);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      let data: any;

      if (selectedLibrary === 'donghua') {
        if (keyword) {
            const res = await dpi.search(keyword, currentPage);
            data = { results: res, currentPage, hasNextPage: res.length >= 20 };
        } else if (selectedGenres.length > 0 || selectedType || selectedStatus || selectedSort !== 'update') {
            const params: Record<string, any> = { page: currentPage };
            if (selectedGenres.length) params.genre = selectedGenres.join(',');
            if (selectedType) params.type = selectedType;
            if (selectedStatus) params.status = selectedStatus;
            params.order = selectedSort === 'newest' ? 'update' : selectedSort;
            const res = await dpi.filter(params);
            data = { results: res, currentPage, hasNextPage: res.length >= 24 };
        } else {
            const res = await dpi.filter({ order: 'update', page: currentPage });
            data = { results: res, currentPage, hasNextPage: res.length >= 24 };
        }
      } else if (selectedLibrary === 'hindi') {
        if (keyword) {
            const res = await hpi.hindi.search(keyword, currentPage);
            data = { results: res.items || [], hasNextPage: res.pagination?.hasNextPage, currentPage: res.pagination?.currentPage };
        } else if (selectedGenres.length > 0 || selectedType || selectedStatus || selectedSort !== 'newest') {
            const params: Record<string, any> = { page: currentPage };
            if (selectedGenres.length) params.genre = selectedGenres.join(',');
            if (selectedType) params.type = selectedType;
            if (selectedStatus) params.status = selectedStatus;
            if (selectedSort !== 'newest') params.sort = selectedSort;
            const res = await hpi.hindi.filter(params);
            data = { results: res.items || [], hasNextPage: res.pagination?.hasNextPage, currentPage: res.pagination?.currentPage };
        } else {
            const res = await hpi.hindi.filter({ sort: 'updated_at', page: currentPage });
            data = { results: res.items || [], hasNextPage: res.pagination?.hasNextPage, currentPage: res.pagination?.currentPage };
        }
      } else if (selectedLibrary === 'drama') {
        if (keyword) {
            const res = await omni.drama.search(keyword, currentPage);
            data = { results: res.items || [], hasNextPage: res.pagination?.hasNextPage, currentPage: res.pagination?.currentPage };
        } else if (selectedGenres.length > 0) {
            // We use 'selectedGenres' to store the Drama Category (e.g. korean-drama)
            const res = await omni.drama.getByCountry(selectedGenres[0].replace('-drama', ''), currentPage);
            data = { results: res.items || [], hasNextPage: res.pagination?.hasNextPage, currentPage: res.pagination?.currentPage };
        } else {
            const res = await omni.drama.getByCountry('korean', currentPage);
            data = { results: res.items || [], hasNextPage: res.pagination?.hasNextPage, currentPage: res.pagination?.currentPage };
        }
      } else {
        if (modeParam === 'az') {
          data = await AnimeService.getFilteredAnime('recent', currentPage);
        } else if (keyword) {
          data = await AnimeService.search(keyword, currentPage);
        } else if (selectedGenres.length > 0 || selectedType || selectedStatus || selectedSeason || selectedYear) {
          const params: Record<string, any> = { page: currentPage };
          if (selectedGenres.length) params.genres = selectedGenres.join(',').toLowerCase();
          if (selectedType) params.type = selectedType;
          if (selectedStatus) params.status = selectedStatus;
          if (selectedSeason) params.season = selectedSeason;
          if (selectedYear) params.year = selectedYear;
          const filterResults = await AnimeService.filter(params);
          data = { results: filterResults, currentPage, hasNextPage: filterResults.length >= 20 };
        } else {
          data = await AnimeService.getFilteredAnime(selectedSort === 'popular' ? 'popular' : selectedSort === 'trending' ? 'trending' : 'recent', currentPage);
        }
      }

      setResults(data?.results || data || []);
      setHasNextPage(data?.hasNextPage ?? false);
      setMaxPage(data?.maxPage);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, currentPage, selectedGenres, selectedType, selectedStatus, selectedSeason, selectedYear, selectedSort, modeParam, selectedLibrary]);

  useEffect(() => {
    fetchResults();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchResults]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('keyword', query);
    if (selectedGenres.length) params.set('genres', selectedGenres.join(','));
    if (selectedSort !== 'newest' && selectedSort !== 'update') params.set('sort', selectedSort);
    if (selectedLibrary !== 'main') params.set('library', selectedLibrary);
    router.push(`/search?${params.toString()}`);
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre.toLowerCase()) ? prev.filter(g => g !== genre.toLowerCase()) : [...prev, genre.toLowerCase()]
    );
  };

  const resetFilters = () => {
    setSelectedGenres([]);
    setSelectedType('');
    setSelectedStatus('');
    setSelectedSeason('');
    setSelectedYear('');
    setSelectedSort('newest');
    setQuery('');
  };

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/search?${params.toString()}`);
    setCurrentPage(page);
  };

  // Build page numbers for pagination
  const pageNumbers = () => {
    const pages: (number | string)[] = [];
    const total = maxPage || (hasNextPage ? currentPage + 1 : currentPage);
    const range = 2;
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > range + 2) pages.push('...');
      for (let i = Math.max(2, currentPage - range); i <= Math.min(total - 1, currentPage + range); i++) {
        pages.push(i);
      }
      if (currentPage < total - range - 1) pages.push('...');
      pages.push(total);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Hero Header */}
      <div className="relative pt-20 pb-8 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary-600/5 rounded-full blur-[120px]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-primary-600" />
            <span className={`text-primary-500 text-[10px] tracking-[0.3em] font-bold uppercase ${hunters.className}`}>
              {modeParam === 'az' ? 'Index' : keyword ? 'Results' : 'Explore'}
            </span>
          </div>
          
          <h1 className={`text-4xl md:text-6xl text-white mb-2 ${demoness.className}`}>
            {modeParam === 'az' ? (
              <>A-Z <span className="text-primary-600">INDEX</span></>
            ) : keyword ? (
              <>SEARCH <span className="text-primary-600">RESULTS</span></>
            ) : (
              <>SHADOW <span className="text-primary-600">LIBRARY</span></>
            )}
          </h1>
          
          {keyword && (
            <p className="text-zinc-400 text-sm md:text-base">
              Showing results for "<span className="text-white font-bold">{keyword}</span>"
              {results.length > 0 && !loading && (
                <span className="text-zinc-500 ml-2">· {results.length} found</span>
              )}
            </p>
          )}

          {/* Library Tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {['main', 'donghua', 'hindi', 'drama'].map(lib => (
                <button
                    key={lib}
                    onClick={() => {
                        setSelectedLibrary(lib);
                        setSelectedGenres([]);
                        setSelectedType('');
                        setSelectedStatus('');
                        setSelectedSeason('');
                        setSelectedYear('');
                        setSelectedSort(lib === 'donghua' ? 'update' : 'newest');
                        const params = new URLSearchParams(searchParams.toString());
                        params.set('library', lib);
                        params.delete('page');
                        params.delete('genres');
                        params.delete('type');
                        params.delete('status');
                        params.delete('sort');
                        router.push(`/search?${params.toString()}`);
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${selectedLibrary === lib ? 'bg-primary-600 text-white' : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'}`}
                >
                    {lib}
                </button>
            ))}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-6 flex gap-3">
            <div className="relative flex-1 max-w-2xl">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search anime..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-primary-500/50 focus:bg-white/[0.08] transition-all placeholder-zinc-500"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 bg-primary-600 hover:bg-primary-700 rounded-2xl text-sm font-bold transition-colors shadow-lg shadow-primary-600/20"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3.5 rounded-2xl border text-sm font-bold transition-all ${
                showFilters ? 'bg-primary-600/20 border-primary-500/30 text-primary-400' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <SlidersHorizontal size={18} />
            </button>
          </form>

          {/* Sort Chips */}
          <div className="mt-5 flex items-center gap-3 flex-wrap">
            {(selectedLibrary === 'donghua' ? DONGHUA_SORT : selectedLibrary === 'hindi' ? HINDI_SORT : selectedLibrary === 'drama' ? DRAMA_SORT : SORT_OPTIONS).map(opt => (
              <button
                key={opt.value}
                onClick={() => {
                  setSelectedSort(opt.value);
                  if (!keyword) {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('sort', opt.value);
                    params.delete('page');
                    router.push(`/search?${params.toString()}`);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  selectedSort === opt.value
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-transparent border-white/5 text-zinc-500 hover:text-white hover:border-white/10'
                }`}
              >
                <opt.icon size={14} />
                {opt.label}
              </button>
            ))}
            
            <div className="ml-auto hidden md:flex items-center gap-1 bg-white/5 rounded-xl border border-white/10 p-1">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}>
                <LayoutGrid size={14} />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}>
                <List size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden border-y border-white/5"
          >
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
              {/* Genres */}
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-3 block flex items-center gap-2">
                  <Hash size={12} /> {selectedLibrary === 'drama' ? 'Categories' : 'Genres'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const activeGenres = selectedLibrary === 'donghua' ? DONGHUA_GENRES : selectedLibrary === 'hindi' ? HINDI_GENRES : selectedLibrary === 'drama' ? DRAMA_CATEGORIES : GENRES;
                    return activeGenres.map(g => (
                      <FilterChip
                        key={g}
                        label={g.replace(/-/g, ' ')}
                        active={selectedGenres.includes(g.toLowerCase())}
                        onClick={() => {
                          if (selectedLibrary === 'drama') {
                            // Drama only supports single category select
                            setSelectedGenres(selectedGenres.includes(g) ? [] : [g]);
                          } else {
                            toggleGenre(g);
                          }
                        }}
                      />
                    ));
                  })()}
                </div>
              </div>

              {/* Dropdowns Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {selectedLibrary !== 'donghua' && selectedLibrary !== 'drama' && <SelectDropdown label="Type" icon={Tv} options={selectedLibrary === 'hindi' ? HINDI_TYPES : TYPES} value={selectedType} onChange={setSelectedType} />}
                {selectedLibrary !== 'drama' && <SelectDropdown label="Status" icon={Info} options={selectedLibrary === 'donghua' ? DONGHUA_STATUS : selectedLibrary === 'hindi' ? HINDI_STATUS : STATUS_OPTIONS} value={selectedStatus} onChange={setSelectedStatus} />}
                {selectedLibrary === 'main' && <SelectDropdown label="Season" icon={Calendar} options={SEASONS} value={selectedSeason} onChange={setSelectedSeason} />}
                {selectedLibrary === 'main' && <SelectDropdown label="Year" icon={Layers} options={YEARS} value={selectedYear} onChange={setSelectedYear} />}
              </div>

              {/* Filter Actions */}
              <div className="flex justify-between items-center pt-3 border-t border-white/5">
                <button onClick={resetFilters} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors">
                  <RotateCcw size={12} /> Reset All
                </button>
                <button
                  onClick={handleSearch}
                  className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-primary-600/20"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            <p className="text-zinc-500 text-sm animate-pulse">Searching the archives...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Search size={32} className="text-zinc-600" />
            </div>
            <h3 className="text-xl font-bold text-white">No Results Found</h3>
            <p className="text-zinc-500 text-sm text-center max-w-md">
              {keyword ? `We couldn't find anything matching "${keyword}". Try different keywords or filters.` : 'Try searching for an anime or applying some filters.'}
            </p>
            <button onClick={resetFilters} className="mt-2 px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-zinc-300 hover:bg-white/10 transition-colors">
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Active Filters Tags */}
            {(selectedGenres.length > 0 || selectedType || selectedStatus) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedGenres.map(g => (
                  <span key={g} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-600/20 border border-primary-500/20 text-primary-400 text-xs font-bold">
                    {g}
                    <button onClick={() => toggleGenre(g)} className="hover:text-white"><X size={12} /></button>
                  </span>
                ))}
                {selectedType && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase">
                    {selectedType}
                    <button onClick={() => setSelectedType('')} className="hover:text-white"><X size={12} /></button>
                  </span>
                )}
                {selectedStatus && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-600/20 border border-green-500/20 text-green-400 text-xs font-bold uppercase">
                    {selectedStatus.replace(/-/g, ' ')}
                    <button onClick={() => setSelectedStatus('')} className="hover:text-white"><X size={12} /></button>
                  </span>
                )}
              </div>
            )}

            <div className={viewMode === 'grid'
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            }>
              {results.map((anime: any) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-12 flex justify-center items-center gap-2 flex-wrap">
              <button
                onClick={() => currentPage > 1 && navigateToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                  currentPage === 1
                    ? 'opacity-30 cursor-not-allowed border-white/5 text-zinc-600'
                    : 'border-white/10 text-zinc-300 hover:bg-primary-600 hover:border-primary-500 hover:text-white'
                }`}
              >
                <ChevronLeft size={16} /> Prev
              </button>

              {pageNumbers().map((p, i) =>
                typeof p === 'string' ? (
                  <span key={`ellipsis-${i}`} className="text-zinc-600 px-2">···</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => navigateToPage(p)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                      p === currentPage
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30 border border-primary-500'
                        : 'border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => hasNextPage && navigateToPage(currentPage + 1)}
                disabled={!hasNextPage}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                  !hasNextPage
                    ? 'opacity-30 cursor-not-allowed border-white/5 text-zinc-600'
                    : 'border-white/10 text-zinc-300 hover:bg-primary-600 hover:border-primary-500 hover:text-white'
                }`}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <SearchContent />
    </Suspense>
  );
}
