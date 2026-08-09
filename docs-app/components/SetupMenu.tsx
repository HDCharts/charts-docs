'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface SetupMenuProps {
  versionId: string;
  variant: 'docs' | 'marketing';
}

export function SetupMenu({ versionId, variant }: SetupMenuProps) {
  const pathname = usePathname();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const manualPath = `/${versionId}/wiki/getting-started`;
  const agentPath = `/${versionId}/agent`;
  const active = pathname === manualPath || pathname.startsWith(`${manualPath}/`) || pathname === agentPath || pathname.startsWith(`${agentPath}/`);

  function openMenu() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    setOpen(true);
  }

  function scheduleClose() {
    closeTimerRef.current = setTimeout(() => setOpen(false), 150);
  }

  const isMarketing = variant === 'marketing';

  return (
    <div
      className={cn('relative', isMarketing && 'marketing-setup-menu')}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onFocus={openMenu}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          scheduleClose();
        }
      }}
    >
      <button
        type="button"
        className={isMarketing
          ? 'marketing-setup-trigger'
          : cn(
              'hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors lg:flex',
              active || open
                ? 'bg-[var(--surface-overlay)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)] hover:text-[var(--text-primary)]',
            )}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => (open ? setOpen(false) : openMenu())}
      >
        Setup
        <svg className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2 4.5L6 8l4-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        role="menu"
        aria-label="Setup navigation"
        className={cn(
          isMarketing ? 'marketing-setup-popover' : 'absolute left-0 top-full z-[100] mt-3 min-w-44 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-2 shadow-[0_24px_60px_-24px_rgb(0_0_0_/_0.8)]',
          open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0',
          'transition-[opacity,transform,visibility] duration-150',
        )}
      >
        <Link
          href={manualPath}
          role="menuitem"
          className={isMarketing ? 'marketing-setup-link' : 'flex items-center rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] no-underline transition-colors hover:bg-[var(--surface-overlay-hover)] hover:text-[var(--text-primary)]'}
          onClick={() => setOpen(false)}
        >
          Manual
        </Link>
        <Link
          href={agentPath}
          role="menuitem"
          className={isMarketing ? 'marketing-setup-link' : 'flex items-center rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] no-underline transition-colors hover:bg-[var(--surface-overlay-hover)] hover:text-[var(--text-primary)]'}
          onClick={() => setOpen(false)}
        >
          Agent
        </Link>
      </div>
    </div>
  );
}
