# PostgreSQL 설치 및 설정 스크립트 (Windows PowerShell)

Write-Host "🐘 PostgreSQL 설치 및 설정을 시작합니다..." -ForegroundColor Green

# PostgreSQL 다운로드 URL
$postgresqlUrl = "https://get.enterprisedb.com/postgresql/postgresql-15.4-1-windows-x64.exe"
$installerPath = "$env:TEMP\postgresql-installer.exe"

# Chocolatey를 통한 PostgreSQL 설치 (권장)
Write-Host "📦 Chocolatey를 통한 PostgreSQL 설치를 시도합니다..." -ForegroundColor Yellow

try {
    # Chocolatey 설치 확인
    if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Host "Chocolatey가 설치되어 있지 않습니다. 설치를 진행합니다..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    }

    # PostgreSQL 설치
    Write-Host "PostgreSQL을 설치합니다..." -ForegroundColor Yellow
    choco install postgresql --version=15.4 -y

    Write-Host "✅ PostgreSQL이 성공적으로 설치되었습니다!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Chocolatey 설치에 실패했습니다. 수동 설치를 진행합니다..." -ForegroundColor Red
    
    # 수동 다운로드 및 설치
    Write-Host "PostgreSQL 설치 파일을 다운로드합니다..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $postgresqlUrl -OutFile $installerPath
    
    Write-Host "PostgreSQL 설치를 실행합니다..." -ForegroundColor Yellow
    Start-Process -FilePath $installerPath -ArgumentList "--mode unattended --superpassword postgres --servicename postgresql --serviceaccount postgres --servicepassword postgres" -Wait
    
    # 임시 파일 삭제
    Remove-Item $installerPath -Force
}

# PostgreSQL 서비스 시작
Write-Host "🔄 PostgreSQL 서비스를 시작합니다..." -ForegroundColor Yellow
Start-Service postgresql

# 환경 변수 설정
Write-Host "🔧 환경 변수를 설정합니다..." -ForegroundColor Yellow
$env:PATH += ";C:\Program Files\PostgreSQL\15\bin"
[Environment]::SetEnvironmentVariable("PATH", $env:PATH, [EnvironmentVariableTarget]::Machine)

# 데이터베이스 생성
Write-Host "🗄️ 데이터베이스를 생성합니다..." -ForegroundColor Yellow
$env:PGPASSWORD = "postgres"
& "C:\Program Files\PostgreSQL\15\bin\createdb.exe" -U postgres -h localhost news_paper_vip

# 데이터베이스 연결 테스트
Write-Host "🔍 데이터베이스 연결을 테스트합니다..." -ForegroundColor Yellow
$testQuery = "SELECT version();"
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -h localhost -d news_paper_vip -c $testQuery

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 데이터베이스 연결이 성공했습니다!" -ForegroundColor Green
}
else {
    Write-Host "❌ 데이터베이스 연결에 실패했습니다." -ForegroundColor Red
    exit 1
}

# Redis 설치 (선택사항)
Write-Host "🔴 Redis 설치를 시도합니다..." -ForegroundColor Yellow
try {
    choco install redis-64 -y
    Start-Service redis
    Write-Host "✅ Redis가 성공적으로 설치되었습니다!" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ Redis 설치에 실패했습니다. 수동으로 설치해주세요." -ForegroundColor Yellow
}

# Node.js 의존성 설치
Write-Host "📦 Node.js 의존성을 설치합니다..." -ForegroundColor Yellow
Set-Location "server-backend/api-server"
npm install

# 데이터베이스 마이그레이션 실행
Write-Host "🔄 데이터베이스 마이그레이션을 실행합니다..." -ForegroundColor Yellow
npm run migrate

Write-Host "🎉 PostgreSQL 설정이 완료되었습니다!" -ForegroundColor Green
Write-Host "📋 다음 단계:" -ForegroundColor Cyan
Write-Host "1. API 서버 실행: npm run dev" -ForegroundColor White
Write-Host "2. 브라우저에서 http://localhost:3001/api/health 확인" -ForegroundColor White
Write-Host "3. API 문서: http://localhost:3001/api/docs" -ForegroundColor White

Write-Host "`n🔑 기본 계정 정보:" -ForegroundColor Cyan
Write-Host "Owner: admin@newspaper-vip.com / admin123!" -ForegroundColor White
Write-Host "VIP: vip@newspaper-vip.com / vip123!" -ForegroundColor White
Write-Host "Streamer: streamer@newspaper-vip.com / streamer123!" -ForegroundColor White
Write-Host "Cosplayer: cosplayer@newspaper-vip.com / cosplayer123!" -ForegroundColor White
Write-Host "Manager: manager@newspaper-vip.com / manager123!" -ForegroundColor White
Write-Host "User: user@newspaper-vip.com / user123!" -ForegroundColor White
