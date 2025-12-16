Write-Host "Sincronizando variaveis de ambiente com Vercel..." -ForegroundColor Cyan

$envFile = ".env.production.local"
$envVars = @{}

Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#")) {
        if ($line -match "^([^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            $value = $value -replace '^"(.*)"$', '$1'
            $value = $value -replace "\\r\\n$", ""
            $envVars[$key] = $value
        }
    }
}

Write-Host "Variaveis encontradas: $($envVars.Count)" -ForegroundColor Green

$criticalVars = @(
    "FIREBASE_ADMIN_SERVICE_ACCOUNT",
    "STRIPE_SECRET_KEY",
    "GA4_PROPERTY_ID"
)

foreach ($key in $criticalVars) {
    if ($envVars.ContainsKey($key)) {
        Write-Host "Adicionando: $key" -ForegroundColor Yellow
        $value = $envVars[$key]
        $value | vercel env add $key production --force
    }
}

Write-Host "Concluido! Faca um novo deploy." -ForegroundColor Green
