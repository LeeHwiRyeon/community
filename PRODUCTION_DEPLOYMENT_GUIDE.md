# 🚀 프로덕션 배포 가이드

## 📋 목차

1. [환경 변수 설정](#1-환경-변수-설정)
2. [Docker 보안 스캔](#2-docker-보안-스캔)
3. [OWASP ZAP 취약점 검사](#3-owasp-zap-취약점-검사)
4. [SSL/TLS 설정](#4-ssltls-설정)
5. [Rate Limiting 설정](#5-rate-limiting-설정)
6. [모니터링 및 로깅](#6-모니터링-및-로깅)
7. [배포 체크리스트](#7-배포-체크리스트)

---

## 1. 환경 변수 설정

### 1.1 백엔드 환경 변수

```bash
# 1. 템플릿 복사
cd server-backend
cp ../.env.production.example .env.production

# 2. JWT Secret 생성
node scripts/generate-jwt-secret.js

# 3. .env.production 파일 편집
nano .env.production
```

**필수 설정 항목:**

- `JWT_ACCESS_SECRET`: 64 bytes base64 인코딩 (generate-jwt-secret.js로 생성)
- `JWT_REFRESH_SECRET`: 64 bytes base64 인코딩 (다른 Secret 사용)
- `DB_HOST`, `DB_PASSWORD`: 프로덕션 데이터베이스 정보
- `REDIS_HOST`, `REDIS_PASSWORD`: Redis 서버 정보
- `CORS_ORIGIN`: 프론트엔드 도메인 (https://yourdomain.com)
- `SESSION_SECRET`: 64 bytes base64 인코딩

**검증 스크립트:**

```bash
# 환경 변수 검증
node scripts/validate-env.js
```

### 1.2 프론트엔드 환경 변수

```bash
# 1. 템플릿 복사
cd frontend
cp .env.production.example .env.production

# 2. .env.production 파일 편집
nano .env.production
```

**필수 설정 항목:**

- `VITE_API_BASE_URL`: 백엔드 API 엔드포인트 (https://api.yourdomain.com)
- `VITE_APP_ENV`: production
- `VITE_GENERATE_SOURCEMAP`: false (보안)

---

## 2. Docker 보안 스캔

### 2.1 Trivy 설치 및 사용

**Trivy 설치 (Ubuntu/Debian):**

```bash
# Trivy 설치
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/trivy.list
sudo apt-get update
sudo apt-get install trivy
```

**Docker 이미지 스캔:**

```bash
# 백엔드 이미지 빌드
docker build -t community-backend:latest -f Dockerfile .

# Trivy로 취약점 스캔
trivy image --severity HIGH,CRITICAL community-backend:latest

# JSON 리포트 생성
trivy image --format json --output trivy-report.json community-backend:latest
```

**자동화 스크립트 (scripts/docker-security-scan.sh):**

```bash
#!/bin/bash

# Docker Security Scan Script
# Usage: ./scripts/docker-security-scan.sh

set -e

echo "🔍 Starting Docker security scan..."

# 이미지 빌드
echo "📦 Building Docker images..."
docker build -t community-backend:latest -f Dockerfile .

# Trivy 스캔
echo "🛡️ Scanning with Trivy..."
trivy image --severity HIGH,CRITICAL community-backend:latest

# 결과 저장
trivy image --format json --output reports/trivy-report-$(date +%Y%m%d).json community-backend:latest

# 취약점 개수 확인
VULNERABILITIES=$(trivy image --format json community-backend:latest | jq '.Results[].Vulnerabilities | length' | awk '{s+=$1} END {print s}')

if [ "$VULNERABILITIES" -gt 0 ]; then
    echo "⚠️ Found $VULNERABILITIES vulnerabilities!"
    echo "📄 Check reports/trivy-report-$(date +%Y%m%d).json"
    exit 1
else
    echo "✅ No vulnerabilities found!"
fi
```

### 2.2 Snyk 사용 (옵션)

```bash
# Snyk CLI 설치
npm install -g snyk

# Snyk 인증
snyk auth

# Docker 이미지 스캔
snyk container test community-backend:latest

# CI/CD 연동용 JSON 리포트
snyk container test community-backend:latest --json > snyk-report.json
```

---

## 3. OWASP ZAP 취약점 검사

### 3.1 OWASP ZAP 설치

**Docker로 실행:**

```bash
# OWASP ZAP Docker 이미지 다운로드
docker pull owasp/zap2docker-stable
```

### 3.2 기본 스캔

```bash
# 애플리케이션 실행
docker-compose up -d

# OWASP ZAP 기본 스캔 (Baseline Scan)
docker run -v $(pwd)/reports:/zap/wrk/:rw \
    -t owasp/zap2docker-stable \
    zap-baseline.py \
    -t https://yourdomain.com \
    -r zap-baseline-report.html
```

### 3.3 전체 스캔 (Full Scan)

```bash
# 전체 취약점 스캔 (시간이 오래 걸림)
docker run -v $(pwd)/reports:/zap/wrk/:rw \
    -t owasp/zap2docker-stable \
    zap-full-scan.py \
    -t https://yourdomain.com \
    -r zap-full-report.html
```

### 3.4 자동화 스크립트 (scripts/zap-scan.sh)

```bash
#!/bin/bash

# OWASP ZAP Security Scan Script
# Usage: ./scripts/zap-scan.sh <target_url>

set -e

TARGET_URL=${1:-"http://localhost:5000"}
REPORT_DIR="reports/zap"

echo "🔍 Starting OWASP ZAP scan..."
echo "🎯 Target: $TARGET_URL"

# 리포트 디렉토리 생성
mkdir -p $REPORT_DIR

# Baseline 스캔
echo "📊 Running baseline scan..."
docker run -v $(pwd)/$REPORT_DIR:/zap/wrk/:rw \
    -t owasp/zap2docker-stable \
    zap-baseline.py \
    -t $TARGET_URL \
    -r zap-baseline-$(date +%Y%m%d).html

# API 스캔 (OpenAPI 정의 사용)
echo "🔌 Running API scan..."
docker run -v $(pwd)/$REPORT_DIR:/zap/wrk/:rw \
    -t owasp/zap2docker-stable \
    zap-api-scan.py \
    -t $TARGET_URL/api \
    -f openapi \
    -r zap-api-$(date +%Y%m%d).html

echo "✅ ZAP scan completed!"
echo "📄 Reports saved in $REPORT_DIR"
```

**스캔 실행:**

```bash
chmod +x scripts/zap-scan.sh
./scripts/zap-scan.sh https://yourdomain.com
```

### 3.5 ZAP 취약점 카테고리

스캔 후 확인해야 할 주요 취약점:

- **High Risk:**
  - SQL Injection
  - Cross-Site Scripting (XSS)
  - Remote Code Execution

- **Medium Risk:**
  - CSRF (우리는 이미 구현함)
  - Insecure Authentication
  - Session Management Issues

- **Low Risk:**
  - Missing Security Headers
  - Cookie Flags
  - Information Disclosure

---

## 4. SSL/TLS 설정

### 4.1 Let's Encrypt 인증서 발급

```bash
# Certbot 설치 (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install certbot

# 인증서 발급
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com

# 인증서 경로 확인
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### 4.2 Express.js HTTPS 설정

**server-backend/api-server/server.js 수정:**

```javascript
const https = require('https');
const fs = require('fs');

// SSL 인증서 로드
const sslOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH)
};

// HTTPS 서버 생성
const server = https.createServer(sslOptions, app);

server.listen(PORT, () => {
    console.log(`✅ HTTPS Server running on port ${PORT}`);
});
```

### 4.3 보안 헤더 설정 (Helmet.js)

```bash
# Helmet.js 설치
npm install helmet
```

**middleware/security-headers.js:**

```javascript
const helmet = require('helmet');

module.exports = helmet({
    // HSTS (Strict Transport Security)
    hsts: {
        maxAge: 31536000, // 1년
        includeSubDomains: true,
        preload: true
    },
    
    // Content Security Policy
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", process.env.FRONTEND_URL]
        }
    },
    
    // X-Frame-Options
    frameguard: { action: 'deny' },
    
    // X-Content-Type-Options
    noSniff: true,
    
    // X-XSS-Protection
    xssFilter: true
});
```

**server.js에 적용:**

```javascript
const securityHeaders = require('./middleware/security-headers');
app.use(securityHeaders);
```

### 4.4 인증서 자동 갱신

```bash
# Cron 작업 추가
sudo crontab -e

# 매월 1일 새벽 3시에 인증서 갱신
0 3 1 * * certbot renew --quiet && systemctl reload nginx
```

---

## 5. Rate Limiting 설정

### 5.1 Express Rate Limit 설치

```bash
npm install express-rate-limit
```

### 5.2 Rate Limiter 설정

**middleware/rate-limit.js:**

```javascript
const rateLimit = require('express-rate-limit');

// 로그인 엔드포인트 Rate Limit (15분에 5회)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 5, // 최대 5회 시도
    message: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '너무 많은 로그인 시도가 있었습니다. 15분 후 다시 시도해 주세요.'
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    
    // Redis 스토어 사용 (프로덕션 권장)
    store: new RedisStore({
        client: redisClient,
        prefix: 'rl:login:'
    })
});

// 일반 API Rate Limit (15분에 100회)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 100, // 최대 100회 요청
    message: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    
    store: new RedisStore({
        client: redisClient,
        prefix: 'rl:api:'
    })
});

// 회원가입 Rate Limit (1시간에 3회)
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1시간
    max: 3,
    message: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '회원가입 시도가 너무 많습니다. 1시간 후 다시 시도해 주세요.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    loginLimiter,
    apiLimiter,
    registerLimiter
};
```

### 5.3 Rate Limiter 적용

**server-backend/api-server/server.js:**

```javascript
const { loginLimiter, apiLimiter, registerLimiter } = require('./middleware/rate-limit');

