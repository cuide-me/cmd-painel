# Script para copiar email da service account para área de transferência
# Execute este script e cole o email no Google Analytics

$serviceAccountEmail = "firebase-adminsdk-fbsvc@plataforma-cuide-me.iam.gserviceaccount.com"

# Copiar para clipboard
Set-Clipboard -Value $serviceAccountEmail

Write-Host ""
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📊 CONFIGURAR GOOGLE ANALYTICS 4" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Email da Service Account COPIADO para área de transferência!" -ForegroundColor Green
Write-Host ""
Write-Host "Email copiado:" -ForegroundColor Yellow
Write-Host "  $serviceAccountEmail" -ForegroundColor White
Write-Host ""
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PASSOS PARA ADICIONAR NO GA4:" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Abra:" -ForegroundColor Yellow
Write-Host "   https://analytics.google.com/" -ForegroundColor White
Write-Host ""
Write-Host "2. Vá em:" -ForegroundColor Yellow
Write-Host "   Admin → Property Access Management" -ForegroundColor White
Write-Host ""
Write-Host "3. Clique em:" -ForegroundColor Yellow
Write-Host "   + (Add users)" -ForegroundColor White
Write-Host ""
Write-Host "4. Cole o email (já está na área de transferência!):" -ForegroundColor Yellow
Write-Host "   CTRL+V" -ForegroundColor White
Write-Host ""
Write-Host "5. Selecione permissão:" -ForegroundColor Yellow
Write-Host "   Viewer (mínimo) ou Analyst (recomendado)" -ForegroundColor White
Write-Host ""
Write-Host "6. DESMARQUE:" -ForegroundColor Yellow
Write-Host "   'Notify user by email' (é uma service account)" -ForegroundColor White
Write-Host ""
Write-Host "7. Clique em:" -ForegroundColor Yellow
Write-Host "   Add" -ForegroundColor White
Write-Host ""
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Após configurar, teste com:" -ForegroundColor Green
Write-Host "  npm run test:integrations" -ForegroundColor White
Write-Host ""
Write-Host "Pressione qualquer tecla para abrir o Google Analytics..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Abrir Google Analytics
Start-Process "https://analytics.google.com/analytics/web/#/a254890390p503083965/admin/property-access-management"

Write-Host ""
Write-Host "✅ Navegador aberto! Siga os passos acima." -ForegroundColor Green
Write-Host ""
