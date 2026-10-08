"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Shield,
  AlertTriangle,
  Users,
  Building,
  Truck,
  Landmark,
  Info,
  Scale,
  Satellite,
  Gavel,
  X,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Layers,
  GitBranch,
  Workflow,
  Sparkles,
  ArrowRight,
  Activity,
  FileCheck,
  Search,
} from "lucide-react";

export interface GraphNode {
  id: string;
  label: string;
  sublabel: string;
  type: "debtor" | "laranja" | "farm" | "silo" | "truck" | "fraud_vector";
  stage: 1 | 2 | 3 | 4 | 5; // Progressive forensic pipeline stage
  stageName: string;
  x: number;
  y: number;
  scoreLaranja?: number;
  vectorId?: "inflated_area" | "phantom_harvest" | "grain_diversion" | "legal_restructuring";
  fiscalData?: Record<string, string>;
  riskDetails: Record<string, string>;
  keyMetric?: { label: string; value: string; isHazard?: boolean };
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  label: string;
  isSuspicious?: boolean;
  stepIndex?: number; // 1 to 5 for storytelling mode
  offsetY?: number; // Manual vertical offset to prevent label collisions
}

export const INITIAL_NODES: GraphNode[] = [
  {
    id: "fazenda",
    label: "Fazenda Buritis",
    sublabel: "217,12 ha (CAR MG-3109303...)",
    type: "farm",
    stage: 1,
    stageName: "1. Ativo & Garantia",
    x: 80,
    y: 280,
    keyMetric: { label: "Área Útil M1", value: "146,79 ha", isHazard: false },
    fiscalData: {
      "Matrícula Imobiliária": "12.449 - Comarca de Buritis/MG",
      "Código SICAR": "MG-3109303-D09B812...",
      "Área Declarada CAR": "217,12 ha (Área Total Declarada sem deduções)",
      "Área Útil M1": "146,79 ha (Disparidade de 48% sobre o líquido)",
    },
    riskDetails: {
      "Matrícula CRI": "12.449 - Comarca de Buritis/MG",
      "Área Declarada CAR": "217,12 ha (Área Total Declarada sem deduções)",
      "Área Útil Líquida M1": "146,79 ha (Disparidade de 48% sobre o líquido)",
      "Vetor 1 (Área Inflada)": "Alavancagem artificial de crédito fiduciário",
      "Status do Solo": "Variação de Biomassa SAR (-22,1 dB registrado)",
      "Garantia": "Penhor Agrícola Safra 2025/2026",
    },
  },
  {
    id: "sar_telemetry",
    label: "Sentinel-1 RTC SAR",
    sublabel: "Sensor Radar Banda C (INPE BDC)",
    type: "fraud_vector",
    stage: 2,
    stageName: "2. Evidência Orbital",
    vectorId: "grain_diversion",
    x: 280,
    y: 120,
    keyMetric: { label: "Queda VH", value: "Δ -6,2 dB (Colheita)", isHazard: true },
    fiscalData: {
      "Coleção STAC": "sentinel-1-rtc-1 (INPE)",
      "Passagem Orbital": "Órbita Ascendente Relativa 142",
      "Resolução Espacial": "10 metros por pixel",
      "Formato": "Cloud Optimized GeoTIFF (COG)",
    },
    riskDetails: {
      "Sensor": "Sentinel-1 RTC L2 Analysis-Ready Data",
      "Retroespalhamento VH": "Queda abrupta de -15,9 dB para -22,1 dB",
      "Magnitude da Queda": "Δ = -6,2 dB (Limiar M2: -4,5 dB)",
      "Solo Exposto": "Compatível (≤ -20,0 dB floor atingido)",
      "Refutação S_clima": "Compatível (precipitação agrometeorológica não causa queda a -22 dB)",
      "Vetor 3 (Fuga)": "Indicativo de colheita rápida sob cobertura de nuvens",
    },
  },
  {
    id: "debtor",
    label: "Marcos Silveira",
    sublabel: "Devedor Fiduciante (CPF 123.456...)",
    type: "debtor",
    stage: 3,
    stageName: "3. Triangulação Societária",
    x: 280,
    y: 360,
    keyMetric: { label: "Dívida CPR", value: "R$ 1,19M Pledgada", isHazard: true },
    fiscalData: {
      "CPF": "123.456.789-00",
      "Inscrição Estadual": "001.234.567-89 (Bloqueada)",
      "Domicílio Fiscal": "Buritis - MG",
      "Status SEFAZ": "Irregular por Inadimplemento",
    },
    riskDetails: {
      "Papel": "Produtor Fiduciante / Emitente CPR",
      "Dívida Pledgada": "R$ 1.192.500,00 (9.540 sacas)",
      "Protestos CENPROT (90d)": "R$ 1.850.000,00",
      "Status": "Inadimplência / Iminência de RJ",
      "Vetor 4 (Blindagem)": "Cessão para familiares antes do pedido de RJ",
    },
  },
  {
    id: "esposa",
    label: "Juliana Silveira",
    sublabel: "Cônjuge / Laranja (CPF 456.789...)",
    type: "laranja",
    stage: 3,
    stageName: "3. Triangulação Societária",
    x: 520,
    y: 120,
    scoreLaranja: 0.94,
    keyMetric: { label: "Score S_straw", value: "94.0% (Crítico)", isHazard: true },
    fiscalData: {
      "CPF": "456.789.012-34",
      "Inscrição Estadual": "13.999.888-0 (Aberta em 05/02/2026)",
      "Regime de Casamento": "Comunhão Parcial de Bens",
      "Data de Casamento": "14/06/2012 (Certidão Livro B-12)",
    },
    riskDetails: {
      "Parentesco": "Cônjuge do Devedor",
      "Score S_straw": "94.0% (Crítico - Nível 5)",
      "IE Aberta em": "05/02/2026 (18 dias antes da colheita)",
      "Arrendamento": "Contrato de gaveta sem registro RTD",
      "Volume Faturado": "9.540 sacas de soja (R$ 1,19M)",
      "Vetor 4 (Blindagem)": "Abertura de nova IE < 30 dias para escoar grãos",
    },
  },
  {
    id: "filho",
    label: "Marcos Silveira Filho",
    sublabel: "Filho 1º Grau (CPF 789.012...)",
    type: "laranja",
    stage: 3,
    stageName: "3. Triangulação Societária",
    x: 520,
    y: 360,
    scoreLaranja: 0.88,
    keyMetric: { label: "Score S_straw", value: "88.1% (Alto)", isHazard: true },
    fiscalData: {
      "CPF": "789.012.345-67",
      "Idade": "21 anos",
      "Atividade Econômica": "Estudante / Produtor Informal",
      "Conta Bancária": "Banco Cooperativo (Ag. 3401)",
    },
    riskDetails: {
      "Parentesco": "Filho (1º Grau)",
      "Score S_straw": "88.1% (Alto Risco)",
      "Capacidade Operacional": "Zero maquinários agrícolas registrados no Renavam",
      "Papel": "Titular de conta bancária de passagem para barter",
      "Vetor 4 (Blindagem)": "Reestruturação societária familiar ilícita",
    },
  },
  {
    id: "caminhao",
    label: "Carretas JZX-8821 / REB-01",
    sublabel: "Bitrem 9 Eixos",
    type: "truck",
    stage: 4,
    stageName: "4. Escoamento em Trânsito",
    x: 740,
    y: 220,
    keyMetric: { label: "Carga em Rota", value: "38t Soja a Granel", isHazard: true },
    fiscalData: {
      "Placas": "JZX-8821 (Cavalo) / REB-01 (Bitrem)",
      "Proprietário Renavam": "Marcos Silveira (Devedor Principal)",
      "Manifesto Fiscal": "MDF-e 3126...8902",
      "Emissor MDF-e": "Juliana Silveira (IE 13.999.888-0)",
    },
    riskDetails: {
      "Proprietário do Veículo": "Marcos Silveira (Devedor Principal)",
      "Manifesto Emitido": "MDF-e 3126...8902 (Emitido por Juliana Silveira)",
      "Carga": "38t Soja em Grão a Granel (~630 sacas)",
      "Destino": "Moega 03 - Cereais do Cerrado S/A",
      "Vetor 3 (Fuga)": "Triangulação veicular do devedor com NF-e da interposta",
    },
  },
  {
    id: "silo",
    label: "Cereais do Cerrado S/A",
    sublabel: "Terminal Receptivo (CNPJ 01.234...)",
    type: "silo",
    stage: 5,
    stageName: "5. Receptação & Bloqueio",
    x: 960,
    y: 220,
    keyMetric: { label: "Alvo da Cautelar", value: "Moega 03 (Descarga)", isHazard: true },
    fiscalData: {
      "CNPJ": "01.234.567/0001-89",
      "Inscrição Estadual": "062.889.102-11",
      "Localização": "Unaí / Buritis - MG",
      "Capacidade Estática": "120.000 toneladas",
    },
    riskDetails: {
      "Localização": "Unaí / Buritis - MG",
      "Capacidade Estática": "120.000 ton",
      "Status Operacional": "Descarga em andamento neste instante na Moega 03",
      "Medida Cautelar": "Apreensão e Depósito Fiduciário (CPC Art. 301)",
      "Tese STJ": "REsp 1.758.746/GO (Grão excluído do Stay Period)",
    },
  },
];

export const INITIAL_LINKS: GraphLink[] = [
  {
    id: "l1",
    source: "fazenda",
    target: "sar_telemetry",
    label: "EVIDÊNCIA RADAR COLHEITA (Δ -6,2 dB)",
    isSuspicious: true,
    stepIndex: 2,
    offsetY: -15,
  },
  {
    id: "l2",
    source: "debtor",
    target: "fazenda",
    label: "PROPRIETÁRIO REGISTRAL",
    stepIndex: 1,
    offsetY: 15,
  },
  {
    id: "l3",
    source: "debtor",
    target: "esposa",
    label: "CÔNJUGE (Comunhão Parcial)",
    isSuspicious: true,
    stepIndex: 3,
    offsetY: -18,
  },
  {
    id: "l4",
    source: "debtor",
    target: "filho",
    label: "FILHO (1º Grau)",
    stepIndex: 3,
    offsetY: 18,
  },
  {
    id: "l5",
    source: "fazenda",
    target: "esposa",
    label: "ARRENDAMENTO DE GAVETA",
    isSuspicious: true,
    stepIndex: 3,
    offsetY: -30,
  },
  {
    id: "l6",
    source: "esposa",
    target: "caminhao",
    label: "EMITE NF-e / MDF-e",
    isSuspicious: true,
    stepIndex: 4,
    offsetY: -15,
  },
  {
    id: "l7",
    source: "debtor",
    target: "caminhao",
    label: "PROPRIETÁRIO DO VEÍCULO",
    stepIndex: 4,
    offsetY: 15,
  },
  {
    id: "l8",
    source: "caminhao",
    target: "silo",
    label: "DESVIO DE SAFRA EM CURSO",
    isSuspicious: true,
    stepIndex: 5,
    offsetY: -15,
  },
];

