'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { DevNavSection } from '@/lib/dev-docs';
import { cn } from '@/lib/utils';

interface DevSidebarProps {
  sections: DevNavSection[];
}

export function DevSidebar({ sections }: DevSidebarProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Developer docs"
      className="lg:sticky lg:top-[calc(var(--header-height)+2rem)] lg:self-start"
    >
      {sections.map((section) => (
        <div key={section.path} className="mb-5">
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {section.title}
          </p>
          <ul className="flex flex-col gap-1">
            {section.pages.map((page) => (
              <li key={page.path}>
                <Link
                  href={page.path}
                  className={cn(
                    'block rounded-md px-3 py-1.5 text-sm no-underline transition-colors',
                    pathname === page.path
                      ? 'bg-[var(--surface-overlay)] font-semibold text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)] hover:text-[var(--text-primary)]',
                  )}
                  aria-current={pathname === page.path ? 'page' : undefined}
                >
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
