"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, CheckCircle, XCircle, LayoutGrid, List as ListIcon } from 'lucide-react';

const WatchlistSkeleton = () => (
    <div className="min-h-screen bg-[#050505] p-8 grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[...Array(8)].map((_, i) => <div key={i} className="aspect-[3/4] bg-white/5 rounded-xl"/>)}
    </div>
);

export default function WatchlistPage() {
    const { user, isLoading } = useAuth();
    const [library, setLibrary] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Fetch User's Library
    useEffect(() => {
        const fetchLibrary = async () => {
            if (!user || !supabase) return;
            const { data } = await supabase
                .from('user_library')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });
            
            if (data) setLibrary(data);
            setLoadingData(false);
        };

        if (user) fetchLibrary();
    }, [user]);

    if (isLoading || loadingData) return <WatchlistSkeleton />;
    if (!user) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-zinc-500 font-bold uppercase tracking-widest">Login required to access Archives.</div>;

    // Filter Logic
    const watching = library.filter(i => i.status === 'watching');
    const completed = library.filter(i => i.status === 'completed');
    const planning = library.filter(i => i.status === 'plan_to_watch');
    const onHold = library.filter(i => i.status === 'on_hold');
    const dropped = library.filter(i => i.status === 'dropped');

    // Helper to render a grid of anime cards
    const AnimeGrid = ({ items }: { items: any[] }) => (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {items.map((item) => (
                <Link key={item.anime_id} href={`/watch/${item.anime_id}`} className="group relative block">
                    <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 shadow-2xl shadow-red-900/5 relative">
                        <img src={item.anime_image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={item.anime_title} />
                        
                        {/* Overlay with Progress for "Watching" items */}
                        {item.status === 'watching' && (
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/50">
                                    <Play size={20} fill="white" className="ml-1 text-white" />
                                </div>
                                <span className="text-[10px] font-black uppercase text-white tracking-widest">Continue Ep {item.progress}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-3">
                        <h4 className="text-xs font-bold text-zinc-200 line-clamp-1 group-hover:text-red-500 transition-colors">{item.anime_title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[9px] h-4 px-1 border-white/10 text-zinc-500">{item.progress > 0 ? `Ep ${item.progress}` : 'Start'}</Badge>
                            <span className="text-[9px] text-zinc-600 font-mono">{new Date(item.updated_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </Link>
            ))}
            {items.length === 0 && (
                <div className="col-span-full h-60 flex flex-col items-center justify-center text-zinc-700 gap-4 border-2 border-dashed border-white/5 rounded-3xl">
                    <ListIcon size={32} className="opacity-20"/>
                    <span className="text-xs uppercase tracking-widest font-bold">Sector Empty</span>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24 px-4 md:px-8 pb-20">
            <div className="max-w-[1600px] mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-black font-[Cinzel] tracking-tighter uppercase text-white shadow-red-900/20 drop-shadow-lg">
                        Shadow <span className="text-red-600">Library</span>
                    </h1>
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        Total Entries: <span className="text-white">{library.length}</span>
                    </div>
                </div>

                <Tabs defaultValue="watching" className="w-full">
                    <div className="overflow-x-auto pb-4 scrollbar-hide">
                        <TabsList className="bg-transparent gap-2 h-auto p-0">
                            {[
                                { val: "watching", label: "Watching", count: watching.length, icon: <Play size={12}/> },
                                { val: "planning", label: "Planning", count: planning.length, icon: <Clock size={12}/> },
                                { val: "completed", label: "Completed", count: completed.length, icon: <CheckCircle size={12}/> },
                                { val: "on_hold", label: "On Hold", count: onHold.length, icon: <Clock size={12}/> },
                                { val: "dropped", label: "Dropped", count: dropped.length, icon: <XCircle size={12}/> },
                            ].map((tab) => (
                                <TabsTrigger 
                                    key={tab.val} 
                                    value={tab.val}
                                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white bg-white/5 border border-white/5 text-zinc-500 rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all gap-2"
                                >
                                    {tab.icon} {tab.label} <span className="opacity-50 ml-1">({tab.count})</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <TabsContent value="watching" className="mt-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="mb-6 flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest"><Play size={14}/> Continue Operations</div>
                        <AnimeGrid items={watching} />
                    </TabsContent>

                    <TabsContent value="planning" className="mt-4 animate-in fade-in slide-in-from-bottom-4">
                        <AnimeGrid items={planning} />
                    </TabsContent>

                    <TabsContent value="completed" className="mt-4 animate-in fade-in slide-in-from-bottom-4">
                        <AnimeGrid items={completed} />
                    </TabsContent>

                    <TabsContent value="on_hold" className="mt-4 animate-in fade-in slide-in-from-bottom-4">
                        <AnimeGrid items={onHold} />
                    </TabsContent>

                    <TabsContent value="dropped" className="mt-4 animate-in fade-in slide-in-from-bottom-4">
                        <AnimeGrid items={dropped} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}