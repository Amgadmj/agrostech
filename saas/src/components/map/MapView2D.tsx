"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import DeckGL from "@deck.gl/react";
import { GeoJsonLayer, PathLayer, BitmapLayer } from "@deck.gl/layers";
import { TileLayer } from "@deck.gl/geo-layers";
import { PathStyleExtension } from "@deck.gl/extensions";
import maplibregl from "maplibre-gl";
import { LandParcel } from "@/types/database";
import {
  MAPBIOMAS_THEMES,
  MapBiomasTheme,
  buildMapBiomasWmsUrl,
} from "@/lib/mapbiomas";
import {
  BURITIS_APP_COORDINATES,
  BURITIS_RESERVA_LEGAL_COORDINATES,
  BURITIS_AGRICULTURE_COORDINATES,
} from "@/lib/mockData";
import { MapBiomasThematicAuditCard } from "./MapBiomasThematicAuditCard";
import { MapBiomasWorkflowModal } from "./MapBiomasWorkflowModal";
import {
  Download,
  Layers,
  Globe,
  X,
  Sliders,
  Check,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers3,
  HelpCircle,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Wheat,
  AlertTriangle,
} from "lucide-react";

interface MapView2DProps {
  parcels: LandParcel[];
  selectedParcel: LandParcel | null;
  onSelectParcel: (parcel: LandParcel) => void;
}

// Centered directly on Fazenda Buritis, Minas Gerais (Benchmark Parcel)
const BURITIS_VIEW_STATE = {
  longitude: -46.6035,
  latitude: -15.4355,
  zoom: 13.1,
  pitch: 0,
  bearing: 0,
};

interface ActiveThemeState {
  enabled: boolean;
  opacity: number;
  year: number;
}

// Reuse extension instance to preserve WebGL shader compilation cache
const pathDashExtension = new PathStyleExtension({ dash: true });

