import type { CiStatsResult } from '@/lib/ci-stats-types';

const GITHUB_OWNER = 'HDCharts';
const GITHUB_REPOSITORY = 'charts';
const GITHUB_WORKFLOW = 'pull-request.yml';
const WINDOW_DAYS = 30;
const CACHE_SECONDS = 3600;
const PAGE_SIZE = 100;

interface GitHubWorkflowRun {
  status: string;
  run_started_at?: string | null;
  updated_at: string;
}

interface GitHubWorkflowRunsResponse {
  total_count?: number;
  workflow_runs?: GitHubWorkflowRun[];
}

function getWindowStart(): string {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - WINDOW_DAYS);
  return start.toISOString();
}

function getRunMinutes(run: GitHubWorkflowRun): number {
  const startedAt = Date.parse(run.run_started_at ?? '');
  const completedAt = Date.parse(run.updated_at);

  if (!Number.isFinite(startedAt) || !Number.isFinite(completedAt) || completedAt < startedAt) {
    return 0;
  }

  return (completedAt - startedAt) / 60_000;
}

export async function getCiStats(): Promise<CiStatsResult> {
  const url = new URL(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPOSITORY}/actions/runs`,
  );
  url.searchParams.set('workflow_id', GITHUB_WORKFLOW);
  url.searchParams.set('status', 'completed');
  url.searchParams.set('created', `>=${getWindowStart()}`);
  url.searchParams.set('per_page', `${PAGE_SIZE}`);

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const token = process.env.CHARTS_GITHUB_TOKEN?.trim();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const runs: GitHubWorkflowRun[] = [];
    let page = 1;
    let totalCount: number | undefined;

    while (true) {
      const pageUrl = new URL(url);
      pageUrl.searchParams.set('page', `${page}`);
      const response = await fetch(pageUrl, {
        headers,
        next: {
          revalidate: CACHE_SECONDS,
          tags: ['charts-ci-stats'],
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub returned HTTP ${response.status}`);
      }

      const payload = (await response.json()) as GitHubWorkflowRunsResponse;
      const pageRuns = payload.workflow_runs ?? [];
      totalCount ??= payload.total_count;
      runs.push(...pageRuns.filter((run) => run.status === 'completed'));

      if (pageRuns.length < PAGE_SIZE || (totalCount !== undefined && page * PAGE_SIZE >= totalCount)) {
        break;
      }

      page += 1;
    }

    const totalMinutes = runs.reduce((total, run) => total + getRunMinutes(run), 0);

    return {
      validationMinutes: Math.round(totalMinutes),
      completedRuns: runs.length,
    };
  } catch (error) {
    console.error('Unable to load HDCharts CI stats:', error);
    return {
      validationMinutes: 0,
      completedRuns: 0,
      error: 'CI statistics are temporarily unavailable.',
    };
  }
}
