import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const lib = path.dirname(fileURLToPath(import.meta.url));
const build = mkdtempSync(path.join(lib, '.test-search-index-'));
let indexPage;
let searchDocumentation;

try {
  execFileSync('tsc', [
    '--ignoreConfig', '--module', 'commonjs', '--target', 'es2022', '--skipLibCheck',
    '--outDir', build, path.join(lib, 'search-index-parser.ts'), path.join(lib, 'search.ts'),
  ], { cwd: path.dirname(lib), stdio: 'inherit' });
  const require = createRequire(import.meta.url);
  ({ indexPage } = require(path.join(build, 'search-index-parser.js')));
  ({ searchDocumentation } = require(path.join(build, 'search.js')));
} finally {
  rmSync(build, { recursive: true, force: true });
}

test('nested chart capabilities link directly to H3 anchors', () => {
  const entries = indexPage({
    title: 'Line Chart',
    content: [
      '# Line Chart',
      'Introduction',
      '## Capabilities',
      'Configure line styles',
      '### Multiple Series',
      'Use multiple data series',
      '### Morphing',
      'Animate values with morphing',
      '## API Reference',
      'LineChart API',
    ].join('\n'),
  }, '/snapshot/wiki/line-chart');

  assert.deepEqual(entries.map(({ url }) => url), [
    '/snapshot/wiki/line-chart',
    '/snapshot/wiki/line-chart#capabilities',
    '/snapshot/wiki/line-chart#multiple-series',
    '/snapshot/wiki/line-chart#morphing',
    '/snapshot/wiki/line-chart#api-reference',
  ]);
  assert.equal(searchDocumentation(entries, 'morphing')[0]?.url, '/snapshot/wiki/line-chart#morphing');
  assert.equal(searchDocumentation(entries, 'multiple series')[0]?.url, '/snapshot/wiki/line-chart#multiple-series');
});

test('formatted headings use the rendered plain-text anchor, not markdown punctuation', () => {
  const entries = indexPage({
    title: 'Line Chart',
    content: '## Capabilities\n### **Fixed** \x60Value Range\x60\nControl the bounds',
  }, '/3.1.0/wiki/line-chart');

  assert.equal(entries[2].section, 'Fixed Value Range');
  assert.equal(entries[2].url, '/3.1.0/wiki/line-chart#fixed-value-range');
});

test('markdown headings inside code fences are not indexed as sections', () => {
  const entries = indexPage({
    title: 'Line Chart',
    content: [
      '## Basic Usage',
      '~~~kotlin',
      '### Not a heading',
      '~~~',
      '### Gradients',
      'Gradient fill',
    ].join('\n'),
  }, '/snapshot/wiki/line-chart');

  assert.deepEqual(entries.map(({ section }) => section), [undefined, 'Basic Usage', 'Gradients']);
});
