# Development Process Workflow

이 문서는 기능 요청에서 배포 직전까지 반복 가능한 최소 표준 루프를 정의합니다.

## 0. 용어
- Feature Request: 신규/변경 요구 (Issue 또는 구두)
- Action Plan: 구현 세부 계획 (스코프·아웃스코프 명확화)
- Test Cases: 기능을 검증하는 구체 시나리오 (입력/절차/예상결과)
- DoD(Definition of Done): 기능 완료 판단 기준 체크리스트

## 1. 루프 개요
1. Request 수집 → Feature 명세 초안 작성 (FEATURE_TEMPLATE.md 기반)
2. Action Plan 수립 (작업 단위/순서/리스크/롤백 전략)
3. Test Case 설계 (성공/실패/경계/권한/보안 최소 포함)
4. 구현 (작은 커밋; DB 변경 분리; 테스트 주도)
5. 자동/수동 테스트 실행 (CI script 또는 node --test)
6. 문서 갱신 (API_REFERENCE, DB_SCHEMA, CHANGELOG optional)
7. DoD 체크 후 Close → 다음 요청 반복

## 2. Feature 요청 → 명세 (요약 템플릿)
| 항목               | 내용                              |
| ------------------ | --------------------------------- |
| 제목               | 간결한 기능명                     |
| 배경/문제          | 해결하려는 Pain Point             |
| 목표(Outcome)      | 사용자/시스템 관점 측정 가능 결과 |
| 범위(In Scope)     | 구현 포함 항목 리스트             |
| 제외(Out of Scope) | 이번에 다루지 않는 항목           |
| 의존성             | 다른 서비스/모듈/DB 변경          |
| 리스크 & 대응      | 실패 시 영향 / 완화 전략          |
| 마이그레이션       | 스키마/데이터 이전 절차 (있다면)  |
| 롤백 전략          | 실패 시 되돌리는 방법             |
| 성능/보안 고려     | 임계 QPS, 권한, 취약점 포인트     |
| 환경변수           | 추가/변경 ENV 목록                |

## 3. Action Plan 템플릿
번호 순서대로 수행 가능해야 하며, 병렬 작업 명시.
```
1. Schema: <변경 요약 / DDL>
2. Backend: <파일별 수정 개요>
3. Auth/RBAC: <권한 영향>
4. Tests: <추가/수정 테스트 파일> (happy path + edge)
5. Docs: API_REFERENCE, DB_SCHEMA 업데이트
6. Migration: <실행 커맨드 또는 스크립트>
7. Cleanup: Dead code 제거, TODO 정리
```

## 4. Test Case 설계 가이드
최소 포함 범주:
- Happy Path (정상 흐름)
- Validation Error (잘못된 입력)
- AuthZ/AuthN (권한 & 미인증)
- Edge (경계값, 빈 목록, 0개, 최대 길이)
- Negative (잘못된 토큰, 만료 refresh 등)
- 성능/API 안정(선택: 간단 부하 루프 or latency 측정)

케이스 표 예시:
| ID  | 시나리오                 | 입력            | 절차                      | 예상결과                  |
| --- | ------------------------ | --------------- | ------------------------- | ------------------------- |
| A1  | 첫 사용자 admin 자동승격 | code=abc        | /callback -> /me          | role=admin                |
| A2  | refresh 회전             | refresh=valid   | /refresh                  | 새 access/refresh 발급    |
| A3  | moderator 삭제 차단      | moderator token | DELETE /announcements/:id | 403                       |
| A4  | soft delete 후 목록 제외 | admin token     | create -> delete -> list  | 목록에 미포함             |
| A5  | account linking          | link=1 + bearer | 2nd provider callback     | linked:true & 동일 userId |

