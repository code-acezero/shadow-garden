"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Zap, ShieldCheck, Radio, AlertTriangle } from 'lucide-react';
import SafeEmbed from "@/components/SafeEmbed"; 

export default function TestWatchPage() {
    const [awSlug, setAwSlug] = useState("one-punch-man-3x1");
    const [awServers, setAwServers] = useState<any[]>([]); 
    const [activeServer, setActiveServer] = useState<any>(null); 
    const [loading, setLoading] = useState(false);
    const [debug, setDebug] = useState<any>(null);

    const testAnimeWorld = async () => {
        setLoading(true);
        setAwServers([]);
        setActiveServer(null);
        setDebug(null);
        
        try {
            const res = await fetch(`/api/animeworld?action=episode&url=/episode/${awSlug}`);
            const json = await res.json();
            setDebug(json);

            if (json.success && json.data.servers) {
                const serverList = json.data.servers;
                setAwServers(serverList);
                // Default to first server
                if (serverList.length > 0) setActiveServer(serverList[0]);
            }
        } catch (e: any) {
            setDebug({ error: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8 font-sans selection:bg-blue-500/30">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row gap-4 items-end bg-zinc-900/50 p-6 rounded-3xl border border-white/5">
                    <div className="flex-1 space-y-2 w-full">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-400/60 ml-1">Episode Slug</label>
                        <div className="flex gap-2">
                            <Input 
                                value={awSlug} 
                                onChange={(e) => setAwSlug(e.target.value)}
                                placeholder="one-piece-episode-1"
                                className="bg-black/50 border-white/10 h-12 rounded-xl focus:border-blue-500/50 transition-all font-mono text-sm"
                            />
                            <Button 
                                onClick={testAnimeWorld} 
                                disabled={loading} 
                                className="h-12 bg-blue-600 hover:bg-blue-500 text-white px-8 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
                            >
                                {loading ? "Loading..." : <Play size={20} fill="currentColor" />}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Server Selector */}
                {awServers.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 animate-in fade-in slide-in-from-top-4">
                        {awServers.map((srv, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveServer(srv)}
                                className={`
                                    p-3 rounded-xl border text-left transition-all flex flex-col gap-1
                                    ${activeServer?.name === srv.name 
                                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-100 shadow-lg shadow-blue-900/10' 
                                        : 'bg-zinc-900/50 border-white/5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
                                    }
                                `}
                            >
                                <span className="text-[10px] font-black uppercase tracking-wider">{srv.type || 'Server'}</span>
                                <span className="text-xs font-bold truncate w-full">{srv.name}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Player Area */}
                <div className="bg-black rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                    {activeServer ? (
                        <div className="w-full">
                            <SafeEmbed key={activeServer.iframe} url={activeServer.iframe} />
                        </div>
                    ) : (
                        <div className="aspect-video flex flex-col items-center justify-center text-zinc-700 gap-4">
                            <Zap size={48} strokeWidth={1} />
                            <p className="text-xs font-bold uppercase tracking-widest">No Signal</p>
                        </div>
                    )}
                    
                    {/* Instructions */}
                    <div className="p-4 bg-zinc-900/50 border-t border-white/5 text-xs text-zinc-400 flex items-start gap-3">
                        <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-bold text-zinc-300">If you see "AdBlock Detected" or a Black Screen:</p>
                            <ol className="list-decimal pl-4 space-y-1 opacity-80">
                                <li>Hover over the video player.</li>
                                <li>Click the <span className="text-yellow-400 font-bold">Fix Player Error</span> button in the top right.</li>
                                <li>This allows the player to load necessary scripts while still blocking redirects.</li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Debug Info */}
                <Card className="bg-zinc-900/30 border-white/5 text-white rounded-3xl overflow-hidden">
                     <CardHeader className="border-b border-white/5 bg-white/5 py-3">
                        <CardTitle className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Signal Log</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="bg-black/40 p-4 h-32 overflow-y-auto custom-scrollbar">
                            <pre className="text-[10px] font-mono text-blue-200/50 whitespace-pre-wrap">
                                {debug ? JSON.stringify(debug, null, 2) : "// Waiting for response..."}
                            </pre>
                        </div>
                    </CardContent>
                </Card>

            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}} />
        </div>
    );
}