# Community Platform 2.0 GCP 무료 테스트 환경 구축 스크립트 (Windows PowerShell)
# 사용법: .\scripts\setup-gcp-free-test.ps1 -ProjectId "community-platform-test"

param(
    [string]$ProjectId = "community-platform-test"
)

# 색상 함수
function Write-ColorLog {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-ColorLog "✅ $Message" "Green"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorLog "⚠️ $Message" "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-ColorLog "❌ $Message" "Red"
}

function Write-Info {
    param([string]$Message)
    Write-ColorLog "ℹ️ $Message" "Blue"
}

# 환경 변수 설정
$Region = "asia-northeast3"
$Zone = "asia-northeast3-a"

Write-Info "🆓 Community Platform 2.0 GCP 무료 테스트 환경 구축 시작"
Write-Info "프로젝트 ID: $ProjectId"
Write-Warning "무료 크레딧 사용 중 - 비용 발생 주의!"

# 1. GCP CLI 확인
Write-Info "🔧 GCP CLI 확인..."

try {
    $gcloudVersion = gcloud version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "GCP CLI가 설치되지 않았습니다."
    }
    Write-Success "GCP CLI 확인 완료"
}
catch {
    Write-Error "GCP CLI가 설치되지 않았습니다."
    Write-Info "다음 링크에서 설치하세요: https://cloud.google.com/sdk/docs/install"
    exit 1
}

# 2. GCP 프로젝트 생성
Write-Info "📁 GCP 프로젝트 생성..."

try {
    gcloud projects create $ProjectId --name="Community Platform Test"
    gcloud config set project $ProjectId
    Write-Success "GCP 프로젝트 생성 완료"
}
catch {
    Write-Error "프로젝트 생성 실패: $_"
    exit 1
}

# 3. 결제 계정 연결 확인
Write-Warning "💳 결제 계정 연결이 필요합니다."
Write-Info "GCP 콘솔에서 결제 계정을 연결하세요:"
Write-Info "https://console.cloud.google.com/billing/linkedaccount?project=$ProjectId"

$confirmation = Read-Host "결제 계정 연결을 완료했습니까? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Error "결제 계정 연결이 필요합니다."
    exit 1
}

# 4. 필요한 API 활성화
Write-Info "🔧 필요한 API 활성화..."

$apis = @(
    "compute.googleapis.com",
    "sqladmin.googleapis.com",
    "redis.googleapis.com",
    "dns.googleapis.com",
    "cloudresourcemanager.googleapis.com"
)

foreach ($api in $apis) {
    try {
        gcloud services enable $api
        Write-Info "  ✅ $api 활성화 완료"
    }
    catch {
        Write-Warning "  ⚠️ $api 활성화 실패: $_"
    }
}

Write-Success "API 활성화 완료"

# 5. VPC 네트워크 생성
Write-Info "🌐 VPC 네트워크 생성..."

try {
    gcloud compute networks create community-platform-test-vpc --subnet-mode=custom
    gcloud compute networks subnets create community-platform-test-subnet --network=community-platform-test-vpc --range=10.0.0.0/24 --region=$Region
    Write-Success "VPC 네트워크 생성 완료"
}
catch {
    Write-Error "VPC 네트워크 생성 실패: $_"
    exit 1
}

# 6. 방화벽 규칙 생성
Write-Info "🔥 방화벽 규칙 생성..."

$firewallRules = @(
    @{Name = "allow-http"; Port = "80"; Description = "HTTP" },
    @{Name = "allow-https"; Port = "443"; Description = "HTTPS" },
    @{Name = "allow-ssh"; Port = "22"; Description = "SSH" },
    @{Name = "allow-app"; Port = "3000"; Description = "Application" }
)

foreach ($rule in $firewallRules) {
    try {
        gcloud compute firewall-rules create $rule.Name --network=community-platform-test-vpc --allow=tcp:$($rule.Port) --source-ranges=0.0.0.0/0 --target-tags="$($rule.Name.Replace('allow-', ''))-server"
        Write-Info "  ✅ $($rule.Description) 방화벽 규칙 생성 완료"
    }
    catch {
        Write-Warning "  ⚠️ $($rule.Description) 방화벽 규칙 생성 실패: $_"
    }
}

Write-Success "방화벽 규칙 생성 완료"

# 7. SSH 키 생성
Write-Info "🔑 SSH 키 생성..."

$sshKeyPath = "$env:USERPROFILE\.ssh\gcp_rsa"
if (-not (Test-Path $sshKeyPath)) {
    try {
        ssh-keygen -t rsa -b 4096 -f $sshKeyPath -N '""'
        Write-Success "SSH 키 생성 완료"
    }
    catch {
        Write-Error "SSH 키 생성 실패: $_"
        exit 1
    }
}
else {
    Write-Info "SSH 키가 이미 존재합니다."
}

