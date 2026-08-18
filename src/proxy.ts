import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSession } from "./actions/session-action";
import { createAppUrl } from "@/lib/request-url";
import { ssoResumePath, ssoResumeTarget, shouldRedirectAuthenticatedGuest } from "@/lib/sso-return";

const guestRoutes = ["/signin", "/join"];
const superadminRoutes = ["/applications"];
const protectedRoutes = ["/", "/profile", "/devices", "/users", "/applications"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);

  const session = await getSession();
  const isAuthenticated = session?.accessToken && session?.refreshToken && session?.user;

  const isGuestRoute = guestRoutes.some((route) => pathname.startsWith(route));
  if (isGuestRoute) {
    if (isAuthenticated && shouldRedirectAuthenticatedGuest(request.method, request.headers)) {
      const resumeTo = ssoResumeTarget(request.nextUrl.searchParams.get("returnTo"), session.ssoReturnTo);
      if (resumeTo) return NextResponse.redirect(createAppUrl(request, ssoResumePath(resumeTo)), 303);
      return NextResponse.redirect(createAppUrl(request, "/"), 303);
    }
    return NextResponse.next();
  }

  const isProtected = protectedRoutes.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname.startsWith(route);
  });

  if (isProtected) {
    if (!isAuthenticated) return NextResponse.redirect(createAppUrl(request, "/signin"));

    const userRole = session.user?.role;
    const isSuperadminRoute = superadminRoutes.some((route) => pathname.startsWith(route));
    if (isSuperadminRoute && userRole !== "superadmin") return NextResponse.redirect(createAppUrl(request, "/"));

    if (pathname.startsWith("/users")) {
      const isAllowedRole = userRole === "superadmin" || userRole === "admin";
      if (!isAllowedRole) return NextResponse.redirect(createAppUrl(request, "/"));
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};