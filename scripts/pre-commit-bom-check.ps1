#!/usr/bin/env pwsh
param()

$allowed = @('.ps1', '.bat')

$changed = git diff --cached --name-only --diff-filter=AM 2>$null
if (-not $changed) { exit 0 }

$hasIssue = $false
foreach ($file in $changed) {
    if (-not (Test-Path $file)) { continue }
    $ext = [System.IO.Path]::GetExtension($file)
    if ($allowed -contains $ext) { continue }
    $bytes = Get-Content -Path $file -Encoding Byte -TotalCount 3
    if ($bytes.Length -eq 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        Write-Error "BOM detected in $file (violates utf-8 without BOM policy)."
        $hasIssue = $true
    }
}

if ($hasIssue) {
    Write-Error "Remove BOM from the files above or add to allowed list."
    exit 1
}
exit 0
