import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingFooter, MarketingHeader } from '@/components';
import { getDefaultVersionId } from '@/lib/versions';

export const metadata: Metadata = {
  title: 'How HDCharts ships',
  description: 'Follow the development, testing, snapshot, and release workflow behind HDCharts.',
  openGraph: {
    title: 'How HDCharts ships',
    description: 'Follow the development, testing, snapshot, and release workflow behind HDCharts.',
    type: 'website',
  },
};

interface EcosystemCardProps {
  label: string;
  title: string;
  detail: string;
  href?: string;
  tone?: 'core' | 'support' | 'output';
}

function EcosystemCard({ label, title, detail, href, tone = 'support' }: EcosystemCardProps) {
  const content = (
    <>
      <span>{label}</span>
      <strong>{title}</strong>
      <p>{detail}</p>
      {href ? <b aria-hidden="true">↗</b> : null}
    </>
  );

  return href ? (
    <a className={`ecosystem-card ecosystem-card-${tone}`} href={href} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  ) : (
    <div className={`ecosystem-card ecosystem-card-${tone}`}>{content}</div>
  );
}

export default function WorkflowPage() {
  const defaultVersion = getDefaultVersionId();

  return (
    <div className="marketing-page workflow-page">
      <MarketingHeader versionId={defaultVersion} />

      <main>
        <section className="marketing-hero workflow-hero" aria-labelledby="workflow-title">
          <div className="marketing-hero-copy">
            <p className="marketing-eyebrow"><span /> Development · release · transparency</p>
            <h1 id="workflow-title">From pull request to published release.</h1>
            <p className="marketing-hero-lead">
              HDCharts moves from a focused pull request to a tested snapshot and a verified public release, with the important checkpoints kept visible.
            </p>
            <div className="marketing-actions">
              <Link href={`/${defaultVersion}/wiki/getting-started`} className="marketing-button marketing-button-primary">Start building</Link>
              <a href="https://github.com/HDCharts/charts/actions" target="_blank" rel="noopener noreferrer" className="marketing-button marketing-button-secondary">See the workflows <span aria-hidden="true">↗</span></a>
            </div>
          </div>

          <div className="workflow-hero-panel" aria-label="HDCharts release flow">
            <div className="workflow-panel-header">
              <span className="marketing-visual-status" />
              <span>release-flow</span>
              <span className="workflow-panel-state">release flow</span>
            </div>
            <div className="workflow-flow" aria-hidden="true">
              <div className="workflow-flow-node"><strong>PR</strong><span>change</span></div>
              <i />
              <div className="workflow-flow-node"><strong>CI</strong><span>check</span></div>
              <i />
              <div className="workflow-flow-node"><strong>SNAP</strong><span>publish</span></div>
              <i />
              <div className="workflow-flow-node workflow-flow-node-final"><strong>RELEASE</strong><span>public</span></div>
            </div>
            <p className="workflow-panel-note">A change moves through checks, snapshots, and public release.</p>
          </div>
        </section>

        <section className="marketing-section workflow-ecosystem-section" aria-label="HDCharts ecosystem">
          <div className="ecosystem-map">
            <EcosystemCard
              label="CORE LIBRARY"
              title="HDCharts · charts"
              detail="Kotlin Multiplatform library, demos, tests, and release orchestration."
              href="https://github.com/HDCharts/charts"
              tone="core"
            />
            <div className="ecosystem-arrow" aria-hidden="true">↓</div>
            <div className="ecosystem-card-grid">
              <EcosystemCard
                label="PUBLIC SITE"
                title="charts-docs"
                detail="Versioned wiki, API links, release notes, metadata, demos, and the docs application."
                href="https://github.com/HDCharts/charts-docs"
              />
              <EcosystemCard
                label="INTERACTIVE WEB"
                title="charts-playground"
                detail="A browser playground built with the Charts source and published with snapshot metadata."
                href="https://github.com/HDCharts/charts-playground"
              />
              <EcosystemCard
                label="VISUAL TOOLING"
                title="charts-gif-recorder"
                detail="A Gradle plugin used by Android documentation scenarios to record and validate animated baselines."
                href="https://github.com/HDCharts/charts-gif-recorder"
              />
            </div>
            <div className="ecosystem-arrow" aria-hidden="true">↓</div>
            <div className="ecosystem-output-grid">
              <EcosystemCard label="LIBRARY OUTPUT" title="Maven Central" detail="Stable and snapshot Kotlin Multiplatform modules and the BOM." href="https://central.sonatype.com/artifact/io.github.hdcharts/charts" tone="output" />
              <EcosystemCard label="STATIC DELIVERY" title="S3 + CloudFront" detail="Versioned API references, demos, playground files, metadata, and Android APKs." href="https://aws.amazon.com/s3/" tone="output" />
              <EcosystemCard label="SITE DELIVERY" title="Vercel" detail="Builds and serves the Next.js documentation application from charts-docs." href="https://vercel.com/" tone="output" />
              <EcosystemCard label="AUTOMATION" title="GitHub Actions" detail="Coordinates pull requests, snapshots, releases, and security scans." href="https://github.com/HDCharts/charts/actions" tone="output" />
            </div>
          </div>

          <div className="ecosystem-foundation" aria-label="HDCharts technology foundation">
            <span>Foundation</span>
            <strong>Kotlin Multiplatform</strong>
            <strong>Compose Multiplatform</strong>
            <strong>Gradle + Axion</strong>
            <strong>Android · iOS · JVM · Wasm</strong>
          </div>
        </section>

        <section className="marketing-section" aria-labelledby="workflow-docs-title">
          <div className="marketing-section-heading">
            <p className="marketing-eyebrow"><span /> The details</p>
            <h2 id="workflow-docs-title">Every step, documented.</h2>
            <p>
              Pull request checks, the CI test matrix, API compatibility, snapshots, and releases are
              described step by step in the docs.{' '}
              <Link href="/dev/releases" className="marketing-text-link">Read how HDCharts ships <span aria-hidden="true">→</span></Link>
            </p>
          </div>
        </section>

        <section className="marketing-section workflow-principles" aria-labelledby="principles-title">
          <div className="marketing-section-heading">
            <p className="marketing-eyebrow"><span /> What stays true</p>
            <h2 id="principles-title">Clear checks. Predictable releases.</h2>
            <p>Each step has a clear purpose and outcome, from the first pull request check to the published release.</p>
          </div>

          <div className="marketing-feature-grid">
            <article className="marketing-feature-card workflow-principle-card">
              <span className="marketing-feature-number">A</span>
              <h3>Versions stay aligned</h3>
              <p>Snapshots, documentation, demos, and stable releases use matching version metadata as they move through the ecosystem.</p>
            </article>
            <article className="marketing-feature-card workflow-principle-card">
              <span className="marketing-feature-number">B</span>
              <h3>Docs travel with versions</h3>
              <p>Release notes, API references, demos, and playground assets are promoted alongside the library version they describe.</p>
            </article>
            <article className="marketing-feature-card workflow-principle-card">
              <span className="marketing-feature-number">C</span>
              <h3>Checks stay purposeful</h3>
              <p>Expensive validation runs for meaningful code changes, while optional visual checks remain available without becoming noise.</p>
            </article>
          </div>
        </section>

        <section className="marketing-cta-section" aria-labelledby="workflow-cta-title">
          <div>
            <p className="marketing-eyebrow"><span /> Keep exploring</p>
            <h2 id="workflow-cta-title">See the process in the repository.</h2>
          </div>
          <div className="marketing-actions">
            <a href="https://github.com/HDCharts/charts/actions" target="_blank" rel="noopener noreferrer" className="marketing-button marketing-button-primary">Open GitHub Actions <span aria-hidden="true">↗</span></a>
            <Link href={`/${defaultVersion}/metadata`} className="marketing-button marketing-button-secondary">View build metadata</Link>
          </div>
        </section>
      </main>

      <MarketingFooter versionId={defaultVersion} />
    </div>
  );
}
