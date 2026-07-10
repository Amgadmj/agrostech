# Field Pilot — Perfil de Papel Humano | Agrostech

```yaml
role_id: "field_pilot_001"
role_name: "Field Pilot"
role_type: "HUMAN_ROLE"           # ← Papel executado por humano, não agente IA
layer: "operations"
reports_to: "chief_pilot_001"
direct_reports: []
language: "pt-BR"
company: "Agrostech"
version: "2.0"
note: "Convertido de AI Agent para Human Role em Jun/2026. Execução em campo requer julgamento humano, responsabilidade legal e habilidade física — funções insubstituíveis por IA."
```

> ⚠️ **PAPEL HUMANO** — Este papel é executado por uma pessoa real (piloto RPAS certificado pela ANAC). O sistema digital da Agrostech **apoia** este papel através de ClickUp, Telegram e briefings automatizados — mas a execução é 100% humana.

---

## 1. Identidade do Papel

**Nome do Papel:** Piloto de Campo / Field Pilot  
**Título:** Piloto RPAS de Campo — Categoria Específica ANAC  
**Camada:** Operations  
**Tipo:** Papel Humano com Suporte Digital  

**Descrição em uma linha:**
> Olhos e mãos no campo — executa o voo com precisão, registra tudo, garante que nenhum dado seja perdido e volta com os arquivos que transformam a missão em valor para o cliente.

---

## 2. Por que Este Papel É Humano

| Razão | Detalhe |
|-------|---------|
| **Responsabilidade legal ANAC** | Piloto deve ser pessoa física certificada — habilitação intransferível |
| **Julgamento situacional** | Decisões em campo (clima, obstáculos, animais, pessoas) requerem percepção humana |
| **Habilidade motora** | Operação manual de emergência, posicionamento de GCPs, transporte de equipamento |
| **Accountability** | Em caso de incidente, o Piloto Responsável Técnico é pessoa jurídica perante a ANAC |
| **Variabilidade de campo** | Cada fazenda é diferente — adaptação a terreno, vegetação e acesso requer inteligência humana |

---

## 3. Responsabilidades Principais

1. **Execução de voo** — operar o drone seguindo o plano de missão aprovado pelo Chief Pilot
2. **Setup de campo** — posicionar GCPs (pontos de controle), verificar terreno, identificar riscos
3. **Coleta de dados** — garantir cobertura completa, sobreposição correta (80% frontal / 70% lateral)
4. **Registro de log** — preencher diário de bordo (horas de voo, bateria, anomalias)
5. **Dados brutos** — transferir e organizar imagens para processamento segundo padrão da empresa
6. **Incidentes** — reportar imediatamente qualquer ocorrência ao Chief Pilot

---

## 4. KPIs do Papel Humano

| Métrica | Meta | Frequência |
|---------|------|------------|
| Cobertura de área vs. planejado | ≥ 98% | Por missão |
| Sobreposição frontal/lateral | 80%/70% mínimo | Por missão |
| GCPs marcados e fotografados | 100% antes do voo | Por missão |
| Log de voo preenchido no ClickUp | 100% das missões | Por missão |
| Tempo no campo vs. previsto | Variação ≤ 15% | Por missão |
| Resposta a briefing do Chief Pilot | ≤ 30 min após recebimento | Por missão |

---

## 5. Fluxo de Trabalho com Suporte Digital

```
CHIEF PILOT AGENT
      ↓
  Cria briefing de missão (automatizado)
      ↓
  📋 ClickUp Task criada automaticamente
  "Missão: [Fazenda] — [Data]"
      ↓
  🔔 Notificação Telegram para Field Pilot
  "Nova missão atribuída. Ver ClickUp para briefing."
      ↓
  👷 FIELD PILOT (HUMANO) executa em campo
      ↓
  Preenche checklist pós-missão no ClickUp
  Faz upload de dados via link compartilhado
      ↓
  ✅ Task ClickUp marcada como "Concluída"
      ↓
  COO Agent notificado automaticamente
  Data Processing (humano) notificado via Telegram
```

---

## 6. Interface com ClickUp

### Tasks Recebidas pelo Field Pilot
O Field Pilot recebe as seguintes tasks automaticamente no ClickUp:

| Task Template | Quem Cria | Quando |
|--------------|-----------|--------|
| `🛸 Briefing de Missão: [Fazenda]` | Chief Pilot Agent | D-1 antes da missão |
| `📋 Checklist D-1: Preparação de Equipamento` | Chief Pilot Agent | D-1 |
| `✅ Pós-Missão: Upload e Log de Voo` | Sistema automático | Após confirmação de chegada em campo |

### Checklist ClickUp Pós-Missão (preenchido pelo humano)
```
☐ Imagens transferidas para HD externo
☐ Count de imagens confirmado vs. estimado
☐ Backup em nuvem realizado
☐ Log de voo preenchido (hora início/fim, baterias, anomalias)
☐ GCPs: coordenadas registradas e arquivos organizados
☐ Link de upload enviado para Data Processing
☐ Qualquer anomalia documentada com foto
```

---

## 7. Interações com o Sistema Digital

| Parceiro | Tipo | Canal |
|----------|------|-------|
| **Chief Pilot Agent** | Recebe briefing completo, plano de missão, autorização DECEA | ClickUp + Telegram |
| **COO Agent** | Confirma conclusão da missão e disponibilidade de dados | ClickUp (status update) |
| **Data Processing (Humano)** | Entrega dados brutos organizados com handoff padronizado | ClickUp Task + Telegram |
| **Knowledge Agent** | Log de missão arquivado automaticamente para aprendizado | ClickUp → Knowledge Base |

---

*Agrostech | Field Pilot — Perfil de Papel Humano v2.0 | Atualizado: Junho 2026*
