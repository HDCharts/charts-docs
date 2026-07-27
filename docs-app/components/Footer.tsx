import Link from 'next/link';

const CHARTS_ISSUES_URL = 'https://github.com/HDCharts/charts/issues';

export function Footer() {
  return (
    <footer className="mx-auto mt-16 flex w-full max-w-[1120px] flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--border-color)] px-4 py-6 text-sm text-[var(--text-muted)] lg:px-0">
      <span>Charts Documentation</span>
      <span aria-hidden="true">·</span>
      <Link
        href="/privacy-policy"
        className="text-[var(--link-color)] underline decoration-[0.08em] underline-offset-[0.12em] transition-colors hover:text-[var(--link-color-hover)]"
      >
        Privacy Policy
      </Link>
      <span aria-hidden="true">·</span>
      <a
        href={CHARTS_ISSUES_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--link-color)] underline decoration-[0.08em] underline-offset-[0.12em] transition-colors hover:text-[var(--link-color-hover)]"
      >
        GitHub Issues
      </a>
    </footer>
  );
}
