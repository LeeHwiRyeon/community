# Redis 세션 저장소 통합 가이드

## 📋 개요

Express 세션을 메모리 저장소에서 Redis 저장소로 마이그레이션하여 프로덕션 환경에서 세션 지속성을 보장합니다.

---

## 🎯 주요 기능

### 1️⃣ Redis 세션 저장소
- **지속성**: 서버 재시작 후에도 세션 유지
- **확장성**: 여러 서버 인스턴스 간 세션 공유
- **성능**: 메모리 기반 고속 액세스
- **자동 만료**: TTL 기반 자동 세션 정리

### 2️⃣ CSRF 토큰 지속성
- Redis에 세션이 저장되므로 CSRF 토큰도 함께 유지
- 서버 재시작 후에도 기존 CSRF 토큰 유효
- 세션 만료 시 CSRF 토큰도 자동 만료

### 3️⃣ Fallback 지원
- Redis 미연결 시 자동으로 메모리 세션 사용
- 개발 환경에서 Redis 없이도 작동
- 프로덕션에서는 Redis 필수

---

## 🔧 설치 및 설정

### 1️⃣ Redis 설치

#### Windows
```bash
# Chocolatey 사용
choco install redis-64

# 또는 MSI 설치 파일 다운로드
# https://github.com/microsoftarchive/redis/releases

# Redis 시작
redis-server

# Redis 상태 확인
redis-cli ping
# 응답: PONG
```

#### macOS
```bash
# Homebrew 사용
brew install redis

# Redis 시작
brew services start redis

# 또는 직접 실행
redis-server

# Redis 상태 확인
redis-cli ping
```

#### Linux (Ubuntu/Debian)
```bash
# Redis 설치
sudo apt-get update
sudo apt-get install redis-server

# Redis 시작
sudo systemctl start redis
sudo systemctl enable redis

# Redis 상태 확인
redis-cli ping
```

#### Docker
```bash
# Redis 컨테이너 실행
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:latest

# Redis 상태 확인
docker exec redis redis-cli ping
```

### 2️⃣ 패키지 설치

프로젝트에 필요한 패키지가 이미 설치되어 있습니다:
- `redis@^5.x` - Redis 클라이언트
- `connect-redis@^9.x` - Express 세션 Redis 저장소
- `express-session@^1.18.x` - Express 세션 미들웨어

확인:
```bash
cd server-backend
npm list redis connect-redis express-session
```

### 3️⃣ 환경 변수 설정

`.env.development` 파일:
```env
# Redis Configuration
REDIS_URL=redis://localhost:6379

# 비밀번호가 필요한 경우:
# REDIS_URL=redis://:your-password@localhost:6379

# 원격 Redis 서버:
# REDIS_URL=redis://username:password@redis-server:6379

# Session Configuration
SESSION_SECRET=your-session-secret-key-change-this-in-production
```

`.env` (프로덕션) 파일:
```env
# Redis Configuration
REDIS_URL=${REDIS_URL}

# Session Configuration
SESSION_SECRET=${SESSION_SECRET}
```

---

## 🏗️ 구현 내역

### 1️⃣ Redis 클라이언트 Export (`src/redis.js`)

```javascript
/**
 * Redis 클라이언트 인스턴스를 반환합니다.
 */
export function getRedisClient() {
    return redisClient;
}
```

### 2️⃣ 세션 저장소 설정 (`src/server.js`)

```javascript
import RedisStore from 'connect-redis';
import { getRedisClient } from './redis.js';

// 세션 설정
const sessionConfig = {
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 60 * 60 * 1000, // 1시간
        sameSite: 'strict'
    }
};

// Redis 저장소 설정
const redisClient = getRedisClient();
if (redisClient) {
    sessionConfig.store = new RedisStore({
        client: redisClient,
        prefix: 'sess:',
        ttl: 60 * 60 // 1시간 (초 단위)
    });
    logger.info('✅ Redis 세션 저장소 활성화');
} else {
    logger.warn('⚠️  Redis 미연결 - 메모리 세션 사용');
}

app.use(session(sessionConfig));
```

### 3️⃣ 세션 데이터 구조

Redis에 저장되는 세션 데이터:
```json
{
  "cookie": {
    "originalMaxAge": 3600000,
    "expires": "2025-11-09T01:00:00.000Z",
    "secure": false,
    "httpOnly": true,
    "path": "/",
    "sameSite": "strict"
  },
  "csrfSecret": "32-byte-random-string",
  "csrfToken": "csrf-token-value"
}
```

