#!/bin/bash

echo "🚀 마이크로서비스 아키텍처 시작..."

# Docker Compose로 마이크로서비스 스택 시작
cd microservices
docker-compose -f docker-compose.microservices.yml up -d

echo "⏳ 서비스 시작 대기 중..."
sleep 60

echo "📊 마이크로서비스 상태 확인..."
docker-compose -f docker-compose.microservices.yml ps

echo "🌐 마이크로서비스 접속 정보:"
echo "  - Kong API Gateway: http://localhost:8000"
echo "  - Kong Admin: http://localhost:8001"
echo "  - Consul UI: http://localhost:8500"
echo "  - Nginx Load Balancer: http://localhost:80"
echo "  - User Service: http://localhost:5003"
echo "  - Chat Service: http://localhost:5001"
echo "  - Notification Service: http://localhost:5002"

echo "✅ 마이크로서비스 아키텍처 시작 완료!"
