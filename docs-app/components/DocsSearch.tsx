'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  searchBothVersions,
  searchSnippet,
  type SearchEntry,
  type SearchIndex,
} from '@/lib/search';

interface SearchIndexes {
  latest: SearchIndex;
  snapshot: SearchIndex;
}

export function DocsSearch({ marketing = false }: { marketing?: boolean }) {
  const router = useRouter();
  const resultsId = useId();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [indexes, setIndexes] = useState<SearchIndexes | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      } else if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  useEffect(() => {
    if (!open || indexes || loadError) return;
    const controller = new AbortController();

    const loadIndex = async (scope: 'latest' | 'snapshot'): Promise<SearchIndex> => {
      const response = await fetch('/search-index/' + scope, { signal: controller.signal });
      if (!response.ok) throw new Error('Could not load documentation search');
      return response.json() as Promise<SearchIndex>;
    };

    Promise.all([loadIndex('latest'), loadIndex('snapshot')])
      .then(([latest, snapshot]) => setIndexes({ latest, snapshot }))
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      });

    return () => controller.abort();
  }, [open, indexes, loadError]);

  const groups = useMemo(
    () => indexes ? searchBothVersions(indexes.latest, indexes.snapshot, query) : [],
    [indexes, query],
  );

  const allResults = useMemo(
    () => groups.flatMap((group) => group.results),
    [groups],
  );

  function selectResult(result: SearchEntry) {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
    router.push(result.url);
  }

  return (
    <div ref={searchRef} className="relative min-w-0 flex-1">
      <label className="relative block w-full">
        <span className="sr-only">Search documentation</span>
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
          width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' && allResults.length) {
              event.preventDefault();
              setActiveIndex((index) => (index + 1) % allResults.length);
            } else if (event.key === 'ArrowUp' && allResults.length) {
              event.preventDefault();
              setActiveIndex((index) => (index + allResults.length - 1) % allResults.length);
            } else if (event.key === 'Enter' && allResults[activeIndex]) {
              event.preventDefault();
              selectResult(allResults[activeIndex]);
            } else if (event.key === 'Escape') {
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
          placeholder="Search documentation..."
          aria-label="Search documentation"
          aria-expanded={open}
          aria-controls={resultsId}
          aria-keyshortcuts="Meta+K Control+K"
          className={
            'h-[42px] w-full min-w-0 border py-2 pl-10 pr-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--ring-soft)] ' +
            (marketing
              ? 'rounded-full border-[#d0dcd8] bg-white/70 text-[#243e36] placeholder:text-[#60756e] hover:bg-white'
              : 'rounded-lg border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] hover:border-[var(--text-muted)]')
          }
        />
      </label>

      {open && (
        <section
          id={resultsId}
          aria-label="Documentation search results"
          className="absolute right-0 top-[calc(100%+0.75rem)] z-[100] flex max-h-[min(72vh,720px)] w-[min(840px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-2xl max-md:fixed max-md:left-3 max-md:right-3 max-md:top-[4.75rem] max-md:w-auto"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border-color)] px-5 py-3">
            <span className="text-sm font-semibold">Documentation search</span>
            <span className="text-xs text-[var(--text-muted)]">Latest release + Snapshot</span>
          </div>
          <div className="min-h-28 overflow-y-auto px-3 py-3" aria-live="polite">
            {loadError ? (
              <p className="px-3 py-4 text-sm text-[var(--text-secondary)]">
                Could not load search results.{' '}
                <button type="button" className="underline" onClick={() => setLoadError(false)}>
                  Retry
                </button>
              </p>
            ) : !indexes ? (
              <p className="px-3 py-4 text-sm text-[var(--text-muted)]">Loading documentation…</p>
            ) : !query.trim() ? (
              <p className="px-3 py-4 text-sm text-[var(--text-muted)]">
                Search chart names, guides, and Kotlin API symbols across the latest release and snapshot.
              </p>
            ) : allResults.length === 0 ? (
              <p className="px-3 py-4 text-sm text-[var(--text-muted)]">
                No results found in the latest release or snapshot.
              </p>
            ) : groups.map((group, groupIndex) => group.results.length > 0 && (
              <div key={group.scope} className={groupIndex > 0 ? 'mt-5 border-t border-[var(--border-color)] pt-4' : ''}>
                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  {group.scope === 'latest' ? `Latest release · ${group.version}` : 'Snapshot'}
                </p>
                <div className="flex flex-col gap-1">
                  {group.results.map((result, index) => {
                    const resultIndex = (groupIndex === 0 ? 0 : groups[0].results.length) + index;
                    return (
                      <button
                        key={result.url}
                        type="button"
                        onMouseEnter={() => setActiveIndex(resultIndex)}
                        onClick={() => selectResult(result)}
                        className={
                          'block w-full rounded-lg px-3 py-3 text-left transition-colors ' +
                          (resultIndex === activeIndex
                            ? 'bg-[var(--surface-overlay)]'
                            : 'hover:bg-[var(--surface-overlay)]')
                        }
                      >
                        <span className="block text-sm font-semibold">
                          {result.title}{result.section ? ' / ' + result.section : ''}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-[var(--text-secondary)]">
                          {searchSnippet(result.text, query) || result.url}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--border-color)] px-5 py-2 text-xs text-[var(--text-muted)]">
            ↑ ↓ Navigate · Enter Open · Esc Close
          </div>
        </section>
      )}
    </div>
  );
}
