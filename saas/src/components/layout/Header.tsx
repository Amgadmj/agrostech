"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserRole } from "@/types/database";
import { MOCK_USERS } from "@/lib/mockData";
import { Logo } from "../ui/Logo";
import { Layers, Plus, LogOut, ExternalLink, Box, ShieldAlert } from "lucide-react";

interface HeaderProps {
  portalRole?: "b2c" | "b2b";
}

export const Header: React.FC<HeaderProps> = ({ portalRole = "b2b" }) => {
  const pathname = usePathname();
  const router = useRouter();

  const isB2B = portalRole === "b2b";
  const currentUser = isB2B ? MOCK_USERS["b2b_admin"] : MOCK_USERS["b2c"];

  const handleLogout = () => {
    document.cookie = "agrostech_demo_role=; path=/; max-age=0";
    document.cookie = "agrostech_portal=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <header className="h-16 border-b border-[#1f242b] bg-[#0a0d10]/95 backdrop-blur-md px-6 flex items-center justify-between z-40 relative">
      {/* Brand & Portal Identity */}
      <div className="flex items-center gap-6">
        <Link href={`/dashboard?portal=${portalRole}`} className="flex items-center gap-3 group">
          <Logo size={34} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg text-white tracking-wider">
                AGROS<span className="text-[#00e676]">TECH</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/30 rounded">
                {isB2B ? "Enterprise B2B" : "Portal Produtor B2C"}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono">
              {isB2B ? "Gestão de Portfólio Fundiário & ESG" : "Inteligência Territorial & Crédito Rural"}
            </p>
          </div>
        </Link>

        {/* View Mode Navigation */}
        <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-[#1f242b]">
          <Link
            href={`/dashboard?portal=${portalRole}`}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-1.5 ${
              pathname === "/dashboard"
                ? "bg-[#12171e] text-[#00e676] border border-[#1f242b]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Radar 2D (Brasil)
          </Link>

          <a
            href="https://dashboard-ui-liart-ten.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-1.5 text-gray-400 hover:text-[#00e676]"
          >
            <Box className="w-3.5 h-3.5 text-[#00e676]" />
            Gêmeo 3D (Buritis/MG)
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          <Link
            href={`/dashboard/onboard?portal=${portalRole}`}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-1.5 ${
              pathname.startsWith("/dashboard/onboard")
                ? "bg-[#12171e] text-[#00e676] border border-[#1f242b]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            {isB2B ? "Novo Imóvel na Carteira" : "Auditar Imóvel"}
          </Link>

          <Link
            href="/dashboard/shield-rj"
            className={`px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-1.5 ${
              pathname.startsWith("/dashboard/shield-rj")
                ? "bg-red-950/60 text-red-400 border border-red-500/40"
                : "text-red-400/80 hover:text-red-400 hover:bg-red-950/30"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            Shield RJ 2.0 (Anti-Fraude)
          </Link>
        </nav>
      </div>

      {/* Account Info & Logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pl-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-medium text-white">{currentUser.full_name}</div>
            <div className="text-[10px] text-gray-400 font-mono">
              {isB2B ? "Banco AgroInvest S/A • Carteira Brasil" : "Fazenda Buritis • 217,12 ha (Benchmark)"}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#12171e] border border-[#00e676]/40 flex items-center justify-center text-[#00e676] font-mono text-xs">
            {isB2B ? "B2B" : "B2C"}
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-[#12171e] transition-colors ml-1"
            title="Sair da Conta"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
