#!/bin/bash

# 프로덕션 배포 스크립트
set -e

echo "🚀 프로덕션 배포 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 함수 정의
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 환경 변수 확인
if [ ! -f ".env.production" ]; then
    log_error ".env.production 파일이 없습니다. env.production.template을 복사하고 설정하세요."
    exit 1
fi

# Docker 설치 확인
if ! command -v docker &> /dev/null; then
    log_error "Docker가 설치되지 않았습니다."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose가 설치되지 않았습니다."
    exit 1
fi

# 1. 기존 컨테이너 중지 및 제거
log_info "기존 컨테이너 중지 및 제거 중..."
docker-compose -f docker-compose.production.yml down --remove-orphans

# 2. 이미지 빌드
log_info "Docker 이미지 빌드 중..."
docker-compose -f docker-compose.production.yml build --no-cache

# 3. 데이터베이스 마이그레이션 (필요한 경우)
log_info "데이터베이스 마이그레이션 실행 중..."
# docker-compose -f docker-compose.production.yml run --rm backend npm run migrate

# 4. 서비스 시작
log_info "서비스 시작 중..."
docker-compose -f docker-compose.production.yml up -d

# 5. 헬스 체크
log_info "헬스 체크 실행 중..."
sleep 30

# 백엔드 헬스 체크
if curl -f http://localhost:50000/api/health-check > /dev/null 2>&1; then
    log_info "✅ 백엔드 서비스가 정상적으로 시작되었습니다."
else
    log_error "❌ 백엔드 서비스 시작에 실패했습니다."
    docker-compose -f docker-compose.production.yml logs backend
    exit 1
fi

# 프론트엔드 헬스 체크
if curl -f http://localhost > /dev/null 2>&1; then
    log_info "✅ 프론트엔드 서비스가 정상적으로 시작되었습니다."
else
    log_warn "⚠️ 프론트엔드 서비스 시작에 문제가 있을 수 있습니다."
fi

# 6. 서비스 상태 확인
log_info "서비스 상태 확인 중..."
docker-compose -f docker-compose.production.yml ps

# 7. 로그 확인
log_info "최근 로그 확인 중..."
docker-compose -f docker-compose.production.yml logs --tail=50

log_info "🎉 프로덕션 배포가 완료되었습니다!"
log_info "📍 서비스 URL:"
log_info "  - 프론트엔드: http://localhost"
log_info "  - 백엔드 API: http://localhost:50000"
log_info "  - Prometheus: http://localhost:9090"
log_info "  - Grafana: http://localhost:3000"

# 8. 모니터링 설정 안내
log_info "📊 모니터링 설정:"
log_info "  - Grafana 로그인: admin / ${GRAFANA_PASSWORD:-admin}"
log_info "  - Prometheus 메트릭: http://localhost:9090/metrics"

echo ""
log_info "🔧 유용한 명령어:"
echo "  - 로그 확인: docker-compose -f docker-compose.production.yml logs -f"
echo "  - 서비스 중지: docker-compose -f docker-compose.production.yml down"
echo "  - 서비스 재시작: docker-compose -f docker-compose.production.yml restart"
echo "  - 컨테이너 상태: docker-compose -f docker-compose.production.yml ps"
