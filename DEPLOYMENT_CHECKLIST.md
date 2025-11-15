# 프로덕션 배포 체크리스트

**버전**: 1.0  
**작성일**: 2025년 11월 9일  
**대상**: DevOps, 시스템 관리자, 배포 담당자

---

## 📋 목차

1. [배포 전 준비](#배포-전-준비)
2. [보안 체크리스트](#보안-체크리스트)
3. [인프라 설정](#인프라-설정)
4. [데이터베이스 마이그레이션](#데이터베이스-마이그레이션)
5. [배포 실행](#배포-실행)
6. [배포 후 검증](#배포-후-검증)
7. [모니터링 설정](#모니터링-설정)
8. [롤백 계획](#롤백-계획)

---

## 1. 배포 전 준비

### 1.1 코드 검증

- [ ] 모든 테스트 통과
  ```bash
  npm test
  npm run test:integration
  npm run test:e2e
  ```

- [ ] 정적 분석 통과
  ```bash
  npm run lint
  npm run type-check
  ```

- [ ] 보안 취약점 스캔
  ```bash
  npm audit
  npm audit fix
  ```

- [ ] 의존성 업데이트 확인
  ```bash
  npm outdated
  npm update
  ```

### 1.2 문서 확인

- [ ] README.md 업데이트
- [ ] API 문서 최신화
- [ ] 변경 사항 기록 (CHANGELOG.md)
- [ ] 환경변수 문서 업데이트

### 1.3 환경변수 준비

**필수 환경 변수 목록**:

```bash
# JWT 인증
JWT_ACCESS_SECRET=your_64_byte_base64_encoded_secret_here
JWT_REFRESH_SECRET=your_64_byte_base64_encoded_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=14d
JWT_ISSUER=community-platform

# 데이터베이스
DB_HOST=localhost
DB_PORT=3306
DB_USER=community_user
DB_PASSWORD=your_secure_password
DB_NAME=community_db

# Redis (토큰 블랙리스트)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# 서버
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com

# CORS
CORS_ORIGIN=https://yourdomain.com
```

**환경 변수 검증**:
- [ ] `.env.production` 파일 준비
- [ ] 모든 필수 환경변수 설정
- [ ] JWT Secret 강도 검증 (최소 32자, 권장 64 bytes base64)
  ```bash
  # Secret 생성
  cd server-backend
  node scripts/generate-jwt-secret.js
  ```

- [ ] 환경변수 검증 스크립트 실행
  ```bash
  # 서버 시작 시 자동 검증됨
  npm run dev
  # startup-checks.js에서 자동으로 검증
  ```

### 1.4 백업

- [ ] 데이터베이스 백업
  ```bash
  mysqldump -u root -p community_db > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] Redis 데이터 백업
  ```bash
  redis-cli SAVE
  cp /var/lib/redis/dump.rdb backup_redis_$(date +%Y%m%d_%H%M%S).rdb
  ```

- [ ] 설정 파일 백업
  ```bash
  tar -czf config_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
      /etc/nginx \
      /etc/systemd/system/community.service \
      .env.production
  ```

---

## 2. 보안 체크리스트

### 2.1 인증 및 권한

- [ ] JWT_ACCESS_SECRET이 강력한가? (64 bytes base64)
  ```bash
  # Secret 생성 스크립트 사용
  node server-backend/scripts/generate-jwt-secret.js
  ```

- [ ] JWT_REFRESH_SECRET이 강력한가? (64 bytes base64)
- [ ] 환경 변수 검증 스크립트 실행
  ```bash
  # 서버 시작 시 자동 검증됨
  npm run dev
  ```

- [ ] 토큰 만료 시간이 적절한가? (Access: 15분, Refresh: 14일)
- [ ] 토큰 블랙리스트가 작동하는가?
  ```bash
  # Redis 연결 확인
  redis-cli ping
  # 블랙리스트 키 확인
  redis-cli KEYS "blacklist:*"
  ```

- [ ] 401 자동 로그아웃이 작동하는가?
  ```typescript
  // 프론트엔드에서 테스트
  // 만료된 토큰 사용 시 자동 로그아웃 확인
  ```

### 2.2 암호화

- [ ] HTTPS 강제 활성화
  ```javascript
  // server.js
  if (process.env.NODE_ENV === 'production') {
      app.use((req, res, next) => {
          if (!req.secure) {
              return res.redirect('https://' + req.headers.host + req.url);
          }
          next();
      });
  }
  ```

- [ ] TLS 1.3 사용
- [ ] SSL 인증서 유효 기간 확인
- [ ] Redis TLS 연결 설정 (rediss://)
- [ ] 데이터베이스 SSL 연결 설정

- [ ] 메시지 암호화 (AES-256-GCM) 테스트
  ```bash
  # 프론트엔드 암호화 테스트
  npm run test:e2e -- --grep "암호화"
  ```

### 2.3 CSRF 보호

- [ ] CSRF 토큰 발급 API 작동 확인
  ```bash
  curl http://localhost:5000/api/auth/csrf
  ```

- [ ] POST/PUT/DELETE 요청에 CSRF 토큰 포함 확인
  ```bash
  # E2E 테스트 실행
  npm run test:e2e -- --grep "CSRF"
  ```

- [ ] CSRF 토큰 1시간 캐싱 확인
- [ ] CSRF 검증 실패 시 재시도 로직 확인

### 2.4 보안 헤더

- [ ] Helmet.js 설정
  ```javascript
  const helmet = require('helmet');
  
  app.use(helmet({
      contentSecurityPolicy: {
          directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:", "https:"],
          }
      },
      hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
      }
  }));
  ```

- [ ] HSTS 활성화
- [ ] CSP (Content Security Policy) 설정
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff

### 2.4 네트워크 보안

- [ ] 방화벽 설정
  ```bash
  # Ubuntu/Debian
  sudo ufw enable
  sudo ufw allow 22/tcp   # SSH
  sudo ufw allow 80/tcp   # HTTP
  sudo ufw allow 443/tcp  # HTTPS
  sudo ufw deny 50000/tcp # 애플리케이션 포트는 nginx를 통해서만
  ```

- [ ] SSH 키 기반 인증만 허용
- [ ] 불필요한 포트 차단
- [ ] DDoS 방어 설정 (Cloudflare, AWS Shield 등)

### 2.5 데이터 보호

- [ ] 데이터베이스 비밀번호 강력한가?
- [ ] Redis 비밀번호 설정
  ```conf
  # redis.conf
  requirepass <strong-password>
  ```

- [ ] 민감한 데이터 암호화
- [ ] 로그에 민감 정보 미포함 확인

---

## 3. 인프라 설정

### 3.1 서버 요구사항

| 항목      | 최소      | 권장      |
| --------- | --------- | --------- |
| CPU       | 2 cores   | 4 cores   |
| RAM       | 4 GB      | 8 GB      |
| Disk      | 20 GB SSD | 50 GB SSD |
| Bandwidth | 100 Mbps  | 1 Gbps    |

### 3.2 Nginx 설정

```nginx
# /etc/nginx/sites-available/community

upstream community_backend {
    server localhost:50000;
    keepalive 64;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # HTTP -> HTTPS 리다이렉트
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL 인증서
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL 설정
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers 'ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 보안 헤더
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 정적 파일
    location /static {
        alias /var/www/community/frontend/build/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 프록시
    location /api {
        proxy_pass http://community_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
        
        # 타임아웃 설정
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 프론트엔드 (React SPA)
    location / {
        root /var/www/community/frontend/build;
        try_files $uri $uri/ /index.html;
    }
}
```

- [ ] Nginx 설정 테스트
  ```bash
  sudo nginx -t
  ```

- [ ] Nginx 재시작
  ```bash
  sudo systemctl restart nginx
  ```

### 3.3 Let's Encrypt SSL 인증서

```bash
# Certbot 설치
sudo apt-get install certbot python3-certbot-nginx

# 인증서 발급
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 자동 갱신 테스트
sudo certbot renew --dry-run

# Cron으로 자동 갱신 (매월 1일 3시)
sudo crontab -e
0 3 1 * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

- [ ] SSL 인증서 발급 완료
- [ ] 자동 갱신 설정 완료
- [ ] SSL Labs 테스트 (https://www.ssllabs.com/ssltest/)

### 3.4 Systemd 서비스

```ini
# /etc/systemd/system/community.service

[Unit]
Description=Community Platform
After=network.target mysql.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/community/server-backend
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10

# 환경변수
Environment=NODE_ENV=production
EnvironmentFile=/var/www/community/server-backend/.env.production

# 로깅
StandardOutput=journal
StandardError=journal
SyslogIdentifier=community

# 보안
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/www/community

[Install]
WantedBy=multi-user.target
```

- [ ] 서비스 파일 생성
- [ ] 서비스 활성화
  ```bash
  sudo systemctl daemon-reload
  sudo systemctl enable community
  sudo systemctl start community
  ```

- [ ] 서비스 상태 확인
  ```bash
  sudo systemctl status community
  ```

---

## 4. 데이터베이스 마이그레이션

### 4.1 마이그레이션 전 체크

- [ ] 데이터베이스 백업 완료
- [ ] 마이그레이션 스크립트 테스트 완료
- [ ] Rollback 스크립트 준비

### 4.2 마이그레이션 실행

```bash
# 1. 백업
mysqldump -u root -p community_db > pre_migration_backup.sql

# 2. 마이그레이션
cd /var/www/community/server-backend
npm run migrate:encryption

# 3. 검증
mysql -u root -p community_db -e "SHOW TABLES;"
mysql -u root -p community_db -e "DESCRIBE encrypted_messages;"
mysql -u root -p community_db -e "DESCRIBE user_encryption_keys;"
mysql -u root -p community_db -e "DESCRIBE encryption_audit_log;"
```

- [ ] 마이그레이션 성공 확인
- [ ] 테이블 구조 검증
- [ ] 인덱스 확인

### 4.3 Rollback 준비

```bash
# 마이그레이션 Rollback
npm run migrate:encryption:down

# 또는 백업 복원
mysql -u root -p community_db < pre_migration_backup.sql
```

---

## 5. 배포 실행

### 5.1 배포 전 점검

- [ ] 모든 체크리스트 항목 완료
- [ ] 배포 시간 공지 (유지보수 공지)
- [ ] 모니터링 대시보드 준비
- [ ] 팀원 대기 상태

### 5.2 무중단 배포 (Blue-Green)

```bash
# Blue (현재 프로덕션)
# Green (새 버전)

# 1. Green 환경에 배포
ssh green-server
cd /var/www/community
git pull origin main
npm ci --only=production
npm run build

# 2. Green 서버 시작
sudo systemctl start community-green

# 3. Health Check
curl https://green.yourdomain.com/health

# 4. 로드 밸런서 전환 (Green으로)
# AWS ALB, Nginx upstream 등

# 5. 모니터링 (5분)
# - 에러율
# - 응답 시간
# - CPU/메모리 사용률

# 6. 문제 없으면 Blue 종료
ssh blue-server
sudo systemctl stop community-blue
```

### 5.3 Rolling 업데이트

```bash
# 서버 1대씩 순차 업데이트

for server in server1 server2 server3; do
    echo "Deploying to $server..."
    
    # 로드 밸런서에서 제거
    aws elb deregister-instances-from-load-balancer \
        --load-balancer-name my-lb \
        --instances $server
    
    # 배포
    ssh $server "cd /var/www/community && git pull && npm ci && pm2 restart all"
    
    # Health Check
    sleep 30
    
    # 로드 밸런서에 다시 추가
    aws elb register-instances-with-load-balancer \
        --load-balancer-name my-lb \
        --instances $server
    
    echo "$server deployment complete"
done
```

### 5.4 간단한 배포 (단일 서버)

```bash
# 1. SSH 접속
ssh user@yourdomain.com

# 2. 코드 업데이트
cd /var/www/community/server-backend
git pull origin main

# 3. 의존성 설치
npm ci --only=production

# 4. 빌드 (프론트엔드)
cd ../frontend
npm ci --only=production
npm run build

# 5. 마이그레이션
cd ../server-backend
npm run migrate:encryption

# 6. 서비스 재시작
sudo systemctl restart community

# 7. 상태 확인
sudo systemctl status community
curl https://yourdomain.com/health
```

---

## 6. 배포 후 검증

### 6.1 Health Check

```bash
# API Health Check
curl https://yourdomain.com/health

# 예상 응답:
# {
#   "status": "ok",
#   "timestamp": "2025-11-09T10:00:00Z",
#   "uptime": 123456,
#   "database": "connected",
#   "redis": "connected"
# }
```

- [ ] API 응답 정상
- [ ] 데이터베이스 연결 정상
- [ ] Redis 연결 정상

### 6.2 기능 테스트

- [ ] 로그인/로그아웃
- [ ] 회원가입
- [ ] OAuth 로그인 (Google, GitHub 등)
- [ ] CSRF 토큰 검증
- [ ] 메시지 암호화/복호화
- [ ] 파일 업로드
- [ ] 실시간 채팅

### 6.3 성능 테스트

```bash
# Apache Bench
ab -n 1000 -c 10 https://yourdomain.com/api/health

# 또는 wrk
wrk -t10 -c100 -d30s https://yourdomain.com/api/health
```

- [ ] 응답 시간 < 200ms
- [ ] 에러율 < 0.1%
- [ ] CPU 사용률 < 70%
- [ ] 메모리 사용률 < 80%

### 6.4 보안 테스트

```bash
# SSL Labs
curl "https://api.ssllabs.com/api/v3/analyze?host=yourdomain.com"

# Security Headers
curl -I https://yourdomain.com | grep -i "security\|x-frame\|hsts"
```

- [ ] SSL Labs Grade: A+
- [ ] 모든 보안 헤더 존재
- [ ] HSTS 활성화
- [ ] CSP 설정됨

---

## 7. 모니터링 설정

### 7.1 로그 모니터링

```bash
# Systemd 로그
sudo journalctl -u community -f

# Nginx 로그
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 애플리케이션 로그
tail -f /var/www/community/logs/app.log
```

### 7.2 메트릭 수집

```javascript
// server.js
const promClient = require('prom-client');

// 기본 메트릭
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// 커스텀 메트릭
const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5]
});
register.registerMetric(httpRequestDuration);

// Metrics 엔드포인트
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});
```

### 7.3 알림 설정

```yaml
# Prometheus AlertManager
groups:
  - name: community_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time"
```

---

## 8. 롤백 계획

### 8.1 롤백 조건

- 에러율 > 5%
- 응답 시간 > 5초
- 크리티컬 버그 발견
- 데이터 무결성 문제

### 8.2 롤백 절차

```bash
# 1. 이전 버전으로 전환 (Blue-Green)
# 로드 밸런서를 Blue(이전 버전)로 전환

# 2. 또는 Git으로 롤백
cd /var/www/community/server-backend
git log --oneline  # 이전 커밋 확인
git revert HEAD    # 또는 git reset --hard <commit-hash>

# 3. 의존성 재설치
npm ci --only=production

# 4. 데이터베이스 롤백
mysql -u root -p community_db < pre_migration_backup.sql

# 5. 서비스 재시작
sudo systemctl restart community

# 6. 검증
curl https://yourdomain.com/health
```

### 8.3 롤백 후 조치

- [ ] 사용자 공지
- [ ] 로그 수집 및 분석
- [ ] 버그 리포트 작성
- [ ] 핫픽스 계획

---

## 9. 체크리스트 요약

### 9.1 배포 전 (T-24h)

- [ ] 코드 리뷰 완료
- [ ] 테스트 통과
- [ ] 보안 스캔 완료
- [ ] 백업 완료
- [ ] 배포 공지

### 9.2 배포 당일 (T-1h)

- [ ] 팀원 대기
- [ ] 모니터링 대시보드 확인
- [ ] Rollback 스크립트 준비
- [ ] 환경변수 검증

### 9.3 배포 중 (T+0)

- [ ] 마이그레이션 실행
- [ ] 서비스 재시작
- [ ] Health Check
- [ ] 기능 테스트

### 9.4 배포 후 (T+1h~24h)

- [ ] 성능 모니터링
- [ ] 에러율 확인
- [ ] 사용자 피드백 수집
- [ ] 로그 분석

---

## 10. 긴급 연락처

| 역할             | 이름 | 연락처 |
| ---------------- | ---- | ------ |
| DevOps Lead      | -    | -      |
| Backend Lead     | -    | -      |
| Frontend Lead    | -    | -      |
| Security Lead    | -    | -      |
| On-Call Engineer | -    | -      |

---

## 11. 참고 자료

### 11.1 내부 문서
- [SECURITY_FINAL_REPORT.md](./SECURITY_FINAL_REPORT.md)
- [ENVIRONMENT_VARIABLES_SECURITY.md](./ENVIRONMENT_VARIABLES_SECURITY.md)
- [JWT_SECURITY_CHECKLIST.md](./JWT_SECURITY_CHECKLIST.md)

### 11.2 외부 자료
- [Let's Encrypt](https://letsencrypt.org/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)

---

**작성자**: GitHub Copilot DevOps Team  
**검토일**: 2025년 11월 9일  
**다음 검토**: 2026년 2월 9일

---

**배포 승인**: ⬜ 대기 중

- [ ] DevOps Lead 승인
- [ ] Security Lead 승인
- [ ] Product Owner 승인

---

*이 체크리스트는 매 배포마다 사용하며, 모든 항목을 확인한 후 배포를 진행합니다.*
