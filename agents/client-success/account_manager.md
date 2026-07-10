# Account Manager — Perfil de Papel Humano | Agrostech

```yaml
role_id: "account_manager_001"
role_name: "Account Manager"
role_type: "HUMAN_ROLE"           # ← Papel executado por humano
layer: "client-success"
reports_to: "coo_001"
direct_reports_humans: []
language: "pt-BR"
company: "Agrostech"
version: "2.0"
note: "Convertido para Human Role em Jun/2026. Sucesso do cliente no agronegócio é baseado em relacionamento humano genuíno — a IA automatiza o suporte mas o AM lidera a relação."
```

> ⚠️ **PAPEL HUMANO** — O Account Manager é uma pessoa real responsável pelo relacionamento com cada cliente. Os agentes digitais (Delivery Agent, Knowledge Agent, CFO Agent) **automatizam a logística** — mas a empatia, o NPS, o upsell e o "seu parceiro na fazenda" são funções humanas.

---

## 1. Por que Este Papel É Humano

| Razão | Detalhe |
|-------|---------|
| **Empatia e relacionamento** | Cliente que dá NPS ≤ 7 precisa de uma ligação humana, não de um formulário |
| **Interpretação contextual** | Entender que o produtor "não curtiu" o mapa significa que não entendeu — requer explicação humana |
| **Upsell consultivo** | "Você deveria monitorar essa área de carbono" é uma conversa de confiança |
| **Gestão de crises** | Missão atrasada ou dado com problema — o cliente precisa de uma pessoa responsável |
| **Presença em campo** | Visitas de QBR (Quarterly Business Review) na fazenda — presença física conta muito |

---

## 2. Responsabilidades Principais

### O que o HUMANO faz
1. **Onboarding** — primeira chamada pós-venda, definir expectativas claras, apresentar o processo
2. **Comunicação durante missão** — cliente quer saber "está acontecendo?" — mensagem de status proativa
3. **Entrega e aprovação** — apresentar os dados ao produtor, explicar o que o mapa significa
4. **NPS e satisfação** — conduzir pesquisa, ligar imediatamente se NPS ≤ 7
5. **Upsell / renovação** — identificar oportunidades e fazer a conversa de expansão
6. **QBR trimestral** — review de valor gerado na conta do cliente

### O que a IA faz pelo humano
- **Delivery Agent:** empacota e disponibiliza o produto final sem o AM precisar fazer manualmente
- **Knowledge Agent:** fornece interpretação técnica do NDVI/ortofoto que o AM usa para explicar ao cliente
- **CFO Agent:** emite NF automaticamente após aprovação de entrega, sem AM precisar solicitar
- **COO Agent:** atualiza status de missão em tempo real para AM repassar ao cliente

---

## 3. KPIs do Papel Humano

| Métrica | Meta | Frequência |
|---------|------|------------|
| NPS de clientes | ≥ 70 | Por entrega |
| Taxa de renovação de contratos anuais | ≥ 80% | Trimestral |
| Taxa de upsell | ≥ 20% a.a. | Anual |
| Tempo de resposta ao cliente no WhatsApp | ≤ 4h em horário comercial | Contínuo |
| Satisfação na entrega (nota 1–5) | ≥ 4,5 | Por entrega |
| Onboarding call realizado em até 24h pós-contrato | 100% | Por contrato |
| Status de missão comunicado ao cliente | 100% no dia do voo | Por missão |

---

## 4. Fluxo de Trabalho com Suporte Digital

```
SALES REP (HUMANO) fecha contrato
      ↓
  ✅ Task ClickUp: "Novo Cliente: [Nome] — Handoff para AM"
  🔔 Telegram AM: "Novo cliente! Ver ClickUp."
      ↓
  👔 ACCOUNT MANAGER (HUMANO) faz onboarding call
  → Define expectativas, explica processo, cria rapport
  → Registra notas de call no ClickUp
      ↓
  CHIEF PILOT AGENT agenda missão
      ↓
  🔔 Telegram AM: "Missão agendada: Fazenda X em [Data]"
      ↓
  AM envia WhatsApp ao cliente:
  "Tudo certo! Nosso piloto estará na fazenda no dia X às Y."
      ↓
  [Dia do voo]
  COO Agent atualiza status → AM recebe notificação
  AM envia update ao cliente: "Missão em andamento ✅"
      ↓
  DATA PROCESSING (HUMANO) entrega produto
  Delivery Agent empacota → AM recebe link
      ↓
  👔 AM (HUMANO) apresenta dados ao cliente
  → Explica o que o NDVI significa para a lavoura
  → Coleta aprovação formal
  → Conduz pesquisa de NPS
      ↓
  [30 dias depois]
  🔔 Telegram AM: "Check-in: Fazenda X — 30 dias pós-entrega"
  AM envia WhatsApp: "O mapa foi útil? Quero entender o resultado."
```

