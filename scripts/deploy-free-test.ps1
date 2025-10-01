# Community Platform 2.0 무료 테스트 환경 배포 스크립트 (Windows PowerShell)
# 사용법: .\scripts\deploy-free-test.ps1 -ProjectId "community-platform-test"

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
$InstanceName = "community-platform-test-vm"

Write-Info "🆓 Community Platform 2.0 무료 테스트 환경 배포 시작"
Write-Info "프로젝트 ID: $ProjectId"

# 1. 프로젝트 설정
Write-Info "📁 프로젝트 설정..."
gcloud config set project $ProjectId

# 2. 인스턴스 정보 가져오기
Write-Info "📋 인스턴스 정보 가져오기..."

try {
    $InstanceIP = gcloud compute instances describe $InstanceName --zone=$Zone --format="value(networkInterfaces[0].accessConfigs[0].natIP)"
    if (-not $InstanceIP) {
        throw "인스턴스 IP를 가져올 수 없습니다."
    }
    Write-Info "인스턴스 IP: $InstanceIP"
} catch {
    Write-Error "인스턴스 IP를 가져올 수 없습니다."
    Write-Error "먼저 .\scripts\setup-gcp-free-test.ps1를 실행하세요."
    exit 1
}

# 데이터베이스 IP 가져오기
try {
    $DB_IP = gcloud sql instances describe community-platform-test-db --format="value(ipAddresses[0].ipAddress)"
    Write-Info "데이터베이스 IP: $DB_IP"
} catch {
    Write-Warning "데이터베이스 IP를 가져올 수 없습니다."
    $DB_IP = "localhost"
}

# Redis IP 가져오기
try {
    $Redis_IP = gcloud redis instances describe community-platform-test-redis --region=$Region --format="value(host)"
    Write-Info "Redis IP: $Redis_IP"
} catch {
    Write-Warning "Redis IP를 가져올 수 없습니다."
    $Redis_IP = "localhost"
}

# 로드 밸런서 IP 가져오기
try {
    $LB_IP = gcloud compute addresses describe community-platform-test-ip --global --format="value(address)"
    Write-Info "로드 밸런서 IP: $LB_IP"
} catch {
    Write-Warning "로드 밸런서 IP를 가져올 수 없습니다."
    $LB_IP = $InstanceIP
}

# 3. 애플리케이션 빌드
Write-Info "🔨 애플리케이션 빌드..."

# 의존성 설치
if (-not (Test-Path "node_modules")) {
    Write-Info "의존성 설치 중..."
    npm install
}

# 프론트엔드 빌드
Write-Info "프론트엔드 빌드 중..."
Set-Location frontend
npm install
npm run build
Set-Location ..

# 백엔드 빌드
Write-Info "백엔드 빌드 중..."
Set-Location server-backend
npm install
Set-Location ..

Write-Success "애플리케이션 빌드 완료"

# 4. 인스턴스에 애플리케이션 배포
Write-Info "🚀 인스턴스에 애플리케이션 배포..."

try {
    $deployCommand = @"
# 시스템 업데이트
sudo apt-get update

# Node.js 설치 (이미 설치되어 있으면 건너뜀)
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Git 설치 (이미 설치되어 있으면 건너뜀)
if ! command -v git &> /dev/null; then
    sudo apt-get install -y git
fi

# PM2 설치 (이미 설치되어 있으면 건너뜀)
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# 기존 애플리케이션 중지
pm2 stop community-platform || true
pm2 delete community-platform || true

# 애플리케이션 디렉토리 생성
mkdir -p /home/ubuntu/app
cd /home/ubuntu/app

# 기존 코드 백업 (있다면)
if [ -d ".git" ]; then
    git stash
    git pull
else
    # Git 저장소 클론 (실제 저장소 URL로 변경 필요)
    git clone https://github.com/your-repo/community-platform.git .
fi

# 의존성 설치
npm install
cd server-backend && npm install && cd ..
cd frontend && npm install && cd ..

# 환경 변수 설정
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://app_user:test_password_123@$DB_IP:3306/community_platform
REDIS_URL=redis://$Redis_IP:6379
ENVEOF

# 프론트엔드 빌드
cd frontend && npm run build && cd ..

# 애플리케이션 실행
pm2 start server-backend/api-server/server.js --name community-platform
pm2 save
pm2 startup
"@

    gcloud compute ssh $InstanceName --zone=$Zone --command=$deployCommand
    Write-Success "인스턴스 배포 완료"
} catch {
    Write-Error "인스턴스 배포 실패: $_"
    exit 1
}

