import { Header, Sidebar } from '@/components';
import { getAllVersions, getVersions, getVersion } from '@/lib/versions';
import { getNavigation } from '@/lib/content';

export default async function ThanksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const defaultVersion = getVersion('snapshot') ?? getVersions()[0];
  const versions = getVersions();
  const navigation = getNavigation(defaultVersion.id);

  return (
    <div className="docs-layout">
      <Header versions={versions} currentVersion={defaultVersion} />
      <Sidebar navigation={navigation} version={defaultVersion} />
      <main className="docs-main">
        {children}
      </main>
    </div>
  );
}