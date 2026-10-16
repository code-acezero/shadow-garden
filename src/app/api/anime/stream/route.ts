// src/app/api/anime/stream/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { resolveUnifiedStreams } from '@/lib/extractors/streamExtractor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const malId = searchParams.get('malId') || searchParams.get('idMal');
    const title = searchParams.get('title') || '';
    const ep = searchParams.get('ep') || '1';
    const country = searchParams.get('country') || 'JP';
    const hasDub = searchParams.get('hasDub') === 'true';
    const requestedAudio = searchParams.get('audio') || ''; // 'jp' | 'en' | 'hi' | 'cn'
    const requestedServer = searchParams.get('server') || '';

    if (!malId && !title) {
      return NextResponse.json(
        { ok: false, error: 'Missing malId or title query parameter' },
        { status: 400 }
      );
    }

    const unifiedResult = await resolveUnifiedStreams({
      malId: malId ? parseInt(malId, 10) : undefined,
      title,
      episode: ep,
      countryOfOrigin: country,
      knownHasDub: hasDub
    });

    // Determine active audio track
    const nativeSubTrack = unifiedResult.audioTracks[0]?.id || 'jp';
    const activeAudio = (requestedAudio === 'sub' || !requestedAudio) 
      ? nativeSubTrack 
      : (['jp', 'cn', 'kr'].includes(requestedAudio) ? nativeSubTrack : requestedAudio);
    const availableForAudio = unifiedResult.servers[activeAudio] || [];

    const excludeServers = (searchParams.get('exclude') || '')
      .toLowerCase()
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // Find requested or default server (skipping excluded/failed servers if possible)
    let selectedServer = availableForAudio.find(
      s => s.serverName.toLowerCase() === requestedServer.toLowerCase() && !excludeServers.includes(s.serverName.toLowerCase())
    );
    if (!selectedServer && availableForAudio.length > 0) {
      selectedServer = availableForAudio.find(
        s => !excludeServers.includes(s.serverName.toLowerCase())
      ) || availableForAudio[0];
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...unifiedResult,
        activeAudio,
        activeServer: selectedServer || null,
        url: selectedServer?.url || null,
        isM3U8: selectedServer ? selectedServer.type === 'm3u8' : true,
        referer: selectedServer?.referer || null
      }
    });
  } catch (error: any) {
    console.error('[API /api/anime/stream] Error:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to extract stream' },
      { status: 500 }
    );
  }
}
