# 🧪 E2E 테스트 실행 가이드

**작성일**: 2025년 11월 10일  
**버전**: 2.0.0  
**테스트 프레임워크**: Playwright

---

## 📋 목차

1. [테스트 환경 설정](#테스트-환경-설정)
2. [테스트 실행 방법](#테스트-실행-방법)
3. [테스트 카테고리](#테스트-카테고리)
4. [테스트 작성 가이드](#테스트-작성-가이드)
5. [CI/CD 통합](#cicd-통합)
6. [트러블슈팅](#트러블슈팅)

---

## 🚀 테스트 환경 설정

### 1. 사전 요구사항
```bash
# Node.js 18+ 설치 확인
node --version

# Playwright 브라우저 설치
cd frontend
npx playwright install

# 브라우저 의존성 설치 (Linux/WSL)
npx playwright install-deps
```

### 2. 서버 실행 (필수)
```bash
# Terminal 1: Backend 서버
cd server-backend
npm run dev
# 포트: 3000

# Terminal 2: Frontend 개발 서버
cd frontend
npm run dev
# 포트: 5173
```

### 3. 테스트 데이터베이스 설정
```bash
# 테스트 DB 생성
mysql -u root -p -e "CREATE DATABASE community_test;"

# 마이그레이션 실행
cd server-backend
mysql -u root -p community_test < migrations/007_create_notifications_table.sql
mysql -u root -p community_test < migrations/008_create_user_profile_v2.sql
mysql -u root -p community_test < database/migrations/006_dashboard_schema.sql

# 테스트 사용자 생성 (seed)
npm run test:seed
```

---

## 🧪 테스트 실행 방법

### 전체 테스트 실행
```bash
cd frontend

# 모든 E2E 테스트 실행 (HTML 리포트)
npx playwright test tests/e2e/ --reporter=html

# 리포트 확인
npx playwright show-report
```

### 개별 테스트 파일 실행
```bash
# 인증 테스트
npx playwright test tests/e2e/auth.spec.ts --reporter=list

# DM 테스트
npx playwright test tests/e2e/dm.spec.ts --reporter=list

# 그룹 채팅 테스트
npx playwright test tests/e2e/group-chat.spec.ts --reporter=list
```

### 특정 브라우저에서 실행
```bash
# Chromium만
npx playwright test --project=chromium

# Firefox만
npx playwright test --project=firefox

# WebKit(Safari)만
npx playwright test --project=webkit
```

### 디버그 모드 실행
```bash
# UI 모드로 실행 (추천)
npx playwright test --ui

# 특정 테스트 디버그
npx playwright test tests/e2e/dm.spec.ts --debug

# Headed 모드 (브라우저 표시)
npx playwright test --headed
```

### 빠른 실행 (실패만 재실행)
```bash
# 실패한 테스트만 재실행
npx playwright test --last-failed

# 특정 수만 실행
npx playwright test --max-failures=5
```

---

## 📂 테스트 카테고리

### 현재 구현된 테스트 (12개 파일)

#### 1. 인증 및 보안
- **auth.spec.ts** ✅
  - 회원가입, 로그인, 로그아웃
  - 비밀번호 재설정
  - JWT 토큰 갱신
  ```bash
  npx playwright test tests/e2e/auth.spec.ts
  ```

- **security-flow.spec.ts** ✅
  - XSS 방어
  - CSRF 보호
  - SQL Injection 방어
  ```bash
  npx playwright test tests/e2e/security-flow.spec.ts
  ```

#### 2. 게시물 및 댓글
- **posts.spec.ts** ✅
  - 게시물 CRUD
  - 댓글 작성/수정/삭제
  - 좋아요/싫어요
  ```bash
  npx playwright test tests/e2e/posts.spec.ts --timeout=60000
  ```

- **homepage.spec.ts** ✅
  - 홈 피드 표시
  - 게시물 필터링
  - 무한 스크롤
  ```bash
  npx playwright test tests/e2e/homepage.spec.ts
  ```

#### 3. 사용자 프로필
- **profile.spec.ts** ✅
  - 프로필 조회
  - 프로필 수정
  ```bash
  npx playwright test tests/e2e/profile.spec.ts
  ```

- **profile-v2.spec.ts** ✅
  - 프로필 v2 UI
  - 배지 시스템
  - 레벨링 시스템
  ```bash
  npx playwright test tests/e2e/profile-v2.spec.ts
  ```

#### 4. Phase 3 신규 기능
- **notification.spec.ts** ✅
  - 실시간 알림 수신
  - 알림 읽음/삭제
  ```bash
  npx playwright test tests/e2e/notification.spec.ts
  ```

- **search.spec.ts** ✅
  - 통합 검색
  - 자동완성
  - 고급 필터
  ```bash
  npx playwright test tests/e2e/search.spec.ts
  ```

- **recommendation.spec.ts** ✅
  - 게시물 추천
  - 사용자 추천
  ```bash
  npx playwright test tests/e2e/recommendation.spec.ts
  ```

- **dashboard.spec.ts** ✅
  - 활동 통계
  - 차트 렌더링
  - 리더보드
  ```bash
  npx playwright test tests/e2e/dashboard.spec.ts
  ```

#### 5. 커뮤니티 기능 (신규 추가) 🆕
- **dm.spec.ts** 🆕
  - DM 전송/수신
  - 실시간 메시지
  - 읽음 확인
  ```bash
  npx playwright test tests/e2e/dm.spec.ts
  ```

- **group-chat.spec.ts** 🆕
  - 그룹 생성/관리
  - 그룹 채팅
  - 멤버 관리
  ```bash
  npx playwright test tests/e2e/group-chat.spec.ts
  ```

### 추가 예정 테스트 (8개 파일)
- `share.spec.ts` - 게시물 공유
- `mention.spec.ts` - 멘션 기능
- `block.spec.ts` - 차단 기능
- `image-gallery.spec.ts` - 이미지 갤러리
- `notification-settings.spec.ts` - 알림 설정
- `profile-customization.spec.ts` - 프로필 커스터마이징
- `follow.spec.ts` - 팔로우 시스템
- `feed.spec.ts` - 활동 피드

---

## 📝 테스트 작성 가이드

### 1. 기본 구조
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전 실행
    await page.goto('http://localhost:5173');
  });

  test('TC-01: 테스트 케이스 이름', async ({ page }) => {
    // Given: 테스트 전제 조건
    await page.click('text=로그인');
    
    // When: 테스트 액션
    await page.fill('input[name="email"]', 'test@test.com');
    await page.click('button[type="submit"]');
    
    // Then: 결과 검증
    await expect(page.locator('text=환영합니다')).toBeVisible();
  });
});
```

### 2. 네이밍 규칙
- **테스트 파일**: `feature-name.spec.ts`
- **테스트 ID**: `[Feature]-[Number]: [Description]`
  - 예: `DM-01: 사용자에게 DM 전송 성공`

### 3. 베스트 프랙티스

#### ✅ DO (권장)
```typescript
// data-testid 사용
await page.click('[data-testid="submit-button"]');

// 명확한 기대값
await expect(page.locator('[data-testid="message"]')).toHaveText('성공');

// 네트워크 대기
await page.waitForLoadState('networkidle');

// 타임아웃 설정
await expect(page.locator('text=로딩 완료')).toBeVisible({ timeout: 5000 });
```

#### ❌ DON'T (지양)
```typescript
// CSS 선택자 직접 사용
await page.click('.button-123');

// 고정 대기 시간
await page.waitForTimeout(3000);

// 모호한 선택자
await page.click('button');
```

### 4. 테스트 데이터 관리
```typescript
// tests/fixtures/test-users.ts
export const testUsers = {
  user1: {
    email: 'user1@test.com',
    password: 'Test1234!',
    username: 'user1'
  },
  user2: {
    email: 'user2@test.com',
    password: 'Test1234!',
    username: 'user2'
  }
};

// 사용 예시
import { testUsers } from '../fixtures/test-users';

test('로그인 테스트', async ({ page }) => {
  await page.fill('input[name="email"]', testUsers.user1.email);
  await page.fill('input[name="password"]', testUsers.user1.password);
});
```

---

## 🔄 CI/CD 통합

### GitHub Actions 설정
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: testpass
          MYSQL_DATABASE: community_test
        ports:
          - 3306:3306
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd server-backend && npm ci
          cd ../frontend && npm ci
      
      - name: Start servers
        run: |
          cd server-backend && npm run dev &
          cd frontend && npm run dev &
          sleep 10
      
      - name: Run E2E tests
        run: |
          cd frontend
          npx playwright test tests/e2e/
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

### Pre-commit Hook 설정
```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "Running critical E2E tests..."
cd frontend
npx playwright test tests/e2e/auth.spec.ts tests/e2e/posts.spec.ts --reporter=list

if [ $? -ne 0 ]; then
  echo "E2E tests failed. Commit aborted."
  exit 1
fi

echo "E2E tests passed!"
```

---

## 🔧 트러블슈팅

### 문제 1: "Test timeout of 30000ms exceeded"
**원인**: 서버가 실행되지 않았거나 응답이 느림

**해결**:
```bash
# 1. 서버 실행 확인
curl http://localhost:3000/api/health
curl http://localhost:5173

# 2. 타임아웃 증가
npx playwright test --timeout=60000

# 3. 특정 테스트만 타임아웃 설정
test('느린 테스트', async ({ page }) => {
  test.setTimeout(60000);
  // ...
});
```

### 문제 2: "Locator resolved to 0 elements"
**원인**: 요소를 찾을 수 없음

**해결**:
```typescript
// 1. 요소가 나타날 때까지 대기
await page.waitForSelector('[data-testid="element"]', { timeout: 5000 });

// 2. 네트워크 완료 대기
await page.waitForLoadState('networkidle');

// 3. 디버그 모드로 확인
npx playwright test --debug
```

### 문제 3: "Connection refused to localhost:5173"
**원인**: Frontend 서버 미실행

**해결**:
```bash
# 1. Frontend 서버 실행
cd frontend
npm run dev

# 2. 포트 사용 확인
netstat -ano | findstr :5173  # Windows
lsof -i :5173                  # macOS/Linux

# 3. 포트 변경
# vite.config.ts
export default defineConfig({
  server: {
    port: 5174
  }
});
```

### 문제 4: "Browser not installed"
**원인**: Playwright 브라우저 미설치

**해결**:
```bash
# 모든 브라우저 설치
npx playwright install

# 특정 브라우저만 설치
npx playwright install chromium

# 브라우저 의존성 설치 (Linux)
npx playwright install-deps
```

### 문제 5: 테스트가 불안정함 (Flaky)
**원인**: 타이밍 이슈, 비동기 처리 불완전

**해결**:
```typescript
// 1. 명시적 대기 추가
await expect(page.locator('[data-testid="result"]')).toBeVisible({ timeout: 5000 });

// 2. 네트워크 완료 대기
await page.waitForLoadState('networkidle');

// 3. 재시도 로직
test('불안정한 테스트', async ({ page }) => {
  test.retries(2); // 최대 2번 재시도
  // ...
});
```

---

## 📊 테스트 리포트

### HTML 리포트
```bash
# 테스트 실행 및 리포트 생성
npx playwright test --reporter=html

# 리포트 열기
npx playwright show-report
```

### JSON 리포트
```bash
# JSON 형식으로 리포트 저장
npx playwright test --reporter=json > test-results.json

# 분석 스크립트 실행
node scripts/analyze-test-results.js test-results.json
```

### 커버리지 리포트
```bash
# 코드 커버리지 측정
npm run test:coverage

# 리포트 확인
open coverage/index.html
```

---

## 🎯 테스트 목표

### Phase 3 목표
- **E2E 테스트 통과율**: 95% 이상 (92/97 tests)
- **코드 커버리지**: 80% 이상
- **평균 테스트 실행 시간**: < 5분
- **Flaky 테스트**: 0개

### 일일 체크리스트
- [ ] 아침: 전날 작성한 테스트 실행
- [ ] 오전: 신규 기능 E2E 테스트 작성
- [ ] 오후: 기존 테스트 보완 및 리팩토링
- [ ] 저녁: 전체 테스트 실행 및 리포트 확인

---

**작성자**: AUTOAGENTS  
**최종 업데이트**: 2025년 11월 10일

---

© 2025 LeeHwiRyeon. All rights reserved.
