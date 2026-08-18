import instance from "axios";
import { NextRequest, NextResponse } from "next/server";

import { deleteSession, getSession, updateSession } from "@/actions/session-action";
import {
  appendSsoTicket,
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
  const isAuthorizeRequest = Boolean(redirect && isSsoClientId(clientId));

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
    return redirectToOriginApp(appendSsoTicket(redirect, response.data.ticket));
  } catch (error: any) {
    if (error.response?.status === 401) return await refreshThenHandoff({ request, redirect, queryDeviceId });
    return new NextResponse("Single Sign-On handshake failed", { status: error.response?.status || 500 });
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

    return redirectToOriginApp(appendSsoTicket(redirect, retryResponse.data.ticket));
  } catch {
    await deleteSession();
    return redirectToSignin(request);
  }
};

const redirectToOriginApp = (callbackUrl: string) => {
  if (isWebCallback(callbackUrl)) {
    return new NextResponse(null, { status: 302, headers: { Location: callbackUrl } });
  }

  return new NextResponse(ssoCallbackHtml(callbackUrl), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};

const redirectToSignin = async (request: NextRequest) => {
  await updateSession({ ssoReturnTo: request.nextUrl.pathname + request.nextUrl.search });
  const loginUrl = createAppUrl(request, "/signin");
  loginUrl.searchParams.set("returnTo", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
};
