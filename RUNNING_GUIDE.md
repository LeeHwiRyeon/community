# Community Hub 실행 가이드

이 문서는 Community Hub 프로젝트를 로컬 혹은 Docker 환경에서 실행하고 점검하는 방법을 정리합니다. Windows PowerShell을 기준으로 작성했으며, macOS/Linux 사용자는 동일한 npm/Docker 명령을 적용하면 됩니다.

## 1. 빠른 실행 요약 (2025-10-02 업데이트)
1. 저장소 클론 후 의존성 설치
   ```powershell
   git clone <repo>
   cd community
   npm install --prefix server-backend
   npm install --prefix frontend
   ```
2. 개발 서버 실행 (백엔드 50000, 프론트 5002)
   ```powershell
   # 가장 안정적인 방법
   ./scripts/dev-env.ps1 -Action start
   
   # 또는 안정적인 런처 사용
   ./scripts/stable-launcher.ps1 -Action start
   ```
3. 브라우저에서 확인
   - **개발 서버**: http://localhost:5002
   - **프로덕션**: http://localhost:5000
   - **백엔드 API**: http://localhost:50000
4. 종료 시
   ```powershell
   ./scripts/dev-env.ps1 -Action stop
   ```

## 2. 요구 사항
- Node.js 18 또는 20 LTS, npm 8 이상
- PowerShell 7 이상(Windows) 혹은 Bash 셸 환경
- Docker Desktop 4.x (옵션: Docker 기반 실행 또는 배포 시 필요)
- Git, pnpm(선택), Python 3.x (테스트 스크립트 일부 사용)

## 3. 환경 변수 및 설정
| 파일                        | 용도               | 비고                                  |
| --------------------------- | ------------------ | ------------------------------------- |
| `.env.example`              | 로컬 개발 기본값   | 복사 후 필요한 값 수정                |
| `.env.prod.example`         | 프로덕션 배포 샘플 | 비밀정보는 별도 비밀 관리 시스템 사용 |
| `frontend/.env.development` | Vite 개발 서버용   | 존재 시 자동 로드                     |
| `server-backend/.env`       | Express 서버 설정  | DB, Redis 등 연결 정보 정의           |

환경 변수 파일을 새로 만들 때는 UTF-8(BOM 없음)으로 저장하고, 비밀번호/토큰은 Git에 커밋하지 않습니다.

## 4. 개발 환경 실행 스크립트
| 스크립트                           | 실행 예시                             | 설명                                     |
| ---------------------------------- | ------------------------------------- | ---------------------------------------- |
| `scripts/dev-env.ps1`              | `./scripts/dev-env.ps1 -Action start` | PowerShell 기반 통합 실행/중지/로그 조회 |
| `scripts/dev-env.bat`              | `scripts\dev-env.bat start`           | CMD 배치 버전                            |
| `scripts/start-all.bat`            | `scripts\start-all.bat`               | 백엔드/프론트 서버 동시 구동             |
| `scripts/stop-all.bat`             | `scripts\stop-all.bat`                | 실행 중인 Node 프로세스 종료             |
| `scripts/pre-commit-bom-check.ps1` | `./scripts/pre-commit-bom-check.ps1`  | BOM 여부 검사 (CI 훅 참고)               |

### 주요 옵션 (dev-env.ps1)
```powershell
./scripts/dev-env.ps1 -Action start      # 서버 실행
./scripts/dev-env.ps1 -Action stop       # 서버 종료
./scripts/dev-env.ps1 -Action logs       # 백엔드/프론트 로그 tail
./scripts/dev-env.ps1 -Action status     # 실행 상태 점검
```

## 5. 서비스별 수동 실행
### 백엔드 (Express)
```powershell
cd server-backend
npm install
npm run dev          # http://localhost:50000
```
- 테스트 실행: `npm test` (unit), `npm run test:e2e`
- 환경 변수: `USE_MOCK_DB=1`로 Mock 데이터 공급 가능

### 프론트엔드 (React + Vite)
```powershell
cd frontend
npm install
npm run dev          # http://localhost:5000
```
- 환경 구성: `frontend/src/contexts/ThemeContext.tsx` 등 테마 설정 사용
- 빌드: `npm run build`, 미리보기: `npm run preview`

## 6. Docker 실행
### 개발용 Compose
```powershell
docker compose up --build
```
- `docker-compose.yml` : 프론트/백엔드/프록시를 하나의 네트워크로 구성
- `.env` 파일에서 `PORT` 충돌 여부 확인

### 프로덕션 Compose
```powershell
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```
- `frontend/docker/nginx.conf` : 정적 파일 서빙 및 프록시 설정
- 배포 파이프라인 참조: `.github/workflows/deploy.yml`

## 7. 테스트 & 품질 확인
| 명령                                     | 설명                              |
| ---------------------------------------- | --------------------------------- |
| `npm run test -- --runInBand` (frontend) | Vitest 단위 테스트                |
| `npm test` (server-backend)              | Node test runner 기반 유닛 테스트 |
| `npx playwright test`                    | E2E (Playwright) 테스트           |
| `npm run lint`                           | ESLint 검사                       |
| `npm run typecheck`                      | TypeScript 타입 검사              |

테스트 전 서버가 필요할 경우 `dev-env.ps1 -Action start`로 백그라운드 실행 후 테스트를 돌립니다.

## 8. 로그 & 모니터링
- 백엔드: `server-backend/logs/runtime.log`
- 프론트 빌드 결과: `frontend/dist` (빌드 후), `frontend/dist/assets` 정적 파일 확인
- `./scripts/dev-env.ps1 -Action logs` 로 tail 확인 가능
- Draft 자동 저장 모니터링: 프론트에서 발생하는 `drafts.metric` 이벤트는 `frontend/src/analytics/drafts-metric-listener.ts`를 통해 `/client-metric`으로 전송

## 9. 문제 해결
| 증상                         | 원인/조치                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| 포트 5000/50000 이미 사용 중 | `scripts/stop-all.bat` 실행 후 재시작                                              |
| npm install 실패             | Node 버전 확인, `npm cache clean --force` 후 재시도                                |
| Docker compose 에러          | WSL2/Docker Desktop 최신 버전인지 확인, `docker system prune`                      |
| Auto-save 충돌 배너 지속     | Step 40 문서 참고 (`docs/post-draft-conflict-ux.md`), 브라우저 캐시 제거 후 재시도 |

## 10. 추가 참고 문서
- [API_REFERENCE.md](./API_REFERENCE.md)
- [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
- [CI_CD_GUIDE.md](./CI_CD_GUIDE.md)
- [docs/post-draft.md](./docs/post-draft.md)

필요한 내용이 누락되어 있다면 `docs/` 폴더 아래 문서를 우선 확인하고, 최신 변경 사항은 `FEATURES.md`에서 확인할 수 있습니다.
