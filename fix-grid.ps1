$files = @(
    'frontend\src\components\PerformanceDashboard.tsx',
    'frontend\src\components\UIUXV2DesignSystem.tsx'
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $content = $content -replace '&lt;Grid item xs', '&lt;Grid xs'
        $content = $content -replace '&lt;Grid item md', '&lt;Grid md'
        $content = $content -replace '&lt;Grid item lg', '&lt;Grid lg'
        Set-Content $file $content -NoNewline
        Write-Host " $file 수정 완료" -ForegroundColor Green
    }
}
