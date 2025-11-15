# ✅ 프로덕션 배포 체크리스트

**작성일:** 2025년 11월 12일  
**Phase:** 4 - Task 2 (프로덕션 배포 준비)  
**상태:** 진행 중

---

## 📋 배포 준비 상태

### ✅ 완료된 항목
- [x] Phase 3 모든 기능 구현 완료 (~11,000줄)
- [x] 알림 시스템 (SSE/WebSocket)
- [x] 파일 업로드 (Multer, Sharp, S3)
- [x] 실시간 채팅 (Socket.io)
- [x] Redis 캐싱
- [x] Elasticsearch 검색
- [x] 사용자 프로필 강화
- [x] 다크/라이트 테마
- [x] 다국어 지원 (i18n)
- [x] CORS 기본 설정 완료
- [x] Rate Limiting 기본 설정 완료
- [x] Docker Compose 파일 존재
- [x] Dockerfile 존재

### ⏳ 대기 중인 항목
- [ ] 환경 변수 프로덕션 설정
- [ ] JWT Secret 생성 및 적용
- [ ] HTTPS 인증서 발급
- [ ] Docker 최적화
- [ ] 보안 강화

---

## 1️⃣ 환경 설정

### 1.1 백엔드 환경 변수 설정

#### 단계 1: JWT Secret 생성

```powershell
# PowerShell에서 실행
cd server-backend

# JWT Secret 생성 스크립트 실행
node scripts/generate-jwt-secret.js

# 출력 예시:
# 🔐 JWT Secrets Generated:
# JWT_ACCESS_SECRET=...
# JWT_REFRESH_SECRET=...
```

#### 단계 2: .env.production 파일 생성

```powershell
# 예제 파일 복사
Copy-Item .env.example .env.production

# 편집
notepad .env.production
```

#### 단계 3: 필수 환경 변수 설정

```bash
# ========================================
# 🔐 프로덕션 환경 변수
# ========================================

# 서버 설정
NODE_ENV=production
PORT=50000
FRONTEND_URL=https://yourdomain.com

# JWT 인증 (⚠️ 필수)
JWT_ACCESS_SECRET=<STEP1_에서_생성한_SECRET>
JWT_REFRESH_SECRET=<STEP1_에서_생성한_SECRET>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=14d
JWT_ISSUER=community-platform-production

# 데이터베이스
DB_HOST=database
DB_PORT=3306
DB_USER=community_prod
DB_PASSWORD=<강력한_비밀번호>
DB_NAME=community_production
DB_CONNECTION_LIMIT=20

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<강력한_비밀번호>
REDIS_DB=0

# Elasticsearch
ELASTICSEARCH_NODE=http://elasticsearch:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=<강력한_비밀번호>

# CORS (⚠️ 프로덕션 도메인만)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
STRICT_RATE_LIMIT_WINDOW_MS=900000
STRICT_RATE_LIMIT_MAX_REQUESTS=5

# 파일 업로드
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=<YOUR_AWS_ACCESS_KEY>
AWS_SECRET_ACCESS_KEY=<YOUR_AWS_SECRET_KEY>
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=community-uploads-prod
MAX_FILE_SIZE=10485760

# 이메일
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<YOUR_EMAIL>
SMTP_PASSWORD=<YOUR_APP_PASSWORD>
SMTP_FROM=noreply@yourdomain.com

# 로깅
LOG_LEVEL=info
SENTRY_DSN=<YOUR_SENTRY_DSN>
SENTRY_ENVIRONMENT=production
```

#### 체크리스트
- [ ] JWT_ACCESS_SECRET 생성 및 설정
- [ ] JWT_REFRESH_SECRET 생성 및 설정
- [ ] DB_PASSWORD 강력한 비밀번호로 설정
- [ ] REDIS_PASSWORD 설정
- [ ] ELASTICSEARCH_PASSWORD 설정
- [ ] CORS_ORIGINS 프로덕션 도메인으로 설정
- [ ] AWS S3 설정 (또는 STORAGE_TYPE=local)
- [ ] SMTP 설정
- [ ] SENTRY_DSN 설정

