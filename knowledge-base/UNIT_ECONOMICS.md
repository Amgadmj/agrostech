# Unit Economics — Agrostech

> **Confidencial — Uso Interno (Conselho Financeiro)**
> Owner: CFO | Fontes: negociação Bruno Luiz (50k ha), custos reais de pilotos contratados, tabela do processador de imagens terceirizado
> Versão: 2.1 | Atualizado: Julho 2026 (tabela real do processador freelancer por serviço)

Este arquivo é a **fonte única de verdade de custos** usada pelo Deal Desk (`runner/deal_desk.py`) e pelo Conselho Financeiro. Nenhuma cotação sai abaixo dos pisos definidos aqui.

---

## 1. Estrutura de Custos Real (por hectare)

### Custos de campo (por VOO)

| Item | Custo/ha | Observação |
|------|----------|------------|
| Piloto contratado (drone dele incluso) | R$ 10–13 (padrão: R$ 11,50) | Em volume ≥ 10.000 ha, negociar para R$ 10 |
| Logística do piloto (hotel + comida + combustível) | R$ 3–5 (padrão: R$ 4,00) | Amortiza para ~R$ 3 em áreas ≥ 5.000 ha |
| Uso de drone próprio (quando aplicável) | R$ 2–5 | Só quando NÃO usamos piloto terceiro com drone dele |

**Exemplo real fornecido por piloto (1.000 ha):**
- Piloto: R$ 10.000 (R$ 10/ha, drone incluso)
- Hotel 3 dias: R$ 1.500 (R$ 1,50/ha)
- Comida 3 dias: R$ 600 (R$ 0,60/ha)
- Combustível ida/volta + operação: R$ 3.000 (R$ 3,00/ha)
- **Total de campo: R$ 15.100 = R$ 15,10/ha**

### Custos de processamento (tabela REAL do processador freelancer, por SERVIÇO por voo)

| Serviço | Custo/ha |
|---------|----------|
| Processamento de imagem + Modelos Digitais de Terreno (MDT) | R$ 1,90 |
| Linha de colheita + Falha de plantio (bundle) | R$ 2,99 |
| Linha de colheita | R$ 1,99 |
| Paralelismo | R$ 1,89 |
| Pisoteio | R$ 1,89 |
| Área agricultável | R$ 1,89 |

Espelhada em `PROCESSING_SERVICES` no `runner/deal_desk.py`. Observações:

- **Falha de plantio só existe em bundle** com linha de colheita (R$ 2,99) — o bundle sai mais barato que os dois serviços separados (R$ 2,99 vs R$ 4,98). No Pacote, a linha de colheita entra como **bônus de valor percebido** ("6 mapas pelo preço de 5").
- Todos os serviços são gerados do MESMO voo. Cada serviço adicional custa só R$ 1,89–2,99/ha, mas agrega muito valor percebido. **Empacotar serviços continua sendo a maior alavanca de margem.**
- Composição do Pacote 5 Produtos (por voo): MDT 1,90 + Colheita/Falha 2,99 + Paralelismo 1,89 + Pisoteio 1,89 + Área agricultável 1,89 = **R$ 10,56/ha por voo**.

### Imposto

| Item | Taxa |
|------|------|
| Imposto sobre receita (regime atual) | **15%** |

---

## 2. Fórmulas Oficiais

```
COGS/ha = (piloto + logística) × nº_voos + (Σ custo dos serviços contratados) × nº_voos
Margem líquida = (Preço × 0,85 − COGS) / Preço
Piso de preço para margem m:  P ≥ COGS / (0,85 − m)
```

O processamento é a **soma dos serviços da tabela do freelancer** (não mais 1,90 × nº de produtos). Pacote 5 Produtos: processamento = R$ 10,56/ha por voo.

### COGS de referência (piloto R$ 11,50 + logística R$ 4,00)

| Escopo | COGS/ha | Piso 15% (walk-away) | Piso 25% (saudável) | Alvo 35% |
|--------|---------|----------------------|----------------------|----------|
| 1 voo × MDT (Essencial) | R$ 17,40 | R$ 24,86 | R$ 29,00 | R$ 34,80 |
| 1 voo × Pacote (proc. 10,56) | R$ 26,06 | R$ 37,23 | R$ 43,43 | R$ 52,12 |
| 3 voos × Pacote (Profissional) | R$ 78,18 | R$ 111,69 | R$ 130,30 | R$ 156,36 |

