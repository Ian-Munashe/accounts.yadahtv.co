const FIRST_PARTY_HOP_CLIENTS = new Set(["yb", "theview"]);

/**
 * Callback origins (web) and schemes (native) that may receive an SSO ticket.
 *
 * A ticket is a 60s credential exchangeable for a full session, so redirect
 * targets must be allowlisted. Configure with SSO_CALLBACK_ORIGINS (comma-separated
 * https origins) and SSO_CALLBACK_SCHEMES (comma-separated native schemes).
 */
const DEFAULT_CALLBACK_SCHEMES = ["theviewyadahtvco"];

const configuredCallbackOrigins = (): string[] =>
  String(process.env.SSO_CALLBACK_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      try {
        return new URL(origin).origin;
      } catch {
        return origin.replace(/\/+$/, "");
      }
    });

const configuredCallbackSchemes = (): string[] => {
  const configured = String(process.env.SSO_CALLBACK_SCHEMES ?? "")
    .split(",")
    .map((scheme) => scheme.trim().replace(/:$/, "").toLowerCase())
    .filter(Boolean);
  return configured.length > 0 ? configured : DEFAULT_CALLBACK_SCHEMES;
};

/** Dev-only escape hatch; never rely on this in production. */
const allowAnyCallback = (): boolean => process.env.SSO_ALLOW_ANY_CALLBACK === "true";

/**
 * True when `redirect` is a callback this deployment is willing to hand a ticket to.
 * Web callbacks must match an allowlisted origin; native callbacks must use an
 * allowlisted custom scheme. Anything else (unknown origin, scheme, or unparseable
 * value) is rejected rather than reflected.
 */
export const isAllowedSsoCallback = (redirect?: string | null): boolean => {
  if (!redirect?.trim()) return false;
  if (allowAnyCallback()) return true;

  const value = redirect.trim();

  try {
    const url = new URL(value);

    if (url.protocol === "http:" || url.protocol === "https:") {
      const allowed = configuredCallbackOrigins();
      return allowed.includes(url.origin);
    }

    const scheme = url.protocol.replace(/:$/, "").toLowerCase();
    return configuredCallbackSchemes().includes(scheme);
  } catch {
    return false;
  }
};

const isAuthorizeValue = (value: string): boolean =>
  value.startsWith("/sso/authorize") || value.includes("/sso/authorize?");

export interface SsoAuthorizeParams {
  redirect: string | null;
  deviceId: string | null;
  clientId: string | null;
}

export const isSsoClientId = (clientId?: string | null): boolean =>
  Boolean(clientId && FIRST_PARTY_HOP_CLIENTS.has(clientId.trim().toLowerCase()));

/** Prefer the client install id from authorize; fall back to the Accounts session JWT. */
export const ticketDeviceId = (queryDeviceId: string | null, accessToken: string): string | null =>
  (queryDeviceId && queryDeviceId.trim()) || sessionDeviceIdFromAccessToken(accessToken);

export const sessionDeviceIdFromAccessToken = (accessToken: string): string | null => {
  const parts = accessToken.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as { deviceId?: unknown };
    return typeof payload.deviceId === "string" && payload.deviceId ? payload.deviceId : null;
  } catch {
    return null;
  }
};

export const parseSsoAuthorizeParams = (searchParams: URLSearchParams, baseOrigin: string): SsoAuthorizeParams => {
  let redirect = searchParams.get("redirect");
  let deviceId = searchParams.get("deviceId");
  let clientId = searchParams.get("clientId");
  const base = `${baseOrigin.replace(/\/+$/, "")}/`;

  let current = redirect;
  for (let i = 0; i < 6 && current; i++) {
    if (deviceId && clientId && !isAuthorizeValue(current)) break;
    try {
      const nestedUrl = new URL(current, base);
      deviceId = deviceId || nestedUrl.searchParams.get("deviceId");
      clientId = clientId || nestedUrl.searchParams.get("clientId");
      const nestedRedirect = nestedUrl.searchParams.get("redirect");
      if (!nestedRedirect) break;
      current = nestedRedirect;
      redirect = nestedRedirect;
    } catch {
      break;
    }
  }

  return { redirect, deviceId, clientId };
};

export const appendSsoTicket = (redirect: string, ticket: string): string => {
  try {
    const url = new URL(redirect);
    url.searchParams.set("t", ticket);
    return url.toString();
  } catch {
    const hashIndex = redirect.indexOf("#");
    const base = hashIndex === -1 ? redirect : redirect.slice(0, hashIndex);
    const hash = hashIndex === -1 ? "" : redirect.slice(hashIndex);
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}t=${encodeURIComponent(ticket)}${hash}`;
  }
};

export const isWebCallback = (url: string): boolean => {
  try {
    const protocol = new URL(url).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};

const escapeHtmlAttribute = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const ssoCallbackHtml = (callbackUrl: string): string => {
  const safeHref = escapeHtmlAttribute(callbackUrl);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Returning to the app</title>
    <script>location.href = ${JSON.stringify(callbackUrl)};</script>
  </head>
  <body style="font-family:system-ui,sans-serif;background:#0a0a0a;color:#fafafa;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0">
    <p>Returning to the app… <a href="${safeHref}" style="color:#e40816">Tap here if nothing happens</a></p>
  </body>
</html>`;
};
