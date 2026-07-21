"use client";

import React, { useState, useRef } from 'react';
import { MoeAPI } from '@/lib/moeApi';
import { AnimeService } from '@/lib/api';
import { Upload, Search, X, Loader2, Play, ScanSearch, Zap, ChevronRight, Info, Crop } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '@/components/Anime/Footer';
import ImageCropper from '@/components/AI/ImageCropper';

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
    const objectUrl = URL.createObjectURL(file);
    setRawImageSrc(objectUrl);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
    setIsCropping(false);
    setError(null);
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
                id: matchedId || (res.anilist as any).id,
                title: displayTitle,
                image: image,
                episode: res.episode,
                similarity: Math.round(res.similarity * 100),
                videoPreview: res.video,
                targetUrl: targetUrl,
                timeStr: formatTime(res.from)
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
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-4 px-4 relative overflow-hidden font-poppins selection:bg-orange-500/30 flex flex-col justify-between">
        {/* Dynamic Background Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-red-900/5 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
        
        <div className="max-w-7xl mx-auto w-full relative z-10 flex-1 flex flex-col justify-start">
            
            {/* Split layout: Fixed/Sticky left, scrollable right on Desktop */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start w-full relative mb-12">
                
                {/* Left Side (Sticky upload box, title & instructions) */}
                <div className="w-full lg:w-[42%] lg:sticky lg:top-24 flex flex-col gap-6">
                    <div className="lg:h-14 flex items-center gap-3 mb-6">
                        <span className="p-2 rounded-xl bg-orange-600/15 border border-orange-500/20 text-orange-500 inline-block shadow-[0_0_15px_rgba(234,88,12,0.15)]">
                            <ScanSearch size={22} strokeWidth={1.5} />
                        </span>
                        <h1 className="text-3xl lg:text-4xl font-black font-gradvis tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-orange-100 to-zinc-400">
                            Visual Scanner
                        </h1>
                    </div>

                    {isCropping && rawImageSrc ? (
                        <ImageCropper 
                            imageSrc={rawImageSrc}
                            onCropComplete={handleCropComplete}
                            onCancel={() => setIsCropping(false)}
                        />
                    ) : (
                        <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-5 shadow-2xl backdrop-blur-xl relative group overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                            
                            <div className="flex flex-col gap-4 relative z-10">
                                {!previewUrl ? (
                                    <div 
                                        className={`w-full aspect-video border-2 border-dashed rounded-[1.5rem] flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer 
                                        ${dragActive ? 'border-orange-500 bg-orange-500/10 scale-[1.02]' : 'border-white/10 hover:border-orange-500/50 hover:bg-white/[0.03]'}`}
                                        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
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
                                                <Crop size={14} /> Recrop
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
                                    className={`w-full py-4.5 rounded-[1.5rem] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-300 text-sm
                                        ${!previewUrl || loading ? 'bg-white/5 text-zinc-600 cursor-not-allowed border border-white/5' : 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-[0_10px_30px_rgba(234,88,12,0.3)] hover:shadow-[0_15px_40px_rgba(234,88,12,0.5)] hover:-translate-y-0.5'}`}
                                >
                                    {loading ? (
                                        <><Loader2 className="animate-spin" size={18} /> Processing Data...</>
                                    ) : (
                                        <><Zap size={18} /> Execute Scan</>
                                    )}
                                </button>
                                
                                {error && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-500/10 border border-red-500/20 backdrop-blur-md text-red-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                                        <Info size={14} /> {error}
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    )}

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
                    {/* Result section title */}
                    <div className="lg:h-14 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h1 className="text-3xl lg:text-4xl font-black font-gradvis tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-orange-100 to-zinc-400">
                            Scan Matches
                        </h1>
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 lg:mt-2">
                            Neural Visual Analysis
                        </span>
                    </div>

                    <div className="w-full lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto pr-0 lg:pr-2 custom-scrollbar">
                        <div className="bg-white/[0.01] border border-white/5 rounded-[2rem] p-5 md:p-6 min-h-[400px] flex flex-col w-full">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                            <span className="text-zinc-400 text-xs font-semibold uppercase tracking-widest flex items-center gap-2">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500"></span>
                                </span>
                                Results
                            </span>
                            <span className="text-zinc-500 text-xs font-medium">{results.length} matched</span>
                        </div>
                        
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

                        <div className="flex flex-col gap-4">
                            <AnimatePresence>
                                {results.map((res, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.08, type: "spring", stiffness: 100 }}
                                        className="flex flex-col sm:flex-row gap-4 p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-orange-500/30 hover:bg-white/[0.04] transition-all duration-300 group"
                                    >
                                        <div className="w-full sm:w-28 h-40 sm:h-auto sm:aspect-[3/4] shrink-0 rounded-xl overflow-hidden relative shadow-lg">
                                            <img src={res.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="result" />
                                            <div className="absolute inset-0 border border-white/10 rounded-xl" />
                                            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-bold text-white border border-white/10">
                                                {res.similarity}% Match
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col justify-between flex-1 py-1">
                                            <div>
                                                <h4 className="font-bold font-gradvis text-lg text-white group-hover:text-orange-400 transition-colors line-clamp-2 leading-tight">{res.title}</h4>
                                                
                                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                                    {res.episode && (
                                                        <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                            Episode {res.episode}
                                                        </span>
                                                    )}
                                                    {res.timeStr && (
                                                        <span className="bg-white/5 text-zinc-300 border border-white/10 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                            Time: {res.timeStr}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="mt-4">
                                                {res.targetUrl ? (
                                                    <button onClick={() => router.push(res.targetUrl)} className="w-full sm:w-auto px-6 py-2.5 bg-white/5 hover:bg-orange-500 text-white font-bold uppercase tracking-[0.15em] text-[10px] rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 group-hover:shadow-[0_0_20px_rgba(234,88,12,0.2)]">
                                                        Play Episode <ChevronRight size={14} />
                                                    </button>
                                                ) : (
                                                    <div className="inline-flex px-4 py-2 bg-zinc-900/50 text-zinc-500 border border-zinc-800 font-bold uppercase tracking-widest text-[9px] rounded-lg">
                                                        Not in local archive
                                                    </div>
                                                )}
                                            </div>
                                        </div>
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
        <div className="w-full mt-auto relative z-10 border-t border-white/5 pt-6">
            <Footer />
        </div>
    </div>
  );
}
