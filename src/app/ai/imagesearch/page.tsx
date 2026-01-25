"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, ScanLine, Loader2, ArrowRight, AlertTriangle, Info, PlayCircle, Clock, FileWarning, Quote, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import localFont from 'next/font/local';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnimeAPI_V2 } from '@/lib/api';
import Footer from '@/components/Anime/Footer';

// --- FONTS ---
const demoness = localFont({ 
  src: '../../../../public/fonts/Demoness-1GlYj.ttf', 
  variable: '--font-demoness',
  display: 'swap' 
});

const hunters = localFont({ 
  src: '../../../../public/fonts/HuntersKpop.ttf', 
  variable: '--font-hunters',
  display: 'swap' 
});

// --- TYPES ---
interface ScanResult {
  filename: string;
  episode: number | string;
  similarity: number;
  video: string;
  image: string;
  from: number;
  to: number;
  anilist: {
    id: number;
    title: { native: string; romaji: string; english: string };
    isAdult: boolean;
  };
}

export default function ImageSearchPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState<{ used: number, total: number } | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // --- HANDLERS ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const processFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setSelectedImage(url);
    setScanResult(null);
    setError(null);
    setShowInfo(false);
    startScan(file);
  };

  const startScan = async (file: File) => {
    setIsScanning(true);
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('shadow-whisper', {
            detail: { id: Date.now(), title: "System", message: "Analyzing visual data...", type: "info" }
        }));
    }

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("https://api.trace.moe/search?cutBorders&anilistInfo", {
        method: "POST",
        body: formData,
      });

      const remaining = response.headers.get("x-ratelimit-remaining");
      const limit = response.headers.get("x-ratelimit-limit");
      if (limit && remaining) {
          setQuota({ used: parseInt(limit) - parseInt(remaining), total: parseInt(limit) });
      }

      if (!response.ok) throw new Error("Search failed. Server overload or invalid image.");

      const data = await response.json();
      
      if (data.result && data.result.length > 0) {
        const topMatch = data.result[0];
        setScanResult(topMatch);
        
        window.dispatchEvent(new CustomEvent('shadow-whisper', {
            detail: { id: Date.now(), title: "Match Found", message: `Confidence: ${(topMatch.similarity * 100).toFixed(1)}%`, type: "success" }
        }));
      } else {
        setError("No matches found in the archives.");
      }
    } catch (err) {
      setError("Visual scan failed. Please try again.");
      window.dispatchEvent(new CustomEvent('shadow-whisper', {
          detail: { id: Date.now(), title: "Error", message: "Scan failed.", type: "error" }
      }));
    } finally {
      setIsScanning(false);
    }
  };

  const handleWatchNow = async () => {
      if (!scanResult) return;
      setIsRedirecting(true);

      const targetTitle = scanResult.anilist.title.english || scanResult.anilist.title.romaji;
      const targetId = scanResult.anilist.id; 

      try {
          const searchData: any = await AnimeAPI_V2.search(targetTitle);
          let foundAnime = null;

          if (searchData?.results) {
              foundAnime = searchData.results.find((anime: any) => {
                  if (anime.anilistId === targetId || anime.id === targetId.toString()) return true;
                  const apiTitle = (anime.title?.english || anime.title?.userPreferred || anime.title || "").toLowerCase();
                  return apiTitle === targetTitle.toLowerCase();
              });

              if (!foundAnime && searchData.results.length > 0) {
                  foundAnime = searchData.results[0];
              }
          }

          if (foundAnime) {
              const epParam = scanResult.episode ? `?episode=${scanResult.episode}` : '';
              const timeParam = scanResult.from ? `&timestamp=${Math.floor(scanResult.from)}` : '';
              router.push(`/watch/${foundAnime.id}${epParam}${timeParam}`);
          } else {
              window.dispatchEvent(new CustomEvent('shadow-whisper', {
                  detail: { id: Date.now(), title: "Media Missing", message: "This anime is not available in our library.", type: "error" }
              }));
          }

      } catch (e) {
          window.dispatchEvent(new CustomEvent('shadow-whisper', {
              detail: { id: Date.now(), title: "System Error", message: "Failed to locate media source.", type: "error" }
          }));
      } finally {
          setIsRedirecting(false);
      }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setScanResult(null);
    setError(null);
    setIsScanning(false);
  };

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden font-sans">
      
      <div className="fixed inset-0 bg-[url('/grid-pattern.png')] opacity-5 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* --- CONTENT WRAPPER --- */}
      <div className="flex-1 flex flex-col items-center justify-center pt-24 pb-20 px-4 z-10">
        
        {/* HEADER */}
        <div className="text-center mb-8 relative">
            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-3 mb-3"
            >
                <ScanLine className="text-red-500 animate-pulse w-5 h-5" />
                <span className={`text-red-500 text-sm tracking-[0.2em] font-bold ${hunters.className}`}>FIND THE SCENE</span>
                <ScanLine className="text-red-500 animate-pulse w-5 h-5" />
            </motion.div>
            
            <motion.h1 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                className={`text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 ${demoness.className} tracking-wider`}
            >
                VISUAL <span className="text-red-600">ARCHIVE</span>
            </motion.h1>
            
            {quota && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-zinc-400">
                    <span className={quota.used >= quota.total ? "text-red-500" : "text-green-500"}>●</span>
                    SEARCHES REMAINING: <span className="text-white font-mono">{quota.total - quota.used}</span>
                </motion.div>
            )}
        </div>

        {/* --- IMAGE BOX --- */}
        <motion.div layout className="w-full max-w-2xl relative">
            <AnimatePresence mode="wait">
                
                {/* Upload Zone */}
                {!selectedImage && (
                    <motion.div
                        key="upload"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            "group relative h-64 md:h-80 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden backdrop-blur-sm",
                            isDragging ? "border-red-500 bg-red-500/5 scale-[1.02]" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                        )}
                    >
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                        <div className="p-4 rounded-full bg-black/40 border border-white/10 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-2xl relative">
                            <Upload size={32} className="text-zinc-400 group-hover:text-red-500 transition-colors" />
                            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2 font-sans">Drop Image or Click</h3>
                        <p className="text-zinc-500 text-xs">Supports JPG, PNG, WEBP</p>
                        <div className="absolute top-0 left-0 w-12 h-12 md:w-16 md:h-16 border-t-2 border-l-2 border-white/10 rounded-tl-[2rem] pointer-events-none transition-colors group-hover:border-red-500/30" />
                        <div className="absolute bottom-0 right-0 w-12 h-12 md:w-16 md:h-16 border-b-2 border-r-2 border-white/10 rounded-br-[2rem] pointer-events-none transition-colors group-hover:border-red-500/30" />
                    </motion.div>
                )}

                {/* Preview/Result Zone */}
                {selectedImage && (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="relative rounded-[2rem] overflow-hidden border border-white/10 bg-black/40 shadow-2xl"
                    >
                        <img src={selectedImage} alt="Preview" className="w-full h-auto max-h-[50vh] md:max-h-[60vh] object-contain bg-black/50" />

                        {isScanning && (
                            <div className="absolute inset-0 pointer-events-none z-20">
                                <motion.div 
                                    initial={{ top: "0%" }} animate={{ top: "100%" }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_20px_2px_rgba(220,38,38,0.8)]"
                                />
                                <div className="absolute inset-0 bg-red-500/5" />
                                <div className="absolute bottom-6 left-6 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                                    <Loader2 className="animate-spin text-red-500 w-4 h-4" />
                                    <span className={`text-red-500 text-sm tracking-widest ${hunters.className}`}>ANALYZING...</span>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">Scan Failed</h3>
                                <p className="text-zinc-400 text-sm mb-6 max-w-xs">{error}</p>
                                <Button onClick={clearImage} variant="outline" className="border-white/10 hover:bg-white/10 text-white">Try Again</Button>
                            </div>
                        )}

                        {!isScanning && scanResult && (
                            <div className="absolute bottom-0 left-0 right-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/10 z-30">
                                <div className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-lg md:text-2xl font-black text-white mb-1 truncate leading-tight">
                                            {scanResult.anilist.title.english || scanResult.anilist.title.romaji}
                                        </h2>
                                        <div className="flex items-center gap-3 text-xs sm:text-sm font-mono mt-2">
                                            {/* Capsule EP Badge */}
                                            <span className="bg-red-600 px-3 py-1 rounded-full text-white font-bold text-xs shadow-lg shadow-red-600/20">
                                                EP {scanResult.episode}
                                            </span>
                                            
                                            <span className="text-zinc-400">Match: <span className="text-green-400 font-bold">{(scanResult.similarity * 100).toFixed(1)}%</span></span>
                                            
                                            <button 
                                                onClick={() => setShowInfo(!showInfo)} 
                                                className={cn("p-1.5 rounded-full transition-colors", showInfo ? "bg-white text-black" : "bg-white/10 text-zinc-400 hover:text-white")}
                                            >
                                                <Info size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={handleWatchNow} disabled={isRedirecting}
                                        className="w-full md:w-auto bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white rounded-full px-6 shadow-[0_0_15px_rgba(220,38,38,0.4)] shrink-0 h-10 md:h-12 text-sm font-bold tracking-wide"
                                    >
                                        {isRedirecting ? <Loader2 className="animate-spin" /> : <>Watch Now <PlayCircle size={16} className="ml-2 fill-white/20"/></>}
                                    </Button>
                                </div>

                                <AnimatePresence>
                                    {showInfo && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-white/5 bg-black/40 overflow-hidden"
                                        >
                                            <div className="p-4 grid grid-cols-2 gap-y-4 gap-x-8 text-xs text-zinc-400">
                                                <div>
                                                    <span className="block text-zinc-600 uppercase font-bold text-[10px] mb-1 flex items-center gap-1"><Quote size={10}/> Native Title</span>
                                                    <span className="text-white font-medium">{scanResult.anilist.title.native}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-zinc-600 uppercase font-bold text-[10px] mb-1 flex items-center gap-1"><Quote size={10}/> Romaji</span>
                                                    <span className="text-white font-medium">{scanResult.anilist.title.romaji}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-zinc-600 uppercase font-bold text-[10px] mb-1 flex items-center gap-1"><Clock size={10}/> Timestamp</span>
                                                    <span className="text-white font-mono">{formatTime(scanResult.from)} - {formatTime(scanResult.to)}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-zinc-600 uppercase font-bold text-[10px] mb-1 flex items-center gap-1"><FileWarning size={10}/> Content</span>
                                                    <span className={scanResult.anilist.isAdult ? "text-red-500 font-bold" : "text-green-500"}>
                                                        {scanResult.anilist.isAdult ? "18+ (NSFW)" : "Safe"}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        <button onClick={clearImage} className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-red-600 hover:text-white transition-colors border border-white/10 z-50">
                            <X size={20} />
                        </button>
                    </motion.div>
                )}

            </AnimatePresence>

            {/* ✅ SYSTEM HINTS & SUGGESTIONS */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="mt-8 grid grid-cols-2 gap-4"
            >
                <div className="col-span-2 md:col-span-1 bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm">
                    <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={18} />
                    <div>
                        <h4 className={`text-white text-xs font-bold tracking-widest mb-1 ${hunters.className}`}>BEST RESULTS</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed">Use full, uncropped screenshots. Black borders are automatically trimmed by the system.</p>
                    </div>
                </div>
                <div className="col-span-2 md:col-span-1 bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm">
                    <XCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                    <div>
                        <h4 className={`text-white text-xs font-bold tracking-widest mb-1 ${hunters.className}`}>AVOID THIS</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed">Do not use mirrored, filtered, or heavily cropped images. Fan-art matches are unlikely.</p>
                    </div>
                </div>
                <div className="col-span-2 bg-red-600/5 border border-red-500/10 rounded-xl p-3 flex items-center justify-center gap-2 text-center">
                    <HelpCircle className="text-red-500" size={14} />
                    <p className="text-red-400/80 text-[10px] font-mono uppercase">System powered by trace.moe • Indexing 30,000+ hours of anime</p>
                </div>
            </motion.div>

        </motion.div>
      </div>

      {/* --- FOOTER (Added Extra Space) --- */}
      <div className="relative z-10 pb-20">
        <Footer />
      </div>

    </div>
  );
}