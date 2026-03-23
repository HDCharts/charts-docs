'use client';

import { useEffect, useMemo, useState } from 'react';

type PlatformOption = 'KMP + Compose' | 'Android Compose' | 'Compose Multiplatform';
type ScopeOption = 'Selected chart module' | 'Charts umbrella (all modules)';

const CHART_OPTIONS = [
  'Line Chart',
  'Bar Chart',
  'Pie Chart',
  'Histogram Chart',
  'Multi Line Chart',
  'Stacked Bar Chart',
  'Stacked Area Chart',
  'Radar Chart',
] as const;

const PLATFORM_OPTIONS: PlatformOption[] = [
  'KMP + Compose',
  'Android Compose',
  'Compose Multiplatform',
];
const SCOPE_OPTIONS: ScopeOption[] = [
  'Selected chart module',
  'Charts umbrella (all modules)',
];
const CHARTS_REPO_URL = 'https://github.com/HDCharts/charts';

interface AgentPromptBuilderProps {
  versionId: string;
}

export function AgentPromptBuilder({ versionId }: AgentPromptBuilderProps) {
  const [platform, setPlatform] = useState<PlatformOption>('KMP + Compose');
  const [scope, setScope] = useState<ScopeOption>('Selected chart module');
  const [chartTypes, setChartTypes] = useState<string[]>(['Line Chart']);
  const [includeSampleData, setIncludeSampleData] = useState(true);
  const [includeNavigation, setIncludeNavigation] = useState(false);
  const [extraRequirements, setExtraRequirements] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [siteOrigin, setSiteOrigin] = useState('');
  const isUmbrellaScope = scope === 'Charts umbrella (all modules)';

  useEffect(() => {
    if (!isUmbrellaScope) {
      return;
    }
    setChartTypes([...CHART_OPTIONS]);
  }, [isUmbrellaScope]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    setSiteOrigin(window.location.origin);
  }, []);

  const prompt = useMemo(
    () =>
      buildAgentPrompt({
        versionId,
        siteOrigin,
        platform,
        scope,
        chartTypes,
        includeSampleData,
        includeNavigation,
        extraRequirements,
      }),
    [
      chartTypes,
      extraRequirements,
      includeNavigation,
      includeSampleData,
      platform,
      scope,
      siteOrigin,
      versionId,
    ],
  );

  const onChartToggle = (chart: string) => {
    if (isUmbrellaScope) {
      return;
    }
    setChartTypes((current) => {
      const next = current.includes(chart)
        ? current.filter((item) => item !== chart)
        : [...current, chart];
      return next.length > 0 ? next : [chart];
    });
  };

  const onCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(prompt);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = prompt;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }

    window.setTimeout(() => setCopyState('idle'), 1400);
  };

  return (
    <section className="agent-builder animate-fadeIn">
      <h1>Agent Prompt Builder</h1>
      <p>
        Configure what your integration agent should do, then copy the generated prompt and paste
        it into your preferred AI assistant.
      </p>

      <div className="agent-builder__grid">
        <div className="agent-builder__field">
          <label htmlFor="agent-platform">Platform</label>
          <select
            id="agent-platform"
            value={platform}
            onChange={(event) => setPlatform(event.target.value as PlatformOption)}
          >
            {PLATFORM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="agent-builder__field">
          <label htmlFor="agent-scope">Scope</label>
          <select
            id="agent-scope"
            value={scope}
            onChange={(event) => setScope(event.target.value as ScopeOption)}
          >
            {SCOPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

      </div>

      <div className="agent-builder__field">
        <label>Charts to include</label>
        <div className="agent-builder__chips">
          {CHART_OPTIONS.map((chart) => {
            const selected = chartTypes.includes(chart);
            return (
              <button
                key={chart}
                type="button"
                className={`agent-builder__chip ${selected ? 'agent-builder__chip--active' : ''} ${isUmbrellaScope ? 'agent-builder__chip--disabled' : ''}`}
                onClick={() => onChartToggle(chart)}
                aria-pressed={selected}
                disabled={isUmbrellaScope}
              >
                {chart}
              </button>
            );
          })}
        </div>
        {isUmbrellaScope ? (
          <p className="agent-builder__hint">Umbrella includes all chart modules, so chart selection is locked.</p>
        ) : null}
      </div>

      <div className="agent-builder__toggles">
        <label>
          <input
            type="checkbox"
            checked={includeSampleData}
            onChange={(event) => setIncludeSampleData(event.target.checked)}
          />
          Include sample data
        </label>
        <label>
          <input
            type="checkbox"
            checked={includeNavigation}
            onChange={(event) => setIncludeNavigation(event.target.checked)}
          />
          Include navigation/screen wiring
        </label>
      </div>

      <div className="agent-builder__field">
        <label htmlFor="agent-extra">Extra requirements</label>
        <textarea
          id="agent-extra"
          value={extraRequirements}
          onChange={(event) => setExtraRequirements(event.target.value)}
          placeholder="Example: optimize for small APK size and avoid unnecessary modules."
          rows={3}
        />
      </div>

      <div className="agent-builder__prompt">
        <div className="agent-builder__prompt-header">
          <h2>Generated Prompt</h2>
          <button type="button" onClick={onCopy} className="btn btn--secondary">
            {copyState === 'copied'
              ? 'Copied'
              : copyState === 'failed'
                ? 'Copy failed'
                : 'Copy prompt'}
          </button>
        </div>
        <pre>{prompt}</pre>
      </div>
    </section>
  );
}

interface PromptInputs {
  versionId: string;
  siteOrigin: string;
  platform: PlatformOption;
  scope: ScopeOption;
  chartTypes: string[];
  includeSampleData: boolean;
  includeNavigation: boolean;
  extraRequirements: string;
}

function buildAgentPrompt(inputs: PromptInputs): string {
  const {
    versionId,
    siteOrigin,
    platform,
    scope,
    chartTypes,
    includeSampleData,
    includeNavigation,
    extraRequirements,
  } = inputs;

  const scopeLine =
    scope === 'Selected chart module'
      ? 'Prefer scoped chart modules over umbrella dependency.'
      : 'Use umbrella dependency and include all required modules.';

  const sampleDataLine = includeSampleData
    ? 'Include minimal sample data for first render.'
    : 'Do not include sample data.';

  const navigationLine = includeNavigation
    ? 'Include navigation and screen wiring guidance.'
    : 'Do not include app navigation setup.';

  const extraLine = extraRequirements.trim()
    ? `Extra requirements: ${extraRequirements.trim()}`
    : 'Extra requirements: none';
  const buildDocsUrl = (path: string) => (siteOrigin ? `${siteOrigin}${path}` : path);
  const manualPath = buildDocsUrl(`/${versionId}/wiki/getting-started`);
  const examplesPath = buildDocsUrl(`/${versionId}/wiki/examples`);
  const apiPath = buildDocsUrl(`/${versionId}/api`);

  return [
    'You are a Charts integration agent.',
    '',
    'Goal:',
    '- Help integrate Charts into an app based on the constraints below.',
    '',
    'Context:',
    `- Platform: ${platform}`,
    `- Chart types: ${chartTypes.join(', ')}`,
    `- Scope policy: ${scopeLine}`,
    `- Data policy: ${sampleDataLine}`,
    `- Navigation policy: ${navigationLine}`,
    `- ${extraLine}`,
    '',
    'Primary sources:',
    `- Manual setup guide: ${manualPath}`,
    `- Examples: ${examplesPath}`,
    `- API reference: ${apiPath}`,
    `- Repository: ${CHARTS_REPO_URL}`,
  ].join('\n');
}
