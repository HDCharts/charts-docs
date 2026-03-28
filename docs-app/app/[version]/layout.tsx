import { notFound } from 'next/navigation';
import { Header, Sidebar } from '@/components';
import { getAllVersions, getVersions, getVersion } from '@/lib/versions';
import { getNavigation } from '@/lib/content';

export const dynamicParams = false;

interface VersionLayoutProps {
  children: React.ReactNode;
  params: Promise<{ version: string }>;
}

export default async function VersionLayout({ children, params }: VersionLayoutProps) {
  const { version: versionId } = await params;
  const version = getVersion(versionId);
  
  if (!version) {
    notFound();
  }

  const versions = getVersions();
  const navigation = getNavigation(versionId);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden lg:flex-row">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-1 focus:top-0 focus:z-[9999] focus:rounded-b-md bg-[var(--color-primary)] px-6 py-2 text-sm font-semibold text-[var(--text-on-primary)] no-underline transition-[colors,opacity]">
        Skip to content
      </a>
      <Header versions={versions} currentVersion={version} />
      <Sidebar navigation={navigation} version={version} />
      <main 
        id="main-content"
        className="flex-1 px-4 py-6 lg:ml-[var(--sidebar-width)] lg:mt-[var(--header-height)] lg:py-10 lg:px-8"
      >
        {children}
      </main>
    </div>
  );
}

export function generateStaticParams() {
  const versions = getAllVersions();
  return versions.map((v) => ({
    version: v.id,
  }));
}
