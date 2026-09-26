import type { Metadata } from 'next';
import { CiStatsSection, MarketingFooter, MarketingHeader } from '@/components';
import { getDefaultVersionId } from '@/lib/versions';

export const metadata: Metadata = {
  title: 'CI stats | HDCharts',
  description: 'Pull request CI runs and validation hours for HDCharts this year.',
  alternates: {
    canonical: '/ci-stats',
  },
  openGraph: {
    title: 'CI stats | HDCharts',
    description: 'Pull request CI runs and validation hours for HDCharts this year.',
    type: 'website',
  },
};

export default function CiStatsPage() {
  const defaultVersion = getDefaultVersionId();

  return (
    <div className="marketing-page">
      <MarketingHeader versionId={defaultVersion} />

      <main>
        <CiStatsSection />
      </main>

      <MarketingFooter versionId={defaultVersion} />
    </div>
  );
}
