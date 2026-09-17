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
    <div className="flex flex-col h-screen w-screen bg-[#050505] overflow-hidden">
      {/* Portal Header with Strict Isolation */}
      <Header portalRole={portalRole} />

      {/* Main Workspace */}
      <div className="flex flex-1 relative overflow-hidden">
        <Sidebar
          parcels={accessibleParcels}
          selectedParcel={selectedParcel}
          onSelectParcel={setSelectedParcel}
          portalRole={portalRole}
        />

        <main className="flex-1 h-full relative">
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
        <div className="w-screen h-screen bg-[#050505] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#00e676] border-t-transparent animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
