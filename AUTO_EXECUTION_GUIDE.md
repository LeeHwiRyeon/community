# 자동 실행 가이드

> **Created**: 2025-09-29  
> **Status**: Ready for Use  
> **Version**: 1.0.0

## 🎯 개요

현재 구현된 모든 자동화 시스템의 실행 방법을 정리한 가이드입니다.

## 🚀 주요 자동화 시스템

### 1. 매니저 입력 기반 자동 Task 생성 시스템

#### 빠른 Task 생성 (가장 간단)
```bash
# 터미널에서 바로바로 Task 생성
node quick-task.js "작업 요청"

# Windows 배치 스크립트
task.bat "작업 요청"

# 예시
node quick-task.js "로그인 버그 수정해줘"
task.bat "새로운 기능 추가"
```

#### 통합 매니저 인터페이스
```bash
# 콘솔 인터페이스
manager-console.bat

# 웹 인터페이스 (브라우저에서 http://localhost:3001)
start-manager-interface.bat
```

### 2. 자동 진행 서비스

#### 기본 자동 진행
```bash
# 자동 진행 서비스 시작
start-auto-progress.bat

# 자동 진행 서비스 중지
stop-auto-progress.bat

# 상태 확인
check-status.bat
```

#### 고급 자동 진행
```bash
# 향상된 콘솔 관리
enhanced-console-management.bat

# 간단한 콘솔 관리
simple-console-management.bat
```

### 3. 자동화 테스트 시스템

#### 테스트 실행
```bash
# 자동화 테스트 시스템으로 이동
cd auto-dev-system

# 테스트 실행
npm run test

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

#### 개별 테스트
```bash
# Jest 테스트
npm test

# E2E 테스트
npx cypress run

# 성능 테스트
npm run test:performance
```

### 4. 모니터링 및 대시보드

#### 대시보드 실행
```bash
# Cursor 대시보드
open-cursor-dashboard.bat

# Chrome 미리보기
open-chrome-preview.ps1

# 관리자 대시보드
open-admin-dashboard.ps1
```

#### 성능 모니터링
```bash
# 성능 모니터링
monitor-performance.ps1

# 서버 중지
stop-servers.ps1
```

## 🔧 개발 환경 자동화

### 1. 프론트엔드 자동화
```bash
# 프론트엔드 개발 서버
cd frontend
npm run dev

# 프론트엔드 빌드
npm run build

# 프론트엔드 테스트
npm test
```

### 2. 백엔드 자동화
```bash
# 백엔드 서버 시작
cd server-backend
npm start

# 백엔드 테스트
npm test
```

### 3. 전체 시스템 실행
```bash
# 최적화된 시작
start-optimized.ps1

# Docker로 실행
docker-compose up -d
```

## 📊 자동화 상태 확인

### 1. 시스템 상태 확인
```bash
# 전체 상태 확인
check-status.bat

# 자동 진행 상태
auto-progress-service.bat

# 서버 상태
tasklist | findstr node
```

### 2. 로그 확인
```bash
# 백엔드 로그
type backend.err

# 프론트엔드 로그
type frontend-preview.err

# 모의 서버 로그
type mock-server.err
```

## 🎯 일일 자동화 워크플로우

### 오전 시작 (9:00)
```bash
# 1. 자동 진행 서비스 시작
start-auto-progress.bat

# 2. 개발 서버 시작
start-optimized.ps1

# 3. 모니터링 대시보드 열기
open-cursor-dashboard.bat
```

### 작업 중 (9:00-18:00)
```bash
# Task 생성 (필요시)
node quick-task.js "작업 요청"

# 상태 확인 (필요시)
check-status.bat

# 테스트 실행 (필요시)
cd auto-dev-system && npm run test
```

### 오후 종료 (18:00)
```bash
# 1. 자동 진행 서비스 중지
stop-auto-progress.bat

# 2. 서버 중지
stop-servers.ps1

# 3. 상태 확인
check-status.bat
```

## 🔍 문제 해결

### 자주 발생하는 문제

1. **포트 충돌**
   ```bash
   # 사용 중인 포트 확인
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   
   # 프로세스 종료
   taskkill /PID [PID번호] /F
   ```

2. **Node.js 모듈 오류**
   ```bash
   # 의존성 재설치
   npm install
   
   # 캐시 정리
   npm cache clean --force
   ```

3. **권한 오류**
   ```bash
   # 관리자 권한으로 실행
   # PowerShell을 관리자 권한으로 실행 후 스크립트 실행
   ```

## 📁 관련 문서

### 주요 가이드
- `QUICK_TASK_GUIDE.md` - 빠른 Task 생성 가이드
- `docs/manager-interface-guide.md` - 매니저 인터페이스 가이드
- `docs/auto-progress-management-guide.md` - 자동 진행 관리 가이드
- `TESTING_GUIDE.md` - 테스트 가이드
- `DEVELOPMENT_GUIDE.md` - 개발 가이드

### 상태 보고서
- `STATUS_UPDATE_2025_09_28.md` - 최신 상태 업데이트
- `TEST_AUTOMATION_STATUS_2025_09_28.md` - 테스트 자동화 상태
- `BUG_FIX_SUMMARY_2025_09_28.md` - 버그 수정 요약

### 설정 파일
- `config/auto-progress.json` - 자동 진행 설정
- `package.json` - 프로젝트 의존성
- `docker-compose.yml` - Docker 설정

## 🎉 완료!

이제 모든 자동화 시스템을 쉽게 실행할 수 있습니다!

### 가장 많이 사용할 명령어
```bash
# Task 생성 (가장 자주 사용)
node quick-task.js "작업 요청"

# 자동 진행 시작
start-auto-progress.bat

# 상태 확인
check-status.bat

# 대시보드 열기
open-cursor-dashboard.bat
```

---

**문서 버전**: 1.0.0  
**최종 업데이트**: 2025-09-29  
**작성자**: 자동화 시스템
