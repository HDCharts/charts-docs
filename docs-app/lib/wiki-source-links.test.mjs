import assert from 'node:assert/strict';
import test from 'node:test';
import { buildWikiSourceUrl, resolveWikiSourceRevision } from './wiki-source-links.mjs';

const sha = '0123456789abcdef0123456789abcdef01234567';
const example = {
  sourcePath: 'sample/androidApp/src/main/kotlin/io/github/hdcharts/PieBasicExample.kt',
  snippetId: 'pie-basic-usage',
};

test('resolves snapshot documentation to its published source SHA', () => {
  assert.equal(
    resolveWikiSourceRevision('snapshot', {
      charts_version: '3.0.1-SNAPSHOT',
      source_sha: 'fedcba9876543210fedcba9876543210fedcba98',
      wiki_source_sha: sha,
      wiki_charts_version: '3.0.1-SNAPSHOT',
    }, null),
    sha,
  );
  assert.equal(
    resolveWikiSourceRevision('snapshot', { charts_version: '3.0.1-SNAPSHOT', source_sha: sha }, null),
    null,
    'artifact provenance alone does not identify the revision used to sync wiki Markdown',
  );
  assert.equal(resolveWikiSourceRevision('snapshot', {
    charts_version: '3.0.1-SNAPSHOT',
    wiki_source_sha: sha,
    wiki_charts_version: '3.0.0-SNAPSHOT',
  }, null), null, 'stale wiki metadata for a different snapshot version is rejected');
  assert.equal(resolveWikiSourceRevision('snapshot', {
    charts_version: '3.0.1-SNAPSHOT',
    wiki_source_sha: 'main',
    wiki_charts_version: '3.0.1-SNAPSHOT',
  }, null), null);
  assert.equal(resolveWikiSourceRevision('snapshot', null, null), null);
});

test('resolves releases to their matching manifest SHA or registered release tag', () => {
  assert.equal(
    resolveWikiSourceRevision('3.0.0', null, { charts_version: '3.0.0', source_sha: sha }, ['3.0.0']),
    sha,
  );
  assert.equal(resolveWikiSourceRevision('2.4.0', null, null, ['3.0.0', '2.4.0']), '2.4.0');
  assert.equal(resolveWikiSourceRevision('4.0.0', null, null, ['3.0.0']), null);
  assert.equal(resolveWikiSourceRevision('snapshot', null, null), null);
});

test('builds a safe canonical GitHub link that targets the snippet marker', () => {
  assert.equal(
    buildWikiSourceUrl(example, sha),
    `https://github.com/HDCharts/charts/blob/${sha}/${example.sourcePath}#:~:text=BEGIN%20WIKI%20EXAMPLE%3A%20pie-basic-usage`,
  );
  assert.equal(
    buildWikiSourceUrl(example, '3.0.0'),
    `https://github.com/HDCharts/charts/blob/3.0.0/${example.sourcePath}#:~:text=BEGIN%20WIKI%20EXAMPLE%3A%20pie-basic-usage`,
  );
});

test('keeps separate source files and snippet targets for multiple examples on one page', () => {
  const second = {
    sourcePath: 'sample/androidApp/src/main/kotlin/io/github/hdcharts/LineExample.kt',
    snippetId: 'line-selection',
  };
  const links = [example, second].map((source) => buildWikiSourceUrl(source, sha));

  assert.ok(links[0].includes('PieBasicExample.kt#:~:text=BEGIN%20WIKI%20EXAMPLE%3A%20pie-basic-usage'));
  assert.ok(links[1].includes('LineExample.kt#:~:text=BEGIN%20WIKI%20EXAMPLE%3A%20line-selection'));
  assert.notEqual(links[0], links[1]);
});

test('omits links for missing revisions and unsafe paths or snippet identifiers', () => {
  assert.equal(buildWikiSourceUrl(example, null), null);
  assert.equal(buildWikiSourceUrl({ ...example, sourcePath: 'sample/../../secrets.kt' }, sha), null);
  assert.equal(buildWikiSourceUrl({ ...example, sourcePath: 'https://example.com/Evil.kt' }, sha), null);
  assert.equal(buildWikiSourceUrl({ ...example, sourcePath: 'sample/androidApp/build.gradle.kts' }, sha), null);
  assert.equal(buildWikiSourceUrl({ ...example, snippetId: '../main' }, sha), null);
});
