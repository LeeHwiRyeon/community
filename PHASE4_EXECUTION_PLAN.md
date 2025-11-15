# Phase 4: 코드 품질 및 프로덕션 준비 - 실행 계획

**프로젝트**: TheNewspaper Community Platform  
**Phase**: 4 - Code Quality & Production Readiness  
**시작일**: 2025-11-10  
**예상 완료**: 2025-11-17 (7일)

---

## 📋 Phase 4 개요

### 목표
Phase 3에서 구현한 PWA 및 성능 최적화를 기반으로, 코드 품질 개선과 프로덕션 배포 준비를 완료합니다.

### 현재 상황
- ✅ Phase 3 완료: PWA 구현, 성능 최적화
- ⚠️ TypeScript 타입 오류: 84개 (빌드 차단)
- ⚠️ 누락된 컴포넌트 파일: 8개
- ⚠️ MUI Grid v2 API 미적용
- ✅ 번들 크기: 2.06MB (gzip: ~320KB)

---

## 🎯 Phase 4 Task 목록

### Priority: 🔴 Critical

#### Task #1: TypeScript 타입 오류 수정
**상태**: Not Started  
**우선순위**: 🔴 Critical  
**예상 소요**: 2-3일  
**담당**: GitHub Copilot

**목표**: 84개 TypeScript 타입 오류 모두 수정

**주요 오류 카테고리**:
1. **Missing Module Errors** (8개)
   - `NotificationCenter.tsx` 누락
   - `NotificationItem.tsx` 누락
   - `ProfileEditor.tsx` 누락
   - `OverviewCards.tsx` 누락
   - `ActivityChart.tsx` 누락
   - `CategoryPieChart.tsx` 누락
   - `ActivityFeed.tsx` 누락 (CSS는 있음)
   - `socialService.ts` 누락

2. **MUI Grid v2 API Issues** (~30개)
   - `item` prop 제거 필요
   - `xs`, `sm`, `md` props 직접 사용
   - 영향받는 파일:
     * `BlockedUsersList.tsx`
     * `MentionInput.tsx`
     * 기타 Grid 사용 컴포넌트들

3. **Import Issues** (~10개)
   - `apiClient` default import 문제
   - Generic type 인수 문제
   - Type definition 누락

4. **Vite Config Issues** (2개)
   - `fastRefresh` deprecated
   - `https` type mismatch

5. **Python/Backend Issues** (~34개)
   - 별도 처리 (Phase 4 후반 또는 Phase 5)

