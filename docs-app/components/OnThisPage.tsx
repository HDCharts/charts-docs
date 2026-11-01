import type { PageHeading } from '@/lib/content';

interface OnThisPageProps {
  headings: PageHeading[];
}

export function OnThisPage({ headings }: OnThisPageProps) {
  if (headings.length === 0) {
    return null;
  }

  const sections: { heading: PageHeading; children: PageHeading[] }[] = [];
  for (const heading of headings) {
    if (heading.level === 3 && sections.length > 0) {
      sections[sections.length - 1].children.push(heading);
    } else {
      sections.push({ heading, children: [] });
    }
  }

  return (
    <nav aria-label="On this page" className="hidden w-48 shrink-0 xl:block">
      <div className="xl:sticky xl:top-[calc(var(--header-height)+2rem)] xl:-m-1 xl:max-h-[calc(100vh-var(--header-height)-4rem)] xl:overflow-y-auto xl:p-1 xl:[scrollbar-gutter:stable]">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          On this page
        </p>
        <ul className="flex min-w-0 flex-col gap-1.5 border-l border-[var(--border-color)] pl-3">
          {sections.map(({ heading, children }) => (
            <li key={heading.anchor} className="min-w-0">
              <a
                href={`#${heading.anchor}`}
                className="block break-words text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)] hover:underline"
              >
                {heading.title}
              </a>
              {children.length > 0 ? (
                <ul className="mt-1 flex min-w-0 flex-col gap-1 border-l border-[var(--border-color)] pl-3">
                  {children.map((child) => (
                    <li key={child.anchor} className="min-w-0">
                      <a
                        href={`#${child.anchor}`}
                        className="block break-words text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)] hover:underline"
                      >
                        {child.title}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
