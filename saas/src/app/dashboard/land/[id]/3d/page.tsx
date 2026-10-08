"use client";

import React, { use } from "react";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { ALL_PARCELS } from "@/lib/mockData";
import { AppShell } from "@/components/layout/AppShell";
import { formatHa } from "@/lib/format";
import { Box } from "lucide-react";

// Dynamically import native CesiumViewer with SSR disabled to prevent Node Webpack bundling errors
const CesiumViewer = dynamic(
  () => import("@/components/map/CesiumViewer").then((mod) => mod.CesiumViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-background flex flex-col items-center justify-center gap-4 font-mono text-xs">
        <div className="w-14 h-14 border-2 border-brand-emerald/30 border-t-brand-emerald rounded-full animate-spin shadow-emerald" />
        <div className="text-center space-y-1">
          <h3 className="text-foreground font-bold text-sm tracking-wide">
            Inicializando CesiumJS 3D WebGL Engine
          </h3>
          <p className="text-slate-muted text-xs">
            Carregando WorldTerrain, máscara hídrica e elevação altimétrica...
          </p>
        </div>
      </div>
    ),
  }
);

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LandDigitalTwinPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const parcel = ALL_PARCELS.find((p) => p.id === resolvedParams.id);

  if (!parcel) {
    notFound();
  }

  return (
    <AppShell noScroll>
      {/* 3D Context Sub-bar */}
      <div className="h-10 bg-surface/90 border-b border-surface-border px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
          <span className="font-semibold text-foreground truncate">{parcel.name}</span>
          <span className="text-xs text-slate-muted bg-surface-hover px-2 py-0.5 rounded border border-surface-border">
            {parcel.municipality}/{parcel.state_uf} • {formatHa(parcel.metrics_json.total_area_ha)}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-muted">
          <Box className="w-3.5 h-3.5 text-brand-emerald" />
          <span>Terreno 3D + Prisma Cadastral Extrudado (120m)</span>
        </div>
      </div>

      {/* Native Cesium 3D Viewport */}
      <div className="flex-1 w-full h-full relative bg-background">
        <CesiumViewer parcel={parcel} />
      </div>
    </AppShell>
  );
}
