#!/bin/bash

echo "🔧 모니터링 시스템 시작..."

# Docker Compose로 모니터링 스택 시작
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d

echo "⏳ 서비스 시작 대기 중..."
sleep 30

echo "📊 모니터링 서비스 상태 확인..."
docker-compose -f docker-compose.monitoring.yml ps

echo "🌐 모니터링 서비스 접속 정보:"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3000 (admin/admin123)"
echo "  - Kibana: http://localhost:5601"
echo "  - Jaeger: http://localhost:16686"
echo "  - Uptime Kuma: http://localhost:3001"

echo "✅ 모니터링 시스템 시작 완료!"
