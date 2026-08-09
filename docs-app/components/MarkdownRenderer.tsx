'use client';

import React, { useCallback, useEffect, useMemo, useState, createContext, useContext, type ReactNode } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createHighlighter, type Highlighter } from 'shiki';
import { slugifyHeading } from '@/lib/anchors';
import { copyToClipboard } from '@/lib/copy-to-clipboard';
import { cn } from '@/lib/utils';
import { StickySectionNav, type StickySectionNavItem } from './StickySectionNav';

// Markdown may contain arbitrary local or remote image URLs, so next/image cannot validate them.
/* eslint-disable @next/next/no-img-element */

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
  layoutVariant?: 'default' | 'snapshotExamples' | 'migration';
}

export function MarkdownRenderer({
  content,
  layoutVariant = 'default',
}: MarkdownRendererProps) {
  return (
    <HighlighterProvider>
      <MarkdownContent content={content} layoutVariant={layoutVariant} />
    </HighlighterProvider>
  );
}

function MarkdownContent({
  content,
  layoutVariant,
}: MarkdownRendererProps) {
  const components = useMemo(
    () => createMarkdownComponents({ wrapCodeLines: layoutVariant === 'snapshotExamples' || layoutVariant === 'migration' }),
    [layoutVariant],
  );

  return (
    <div className="mx-auto min-w-0 max-w-[1120px]">
      {layoutVariant === 'snapshotExamples'
        ? <SnapshotExamplesLayout content={content} components={components} />
        : layoutVariant === 'migration'
          ? <MigrationLayout content={content} components={components} />
        : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={components}
          >
            {content}
          </ReactMarkdown>
        )}
    </div>
  );
}

