# ⚡ 성능 최적화 상세 계획

## 📋 **개요**

Community Platform 2.0의 성능을 최적화하여 사용자 경험을 향상시키고 시스템 안정성을 확보합니다.

---

## 🎯 **성능 최적화 목표**

### **1. 응답 시간 목표**
- **API 응답 시간**: 평균 200ms 이하
- **페이지 로딩 시간**: 초기 로딩 2초 이하
- **데이터베이스 쿼리**: 평균 100ms 이하
- **파일 업로드**: 1MB 파일 5초 이하

### **2. 처리량 목표**
- **동시 사용자**: 10,000명 지원
- **API 요청**: 초당 1,000개 처리
- **데이터베이스 연결**: 500개 동시 연결
- **파일 처리**: 초당 100개 파일

### **3. 리소스 사용량 목표**
- **메모리 사용량**: 80% 이하
- **CPU 사용량**: 70% 이하
- **디스크 I/O**: 60% 이하
- **네트워크 대역폭**: 50% 이하

---

## 🔧 **성능 최적화 영역**

### **1. 백엔드 최적화**

#### **데이터베이스 최적화**
```sql
-- 인덱스 최적화
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_board_id ON posts(board_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_users_email ON users(email);

-- 복합 인덱스
CREATE INDEX idx_posts_board_created ON posts(board_id, created_at);
CREATE INDEX idx_comments_post_created ON comments(post_id, created_at);

-- 쿼리 최적화
-- 기존: SELECT * FROM posts WHERE board_id = ? ORDER BY created_at DESC LIMIT 20
-- 최적화: SELECT id, title, content, user_id, created_at FROM posts WHERE board_id = ? ORDER BY created_at DESC LIMIT 20

-- 연결 풀링 설정
const poolConfig = {
  connectionLimit: 100,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  idleTimeout: 300000,
  queueLimit: 0
};
```

#### **캐싱 전략**
```javascript
// Redis 캐싱 설정
const redisConfig = {
  host: 'localhost',
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  db: 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
};

// 캐싱 전략
const cacheStrategies = {
  // 사용자 정보: 30분
  userProfile: { ttl: 1800, key: 'user:profile:' },
  // 게시글 목록: 10분
  postList: { ttl: 600, key: 'posts:list:' },
  // 인기 게시글: 1시간
  popularPosts: { ttl: 3600, key: 'posts:popular:' },
  // 통계 데이터: 5분
  statistics: { ttl: 300, key: 'stats:' }
};
```

#### **API 최적화**
```javascript
// 응답 압축
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// 요청 제한
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100 요청
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
});

// 데이터베이스 연결 풀링
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000
});
```

### **2. 프론트엔드 최적화**

#### **코드 스플리팅**
```typescript
// 동적 임포트로 코드 스플리팅
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// 라우트별 코드 스플리팅
const routes = [
  {
    path: '/dashboard',
    component: React.lazy(() => import('./pages/Dashboard'))
  },
  {
    path: '/games',
    component: React.lazy(() => import('./pages/GameCenter'))
  }
];

// 컴포넌트별 코드 스플리팅
const GameCenter = React.lazy(() => import('./pages/GameCenter'));
const VIPDashboard = React.lazy(() => import('./pages/VIPDashboard'));
```

#### **이미지 최적화**
```typescript
// 이미지 최적화 컴포넌트
const OptimizedImage: React.FC<{
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
}> = ({ src, alt, width, height, quality = 75 }) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // WebP 지원 확인
    const webpSupported = document.createElement('canvas')
      .toDataURL('image/webp')
      .indexOf('data:image/webp') === 0;

    if (webpSupported) {
      setImageSrc(src.replace(/\.(jpg|jpeg|png)$/, '.webp'));
    }
    setIsLoading(false);
  }, [src]);

  return (
    <div className="image-container">
      {isLoading && <div className="image-skeleton" />}
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </div>
  );
};
```

