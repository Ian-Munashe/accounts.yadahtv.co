import { describe, expect, test } from "bun:test";

import {
  authPathWithReturnTo,
  destinationAfterAuth,
  destinationAfterLogout,
  ssoResumePath,
  ssoResumeTarget,
} from "./sso-return";

const returnTo = "/sso/authorize?redirect=https://app.example/cb&deviceId=d1&clientId=c1";

describe("authPathWithReturnTo", () => {
  test("returns the path unchanged when returnTo is missing", () => {
    expect(authPathWithReturnTo("/join")).toBe("/join");
    expect(authPathWithReturnTo("/signin", null)).toBe("/signin");
  });

  test("appends encoded returnTo", () => {
    expect(authPathWithReturnTo("/join", returnTo)).toBe(`/join?returnTo=${encodeURIComponent(returnTo)}`);
  });
});

describe("ssoResumePath", () => {
  test("does not wrap a path that is already /sso/authorize", () => {
    expect(ssoResumePath(returnTo)).toBe(returnTo);
  });

  test("wraps a raw origin callback as redirect", () => {
    expect(ssoResumePath("https://app.example/cb")).toBe(`/sso/authorize?redirect=${encodeURIComponent("https://app.example/cb")}`);
  });
});

describe("ssoResumeTarget", () => {
  test("prefers the query value over the session value", () => {
    expect(ssoResumeTarget(returnTo, "/sso/authorize?redirect=other")).toBe(returnTo);
  });

  test("falls back to the session value", () => {
    expect(ssoResumeTarget(null, returnTo)).toBe(returnTo);
  });

  test("returns undefined when neither is set", () => {
    expect(ssoResumeTarget(null, undefined)).toBeUndefined();
  });
});

describe("destinationAfterAuth", () => {
  test("resumes SSO when returnTo is set", () => {
    expect(destinationAfterAuth(returnTo)).toBe(ssoResumePath(returnTo));
  });

  test("goes to the dashboard when returnTo is missing", () => {
    expect(destinationAfterAuth(null)).toBe("/");
  });
});

describe("destinationAfterLogout", () => {
  const viewReturnTo =
    "/sso/authorize?deviceId=SM-M326B-977d93d4b817243e&clientId=theview&redirect=theviewyadahtvco%3A%2F%2Fsso%2Fcallback";

  test("sends the user to the origin app callback", () => {
    expect(destinationAfterLogout(viewReturnTo)).toBe("theviewyadahtvco://sso/callback");
  });

  test("unwraps a double-wrapped authorize returnTo", () => {
    const nested = `/sso/authorize?redirect=${encodeURIComponent(viewReturnTo)}`;
    expect(destinationAfterLogout(nested)).toBe("theviewyadahtvco://sso/callback");
  });

  test("uses an https origin callback", () => {
    expect(destinationAfterLogout(returnTo)).toBe("https://app.example/cb");
  });

  test("goes to sign-in when returnTo is missing", () => {
    expect(destinationAfterLogout(undefined)).toBe("/signin");
  });
});
