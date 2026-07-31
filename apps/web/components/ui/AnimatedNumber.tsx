"use client";

import { useEffect, useRef, useState } from "react";

/** Cuenta desde 0 hasta `target` en ~900ms con easing — solo si el valor es
 * puramente numérico (los stats con sufijo como "8 (sin clasificar)" se
 * muestran directo, sin animar, para no truncar el texto a medio camino). */
function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    start.current = null;
    let frame: number;
    const step = (ts: number) => {
      if (start.current === null) start.current = ts;
      const progress = Math.min((ts - start.current) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}

export function AnimatedNumber({ value }: { value: string | number }) {
  const numeric = typeof value === "number" ? value : Number.isFinite(Number(value)) ? Number(value) : null;
  const animated = useCountUp(numeric ?? 0);
  if (numeric === null) return <>{value}</>;
  return <>{animated}</>;
}
