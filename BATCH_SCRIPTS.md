# 배치 스크립트 관리 가이드

이 문서는 Community 프로젝트에서 제공하는 Windows 배치(.bat) 및 PowerShell(.ps1) 스크립트를 정리하고, 사용 시 주의사항을 안내합니다. 모든 스크립트는 저장소 루트의 `scripts/` 디렉터리에 위치합니다.

## ⚠️ 중요 안내
- **스크립트 수정 전 백업**: 기존 동작을 기록한 뒤 새로운 변경 사항을 적용하세요.
- **문서 함께 갱신**: 스크립트를 수정했다면 이 가이드와 관련 문서를 즉시 업데이트합니다.
- **명확한 커밋 기록**: 변경 목적과 영향을 커밋 메시지에 남겨 다른 개발자가 추적할 수 있게 합니다.
- **민감 정보 금지**: 배치 스크립트에는 계정 정보나 토큰을 직접 작성하지 않습니다.

## 기본 작업 흐름

### 1. 변경 요청 파악
1. **관련 이슈/요구사항 확인** – 어떤 실행 흐름을 바꾸려는지 목표를 명확히 합니다.
2. **영향도 점검** – 백엔드/프론트엔드 실행 절차, 포트, 환경 변수 변동 여부를 정리합니다.
3. **문서/주석 업데이트 계획** – 필요한 앵커(`[#섹션명]`)를 정리해 추적 가능하게 남깁니다.
4. **테스트 시나리오 준비** – 실행/정지/재시작 케이스를 테스트 목록으로 남깁니다.

### 2. 변경 기록 템플릿
```
요약: start-all.bat 포트 검사 로직 보강
- 대상 파일: start-all.bat
- 변경 내용: netstat 출력 필터 개선, 중복 PID 제거
- 참고 섹션: BATCH_SCRIPTS.md#start-allbat
- 연관 파일: stop-all.bat, scripts/util.ps1
```

## 주요 스크립트 요약

### `start-all.bat` – 전체 개발 서버 기동
- **역할**: 백엔드(포트 50000)와 프론트엔드(포트 5000)를 순차적으로 실행합니다.
- **기능**:
  - 기존 포트 점유 프로세스 종료
  - 백엔드(Node)와 프론트엔드(Vite) 실행
  - 실행 URL 안내 출력
- **코드 발췌**:
```bat
@echo off
echo Starting Community Full Stack Application...
set PORTS=50000 5000
for %%P in (%PORTS%) do (
  powershell -Command "Get-NetTCPConnection -LocalPort %%P -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"
)
start "Backend" cmd /c "cd server-backend && node src/index.js"
timeout /t 5 /nobreak > nul
start "Frontend" cmd /c "cd frontend && npm run dev"
```

### `stop-all.bat` – 전체 서버 중지
- **역할**: 개발 환경에서 실행 중인 모든 Node 기반 프로세스를 종료합니다.
- **특징**:
  - 50000 / 5000 / 9323 포트 선점 프로세스 반복 종료
  - 잔여 Node 프로세스 강제 종료
  - 사용자 확인용 메시지 출력

### `run-backend.bat` & `run-frontend.bat`
- **용도**: 개별 서비스만 실행해야 할 때 사용합니다.
- `run-backend.bat` → `cd server-backend && npm run dev`
- `run-frontend.bat` → `cd frontend && npm run dev`

### `quick-start.bat`
- **시나리오**: 빠르게 전체 환경을 띄운 뒤 브라우저를 자동으로 여는 용도.
- **동작**: start-all 호출 → 5초 대기 → 기본 브라우저를 `http://localhost:5000`으로 실행.

### PowerShell 변형 스크립트
- `start-all.ps1`, `start-server.ps1`, `quick-start.ps1` 등은 배치 스크립트와 동일한 기능을 PowerShell로 제공합니다.
- PowerShell 버전을 사용할 때는 `Set-ExecutionPolicy` 설정이 필요할 수 있습니다.

## CI / 테스트 스크립트

### `ci-run.bat`
- **목적**: CI 환경에서 백엔드/프론트엔드 서버 및 테스트를 병렬로 실행합니다.
- **주요 단계**:
  1. 포트 정리 및 Node 프로세스 클린업
  2. 백엔드 서버, 프론트엔드 서버 백그라운드 실행
  3. `npm run ci:backend`, `npm test`를 각각 새 창으로 실행
- **추가 작업**: 로그를 `logs/run-*.log`로 수집하려면 리다이렉션을 추가하세요.

## 유지보수 체크리스트
- 실행/종료 스크립트는 항상 쌍으로 테스트합니다.
- 포트 번호 변경 시 README 및 환경 변수 문서를 함께 갱신합니다.
- 스크립트에서 사용하는 경로(`cd ..`)가 변경되면 반드시 수정합니다.
- 공통 유틸(예: `scripts/util.ps1`)을 도입했다면 각 배치 파일에서 공유하도록 정리합니다.
- 윈도우 외 환경(macOS, Linux)은 별도 `*.sh` 스크립트를 만들어 README에 명시합니다.

## 자주 묻는 질문
- **Q. 포트가 계속 점유되어 실행되지 않아요.**
  - `stop-all.bat` 실행 후, 작업 관리자에서 잔여 Node 프로세스를 종료하세요.
- **Q. PowerShell 스크립트가 실행되지 않습니다.**
  - 관리자 권한으로 PowerShell을 실행하고 `Set-ExecutionPolicy RemoteSigned`를 설정하세요.
- **Q. 브라우저가 자동으로 열리지 않습니다.**
  - `quick-start.bat`에서 `start "Browser"` 부분이 보안 소프트웨어에 의해 차단되지 않았는지 확인하세요.

---
본 문서는 UTF-8 인코딩을 기준으로 유지합니다. 새 스크립트를 추가하거나 수정할 때는 동일한 인코딩으로 저장하고, 변경 이력을 FEATURES.md 또는 TODO 문서에 기록해 주세요.