**작업 순서**:
1. 누락된 컴포넌트 생성 (Task #2)
2. MUI Grid v2 Migration (Task #3)
3. Import 문제 수정
4. Vite 설정 최적화 (Task #4)
5. 전체 타입 체크 및 검증

---

#### Task #2: 누락된 컴포넌트 파일 생성
**상태**: Not Started  
**우선순위**: 🔴 Critical  
**예상 소요**: 1일  
**의존성**: 없음

**생성할 파일** (8개):

1. **NotificationCenter.tsx**
   - 위치: `frontend/src/components/`
   - 기능: 알림 센터 메인 컴포넌트
   - 의존: NotificationItem

2. **NotificationItem.tsx**
   - 위치: `frontend/src/components/`
   - 기능: 개별 알림 아이템
   - Props: notification object, onClick handler

3. **ProfileEditor.tsx**
   - 위치: `frontend/src/components/profile/`
   - 기능: 프로필 편집 폼
   - Props: ProfileUpdateData, onSave

4. **OverviewCards.tsx**
   - 위치: `frontend/src/components/Dashboard/`
   - 기능: 대시보드 요약 카드들
   - Props: stats object

5. **ActivityChart.tsx**
   - 위치: `frontend/src/components/Dashboard/`
   - 기능: 활동 차트 (Recharts)
   - Props: data array

6. **CategoryPieChart.tsx**
   - 위치: `frontend/src/components/Dashboard/`
   - 기능: 카테고리 파이 차트
   - Props: categories data

7. **ActivityFeed.tsx**
   - 위치: `frontend/src/components/Dashboard/`
   - 기능: 활동 피드 리스트
   - 참고: CSS 파일 있음
   - Props: activities array

8. **socialService.ts**
   - 위치: `frontend/src/services/`
   - 기능: 팔로우/언팔로우 API
   - 함수: followUser, unfollowUser, checkFollowStatus

**작업 단계**:
1. 각 컴포넌트의 사용처 분석 (import 구문)
2. 필요한 Props 타입 정의
3. 기본 구조 구현
4. API 연동 (필요 시)
5. 스타일링 (Material-UI)

---

#### Task #3: MUI Grid v2 Migration
**상태**: Not Started  
**우선순위**: 🔴 Critical  
**예상 소요**: 1일  
**의존성**: Task #2 완료

**배경**:
Material-UI v6부터 Grid v2가 기본이 되면서 API가 변경됨:
- `item` prop 제거
- `xs`, `sm`, `md` 등을 직접 사용
- `container` prop 여전히 사용

**변경 예시**:
```tsx
// Before (Grid v1)
<Grid container spacing={2}>
  <Grid item xs={12} sm={6}>
    <Card />
  </Grid>
</Grid>

// After (Grid v2)
<Grid container spacing={2}>
  <Grid xs={12} sm={6}>
    <Card />
  </Grid>
</Grid>
```

**영향받는 파일** (확인 필요):
- `BlockedUsersList.tsx` ✅ 확인됨
- `MentionInput.tsx` (ListItem도 수정 필요)
- 기타 Grid 사용 컴포넌트들

**작업 단계**:
1. 전체 Grid 사용처 검색: `grep_search`
2. Grid v1 패턴 식별: `item` prop 사용처
3. 일괄 변환 스크립트 작성 (선택)
4. 수동 변환 및 검증
5. 빌드 테스트

---

### Priority: 🟡 High

#### Task #4: Vite 설정 최적화
**상태**: Not Started  
**우선순위**: 🟡 High  
**예상 소요**: 0.5일  
**의존성**: 없음

**수정할 설정**:

1. **React Plugin 설정**
   ```typescript
   // 제거: fastRefresh (deprecated)
   react({
     jsxRuntime: 'automatic',
     babel: {
       plugins: []
     }
   })
   ```

2. **HTTPS 설정**
   ```typescript
   // 수정: type mismatch
   server: {
     https: undefined  // 또는 완전히 제거
   }
   ```

3. **최적화 옵션 검토**
   - minification 설정
   - chunk size 설정
   - 기타 성능 옵션

**작업 단계**:
1. vite.config.ts 오류 수정
2. 최신 Vite/React plugin 문서 참조
3. 빌드 테스트
4. Preview 테스트

---

#### Task #5: 프로덕션 빌드 안정화
**상태**: Not Started  
**우선순위**: 🟡 High  
**예상 소요**: 1일  
**의존성**: Task #1, #2, #3, #4 완료

**목표**: 타입 체크 포함 빌드 성공

**검증 항목**:
1. **TypeScript 컴파일**
   ```bash
   npm run build:with-typecheck
   ```
   - 0개 오류 목표
   - 경고는 허용 (문서화)

2. **프로덕션 빌드**
   ```bash
   npm run build
   ```
   - 성공적 빌드
   - 번들 크기 유지 (~2.06MB)
   - Source maps 생성

3. **Preview 테스트**
   ```bash
   npm run preview
   ```
   - 정상 실행
   - Service Worker 동작
   - 오프라인 모드 테스트

4. **번들 분석**
   ```bash
   ANALYZE=true npm run build
   ```
   - stats.html 생성
   - 번들 구성 검토
   - 최적화 기회 식별

**성공 기준**:
- ✅ 타입 오류 0개
- ✅ 빌드 성공
- ✅ 번들 크기 < 2.5MB
- ✅ Gzip < 400KB
- ✅ 모든 청크 정상 로드

---

### Priority: 🟢 Medium

#### Task #6: 성능 최적화 (추가)
**상태**: Not Started  
**우선순위**: 🟢 Medium  
**예상 소요**: 2일  
**의존성**: Task #5 완료

**최적화 항목**:

1. **Critical CSS 추출**
   - 도구: `critical` npm package
   - 목표: 초기 렌더링 CSS만 인라인
   - 예상 효과: FCP -0.2~0.3초

2. **Font Display 최적화**
   ```css
   @font-face {
     font-family: 'Roboto';
     font-display: swap;  /* 또는 optional */
   }
   ```
   - FOIT/FOUT 방지
   - 예상 효과: LCP -0.1~0.2초

3. **Resource Hints**
   ```html
   <link rel="preload" href="/fonts/roboto.woff2" as="font" crossorigin>
   <link rel="modulepreload" href="/src/main.tsx">
   ```
   - 중요 리소스 preload
   - 예상 효과: TTI -0.2~0.3초

4. **HTTP/2 설정 준비**
   - Server Push 후보 식별
   - Multiplexing 활용 계획

**작업 단계**:
1. Lighthouse 재측정 (베이스라인)
2. 각 최적화 적용
3. 측정 및 비교
4. 문서화

**목표 점수**:
- Performance: 90+ (Mobile), 95+ (Desktop)
- PWA: 95+
- Accessibility: 100
- Best Practices: 95+
- SEO: 100

---

#### Task #7: E2E 테스트 기반 구축
**상태**: Not Started  
**우선순위**: 🟢 Medium  
**예상 소요**: 2일  
**의존성**: Task #5 완료

**도구**: Playwright (이미 설치됨)

**테스트 시나리오**:

1. **인증 플로우**
   - 로그인
   - 회원가입
   - 로그아웃
   - 비밀번호 재설정

2. **게시글 CRUD**
   - 게시글 작성
   - 게시글 조회
   - 게시글 수정
   - 게시글 삭제

3. **댓글 기능**
   - 댓글 작성
   - 댓글 수정
   - 댓글 삭제
   - 대댓글

4. **PWA 기능**
   - Service Worker 등록
   - 오프라인 모드
   - 캐싱 동작

**디렉토리 구조**:
```
tests/
├── e2e/
│   ├── auth.spec.ts
│   ├── posts.spec.ts
│   ├── comments.spec.ts
│   └── pwa.spec.ts
├── fixtures/
│   └── test-data.ts
└── playwright.config.ts
```

**CI/CD 통합**:
- GitHub Actions에 E2E 테스트 추가
- PR마다 자동 실행
- 실패 시 스크린샷 저장

---

### Priority: 🔵 Low

#### Task #8: 프로덕션 배포 준비
**상태**: Not Started  
**우선순위**: 🔵 Low  
**예상 소요**: 2일  
**의존성**: Task #5 완료

**준비 항목**:

1. **환경 변수 설정**
   - `.env.production` 생성
   - 필수 변수 문서화
   - Secret 관리 계획

2. **HTTPS 설정**
   - SSL 인증서 선택 (Let's Encrypt)
   - 자동 갱신 설정
   - HTTP → HTTPS 리디렉션

3. **도메인 연결**
   - 도메인 구매/설정
   - DNS 설정
   - CDN 연동 (선택)

4. **Docker 최적화**
   - Multi-stage build
   - 이미지 크기 최적화
   - Health check 추가

5. **배포 문서**
   - 배포 절차서
   - 롤백 절차
   - 모니터링 계획

**배포 전 체크리스트**:
- [ ] 모든 타입 오류 수정
- [ ] E2E 테스트 통과
- [ ] Lighthouse 점수 목표 달성
- [ ] 환경 변수 설정 완료
- [ ] HTTPS 설정 완료
- [ ] 도메인 연결 완료
- [ ] 백업 계획 수립
- [ ] 모니터링 도구 설정

---

## 📅 일정 계획

### Week 1 (Day 1-3): Critical Tasks
- **Day 1**: Task #2 (누락 컴포넌트 생성)
- **Day 2**: Task #3 (MUI Migration) + Task #4 (Vite 설정)
- **Day 3**: Task #1 (타입 오류 수정 완료)

### Week 1 (Day 4-5): High Priority
- **Day 4**: Task #5 (빌드 안정화 및 검증)
- **Day 5**: Task #6 시작 (성능 최적화)

### Week 2 (Day 6-7): Medium/Low Priority
- **Day 6**: Task #6 완료 + Task #7 시작
- **Day 7**: Task #7 완료 + Task #8 시작 (시간 허용 시)

---

## 🎯 성공 지표

### 코드 품질
- ✅ TypeScript 오류: 0개
- ✅ ESLint 경고: < 10개
- ✅ 테스트 커버리지: > 60%

### 성능
- ✅ Bundle Size: < 2.5MB
- ✅ Gzip Size: < 400KB
- ✅ Lighthouse Performance: > 90 (Mobile)
- ✅ Lighthouse PWA: > 95

### 안정성
- ✅ 프로덕션 빌드: 성공
- ✅ E2E 테스트: 통과
- ✅ 오프라인 모드: 동작
- ✅ Service Worker: 정상

---

## 🚧 알려진 제약사항

### Phase 4에서 제외
1. **Python/Backend 타입 오류** (~34개)
   - FastAPI import 오류
   - 별도 Python 환경 설정 필요
   - Phase 5 또는 별도 처리

2. **PWA 고급 기능**
   - Push Notifications
   - Background Sync
   - Phase 5로 연기

3. **실제 프로덕션 배포**
   - 도메인/서버 준비 필요
   - Phase 5 또는 별도 처리

---

## 📊 리스크 관리

### High Risk
- **타입 오류 수정 실패**: 빌드 차단
  - 완화: 단계적 접근, 우선순위별 처리
  
- **MUI Migration 부작용**: UI 깨짐
  - 완화: 철저한 테스트, 점진적 적용

### Medium Risk
- **성능 저하**: 최적화 역효과
  - 완화: 측정 기반 최적화, 롤백 가능

- **E2E 테스트 불안정**: Flaky tests
  - 완화: Retry 로직, 명확한 선택자

### Low Risk
- **일정 지연**: 예상보다 오래 걸림
  - 완화: 우선순위 관리, Task 분할

---

## ✅ Phase 4 완료 조건

### Must Have (필수)
1. ✅ TypeScript 타입 오류 0개
2. ✅ 프로덕션 빌드 성공
3. ✅ 누락 컴포넌트 모두 생성
4. ✅ MUI Grid v2 완전 적용

### Should Have (권장)
5. ✅ E2E 테스트 기본 시나리오
6. ✅ Lighthouse 성능 90+
7. ✅ 빌드 시간 < 30초

### Nice to Have (선택)
8. ⭐ PWA 고급 기능
9. ⭐ CDN 설정
10. ⭐ 모니터링 도구

---

## 📝 다음 단계

### Phase 4 완료 후
1. Phase 4 최종 보고서 작성
2. Phase 5 계획 수립
3. 프로덕션 배포 또는 추가 기능 개발

### Phase 5 예상 주제
- 고급 PWA 기능 (Push, Sync)
- 실시간 기능 강화
- 분석 및 모니터링
- 성능 튜닝
- 보안 강화

---

**계획 수립일**: 2025-11-10  
**작성자**: GitHub Copilot  
**상태**: 📋 계획 완료, 실행 대기

**다음 액션**: Task #2 (누락 컴포넌트 생성) 시작
