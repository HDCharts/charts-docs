'use client';

/* eslint-disable react-hooks/set-state-in-effect -- Intentional: controlled state sync patterns */
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DocVersion } from '@/lib/types';
import { cn } from '@/lib/utils';

interface VersionSwitcherProps {
  versions: DocVersion[];
  currentVersion: DocVersion;
}

export function VersionSwitcher({ versions, currentVersion }: VersionSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const menuId = 'version-switcher-menu';
  const pathnameRef = useRef(pathname);

  const focusMenuItem = useCallback(
    (direction: 'next' | 'prev' | 'first' | 'last') => {
      if (!dropdownRef.current) return;
      const items = Array.from(
        dropdownRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]'),
      );
      if (items.length === 0) return;

      const currentIndex = items.findIndex((item) => item === document.activeElement);
      let nextIndex: number;

      switch (direction) {
        case 'next':
          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          break;
        case 'prev':
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          break;
        case 'first':
          nextIndex = 0;
          break;
        case 'last':
          nextIndex = items.length - 1;
          break;
      }

      items[nextIndex]?.focus();
    },
    [],
  );

  useLayoutEffect(() => {
    if (pathname !== pathnameRef.current) {
      pathnameRef.current = pathname;
      setIsOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    function handleMouseDown(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          focusMenuItem('next');
          break;
        case 'ArrowUp':
          event.preventDefault();
          focusMenuItem('prev');
          break;
        case 'Home':
          event.preventDefault();
          focusMenuItem('first');
          break;
        case 'End':
          event.preventDefault();
          focusMenuItem('last');
          break;
      }
    }

    const button = dropdownRef.current?.previousElementSibling as HTMLElement | null;
    if (button === document.activeElement) {
      focusMenuItem('first');
    }

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, focusMenuItem]);

  function getVersionPath(version: DocVersion): string {
    const pathParts = pathname.split('/');
    const currentVersionIndex = pathParts.findIndex(p => p === currentVersion.id);
    
    if (currentVersionIndex !== -1) {
      pathParts[currentVersionIndex] = version.id;
      return pathParts.join('/');
    }
    
    return `/${version.id}/wiki`;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className={cn(
          "flex items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-transparent px-2 py-2 text-sm font-medium leading-relaxed text-[var(--text-secondary)] transition-[colors,border-color,background-color,transform]",
          "hover:border-[var(--color-primary)] hover:bg-[var(--surface-overlay-hover)] hover:text-[var(--text-primary)]",
          "[aria-expanded=true]:border-[var(--color-primary)] [aria-expanded=true]:bg-[var(--surface-overlay-hover)] [aria-expanded=true]:text-[var(--text-primary)]",
          "active:translate-y-px min-h-11"
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label="Switch documentation version"
      >
        <span className="font-medium">{currentVersion.label}</span>
        <svg
          className={cn(
            "h-3 w-3 transition-transform",
            isOpen && "rotate-180"
          )}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2 4L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        className={cn(
          "absolute right-0 top-full z-[110] mt-2 min-w-[180px] max-w-[calc(100vw-2rem)] rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] p-1",
          "transition-[opacity,transform] duration-200 ease-out",
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none invisible"
        )}
        id={menuId}
        role="menu"
        aria-label="Versions"
      >
        {versions.map((version) => (
          <Link
            key={version.id}
            href={getVersionPath(version)}
            className={cn(
              "flex items-center justify-between border-l-2 border-transparent px-2 py-2 text-sm text-[var(--text-secondary)] no-underline transition-colors",
              "hover:bg-transparent hover:text-[var(--text-primary)]",
              version.id === currentVersion.id && "border-l-[var(--color-primary)] bg-transparent text-[var(--text-primary)]"
            )}
            onClick={() => setIsOpen(false)}
            role="menuitem"
            tabIndex={isOpen ? 0 : -1}
          >
            <span className="font-medium text-[var(--text-primary)]">{version.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
