import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  buildChartInstallationSnippet,
  isSnapshotChartDependency,
  parseChartDependency,
  SNAPSHOT_REPOSITORY_SNIPPET,
} from './chart-installation.mjs';

const bar = parseChartDependency('implementation("io.github.hdcharts:bar:3.2.0-SNAPSHOT")');

test('recognizes only standalone published HDCharts dependency snippets', () => {
  assert.deepEqual(bar, {
    groupId: 'io.github.hdcharts',
    artifactId: 'bar',
    version: '3.2.0-SNAPSHOT',
  });
  assert.equal(parseChartDependency('implementation("io.github.dautovicharis:charts:2.4.0")')?.version, '2.4.0');
  assert.equal(parseChartDependency('implementation("org.example:bar:3.2.0")'), null);
  assert.equal(parseChartDependency('implementation("io.github.hdcharts:bar:{{artifactVersion}}")'), null);
  assert.equal(parseChartDependency('implementation("io.github.hdcharts:bar:3.2.0")\nprintln("hi")'), null);
  assert.equal(parseChartDependency('val data = listOf(1, 2, 3)'), null);
});

test('builds install snippets for Android-only and KMP target source sets', () => {
  assert.ok(bar);
  for (const target of ['commonMain', 'androidMain', 'iosMain', 'wasmJsMain']) {
    const snippet = buildChartInstallationSnippet(bar, { target });
    assert.ok(snippet.includes(target + '.dependencies {'));
    assert.match(snippet, /io\.github\.hdcharts:bar:3\.2\.0-SNAPSHOT/);
  }
  const android = buildChartInstallationSnippet(bar, { target: 'androidOnly' });
  assert.equal(android, 'dependencies {\n    implementation("io.github.hdcharts:bar:3.2.0-SNAPSHOT")\n}');
  assert.doesNotMatch(android, /commonMain|sourceSets/);
});

test('umbrella selection changes only the module coordinate', () => {
  assert.ok(bar);
  const snippet = buildChartInstallationSnippet(bar, { umbrella: true, target: 'iosMain' });
  assert.match(snippet, /io\.github\.hdcharts:charts:3\.2\.0-SNAPSHOT/);
  assert.doesNotMatch(snippet, /:bar:/);
});

test('snapshot repository is required for snapshot artifacts, not releases', () => {
  assert.ok(bar);
  assert.ok(isSnapshotChartDependency(bar));
  assert.match(SNAPSHOT_REPOSITORY_SNIPPET, /https:\/\/central\.sonatype\.com\/repository\/maven-snapshots\//);
  assert.equal(isSnapshotChartDependency({ ...bar, version: '3.1.0' }), false);
});

test('all versioned chart pages have a single installable dependency in Setup', () => {
  const contentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../content');
  const versions = fs.readdirSync(contentRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  const fence = String.fromCharCode(96).repeat(3);
  const snippetPattern = new RegExp(fence + 'kotlin\\s*\\n(implementation\\("[^"\\n]+"\\))\\s*\\n' + fence, 'g');
  let checked = 0;

  for (const version of versions) {
    const wikiDir = path.join(contentRoot, version.name, 'wiki');
    if (!fs.existsSync(wikiDir)) continue;
    const files = fs.readdirSync(wikiDir).filter((file) => file.endsWith('-chart.md'));

    for (const file of files) {
      const content = fs.readFileSync(path.join(wikiDir, file), 'utf8');
      const label = version.name + '/' + file;
      const setups = [...content.matchAll(/^## Setup$/gm)];
      assert.equal(setups.length, 1, label + ' must contain exactly one Setup section');

      const matches = [...content.matchAll(snippetPattern)];
      assert.equal(matches.length, 1, label + ' must contain exactly one standalone dependency');
      const setupStart = setups[0].index;
      const nextSection = content.indexOf('\n## ', setupStart + '## Setup'.length);
      const setupEnd = nextSection === -1 ? content.length : nextSection;
      assert.ok(matches[0].index > setupStart && matches[0].index < setupEnd,
        label + ' must place the dependency in Setup');

      // Wiki {{artifactVersion}} is resolved by getPage() at render time.
      const versionNumber = version.name === 'snapshot' ? '3.2.0-SNAPSHOT' : version.name;
      const dependency = parseChartDependency(matches[0][1].replace('{{artifactVersion}}', versionNumber));
      assert.ok(dependency, label + ' must use published HDCharts coordinates');

      const apiReference = content.indexOf('\n## API Reference');
      if (apiReference !== -1) {
        assert.ok(setupStart < apiReference, label + ' must place Setup before API Reference');
      }
      checked++;
    }
  }

  assert.ok(checked > 0, 'expected at least one versioned chart page');
});
