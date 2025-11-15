# Social Features Admin Guide
# 소셜 기능 관리자 가이드

**버전**: 2.0  
**최종 업데이트**: 2025-11-09  
**대상**: 시스템 관리자, 운영자

---

## 📋 목차

1. [개요](#개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [데이터베이스 관리](#데이터베이스-관리)
4. [모니터링](#모니터링)
5. [성능 최적화](#성능-최적화)
6. [보안 관리](#보안-관리)
7. [백업 및 복구](#백업-및-복구)
8. [문제 해결](#문제-해결)

---

## 🎯 개요

### 소셜 기능 시스템

커뮤니티 플랫폼 2.0의 소셜 기능은 4가지 핵심 모듈로 구성됩니다:

| 기능   | 서비스             | API 엔드포인트 | 데이터베이스 테이블 |
| ------ | ------------------ | -------------- | ------------------- |
| 팔로우 | follow-service.js  | 8개            | follows             |
| 멘션   | mention-service.js | 7개            | mentions            |
| 공유   | share-service.js   | 6개            | post_shares         |
| 차단   | block-service.js   | 5개            | blocked_users       |

### 기술 스택

- **Backend**: Node.js 18+, Express.js 4.18
- **Database**: MySQL 8.0
- **Cache**: Redis 7.0 (선택)
- **Testing**: Jest 29.0
- **Monitoring**: Prometheus + Grafana (권장)

---

## 🏗️ 시스템 아키텍처

### 서비스 레이어 구조

```
┌─────────────────────────────────────────┐
│           API Layer (routes)            │
│         /api/social/*                   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│        Service Layer (services)         │
│  - follow-service.js                    │
│  - mention-service.js                   │
│  - share-service.js                     │
│  - block-service.js                     │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       Database Layer (MySQL)            │
│  - follows                              │
│  - mentions                             │
│  - post_shares                          │
│  - blocked_users                        │
└─────────────────────────────────────────┘
```

### 디렉토리 구조

```
server-backend/
├── src/
│   ├── routes/
│   │   └── social.js              # API 라우트 (26 엔드포인트)
│   ├── services/
│   │   ├── follow-service.js      # 팔로우 비즈니스 로직
│   │   ├── mention-service.js     # 멘션 비즈니스 로직
│   │   ├── share-service.js       # 공유 비즈니스 로직
│   │   └── block-service.js       # 차단 비즈니스 로직
│   └── database/
│       └── database.js            # DB 연결 풀
├── tests/
│   └── social-features.test.js    # 통합 테스트
└── migrations/
    └── 001_social_features.sql    # 스키마 마이그레이션
```

---

## 🗄️ 데이터베이스 관리

### 테이블 스키마

#### 1. follows 테이블

```sql
CREATE TABLE follows (
    id INT PRIMARY KEY AUTO_INCREMENT,
    follower_id INT NOT NULL,
    following_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_follow (follower_id, following_id),
    INDEX idx_follower (follower_id),
    INDEX idx_following (following_id),
    
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    
    CHECK (follower_id <> following_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**용량 예상**: 
- 사용자 10만명, 평균 100 팔로우 = 1천만 행
- 예상 크기: ~400MB (인덱스 포함)

#### 2. mentions 테이블

```sql
CREATE TABLE mentions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    mentioner_id INT NOT NULL,
    mentioned_user_id INT NOT NULL,
    post_id INT,
    comment_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_mentioned (mentioned_user_id, is_read),
    INDEX idx_mentioner (mentioner_id),
    INDEX idx_post (post_id),
    INDEX idx_comment (comment_id),
    
    FOREIGN KEY (mentioner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mentioned_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**용량 예상**:
- 월 100만 멘션 = 연 1,200만 행
- 예상 크기: ~500MB (인덱스 포함)

#### 3. post_shares 테이블

```sql
CREATE TABLE post_shares (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT,
    platform ENUM('twitter', 'facebook', 'linkedin', 'clipboard') NOT NULL,
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_post_platform (post_id, platform),
    INDEX idx_user (user_id),
    INDEX idx_shared_at (shared_at),
    
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**용량 예상**:
- 월 50만 공유 = 연 600만 행
- 예상 크기: ~250MB (인덱스 포함)

#### 4. blocked_users 테이블

```sql
CREATE TABLE blocked_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    blocker_id INT NOT NULL,
    blocked_id INT NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_block (blocker_id, blocked_id),
    INDEX idx_blocker (blocker_id),
    INDEX idx_blocked (blocked_id),
    
    FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
    
    CHECK (blocker_id <> blocked_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**용량 예상**:
- 사용자 10만명, 1% 차단 활용 = 10만 행
- 예상 크기: ~20MB (인덱스 포함)

### 인덱스 관리

#### 인덱스 효율성 확인

```sql
-- 인덱스 사용률 확인
SELECT 
    table_name,
    index_name,
    seq_in_index,
    column_name,
    cardinality
FROM information_schema.statistics
WHERE table_schema = 'community'
    AND table_name IN ('follows', 'mentions', 'post_shares', 'blocked_users')
ORDER BY table_name, index_name, seq_in_index;
```

#### 미사용 인덱스 찾기

```sql
-- MySQL 8.0+
SELECT * FROM sys.schema_unused_indexes
WHERE object_schema = 'community'
    AND object_name IN ('follows', 'mentions', 'post_shares', 'blocked_users');
```

#### 인덱스 재구성

```sql
-- 주기적으로 실행 (월 1회 권장)
OPTIMIZE TABLE follows;
OPTIMIZE TABLE mentions;
OPTIMIZE TABLE post_shares;
OPTIMIZE TABLE blocked_users;
```

### 데이터 정리

#### 오래된 데이터 아카이빙

```sql
-- 1년 이상 된 읽은 멘션 아카이빙
CREATE TABLE mentions_archive LIKE mentions;

INSERT INTO mentions_archive
SELECT * FROM mentions
WHERE is_read = TRUE 
    AND created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

DELETE FROM mentions
WHERE is_read = TRUE 
    AND created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

#### 고아 데이터 정리

```sql
-- 삭제된 게시물의 공유 기록 정리
DELETE ps FROM post_shares ps
LEFT JOIN posts p ON ps.post_id = p.id
WHERE p.id IS NULL;

-- 삭제된 사용자의 멘션 정리
DELETE m FROM mentions m
LEFT JOIN users u ON m.mentioned_user_id = u.id
WHERE u.id IS NULL;
```

---

## 📊 모니터링

### 주요 메트릭

#### 1. 팔로우 시스템

```sql
-- 일일 팔로우 통계
SELECT 
    DATE(created_at) as date,
    COUNT(*) as new_follows,
    COUNT(DISTINCT follower_id) as unique_followers,
    COUNT(DISTINCT following_id) as unique_followed
FROM follows
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 팔로우 분포
SELECT 
    following_count,
    COUNT(*) as user_count
FROM (
    SELECT following_id, COUNT(*) as following_count
    FROM follows
    GROUP BY following_id
) t
GROUP BY following_count
ORDER BY following_count;
```

#### 2. 멘션 시스템

```sql
-- 멘션 활동 통계
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_mentions,
    SUM(CASE WHEN is_read THEN 1 ELSE 0 END) as read_mentions,
    AVG(CASE WHEN is_read THEN 1 ELSE 0 END) * 100 as read_rate
FROM mentions
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 읽지 않은 멘션 모니터링
SELECT 
    u.username,
    COUNT(*) as unread_count,
    MIN(m.created_at) as oldest_unread
FROM mentions m
JOIN users u ON m.mentioned_user_id = u.id
WHERE m.is_read = FALSE
GROUP BY m.mentioned_user_id
HAVING unread_count > 50
ORDER BY unread_count DESC
LIMIT 20;
```

#### 3. 공유 시스템

```sql
-- 플랫폼별 공유 통계
SELECT 
    platform,
    COUNT(*) as total_shares,
    COUNT(DISTINCT post_id) as unique_posts,
    COUNT(DISTINCT user_id) as unique_users
FROM post_shares
WHERE shared_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY platform;

-- 인기 게시물 (공유 기준)
SELECT 
    p.id,
    p.title,
    COUNT(ps.id) as share_count,
    GROUP_CONCAT(DISTINCT ps.platform) as platforms
FROM post_shares ps
JOIN posts p ON ps.post_id = p.id
WHERE ps.shared_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY ps.post_id
ORDER BY share_count DESC
LIMIT 10;
```

#### 4. 차단 시스템

```sql
-- 차단 통계
SELECT 
    DATE(created_at) as date,
    COUNT(*) as new_blocks,
    COUNT(DISTINCT blocker_id) as unique_blockers,
    COUNT(DISTINCT blocked_id) as unique_blocked
FROM blocked_users
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 차단 사유 분석
SELECT 
    CASE 
        WHEN reason LIKE '%spam%' THEN 'Spam'
        WHEN reason LIKE '%괴롭힘%' THEN 'Harassment'
        WHEN reason LIKE '%부적절%' THEN 'Inappropriate'
        ELSE 'Other'
    END as reason_category,
    COUNT(*) as count
FROM blocked_users
WHERE reason IS NOT NULL
GROUP BY reason_category
ORDER BY count DESC;

-- 자주 차단되는 사용자 (요주의)
SELECT 
    u.username,
    u.email,
    COUNT(*) as blocked_by_count,
    MIN(bu.created_at) as first_blocked,
    MAX(bu.created_at) as last_blocked
FROM blocked_users bu
JOIN users u ON bu.blocked_id = u.id
GROUP BY bu.blocked_id
HAVING blocked_by_count >= 10
ORDER BY blocked_by_count DESC;
```

### 알림 설정

#### Prometheus 메트릭 (권장)

```javascript
// server-backend/src/metrics/social-metrics.js
const client = require('prom-client');

// 팔로우 메트릭
const followsTotal = new client.Counter({
    name: 'social_follows_total',
    help: 'Total number of follows',
    labelNames: ['type'] // follow, unfollow
});

// 멘션 메트릭
const mentionsTotal = new client.Counter({
    name: 'social_mentions_total',
    help: 'Total number of mentions',
    labelNames: ['status'] // created, read
});

// 공유 메트릭
const sharesTotal = new client.Counter({
    name: 'social_shares_total',
    help: 'Total number of shares',
    labelNames: ['platform']
});

// 차단 메트릭
const blocksTotal = new client.Counter({
    name: 'social_blocks_total',
    help: 'Total number of blocks',
    labelNames: ['action'] // block, unblock
});
```

#### Grafana 대시보드

권장 패널:
1. **일일 활동 그래프**: 팔로우, 멘션, 공유, 차단 추이
2. **플랫폼별 공유 분포**: 파이 차트
3. **응답 시간**: API 엔드포인트별 평균 응답 시간
4. **에러율**: 4xx, 5xx 응답 비율
5. **활성 사용자**: 일일/주간/월간 활성 사용자 수

---

## ⚡ 성능 최적화

### 데이터베이스 최적화

#### 쿼리 최적화

```sql
-- 느린 쿼리 로깅 활성화
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1; -- 1초 이상 쿼리

-- 느린 쿼리 확인
SELECT * FROM mysql.slow_log
WHERE db = 'community'
ORDER BY query_time DESC
LIMIT 10;

-- EXPLAIN으로 쿼리 분석
EXPLAIN SELECT * FROM follows 
WHERE follower_id = 123 
ORDER BY created_at DESC 
LIMIT 20;
```

#### 연결 풀 설정

```javascript
// server-backend/src/database/database.js
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 100,        // 최대 연결 수
    queueLimit: 0,               // 무제한 큐
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    maxIdle: 10,                 // 최대 유휴 연결
    idleTimeout: 60000,          // 1분
});
```

### 캐싱 전략

#### Redis 캐싱 (권장)

```javascript
// 팔로우 상태 캐싱
const cacheKey = `follow:${followerId}:${followingId}`;
const cached = await redis.get(cacheKey);

if (cached) {
    return JSON.parse(cached);
}

const result = await checkFollowStatus(followerId, followingId);
await redis.setex(cacheKey, 300, JSON.stringify(result)); // 5분 TTL
return result;
```

#### 캐시 무효화

```javascript
// 팔로우/언팔로우 시 캐시 삭제
await redis.del(`follow:${followerId}:${followingId}`);
await redis.del(`follow:stats:${followerId}`);
await redis.del(`follow:stats:${followingId}`);
```

### API 최적화

#### 페이지네이션

```javascript
// 커서 기반 페이지네이션 (권장)
router.get('/followers/:userId', async (req, res) => {
    const { cursor, limit = 20 } = req.query;
    
    const query = `
        SELECT * FROM follows
        WHERE following_id = ?
        ${cursor ? 'AND id < ?' : ''}
        ORDER BY id DESC
        LIMIT ?
    `;
    
    const params = cursor ? [userId, cursor, limit] : [userId, limit];
    const followers = await db.query(query, params);
    
    res.json({
        followers,
        nextCursor: followers.length > 0 ? followers[followers.length - 1].id : null
    });
});
```

#### 배치 처리

```javascript
// 대량 팔로우 검사
async function checkMultipleFollowStatus(userId, targetUserIds) {
    const query = `
        SELECT following_id
        FROM follows
        WHERE follower_id = ?
        AND following_id IN (?)
    `;
    
    const [rows] = await pool.query(query, [userId, targetUserIds]);
    const following = new Set(rows.map(r => r.following_id));
    
    return targetUserIds.map(id => ({
        userId: id,
        isFollowing: following.has(id)
    }));
}
```

### 프론트엔드 최적화

#### Lazy Loading

```javascript
// 무한 스크롤 구현
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery(
    ['followers', userId],
    ({ pageParam = 0 }) => fetchFollowers(userId, pageParam),
    {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
);
```

#### Debouncing

```javascript
// 멘션 검색 디바운싱
const debouncedSearch = useMemo(
    () => debounce((query) => searchUsers(query), 300),
    []
);
```

---

## 🔒 보안 관리

### 인증 및 권한

#### JWT 토큰 검증

```javascript
// 모든 소셜 API는 인증 필요
router.use('/social/*', authenticateToken);

function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}
```

### 입력 검증

#### express-validator 사용

```javascript
router.post('/follow/:userId',
    authenticateToken,
    param('userId').isInt().withMessage('Invalid user ID'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        // ...
    }
);
```

### Rate Limiting

#### API 호출 제한

```javascript
const rateLimit = require('express-rate-limit');

// 팔로우 API 제한 (시간당 60회)
const followLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1시간
    max: 60,
    message: '너무 많은 요청입니다. 나중에 다시 시도하세요.'
});

router.post('/follow/:userId', followLimiter, ...);
```

### SQL Injection 방지

#### Prepared Statements 사용

```javascript
// ❌ 취약한 코드
const query = `SELECT * FROM follows WHERE follower_id = ${req.user.id}`;

// ✅ 안전한 코드
const query = 'SELECT * FROM follows WHERE follower_id = ?';
const [rows] = await pool.query(query, [req.user.id]);
```

### XSS 방지

#### 입력 sanitization

```javascript
const sanitizeHtml = require('sanitize-html');

// 차단 이유 sanitize
const reason = sanitizeHtml(req.body.reason, {
    allowedTags: [],
    allowedAttributes: {}
});
```

---

## 💾 백업 및 복구

### 데이터베이스 백업

#### 일일 백업 스크립트

```bash
#!/bin/bash
# backup-social-tables.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mysql/social"
DB_NAME="community"

# 소셜 테이블만 백업
mysqldump -u root -p${DB_PASSWORD} \
    ${DB_NAME} \
    follows mentions post_shares blocked_users \
    --single-transaction \
    --quick \
    --lock-tables=false \
    | gzip > ${BACKUP_DIR}/social_${DATE}.sql.gz

# 7일 이상 된 백업 삭제
find ${BACKUP_DIR} -name "social_*.sql.gz" -mtime +7 -delete

echo "Backup completed: social_${DATE}.sql.gz"
```

#### Cron 설정

```bash
# 매일 새벽 2시 백업
0 2 * * * /opt/scripts/backup-social-tables.sh >> /var/log/backup-social.log 2>&1
```

### 복구 절차

#### 전체 복구

```bash
# 백업 파일 압축 해제
gunzip social_20251109_020000.sql.gz

# 복구 실행
mysql -u root -p community < social_20251109_020000.sql
```

#### 특정 테이블만 복구

```bash
# follows 테이블만 추출
grep "INSERT INTO \`follows\`" social_20251109_020000.sql > follows_only.sql

# 복구
mysql -u root -p community < follows_only.sql
```

### 재해 복구 계획 (DR)

#### RTO/RPO 목표

- **RTO** (Recovery Time Objective): 4시간
- **RPO** (Recovery Point Objective): 1시간

#### 복구 우선순위

1. **Critical**: follows, blocked_users (사용자 안전)
2. **High**: mentions (알림 시스템)
3. **Medium**: post_shares (통계)

---

## 🔧 문제 해결

### 일반적인 문제

#### 1. 팔로우 버튼 응답 없음

**증상**:
- API 호출은 성공하지만 UI 업데이트 안됨

**원인**:
- React state 동기화 실패
- 캐시 미갱신

**해결**:
```javascript
// FollowButton.tsx에서 optimistic update 확인
setIsFollowing(!isFollowing); // 즉시 UI 업데이트
try {
    await followUser(userId);
} catch (error) {
    setIsFollowing(isFollowing); // 실패 시 롤백
}
```

#### 2. 멘션 알림 지연

**증상**:
- 멘션 후 알림이 5분 이상 지연

**원인**:
- 배치 처리 간격이 너무 긺
- 큐 백로그

**해결**:
```javascript
// 실시간 알림으로 변경 (WebSocket)
io.to(`user_${mentionedUserId}`).emit('newMention', {
    mentioner: req.user.username,
    postId: postId,
    preview: content.substring(0, 100)
});
```

#### 3. 공유 통계 불일치

**증상**:
- 실제 공유 수와 표시된 수가 다름

**원인**:
- 캐시와 DB 불일치
- 트랜잭션 롤백 미처리

**해결**:
```sql
-- 통계 재계산
UPDATE posts p
SET p.share_count = (
    SELECT COUNT(*) 
    FROM post_shares ps 
    WHERE ps.post_id = p.id
)
WHERE p.id IN (SELECT DISTINCT post_id FROM post_shares);
```

#### 4. 차단 해제 안됨

**증상**:
- 차단 해제 버튼 클릭 후에도 여전히 차단됨

**원인**:
- 캐시 미삭제
- 양방향 차단 확인 실패

**해결**:
```javascript
// 차단 해제 시 모든 캐시 삭제
await redis.del(`block:${blockerId}:${blockedId}`);
await redis.del(`block:${blockedId}:${blockerId}`);
await redis.del(`blockList:${blockerId}`);
```

### 성능 문제

#### 느린 팔로워 목록 조회

```sql
-- 문제 쿼리
SELECT u.* FROM follows f
JOIN users u ON f.follower_id = u.id
WHERE f.following_id = 123
ORDER BY f.created_at DESC
LIMIT 20;

-- 최적화: 인덱스 추가
CREATE INDEX idx_following_created ON follows(following_id, created_at DESC);
```

#### 높은 CPU 사용률

**원인 확인**:
```sql
-- 실행 중인 쿼리 확인
SHOW PROCESSLIST;

-- 느린 쿼리 확인
SELECT * FROM performance_schema.events_statements_summary_by_digest
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 10;
```

**해결책**:
- 인덱스 추가
- 쿼리 최적화
- 캐싱 도입

### 데이터 무결성

#### 고아 레코드 제거

```sql
-- 삭제된 사용자의 팔로우 정리
DELETE f FROM follows f
LEFT JOIN users u1 ON f.follower_id = u1.id
LEFT JOIN users u2 ON f.following_id = u2.id
WHERE u1.id IS NULL OR u2.id IS NULL;

-- 정기 실행 (주 1회)
```

#### 중복 데이터 확인

```sql
-- 중복 팔로우 검사
SELECT follower_id, following_id, COUNT(*)
FROM follows
GROUP BY follower_id, following_id
HAVING COUNT(*) > 1;
```

---

## 📈 확장성 고려사항

### 수평 확장

#### 읽기 복제본 (Read Replica)

```javascript
// 읽기/쓰기 분리
const readPool = mysql.createPool({ 
    host: 'read-replica.example.com',
    // ... 
});

const writePool = mysql.createPool({ 
    host: 'master.example.com',
    // ... 
});

// 팔로워 조회 (읽기)
router.get('/followers/:userId', async (req, res) => {
    const [rows] = await readPool.query(/* ... */);
    res.json(rows);
});

// 팔로우 생성 (쓰기)
router.post('/follow/:userId', async (req, res) => {
    await writePool.query(/* ... */);
    res.json({ success: true });
});
```

### 샤딩 전략

#### 사용자 ID 기반 샤딩

```javascript
// 샤드 선택
function getShardId(userId) {
    return userId % TOTAL_SHARDS;
}

// 샤드별 연결
const shards = [
    mysql.createPool({ host: 'shard0.example.com' }),
    mysql.createPool({ host: 'shard1.example.com' }),
    mysql.createPool({ host: 'shard2.example.com' }),
];

// 쿼리 실행
const shardId = getShardId(userId);
const pool = shards[shardId];
const [rows] = await pool.query(/* ... */);
```

---

## 📞 지원

### 긴급 연락처

- **On-call Engineer**: +82-10-1234-5678
- **Slack**: #social-features-alerts
- **PagerDuty**: social-features-oncall

### 문서

- **API 문서**: `/docs/api-reference.md`
- **아키텍처**: `/docs/architecture.md`
- **Runbook**: `/docs/runbook.md`

### 로그 위치

```bash
# Application logs
/var/log/community/app.log

# Social features logs
/var/log/community/social-*.log

# Database logs
/var/log/mysql/error.log
/var/log/mysql/slow.log
```

---

**가이드 버전**: 2.0  
**최종 업데이트**: 2025-11-09  
**담당자**: DevOps Team

