import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Image, Video, Smile, Send, Bookmark, Flag, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AppUser, Anime } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Post {
  id: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
    isFollowing?: boolean;
  };
  content: string;
  images?: string[];
  anime?: {
    id: number;
    title: string;
    image: string;
  };
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  tags: string[];
}

interface OtakuVerseProps {
  user: AppUser | null;
  onAuthRequired: () => void;
}

export default function OtakuVerse({ user, onAuthRequired }: OtakuVerseProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState('feed');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockPosts: Post[] = [
      {
        id: '1',
        user: {
          id: 'user1',
          username: 'AnimeOtaku2024',
          avatar: '',
          isFollowing: false
        },
        content: 'Just finished watching Attack on Titan final season! What an incredible journey. The animation quality was absolutely stunning! 🔥 #AttackOnTitan #Anime',
        images: ['/api/placeholder/600/400'],
        anime: {
          id: 16498,
          title: 'Attack on Titan',
          image: '/api/placeholder/150/200'
        },
        likes: 234,
        comments: 45,
        shares: 12,
        isLiked: false,
        isBookmarked: false,
        createdAt: '2024-01-15T10:30:00Z',
        tags: ['AttackOnTitan', 'Anime', 'Finale']
      },
      {
        id: '2',
        user: {
          id: 'user2',
          username: 'WaifuHunter',
          avatar: '',
          isFollowing: true
        },
        content: 'My top 10 anime waifus of 2024! What do you think of my list? Drop your favorites in the comments! 💕',
        images: ['/api/placeholder/600/800'],
        likes: 567,
        comments: 89,
        shares: 23,
        isLiked: true,
        isBookmarked: true,
        createdAt: '2024-01-14T15:45:00Z',
        tags: ['Waifu', 'Top10', 'Anime2024']
      },
      {
        id: '3',
        user: {
          id: 'user3',
          username: 'MangaReader99',
          avatar: '',
          isFollowing: false
        },
        content: 'Currently reading Chainsaw Man and I can\'t put it down! The art style is so unique and the story is absolutely wild. Anyone else reading it?',
        anime: {
          id: 44511,
          title: 'Chainsaw Man',
          image: '/api/placeholder/150/200'
        },
        likes: 123,
        comments: 34,
        shares: 8,
        isLiked: false,
        isBookmarked: false,
        createdAt: '2024-01-13T09:20:00Z',
        tags: ['ChainsawMan', 'Manga', 'Reading']
      }
    ];
    setPosts(mockPosts);
  }, []);

  const handleCreatePost = () => {
    if (!user) {
      onAuthRequired();
      return;
    }

    if (!newPost.trim()) {
      toast.error('Please write something before posting!');
      return;
    }

    const post: Post = {
      id: Date.now().toString(),
      user: {
        id: user.id,
        username: user.user_metadata.username,
        avatar: '',
        isFollowing: false
      },
      content: newPost,
      images: selectedImages.map(file => URL.createObjectURL(file)),
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      isBookmarked: false,
      createdAt: new Date().toISOString(),
      tags: extractTags(newPost)
    };

    setPosts([post, ...posts]);
    setNewPost('');
    setSelectedImages([]);
    setShowCreatePost(false);
    toast.success('Post created successfully!');
  };

  const extractTags = (content: string): string[] => {
    const tagRegex = /#(\w+)/g;
    const matches = content.match(tagRegex);
    return matches ? matches.map(tag => tag.slice(1)) : [];
  };

  const handleLike = (postId: string) => {
    if (!user) {
      onAuthRequired();
      return;
    }

    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };

  const handleBookmark = (postId: string) => {
    if (!user) {
      onAuthRequired();
      return;
    }

    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isBookmarked: !post.isBookmarked
        };
      }
      return post;
    }));

    const post = posts.find(p => p.id === postId);
    toast.success(post?.isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
  };

  const handleFollow = (userId: string) => {
    if (!user) {
      onAuthRequired();
      return;
    }

    setPosts(posts.map(post => {
      if (post.user.id === userId) {
        return {
          ...post,
          user: {
            ...post.user,
            isFollowing: !post.user.isFollowing
          }
        };
      }
      return post;
    }));

    const post = posts.find(p => p.user.id === userId);
    toast.success(post?.user.isFollowing ? 'Unfollowed user' : 'Following user');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + selectedImages.length > 4) {
      toast.error('Maximum 4 images allowed');
      return;
    }
    setSelectedImages([...selectedImages, ...files]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">OtakuVerse</h1>
          <p className="text-gray-400">Connect with fellow anime enthusiasts</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="feed" className="data-[state=active]:bg-red-600">
              Feed
            </TabsTrigger>
            <TabsTrigger value="trending" className="data-[state=active]:bg-red-600">
              Trending
            </TabsTrigger>
            <TabsTrigger value="following" className="data-[state=active]:bg-red-600">
              Following
            </TabsTrigger>
            <TabsTrigger value="discover" className="data-[state=active]:bg-red-600">
              Discover
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-6">
            {/* Create Post */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-red-600 text-white">
                      {user ? user.user_metadata.username.charAt(0).toUpperCase() : 'G'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700"
                        >
                          What's on your mind, otaku?
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Create Post</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-red-600 text-white">
                                {user ? user.user_metadata.username.charAt(0).toUpperCase() : 'G'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user?.user_metadata.username || 'Guest'}</p>
                              <p className="text-sm text-gray-400">Public post</p>
                            </div>
                          </div>

                          <Textarea
                            placeholder="Share your thoughts about anime, manga, or anything otaku-related..."
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            className="min-h-32 bg-gray-800 border-gray-600 text-white resize-none"
                          />

                          {/* Image Preview */}
                          {selectedImages.length > 0 && (
                            <div className="grid grid-cols-2 gap-2">
                              {selectedImages.map((image, index) => (
                                <div key={index} className="relative">
                                  <img
                                    src={URL.createObjectURL(image)}
                                    alt={`Upload ${index + 1}`}
                                    className="w-full h-32 object-cover rounded"
                                  />
                                  <Button
                                    onClick={() => removeImage(index)}
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2 w-6 h-6 p-0"
                                  >
                                    ×
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                <label htmlFor="image-upload" className="flex items-center cursor-pointer">
                                  <Image className="w-4 h-4 mr-1" />
                                  Photo
                                </label>
                                <input
                                  id="image-upload"
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={handleImageUpload}
                                  className="hidden"
                                />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                <Video className="w-4 h-4 mr-1" />
                                Video
                              </Button>
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                <Smile className="w-4 h-4 mr-1" />
                                Emoji
                              </Button>
                            </div>

                            <Button
                              onClick={handleCreatePost}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={!newPost.trim()}
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Post
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Posts Feed */}
            <div className="space-y-6">
              <AnimatePresence>
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="bg-gray-900/50 border-gray-700 hover:border-gray-600 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={post.user.avatar} />
                              <AvatarFallback className="bg-red-600 text-white">
                                {post.user.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-white">{post.user.username}</p>
                                {!post.user.isFollowing && post.user.id !== user?.id && (
                                  <Button
                                    onClick={() => handleFollow(post.user.id)}
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-xs border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                                  >
                                    <UserPlus className="w-3 h-3 mr-1" />
                                    Follow
                                  </Button>
                                )}
                              </div>
                              <p className="text-sm text-gray-400">{formatTimeAgo(post.createdAt)}</p>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-gray-800 border-gray-700">
                              <DropdownMenuItem className="text-gray-300 hover:bg-gray-700">
                                <Bookmark className="w-4 h-4 mr-2" />
                                Save Post
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-gray-300 hover:bg-gray-700">
                                <Flag className="w-4 h-4 mr-2" />
                                Report
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Post Content */}
                        <p className="text-white leading-relaxed">{post.content}</p>

                        {/* Tags */}
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {post.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="bg-red-600/20 text-red-400 hover:bg-red-600/30 cursor-pointer"
                              >
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Anime Reference */}
                        {post.anime && (
                          <Card className="bg-gray-800 border-gray-600">
                            <CardContent className="p-3">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={post.anime.image}
                                  alt={post.anime.title}
                                  className="w-12 h-16 object-cover rounded"
                                />
                                <div>
                                  <p className="text-white font-medium">{post.anime.title}</p>
                                  <p className="text-gray-400 text-sm">Anime</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Images */}
                        {post.images && post.images.length > 0 && (
                          <div className={`grid gap-2 ${
                            post.images.length === 1 ? 'grid-cols-1' :
                            post.images.length === 2 ? 'grid-cols-2' :
                            'grid-cols-2'
                          }`}>
                            {post.images.slice(0, 4).map((image, index) => (
                              <div
                                key={index}
                                className={`relative overflow-hidden rounded-lg ${
                                  post.images!.length === 3 && index === 0 ? 'col-span-2' : ''
                                }`}
                              >
                                <img
                                  src={image}
                                  alt={`Post image ${index + 1}`}
                                  className="w-full h-64 object-cover hover:scale-105 transition-transform cursor-pointer"
                                />
                                {post.images!.length > 4 && index === 3 && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">
                                      +{post.images!.length - 4}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                          <div className="flex space-x-4">
                            <Button
                              onClick={() => handleLike(post.id)}
                              variant="ghost"
                              size="sm"
                              className={`text-gray-400 hover:text-red-400 ${
                                post.isLiked ? 'text-red-400' : ''
                              }`}
                            >
                              <Heart className={`w-4 h-4 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
                              {post.likes}
                            </Button>

                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-400">
                              <MessageCircle className="w-4 h-4 mr-1" />
                              {post.comments}
                            </Button>

                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-green-400">
                              <Share2 className="w-4 h-4 mr-1" />
                              {post.shares}
                            </Button>
                          </div>

                          <Button
                            onClick={() => handleBookmark(post.id)}
                            variant="ghost"
                            size="sm"
                            className={`text-gray-400 hover:text-yellow-400 ${
                              post.isBookmarked ? 'text-yellow-400' : ''
                            }`}
                          >
                            <Bookmark className={`w-4 h-4 ${post.isBookmarked ? 'fill-current' : ''}`} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* Other tabs content */}
          <TabsContent value="trending" className="text-center py-20">
            <h3 className="text-2xl font-bold text-white mb-4">Trending Posts</h3>
            <p className="text-gray-400">Discover what's hot in the anime community</p>
          </TabsContent>

          <TabsContent value="following" className="text-center py-20">
            <h3 className="text-2xl font-bold text-white mb-4">Following</h3>
            <p className="text-gray-400">Posts from people you follow</p>
          </TabsContent>

          <TabsContent value="discover" className="text-center py-20">
            <h3 className="text-2xl font-bold text-white mb-4">Discover</h3>
            <p className="text-gray-400">Find new anime fans to connect with</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}