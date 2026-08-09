import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MetadataPanel } from '@/components/MetadataPanel';
import { getAllVersions, getVersion } from '@/lib/versions';
import { getCanonicalUrl } from '@/lib/seo';

interface MetadataPageProps {
  params: Promise<{ version: string }>;
}

export async function generateMetadata({ params }: MetadataPageProps): Promise<Metadata> {
  const { version } = await params;
  return {
    title: `Metadata | HDCharts ${version}`,
    description: `Build and publication metadata for HDCharts ${version}`,
    alternates: {
      canonical: getCanonicalUrl(`/${version}/metadata`),
    },
  };
}

export default async function MetadataPage({ params }: MetadataPageProps) {
  const { version: versionId } = await params;
  const version = getVersion(versionId);

  if (!version) {
    notFound();
  }

  return <MetadataPanel version={version} />;
}

export function generateStaticParams() {
  return getAllVersions().map((version) => ({ version: version.id }));
}
