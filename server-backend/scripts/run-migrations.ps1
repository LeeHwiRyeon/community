# PowerShell 스크립트로 로컬에서 마이그레이션 실행

$ErrorActionPreference = "Stop"

Write-Host "🔄 데이터베이스 마이그레이션 시작..." -ForegroundColor Cyan

$env:DB_HOST = "localhost"
$env:DB_PORT = "3306"
$env:DB_USER = "root"
$env:DB_PASSWORD = "password1234"
$env:DB_NAME = "community"

# Docker MySQL 컨테이너가 실행 중인지 확인
Write-Host "🔍 MySQL 컨테이너 확인 중..." -ForegroundColor Yellow

$mysqlContainer = docker ps --filter "name=community-database" --format "{{.Names}}"

if (-not $mysqlContainer) {
    Write-Host "❌ MySQL 컨테이너가 실행되지 않았습니다." -ForegroundColor Red
    Write-Host "다음 명령으로 시작하세요: docker-compose up -d database" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ MySQL 컨테이너 실행 중: $mysqlContainer" -ForegroundColor Green

# 마이그레이션 파일 목록
$migrations = @(
    "add_online_status.sql",
    "add_moderator_tools.sql",
    "add_follow_system.sql",
    "add_bookmark_system.sql"
)

$migrationsPath = "C:\Users\hwi\Desktop\Projects\community\server-backend\migrations"

foreach ($migration in $migrations) {
    Write-Host "📝 실행 중: $migration" -ForegroundColor Cyan
    
    $migrationFile = Join-Path $migrationsPath $migration
    
    if (-not (Test-Path $migrationFile)) {
        Write-Host "❌ 파일을 찾을 수 없습니다: $migrationFile" -ForegroundColor Red
        exit 1
    }
    
    # Docker exec를 사용하여 마이그레이션 실행
    Get-Content $migrationFile | docker exec -i $mysqlContainer mysql -uroot -ppassword1234 community
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 완료: $migration" -ForegroundColor Green
    }
    else {
        Write-Host "❌ 실패: $migration" -ForegroundColor Red
        exit 1
    }
    
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "🎉 모든 마이그레이션 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 테이블 확인:" -ForegroundColor Cyan
docker exec -it $mysqlContainer mysql -uroot -ppassword1234 -e "USE community; SHOW TABLES;"