# 8. Compute Engine 인스턴스 생성 (무료 등급)
Write-Info "🖥️ Compute Engine 인스턴스 생성 (무료 등급)..."

try {
    $sshKey = Get-Content "$sshKeyPath.pub"
    gcloud compute instances create community-platform-test-vm --zone=$Zone --machine-type=f1-micro --network-interface=subnet=community-platform-test-subnet, no-address --maintenance-policy=MIGRATE --provisioning-model=STANDARD --service-account=default --scopes=https://www.googleapis.com/auth/cloud-platform --create-disk=auto-delete=yes, boot=yes, device-name=community-platform-test-vm, image=projects/ubuntu-os-cloud/global/images/family/ubuntu-2004-lts, mode=rw, size=30, type=projects/$ProjectId/zones/$Zone/diskTypes/pd-standard --metadata-from-file=ssh-keys=<(echo "ubuntu:$sshKey") --tags=http-server, https-server, ssh-server, app-server
    Write-Success "Compute Engine 인스턴스 생성 완료"
}
catch {
    Write-Error "Compute Engine 인스턴스 생성 실패: $_"
    exit 1
}

# 9. Cloud SQL 인스턴스 생성 (무료 등급)
Write-Info "🗄️ Cloud SQL 인스턴스 생성 (무료 등급)..."

try {
    gcloud sql instances create community-platform-test-db --database-version=MYSQL_8_0 --tier=db-f1-micro --region=$Region --storage-type=HDD --storage-size=10GB --storage-auto-increase --backup-start-time=03:00 --enable-bin-log --network=projects/$ProjectId/global/networks/community-platform-test-vpc
    gcloud sql databases create community_platform --instance=community-platform-test-db
    gcloud sql users create app_user --instance=community-platform-test-db --password=test_password_123
    Write-Success "Cloud SQL 인스턴스 생성 완료"
}
catch {
    Write-Error "Cloud SQL 인스턴스 생성 실패: $_"
    exit 1
}

# 10. Memorystore 인스턴스 생성 (무료 등급)
Write-Info "💾 Memorystore 인스턴스 생성 (무료 등급)..."

try {
    gcloud redis instances create community-platform-test-redis --size=1 --region=$Region --network=projects/$ProjectId/global/networks/community-platform-test-vpc
    Write-Success "Memorystore 인스턴스 생성 완료"
}
catch {
    Write-Error "Memorystore 인스턴스 생성 실패: $_"
    exit 1
}

# 11. 로드 밸런서 생성 (무료 등급)
Write-Info "⚖️ 로드 밸런서 생성 (무료 등급)..."

try {
    # 인스턴스 그룹 생성
    gcloud compute instance-groups unmanaged create community-platform-test-ig --zone=$Zone
    
    # 인스턴스를 그룹에 추가
    gcloud compute instance-groups unmanaged add-instances community-platform-test-ig --instances=community-platform-test-vm --zone=$Zone
    
    # 헬스 체크 생성
    gcloud compute health-checks create http community-platform-test-health-check --port=3000 --request-path=/api/health
    
    # 백엔드 서비스 생성
    gcloud compute backend-services create community-platform-test-backend --protocol=HTTP --port-name=http --health-checks=community-platform-test-health-check --global
    
    # 백엔드 서비스에 인스턴스 그룹 추가
    gcloud compute backend-services add-backend community-platform-test-backend --instance-group=community-platform-test-ig --instance-group-zone=$Zone --global
    
    # URL 맵 생성
    gcloud compute url-maps create community-platform-test-url-map --default-service=community-platform-test-backend
    
    # HTTP 프록시 생성
    gcloud compute target-http-proxies create community-platform-test-http-proxy --url-map=community-platform-test-url-map
    
    # 전역 IP 주소 생성
    gcloud compute addresses create community-platform-test-ip --global
    
    # 전역 IP 주소 가져오기
    $LB_IP = gcloud compute addresses describe community-platform-test-ip --global --format="value(address)"
    
    # 전달 규칙 생성
    gcloud compute forwarding-rules create community-platform-test-http-rule --global --target-http-proxy=community-platform-test-http-proxy --address=$LB_IP --ports=80
    
    Write-Success "로드 밸런서 생성 완료"
    Write-Info "로드 밸런서 IP: $LB_IP"
}
catch {
    Write-Error "로드 밸런서 생성 실패: $_"
    exit 1
}

# 12. 비용 모니터링 설정
Write-Info "💰 비용 모니터링 설정..."

try {
    $billingAccount = gcloud billing accounts list --format="value(name)" --limit=1
    gcloud billing budgets create --billing-account=$billingAccount --display-name="Community Platform Test Budget" --budget-amount=10USD --threshold-rule=percent=50 --threshold-rule=percent=90 --threshold-rule=percent=100
    Write-Success "비용 모니터링 설정 완료"
}
catch {
    Write-Warning "비용 모니터링 설정 실패: $_"
}

# 13. 배포 스크립트 생성
Write-Info "📝 배포 스크립트 생성..."

