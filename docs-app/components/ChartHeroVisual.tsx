import Image from 'next/image';

export function ChartHeroVisual() {
  return (
    <div className="marketing-hero-visual" aria-label="A sample chart rendered with HDCharts" role="img">
      <div className="marketing-visual-toolbar">
        <span className="marketing-visual-status" />
        <span>Sample dataset</span>
        <span className="marketing-visual-toolbar-spacer" />
        <span className="marketing-visual-chip">MultiLine</span>
      </div>

      <Image
        className="marketing-hero-image"
        src="/charts-hero-chart.png"
        alt="A line chart rendered with HDCharts"
        width={720}
        height={390}
        priority
      />
    </div>
  );
}
