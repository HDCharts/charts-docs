'use client';

import { useEffect, useId, useState } from 'react';
import type { Mermaid } from 'mermaid';

let mermaidPromise: Promise<Mermaid> | null = null;

// Loaded on demand so pages without diagrams never download Mermaid.
function loadMermaid(): Promise<Mermaid> {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(({ default: mermaid }) => {
      // We render our own fallback, and without this Mermaid leaves its temp element in <body> on errors.
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral', suppressErrorRendering: true });
      return mermaid;
    });
  }
  return mermaidPromise;
}

interface MermaidDiagramProps {
  code: string;
}

export function MermaidDiagram({ code }: MermaidDiagramProps) {
  const diagramId = `mermaid-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadMermaid()
      .then((mermaid) => mermaid.render(diagramId, code))
      .then((result) => {
        if (!cancelled) setSvg(result.svg);
      })
      .catch((error: unknown) => {
        console.error('Mermaid diagram failed to render', error);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [code, diagramId]);

  if (failed) {
    return (
      <pre className="mb-4 overflow-x-auto rounded-lg border border-[var(--border-color)] bg-[var(--code-bg)] p-4 font-mono text-sm">
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <figure
      className="my-6 flex min-h-32 justify-center overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 sm:p-6 [&_svg]:h-auto [&_svg]:max-w-full"
      aria-busy={svg === null}
    >
      {svg ? (
        <div className="flex w-full justify-center" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <span className="self-center text-sm text-[var(--text-muted)]">Loading diagram…</span>
      )}
    </figure>
  );
}
