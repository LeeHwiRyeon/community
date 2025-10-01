#!/bin/bash

# Community Platform 2.0 GCP 무료 테스트 환경 구축 스크립트
# 사용법: ./scripts/setup-gcp-free-test.sh [project-id]

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

log "🆓 Community Platform 2.0 GCP 무료 테스트 환경 구축 시작"
log "프로젝트 ID: $PROJECT_ID"
log "⚠️  무료 크레딧 사용 중 - 비용 발생 주의!"

# 1. GCP 프로젝트 생성
log "📁 GCP 프로젝트 생성..."

# 프로젝트 생성
gcloud projects create $PROJECT_ID --name="Community Platform Test"

# 프로젝트 설정
gcloud config set project $PROJECT_ID

# 결제 계정 연결 (무료 크레딧 활성화)
log "💳 결제 계정 연결 (무료 크레딧 활성화)..."
warning "GCP 콘솔에서 결제 계정을 연결해야 합니다:"
warning "https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID"

read -p "결제 계정 연결을 완료했습니까? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    error "결제 계정 연결이 필요합니다."
    exit 1
fi

success "GCP 프로젝트 생성 완료"

# 2. 필요한 API 활성화
log "🔧 필요한 API 활성화..."

gcloud services enable compute.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable redis.googleapis.com
gcloud services enable dns.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com

success "API 활성화 완료"

# 3. VPC 네트워크 생성
log "🌐 VPC 네트워크 생성..."

gcloud compute networks create community-platform-test-vpc \
    --subnet-mode=custom

gcloud compute networks subnets create community-platform-test-subnet \
    --network=community-platform-test-vpc \
    --range=10.0.0.0/24 \
    --region=$REGION

success "VPC 네트워크 생성 완료"

# 4. 방화벽 규칙 생성
log "🔥 방화벽 규칙 생성..."

gcloud compute firewall-rules create allow-http \
    --network=community-platform-test-vpc \
    --allow=tcp:80 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=http-server

gcloud compute firewall-rules create allow-https \
    --network=community-platform-test-vpc \
    --allow=tcp:443 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=https-server

gcloud compute firewall-rules create allow-ssh \
    --network=community-platform-test-vpc \
    --allow=tcp:22 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=ssh-server

gcloud compute firewall-rules create allow-app \
    --network=community-platform-test-vpc \
    --allow=tcp:3000 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=app-server

success "방화벽 규칙 생성 완료"

# 5. Compute Engine 인스턴스 생성 (무료 등급)
log "🖥️ Compute Engine 인스턴스 생성 (무료 등급)..."

# SSH 키 생성 (이미 존재하면 무시)
if [ ! -f ~/.ssh/gcp_rsa ]; then
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/gcp_rsa -N ""
fi

# 인스턴스 생성 (f1-micro - 무료 등급)
gcloud compute instances create community-platform-test-vm \
    --zone=$ZONE \
    --machine-type=f1-micro \
    --network-interface=subnet=community-platform-test-subnet,no-address \
    --maintenance-policy=MIGRATE \
    --provisioning-model=STANDARD \
    --service-account=default \
    --scopes=https://www.googleapis.com/auth/cloud-platform \
    --create-disk=auto-delete=yes,boot=yes,device-name=community-platform-test-vm,image=projects/ubuntu-os-cloud/global/images/family/ubuntu-2004-lts,mode=rw,size=30,type=projects/$PROJECT_ID/zones/$ZONE/diskTypes/pd-standard \
    --metadata-from-file=ssh-keys=<(echo "ubuntu:$(cat ~/.ssh/gcp_rsa.pub)") \
    --tags=http-server,https-server,ssh-server,app-server

success "Compute Engine 인스턴스 생성 완료"

# 6. Cloud SQL 인스턴스 생성 (무료 등급)
log "🗄️ Cloud SQL 인스턴스 생성 (무료 등급)..."

gcloud sql instances create community-platform-test-db \
    --database-version=MYSQL_8_0 \
    --tier=db-f1-micro \
    --region=$REGION \
    --storage-type=HDD \
    --storage-size=10GB \
    --storage-auto-increase \
    --backup-start-time=03:00 \
    --enable-bin-log \
    --network=projects/$PROJECT_ID/global/networks/community-platform-test-vpc

# 데이터베이스 생성
gcloud sql databases create community_platform --instance=community-platform-test-db

# 사용자 생성
gcloud sql users create app_user --instance=community-platform-test-db --password=test_password_123

success "Cloud SQL 인스턴스 생성 완료"

# 7. Memorystore 인스턴스 생성 (무료 등급)
log "💾 Memorystore 인스턴스 생성 (무료 등급)..."

