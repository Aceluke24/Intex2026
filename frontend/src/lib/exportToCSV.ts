import { apiFetch } from "@/lib/apiFetch";

function parseFilenameFromContentDisposition(header: string | null): string | undefined {
  if (!header) return undefined;
  const star = /filename\*=(?:UTF-8''|)([^;\n]+)/i.exec(header);
  if (star) {
    const raw = star[1].trim().replace(/^"+|"+$/g, "");
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  const quoted = /filename="([^"]+)"/i.exec(header);
  if (quoted) return quoted[1].trim();
  const plain = /filename=([^;\s]+)/i.exec(header);
  return plain?.[1]?.trim();
}

/**
 * GETs a CSV export (authenticated like other dashboard calls), then triggers a file download.
 * Omits query params that are empty, null, or the literal "All".
 */
export async function exportToCSV(
  endpoint: string,
  params: Record<string, string | number | boolean | null | undefined> = {},
  options?: { defaultFilename?: string }
): Promise<void> {
  const search = new URLSearchParams();
  for (const [key, raw] of Object.entries(params)) {
    if (raw === undefined || raw === null) continue;
    const s = String(raw).trim();
    if (s === "" || s === "All") continue;
    search.set(key, s);
  }
  const qs = search.toString();
  const path = qs ? `${endpoint}?${qs}` : endpoint;

  const res = await apiFetch(path, { method: "GET" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.trim().slice(0, 400) || `Export failed (${res.status})`);
  }

  const blob = await res.blob();
  const filename =
    parseFilenameFromContentDisposition(res.headers.get("Content-Disposition")) ??
    options?.defaultFilename ??
    "export.csv";

  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
