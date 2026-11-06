import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  buildAgentPrompt,
  extractChartDependency,
  resolveRequestedChartSlug,
  PLATFORM_OPTIONS,
} from './agent-prompt.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const snapshotVersion = JSON.parse(
  readFileSync(path.join(root, 'docs-app/public/snapshot-manifest.json'), 'utf8'),
).charts_version;

const page = (slug, version = 'snapshot') =>
  readFileSync(path.join(root, 'content', version, 'wiki', slug + '.md'), 'utf8')
    .replaceAll('{{artifactVersion}}', version === 'snapshot' ? snapshotVersion : version);

const gauge = {
  slug: 'ring-gauge-chart',
  title: 'Ring Gauge',
  dependency: extractChartDependency(page('ring-gauge-chart')),
};
const segmented = {
  slug: 'segmented-ring-gauge-chart',
  title: 'Segmented Ring Gauge',
  dependency: extractChartDependency(page('segmented-ring-gauge-chart')),
};

const inputs = {
  versionId: 'snapshot',
  artifactVersion: snapshotVersion,
  siteOrigin: 'https://charts.hdcode.dev',
  platform: 'auto',
  selectedChartPages: [gauge, segmented],
  availableChartPages: [gauge, segmented],
  extraRequirements: '',
};

test('extracts chart modules from existing Setup code without a chart mapping', () => {
  assert.equal(gauge.dependency?.artifactId, 'gauge');
  assert.equal(segmented.dependency?.artifactId, 'gauge');
  assert.equal(extractChartDependency('a different Kotlin example'), null);
  assert.equal(extractChartDependency('implementation("io.github.hdcharts:bar:3.0.0")'), null);
});

test('all snapshot and supported 3.x chart pages provide a usable dependency', () => {
  for (const version of ['snapshot', '3.0.0', '3.1.0']) {
    const directory = path.join(root, 'content', version, 'wiki');
    const chartFiles = readdirSync(directory).filter((file) => file.endsWith('-chart.md'));
    assert.ok(chartFiles.length > 0, version);
    for (const file of chartFiles) {
      const slug = file.slice(0, -3);
      const dependency = extractChartDependency(page(slug, version));
      assert.ok(dependency, version + '/' + file + ' has no resolved Setup coordinate');
      assert.ok(dependency.version === (version === 'snapshot' ? snapshotVersion : version));
    }
  }
});

test('only chart slugs known for the selected version may be preselected', () => {
  const pages = [gauge, segmented];
  assert.equal(resolveRequestedChartSlug(segmented.slug, pages), segmented.slug);
  assert.equal(resolveRequestedChartSlug('not-in-this-version', pages), null);
  assert.equal(resolveRequestedChartSlug('../other', pages), null);
  assert.equal(resolveRequestedChartSlug(null, pages), null);
});

