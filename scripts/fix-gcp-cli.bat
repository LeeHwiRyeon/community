@echo off
REM GCP CLI 설치 확인 및 수정 스크립트
echo ========================================
echo GCP CLI 설치 확인 및 수정
echo ========================================
echo.

echo [1/4] GCP CLI 설치 경로 확인...
echo.

REM 여러 경로 확인
if exist "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" (
    echo ✅ GCP CLI 발견: C:\Program Files (x86)\Google\Cloud SDK\
    set GCP_PATH=C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin
    goto :found
)

if exist "C:\Program Files\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" (
    echo ✅ GCP CLI 발견: C:\Program Files\Google\Cloud SDK\
    set GCP_PATH=C:\Program Files\Google\Cloud SDK\google-cloud-sdk\bin
    goto :found
)

if exist "%USERPROFILE%\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" (
    echo ✅ GCP CLI 발견: %USERPROFILE%\AppData\Local\Google\Cloud SDK\
    set GCP_PATH=%USERPROFILE%\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin
    goto :found
)

echo ❌ GCP CLI를 찾을 수 없습니다.
echo.
echo 📋 GCP CLI 재설치 방법:
echo 1. https://cloud.google.com/sdk/docs/install 접속
echo 2. Windows용 설치 파일 다운로드
echo 3. 설치 파일 실행하여 재설치
echo.
pause
exit /b 1

:found
echo.
echo [2/4] PATH 환경변수 설정...
setx PATH "%PATH%;%GCP_PATH%" /M
echo ✅ PATH 환경변수 설정 완료

echo.
echo [3/4] GCP CLI 버전 확인...
"%GCP_PATH%\gcloud.cmd" version
if %errorlevel% neq 0 (
    echo ❌ GCP CLI 실행 실패
    pause
    exit /b 1
)

echo.
echo [4/4] GCP CLI 초기화...
echo GCP CLI를 초기화합니다...
echo 브라우저가 열리면 Google 계정으로 로그인하세요.
echo.
"%GCP_PATH%\gcloud.cmd" init
if %errorlevel% neq 0 (
    echo ❌ GCP CLI 초기화 실패
    echo 수동으로 초기화하세요: "%GCP_PATH%\gcloud.cmd" init
    pause
    exit /b 1
)

echo.
echo ========================================
echo 🎉 GCP CLI 설정 완료!
echo ========================================
echo.
echo 다음 단계:
echo 1. 새 터미널을 열어주세요
echo 2. gcloud version 명령어로 확인
echo 3. node scripts/autoagents-v1-hosting.js 실행
echo.

pause
