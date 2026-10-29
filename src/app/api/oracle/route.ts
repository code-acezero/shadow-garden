import { NextRequest, NextResponse } from 'next/server';
import { checkRecentEpisodeAlerts, checkAllLibraryUpdates } from '@/lib/oracle-runner';

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('mode');

  if (mode === 'full') {
    const result = await checkAllLibraryUpdates();
    return NextResponse.json({ status: 'Oracle Full Library Check Complete', result });
  }

  // Default: Anikoto fast-match engine (checks freshly aired episodes in < 200ms)
  const result = await checkRecentEpisodeAlerts();
  return NextResponse.json({ status: 'Oracle Fast Match Check Complete', result });
}

export async function POST(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('mode');

  if (mode === 'full') {
    const result = await checkAllLibraryUpdates();
    return NextResponse.json({ status: 'Oracle Full Library Check Complete', result });
  }

  const result = await checkRecentEpisodeAlerts();
  return NextResponse.json({ status: 'Oracle Fast Match Check Complete', result });
}
