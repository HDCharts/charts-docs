import type { CiStatsResult } from '@/lib/ci-stats-types';

const GITHUB_OWNER = 'HDCharts';
const GITHUB_REPOSITORY = 'charts';
const GITHUB_WORKFLOW = 'pull-request.yml';
const CACHE_SECONDS = 3600;
const PAGE_SIZE = 100;
const MAX_RESULTS_PER_QUERY = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

interface GitHubWorkflowRun {
  id: number;
  status: string;
  run_started_at?: string | null;
  updated_at: string;
}

interface GitHubWorkflowRunsResponse {
  total_count?: number;
  workflow_runs?: GitHubWorkflowRun[];
}

interface DateRange {
  start: string;
  end: string;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function getCurrentYearRange(): DateRange {
  const now = new Date();
  return {
    start: `${now.getUTCFullYear()}-01-01`,
    end: formatDate(now.getTime()),
  };
}

function splitDateRange(range: DateRange): [DateRange, DateRange] {
  const start = Date.parse(`${range.start}T00:00:00.000Z`);
  const end = Date.parse(`${range.end}T00:00:00.000Z`);
  const days = Math.round((end - start) / DAY_MS) + 1;
  if (days <= 1) {
    throw new Error(`GitHub returned more than ${MAX_RESULTS_PER_QUERY} workflow runs for one day`);
  }

  const leftDays = Math.floor(days / 2);
  const splitStart = start + leftDays * DAY_MS;

  return [
    { start: range.start, end: formatDate(splitStart - DAY_MS) },
    { start: formatDate(splitStart), end: range.end },
  ];
}

function getRunMinutes(run: GitHubWorkflowRun): number {
  const startedAt = Date.parse(run.run_started_at ?? '');
  const completedAt = Date.parse(run.updated_at);

  if (!Number.isFinite(startedAt) || !Number.isFinite(completedAt) || completedAt < startedAt) {
    return 0;
  }

  return (completedAt - startedAt) / 60_000;
}

async function fetchWorkflowRunsPage(range: DateRange, page: number): Promise<GitHubWorkflowRunsResponse> {
  const url = new URL(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPOSITORY}/actions/runs`,
  );
  url.searchParams.set('workflow_id', GITHUB_WORKFLOW);
  url.searchParams.set('status', 'completed');
  url.searchParams.set('created', `${range.start}..${range.end}`);
  url.searchParams.set('per_page', `${PAGE_SIZE}`);
  url.searchParams.set('page', `${page}`);

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const token = process.env.CHARTS_GITHUB_TOKEN?.trim();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    headers,
    next: {
      revalidate: CACHE_SECONDS,
      tags: ['charts-ci-stats'],
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub returned HTTP ${response.status}`);
  }

  return (await response.json()) as GitHubWorkflowRunsResponse;
}

async function fetchWorkflowRuns(range: DateRange): Promise<GitHubWorkflowRun[]> {
  const firstPage = await fetchWorkflowRunsPage(range, 1);
  const totalCount = firstPage.total_count ?? firstPage.workflow_runs?.length ?? 0;

  if (totalCount > MAX_RESULTS_PER_QUERY) {
    const [leftRange, rightRange] = splitDateRange(range);
    const [leftRuns, rightRuns] = await Promise.all([
      fetchWorkflowRuns(leftRange),
      fetchWorkflowRuns(rightRange),
    ]);
    return [...leftRuns, ...rightRuns];
  }

  const runs = [...(firstPage.workflow_runs ?? [])];
  let page = 2;
  while (runs.length < totalCount) {
    const nextPage = await fetchWorkflowRunsPage(range, page);
    const pageRuns = nextPage.workflow_runs ?? [];
    runs.push(...pageRuns);
    if (pageRuns.length < PAGE_SIZE) {
      break;
    }
    page += 1;
  }

  return runs;
}

export async function getCiStats(): Promise<CiStatsResult> {
  try {
    const runs = await fetchWorkflowRuns(getCurrentYearRange());
    const uniqueRuns = [...new Map(runs.map((run) => [run.id, run])).values()];

    const totalMinutes = uniqueRuns.reduce((total, run) => total + getRunMinutes(run), 0);

    return {
      validationMinutes: Math.round(totalMinutes),
      completedRuns: uniqueRuns.length,
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
