"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import DeckGL from "@deck.gl/react";
import { GeoJsonLayer } from "@deck.gl/layers";
import maplibregl from "maplibre-gl";
import { EnrichedLandData } from "@/types/geospatial";

interface MiniMapProps {
  data: EnrichedLandData;
}

export const MiniMap: React.FC<MiniMapProps> = ({ data }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // Extract centroid
  const coords = data.geojson_boundary.geometry.coordinates;
  const initialLon = (coords as any)[0][0][0] || -46.428;
  const initialLat = (coords as any)[0][0][1] || -15.625;

  const [viewState, setViewState] = useState({
    longitude: initialLon,
    latitude: initialLat,
    zoom: 12.8,
    pitch: 35,
    bearing: 0,
  });

  // Init MapLibre background
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          "carto-dark": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
            attribution: "",
          },
        },
        layers: [
          {
            id: "carto-dark-layer",
            type: "raster",
            source: "carto-dark",
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: [initialLon, initialLat],
      zoom: 12.8,
      interactive: false,
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [initialLon, initialLat]);

  // Sync MapLibre with viewState
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.jumpTo({
        center: [viewState.longitude, viewState.latitude],
        zoom: viewState.zoom,
      });
    }
  }, [viewState]);

  // Prepare layers
  const layers = useMemo(() => {
    const list: any[] = [];

    // 1. Primary Land Parcel Polygon (Neon Green)
    list.push(
      new GeoJsonLayer({
        id: "mini-land-boundary",
        data: data.geojson_boundary as any,
        stroked: true,
        filled: true,
        lineWidthUnits: "pixels",
        getLineWidth: 3,
        getLineColor: [194, 255, 0, 255], // Neon green #c2ff00
        getFillColor: [194, 255, 0, 45],
      })
    );

    // 2. APP Zones (Blue)
    if (data.layers.app_zones && data.layers.app_zones.length > 0) {
      list.push(
        new GeoJsonLayer({
          id: "mini-app-zones",
          data: {
            type: "FeatureCollection",
            features: data.layers.app_zones,
          } as any,
          stroked: true,
          filled: true,
          lineWidthUnits: "pixels",
          getLineWidth: 2,
          getLineColor: [56, 189, 248, 255], // Sky blue #38bdf8
          getFillColor: [56, 189, 248, 90],
        })
      );
    }

    // 3. Reserva Legal (Emerald Green)
    if (data.layers.legal_reserve && data.layers.legal_reserve.length > 0) {
      list.push(
        new GeoJsonLayer({
          id: "mini-legal-reserve",
          data: {
            type: "FeatureCollection",
            features: data.layers.legal_reserve,
          } as any,
          stroked: true,
          filled: true,
          lineWidthUnits: "pixels",
          getLineWidth: 2,
          getLineColor: [16, 185, 129, 255], // Emerald green #10b981
          getFillColor: [16, 185, 129, 90],
        })
      );
    }

    // 4. IBAMA Embargos (Crimson Red)
    if (data.layers.ibama_embargos && data.layers.ibama_embargos.length > 0) {
      list.push(
        new GeoJsonLayer({
          id: "mini-ibama-embargos",
          data: {
            type: "FeatureCollection",
            features: data.layers.ibama_embargos,
          } as any,
          stroked: true,
          filled: true,
          lineWidthUnits: "pixels",
          getLineWidth: 3,
          getLineColor: [239, 68, 68, 255], // Crimson red #ef4444
          getFillColor: [239, 68, 68, 140],
        })
      );
    }

    return list;
  }, [data]);

  return (
    <div className="relative w-full h-80 rounded-lg overflow-hidden border border-surface-border bg-[#0d0d12]">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState as any)}
        controller={true}
        layers={layers}
      />

      {/* Overlay Legend */}
      <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-md border border-surface-border p-2 rounded text-[10px] font-mono space-y-1 z-20">
        <div className="flex items-center gap-1.5 text-brand-neon">
          <span className="w-2.5 h-2.5 rounded-sm bg-brand-neon/30 border border-brand-neon" />
          <span>Limite Fazenda</span>
        </div>
        <div className="flex items-center gap-1.5 text-status-app">
          <span className="w-2.5 h-2.5 rounded-sm bg-status-app/30 border border-status-app" />
          <span>APP Hídrica</span>
        </div>
        <div className="flex items-center gap-1.5 text-status-reserve">
          <span className="w-2.5 h-2.5 rounded-sm bg-status-reserve/30 border border-status-reserve" />
          <span>Reserva Legal</span>
        </div>
        {data.compliance_ibama.is_embargoed && (
          <div className="flex items-center gap-1.5 text-status-embargo font-bold animate-pulse">
            <span className="w-2.5 h-2.5 rounded-sm bg-status-embargo/50 border border-status-embargo" />
            <span>Embargo IBAMA</span>
          </div>
        )}
      </div>
    </div>
  );
};
