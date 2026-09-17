"use client";

import React, { useState } from "react";
import { Shield, AlertTriangle, Users, Building, Truck, Landmark, Info } from "lucide-react";

export interface GraphNode {
  id: string;
  label: string;
  sublabel: string;
  type: "debtor" | "laranja" | "farm" | "silo" | "truck";
  x: number;
  y: number;
  scoreLaranja?: number;
  details: Record<string, string>;
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
  isSuspicious?: boolean;
}

const INITIAL_NODES: GraphNode[] = [
  {
    id: "debtor",
    label: "Marcos Silveira",
    sublabel: "Devedor Original (CPF 123.456...)",
    type: "debtor",
    x: 220,
    y: 180,
    details: {
      "Papel": "Produtor Fiduciante / CPR",
      "Dívida Pledgada": "R$ 48.200.000,00",
      "Protestos CENPROT (90d)": "R$ 14.850.000,00",
      "Status": "Imadimplência / Iminência de RJ",
    },
  },
  {
    id: "esposa",
    label: "Juliana Silveira",
    sublabel: "Cônjuge / Laranja (CPF 456.789...)",
    type: "laranja",
    x: 480,
    y: 110,
    scoreLaranja: 0.94,
    details: {
      "Parentesco": "Cônjuge (Comunhão Parcial)",
      "Score de Laranja": "94.0% (Crítico)",
      "IE Aberta em": "05/02/2026 (18 dias antes da safra)",
      "Arrendamento": "Contrato de gaveta s/ registro RTD",
      "Volume Faturado": "85.400 sacas (R$ 10,6M)",
    },
  },
  {
    id: "filho",
    label: "Marcos Silveira Filho",
    sublabel: "Filho 1º Grau (CPF 789.012...)",
    type: "laranja",
    x: 480,
    y: 280,
    scoreLaranja: 0.88,
    details: {
      "Parentesco": "Filho (21 anos)",
      "Score de Laranja": "88.1% (Alto)",
      "Capacidade Operacional": "Zero maquinários declarados",
      "Papel": "Titular de conta corrente de passagem",
    },
  },
  {
    id: "fazenda",
    label: "Fazenda Buritis",
    sublabel: "217,12 ha (CAR MG-3109303...)",
    type: "farm",
    x: 100,
    y: 340,
    details: {
      "Matrícula CRI": "12.449 - Comarca de Buritis/MG",
      "Área Útil FAU": "57,26 ha (Mecanização Plena)",
      "Garantia": "Penhor Agrícola Safra 25/26",
      "Status do Solo": "Colapso de Biomassa SAR (-22,1 dB)",
    },
  },
  {
    id: "caminhao",
    label: "Carretas JZX-8821 / REB-01",
    sublabel: "Rodotrem 9 Eixos (74t PBTC)",
    type: "truck",
    x: 680,
    y: 180,
    details: {
      "Proprietário Documental": "Marcos Silveira (Devedor)",
      "Manifesto Fiscal": "MDF-e 3126...8902 (Emitido pela Esposa)",
      "Velocidade Rodovia": "64 km/h na BR-251 (Carga cheia)",
      "Destino": "Moega 03 - Cereais do Cerrado",
    },
  },
  {
    id: "silo",
    label: "Cereais do Cerrado S/A",
    sublabel: "Terminal Receptivo (CNPJ 01.234...)",
    type: "silo",
    x: 880,
    y: 180,
    details: {
      "Localização": "Unaí / Buritis - MG",
      "Capacidade": "120.000 ton",
      "Status de Descarga": "Descarregando neste instante",
      "Ação Judicial Requerida": "Arresto Imediato e Fiel Depósito",
    },
  },
];

const INITIAL_LINKS: GraphLink[] = [
  { source: "debtor", target: "fazenda", label: "PROPRIETÁRIO REGISTRAL" },
  { source: "debtor", target: "esposa", label: "CASADO_COM (Comunhão)", isSuspicious: true },
  { source: "debtor", target: "filho", label: "FILHO (1º Grau)" },
  { source: "fazenda", target: "esposa", label: "ARRENDAMENTO DE GAVETA", isSuspicious: true },
  { source: "esposa", target: "caminhao", label: "EMITE NF-e / MDF-e", isSuspicious: true },
  { source: "debtor", target: "caminhao", label: "PROPRIETÁRIO DO VEÍCULO" },
  { source: "caminhao", target: "silo", label: "DESVIO DE SAFRA EM TRÂNSITO", isSuspicious: true },
];