// 전역 API Rate Limit
app.use('/api', apiLimiter);

// 로그인 엔드포인트
app.post('/api/auth/login', loginLimiter, authController.login);

// 회원가입 엔드포인트
app.post('/api/auth/register', registerLimiter, authController.register);
```

### 5.4 Redis 스토어 설정

```bash
npm install rate-limit-redis
```

```javascript
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const redisClient = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
});
```

---

## 6. 모니터링 및 로깅

### 6.1 Winston Logger 설정

```bash
npm install winston winston-daily-rotate-file
```

**utils/logger.js:**

```javascript
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

// 로그 포맷 정의
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// 일반 로그 로테이션
const fileTransport = new DailyRotateFile({
    filename: 'logs/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d', // 14일 보관
    level: 'info'
});

// 에러 로그 로테이션
const errorTransport = new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d', // 30일 보관
    level: 'error'
});

// Logger 생성
const logger = winston.createLogger({
    format: logFormat,
    transports: [
        fileTransport,
        errorTransport
    ]
});

// 개발 환경에서는 콘솔 출력
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

module.exports = logger;
```

### 6.2 에러 추적 (Sentry)

```bash
npm install @sentry/node @sentry/profiling-node
```

**utils/sentry.js:**

```javascript
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

function initSentry(app) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        integrations: [
            new Sentry.Integrations.Http({ tracing: true }),
            new Sentry.Integrations.Express({ app }),
            new ProfilingIntegration()
        ],
        tracesSampleRate: 1.0,
        profilesSampleRate: 1.0,
        environment: process.env.NODE_ENV
    });
    
    // Request Handler (첫 번째 미들웨어)
    app.use(Sentry.Handlers.requestHandler());
    
    // Tracing Handler
    app.use(Sentry.Handlers.tracingHandler());
}

