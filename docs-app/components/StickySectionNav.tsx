'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface StickySectionNavItem {
  id: string;
  title: string;
}

interface StickySectionNavProps {
  items: StickySectionNavItem[];
  label: string;
  ariaLabel: string;
}

export function StickySectionNav({ items, label, ariaLabel }: StickySectionNavProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? null);

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    const updateActiveSection = () => {
      const activationLine = window.innerHeight * 0.3;
      let nextActiveId = items[0].id;

      for (const item of items) {
        const heading = document.getElementById(item.id);
        if (heading && heading.getBoundingClientRect().top <= activationLine) {
          nextActiveId = item.id;
        }
      }

      setActiveId((currentId) => currentId === nextActiveId ? currentId : nextActiveId);
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);

    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  return (
    <aside className="hidden lg:block lg:self-stretch">
      <nav className="sticky top-[calc(var(--header-height)+1.25rem)] border-l border-[var(--border-color)] pl-3" aria-label={ariaLabel}>
        <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
        <div className="flex flex-col gap-0.5">
          {items.map(({ id, title }) => {
            const isActive = activeId === id;
            return (
              <a
                key={id}
                href={`#${id}`}
                aria-current={isActive ? 'location' : undefined}
                className={cn(
                  'rounded-md border-l-2 px-1.5 py-1.5 text-sm no-underline transition-colors hover:bg-[var(--surface-overlay)] hover:text-[var(--text-primary)]',
                  isActive
                    ? 'border-[var(--link-color)] bg-[var(--surface-overlay)] font-medium text-[var(--text-primary)]'
                    : 'border-transparent text-[var(--text-secondary)]',
                )}
              >
                {title}
              </a>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
