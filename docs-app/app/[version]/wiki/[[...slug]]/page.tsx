import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { MarkdownRenderer } from '@/components';
import { getPage, getPageSlugs } from '@/lib/content';
import { getAllVersions, isVersionAtLeast } from '@/lib/versions';
import { getCanonicalUrl } from '@/lib/seo';

export const dynamicParams = false;

interface WikiPageProps {
  params: Promise<{ version: string; slug?: string[] }>;
}

export async function generateMetadata({ params }: WikiPageProps): Promise<Metadata> {
  const { version, slug } = await params;
  const pageSlug = slug?.join('/') || '';
  const page = getPage(version, pageSlug);
  
  if (!page) {
    return { title: 'Page Not Found' };
  }

  return {
    title: `${page.title} | HDCharts ${version}`,
    description: page.frontmatter.description || `${page.title} - HDCharts documentation`,
    alternates: {
      canonical: getCanonicalUrl(`/${version}/wiki${pageSlug ? `/${pageSlug}` : ''}`),
    },
  };
}

export default async function WikiPage({ params }: WikiPageProps) {
  const { version, slug } = await params;
  const pageSlug = slug?.join('/') || '';
  const page = getPage(version, pageSlug);

  if (!page) {
    notFound();
  }

  const usesLargeGif = version === 'snapshot' || isVersionAtLeast(version, '3.0.0');

  return (
    <article className="min-w-0 max-w-[860px] animate-fade-in">
      <MarkdownRenderer content={page.content} usesLargeGif={usesLargeGif} />
    </article>
  );
}

export function generateStaticParams() {
  const versions = getAllVersions();
  const params: { version: string; slug?: string[] }[] = [];

  for (const version of versions) {
    // migration has its own dedicated routes (wiki/migration and
    // wiki/migration/[release]), so it's excluded here to avoid both routes
    // claiming the same path.
    const slugs = getPageSlugs(version.id).filter((slug) => slug !== 'migration');

    for (const slug of slugs) {
      if (slug === '') {
        params.push({ version: version.id, slug: undefined });
      } else {
        params.push({ version: version.id, slug: [slug] });
      }
    }
  }

  return params;
}
