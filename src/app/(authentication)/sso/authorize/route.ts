import instance from "axios";
import { NextRequest, NextResponse } from "next/server";

import { deleteSession, getSession, updateSession } from "@/actions/session-action";
import {
  appendSsoTicket,
  isAllowedSsoCallback,
  isSsoClientId,
  isWebCallback,
  parseSsoAuthorizeParams,
  ssoCallbackHtml,
  ticketDeviceId,
} from "@/lib/sso-authorize";
import { createAppUrl, getPublicOrigin } from "@/lib/request-url";

const axios = instance.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

const authorize = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const { redirect, deviceId, clientId } = parseSsoAuthorizeParams(searchParams, getPublicOrigin(request));
  const session = await getSession();
  const isAuthenticated = Boolean(session.accessToken && session.refreshToken && session.user);
  const isClientRequest = isSsoClientId(clientId);
  const isAuthorizeRequest = Boolean(redirect && isClientRequest && isAllowedSsoCallback(redirect));

  if (isClientRequest && !isAuthorizeRequest) {
    // A known client must name an allowlisted `redirect` callback. Without one there is no
    // way to return the user, so refuse instead of silently stranding them on the Account
    // Center with a plain sign-in.
    return new NextResponse("Single Sign-On requires an allowlisted redirect callback", { status: 400 });
  }

  if (!isAuthorizeRequest) {
    if (isAuthenticated) return NextResponse.redirect(createAppUrl(request, "/"));
    return NextResponse.redirect(createAppUrl(request, "/signin"));
  }

  if (!isAuthenticated) return redirectToSignin(request);

  return issueTicketAndHandoff({
    request,
    accessToken: session.accessToken!,
    redirect: redirect!,
    queryDeviceId: deviceId,
  });
};

export const GET = authorize;
/** Next.js resumes after server actions with POST; without this the native WebView gets 405. */
export const POST = authorize;

interface IssueTicketParams {
  request: NextRequest;
  accessToken: string;
  redirect: string;
  queryDeviceId: string | null;
}

const issueTicketAndHandoff = async ({ request, accessToken, redirect, queryDeviceId }: IssueTicketParams) => {
  const deviceId = ticketDeviceId(queryDeviceId, accessToken);
  if (!deviceId) return new NextResponse("Single Sign-On handshake failed", { status: 500 });

  const headers = { Authorization: `Bearer ${accessToken}` };
  try {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/sso/ticket`, { deviceId }, { headers });
    return completeSsoHandoff(redirect, response.data.ticket);
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response?.status;
    if (status === 401) return await refreshThenHandoff({ request, redirect, queryDeviceId });
    return new NextResponse("Single Sign-On handshake failed", { status: status || 500 });
  }
};

const refreshThenHandoff = async ({
  request,
  redirect,
  queryDeviceId,
}: {
  request: NextRequest;
  redirect: string;
  queryDeviceId: string | null;
}) => {
  const session = await getSession();
  try {
    const response = await axios.put(
      `${process.env.NEXT_PUBLIC_API_URL}/user/refresh-token`,
      { refreshToken: session.refreshToken },
      { headers: { Authorization: `Bearer ${session.accessToken}` } },
    );

    const { accessToken, refreshToken: newRefreshToken } = response.data;
    await updateSession({ accessToken, refreshToken: newRefreshToken || session.refreshToken });

    const deviceId = ticketDeviceId(queryDeviceId, accessToken);
    if (!deviceId) return new NextResponse("Single Sign-On handshake failed", { status: 500 });

    const retryResponse = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/sso/ticket`,
      { deviceId },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    return completeSsoHandoff(redirect, retryResponse.data.ticket);
  } catch {
    await deleteSession();
    return redirectToSignin(request);
  }
};

/**
 * A completed handshake hands the ticket straight back to the origin app. Origin state is
 * never persisted on the session; logout decides its destination from a live returnTo.
 */
const completeSsoHandoff = (callbackUrl: string, ticket: string) =>
  redirectToOriginApp(appendSsoTicket(callbackUrl, ticket));

const redirectToOriginApp = (callbackUrl: string) => {
  if (isWebCallback(callbackUrl)) {
    return new NextResponse(null, { status: 302, headers: { Location: callbackUrl } });
  }

  return new NextResponse(ssoCallbackHtml(callbackUrl), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};

const redirectToSignin = (request: NextRequest) => {
  const loginUrl = createAppUrl(request, "/signin");
  loginUrl.searchParams.set("returnTo", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
};