#### **가상 스크롤링**
```typescript
// 가상 스크롤링 구현
import { FixedSizeList as List } from 'react-window';

const VirtualizedPostList: React.FC<{ posts: Post[] }> = ({ posts }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <PostCard post={posts[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={posts.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### **3. 데이터베이스 최적화**

#### **쿼리 최적화**
```sql
-- 기존 쿼리 (느림)
SELECT p.*, u.username, COUNT(c.id) as comment_count
FROM posts p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN comments c ON p.id = c.post_id
WHERE p.board_id = ?
GROUP BY p.id
ORDER BY p.created_at DESC
LIMIT 20;

-- 최적화된 쿼리 (빠름)
SELECT p.id, p.title, p.content, p.created_at, u.username
FROM posts p
INNER JOIN users u ON p.user_id = u.id
WHERE p.board_id = ?
ORDER BY p.created_at DESC
LIMIT 20;

-- 댓글 수는 별도 쿼리로
SELECT post_id, COUNT(*) as comment_count
FROM comments
WHERE post_id IN (?, ?, ?, ...)
GROUP BY post_id;
```

#### **인덱스 최적화**
```sql
-- 복합 인덱스 생성
CREATE INDEX idx_posts_board_created_user ON posts(board_id, created_at, user_id);
CREATE INDEX idx_comments_post_created ON comments(post_id, created_at);

-- 부분 인덱스 (조건부)
CREATE INDEX idx_posts_active ON posts(created_at) WHERE status = 'active';

-- 함수 기반 인덱스
CREATE INDEX idx_posts_title_lower ON posts(LOWER(title));
```

### **4. 캐싱 전략**

#### **Redis 캐싱**
```javascript
// Redis 캐싱 서비스
class CacheService {
  constructor() {
    this.redis = new Redis(redisConfig);
  }

  async get(key) {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key) {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  // 캐시 무효화
  async invalidatePattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }
}
```

#### **메모리 캐싱**
```javascript
// 메모리 캐싱 (Node.js)
const NodeCache = require('node-cache');
const cache = new NodeCache({ 
  stdTTL: 600, // 10분
  checkperiod: 120, // 2분마다 체크
  useClones: false
});

// 캐시 미들웨어
const cacheMiddleware = (ttl = 600) => {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);
    
    if (cached) {
      return res.json(cached);
    }
    
    const originalSend = res.json;
    res.json = function(data) {
      cache.set(key, data, ttl);
      originalSend.call(this, data);
    };
    
    next();
  };
};
```

---

## 🧪 **성능 테스트**

### **1. 로드 테스트**
```javascript
// Artillery.js 로드 테스트
const artilleryConfig = {
  config: {
    target: 'http://localhost:5000',
    phases: [
      { duration: '2m', arrivalRate: 10 },
      { duration: '5m', arrivalRate: 20 },
      { duration: '2m', arrivalRate: 0 }
    ],
    defaults: {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  },
  scenarios: [
    {
      name: 'Load test',
      weight: 100,
      flow: [
        { get: { url: '/api/posts' } },
        { post: { url: '/api/posts', json: { title: 'Test Post', content: 'Test Content' } } },
        { get: { url: '/api/users/profile' } }
      ]
    }
  ]
};
```

### **2. 메모리 프로파일링**
```javascript
// 메모리 사용량 모니터링
const memwatch = require('memwatch-next');

memwatch.on('leak', (info) => {
  console.error('Memory leak detected:', info);
});

// 힙 덤프 생성
const heapdump = require('heapdump');
setInterval(() => {
  const filename = `heap-${Date.now()}.heapsnapshot`;
  heapdump.writeSnapshot(filename, (err, filename) => {
    if (err) console.error('Heap dump failed:', err);
    else console.log('Heap dump written to', filename);
  });
}, 300000); // 5분마다
```

### **3. 데이터베이스 성능 모니터링**
```sql
-- 슬로우 쿼리 로그 활성화
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
SET GLOBAL log_queries_not_using_indexes = 'ON';

-- 쿼리 성능 분석
EXPLAIN SELECT * FROM posts WHERE board_id = 1 ORDER BY created_at DESC LIMIT 20;

-- 인덱스 사용률 확인
SELECT 
  TABLE_NAME,
  INDEX_NAME,
  CARDINALITY,
  SUB_PART,
  PACKED,
  NULLABLE,
  INDEX_TYPE
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'community_platform';
```

---

## 📊 **성능 모니터링**

### **1. 실시간 메트릭 수집**
```javascript
// Prometheus 메트릭 수집
const promClient = require('prom-client');

// 커스텀 메트릭
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type', 'table']
});

