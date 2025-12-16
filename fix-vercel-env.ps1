# Script para corrigir variaveis de ambiente no Vercel

$projectId = "prj_Gz0Yxw98LjLBqp3YMTQWYe51s9sB"
$token = $env:VERCEL_TOKEN

if (-not $token) {
    Write-Host "Erro: VERCEL_TOKEN nao encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "Corrigindo variaveis de ambiente no Vercel..." -ForegroundColor Cyan

$envVars = @{}
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $envVars[$key] = $value
    }
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    
    Write-Host "Atualizando $key..." -ForegroundColor Yellow
    
    $body = @{
        key = $key
        value = $value
        type = "encrypted"
        target = @("production", "preview", "development")
    } | ConvertTo-Json
    
    try {
        $existingEnvs = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$projectId/env" -Headers $headers -Method Get
        $existing = $existingEnvs.envs | Where-Object { $_.key -eq $key }
        
        if ($existing) {
            foreach ($env in $existing) {
                Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$projectId/env/$($env.id)" -Headers $headers -Method Delete | Out-Null
            }
        }
        
        Invoke-RestMethod -Uri "https://api.vercel.com/v10/projects/$projectId/env" -Headers $headers -Method Post -Body $body | Out-Null
        
        Write-Host "OK: $key atualizado" -ForegroundColor Green
    } catch {
        Write-Host "Erro ao atualizar $key : $_" -ForegroundColor Red
    }
}

Write-Host "Concluido! Faca um novo deploy" -ForegroundColor Green