# 5. 헬스 체크
Write-Info "🏥 헬스 체크..."

$maxRetries = 10
$retryCount = 0
$healthCheckPassed = $false

while ($retryCount -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://$LB_IP/api/health" -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Success "헬스 체크 성공"
            $healthCheckPassed = $true
            break
        }
    } catch {
        $retryCount++
        Write-Warning "헬스 체크 실패 ($retryCount/$maxRetries). 30초 후 재시도..."
        Start-Sleep -Seconds 30
    }
}

if (-not $healthCheckPassed) {
    Write-Error "헬스 체크 실패. 애플리케이션 상태를 확인해주세요."
    
    # 로그 확인
    Write-Info "애플리케이션 로그 확인 중..."
    gcloud compute ssh $InstanceName --zone=$Zone --command="pm2 logs community-platform --lines 50"
    
    exit 1
}

# 6. 배포 완료
Write-Success "🎉 Community Platform 2.0 무료 테스트 환경 배포 완료!"

Write-Host ""
Write-Host "📊 배포 정보:" -ForegroundColor Green
Write-Host "  프로젝트 ID: $ProjectId"
Write-Host "  인스턴스: $InstanceName"
Write-Host "  인스턴스 IP: $InstanceIP"
Write-Host "  로드 밸런서 IP: $LB_IP"
Write-Host "  데이터베이스 IP: $DB_IP"
Write-Host "  Redis IP: $Redis_IP"
Write-Host ""
Write-Host "🌐 접속 URL:" -ForegroundColor Cyan
Write-Host "  HTTP: http://$LB_IP"
Write-Host "  API: http://$LB_IP/api"
Write-Host "  관리자: http://$LB_IP/admin"
Write-Host ""
Write-Host "🔧 유용한 명령어:" -ForegroundColor Yellow
Write-Host "  SSH 접속: gcloud compute ssh $InstanceName --zone=$Zone"
Write-Host "  로그 확인: gcloud compute ssh $InstanceName --zone=$Zone --command='pm2 logs community-platform'"
Write-Host "  애플리케이션 재시작: gcloud compute ssh $InstanceName --zone=$Zone --command='pm2 restart community-platform'"
Write-Host "  인스턴스 재시작: gcloud compute instances reset $InstanceName --zone=$Zone"
Write-Host ""
Write-Host "💰 비용 정보:" -ForegroundColor Magenta
Write-Host "  현재 비용: `$0 (무료 크레딧 사용)"
Write-Host "  예상 월 비용: `$0-5 (무료 등급 사용)"
Write-Host "  크레딧 잔액: GCP 콘솔에서 확인 가능"
Write-Host ""

# 7. 브라우저에서 열기
Write-Info "🌐 브라우저에서 애플리케이션 열기..."

try {
    Start-Process "http://$LB_IP"
    Write-Success "브라우저에서 애플리케이션을 열었습니다."
} catch {
    Write-Warning "브라우저를 자동으로 열 수 없습니다. 수동으로 http://$LB_IP 를 열어주세요."
}

Write-Success "배포 완료! 브라우저에서 애플리케이션을 확인하세요."

Write-Info "🆓 무료 테스트 환경에서 Community Platform 2.0을 테스트할 수 있습니다!"
Write-Info "다음 단계: 릴리즈 v1 완성 후 실제 서비스 환경으로 전환하세요."
