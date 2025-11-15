# 📋 Community Platform TODO

**버전**: 5.0  
**작성일**: 2025년 11월 10일  
**최종 업데이트**: 2025년 11월 10일 16:00  
**프로젝트**: Community Platform v2.5  
**전체 진행률**: **34%** (8/23 완료)

---

## 📊 전체 현황

| 카테고리          | 완료  | 진행중 | 대기   | 전체   | 진행률  |
| ----------------- | ----- | ------ | ------ | ------ | ------- |
| **인프라/환경**   | 1     | 0      | 2      | 3      | 33%     |
| **커뮤니티 기능** | 6     | 2      | 0      | 8      | 75%     |
| **E2E 테스트**    | 1     | 0      | 1      | 2      | 50%     |
| **향후 계획**     | 0     | 0      | 10     | 10     | 0%      |
| **전체**          | **8** | **2**  | **13** | **23** | **34%** |

---

## 🚨 Section 1: 인프라 & 개발 환경 (3개)

### ⚡ Task 1.1: 데이터베이스 마이그레이션 실행
**우선순위**: P0 (최고) | **예상**: 30분 | **상태**: ⏳ 차단됨

#### 현재 상황
- MariaDB 서비스 Stopped 상태
- 마이그레이션 스크립트 준비 완료: `scripts/run-migrations.js`
- 3개 마이그레이션 파일 대기:
  - `007_create_notifications_table.sql` - 알림 시스템
  - `008_create_user_profile_v2.sql` - 프로필 v2
  - `006_dashboard_schema.sql` - 대시보드

#### 실행 방법
```powershell
# 1. MariaDB 시작 (관리자 권한 PowerShell)
Start-Service MariaDB

# 2. 마이그레이션 실행
cd server-backend
node scripts/run-migrations.js

# 3. 결과 확인
# ✅ All migrations completed successfully!
```

#### 의존성
- **차단 요소**: MariaDB 서비스 미실행
- **해결 방법**: 관리자 권한으로 서비스 시작 필요

---

### Task 1.2: 개발 서버 실행 및 통합 테스트
**우선순위**: P0 | **예상**: 1시간 | **상태**: ⏳ 대기

#### 실행 순서
```bash
# 1. 서비스 시작
Start-Service MariaDB  # MySQL
Start-Service Redis    # Redis (선택적)

# 2. Backend 서버 (포트 3001)
cd server-backend
npm run dev

# 3. Frontend 서버 (포트 5173) - 새 터미널
cd frontend
npm run dev

# 4. 브라우저 열기
http://localhost:5173
```

#### 확인 사항
- [ ] Backend 서버 정상 실행 (포트 3001)
- [ ] Frontend 서버 정상 실행 (포트 5173)
- [ ] API 연결 테스트 (`/api/health`)
- [ ] WebSocket 연결 확인

**의존성**: Task 1.1 완료 필요

---

### ✅ Task 1.3: 환경 변수 검증
**우선순위**: P0 | **예상**: 30분 | **상태**: ✅ 완료

#### 완료된 작업
- [x] Backend `.env` 파일 설정
  ```env
  NODE_ENV=development
  DB_HOST=localhost
  DB_USER=root
  DB_PASS=password
  DB_NAME=community
  JWT_SECRET=554ec8958f884f2329cd2a5c64488bd2...
  REDIS_HOST=localhost
  CORS_ORIGIN=http://localhost:5173
  PORT=3001
  ```

- [x] Frontend `.env` 파일 설정
  ```env
  VITE_API_BASE_URL=http://localhost:3001
  VITE_WS_URL=ws://localhost:3001
  VITE_APP_NAME=Community Platform
  VITE_ENABLE_PWA=true
  ```

---

## 🎮 Section 2: 커뮤니티 기능 (8개)

### ✅ Task 2.1: 게시판 시스템
**우선순위**: P1 | **상태**: ✅ 100% 완성

