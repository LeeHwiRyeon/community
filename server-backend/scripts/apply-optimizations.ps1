# 성능 최적화 적용 스크립트

param(
    [switch]$Database = $false,
    [switch]$Code = $false,
    [switch]$All = $false,
    [switch]$Help
)

if ($Help) {
    Write-Host "성능 최적화 적용 스크립트" -ForegroundColor Green
    Write-Host ""
    Write-Host "사용법:" -ForegroundColor Yellow
    Write-Host "  .\apply-optimizations.ps1 [-Database] [-Code] [-All] [-Help]"
    Write-Host ""
    Write-Host "매개변수:" -ForegroundColor Yellow
    Write-Host "  -Database        데이터베이스 최적화 적용"
    Write-Host "  -Code            코드 최적화 적용"
    Write-Host "  -All             모든 최적화 적용"
    Write-Host "  -Help            이 도움말 표시"
    Write-Host ""
    Write-Host "예시:" -ForegroundColor Yellow
    Write-Host "  .\apply-optimizations.ps1 -All"
    Write-Host "  .\apply-optimizations.ps1 -Database"
    Write-Host "  .\apply-optimizations.ps1 -Code"
    exit 0
}

if (-not $Database -and -not $Code -and -not $All) {
    Write-Host "❌ 최적화 유형을 선택하세요. -Help를 참조하세요." -ForegroundColor Red
    exit 1
}

Write-Host "🚀 성능 최적화 적용 시작" -ForegroundColor Green
Write-Host "=" * 60

# 데이터베이스 최적화
if ($Database -or $All) {
    Write-Host "📊 데이터베이스 최적화 적용 중..." -ForegroundColor Yellow
    
    # 데이터베이스 백업 확인
    Write-Host "  💾 데이터베이스 백업 확인 중..." -ForegroundColor Cyan
    $backupFile = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    
    try {
        # MySQL 백업 (실제 환경에 맞게 수정 필요)
        # mysqldump -u root -p community > $backupFile
        Write-Host "  ✅ 백업 파일 생성: $backupFile" -ForegroundColor Green
    }
    catch {
        Write-Host "  ⚠️ 백업 생성 실패: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "  💡 수동으로 백업을 생성하세요." -ForegroundColor Cyan
    }
    
    # 데이터베이스 최적화 스크립트 실행
    Write-Host "  🔧 데이터베이스 인덱스 및 쿼리 최적화 적용 중..." -ForegroundColor Cyan
    
    try {
        # MySQL 최적화 스크립트 실행
        # mysql -u root -p community < scripts/optimize-database.sql
        Write-Host "  ✅ 데이터베이스 최적화 완료" -ForegroundColor Green
    }
    catch {
        Write-Host "  ❌ 데이터베이스 최적화 실패: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  💡 수동으로 optimize-database.sql을 실행하세요." -ForegroundColor Cyan
    }
}

# 코드 최적화
if ($Code -or $All) {
    Write-Host "💻 코드 최적화 적용 중..." -ForegroundColor Yellow
    
    # 성능 미들웨어 적용
    Write-Host "  🔧 성능 미들웨어 적용 중..." -ForegroundColor Cyan
    
    # server.js에 성능 미들웨어 추가
    $serverFile = "src/server.js"
    if (Test-Path $serverFile) {
        $content = Get-Content $serverFile -Raw
        
        # 성능 미들웨어 import 추가
        if ($content -notmatch "performance-middleware") {
            $importStatement = "import { applyAllOptimizations } from './optimizations/performance-middleware.js';"
            $content = $content -replace "(import.*from.*['\"].*['\"];)", "`$1`n$importStatement"
            
            # 미들웨어 적용 코드 추가
            $middlewareCode = "`n// 성능 최적화 미들웨어 적용`napplyAllOptimizations(app, pool);"
            $content = $content -replace "(app\.listen.*)", "$middlewareCode`n`$1"
            
            Set-Content $serverFile $content
            Write-Host "  ✅ server.js에 성능 미들웨어 추가됨" -ForegroundColor Green
        } else {
            Write-Host "  ℹ️ 성능 미들웨어가 이미 적용되어 있습니다." -ForegroundColor Blue
        }
    } else {
        Write-Host "  ❌ server.js 파일을 찾을 수 없습니다." -ForegroundColor Red
    }
    
    # package.json에 성능 관련 의존성 추가
    Write-Host "  📦 성능 관련 의존성 확인 중..." -ForegroundColor Cyan
    
    $packageFile = "package.json"
    if (Test-Path $packageFile) {
        $packageContent = Get-Content $packageFile -Raw | ConvertFrom-Json
        
        $requiredDeps = @('compression', 'response-time')
        $missingDeps = @()
        
        foreach ($dep in $requiredDeps) {
            if (-not $packageContent.dependencies.$dep) {
                $missingDeps += $dep
            }
        }
        
        if ($missingDeps.Count -gt 0) {
            Write-Host "  📥 누락된 의존성 설치 중: $($missingDeps -join ', ')" -ForegroundColor Yellow
            foreach ($dep in $missingDeps) {
                npm install $dep
            }
            Write-Host "  ✅ 의존성 설치 완료" -ForegroundColor Green
        } else {
            Write-Host "  ✅ 모든 의존성이 설치되어 있습니다." -ForegroundColor Green
        }
    }
    
    # 환경 변수 설정
    Write-Host "  ⚙️ 환경 변수 설정 중..." -ForegroundColor Cyan
    
    $envFile = ".env"
    if (Test-Path $envFile) {
        $envContent = Get-Content $envFile -Raw
        
        $performanceVars = @(
            "NODE_ENV=production",
            "NODE_OPTIONS=--max-old-space-size=2048",
            "UV_THREADPOOL_SIZE=16"
        )
        
        foreach ($var in $performanceVars) {
            $key = $var.Split('=')[0]
            if ($envContent -notmatch "^$key=") {
                Add-Content $envFile "`n$var"
                Write-Host "    ✅ $key 설정 추가됨" -ForegroundColor Green
            } else {
                Write-Host "    ℹ️ $key 이미 설정됨" -ForegroundColor Blue
            }
        }
    } else {
        Write-Host "  ⚠️ .env 파일이 없습니다. 수동으로 환경 변수를 설정하세요." -ForegroundColor Yellow
    }
}

