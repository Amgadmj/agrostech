/**
 * AgrosTech Dated Regulatory Rule Catalog
 * Authoritative interpretation index for BCB MCR 2-9 and CMN Resoluções 5.267/2025 & 5.303/2026.
 *
 * Implements C03 & P06:
 * - Dated rules with applicability dates, geographical scope, and exceptions.
 * - Tri-state results: "no_issue_detected" | "potential_issue" | "unknown".
 * - Operation-level scope (>300 ha financed enterprise condition from 1 March 2026).
 * - Separation between statutory legal compliance and commercial cooperative policies.
 */

export type CheckResultStatus = "no_issue_detected" | "potential_issue" | "unknown";

export interface DatedRegulatoryRule {
  ruleId: string;
  legalSource: string;
  effectiveDate: string;
  description: string;
  scope: "property" | "financed_operation";
  requiredEvidence: string[];
  reviewerDepartment: "credit_risk" | "compliance";
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  status: CheckResultStatus;
  evidence: string;
  missingDataReason?: string;
  ruleVersion: string;
  details?: Record<string, any>;
}

export interface FinancedOperation {
  operationId: string;
  purpose: "custeio" | "investimento" | "comercializacao";
  contractDate: string; // ISO date, e.g. "2026-03-15"
  crop: string; // e.g. "Cana-de-Açúcar" (Coplacana pilot focus)
  season: string; // e.g. "2026/2027"
  financedAreaHa: number;
  carCode: string;
}

export const REGULATORY_RULE_CATALOG: Record<string, DatedRegulatoryRule> = {
  "MCR_2_9_1": {
    ruleId: "MCR_2_9_1",
    legalSource: "Manual de Crédito Rural (MCR) 2-9-1 / Lei nº 12.651/2012",
    effectiveDate: "2012-05-25",
    description: "Inscrição ativa ou pendente no Cadastro Ambiental Rural (CAR).",
    scope: "property",
    requiredEvidence: ["Recibo SICAR", "Demonstrativo de Situação Cadastral"],
    reviewerDepartment: "credit_risk",
  },
  "MCR_2_9_2": {
    ruleId: "MCR_2_9_2",
    legalSource: "Manual de Crédito Rural (MCR) 2-9-2 / Lei nº 9.605/1998",
    effectiveDate: "2008-07-22",
    description: "Vedação a concessão de crédito para áreas com embargo ambiental ativo do IBAMA ou órgão estadual.",
    scope: "property",
    requiredEvidence: ["Cadastro Nacional de Embargos IBAMA", "Consulta Espacial de Sobreposição"],
    reviewerDepartment: "credit_risk",
  },
  "MCR_2_9_3": {
    ruleId: "MCR_2_9_3",
    legalSource: "Manual de Crédito Rural (MCR) 2-9-3 / CF Art. 231",
    effectiveDate: "1988-10-05",
    description: "Vedação a concessão de crédito incidente sobre Terras Indígenas demarcadas ou homologadas.",
    scope: "property",
    requiredEvidence: ["Base Geoespacial FUNAI"],
    reviewerDepartment: "credit_risk",
  },
  "MCR_2_9_4": {
    ruleId: "MCR_2_9_4",
    legalSource: "Manual de Crédito Rural (MCR) 2-9-4 / Lei nº 9.985/2000 (SNUC)",
    effectiveDate: "2000-07-18",
    description: "Vedação a sobreposição com Unidades de Conservação de Proteção Integral.",
    scope: "property",
    requiredEvidence: ["Cadastro Nacional de Unidades de Conservação (CNUC/ICMBio)"],
    reviewerDepartment: "credit_risk",
  },
  "MCR_2_9_5": {
    ruleId: "MCR_2_9_5",
    legalSource: "Manual de Crédito Rural (MCR) 2-9-5 / Lei nº 11.284/2006",
    effectiveDate: "2006-03-02",
    description: "Não incidência sobre Florestas Públicas Tipo B (não destinadas).",
    scope: "property",
    requiredEvidence: ["Cadastro Nacional de Florestas Públicas (CNFP/SFB)"],
    reviewerDepartment: "credit_risk",
  },
  "MCR_2_9_6": {
    ruleId: "MCR_2_9_6",
    legalSource: "Manual de Crédito Rural (MCR) 2-9-6 / Portaria Interministerial MTE/MMFDH",
    effectiveDate: "2016-05-11",
    description: "Inexistência de inscrição no Cadastro de Empregadores que tenham submetido trabalhadores a condições análogas à de escravo.",
    scope: "property",
    requiredEvidence: ["Cadastro de Empregadores MTE (Lista Suja)"],
    reviewerDepartment: "credit_risk",
  },
  "CMN_5267_SAR": {
    ruleId: "CMN_5267_SAR",
    legalSource: "Banco Central do Brasil Resolução CMN nº 5.267/2025 c/c Resolução CMN nº 5.303/2026",
    effectiveDate: "2026-03-01",
    description: "Exigência de sensoriamento remoto contínuo para empreendimentos financiados > 300 ha contratados a partir de 01/03/2026.",
    scope: "financed_operation",
    requiredEvidence: ["Série Temporal SAR Orbital (Sentinel-1 RTC)", "Polígono da Operação Financiada"],
    reviewerDepartment: "compliance",
  },
};

/**
 * Commercial Cooperative Policy (Separated from statutory law)
 */
export const COOPERATIVE_COMMERCIAL_POLICIES = {
  MINIMUM_PLANTABLE_RATIO: {
    policyId: "COOP_POLICY_AUL_RATIO",
    name: "Diretriz Comercial Coplacana: Aproveitamento Mínimo Sugerido ≥ 15%",
    description: "Recomendação agronômica interna para viabilidade de custeio. Não constitui impedimento legal federativo.",
    threshold: 0.15,
  },
};
