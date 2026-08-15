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
  test("matches the existing sign-in resume URL shape", () => {
    expect(ssoResumePath(returnTo)).toBe(`/sso/authorize?redirect=${encodeURIComponent(returnTo)}`);
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
  test("resumes SSO when returnTo is set", () => {
    expect(destinationAfterLogout(returnTo)).toBe(ssoResumePath(returnTo));
  });

  test("goes to sign-in when returnTo is missing", () => {
    expect(destinationAfterLogout(undefined)).toBe("/signin");
  });
});
