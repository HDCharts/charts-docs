import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { MarkdownRenderer } from '@/components';
import { getPage, getMigrationReleases } from '@/lib/content';
import { getAllVersions, isVersionAtLeast } from '@/lib/versions';
import { getCanonicalUrl } from '@/lib/seo';

export const dynamicParams = false;

interface MigrationIndexPageProps {
  params: Promise<{ version: string }>;
}

export async function generateMetadata({ params }: MigrationIndexPageProps): Promise<Metadata> {
  const { version } = await params;
  return {
    title: `Migration Guide | HDCharts ${version}`,
    description: `Breaking-change migration notes for HDCharts ${version}`,
    alternates: {
      canonical: getCanonicalUrl(`/${version}/wiki/migration`),
    },
  };
}

export default async function MigrationIndexPage({ params }: MigrationIndexPageProps) {
  const { version } = await params;
  const page = getPage(version, 'migration');

  if (!page) {
    notFound();
  }

  const releases = getMigrationReleases(version);
  const usesLargeGif = version === 'snapshot' || isVersionAtLeast(version, '3.0.0');

  return (
    <article className="min-w-0 max-w-[860px] animate-fade-in">
      <MarkdownRenderer content={page.content} usesLargeGif={usesLargeGif} />
      {releases.length > 0 ? (
        <ul className="mt-6 flex flex-col gap-2">
          {releases.map((release) => (
            <li key={release.label}>
              <Link
                href={`/${version}/wiki/migration/${release.label}`}
                className="text-[var(--link-color)] underline decoration-[0.08em] underline-offset-[0.12em] hover:text-[var(--link-color-hover)]"
              >
                {release.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No breaking changes have been recorded for this release or earlier supported releases.</p>
      )}
    </article>
  );
}

export function generateStaticParams() {
  return getAllVersions().map((version) => ({ version: version.id }));
}
