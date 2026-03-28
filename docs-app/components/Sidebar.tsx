'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DocVersion, NavItem } from '@/lib/types';
import { getVersionDemoUrl } from '@/lib/version-links';
import { cn } from '@/lib/utils';
import {
  ApiReferenceIcon,
  DemoGalleryIcon,
  ExamplesIcon,
  ExternalLinkIcon,
  GettingStartedIcon,
  MigrationIcon,
  OverviewIcon,
  PlaygroundIcon,
  ThanksIcon,
} from '@/components/icons/SidebarIcons';

interface SidebarProps {
  navigation: NavItem[];
  version: DocVersion;
}

function sanitizeNavigationPath(rawPath: string): string {
  const trimmedPath = rawPath.trim();
  if (!trimmedPath.startsWith('/') || trimmedPath.startsWith('//')) {
    return '/';
  }

  const [pathname, hashFragment] = trimmedPath.split('#', 2);
  const sanitizedPathname =
    pathname
      .split('/')
      .map((segment, index) => (index === 0 ? '' : encodeURIComponent(segment)))
      .join('/') || '/';

  if (!hashFragment) {
    return sanitizedPathname;
  }

  return `${sanitizedPathname}#${encodeURIComponent(hashFragment)}`;
}

function normalizeHashValue(value: string): string {
  const withoutPrefix = value.startsWith('#') ? value.slice(1) : value;

  try {
    return decodeURIComponent(withoutPrefix);
  } catch {
    return withoutPrefix;
  }
}

function getDocumentationIcon(slug: string) {
  switch (slug) {
    case '':
      return <OverviewIcon />;
    case 'getting-started':
      return <GettingStartedIcon />;
    case 'examples':
      return <ExamplesIcon />;
    case 'migration':
      return <MigrationIcon />;
    default:
      return null;
  }
}

