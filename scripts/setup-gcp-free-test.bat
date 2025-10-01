@echo off
REM Community Platform 2.0 GCP 무료 테스트 환경 구축 스크립트 (Windows Batch)
REM 사용법: scripts\setup-gcp-free-test.bat community-platform-v1

setlocal enabledelayedexpansion

set PROJECT_ID=%1
if "%PROJECT_ID%"=="" set PROJECT_ID=community-platform-v1

echo.
echo ========================================
echo Community Platform 2.0 v1 호스팅 시작!
echo ========================================
echo 프로젝트 ID: %PROJECT_ID%
echo.

REM 1. GCP CLI 확인
echo [1/8] GCP CLI 확인...
gcloud version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ GCP CLI가 설치되지 않았습니다.
    echo 다음 링크에서 설치하세요: https://cloud.google.com/sdk/docs/install
    pause
    exit /b 1
)
echo ✅ GCP CLI 확인 완료

REM 2. GCP 프로젝트 생성
echo.
echo [2/8] GCP 프로젝트 생성...
gcloud projects create %PROJECT_ID% --name="Community Platform v1"
gcloud config set project %PROJECT_ID%
if %errorlevel% neq 0 (
    echo ❌ 프로젝트 생성 실패
    pause
    exit /b 1
)
echo ✅ 프로젝트 생성 완료

REM 3. 결제 계정 연결 확인
echo.
echo ⚠️ 결제 계정 연결이 필요합니다.
echo GCP 콘솔에서 결제 계정을 연결하세요:
echo https://console.cloud.google.com/billing/linkedaccount?project=%PROJECT_ID%
echo.
set /p confirmation="결제 계정 연결을 완료했습니까? (y/N): "
if /i not "%confirmation%"=="y" (
    echo ❌ 결제 계정 연결이 필요합니다.
    pause
    exit /b 1
)

REM 4. API 활성화
echo.
echo [3/8] API 활성화...
gcloud services enable compute.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable redis.googleapis.com
gcloud services enable dns.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
echo ✅ API 활성화 완료

REM 5. VPC 네트워크 생성
echo.
echo [4/8] VPC 네트워크 생성...
gcloud compute networks create community-platform-v1-vpc --subnet-mode=custom
gcloud compute networks subnets create community-platform-v1-subnet --network=community-platform-v1-vpc --range=10.0.0.0/24 --region=asia-northeast3
echo ✅ VPC 네트워크 생성 완료

REM 6. 방화벽 규칙 생성
echo.
echo [5/8] 방화벽 규칙 생성...
gcloud compute firewall-rules create allow-http --network=community-platform-v1-vpc --allow=tcp:80 --source-ranges=0.0.0.0/0 --target-tags=http-server
gcloud compute firewall-rules create allow-https --network=community-platform-v1-vpc --allow=tcp:443 --source-ranges=0.0.0.0/0 --target-tags=https-server
gcloud compute firewall-rules create allow-ssh --network=community-platform-v1-vpc --allow=tcp:22 --source-ranges=0.0.0.0/0 --target-tags=ssh-server
gcloud compute firewall-rules create allow-app --network=community-platform-v1-vpc --allow=tcp:3000 --source-ranges=0.0.0.0/0 --target-tags=app-server
echo ✅ 방화벽 규칙 생성 완료

REM 7. SSH 키 생성
echo.
echo [6/8] SSH 키 생성...
if not exist "%USERPROFILE%\.ssh\gcp_rsa" (
    ssh-keygen -t rsa -b 4096 -f "%USERPROFILE%\.ssh\gcp_rsa" -N ""
)
echo ✅ SSH 키 생성 완료

REM 8. Compute Engine 인스턴스 생성
echo.
echo [7/8] Compute Engine 인스턴스 생성...
for /f %%i in ('type "%USERPROFILE%\.ssh\gcp_rsa.pub"') do set SSH_KEY=%%i
gcloud compute instances create community-platform-v1-vm --zone=asia-northeast3-a --machine-type=f1-micro --network-interface=subnet=community-platform-v1-subnet,no-address --maintenance-policy=MIGRATE --provisioning-model=STANDARD --service-account=default --scopes=https://www.googleapis.com/auth/cloud-platform --create-disk=auto-delete=yes,boot=yes,device-name=community-platform-v1-vm,image=projects/ubuntu-os-cloud/global/images/family/ubuntu-2004-lts,mode=rw,size=30,type=projects/%PROJECT_ID%/zones/asia-northeast3-a/diskTypes/pd-standard --metadata-from-file=ssh-keys=<(echo ubuntu:!SSH_KEY!) --tags=http-server,https-server,ssh-server,app-server
echo ✅ Compute Engine 인스턴스 생성 완료

REM 9. Cloud SQL 인스턴스 생성
echo.
echo [8/8] Cloud SQL 인스턴스 생성...
gcloud sql instances create community-platform-v1-db --database-version=MYSQL_8_0 --tier=db-f1-micro --region=asia-northeast3 --storage-type=HDD --storage-size=10GB --storage-auto-increase --backup-start-time=03:00 --enable-bin-log --network=projects/%PROJECT_ID%/global/networks/community-platform-v1-vpc
gcloud sql databases create community_platform --instance=community-platform-v1-db
gcloud sql users create app_user --instance=community-platform-v1-db --password=test_password_123
echo ✅ Cloud SQL 인스턴스 생성 완료

REM 10. Memorystore 인스턴스 생성
echo.
echo [9/10] Memorystore 인스턴스 생성...
gcloud redis instances create community-platform-v1-redis --size=1 --region=asia-northeast3 --network=projects/%PROJECT_ID%/global/networks/community-platform-v1-vpc
echo ✅ Memorystore 인스턴스 생성 완료

