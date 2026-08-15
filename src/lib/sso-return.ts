export const authPathWithReturnTo = (path: "/signin" | "/join", returnTo?: string | null): string => {
  if (!returnTo) return path;
  const url = new URL(path, "http://local.invalid");
  url.searchParams.set("returnTo", returnTo);
  return `${url.pathname}?${url.searchParams.toString()}`;
};

export const ssoResumePath = (returnTo: string): string => `/sso/authorize?redirect=${encodeURIComponent(returnTo)}`;

export const ssoResumeTarget = (
  returnToFromQuery?: string | null,
  ssoReturnToFromSession?: string | null,
): string | undefined => returnToFromQuery || ssoReturnToFromSession || undefined;

export const destinationAfterAuth = (returnTo?: string | null): string => (returnTo ? ssoResumePath(returnTo) : "/");

export const destinationAfterLogout = (returnTo?: string | null): string =>
  returnTo ? ssoResumePath(returnTo) : "/signin";

export const resumeAfterAuth = (returnTo?: string | null): void => {
  window.location.href = destinationAfterAuth(returnTo);
};

export const resumeAfterLogout = (returnTo?: string | null): void => {
  window.location.href = destinationAfterLogout(returnTo);
};
