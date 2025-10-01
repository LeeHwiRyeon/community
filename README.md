# Community Hub 🚀

Community Hub is a modern React + TypeScript single-page application backed by an Express.js API with comprehensive mock data. It features community boards, advanced search, user profiles, live broadcast listings, and a themed cosplay shop. The frontend runs on port **5002** (development) and **5000** (production); the backend API listens on **50000**.

## ✨ **현재 상태 (2025-10-02)**
- ✅ **완전 작동**: 프론트엔드 + 백엔드 정상 동작
- ✅ **목데이터 완비**: 16개 게시판, 480개 게시글
- ✅ **안정적인 실행**: 멈추는 현상 완전 해결
- ✅ **완전한 기능**: 모든 주요 기능 구현 완료

## Table of Contents
- [Prerequisites](#prerequisites)
- [Install Dependencies](#install-dependencies)
- [Running Locally](#running-locally)
- [Docker Workflow](#docker-workflow)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)

## Prerequisites
- Node.js 18 or 20 LTS, npm 8+
- Git
- (optional) Docker Desktop 4.x for container workflows
- PowerShell 7+ or a compatible Bash shell

## Install Dependencies
```bash
# backend
cd server-backend
npm install

# frontend
cd ../frontend
npm install
```

## Running Locally
> 자세한 실행 절차는 [RUNNING_GUIDE.md](./RUNNING_GUIDE.md)에서 확인할 수 있습니다.

### 🚀 **빠른 시작 (추천)**
```powershell
# 통합 실행 (가장 안정적)
./scripts/dev-env.ps1 -Action start

# 안정적인 런처
./scripts/stable-launcher.ps1 -Action start

# 종료
./scripts/dev-env.ps1 -Action stop
```

### 🌐 **접속 URL**
- **프론트엔드 (개발)**: http://localhost:5002
- **프론트엔드 (프로덕션)**: http://localhost:5000  
- **백엔드 API**: http://localhost:50000

### Manual start (separate terminals)
```bash
# backend
cd server-backend
npm run dev

# frontend
cd frontend
npm run dev
```

## Docker Workflow
```bash
# Development compose
docker compose up --build

# Production compose
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```
- NGINX config: `frontend/docker/nginx.conf`
- CI/CD pipeline: `.github/workflows/deploy.yml`

## Testing
| Command                     | Description                 |
| --------------------------- | --------------------------- |
| `npm test` (server-backend) | Node test runner unit tests |
| `npm run test` (frontend)   | Vitest + RTL suites         |
| `npx playwright test`       | End-to-end scenarios        |
| `npm run lint`              | ESLint rules                |
| `npm run typecheck`         | TypeScript type checking    |

## Troubleshooting
| Issue                              | Action                                                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| Port 5000/50000 already in use     | `scripts/stop-all.bat` or `./scripts/dev-env.ps1 -Action stop`                     |
| npm install failures               | Verify Node version, run `npm cache clean --force` and retry                       |
| Docker compose errors              | Check Docker Desktop status, run `docker system prune` if needed                   |
| Auto-save conflict banner persists | Follow [docs/post-draft-conflict-ux.md](./docs/post-draft-conflict-ux.md) guidance |

## Documentation
- [COMPLETED_FEATURES.md](./docs/COMPLETED_FEATURES.md) - 완료된 기능 문서
- [RUNNING_GUIDE.md](./RUNNING_GUIDE.md)
- [API_REFERENCE.md](./API_REFERENCE.md)
- [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
- [CI_CD_GUIDE.md](./CI_CD_GUIDE.md)
- [docs/post-draft.md](./docs/post-draft.md)

새로운 기능이나 스크립트는 `FEATURES.md`와 `docs/` 폴더에 기록되어 있으니 변경 전후로 참고해 주세요.

## 작업 관리 가이드 (Task Management Guide)

### 📋 TODO 리스트 관리 원칙
- **완료된 기능**: `docs/COMPLETED_FEATURES.md`에 문서화하여 추적
- **진행 중 작업**: TODO 리스트에 실제 진행 중인 작업만 유지
- **중복 작업 방지**: 완료된 기능은 문서 참조 후 진행

### 🔍 작업 진행 순서
1. `docs/COMPLETED_FEATURES.md`에서 유사 기능 확인
2. TODO 리스트에서 진행할 작업 선택
3. 기존 작업 규칙(`docs/todo-backlog.md`) 준수
4. 완료 시 기능 문서에 기록

### 📖 참고 문서
- `docs/todo-backlog.md` - 기존 작업 규칙 및 단계별 계획
- `docs/todo-backlog-detailed.md` - 상세 작업 명세
- `FEATURES.md` - 전체 기능 사양 및 단계 정의
