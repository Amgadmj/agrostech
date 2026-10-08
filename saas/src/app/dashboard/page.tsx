"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import dynamic from "next/dynamic";

const MapView2D = dynamic(
  () => import("@/components/map/MapView2D").then((mod) => mod.MapView2D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#00e676] border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-gray-400">
            Carregando Radar 2D & MapBiomas...
          </span>
        </div>
      </div>
    ),
  }
);
import { ALL_PARCELS, REAL_BURITIS_PARCELS } from "@/lib/mockData";
import { LandParcel } from "@/types/database";

function DashboardContent() {
  const searchParams = useSearchParams();
  const portalParam = searchParams.get("portal");

  // Determine portal role: strictly "b2b" or "b2c"
  const [portalRole, setPortalRole] = useState<"b2c" | "b2b">("b2b");
  const [selectedParcel, setSelectedParcel] = useState<LandParcel | null>(null);

  useEffect(() => {
    if (portalParam === "b2c" || portalParam === "b2b") {
      setPortalRole(portalParam);
      document.cookie = `agrostech_portal=${portalParam}; path=/; max-age=86400`;
    } else {
      const match = document.cookie.match(/agrostech_portal=([^;]+)/);
      if (match && (match[1] === "b2c" || match[1] === "b2b")) {
        setPortalRole(match[1] as "b2c" | "b2b");
      }
    }
  }, [portalParam]);

  // If B2C, display only Fazenda Buritis; if B2B, display all parcels across regions (Buritis, Uberaba, São Paulo)
  const accessibleParcels = useMemo(() => {
    if (portalRole === "b2c") {
      return REAL_BURITIS_PARCELS.filter((p) => p.id === "buritis-gleba-sede");
    }
    return ALL_PARCELS;
  }, [portalRole]);

  // Default selection
  useEffect(() => {
    if (accessibleParcels.length > 0) {
      setSelectedParcel(accessibleParcels[0]);
    }
  }, [accessibleParcels]);

  return (
    <div className="flex flex-col h-dvh w-full bg-slate-50 dark:bg-[#050505] overflow-hidden transition-colors">
      {/* Portal Header with Strict Isolation */}
      <Header portalRole={portalRole} />

      {/* Main Workspace: map on top + panel below on phones, side by side from md up */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 relative overflow-hidden">
        <Sidebar
          parcels={accessibleParcels}
          selectedParcel={selectedParcel}
          onSelectParcel={setSelectedParcel}
          portalRole={portalRole}
        />

        <main className="absolute inset-0 md:relative md:inset-auto md:flex-1 md:h-full">
          <MapView2D
            parcels={accessibleParcels}
            selectedParcel={selectedParcel}
            onSelectParcel={setSelectedParcel}
          />
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-dvh bg-[#050505] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#00e676] border-t-transparent animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
