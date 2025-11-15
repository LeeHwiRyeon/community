# Phase 3 Task #6 - Social Features Migration Guide
# 소셜 기능 데이터베이스 마이그레이션 가이드

**작성일**: 2025년 11월 9일  
**목적**: Follow, Mention, Block, Share 기능을 위한 데이터베이스 스키마 구축

---

## 📋 개요

이 마이그레이션은 다음 소셜 기능을 추가합니다:
- ✅ **팔로우 시스템** (Follow System)
- ✅ **멘션 기능** (Mentions)
- ✅ **게시물 공유** (Share Tracking)
- ✅ **사용자 차단** (User Blocking)

---

## 🚀 마이그레이션 실행

### 1단계: 데이터베이스 백업 (필수!)

```bash
# MySQL 백업 명령어
mysqldump -u root -p community_platform > backup_before_social_features_$(date +%Y%m%d).sql

# 복원이 필요한 경우
# mysql -u root -p community_platform < backup_before_social_features_20251109.sql
```

### 2단계: 마이그레이션 SQL 파일 실행

```bash
# MySQL에 접속
mysql -u root -p

# 데이터베이스 선택
USE community_platform;

# 마이그레이션 파일 실행
SOURCE server-backend/migrations/06_social_features.sql;

# 또는 직접 파일 실행
mysql -u root -p community_platform < server-backend/migrations/06_social_features.sql
```

### 3단계: 마이그레이션 검증

```sql
-- 테이블 생성 확인
SHOW TABLES LIKE '%follows%';
SHOW TABLES LIKE '%mentions%';
SHOW TABLES LIKE '%blocked%';
SHOW TABLES LIKE '%shares%';

-- 각 테이블 스키마 확인
DESCRIBE follows;
DESCRIBE mentions;
DESCRIBE blocked_users;
DESCRIBE shares;

-- View 생성 확인
SELECT * FROM user_follow_stats LIMIT 5;
SELECT * FROM post_share_stats LIMIT 5;

-- 트리거 확인
SHOW TRIGGERS WHERE `Trigger` LIKE '%follow%' OR `Trigger` LIKE '%mention%';

-- 이벤트 스케줄러 활성화 확인
SHOW VARIABLES LIKE 'event_scheduler';
SHOW EVENTS WHERE Name = 'update_follow_counts';
```

---

## 📊 생성되는 데이터베이스 객체

### 테이블 (4개)

#### 1. follows (팔로우 관계)
```sql
CREATE TABLE follows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    follower_id INT NOT NULL,      -- 팔로워 (following하는 사용자)
    following_id INT NOT NULL,     -- 팔로잉 (followed되는 사용자)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_follow (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (follower_id != following_id)
);
```

**용도**: 사용자 간 팔로우 관계 저장

#### 2. mentions (멘션 기록)
```sql
CREATE TABLE mentions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NULL,                   -- 게시물 ID
    comment_id INT NULL,                -- 댓글 ID
    mentioned_user_id INT NOT NULL,     -- 멘션된 사용자
    mentioned_by_user_id INT NOT NULL,  -- 멘션한 사용자
    content TEXT,                       -- 멘션 컨텍스트
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR 
           (post_id IS NULL AND comment_id IS NOT NULL))
);
```

**용도**: @username 멘션 추적

#### 3. blocked_users (차단된 사용자)
```sql
CREATE TABLE blocked_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    blocker_id INT NOT NULL,     -- 차단한 사용자
    blocked_id INT NOT NULL,     -- 차단된 사용자
    reason VARCHAR(255) NULL,    -- 차단 사유
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_block (blocker_id, blocked_id),
    FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (blocker_id != blocked_id)
);
```

**용도**: 사용자 차단 관계 관리

#### 4. shares (공유 통계)
```sql
CREATE TABLE shares (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,           -- 공유된 게시물
    user_id INT NULL,               -- 공유한 사용자 (선택적)
    platform VARCHAR(50) NOT NULL,  -- twitter, facebook, linkedin, clipboard
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

**용도**: 게시물 공유 추적 및 통계

### Views (2개)

#### 1. user_follow_stats (팔로우 통계)
```sql
CREATE OR REPLACE VIEW user_follow_stats AS
SELECT 
    u.id AS user_id,
    u.username,
    COALESCE(followers.count, 0) AS followers_count,
    COALESCE(following.count, 0) AS following_count
