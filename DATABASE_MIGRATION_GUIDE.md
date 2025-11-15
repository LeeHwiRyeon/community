# 🗄️ 데이터베이스 마이그레이션 가이드

**작성일**: 2025년 11월 9일  
**대상**: Phase 3 Task #1 - 실시간 알림 시스템

---

## 📋 개요

Phase 3 Task #1 (실시간 알림 시스템)을 완료하기 위해 데이터베이스 마이그레이션을 실행해야 합니다.

### 마이그레이션 파일
- **파일**: `server-backend/migrations/007_create_notifications_table.sql`
- **크기**: 52 lines
- **생성 테이블**: 
  1. `notifications` - 알림 데이터
  2. `notification_settings` - 사용자별 알림 설정
  3. `notification_stats` - 알림 통계 뷰

---

## 🔧 방법 1: MySQL Workbench 사용 (권장)

### 단계별 가이드

1. **MySQL Workbench 실행**

2. **데이터베이스 연결**
   - Connection Name: `community_db`
   - Hostname: `localhost`
   - Port: `3306`
   - Username: `root`
   - Password: (설정한 비밀번호)

3. **마이그레이션 파일 열기**
   - File → Open SQL Script
   - 경로: `server-backend/migrations/007_create_notifications_table.sql`

4. **스크립트 실행**
   - 전체 스크립트 선택 (Ctrl+A)
   - Execute 버튼 클릭 (번개 아이콘) 또는 Ctrl+Shift+Enter

5. **결과 확인**
   ```sql
   -- 테이블 생성 확인
   SHOW TABLES LIKE 'notification%';
   
   -- 결과:
   -- notifications
   -- notification_settings
   ```

---

## 🖥️ 방법 2: MySQL CLI 사용

### Windows (PowerShell)

```powershell
# 1. MySQL 경로 찾기
where.exe mysql

# 2. MySQL이 PATH에 없는 경우, 전체 경로로 실행
# 예: C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe

# 3. 마이그레이션 실행
cd C:\Users\hwi\Desktop\Projects\community
Get-Content server-backend\migrations\007_create_notifications_table.sql | mysql -u root -p community_db

# 또는 직접 실행
mysql -u root -p community_db < server-backend\migrations\007_create_notifications_table.sql
```

### Linux/Mac (Bash)

```bash
# 1. 프로젝트 디렉토리로 이동
cd ~/Desktop/Projects/community

# 2. 마이그레이션 실행
mysql -u root -p community_db < server-backend/migrations/007_create_notifications_table.sql

# 또는
cat server-backend/migrations/007_create_notifications_table.sql | mysql -u root -p community_db
```

---

## 🐳 방법 3: Docker를 사용하는 경우

### Docker Compose로 MySQL 실행 중인 경우

```bash
# 1. MySQL 컨테이너 ID 확인
docker ps | grep mysql

# 2. 컨테이너에서 마이그레이션 실행
docker exec -i <mysql-container-id> mysql -u root -p<password> community_db < server-backend/migrations/007_create_notifications_table.sql

# 예시
docker exec -i mysql-container mysql -u root -pmypassword community_db < server-backend/migrations/007_create_notifications_table.sql
```

---

## ✅ 마이그레이션 검증

### 1. 테이블 생성 확인

```sql
-- MySQL에 접속
mysql -u root -p community_db

-- 테이블 목록 확인
SHOW TABLES LIKE 'notification%';

-- 예상 결과:
-- +--------------------------------+
-- | Tables_in_community_db         |
-- +--------------------------------+
-- | notifications                  |
-- | notification_settings          |
-- +--------------------------------+
```

### 2. notifications 테이블 구조 확인

