# MUI Grid to Grid2 Migration Script
# Removes deprecated 'item' prop from Grid components

$files = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse

$totalFiles = 0
$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Pattern 1: <Grid item xs={...} md={...} key={...}>
    # Remove 'item' prop
    $content = $content -replace '<Grid\s+item\s+', '<Grid '
    
    # Pattern 2: Check if file was modified
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $replacements = ([regex]::Matches($originalContent, '<Grid\s+item\s+')).Count
        $totalReplacements += $replacements
        $totalFiles++
        Write-Host "✓ $($file.Name): $replacements replacements" -ForegroundColor Green
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Migration Complete!" -ForegroundColor Green
Write-Host "Files modified: $totalFiles" -ForegroundColor Yellow
Write-Host "Total replacements: $totalReplacements" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan
