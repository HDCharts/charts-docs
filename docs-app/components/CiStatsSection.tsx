'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CiStatsResult } from '@/lib/ci-stats-types';

function formatValidationHours(minutes: number): string {
  if (minutes < 60) {
    return minutes > 0 ? '<1h' : '0h';
  }

  return `${Math.round(minutes / 60)}h`;
}

function LoadingStat({ label }: { label: string }) {
  return <span className="marketing-stat-loader" role="status" aria-label={`Loading ${label}`} />;
}

export function CiStatsSection() {
  const [stats, setStats] = useState<CiStatsResult | null>(null);

  useEffect(() => {
    let active = true;

    fetch('/api/ci-stats', { cache: 'no-store' })
      .then(async (response) => {
        const result = (await response.json()) as CiStatsResult;
        if (!response.ok && !result.error) {
          throw new Error(`CI stats API returned HTTP ${response.status}`);
        }
        return result;
      })
      .then((result) => {
        if (active) {
          setStats(result);
        }
      })
      .catch(() => {
        if (active) {
          setStats({ validationMinutes: 0, completedRuns: 0, error: 'CI statistics are temporarily unavailable.' });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const isUnavailable = stats?.error;
  const validationHours = stats && !isUnavailable ? formatValidationHours(stats.validationMinutes) : '—';
  const runs = stats && !isUnavailable ? `${stats.completedRuns}` : '—';

  return (
    <section className="marketing-stats-section" aria-labelledby="stats-title" aria-busy={!stats}>
      <div className="marketing-stats-copy">
        <p className="marketing-eyebrow"><span /> Open development</p>
        <h2 id="stats-title">Built in the open. Tested across platforms.</h2>
        <p>
          HDCharts runs its core checks across Android, iOS, JVM, and Web as the project evolves.
        </p>
        <Link
          href="/workflow"
          className="marketing-text-link"
        >
          See the workflow <span aria-hidden="true">↗</span>
        </Link>
      </div>

      <div className="marketing-stats-grid">
        <div className="marketing-stat-card">
          <strong>{!stats ? <LoadingStat label="validation hours" /> : validationHours}</strong>
          <span>validation hours<br />last 30 days</span>
        </div>
        <div className="marketing-stat-card">
          <strong>4</strong>
          <span>platforms checked<br />in core CI</span>
        </div>
        <div className="marketing-stat-card">
          <strong>{!stats ? <LoadingStat label="completed runs" /> : runs}</strong>
          <span>completed runs<br />last 30 days</span>
        </div>
      </div>
    </section>
  );
}
