@echo off
REM GCP CLI 설치 스크립트 (Windows)
echo ========================================
echo GCP CLI 설치 시작
echo ========================================
echo.

REM 1. Chocolatey 확인 및 설치
echo [1/4] Chocolatey 확인...
choco --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Chocolatey가 설치되지 않았습니다. 설치 중...
    powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
    if %errorlevel% neq 0 (
        echo ❌ Chocolatey 설치 실패
        echo 수동으로 GCP CLI를 설치하세요: https://cloud.google.com/sdk/docs/install
        pause
        exit /b 1
    )
    echo ✅ Chocolatey 설치 완료
) else (
    echo ✅ Chocolatey가 이미 설치되어 있습니다.
)

REM 2. GCP CLI 설치
echo.
echo [2/4] GCP CLI 설치...
choco install gcloudsdk -y
if %errorlevel% neq 0 (
    echo ❌ GCP CLI 설치 실패
    echo 수동으로 GCP CLI를 설치하세요: https://cloud.google.com/sdk/docs/install
    pause
    exit /b 1
)
echo ✅ GCP CLI 설치 완료

REM 3. PATH 환경변수 업데이트
echo.
echo [3/4] PATH 환경변수 업데이트...
setx PATH "%PATH%;C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin" /M
echo ✅ PATH 환경변수 업데이트 완료

REM 4. GCP CLI 초기화
echo.
echo [4/4] GCP CLI 초기화...
echo GCP CLI를 초기화합니다...
echo 브라우저가 열리면 Google 계정으로 로그인하세요.
echo.
gcloud init
if %errorlevel% neq 0 (
    echo ❌ GCP CLI 초기화 실패
    echo 수동으로 초기화하세요: gcloud init
    pause
    exit /b 1
)
echo ✅ GCP CLI 초기화 완료

echo.
echo ========================================
echo 🎉 GCP CLI 설치 완료!
echo ========================================
echo.
echo 다음 단계:
echo 1. 새 터미널을 열어주세요 (PATH 업데이트 적용)
echo 2. gcloud version 명령어로 확인
echo 3. scripts\setup-gcp-free-test.bat 실행
echo.

pause
