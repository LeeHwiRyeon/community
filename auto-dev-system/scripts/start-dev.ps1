# 자동 개발 시스템 개발 환경 시작 스크립트

Write-Host "🚀 자동 개발 시스템 개발 환경을 시작합니다..." -ForegroundColor Green

# 환경 변수 확인
if (-not $env:OPENAI_API_KEY) {
    Write-Host "❌ OPENAI_API_KEY 환경 변수가 설정되지 않았습니다." -ForegroundColor Red
    Write-Host "env.example 파일을 참조하여 .env 파일을 생성하고 API 키를 설정하세요." -ForegroundColor Yellow
    exit 1
}

# Node.js 버전 확인
$nodeVersion = node --version
Write-Host "📦 Node.js 버전: $nodeVersion" -ForegroundColor Cyan

# 의존성 설치
Write-Host "📥 의존성을 설치합니다..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 의존성 설치에 실패했습니다." -ForegroundColor Red
    exit 1
}

# TypeScript 컴파일
Write-Host "🔨 TypeScript를 컴파일합니다..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScript 컴파일에 실패했습니다." -ForegroundColor Red
    exit 1
}

# 개발 서버 시작
Write-Host "🚀 개발 서버를 시작합니다..." -ForegroundColor Green
Write-Host "📊 대시보드: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔗 API: http://localhost:3000/api" -ForegroundColor Cyan
Write-Host "❤️  헬스 체크: http://localhost:3000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "서버를 중지하려면 Ctrl+C를 누르세요." -ForegroundColor Yellow

npm run dev
