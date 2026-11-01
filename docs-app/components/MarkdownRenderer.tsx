'use client';

import React, { useEffect, useMemo, useState, createContext, useContext, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createHighlighter, type Highlighter } from 'shiki';
import { slugifyHeading } from '@/lib/anchors';
import { remarkWikiExampleMarkers } from '@/lib/remark-wiki-example-markers.mjs';
import { buildWikiSourceUrl } from '@/lib/wiki-source-links.mjs';
import { cn } from '@/lib/utils';
import { MermaidDiagram } from './MermaidDiagram';
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
}

export function MarkdownRenderer({ content, usesLargeGif = false, sourceRevision = null }: MarkdownRendererProps) {
  const components = useMemo(() => createMarkdownComponents(usesLargeGif, sourceRevision), [usesLargeGif, sourceRevision]);

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
  hasSource?: boolean;
}

function CodeBlock({ code, language, sourceUrl = null, hasSource = false }: CodeBlockProps) {
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
    <CodeBlockContainer code={code} language={language} className={hasSource ? 'mb-0' : undefined}>
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

  if (!hasSource) return codeBlock;

  return (
    <div className="mb-4 min-w-0">
      <div className="mb-1 flex justify-end pr-3">
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="View canonical Kotlin source"
            aria-label="View canonical Kotlin source"
            className="inline-flex size-6 items-center justify-center rounded-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring-soft)]"
          >
            <SourceFileIcon />
          </a>
        ) : (
          <span role="img" title="View canonical Kotlin source" aria-label="View canonical Kotlin source" className="inline-flex size-6 items-center justify-center text-[var(--text-muted)]">
            <SourceFileIcon />
          </span>
        )}
      </div>
      {codeBlock}
    </div>
  );
}

function SourceFileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="var(--color-success)" strokeWidth="1.5" />
      <path d="m5 8 2 2 4-4" stroke="var(--color-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

function createMarkdownComponents(usesLargeGif: boolean, sourceRevision: string | null) {
  return createSharedMarkdownComponents(
    slugifyHeading,
    ({ code, language, source }) => {
      const sourceUrl = source && sourceRevision
        ? buildWikiSourceUrl(source, sourceRevision)
        : null;
      return language === 'mermaid'
        ? <MermaidDiagram code={code} />
        : <CodeBlock code={code} language={language} sourceUrl={sourceUrl} hasSource={source !== null} />;
    },
    usesLargeGif ? 'sm:max-w-[640px]' : 'sm:max-w-[320px]',
  );
}
