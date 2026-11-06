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

const snapshotArtifactVersion = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).charts_version;

test('snapshot wiki dependency uses the published version in the real manifest', () => {
  const page = getPage('snapshot', 'bar-chart');

  assert.ok(page);
  assert.match(page.content, new RegExp(`io\\.github\\.hdcharts:bar:${snapshotArtifactVersion}`));
  assert.match(page.content, /\/content\/snapshot\/wiki\/assets\/bar_default\.gif/);
  assert.doesNotMatch(page.content, /\{\{artifactVersion\}\}/);
});


test('snapshot badges use the docs manifest, not highest Maven metadata version', () => {
  for (const version of ['3.0.0', '3.1.0', 'snapshot']) {
    const page = getPage(version, 'getting-started');

    assert.ok(page);
    assert.ok(
      page.content.includes(
        `https://img.shields.io/static/v1?label=Snapshots&message=${snapshotArtifactVersion}&color=4285F4`,
      ),
      `expected ${version} snapshot badge to match the manifest`,
    );
    assert.doesNotMatch(page.content, /maven-metadata\/v\?/);
    assert.doesNotMatch(page.content, /\{\{snapshotVersion\}\}/);
  }
});

test('release wiki uses its selected version and existing route substitution', () => {
  assert.equal(resolveArtifactVersion('3.0.0'), '3.0.0');
  const page = getPage('3.0.0', 'getting-started');

  assert.ok(page);
  const dependencies = codeBlocks(page.content).join('\n');
  assert.match(dependencies, /io\.github\.hdcharts:charts:3\.0\.0/);
  assert.match(dependencies, /io\.github\.hdcharts:line:3\.0\.0/);
  assert.match(dependencies, /io\.github\.hdcharts:gauge:3\.0\.0/);
  assert.match(dependencies, /io\.github\.hdcharts:bom:3\.0\.0/);
  assert.equal((dependencies.match(/io\.github\.hdcharts:[\w-]+:3\.0\.0/g) ?? []).length, 10);
  assert.doesNotMatch(dependencies, /\{\{artifactVersion\}\}/);
  assert.doesNotMatch(dependencies, /io\.github\.hdcharts:[\w-]+:<version>/);
  assert.doesNotMatch(page.content, /Dependencies below use the selected documentation version/);
  assert.doesNotMatch(page.content, /Replace `<version>`/);
  assert.match(page.content, /io\.github\.hdcharts:charts:<snapshot-version>/);

  const ringGauge = getPage('3.0.0', 'ring-gauge-chart');
  assert.ok(ringGauge);
  assert.match(ringGauge.content, /io\.github\.hdcharts:gauge:3\.0\.0/);
  assert.match(ringGauge.content, /\/content\/3\.0\.0\/wiki\/assets\/ring_gauge_default\.gif/);
  assert.doesNotMatch(ringGauge.content, /\{\{version\}\}|\{\{artifactVersion\}\}/);
});

test('missing snapshot metadata leaves the artifact placeholder unresolved', () => {
  assert.equal(resolveArtifactVersion('snapshot', ''), null);
  assert.equal(resolveArtifactVersion('snapshot', '{}'), null);
  assert.equal(resolveArtifactVersion('snapshot', '{"charts_version":"snapshot"}'), null);
  assert.equal(resolveArtifactVersion('snapshot', '{'), null);
});

test('rendered Markdown code and copied code text contain the resolved dependency', () => {
  const page = getPage('snapshot', 'getting-started');
  assert.ok(page);
  const dependencies = codeBlocks(page.content).join('\n');

  assert.match(
    dependencies,
    new RegExp(`implementation\\("io\\.github\\.hdcharts:bar:${snapshotArtifactVersion}"\\)`),
  );
  assert.doesNotMatch(dependencies, /\{\{artifactVersion\}\}/);
});

test('older release dependencies keep their Maven coordinates and use the selected version', () => {
  for (const version of ['2.0.0', '2.4.0']) {
    const source = fs.readFileSync(
      path.join(repositoryDirectory, 'content', version, 'wiki', 'getting-started.md'),
      'utf8',
    );
    const page = getPage(version, 'getting-started');

    assert.ok(page);
    assert.match(page.content, new RegExp(`io\\.github\\.dautovicharis:charts:${version}`));
    if (version === '2.0.0') {
      assert.match(page.content, /io\.github\.dautovicharis:charts-android:2\.0\.0/);
    }
    assert.equal(
      page.content,
      matter(source).content
        .replaceAll('{{version}}', version)
        .replaceAll('{{versionLabel}}', version)
        .replaceAll('{{artifactVersion}}', version),
    );
  }
});
