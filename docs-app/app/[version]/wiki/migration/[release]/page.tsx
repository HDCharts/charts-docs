import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Breadcrumbs, MarkdownRenderer, OnThisPage } from '@/components';
import { getMigrationReleasePage, getMigrationReleases, getPageHeadings } from '@/lib/content';
import { getAllVersions, hasLargeGifs } from '@/lib/versions';
import { getCanonicalUrl } from '@/lib/seo';

export const dynamicParams = false;

interface MigrationReleasePageProps {
  params: Promise<{ version: string; release: string }>;
}

export async function generateMetadata({ params }: MigrationReleasePageProps): Promise<Metadata> {
  const { version, release } = await params;
  const page = getMigrationReleasePage(version, release);

  if (!page) {
    return { title: 'Page Not Found' };
  }

  return {
    title: `${page.title} | HDCharts ${version}`,
    description: `${page.title} migration notes for HDCharts ${version}`,
    alternates: {
      canonical: getCanonicalUrl(`/${version}/wiki/migration/${release}`),
    },
  };
}

export default async function MigrationReleasePage({ params }: MigrationReleasePageProps) {
  const { version, release } = await params;
  const page = getMigrationReleasePage(version, release);

  if (!page) {
    notFound();
  }

  const headings = getPageHeadings(page.content);

  return (
    <div className="flex min-w-0 gap-8">
      <article className="min-w-0 max-w-[860px] flex-1 animate-fade-in">
        <Breadcrumbs
          items={[
            { label: 'Docs', href: `/${version}/wiki` },
            { label: 'Migration', href: `/${version}/wiki/migration` },
            { label: release },
          ]}
        />
        <MarkdownRenderer content={page.content} usesLargeGif={hasLargeGifs(version)} />
      </article>
      <OnThisPage headings={headings} />
    </div>
  );
}

export function generateStaticParams() {
  const versions = getAllVersions();
  const params: { version: string; release: string }[] = [];

  for (const version of versions) {
    for (const release of getMigrationReleases(version.id)) {
      params.push({ version: version.id, release: release.label });
    }
  }

  return params;
}
