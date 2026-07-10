# Sales Representative — Perfil de Papel Humano | Agrostech

```yaml
role_id: "sales_rep_001"          # Replicar como 001–004 para cada rep
role_name: "Sales Representative"
role_type: "HUMAN_ROLE"           # ← Papel executado por humano
layer: "sales"
reports_to: "head_of_sales_001"   # Head of Sales Agent coordena e equipa
direct_reports: []
language: "pt-BR"
company: "Agrostech"
version: "2.0"
note: "Convertido para Human Role em Jun/2026. Vendas no agronegócio dependem de confiança humana, presença de campo e relacionamento — o sistema de IA equipa o rep com tudo que ele precisa."
```

> ⚠️ **PAPEL HUMANO** — O Sales Rep é uma pessoa real que visita fazendas, conversa no WhatsApp e fecha contratos olho no olho. Os agentes digitais (Head of Sales, Marketing, CRM) **equipam e assistem** esse humano — mas a relação comercial é 100% humana.

---

## 1. Por que Este Papel É Humano

| Razão | Detalhe |
|-------|---------|
| **Confiança no campo** | Produtor rural compra de pessoa — não de sistema. Aperto de mão vale mais que e-mail. |
| **Negociação situacional** | Cada conversa é diferente — adaptar proposta, tom e argumento requer inteligência emocional |
| **Presença física** | Visitas à fazenda, eventos (Agrishow, Show Rural) requerem presença humana |
| **Relacionamento de longo prazo** | "Meu vendedor da Agrostech" — vínculo pessoal que gera renovação e indicação |
| **WhatsApp consultivo** | A naturalidade de uma conversa genuína no WhatsApp não é replicável por bot |

---

## 2. Responsabilidades Principais

### O que o HUMANO faz
1. **Prospecção ativa** — WhatsApp, visitas a fazendas, eventos rurais, indicações
2. **Qualificação de leads** — conversa consultiva para entender área, cultura, dor, orçamento
3. **Apresentação técnica** — demonstrar valor com exemplos reais de clientes do território
4. **Negociação e fechamento** — adaptar proposta, lidar com objeções, fechar contrato
5. **Alimentar o CRM** — registrar cada atividade, avançar stages via ClickUp
6. **Relacionamento pós-venda** — introduzir o Account Manager ao cliente

### O que a IA faz pelo humano
- **Head of Sales Agent:** entrega briefing de leads quentes toda manhã, gera propostas automáticas como ponto de partida, revisa pipeline e envia alertas de follow-up
- **Marketing Agent:** cria os conteúdos e materiais que o rep usa nas visitas
- **Knowledge Agent:** responde dúvidas técnicas (NDVI, regulamentação ANAC, crédito de carbono) instantaneamente via Telegram

---

## 3. KPIs do Papel Humano

| Métrica | Meta | Frequência |
|---------|------|------------|
| Novas oportunidades criadas | ≥ 8/mês | Mensal |
| Propostas enviadas | ≥ 4/mês | Mensal |
| Contratos fechados | ≥ 1–2/mês | Mensal |
| Ticket médio | ≥ R$ 12.000 | Mensal |
| CRM atualizado no ClickUp | 100% em até 24h após contato | Semanal |
| Taxa de follow-up dentro de 24h | ≥ 90% | Contínuo |
| Resposta a briefings da IA | ≤ 1h após recebimento | Diário |

---

## 4. Fluxo de Trabalho com Suporte Digital

```
HEAD OF SALES AGENT
      ↓
  Analisa pipeline e CRM diariamente
      ↓
  📋 ClickUp: cria "Briefing Diário do Rep [N]"
  com lista priorizada de:
  - Leads para fazer follow-up hoje
  - Propostas aguardando resposta > 48h
  - Oportunidades em risco de esfriar
      ↓
  🔔 Telegram: "Bom dia! Seus 3 focos de hoje:" + lista
      ↓
  👔 SALES REP (HUMANO) executa os contatos
  - Liga, manda WhatsApp, visita fazenda
  - Conduz reunião de qualificação
  - Envia proposta (gerada pela IA como base)
  - Fecha ou avança o negócio
      ↓
  Atualiza o CRM no ClickUp após cada contato
  (máx. 30 segundos de atualização — formulário simplificado)
      ↓
  ✅ Head of Sales Agent recebe atualização automática
  CRM sincronizado → forecast atualizado
```

---

## 5. Interface com ClickUp — Dashboard do Sales Rep

```
📱 MINHA AGENDA COMERCIAL — [Data]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 URGENTE (ação necessária hoje)
  • Fazenda Boa Vista — follow-up proposta enviada há 5 dias
    [Ligar agora] [Registrar tentativa]
  • João Mendes — reunião prometida para esta semana
    [Agendar] [Ver contato]

🟡 ATENÇÃO (acompanhar esta semana)
  • Cooperativa Sul — proposta em análise
  • Pedro Alves — lead frio do evento Agrishow

🟢 EM ANDAMENTO
  • Fazenda São Bento — proposta gerada pela IA aguardando review
    [Revisar proposta] [Enviar para cliente]

📊 MEU PIPELINE HOJE
  Oportunidades: 12 | Propostas: 3 | Fechamentos no mês: 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 6. Interface com Telegram Bot — Comandos do Sales Rep

| Comando | Função |
|---------|--------|
| `/pipeline` | Ver resumo do pipeline e alertas do dia |
| `/lead [nome]` | Registrar novo lead rapidamente (voz para texto) |
| `/proposta [ID]` | Ver proposta gerada pela IA para revisar antes de enviar |
| `/aprovacao [ID]` | Solicitar aprovação de desconto ao Head of Sales |
| `/briefing` | Ver briefing diário personalizado pela IA |
| `/ajuda_tecnica [dúvida]` | Perguntar ao Knowledge Agent (ex: "como funciona MRV de carbono?") |
| `/concluir [ID]` | Marcar negociação como fechada — aciona handoff para Account Manager |

---

## 7. Proposta Gerada pela IA como Ponto de Partida

O Head of Sales Agent pré-gera uma proposta baseada nas informações do lead. O Sales Rep revisa, personaliza com detalhes da conversa e envia ao cliente com sua assinatura pessoal.

```
IA gera proposta base:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROPOSTA AGROSTECH — Fazenda Esperança
Produtor: Carlos Mendes
Área: 1.200 ha | Cultura: Soja | Estado: MT

SERVIÇOS RECOMENDADOS (baseado no perfil):
1. Mapeamento NDVI + Ortofoto — R$ 18.000
2. Contrato anual de monitoramento (4 voos) — R$ 60.000
   Desconto anual: R$ 12.000 (20% vs. spot)

Prazo de entrega: 48h após missão
Validade da proposta: 15 dias
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ Rep acessa via /proposta P045
→ Edita, personaliza e envia para o cliente
```

---

## 8. Interações com o Sistema Digital

| Parceiro | Tipo | Canal | Frequência |
|----------|------|-------|------------|
| **Head of Sales Agent** | Recebe briefing diário, alertas de pipeline, propostas geradas | ClickUp + Telegram | Diário |
| **Marketing Agent** | Recebe materiais de apoio, cases, conteúdo para visitas | ClickUp (assets) | Semanal |
| **Knowledge Agent** | Consulta dúvidas técnicas (NDVI, ANAC, carbono) durante reunião | Telegram (instantâneo) | Sob demanda |
| **COO Agent** | Confirma prazo de missão antes de fechar contrato | ClickUp task | Por proposta |
| **Account Manager (Humano)** | Handoff do cliente após fechamento — briefing de conta | ClickUp + Telegram | Por contrato |

---

*Agrostech | Sales Representative — Perfil de Papel Humano v2.0 | Junho 2026*
*"O rep humano constrói a confiança. A IA constrói o arsenal para que ele vença."*
