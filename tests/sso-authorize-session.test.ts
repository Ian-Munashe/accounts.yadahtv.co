import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

const session = vi.hoisted(() => ({
  getSession: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
}));

const api = vi.hoisted(() => ({
  post: vi.fn(),
  put: vi.fn(),
}));

vi.mock("@/actions/session-action", () => session);
vi.mock("axios", () => ({
  default: { create: () => ({ post: api.post, put: api.put }) },
}));

const authorizeUrl =
  "http://localhost:3001/sso/authorize?redirect=https%3A%2F%2Fyb.example%2Fsso%2Fcallback&clientId=yb&deviceId=device-1";

const accessToken = `hdr.${Buffer.from(JSON.stringify({ userId: "u1", deviceId: "session-device" })).toString("base64url")}.sig`;

describe("authorize route SSO session handling", () => {
  beforeEach(() => {
    vi.stubEnv("SSO_CALLBACK_ORIGINS", "https://yb.example");
    vi.stubEnv("SSO_ALLOW_ANY_CALLBACK", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:4000/1");
    session.getSession.mockReset();
    session.updateSession.mockReset();
    session.deleteSession.mockReset();
    api.post.mockReset();
    api.put.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("an unauthenticated SSO bounce does not persist ssoReturnTo", async () => {
    session.getSession.mockResolvedValue({});
    const { GET } = await import("@/app/(authentication)/sso/authorize/route");

    const response = await GET(new NextRequest(authorizeUrl));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/signin");
    // A stale ssoReturnTo is what let a later, direct signup resume this abandoned SSO.
    expect(session.updateSession).not.toHaveBeenCalled();
  });

  test("issuing a ticket persists ssoReturnTo so logout can return to the origin app", async () => {
    session.getSession.mockResolvedValue({ accessToken, refreshToken: "refresh-1", user: { id: "u1" } });
    api.post.mockResolvedValue({ data: { ticket: "ticket-1" } });
    const { GET } = await import("@/app/(authentication)/sso/authorize/route");

    const response = await GET(new NextRequest(authorizeUrl));

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toContain("t=ticket-1");
    expect(session.updateSession).toHaveBeenCalledWith({
      ssoReturnTo: expect.stringContaining("/sso/authorize"),
      ssoOrigin: true,
    });
  });
});
