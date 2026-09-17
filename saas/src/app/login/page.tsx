"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { ArrowRight, ShieldCheck, UserCheck, Lock, Mail, Building2, User } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Dedicated portal entry
  const handlePortalEntry = (portal: "b2c" | "b2b") => {
    document.cookie = `agrostech_portal=${portal}; path=/; max-age=86400`;
    document.cookie = `agrostech_demo_role=${portal === "b2c" ? "b2c" : "b2b_admin"}; path=/; max-age=86400`;
    router.push(`/dashboard?portal=${portal}`);
  };

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const matchedPortal = email.includes("b2c") || email.includes("produtor") ? "b2c" : "b2b";
    document.cookie = `agrostech_portal=${matchedPortal}; path=/; max-age=86400`;
    document.cookie = `agrostech_demo_role=${matchedPortal === "b2c" ? "b2c" : "b2b_admin"}; path=/; max-age=86400`;
    setTimeout(() => {
      router.push(`/dashboard?portal=${matchedPortal}`);
    }, 500);
  };

  return (
    <div className="min-h-screen w-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Background Decorative Emerald Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#00e676]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#00e5ff]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center mb-1">
            <Logo size={56} />
          </div>
          <h1 className="text-2xl font-bold font-display text-white tracking-wider">
            AGROS<span className="text-[#00e676]">TECH</span>
          </h1>
          <p className="text-xs text-gray-400 font-mono">
            Plataforma Soberana de Inteligência Territorial & Gêmeos Digitais
          </p>
        </div>

        {/* Segregated Portal Selection */}
        <div className="space-y-3">
          <div className="text-[11px] font-mono uppercase text-gray-400 tracking-wider text-center">
            Selecione seu Portal de Acesso:
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* B2C Portal */}
            <button
              onClick={() => handlePortalEntry("b2c")}
              className="p-4 rounded-lg bg-[#0a0d10] hover:bg-[#12171e] border border-[#1f242b] hover:border-[#00e676] transition-all text-left group shadow-lg reticle-corner"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:text-[#00e676] font-mono">
                  <User className="w-4 h-4 text-[#00e676]" />
                  <span>Portal do Produtor Rural (B2C)</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-[#00e676] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-[11px] text-gray-400 font-mono pl-6">
                Acesso individual: Fazenda Buritis (217,12 ha) • Dossiê, CAR e Gêmeo 3D
              </p>
            </button>

            {/* B2B Portal */}
            <button
              onClick={() => handlePortalEntry("b2b")}
              className="p-4 rounded-lg bg-[#0a0d10] hover:bg-[#12171e] border border-[#1f242b] hover:border-[#00e5ff] transition-all text-left group shadow-lg reticle-corner"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:text-[#00e5ff] font-mono">
                  <Building2 className="w-4 h-4 text-[#00e5ff]" />
                  <span>Portal Institucional & Bancário (B2B)</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-[#00e5ff] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-[11px] text-gray-400 font-mono pl-6">
                Banco AgroInvest S/A • Carteira multi-fazendas em Buritis e compliance ESG
              </p>
            </button>
          </div>
        </div>

        {/* Corporate Email Login Form */}
        <div className="p-4 rounded-lg bg-[#0a0d10] border border-[#1f242b] space-y-4">
          <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
            Ou acesse com e-mail corporativo
          </div>

          <form onSubmit={handleStandardLogin} className="space-y-3 font-mono text-xs">
            <div className="space-y-1">
              <label className="text-gray-300">E-mail:</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="produtor@buritis.agr.br ou gestor@agroinvest.com.br"
                  className="w-full bg-[#050505] border border-[#1f242b] rounded pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#00e676]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-gray-300">Senha:</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#050505] border border-[#1f242b] rounded pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#00e676]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2 px-4 rounded bg-[#00e676] hover:bg-[#00ff85] text-black font-bold font-mono text-xs shadow-[0_0_15px_rgba(0,230,118,0.25)] transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Autenticando..." : "Entrar na Plataforma"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-screen bg-[#050505] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#00e676] border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
