# Data Processing — Perfil de Papel Humano | Agrostech

```yaml
role_id: "data_processing_001"
role_name: "Data Processing Specialist"
role_type: "HUMAN_ROLE"           # ← Papel executado por humano, não agente IA
layer: "operations"
reports_to: "coo_001"
direct_reports: []
language: "pt-BR"
company: "Agrostech"
version: "2.0"
note: "Convertido de AI Agent para Human Role em Jun/2026. Processamento geoespacial e QA de dados técnicos requerem julgamento profissional humano especializado."
```

> ⚠️ **PAPEL HUMANO** — Este papel é executado por um especialista humano em geoprocessamento. O sistema digital da Agrostech **organiza e prioriza** o trabalho via ClickUp, e **notifica** via Telegram — mas a análise técnica, QA e interpretação são responsabilidades humanas.

---

## 1. Identidade do Papel

**Nome do Papel:** Especialista em Processamento de Dados Geoespaciais  
**Título:** Analista de Dados RPAS & Geoprocessamento  
**Camada:** Operations  
**Tipo:** Papel Humano com Suporte Digital  

**Descrição em uma linha:**
> Transforma gigabytes de imagens brutas de drone em inteligência agrícola acionável — ortofoto precisa, NDVI interpretável e relatório que o cliente entende.

---

## 2. Por que Este Papel É Humano

| Razão | Detalhe |
|-------|---------|
| **Julgamento de QA técnico** | Detectar artefatos, lacunas de cobertura, problemas de calibração de sensor requerem olho experiente |
| **Interpretação contextual** | Identificar anomalias em NDVI (doença, seca, pragas) requer conhecimento agronômico |
| **Responsabilidade técnica** | Dados que embasam laudos de carbono (tCO₂e) têm implicações legais e financeiras |
| **Configuração de software** | Parâmetros de Pix4D/Metashape variam por missão, terreno e tipo de sensor |
| **Comunicação técnica** | Explicar resultados ao cliente/Account Manager requer adaptação de linguagem |

---

## 3. Responsabilidades Principais

### Primárias
1. **Processamento fotogramétrico** — ortofotos, nuvem de pontos, MDE com Pix4D/Metashape/DroneDeploy
2. **Geração de índices de vegetação** — NDVI, NDRE, GNDVI a partir de dados multiespectrais
3. **Controle de qualidade (QA)** — verificar acurácia posicional, GSD, cobertura, sem lacunas
4. **Pacote de entrega** — organizar arquivos em estrutura padronizada para o cliente
5. **Relatório técnico** — gerar relatório interpretativo com mapas e legendas
6. **MRV de carbono** — processar dados para estimativas de biomassa e cálculos de CO₂ estocado

### Secundárias
- Suporte técnico ao Account Manager para explicar resultados ao cliente
- Documentação de novos padrões na base de conhecimento
- Avaliação e adoção de novos softwares de processamento

---

## 4. KPIs do Papel Humano

| Métrica | Meta | Frequência |
|---------|------|------------|
| Tempo de processamento após receber dados | ≤ 24h (missões até 500 ha) | Por missão |
| Acurácia posicional (RMSE) | ≤ 5 cm horizontal (com RTK) | Por missão |
| Taxa de reprocessamento por erro | ≤ 2% | Mensal |
| GSD médio entregue | ≤ 3 cm/pixel (mapeamento agrícola) | Por missão |
| Checklist de QA preenchido no ClickUp | 100% | Por entrega |
| Atualização de status no ClickUp | A cada etapa concluída | Por missão |

---

## 5. Fluxo de Trabalho com Suporte Digital

