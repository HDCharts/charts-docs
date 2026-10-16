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
            <h1 id="hero-title">HDCharts, at home on every screen.</h1>
            <p className="marketing-hero-lead">
              Build clear, customizable data visualizations for Android, iOS, desktop, and web with one Compose-first library.
            </p>
            <div className="marketing-actions">
              <Link href={`/${defaultVersion}/wiki`} className="marketing-button marketing-button-primary">Read the docs</Link>
              <a href={`/demo/${defaultVersion}/`} target="_blank" rel="noopener noreferrer" className="marketing-button marketing-button-secondary">Open demo <span aria-hidden="true">↗</span></a>
            </div>
            <p className="marketing-hero-note">Line, bar, pie, radar, and histogram charts, with flexible styling and interaction.</p>
          </div>
          <ChartHeroVisual />
        </section>

        <section className="marketing-section marketing-code-section" aria-labelledby="code-title">
          <div className="marketing-code-copy">
            <p className="marketing-eyebrow"><span /> Quick start</p>
            <h2 id="code-title">A chart in a few lines.</h2>
            <p>Pass a list of numbers and get a line chart. Add styling and interaction when you need them.</p>
            <Link href={`/${defaultVersion}/wiki/getting-started`} className="marketing-text-link">Read the setup guide <span aria-hidden="true">→</span></Link>
          </div>
          <div className="marketing-code-card" aria-label="Kotlin example">
            <div className="marketing-code-bar"><span /><span /><span /><b>LineChart.kt</b></div>
            <pre><code>{`@Composable
private fun ShowLine() {
  val data = listOf(
    "Web Store" to listOf(42.0, 38.0, 45.0, 51.0),
    "Mobile App" to listOf(31.0, 35.0, 40.0, 44.0),
    "Partner Sales" to listOf(24.0, 29.0, 33.0, 39.0),
  ).toChartData(
    categories = listOf("Q1", "Q2", "Q3", "Q4"),
  )

  LineChart(data = data, title = "Revenue by Channel")
}`}</code></pre>
          </div>
        </section>

        <section className="marketing-cta-section" aria-labelledby="cta-title">
          <div>
            <p className="marketing-eyebrow"><span /> Keep exploring</p>
            <h2 id="cta-title">Find the chart that fits your data.</h2>
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
