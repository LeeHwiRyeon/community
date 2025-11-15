# 대시보드 데이터베이스 마이그레이션 가이드

**작성일**: 2025년 11월 9일  
**대상**: Phase 3 Task #5 - 활동 대시보드  
**예상 소요 시간**: 10분  

---

## 📋 사전 요구사항

### 1. MySQL 서버 실행 확인
```bash
# Windows (PowerShell)
Get-Service MySQL* | Select-Object Name, Status

# 또는 MySQL 접속 테스트
mysql -u root -p -e "SELECT VERSION();"
```

### 2. 데이터베이스 백업 (권장)
```bash
# 현재 데이터베이스 백업
mysqldump -u root -p community > backup_before_dashboard_$(date +%Y%m%d_%H%M%S).sql
```

### 3. 필요한 권한 확인
```sql
-- MySQL에 접속하여 확인
SHOW GRANTS FOR CURRENT_USER();

-- 필요한 권한: CREATE, ALTER, INSERT, UPDATE, DELETE, INDEX, TRIGGER, EVENT
```

---

## 🚀 마이그레이션 실행

### 방법 1: 명령줄에서 직접 실행 (권장)

#### Windows (PowerShell)
```powershell
# 프로젝트 루트 디렉토리로 이동
cd C:\Users\hwi\Desktop\Projects\community

# MySQL에 로그인하여 마이그레이션 실행
mysql -u root -p community < server-backend\database\migrations\006_dashboard_schema.sql

# 성공 메시지가 표시되어야 함
```

#### Linux/Mac
```bash
# 프로젝트 루트 디렉토리로 이동
cd /path/to/community

# MySQL에 로그인하여 마이그레이션 실행
mysql -u root -p community < server-backend/database/migrations/006_dashboard_schema.sql
```

---

### 방법 2: MySQL Workbench 사용

1. MySQL Workbench 실행
2. `community` 데이터베이스 연결
3. **File → Open SQL Script** 선택
4. `server-backend/database/migrations/006_dashboard_schema.sql` 선택
5. **Execute (번개 아이콘)** 클릭
6. 실행 완료 확인

---

### 방법 3: MySQL CLI에서 수동 실행

```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 선택
USE community;

# 스크립트 파일 실행
SOURCE C:/Users/hwi/Desktop/Projects/community/server-backend/database/migrations/006_dashboard_schema.sql;

# 또는 Windows 경로 (역슬래시)
SOURCE C:\Users\hwi\Desktop\Projects\community\server-backend\database\migrations\006_dashboard_schema.sql;

# 종료
EXIT;
```

---

## ✅ 마이그레이션 검증

### 1. 테이블 생성 확인
```sql
-- MySQL에 접속하여 실행
USE community;

-- 생성된 테이블 목록 확인
SHOW TABLES LIKE '%_stats%';
SHOW TABLES LIKE 'user_activity_logs';

-- 예상 결과:
-- +----------------------------+
-- | Tables_in_community        |
-- +----------------------------+
-- | daily_stats                |
-- | category_stats             |
-- | user_activity_logs         |
-- +----------------------------+
```

### 2. 테이블 구조 확인
```sql
-- daily_stats 테이블 구조
DESCRIBE daily_stats;

-- user_activity_logs 테이블 구조
DESCRIBE user_activity_logs;

-- category_stats 테이블 구조
DESCRIBE category_stats;
```

### 3. 인덱스 확인
```sql
-- daily_stats 인덱스
SHOW INDEX FROM daily_stats;

-- user_activity_logs 인덱스
SHOW INDEX FROM user_activity_logs;

-- category_stats 인덱스
SHOW INDEX FROM category_stats;
```

### 4. 트리거 확인
```sql
-- 생성된 트리거 목록
SHOW TRIGGERS WHERE `Table` IN ('posts', 'comments', 'likes');

-- 예상 결과: 3개의 트리거
-- - after_post_insert
-- - after_comment_insert
-- - after_like_insert
```

### 5. 이벤트 스케줄러 확인
```sql
-- 이벤트 스케줄러 상태 확인
SHOW VARIABLES LIKE 'event_scheduler';

-- 생성된 이벤트 확인
SHOW EVENTS WHERE Db = 'community';

-- 예상 결과: update_daily_stats 이벤트
```

### 6. View 확인
```sql
-- 생성된 View 확인
SHOW FULL TABLES WHERE TABLE_TYPE = 'VIEW';

-- recent_activities View 내용 확인
SELECT * FROM recent_activities LIMIT 5;
```

---

## 🔧 이벤트 스케줄러 활성화

마이그레이션 후 반드시 이벤트 스케줄러를 활성화해야 합니다.

### 1. 현재 상태 확인
```sql
SHOW VARIABLES LIKE 'event_scheduler';

-- OFF이면 활성화 필요
```

