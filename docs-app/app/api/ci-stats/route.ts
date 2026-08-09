import { NextResponse } from 'next/server';
import { getCiStats } from './github';

export const revalidate = 3600;

export async function GET() {
  const result = await getCiStats();
  const cacheControl = result.error
    ? 'no-store'
    : 'public, s-maxage=3600, stale-while-revalidate=86400';

  return NextResponse.json(result, {
    status: result.error ? 503 : 200,
    headers: {
      'Cache-Control': cacheControl,
    },
  });
}
