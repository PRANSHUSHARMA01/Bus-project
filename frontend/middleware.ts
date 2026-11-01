import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin and conductor routes
  const isProtected = pathname.startsWith("/admin") || pathname.startsWith("/conductor");
  if (isProtected) {
    const hasToken =
      request.cookies.has("sb-access-token") ||
      request.cookies.has("smart_bus_token") ||
      request.cookies.getAll().some((c) => c.name.startsWith("sb-"));

    if (!hasToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/conductor/:path*"],
};
