# Script para corrigir todas as variáveis do Firebase no Vercel
# Remover CRLF de todas as variáveis

Write-Host "🔧 Corrigindo variáveis do Firebase no Vercel..." -ForegroundColor Cyan
Write-Host ""

# Lista de variáveis para corrigir (sem CRLF)
$vars = @{
    "NEXT_PUBLIC_FIREBASE_APP_ID" = "1:915790013418:web:dc9b9-abdefcd2e2c"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" = "plataforma-cuide-me.firebaseapp.com"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" = "915790013418"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID" = "plataforma-cuide-me"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" = "plataforma-cuide-me.firebasestorage.app"
}

Write-Host "📋 Variáveis a serem corrigidas:" -ForegroundColor Yellow
$vars.Keys | ForEach-Object { Write-Host "  - $_" }
Write-Host ""

Write-Host "⚠️  INSTRUÇÕES:" -ForegroundColor Red
Write-Host "1. Acesse: https://vercel.com/felipe-pachecos-projects-53eb7e7c/cmd-painel-main/settings/environment-variables"
Write-Host "2. Para CADA variável abaixo, clique em 'Edit' e cole o valor limpo:"
Write-Host ""

foreach ($key in $vars.Keys) {
    $value = $vars[$key]
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "Variável: $key" -ForegroundColor Green
    Write-Host "Valor limpo (copie e cole):" -ForegroundColor White
    Write-Host "  $value" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "3. Após editar TODAS as variáveis, volte aqui e pressione ENTER" -ForegroundColor Yellow
Write-Host "   (não precisa fazer redeploy manual, o script fará isso)"
Read-Host "Pressione ENTER quando terminar de editar todas as variáveis no Vercel"

Write-Host ""
Write-Host "🚀 Fazendo redeploy..." -ForegroundColor Cyan
git commit --allow-empty -m "chore: force redeploy after fixing all Firebase env vars"
git push origin main

Write-Host ""
Write-Host "✅ Redeploy iniciado!" -ForegroundColor Green
Write-Host "Aguarde 30-60 segundos e teste o login novamente." -ForegroundColor White
