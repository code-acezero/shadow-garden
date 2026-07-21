"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Download, ArrowLeft, Loader2, ServerIcon, Subtitles, Layers, CheckCircle2, XCircle, X, FileWarning, Gauge, Archive, ChevronDown, Play } from 'lucide-react';
import { AnimeService } from '@/lib/api';
import { hpi } from '@/lib/hpi';
import { dpi } from '@/lib/dpi';
import { omni } from '@/lib/omni';
import { useDownloadEngine, formatBytes, formatSpeed, DownloadItem } from '@/lib/downloadEngine';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import JSZip from 'jszip';
import Footer from '@/components/Anime/Footer';

const api = new AnimeService();
const DEFAULT_REFERER = 'https://megacloud.blog/';

function safeFilename(title: string, epNum: string | number, extra?: string) {
  const base = `${title} - Ep ${epNum}${extra ? ` (${extra})` : ''}`;
  return base.replace(/[^a-z0-9\-_. ()]/gi, '_').slice(0, 150);
}

function extractQuality(text: string): string {
  if (!text) return "";
  const lower = text.toLowerCase();
  if (lower.includes("4k") || lower.includes("2160")) return "4K";
  if (lower.includes("1080")) return "1080p";
  if (lower.includes("720")) return "720p";
  if (lower.includes("480")) return "480p";
  if (lower.includes("360")) return "360p";
  return "";
}

