'use client';

import React, { useEffect, useMemo, useState, createContext, useContext, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createHighlighter, type Highlighter } from 'shiki';
import { slugifyHeading } from '@/lib/anchors';
import { remarkWikiExampleMarkers } from '@/lib/remark-wiki-example-markers.mjs';
import { buildWikiSourceUrl } from '@/lib/wiki-source-links.mjs';
import { cn } from '@/lib/utils';
import { parseChartDependency } from '@/lib/chart-installation.mjs';
import { MermaidDiagram } from './MermaidDiagram';
import { ChartDependencyInstaller } from './ChartDependencyInstaller';
import { CodeBlockContainer, createSharedMarkdownComponents } from './shared-markdown';

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light'],
      langs: ['kotlin', 'text'],
    });
  }
  return highlighterPromise;
}

void getHighlighter();

interface HighlighterContextValue {
  highlighter: Highlighter | null;
  ready: boolean;
}

const HighlighterContext = createContext<HighlighterContextValue>({ highlighter: null, ready: false });

function HighlighterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HighlighterContextValue>({ highlighter: null, ready: false });

  useEffect(() => {
    getHighlighter().then((highlighter) => {
      setState({ highlighter, ready: true });
    });
  }, []);

  return (
    <HighlighterContext.Provider value={state}>
      {children}
    </HighlighterContext.Provider>
  );
}

function useHighlighterContext() {
  return useContext(HighlighterContext);
}

interface MarkdownRendererProps {
  content: string;
  usesLargeGif?: boolean;
  sourceRevision?: string | null;
  versionId?: string;
  chartDependencies?: boolean;
  imageDimensions?: Record<string, { width: number; height: number }>;
}

export function MarkdownRenderer({ content, usesLargeGif = false, sourceRevision = null, imageDimensions, versionId = '', chartDependencies = false }: MarkdownRendererProps) {
  const components = useMemo(
    () => createMarkdownComponents(usesLargeGif, sourceRevision, imageDimensions, versionId, chartDependencies),
    [usesLargeGif, sourceRevision, imageDimensions, versionId, chartDependencies],
  );

  return (
    <HighlighterProvider>
      <div className="mx-auto min-w-0 max-w-[1120px]">
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkWikiExampleMarkers]} components={components}>
          {content}
        </ReactMarkdown>
      </div>
    </HighlighterProvider>
  );
}

interface CodeBlockProps {
  code: string;
  language: string;
  sourceUrl?: string | null;
}

function CodeBlock({ code, language, sourceUrl = null }: CodeBlockProps) {
  const { highlighter, ready } = useHighlighterContext();

  const highlightedHtml = useMemo(() => {
    if (!ready || !highlighter) return null;

    const resolvedLanguage = language === 'kotlin' || language === 'text' ? 'kotlin' : 'text';
    try {
      return highlighter.codeToHtml(code, {
        lang: resolvedLanguage,
        theme: 'github-light',
      });
    } catch {
      return `<pre><code>${escapeHtml(code)}</code></pre>`;
    }
  }, [highlighter, ready, code, language]);

  const codeBlock = (
    <CodeBlockContainer code={code} language={language} className={sourceUrl ? 'mb-0 pb-12' : undefined}>
      {highlightedHtml ? (
        <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      ) : (
        <pre className={cn(
          'm-0 whitespace-pre font-mono text-sm',
          'text-[var(--text-primary)]',
        )}>
          <code>{code}</code>
        </pre>
      )}
    </CodeBlockContainer>
  );

  if (!sourceUrl) return codeBlock;

  return (
    <div className="relative mb-4 min-w-0">
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="View canonical Kotlin source"
        aria-label="View canonical Kotlin source"
        className="group absolute bottom-1 right-1 z-10 inline-flex size-11 items-center justify-center rounded-full text-[color-mix(in_oklch,var(--color-success)_72%,var(--text-secondary))] transition-colors hover:text-[var(--color-success)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring-soft)]"
      >
        <span className="inline-flex size-6 -rotate-6 items-center justify-center rounded-full border border-[color-mix(in_oklch,var(--color-success)_55%,var(--border-color))] transition-colors group-hover:border-[var(--color-success)]">
          <SourceCodeIcon />
        </span>
      </a>
      {codeBlock}
    </div>
  );
}

function SourceCodeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
      <path d="m14 5-4 14" />
    </svg>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createMarkdownComponents(
  usesLargeGif: boolean,
  sourceRevision: string | null,
  imageDimensions?: Record<string, { width: number; height: number }>,
  versionId = '',
  chartDependencies = false,
) {
  return createSharedMarkdownComponents(
    slugifyHeading,
    ({ code, language, source }) => {
      const dependency = chartDependencies && language === 'kotlin' && !source
        ? parseChartDependency(code)
        : null;
      if (dependency) {
        return <ChartDependencyInstaller dependency={dependency} versionId={versionId} />;
      }

      const sourceUrl = source && sourceRevision
        ? buildWikiSourceUrl(source, sourceRevision)
        : null;
      return language === 'mermaid'
        ? <MermaidDiagram code={code} />
        : <CodeBlock code={code} language={language} sourceUrl={sourceUrl} />;
    },
    usesLargeGif ? 'sm:max-w-[640px]' : 'sm:max-w-[320px]',
    imageDimensions,
  );
}
