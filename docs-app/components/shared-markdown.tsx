'use client';

import React, { type ReactNode } from 'react';
import { Components } from 'react-markdown';
import { copyToClipboard } from '@/lib/copy-to-clipboard';
import { cn } from '@/lib/utils';

export function createSharedMarkdownComponents(
  headingSlugger: (text: string) => string,
  renderCodeBlock: (props: { code: string; language: string; wrapLines: boolean }) => ReactNode,
  imageMaxWidthClassName: string,
): Components {
  const createHeading = (tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') => {
    const HeadingComponent = ({ children }: { children?: React.ReactNode }) => {
      const headingText = flattenText(children).trim();
      const id = headingText === '' ? undefined : (headingSlugger(headingText) || 'section');
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
        return renderCodeBlock({ code, language: languageMatch[1], wrapLines: false });
      }
      return (
        <code
          className={cn(
            "rounded-sm bg-[var(--code-bg)] px-[0.2em] py-[0.2em] font-mono text-sm text-[var(--syn-inline-code)] [overflow-wrap:anywhere]",
            className,
          )}
        >
          {children}
        </code>
      );
    },
    pre: ({ children }) => <>{children}</>,
    img: ({ src, alt, width, height }) => (
      <SafeImage
        src={src}
        alt={alt || ''}
        className={cn('mx-auto block max-w-full rounded-lg object-contain', imageMaxWidthClassName)}
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

export interface CodeBlockContainerProps {
  code: string;
  language: string;
  wrapLines?: boolean;
  className?: string;
  children?: ReactNode;
}

export function CodeBlockContainer({ code, language, wrapLines = false, className, children }: CodeBlockContainerProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  }, [code]);

  return (
    <div
      className={cn(
        'relative mb-4 overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--code-bg)] pt-12',
        className,
      )}
      aria-label={language !== 'text' ? `Code snippet in ${language}` : 'Code snippet'}
    >
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
        {children}
      </div>
    </div>
  );
}

export function flattenText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return flattenText(node.props.children);
  return '';
}

interface SafeImageProps {
  src?: string | Blob;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}

function SafeImage({ src, alt, className, width, height }: SafeImageProps) {
  const [hasError, setHasError] = React.useState(false);
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
