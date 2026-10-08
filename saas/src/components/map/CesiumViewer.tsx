"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LandParcel } from "@/types/database";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import {
  ArrowLeft,
  Camera,
  Layers,
  Compass,
  Maximize2,
  Minimize2,
  Box,
  Eye,
  Crosshair,
  Sun,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

interface CesiumViewerProps {
  parcel: LandParcel;
}

export const CesiumViewer: React.FC<CesiumViewerProps> = ({ parcel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [altitudeM, setAltitudeM] = useState<number>(350);
  const [cameraMode, setCameraMode] = useState<"drone" | "nadir" | "orbit">("drone");
  const [showContours, setShowContours] = useState<boolean>(true);
  const [modelError, setModelError] = useState<boolean>(false);

  // Centroid coordinate for parcel
  const coords = parcel.geojson_boundary.geometry.coordinates;
  const lon = (coords as any)[0][0][0] || -46.428;
  const lat = (coords as any)[0][0][1] || -15.625;

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    let viewer: any = null;
    let isCancelled = false;

    // Load Cesium dynamically in browser
    const initCesium = async () => {
      try {
        // Set Cesium base URL to local static assets to avoid CORS errors
        (window as any).CESIUM_BASE_URL = "/cesium/";

        const Cesium = await import("cesium");

        // Set Cesium Ion Access Token from environment
        Cesium.Ion.defaultAccessToken =
          process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN || "";

        if (typeof document !== "undefined" && !document.getElementById("cesium-widgets-css")) {
          const link = document.createElement("link");
          link.id = "cesium-widgets-css";
          link.rel = "stylesheet";
          link.href = "/cesium/Widgets/widgets.css";
          document.head.appendChild(link);
        }

        if (isCancelled || !containerRef.current) return;

        // Custom dark style imagery & terrain with water mask and vertex normals
        let terrainProvider;
        if (process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN) {
          try {
            terrainProvider = Cesium.Terrain.fromWorldTerrain({
              requestWaterMask: true,
              requestVertexNormals: true,
            });
          } catch {
            terrainProvider = undefined;
          }
        }

        const viewerInstance = new Cesium.Viewer(containerRef.current, {
          ...(terrainProvider ? { terrain: terrainProvider } : {}),
          animation: false,
          timeline: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          baseLayerPicker: false,
          navigationHelpButton: false,
          infoBox: false,
          selectionIndicator: false,
          fullscreenButton: false,
        });

        viewer = viewerInstance;
        viewerRef.current = viewerInstance;

        // Dark atmosphere & styling
        viewer.scene.globe.enableLighting = true;
        viewer.scene.backgroundColor = Cesium.Color.fromCssColorString("#0d0d12");
        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#15151e");

        // Center on the farmland
        const targetPos = Cesium.Cartesian3.fromDegrees(lon, lat, 250);
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(lon, lat - 0.015, 800),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-35),
            roll: 0.0,
          },
          duration: 2.0,
        });

        // Add 3D boundary polygon wireframe / extrusion (between 80m and 150m)
        const flatCoords: number[] = [];
        const ring = (coords as any)[0];
        if (ring) {
          ring.forEach((pt: number[]) => {
            flatCoords.push(pt[0], pt[1]);
          });
        }

        viewer.entities.add({
          name: parcel.name,
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
            material: Cesium.Color.fromCssColorString("#c2ff00").withAlpha(0.25),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString("#c2ff00"),
            outlineWidth: 3,
            height: 0,
            extrudedHeight: 120, // 120m extruded boundary prism
          },
        });

        // Load 3D Asset (GLB or 3D Tiles) based on database model_type
        if (parcel.model_type === "3dtiles" && parcel.model_3d_url) {
          try {
            const tileset = await Cesium.Cesium3DTileset.fromUrl(parcel.model_3d_url);
            viewer.scene.primitives.add(tileset);
          } catch (e) {
            console.warn("3D Tiles loading (demo fallback to extruded polygon terrain):", e);
            setModelError(true);
          }
        } else if (parcel.model_type === "glb" && parcel.model_3d_url) {
          try {
            if (parcel.model_3d_url.includes("vercel.app") || parcel.model_3d_url.includes("undefined")) {
              setModelError(true);
            } else {
              viewer.entities.add({
                name: "Modelo 3D Farmland",
                position: targetPos,
                model: {
                  uri: parcel.model_3d_url,
                  minimumPixelSize: 128,
                  maximumScale: 20000,
                },
              });
            }
          } catch (e) {
            console.warn("GLB loading (demo fallback to 3D land prism):", e);
            setModelError(true);
          }
        }

        // Camera flight height tracking listener
        viewer.camera.changed.addEventListener(() => {
          const height = Math.round(viewer.camera.positionCartographic.height);
          setAltitudeM(height);
        });

        setIsLoaded(true);
      } catch (err) {
        console.error("Cesium initialization error:", err);
        setIsLoaded(true);
      }
    };

    initCesium();

    return () => {
      isCancelled = true;
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
      viewerRef.current = null;
    };
  }, [parcel, lon, lat, coords]);

  // Camera preset handlers
  const handleSetCamera = (mode: "drone" | "nadir" | "orbit") => {
    setCameraMode(mode);
    if (!viewerRef.current) return;

    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    if (mode === "nadir") {
      // Nadir Top-down Survey
      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, 1200),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: 0.0,
        },
        duration: 1.5,
      });
    } else if (mode === "drone") {
      // Oblique Drone Angle (35 degrees)
      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat - 0.015, 650),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-35),
          roll: 0.0,
        },
        duration: 1.5,
      });
    } else if (mode === "orbit") {
      // Low Altitude Flyby
      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon + 0.01, lat - 0.01, 380),
        orientation: {
          heading: Cesium.Math.toRadians(-45),
          pitch: Cesium.Math.toRadians(-20),
          roll: 0.0,
        },
        duration: 2.0,
      });
    }
  };

  return (
    <div className="relative w-full h-full bg-[#0d0d12] overflow-hidden">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* 3D Model Unavailable Notice */}
      {modelError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto bg-amber-500/90 text-black px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold flex items-center gap-1.5 shadow-lg animate-in fade-in duration-200">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Modelo 3D indisponível (Renderizando prisma cadastral 120m)</span>
        </div>
      )}

      {/* Loading Screen Overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 z-50 bg-background flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 border-2 border-brand-neon/30 border-t-brand-neon rounded-full animate-spin" />
          <div className="text-center font-mono space-y-1">
            <h3 className="text-white font-bold text-sm">Carregando Gêmeo Digital 3D</h3>
            <p className="text-xs text-gray-400">
              Renderizando malha fotogramétrica e elevação altimétrica...
            </p>
          </div>
        </div>
      )}

      {/* Top HUD Bar: Return to Dashboard & Asset Info */}
      <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-20 flex flex-col items-start sm:flex-row sm:items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 max-w-full">
          <Link href="/dashboard">
            <Button
              variant="secondary"
              size="sm"
              className="bg-surface/90 backdrop-blur-md text-white border-surface-border hover:border-brand-neon flex items-center gap-1.5 font-mono shadow-lg"
            >
              <ArrowLeft className="w-4 h-4 text-brand-neon" />
              <span>Radar 2D</span>
            </Button>
          </Link>

          <div className="min-w-0 bg-surface/90 backdrop-blur-md border border-surface-border px-3 sm:px-3.5 py-1.5 rounded-md text-xs font-mono flex items-center gap-3 shadow-lg">
            <span className="font-bold text-white truncate">{parcel.name}</span>
            <span className="hidden sm:inline text-gray-500">|</span>
            <span className="hidden sm:inline text-gray-400">{parcel.municipality}/{parcel.state_uf}</span>
            <Badge variant="neon" size="sm" className="hidden sm:inline-flex">
              {parcel.model_type === "3dtiles" ? "Stream 3D Tiles" : "Single GLB"}
            </Badge>
          </div>
        </div>

        {/* Flight Cockpit Telemetry HUD */}
        <div className="pointer-events-auto bg-surface/90 backdrop-blur-md border border-surface-border px-3 sm:px-4 py-1.5 rounded-md text-xs font-mono flex items-center gap-3 sm:gap-4 shadow-lg text-gray-300">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-brand-neon" />
            <span>ALT: <b className="text-white">{altitudeM}m</b></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand-lime" />
            <span>DECLIVIDADE: <b className="text-white">{parcel.metrics_json.slope_avg_percent}%</b></span>
          </div>
        </div>
      </div>

      {/* Right Floating Drone Controls */}
      <div className="absolute top-28 right-2 sm:top-20 sm:right-4 z-20 pointer-events-auto flex flex-col gap-2">
        <div className="bg-surface/90 backdrop-blur-md border border-surface-border p-1.5 sm:p-2 rounded-lg flex flex-col gap-1.5 shadow-lg">
          <div className="hidden sm:block text-xs uppercase font-mono text-gray-400 px-2 py-1 font-semibold">
            Modos de Câmera
          </div>

          <button
            onClick={() => handleSetCamera("drone")}
            aria-label="Voo Drone (35°)"
            title="Voo Drone (35°)"
            className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-2 transition-all ${
              cameraMode === "drone"
                ? "bg-brand-neon text-black font-semibold shadow-neon"
                : "text-gray-300 hover:bg-surface-hover hover:text-white"
            }`}
          >
            <Camera className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Voo Drone (35°)</span>
          </button>

          <button
            onClick={() => handleSetCamera("nadir")}
            aria-label="Ortofoto Nadir (90°)"
            title="Ortofoto Nadir (90°)"
            className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-2 transition-all ${
              cameraMode === "nadir"
                ? "bg-brand-neon text-black font-semibold shadow-neon"
                : "text-gray-300 hover:bg-surface-hover hover:text-white"
            }`}
          >
            <Crosshair className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Ortofoto Nadir (90°)</span>
          </button>

          <button
            onClick={() => handleSetCamera("orbit")}
            aria-label="Órbita Baixa"
            title="Órbita Baixa"
            className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-2 transition-all ${
              cameraMode === "orbit"
                ? "bg-brand-neon text-black font-semibold shadow-neon"
                : "text-gray-300 hover:bg-surface-hover hover:text-white"
            }`}
          >
            <Eye className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Órbita Baixa</span>
          </button>
        </div>
      </div>

      {/* Bottom Farmland Info Overlay */}
      <div className="absolute bottom-2 left-2 right-2 sm:right-auto sm:bottom-6 sm:left-6 z-20 pointer-events-auto bg-surface/90 backdrop-blur-md border border-surface-border p-3 sm:p-4 rounded-lg text-xs font-mono sm:max-w-sm max-h-[38%] overflow-y-auto space-y-2 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs text-brand-neon uppercase tracking-wider font-semibold">
            Digital Twin Telemetry
          </span>
          <Badge variant="regular" size="sm">
            {parcel.metrics_json.total_area_ha.toFixed(1)} ha
          </Badge>
        </div>

        <div className="text-gray-300 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Cota Máxima:</span>
            <span className="text-white font-bold">{parcel.metrics_json.max_elevation_m || 892} m</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Cota Mínima:</span>
            <span className="text-white font-bold">{parcel.metrics_json.min_elevation_m || 784} m</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Estoque Carbono:</span>
            <span className="text-status-reserve font-bold">
              {parcel.metrics_json.carbon_stock_tco2e?.toLocaleString() || "14.280"} tCO2e
            </span>
          </div>
        </div>

        <div className="text-xs text-gray-500 pt-1 border-t border-surface-border">
          Navegação: Botão esquerdo para rotacionar, botão direito / scroll para zoom, shift + arrastar para inclinar.
        </div>
      </div>
    </div>
  );
};
