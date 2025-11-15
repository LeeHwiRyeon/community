# Redis Integration Planning

## 📋 목차

1. [현재 상태 분석](#현재-상태-분석)
2. [Redis 통합 목적](#redis-통합-목적)
3. [통합 계획](#통합-계획)
4. [구현 단계](#구현-단계)
5. [성능 예상 효과](#성능-예상-효과)
6. [리스크 및 대응 방안](#리스크-및-대응-방안)

---

## 현재 상태 분석

### In-Memory Session Store (현재)

**장점**:
- ✅ 설정 불필요 (Redis 설치 없이 작동)
- ✅ 로컬 개발에 적합
- ✅ 단순하고 빠름

**단점**:
- ❌ 서버 재시작 시 세션 손실
- ❌ 다중 인스턴스 불가 (로드 밸런싱 X)
- ❌ 메모리 누수 위험
- ❌ 세션 영속성 부족

### 현재 코드 구조

**세션 설정**: `server-backend/src/index.js` (추정)

```javascript
// 현재 In-Memory 세션 스토어
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore(), // 메모리 기반
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7일
  }
}));
```

**Redis 연결 시도**: 
```
⚠️  Redis connection failed, using in-memory session store
```

---

## Redis 통합 목적

### 1. 세션 영속성

- 서버 재시작 후에도 세션 유지
- 사용자 경험 향상 (재로그인 불필요)

### 2. 확장성

- 다중 서버 인스턴스 지원 (로드 밸런싱)
- Horizontal Scaling 가능

### 3. 캐싱

- API 응답 캐싱
- 자주 조회되는 데이터 캐싱 (사용자 프로필, 게시판 목록 등)
- 데이터베이스 부하 감소

### 4. 실시간 기능

- 온라인 상태 추적
- 실시간 알림 큐
- Rate Limiting (API 요청 제한)

---

## 통합 계획

### Phase 1: 세션 스토어 (우선순위 높음)

**목표**: In-Memory 세션을 Redis 세션으로 전환

**기대 효과**:
- 세션 영속성 확보
- 서버 재시작 시 사용자 로그인 상태 유지

**작업량**: 약 2-3시간

### Phase 2: 캐싱 레이어 (우선순위 중간)

**목표**: 자주 조회되는 데이터를 Redis에 캐싱

**캐싱 대상**:
- 게시판 목록 (`/api/boards`)
- 인기 게시글 (`/api/posts/popular`)
- 사용자 프로필 (조회 빈도 높은 경우)
- 검색 결과 (동일 쿼리 반복 시)

**기대 효과**:
- 데이터베이스 쿼리 50% 이상 감소
- API 응답 시간 30-50% 단축

**작업량**: 약 4-6시간

### Phase 3: 실시간 기능 강화 (우선순위 낮음)

**목표**: Redis Pub/Sub을 활용한 실시간 기능

**기능**:
- 실시간 알림 전송
- 온라인 사용자 카운트
- 실시간 채팅 (향후 확장)

**작업량**: 약 6-8시간

---

## 구현 단계

### Step 1: Redis 설치 및 연결

#### 로컬 개발 환경

**Option A: Docker (권장)**

```powershell
# Redis 컨테이너 실행
docker run -d `
  --name redis `
  -p 6379:6379 `
  redis:7-alpine redis-server --requirepass your_redis_password

# 연결 테스트
docker exec -it redis redis-cli -a your_redis_password ping
# 응답: PONG
```

**Option B: Windows 설치**

1. Redis for Windows 다운로드:
   - https://github.com/microsoftarchive/redis/releases
   - 최신 MSI 파일 설치

2. Redis 서비스 시작:
   ```powershell
   redis-server
   ```

3. 연결 테스트:
   ```powershell
   redis-cli ping
   # 응답: PONG
   ```

#### 환경변수 설정

```env
# server-backend/.env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
```

### Step 2: Redis 클라이언트 설치

```powershell
cd server-backend

# Redis 클라이언트 및 세션 스토어 설치
npm install redis connect-redis
```

### Step 3: Redis 연결 모듈 생성

**파일**: `server-backend/src/config/redis.js`

```javascript
// server-backend/src/config/redis.js
const redis = require('redis');

// Redis 클라이언트 생성
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: process.env.REDIS_DB || 0,
});

// 연결 이벤트
redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

redisClient.on('ready', () => {
  console.log('✅ Redis is ready to accept commands');
});

// 연결 시도
redisClient.connect().catch((err) => {
  console.warn('⚠️  Redis connection failed, using fallback:', err.message);
});

module.exports = redisClient;
```

### Step 4: 세션 스토어 업데이트

**파일**: `server-backend/src/index.js` (또는 세션 설정 파일)

```javascript
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redisClient = require('./config/redis');

// Redis 세션 스토어 설정
app.use(session({
  store: new RedisStore({
    client: redisClient,
    prefix: 'sess:',  // 세션 키 접두사
    ttl: 60 * 60 * 24 * 7,  // 7일 (초 단위)
  }),
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7  // 7일 (밀리초)
  }
}));
```

### Step 5: Graceful Shutdown

**파일**: `server-backend/src/index.js`

```javascript
// 서버 종료 시 Redis 연결 종료
process.on('SIGINT', async () => {
  console.log('\n⏳ Shutting down gracefully...');
  
  try {
    await redisClient.quit();
    console.log('✅ Redis connection closed');
  } catch (err) {
    console.error('❌ Error closing Redis:', err.message);
  }
  
  process.exit(0);
});
```

### Step 6: 캐싱 유틸리티 생성 (Phase 2)

**파일**: `server-backend/src/utils/cache.js`

```javascript
// server-backend/src/utils/cache.js
const redisClient = require('../config/redis');

/**
 * 캐시 조회
 * @param {string} key - 캐시 키
 * @returns {Promise<any|null>} - 캐시된 데이터 또는 null
 */
async function getCache(key) {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Cache get error:', err.message);
    return null;
  }
}

/**
 * 캐시 저장
 * @param {string} key - 캐시 키
 * @param {any} value - 저장할 데이터
 * @param {number} ttl - TTL (초 단위, 기본 3600)
 */
async function setCache(key, value, ttl = 3600) {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (err) {
    console.error('Cache set error:', err.message);
  }
}

/**
 * 캐시 삭제
 * @param {string} key - 캐시 키
 */
async function delCache(key) {
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error('Cache delete error:', err.message);
  }
}

/**
 * 패턴으로 캐시 삭제
 * @param {string} pattern - 키 패턴 (예: 'posts:*')
 */
async function delCachePattern(pattern) {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (err) {
    console.error('Cache pattern delete error:', err.message);
  }
}

module.exports = {
  getCache,
  setCache,
  delCache,
  delCachePattern,
};
```

### Step 7: API 엔드포인트에 캐싱 적용 (Phase 2)

**예시**: `server-backend/src/routes/boards.js`

```javascript
const { getCache, setCache, delCachePattern } = require('../utils/cache');

// 게시판 목록 조회 (캐싱 적용)
router.get('/boards', async (req, res) => {
  try {
    const cacheKey = 'boards:list';
    
    // 캐시 확인
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log('✅ Cache hit: boards:list');
      return res.json(cachedData);
    }
    
    // DB 쿼리
    const boards = await db.query('SELECT * FROM boards WHERE is_active = 1');
    
    // 캐시 저장 (1시간)
    await setCache(cacheKey, boards, 3600);
    
    res.json(boards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 게시판 생성 (캐시 무효화)
router.post('/boards', async (req, res) => {
  try {
    // 게시판 생성 로직...
    const newBoard = await db.query('INSERT INTO boards ...');
    
    // 게시판 목록 캐시 삭제
    await delCachePattern('boards:*');
    
    res.json(newBoard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### Step 8: Docker Compose 업데이트

**파일**: `docker-compose.yml` (이미 Redis 서비스 정의됨)

```yaml
services:
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass redis_password
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    # ... (기존 설정 유지)
```

**Backend 환경변수 추가**:

```yaml
backend:
  environment:
    - REDIS_HOST=redis
    - REDIS_PORT=6379
    - REDIS_PASSWORD=redis_password
    - REDIS_DB=0
```

---

## 성능 예상 효과

### 세션 스토어 (Phase 1)

| 지표                | 현재 (In-Memory) | Redis 적용 후 |
| ------------------- | ---------------- | ------------- |
| 서버 재시작 후 세션 | ❌ 손실           | ✅ 유지        |
| 다중 인스턴스 지원  | ❌ 불가           | ✅ 가능        |
| 메모리 사용량       | 증가 추세        | 안정적        |

### 캐싱 레이어 (Phase 2)

| 지표                        | 현재  | Redis 캐싱 후 | 개선율          |
| --------------------------- | ----- | ------------- | --------------- |
| API 응답 시간 (게시판 목록) | 50ms  | 5-10ms        | **80-90%**      |
| API 응답 시간 (인기 게시글) | 120ms | 15-20ms       | **83-87%**      |
| 데이터베이스 쿼리 수        | 100%  | 30-50%        | **50-70% 감소** |
| 동시 접속자 처리            | 100명 | 500명+        | **5배 이상**    |

### 리소스 사용량

| 항목     | 추가 사용량    |
| -------- | -------------- |
| 메모리   | +128MB (Redis) |
| CPU      | +5-10%         |
| 네트워크 | 무시 가능      |

---

## 리스크 및 대응 방안

### 리스크 1: Redis 장애

**문제**: Redis 서버 다운 시 애플리케이션 중단

**대응 방안**:

1. **Fallback 메커니즘**:
   ```javascript
   // Redis 연결 실패 시 In-Memory로 fallback
   let sessionStore;
   if (redisClient.isReady) {
     sessionStore = new RedisStore({ client: redisClient });
   } else {
     console.warn('⚠️  Using in-memory session store');
     sessionStore = new MemoryStore();
   }
   ```

2. **Redis Sentinel** (프로덕션):
   - 자동 장애 복구
   - Master/Replica 구성

3. **헬스체크**:
   ```javascript
   // 주기적으로 Redis 상태 확인
   setInterval(async () => {
     try {
       await redisClient.ping();
     } catch (err) {
       console.error('Redis health check failed:', err.message);
     }
   }, 30000);  // 30초마다
   ```

### 리스크 2: 캐시 일관성

**문제**: 캐시된 데이터와 DB 데이터 불일치

**대응 방안**:

1. **짧은 TTL 설정**:
   - 자주 변경되는 데이터: 5-10분
   - 안정적인 데이터: 1시간 이상

2. **Write-Through 캐싱**:
   ```javascript
   // 데이터 업데이트 시 캐시도 함께 갱신
   async function updateBoard(id, data) {
     await db.query('UPDATE boards SET ... WHERE id = ?', [id]);
     await delCachePattern('boards:*');  // 캐시 무효화
   }
   ```

3. **Cache Warming**:
   - 서버 시작 시 주요 데이터 미리 캐싱

### 리스크 3: 메모리 부족

**문제**: Redis 메모리 초과

**대응 방안**:

1. **maxmemory 설정**:
   ```conf
   # redis.conf
   maxmemory 256mb
   maxmemory-policy allkeys-lru  # LRU 정책
   ```

2. **TTL 관리**:
   - 모든 캐시에 TTL 설정 (기본 1시간)

3. **모니터링**:
   ```javascript
   // Redis 메모리 사용량 확인
   const info = await redisClient.info('memory');
   console.log(info);
   ```

### 리스크 4: 네트워크 지연

**문제**: Redis와 Backend 간 네트워크 지연

**대응 방안**:

1. **Connection Pool 사용** (이미 redis 클라이언트에 내장)

2. **Pipeline 사용**:
   ```javascript
   // 여러 명령을 한 번에 전송
   const pipeline = redisClient.multi();
   pipeline.get('key1');
   pipeline.get('key2');
   const results = await pipeline.exec();
   ```

3. **로컬 Redis** (동일 서버 또는 Docker network)

---

## 구현 우선순위

### 즉시 구현 (Phase 1)

1. ✅ Redis 설치 (Docker 또는 로컬)
2. ✅ Redis 연결 모듈 생성
3. ✅ 세션 스토어 Redis로 전환
4. ✅ Graceful Shutdown 구현
5. ✅ 테스트 (세션 유지 확인)

**예상 작업 시간**: 2-3시간

### 단기 구현 (Phase 2 - 1-2주 내)

1. ⏳ 캐싱 유틸리티 생성
2. ⏳ 주요 API에 캐싱 적용
   - 게시판 목록
   - 인기 게시글
   - 사용자 프로필
3. ⏳ 캐시 무효화 로직 추가
4. ⏳ 모니터링 및 로깅

**예상 작업 시간**: 4-6시간

### 장기 구현 (Phase 3 - 1개월 내)

1. ⏳ Redis Pub/Sub 구현
2. ⏳ 실시간 알림 시스템
3. ⏳ 온라인 사용자 카운트
4. ⏳ Rate Limiting 개선
5. ⏳ Redis Sentinel 구성 (프로덕션)

**예상 작업 시간**: 6-8시간

---

## 테스트 계획

### 단위 테스트

```javascript
// tests/redis.test.js
const { getCache, setCache, delCache } = require('../src/utils/cache');

describe('Redis Cache', () => {
  test('should set and get cache', async () => {
    await setCache('test:key', { value: 'test' });
    const result = await getCache('test:key');
    expect(result).toEqual({ value: 'test' });
  });

  test('should delete cache', async () => {
    await setCache('test:delete', 'value');
    await delCache('test:delete');
    const result = await getCache('test:delete');
    expect(result).toBeNull();
  });
});
```

### 통합 테스트

```powershell
# Redis 시작
docker run -d -p 6379:6379 redis:7-alpine

# Backend 시작
cd server-backend
npm start

# 세션 테스트
curl -c cookies.txt http://localhost:3001/api/auth/login -d "username=test&password=test"

# 서버 재시작
Ctrl+C
npm start

# 세션 유지 확인
curl -b cookies.txt http://localhost:3001/api/auth/me
```

### 성능 테스트

```powershell
# Apache Bench로 부하 테스트
ab -n 1000 -c 10 http://localhost:3001/api/boards

# 캐싱 전후 응답 시간 비교
```

---

## 모니터링

### Redis 상태 확인

```powershell
# Redis CLI 접속
docker exec -it redis redis-cli -a redis_password

# 메모리 사용량
INFO memory

# 키 개수
DBSIZE

# 느린 쿼리 확인
SLOWLOG GET 10

# 실시간 모니터링
MONITOR
```

### Backend 로그

```javascript
// Redis 연결 상태 로그
console.log('Redis status:', redisClient.status);

// 캐시 히트율 추적
let cacheHits = 0;
let cacheMisses = 0;

// 주기적으로 출력
setInterval(() => {
  const hitRate = (cacheHits / (cacheHits + cacheMisses) * 100).toFixed(2);
  console.log(`Cache hit rate: ${hitRate}%`);
}, 60000);
```

---

## 참고 자료

- [Redis Documentation](https://redis.io/docs/)
- [connect-redis NPM](https://www.npmjs.com/package/connect-redis)
- [Redis Node.js Guide](https://redis.io/docs/connect/clients/nodejs/)
- [Caching Best Practices](https://redis.io/docs/manual/client-side-caching/)

---

## 결론

Redis 통합은 **세 단계**로 진행:

1. **Phase 1 (즉시)**: 세션 스토어 전환 → 세션 영속성 확보
2. **Phase 2 (1-2주)**: 캐싱 레이어 추가 → 성능 5배 향상
3. **Phase 3 (1개월)**: 실시간 기능 강화 → 사용자 경험 개선

**총 작업 시간**: 12-17시간

**즉시 시작 가능**: Redis 설치 및 세션 스토어 전환 (2-3시간)

**투자 대비 효과**: ⭐⭐⭐⭐⭐ (매우 높음)

---

**마지막 업데이트**: 2025년 (Phase 6 완료 후)