export const GraphVisualizer: React.FC = () => {
  const [nodes] = useState<GraphNode[]>(INITIAL_NODES);
  const [links] = useState<GraphLink[]>(INITIAL_LINKS);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(INITIAL_NODES[1]); // Esposa by default
  const [threshold, setThreshold] = useState<number>(0.7);

  const getNodeColor = (type: GraphNode["type"]) => {
    switch (type) {
      case "debtor":
        return "#ef4444"; // Hazard red
      case "laranja":
        return "#f97316"; // Alert orange
      case "farm":
        return "#00e676"; // Radar emerald
      case "truck":
        return "#eab308"; // Telemetry amber
      case "silo":
        return "#3b82f6"; // Orbital blue
      default:
        return "#94a3b8";
    }
  };

  const getNodeIcon = (type: GraphNode["type"]) => {
    switch (type) {
      case "debtor":
        return <AlertTriangle className="w-4 h-4 text-white" />;
      case "laranja":
        return <Users className="w-4 h-4 text-white" />;
      case "farm":
        return <Landmark className="w-4 h-4 text-white" />;
      case "truck":
        return <Truck className="w-4 h-4 text-white" />;
      case "silo":
        return <Building className="w-4 h-4 text-white" />;
    }
  };

  return (
    <div className="relative w-full h-[520px] bg-[#050505] border border-[#1f242b] rounded-xl overflow-hidden font-mono select-none">
      {/* Top HUD Floating Bar */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-3 bg-[#0a0d10]/90 backdrop-blur-md border border-[#1f242b] px-3 py-2 rounded-lg text-xs">
        <div className="flex items-center gap-2 text-[#00e676]">
          <Shield className="w-4 h-4" />
          <span className="font-bold">SHIELD RJ 2.0 // GRAFO FORENSE DE LARANJAS</span>
        </div>
        <div className="h-4 w-px bg-[#1f242b]" />
        <div className="flex items-center gap-2 text-slate-300">
          <span>Filtro S_straw:</span>
          <input
            type="range"
            min="0.4"
            max="0.95"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-20 accent-[#00e676] cursor-pointer"
          />
          <span className="text-[#00e676] font-bold">{(threshold * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* SVG Canvas for Graph Visualization */}
      <svg className="w-full h-full">
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
          </marker>
          <marker
            id="arrow-suspicious"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
          </marker>
        </defs>

        {/* Links */}
        {links.map((link, idx) => {
          const src = nodes.find((n) => n.id === link.source);
          const tgt = nodes.find((n) => n.id === link.target);
          if (!src || !tgt) return null;

          const isHighlight = link.isSuspicious;
          const midX = (src.x + tgt.x) / 2;
          const midY = (src.y + tgt.y) / 2;

          return (
            <g key={idx}>
              <line
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={isHighlight ? "#ef4444" : "#334155"}
                strokeWidth={isHighlight ? 2.5 : 1.5}
                strokeDasharray={isHighlight ? "4 2" : "none"}
                markerEnd={isHighlight ? "url(#arrow-suspicious)" : "url(#arrow)"}
                className={isHighlight ? "animate-pulse" : ""}
              />
              <text
                x={midX}
                y={midY - 6}
                fill={isHighlight ? "#f87171" : "#64748b"}
                fontSize="8px"
                textAnchor="middle"
                className="bg-[#050505]"
              >
                {link.label}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const isSelected = selectedNode?.id === node.id;
          const color = getNodeColor(node.type);

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onClick={() => setSelectedNode(node)}
              className="cursor-pointer group"
            >
              {/* Outer Glow */}
              <circle
                r={isSelected ? 26 : 22}
                fill="none"
                stroke={color}
                strokeWidth={isSelected ? 3 : 1.5}
                strokeOpacity={isSelected ? 1 : 0.6}
                className={node.type === "debtor" || (node.scoreLaranja && node.scoreLaranja >= threshold) ? "animate-pulse" : ""}
              />
              <circle r="18" fill="#0a0d10" stroke={color} strokeWidth="1" />
              
              {/* Node Icon */}
              <g transform="translate(-8, -8)">{getNodeIcon(node.type)}</g>

              {/* Node Label */}
              <text
                y={32}
                fill="#ffffff"
                fontSize="10px"
                fontWeight="bold"
                textAnchor="middle"
              >
                {node.label}
              </text>
              <text
                y={44}
                fill="#94a3b8"
                fontSize="8px"
                textAnchor="middle"
              >
                {node.sublabel}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Selected Node Forensic Inspector Drawer */}
      {selectedNode && (
        <div className="absolute top-3 right-3 z-20 w-80 bg-[#0a0d10]/95 backdrop-blur-md border border-[#1f242b] p-4 rounded-xl shadow-2xl text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#1f242b]">
            <span className="font-bold text-slate-200 uppercase flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#00e676]" />
              {selectedNode.type}
            </span>
            {selectedNode.scoreLaranja && (
              <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded-full font-bold">
                S_straw: {(selectedNode.scoreLaranja * 100).toFixed(0)}%
              </span>
            )}
          </div>

          <p className="mt-2.5 text-sm font-bold text-white">{selectedNode.label}</p>
          <p className="text-[10px] text-slate-400">{selectedNode.sublabel}</p>

          <div className="mt-3.5 space-y-2 border-t border-[#1f242b] pt-2.5">
            {Object.entries(selectedNode.details).map(([k, v]) => (
              <div key={k} className="flex justify-between items-start text-[11px]">
                <span className="text-slate-500">{k}:</span>
                <span className="text-slate-200 font-semibold text-right max-w-[160px]">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