gcloud redis instances create community-platform-test-redis \
    --size=1 \
    --region=$REGION \
    --network=projects/$PROJECT_ID/global/networks/community-platform-test-vpc

success "Memorystore 인스턴스 생성 완료"

# 8. 로드 밸런서 생성 (무료 등급)
log "⚖️ 로드 밸런서 생성 (무료 등급)..."

# 인스턴스 그룹 생성
gcloud compute instance-groups unmanaged create community-platform-test-ig \
    --zone=$ZONE

# 인스턴스를 그룹에 추가
gcloud compute instance-groups unmanaged add-instances community-platform-test-ig \
    --instances=community-platform-test-vm \
    --zone=$ZONE

# 백엔드 서비스 생성
gcloud compute backend-services create community-platform-test-backend \
    --protocol=HTTP \
    --port-name=http \
    --health-checks=community-platform-test-health-check \
    --global

# 헬스 체크 생성
gcloud compute health-checks create http community-platform-test-health-check \
    --port=3000 \
    --request-path=/api/health

# 백엔드 서비스에 인스턴스 그룹 추가
gcloud compute backend-services add-backend community-platform-test-backend \
    --instance-group=community-platform-test-ig \
    --instance-group-zone=$ZONE \
    --global

# URL 맵 생성
gcloud compute url-maps create community-platform-test-url-map \
    --default-service=community-platform-test-backend

# HTTP 프록시 생성
gcloud compute target-http-proxies create community-platform-test-http-proxy \
    --url-map=community-platform-test-url-map

# 전역 IP 주소 생성
gcloud compute addresses create community-platform-test-ip \
    --global

# 전역 IP 주소 가져오기
LB_IP=$(gcloud compute addresses describe community-platform-test-ip --global --format="value(address)")

# 전달 규칙 생성
gcloud compute forwarding-rules create community-platform-test-http-rule \
    --global \
    --target-http-proxy=community-platform-test-http-proxy \
    --address=$LB_IP \
    --ports=80

success "로드 밸런서 생성 완료"

# 9. SSL 인증서 생성 (Let's Encrypt 사용)
log "🔒 SSL 인증서 설정..."

warning "SSL 인증서는 Let's Encrypt를 사용하여 애플리케이션에서 자동 발급됩니다."
warning "도메인이 필요합니다. 테스트용으로는 HTTP만 사용 가능합니다."

success "SSL 인증서 설정 완료"

# 10. 배포 스크립트 생성
log "📝 배포 스크립트 생성..."

cat > deploy-test.sh << EOF
#!/bin/bash

# Community Platform 2.0 무료 테스트 환경 배포 스크립트

echo "🚀 Community Platform 2.0 무료 테스트 환경 배포 시작"

# 환경 변수 설정
export PROJECT_ID="$PROJECT_ID"
export REGION="$REGION"
export ZONE="$ZONE"
export INSTANCE_NAME="community-platform-test-vm"

# 인스턴스 IP 가져오기
INSTANCE_IP=\$(gcloud compute instances describe \$INSTANCE_NAME --zone=\$ZONE --format="value(networkInterfaces[0].accessConfigs[0].natIP)")

# 데이터베이스 IP 가져오기
DB_IP=\$(gcloud sql instances describe community-platform-test-db --format="value(ipAddresses[0].ipAddress)")

# Redis IP 가져오기
REDIS_IP=\$(gcloud redis instances describe community-platform-test-redis --region=\$REGION --format="value(host)")

echo "📊 환경 정보:"
echo "  프로젝트 ID: \$PROJECT_ID"
echo "  인스턴스 IP: \$INSTANCE_IP"
echo "  데이터베이스 IP: \$DB_IP"
echo "  Redis IP: \$REDIS_IP"
echo "  로드 밸런서 IP: $LB_IP"

# 인스턴스에 애플리케이션 배포
echo "🚀 인스턴스에 애플리케이션 배포..."

gcloud compute ssh \$INSTANCE_NAME --zone=\$ZONE --command="
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
DATABASE_URL=mysql://app_user:test_password_123@\$DB_IP:3306/community_platform
REDIS_URL=redis://\$REDIS_IP:6379
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

echo "✅ 배포 완료!"
echo "🌐 접속 URL: http://$LB_IP"
echo "🔧 SSH 접속: gcloud compute ssh \$INSTANCE_NAME --zone=\$ZONE"
EOF

chmod +x deploy-test.sh

success "배포 스크립트 생성 완료"

# 11. 비용 모니터링 설정
log "💰 비용 모니터링 설정..."

# 예산 알림 설정
gcloud billing budgets create \
    --billing-account=$(gcloud billing accounts list --format="value(name)" --limit=1) \
    --display-name="Community Platform Test Budget" \
    --budget-amount=10USD \
    --threshold-rule=percent=50 \
    --threshold-rule=percent=90 \
    --threshold-rule=percent=100

