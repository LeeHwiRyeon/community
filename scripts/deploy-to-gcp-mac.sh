#!/bin/bash

# Community Platform 2.0 GCP 배포 스크립트 (맥PC용)
# 사용법: ./scripts/deploy-to-gcp-mac.sh [project-id] [domain]

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
PROJECT_ID=${1:-"community-platform-2"}
DOMAIN=${2:-"community-platform.com"}
REGION="asia-northeast3"
ZONE="asia-northeast3-a"
INSTANCE_NAME="community-platform-vm"

log "🍎 맥PC에서 Community Platform 2.0 GCP 배포 시작"
log "프로젝트 ID: $PROJECT_ID"
log "도메인: $DOMAIN"

# 1. 맥PC 환경 확인
log "🍎 맥PC 환경 확인..."

# macOS 확인
if [[ "$OSTYPE" != "darwin"* ]]; then
    error "이 스크립트는 macOS용입니다."
    exit 1
fi

# Homebrew 확인
if ! command -v brew &> /dev/null; then
    error "Homebrew가 설치되지 않았습니다."
    log "다음 명령어로 설치하세요:"
    log "/bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi

# Docker 확인
if ! command -v docker &> /dev/null; then
    error "Docker가 설치되지 않았습니다."
    log "다음 명령어로 설치하세요:"
    log "brew install --cask docker"
    log "그리고 Docker Desktop을 실행하세요."
    exit 1
fi

# Docker Desktop 실행 확인
if ! docker info &> /dev/null; then
    warning "Docker Desktop이 실행되지 않았습니다. 실행 중..."
    open -a Docker
    log "Docker Desktop이 시작될 때까지 잠시 기다려주세요..."
    sleep 30
fi

# GCP CLI 확인
if ! command -v gcloud &> /dev/null; then
    error "GCP CLI가 설치되지 않았습니다."
    log "다음 명령어로 설치하세요:"
    log "brew install google-cloud-sdk"
    exit 1
fi

# Node.js 확인
if ! command -v node &> /dev/null; then
    error "Node.js가 설치되지 않았습니다."
    log "다음 명령어로 설치하세요:"
    log "brew install node@18"
    exit 1
fi

success "맥PC 환경 확인 완료"

# 2. GCP 인증 확인
log "🔐 GCP 인증 확인..."

# 프로젝트 설정
gcloud config set project $PROJECT_ID

# 인증 확인
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    warning "GCP 인증이 필요합니다."
    gcloud auth login
fi

# Container Registry 인증
gcloud auth configure-docker

success "GCP 인증 확인 완료"

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

# 4. Docker 이미지 빌드
log "🐳 Docker 이미지 빌드..."

# Dockerfile이 없으면 생성
if [ ! -f "Dockerfile" ]; then
    log "Dockerfile 생성 중..."
    cat > Dockerfile << 'EOF'
# Community Platform 2.0 Dockerfile
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./
COPY server-backend/package*.json ./server-backend/
COPY frontend/package*.json ./frontend/

# 의존성 설치
RUN npm install
RUN cd server-backend && npm install
RUN cd frontend && npm install

# 소스 코드 복사
COPY . .

# 프론트엔드 빌드
RUN cd frontend && npm run build

# 포트 노출
EXPOSE 3000

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=3000

# 애플리케이션 실행
CMD ["node", "server-backend/api-server/server.js"]
EOF
fi

# Docker 이미지 빌드
log "Docker 이미지 빌드 중..."
docker build -t community-platform:latest .

success "Docker 이미지 빌드 완료"

# 5. GCP Container Registry에 푸시
log "📤 GCP Container Registry에 푸시..."

# 이미지 태그
docker tag community-platform:latest gcr.io/$PROJECT_ID/community-platform:latest

# 이미지 푸시
log "이미지 푸시 중... (시간이 걸릴 수 있습니다)"
docker push gcr.io/$PROJECT_ID/community-platform:latest

success "이미지 푸시 완료"

