"use client";

import React, { useState } from "react";
import { Gavel, FileCheck, ShieldAlert, Check, Copy, Download, X } from "lucide-react";

interface StrikeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StrikeModal: React.FC<StrikeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const petitionExcerpt = `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DO PLANTÃO JUDICIÁRIO
COMARCA DE BURITIS / UNAÍ - MG

REQUERENTE: CREDOR FIDUCIÁRIO / FUNDO DE INVESTIMENTO AGRO (FIAGRO)
REQUERIDOS: MARCOS SILVEIRA (DEVEDOR) E JULIANA SILVEIRA (PESSOA INTERPOSTA / LARANJA)
TERCEIRO CUSTODIANTE: CEREAIS DO CERRADO S/A (ARMAZÉM RECEPTOR - CNPJ 01.234.567/0001-89)

TUTELA CAUTELAR ANTECEDENTE DE BUSCA E APREENSÃO LIMINAR "INAUDITA ALTERA PARTE"
DE SAFRA DE SOJA FIDUCIARIAMENTE CEDIDA (CPR-2025/BURITIS-99)
COM FULCRO NOS ARTS. 300 E 301 DO CPC C/C ART. 19 DA LEI Nº 8.929/1994 (LEI DA CPR)
E TESE VINCULANTE DA 2ª SEÇÃO DO SUPERIOR TRIBUNAL DE JUSTIÇA (RESP 1.758.746/GO).

I. DA EXTRACONCURSALIDADE ABSOLUTA DA GARANTIA:
O Superior Tribunal de Justiça já assentou de forma pacífica que grãos agrícolas colhidos
constituem bens fungíveis, de consumo e circulação de mercado. NÃO CONSTITUEM "BENS DE CAPITAL
ESSENCIAIS À ATIVIDADE", descabendo qualquer blindagem pelo Stay Period concursal da Lei 11.101/05.

II. DA EVIDÊNCIA PERICIAL ORBITAL E FISCAL AGROSTECH:
1. Sensores de Micro-ondas Sentinel-1 SAR registraram o colapso de biomassa volumétrica (-22,1 dB)
   na Fazenda Buritis, comprovando a colheita clandestina noturna de 85.400 sacas;
2. As notas fiscais foram trianguladas criminosamente através da Inscrição Estadual nº 13.999.888-0,
   aberta há escassos 18 dias em nome da cônjuge do devedor (Score de Laranja = 94.0%);
3. O comboio de carretas (Placas JZX-8821, de propriedade do devedor) está neste instante
   despejando a soja na Moega 03 do Armazém Requerido.

III. DOS PEDIDOS LIMINARES URGENTES:
a) Expedição IMEDIATA de Mandado de Busca e Apreensão da totalidade das 85.400 sacas de soja,
   autorizando arrombamento e auxílio de força policial (CPC Art. 536 §1º e 846);
b) Nomeação do Credor Fiduciário como FIEL DEPOSITÁRIO dos grãos apreendidos;
c) Notificação imediata à gerência do Armazém Receptivo para bloqueio físico de moega e
   retenção do saldo vinculado à IE do Laranja, sob pena de crime de desobediência.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(petitionExcerpt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono select-none">
      <div className="relative w-full max-w-2xl bg-[#0a0d10] border-2 border-red-500/80 rounded-xl shadow-[0_0_50px_rgba(239,68,68,0.25)] flex flex-col overflow-hidden text-xs">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-red-950/40 border-b border-red-500/40">
          <div className="flex items-center gap-2.5 text-red-400">
            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
            <span className="font-bold text-sm tracking-wider">
              TUTELA CAUTELAR EXPRESS // MANDADO DE BUSCA E APREENSÃO
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div className="bg-[#12171e] p-3 rounded-lg border border-[#1f242b] text-[11px] text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Alvo da Constrição:</span>
              <span className="text-white font-bold">Cereais do Cerrado S/A (Moega 03)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Volume a Apreender:</span>
              <span className="text-emerald-400 font-bold">85.400 sacas de Soja (R$ 10.675.000,00)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fundamento Vinculante:</span>
              <span className="text-amber-400 font-bold">STJ REsp 1.758.746/GO (Extraconcursabilidade)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Certificação:</span>
              <span className="text-cyan-400 font-bold">ICP-Brasil SHA-256 (RFC 3161 Carimbo do Tempo)</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-bold block mb-1">
              Minuta Pronta para Protocolo no Plantão Judiciário:
            </span>
            <div className="w-full h-56 bg-[#050505] p-3 rounded border border-[#1f242b] overflow-y-auto text-[10px] text-slate-300 leading-relaxed whitespace-pre-wrap">
              {petitionExcerpt}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-[#050505] border-t border-[#1f242b] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Evidência pericial blindada para liminar sem oitiva da parte</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#12171e] hover:bg-[#1c242f] text-slate-200 border border-[#1f242b] font-bold transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copiado!" : "Copiar Petição"}</span>
            </button>

            <button
              onClick={() => {
                alert("Dossiê Forense PDF/A assinado ICP-Brasil exportado para a pasta de auditoria.");
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all"
            >
              <Gavel className="w-3.5 h-3.5" />
              <span>Protocolar no Plantão Judiciário</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
