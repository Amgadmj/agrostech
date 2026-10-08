"use client";

import React, { useEffect } from "react";
import {
  ShieldCheck,
  X,
  FileCheck2,
  TreePine,
  Wheat,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ExternalLink,
  BookOpen,
} from "lucide-react";

interface MapBiomasWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MapBiomasWorkflowModal: React.FC<MapBiomasWorkflowModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="workflow-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm p-4 font-sans animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#11141c] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-300 dark:border-emerald-800">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 id="workflow-modal-title" className="font-bold text-slate-900 dark:text-white text-sm">
                Guia Institucional: Como Funcionam os 9 Temas MapBiomas na AgrosTech
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Padrões operacionais para Bancos, Barter e Compliance Fundiário (BCB CMN 5.267 / EUDR)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar guia institucional"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Executive Value Proposition */}
          <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
            <strong>O que é o MapBiomas na Plataforma?</strong> O MapBiomas é uma rede multi-institucional (ONGs, universidades e startups de tecnologia) que produz mapeamentos anuais da dinâmica de cobertura e uso da terra no Brasil com 30 metros de resolução (Coleção 9.0) e alertas validados em alta resolução de 3 metros (MapBiomas Alerta). A AgrosTech cruza essa inteligência em tempo real com as coordenadas do CAR e SICAR.
          </div>

          {/* 3 Core Workflows */}
          <div className="space-y-3">
            {/* Workflow 1 */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4" />
                <span>Workflow 1: Auditoria de Desmatamento (MapBiomas Alerta + Código Florestal / EUDR)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                <strong>Objetivo:</strong> Blindagem contra multas ambientais e bloqueio de CPRs pelo Banco Central (Resolução CMN nº 5.267/2025) e exigências da União Europeia (Regulamento EUDR).
              </p>
              <div className="bg-white dark:bg-zinc-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 space-y-1 text-xs font-mono text-slate-700 dark:text-zinc-300">
                <div>• <strong>Marco Temporal 22/07/2008:</strong> Área consolidada sob o Código Florestal (Lei 12.651/2012).</div>
                <div>• <strong>Marco Temporal 31/12/2020:</strong> Cut-off date do EUDR para exportação de soja e carne à Europa.</div>
                <div>• <strong>Como é exibido no mapa:</strong> O sistema destaca em vermelho qualquer laudo de supressão vegetal recente sobreposto ao CAR. Caso não haja alertas (ex: Fazenda Buritis), emite o <strong>Selo Verde de Imóvel Livre de Desmatamento</strong>.</div>
              </div>
            </div>

            {/* Workflow 2 */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wide">
                <Wheat className="w-4 h-4" />
                <span>Workflow 2: Área Útil Líquida M1 & Aptidão Agrícola (Coleção 9)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                <strong>Objetivo:</strong> Determinar com precisão centimétrica quanto da propriedade é lavoura produtiva (garantia real de penhor de safra) e quanto é vegetação nativa intocável.
              </p>
              <div className="bg-white dark:bg-zinc-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 space-y-1 text-xs font-mono text-slate-700 dark:text-zinc-300">
                <div>• <strong>Cálculo do Modelo M1:</strong> Deduz APP (26,91 ha) e Reserva Legal (43,42 ha) da área bruta (217,12 ha).</div>
                <div>• <strong>Como é exibido no mapa:</strong> A lavoura comercial é pintada em rosa/âmbar (146,79 ha - 67,6%), a Reserva Legal em verde-escuro e a APP em ciano, acompanhada da tabela de distribuição de hectares no painel flutuante.</div>
              </div>
            </div>

            {/* Workflow 3 */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wide">
                <Flame className="w-4 h-4" />
                <span>Workflow 3: Risco de Queimadas & Fogo (MapBiomas Fogo 3.0)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                <strong>Objetivo:</strong> Subscrição de Seguro Rural e cálculo de prêmio de risco para crédito de custeio agrícola.
              </p>
              <div className="bg-white dark:bg-zinc-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 space-y-1 text-xs font-mono text-slate-700 dark:text-zinc-300">
                <div>• <strong>Histórico de Cicatrizes:</strong> Mapeia a frequência de queimadas entre 1985 e 2024.</div>
                <div>• <strong>Como é exibido no mapa:</strong> Manchas térmicas e cicatrizes acumuladas são sobrepostas com o histórico mensal/anual selecionável.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/70 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-zinc-400">
            Fontes: MapBiomas Brasil • MapBiomas Alerta • SICAR • IBAMA
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
