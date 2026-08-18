import { describe, expect, test } from "bun:test";

import {
  appendSsoTicket,
  isSsoClientId,
  isWebCallback,
  parseSsoAuthorizeParams,
  sessionDeviceIdFromAccessToken,
  ssoCallbackHtml,
  ticketDeviceId,
} from "@/lib/sso-authorize";

const origin = "https://accounts.yadahtv.co";

describe("parseSsoAuthorizeParams", () => {
  test("reads top-level https callback params from a web device", () => {
    const params = parseSsoAuthorizeParams(
      new URLSearchParams({
        redirect: "https://yb.example/sso",
        deviceId: "browser-uuid-1",
        clientId: "yb",
      }),
      origin,
    );

    expect(params).toEqual({
      redirect: "https://yb.example/sso",
      deviceId: "browser-uuid-1",
      clientId: "yb",
    });
  });

  test("reads a native custom-scheme callback from a phone", () => {
    const params = parseSsoAuthorizeParams(
      new URLSearchParams({
        redirect: "theviewyadahtvco://sso/callback",
        deviceId: "SM-M326B-977d93d4b817243e",
        clientId: "theview",
      }),
      origin,
    );

    expect(params.redirect).toBe("theviewyadahtvco://sso/callback");
    expect(params.deviceId).toBe("SM-M326B-977d93d4b817243e");
    expect(params.clientId).toBe("theview");
  });

  test("unwraps a nested authorize returnTo without dropping clientId", () => {
    const nested =
      "/sso/authorize?redirect=theviewyadahtvco%3A%2F%2Fsso%2Fcallback&deviceId=iPhone14-vendor-id&clientId=theview";
    const params = parseSsoAuthorizeParams(new URLSearchParams({ redirect: nested }), origin);

    expect(params.redirect).toBe("theviewyadahtvco://sso/callback");
    expect(params.deviceId).toBe("iPhone14-vendor-id");
    expect(params.clientId).toBe("theview");
  });
});

describe("isSsoClientId", () => {
  test("allows client apps that authorize here (yb, theview)", () => {
    expect(isSsoClientId("yb")).toBe(true);
    expect(isSsoClientId("theview")).toBe(true);
  });

  test("does not treat accounts or unknown ids as SSO clients", () => {
    expect(isSsoClientId("accounts")).toBe(false);
    expect(isSsoClientId("partner")).toBe(false);
    expect(isSsoClientId(null)).toBe(false);
  });
});

describe("ticketDeviceId", () => {
  const payload = Buffer.from(JSON.stringify({ userId: "u1", deviceId: "sess-device" })).toString("base64url");
  const accessToken = `hdr.${payload}.sig`;

  test("prefers the client deviceId from the authorize query", () => {
    expect(ticketDeviceId("client-device", accessToken)).toBe("client-device");
  });

  test("falls back to the session JWT deviceId", () => {
    expect(ticketDeviceId(null, accessToken)).toBe("sess-device");
  });
});

describe("sessionDeviceIdFromAccessToken", () => {
  test("reads deviceId from the JWT payload", () => {
    const payload = Buffer.from(JSON.stringify({ userId: "u1", deviceId: "sess-device" })).toString("base64url");
    expect(sessionDeviceIdFromAccessToken(`hdr.${payload}.sig`)).toBe("sess-device");
  });

  test("returns null when the token has no deviceId", () => {
    const payload = Buffer.from(JSON.stringify({ userId: "u1" })).toString("base64url");
    expect(sessionDeviceIdFromAccessToken(`hdr.${payload}.sig`)).toBeNull();
  });
});

describe("appendSsoTicket", () => {
  test("appends t= to an https first-party callback", () => {
    expect(appendSsoTicket("https://yb.example/sso", "t1")).toBe("https://yb.example/sso?t=t1");
  });

  test("appends t= to a custom-scheme callback used by native apps", () => {
    expect(appendSsoTicket("theviewyadahtvco://sso/callback", "t1")).toBe("theviewyadahtvco://sso/callback?t=t1");
  });

  test("keeps existing query params on the origin callback", () => {
    expect(appendSsoTicket("theviewyadahtvco://sso/callback?src=android", "t1")).toBe(
      "theviewyadahtvco://sso/callback?src=android&t=t1",
    );
  });
});

describe("isWebCallback", () => {
  test("treats http(s) as a web callback", () => {
    expect(isWebCallback("https://yb.example/sso")).toBe(true);
    expect(isWebCallback("http://localhost:3000/sso")).toBe(true);
  });

  test("treats custom schemes as native-app callbacks", () => {
    expect(isWebCallback("theviewyadahtvco://sso/callback")).toBe(false);
  });
});

describe("ssoCallbackHtml", () => {
  test("navigates to the origin callback and offers a tap fallback", () => {
    const html = ssoCallbackHtml("theviewyadahtvco://sso/callback?t=t1");
    expect(html).toContain("theviewyadahtvco://sso/callback?t=t1");
    expect(html).toContain("location.href");
    expect(html).toContain("Tap here");
  });
});

describe("authorize route methods", () => {
  test("POST is handled the same as GET so post-login resume is not 405", async () => {
    const route = await import("@/app/(authentication)/sso/authorize/route");
    expect(route.POST).toBe(route.GET);
  });
});
