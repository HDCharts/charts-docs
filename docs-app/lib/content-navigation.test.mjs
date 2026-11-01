import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const libDirectory = path.dirname(fileURLToPath(import.meta.url));
const appDirectory = path.resolve(libDirectory, '..');
const buildDirectory = mkdtempSync(path.join(appDirectory, '.test-navigation-'));
let getPageHeadings;
let getMigrationReleasePage;
let OnThisPage;

try {
  // Compile only the modules under test so Node can exercise the actual TS and
  // TSX implementation without adding a separate test stack.
  const outputDirectory = path.join(buildDirectory, 'out');
  const configPath = path.join(buildDirectory, 'tsconfig.json');
  writeFileSync(configPath, JSON.stringify({
    extends: path.join(appDirectory, 'tsconfig.json'),
    compilerOptions: {
      incremental: false,
      module: 'Node16',
      moduleResolution: 'Node16',
      noEmit: false,
      outDir: outputDirectory,
      rootDir: appDirectory,
      typeRoots: [path.join(appDirectory, 'node_modules', '@types')],
      types: ['node', 'react', 'react-dom'],
    },
    files: [
      path.join(appDirectory, 'lib', 'content.ts'),
      path.join(appDirectory, 'components', 'OnThisPage.tsx'),
    ],
    include: [],
  }));
  execFileSync('tsc', ['--project', configPath], { cwd: appDirectory, stdio: 'inherit' });

  const requireFromApp = createRequire(import.meta.url);
  ({ getPageHeadings, getMigrationReleasePage } = requireFromApp(
    path.join(outputDirectory, 'lib', 'content.js'),
  ));
  ({ OnThisPage } = requireFromApp(
    path.join(outputDirectory, 'components', 'OnThisPage.js'),
  ));
} finally {
  rmSync(buildDirectory, { recursive: true, force: true });
}

test('getPageHeadings keeps H2-only pages unchanged', () => {
  assert.deepEqual(getPageHeadings('# Page title\n\n## Overview\n\n## API Reference'), [
    { title: 'Overview', anchor: 'overview', level: 2 },
    { title: 'API Reference', anchor: 'api-reference', level: 2 },
  ]);
});

test('getPageHeadings includes ordered H3 headings only under Capabilities', () => {
  const content = [
    '## Overview',
    '### Intro detail',
    '## Capabilities',
    '### Multiple Series',
    '### Fixed Value Range',
    '## API Reference',
    '### Internal Detail',
  ].join('\n');

  assert.deepEqual(getPageHeadings(content), [
    { title: 'Overview', anchor: 'overview', level: 2 },
    { title: 'Capabilities', anchor: 'capabilities', level: 2 },
    { title: 'Multiple Series', anchor: 'multiple-series', level: 3 },
    { title: 'Fixed Value Range', anchor: 'fixed-value-range', level: 3 },
    { title: 'API Reference', anchor: 'api-reference', level: 2 },
  ]);
});

test('getPageHeadings ignores heading-like lines inside fenced code blocks', () => {
  const content = [
    '## Capabilities',
    '```markdown',
    '## Fake section',
    '### Fake capability',
    '```',
    '### Real capability',
    '~~~',
    '### Also code',
    '~~~',
  ].join('\n');

  assert.deepEqual(getPageHeadings(content), [
    { title: 'Capabilities', anchor: 'capabilities', level: 2 },
    { title: 'Real capability', anchor: 'real-capability', level: 3 },
  ]);
});

test('migration-style repeated H3 headings stay excluded while H2 links remain', () => {
  const content = [
    '## charts-core',
    '### Before',
    '### After',
    '## charts-ui',
    '### Before',
    '### After',
  ].join('\n');

  assert.deepEqual(getPageHeadings(content), [
    { title: 'charts-core', anchor: 'charts-core', level: 2 },
    { title: 'charts-ui', anchor: 'charts-ui', level: 2 },
  ]);
});

test('generated migration release pages continue excluding demoted H3 headings', () => {
  const migrationPage = getMigrationReleasePage('2.3.0', '2.3.0');
  assert.ok(migrationPage, 'expected the 2.3.0 migration page to exist');
  assert.match(migrationPage.content, /^### /m, 'expected migration subsections to use H3');

  assert.deepEqual(getPageHeadings(migrationPage.content), []);
});

test('OnThisPage nests capability links in order with their generated anchors', () => {
  const headings = getPageHeadings([
    '## Overview',
    '## Capabilities',
    '### Multiple Series',
    '### Fixed Value Range',
    '## API Reference',
  ].join('\n'));

  const html = renderToStaticMarkup(React.createElement(OnThisPage, { headings }));
  const overview = html.indexOf('href="#overview"');
  const capabilities = html.indexOf('href="#capabilities"');
  const multipleSeries = html.indexOf('href="#multiple-series"');
  const fixedRange = html.indexOf('href="#fixed-value-range"');
  const apiReference = html.indexOf('href="#api-reference"');

  assert.ok(overview < capabilities);
  assert.ok(capabilities < multipleSeries);
  assert.ok(multipleSeries < fixedRange);
  assert.ok(fixedRange < apiReference);
  assert.match(html, /<li class="min-w-0"><a href="#capabilities"[^>]*>Capabilities<\/a><ul/);
  assert.match(html, /href="#multiple-series"[^>]*>Multiple Series<\/a>/);
  assert.match(html, /href="#fixed-value-range"[^>]*>Fixed Value Range<\/a>/);
});

test('OnThisPage renders an H2-only page without an empty child list', () => {
  const headings = getPageHeadings('## Overview\n\n## API Reference');
  const html = renderToStaticMarkup(React.createElement(OnThisPage, { headings }));

  assert.equal((html.match(/<ul/g) ?? []).length, 1);
  assert.match(html, /href="#overview"/);
  assert.match(html, /href="#api-reference"/);
});

test('OnThisPage wraps long labels within the existing sidebar width', () => {
  const headings = getPageHeadings('## Capabilities\n### A Capability Heading With A Long Name');
  const html = renderToStaticMarkup(React.createElement(OnThisPage, { headings }));

  assert.match(html, /break-words/);
  assert.match(html, /href="#a-capability-heading-with-a-long-name"/);
});
