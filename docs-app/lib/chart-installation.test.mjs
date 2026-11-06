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

test('all snapshot chart pages provide their module without a maintained chart list', () => {
  const wikiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../content/snapshot/wiki');
  const files = fs.readdirSync(wikiDir).filter((file) => file.endsWith('-chart.md'));
  assert.ok(files.length > 0);

  const fence = String.fromCharCode(96).repeat(3);
  const snippetPattern = new RegExp(fence + 'kotlin\\s*\\n(implementation\\("[^"\\n]+"\\))\\s*\\n' + fence);
  for (const file of files) {
    const content = fs.readFileSync(path.join(wikiDir, file), 'utf8');
    const match = content.match(snippetPattern);
    assert.ok(match, file + ' is missing a standalone dependency snippet');

    // Wiki {{artifactVersion}} is resolved by getPage() at render time.
    const dependency = parseChartDependency(match[1].replace('{{artifactVersion}}', '3.2.0-SNAPSHOT'));
    assert.ok(dependency, file + ' must have published HDCharts coordinates');
  }
});
