# Community React Frontend Dev Server PowerShell Script
# 용도: React/Vite 프론트엔드 개발 서버 실행 (PowerShell 환경용)
# 사용법: .\frontend-start.ps1

# 스크립트 위치 기준으로 루트 디렉터리 설정
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$FrontendDir = Join-Path $RootDir "frontend"

Write-Host "===============================" -ForegroundColor Cyan
Write-Host "Community React Frontend Server" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host "Port: 5173 (Vite default)"
Write-Host "Directory: $FrontendDir"
Write-Host "Type: React + Vite + TypeScript"
Write-Host "===============================" -ForegroundColor Cyan

# 프론트엔드 디렉터리 존재 확인
if (-not (Test-Path $FrontendDir)) {
    Write-Error "프론트엔드 디렉터리를 찾을 수 없습니다: $FrontendDir"
    Read-Host "Press Enter to exit"
    exit 1
}

# 디렉터리 변경
Set-Location $FrontendDir

# package.json 존재 확인
$PackageJsonPath = Join-Path $FrontendDir "package.json"
if (-not (Test-Path $PackageJsonPath)) {
    Write-Error "React 앱 설정 파일이 없습니다: package.json"
    Read-Host "Press Enter to exit"
    exit 1
}

# node_modules가 없으면 설치
$NodeModulesPath = Join-Path $FrontendDir "node_modules"
if (-not (Test-Path $NodeModulesPath)) {
    Write-Host "[INFO] 의존성 설치 중..." -ForegroundColor Yellow
    try {
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed"
        }
    }
    catch {
        Write-Error "의존성 설치 실패: $_"
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "[INFO] React 개발 서버 시작 중..." -ForegroundColor Green

try {
    # React/Vite 개발 서버 실행
    npm run dev
}
catch {
    Write-Error "React 서버 시작 실패: $_"
    Read-Host "Press Enter to exit"
    exit 1
}

Read-Host "Press Enter to exit"