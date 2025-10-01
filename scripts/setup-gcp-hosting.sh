#!/bin/bash

# Community Platform 2.0 GCP 호스팅 설정 스크립트
# 사용법: ./scripts/setup-gcp-hosting.sh [project-id] [domain-name]

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
DOMAIN_NAME=${2:-"community-platform.com"}
REGION="asia-northeast3"
ZONE="asia-northeast3-a"
MACHINE_TYPE="e2-standard-4"
BOOT_DISK_SIZE="100"
BOOT_DISK_TYPE="pd-ssd"

log "🌐 Community Platform 2.0 GCP 호스팅 설정 시작"
log "프로젝트 ID: $PROJECT_ID"
log "도메인: $DOMAIN_NAME"
log "리전: $REGION"

# 1. GCP CLI 설치 확인
log "📋 GCP CLI 설치 확인..."

if ! command -v gcloud &> /dev/null; then
    error "GCP CLI가 설치되지 않았습니다."
    log "다음 명령어로 설치하세요:"
    log "curl https://sdk.cloud.google.com | bash"
    log "exec -l $SHELL"
    exit 1
fi

success "GCP CLI 확인 완료"

# 2. GCP 인증 확인
log "🔐 GCP 인증 확인..."

if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    warning "GCP 인증이 필요합니다."
    gcloud auth login
fi

success "GCP 인증 확인 완료"

# 3. 프로젝트 설정
log "📁 프로젝트 설정..."

# 프로젝트 생성 (이미 존재하면 무시)
gcloud projects create $PROJECT_ID --name="Community Platform 2.0" || true

# 프로젝트 선택
gcloud config set project $PROJECT_ID

# 필요한 API 활성화
log "🔧 필요한 API 활성화..."

gcloud services enable compute.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable redis.googleapis.com
gcloud services enable dns.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com

success "API 활성화 완료"

# 4. VPC 네트워크 생성
log "🌐 VPC 네트워크 생성..."

# VPC 생성
gcloud compute networks create community-platform-vpc \
    --subnet-mode=custom \
    --description="Community Platform 2.0 VPC"

# 서브넷 생성
gcloud compute networks subnets create community-platform-subnet \
    --network=community-platform-vpc \
    --range=10.0.0.0/24 \
    --region=$REGION

# 방화벽 규칙 생성
gcloud compute firewall-rules create allow-http \
    --network=community-platform-vpc \
    --allow=tcp:80 \
    --source-ranges=0.0.0.0/0 \
    --description="Allow HTTP traffic"

gcloud compute firewall-rules create allow-https \
    --network=community-platform-vpc \
    --allow=tcp:443 \
    --source-ranges=0.0.0.0/0 \
    --description="Allow HTTPS traffic"

gcloud compute firewall-rules create allow-ssh \
    --network=community-platform-vpc \
    --allow=tcp:22 \
    --source-ranges=0.0.0.0/0 \
    --description="Allow SSH traffic"

gcloud compute firewall-rules create allow-app \
    --network=community-platform-vpc \
    --allow=tcp:3000 \
    --source-ranges=0.0.0.0/0 \
    --description="Allow application traffic"

success "VPC 네트워크 생성 완료"

# 5. Compute Engine 인스턴스 생성
log "🖥️ Compute Engine 인스턴스 생성..."

# SSH 키 생성 (이미 존재하면 무시)
if [ ! -f ~/.ssh/gcp_rsa ]; then
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/gcp_rsa -N ""
fi

# 맥PC용 SSH 키 경로 설정
if [[ "$OSTYPE" == "darwin"* ]]; then
    SSH_KEY_PATH="$(cat ~/.ssh/gcp_rsa.pub)"
    log "맥PC 환경 감지: SSH 키 경로 설정 완료"
else
    SSH_KEY_PATH="ubuntu:$(cat ~/.ssh/gcp_rsa.pub)"
fi

# 인스턴스 생성
gcloud compute instances create community-platform-vm \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --network-interface=subnet=community-platform-subnet,no-address \
    --maintenance-policy=MIGRATE \
    --provisioning-model=STANDARD \
    --service-account=default \
    --scopes=https://www.googleapis.com/auth/cloud-platform \
    --create-disk=auto-delete=yes,boot=yes,device-name=community-platform-vm,image=projects/ubuntu-os-cloud/global/images/family/ubuntu-2004-lts,mode=rw,size=$BOOT_DISK_SIZE,type=projects/$PROJECT_ID/zones/$ZONE/diskTypes/$BOOT_DISK_TYPE \
    --metadata-from-file=ssh-keys=<(echo "$SSH_KEY_PATH")

