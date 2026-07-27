'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { VersionSwitcher } from './VersionSwitcher';
import { DocVersion } from '@/lib/types';
import { formatPublishedAt } from '@/lib/format';

interface HeaderProps {
  versions: DocVersion[];
  currentVersion: DocVersion;
}

interface PublicationMetadata {
  source_sha: string;
  charts_version: string;
  published_at: string;
}

const CHARTS_REPO_URL = 'https://github.com/HDCharts/charts';

export function Header({ versions, currentVersion }: HeaderProps) {
  const [publication, setPublication] = useState<PublicationMetadata | null>(null);

  useEffect(() => {
    const metadataFile = currentVersion.id === 'snapshot'
      ? 'charts-snapshot-publish.json'
      : 'charts-release-publish.json';

    fetch(`/static/_meta/${metadataFile}`, { cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<PublicationMetadata> : null)
      .then((metadata) => {
        const matchesVersion = currentVersion.id === 'snapshot' || metadata?.charts_version === currentVersion.id;
        setPublication(matchesVersion ? metadata : null);
      })
      .catch(() => setPublication(null));
  }, [currentVersion.id]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center border-b border-[var(--border-color)] bg-[var(--bg-secondary)] px-6 gap-4 lg:px-4">
      <Link 
        href={`/${currentVersion.id}/wiki`} 
        className="flex items-center gap-3 [font-family:var(--font-display)] text-xl font-bold tracking-tight text-[var(--text-primary)] no-underline"
      >
        <Image
          src="/charts-logo.png"
          alt=""
          className="h-[30px] w-[30px] shrink-0 rounded-md border border-[var(--brand-image-border)] bg-[var(--brand-image-bg)] object-contain shadow-[var(--brand-image-shadow)]"
          width={30}
          height={30}
        />
        <span>Charts</span>
      </Link>

      <nav className="ml-auto flex items-center gap-4 min-w-0 lg:gap-4">
        {publication && (
          <div className="hidden flex-col items-end text-xs font-mono text-[var(--text-muted)] md:flex">
            <a
            href={`${CHARTS_REPO_URL}/commit/${publication.source_sha}`}
            className="no-underline transition-colors hover:text-[var(--text-primary)]"
            target="_blank"
            rel="noopener noreferrer"
            title={`Charts build ${publication.charts_version}`}
            >
              Build {publication.charts_version} / {publication.source_sha.slice(0, 7)}
            </a>
            <span>Published {formatPublishedAt(publication.published_at)}</span>
          </div>
        )}
        <VersionSwitcher 
          versions={versions} 
          currentVersion={currentVersion} 
        />
      </nav>
    </header>
  );
}