### 2. 활성화 (세션 단위 - 재시작 시 비활성화됨)
```sql
SET GLOBAL event_scheduler = ON;
```

### 3. 영구 활성화 (권장)

#### Windows
1. MySQL 설정 파일 찾기: `C:\ProgramData\MySQL\MySQL Server 8.0\my.ini`
2. `[mysqld]` 섹션에 추가:
   ```ini
   [mysqld]
   event_scheduler = ON
   ```
3. MySQL 서비스 재시작:
   ```powershell
   Restart-Service MySQL80
   ```

#### Linux
1. MySQL 설정 파일 편집: `/etc/mysql/my.cnf` 또는 `/etc/my.cnf`
2. `[mysqld]` 섹션에 추가:
   ```ini
   [mysqld]
   event_scheduler = ON
   ```
3. MySQL 재시작:
   ```bash
   sudo systemctl restart mysql
   ```

#### Mac
1. MySQL 설정 파일 편집: `/usr/local/etc/my.cnf`
2. `[mysqld]` 섹션에 추가:
   ```ini
   [mysqld]
   event_scheduler = ON
   ```
3. MySQL 재시작:
   ```bash
   brew services restart mysql
   ```

---

## 📊 초기 데이터 생성

마이그레이션 후 자동으로 최근 30일 데이터가 백필됩니다.

### 1. 백필 확인
```sql
-- 생성된 통계 데이터 확인
SELECT * FROM daily_stats ORDER BY stat_date DESC LIMIT 10;

-- 데이터가 없다면 수동으로 프로시저 호출
CALL initialize_daily_stats();
```

### 2. 활동 로그 확인
```sql
-- 최근 활동 로그 확인
SELECT 
    activity_type,
    COUNT(*) as count
FROM user_activity_logs
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
GROUP BY activity_type;
```

### 3. 카테고리 통계 확인
```sql
-- 카테고리별 통계 확인
SELECT * FROM category_stats 
ORDER BY stat_date DESC, post_count DESC 
LIMIT 10;
```

---

## 🧪 기능 테스트

### 1. 트리거 테스트 (게시물 생성)
```sql
-- 테스트 게시물 생성 (실제 user_id로 변경)
INSERT INTO posts (user_id, category_id, title, content)
VALUES (1, 1, 'Test Post', 'This is a test post for trigger verification');

-- 활동 로그 확인
SELECT * FROM user_activity_logs 
WHERE activity_type = 'post_created' 
ORDER BY created_at DESC LIMIT 1;

-- 테스트 게시물 삭제
DELETE FROM posts WHERE title = 'Test Post';
```

### 2. 통계 갱신 테스트
```sql
-- 오늘 날짜 통계 수동 갱신
INSERT INTO daily_stats (
    stat_date,
    total_users,
    active_users,
    new_users,
    total_posts,
    new_posts,
    total_comments,
    new_comments,
    total_likes,
    new_likes,
    total_views,
    new_views
)
SELECT 
    CURDATE(),
    (SELECT COUNT(*) FROM users),
    (SELECT COUNT(DISTINCT user_id) FROM user_activity_logs WHERE DATE(created_at) = CURDATE()),
    (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURDATE()),
    (SELECT COUNT(*) FROM posts),
    (SELECT COUNT(*) FROM posts WHERE DATE(created_at) = CURDATE()),
    (SELECT COUNT(*) FROM comments),
    (SELECT COUNT(*) FROM comments WHERE DATE(created_at) = CURDATE()),
    (SELECT COUNT(*) FROM likes),
    (SELECT COUNT(*) FROM likes WHERE DATE(created_at) = CURDATE()),
    (SELECT COUNT(*) FROM post_views),
    (SELECT COUNT(*) FROM post_views WHERE DATE(created_at) = CURDATE())
ON DUPLICATE KEY UPDATE
    total_users = VALUES(total_users),
    active_users = VALUES(active_users),
    new_users = VALUES(new_users),
    total_posts = VALUES(total_posts),
    new_posts = VALUES(new_posts),
    total_comments = VALUES(total_comments),
    new_comments = VALUES(new_comments),
    total_likes = VALUES(total_likes),
    new_likes = VALUES(new_likes),
    total_views = VALUES(total_views),
    new_views = VALUES(new_views);

-- 결과 확인
SELECT * FROM daily_stats WHERE stat_date = CURDATE();
```

---

## 🔄 롤백 방법

문제가 발생하면 다음 명령으로 롤백할 수 있습니다.