### 1.2 프론트엔드 환경 변수 설정

```powershell
cd frontend

# 예제 파일 복사
Copy-Item .env.production.example .env.production

# 편집
notepad .env.production
```

```bash
# 프론트엔드 환경 변수
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
VITE_ENV=production
VITE_ENABLE_ANALYTICS=true
VITE_GA_TRACKING_ID=<YOUR_GA_ID>
VITE_SENTRY_DSN=<YOUR_SENTRY_DSN>
```

#### 체크리스트
- [ ] VITE_API_BASE_URL 프로덕션 도메인 설정
- [ ] VITE_WS_URL WebSocket URL 설정
- [ ] Google Analytics ID 설정 (선택)
- [ ] Sentry DSN 설정 (선택)

### 1.3 데이터베이스 환경 변수

```bash
# .env.database (루트 디렉토리)
MYSQL_ROOT_PASSWORD=<강력한_ROOT_비밀번호>
MYSQL_DATABASE=community_production
MYSQL_USER=community_prod
MYSQL_PASSWORD=<강력한_비밀번호>
```

#### 체크리스트
- [ ] MYSQL_ROOT_PASSWORD 설정
- [ ] MYSQL_PASSWORD 설정
- [ ] .env.database 파일 권한 600으로 설정

### 1.4 환경 변수 보안

```powershell
# Git에서 .env 파일 제외 확인
git check-ignore .env.production

# .gitignore에 추가 (필요시)
Add-Content .gitignore ".env"
Add-Content .gitignore ".env.*"
Add-Content .gitignore "!.env.example"
```

#### 체크리스트
- [ ] .env 파일들이 .gitignore에 포함되어 있는지 확인
- [ ] .env 파일 Git에 커밋되지 않았는지 확인
- [ ] 모든 시크릿이 예제 파일과 다른지 확인

---

## 2️⃣ Docker 최적화

### 2.1 프로덕션 Dockerfile 확인

#### 백엔드 Dockerfile

```powershell
# 파일 확인
cat server-backend/Dockerfile.production
```

#### 체크리스트
- [ ] Multi-stage build 사용
- [ ] Non-root 사용자 설정 (nodejs:1001)
- [ ] 프로덕션 의존성만 포함
- [ ] Health check 설정
- [ ] 불필요한 파일 제외 (.dockerignore)

### 2.2 Docker Compose 프로덕션 설정

#### docker-compose.production.yml 생성

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./server-backend
      dockerfile: Dockerfile.production
    env_file:
      - ./server-backend/.env.production
    environment:
      - NODE_ENV=production
    depends_on:
      database:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.production
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

  database:
    image: mysql:8.0
    env_file:
      - ./.env.database
    volumes:
      - db_data:/var/lib/mysql
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '2.0'

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    restart: unless-stopped

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=true
      - ELASTIC_PASSWORD=${ELASTICSEARCH_PASSWORD}
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    volumes:
      - es_data:/usr/share/elasticsearch/data
    restart: unless-stopped

volumes:
  db_data:
  redis_data:
  es_data:
```

#### 체크리스트
- [ ] 모든 서비스에 restart policy 설정
- [ ] 리소스 제한 설정
- [ ] Health check 설정
- [ ] 로그 rotation 설정
- [ ] Volume 백업 전략 수립

### 2.3 이미지 빌드 및 테스트

```powershell
# 이미지 빌드
docker-compose -f docker-compose.production.yml build

# 취약점 스캔
docker scan community-backend:latest
docker scan community-frontend:latest

