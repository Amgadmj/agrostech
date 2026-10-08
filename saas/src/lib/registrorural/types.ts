/**
 * SICAR & Registro Rural API Gateway Types
 * Authoritative specification from Registro Rural API Gateway V2 and Federal SICAR (SFB)
 */

export interface FieldProvenance<T = any> {
  value: T;
  status: "available" | "unavailable" | "unverified";
  provider: string;
  sourceRecordId?: string;
  observationDate?: string;
  retrievalDate: string;
  methodVersion: string;
}

export interface SicarCabecalho {
  codigo: string;
  statusImovel: "Ativo" | "Pendente" | "Suspenso" | "Cancelado" | string;
  condicaoAnalise: "Aguardando análise" | "Em análise" | "Analisado" | string;
  dataRegistro: string;
  dataRetificacao?: string;
  dataDemonstrativo: string;
  houveRetificacao: boolean;
  municipio: string;
  estado: string;
  area: number;
  modulosFiscais: number;
  centroideX: number;
  centroideY: number;
  latitude: string;
  longitude: string;
  aderiuPRA?: boolean | null;
  condicaoPRA?: string | null;
  dataAnalise?: string | null;
  sucessoConexaoReceptorPRA?: boolean;
  sobrepostoTiNaoHomologada?: boolean | null;
  malhaMunDestinoAntigoCAR?: string | null;
  malhaMunOrigemCondicaoAnterior?: string | null;
  malhaMunOrigemNovoCAR?: string | null;
}

export interface SicarAreas {
  areaLiquida: number;
  areaAPP: number;
  areaAPPEmAC?: number;
  areaAPPEmAA?: number;
  areaAPPRecompor?: number;
  areaAPPSobrepostaRVN?: number;
  areaRLMinimaExigidaLei?: number;
  areaRLDeclarada?: number;
  areaRLP: number;
  areaRLA: number;
  areaRLANA?: number;
  areaRLEmAPP: number;
  areaRLRecompor?: number;
  areaRLRecomporAA?: number;
  areaRLRecomporAC?: number;
  areaRLVetorizadaSobrepostaRVN?: number;
  areaRLExcedentePassivo?: number;
  situacaoRL?: string;
  areaRLCompensadaDoIREmTerceiros?: number;
  areaRLCompensadaDeTerceirosNoIR?: number;
  areaRVN?: number;
  areaUsoConsolidado: number;
  areaAA?: number;
  areaAP?: number;
  areaUsoRestrito: number;
  areaUREmAC?: number;
  areaUREmAA?: number;
  areaUsoRestritoRecompor?: number;
  areaUsoRestritoSobrepostaRVN?: number;
  areaServidaoAdministrativa: number;
  areaSobreposicaoOutrosImoveis: number;
  areaSobreposicaoUC: number;
  areaSobreposicaoTI: number;
  areaSobreposicaoAssentamento: number;
}

export interface SicarRestricao {
  id: number | string;
  descricao: string;
  origem: string;
  dataRegistro: string;
  areaConflito: number;
  percentualConflito: number;
  fase?: string | null;
}

export interface CarDemonstrativoData {
  car_id: string;
  status: string;
  mensagem?: string;
  dados: {
    cabecalho: SicarCabecalho;
    areas: SicarAreas;
    restricoes: SicarRestricao[];
    temTI?: boolean;
  };
}

export interface CarDemonstrativoResponse {
  status: "PENDING" | "COMPLETE" | string;
  data: CarDemonstrativoData | null;
}

export interface CarDemonstrativoResult {
  status: "COMPLETE";
  data: CarDemonstrativoData;
  source: "live" | "demo_fallback";
  attempts: number;
  elapsedMs: number;
}

export interface R2cSituacaoData {
  numero_car: string;
  situacao_car: string;
  data_demonstrativo: string;
}

export interface R2cSituacaoResponse {
  status: "PENDING" | "COMPLETED" | string;
  result: "PASSED" | "FAILED" | null;
  data: R2cSituacaoData;
  _metadata?: {
    numero_car: string;
    data_max_age?: number;
    approved_statuses?: string[];
  };
}

export interface R2cRestricaoItem {
  id: number | string;
  origem: string;
  data_registro: string;
  area_conflito: number;
  percentual_conflito: number;
  descricao: string;
}

export interface R2cRestricoesData {
  numero_car: string;
  data_demonstrativo: string;
  restricoes: R2cRestricaoItem[];
}

export interface R2cRestricoesResponse {
  status: "PENDING" | "COMPLETED" | string;
  result: "PASSED" | "FAILED" | null;
  data: R2cRestricoesData;
  _metadata?: {
    numero_car: string;
    data_max_age?: number;
  };
}

export interface DemonstrativoOptions {
  maxAge?: number;
  timeoutMs?: number;
  initialDelayMs?: number;
  pollIntervalMs?: number;
  maxAttempts?: number;
  backoffMultiplier?: number;
  maxIntervalMs?: number;
  allowDemoFallback?: boolean;
  strict?: boolean;
}

export interface R2cSituacaoOptions {
  dataMaxAge?: number;
  approvedStatuses?: string[];
  timeoutMs?: number;
  initialDelayMs?: number;
  pollIntervalMs?: number;
  maxAttempts?: number;
  allowDemoFallback?: boolean;
  strict?: boolean;
}

export interface R2cRestricoesOptions {
  dataMaxAge?: number;
  timeoutMs?: number;
  initialDelayMs?: number;
  pollIntervalMs?: number;
  maxAttempts?: number;
  allowDemoFallback?: boolean;
  strict?: boolean;
}
