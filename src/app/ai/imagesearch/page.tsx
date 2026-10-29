"use client";

import React, { useState, useRef } from 'react';
import { MoeAPI } from '@/lib/moeApi';
import { AnimeService } from '@/lib/api';
import { 
  Upload, Search, X, Loader2, Play, ScanSearch, ChevronRight, Info, Crop,
  Clock, Calendar, Star, FileCode, Tv, Check 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '@/components/Anime/Footer';
import ImageCropper, { detectAnimeScene, createCroppedImage } from '@/components/AI/ImageCropper';

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function ImageSearchPage() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Crop states
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [initialCropBox, setInitialCropBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
        setError('Please upload an image file.');
        return;
    }
    const rawUrl = URL.createObjectURL(file);
    setRawImageSrc(rawUrl);
    setPreviewUrl(rawUrl);
    setSelectedFile(file);
    setIsCropping(false);
    setError(null);
    setResults([]);

    // Automated primary crop: detects anime frame & letterbox borders to reframe in primary state
    const img = new Image();
    img.onload = async () => {
      try {
        const scene = detectAnimeScene(img);
        if (scene && scene.hasLetterbox) {
          // Letterbox or active view frame detected: automatically crop to reframe anime scene
          const { croppedFile, croppedUrl } = await createCroppedImage(img, scene, file.name);
          setSelectedFile(croppedFile);
          setPreviewUrl(croppedUrl);
          setInitialCropBox({ x: scene.x, y: scene.y, w: scene.w, h: scene.h });
        } else if (scene) {
          setInitialCropBox({ x: scene.x, y: scene.y, w: scene.w, h: scene.h });
        } else {
          setInitialCropBox({ x: 0, y: 0, w: 100, h: 100 });
        }
      } catch (err) {
        console.warn('Auto primary crop failed:', err);
      }
    };
    img.src = rawUrl;
  };

  const handleCropComplete = (croppedFile: File, croppedUrl: string) => {
    setSelectedFile(croppedFile);
    setPreviewUrl(croppedUrl);
    setIsCropping(false);
    setResults([]);
  };

  const doSearch = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    try {
        const moeRes = await MoeAPI.searchByImage(selectedFile, { anilistInfo: true });
        if (moeRes.error) throw new Error(moeRes.error);
        if (!moeRes.result || moeRes.result.length === 0) throw new Error("No matches found.");

        const uniqueResults = moeRes.result.filter((r: any, idx: number, arr: any[]) => 
            arr.findIndex((x: any) => (x.anilist as any)?.id === (r.anilist as any)?.id) === idx
        ).slice(0, 5);

        const mappedResults = await Promise.all(uniqueResults.map(async (res: any) => {
            const anilistInfo = res.anilist as any;
            const romajiTitle = anilistInfo?.title?.romaji || "";
            const englishTitle = anilistInfo?.title?.english || "";
            const nativeTitle = anilistInfo?.title?.native || "";
            const primaryTitle = englishTitle || romajiTitle || nativeTitle || "Unknown Anime";
            const secondaryTitle = (englishTitle && romajiTitle && englishTitle !== romajiTitle) 
                ? romajiTitle 
                : (nativeTitle || "");

            let matchedId = null;
            let displayTitle = primaryTitle;
            let poster = res.image;
            let animeType = '';
            let year = '';
            let episodesCount: number | null = null;
            let rating = '';
            let targetUrl = '';

            try {
                const anikotoRes = await AnimeService.search(primaryTitle || romajiTitle, 1);
                if (anikotoRes && anikotoRes.results && anikotoRes.results.length > 0) {
                    const top = anikotoRes.results[0];
                    matchedId = top.id;
                    displayTitle = top.title || primaryTitle;
                    poster = top.poster || res.image;
                    animeType = top.type || '';
                    year = top.year ? String(top.year) : '';
                    episodesCount = top.episodesCount || (top.episodes as any)?.eps || null;
                    rating = top.rating || top.score ? String(top.score || top.rating) : '';
                    targetUrl = `/watch/${matchedId}?ep=${res.episode}&t=${Math.floor(res.from)}`;
                }
            } catch (err) {}

            return {
                id: matchedId || anilistInfo?.id,
                matchedId: matchedId,
                title: displayTitle,
                secondaryTitle: secondaryTitle,
                poster: poster,
                sceneImage: res.image, // The exact matching frame from the episode
                videoPreview: res.video, // The video preview clip
                episode: res.episode,
                from: res.from,
                to: res.to,
                similarity: Math.round(res.similarity * 100),
                targetUrl: targetUrl,
                timeStr: formatTime(res.from),
                timeEndStr: formatTime(res.to),
                type: animeType,
                year: year,
                episodesCount: episodesCount,
                rating: rating,
                filename: res.filename || ''
            };
        }));

        setResults(mappedResults);
    } catch (err: any) {
        setError(err.message || 'Image search failed.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden font-poppins selection:bg-orange-500/30 flex flex-col justify-between">
        {/* Dynamic Background Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-red-900/5 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
        
        <div className="w-full px-2 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6 pb-6 relative z-10 flex-1 flex flex-col justify-start">
            
            {/* Split layout: Fixed/Sticky left, scrollable right on Desktop */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start w-full relative mb-12">
                
                {/* Left Side (Sticky upload box, title & instructions) */}
                <div className="w-full lg:w-[42%] lg:sticky lg:top-4 flex flex-col gap-5">
                    {/* Visual Scanner title placed INSIDE the upload card container so it perfectly aligns with the inner box */}
                    <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-5 shadow-2xl backdrop-blur-xl relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        
                        <div className="flex flex-col gap-4 relative z-10">
                            {/* Visual Scanner title inside container, aligned with dashed box */}
                            <h1 className="text-2xl sm:text-3xl font-black font-gradvis tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-orange-100 to-zinc-400">
                                Visual Scanner
                            </h1>

                            {isCropping && rawImageSrc ? (
                                <ImageCropper 
                                    imageSrc={rawImageSrc}
                                    initialCropBox={initialCropBox}
                                    embedded
                                    onCropComplete={handleCropComplete}
                                    onCancel={() => setIsCropping(false)}
                                />
                            ) : (
                                <>
                                    {!previewUrl ? (
                                        <div 
                                            className={`w-full aspect-video border-2 border-dashed rounded-[1.5rem] flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer 
                                            ${dragActive ? 'border-orange-500 bg-orange-500/10 scale-[1.02]' : 'border-white/10 hover:border-orange-500/50 hover:bg-white/[0.03]'}`}
                                            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrop} onDrop={handleDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleChange} />
                                            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl
                                                ${dragActive ? 'bg-orange-500 shadow-orange-500/50 text-white scale-110' : 'bg-white/5 text-zinc-400 group-hover:bg-white/10 group-hover:text-white'}`}>
                                                <Upload size={28} strokeWidth={1.5} />
                                            </div>
                                            <div className="text-center px-4">
                                                <p className="text-base font-bold font-above tracking-widest text-white mb-1">Initialize Upload</p>
                                                <p className="text-xs text-zinc-500 font-medium">Drag & drop or click to browse</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full aspect-video relative rounded-[1.5rem] overflow-hidden border border-white/10 bg-black group/preview">
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain opacity-90 transition-transform duration-700 group-hover/preview:scale-105" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => setIsCropping(true)}
                                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl uppercase tracking-widest text-xs flex items-center gap-1.5 transition-all hover:scale-105 shadow-xl"
                                                >
                                                    <Crop size={14} /> Crop
                                                </button>
                                                <button 
                                                    onClick={() => { setPreviewUrl(null); setSelectedFile(null); setResults([]); }} 
                                                    className="px-4 py-2 bg-red-500/90 hover:bg-red-500 text-white font-bold rounded-xl uppercase tracking-widest text-xs flex items-center gap-1.5 transition-all hover:scale-105 shadow-xl"
                                                >
                                                    <X size={14} /> Clear
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <button 
                                        onClick={doSearch}
                                        disabled={!previewUrl || loading}
                                        className={`w-full py-3 sm:py-3.5 rounded-xl font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-300 text-xs sm:text-sm h-11 sm:h-12
                                            ${!previewUrl || loading ? 'bg-white/5 text-zinc-600 cursor-not-allowed border border-white/5' : 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-[0_8px_24px_rgba(234,88,12,0.3)] hover:shadow-[0_12px_32px_rgba(234,88,12,0.5)] hover:-translate-y-0.5'}`}
                                    >
                                        {loading ? (
                                            <><Loader2 className="animate-spin" size={16} /> Processing Data...</>
                                        ) : (
                                            <span>Execute Scan</span>
                                        )}
                                    </button>
                                    
                                    {error && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-500/10 border border-red-500/20 backdrop-blur-md text-red-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                                            <Info size={14} /> {error}
                                        </motion.div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 px-2">
                        <p className="text-zinc-400 text-xs sm:text-sm font-light leading-relaxed">
                            Upload a screenshot from any anime scene. To get the most accurate results, <strong className="text-orange-400 font-bold">please crop the image</strong> to focus directly on the character or relevant action.
                        </p>
                        <p className="text-[10px] text-zinc-500 font-medium italic">
                            * Note: Recognition accuracy varies depending on image quality, filters, or modifications. Some results may not be accurate.
                        </p>
                    </div>
                </div>

                {/* Right Side (Title stays fixed, results scroll on Desktop) */}
                <div className="w-full lg:w-[58%] flex flex-col gap-6">
                    <div className="bg-white/[0.01] border border-white/5 rounded-[2rem] p-5 md:p-6 min-h-[400px] flex flex-col w-full shadow-2xl backdrop-blur-xl">
                        {/* Result section title with Results Count on the right side */}
                        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-white/5">
                            <h2 className="text-2xl sm:text-3xl font-black font-gradvis tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-orange-100 to-zinc-400">
                                Scan Matches
                            </h2>
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                {results.length} Results
                            </span>
                        </div>

                        <div className="w-full lg:max-h-[calc(100vh-270px)] lg:overflow-y-auto pr-0 lg:pr-2 custom-scrollbar">
                            {!results.length && !loading && (
                                <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 gap-4 py-12">
                                    <div className="w-24 h-24 rounded-full border border-white/5 flex items-center justify-center bg-white/[0.01]">
                                        <Search size={36} className="opacity-20" />
                                    </div>
                                    <p className="text-xs uppercase font-bold tracking-widest">Awaiting visual input</p>
                                </div>
                            )}

                            {loading && (
                                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
                                    <div className="relative w-24 h-24 flex items-center justify-center">
                                        <div className="absolute inset-0 rounded-full border-t-2 border-orange-500 animate-spin" />
                                        <div className="absolute inset-2 rounded-full border-b-2 border-orange-500/50 animate-spin-reverse" />
                                        <ScanSearch size={24} className="text-orange-500 animate-pulse" />
                                    </div>
                                    <p className="text-xs uppercase font-bold tracking-[0.2em] text-orange-500/70 animate-pulse">Running Neural Network...</p>
                                </div>
                            )}

                            {/* Refined, Highly Informative Match Cards */}
                            <div className="flex flex-col gap-4">
                                <AnimatePresence>
                                    {results.map((res, i) => (
                                        <motion.div 
                                            key={i}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.08, type: "spring", stiffness: 100 }}
                                            className="p-4 sm:p-5 bg-white/[0.02] rounded-2xl border border-white/10 hover:border-orange-500/40 hover:bg-white/[0.035] transition-all duration-300 flex flex-col gap-3 relative group shadow-lg"
                                        >
                                            {/* Primary Card Layout */}
                                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                                                {/* 1. Left: Anime Series Poster */}
                                                <div className="w-24 sm:w-28 md:w-32 aspect-[3/4] shrink-0 rounded-xl overflow-hidden relative shadow-2xl bg-zinc-950 border border-white/10">
                                                    <img 
                                                        src={res.poster || res.sceneImage} 
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                                        alt={res.title} 
                                                    />
                                                    {/* Confidence pill on poster */}
                                                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider backdrop-blur-md border shadow-lg ${
                                                        res.similarity >= 85 
                                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                                                            : res.similarity >= 75 
                                                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                                                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                                    }`}>
                                                        {res.similarity}% Match
                                                    </div>
                                                </div>

                                                {/* 2. Center: Title, Subtitle, Badges, Filename & Actions */}
                                                <div className="flex-1 flex flex-col justify-between h-full min-w-0">
                                                    <div>
                                                        {/* Title Header with Confidence Meter */}
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <h4 className="font-bold font-gradvis text-lg sm:text-xl text-white group-hover:text-orange-400 transition-colors line-clamp-1 leading-snug">
                                                                    {res.title}
                                                                </h4>
                                                                {res.secondaryTitle && (
                                                                    <p className="text-xs text-zinc-400 font-medium line-clamp-1 mt-0.5">
                                                                        {res.secondaryTitle}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Confidence Bar on Desktop */}
                                                            <div className="hidden xl:flex flex-col items-end shrink-0 text-right">
                                                                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Match Confidence</span>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                        <div 
                                                                            className={`h-full rounded-full ${
                                                                                res.similarity >= 85 
                                                                                    ? 'bg-emerald-400' 
                                                                                    : res.similarity >= 75 
                                                                                    ? 'bg-orange-500' 
                                                                                    : 'bg-amber-400'
                                                                            }`}
                                                                            style={{ width: `${res.similarity}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs font-mono font-bold text-white">{res.similarity}%</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Rich metadata badges row */}
                                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3">
                                                            {res.episode && (
                                                                <span className="bg-orange-500/15 text-orange-300 border border-orange-500/25 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wider flex items-center gap-1">
                                                                    <Tv size={12} className="text-orange-400" /> Episode {res.episode}
                                                                </span>
                                                            )}
                                                            {res.timeStr && (
                                                                <span className="bg-white/5 text-zinc-200 border border-white/10 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium flex items-center gap-1">
                                                                    <Clock size={12} className="text-zinc-400" /> {res.timeStr} {res.timeEndStr ? `- ${res.timeEndStr}` : ''}
                                                                </span>
                                                            )}
                                                            {res.type && (
                                                                <span className="bg-white/5 text-zinc-300 border border-white/10 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                                    {res.type}
                                                                </span>
                                                            )}
                                                            {res.year && (
                                                                <span className="bg-white/5 text-zinc-300 border border-white/10 px-2 py-1 rounded-lg text-[10px] font-bold tracking-wider flex items-center gap-1">
                                                                    <Calendar size={11} className="text-zinc-400" /> {res.year}
                                                                </span>
                                                            )}
                                                            {res.rating && (
                                                                <span className="bg-white/5 text-amber-300 border border-white/10 px-2 py-1 rounded-lg text-[10px] font-bold tracking-wider flex items-center gap-1">
                                                                    <Star size={11} className="text-amber-400 fill-amber-400" /> {res.rating}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Source Filename info for precision reference */}
                                                        {res.filename && (
                                                            <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 truncate" title={res.filename}>
                                                                <FileCode size={11} className="shrink-0 text-zinc-600" />
                                                                <span className="truncate">{res.filename}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Quick action buttons */}
                                                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/5">
                                                        {res.targetUrl ? (
                                                            <button 
                                                                onClick={() => router.push(res.targetUrl)} 
                                                                className="py-2 px-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold uppercase tracking-[0.15em] text-[11px] rounded-xl transition-all duration-300 flex items-center gap-1.5 shadow-[0_4px_16px_rgba(234,88,12,0.3)] hover:shadow-[0_6px_20px_rgba(234,88,12,0.5)] hover:-translate-y-0.5 active:scale-95"
                                                            >
                                                                <Play size={13} fill="currentColor" /> Play Episode {res.episode || ''}
                                                            </button>
                                                        ) : (
                                                            <div className="inline-flex px-3 py-1.5 bg-zinc-900/50 text-zinc-500 border border-zinc-800 font-bold uppercase tracking-widest text-[9px] rounded-xl">
                                                                Not in local archive
                                                            </div>
                                                        )}

                                                        {res.matchedId && (
                                                            <button 
                                                                onClick={() => router.push(`/anime/${res.matchedId}`)}
                                                                className="py-2 px-3 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-semibold text-[11px] rounded-xl transition-colors border border-white/10 flex items-center gap-1"
                                                            >
                                                                Anime Overview <ChevronRight size={13} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* 3. Right: Exact Matched Scene Snapshot Frame */}
                                                {res.sceneImage && (
                                                    <div className="hidden lg:flex flex-col gap-1.5 shrink-0 w-44 xl:w-52">
                                                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                                                            <Check size={11} className="text-orange-400" /> Matched Scene Frame
                                                        </span>
                                                        <div className="aspect-video w-full rounded-xl overflow-hidden relative border border-white/10 bg-black shadow-lg group/scene">
                                                            <img 
                                                                src={res.sceneImage} 
                                                                className="w-full h-full object-cover group-hover/scene:scale-105 transition-transform duration-500" 
                                                                alt="Exact Scene Frame Match" 
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                                                            <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[9px] font-mono text-zinc-300 font-semibold">
                                                                <span>{res.timeStr}</span>
                                                                <span className="text-orange-400 font-bold">Exact Frame</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Mobile scene frame (if screen is < lg) */}
                                            {res.sceneImage && (
                                                <div className="flex lg:hidden flex-col gap-1.5 pt-2 border-t border-white/5">
                                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                                                        <Check size={11} className="text-orange-400" /> Matched Scene Frame
                                                    </span>
                                                    <div className="aspect-video w-full max-w-sm rounded-xl overflow-hidden relative border border-white/10 bg-black shadow-lg">
                                                        <img 
                                                            src={res.sceneImage} 
                                                            className="w-full h-full object-cover" 
                                                            alt="Exact Scene Frame Match" 
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                                                        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-zinc-300 font-semibold">
                                                            <span>Scene Timestamp: {res.timeStr}</span>
                                                            <span className="text-orange-400 font-bold">Exact Match</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        {/* Footer component */}
        <div className="w-full mt-auto relative z-10 border-t border-white/5">
            <Footer />
        </div>
    </div>
  );
}
