'use client';

/* eslint-disable react-hooks/set-state-in-effect -- Intentional: controlled state sync patterns */
import { useCallback, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { copyToClipboard } from '@/lib/copy-to-clipboard';
import { cn } from '@/lib/utils';

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

function useSiteOrigin() {
  const subscribe = useCallback((callback: () => void) => {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
  }, []);

  const getSnapshot = () => {
    if (typeof window === 'undefined') return '';
    return window.location.origin;
  };

  return useSyncExternalStore(subscribe, getSnapshot, () => '');
}

export function AgentPromptBuilder({ versionId }: AgentPromptBuilderProps) {
  const [platform, setPlatform] = useState<PlatformOption>('KMP + Compose');
  const [scope, setScope] = useState<ScopeOption>('Selected chart module');
  const [chartTypes, setChartTypes] = useState<string[]>(['Line Chart']);
  const [includeSampleData, setIncludeSampleData] = useState(true);
  const [includeNavigation, setIncludeNavigation] = useState(false);
  const [extraRequirements, setExtraRequirements] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [copyAnnouncement, setCopyAnnouncement] = useState('');
  const siteOrigin = useSiteOrigin();
  const promptPreRef = useRef<HTMLPreElement>(null);
  const isUmbrellaScope = scope === 'Charts umbrella (all modules)';
  const prevIsUmbrellaScope = useRef(isUmbrellaScope);

  useLayoutEffect(() => {
    if (isUmbrellaScope && !prevIsUmbrellaScope.current) {
      setChartTypes([...CHART_OPTIONS]);
    }
    prevIsUmbrellaScope.current = isUmbrellaScope;
  }, [isUmbrellaScope]);

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

  const onChartToggle = useCallback((chart: string) => {
    if (isUmbrellaScope) {
      return;
    }
    setChartTypes((current) => {
      const next = current.includes(chart)
        ? current.filter((item) => item !== chart)
        : [...current, chart];
      return next.length > 0 ? next : [chart];
    });
  }, [isUmbrellaScope]);

  const onCopy = useCallback(async () => {
    const success = await copyToClipboard(prompt);
    if (success) {
      setCopyState('copied');
      setCopyAnnouncement('Prompt copied to clipboard');
    } else {
      setCopyState('failed');
      setCopyAnnouncement('Failed to copy prompt');
    }
    window.setTimeout(() => {
      setCopyState('idle');
      setCopyAnnouncement('');
    }, 1500);
  }, [prompt]);

  const onSelectAllPrompt = () => {
    const target = promptPreRef.current;
    if (!target) {
      return;
    }

    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    const range = document.createRange();
    range.selectNodeContents(target);
    selection.removeAllRanges();
    selection.addRange(range);
    setCopyState('idle');
  };

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {copyAnnouncement}
      </div>
      <section className="container-type-inline-size" aria-label="Agent prompt builder">
        <h1 className="mb-6 [font-family:var(--font-display)] text-4xl font-extrabold tracking-tight text-[var(--text-primary)] lg:text-3xl">
          Agent Prompt Builder
        </h1>
        <p className="mb-6 text-base text-[var(--text-secondary)]">
          Configure what your integration agent should do, then copy the generated prompt and paste
          it into your preferred AI assistant.
        </p>

        <div className="mb-4 flex flex-col gap-2 md:container-[52rem]:flex-row md:container-[52rem]:flex-wrap">
          <div className="flex flex-col gap-2">
            <label htmlFor="agent-platform" className="text-sm font-semibold text-[var(--text-secondary)]">
              Platform
            </label>
            <select
              id="agent-platform"
              value={platform}
              onChange={(event) => setPlatform(event.target.value as PlatformOption)}
              className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-soft)]"
            >
              {PLATFORM_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <details className="mb-4 mt-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)] [&::-webkit-details-marker]:hidden">
            Advanced options
            <svg
              className="h-3 w-3 shrink-0 transition-transform [[open]_&]:rotate-180"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 4L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </summary>
          <div className="border-t border-[var(--border-color)] p-4">
            <div className="mb-4 flex flex-col gap-2">
              <label htmlFor="agent-scope" className="text-sm font-semibold text-[var(--text-secondary)]">
                Scope
              </label>
              <select
                id="agent-scope"
                value={scope}
                onChange={(event) => setScope(event.target.value as ScopeOption)}
                className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-soft)]"
              >
                {SCOPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4 flex flex-col gap-2">
              <span id="chart-chips-label" className="text-sm font-semibold text-[var(--text-secondary)]">
                Charts to include
              </span>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby="chart-chips-label">
                {CHART_OPTIONS.map((chart) => {
                  const selected = chartTypes.includes(chart);
                  return (
                    <button
                      key={chart}
                      type="button"
                      className={cn(
                        "rounded-full border border-[var(--border-subtle)] bg-[var(--surface-overlay)] px-3 py-2 text-sm transition-colors",
                        "hover:bg-[var(--surface-overlay-hover)] hover:text-[var(--text-primary)]",
                        selected && "border-[var(--color-primary)] bg-[var(--surface-tint)] text-[var(--text-primary)] font-semibold",
                        (isUmbrellaScope || selected) && "[disabled]:opacity-50 [disabled]:cursor-not-allowed",
                        isUmbrellaScope && "cursor-not-allowed"
                      )}
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
                <p className="mt-2 text-xs text-[var(--text-muted)]">Umbrella includes all chart modules, so chart selection is locked.</p>
              ) : null}
            </div>

            <div className="mb-4 flex flex-wrap gap-4 md:container-[52rem]:flex-col md:container-[52rem]:items-start">
              <label htmlFor="agent-sample-data" className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  id="agent-sample-data"
                  type="checkbox"
                  checked={includeSampleData}
                  onChange={(event) => setIncludeSampleData(event.target.checked)}
                  className="h-4 w-4 shrink-0 rounded border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-[var(--color-primary)] accent-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-soft)]"
                />
                Include sample data
              </label>
              <label htmlFor="agent-include-nav" className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  id="agent-include-nav"
                  type="checkbox"
                  checked={includeNavigation}
                  onChange={(event) => setIncludeNavigation(event.target.checked)}
                  className="h-4 w-4 shrink-0 rounded border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-[var(--color-primary)] accent-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-soft)]"
                />
                Include navigation/screen wiring
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="agent-extra" className="text-sm font-semibold text-[var(--text-secondary)]">
                Extra requirements
              </label>
              <textarea
                id="agent-extra"
                value={extraRequirements}
                onChange={(event) => setExtraRequirements(event.target.value)}
                placeholder="Example: optimize for small APK size and avoid unnecessary modules."
                rows={3}
                className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-soft)]"
              />
            </div>
          </div>
        </details>

        <div className="rounded-lg border border-[var(--border-color)] bg-[var(--code-bg)] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="m-0 text-base font-semibold text-[var(--text-primary)]">Generated Prompt</h2>
            <button
              type="button"
              onClick={onCopy}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border border-[var(--border-color)] bg-[var(--surface-overlay)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)] transition-colors",
                "hover:bg-[var(--surface-overlay-hover)] hover:text-[var(--text-primary)] hover:border-[var(--color-secondary)]",
                "active:translate-y-px min-h-11 min-w-11",
                copyState === 'copied' && "border-[var(--color-success)] text-[var(--color-success)]"
              )}
            >
              {copyState === 'copied' ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : copyState === 'failed' ? null : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
              {copyState === 'copied'
                ? 'Copied'
                : copyState === 'failed'
                  ? 'Copy failed'
                  : 'Copy prompt'}
            </button>
          </div>
          {copyState === 'failed' ? (
            <div className="mb-3 flex items-center justify-between gap-3 text-sm text-[var(--text-secondary)]" role="alert">
              <span>Clipboard access failed. Select all text, then copy manually.</span>
              <button 
                type="button" 
                className="inline-flex items-center gap-1 rounded-md border border-[var(--border-color)] bg-[var(--surface-overlay)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-overlay-hover)] hover:text-[var(--text-primary)] min-h-11"
                onClick={onSelectAllPrompt}
              >
                Select all
              </button>
            </div>
          ) : null}
          <pre 
            ref={promptPreRef}
            className="m-0 max-h-[480px] overflow-auto whitespace-pre-wrap break-words rounded-none border-0 bg-transparent p-0 font-mono text-sm leading-relaxed text-[var(--text-primary)]"
          >
            {prompt}
          </pre>
        </div>
      </section>
    </>
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
