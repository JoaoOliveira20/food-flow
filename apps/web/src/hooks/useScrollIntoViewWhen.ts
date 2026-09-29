"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

export function useScrollIntoViewWhen<ElementType extends HTMLElement>(isActive: boolean) {
  const elementRef = useRef<ElementType>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isActive) return;
    elementRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "nearest" });
  }, [isActive, prefersReducedMotion]);

  return elementRef;
}
