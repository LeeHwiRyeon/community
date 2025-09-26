# 🔐 환경 설정 및 시크릿 관리 가이드

이 문서는 Community Hub 프로젝트의 환경 설정 및 시크릿 관리 방법을 설명합니다.

## 📋 목차
- [GitHub Secrets 설정](#github-secrets-설정)
- [환경별 설정 파일](#환경별-설정-파일)
- [시크릿 관리 정책](#시크릿-관리-정책)
- [환경 변수 목록](#환경-변수-목록)

## 🔑 GitHub Secrets 설정

GitHub Actions에서 사용하는 시크릿들을 설정합니다.

### 필수 시크릿들

#### 데이터베이스 설정
```
DB_HOST=your-production-db-host
DB_PORT=3306
DB_NAME=community_prod
DB_USER=community_user
DB_PASSWORD=your-secure-db-password
```

#### 인증 및 보안
```
JWT_SECRET=your-super-secure-jwt-secret-key
SESSION_SECRET=your-session-secret-key
```

#### 외부 서비스
```
REDIS_URL=redis://your-redis-host:6379
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

#### 배포 설정
```
PRODUCTION_HOST=your-server-ip-or-domain
PRODUCTION_USER=your-server-username
PRODUCTION_SSH_KEY=your-private-ssh-key
PRODUCTION_PORT=22
```

### GitHub Secrets 설정 방법

1. **GitHub Repository → Settings → Secrets and variables → Actions**
2. **"New repository secret" 클릭**
3. **시크릿 이름과 값 입력**

#### 예시:
- **이름**: `DB_PASSWORD`
- **값**: `your-actual-database-password`

## 📁 환경별 설정 파일

### 프로덕션 환경 (.env.prod)
```bash
# 데이터베이스
DB_HOST=${DB_HOST}
DB_PORT=3306
DB_NAME=community_prod
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}

# 인증
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}

# Redis
REDIS_URL=${REDIS_URL}

# CORS
CORS_ORIGIN=https://yourdomain.com

# 기타
NODE_ENV=production
PORT=50000
LOG_LEVEL=info
```

### 스테이징 환경 (.env.staging)
```bash
# 데이터베이스
DB_HOST=staging-db-host
DB_PORT=3306
DB_NAME=community_staging
DB_USER=staging_user
DB_PASSWORD=staging_password

# 인증
JWT_SECRET=staging_jwt_secret
SESSION_SECRET=staging_session_secret

# Redis
REDIS_URL=redis://staging-redis:6379

# CORS
CORS_ORIGIN=https://staging.yourdomain.com

# 기타
NODE_ENV=staging
PORT=50000
LOG_LEVEL=debug
```

### 로컬 개발 환경 (.env.local)
```bash
# 데이터베이스 (로컬 또는 Docker)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=community_dev
DB_USER=root
DB_PASSWORD=dev_password

# 인증
JWT_SECRET=dev_jwt_secret_for_local_development
SESSION_SECRET=dev_session_secret

# Redis (옵션)
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=http://localhost:5000

# 기타
NODE_ENV=development
PORT=50000
LOG_LEVEL=debug
USE_MOCK_DB=1
```

## 🔒 시크릿 관리 정책

### 시크릿 생성 규칙
- **길이**: 최소 32자 이상
- **복잡성**: 대소문자, 숫자, 특수문자 포함
- **무작위성**: 예측 불가능한 값 사용

### 시크릿 로테이션
- **주기**: 90일마다 변경
- **절차**:
  1. 새 시크릿 생성
  2. GitHub Secrets 업데이트
  3. 환경 파일 업데이트
  4. 배포 후 이전 시크릿 제거

### 접근 권한
- **읽기**: CI/CD 파이프라인만 접근 가능
- **쓰기**: 리포지토리 관리자만 가능
- **감사**: 모든 접근 로그 기록

## 📋 환경 변수 목록

### 백엔드 환경 변수

#### 데이터베이스
- `DB_HOST`: 데이터베이스 호스트
- `DB_PORT`: 데이터베이스 포트 (기본: 3306)
- `DB_NAME`: 데이터베이스 이름
- `DB_USER`: 데이터베이스 사용자
- `DB_PASSWORD`: 데이터베이스 비밀번호

#### 인증 및 보안
- `JWT_SECRET`: JWT 토큰 서명 키
- `SESSION_SECRET`: 세션 암호화 키
- `BCRYPT_ROUNDS`: 비밀번호 해시 라운드 (기본: 12)

#### 캐시 및 세션
- `REDIS_URL`: Redis 연결 URL
- `SESSION_TTL`: 세션 만료 시간 (초)

#### 외부 API
- `GOOGLE_CLIENT_ID`: Google OAuth 클라이언트 ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth 클라이언트 시크릿
- `SLACK_WEBHOOK_URL`: Slack 알림 웹훅 URL

#### 애플리케이션 설정
- `NODE_ENV`: 실행 환경 (development/staging/production)
- `PORT`: 서버 포트 (기본: 50000)
- `LOG_LEVEL`: 로깅 레벨 (debug/info/warn/error)
- `CORS_ORIGIN`: CORS 허용 도메인

#### 기능 플래그
- `USE_MOCK_DB`: 모의 데이터베이스 사용 (1/0)
- `ENABLE_CACHE`: 캐시 활성화 (true/false)
- `ENABLE_METRICS`: 메트릭 수집 활성화 (true/false)

### 프론트엔드 환경 변수

#### API 연결
- `VITE_API_BASE_URL`: 백엔드 API 기본 URL
- `VITE_WS_URL`: WebSocket 연결 URL

#### 외부 서비스
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth 클라이언트 ID
- `VITE_SENTRY_DSN`: Sentry 에러 추적 DSN

#### 기능 설정
- `VITE_ENABLE_ANALYTICS`: 분석 도구 활성화
- `VITE_APP_ENV`: 애플리케이션 환경

## 🚀 설정 적용

### 1. GitHub Secrets 설정
```bash
# GitHub 웹 인터페이스에서 설정
# Repository → Settings → Secrets and variables → Actions
```

### 2. 환경 파일 생성
```bash
# 프로덕션 환경
cp .env.prod.example .env.prod

# 스테이징 환경
cp .env.staging.example .env.staging

# 실제 값으로 채워넣기
```

### 3. 배포 확인
```bash
# 배포 후 환경 변수 확인
.\scripts\deploy.ps1 -Action logs

# 또는 직접 확인
docker-compose -f docker-compose.prod.yml exec backend env | grep -E "(DB_|JWT_|REDIS_)"
```

## ⚠️ 보안 주의사항

### ❌ 하지 말아야 할 것들
- 시크릿을 코드에 하드코딩하지 않기
- 시크릿을 커밋하지 않기 (.env 파일은 .gitignore에 포함)
- 시크릿을 로그에 출력하지 않기
- 시크릿을 URL 파라미터로 전달하지 않기

### ✅ 권장사항
- 환경 변수를 사용하여 시크릿 관리
- GitHub Secrets를 사용하여 CI/CD 시크릿 관리
- 시크릿 스캔 도구 사용 (GitGuardian 등)
- 정기적인 시크릿 로테이션 수행

---

## 📞 지원

환경 설정에 문제가 발생하면:
1. [RUNNING_GUIDE.md](../RUNNING_GUIDE.md) - 실행 가이드 확인
2. [CI_CD_GUIDE.md](../CI_CD_GUIDE.md) - CI/CD 파이프라인 확인
3. 이슈 생성 시 환경 정보 포함