function getUpdatedServerUrl(baseUrl: string, season: number, episode: number): string {
  try {
    const url = new URL(baseUrl);
    if (url.searchParams.has('season')) url.searchParams.set('season', season.toString());
    if (url.searchParams.has('s')) url.searchParams.set('s', season.toString());
    if (url.searchParams.has('episode')) url.searchParams.set('episode', episode.toString());
    if (url.searchParams.has('e')) url.searchParams.set('e', episode.toString());
    if (url.pathname.includes('/tv/')) {
      url.pathname = url.pathname.replace(/\/tv\/(.+?)-\d+-\d+$/, `/tv/$1-${season}-${episode}`);
    }
    return url.toString();
  } catch {
    return baseUrl;
  }
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
  const type = params.type as string; // 'anime', 'hindi', 'donghua', 'drama', 'movie'
  const id = params.id as string;
  const epId = searchParams.get('ep') || '1';
  const seasonParam = searchParams.get('season') || '1';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mediaTitle, setMediaTitle] = useState('Unknown');
  const [mediaImage, setMediaImage] = useState('');
  const [mediaEps, setMediaEps] = useState<any[]>([]);
  const [mediaSeasons, setMediaSeasons] = useState<any[]>([]);
  const [activeSeason, setActiveSeason] = useState<number>(parseInt(seasonParam));
  const [apiDownloadLinks, setApiDownloadLinks] = useState<any[]>([]);

  const [stream, setStream] = useState<any>(null);
  const [availableResolutions, setAvailableResolutions] = useState<string[]>([]);
  const [fetchingRes, setFetchingRes] = useState(false);

  const [resolvingEmbed, setResolvingEmbed] = useState(false);
  const [resolvedEmbed, setResolvedEmbed] = useState<{ url: string; type: 'hls' | 'mp4' } | null>(null);
  const [embedUnresolvable, setEmbedUnresolvable] = useState<string | null>(null);

  const [batchLoading, setBatchLoading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);

  const [adCountdown, setAdCountdown] = useState<number>(15);
  const [adFinished, setAdFinished] = useState<boolean>(false);

  const engine = useDownloadEngine();

  // Reset timer overlay whenever switching episodes, seasons, or media
  useEffect(() => {
    setAdCountdown(15);
    setAdFinished(false);
  }, [id, type, seasonParam, epId]);

  // Start 15s timer ONLY after page data is fully loaded (!loading)
  useEffect(() => {
    if (loading || adFinished) return;

    const interval = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setAdFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, adFinished, seasonParam, epId]);

  useEffect(() => {
    if (!id || !type) {
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
        } else if (type === 'movie') {
          details = await omni.movies.getDetail(id);
          const sNum = parseInt(seasonParam);
          const epNum = parseInt(epId);
          setActiveSeason(sNum);

          if (details?.downloadLinks && details.downloadLinks.length > 0) {
            setApiDownloadLinks(details.downloadLinks);
          }

          if (details?.seasons && details.seasons.length > 0) {
            setMediaSeasons(details.seasons);
            const activeSData = details.seasons.find((s: any) => s.seasonNumber === sNum) || details.seasons[0];
            const eps = activeSData.episodes && activeSData.episodes.length > 0
              ? activeSData.episodes
              : Array.from({ length: 24 }, (_, i) => ({ episodeNumber: i + 1, title: `Episode ${i + 1}` }));
            setMediaEps(eps);

            streamData = {
              servers: activeSData.sources.map((src: any) => ({
                name: src.name,
                url: getUpdatedServerUrl(src.url, sNum, epNum),
                type: 'embed'
              }))
            };
          } else {
            // Standalone Movie — no seasons or episode lists
            setMediaSeasons([]);
            setMediaEps([]);
            if (details?.streams && details.streams.length > 0) {
              streamData = {
                servers: details.streams.map((src: any) => ({
                  name: src.name,
                  url: src.url,
                  type: 'embed'
                }))
              };
            }
          }
        } else {
          throw new Error("Unknown media type");
        }

        setMediaTitle(details?.title || details?.name || 'Unknown');
        setMediaImage(details?.image || details?.poster || details?.cover || '');
        if (type !== 'movie') setMediaEps(details?.episodes || []);
        if (details?.downloadLinks && details.downloadLinks.length > 0) {
          setApiDownloadLinks(details.downloadLinks);
        }
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
  }, [type, id, epId, seasonParam]);

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
      setAvailableResolutions([]);
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

  const currentEpNum = mediaEps.find(e => e.id === epId || String(e.number || e.episodeNumber) === epId)?.number || epId || '1';
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
        const num = ep.number || ep.episodeNumber || 1;
        let epStream: any;
        if (type === 'anime') epStream = await AnimeService.getStream(ep.id).catch(() => null);
        else if (type === 'hindi') epStream = await hpi.hindi.getStream(ep.id).catch(() => null);
        else if (type === 'donghua') epStream = await dpi.getStream(ep.id).catch(() => null);
        else if (type === 'drama') epStream = await omni.drama.getStream(ep.embedUrl).catch(() => null);
        else if (type === 'movie' && mediaSeasons.length > 0) {
          const sData = mediaSeasons.find(s => s.seasonNumber === activeSeason) || mediaSeasons[0];
          epStream = { servers: sData.sources.map((src: any) => ({ name: src.name, url: getUpdatedServerUrl(src.url, activeSeason, num) })) };
        }

        const target = getDirectSourceUrl(epStream);
        if (target?.kind === 'mp4') {
          const fname = safeFilename(mediaTitle, num);
          content += `${window.location.origin}/api/download/file?url=${encodeURIComponent(target.url)}&referer=${encodeURIComponent(target.referer)}&filename=${encodeURIComponent(fname)}\n`;
        } else if (target?.kind === 'hls') {
          const fname = safeFilename(mediaTitle, num);
          content += `${window.location.origin}/api/download/hls?url=${encodeURIComponent(target.url)}&referer=${encodeURIComponent(target.referer)}&filename=${encodeURIComponent(fname)}\n`;
        } else if (epStream?.servers) {
          content += `# Episode ${num}\n`;
          for (const s of epStream.servers) {
            content += `${s.url}\n`;
          }
        }
      }

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeFilename(mediaTitle, activeSeason, 'batch-links')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Batch links generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate batch links.");
    } finally {
      setBatchLoading(false);
    }
  };

  const downloadSeasonZip = async () => {
    if (!mediaSeasons || mediaSeasons.length === 0) return;
    setZipLoading(true);
    toast.info(`Packaging Season ${activeSeason} files... Please wait`);
    try {
      const zip = new JSZip();
      const sData = mediaSeasons.find((s: any) => s.seasonNumber === activeSeason) || mediaSeasons[0];
      const folderName = `${mediaTitle} - Season ${activeSeason}`;
      const zipFolder = zip.folder(folderName);
      
      let manifestText = `# ${mediaTitle} - Season ${activeSeason} Master Package\n`;
      manifestText += `# Generated by Shadow Garden Engine\n\n`;

      const eps = sData.episodes && sData.episodes.length > 0
        ? sData.episodes
        : Array.from({ length: 24 }, (_, i) => ({ episodeNumber: i + 1, title: `Episode ${i + 1}` }));

      // Master offline player HTML for the entire season
      let masterHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${mediaTitle} - Season ${activeSeason}</title>
<style>body{margin:0;background:#050505;color:#fff;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-h:100vh;padding:20px;}
h1{font-size:24px;color:#f97316;margin-bottom:10px;} iframe{width:100%;max-width:960px;height:540px;border:none;border-radius:16px;background:#000;}
.eps{display:flex;flex-wrap:wrap;gap:8px;max-width:960px;margin-top:20px;}
button{padding:8px 16px;background:#222;color:#fff;border:1px solid #444;border-radius:8px;cursor:pointer;font-weight:bold;}
button:hover,button.active{background:#ea580c;border-color:#f97316;}</style></head><body>
<h1>${mediaTitle} - Season ${activeSeason}</h1>
<iframe id="player" src="" allowfullscreen></iframe>
<div class="eps">`;

      eps.forEach((ep: any, idx: number) => {
        const epNum = ep.episodeNumber || idx + 1;
        const epTitle = ep.title || `Episode ${epNum}`;
        const firstSrc = sData.sources?.[0] ? getUpdatedServerUrl(sData.sources[0].url, activeSeason, epNum) : '';
        masterHtml += `<button onclick="play('${firstSrc}', this)">Ep ${epNum}</button>`;
      });

      masterHtml += `</div><script>
function play(url, btn){
  document.getElementById('player').src = url;
  document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');
}
const firstBtn = document.querySelector('button');
if(firstBtn) firstBtn.click();
</script></body></html>`;

      zipFolder?.file(`PLAY_SEASON_${activeSeason}_OFFLINE.html`, masterHtml);

      for (const ep of eps) {
        const epNum = ep.episodeNumber || 1;
        const epTitle = ep.title || `Episode ${epNum}`;
        const fname = safeFilename(mediaTitle, epNum);

        let epSourcesText = `Episode ${epNum}: ${epTitle}\n`;
        epSourcesText += `==============================================\n\n`;

        sData.sources?.forEach((src: any) => {
          const finalUrl = getUpdatedServerUrl(src.url, activeSeason, epNum);
          epSourcesText += `Provider (${src.name}): ${finalUrl}\n`;
          manifestText += `Ep ${epNum} [${src.name}]: ${finalUrl}\n`;
        });

        zipFolder?.file(`Episode_${epNum}_${fname}_Links.txt`, epSourcesText);

        // Individual offline video player for this episode
        const firstEpUrl = sData.sources?.[0] ? getUpdatedServerUrl(sData.sources[0].url, activeSeason, epNum) : '';
        const singleHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${mediaTitle} Ep ${epNum}</title>
<style>body{margin:0;background:#050505;display:flex;align-items:center;justify-content:center;height:100vh;}
iframe{width:100vw;height:100vh;border:none;}</style></head><body>
<iframe src="${firstEpUrl}" allowfullscreen></iframe>
</body></html>`;
        zipFolder?.file(`Episode_${epNum}_Watch.html`, singleHtml);
      }

      zipFolder?.file(`MASTER_SEASON_${activeSeason}_MANIFEST.txt`, manifestText);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = `${safeFilename(mediaTitle, activeSeason, 'Season Package')}.zip`;
      a.click();
      toast.success(`Season ${activeSeason} Package downloaded!`);
    } catch (err: any) {
      console.error("Zip generation error:", err);
      toast.error("Failed to generate Season package.");
    } finally {
      setZipLoading(false);
    }
  };

  if (error || (!loading && !stream)) {
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
    <div className="min-h-screen bg-[#050505] text-gray-100 font-sans p-4 md:p-8 pt-20 relative">

      {/* ── 15-Second Ad Gateway Overlay ── */}
      {!adFinished && (
        <div className="fixed inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto">
          <div className="max-w-2xl w-full flex flex-col items-center text-center gap-6 my-auto">
            {/* Top Banner Ad Slot Placeholder */}
            <div id="ad-slot-header" className="w-full max-w-lg aspect-[728/90] bg-white/5 border border-dashed border-orange-500/30 rounded-2xl flex flex-col items-center justify-center p-3 text-zinc-500 text-[10px] font-mono tracking-widest">
              <span>[ ADVERTISEMENT SPACE - 728x90 BANNER ]</span>
              <span className="text-[9px] text-zinc-600">Google AdSense / PropellerAds / Adsterra Integration Ready</span>
            </div>

            {/* Main Countdown Header */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-900/40 animate-pulse">
                <Download size={28} className="text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white font-lemon tracking-tight">PREPARING DOWNLOAD LINKS</h2>
              <p className="text-xs text-zinc-400 max-w-md">
                {loading
                  ? `Loading download engine data for ${mediaTitle !== 'Unknown' ? mediaTitle : 'media'}...`
                  : `Please wait while our high-speed download engine verifies secure file mirrors for `}
                {!loading && <span className="text-orange-400 font-bold">{mediaTitle}</span>}
              </p>
            </div>

            {/* 15s Timer Bar */}
            <div className="w-full max-w-md bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-orange-400 flex items-center gap-1.5">
                  <Loader2 size={14} className="animate-spin" /> {loading ? 'Fetching Episode Data...' : 'Verifying File Mirrors'}
                </span>
                <span className="text-white font-mono text-base">{loading ? 'Loading...' : `${adCountdown}s`}</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-600 to-amber-400 transition-all duration-1000 ease-linear"
                  style={{ width: loading ? '10%' : `${((15 - adCountdown) / 15) * 100}%` }}
                />
              </div>
            </div>

            {/* Main Interstitial Ad Slot Placeholder */}
            <div id="ad-slot-main" className="w-full max-w-md aspect-[300/250] bg-white/5 border border-emerald-500/30 rounded-3xl flex flex-col items-center justify-center p-6 text-zinc-500 text-xs font-mono tracking-widest relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
              <span className="text-orange-400 font-bold mb-1">[ SPONSORED AD / INTERSTITIAL - 300x250 ]</span>
              <span className="text-[10px] text-zinc-500 max-w-xs leading-relaxed">High-converting Ad Unit Slot for direct monetization (PopAds, Native Banner, Direct Sponsor Ad)</span>
            </div>

            {/* Action Button */}
            <div className="flex items-center gap-3 w-full max-w-md">
              {loading ? (
                <button
                  disabled
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-zinc-500 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 cursor-wait">
                  <Loader2 size={16} className="animate-spin" /> Loading Media Data...
                </button>
              ) : adCountdown === 0 ? (
                <button
                  onClick={() => setAdFinished(true)}
                  className="w-full py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-orange-900/40 flex items-center justify-center gap-2 animate-bounce">
                  <span>GET DOWNLOAD LINKS</span>
                  <ArrowLeft size={16} className="rotate-180" />
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-zinc-500 font-black text-sm uppercase tracking-widest cursor-not-allowed">
                  Generating Links... ({adCountdown}s)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto">

        <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={16} /> <span className="text-sm font-bold tracking-widest uppercase">Back to Watch</span>
        </button>

        <div className="flex flex-col md:flex-row gap-8 items-start">

          <div className="w-48 shrink-0 relative rounded-2xl overflow-hidden shadow-2xl shadow-orange-900/20 border border-white/10 hidden md:block">
            <img src={mediaImage || '/images/no-poster.png'} alt="Poster" className="w-full aspect-[2/3] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
               <span className="text-orange-500 font-black text-2xl font-lemon">EP {currentEpNum}</span>
            </div>
          </div>

          <div className="flex-1 w-full">
            <h1 className="text-3xl md:text-5xl font-black text-white font-lemon tracking-tighter mb-2">{mediaTitle}</h1>
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm mb-8 flex items-center gap-2">
              <Download size={16} className="text-orange-600"/> Download Engine
            </p>

            {/* ── Seasons & Episodes Selector ── */}
            {mediaSeasons && mediaSeasons.length > 0 && (
              <div className="bg-[#0a0a0a] rounded-3xl p-6 border border-white/5 shadow-xl mb-8 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
                    <Layers size={16} className="text-orange-500" /> Select Season & Episode
                  </h3>
                  <span className="text-xs text-orange-400 font-bold uppercase">Season {activeSeason}</span>
                </div>

                {/* Season Pills */}
                <div className="flex flex-wrap gap-2 border-b border-white/5 pb-3">
                  {mediaSeasons.map((s: any) => (
                    <button key={s.seasonNumber}
                      onClick={() => router.push(`/download/${type}/${id}?season=${s.seasonNumber}&ep=1`)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all border",
                        activeSeason === s.seasonNumber
                          ? "bg-orange-600 text-white border-orange-500 shadow-md"
                          : "bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                      )}>
                      Season {s.seasonNumber}
                    </button>
                  ))}
                </div>

                {/* Episode List */}
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto no-scrollbar pt-1">
                  {mediaEps.map((ep: any) => {
                    const epNum = ep.number || ep.episodeNumber || 1;
                    const isActive = String(epNum) === String(currentEpNum);
                    return (
                      <button key={epNum}
                        onClick={() => router.push(`/download/${type}/${id}?season=${activeSeason}&ep=${epNum}`)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5",
                          isActive
                            ? "bg-orange-600 text-white border-orange-500 shadow-md"
                            : "bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                        )}>
                        <span>Ep {epNum}</span>
                        {ep.title && <span className="text-[10px] text-zinc-400 truncate max-w-[100px]">{ep.title}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              <div className="flex flex-col gap-6">

                {/* ── Direct API Download Links ── */}
                {apiDownloadLinks && apiDownloadLinks.length > 0 && (
                  <div className="bg-[#0a0a0a] rounded-3xl p-6 border border-emerald-500/40 shadow-xl flex flex-col gap-4 bg-gradient-to-b from-emerald-950/20 to-transparent">
                    <h3 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
                      <Download size={16} className="text-emerald-500" /> Direct API Download Links
                    </h3>
                    <p className="text-[10px] text-zinc-500 uppercase">Actual file download links retrieved directly from API:</p>
                    <div className="flex flex-col gap-2.5">
                      {apiDownloadLinks.map((link: any, idx: number) => {
                        const linkUrl = link.url || link.link || link.href;
                        const linkName = link.label || link.name || link.title || `Download Link ${idx + 1}`;
                        return (
                          <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/40 transition-all gap-3">
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-xs text-white truncate">{linkName}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                {link.quality && <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/30">{link.quality}</span>}
                                {link.language && <span className="text-[9px] font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-800/30">{link.language}</span>}
                                {link.size && <span className="text-[9px] font-bold text-zinc-400">{link.size}</span>}
                                {link.host && <span className="text-[9px] text-zinc-500 uppercase">{link.host}</span>}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(linkUrl);
                                  toast.success("Download link copied!");
                                }}
                                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase text-emerald-300 transition-all">
                                Copy Link
                              </button>
                              <a
                                href={linkUrl}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-wider transition-all shadow-md">
                                <span>Download</span>
                                <Download size={12} />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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

                {/* ── Direct API Download Options (All Resolutions) ── */}
                {apiDownloadLinks && apiDownloadLinks.length > 0 ? (
                  <div className="bg-[#0a0a0a] rounded-3xl p-6 border border-emerald-500/40 shadow-xl flex flex-col gap-4 bg-gradient-to-b from-emerald-950/20 to-transparent">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
                        <Download size={16} className="text-emerald-500" /> Available Download Resolutions
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/30 uppercase">
                        {apiDownloadLinks.length} Option{apiDownloadLinks.length > 1 ? 's' : ''} Available
                      </span>
                    </div>

                    <p className="text-[10px] text-zinc-400 uppercase">Select your preferred resolution or download server:</p>
                    
                    <div className="flex flex-col gap-3">
                      {apiDownloadLinks.map((link: any, idx: number) => {
                        const linkUrl = link.url || link.link || link.href;
                        const linkName = link.label || link.name || link.title || `Download Option ${idx + 1}`;
                        const q = link.quality || extractQuality(linkName);
                        return (
                          <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/40 transition-all gap-4 group">
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-xs text-white group-hover:text-emerald-300 transition-colors truncate">{linkName}</span>
                              <div className="flex items-center gap-2 mt-1">
                                {q && <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/40">{q}</span>}
                                {link.language && <span className="text-[9px] font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-800/30">{link.language}</span>}
                                {link.size && <span className="text-[9px] font-bold text-zinc-400">{link.size}</span>}
                                {link.host && <span className="text-[9px] text-zinc-500 uppercase">{link.host}</span>}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(linkUrl);
                                  toast.success("Download link copied!");
                                }}
                                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase text-emerald-300 transition-all">
                                Copy Link
                              </button>
                              <a
                                href={linkUrl}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-900/30">
                                <span>Download</span>
                                <Download size={12} />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  !mp4Target && !hlsTarget && !resolvingEmbed && (
                    <div className="bg-[#0a0a0a] rounded-3xl p-6 border border-white/5 shadow-xl text-center py-8">
                      <FileWarning className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                      <h4 className="text-white font-bold text-sm mb-1">Direct Download Options Fetching...</h4>
                      <p className="text-zinc-400 text-xs">If no direct links appear, you can still use the Batch Links Generator or Season ZIP Package on the right.</p>
                    </div>
                  )
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

                {/* ── Season ZIP Download Option ── */}
                {mediaSeasons && mediaSeasons.length > 0 && (
                  <div className="bg-[#0a0a0a] rounded-3xl p-6 border border-orange-500/30 shadow-xl bg-gradient-to-b from-orange-950/20 to-transparent">
                    <h3 className="text-white font-black uppercase tracking-widest mb-2 flex items-center gap-2"><Archive size={16} className="text-orange-500"/> Season {activeSeason} ZIP Package</h3>
                    <p className="text-xs text-zinc-400 mb-4 leading-relaxed">Download a complete ZIP package for Season {activeSeason} containing all {mediaEps.length} episode stream packages, individual link files, and master batch links.</p>

                    <button onClick={downloadSeasonZip} disabled={zipLoading} className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-900/30 disabled:opacity-50">
                      {zipLoading ? <Loader2 size={18} className="animate-spin"/> : <Archive size={18} />}
                      {zipLoading ? 'Generating Season ZIP...' : `Download Season ${activeSeason} (ZIP)`}
                    </button>
                  </div>
                )}

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
                  <h3 className="text-white font-black uppercase tracking-widest mb-2 flex items-center gap-2"><Layers size={16} className="text-purple-500"/> Batch Links Generator</h3>
                  <p className="text-xs text-zinc-400 mb-4 leading-relaxed">Generate a text file of stream links for all {mediaEps.length} episodes. Import into <strong>IDM</strong> or <strong>JDownloader</strong> for a full-series batch grab.</p>

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
      <div className="mt-16 border-t border-white/5 pt-8">
        <Footer />
      </div>
    </div>
  );
}

export default function DownloadClient() {
  return <Suspense fallback={<div className="w-full h-screen bg-[#050505]"/>}><DownloadContent /></Suspense>;
}
