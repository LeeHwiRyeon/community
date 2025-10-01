#!/bin/bash

echo "🛑 모니터링 시스템 중지..."

cd monitoring
docker-compose -f docker-compose.monitoring.yml down

echo "✅ 모니터링 시스템 중지 완료!"
