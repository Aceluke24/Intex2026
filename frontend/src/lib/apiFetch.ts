import { API_PREFIX, apiUrl } from "@/lib/apiBase";

type ApiFetchInit = RequestInit & {
  timeoutMs?: number;
};

export class ApiHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    message: string
  ) {
    super(message);
    this.name = "ApiHttpError";
  }
}

type AuthDebugInfo = {
  hasToken: boolean;
  tokenPreview: string;
  credentials: RequestCredentials;
  headers: Record<string, string>;
};

function getStorageToken(key: string): string | null {
  if (typeof window === "undefined") return null;
  const localValue = window.localStorage.getItem(key);
  if (localValue) return localValue;
  return window.sessionStorage.getItem(key);
}

function getCookieToken(): string | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie;
  if (!raw) return null;
  const cookies = raw.split(";").map((part) => part.trim());
  const tokenCookie = cookies.find(
    (entry) =>
      entry.startsWith("nss_access_token=") ||
      entry.startsWith("access_token=") ||
      entry.startsWith("token=")
  );
  if (!tokenCookie) return null;
  const value = tokenCookie.split("=").slice(1).join("=");
  return value ? decodeURIComponent(value) : null;
}

function isJwtExpired(token: string): boolean {
  const parts = token.split(".");
  if (parts.length < 2) return false;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    const exp = Number(payload.exp);
    if (!Number.isFinite(exp)) return false;
    return exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

function getBearerToken(): string | null {
  const candidates = [
    getStorageToken("nss_access_token"),
    getStorageToken("access_token"),
    getStorageToken("token"),
    getCookieToken(),
  ];
  for (const token of candidates) {
    if (!token) continue;
    if (isJwtExpired(token)) continue;
    return token;
  }
  return null;
}

function maskToken(token: string | null): string {
  if (!token) return "(none)";
  if (token.length <= 10) return `${token.slice(0, 2)}***`;
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

function shouldRedirectOnUnauthorized(path: string): boolean {
  return !(
    path.includes("/auth/login") ||
    path.includes("/auth/register") ||
    path.includes("/auth/providers") ||
    path.includes("/auth/external-login")
  );
}

function toDebugHeaders(headers: Headers): Record<string, string> {
  const debugHeaders: Record<string, string> = {};
  headers.forEach((value, key) => {
    if (key.toLowerCase() === "authorization") {
      debugHeaders[key] = value.startsWith("Bearer ")
        ? `Bearer ${maskToken(value.slice("Bearer ".length))}`
        : "(redacted)";
      return;
    }
    debugHeaders[key] = value;
  });
  return debugHeaders;
}

function logRequestDebug(path: string, requestUrl: string, info: AuthDebugInfo): void {
  console.info("[apiFetch] request", {
    path,
    requestUrl,
    hasToken: info.hasToken,
    tokenPreview: info.tokenPreview,
    credentials: info.credentials,
    headers: info.headers,
  });
}

async function clearSessionAndRedirectLogin(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch(apiUrl(`${API_PREFIX}/auth/logout`), {
      method: "POST",
      credentials: "include",
    });
  } catch {
    /* ignore */
  }
  window.location.assign("/login");
}

/** Cookie session (same as dashboard) + optional Bearer if `nss_access_token` is set. */
export async function apiFetch(path: string, init: ApiFetchInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getBearerToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const timeoutMs = init.timeoutMs ?? 20000;
  const combinedController = new AbortController();
  const timeoutId = globalThis.setTimeout(
    () => combinedController.abort(`Request timed out after ${timeoutMs}ms`),
    timeoutMs
  );
  const externalAbortListener = () => combinedController.abort(init.signal?.reason ?? "Request was aborted.");
  init.signal?.addEventListener("abort", externalAbortListener, { once: true });

  const requestUrl = apiUrl(path);
  logRequestDebug(path, requestUrl, {
    hasToken: Boolean(token),
    tokenPreview: maskToken(token),
    credentials: "include",
    headers: toDebugHeaders(headers),
  });

  let res: Response;
  try {
    res = await fetch(requestUrl, {
      ...init,
      credentials: "include",
      headers,
      signal: combinedController.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      const reason = String(combinedController.signal.reason ?? "");
      if (reason.includes("timed out")) {
        throw new Error(`Request failed for ${requestUrl}: timed out after ${timeoutMs}ms.`);
      }
      throw new Error(`Request aborted for ${requestUrl}.`);
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
    init.signal?.removeEventListener("abort", externalAbortListener);
  }

  console.info("[apiFetch] response", { path, requestUrl, status: res.status, ok: res.ok });

  if (res.status === 401 || res.status === 403) {
    if (shouldRedirectOnUnauthorized(path)) {
      void clearSessionAndRedirectLogin();
    }
  }

  return res;
}

export async function apiFetchJson<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    const text = await res.text();
    throw new ApiHttpError(
      res.status,
      res.statusText,
      `${res.status} ${res.statusText}${text ? `: ${text.slice(0, 200)}` : ""}`
    );
  }
  return res.json() as Promise<T>;
}
