import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const session = request.cookies.get("session")?.value;

  // 1. EXCLUSIONS: Immediately bypass Next.js internals, static files, and images
  // This prevents the 'callbackUrl' issues in your logs and improves performance.
  if (
    path.startsWith('/_next') || 
    path.startsWith('/api') || 
    path.startsWith('/favicon.ico') ||
    path.includes('.') // Handles .css, .js, .png, etc.
  ) {
    return NextResponse.next();
  }

  // 2. DEFINE PUBLIC PATHS
  // These are accessible to everyone regardless of session status.
  const isPublicPath = 
    path === "/" || 
    path === "/login" || 
    path === "/sign-up" || 
    path.startsWith("/invite/");

  /**
   * 3. AUTHENTICATED REDIRECT
   * If a user has an active session and tries to access Login or Sign Up,
   * bounce them back to the landing page/dashboard.
   */
  if (session && (path === "/login" || path === "/sign-up")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  /**
   * 4. PROTECTED PATHS
   * If a user is not logged in and attempts to access a private route 
   * (like /savings-projection or /group-settings), send them to login.
   */
  if (!isPublicPath && !session) {
    const searchParams = new URLSearchParams(request.nextUrl.search);
    const callbackUrl = path + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, request.url)
    );
  }

  return NextResponse.next();
}

/**
 * 5. MATCHER CONFIGURATION
 * This ensures the middleware only runs on relevant page routes.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};