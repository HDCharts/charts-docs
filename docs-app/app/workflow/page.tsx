import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingFooter, MarketingHeader } from '@/components';
import { getDefaultVersionId } from '@/lib/versions';

export const metadata: Metadata = {
  title: 'How HDCharts ships',
  description: 'The repositories and services that build, test, and publish HDCharts.',
  openGraph: {
    title: 'How HDCharts ships',
    description: 'The repositories and services that build, test, and publish HDCharts.',
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
        <section className="marketing-section workflow-ecosystem-section" aria-labelledby="workflow-title">
          <div className="marketing-section-heading">
            <p className="marketing-eyebrow"><span /> How HDCharts ships</p>
            <h1 id="workflow-title">Where each part lives.</h1>
          </div>

          <div className="ecosystem-map">
            <EcosystemCard
              label="CORE LIBRARY"
              title="HDCharts · charts"
              detail="The Kotlin Multiplatform library, demos, tests, and release workflows."
              href="https://github.com/HDCharts/charts"
              tone="core"
            />
            <div className="ecosystem-arrow" aria-hidden="true">↓</div>
            <div className="ecosystem-card-grid">
              <EcosystemCard
                label="PUBLIC SITE"
                title="charts-docs"
                detail="This site: versioned guides, API links, release notes, and build metadata."
                href="https://github.com/HDCharts/charts-docs"
              />
              <EcosystemCard
                label="INTERACTIVE WEB"
                title="charts-playground"
                detail="Try charts in the browser. Rebuilt from the library source with each snapshot."
                href="https://github.com/HDCharts/charts-playground"
              />
              <EcosystemCard
                label="VISUAL TOOLING"
                title="charts-gif-recorder"
                detail="A Gradle plugin that records the animated GIFs in these docs and checks them for changes."
                href="https://github.com/HDCharts/charts-gif-recorder"
              />
            </div>
            <div className="ecosystem-arrow" aria-hidden="true">↓</div>
            <div className="ecosystem-output-grid">
              <EcosystemCard label="LIBRARY OUTPUT" title="Maven Central" detail="Stable and snapshot Kotlin Multiplatform modules and the BOM." href="https://central.sonatype.com/artifact/io.github.hdcharts/charts" tone="output" />
              <EcosystemCard label="STATIC DELIVERY" title="S3 + CloudFront" detail="Versioned API references, demos, playground files, metadata, and Android APKs." href="https://aws.amazon.com/s3/" tone="output" />
              <EcosystemCard label="SITE DELIVERY" title="Vercel" detail="Builds and serves this docs site from charts-docs." href="https://vercel.com/" tone="output" />
              <EcosystemCard label="AUTOMATION" title="GitHub Actions" detail="Runs the pull request checks, snapshots, releases, and security scans." href="https://github.com/HDCharts/charts/actions" tone="output" />
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

        <section className="marketing-cta-section" aria-labelledby="workflow-cta-title">
          <div>
            <p className="marketing-eyebrow"><span /> Go deeper</p>
            <h2 id="workflow-cta-title">Read the full release process.</h2>
          </div>
          <div className="marketing-actions">
            <Link href="/dev/releases" className="marketing-button marketing-button-primary">Read the dev docs</Link>
            <a href="https://github.com/HDCharts/charts/actions" target="_blank" rel="noopener noreferrer" className="marketing-button marketing-button-secondary">Open GitHub Actions <span aria-hidden="true">↗</span></a>
          </div>
        </section>
      </main>

      <MarketingFooter versionId={defaultVersion} />
    </div>
  );
}
