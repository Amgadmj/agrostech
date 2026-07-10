# Agrostech â€” Push Client Database to ClickUp Pipelines
# Carteira: Cana de Acucar | 90 clientes | 4 pipelines
# Estado: Goias + Sao Paulo

$API_KEY  = "pk_6807762_FIDM98KYROQOMNOM8M7TRKWWKTZZOWP2"
$BASE_URL = "https://api.clickup.com/api/v2"
$headers  = @{ "Authorization" = $API_KEY; "Content-Type" = "application/json" }

# Pipeline List IDs (from clickup_ids.txt)
$LIST_REP1 = "901714652093"   # Pipeline - Rep 1 MT-GO      (Goias territory)
$LIST_REP2 = "901714652094"   # Pipeline - Rep 2 PR-RS/SP   (Sao Paulo territory)
$LIST_REP3 = "901714652095"   # Pipeline - Rep 3 Carbono    (Bioenergia / Carbon)
$LIST_REP4 = "901714652096"   # Pipeline - Rep 4 Cooperativas

function New-CUTask($listId, $name, $description, $tags) {
    $body = @{
        name        = $name
        description = $description
        status      = "to do"
        priority    = 3
        tags        = $tags
    }
    $json = $body | ConvertTo-Json -Depth 5
    try {
        $r = Invoke-RestMethod -Method POST `
             -Uri "$BASE_URL/list/$listId/task" `
             -Headers $headers -Body $json
        return $r.id
    } catch {
        Write-Host "    ERROR: $_" -ForegroundColor Red
        return $null
    }
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  AGROSTECH - Pushing Client DB to ClickUp Pipelines  " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# ============================================================
# PIPELINE 1 â€” REP MT/GO  (Goias territory clients)
# ============================================================
Write-Host "`n[PIPELINE 1] Rep MT-GO â€” Clientes Goias" -ForegroundColor Yellow

$clientesGO = @(
    @{ cidade="Arapua";                     matriz="ATVOS";                          grupo="ATVOS" }
    @{ cidade="Agua Emendada";              matriz="ATVOS";                          grupo="ATVOS" }
    @{ cidade="Morro Vermelho";             matriz="ATVOS";                          grupo="ATVOS" }
    @{ cidade="Rio Claro (GO)";             matriz="ATVOS";                          grupo="ATVOS" }
    @{ cidade="Centralcool";               matriz="Centralcool";                    grupo="Centralcool" }
    @{ cidade="Corradinhos Bio";           matriz="Corradinho Bio";                 grupo="Corradinho" }
    @{ cidade="Nacao - Rio Chapadao de Ceu"; matriz="Corradinho Bio";               grupo="Corradinho" }
    @{ cidade="Central Energetica Morrinhos (CEM)"; matriz="Usina Colorado";        grupo="Colorado" }
    @{ cidade="Nova Linda";                matriz="Denasa";                         grupo="Denasa" }
    @{ cidade="Acacus";                    matriz="Grupo Farias";                   grupo="Grupo Farias" }
    @{ cidade="Itapaci";                   matriz="Grupo Farias";                   grupo="Grupo Farias" }
    @{ cidade="Itapuranga";               matriz="Grupo Farias";                   grupo="Grupo Farias" }
    @{ cidade="Goianesia";                 matriz="Grupo Goianesia";                grupo="Grupo Goianesia" }
    @{ cidade="Goiani";                    matriz="Goiania";                        grupo="Goiania" }
    @{ cidade="Serranopolis";              matriz="Usina IPOLUCA";                  grupo="IPOLUCA" }
    @{ cidade="Jales Machado";             matriz="Jales Machado";                  grupo="Jales Machado" }
    @{ cidade="Outeiro Lago";              matriz="Outeiro Lago";                   grupo="Outeiro Lago" }
    @{ cidade="Lago Azul";                 matriz="Lago Azul";                      grupo="Lago Azul" }
    @{ cidade="Santa Helena";              matriz="NAOUM";                          grupo="NAOUM" }
    @{ cidade="Indiruva";                  matriz="Indiruva";                       grupo="Indiruva" }
    @{ cidade="Centroeste";                matriz="Raizen";                         grupo="Raizen" }
    @{ cidade="Rio Verde";                 matriz="Rio Verde";                      grupo="Rio Verde" }
    @{ cidade="Boa Vista";                 matriz="Sao Martinho";                   grupo="Sao Martinho" }
    @{ cidade="Usina Sao Paulo (GO)";      matriz="Usina Sao Paulo";                grupo="Usina Sao Paulo" }
    @{ cidade="Serra do Calapo";           matriz="Serra do Calapo";                grupo="Serra do Calapo" }
    @{ cidade="Rio Dourado";               matriz="Cargill";                        grupo="Cargill" }
    @{ cidade="Sao Francisco (GO)";        matriz="Cargill";                        grupo="Cargill" }
    @{ cidade="Rubi Uruacu";               matriz="IAPUNDI";                        grupo="IAPUNDI" }
    @{ cidade="Carima";                    matriz="Vale do Verdao";                 grupo="Vale do Verdao" }
    @{ cidade="Francesa";                  matriz="Vale do Verdao";                 grupo="Vale do Verdao" }
    @{ cidade="Panorama (GO)";             matriz="Vale do Verdao";                 grupo="Vale do Verdao" }
    @{ cidade="Vale do Verdao Maria";      matriz="Vale do Verdao";                 grupo="Vale do Verdao" }
    @{ cidade="Bom Sucesso";               matriz="VREC";                           grupo="VREC" }
    @{ cidade="Aponi";                     matriz="Nardini";                        grupo="Nardini" }
    @{ cidade="GEM Acreuna";               matriz="GEM";                            grupo="GEM" }
)

$count1 = 0
foreach ($c in $clientesGO) {
    $taskName = "LEAD | $($c.cidade) â€” $($c.matriz)"
    $desc = "CLIENTE POTENCIAL - Cana de Acucar`n`nEstado: Goias`nCidade / Unidade: $($c.cidade)`nMatriz: $($c.matriz)`nGrupo: $($c.grupo)`n`nSTATUS: Lead frio - aguardando primeiro contato`nTERRITORIO: Rep 1 - MT/GO`nSEGMENTO: Usina de Cana de Acucar`n`nPROXIMOS PASSOS:`n[ ] Pesquisar area total plantada`n[ ] Identificar responsavel pelo drone / agronomo`n[ ] Primeiro contato via WhatsApp ou ligacao`n[ ] Qualificar: area, cultura, dor, orcamento"
    $id = New-CUTask $LIST_REP1 $taskName $desc @("goias","cana-de-acucar","lead-frio",$c.grupo.ToLower().Replace(" ","-"))
    if ($id) {
        $count1++
        Write-Host "  + $($c.cidade) [$($c.matriz)]  id=$id" -ForegroundColor DarkGreen
    }
    Start-Sleep -Milliseconds 350
}
Write-Host "  => $count1 clientes criados no Pipeline Rep 1 MT-GO" -ForegroundColor Green

# ============================================================
# PIPELINE 2 â€” REP SP  (Sao Paulo territory clients)
# ============================================================
Write-Host "`n[PIPELINE 2] Rep SP â€” Clientes Sao Paulo" -ForegroundColor Yellow

$clientesSP = @(
    @{ cidade="Sao Joao da Boa Vista";      matriz="ABENIDA";                grupo="ABENIDA" }
    @{ cidade="Rumo - Usina Slater";        matriz="Usina Slater";           grupo="Slater" }
    @{ cidade="Ibaira - Usina Guaira";      matriz="Usina Acucar Guaira";    grupo="Guaira" }
    @{ cidade="Sao Manuel";                 matriz="Sao Manuel";             grupo="Sao Manuel" }
    @{ cidade="Agua Bonita";               matriz="Agua Bonita";            grupo="Agua Bonita" }
    @{ cidade="Alta Mogiana";               matriz="Alta Mogiana";           grupo="Alta Mogiana" }
    @{ cidade="Floralee";                   matriz="Floralee";               grupo="Floralee" }
    @{ cidade="Alto Acre";                  matriz="Alto Acre";              grupo="Alto Acre" }
    @{ cidade="Alcorast";                   matriz="Alcorast";               grupo="Alcorast" }
    @{ cidade="Ararica";                    matriz="Nova Ararica";           grupo="Nova Ararica" }
    @{ cidade="Generosa";                   matriz="Nova Ararica";           grupo="Nova Ararica" }
    @{ cidade="Figueica";                   matriz="Figueica";               grupo="Figueica" }
    @{ cidade="Atena";                      matriz="Atena";                  grupo="Atena" }
    @{ cidade="Alcala";                     matriz="Atena";                  grupo="Atena" }
    @{ cidade="Conceicao do Portal";        matriz="Atena";                  grupo="Atena" }
    @{ cidade="Santo Antonio";              matriz="Grupo Balbo";            grupo="Grupo Balbo" }
    @{ cidade="Sao Francisco (SP)";         matriz="Grupo Balbo";            grupo="Grupo Balbo" }
    @{ cidade="Tabina";                     matriz="Balbo";                  grupo="Grupo Balbo" }
    @{ cidade="Cerves";                     matriz="Usina Barriera";         grupo="Barriera" }
    @{ cidade="Baxari";                     matriz="Usina Baxari";           grupo="Baxari" }
    @{ cidade="Pronal";                     matriz="Bertola";                grupo="Bertola" }
    @{ cidade="Branca Peres";              matriz="Branca Peres";           grupo="Branca Peres" }
    @{ cidade="Cattalcool";               matriz="Cattalcool";             grupo="Cattalcool" }
    @{ cidade="Pauliceia";                  matriz="Grupo Catolicja";        grupo="Catolicja" }
    @{ cidade="Corola";                     matriz="Corola";                 grupo="Corola" }
    @{ cidade="Cereais Brasil";             matriz="Cereais Brasil";         grupo="Cereais Brasil" }
    @{ cidade="Peracalfs";                  matriz="Clenico Acucar";         grupo="Clenico" }
    @{ cidade="Ganamelhos";               matriz="Clenico Acucar";         grupo="Clenico" }
    @{ cidade="Queiros";                    matriz="Clenico Acucar";         grupo="Clenico" }
    @{ cidade="Catoduina";                  matriz="Cofra Agr";              grupo="Cofra" }
    @{ cidade="Piracicaba";               matriz="Cofra Agr";              grupo="Cofra" }
    @{ cidade="Aramere";                    matriz="Colinas Agro Industrio"; grupo="Colinas" }
    @{ cidade="Palestina";                  matriz="Colinas Agro Industrio"; grupo="Colinas" }
    @{ cidade="Carlos Marchetti";           matriz="Colinas Agro Industrio"; grupo="Colinas" }
    @{ cidade="Colorado (SP)";              matriz="Usina Colorado";         grupo="Colorado" }
    @{ cidade="Tatu";                       matriz="Tatu";                   grupo="Tatu" }
    @{ cidade="Keni";                       matriz="CBAA";                   grupo="CBAA" }
    @{ cidade="Da Mota";                    matriz="Da Mota";                grupo="Da Mota" }
    @{ cidade="Dacasa";                     matriz="Dacaso";                 grupo="Dacaso" }
    @{ cidade="Della";                      matriz="DCRO";                   grupo="DCRO" }
    @{ cidade="Destilaria Grupo";           matriz="Destilaria Grupo";       grupo="Destilaria Grupo" }
    @{ cidade="Balsa";                      matriz="Balsa";                  grupo="Balsa" }
)

$count2 = 0
foreach ($c in $clientesSP) {
    $taskName = "LEAD | $($c.cidade) â€” $($c.matriz)"
    $desc = "CLIENTE POTENCIAL - Cana de Acucar`n`nEstado: Sao Paulo`nCidade / Unidade: $($c.cidade)`nMatriz: $($c.matriz)`nGrupo: $($c.grupo)`n`nSTATUS: Lead frio - aguardando primeiro contato`nTERRITORIO: Rep 2 - SP`nSEGMENTO: Usina de Cana de Acucar`n`nPROXIMOS PASSOS:`n[ ] Pesquisar area total plantada`n[ ] Identificar responsavel pelo drone / agronomo`n[ ] Primeiro contato via WhatsApp ou ligacao`n[ ] Qualificar: area, cultura, dor, orcamento"
    $id = New-CUTask $LIST_REP2 $taskName $desc @("sao-paulo","cana-de-acucar","lead-frio",$c.grupo.ToLower().Replace(" ","-"))
    if ($id) {
        $count2++
        Write-Host "  + $($c.cidade) [$($c.matriz)]  id=$id" -ForegroundColor DarkGreen
    }
    Start-Sleep -Milliseconds 350
}
Write-Host "  => $count2 clientes criados no Pipeline Rep 2 SP" -ForegroundColor Green

# ============================================================
# PIPELINE 3 â€” CARBONO / BIOENERGIA
# ============================================================
Write-Host "`n[PIPELINE 3] Carbono / Bioenergia â€” Alto potencial MRV" -ForegroundColor Yellow

$clientesBio = @(
    @{ cidade="Itumbiara";                  matriz="BP Bioenergy";               estado="Goias" }
    @{ cidade="Tropical";                   matriz="BP Bioenergy";               estado="Goias" }
    @{ cidade="Central Energetica Morrinhos"; matriz="Companhia CBS";            estado="Goias" }
    @{ cidade="Vila Boa";                   matriz="Companhia Bioenergetica Rondiaria - CBS"; estado="Goias" }
    @{ cidade="Rio Claro de Goias";         matriz="Eter Bioenergia";            estado="Goias" }
    @{ cidade="Goias Bioenergy";            matriz="Goias Bioenergy";            estado="Goias" }
    @{ cidade="VMG Bioenergy";              matriz="VMG Bioenergy";              estado="Goias" }
    @{ cidade="Itumbiara Energetica";       matriz="Itumbiara Energetica";       estado="Goias" }
    @{ cidade="Muana";                      matriz="BP BioEnergy";               estado="Sao Paulo" }
    @{ cidade="Guarinhas";                  matriz="BP BioEnergy";               estado="Sao Paulo" }
    @{ cidade="Ouroeste";                   matriz="BP BioEnergy";               estado="Sao Paulo" }
    @{ cidade="Ourinhos";                   matriz="Coval Energia Responsavel";  estado="Sao Paulo" }
    @{ cidade="Farroupilha - Paulinia";     matriz="Coval Energia Responsavel";  estado="Sao Paulo" }
)

$count3 = 0
foreach ($c in $clientesBio) {
    $taskName = "LEAD CARBONO | $($c.cidade) â€” $($c.matriz)"
    $desc = "CLIENTE POTENCIAL - Bioenergia / Creditos de Carbono`n`nEstado: $($c.estado)`nCidade / Unidade: $($c.cidade)`nMatriz: $($c.matriz)`n`nSTATUS: Lead qualificado - alto potencial MRV`nTERRITORIO: Rep 3 - Carbono`nSEGMENTO: Bioenergia / Gerador de Credito de Carbono`n`nOPORTUNIDADE:`n- Mapeamento NDVI da cana plantada`n- MRV (Monitoramento, Relatorio e Verificacao) de carbono`n- Estimativa de sequestro de CO2 por hectare`n- Potencial: 50-200 tCO2e/ha por ciclo`n`nPROXIMOS PASSOS:`n[ ] Mapear area total de cana e canavial`n[ ] Verificar se tem programa de carbono ativo`n[ ] Apresentar solucao de MRV com drone`n[ ] Proposta de contrato anual de monitoramento"
    $id = New-CUTask $LIST_REP3 $taskName $desc @("carbono","bioenergia","mrv","lead-qualificado",$c.estado.ToLower().Replace(" ","-"))
    if ($id) {
        $count3++
        Write-Host "  + $($c.cidade) [$($c.matriz)]  id=$id" -ForegroundColor DarkGreen
    }
    Start-Sleep -Milliseconds 350
}
Write-Host "  => $count3 clientes criados no Pipeline Rep 3 Carbono" -ForegroundColor Green

# ============================================================
# PIPELINE 4 â€” COOPERATIVAS
# ============================================================
Write-Host "`n[PIPELINE 4] Cooperativas" -ForegroundColor Yellow

$clientesCoop = @(
    @{ cidade="Crixa";          matriz="Coperssucar";   estado="Goias" }
    @{ cidade="Rubiataba";      matriz="Cooper-Rubi";   estado="Goias" }
    @{ cidade="CRV Goias";      matriz="CRV Goias";     estado="Goias" }
)

$count4 = 0
foreach ($c in $clientesCoop) {
    $taskName = "LEAD COOP | $($c.cidade) â€” $($c.matriz)"
    $desc = "CLIENTE POTENCIAL - Cooperativa SucroenergÃ©tica`n`nEstado: $($c.estado)`nCidade / Unidade: $($c.cidade)`nMatriz: $($c.matriz)`n`nSTATUS: Lead - Abordagem via canal cooperativista`nTERRITORIO: Rep 4 - Cooperativas`nSEGMENTO: Cooperativa SucroenergÃ©tica`n`nESTRATEGIA DE ABORDAGEM:`n- Cooperativas sao tomadas de decisao coletiva: envolver diretoria`n- Apresentar case de outra cooperativa do setor como referencia`n- Proposta de contrato anual para multiplos associados`n- Potencial de volume alto: mapear todas as fazendas dos cooperados`n`nPROXIMOS PASSOS:`n[ ] Identificar Gerente Agricola ou Diretoria Tecnica`n[ ] Solicitar apresentacao institucional`n[ ] Proposta coletiva para membros da cooperativa`n[ ] Demonstracao gratuita em 1 fazenda associada"
    $id = New-CUTask $LIST_REP4 $taskName $desc @("cooperativa","cana-de-acucar","lead-frio",$c.estado.ToLower())
    if ($id) {
        $count4++
        Write-Host "  + $($c.cidade) [$($c.matriz)]  id=$id" -ForegroundColor DarkGreen
    }
    Start-Sleep -Milliseconds 350
}
Write-Host "  => $count4 clientes criados no Pipeline Rep 4 Cooperativas" -ForegroundColor Green

# ============================================================
# FINAL SUMMARY
# ============================================================
$total = $count1 + $count2 + $count3 + $count4
Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "       CLIENT DATABASE PUSH COMPLETE!                 " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "RESUMO:" -ForegroundColor White
Write-Host "  Pipeline Rep 1 MT-GO     : $count1 clientes" -ForegroundColor Yellow
Write-Host "  Pipeline Rep 2 SP        : $count2 clientes" -ForegroundColor Yellow
Write-Host "  Pipeline Rep 3 Carbono   : $count3 clientes" -ForegroundColor Yellow
Write-Host "  Pipeline Rep 4 Cooperativas: $count4 clientes" -ForegroundColor Yellow
Write-Host "  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€" -ForegroundColor Gray
Write-Host "  TOTAL                    : $total clientes" -ForegroundColor Green
Write-Host ""
Write-Host "Open ClickUp: https://app.clickup.com/90171329645/home" -ForegroundColor Blue

