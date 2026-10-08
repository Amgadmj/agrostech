import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and internal next requests pass through (C07: no broad dot skipping)
  const isStaticFile = /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|glb|map)$/i.test(pathname);
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    isStaticFile
  ) {
    return NextResponse.next();
  }

  // Update Supabase session cookies and get verified user
  const { response, user } = await updateSession(request);

  // Demo cookie gated strictly behind demo mode configuration
  const isDemoAllowed =
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    process.env.INTEGRITY_MODE === "demo";
  const demoRole = isDemoAllowed
    ? request.cookies.get("agrostech_demo_role")?.value
    : null;

  const isAuthenticated = Boolean(user) || Boolean(demoRole);

  // 1. Guard API Routes: unauthenticated requests must return 401
  if (pathname.startsWith("/api/")) {
    if (!isAuthenticated) {
      return NextResponse.json(
        {
          success: false,
          error: "Acesso não autorizado. Autenticação obrigatória.",
        },
        { status: 401 }
      );
    }
    return response;
  }

  // 2. Guard Dashboard Routes: unauthenticated requests redirect to /login
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
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
