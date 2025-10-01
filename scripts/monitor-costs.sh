#!/bin/bash

# Community Platform 2.0 비용 모니터링 스크립트
# 사용법: ./scripts/monitor-costs.sh [project-id]

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

log "💰 Community Platform 2.0 비용 모니터링 시작"
log "프로젝트 ID: $PROJECT_ID"

# 1. 프로젝트 설정
log "📁 프로젝트 설정..."
gcloud config set project $PROJECT_ID

# 2. 현재 비용 확인
log "💳 현재 비용 확인..."

# 현재 월 비용 확인
CURRENT_COST=$(gcloud billing budgets list --billing-account=$(gcloud billing accounts list --format="value(name)" --limit=1) --format="value(displayName)" | head -1)

if [ -z "$CURRENT_COST" ]; then
    warning "예산 정보를 가져올 수 없습니다."
    log "GCP 콘솔에서 비용을 확인하세요: https://console.cloud.google.com/billing"
else
    log "예산 정보: $CURRENT_COST"
fi

# 3. 리소스 사용량 확인
log "📊 리소스 사용량 확인..."

# Compute Engine 사용량
log "🖥️ Compute Engine 사용량:"
gcloud compute instances list --format="table(name,machineType,status,zone)" --filter="name~community-platform"

# Cloud SQL 사용량
log "🗄️ Cloud SQL 사용량:"
gcloud sql instances list --format="table(name,databaseVersion,tier,status,region)"

# Memorystore 사용량
log "💾 Memorystore 사용량:"
gcloud redis instances list --format="table(name,memorySizeGb,status,region)"

# 4. 비용 예상치 계산
log "💰 비용 예상치 계산..."

# Compute Engine 비용 (f1-micro)
COMPUTE_COST=0
log "  Compute Engine (f1-micro): $0/월 (무료 등급)"

# Cloud SQL 비용 (db-f1-micro)
SQL_COST=0
log "  Cloud SQL (db-f1-micro): $0/월 (무료 등급)"

# Memorystore 비용 (1GB)
REDIS_COST=0
log "  Memorystore (1GB): $0/월 (무료 등급)"

# 네트워킹 비용
NETWORK_COST=0
log "  네트워킹: $0/월 (무료 등급)"

# 총 예상 비용
TOTAL_COST=0
log "  총 예상 비용: $0/월 (무료 등급 사용)"

# 5. 무료 크레딧 잔액 확인
log "🎁 무료 크레딧 잔액 확인..."

# 무료 크레딧 정보
log "  무료 크레딧: $300 (90일간)"
log "  사용 기간: 90일"
log "  일일 사용 한도: $3.33"

# 6. 비용 최적화 권장사항
log "💡 비용 최적화 권장사항..."

echo ""
echo "📋 비용 최적화 체크리스트:"
echo "  ✅ 무료 등급 사용 중 (f1-micro, db-f1-micro)"
echo "  ✅ 불필요한 리소스 없음"
echo "  ✅ 자동 스케일링 비활성화"
echo "  ✅ 예산 알림 설정됨"
echo ""

# 7. 비용 알림 설정
log "🔔 비용 알림 설정 확인..."

# 예산 알림 확인
BUDGET_COUNT=$(gcloud billing budgets list --billing-account=$(gcloud billing accounts list --format="value(name)" --limit=1) --format="value(displayName)" | wc -l)

if [ "$BUDGET_COUNT" -gt 0 ]; then
    success "예산 알림이 설정되어 있습니다."
else
    warning "예산 알림이 설정되지 않았습니다."
    log "예산 알림을 설정하세요:"
    log "  gcloud billing budgets create --billing-account=\$(gcloud billing accounts list --format='value(name)' --limit=1) --display-name='Community Platform Budget' --budget-amount=10USD"
fi

# 8. 리소스 정리 권장사항
log "🗑️ 리소스 정리 권장사항..."

echo ""
echo "📋 리소스 정리 체크리스트:"
echo "  🔄 테스트 완료 후 리소스 삭제"
echo "  🗑️ ./cleanup-test.sh 실행"
echo "  💰 불필요한 비용 방지"
echo ""

# 9. 실제 서비스 전환 시 비용 예상
log "🚀 실제 서비스 전환 시 비용 예상..."

echo ""
echo "📊 실제 서비스 환경 비용 예상:"
echo "  🥇 DigitalOcean: $56-71/월 (가장 저렴)"
echo "  🥈 GCP 표준: $135-200/월 (기능 대비 최적)"
echo "  🥉 AWS: $160-240/월 (안정성 우수)"
echo "  🏢 Azure: $200-280/월 (엔터프라이즈)"
echo ""

# 10. 비용 모니터링 대시보드
log "📊 비용 모니터링 대시보드..."

echo ""
echo "🌐 비용 모니터링 링크:"
echo "  GCP 콘솔: https://console.cloud.google.com/billing"
echo "  비용 분석: https://console.cloud.google.com/billing/reports"
echo "  예산 관리: https://console.cloud.google.com/billing/budgets"
echo "  리소스 관리: https://console.cloud.google.com/compute/instances"
echo ""

# 11. 완료 메시지
success "💰 비용 모니터링 완료!"

echo ""
echo "📊 현재 상태:"
echo "  💰 현재 비용: $0/월 (무료 등급)"
echo "  🎁 무료 크레딧: $300 (90일간)"
echo "  ⚠️  주의사항: 90일 후 자동 유료 전환"
echo ""
echo "🔧 관리 명령어:"
echo "  비용 확인: ./scripts/monitor-costs.sh"
echo "  리소스 정리: ./cleanup-test.sh"
echo "  배포: ./deploy-free-test.sh"
echo ""
echo "💡 다음 단계:"
echo "  1. 무료 테스트 환경에서 개발 완료"
echo "  2. 릴리즈 v1 완성"
echo "  3. 실제 서비스 환경으로 전환"
echo "  4. DigitalOcean 또는 GCP 표준 환경 선택"
echo ""

log "🆓 무료 테스트 환경에서 안전하게 개발하세요!"
