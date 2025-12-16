# Script para atualizar variáveis de ambiente na Vercel
# Execute este script após configurar as credenciais localmente

Write-Host ""
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📤 SINCRONIZAR VARIÁVEIS COM VERCEL" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verificar se Vercel CLI está instalado
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "⚠️  Vercel CLI não encontrado!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Instale com: npm install -g vercel" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou configure manualmente:" -ForegroundColor Yellow
    Write-Host "  1. Acesse: https://vercel.com/cuide-me/cmd-painel-main/settings/environment-variables" -ForegroundColor White
    Write-Host "  2. Adicione as seguintes variáveis de produção:" -ForegroundColor White
    Write-Host ""
    Write-Host "     - FIREBASE_ADMIN_SERVICE_ACCOUNT" -ForegroundColor Cyan
    Write-Host "     - STRIPE_SECRET_KEY" -ForegroundColor Cyan
    Write-Host "     - GOOGLE_APPLICATION_CREDENTIALS_JSON" -ForegroundColor Cyan
    Write-Host "     - GA4_PROPERTY_ID" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  3. Copie os valores do .env.local" -ForegroundColor White
    Write-Host "  4. Faça novo deploy" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Vercel CLI encontrado" -ForegroundColor Green
Write-Host ""

# Ler .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ Arquivo .env.local não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Lendo variáveis de .env.local..." -ForegroundColor Yellow
Write-Host ""

# Variáveis críticas para produção
$criticalVars = @(
    "FIREBASE_ADMIN_SERVICE_ACCOUNT",
    "STRIPE_SECRET_KEY",
    "GOOGLE_APPLICATION_CREDENTIALS_JSON",
    "GA4_PROPERTY_ID",
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID"
)

$envContent = Get-Content ".env.local" -Raw
$envVars = @{}

foreach ($line in ($envContent -split "`n")) {
    if ($line -match '^([^#=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        if ($criticalVars -contains $key) {
            $envVars[$key] = $value
        }
    }
}

Write-Host "Variáveis encontradas:" -ForegroundColor Green
foreach ($key in $envVars.Keys) {
    $preview = if ($envVars[$key].Length -gt 50) { 
        $envVars[$key].Substring(0, 30) + "..." 
    } else { 
        $envVars[$key] 
    }
    Write-Host "  ✓ $key" -ForegroundColor White -NoNewline
    Write-Host " = $preview" -ForegroundColor Gray
}

Write-Host ""
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "  Este script requer Vercel CLI configurado com suas credenciais." -ForegroundColor White
Write-Host ""
Write-Host "Deseja continuar e enviar para a Vercel? (S/N)" -ForegroundColor Yellow
$confirm = Read-Host

if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host ""
    Write-Host "❌ Operação cancelada" -ForegroundColor Red
    Write-Host ""
    Write-Host "Configure manualmente em:" -ForegroundColor Yellow
    Write-Host "https://vercel.com/cuide-me/cmd-painel-main/settings/environment-variables" -ForegroundColor White
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "📤 Enviando variáveis para Vercel (production)..." -ForegroundColor Yellow
Write-Host ""

$errorCount = 0

foreach ($key in $envVars.Keys) {
    Write-Host "Enviando: $key..." -ForegroundColor Gray -NoNewline
    
    try {
        # Usar Vercel CLI para adicionar variável
        $output = vercel env add $key production --force 2>&1
        
        # Enviar valor via stdin
        $envVars[$key] | vercel env add $key production --force 2>&1 | Out-Null
        
        Write-Host " ✓" -ForegroundColor Green
    } catch {
        Write-Host " ✗" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host ""

if ($errorCount -eq 0) {
    Write-Host "════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  ✅ VARIÁVEIS SINCRONIZADAS COM SUCESSO!" -ForegroundColor Green
    Write-Host "════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Yellow
    Write-Host "  1. Faça um novo deploy:" -ForegroundColor White
    Write-Host "     git push origin main" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  2. Ou force redeploy no dashboard da Vercel" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "  ⚠️  ALGUNS ERROS OCORRERAM" -ForegroundColor Yellow
    Write-Host "════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Configure manualmente as variáveis que falharam em:" -ForegroundColor White
    Write-Host "https://vercel.com/cuide-me/cmd-painel-main/settings/environment-variables" -ForegroundColor Cyan
    Write-Host ""
}
