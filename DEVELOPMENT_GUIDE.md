# 개발 도구 및 에이전트 가이드

## 🤖 AI 코딩 에이전트 사용법

### GitHub Copilot 
현재 VS Code에서 활성화된 AI 코딩 어시스턴트입니다.

#### 주요 기능
- **코드 자동완성**: 실시간 코드 제안 및 완성
- **함수/클래스 생성**: 주석이나 함수명으로 전체 구현 생성
- **테스트 코드 작성**: 기존 코드에 대한 테스트 케이스 자동 생성
- **문서화**: JSDoc, README 등 문서 자동 생성
- **코드 리팩토링**: 기존 코드 개선 제안

#### 사용 팁
```javascript
// 주석으로 의도를 명확히 작성하면 더 정확한 코드 생성
// TODO: Create a function to validate user input for post creation
function validatePostInput(title, content) {
  // Copilot이 여기서 검증 로직을 제안합니다
}

// 함수명과 파라미터만 작성해도 전체 구현 제안
async function fetchPostsWithPagination(page, limit, searchQuery) {
  // Copilot이 전체 함수 구현을 제안합니다
}
```

### 웹 개발 도구 체인

#### 1. 프론트엔드 개발
- **HTML/CSS/JS**: 바닐라 JavaScript 기반
- **개발 서버**: Node.js 기반 정적 파일 서버 (`frontend/_dev_static_server.js`)
- **포트**: 5500 (기본값)
- **Entry Point**: `simple-test.html`

#### 2. 백엔드 개발
- **Node.js + Express**: RESTful API 서버
- **데이터베이스**: MariaDB/MySQL
- **ORM**: 없음 (순수 SQL 쿼리)
- **인증**: JWT + 소셜 로그인 (Google, GitHub, Naver, Kakao 등)
- **포트**: 50000 (기본값)

#### 3. 개발 워크플로우
```bash
# 1. 풀스택 개발 환경 시작
scripts\dev-start.bat

# 2. 백엔드 API 테스트
curl http://localhost:50000/api/health

# 3. 프론트엔드 접속
# 브라우저: http://localhost:5500

# 4. 실시간 로그 확인
tail -f logs/session-*.log
```

## 🛠️ 개발 도구

### VS Code 확장 추천
- **GitHub Copilot**: AI 코딩 어시스턴트
- **GitLens**: Git 히스토리 및 코드 분석
- **Thunder Client**: API 테스트 도구
- **Live Server**: 정적 파일 서버 (대안)
- **Database Client**: MariaDB/MySQL 연결

### API 테스트 도구
```bash
# Windows (PowerShell)
Invoke-RestMethod -Uri "http://localhost:50000/api/health" -Method GET

# cURL (크로스 플랫폼)
curl -X GET http://localhost:50000/api/health

# Thunder Client (VS Code 확장)
# REST Client 확장으로 .http 파일 실행
```

### 데이터베이스 관리
```bash
# 백엔드 디렉터리에서
cd server-backend

# 초기 데이터 임포트
node scripts/import-initial.js

# 목 데이터 생성 (개발용)
ENV_ALLOW_MOCK=1 node scripts/mock-data.js
```

## 🔧 문제 해결

### 일반적인 문제

#### 1. PowerShell 실행 정책 오류
```powershell
# 관리자 권한으로 PowerShell 실행 후
Set-ExecutionPolicy RemoteSigned
```

#### 2. 포트 충돌
```bash
# 포트 사용 중인 프로세스 확인 (Windows)
netstat -ano | findstr :50000

# 프로세스 종료
taskkill /PID <PID번호> /F

# 또는 다른 포트 사용
scripts\backend-start.bat --port 51000
```

#### 3. 데이터베이스 연결 실패
```bash
# 환경변수 확인
echo $env:DB_HOST
echo $env:DB_USER

# MariaDB/MySQL 서비스 상태 확인
# Windows Services에서 MySQL 서비스 시작
```

#### 4. Node.js 모듈 누락
```bash
cd server-backend
npm install

cd ../frontend
# 프론트엔드는 외부 의존성 없음
```

### 개발 팁

#### 1. 효율적인 디버깅
```javascript
// 백엔드에서 상세 로깅 활성화
process.env.LOG_JSON = "1";
process.env.DEBUG = "app:*";

// 프론트엔드에서 브라우저 개발자 도구 활용
console.log('API 응답:', response);
```

#### 2. Hot Reload 설정
```bash
# 백엔드 자동 재시작 (개발 중)
cd server-backend
npm run dev  # --watch 플래그 사용

# 프론트엔드는 브라우저 새로고침으로 즉시 반영
```

#### 3. 테스트 실행
```bash
cd server-backend

# API 테스트 실행
npm run test:api
npm run test:strict
npm run test:security

# 단위 테스트
npm test
```

## 📁 프로젝트 구조 이해

```
community/
├── scripts/                 # 새로운 실행 스크립트 (권장)
│   ├── backend-start.bat    # 백엔드 전용 실행
│   ├── frontend-start.bat   # 프론트엔드 전용 실행
│   ├── dev-start.bat        # 풀스택 개발 환경
│   ├── backend-start.ps1    # PowerShell 백엔드 실행
│   ├── frontend-start.ps1   # PowerShell 프론트엔드 실행
│   └── dev-start.ps1        # PowerShell 풀스택 환경
├── server-backend/          # Express.js 백엔드
│   ├── src/                 # 소스 코드
│   ├── tests/               # 테스트 파일
│   └── scripts/             # 유틸리티 스크립트
├── frontend/                # 정적 프론트엔드
│   ├── _dev_static_server.js # 개발 서버
│   └── simple-test.html     # 기본 진입점
├── data/                    # 초기 데이터 JSON
├── logs/                    # 서버 로그 파일
├── run.bat                  # 기존 통합 실행 스크립트 (하위호환)
├── run-frontend.bat         # 기존 프론트엔드 실행 (하위호환)
└── start-server.ps1         # 기존 PowerShell 스크립트 (하위호환)
```

이 가이드를 통해 개발 환경을 효율적으로 설정하고 AI 도구를 활용한 생산적인 개발이 가능합니다.