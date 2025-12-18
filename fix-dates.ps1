# Script para corrigir todas as datas do Firestore
# Substitui .toDate() pela função helper toDate()

Write-Host "=== Corrigindo datas do Firestore ===" -ForegroundColor Cyan

$files = @(
    "src\services\admin\operational-health\professionals.ts",
    "src\services\admin\operational-health\families.ts",
    "src\services\admin\pipeline-v2\pipelineService.ts",
    "src\services\admin\control-tower\finance.ts",
    "src\services\admin\control-tower\operations.ts",
    "src\services\admin\torre\serviceDesk.ts",
    "src\services\admin\torre\overview.ts",
    "src\services\admin\torre\modules.ts",
    "src\services\admin\pipeline\getPipelineData.ts"
)

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        Write-Host "Processando: $file" -ForegroundColor Yellow
        
        $content = Get-Content $fullPath -Raw -Encoding UTF8
        $originalContent = $content
        
        # 1. Adicionar import se não existir
        if ($content -notmatch "import.*toDate.*from.*@/lib/dateUtils") {
            # Encontrar a última linha de import
            $lines = $content -split "`n"
            $lastImportIndex = -1
            for ($i = 0; $i -lt $lines.Count; $i++) {
                if ($lines[$i] -match "^import ") {
                    $lastImportIndex = $i
                }
            }
            
            if ($lastImportIndex -ge 0) {
                $lines = $lines[0..$lastImportIndex] + "import { toDate } from '@/lib/dateUtils';" + $lines[($lastImportIndex + 1)..($lines.Count - 1)]
                $content = $lines -join "`n"
                Write-Host "  ✓ Import adicionado" -ForegroundColor Green
            }
        }
        
        # 2. Substituir padrões de data
        # Padrão: data.field?.toDate() || new Date()
        $content = $content -replace '(\w+)\.(\w+)\?\.toDate\(\)\s*\|\|\s*new Date\(\)', 'toDate($1.$2) || new Date()'
        
        # Padrão: data.field?.toDate()
        $content = $content -replace '(\w+)\.(\w+)\?\.toDate\(\)', 'toDate($1.$2)'
        
        # Padrão: data.field.toDate()
        $content = $content -replace '(\w+)\.(\w+)\.toDate\(\)', 'toDate($1.$2)'
        
        # 3. Salvar se houver mudanças
        if ($content -ne $originalContent) {
            $content | Set-Content $fullPath -Encoding UTF8 -NoNewline
            Write-Host "  ✓ Atualizado" -ForegroundColor Green
        } else {
            Write-Host "  - Sem mudanças" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ✗ Arquivo não encontrado: $file" -ForegroundColor Red
    }
}

Write-Host "`n=== Concluído ===" -ForegroundColor Cyan
Write-Host "Agora todos os arquivos usam a função toDate() que suporta tanto Timestamps quanto ISO strings" -ForegroundColor Green