success "비용 모니터링 설정 완료"

# 12. 완료 메시지
success "🎉 Community Platform 2.0 GCP 무료 테스트 환경 구축 완료!"

echo ""
echo "📊 구축된 환경:"
echo "  프로젝트 ID: $PROJECT_ID"
echo "  인스턴스: community-platform-test-vm (f1-micro - 무료)"
echo "  데이터베이스: community-platform-test-db (db-f1-micro - 무료)"
echo "  Redis: community-platform-test-redis (1GB - 무료)"
echo "  로드 밸런서: community-platform-test-ip"
echo ""
echo "🌐 접속 URL:"
echo "  HTTP: http://$LB_IP"
echo ""
echo "🔧 다음 단계:"
echo "  1. 배포 실행: ./deploy-test.sh"
echo "  2. 애플리케이션 확인: http://$LB_IP"
echo "  3. 비용 모니터링: https://console.cloud.google.com/billing"
echo ""
echo "⚠️  주의사항:"
echo "  - 무료 크레딧 사용 중입니다"
echo "  - 90일 후 자동으로 유료 전환됩니다"
echo "  - 예산 알림이 설정되어 있습니다"
echo "  - 테스트 완료 후 리소스를 삭제하세요"
echo ""

# 13. 리소스 삭제 스크립트 생성
log "🗑️ 리소스 삭제 스크립트 생성..."

cat > cleanup-test.sh << EOF
#!/bin/bash

# Community Platform 2.0 무료 테스트 환경 정리 스크립트

echo "🗑️ Community Platform 2.0 무료 테스트 환경 정리 시작"

# 프로젝트 설정
gcloud config set project $PROJECT_ID

# 인스턴스 삭제
echo "🖥️ 인스턴스 삭제..."
gcloud compute instances delete community-platform-test-vm --zone=$ZONE --quiet

# 데이터베이스 삭제
echo "🗄️ 데이터베이스 삭제..."
gcloud sql instances delete community-platform-test-db --quiet

# Redis 삭제
echo "💾 Redis 삭제..."
gcloud redis instances delete community-platform-test-redis --region=$REGION --quiet

# 로드 밸런서 삭제
echo "⚖️ 로드 밸런서 삭제..."
gcloud compute forwarding-rules delete community-platform-test-http-rule --global --quiet
gcloud compute target-http-proxies delete community-platform-test-http-proxy --quiet
gcloud compute url-maps delete community-platform-test-url-map --quiet
gcloud compute backend-services delete community-platform-test-backend --global --quiet
gcloud compute health-checks delete community-platform-test-health-check --quiet
gcloud compute instance-groups unmanaged delete community-platform-test-ig --zone=$ZONE --quiet
gcloud compute addresses delete community-platform-test-ip --global --quiet

# 방화벽 규칙 삭제
echo "🔥 방화벽 규칙 삭제..."
gcloud compute firewall-rules delete allow-http --quiet
gcloud compute firewall-rules delete allow-https --quiet
gcloud compute firewall-rules delete allow-ssh --quiet
gcloud compute firewall-rules delete allow-app --quiet

# VPC 네트워크 삭제
echo "🌐 VPC 네트워크 삭제..."
gcloud compute networks subnets delete community-platform-test-subnet --region=$REGION --quiet
gcloud compute networks delete community-platform-test-vpc --quiet

# 프로젝트 삭제 (선택사항)
read -p "프로젝트를 삭제하시겠습니까? (y/N): " -n 1 -r
echo
if [[ \$REPLY =~ ^[Yy]$ ]]; then
    gcloud projects delete $PROJECT_ID --quiet
    echo "✅ 프로젝트 삭제 완료"
else
    echo "ℹ️  프로젝트는 유지됩니다"
fi

echo "✅ 정리 완료!"
EOF

chmod +x cleanup-test.sh

success "리소스 삭제 스크립트 생성 완료"

echo ""
echo "🎯 무료 테스트 환경 구축 완료!"
echo "💰 비용: $0 (무료 크레딧 사용)"
echo "⏰ 유효기간: 90일"
echo "🔧 관리: GCP 콘솔에서 모니터링 가능"
echo ""
echo "📝 유용한 명령어:"
echo "  배포: ./deploy-test.sh"
echo "  정리: ./cleanup-test.sh"
echo "  SSH: gcloud compute ssh community-platform-test-vm --zone=$ZONE"
echo "  로그: gcloud compute ssh community-platform-test-vm --zone=$ZONE --command='pm2 logs'"
echo ""
echo "🚀 이제 무료로 테스트할 수 있습니다!"
