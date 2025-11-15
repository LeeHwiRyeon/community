# 🚀 작업 진행 계획

**작성일**: 2025년 11월 10일 16:30  
**현재 상태**: Backend 서버 구조 수정 완료, MariaDB 대기

---

## 📋 작업 우선순위

### 🚨 Priority 0: 즉시 실행 필요 (관리자 권한 필요)

#### Task 1: MariaDB 서비스 시작 ⏳ **차단됨**
**상태**: 🔴 Stopped (확인됨)  
**필요 작업**: 
```powershell
# 관리자 권한 PowerShell에서 실행
Start-Service MariaDB

# 또는 서비스 관리자에서 수동 시작
# Win + R → services.msc → MariaDB → 시작
```

**의존성**: 없음 (독립 실행)  
**예상 시간**: 2분

---

### ⚡ Priority 1: DB 및 서버 실행 (Task 1 완료 후)

#### Task 2: DB 마이그레이션 실행
**상태**: ⏳ 대기  
**의존성**: Task 1 완료 필요

```bash
cd server-backend
node scripts/run-migrations.js
```

**마이그레이션 파일**:
- `migrations/007_create_notifications_table.sql` - 알림 시스템
- `migrations/008_create_user_profile_v2.sql` - 프로필 v2
- `database/migrations/006_dashboard_schema.sql` - 대시보드

**예상 시간**: 10분

---

#### Task 3: Backend 서버 실행
**상태**: ⏳ 대기  
**의존성**: Task 2 완료 필요

```bash
cd server-backend
npm run dev
```

**확인 사항**:
- ✅ 포트 3001에서 실행
- ✅ MariaDB 연결 성공
- ✅ Redis 연결 (선택적)
- ✅ Elasticsearch 연결 (선택적)

**예상 시간**: 5분

---

#### Task 4: Frontend 서버 실행
**상태**: ⏳ 대기  
**의존성**: Task 3과 병렬 실행 가능

```bash
cd frontend
npm run dev
```

