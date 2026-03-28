import { Header, Sidebar } from '@/components';
import { getCurrentVersion, getVersions } from '@/lib/versions';
import { getNavigation } from '@/lib/content';

export default async function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const versions = getVersions();
  const defaultVersion = getCurrentVersion() ?? versions[0];

  if (!defaultVersion) {
    return (
      <>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-1 focus:top-0 focus:z-[9999] focus:rounded-b-md bg-[var(--color-primary)] px-6 py-2 text-sm font-semibold text-[var(--text-on-primary)] no-underline transition-[colors,opacity]">
          Skip to content
        </a>
        <main id="main-content" className="flex-1 px-4 py-6 lg:mt-[var(--header-height)] lg:py-10 lg:px-8">
          {children}
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
      </main>
    </div>
  );
}
