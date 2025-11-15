# 📋 다음 작업 TODO 리스트

> ⚠️ **중요**: 이 문서는 `TODO_MASTER.md`로 통합되었습니다.  
> 모든 작업 내역은 [TODO_MASTER.md](./TODO_MASTER.md)를 참조하세요.

**버전**: 2.0.0  
**작성일**: 2025년 11월 10일  
**통합일**: 2025년 11월 10일  
**상태**: 🔗 통합됨 → [TODO_MASTER.md](./TODO_MASTER.md)

---

## 🎯 전체 진행 상황

### Phase 3 현황
- **완료**: 6/10 (60%) ⭐⭐⭐
- **진행 중**: 2/10 (20%)
- **대기**: 2/10 (20%)

### 다음 단계 우선순위
1. **즉시 실행** (Priority 1) - 1일
2. **단기 작업** (Priority 2) - 1주
3. **중기 작업** (Priority 3) - 1주

---

## 🚀 Priority 1: 즉시 실행 (1일)

### Task #11: 데이터베이스 마이그레이션 실행 ⚡
- **우선순위**: P0 (최고)
- **예상 기간**: 30분
- **담당**: Backend
- **시작일**: 2025년 11월 10일
- **완료일**: 2025년 11월 10일

#### 작업 내용
- [ ] **알림 시스템 테이블 생성**
  ```bash
  cd server-backend
  mysql -u root -p community < migrations/2025-11-10-notifications.sql
  ```
  - `notifications` 테이블 (알림 데이터)
  - `notification_settings` 테이블 (사용자별 알림 설정)

- [ ] **프로필 v2 테이블 생성**
  ```bash
  mysql -u root -p community < migrations/2025-11-10-profile-v2.sql
  ```
  - `user_profiles_extended` 테이블 (확장 프로필 정보)
  - `user_badges` 테이블 (배지 시스템)
  - `user_achievements` 테이블 (업적 시스템)
  - `user_statistics` 테이블 (활동 통계)
  - `user_level_history` 테이블 (레벨 이력)

- [ ] **활동 대시보드 테이블 생성**
  ```bash
  mysql -u root -p community < migrations/2025-11-10-dashboard.sql
  ```
  - `user_activity_logs` 테이블 (활동 로그)
  - `daily_statistics` 테이블 (일별 통계)
  - `community_statistics` 테이블 (커뮤니티 통계)
  - `activity_summary` View (통계 집계 뷰)
  - `update_daily_stats` Event (자동 통계 업데이트)

#### 검증
- [ ] 테이블 생성 확인
  ```sql
  SHOW TABLES LIKE '%notification%';
  SHOW TABLES LIKE '%profile%';
  SHOW TABLES LIKE '%activity%';
  SHOW TABLES LIKE '%statistics%';
  ```

- [ ] 인덱스 확인
  ```sql
  SHOW INDEX FROM notifications;
  SHOW INDEX FROM user_badges;
  SHOW INDEX FROM user_activity_logs;
  ```

- [ ] 트리거 및 이벤트 확인
  ```sql
  SHOW TRIGGERS;
  SHOW EVENTS;
  ```

---

### Task #12: 개발 서버 실행 및 E2E 테스트 ⚡
- **우선순위**: P0 (최고)
- **예상 기간**: 1시간
- **담당**: Full Stack
- **시작일**: 2025년 11월 10일
- **완료일**: 2025년 11월 10일

#### Backend 서버 실행
- [ ] **MySQL 서버 시작**
  ```bash
  # Windows
  net start MySQL80
  
  # macOS/Linux
  sudo systemctl start mysql
  ```

- [ ] **Redis 서버 시작** (선택적)
  ```bash
  # Windows (Docker)
  docker run -d -p 6379:6379 redis:alpine
  
  # macOS
  brew services start redis
  ```

- [ ] **Backend 서버 실행**
  ```bash
  cd server-backend
  npm install
  npm run dev
  ```
  - 포트: 3000
  - 로그 확인: Socket.IO, Notifications, Search, ML Proxy

#### Frontend 서버 실행
- [ ] **Frontend 개발 서버 실행**
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
  - 포트: 5173
  - HMR 확인

#### E2E 테스트 실행
- [ ] **전체 E2E 테스트 실행**
  ```bash
  cd frontend
  npx playwright test tests/e2e/ --reporter=html
  ```
  - 목표: 97개 테스트 중 90개 이상 통과 (93%+)
  - 현재: 15개 통과 (15.5%)

- [ ] **신규 E2E 테스트 개별 확인**
  ```bash
  npx playwright test tests/e2e/notification.spec.ts
  npx playwright test tests/e2e/search.spec.ts
  npx playwright test tests/e2e/profile-v2.spec.ts
  npx playwright test tests/e2e/dashboard.spec.ts
  npx playwright test tests/e2e/recommendation.spec.ts
  ```

- [ ] **HTML 리포트 확인**
  ```bash
  npx playwright show-report
  ```

#### 문제 해결
- [ ] 실패한 테스트 분석
- [ ] 타임아웃 조정 (필요 시)
- [ ] API 응답 지연 확인
- [ ] WebSocket 연결 확인

---

### Task #13: 환경 변수 및 설정 검증 ⚡
- **우선순위**: P0 (최고)
- **예상 기간**: 30분
- **담당**: DevOps
- **시작일**: 2025년 11월 10일
- **완료일**: 2025년 11월 10일

#### Backend 환경 변수
- [ ] **.env 파일 생성 및 검증**
  ```bash
  cd server-backend
  cp .env.example .env
  ```

- [ ] **필수 환경 변수 확인**
  ```env
  # JWT
  JWT_SECRET=<64-byte-base64-secret>
  JWT_REFRESH_SECRET=<64-byte-base64-secret>
  
  # Database
  DB_HOST=localhost
  DB_PORT=3306
  DB_USER=root
  DB_PASSWORD=<your-password>
  DB_NAME=community
  
  # Redis (선택적)
  REDIS_HOST=localhost
  REDIS_PORT=6379
  
  # ML Service
  ML_SERVICE_URL=http://localhost:8000
  ML_API_KEY=<your-ml-api-key>
  
  # Server
  PORT=3000
  NODE_ENV=development
  ```

- [ ] **JWT Secret 생성 (강력한)**
  ```bash
  node server-backend/scripts/generate-jwt-secret.js
  ```

- [ ] **환경 변수 검증 스크립트 실행**
  ```bash
  node server-backend/src/startup-checks.js
  ```

#### Frontend 환경 변수
- [ ] **.env 파일 생성**
  ```bash
  cd frontend
  cp .env.example .env
  ```

- [ ] **환경 변수 확인**
  ```env
  VITE_API_BASE_URL=http://localhost:3000/api
  VITE_WS_URL=http://localhost:3000
  VITE_APP_NAME=Community Platform
  ```

---

## 📅 Priority 2: 단기 작업 (1주)

### Task #14: PWA 구현 완료 (Task #5-8) 🔥
- **우선순위**: P1 (높음)
- **예상 기간**: 3일
- **담당**: Frontend
- **시작일**: 2025년 11월 11일
- **완료일**: 2025년 11월 13일
- **현재 진행률**: 50% (Task #1-4 완료)

#### Task #5: Push 알림 구현 (1일)
- [ ] **Web Push API 설정**
  - [ ] VAPID 키 생성
    ```bash
    npx web-push generate-vapid-keys
    ```
  - [ ] 환경 변수에 VAPID 키 추가

- [ ] **Backend Push 서비스**
  - [ ] `push-notification-service.js` 작성
  - [ ] POST `/api/push/subscribe` - 구독 등록
  - [ ] POST `/api/push/send` - 푸시 전송
  - [ ] DELETE `/api/push/unsubscribe` - 구독 해제

- [ ] **Frontend Push 구독**
  - [ ] `usePushNotifications.ts` Hook 작성
  - [ ] 푸시 권한 요청 다이얼로그
  - [ ] Service Worker에 푸시 리스너 추가
  - [ ] 알림 클릭 핸들러 구현

#### Task #6: 백그라운드 동기화 (1일)
- [ ] **Background Sync API**
  - [ ] Service Worker에 sync 이벤트 추가
  - [ ] 오프라인 작업 큐 구현
  - [ ] 게시물 작성 오프라인 저장
  - [ ] 네트워크 복구 시 자동 동기화

- [ ] **Offline Queue Manager**
  - [ ] `offline-queue.ts` 작성
  - [ ] IndexedDB에 작업 저장
  - [ ] 재시도 로직 구현
  - [ ] 동기화 상태 UI

#### Task #7: 오프라인 페이지 개선 (0.5일)
- [ ] **Offline Fallback 강화**
  - [ ] 캐시된 콘텐츠 표시
  - [ ] 오프라인 모드 안내
  - [ ] 네트워크 상태 모니터링
  - [ ] 재연결 버튼

#### Task #8: PWA 설치 안내 (0.5일)
- [ ] **A2HS (Add to Home Screen) 배너**
  - [ ] `PWAInstallPrompt.tsx` 개선
  - [ ] 설치 가이드 추가
  - [ ] 설치 후 온보딩
  - [ ] 플랫폼별 설치 안내 (iOS, Android, Desktop)

#### 테스트
- [ ] PWA 매니페스트 검증 (Lighthouse)
- [ ] Service Worker 동작 확인
- [ ] Push 알림 테스트 (여러 브라우저)
- [ ] 오프라인 모드 테스트
- [ ] 설치 프로세스 테스트

---

### Task #15: 반응형 디자인 개선 🎨
- **우선순위**: P1 (높음)
- **예상 기간**: 3일
- **담당**: Frontend
- **시작일**: 2025년 11월 14일
- **완료일**: 2025년 11월 16일
- **현재 진행률**: 0%

#### Day 1: 모바일 레이아웃 (1일)
- [ ] **MobileLayout 컴포넌트**
  - [ ] `MobileLayout.tsx` 작성
  - [ ] 하단 네비게이션 바 구현
  - [ ] 모바일 헤더 구현 (햄버거 메뉴)
  - [ ] 사이드바 → 드로어 변환

- [ ] **반응형 그리드 시스템**
  - [ ] Breakpoints 정의 (320px, 768px, 1024px, 1440px)
  - [ ] Container 컴포넌트
  - [ ] Grid 시스템 (1, 2, 3, 4 columns)

#### Day 2: 터치 인터랙션 (1일)
- [ ] **스와이프 제스처**
  - [ ] `useSwipe.ts` Hook 작성
  - [ ] 스와이프 네비게이션 (게시물 상세)
  - [ ] 스와이프 삭제 (알림, 메시지)

- [ ] **Pull to Refresh**
  - [ ] `usePullToRefresh.ts` Hook
  - [ ] 홈 피드 새로고침
  - [ ] 알림 목록 새로고침

- [ ] **Long Press 메뉴**
  - [ ] `useLongPress.ts` Hook
  - [ ] 게시물 컨텍스트 메뉴
  - [ ] 이미지 다운로드 메뉴

#### Day 3: 터치 최적화 및 테스트 (1일)
- [ ] **터치 최적화**
  - [ ] 버튼 크기 확대 (최소 44x44px)
  - [ ] 터치 피드백 추가 (Ripple effect)
  - [ ] 스크롤 성능 개선 (CSS contain)
  - [ ] 가상 키보드 대응

- [ ] **테스트**
  - [ ] iPhone (Safari, Chrome)
  - [ ] Android (Chrome, Samsung Internet)
  - [ ] iPad (Safari)
  - [ ] 다양한 화면 크기 (320px ~ 1920px)

#### 구현 파일
- `frontend/src/components/MobileLayout.tsx`
- `frontend/src/components/BottomNavigation.tsx`
- `frontend/src/hooks/useSwipe.ts`
- `frontend/src/hooks/usePullToRefresh.ts`
- `frontend/src/hooks/useLongPress.ts`

---

### Task #16: 문서 업데이트 📚
- **우선순위**: P2 (중간)
- **예상 기간**: 1일
- **담당**: All
- **시작일**: 2025년 11월 17일
- **완료일**: 2025년 11월 17일

#### 완성 보고서 작성
- [ ] **PHASE3_PWA_COMPLETION_REPORT.md**
  - PWA Task #5-8 완성 보고서
  - Service Worker 구현 상세
  - Push 알림 가이드
  - 백그라운드 동기화 설명

- [ ] **PHASE3_RESPONSIVE_COMPLETION_REPORT.md**
  - 반응형 디자인 완성 보고서
  - 모바일 레이아웃 상세
  - 터치 인터랙션 가이드
  - 테스트 결과

#### TODO 업데이트
- [ ] **TODO_PHASE_3.md 업데이트**
  - Task #7, #8 진행률 100%로 변경
  - 미완료 작업 정리
  - 다음 단계 업데이트

- [ ] **TODO_v1.0.md 업데이트**
  - Phase 3 PWA 작업 반영
  - 반응형 디자인 작업 반영
  - 전체 진행률 업데이트

#### API 문서 업데이트
- [ ] **API_DOCUMENTATION.md**
  - Push 알림 API 추가
  - 검색 API 상세 업데이트
  - 프로필 v2 API 추가
  - 대시보드 API 추가

---

## 🎯 Priority 3: 중기 작업 (1주)

### Task #17: 성능 최적화 ⚡
- **우선순위**: P1 (높음)
- **예상 기간**: 5일
- **담당**: Full Stack
- **시작일**: 2025년 11월 18일
- **완료일**: 2025년 11월 22일

#### Day 1-2: Frontend 최적화 (2일)
- [ ] **Bundle 최적화**
  - [ ] Vite 빌드 분석 (`vite-plugin-visualizer`)
  - [ ] Tree Shaking 확인
  - [ ] 사용하지 않는 의존성 제거
  - [ ] Dynamic Import 확장

- [ ] **이미지 최적화**
  - [ ] WebP 변환 스크립트
  - [ ] 이미지 압축 (sharp)
  - [ ] Responsive Images (`srcset`)
  - [ ] 이미지 CDN 연동 준비

- [ ] **코드 스플리팅 확장**
  - [ ] 라우트 기반 분할 확대
  - [ ] 컴포넌트 Lazy Loading 확대
  - [ ] Vendor 번들 최적화 (react-vendor, mui-vendor, chart-vendor)

#### Day 3-4: Backend 최적화 (2일)
- [ ] **데이터베이스 최적화**
  - [ ] 슬로우 쿼리 분석
  - [ ] N+1 쿼리 해결
  - [ ] 인덱스 추가 (EXPLAIN 분석)
  - [ ] Connection Pool 조정 (min: 5, max: 20)

- [ ] **캐싱 강화**
  - [ ] Redis 캐싱 확대 (프로필, 통계, 검색 결과)
  - [ ] API 응답 캐싱 (`Cache-Control` 헤더)
  - [ ] 캐시 무효화 전략
  - [ ] 캐시 히트율 모니터링

- [ ] **API 최적화**
  - [ ] Response 압축 (Gzip, Brotli)
  - [ ] 페이지네이션 개선 (Cursor-based)
  - [ ] 불필요한 데이터 제거 (필드 선택)
  - [ ] Batch 요청 지원

#### Day 5: Infrastructure 및 모니터링 (1일)
- [ ] **CDN 연동 준비**
  - [ ] CloudFlare 또는 AWS CloudFront 계정 설정
  - [ ] 정적 파일 CDN 배포 스크립트
  - [ ] Cache 설정 (1년, immutable)

- [ ] **모니터링 설정**
  - [ ] Lighthouse CI 설정
  - [ ] Performance Budget 설정
    - First Contentful Paint (FCP) < 1.5s
    - Largest Contentful Paint (LCP) < 2.5s
    - Time to Interactive (TTI) < 3.0s
    - Total Blocking Time (TBT) < 300ms
  - [ ] Sentry 에러 트래킹
  - [ ] New Relic APM (선택적)

#### 성능 목표
- [ ] Lighthouse Performance 점수 90+
- [ ] 페이지 로딩 시간 < 2초
- [ ] API 응답 시간 < 200ms
- [ ] First Contentful Paint < 1.5초

---

### Task #18: 최종 테스트 및 버그 수정 🐛
- **우선순위**: P0 (최고)
- **예상 기간**: 2일
- **담당**: All
- **시작일**: 2025년 11월 23일
- **완료일**: 2025년 11월 24일

#### Day 1: 통합 테스트 (1일)
- [ ] **E2E 테스트 전체 실행**
  - [ ] 97개 테스트 모두 실행
  - [ ] 통과율 95%+ 확인
  - [ ] 실패한 테스트 수정

- [ ] **크로스 브라우저 테스트**
  - [ ] Chrome (최신)
  - [ ] Firefox (최신)
  - [ ] Safari (macOS, iOS)
  - [ ] Edge (최신)

- [ ] **모바일 디바이스 테스트**
  - [ ] iPhone (Safari, Chrome)
  - [ ] Android (Chrome, Samsung Internet)
  - [ ] iPad (Safari)

- [ ] **성능 검증**
  - [ ] Lighthouse 점수 확인 (90+)
  - [ ] WebPageTest 분석
  - [ ] 로딩 시간 측정

#### Day 2: 버그 수정 및 최종 검증 (1일)
- [ ] **발견된 버그 수정**
  - [ ] Critical 버그 0개
  - [ ] High 버그 0개
  - [ ] Medium 버그 최소화

- [ ] **보안 검증**
  - [ ] JWT 토큰 검증
  - [ ] XSS/CSRF 방어 확인
  - [ ] SQL Injection 방어 확인
  - [ ] Rate Limiting 동작 확인

- [ ] **최종 기능 체크리스트**
  - [ ] 모든 Phase 3 기능 동작 확인
  - [ ] 실시간 알림 동작
  - [ ] 검색 자동완성 동작
  - [ ] 프로필 v2 표시
  - [ ] 추천 엔진 동작
  - [ ] 대시보드 차트 표시
  - [ ] PWA 설치 가능
  - [ ] 오프라인 모드 동작

---

### Task #19: Phase 3 완료 보고서 작성 📝
- **우선순위**: P1 (높음)
- **예상 기간**: 1일
- **담당**: All
- **시작일**: 2025년 11월 25일
- **완료일**: 2025년 11월 25일

#### 보고서 작성
- [ ] **PHASE3_FINAL_REPORT.md** (~1,000 lines)
  - 개요 및 목표
  - 완료된 작업 10개 상세 요약
  - 구현 통계 (코드, 파일, 시간)
  - 성능 개선 결과 (Before/After)
  - 테스트 결과 (E2E, 성능, 크로스 브라우저)
  - 배포 체크리스트
  - 다음 단계 (Phase 4)

#### 통계 정리
- [ ] **코드 통계**
  - 총 코드 라인 수
  - 신규 파일 개수
  - 수정된 파일 개수
  - 삭제된 파일 개수

- [ ] **개발 시간 통계**
  - 각 Task별 소요 시간
  - 예상 vs 실제 비교
  - 생산성 분석

- [ ] **성능 통계**
  - Lighthouse 점수 (Before/After)
  - 로딩 시간 (Before/After)
  - API 응답 시간 (Before/After)
  - Bundle 크기 (Before/After)

---

## 🚀 Priority 4: Phase 4 준비 (선택적)

### Task #20: Phase 4 기획 및 TODO 작성 📋
- **우선순위**: P2 (중간)
- **예상 기간**: 2일
- **담당**: All
- **시작일**: 2025년 11월 26일
- **완료일**: 2025년 11월 27일

#### Phase 4 목표 정의
- [ ] **커뮤니티 관리 도구 강화**
  - 모더레이터 도구
  - 자동 모더레이션 (AI)
  - 사용자 신고 시스템

- [ ] **고급 분석 및 인사이트**
  - 사용자 행동 분석
  - A/B 테스트 프레임워크
  - 비즈니스 인텔리전스 대시보드

- [ ] **비즈니스 기능**
  - 프리미엄 멤버십
  - 광고 시스템
  - 수익화 도구

#### 문서 작성
- [ ] **PHASE_4_PLANNING.md**
  - Phase 4 상세 기획서
  - 기능 목록
  - 기술 스택
  - 일정 계획

- [ ] **TODO_PHASE_4.md**
  - Phase 4 상세 TODO (10-15개 작업)
  - 우선순위 및 일정
  - 담당자 할당

---

## 📊 전체 일정 요약

| 주차      | 날짜     | 작업                            | 상태   |
| --------- | -------- | ------------------------------- | ------ |
| **1주차** | 11/10    | Task #11-13 (즉시 실행)         | ⏳ 대기 |
| **2주차** | 11/11-17 | Task #14-16 (PWA, 반응형, 문서) | ⏳ 대기 |
| **3주차** | 11/18-24 | Task #17-18 (성능, 테스트)      | ⏳ 대기 |
| **4주차** | 11/25-27 | Task #19-20 (보고서, Phase 4)   | ⏳ 대기 |

---

## 🎯 성공 기준

### 기술 목표
- [ ] E2E 테스트 통과율 95%+ (92/97 이상)
- [ ] Lighthouse Performance 점수 90+
- [ ] 페이지 로딩 시간 < 2초
- [ ] API 응답 시간 < 200ms
- [ ] PWA 설치 가능 (모든 브라우저)

### 기능 완성도
- [ ] Phase 3 전체 10개 작업 100% 완료
- [ ] Critical 버그 0개
- [ ] High 버그 0개
- [ ] 문서화 100% 완료

### 사용자 경험
- [ ] 모바일 완벽 지원
- [ ] 오프라인 모드 동작
- [ ] 실시간 알림 동작
- [ ] 검색 자동완성 < 200ms
- [ ] 추천 엔진 정확도 확인

---

## 📚 관련 문서

### Phase 3 문서
- [TODO_PHASE_3.md](./TODO_PHASE_3.md) - Phase 3 상세 TODO
- [PHASE_3_PLANNING.md](./PHASE_3_PLANNING.md) - Phase 3 기획서
- [COMMUNITY_FEATURES_DETAILED_REVIEW.md](./COMMUNITY_FEATURES_DETAILED_REVIEW.md) - 기능 상세 검토

### 완성 보고서
- [PHASE3_TASK1_COMPLETION_REPORT.md](./PHASE3_TASK1_COMPLETION_REPORT.md) - 실시간 알림
- [PHASE3_TASK2_COMPLETION_REPORT.md](./PHASE3_TASK2_COMPLETION_REPORT.md) - 고급 검색
- [PHASE3_TASK3_COMPLETION_REPORT.md](./PHASE3_TASK3_COMPLETION_REPORT.md) - 프로필 v2
- [PHASE3_TASK4_COMPLETION_REPORT.md](./PHASE3_TASK4_COMPLETION_REPORT.md) - 추천 엔진
- [PHASE3_TASK5_COMPLETION_REPORT.md](./PHASE3_TASK5_COMPLETION_REPORT.md) - 활동 대시보드
- [PHASE3_TASK6_SOCIAL_FEATURES_COMPLETION_REPORT.md](./PHASE3_TASK6_SOCIAL_FEATURES_COMPLETION_REPORT.md) - 소셜 기능
- [PHASE3_PWA_TASKS_1_4_COMPLETION_REPORT.md](./PHASE3_PWA_TASKS_1_4_COMPLETION_REPORT.md) - PWA Task #1-4
- [E2E_TEST_COMPLETION_REPORT.md](./E2E_TEST_COMPLETION_REPORT.md) - E2E 테스트

### 기타 문서
- [TODO_v1.0.md](./TODO_v1.0.md) - 전체 프로젝트 TODO
- [FEATURES.md](./FEATURES.md) - 기능 요약
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - 배포 체크리스트

---

**작성자**: AUTOAGENTS  
**작성일**: 2025년 11월 10일  
**다음 검토일**: 2025년 11월 11일 (Task #11-13 완료 후)

---

© 2025 LeeHwiRyeon. All rights reserved.
