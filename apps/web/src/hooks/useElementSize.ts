"use client";

import { useEffect, useState, type RefObject } from "react";
import type { StageSize } from "@/burger/stackLayout";

export function useElementSize(ref: RefObject<HTMLElement | null>): StageSize | null {
  const [size, setSize] = useState<StageSize | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((current) => (current?.width === width && current.height === height ? current : { width, height }));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
