#!/bin/bash

# 🔍 모니터링 시스템 설정 스크립트
# 사용법: ./scripts/monitoring-setup.sh [action]

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 로그 함수
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

ACTION=${1:-start}

case $ACTION in
    "start")
        log "🚀 모니터링 시스템 시작 중..."
        
        # 모니터링 디렉토리 생성
        mkdir -p monitoring/{prometheus/rules,grafana/{provisioning/{datasources,dashboards},dashboards},alertmanager,logstash}
        
        # Docker Compose로 모니터링 스택 시작
        docker-compose -f docker-compose.monitoring.yml up -d
        
        # 서비스 상태 확인
        log "⏳ 서비스 시작 대기 중..."
        sleep 30
        
        # 헬스 체크
        log "🏥 헬스 체크 중..."
        
        services=(
            "Prometheus:http://localhost:9090"
            "Grafana:http://localhost:3001"
            "Alertmanager:http://localhost:9093"
            "Jaeger:http://localhost:16686"
            "Kibana:http://localhost:5601"
            "Uptime Kuma:http://localhost:3002"
        )
        
        for service in "${services[@]}"; do
            name=$(echo $service | cut -d: -f1)
            url=$(echo $service | cut -d: -f2-)
            
            if curl -f -s "$url" > /dev/null 2>&1; then
                success "$name: ✅ 정상"
            else
                warning "$name: ⚠️ 연결 실패"
            fi
        done
        
        success "🎉 모니터링 시스템이 시작되었습니다!"
        log "📊 접속 URL:"
        log "  - Grafana: http://localhost:3001 (admin/admin123)"
        log "  - Prometheus: http://localhost:9090"
        log "  - Alertmanager: http://localhost:9093"
        log "  - Jaeger: http://localhost:16686"
        log "  - Kibana: http://localhost:5601"
        log "  - Uptime Kuma: http://localhost:3002"
        ;;
        
    "stop")
        log "🛑 모니터링 시스템 중지 중..."
        docker-compose -f docker-compose.monitoring.yml down
        success "모니터링 시스템이 중지되었습니다."
        ;;
        
    "restart")
        log "🔄 모니터링 시스템 재시작 중..."
        docker-compose -f docker-compose.monitoring.yml down
        docker-compose -f docker-compose.monitoring.yml up -d
        success "모니터링 시스템이 재시작되었습니다."
        ;;
        
    "status")
        log "📊 모니터링 시스템 상태:"
        docker-compose -f docker-compose.monitoring.yml ps
        ;;
        
    "logs")
        SERVICE=${2:-}
        if [ -n "$SERVICE" ]; then
            docker-compose -f docker-compose.monitoring.yml logs -f "$SERVICE"
        else
            docker-compose -f docker-compose.monitoring.yml logs -f
        fi
        ;;
        
    "backup")
        log "💾 모니터링 데이터 백업 중..."
        BACKUP_DIR="monitoring-backup-$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # Grafana 대시보드 백업
        docker-compose -f docker-compose.monitoring.yml exec grafana grafana-cli admin export-dashboard > "$BACKUP_DIR/grafana-dashboards.json" || true
        
        # Prometheus 설정 백업
        cp -r monitoring/prometheus "$BACKUP_DIR/"
        
        # Alertmanager 설정 백업
        cp -r monitoring/alertmanager "$BACKUP_DIR/"
        
        success "백업 완료: $BACKUP_DIR"
        ;;
        
    "cleanup")
        log "🧹 모니터링 데이터 정리 중..."
        docker-compose -f docker-compose.monitoring.yml down -v
        docker system prune -f
        success "모니터링 데이터가 정리되었습니다."
        ;;
        
    *)
        echo "사용법: $0 [start|stop|restart|status|logs|backup|cleanup]"
        echo ""
        echo "명령어:"
        echo "  start   - 모니터링 시스템 시작"
        echo "  stop    - 모니터링 시스템 중지"
        echo "  restart - 모니터링 시스템 재시작"
        echo "  status  - 서비스 상태 확인"
        echo "  logs    - 로그 확인 (서비스명 선택사항)"
        echo "  backup  - 데이터 백업"
        echo "  cleanup - 데이터 정리"
        exit 1
        ;;
esac
