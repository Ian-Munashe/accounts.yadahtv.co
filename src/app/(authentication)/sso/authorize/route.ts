import instance from "axios";
import { getSession } from "@/actions/session-action";
import { NextRequest, NextResponse } from "next/server";

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
        return new NextResponse("Single Sign-On handshake failed", { status: 500 });
      }
    }
    const loginUrl = new URL("/signin", request.url);
    loginUrl.searchParams.set("returnTo", redirect);
    return NextResponse.redirect(loginUrl);
  }
  return new NextResponse("Missing redirect parameter", { status: 400 });
}
