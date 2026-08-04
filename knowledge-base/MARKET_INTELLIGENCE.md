# Inteligência de Mercado — Agrostech

> **Confidencial — Uso Interno (Conselho Financeiro / Deal Desk)**
> Owner: Market Intelligence Analyst | Versão: 2.0 | Julho 2026
> Alimenta o Deal Desk (`runner/deal_desk.py`) com bandas competitivas, benchmarks de ROI e doutrina de negociação.
> **v2.0** incorpora a pesquisa profunda de concorrência de 07/2026 — ver [`research/MARKET_COMPETITION_REPORT_2026.md`](research/MARKET_COMPETITION_REPORT_2026.md), [`research/BOARDROOM_ANALYSIS_2026.md`](research/BOARDROOM_ANALYSIS_2026.md) e [`research/ACTION_PLAN_2026.md`](research/ACTION_PLAN_2026.md). Fontes e datas de acesso estão no relatório.

---

## 1. Contexto de Mercado (Brasil) — CORRIGIDO v2.0

- Mercado de drones agrícolas no Brasil: **~US$ 77 mi/ano (2024–25), crescendo 18–25%/ano** (Grand View Research / Ken Research). Economia total de "drone-ag" incluindo hardware e insumos de precisão: ~US$ 1,2 bi. Frota: ~35.000 drones em 2025; projeção Sindag: **> 90.000 em 2026**.
- ⚠️ **CORREÇÃO DE MOAT (substitui a afirmação da v1.0):** EXISTEM concorrentes relevantes no nosso corredor. **ARPAC** opera 8 bases em SP/GO/MG quase exclusivamente em cana (14 drones DJI, ~70 mil ha em 2025, R$ 7 mi de receita, EBITDA positivo, fotogrametria contínua em 4 hubs). **XMobots** (sócia: Embraer; US$ 28 mi captados) reivindica ~60% do setor sucroenergético via "Cana Solution".
- **Nosso moat real:** empacotamento multi-produto por voo (+R$ 1,90/ha de custo marginal por produto), venda nativa via WhatsApp, custódia de dados safra-a-safra e documentos com padrão de auditoria/carbono (laudo bancável, MRV). Nenhum concorrente identificado monta essa combinação para o produtor de 500–50.000 ha.
- Modelo DaaS (sem CAPEX para o produtor, rede de pilotos parceiros) segue válido — a onda de novos operadores DJI (DronePro = maior compradora DJI do Brasil em 2025) é o nosso banco de pilotos, e também a fonte de pressão de preço no voo commodity.
- **Carbono:** Lei 15.042/2024 (SBCE) cria mercado regulado — ~5.000 empresas com metas e relatórios obrigatórios de MRV na Fase III. Incumbentes feridos (investigação Carbonext; 3 projetos suspensos pela Verra em 2025). Janela de 12–24 meses para MRV verificado em campo.

---

## 2. Bandas de Preço Competitivas (R$/ha, mercado Brasil 2026) — v2.0

| # | Serviço | Banda de mercado | Nossa âncora | Status |
|---|---------|------------------|--------------|--------|
| 1 | Mapeamento RGB (> 100 ha, spot) | R$ 25–45 | R$ 35 | FATO — validada (DronEng: mercado 40–60 acima de 100 ha) |
| 2 | **NOVO — Mapeamento área pequena (< 100 ha)** | R$ 60–90 + mínimo R$ 3.500 | R$ 75 | FATO — mercado cobra mais que a v1.0 assumia |
| 3 | NDVI multiespectral | R$ 30–60 | R$ 45 | FATO — atenção à substituição por satélite em contratos recorrentes |
| 4 | Pacote completo (5 produtos/voo) | R$ 60–110 | R$ 80 | FATO — nossa maior alavanca (~53% de margem) |
| 5 | Programa safra (3 voos, 5 produtos) | R$ 90–140 | R$ 110 | FATO — exige custo de volume (piloto R$ 10 + logística R$ 3) |
| 6 | Enterprise (auditoria de produção + SLA) | R$ 100–150 | R$ 120 | FATO interno (BL-2026-001); sem comparável externo publicado |
| 7 | **NOVO — Pulverização: soja/milho** | R$ 35–60 | R$ 50 | HIPÓTESE ⛔ **GATE: só cotar com custo de piloto validado ≤ R$ 25/ha** (abaixo de R$ 42 cai na faixa 15–24% → aprovação CFO) |
| 8 | **NOVO — Pulverização: cana** | R$ 60–110 | R$ 90 | HIPÓTESE — território da ARPAC; calibrar no primeiro deal perdido |
| 9 | **NOVO — Pulverização: café/especialidades** | R$ 100–180 | R$ 150 | FATO (café 70–120; pomares 60–150; hortaliças 100–250) |

