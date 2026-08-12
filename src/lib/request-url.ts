import type { NextRequest } from "next/server";

const UNREACHABLE_HOSTS = new Set(["0.0.0.0", "::", "[::]"]);

const isUnreachableHost = (hostname: string): boolean => UNREACHABLE_HOSTS.has(hostname.toLowerCase());

const getConfiguredOrigin = (): string | undefined => {
  const configured = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!configured) return undefined;

  try {
    const url = new URL(configured);
    if (isUnreachableHost(url.hostname)) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
};

/**
 * Returns the public origin clients can reach for redirects and absolute links.
 * Prefers APP_URL / NEXT_PUBLIC_APP_URL, then the request Host header, never 0.0.0.0.
 */
export const getPublicOrigin = (request: NextRequest): string => {
  const configured = getConfiguredOrigin();
  if (configured) return configured;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost?.split(",")[0]?.trim() || request.headers.get("host");

  if (host) {
    const hostname = host.split(":")[0];
    if (!isUnreachableHost(hostname)) {
      const proto =
        request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
        request.nextUrl.protocol.replace(":", "") ||
        "http";
      return `${proto}://${host}`;
    }
  }

  if (!isUnreachableHost(request.nextUrl.hostname)) {
    return request.nextUrl.origin;
  }

  const port = request.nextUrl.port || process.env.PORT || "3001";
  return `http://localhost:${port}`;
};

/** Builds an absolute in-app URL using the public origin, not the server listen address. */
export const createAppUrl = (request: NextRequest, path: string): URL => new URL(path, `${getPublicOrigin(request)}/`);
