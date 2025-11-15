# E2E 테스트 실행 가이드

## 📋 개요

이 디렉토리는 Playwright를 사용한 End-to-End 테스트를 포함합니다.

## 🧪 테스트 시나리오

### `auth.spec.ts` - 인증 시스템 테스트
- 회원가입/로그인/로그아웃
- 토큰 갱신 및 비밀번호 재설정

### `social-features.spec.ts` - 소셜 기능 테스트 ⭐ NEW
- **사용자 팔로우/언팔로우**
  - 다른 사용자 팔로우
  - 팔로잉 사용자 언팔로우
  - 팔로워/팔로잉 목록 조회
- **게시판 팔로우**
  - 게시판 팔로우 추가
  - 팔로우한 게시판 알림 수신
- **게시물 공유**
  - 공유 버튼 클릭 및 다이얼로그 표시
  - 소셜 미디어 플랫폼 옵션 (Twitter, Facebook, LinkedIn, Reddit, WhatsApp, Telegram)
  - 링크 복사 기능
  - 공유 미리보기 표시
- **사용자 차단**
  - 사용자 차단 추가
  - 차단 해제
  - 차단 목록 관리
  - 차단된 사용자의 게시물 숨김
- **멘션 기능**
  - 댓글에서 사용자 멘션
  - 멘션 알림 수신
- **통합 시나리오**
  - 전체 소셜 인터랙션 플로우 (팔로우 → 북마크 → 공유 → 멘션)

### `bookmarks.spec.ts` - 북마크 시스템 테스트 ⭐ NEW
- **게시물 북마크**
  - 북마크 추가/제거
  - 시각적 피드백 확인
- **게시판 북마크**
  - 게시판 북마크 추가/제거
- **북마크 목록 관리**
  - 목록 페이지 접근
  - 타입별 필터링 (게시물/게시판)
  - 검색 기능
  - 페이지네이션
- **북마크 폴더 관리** (선택적)
  - 폴더 생성/삭제
  - 북마크를 폴더로 이동
- **API 응답 확인**
  - 북마크 추가 API
  - 북마크 목록 조회 API
- **통합 시나리오**
  - 전체 북마크 워크플로우 (추가 → 목록 → 필터 → 검색)

### `security-flow.spec.ts` - 보안 기능 통합 테스트

1. **전체 시나리오 테스트**
   - 로그인 → JWT 토큰 발급
   - 채팅방 입장 → 메시지 전송
   - 암호화 활성화 → 키 교환
   - 로그아웃 → 토큰 블랙리스트

2. **CSRF 토큰 자동 처리**
   - POST/PUT/DELETE 요청 시 `x-csrf-token` 헤더 포함 확인
   - CSRF 토큰 자동 갱신 확인

3. **401 자동 로그아웃**
   - 만료된 토큰 사용 시 자동 로그아웃
   - 로그인 페이지 리디렉션 확인

4. **암호화/복호화**
   - AES-GCM 메시지 암호화
   - ECDH 키 교환
   - 암호화된 메시지 자동 복호화

5. **토큰 블랙리스트**
   - 로그아웃된 토큰 재사용 차단
   - 401 에러 발생 확인

6. **CSRF 토큰 캐싱**
   - 1시간 토큰 캐싱 확인
   - 불필요한 토큰 요청 방지

## 🚀 실행 방법

### 1. 서버 시작 (필수)

```bash
# Backend 서버
cd server-backend
npm run dev

# Frontend 서버
cd frontend
npm start
```

### 2. 테스트 실행

```bash
cd frontend

# 모든 E2E 테스트 실행
npm run test:e2e

# 특정 테스트 파일 실행
npx playwright test tests/e2e/security-flow.spec.ts

# UI 모드로 실행 (디버깅)
npx playwright test --ui

# 특정 브라우저만 테스트
npx playwright test --project=chromium
```

### 3. 테스트 리포트 확인

```bash
# HTML 리포트 열기
npx playwright show-report
```

## 📝 테스트 계정

테스트를 위한 기본 계정:

```
Username: testuser
Password: testpassword123
```

**참고**: 실제 테스트 실행 전에 이 계정이 데이터베이스에 존재하는지 확인하세요.

## 🛠️ 테스트 설정

`playwright.config.ts` 파일에서 다음 설정을 확인/수정할 수 있습니다:

```typescript
{
  testDir: './tests/e2e',
  baseURL: 'http://localhost:3000',
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  retries: process.env.CI ? 2 : 0,
}
```

## 🔍 테스트 데이터 속성

소셜 기능 및 북마크 테스트에서 사용하는 `data-testid` / `aria-label` 속성:

### 소셜 기능
- `follow-button` - 팔로우 버튼
- `unfollow-button` - 언팔로우 버튼
- `bookmark-button` - 북마크 버튼
- `share-button` - 공유 버튼
- `block-button` - 차단 버튼
- `blocked-users-list` - 차단 사용자 목록
- `bookmarks-container` - 북마크 컨테이너
- `bookmarks-list` - 북마크 목록

### 보안 기능
- `chat-system` - 채팅 시스템 컨테이너
- `encryption-toggle` - 암호화 토글 버튼
- `key-exchange-dialog` - 키 교환 다이얼로그
- `key-exchange-success` - 키 교환 성공 메시지
- `encryption-status` - 암호화 상태 표시
- `message-input` - 메시지 입력 필드
- `send-button` - 메시지 전송 버튼
- `logout-button` - 로그아웃 버튼

**중요**: 프론트엔드 컴포넌트에 이 속성들을 추가해야 테스트가 정상 작동합니다.

## 🐛 디버깅

### 1. Playwright Inspector 사용

```bash
npx playwright test --debug
```

### 2. 브라우저 헤드리스 모드 비활성화

```typescript
// playwright.config.ts
use: {
  headless: false,
  slowMo: 100, // 동작 속도 늦추기 (ms)
}
```

### 3. 로그 확인

```bash
# 상세 로그 출력
DEBUG=pw:api npx playwright test
```

## ✅ 테스트 통과 기준

모든 테스트가 통과하려면:

1. ✅ Backend 서버 실행 중 (http://localhost:5000)
2. ✅ Frontend 서버 실행 중 (http://localhost:3000)
3. ✅ 테스트 계정이 DB에 존재
4. ✅ Redis 서버 실행 중 (토큰 블랙리스트용)
5. ✅ 프론트엔드에 `data-testid` 속성 추가됨

## 📊 예상 결과

```
Running 6 tests using 3 workers

  ✓  security-flow.spec.ts:전체 시나리오: 로그인 → 채팅 → 암호화 → 로그아웃 (5s)
  ✓  security-flow.spec.ts:CSRF 토큰 자동 처리 검증 (3s)
  ✓  security-flow.spec.ts:401 자동 로그아웃 검증 (4s)
  ✓  security-flow.spec.ts:암호화된 메시지 전송 및 복호화 (4s)
  ✓  security-flow.spec.ts:토큰 블랙리스트 검증 (3s)
  ✓  security-flow.spec.ts:CSRF 토큰 캐싱 검증 (3s)

  6 passed (22s)
```

## 🔗 관련 문서

- [Playwright 공식 문서](https://playwright.dev/)
- [보안 구현 상태](../../SECURITY_IMPLEMENTATION_STATUS.md)
- [CSRF 테스트 가이드](../../CSRF_TEST_GUIDE.md)
