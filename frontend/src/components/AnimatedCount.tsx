import { useEffect, useState } from "react";

type Props = {
  value: number | null | undefined;
  suffix?: string;
  prefix?: string;
  fallback?: string;
  /** Duration for count-up animation (ms). Set 0 to disable animation. */
  durationMs?: number;
};

/**
 * Renders a database-backed number. `0` is valid and shown.
 * Only `null` / `undefined` / non-finite → fallback (e.g. "--"), never treat 0 as missing.
 */
export function AnimatedCount({
  value,
  suffix = "",
  prefix = "",
  fallback = "--",
  durationMs = 650,
}: Props) {
  if (value === null || value === undefined) {
    return <span>{fallback}</span>;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return <span>{fallback}</span>;
  }
  const shouldAnimate = durationMs > 0;

  // Tiny, dependency-free count-up. Avoids layout shift via tabular-nums.
  // Prefers stable final value if reduced-motion is enabled or duration is 0.
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!shouldAnimate || prefersReducedMotion) {
    return (
      <span className="tabular-nums transition-opacity duration-300 ease-out">
        {`${prefix}${Math.round(value).toLocaleString()}${suffix}`}
      </span>
    );
  }

  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const target = Math.round(value);

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    setDisplay(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  return (
    <span className="tabular-nums transition-opacity duration-300 ease-out">
      {`${prefix}${display.toLocaleString()}${suffix}`}
    </span>
  );
}
