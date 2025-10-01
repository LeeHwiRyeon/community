# 성능 최적화 계획서

## 1. 현재 성능 문제점 분석

### 1.1 식별된 병목 지점
1. **검색 API 성능**
   - 현재 응답 시간: 120-250ms
   - 목표 응답 시간: < 50ms
   - 문제: 복잡한 FULLTEXT 검색 쿼리

2. **데이터베이스 쿼리**
   - N+1 쿼리 문제
   - 인덱스 최적화 부족
   - JOIN 쿼리 성능 저하

3. **메모리 사용량**
   - Node.js 단일 스레드 제약
   - 가비지 컬렉션 오버헤드
   - 대용량 데이터 처리 시 블로킹

4. **캐싱 전략 미흡**
   - Redis 활용도 낮음
   - 캐시 무효화 전략 부재
   - 중복 쿼리 발생

## 2. 즉시 적용 가능한 최적화 (1-2주)

### 2.1 데이터베이스 인덱스 최적화
```sql
-- 검색 성능 향상
CREATE INDEX idx_posts_title_content ON posts(title, content);
CREATE INDEX idx_posts_board_created ON posts(board_id, created_at DESC);
CREATE INDEX idx_posts_trending ON posts(views DESC, created_at DESC);
CREATE INDEX idx_posts_category_deleted ON posts(category, deleted, created_at DESC);

-- 조회수 최적화
CREATE INDEX idx_post_views_post_id ON post_views(post_id);
CREATE INDEX idx_posts_deleted_views ON posts(deleted, views DESC, created_at DESC);
```

### 2.2 쿼리 최적화
```javascript
// 기존 쿼리 (느림)
const posts = await query(`
    SELECT p.*, b.name as board_name, v.views
    FROM posts p
    LEFT JOIN boards b ON p.board_id = b.id
    LEFT JOIN post_views v ON p.id = v.post_id
    WHERE p.deleted = 0
    ORDER BY p.created_at DESC
    LIMIT 20
`);

// 최적화된 쿼리 (빠름)
const posts = await query(`
    SELECT p.id, p.title, p.content, p.author, p.created_at, p.board_id,
           b.name as board_name,
           COALESCE(v.views, 0) as views
    FROM posts p
    INNER JOIN boards b ON p.board_id = b.id
    LEFT JOIN post_views v ON p.id = v.post_id
    WHERE p.deleted = 0
    ORDER BY p.created_at DESC
    LIMIT 20
`);
```

### 2.3 Redis 캐싱 강화
```javascript
// 게시물 목록 캐싱
const getPostsWithCache = async (boardId, page = 1) => {
    const cacheKey = `posts:${boardId}:${page}`;
    
    // 캐시에서 먼저 확인
    const cached = await redis.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }
    
    // DB에서 조회
    const posts = await query(`
        SELECT p.id, p.title, p.author, p.created_at, p.views
        FROM posts p
        WHERE p.board_id = ? AND p.deleted = 0
        ORDER BY p.created_at DESC
        LIMIT 20 OFFSET ?
    `, [boardId, (page - 1) * 20]);
    
    // 캐시에 저장 (5분 TTL)
    await redis.setex(cacheKey, 300, JSON.stringify(posts));
    
    return posts;
};
```

### 2.4 응답 압축 및 최적화
```javascript
// Express 압축 미들웨어
import compression from 'compression';

app.use(compression({
    level: 6,
    threshold: 1024, // 1KB 이상만 압축
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// JSON 응답 최적화
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5분 캐시
    next();
});
```

## 3. 중기 최적화 (2-4주)

### 3.1 데이터베이스 연결 풀 최적화
```javascript
// MySQL 연결 풀 설정
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 20,        // 최대 연결 수
    acquireTimeout: 60000,      // 연결 획득 타임아웃
    timeout: 60000,             // 쿼리 타임아웃
    reconnect: true,            // 자동 재연결
    charset: 'utf8mb4',
    timezone: 'Z'
});
```

### 3.2 비동기 처리 최적화
```javascript
// 병렬 처리로 성능 향상
const getHomeData = async () => {
    const [announcements, latestPosts, trendingPosts] = await Promise.all([
        getAnnouncements(),
        getLatestPosts(20),
        getTrendingPosts(10)
    ]);
    
    return {
        announcements,
        latestPosts,
        trendingPosts
    };
};
```

### 3.3 메모리 사용량 최적화
```javascript
// 스트리밍 응답으로 메모리 절약
const getLargePostList = async (req, res) => {
    const stream = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    
    const query = stream.query(`
        SELECT id, title, content, author, created_at
        FROM posts
        WHERE deleted = 0
        ORDER BY created_at DESC
    `);
    
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked'
    });
    
    res.write('[');
    let first = true;
    
    query.on('result', (row) => {
        if (!first) res.write(',');
        res.write(JSON.stringify(row));
        first = false;
    });
    
    query.on('end', () => {
        res.write(']');
        res.end();
        stream.end();
    });
};
```

## 4. 장기 최적화 (1-2개월)

### 4.1 마이크로서비스 아키텍처 도입
- C# .NET 8 기반 서비스 분리
- API Gateway를 통한 라우팅
- 서비스별 독립적 스케일링

### 4.2 CDN 및 정적 자산 최적화
```javascript
// 정적 파일 캐싱
app.use('/static', express.static('public', {
    maxAge: '1y',           // 1년 캐시
    etag: true,             // ETag 지원
    lastModified: true,     // Last-Modified 지원
    setHeaders: (res, path) => {
        if (path.endsWith('.js') || path.endsWith('.css')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
    }
}));
```