test('prompt inspects project first and uses one deduplicated gauge module', () => {
  const prompt = buildAgentPrompt(inputs);
  assert.equal(prompt.split('io.github.hdcharts:gauge:' + snapshotVersion).length - 1, 1);
  assert.match(prompt, /Inspect the repository before proposing changes/);
  assert.match(prompt, /commonMain dependency must be valid for every consuming target/);
  assert.match(prompt, /Group multiple unresolved choices in a concise conversational message/);
  assert.match(prompt, /Chart selection is already supplied/);
  assert.doesNotMatch(prompt, /Which chart\(s\) or visualization goal should be supported/);
  assert.match(prompt, /Never claim a build passed without running it/);
  assert.match(prompt, /Ring Gauge/);
  assert.match(prompt, /Segmented Ring Gauge/);
  assert.match(prompt, /https:\/\/charts\.hdcode\.dev\/snapshot\/wiki\/ring-gauge-chart/);
  assert.match(prompt, /https:\/\/central\.sonatype\.com\/repository\/maven-snapshots\//);
});

test('release prompt keeps its version and avoids snapshot-only setup', () => {
  const release = {
    slug: 'bar-chart',
    title: 'Bar',
    dependency: extractChartDependency(page('bar-chart', '3.0.0')),
  };
  const prompt = buildAgentPrompt({
    ...inputs,
    versionId: '3.0.0',
    artifactVersion: '3.0.0',
    platform: 'android',
    selectedChartPages: [release],
    extraRequirements: 'Match the existing theme.',
  });
  assert.match(prompt, /io\.github\.hdcharts:bar:3\.0\.0/);
  assert.match(prompt, /https:\/\/charts\.hdcode\.dev\/3\.0\.0\/wiki\/bar-chart/);
  assert.match(prompt, /existing domain data or deterministic sample data/);
  assert.match(prompt, /NEW SAMPLE\/DEMO SCREEN/);
  assert.match(prompt, /Match the existing theme/);
  assert.doesNotMatch(prompt, /central\.sonatype\.com/);
});

test('generic agent setup delegates chart choice to the user and offers migration or demo placement', () => {
  const prompt = buildAgentPrompt({ ...inputs, selectedChartPages: [] });
  assert.match(prompt, /not specified yet; ask the user, do not assume a chart type/);
  assert.match(prompt, /Which chart\(s\) or visualization goal should be supported/);
  assert.match(prompt, /new HDCharts integration, a trial\/demo, or a migration from another charting library/);
  assert.match(prompt, /which library, which charts\/screens to replace/);
  assert.match(prompt, /NEW SAMPLE\/DEMO SCREEN registered in the app's EXISTING navigation/);
  assert.match(prompt, /If option \(b\) is chosen, create one small self-contained demo screen/);
  assert.match(prompt, /Do not introduce a new navigation framework/);
  assert.match(prompt, /existing domain data or deterministic sample data/);
  assert.doesNotMatch(prompt, /Known chart module coordinates/);
  assert.doesNotMatch(prompt, /No chart type has been selected yet; resolve the chart choice before choosing module coordinates/);
  assert.match(prompt, /add only distinct required chart modules after confirming the requested charts/);
  assert.match(prompt, /Available chart documentation for discovery/);
  assert.match(prompt, /\/snapshot\/wiki\/segmented-ring-gauge-chart/);
  assert.doesNotMatch(prompt, /No standalone module coordinates found for these docs/);
  assert.doesNotMatch(prompt, /io\.github\.hdcharts:gauge:/);
});

test('a chart deep link provides chart context without disabling the intake questionnaire', () => {
  const prompt = buildAgentPrompt({
    ...inputs,
    selectedChartPages: [gauge],
  });
  assert.match(prompt, /Charts to implement: Ring Gauge \(from the chart Setup page/);
  assert.match(prompt, /Chart selection is already supplied: Ring Gauge/);
  assert.doesNotMatch(prompt, /Which chart\(s\) or visualization goal should be supported/);
  assert.match(prompt, /Is this a new HDCharts integration, a trial\/demo, or a migration/);
  assert.match(prompt, /Where should the chart UI go/);
  assert.match(prompt, /Known chart module coordinates/);
  assert.match(prompt, /gauge:/);
  assert.doesNotMatch(prompt, /:pie:/);
});

test('migration instructions preserve existing chart behavior and remove libraries only when unused', () => {
  const prompt = buildAgentPrompt({ ...inputs, selectedChartPages: [] });
  assert.match(prompt, /visual\/interaction parity matters/);
  assert.match(prompt, /review the existing chart data\/state, styling, interactions and navigation/);
  assert.match(prompt, /Remove an old chart dependency only after verifying there are no remaining consumers/);
});

test('older docs without chart modules degrade gracefully without inventing them', () => {
  const prompt = buildAgentPrompt({
    ...inputs,
    versionId: '2.4.0',
    artifactVersion: '2.4.0',
    selectedChartPages: [{ slug: 'examples', title: 'Examples', dependency: null }],
  });
  assert.match(prompt, /selected documentation does not provide a published module coordinate/);
  assert.match(prompt, /verify published artifacts/i);
  assert.match(prompt, /\/2\.4\.0\/wiki\/examples/);
});

test('platform options include auto-detection and distinct targets', () => {
  const values = PLATFORM_OPTIONS.map((option) => option.value);
  assert.ok(values.includes('auto'));
  assert.ok(values.includes('android'));
  assert.ok(values.includes('kmp-common'));
  assert.equal(new Set(values).size, values.length);
});
