import { parseChartDependency } from './chart-installation.mjs';

export const PLATFORM_OPTIONS = [
  { value: 'auto', label: 'Auto-detect (recommended)' },
  { value: 'android', label: 'Android · Jetpack Compose' },
  { value: 'kmp-common', label: 'KMP · shared UI (commonMain)' },
  { value: 'kmp-android', label: 'KMP · Android target' },
  { value: 'kmp-ios', label: 'KMP · iOS target' },
  { value: 'kmp-wasm', label: 'KMP · Web/Wasm target' },
];

const CHARTS_REPO_URL = 'https://github.com/HDCharts/charts';
const SNAPSHOT_REPO_URL = 'https://central.sonatype.com/repository/maven-snapshots/';

/**
 * Read the same standalone Kotlin module coordinate that powers the wiki
 * installer. Never derive the artifact ID from the chart slug: gauge pages,
 * for example, both use the shared gauge module.
 * @param {string} markdown
 * @returns {import('./chart-installation.mjs').ChartDependency | null}
 */
export function extractChartDependency(markdown) {
  if (typeof markdown !== 'string') return null;
  const fence = String.fromCharCode(96).repeat(3);
  const pattern = new RegExp(fence + 'kotlin\\s*\\n(implementation\\("[^"\\r\\n]+"\\))\\s*\\n' + fence, 'g');
  for (const match of markdown.matchAll(pattern)) {
    const dependency = parseChartDependency(match[1]);
    if (dependency) return dependency;
  }
  return null;
}

/**
 * Allow links from chart pages to preselect only a chart that is actually
 * registered for the requested documentation version.
 * @param {string | null | undefined} requestedSlug
 * @param {{slug: string}[]} chartPages
 * @returns {string | null}
 */
export function resolveRequestedChartSlug(requestedSlug, chartPages) {
  return requestedSlug && chartPages.some((page) => page.slug === requestedSlug)
    ? requestedSlug
    : null;
}

/**
 * @typedef {{ slug: string, title: string, dependency?: import('./chart-installation.mjs').ChartDependency | null }} AgentChartPage
 * @typedef {{
 *   versionId: string,
 *   artifactVersion?: string | null,
 *   siteOrigin?: string,
 *   platform: string,
 *   selectedChartPages: AgentChartPage[],
 *   availableChartPages?: AgentChartPage[],
 *   extraRequirements?: string,
 * }} AgentPromptInputs
 */

