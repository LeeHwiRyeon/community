@echo off
REM GCP CLI 빠른 설치 스크립트
echo ========================================
echo GCP CLI 빠른 설치
echo ========================================
echo.

echo [1/3] GCP CLI 다운로드...
echo GCP CLI를 다운로드합니다...
echo.

REM GCP CLI 다운로드
powershell -Command "Invoke-WebRequest -Uri 'https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe' -OutFile 'GoogleCloudSDKInstaller.exe'"

if not exist "GoogleCloudSDKInstaller.exe" (
    echo ❌ 다운로드 실패
    echo 수동으로 설치하세요: https://cloud.google.com/sdk/docs/install
    pause
    exit /b 1
)

echo ✅ 다운로드 완료

echo.
echo [2/3] GCP CLI 설치...
echo 설치 프로그램을 실행합니다...
echo 설치 마법사를 따라 진행하세요.
echo.

start /wait GoogleCloudSDKInstaller.exe

echo ✅ 설치 완료

echo.
echo [3/3] 설치 확인...
echo 새 터미널을 열어서 다음 명령어를 실행하세요:
echo   gcloud version
echo   gcloud init
echo.

echo ========================================
echo 🎉 GCP CLI 설치 완료!
echo ========================================
echo.
echo 다음 단계:
echo 1. 새 터미널을 열어주세요
echo 2. gcloud version 명령어로 확인
echo 3. gcloud init 명령어로 초기화
echo 4. scripts\setup-gcp-free-test.bat 실행
echo.

REM 설치 파일 정리
del GoogleCloudSDKInstaller.exe

pause
