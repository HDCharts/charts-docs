import { buildSearchIndex } from '@/lib/search-index';
import { getDefaultVersionId } from '@/lib/versions';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ scope: 'latest' }, { scope: 'snapshot' }];
}

export async function GET(_request: Request, { params }: { params: Promise<{ scope: string }> }) {
  const { scope } = await params;
  if (scope !== 'latest' && scope !== 'snapshot') {
    return new Response(null, { status: 404 });
  }

  const version = scope === 'snapshot' ? 'snapshot' : getDefaultVersionId();
  return Response.json({ version, entries: buildSearchIndex(version) });
}
