# Phase 2 데이터베이스 마이그레이션 가이드

## 개요
Phase 2에서 추가된 온라인 상태 표시 및 모더레이터 도구 기능을 위한 데이터베이스 마이그레이션 가이드입니다.

## 마이그레이션 파일

### 1. add_online_status.sql
**위치**: `server-backend/migrations/add_online_status.sql`

**생성되는 테이블**:
- `user_online_status`: 사용자 온라인 상태 추적
  - user_id, is_online, status (online/away/busy/offline)
  - last_heartbeat, device_type (mobile/desktop/web)
  - last_seen

**생성되는 뷰**:
- `online_users_summary`: 온라인 사용자 통계

**테이블 수정**:
- `users` 테이블에 `show_online_status` 컬럼 추가 (프라이버시 설정)

### 2. add_moderator_tools.sql
**위치**: `server-backend/migrations/add_moderator_tools.sql`

**생성되는 테이블**:
- `moderator_roles`: 모더레이터 권한 관리
- `user_warnings`: 사용자 경고 시스템
- `user_bans`: 사용자 차단 관리
- `content_reports`: 콘텐츠 신고 시스템
- `moderator_actions`: 모더레이터 활동 로그

**생성되는 뷰**:
- `moderator_statistics`: 모더레이터별 활동 통계
- `pending_reports_summary`: 미처리 신고 요약

## 마이그레이션 실행 방법

### 방법 1: MySQL CLI 사용

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 선택
USE community_db;

# 마이그레이션 실행
SOURCE server-backend/migrations/add_online_status.sql;
SOURCE server-backend/migrations/add_moderator_tools.sql;

# 테이블 생성 확인
SHOW TABLES;

# 뷰 확인
SELECT * FROM online_users_summary;
SELECT * FROM moderator_statistics;
SELECT * FROM pending_reports_summary;
```

### 방법 2: PowerShell에서 실행

```powershell
# 서버 백엔드 디렉토리로 이동
cd server-backend

# MySQL 마이그레이션 실행
Get-Content migrations/add_online_status.sql | mysql -u root -p community_db
Get-Content migrations/add_moderator_tools.sql | mysql -u root -p community_db
```

### 방법 3: Node.js 스크립트 실행

마이그레이션 실행 스크립트를 생성합니다:

```javascript
// server-backend/scripts/run-migrations.js
import { getPool } from '../src/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration(filename) {
    const pool = getPool();
    const filePath = path.join(__dirname, '../migrations', filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // SQL 문을 ; 로 분리하여 실행
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`\n🔄 실행 중: ${filename}`);
    console.log(`📝 총 ${statements.length}개의 SQL 문 발견`);
    
    for (const statement of statements) {
        try {
            await pool.query(statement);
            console.log(`✅ 실행 완료`);
        } catch (error) {
            console.error(`❌ 오류 발생:`, error.message);
            throw error;
        }
    }
    
    console.log(`✅ ${filename} 마이그레이션 완료\n`);
}

async function main() {
    try {
        console.log('🚀 Phase 2 마이그레이션 시작...\n');
        
        await runMigration('add_online_status.sql');
        await runMigration('add_moderator_tools.sql');
        
        console.log('✅ 모든 마이그레이션 완료!');
        process.exit(0);
    } catch (error) {
        console.error('❌ 마이그레이션 실패:', error);
        process.exit(1);
    }
}

main();
```

실행:
```bash
cd server-backend
node scripts/run-migrations.js
```

## 마이그레이션 검증

### 1. 테이블 생성 확인

```sql
-- 온라인 상태 테이블 확인
DESCRIBE user_online_status;
SELECT COUNT(*) FROM user_online_status;

-- 모더레이터 테이블 확인
DESCRIBE moderator_roles;
DESCRIBE user_warnings;
DESCRIBE user_bans;
DESCRIBE content_reports;
DESCRIBE moderator_actions;
```

### 2. 뷰 작동 확인

```sql
-- 온라인 사용자 통계
SELECT * FROM online_users_summary;

-- 모더레이터 통계
SELECT * FROM moderator_statistics;

-- 미처리 신고 요약
SELECT * FROM pending_reports_summary;
```

### 3. 외래 키 제약조건 확인

```sql
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'community_db'
    AND REFERENCED_TABLE_NAME IS NOT NULL
    AND TABLE_NAME IN (
        'user_online_status',
        'moderator_roles',
        'user_warnings',
        'user_bans',
        'content_reports',
        'moderator_actions'
    );
```

## 롤백 방법

마이그레이션을 롤백해야 하는 경우:

```sql
-- 뷰 삭제
DROP VIEW IF EXISTS online_users_summary;
DROP VIEW IF EXISTS moderator_statistics;
DROP VIEW IF EXISTS pending_reports_summary;

-- 테이블 삭제 (순서 중요: 외래 키 역순)
DROP TABLE IF EXISTS moderator_actions;
DROP TABLE IF EXISTS content_reports;
DROP TABLE IF EXISTS user_bans;
DROP TABLE IF EXISTS user_warnings;
DROP TABLE IF EXISTS moderator_roles;
DROP TABLE IF EXISTS user_online_status;

-- users 테이블 컬럼 제거
ALTER TABLE users DROP COLUMN IF EXISTS show_online_status;
```

## 트러블슈팅

### 오류: Table already exists
```sql
-- 기존 테이블 확인
SHOW TABLES LIKE 'user_online_status';

-- 필요시 테이블 삭제 후 재생성
DROP TABLE IF EXISTS user_online_status;
```

### 오류: Foreign key constraint fails
- 외래 키 참조 순서를 확인하세요
- `users` 테이블에 참조할 사용자가 존재하는지 확인하세요

### 오류: Column already exists
```sql
-- 기존 컬럼 확인
DESCRIBE users;

-- 컬럼이 이미 존재하면 ALTER 문 스킵
```

## 초기 데이터 삽입 (선택사항)

### 관리자에게 모더레이터 권한 부여

```sql
-- 관리자 계정에 super_admin 권한 부여
INSERT INTO moderator_roles (user_id, role, permissions, assigned_by)
SELECT 
    id,
    'super_admin',
    JSON_ARRAY('manage_moderators', 'ban_users', 'warn_users', 'view_reports', 'resolve_reports', 'delete_content', 'view_logs'),
    id
FROM users
WHERE role = 'admin'
LIMIT 1;
```

### 테스트 온라인 상태 데이터

```sql
-- 일부 사용자를 온라인 상태로 설정
INSERT INTO user_online_status (user_id, is_online, status, device_type)
SELECT 
    id,
    TRUE,
    'online',
    'web'
FROM users
LIMIT 5;
```

## 다음 단계

마이그레이션 완료 후:

1. ✅ 서버 재시작
   ```bash
   cd server-backend
   npm run dev
   ```

2. ✅ API 엔드포인트 테스트
   - GET /api/online-status/statistics
   - GET /api/moderator/stats
   - GET /api/moderator/reports-v2

3. ✅ 프론트엔드 연결 확인
   - ModeratorDashboard 접근
   - OnlineUserList 표시
   - ContentReportList 작동

## 참고 문서

- [온라인 상태 서비스](../src/services/online-status-service.js)
- [모더레이터 서비스](../src/services/moderator-service.js)
- [모더레이터 라우트](../src/routes/moderator.js)
- [온라인 상태 라우트](../src/routes/online-status.js)