### COGS em VOLUME negociado (≥ 10.000 ha: piloto R$ 10 + logística R$ 3)

| Escopo | COGS/ha | Piso 15% | Piso 25% | Alvo 35% |
|--------|---------|----------|----------|----------|
| 1 voo × MDT | R$ 14,90 | R$ 21,29 | R$ 24,83 | R$ 29,80 |
| 1 voo × Pacote | R$ 23,56 | R$ 33,66 | R$ 39,27 | R$ 47,12 |
| 3 voos × Pacote | R$ 70,68 | R$ 100,97 | R$ 117,80 | R$ 141,36 |

---

## 3. Política de Margem (Conselho Financeiro)

| Nível | Margem líquida | Regra |
|-------|----------------|-------|
| 🔴 Walk-away | < 15% | NUNCA cotar. Só CEO pode aprovar exceção estratégica |
| 🟡 Mínimo viável | 15–24% | Só para contratos ≥ 10.000 ha ou recorrência anual garantida |
| 🟢 Saudável | 25–34% | Padrão para negociações competitivas |
| ⭐ Alvo | ≥ 35% | Objetivo de toda cotação inicial (âncora) |

**Lição da negociação Bruno Luiz:** o desconto de volume a R$ 25/ha estava em break-even após imposto — quase fechamos no prejuízo. O piso de volume aprovado é **R$ 30/ha** (1 voo/1 produto).

---

## 4. Âncoras de Preço Aprovadas (validadas na proposta BL-2026-001)

| Plano | Escopo | Preço/ha | Margem real (custos v2.1) |
|-------|--------|----------|---------------------------|
| Essencial | 1 voo, NDVI, relatório | **R$ 35** | ~36% |
| Pacote 5 Produtos | 1 voo, 6 mapas (linha de colheita = bônus) | **R$ 80** | ~52% 🔥 |
| Profissional | 3 voos/safra, 6 mapas/voo, zonas de manejo, Ceres | **R$ 110** | ~14–21% — o motor eleva para ~R$ 118–130 (piso saudável) |
| Enterprise | Profissional + auditoria de produção/laudo + SLA | **R$ 120** | ~20–26% — o motor eleva para ~R$ 130 quando sem custo de volume |
| Sob Medida (à la carte) | 1 voo, serviços escolhidos pelo cliente | **R$ 35 + ~R$ 11 por serviço adicional** | ≥ 35% (interpolado entre Essencial e Pacote) |
| DaaS Pulverização (intermediação) | por aplicação | **R$ 150** | alta (piloto R$ 10–13 + logística) |
| Volume ≥ 10k ha (Essencial) | 1 voo, MDT | **R$ 30 mínimo** | ~19–26% |

---

## 5. Alavancas de Margem (ordem de prioridade)

1. **Empacotar serviços** — +R$ 1,89–2,99 de custo vira +R$ 8–15 de preço percebido por serviço (e o bundle falha de plantio traz a linha de colheita de bônus)
2. **Negociar piloto em volume** — R$ 13 → R$ 10/ha em 50k ha = +R$ 150.000 de margem
3. **Amortizar logística** — agrupar fazendas vizinhas na mesma viagem do piloto
4. **Recorrência** — 3 voos/safra dilui custo de aquisição e trava o cliente
5. **Enterprise adder** — auditoria de produção + laudo técnico têm custo marginal baixo e preço alto (R$ 25k/fazenda)

---

## 6. Política de Desconto (inalterada — ver PRICING_MODEL.md)

| Desconto | Aprovador |
|----------|-----------|
| Até 5% | Sales Rep |
| 5–10% | Head of Sales |
| 10–15% | CFO + Head of Sales |
| > 15% | CEO (exceção estratégica justificada) |

Situações que justificam desconto estratégico: cliente > 5.000 ha, cooperativa, caso de referência público, contrato recorrente de safra. **Desconto nunca fura o piso de 15% de margem líquida.**

---

*Unit Economics Agrostech v2.1 | Alimenta o Deal Desk e o Conselho Financeiro | Revisar a cada mudança de custo de piloto, processador ou imposto*
