'use client';

import React, { useCallback, useEffect, useMemo, useState, createContext, useContext, type ReactNode } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createHighlighter, type Highlighter } from 'shiki';
import { slugifyHeading } from '@/lib/anchors';
import { copyToClipboard } from '@/lib/copy-to-clipboard';
import { cn } from '@/lib/utils';

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
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
  layoutVariant?: 'default' | 'snapshotExamples';
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
  const components = useMemo(() => createMarkdownComponents(), []);

  return (
    <div className="mx-auto max-w-[1120px]">
      {layoutVariant === 'snapshotExamples'
        ? renderSnapshotExamples(content, components)
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

interface CodeBlockProps {
  code: string;
  language: string;
}

function CodeBlock({ code, language }: CodeBlockProps) {
  const { highlighter, ready } = useHighlighterContext();
  const [copied, setCopied] = useState(false);

  const highlightedHtml = useMemo(() => {
    if (!ready || !highlighter) return null;
    
    const resolvedLanguage = language === 'kotlin' || language === 'text' ? 'kotlin' : 'text';
    try {
      return highlighter.codeToHtml(code, {
        lang: resolvedLanguage,
        theme: 'github-dark',
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
    <div className="relative mb-4 rounded-lg border border-[var(--border-color)] bg-[var(--code-bg)] pt-12 overflow-hidden">
      <button
        className={cn(
          "absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-md border border-[var(--border-color)] bg-[var(--surface-overlay)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)] transition-colors min-h-11 min-w-11",
          "hover:bg-[var(--surface-overlay-hover)] hover:text-[var(--text-primary)] hover:border-[var(--color-secondary)]",
          "active:translate-y-px",
          copied && "border-[var(--color-success)] text-[var(--color-success)]"
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
        className="overflow-x-auto p-4 [&_pre]:!m-0 [&_pre]:!rounded-none [&_pre]:!border-0 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:!bg-transparent [&_code]:!p-0"
        tabIndex={0}
        role="region"
        aria-label={`Code snippet${language !== 'text' ? ` in ${language}` : ''}`}
      >
        {highlightedHtml ? (
          <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
        ) : (
          <pre className="m-0 font-mono text-sm text-[var(--text-primary)] whitespace-pre">
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

function renderSnapshotExamples(
  content: string,
  components: Components,
): React.ReactNode {
  const blocks = splitSnapshotBlocks(content);

  return blocks.map((block, index) => {
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
        <h3 id={id} className="mt-6 mb-4 text-2xl font-semibold text-[var(--text-primary)] lg:text-xl">
          {block.title}
        </h3>
        <div className="mb-8 flex items-center gap-6 max-lg:flex-col max-lg:gap-4 max-lg:mb-6">
          <div className="flex-1 max-lg:flex-none max-lg:w-full">
            <SafeImage 
              src={block.imageSrc} 
              alt={block.imageAlt} 
              className="mx-auto max-w-[360px] rounded-lg shadow-[0_4px_8px_color-mix(in_oklch,var(--color-gray-950)_22%,transparent)]" 
            />
          </div>
          <div className="min-w-0 flex-1 max-lg:flex-none max-lg:w-full">
            <CodeBlock code={block.code} language={block.language} />
          </div>
        </div>
      </React.Fragment>
    );
  });
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

function createMarkdownComponents(): Components {
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
        return <CodeBlock code={code} language={languageMatch[1]} />;
      }

      return <code className={cn("rounded-sm bg-[var(--code-bg)] px-[0.2em] py-[0.2em] font-mono text-sm text-[var(--syn-inline-code)]", className)}>{children}</code>;
    },
    pre: ({ children }) => <>{children}</>,
    img: ({ src, alt, width, height }) => (
      <SafeImage
        src={src}
        alt={alt}
        className={cn(
          "max-w-full rounded-lg object-contain",
          typeof src === 'string' && src.includes('/assets/logo.png') && "mx-auto max-w-[min(500px,100%)] bg-[var(--brand-image-bg)] p-2 border border-[var(--brand-image-border)] shadow-[var(--brand-image-shadow)]"
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

const KNOWN_IMAGE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '/assets/logo.png': { width: 1500, height: 393 },
  '/assets/demo.png': { width: 2678, height: 1568 },
};

function getKnownDimensions(src: string): { width?: number; height?: number } {
  for (const [suffix, dims] of Object.entries(KNOWN_IMAGE_DIMENSIONS)) {
    if (src.endsWith(suffix)) {
      return dims;
    }
  }
  return {};
}

function SafeImage({ src, alt, className, width, height }: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = typeof src === 'string' ? src : undefined;

  if (!resolvedSrc || hasError) {
    return null;
  }

  const knownDims = width && height ? {} : getKnownDimensions(resolvedSrc);
  const imgWidth = width ?? knownDims.width;
  const imgHeight = height ?? knownDims.height;

  return (
    <img
      src={resolvedSrc}
      alt={alt || ''}
      loading="lazy"
      className={className}
      onError={() => setHasError(true)}
      width={imgWidth}
      height={imgHeight}
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
