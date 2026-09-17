"use client";

import React, { use } from "react";
import Link from "next/link";
import { ALL_PARCELS } from "@/lib/mockData";
import { ArrowLeft, ExternalLink, Box, RefreshCw } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LandDigitalTwinPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const parcel =
    ALL_PARCELS.find((p) => p.id === resolvedParams.id) || ALL_PARCELS[0];

  const twinUrl = "https://dashboard-ui-liart-ten.vercel.app/";

  return (
    <div className="w-screen h-screen bg-[#050505] flex flex-col overflow-hidden select-none">
      {/* Top Floating HUD Control Bar */}
      <header className="h-14 bg-[#0a0d10]/95 backdrop-blur-md border-b border-[#1f242b] px-5 flex items-center justify-between z-30 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#12171e] text-[#00e676] border border-[#1f242b] hover:border-[#00e676] font-mono text-xs transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Radar 2D</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
            <h1 className="text-sm font-bold text-white font-display">
              {parcel.name} — Gêmeo Digital 3D
            </h1>
            <span className="text-[10px] font-mono text-gray-400 bg-[#12171e] px-2 py-0.5 rounded border border-[#1f242b]">
              {parcel.municipality}/{parcel.state_uf} • {parcel.metrics_json.total_area_ha.toFixed(2)} ha
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={twinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#00e676] text-black font-bold font-mono text-xs hover:bg-[#00ff85] shadow-[0_0_15px_rgba(0,230,118,0.25)] transition-all"
          >
            <Box className="w-3.5 h-3.5 text-black" />
            <span>Abrir Gêmeo em Tela Cheia</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>
      </header>

      {/* Embedded 3D Stage from https://dashboard-ui-liart-ten.vercel.app/ */}
      <main className="flex-1 w-full h-[calc(100vh-3.5rem)] relative bg-[#050505]">
        <iframe
          src={twinUrl}
          title="AgrosTech Gêmeo Digital 3D - Fazenda Buritis"
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </main>
    </div>
  );
}
