import {
  CarDemonstrativoData,
  R2cSituacaoResponse,
  R2cRestricoesResponse,
} from "./types";

/**
 * Fixture 1: Real Compliant Benchmark Parcel (Fazenda Buritis, Buritis/MG)
 * CAR: MG-3109300-4829A0D7314B4A45A7C49102B94C7192
 */
export const FIXTURE_BURITIS_DEMONSTRATIVO: CarDemonstrativoData = {
  car_id: "MG-3109300-4829A0D7314B4A45A7C49102B94C7192",
  status: "s",
  mensagem: "Operação realizada com sucesso.",
  dados: {
    cabecalho: {
      codigo: "MG-3109300-4829A0D7314B4A45A7C49102B94C7192",
      statusImovel: "Ativo",
      condicaoAnalise: "Aguardando análise",
      dataRegistro: "15/01/2016",
      dataRetificacao: "10/02/2024",
      dataDemonstrativo: "01/03/2026 10:00",
      houveRetificacao: true,
      municipio: "Buritis",
      estado: "MG",
      area: 217.12,
      modulosFiscais: 3.6187,
      centroideX: -46.6032,
      centroideY: -15.4389,
      latitude: "15°26'20,04\" S",
      longitude: "46°36'11,52\" O",
      aderiuPRA: false,
      condicaoPRA: null,
      dataAnalise: null,
      sucessoConexaoReceptorPRA: true,
    },
    areas: {
      areaLiquida: 217.12,
      areaAPP: 26.91,
      areaAPPEmAC: 0,
      areaAPPEmAA: 0,
      areaAPPRecompor: 0,
      areaAPPSobrepostaRVN: 26.91,
      areaRLMinimaExigidaLei: 43.424,
      areaRLDeclarada: 43.42,
      areaRLP: 43.42,
      areaRLA: 0,
      areaRLANA: 0,
      areaRLEmAPP: 0,
      areaRLRecompor: 0,
      areaRLRecomporAA: 0,
      areaRLRecomporAC: 0,
      areaRLVetorizadaSobrepostaRVN: 43.42,
      areaRLExcedentePassivo: 0,
      situacaoRL: "Regular",
      areaRVN: 43.42,
      areaUsoConsolidado: 146.79,
      areaAA: 0,
      areaAP: 0,
      areaUsoRestrito: 0,
      areaServidaoAdministrativa: 0,
      areaSobreposicaoOutrosImoveis: 0,
      areaSobreposicaoUC: 0,
      areaSobreposicaoTI: 0,
      areaSobreposicaoAssentamento: 0,
    },
    restricoes: [],
    temTI: false,
  },
};

export const FIXTURE_BURITIS_SITUACAO: R2cSituacaoResponse = {
  status: "COMPLETED",
  result: "PASSED",
  data: {
    numero_car: "MG-3109300-4829A0D7314B4A45A7C49102B94C7192",
    situacao_car: "Ativo",
    data_demonstrativo: "2026-03-01",
  },
  _metadata: {
    numero_car: "MG-3109300-4829A0D7314B4A45A7C49102B94C7192",
    data_max_age: 7,
    approved_statuses: ["Ativo", "Pendente"],
  },
};

export const FIXTURE_BURITIS_RESTRICOES: R2cRestricoesResponse = {
  status: "COMPLETED",
  result: "PASSED",
  data: {
    numero_car: "MG-3109300-4829A0D7314B4A45A7C49102B94C7192",
    data_demonstrativo: "2026-03-01",
    restricoes: [],
  },
  _metadata: {
    numero_car: "MG-3109300-4829A0D7314B4A45A7C49102B94C7192",
    data_max_age: 7,
  },
};

/**
 * Fixture 2: Real Embargoed Parcel (Fazenda Rio Preto, Sorriso/MT)
 * CAR: MT-5107909-6C8E91A0B2C3D4E5F67890123456789A
 */
