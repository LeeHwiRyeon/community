# Development Environment Setup Guide

## 📋 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [로컬 개발 환경 (SQLite)](#로컬-개발-환경-sqlite)
3. [환경변수 설정](#환경변수-설정)
4. [데이터베이스 초기화](#데이터베이스-초기화)
5. [프론트엔드 개발](#프론트엔드-개발)
6. [백엔드 개발](#백엔드-개발)
7. [테스트 실행](#테스트-실행)
8. [일반적인 문제 해결](#일반적인-문제-해결)

---

## 시스템 요구사항

### 필수 소프트웨어

| 항목        | 최소 버전 | 권장 버전 | 설치 링크                                               |
| ----------- | --------- | --------- | ------------------------------------------------------- |
| **Node.js** | 18.0.0    | 20.x LTS  | [nodejs.org](https://nodejs.org/)                       |
| **npm**     | 9.0.0     | 10.x      | Node.js 설치 시 포함                                    |
| **Git**     | 2.30+     | 최신      | [git-scm.com](https://git-scm.com/)                     |
| **VS Code** | -         | 최신      | [code.visualstudio.com](https://code.visualstudio.com/) |

### 하드웨어 권장사항

- **RAM**: 최소 4GB, 권장 8GB 이상
- **디스크**: 최소 2GB 여유 공간
- **CPU**: 듀얼 코어 이상

---

## 로컬 개발 환경 (SQLite)

### 1. 저장소 클론

```powershell
# 프로젝트 클론
git clone https://github.com/LeeHwiRyeon/community.git
cd community

# 프로젝트 구조 확인
ls
# frontend/          - React 프론트엔드
# server-backend/    - Express 백엔드
# docker-compose.yml - Docker 배포 설정
```

### 2. Backend 설정

```powershell
# Backend 디렉토리로 이동
cd server-backend

# 의존성 설치
npm install

# 환경변수 파일 생성
Copy-Item .env.example .env

# .env 파일 편집 (필수!)
notepad .env
```

**필수 환경변수 설정**:

```env
# server-backend/.env
# JWT Secret (최소 32자, 필수!)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# 서버 포트 (로컬 개발)
PORT=3001
NODE_ENV=development

# CORS 설정 (Vite 개발 서버 주소)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

> **⚠️ 중요**: JWT_SECRET는 최소 32자 이상이어야 합니다. 서버가 시작되지 않으면 이 값을 확인하세요.

### 3. Backend 서버 시작

```powershell
# 개발 모드로 시작 (nodemon)
npm run dev

# 또는 프로덕션 모드
npm start
```

**성공 메시지**:
```
✅ Database initialized: SQLite
✅ Server running on port 3001
✅ API available at: http://localhost:3001
```

SQLite 데이터베이스 파일은 `server-backend/community.db`에 자동으로 생성됩니다.

### 4. Frontend 설정 (새 터미널)

```powershell
# Frontend 디렉토리로 이동
cd frontend

# 의존성 설치 (MUI v7 포함)
npm install --legacy-peer-deps

# 환경변수 파일 생성
Copy-Item .env.example .env

# .env 파일 확인
notepad .env
```

**Frontend 환경변수**:

```env
# frontend/.env
# API 서버 주소 (로컬 개발)
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001

# 앱 설정
VITE_APP_NAME=Community Hub
VITE_APP_ENV=development
```

### 5. Frontend 개발 서버 시작

```powershell
# Vite 개발 서버 시작
npm run dev
```

**성공 메시지**:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

브라우저에서 http://localhost:5173 접속

### 6. 접속 확인

| 서비스      | URL                              | 상태 확인                 |
| ----------- | -------------------------------- | ------------------------- |
| Frontend    | http://localhost:5173            | 페이지 로드 확인          |
| Backend API | http://localhost:3001            | 404 에러 정상 (루트 경로) |
| API Health  | http://localhost:3001/api/health | `{"status":"ok"}` 반환    |
| Database    | `server-backend/community.db`    | 파일 존재 확인            |

---

## 환경변수 설정

### Backend 환경변수 (.env)

```env
# ==============================================
# 필수 설정
# ==============================================

# JWT Secret (최소 32자!)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# 서버 설정
PORT=3001
NODE_ENV=development

# CORS 설정
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# ==============================================
# 선택 설정 (기본값 사용 가능)
# ==============================================

# Session Secret (없으면 JWT_SECRET 사용)
SESSION_SECRET=

# JWT 만료 시간 (초)
JWT_ACCESS_TTL_SEC=900          # 15분
JWT_REFRESH_TTL_SEC=1209600     # 14일

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000     # 15분
RATE_LIMIT_MAX_REQUESTS=100

# Redis (로컬 개발 시 불필요, fallback 사용)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Frontend 환경변수 (.env)

```env
# ==============================================
# API 연결 설정
# ==============================================
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001

# ==============================================
# 애플리케이션 설정
# ==============================================
VITE_APP_NAME=Community Hub
VITE_APP_ENV=development
VITE_APP_VERSION=1.2.0

# ==============================================
# 기능 플래그
# ==============================================
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=false
VITE_ENABLE_PWA=false

# ==============================================
# UI 설정
# ==============================================
VITE_DEFAULT_THEME=light
VITE_PRIMARY_COLOR=#123456
```

---

## 데이터베이스 초기화

### SQLite (자동)

SQLite는 서버 시작 시 자동으로 생성되며 초기 스키마가 적용됩니다.

```powershell
# 데이터베이스 위치
ls server-backend\community.db

# 데이터베이스 초기화 (재생성)
cd server-backend
Remove-Item community.db -ErrorAction SilentlyContinue
npm start  # 재시작 시 자동 생성
```

### 데이터베이스 확인

```powershell
# SQLite CLI 설치 (옵션)
# https://www.sqlite.org/download.html

# 테이블 확인
sqlite3 server-backend\community.db ".tables"

# 스키마 확인
sqlite3 server-backend\community.db ".schema"
```

---

## 프론트엔드 개발

### 개발 서버

```powershell
cd frontend

# 개발 서버 시작 (Hot Reload)
npm run dev

# 특정 포트로 시작
npm run dev -- --port 3000

# 외부 접속 허용
npm run dev -- --host
```

### TypeScript 타입 체크

```powershell
# 타입 에러 확인
npm run type-check

# watch 모드
npm run type-check -- --watch
```

### 프로덕션 빌드

```powershell
# 빌드 실행
npm run build

# 빌드 결과: frontend/dist/

# 로컬에서 프로덕션 빌드 미리보기
npm run preview
# ✅ http://localhost:4173
```

### Lint 및 포맷팅

```powershell
# ESLint 실행
npm run lint

# 자동 수정
npm run lint -- --fix

# Prettier (설치된 경우)
npm run format
```

---

## 백엔드 개발

### 개발 서버 (Nodemon)

```powershell
cd server-backend

# Hot Reload 개발 서버
npm run dev

# 일반 실행
npm start
```

### API 테스트

```powershell
# Health Check
curl http://localhost:3001/api/health

# 또는 PowerShell
Invoke-WebRequest http://localhost:3001/api/health
```

### 로그 확인

Backend는 콘솔에 다음 로그를 출력합니다:

```
✅ Database initialized: SQLite
✅ Server running on port 3001
⚠️  Redis connection failed, using in-memory session store
🔒 Zero-Day Protection Layer Active
```

> **⚠️ Redis 경고**: 로컬 개발 시 정상입니다. In-memory 세션 스토어가 대신 사용됩니다.

---

## 테스트 실행

### E2E 테스트 (Playwright)

```powershell
cd frontend

# Playwright 설치 (최초 1회)
npx playwright install chromium

# 전체 테스트 실행
npx playwright test

# 특정 파일만 실행
npx playwright test tests/e2e/basic.spec.ts
npx playwright test tests/e2e/homepage.spec.ts

# UI 모드 (인터랙티브)
npx playwright test --ui

# 헤드 모드 (브라우저 표시)
npx playwright test --headed

# 디버그 모드
npx playwright test --debug

# HTML 리포트 생성 및 열기
npx playwright test --reporter=html
npx playwright show-report
```

**테스트 구조**:

```
frontend/tests/e2e/
├── auth.spec.ts         - 로그인/회원가입
├── basic.spec.ts        - 기본 페이지 로드
├── bookmarks.spec.ts    - 북마크 기능
├── comments.spec.ts     - 댓글 작성/편집
├── dashboard.spec.ts    - 대시보드
├── homepage.spec.ts     - 홈페이지 네비게이션
├── notifications.spec.ts - 알림 시스템
├── posts.spec.ts        - 게시글 CRUD
├── profile.spec.ts      - 프로필 관리
└── search.spec.ts       - 검색 기능
```

**최근 테스트 결과**:
- 총 21개 테스트
- ✅ 9개 통과 (43%)
- ❌ 12개 실패 (UI 셀렉터, 인증 플로우)

**테스트 개선 권장사항**:
1. 컴포넌트에 `data-testid` 속성 추가
2. 셀렉터를 더 안정적인 방식으로 변경
3. 인증 플로우 테스트 수정

### 단위 테스트

```powershell
# Backend 단위 테스트 (작성 필요)
cd server-backend
npm test

# Frontend 단위 테스트 (작성 필요)
cd frontend
npm test
```

---

## 일반적인 문제 해결

### 1. 서버가 시작되지 않음

**증상**: "JWT_SECRET must be at least 32 characters"

**해결**:
```powershell
cd server-backend

# .env 파일에서 JWT_SECRET 확인
notepad .env

# 최소 32자 이상으로 설정
# JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
```

### 2. 포트 충돌

**증상**: "Error: listen EADDRINUSE: address already in use :::3001"

**해결**:
```powershell
# 포트 사용 중인 프로세스 확인
netstat -ano | findstr :3001

# 프로세스 종료
Stop-Process -Id <PID>

# 또는 .env에서 포트 변경
# PORT=3002
```

### 3. Frontend가 Backend에 연결 안 됨

**증상**: "Network Error" 또는 CORS 에러

**해결 방법**:

1. Backend 서버가 실행 중인지 확인
   ```powershell
   curl http://localhost:3001/api/health
   ```

2. Frontend .env 확인
   ```env
   VITE_API_BASE_URL=http://localhost:3001
   ```

3. Backend .env의 CORS 설정 확인
   ```env
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

4. 개발 서버 재시작
   ```powershell
   # Frontend 재시작
   Ctrl+C
   npm run dev
   ```

### 4. npm install 실패

**증상**: "ERESOLVE unable to resolve dependency tree"

**해결**:
```powershell
# 캐시 삭제
npm cache clean --force

# node_modules 삭제 후 재설치
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force
npm install --legacy-peer-deps
```

### 5. TypeScript 에러

**증상**: "Type 'X' is not assignable to type 'Y'"

**해결**:
```powershell
# 타입 체크 실행
npm run type-check

# 빌드 시도
npm run build

# VS Code에서 TypeScript 서버 재시작
# Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### 6. 데이터베이스 초기화 필요

```powershell
cd server-backend

# SQLite 파일 삭제
Remove-Item community.db

# 서버 재시작 (자동 생성)
npm start
```

### 7. Redis 연결 경고

**증상**: "⚠️ Redis connection failed, using in-memory session store"

**설명**: 로컬 개발 시 정상입니다. Redis가 설치되지 않았으므로 메모리 기반 세션 스토어를 사용합니다.

**무시해도 됨**: ✅ (로컬 개발 시)

**Redis 설치 (선택)**:
- Windows: https://github.com/microsoftarchive/redis/releases
- Docker: `docker run -d -p 6379:6379 redis:7-alpine`

### 8. Hot Reload가 작동하지 않음

**Frontend (Vite)**:
```powershell
# 개발 서버 재시작
Ctrl+C
npm run dev
```

**Backend (Nodemon)**:
```powershell
# nodemon 설치 확인
npm install -D nodemon

# package.json 확인
# "dev": "nodemon src/index.js"

npm run dev
```

---

## 개발 워크플로

### 일반적인 개발 흐름

1. **기능 브랜치 생성**
   ```powershell
   git checkout -b feature/new-feature
   ```

2. **코드 변경**
   - Backend: `server-backend/src/`
   - Frontend: `frontend/src/`

3. **테스트**
   ```powershell
   # E2E 테스트
   cd frontend
   npx playwright test

   # TypeScript 타입 체크
   npm run type-check
   ```

4. **커밋**
   ```powershell
   git add .
   git commit -m "feat: add new feature"
   ```

5. **푸시 및 PR**
   ```powershell
   git push origin feature/new-feature
   ```

### 코드 스타일

- **Backend**: JavaScript (ES6+)
- **Frontend**: TypeScript + React
- **Indent**: 2 spaces
- **Line Ending**: LF (Unix)
- **Quotes**: Single quotes (')

---

## 추가 자료

- **Docker 배포**: [DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md)
- **API 문서**: [API_TEST_GUIDE.md](API_TEST_GUIDE.md)
- **E2E 테스트**: [E2E_TEST_GUIDE.md](E2E_TEST_GUIDE.md)
- **프로젝트 개요**: [README.md](README.md)

---

## 문의 및 지원

문제가 지속되면:

1. 로그 확인 (Backend 콘솔, Frontend 브라우저 콘솔)
2. GitHub Issues 검색
3. 팀 채널에 문의
4. 이 가이드를 최신 버전으로 업데이트

**마지막 업데이트**: 2025년 (Phase 6 완료 후)
