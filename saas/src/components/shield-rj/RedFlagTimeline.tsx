"use client";

import React from "react";
import { AlertTriangle, Clock, FileWarning, ShieldAlert, Truck, Satellite } from "lucide-react";

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  category: "sar" | "fiscal" | "cartorio" | "judicial";
  severity: "critical" | "high" | "warning";
  evidenceCode: string;
}

const EVENTS: TimelineEvent[] = [
  {
    id: "ev-1",
    timestamp: "Hoje · 02:18 (Em Trânsito)",
    title: "Carga Iminente em Desvio (MDF-e Ativo)",
    description: "Rodotrem JZX-8821 carregado com 50t de soja ingressando no Armazém Receptivo sob NF-e de Juliana Silveira (Laranja).",
    category: "fiscal",
    severity: "critical",
    evidenceCode: "MDF-e 3126...8902",
  },
  {
    id: "ev-2",
    timestamp: "14/Mar · 06:28",
    title: "Colapso de Biomassa Orbital (Sentinel-1 SAR)",
    description: "Queda brusca de retroespalhamento VH (-22,1 dB) sobre Fazenda Buritis. Colheita clandestina noturna confirmada através de nuvens.",
    category: "sar",
    severity: "critical",
    evidenceCode: "SAR-S1C-IW-VH",
  },
  {
    id: "ev-3",
    timestamp: "05/Fev · 14:22",
    title: "Arrendamento de Gaveta & Nova Inscrição Estadual",
    description: "Cessão gratuita da lavoura para cônjuge sem registro prévio em RTD. Inscrição Estadual aberta a 18 dias da colheita.",
    category: "cartorio",
    severity: "high",
    evidenceCode: "IE 13.999.888-0",
  },
  {
    id: "ev-4",
    timestamp: "18/Jan · 10:15",
    title: "Surto de Protestos Cartorários (CENPROT)",
    description: "R$ 14.850.000,00 apontados por revendas de defensivos agrícolas (Bayer, Syngenta, Corteva).",
    category: "cartorio",
    severity: "warning",
    evidenceCode: "CENPROT-BR-14M",
  },
  {
    id: "ev-5",
    timestamp: "10/Jan · 09:00",
    title: "Contração de Limite SCR Bacen & Execuções",
    description: "Corte de 58% em linhas de crédito rotativo e distribuição de 4 Execuções de Título Extrajudicial.",
    category: "judicial",
    severity: "warning",
    evidenceCode: "Bacen-SCR-DataJud",
  },
];

export const RedFlagTimeline: React.FC = () => {
  const getCategoryIcon = (cat: TimelineEvent["category"]) => {
    switch (cat) {
      case "sar":
        return <Satellite className="w-3.5 h-3.5 text-cyan-400" />;
      case "fiscal":
        return <Truck className="w-3.5 h-3.5 text-orange-400" />;
      case "cartorio":
        return <FileWarning className="w-3.5 h-3.5 text-amber-400" />;
      case "judicial":
        return <ShieldAlert className="w-3.5 h-3.5 text-red-400" />;
    }
  };

  return (
    <div className="w-full h-full bg-[#0a0d10] border border-[#1f242b] rounded-xl p-4 flex flex-col font-mono text-xs select-none">
      <div className="flex items-center justify-between pb-3 border-b border-[#1f242b] flex-shrink-0">
        <div className="flex items-center gap-2 text-orange-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-bold">CRONOGRAMA FORENSE // TIMELINE PRÉ-RJ</span>
        </div>
        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Janela 90 Dias
        </span>
      </div>

      <div className="flex-1 overflow-y-auto mt-3 space-y-4 pr-1">
        {EVENTS.map((ev) => (
          <div key={ev.id} className="relative pl-5 border-l-2 border-[#1f242b] hover:border-[#ef4444] transition-colors">
            {/* Dot */}
            <div
              className={`absolute -left-[5px] top-0.5 w-2 h-2 rounded-full ${
                ev.severity === "critical"
                  ? "bg-red-500 animate-pulse"
                  : ev.severity === "high"
                  ? "bg-orange-500"
                  : "bg-amber-500"
              }`}
            />

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-semibold">{ev.timestamp}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#12171e] text-slate-300 border border-[#1f242b] flex items-center gap-1">
                {getCategoryIcon(ev.category)}
                {ev.evidenceCode}
              </span>
            </div>

            <p className="mt-1 font-bold text-white text-xs">{ev.title}</p>
            <p className="mt-0.5 text-[11px] text-slate-400 leading-relaxed">{ev.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
