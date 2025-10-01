#!/bin/bash

# Community Platform 2.0 무료 테스트 환경 배포 스크립트
# 사용법: ./scripts/deploy-free-test.sh [project-id]

set -e  # 오류 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌${NC} $1"
}

# 환경 변수 설정
PROJECT_ID=${1:-"community-platform-test"}
REGION="asia-northeast3"
ZONE="asia-northeast3-a"
INSTANCE_NAME="community-platform-test-vm"

log "🆓 Community Platform 2.0 무료 테스트 환경 배포 시작"
log "프로젝트 ID: $PROJECT_ID"

# 1. 프로젝트 설정
log "📁 프로젝트 설정..."
gcloud config set project $PROJECT_ID

# 2. 인스턴스 정보 가져오기
log "📋 인스턴스 정보 가져오기..."

# 인스턴스 IP 가져오기
INSTANCE_IP=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format="value(networkInterfaces[0].accessConfigs[0].natIP)")

if [ -z "$INSTANCE_IP" ]; then
    error "인스턴스 IP를 가져올 수 없습니다."
    error "먼저 ./scripts/setup-gcp-free-test.sh를 실행하세요."
    exit 1
fi

# 데이터베이스 IP 가져오기
DB_IP=$(gcloud sql instances describe community-platform-test-db --format="value(ipAddresses[0].ipAddress)")

# Redis IP 가져오기
REDIS_IP=$(gcloud redis instances describe community-platform-test-redis --region=$REGION --format="value(host)")

# 로드 밸런서 IP 가져오기
LB_IP=$(gcloud compute addresses describe community-platform-test-ip --global --format="value(address)")

log "인스턴스 IP: $INSTANCE_IP"
log "데이터베이스 IP: $DB_IP"
log "Redis IP: $REDIS_IP"
log "로드 밸런서 IP: $LB_IP"

# 3. 애플리케이션 빌드
log "🔨 애플리케이션 빌드..."

# 의존성 설치
if [ ! -d "node_modules" ]; then
    log "의존성 설치 중..."
    npm install
fi

# 프론트엔드 빌드
log "프론트엔드 빌드 중..."
cd frontend
npm install
npm run build
cd ..

# 백엔드 빌드
log "백엔드 빌드 중..."
cd server-backend
npm install
cd ..

success "애플리케이션 빌드 완료"

# 4. 인스턴스에 애플리케이션 배포
log "🚀 인스턴스에 애플리케이션 배포..."

# 인스턴스에 애플리케이션 배포
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="
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
    if [ -d \".git\" ]; then
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
REDIS_URL=redis://$REDIS_IP:6379
ENVEOF
    
    # 프론트엔드 빌드
    cd frontend && npm run build && cd ..
    
    # 애플리케이션 실행
    pm2 start server-backend/api-server/server.js --name community-platform
    pm2 save
    pm2 startup
"

success "인스턴스 배포 완료"

# 5. 헬스 체크
log "🏥 헬스 체크..."

# 헬스 체크 재시도 로직
MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://$LB_IP/api/health > /dev/null 2>&1; then
        success "헬스 체크 성공"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        warning "헬스 체크 실패 ($RETRY_COUNT/$MAX_RETRIES). 30초 후 재시도..."
        sleep 30
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    error "헬스 체크 실패. 애플리케이션 상태를 확인해주세요."
    
    # 로그 확인
    log "애플리케이션 로그 확인 중..."
    gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="pm2 logs community-platform --lines 50"
    
    exit 1
fi

# 6. 배포 완료
success "🎉 Community Platform 2.0 무료 테스트 환경 배포 완료!"

echo ""
echo "📊 배포 정보:"
echo "  프로젝트 ID: $PROJECT_ID"
echo "  인스턴스: $INSTANCE_NAME"
echo "  인스턴스 IP: $INSTANCE_IP"
echo "  로드 밸런서 IP: $LB_IP"
echo "  데이터베이스 IP: $DB_IP"
echo "  Redis IP: $REDIS_IP"
echo ""
echo "🌐 접속 URL:"
echo "  HTTP: http://$LB_IP"
echo "  API: http://$LB_IP/api"
echo "  관리자: http://$LB_IP/admin"
echo ""
echo "🔧 유용한 명령어:"
echo "  SSH 접속: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo "  로그 확인: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='pm2 logs community-platform'"
echo "  애플리케이션 재시작: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='pm2 restart community-platform'"
echo "  인스턴스 재시작: gcloud compute instances reset $INSTANCE_NAME --zone=$ZONE"
echo ""
echo "💰 비용 정보:"
echo "  현재 비용: $0 (무료 크레딧 사용)"
echo "  예상 월 비용: $0-5 (무료 등급 사용)"
echo "  크레딧 잔액: GCP 콘솔에서 확인 가능"
echo ""

# 7. 브라우저에서 열기 (Windows)
log "🌐 브라우저에서 애플리케이션 열기..."

# Windows에서 브라우저 열기
if command -v start &> /dev/null; then
    start "http://$LB_IP"
elif command -v xdg-open &> /dev/null; then
    xdg-open "http://$LB_IP"
elif command -v open &> /dev/null; then
    open "http://$LB_IP"
else
    log "브라우저에서 http://$LB_IP 를 열어주세요."
fi

success "배포 완료! 브라우저에서 애플리케이션을 확인하세요."

log "🆓 무료 테스트 환경에서 Community Platform 2.0을 테스트할 수 있습니다!"
log "다음 단계: 릴리즈 v1 완성 후 실제 서비스 환경으로 전환하세요."