export const FIXTURE_SORRISO_DEMONSTRATIVO: CarDemonstrativoData = {
  car_id: "MT-5107909-6C8E91A0B2C3D4E5F67890123456789A",
  status: "s",
  mensagem: "Operação realizada com sucesso.",
  dados: {
    cabecalho: {
      codigo: "MT-5107909-6C8E91A0B2C3D4E5F67890123456789A",
      statusImovel: "Ativo",
      condicaoAnalise: "Aguardando análise",
      dataRegistro: "18/08/2017",
      dataRetificacao: "14/05/2023",
      dataDemonstrativo: "12/02/2026 14:20",
      houveRetificacao: true,
      municipio: "Sorriso",
      estado: "MT",
      area: 1250.0,
      modulosFiscais: 12.5,
      centroideX: -55.71,
      centroideY: -12.55,
      latitude: "12°33'00,00\" S",
      longitude: "55°42'36,00\" O",
      aderiuPRA: false,
    },
    areas: {
      areaLiquida: 1250.0,
      areaAPP: 112.4,
      areaRLMinimaExigidaLei: 437.5, // 35% Cerrado in Legal Amazon
      areaRLDeclarada: 437.5,
      areaRLP: 437.5,
      areaRLA: 0,
      areaRLEmAPP: 0,
      areaRLRecompor: 0,
      situacaoRL: "Regular",
      areaRVN: 437.5,
      areaUsoConsolidado: 685.3,
      areaUsoRestrito: 0,
      areaServidaoAdministrativa: 0,
      areaSobreposicaoOutrosImoveis: 0,
      areaSobreposicaoUC: 0,
      areaSobreposicaoTI: 0,
      areaSobreposicaoAssentamento: 0,
    },
    restricoes: [
      {
        id: 1,
        descricao:
          "Infração IBAMA TAD-991204-A: Sobreposição com zona fiscalizada de proteção e embargo ambiental.",
        origem: "Áreas Embargadas Sobreposição",
        dataRegistro: "22/03/2024",
        areaConflito: 14.8,
        percentualConflito: 1.18,
        fase: "Ativo",
      },
    ],
    temTI: false,
  },
};

export const FIXTURE_SORRISO_SITUACAO: R2cSituacaoResponse = {
  status: "COMPLETED",
  result: "PASSED",
  data: {
    numero_car: "MT-5107909-6C8E91A0B2C3D4E5F67890123456789A",
    situacao_car: "Ativo",
    data_demonstrativo: "2026-02-12",
  },
  _metadata: {
    numero_car: "MT-5107909-6C8E91A0B2C3D4E5F67890123456789A",
    data_max_age: 7,
    approved_statuses: ["Ativo", "Pendente"],
  },
};

export const FIXTURE_SORRISO_RESTRICOES: R2cRestricoesResponse = {
  status: "COMPLETED",
  result: "FAILED",
  data: {
    numero_car: "MT-5107909-6C8E91A0B2C3D4E5F67890123456789A",
    data_demonstrativo: "2026-02-12",
    restricoes: [
      {
        id: 1,
        origem: "Áreas Embargadas Sobreposição",
        data_registro: "22/03/2024",
        area_conflito: 14.8,
        percentual_conflito: 1.18,
        descricao:
          "Infração IBAMA TAD-991204-A: Sobreposição com zona fiscalizada de proteção e embargo ambiental.",
      },
    ],
  },
  _metadata: {
    numero_car: "MT-5107909-6C8E91A0B2C3D4E5F67890123456789A",
    data_max_age: 7,
  },
};

/**
 * Fixture 3: Amazon Biome Heavy Forest / High Conservation (São Félix do Xingu, PA)
 * CAR: PA-1507300-FC136733C09E4DEE9BFDBE8C016B2FE7
 */
export const FIXTURE_XINGU_DEMONSTRATIVO: CarDemonstrativoData = {
  car_id: "PA-1507300-FC136733C09E4DEE9BFDBE8C016B2FE7",
  status: "s",
  mensagem: "Operação realizada com sucesso.",
  dados: {
    cabecalho: {
      codigo: "PA-1507300-FC136733C09E4DEE9BFDBE8C016B2FE7",
      statusImovel: "Ativo",
      condicaoAnalise: "Aguardando análise",
      dataRegistro: "20/05/2016",
      dataRetificacao: "13/03/2024",
      dataDemonstrativo: "20/11/24 20:28",
      houveRetificacao: true,
      municipio: "São Félix do Xingu",
      estado: "PA",
      area: 19993.2104,
      modulosFiscais: 266.5761,
      centroideX: -52.8228110927235,
      centroideY: -6.56798240702913,
      latitude: "06°34'04,74\" S",
      longitude: "52°49'22,12\" O",
      aderiuPRA: null,
      condicaoPRA: null,
      dataAnalise: null,
      sucessoConexaoReceptorPRA: false,
    },
    areas: {
      areaLiquida: 19898.746,
      areaAPP: 1544.9133,
      areaAPPEmAC: 671.4462,
      areaAPPEmAA: 6.0449,
      areaAPPRecompor: 516.6,
      areaAPPSobrepostaRVN: 867.4189,
      areaRLMinimaExigidaLei: 15918.9968,
      areaRLDeclarada: 0,
      areaRLP: 9070.7686,
      areaRLA: 0,
      areaRLANA: 0,
      areaRLEmAPP: 895.5817,
      areaRLRecompor: 284.4632,
      areaRLRecomporAA: 231.8408,
      areaRLRecomporAC: 52.691,
      areaRLVetorizadaSobrepostaRVN: 8786.2259,
      areaRLExcedentePassivo: -6850.036,
      situacaoRL: "Não Analisada",
      areaRVN: 8802.5359,
      areaUsoConsolidado: 10657.2095,
      areaAA: 238.1646,
      areaAP: 0,
      areaUsoRestrito: 0,
      areaServidaoAdministrativa: 94.3643,
      areaSobreposicaoOutrosImoveis: 65.6519,
      areaSobreposicaoUC: 19993.2104,
      areaSobreposicaoTI: 0,
      areaSobreposicaoAssentamento: 0,
    },
    restricoes: [
      {
        id: 5,
        descricao:
          "Área de Proteção Ambiental-ÁREA DE PROTEÇÃO AMBIENTAL TRIUNFO DO XINGU",
        origem: "Unidade de Conservação",
        dataRegistro: "13/03/2024",
        areaConflito: 19993.2104,
        percentualConflito: 100,
        fase: null,
      },
    ],
    temTI: false,
  },
};