const memoryUsage = new promClient.Gauge({
  name: 'nodejs_memory_usage_bytes',
  help: 'Node.js memory usage in bytes',
  labelNames: ['type']
});

// 메트릭 수집
setInterval(() => {
  const memUsage = process.memoryUsage();
  memoryUsage.set({ type: 'rss' }, memUsage.rss);
  memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
  memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
  memoryUsage.set({ type: 'external' }, memUsage.external);
}, 5000);
```

### **2. 성능 대시보드**
```javascript
// Grafana 대시보드 설정
const dashboardConfig = {
  dashboard: {
    title: 'Community Platform Performance',
    panels: [
      {
        title: 'Response Time',
        type: 'graph',
        targets: [
          {
            expr: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))',
            legendFormat: '95th percentile'
          }
        ]
      },
      {
        title: 'Memory Usage',
        type: 'graph',
        targets: [
          {
            expr: 'nodejs_memory_usage_bytes',
            legendFormat: '{{type}}'
          }
        ]
      },
      {
        title: 'Database Performance',
        type: 'graph',
        targets: [
          {
            expr: 'histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m]))',
            legendFormat: '95th percentile'
          }
        ]
      }
    ]
  }
};
```

---

## 🚀 **최적화 실행 계획**

### **Phase 1: 데이터베이스 최적화 (1일)**
- [ ] 인덱스 분석 및 최적화
- [ ] 쿼리 성능 분석 및 개선
- [ ] 연결 풀링 설정
- [ ] 슬로우 쿼리 로그 설정

### **Phase 2: 캐싱 시스템 구축 (1일)**
- [ ] Redis 캐싱 구현
- [ ] 메모리 캐싱 설정
- [ ] 캐시 전략 수립
- [ ] 캐시 무효화 로직

### **Phase 3: API 최적화 (1일)**
- [ ] 응답 압축 설정
- [ ] 요청 제한 설정
- [ ] 데이터베이스 쿼리 최적화
- [ ] API 응답 시간 개선

### **Phase 4: 프론트엔드 최적화 (1일)**
- [ ] 코드 스플리팅 구현
- [ ] 이미지 최적화
- [ ] 가상 스크롤링 적용
- [ ] 번들 크기 최적화

### **Phase 5: 모니터링 구축 (1일)**
- [ ] 성능 메트릭 수집
- [ ] 대시보드 구성
- [ ] 알림 설정
- [ ] 로드 테스트 실행

---

## 📈 **예상 성능 개선 효과**

### **응답 시간 개선**
- **API 응답**: 500ms → 200ms (60% 개선)
- **페이지 로딩**: 5초 → 2초 (60% 개선)
- **데이터베이스 쿼리**: 300ms → 100ms (67% 개선)

### **처리량 개선**
- **동시 사용자**: 1,000명 → 10,000명 (10배 증가)
- **API 요청**: 100/초 → 1,000/초 (10배 증가)
- **데이터베이스 연결**: 50개 → 500개 (10배 증가)

### **리소스 사용량 개선**
- **메모리 사용량**: 95% → 80% (15% 개선)
- **CPU 사용량**: 90% → 70% (20% 개선)
- **디스크 I/O**: 80% → 60% (20% 개선)

---

*Community Platform 2.0 - 성능 최적화 계획*