const STORY_STEPS = [
  { id: "all", label: "Visão Completa", desc: "Rede forense completa de triangulação" },
  { id: "step1", label: "1. Penhor Registrado", desc: "Marcos vincula Fazenda Buritis na CPR de R$ 1,19M" },
  { id: "step2", label: "2. Alerta de Colheita", desc: "Sentinel-1 RTC indica colheita recente sob nuvens (-22,1 dB)" },
  { id: "step3", label: "3. Blindagem Familiar", desc: "Arrendamento de gaveta e abertura de IE para Juliana (S_straw 94%)" },
  { id: "step4", label: "4. Escoamento MDF-e", desc: "Caminhões do devedor transportam grãos com nota da interposta" },
  { id: "step5", label: "5. Alvo: Moega 03", desc: "Grão ingressando no Armazém para comistão ilícita (CPC 301)" },
];

export const GraphVisualizer: React.FC = () => {
  // View mode switcher: "pipeline" (intuitive swimlane flow) vs "canvas" (interactive zoomable 2D network)
  const [viewEngine, setViewEngine] = useState<"pipeline" | "canvas">("pipeline");
  const [nodes, setNodes] = useState<GraphNode[]>(INITIAL_NODES);
  const [links] = useState<GraphLink[]>(INITIAL_LINKS);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(INITIAL_NODES[3]); // Juliana Silveira
  const [selectedStep, setSelectedStep] = useState<string>("all");
  const [threshold, setThreshold] = useState<number>(0.7);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [activeInspectorTab, setActiveInspectorTab] = useState<"overview" | "fiscal" | "links">("overview");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Canvas Pan & Zoom Interactive States
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 20, y: 10 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset / Fit to Screen auto-calculation
  const handleFitScreen = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Bounding box of nodes:
    const minX = Math.min(...nodes.map((n) => n.x)) - 60;
    const maxX = Math.max(...nodes.map((n) => n.x)) + 180;
    const minY = Math.min(...nodes.map((n) => n.y)) - 60;
    const maxY = Math.max(...nodes.map((n) => n.y)) + 120;

    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;

    const scaleX = (width - 40) / Math.max(graphWidth, 400);
    const scaleY = (height - 40) / Math.max(graphHeight, 300);
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.55), 1.15);

    setZoom(newZoom);
    setPan({
      x: (width - graphWidth * newZoom) / 2 - minX * newZoom,
      y: (height - graphHeight * newZoom) / 2 - minY * newZoom,
    });
  }, [nodes]);

  useEffect(() => {
    // Auto-fit on initial mount
    const timer = setTimeout(handleFitScreen, 150);
    return () => clearTimeout(timer);
  }, [handleFitScreen]);

  // Handle Dragging Canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    if (draggingNodeId) return;
    if (e.button !== 0) return; // Only left click
    setIsDraggingCanvas(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCanvas) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else if (draggingNodeId) {
      // Dragging a specific node
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;

      setNodes((prev) =>
        prev.map((n) =>
          n.id === draggingNodeId ? { ...n, x: Math.round(mouseX), y: Math.round(mouseY) } : n
        )
      );
    }
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
    setDraggingNodeId(null);
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.4), 2.2));
  };

  const getNodeColor = (type: GraphNode["type"]) => {
    switch (type) {
      case "debtor":
        return "#dc2626"; // Crimson Red
      case "laranja":
        return "#ea580c"; // High Alert Orange
      case "farm":
        return "#059669"; // Emerald
      case "fraud_vector":
        return "#0284c7"; // Cyan / Blue
      case "truck":
        return "#d97706"; // Amber
      case "silo":
        return "#6366f1"; // Indigo
      default:
        return "#64748b";
    }
  };

  const getNodeIcon = (node: GraphNode) => {
    switch (node.type) {
      case "debtor":
        return <AlertTriangle className="w-4 h-4 text-white" />;
      case "laranja":
        return <Users className="w-4 h-4 text-white" />;
      case "farm":
        return <Landmark className="w-4 h-4 text-white" />;
      case "fraud_vector":
        return <Satellite className="w-4 h-4 text-white" />;
      case "truck":
        return <Truck className="w-4 h-4 text-white" />;
      case "silo":
        return <Building className="w-4 h-4 text-white" />;
    }
  };

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Group nodes by stage for Pipeline view
  const stages = useMemo(() => {
    const stageMap: Record<number, { name: string; nodes: GraphNode[] }> = {
      1: { name: "1. Ativo & Garantia", nodes: [] },
      2: { name: "2. Evidência Orbital", nodes: [] },
      3: { name: "3. Triangulação Societária", nodes: [] },
      4: { name: "4. Escoamento em Rota", nodes: [] },
      5: { name: "5. Destino & Bloqueio", nodes: [] },
    };

    nodes.forEach((n) => {
      if (stageMap[n.stage]) {
        stageMap[n.stage].nodes.push(n);
      }
    });

    return Object.entries(stageMap).map(([k, v]) => ({
      stageNum: Number(k),
      name: v.name,
      nodes: v.nodes,
    }));
  }, [nodes]);

  // Story step filter highlight
  const isNodeHighlightedInStep = (node: GraphNode) => {
    if (selectedStep === "all") return true;
    if (selectedStep === "step1") return node.id === "fazenda" || node.id === "debtor";
    if (selectedStep === "step2") return node.id === "fazenda" || node.id === "sar_telemetry";
    if (selectedStep === "step3") return node.id === "debtor" || node.id === "esposa" || node.id === "filho";
    if (selectedStep === "step4") return node.id === "esposa" || node.id === "caminhao" || node.id === "debtor";
    if (selectedStep === "step5") return node.id === "caminhao" || node.id === "silo";
    return true;
  };

  const isLinkHighlightedInStep = (link: GraphLink) => {
    if (selectedStep === "all") return true;
    const stepNum = Number(selectedStep.replace("step", ""));
    return link.stepIndex === stepNum;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[520px] bg-slate-50 dark:bg-[#0c0e14] border border-slate-200 dark:border-[#232936] rounded-xl overflow-hidden shadow-sm flex flex-col select-none transition-colors"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top HUD Toolbar: View Mode, Story Stepper & Inspector Toggle */}
      <div className="h-12 px-3 border-b border-slate-200 dark:border-[#232936] bg-white/95 dark:bg-[#11141c]/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 z-20 flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* View Engine Toggle: Pipeline vs Canvas */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs">
            <button
              onClick={() => setViewEngine("pipeline")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewEngine === "pipeline"
                  ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Pipeline Forense em Colunas (Organizado & Sem Colisões)"
            >
              <Workflow className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Pipeline Forense</span>
            </button>
            <button
              onClick={() => setViewEngine("canvas")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewEngine === "canvas"
                  ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Grafo Interativo 2D (Arraste os nós, Pan e Zoom)"
            >
              <GitBranch className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Grafo 2D Interativo</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 hidden sm:block" />

          {/* S_straw threshold pill */}
          <div className="hidden md:flex items-center gap-2 text-slate-600 dark:text-zinc-400 text-xs">
            <span className="text-xs font-mono">Filtro S_straw:</span>
            <input
              type="range"
              min="0.4"
              max="0.95"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-16 accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg"
            />
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              {(threshold * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Right side: Canvas controls or Inspector toggle */}
        <div className="flex items-center gap-1.5">
          {viewEngine === "canvas" && (
            <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700">
              <button
                onClick={() => setZoom((prev) => Math.min(prev * 1.15, 2.2))}
                className="p-1 rounded text-slate-600 dark:text-zinc-400 hover:text-slate-900 hover:bg-white dark:hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                title="Aproximar (+)"
                aria-label="Aproximar (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom((prev) => Math.max(prev * 0.85, 0.4))}
                className="p-1 rounded text-slate-600 dark:text-zinc-400 hover:text-slate-900 hover:bg-white dark:hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                title="Afastar (-)"
                aria-label="Afastar (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleFitScreen}
                className="p-1 rounded text-slate-600 dark:text-zinc-400 hover:text-slate-900 hover:bg-white dark:hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                title="Ajustar à Tela"
                aria-label="Ajustar à Tela"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {!isInspectorOpen && selectedNode && (
            <button
              onClick={() => setIsInspectorOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 hover:bg-emerald-100 transition-colors shadow-sm"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Inspecionar {selectedNode.label.split(" ")[0]}</span>
            </button>
          )}
        </div>
      </div>

      {/* Storyteller Step Selector Bar: 1 to 5 */}
      <div className="px-3 py-1.5 border-b border-slate-200 dark:border-[#232936] bg-slate-50/80 dark:bg-[#0f121a]/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none z-10 flex-shrink-0">
        <span className="text-xs font-mono text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-semibold mr-1 flex items-center gap-1 whitespace-nowrap">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Rastro da Fraude:
        </span>
        {STORY_STEPS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedStep(s.id)}
            className={`px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
              selectedStep === s.id
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-sm"
                : "bg-white dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 border border-slate-200 dark:border-zinc-700"
            }`}
            title={s.desc}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Main Interactive Stage Body */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* ========================================================================= */}
        {/* MODE 1: FORENSIC PIPELINE SWIMLANES (INNOVATIVE, RESPONSIVE, 0 COLLISIONS) */}
        {/* ========================================================================= */}
        {viewEngine === "pipeline" ? (
          <div className="w-full h-full p-4 overflow-x-auto overflow-y-auto flex gap-4 items-start scrollbar-thin">
            {stages.map((stage) => (
              <div
                key={stage.stageNum}
                className="w-64 sm:w-72 flex-shrink-0 flex flex-col gap-3 bg-white/70 dark:bg-[#11141c]/70 backdrop-blur-sm border border-slate-200 dark:border-[#232936] rounded-xl p-3 shadow-sm"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-800">
                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wide">
                    {stage.name}
                  </span>
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-mono font-bold flex items-center justify-center">
                    {stage.nodes.length}
                  </span>
                </div>

                {/* Node Cards inside this Stage */}
                <div className="flex flex-col gap-2.5">
                  {stage.nodes.map((node) => {
                    const isSelected = selectedNode?.id === node.id;
                    const isHighlighted = isNodeHighlightedInStep(node);
                    const color = getNodeColor(node.type);

                    return (
                      <div
                        key={node.id}
                        onClick={() => {
                          setSelectedNode(node);
                          setIsInspectorOpen(true);
                        }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? "bg-slate-50 dark:bg-zinc-800/80 border-slate-400 dark:border-zinc-500 shadow-md ring-2 ring-emerald-500/20"
                            : "bg-white dark:bg-[#141824] border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 shadow-sm"
                        } ${!isHighlighted ? "opacity-35 grayscale" : "opacity-100"}`}
                      >
                        {/* Header: Icon + Title + Pill */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: color }}
                            >
                              {getNodeIcon(node)}
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                                {node.label}
                              </h4>
                              <p className="font-mono text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                {node.sublabel}
                              </p>
                            </div>
                          </div>

                          {node.scoreLaranja && (
                            <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-900 font-mono">
                              {(node.scoreLaranja * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>

                        {/* Key Metric Pill */}
                        {node.keyMetric && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-500 dark:text-zinc-400">
                              {node.keyMetric.label}:
                            </span>
                            <span
                              className={`font-bold ${
                                node.keyMetric.isHazard
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {node.keyMetric.value}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ========================================================================= */
          /* MODE 2: INTERACTIVE 2D CANVAS (DRAG & DROP, PAN & ZOOM, SMOOTH BEZIERS)   */
          /* ========================================================================= */
          <div
            className={`w-full h-full relative cursor-grab ${
              isDraggingCanvas ? "cursor-grabbing" : ""
            }`}
            onMouseDown={handleMouseDown}
            onWheel={handleWheel}
          >
            {/* Background Grid Pattern */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25 dark:opacity-15">
              <defs>
                <pattern id="canvas-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" className="fill-slate-400 dark:fill-zinc-600" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#canvas-grid)" />
            </svg>

            {/* Transform Container with Pan & Zoom */}
            <svg
              className="w-full h-full overflow-visible"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "0 0",
              }}
            >
              <defs>
                <marker
                  id="arrow-std"
                  viewBox="0 0 10 10"
                  refX="38"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" className="fill-slate-400 dark:fill-zinc-600" />
                </marker>
                <marker
                  id="arrow-fraud"
                  viewBox="0 0 10 10"
                  refX="38"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" className="fill-rose-600" />
                </marker>
              </defs>

              {/* Dynamic Curved Bezier Connectors */}
              {links.map((link) => {
                const src = nodes.find((n) => n.id === link.source);
                const tgt = nodes.find((n) => n.id === link.target);
                if (!src || !tgt) return null;

                const isHighlight = link.isSuspicious;
                const isStepActive = isLinkHighlightedInStep(link);

                // Calculate smooth curved path
                const dx = tgt.x - src.x;
                const dy = tgt.y - src.y;
                const cx1 = src.x + dx * 0.5;
                const cy1 = src.y;
                const cx2 = src.x + dx * 0.5;
                const cy2 = tgt.y;
                const midX = (src.x + tgt.x) / 2;
                const midY = (src.y + tgt.y) / 2 + (link.offsetY || 0);

                const pathData = `M ${src.x} ${src.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tgt.x} ${tgt.y}`;

                return (
                  <g
                    key={link.id}
                    className={`transition-opacity duration-200 ${
                      !isStepActive ? "opacity-20" : "opacity-100"
                    }`}
                  >
                    {/* Shadow / Glow line */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={isHighlight ? "#dc2626" : "#64748b"}
                      strokeWidth={isHighlight ? 2.5 : 1.5}
                      strokeDasharray={isHighlight ? "6 3" : "none"}
                      markerEnd={isHighlight ? "url(#arrow-fraud)" : "url(#arrow-std)"}
                      className={isHighlight ? "animate-pulse" : ""}
                    />

                    {/* Edge Label Badge with protective pill background */}
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-75"
                        y="-10"
                        width="150"
                        height="20"
                        rx="10"
                        className={
                          isHighlight
                            ? "fill-rose-50 stroke-rose-300 dark:fill-[#200c0f] dark:stroke-rose-800 shadow-sm"
                            : "fill-white stroke-slate-200 dark:fill-[#12151e] dark:stroke-zinc-800 shadow-sm"
                        }
                        strokeWidth="1.2"
                      />
                      <text
                        x="0"
                        y="3.5"
                        className={`font-mono text-xs font-bold text-center ${
                          isHighlight
                            ? "fill-rose-700 dark:fill-rose-300"
                            : "fill-slate-600 dark:fill-zinc-300"
                        }`}
                        textAnchor="middle"
                      >
                        {link.label}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Draggable Entity Nodes */}
              {nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const isStepActive = isNodeHighlightedInStep(node);
                const color = getNodeColor(node.type);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggingNodeId(node.id);
                      setSelectedNode(node);
                      setIsInspectorOpen(true);
                    }}
                    className={`cursor-move group transition-opacity duration-200 ${
                      !isStepActive ? "opacity-30" : "opacity-100"
                    }`}
                  >
                    {/* Node Selection Ring */}
                    {isSelected && (
                      <circle
                        r={32}
                        fill="none"
                        stroke={color}
                        strokeWidth={2.5}
                        strokeDasharray="4 4"
                        className="animate-spin"
                        style={{ animationDuration: "10s" }}
                      />
                    )}

                    {/* Main Node Circle */}
                    <circle
                      r={24}
                      className="fill-white dark:fill-[#141824] stroke-2 shadow-lg group-hover:scale-110 transition-transform"
                      stroke={color}
                    />

                    {/* Inner Colored Dot */}
                    <circle r={17} fill={color} />

                    {/* Center Icon */}
                    <g transform="translate(-8, -8)">{getNodeIcon(node)}</g>

                    {/* Node Label Box (Positioned cleanly below node to eliminate text overlap) */}
                    <g transform="translate(0, 36)">
                      <rect
                        x="-70"
                        y="-4"
                        width="140"
                        height="28"
                        rx="6"
                        className="fill-white/95 stroke-slate-200 dark:fill-[#11141c]/95 dark:stroke-zinc-800 shadow-sm"
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="9"
                        className="font-sans text-xs font-bold fill-slate-900 dark:fill-white text-center"
                        textAnchor="middle"
                      >
                        {node.label}
                      </text>
                      <text
                        x="0"
                        y="20"
                        className="font-mono text-xs fill-slate-500 dark:fill-zinc-400 text-center"
                        textAnchor="middle"
                      >
                        {node.sublabel}
                      </text>
                    </g>

                    {/* Score Badge */}
                    {node.scoreLaranja && (
                      <g transform="translate(18, -18)">
                        <rect
                          x="-14"
                          y="-8"
                          width="28"
                          height="16"
                          rx="8"
                          className="fill-rose-600 stroke-white dark:stroke-zinc-900"
                          strokeWidth="1.5"
                        />
                        <text
                          x="0"
                          y="3.5"
                          className="fill-white font-mono text-[8.5px] font-bold text-center"
                          textAnchor="middle"
                        >
                          {(node.scoreLaranja * 100).toFixed(0)}%
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Canvas Hint Pill */}
            <div className="absolute bottom-3 left-3 z-10 pointer-events-none bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2 shadow-sm">
              <Move className="w-3.5 h-3.5 text-slate-400" />
              <span>Arraste os nós ou o fundo para navegar • Roda do mouse amplia</span>
            </div>
          </div>
        )}

        {/* Collapsible Forensic Inspector Drawer */}
        {isInspectorOpen && selectedNode && (
          <div className="absolute top-3 right-3 z-30 w-80 md:w-88 bg-white/95 dark:bg-[#11141c]/95 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col max-h-[calc(100%-1.5rem)] text-xs overflow-hidden transition-all animate-in fade-in slide-in-from-right-2 duration-150">
            {/* Drawer Header */}
            <div className="p-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: getNodeColor(selectedNode.type) }}
                />
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                  Ficha do Alvo // {selectedNode.stageName}
                </span>
              </div>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                title="Fechar ficha (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Title & Risk Score */}
            <div className="p-3 border-b border-slate-100 dark:border-zinc-800/80">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedNode.label}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                    {selectedNode.sublabel}
                  </p>
                </div>
                {selectedNode.scoreLaranja && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800 font-mono">
                    S_straw {(selectedNode.scoreLaranja * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/40 text-xs font-medium">
              <button
                onClick={() => setActiveInspectorTab("overview")}
                className={`flex-1 py-1.5 text-center border-b-2 transition-colors ${
                  activeInspectorTab === "overview"
                    ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold"
                    : "border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                }`}
              >
                Visão Geral
              </button>
              <button
                onClick={() => setActiveInspectorTab("fiscal")}
                className={`flex-1 py-1.5 text-center border-b-2 transition-colors ${
                  activeInspectorTab === "fiscal"
                    ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold"
                    : "border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                }`}
              >
                Dados Fiscais & CAR
              </button>
              <button
                onClick={() => setActiveInspectorTab("links")}
                className={`flex-1 py-1.5 text-center border-b-2 transition-colors ${
                  activeInspectorTab === "links"
                    ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold"
                    : "border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                }`}
              >
                Vínculos
              </button>
            </div>

            {/* Tab Contents Scroll Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {activeInspectorTab === "overview" && (
                <div className="space-y-2">
                  {Object.entries(selectedNode.riskDetails).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 text-xs"
                    >
                      <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-0.5">
                        <span className="font-medium">{key}</span>
                        <button
                          onClick={() => handleCopy(key, val)}
                          className="hover:text-slate-800 dark:hover:text-white"
                          title="Copiar valor"
                        >
                          {copiedKey === key ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-60 hover:opacity-100" />
                          )}
                        </button>
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-zinc-100">
                        {val}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeInspectorTab === "fiscal" && (
                <div className="space-y-2">
                  {selectedNode.fiscalData ? (
                    Object.entries(selectedNode.fiscalData).map(([key, val]) => (
                      <div
                        key={key}
                        className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 text-xs"
                      >
                        <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-0.5">
                          <span className="font-medium">{key}</span>
                          <button
                            onClick={() => handleCopy(key, val)}
                            className="hover:text-slate-800 dark:hover:text-white"
                            title="Copiar valor"
                          >
                            {copiedKey === key ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-60 hover:opacity-100" />
                            )}
                          </button>
                        </div>
                        <div className="font-mono text-slate-900 dark:text-zinc-100">
                          {val}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-slate-400 text-xs">
                      Sem registros fiscais associados a este nó.
                    </div>
                  )}
                </div>
              )}

              {activeInspectorTab === "links" && (
                <div className="space-y-2">
                  {links
                    .filter(
                      (l) => l.source === selectedNode.id || l.target === selectedNode.id
                    )
                    .map((l) => {
                      const otherNodeId =
                        l.source === selectedNode.id ? l.target : l.source;
                      const otherNode = nodes.find((n) => n.id === otherNodeId);
                      const isOutgoing = l.source === selectedNode.id;

                      return (
                        <div
                          key={l.id}
                          className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 dark:text-zinc-200">
                              {otherNode?.label || otherNodeId}
                            </span>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                                l.isSuspicious
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                                  : "bg-slate-100 text-slate-600 dark:bg-zinc-700 dark:text-zinc-300"
                              }`}
                            >
                              {isOutgoing ? "Origem → Destino" : "Destino ← Origem"}
                            </span>
                          </div>
                          <p className="mt-1 text-slate-600 dark:text-zinc-400 text-xs">
                            {l.label}
                          </p>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphVisualizer;
