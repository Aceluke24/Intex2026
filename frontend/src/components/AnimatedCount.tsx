import { useEffect, useRef, useState } from "react";

type Props = {
  value: number | null;
  suffix?: string;
  prefix?: string;
  fallback?: string;
  durationMs?: number;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function AnimatedCount({
  value,
  suffix = "",
  prefix = "",
  fallback = "--",
  durationMs = 1400,
}: Props) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started || value === null) return;
    let frame = 0;
    const begin = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - begin) / durationMs);
      const eased = easeOutCubic(progress);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, started, value]);

  return (
    <span ref={containerRef}>
      {value === null ? fallback : `${prefix}${display.toLocaleString()}${suffix}`}
    </span>
  );
}
