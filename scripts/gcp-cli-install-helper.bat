@echo off
REM GCP CLI 설치 도우미 스크립트
echo ========================================
echo GCP CLI 설치 도우미
echo ========================================
echo.

echo [1/4] GCP CLI 다운로드...
echo GCP CLI 설치 파일을 다운로드합니다...
echo.

REM GCP CLI 다운로드
echo 다운로드 중... 잠시만 기다려주세요.
powershell -Command "Invoke-WebRequest -Uri 'https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe' -OutFile 'GoogleCloudSDKInstaller.exe'"

if not exist "GoogleCloudSDKInstaller.exe" (
    echo ❌ 다운로드 실패
    echo.
    echo 📋 수동 다운로드 방법:
    echo 1. https://cloud.google.com/sdk/docs/install 접속
    echo 2. Windows용 설치 파일 다운로드
    echo 3. 설치 파일을 이 폴더에 저장
    echo.
    pause
    exit /b 1
)

echo ✅ 다운로드 완료

echo.
echo [2/4] 설치 파일 실행...
echo GCP CLI 설치 프로그램을 실행합니다...
echo 설치 마법사를 따라 진행하세요.
echo.

start /wait GoogleCloudSDKInstaller.exe

echo ✅ 설치 완료

echo.
echo [3/4] 설치 확인...
echo 새 터미널을 열어서 다음 명령어를 실행하세요:
echo   gcloud version
echo.

REM 설치 파일 정리
del GoogleCloudSDKInstaller.exe

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
echo 1. 새 터미널을 열어주세요
echo 2. gcloud version 명령어로 확인
echo 3. node scripts/autoagents-v1-hosting.js 실행
echo.

pause
