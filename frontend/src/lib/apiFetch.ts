import { API_PREFIX, apiUrl } from "@/lib/apiBase";

type ApiFetchInit = RequestInit & {
  timeoutMs?: number;
};

function getBearerToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("nss_access_token");
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

  if (res.status === 401 || res.status === 403) {
    void clearSessionAndRedirectLogin();
  }

  return res;
}

export async function apiFetchJson<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text.slice(0, 200)}` : ""}`);
  }
  return res.json() as Promise<T>;
}