function MigrationLayout({
  content,
  components,
}: {
  content: string;
  components: Components;
}): React.ReactNode {
  const navigationItems = useMemo(() => parseHeadingNavigationItems(content, 2), [content]);

  return (
    <div className="grid min-w-0 gap-8 lg:grid-cols-[9rem_minmax(0,1fr)] lg:items-start">
      <StickySectionNav items={navigationItems} label="Migration" ariaLabel="Migration navigation" />
      <div>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

interface CodeBlockProps {
  code: string;
  language: string;
  wrapLines?: boolean;
  className?: string;
}

function CodeBlock({ code, language, wrapLines = false, className }: CodeBlockProps) {
  const { highlighter, ready } = useHighlighterContext();
  const [copied, setCopied] = useState(false);

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

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  }, [code]);

  return (
    <div className={cn(
      'relative mb-4 overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--code-bg)] pt-12',
      className,
    )}>
      <button
        className={cn(
          'absolute right-3 top-3 z-10 inline-flex min-h-11 min-w-11 items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold transition-colors',
          'border-[var(--border-color)] bg-[var(--surface-overlay)] text-[var(--text-secondary)] hover:border-[var(--color-secondary)] hover:bg-[var(--surface-overlay-hover)] hover:text-[var(--text-primary)]',
          "active:translate-y-px",
          copied && 'border-[var(--color-success)] text-[var(--color-success)]',
        )}
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Copied to clipboard' : 'Copy code'}
      >
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>
      <div
        className={cn(
          'p-4 [&_pre]:!m-0 [&_pre]:!rounded-none [&_pre]:!border-0 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:!bg-transparent [&_code]:!p-0',
          wrapLines
            ? 'overflow-x-hidden [&_pre]:!overflow-visible [&_pre]:!whitespace-pre-wrap [&_code]:!whitespace-pre-wrap [&_code]:break-words'
            : 'overflow-x-auto',
        )}
        tabIndex={0}
        role="region"
        aria-label={`Code snippet${language !== 'text' ? ` in ${language}` : ''}`}
      >
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
      </div>
    </div>
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

interface SnapshotMarkdownBlock {
  type: 'markdown';
  content: string;
}

interface SnapshotExampleBlock {
  type: 'example';
  title: string;
  imageSrc: string;
  imageAlt: string;
  code: string;
  language: string;
}

type SnapshotBlock = SnapshotMarkdownBlock | SnapshotExampleBlock;

interface MarkdownImageParseResult {
  src: string;
  alt: string;
  nextIndex: number;
}

interface CodeBlockParseResult {
  code: string;
  language: string;
  nextIndex: number;
}

function skipBlankLines(lines: string[], startIndex: number): number {
  let index = startIndex;
  while (index < lines.length && lines[index].trim() === '') {
    index += 1;
  }
  return index;
}

function parseMarkdownImageAt(lines: string[], startIndex: number): MarkdownImageParseResult | null {
  if (startIndex >= lines.length) {
    return null;
  }

  const imageMatch = lines[startIndex].trim().match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/);
  if (!imageMatch) {
    return null;
  }

  return {
    alt: imageMatch[1],
    src: imageMatch[2],
    nextIndex: startIndex + 1,
  };
}

function parseCodeBlockAt(lines: string[], startIndex: number): CodeBlockParseResult | null {
  if (startIndex >= lines.length || !lines[startIndex].startsWith('```')) {
    return null;
  }

  const language = lines[startIndex].slice(3).trim() || 'text';
  const codeLines: string[] = [];
  let index = startIndex + 1;

  while (index < lines.length && !lines[index].startsWith('```')) {
    codeLines.push(lines[index]);
    index += 1;
  }

  if (index < lines.length && lines[index].startsWith('```')) {
    index += 1;
  }

  return {
    code: codeLines.join('\n'),
    language,
    nextIndex: index,
  };
}

function SnapshotExamplesLayout({
  content,
  components,
}: {
  content: string;
  components: Components;
}): React.ReactNode {
  const blocks = useMemo(() => splitSnapshotBlocks(content), [content]);
  const examples = useMemo(
    () => blocks.filter((block): block is SnapshotExampleBlock => block.type === 'example'),
    [blocks],
  );
  const navigationItems = useMemo(
    () => [
      ...examples.map((example) => ({
        id: slugifyHeading(example.title) || 'section',
        title: example.title,
      })),
      { id: 'style-customization', title: 'Style Customization' },
    ],
    [examples],
  );
  return (
    <div className="grid gap-8 lg:grid-cols-[9rem_minmax(0,1fr)] lg:items-start">
      <StickySectionNav items={navigationItems} label="Examples" ariaLabel="Examples navigation" />

      <div>
        {blocks.map((block, index) => {
          if (block.type === 'markdown') {
            return (
              <ReactMarkdown
                key={`snapshot-markdown-${index}`}
                remarkPlugins={[remarkGfm]}
                components={components}
              >
                {block.content}
              </ReactMarkdown>
            );
          }

          const id = slugifyHeading(block.title) || 'section';
          return (
            <React.Fragment key={`snapshot-example-${index}`}>
              <h3 id={id} className="mt-6 mb-4 scroll-mt-24 text-2xl font-semibold text-[var(--text-primary)] lg:text-xl">
                {block.title}
              </h3>
              <div className="mb-14">
                <div className="mb-8 flex justify-center">
                  <SafeImage
                    src={block.imageSrc}
                    alt={block.imageAlt}
                    className="h-auto w-[320px] max-w-full rounded-xl object-contain shadow-[0_20px_45px_-30px_rgb(31_41_51_/_0.7)]"
                  />
                </div>
                <div className="mx-auto min-w-0 max-w-[1000px]">
                  <CodeBlock code={block.code} language={block.language} wrapLines className="mb-0" />
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function parseHeadingNavigationItems(content: string, level: number): StickySectionNavItem[] {
  const headingPattern = new RegExp(`^${'#'.repeat(level)}\\s+(.+?)\\s*#*\\s*$`);

  return content
    .split('\n')
    .map((line) => line.match(headingPattern)?.[1]?.trim())
    .filter((title): title is string => Boolean(title))
    .map((title) => ({
      id: slugifyHeading(title) || 'section',
      title,
    }));
}

function splitSnapshotBlocks(content: string): SnapshotBlock[] {
  const lines = content.split('\n');
  const blocks: SnapshotBlock[] = [];
  const markdownBuffer: string[] = [];
  let index = 0;

  const flushMarkdownBuffer = () => {
    if (markdownBuffer.length === 0) {
      return;
    }

    const markdownContent = markdownBuffer.join('\n');
    markdownBuffer.length = 0;

    if (markdownContent.trim() !== '') {
      blocks.push({ type: 'markdown', content: markdownContent });
    }
  };

  while (index < lines.length) {
    const headingMatch = lines[index].match(/^###\s+(.+)$/);
    if (!headingMatch) {
      markdownBuffer.push(lines[index]);
      index += 1;
      continue;
    }

    const title = headingMatch[1].trim().replace(/\s+#+\s*$/, '');
    let probe = skipBlankLines(lines, index + 1);
    const imageBlock = parseMarkdownImageAt(lines, probe);
    if (!imageBlock) {
      markdownBuffer.push(lines[index]);
      index += 1;
      continue;
    }

    probe = skipBlankLines(lines, imageBlock.nextIndex);
    const codeBlock = parseCodeBlockAt(lines, probe);
    if (!codeBlock) {
      markdownBuffer.push(lines[index]);
      index += 1;
      continue;
    }

    flushMarkdownBuffer();
    blocks.push({
      type: 'example',
      title,
      imageSrc: imageBlock.src,
      imageAlt: imageBlock.alt,
      code: codeBlock.code,
      language: codeBlock.language,
    });
    index = codeBlock.nextIndex;
  }

  flushMarkdownBuffer();

  return blocks;
}

function createMarkdownComponents({ wrapCodeLines = false }: { wrapCodeLines?: boolean } = {}): Components {
  const createHeading = (tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') => {
    const HeadingComponent = ({ children }: { children?: React.ReactNode }) => {
      const headingText = flattenText(children).trim();
      const id = headingText === '' ? undefined : (slugifyHeading(headingText) || 'section');
      return React.createElement(tag, { id }, children);
    };
    HeadingComponent.displayName = `Markdown${tag.toUpperCase()}Heading`;
    return HeadingComponent;
  };

  return {
    h1: createHeading('h1'),
    h2: createHeading('h2'),
    h3: createHeading('h3'),
    h4: createHeading('h4'),
    h5: createHeading('h5'),
    h6: createHeading('h6'),
    code: ({ className, children }) => {
      const languageMatch = /language-([\w-]+)/.exec(className || '');
      if (languageMatch) {
        const code = flattenText(children).replace(/\n$/, '');
        return <CodeBlock code={code} language={languageMatch[1]} wrapLines={wrapCodeLines} />;
      }

      return <code className={cn("rounded-sm bg-[var(--code-bg)] px-[0.2em] py-[0.2em] font-mono text-sm text-[var(--syn-inline-code)] [overflow-wrap:anywhere]", className)}>{children}</code>;
    },
    pre: ({ children }) => <>{children}</>,
    img: ({ src, alt, width, height }) => (
      <SafeImage
        src={src}
        alt={alt}
        className={cn(
          "max-w-full rounded-lg object-contain"
        )}
        width={typeof width === 'number' ? width : undefined}
        height={typeof height === 'number' ? height : undefined}
      />
    ),
    a: ({ href, children }) => {
      const target = href?.startsWith('http') ? '_blank' : undefined;
      const rel = target ? 'noopener noreferrer' : undefined;
      return (
        <a href={href} target={target} rel={rel} className="text-[var(--link-color)] underline decoration-[0.08em] underline-offset-[0.12em] transition-colors hover:text-[var(--link-color-hover)]">
          {children}
        </a>
      );
    },
  };
}

interface SafeImageProps {
  src?: string | Blob;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}

function SafeImage({ src, alt, className, width, height }: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = typeof src === 'string' ? src : undefined;

  if (!resolvedSrc || hasError) {
    return null;
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt || ''}
      loading="lazy"
      className={className}
      onError={() => setHasError(true)}
      width={width}
      height={height}
    />
  );
}

function flattenText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(flattenText).join('');
  }

  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return flattenText(node.props.children);
  }

  return '';
}
