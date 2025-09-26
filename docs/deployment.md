# 배포 가이드

## 개요

Community Hub의 배포는 GitHub Actions를 통한 자동화된 CI/CD 파이프라인을 사용합니다. 수동 배포와 롤백 절차를 포함한 완전한 배포 워크플로우를 제공합니다.

## 배포 환경

### 환경 구성

1. **로컬 개발 환경**: `http://localhost:5000`
2. **스테이징 환경**: `https://staging.community-hub.com`
3. **프로덕션 환경**: `https://community-hub.com`

### 환경별 설정

각 환경은 `.env` 파일을 통해 설정:

- `.env.local`: 로컬 개발
- `.env.staging`: 스테이징 배포
- `.env.prod`: 프로덕션 배포

## 자동 배포

### GitHub Actions 워크플로우

#### CI 워크플로우 (`.github/workflows/ci.yml`)

- **트리거**: 모든 브랜치의 푸시/PR
- **작업**:
  - 코드 린팅 및 테스트
  - Playwright E2E 테스트
  - 빌드 및 아티팩트 생성
  - Slack/Discord 알림

#### 배포 워크플로우 (`.github/workflows/deploy.yml`)

- **트리거**: `main` 브랜치 푸시 또는 수동 트리거
- **환경**: 스테이징 및 프로덕션
- **작업**:
  - Docker 이미지 빌드
  - 컨테이너 배포
  - 헬스 체크 검증
  - Slack/Discord 알림

### 배포 트리거

#### 자동 배포

```bash
# main 브랜치에 푸시하면 자동으로 스테이징 배포
git checkout main
git push origin main
```

#### 수동 배포

GitHub Actions에서 수동 트리거:

1. GitHub 리포지토리 → Actions 탭
2. "Deploy to Production" 워크플로우 선택
3. "Run workflow" 클릭
4. 환경 선택 (staging/production)

## 수동 배포 절차

### 사전 준비

1. **환경 변수 확인**
   ```bash
   # 스테이징용 환경 변수
   cp .env.staging.example .env.staging
   # 필요한 값들 설정 (DB 연결, 시크릿 등)

   # 프로덕션용 환경 변수
   cp .env.prod.example .env.prod
   # 프로덕션 값들 설정
   ```

2. **시크릿 설정**
   GitHub Secrets에 다음 값들 설정:
   - `STAGING_DB_URL`: 스테이징 DB 연결 문자열
   - `PROD_DB_URL`: 프로덕션 DB 연결 문자열
   - `SLACK_WEBHOOK_URL`: Slack 알림 웹훅
   - `DISCORD_WEBHOOK_URL`: Discord 알림 웹훅

### Docker를 사용한 수동 배포

#### 1. 이미지 빌드

```bash
# 프론트엔드 빌드
cd frontend
npm run build

# 백엔드 Docker 이미지 빌드
cd ../server-backend
docker build -t community-hub-backend:latest .

# 프론트엔드 Docker 이미지 빌드
cd ../frontend
docker build -t community-hub-frontend:latest .
```

#### 2. 컨테이너 실행

```bash
# docker-compose를 사용한 배포
docker-compose -f docker-compose.prod.yml up -d

# 또는 개별 실행
# 백엔드
docker run -d \
  --name community-backend \
  -p 5000:5000 \
  -e NODE_ENV=production \
  --env-file .env.prod \
  community-hub-backend:latest

# 프론트엔드
docker run -d \
  --name community-frontend \
  -p 80:80 \
  community-hub-frontend:latest
```

#### 3. 배포 검증

```bash
# 헬스 체크
curl http://localhost:5000/api/health

# 응답 확인
curl http://localhost/api/

# 로그 확인
docker logs community-backend
docker logs community-frontend
```

## 롤백 절차

### 자동 롤백

GitHub Actions에서 배포 실패 시 자동 롤백:

1. 헬스 체크 실패 감지
2. 이전 버전으로 자동 롤백
3. 알림 전송

### 수동 롤백

#### Docker를 사용한 롤백

