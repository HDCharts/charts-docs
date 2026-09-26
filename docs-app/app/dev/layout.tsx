import { Header, MarketingFooter } from '@/components';
import { DevSidebar } from '@/components/DevSidebar';
import { getNavigation } from '@/lib/content';
import { getDevNavigation } from '@/lib/dev-docs';
import { getCurrentVersion, getVersions } from '@/lib/versions';

export default function DevLayout({ children }: { children: React.ReactNode }) {
  const versions = getVersions();
  const version = getCurrentVersion();

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-1 focus:top-0 focus:z-[9999] focus:rounded-b-md bg-[var(--color-primary)] px-6 py-2 text-sm font-semibold text-[var(--text-on-primary)] no-underline transition-[colors,opacity]">
        Skip to content
      </a>
      {version ? <Header versions={versions} currentVersion={version} navigation={getNavigation(version.id)} /> : null}
      <main
        id="main-content"
        className="mt-[var(--header-height)] min-w-0 w-full flex-1 px-4 py-8 lg:py-10 lg:px-8"
      >
        <div className="mx-auto grid min-w-0 max-w-[1400px] gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
          <DevSidebar sections={getDevNavigation()} />
          <div className="min-w-0">{children}</div>
        </div>
        <MarketingFooter versionId={version?.id} />
      </main>
    </div>
  );
}
