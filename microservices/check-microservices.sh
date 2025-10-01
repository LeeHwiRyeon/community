#!/bin/bash

echo "📊 마이크로서비스 아키텍처 상태 확인..."

cd microservices

echo "🐳 Docker 컨테이너 상태:"
docker-compose -f docker-compose.microservices.yml ps

echo ""
echo "🌐 서비스 접속 테스트:"
echo "  - Kong API Gateway: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000)"
echo "  - Kong Admin: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001)"
echo "  - Consul UI: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8500)"
echo "  - Nginx Load Balancer: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:80)"
echo "  - User Service: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:5003/health)"
echo "  - Chat Service: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/health)"
echo "  - Notification Service: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:5002/health)"

echo ""
echo "📈 서비스 메트릭:"
echo "  - 사용자 서비스: $(curl -s http://localhost:5003/health | jq -r '.status')"
echo "  - 채팅 서비스: $(curl -s http://localhost:5001/health | jq -r '.status')"
echo "  - 알림 서비스: $(curl -s http://localhost:5002/health | jq -r '.status')"

echo ""
echo "✅ 마이크로서비스 상태 확인 완료!"
