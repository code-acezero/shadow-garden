"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Download, ChevronLeft, Play, ArrowLeft, Loader2, ServerIcon, Subtitles, Layers } from 'lucide-react';
import { AnimeService } from '@/lib/api';
import { hpi } from '@/lib/hpi';
import { dpi } from '@/lib/dpi';
import { omni } from '@/lib/omni';

const api = new AnimeService();

function DownloadContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = params.type as string; // 'anime', 'hindi', 'donghua', 'drama'
  const id = params.id as string;
  const epId = searchParams.get('ep');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [mediaTitle, setMediaTitle] = useState('Unknown');
  const [mediaImage, setMediaImage] = useState('');
  const [mediaEps, setMediaEps] = useState<any[]>([]);
  
  const [stream, setStream] = useState<any>(null);
  const [m3u8Resolutions, setM3u8Resolutions] = useState<{resolution: string, url: string}[]>([]);
  const [fetchingM3u8, setFetchingM3u8] = useState(false);
  
  const [batchMode, setBatchMode] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  
  useEffect(() => {
    if (!id || !type || !epId) {
      setError("Invalid or missing parameters");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let details: any;
        let streamData: any;
        
        if (type === 'anime') {
          details = await api.anime.info(id);
          streamData = await api.anime.getStream(epId);
        } else if (type === 'hindi') {
          details = await hpi.hindi.getDetails(id);
          streamData = await hpi.hindi.getStream(epId);
        } else if (type === 'donghua') {
          details = await dpi.donghua.getDetails(id);
          streamData = await dpi.donghua.getStream(epId);
        } else if (type === 'drama') {
          details = await omni.drama.getDetail(id);
          const ep = details?.episodes?.find((e: any) => e.id === epId || String(e.number) === epId);
          if (ep?.embedUrl) streamData = await omni.drama.getStream(ep.embedUrl);
        } else {
          throw new Error("Unknown media type");
        }

        setMediaTitle(details?.title || details?.name || 'Unknown');
        setMediaImage(details?.image || details?.poster || '');
        setMediaEps(details?.episodes || []);
        setStream(streamData);
        
        // Try parsing HLS playlist if it's m3u8
        const hlsServer = streamData?.servers?.find((s: any) => s.type === 'hls' || s.url?.includes('.m3u8'));
        const hlsUrl = hlsServer?.url || (streamData?.isM3U8 ? (streamData?.targetUrl || streamData?.url) : null);
        
        if (hlsUrl) {
          fetchM3u8Resolutions(hlsUrl);
        }
      } catch (err) {
        console.error("Download fetch error:", err);
        setError("Failed to fetch download information.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [type, id, epId]);

  const fetchM3u8Resolutions = async (url: string) => {
    setFetchingM3u8(true);
    try {
      // Use proxy to avoid CORS
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("Failed to fetch m3u8");
      const text = await res.text();
      
      const lines = text.split('\n');
      const resolutions: {resolution: string, url: string}[] = [];
      let currentRes = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#EXT-X-STREAM-INF')) {
          const resMatch = line.match(/RESOLUTION=\d+x(\d+)/);
          if (resMatch) currentRes = `${resMatch[1]}p`;
          else currentRes = 'Auto';
        } else if (line && !line.startsWith('#')) {
          if (currentRes) {
            // Absolute URL check
            let fullUrl = line;
            if (!line.startsWith('http')) {
              const urlObj = new URL(url);
              // if it starts with /, use origin, else relative
              if (line.startsWith('/')) fullUrl = `${urlObj.origin}${line}`;
              else fullUrl = `${url.substring(0, url.lastIndexOf('/') + 1)}${line}`;
            }
            resolutions.push({ resolution: currentRes, url: fullUrl });
            currentRes = '';
          }
        }
      }
      // Sort desc
      resolutions.sort((a, b) => parseInt(b.resolution) - parseInt(a.resolution));
      setM3u8Resolutions(resolutions);
    } catch (e) {
      console.error("Failed to parse m3u8:", e);
    } finally {
      setFetchingM3u8(false);
    }
  };

  const currentEpNum = mediaEps.find(e => e.id === epId || String(e.number) === epId)?.number || '?';

  const downloadBatch = async () => {
    if (!mediaEps.length) return;
    setBatchLoading(true);
    try {
      let content = `# Batch Download Links for ${mediaTitle}\\n`;
      content += `# Note: These are stream URLs (mostly .m3u8). Use a download manager like IDM or JDownloader.\\n\\n`;
      
      for (const ep of mediaEps) {
        let epStream: any;
        if (type === 'anime') epStream = await api.anime.getStream(ep.id).catch(()=>null);
        else if (type === 'hindi') epStream = await hpi.hindi.getStream(ep.id).catch(()=>null);
        else if (type === 'donghua') epStream = await dpi.donghua.getStream(ep.id).catch(()=>null);
        else if (type === 'drama') epStream = await omni.drama.getStream(ep.embedUrl).catch(()=>null);
        
        if (epStream) {
          const bestServer = epStream.servers?.find((s:any) => s.type === 'hls' || !s.isEmbed) || epStream.servers?.[0];
          const bestUrl = bestServer?.url || epStream.url || epStream.targetUrl || epStream.iframe;
          if (bestUrl) content += `${bestUrl}\\n`;
        }
      }
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${mediaTitle}-batch-links.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to generate batch links.");
    } finally {
      setBatchLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#050505] flex flex-col items-center justify-center">
        <Loader2 className="w-14 h-14 text-orange-600 animate-spin mb-4" />
        <h2 className="text-lg font-[Cinzel] text-orange-500 animate-pulse tracking-[0.3em]">INITIALIZING DOWNLOAD...</h2>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="w-full min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Download Failed</h2>
        <p className="text-zinc-400 mb-8">{error || "No stream data found for this episode."}</p>
        <button onClick={() => router.back()} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full font-bold text-white transition-all">Go Back</button>
      </div>
    );
  }

  const mp4Servers = stream?.servers?.filter((s: any) => s.url?.toLowerCase().includes('.mp4') || s.type === 'mp4');
  const subs = stream?.subtitles || stream?.tracks || [];
  
  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-sans p-4 md:p-8 pt-20">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Header */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={16} /> <span className="text-sm font-bold tracking-widest uppercase">Back to Watch</span>
        </button>
        
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Poster */}
          <div className="w-48 shrink-0 relative rounded-2xl overflow-hidden shadow-2xl shadow-orange-900/20 border border-white/10 hidden md:block">
            <img src={mediaImage || '/images/no-poster.png'} alt="Poster" className="w-full aspect-[2/3] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
               <span className="text-orange-500 font-black text-2xl font-[Cinzel]">EP {currentEpNum}</span>
            </div>
          </div>
          
          <div className="flex-1 w-full">
            <h1 className="text-3xl md:text-5xl font-black text-white font-[Cinzel] tracking-tighter mb-2">{mediaTitle}</h1>
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm mb-12 flex items-center gap-2">
              <Download size={16} className="text-orange-600"/> Download Terminal
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column: Direct Videos */}
              <div className="flex flex-col gap-6">
                
                {mp4Servers.length > 0 && (
                  <div className="bg-[#0a0a0a] rounded-3xl p-6 border border-white/5 shadow-xl">
                    <h3 className="text-white font-black uppercase tracking-widest mb-4 flex items-center gap-2"><ServerIcon size={16} className="text-green-500"/> Native MP4 Options</h3>
                    <div className="flex flex-col gap-3">
                      {mp4Servers.map((srv: any, idx: number) => (
                        <a key={idx} href={srv.url} download rel="noreferrer" className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-green-600 hover:text-white transition-all border border-white/5 group">
                          <span className="font-bold">{srv.name || `Server ${idx + 1}`}</span>
                          <Download size={16} className="opacity-50 group-hover:opacity-100" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                {m3u8Resolutions.length > 0 && (
                  <div className="bg-[#0a0a0a] rounded-3xl p-6 border border-white/5 shadow-xl">
                    <h3 className="text-white font-black uppercase tracking-widest mb-2 flex items-center gap-2"><ServerIcon size={16} className="text-orange-500"/> HLS Stream Options</h3>
                    <p className="text-[10px] text-zinc-500 mb-4 uppercase">These are .m3u8 playlists. Use VLC or IDM to download/play them.</p>
                    <div className="grid grid-cols-2 gap-3">
                      {m3u8Resolutions.map((res: any, idx: number) => (
                        <a key={idx} href={res.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-orange-600 hover:text-white transition-all border border-white/5 font-black text-lg">
                          {res.resolution} <Download size={14} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                {fetchingM3u8 && (
                   <div className="flex items-center gap-2 text-zinc-500 text-sm font-bold animate-pulse"><Loader2 size={14} className="animate-spin" /> Fetching stream resolutions...</div>
                )}
                
                {mp4Servers.length === 0 && m3u8Resolutions.length === 0 && !fetchingM3u8 && (
                   <div className="bg-[#0a0a0a] rounded-3xl p-6 border border-white/5 shadow-xl">
                     <p className="text-zinc-500 text-sm">No direct download links available. You may try using a browser extension on the watch page.</p>
                   </div>
                )}
                
              </div>
              
              {/* Right Column: Subs & Batch */}
              <div className="flex flex-col gap-6">
                
                {subs.length > 0 && (
                   <div className="bg-[#0a0a0a] rounded-3xl p-6 border border-white/5 shadow-xl">
                     <h3 className="text-white font-black uppercase tracking-widest mb-4 flex items-center gap-2"><Subtitles size={16} className="text-blue-500"/> Subtitles</h3>
                     <div className="flex flex-wrap gap-2">
                       {subs.map((sub: any, idx: number) => (
                         sub.url || sub.file ? (
                          <a key={idx} href={sub.url || sub.file} download rel="noreferrer" className="px-4 py-2 rounded-full bg-white/5 hover:bg-blue-600 hover:text-white transition-all border border-white/5 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                            {sub.label || sub.lang || 'Unknown'} <Download size={12} />
                          </a>
                         ) : null
                       ))}
                     </div>
                   </div>
                )}
                
                <div className="bg-[#0a0a0a] rounded-3xl p-6 border border-white/5 shadow-xl">
                  <h3 className="text-white font-black uppercase tracking-widest mb-2 flex items-center gap-2"><Layers size={16} className="text-purple-500"/> Batch Download</h3>
                  <p className="text-xs text-zinc-400 mb-4 leading-relaxed">Generate a text file containing the stream URLs for all {mediaEps.length} episodes of this series. You can import this file into <strong>IDM (Internet Download Manager)</strong> or JDownloader to download the whole series at once.</p>
                  
                  <button onClick={downloadBatch} disabled={batchLoading} className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest transition-all disabled:opacity-50">
                    {batchLoading ? <Loader2 size={18} className="animate-spin"/> : <Download size={18} />} 
                    {batchLoading ? 'Generating List...' : 'Generate Batch Links'}
                  </button>
                </div>
                
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DownloadClient() {
  return <Suspense fallback={<div className="w-full h-screen bg-[#050505]"/>}><DownloadContent /></Suspense>;
}
