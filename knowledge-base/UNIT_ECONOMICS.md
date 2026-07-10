# Unit Economics — Agrostech

> **Confidencial — Uso Interno (Conselho Financeiro)**
> Owner: CFO | Fontes: negociação Bruno Luiz (50k ha), custos reais de pilotos contratados, tabela do processador de imagens terceirizado
> Versão: 2.0 | Atualizado: Julho 2026

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

### Custos de processamento (por PRODUTO por voo)

| Item | Custo/ha |
|------|----------|
| Processador de imagens terceirizado | R$ 1,90 por produto |

Produtos: NDVI, Falha de Plantio, Paralelismo, Pisoteio/Compactação, Área Agricultável Real — todos gerados do MESMO voo. Cada produto adicional custa só +R$ 1,90/ha, mas agrega muito valor percebido. **Empacotar produtos é a maior alavanca de margem.**

### Imposto

| Item | Taxa |
|------|------|
| Imposto sobre receita (regime atual) | **15%** |

---

## 2. Fórmulas Oficiais

```
COGS/ha = (piloto + logística) × nº_voos + 1,90 × nº_produtos × nº_voos
Margem líquida = (Preço × 0,85 − COGS) / Preço
Piso de preço para margem m:  P ≥ COGS / (0,85 − m)
```

### COGS de referência (piloto R$ 11,50 + logística R$ 4,00)

| Escopo | COGS/ha | Piso 15% (walk-away) | Piso 25% (saudável) | Alvo 35% |
|--------|---------|----------------------|----------------------|----------|
| 1 voo × 1 produto (Essencial) | R$ 17,40 | R$ 24,86 | R$ 29,00 | R$ 34,80 |
| 1 voo × 5 produtos (Pacote) | R$ 25,00 | R$ 35,71 | R$ 41,67 | R$ 50,00 |
| 3 voos × 5 produtos (Profissional) | R$ 75,00 | R$ 107,14 | R$ 125,00 | R$ 150,00 |

### COGS em VOLUME negociado (≥ 10.000 ha: piloto R$ 10 + logística R$ 3)

| Escopo | COGS/ha | Piso 15% | Piso 25% | Alvo 35% |
|--------|---------|----------|----------|----------|
| 1 voo × 1 produto | R$ 14,90 | R$ 21,29 | R$ 24,83 | R$ 29,80 |
| 1 voo × 5 produtos | R$ 22,50 | R$ 32,14 | R$ 37,50 | R$ 45,00 |
| 3 voos × 5 produtos | R$ 67,50 | R$ 96,43 | R$ 112,50 | R$ 135,00 |

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

| Plano | Escopo | Preço/ha | Margem real |
|-------|--------|----------|-------------|
| Essencial | 1 voo, NDVI, relatório | **R$ 35** | ~36% |
| Pacote 5 Produtos | 1 voo, 5 produtos | **R$ 80** | ~53% 🔥 |
| Profissional | 3 voos/safra, 5 produtos, zonas de manejo, Ceres | **R$ 110** | ~17–24% (exige custo de volume) |
| Enterprise | Profissional + auditoria de produção/laudo + SLA | **R$ 120** | ~24–32% |
| DaaS Pulverização (intermediação) | por aplicação | **R$ 150** | alta (piloto R$ 10–13 + logística) |
| Volume ≥ 10k ha (Essencial) | 1 voo, 1 produto | **R$ 30 mínimo** | ~19–26% |

---

## 5. Alavancas de Margem (ordem de prioridade)

1. **Empacotar produtos** — +R$ 1,90 de custo vira +R$ 8–15 de preço percebido por produto
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

*Unit Economics Agrostech v2.0 | Alimenta o Deal Desk e o Conselho Financeiro | Revisar a cada mudança de custo de piloto, processador ou imposto*