# 이미지 크기 확인
docker images | Select-String "community"
```

#### 체크리스트
- [ ] 이미지 빌드 성공
- [ ] 취약점 스캔 통과 (Critical 0개)
- [ ] 이미지 크기 최적화 (백엔드 < 200MB, 프론트엔드 < 50MB)

---

## 3️⃣ 보안 강화

### 3.1 HTTPS 설정

#### Let's Encrypt SSL 인증서 발급

```bash
# Ubuntu 서버에서 실행
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# 인증서 경로 확인
ls -la /etc/letsencrypt/live/yourdomain.com/
```

#### Nginx 설정

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 보안 헤더
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location /api/ {
        proxy_pass http://backend:50000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://frontend:3000/;
    }
}

# HTTP → HTTPS 리디렉션
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

#### 체크리스트
- [ ] SSL 인증서 발급 완료
- [ ] Nginx HTTPS 설정 완료
- [ ] HTTP → HTTPS 리디렉션 설정
- [ ] 보안 헤더 설정 (HSTS, X-Frame-Options 등)
- [ ] SSL Labs 테스트 A+ 등급 (https://www.ssllabs.com/ssltest/)

### 3.2 CORS 정책 강화

#### server-backend/app.js 확인

```javascript
// CORS 설정 (프로덕션)
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.CORS_ORIGINS.split(',');
        
        if (process.env.NODE_ENV === 'production' && !origin) {
            return callback(new Error('Not allowed by CORS'), false);
        }
        
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    maxAge: 600,
};

app.use(cors(corsOptions));
```

#### 체크리스트
- [ ] CORS origin whitelist 설정 완료
- [ ] 프로덕션에서 origin 검증 활성화
- [ ] credentials: true 설정 (쿠키 전송)
- [ ] 허용 메서드 제한

### 3.3 Rate Limiting 강화

#### Redis 기반 Rate Limiter 구현

```javascript
// server-backend/middleware/rateLimiter.js

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { redisClient } = require('../config/redis');

// 일반 API (15분에 100요청)
const generalLimiter = rateLimit({
    store: new RedisStore({
        client: redisClient,
        prefix: 'rl:',
    }),
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests' },
    standardHeaders: true,
});

// 인증 API (15분에 5요청)
const authLimiter = rateLimit({
    store: new RedisStore({
        client: redisClient,
        prefix: 'rl:auth:',
    }),
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many authentication attempts' },
});

module.exports = { generalLimiter, authLimiter };
```

#### 적용

```javascript
// server-backend/app.js

const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');

// 일반 API에 적용
app.use('/api/', generalLimiter);

// 인증 API에 추가 제한
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

#### 체크리스트
- [ ] Redis Store 사용 (분산 환경 대응)
- [ ] 일반 API Rate Limit 설정
- [ ] 인증 API 엄격한 Rate Limit 설정
- [ ] 파일 업로드 Rate Limit 설정
- [ ] 검색 API Rate Limit 설정

### 3.4 SQL Injection 방어

#### 체크리스트
- [ ] 모든 DB 쿼리에 Prepared Statements 사용
- [ ] 사용자 입력값 직접 쿼리 문자열에 삽입 금지
- [ ] ORM/Query Builder 사용 (Sequelize 등)

### 3.5 XSS 방어

```javascript
// server-backend/middleware/sanitizer.js

const xss = require('xss');

const sanitizeInput = (req, res, next) => {
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = xss(req.body[key]);
            }
        });
    }
    next();
};

module.exports = { sanitizeInput };
```

#### 체크리스트
- [ ] XSS 방어 미들웨어 적용
- [ ] CSP (Content Security Policy) 헤더 설정
- [ ] 사용자 입력값 sanitization

---

## 4️⃣ 모니터링 설정

### 4.1 Sentry 에러 추적

```bash
# 백엔드 설치
cd server-backend
npm install @sentry/node @sentry/profiling-node

# 프론트엔드 설치
cd frontend
npm install @sentry/react @sentry/browser
```

#### 백엔드 설정

```javascript
// server-backend/app.js

const Sentry = require("@sentry/node");

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
});

// 에러 핸들러
app.use(Sentry.Handlers.errorHandler());
```

