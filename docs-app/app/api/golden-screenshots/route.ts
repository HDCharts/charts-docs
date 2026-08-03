import { NextResponse } from 'next/server';
import { getGoldenScreenshots } from './github';

export const revalidate = 900;

export async function GET() {
  const result = await getGoldenScreenshots();
  const cacheControl = result.error
    ? 'no-store'
    : 'public, s-maxage=900, stale-while-revalidate=3600';

  return NextResponse.json(result, {
    status: result.error ? 503 : 200,
    headers: {
      'Cache-Control': cacheControl,
    },
  });
}
