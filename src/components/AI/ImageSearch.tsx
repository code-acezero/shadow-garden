import React, { useState, useRef } from 'react';
import { Upload, Search, Camera, X, Loader2, Eye, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Anime } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ImageSearchResult {
  anime: Anime;
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
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Image size must be less than 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        handleImageSearch(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageSearch = async (imageData: string) => {
    setIsSearching(true);
    
    try {
      // Simulate AI image search API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock results for demonstration
      const mockResults: ImageSearchResult[] = [
        {
          anime: {
            mal_id: 16498,
            title: 'Attack on Titan',
            title_english: 'Attack on Titan',
            images: {
              jpg: {
                image_url: '/api/placeholder/300/400',
                large_image_url: '/api/placeholder/600/800'
              }
            },
            score: 9.0,
            episodes: 25,
            status: 'Finished Airing',
            aired: { from: '2013-04-07' },
            genres: [{ name: 'Action' }, { name: 'Drama' }],
            synopsis: 'Humanity fights for survival against giant humanoid Titans.',
            year: 2013,
            studios: [{ name: 'Wit Studio' }]
          },
          similarity: 0.95,
          character: 'Eren Yeager',
          episode: 1,
          timestamp: '12:34'
        },
        {
          anime: {
            mal_id: 11061,
            title: 'Hunter x Hunter (2011)',
            title_english: 'Hunter x Hunter',
            images: {
              jpg: {
                image_url: '/api/placeholder/300/400',
                large_image_url: '/api/placeholder/600/800'
              }
            },
            score: 9.1,
            episodes: 148,
            status: 'Finished Airing',
            aired: { from: '2011-10-02' },
            genres: [{ name: 'Adventure' }, { name: 'Fantasy' }],
            synopsis: 'A young boy searches for his father who is a legendary Hunter.',
            year: 2011,
            studios: [{ name: 'Madhouse' }]
          },
          similarity: 0.87,
          character: 'Gon Freecss',
          episode: 5,
          timestamp: '08:15'
        }
      ];

      setSearchResults(mockResults);
      toast.success(`Found ${mockResults.length} similar anime!`);
    } catch (error) {
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleWaifuSearch = async () => {
    if (!waifuQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    
    try {
      // Simulate waifu search API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock waifu results
      const mockWaifus: WaifuResult[] = [
        {
          id: '1',
          name: 'Mikasa Ackerman',
          anime: 'Attack on Titan',
          image: '/api/placeholder/300/400',
          tags: ['strong', 'loyal', 'fighter', 'scarf'],
          rating: 9.2
        },
        {
          id: '2',
          name: 'Zero Two',
          anime: 'Darling in the FranXX',
          image: '/api/placeholder/300/400',
          tags: ['pink hair', 'horns', 'pilot', 'darling'],
          rating: 8.9
        },
        {
          id: '3',
          name: 'Rem',
          anime: 'Re:Zero',
          image: '/api/placeholder/300/400',
          tags: ['blue hair', 'maid', 'demon', 'loyal'],
          rating: 9.5
        }
      ];

      setWaifuResults(mockWaifus);
      toast.success(`Found ${mockWaifus.length} waifus!`);
    } catch (error) {
      toast.error('Search failed. Please try again.');
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

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">AI Image Search</h1>
          <p className="text-gray-400">Find anime by uploading images or search for waifus</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="upload" className="data-[state=active]:bg-red-600">
              Image Search
            </TabsTrigger>
            <TabsTrigger value="waifu" className="data-[state=active]:bg-red-600">
              Waifu Search
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-red-600">
              Search History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {/* Upload Area */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-6">
                <div
                  className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-red-500 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadedImage ? (
                    <div className="space-y-4">
                      <div className="relative inline-block">
                        <img
                          src={uploadedImage}
                          alt="Uploaded"
                          className="max-w-sm max-h-64 object-contain rounded-lg"
                        />
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedImage(null);
                            setSearchResults([]);
                          }}
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      {isSearching && (
                        <div className="flex items-center justify-center space-x-2 text-white">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Analyzing image with AI...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-center space-x-4">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                          <Upload className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Upload an anime screenshot
                        </h3>
                        <p className="text-gray-400 mb-4">
                          Drop an image here or click to browse. We'll find the anime for you!
                        </p>
                        <div className="flex justify-center space-x-4">
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Choose File
                          </Button>
                          <Button
                            onClick={() => cameraInputRef.current?.click()}
                            variant="outline"
                            className="border-gray-600 text-white hover:bg-gray-800"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Take Photo
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Search Results</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-gray-900/50 border-gray-700 hover:border-red-500 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div className="relative">
                              <img
                                src={result.anime.images.jpg.large_image_url}
                                alt={result.anime.title}
                                className="w-full h-48 object-cover rounded-lg"
                              />
                              <Badge className="absolute top-2 right-2 bg-green-600 text-white">
                                {Math.round(result.similarity * 100)}% match
                              </Badge>
                            </div>

                            <div>
                              <h3 className="text-white font-semibold mb-2">
                                {result.anime.title_english || result.anime.title}
                              </h3>
                              
                              {result.character && (
                                <p className="text-gray-400 text-sm mb-1">
                                  Character: {result.character}
                                </p>
                              )}
                              
                              {result.episode && (
                                <p className="text-gray-400 text-sm mb-1">
                                  Episode {result.episode} at {result.timestamp}
                                </p>
                              )}

                              <div className="flex items-center space-x-2 mb-2">
                                <Badge className="bg-yellow-600 text-white">
                                  ★ {result.anime.score}
                                </Badge>
                                <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                                  {result.anime.year}
                                </Badge>
                              </div>

                              <div className="flex space-x-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      className="bg-red-600 hover:bg-red-700 flex-1"
                                      onClick={() => setSelectedResult(result)}
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      View Details
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>{selectedResult?.anime.title}</DialogTitle>
                                    </DialogHeader>
                                    {selectedResult && (
                                      <div className="space-y-4">
                                        <img
                                          src={selectedResult.anime.images.jpg.large_image_url}
                                          alt={selectedResult.anime.title}
                                          className="w-full h-64 object-cover rounded-lg"
                                        />
                                        <p className="text-gray-300">{selectedResult.anime.synopsis}</p>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <span className="text-gray-400">Episodes:</span>
                                            <span className="text-white ml-2">{selectedResult.anime.episodes}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-400">Status:</span>
                                            <span className="text-white ml-2">{selectedResult.anime.status}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-400">Year:</span>
                                            <span className="text-white ml-2">{selectedResult.anime.year}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-400">Score:</span>
                                            <span className="text-white ml-2">{selectedResult.anime.score}</span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                                
                                <Button variant="outline" size="sm" className="border-gray-600">
                                  <Share2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="waifu" className="space-y-6">
            {/* Waifu Search */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Waifu Search</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search for waifus by name, anime, or characteristics..."
                    value={waifuQuery}
                    onChange={(e) => setWaifuQuery(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    onKeyPress={(e) => e.key === 'Enter' && handleWaifuSearch()}
                  />
                  <Button
                    onClick={handleWaifuSearch}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {['Popular', 'Tsundere', 'Kuudere', 'Yandere', 'Childhood Friend', 'Magical Girl'].map((tag) => (
                    <Button
                      key={tag}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setWaifuQuery(tag);
                        handleWaifuSearch();
                      }}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Waifu Results */}
            {waifuResults.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Waifu Results</h2>
                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {waifuResults.map((waifu) => (
                    <motion.div
                      key={waifu.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <Card className="bg-gray-900/50 border-gray-700 hover:border-red-500 transition-colors cursor-pointer group">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="relative overflow-hidden rounded-lg">
                              <img
                                src={waifu.image}
                                alt={waifu.name}
                                className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                              />
                              <Badge className="absolute top-2 right-2 bg-yellow-600 text-white">
                                ★ {waifu.rating}
                              </Badge>
                            </div>

                            <div>
                              <h3 className="text-white font-semibold">{waifu.name}</h3>
                              <p className="text-gray-400 text-sm">{waifu.anime}</p>
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {waifu.tags.slice(0, 3).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs bg-gray-700 text-gray-300"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex space-x-2">
                              <Button size="sm" className="bg-red-600 hover:bg-red-700 flex-1">
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                              <Button variant="outline" size="sm" className="border-gray-600">
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="text-center py-20">
            <h3 className="text-2xl font-bold text-white mb-4">Search History</h3>
            <p className="text-gray-400">Your recent image searches will appear here</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}