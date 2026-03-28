import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Charts',
  description: 'Privacy Policy for Charts app and demo applications.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-[900px] px-4">
      <nav className="mb-4 text-sm" aria-label="Breadcrumb">
        <Link href="/" className="text-[var(--link-color)] underline decoration-[0.08em] underline-offset-[0.12em] transition-colors hover:text-[var(--link-color-hover)]">← Back to documentation</Link>
      </nav>
      <h1 className="mb-4 [font-family:var(--font-display)] text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">Privacy Policy</h1>
      <p className="mb-4 text-base text-[var(--text-secondary)]">
        <strong className="text-[var(--text-primary)] font-semibold">Last updated:</strong> February 10, 2026
      </p>

      <p className="mb-4 text-base text-[var(--text-secondary)]">
        This app is a demo for the Charts library. This page explains how the
        demo app handles data.
      </p>

      <h2 className="mt-8 mb-4 text-2xl font-semibold text-[var(--text-primary)]">What We Collect</h2>
      <p className="mb-4 text-base text-[var(--text-secondary)]">
        We do not collect personal information (such as name, email, phone
        number, or account data).
      </p>
      <p className="mb-4 text-base text-[var(--text-secondary)]">
        Any chart data you use in the demo stays on your device and is used
        only to render charts.
      </p>

      <h2 className="mt-8 mb-4 text-2xl font-semibold text-[var(--text-primary)]">Third-Party Platforms</h2>
      <p className="mb-4 text-base text-[var(--text-secondary)]">
        App stores and platform providers (such as Google Play or APKPure) may
        collect technical data under their own privacy policies.
      </p>

      <h2 className="mt-8 mb-4 text-2xl font-semibold text-[var(--text-primary)]">Data Sharing</h2>
      <p className="mb-4 text-base text-[var(--text-secondary)]">We do not sell or share personal information.</p>

      <h2 className="mt-8 mb-4 text-2xl font-semibold text-[var(--text-primary)]">Data Retention</h2>
      <p className="mb-4 text-base text-[var(--text-secondary)]">
        We do not store personal data on our servers because we do not collect
        it.
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
