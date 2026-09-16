'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createHeadingSlugger, slugifyHeading } from '@/lib/anchors';
import { StickySectionNav, type StickySectionNavItem } from './StickySectionNav';
import { CodeBlockContainer, createSharedMarkdownComponents } from './shared-markdown';

interface OldVersionMarkdownRendererProps {
  content: string;
}

export function OldVersionMarkdownRenderer({ content }: OldVersionMarkdownRendererProps) {
  const components = useMemo(() => createOldMarkdownComponents(), []);
  const { blocks, slugger } = useMemo(
    () => {
      const slugger = createHeadingSlugger();
      const blocks = splitOldExampleBlocks(content, slugger);
      return { blocks, slugger };
    },
    [content],
  );
  const examples = useMemo(
    () => blocks.filter((block): block is OldExampleBlock => block.type === 'example'),
    [blocks],
  );
  const primaryExamples = useMemo(
    () => examples.filter((example) => example.inPrimaryGroup),
    [examples],
  );
  const secondaryExamples = useMemo(
    () => examples.filter((example) => !example.inPrimaryGroup),
    [examples],
  );
  const navigationItems = useMemo(() => buildExampleNavItems(primaryExamples), [primaryExamples]);
  const styleItems = useMemo(
    () => extractStyleNavItems(blocks, slugger, secondaryExamples),
    [blocks, slugger, secondaryExamples],
  );
  const navigationGroups = useMemo(
    () => (styleItems.length > 0 ? [{ label: 'Style Customization', items: styleItems }] : []),
    [styleItems],
  );

  return (
    <div className="mx-auto min-w-0 max-w-[1120px]">
      <div className="grid gap-8 lg:grid-cols-[9rem_minmax(0,1fr)] lg:items-start">
        <StickySectionNav
          items={navigationItems}
          label="Examples"
          ariaLabel="Examples navigation"
          groups={navigationGroups}
        />
        <div>
          {blocks.map((block, index) => {
            if (block.type === 'markdown') {
              return (
                <ReactMarkdown key={`old-markdown-${index}`} remarkPlugins={[remarkGfm]} components={components}>
                  {block.content}
                </ReactMarkdown>
              );
            }

            return (
              <React.Fragment key={`old-example-${index}`}>
                <h3 id={block.id} className="mt-6 mb-4 scroll-mt-24 text-2xl font-semibold text-[var(--text-primary)] lg:text-xl">
                  {block.title}
                </h3>
                <div className="mb-14">
                  {block.imageSrc && (
                    <div className="mb-8 flex justify-center">
                      <img
                        src={block.imageSrc}
                        alt={block.imageAlt || `${block.title} example`}
                        loading="lazy"
                        className="h-auto w-[320px] max-w-full rounded-xl object-contain shadow-[0_20px_45px_-30px_rgb(31_41_51_/_0.7)]"
                      />
                    </div>
                  )}
                  {block.caption && (
                    <p className="text-[var(--text-secondary)] text-center mb-6">{block.caption}</p>
                  )}
                  <div className="mx-auto min-w-0 max-w-[1000px]">
                    <CodeBlock code={block.code} language={block.language} wrapLines className="mb-0" />
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface OldExampleBlock {
  type: 'example';
  id: string;
  title: string;
  imageSrc?: string;
  imageAlt?: string;
  caption?: string;
  code: string;
  language: string;
  inPrimaryGroup: boolean;
}

interface OldMarkdownBlock {
  type: 'markdown';
  content: string;
}

type OldBlock = OldExampleBlock | OldMarkdownBlock;

function buildExampleNavItems(examples: OldExampleBlock[]): StickySectionNavItem[] {
  return examples.map((example) => ({
    id: example.id,
    title: example.title,
  }));
}

function extractStyleNavItems(
  blocks: OldBlock[],
  headingSlugger: (text: string) => string,
  secondaryExamples: OldExampleBlock[] = [],
): StickySectionNavItem[] {
  const trailingMarkdown = blocks
    .filter((block): block is OldMarkdownBlock => block.type === 'markdown')
    .map((block) => block.content)
    .join('\n\n');

  const headingRegex = /^##\s+(.+?)\s*#*\s*$/gm;
  const items: StickySectionNavItem[] = [];
  const consumedTitles = new Set<string>();

  for (const match of trailingMarkdown.matchAll(headingRegex)) {
    const title = match[1].trim();
    items.push({ id: headingSlugger(title), title });
    consumedTitles.add(slugifyHeading(title));
  }

  for (const example of secondaryExamples) {
    if (!consumedTitles.has(slugifyHeading(example.title))) {
      items.push({ id: example.id, title: example.title });
    }
  }

  return items;
}

function splitOldExampleBlocks(content: string, headingSlugger: (text: string) => string): OldBlock[] {
  const lines = content.split('\n');
  const blocks: OldBlock[] = [];
  const markdownBuffer: string[] = [];
  let index = 0;
  let hasStartedPrimaryGroup = false;
  let hasEndedPrimaryGroup = false;

  const flushMarkdownBuffer = () => {
    if (markdownBuffer.length === 0) return;
    const markdownContent = markdownBuffer.join('\n');
    markdownBuffer.length = 0;
    if (markdownContent.trim() !== '') {
      blocks.push({ type: 'markdown', content: markdownContent });
    }
  };

  while (index < lines.length) {
    const headingMatch = lines[index].match(/^###\s+(.+)$/);
    const h2Match = lines[index].match(/^##\s+(.+)$/);

    if (headingMatch) {
      const title = headingMatch[1].trim().replace(/\s+#+\s*$/, '');
      const probe = skipBlankLines(lines, index + 1);

      const maybeCode = parseCodeBlockAt(lines, probe);
      const maybeImage = !maybeCode ? parseMarkdownImageAt(lines, probe) : null;

      if (!maybeCode && !maybeImage) {
        // No code/image follows this heading — still register it in the nav
        // so it renders in the content and scrolls correctly from the sidebar.
        if (!hasStartedPrimaryGroup) {
          hasStartedPrimaryGroup = true;
        }
        flushMarkdownBuffer();
        blocks.push({
          type: 'example',
          id: headingSlugger(title),
          title,
          imageSrc: undefined,
          imageAlt: undefined,
          caption: undefined,
          code: '',
          language: 'text',
          inPrimaryGroup: !hasEndedPrimaryGroup,
        });
        index += 1;
        continue;
      }

      let imageSrc: string | undefined;
      let imageAlt: string | undefined;
      const code = maybeCode?.code ?? '';
      const language = maybeCode?.language ?? 'text';
      let nextIndex = maybeCode ? maybeCode.nextIndex : maybeImage!.nextIndex;

      if (maybeImage) {
        imageSrc = maybeImage.src;
        imageAlt = maybeImage.alt;
      }

      if (maybeCode) {
        const afterCode = skipBlankLines(lines, maybeCode.nextIndex);
        const laterImage = parseMarkdownImageAt(lines, afterCode);
        if (laterImage) {
          imageSrc = laterImage.src;
          imageAlt = laterImage.alt;
          nextIndex = laterImage.nextIndex;
        }
      }

      if (!hasStartedPrimaryGroup) {
        hasStartedPrimaryGroup = true;
      }

      flushMarkdownBuffer();
      blocks.push({
        type: 'example',
        id: headingSlugger(title),
        title,
        imageSrc,
        imageAlt,
        caption: imageSrc
          ? `${title} with ${hasEndedPrimaryGroup ? 'custom' : 'default'} styling`
          : undefined,
        code,
        language,
        inPrimaryGroup: !hasEndedPrimaryGroup,
      });
      index = nextIndex;
      continue;
    }

    if (h2Match && hasStartedPrimaryGroup && !hasEndedPrimaryGroup) {
      hasEndedPrimaryGroup = true;
      markdownBuffer.push(lines[index]);
      index += 1;
      continue;
    }

    markdownBuffer.push(lines[index]);
    index += 1;
  }

  flushMarkdownBuffer();
  return blocks;
}

function skipBlankLines(lines: string[], startIndex: number): number {
  let index = startIndex;
  while (index < lines.length && lines[index].trim() === '') {
    index += 1;
  }
  return index;
}

function parseMarkdownImageAt(lines: string[], startIndex: number): { src: string; alt: string; nextIndex: number } | null {
  if (startIndex >= lines.length) return null;
  const imageMatch = lines[startIndex].trim().match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/);
  if (!imageMatch) return null;
  return { alt: imageMatch[1], src: imageMatch[2], nextIndex: startIndex + 1 };
}

function parseCodeBlockAt(lines: string[], startIndex: number): { code: string; language: string; nextIndex: number } | null {
  if (startIndex >= lines.length || !lines[startIndex].startsWith('```')) return null;
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
  return { code: codeLines.join('\n'), language, nextIndex: index };
}

function createOldMarkdownComponents() {
  return createSharedMarkdownComponents(slugifyHeading, ({ code, language }) => (
    <CodeBlock code={code} language={language} wrapLines />
  ));
}

interface CodeBlockProps {
  code: string;
  language: string;
  wrapLines?: boolean;
  className?: string;
}

function CodeBlock({ code, language, wrapLines = false, className }: CodeBlockProps) {
  // Legacy examples intentionally use plain code blocks; the old releases were
  // captured from content that predates the current Shiki rendering pipeline.
  return (
    <CodeBlockContainer code={code} language={language} wrapLines={wrapLines} className={className}>
      <pre className="m-0 whitespace-pre font-mono text-sm text-[var(--text-primary)]">
        <code>{code}</code>
      </pre>
    </CodeBlockContainer>
  );
}
