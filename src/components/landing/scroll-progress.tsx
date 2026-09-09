"use client";

import Lenis from "lenis";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { updateRangesFromDOM } from "./timeline";

type ProgressRef = MutableRefObject<number>;

const ScrollProgressContext = createContext<ProgressRef | null>(null);

export function useScrollProgressRef(): ProgressRef {
  const ctx = useContext(ScrollProgressContext);
  if (!ctx) throw new Error("useScrollProgressRef must be used within ScrollProgressProvider");
  return ctx;
}

export function ScrollProgressProvider({ children }: { children: ReactNode }) {
  const progress = useRef(0);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    lenis.on("scroll", ({ scroll, limit }: { scroll: number; limit: number }) => {
      const p = limit > 0 ? Math.min(1, Math.max(0, scroll / limit)) : 0;
      progress.current = p;
      document.documentElement.style.setProperty("--scroll-p", p.toFixed(5));
    });

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Section heights depend on real content (copy length, font metrics,
    // viewport width) which never matches a hand-picked vh budget exactly.
    // Measure the real DOM once it has settled, and again whenever it can
    // plausibly change, so scroll progress stays mapped to what's on screen.
    const remeasure = () => requestAnimationFrame(() => requestAnimationFrame(updateRangesFromDOM));
    remeasure();
    document.fonts?.ready.then(remeasure).catch(() => {});

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(remeasure, 150);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      lenis.destroy();
    };
  }, []);

  return (
    <ScrollProgressContext.Provider value={progress}>{children}</ScrollProgressContext.Provider>
  );
}
