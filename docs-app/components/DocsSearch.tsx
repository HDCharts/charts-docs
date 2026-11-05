'use client';

import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { searchDocumentation, searchSnippet, type SearchEntry, type SearchIndex } from '@/lib/search';

type Scope = 'latest' | 'snapshot';

export function DocsSearch({ versionId, marketing = false }: { versionId: string; marketing?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<Scope>(versionId === 'snapshot' ? 'snapshot' : 'latest');
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [indexes, setIndexes] = useState<Partial<Record<Scope, SearchIndex>>>({});
  const [failedScope, setFailedScope] = useState<Scope | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((previous) => !previous);
      } else if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open || indexes[scope] || failedScope === scope) return;
    const controller = new AbortController();

    fetch('/search-index/' + scope, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Search index unavailable');
        return response.json() as Promise<SearchIndex>;
      })
      .then((index) => setIndexes((previous) => ({ ...previous, [scope]: index })))
      .catch(() => {
        if (!controller.signal.aborted) setFailedScope(scope);
      });

    return () => controller.abort();
  }, [open, scope, indexes, failedScope]);

  const index = indexes[scope];
  const results = useMemo(() => searchDocumentation(index?.entries ?? [], query), [index, query]);

  function selectResult(result: SearchEntry) {
    setOpen(false);
    router.push(result.url);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Search documentation"
        title="Search documentation (⌘K / Ctrl+K)"
        onClick={() => setOpen(true)}
        className={marketing
          ? 'inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-[#d0dcd8] bg-white/60 px-3 text-sm text-[#34544a] hover:bg-white'
          : 'inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[var(--border-color)] px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)]'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
        </svg>
        <span className="hidden xl:inline">Search docs</span>
        <kbd className="hidden rounded border border-current/20 px-1 text-[10px] opacity-70 2xl:inline">⌘ K</kbd>
      </button>

      {open ? createPortal(
        <div
          className="fixed inset-0 z-[200] overflow-y-auto bg-black/45 px-4 pt-[12vh]"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Search documentation"
            className="mx-auto w-full max-w-xl overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-2xl"
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' && results.length > 0) {
                event.preventDefault();
                setActiveIndex((previous) => (previous + 1) % results.length);
              } else if (event.key === 'ArrowUp' && results.length > 0) {
                event.preventDefault();
                setActiveIndex((previous) => (previous + results.length - 1) % results.length);
              } else if (event.key === 'Enter' && event.target === inputRef.current && results[activeIndex]) {
                event.preventDefault();
                selectResult(results[activeIndex]);
              } else if (event.key === 'Tab') {
                const focusable = event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input');
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault();
                  last?.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first?.focus();
                }
              }
            }}
          >
            <div className="flex items-center gap-3 border-b border-[var(--border-color)] p-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }}
                placeholder="Search documentation..."
                aria-label="Search query"
                className="min-w-0 flex-1 bg-transparent text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close search" className="rounded px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-overlay)]">Esc</button>
            </div>

            <div className="flex items-center gap-2 border-b border-[var(--border-color)] px-4 py-2 text-xs">
              <span className="mr-1 text-[var(--text-muted)]">Search in</span>
              {(['latest', 'snapshot'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={scope === item}
                  onClick={() => { setScope(item); setActiveIndex(0); }}
                  className={'rounded-md px-2 py-1.5 transition-colors ' + (scope === item
                    ? 'bg-[var(--surface-overlay)] font-semibold text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)]')}
                >
                  {item === 'latest' ? 'Latest release' : 'Snapshot'}
                </button>
              ))}
              {index ? <span className="ml-auto text-[var(--text-muted)]">{index.version}</span> : null}
            </div>

            <div className="max-h-[55vh] min-h-28 overflow-y-auto p-2">
              {!index && failedScope === scope ? (
                <div className="p-4 text-sm text-[var(--text-secondary)]">
                  Could not load search results.
                  <button type="button" className="ml-2 underline" onClick={() => setFailedScope(null)}>Retry</button>
                </div>
              ) : !index ? (
                <p className="p-4 text-sm text-[var(--text-muted)]">Loading documentation…</p>
              ) : !query.trim() ? (
                <p className="p-4 text-sm text-[var(--text-muted)]">Type a keyword, chart name, or API symbol.</p>
              ) : results.length === 0 ? (
                <p className="p-4 text-sm text-[var(--text-muted)]">No results in {index.version}.</p>
              ) : results.map((result, resultIndex) => (
                <button
                  key={result.url}
                  type="button"
                  onMouseEnter={() => setActiveIndex(resultIndex)}
                  onClick={() => selectResult(result)}
                  className={'block w-full rounded-lg px-3 py-2.5 text-left ' + (activeIndex === resultIndex
                    ? 'bg-[var(--surface-overlay)]'
                    : 'hover:bg-[var(--surface-overlay)]')}
                >
                  <span className="block text-sm font-semibold">{result.title}{result.section ? ' / ' + result.section : ''}</span>
                  <span className="mt-1 block text-xs text-[var(--text-secondary)]">{searchSnippet(result.text, query) || result.url}</span>
                </button>
              ))}
            </div>
            <p className="border-t border-[var(--border-color)] px-4 py-2 text-xs text-[var(--text-muted)]">
              ↑ ↓ Navigate · Enter Open · Esc Close
            </p>
          </section>
        </div>, document.body
      ) : null}
    </>
  );
}
