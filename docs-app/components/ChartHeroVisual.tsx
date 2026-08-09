import Image from 'next/image';

export function ChartHeroVisual() {
  return (
    <div className="marketing-hero-visual" aria-label="A sample chart rendered with Charts" role="img">
      <div className="marketing-visual-toolbar">
        <span className="marketing-visual-status" />
        <span>Sample dataset</span>
        <span className="marketing-visual-toolbar-spacer" />
        <span className="marketing-visual-chip">MultiLine</span>
      </div>

      <Image
        className="marketing-hero-image"
        src="/charts-hero-chart.png"
        alt="A line chart rendered with Charts"
        width={800}
        height={440}
        priority
      />

      <div className="marketing-visual-metric">
        <strong>+46%</strong>
        <span>total revenue</span>
      </div>
    </div>
  );
}
