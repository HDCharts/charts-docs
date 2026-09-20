import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { MarkdownRenderer } from '@/components';
import { getMigrationReleasePage, getMigrationReleases } from '@/lib/content';
import { getAllVersions, isVersionAtLeast } from '@/lib/versions';
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

  const usesLargeGif = version === 'snapshot' || isVersionAtLeast(version, '3.0.0');

  return (
    <article className="min-w-0 max-w-[860px] animate-fade-in">
      <MarkdownRenderer content={page.content} usesLargeGif={usesLargeGif} />
    </article>
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
