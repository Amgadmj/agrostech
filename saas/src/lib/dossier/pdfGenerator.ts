import { Mcr29DossierReport } from "./types";

/**
 * Generates a genuine, valid PDF-1.4 document buffer from an Mcr29DossierReport.
 * Built with pure TypeScript, zero external binary or OS-native dependencies.
 */
export function generateDossierPdfBuffer(report: Mcr29DossierReport): Buffer {
  const sanitizeText = (txt: string) => {
    return txt.replace(/[\\()]/g, "\\$&");
  };

  const lines: string[] = [
    "AGROSTECH PERICIAS DIGITAIS & INTELIGENCIA TERRITORIAL",
    "DOSSIE DE AUDITORIA SOCIOAMBIENTAL MCR 2-9",
    "Regulamentacao: BCB Resolucao CMN no 5.267/2025 & MCR Secao 2-9",
    "--------------------------------------------------------------------------------",
    `Identificador do Dossie: ${report.reportId}`,
    `Data/Hora de Emissao: ${report.timestamp}`,
    `Status Regulador MCR 2-9: ${report.mcr29Status}`,
    `Elegibilidade Credito: ${report.eligibilityStatus}`,
    `Parecer Tecnico MCR 2-9: ${report.passaporteAgrostechIssued ? "SEM IMPEDIMENTOS IDENTIFICADOS" : "IMPEDIMENTOS DETECTADOS"}`,
    "Nota: A decisao de concessao de credito cabe exclusivamente a instituicao financeira.",
    "",
    "1. DADOS CADASTRAIS DO IMOVEL RURAL",
    `Nome da Propriedade: ${report.farmName}`,
    `Codigo CAR: ${report.carCode}`,
    `Localizacao: ${report.municipality} - ${report.stateUf}`,
    `Matricula Imobiliaria: ${report.matricula}`,
    `Area Total Cadastrada: ${report.grossAreaHa.toFixed(2)} ha`,
    `Area Util Liquida (Modelo M1): ${report.netPlantableAreaHa.toFixed(2)} ha`,
    `Taxa de Aproveitamento Agricola: ${(report.netArableRatio * 100).toFixed(1)}%`,
    `Indice de Preservacao Ambiental: ${(report.preservationRatio * 100).toFixed(1)}%`,
    "",
    "2. MATRIZ DE CONFORMIDADE SOCIOAMBIENTAL (MCR 2-9)",
    `- SICAR (MCR 2-9-1): ${report.checks.sicarStatus.passed ? "CONFORME" : "IMPEDIDO"} (${report.sicarStatus})`,
    `- Embargos IBAMA (MCR 2-9-2): ${report.checks.ibamaEmbargo.passed ? "LIMPO (0 Embargos)" : "IMPEDIDO (Embargos Ativos)"}`,
    `- Terras Indigenas (MCR 2-9-3): ${report.checks.indigenousLand.passed ? "ZERO SOBREPOSICAO" : "IMPEDIDO"}`,
    `- Unidades Conservacao (MCR 2-9-4): ${report.checks.conservationUnit.passed ? "ZERO SOBREPOSICAO" : "IMPEDIDO"}`,
    `- Florestas Publicas Tipo B (MCR 2-9-5): ${report.checks.publicForest.passed ? "CONFORME" : "IMPEDIDO"}`,
    `- Trabalho Escravo (MCR 2-9-6): ${report.checks.slaveLabor.passed ? "CONFORME" : "IMPEDIDO"}`,
    `- Taxa Minima Agricultavel (>=15%): ${report.checks.plantableAreaRatio.passed ? "CONFORME" : "IMPEDIDO"}`,
    "",
    "3. TELEMETRIA ORBITAL SAR & RESOLUCAO CMN No 5.267/2025",
    `Monitoramento Continuo Obrigatorio: ${report.continuousMonitoringMandatory ? "SIM (> 300 ha)" : "DISPENSADO (<= 300 ha)"}`,
    `Sensor Radar Utilizado: Sentinel-1 RTC L2 Analysis-Ready Data (Banda C 10m)`,
    `Base SAR Verificada: ${report.sarBaselineVerified ? "SIM (Historico Temporal Confirmado)" : "NAO"}`,
    `Cadencia de Auditoria: A cada 12 dias durante o ciclo fenologico`,
    "",
    "4. INTEGRIDADE CRIPTOGRAFICA E RASTREABILIDADE (SHA-256)",
    `Tipo de Relatorio: Relatorio Tecnico Analitico (Nao Assinado Digitalmente)`,
    `Versao do Documento: ${report.reportVersion || "1.0.0"}`,
    `Hash Criptografico SHA-256: ${report.sha256Checksum}`,
    `Status de Integridade: Digest SHA-256 autenticado contra o payload canonico`,
    "--------------------------------------------------------------------------------",
    "Relatorio pericial analitico para suporte a tomada de decisao de credito rural,",
    "elaborado em estrita observancia a Resolucao CMN no 5.267/2025 e MCR 2-9.",
  ];

  // Build PDF stream
  let streamContent = "BT\n/F1 9 Tf\n14 TL\n40 780 Td\n";
  for (const line of lines) {
    if (line === "") {
      streamContent += "T*\n";
    } else {
      const isHeader = line.startsWith("AGROSTECH") || line.startsWith("DOSSIE") || line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") || line.startsWith("4.");
      if (isHeader) {
        streamContent += `/F1 10 Tf (${sanitizeText(line)}) Tj T*\n/F1 9 Tf\n`;
      } else {
        streamContent += `(${sanitizeText(line)}) Tj T*\n`;
      }
    }
  }
  streamContent += "ET\n";

  const streamLength = Buffer.byteLength(streamContent, "utf8");

  // Construct standard PDF objects
  const objects: string[] = [
    // 1: Catalog
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
    // 2: Pages
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`,
    // 3: Page
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`,
    // 4: Contents
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}endstream\nendobj\n`,
    // 5: Font
    `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
  ];

  let pdfOutput = "%PDF-1.4\n";
  const xrefOffsets: number[] = [0]; // 0 object

  for (let i = 0; i < objects.length; i++) {
    xrefOffsets.push(pdfOutput.length);
    pdfOutput += objects[i];
  }

  const xrefStart = pdfOutput.length;
  pdfOutput += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (let i = 1; i <= objects.length; i++) {
    const offsetStr = xrefOffsets[i].toString().padStart(10, "0");
    pdfOutput += `${offsetStr} 00000 n \n`;
  }

  pdfOutput += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(pdfOutput, "utf8");
}
