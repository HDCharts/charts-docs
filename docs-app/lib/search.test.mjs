import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const lib = path.dirname(fileURLToPath(import.meta.url));
const build = mkdtempSync(path.join(lib, '.test-search-'));
let searchDocumentation;
let searchSnippet;
let searchBothVersions;

try {
  execFileSync('tsc', [
    '--ignoreConfig', '--module', 'commonjs', '--target', 'es2022', '--skipLibCheck',
    '--outDir', build, path.join(lib, 'search.ts'),
  ], { cwd: path.dirname(lib), stdio: 'inherit' });
  ({ searchDocumentation, searchSnippet, searchBothVersions } = createRequire(import.meta.url)(path.join(build, 'search.js')));
} finally {
  rmSync(build, { recursive: true, force: true });
}

test('search prioritizes matching sections and returns one result per page', () => {
  const entries = [
    { title: 'Line Chart', url: '/3.1.0/wiki/line-chart', text: 'Overview' },
    { title: 'Line Chart', section: 'Gradients', url: '/3.1.0/wiki/line-chart#gradients', text: 'Configure colors' },
    { title: 'Pie Chart', url: '/3.1.0/wiki/pie-chart', text: 'Gradients on slices' },
  ];
  assert.deepEqual(searchDocumentation(entries, 'gradients').map((result) => result.url), [
    '/3.1.0/wiki/line-chart#gradients',
    '/3.1.0/wiki/pie-chart',
  ]);
});

test('search matches Kotlin API symbols in section bodies', () => {
  const entries = [
    { title: 'Data Mapping', section: 'Basic Usage', url: '/snapshot/wiki/data-mapping#basic-usage', text: 'Use toChartData on your model' },
  ];
  assert.equal(searchDocumentation(entries, 'tochartdata')[0].url, entries[0].url);
  assert.deepEqual(searchDocumentation(entries, 'missing'), []);
  assert.deepEqual(searchDocumentation(entries, ''), []);
});

test('searches the latest release and snapshot together without choosing a scope', () => {
  const latest = {
    version: '3.1.0',
    entries: [{ title: 'Line Chart', url: '/3.1.0/wiki/line-chart', text: 'Gradient support' }],
  };
  const snapshot = {
    version: 'snapshot',
    entries: [{ title: 'Line Chart', url: '/snapshot/wiki/line-chart', text: 'Gradient support' }],
  };
  const groups = searchBothVersions(latest, snapshot, 'gradient');
  assert.deepEqual(groups.map(({ scope, version }) => [scope, version]), [
    ['latest', '3.1.0'],
    ['snapshot', 'snapshot'],
  ]);
  assert.deepEqual(groups.flatMap(({ results }) => results.map((entry) => entry.url)), [
    '/3.1.0/wiki/line-chart',
    '/snapshot/wiki/line-chart',
  ]);
});

test('snippets show nearby matches and stay bounded', () => {
  const snippet = searchSnippet('A '.repeat(80) + 'animateOnStart and more', 'animateOnStart');
  assert.match(snippet, /animateOnStart/);
  assert.ok(snippet.length < 165);
});
