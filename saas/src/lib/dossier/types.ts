/**
 * Types for MCR 2-9 Compliance Dossier Generator and ICP-Brasil PAdES-LTV Digital Signatures.
 * In accordance with:
 * - Banco Central do Brasil Resolução CMN nº 5.267/2025
 * - Manual de Crédito Rural (MCR) Seção 2-9 (Impedimentos Sociais, Ambientais e Climáticos)
 * - Infraestrutura de Chaves Públicas Brasileira (ICP-Brasil DOC-ICP-15)
 * - RFC 3161 (Internet X.509 Public Key Infrastructure Time-Stamp Protocol)
 */

export interface IcpBrasilCertificateChain {
  actName: string; // e.g. "Autoridade de Carimbo do Tempo SERPRO" or "AC CAIXA-JUS"
  issuerCn: string; // e.g. "AC SERPRO Brasil v5" or "AC CAIXA-JUS v2"
  subjectCn: string; // e.g. "AGROSTECH PERICIAS DIGITAIS LTDA:12345678000199"
  serialNumber: string;
  certificateOid?: string;
  notBefore?: string;
  notAfter?: string;
}

export interface PadesLtvMetadata {
  dossierId: string;
  reportId?: string;
  policyOid: string; // "2.16.76.1.7.1" (DOC-ICP-15 ADRB)
  certificateChain: IcpBrasilCertificateChain;
  signatureFormat: "PAdES-LTV";
  hashAlgorithm: "SHA-256";
  signingTimeUtc: string;
  rfc3161TimestampToken: string;
  actName?: string; // convenient top-level access
}

export interface DossierInputData {
  carCode: string;
  farmName?: string;
  municipality?: string;
  stateUf?: string;
  matricula?: string;
  cprCode?: string;
  creditorName?: string;
  debtorName?: string;
  grossAreaHa: number;
  appAreaHa?: number;
  legalReserveAreaHa?: number;
  rlInAppAreaHa?: number;
  easementsHa?: number;
  restrictedUseHa?: number;
  netPlantableAreaHa?: number;
  sicarStatus?: string;
  embargoCount?: number;
  embargoesHa?: number;
  hasIndigenousOverlap?: boolean;
  hasConservationUnitOverlap?: boolean;
  hasSlaveLabor?: boolean;
  sarSeriesPoints?: number;
  sarHarvestDetected?: boolean;
  sarHarvestDate?: string;
  sarBaselineVerified?: boolean;
  issuedAt?: string;
  caAuthority?: "SERPRO" | "CAIXA_JUS";
}

export interface Mcr29ComplianceCheck {
  passed: boolean;
  rule: string;
  description: string;
  details?: Record<string, unknown>;
}

export interface Mcr29DossierReport {
  reportId: string;
  dossierId: string; // alias for compatibility
  timestamp: string;
  signingTimeUtc: string;
  sha256Checksum: string;
  carCode: string;
  farmName: string;
  municipality: string;
  stateUf: string;
  matricula: string;
  grossAreaHa: number;
  netPlantableAreaHa: number;
  netArableRatio: number;
  preservationRatio: number;
  sicarStatus: string;
  embargoCount: number;
  mcr29Status: "CONFORME" | "IMPEDIDO";
  eligibilityStatus: "ELIGIBLE" | "IMPEDED";
  passaporteAgrostechIssued: boolean;
  continuousMonitoringMandatory: boolean;
  mandatoryRemoteSensing: boolean;
  sarBaselineVerified: boolean;
  cmn5267Compliance: {
    continuousRemoteSensingMandatory: boolean;
    resolution: string;
    auditCadenceDays: number;
    status: string;
  };
  checks: {
    sicarStatus: Mcr29ComplianceCheck;
    ibamaEmbargo: Mcr29ComplianceCheck;
    indigenousLand: Mcr29ComplianceCheck;
    conservationUnit: Mcr29ComplianceCheck;
    publicForest: Mcr29ComplianceCheck;
    slaveLabor: Mcr29ComplianceCheck;
    plantableAreaRatio: Mcr29ComplianceCheck;
  };
  impediments: string[];
  recommendations: string[];
  reportType?: "analytical_report" | "signed_audit";
  signatureStatus?: "unsigned" | "signed";
  reportVersion?: string;
  supersededReportId?: string | null;
  reviewerDepartment?: string;
  regulatoryAssessmentStatus?: "SEM_IMPEDIMENTOS_IDENTIFICADOS" | "IMPEDIMENTOS_IDENTIFICADOS";
  integrityDigest?: string;
  padesSignatureMetadata: PadesLtvMetadata;
  padesLtv: PadesLtvMetadata; // alias
  rfc3161TimestampToken: string;
  pdfSummaryBase64?: string;
}
