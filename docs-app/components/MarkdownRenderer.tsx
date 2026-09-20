'use client';

import React, { useEffect, useMemo, useState, createContext, useContext, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createHighlighter, type Highlighter } from 'shiki';
import { slugifyHeading } from '@/lib/anchors';
import { cn } from '@/lib/utils';
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
}

export function MarkdownRenderer({ content, usesLargeGif = false }: MarkdownRendererProps) {
  const components = useMemo(() => createMarkdownComponents(usesLargeGif), [usesLargeGif]);

  return (
    <HighlighterProvider>
      <div className="mx-auto min-w-0 max-w-[1120px]">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {content}
        </ReactMarkdown>
      </div>
    </HighlighterProvider>
  );
}

interface CodeBlockProps {
  code: string;
  language: string;
}

function CodeBlock({ code, language }: CodeBlockProps) {
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

  return (
    <CodeBlockContainer code={code} language={language}>
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
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createMarkdownComponents(usesLargeGif: boolean) {
  return createSharedMarkdownComponents(
    slugifyHeading,
    ({ code, language }) => <CodeBlock code={code} language={language} />,
    usesLargeGif ? 'sm:max-w-[640px]' : 'sm:max-w-[320px]',
  );
}