```bash
# 현재 컨테이너 중지
docker-compose -f docker-compose.prod.yml down

# 이전 이미지로 롤백 (태그 지정)
docker tag community-hub-backend:v1.0.0 community-hub-backend:latest
docker tag community-hub-frontend:v1.0.0 community-hub-frontend:latest

# 재시작
docker-compose -f docker-compose.prod.yml up -d
```

#### Git을 사용한 롤백

```bash
# 이전 커밋으로 롤백
git log --oneline -10  # 최근 커밋 확인
git reset --hard <previous-commit-hash>
git push --force origin main

# 자동 배포 트리거 대기
```

### 롤백 검증

```bash
# 헬스 체크
curl http://localhost:5000/api/health

# 기능 테스트
curl http://localhost/api/posts

# 모니터링 확인
# - 응답 시간 정상
# - 에러 로그 없음
# - 데이터베이스 연결 정상
```

## 배포 체크리스트

### 사전 배포 체크

- [ ] 코드 리뷰 완료
- [ ] 테스트 통과 (단위/통합/E2E)
- [ ] 보안 스캔 완료
- [ ] 성능 테스트 완료
- [ ] 환경 변수 설정 확인
- [ ] 데이터베이스 마이그레이션 준비
- [ ] 백업 완료

### 배포 중 체크

- [ ] CI 파이프라인 성공
- [ ] Docker 이미지 빌드 성공
- [ ] 컨테이너 시작 성공
- [ ] 헬스 체크 통과
- [ ] 로그 에러 없음

### 배포 후 체크

- [ ] 애플리케이션 접근 가능
- [ ] 주요 기능 동작 확인
- [ ] 모니터링 대시보드 확인
- [ ] 알림 시스템 동작 확인
- [ ] 성능 메트릭 정상

## 문제 해결

### 일반적인 배포 문제

#### 컨테이너 시작 실패

```bash
# 로그 확인
docker logs <container-name>

# 환경 변수 확인
docker exec <container-name> env

# 디스크 공간 확인
df -h
```

#### 헬스 체크 실패

```bash
# 수동 헬스 체크
curl -v http://localhost:5000/api/health

# 데이터베이스 연결 확인
docker exec community-backend mysqladmin ping -h <db-host>

# Redis 연결 확인 (활성화된 경우)
docker exec community-backend redis-cli ping
```

#### 메모리 부족

```bash
# 컨테이너 리소스 제한 확인
docker stats

# 시스템 메모리 확인
free -h

# 컨테이너 재시작 with 메모리 제한
docker run --memory=1g --memory-swap=2g ...
```

### 긴급 롤백

1. **즉시 중지**
   ```bash
   docker-compose -f docker-compose.prod.yml down
   ```

2. **안정 버전 배포**
   ```bash
   git checkout tags/v1.0.0  # 마지막 안정 태그
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **원인 분석**
   - 로그 분석
   - 메트릭 확인
   - 코드 변경 검토

## 모니터링 및 알림

### 배포 모니터링

- **실시간 알림**: Slack/Discord 웹훅
- **헬스 체크**: `/api/health` 엔드포인트
- **메트릭**: `/api/metrics` 엔드포인트
- **로그**: Docker logs 및 애플리케이션 로그

### 알림 설정

GitHub Secrets에 웹훅 URL 설정:

```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

## 보안 고려사항

### 배포 시 보안 체크

- [ ] 시크릿 노출 없음
- [ ] HTTPS 활성화
- [ ] 보안 헤더 설정 (Helmet)
- [ ] 취약점 스캔 완료
- [ ] 의존성 보안 감사 완료

### 환경별 보안

- **스테이징**: 제한된 접근, 테스트 데이터
- **프로덕션**: 최소 권한, 실제 데이터, 감사 로그

## 성능 최적화

### 배포 후 성능 체크

- 응답 시간: < 500ms (평균)
- 메모리 사용: < 80% (컨테이너 제한)
- CPU 사용: < 70% (컨테이너 제한)
- 동시 접속: 목표치 확인

### 스케일링 고려

```bash
# 다중 컨테이너 실행
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# 로드 밸런서 설정
# Nginx 또는 Traefik 사용 권장
```