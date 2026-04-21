"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

export const CanvasScrollRootContext =
  createContext<RefObject<HTMLElement | null> | null>(null);

export function useInView(
  targetRef: RefObject<Element | null>,
  { rootMargin = "800px 0px", initial = true } = {},
): boolean {
  const rootCtx = useContext(CanvasScrollRootContext);
  const [inView, setInView] = useState(initial);

  useEffect(() => {
    const target = targetRef.current;
    const root = rootCtx?.current ?? null;
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setInView(entry.isIntersecting);
      },
      { root, rootMargin, threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetRef, rootCtx, rootMargin]);

  return inView;
}

export function useMeasuredHeight(
  ref: RefObject<HTMLElement | null>,
): number | null {
  const [height, setHeight] = useState<number | null>(null);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const h = Math.round(entry.contentRect.height);
      if (h > 0 && h !== lastRef.current) {
        lastRef.current = h;
        setHeight(h);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return height;
}