#### 체크리스트
- [ ] Sentry 프로젝트 생성
- [ ] DSN 환경 변수 설정
- [ ] 백엔드 Sentry 통합
- [ ] 프론트엔드 Sentry 통합
- [ ] 에러 알림 설정

### 4.2 로그 설정

```javascript
// server-backend/config/logger.js

const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 10485760, // 10MB
            maxFiles: 5,
        }),
        new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 10485760,
            maxFiles: 10,
        }),
    ],
});

module.exports = logger;
```

#### 체크리스트
- [ ] Winston 로거 설정
- [ ] 로그 파일 rotation 설정
- [ ] 에러 로그 분리
- [ ] 로그 레벨 설정 (production: info, development: debug)

---

## 5️⃣ 배포 실행

### 5.1 배포 스크립트

```powershell
# deploy.ps1

# 1. 환경 변수 확인
if (!(Test-Path "server-backend/.env.production")) {
    Write-Error ".env.production 파일이 없습니다!"
    exit 1
}

# 2. 이미지 빌드
Write-Host "🏗️ Docker 이미지 빌드 중..." -ForegroundColor Cyan
docker-compose -f docker-compose.production.yml build

# 3. 데이터베이스 마이그레이션
Write-Host "📊 데이터베이스 마이그레이션 중..." -ForegroundColor Cyan
docker-compose -f docker-compose.production.yml run --rm backend npm run migrate

# 4. Elasticsearch 인덱스 생성
Write-Host "🔍 Elasticsearch 인덱스 생성 중..." -ForegroundColor Cyan
docker-compose -f docker-compose.production.yml run --rm backend npm run es:setup

# 5. 서비스 시작
Write-Host "🚀 서비스 시작 중..." -ForegroundColor Cyan
docker-compose -f docker-compose.production.yml up -d

# 6. 헬스체크
Write-Host "✅ 헬스체크 중..." -ForegroundColor Cyan
Start-Sleep -Seconds 30
$response = Invoke-WebRequest -Uri "http://localhost:50000/api/health" -UseBasicParsing
if ($response.StatusCode -eq 200) {
    Write-Host "✅ 배포 성공!" -ForegroundColor Green
} else {
    Write-Error "❌ 헬스체크 실패!"
    docker-compose -f docker-compose.production.yml logs
    exit 1
}
```

### 5.2 배포 절차

```powershell
# 1. 환경 변수 설정 완료 확인
cat server-backend/.env.production

# 2. 배포 스크립트 실행
.\deploy.ps1

# 3. 로그 확인
docker-compose -f docker-compose.production.yml logs -f

# 4. 서비스 상태 확인
docker-compose -f docker-compose.production.yml ps
```

#### 체크리스트
- [ ] 환경 변수 모두 설정 완료
- [ ] Docker 이미지 빌드 성공
- [ ] 데이터베이스 마이그레이션 성공
- [ ] 모든 서비스 정상 실행 (healthy)
- [ ] API 헬스체크 통과
- [ ] 프론트엔드 접속 가능

---

## 6️⃣ 배포 후 검증

### 6.1 기능 테스트

```powershell
# API 테스트 스크립트
cd tests
npm run test:api
```

#### 체크리스트
- [ ] 회원가입/로그인 정상 작동
- [ ] 게시물 CRUD 정상 작동
- [ ] 댓글 기능 정상 작동
- [ ] 파일 업로드 정상 작동
- [ ] 실시간 알림 정상 작동
- [ ] 채팅 기능 정상 작동
- [ ] 검색 기능 정상 작동
- [ ] 프로필 기능 정상 작동
- [ ] 테마 전환 정상 작동
- [ ] 언어 전환 정상 작동

### 6.2 성능 테스트

```powershell
# Lighthouse 테스트
npx lighthouse https://yourdomain.com --view

# 목표:
# - Performance: 90+
# - Accessibility: 90+
# - Best Practices: 90+
# - SEO: 90+
```

