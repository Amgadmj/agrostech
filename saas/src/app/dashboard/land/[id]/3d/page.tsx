"use client";

import React, { use } from "react";
import { ALL_PARCELS } from "@/lib/mockData";
import { CesiumViewer } from "@/components/map/CesiumViewer";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LandDigitalTwinPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const parcel =
    ALL_PARCELS.find((p) => p.id === resolvedParams.id) || ALL_PARCELS[0];

  return (
    <div className="w-screen h-[100dvh] bg-[#050505] overflow-hidden">
      <CesiumViewer key={parcel.id} parcel={parcel} />
    </div>
  );
}
