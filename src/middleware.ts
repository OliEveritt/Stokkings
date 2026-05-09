import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const session = request.cookies.get("session")?.value;

  const isPublicPath = 
    path === "/login" || 
    path === "/sign-up" || 
    path.startsWith("/invite/");

  // Redirect authenticated users away from login/sign-up to dashboard
  if (session && isPublicPath && !path.startsWith("/invite/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to login
  if (!session && !isPublicPath) {
    const callbackUrl = path + (request.nextUrl.search || "");
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
