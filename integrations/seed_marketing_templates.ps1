# Agrostech Marketing Template Seeder
$API_KEY = "pk_6807762_FIDM98KYROQOMNOM8M7TRKWWKTZZOWP2"
$LIST_ID = "901714652099"
$BASE_URL = "https://api.clickup.com/api/v2"
$headers  = @{ "Authorization" = $API_KEY; "Content-Type" = "application/json" }

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

Write-Host "Seeding marketing templates..." -ForegroundColor Yellow

# 1. Briefing Mensal
$t1 = Invoke-CU POST "/list/$LIST_ID/task" @{
    name = "[TEMPLATE] Briefing Mensal - [Mes/Ano]"
    description = "BRIEFING MENSAL DE CONTEUDO - gerado pelo Marketing Agent
Status: Planejamento
Prazo: ate o dia 25 do mes anterior

OBJETIVOS DE LEAD MAGNET: [Ex: Guia de Credito de Carbono]
FOCOS DE CAMPANHA: [Ex: Planejamento da safra de soja em MT]
CULTURAS EM FOCO: [Ex: Soja, Milho]

DISTRIBUICAO ESPERADA:
- Posts estaticos/Carrosseis: [N]
- Reels (Instagram): [N]
- TikToks (nativos): [N]

CHECKLIST DO DIRETOR DE CONTEUDO:
[ ] Elaborar calendario editorial completo no ClickUp
[ ] Atribuir tarefas de geracao de imagem para o Instagram Image Agent
[ ] Atribuir tarefas de roteiro para o Instagram Reels Agent
[ ] Atribuir tarefas de roteiro nativo para o TikTok Agent
[ ] Definir diretrizes visuais para o Visual Identity Agent"
    priority = 3
    tags = @("template", "briefing-mensal", "content-director")
}
if ($t1) { Write-Host "  + Marketing Content Briefing template [id=$($t1.id)]" -ForegroundColor Green }

# 2. Post Card
$t2 = Invoke-CU POST "/list/$LIST_ID/task" @{
    name = "[TEMPLATE] Post: [Titulo] - [Plataforma]"
    description = "CARD DE POST - criado pelo Content Director
Status: Criacao

PLATAFORMA: Instagram / TikTok / Ambas
FORMATO: Carrossel / Post Unico / Reel / TikTok Nativo
PILAR: Tech / Resultado / Carbono / Voz do Produtor
PUBLICO-ALVO: Decisor Millennial / Gen-Z / Ambos
HOOK SUGERIDO: [Ideia de gancho]

CHECKLIST DE GERACAO:
[ ] Criar conceito criativo e roteiro
[ ] Gerar prompts de imagem (se aplicavel)
[ ] Selecionar trilha sonora e hook de audio (se aplicavel)
[ ] Escrever legenda / caption com hashtags e CTA
[ ] Enviar para aprovacao do Visual Identity Agent (Mudar status para Pronto para Revisao Visual)"
    priority = 2
    tags = @("template", "post-card", "content-generation")
}
if ($t2) { Write-Host "  + Marketing Post template [id=$($t2.id)]" -ForegroundColor Green }

# 3. Visual Identity Review
$t3 = Invoke-CU POST "/list/$LIST_ID/task" @{
    name = "[TEMPLATE] Revisao de Marca: [Post]"
    description = "REVISAO DE MARCA E IDENTIDADE VISUAL - Visual Identity Agent
Status: Em Revisao

CHECKLIST DE REVISAO VISUAL:
[ ] Cores primarias no Brand Style Guide (Verde Terra / Laranja Cerrado)
[ ] Tipografia Montserrat (headlines) e Inter (dados)
[ ] Logotipo oficial presente nas proporcoes corretas
[ ] Acessibilidade: Contraste minimo de 4.5:1
[ ] Legibilidade: Texto ocupa menos de 20% da imagem
[ ] Linguagem nativa e adequada ao canal (especialmente TikTok)"
    priority = 3
    tags = @("template", "revisao-marca", "visual-identity")
}
if ($t3) { Write-Host "  + Visual Identity Review template [id=$($t3.id)]" -ForegroundColor Green }

Write-Host "Done!" -ForegroundColor Yellow
