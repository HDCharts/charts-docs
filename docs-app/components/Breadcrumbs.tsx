import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-[var(--text-secondary)]">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
          {index > 0 ? <span aria-hidden="true">/</span> : null}
          {item.href ? (
            <Link href={item.href} className="no-underline hover:text-[var(--text-primary)] hover:underline">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="font-medium text-[var(--text-primary)]">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