Redis 키 형식:
```
sess:uTzOhTzO-_tJsOoXtjg6_IHezNM8Uqiu
```

---

## 🧪 테스트

### 1️⃣ 수동 테스트 스크립트

**파일**: `server-backend/scripts/test-redis-session.js`

**실행 방법**:
```bash
# 서버 시작 (별도 터미널)
cd server-backend
npm start

# 테스트 실행 (새 터미널)
npm run test:redis-session
```

**테스트 항목**:
1. ✅ Redis 연결 상태 확인
2. ✅ CSRF 토큰 발급 및 세션 생성
3. ✅ CSRF 보호된 요청 (세션 검증)
4. ✅ 세션 지속성 (연속 요청)
5. ✅ 세션 정보 조회
6. ✅ Redis 저장소 확인

**예상 출력**:
```
🧪 Redis 세션 저장소 테스트

서버: http://localhost:50000

🔍 서버 연결 확인 중...
✅ 서버 연결 성공

📝 Redis 연결 확인
✅ Redis 연결 상태
   Redis가 연결되어 있습니다

📝 테스트 1: CSRF 토큰 발급 및 세션 생성
✅ CSRF 토큰 발급
   토큰: a1b2c3d4e5f6g7h8...
✅ 세션 쿠키 생성
   쿠키: connect.sid=s%3A...

📝 테스트 2: CSRF 토큰으로 보호된 요청
✅ CSRF 보호된 요청
   세션 및 CSRF 검증 성공

📝 테스트 3: 세션 지속성 (연속 요청)
✅ 연속 3회 요청
   모든 요청에서 세션 유지

📝 테스트 4: 세션 정보 조회
✅ 세션 정보 조회
   만료까지: 59분

📝 테스트 5: Redis 저장소 확인
✅ Redis 세션 저장
   Redis가 연결되어 있어 세션이 지속됩니다

📊 테스트 결과 요약
──────────────────────────────────────────────────
✅ 통과: 6/6
❌ 실패: 0/6

🎉 모든 테스트 통과!
✅ Redis 세션 저장소가 정상 작동합니다
✅ 서버 재시작 후에도 세션이 유지됩니다
```

### 2️⃣ Redis CLI로 직접 확인

```bash
# Redis CLI 접속
redis-cli

# 모든 세션 키 조회
127.0.0.1:6379> KEYS sess:*
1) "sess:uTzOhTzO-_tJsOoXtjg6_IHezNM8Uqiu"

# 세션 TTL 확인 (초 단위)
127.0.0.1:6379> TTL sess:uTzOhTzO-_tJsOoXtjg6_IHezNM8Uqiu
(integer) 3542

# 세션 데이터 조회
127.0.0.1:6379> GET sess:uTzOhTzO-_tJsOoXtjg6_IHezNM8Uqiu
"{\"cookie\":{\"originalMaxAge\":3600000,...}}"

# 모든 세션 키 개수
127.0.0.1:6379> KEYS sess:* | wc -l
```

### 3️⃣ 서버 재시작 테스트

1. **서버 시작 및 세션 생성**:
```bash
cd server-backend
npm start
```

2. **다른 터미널에서 CSRF 토큰 발급**:
```bash
curl http://localhost:50000/api/auth/csrf-token \
  -c cookies.txt \
  -b cookies.txt
```

3. **쿠키와 토큰 저장됨 확인**:
```bash
cat cookies.txt
```

4. **서버 중지**:
```
Ctrl + C
```

5. **서버 재시작**:
```bash
npm start
```

6. **기존 세션으로 요청** (Redis 연결 시 성공):
```bash
curl http://localhost:50000/api/test/protected \
  -X POST \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: <저장된-토큰>" \
  -b cookies.txt \
  -d '{"test":"data"}'
```

**결과**:
- ✅ Redis 연결: 200 OK (세션 유지)
- ❌ Redis 미연결: 403 Forbidden (세션 손실)

---

## 📊 성능 및 모니터링

### 1️⃣ Redis 메모리 사용량

```bash
# Redis 정보 조회
redis-cli INFO memory

# 특정 정보만 조회
redis-cli INFO memory | grep used_memory_human
```

### 2️⃣ 세션 통계

