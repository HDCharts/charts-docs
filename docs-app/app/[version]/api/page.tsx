import { notFound, permanentRedirect } from 'next/navigation';
import { getAllVersions, getVersion } from '@/lib/versions';
import { getVersionApiIndexUrl } from '@/lib/version-links';

interface ApiPageProps {
  params: Promise<{ version: string }>;
}

export default async function ApiPage({ params }: ApiPageProps) {
  const { version: versionId } = await params;
  const version = getVersion(versionId);
  
  if (!version) {
    notFound();
  }

  const apiUrl = getVersionApiIndexUrl(version);

  permanentRedirect(apiUrl);
}

export function generateStaticParams() {
  return getAllVersions().map((v) => ({ version: v.id }));
}
