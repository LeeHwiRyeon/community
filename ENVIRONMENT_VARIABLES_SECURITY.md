# 환경변수 보안 가이드

**버전**: 1.0  
**작성일**: 2025년 11월 9일  
**대상**: 개발자, DevOps, 시스템 관리자

---

## 📋 목차

1. [개요](#개요)
2. [필수 환경변수](#필수-환경변수)
3. [시크릿 생성](#시크릿-생성)
4. [환경별 설정](#환경별-설정)
5. [보안 모범 사례](#보안-모범-사례)
6. [CI/CD 통합](#cicd-통합)
7. [검증 스크립트](#검증-스크립트)
8. [문제 해결](#문제-해결)

---

## 1. 개요

### 1.1 환경변수란?

환경변수는 애플리케이션 실행 환경에서 사용되는 **설정 값**입니다.
- 코드에 하드코딩하지 않고 외부에서 주입
- 환경(개발/스테이징/프로덕션)별로 다른 값 사용
- 민감한 정보(시크릿) 보호

### 1.2 보안 원칙

✅ **분리**: 코드와 설정 분리  
✅ **격리**: 환경별 독립적인 시크릿  
✅ **최소 권한**: 필요한 사람만 접근  
✅ **로테이션**: 정기적 시크릿 변경  
✅ **암호화**: 전송 및 저장 시 암호화  
✅ **감사**: 접근 로그 기록

---

## 2. 필수 환경변수

### 2.1 전체 목록

```bash
# ============================================
# 커뮤니티 플랫폼 환경변수 설정
# ============================================

# -----------------
# 애플리케이션 설정
# -----------------
NODE_ENV=production                    # 실행 환경 (development, production, test)
PORT=50000                             # 서버 포트
HOST=0.0.0.0                          # 바인딩 호스트

# -----------------
# JWT 설정
# -----------------
JWT_SECRET=<256-bit-random-hex>       # JWT 서명 시크릿 (필수!)
JWT_EXPIRES_IN=15m                    # Access Token 수명
REFRESH_TOKEN_EXPIRES_IN=7d           # Refresh Token 수명
JWT_ALGORITHM=RS256                   # JWT 알고리즘

# -----------------
# 세션 설정
# -----------------
SESSION_SECRET=<256-bit-random-hex>   # 세션 서명 시크릿 (필수!)
SESSION_NAME=community_session        # 세션 쿠키 이름
SESSION_MAX_AGE=3600000              # 세션 수명 (밀리초, 1시간)

# -----------------
# 데이터베이스 설정
# -----------------
DB_HOST=localhost                     # MySQL 호스트
DB_PORT=3306                          # MySQL 포트
DB_NAME=community_db                  # 데이터베이스 이름
DB_USER=community_user                # 데이터베이스 사용자
DB_PASSWORD=<strong-password>         # 데이터베이스 비밀번호 (필수!)
DB_CONNECTION_LIMIT=10                # 커넥션 풀 크기

# -----------------
# Redis 설정
# -----------------
REDIS_URL=redis://localhost:6379      # Redis 연결 URL (개발)
# 또는 프로덕션:
# REDIS_URL=rediss://:password@host:6380  # TLS 사용

# -----------------
# CORS 설정
# -----------------
CORS_ORIGIN=http://localhost:3000     # 허용할 프론트엔드 URL
# 프로덕션:
# CORS_ORIGIN=https://yourdomain.com

# -----------------
# OAuth 2.0 설정
# -----------------
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:50000/api/auth/google/callback

GITHUB_CLIENT_ID=<your-client-id>
GITHUB_CLIENT_SECRET=<your-client-secret>

KAKAO_CLIENT_ID=<your-client-id>
KAKAO_CLIENT_SECRET=<your-client-secret>

NAVER_CLIENT_ID=<your-client-id>
NAVER_CLIENT_SECRET=<your-client-secret>

# -----------------
# HTTPS/SSL 설정 (프로덕션)
# -----------------
SSL_CERT_PATH=/path/to/cert.pem       # SSL 인증서 경로
SSL_KEY_PATH=/path/to/key.pem         # SSL 개인키 경로
FORCE_HTTPS=true                      # HTTPS 강제

# -----------------
# 로깅 설정
# -----------------
LOG_LEVEL=info                        # 로그 레벨 (debug, info, warn, error)
LOG_FILE_PATH=/var/log/community/app.log

# -----------------
# 이메일 설정 (선택)
# -----------------
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email>
SMTP_PASSWORD=<your-app-password>
EMAIL_FROM=noreply@yourdomain.com

# -----------------
# Rate Limiting
# -----------------
RATE_LIMIT_WINDOW=900000              # 15분 (밀리초)
RATE_LIMIT_MAX_REQUESTS=100           # 최대 요청 수

# -----------------
# 보안 설정
# -----------------
BCRYPT_ROUNDS=10                      # bcrypt 라운드 수
MAX_LOGIN_ATTEMPTS=5                  # 최대 로그인 시도 횟수
ACCOUNT_LOCKOUT_DURATION=900000       # 계정 잠금 시간 (15분)

# -----------------
# 개발 전용 설정
# -----------------
# NODE_ENV=development일 때만 사용
DEBUG=true                            # 디버그 모드
MOCK_REDIS=false                      # Redis 모킹
```

### 2.2 우선순위별 분류

#### 🔴 필수 (없으면 서버 시작 실패)
- `JWT_SECRET`
- `SESSION_SECRET`
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

#### 🟡 권장 (없으면 기본값 사용, 보안 취약)
- `JWT_EXPIRES_IN`
- `REFRESH_TOKEN_EXPIRES_IN`
- `REDIS_URL`
- `CORS_ORIGIN`

#### 🟢 선택 (기능별 필요)
- OAuth 관련 변수
- SMTP 관련 변수
- SSL 관련 변수

---

## 3. 시크릿 생성

### 3.1 강력한 시크릿 생성 방법

#### 방법 1: OpenSSL (권장)
```bash
# 256-bit (32 bytes) 랜덤 hex
openssl rand -hex 32

# 출력 예:
# 3f8a9c2b1e7d4a5f6c8b3e1d9a2f4c7b8e3d1a6f9c2b5e8a7d4f1c3b6e9a2d5f
```

#### 방법 2: Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 방법 3: Python
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

#### 방법 4: 온라인 도구 (주의)
- https://www.random.org/strings/
- ⚠️ 프로덕션에는 사용하지 말 것 (로컬 생성 권장)

### 3.2 시크릿 강도 체크리스트

- [x] 최소 256 bits (32 bytes)
- [x] 완전 랜덤 (예측 불가)
- [x] 영숫자 + 특수문자 혼합
- [x] 사전 단어 미포함
- [x] 환경별로 다른 값 사용

#### ❌ 나쁜 예
```bash
JWT_SECRET=mysecret123              # 너무 짧고 예측 가능
JWT_SECRET=password                 # 사전 단어
JWT_SECRET=12345678901234567890     # 패턴 있음
```

#### ✅ 좋은 예
```bash
JWT_SECRET=3f8a9c2b1e7d4a5f6c8b3e1d9a2f4c7b8e3d1a6f9c2b5e8a7d4f1c3b6e9a2d5f
```

---

## 4. 환경별 설정

### 4.1 개발 환경 (.env.development)

```bash
# .env.development
NODE_ENV=development
PORT=50000
HOST=localhost

# 개발용 시크릿 (프로덕션과 다름!)
JWT_SECRET=dev-jwt-secret-not-for-production-use-only-1234567890abcdef
SESSION_SECRET=dev-session-secret-not-for-production-use-only-1234567890

# 로컬 데이터베이스
DB_HOST=localhost
DB_PORT=3306
DB_NAME=community_dev
DB_USER=root
DB_PASSWORD=root

# 로컬 Redis
REDIS_URL=redis://localhost:6379

# 로컬 CORS
CORS_ORIGIN=http://localhost:3000

# 디버그 활성화
DEBUG=true
LOG_LEVEL=debug
```

### 4.2 프로덕션 환경 (.env.production)

```bash
# .env.production
NODE_ENV=production
PORT=50000
HOST=0.0.0.0

# ⚠️ 실제 값은 시크릿 관리 도구에서 주입
JWT_SECRET=${VAULT_JWT_SECRET}
SESSION_SECRET=${VAULT_SESSION_SECRET}

# 프로덕션 데이터베이스
DB_HOST=prod-db.example.com
DB_PORT=3306
DB_NAME=community_prod
DB_USER=prod_user
DB_PASSWORD=${VAULT_DB_PASSWORD}

# 프로덕션 Redis (TLS)
REDIS_URL=rediss://:${VAULT_REDIS_PASSWORD}@redis.example.com:6380

# 프로덕션 CORS
CORS_ORIGIN=https://yourdomain.com

# HTTPS 강제
FORCE_HTTPS=true
SSL_CERT_PATH=/etc/ssl/certs/yourdomain.crt
SSL_KEY_PATH=/etc/ssl/private/yourdomain.key

# 로깅
LOG_LEVEL=warn
LOG_FILE_PATH=/var/log/community/app.log
```

### 4.3 테스트 환경 (.env.test)

```bash
# .env.test
NODE_ENV=test
PORT=50001

# 테스트용 시크릿
JWT_SECRET=test-jwt-secret-1234567890
SESSION_SECRET=test-session-secret-1234567890

# 테스트 데이터베이스
DB_HOST=localhost
DB_NAME=community_test
DB_USER=test_user
DB_PASSWORD=test_password

# 모킹 활성화
MOCK_REDIS=true
MOCK_SMTP=true

LOG_LEVEL=error  # 테스트 시 에러만 출력
```

---

## 5. 보안 모범 사례

### 5.1 DO ✅

#### 1. .env 파일을 .gitignore에 추가
```gitignore
# .gitignore
.env
.env.*
!.env.example

# 예외: 템플릿은 커밋 가능
# .env.example
```

#### 2. .env.example 제공
```bash
# .env.example (템플릿)
JWT_SECRET=<your-jwt-secret-here>
SESSION_SECRET=<your-session-secret-here>
DB_PASSWORD=<your-db-password-here>

# 사용법:
# 1. 이 파일을 .env로 복사
# 2. <...> 부분을 실제 값으로 교체
```

#### 3. 환경변수 검증
```javascript
// server.js
function validateEnvironment() {
    const required = [
        'JWT_SECRET',
        'SESSION_SECRET',
        'DB_HOST',
        'DB_USER',
        'DB_PASSWORD',
        'DB_NAME'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error('❌ 필수 환경변수 누락:', missing);
        process.exit(1);
    }

    // 길이 검증
    if (process.env.JWT_SECRET.length < 32) {
        console.error('❌ JWT_SECRET이 너무 짧습니다');
        process.exit(1);
    }

    console.log('✅ 환경변수 검증 완료');
}

validateEnvironment();
```

#### 4. 시크릿 로테이션
```bash
# 90일마다 시크릿 교체 권장

# 1. 새 시크릿 생성
NEW_JWT_SECRET=$(openssl rand -hex 32)

# 2. 배포 전 테스트
JWT_SECRET=$NEW_JWT_SECRET npm test

# 3. 무중단 배포
# - Blue/Green 배포
# - 또는 Rolling 업데이트
```

#### 5. 시크릿 관리 도구 사용
```bash
# AWS Secrets Manager
aws secretsmanager get-secret-value \
    --secret-id prod/community/jwt-secret \
    --query SecretString \
    --output text

# HashiCorp Vault
vault kv get -field=jwt_secret secret/community/prod

# Azure Key Vault
az keyvault secret show \
    --name jwt-secret \
    --vault-name community-vault \
    --query value -o tsv
```

### 5.2 DON'T ❌

#### 1. 시크릿 하드코딩 금지
```javascript
// ❌ 절대 금지
const JWT_SECRET = 'my-secret-key';

// ✅ 좋음
const JWT_SECRET = process.env.JWT_SECRET;
```

#### 2. 시크릿을 Git에 커밋 금지
```bash
# ❌ 절대 금지
git add .env
git commit -m "Add environment variables"

# 만약 실수로 커밋했다면:
# 1. 즉시 시크릿 교체
# 2. Git 히스토리에서 제거
git filter-branch --force --index-filter \
    "git rm --cached --ignore-unmatch .env" \
    --prune-empty --tag-name-filter cat -- --all
```

#### 3. 시크릿을 로그에 출력 금지
```javascript
// ❌ 절대 금지
console.log('JWT_SECRET:', process.env.JWT_SECRET);

// ✅ 좋음
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '***' : 'NOT SET');
```

#### 4. 약한 시크릿 사용 금지
```bash
# ❌ 절대 금지
JWT_SECRET=123456
JWT_SECRET=password
JWT_SECRET=secret
```

#### 5. 모든 환경에서 같은 시크릿 사용 금지
```bash
# ❌ 나쁨: 개발과 프로덕션이 동일
# 개발: JWT_SECRET=abc123
# 프로덕션: JWT_SECRET=abc123

# ✅ 좋음: 완전히 다른 시크릿
# 개발: JWT_SECRET=dev-3f8a9c2b...
# 프로덕션: JWT_SECRET=prod-7d2e1b9a...
```

---

## 6. CI/CD 통합

### 6.1 GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        env:
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          SESSION_SECRET: ${{ secrets.SESSION_SECRET }}
          DB_HOST: ${{ secrets.DB_HOST }}
          DB_USER: ${{ secrets.DB_USER }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
          DB_NAME: ${{ secrets.DB_NAME }}
        run: npm test
      
      - name: Deploy to server
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
        run: |
          echo "$DEPLOY_KEY" > deploy_key
          chmod 600 deploy_key
          ssh -i deploy_key user@server "cd /app && git pull && npm install && pm2 restart all"
```

#### GitHub Secrets 설정
1. Repository → Settings → Secrets and variables → Actions
2. New repository secret 클릭
3. 각 시크릿 추가:
   - `JWT_SECRET`
   - `SESSION_SECRET`
   - `DB_PASSWORD`
   - 등등

### 6.2 Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# ⚠️ 환경변수는 런타임에 주입
# ARG로 빌드 타임에 주입하지 말것!

CMD ["node", "src/server.js"]
```

```yaml
# docker-compose.yml (프로덕션)
version: '3.8'

services:
  app:
    build: .
    ports:
      - "50000:50000"
    environment:
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}
      SESSION_SECRET: ${SESSION_SECRET}
      DB_HOST: ${DB_HOST}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
      REDIS_URL: ${REDIS_URL}
    env_file:
      - .env.production
```

```bash
# 실행
docker-compose --env-file .env.production up -d
```

---

## 7. 검증 스크립트

### 7.1 환경변수 검증 스크립트

```javascript
// scripts/verify-env.js
const crypto = require('crypto');

const REQUIRED_VARS = [
    'JWT_SECRET',
    'SESSION_SECRET',
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME'
];

const RECOMMENDED_VARS = [
    'REDIS_URL',
    'CORS_ORIGIN',
    'JWT_EXPIRES_IN',
    'REFRESH_TOKEN_EXPIRES_IN'
];

function checkRequired() {
    console.log('🔍 필수 환경변수 검증...\n');
    
    const missing = [];
    const weak = [];

    for (const varName of REQUIRED_VARS) {
        const value = process.env[varName];
        
        if (!value) {
            missing.push(varName);
        } else {
            // 시크릿 강도 검증
            if (varName.includes('SECRET') && value.length < 32) {
                weak.push(`${varName} (길이: ${value.length}, 권장: 32+)`);
            }
        }
    }

    if (missing.length > 0) {
        console.error('❌ 누락된 필수 환경변수:');
        missing.forEach(v => console.error(`   - ${v}`));
        process.exit(1);
    }

    if (weak.length > 0) {
        console.warn('⚠️  약한 시크릿 감지:');
        weak.forEach(v => console.warn(`   - ${v}`));
    }

    console.log('✅ 필수 환경변수 검증 완료\n');
}

function checkRecommended() {
    console.log('🔍 권장 환경변수 확인...\n');
    
    const missing = [];

    for (const varName of RECOMMENDED_VARS) {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    }

    if (missing.length > 0) {
        console.warn('⚠️  권장 환경변수 미설정 (기본값 사용):');
        missing.forEach(v => console.warn(`   - ${v}`));
    } else {
        console.log('✅ 모든 권장 환경변수 설정됨');
    }
    
    console.log();
}

function checkSecurity() {
    console.log('🔍 보안 검증...\n');
    
    const issues = [];

    // NODE_ENV 확인
    if (process.env.NODE_ENV === 'production') {
        // 프로덕션 보안 체크
        if (process.env.DEBUG === 'true') {
            issues.push('DEBUG 모드가 활성화되어 있습니다');
        }
        
        if (!process.env.FORCE_HTTPS) {
            issues.push('HTTPS 강제가 비활성화되어 있습니다');
        }

        if (!process.env.REDIS_URL?.startsWith('rediss://')) {
            issues.push('Redis가 TLS를 사용하지 않습니다');
        }
    }

    // 개발용 시크릿 사용 체크
    if (process.env.JWT_SECRET?.includes('dev-') && 
        process.env.NODE_ENV === 'production') {
        issues.push('프로덕션에서 개발용 시크릿을 사용하고 있습니다!');
    }

    if (issues.length > 0) {
        console.error('❌ 보안 문제 감지:');
        issues.forEach(i => console.error(`   - ${i}`));
        
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    } else {
        console.log('✅ 보안 검증 통과\n');
    }
}

function main() {
    console.log('='.repeat(50));
    console.log('환경변수 검증 스크립트');
    console.log('='.repeat(50));
    console.log();

    checkRequired();
    checkRecommended();
    checkSecurity();

    console.log('='.repeat(50));
    console.log('✅ 모든 검증 완료');
    console.log('='.repeat(50));
}

main();
```

### 7.2 사용법

```bash
# package.json에 스크립트 추가
{
  "scripts": {
    "verify-env": "node scripts/verify-env.js",
    "start": "npm run verify-env && node src/server.js"
  }
}

# 실행
npm run verify-env
```

---

## 8. 문제 해결

### 8.1 일반적인 오류

#### "JWT_SECRET is not defined"
```bash
# 원인: 환경변수 미설정
# 해결:
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
```

#### "Cannot read property 'XXX' of undefined"
```bash
# 원인: .env 파일 로드 실패
# 해결: dotenv가 제대로 로드되었는지 확인
node -e "require('dotenv').config(); console.log(process.env.JWT_SECRET)"
```

#### "Environment variable too short"
```bash
# 원인: 시크릿 길이 부족
# 해결: 더 긴 시크릿 생성
JWT_SECRET=$(openssl rand -hex 32)  # 64자 hex
```

### 8.2 디버깅

```javascript
// 환경변수 확인 (시크릿 마스킹)
Object.keys(process.env)
    .filter(key => key.includes('SECRET'))
    .forEach(key => {
        const value = process.env[key];
        console.log(`${key}: ${value ? '***' : 'NOT SET'} (${value?.length || 0} chars)`);
    });
```

---

## 9. 시크릿 유출 시 대응

### 9.1 즉각 조치

1. **시크릿 즉시 교체**
   ```bash
   # 새 시크릿 생성
   NEW_JWT_SECRET=$(openssl rand -hex 32)
   
   # 환경변수 업데이트
   # 또는 시크릿 관리 도구에서 업데이트
   ```

2. **영향 받는 토큰 무효화**
   ```bash
   # 모든 사용자 강제 로그아웃
   redis-cli FLUSHDB
   ```

3. **감사 로그 확인**
   ```sql
   SELECT * FROM audit_log 
   WHERE created_at > '유출 시점'
   ORDER BY created_at DESC;
   ```

4. **사용자 알림**
   - 보안 공지 발행
   - 재로그인 요청
   - 비밀번호 변경 권장

### 9.2 장기 대응

- [ ] Git 히스토리 정리
- [ ] 로테이션 주기 단축 (90일 → 30일)
- [ ] 시크릿 스캔 도구 도입
- [ ] 접근 제어 강화
- [ ] 감사 로그 모니터링 강화

---

## 10. 참고 자료

### 10.1 내부 문서
- [SECURITY_FINAL_REPORT.md](./SECURITY_FINAL_REPORT.md)
- [JWT_SECURITY_CHECKLIST.md](./JWT_SECURITY_CHECKLIST.md)
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

### 10.2 외부 자료
- [The Twelve-Factor App](https://12factor.net/config)
- [OWASP Secrets Management](https://owasp.org/www-community/SecretManagement)
- [dotenv Documentation](https://github.com/motdotla/dotenv)

---

**작성자**: GitHub Copilot Security Team  
**검토일**: 2025년 11월 9일  
**다음 검토**: 2026년 2월 9일
