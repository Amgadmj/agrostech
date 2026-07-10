# Agrostech ClickUp - Lists & Tasks Builder (using known space IDs)
$API_KEY = "pk_6807762_FIDM98KYROQOMNOM8M7TRKWWKTZZOWP2"
$TEAM_ID = "90171329645"
$BASE_URL = "https://api.clickup.com/api/v2"
$headers  = @{ "Authorization" = $API_KEY; "Content-Type" = "application/json" }

# Confirmed space IDs from previous run
$OPS_ID   = "90176120906"
$SALES_ID = "90176120907"
$CS_ID    = "90176120908"

function Invoke-CU($Method, $Path, $Body = $null) {
    $uri = "$BASE_URL$Path"
    try {
        if ($Body) { $r = Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -Body ($Body | ConvertTo-Json -Depth 10) }
        else        { $r = Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers }
        return $r
    } catch {
        $msg = $_.ErrorDetails.Message
        Write-Host "  ERROR $Method $Path : $msg" -ForegroundColor Red
        return $null
    }
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   AGROSTECH - ClickUp Lists & Tasks Builder     " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# ─── Step 1: Create SUPPORT space (missed in previous run) ───────────────────
Write-Host "`n[STEP 1] Creating SUPPORT space..." -ForegroundColor Yellow
$sup = Invoke-CU POST "/team/$TEAM_ID/space" @{
    name = "SUPPORT - Agrostech"
    color = "#229ED9"
    multiple_assignees = $true
    features = @{ due_dates = @{ enabled = $true }; checklists = @{ enabled = $true } }
}
$SUP_ID = $sup.id
Write-Host "  OK: SUPPORT id=$SUP_ID" -ForegroundColor Green
Start-Sleep -Milliseconds 500

# ─── Step 2: Create lists in OPERATIONS ──────────────────────────────────────
Write-Host "`n[STEP 2] Creating lists in OPERATIONS ($OPS_ID)..." -ForegroundColor Yellow
$opsLists = @(
    "Missoes em Planejamento",
    "Missoes Ativas - Field Pilot",
    "Processamento de Dados",
    "Missoes Concluidas - Arquivo"
)
$opsListIds = @{}
foreach ($name in $opsLists) {
    $r = Invoke-CU POST "/space/$OPS_ID/list" @{ name = $name }
    if ($r -and $r.id) {
        Write-Host "  + $name  [id=$($r.id)]" -ForegroundColor DarkGreen
        $opsListIds[$name] = $r.id
    }
    Start-Sleep -Milliseconds 500
}

# ─── Step 3: Create lists in SALES ───────────────────────────────────────────
Write-Host "`n[STEP 3] Creating lists in SALES ($SALES_ID)..." -ForegroundColor Yellow
$salesLists = @(
    "Pipeline - Rep 1 MT-GO",
    "Pipeline - Rep 2 PR-RS",
    "Pipeline - Rep 3 Carbono",
    "Pipeline - Rep 4 Cooperativas",
    "Briefings Diarios - Sales Reps",
    "Propostas Geradas pela IA",
    "Campanhas de Marketing"
)
$salesListIds = @{}
foreach ($name in $salesLists) {
    $r = Invoke-CU POST "/space/$SALES_ID/list" @{ name = $name }
    if ($r -and $r.id) {
        Write-Host "  + $name  [id=$($r.id)]" -ForegroundColor DarkGreen
        $salesListIds[$name] = $r.id
    }
    Start-Sleep -Milliseconds 500
}

# ─── Step 4: Create lists in CLIENT SUCCESS ───────────────────────────────────
Write-Host "`n[STEP 4] Creating lists in CLIENT SUCCESS ($CS_ID)..." -ForegroundColor Yellow
$csLists = @(
    "Onboarding de Clientes",
    "Entregas Pendentes",
    "QBR e Follow-up Trimestral",
    "NPS e Satisfacao"
)
$csListIds = @{}
foreach ($name in $csLists) {
    $r = Invoke-CU POST "/space/$CS_ID/list" @{ name = $name }
    if ($r -and $r.id) {
        Write-Host "  + $name  [id=$($r.id)]" -ForegroundColor DarkGreen
        $csListIds[$name] = $r.id
    }
    Start-Sleep -Milliseconds 500
}

# ─── Step 5: Create lists in SUPPORT ─────────────────────────────────────────
Write-Host "`n[STEP 5] Creating lists in SUPPORT ($SUP_ID)..." -ForegroundColor Yellow
$supLists = @(
    "Pendencias Legais e Compliance",
    "Tarefas Financeiras - NF e Impostos",
    "Base de Conhecimento - Updates",
    "Incidentes e Ocorrencias"
)
$supListIds = @{}
foreach ($name in $supLists) {
    $r = Invoke-CU POST "/space/$SUP_ID/list" @{ name = $name }
    if ($r -and $r.id) {
        Write-Host "  + $name  [id=$($r.id)]" -ForegroundColor DarkGreen
        $supListIds[$name] = $r.id
    }
    Start-Sleep -Milliseconds 500
}

# ─── Step 6: Seed Template Tasks ─────────────────────────────────────────────
Write-Host "`n[STEP 6] Seeding template tasks..." -ForegroundColor Yellow

# --- Mission briefing template
$mAtiva = $opsListIds["Missoes Ativas - Field Pilot"]
if ($mAtiva) {
    $t = Invoke-CU POST "/list/$mAtiva/task" @{
        name = "[TEMPLATE] Missao: [Fazenda] - [Data]"
        description = "BRIEFING DE MISSAO - gerado pelo Chief Pilot Agent

CLIENTE: [Nome] | FAZENDA: [Nome] | AREA: [X]ha
TIPO: Ortofoto / NDVI / MRV
COORDENADAS: [LAT, LON]
DATA/HORA: [Data] as [Hora]
AUTORIZACAO DECEA: [Numero] - OBTIDA
NOTAM: Verificado - Sem restricoes

PARAMETROS DE VOO:
- Altitude: [X]m AGL | Sobreposicao: 80% frontal / 70% lateral
- GSD alvo: 3 cm/px ou menor | Baterias: [N] | Tempo: [X] horas

CONDICOES METEOROLOGICAS (previsao):
- Vento: [X] m/s (OK < 8) | Chuva: Nao | Visibilidade: [X] km (OK > 3)

CHECKLIST PRE-MISSAO (D-1):
[ ] Baterias carregadas 100%
[ ] Helices verificadas sem trincas
[ ] Camera limpa e calibrada
[ ] Firmware atualizado
[ ] Cartao SD formatado e com espaco suficiente
[ ] GCPs (alvos de lona) preparados
[ ] GNSS RTK carregado e testado
[ ] HD externo com espaco livre (minimo 2x tamanho esperado)
[ ] Extintor portatil no veiculo
[ ] Seguro RPAS vigente verificado"
        priority = 2
        tags = @("template", "missao", "field-pilot")
    }
    if ($t) { Write-Host "  + Mission briefing template [id=$($t.id)]" -ForegroundColor DarkGreen }
    Start-Sleep -Milliseconds 500
}

# --- Post-mission checklist
if ($mAtiva) {
    $t = Invoke-CU POST "/list/$mAtiva/task" @{
        name = "[TEMPLATE] Pos-Missao: [Fazenda] - [Data]"
        description = "CHECKLIST POS-MISSAO - preenchido pelo Field Pilot em campo

[ ] Imagens transferidas para HD externo
[ ] Contagem de imagens: ___ de ___ esperadas
[ ] Backup realizado - link: ___
[ ] Log de voo preenchido:
    Hora inicio: ___ | Hora fim: ___
    Baterias utilizadas: ___
    Anomalias observadas: ___
[ ] Coordenadas dos GCPs registradas em arquivo
[ ] Fotos de campo tiradas (obstaculos, condicoes do solo)
[ ] Link de dados enviado ao Data Processing: ___
[ ] Anomalias documentadas com foto (se houver)

OBSERVACOES LIVRES DO PILOTO:"
        priority = 2
        tags = @("template", "pos-missao", "field-pilot")
    }
    if ($t) { Write-Host "  + Post-mission checklist template [id=$($t.id)]" -ForegroundColor DarkGreen }
    Start-Sleep -Milliseconds 500
}

# --- Data processing template
$pList = $opsListIds["Processamento de Dados"]
if ($pList) {
    $t = Invoke-CU POST "/list/$pList/task" @{
        name = "[TEMPLATE] Processamento: [Fazenda] - [Data]"
        description = "TASK DE PROCESSAMENTO - criada automaticamente apos missao concluida

DADOS RECEBIDOS:
- Link de download: [URL]
- Quantidade de imagens: [N]
- GCPs: [N] pontos - arquivo: [link]
- Tipo de produto: Ortofoto / NDVI / MRV
- Prazo de entrega: 24h apos recebimento

CHECKLIST DE PROCESSAMENTO:
[ ] Dados brutos recebidos e contagem verificada
[ ] GCPs importados e conferidos no software
[ ] Processamento fotogrametrico iniciado no Agisoft/DJI Terra
[ ] Ortofoto gerada - GSD resultante: ___ cm/px
[ ] MDE gerado (se aplicavel)
[ ] NDVI calibrado e gerado (se multiespectral)

QA - CONTROLE DE QUALIDADE:
[ ] Acuracia posicional RMSE: ___ cm (aceitar se < 5 cm)
[ ] Cobertura 100% sem lacunas ou buracos
[ ] Sem artefatos de costura visiveis
[ ] Relatorio tecnico revisado e aprovado

EMPACOTAMENTO PARA ENTREGA:
[ ] Estrutura de pastas padrao criada
[ ] README_entrega.txt gerado
[ ] Arquivos compactados - link de download: ___
[ ] Delivery Agent notificado via ClickUp"
        priority = 2
        tags = @("template", "processamento", "data-processing")
    }
    if ($t) { Write-Host "  + Data processing template [id=$($t.id)]" -ForegroundColor DarkGreen }
    Start-Sleep -Milliseconds 500
}

# --- Daily Sales Briefing template
$bList = $salesListIds["Briefings Diarios - Sales Reps"]
if ($bList) {
    $t = Invoke-CU POST "/list/$bList/task" @{
        name = "[TEMPLATE] Briefing Diario - Sales Rep [N] - [Data]"
        description = "BRIEFING DIARIO - gerado pelo Head of Sales Agent toda manha

SEUS FOCOS DE HOJE:

URGENTES (acao hoje):
  - [Fazenda] - proposta enviada ha 5 dias sem resposta
    Sugestao: ligar e perguntar se recebeu e se tem duvidas
  - [Fazenda] - reuniao prometida nao agendada ainda
    Sugestao: WhatsApp curto de confirmacao de interesse

OPORTUNIDADES QUENTES:
  - [Fazenda] - lead novo do Marketing (ontem)
    Perfil: [X]ha, [cultura], [estado]
    Contato: [Nome] / WhatsApp: [numero]

PROPOSTAS AGUARDANDO SEU REVIEW:
  - Proposta #P0XX - [Fazenda] - R$ [valor]
    Acesse em: https://app.clickup.com/t/XXXXXX

SEU PIPELINE HOJE:
  Oportunidades abertas: [N] | Propostas enviadas: [N]
  Fechamentos este mes: [N] | Meta: [N] fechamentos"
        priority = 3
        tags = @("template", "briefing-diario", "sales-rep")
    }
    if ($t) { Write-Host "  + Sales daily briefing template [id=$($t.id)]" -ForegroundColor DarkGreen }
    Start-Sleep -Milliseconds 500
}

# --- AI Proposal template
$propList = $salesListIds["Propostas Geradas pela IA"]
if ($propList) {
    $t = Invoke-CU POST "/list/$propList/task" @{
        name = "[TEMPLATE] Proposta #P[NUM] - [Fazenda] - R$ [Valor]"
        description = "PROPOSTA GERADA PELA IA - Head of Sales Agent
Status: Aguardando review e personalizacao pelo Sales Rep

CLIENTE: [Nome Completo]
Fazenda: [Nome] | Area: [X]ha | Cultura: [X] | Estado: [X]
Dor identificada: [o que o cliente quer resolver]

SERVICOS RECOMENDADOS:
  1. [Servico principal] - R$ [valor]
  2. [Servico adicional opcional] - R$ [valor]

Desconto aplicado: [X]% (dentro da autonomia do rep)
Prazo de entrega: 48h apos missao | Validade: 15 dias

CHECKLIST DO SALES REP ANTES DE ENVIAR:
[ ] Revisar e personalizar com insights da conversa real
[ ] Verificar disponibilidade de prazo com COO (se necessario)
[ ] Solicitar aprovacao do Head of Sales (se desconto > 5%)
[ ] Enviar ao cliente com assinatura e tom pessoal
[ ] Registrar envio no CRM - mudar status para Proposta Enviada"
        priority = 2
        tags = @("template", "proposta", "ia-gerada")
    }
    if ($t) { Write-Host "  + AI Proposal template [id=$($t.id)]" -ForegroundColor DarkGreen }
    Start-Sleep -Milliseconds 500
}

# --- Client Onboarding template
$oList = $csListIds["Onboarding de Clientes"]
if ($oList) {
    $t = Invoke-CU POST "/list/$oList/task" @{
        name = "[TEMPLATE] Onboarding: [Nome Cliente] - [Fazenda]"
        description = "ONBOARDING DE NOVO CLIENTE - Account Manager
Prazo: primeiro contato em ate 24h do fechamento do contrato

BRIEFING DA CONTA - gerado pelo Head of Sales Agent:
  Cliente: [Nome] | Fazenda: [X] | Area: [X]ha
  Contrato: [tipo] - R$ [valor] | Missao: [data prevista]
  Sales Rep: [nome] - contexto: [resumo da negociacao]
  Dores mapeadas: [o que o cliente quer resolver]
  Expectativas prometidas: [o que foi combinado]

CHECKLIST DE ONBOARDING:
[ ] Onboarding call realizado (em ate 24h do fechamento)
[ ] Processo da Agrostech apresentado ao cliente
[ ] Data e local da missao confirmados
[ ] Notas da call registradas no ClickUp
[ ] Cliente adicionado ao grupo WhatsApp
[ ] Lembrete configurado: update no dia do voo
[ ] Update enviado ao cliente no dia da missao
[ ] Dados apresentados apos entrega (explicar o que significa)
[ ] NPS coletado apos apresentacao da entrega"
        priority = 2
        tags = @("template", "onboarding", "account-manager")
    }
    if ($t) { Write-Host "  + Client onboarding template [id=$($t.id)]" -ForegroundColor DarkGreen }
    Start-Sleep -Milliseconds 500
}

# ─── Step 7: Save IDs to file ─────────────────────────────────────────────────
Write-Host "`n[STEP 7] Saving space and list IDs to file..." -ForegroundColor Yellow
$content = @"
# Agrostech ClickUp IDs - Generated $(Get-Date -Format 'yyyy-MM-dd HH:mm')
# Use these IDs in agent API calls

TEAM_ID = $TEAM_ID

# SPACES
SPACE_OPERATIONS     = $OPS_ID
SPACE_SALES          = $SALES_ID
SPACE_CLIENT_SUCCESS = $CS_ID
SPACE_SUPPORT        = $SUP_ID

# LISTS - OPERATIONS
LIST_MISSOES_PLANEJAMENTO = $($opsListIds["Missoes em Planejamento"])
LIST_MISSOES_ATIVAS       = $($opsListIds["Missoes Ativas - Field Pilot"])
LIST_PROCESSAMENTO        = $($opsListIds["Processamento de Dados"])
LIST_MISSOES_CONCLUIDAS   = $($opsListIds["Missoes Concluidas - Arquivo"])

# LISTS - SALES
LIST_PIPELINE_REP1    = $($salesListIds["Pipeline - Rep 1 MT-GO"])
LIST_PIPELINE_REP2    = $($salesListIds["Pipeline - Rep 2 PR-RS"])
LIST_PIPELINE_REP3    = $($salesListIds["Pipeline - Rep 3 Carbono"])
LIST_PIPELINE_REP4    = $($salesListIds["Pipeline - Rep 4 Cooperativas"])
LIST_BRIEFINGS        = $($salesListIds["Briefings Diarios - Sales Reps"])
LIST_PROPOSTAS_IA     = $($salesListIds["Propostas Geradas pela IA"])
LIST_CAMPANHAS        = $($salesListIds["Campanhas de Marketing"])

# LISTS - CLIENT SUCCESS
LIST_ONBOARDING       = $($csListIds["Onboarding de Clientes"])
LIST_ENTREGAS         = $($csListIds["Entregas Pendentes"])
LIST_QBR              = $($csListIds["QBR e Follow-up Trimestral"])
LIST_NPS              = $($csListIds["NPS e Satisfacao"])

# LISTS - SUPPORT
LIST_LEGAL            = $($supListIds["Pendencias Legais e Compliance"])
LIST_FINANCEIRO       = $($supListIds["Tarefas Financeiras - NF e Impostos"])
LIST_CONHECIMENTO     = $($supListIds["Base de Conhecimento - Updates"])
LIST_INCIDENTES       = $($supListIds["Incidentes e Ocorrencias"])

# WORKSPACE URL
URL = https://app.clickup.com/$TEAM_ID/home
"@
$content | Out-File -FilePath "integrations\clickup_ids.txt" -Encoding UTF8
Write-Host "  Saved to integrations\clickup_ids.txt" -ForegroundColor Cyan

# ─── FINAL SUMMARY ───────────────────────────────────────────────────────────
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "      AGROSTECH CLICKUP - BUILD COMPLETE!        " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "SPACES:" -ForegroundColor White
Write-Host "  OPERATIONS     : $OPS_ID"   -ForegroundColor Yellow
Write-Host "  SALES          : $SALES_ID" -ForegroundColor Yellow
Write-Host "  CLIENT SUCCESS : $CS_ID"    -ForegroundColor Yellow
Write-Host "  SUPPORT        : $SUP_ID"   -ForegroundColor Yellow
Write-Host ""
Write-Host "LISTS CREATED: 19 total" -ForegroundColor White
Write-Host "  Operations: 4 lists" -ForegroundColor Gray
Write-Host "  Sales: 7 lists"      -ForegroundColor Gray
Write-Host "  Client Success: 4 lists" -ForegroundColor Gray
Write-Host "  Support: 4 lists"    -ForegroundColor Gray
Write-Host ""
Write-Host "TEMPLATE TASKS SEEDED: 6" -ForegroundColor White
Write-Host "  Mission briefing (Field Pilot)"        -ForegroundColor Gray
Write-Host "  Post-mission checklist (Field Pilot)"  -ForegroundColor Gray
Write-Host "  Data processing QA (Data Processing)"  -ForegroundColor Gray
Write-Host "  Daily briefing (Sales Rep)"            -ForegroundColor Gray
Write-Host "  AI proposal (Sales Rep review)"        -ForegroundColor Gray
Write-Host "  Client onboarding (Account Manager)"   -ForegroundColor Gray
Write-Host ""
Write-Host "Open workspace: https://app.clickup.com/$TEAM_ID/home" -ForegroundColor Blue
