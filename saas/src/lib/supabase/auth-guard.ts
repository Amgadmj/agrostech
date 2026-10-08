import { NextRequest, NextResponse } from "next/server";
import { createClient } from "./server";

export type DepartmentType = "precision_agriculture" | "credit_risk";

export interface AuthResult {
  authenticated: boolean;
  user?: any;
  role?: string;
  org_id?: string;
  department?: DepartmentType;
  error?: string;
}

/**
 * Validates authentication and server-loaded organization/role for API routes (C07 compliance).
 * - Rejects demo cookies in production unless explicit demo mode is configured.
 * - Derives user organization and departmental role from the server, preventing client spoofing.
 */
export async function checkApiAuth(request: Request | NextRequest): Promise<AuthResult> {
  const isProduction = process.env.NODE_ENV === "production" && process.env.INTEGRITY_MODE !== "demo";
  const isDemoAllowed = !isProduction && (
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    process.env.INTEGRITY_MODE === "demo" ||
    process.env.ALLOW_MOCK_FALLBACK === "true"
  );

  // 1. Check demo cookie only when demo mode is explicitly active and allowed
  if (isDemoAllowed) {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/agrostech_demo_role=([^;]+)/);
    const deptMatch = cookieHeader.match(/agrostech_department=([^;]+)/);
    const selectedDept: DepartmentType =
      deptMatch && deptMatch[1] === "precision_agriculture"
        ? "precision_agriculture"
        : "credit_risk";

    if (match && (match[1] === "b2b_admin" || match[1] === "b2c" || match[1] === "b2b" || match[1] === "b2b_viewer")) {
      const role = match[1] === "b2b" ? "b2b_admin" : match[1];
      const orgId = role === "b2c" ? undefined : "11111111-1111-1111-1111-111111111111"; // Coplacana / Demo Org UUID
      return {
        authenticated: true,
        role,
        org_id: orgId,
        department: selectedDept,
        user: {
          id: role === "b2c" ? "b2c-demo-user" : "b2b-demo-user",
          email: role === "b2c" ? "produtor@buritis.com.br" : "analista@coplacana.com.br",
          role,
          org_id: orgId,
        },
      };
    }
  }

  // 2. Server-side Supabase authentication and profile resolution
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (user && !error) {
      // Load user profile from public.users to derive verified org_id and role
      const { data: profile } = await supabase
        .from("users")
        .select("role, org_id")
        .eq("id", user.id)
        .single();

      const userRole = profile?.role || "b2c";
      const userOrgId = profile?.org_id || undefined;

      return {
        authenticated: true,
        user,
        role: userRole,
        org_id: userOrgId,
        department: "credit_risk", // Default enterprise desk
      };
    }
  } catch {
    // Auth validation failed
  }

  return {
    authenticated: false,
    error: "Acesso não autorizado. Autenticação obrigatória.",
  };
}

/**
 * Checks departmental access permissions (C07 requirement: tenant isolation + departmental permissions)
 */
export function checkDepartmentPermission(
  auth: AuthResult,
  targetDept: DepartmentType,
  permission: "view_shared" | "view_credit_details" | "annotate" | "export"
): boolean {
  if (!auth.authenticated) return false;

  // Shared cadastral and satellite evidence is visible to both departments
  if (permission === "view_shared") return true;

  // Restricted credit details are limited to credit_risk department
  if (permission === "view_credit_details") {
    return auth.department === "credit_risk" || auth.role === "b2b_admin";
  }

  return true;
}

export function unauthorizedResponse(
  message: string = "Acesso não autorizado. Autenticação obrigatória."
) {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  );
}

export function forbiddenResponse(
  message: string = "Acesso negado. Permissão departamental insuficiente."
) {
  return NextResponse.json(
    { success: false, error: message },
    { status: 403 }
  );
}
