import type { GoldenScreenshot, GoldenScreenshotResult } from '@/lib/golden-screenshot-types';

const GITHUB_OWNER = 'HDCharts';
const GITHUB_REPOSITORY = 'charts';
const GITHUB_REF = 'main';
const GOLDEN_SCREENSHOTS_ROOT = 'androidApp/src/screenshotTestDebug/reference/';
const GITHUB_TREE_URL =
  `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPOSITORY}/git/trees/${GITHUB_REF}?recursive=1`;

interface GitHubTreeEntry {
  path: string;
  mode: string;
  type: string;
  sha: string;
}

interface GitHubTreeResponse {
  tree?: GitHubTreeEntry[];
  truncated?: boolean;
}

function encodePath(path: string): string {
  return path.split('/').map((segment) => encodeURIComponent(segment)).join('/');
}

function humanize(value: string): string {
  return value
    .replace(/ScreenshotTestKt$/, '')
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

function toGoldenScreenshot(entry: GitHubTreeEntry): GoldenScreenshot {
  const relativePath = entry.path.slice(GOLDEN_SCREENSHOTS_ROOT.length);
  const pathParts = relativePath.split('/');
  const filename = pathParts.at(-1) ?? relativePath;
  const chartIdentifier = (pathParts.at(-2) ?? 'Charts').replace(/ScreenshotTestKt$/, '');
  const chart = humanize(chartIdentifier);
  const previewFilename = filename
    .replace(/\.png$/, '')
    .replace(/_[0-9a-f]{8}_\d+$/, '');
  const themeMatch = previewFilename.match(/_(Dark|Light(?: Tablet(?: Landscape)?)?)$/);
  const theme = themeMatch?.[1] ?? 'Unknown';
  const previewIdentifier = previewFilename
    .slice(0, themeMatch?.index ?? previewFilename.length)
    .replace(chartIdentifier, '')
    .replace(/Preview$/, '');
  const encodedPath = encodePath(entry.path);

  return {
    name: humanize(previewIdentifier || 'Default'),
    chart,
    theme,
    path: entry.path,
    imageUrl: `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPOSITORY}/${GITHUB_REF}/${encodedPath}?v=${entry.sha}`,
    sourceUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPOSITORY}/blob/${GITHUB_REF}/${encodedPath}`,
  };
}

export async function getGoldenScreenshots(): Promise<GoldenScreenshotResult> {
  const token = process.env.CHARTS_GITHUB_TOKEN?.trim();
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(GITHUB_TREE_URL, {
      headers,
      next: {
        revalidate: 900,
        tags: ['charts-golden-screenshots'],
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub returned HTTP ${response.status}`);
    }

    const payload = (await response.json()) as GitHubTreeResponse;
    if (payload.truncated) {
      throw new Error('GitHub returned a truncated repository tree');
    }

    const screenshots = (payload.tree ?? [])
      .filter(
        (entry) =>
          entry.type === 'blob' &&
          entry.path.startsWith(GOLDEN_SCREENSHOTS_ROOT) &&
          entry.path.toLowerCase().endsWith('.png'),
      )
      .sort((left, right) => left.path.localeCompare(right.path))
      .map(toGoldenScreenshot)
      .filter((screenshot) => screenshot.theme === 'Dark');

    return { screenshots };
  } catch (error) {
    console.error('Unable to load Charts golden screenshots:', error);
    return {
      screenshots: [],
      error: 'Screenshots are temporarily unavailable.',
    };
  }
}
