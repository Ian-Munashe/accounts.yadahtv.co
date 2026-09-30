import { afterEach, describe, expect, test, vi } from "vitest";

import { resolveLogoutDestination } from "@/actions/logout-action";

const authorizeUrl = (redirect: string) =>
  "/sso/authorize?redirect=" + encodeURIComponent(redirect) + "&clientId=yb&deviceId=d1";

const authorizeReturnTo = authorizeUrl("https://app.example/cb");

const allowOnly = (origins: string) => {
  vi.stubEnv("SSO_CALLBACK_ORIGINS", origins);
  vi.stubEnv("SSO_ALLOW_ANY_CALLBACK", "");
};

describe("resolveLogoutDestination", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("returns the allowlisted origin callback from a live authorize returnTo", async () => {
    allowOnly("https://app.example");
    expect(await resolveLogoutDestination(authorizeReturnTo)).toBe("https://app.example/cb");
  });

  test("returns an allowlisted origin callback given directly as returnTo", async () => {
    allowOnly("https://app.example");
    expect(await resolveLogoutDestination("https://app.example/cb")).toBe("https://app.example/cb");
  });

  test("unwraps a double-wrapped authorize returnTo", async () => {
    allowOnly("https://app.example");
    const nested = authorizeUrl(authorizeReturnTo);
    expect(await resolveLogoutDestination(nested)).toBe("https://app.example/cb");
  });

  test("goes to /signin when there is no live returnTo", async () => {
    allowOnly("https://app.example");
    expect(await resolveLogoutDestination(undefined)).toBe("/signin");
    expect(await resolveLogoutDestination(null)).toBe("/signin");
    expect(await resolveLogoutDestination("")).toBe("/signin");
  });

  test("refuses an origin callback that is not allowlisted", async () => {
    allowOnly("https://app.example");
    expect(await resolveLogoutDestination(authorizeUrl("https://evil.example/steal"))).toBe("/signin");
    expect(await resolveLogoutDestination("https://evil.example/steal")).toBe("/signin");
  });

  test("refuses a relative returnTo so logout cannot be bounced onto a same-origin path", async () => {
    allowOnly("https://app.example");
    expect(await resolveLogoutDestination("/profile")).toBe("/signin");
  });
});
