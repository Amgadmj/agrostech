"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MOCK_USERS } from "@/lib/mockData";
import { Logo } from "../ui/Logo";
import { Layers, Plus, LogOut, Box, ShieldAlert, Menu, X, Sprout, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { DemoBadge } from "@/components/dashboard/DemoBadge";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
  portalRole?: "b2c" | "b2b";
}

export const Header: React.FC<HeaderProps> = ({ portalRole }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [effectiveRole, setEffectiveRole] = useState<"b2c" | "b2b">(portalRole || "b2b");
  const [department, setDepartment] = useState<"credit_risk" | "precision_agriculture">("credit_risk");

  // Read portal & department from cookie if not explicitly passed
  useEffect(() => {
    if (portalRole) {
      setEffectiveRole(portalRole);
    } else {
      const matchPortal = document.cookie.match(/agrostech_portal=([^;]+)/);
      if (matchPortal && (matchPortal[1] === "b2c" || matchPortal[1] === "b2b")) {
        setEffectiveRole(matchPortal[1] as "b2c" | "b2b");
      }
    }
    const matchDep = document.cookie.match(/agrostech_department=([^;]+)/);
    if (matchDep && (matchDep[1] === "credit_risk" || matchDep[1] === "precision_agriculture")) {
      setDepartment(matchDep[1] as any);
    }
  }, [portalRole]);

  const handleDepartmentSwitch = (dep: "credit_risk" | "precision_agriculture") => {
    setDepartment(dep);
    document.cookie = `agrostech_department=${dep}; path=/; max-age=86400`;
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isB2B = effectiveRole === "b2b";
  const currentUser = isB2B ? MOCK_USERS["b2b_admin"] : MOCK_USERS["b2c"];

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // demo fallback
    }
    document.cookie = "agrostech_demo_role=; path=/; max-age=0";
    document.cookie = "agrostech_portal=; path=/; max-age=0";
    document.cookie = "agrostech_department=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <header className="h-16 border-b border-surface-border bg-surface/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-40 relative transition-colors shrink-0">
      {/* Brand & Portal Identity */}
      <div className="flex items-center gap-3 sm:gap-6 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3 group shrink-0">
          <Logo size={32} />
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-display font-bold text-base sm:text-lg text-foreground tracking-wider">
                AGROS<span className="text-brand-emerald dark:text-[#00e676]">TECH</span>
              </span>
              <span className="text-xs uppercase font-mono px-1.5 py-0.5 bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/30 rounded shrink-0">
                <span className="hidden min-[420px]:inline">{isB2B ? "Enterprise B2B" : "Produtor B2C"}</span>
                <span className="min-[420px]:hidden">{isB2B ? "B2B" : "B2C"}</span>
              </span>
            </div>
            <p className="text-xs text-slate-muted font-mono hidden sm:block truncate max-w-[220px] lg:max-w-none">
              {isB2B ? "Gestão de Portfólio Fundiário & ESG" : "Inteligência Territorial & Crédito Rural"}
            </p>
          </div>
        </Link>

        {/* Departmental Workflow Switcher (Precision Ag vs Credit Risk) */}
        <div className="hidden xl:flex items-center bg-surface-hover/80 p-0.5 rounded-lg border border-surface-border text-xs font-mono">
          <button
            onClick={() => handleDepartmentSwitch("credit_risk")}
            title="Departamento de Crédito & Financiamento (Conformidade MCR 2-9 / CMN 5.267)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all ${
              department === "credit_risk"
                ? "bg-brand-emerald text-black font-semibold shadow-sm"
                : "text-slate-muted hover:text-foreground"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Crédito & Risco</span>
          </button>
          <button
            onClick={() => handleDepartmentSwitch("precision_agriculture")}
            title="Departamento de Agricultura de Precisão (Piloto Coplacana - Cana-de-Açúcar)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all ${
              department === "precision_agriculture"
                ? "bg-brand-emerald text-black font-semibold shadow-sm"
                : "text-slate-muted hover:text-foreground"
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>Agri-Precisão (Coplacana)</span>
          </button>
        </div>

        {/* Desktop View Mode Navigation - Compact at 1024px without wrapping */}
        <nav className="hidden md:flex items-center gap-1 pl-3 lg:pl-4 border-l border-surface-border shrink-0">
          <Link
            href="/dashboard"
            title="M1: Área Útil Líquida, Radar 2D e Cobertura MapBiomas"
            className={`px-2.5 lg:px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-1.5 whitespace-nowrap ${
              pathname === "/dashboard"
                ? "bg-surface-hover text-brand-emerald border border-surface-border"
                : "text-slate-muted hover:text-foreground hover:bg-surface-hover/60"
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>M1: Área Líquida</span>
          </Link>

          <Link
            href="/dashboard/land/buritis-gleba-sede/3d"
            title="M2: Gêmeo Digital 3D (CesiumJS - Voo Drone Opcional)"
            className={`px-2.5 lg:px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-1.5 whitespace-nowrap ${
              pathname.includes("/3d")
                ? "bg-surface-hover text-brand-emerald border border-surface-border"
                : "text-slate-muted hover:text-foreground hover:bg-surface-hover/60"
            }`}
          >
            <Box className="w-3.5 h-3.5 shrink-0 text-brand-emerald" />
            <span>M2: Gêmeo 3D (Opcional)</span>
          </Link>

          <Link
            href="/dashboard/onboard"
            title={isB2B ? "Auditar e Cadastrar Novo Imóvel na Carteira" : "Auditar Imóvel Rural"}
            className={`px-2.5 lg:px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-1.5 whitespace-nowrap ${
              pathname.startsWith("/dashboard/onboard")
                ? "bg-surface-hover text-brand-emerald border border-surface-border"
                : "text-slate-muted hover:text-foreground hover:bg-surface-hover/60"
            }`}
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>{isB2B ? "Novo Imóvel" : "Auditar Imóvel"}</span>
          </Link>

          <Link
            href="/dashboard/shield-rj"
            title="M3: Monitoramento SAR Orbital // Shield-RJ Anti-Fraude e Alerta Noturno"
            className={`px-2.5 lg:px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-1.5 whitespace-nowrap ${
              pathname.startsWith("/dashboard/shield-rj")
                ? "bg-rose-500/10 text-rose-500 border border-rose-500/30"
                : "text-rose-500/80 hover:text-rose-400 hover:bg-rose-500/5"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-500" />
            <span>Shield-RJ</span>
          </Link>
        </nav>
      </div>

      {/* Account Info, Demo Badge, Theme Toggle & Logout */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <DemoBadge size="sm" className="hidden sm:inline-flex" />

        <ThemeToggle />

        <div className="hidden sm:flex items-center gap-2.5 pl-2.5 border-l border-surface-border">
          <div className="text-right hidden lg:block">
            <div className="text-xs font-medium text-foreground truncate max-w-[160px]">{currentUser.full_name}</div>
            <div className="text-xs text-slate-muted font-mono truncate max-w-[160px]">
              {isB2B ? "Banco AgroInvest S/A" : "Fazenda Buritis (Referência)"}
            </div>
          </div>
          <div
            className="w-8 h-8 rounded-full bg-surface-hover border border-brand-emerald/40 flex items-center justify-center text-brand-emerald font-mono text-xs font-bold shrink-0"
            title={isB2B ? "Perfil B2B Institucional" : "Perfil B2C Produtor"}
          >
            {isB2B ? "B2B" : "B2C"}
          </div>

          <button
            onClick={handleLogout}
            aria-label="Sair da Conta"
            title="Sair da Conta"
            className="p-1.5 rounded text-slate-muted hover:text-rose-500 hover:bg-surface-hover transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Fechar menu principal" : "Abrir menu principal"}
          aria-expanded={mobileMenuOpen}
          className="w-11 h-11 flex items-center justify-center rounded-lg md:hidden text-slate-muted hover:text-foreground hover:bg-surface-hover border border-surface-border transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Navigation (< md) */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 max-h-[calc(100dvh-4rem)] overflow-y-auto bg-surface backdrop-blur-xl border-b border-surface-border p-4 shadow-xl z-50 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-surface-hover border border-brand-emerald/40 flex items-center justify-center text-brand-emerald font-mono text-xs font-bold">
                {isB2B ? "B2B" : "B2C"}
              </div>
              <div>
                <div className="text-xs font-medium text-foreground">{currentUser.full_name}</div>
                <div className="text-xs text-slate-muted font-mono">
                  {isB2B ? "Banco AgroInvest S/A" : "Fazenda Buritis"}
                </div>
              </div>
            </div>
            <DemoBadge size="sm" />
          </div>

          {/* Departmental switcher (the desktop version is hidden below xl) */}
          <div className="flex items-center bg-surface-hover/80 p-0.5 rounded-lg border border-surface-border text-xs font-mono">
            <button
              onClick={() => handleDepartmentSwitch("credit_risk")}
              aria-pressed={department === "credit_risk"}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded transition-all ${
                department === "credit_risk"
                  ? "bg-brand-emerald text-black font-semibold shadow-sm"
                  : "text-slate-muted hover:text-foreground"
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Crédito & Risco</span>
            </button>
            <button
              onClick={() => handleDepartmentSwitch("precision_agriculture")}
              aria-pressed={department === "precision_agriculture"}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded transition-all ${
                department === "precision_agriculture"
                  ? "bg-brand-emerald text-black font-semibold shadow-sm"
                  : "text-slate-muted hover:text-foreground"
              }`}
            >
              <Sprout className="w-4 h-4 shrink-0" />
              <span>Agri-Precisão</span>
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            <Link
              href="/dashboard"
              className={`px-3 py-3 rounded text-xs font-mono transition-all flex items-center gap-2 ${
                pathname === "/dashboard"
                  ? "bg-surface-hover text-brand-emerald border border-surface-border"
                  : "text-slate-muted hover:text-foreground hover:bg-surface-hover/60"
              }`}
            >
              <Layers className="w-4 h-4 text-brand-emerald" />
              <span>Radar 2D (Brasil)</span>
            </Link>

            <Link
              href="/dashboard/land/buritis-gleba-sede/3d"
              className={`px-3 py-3 rounded text-xs font-mono transition-all flex items-center gap-2 ${
                pathname.includes("/3d")
                  ? "bg-surface-hover text-brand-emerald border border-surface-border"
                  : "text-slate-muted hover:text-foreground hover:bg-surface-hover/60"
              }`}
            >
              <Box className="w-4 h-4 text-brand-emerald" />
              <span>Gêmeo 3D (CesiumJS)</span>
            </Link>

            <Link
              href="/dashboard/onboard"
              className={`px-3 py-3 rounded text-xs font-mono transition-all flex items-center gap-2 ${
                pathname.startsWith("/dashboard/onboard")
                  ? "bg-surface-hover text-brand-emerald border border-surface-border"
                  : "text-slate-muted hover:text-foreground hover:bg-surface-hover/60"
              }`}
            >
              <Plus className="w-4 h-4 text-brand-emerald" />
              <span>{isB2B ? "Novo Imóvel na Carteira" : "Auditar Imóvel"}</span>
            </Link>

            <Link
              href="/dashboard/shield-rj"
              className={`px-3 py-3 rounded text-xs font-mono transition-all flex items-center gap-2 ${
                pathname.startsWith("/dashboard/shield-rj")
                  ? "bg-rose-500/10 text-rose-500 border border-rose-500/30"
                  : "text-rose-500/80 hover:text-rose-400 hover:bg-rose-500/5"
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Shield-RJ (Anti-Fraude)</span>
            </Link>
          </nav>

          <div className="pt-2 border-t border-surface-border flex items-center justify-between">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-3 rounded text-xs font-mono text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