FROM users u
LEFT JOIN (
    SELECT following_id, COUNT(*) AS count
    FROM follows GROUP BY following_id
) followers ON u.id = followers.following_id
LEFT JOIN (
    SELECT follower_id, COUNT(*) AS count
    FROM follows GROUP BY follower_id
) following ON u.id = following.follower_id;
```

#### 2. post_share_stats (공유 통계)
```sql
CREATE OR REPLACE VIEW post_share_stats AS
SELECT 
    p.id AS post_id,
    p.title,
    COUNT(s.id) AS total_shares,
    SUM(CASE WHEN s.platform = 'twitter' THEN 1 ELSE 0 END) AS twitter_shares,
    SUM(CASE WHEN s.platform = 'facebook' THEN 1 ELSE 0 END) AS facebook_shares,
    SUM(CASE WHEN s.platform = 'linkedin' THEN 1 ELSE 0 END) AS linkedin_shares,
    SUM(CASE WHEN s.platform = 'clipboard' THEN 1 ELSE 0 END) AS clipboard_shares,
    MAX(s.created_at) AS last_shared_at
FROM posts p
LEFT JOIN shares s ON p.id = s.post_id
GROUP BY p.id, p.title;
```

### Triggers (2개)

#### 1. after_follow_insert
```sql
-- 팔로우 시 알림 자동 생성
CREATE TRIGGER after_follow_insert
AFTER INSERT ON follows
FOR EACH ROW
BEGIN
    INSERT INTO notifications (user_id, type, message, related_user_id, created_at)
    VALUES (
        NEW.following_id,
        'follow',
        CONCAT((SELECT username FROM users WHERE id = NEW.follower_id), '님이 회원님을 팔로우하기 시작했습니다.'),
        NEW.follower_id,
        NOW()
    );
END;
```

#### 2. after_mention_insert
```sql
-- 멘션 시 알림 자동 생성
CREATE TRIGGER after_mention_insert
AFTER INSERT ON mentions
FOR EACH ROW
BEGIN
    DECLARE content_preview VARCHAR(100);
    SET content_preview = LEFT(NEW.content, 100);
    
    INSERT INTO notifications (user_id, type, message, related_user_id, related_post_id, related_comment_id, created_at)
    VALUES (
        NEW.mentioned_user_id,
        'mention',
        CONCAT((SELECT username FROM users WHERE id = NEW.mentioned_by_user_id), '님이 회원님을 멘션했습니다: ', content_preview),
        NEW.mentioned_by_user_id,
        NEW.post_id,
        NEW.comment_id,
        NOW()
    );
END;
```

### Events (1개)

#### update_follow_counts (매시간 실행)
```sql
CREATE EVENT update_follow_counts
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    -- followers_count 업데이트
    UPDATE users u
    LEFT JOIN (
        SELECT following_id, COUNT(*) AS count
        FROM follows GROUP BY following_id
    ) f ON u.id = f.following_id
    SET u.followers_count = COALESCE(f.count, 0);
    
    -- following_count 업데이트
    UPDATE users u
    LEFT JOIN (
        SELECT follower_id, COUNT(*) AS count
        FROM follows GROUP BY follower_id
    ) f ON u.id = f.follower_id
    SET u.following_count = COALESCE(f.count, 0);
END;
```

---

## 🔧 users 테이블 변경사항

```sql
-- 팔로워/팔로잉 카운트 컬럼 추가 (users 테이블이 이미 없는 경우)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS followers_count INT DEFAULT 0 COMMENT '팔로워 수',
ADD COLUMN IF NOT EXISTS following_count INT DEFAULT 0 COMMENT '팔로잉 수';
```

---

## ⚙️ 이벤트 스케줄러 활성화

```sql
-- 이벤트 스케줄러 활성화 (MySQL 재시작 후에도 유지)
SET GLOBAL event_scheduler = ON;

-- my.cnf 또는 my.ini에 추가 (영구적)
[mysqld]
event_scheduler = ON
```

---

## 📝 Express 서버 재시작

```bash
# 백엔드 서버 디렉토리로 이동
cd server-backend

# 서버 재시작 (nodemon 사용 시 자동 재시작)
npm start

# 또는 PM2 사용 시
pm2 restart server-backend
```

---

## ✅ 기능 테스트

### 1. 팔로우 기능 테스트

```bash
# 1. 사용자 팔로우
curl -X POST http://localhost:5000/api/social/follow/2 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. 팔로워 목록 조회
curl http://localhost:5000/api/social/followers/1

# 3. 팔로잉 목록 조회
curl http://localhost:5000/api/social/following/1

# 4. 팔로우 상태 확인
curl http://localhost:5000/api/social/follow/status/2 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 5. 팔로우 통계
curl http://localhost:5000/api/social/follow/stats/1

# 6. 팔로우 추천
curl http://localhost:5000/api/social/follow/suggestions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 7. 최근 팔로워
curl http://localhost:5000/api/social/follow/recent/1

# 8. 언팔로우
curl -X DELETE http://localhost:5000/api/social/follow/2 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. 알림 확인

```sql
-- 팔로우 알림 확인
SELECT * FROM notifications WHERE type = 'follow' ORDER BY created_at DESC LIMIT 5;

-- 멘션 알림 확인 (멘션 기능 구현 후)
SELECT * FROM notifications WHERE type = 'mention' ORDER BY created_at DESC LIMIT 5;
```

