# MUI Grid to Grid2 Complete Migration
# 1. Changes import from 'Grid' to 'Grid2'
# 2. Changes all <Grid> tags to <Grid2>

$files = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse

$totalFiles = 0
$totalImportChanges = 0
$totalTagChanges = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fileModified = $false
    
    # Step 1: Change import statement
    # Pattern: import { ... Grid, ... } from '@mui/material';
    # To: import { ... Grid2, ... } from '@mui/material';
    if ($content -match "from '@mui/material'") {
        $beforeImport = $content
        $content = $content -replace '\bGrid\b(?=[^<]*from\s+[''"]@mui/material)', 'Grid2'
        if ($content -ne $beforeImport) {
            $totalImportChanges++
            $fileModified = $true
        }
    }
    
    # Step 2: Change all <Grid> and </Grid> tags to <Grid2> and </Grid2>
    $beforeTags = $content
    $content = $content -replace '<Grid\s', '<Grid2 '
    $content = $content -replace '<Grid>', '<Grid2>'
    $content = $content -replace '</Grid>', '</Grid2>'
    
    if ($content -ne $beforeTags) {
        $openingTags = ([regex]::Matches($beforeTags, '<Grid[\s>]')).Count
        $closingTags = ([regex]::Matches($beforeTags, '</Grid>')).Count
        $totalTagChanges += ($openingTags + $closingTags)
        $fileModified = $true
    }
    
    # Save if modified
    if ($fileModified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $totalFiles++
        Write-Host "✓ $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Grid to Grid2 Migration Complete!" -ForegroundColor Green
Write-Host "Files modified: $totalFiles" -ForegroundColor Yellow
Write-Host "Import changes: $totalImportChanges" -ForegroundColor Yellow
Write-Host "Tag changes: $totalTagChanges" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan
