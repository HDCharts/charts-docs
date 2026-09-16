'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface StickySectionNavItem {
  id: string;
  title: string;
}

interface StickySectionNavProps {
  items: StickySectionNavItem[];
  label: string;
  ariaLabel: string;
  groups?: { label: string; items: StickySectionNavItem[] }[];
}

export function StickySectionNav({
  items,
  label,
  ariaLabel,
  groups,
}: StickySectionNavProps) {
  const hasGroups = Array.isArray(groups) && groups.length > 0;
  const trackedItems = useMemo(() => {
    if (!hasGroups) {
      return items;
    }
    return [...items, ...groups!.flatMap((group) => group.items)];
  }, [items, groups, hasGroups]);

  const [activeId, setActiveId] = useState(trackedItems[0]?.id ?? null);

  useEffect(() => {
    if (trackedItems.length === 0) {
      return;
    }

    const updateActiveSection = () => {
      const activationLine = window.innerHeight * 0.3;
      let nextActiveId = trackedItems[0].id;

      for (const item of trackedItems) {
        const heading = document.getElementById(item.id);
        if (heading && heading.getBoundingClientRect().top <= activationLine) {
          nextActiveId = item.id;
        }
      }

      setActiveId((currentId) => (currentId === nextActiveId ? currentId : nextActiveId));
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);

    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [trackedItems]);

  if (items.length === 0 && !hasGroups) {
    return null;
  }

  return (
    <aside className="hidden lg:block lg:self-stretch">
      <nav className="sticky top-[calc(var(--header-height)+1.25rem)] border-l border-[var(--border-color)] pl-3" aria-label={ariaLabel}>
        {items.length > 0 ? (
          <>
            <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
            <div className="flex flex-col gap-0.5">
              {renderItems(items, activeId)}
            </div>
          </>
        ) : null}
        {hasGroups ? (
          <div className={items.length > 0 ? 'mt-6' : undefined}>
            {groups!.map((group, groupIndex) => (
              <div key={group.label} className={groupIndex > 0 ? 'mt-6' : undefined}>
                <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  {group.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {renderItems(group.items, activeId)}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </nav>
    </aside>
  );
}

function renderItems(
  items: StickySectionNavItem[],
  activeId: string | null,
): ReactNode {
  return items.map(({ id, title }) => {
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
  });
}
