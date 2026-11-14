import type { Metadata } from 'next';
import Link from 'next/link';
import { getCanonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Privacy Policy | HDCharts',
  description: 'Privacy Policy for the HDCharts project and its related services.',
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
        <strong className="text-[var(--text-primary)] font-semibold">Last updated:</strong> November 15, 2026
      </p>

      <p className="mb-4 text-base text-[var(--text-secondary)]">
        This policy explains how the HDCharts project handles information through
        its official websites, documentation, demos, applications, and related
        services, including the chart usage telemetry built into the HDCharts
        library.
      </p>

      <h2 className="mt-8 mb-4 text-2xl font-semibold text-[var(--text-primary)]">Information We Collect</h2>
      <p className="mb-4 text-base text-[var(--text-secondary)]">
        The HDCharts project does not collect personal information. When you use
        project websites or related services, necessary technical information
        such as IP addresses, browser details, and request logs may be processed
        by hosting and content-delivery providers to deliver and secure those
        services. The HDCharts library itself transmits only the anonymous chart
        usage telemetry described below; it never collects personal information.
      </p>

      <h2 className="mt-8 mb-4 text-2xl font-semibold text-[var(--text-primary)]">Chart Usage Telemetry</h2>
      <p className="mb-4 text-base text-[var(--text-secondary)]">
        The HDCharts library includes optional chart usage telemetry, powered
        by PostHog, that reports when a chart is displayed in an application.
        Reporting is enabled by default on Android, JVM, and Wasm; it is
        currently disabled on iOS. The telemetry sends one event per chart
        composition lifetime.
      </p>
      <p className="mb-4 text-base text-[var(--text-secondary)]">
        The following information is collected for each reported chart display:
      </p>
      <ul className="mb-4 ml-6 list-disc text-base text-[var(--text-secondary)]">
        <li>Chart type (for example, line, bar, or pie).</li>
        <li>PostHog persistent anonymous installation identifier.</li>
        <li>Platform (Android, JVM, or Wasm).</li>
        <li>HDCharts library version in use.</li>
        <li>PostHog SDK metadata (SDK name and version, event timestamp, event ID).</li>
      </ul>
      <p className="mb-4 text-base text-[var(--text-secondary)]">
        App or package identifiers, hostnames, chart data, chart titles and
        labels, application user identities, and person profiles are excluded.
        The PostHog SDK is configured with person profiles disabled, session
        recording disabled, autocapture disabled, error tracking disabled, and
        IP geolocation suppressed. Events are attributed to the persistent
        installation identity rather than any host application user identity.
        Telemetry is sent to PostHog servers in the European Union.
      </p>
      <p className="mb-4 text-base text-[var(--text-secondary)]">
        To disable chart usage telemetry, set this at each application startup
        before displaying any charts:
      </p>
      <pre className="mb-4"><code>{`import io.github.hdcharts.core.ChartsTelemetry

ChartsTelemetry.enabled = false`}</code></pre>

      <h2 className="mt-8 mb-4 text-2xl font-semibold text-[var(--text-primary)]">Third-Party Services</h2>
      <p className="mb-4 text-base text-[var(--text-secondary)]">
        Project pages and applications may link to or load resources from
        third-party services such as hosting providers, content-delivery
        networks, GitHub, analytics services, and app stores. Chart usage
        telemetry is reported through PostHog, which processes the anonymous
        usage data described above under its own privacy policy. Those providers
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
        The HDCharts library does not retain personal information. Retention of
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
