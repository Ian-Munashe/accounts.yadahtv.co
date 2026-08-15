const isAuthorizePath = (value: string): boolean => value.startsWith("/sso/authorize");

export const originCallbackFromReturnTo = (returnTo: string): string | undefined => {
  try {
    let current = returnTo;
    for (let i = 0; i < 6; i++) {
      const url = new URL(current, "http://local.invalid");
      const redirect = url.searchParams.get("redirect");
      if (!redirect) return undefined;
      if (isAuthorizePath(redirect) || redirect.includes("/sso/authorize?")) {
        current = redirect;
        continue;
      }
      return redirect;
    }
  } catch {
    return undefined;
  }
  return undefined;
};

export const authPathWithReturnTo = (path: "/signin" | "/join", returnTo?: string | null): string => {
  if (!returnTo) return path;
  const url = new URL(path, "http://local.invalid");
  url.searchParams.set("returnTo", returnTo);
  return `${url.pathname}?${url.searchParams.toString()}`;
};

export const ssoResumePath = (returnTo: string): string =>
  isAuthorizePath(returnTo) ? returnTo : `/sso/authorize?redirect=${encodeURIComponent(returnTo)}`;

export const ssoResumeTarget = (
  returnToFromQuery?: string | null,
  ssoReturnToFromSession?: string | null,
): string | undefined => returnToFromQuery || ssoReturnToFromSession || undefined;

export const destinationAfterAuth = (returnTo?: string | null): string => (returnTo ? ssoResumePath(returnTo) : "/");

export const destinationAfterLogout = (returnTo?: string | null): string => {
  if (!returnTo) return "/signin";
  return originCallbackFromReturnTo(returnTo) || "/signin";
};

export const resumeAfterAuth = (returnTo?: string | null): void => {
  window.location.href = destinationAfterAuth(returnTo);
};

export const resumeAfterLogout = (returnTo?: string | null): void => {
  window.location.href = destinationAfterLogout(returnTo);
};