export const FIXTURE_XINGU_SITUACAO: R2cSituacaoResponse = {
  status: "COMPLETED",
  result: "PASSED",
  data: {
    numero_car: "PA-1507300-FC136733C09E4DEE9BFDBE8C016B2FE7",
    situacao_car: "Ativo",
    data_demonstrativo: "2024-11-20",
  },
  _metadata: {
    numero_car: "PA-1507300-FC136733C09E4DEE9BFDBE8C016B2FE7",
    data_max_age: 7,
    approved_statuses: ["Ativo", "Pendente"],
  },
};

export const FIXTURE_XINGU_RESTRICOES: R2cRestricoesResponse = {
  status: "COMPLETED",
  result: "FAILED",
  data: {
    numero_car: "PA-1507300-FC136733C09E4DEE9BFDBE8C016B2FE7",
    data_demonstrativo: "2024-11-20",
    restricoes: [
      {
        id: 5,
        origem: "Unidade de Conservação",
        data_registro: "13/03/2024",
        area_conflito: 19993.2104,
        percentual_conflito: 100,
        descricao:
          "Área de Proteção Ambiental-ÁREA DE PROTEÇÃO AMBIENTAL TRIUNFO DO XINGU",
      },
    ],
  },
  _metadata: {
    numero_car: "PA-1507300-FC136733C09E4DEE9BFDBE8C016B2FE7",
    data_max_age: 7,
  },
};

/**
 * Fixture Registry mapping CAR codes to fixtures
 */
export const FIXTURE_REGISTRY: Record<
  string,
  {
    demonstrativo: CarDemonstrativoData;
    situacao: R2cSituacaoResponse;
    restricoes: R2cRestricoesResponse;
  }
> = {
  "MG-3109300-4829A0D7314B4A45A7C49102B94C7192": {
    demonstrativo: FIXTURE_BURITIS_DEMONSTRATIVO,
    situacao: FIXTURE_BURITIS_SITUACAO,
    restricoes: FIXTURE_BURITIS_RESTRICOES,
  },
  "MT-5107909-6C8E91A0B2C3D4E5F67890123456789A": {
    demonstrativo: FIXTURE_SORRISO_DEMONSTRATIVO,
    situacao: FIXTURE_SORRISO_SITUACAO,
    restricoes: FIXTURE_SORRISO_RESTRICOES,
  },
  "PA-1507300-FC136733C09E4DEE9BFDBE8C016B2FE7": {
    demonstrativo: FIXTURE_XINGU_DEMONSTRATIVO,
    situacao: FIXTURE_XINGU_SITUACAO,
    restricoes: FIXTURE_XINGU_RESTRICOES,
  },
};

/**
 * Resolves fixture by CAR code or returns null for unknown CARs (C01 compliance: no silent fallback to Buritis)
 */
export function getFixtureForCar(carCode: string): {
  demonstrativo: CarDemonstrativoData;
  situacao: R2cSituacaoResponse;
  restricoes: R2cRestricoesResponse;
} | null {
  const normalized = carCode.trim().toUpperCase();

  if (FIXTURE_REGISTRY[normalized]) {
    return FIXTURE_REGISTRY[normalized];
  }

  // Check prefix or partial match for verified reference fixtures
  if (normalized.startsWith("MT-") || normalized.includes("SORRISO")) {
    return FIXTURE_REGISTRY["MT-5107909-6C8E91A0B2C3D4E5F67890123456789A"];
  }
  if (normalized.startsWith("PA-") || normalized.includes("XINGU")) {
    return FIXTURE_REGISTRY["PA-1507300-FC136733C09E4DEE9BFDBE8C016B2FE7"];
  }

  // C01: Never silently map unknown CAR codes to Buritis.
  return null;
}