```bash
# 활성 세션 수
redis-cli KEYS "sess:*" | wc -l

# 평균 TTL
redis-cli --scan --pattern "sess:*" | xargs -L1 redis-cli TTL | awk '{s+=$1; c++} END {print s/c}'
```

### 3️⃣ 로그 모니터링

```bash
# Redis 명령 모니터링 (실시간)
redis-cli MONITOR

# 느린 쿼리 로그
redis-cli SLOWLOG GET 10
```

---

## 🔒 보안 고려사항

### 1️⃣ Redis 비밀번호 설정

**redis.conf**:
```conf
requirepass your-strong-password
```

**환경 변수**:
```env
REDIS_URL=redis://:your-strong-password@localhost:6379
```

### 2️⃣ Redis 네트워크 보안

**redis.conf**:
```conf
# 로컬만 접근 허용
bind 127.0.0.1 ::1

# 보호 모드 활성화
protected-mode yes
```

### 3️⃣ TLS/SSL 암호화

**redis.conf**:
```conf
tls-port 6380
tls-cert-file /path/to/redis.crt
tls-key-file /path/to/redis.key
tls-ca-cert-file /path/to/ca.crt
```

**환경 변수**:
```env
REDIS_URL=rediss://localhost:6380
```

---

## 🚨 문제 해결

### 1️⃣ Redis 연결 실패

**증상**:
```
⚠️  Redis 미연결 - 메모리 세션 저장소 사용
```

**해결 방법**:
1. Redis 서버 실행 확인:
```bash
redis-cli ping
```

2. 환경 변수 확인:
```bash
echo $REDIS_URL
```

3. 포트 확인:
```bash
# Windows
netstat -an | findstr 6379

# Linux/Mac
netstat -an | grep 6379
```

### 2️⃣ 세션 손실

**증상**: 서버 재시작 후 세션이 사라짐

**원인**: Redis가 연결되지 않음

**해결 방법**:
1. Redis 연결 상태 확인
2. `.env` 파일에 `REDIS_URL` 설정 확인
3. 서버 로그에서 Redis 연결 메시지 확인

### 3️⃣ 메모리 부족

**증상**:
```
OOM command not allowed when used memory > 'maxmemory'
```

**해결 방법**:
1. **maxmemory 증가** (redis.conf):
```conf
maxmemory 256mb
```

2. **만료 정책 설정**:
```conf
maxmemory-policy allkeys-lru
```

3. **불필요한 세션 정리**:
```bash
# 만료된 키 삭제
redis-cli --scan --pattern "sess:*" | xargs redis-cli DEL
```

---

## 📈 프로덕션 배포

### 1️⃣ Redis 설정 체크리스트

- [ ] Redis 비밀번호 설정
- [ ] 네트워크 보안 (bind 설정)
- [ ] TLS/SSL 암호화 (선택)
- [ ] maxmemory 설정
- [ ] persistence 설정 (AOF/RDB)
- [ ] 백업 전략

### 2️⃣ persistence 설정

**redis.conf**:
```conf
# RDB 스냅샷 (빠른 백업)
save 900 1
save 300 10
save 60 10000

# AOF (안전성 높음)
appendonly yes
appendfsync everysec
```

### 3️⃣ 환경 변수 (프로덕션)

```env
# Redis Configuration
REDIS_URL=rediss://:${REDIS_PASSWORD}@redis-server:6380

# Session Configuration
SESSION_SECRET=${SESSION_SECRET}
NODE_ENV=production
```

---

## 📚 참고 자료

- [connect-redis 문서](https://www.npmjs.com/package/connect-redis)
- [Redis 공식 문서](https://redis.io/documentation)
- [express-session 문서](https://www.npmjs.com/package/express-session)
- [Redis 보안 가이드](https://redis.io/topics/security)

---

## ✅ 완료 상태

- [x] Redis 클라이언트 export 함수 추가
- [x] RedisStore 설정 (connect-redis)
- [x] Fallback 메모리 세션 지원
- [x] 환경 변수 설정 (.env.development)
- [x] 세션 지속성 테스트 스크립트
- [x] package.json 스크립트 추가 (test:redis-session)
- [x] Redis 설정 문서 작성
- [ ] 프로덕션 환경 Redis 배포
- [ ] 모니터링 대시보드 설정

---

**작성일**: 2025년 11월 9일
**버전**: 1.0.0
**작성자**: GitHub Copilot