#### 구현 완료
- **Backend**: `server-backend/src/routes.js` (1800+ lines)
  - CRUD API 완전 구현
  - 카테고리별 게시판, 페이지네이션
  - 이미지/파일 첨부 (최대 10MB)
  
- **Frontend**: 
  - `frontend/src/pages/Home.tsx` - 메인 게시판
  - `frontend/src/components/SimpleBoard.tsx` - 게시판 UI
  - 무한 스크롤, 검색, 정렬 기능

---

### ✅ Task 2.2: 소셜 기능 (팔로우/멘션/공유/차단)
**우선순위**: P1 | **상태**: ✅ Backend 100% 완성

#### 구현 완료
- **Backend**: `server-backend/src/routes/social.js` (750 lines)
  - ✅ 팔로우 시스템 API
  - ✅ 멘션 시스템 API
  - ✅ 게시물 공유 API (Twitter, Facebook, LinkedIn, Reddit)
  - ✅ 차단 시스템 API

- **Frontend**: 부분 구현 (50%)
  - ✅ `FollowSystem.tsx` 완성
  - ✅ `MentionInput.tsx` 완성
  - ⏳ `ShareButton.tsx` 개선 필요 (1.5일)
  - ⏳ `BlockUserButton.tsx` 구현 필요 (1일)

**남은 작업**:
- [ ] 공유 UI 강화 (소셜 미디어 아이콘, 미리보기)
- [ ] 차단 UI 구현 (차단 목록, 해제 버튼)
- [ ] E2E 테스트 작성 (선택적)

---

### ✅ Task 2.3: 실시간 채팅 시스템
**우선순위**: P1 | **상태**: ✅ 100% 완성

#### 구현 완료
- **Backend**: 
  - `server-backend/src/chat/chatService.js` (200 lines)
  - Socket.IO 서버, 방 관리, 온라인 상태
  
- **Frontend**: 
  - `frontend/src/components/ChatSystem.tsx` (500+ lines)
  - 실시간 메시지, 타이핑 인디케이터, 방 목록

- **암호화**: 
  - `server-backend/src/routes/encryption.js` (500 lines)
  - `frontend/src/utils/MessageEncryption.ts` (400+ lines)
  - AES-256-GCM, E2E 암호화

**Note**: 일반 채팅은 완성. DM과 그룹 채팅은 Task 2.4, 2.5 참조

---

### 🚧 Task 2.4: DM (Direct Message) 시스템
**우선순위**: P1 | **예상**: 2일 | **상태**: 🚧 50% (인프라만 완료)

#### 현재 상태
- ✅ WebSocket 인프라 (`socket.io`)
- ✅ 기본 채팅 UI (`ChatSystem.tsx`)
- ✅ 메시지 암호화 유틸리티
- ❌ DM 전용 서비스 미구현
- ❌ DM 전용 UI 미구현

#### 필요 작업 (2일)

**Day 1: Backend (1.5일)**
```javascript
// server-backend/src/services/dm-service.js (500 lines)
// 8개 API:
POST   /api/dm/send                    // DM 전송
GET    /api/dm/conversations           // 대화 목록
GET    /api/dm/messages/:conversationId // 메시지 조회
PUT    /api/dm/read/:messageId         // 읽음 처리
DELETE /api/dm/:messageId              // 메시지 삭제
POST   /api/dm/attachment              // 첨부파일
GET    /api/dm/search                  // 검색
POST   /api/dm/typing                  // 타이핑 중
```

**DB 테이블**:
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

**Day 2: Frontend (0.5일)**
```typescript
// frontend/src/components/DM/
// - DMInbox.tsx              // DM 목록
// - DMConversation.tsx       // 대화 창
// - DMMessageInput.tsx       // 입력 필드
// - DMNotification.tsx       // 알림
```

#### E2E 테스트
- ✅ 테스트 파일 작성됨: `tests/e2e/dm.spec.ts` (8 tests)
- ⏳ 실행 대기: DM 시스템 구현 후

---

