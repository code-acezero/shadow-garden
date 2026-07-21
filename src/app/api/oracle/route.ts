import { NextResponse } from 'next/server';
import { checkAllLibraryUpdates } from '@/lib/oracle-runner';

export async function GET() {
  const result = await checkAllLibraryUpdates();
  return NextResponse.json({ status: 'Oracle Multi-Library Check Complete', result });
}

export async function POST() {
  const result = await checkAllLibraryUpdates();
  return NextResponse.json({ status: 'Oracle Multi-Library Check Complete', result });
}