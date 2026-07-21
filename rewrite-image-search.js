const fs = require('fs');
const pagePath = 'src/app/ai/imagesearch/page.tsx';

const newPageContent = \"use client";

import React, { useState, useRef } from 'react';
import { MoeAPI } from '@/lib/moeApi';
import { AnimeService } from '@/lib/api';
import { Upload, Search, X, Loader2, Play, ScanSearch, Sparkles, ChevronRight, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return \\\\\\:\\\\\\;
};

export default function ImageSearchPage() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResults([]);
    setError(null);
  };

  const doSearch = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    try {
        const moeRes = await MoeAPI.searchByImage(selectedFile, { anilistInfo: true });
        if (moeRes.error) throw new Error(moeRes.error);
        if (!moeRes.result || moeRes.result.length === 0) throw new Error("No matches found.");

        const uniqueResults = moeRes.result.filter((r, idx, arr) => 
            arr.findIndex(x => (x.anilist as any)?.id === (r.anilist as any)?.id) === idx
        ).slice(0, 5);

        const mappedResults = await Promise.all(uniqueResults.map(async (res) => {
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
                    targetUrl = \\\/watch/\\\\\\;
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
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 px-4 relative overflow-hidden font-poppins selection:bg-orange-500/30">
        {/* Dynamic Background Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
        
        <div className="max-w-6xl mx-auto relative z-10">
            
            {/* Header Area */}
            <div className="text-center mb-16 relative">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="inline-flex items-center justify-center p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_0_40px_rgba(234,88,12,0.15)] mb-8"
                >
                    <ScanSearch size={48} className="text-orange-500" strokeWidth={1.5} />
                </motion.div>
                
                <motion.h1 
                    initial={{ y: 20, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }}
                    className="text-5xl md:text-7xl font-black font-gradvis tracking-wider mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-orange-100 to-zinc-400"
                >
                    Visual Scanner
                </motion.h1>
                <motion.p 
                    initial={{ y: 20, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }} 
                    transition={{ delay: 0.1 }}
                    className="text-zinc-400 max-w-2xl mx-auto text-lg md:text-xl font-light"
                >
                    Upload a screenshot from any anime. Our neural systems will identify the source material, exact episode, and timestamp instantly.
                </motion.p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Upload Section */}
                <motion.div 
                    initial={{ x: -30, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }}
                    className="lg:col-span-5 bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl backdrop-blur-xl relative group overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    
                    <div className="flex flex-col gap-6 relative z-10">
                        {!previewUrl ? (
                            <div 
                                className={\w-full aspect-square md:aspect-[4/3] border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-6 transition-all duration-300 cursor-pointer 
                                \\}
                                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleChange} />
                                <div className={\w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl
                                    \\}>
                                    <Upload size={40} strokeWidth={1.5} />
                                </div>
                                <div className="text-center px-6">
                                    <p className="text-xl font-bold font-above tracking-widest text-white mb-3">Initialize Upload</p>
                                    <p className="text-sm text-zinc-500 font-medium">Drag & drop or click to browse</p>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full aspect-square md:aspect-[4/3] relative rounded-[2rem] overflow-hidden border border-white/10 bg-black group/preview">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover/preview:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end pb-8">
                                    <button onClick={() => { setPreviewUrl(null); setSelectedFile(null); setResults([]); }} className="px-6 py-3 bg-red-500/90 hover:bg-red-500 backdrop-blur-md text-white font-bold rounded-2xl uppercase tracking-widest text-sm flex items-center gap-2 transition-all hover:scale-105 shadow-xl shadow-red-500/20">
                                        <X size={18} /> Clear Source
                                    </button>
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={doSearch}
                            disabled={!previewUrl || loading}
                            className={\w-full py-6 rounded-[2rem] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-300 text-lg
                                \\}
                        >
                            {loading ? (
                                <><Loader2 className="animate-spin" size={24} /> Processing Data...</>
                            ) : (
                                <><Sparkles size={24} /> Execute Scan</>
                            )}
                        </button>
                        
                        {error && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/20 backdrop-blur-md text-red-400 rounded-2xl text-sm font-bold flex items-center justify-center gap-2">
                                <Info size={16} /> {error}
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* Results Section */}
                <motion.div 
                    initial={{ x: 30, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }}
                    className="lg:col-span-7 bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-6 md:p-8 min-h-[500px] flex flex-col"
                >
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                        <h3 className="text-lg font-black uppercase tracking-[0.2em] text-white flex items-center gap-3 font-lemonmilk">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                            </span>
                            Match Database
                        </h3>
                        <span className="text-zinc-500 text-sm font-medium">{results.length} results</span>
                    </div>
                    
                    {!results.length && !loading && (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 gap-6">
                            <div className="w-32 h-32 rounded-full border border-white/5 flex items-center justify-center bg-white/[0.01]">
                                <Search size={48} className="opacity-20" />
                            </div>
                            <p className="text-sm uppercase font-bold tracking-widest">Awaiting visual input</p>
                        </div>
                    )}

                    {loading && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-6">
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-t-2 border-orange-500 animate-spin" />
                                <div className="absolute inset-2 rounded-full border-b-2 border-orange-500/50 animate-spin-reverse" />
                                <ScanSearch size={32} className="text-orange-500 animate-pulse" />
                            </div>
                            <p className="text-sm uppercase font-bold tracking-[0.2em] text-orange-500/70 animate-pulse">Running Neural Network...</p>
                        </div>
                    )}

                    <div className="flex flex-col gap-5">
                        <AnimatePresence>
                            {results.map((res, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1, type: "spring" }}
                                    className="flex flex-col sm:flex-row gap-5 p-4 bg-white/[0.02] rounded-3xl border border-white/5 hover:border-orange-500/30 hover:bg-white/[0.04] transition-all duration-300 group"
                                >
                                    <div className="w-full sm:w-32 h-48 sm:h-auto sm:aspect-[3/4] shrink-0 rounded-2xl overflow-hidden relative shadow-lg">
                                        <img src={res.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="result" />
                                        <div className="absolute inset-0 border border-white/10 rounded-2xl" />
                                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-white border border-white/10">
                                            {res.similarity}% Match
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col justify-between flex-1 py-2">
                                        <div>
                                            <h4 className="font-bold font-gradvis text-xl text-white group-hover:text-orange-400 transition-colors line-clamp-2 leading-tight">{res.title}</h4>
                                            
                                            <div className="flex flex-wrap items-center gap-2 mt-4">
                                                {res.episode && (
                                                    <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider">
                                                        Episode {res.episode}
                                                    </span>
                                                )}
                                                {res.timeStr && (
                                                    <span className="bg-white/5 text-zinc-300 border border-white/10 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider">
                                                        Time: {res.timeStr}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="mt-6">
                                            {res.targetUrl ? (
                                                <button onClick={() => router.push(res.targetUrl)} className="w-full sm:w-auto px-8 py-3.5 bg-white/5 hover:bg-orange-500 text-white font-bold uppercase tracking-[0.15em] text-xs rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(234,88,12,0.2)]">
                                                    Play Episode <ChevronRight size={16} />
                                                </button>
                                            ) : (
                                                <div className="inline-flex px-6 py-3 bg-zinc-900/50 text-zinc-500 border border-zinc-800 font-bold uppercase tracking-widest text-xs rounded-xl">
                                                    Not found in local archive
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </motion.div>

            </div>
        </div>
    </div>
  );
}
\;

fs.writeFileSync(pagePath, newPageContent);
console.log("Image search page replaced successfully!");
