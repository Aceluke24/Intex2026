const LOGIN_REDIRECT_KEY = "loginRedirect";

const RESERVED_AUTH_PATHS = new Set(["/login", "/signup", "/google-callback", "/logout"]);

export function setLoginRedirect(pathname: string): void {
  if (!pathname || RESERVED_AUTH_PATHS.has(pathname)) {
    return;
  }
  localStorage.setItem(LOGIN_REDIRECT_KEY, pathname);
}

export function clearLoginRedirect(): void {
  localStorage.removeItem(LOGIN_REDIRECT_KEY);
}

export function getLoginRedirect(): string | null {
  return localStorage.getItem(LOGIN_REDIRECT_KEY);
}

export function resolvePostLoginPath(roles: string[] | undefined, redirect: string | null): string {
  if (redirect === "/donate") {
    return "/donate";
  }

  const normalizedRoles = (roles ?? []).map((r) => r.toLowerCase());
  if (normalizedRoles.includes("admin")) {
    return "/dashboard/programs";
  }
  if (normalizedRoles.includes("donor")) {
    return "/donor-dashboard";
  }
  return "/";
}