# 6. 인스턴스 정보 가져오기
log "📋 인스턴스 정보 가져오기..."

# 인스턴스 IP 가져오기
INSTANCE_IP=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format="value(networkInterfaces[0].accessConfigs[0].natIP)")

if [ -z "$INSTANCE_IP" ]; then
    error "인스턴스 IP를 가져올 수 없습니다."
    exit 1
fi

log "인스턴스 IP: $INSTANCE_IP"

# 7. 인스턴스에 배포
log "🚀 인스턴스에 배포..."

# 인스턴스에 Docker 설치 및 설정
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="
    # Docker 설치 (Ubuntu)
    sudo apt-get update
    sudo apt-get install -y docker.io
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker ubuntu
    
    # GCP Container Registry 인증
    gcloud auth configure-docker
    
    # 기존 컨테이너 중지 및 제거
    sudo docker stop community-platform || true
    sudo docker rm community-platform || true
    
    # 이미지 풀
    sudo docker pull gcr.io/$PROJECT_ID/community-platform:latest
    
    # 환경 변수 설정
    export DATABASE_URL=\$DATABASE_URL
    export REDIS_URL=\$REDIS_URL
    export NODE_ENV=production
    export PORT=3000
    
    # 컨테이너 실행
    sudo docker run -d \\
        --name community-platform \\
        --restart=unless-stopped \\
        -p 3000:3000 \\
        -e NODE_ENV=production \\
        -e DATABASE_URL=\$DATABASE_URL \\
        -e REDIS_URL=\$REDIS_URL \\
        -e PORT=3000 \\
        gcr.io/$PROJECT_ID/community-platform:latest
"

success "인스턴스 배포 완료"

# 8. 헬스 체크
log "🏥 헬스 체크..."

# 헬스 체크 재시도 로직
MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://$INSTANCE_IP:3000/api/health > /dev/null 2>&1; then
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
    gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="sudo docker logs community-platform"
    
    exit 1
fi

# 9. 로드 밸런서 IP 확인
log "⚖️ 로드 밸런서 IP 확인..."

LB_IP=$(gcloud compute forwarding-rules describe community-platform-http-rule --global --format="value(IPAddress)")

if [ -z "$LB_IP" ]; then
    warning "로드 밸런서 IP를 가져올 수 없습니다. 인스턴스 IP를 사용합니다."
    LB_IP=$INSTANCE_IP
fi

log "로드 밸런서 IP: $LB_IP"

# 10. 배포 완료
success "🎉 Community Platform 2.0 GCP 배포 완료!"

echo ""
echo "📊 배포 정보:"
echo "  프로젝트 ID: $PROJECT_ID"
echo "  인스턴스: $INSTANCE_NAME"
echo "  인스턴스 IP: $INSTANCE_IP"
echo "  로드 밸런서 IP: $LB_IP"
echo "  도메인: $DOMAIN"
echo ""
echo "🌐 접속 URL:"
echo "  HTTP: http://$LB_IP"
echo "  HTTPS: https://$DOMAIN (DNS 설정 후)"
echo ""
echo "🔧 유용한 명령어:"
echo "  SSH 접속: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo "  로그 확인: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='sudo docker logs community-platform'"
echo "  컨테이너 재시작: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='sudo docker restart community-platform'"
echo "  인스턴스 재시작: gcloud compute instances reset $INSTANCE_NAME --zone=$ZONE"
echo ""

# 11. 브라우저에서 열기 (맥PC)
log "🌐 브라우저에서 애플리케이션 열기..."

# Safari에서 열기
open -a Safari "http://$LB_IP"

# Chrome에서도 열기 (설치되어 있다면)
if [ -d "/Applications/Google Chrome.app" ]; then
    open -a "Google Chrome" "http://$LB_IP"
fi

success "배포 완료! 브라우저에서 애플리케이션을 확인하세요."

log "🍎 맥PC에서 Community Platform 2.0 배포가 완료되었습니다!"
log "다음 단계: 도메인 DNS 설정을 완료하세요."
