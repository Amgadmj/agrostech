# Agrostech Runner — Guia de Uso

## Início Rápido

### 1. Instalar dependências
```bash
cd runner/
pip install -r requirements.txt
```

### 2. Configurar API Key
Crie um arquivo `.env` na pasta `runner/`:
```bash
# Para Gemini (recomendado)
GEMINI_API_KEY=sua_chave_aqui

# Para OpenAI
# OPENAI_API_KEY=sua_chave_aqui

# Para Anthropic
# ANTHROPIC_API_KEY=sua_chave_aqui
```

Ou exporte no terminal:
```bash
set GEMINI_API_KEY=sua_chave_aqui    # Windows
export GEMINI_API_KEY=sua_chave_aqui # Linux/Mac
```

---

## Agentes Disponíveis

### CEO Agent
```bash
python ceo_agent.py                        # modo interativo
python ceo_agent.py "Qual nosso forecast?" # resposta direta
```

**Funções programáticas:**
```python
from ceo_agent import ceo, weekly_okr_review

# Revisão semanal de OKRs
resultado = weekly_okr_review()

# Decisão estratégica
resposta = ceo.chat("Devemos expandir para o estado do Pará?")

# Análise de novo mercado
from ceo_agent import new_market_analysis
analise = new_market_analysis("Pará", "Grande demanda por MRV na Amazônia")
```

---

### Sales Team
```bash
python sales_agent.py
```

**Funções programáticas:**
```python
from sales_agent import sales_rep, head_of_sales, qualify_lead

# Qualificar um lead
resultado = qualify_lead("Fazenda de 1.200 ha em Lucas do Rio Verde, MT. Planta soja.")

# Montar proposta
from sales_agent import build_proposal
proposta = build_proposal(
    client_name="Fazenda Bela Vista",
    area_ha=800,
    services=["mapeamento agrícola", "NDVI"],
    pain_points="Perdas por ferrugem sem conseguir identificar localização precisa"
)

# Revisão de pipeline
from sales_agent import pipeline_review
review = pipeline_review()
```

---

### Operations Team
```bash
python operations_agent.py
```

**Funções programáticas:**
```python
from operations_agent import chief_pilot, data_processing, plan_mission

# Planejar missão
plano = plan_mission(
    farm_name="Fazenda Progresso",
    area_ha=650,
    coordinates="Primavera do Leste, MT",
    mission_type="ortofoto + NDVI multiespectral",
    requested_date="25/06/2026"
)

# Workflow completo
from operations_agent import mission_to_delivery_workflow
workflow = mission_to_delivery_workflow("Fazenda Progresso", 650, "ortofoto + NDVI")
```

---

### Deal Desk — Conselho Financeiro (alimenta a calculadora de vendas)

Motor de cotação com pesquisa de cliente, unit economics reais e iteração de margem.
Personas do conselho em `agents/finance-board/` (Pricing Strategist, Unit Economics
Analyst, Market Intelligence Analyst). Fontes de verdade: `knowledge-base/UNIT_ECONOMICS.md`
e `knowledge-base/MARKET_INTELLIGENCE.md`.

```bash
# CLI (teste local)
python deal_desk.py 50000 profissional "Bruno Luiz"
python deal_desk.py 800 pacote "Menarim Sementes"

# Sem o parecer LLM do conselho (só o motor determinístico)
set DEAL_DESK_BOARD=0 && python deal_desk.py 1200 essencial
```

**No Telegram:** `/cotacao <area_ha> [plano] [cliente]` (roles: admin, sales, chief_pilot)
Planos: `essencial | ndvi | pacote | profissional | enterprise | pulverizacao`

**Fluxo de cada cotação:**
1. Pesquisa o cliente na web (Firecrawl Search) — nunca cotar no escuro
2. Calcula COGS real (piloto + logística + processamento + imposto 15%)
3. Itera o preço: âncora aprovada → piso de margem → banda competitiva → alavancas de volume
4. Convoca o Conselho (LLM) para o parecer final com script de negociação

**Pisos de margem líquida:** walk-away 15% | saudável 25% | alvo 35%.
A `sales_calculator.py` (comando `/calc`) também aplica o piso via `price_floor_per_ha()`.

