# Fix Grid2 imports - Working version
# Removes Grid2 from @mui/material imports and adds separate import

$targetFiles = @(
    "components\AIPredictiveAnalytics.tsx",
    "components\AutoModerationSystem.tsx",
    "components\BetaTestManagement.tsx",
    "components\BetaTestExecution.tsx",
    "components\AdvancedAIIntegration.tsx",
    "components\AdvancedCommunityManager.tsx",
    "components\AdvancedPerformanceOptimization.tsx",
    "components\AICommunityRecommendation.tsx",
    "components\AutoAgentsContentDashboard.tsx",
    "components\CommunityGameSystem.tsx",
    "components\CommunityAnalyticsDashboard.tsx",
    "components\CoreModulesIntegration.tsx",
    "components\CosplayerItemCreatorSystem.tsx",
    "components\EnhancedDesignSystem.tsx",
    "components\FeedbackImplementationSystem.tsx",
    "components\FinalDeploymentSystem.tsx",
    "components\IntelligentContentFeed.tsx",
    "components\IntegratedDashboard.tsx",
    "components\InternationalizationSystem.tsx",
    "components\PerformanceDashboard.tsx",
    "components\PerformanceMetricsDashboard.tsx",
    "components\RealtimeCommunityInteraction.tsx",
    "components\ReportManagementSystem.tsx",
    "components\RPGProfileSystem.tsx",
    "components\SpamPreventionSystem.tsx",
    "components\StreamerManagerSystem.tsx",
    "components\UIUXV2DesignSystem.tsx",
    "components\Community\CommunityManager.tsx",
    "components\News\NewsManager.tsx",
    "pages\CommunityHub.tsx"
)

$fixed = 0
$skipped = 0

foreach ($file in $targetFiles) {
    $fullPath = "src\$file"
    
    if (-not (Test-Path $fullPath)) {
        Write-Host "⚠ Not found: $file" -ForegroundColor Yellow
        $skipped++
        continue
    }
    
    try {
        $content = Get-Content $fullPath -Raw -Encoding UTF8
        
        # Check if already has Unstable_Grid2 import
        if ($content -match "from '@mui/material/Unstable_Grid2'") {
            Write-Host "⏭ Already fixed: $file" -ForegroundColor Cyan
            $skipped++
            continue
        }
        
        # Remove Grid2 from @mui/material import list
        $newContent = $content -replace '(\s+)Grid2,\s*\n', '$1'
        $newContent = $newContent -replace ',\s*Grid2\s*\n', "`n"
        
        # Add new import line after @mui/material import
        $newContent = $newContent -replace "(} from '@mui/material';)", "`$1`nimport Grid2 from '@mui/material/Unstable_Grid2';"
        
        if ($newContent -ne $content) {
            Set-Content $fullPath -Value $newContent -NoNewline -Encoding UTF8
            Write-Host "✓ Fixed: $file" -ForegroundColor Green
            $fixed++
        }
        else {
            Write-Host "⏭ No change: $file" -ForegroundColor Gray
            $skipped++
        }
    }
    catch {
        Write-Host "❌ Error: $file - $_" -ForegroundColor Red
        $skipped++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Grid2 Import Fix Complete!" -ForegroundColor Green
Write-Host "✓ Fixed: $fixed files" -ForegroundColor Green
Write-Host "⏭ Skipped: $skipped files" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan
