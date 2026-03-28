import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllVersions, getVersion } from '@/lib/versions';
import { getVersionApiIndexUrl } from '@/lib/version-links';

interface ApiPageProps {
  params: Promise<{ version: string }>;
}

export async function generateMetadata({ params }: ApiPageProps): Promise<Metadata> {
  const { version } = await params;
  return {
    title: `API Reference | Charts ${version}`,
    description: `Complete API documentation for Charts ${version}`,
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
      <div className="mb-2">
        <h1 className="m-0 [font-family:var(--font-display)] text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">API Reference</h1>
      </div>
      <p className="mb-4 text-[var(--text-secondary)]">
        Dokka reference for Charts {version.label}.{' '}
        <a href={apiUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--link-color)] underline decoration-[0.08em] underline-offset-[0.12em] transition-colors hover:text-[var(--link-color-hover)]">
          Open full page
        </a>
        .
      </p>

      <div className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <iframe
          src={apiUrl}
          className="h-[calc(100vh-var(--header-height)-2rem)] w-full rounded-lg border-0 bg-[var(--bg-secondary)]"
          title={`API Documentation for Charts ${version.label}`}
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