### 4.3 데이터베이스 샤딩
```javascript
// 게시판별 데이터베이스 분리
const getShardConnection = (boardId) => {
    const shardIndex = boardId % 3; // 3개 샤드
    return shardConnections[shardIndex];
};

const getPostsFromShard = async (boardId) => {
    const connection = getShardConnection(boardId);
    return await connection.query(`
        SELECT * FROM posts
        WHERE board_id = ? AND deleted = 0
        ORDER BY created_at DESC
    `, [boardId]);
};
```

## 5. 모니터링 및 성능 측정

### 5.1 성능 메트릭 수집
```javascript
// 응답 시간 측정
const responseTime = require('response-time');

app.use(responseTime((req, res, time) => {
    console.log(`${req.method} ${req.url} - ${time}ms`);
    
    // 메트릭 수집
    if (time > 1000) {
        console.warn(`Slow request: ${req.url} took ${time}ms`);
    }
}));

// 메모리 사용량 모니터링
setInterval(() => {
    const usage = process.memoryUsage();
    console.log('Memory usage:', {
        rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(usage.external / 1024 / 1024) + ' MB'
    });
}, 30000); // 30초마다
```

### 5.2 데이터베이스 성능 모니터링
```sql
-- 느린 쿼리 로그 활성화
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1; -- 1초 이상 쿼리 로그

-- 쿼리 성능 분석
EXPLAIN ANALYZE SELECT * FROM posts 
WHERE title LIKE '%검색어%' 
ORDER BY created_at DESC 
LIMIT 20;
```

## 6. 자동 테스트 프레임워크

### 6.1 성능 테스트 자동화
```javascript
// Jest 기반 성능 테스트
describe('API Performance Tests', () => {
    test('search API should respond within 50ms', async () => {
        const start = Date.now();
        const response = await request(app)
            .get('/api/search?q=test')
            .expect(200);
        const duration = Date.now() - start;
        
        expect(duration).toBeLessThan(50);
    });
    
    test('posts API should handle 100 concurrent requests', async () => {
        const requests = Array(100).fill().map(() => 
            request(app).get('/api/posts')
        );
        
        const start = Date.now();
        await Promise.all(requests);
        const duration = Date.now() - start;
        
        expect(duration).toBeLessThan(5000); // 5초 이내
    });
});
```

### 6.2 부하 테스트 스크립트
```javascript
// autocannon을 사용한 부하 테스트
const autocannon = require('autocannon');

const runLoadTest = async () => {
    const result = await autocannon({
        url: 'http://localhost:50000',
        connections: 100,      // 동시 연결 수
        duration: 30,          // 테스트 시간 (초)
        requests: [
            {
                method: 'GET',
                path: '/api/posts'
            },
            {
                method: 'GET',
                path: '/api/search?q=test'
            }
        ]
    });
    
    console.log('Load test results:', result);
};

runLoadTest();
```

## 7. 예상 성능 개선 효과

### 7.1 즉시 적용 최적화 (1-2주)
- **API 응답 시간**: 120ms → 80ms (33% 향상)
- **데이터베이스 쿼리**: 50ms → 25ms (50% 향상)
- **메모리 사용량**: 150MB → 120MB (20% 절약)

### 7.2 중기 최적화 (2-4주)
- **API 응답 시간**: 80ms → 60ms (25% 추가 향상)
- **동시 처리 능력**: 1,000 → 2,000 req/s (100% 향상)
- **메모리 효율성**: 20% 추가 절약

### 7.3 장기 최적화 (1-2개월)
- **API 응답 시간**: 60ms → 30ms (50% 추가 향상)
- **확장성**: 10배 이상 사용자 처리 능력
- **안정성**: 99.9% 가용성 달성

## 8. 구현 일정

### Week 1-2: 즉시 최적화
- [ ] 데이터베이스 인덱스 추가
- [ ] 쿼리 최적화 적용
- [ ] Redis 캐싱 강화
- [ ] 응답 압축 설정

### Week 3-4: 중기 최적화
- [ ] 연결 풀 최적화
- [ ] 비동기 처리 개선
- [ ] 메모리 사용량 최적화
- [ ] 성능 모니터링 구축

### Week 5-8: 장기 최적화
- [ ] 마이크로서비스 아키텍처 설계
- [ ] C# .NET 서비스 개발
- [ ] API Gateway 구축
- [ ] 점진적 마이그레이션

### Week 9-12: 테스트 및 최적화
- [ ] 성능 테스트 자동화
- [ ] 부하 테스트 실행
- [ ] 병목 지점 식별 및 해결
- [ ] 운영 환경 배포

## 9. 성공 지표

### 9.1 성능 지표
- **API 응답 시간**: < 50ms (95th percentile)
- **데이터베이스 쿼리**: < 20ms (평균)
- **동시 사용자**: 5,000+ 지원
- **처리량**: 5,000+ req/s

### 9.2 안정성 지표
- **가용성**: 99.9% 이상
- **에러율**: < 0.1%
- **복구 시간**: < 5분
- **데이터 손실**: 0%

### 9.3 사용자 경험 지표
- **페이지 로딩 시간**: < 2초
- **검색 응답 시간**: < 1초
- **실시간 메시지 지연**: < 100ms
- **사용자 만족도**: 4.5/5.0 이상

이 성능 최적화 계획을 통해 현재의 성능 문제를 해결하고, 향후 확장성을 보장하는 견고한 시스템을 구축할 수 있습니다.

