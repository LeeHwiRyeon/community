# Fix ALL Grid2 Imports - Comprehensive Version
# This script handles all cases of Grid2 imports

$files = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse | Where-Object { 
    $_.FullName -notlike "*node_modules*" 
}

$totalFiles = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Check if Grid2 is used in the file
    if ($content -match "Grid2") {
        # Check if import is from '@mui/material'
        if ($content -match "Grid2.*from\s+['\x22]@mui/material['\x22]") {
            
            # Remove Grid2 from the @mui/material import
            $content = $content -replace ',\s*Grid2\s*,', ','
            $content = $content -replace ',\s*Grid2\s*}', '}'
            $content = $content -replace '{\s*Grid2\s*,', '{'
            
            # Check if @mui/material/Unstable_Grid2 import already exists
            if ($content -notmatch "from\s+['\x22]@mui/material/Unstable_Grid2['\x22]") {
                # Find the line with @mui/material import
                $lines = $content -split "`r?`n"
                $lastMuiImportIndex = -1
                
                for ($i = 0; $i -lt $lines.Count; $i++) {
                    if ($lines[$i] -match "from\s+['\x22]@mui/material['\x22]") {
                        $lastMuiImportIndex = $i
                    }
                }
                
                if ($lastMuiImportIndex -ge 0) {
                    # Insert Grid2 import after the last @mui/material import
                    $newImport = "import Grid2 from '@mui/material/Unstable_Grid2';"
                    $lines = $lines[0..$lastMuiImportIndex] + $newImport + $lines[($lastMuiImportIndex + 1)..($lines.Count - 1)]
                    $content = $lines -join "`n"
                }
            }
        }
    }
    
    # Save if modified
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $totalFiles++
        Write-Host "✓ $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Grid2 Import Fix Complete!" -ForegroundColor Green  
Write-Host "Files modified: $totalFiles" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan
