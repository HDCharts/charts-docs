import { MarketingFooter, MarketingHeader } from '@/components';
import { getDefaultVersionId } from '@/lib/versions';

export default function BuiltWithLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const defaultVersion = getDefaultVersionId();

  return (
    <div className="marketing-page">
      <MarketingHeader versionId={defaultVersion} />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
