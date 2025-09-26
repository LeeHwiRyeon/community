# CI 테스터 테스트 기능 상세 명세서

## 1. 개요

### 1.1 목적
Community Hub 프로젝트의 모든 기능에 대한 종합적인 자동화 테스트를 수행하고, 실패 시 상세한 분석 및 리포트를 생성하는 CI 테스터 시스템의 상세 명세를 정의한다.

### 1.2 범위
- 단위 테스트, 통합 테스트, E2E 테스트 자동화
- 성능 및 보안 테스트 자동화
- ContentTester 기반 실제 기능 검증
- 실패 분석 및 자동 리포트 생성
- 테스트 아티팩트 관리

## 2. CI 테스터 아키텍처

### 2.1 워크플로우 구조
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub Event   │ -> │  CI Tester       │ -> │   Test Results  │
│                 │    │  (30분 타임아웃) │    │                 │
│ - Push/PR       │    │                  │    │ - Success/Fail  │
│ - Manual Dispatch│    │ 1. 환경 설정     │    │ - Artifacts     │
│ - Test Scope     │    │ 2. 테스트 실행   │    │ - Bug Reports   │
└─────────────────┘    │ 3. 분석 및 리포트 │    └─────────────────┘
                       └──────────────────┘
```

### 2.2 실행 모드
- **자동 모드**: main 브랜치 push/PR 시 전체 테스트
- **수동 모드**: 워크플로우 디스패치로 선택적 테스트 실행
- **범위 옵션**: all, unit, integration, e2e, performance, security

## 3. 테스트 기능 상세 명세

### 3.1 환경 설정 단계 (Environment Setup)

#### 3.1.1 데이터베이스 초기화
**시퀀스**:
1. MariaDB 10.6 컨테이너 시작
2. 환경 변수 설정 (ROOT_PASSWORD, DATABASE, USER, PASSWORD)
3. 헬스 체크: `mysqladmin ping` 명령어로 연결 확인
4. 타임아웃: 2분 (40회 재시도, 2초 간격)
5. 성공 조건: `SELECT 1` 쿼리 실행 성공

**실패 처리**:
- 타임아웃 시 워크플로우 실패
- 로그: "DB connection failed after 40 attempts"

#### 3.1.2 Node.js 환경 구성
**시퀀스**:
1. Node.js 20 설치 및 캐시 설정
2. npm 캐시 활성화 (server-backend, frontend 패키지)
3. 백엔드 의존성 설치 (server-backend)
4. 프론트엔드 의존성 설치 (frontend)
5. 프론트엔드 빌드 실행 (`npm run build`)

**실패 처리**:
- 의존성 설치 실패 시 워크플로우 중단
- 빌드 실패 시 상세 에러 로그 출력

#### 3.1.3 서버 시작
**시퀀스**:
1. 백엔드 서버 백그라운드 실행 (`node mock-server.js`)
2. 헬스 체크: `curl http://localhost:50000/api/health`
3. 타임아웃: 15초 (연결 대기)
4. 성공 조건: HTTP 200 응답

**실패 처리**:
- 서버 시작 실패 시 "Backend failed to start" 메시지
- 프로세스 정리 후 워크플로우 실패

### 3.2 단위 테스트 (Unit Tests)

#### 3.2.1 실행 조건
- `TEST_SCOPE`가 'all' 또는 'unit'인 경우
- 타임아웃: 5분
- continue-on-error: true (실패해도 다음 단계 진행)

#### 3.2.2 실행 시퀀스
1. 디렉토리 이동: `frontend/`
2. 테스트 실행: `npm test -- --coverage --watchAll=false`
3. 커버리지 리포트 생성 (coverage/lcov-report/)
4. JUnit/XML 리포트 생성 (선택적)

#### 3.2.3 검증 대상
- React 컴포넌트 렌더링 및 상호작용
- 커스텀 훅 로직 및 상태 관리
- 유틸리티 함수 및 헬퍼 함수
- 에러 처리 및 엣지 케이스

#### 3.2.4 성공 기준
- 모든 테스트 통과 (exit code 0)
- 커버리지: 함수 80%+, 브랜치 75%+, 라인 80%+

