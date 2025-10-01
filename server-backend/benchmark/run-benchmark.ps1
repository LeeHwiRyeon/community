# C# .NET vs Node.js 성능 벤치마크 실행 스크립트

param(
    [string]$ServerUrl = "http://localhost:50000",
    [int]$Duration = 30,
    [int[]]$ConcurrentUsers = @(10, 50, 100, 200, 500),
    [switch]$Help
)

if ($Help) {
    Write-Host "C# .NET vs Node.js 성능 벤치마크 실행 스크립트" -ForegroundColor Green
    Write-Host ""
    Write-Host "사용법:" -ForegroundColor Yellow
    Write-Host "  .\run-benchmark.ps1 [-ServerUrl <URL>] [-Duration <초>] [-ConcurrentUsers <배열>] [-Help]"
    Write-Host ""
    Write-Host "매개변수:" -ForegroundColor Yellow
    Write-Host "  -ServerUrl        테스트할 서버 URL (기본값: http://localhost:50000)"
    Write-Host "  -Duration         테스트 지속 시간 (초) (기본값: 30)"
    Write-Host "  -ConcurrentUsers  동시 사용자 수 배열 (기본값: 10,50,100,200,500)"
    Write-Host "  -Help             이 도움말 표시"
    Write-Host ""
    Write-Host "예시:" -ForegroundColor Yellow
    Write-Host "  .\run-benchmark.ps1"
    Write-Host "  .\run-benchmark.ps1 -Duration 60 -ConcurrentUsers @(20, 100, 500)"
    Write-Host "  .\run-benchmark.ps1 -ServerUrl http://localhost:3000"
    exit 0
}

Write-Host "🔬 C# .NET vs Node.js 성능 벤치마크 테스트" -ForegroundColor Green
Write-Host "=" * 80

# Node.js 버전 확인
Write-Host "🔍 Node.js 버전 확인 중..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js가 설치되어 있지 않습니다." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js 버전: $nodeVersion" -ForegroundColor Green

# 서버 상태 확인
Write-Host "🔍 서버 상태 확인 중..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$ServerUrl/api/health" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ 서버가 정상적으로 응답합니다." -ForegroundColor Green
    }
    else {
        Write-Host "❌ 서버 응답 오류: $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ 서버에 연결할 수 없습니다: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 서버가 실행 중인지 확인하세요: npm run start" -ForegroundColor Yellow
    exit 1
}

# 벤치마크 스크립트 실행
Write-Host "🚀 벤치마크 테스트 시작..." -ForegroundColor Green
Write-Host "  서버 URL: $ServerUrl" -ForegroundColor Cyan
Write-Host "  테스트 지속 시간: $Duration초" -ForegroundColor Cyan
Write-Host "  동시 사용자 수: $($ConcurrentUsers -join ', ')" -ForegroundColor Cyan

# 환경 변수 설정
$env:BENCHMARK_SERVER_URL = $ServerUrl
$env:BENCHMARK_DURATION = $Duration
$env:BENCHMARK_CONCURRENT_USERS = $ConcurrentUsers -join ','

# 벤치마크 실행
try {
    node benchmark/csharp-vs-nodejs-benchmark.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "🎉 벤치마크 테스트가 성공적으로 완료되었습니다!" -ForegroundColor Green
    }
    else {
        Write-Host "❌ 벤치마크 테스트 실행 중 오류가 발생했습니다." -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ 벤치마크 스크립트 실행 실패: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 결과 파일 확인
$resultFiles = Get-ChildItem -Path "." -Filter "benchmark-results-*.json" | Sort-Object LastWriteTime -Descending
if ($resultFiles.Count -gt 0) {
    $latestResult = $resultFiles[0]
    Write-Host "📊 최신 결과 파일: $($latestResult.Name)" -ForegroundColor Cyan
    
    # 결과 요약 표시
    try {
        $resultData = Get-Content $latestResult.FullName | ConvertFrom-Json
        Write-Host ""
        Write-Host "📈 성능 개선 효과 요약:" -ForegroundColor Yellow
        Write-Host "  응답 시간 개선: $($resultData.improvements.responseTimeImprovement)" -ForegroundColor Green
        Write-Host "  처리량 향상: $($resultData.improvements.throughputImprovement)" -ForegroundColor Green
        Write-Host "  메모리 절약: $($resultData.improvements.memorySaving)" -ForegroundColor Green
        Write-Host "  에러율 감소: $($resultData.improvements.errorRateReduction)" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️ 결과 파일을 읽을 수 없습니다." -ForegroundColor Yellow
    }
}
else {
    Write-Host "⚠️ 결과 파일을 찾을 수 없습니다." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "💡 추가 정보:" -ForegroundColor Cyan
Write-Host "  - 상세한 결과는 JSON 파일을 확인하세요." -ForegroundColor White
Write-Host "  - C# .NET 마이그레이션 계획은 docs/microservices-architecture-design.md를 참조하세요." -ForegroundColor White
Write-Host "  - 성능 최적화 계획은 docs/performance-optimization-plan.md를 참조하세요." -ForegroundColor White