success "Compute Engine 인스턴스 생성 완료"

# 6. Cloud SQL 인스턴스 생성
log "🗄️ Cloud SQL 인스턴스 생성..."

# Cloud SQL 인스턴스 생성
gcloud sql instances create community-platform-db \
    --database-version=MYSQL_8_0 \
    --tier=db-standard-2 \
    --region=$REGION \
    --storage-type=SSD \
    --storage-size=100GB \
    --storage-auto-increase \
    --backup-start-time=03:00 \
    --enable-bin-log \
    --maintenance-window-day=SUN \
    --maintenance-window-hour=04 \
    --network=projects/$PROJECT_ID/global/networks/community-platform-vpc

# 데이터베이스 생성
gcloud sql databases create community_platform \
    --instance=community-platform-db

# 사용자 생성
gcloud sql users create app_user \
    --instance=community-platform-db \
    --password=$(openssl rand -base64 32)

success "Cloud SQL 인스턴스 생성 완료"

# 7. Memorystore (Redis) 인스턴스 생성
log "🔴 Memorystore (Redis) 인스턴스 생성..."

gcloud redis instances create community-platform-redis \
    --size=4 \
    --region=$REGION \
    --network=projects/$PROJECT_ID/global/networks/community-platform-vpc \
    --redis-version=REDIS_6_X

success "Memorystore 인스턴스 생성 완료"

# 8. 로드 밸런서 설정
log "⚖️ 로드 밸런서 설정..."

# 인스턴스 그룹 생성
gcloud compute instance-groups unmanaged create community-platform-ig \
    --zone=$ZONE

# 인스턴스를 그룹에 추가
gcloud compute instance-groups unmanaged add-instances community-platform-ig \
    --instances=community-platform-vm \
    --zone=$ZONE

# 헬스 체크 생성
gcloud compute health-checks create http community-platform-health-check \
    --port=3000 \
    --request-path=/api/health

# 백엔드 서비스 생성
gcloud compute backend-services create community-platform-backend \
    --protocol=HTTP \
    --port-name=http \
    --health-checks=community-platform-health-check \
    --global

# 백엔드를 백엔드 서비스에 추가
gcloud compute backend-services add-backend community-platform-backend \
    --instance-group=community-platform-ig \
    --instance-group-zone=$ZONE \
    --global

# URL 맵 생성
gcloud compute url-maps create community-platform-url-map \
    --default-service=community-platform-backend

# HTTP 프록시 생성
gcloud compute target-http-proxies create community-platform-http-proxy \
    --url-map=community-platform-url-map

# 전역 포워딩 규칙 생성
gcloud compute forwarding-rules create community-platform-http-rule \
    --global \
    --target-http-proxy=community-platform-http-proxy \
    --ports=80

success "로드 밸런서 설정 완료"

# 9. SSL 인증서 설정
log "🔒 SSL 인증서 설정..."

# 관리형 SSL 인증서 생성
gcloud compute ssl-certificates create community-platform-ssl-cert \
    --domains=$DOMAIN_NAME,www.$DOMAIN_NAME \
    --global

# HTTPS 프록시 생성
gcloud compute target-https-proxies create community-platform-https-proxy \
    --url-map=community-platform-url-map \
    --ssl-certificates=community-platform-ssl-cert

# HTTPS 포워딩 규칙 생성
gcloud compute forwarding-rules create community-platform-https-rule \
    --global \
    --target-https-proxy=community-platform-https-proxy \
    --ports=443

success "SSL 인증서 설정 완료"

# 10. DNS 설정 (Cloud DNS)
log "🌍 DNS 설정..."

# DNS 존 생성
gcloud dns managed-zones create community-platform-zone \
    --dns-name=$DOMAIN_NAME \
    --description="Community Platform 2.0 DNS Zone"

# 로드 밸런서 IP 가져오기
LB_IP=$(gcloud compute forwarding-rules describe community-platform-http-rule \
    --global \
    --format="value(IPAddress)")