/** @param {AgentPromptInputs} inputs */
export function buildAgentPrompt({
  versionId,
  artifactVersion,
  siteOrigin = '',
  platform,
  selectedChartPages,
  availableChartPages = [],
  extraRequirements = '',
}) {
  const origin = siteOrigin.replace(/\/+$/, '');
  const buildDocsUrl = (path) => origin ? origin + path : path;
  const platformName = PLATFORM_OPTIONS.find((option) => option.value === platform)?.label
    ?? PLATFORM_OPTIONS[0].label;
  const manualUrl = buildDocsUrl('/' + versionId + '/wiki/getting-started');
  const apiUrl = buildDocsUrl('/static/api/' + versionId + '/index.html');
  const chartUrls = selectedChartPages.map((page) =>
    '- ' + page.title + ': ' + buildDocsUrl('/' + versionId + '/wiki/' + page.slug),
  );
  const availableChartUrls = availableChartPages.map((page) =>
    '- ' + page.title + ': ' + buildDocsUrl('/' + versionId + '/wiki/' + page.slug),
  );
  const hasExplicitCharts = selectedChartPages.length > 0;

  const knownCoordinates = [...new Set(
    selectedChartPages
      .filter((page) => page.dependency)
      .map((page) => {
        const dependency = page.dependency;
        return dependency.groupId + ':' + dependency.artifactId + ':' + dependency.version;
      }),
  )];
  const missingPages = selectedChartPages.filter((page) => !page.dependency).map((page) => page.title);
  const isSnapshot = versionId === 'snapshot';

  return [
    'You are helping integrate HDCharts into an existing Compose project.',
    'Inspect the project and adapt to its conventions; do not scaffold a new app unless specifically requested.',
    '',
    'Requested integration:',
    '- Documentation version: ' + versionId,
    '- Published artifact version: ' + (artifactVersion || 'not resolved; verify in the selected documentation'),
    '- Charts to implement: ' + (hasExplicitCharts
      ? selectedChartPages.map((page) => page.title).join(', ') + ' (from the chart Setup page; user may change this)'
      : 'not specified yet; ask the user, do not assume a chart type'),
    '- Platform preference: ' + platformName + ' (a hint, not a substitute for inspecting the project)',
    '- Dependency policy: add only distinct required chart modules after confirming the requested charts; reuse the umbrella only if already used by the project or explicitly requested.',
    ...(extraRequirements.trim() ? ['- Additional requirements: ' + extraRequirements.trim()] : []),
    '',
    'Workflow:',
    '1. Inspect the repository before proposing changes. Read the project README, Gradle settings/build files, version catalogs, Compose/KMP plugins and source sets, current chart libraries/dependencies, existing navigation, and screens. Do not guess these from the website options.',
    '2. Identify whether this is Android-only Compose or Compose Multiplatform, which targets and source sets actually exist, and whether each desired chart dependency supports those targets. A KMP commonMain dependency must be valid for every consuming target; otherwise use an appropriate platform source set. Compose on iOS is not the same as SwiftUI.',
    '',
    'First-response discovery questionnaire (after inspection; before implementation):',
    'Ask only questions whose answers are genuinely missing. Group multiple unresolved choices in a concise conversational message, not a long form. Do not ask for information already supplied in the request, chart Setup link, or repository. If project files cannot be accessed, request the relevant Gradle/navigation files instead of guessing.',
    ...(hasExplicitCharts
      ? ['- Chart selection is already supplied: ' + selectedChartPages.map((page) => page.title).join(', ') + '. Do not ask which chart unless the user wants to change the choice.']
      : ['- Ask: Which chart(s) or visualization goal should be supported? If the user is unsure, suggest suitable types from the version-matched chart docs; do not pick one silently.']),
    '- Ask if unclear: Is this a new HDCharts integration, a trial/demo, or a migration from another charting library? If migrating, confirm which library, which charts/screens to replace, and whether visual/interaction parity matters. Detect existing chart libraries from the project but do not assume their presence means migration is intended.',
    '- Ask if unclear: Where should the chart UI go? Offer (a) an existing screen, with its name/route, or (b) a NEW SAMPLE/DEMO SCREEN registered in the app\'s EXISTING navigation for testing. If option (b) is chosen, create one small self-contained demo screen and add a discoverable route/menu entry using existing navigation conventions. Do not introduce a new navigation framework or replace app flows. If there is no navigation setup, ask where the demo should be reachable.',
    '- Ask if unclear: Should the chart use existing domain data or deterministic sample data? Sample data is appropriate for a test screen but must not be wired into production flows without permission.',
    'Once essential choices are answered, briefly state the proposed files/modules/screens and proceed with implementation. Do not modify Gradle or source files while required decisions remain unresolved; do not prolong discovery with nonessential questions.',
    '',
    'Implementation and verification:',
    '3. Follow the version-matched Getting Started and chart-specific Setup sections below. Reuse existing dependency repositories, versions and Gradle conventions. Avoid duplicate dependencies or unrelated build-file edits. For multiple charts, add each distinct module at most once.',
    '4. If migrating, review the existing chart data/state, styling, interactions and navigation; replace only agreed chart usages incrementally. Remove an old chart dependency only after verifying there are no remaining consumers. Preserve behavior where requested.',
    '5. Use public APIs documented for this exact version, not newer snapshot APIs when targeting a release. Reuse existing application models, theming, and Compose state management. Keep the initial chart implementation small and idiomatic. For an approved demo screen, keep it isolated and easy to remove.',
    '6. Run the appropriate existing Gradle compilation/test task for the affected module/target if tools and environment permit. Report changed files, chosen modules/source sets, verification commands, failures or unverified targets. Never claim a build passed without running it.',
    '',
    ...(hasExplicitCharts ? [
      'Known chart module coordinates (confirm the target/source set before using):',
      ...(knownCoordinates.length
        ? knownCoordinates.map((coordinate) => '- ' + coordinate)
        : ['- The selected documentation does not provide a published module coordinate. Verify published artifacts in Getting Started before editing Gradle.']),
      ...(missingPages.length ? ['- Verify the module and public API for: ' + missingPages.join(', ') + ' (no Setup coordinate in this documentation version).'] : []),
    ] : []),
    ...(isSnapshot
      ? ['- Snapshot builds require the repository ' + SNAPSHOT_REPO_URL + ' in the existing Gradle dependency repository configuration. Do not replace other repositories. If the snapshot version could not be resolved, verify it before adding any dependency.']
      : ['- Release artifacts use Maven Central unless the versioned setup guide specifies otherwise.']),
    '',
    'Documentation to consult (use this selected version, not the latest by default):',
    '- Getting Started: ' + manualUrl,
    ...(chartUrls.length ? ['Selected chart documentation:', ...chartUrls] : []),
    ...(availableChartUrls.length ? ['Available chart documentation for discovery (not an instruction to implement all of them):', ...availableChartUrls] : []),
    '- Generated API reference: ' + apiUrl,
    '- Source repository: ' + CHARTS_REPO_URL,
  ].join('\n');
}
