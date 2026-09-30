const isAuthorizePath = (value: string): boolean => value.startsWith("/sso/authorize");

const isWebCallback = (value: string): boolean => /^https?:\/\//i.test(value);

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

export const destinationAfterAuth = (returnTo?: string | null): string => (returnTo ? ssoResumePath(returnTo) : "/");

type HeaderReader = { get(name: string): string | null };

/**
 * True only when the browser is actually pointing at an app page.
 *
 * Server-action responses are dispatched from `/signin` (or the app root), not from
 * the route the action is invoked on, so a token refresh that fails during sign-in
 * must not be treated as "the user is already on an SSO page".
 */
export const isOnAppPage = (pathname: string): boolean => {
  if (!pathname.startsWith("/") || pathname.startsWith("//")) return false;
  if (/^\/(?:signin|join)(?:\/|$)/.test(pathname)) return false;
  if (/^\/sso\/authorize(?:\/|$)/.test(pathname)) return false;
  return !/\.(?:[a-z0-9]+)$/i.test(pathname);
};

/** Document GET only. POST (server actions) and RSC refreshes must not receive authorize HTML. */
export const shouldRedirectAuthenticatedGuest = (method: string, headers?: HeaderReader): boolean => {
  if (method.toUpperCase() !== "GET") return false;
  if (headers?.get("rsc") === "1") return false;
  if (headers?.get("next-router-prefetch")) return false;
  if (headers?.get("next-action")) return false;
  return true;
};

const consumeAuthorizeDocument = async (url: string): Promise<void> => {
  const response = await fetch(url, {
    method: "GET",
    redirect: "manual",
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "text/html" },
  });

  const redirectTo = response.headers.get("location");
  if (redirectTo && response.status >= 300 && response.status < 400) {
    window.location.assign(redirectTo);
    return;
  }

  if (!response.ok) {
    throw new Error((await response.text()) || "Single Sign-On handshake failed");
  }

  const html = await response.text();
  document.open();
  document.write(html);
  document.close();
};

export const resumeAfterAuth = async (returnTo?: string | null): Promise<void> => {
  const path = destinationAfterAuth(returnTo);
  const url = new URL(path, window.location.origin).toString();
  if (!isAuthorizePath(path)) {
    window.location.assign(url);
    return;
  }

  const callback = originCallbackFromReturnTo(path);
  if (!callback || isWebCallback(callback)) {
    // A web callback is handed off with a 302. A manual fetch resolves that to an opaque
    // response (no Location, status 0), so navigate instead and let the browser follow it.
    window.location.assign(url);
    return;
  }

  await consumeAuthorizeDocument(url);
};

export const resumeAfterLogout = (destination: string): void => {
  window.location.href = destination;
};
