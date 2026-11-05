// Sidebar icon names follow wiki slugs, not display titles (which can vary by version).
const ICONS: Record<string, string> = {
  '': 'overview',
  'bar-chart': 'bar',
  'heatmap-chart': 'heatmap',
  'histogram-chart': 'histogram',
  'line-chart': 'line',
  'pie-chart': 'pie',
  'radar-chart': 'radar',
  'ring-gauge-chart': 'ring-gauge',
  'scatter-chart': 'scatter',
  'segmented-ring-gauge-chart': 'segmented-ring',
  'stacked-area-chart': 'stacked-area',
  'stacked-bar-chart': 'stacked-bar',
  customization: 'customization',
  gradients: 'gradients',
  migration: 'migration',
  screenshots: 'screenshots',
};

export function WikiNavIcon({ slug, active }: { slug: string; active: boolean }) {
  const icon = ICONS[slug] ?? 'document';

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)]'}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <use href={`/wiki-nav-icons.svg#${icon}`} />
    </svg>
  );
}