**Funções programáticas:**
```python
from deal_desk import build_quote, research_client, handle_cotacao, price_floor_per_ha

quote = build_quote(area_ha=50000, plan_key="profissional")
piso = price_floor_per_ha(flights=3, products=5, area_ha=50000)
```

#### Reaprendizado (deal_memory.py)

O Conselho aprende com a resposta real dos clientes e recalibra os preços:

1. Toda `/cotacao` é salva com um ID em `runner/deals.db` (mostrado no memo)
2. O vendedor reporta a resposta: `/resultado <id> ganhou 75` |
   `/resultado <id> perdeu preço concorrente` | `/resultado <id> negociando 65`
3. Com ≥ 3 resultados por plano (janela de 90 dias) o motor recalibra:
   - Win rate ≥ 60% fechando no preço cheio → **âncora sobe 5%**
   - Win rate < 25% com perdas por preço → **preço cede 7%**, clampado no
     piso saudável (25%) e na banda — **o aprendizado nunca fura os pisos**
4. `/aprendizado` mostra o painel: win rate por plano, calibrações ativas,
   motivos de perda e cotações sem resposta
5. O parecer LLM do Conselho recebe o bloco "resposta real dos clientes"
   em toda nova cotação

```bash
python deal_memory.py                            # painel de aprendizado
python deal_memory.py resultado 12 ganhou 75     # reportar via CLI
```

---

## Motor de Prospecção Geomart (pipeline CrewAI)

Prospecção outbound automatizada a partir de parcelas certificadas SIGEF, com throttle de
5 pitches/dia por backlog. Orquestrado por `geomart_pipeline.py`, que encadeia:

1. **Agent 1+2 — Extrator + Resolver Geo** (`geomart_client.py`, autenticado via
   `geomart_auth.py` com sessão Playwright) — baixa e decodifica tiles MVT da Geomart,
   calcula área geodésica real de cada parcela SIGEF e faz upsert em `geomart_leads.db`.
2. **Agent 2.5 — Predição de Cultura** (`mapbiomas_client.py`) — estatística zonal do
   raster MapBiomas sobre a geometria de cada parcela para inferir uso agrícola do solo.
3. **Agent 3 — Resolver GTM / OSINT B2B** (`mercurius_client.py`) — identifica a empresa
   por trás da parcela usando só fontes públicas de pessoa jurídica (CNPJ, razão social);
   nunca automatiza login em SIGEF/SICAR nem expõe dado de pessoa física (LGPD).
4. **Agent 4 — Redator de Pitch** (`crew_agents.write_pitch`) — gera o pitch pronto para
   revisão humana.
5. **Saída** — `sheets_client.py` escreve a fila diária (aba `Fila_Pitches`) numa planilha
   Google Sheets; o histórico completo fica em `geomart_leads.db` para auditoria.

```bash
python geomart_pipeline.py
```

---

## Ceres Cubo — Classificação de Cultura (Fase 1, aprovada 2026-07-29)

Piloto técnico do motor de classificação de cultura por data cube + GEOBIA (ver a proposta
"Duas Alavancas de Dados" e Chaves et al., *AgriEngineering* 2025, 7, 19, DOI
10.3390/agriengineering7010019 — 95% de acurácia geral, MODIS + GEOBIA + SVM). Adaptado
para Sentinel-2 (10m, adequado ao tamanho real dos talhões) e 100% open-source (sem
licença eCognition), pacote `ceres_cubo/`:

1. **`datacube.py`** — busca Sentinel-2 L2A via STAC público sem chave (Element84 Earth
   Search) e lê só a janela de pixels da AOI por HTTP range request — nunca baixa a cena
   inteira. Calcula NDVI/NDWI/SAVI por data.
2. **`segmentation.py`** — segmenta a composição mediana da série em geo-objetos
   (`skimage.segmentation.felzenszwalb`, substituto aberto do MRS do eCognition).
3. **`features.py`** — 32 atributos por geo-objeto: estatística-resumo temporal por índice
   (média/desvio/mín/máx/amplitude/tendência), 6 texturas GLCM, 8 atributos geométricos.
4. **`classify.py`** — SVM (mesma escolha do artigo) com `StandardScaler` +
   `CalibratedClassifierCV` para confiança por predição.
5. **`evaluate.py`** — acurácia por hold-out estratificado (UA/PA/OA), mesmo desenho do
   artigo original — pronto para uso assim que houver amostras de campo reais.
