import { useCallback, useEffect, useRef } from "react";

interface UseScrollPositionOptions {
  key?: string;
  disabled?: boolean;
  autoRestore?: boolean;
}

export function useScrollPosition({
  key = "scroll-position",
  disabled = false,
  autoRestore = true,
}: UseScrollPositionOptions) {
  const ref = useRef<HTMLDivElement>(null);

  const saveScrollPosition = useCallback(() => {
    if (disabled || !ref.current) return;
    localStorage.setItem(key, ref.current.scrollTop.toString());
  }, [key, disabled]);

  const restoreScrollPosition = useCallback(() => {
    if (disabled || !ref.current) return;
    const savedPosition = localStorage.getItem(key);
    if (savedPosition) {
      ref.current!.scrollTop = parseInt(savedPosition);
    }
  }, [key, disabled]);

  function observerElementHeight() {
    if (!ref.current || !autoRestore) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === ref.current) {
          restoreScrollPosition();
          observer.disconnect();
        }
      }
    });
    observer.observe(ref.current);
  }

  function observerElementByLCP() {
    if (!ref.current || !autoRestore) return;
    const observer = new PerformanceObserver((entries) => {
      for (const entry of entries.getEntries()) {
        if (entry.entryType === "largest-contentful-paint") {
          restoreScrollPosition();
          observer.disconnect();
        }
      }
    });
    observer.observe({ type: "largest-contentful-paint" });
  }

  useEffect(() => {
    const element = ref.current;
    if (!element || disabled) return;

    observerElementByLCP();
    observerElementHeight();
    element.addEventListener("scroll", saveScrollPosition);
    return () => {
      element.removeEventListener("scroll", saveScrollPosition);
    };
  }, [saveScrollPosition, disabled]);

  return {
    ref,
    restoreScrollPosition,
  };
}
