# Torre v2 - Deployment Script (PowerShell)
# Automated deployment with safety checks

param(
    [string]$Environment = "production",
    [switch]$SkipTests = $false
)

Write-Host "🚀 Torre v2 Deployment Script" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Configuration:" -ForegroundColor White
Write-Host "  Environment: $Environment" -ForegroundColor Gray
Write-Host "  Skip Tests: $SkipTests" -ForegroundColor Gray
Write-Host ""

# Step 1: Check environment variables
Write-Host "🔍 Step 1: Checking environment variables..." -ForegroundColor Yellow

if (-not $env:FIREBASE_PROJECT_ID) {
    Write-Host "❌ FIREBASE_PROJECT_ID not set" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Environment variables OK" -ForegroundColor Green
Write-Host ""

# Step 2: Run tests (unless skipped)
if (-not $SkipTests) {
    Write-Host "🧪 Step 2: Running tests..." -ForegroundColor Yellow
    
    npm test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Unit tests failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Tests passed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Skipping tests (SkipTests flag set)" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Build
Write-Host "🏗️  Step 3: Building application..." -ForegroundColor Yellow

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy to Vercel
Write-Host "🚢 Step 4: Deploying to Vercel..." -ForegroundColor Yellow

if ($Environment -eq "staging") {
    vercel --env=staging
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Deployment to staging failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Deployed to staging" -ForegroundColor Green
}
elseif ($Environment -eq "production") {
    # Confirmation prompt
    Write-Host ""
    Write-Host "⚠️  You are about to deploy to PRODUCTION" -ForegroundColor Yellow
    $confirm = Read-Host "Are you sure? (yes/no)"
    
    if ($confirm -ne "yes") {
        Write-Host "❌ Deployment cancelled" -ForegroundColor Red
        exit 1
    }
    
    vercel --prod
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Deployment to production failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Deployed to production" -ForegroundColor Green
}
else {
    Write-Host "❌ Invalid environment: $Environment (must be 'staging' or 'production')" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 5: Health check
Write-Host "🏥 Step 5: Running health check..." -ForegroundColor Yellow

Start-Sleep -Seconds 5  # Wait for deployment to stabilize

if ($Environment -eq "staging") {
    $HealthUrl = "https://your-staging-url.vercel.app/api/health/integrations"
} else {
    $HealthUrl = "https://your-domain.com/api/health/integrations"
}

try {
    $response = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Health check passed (200 OK)" -ForegroundColor Green
    } else {
        Write-Host "❌ Health check failed (HTTP $($response.StatusCode))" -ForegroundColor Red
        Write-Host "⚠️  Consider rolling back!" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
    Write-Host "⚠️  Consider rolling back!" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 6: Summary
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "🎉 Deployment Complete!" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Environment: $Environment" -ForegroundColor White
Write-Host "Status: Success" -ForegroundColor Green
Write-Host "Health: OK" -ForegroundColor Green
Write-Host ""

if ($Environment -eq "production") {
    Write-Host "🔍 Monitor the following:" -ForegroundColor Yellow
    Write-Host "  - Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor Gray
    Write-Host "  - Health Endpoint: $HealthUrl" -ForegroundColor Gray
    Write-Host "  - Error Tracking: Check logs" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠️  Remember: You can rollback with 'vercel rollback'" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ All done! 🚀" -ForegroundColor Green