```sql
DESCRIBE notifications;

-- 예상 결과:
-- +---------------+--------------+------+-----+-------------------+
-- | Field         | Type         | Null | Key | Default           |
-- +---------------+--------------+------+-----+-------------------+
-- | id            | int          | NO   | PRI | NULL              |
-- | user_id       | int          | NO   | MUL | NULL              |
-- | type          | enum(...)    | NO   |     | NULL              |
-- | title         | varchar(255) | NO   |     | NULL              |
-- | message       | text         | NO   |     | NULL              |
-- | link          | varchar(500) | YES  |     | NULL              |
-- | is_read       | tinyint(1)   | YES  |     | 0                 |
-- | sender_id     | int          | YES  | MUL | NULL              |
-- | sender_name   | varchar(100) | YES  |     | NULL              |
-- | sender_avatar | varchar(500) | YES  |     | NULL              |
-- | related_type  | varchar(50)  | YES  |     | NULL              |
-- | related_id    | int          | YES  |     | NULL              |
-- | action_url    | varchar(500) | YES  |     | NULL              |
-- | created_at    | timestamp    | YES  |     | CURRENT_TIMESTAMP |
-- | read_at       | timestamp    | YES  |     | NULL              |
-- | updated_at    | timestamp    | YES  |     | CURRENT_TIMESTAMP |
-- +---------------+--------------+------+-----+-------------------+
```

### 3. notification_settings 테이블 확인

```sql
DESCRIBE notification_settings;

-- 예상 결과:
-- +----------------+--------------+------+-----+-------------------+
-- | Field          | Type         | Null | Key | Default           |
-- +----------------+--------------+------+-----+-------------------+
-- | id             | int          | NO   | PRI | NULL              |
-- | user_id        | int          | NO   | UNI | NULL              |
-- | enable_comment | tinyint(1)   | YES  |     | 1                 |
-- | enable_like    | tinyint(1)   | YES  |     | 1                 |
-- | enable_mention | tinyint(1)   | YES  |     | 1                 |
-- | enable_follow  | tinyint(1)   | YES  |     | 1                 |
-- | enable_reply   | tinyint(1)   | YES  |     | 1                 |
-- | enable_system  | tinyint(1)   | YES  |     | 1                 |
-- | enable_push    | tinyint(1)   | YES  |     | 0                 |
-- | created_at     | timestamp    | YES  |     | CURRENT_TIMESTAMP |
-- | updated_at     | timestamp    | YES  |     | CURRENT_TIMESTAMP |
-- +----------------+--------------+------+-----+-------------------+
```

### 4. 뷰 생성 확인

```sql
SHOW CREATE VIEW notification_stats;

-- 또는
SELECT * FROM notification_stats LIMIT 1;
```

---

## 🚀 서버 재시작

마이그레이션 완료 후 서버를 재시작하여 알림 시스템을 활성화합니다.

### Backend 서버

```bash
# 1. 기존 서버 중지 (Ctrl+C)

# 2. 서버 재시작
cd server-backend
npm start

# 또는 개발 모드
npm run dev
```

### Frontend 서버

```bash
# 1. 기존 서버 중지 (Ctrl+C)

# 2. 서버 재시작
cd frontend
npm run dev
```

---

## 🧪 기능 테스트

### 1. 서버 로그 확인

서버 시작 시 다음 로그가 표시되어야 합니다:

```
✅ Socket.IO notification server initialized
✅ Notification routes registered at /api/notifications
```

### 2. 브라우저 테스트

1. **Frontend 접속**: http://localhost:3000
2. **로그인**
3. **알림 벨 아이콘 확인**: 헤더 우측에 표시
4. **알림 벨 클릭**: 알림 드롭다운 표시
5. **WebSocket 연결 확인**: 브라우저 콘솔에서 확인
   ```javascript
   // 콘솔에 다음 메시지 표시
   Socket.IO connected: <socket-id>
   ```

### 3. API 테스트

```bash
# 1. CSRF 토큰 발급
curl http://localhost:50000/api/auth/csrf-token

# 2. 테스트 알림 생성 (관리자만 가능)
curl -X POST http://localhost:50000/api/notifications/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -H "X-CSRF-Token: <csrf-token>" \
  -d '{"userId": 1}'

# 3. 알림 목록 조회
curl http://localhost:50000/api/notifications \
  -H "Authorization: Bearer <your-token>"
```

