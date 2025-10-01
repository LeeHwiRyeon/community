#!/bin/bash

# 배포 검증 스크립트
set -e

echo "🔍 배포 검증 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

# 테스트 결과 카운터
PASSED=0
FAILED=0

# 테스트 함수
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"
    
    log_test "실행 중: $test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        if [ "$expected_status" = "success" ]; then
            log_info "✅ $test_name - 통과"
            ((PASSED++))
        else
            log_error "❌ $test_name - 예상과 다른 결과 (성공했지만 실패해야 함)"
            ((FAILED++))
        fi
    else
        if [ "$expected_status" = "failure" ]; then
            log_info "✅ $test_name - 통과 (예상된 실패)"
            ((PASSED++))
        else
            log_error "❌ $test_name - 실패"
            ((FAILED++))
        fi
    fi
}

# 1. 서비스 상태 확인
log_info "=== 서비스 상태 확인 ==="

run_test "Docker Compose 서비스 실행 확인" "docker-compose -f docker-compose.production.yml ps | grep -q 'Up'" "success"

run_test "백엔드 컨테이너 실행 확인" "docker ps | grep -q 'community-backend-prod'" "success"

run_test "프론트엔드 컨테이너 실행 확인" "docker ps | grep -q 'community-frontend-prod'" "success"

run_test "MySQL 컨테이너 실행 확인" "docker ps | grep -q 'community-mysql-prod'" "success"

run_test "Redis 컨테이너 실행 확인" "docker ps | grep -q 'community-redis-prod'" "success"

# 2. 포트 연결 확인
log_info "=== 포트 연결 확인 ==="

run_test "백엔드 포트 50000 연결 확인" "nc -z localhost 50000" "success"

run_test "프론트엔드 포트 80 연결 확인" "nc -z localhost 80" "success"

run_test "MySQL 포트 3306 연결 확인" "nc -z localhost 3306" "success"

run_test "Redis 포트 6379 연결 확인" "nc -z localhost 6379" "success"

# 3. API 엔드포인트 테스트
log_info "=== API 엔드포인트 테스트 ==="

run_test "Health Check API 테스트" "curl -f http://localhost:50000/api/health-check" "success"

run_test "Health API 테스트" "curl -f http://localhost:50000/api/health" "success"

run_test "API 문서 엔드포인트 테스트" "curl -f http://localhost:50000/api/docs" "success"

# 4. 프론트엔드 테스트
log_info "=== 프론트엔드 테스트 ==="

run_test "프론트엔드 메인 페이지 접근" "curl -f http://localhost" "success"

run_test "프론트엔드 정적 파일 서빙" "curl -f http://localhost/static/js/main.js" "success"

# 5. 데이터베이스 연결 테스트
log_info "=== 데이터베이스 연결 테스트 ==="

run_test "MySQL 연결 테스트" "docker exec community-mysql-prod mysql -u root -p${MYSQL_ROOT_PASSWORD:-root} -e 'SELECT 1'" "success"

run_test "Redis 연결 테스트" "docker exec community-redis-prod redis-cli -a ${REDIS_PASSWORD:-} ping" "success"

# 6. 보안 테스트
log_info "=== 보안 테스트 ==="

run_test "HTTPS 리다이렉트 테스트" "curl -I http://localhost | grep -q '301\|302'" "success"

run_test "보안 헤더 확인" "curl -I http://localhost | grep -q 'X-Frame-Options'" "success"

# 7. 성능 테스트
log_info "=== 성능 테스트 ==="

run_test "API 응답 시간 테스트 (< 1초)" "timeout 1 curl -f http://localhost:50000/api/health-check" "success"

run_test "프론트엔드 로딩 시간 테스트 (< 3초)" "timeout 3 curl -f http://localhost" "success"

# 8. 모니터링 서비스 테스트
log_info "=== 모니터링 서비스 테스트 ==="

run_test "Prometheus 연결 확인" "curl -f http://localhost:9090" "success"

run_test "Grafana 연결 확인" "curl -f http://localhost:3000" "success"

# 9. 로그 확인
log_info "=== 로그 확인 ==="

run_test "백엔드 로그 오류 확인" "! docker-compose -f docker-compose.production.yml logs backend | grep -i error" "success"

run_test "프론트엔드 로그 오류 확인" "! docker-compose -f docker-compose.production.yml logs frontend | grep -i error" "success"

# 결과 요약
echo ""
log_info "=== 검증 결과 요약 ==="
echo -e "✅ 통과: ${GREEN}$PASSED${NC}"
echo -e "❌ 실패: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    log_info "🎉 모든 검증이 통과했습니다! 배포가 성공적으로 완료되었습니다."
    exit 0
else
    log_error "⚠️ $FAILED 개의 검증이 실패했습니다. 로그를 확인하고 문제를 해결하세요."
    exit 1
fi
