'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { VersionSwitcher } from './VersionSwitcher';
import { SetupMenu } from './SetupMenu';
import { DocVersion, NavItem } from '@/lib/types';
import { formatPublishedAt } from '@/lib/format';
import { getVersionDemoUrl } from '@/lib/version-links';
import { cn } from '@/lib/utils';

interface HeaderProps {
  versions: DocVersion[];
  currentVersion: DocVersion;
  navigation?: NavItem[];
}

interface PublicationMetadata {
  source_sha: string;
  charts_version: string;
  published_at: string;
}

const CHARTS_REPO_URL = 'https://github.com/HDCharts/charts';

export function Header({ versions, currentVersion, navigation }: HeaderProps) {
  const [publication, setPublication] = useState<PublicationMetadata | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const demoUrl = getVersionDemoUrl(currentVersion);
  const migrationItem = navigation?.find((item) => item.slug === 'migration');

  function isCurrent(path: string): boolean {
    return pathname === path || pathname.startsWith(`${path}/`);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Close the transient menu after client-side navigation.
    setMobileMenuOpen(false);
  }, [pathname]);

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
        href="/"
        className="flex items-center gap-3 [font-family:var(--font-display)] text-xl font-bold tracking-tight text-[var(--text-primary)] no-underline"
      >
        <Image
          src="/hdcharts-wordmark.svg"
          alt="HDCharts"
          className="h-[30px] w-[112px] shrink-0 object-contain sm:h-[34px] sm:w-[132px]"
          width={620}
          height={160}
        />
      </Link>

      <nav className="docs-primary-nav flex items-center gap-1" aria-label="Primary navigation">
        <Link
          href={`/${currentVersion.id}/wiki`}
          className={cn(
            'rounded-full px-3 py-2 text-sm font-medium no-underline transition-colors',
            isCurrent(`/${currentVersion.id}/wiki`)
              ? 'bg-[var(--surface-overlay)] text-[var(--text-primary)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)] hover:text-[var(--text-primary)]',
          )}
          aria-current={isCurrent(`/${currentVersion.id}/wiki`) ? 'page' : undefined}
        >
          Docs
        </Link>
        {navigation ? <SetupMenu versionId={currentVersion.id} variant="docs" /> : null}
        <Link
          href={`/${currentVersion.id}/wiki/examples`}
          className={cn(
            "hidden rounded-full px-3 py-2 text-sm font-medium no-underline transition-colors lg:flex",
            isCurrent(`/${currentVersion.id}/wiki/examples`) && "bg-[var(--surface-overlay)] text-[var(--text-primary)]",
            !isCurrent(`/${currentVersion.id}/wiki/examples`) && "text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)] hover:text-[var(--text-primary)]"
          )}
          aria-current={isCurrent(`/${currentVersion.id}/wiki/examples`) ? 'page' : undefined}
        >
          Examples
        </Link>
        {migrationItem && (
          <Link
            href={`/${currentVersion.id}/wiki/migration`}
            className={cn(
              "hidden rounded-full px-3 py-2 text-sm font-medium no-underline transition-colors lg:flex lg:items-center lg:gap-1.5",
              isCurrent(`/${currentVersion.id}/wiki/migration`) && "bg-[var(--surface-overlay)] text-[var(--text-primary)]",
              !isCurrent(`/${currentVersion.id}/wiki/migration`) && "text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)] hover:text-[var(--text-primary)]"
            )}
            aria-current={isCurrent(`/${currentVersion.id}/wiki/migration`) ? 'page' : undefined}
          >
            Migration
            {migrationItem.badgeCount ? (
              <span className="rounded-full bg-[var(--color-warning)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[var(--bg-primary)]">
                {migrationItem.badgeCount}
              </span>
            ) : null}
          </Link>
        )}
        <Link
          href={`/${currentVersion.id}/api`}
          className={cn(
            "hidden rounded-full px-3 py-2 text-sm font-medium no-underline transition-colors lg:flex",
            isCurrent(`/${currentVersion.id}/api`) && "bg-[var(--surface-overlay)] text-[var(--text-primary)]",
            !isCurrent(`/${currentVersion.id}/api`) && "text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)] hover:text-[var(--text-primary)]"
          )}
          aria-current={isCurrent(`/${currentVersion.id}/api`) ? 'page' : undefined}
        >
          API
        </Link>
        <a
          href="/playground"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden rounded-full px-3 py-2 text-sm font-medium text-[var(--text-secondary)] no-underline transition-colors hover:bg-[var(--surface-overlay)] hover:text-[var(--text-primary)] lg:flex lg:items-center lg:gap-1.5"
        >
          Playground
          <span aria-hidden="true">↗</span>
        </a>
        <a
          href={demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden rounded-full px-3 py-2 text-sm font-medium text-[var(--text-secondary)] no-underline transition-colors hover:bg-[var(--surface-overlay)] hover:text-[var(--text-primary)] lg:flex lg:items-center lg:gap-1.5"
        >
          Demo
          <span aria-hidden="true">↗</span>
        </a>
      </nav>

      <button
        type="button"
        className="docs-mobile-menu-button"
        aria-expanded={mobileMenuOpen}
        aria-controls="docs-mobile-nav"
        onClick={() => setMobileMenuOpen((open) => !open)}
      >
        <span className="sr-only">Toggle navigation</span>
        <span aria-hidden="true">{mobileMenuOpen ? 'Close' : 'Menu'}</span>
      </button>

      <nav className="ml-auto flex items-center gap-4 min-w-0 lg:gap-4">
        {publication && (
          <div className="hidden flex-col items-end text-xs font-mono text-[var(--text-muted)] md:flex">
            <a
            href={`${CHARTS_REPO_URL}/commit/${publication.source_sha}`}
            className="no-underline transition-colors hover:text-[var(--text-primary)]"
            target="_blank"
            rel="noopener noreferrer"
            title={`HDCharts build ${publication.charts_version}`}
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

      <nav
        id="docs-mobile-nav"
        className={cn('docs-mobile-nav', mobileMenuOpen && 'is-open')}
        aria-label="Mobile navigation"
      >
        <Link
          href={`/${currentVersion.id}/wiki`}
          className={cn('docs-mobile-nav-link', isCurrent(`/${currentVersion.id}/wiki`) && 'is-active')}
          onClick={() => setMobileMenuOpen(false)}
        >
          Docs
        </Link>
        {navigation ? (
          <>
            <Link
              href={`/${currentVersion.id}/wiki/getting-started`}
              className={cn('docs-mobile-nav-link', isCurrent(`/${currentVersion.id}/wiki/getting-started`) && 'is-active')}
              onClick={() => setMobileMenuOpen(false)}
            >
              Setup
            </Link>
            <Link
              href={`/${currentVersion.id}/agent`}
              className={cn('docs-mobile-nav-link', isCurrent(`/${currentVersion.id}/agent`) && 'is-active')}
              onClick={() => setMobileMenuOpen(false)}
            >
              Agent
            </Link>
          </>
        ) : null}
        <Link
          href={`/${currentVersion.id}/wiki/examples`}
          className={cn('docs-mobile-nav-link', isCurrent(`/${currentVersion.id}/wiki/examples`) && 'is-active')}
          onClick={() => setMobileMenuOpen(false)}
        >
          Examples
        </Link>
        {migrationItem ? (
          <Link
            href={`/${currentVersion.id}/wiki/migration`}
            className={cn('docs-mobile-nav-link', isCurrent(`/${currentVersion.id}/wiki/migration`) && 'is-active')}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span>Migration</span>
            {migrationItem.badgeCount ? <span className="docs-mobile-nav-badge">{migrationItem.badgeCount}</span> : null}
          </Link>
        ) : null}
        <Link
          href={`/${currentVersion.id}/api`}
          className={cn('docs-mobile-nav-link', isCurrent(`/${currentVersion.id}/api`) && 'is-active')}
          onClick={() => setMobileMenuOpen(false)}
        >
          API
        </Link>
        <a href="/playground" target="_blank" rel="noopener noreferrer" className="docs-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
          Playground <span aria-hidden="true">↗</span>
        </a>
        <a href={demoUrl} target="_blank" rel="noopener noreferrer" className="docs-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
          Demo <span aria-hidden="true">↗</span>
        </a>
      </nav>
    </header>
  );
}
