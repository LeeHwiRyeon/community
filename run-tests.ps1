# Social Features Test Runner
# 소셜 기능 테스트 실행 스크립트

Write-Host "🧪 Social Features Test Suite" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# 환경 변수 설정
$env:NODE_ENV = "test"

# 테스트 디렉토리로 이동
Set-Location -Path "$PSScriptRoot\server-backend"

Write-Host "📦 Step 1: Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "🗄️  Step 2: Checking test database..." -ForegroundColor Yellow
Write-Host "Make sure 'community_test' database exists in MySQL" -ForegroundColor Gray
Write-Host ""

# 테스트 옵션 선택
Write-Host "Select test type:" -ForegroundColor Green
Write-Host "1. All tests (전체 테스트)" -ForegroundColor White
Write-Host "2. Unit tests only (단위 테스트만)" -ForegroundColor White
Write-Host "3. Integration tests only (통합 테스트만)" -ForegroundColor White
Write-Host "4. Block service tests (차단 서비스)" -ForegroundColor White
Write-Host "5. Follow service tests (팔로우 서비스)" -ForegroundColor White
Write-Host "6. Coverage report (커버리지 리포트)" -ForegroundColor White
Write-Host "7. Watch mode (감시 모드)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-7)"

Write-Host ""
Write-Host "🚀 Step 3: Running tests..." -ForegroundColor Yellow
Write-Host ""

switch ($choice) {
    "1" {
        Write-Host "Running all tests..." -ForegroundColor Cyan
        npm test
    }
    "2" {
        Write-Host "Running unit tests..." -ForegroundColor Cyan
        npm test -- "src/services/__tests__"
    }
    "3" {
        Write-Host "Running integration tests..." -ForegroundColor Cyan
        npm test -- "tests/social-features.test.js"
    }
    "4" {
        Write-Host "Running block service tests..." -ForegroundColor Cyan
        npm test -- "block-service.test.js"
    }
    "5" {
        Write-Host "Running follow service tests..." -ForegroundColor Cyan
        npm test -- "follow-service.test.js"
    }
    "6" {
        Write-Host "Generating coverage report..." -ForegroundColor Cyan
        npm test -- --coverage
        Write-Host ""
        Write-Host "📊 Coverage report generated in coverage/ directory" -ForegroundColor Green
    }
    "7" {
        Write-Host "Starting watch mode..." -ForegroundColor Cyan
        Write-Host "Press Ctrl+C to exit" -ForegroundColor Gray
        npm test -- --watch
    }
    default {
        Write-Host "Invalid choice. Running all tests..." -ForegroundColor Yellow
        npm test
    }
}

Write-Host ""
Write-Host "✅ Test run completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 For more information, see TESTING_GUIDE.md" -ForegroundColor Cyan

# 원래 디렉토리로 복귀
Set-Location -Path $PSScriptRoot
