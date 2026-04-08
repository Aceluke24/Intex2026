import { API_PREFIX, apiUrl } from "@/lib/apiBase";

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
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getBearerToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    headers,
  });

  if (res.status === 401 || res.status === 403) {
    void clearSessionAndRedirectLogin();
  }

  return res;
}

export async function apiFetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text.slice(0, 200)}` : ""}`);
  }
  return res.json() as Promise<T>;
}
