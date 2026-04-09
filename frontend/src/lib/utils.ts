import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Title-cases a display name for UI only; does not mutate stored values. */
export function toTitleCase(name: string | null | undefined): string {
  if (name == null) return "";
  const trimmed = name.trim();
  if (trimmed === "") return "";
  return trimmed
    .split(/\s+/)
    .map((word) =>
      word.length === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(" ");
}
