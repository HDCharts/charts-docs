import Link from 'next/link';
import { ChartHeroVisual, MarketingFooter, MarketingHeader } from '@/components';
import { getDefaultVersionId } from '@/lib/versions';

export default function HomePage() {
  const defaultVersion = getDefaultVersionId();

  return (
    <div className="marketing-page">
      <MarketingHeader versionId={defaultVersion} />

      <main>
        <section className="marketing-hero" aria-labelledby="hero-title">
          <div className="marketing-hero-copy">
            <p className="marketing-eyebrow"><span /> Compose Multiplatform · Kotlin · Open source</p>
            <h1 id="hero-title">HDCharts that feel at home on every screen.</h1>
            <p className="marketing-hero-lead">
              Build clear, customizable data visualizations for Android, iOS, desktop, and web with one Compose-first library.
            </p>
            <div className="marketing-actions">
              <Link href={`/${defaultVersion}/wiki`} className="marketing-button marketing-button-primary">Read the docs</Link>
              <a href="/playground" target="_blank" rel="noopener noreferrer" className="marketing-button marketing-button-secondary">Open playground <span aria-hidden="true">↗</span></a>
            </div>
            <p className="marketing-hero-note">Line, bar, pie, radar, and histogram charts, with flexible styling and interaction.</p>
          </div>
          <ChartHeroVisual />
        </section>

        <section className="marketing-section marketing-section-intro" aria-labelledby="capabilities-title">
          <div className="marketing-section-heading">
            <p className="marketing-eyebrow"><span /></p>
            <h2 id="capabilities-title">One charting toolkit, many surfaces.</h2>
            <p>HDCharts keeps the API familiar while giving each platform the room to render beautifully.</p>
          </div>
          <div className="marketing-feature-grid">
            <article className="marketing-feature-card">
              <span className="marketing-feature-number">01</span>
              <h3>Compose first</h3>
              <p>Describe your visualization in Kotlin and keep it close to the rest of your UI.</p>
              <div className="marketing-feature-line marketing-feature-line-a" />
            </article>
            <article className="marketing-feature-card">
              <span className="marketing-feature-number">02</span>
              <h3>Multiplatform by design</h3>
              <p>Share chart logic across Android, iOS, desktop, and web without losing control.</p>
              <div className="marketing-feature-line marketing-feature-line-b" />
            </article>
            <article className="marketing-feature-card">
              <span className="marketing-feature-number">03</span>
              <h3>Readable defaults</h3>
              <p>Start with thoughtful scales, spacing, and motion, then tune every detail when you need to.</p>
              <div className="marketing-feature-line marketing-feature-line-c" />
            </article>
          </div>
        </section>

        <section className="marketing-section marketing-code-section" aria-labelledby="code-title">
          <div className="marketing-code-copy">
            <p className="marketing-eyebrow"><span /> A small starting point</p>
            <h2 id="code-title">A chart in a few lines.</h2>
            <p>Keep the first render simple, then add the style, interaction, and data density your product needs.</p>
            <Link href={`/${defaultVersion}/wiki/getting-started`} className="marketing-text-link">See how it works <span aria-hidden="true">→</span></Link>
          </div>
          <div className="marketing-code-card" aria-label="Kotlin example">
            <div className="marketing-code-bar"><span /><span /><span /><b>LineChart.kt</b></div>
            <pre><code>{`@Composable
private fun ShowLine() {
  val dataSet = listOf(42f, 38f, 45f, 51f)
    .toChartDataSet(
      title = "Support Tickets"
    )

  LineChart(dataSet)
}`}</code></pre>
          </div>
        </section>

        <section className="marketing-cta-section" aria-labelledby="cta-title">
          <div>
            <p className="marketing-eyebrow"><span /> Keep exploring</p>
            <h2 id="cta-title">Your data has a shape. Give it a good one.</h2>
          </div>
          <div className="marketing-actions">
            <Link href={`/${defaultVersion}/wiki`} className="marketing-button marketing-button-primary">Get started</Link>
            <a href="https://github.com/HDCharts/charts" target="_blank" rel="noopener noreferrer" className="marketing-button marketing-button-secondary">View on GitHub <span aria-hidden="true">↗</span></a>
          </div>
        </section>
      </main>

      <MarketingFooter versionId={defaultVersion} />
    </div>
  );
}
