import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';

const libDirectory = path.dirname(fileURLToPath(import.meta.url));
const appDirectory = path.resolve(libDirectory, '..');
const repositoryDirectory = path.resolve(appDirectory, '..');
const manifestPath = path.join(appDirectory, 'public', 'snapshot-manifest.json');
const buildDirectory = mkdtempSync(path.join(appDirectory, '.test-artifact-version-'));
let getPage;
let resolveArtifactVersion;

try {
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
      types: ['node'],
    },
    files: [path.join(appDirectory, 'lib', 'content.ts')],
    include: [],
  }));
  execFileSync('tsc', ['--project', configPath], { cwd: appDirectory, stdio: 'inherit' });
  ({ getPage, resolveArtifactVersion } = createRequire(import.meta.url)(
    path.join(outputDirectory, 'lib', 'content.js'),
  ));
} finally {
  rmSync(buildDirectory, { recursive: true, force: true });
}

const codeBlocks = (markdown) => unified().use(remarkParse).parse(markdown).children
  .filter((node) => node.type === 'code')
  .map((node) => node.value);

test('snapshot wiki dependency uses the published version in the real manifest', () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const page = getPage('snapshot', 'bar-chart');

  assert.ok(page);
  assert.match(page.content, new RegExp(`io\\.github\\.hdcharts:bar:${manifest.charts_version}`));
  assert.match(page.content, /\/content\/snapshot\/wiki\/assets\/bar_default\.gif/);
  assert.doesNotMatch(page.content, /\{\{artifactVersion\}\}/);
});

test('release wiki uses its selected version and existing route substitution', () => {
  assert.equal(resolveArtifactVersion('3.0.0'), '3.0.0');
  const page = getPage('3.0.0', 'getting-started');

  assert.ok(page);
  assert.match(page.content, /io\.github\.hdcharts:charts:<version>/);
  assert.doesNotMatch(page.content, /\{\{artifactVersion\}\}/);
  const barPage = getPage('3.0.0', 'bar-chart');
  assert.ok(barPage);
  assert.match(barPage.content, /\/content\/3\.0\.0\/wiki\/assets\//);
});

test('missing snapshot metadata leaves the artifact placeholder unresolved', () => {
  assert.equal(resolveArtifactVersion('snapshot', '{}'), null);
  assert.equal(resolveArtifactVersion('snapshot', '{"charts_version":"snapshot"}'), null);
  const original = fs.readFileSync(manifestPath, 'utf8');
  try {
    fs.writeFileSync(manifestPath, '{}');
    const page = getPage('snapshot', 'bar-chart');
    assert.ok(page);
    assert.match(page.content, /io\.github\.hdcharts:bar:\{\{artifactVersion\}\}/);
  } finally {
    fs.writeFileSync(manifestPath, original);
  }
});

test('rendered Markdown code and copied code text contain the resolved dependency', () => {
  const page = getPage('snapshot', 'getting-started');
  assert.ok(page);
  const dependencies = codeBlocks(page.content).join('\n');

  assert.match(dependencies, /implementation\("io\.github\.hdcharts:bar:3\.0\.1-SNAPSHOT"\)/);
  assert.doesNotMatch(dependencies, /\{\{artifactVersion\}\}/);
});

test('explicit historical dependency versions remain unchanged', () => {
  const source = fs.readFileSync(
    path.join(repositoryDirectory, 'content', '2.4.0', 'wiki', 'getting-started.md'),
    'utf8',
  );
  const page = getPage('2.4.0', 'getting-started');

  assert.ok(page);
  assert.match(page.content, /io\.github\.dautovicharis:charts:<version>/);
  assert.equal(
    page.content,
    matter(source).content.replaceAll('{{version}}', '2.4.0').replaceAll('{{versionLabel}}', '2.4.0'),
  );
});
