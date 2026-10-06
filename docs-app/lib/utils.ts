import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const focusRing = cn(
  "focus-visible:outline-none focus-visible:ring-2",
  "focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
);

export const disabled = "disabled:pointer-events-none disabled:opacity-50";

// Desktop doc sidebars: stick below the header, scroll on their own when taller
// than the viewport, and keep room for link focus rings inside the scroll box.
export const stickySidebar =
  "lg:sticky lg:top-[calc(var(--header-height)+2rem)] lg:self-start lg:-m-1 lg:max-h-[calc(100vh-var(--header-height)-4rem)] lg:overflow-y-auto lg:p-1 lg:[scrollbar-gutter:stable]";