#### 체크리스트
- [ ] Lighthouse Performance 90+
- [ ] Lighthouse Accessibility 90+
- [ ] Lighthouse Best Practices 90+
- [ ] Lighthouse SEO 90+
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.8s

### 6.3 보안 테스트

```powershell
# SSL Labs 테스트
# https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com

# OWASP ZAP 스캔
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://yourdomain.com
```

#### 체크리스트
- [ ] SSL Labs A+ 등급
- [ ] OWASP ZAP 취약점 없음
- [ ] HTTPS 강제 적용
- [ ] 보안 헤더 모두 설정
- [ ] CORS 정책 정상 작동
- [ ] Rate Limiting 작동 확인

---

## 7️⃣ 백업 및 복구 전략

### 7.1 자동 백업 스크립트

```powershell
# backup.ps1

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "backups/$timestamp"

# 데이터베이스 백업
docker-compose exec database mysqldump -u root -p community_production > "$backupDir/database.sql"

# Redis 백업
docker-compose exec redis redis-cli SAVE
docker cp community-redis:/data/dump.rdb "$backupDir/redis.rdb"

# Elasticsearch 백업
curl -X PUT "localhost:9200/_snapshot/backup_repo/$timestamp"

# 업로드 파일 백업
Copy-Item -Recurse server-backend/uploads "$backupDir/uploads"

Write-Host "✅ 백업 완료: $backupDir" -ForegroundColor Green
```

#### 체크리스트
- [ ] 일일 자동 백업 설정 (Cron/Task Scheduler)
- [ ] 백업 보관 정책 수립 (7일, 30일, 90일)
- [ ] 백업 복구 테스트 완료
- [ ] 원격 백업 저장소 설정 (AWS S3 등)

---

## 8️⃣ 최종 체크리스트

### 환경 설정 ✅
- [ ] 백엔드 .env.production 설정 완료
- [ ] 프론트엔드 .env.production 설정 완료
- [ ] 데이터베이스 .env.database 설정 완료
- [ ] JWT Secret 생성 및 적용
- [ ] 모든 비밀번호 강력하게 설정

### 보안 ✅
- [ ] HTTPS 설정 완료
- [ ] SSL 인증서 발급 완료
- [ ] CORS 정책 강화
- [ ] Rate Limiting 설정
- [ ] XSS 방어 미들웨어
- [ ] SQL Injection 방어 확인
- [ ] 보안 헤더 설정

### Docker ✅
- [ ] Multi-stage build 적용
- [ ] 프로덕션 이미지 최적화
- [ ] Health check 설정
- [ ] 리소스 제한 설정
- [ ] 로그 rotation 설정
- [ ] Volume 백업 전략

### 모니터링 ✅
- [ ] Sentry 설정 완료
- [ ] Winston 로거 설정
- [ ] 헬스체크 엔드포인트 확인
- [ ] 에러 알림 설정

### 배포 ✅
- [ ] 데이터베이스 마이그레이션 완료
- [ ] Elasticsearch 인덱스 생성
- [ ] 모든 서비스 정상 실행
- [ ] API 헬스체크 통과
- [ ] 프론트엔드 접속 가능

### 테스트 ✅
- [ ] 기능 테스트 모두 통과
- [ ] Lighthouse 90+ 달성
- [ ] SSL Labs A+ 등급
- [ ] OWASP ZAP 취약점 없음

### 백업 ✅
- [ ] 자동 백업 설정 완료
- [ ] 백업 복구 테스트 완료
- [ ] 원격 백업 저장소 설정

---

## 🎉 완료!

모든 체크리스트 항목이 완료되면 프로덕션 배포 준비가 완료됩니다.

**다음 단계:**
- Task 3: 테스트 커버리지 향상
- Task 4: 성능 최적화
- Task 5: 접근성 개선

---

**문서 버전:** 1.0.0  
**작성일:** 2025-11-12  
**작성자:** GitHub Copilot