module.exports = { initSentry, Sentry };
```

**server.js에 적용:**

```javascript
const { initSentry, Sentry } = require('./utils/sentry');

// Sentry 초기화
initSentry(app);

// ... 라우터 등록 ...

// Error Handler (마지막 미들웨어)
app.use(Sentry.Handlers.errorHandler());
```

### 6.3 성능 모니터링 (New Relic - 옵션)

```bash
npm install newrelic
```

**newrelic.js 설정:**

```javascript
'use strict';

exports.config = {
    app_name: [process.env.NEW_RELIC_APP_NAME || 'Community Platform'],
    license_key: process.env.NEW_RELIC_LICENSE_KEY,
    logging: {
        level: 'info'
    },
    distributed_tracing: {
        enabled: true
    },
    transaction_tracer: {
        enabled: true
    }
};
```

**server.js 최상단에 추가:**

```javascript
// New Relic은 가장 먼저 로드되어야 함
if (process.env.NODE_ENV === 'production') {
    require('newrelic');
}
```

### 6.4 헬스 체크 엔드포인트

**routes/health.js:**

```javascript
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const redisClient = require('../config/redis');

// 기본 헬스 체크
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 상세 헬스 체크 (DB, Redis 연결 확인)
router.get('/health/detailed', async (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {}
    };
    
    // MySQL 연결 확인
    try {
        await db.query('SELECT 1');
        health.services.mysql = { status: 'up' };
    } catch (error) {
        health.services.mysql = { status: 'down', error: error.message };
        health.status = 'unhealthy';
    }
    
    // Redis 연결 확인
    try {
        await redisClient.ping();
        health.services.redis = { status: 'up' };
    } catch (error) {
        health.services.redis = { status: 'down', error: error.message };
        health.status = 'unhealthy';
    }
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
});