## 5. Definition of Done 체크리스트
| 항목                                                       | 상태 |
| ---------------------------------------------------------- | ---- |
| Action Plan 모든 작업 완료                                 |      |
| 새/변경 DB 스키마 반영 & 마이그레이션 스크립트             |      |
| Test Cases 작성 & 모두 통과 (자동)                         |      |
| 주요 실패 케이스(권한/validation) 테스트 포함              |      |
| 문서(API_REFERENCE / DB_SCHEMA / API_USAGE 교차 링크) 갱신 |      |
| 환경변수 문서화                                            |      |
| 린트/빌드 오류 없음                                        |      |
| 위험/롤백 전략 문서화                                      |      |
| 운영 로그/메트릭 지표 추가(필요 시)                        |      |
| TODO/주석 임시비밀번호/비밀 제거                           |      |

## 6. 문서 갱신 규칙
- API_ENDPOINT 추가/변경 시: API_REFERENCE.md 수정 (요청/응답/권한/샘플)
- DB 변경 시: DB_SCHEMA.md 테이블 diff & 마이그레이션 단계 추가
- 새 ENV: README 환경변수 표 또는 별도 CONFIG.md 업데이트
- 배포 전 마지막 커밋 메시지: `feat: <기능> (docs updated)` 또는 `fix:` prefix

## 7. 브랜치 & 커밋 (권장)
| 목적                | 브랜치 패턴    |
| ------------------- | -------------- |
| 기능                | feature/<slug> |
| 핫픽스              | fix/<slug>     |
| 스키마 마이그레이션 | schema/<slug>  |

커밋 메시지 Prefix: feat / fix / refactor / docs / test / chore / perf / build

## 8. 예시 워크플로 (요약)
```
요청 접수 → FEATURE_TEMPLATE 작성
→ Action Plan & Test 표 확정
→ (필요) Schema 변경 먼저 커밋
→ 기능 구현 (작은 단위 커밋 + 테스트 동시 추가)
 → 수동 검증용 테스트 페이지 갱신 (frontend/test-frontend.html 에 신규 기능 테스트 함수 추가 / 간단 항목은 simple-test.html)
→ node --test 전부 통과
→ API_REFERENCE / DB_SCHEMA 갱신
→ DoD 체크 → Merge → 다음 요청
```

## 9. 품질 게이트
- 테스트 100% 성공 (실패 테스트 남기지 않음)
- 중대한 console.error 없음 (고의적 로깅 제외)
- 메트릭/로그 추가 후 과도한 스팸 없는지 1회 점검
- 보안: 새 엔드포인트 권한 필수 여부 검토 + 입력 값 기본 검증

## 10. 향후 확장 아이디어
- 자동 CHANGELOG 생성 (Conventional Commits)
- pre-commit 훅: lint + node --test 빠른 subset
- OpenAPI 스펙 자동 생성 + 문서 호스팅

---

## CI/CD 파이프라인 가이드

### CI/CD 개요
커뮤니티 플랫폼의 지속적 통합 및 배포 파이프라인을 정의합니다. GitHub Actions를 기반으로 한 자동화된 워크플로우를 사용합니다.

### CI 파이프라인 구성

#### 1. 트리거 조건
- **Push 이벤트:** main 브랜치 및 feature 브랜치
- **Pull Request:** main 브랜치 대상 PR
- **수동 트리거:** workflow_dispatch

#### 2. CI 워크플로우 단계

##### 코드 품질 검사 (Code Quality)
```yaml
- name: Lint and Format Check
  run: |
    npm run lint
    npm run format:check
- name: Type Check (Frontend)
  run: |
    cd frontend
    npm run type-check
```

