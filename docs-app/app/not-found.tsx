import Link from 'next/link';
import { getDefaultVersionId, getVersions } from '@/lib/versions';
import { getNavigation } from '@/lib/content';
import { Header, Sidebar } from '@/components';

export default function NotFound() {
  const defaultVersion = getDefaultVersionId();
  const versions = getVersions();
  const version = versions.find((v) => v.id === defaultVersion) ?? versions[0];
  const navigation = getNavigation(version.id);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden lg:flex-row">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-1 focus:top-0 focus:z-[9999] focus:rounded-b-md bg-[var(--color-primary)] px-6 py-2 text-sm font-semibold text-[var(--text-on-primary)] no-underline transition-[colors,opacity]">
        Skip to content
      </a>
      <Header versions={versions} currentVersion={version} />
      <Sidebar navigation={navigation} version={version} />
      <main id="main-content" className="flex-1 px-4 py-6 lg:ml-[var(--sidebar-width)] lg:mt-[var(--header-height)] lg:py-10 lg:px-8">
        <div className="mx-auto max-w-[900px]">
          <h1 className="mb-4 [font-family:var(--font-display)] text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">Page not found</h1>
          <p className="mb-6 text-base text-[var(--text-secondary)]">
            This page doesn&apos;t exist or has been moved.
          </p>
          <Link
            href={`/${version.id}/wiki`}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-on-primary)] transition-colors hover:bg-[var(--surface-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
          >
            Go to documentation
          </Link>
        </div>
      </main>
    </div>
  );
}
