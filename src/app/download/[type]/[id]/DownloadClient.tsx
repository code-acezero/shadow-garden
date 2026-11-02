"use client";

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { 
  Download, ArrowLeft, Loader2, ServerIcon, Subtitles, 
  Layers, CheckCircle2, XCircle, X, FileWarning, Gauge, 
  Archive, ExternalLink, Copy, SlidersHorizontal, FileText, Check, Film, Tv
} from 'lucide-react';
import { AnimeService } from '@/lib/api';
import { hpi } from '@/lib/hpi';
import { dpi } from '@/lib/dpi';
import { omni } from '@/lib/omni';
import { useDownloadEngine, formatBytes, formatSpeed, DownloadItem } from '@/lib/downloadEngine';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import JSZip from 'jszip';
import Footer from '@/components/Anime/Footer';
import { adManager } from '@/lib/adManager';
import AdsterraNativeBanner from '@/components/Ads/AdsterraNativeBanner';

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
    <div className="py-3 border-b border-white/5 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-white truncate">{item.label}</span>
        {item.status === 'downloading' && (
          <button onClick={onCancel} className="text-zinc-400 hover:text-red-400 shrink-0" title="Cancel">
            <X size={14} />
          </button>
        )}
        {item.status === 'done' && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
        {(item.status === 'error' || item.status === 'cancelled') && <XCircle size={16} className="text-red-400 shrink-0" />}
      </div>
      <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className={cn("h-full bg-primary-500 transition-all duration-300", pct === null && item.status === 'downloading' && "w-1/3")}
          style={pct !== null ? { width: `${pct}%` } : undefined}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
        <span>{formatBytes(item.receivedBytes)}{item.totalBytes ? ` / ${formatBytes(item.totalBytes)}` : ''}</span>
        {item.status === 'downloading' && (
          <span className="flex items-center gap-1 text-primary-400">
            <Gauge size={10} />{formatSpeed(item.speedBps)}
          </span>
        )}
        {item.status === 'error' && <span className="text-red-400">{item.error}</span>}
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
  const [mediaInfo, setMediaInfo] = useState<any>(null);
  const [activeSeason, setActiveSeason] = useState<number>(parseInt(seasonParam));
  const [apiDownloadLinks, setApiDownloadLinks] = useState<any[]>([]);

  const [stream, setStream] = useState<any>(null);
  const [selectedAudio, setSelectedAudio] = useState<string>('sub');
  const [selectedResolution, setSelectedResolution] = useState<string>('1080');
  const [selectedSubtitleUrl, setSelectedSubtitleUrl] = useState<string>('');
  const [availableResolutions, setAvailableResolutions] = useState<string[]>([]);
  const [fetchingRes, setFetchingRes] = useState(false);

  const [resolvingEmbed, setResolvingEmbed] = useState(false);
  const [resolvedEmbed, setResolvedEmbed] = useState<{ url: string; type: 'hls' | 'mp4' } | null>(null);
  const [embedUnresolvable, setEmbedUnresolvable] = useState<string | null>(null);

  const [batchLoading, setBatchLoading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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

  function getDirectSourceUrl(streamData: any): { kind: 'mp4' | 'hls' | 'unresolved-embed'; url: string; referer: string } | null {
    if (!streamData) return null;
    const referer = streamData.referer || DEFAULT_REFERER;

    if (streamData.hlsUrl) {
      return { kind: 'hls', url: streamData.hlsUrl, referer: streamData.referer || referer };
    }

    if (streamData.url) {
      const lower = streamData.url.toLowerCase();
      if (lower.includes('.mp4')) return { kind: 'mp4', url: streamData.url, referer };
      if (streamData.isM3U8 || lower.includes('.m3u8')) return { kind: 'hls', url: streamData.url, referer };
    }

    if (streamData.targetUrl) {
      const lower = streamData.targetUrl.toLowerCase();
      if (lower.includes('.mp4')) return { kind: 'mp4', url: streamData.targetUrl, referer };
      if (streamData.isM3U8 || lower.includes('.m3u8')) return { kind: 'hls', url: streamData.targetUrl, referer };
    }

    if (streamData.activeServer?.url) {
      const act = streamData.activeServer;
      const lower = act.url.toLowerCase();
      if (act.type === 'mp4' || lower.includes('.mp4')) return { kind: 'mp4', url: act.url, referer: act.referer || referer };
      if (act.type === 'm3u8' || act.type === 'hls' || lower.includes('.m3u8')) return { kind: 'hls', url: act.url, referer: act.referer || referer };
    }

    const servers = streamData.servers;
    const flatServers: any[] = Array.isArray(servers)
      ? servers
      : [
          ...(servers?.sub || []),
          ...(servers?.dub || []),
          ...(servers?.en || []),
          ...(servers?.jp || []),
          ...(servers?.hi || []),
          ...(servers?.sources || []),
          ...(servers?.ogServers || []),
          ...(servers?.multiServers || []),
        ];

    const mp4Server = flatServers.find(s => (s.url || '').toLowerCase().includes('.mp4') || s.type === 'mp4');
    if (mp4Server?.url) return { kind: 'mp4', url: mp4Server.url, referer: mp4Server.referer || referer };

    const hlsServer = flatServers.find(s => s.type === 'hls' || s.type === 'm3u8' || (s.url || '').toLowerCase().includes('.m3u8'));
    if (hlsServer?.url) return { kind: 'hls', url: hlsServer.url, referer: hlsServer.referer || referer };

    const embedUrl = streamData.iframeUrl || streamData.iframe || flatServers[0]?.url;
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
      const sorted = Array.from(resSet).sort((a, b) => parseInt(b) - parseInt(a));
      setAvailableResolutions(sorted);
      if (sorted.length > 0) {
        setSelectedResolution(sorted[0]);
      }
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
    } catch {
      setEmbedUnresolvable('This source is embed-only and cannot be captured for download.');
    } finally {
      setResolvingEmbed(false);
    }
  };

  useEffect(() => {
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
          const epList = details?.episodes || [];
          const currentEp = epList.find((e: any) =>
            e.id === epId ||
            e.id?.endsWith(`?ep=${epId}`) ||
            e.id?.endsWith(`::${epId}`) ||
            String(e.number) === epId
          ) || epList[0];
          const currentEpNum = currentEp?.number || 1;
          const targetEpId = `${id}::${currentEpNum}`;
          const streamOpts = {
            malId: currentEp?.malId || details?.malId,
            title: details?.title,
            countryOfOrigin: details?.countryOfOrigin,
            hasDub: (details?.stats?.episodes?.dub ?? 0) > 0,
          };
          streamData = await AnimeService.getStream(targetEpId, 'MegaCloud', selectedAudio as any, streamOpts);
        } else if (type === 'hindi') {
          details = await hpi.hindi.getDetails(id);
          const epList = details?.episodes || [];
          const currentEp = epList.find((e: any) => e.id === epId || String(e.number) === epId) || epList[0];
          const targetEpId = currentEp?.id || epId;
          streamData = await hpi.hindi.getStream(targetEpId);
        } else if (type === 'donghua') {
          details = await dpi.bridge.getSmartDetails(id);
          const epList = details?.episodes || [];
          const currentEp = epList.find((e: any) => e.id === epId || String(e.number) === epId) || epList[0];
          const targetEpId = currentEp?.id || epId;
          streamData = await dpi.getStream(targetEpId);
        } else if (type === 'drama') {
          details = await omni.drama.getDetail(id);
          const epList = details?.episodes || [];
          const currentEp = epList.find((e: any) => e.id === epId || String(e.number) === epId) || epList[0];
          if (currentEp?.embedUrl) {
            streamData = await omni.drama.getStream(
              currentEp.embedUrl,
              id,
              currentEp.season || 1,
              currentEp.number || 1,
              false,
              details?.title
            );
          }
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

        setMediaInfo(details);
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

  const changeAudioTrack = async (audioKey: string) => {
    setSelectedAudio(audioKey);
    setLoading(true);
    try {
      if (type === 'anime') {
        const epList = mediaEps;
        const currentEp = epList.find((e: any) =>
          e.id === epId ||
          e.id?.endsWith(`?ep=${epId}`) ||
          e.id?.endsWith(`::${epId}`) ||
          String(e.number) === epId
        ) || epList[0];
        const num = currentEp?.number || 1;
        const targetEpId = `${id}::${num}`;
        const streamOpts = {
          malId: currentEp?.malId || mediaInfo?.malId,
          title: mediaInfo?.title,
          countryOfOrigin: mediaInfo?.countryOfOrigin,
          hasDub: (mediaInfo?.stats?.episodes?.dub ?? 0) > 0,
        };
        const newStream = await AnimeService.getStream(targetEpId, 'MegaCloud', audioKey as any, streamOpts);
        setStream(newStream);
        const directUrl = getDirectSourceUrl(newStream);
        if (directUrl?.kind === 'hls') {
          fetchResolutions(directUrl.url, directUrl.referer);
        } else if (directUrl?.kind === 'unresolved-embed' && directUrl.url) {
          resolveEmbed(directUrl.url, directUrl.referer);
        }
      }
    } catch (err) {
      console.error("Audio change error:", err);
      toast.error("Failed to load audio stream.");
    } finally {
      setLoading(false);
    }
  };

  const matchedEp = mediaEps.find((e: any) =>
    e.id === epId ||
    e.id?.endsWith(`?ep=${epId}`) ||
    e.id?.endsWith(`::${epId}`) ||
    e.id?.includes(`ep=${epId}`) ||
    String(e.number || e.episodeNumber) === epId
  ) || mediaEps[0];
  const currentEpNum = matchedEp?.number || matchedEp?.episodeNumber || (epId.length > 5 ? '1' : epId) || '1';
  const directSource = getDirectSourceUrl(stream);
  const referer = directSource?.referer || DEFAULT_REFERER;
  const subs: any[] = stream?.subtitles || stream?.tracks || [];

  // Auto-select English subtitle by default
  useEffect(() => {
    if (subs && subs.length > 0) {
      const eng = subs.find((s: any) => 
        (s.label || s.lang || '').toLowerCase().includes('eng') ||
        (s.label || s.lang || '').toLowerCase().includes('en')
      ) || subs[0];
      const url = eng?.url || eng?.file || '';
      if (url && !selectedSubtitleUrl) {
        setSelectedSubtitleUrl(url);
      }
    }
  }, [subs, selectedSubtitleUrl]);

  const activeItems = Object.values(engine.items).sort((a, b) => (b.id > a.id ? 1 : -1));
  const hlsTarget = resolvedEmbed?.type === 'hls' ? resolvedEmbed.url : (directSource?.kind === 'hls' ? directSource.url : null);
  const mp4Target = resolvedEmbed?.type === 'mp4' ? resolvedEmbed.url : (directSource?.kind === 'mp4' ? directSource.url : null);

  // Build Primary MP4 URL (with soft subtitle injection if available)
  const primaryDlUrl = useMemo(() => {
    if (hlsTarget) {
      const dlFilename = safeFilename(mediaTitle, currentEpNum, `${selectedResolution}p`);
      const params = new URLSearchParams({
        url: hlsTarget,
        referer,
        filename: dlFilename,
        res: selectedResolution,
        format: 'mp4',
      });
      if (selectedSubtitleUrl) {
        params.set('sub', selectedSubtitleUrl);
      }
      return `/api/download/hls?${params.toString()}`;
    }
    if (mp4Target) {
      const dlFilename = safeFilename(mediaTitle, currentEpNum);
      return `/api/download/file?url=${encodeURIComponent(mp4Target)}&referer=${encodeURIComponent(referer)}&filename=${encodeURIComponent(dlFilename)}`;
    }
    return null;
  }, [hlsTarget, mp4Target, mediaTitle, currentEpNum, selectedResolution, selectedSubtitleUrl, referer]);

  // Build Pure Direct Stream URL (raw passthrough without remux)
  const directStreamUrl = useMemo(() => {
    if (hlsTarget) {
      const dlFilename = safeFilename(mediaTitle, currentEpNum, `${selectedResolution}p`);
      return `/api/download/hls?url=${encodeURIComponent(hlsTarget)}&referer=${encodeURIComponent(referer)}&filename=${encodeURIComponent(dlFilename)}&res=${selectedResolution}&format=ts`;
    }
    if (mp4Target) {
      const dlFilename = safeFilename(mediaTitle, currentEpNum);
      return `/api/download/file?url=${encodeURIComponent(mp4Target)}&referer=${encodeURIComponent(referer)}&filename=${encodeURIComponent(dlFilename)}`;
    }
    return null;
  }, [hlsTarget, mp4Target, mediaTitle, currentEpNum, selectedResolution, referer]);

  const handleCopyPrimaryLink = () => {
    if (!primaryDlUrl) return;
    const fullUrl = `${window.location.origin}${primaryDlUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    toast.success("Download URL copied to clipboard");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const startInAppMeter = () => {
    if (!primaryDlUrl) return;
    adManager.triggerSmartlink('download_meter');
    engine.start({
      id: `${mediaTitle}-${currentEpNum}-${Date.now()}`,
      label: `${mediaTitle} · Ep ${currentEpNum} (${selectedResolution}p)`,
      filename: `${safeFilename(mediaTitle, currentEpNum, `${selectedResolution}p`)}.mp4`,
      url: primaryDlUrl,
    });
  };

  const downloadBatch = async () => {
    if (!mediaEps.length) return;
    setBatchLoading(true);
    try {
      let content = `# Batch Download Links for ${mediaTitle}\n`;
      content += `# Generated by Kagemi Shadow Garden\n`;
      content += `# Direct proxy links (Header-authenticated)\n\n`;

      for (const ep of mediaEps) {
        const num = ep.number || ep.episodeNumber || 1;
        let epStream: any;
        if (type === 'anime') {
          epStream = await AnimeService.getStream(
            `${id}::${num}`,
            'MegaCloud',
            selectedAudio as any,
            {
              malId: ep.malId || mediaInfo?.malId,
              title: mediaInfo?.title,
              countryOfOrigin: mediaInfo?.countryOfOrigin,
            }
          ).catch(() => null);
        } else if (type === 'hindi') {
          const epTarget = ep.id || `${id}::${num}`;
          epStream = await hpi.hindi.getStream(epTarget).catch(() => null);
        } else if (type === 'donghua') {
          const epTarget = ep.id || String(num);
          epStream = await dpi.getStream(epTarget).catch(() => null);
        } else if (type === 'drama') {
          if (ep.embedUrl) {
            epStream = await omni.drama.getStream(ep.embedUrl, id, ep.season || 1, num, false, mediaTitle).catch(() => null);
          }
        } else if (type === 'movie' && mediaSeasons.length > 0) {
          const sData = mediaSeasons.find(s => s.seasonNumber === activeSeason) || mediaSeasons[0];
          epStream = { servers: sData.sources.map((src: any) => ({ name: src.name, url: getUpdatedServerUrl(src.url, activeSeason, num) })) };
        }

        const target = getDirectSourceUrl(epStream);
        if (target?.kind === 'mp4') {
          const fname = safeFilename(mediaTitle, num);
          content += `${window.location.origin}/api/download/file?url=${encodeURIComponent(target.url)}&referer=${encodeURIComponent(target.referer)}&filename=${encodeURIComponent(fname)}\n`;
        } else if (target?.kind === 'hls') {
          const fname = safeFilename(mediaTitle, num);
          content += `${window.location.origin}/api/download/hls?url=${encodeURIComponent(target.url)}&referer=${encodeURIComponent(target.referer)}&filename=${encodeURIComponent(fname)}&format=mp4\n`;
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
      toast.success("Batch links list generated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate batch links");
    } finally {
      setBatchLoading(false);
    }
  };

  const downloadSeasonZip = async () => {
    if (!mediaSeasons || mediaSeasons.length === 0) return;
    setZipLoading(true);
    toast.info(`Generating Season ${activeSeason} package...`);
    try {
      const zip = new JSZip();
      const sData = mediaSeasons.find((s: any) => s.seasonNumber === activeSeason) || mediaSeasons[0];
      const folderName = `${mediaTitle} - Season ${activeSeason}`;
      const zipFolder = zip.folder(folderName);

      const eps = sData.episodes && sData.episodes.length > 0
        ? sData.episodes
        : Array.from({ length: 24 }, (_, i) => ({ episodeNumber: i + 1, title: `Episode ${i + 1}` }));

      let masterHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${mediaTitle} - Season ${activeSeason}</title>
<style>body{margin:0;background:#050505;color:#fff;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:20px;}
h1{font-size:20px;color:#a855f7;margin-bottom:12px;} iframe{width:100%;max-width:960px;height:540px;border:none;border-radius:16px;background:#000;}
.eps{display:flex;flex-wrap:wrap;gap:8px;max-width:960px;margin-top:20px;}
button{padding:8px 16px;background:#18181b;color:#fff;border:1px solid #27272a;border-radius:8px;cursor:pointer;font-weight:bold;}
button:hover,button.active{background:#9333ea;border-color:#a855f7;}</style></head><body>
<h1>${mediaTitle} - Season ${activeSeason}</h1>
<iframe id="player" src="" allowfullscreen></iframe>
<div class="eps">`;

      eps.forEach((ep: any, idx: number) => {
        const epNum = ep.episodeNumber || idx + 1;
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

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Season package generated");
    } catch (e) {
      console.error(e);
      toast.error("Failed to package season ZIP");
    } finally {
      setZipLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#07070a] text-zinc-100 font-sans px-2 sm:px-4 md:px-6 py-6 relative">

      {/* ── 15-Second Ad Gateway Overlay ── */}
      {!adFinished && (
        <div className="fixed inset-0 z-50 bg-[#07070a] flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto">
          <div className="w-full flex flex-col items-center text-center gap-6 my-auto max-w-lg">
            <div className="w-full">
              <AdsterraNativeBanner location="download" format="728x90" />
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center mb-1">
                <Download size={22} />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">PREPARING DOWNLOAD</h2>
              <p className="text-xs text-zinc-400">
                {loading ? 'Fetching media stream sources...' : mediaTitle}
              </p>
            </div>

            {/* Countdown Bar */}
            <div className="w-full flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Loader2 size={13} className="animate-spin text-primary-400" /> 
                  {loading ? 'Resolving...' : 'Securing mirrors'}
                </span>
                <span className="text-white font-mono">{loading ? '...' : `${adCountdown}s`}</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-1000 ease-linear"
                  style={{ width: loading ? '15%' : `${((15 - adCountdown) / 15) * 100}%` }}
                />
              </div>
            </div>

            {/* Action Button */}
            <div className="w-full">
              {loading ? (
                <button
                  disabled
                  className="w-full py-3.5 rounded-xl bg-white/5 text-zinc-500 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-wait">
                  <Loader2 size={14} className="animate-spin" /> Loading Media...
                </button>
              ) : adCountdown === 0 ? (
                <button
                  onClick={() => {
                    adManager.triggerSmartlink('download_gateway');
                    setAdFinished(true);
                  }}
                  className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-primary-900/40">
                  <span>Continue to Download</span>
                  <ArrowLeft size={14} className="rotate-180" />
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3.5 rounded-xl bg-white/5 text-zinc-500 font-bold text-xs uppercase tracking-wider cursor-not-allowed">
                  Ready in {adCountdown}s
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Top Header Navigation ── */}
      <div className="w-full flex items-center justify-between mb-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider py-1.5 pr-3 rounded-lg"
        >
          <ArrowLeft size={15} />
          <span>Back to Watch</span>
        </button>

        <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
          Shadow Garden Engine
        </span>
      </div>

      {/* ── Symmetrical Parallel Main Grid ── */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">

        {/* ════ LEFT COLUMN: Media Details & Dropdown Selectors ════ */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* Media Header Cardless Showcase */}
          <div className="flex gap-4 sm:gap-5 items-start">
            <div className="w-24 sm:w-28 shrink-0 relative rounded-xl overflow-hidden bg-zinc-900 aspect-[2/3] shadow-md shadow-black/40">
              <img
                src={mediaImage || '/images/no-poster.png'}
                alt={mediaTitle}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = '/images/no-poster.png'; }}
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary-400">
                    {type.toUpperCase()}
                  </span>
                  <span className="text-zinc-600 text-xs">·</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    {mediaSeasons.length > 0 ? `S${activeSeason} ` : ''}EP {currentEpNum}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight line-clamp-2 leading-tight">
                  {mediaTitle}
                </h1>
              </div>

              <div className="mt-3 flex items-center gap-3 text-xs text-zinc-400">
                {mediaEps.length > 0 && (
                  <span>{mediaEps.length} Available Episodes</span>
                )}
                {type === 'movie' && mediaEps.length === 0 && (
                  <span>Full Movie</span>
                )}
              </div>
            </div>
          </div>

          <div className="h-[1px] w-full bg-white/5 my-1" />

          {/* Dropdown Selectors (Minimalist, No Heavy Bordered Boxes) */}
          <div className="flex flex-col gap-4">

            {/* 1. Episode Dropdown (Replaces long button rows) */}
            {mediaEps && mediaEps.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>Episode Selection</span>
                  <span className="text-primary-400">{mediaEps.length} Episodes</span>
                </label>
                <div className="relative">
                  <select
                    value={currentEpNum}
                    onChange={(e) => {
                      const nextEp = e.target.value;
                      router.push(`/download/${type}/${id}?season=${activeSeason}&ep=${nextEp}`);
                    }}
                    className="w-full appearance-none bg-zinc-900/80 hover:bg-zinc-900 text-white font-medium text-xs rounded-xl px-3.5 py-3 pr-10 outline-none transition-colors cursor-pointer"
                  >
                    {mediaEps.map((ep: any) => {
                      const epNum = ep.number || ep.episodeNumber || 1;
                      const title = ep.title ? ` - ${ep.title}` : '';
                      return (
                        <option key={ep.id || epNum} value={epNum} className="bg-zinc-900 text-white">
                          Episode {epNum}{title}
                        </option>
                      );
                    })}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-zinc-400">
                    <Layers size={14} />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Season Dropdown (If Multi-Season) */}
            {mediaSeasons && mediaSeasons.length > 1 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Season
                </label>
                <div className="relative">
                  <select
                    value={activeSeason}
                    onChange={(e) => {
                      const nextS = e.target.value;
                      router.push(`/download/${type}/${id}?season=${nextS}&ep=1`);
                    }}
                    className="w-full appearance-none bg-zinc-900/80 hover:bg-zinc-900 text-white font-medium text-xs rounded-xl px-3.5 py-3 pr-10 outline-none transition-colors cursor-pointer"
                  >
                    {mediaSeasons.map((s: any) => (
                      <option key={s.seasonNumber} value={s.seasonNumber} className="bg-zinc-900 text-white">
                        Season {s.seasonNumber}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-zinc-400">
                    <Film size={14} />
                  </div>
                </div>
              </div>
            )}

            {/* 3. Audio Track Dropdown */}
            {stream?.audioTracks && stream.audioTracks.length > 1 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Audio Track
                </label>
                <div className="relative">
                  <select
                    value={selectedAudio}
                    onChange={(e) => changeAudioTrack(e.target.value)}
                    className="w-full appearance-none bg-zinc-900/80 hover:bg-zinc-900 text-white font-medium text-xs rounded-xl px-3.5 py-3 pr-10 outline-none transition-colors cursor-pointer"
                  >
                    {stream.audioTracks.map((tr: any) => (
                      <option key={tr.id} value={tr.id} className="bg-zinc-900 text-white">
                        {tr.label || tr.language || tr.id.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-zinc-400">
                    <SlidersHorizontal size={14} />
                  </div>
                </div>
              </div>
            )}

            {/* 4. Target Video Quality Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <span>Video Resolution</span>
                {fetchingRes && <span className="text-primary-400 text-[10px]">Scanning...</span>}
              </label>
              <div className="relative">
                <select
                  value={selectedResolution}
                  onChange={(e) => setSelectedResolution(e.target.value)}
                  className="w-full appearance-none bg-zinc-900/80 hover:bg-zinc-900 text-white font-medium text-xs rounded-xl px-3.5 py-3 pr-10 outline-none transition-colors cursor-pointer"
                >
                  {(availableResolutions.length > 0 ? availableResolutions : ['1080', '720', '480']).map((res) => (
                    <option key={res} value={res} className="bg-zinc-900 text-white">
                      {res}p {res === '1080' ? 'Full HD' : res === '720' ? 'HD' : 'SD'}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-zinc-400">
                  <Tv size={14} />
                </div>
              </div>
            </div>

            {/* 5. Subtitle Injected Track Dropdown */}
            {subs && subs.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>Subtitle Track (Injected)</span>
                  <span className="text-zinc-500 text-[10px]">Soft Subtitles</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedSubtitleUrl}
                    onChange={(e) => setSelectedSubtitleUrl(e.target.value)}
                    className="w-full appearance-none bg-zinc-900/80 hover:bg-zinc-900 text-white font-medium text-xs rounded-xl px-3.5 py-3 pr-10 outline-none transition-colors cursor-pointer"
                  >
                    {subs.map((s: any, idx: number) => {
                      const url = s.url || s.file;
                      if (!url) return null;
                      return (
                        <option key={idx} value={url} className="bg-zinc-900 text-white">
                          {s.label || s.lang || `Track ${idx + 1}`}
                        </option>
                      );
                    })}
                    <option value="" className="bg-zinc-900 text-zinc-400">
                      None (Raw Video Only)
                    </option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-zinc-400">
                    <Subtitles size={14} />
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* ════ RIGHT COLUMN: Actions & Parallel Download Deck ════ */}
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* Resolving State Banner */}
          {resolvingEmbed && (
            <div className="flex items-center gap-2.5 py-4 text-zinc-400 text-xs font-medium">
              <Loader2 size={16} className="animate-spin text-primary-400 shrink-0" />
              <span>Resolving embed stream source for direct capture...</span>
            </div>
          )}

          {/* Embed Fallback */}
          {!hlsTarget && !mp4Target && !resolvingEmbed && embedUnresolvable && (
            <div className="py-6 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase">
                <FileWarning size={16} /> Protected Stream
              </div>
              <p className="text-xs text-zinc-400">{embedUnresolvable}</p>
              {stream?.url && (
                <a
                  href={stream.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 font-bold uppercase">
                  <span>Open Embedded Player</span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          )}

          {/* ── Primary Action: Download MP4 (Subtitles Injected) ── */}
          {(hlsTarget || mp4Target) && (
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Primary Download
              </span>

              {/* Big High-Priority Download Button */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <a
                  href={primaryDlUrl || '#'}
                  download
                  onClick={() => adManager.triggerSmartlink('download_mp4_injected')}
                  className="flex-1 py-4 px-5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-primary-900/30 flex items-center justify-between active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <Download size={18} />
                    <div className="flex flex-col text-left">
                      <span className="leading-tight">Download MP4</span>
                      <span className="text-[10px] text-primary-200 font-normal">
                        {selectedSubtitleUrl ? 'Soft subtitles injected' : 'Direct MP4 container'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-black/30 px-2.5 py-1 rounded-lg text-white">
                    <span>{selectedResolution}p</span>
                    <span>·</span>
                    <span>MP4</span>
                  </div>
                </a>

                {/* Secondary Fast Action: In-App Meter Stream */}
                <button
                  type="button"
                  onClick={startInAppMeter}
                  className="py-4 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
                  title="Download in browser with live speed tracker"
                >
                  <Gauge size={15} />
                  <span>Live Meter</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Secondary Parallel Actions ── */}
          {(hlsTarget || mp4Target) && (
            <div className="flex flex-col gap-2.5 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Alternative Actions
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* 1. Direct Video Passthrough */}
                <a
                  href={directStreamUrl || '#'}
                  download
                  onClick={() => adManager.triggerSmartlink('download_direct')}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors text-xs font-medium"
                >
                  <div className="flex items-center gap-2">
                    <ServerIcon size={14} className="text-zinc-400" />
                    <span>Raw Video Passthrough</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">TS / Raw</span>
                </a>

                {/* 2. Copy Download Link */}
                <button
                  type="button"
                  onClick={handleCopyPrimaryLink}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors text-xs font-medium"
                >
                  <div className="flex items-center gap-2">
                    {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-zinc-400" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Direct URL'}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">IDM / aria2</span>
                </button>

                {/* 3. Companion Subtitle File (.vtt) */}
                {selectedSubtitleUrl && (
                  <a
                    href={selectedSubtitleUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors text-xs font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <Subtitles size={14} className="text-blue-400" />
                      <span>Download Subtitle File</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">VTT</span>
                  </a>
                )}

                {/* 4. Batch Links (.txt) */}
                {mediaEps.length > 0 && (
                  <button
                    type="button"
                    onClick={downloadBatch}
                    disabled={batchLoading}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors text-xs font-medium disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      {batchLoading ? <Loader2 size={14} className="animate-spin text-purple-400" /> : <FileText size={14} className="text-purple-400" />}
                      <span>{batchLoading ? 'Generating...' : 'Batch Episode Links'}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">TXT</span>
                  </button>
                )}

                {/* 5. Season ZIP Package (if series) */}
                {mediaSeasons.length > 0 && (
                  <button
                    type="button"
                    onClick={downloadSeasonZip}
                    disabled={zipLoading}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors text-xs font-medium disabled:opacity-50 sm:col-span-2"
                  >
                    <div className="flex items-center gap-2">
                      {zipLoading ? <Loader2 size={14} className="animate-spin text-amber-400" /> : <Archive size={14} className="text-amber-400" />}
                      <span>{zipLoading ? 'Compiling ZIP package...' : `Download Full Season ${activeSeason} Archive`}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">ZIP</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Direct API File Mirrors (If provided by scraper) ── */}
          {apiDownloadLinks && apiDownloadLinks.length > 0 && (
            <div className="flex flex-col gap-2 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Direct Host Mirrors
              </span>

              <div className="flex flex-col gap-1.5">
                {apiDownloadLinks.map((link: any, idx: number) => {
                  const linkUrl = link.url || link.link || link.href;
                  const linkName = link.label || link.name || link.title || `Mirror ${idx + 1}`;
                  const q = link.quality || extractQuality(linkName);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Download size={14} className="text-emerald-400 shrink-0" />
                        <span className="text-xs font-medium text-white truncate">{linkName}</span>
                        {q && <span className="text-[9px] font-bold text-emerald-400 uppercase">{q}</span>}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(linkUrl);
                            toast.success("Link copied");
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Copy Link"
                        >
                          <Copy size={13} />
                        </button>
                        <a
                          href={linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold uppercase transition-colors"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Active In-App Downloads Meter ── */}
          {activeItems.length > 0 && (
            <div className="flex flex-col gap-2 pt-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Gauge size={13} className="text-primary-400" /> Active Downloads
              </span>
              <div className="flex flex-col">
                {activeItems.map((item) => (
                  <ProgressRow key={item.id} item={item} onCancel={() => engine.cancel(item.id)} />
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      <div className="mt-20 border-t border-white/5 pt-8">
        <Footer />
      </div>
    </div>
  );
}

export default function DownloadClient() {
  return (
    <Suspense fallback={<div className="w-full h-screen bg-[#07070a]" />}>
      <DownloadContent />
    </Suspense>
  );
}