export function Sidebar({ navigation, version }: SidebarProps) {
  const pathname = usePathname();
  const [hash, setHash] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const demoUrl = getVersionDemoUrl(version);
  const thanksPath = '/thanks';

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, [pathname]);

  const isActive = useCallback((item: NavItem): boolean => {
    const itemPath = item.path.replace(/\/$/, '');
    const currentPath = pathname.replace(/\/$/, '');
    return itemPath === currentPath;
  }, [pathname]);

  const isChildActive = useCallback((item: NavItem, isFirstChild = false): boolean => {
    const [itemPath, itemHash] = item.path.split('#');
    const currentPath = pathname.replace(/\/$/, '');
    const normalizedPath = (itemPath ?? '').replace(/\/$/, '');
    const normalizedCurrentHash = normalizeHashValue(hash);

    if (normalizedPath !== currentPath) {
      return false;
    }

    if (!itemHash) {
      return true;
    }

    if (normalizedCurrentHash === '') {
      return isFirstChild;
    }

    return normalizedCurrentHash === normalizeHashValue(itemHash);
  }, [pathname, hash]);

  const hasActiveChild = useCallback((item: NavItem): boolean => {
    return (item.children ?? []).some((child) => isChildActive(child));
  }, [isChildActive]);

  function closeMobileNavigation() {
    setMobileNavOpen(false);
  }

  return (
    <aside 
      className={cn(
        "sticky top-[var(--header-height)] z-40 mt-[var(--header-height)] w-full border-b border-[var(--border-color)] bg-[var(--bg-secondary)] p-3 lg:fixed lg:top-[var(--header-height)] lg:bottom-0 lg:left-0 lg:z-40 lg:mt-0 lg:w-[var(--sidebar-width)] lg:border-b-0 lg:border-r lg:p-5",
        mobileNavOpen && "lg:z-50"
      )} 
      aria-label="Sidebar navigation"
    >
      <button
        type="button"
        className={cn(
          "flex w-full min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-overlay)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors lg:hidden",
          "hover:border-[var(--color-primary)] hover:bg-[var(--surface-overlay-hover)] hover:text-[var(--text-primary)]",
          mobileNavOpen && "border-[var(--color-primary)] bg-[var(--surface-overlay-hover)] text-[var(--text-primary)]"
        )}
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
        aria-expanded={mobileNavOpen}
        aria-controls="docs-sidebar-content"
      >
        <span>Menu</span>
        <svg
          className={cn(
            "h-3 w-3 transition-transform",
            mobileNavOpen && "rotate-180"
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
        id="docs-sidebar-content" 
        className={cn(
          "mt-3 overflow-y-auto lg:mt-0",
          "max-h-[calc(100vh-var(--header-height)-var(--header-height)-2rem)] lg:max-h-none lg:overflow-y-auto",
          "scrollbar-thin scrollbar-thumb-[var(--scrollbar-thumb)] scrollbar-track-[var(--scrollbar-track)]",
          mobileNavOpen ? "block lg:block" : "hidden lg:block"
        )}
      >
        <div className="mb-6 lg:mb-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Documentation</h2>
          <nav className="flex flex-col gap-1" aria-label="Documentation">
            {navigation.map((item) => {
              const isCurrentItemSectionActive = isActive(item) || hasActiveChild(item);

              return (
                <div key={item.path} className="flex flex-col">
                  <Link
                    href={sanitizeNavigationPath(item.path)}
                    className={cn(
                      "flex min-h-11 items-center gap-2 border-l-2 border-transparent px-3 py-2 text-sm text-[var(--text-secondary)] no-underline transition-colors",
                      "hover:bg-transparent hover:text-[var(--text-primary)]",
                      isCurrentItemSectionActive && "border-l-[var(--color-primary)] bg-transparent text-[var(--text-primary)] font-medium"
                    )}
                    onClick={closeMobileNavigation}
                  >
                    <span className="h-4 w-4 shrink-0 opacity-90 [&>svg]:h-4 [&>svg]:w-4">
                      {getDocumentationIcon(item.slug)}
                    </span>
                    <span className="flex items-center gap-2">
                      {item.title}
                      {typeof item.badgeCount === 'number' && item.badgeCount > 0 ? (
                        <span
                          className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--color-warning)_30%,var(--bg-secondary))] px-1 text-xs font-semibold text-[var(--text-primary)]"
                          aria-label={`${item.badgeCount} migration guides`}
                        >
                          {item.badgeCount}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                  {item.children && item.children.length > 0 && isCurrentItemSectionActive && (
                    <div className="ml-2 mt-1 flex flex-col gap-1 border-l border-[var(--border-subtle)] pl-3">
                      {item.children.map((child, index) => (
                        <Link
                          key={child.path}
                          href={sanitizeNavigationPath(child.path)}
                          className={cn(
                            "flex min-h-11 items-center border-l-2 border-transparent px-3 py-1.5 text-xs text-[var(--text-muted)] no-underline transition-colors",
                            "hover:bg-transparent hover:text-[var(--text-primary)]",
                            isChildActive(child, index === 0) && "border-l-[var(--color-primary)] bg-transparent text-[var(--text-primary)] font-medium"
                          )}
                          onClick={() => {
                            const [, childHash] = child.path.split('#');
                            if (childHash) {
                              setHash(`#${childHash}`);
                            }
                            closeMobileNavigation();
                          }}
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="mb-6 lg:mb-5 last:mb-0">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Resources</h2>
          <nav className="flex flex-col gap-1" aria-label="Resources">
            <Link
              href={`/${version.id}/api`}
              className={cn(
                "flex min-h-11 items-center gap-2 border-l-2 border-transparent px-3 py-2 text-sm text-[var(--text-secondary)] no-underline transition-colors",
                "hover:bg-transparent hover:text-[var(--text-primary)]",
                pathname.includes('/api') && "border-l-[var(--color-primary)] bg-transparent text-[var(--text-primary)] font-medium"
              )}
              onClick={closeMobileNavigation}
            >
              <span className="h-4 w-4 shrink-0 opacity-90 [&>svg]:h-4 [&>svg]:w-4">
                <ApiReferenceIcon />
              </span>
              <span className="flex items-center gap-2">API Reference</span>
            </Link>
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center gap-2 border-l-2 border-transparent px-3 py-2 text-sm text-[var(--text-secondary)] no-underline transition-colors hover:bg-transparent hover:text-[var(--text-primary)]"
              onClick={closeMobileNavigation}
              aria-label="Demo Gallery (opens in new tab)"
            >
              <span className="h-4 w-4 shrink-0 opacity-90 [&>svg]:h-4 [&>svg]:w-4">
                <DemoGalleryIcon />
              </span>
              <span className="flex items-center gap-2">
                Demo Gallery
                <ExternalLinkIcon className="h-3 w-3 shrink-0 opacity-50 transition-opacity hover:opacity-80" />
              </span>
            </a>
            <a
              href="/playground"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center gap-2 border-l-2 border-transparent px-3 py-2 text-sm text-[var(--text-secondary)] no-underline transition-colors hover:bg-transparent hover:text-[var(--text-primary)]"
              onClick={closeMobileNavigation}
              aria-label="Playground (opens in new tab)"
            >
              <span className="h-4 w-4 shrink-0 opacity-90 [&>svg]:h-4 [&>svg]:w-4">
                <PlaygroundIcon />
              </span>
              <span className="flex items-center gap-2">
                Playground
                <ExternalLinkIcon className="h-3 w-3 shrink-0 opacity-50 transition-opacity hover:opacity-80" />
              </span>
            </a>
            <Link
              href={thanksPath}
              className={cn(
                "flex min-h-11 items-center gap-2 border-l-2 border-transparent px-3 py-2 text-sm text-[var(--text-secondary)] no-underline transition-colors",
                "hover:bg-transparent hover:text-[var(--text-primary)]",
                pathname === thanksPath && "border-l-[var(--color-primary)] bg-transparent text-[var(--text-primary)] font-medium"
              )}
              onClick={closeMobileNavigation}
            >
              <span className="h-4 w-4 shrink-0 opacity-90 [&>svg]:h-4 [&>svg]:w-4">
                <ThanksIcon />
              </span>
              <span className="flex items-center gap-2">Thanks</span>
            </Link>
          </nav>
        </div>
      </div>
    </aside>
  );
}
