import type { Metadata } from 'next';
import Link from 'next/link';
import { getCanonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Privacy Policy | Charts',
  description: 'Privacy Policy for the Charts project and its related services.',
  alternates: {
    canonical: getCanonicalUrl('/privacy-policy'),
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-[900px] px-4">
      <nav className="mb-4 text-sm" aria-label="Breadcrumb">
        <Link href="/" className="text-[var(--link-color)] underline decoration-[0.08em] underline-offset-[0.12em] transition-colors hover:text-[var(--link-color-hover)]">← Back to documentation</Link>
      </nav>
      <h1 className="mb-4 [font-family:var(--font-display)] text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">Privacy Policy</h1>
      <p className="mb-4 text-base text-[var(--text-secondary)]">
        <strong className="text-[var(--text-primary)] font-semibold">Last updated:</strong> July 27, 2026
      </p>

      <p className="mb-4 text-base text-[var(--text-secondary)]">
        This policy explains how the Charts project handles information through
        its official websites, documentation, demos, applications, and related
        services.
      </p>

      <h2 className="mt-8 mb-4 text-2xl font-semibold text-[var(--text-primary)]">Information We Collect</h2>
      <p className="mb-4 text-base text-[var(--text-secondary)]">
        The Charts library itself does not collect, transmit, or store personal
        information. When you use project websites or related services,
        necessary technical information such as IP addresses, browser details,
        and request logs may be processed by hosting and content-delivery
        providers to deliver and secure those services.
      </p>

      <h2 className="mt-8 mb-4 text-2xl font-semibold text-[var(--text-primary)]">Third-Party Services</h2>
      <p className="mb-4 text-base text-[var(--text-secondary)]">
        Project pages and applications may link to or load resources from
        third-party services such as hosting providers, content-delivery
        networks, GitHub, analytics services, and app stores. Those providers
        process information under their own privacy policies.
      </p>

      <h2 className="mt-8 mb-4 text-2xl font-semibold text-[var(--text-primary)]">Sharing</h2>
      <p className="mb-4 text-base text-[var(--text-secondary)]">
        We do not sell personal information. Technical information may be
        processed by service providers only as needed to operate, deliver, and
        secure project services.
      </p>

      <h2 className="mt-8 mb-4 text-2xl font-semibold text-[var(--text-primary)]">Data Retention</h2>
      <p className="mb-4 text-base text-[var(--text-secondary)]">
        The Charts library does not retain personal information. Retention of
        technical information processed by third-party providers is governed by
        the project&apos;s service configuration and those providers&apos;
        policies.
      </p>

      <h2 className="mt-8 mb-4 text-2xl font-semibold text-[var(--text-primary)]">Changes to This Policy</h2>
      <p className="mb-4 text-base text-[var(--text-secondary)]">
        We may update this policy. Changes will appear on this page with a new
        {'"'}Last updated{'"'} date.
      </p>

      <h2 className="mt-8 mb-4 text-2xl font-semibold text-[var(--text-primary)]">Contact</h2>
      <p className="text-base text-[var(--text-secondary)]">
        If you have questions about this Privacy Policy, contact us via{' '}
        <a
          href="https://github.com/HDCharts/charts/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--link-color)] underline decoration-[0.08em] underline-offset-[0.12em] transition-colors hover:text-[var(--link-color-hover)]"
        >
          GitHub Issues
        </a>
        .
      </p>
    </main>
  );
}