### 롤백 스크립트
```sql
-- 1. 이벤트 삭제
DROP EVENT IF EXISTS update_daily_stats;

-- 2. 트리거 삭제
DROP TRIGGER IF EXISTS after_post_insert;
DROP TRIGGER IF EXISTS after_comment_insert;
DROP TRIGGER IF EXISTS after_like_insert;

-- 3. Stored Procedure 삭제
DROP PROCEDURE IF EXISTS initialize_daily_stats;

-- 4. View 삭제
DROP VIEW IF EXISTS recent_activities;

-- 5. 테이블 삭제 (주의: 데이터 손실!)
DROP TABLE IF EXISTS category_stats;
DROP TABLE IF EXISTS user_activity_logs;
DROP TABLE IF EXISTS daily_stats;

-- 6. 백업에서 복구 (백업이 있는 경우)
-- mysql -u root -p community < backup_before_dashboard_YYYYMMDD_HHMMSS.sql
```

---

## 📝 마이그레이션 체크리스트

마이그레이션 완료 후 다음 항목들을 확인하세요:

- [ ] MySQL 서버 실행 중
- [ ] 데이터베이스 백업 완료
- [ ] `006_dashboard_schema.sql` 실행 완료
- [ ] 3개 테이블 생성 확인 (daily_stats, user_activity_logs, category_stats)
- [ ] 1개 View 생성 확인 (recent_activities)
- [ ] 3개 트리거 생성 확인 (after_post_insert, after_comment_insert, after_like_insert)
- [ ] 1개 이벤트 생성 확인 (update_daily_stats)
- [ ] 1개 Stored Procedure 생성 확인 (initialize_daily_stats)
- [ ] 8개 인덱스 생성 확인
- [ ] 이벤트 스케줄러 활성화 (`event_scheduler = ON`)
- [ ] 초기 데이터 백필 완료 (30일)
- [ ] 트리거 동작 테스트 완료
- [ ] API 엔드포인트 테스트 완료

---

## 🐛 문제 해결

### 문제 1: "Event scheduler is not enabled"
**원인**: 이벤트 스케줄러가 비활성화됨  
**해결**: 
```sql
SET GLOBAL event_scheduler = ON;
```

### 문제 2: "Table already exists"
**원인**: 이전 마이그레이션 실행 또는 수동 테이블 생성  
**해결**:
```sql
-- 기존 테이블 삭제 후 재실행
DROP TABLE IF EXISTS category_stats;
DROP TABLE IF EXISTS user_activity_logs;
DROP TABLE IF EXISTS daily_stats;
-- 마이그레이션 스크립트 재실행
```

### 문제 3: "Trigger already exists"
**원인**: 트리거가 이미 생성됨  
**해결**:
```sql
DROP TRIGGER IF EXISTS after_post_insert;
DROP TRIGGER IF EXISTS after_comment_insert;
DROP TRIGGER IF EXISTS after_like_insert;
-- 마이그레이션 스크립트 재실행
```

### 문제 4: "Foreign key constraint fails"
**원인**: 참조하는 테이블(users, posts, comments, categories)이 없음  
**해결**:
```sql
-- 참조 테이블 존재 확인
SHOW TABLES LIKE 'users';
SHOW TABLES LIKE 'posts';
SHOW TABLES LIKE 'comments';
SHOW TABLES LIKE 'categories';

-- 테이블이 없다면 먼저 생성 필요
```

### 문제 5: "Access denied" 또는 "Insufficient privileges"
**원인**: 현재 사용자에게 필요한 권한이 없음  
**해결**:
```sql
-- root 사용자로 접속하여 권한 부여
GRANT CREATE, ALTER, INSERT, UPDATE, DELETE, INDEX, TRIGGER, EVENT 
ON community.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 📞 지원

문제가 계속되면 다음을 확인하세요:

1. **MySQL 버전**: 8.0 이상 권장
   ```sql
   SELECT VERSION();
   ```

2. **에러 로그 확인**:
   - Windows: `C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err`
   - Linux: `/var/log/mysql/error.log`
   - Mac: `/usr/local/var/mysql/*.err`

3. **마이그레이션 스크립트 내용 확인**:
   ```bash
   cat server-backend/database/migrations/006_dashboard_schema.sql
   ```

4. **상세 보고서 참조**:
   - [PHASE3_TASK5_COMPLETION_REPORT.md](./PHASE3_TASK5_COMPLETION_REPORT.md)

---

## 🎉 완료 후 다음 단계

마이그레이션 성공 후:

1. **서버 시작**:
   ```bash
   cd server-backend
   npm start
   ```

2. **프론트엔드 시작**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **대시보드 접속**:
   - URL: `http://localhost:3000/admin-dashboard`
   - 관리자 계정으로 로그인 필요 (role='admin')

4. **API 테스트**:
   ```bash
   # 개요 조회
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:3000/api/dashboard/overview
   ```

---

**작성일**: 2025년 11월 9일  
**최종 업데이트**: 2025년 11월 9일  
**버전**: 1.0.0  

© 2025 LeeHwiRyeon. All rights reserved.
