import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and internal next requests pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Update Supabase session cookies
  const response = await updateSession(request);

  // Check for authenticated user or demo session cookie
  const demoRole = request.cookies.get("agrostech_demo_role")?.value;
  const hasSupabaseAuth = request.cookies.getAll().some((c) => c.name.includes("sb-"));

  const isProtectedPath = pathname.startsWith("/dashboard");

  if (isProtectedPath) {
    // If not authenticated and no demo role, redirect to login
    if (!hasSupabaseAuth && !demoRole) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
