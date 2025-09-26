# CI/CD 파이프라인 가이드

이 문서는 Community 프로젝트의 CI/CD 파이프라인 구성과 동작 방식을 설명합니다.

## 📋 목차
- [현재 CI/CD 아키텍처](#현재-ci/cd-아키텍처)
- [GitHub Actions 워크플로우](#github-actions-워크플로우)
- [로컬 개발 환경 스크립트](#로컬-개발-환경-스크립트)
- [테스트 전략](#테스트-전략)
- [배포 전략](#배포-전략)
- [모니터링 및 알림](#모니터링-및-알림)

## 🏗️ 현재 CI/CD 아키텍처

### 인프라 구성
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub Push   │ -> │ GitHub Actions  │ -> │   Test Results  │
│   / PR Merge    │    │   (Ubuntu)      │    │   Artifacts     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   MariaDB 10.6  │
                       │   (Test DB)     │
                       └─────────────────┘
```

### 기술 스택
- **CI/CD 플랫폼**: GitHub Actions
- **테스트 환경**: Ubuntu 22.04 LTS
- **데이터베이스**: MariaDB 10.6 (서비스 컨테이너)
- **런타임**: Node.js 20.x
- **테스트 프레임워크**: Playwright, Jest, Node.js 내장 테스트
- **코드 품질**: ESLint, Contrast (접근성 감사)

## 🔄 GitHub Actions 워크플로우

### 1. CI 워크플로우 (`ci.yml`)

#### 트리거 조건
```yaml
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
```

#### 주요 단계

##### 1. 환경 설정
- **MariaDB 서비스**: 테스트용 데이터베이스 컨테이너 실행
- **Node.js 20**: 백엔드/프론트엔드 캐시 설정
- **환경 변수**: 데이터베이스 연결 정보 및 포트 설정

##### 2. 의존성 설치
```bash
# 백엔드 의존성
cd server-backend && npm install

# 프론트엔드 의존성
cd frontend && npm install
```

##### 3. 프론트엔드 빌드
```bash
cd frontend && npm run build
```

##### 4. 백엔드 서버 테스트
```bash
# Mock 서버 시작
node mock-server.js &

# 헬스체크
curl -f http://localhost:50000/api/health

# 통합 테스트 실행
node tests/api-random.js
```

##### 5. 프론트엔드 테스트
```bash
# 프리뷰 서버 시작
npm run preview &

# 헬스체크
curl -f http://localhost:5173

# 단위 테스트
npm test
```

##### 6. E2E 테스트 (Playwright)
```bash
# 서버들 시작
cd server-backend && node mock-server.js &
cd ../frontend && npm run preview &

# Playwright 실행
npx playwright install --with-deps
npx playwright test --reporter=json
```

##### 7. 결과 수집
- 테스트 결과 JSON 파일 생성
- Playwright HTML 리포트 생성
- 아티팩트 업로드 (GitHub Actions)

### 2. Contrast 감사 워크플로우 (`contrast.yml`)

#### 목적
- 웹 접근성 및 색상 대비 검사
- 자동화된 접근성 감사

#### 실행 조건
```yaml
on:
  pull_request: {}
  push:
    branches: [ main, master ]
```

## 🖥️ 로컬 개발 환경 스크립트

### 배치 스크립트 (`scripts/*.bat`)

#### `start-all.bat`
```batch
@echo off
echo Starting Community Full Stack Application...

REM 기존 프로세스 정리
set PORTS=50000 5000
for %%P in (%PORTS%) do (
  powershell -Command "Get-NetTCPConnection -LocalPort %%P -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"
)

REM 백엔드 시작
start "Backend" cmd /c "cd server-backend && node src/index.js"

REM 프론트엔드 시작 (5초 대기)
timeout /t 5 /nobreak > nul
start "Frontend" cmd /c "cd frontend && npm run dev"
```

#### `stop-all.bat`
```batch
@echo off
echo Stopping all Community servers...

REM 포트별 프로세스 종료
set PORTS=50000 5000 9323
for %%P in (%PORTS%) do (
  powershell -Command "Get-NetTCPConnection -LocalPort %%P -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"
)

REM 잔여 Node 프로세스 정리
powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"
```

#### `run-all.bat`
```batch
@echo off
echo Running full development environment...

REM 백엔드와 프론트엔드 동시에 시작
start "Backend" cmd /c "cd server-backend && node mock-server.js"
start "Frontend" cmd /c "cd frontend && npm run dev"

echo Servers starting...
echo Backend: http://localhost:50000
echo Frontend: http://localhost:5002
```

### PowerShell 스크립트 (`scripts/*.ps1`)

#### 주요 특징
- Windows PowerShell 5.1+ 호환
- 더 정교한 프로세스 관리
- 실행 정책 설정 필요 (`Set-ExecutionPolicy RemoteSigned`)

## 🧪 테스트 전략

### 1. 백엔드 테스트
- **API 통합 테스트**: `tests/api-random.js`
- **목업 서버**: `mock-server.js` (실제 DB 없이 테스트)
- **헬스체크**: `/api/health` 엔드포인트 검증

### 2. 프론트엔드 테스트
- **단위 테스트**: Jest + React Testing Library
- **빌드 테스트**: Vite 프로덕션 빌드 검증
- **프리뷰 테스트**: `npm run preview` 정적 파일 서빙

### 3. E2E 테스트
- **Playwright**: 브라우저 자동화 테스트
- **시나리오**: 사용자 플로우 검증 (등록, 로그인, 포스트 작성 등)
- **병렬 실행**: Chromium, Firefox, WebKit

### 4. 접근성 테스트
- **Contrast**: 색상 대비 및 접근성 검사
- **자동화**: PR 및 푸시마다 실행

## 🚀 배포 전략

### 현재 배포 아키텍처
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub Push   │ -> │  Docker Build   │ -> │  Image Push     │
│   (main branch) │    │  (GitHub Actions)│    │  (GHCR)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Production    │
                       │   Server        │
                       │   (SSH Deploy)  │
                       └─────────────────┘
```

### Docker 기반 배포

#### 1. 컨테이너화 구성
- **백엔드**: Node.js 20 + Express (포트 50000)
- **프론트엔드**: Nginx + React SPA (포트 80)
- **데이터베이스**: MariaDB 10.6 (프로덕션)
- **캐시**: Redis 7 (세션 및 캐시)

#### 2. 배포 워크플로우 (`deploy.yml`)

##### 트리거 조건
```yaml
on:
  push:
    branches: [ main, master ]
  workflow_dispatch:
    inputs:
      environment: production | staging
```

##### 주요 단계
1. **이미지 빌드**: 백엔드/프론트엔드 Docker 이미지 생성
2. **보안 스캔**: 컨테이너 이미지 취약점 검사
3. **레지스트리 푸시**: GitHub Container Registry (GHCR)
4. **프로덕션 배포**: SSH를 통한 원격 서버 배포
5. **헬스체크**: 배포 후 서비스 상태 확인
6. **롤백**: 실패 시 자동 롤백

#### 3. 로컬 배포 스크립트

##### PowerShell 스크립트 (`scripts/deploy.ps1`)
```powershell
# 사용법
.\scripts\deploy.ps1 -Action deploy -Production
.\scripts\deploy.ps1 -Action status
```

##### 배치 스크립트 (`scripts/deploy.bat`)
```batch
REM 사용법
deploy.bat deploy -prod
deploy.bat status
```

##### 지원하는 명령어
- `build`: Docker 이미지 빌드
- `up`: 서비스 시작
- `down`: 서비스 중지
- `restart`: 서비스 재시작
- `logs`: 로그 조회
- `status`: 상태 확인
- `deploy`: 전체 배포 (빌드 → 중지 → 시작 → 헬스체크)

### 환경별 구성

#### 개발 환경 (`docker-compose.yml`)
- **볼륨 마운트**: 소스 코드 실시간 반영
- **디버그 모드**: 상세 로깅 및 개발 도구 활성화
- **포트 포워딩**: 로컬 접근을 위한 포트 노출

#### 프로덕션 환경 (`docker-compose.prod.yml`)
- **보안 강화**: 읽기 전용 파일시스템, no-new-privileges
- **리소스 제한**: 메모리/CPU 제한 설정
- **헬스체크**: 자동화된 상태 모니터링
- **로깅**: JSON 형식 구조화된 로그

### 배포 검증

#### 헬스체크 엔드포인트
```bash
# 백엔드 헬스체크
curl -f http://localhost:50000/api/health

# 응답 형식
{
  "status": "healthy",
  "timestamp": "2025-01-26T10:00:00Z",
  "version": "1.0.0"
}
```

#### 배포 후 확인사항
- [ ] 백엔드 API 응답 확인
- [ ] 프론트엔드 페이지 로딩 확인
- [ ] 데이터베이스 연결 상태 확인
- [ ] 로그 파일 오류 없음 확인
- [ ] 모니터링 대시보드 정상 동작 확인

## 📊 모니터링 및 알림

### 현재 모니터링
- **GitHub Actions 로그**: CI/CD 실행 결과
- **테스트 리포트**: JUnit/XML 형식 결과물
- **아티팩트 저장**: 테스트 결과 및 로그 보관

### 개선 필요사항
- **성능 메트릭**: 응답 시간, 메모리 사용량
- **에러 추적**: Sentry 또는 유사 도구
- **알림 시스템**: Slack/Discord 웹훅
- **대시보드**: Grafana + Prometheus

## 🔧 문제 해결 가이드

### CI 실패 시 체크리스트
1. **로그 확인**: GitHub Actions → Actions 탭
2. **아티팩트 다운로드**: test-results, playwright-report
3. **로컬 재현**: 동일 환경에서 테스트 실행
4. **환경 변수**: CI=true 설정 확인

### 자주 발생하는 문제
- **포트 충돌**: 50000, 5002, 5173 포트 점유 확인
- **DB 연결 실패**: MariaDB 헬스체크 실패
- **빌드 실패**: Node.js 버전 또는 의존성 문제
- **테스트 타임아웃**: 15분 제한 내 완료되지 않음

## 📈 다음 단계 계획

### 단기 (1-2주)
- [ ] CI 실패 원인 분석 및 수정
- [ ] 로컬 스크립트 통합 개선
- [ ] 테스트 커버리지 리포트 추가

### 중기 (1-3개월)
- [x] Docker 컨테이너화 ✅ **완료**
- [x] 클라우드 배포 파이프라인 구축 ✅ **완료** (GitHub Actions)
- [ ] 모니터링 시스템 도입 (진행 중)
- [ ] 고가용성 및 확장성 확보

### 장기 (3-6개월)
- [ ] 마이크로서비스 아키텍처 전환
- [ ] Kubernetes 오케스트레이션
- [ ] 고가용성 및 확장성 확보

---

## 🎉 배포 자동화 구현 완료

### 완료된 작업
1. **Docker 컨테이너화** ✅
   - 백엔드 Node.js 컨테이너화 (포트 50000)
   - 프론트엔드 Nginx 컨테이너화 (포트 80 → 3000)
   - 헬스체크 및 보안 설정 적용

2. **Docker Compose 구성** ✅
   - 개발 환경 (`docker-compose.yml`)
   - 프로덕션 환경 (`docker-compose.prod.yml`)
   - 서비스 간 네트워킹 및 의존성 설정

3. **배포 스크립트 개발** ✅
   - PowerShell 스크립트 (`scripts/deploy.ps1`)
   - 배치 스크립트 (`scripts/deploy.bat`)
   - 빌드/배포/모니터링 기능 통합

4. **CI/CD 파이프라인 구축** ✅
   - GitHub Actions 배포 워크플로우 (`.github/workflows/deploy.yml`)
   - Docker 이미지 자동 빌드 및 푸시
   - 프로덕션 서버 SSH 배포 지원

5. **문서화 및 가이드** ✅
   - CI/CD 가이드 업데이트
   - README 배포 섹션 추가
   - 환경 변수 템플릿 제공

### 사용 방법
```bash
# 로컬 Docker 배포
.\scripts\deploy.ps1 -Action deploy

# 프로덕션 배포 (GitHub Actions)
# main 브랜치에 푸시하거나 수동 트리거
```

### 다음 단계
- [x] **환경별 시크릿 관리** ✅ ([환경 설정 가이드](../docs/environment-setup.md))
- Slack 알림 시스템 구축
- 응답 시간 모니터링 추가
- 배포 롤백 자동화 개선

*문서 버전: 1.0 | 최종 업데이트: 2025-09-26 | 작성자: CI/CD 분석팀*</content>
<parameter name="filePath">c:\Users\hwi\Desktop\Projects\community\CI_CD_GUIDE.md