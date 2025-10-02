# Community Platform v1.1 파일 정리 스크립트

Write-Host "🗂️ Community Platform v1.1 파일 정리 시작!" -ForegroundColor Green
Write-Host ""

# 1. 아카이브 디렉토리 생성
Write-Host "📁 아카이브 디렉토리 생성 중..." -ForegroundColor Yellow
$archiveDir = "archive-v1-1"
if (!(Test-Path $archiveDir)) {
    New-Item -ItemType Directory -Path $archiveDir
    New-Item -ItemType Directory -Path "$archiveDir/old-logs"
    New-Item -ItemType Directory -Path "$archiveDir/temp-files"
    New-Item -ItemType Directory -Path "$archiveDir/backup-configs"
    New-Item -ItemType Directory -Path "$archiveDir/deprecated-scripts"
    Write-Host "✅ 아카이브 디렉토리 생성 완료" -ForegroundColor Green
}

# 2. 로그 파일 정리
Write-Host "📋 로그 파일 정리 중..." -ForegroundColor Yellow
$logFiles = @(
    "*.log",
    "*.err",
    "*.out",
    "backend.log",
    "frontend.log",
    "mock-backend.err",
    "mock-server.err",
    "auto-deploy-test.log",
    "autoagents-v1-hosting.log",
    "firebase-auto-setup.log",
    "local-hosting.log",
    "frontend-preview.err",
    "frontend-preview.log"
)

foreach ($pattern in $logFiles) {
    $files = Get-ChildItem -Path . -Name $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        if (Test-Path $file) {
            Move-Item $file "$archiveDir/old-logs/" -Force
            Write-Host "  📄 $file → archive-v1-1/old-logs/" -ForegroundColor Cyan
        }
    }
}

# 3. 임시 파일 정리
Write-Host "🗑️ 임시 파일 정리 중..." -ForegroundColor Yellow
$tempFiles = @(
    "*.tmp",
    "*.temp",
    ".DS_Store",
    "Thumbs.db",
    "desktop.ini"
)

foreach ($pattern in $tempFiles) {
    $files = Get-ChildItem -Path . -Name $pattern -Recurse -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        if (Test-Path $file.FullName) {
            Remove-Item $file.FullName -Force
            Write-Host "  🗑️ 삭제: $($file.Name)" -ForegroundColor Red
        }
    }
}

# 4. 중복 설정 파일 정리
Write-Host "⚙️ 중복 설정 파일 정리 중..." -ForegroundColor Yellow
$configFiles = @(
    "docker-compose.prod-local.yml",
    "docker-compose.staging.yml"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Move-Item $file "$archiveDir/backup-configs/" -Force
        Write-Host "  📄 $file → archive-v1-1/backup-configs/" -ForegroundColor Cyan
    }
}

# 5. 사용하지 않는 스크립트 정리
Write-Host "📜 사용하지 않는 스크립트 정리 중..." -ForegroundColor Yellow
$deprecatedScripts = @(
    "scripts/test-environment-isolation.ps1",
    "scripts/robust-test-runner.ps1",
    "scripts/simple-robust-runner.ps1",
    "scripts/persistent-web-server.ps1",
    "scripts/simple-persistent-server.ps1",
    "scripts/automated-test-runner.ps1",
    "scripts/automated-test-runner-fixed.ps1"
)

foreach ($script in $deprecatedScripts) {
    if (Test-Path $script) {
        Move-Item $script "$archiveDir/deprecated-scripts/" -Force
        Write-Host "  📜 $script → archive-v1-1/deprecated-scripts/" -ForegroundColor Cyan
    }
}

# 6. 빈 디렉토리 정리
Write-Host "📁 빈 디렉토리 정리 중..." -ForegroundColor Yellow
$emptyDirs = @(
    "test-environment",
    "persistent-web",
    "frontend-old"
)

foreach ($dir in $emptyDirs) {
    if (Test-Path $dir) {
        $items = Get-ChildItem $dir -ErrorAction SilentlyContinue
        if ($items.Count -eq 0) {
            Remove-Item $dir -Recurse -Force
            Write-Host "  📁 빈 디렉토리 삭제: $dir" -ForegroundColor Red
        }
        else {
            Move-Item $dir "$archiveDir/" -Force
            Write-Host "  📁 $dir → archive-v1-1/" -ForegroundColor Cyan
        }
    }
}

# 7. node_modules 크기 확인 및 정리
Write-Host "📦 node_modules 정리 중..." -ForegroundColor Yellow
$nodeModulesDirs = Get-ChildItem -Path . -Name "node_modules" -Recurse -Directory -ErrorAction SilentlyContinue
foreach ($dir in $nodeModulesDirs) {
    $size = (Get-ChildItem $dir.FullName -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "  📦 $($dir.FullName): $([math]::Round($size, 2)) MB" -ForegroundColor Cyan
}

# 8. 문서 파일 정리
Write-Host "📚 문서 파일 정리 중..." -ForegroundColor Yellow
$docDir = "docs-v1-1"
if (!(Test-Path $docDir)) {
    New-Item -ItemType Directory -Path $docDir
}

$docFiles = @(
    "README_V1_1_UPDATED.md",
    "FEATURES_V1_1_COMPLETE.md",
    "COMMUNITY_V1_1_PATCH_RELEASE_REPORT.md",
    "COMPREHENSIVE_FEATURE_AUDIT_REPORT.md"
)

foreach ($file in $docFiles) {
    if (Test-Path $file) {
        Copy-Item $file "$docDir/" -Force
        Write-Host "  📚 $file → docs-v1-1/" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🎉 파일 정리 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 정리 결과:" -ForegroundColor Cyan
Write-Host "  📁 아카이브: archive-v1-1/" -ForegroundColor White
Write-Host "  📚 문서: docs-v1-1/" -ForegroundColor White
Write-Host "  🗑️ 임시 파일 삭제 완료" -ForegroundColor White
Write-Host "  📜 사용하지 않는 스크립트 아카이브" -ForegroundColor White
Write-Host ""
Write-Host "✨ 프로젝트가 깔끔하게 정리되었습니다!" -ForegroundColor Green
