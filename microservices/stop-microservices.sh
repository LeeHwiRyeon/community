#!/bin/bash

echo "🛑 마이크로서비스 아키텍처 중지..."

cd microservices
docker-compose -f docker-compose.microservices.yml down

echo "✅ 마이크로서비스 아키텍처 중지 완료!"