---

## 5. Interface com ClickUp — Dashboard do Account Manager

```
💻 MINHA CARTEIRA DE CLIENTES — [Data]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 AÇÃO NECESSÁRIA HOJE
  • Carlos Mendes — NPS 6 recebido ⚠️ Ligar agora
    [Ver cliente] [Registrar call]
  • Fazenda Verde — missão hoje → atualizar cliente
    [Enviar WhatsApp de status]

🟡 ESTA SEMANA
  • Cooperativa Sul — entrega pronta, agendar apresentação
    [Ver produto final] [Agendar call]
  • Pedro Lima — renovação vence em 15 dias
    [Ver proposta de renovação IA]

🟢 EM DIA
  • João Mendes — NPS 9, contrato anual ativo
  • Fazenda Boa Vista — missão agendada para semana que vem

📊 MINHA CARTEIRA
  Clientes ativos: 8 | NPS médio: 72 | Renovações este mês: 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 6. Interface com Telegram Bot — Comandos do AM

| Comando | Função |
|---------|--------|
| `/carteira` | Ver resumo de todos os clientes ativos |
| `/cliente [ID]` | Ver histórico completo de uma conta |
| `/status_missao [ID]` | Ver status em tempo real de missão do cliente |
| `/nps [ID] [nota]` | Registrar NPS após entrega |
| `/upsell [ID]` | Ver proposta de upsell gerada pela IA para o cliente |
| `/renovacao [ID]` | Iniciar processo de renovação de contrato |
| `/ajuda_tecnica [dúvida]` | Consultar Knowledge Agent para explicar dados ao cliente |
| `/qbr [ID]` | Ver relatório de valor gerado (QBR) preparado pela IA |

---

## 7. QBR Automático Gerado pela IA para o AM Apresentar

O Knowledge Agent gera automaticamente um relatório trimestral de valor para cada cliente. O AM revisa, personaliza com insights de relacionamento e apresenta ao produtor:

```
📊 RELATÓRIO TRIMESTRAL — Fazenda Esperança
Cliente: Carlos Mendes | Q2 2026

MISSÕES REALIZADAS: 2
  → Abr/26: Ortofoto + NDVI (1.200 ha)
  → Jun/26: NDVI monitoramento (1.200 ha)

VALOR GERADO (estimativa):
  → Economia em defensivo: -22% = R$ 34.000 economizados
  → Área com estresse hídrico identificada: 85 ha
  → Recomendação: ampliar monitoramento para área de pastagem

PRÓXIMOS PASSOS SUGERIDOS:
  → Missão de MRV de carbono (potencial: 150 tCO₂e/ano)
  → Proposta de contrato anual premium: R$ 72.000 (-20% vs. spot)

→ AM usa este relatório como base para o QBR call
```

---

## 8. Interações com o Sistema Digital

| Parceiro | Tipo | Canal | Frequência |
|----------|------|-------|------------|
| **Sales Rep (Humano)** | Recebe handoff de novo cliente com briefing completo | ClickUp + Telegram | Por contrato |
| **Chief Pilot Agent** | Recebe confirmação de missão para comunicar ao cliente | ClickUp (automático) | Por missão |
| **Delivery Agent** | Recebe link do produto final empacotado para apresentar | ClickUp task | Por entrega |
| **Knowledge Agent** | Consulta interpretação técnica de dados para explicar ao cliente | Telegram | Sob demanda |
| **CFO Agent** | Confirma emissão de NF após aprovação de entrega | ClickUp (automático) | Por entrega |
| **Head of Sales Agent** | Reporta oportunidades de upsell identificadas | ClickUp | Mensal |

---

*Agrostech | Account Manager — Perfil de Papel Humano v2.0 | Junho 2026*
*"O cliente não paga pela entrega — paga pelo parceiro que o ajuda a crescer."*
