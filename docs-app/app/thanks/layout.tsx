import { Footer, Header, Sidebar } from '@/components';
import { getCurrentVersion, getVersions } from '@/lib/versions';
import { getNavigation } from '@/lib/content';
import { headers } from 'next/headers';

function getVersionFromReferer(referer: string | null, versionIds: Set<string>): string | null {
  if (!referer) {
    return null;
  }

  try {
    const { pathname } = new URL(referer);
    const firstSegment = pathname.split('/').filter(Boolean)[0] ?? '';
    return versionIds.has(firstSegment) ? firstSegment : null;
  } catch {
    return null;
  }
}

export default async function ThanksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const versions = getVersions();
  const requestHeaders = await headers();
  const versionIds = new Set(versions.map((version) => version.id));
  const refererVersionId = getVersionFromReferer(requestHeaders.get('referer'), versionIds);

  const defaultVersion =
    versions.find((version) => version.id === refererVersionId) ??
    getCurrentVersion() ??
    versions[0];

  if (!defaultVersion) {
    return (
      <>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-1 focus:top-0 focus:z-[9999] focus:rounded-b-md bg-[var(--color-primary)] px-6 py-2 text-sm font-semibold text-[var(--text-on-primary)] no-underline transition-[colors,opacity]">
          Skip to content
        </a>
        <main id="main-content" className="flex-1 px-4 py-6 lg:px-8 lg:py-10">
          {children}
          <Footer />
        </main>
      </>
    );
  }

  const navigation = getNavigation(defaultVersion.id);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden lg:flex-row">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-1 focus:top-0 focus:z-[9999] focus:rounded-b-md bg-[var(--color-primary)] px-6 py-2 text-sm font-semibold text-[var(--text-on-primary)] no-underline transition-[colors,opacity]">
        Skip to content
      </a>
      <Header versions={versions} currentVersion={defaultVersion} />
      <Sidebar navigation={navigation} version={defaultVersion} />
      <main id="main-content" className="flex-1 px-4 py-6 lg:ml-[var(--sidebar-width)] lg:mt-[var(--header-height)] lg:py-10 lg:px-8">
        {children}
        <Footer />
      </main>
    </div>
  );
}