**확인 사항**:
- ✅ 포트 5173에서 실행
- ✅ Backend API 연결 (http://localhost:3001)
- ✅ WebSocket 연결 (ws://localhost:3001)

**예상 시간**: 5분

---

#### Task 5: E2E 테스트 실행
**상태**: ⏳ 대기  
**의존성**: Task 3, 4 완료 필요

```bash
cd frontend
npx playwright test tests/e2e/ --reporter=html
```

**테스트 현황**:
- 작성 완료: 82 tests (14개 파일)
- 실행 가능: 69 tests
- 미실행: 17 tests (DM, 그룹 채팅 미구현)

**예상 시간**: 30분

---

## 🔧 Priority 2: 개발 작업 (1-2주)

### Week 1: 핵심 커뮤니티 기능

#### Task 6: DM 시스템 Backend 구현 (1.5일)
**상태**: ⏳ 대기

**작업 내용**:
1. **서비스 파일 생성**
   ```bash
   # 파일: server-backend/src/services/dm-service.js (500 lines)
   ```

2. **DB 마이그레이션**
   ```sql
   -- migrations/009_create_dm_tables.sql
   CREATE TABLE direct_messages (
       id INT AUTO_INCREMENT PRIMARY KEY,
       conversation_id INT,
       sender_id INT,
       receiver_id INT,
       content TEXT,
       is_read BOOLEAN DEFAULT FALSE,
       is_deleted BOOLEAN DEFAULT FALSE,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   CREATE TABLE dm_conversations (
       id INT AUTO_INCREMENT PRIMARY KEY,
       participant1_id INT,
       participant2_id INT,
       last_message_at TIMESTAMP,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

3. **API 구현** (8개)
   - POST `/api/dm/send` - DM 전송
   - GET `/api/dm/conversations` - 대화 목록
   - GET `/api/dm/messages/:conversationId` - 메시지 조회
   - PUT `/api/dm/read/:messageId` - 읽음 처리
   - DELETE `/api/dm/:messageId` - 메시지 삭제
   - POST `/api/dm/attachment` - 첨부파일
   - GET `/api/dm/search` - 검색
   - POST `/api/dm/typing` - 타이핑 중

4. **WebSocket 통합**
   - 실시간 메시지 전송
   - 타이핑 인디케이터
   - 읽음 확인

**예상 시간**: 1.5일 (12시간)

---

#### Task 7: DM 시스템 Frontend 구현 (0.5일)
**상태**: ⏳ 대기  
**의존성**: Task 6 완료 필요

**작업 내용**:
```typescript
// frontend/src/components/DM/
// 1. DMInbox.tsx              (150 lines) - DM 목록
// 2. DMConversation.tsx       (200 lines) - 대화 창
// 3. DMMessageInput.tsx       (100 lines) - 입력 필드
// 4. DMNotification.tsx       (50 lines)  - 알림
```

**기능**:
- DM 목록 표시
- 실시간 메시지 송수신
- 타이핑 인디케이터
- 읽음 확인
- 첨부파일 지원

**예상 시간**: 0.5일 (4시간)

---

#### Task 8: 그룹 채팅 Backend 구현 (2일)
**상태**: ⏳ 대기

**작업 내용**:
1. **서비스 파일 생성**
   ```bash
   # 파일: server-backend/src/services/group-chat-service.js (600 lines)
   ```

2. **DB 마이그레이션**
   ```sql
   -- migrations/010_create_group_chat_tables.sql
   CREATE TABLE chat_groups (
       id INT AUTO_INCREMENT PRIMARY KEY,
       name VARCHAR(100),
       description TEXT,
       owner_id INT,
       max_members INT DEFAULT 100,
       is_private BOOLEAN DEFAULT FALSE,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   CREATE TABLE group_members (
       group_id INT,
       user_id INT,
       role ENUM('owner', 'admin', 'member') DEFAULT 'member',
       joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       PRIMARY KEY (group_id, user_id)
   );

   CREATE TABLE group_messages (
       id INT AUTO_INCREMENT PRIMARY KEY,
       group_id INT,
       user_id INT,
       content TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

3. **API 구현** (10개)
   - POST `/api/chat/groups` - 그룹 생성
   - GET `/api/chat/groups` - 그룹 목록
   - POST `/api/chat/groups/:id/invite` - 초대
   - DELETE `/api/chat/groups/:id/kick` - 추방
   - PUT `/api/chat/groups/:id/role` - 역할 변경
   - POST `/api/chat/groups/:id/send` - 메시지 전송
   - GET `/api/chat/groups/:id/messages` - 메시지 조회
   - DELETE `/api/chat/groups/:id/message/:msgId` - 메시지 삭제
   - PUT `/api/chat/groups/:id/settings` - 설정
   - GET `/api/chat/groups/search` - 검색

**예상 시간**: 2일 (16시간)

---

#### Task 9: 그룹 채팅 Frontend 구현 (1일)
**상태**: ⏳ 대기  
**의존성**: Task 8 완료 필요

**작업 내용**:
```typescript
// frontend/src/components/GroupChat/
// 1. GroupChatList.tsx        (150 lines) - 그룹 목록
// 2. GroupChatRoom.tsx        (250 lines) - 채팅방
// 3. GroupChatSettings.tsx    (150 lines) - 설정
// 4. GroupMemberList.tsx      (100 lines) - 멤버 목록
// 5. CreateGroupDialog.tsx    (100 lines) - 생성 다이얼로그
```

**기능**:
- 그룹 생성/삭제
- 멤버 초대/추방
- 역할 관리 (owner, admin, member)
- 실시간 그룹 채팅
- 그룹 설정

**예상 시간**: 1일 (8시간)

---

### Week 2: 모듈 변환 및 테스트

#### Task 10: CommonJS → ES Module 변환 (2일)
**상태**: ⏳ 대기

**변환 대상** (9개 파일):

**Routes (4개)**:
1. `server-backend/middleware/routes/notifications.js`
2. `server-backend/middleware/routes/todos.js`
3. `server-backend/middleware/routes/upload.js`
4. `server-backend/middleware/routes/translate.js`

**Middleware (5개)**:
5. `server-backend/middleware/csrf.js`
6. `server-backend/middleware/security.js`
7. `server-backend/middleware/waf.js`
8. `server-backend/middleware/ddos-protection.js`
9. `server-backend/middleware/ai-threat-detection.js`

**변환 작업**:
```javascript
// Before (CommonJS)
const rateLimit = require('express-rate-limit');
module.exports = { wafMiddleware };

// After (ES Module)
import rateLimit from 'express-rate-limit';
export { wafMiddleware };
```

**추가 변환**:
- `require()` → `import`
- `module.exports` → `export`
- `__dirname` → `import.meta.url`
- 동적 import 처리

**예상 시간**: 2일 (16시간)

---

## 📊 전체 타임라인

### Week 1
- **Day 1**: 
  - MariaDB 시작 (2분)
  - DB 마이그레이션 (10분)
  - Backend/Frontend 서버 실행 (10분)
  - E2E 테스트 실행 (30분)
  - DM Backend 구현 시작 (7시간)
  
- **Day 2**: 
  - DM Backend 구현 완료 (5시간)
  - DM Frontend 구현 (4시간)
  - DM E2E 테스트 (2시간)
  
- **Day 3-4**: 
  - 그룹 채팅 Backend 구현 (2일, 16시간)
  
- **Day 5**: 
  - 그룹 채팅 Frontend 구현 (1일, 8시간)

### Week 2
- **Day 1-2**: 
  - CommonJS → ES Module 변환 (2일, 16시간)
  
- **Day 3**: 
  - 통합 테스트 (8시간)
  - 버그 수정

**총 예상 시간**: 약 85시간 (10.6일)

---

## 🎯 현재 진행 가능한 작업

### ✅ 즉시 실행 가능 (MariaDB 없이)

1. **코드 리뷰 및 분석**
   - Backend 코드 구조 확인 ✅
   - CommonJS 파일 식별 ✅
   - API 엔드포인트 문서화

2. **DM 시스템 설계**
   - DB 스키마 설계
   - API 명세서 작성
   - 컴포넌트 구조 설계

3. **그룹 채팅 설계**
   - DB 스키마 설계
   - API 명세서 작성
   - 컴포넌트 구조 설계

### ⏳ MariaDB 필요

1. DB 마이그레이션
2. Backend 서버 실행
3. E2E 테스트
4. 실제 개발 작업

---

## 🚦 다음 단계

**사용자 조치 필요**:
```powershell
# 관리자 권한 PowerShell에서 실행
Start-Service MariaDB
```

**자동 진행 가능** (MariaDB 시작 후):
1. DB 마이그레이션 실행
2. Backend/Frontend 서버 실행
3. E2E 테스트 실행
4. DM 시스템 개발 시작

---

**현재 상태**: MariaDB 시작 대기 중 🔴  
**준비 완료**: Backend 코드, Frontend 환경, E2E 테스트 ✅

---

**작성자**: AUTOAGENTS  
**최종 수정**: 2025년 11월 10일 16:30