module.exports = router;
```

---

## 7. 배포 체크리스트

### 7.1 배포 전 체크리스트

#### 환경 설정
- [ ] `.env.production` 파일 생성 및 모든 필수 변수 설정
- [ ] JWT Secret 강도 검증 (64 bytes base64)
- [ ] 데이터베이스 연결 테스트
- [ ] Redis 연결 테스트
- [ ] CORS Origin 설정 확인

#### 보안 설정
- [ ] SSL/TLS 인증서 발급 및 설정
- [ ] HTTPS 리디렉션 설정
- [ ] Rate Limiting 설정
- [ ] 보안 헤더 (Helmet.js) 적용
- [ ] CSRF 토큰 시스템 동작 확인
- [ ] 토큰 블랙리스트 기능 테스트
- [ ] AES-GCM 암호화 동작 확인

#### 코드 품질
- [ ] TypeScript 컴파일 에러 0개
- [ ] ESLint 경고 해결
- [ ] 모든 테스트 통과 (Unit + E2E)
- [ ] 코드 리뷰 완료

#### 성능 최적화
- [ ] 프로덕션 빌드 생성 (`npm run build`)
- [ ] 번들 크기 최적화 확인
- [ ] 이미지 최적화
- [ ] Gzip/Brotli 압축 설정

#### 모니터링
- [ ] Sentry DSN 설정 (에러 추적)
- [ ] Winston Logger 설정 (파일 로깅)
- [ ] 헬스 체크 엔드포인트 테스트
- [ ] 로그 로테이션 설정

### 7.2 Docker 보안 체크리스트

- [ ] Trivy 스캔 완료 (HIGH/CRITICAL 0개)
- [ ] Snyk 스캔 완료 (옵션)
- [ ] Docker 이미지 최소화 (alpine 사용)
- [ ] 비root 사용자로 실행
- [ ] 불필요한 패키지 제거
- [ ] .dockerignore 파일 확인

### 7.3 OWASP ZAP 체크리스트

- [ ] Baseline 스캔 완료
- [ ] API 스캔 완료
- [ ] High Risk 취약점 0개
- [ ] Medium Risk 취약점 해결 또는 문서화
- [ ] ZAP 리포트 검토 및 보관

### 7.4 배포 후 체크리스트

#### 기능 검증
- [ ] 로그인/로그아웃 동작 확인
- [ ] 토큰 갱신 기능 확인
- [ ] CSRF 토큰 자동 처리 확인
- [ ] 401 에러 시 자동 로그아웃 확인
- [ ] 채팅 메시지 암호화/복호화 확인
- [ ] 강제 로그아웃 기능 확인

#### 성능 검증
- [ ] API 응답 시간 측정 (< 200ms)
- [ ] 동시 접속자 부하 테스트
- [ ] 메모리 사용량 모니터링
- [ ] CPU 사용률 확인

#### 보안 검증
- [ ] SSL/TLS 설정 확인 (https://www.ssllabs.com/ssltest/)
- [ ] Security Headers 확인 (https://securityheaders.com/)
- [ ] Rate Limiting 동작 확인
- [ ] CSRF 공격 시뮬레이션
- [ ] XSS 공격 시뮬레이션

#### 모니터링 확인
- [ ] Sentry 에러 수집 동작 확인
- [ ] 로그 파일 생성 확인
- [ ] 헬스 체크 엔드포인트 응답 확인
- [ ] 알림 시스템 테스트 (에러 발생 시)

---

## 8. 배포 스크립트

### 8.1 전체 배포 스크립트 (scripts/deploy.sh)

```bash
#!/bin/bash

# Production Deployment Script
# Usage: ./scripts/deploy.sh

set -e

echo "🚀 Starting production deployment..."

# 1. 환경 변수 검증
echo "✅ Step 1: Validating environment variables..."
node server-backend/scripts/validate-env.js

# 2. 테스트 실행
echo "✅ Step 2: Running tests..."
cd frontend && npm test && cd ..
cd server-backend && npm test && cd ..

