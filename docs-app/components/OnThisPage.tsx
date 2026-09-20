import type { PageHeading } from '@/lib/content';

interface OnThisPageProps {
  headings: PageHeading[];
}

export function OnThisPage({ headings }: OnThisPageProps) {
  if (headings.length === 0) {
    return null;
  }

  return (
    <nav aria-label="On this page" className="hidden w-48 shrink-0 xl:block">
      <div className="xl:sticky xl:top-[calc(var(--header-height)+2rem)]">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          On this page
        </p>
        <ul className="flex flex-col gap-1.5 border-l border-[var(--border-color)] pl-3">
          {headings.map((heading) => (
            <li key={heading.anchor}>
              <a
                href={`#${heading.anchor}`}
                className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)] hover:underline"
              >
                {heading.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
