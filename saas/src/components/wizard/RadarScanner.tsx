"use client";

import React, { useEffect, useState } from "react";
import { EnrichmentStepLog } from "@/types/geospatial";
import { CheckCircle2, Terminal } from "lucide-react";

interface RadarScannerProps {
  currentStepIndex: number;
  steps: EnrichmentStepLog[];
}

export const RadarScanner: React.FC<RadarScannerProps> = ({ currentStepIndex, steps }) => {
  const [dots, setDots] = useState<Array<{ x: number; y: number; id: number; color: string }>>([]);

  // Generate radar blips as scan progresses
  useEffect(() => {
    const interval = setInterval(() => {
      if (dots.length < 8) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 30 + Math.random() * 85;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        setDots((prev) => [
          ...prev.slice(-6),
          {
            x,
            y,
            id: Date.now(),
            color: Math.random() > 0.85 ? "#ef4444" : "#00e676",
          },
        ]);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [dots]);

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full max-w-2xl mx-auto space-y-8">
      {/* Visual Sweeping Radar Emerald */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full border border-[#00e676]/30 bg-[#050505] flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(0,230,118,0.2)]">
        {/* Concentric Range Rings */}
        <div className="absolute inset-8 rounded-full border border-[#00e676]/20" />
        <div className="absolute inset-20 rounded-full border border-[#00e676]/25" />
        <div className="absolute inset-32 rounded-full border border-[#00e676]/30" />

        {/* Crosshair Grids */}
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#00e676]/20" />
        <div className="absolute inset-y-0 left-1/2 w-[1px] bg-[#00e676]/20" />

        {/* Center Target Beacon */}
        <div className="w-4 h-4 rounded-full bg-[#00e676] flex items-center justify-center shadow-[0_0_15px_rgba(0,230,118,0.5)] z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-black" />
        </div>

        {/* Rotating Radar Sweep Cone */}
        <div
          className="absolute inset-0 origin-center animate-radar pointer-events-none"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(0, 230, 118, 0.05) 320deg, rgba(0, 230, 118, 0.4) 360deg)",
          }}
        />

        {/* Detected Geospatial Target Blips */}
        {dots.map((dot) => (
          <div
            key={dot.id}
            className="absolute w-2.5 h-2.5 rounded-full animate-ping"
            style={{
              left: `calc(50% + ${dot.x}px)`,
              top: `calc(50% + ${dot.y}px)`,
              backgroundColor: dot.color,
            }}
          />
        ))}

        {/* Outer Bearing Ticks */}
        <div className="absolute top-2 text-[9px] font-mono text-[#00e676]/70">000° N</div>
        <div className="absolute bottom-2 text-[9px] font-mono text-[#00e676]/70">180° S</div>
        <div className="absolute left-2 text-[9px] font-mono text-[#00e676]/70">270° W</div>
        <div className="absolute right-2 text-[9px] font-mono text-[#00e676]/70">090° E</div>
      </div>

      {/* Terminal Telemetry Log Feed */}
      <div className="w-full bg-[#0a0d10] border border-[#1f242b] rounded-lg p-4 font-mono text-xs space-y-2.5 shadow-xl">
        <div className="flex items-center justify-between text-gray-400 pb-2 border-b border-[#1f242b] text-[11px]">
          <span className="flex items-center gap-1.5 text-[#00e676]">
            <Terminal className="w-3.5 h-3.5" />
            AgrosTech Fusion Engine — Auditoria Territorial (Buritis/MG)
          </span>
          <span className="animate-pulse text-[#00e676]">Varredura Ativa...</span>
        </div>

        <div className="space-y-2 pt-1">
          {steps.map((step, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex || step.status === "success";

            return (
              <div
                key={step.id}
                className={`flex items-start gap-2.5 p-2 rounded transition-all ${
                  isCurrent
                    ? "bg-[#00e676]/10 border border-[#00e676]/40 text-white"
                    : isCompleted
                    ? "text-gray-300"
                    : "text-gray-600"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-[#00e676] flex-shrink-0 mt-0.5" />
                ) : isCurrent ? (
                  <div className="w-4 h-4 rounded-full border-2 border-[#00e676] border-t-transparent animate-spin flex-shrink-0 mt-0.5" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-gray-700 flex-shrink-0 mt-0.5" />
                )}

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white">
                      [{step.layer}] {step.title}
                    </span>
                    {step.duration_ms && (
                      <span className="text-[10px] text-gray-500">{step.duration_ms}ms</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">{step.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