> 🪦 **A banda única de pulverização R$ 120–180 (âncora 150) da v1.0 está APOSENTADA.** Mercado de soja/milho em larga escala paga R$ 20–80/ha — cotar 150 em conta de soja é desqualificação, não premium.

**Regra do Deal Desk (inalterada):** cotar dentro da banda. Acima do teto = perde competitividade; abaixo do piso de margem = destrói a empresa. Se o piso de margem ficar ACIMA do teto da banda, o problema é de custo (negociar piloto/logística) ou de escopo (reduzir voos/produtos) — nunca de "dar desconto". Pisos: < 15% nunca; 15–24% só ≥ 10 mil ha ou recorrência anual com CFO; abertura ≥ 35%. Piso de volume: **R$ 30/ha** (lição Bruno Luiz), condicionado a custo de volume travado.

---

## 3. Benchmarks de ROI para Argumentação (por escala)

Valores validados na proposta BL-2026-001 (50.000 ha de soja) — **escalar linearmente por área**:

| Benefício | Valor em 50k ha | Por hectare |
|-----------|------------------|-------------|
| Redução de herbicidas (zonas de manejo, ~18%) | R$ 1,8–2,5M | R$ 36–50/ha |
| Detecção precoce de pragas/estresse | R$ 0,5–1,2M | R$ 10–24/ha |
| Antecipação de safra (+0,5 sc/ha) | R$ 900k | R$ 18/ha |
| Crédito rural com laudo técnico | R$ 200–500k | R$ 4–10/ha |
| Diesel do pulverizador (menos passadas) | R$ 754k | R$ 15/ha |
| Menos paradas de abastecimento de calda | R$ 607k | R$ 12/ha |
| Irrigação (se ~30% da área irrigada) | R$ 180–360k | R$ 4–7/ha |

**Frase-chave:** "O benefício estimado é de R$ 90–150/ha por safra — o investimento se paga dentro da própria safra."

---

## 4. Checklist de Pesquisa de Cliente (OBRIGATÓRIO antes de cotar) — v2.0

Toda cotação do Deal Desk começa pesquisando o cliente. Responder:

1. **Quem é?** Razão social, site, região/UF, cidade-sede
2. **Escala:** área total (ha), nº de fazendas/módulos, culturas (soja, cana, pastagem, milho...)
3. **Perfil tecnológico:** já usa agricultura de precisão? Tratamento industrial de sementes? Telemetria?
4. **Quem decide?** Dono (venda consultiva, ex.: Menarim Sementes) vs. gestor técnico (venda por ROI) vs. comprador (venda por preço)
5. **Momento:** plantio? colheita? janela de aplicação? urgência = menos sensibilidade a preço
6. **Capacidade de pagamento:** porte da operação, acesso a crédito rural, cooperativa?
7. **Potencial estratégico:** > 5.000 ha? Caso de referência? Porta para cooperativa? Recorrência de safra?
8. **Concorrência local:** já recebeu proposta de outro player? Qual preço circula na região?
9. **NOVO — Já contrata a ARPAC** (ou outro operador) para pulverização? A que R$/ha e em qual cultura?
10. **NOVO — A usina dele usa XMobots Cana Solution?** (Se sim: flanquear o fornecedor, não a matriz.)
11. **NOVO — Usa NDVI gratuito** (SATVeg/Sentinel-2/FieldView) ou tem drone próprio + créditos Mappa?
12. **NOVO — Marca do maquinário / conectividade Ops Center** — dá para oferecer exportação de prescrição?
13. **NOVO — Para pulverização: qual cultura?** (A banda agora depende disso.)

---

## 5. Doutrina de Negociação (validada em campo) — v2.0