# A 레코드 생성
gcloud dns record-sets create $DOMAIN_NAME. \
    --zone=community-platform-zone \
    --type=A \
    --ttl=300 \
    --rrdatas=$LB_IP

gcloud dns record-sets create www.$DOMAIN_NAME. \
    --zone=community-platform-zone \
    --type=A \
    --ttl=300 \
    --rrdatas=$LB_IP

success "DNS 설정 완료"

# 11. 배포 스크립트 생성
log "📝 배포 스크립트 생성..."

cat > deploy-to-gcp.sh << EOF
#!/bin/bash

# Community Platform 2.0 GCP 배포 스크립트

# 환경 변수
PROJECT_ID="$PROJECT_ID"
INSTANCE_NAME="community-platform-vm"
ZONE="$ZONE"
DOMAIN="$DOMAIN_NAME"

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "\${BLUE}[\$(date +'%Y-%m-%d %H:%M:%S')]\${NC} \$1"
}

success() {
    echo -e "\${GREEN}[\$(date +'%Y-%m-%d %H:%M:%S')] ✅\${NC} \$1"
}

log "🚀 Community Platform 2.0 GCP 배포 시작"

# 1. 애플리케이션 빌드
log "🔨 애플리케이션 빌드..."
npm run build:prod

# 2. Docker 이미지 빌드
log "🐳 Docker 이미지 빌드..."
docker build -t community-platform:latest .

# 3. 이미지를 GCP Container Registry에 푸시
log "📤 이미지 푸시..."
docker tag community-platform:latest gcr.io/\$PROJECT_ID/community-platform:latest
docker push gcr.io/\$PROJECT_ID/community-platform:latest

# 4. 인스턴스에 배포
log "🚀 인스턴스에 배포..."
gcloud compute ssh \$INSTANCE_NAME --zone=\$ZONE --command="
    # Docker 이미지 풀
    docker pull gcr.io/\$PROJECT_ID/community-platform:latest
    
    # 기존 컨테이너 중지 및 제거
    docker stop community-platform || true
    docker rm community-platform || true
    
    # 새 컨테이너 실행
    docker run -d \\
        --name community-platform \\
        --restart=unless-stopped \\
        -p 3000:3000 \\
        -e NODE_ENV=production \\
        -e DATABASE_URL=\$DATABASE_URL \\
        -e REDIS_URL=\$REDIS_URL \\
        gcr.io/\$PROJECT_ID/community-platform:latest
"

success "배포 완료!"
log "🌐 애플리케이션 URL: https://\$DOMAIN"
log "📊 모니터링: https://console.cloud.google.com/compute/instances"

EOF

chmod +x deploy-to-gcp.sh

success "배포 스크립트 생성 완료"

# 12. 설정 정보 출력
log "📋 설정 정보 출력..."

echo ""
echo "🎉 Community Platform 2.0 GCP 호스팅 설정 완료!"
echo ""
echo "📊 설정 정보:"
echo "  프로젝트 ID: $PROJECT_ID"
echo "  도메인: $DOMAIN_NAME"
echo "  리전: $REGION"
echo "  인스턴스: community-platform-vm"
echo "  데이터베이스: community-platform-db"
echo "  Redis: community-platform-redis"
echo "  로드 밸런서 IP: $LB_IP"
echo ""
echo "🔧 다음 단계:"
echo "  1. 도메인 DNS 설정을 GCP로 변경"
echo "  2. SSL 인증서 발급 대기 (최대 24시간)"
echo "  3. ./deploy-to-gcp.sh 실행하여 애플리케이션 배포"
echo ""
echo "📚 유용한 명령어:"
echo "  인스턴스 SSH: gcloud compute ssh community-platform-vm --zone=$ZONE"
echo "  로그 확인: gcloud compute ssh community-platform-vm --zone=$ZONE --command='docker logs community-platform'"
echo "  인스턴스 재시작: gcloud compute instances reset community-platform-vm --zone=$ZONE"
echo ""

success "GCP 호스팅 설정 완료!"

log "🌐 Community Platform 2.0이 GCP에서 실행될 준비가 완료되었습니다!"
log "다음 단계: ./deploy-to-gcp.sh 실행하여 애플리케이션을 배포하세요."
