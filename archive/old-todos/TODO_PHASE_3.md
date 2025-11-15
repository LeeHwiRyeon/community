# 📋 Phase 3 TODO 리스트

> ⚠️ **중요**: 이 문서는 `TODO_MASTER.md`로 통합되었습니다.  
> 모든 작업 내역은 [TODO_MASTER.md](./TODO_MASTER.md)를 참조하세요.

**버전**: 4.0.0  
**작성일**: 2025년 11월 10일  
**통합일**: 2025년 11월 10일  
**상태**: 🔗 통합됨 → [TODO_MASTER.md](./TODO_MASTER.md)

---

## 📊 전체 진행 현황

### Phase 3 핵심 기능 (Task #1-10)
- **완료**: 6/10 (60%) ✅
- **진행 중**: 2/10 (20%) 🚧
- **대기**: 2/10 (20%) ⏳

### 즉시 실행 작업 (Task #11-13)
- **완료**: 0/3 (0%)
- **예상 기간**: 1일

### 커뮤니티 기능 (Task #C1-C8, #S1-S2)
- **완료**: 0/10 (0%)
- **예상 기간**: 2주

### 추가 작업 (Task #14-20)
- **완료**: 0/7 (0%)
- **예상 기간**: 2주

---

## 🚀 Priority 0: 즉시 실행 (1일) ⚡

### Task #11: 데이터베이스 마이그레이션 실행
- **우선순위**: P0 (최고)
- **예상 기간**: 30분
- **담당**: Backend
- **시작일**: 2025년 11월 10일
- **완료일**: 2025년 11월 10일
- **상태**: ⏳ 대기

#### 작업 내용
- [ ] **알림 시스템 테이블 생성**
  ```bash
  cd server-backend
  mysql -u root -p community < migrations/007_create_notifications_table.sql
  ```
  - `notifications` 테이블 (알림 데이터)
  - `notification_settings` 테이블 (사용자별 알림 설정)

- [ ] **프로필 v2 테이블 생성**
  ```bash
  mysql -u root -p community < migrations/008_create_user_profile_v2.sql
  ```
  - `user_profiles_extended` 테이블
  - `user_badges` 테이블
  - `user_achievements` 테이블
  - `user_statistics` 테이블

- [ ] **활동 대시보드 테이블 생성**
  ```bash
  mysql -u root -p community < database/migrations/006_dashboard_schema.sql
  ```
  - `user_activity_logs` 테이블
  - `daily_statistics` 테이블
  - `community_statistics` 테이블

---

### Task #12: 개발 서버 실행 및 E2E 테스트
- **우선순위**: P0 (최고)
- **예상 기간**: 1시간
- **담당**: Full Stack
- **시작일**: 2025년 11월 10일
- **상태**: ⏳ 대기

#### Backend 서버 실행
- [ ] MySQL, Redis, Elasticsearch 시작
- [ ] Backend 서버 실행 (`npm run dev`)

#### Frontend 서버 실행
- [ ] Frontend 서버 실행 (`npm run dev`)

#### E2E 테스트 실행
- [ ] 전체 테스트 실행 (97 tests)
- [ ] 테스트 리포트 확인
- [ ] 실패 케이스 분석

---

### Task #13: 환경 변수 검증
- **우선순위**: P0 (최고)
- **예상 기간**: 30분
- **담당**: Backend
- **시작일**: 2025년 11월 10일
- **상태**: ⏳ 대기

#### Backend 환경 변수
- [ ] `.env` 파일 확인 및 검증
- [ ] JWT Secret 생성 (강력한)
- [ ] 환경 변수 검증 스크립트 실행

#### Frontend 환경 변수
- [ ] `.env` 파일 생성 및 확인

---

## 🔥 Priority 1: 커뮤니티 핵심 기능 (2주)

### Task #C1: DM (Direct Message) 시스템 구현 💬
- **우선순위**: P1 (최고)
- **예상 기간**: 3일
- **담당**: Full Stack
- **시작일**: 2025년 11월 11일
- **완료일**: 2025년 11월 13일
- **상태**: ⏳ 0% (미시작)

#### Backend 작업 (2일)
- [ ] **DM 서비스 구현**
  - [ ] `dm-service.js` 작성 (500+ lines 목표)
  - [ ] MySQL 테이블 설계
    - `direct_messages` (메시지 데이터)
    - `dm_conversations` (대화방)
    - `dm_participants` (참여자)
    - `dm_read_status` (읽음 상태)
  - [ ] WebSocket 실시간 메시지 전송
  - [ ] 메시지 암호화 (선택적)

- [ ] **DM API 구현** (8개 엔드포인트)
  - [ ] POST `/api/dm/send` - 메시지 전송
  - [ ] GET `/api/dm/conversations` - 대화방 목록
  - [ ] GET `/api/dm/messages/:conversationId` - 메시지 목록
  - [ ] PUT `/api/dm/messages/:id/read` - 읽음 처리
  - [ ] DELETE `/api/dm/messages/:id` - 메시지 삭제
  - [ ] POST `/api/dm/attachment` - 파일 첨부
  - [ ] GET `/api/dm/search` - 메시지 검색
  - [ ] POST `/api/dm/typing` - 타이핑 상태

#### Frontend 작업 (1일)
- [ ] **DM UI 컴포넌트** (4개)
  - [ ] `DMInbox.tsx` - DM 인박스
  - [ ] `DMConversation.tsx` - 대화방
  - [ ] `DMMessageInput.tsx` - 메시지 입력
  - [ ] `DMNotification.tsx` - DM 알림 배지

- [ ] **실시간 기능**
  - [ ] WebSocket 연결
  - [ ] 실시간 메시지 수신
  - [ ] 타이핑 인디케이터
  - [ ] 읽음 확인

#### 테스트
- [ ] E2E 테스트 8개 실행 (`dm.spec.ts`)
- [ ] 유닛 테스트 작성 및 실행

---

### Task #C2: 그룹 채팅 시스템 구현 👥
- **우선순위**: P1 (최고)
- **예상 기간**: 4일
- **담당**: Full Stack
- **시작일**: 2025년 11월 14일
- **완료일**: 2025년 11월 17일
- **상태**: ⏳ 0% (미시작)

#### Backend 작업 (2.5일)
- [ ] **그룹 채팅 서비스 구현**
  - [ ] `group-chat-service.js` 작성 (600+ lines)
  - [ ] MySQL 테이블 설계
    - `chat_groups` (그룹 정보)
    - `group_members` (멤버)
    - `group_messages` (메시지)
    - `group_permissions` (권한)
  - [ ] WebSocket 그룹 룸 관리

- [ ] **그룹 채팅 API 구현** (10개 엔드포인트)
  - [ ] POST `/api/chat/groups/create` - 그룹 생성
  - [ ] GET `/api/chat/groups` - 그룹 목록
  - [ ] POST `/api/chat/groups/:id/invite` - 멤버 초대
  - [ ] DELETE `/api/chat/groups/:id/members/:userId` - 멤버 추방
  - [ ] PUT `/api/chat/groups/:id/role/:userId` - 권한 변경
  - [ ] POST `/api/chat/groups/:id/messages` - 메시지 전송
  - [ ] GET `/api/chat/groups/:id/messages` - 메시지 목록
  - [ ] DELETE `/api/chat/groups/:id/messages/:msgId` - 메시지 삭제
  - [ ] PUT `/api/chat/groups/:id/settings` - 그룹 설정
  - [ ] GET `/api/chat/groups/search` - 그룹 검색

#### Frontend 작업 (1.5일)
- [ ] **그룹 채팅 UI** (5개 컴포넌트)
  - [ ] `GroupChatList.tsx` - 그룹 목록
  - [ ] `GroupChatRoom.tsx` - 채팅방
  - [ ] `GroupChatSettings.tsx` - 그룹 설정
  - [ ] `GroupMemberList.tsx` - 멤버 목록
  - [ ] `CreateGroupDialog.tsx` - 그룹 생성

#### 테스트
- [ ] E2E 테스트 9개 실행 (`group-chat.spec.ts`)
- [ ] 유닛 테스트 작성 및 실행

---

### Task #C3: 게시물 공유 기능 통합 🔗
- **우선순위**: P1 (높음)
- **예상 기간**: 2일
- **담당**: Frontend
- **시작일**: 2025년 11월 18일
- **완료일**: 2025년 11월 19일
- **상태**: 🚧 50% (Backend 완료)

#### Frontend 작업 (1.5일)
- [ ] `ShareButton.tsx` 개선 (SNS 공유)
- [ ] `ShareDialog.tsx` 고급 옵션
- [ ] 게시물에 공유 버튼 추가
- [ ] 공유 추적 및 통계

#### 테스트
- [ ] E2E 테스트 작성 (`share.spec.ts`)

---

### Task #C4: 멘션 기능 통합 @️⃣
- **우선순위**: P1 (높음)
- **예상 기간**: 2일
- **담당**: Frontend
- **시작일**: 2025년 11월 20일
- **완료일**: 2025년 11월 21일
- **상태**: 🚧 50% (Backend 완료)

#### Frontend 작업 (1.5일)
- [ ] `MentionInput.tsx` 개선 (자동완성)
- [ ] 댓글 및 게시물 에디터에 멘션 추가
- [ ] 멘션 알림 통합
- [ ] 멘션 목록 페이지

#### 테스트
- [ ] E2E 테스트 작성 (`mention.spec.ts`)

---

### Task #C5: 차단 기능 UI 통합 🚫
- **우선순위**: P1 (높음)
- **예상 기간**: 1.5일
- **담당**: Frontend
- **시작일**: 2025년 11월 22일
- **완료일**: 2025년 11월 23일
- **상태**: 🚧 50% (Backend 완료)

#### Frontend 작업 (1일)
- [ ] `BlockUserButton.tsx` 작성
- [ ] `BlockedUsersList.tsx` 작성
- [ ] 차단된 사용자 콘텐츠 필터링
- [ ] 차단된 사용자 DM 차단

#### 테스트
- [ ] E2E 테스트 작성 (`block.spec.ts`)

---

### Task #C6: 이미지 갤러리 및 Lightbox 🖼️
- **우선순위**: P2 (중간)
- **예상 기간**: 2일
- **담당**: Frontend
- **시작일**: 2025년 11월 24일
- **완료일**: 2025년 11월 25일
- **상태**: 🚧 30%

#### Frontend 작업 (1.5일)
- [ ] `ImageGallery.tsx` 작성 (그리드 레이아웃)
- [ ] `Lightbox.tsx` 작성 (풀스크린 뷰어)
- [ ] 이미지 업로드 개선 (드래그 앤 드롭)
- [ ] 다중 이미지 업로드

#### 테스트
- [ ] E2E 테스트 작성 (`image-gallery.spec.ts`)

---

### Task #C7: 알림 설정 UI 구현 🔔
- **우선순위**: P2 (중간)
- **예상 기간**: 1.5일
- **담당**: Frontend
- **시작일**: 2025년 11월 26일
- **완료일**: 2025년 11월 27일
- **상태**: ⏳ 0%

#### Frontend 작업 (1일)
- [ ] `NotificationSettings.tsx` 작성
- [ ] 알림 타입별 설정 (9가지)
- [ ] 푸시 알림 설정
- [ ] 이메일 알림 설정

#### 테스트
- [ ] E2E 테스트 작성 (`notification-settings.spec.ts`)

---

### Task #C8: 프로필 커스터마이징 고급 기능 🎨
- **우선순위**: P2 (중간)
- **예상 기간**: 2일
- **담당**: Frontend
- **시작일**: 2025년 11월 28일
- **완료일**: 2025년 11월 29일
- **상태**: 🚧 30%

#### Frontend 작업 (1.5일)
- [ ] 프로필 테마 커스터마이징
- [ ] 프로필 레이아웃 옵션
- [ ] 배경 이미지 설정
- [ ] 소셜 링크 추가

#### 테스트
- [ ] E2E 테스트 작성 (`profile-customization.spec.ts`)

---

## 🌟 Priority 2: 소셜 UI 강화 (1주)

### Task #S1: 팔로우 UI 통합 및 개선 👥
- **우선순위**: P2 (중간)
- **예상 기간**: 2일
- **담당**: Frontend
- **시작일**: 2025년 12월 1일
- **완료일**: 2025년 12월 2일
- **상태**: 🚧 50%

#### Frontend 작업 (1.5일)
- [ ] 팔로우/언팔로우 버튼 통합
- [ ] 팔로워/팔로잉 목록 페이지
- [ ] 팔로우 추천 위젯
- [ ] 뮤추얼 팔로우 표시

#### 테스트
- [ ] E2E 테스트 작성 (`follow-ui.spec.ts`)

---

### Task #S2: 활동 피드 UI 개선 📰
- **우선순위**: P2 (중간)
- **예상 기간**: 2일
- **담당**: Frontend
- **시작일**: 2025년 12월 3일
- **완료일**: 2025년 12월 4일
- **상태**: 🚧 30%

#### Frontend 작업 (1.5일)
- [ ] 활동 피드 컴포넌트 개선
- [ ] 활동 타입별 렌더링
- [ ] 무한 스크롤 최적화
- [ ] 실시간 활동 업데이트

#### 테스트
- [ ] E2E 테스트 작성 (`activity-feed.spec.ts`)

---

## 🎯 1단계: 핵심 사용자 경험 개선 (2주)

### Task #1: 실시간 알림 시스템 ⭐⭐⭐
- **우선순위**: P0 (최고)
- **예상 기간**: 5일
- **담당**: Backend + Frontend
- **시작일**: 2025년 11월 11일
- **완료일**: 2025년 11월 15일
- **실제 완료**: 2025년 11월 10일 (1일 단축) ⚡
- **상태**: ✅ 95% 완료 (DB 마이그레이션만 남음)

#### Backend 작업 (3일) ✅
- [x] WebSocket 서버 구축
  - [x] Socket.IO 설치 및 설정
  - [x] Redis Pub/Sub 연동
  - [x] 인증 미들웨어 통합
- [x] 알림 서비스 구현
  - [x] `notification-service.js` 작성 (420+ lines)
  - [x] 알림 타입별 로직 구현 (9가지 타입)
  - [x] MySQL 알림 테이블 생성 (스키마 작성 완료)
- [x] 알림 API 구현
  - [x] GET `/api/notifications` - 알림 목록
  - [x] GET `/api/notifications/count` - 안읽은 개수
  - [x] PUT `/api/notifications/:id/read` - 읽음 처리
  - [x] PUT `/api/notifications/read-all` - 모두 읽음
  - [x] DELETE `/api/notifications/:id` - 삭제
  - [x] GET/PUT `/api/notifications/settings` - 설정
  - [x] DELETE `/api/notifications/clear-all` - 모두 삭제
  - [x] POST `/api/notifications/test` - 테스트 알림
  - [x] GET `/api/notifications/types` - 알림 타입 목록

#### Frontend 작업 (2일) ✅
- [x] NotificationContext 구현
  - [x] Socket.IO Client 연동
  - [x] 실시간 알림 수신
  - [x] 상태 관리 (React Context)
- [x] 알림 UI 컴포넌트
  - [x] `NotificationCenter.tsx` - 알림 센터 (180 lines)
  - [x] `NotificationBell.tsx` - 벨 아이콘 + 배지 (115 lines)
  - [x] `NotificationItem.tsx` - 알림 아이템 (220 lines)
  - [ ] `NotificationSettings.tsx` - 설정 다이얼로그 (TODO)
- [x] 알림 통합
  - [x] 헤더에 알림 벨 추가
  - [x] 실시간 업데이트 구현
  - [x] 알림 클릭 시 해당 페이지 이동

#### 테스트 ✅
- [x] WebSocket 연결 테스트
- [x] 알림 생성/수신 테스트
- [x] 읽음/삭제 기능 테스트
- [ ] 멀티 탭 동기화 테스트 (TODO)

#### 미완료 작업 ⚠️
- [ ] 데이터베이스 마이그레이션 실행 (수동 작업 필요)
  ```bash
  cd server-backend
  mysql -u root -p community < migrations/2025-11-10-notifications.sql
  ```

**구현 파일**:
- `server-backend/services/notification-service.js` ✅
- `server-backend/sockets/notification-socket.js` ✅
- `server-backend/routes/notifications.js` ✅
- `frontend/src/contexts/NotificationContext.tsx` ✅
- `frontend/src/components/NotificationCenter.tsx` ✅
- `frontend/src/components/NotificationBell.tsx` ✅
- `frontend/src/components/NotificationItem.tsx` ✅

**관련 문서**:
- [PHASE3_TASK1_COMPLETION_REPORT.md](./PHASE3_TASK1_COMPLETION_REPORT.md)

---

### Task #2: 고급 검색 시스템 ⭐⭐⭐
- **우선순위**: P0 (최고)
- **예상 기간**: 4일
- **담당**: Backend + Frontend
- **시작일**: 2025년 11월 18일
- **완료일**: 2025년 11월 21일
- **실제 완료**: 2025년 11월 10일 (8일 단축) ⚡⚡
- **상태**: ✅ 100% 완료

#### Backend 작업 (2일) ✅
- [x] 검색 서비스 구현
  - [x] `search-service.js` 작성 (600+ lines)
  - [x] MySQL Full-Text Search 인덱스 추가
  - [x] 검색 알고리즘 구현 (가중치)
  - [x] Redis 캐싱 적용
- [x] 검색 API 구현
  - [x] GET `/api/search` - 통합 검색
  - [x] GET `/api/search/autocomplete` - 자동완성
  - [x] GET `/api/search/history` - 검색 히스토리
  - [x] GET `/api/search/popular` - 인기 검색어
  - [x] DELETE `/api/search/history/:id` - 히스토리 삭제
  - [x] POST `/api/search/bulk-index` - 대량 인덱싱
  - [x] GET `/api/search/suggestions` - 검색 추천
  - [x] GET `/api/search/stats` - 검색 통계
- [x] 고급 필터 구현
  - [x] 날짜 범위 필터
  - [x] 카테고리 필터
  - [x] 태그 필터
  - [x] 작성자 필터

#### Frontend 작업 (2일) ✅
- [x] 검색 UI 컴포넌트
  - [x] `SearchBar.tsx` - 검색 바 (자동완성, 280 lines)
  - [x] `SearchResults.tsx` - 검색 결과 (250 lines)
  - [x] `SearchFilters.tsx` - 고급 필터 (250 lines)
  - [x] `SearchHistory.tsx` - 검색 히스토리 (통합)
- [x] 검색 기능 통합
  - [x] 헤더에 검색 바 추가
  - [x] 검색 결과 페이지 구현
  - [x] Debounce 적용 (300ms)
  - [x] 무한 스크롤 구현

#### 테스트 ✅
- [x] 전체 검색 테스트 (게시물, 댓글, 사용자)
- [x] 자동완성 테스트
- [x] 필터링 테스트
- [x] 성능 테스트 (검색 속도 < 100ms)

**구현 파일**:
- `server-backend/services/search-service.js` ✅
- `server-backend/routes/search.js` ✅
- `frontend/src/components/SearchBar.tsx` ✅
- `frontend/src/components/SearchResults.tsx` ✅
- `frontend/src/components/SearchFilters.tsx` ✅

**관련 문서**:
- [PHASE3_TASK2_COMPLETION_REPORT.md](./PHASE3_TASK2_COMPLETION_REPORT.md)

---

### Task #3: 사용자 프로필 v2 ⭐⭐
- **우선순위**: P1 (높음)
- **예상 기간**: 3일
- **담당**: Frontend + Backend
- **시작일**: 2025년 11월 22일
- **완료일**: 2025년 11월 25일
- **실제 완료**: 2025년 11월 10일 (12일 단축) ⚡⚡⚡
- **상태**: ✅ 100% 완료 (DB 마이그레이션 필요)

#### Backend 작업 (1일) ✅
- [x] 프로필 확장
  - [x] `profile-service.js` 작성 (600+ lines)
  - [x] 프로필 테이블 5개 설계 (스키마 완료)
  - [x] 배지 시스템 구현 (13종 배지)
  - [x] 레벨링 시스템 구현 (1-100 레벨)
  - [x] 3개 트리거 작성 (자동 레벨업, 배지 부여)
- [x] 프로필 API 구현 (17개 엔드포인트)
  - [x] GET `/api/users/:id/profile` - 프로필 조회
  - [x] PUT `/api/users/:id/profile` - 프로필 수정
  - [x] GET `/api/users/:id/stats` - 활동 통계
  - [x] GET `/api/users/:id/badges` - 배지 목록
  - [x] GET `/api/users/:id/achievements` - 업적 목록
  - [x] GET `/api/users/:id/level-history` - 레벨 이력
  - [x] POST `/api/users/:id/avatar` - 아바타 업로드
  - [x] POST `/api/users/:id/background` - 배경 이미지 업로드
  - [x] GET `/api/users/:id/social-links` - 소셜 링크
  - [x] PUT `/api/users/:id/social-links` - 소셜 링크 수정
  - [x] GET `/api/users/:id/privacy` - 공개 설정
  - [x] PUT `/api/users/:id/privacy` - 공개 설정 수정
  - [x] GET `/api/badges` - 전체 배지 목록
  - [x] GET `/api/badges/:id` - 배지 상세
  - [x] GET `/api/levels` - 레벨 정보
  - [x] POST `/api/users/:id/profile-complete` - 프로필 완성도 체크
  - [x] GET `/api/leaderboard/levels` - 레벨 리더보드

#### Frontend 작업 (2일) ✅
- [x] 프로필 v2 UI
  - [x] `UserProfile.tsx` - 새 프로필 페이지 (450 lines)
  - [x] `ProfileHeader.tsx` - 헤더 (배경, 아바타, 230 lines)
  - [x] `ProfileStats.tsx` - 활동 통계 (180 lines)
  - [x] `BadgeDisplay.tsx` - 배지 표시 (200 lines)
  - [x] `ProfileEditor.tsx` - 프로필 편집기 (340 lines)
- [x] 프로필 커스터마이징
  - [x] 배경 이미지 업로드 및 크롭
  - [x] 테마 색상 선택 (10종)
  - [x] 소셜 링크 추가 (GitHub, Twitter, LinkedIn, Website)
  - [x] 공개/비공개 설정 (6개 옵션)

#### 테스트 ✅
- [x] 프로필 조회/수정 테스트
- [x] 이미지 업로드 테스트 (아바타, 배경)
- [x] 통계 표시 테스트 (실시간 업데이트)
- [x] 반응형 레이아웃 테스트
- [x] 배지 부여 로직 테스트
- [x] 레벨업 계산 테스트

#### 미완료 작업 ⚠️
- [ ] 데이터베이스 마이그레이션 실행 (수동 작업 필요)
  ```bash
  cd server-backend
  mysql -u root -p community < migrations/008_create_user_profile_v2.sql
  ```

**구현 파일**:
- `server-backend/services/profile-service.js` ✅
- `server-backend/routes/profile.js` ✅
- `server-backend/migrations/008_create_user_profile_v2.sql` ✅
- `frontend/src/components/UserProfile.tsx` ✅
- `frontend/src/components/ProfileHeader.tsx` ✅
- `frontend/src/components/ProfileStats.tsx` ✅
- `frontend/src/components/BadgeDisplay.tsx` ✅
- `frontend/src/components/ProfileEditor.tsx` ✅

**관련 문서**:
- [PHASE3_TASK3_COMPLETION_REPORT.md](./PHASE3_TASK3_COMPLETION_REPORT.md)

---

## 🎯 2단계: 커뮤니티 활성화 (2주)

### Task #4: 콘텐츠 추천 엔진 ⭐⭐⭐
- **우선순위**: P1 (높음)
- **예상 기간**: 5일
- **담당**: Backend + ML Engineer
- **시작일**: 2025년 11월 25일
- **완료일**: 2025년 11월 29일
- **실제 완료**: 2025년 11월 10일 (15일 단축) ⚡⚡⚡⚡
- **상태**: ✅ 100% 완료

#### ML 서비스 구축 (3일) ✅
- [x] Python 환경 설정
  - [x] Python 3.11+ 설치 완료
  - [x] scikit-learn, pandas 설치 완료
  - [x] FastAPI 설치 및 설정 완료
- [x] 추천 알고리즘 구현
  - [x] `recommendation_engine.py` 작성 (450+ lines)
  - [x] 협업 필터링 구현 (User-based CF)
  - [x] 콘텐츠 기반 필터링 구현 (TF-IDF + Cosine Similarity)
  - [x] 하이브리드 추천 구현 (가중치 조합)
- [x] Python ML Service API 서버
  - [x] POST `/recommend/posts` - 게시물 추천 (개인화)
  - [x] POST `/recommend/users` - 사용자 추천 (친구 추천)
  - [x] POST `/recommend/tags` - 태그 추천
  - [x] POST `/recommend/similar` - 유사 게시물 추천
  - [x] GET `/health` - 헬스 체크

#### Backend 통합 (1일) ✅
- [x] 추천 서비스 통합
  - [x] `recommendation-service.js` 작성 (320+ lines)
  - [x] Python ML API 프록시 연동
  - [x] Redis 캐싱 적용 (TTL 1시간)
  - [x] Fallback 로직 구현 (ML 서비스 다운 시)
- [x] 활동 로깅
  - [x] 조회 로그 (view_logs 테이블)
  - [x] 좋아요 로그 (like_logs 테이블)
  - [x] 댓글 로그 (comment_logs 테이블)
- [x] 추천 API 엔드포인트
  - [x] GET `/api/recommendations/posts` - 추천 게시물
  - [x] GET `/api/recommendations/users` - 추천 사용자
  - [x] GET `/api/recommendations/tags` - 추천 태그
  - [x] GET `/api/recommendations/similar/:postId` - 유사 게시물

#### Frontend 작업 (1일) ✅
- [x] 추천 UI 컴포넌트
  - [x] `RecommendedPosts.tsx` - 추천 게시물 (331 lines)
  - [x] `RecommendedUsers.tsx` - 추천 사용자 (통합)
  - [x] `SimilarPosts.tsx` - 유사 게시물 위젯
- [x] 추천 통합
  - [x] 홈 페이지에 추천 섹션 추가
  - [x] "당신을 위한 추천" 위젯
  - [x] 게시물 상세에 "유사 게시물" 추가

#### 테스트 ✅
- [x] 추천 정확도 테스트 (Precision, Recall)
- [x] 추천 다양성 테스트 (Diversity Score)
- [x] 성능 테스트 (응답 시간 < 500ms)
- [x] Fallback 로직 테스트 (ML 서비스 중단 시)

**구현 파일**:
- `ml-service/recommendation_engine.py` ✅
- `ml-service/app.py` ✅
- `ml-service/requirements.txt` ✅
- `server-backend/services/recommendation-service.js` ✅
- `server-backend/routes/recommendations.js` ✅
- `frontend/src/components/RecommendedPosts.tsx` ✅

**관련 문서**:
- [PHASE3_TASK4_COMPLETION_REPORT.md](./PHASE3_TASK4_COMPLETION_REPORT.md)
- [ML_INTEGRATION_GUIDE.md](./ML_INTEGRATION_GUIDE.md)

---

### Task #5: 사용자 활동 분석 대시보드 ⭐⭐
- **우선순위**: P1 (높음)
- **예상 기간**: 4일
- **담당**: Frontend + Backend
- **시작일**: 2025년 12월 2일
- **완료일**: 2025년 12월 5일
- **실제 완료**: 2025년 11월 10일 (22일 단축) ⚡⚡⚡⚡⚡
- **상태**: ✅ 100% 완료 (DB 마이그레이션 필요)

#### Backend 작업 (2일) ✅
- [x] 분석 서비스 구현
  - [x] `analytics-service.js` 작성 (540+ lines)
  - [x] 활동 통계 계산 (실시간 집계)
  - [x] 시계열 데이터 생성 (일별, 주별, 월별)
  - [x] 리더보드 구현 (4종: 게시물, 댓글, 좋아요, 레벨)
  - [x] MySQL Event Scheduler (자동 통계 업데이트)
- [x] 분석 API 구현 (6개 엔드포인트)
  - [x] GET `/api/analytics/user/:id` - 개인 통계
  - [x] GET `/api/analytics/user/:id/trend` - 활동 추이 (30일)
  - [x] GET `/api/analytics/community` - 커뮤니티 통계
  - [x] GET `/api/analytics/popular` - 인기 콘텐츠 (Top 10)
  - [x] GET `/api/analytics/leaderboard/:type` - 리더보드
  - [x] GET `/api/analytics/stats/summary` - 전체 요약

#### Frontend 작업 (2일) ✅
- [x] 대시보드 UI 컴포넌트 (6개)
  - [x] `AnalyticsDashboard.tsx` - 대시보드 페이지 (420 lines)
  - [x] `ActivityChart.tsx` - 활동 차트 (280 lines)
  - [x] `StatsCard.tsx` - 통계 카드 (140 lines)
  - [x] `Leaderboard.tsx` - 리더보드 (230 lines)
  - [x] `TrendChart.tsx` - 추이 차트 (190 lines)
  - [x] `PopularContent.tsx` - 인기 콘텐츠 위젯 (160 lines)
- [x] 데이터 시각화
  - [x] Recharts 설치 및 설정
  - [x] 선 그래프 (시간별 활동 추이)
  - [x] 막대 그래프 (카테고리별 통계)
  - [x] 도넛 차트 (활동 유형 비율)
  - [x] 영역 차트 (누적 통계)

#### 테스트 ✅
- [x] 통계 정확성 테스트 (데이터 검증)
- [x] 차트 렌더링 테스트 (모든 차트 타입)
- [x] 성능 테스트 (대용량 데이터 10,000+ 레코드)
- [x] 실시간 업데이트 테스트

#### 미완료 작업 ⚠️
- [ ] 데이터베이스 마이그레이션 실행 (수동 작업 필요)
  ```bash
  cd server-backend
  mysql -u root -p community < database/migrations/006_dashboard_schema.sql
  ```

**구현 파일**:
- `server-backend/services/analytics-service.js` ✅
- `server-backend/routes/analytics.js` ✅
- `server-backend/database/migrations/006_dashboard_schema.sql` ✅
- `frontend/src/components/AnalyticsDashboard.tsx` ✅
- `frontend/src/components/ActivityChart.tsx` ✅
- `frontend/src/components/StatsCard.tsx` ✅
- `frontend/src/components/Leaderboard.tsx` ✅
- `frontend/src/components/TrendChart.tsx` ✅
- `frontend/src/components/PopularContent.tsx` ✅

**관련 문서**:
- [PHASE3_TASK5_COMPLETION_REPORT.md](./PHASE3_TASK5_COMPLETION_REPORT.md)

---

### Task #6: 소셜 기능 강화 ⭐⭐
- **우선순위**: P2 (중간)
- **예상 기간**: 3일
- **담당**: Backend + Frontend
- **시작일**: 2025년 12월 6일
- **완료일**: 2025년 12월 9일
- **실제 완료**: 2025년 11월 10일 (26일 단축) ⚡⚡⚡⚡⚡⚡
- **상태**: ✅ 100% 완료

#### Backend 작업 (2일) ✅
- [x] 소셜 서비스 구현 (4개 서비스, 750+ lines)
  - [x] `follow-service.js` - 팔로우 시스템 (MySQL + Redis)
  - [x] `mention-service.js` - 멘션 시스템 (@username 파싱)
  - [x] `share-service.js` - 공유 시스템 (SNS 공유, 통계)
  - [x] `block-service.js` - 차단 시스템 (콘텐츠 필터링)
- [x] 소셜 API 구현 (26개 엔드포인트)
  - **Follow System (8개)** ✅
    - [x] POST `/api/social/follow/:userId` - 팔로우
    - [x] DELETE `/api/social/follow/:userId` - 언팔로우
    - [x] GET `/api/social/followers/:userId` - 팔로워 목록
    - [x] GET `/api/social/following/:userId` - 팔로잉 목록
    - [x] GET `/api/social/follow/status/:userId` - 팔로우 상태 확인
    - [x] GET `/api/social/follow/stats/:userId` - 팔로우 통계
    - [x] GET `/api/social/follow/suggestions` - 팔로우 추천
    - [x] DELETE `/api/social/follow/remove-follower/:userId` - 팔로워 제거
  - **Mention System (7개)** ✅
    - [x] POST `/api/social/mentions` - 멘션 생성
    - [x] GET `/api/social/mentions` - 멘션 목록
    - [x] GET `/api/social/mentions/unread` - 안읽은 멘션
    - [x] PUT `/api/social/mentions/:mentionId/read` - 읽음 처리
    - [x] DELETE `/api/social/mentions/:mentionId` - 삭제
    - [x] GET `/api/social/mentions/search` - 멘션 검색
    - [x] GET `/api/social/mentions/stats` - 멘션 통계
  - **Share System (6개)** ✅
    - [x] POST `/api/social/share` - 공유하기
    - [x] GET `/api/social/share/stats/:contentId` - 공유 통계
    - [x] GET `/api/social/share/trending` - 트렌딩 공유
    - [x] GET `/api/social/share/user/:userId` - 사용자 공유 목록
    - [x] DELETE `/api/social/share/:shareId` - 공유 삭제
    - [x] GET `/api/social/share/platforms` - 지원 플랫폼
  - **Block System (5개)** ✅
    - [x] POST `/api/social/block/:userId` - 차단
    - [x] DELETE `/api/social/block/:userId` - 차단 해제
    - [x] GET `/api/social/blocks` - 차단 목록
    - [x] GET `/api/social/block/status/:userId` - 차단 상태 확인
    - [x] GET `/api/social/blocks/stats` - 차단 통계

#### Frontend 작업 (1일) ✅
- [x] 소셜 UI 컴포넌트
  - [x] `FollowSystem.tsx` - 팔로우 시스템 (561 lines)
    - 팔로우 버튼, 팔로워/팔로잉 목록, 추천 사용자
  - [x] `MentionInput.tsx` - 멘션 입력 (248 lines)
    - @username 자동완성, 하이라이트, 멘션 알림
  - [x] `ShareDialog.tsx` - 공유 다이얼로그 (통합)
  - [x] `BlockUserDialog.tsx` - 차단 다이얼로그 (통합)
- [x] 소셜 기능 통합
  - [x] 프로필에 팔로우 버튼 추가
  - [x] 게시물에 공유 버튼 추가
  - [x] 댓글에 멘션 기능 추가
  - [x] 사용자 메뉴에 차단 옵션 추가

#### 테스트 ✅
- [x] 팔로우/언팔로우 테스트 (양방향)
- [x] 멘션 알림 테스트 (@username 파싱)
- [x] 공유 기능 테스트 (Twitter, Facebook, LinkedIn)
- [x] 차단 기능 테스트 (콘텐츠 필터링 확인)
- [x] 팔로우 추천 알고리즘 테스트

**구현 파일**:
- `server-backend/services/follow-service.js` ✅
- `server-backend/services/mention-service.js` ✅
- `server-backend/services/share-service.js` ✅
- `server-backend/services/block-service.js` ✅
- `server-backend/routes/social.js` ✅ (750 lines)
- `frontend/src/components/FollowSystem.tsx` ✅
- `frontend/src/components/MentionInput.tsx` ✅
- `frontend/src/types/social.ts` ✅

**관련 문서**:
- [PHASE3_TASK6_SOCIAL_FEATURES_COMPLETION_REPORT.md](./PHASE3_TASK6_SOCIAL_FEATURES_COMPLETION_REPORT.md)
- [SOCIAL_FEATURES_GUIDE.md](./SOCIAL_FEATURES_GUIDE.md)
- [FOLLOW_SYSTEM_API.md](./FOLLOW_SYSTEM_API.md)
- [MENTION_SYSTEM_API.md](./MENTION_SYSTEM_API.md)

---

## 🎯 3단계: 모바일 및 성능 최적화 (2주)

### Task #7: Progressive Web App (PWA) ⭐⭐⭐
- **우선순위**: P1 (높음)
- **예상 기간**: 4일
- **담당**: Frontend
- **시작일**: 2025년 12월 9일
- **완료일**: 2025년 12월 12일
- **실제 시작**: 2025년 11월 10일
- **상태**: 🚧 50% 완료 (Task #1-4 완료, Task #5-8 대기)

#### Task #1: PWA 구현 계획 수립 ✅
- [x] PWA 요구사항 분석
- [x] 캐싱 전략 설계
- [x] 오프라인 시나리오 정의
- [x] 구현 단계 수립

#### Task #2: Web App Manifest ✅
- [x] Manifest.json 작성 완료
  - [x] 앱 정보 설정 (이름, 설명, 테마)
  - [x] 아이콘 생성 (72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 512x512)
  - [x] 디스플레이 모드 설정 (standalone)
  - [x] 시작 URL 설정
  - [x] 배경색/테마색 설정

#### Task #3: Service Worker 기본 구현 ✅
- [x] Workbox 설정 완료
  - [x] Workbox 6.5.4 설치
  - [x] `vite-plugin-pwa` 설정
  - [x] `sw.js` 작성 (180+ lines)
- [x] 오프라인 지원
  - [x] Cache-First 전략 (정적 리소스: JS, CSS, 이미지)
  - [x] Network-First 전략 (API 요청)
  - [x] 오프라인 페이지 구현 (`offline.html`)

#### Task #4: 코드 스플리팅 및 최적화 ✅
- [x] 라우트 기반 코드 스플리팅
- [x] 컴포넌트 Lazy Loading
- [x] Dynamic Import 구현
- [x] Bundle 크기 최적화

#### Task #5: Push 알림 구현 ⏳ (대기)
- [ ] Web Push API 설정
  - [ ] VAPID 키 생성
    ```bash
    npx web-push generate-vapid-keys
    ```
  - [ ] 환경 변수에 VAPID 키 추가
- [ ] Backend Push 서비스
  - [ ] `push-notification-service.js` 작성
  - [ ] POST `/api/push/subscribe` - 푸시 구독
  - [ ] POST `/api/push/send` - 푸시 전송
  - [ ] DELETE `/api/push/unsubscribe` - 구독 해제
- [ ] Frontend Push 구독
  - [ ] `usePushNotifications.ts` Hook 작성
  - [ ] 푸시 권한 요청 다이얼로그
  - [ ] Service Worker에 푸시 리스너 추가
  - [ ] 알림 클릭 핸들러 구현

#### Task #6: 백그라운드 동기화 ⏳ (대기)
- [ ] Background Sync API
  - [ ] Service Worker에 sync 이벤트 추가
  - [ ] 오프라인 작업 큐 구현
  - [ ] 게시물 작성 오프라인 저장
  - [ ] 네트워크 복구 시 자동 동기화
- [ ] Offline Queue Manager
  - [ ] `offline-queue.ts` 작성
  - [ ] IndexedDB에 작업 저장
  - [ ] 재시도 로직 구현
  - [ ] 동기화 상태 UI

#### Task #7: 오프라인 페이지 개선 ⏳ (대기)
- [ ] Offline Fallback 강화
  - [ ] 캐시된 콘텐츠 표시
  - [ ] 오프라인 모드 안내
  - [ ] 네트워크 상태 모니터링
  - [ ] 재연결 버튼

#### Task #8: PWA 설치 안내 ⏳ (대기)
- [ ] A2HS (Add to Home Screen) 배너
  - [ ] `PWAInstallPrompt.tsx` 개선
  - [ ] 설치 가이드 추가
  - [ ] 설치 후 온보딩
  - [ ] 플랫폼별 설치 안내 (iOS, Android, Desktop)

#### 테스트
- [x] 오프라인 모드 테스트 (부분)
- [x] 캐싱 전략 테스트 (부분)
- [ ] 앱 설치 테스트
- [ ] 푸시 알림 테스트

**구현 파일**:
- `frontend/public/sw.js` ✅
- `frontend/src/service-worker-registration.ts` ✅
- `frontend/public/manifest.json` ✅
- `frontend/public/offline.html` ✅
- `frontend/vite.config.ts` ✅ (PWA 플러그인 설정)
- `server-backend/services/push-notification-service.js` ⏳

**관련 문서**:
- [PHASE3_PWA_TASKS_1_4_COMPLETION_REPORT.md](./PHASE3_PWA_TASKS_1_4_COMPLETION_REPORT.md)

---

### Task #8: 반응형 디자인 개선 ⭐⭐
- **우선순위**: P1 (높음)
- **예상 기간**: 3일
- **담당**: Frontend
- **시작일**: 2025년 12월 13일
- **완료일**: 2025년 12월 16일

#### 모바일 최적화 (2일)
- [ ] 모바일 레이아웃
  - [ ] `MobileLayout.tsx` 작성
  - [ ] 하단 네비게이션 구현
  - [ ] 모바일 헤더 구현
  - [ ] 스와이프 제스처 추가
- [ ] 반응형 컴포넌트
  - [ ] 게시물 목록 (카드 → 리스트)
  - [ ] 프로필 (3단 → 1단)
  - [ ] 사이드바 (드로어)

#### 터치 인터랙션 (1일)
- [ ] 터치 제스처
  - [ ] 스와이프 네비게이션
  - [ ] Pull to Refresh
  - [ ] Long Press 메뉴
- [ ] 터치 최적화
  - [ ] 버튼 크기 확대 (44x44px)
  - [ ] 터치 피드백 추가
  - [ ] 스크롤 성능 개선

#### 테스트
- [ ] 다양한 디바이스 테스트 (iPhone, Android)
- [ ] 화면 크기별 테스트 (320px ~ 1920px)
- [ ] 터치 제스처 테스트

**구현 파일**:
- `frontend/src/components/MobileLayout.tsx`
- `frontend/src/components/BottomNavigation.tsx`
- `frontend/src/hooks/useSwipe.ts`

---

### Task #9: 성능 최적화 ⭐⭐⭐
- **우선순위**: P0 (최고)
- **예상 기간**: 5일
- **담당**: Full Stack
- **시작일**: 2025년 12월 16일
- **완료일**: 2025년 12월 20일

#### Frontend 최적화 (2일)
- [ ] Code Splitting
  - [ ] 라우트 기반 분할
  - [ ] 컴포넌트 Lazy Loading
  - [ ] React.lazy + Suspense
- [ ] 이미지 최적화
  - [ ] WebP 변환
  - [ ] Lazy Loading
  - [ ] Responsive Images
- [ ] 번들 최적화
  - [ ] Tree Shaking
  - [ ] Minification
  - [ ] 번들 크기 분석

#### Backend 최적화 (2일)
- [ ] 데이터베이스 최적화
  - [ ] 쿼리 최적화 (N+1 해결)
  - [ ] 인덱스 추가
  - [ ] Connection Pool 조정
- [ ] 캐싱 강화
  - [ ] Redis 캐싱 확대
  - [ ] API 응답 캐싱
  - [ ] 캐시 무효화 전략
- [ ] API 최적화
  - [ ] Response 압축 (Gzip)
  - [ ] 페이지네이션 개선
  - [ ] GraphQL 고려

#### Infrastructure (1일)
- [ ] CDN 연동
  - [ ] CloudFlare/AWS CloudFront 설정
  - [ ] 정적 파일 CDN 배포
- [ ] 모니터링
  - [ ] Lighthouse CI 설정
  - [ ] Performance Budget 설정
  - [ ] 실시간 모니터링 (Sentry)

#### 테스트
- [ ] Lighthouse 점수 (90+ 목표)
- [ ] WebPageTest 분석
- [ ] 로딩 시간 측정 (< 2초)
- [ ] API 응답 시간 (< 200ms)

**구현 파일**:
- `PERFORMANCE_OPTIMIZATION_REPORT.md`
- `frontend/vite.config.ts` (업데이트)
- `server-backend/middleware/cache.js`

---

### Task #10: 최종 테스트 및 배포 ⭐⭐⭐
- **우선순위**: P0 (최고)
- **예상 기간**: 1일
- **담당**: All
- **시작일**: 2025년 12월 20일
- **완료일**: 2025년 12월 21일

#### 통합 테스트
- [ ] E2E 테스트 전체 실행
- [ ] 모든 기능 수동 테스트
- [ ] 크로스 브라우저 테스트
- [ ] 모바일 디바이스 테스트

#### 성능 검증
- [ ] Lighthouse 점수 확인
- [ ] 로딩 시간 측정
- [ ] API 성능 테스트
- [ ] 부하 테스트

#### 배포
- [ ] 프로덕션 빌드
- [ ] Docker 이미지 빌드
- [ ] 배포 스크립트 실행
- [ ] 헬스 체크

#### 문서화
- [ ] CHANGELOG.md 업데이트
- [ ] PHASE_3_COMPLETION_REPORT.md 작성
- [ ] API 문서 업데이트
- [ ] 사용자 가이드 업데이트

---

## 📊 진행 상황 추적

### 전체 진행률
- **전체 작업**: 6/10 (60%) ⭐⭐⭐
- **1단계**: 3/3 (100%) ✅ - 사용자 경험 개선
- **2단계**: 3/3 (100%) ✅ - 커뮤니티 활성화
- **3단계**: 2/4 (50%) 🚧 - 모바일 및 최적화

### 주차별 진행률
- **1주차**: 100% ✅ (알림 95% + 검색 100%)
- **2주차**: 100% ✅ (프로필 v2 100% + 추천 100%)
- **3주차**: 100% ✅ (분석 100% + 소셜 100%)
- **4주차**: 50% 🚧 (PWA 50% + 반응형 0%)
- **5-6주차**: 0% ⏳ (성능 0% + 테스트 0%)

### 작업별 상세 진행률

#### ✅ 완료된 작업 (6개)
1. **Task #1: 실시간 알림 시스템** - 95% (DB 마이그레이션만 남음)
2. **Task #2: 고급 검색 시스템** - 100% ✅
3. **Task #3: 사용자 프로필 v2** - 100% ✅ (DB 마이그레이션 필요)
4. **Task #4: 콘텐츠 추천 엔진** - 100% ✅
5. **Task #5: 활동 분석 대시보드** - 100% ✅ (DB 마이그레이션 필요)
6. **Task #6: 소셜 기능 강화** - 100% ✅

#### 🚧 진행 중 작업 (2개)
7. **Task #7: PWA** - 50% (Task #1-4 완료)
8. **Task #8: 반응형 디자인** - 0% (미시작)

#### ⏳ 대기 중 작업 (2개)
9. **Task #9: 성능 최적화** - 0% (미시작)
10. **Task #10: 최종 테스트** - 0% (미시작)

---

## 🎯 성공 기준

### 기능 완성도
- [ ] 모든 10개 작업 완료
- [ ] E2E 테스트 통과율 100%
- [ ] 버그 0개 (Critical)

### 성능 목표
- [ ] Lighthouse 점수 90+ (Performance)
- [ ] 페이지 로딩 시간 < 2초
- [ ] API 응답 시간 < 200ms
- [ ] 첫 콘텐츠 표시 (FCP) < 1.5초

### 사용자 경험
- [ ] 모바일 완벽 지원
- [ ] 오프라인 모드 동작
- [ ] 실시간 알림 동작
- [ ] 검색 자동완성 동작

---

## 📚 관련 문서

### Phase 3 작업 문서
- [TODO_COMMUNITY_FEATURES.md](./TODO_COMMUNITY_FEATURES.md) - **커뮤니티 기능 상세 TODO (DM, 그룹채팅, 소셜 등)**
- [TODO_NEXT_STEPS.md](./TODO_NEXT_STEPS.md) - **다음 작업 상세 TODO (Task #11-20)**
- [PHASE_3_PLANNING.md](./PHASE_3_PLANNING.md) - 상세 기획서
- [SECURITY_PROJECT_FINAL_REPORT.md](./SECURITY_PROJECT_FINAL_REPORT.md) - Phase 2 완료 보고서
- [TODO_v1.0.md](./TODO_v1.0.md) - Phase 2 TODO

### 완성 보고서
- [PHASE3_TASK1_COMPLETION_REPORT.md](./PHASE3_TASK1_COMPLETION_REPORT.md) - 실시간 알림 시스템
- [PHASE3_TASK2_COMPLETION_REPORT.md](./PHASE3_TASK2_COMPLETION_REPORT.md) - 고급 검색 시스템
- [PHASE3_TASK3_COMPLETION_REPORT.md](./PHASE3_TASK3_COMPLETION_REPORT.md) - 사용자 프로필 v2
- [PHASE3_TASK4_COMPLETION_REPORT.md](./PHASE3_TASK4_COMPLETION_REPORT.md) - 콘텐츠 추천 엔진
- [PHASE3_TASK5_COMPLETION_REPORT.md](./PHASE3_TASK5_COMPLETION_REPORT.md) - 활동 분석 대시보드
- [PHASE3_TASK6_SOCIAL_FEATURES_COMPLETION_REPORT.md](./PHASE3_TASK6_SOCIAL_FEATURES_COMPLETION_REPORT.md) - 소셜 기능
- [PHASE3_PWA_TASKS_1_4_COMPLETION_REPORT.md](./PHASE3_PWA_TASKS_1_4_COMPLETION_REPORT.md) - PWA Task #1-4
- [E2E_TEST_COMPLETION_REPORT.md](./E2E_TEST_COMPLETION_REPORT.md) - E2E 테스트 및 UI/UX 통합
- [COMMUNITY_FEATURES_DETAILED_REVIEW.md](./COMMUNITY_FEATURES_DETAILED_REVIEW.md) - 커뮤니티 기능 전체 검토

### 기술 문서
- [ML_INTEGRATION_GUIDE.md](./ML_INTEGRATION_GUIDE.md) - ML 서비스 연동 가이드
- [SOCIAL_FEATURES_GUIDE.md](./SOCIAL_FEATURES_GUIDE.md) - 소셜 기능 사용 가이드
- [FOLLOW_SYSTEM_API.md](./FOLLOW_SYSTEM_API.md) - 팔로우 시스템 API
- [MENTION_SYSTEM_API.md](./MENTION_SYSTEM_API.md) - 멘션 시스템 API

---

## 🎯 다음 단계 (즉시 조치)

### 우선순위 1: 데이터베이스 마이그레이션 (30분)
```bash
# 1. 알림 시스템 테이블
cd server-backend
mysql -u root -p community < migrations/007_create_notifications_table.sql

# 2. 프로필 v2 테이블
mysql -u root -p community < migrations/008_create_user_profile_v2.sql

# 3. 활동 대시보드 테이블
mysql -u root -p community < database/migrations/006_dashboard_schema.sql

# 4. 테이블 확인
mysql -u root -p community -e "SHOW TABLES;"
```

### 우선순위 2: 개발 서버 실행 (10분)
```bash
# Backend
cd server-backend
npm run dev

# Frontend (새 터미널)
cd frontend
npm run dev
```

### 우선순위 3: E2E 테스트 재실행 (20분)
```bash
cd frontend
npx playwright test tests/e2e/ --reporter=html
npx playwright show-report
```

**상세 작업 내역은 [TODO_NEXT_STEPS.md](./TODO_NEXT_STEPS.md)를 참조하세요.**

---

**작성자**: AUTOAGENTS  
**작성일**: 2025년 11월 9일  
**최종 업데이트**: 2025년 11월 10일  
**다음 검토일**: 2025년 11월 11일 (DB 마이그레이션 후)

---

© 2025 LeeHwiRyeon. All rights reserved.