### 3.3 통합 테스트 (Integration Tests)

#### 3.3.1 실행 조건
- `TEST_SCOPE`가 'all' 또는 'integration'인 경우
- 타임아웃: 5분
- continue-on-error: true

#### 3.3.2 실행 시퀀스
1. 백엔드 서버 재시작 (E2E용)
2. 프론트엔드 서버 시작 (`npm run preview`)
3. 서버 준비 대기 (5173 포트)
4. ContentTester 통합 테스트 실행

#### 3.3.3 ContentTester 검증 시퀀스
```
1. 게시판 데이터 로딩 테스트
   ├── getBoards() API 호출
   ├── 응답 검증 (Array.isArray)
   ├── 결과 로깅: "X boards loaded"

2. 뉴스 게시물 로딩 테스트
   ├── getPost('news-fallback-1') 호출
   ├── 응답 검증 (id 존재)
   ├── 결과 로깅: "News post loaded"

3. 검색 기능 테스트
   ├── searchPosts('test') 호출
   ├── 응답 검증 (객체 타입)
   ├── 결과 로깅: "X results found"

4. 커뮤니티 데이터 테스트
   ├── getCommunities() 호출
   ├── 응답 검증 (Array.isArray)
   ├── 결과 로깅: "X communities loaded"
```

### 3.4 E2E 테스트 (End-to-End Tests)

#### 3.4.1 실행 조건
- `TEST_SCOPE`가 'all' 또는 'e2e'인 경우
- 타임아웃: 10분
- continue-on-error: true

#### 3.4.2 실행 시퀀스
1. Playwright 브라우저 설치 (`npx playwright install --with-deps`)
2. 테스트 실행: `npx playwright test --reporter=json`
3. HTML 리포트 생성 (playwright-report/)
4. 스크린샷/비디오 캡처 (실패 시)

#### 3.4.3 현재 테스트 시나리오
```
Navigation Tests (navigation.spec.ts):
├── should load home page
│   └── GET /5173 → Status 200 확인
├── should have main navigation elements
│   └── nav 요소 존재 확인
├── should handle search functionality
│   └── input[type="search"] 요소 조작
├── should be responsive on mobile
│   └── viewport 375x667 설정 및 확인
└── should have basic accessibility
    └── main landmark 존재 확인
```

### 3.5 성능 테스트 (Performance Tests)

#### 3.5.1 실행 조건
- `TEST_SCOPE`가 'all' 또는 'performance'인 경우
- 타임아웃: 5분
- continue-on-error: true

#### 3.5.2 실행 시퀀스
```
1. 번들 사이즈 분석
   ├── du -sh dist/assets/*.js 실행
   ├── 결과: "Bundle size: X MB"

2. API 응답 시간 측정
   ├── curl -o /dev/null -s -w '%{time_total}' 실행
   ├── 결과: "API response time: X.Xs"

3. 임계값 검증
   ├── 응답 시간 > 2.0초 → 경고
   ├── 메모리 사용량 초과 → 경고
```

### 3.6 보안 테스트 (Security Tests)

#### 3.6.1 실행 조건
- `TEST_SCOPE`가 'all' 또는 'security'인 경우
- 타임아웃: 5분
- continue-on-error: true

#### 3.6.2 실행 시퀀스
```
1. 보안 헤더 검증
   ├── curl -I http://localhost:5173 실행
   ├── X-Frame-Options, X-Content-Type-Options 등 확인
   ├── 결과: "X security headers found"

2. XSS 취약점 스캔
   ├── grep -r "innerHTML\|dangerouslySetInnerHTML" src/
   ├── 결과: "X potential XSS patterns found"

3. HTTPS 리다이렉트 검증
   ├── 프로토콜 강제 적용 확인
   ├── 민감 데이터 전송 경로 검증
```

## 4. 실패 분석 및 리포트 생성

### 4.1 실패 감지 조건
- 단위 테스트 실패 (exit code !== 0)
- 통합 테스트 실패 (API 호출 실패)
- E2E 테스트 실패 (Playwright assertion 실패)
- 성능 임계값 초과
- 보안 취약점 발견

### 4.2 자동 리포트 생성 시퀀스
```
1. 리포트 초기화
   ├── bug-report.md 파일 생성
   ├── 타임스탬프 및 커밋 정보 기록

2. 실패 분석
   ├── 에러 로그 수집
   ├── 스택 트레이스 파싱
   ├── 영향 범위 평가

3. 권장 조치 생성
   ├── 일반적인 해결 방법 제안
   ├── 관련 파일 및 라인 표시
   ├── 디버깅 단계 안내

4. 아티팩트 업로드
   ├── test-report.md (30일 보관)
   ├── bug-report.md (30일 보관)
   ├── coverage/, playwright-report/ (30일 보관)
```

### 4.3 리포트 내용 구조
```markdown
## 🐛 Bug Report

### 📋 Issue Details
- Date: $(date)
- Workflow: Comprehensive Testing CI
- Commit: ${{ github.sha }}
- Test Scope: $TEST_SCOPE

### 🔍 Failure Analysis
#### Failed Tests:
- [테스트명]: [실패 원인]
- [테스트명]: [실패 원인]

#### Error Logs:
```
상세 에러 로그
```

### 🛠️ Recommended Actions
1. [구체적인 해결 방안]
2. [디버깅 단계]
3. [코드 수정 제안]
```

## 5. 개발 프로세스 통합

### 5.1 CI 테스터 실행 프로세스

#### 5.1.1 자동 실행 (Push/PR)
```
Git Push/PR 발생
    ↓
CI 트리거 (comprehensive-testing.yml)
    ↓
환경 설정 (DB, Node.js, 서버)
    ↓
선택적 테스트 실행 (TEST_SCOPE='all')
    ↓
결과 분석 및 리포트 생성
    ↓
아티팩트 업로드 및 알림
```

#### 5.1.2 수동 실행 (워크플로우 디스패치)
```
GitHub Actions → Comprehensive Testing CI
    ↓
옵션 선택:
  - test_scope: unit/integration/e2e/performance/security
  - enable_bug_report: true/false
    ↓
선택적 테스트 실행
    ↓
결과 분석 및 리포트 생성
```

### 5.2 개발자 워크플로우

#### 5.2.1 기능 개발 시
```
1. 기능 구현
2. 로컬 테스트 (npm test)
3. 커밋 및 푸시
4. CI 자동 실행 대기
5. 결과 확인 및 수정
6. 반복
```

#### 5.2.2 버그 수정 시
```
1. 버그 분석
2. 수정 코드 작성
3. ContentTester로 검증
4. 커밋 및 푸시
5. CI 결과 확인
6. 버그 리포트 검토
```

#### 5.2.3 성능 최적화 시
```
1. 성능 측정 (로컬)
2. 최적화 적용
3. CI 성능 테스트 실행
4. 결과 비교 및 개선
```

## 6. 모니터링 및 유지보수

### 6.1 메트릭 수집
- 테스트 실행 시간 추이
- 성공/실패율 통계
- 커버리지 변화 추이
- 성능 메트릭 추이

### 6.2 유지보수 작업
- 주기적 테스트 업데이트 (주 1회)
- 새로운 취약점 패턴 추가 (월 1회)
- 성능 임계값 조정 (분기별)
- 워크플로우 최적화 (월 1회)

## 7. 확장성 및 미래 계획

### 7.1 추가 테스트 유형
- **부하 테스트**: k6 또는 Artillery 활용
- **접근성 테스트**: axe-core 자동화
- **시각적 회귀 테스트**: Percy 또는 Chromatic
- **API 계약 테스트**: Pact 또는 Spring Cloud Contract

### 7.2 분산 실행
- **병렬 테스트 실행**: GitHub Actions matrix
- **크로스 브라우저 테스트**: BrowserStack 통합
- **모바일 테스트**: Appium 또는 Detox

### 7.3 AI 기반 개선
- **자동 테스트 생성**: AI를 활용한 테스트 코드 생성
- **실패 예측**: 머신러닝 기반 취약점 예측
- **스마트 리포트**: 자연어 기반 분석 및 제안

이 명세서는 CI 테스터의 모든 기능과 동작 시퀀스를 정확하게 정의하며, 개발 프로세스에 완전히 통합될 수 있도록 설계되었습니다.