```
FIELD PILOT (HUMANO) conclui missão
      ↓
  ✅ Task ClickUp "Pós-Missão" marcada como concluída
      ↓
  🔔 Notificação automática para Data Processing via Telegram:
  "Dados de campo disponíveis: [Fazenda] — [Data]
   Link de download: [URL]
   Prazo de entrega: [DATA+24h]"
      ↓
  📋 ClickUp cria Task automática:
  "🗺️ Processamento: [Fazenda] — [Data]"
  com prazo e checklist preenchidos
      ↓
  👷 DATA PROCESSING (HUMANO) processa os dados
      ↓
  Atualiza status no ClickUp a cada etapa:
  Em processamento → QA → Empacotando → Concluído
      ↓
  ✅ Task ClickUp marcada como "Produto Final Pronto"
      ↓
  Delivery Agent notificado → Client Success ativado
```

---

## 6. Interface com ClickUp

### Tasks Recebidas pelo Data Processing Specialist
O especialista recebe e gerencia as seguintes tasks no ClickUp:

| Task Template | Quem Cria | Quando |
|--------------|-----------|--------|
| `🗺️ Processamento: [Fazenda] — [Data]` | Sistema automático (trigger: Field Pilot conclui missão) | Imediatamente após missão |
| `✅ QA: Verificação de Produto Final` | Sistema automático | Após processamento marcado como concluído |
| `📦 Empacotamento de Entrega` | Sistema automático | Após QA aprovado |

### Checklist ClickUp de Processamento (preenchido pelo humano)
```
PROCESSAMENTO
☐ Dados brutos recebidos e verificados (integridade de arquivos)
☐ GCPs importados e conferidos com coordenadas RTK
☐ Processamento fotogramétrico iniciado (Pix4D/Metashape)
☐ Ortofoto gerada — GSD dentro do padrão (≤ 3 cm/px)
☐ MDE gerado (quando contratado)

QA — CONTROLE DE QUALIDADE
☐ Acurácia posicional verificada (RMSE ≤ 5 cm)
☐ Cobertura 100% sem lacunas
☐ Imagens sem artefatos visíveis (reflexo, desfoque, overexposure)
☐ NDVI gerado e calibrado (quando multiespectral)
☐ Relatório técnico revisado e aprovado

EMPACOTAMENTO
☐ Estrutura de pastas padronizada criada
☐ README_entrega.txt gerado
☐ Arquivos compactados e link de download gerado
☐ Delivery Agent notificado via ClickUp
```

---

## 7. Produtos Entregues (por tipo de missão)

### Mapeamento Agrícola Standard
```
entrega/
├── ortofotos/
│   └── ortofoto_[fazenda]_[data]_5cm.tif
├── mde/
│   └── mde_[fazenda]_[data].tif
├── ndvi/
│   └── ndvi_[fazenda]_[data].tif
│   └── ndvi_[fazenda]_[data]_classificado.shp
├── relatorio/
│   └── relatorio_tecnico_[fazenda]_[data].pdf
└── README_entrega.txt
```

### MRV de Carbono
```
mrv/
├── biomassa/
│   └── mapa_biomassa_[propriedade]_[data].tif
├── cobertura_vegetal/
│   └── cobertura_[propriedade]_[data].shp
├── calculo_carbono/
│   └── estimativa_carbono_[propriedade]_[data].xlsx
└── relatorio_mrv_[propriedade]_[data].pdf
```

---

## 8. Interações com o Sistema Digital

| Parceiro | Tipo | Canal |
|----------|------|-------|
| **Field Pilot (Humano)** | Recebe dados brutos organizados + handoff padronizado | ClickUp Task + Telegram |
| **COO Agent** | Reporta prazo de entrega, gargalos, status de processamento | ClickUp (status automático) |
| **Delivery Agent** | Passa produto final empacotado para handoff ao cliente | ClickUp Task handoff |
| **Account Manager Agent** | Suporte técnico para explicar dados ao cliente | ClickUp comments + Telegram |
| **Knowledge Agent** | Envia aprendizados, novos padrões e anomalias para base de conhecimento | ClickUp → KB automático |

---

*Agrostech | Data Processing — Perfil de Papel Humano v2.0 | Atualizado: Junho 2026*