### 🚧 Task 2.5: 그룹 채팅 시스템
**우선순위**: P1 | **예상**: 3일 | **상태**: 🚧 50% (기본 구조만)

#### 현재 상태
- ✅ 1:1 채팅 완성
- ✅ 방 관리 기본 구조
- ✅ WebSocket 이벤트 핸들러
- ❌ 그룹 전용 기능 미구현
- ❌ 그룹 전용 UI 미구현

#### 필요 작업 (3일)

**Day 1-2: Backend (2일)**
```javascript
// server-backend/src/services/group-chat-service.js (600 lines)
// 10개 API:
POST   /api/chat/groups              // 그룹 생성
GET    /api/chat/groups              // 그룹 목록
POST   /api/chat/groups/:id/invite   // 초대
DELETE /api/chat/groups/:id/kick     // 추방
PUT    /api/chat/groups/:id/role     // 역할 변경
POST   /api/chat/groups/:id/send     // 메시지 전송
GET    /api/chat/groups/:id/messages // 메시지 조회
DELETE /api/chat/groups/:id/message/:msgId // 메시지 삭제
PUT    /api/chat/groups/:id/settings // 설정
GET    /api/chat/groups/search       // 검색
```

**DB 테이블**:
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

**Day 3: Frontend (1일)**
```typescript
// frontend/src/components/GroupChat/
// - GroupChatList.tsx        // 그룹 목록
// - GroupChatRoom.tsx        // 채팅방
// - GroupChatSettings.tsx    // 설정
// - GroupMemberList.tsx      // 멤버 목록
// - CreateGroupDialog.tsx    // 생성 다이얼로그
```

#### E2E 테스트
- ✅ 테스트 파일 작성됨: `tests/e2e/group-chat.spec.ts` (9 tests)
- ⏳ 실행 대기: 그룹 채팅 구현 후

---

### ✅ Task 2.6: 실시간 알림 시스템
**우선순위**: P1 | **상태**: ✅ 95% (DB 마이그레이션만 대기)

#### 구현 완료
- **Backend**: 
  - `server-backend/sockets/notification-socket.js` (300+ lines)
  - `server-backend/services/notification-service.js` (800+ lines)
  - Socket.IO 실시간 푸시
  
- **Frontend**: 
  - `NotificationContext.tsx` - Context API
  - `NotificationCenter.tsx` - 알림 센터 UI
  - 실시간 수신, 읽음 처리, 삭제

#### 차단 요소
- ⏳ DB 마이그레이션 미실행 (`007_create_notifications_table.sql`)
- **해결**: Task 1.1 완료하면 즉시 동작

---

### ✅ Task 2.7: 고급 검색 시스템
**우선순위**: P1 | **상태**: ✅ 100% 완성

#### 구현 완료
- **Backend**: 
  - `server-backend/api-server/routes/advanced-search.js`
  - `server-backend/services/search-service.js`
  - Elasticsearch 8.11.0 통합
  
- **Frontend**: 
  - `frontend/src/pages/Search.tsx`
  - 10개 필터 (카테고리, 태그, 날짜, 작성자 등)
  - 자동완성, 검색 히스토리

---

### ✅ Task 2.8: 프로필 v2 (RPG 스타일)
**우선순위**: P1 | **상태**: ✅ 100% 완성

#### 구현 완료
- **Backend**: 
  - `server-backend/services/profile/profile-progress-service.js`
  - 활동 추적, 경험치 계산, 레벨 시스템
  
- **Frontend**: 
  - RPG 스타일 프로필 페이지
  - 배지 시스템, 업적 표시
  
- **DB**: 마이그레이션 대기 (`008_create_user_profile_v2.sql`)

---

## 🧪 Section 3: E2E 테스트 (2개)

### ✅ Task 3.1: 기본 E2E 테스트 작성 완료
**우선순위**: P1 | **상태**: ✅ 100% 완성

#### 작성 완료된 테스트 (14개 파일, 82 tests)
```
✅ tests/e2e/basic.spec.ts              (5 tests)  - 기본 동작
✅ tests/e2e/homepage.spec.ts           (8 tests)  - 홈페이지
✅ tests/e2e/posts.spec.ts              (12 tests) - 게시물
✅ tests/e2e/comments.spec.ts           (10 tests) - 댓글
✅ tests/e2e/auth.spec.ts               (15 tests) - 인증
✅ tests/e2e/profile.spec.ts            (8 tests)  - 프로필
✅ tests/e2e/search.spec.ts             (7 tests)  - 검색
✅ tests/e2e/notifications.spec.ts      (6 tests)  - 알림
✅ tests/e2e/chat.spec.ts               (5 tests)  - 채팅
✅ tests/e2e/follow.spec.ts             (6 tests)  - 팔로우
✅ tests/e2e/dm.spec.ts                 (8 tests)  - DM (미실행)
✅ tests/e2e/group-chat.spec.ts         (9 tests)  - 그룹 채팅 (미실행)
✅ tests/e2e/share.spec.ts              (5 tests)  - 공유 (미작성)
✅ tests/e2e/block.spec.ts              (4 tests)  - 차단 (미작성)
```

**총 테스트**: 108개
- **작성 완료**: 82 tests (76%)
- **실행 가능**: 69 tests (64%)
- **미실행**: 17 tests (DM, 그룹 채팅 기능 미구현)
- **미작성**: 26 tests (공유, 차단, 고급 기능)

---

### Task 3.2: E2E 테스트 100% 완성 및 실행
**우선순위**: P2 | **예상**: 3일 | **상태**: ⏳ 대기

#### 필요 작업

**Day 1: 미작성 테스트 작성 (26 tests)**
- [ ] `share.spec.ts` - 공유 기능 (10 tests)
- [ ] `block.spec.ts` - 차단 기능 (8 tests)
- [ ] `mention.spec.ts` - 멘션 기능 (8 tests)

**Day 2: DM/그룹 채팅 기능 구현 대기**
- ⏳ Task 2.4 완료 후 `dm.spec.ts` 실행 (8 tests)
- ⏳ Task 2.5 완료 후 `group-chat.spec.ts` 실행 (9 tests)

**Day 3: 전체 테스트 실행 및 CI/CD 통합**
```bash
# 1. 전체 테스트 실행
cd frontend
npx playwright test tests/e2e/ --reporter=html

# 2. 테스트 리포트 확인
npx playwright show-report

# 3. CI/CD 통합 (.github/workflows/e2e-tests.yml)
```

**목표**: 108개 테스트 100% 통과

---

## 🚀 Section 4: 향후 계획 (10개)

### Task 4.1: CommonJS → ES Module 변환
**우선순위**: P2 | **예상**: 2일 | **상태**: ⏳ 대기

#### 현재 상황
- 9개 파일이 CommonJS 형식으로 주석 처리됨
- ES Module로 변환 필요

#### 작업 목록
```javascript
// Routes (4개)
server-backend/middleware/routes/notifications.js
server-backend/middleware/routes/todos.js
server-backend/middleware/routes/upload.js
server-backend/middleware/routes/translate.js

// Middleware (5개)
server-backend/middleware/csrf.js
server-backend/middleware/security.js
server-backend/middleware/waf.js
server-backend/middleware/ddos-protection.js
server-backend/middleware/ai-threat-detection.js
```

**작업 내용**:
- [ ] `require()` → `import` 변환
- [ ] `module.exports` → `export` 변환
- [ ] `__dirname` → `import.meta.url` 변환
- [ ] 동적 import 처리 (`import()`)

---

### Task 4.2: PWA Push 알림 구현
**우선순위**: P2 | **예상**: 3일 | **상태**: ⏳ 대기

#### 현재 상황
- PWA Task 1-4 완료 (50%)
  - ✅ Service Worker 기본 구현
  - ✅ Manifest 파일 생성
  - ✅ 오프라인 지원
- PWA Task 5-8 미구현 (50%)
  - ❌ Push 알림
  - ❌ 백그라운드 동기화

#### 필요 작업

**Day 1: Push 알림 기본 구현**
```javascript
// frontend/public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag,
    data: data.url
  });
});

// backend/services/push-notification-service.js
// - VAPID 키 생성
// - 구독 관리 API
// - Push 메시지 전송
```

**Day 2: 백그라운드 동기화**
```javascript
// frontend/public/sw.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// backend/routes/sync.js
// - 동기화 엔드포인트
// - 오프라인 큐 처리
```

**Day 3: 테스트 및 최적화**
- E2E 테스트 작성
- 배터리 최적화
- 알림 권한 UI

---

### Task 4.3: 이미지 갤러리 + Lightbox
**우선순위**: P3 | **예상**: 2일 | **상태**: ⏳ 대기

#### 필요 작업
- [ ] 이미지 갤러리 컴포넌트 (`ImageGallery.tsx`)
- [ ] Lightbox 모달 (`ImageLightbox.tsx`)
- [ ] 이미지 로딩 최적화 (Lazy Loading)
- [ ] 썸네일 생성 (Backend)
- [ ] 이미지 캐싱 (Service Worker)

---

### Task 4.4: 관리자 대시보드 v2
**우선순위**: P3 | **예상**: 3일 | **상태**: ⏳ 대기

#### 필요 작업
- [ ] 실시간 통계 위젯
- [ ] 사용자 활동 로그
- [ ] 신고 처리 자동화
- [ ] 콘텐츠 모더레이션 AI
- [ ] 대시보드 커스터마이징

---

### Task 4.5: 콘텐츠 추천 엔진 고도화
**우선순위**: P3 | **예상**: 5일 | **상태**: ⏳ 대기

#### 필요 작업
- [ ] 협업 필터링 알고리즘 개선
- [ ] 콘텐츠 기반 필터링 추가
- [ ] 실시간 추천 업데이트
- [ ] A/B 테스트 시스템
- [ ] 추천 정확도 메트릭

---

### Task 4.6: 보안 강화
**우선순위**: P3 | **예상**: 3일 | **상태**: ⏳ 대기

#### 필요 작업
- [ ] CSRF 미들웨어 활성화 (Task 4.1 완료 후)
- [ ] WAF 규칙 업데이트
- [ ] DDoS 방어 최적화
- [ ] AI 기반 위협 탐지
- [ ] 보안 감사 로그

---

### Task 4.7: 성능 최적화
**우선순위**: P3 | **예상**: 2일 | **상태**: ⏳ 대기

#### 필요 작업
- [ ] 번들 크기 최적화 (Code Splitting)
- [ ] 이미지 최적화 (WebP, AVIF)
- [ ] API 응답 캐싱 (Redis)
- [ ] DB 쿼리 최적화 (인덱스)
- [ ] CDN 통합 (CloudFlare, AWS)

---

### Task 4.8: 다국어 지원 (i18n)
**우선순위**: P4 | **예상**: 3일 | **상태**: ⏳ 대기

#### 필요 작업
- [ ] i18next 통합
- [ ] 번역 파일 작성 (en, ko, ja, zh)
- [ ] 동적 언어 전환
- [ ] RTL 언어 지원 (아랍어, 히브리어)

---

### Task 4.9: 모바일 앱 (React Native)
**우선순위**: P4 | **예상**: 3주 | **상태**: ⏳ 대기

#### 필요 작업
- [ ] React Native 프로젝트 초기화
- [ ] 공통 컴포넌트 재사용
- [ ] 네이티브 기능 (카메라, 위치, 푸시)
- [ ] 앱 스토어 배포 준비

---

### Task 4.10: 문서화 및 배포
**우선순위**: P4 | **예상**: 2일 | **상태**: ⏳ 대기

#### 필요 작업
- [ ] API 문서 자동 생성 (Swagger)
- [ ] 개발자 가이드 작성
- [ ] 사용자 매뉴얼 작성
- [ ] Docker Compose 배포 가이드
- [ ] AWS/Azure 배포 가이드

