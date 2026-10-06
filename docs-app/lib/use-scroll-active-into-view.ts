import { usePathname } from 'next/navigation';
import { type RefObject, useEffect } from 'react';

// Scrolls a sidebar so its aria-current link is visible after navigation.
// Only moves the container itself (never the page), and only when it scrolls.
export function useScrollActiveIntoView(containerRef: RefObject<HTMLElement | null>) {
  const pathname = usePathname();
  useEffect(() => {
    const container = containerRef.current;
    if (!container || container.scrollHeight <= container.clientHeight) {
      return;
    }
    const active = container.querySelector<HTMLElement>('[aria-current="page"]');
    if (!active) {
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    if (activeRect.top < containerRect.top) {
      container.scrollTop += activeRect.top - containerRect.top;
    } else if (activeRect.bottom > containerRect.bottom) {
      container.scrollTop += activeRect.bottom - containerRect.bottom;
    }
  }, [containerRef, pathname]);
}