6. **`pipeline.py`** — CLI que orquestra tudo sobre uma AOI (bbox direta ou união dos leads
   reais do Geomart num município) e compara contra o baseline atual (`mapbiomas_client.py`).

```bash
# AOI a partir de leads reais do Geomart (bbox de um município inteiro pode exceder uma
# cena Sentinel-2 — o CLI recusa com erro claro nesse caso; use --bbox para uma AOI menor)
python -m ceres_cubo.pipeline --bbox -48.29 -18.68 -48.24 -18.63 --start 2026-05-01 --end 2026-07-28

# Com amostras de campo rotuladas (treina + avalia — sem isso, roda em modo exploratório
# via KMeans, só para checar se o cubo+segmentação captura estrutura real)
python -m ceres_cubo.pipeline --bbox ... --labels-csv amostras.csv --save-model modelo.joblib
```

**Estado real (não maquiado):** hoje não há amostras de campo/referência para nossas
regiões (GO/MG/PR/RS) — sem elas, `pipeline.py` roda em modo exploratório (clustering, não
classificação de cultura). Levantar essas amostras é o próximo passo da Fase 1, não algo
que este código possa inventar sozinho.

---

## Alertas e Conteúdo Pré-Call de Marketing

Entrega valor a um lead antes da ligação comercial (ver proposta "Duas Alavancas de
Dados"): `agrobr_client.py` é a camada fina e resiliente sobre `agrobr.sync.datasets` (ver
`.claude/skills/agrobr/SKILL.md`) usada por:

- **`marketing_alerts.py`** — "Alerta de Safra" (queda de precipitação mês-a-mês vs. a
  média recente — não há granularidade diária sem `AGROBR_INMET_TOKEN`) e "Alerta de
  Incêndio" (`queimadas` do agrobr 1.1.0 tem um bug de contrato real e reproduzível — o
  INPE usa -999 como sentinela de "sem dado" em `risco_fogo`, o schema do agrobr rejeita
  valores negativos — `agrobr_client` absorve isso, mas o alerta não produz resultado até
  o bug ser corrigido upstream ou contornado).
- **`farm_snapshot.py`** — "Raio-X da Fazenda": imagem PNG (true-color + NDVI colorizado)
  de um lead específico, direto de Sentinel-2 via `ceres_cubo.datacube`. Usa Pillow, não
  matplotlib (`ft2font` é bloqueado pela mesma política de Application Control que bloqueia
  `pyogrio` — ver nota em `requirements.txt`).
- **`credit_insurance_context.py`** — contexto agregado (não por produtor — o agrobr não
  identifica CNPJ) de apólices de seguro rural (PSR) por município/cultura, para o pitch
  "laudo técnico fortalece seu dossiê de crédito/seguro".
- **`pre_call_drip.py`** — orquestra os três num sequência de 3 toques por lead, grava em
  `data/generated/pre_call_drip_<sigef_uuid>.md` (mesmo espírito dos `abm_trigger_*.md`
  já existentes). Camada de conteúdo pura — o envio real continua sendo dos bots
  (`telegram_bot.py`/`whatsapp_bot.py`).

```bash
python farm_snapshot.py --sigef-uuid <uuid> --out raiox.png
python pre_call_drip.py --sigef-uuid <uuid>
```

---

## Testes

```bash
python tests/test_pure_logic.py
```

Cobre a lógica determinística (zonal stats, limiares de alerta, segmentação/atributos,
classificador) sem precisar de rede — os caminhos de I/O (STAC, agrobr, Geomart) foram
validados manualmente contra dados reais durante o desenvolvimento de cada módulo.

---

## Departamentos CrewAI e Integrações Embrapa

`crew_agents.py` define os 5 agentes de departamento (Ceres Agrônoma, Operações, Ceres
Vendas, Ceres Marketing e Inteligência de Mercado) como CrewAI Agents, roteados via
`agent_router.py` (RBAC determinístico por dicionário — nenhuma chamada de LLM é gasta
para rotear; os departamentos LLM vivem em `crew_agents.py`, o Deal Desk permanece 100%
determinístico). `llm_config.py` é o ponto único de criação do LLM compartilhado
(Groq se houver `GROQ_API_KEY`, senão Gemini) e deve ser importado antes de qualquer
`import crewai`.

A Agrônoma e o time de Vendas têm acesso híbrido aos dados Embrapa AgroAPI:

- **`agrofit_client.py`** — Embrapa Agrofit v1 (defensivos agrícolas registrados)
- **`agrotermos_client.py`** — Embrapa Agrotermos v1 (zoneamento agroclimático)
- **`smartsolos_client.py`** — Embrapa SmartSolos Expert v1 (classificação de solo)

Todos os três compartilham OAuth2 (renovação automática de token), cache SQLite
persistente (`agrofit_cache.db`) para não estourar o limite gratuito da API, e fallback
com dados mock de alta qualidade quando as credenciais não estão configuradas.

**Entrypoint único:** `start_system.py` sobe o sistema completo (checa `.env`, roda o
seeder do banco `seed_telegram_db.py`, e inicia o Telegram Bot) — exceto WhatsApp, que
continua sendo iniciado à parte.

```bash
python start_system.py
```

---

## Comunicação Inter-Agentes

Todos os agentes podem se comunicar via `brief_other_agent()`:

```python
from ceo_agent import ceo
from sales_agent import head_of_sales

# CEO faz uma pergunta ao Head of Sales
resposta = ceo.brief_other_agent(
    head_of_sales, 
    "Qual é a maior oportunidade no pipeline esta semana?"
)
print(resposta)
```

---

## Logs

Todas as interações são salvas automaticamente em:
```
runner/logs/[agent_id]_[data].jsonl
```

Formato JSONL — uma linha por interação:
```json
{"timestamp": "...", "agent_id": "ceo_001", "message": "...", "response": "..."}
```

---

## Adicionando um Novo Agente

1. Crie o arquivo de persona em `agents/[camada]/[nome].md`
2. No runner, instancie:
```python
from base_agent import AgrostechAgent

meu_agente = AgrostechAgent(
    agent_id="meu_agente_001",
    persona_file="agents/[camada]/[nome].md",
    knowledge_topics=["PRICING_MODEL"]  # opcional
)

resposta = meu_agente.chat("Olá, qual é o seu papel?")
```

---

## Estrutura de Arquivos

```
runner/
├── base_agent.py          ← Classe base (todos os agentes herdam)
├── ceo_agent.py           ← CEO Agent runner
├── sales_agent.py         ← Sales Team runner
├── operations_agent.py    ← Operations Team runner
├── marketing_agent.py     ← Marketing Agent runner
├── agent_router.py        ← Roteador CrewAI (Telegram/WhatsApp → departamento)
├── crew_agents.py         ← 5 agentes de departamento CrewAI + ferramentas Embrapa
├── llm_config.py          ← Ponto único de criação do LLM compartilhado (CrewAI/LiteLLM)
├── start_system.py        ← Entrypoint: sobe seeder + Telegram Bot
├── telegram_bot.py        ← Gateway Telegram (comandos /cotacao, /resultado, etc.)
├── whatsapp_bot.py        ← Gateway WhatsApp
├── deal_desk.py           ← Motor de cotação (Conselho Financeiro)
├── deal_memory.py         ← Reaprendizado de preços a partir dos resultados reais
├── sales_calculator.py    ← Calculadora de vendas (/calc)
├── trend_hijacker.py      ← Geração de conteúdo de tendências
├── geomart_auth.py        ← Sessão Playwright autenticada na Geomart
├── geomart_client.py      ← Extrator + Resolver Geo (tiles MVT → geomart_leads.db)
├── geomart_pipeline.py    ← Orquestrador do Motor de Prospecção Geomart (throttle 5/dia)
├── mapbiomas_client.py    ← Predição de cultura via raster MapBiomas (estatística zonal)
├── mercurius_client.py    ← Resolver GTM / OSINT B2B (waterfall de fontes públicas)
├── sheets_client.py       ← Escreve a fila de pitches no Google Sheets
├── agrofit_client.py      ← Cliente Embrapa Agrofit (defensivos agrícolas)
├── agrotermos_client.py   ← Cliente Embrapa Agrotermos (zoneamento agroclimático)
├── smartsolos_client.py   ← Cliente Embrapa SmartSolos (classificação de solo)
├── seed_telegram_db.py    ← Seeder do banco de usuários/roles do Telegram
├── requirements.txt       ← Dependências Python
├── README.md              ← Este arquivo
└── logs/                  ← Gerado automaticamente
    └── [agent_id]_[data].jsonl
```
