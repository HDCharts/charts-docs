import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Breadcrumbs, MarkdownRenderer, OnThisPage } from '@/components';
import { getPage, getPageHeadings, getPageSlugs } from '@/lib/content';
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
  const headings = getPageHeadings(page.content);

  return (
    <div className="flex min-w-0 gap-8">
      <article className="min-w-0 max-w-[860px] flex-1 animate-fade-in">
        {pageSlug !== '' ? (
          <Breadcrumbs items={[{ label: 'Docs', href: `/${version}/wiki` }, { label: page.title }]} />
        ) : null}
        <MarkdownRenderer content={page.content} usesLargeGif={usesLargeGif} />
      </article>
      <OnThisPage headings={headings} />
    </div>
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