---

## ❌ 문제 해결 (Troubleshooting)

### 문제 1: MySQL이 설치되지 않음

**증상**:
```
mysql: The term 'mysql' is not recognized...
```

**해결**:
1. MySQL 다운로드: https://dev.mysql.com/downloads/mysql/
2. MySQL Workbench 다운로드: https://dev.mysql.com/downloads/workbench/
3. 설치 후 PATH 환경 변수 추가

### 문제 2: 데이터베이스 연결 실패

**증상**:
```
ERROR 2002 (HY000): Can't connect to MySQL server
```

**해결**:
1. MySQL 서비스 실행 확인
   ```powershell
   # Windows
   Get-Service MySQL*
   
   # 서비스 시작
   Start-Service MySQL80
   ```

2. 연결 정보 확인
   - Host: `localhost`
   - Port: `3306`
   - User: `root`
   - Database: `community_db`

### 문제 3: 테이블이 이미 존재

**증상**:
```
ERROR 1050 (42S01): Table 'notifications' already exists
```

**해결**:
```sql
-- 기존 테이블 삭제 (주의: 데이터 손실)
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS notification_settings;
DROP VIEW IF EXISTS notification_stats;

-- 마이그레이션 재실행
```

### 문제 4: 외래 키 제약 조건 오류

**증상**:
```
ERROR 1452 (23000): Cannot add or update a child row
```

**해결**:
```sql
-- users 테이블 존재 확인
SHOW TABLES LIKE 'users';

-- users 테이블이 없으면 먼저 생성
-- (이전 마이그레이션 파일 실행)
```

---

## 📊 마이그레이션 후 상태

### 데이터베이스 상태

```
community_db
├── users (기존)
├── posts (기존)
├── comments (기존)
├── notifications ✨ NEW
├── notification_settings ✨ NEW
└── notification_stats (VIEW) ✨ NEW
```

### API 엔드포인트

```
POST   /api/notifications/test           # 테스트 알림 생성
GET    /api/notifications                # 알림 목록 조회
GET    /api/notifications/unread/count   # 읽지 않은 알림 개수
PATCH  /api/notifications/:id/read       # 알림 읽음 처리
DELETE /api/notifications/:id            # 알림 삭제
PATCH  /api/notifications/read-all       # 모든 알림 읽음
DELETE /api/notifications/delete-all     # 모든 알림 삭제
GET    /api/notifications/settings       # 알림 설정 조회
PUT    /api/notifications/settings       # 알림 설정 업데이트
```

### WebSocket 이벤트

```javascript
// Client → Server
'authenticate'       // JWT 토큰으로 인증

// Server → Client
'authenticated'      // 인증 성공
'notification'       // 새 알림 수신
'notification:read'  // 알림 읽음 상태 변경
'error'             // 에러 발생
```

---

## 📝 다음 단계

마이그레이션 완료 후:

1. ✅ **서버 재시작** (Backend + Frontend)
2. ✅ **기능 테스트** (브라우저 + API)
3. ⏭️ **E2E 테스트 작성** (선택적)
4. ⏭️ **Phase 3 Task #2 시작** (고급 검색 시스템)

---

## 🔗 관련 문서

- [PHASE3_TASK1_INTEGRATION_COMPLETE_REPORT.md](./PHASE3_TASK1_INTEGRATION_COMPLETE_REPORT.md) - 통합 완료 보고서
- [TODO_PHASE_3.md](./TODO_PHASE_3.md) - Phase 3 전체 작업 계획
- [API_REFERENCE.md](./API_REFERENCE.md) - API 문서

---

**작성자**: AUTOAGENTS  
**최종 업데이트**: 2025년 11월 9일

---

© 2025 LeeHwiRyeon. All rights reserved.
