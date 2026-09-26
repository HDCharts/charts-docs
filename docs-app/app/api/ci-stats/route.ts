import { NextResponse } from 'next/server';
import { getCiStats } from '@/lib/ci-stats';

export const revalidate = 604800; // one week

export async function GET() {
  const result = await getCiStats();
  const cacheControl = result.error
    ? 'no-store'
    : 'public, s-maxage=604800, stale-while-revalidate=86400';

  return NextResponse.json(result, {
    status: result.error ? 503 : 200,
    headers: {
      'Cache-Control': cacheControl,
    },
  });
}
