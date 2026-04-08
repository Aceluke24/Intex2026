type Props = {
  value: number | null | undefined;
  suffix?: string;
  prefix?: string;
  fallback?: string;
  /** Kept for API compatibility; count-up can be re-added without breaking callers */
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
}: Props) {
  if (value === null || value === undefined) {
    return <span>{fallback}</span>;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return <span>{fallback}</span>;
  }
  return (
    <span className="tabular-nums transition-opacity duration-300 ease-out">
      {`${prefix}${Math.round(value).toLocaleString()}${suffix}`}
    </span>
  );
}
