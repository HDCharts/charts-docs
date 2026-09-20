import { getNavigation } from '@/lib/content';
import { WikiSidebar } from '@/components';

interface WikiLayoutProps {
  children: React.ReactNode;
  params: Promise<{ version: string }>;
}

export default async function WikiLayout({ children, params }: WikiLayoutProps) {
  const { version } = await params;
  const navigation = getNavigation(version);

  return (
    <div className="mx-auto grid min-w-0 max-w-[1400px] gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
      <WikiSidebar navigation={navigation} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
