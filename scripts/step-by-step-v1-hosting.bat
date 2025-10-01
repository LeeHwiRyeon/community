@echo off
REM Community Platform 2.0 v1 호스팅 단계별 진행 스크립트
echo ========================================
echo Community Platform 2.0 v1 호스팅 시작!
echo ========================================
echo.

echo [단계 1/4] GCP CLI 설치 확인...
gcloud version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ GCP CLI가 설치되지 않았습니다.
    echo.
    echo 📋 GCP CLI 설치 방법:
    echo 1. https://cloud.google.com/sdk/docs/install 접속
    echo 2. Windows용 설치 파일 다운로드
    echo 3. 설치 파일 실행하여 설치
    echo 4. 설치 완료 후 이 스크립트를 다시 실행
    echo.
    echo 또는 다음 명령어로 자동 설치:
    echo   scripts\quick-install-gcp.bat
    echo.
    pause
    exit /b 1
) else (
    echo ✅ GCP CLI가 설치되어 있습니다.
)

echo.
echo [단계 2/4] GCP CLI 초기화...
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
echo [단계 3/4] 무료 테스트 환경 구축...
echo Community Platform 2.0 v1 무료 테스트 환경을 구축합니다...
echo.
scripts\setup-gcp-free-test.bat community-platform-v1
if %errorlevel% neq 0 (
    echo ❌ 무료 테스트 환경 구축 실패
    pause
    exit /b 1
)
echo ✅ 무료 테스트 환경 구축 완료

echo.
echo [단계 4/4] 애플리케이션 배포...
echo Community Platform 2.0 v1을 배포합니다...
echo.
deploy-v1.bat
if %errorlevel% neq 0 (
    echo ❌ 애플리케이션 배포 실패
    pause
    exit /b 1
)
echo ✅ 애플리케이션 배포 완료

echo.
echo ========================================
echo 🎉 Community Platform 2.0 v1 호스팅 완료!
echo ========================================
echo.
echo 📊 구축된 환경:
echo   프로젝트: community-platform-v1
echo   인스턴스: community-platform-v1-vm (f1-micro - 무료)
echo   데이터베이스: community-platform-v1-db (db-f1-micro - 무료)
echo   Redis: community-platform-v1-redis (1GB - 무료)
echo.
echo 🌐 접속 URL:
echo   HTTP: http://[로드밸런서IP]
echo.
echo 🔧 유용한 명령어:
echo   SSH 접속: gcloud compute ssh community-platform-v1-vm --zone=asia-northeast3-a
echo   로그 확인: gcloud compute ssh community-platform-v1-vm --zone=asia-northeast3-a --command="pm2 logs"
echo   비용 확인: scripts\monitor-costs.bat community-platform-v1
echo.
echo 💰 비용 정보:
echo   현재 비용: $0 (무료 크레딧 사용)
echo   예상 월 비용: $0-5 (무료 등급 사용)
echo   크레딧 잔액: GCP 콘솔에서 확인 가능
echo.
echo 🎯 다음 단계:
echo   1. 웹사이트 접속하여 기능 테스트
echo   2. 90일간 무료로 개발 진행
echo   3. 릴리즈 v1 완성
echo   4. 실제 서비스 환경으로 전환
echo.

pause
