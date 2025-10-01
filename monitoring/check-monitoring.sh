#!/bin/bash

echo "📊 모니터링 시스템 상태 확인..."

cd monitoring

echo "🐳 Docker 컨테이너 상태:"
docker-compose -f docker-compose.monitoring.yml ps

echo ""
echo "🌐 서비스 접속 테스트:"
echo "  - Prometheus: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:9090)"
echo "  - Grafana: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)"
echo "  - Kibana: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:5601)"
echo "  - Jaeger: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:16686)"
echo "  - Uptime Kuma: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001)"

echo ""
echo "📈 메트릭 수집 상태:"
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

echo ""
echo "✅ 모니터링 상태 확인 완료!"