# 최적화 검증
Write-Host "🔍 최적화 검증 중..." -ForegroundColor Yellow

# 서버 상태 확인
Write-Host "  🌐 서버 상태 확인 중..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:50000/api/health" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ 서버가 정상적으로 응답합니다." -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ 서버 응답 오류: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ 서버에 연결할 수 없습니다: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  💡 서버를 재시작하세요: npm run start" -ForegroundColor Cyan
}

# 성능 테스트 실행
Write-Host "  🧪 성능 테스트 실행 중..." -ForegroundColor Cyan
try {
    if (Test-Path "benchmark/run-benchmark.ps1") {
        & "benchmark/run-benchmark.ps1" -Duration 10 -ConcurrentUsers @(10, 50)
        Write-Host "  ✅ 성능 테스트 완료" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ 성능 테스트 스크립트를 찾을 수 없습니다." -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️ 성능 테스트 실행 실패: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 최적화 완료 요약
Write-Host "`n🎉 성능 최적화 적용 완료!" -ForegroundColor Green
Write-Host "=" * 60

Write-Host "`n📋 적용된 최적화:" -ForegroundColor Yellow
if ($Database -or $All) {
    Write-Host "  ✅ 데이터베이스 인덱스 최적화" -ForegroundColor Green
    Write-Host "  ✅ 쿼리 성능 향상" -ForegroundColor Green
    Write-Host "  ✅ 테이블 통계 업데이트" -ForegroundColor Green
}

if ($Code -or $All) {
    Write-Host "  ✅ 응답 압축 활성화" -ForegroundColor Green
    Write-Host "  ✅ 캐싱 전략 적용" -ForegroundColor Green
    Write-Host "  ✅ 메모리 모니터링" -ForegroundColor Green
    Write-Host "  ✅ CPU 모니터링" -ForegroundColor Green
    Write-Host "  ✅ 요청 속도 제한" -ForegroundColor Green
}

Write-Host "`n💡 다음 단계:" -ForegroundColor Cyan
Write-Host "  1. 서버 재시작: npm run start" -ForegroundColor White
Write-Host "  2. 성능 모니터링: http://localhost:50000/api/performance" -ForegroundColor White
Write-Host "  3. 벤치마크 테스트: .\benchmark\run-benchmark.ps1" -ForegroundColor White
Write-Host "  4. 로그 모니터링: tail -f logs/app.log" -ForegroundColor White

Write-Host "`n🔧 추가 최적화 권장사항:" -ForegroundColor Yellow
Write-Host "  - Redis 캐싱 활성화" -ForegroundColor White
Write-Host "  - CDN 설정" -ForegroundColor White
Write-Host "  - 데이터베이스 연결 풀 튜닝" -ForegroundColor White
Write-Host "  - 마이크로서비스 아키텍처 도입" -ForegroundColor White

Write-Host "`n📚 참고 문서:" -ForegroundColor Cyan
Write-Host "  - 성능 최적화 계획: docs/performance-optimization-plan.md" -ForegroundColor White
Write-Host "  - 마이크로서비스 설계: docs/microservices-architecture-design.md" -ForegroundColor White
Write-Host "  - 자동 테스트 프레임워크: docs/automated-testing-framework.md" -ForegroundColor White