$deployScript = @"
# Community Platform 2.0 무료 테스트 환경 배포 스크립트 (Windows PowerShell)

Write-Host "🚀 Community Platform 2.0 무료 테스트 환경 배포 시작" -ForegroundColor Blue

# 환경 변수 설정
`$PROJECT_ID = "$ProjectId"
`$REGION = "$Region"
`$ZONE = "$Zone"
`$INSTANCE_NAME = "community-platform-test-vm"

# 인스턴스 IP 가져오기
`$INSTANCE_IP = gcloud compute instances describe `$INSTANCE_NAME --zone=`$ZONE --format="value(networkInterfaces[0].accessConfigs[0].natIP)"

# 데이터베이스 IP 가져오기
`$DB_IP = gcloud sql instances describe community-platform-test-db --format="value(ipAddresses[0].ipAddress)"

# Redis IP 가져오기
`$REDIS_IP = gcloud redis instances describe community-platform-test-redis --region=`$REGION --format="value(host)"

# 로드 밸런서 IP 가져오기
`$LB_IP = gcloud compute addresses describe community-platform-test-ip --global --format="value(address)"

Write-Host "📊 환경 정보:" -ForegroundColor Green
Write-Host "  프로젝트 ID: `$PROJECT_ID"
Write-Host "  인스턴스 IP: `$INSTANCE_IP"
Write-Host "  데이터베이스 IP: `$DB_IP"
Write-Host "  Redis IP: `$REDIS_IP"
Write-Host "  로드 밸런서 IP: `$LB_IP"

# 인스턴스에 애플리케이션 배포
Write-Host "🚀 인스턴스에 애플리케이션 배포..." -ForegroundColor Blue

gcloud compute ssh `$INSTANCE_NAME --zone=`$ZONE --command="
    # 시스템 업데이트
    sudo apt-get update
    
    # Node.js 설치
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Git 설치
    sudo apt-get install -y git
    
    # 애플리케이션 클론
    git clone https://github.com/your-repo/community-platform.git /home/ubuntu/app
    cd /home/ubuntu/app
    
    # 의존성 설치
    npm install
    cd server-backend && npm install && cd ..
    cd frontend && npm install && cd ..
    
    # 환경 변수 설정
    cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://app_user:test_password_123@`$DB_IP:3306/community_platform
REDIS_URL=redis://`$REDIS_IP:6379
ENVEOF
    
    # 프론트엔드 빌드
    cd frontend && npm run build && cd ..
    
    # PM2 설치 및 실행
    sudo npm install -g pm2
    
    # 애플리케이션 실행
    pm2 start server-backend/api-server/server.js --name community-platform
    pm2 save
    pm2 startup
"

Write-Host "✅ 배포 완료!" -ForegroundColor Green
Write-Host "🌐 접속 URL: http://`$LB_IP" -ForegroundColor Cyan
Write-Host "🔧 SSH 접속: gcloud compute ssh `$INSTANCE_NAME --zone=`$ZONE" -ForegroundColor Yellow
"@

$deployScript | Out-File -FilePath "deploy-test.ps1" -Encoding UTF8

Write-Success "배포 스크립트 생성 완료"

# 14. 완료 메시지
Write-Success "🎉 Community Platform 2.0 GCP 무료 테스트 환경 구축 완료!"

Write-Host ""
Write-Host "📊 구축된 환경:" -ForegroundColor Green
Write-Host "  프로젝트 ID: $ProjectId"
Write-Host "  인스턴스: community-platform-test-vm (f1-micro - 무료)"
Write-Host "  데이터베이스: community-platform-test-db (db-f1-micro - 무료)"
Write-Host "  Redis: community-platform-test-redis (1GB - 무료)"
Write-Host "  로드 밸런서: community-platform-test-ip"
Write-Host ""
Write-Host "🌐 접속 URL:" -ForegroundColor Cyan
Write-Host "  HTTP: http://$LB_IP"
Write-Host ""
Write-Host "🔧 다음 단계:" -ForegroundColor Yellow
Write-Host "  1. 배포 실행: .\deploy-test.ps1"
Write-Host "  2. 애플리케이션 확인: http://$LB_IP"
Write-Host "  3. 비용 모니터링: https://console.cloud.google.com/billing"
Write-Host ""
Write-Host "⚠️ 주의사항:" -ForegroundColor Red
Write-Host "  - 무료 크레딧 사용 중입니다"
Write-Host "  - 90일 후 자동으로 유료 전환됩니다"
Write-Host "  - 예산 알림이 설정되어 있습니다"
Write-Host "  - 테스트 완료 후 리소스를 삭제하세요"
Write-Host ""

Write-Info "🆓 무료 테스트 환경에서 Community Platform 2.0을 테스트할 수 있습니다!"
Write-Info "다음 단계: 릴리즈 v1 완성 후 실제 서비스 환경으로 전환하세요."
