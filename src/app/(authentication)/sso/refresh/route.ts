import instance from "axios";
import { NextRequest, NextResponse } from "next/server";

const axios = instance.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

/**
 * Handles POST requests for SSO token refresh.
 * 
 * - Expects a JSON body containing a valid "refreshToken".
 * - Sends the refresh token to the backend to obtain new access and refresh tokens.
 * - Returns a JSON response with the new tokens on success.
 * - Returns a 400 error if the "refreshToken" is missing.
 * - Returns a 401 error if the token refresh process fails.
 * 
 * @param {NextRequest} request - The incoming Next.js request containing the refresh token in its body.
 * @returns {Promise<NextResponse>} A JSON response with new tokens, or an error response.
 */
export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();
    if (refreshToken) {
      const response = await axios.put("/user/refresh-token", {
        refreshToken: refreshToken,
      });
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      return NextResponse.json({
        accessToken,
        refreshToken: newRefreshToken,
      });
    }

    return new NextResponse("Missing refresh token parameter", { status: 400 });
  } catch (error: any) {
    console.error("Centralized SSO token renewal failed:", error?.response?.data || error.message);
    return new NextResponse("Central token renewal failed", { status: 401 });
  }
}
