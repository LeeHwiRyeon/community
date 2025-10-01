#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 모니터링 시스템 설정 시작...');

// 1. Prometheus 설정 검증
console.log('📊 Prometheus 설정 검증...');
try {
    const prometheusConfig = fs.readFileSync('monitoring/prometheus/prometheus.yml', 'utf8');
    console.log('✅ Prometheus 설정 파일 확인됨');
} catch (error) {
    console.error('❌ Prometheus 설정 파일을 찾을 수 없습니다:', error.message);
    process.exit(1);
}

// 2. Grafana 대시보드 설정 검증
console.log('📈 Grafana 대시보드 설정 검증...');
const dashboardFiles = [
    'monitoring/grafana/dashboards/community-overview.json',
    'monitoring/grafana/dashboards/community-performance.json',
    'monitoring/grafana/dashboards/community-security.json'
];

for (const file of dashboardFiles) {
    try {
        const dashboard = JSON.parse(fs.readFileSync(file, 'utf8'));
        console.log(`✅ ${file} 대시보드 설정 확인됨`);
    } catch (error) {
        console.error(`❌ ${file} 대시보드 설정 오류:`, error.message);
    }
}

// 3. ELK Stack 설정 검증
console.log('📝 ELK Stack 설정 검증...');
try {
    const logstashConfig = fs.readFileSync('monitoring/elk/logstash/pipeline/community.conf', 'utf8');
    const filebeatConfig = fs.readFileSync('monitoring/elk/filebeat/filebeat.yml', 'utf8');
    console.log('✅ ELK Stack 설정 파일 확인됨');
} catch (error) {
    console.error('❌ ELK Stack 설정 파일을 찾을 수 없습니다:', error.message);
}

// 4. Jaeger 설정 검증
console.log('🔍 Jaeger 설정 검증...');
try {
    const jaegerConfig = fs.readFileSync('monitoring/jaeger/jaeger.yml', 'utf8');
    console.log('✅ Jaeger 설정 파일 확인됨');
} catch (error) {
    console.error('❌ Jaeger 설정 파일을 찾을 수 없습니다:', error.message);
}

// 5. Docker Compose 파일 생성
console.log('🐳 Docker Compose 파일 생성...');
const dockerComposeContent = `version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: community-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: community-grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    restart: unless-stopped

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    container_name: community-elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    restart: unless-stopped

  logstash:
    image: docker.elastic.co/logstash/logstash:8.8.0
    container_name: community-logstash
    volumes:
      - ./monitoring/elk/logstash:/usr/share/logstash/pipeline
    ports:
      - "5044:5044"
    depends_on:
      - elasticsearch
    restart: unless-stopped

  kibana:
    image: docker.elastic.co/kibana/kibana:8.8.0
    container_name: community-kibana
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch
    restart: unless-stopped

  filebeat:
    image: docker.elastic.co/beats/filebeat:8.8.0
    container_name: community-filebeat
    user: root
    volumes:
      - ./monitoring/elk/filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    depends_on:
      - logstash
    restart: unless-stopped

  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: community-jaeger
    ports:
      - "16686:16686"
      - "14268:14268"
    environment:
      - COLLECTOR_OTLP_ENABLED=true
    restart: unless-stopped

  uptime-kuma:
    image: louislam/uptime-kuma:1
    container_name: community-uptime-kuma
    ports:
      - "3001:3001"
    volumes:
      - uptime_kuma_data:/app/data
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
  elasticsearch_data:
  uptime_kuma_data:
`;

fs.writeFileSync('monitoring/docker-compose.monitoring.yml', dockerComposeContent);
console.log('✅ Docker Compose 파일 생성 완료');

// 6. 모니터링 시작 스크립트 생성
console.log('🚀 모니터링 시작 스크립트 생성...');
const startScript = `#!/bin/bash

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
`;

fs.writeFileSync('monitoring/start-monitoring.sh', startScript);
fs.chmodSync('monitoring/start-monitoring.sh', '755');
console.log('✅ 모니터링 시작 스크립트 생성 완료');

// 7. 모니터링 중지 스크립트 생성
console.log('🛑 모니터링 중지 스크립트 생성...');
const stopScript = `#!/bin/bash

echo "🛑 모니터링 시스템 중지..."

cd monitoring
docker-compose -f docker-compose.monitoring.yml down

echo "✅ 모니터링 시스템 중지 완료!"
`;

fs.writeFileSync('monitoring/stop-monitoring.sh', stopScript);
fs.chmodSync('monitoring/stop-monitoring.sh', '755');
console.log('✅ 모니터링 중지 스크립트 생성 완료');

// 8. 모니터링 상태 확인 스크립트 생성
console.log('📋 모니터링 상태 확인 스크립트 생성...');
const statusScript = `#!/bin/bash

echo "📊 모니터링 시스템 상태 확인..."

cd monitoring

echo "🐳 Docker 컨테이너 상태:"
docker-compose -f docker-compose.monitoring.yml ps

echo ""
echo "🌐 서비스 접속 테스트:"
echo "  - Prometheus: \$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9090)"
echo "  - Grafana: \$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)"
echo "  - Kibana: \$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5601)"
echo "  - Jaeger: \$(curl -s -o /dev/null -w "%{http_code}" http://localhost:16686)"
echo "  - Uptime Kuma: \$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001)"

echo ""
echo "📈 메트릭 수집 상태:"
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

echo ""
echo "✅ 모니터링 상태 확인 완료!"
`;

fs.writeFileSync('monitoring/check-monitoring.sh', statusScript);
fs.chmodSync('monitoring/check-monitoring.sh', '755');
console.log('✅ 모니터링 상태 확인 스크립트 생성 완료');

console.log('🎉 모니터링 시스템 설정 완료!');
console.log('');
console.log('📋 다음 단계:');
console.log('1. cd monitoring');
console.log('2. ./start-monitoring.sh');
console.log('3. 브라우저에서 http://localhost:3000 접속 (Grafana)');
console.log('4. admin/admin123으로 로그인');
console.log('5. 대시보드 확인');
