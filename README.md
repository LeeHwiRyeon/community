# Community Hub

Community Hub is a React + TypeScript single-page application backed by an Express mock API. It showcases community boards, search, profile pages, live broadcast listings, and a themed cosplay shop. The frontend runs on port **5000** by default; the backend mock API listens on **50000**.

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

### Quick start
```powershell
# PowerShell 통합 실행
./scripts/dev-env.ps1 -Action start

# 종료
./scripts/dev-env.ps1 -Action stop
```
- Backend: <http://localhost:50000>
- Frontend: <http://localhost:5000>

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
- [RUNNING_GUIDE.md](./RUNNING_GUIDE.md)
- [API_REFERENCE.md](./API_REFERENCE.md)
- [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
- [CI_CD_GUIDE.md](./CI_CD_GUIDE.md)
- [docs/post-draft.md](./docs/post-draft.md)

새로운 기능이나 스크립트는 `FEATURES.md`와 `docs/` 폴더에 기록되어 있으니 변경 전후로 참고해 주세요.