#### 보안 스캔 (Security Scan)
```yaml
- name: Security Audit
  run: |
    npm audit --audit-level high
    npm run security-check
- name: Dependency Check
  run: |
    npx audit-ci --config audit-ci.json
- name: SAST (Static Application Security Testing)
  uses: github/super-linter/slim@v5
  env:
    DEFAULT_BRANCH: main
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
- name: Container Security Scan
  uses: aquasecurity/trivy-action@master
  with:
    scan-type: 'fs'
    scan-ref: '.'
- name: Secret Scanning
  uses: gitleaks/gitleaks-action@v2
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

##### 보안 테스트 케이스

###### TC-SEC-001: 의존성 취약점 검사
**목적:** 타사 라이브러리의 보안 취약점 식별 및 해결

**테스트 단계:**
1. npm audit 실행
2. 취약점 심각도 평가 (Critical, High, Moderate)
3. 취약한 패키지 업데이트 또는 교체
4. 업데이트 후 재테스트

**예상 결과:**
- 모든 Critical/High 취약점 해결
- Moderate 취약점에 대한 완화 전략 수립

###### TC-SEC-002: 정적 코드 분석
**목적:** 코드 내 잠재적 보안 취약점 발견

**테스트 단계:**
1. ESLint 보안 규칙 적용
2. SAST 도구로 코드 스캔
3. SQL 인젝션, XSS, CSRF 취약점 검사
4. 하드코딩된 비밀 정보 검사

**예상 결과:**
- 보안 취약점 0개
- 코드 품질 점수 90% 이상

###### TC-SEC-003: 컨테이너 보안 스캔
**목적:** Docker 이미지의 보안 취약점 검사

**테스트 단계:**
1. Trivy 또는 Clair로 이미지 스캔
2. CVE (Common Vulnerabilities and Exposures) 확인
3. 베이스 이미지 업데이트
4. 불필요한 패키지 제거

**예상 결과:**
- High/Critical CVE 0개
- 이미지 보안 점수 A등급

###### TC-SEC-004: 시크릿 유출 검사
**목적:** 코드에 포함된 민감 정보 유출 방지

**테스트 단계:**
1. Gitleaks로 리포지토리 스캔
2. API 키, 비밀번호, 토큰 검사
3. .env 파일 및 설정 파일 검토
4. 커밋 히스토리 검사

**예상 결과:**
- 민감 정보 유출 0건
- 모든 시크릿 환경 변수화

###### TC-SEC-005: API 보안 테스트
**목적:** REST API 엔드포인트의 보안 취약점 검증

**테스트 케이스:**
| ID          | 시나리오      | 입력                        | 절차              | 예상결과              |
| ----------- | ------------- | --------------------------- | ----------------- | --------------------- |
| API-SEC-001 | SQL 인젝션    | `' OR '1'='1`               | POST /api/login   | 400 Bad Request       |
| API-SEC-002 | XSS 공격      | `<script>alert(1)</script>` | POST /api/posts   | HTML 이스케이프       |
| API-SEC-003 | 인증 우회     | 만료 토큰                   | GET /api/user     | 401 Unauthorized      |
| API-SEC-004 | 권한 상승     | 일반 사용자 토큰            | DELETE /api/admin | 403 Forbidden         |
| API-SEC-005 | Rate Limiting | 100회/분 요청               | GET /api/data     | 429 Too Many Requests |

**테스트 도구:**
```bash
# OWASP ZAP 또는 Postman으로 API 테스트
npm run test:security:api
```

###### TC-SEC-006: 웹 애플리케이션 보안 테스트
**목적:** 프론트엔드 보안 취약점 검증

**테스트 단계:**
1. HTTPS 강제 적용 확인
2. 보안 헤더 설정 검증
3. CSP (Content Security Policy) 확인
4. 쿠키 보안 설정 검사
5. 클릭재킹 방지 테스트

**보안 헤더 체크:**
```yaml
- name: Security Headers Check
  run: |
    curl -I https://staging.example.com | grep -E "(Strict-Transport-Security|Content-Security-Policy|X-Frame-Options|X-Content-Type-Options)"
```

###### TC-SEC-007: 데이터베이스 보안 테스트
**목적:** 데이터베이스 접근 및 데이터 유출 방지

**테스트 케이스:**
- SQL 인젝션 방지
- 민감 데이터 암호화
- 접근 권한 최소화
- 백업 데이터 보안

**테스트 도구:**
```sql
-- SQLMap으로 인젝션 테스트
sqlmap -u "http://localhost:50000/api/posts?id=1" --batch
```

###### TC-SEC-008: 네트워크 보안 테스트
**목적:** 네트워크 레벨 보안 취약점 검증

**테스트 단계:**
1. 포트 스캔 (불필요한 포트 폐쇄)
2. SSL/TLS 설정 검증
3. 방화벽 규칙 확인
4. DDoS 방어 메커니즘 테스트

**테스트 도구:**
```bash
# Nmap으로 포트 스캔
nmap -sV -p- localhost

# SSL Labs로 SSL 테스트
ssllabs-scan staging.example.com
```

###### TC-SEC-009: CI/CD 파이프라인 보안
**목적:** 빌드 및 배포 과정의 보안 검증

**테스트 단계:**
1. 시크릿 관리 안전성 확인
2. 빌드 환경 격리 검증
3. 서명된 커밋 요구
4. 배포 권한 최소화

**보안 모범 사례:**
```yaml
# GitHub Actions에서 시크릿 사용
- name: Deploy
  env:
    API_KEY: ${{ secrets.API_KEY }}
  run: |
    # 시크릿 직접 출력 금지
    echo "API_KEY is set: $(if [ -n "$API_KEY" ]; then echo 'yes'; else echo 'no'; fi)"
```

###### TC-SEC-010: 침투 테스트 (Penetration Testing)
**목적:** 실제 공격 시나리오 기반 취약점 발견

**테스트 범위:**
- 웹 애플리케이션
- API 엔드포인트
- 데이터베이스
- 인프라 구성

**테스트 방법:**
1. 자동화된 스캔 (Nessus, OpenVAS)
2. 수동 테스트 (Burp Suite, OWASP ZAP)
3. 사회 공학 공격 시뮬레이션

**보고서 생성:**
- 발견된 취약점 목록
- 심각도 평가
- 해결 권고사항
- 재테스트 계획

### 보안 모니터링 및 대응

#### 실시간 모니터링
```yaml
- name: Security Monitoring
  run: |
    # 로그 분석
    npm run analyze:logs
    
    # 이상 감지
    npm run detect:anomalies
    
    # 알림 발송
    npm run alert:security
```

#### 인시던트 대응 계획
1. **탐지:** 보안 이벤트 모니터링
2. **평가:** 영향도 및 심각도 평가
3. **격리:** 영향받은 시스템 격리
4. **복구:** 백업에서 복원
5. **보고:** 이해관계자 및当局에 보고
6. **개선:** 사후 분석 및 개선

#### 보안 교육 및 인식
- **개발자 교육:** 정기적 보안 교육
- **코드 리뷰:** 보안 관점 코드 리뷰
- **보안 챌린지:** CTF (Capture The Flag) 이벤트

##### 테스트 실행 (Testing)
```yaml
- name: Unit Tests
  run: |
    npm test
    npm run test:coverage
- name: Integration Tests
  run: |
    npm run test:integration
- name: E2E Tests
  run: |
    npm run test:e2e
```

##### 빌드 및 패키징 (Build & Package)
```yaml
- name: Build Frontend
  run: |
    cd frontend
    npm run build
- name: Build Backend
  run: |
    npm run build
- name: Create Artifacts
  uses: actions/upload-artifact@v3
  with:
    name: build-artifacts
    path: |
      frontend/dist/
      server-backend/dist/
```

### CD 파이프라인 구성

#### 배포 전략
- **Staging 환경:** feature 브랜치 머지 시 자동 배포
- **Production 환경:** main 브랜치 태그 푸시 시 수동 승인 후 배포
- **롤백 전략:** 이전 버전으로 즉시 롤백 가능

#### 배포 워크플로우
```yaml
- name: Deploy to Staging
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  run: |
    ./scripts/deploy-staging.sh

- name: Deploy to Production
  if: github.ref == 'refs/heads/main' && contains(github.ref, 'tags/v')
  run: |
    ./scripts/deploy-production.sh
