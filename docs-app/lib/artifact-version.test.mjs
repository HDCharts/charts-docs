import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import artifactVersion from './artifact-version.cjs';

const { resolveArtifactVersion, resolveKotlinArtifactVersion } = artifactVersion;

const snapshotManifest = JSON.stringify({
  charts_version: '3.0.1-SNAPSHOT',
});

test('resolves snapshot docs to the artifact version recorded by publication', () => {
  assert.equal(resolveArtifactVersion('snapshot', snapshotManifest), '3.0.1-SNAPSHOT');
});

test('resolves released docs to their immutable release version', () => {
  assert.equal(resolveArtifactVersion('3.0.0', snapshotManifest), '3.0.0');
  assert.equal(resolveArtifactVersion('2.4.0', snapshotManifest), '2.4.0');
  assert.equal(resolveArtifactVersion('3.1.0', snapshotManifest), '3.1.0');
});

test('preserves the placeholder when snapshot metadata is missing, malformed, or inconsistent', () => {
  assert.equal(resolveArtifactVersion('snapshot', ''), null);
  assert.equal(resolveArtifactVersion('snapshot', '{'), null);
  assert.equal(resolveArtifactVersion('snapshot', JSON.stringify({
    charts_version: 'snapshot',
  })), null);
  assert.equal(resolveArtifactVersion('snapshot', snapshotManifest), '3.0.1-SNAPSHOT');
  assert.equal(resolveArtifactVersion('main', snapshotManifest), null);
});

test('resolves umbrella, modular, and BOM coordinates across multiple Kotlin snippets', () => {
  const markdown = [
    '## Installation',
    '',
    '```kotlin',
    'implementation("io.github.hdcharts:charts:{{artifactVersion}}")',
    '```',
    '',
    '```kotlin',
    'implementation("io.github.hdcharts:gauge:{{artifactVersion}}")',
    '```',
    '',
    '```kotlin',
    'implementation(platform("io.github.hdcharts:bom:{{artifactVersion}}"))',
    'implementation("io.github.hdcharts:line")',
    '```',
  ].join('\n');

  const result = resolveKotlinArtifactVersion(markdown, '3.0.1-SNAPSHOT');
  assert.equal((result.match(/3\.0\.1-SNAPSHOT/g) ?? []).length, 3);
  assert.doesNotMatch(result, /\{\{artifactVersion\}\}/);

  const legacy = resolveKotlinArtifactVersion(markdown, '2.4.0');
  assert.match(legacy, /io\.github\.hdcharts:charts:2\.4\.0/);
  assert.match(legacy, /io\.github\.hdcharts:bom:2\.4\.0/);
});

test('leaves unrelated placeholders and non-Kotlin code fences unchanged', () => {
  const markdown = [
    'Outside {{artifactVersion}} {{version}}',
    '',
    '```kotlin',
    'implementation("x:y:{{artifactVersion}}")',
    'val route = "{{version}}"',
    '```',
    '',
    '```gradle',
    'implementation("x:y:{{artifactVersion}}")',
    '```',
    '',
    '```text',
    '{{artifactVersion}}',
    '```',
  ].join('\n');

  const result = resolveKotlinArtifactVersion(markdown, '3.0.1-SNAPSHOT');
  assert.match(result, /Outside \{\{artifactVersion\}\} \{\{version\}\}/);
  assert.match(result, /val route = "\{\{version\}\}"/);
  assert.match(result, /```gradle\nimplementation\("x:y:\{\{artifactVersion\}\}"\)/);
  assert.match(result, /```text\n\{\{artifactVersion\}\}/);
  assert.match(result, /x:y:3\.0\.1-SNAPSHOT/);
});

test('copy input is the resolved code parsed from a Kotlin fence', async () => {
  const markdown = '```kotlin\nimplementation("io.github.hdcharts:charts:{{artifactVersion}}")\n```';
  const resolved = resolveKotlinArtifactVersion(markdown, '3.0.1-SNAPSHOT');
  const tree = unified().use(remarkParse).parse(resolved);
  const code = tree.children.find((node) => node.type === 'code');

  assert.equal(code.lang, 'kotlin');
  assert.equal(code.value, 'implementation("io.github.hdcharts:charts:3.0.1-SNAPSHOT")');
});

test('keeps historical release dependency examples and version tags unchanged', () => {
  const historicalPath = path.join('..', 'content', '2.4.0', 'wiki', 'getting-started.md');
  const historicalPage = fs.readFileSync(historicalPath, 'utf8');
  assert.equal(resolveKotlinArtifactVersion(historicalPage, '2.4.0'), historicalPage);

  const historical = [
    '~~~kotlin',
    'implementation("io.github.dautovicharis:charts:2.4.0")',
    'implementation(platform("io.github.dautovicharis:charts-bom:2.4.0"))',
    '~~~',
  ].join('\n');
  assert.equal(resolveKotlinArtifactVersion(historical, '2.4.0'), historical);
});

test('leaves every published release Markdown page byte-for-byte unchanged', () => {
  const contentRoot = path.join('..', 'content');
  const releaseIds = fs.readdirSync(contentRoot).filter((entry) => /^\d+\.\d+\.\d+$/.test(entry));

  function markdownFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) return markdownFiles(filePath);
      return /\.mdx?$/.test(entry.name) ? [filePath] : [];
    });
  }

  for (const releaseId of releaseIds) {
    for (const filePath of markdownFiles(path.join(contentRoot, releaseId))) {
      const markdown = fs.readFileSync(filePath, 'utf8');
      assert.equal(
        resolveKotlinArtifactVersion(markdown, resolveArtifactVersion(releaseId, '')),
        markdown,
        filePath,
      );
    }
  }
});

test('keeps fenced Kotlin template source intact when metadata is unavailable', () => {
  const markdown = '```kotlin\nimplementation("io.github.hdcharts:charts:{{artifactVersion}}")\n```';
  assert.equal(resolveKotlinArtifactVersion(markdown, null), markdown);
});
