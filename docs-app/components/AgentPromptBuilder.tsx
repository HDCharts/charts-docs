'use client';

/* eslint-disable react-hooks/set-state-in-effect -- Intentional: controlled state sync patterns */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { copyToClipboard } from '@/lib/copy-to-clipboard';
import { cn } from '@/lib/utils';
import { buildAgentPrompt, PLATFORM_OPTIONS, resolveRequestedChartSlug } from '@/lib/agent-prompt.mjs';

interface ChartPage {
  slug: string;
  title: string;
  dependency?: { groupId: string; artifactId: string; version: string } | null;
}

interface AgentPromptBuilderProps {
  versionId: string;
  artifactVersion: string | null;
  chartPages: ChartPage[];
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

export function AgentPromptBuilder({ versionId, artifactVersion, chartPages }: AgentPromptBuilderProps) {
  const [platform, setPlatform] = useState('auto');
  const [requestedChartSlug, setRequestedChartSlug] = useState<string | null>(null);
  const [extraRequirements, setExtraRequirements] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [copyAnnouncement, setCopyAnnouncement] = useState('');
  const siteOrigin = useSiteOrigin();
  const promptPreRef = useRef<HTMLPreElement>(null);
  // Retain chart context from versioned Setup links, without requiring chart
  // selection on the website. Generic entry points let the agent ask the user.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('chart');
    setRequestedChartSlug(resolveRequestedChartSlug(requested, chartPages));
  }, [chartPages]);

  const selectedChartPages = useMemo(
    () => chartPages.filter((page) => page.slug === requestedChartSlug),
    [chartPages, requestedChartSlug],
  );

  const prompt = useMemo(
    () =>
      buildAgentPrompt({
        versionId,
        artifactVersion,
        siteOrigin,
        platform,
        selectedChartPages,
        availableChartPages: chartPages,
        extraRequirements,
      }),
    [
      selectedChartPages,
      chartPages,
      extraRequirements,
      platform,
      siteOrigin,
      versionId,
      artifactVersion,
    ],
  );

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
          Copy this prompt into your coding agent. It will inspect your project and ask about chart types,
          migration needs, and screen placement, including a separate demo screen for testing.
        </p>

        <div className="mb-4 flex flex-col gap-2 md:container-[52rem]:flex-row md:container-[52rem]:flex-wrap">
          <div className="flex flex-col gap-2">
            <label htmlFor="agent-platform" className="text-sm font-semibold text-[var(--text-secondary)]">
              Preferred platform
            </label>
            <select
              id="agent-platform"
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-soft)]"
            >
              {PLATFORM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mb-5 text-sm text-[var(--text-secondary)]">
          {selectedChartPages.length > 0 ? (
            <>Starting with <strong>{selectedChartPages[0].title}</strong> from its Setup page. Your agent can adapt if you request other charts.</>
          ) : (
            'No chart selection needed here. Your agent will ask which chart types or visualization goals you have.'
          )}
        </p>

        <div className="mb-4 flex flex-col gap-2">
          <label htmlFor="agent-extra" className="text-sm font-semibold text-[var(--text-secondary)]">
            Extra requirements <span className="font-normal text-[var(--text-muted)]">(optional)</span>
          </label>
          <textarea
            id="agent-extra"
            value={extraRequirements}
            onChange={(event) => setExtraRequirements(event.target.value)}
            placeholder="e.g. Match our app theme, preserve existing chart interactions, support dark mode, and avoid unrelated refactoring."
            rows={3}
            className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-soft)]"
          />
        </div>

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
