import Link from 'next/link';

interface MarketingFooterProps {
  versionId?: string;
}

export function MarketingFooter({ versionId }: MarketingFooterProps) {
  return (
    <footer className="marketing-footer">
      <div>
        <span className="marketing-footer-brand">© {new Date().getFullYear()} HDCharts</span>
        <span>Compose Multiplatform charting.</span>
      </div>
      <nav aria-label="Footer navigation">
        {versionId ? <Link href={`/${versionId}/wiki`}>Documentation</Link> : null}
        {versionId ? <Link href={`/${versionId}/metadata`}>Build metadata</Link> : null}
        {versionId ? <Link href={`/${versionId}/wiki/screenshots`}>Screenshots</Link> : null}
        <Link href="/workflow">Workflow</Link>
        <Link href="/built-with">Built with</Link>
        <Link href="/privacy-policy">Privacy</Link>
        <a href="https://github.com/HDCharts/charts" target="_blank" rel="noopener noreferrer">GitHub</a>
      </nav>
    </footer>
  );
}
