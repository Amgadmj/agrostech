"use client";

import React, { useState, useRef } from "react";
import { parseKmlToGeoJson } from "@/lib/kmlParser";
import { GeoJsonFeature } from "@/types/geospatial";
import { UploadCloud, FileCheck, AlertCircle, FileCode } from "lucide-react";

interface KmlUploaderProps {
  onGeoJsonLoaded: (feature: GeoJsonFeature, filename: string) => void;
}

export const KmlUploader: React.FC<KmlUploaderProps> = ({ onGeoJsonLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setError(null);
    setFileName(file.name);

    try {
      const text = await file.text();

      if (file.name.endsWith(".kml") || text.includes("<kml")) {
        const feature = await parseKmlToGeoJson(text);
        if (feature) {
          onGeoJsonLoaded(feature, file.name);
        } else {
          setError("Não foi possível extrair polígono válido deste arquivo KML.");
        }
      } else if (file.name.endsWith(".json") || file.name.endsWith(".geojson")) {
        const parsed = JSON.parse(text);
        const feature = parsed.type === "FeatureCollection" ? parsed.features[0] : parsed;
        if (feature && feature.geometry) {
          onGeoJsonLoaded(feature, file.name);
        } else {
          setError("GeoJSON não contém geometria de polígono válida.");
        }
      } else {
        setError("Formato não suportado. Por favor, envie um arquivo .kml ou .geojson.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Erro ao ler e processar arquivo.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
          isDragging
            ? "border-brand-neon bg-brand-neon/10"
            : "border-surface-border bg-surface/50 hover:border-brand-neon/60 hover:bg-surface"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".kml,.geojson,.json"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFile(e.target.files[0]);
            }
          }}
        />

        <div className="w-12 h-12 rounded-full bg-surface-hover border border-surface-border flex items-center justify-center text-brand-neon mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>

        <div className="text-center font-mono space-y-1">
          <div className="text-sm font-semibold text-white">
            {fileName ? (
              <span className="text-brand-neon flex items-center justify-center gap-1.5">
                <FileCheck className="w-4 h-4" />
                {fileName}
              </span>
            ) : (
              "Arraste seu arquivo KML ou GeoJSON aqui"
            )}
          </div>
          <p className="text-xs text-gray-400">
            Exportado de GPS, Drone, Google Earth, SIGEF ou SICAR (.kml / .geojson)
          </p>
        </div>
      </div>

      {error && (
        <div className="p-2 rounded bg-status-embargo/15 border border-status-embargo/40 text-status-embargo text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
