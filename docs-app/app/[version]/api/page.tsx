import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllVersions, getVersion } from '@/lib/versions';
import { getVersionApiIndexUrl } from '@/lib/version-links';
import { getCanonicalUrl } from '@/lib/seo';

interface ApiPageProps {
  params: Promise<{ version: string }>;
}

export async function generateMetadata({ params }: ApiPageProps): Promise<Metadata> {
  const { version } = await params;
  return {
    title: `API Reference | HDCharts ${version}`,
    description: `Complete API documentation for HDCharts ${version}`,
    alternates: {
      canonical: getCanonicalUrl(`/${version}/api`),
    },
  };
}

export default async function ApiPage({ params }: ApiPageProps) {
  const { version: versionId } = await params;
  const version = getVersion(versionId);
  
  if (!version) {
    notFound();
  }

  const apiUrl = getVersionApiIndexUrl(version);

  return (
    <div className="animate-fade-in">
      <div className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <iframe
          src={apiUrl}
          className="h-[calc(100vh-var(--header-height)-2rem)] w-full rounded-lg border-0 bg-[var(--bg-secondary)]"
          title={`API Documentation for HDCharts ${version.label}`}
          loading="lazy"
        >
          <p className="flex min-h-[300px] items-center justify-center p-8 text-center text-sm text-[var(--text-secondary)]">
            The API reference requires JavaScript. Please{' '}
            <a href={apiUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-[var(--link-color)] underline decoration-[0.08em] underline-offset-[0.12em] transition-colors hover:text-[var(--link-color-hover)]">
              open the full page
            </a>
            .
          </p>
        </iframe>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return getAllVersions().map((v) => ({ version: v.id }));
}
