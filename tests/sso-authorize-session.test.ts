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

  test("an unauthenticated SSO bounce does not persist any session state", async () => {
    session.getSession.mockResolvedValue({});
    const { GET } = await import("@/app/(authentication)/sso/authorize/route");

    const response = await GET(new NextRequest(authorizeUrl));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/signin");
    expect(session.updateSession).not.toHaveBeenCalled();
  });

  test("issuing a ticket does not persist logout state on the session", async () => {
    session.getSession.mockResolvedValue({ accessToken, refreshToken: "refresh-1", user: { id: "u1" } });
    api.post.mockResolvedValue({ data: { ticket: "ticket-1" } });
    const { GET } = await import("@/app/(authentication)/sso/authorize/route");

    const response = await GET(new NextRequest(authorizeUrl));

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toContain("t=ticket-1");
    // Logout now reads a live returnTo, so a completed handshake must not leave
    // origin state on the session.
    expect(session.updateSession).not.toHaveBeenCalled();
  });

  test("refuses a known client that requests auth without a redirect callback", async () => {
    session.getSession.mockResolvedValue({});
    const { GET } = await import("@/app/(authentication)/sso/authorize/route");

    const response = await GET(new NextRequest("http://localhost:3001/sso/authorize?clientId=yb&deviceId=device-1"));

    expect(response.status).toBe(400);
    expect(session.updateSession).not.toHaveBeenCalled();
  });

  test("refuses a known client whose redirect callback is not allowlisted", async () => {
    session.getSession.mockResolvedValue({});
    const { GET } = await import("@/app/(authentication)/sso/authorize/route");

    const response = await GET(
      new NextRequest("http://localhost:3001/sso/authorize?clientId=yb&redirect=https%3A%2F%2Fevil.example%2Fsteal"),
    );

    expect(response.status).toBe(400);
  });
});
