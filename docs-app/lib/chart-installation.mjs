/**
 * A chart's standalone Gradle dependency line is the source of its published
 * module and version. Only transform that exact form; leave examples untouched.
 *
 * @typedef {{ groupId: string, artifactId: string, version: string }} ChartDependency
 * @typedef {'commonMain' | 'androidOnly' | 'androidMain' | 'iosMain' | 'wasmJsMain'} InstallationTarget
 */

const SUPPORTED_GROUPS = new Set(['io.github.hdcharts', 'io.github.dautovicharis']);

/** @param {string} code @returns {ChartDependency | null} */
export function parseChartDependency(code) {
  if (typeof code !== 'string') return null;
  const match = /^implementation\("([a-z][a-z0-9.]*):([a-z][a-z0-9-]*):(\d+\.\d+\.\d+(?:-SNAPSHOT)?)"\)$/.exec(code.trim());
  if (!match || !SUPPORTED_GROUPS.has(match[1])) return null;
  return { groupId: match[1], artifactId: match[2], version: match[3] };
}

/**
 * @param {ChartDependency} dependency
 * @param {{ target?: InstallationTarget, umbrella?: boolean }} [options]
 */
export function buildChartInstallationSnippet(dependency, { target = 'commonMain', umbrella = false } = {}) {
  const artifactId = umbrella ? 'charts' : dependency.artifactId;
  const line = 'implementation("' + dependency.groupId + ':' + artifactId + ':' + dependency.version + '")';
  if (target === 'androidOnly') {
    return ['dependencies {', '    ' + line, '}'].join('\n');
  }
  let sourceSet;
  switch (target) {
    case 'commonMain':
    case 'androidMain':
    case 'iosMain':
    case 'wasmJsMain':
      sourceSet = target;
      break;
    default:
      throw new Error('Unsupported HDCharts installation target: ' + target);
  }
  return [
    'kotlin {',
    '    sourceSets {',
    '        ' + sourceSet + '.dependencies {',
    '            ' + line,
    '        }',
    '    }',
    '}',
  ].join('\n');
}

/** @param {ChartDependency} dependency */
export function isSnapshotChartDependency(dependency) {
  return dependency.version.endsWith('-SNAPSHOT');
}

export const SNAPSHOT_REPOSITORY_SNIPPET = [
  'dependencyResolutionManagement {',
  '    repositories {',
  '        mavenCentral()',
  '        maven("https://central.sonatype.com/repository/maven-snapshots/")',
  '    }',
  '}',
].join('\n');
