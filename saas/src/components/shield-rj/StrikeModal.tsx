"use client";

import React, { useState, useEffect } from "react";
import {
  Gavel,
  FileCheck,
  ShieldAlert,
  Check,
  Copy,
  Download,
  X,
  FileText,
  Scale,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatNumber, formatHa, formatCurrency, formatSacas } from "@/lib/format";

export interface StrikeModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtorName?: string;
  strawPersonName?: string;
  cprCode?: string;
  warehouseName?: string;
  grainVolumeSacks?: number;
  debtAmountBrl?: number;
}

/**
 * Standard legal draft generator for judicial emergency plantão
 * under CPC Arts. 300/301 and STJ REsp 1.758.746/GO.
 */
export function generateCautelarDraft(
  debtor: string = "Marcos Silveira",
  strawPerson: string = "Juliana Silveira",
  cprCode: string = "CPR-2025/BURITIS-99"
) {
  return {
    title: "TUTELA CAUTELAR ANTECEDENTE DE BUSCA E APREENSÃO LIMINAR",
    legalBasis: [
      "Art. 300 e 301 do CPC",
      "Lei nº 8.929/1994",
      "STJ REsp 1.758.746/GO",
    ],
    doctrine:
      "Grãos agrícolas colhidos constituem bens fungíveis de consumo e circulação, excluídos da essencialidade sob o Art. 49 §3º da Lei 11.101/2005.",
    parties: { debtor, strawPerson, cprCode },
  };
}

