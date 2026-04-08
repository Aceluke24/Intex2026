/** Backend origin without trailing slash. Set VITE_API_BASE_URL in env files. */
function normalizeBase(raw: string): string {
  const trimmed = String(raw ?? "").trim().replace(/\/$/, "");
  return trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed;
}

const configuredBase = normalizeBase(import.meta.env.VITE_API_BASE_URL ?? "");
const deployedFallbackBase = normalizeBase(import.meta.env.VITE_PROD_API_BASE_URL ?? "");

const isBrowser = typeof window !== "undefined";
const isHostedEnvironment =
	isBrowser &&
	window.location.hostname !== "localhost" &&
	window.location.hostname !== "127.0.0.1";

const pointsToLocalhost = /localhost|127\.0\.0\.1/i.test(configuredBase);

// Guard against shipping localhost API base in production builds.
export const API_BASE =
  isHostedEnvironment && pointsToLocalhost
    ? deployedFallbackBase
    : configuredBase || (isHostedEnvironment ? deployedFallbackBase : "");
export const API_PREFIX = "/api";

if (typeof window !== "undefined") {
  // Deployment visibility for "frontend -> backend" routing validation.
  console.log("API BASE:", API_BASE || "(same-origin)");
}

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${p}` : p;
}
