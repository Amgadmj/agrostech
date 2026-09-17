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
} from "@/lib/mockData";
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

  // R1: MapBiomas Thematic Layer Switcher state for all 9 themes
  const [mapBiomasPanelOpen, setMapBiomasPanelOpen] = useState(false);
  const [activeLegendTheme, setActiveLegendTheme] = useState<string | null>(null);
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

  // Build Deck.gl layers: MapBiomas Thematic Raster Tiles + Distinct Territorial Boundaries
  const layers = useMemo(() => {
    const layerList: any[] = [];

    // 1. R1: MapBiomas Thematic Raster Overlay Layers (when enabled in switcher)
    MAPBIOMAS_THEMES.forEach((theme) => {
      const config = activeThemes[theme.id];
      if (config && config.enabled) {
        const wmsUrlTemplate = `https://geoserver.mapbiomas.org/geoserver/wms?service=WMS&version=1.1.1&request=GetMap&layers=${theme.wmsLayer}&styles=${theme.wmsParams?.styles || ""}&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&format=image/png&transparent=true&time=${config.year}`;

        layerList.push(
          new TileLayer({
            id: `mapbiomas-tile-${theme.id}`,
            data: wmsUrlTemplate,
            minZoom: 0,
            maxZoom: 20,
            tileSize: 256,
            opacity: config.opacity,
            onTileError: (err: any) => {
              // Gracefully handle network interruptions without console noise
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

    // 3. R2: Boundary 2 — APP Hídrica (Rio Urucuia): Water Cyan (#00e5ff, dashed line [8, 4], cyan fill)
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

    // 4. R2: Boundary 3 — Reserva Legal Cerrado: Deep Forest Green (#15803d, dotted line [2, 3], green fill)
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
    <div className="relative w-full h-full bg-[#050505] overflow-hidden select-none">
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
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* R1: Base Map Toggle: Satélite Real vs MapBiomas Brasil (Uso e Cobertura) */}
        <div className="bg-[#0a0d10]/90 backdrop-blur-md border border-[#1f242b] p-1 rounded-md flex items-center gap-1 shadow-lg text-xs font-mono">
          <button
            onClick={() => setMapBaseMode("satellite")}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all ${
              mapBaseMode === "satellite"
                ? "bg-[#00e676] text-black font-semibold shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
            title="Visualização com imagens orbitais de alta resolução"
          >
            <Globe className="w-3.5 h-3.5" />
            Satélite Real
          </button>
          <button
            onClick={() => setMapBaseMode("mapbiomas")}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all ${
              mapBaseMode === "mapbiomas"
                ? "bg-[#00e676] text-black font-semibold shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
            title="Base temática oficial de Uso e Cobertura do MapBiomas Brasil"
          >
            <Layers className="w-3.5 h-3.5" />
            MapBiomas Brasil (Uso e Cobertura)
          </button>
        </div>

        {/* R1: MapBiomas Layer Switcher Panel Button */}
        <button
          onClick={() => setMapBiomasPanelOpen(!mapBiomasPanelOpen)}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-mono shadow-lg transition-all border ${
            mapBiomasPanelOpen
              ? "bg-[#00e676] text-black border-[#00e676] font-semibold"
              : activeThemeCount > 0
              ? "bg-[#12171e] text-[#00e676] border-[#00e676]/60 hover:bg-[#1a232f]"
              : "bg-[#0a0d10]/90 text-gray-300 border-[#1f242b] hover:text-white hover:border-gray-500"
          }`}
          title="Abrir painel de controle e camadas temáticas do MapBiomas Brasil"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Camadas MapBiomas</span>
          {activeThemeCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#00e676] text-black text-[10px] font-bold flex items-center justify-center ml-0.5">
              {activeThemeCount}
            </span>
          )}
        </button>

        {/* Download Malha GeoJSON */}
        <button
          onClick={handleDownloadGeoJson}
          className="bg-[#0a0d10]/90 hover:bg-[#12171e] text-[#00e676] border border-[#1f242b] hover:border-[#00e676]/60 px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-mono shadow-lg transition-all"
          title="Baixar limites territoriais em formato GeoJSON"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Baixar Malha (GeoJSON)</span>
        </button>
      </div>

      {/* R1: Dedicated MapBiomas Layer Switcher UI Panel */}
      {mapBiomasPanelOpen && (
        <div className="absolute top-16 right-4 z-30 w-96 md:w-[410px] max-h-[calc(100vh-6rem)] bg-[#0a0d10]/95 backdrop-blur-md border border-[#1f242b] rounded-lg shadow-2xl flex flex-col font-mono text-xs overflow-hidden">
          {/* Panel Header */}
          <div className="p-3.5 border-b border-[#1f242b] flex items-center justify-between bg-[#12171e]/90">
            <div className="flex items-center gap-2">
              <Layers3 className="w-4 h-4 text-[#00e676]" />
              <div>
                <h3 className="font-bold text-white text-xs">
                  MapBiomas Brasil — 9 Temas
                </h3>
                <p className="text-[10px] text-gray-400">
                  OGC WMS & MapBiomas Alerta v2
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[9px] bg-emerald-950/60 text-[#00e676] border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] animate-pulse" />
                API Online
              </span>
              <button
                onClick={() => setMapBiomasPanelOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#1f242b]"
                title="Fechar painel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Panel Layer List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-[#1f242b]/60">
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
                            : "border-gray-600 bg-black/40 hover:border-gray-400"
                        }`}
                        title={isEnabled ? "Desativar camada" : "Ativar camada"}
                      >
                        {isEnabled && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-[11px]">
                            {theme.title}
                          </span>
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: theme.activeColor }}
                            title="Cor representativa do tema"
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">
                          {theme.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setActiveLegendTheme(isLegendOpen ? null : theme.id)
                      }
                      className="text-[10px] text-gray-400 hover:text-[#00e676] flex items-center gap-0.5 px-1 py-0.5 rounded border border-[#1f242b]"
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
                    <div className="pl-6 pr-1 pt-1 flex items-center justify-between gap-3 text-[10px]">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-gray-400">Opacidade:</span>
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
                        <span className="text-gray-300 w-8">
                          {Math.round((config?.opacity ?? 0.8) * 100)}%
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">Ano:</span>
                        <select
                          value={config?.year ?? theme.availableYears[0]}
                          onChange={(e) =>
                            handleThemeYearChange(theme.id, parseInt(e.target.value))
                          }
                          className="bg-[#050505] border border-[#1f242b] rounded px-1.5 py-0.5 text-[#00e676] font-bold focus:outline-none focus:border-[#00e676]"
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
                    <div className="pl-6 pr-2 py-1.5 bg-[#050505]/70 rounded border border-[#1f242b] mt-1 grid grid-cols-2 gap-1 text-[9px]">
                      {theme.legend.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-sm flex-shrink-0 border border-black/50"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-gray-300 truncate" title={item.label}>
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
          <div className="p-2.5 bg-[#12171e] border-t border-[#1f242b] flex items-center justify-between text-[10px] text-gray-400">
            <span>Fonte: MapBiomas Brasil (Coleção 9 / Alerta)</span>
            <button
              onClick={() => {
                const allActive: Record<string, ActiveThemeState> = {};
                MAPBIOMAS_THEMES.forEach((t) => {
                  allActive[t.id] = {
                    enabled: false,
                    opacity: t.defaultOpacity,
                    year: t.availableYears[0],
                  };
                });
                setActiveThemes(allActive);
              }}
              className="text-xs text-gray-400 hover:text-white underline"
            >
              Limpar todas
            </button>
          </div>
        </div>
      )}

      {/* Centroid Coordinates HUD (Nationwide Scope) */}
      <div className="absolute top-4 left-4 z-20 bg-[#0a0d10]/90 backdrop-blur-md border border-[#1f242b] px-3 py-1.5 rounded-md text-[11px] font-mono flex items-center gap-3 text-gray-300 shadow-lg">
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
              <span className="text-[9px] bg-[#00e5ff]/20 text-[#00e5ff] px-1.5 py-0.5 rounded border border-[#00e5ff]/50 font-bold uppercase">
                APP Hídrica
              </span>
            )}
            {hoverInfo.object.properties?.category === "legal_reserve" && (
              <span className="text-[9px] bg-[#15803d]/30 text-[#4ade80] px-1.5 py-0.5 rounded border border-[#15803d] font-bold uppercase">
                Reserva Legal
              </span>
            )}
            {hoverInfo.object.properties?.category === "parcel" && (
              <span className="text-[9px] bg-[#00e676]/20 text-[#00e676] px-1.5 py-0.5 rounded border border-[#00e676]/50 font-bold uppercase">
                Gleba Cadastrada
              </span>
            )}
          </div>

          {/* Area Metric */}
          <div
            className={`text-[11px] font-bold ${
              hoverInfo.object.properties?.category === "app"
                ? "text-[#00e5ff]"
                : hoverInfo.object.properties?.category === "legal_reserve"
                ? "text-[#4ade80]"
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
            <div className="text-gray-400 text-[10px] mt-0.5">
              Bacia: Rio São Francisco (Sub-bacia Rio Urucuia) • Buffer Legal
            </div>
          )}
          {hoverInfo.object.properties?.category === "legal_reserve" && (
            <div className="text-gray-400 text-[10px] mt-0.5">
              Bioma: Cerrado Nativo • Preservação 20% SIRGAS 2000
            </div>
          )}
          {hoverInfo.object.properties?.category === "parcel" &&
            hoverInfo.object.properties?.carCode && (
              <div className="text-gray-400 text-[10px] mt-0.5">
                CAR: {hoverInfo.object.properties.carCode.slice(0, 20)}...
              </div>
            )}
        </div>
      )}

      {/* R2: Map HUD Legend with Solid, Dashed, and Dotted Pattern Swatches */}
      <div className="absolute bottom-6 right-6 z-20 bg-[#0a0d10]/95 backdrop-blur-md border border-[#1f242b] p-3 rounded-lg text-xs font-mono space-y-2 shadow-xl min-w-[250px]">
        <div className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>Camadas Territoriais</span>
          <span className="text-[#00e676] text-[9px] font-bold">SIGEF / SICAR</span>
        </div>

        {/* 1. Polígono Cadastrado (Gleba) - Radar Emerald Solid */}
        <div className="flex items-center gap-2.5 text-gray-200">
          <span className="w-5 h-3 rounded-sm bg-[#00e676]/30 border-2 border-[#00e676] inline-block shadow-sm" />
          <span className="font-medium text-[11px]">Polígono Cadastrado (Gleba)</span>
        </div>

        {/* 2. APP Hídrica (Rio Urucuia) - Water Cyan Dashed */}
        <div className="flex items-center gap-2.5 text-gray-200">
          <span
            className="w-5 h-3 rounded-sm bg-[#00e5ff]/30 border-2 border-dashed border-[#00e5ff] inline-block shadow-sm"
            style={{ borderStyle: "dashed" }}
          />
          <span className="font-medium text-[11px]">APP Hídrica (Rio Urucuia)</span>
        </div>

        {/* 3. Reserva Legal Cerrado - Deep Forest Green Dotted */}
        <div className="flex items-center gap-2.5 text-gray-200">
          <span
            className="w-5 h-3 rounded-sm bg-[#15803d]/40 border-2 border-dotted border-[#15803d] inline-block shadow-sm"
            style={{ borderStyle: "dotted" }}
          />
          <span className="font-medium text-[11px]">Reserva Legal Cerrado</span>
        </div>

        {/* Active MapBiomas Theme indicator */}
        {activeThemeCount > 0 && (
          <div className="pt-2 mt-1 border-t border-[#1f242b]/80 space-y-1">
            <div className="text-[9px] uppercase tracking-wider text-gray-400 flex items-center justify-between">
              <span>MapBiomas Ativo ({activeThemeCount})</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] animate-pulse" />
            </div>
            {MAPBIOMAS_THEMES.filter((t) => activeThemes[t.id]?.enabled)
              .slice(0, 2)
              .map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-1.5 text-[10px] text-gray-300"
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
