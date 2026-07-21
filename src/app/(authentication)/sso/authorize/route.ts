import instance from "axios";
import { NextRequest, NextResponse } from "next/server";

import { deleteSession, getSession, updateSession } from "@/actions/session-action";

const axios = instance.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get("redirect");
  const deviceId = searchParams.get("deviceId");
  const clientId = searchParams.get("clientId");

  if (redirect && deviceId && clientId) {
    const session = await getSession();
    if (session.accessToken && session.refreshToken && session.user) {
      const headers = { Authorization: `Bearer ${session.accessToken}` };
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/sso/ticket`,
          { deviceId, clientId },
          { headers },
        );
        const callbackUrl = new URL(redirect);
        callbackUrl.searchParams.set("ticket", response.data.ticket);
        return NextResponse.redirect(callbackUrl);
      } catch (error: any) {
        if (error.response?.status === 401) return await refreshToken({ request, redirect, deviceId, clientId });
        return new NextResponse("Single Sign-On handshake failed", { status: error.response?.status || 500 });
      }
    }
    return redirectToSignin(request, redirect);
  }
  return new NextResponse("Missing redirect parameter", { status: 400 });
}

interface RefreshTokenParams {
  request: NextRequest;
  redirect: string;
  deviceId: string;
  clientId: string;
}

const refreshToken = async ({ request, redirect, deviceId, clientId }: RefreshTokenParams) => {
  const session = await getSession();
  try {
    const response = await axios.put(
      `${process.env.NEXT_PUBLIC_API_URL}/user/refresh-token`,
      {
        refreshToken: session.refreshToken,
      },
      { headers: { Authorization: `Bearer ${session.accessToken}` } },
    );

    const { accessToken, refreshToken: newRefreshToken } = response.data;
    await updateSession({ accessToken, refreshToken: newRefreshToken || session.refreshToken });

    const retryResponse = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/sso/ticket`,
      { deviceId, clientId },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    const callbackUrl = new URL(redirect);
    callbackUrl.searchParams.set("ticket", retryResponse.data.ticket);
    return NextResponse.redirect(callbackUrl);
  } catch (error: any) {
    await deleteSession();
    return redirectToSignin(request, redirect);
  }
};

const redirectToSignin = (request: NextRequest, redirect: string) => {
  const loginUrl = new URL("/signin", request.url);
  loginUrl.searchParams.set("returnTo", redirect);
  return NextResponse.redirect(loginUrl);
};
