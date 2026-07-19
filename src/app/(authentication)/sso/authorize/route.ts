import instance from "axios";
import { getSession } from "@/actions/session-action";
import { NextRequest, NextResponse } from "next/server";

const axios = instance.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

/**
 * Handles GET requests for SSO authorization.
 * 
 * - If a "redirect" query parameter is present, attempts to retrieve the user session and, if valid, requests an SSO ticket from the backend.
 * - Redirects to the provided redirect URL with the SSO ticket on success.
 * - If the session is invalid or missing, redirects to the signin page with a returnTo parameter set.
 * - Returns a 400 error if "redirect" is missing.
 * 
 * @param {NextRequest} request - The incoming Next.js request object.
 * @returns {Promise<NextResponse>} A response redirecting the user or an error response.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get("redirect");

  if (redirect) {
    const session = await getSession();
    if (session.accessToken && session.refreshToken && session.user) {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/sso/ticket`,
          {},
          { headers: { Authorization: `Bearer ${session.accessToken}` } },
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
