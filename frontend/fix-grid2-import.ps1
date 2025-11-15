# Fix Grid2 Import Path
# Change: import { Grid2 } from '@mui/material'
# To: import Grid2 from '@mui/material/Unstable_Grid2'

$files = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse

$totalFiles = 0
$totalChanges = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    # Pattern 1: Check if file imports Grid2 from '@mui/material'
    if ($content -match "Grid2.*from\s+['\x22]@mui/material['\x22]") {
        
        # Extract current import line
        if ($content -match "(?m)^import\s+\{[^}]*Grid2[^}]*\}\s+from\s+['\x22]@mui/material['\x22];?\s*$") {
            $importLine = $Matches[0]
            
            # Remove Grid2 from the import list
            $newImportLine = $importLine -replace ',?\s*Grid2\s*,?', ''
            $newImportLine = $newImportLine -replace '\{\s*,', '{'
            $newImportLine = $newImportLine -replace ',\s*\}', '}'
            $newImportLine = $newImportLine -replace '\{\s*\}', ''
            
            # If import becomes empty, remove it entirely
            if ($newImportLine -match '\{\s*\}') {
                $content = $content -replace [regex]::Escape($importLine), ''
            }
            else {
                $content = $content -replace [regex]::Escape($importLine), $newImportLine
            }
            
            # Add new Grid2 import at the top after other @mui/material imports
            $grid2Import = "import Grid2 from '@mui/material/Unstable_Grid2';"
            
            # Find the last @mui/material import line
            $lines = $content -split "`n"
            $insertIndex = -1
            for ($i = 0; $i -lt $lines.Count; $i++) {
                if ($lines[$i] -match "from\s+['\x22]@mui/material['\x22]") {
                    $insertIndex = $i
                }
            }
            
            if ($insertIndex -ge 0) {
                $lines = $lines[0..$insertIndex] + $grid2Import + $lines[($insertIndex + 1)..($lines.Count - 1)]
                $content = $lines -join "`n"
                $modified = $true
                $totalChanges++
            }
        }
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $totalFiles++
        Write-Host "✓ $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Grid2 Import Fix Complete!" -ForegroundColor Green
Write-Host "Files modified: $totalFiles" -ForegroundColor Yellow
Write-Host "Import changes: $totalChanges" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan
