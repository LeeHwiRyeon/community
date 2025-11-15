# 📋 게시판 운영 테스트 TODO

**작성일**: 2025년 11월 10일  
**목표**: 게시판 핵심 기능 안정성 확보 및 지속적 테스트 자동화  
**우선순위**: P0 (최우선)

---

## 📊 개요

게시판은 커뮤니티 플랫폼의 **핵심 기능**입니다. 모든 게시판 관련 기능이 안정적으로 작동하도록 E2E 테스트를 강화하고, 지속적으로 검증하는 체계를 구축합니다.

### 목표
1. ✅ 게시판 CRUD 완전 테스트 커버리지 달성
2. ✅ 댓글/좋아요/공유 등 상호작용 기능 검증
3. ✅ 검색/필터링/정렬 기능 안정성 확보
4. ✅ 테스트 자동화 CI/CD 통합
5. ✅ 회귀 테스트 방지 시스템 구축

---

## 1️⃣ Phase 1: 기존 테스트 검증 및 강화 (1주)

### Task 1.1: 기존 E2E 테스트 실행 및 분석 ✅ 완료

**목표**: 현재 작성된 테스트가 정상 작동하는지 확인

#### 체크리스트
- [x] 개발 서버 시작 확인
  ```bash
  cd frontend
  npm run dev
  ```

- [x] Playwright 테스트 실행
  ```bash
  # 전체 테스트
  npx playwright test
  
  # 게시판 관련 테스트만
  npx playwright test tests/e2e/posts.spec.ts
  npx playwright test tests/e2e/homepage.spec.ts
  ```

- [x] 테스트 결과 분석
  - [x] 통과한 테스트 목록 작성
  - [x] 실패한 테스트 원인 파악
  - [x] 스킵된 테스트 검토

- [x] 테스트 커버리지 확인
  - [x] 게시물 CRUD: 2/12개 시나리오 (16.7%)
  - [x] 댓글 시스템: 0/5개 시나리오 (0%)
  - [x] 좋아요 시스템: 0/3개 시나리오 (0%)
  - [x] 검색/필터링: 2/4개 시나리오 (50%)

**소요 시간**: 1일  
**담당**: QA + Frontend  
**산출물**: ✅ `TEST_EXECUTION_REPORT_POSTS.md` 작성 완료

**분석 결과**:
- ✅ 통과: 2개 (게시물 정렬, 카테고리 필터링)
- ❌ 실패: 10개 (모두 로그인 실패)
- 🔴 긴급 이슈: 백엔드 API 서버 미실행
- 🔴 긴급 이슈: 로그인 페이지 선택자 문제

---

### Task 1.2: 실패 테스트 수정 🔴 진행 중

**목표**: 현재 실패하는 모든 테스트 케이스 수정

#### 현재 확인된 문제
```
TEST_EXECUTION_REPORT_POSTS.md 기반 분석:
- 실패: 10개 테스트 (모두 로그인 실패로 인한 beforeEach 훅 타임아웃)
- 통과: 2개 테스트 (게시물 정렬, 카테고리 필터링) ⚠️ 경고 있음
- 백엔드 API 서버 미실행: ECONNREFUSED at /api/*
- 로그인 페이지 선택자: input[name="username"] 찾을 수 없음 (60초 타임아웃)
```

#### 체크리스트

**1단계: 백엔드 서버 시작** 🔴 P0 (5분)
- [ ] 백엔드 디렉토리 확인
- [ ] API 서버 실행
  ```bash
  cd server-backend
  node api-server/server.js
  ```
- [ ] 서버 포트 확인 (예: 8080, 3001)
- [ ] API 헬스 체크
  ```bash
  curl http://localhost:8080/health
  ```

**2단계: 로그인 페이지 선택자 수정** 🔴 P0 (10분)
- [ ] 로그인 페이지 파일 찾기
  ```bash
  # frontend/src/pages/Login.tsx 또는
  # frontend/src/pages/Auth/Login.tsx
  ```
- [ ] HTML 구조 확인
  - [ ] `<input>` 요소의 실제 `name` 속성 값 확인
  - [ ] `data-testid` 속성 추가 권장
- [ ] 테스트 선택자 업데이트
  ```typescript
  // posts.spec.ts 수정
  await page.locator('[data-testid="login-username"]').fill('testuser');
  ```

**3단계: 테스트 재실행** (5분)
- [ ] 백엔드 + 프론트엔드 서버 실행 확인
- [ ] 테스트 실행
  ```bash
  cd frontend
  npx playwright test tests/e2e/posts.spec.ts --reporter=list
  ```
- [ ] 결과 확인
  - [ ] 10개 실패 테스트 → 통과 여부
  - [ ] 2개 경고 있는 테스트 → 경고 해결 여부

**4단계: 선택자 안정화** (30분)
- [ ] 로그인 페이지에 `data-testid` 속성 추가
  ```tsx
  <input name="username" data-testid="login-username" />
  <input name="password" data-testid="login-password" />
  <button type="submit" data-testid="login-submit" />
  ```
- [ ] posts.spec.ts 선택자 개선
  ```typescript
  // ❌ 현재 (불안정)
  await page.locator('input[name="username"]')
      .or(page.locator('input[name="email"]'))
      .first()
      .fill('testuser');
  
  // ✅ 개선 (안정적)
  await page.locator('[data-testid="login-username"]').fill('testuser');
  await page.locator('[data-testid="login-password"]').fill('testpassword123');
  await page.locator('[data-testid="login-submit"]').click();
  ```

**5단계: 공통 로그인 헬퍼 함수 작성** (20분)
- [ ] 헬퍼 파일 생성
  ```bash
  frontend/tests/helpers/auth.ts
  ```
- [ ] 로그인 함수 구현
  ```typescript
  export async function login(page: Page, username: string, password: string) {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      await page.locator('[data-testid="login-username"]').fill(username);
      await page.locator('[data-testid="login-password"]').fill(password);
      await page.locator('[data-testid="login-submit"]').click();
      
      // 로그인 성공 확인
      await page.waitForURL(/\/(feed|home|dashboard)/);
  }
  ```
- [ ] posts.spec.ts에서 헬퍼 사용
  ```typescript
  import { login } from '../helpers/auth';
  
  test.beforeEach(async ({ page }) => {
      await login(page, 'testuser', 'testpassword123');
  });
  ```

**6단계: 최종 검증** (10분)
- [ ] 전체 테스트 실행
  ```bash
  npx playwright test tests/e2e/posts.spec.ts --reporter=html
  ```
- [ ] HTML 리포트 확인
  ```bash
  npx playwright show-report
  ```
- [ ] 스크린샷/비디오 확인
- [ ] 통과율 확인 (목표: 100%)

**예상 소요**: 2일  
**담당**: Frontend  
**산출물**: 수정된 테스트 파일, `TEST_FIX_REPORT.md`

---

### Task 1.3: 게시판 CRUD 테스트 강화 ✅

**목표**: posts.spec.ts 테스트 커버리지 100% 달성

#### 추가할 테스트 시나리오

**게시물 작성 (Create)**
- [ ] 필수 필드 누락 시 에러 표시
- [ ] 제목 길이 제한 (최대 200자)
- [ ] 내용 길이 제한 (최대 10,000자)
- [ ] 이미지 첨부 (단일/다중)
- [ ] 태그 추가 (최대 5개)
- [ ] 카테고리 선택
- [ ] 임시 저장 기능

**게시물 조회 (Read)**
- [ ] 게시물 목록 로딩
- [ ] 무한 스크롤 동작
- [ ] 게시물 상세 페이지
- [ ] 조회수 증가 확인
- [ ] 작성자 프로필 링크
- [ ] 이미지 렌더링
- [ ] 코드 블록 하이라이팅

**게시물 수정 (Update)**
- [ ] 작성자만 수정 가능
- [ ] 수정 폼 자동 채우기
- [ ] 수정 내용 저장
- [ ] 수정 이력 표시
- [ ] 권한 없는 사용자 접근 차단

**게시물 삭제 (Delete)**
- [ ] 작성자만 삭제 가능
- [ ] 삭제 확인 다이얼로그
- [ ] 삭제 후 목록 업데이트
- [ ] 관리자 삭제 권한
- [ ] 소프트 삭제 (복구 가능)

**예상 소요**: 3일  
**담당**: Frontend + QA  
**산출물**: 강화된 `posts.spec.ts` (30+ 시나리오)

---

### Task 1.4: 댓글 시스템 테스트 추가 ✅

**목표**: 댓글 관련 모든 기능 테스트

#### 테스트 시나리오
- [ ] 댓글 작성
  - [ ] 일반 댓글 작성
  - [ ] 대댓글 작성 (2단계, 3단계)
  - [ ] 멘션 기능 (@username)
  - [ ] 이모지 입력
  - [ ] 마크다운 문법 지원

- [ ] 댓글 조회
  - [ ] 댓글 목록 로딩
  - [ ] 대댓글 펼치기/접기
  - [ ] 댓글 정렬 (최신순/인기순)
  - [ ] 댓글 페이지네이션

- [ ] 댓글 수정/삭제
  - [ ] 작성자만 수정 가능
  - [ ] 삭제 확인
  - [ ] 삭제된 댓글 표시

- [ ] 댓글 상호작용
  - [ ] 댓글 좋아요
  - [ ] 댓글 신고
  - [ ] 댓글 공유

**예상 소요**: 2일  
**담당**: Frontend  
**산출물**: `comments.spec.ts` (15+ 시나리오)

---

### Task 1.5: 검색/필터링 테스트 추가 ✅

**목표**: 게시판 검색 및 필터링 기능 완전 검증

#### 테스트 시나리오
- [ ] 전체 검색
  - [ ] 제목 검색
  - [ ] 내용 검색
  - [ ] 작성자 검색
  - [ ] 태그 검색
  - [ ] 복합 검색

- [ ] 필터링
  - [ ] 카테고리 필터
  - [ ] 날짜 범위 필터
  - [ ] 작성자 필터
  - [ ] 태그 필터
  - [ ] 다중 필터 조합

- [ ] 정렬
  - [ ] 최신순
  - [ ] 인기순 (좋아요)
  - [ ] 댓글 많은 순
  - [ ] 조회수 순

- [ ] 검색 결과
  - [ ] 검색어 하이라이팅
  - [ ] 검색 결과 없음 표시
  - [ ] 자동완성 제안
  - [ ] 검색 이력

**예상 소요**: 2일  
**담당**: Frontend  
**산출물**: `search-filtering.spec.ts` (12+ 시나리오)

---

## 2️⃣ Phase 2: 통합 테스트 및 엣지 케이스 (1주)

### Task 2.1: 사용자 시나리오 기반 통합 테스트 ✅

**목표**: 실제 사용자 플로우 완전 검증

#### 시나리오
**시나리오 1: 신규 사용자 게시판 사용**
```
회원가입 → 로그인 → 게시물 목록 조회 → 게시물 상세 → 댓글 작성 → 좋아요 → 로그아웃
```

**시나리오 2: 게시물 작성 및 관리**
```
로그인 → 게시물 작성 → 이미지 업로드 → 태그 추가 → 게시 → 수정 → 삭제
```

**시나리오 3: 활발한 사용자 활동**
```
로그인 → 여러 게시물 조회 → 댓글 여러 개 작성 → 좋아요 클릭 → 북마크 추가 → 공유
```

**시나리오 4: 검색 및 탐색**
```
로그인 → 검색어 입력 → 필터 적용 → 정렬 변경 → 게시물 상세 → 관련 게시물 탐색
```

**예상 소요**: 2일  
**담당**: QA  
**산출물**: `user-scenarios.spec.ts` (4개 주요 시나리오)

---

### Task 2.2: 엣지 케이스 테스트 🔴

**목표**: 예외 상황 및 경계 조건 검증

#### 테스트 케이스
- [ ] **대용량 데이터**
  - [ ] 10,000자 게시물 작성
  - [ ] 100개 댓글이 있는 게시물
  - [ ] 10MB 이미지 업로드
  - [ ] 1000개 게시물 스크롤

- [ ] **네트워크 오류**
  - [ ] API 500 에러 처리
  - [ ] 네트워크 끊김 시뮬레이션
  - [ ] 타임아웃 처리
  - [ ] 재시도 로직

- [ ] **권한 및 보안**
  - [ ] 로그인 없이 게시물 작성 시도
  - [ ] 타인 게시물 수정 시도
  - [ ] 타인 게시물 삭제 시도
  - [ ] XSS 스크립트 입력

- [ ] **동시성**
  - [ ] 동시에 여러 댓글 작성
  - [ ] 동시에 좋아요 클릭
  - [ ] 동일 게시물 동시 수정

- [ ] **브라우저 호환성**
  - [ ] Chrome (최신)
  - [ ] Firefox (최신)
  - [ ] Safari (최신)
  - [ ] Edge (최신)

**예상 소요**: 3일  
**담당**: QA + Backend  
**산출물**: `edge-cases.spec.ts` (20+ 시나리오)

---

### Task 2.3: 성능 테스트 ⚡

**목표**: 게시판 성능 벤치마크 및 최적화

#### 테스트 항목
- [ ] **로딩 시간**
  - [ ] 게시물 목록 로딩 < 1초
  - [ ] 게시물 상세 로딩 < 500ms
  - [ ] 댓글 로딩 < 300ms
  - [ ] 이미지 로딩 < 2초

- [ ] **인터랙션 응답 시간**
  - [ ] 좋아요 클릭 응답 < 100ms
  - [ ] 댓글 작성 응답 < 500ms
  - [ ] 검색 결과 < 800ms

- [ ] **메모리 사용량**
  - [ ] 무한 스크롤 메모리 누수 확인
  - [ ] 가상 스크롤 효율성
  - [ ] 이미지 캐싱 확인

**예상 소요**: 2일  
**담당**: Frontend + DevOps  
**산출물**: `PERFORMANCE_TEST_REPORT.md`

---

## 3️⃣ Phase 3: 테스트 자동화 및 CI/CD 통합 (1주)

### Task 3.1: GitHub Actions 워크플로우 생성 🔧

**목표**: Push/PR 시 자동 테스트 실행

#### 워크플로우 파일 생성
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests (게시판)

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'frontend/src/**'
      - 'frontend/tests/e2e/**'
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
          npx playwright install --with-deps chromium
          
      - name: Start dev server
        run: |
          cd frontend
          npm run dev &
          npx wait-on http://localhost:3000
          
      - name: Run E2E tests
        run: |
          cd frontend
          npx playwright test tests/e2e/posts.spec.ts
          npx playwright test tests/e2e/comments.spec.ts
          npx playwright test tests/e2e/search-filtering.spec.ts
          
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

**체크리스트**
- [ ] 워크플로우 파일 생성
- [ ] 테스트 환경 변수 설정
- [ ] 테스트 결과 아티팩트 업로드
- [ ] Slack 알림 통합 (선택)

**예상 소요**: 1일  
**담당**: DevOps  
**산출물**: `.github/workflows/e2e-tests.yml`

---

### Task 3.2: 테스트 리포트 대시보드 📊

**목표**: 테스트 결과 시각화 및 추적

#### 구현 내용
- [ ] Playwright HTML Reporter 설정
- [ ] 테스트 커버리지 추적
- [ ] 실패율 트렌드 분석
- [ ] 슬로우 테스트 식별

**설정 파일**
```typescript
// playwright.config.ts
export default defineConfig({
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }],
  ],
  // ...
});
```

**예상 소요**: 1일  
**담당**: Frontend  
**산출물**: `playwright-report/index.html`

---

### Task 3.3: 테스트 데이터 관리 🗄️

**목표**: 일관된 테스트 데이터 환경 구축

#### 구현 내용
- [ ] 테스트 DB 스키마 생성
- [ ] Seed 데이터 스크립트
- [ ] 테스트 전/후 데이터 클린업
- [ ] Mock 데이터 생성기

**Seed 데이터 예시**
```javascript
// tests/fixtures/seed-posts.js
export const testPosts = [
  {
    id: 1,
    title: '테스트 게시물 1',
    content: '테스트 내용...',
    author_id: 1,
    created_at: '2025-01-01'
  },
  // ... 10개 게시물
];
```

**예상 소요**: 2일  
**담당**: Backend  
**산출물**: `tests/fixtures/`, `seed-data.sql`

---

### Task 3.4: 회귀 테스트 자동화 🔄

**목표**: 기능 변경 시 자동 회귀 테스트

#### 구현 내용
- [ ] Visual Regression Testing (Percy/Chromatic)
- [ ] API Contract Testing (Pact)
- [ ] 스냅샷 테스팅

**Visual Regression 예시**
```typescript
// tests/visual/posts.visual.spec.ts
test('게시물 목록 스냅샷', async ({ page }) => {
  await page.goto('/posts');
  await expect(page).toHaveScreenshot('posts-list.png');
});
```

**예상 소요**: 3일  
**담당**: QA + Frontend  
**산출물**: Visual 테스트 스크립트

---

## 4️⃣ Phase 4: 문서화 및 유지보수 (3일)

### Task 4.1: 테스트 가이드 문서 작성 📖

**목표**: 팀원들이 쉽게 테스트 작성/실행할 수 있도록 가이드 제공

#### 문서 내용
- [ ] 테스트 작성 가이드
  - [ ] 테스트 구조 (Arrange-Act-Assert)
  - [ ] 선택자 작성 규칙
  - [ ] 베스트 프랙티스
  - [ ] 안티 패턴

- [ ] 테스트 실행 가이드
  - [ ] 로컬 실행 방법
  - [ ] CI/CD 실행 방법
  - [ ] 디버깅 방법

- [ ] 트러블슈팅
  - [ ] 자주 발생하는 오류
  - [ ] 해결 방법
  - [ ] FAQ

**예상 소요**: 1일  
**담당**: QA Lead  
**산출물**: `TESTING_GUIDE.md`

---

### Task 4.2: 테스트 커버리지 보고서 📈

**목표**: 현재 테스트 커버리지 가시화

#### 보고서 내용
```markdown
# 게시판 테스트 커버리지 보고서

## 전체 커버리지
- **게시물 CRUD**: 28/30 (93%)
- **댓글 시스템**: 14/15 (93%)
- **검색/필터링**: 11/12 (92%)
- **좋아요/공유**: 6/6 (100%)
- **권한/보안**: 8/10 (80%)

## 커버되지 않는 기능
1. 게시물 임시 저장
2. 댓글 신고 처리
3. ...
```

**예상 소요**: 1일  
**담당**: QA  
**산출물**: `TEST_COVERAGE_REPORT.md`

---

### Task 4.3: 지속적 개선 프로세스 수립 🔧

**목표**: 테스트 품질 지속 개선

#### 프로세스
- [ ] 주간 테스트 리뷰 미팅
- [ ] 월간 테스트 커버리지 리뷰
- [ ] 분기별 테스트 전략 업데이트
- [ ] 신규 기능 추가 시 테스트 필수화

**체크리스트 템플릿**
```markdown
## 신규 기능 테스트 체크리스트
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] E2E 테스트 작성
- [ ] 엣지 케이스 테스트
- [ ] 성능 테스트
- [ ] PR에 테스트 결과 첨부
```

**예상 소요**: 1일  
**담당**: QA Lead + PM  
**산출물**: `TEST_PROCESS.md`

---

## 📋 전체 일정 요약

| Phase       | 작업                       | 소요 | 담당              | 상태      |
| ----------- | -------------------------- | ---- | ----------------- | --------- |
| **Phase 1** | 기존 테스트 검증 및 강화   | 5일  | Frontend + QA     | ⏳ 대기    |
| 1.1         | 기존 테스트 실행 및 분석   | 1일  | QA + Frontend     | ⚠️ 진행 중 |
| 1.2         | 실패 테스트 수정           | 2일  | Frontend          | 🔴 긴급    |
| 1.3         | 게시판 CRUD 테스트 강화    | 3일  | Frontend + QA     | ⏳ 대기    |
| 1.4         | 댓글 시스템 테스트 추가    | 2일  | Frontend          | ⏳ 대기    |
| 1.5         | 검색/필터링 테스트 추가    | 2일  | Frontend          | ⏳ 대기    |
| **Phase 2** | 통합 테스트 및 엣지 케이스 | 5일  | QA + Backend      | ⏳ 대기    |
| 2.1         | 사용자 시나리오 테스트     | 2일  | QA                | ⏳ 대기    |
| 2.2         | 엣지 케이스 테스트         | 3일  | QA + Backend      | ⏳ 대기    |
| 2.3         | 성능 테스트                | 2일  | Frontend + DevOps | ⏳ 대기    |
| **Phase 3** | 테스트 자동화 및 CI/CD     | 5일  | DevOps + Frontend | ⏳ 대기    |
| 3.1         | GitHub Actions 워크플로우  | 1일  | DevOps            | ⏳ 대기    |
| 3.2         | 테스트 리포트 대시보드     | 1일  | Frontend          | ⏳ 대기    |
| 3.3         | 테스트 데이터 관리         | 2일  | Backend           | ⏳ 대기    |
| 3.4         | 회귀 테스트 자동화         | 3일  | QA + Frontend     | ⏳ 대기    |
| **Phase 4** | 문서화 및 유지보수         | 3일  | QA Lead           | ⏳ 대기    |
| 4.1         | 테스트 가이드 작성         | 1일  | QA Lead           | ⏳ 대기    |
| 4.2         | 커버리지 보고서            | 1일  | QA                | ⏳ 대기    |
| 4.3         | 지속적 개선 프로세스       | 1일  | QA Lead + PM      | ⏳ 대기    |

**전체 소요**: 18일 (약 3.5주)

---

## 🎯 성공 기준

### 테스트 커버리지
- ✅ 게시판 CRUD: **95%+**
- ✅ 댓글 시스템: **90%+**
- ✅ 검색/필터링: **90%+**
- ✅ 권한/보안: **85%+**

### 테스트 안정성
- ✅ 테스트 통과율: **95%+**
- ✅ Flaky 테스트: **5% 이하**
- ✅ 평균 테스트 실행 시간: **10분 이하**

### CI/CD 통합
- ✅ 모든 PR에 자동 테스트 실행
- ✅ 테스트 실패 시 머지 차단
- ✅ 테스트 결과 Slack 알림

---

## 📚 산출물 목록

### 테스트 파일
1. `posts.spec.ts` (강화, 30+ 시나리오)
2. `comments.spec.ts` (신규, 15+ 시나리오)
3. `search-filtering.spec.ts` (신규, 12+ 시나리오)
4. `user-scenarios.spec.ts` (신규, 4개 시나리오)
5. `edge-cases.spec.ts` (신규, 20+ 시나리오)

### CI/CD 파일
6. `.github/workflows/e2e-tests.yml`
7. `playwright.config.ts` (업데이트)

### 데이터 파일
8. `tests/fixtures/seed-posts.js`
9. `seed-data.sql`

### 문서
10. `TEST_EXECUTION_REPORT_POSTS.md`
11. `TEST_FIX_REPORT.md`
12. `PERFORMANCE_TEST_REPORT.md`
13. `TESTING_GUIDE.md`
14. `TEST_COVERAGE_REPORT.md`
15. `TEST_PROCESS.md`

**총 15개 산출물**

---

## 💡 다음 단계

### Phase 1 완료 후
- [ ] Phase 2 시작 전 팀 리뷰 미팅
- [ ] 테스트 커버리지 중간 점검
- [ ] 리소스 재조정 (필요 시)

### Phase 2 완료 후
- [ ] 엣지 케이스 우선순위 재평가
- [ ] 성능 벤치마크 기준 설정
- [ ] 자동화 계획 확정

### Phase 3 완료 후
- [ ] CI/CD 파이프라인 최적화
- [ ] 테스트 실행 시간 단축
- [ ] 병렬 테스트 실행 검토

### Phase 4 완료 후
- [ ] 전체 프로젝트 회고
- [ ] 다른 기능 영역 테스트 계획
- [ ] 테스트 자동화 확대

---

## 📞 연락처

- **QA Lead**: _________________
- **Frontend Lead**: _________________
- **Backend Lead**: _________________
- **DevOps Lead**: _________________

---

**작성자**: AUTOAGENTS  
**최종 업데이트**: 2025년 11월 10일  
**버전**: 1.0.0  
**다음 리뷰**: Phase 1 완료 시

---

© 2025 LeeHwiRyeon. All rights reserved.
