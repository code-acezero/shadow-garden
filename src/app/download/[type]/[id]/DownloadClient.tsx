"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Download, ArrowLeft, Loader2, ServerIcon, Subtitles, Layers, CheckCircle2, XCircle, X, FileWarning, Gauge } from 'lucide-react';
import { AnimeService } from '@/lib/api';
import { hpi } from '@/lib/hpi';
import { dpi } from '@/lib/dpi';
import { omni } from '@/lib/omni';
import { useDownloadEngine, formatBytes, formatSpeed, DownloadItem } from '@/lib/downloadEngine';
import { cn } from '@/lib/utils';

const api = new AnimeService();
const DEFAULT_REFERER = 'https://megacloud.blog/';

interface EngineTarget {
  id: string;
  label: string;
  kind: 'mp4' | 'hls' | 'unresolved';
  buildUrl: (filename: string) => string;
  resolution?: string;
}

function safeFilename(title: string, epNum: string | number, extra?: string) {
  const base = `${title} - Ep ${epNum}${extra ? ` (${extra})` : ''}`;
  return base.replace(/[^a-z0-9\-_. ()]/gi, '_').slice(0, 150);
}

function ProgressRow({ item, onCancel }: { item: DownloadItem; onCancel: () => void }) {
  const pct = item.totalBytes ? Math.min(100, (item.receivedBytes / item.totalBytes) * 100) : null;
  return (
    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-white truncate">{item.label}</span>
        {item.status === 'downloading' && (
          <button onClick={onCancel} className="text-zinc-400 hover:text-red-500 shrink-0"><X size={14} /></button>
        )}
        {item.status === 'done' && <CheckCircle2 size={16} className="text-green-500 shrink-0" />}
        {(item.status === 'error' || item.status === 'cancelled') && <XCircle size={16} className="text-red-500 shrink-0" />}
      </div>
      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={cn("h-full bg-orange-600 transition-all", pct === null && item.status === 'downloading' && "animate-pulse w-1/3")}
          style={pct !== null ? { width: `${pct}%` } : undefined}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
        <span>{formatBytes(item.receivedBytes)}{item.totalBytes ? ` / ${formatBytes(item.totalBytes)}` : ''}</span>
        {item.status === 'downloading' && <span className="flex items-center gap-1"><Gauge size={10} />{formatSpeed(item.speedBps)}</span>}
        {item.status === 'error' && <span className="text-red-500">{item.error}</span>}
      </div>
    </div>
  );
}

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
  const [availableResolutions, setAvailableResolutions] = useState<string[]>([]);
  const [fetchingRes, setFetchingRes] = useState(false);

  const [resolvingEmbed, setResolvingEmbed] = useState(false);
  const [resolvedEmbed, setResolvedEmbed] = useState<{ url: string; type: 'hls' | 'mp4' } | null>(null);
  const [embedUnresolvable, setEmbedUnresolvable] = useState<string | null>(null);

  const [batchLoading, setBatchLoading] = useState(false);

  const engine = useDownloadEngine();

  useEffect(() => {
    if (!id || !type || !epId) {
      setError("Invalid or missing parameters");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setResolvedEmbed(null);
      setEmbedUnresolvable(null);
      try {
        let details: any;
        let streamData: any;

        if (type === 'anime') {
          details = await AnimeService.getAnimeInfo(id);
          streamData = await AnimeService.getStream(epId);
        } else if (type === 'hindi') {
          details = await hpi.hindi.getDetails(id);
          streamData = await hpi.hindi.getStream(epId);
        } else if (type === 'donghua') {
          details = await dpi.bridge.getSmartDetails(id);
          streamData = await dpi.getStream(epId);
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

        const directUrl = getDirectSourceUrl(streamData);
        if (directUrl?.kind === 'hls') {
          fetchResolutions(directUrl.url, directUrl.referer);
        } else if (directUrl?.kind === 'unresolved-embed' && directUrl.url) {
          resolveEmbed(directUrl.url, directUrl.referer);
        }
      } catch (err) {
        console.error("Download fetch error:", err);
        setError("Failed to fetch download information.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, id, epId]);

  // Normalize whatever shape the 4 different API clients return into
  // { kind: 'mp4' | 'hls' | 'unresolved-embed', url, referer }
  function getDirectSourceUrl(streamData: any): { kind: 'mp4' | 'hls' | 'unresolved-embed'; url: string; referer: string } | null {
    if (!streamData) return null;
    const referer = streamData.referer || DEFAULT_REFERER;
    const servers = streamData.servers;
    const flatServers: any[] = Array.isArray(servers) ? servers : [...(servers?.dub || []), ...(servers?.sub || [])];

    const mp4Server = flatServers.find(s => (s.url || '').toLowerCase().includes('.mp4'));
    if (mp4Server) return { kind: 'mp4', url: mp4Server.url, referer: mp4Server.referer || referer };

    const hlsServer = flatServers.find(s => s.type === 'hls' || (s.url || '').toLowerCase().includes('.m3u8'));
    if (hlsServer) return { kind: 'hls', url: hlsServer.url, referer: hlsServer.referer || referer };

    if (streamData.isM3U8 && (streamData.targetUrl || streamData.url)) {
      return { kind: 'hls', url: streamData.targetUrl || streamData.url, referer };
    }

    // Nothing direct found — only an opaque iframe embed is available.
    const embedUrl = streamData.iframe || streamData.targetUrl || streamData.url || flatServers[0]?.url;
    if (embedUrl) return { kind: 'unresolved-embed', url: embedUrl, referer };
    return null;
  }

  const fetchResolutions = async (hlsUrl: string, referer: string) => {
    setFetchingRes(true);
    try {
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(hlsUrl)}&referer=${encodeURIComponent(referer)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("Failed to fetch playlist");
      const text = await res.text();
      const resSet = new Set<string>();
      text.split('\n').forEach(line => {
        const m = line.match(/RESOLUTION=\d+x(\d+)/);
        if (m) resSet.add(m[1]);
      });
      setAvailableResolutions(Array.from(resSet).sort((a, b) => parseInt(b) - parseInt(a)));
    } catch (e) {
      console.error("Failed to parse m3u8 resolutions:", e);
      setAvailableResolutions([]); // still downloadable at default quality
    } finally {
      setFetchingRes(false);
    }
  };

  const resolveEmbed = async (embedUrl: string, referer: string) => {
    setResolvingEmbed(true);
    setEmbedUnresolvable(null);
    try {
      const res = await fetch(`/api/download/resolve?url=${encodeURIComponent(embedUrl)}&referer=${encodeURIComponent(referer || embedUrl)}`);
      const data = await res.json();
      if (data.resolved) {
        setResolvedEmbed({ url: data.url, type: data.type });
        if (data.type === 'hls') fetchResolutions(data.url, referer);
      } else {
        setEmbedUnresolvable(data.reason || 'This source is embed-only and cannot be captured for download.');
      }
    } catch (e: any) {
      setEmbedUnresolvable('This source is embed-only and cannot be captured for download.');
    } finally {
      setResolvingEmbed(false);
    }
  };

  const currentEpNum = mediaEps.find(e => e.id === epId || String(e.number) === epId)?.number || '?';
  const directSource = getDirectSourceUrl(stream);
  const referer = directSource?.referer || DEFAULT_REFERER;
  const subs = stream?.subtitles || stream?.tracks || [];

  const startMp4Download = (url: string, label: string) => {
    const filename = safeFilename(mediaTitle, currentEpNum);
    const engineUrl = `/api/download/file?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(referer)}&filename=${encodeURIComponent(filename)}`;
    engine.start({ id: `${filename}-${Date.now()}`, label, filename: `${filename}.mp4`, url: engineUrl });
  };

  const startHlsDownload = (hlsUrl: string, res?: string) => {
    const filename = safeFilename(mediaTitle, currentEpNum, res ? `${res}p` : undefined);
    const params = new URLSearchParams({ url: hlsUrl, referer, filename });
    if (res) params.set('res', res);
    const engineUrl = `/api/download/hls?${params.toString()}`;
    engine.start({ id: `${filename}-${Date.now()}`, label: `${mediaTitle} · Ep ${currentEpNum}${res ? ` · ${res}p` : ''}`, filename: `${filename}.ts`, url: engineUrl });
  };

  const downloadBatch = async () => {
    if (!mediaEps.length) return;
    setBatchLoading(true);
    try {
      let content = `# Batch Download Links for ${mediaTitle}\n`;
      content += `# These are direct engine links routed through this site's proxy (correct Referer already applied).\n`;
      content += `# Import into IDM / JDownloader / wget for a full-series batch grab.\n\n`;

      for (const ep of mediaEps) {
        let epStream: any;
        if (type === 'anime') epStream = await AnimeService.getStream(ep.id).catch(() => null);
        else if (type === 'hindi') epStream = await hpi.hindi.getStream(ep.id).catch(() => null);
        else if (type === 'donghua') epStream = await dpi.getStream(ep.id).catch(() => null);
        else if (type === 'drama') epStream = await omni.drama.getStream(ep.embedUrl).catch(() => null);

        const target = getDirectSourceUrl(epStream);
        if (target?.kind === 'mp4') {
          const fname = safeFilename(mediaTitle, ep.number);
          content += `${window.location.origin}/api/download/file?url=${encodeURIComponent(target.url)}&referer=${encodeURIComponent(target.referer)}&filename=${encodeURIComponent(fname)}\n`;
        } else if (target?.kind === 'hls') {
          const fname = safeFilename(mediaTitle, ep.number);
          content += `${window.location.origin}/api/download/hls?url=${encodeURIComponent(target.url)}&referer=${encodeURIComponent(target.referer)}&filename=${encodeURIComponent(fname)}\n`;
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
        <h2 className="text-lg font-[Cinzel] text-orange-500 animate-pulse tracking-[0.3em]">INITIALIZING DOWNLOAD ENGINE...</h2>
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

  const activeItems = Object.values(engine.items).sort((a, b) => (b.id > a.id ? 1 : -1));
  const hlsTarget = resolvedEmbed?.type === 'hls' ? resolvedEmbed.url : (directSource?.kind === 'hls' ? directSource.url : null);
  const mp4Target = resolvedEmbed?.type === 'mp4' ? resolvedEmbed.url : (directSource?.kind === 'mp4' ? directSource.url : null);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-sans p-4 md:p-8 pt-20">
      <div className="max-w-[1200px] mx-auto">

        <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={16} /> <span className="text-sm font-bold tracking-widest uppercase">Back to Watch</span>
        </button>

        <div className="flex flex-col md:flex-row gap-8 items-start">

          <div className="w-48 shrink-0 relative rounded-2xl overflow-hidden shadow-2xl shadow-orange-900/20 border border-white/10 hidden md:block">
            <img src={mediaImage || '/images/no-poster.png'} alt="Poster" className="w-full aspect-[2/3] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
               <span className="text-orange-500 font-black text-2xl font-[Cinzel]">EP {currentEpNum}</span>
            </div>
          </div>

          <div className="flex-1 w-full">
            <h1 className="text-3xl md:text-5xl font-black text-white font-[Cinzel] tracking-tighter mb-2">{mediaTitle}</h1>
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm mb-12 flex items-center gap-2">
              <Download size={16} className="text-orange-600"/> Download Engine
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              <div className="flex flex-col gap-6">

                {mp4Target && (
                  <div className="bg-[#0a0a0a] rounded-3xl p-6 border border-white/5 shadow-xl">
                    <h3 className="text-white font-black uppercase tracking-widest mb-4 flex items-center gap-2"><ServerIcon size={16} className="text-green-500"/> Direct MP4</h3>
                    <p className="text-[10px] text-zinc-500 mb-4 uppercase">Downloads through this site's engine (proper headers applied) — a real file, not the raw broken CDN link.</p>
                    <button onClick={() => startMp4Download(mp4Target, `${mediaTitle} · Ep ${currentEpNum}`)} className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-green-600 hover:text-white transition-all border border-white/5 group">
                      <span className="font-bold">Download MP4</span>
                      <Download size={16} className="opacity-50 group-hover:opacity-100" />
                    </button>
                  </div>
                )}

                {hlsTarget && (
                  <div className="bg-[#0a0a0a] rounded-3xl p-6 border border-white/5 shadow-xl">
                    <h3 className="text-white font-black uppercase tracking-widest mb-2 flex items-center gap-2"><ServerIcon size={16} className="text-orange-500"/> HLS Stream</h3>
                    <p className="text-[10px] text-zinc-500 mb-4 uppercase">Segments are fetched, decrypted if needed, and merged server-side into one file.</p>
                    {fetchingRes ? (
                      <div className="flex items-center gap-2 text-zinc-500 text-sm font-bold animate-pulse"><Loader2 size={14} className="animate-spin" /> Reading available qualities...</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {availableResolutions.length > 0 ? availableResolutions.map((res) => (
                          <button key={res} onClick={() => startHlsDownload(hlsTarget, res)} className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-orange-600 hover:text-white transition-all border border-white/5 font-black text-lg">
                            {res}p <Download size={14} />
                          </button>
                        )) : (
                          <button onClick={() => startHlsDownload(hlsTarget)} className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-orange-600 hover:text-white transition-all border border-white/5 font-black text-lg">
                            Download Best Quality <Download size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {resolvingEmbed && (
                  <div className="flex items-center gap-2 text-zinc-500 text-sm font-bold animate-pulse"><Loader2 size={14} className="animate-spin" /> Attempting to resolve embedded source...</div>
                )}

                {embedUnresolvable && !mp4Target && !hlsTarget && (
                  <div className="bg-[#0a0a0a] rounded-3xl p-6 border border-white/5 shadow-xl flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-amber-500 font-black uppercase tracking-widest text-sm"><FileWarning size={16}/> Not Downloadable</div>
                    <p className="text-zinc-400 text-sm leading-relaxed">{embedUnresolvable}</p>
                    <p className="text-zinc-600 text-xs">You can still watch this episode normally on the watch page — this server just doesn't expose a raw file the engine can capture.</p>
                  </div>
                )}

                {!mp4Target && !hlsTarget && !resolvingEmbed && !embedUnresolvable && (
                   <div className="bg-[#0a0a0a] rounded-3xl p-6 border border-white/5 shadow-xl">
                     <p className="text-zinc-500 text-sm">No direct download source found for this episode yet.</p>
                   </div>
                )}

                {activeItems.length > 0 && (
                  <div className="bg-[#0a0a0a] rounded-3xl p-6 border border-white/5 shadow-xl flex flex-col gap-3">
                    <h3 className="text-white font-black uppercase tracking-widest mb-1 flex items-center gap-2"><Download size={16} className="text-orange-500"/> Active Downloads</h3>
                    {activeItems.map(item => (
                      <ProgressRow key={item.id} item={item} onCancel={() => engine.cancel(item.id)} />
                    ))}
                  </div>
                )}

              </div>

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
                  <p className="text-xs text-zinc-400 mb-4 leading-relaxed">Generate a text file of engine-proxied links (correct Referer baked in) for all {mediaEps.length} episodes. Import into <strong>IDM</strong> or <strong>JDownloader</strong> for a full-series batch grab.</p>

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