export const StrikeModal: React.FC<StrikeModalProps> = ({
  isOpen,
  onClose,
  debtorName = "Marcos Silveira",
  strawPersonName = "Juliana Silveira",
  cprCode = "CPR-2025/BURITIS-99",
  warehouseName = "Cereais do Cerrado S/A (Armazém Receptor)",
  grainVolumeSacks = 9540,
  debtAmountBrl = 1192500,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const petitionExcerpt = `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DO PLANTÃO JUDICIÁRIO
COMARCA DE BURITIS / UNAÍ - ESTADO DE MINAS GERAIS

REQUERENTE: CREDOR FIDUCIÁRIO / FUNDO DE INVESTIMENTO AGRO (FIAGRO)
REQUERIDOS: ${debtorName.toUpperCase()} (DEVEDOR FIDUCIANTE) E ${strawPersonName.toUpperCase()} (PESSOA INTERPOSTA)
TERCEIRO CUSTODIANTE: ${warehouseName.toUpperCase()} (CNPJ 01.234.567/0001-89)

TUTELA CAUTELAR ANTECEDENTE DE BUSCA E APREENSÃO LIMINAR "INAUDITA ALTERA PARTE"
DE SAFRA DE SOJA FIDUCIARIAMENTE CEDIDA (${cprCode})
COM FULCRO NOS ARTS. 300 E 301 DO CPC C/C ART. 19 DA LEI Nº 8.929/1994 (LEI DA CPR)
E TESE VINCULANTE DA 2ª SEÇÃO DO SUPERIOR TRIBUNAL DE JUSTIÇA (RESP 1.758.746/GO).

I. DA EXTRACONCURSALIDADE ABSOLUTA DA GARANTIA FIDUCIÁRIA (STJ RESP 1.758.746/GO):
O Superior Tribunal de Justiça, sob a relatoria do Min. Marco Buzzi (REsp 1.758.746/GO), pacificou que
grãos agrícolas colhidos constituem bens fungíveis, de consumo e circulação de mercado.
NÃO CONSTITUEM "BENS DE CAPITAL ESSENCIAIS À ATIVIDADE".
Portanto, descabe qualquer blindagem pelo Stay Period concursal previsto no Art. 49 §3º da Lei 11.101/2005,
restando franqueada a imediata apreensão cautelar para resguardo da garantia fiduciária.

II. DOS 4 VETORES DE ALERTA DETECTADOS PELA PLATAFORMA AGROSTECH:
1. VETOR 1 (DISPARIDADE DE ÁREA): O imóvel rural Fazenda Buritis possui 217,12 ha declarados em CAR,
   porém deduções legais estritas (APP 26,91 ha + Reserva Legal 43,42 ha) delimitam a Área Útil Líquida M1
   em 146,79 ha. A sobredeclaração aponta disparidade de 48,0% em relação à área agricultável real.
2. VETOR 2 (TRANSFERÊNCIA DE CARGA): Registros de transbordo e desvio de safra indicam destinação
   de volume (~6.000 sacas de um total estimado em ${formatSacas(grainVolumeSacks)}) para o armazém intermediário,
   incompatível com a liquidação da CPR registrada.
3. VETOR 3 (SUPRESSÃO DE BIOMASSA SAR): Telemetria radar Sentinel-1 RTC L2 ARD registrou queda acentuada
   de retroespalhamento VH (-22,1 dB, Δ = -6,2 dB), indicativo de colheita rápida sob cobertura de nuvens,
   compatível com solo exposto, sem emissão correspondente de MDF-e pelo devedor fiduciante.
4. VETOR 4 (SINAIS DE BLINDAGEM PATRIMONIAL): Inscrição estadual de interposta pessoa cadastrada
   recentemente em nome do cônjuge (${strawPersonName}), associada a protestos cartorários no CENPROT
   totalizando R$ 1.850.000,00 junto a fornecedores de insumos da região.

III. DOS PEDIDOS LIMINARES DE URGÊNCIA:
a) A concessão liminar "inaudita altera parte" de BUSCA E APREENSÃO das ${formatSacas(grainVolumeSacks)} de soja vinculadas,
   autorizando auxílio de força policial especializada se necessário (CPC Arts. 536 §1º e 846);
b) A nomeação do Requerente Credor como FIEL DEPOSITÁRIO dos grãos apreendidos, autorizando sua remoção cautelar;
c) O bloqueio judicial físico da moega e silos do Armazém ${warehouseName}, intimando-se a gerência
   para abster-se de praticar atos de comistão ou transferir créditos à pessoa interposta;
d) A expedição de ofício à SEFAZ estadual para verificação fiscal e bloqueio de MDF-e emitidos em desacordo.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(petitionExcerpt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    setDownloading(true);
    try {
      const element = document.createElement("a");
      const file = new Blob([petitionExcerpt], { type: "text/plain;charset=utf-8" });
      element.href = URL.createObjectURL(file);
      element.download = `minuta_cautelar_cpc300_${cprCode.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } finally {
      setTimeout(() => setDownloading(false), 1000);
    }
  };

  const handleGenerateMinuta = async () => {
    setGenerating(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/dossier/generate?format=pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carCode: "MG-3109300-4829A0D7314B4A45A7C49102B94C7192",
          farmName: "Fazenda Buritis",
          grossAreaHa: 217.12,
          netPlantableAreaHa: 146.79,
          debtorName,
          cprCode,
          format: "pdf",
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `minuta_cautelar_icp_brasil_${cprCode.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setFeedback({
          type: "success",
          message: "Minuta da petição e Dossiê ICP-Brasil gerados com sucesso!",
        });
      } else {
        const data = await res.json().catch(() => null);
        setFeedback({
          type: "error",
          message: data?.error || `Falha ao gerar minuta (Status ${res.status}). Verifique a autenticação.`,
        });
      }
    } catch (e: any) {
      console.error("Dossier generation error:", e);
      setFeedback({
        type: "error",
        message: e.message || "Erro de conexão ao comunicar com o servidor.",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="strike-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm p-4 font-sans animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl bg-surface border border-surface-border rounded-xl shadow-2xl flex flex-col overflow-hidden text-xs max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-surface-hover/80 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <span id="strike-modal-title" className="font-bold text-sm text-foreground block font-display">
                Tutela Cautelar Antecedente de Urgência (CPC Arts. 300 / 301)
              </span>
              <span className="text-xs text-slate-muted">
                Ação Forense Anti-Fuga de Safra · Tese STJ REsp 1.758.746/GO (Extraconcursabilidade)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-1 rounded-md hover:bg-surface-hover text-slate-muted hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Inline Feedback Banner */}
          {feedback && (
            <div
              className={`p-3 rounded-lg border flex items-center gap-2 text-xs font-mono ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/30"
              }`}
            >
              {feedback.type === "success" ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Key Facts Summary Box */}
          <div className="bg-surface-hover/60 p-3.5 rounded-lg border border-surface-border text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-muted">Alvo da Constrição:</span>
              <span className="text-foreground font-semibold">{warehouseName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-muted">Volume Vinculado:</span>
              <span className="text-brand-emerald font-bold font-mono">
                {formatSacas(grainVolumeSacks)} de Soja ({formatCurrency(debtAmountBrl)})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-muted">Fundamento Vinculante:</span>
              <span className="text-amber-500 font-semibold font-mono">
                STJ REsp 1.758.746/GO (Exclusão do Stay Period)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-muted">Evidência Pericial:</span>
              <span className="text-cyan-500 font-semibold font-mono">
                Sentinel-1 RTC (-22,1 dB) + ICP-Brasil PAdES-LTV
              </span>
            </div>
          </div>

          {/* Legal Draft Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-foreground font-bold flex items-center gap-1.5 text-xs">
                <FileText className="w-3.5 h-3.5 text-rose-500" />
                Minuta da Petição Cautelar de Urgência (Plantão Judiciário):
              </span>
              <span className="text-xs text-slate-muted font-mono">
                Inaudita Altera Parte
              </span>
            </div>
            <div className="w-full h-64 bg-surface p-4 rounded-lg border border-surface-border overflow-y-auto text-xs text-foreground leading-relaxed whitespace-pre-wrap font-mono">
              {petitionExcerpt}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-surface-hover/80 border-t border-surface-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-slate-muted text-xs">
            <FileCheck className="w-3.5 h-3.5 text-brand-emerald" />
            <span>Evidência auditada com carimbo do tempo RFC 3161</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover text-foreground border border-surface-border font-medium transition-all text-xs shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-brand-emerald" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copiado!" : "Copiar Petição"}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover text-foreground border border-surface-border font-medium transition-all text-xs shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-cyan-500" />
              <span>{downloading ? "Baixando..." : "Download Minuta"}</span>
            </button>

            <button
              onClick={handleGenerateMinuta}
              disabled={generating}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold shadow-xs transition-all text-xs"
            >
              {generating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Gavel className="w-3.5 h-3.5" />
              )}
              <span>{generating ? "Gerando minuta..." : "Gerar minuta"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrikeModal;
