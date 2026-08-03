'use client';

import { useEffect, useState } from 'react';
import type { GoldenScreenshot, GoldenScreenshotResult } from '@/lib/golden-screenshot-types';

function groupScreenshots(screenshots: GoldenScreenshot[]): Map<string, GoldenScreenshot[]> {
  return screenshots.reduce<Map<string, GoldenScreenshot[]>>((groups, screenshot) => {
    const group = groups.get(screenshot.chart) ?? [];
    group.push(screenshot);
    groups.set(screenshot.chart, group);
    return groups;
  }, new Map());
}

export function GoldenScreenshotsGallery() {
  const [result, setResult] = useState<GoldenScreenshotResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadScreenshots() {
      try {
        const response = await fetch('/api/golden-screenshots', { cache: 'no-store' });
        const payload = (await response.json()) as GoldenScreenshotResult;

        if (!response.ok && !payload.error) {
          throw new Error(`Screenshot API returned HTTP ${response.status}`);
        }

        if (!cancelled) {
          setResult(payload);
        }
      } catch {
        if (!cancelled) {
          setResult({
            screenshots: [],
            error: 'Screenshots are temporarily unavailable.',
          });
        }
      }
    }

    void loadScreenshots();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!result) {
    return <p className="text-[var(--text-muted)]">Loading screenshots…</p>;
  }

  if (result.error) {
    return (
      <p className="text-[var(--color-warning)]" role="alert">
        {result.error}
      </p>
    );
  }

  if (result.screenshots.length === 0) {
    return <p className="text-[var(--text-muted)]">No screenshots were found.</p>;
  }

  const groupedScreenshots = groupScreenshots(result.screenshots);

  return (
    <div className="space-y-12">
      {Array.from(groupedScreenshots, ([chart, chartScreenshots]) => (
        <section key={chart} aria-labelledby={`golden-${chart}`}>
          <h2 id={`golden-${chart}`} className="mt-0">
            {chart}
          </h2>
          <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
            {chartScreenshots.map((screenshot) => (
              <figure key={screenshot.path}>
                <a
                  href={screenshot.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block no-underline"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={screenshot.imageUrl}
                    alt={screenshot.name}
                    loading="lazy"
                    decoding="async"
                    className="mx-auto h-auto max-h-[720px] w-full rounded-lg object-contain"
                  />
                </a>
                <figcaption className="mt-3 text-center text-sm text-[var(--text-secondary)]">
                  {screenshot.name}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
