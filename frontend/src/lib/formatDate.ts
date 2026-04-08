import { format, isValid } from "date-fns";

/** Avoids throwing when API sends "" or unparsable dates (date-fns format throws on Invalid Date). */
export function formatDateSafe(value: string | undefined | null, fmt: string, fallback = "—"): string {
  if (value == null || String(value).trim() === "") return fallback;
  const d = new Date(value);
  return isValid(d) ? format(d, fmt) : fallback;
}