1. **Âncora alta com 3 planos** — apresentar Essencial / Profissional / Enterprise faz o plano do meio parecer a escolha óbvia e o Essencial parecer barato
2. **Piloto como fechamento de porta** — nunca tentar fechar a área inteira de primeira; propor projeto piloto em 10–15% da área (fecha rápido, ancora o relacionamento, destrava o contrato grande)
3. **ROI concreto tira o preço da conversa** — sempre apresentar a tabela de benefícios/ha antes do preço
4. **Enterprise como ativo financeiro** — auditoria de produção + laudo técnico valem para banco e fundo rural; nenhum concorrente publicado entrega isso
5. **Preço fixado por 12 meses + prioridade de agenda** como bônus de fechamento do piloto — custo zero, valor percebido alto
6. **Urgência de safra** — proposta com validade de 15–30 dias amarrada à janela agronômica
7. **NOVO — Bundle-over-ARPAC:** se o cliente já pulveriza com a ARPAC, não desalojar — vender o pacote 5 produtos POR CIMA do contrato de pulverização ("o pulverizador voa; quem diz onde e por quê?")
8. **NOVO — Judô de satélite:** nunca discutir contra NDVI grátis — incluir monitoramento por satélite ENTRE os voos como bônus sem custo no Profissional/Enterprise. "O satélite vigia, o drone comprova."
9. **NOVO — Fechamento por exportação de prescrição:** fazendas Deere/FieldView recebem a prescrição no formato da plataforma delas, grátis — neutraliza a objeção OEM a custo zero.

### Perfis de cliente e abordagem

| Segmento | Área | Abordagem | Quem lidera |
|----------|------|-----------|-------------|
| Pequeno produtor | < 500 ha | Preço claro, mínimo de projeto, pacote simples (banda 2: tier premium!) | Sales Rep |
| Médio | 500–5.000 ha | Consultivo + ROI, pacote 5 produtos | Sales Rep + Head |
| Grande / Enterprise | > 5.000 ha | Pesquisa profunda + proposta formal + piloto estratégico | Head + CFO (Deal Desk) |
| **NOVO — Fornecedor de cana (GO/SP)** | qualquer | Zona primária de vitória: decisão + laudo que a plataforma da usina não dá para ele | Sales Rep + Head |
| **NOVO — Unidade de usina em grupo** | grande | Não brigar com a XMobots na matriz; piloto na unidade com produto de auditoria/carbono | Head |
| Idoso/tradicional (ex.: Menarim) | qualquer | Venda consultiva presencial, confiança primeiro, tecnologia depois | Sales Rep sênior |
| Pergunta direta de preço (ex.: Larrisa) | qualquer | Responder rápido com âncora + agendar demo | Sales Rep |

---

## 6. Gatilhos de Alerta Competitivo — v2.0

1. **ARPAC no território:** prospect é usina/fornecedor de cana em SP/GO/MG → assumir que a ARPAC já passou lá; perguntar pelo contrato de pulverização antes de cotar.
2. **Piloto independente armado de Mappa:** prospect cita "um piloto local com relatórios" → provavelmente créditos Horus/Mappa (vendidos via Orbia). Vender decisão e documento, não processamento.
3. **Objeção "NDVI é grátis":** prospect usa SATVeg/Sentinel-2 → nunca defender NDVI isolado; pivotar para o que o satélite não faz (contagem de plantas, falha de plantio, MDE centimétrico, evidência com padrão de auditoria).
4. **Bundling de OEM:** prospect usa John Deere Ops Center/FieldView → posicionar como fornecedor de dados de campo (exportação de prescrição), não como plataforma rival.
5. Cliente cita preço de concorrente **abaixo do nosso piso de 15%** → provavelmente serviço inferior (sem multiespectral, sem relatório, sem portal). Vender a diferença, não cobrir o preço. Walk-away de pulverização: nunca abaixo de R$ 36/ha.
6. Pedido de "só o voo, sem processamento" → recusar ou cotar como locação de piloto (outra tabela) — não canibalizar o produto.
7. Áreas < 100 ha → **não é só caso de mínimo de projeto: é tier premium** (banda 2, R$ 60–90/ha + mínimo R$ 3.500).
8. **Evento de gatilho estratégico** (acionar ciclo de board imediato): ARPAC lança produto de analytics/relatório; XMobots cria motion para fornecedores; regulamentação da Fase III do SBCE publicada.

---

*Market Intelligence Agrostech v2.0 | Revisar bandas trimestralmente, quando um deal for perdido por preço, ou em evento de gatilho (§6.8) | Bandas 7 e 8 são HIPÓTESE — calibrar com won/lost real*