### 3. 통계 View 테스트

```sql
-- 팔로우 통계
SELECT * FROM user_follow_stats ORDER BY followers_count DESC LIMIT 10;

-- 공유 통계
SELECT * FROM post_share_stats ORDER BY total_shares DESC LIMIT 10;
```

---

## 🐛 문제 해결 (Troubleshooting)

### 1. "Table already exists" 오류
```sql
-- 기존 테이블 삭제 후 재생성 (주의: 데이터 손실!)
DROP TABLE IF EXISTS shares;
DROP TABLE IF EXISTS blocked_users;
DROP TABLE IF EXISTS mentions;
DROP TABLE IF EXISTS follows;

-- 마이그레이션 재실행
SOURCE server-backend/migrations/06_social_features.sql;
```

### 2. Foreign Key 제약 위반
```sql
-- users 테이블 존재 확인
SELECT COUNT(*) FROM users;

-- posts, comments 테이블 존재 확인
SELECT COUNT(*) FROM posts;
SELECT COUNT(*) FROM comments;

-- notifications 테이블 존재 확인
DESCRIBE notifications;
```

### 3. 이벤트 스케줄러가 작동하지 않음
```sql
-- 이벤트 스케줄러 상태 확인
SHOW VARIABLES LIKE 'event_scheduler';

-- 활성화
SET GLOBAL event_scheduler = ON;

-- 이벤트 목록 확인
SHOW EVENTS;

-- 특정 이벤트 상태 확인
SELECT * FROM information_schema.EVENTS WHERE EVENT_NAME = 'update_follow_counts';
```

### 4. 트리거 실행 오류
```sql
-- 트리거 목록 확인
SHOW TRIGGERS;

-- 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS after_follow_insert;
DROP TRIGGER IF EXISTS after_mention_insert;

-- 마이그레이션 재실행
SOURCE server-backend/migrations/06_social_features.sql;
```

---

## 📊 성능 최적화

### 인덱스 추가 (대규모 데이터용)

```sql
-- follows 테이블
CREATE INDEX idx_follower_following ON follows(follower_id, following_id);
CREATE INDEX idx_created_at ON follows(created_at);

-- mentions 테이블
CREATE INDEX idx_mentioned_user_created ON mentions(mentioned_user_id, created_at);
CREATE INDEX idx_post_comment ON mentions(post_id, comment_id);

-- blocked_users 테이블
CREATE INDEX idx_blocker_blocked ON blocked_users(blocker_id, blocked_id);

-- shares 테이블
CREATE INDEX idx_post_platform ON shares(post_id, platform);
CREATE INDEX idx_user_platform ON shares(user_id, platform);
```

---

## 🔄 롤백 (Rollback)

마이그레이션을 되돌려야 하는 경우:

```sql
-- 1. 이벤트 삭제
DROP EVENT IF EXISTS update_follow_counts;

-- 2. 트리거 삭제
DROP TRIGGER IF EXISTS after_follow_insert;
DROP TRIGGER IF EXISTS after_mention_insert;

-- 3. View 삭제
DROP VIEW IF EXISTS user_follow_stats;
DROP VIEW IF EXISTS post_share_stats;

-- 4. 테이블 삭제 (순서 중요!)
DROP TABLE IF EXISTS shares;
DROP TABLE IF EXISTS blocked_users;
DROP TABLE IF EXISTS mentions;
DROP TABLE IF EXISTS follows;

-- 5. users 테이블 컬럼 제거 (선택적)
ALTER TABLE users 
DROP COLUMN IF EXISTS followers_count,
DROP COLUMN IF EXISTS following_count;

-- 6. 백업 복원
-- mysql -u root -p community_platform < backup_before_social_features_20251109.sql
```

---

## 📚 다음 단계

1. ✅ 데이터베이스 마이그레이션 완료
2. ✅ Express 서버 재시작
3. ⏳ 프론트엔드에서 FollowButton 컴포넌트 사용
4. ⏳ 멘션 기능 구현 (Task #6-2)
5. ⏳ 공유 기능 구현 (Task #6-3)
6. ⏳ 차단 기능 구현 (Task #6-4)
7. ⏳ E2E 테스트 작성 (Task #6-5)

---

## 📖 관련 문서

- [06_social_features.sql](../server-backend/migrations/06_social_features.sql) - 마이그레이션 SQL 파일
- [follow-service.js](../server-backend/src/services/follow-service.js) - 팔로우 서비스
- [social.js](../server-backend/src/routes/social.js) - 소셜 API 라우터
- [FollowButton.tsx](../frontend/src/components/social/FollowButton.tsx) - 팔로우 버튼 컴포넌트

---

**작성자**: Development Team  
**마지막 업데이트**: 2025년 11월 9일  
**버전**: 1.0.0

---

© 2025 LeeHwiRyeon. All rights reserved.