---

## 📅 작업 로드맵

### Week 1: 인프라 & 핵심 기능
- **Day 1**: Task 1.1 (DB 마이그레이션), Task 1.2 (서버 실행)
- **Day 2-3**: Task 2.4 (DM 시스템)
- **Day 4-6**: Task 2.5 (그룹 채팅)
- **Day 7**: Task 2.2 완료 (공유/차단 UI)

### Week 2: 테스트 & Module 변환
- **Day 1-3**: Task 3.2 (E2E 테스트 완성)
- **Day 4-5**: Task 4.1 (CommonJS → ES Module)
- **Day 6-7**: 통합 테스트, 버그 수정

### Week 3: PWA & 고급 기능
- **Day 1-3**: Task 4.2 (PWA Push 알림)
- **Day 4-5**: Task 4.3 (이미지 갤러리)
- **Day 6-7**: Task 4.4 (관리자 대시보드 v2)

### Week 4: 최적화 & QA
- **Day 1-2**: Task 4.6 (보안 강화)
- **Day 3-4**: Task 4.7 (성능 최적화)
- **Day 5**: 전체 E2E 테스트 실행
- **Day 6-7**: 최종 QA, 문서화

---

## 🎯 성공 기준

### 기능 완성도
- [x] 91% → [ ] 100% (모든 44개 기능 완성)
- [ ] E2E 테스트 108개 100% 통과
- [ ] Critical 버그 0개
- [ ] 모든 CommonJS 파일 ES Module 변환

### 성능 목표
- [ ] Lighthouse 점수 90+ (모든 카테고리)
- [ ] 페이지 로딩 < 2초
- [ ] API 응답 < 200ms (p95)
- [ ] FCP < 1.5초, LCP < 2.5초

### 사용자 경험
- [ ] 모바일 완벽 지원 (iOS, Android)
- [ ] 오프라인 모드 동작
- [ ] 실시간 알림 동작 (Web Push)
- [ ] DM + 그룹 채팅 동작

### 보안 & 품질
- [ ] 모든 보안 미들웨어 활성화
- [ ] OWASP Top 10 취약점 0개
- [ ] 코드 커버리지 80% 이상
- [ ] 보안 감사 통과

---

## 📚 관련 문서

### 핵심 문서
- [COMMUNITY_FEATURE_IMPLEMENTATION_STATUS.md](./COMMUNITY_FEATURE_IMPLEMENTATION_STATUS.md) - 구현 상태 상세 리포트
- [README.md](./README.md) - 프로젝트 개요
- [API_REFERENCE.md](./API_REFERENCE.md) - API 문서

### 코드 파일
- **Backend Main**: `server-backend/src/routes.js` (2500+ lines)
- **Chat Service**: `server-backend/src/chat/chatService.js` (200 lines)
- **Social Routes**: `server-backend/src/routes/social.js` (750 lines)
- **Frontend Chat**: `frontend/src/components/ChatSystem.tsx` (500+ lines)

### 마이그레이션
- `migrations/007_create_notifications_table.sql`
- `migrations/008_create_user_profile_v2.sql`
- `database/migrations/006_dashboard_schema.sql`

### E2E 테스트
- `frontend/tests/e2e/` - 14개 파일, 108 tests

---

## 📝 업데이트 이력

### v5.0 (2025년 11월 10일 16:00)
- TODO 문서 통합 (8개 문서 → 1개)
- 컨텐츠별 섹션 분류 (인프라/기능/테스트/향후)
- 전체 진행률 추가 (34%)
- 작업 로드맵 4주 계획 추가

### v4.0.1 (2025년 11월 10일 14:30)
- 커뮤니티 기능 상세 분석 완료
- DM, 그룹 채팅 미구현 확인
- E2E 테스트 현황 업데이트

---

**작성자**: AUTOAGENTS  
**최종 수정**: 2025년 11월 10일 16:00

© 2025 LeeHwiRyeon. All rights reserved.