```

### 품질 게이트 강화

#### 코드 커버리지 요구사항
- **Backend:** 80% 이상 라인 커버리지
- **Frontend:** 70% 이상 브랜치 커버리지
- **Critical Path:** 90% 이상 커버리지

#### 성능 벤치마크
```yaml
- name: Performance Test
  run: |
    npm run benchmark
    # API 응답 시간 < 200ms
    # 페이지 로딩 시간 < 3초
    # 메모리 사용량 < 512MB
```

#### 접근성 검사
```yaml
- name: Accessibility Check
  run: |
    npm run accessibility-test
    # WCAG 2.1 AA 준수
    # Lighthouse 접근성 점수 > 90
```

### 모니터링 및 알림

#### 상태 모니터링
- **헬스 체크:** `/api/health` 엔드포인트 모니터링
- **에러 트래킹:** Sentry 또는 유사 도구 연동
- **성능 메트릭:** New Relic 또는 Prometheus

#### 알림 설정
```yaml
- name: Notify on Failure
  if: failure()
  run: |
    # Slack 알림
    # 이메일 알림
    # GitHub Issue 생성
```

### 환경별 설정

#### 개발 환경 (Development)
- 로컬 개발 서버 자동 시작
- 핫 리로드 활성화
- 디버그 로깅

#### 스테이징 환경 (Staging)
- 프로덕션과 동일 설정
- 테스트 데이터 사용
- 외부 접근 제한

#### 프로덕션 환경 (Production)
- 최적화된 빌드
- 보안 강화 설정
- 모니터링 강화

### 배포 자동화 스크립트

#### deploy-staging.sh
```bash
#!/bin/bash
set -e

echo "🚀 Deploying to Staging..."

# Docker 이미지 빌드
docker build -t community-app:staging .

# 컨테이너 중지 및 제거
docker stop community-staging || true
docker rm community-staging || true

# 새 컨테이너 실행
docker run -d \
  --name community-staging \
  -p 5000:5000 \
  -p 50000:50000 \
  --env-file .env.staging \
  community-app:staging

echo "✅ Staging deployment completed"
```

#### deploy-production.sh
```bash
#!/bin/bash
set -e

echo "🚀 Deploying to Production..."

# 블루-그린 배포 또는 롤링 업데이트
# 로드 밸런서 설정
# 데이터베이스 마이그레이션
# 캐시 무효화

echo "✅ Production deployment completed"
```

### CI/CD 모범 사례

#### 브랜치 전략
- **main:** 프로덕션 준비된 코드
- **develop:** 통합 브랜치
- **feature/***: 기능 개발 브랜치
- **hotfix/***: 긴급 수정 브랜치

#### 커밋 메시지 규칙
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 업데이트
style: 코드 스타일 수정
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드/설정 변경
```

#### PR 템플릿
```markdown
## 변경 사항
- [ ] 새로운 기능
- [ ] 버그 수정
- [ ] 문서 업데이트

## 테스트
- [ ] 단위 테스트 통과
- [ ] 통합 테스트 통과
- [ ] 수동 테스트 완료

## 배포 영향
- [ ] 데이터베이스 변경
- [ ] API 변경
- [ ] 환경 변수 추가
```

### 문제 해결 가이드

#### 일반적인 CI 실패 원인
- **빌드 실패:** 의존성 문제 또는 컴파일 오류
- **테스트 실패:** 코드 변경으로 인한 테스트 깨짐
- **배포 실패:** 환경 설정 문제 또는 권한 부족

#### 디버깅 팁
- **로그 확인:** GitHub Actions 로그 상세 확인
- **로컬 재현:** 동일 환경에서 로컬 테스트
- **캐시 문제:** node_modules 캐시 삭제 후 재시도

#### 유지보수
- **워크플로우 업데이트:** 정기적 GitHub Actions 버전 업데이트
- **보안 패치:** 의존성 취약점 모니터링 및 패치
- **성능 최적화:** 빌드 시간 모니터링 및 최적화