export const MapView2D: React.FC<MapView2DProps> = ({
  parcels,
  selectedParcel,
  onSelectParcel,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [viewState, setViewState] = useState(BURITIS_VIEW_STATE);
  const [hoverInfo, setHoverInfo] = useState<any>(null);

  // R1: Base Map Toggle: "satellite" vs "mapbiomas" (replaced legacy "carto")
  const [mapBaseMode, setMapBaseMode] = useState<"satellite" | "mapbiomas">("satellite");

  // R1 & R2: MapBiomas Thematic Layer Switcher state for all 9 themes
  const [mapBiomasPanelOpen, setMapBiomasPanelOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isAuditCardVisible, setIsAuditCardVisible] = useState(true);
  const [legendOpen, setLegendOpen] = useState(false);
  const [activeLegendTheme, setActiveLegendTheme] = useState<string | null>(null);
  const [failedLayers, setFailedLayers] = useState<string[]>([]);
  const [activeThemes, setActiveThemes] = useState<Record<string, ActiveThemeState>>(() => {
    const initial: Record<string, ActiveThemeState> = {};
    MAPBIOMAS_THEMES.forEach((theme) => {
      initial[theme.id] = {
        enabled: theme.id === "cobertura", // Cobertura enabled by default
        opacity: theme.defaultOpacity,
        year: theme.availableYears[0],
      };
    });
    return initial;
  });

  // Satellite and MapBiomas Brasil base map style configurations
  const mapStyles = useMemo(
    () => ({
      satellite: {
        version: 8,
        sources: {
          "esri-satellite": {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "© ESRI World Imagery / Alta Resolução",
          },
        },
        layers: [
          {
            id: "satellite-layer",
            type: "raster",
            source: "esri-satellite",
            minzoom: 0,
            maxzoom: 20,
          },
        ],
      },
      mapbiomas: {
        version: 8,
        sources: {
          "carto-dark": {
            type: "raster",
            tiles: ["https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png"],
            tileSize: 256,
            attribution: "© CartoDB",
          },
          "mapbiomas-coverage-base": {
            type: "raster",
            tiles: [
              "https://geoserver.mapbiomas.org/geoserver/wms?service=WMS&version=1.1.1&request=GetMap&layers=mapbiomas:mapbiomas_coverage&styles=solved:mapbiomas_legend&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&format=image/png&transparent=true",
            ],
            tileSize: 256,
            attribution: "© MapBiomas Brasil (Coleção 9.0 Uso e Cobertura)",
          },
        },
        layers: [
          {
            id: "carto-bg",
            type: "raster",
            source: "carto-dark",
            minzoom: 0,
            maxzoom: 20,
          },
          {
            id: "mapbiomas-base-layer",
            type: "raster",
            source: "mapbiomas-coverage-base",
            minzoom: 0,
            maxzoom: 20,
            paint: {
              "raster-opacity": 0.9,
            },
          },
        ],
      },
    }),
    []
  );

  // Initialize MapLibre GL map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyles[mapBaseMode] as any,
      center: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom,
      pitch: viewState.pitch,
      bearing: viewState.bearing,
      interactive: false,
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mapBaseMode, mapStyles]);

  // Sync camera between DeckGL and MapLibre
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.jumpTo({
        center: [viewState.longitude, viewState.latitude],
        zoom: viewState.zoom,
        bearing: viewState.bearing,
        pitch: viewState.pitch,
      });
    }
  }, [viewState]);

  // Fly to selected parcel centroid
  useEffect(() => {
    if (selectedParcel && selectedParcel.geojson_boundary?.geometry?.coordinates) {
      const coords = selectedParcel.geojson_boundary.geometry.coordinates;
      let centerLon = -46.604;
      let centerLat = -15.435;

      try {
        const ring = (coords as any)[0];
        if (ring && ring.length > 0) {
          let sumLon = 0;
          let sumLat = 0;
          const count = ring.length > 1 ? ring.length - 1 : ring.length;
          for (let i = 0; i < count; i++) {
            sumLon += ring[i][0];
            sumLat += ring[i][1];
          }
          centerLon = sumLon / count;
          centerLat = sumLat / count;
        }
      } catch (e) {
        // default fallback
      }

      setViewState((prev) => ({
        ...prev,
        longitude: centerLon,
        latitude: centerLat,
        zoom: 13.2,
        transitionDuration: 1200,
      }));
    }
  }, [selectedParcel]);

  // Count active MapBiomas thematic layers
  const activeThemeCount = useMemo(() => {
    return Object.values(activeThemes).filter((t) => t.enabled).length;
  }, [activeThemes]);

  // Toggle individual MapBiomas theme
  const handleToggleTheme = (themeId: string) => {
    setActiveThemes((prev) => ({
      ...prev,
      [themeId]: {
        ...prev[themeId],
        enabled: !prev[themeId]?.enabled,
      },
    }));
  };

  // Update theme opacity
  const handleThemeOpacityChange = (themeId: string, opacity: number) => {
    setActiveThemes((prev) => ({
      ...prev,
      [themeId]: {
        ...prev[themeId],
        opacity,
      },
    }));
  };

  // Update theme year
  const handleThemeYearChange = (themeId: string, year: number) => {
    setActiveThemes((prev) => ({
      ...prev,
      [themeId]: {
        ...prev[themeId],
        year,
      },
    }));
  };

  // Quick preset loader for Bank & Barter workflows
  const handleApplyPreset = (preset: "banking" | "esg" | "climate" | "all" | "none") => {
    setActiveThemes((prev) => {
      const updated: Record<string, ActiveThemeState> = {};
      MAPBIOMAS_THEMES.forEach((t) => {
        let enabled = false;
        if (preset === "all") enabled = true;
        else if (preset === "none") enabled = false;
        else if (preset === "banking") {
          enabled = t.id === "cobertura" || t.id === "agricultura";
        } else if (preset === "esg") {
          enabled = t.id === "desmatamento" || t.id === "vegetacao_secundaria" || t.id === "degradacao";
        } else if (preset === "climate") {
          enabled = t.id === "fogo" || t.id === "agua" || t.id === "solo";
        }
        updated[t.id] = {
          enabled,
          opacity: prev[t.id]?.opacity ?? t.defaultOpacity,
          year: prev[t.id]?.year ?? t.availableYears[0],
        };
      });
      return updated;
    });
    setIsAuditCardVisible(true);
  };

  // Prepare GeoJSON collection for Polígonos Cadastrados (Glebas)
  const parcelsGeoJson = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: parcels.map((p) => ({
        ...p.geojson_boundary,
        properties: {
          ...p.geojson_boundary.properties,
          parcelId: p.id,
          name: p.name,
          carCode: p.car_code,
          areaHa: p.metrics_json.total_area_ha,
          isEmbargoed: p.compliance_ibama.is_embargoed,
          isSelected: selectedParcel?.id === p.id,
          category: "parcel",
          nomenclature: "Polígono Cadastrado (Gleba)",
        },
      })),
    };
  }, [parcels, selectedParcel]);

  // R2: Spatial Data for APP Hídrica (Rio Urucuia - 26.91 ha)
  const appGeoJson = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            id: "app-hidrica-rio-urucuia",
            name: "APP Hídrica (Rio Urucuia)",
            nomenclature: "APP Hídrica (Rio Urucuia)",
            category: "app",
            areaHa: 26.91,
            watershed: "Bacia do Rio São Francisco / Sub-bacia Rio Urucuia",
          },
          geometry: {
            type: "Polygon",
            coordinates: [BURITIS_APP_COORDINATES],
          },
        },
      ],
    };
  }, []);

  const appPathData = useMemo(() => {
    return [
      {
        path: BURITIS_APP_COORDINATES,
        properties: {
          category: "app",
          name: "APP Hídrica (Rio Urucuia)",
          areaHa: 26.91,
        },
      },
    ];
  }, []);

  // R2: Spatial Data for Reserva Legal Cerrado (43.42 ha)
  const reserveGeoJson = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            id: "reserva-legal-cerrado",
            name: "Reserva Legal Cerrado",
            nomenclature: "Reserva Legal Cerrado",
            category: "legal_reserve",
            areaHa: 43.42,
            biome: "Cerrado Nativo • Preservação 20%",
          },
          geometry: {
            type: "Polygon",
            coordinates: [BURITIS_RESERVA_LEGAL_COORDINATES],
          },
        },
      ],
    };
  }, []);

  const reservePathData = useMemo(() => {
    return [
      {
        path: BURITIS_RESERVA_LEGAL_COORDINATES,
        properties: {
          category: "legal_reserve",
          name: "Reserva Legal Cerrado",
          areaHa: 43.42,
        },
      },
    ];
  }, []);

  // R2 & MapBiomas: Spatial Data for Lavoura / Uso Agrícola (MapBiomas Classe 39 - Soja - 146.79 ha)
  const agricultureGeoJson = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            id: "lavoura-soja-buritis",
            name: "Lavoura Anual de Soja (Safra)",
            nomenclature: "Área Agrícola Consolidada (Coleção 9.0)",
            category: "agriculture",
            areaHa: 146.79,
            crop: "Soja Safra / Rotação Milho Safrinha",
            status: "Apto para Financiamento / CPR",
          },
          geometry: {
            type: "Polygon",
            coordinates: [BURITIS_AGRICULTURE_COORDINATES],
          },
        },
      ],
    };
  }, []);

  const agriculturePathData = useMemo(() => {
    return [
      {
        path: BURITIS_AGRICULTURE_COORDINATES,
        properties: {
          category: "agriculture",
          name: "Lavoura Anual de Soja (Safra)",
          areaHa: 146.79,
        },
      },
    ];
  }, []);

  // Helper to convert XYZ tile to Web Mercator EPSG:3857 bounding box
  const tileToEPSG3857 = (x: number, y: number, z: number): [number, number, number, number] => {
    const tileSize = 20037508.342789244;
    const numTiles = 1 << z;
    const tileWidth = (tileSize * 2) / numTiles;
    const minX = -tileSize + x * tileWidth;
    const maxX = -tileSize + (x + 1) * tileWidth;
    const maxY = tileSize - y * tileWidth;
    const minY = tileSize - (y + 1) * tileWidth;
    return [minX, minY, maxX, maxY];
  };

  // Build Deck.gl layers: MapBiomas Thematic Raster Tiles + Distinct Territorial Boundaries
  const layers = useMemo(() => {
    const layerList: any[] = [];

    // 1. R1: MapBiomas Thematic Raster Overlay Layers (when enabled in switcher)
    MAPBIOMAS_THEMES.forEach((theme) => {
      const config = activeThemes[theme.id];
      if (config && config.enabled) {
        layerList.push(
          new TileLayer({
            id: `mapbiomas-tile-${theme.id}`,
            minZoom: 0,
            maxZoom: 20,
            tileSize: 256,
            opacity: config.opacity,
            getTileData: async ({ index: { x, y, z }, signal }: any) => {
              try {
                const [minX, minY, maxX, maxY] = tileToEPSG3857(x, y, z);
                const bboxStr = `${minX},${minY},${maxX},${maxY}`;
                const url = `https://geoserver.mapbiomas.org/geoserver/wms?service=WMS&version=1.1.1&request=GetMap&layers=${theme.wmsLayer}&styles=${theme.wmsParams?.styles || ""}&bbox=${bboxStr}&width=256&height=256&srs=EPSG:3857&format=image/png&transparent=true&time=${config.year}`;
                const res = await fetch(url, { signal, mode: "cors" });
                if (!res.ok) {
                  setFailedLayers((prev) => prev.includes(theme.title) ? prev : [...prev, theme.title]);
                  return null;
                }
                const blob = await res.blob();
                return await createImageBitmap(blob);
              } catch (e: any) {
                if (e?.name !== "AbortError") {
                  setFailedLayers((prev) => prev.includes(theme.title) ? prev : [...prev, theme.title]);
                }
                return null;
              }
            },
            onTileError: () => {
              setFailedLayers((prev) => prev.includes(theme.title) ? prev : [...prev, theme.title]);
            },
            renderSubLayers: (props: any) => {
              const { bbox, boundingBox } = props.tile || {};
              let bounds: [number, number, number, number] = [0, 0, 0, 0];
              if (bbox) {
                bounds = Array.isArray(bbox)
                  ? [bbox[0], bbox[1], bbox[2], bbox[3]]
                  : [bbox.west, bbox.south, bbox.east, bbox.north];
              } else if (boundingBox && boundingBox[0] && boundingBox[1]) {
                bounds = [
                  boundingBox[0][0],
                  boundingBox[0][1],
                  boundingBox[1][0],
                  boundingBox[1][1],
                ];
              }
              if (!props.data) return null;
              return new BitmapLayer(props, {
                data: undefined,
                image: props.data,
                bounds,
              });
            },
          })
        );
      }
    });

    // 2. R2: Boundary 1 — Polígono Cadastrado (Gleba): Radar Emerald (#00e676, solid border 3px)
    layerList.push(
      new GeoJsonLayer({
        id: "brasil-parcels-layer",
        data: parcelsGeoJson as any,
        pickable: true,
        stroked: true,
        filled: true,
        lineWidthUnits: "pixels",
        getLineWidth: (f: any) => (f.properties?.isSelected ? 4 : 3),
        getLineColor: (f: any) => {
          if (f.properties?.isSelected) return [0, 230, 118, 255]; // #00e676 Radar Emerald
          if (f.properties?.isEmbargoed) return [239, 68, 68, 255]; // #ef4444 Hazard Red
          return [0, 230, 118, 255];
        },
        getFillColor: (f: any) => {
          if (f.properties?.isSelected) return [0, 230, 118, 80];
          if (f.properties?.isEmbargoed) return [239, 68, 68, 90];
          return [0, 230, 118, 35]; // semi-transparent radar emerald fill
        },
        updateTriggers: {
          getLineWidth: [selectedParcel?.id],
          getLineColor: [selectedParcel?.id],
          getFillColor: [selectedParcel?.id],
        },
        onHover: (info: any) => setHoverInfo(info),
        onClick: (info: any) => {
          if (info.object && info.object.properties) {
            const found = parcels.find((p) => p.id === info.object.properties.parcelId);
            if (found) onSelectParcel(found);
          }
        },
      })
    );

    // 3. MapBiomas Thematic Vector Layer: Lavoura de Soja / Safra Agrícola (Coleção 9.0 - Classe 39)
    const isAgriActive = activeThemes.agricultura?.enabled || activeThemes.cobertura?.enabled;
    if (isAgriActive) {
      const agriOpacity = activeThemes.agricultura?.enabled
        ? activeThemes.agricultura.opacity
        : (activeThemes.cobertura?.opacity ?? 0.8) * 0.7;

      layerList.push(
        new GeoJsonLayer({
          id: "mapbiomas-thematic-agriculture-fill",
          data: agricultureGeoJson as any,
          pickable: true,
          stroked: true,
          filled: true,
          lineWidthUnits: "pixels",
          getLineWidth: 2,
          getLineColor: [233, 116, 237, 230], // #e974ed MapBiomas Agriculture pink
          getFillColor: [233, 116, 237, Math.round(agriOpacity * 160)],
          onHover: (info: any) => setHoverInfo(info),
        })
      );

      layerList.push(
        new PathLayer({
          id: "mapbiomas-thematic-agriculture-path",
          data: agriculturePathData,
          getPath: (d: any) => d.path,
          getColor: [233, 116, 237, 255],
          getWidth: 2.5,
          widthUnits: "pixels",
          extensions: [pathDashExtension as any],
          getDashArray: [6, 3],
          dashUnits: "pixels",
          pickable: true,
          onHover: (info: any) => setHoverInfo(info),
        })
      );
    }

    // 4. R2: Boundary 2 — APP Hídrica (Rio Urucuia): Water Cyan (#00e5ff, dashed line [8, 4], cyan fill)
    layerList.push(
      new GeoJsonLayer({
        id: "app-hidrica-fill-layer",
        data: appGeoJson as any,
        pickable: true,
        stroked: false,
        filled: true,
        getFillColor: [0, 229, 255, 75], // semi-transparent cyan fill (~30% opacity)
        onHover: (info: any) => setHoverInfo(info),
      })
    );

    layerList.push(
      new PathLayer({
        id: "app-hidrica-dashed-path",
        data: appPathData,
        getPath: (d: any) => d.path,
        getColor: [0, 229, 255, 255], // #00e5ff Water Cyan
        getWidth: 3,
        widthUnits: "pixels",
        extensions: [pathDashExtension as any],
        getDashArray: [8, 4], // 8px dash, 4px gap
        dashUnits: "pixels",
        pickable: true,
        onHover: (info: any) => setHoverInfo(info),
      })
    );

    // 5. R2: Boundary 3 — Reserva Legal Cerrado: Deep Forest Green (#15803d, dotted line [2, 3], green fill)
    layerList.push(
      new GeoJsonLayer({
        id: "reserva-legal-fill-layer",
        data: reserveGeoJson as any,
        pickable: true,
        stroked: false,
        filled: true,
        getFillColor: [21, 128, 61, 90], // semi-transparent deep forest green fill (~35% opacity)
        onHover: (info: any) => setHoverInfo(info),
      })
    );

    layerList.push(
      new PathLayer({
        id: "reserva-legal-dotted-path",
        data: reservePathData,
        getPath: (d: any) => d.path,
        getColor: [21, 128, 61, 255], // #15803d Deep Forest Green
        getWidth: 3,
        widthUnits: "pixels",
        extensions: [pathDashExtension as any],
        getDashArray: [2, 3], // 2px dot, 3px gap
        dashUnits: "pixels",
        pickable: true,
        onHover: (info: any) => setHoverInfo(info),
      })
    );

    return layerList;
  }, [
    activeThemes,
    parcelsGeoJson,
    agricultureGeoJson,
    agriculturePathData,
    appGeoJson,
    appPathData,
    reserveGeoJson,
    reservePathData,
    parcels,
    selectedParcel,
    onSelectParcel,
  ]);

  // Function to download the complete GeoJSON of available areas
  const handleDownloadGeoJson = () => {
    const exportData = {
      type: "FeatureCollection",
      features: [
        ...parcelsGeoJson.features,
        ...agricultureGeoJson.features,
        ...appGeoJson.features,
        ...reserveGeoJson.features,
      ],
    };
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    const filename =
      selectedParcel
        ? `malha_${selectedParcel.municipality.toLowerCase()}_${selectedParcel.state_uf.toLowerCase()}_completa.geojson`
        : "malha_agrostech_brasil_completa.geojson";
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="relative w-full h-full bg-[#050505] overflow-hidden">
      {/* MapLibre Satellite / MapBiomas Base Map */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Deck.gl Vector & Thematic Overlay */}
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState as any)}
        controller={true}
        layers={layers}
        getCursor={({ isHovering }) => (isHovering ? "pointer" : "default")}
      />

      {/* Top Controls: Satellite / MapBiomas Toggle, MapBiomas Switcher & Download */}
      <div className="absolute top-2 right-2 left-2 sm:top-4 sm:right-4 sm:left-auto z-20 flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
        {/* Layer Error Notice Chip */}
        {failedLayers.length > 0 && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono backdrop-blur-md shadow-lg animate-pulse"
            role="status"
            aria-live="polite"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Camada indisponível ({failedLayers.join(", ")})</span>
            <button
              onClick={() => setFailedLayers([])}
              className="ml-1 text-amber-300 hover:text-white"
              aria-label="Dispensar aviso de erro de camada"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* R1: Base Map Toggle: Satélite Real vs MapBiomas Brasil (Uso e Cobertura) */}
        <div className="bg-[#0a0d10]/90 backdrop-blur-md border border-[#1f242b] p-1 rounded-md flex items-center gap-1 shadow-lg text-xs font-mono">
          <button
            onClick={() => setMapBaseMode("satellite")}
            className={`px-2.5 py-2 sm:py-1 min-h-9 sm:min-h-0 rounded flex items-center gap-1.5 transition-all ${
              mapBaseMode === "satellite"
                ? "bg-[#00e676] text-black font-semibold shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
            title="Visualização com imagens orbitais de alta resolução"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Satélite<span className="hidden sm:inline"> Real</span></span>
          </button>
          <button
            onClick={() => setMapBaseMode("mapbiomas")}
            className={`px-2.5 py-2 sm:py-1 min-h-9 sm:min-h-0 rounded flex items-center gap-1.5 transition-all ${
              mapBaseMode === "mapbiomas"
                ? "bg-[#00e676] text-black font-semibold shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
            title="Base temática oficial de Uso e Cobertura do MapBiomas Brasil"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>MapBiomas<span className="hidden sm:inline"> Brasil (Uso e Cobertura)</span></span>
          </button>
        </div>

        {/* R1: MapBiomas Layer Switcher Panel Button */}
        <button
          onClick={() => setMapBiomasPanelOpen(!mapBiomasPanelOpen)}
          aria-label="Camadas MapBiomas"
          className={`px-3 py-2 sm:py-1.5 min-h-9 sm:min-h-0 rounded-md flex items-center gap-1.5 text-xs font-mono shadow-lg transition-all border ${
            mapBiomasPanelOpen
              ? "bg-[#00e676] text-black border-[#00e676] font-semibold"
              : activeThemeCount > 0
              ? "bg-[#12171e] text-[#00e676] border-[#00e676]/60 hover:bg-[#1a232f]"
              : "bg-[#0a0d10]/90 text-gray-300 border-[#1f242b] hover:text-white hover:border-gray-500"
          }`}
          title="Abrir painel de controle e camadas temáticas do MapBiomas Brasil"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span><span className="sm:hidden">Camadas</span><span className="hidden sm:inline">Camadas MapBiomas</span></span>
          {activeThemeCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#00e676] text-black text-xs font-bold flex items-center justify-center ml-0.5">
              {activeThemeCount}
            </span>
          )}
        </button>

        {/* Download Malha GeoJSON */}
        <button
          onClick={handleDownloadGeoJson}
          aria-label="Baixar Malha (GeoJSON)"
          className="bg-[#0a0d10]/90 hover:bg-[#12171e] text-[#00e676] border border-[#1f242b] hover:border-[#00e676]/60 px-3 py-2 sm:py-1.5 min-h-9 sm:min-h-0 rounded-md flex items-center gap-1.5 text-xs font-mono shadow-lg transition-all"
          title="Baixar limites territoriais em formato GeoJSON"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Baixar Malha (GeoJSON)</span>
        </button>
      </div>

      {/* R1: Dedicated MapBiomas Layer Switcher UI Panel */}
      {mapBiomasPanelOpen && (
        <div className="fixed inset-x-2 top-20 bottom-3 sm:absolute sm:inset-auto sm:top-16 sm:right-4 z-50 sm:z-30 sm:w-96 md:w-[420px] sm:max-h-[calc(100dvh-6rem)] bg-white/95 dark:bg-[#0a0d10]/95 backdrop-blur-md border border-slate-200 dark:border-[#1f242b] rounded-xl shadow-2xl flex flex-col font-sans text-xs overflow-hidden transition-all">
          {/* Panel Header */}
          <div className="p-3.5 border-b border-slate-200 dark:border-[#1f242b] flex items-center justify-between bg-slate-50 dark:bg-[#12171e]/90">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#00e676] flex items-center justify-center border border-emerald-300 dark:border-emerald-800">
                <Layers3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-xs">
                  MapBiomas Brasil — 9 Temas
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 font-mono">
                  OGC WMS & MapBiomas Alerta v2 (Coleção 9.0)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#00e676] border border-emerald-300 dark:border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#00e676] animate-pulse" />
                API Online
              </span>
              <button
                onClick={() => setMapBiomasPanelOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded hover:bg-slate-200 dark:hover:bg-[#1f242b] transition-colors"
                title="Fechar painel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Workflow Guide Banner */}
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00e676]" />
              <span className="font-semibold">Workflows Bancários & Barter</span>
            </div>
            <button
              onClick={() => setIsWorkflowModalOpen(true)}
              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
            >
              <BookOpen className="w-3 h-3" />
              <span>Ver Guia (3 Fluxos)</span>
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="p-2.5 bg-slate-100/70 dark:bg-[#080b0e] border-b border-slate-200 dark:border-[#1f242b] space-y-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-gray-400 block font-semibold">
              Filtros Rápidos / Presets:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => handleApplyPreset("banking")}
                className="px-2 py-1 rounded bg-white dark:bg-[#151c24] hover:bg-slate-50 dark:hover:bg-[#1a232f] border border-slate-300 dark:border-[#2a3441] text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 transition-all"
                title="Ativar Cobertura e Agricultura para cálculo da Área Útil M1"
              >
                <Wheat className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Padrão Bancário (M1)
              </button>
              <button
                onClick={() => handleApplyPreset("esg")}
                className="px-2 py-1 rounded bg-white dark:bg-[#151c24] hover:bg-slate-50 dark:hover:bg-[#1a232f] border border-slate-300 dark:border-[#2a3441] text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 transition-all"
                title="Ativar Desmatamento e Vegetação Secundária para auditoria EUDR/CMN"
              >
                <ShieldCheck className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                Auditoria ESG (EUDR)
              </button>
              <button
                onClick={() => handleApplyPreset("climate")}
                className="px-2 py-1 rounded bg-white dark:bg-[#151c24] hover:bg-slate-50 dark:hover:bg-[#1a232f] border border-slate-300 dark:border-[#2a3441] text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 transition-all"
                title="Ativar Fogo, Água e Solo para Seguro Rural"
              >
                <Activity className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                Risco Fogo & Seguro
              </button>
              <button
                onClick={() => handleApplyPreset("all")}
                className="px-2 py-1 rounded bg-white dark:bg-[#151c24] hover:bg-slate-50 dark:hover:bg-[#1a232f] border border-slate-300 dark:border-[#2a3441] text-xs font-medium text-slate-800 dark:text-slate-200 transition-all"
              >
                Todas
              </button>
              <button
                onClick={() => handleApplyPreset("none")}
                className="px-2 py-1 rounded bg-white dark:bg-[#151c24] hover:bg-slate-50 dark:hover:bg-[#1a232f] border border-slate-300 dark:border-[#2a3441] text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
              >
                Limpar
              </button>
            </div>
          </div>

          {/* Panel Layer List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-100 dark:divide-[#1f242b]/60">
            {MAPBIOMAS_THEMES.map((theme) => {
              const config = activeThemes[theme.id];
              const isEnabled = config?.enabled ?? false;
              const isLegendOpen = activeLegendTheme === theme.id;

              return (
                <div key={theme.id} className="pt-2 first:pt-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      <button
                        onClick={() => handleToggleTheme(theme.id)}
                        className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-all ${
                          isEnabled
                            ? "bg-[#00e676] border-[#00e676] text-black"
                            : "border-slate-300 dark:border-gray-600 bg-slate-100 dark:bg-black/40 hover:border-slate-400 dark:hover:border-gray-400"
                        }`}
                        title={isEnabled ? "Desativar camada" : "Ativar camada"}
                      >
                        {isEnabled && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            {theme.title}
                          </span>
                          <span
                            className="w-2.5 h-2.5 rounded-full shadow-sm"
                            style={{ backgroundColor: theme.activeColor }}
                            title="Cor representativa do tema"
                          />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 leading-snug">
                          {theme.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setActiveLegendTheme(isLegendOpen ? null : theme.id)
                      }
                      className="text-xs text-slate-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-[#00e676] flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-slate-200 dark:border-[#1f242b]"
                      title="Ver legenda de classes"
                    >
                      Legenda
                      {isLegendOpen ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {/* Active Layer Controls: Opacity & Year */}
                  {isEnabled && (
                    <div className="pl-6 pr-1 pt-1 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-slate-500 dark:text-gray-400">Opacidade:</span>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={config?.opacity ?? 0.8}
                          onChange={(e) =>
                            handleThemeOpacityChange(
                              theme.id,
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-24 accent-[#00e676] cursor-pointer"
                        />
                        <span className="text-slate-700 dark:text-gray-300 w-8 font-mono">
                          {Math.round((config?.opacity ?? 0.8) * 100)}%
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 dark:text-gray-400">Ano:</span>
                        <select
                          value={config?.year ?? theme.availableYears[0]}
                          onChange={(e) =>
                            handleThemeYearChange(theme.id, parseInt(e.target.value))
                          }
                          className="bg-slate-100 dark:bg-[#050505] border border-slate-300 dark:border-[#1f242b] rounded px-1.5 py-0.5 text-emerald-700 dark:text-[#00e676] font-bold focus:outline-none focus:border-[#00e676]"
                        >
                          {theme.availableYears.map((yr) => (
                            <option key={yr} value={yr}>
                              {yr}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Expandable Legend Swatches */}
                  {isLegendOpen && (
                    <div className="pl-6 pr-2 py-1.5 bg-slate-50 dark:bg-[#050505]/70 rounded-lg border border-slate-200 dark:border-[#1f242b] mt-1 grid grid-cols-2 gap-1 text-xs">
                      {theme.legend.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-sm flex-shrink-0 border border-black/20"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-slate-700 dark:text-gray-300 truncate" title={item.label}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Panel Footer */}
          <div className="p-2.5 bg-slate-50 dark:bg-[#12171e] border-t border-slate-200 dark:border-[#1f242b] flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
            <span>Fonte: MapBiomas Brasil (Coleção 9 / Alerta)</span>
            <button
              onClick={() => handleApplyPreset("none")}
              className="text-xs text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white underline"
            >
              Limpar todas
            </button>
          </div>
        </div>
      )}

      {/* MapBiomas Thematic On-Map Audit Card */}
      {activeThemeCount > 0 && isAuditCardVisible && (
        <MapBiomasThematicAuditCard
          selectedParcel={selectedParcel}
          activeThemeCount={activeThemeCount}
          activeYear={activeThemes.cobertura?.year ?? 2023}
          onOpenWorkflowGuide={() => setIsWorkflowModalOpen(true)}
          onClose={() => setIsAuditCardVisible(false)}
        />
      )}

      {/* Button to reopen Audit Card if closed */}
      {activeThemeCount > 0 && !isAuditCardVisible && (
        <button
          onClick={() => setIsAuditCardVisible(true)}
          className="absolute bottom-[68px] left-2 sm:bottom-auto sm:top-16 sm:left-4 z-20 px-3 py-2 sm:py-1.5 rounded-lg bg-white/95 dark:bg-[#11141c]/95 border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-lg flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all font-sans"
          title="Reabrir Auditoria Temática MapBiomas"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Auditoria MapBiomas ({activeThemeCount})</span>
        </button>
      )}

      {/* MapBiomas Workflow Modal */}
      <MapBiomasWorkflowModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
      />

      {/* Centroid Coordinates HUD (Nationwide Scope) */}
      <div className="hidden sm:flex absolute top-4 left-4 z-20 bg-[#0a0d10]/90 backdrop-blur-md border border-[#1f242b] px-3 py-1.5 rounded-md text-xs font-mono items-center gap-3 text-gray-300 shadow-lg">
        <span className="text-[#00e676] font-bold">
          {selectedParcel
            ? `${selectedParcel.municipality.toUpperCase()} / ${selectedParcel.state_uf}`
            : "GLEBAS MAPEADAS NO BRASIL"}
        </span>
        <span className="text-gray-600">|</span>
        <span>LAT: {Math.abs(viewState.latitude).toFixed(4)}° S</span>
        <span>LON: {Math.abs(viewState.longitude).toFixed(4)}° W</span>
      </div>

      {/* R2: Dynamic Hover Tooltip with Distinct Border & Badges */}
      {hoverInfo && hoverInfo.object && (
        <div
          className={`pointer-events-none absolute z-50 bg-[#0a0d10]/95 backdrop-blur-md px-3.5 py-2.5 rounded-lg shadow-xl text-xs font-mono transition-all border ${
            hoverInfo.object.properties?.category === "app"
              ? "border-[#00e5ff] shadow-[#00e5ff]/15"
              : hoverInfo.object.properties?.category === "legal_reserve"
              ? "border-[#15803d] shadow-[#15803d]/20"
              : hoverInfo.object.properties?.category === "agriculture"
              ? "border-[#e974ed] shadow-[#e974ed]/20"
              : "border-[#00e676] shadow-[#00e676]/15"
          }`}
          style={{ left: hoverInfo.x + 14, top: hoverInfo.y + 14 }}
        >
          {/* Category Badge & Layer Title */}
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="font-bold text-white text-xs">
              {hoverInfo.object.properties?.name || "Limite Territorial"}
            </span>
            {hoverInfo.object.properties?.category === "app" && (
              <span className="text-xs bg-[#00e5ff]/20 text-[#00e5ff] px-1.5 py-0.5 rounded border border-[#00e5ff]/50 font-bold uppercase">
                APP Hídrica
              </span>
            )}
            {hoverInfo.object.properties?.category === "legal_reserve" && (
              <span className="text-xs bg-[#15803d]/30 text-[#4ade80] px-1.5 py-0.5 rounded border border-[#15803d] font-bold uppercase">
                Reserva Legal
              </span>
            )}
            {hoverInfo.object.properties?.category === "agriculture" && (
              <span className="text-xs bg-[#e974ed]/20 text-[#e974ed] px-1.5 py-0.5 rounded border border-[#e974ed]/50 font-bold uppercase">
                Lavoura Soja (Classe 39)
              </span>
            )}
            {hoverInfo.object.properties?.category === "parcel" && (
              <span className="text-xs bg-[#00e676]/20 text-[#00e676] px-1.5 py-0.5 rounded border border-[#00e676]/50 font-bold uppercase">
                Gleba Cadastrada
              </span>
            )}
          </div>

          {/* Area Metric */}
          <div
            className={`text-xs font-bold ${
              hoverInfo.object.properties?.category === "app"
                ? "text-[#00e5ff]"
                : hoverInfo.object.properties?.category === "legal_reserve"
                ? "text-[#4ade80]"
                : hoverInfo.object.properties?.category === "agriculture"
                ? "text-[#e974ed]"
                : "text-[#00e676]"
            }`}
          >
            Área:{" "}
            {hoverInfo.object.properties?.areaHa
              ? Number(hoverInfo.object.properties.areaHa).toFixed(2)
              : "--"}{" "}
            ha
          </div>

          {/* Regulatory Context */}
          {hoverInfo.object.properties?.category === "app" && (
            <div className="text-gray-400 text-xs mt-0.5">
              Bacia: Rio São Francisco (Sub-bacia Rio Urucuia) • Buffer Legal
            </div>
          )}
          {hoverInfo.object.properties?.category === "legal_reserve" && (
            <div className="text-gray-400 text-xs mt-0.5">
              Bioma: Cerrado Nativo • Preservação 20% SIRGAS 2000
            </div>
          )}
          {hoverInfo.object.properties?.category === "agriculture" && (
            <div className="text-gray-400 text-xs mt-0.5">
              Safra Soja 2024/25 • Rotação Milho • Apto Financiamento CPR (CMN 5.267)
            </div>
          )}
          {hoverInfo.object.properties?.category === "parcel" &&
            hoverInfo.object.properties?.carCode && (
              <div className="text-gray-400 text-xs mt-0.5">
                CAR: {hoverInfo.object.properties.carCode.slice(0, 20)}...
              </div>
            )}
        </div>
      )}

      {/* R2: Map HUD Legend with Solid, Dashed, and Dotted Pattern Swatches */}
      <button
        type="button"
        onClick={() => setLegendOpen((v) => !v)}
        aria-expanded={legendOpen}
        className="sm:hidden absolute bottom-[68px] right-2 z-20 min-h-9 px-3 rounded-md bg-[#0a0d10]/95 border border-[#1f242b] text-xs font-mono text-[#00e676] shadow-lg"
      >
        {legendOpen ? "Fechar legenda" : "Legenda"}
      </button>
      <div
        className={`${
          legendOpen ? "block" : "hidden"
        } sm:block absolute bottom-[110px] right-2 left-2 sm:left-auto sm:bottom-6 sm:right-6 z-20 bg-[#0a0d10]/95 backdrop-blur-md border border-[#1f242b] p-3 rounded-lg text-xs font-mono space-y-2 shadow-xl sm:min-w-[250px] max-h-[calc(100%-4rem)] overflow-y-auto`}
      >
        <div className="text-gray-400 font-semibold text-xs uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>Camadas Territoriais</span>
          <span className="text-[#00e676] text-xs font-bold">SIGEF / SICAR</span>
        </div>

        {/* 1. Polígono Cadastrado (Gleba) - Radar Emerald Solid */}
        <div className="flex items-center gap-2.5 text-gray-200">
          <span className="w-5 h-3 rounded-sm bg-[#00e676]/30 border-2 border-[#00e676] inline-block shadow-sm" />
          <span className="font-medium text-xs">Polígono Cadastrado (Gleba)</span>
        </div>

        {/* 2. Lavoura de Soja (MapBiomas Classe 39) */}
        {(activeThemes.agricultura?.enabled || activeThemes.cobertura?.enabled) && (
          <div className="flex items-center gap-2.5 text-gray-200">
            <span
              className="w-5 h-3 rounded-sm bg-[#e974ed]/30 border-2 border-[#e974ed] inline-block shadow-sm"
              style={{ borderStyle: "solid" }}
            />
            <span className="font-medium text-xs">Lavoura Soja (146,79 ha)</span>
          </div>
        )}

        {/* 3. APP Hídrica (Rio Urucuia) - Water Cyan Dashed */}
        <div className="flex items-center gap-2.5 text-gray-200">
          <span
            className="w-5 h-3 rounded-sm bg-[#00e5ff]/30 border-2 border-dashed border-[#00e5ff] inline-block shadow-sm"
            style={{ borderStyle: "dashed" }}
          />
          <span className="font-medium text-xs">APP Hídrica (Rio Urucuia)</span>
        </div>

        {/* 4. Reserva Legal Cerrado - Deep Forest Green Dotted */}
        <div className="flex items-center gap-2.5 text-gray-200">
          <span
            className="w-5 h-3 rounded-sm bg-[#15803d]/40 border-2 border-dotted border-[#15803d] inline-block shadow-sm"
            style={{ borderStyle: "dotted" }}
          />
          <span className="font-medium text-xs">Reserva Legal Cerrado</span>
        </div>

        {/* Active MapBiomas Theme indicator */}
        {activeThemeCount > 0 && (
          <div className="pt-2 mt-1 border-t border-[#1f242b]/80 space-y-1">
            <div className="text-xs uppercase tracking-wider text-gray-400 flex items-center justify-between">
              <span>MapBiomas Ativo ({activeThemeCount})</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] animate-pulse" />
            </div>
            {MAPBIOMAS_THEMES.filter((t) => activeThemes[t.id]?.enabled)
              .slice(0, 2)
              .map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-1.5 text-xs text-gray-300"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: t.activeColor }}
                  />
                  <span className="truncate">{t.title}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