# 3. Docker 보안 스캔
echo "✅ Step 3: Running Docker security scan..."
./scripts/docker-security-scan.sh

# 4. 프로덕션 빌드
echo "✅ Step 4: Building for production..."
cd frontend && npm run build && cd ..

# 5. Docker 이미지 빌드
echo "✅ Step 5: Building Docker images..."
docker-compose -f docker-compose.production.yml build

# 6. 백업 (데이터베이스)
echo "✅ Step 6: Creating database backup..."
./scripts/backup-database.sh

# 7. 배포
echo "✅ Step 7: Deploying..."
docker-compose -f docker-compose.production.yml up -d

# 8. 헬스 체크
echo "✅ Step 8: Running health check..."
sleep 10
curl -f http://localhost:5000/health || exit 1

echo "🎉 Deployment completed successfully!"
```

### 8.2 환경 변수 검증 스크립트 (server-backend/scripts/validate-env.js)

```javascript
const fs = require('fs');
const crypto = require('crypto');

// 필수 환경 변수 목록
const requiredVars = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'DB_HOST',
    'DB_PASSWORD',
    'REDIS_HOST',
    'CORS_ORIGIN',
    'SESSION_SECRET'
];

// 환경 변수 로드
require('dotenv').config({ path: '.env.production' });

console.log('🔍 Validating production environment variables...\n');

let hasErrors = false;

// 필수 변수 검증
requiredVars.forEach(varName => {
    const value = process.env[varName];
    
    if (!value) {
        console.error(`❌ ${varName}: Missing`);
        hasErrors = true;
    } else if (value.includes('your_') || value.includes('_here')) {
        console.error(`❌ ${varName}: Contains placeholder value`);
        hasErrors = true;
    } else if (varName.includes('SECRET') && value.length < 32) {
        console.error(`❌ ${varName}: Too short (minimum 32 characters)`);
        hasErrors = true;
    } else {
        console.log(`✅ ${varName}: OK (${value.length} chars)`);
    }
});

// 추가 보안 검증
console.log('\n🔐 Security checks:');

// JWT Secret 강도 검증
const jwtSecret = process.env.JWT_ACCESS_SECRET;
if (jwtSecret && jwtSecret.length >= 64) {
    console.log('✅ JWT_ACCESS_SECRET: Strong');
} else {
    console.error('❌ JWT_ACCESS_SECRET: Weak (recommend 64+ characters)');
    hasErrors = true;
}

// HTTPS 프로토콜 검증
const corsOrigin = process.env.CORS_ORIGIN;
if (corsOrigin && corsOrigin.startsWith('https://')) {
    console.log('✅ CORS_ORIGIN: Uses HTTPS');
} else if (corsOrigin && !corsOrigin.includes('localhost')) {
    console.error('❌ CORS_ORIGIN: Should use HTTPS in production');
    hasErrors = true;
}

// 결과 출력
console.log('\n' + '='.repeat(50));
if (hasErrors) {
    console.error('❌ Validation failed! Please fix the errors above.');
    process.exit(1);
} else {
    console.log('✅ All environment variables validated successfully!');
    process.exit(0);
}
```

---

## 9. 롤백 계획

### 9.1 롤백 스크립트 (scripts/rollback.sh)

```bash
#!/bin/bash

# Rollback Script
# Usage: ./scripts/rollback.sh [version]

set -e

VERSION=${1:-"previous"}

echo "⏪ Rolling back to version: $VERSION"

# 1. 이전 Docker 이미지로 롤백
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --scale backend=0
docker tag community-backend:$VERSION community-backend:latest
docker-compose -f docker-compose.production.yml up -d

# 2. 헬스 체크
sleep 10
curl -f http://localhost:5000/health || {
    echo "❌ Rollback health check failed!"
    exit 1
}

echo "✅ Rollback completed successfully!"
```

---

## 10. 참고 자료

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Let's Encrypt**: https://letsencrypt.org/
- **Helmet.js 문서**: https://helmetjs.github.io/
- **Express Rate Limit**: https://github.com/nfriedly/express-rate-limit
- **Winston Logger**: https://github.com/winstonjs/winston
- **Sentry 문서**: https://docs.sentry.io/
- **Trivy 문서**: https://aquasecurity.github.io/trivy/
- **OWASP ZAP 문서**: https://www.zaproxy.org/docs/

---

**작성일:** 2025년 10월 5일  
**버전:** 1.0.0  
**작성자:** Community Platform Security Team
