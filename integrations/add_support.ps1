$h = @{ "Authorization" = "pk_6807762_FIDM98KYROQOMNOM8M7TRKWWKTZZOWP2"; "Content-Type" = "application/json" }

# Create SUPPORT folder inside OPERATIONS space (workaround for 5-space plan limit)
$body = '{"name":"SUPPORT - Agrostech"}'
$folder = Invoke-RestMethod -Method POST -Uri "https://api.clickup.com/api/v2/space/90176120906/folder" -Headers $h -Body $body
$SUP_FOLDER = $folder.id
Write-Host "SUPPORT folder created: id=$SUP_FOLDER" -ForegroundColor Green

Start-Sleep -Milliseconds 500

$lists = @(
    "Pendencias Legais e Compliance",
    "Tarefas Financeiras - NF e Impostos",
    "Base de Conhecimento - Updates",
    "Incidentes e Ocorrencias"
)
foreach ($name in $lists) {
    $lb = "{`"name`":`"$name`"}"
    $r = Invoke-RestMethod -Method POST -Uri "https://api.clickup.com/api/v2/folder/$SUP_FOLDER/list" -Headers $h -Body $lb
    Write-Host "  + $name  [id=$($r.id)]" -ForegroundColor DarkGreen
    Start-Sleep -Milliseconds 500
}
Write-Host "Done." -ForegroundColor Cyan
