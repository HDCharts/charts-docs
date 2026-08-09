'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { SetupMenu } from './SetupMenu';

interface MarketingHeaderProps {
  versionId: string;
}

const GITHUB_URL = 'https://github.com/HDCharts/charts';

export function MarketingHeader({ versionId }: MarketingHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="marketing-nav-shell">
      <div className="marketing-nav">
        <Link href="/" className="marketing-brand" aria-label="HDCharts home">
          <Image className="marketing-brand-wordmark" src="/hdcharts-wordmark.svg" alt="HDCharts" width={620} height={160} priority />
        </Link>

        <nav className="marketing-nav-links" aria-label="Main navigation">
          <Link href={`/${versionId}/wiki/examples`}>Examples</Link>
          <Link href={`/${versionId}/api`}>API</Link>
          <Link href="/workflow">Workflow</Link>
          <a href={`/demo/${versionId}/`} target="_blank" rel="noopener noreferrer">
            Demo <span aria-hidden="true">↗</span>
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
        </nav>

        <div className="marketing-nav-setup-cta">
          <SetupMenu versionId={versionId} variant="marketing" />
        </div>

        <button
          type="button"
          className="marketing-menu-button"
          aria-expanded={menuOpen}
          aria-controls="marketing-mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="sr-only">Toggle navigation</span>
          <span aria-hidden="true">{menuOpen ? 'Close' : 'Menu'}</span>
        </button>
      </div>

      <div id="marketing-mobile-nav" className={`marketing-mobile-nav${menuOpen ? ' is-open' : ''}`}>
        <Link href={`/${versionId}/wiki/getting-started`} onClick={() => setMenuOpen(false)}>Setup</Link>
        <Link href={`/${versionId}/agent`} onClick={() => setMenuOpen(false)}>Agent</Link>
        <Link href={`/${versionId}/wiki/examples`} onClick={() => setMenuOpen(false)}>Examples</Link>
        <Link href={`/${versionId}/api`} onClick={() => setMenuOpen(false)}>API</Link>
        <Link href="/workflow" onClick={() => setMenuOpen(false)}>Workflow</Link>
        <a href={`/demo/${versionId}/`} target="_blank" rel="noopener noreferrer">
          Demo <span aria-hidden="true">↗</span>
        </a>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>
    </header>
  );
}