REM 11. 로드 밸런서 생성
echo.
echo [10/10] 로드 밸런서 생성...
gcloud compute instance-groups unmanaged create community-platform-v1-ig --zone=asia-northeast3-a
gcloud compute instance-groups unmanaged add-instances community-platform-v1-ig --instances=community-platform-v1-vm --zone=asia-northeast3-a
gcloud compute health-checks create http community-platform-v1-health-check --port=3000 --request-path=/api/health
gcloud compute backend-services create community-platform-v1-backend --protocol=HTTP --port-name=http --health-checks=community-platform-v1-health-check --global
gcloud compute backend-services add-backend community-platform-v1-backend --instance-group=community-platform-v1-ig --instance-group-zone=asia-northeast3-a --global
gcloud compute url-maps create community-platform-v1-url-map --default-service=community-platform-v1-backend
gcloud compute target-http-proxies create community-platform-v1-http-proxy --url-map=community-platform-v1-url-map
gcloud compute addresses create community-platform-v1-ip --global
for /f %%i in ('gcloud compute addresses describe community-platform-v1-ip --global --format="value(address)"') do set LB_IP=%%i
gcloud compute forwarding-rules create community-platform-v1-http-rule --global --target-http-proxy=community-platform-v1-http-proxy --address=%LB_IP% --ports=80
echo ✅ 로드 밸런서 생성 완료

REM 12. 비용 모니터링 설정
echo.
echo 💰 비용 모니터링 설정...
for /f %%i in ('gcloud billing accounts list --format="value(name)" --limit=1') do set BILLING_ACCOUNT=%%i
gcloud billing budgets create --billing-account=%BILLING_ACCOUNT% --display-name="Community Platform v1 Budget" --budget-amount=10USD --threshold-rule=percent=50 --threshold-rule=percent=90 --threshold-rule=percent=100
echo ✅ 비용 모니터링 설정 완료

REM 13. 완료 메시지
echo.
echo ========================================
echo 🎉 Community Platform 2.0 v1 호스팅 완료!
echo ========================================
echo.
echo 📊 구축된 환경:
echo   프로젝트 ID: %PROJECT_ID%
echo   인스턴스: community-platform-v1-vm (f1-micro - 무료)
echo   데이터베이스: community-platform-v1-db (db-f1-micro - 무료)
echo   Redis: community-platform-v1-redis (1GB - 무료)
echo   로드 밸런서: community-platform-v1-ip
echo.
echo 🌐 접속 URL:
echo   HTTP: http://%LB_IP%
echo.
echo 🔧 다음 단계:
echo   1. 배포 실행: scripts\deploy-free-test.bat %PROJECT_ID%
echo   2. 애플리케이션 확인: http://%LB_IP%
echo   3. 비용 모니터링: https://console.cloud.google.com/billing
echo.
echo ⚠️ 주의사항:
echo   - 무료 크레딧 사용 중입니다
echo   - 90일 후 자동으로 유료 전환됩니다
echo   - 예산 알림이 설정되어 있습니다
echo   - 테스트 완료 후 리소스를 삭제하세요
echo.

REM 14. 배포 스크립트 생성
echo 📝 배포 스크립트 생성...
(
echo @echo off
echo REM Community Platform 2.0 v1 배포 스크립트
echo set PROJECT_ID=%PROJECT_ID%
echo set LB_IP=%LB_IP%
echo echo 🚀 Community Platform 2.0 v1 배포 시작...
echo echo 프로젝트 ID: %%PROJECT_ID%%
echo echo 로드 밸런서 IP: %%LB_IP%%
echo echo.
echo echo 인스턴스에 애플리케이션 배포 중...
echo gcloud compute ssh community-platform-v1-vm --zone=asia-northeast3-a --command="
echo # 시스템 업데이트
echo sudo apt-get update
echo # Node.js 설치
echo curl -fsSL https://deb.nodesource.com/setup_18.x ^| sudo -E bash -
echo sudo apt-get install -y nodejs
echo # Git 설치
echo sudo apt-get install -y git
echo # PM2 설치
echo sudo npm install -g pm2
echo # 애플리케이션 디렉토리 생성
echo mkdir -p /home/ubuntu/app
echo cd /home/ubuntu/app
echo # Git 저장소 클론 (실제 저장소 URL로 변경 필요)
echo git clone https://github.com/your-repo/community-platform.git .
echo # 의존성 설치
echo npm install
echo cd server-backend ^&^& npm install ^&^& cd ..
echo cd frontend ^&^& npm install ^&^& cd ..
echo # 환경 변수 설정
echo cat ^> .env ^<^< 'ENVEOF'
echo NODE_ENV=production
echo PORT=3000
echo DATABASE_URL=mysql://app_user:test_password_123@DB_IP:3306/community_platform
echo REDIS_URL=redis://REDIS_IP:6379
echo ENVEOF
echo # 프론트엔드 빌드
echo cd frontend ^&^& npm run build ^&^& cd ..
echo # 애플리케이션 실행
echo pm2 start server-backend/api-server/server.js --name community-platform
echo pm2 save
echo pm2 startup
echo "
echo echo ✅ 배포 완료!
echo echo 🌐 접속 URL: http://%%LB_IP%%
echo echo 🔧 SSH 접속: gcloud compute ssh community-platform-v1-vm --zone=asia-northeast3-a
echo start http://%%LB_IP%%
) > deploy-v1.bat

echo ✅ 배포 스크립트 생성 완료

echo.
echo 🆓 무료 테스트 환경에서 Community Platform 2.0 v1을 테스트할 수 있습니다!
echo 다음 단계: 릴리즈 v1 완성 후 실제 서비스 환경으로 전환하세요.
echo.

pause
