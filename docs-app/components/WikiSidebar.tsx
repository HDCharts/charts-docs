'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@/lib/types';
import { cn } from '@/lib/utils';

interface WikiSidebarProps {
  navigation: NavItem[];
}

// Already reachable from the header's own "Setup" menu (Manual + Agent), so
// it's left out here to avoid listing it twice.
const HEADER_DUPLICATED_SLUGS = new Set(['getting-started']);

export function WikiSidebar({ navigation }: WikiSidebarProps) {
  const pathname = usePathname();
  const items = navigation.filter((item) => !HEADER_DUPLICATED_SLUGS.has(item.slug));

  function isActive(path: string): boolean {
    return pathname === path || (path !== '' && (pathname?.startsWith(`${path}/`) ?? false));
  }

  return (
    <nav
      aria-label="Documentation"
      className="lg:sticky lg:top-[calc(var(--header-height)+2rem)] lg:self-start"
    >
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.path}>
            <Link
              href={item.path}
              className={cn(
                'flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-sm no-underline transition-colors',
                isActive(item.path)
                  ? 'bg-[var(--surface-overlay)] font-semibold text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)] hover:text-[var(--text-primary)]',
              )}
              aria-current={isActive(item.path) ? 'page' : undefined}
            >
              {item.title}
              {item.badgeCount ? (
                <span className="rounded-full bg-[var(--color-warning)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[var(--bg-primary)]">
                  {item.badgeCount}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
