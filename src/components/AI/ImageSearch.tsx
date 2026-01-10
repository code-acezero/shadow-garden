"use client";

import React, { useState, useRef } from 'react';
import { Upload, Search, Camera, X, Loader2, Eye, Download, Share2, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ConsumetAnime } from '@/lib/api'; // FIXED: Changed from Anime to ConsumetAnime
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImageSearchResult {
  anime: ConsumetAnime;
  similarity: number;
  character?: string;
  episode?: number;
  timestamp?: string;
}

interface WaifuResult {
  id: string;
  name: string;
  anime: string;
  image: string;
  tags: string[];
  rating: number;
}

export default function ImageSearch() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ImageSearchResult[]>([]);
  const [waifuResults, setWaifuResults] = useState<WaifuResult[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [waifuQuery, setWaifuQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState<ImageSearchResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { 
        toast.error('Magical energy overload: Image must be less than 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        handleImageSearch(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageSearch = async (imageData: string) => {
    setIsSearching(true);
    
    try {
      // Simulate Shadow Garden AI Analysis
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Updated Mock Data to match ConsumetAnime interface
      const mockResults: ImageSearchResult[] = [
        {
          anime: {
            id: 'attack-on-titan-16498',
            title: 'Attack on Titan',
            url: 'https://hianime.to/attack-on-titan-112',
            image: 'https://cdn.noitatnemucod.net/thumbnail/300x400/100/a1c21d8b67b4a99bc693f26bf8fcd2e5.jpg',
            type: 'TV',
            episodes: 25,
            description: 'Humanity fights for survival against giant humanoid Titans.',
            releaseDate: '2013'
          },
          similarity: 0.98,
          character: 'Eren Yeager',
          episode: 1,
          timestamp: '12:34'
        },
        {
          anime: {
            id: 'hunter-x-hunter-2011-11061',
            title: 'Hunter x Hunter (2011)',
            url: 'https://hianime.to/hunter-x-hunter-2',
            image: 'https://cdn.noitatnemucod.net/thumbnail/300x400/100/5880fc8fe1e9b910aeda7ce7f42d9ffe.jpg',
            type: 'TV',
            episodes: 148,
            description: 'A young boy searches for his father who is a legendary Hunter.',
            releaseDate: '2011'
          },
          similarity: 0.85,
          character: 'Gon Freecss',
          episode: 5,
          timestamp: '08:15'
        }
      ];

      setSearchResults(mockResults);
      toast.success(`Portal Stabilized: Found ${mockResults.length} matches!`);
    } catch (error) {
      toast.error('The magical connection was severed.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleWaifuSearch = async () => {
    if (!waifuQuery.trim()) {
      toast.error('Enter a name to summon');
      return;
    }

    setIsSearching(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockWaifus: WaifuResult[] = [
        {
          id: '1',
          name: 'Mikasa Ackerman',
          anime: 'Attack on Titan',
          image: 'https://cdn.noitatnemucod.net/thumbnail/300x400/100/a1c21d8b67b4a99bc693f26bf8fcd2e5.jpg',
          tags: ['strong', 'loyal', 'fighter'],
          rating: 9.2
        },
        {
          id: '2',
          name: 'Zero Two',
          anime: 'Darling in the FranXX',
          image: 'https://cdn.noitatnemucod.net/thumbnail/300x400/100/a26294497c6afa9b885636b373d611f9.jpg',
          tags: ['pink hair', 'horns', 'pilot'],
          rating: 8.9
        }
      ];

      setWaifuResults(mockWaifus);
      toast.success(`Summoned ${mockWaifus.length} entities!`);
    } catch (error) {
      toast.error('Summoning failed.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        handleImageSearch(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-white font-[Cinzel] tracking-tighter">
            SHADOW <span className="text-red-600">VISION</span>
          </h1>
          <p className="text-zinc-500 text-sm uppercase tracking-[0.2em]">AI-Powered Anime Identification</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/40 border border-white/5 p-1 h-12 rounded-full">
            <TabsTrigger value="upload" className="rounded-full data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all text-xs font-bold uppercase tracking-widest">
              Image Trace
            </TabsTrigger>
            <TabsTrigger value="waifu" className="rounded-full data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all text-xs font-bold uppercase tracking-widest">
              Entity Search
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-full data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all text-xs font-bold uppercase tracking-widest">
              Archives
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6 mt-6 outline-none">
            {/* Upload Area */}
            <Card className="bg-[#0a0a0a] border-white/5 shadow-2xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-10 relative z-10">
                <div
                  className={cn(
                    "border-2 border-dashed border-zinc-800 rounded-2xl p-12 text-center transition-all cursor-pointer",
                    uploadedImage ? "border-red-600/50" : "hover:border-red-600 hover:bg-white/5"
                  )}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => !isSearching && fileInputRef.current?.click()}
                >
                  {uploadedImage ? (
                    <div className="space-y-6">
                      <div className="relative inline-block group/img">
                        <img
                          src={uploadedImage}
                          alt="Target"
                          className="max-w-sm max-h-72 object-contain rounded-xl shadow-2xl border border-white/10"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedImage(null);
                            setSearchResults([]);
                          }}
                          className="absolute -top-3 -right-3 bg-red-600 p-2 rounded-full text-white shadow-xl hover:bg-red-700 transition-transform hover:scale-110"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {isSearching && (
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-red-500 font-[Cinzel] animate-pulse tracking-widest">ANALYZING SOUL...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex justify-center">
                        <div className="w-20 h-20 bg-red-600/10 border border-red-600/20 rounded-full flex items-center justify-center animate-pulse">
                          <Upload className="w-10 h-10 text-red-600" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-white font-[Cinzel]">Unveil the Origin</h3>
                        <p className="text-zinc-500 text-sm max-w-xs mx-auto">
                          Drop an image or use your camera to identify any anime scene across the dimensions.
                        </p>
                      </div>
                      <div className="flex justify-center gap-4">
                        <Button className="bg-red-600 hover:bg-red-700 rounded-full px-8">
                          <Upload className="w-4 h-4 mr-2" /> Upload
                        </Button>
                        <Button variant="outline" className="rounded-full px-8 border-zinc-800 hover:bg-white/5" onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}>
                          <Camera className="w-4 h-4 mr-2" /> Camera
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
              </CardContent>
            </Card>

            {/* Results Grid */}
            {searchResults.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pt-10">
                <h2 className="text-xl font-bold text-white flex items-center gap-3 font-[Cinzel]">
                  <Sparkles className="text-red-600 w-5 h-5" /> RECOGNIZED ENTITIES
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {searchResults.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-[#0a0a0a] border-white/5 hover:border-red-600/30 transition-all group overflow-hidden shadow-xl">
                        <CardContent className="p-0 flex flex-col sm:flex-row">
                          <div className="relative w-full sm:w-48 h-64 flex-shrink-0">
                            <img
                              src={result.anime.image}
                              alt={result.anime.title}
                              className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500"
                            />
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-black/80 backdrop-blur-md border border-white/10 text-[10px] py-0 h-5 px-2">
                                {Math.round(result.similarity * 100)}% Match
                              </Badge>
                            </div>
                          </div>

                          <div className="p-6 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight mb-2">
                                {result.anime.title}
                              </h3>
                              <div className="space-y-1.5 mb-4">
                                {result.character && (
                                  <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                                    <span className="text-red-500 font-bold uppercase">Character:</span> {result.character}
                                  </div>
                                )}
                                {result.episode && (
                                  <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                                    <span className="text-red-500 font-bold uppercase">Scene:</span> Ep {result.episode} @ {result.timestamp}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" className="bg-white/5 hover:bg-red-600 text-white flex-1 rounded-full text-[10px] font-bold uppercase tracking-tighter" onClick={() => setSelectedResult(result)}>
                                    <Eye className="w-3 h-3 mr-1.5" /> Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-[#050505] border-white/5 text-white max-w-2xl rounded-2xl overflow-hidden p-0">
                                  <div className="relative h-64">
                                    <img src={selectedResult?.anime.image} className="w-full h-full object-cover opacity-50" alt="" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent" />
                                    <div className="absolute bottom-6 left-6 right-6">
                                      <h2 className="text-3xl font-black font-[Cinzel]">{selectedResult?.anime.title}</h2>
                                    </div>
                                  </div>
                                  <div className="p-8 pt-0 space-y-4">
                                    <p className="text-zinc-400 text-sm leading-relaxed">{selectedResult?.anime.description}</p>
                                    <div className="flex flex-wrap gap-4 py-4 border-y border-white/5">
                                      <div className="flex flex-col">
                                        <span className="text-[10px] text-red-500 font-bold">TYPE</span>
                                        <span className="text-sm font-bold">{selectedResult?.anime.type}</span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[10px] text-red-500 font-bold">YEAR</span>
                                        <span className="text-sm font-bold">{selectedResult?.anime.releaseDate}</span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[10px] text-red-500 font-bold">EPISODES</span>
                                        <span className="text-sm font-bold">{selectedResult?.anime.episodes}</span>
                                      </div>
                                    </div>
                                    <Button className="w-full bg-red-600 hover:bg-red-700 font-bold" onClick={() => router.push(`/watch/${selectedResult?.anime.id}`)}>
                                      WATCH NOW
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button variant="outline" size="sm" className="border-white/5 text-white rounded-full bg-white/5 hover:bg-white/10 px-3">
                                <Share2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="waifu" className="space-y-6 mt-6">
            <Card className="bg-[#0a0a0a] border-white/5 p-6 rounded-3xl">
              <CardContent className="p-0 space-y-6">
                <div className="flex gap-3 bg-white/5 p-1.5 rounded-full border border-white/5">
                  <Input
                    placeholder="Enter entity name or traits..."
                    value={waifuQuery}
                    onChange={(e) => setWaifuQuery(e.target.value)}
                    className="bg-transparent border-none text-white focus-visible:ring-0 px-6 h-12"
                    onKeyPress={(e) => e.key === 'Enter' && handleWaifuSearch()}
                  />
                  <Button onClick={handleWaifuSearch} className="bg-red-600 hover:bg-red-700 rounded-full h-12 w-12 p-0" disabled={isSearching}>
                    {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 justify-center">
                  {['Tsundere', 'Yandere', 'Magical Girl', 'Strong', 'Kuudere'].map((tag) => (
                    <button key={tag} onClick={() => { setWaifuQuery(tag); handleWaifuSearch(); }} className="px-4 py-1.5 rounded-full bg-white/5 text-zinc-500 text-[10px] font-bold uppercase hover:text-white hover:bg-red-600/20 border border-white/5 transition-all">
                      {tag}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Waifu Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {waifuResults.map((waifu) => (
                <motion.div key={waifu.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="group relative aspect-[3/4] rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
                    <img src={waifu.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={waifu.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex items-center gap-1 text-yellow-500 mb-1">
                        <Star size={10} fill="currentColor" /> <span className="text-[10px] font-bold">{waifu.rating}</span>
                      </div>
                      <h4 className="text-white font-bold leading-tight font-[Cinzel]">{waifu.name}</h4>
                      <p className="text-zinc-500 text-[10px] uppercase tracking-tighter mb-4">{waifu.anime}</p>
                      <Button size="sm" className="w-full rounded-full bg-white/10 hover:bg-red-600 text-[10px] font-bold h-8">VIEW SOUL</Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="text-center py-32">
            <div className="max-w-xs mx-auto space-y-4 opacity-20 grayscale">
               <div className="flex justify-center"><Search size={48} className="text-zinc-500" /></div>
               <h3 className="text-xl font-bold font-[Cinzel]">Archives Empty</h3>
               <p className="text-xs text-zinc-500 uppercase tracking-widest leading-loose">No previous traces found in the Shadow archives.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}