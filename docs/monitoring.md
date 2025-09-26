# 모니터링 시스템 가이드

## 개요

Community Hub는 헬스 체크와 메트릭 수집을 통해 시스템 상태를 모니터링합니다. Prometheus 메트릭을 지원하며, 응답 시간, 요청 수, 데이터베이스 상태 등을 실시간으로 모니터링할 수 있습니다.

## 헬스 체크 엔드포인트

### GET /api/health

시스템의 전반적인 건강 상태를 확인합니다.

**응답 예시:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5,
  "memory": {
    "rss": 104857600,
    "heapTotal": 67108864,
    "heapUsed": 45000000,
    "external": 2000000
  },
  "version": "1.0.0",
  "checks": {
    "database": "ok",
    "redis": "ok"
  }
}
```

**상태 코드:**
- `200`: 모든 컴포넌트 정상
- `503`: 하나 이상의 컴포넌트 비정상

## 메트릭 엔드포인트

### GET /api/metrics

Prometheus 형식의 메트릭을 제공합니다.

**샘플 메트릭:**
```
# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",route="/api/posts",status_code="200",le="0.1"} 150
http_request_duration_seconds_bucket{method="GET",route="/api/posts",status_code="200",le="0.5"} 180
...

# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/posts",status_code="200"} 200
```

## 모니터링 설정

### Prometheus 설정

`prometheus.yml`에 다음과 같이 추가:

```yaml
scrape_configs:
  - job_name: 'community-hub'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/api/metrics'
    scrape_interval: 15s
```

### Grafana 대시보드

Prometheus 메트릭을 활용한 Grafana 대시보드를 구성할 수 있습니다.

**주요 메트릭:**
- `http_request_duration_seconds`: HTTP 요청 응답 시간
- `http_requests_total`: HTTP 요청 총 수
- `nodejs_heap_size_used_bytes`: Node.js 힙 메모리 사용량
- `process_cpu_user_seconds_total`: CPU 사용 시간

## 알림 설정

### 헬스 체크 기반 알림

헬스 체크 엔드포인트를 주기적으로 호출하여 시스템 상태를 모니터링:

```bash
# 간단한 헬스 체크 스크립트
#!/bin/bash
HEALTH_URL="http://localhost:5000/api/health"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $STATUS -ne 200 ]; then
  echo "Health check failed with status $STATUS"
  # Slack/Discord 알림 전송
fi
```

### Prometheus Alert Manager

Prometheus Alert Manager를 사용하여 메트릭 기반 알림 설정:

```yaml
groups:
  - name: community-hub
    rules:
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time > 2s for 5 minutes"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate > 5% for 5 minutes"
```

## 로그 모니터링

시스템은 구조화된 JSON 로그를 출력하며, 다음과 같은 필드를 포함:

- `m`: HTTP 메소드
- `p`: 요청 경로
- `s`: 상태 코드
- `ms`: 응답 시간 (ms)
- `ip`: 클라이언트 IP
- `ua`: User Agent
- `reqBytes`: 요청 바이트 수
- `respBytes`: 응답 바이트 수

### 로그 분석 예시

```bash
# 느린 요청 찾기 (1초 이상)
grep '"ms":[0-9]\{4,\}' logs/server.log

# 에러 응답 찾기
grep '"s":[5-9][0-9][0-9]' logs/server.log

# 특정 엔드포인트 분석
grep '"p":"/api/posts"' logs/server.log | jq -r '.ms' | sort -n
```

## 성능 모니터링

### 메모리 사용량

- RSS: Resident Set Size (실제 메모리 사용량)
- Heap Total: V8 힙 총 크기
- Heap Used: V8 힙 사용량
- External: 외부 메모리 (C++ 객체)

### CPU 사용량

- User CPU: 사용자 모드 CPU 시간
- System CPU: 시스템 모드 CPU 시간

## 운영 권장사항

1. **헬스 체크 모니터링**: 로드 밸런서나 컨테이너 오케스트레이터에서 헬스 체크를 활용
2. **메트릭 수집**: Prometheus를 통한 중앙 집중식 메트릭 수집
3. **알림 설정**: 중요 메트릭에 대한 임계값 기반 알림 구성
4. **로그 분석**: 정기적인 로그 분석으로 성능 병목 지점 식별
5. **리소스 모니터링**: 메모리와 CPU 사용량 추이 모니터링

## 문제 해결

### 헬스 체크 실패

1. 데이터베이스 연결 확인
2. Redis 연결 확인 (활성화된 경우)
3. 로그 파일에서 에러 메시지 확인

### 높은 응답 시간

1. 데이터베이스 쿼리 최적화 확인
2. Redis 캐시 상태 확인
3. 메모리 누수 여부 확인
4. CPU 사용량 분석

### 메트릭 수집 실패

1. `/api/metrics` 엔드포인트 접근성 확인
2. Prometheus 설정 검증
3. 네트워크 연결 문제 확인