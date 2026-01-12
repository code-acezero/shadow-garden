"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/api';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // ✅ Added missing import
import OtakuVerse from '@/components/Social/OtakuVerse';
import { toast } from 'sonner';

export default function SinglePostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function getInitialData() {
      // 1. Get current session to pass to OtakuVerse
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsReady(true);

      // 2. Fetch the specific post to verify it exists before loading the feed
      if (params.id) {
        try {
          const { data, error } = await supabase
            .from('social_posts')
            .select(`
              *,
              user:profiles(username, avatar_url, role)
            `)
            .eq('id', params.id)
            .single();

          if (error) {
            console.error("Supabase error:", error);
            setPost(null);
          } else {
            setPost(data);
          }
        } catch (err) {
          console.error("Error fetching post:", err);
          setPost(null);
        } finally {
          setIsLoading(false);
        }
      }
    }

    getInitialData();
  }, [params.id]);

  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
          <p className="text-zinc-500 font-[Cinzel] tracking-widest animate-pulse text-xs">
            DECRYPTING_SIGNAL...
          </p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 pointer-events-none" />
        <h1 className="text-4xl font-black mb-4 font-[Cinzel] text-red-600 tracking-tighter">
          SIGNAL_DISRUPTED
        </h1>
        <p className="text-zinc-500 mb-8 max-w-md text-center text-sm uppercase tracking-widest leading-relaxed">
          The requested broadcast does not exist or has been permanently erased from the neural network.
        </p>
        <Button 
          onClick={() => router.push('/social')} 
          className="bg-red-600 hover:bg-red-700 text-white font-black px-8 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all"
        >
          RETURN TO GLOBAL FEED
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Dynamic Header for Single Post View */}
      <div className="sticky top-0 z-[100] bg-black/80 backdrop-blur-md border-b border-white/5 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/social')} 
              className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full"
            >
              <ArrowLeft />
            </Button>
            <div>
              <h2 className="font-[Cinzel] text-sm md:text-lg tracking-[0.2em] text-red-500 uppercase leading-none">
                Transmission_Log
              </h2>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter mt-1">
                Point_Origin: {post.user?.username || 'Unknown_Agent'}
              </p>
            </div>
          </div>
          
          <Badge variant="outline" className="border-red-900/50 text-red-600 animate-pulse font-black text-[10px]">
            LIVE_SIGNAL
          </Badge>
        </div>
      </div>

      <main className="relative">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-red-600/5 to-transparent pointer-events-none" />
        
        {/* Pass the current post ID as highlightId */}
        <OtakuVerse 
          user={user} 
          onAuthRequired={() => router.push('/login')} 
          highlightId={params.id as string}
        />
      </main>
    </div>
  );
}