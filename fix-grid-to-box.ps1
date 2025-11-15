# Grid를 Box로 변환하는 스크립트
# MUI v7에서 Grid의 xs/md prop을 지원하지 않으므로 Box + sx prop으로 변환

$files = Get-ChildItem -Path "frontend\src" -Recurse -Filter "*.tsx" | Where-Object {
    $content = Get-Content $_.FullName -Raw
    $content -match '<Grid\s+(xs|md)='
}

Write-Host "Found $($files.Count) files with Grid xs/md props"

foreach ($file in $files) {
    Write-Host "`nProcessing: $($file.Name)"
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    # Pattern 1: <Grid xs={12} md={6}> -> <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' } }}>
    if ($content -match '<Grid\s+xs=\{12\}\s+md=\{6\}') {
        $content = $content -replace '<Grid\s+xs=\{12\}\s+md=\{6\}>', '<Box sx={{ flex: { xs: ''1 1 100%'', md: ''1 1 calc(50% - 12px)'' } }}>'
        $modified = $true
        Write-Host "  - Converted Grid xs={12} md={6} to Box"
    }
    
    # Pattern 2: <Grid xs={12} md={4}> -> <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 16px)' } }}>
    if ($content -match '<Grid\s+xs=\{12\}\s+md=\{4\}') {
        $content = $content -replace '<Grid\s+xs=\{12\}\s+md=\{4\}>', '<Box sx={{ flex: { xs: ''1 1 100%'', md: ''1 1 calc(33.333% - 16px)'' } }}>'
        $modified = $true
        Write-Host "  - Converted Grid xs={12} md={4} to Box"
    }
    
    # Pattern 3: <Grid xs={12}> -> <Box sx={{ width: '100%' }}>
    if ($content -match '<Grid\s+xs=\{12\}>') {
        $content = $content -replace '<Grid\s+xs=\{12\}>', '<Box sx={{ width: ''100%'' }}>'
        $modified = $true
        Write-Host "  - Converted Grid xs={12} to Box"
    }
    
    # Pattern 4: <Grid xs={12} md={3}> -> <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(25% - 18px)' } }}>
    if ($content -match '<Grid\s+xs=\{12\}\s+md=\{3\}') {
        $content = $content -replace '<Grid\s+xs=\{12\}\s+md=\{3\}>', '<Box sx={{ flex: { xs: ''1 1 100%'', md: ''1 1 calc(25% - 18px)'' } }}>'
        $modified = $true
        Write-Host "  - Converted Grid xs={12} md={3} to Box"
    }
    
    # Pattern 5: <Grid xs={6}> -> <Box sx={{ flex: '1 1 50%' }}>
    if ($content -match '<Grid\s+xs=\{6\}>') {
        $content = $content -replace '<Grid\s+xs=\{6\}>', '<Box sx={{ flex: ''1 1 50%'' }}>'
        $modified = $true
        Write-Host "  - Converted Grid xs={6} to Box"
    }
    
    if ($modified) {
        # Grid container는 flex box로 변환
        $content = $content -replace '<Grid\s+container\s+spacing=\{2\}>', '<Box sx={{ display: ''flex'', flexWrap: ''wrap'', gap: 2 }}>'
        $content = $content -replace '<Grid\s+container\s+spacing=\{3\}>', '<Box sx={{ display: ''flex'', flexWrap: ''wrap'', gap: 3 }}>'
        $content = $content -replace '<Grid\s+container>', '<Box sx={{ display: ''flex'', flexWrap: ''wrap'', gap: 2 }}>'
        
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  ✓ Saved changes"
    }
}

Write-Host "`n✨ Conversion complete!"
Write-Host "Run 'npx tsc --noEmit' to check for remaining errors"
