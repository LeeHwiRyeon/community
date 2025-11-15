# Docker Deployment Guide

## 📋 목차

1. [개요](#개요)
2. [사전 요구사항](#사전-요구사항)
3. [주요 이슈 및 해결 방법](#주요-이슈-및-해결-방법)
4. [Docker Compose 서비스 구성](#docker-compose-서비스-구성)
5. [배포 절차](#배포-절차)
6. [트러블슈팅](#트러블슈팅)

---

## 개요

Community Platform을 Docker Compose를 사용하여 배포하는 가이드입니다.

**⚠️ 중요: 현재 docker-compose.yml은 MySQL 기반이지만, 실제 코드는 SQLite를 사용합니다.**

---

## 사전 요구사항

### 필수 설치 항목

- **Docker Desktop** 4.x 이상 (Windows/Mac)
- **Docker Engine** 20.x 이상 (Linux)
- **Docker Compose** V2 이상
- 최소 4GB RAM 권장 (8GB 이상 추천)

### 설치 확인

```powershell
# Docker 버전 확인
docker --version

# Docker Compose 버전 확인
docker compose version
```

---

## 주요 이슈 및 해결 방법

### 1. 데이터베이스 불일치

**상태: ✅ 해결됨 (2025-11-14)**

**이전 문제:**
- `docker-compose.yml`: MySQL 8.0 사용
- 실제 코드 (`server-backend/src/db.js`): SQLite 사용

**해결 방법: 옵션 A 적용됨 (SQLite로 Docker Compose 수정)**

`docker-compose.yml`이 SQLite를 사용하도록 수정되었습니다:

```yaml
services:
  backend:
    volumes:
      - backend_data:/app/data  # SQLite DB 영속성
    environment:
      - NODE_ENV=production
      - PORT=50000
      # MySQL 환경변수 제거됨
    depends_on:
      - redis
      - elasticsearch
    # read_only 제거 (SQLite 쓰기 권한 필요)

volumes:
  backend_data:
    driver: local
```

**변경 사항:**
- ✅ MySQL database 서비스 제거
- ✅ backend에 `backend_data` 볼륨 추가
- ✅ MySQL 환경변수 제거 (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)
- ✅ `read_only: true` 제거 (SQLite 쓰기 권한 필요)
- ✅ database 의존성 제거

**참고:**
향후 MySQL이 필요한 경우 `server-backend/src/db.js`를 수정하여 MySQL 지원을 추가해야 합니다.

### 2. 포트 충돌

**문제:**
- `docker-compose.yml`: 백엔드 포트 50000
- 현재 개발 환경: 포트 3001

**해결 방법:**

로컬 개발과 Docker 배포 시 포트가 다르므로 환경변수로 관리:

```env
# .env.development (로컬)
PORT=3001
VITE_API_BASE_URL=http://localhost:3001

# .env.production (Docker)
PORT=50000
VITE_API_BASE_URL=http://localhost:50000
```

### 3. 마이그레이션 디렉토리 누락

**상태: ✅ 해결됨 (SQLite 사용으로 불필요)**

**이전 문제:**
```yaml
volumes:
  - ./server-backend/migrations:/docker-entrypoint-initdb.d
```
MySQL 사용 시 필요했던 마이그레이션 디렉토리가 존재하지 않았습니다.

**현재 상태:**
SQLite를 사용하므로 마이그레이션 디렉토리가 필요하지 않습니다. SQLite는 서버 시작 시 자동으로 스키마를 초기화합니다.

### 4. 읽기 전용 파일시스템

**상태: ✅ 해결됨 (read_only 제거)**

**이전 문제:**
```yaml
read_only: true
```
보안을 위해 읽기 전용으로 설정되었으나, SQLite가 쓰기 권한 필요

**해결 방법:**

backend 서비스에서 `read_only: true`를 제거하고 필요한 디렉토리만 tmpfs로 마운트:

```yaml
backend:
  # read_only 제거됨 (SQLite 쓰기 권한 필요)
  volumes:
    - backend_data:/app/data  # SQLite DB 저장
  tmpfs:
    - /tmp  # 임시 파일용
```

**보안 참고:**
프로덕션 환경에서는 최소 권한 원칙을 따라 /app/data 디렉토리만 쓰기 가능하도록 설정할 수 있습니다.

---

## Docker Compose 서비스 구성

### 서비스 목록

| 서비스            | 포트        | 설명                 | 상태        |
| ----------------- | ----------- | -------------------- | ----------- |
| **frontend**      | 3000:80     | React + Vite + Nginx | ✅ 준비 완료 |
| **backend**       | 50000:50000 | Node.js + SQLite     | ✅ 준비 완료 |
| **redis**         | 6379:6379   | Redis 7 Cache        | ✅ 준비 완료 |
| **elasticsearch** | 9200:9200   | Elasticsearch 8.11   | ✅ 준비 완료 |

**변경 사항 (2025-11-14):**
- ❌ **database (MySQL)** 서비스 제거됨
- ✅ Backend가 SQLite 사용하도록 변경됨

### 리소스 제한

```yaml
deploy:
  resources:
    limits:
      memory: 512M     # 최대 메모리
      cpus: '0.5'      # 최대 CPU
    reservations:
      memory: 256M     # 최소 메모리
      cpus: '0.25'     # 최소 CPU
```

### 헬스체크

모든 서비스는 헬스체크가 구성되어 있습니다:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:50000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

---

## 배포 절차

### 1. 환경변수 설정

```powershell
# Backend 환경변수 복사 및 설정
cd server-backend
Copy-Item .env.example .env

# .env 파일 편집 (필수)
# JWT_SECRET 설정 (최소 32자)
# DOCKER_DB_* 변수 확인
notepad .env
```

```env
# server-backend/.env (Docker 배포용)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
NODE_ENV=production
PORT=50000

# Docker용 MySQL 설정 (MySQL 사용 시)
DOCKER_DB_HOST=database
DOCKER_DB_PORT=3306
DOCKER_DB_USER=root
DOCKER_DB_PASSWORD=password1234
DOCKER_DB_NAME=community

# Docker용 Redis 설정
DOCKER_REDIS_HOST=redis
DOCKER_REDIS_PORT=6379
DOCKER_REDIS_PASSWORD=redis_password
```

```powershell
# Frontend 환경변수 복사 및 설정
cd ..\frontend
Copy-Item .env.example .env

# .env 파일 편집
notepad .env
```

```env
# frontend/.env (Docker 배포용)
VITE_API_BASE_URL=http://backend:50000
VITE_WS_URL=ws://backend:50000
VITE_APP_ENV=production
```

### 2. Docker Compose 설정 검증

```powershell
# 프로젝트 루트로 이동
cd C:\Users\hwi\Desktop\Projects\community

# 설정 검증
docker compose config

# 설정이 올바르게 로드되었는지 확인
docker compose config --services
```

### 3. 이미지 빌드

```powershell
# 모든 서비스 이미지 빌드
docker compose build

# 특정 서비스만 빌드
docker compose build backend
docker compose build frontend
```

빌드 시간: 약 5-10분 (첫 빌드)

### 4. 서비스 시작

```powershell
# 백그라운드로 모든 서비스 시작
docker compose up -d

# 로그 확인하며 시작
docker compose up

# 특정 서비스만 시작
docker compose up -d backend redis
```

### 5. 상태 확인

```powershell
# 실행 중인 컨테이너 확인
docker compose ps

# 로그 확인
docker compose logs -f backend
docker compose logs -f frontend

# 헬스체크 상태 확인
docker compose ps --format json | ConvertFrom-Json | Select-Object Name, Status, Health
```

### 6. 애플리케이션 접속

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:50000
- **Backend Health**: http://localhost:50000/api/health
- **Elasticsearch**: http://localhost:9200
- **Redis**: localhost:6379 (redis-cli 필요)

### 7. 서비스 중지

```powershell
# 서비스 중지 (컨테이너 유지)
docker compose stop

# 서비스 중지 및 컨테이너 삭제
docker compose down

# 볼륨까지 삭제 (⚠️ 데이터 손실 주의)
docker compose down -v
```

---

## 트러블슈팅

### 1. 컨테이너가 시작되지 않음

```powershell
# 특정 서비스 로그 확인
docker compose logs backend

# 컨테이너 내부 접속
docker compose exec backend sh

# 헬스체크 실패 확인
docker compose ps
```

**일반적인 원인:**
- 환경변수 누락 (JWT_SECRET 등)
- 포트 충돌 (다른 프로세스가 포트 사용 중)
- 볼륨 권한 문제
- 네트워크 연결 실패

### 2. Database connection 에러

**SQLite 사용 시:**
```powershell
# backend 컨테이너 확인
docker compose exec backend ls -la /app/data

# 권한 확인
docker compose exec backend whoami
```

**MySQL 사용 시:**
```powershell
# MySQL 컨테이너 상태 확인
docker compose exec database mysqladmin ping -p

# MySQL 로그 확인
docker compose logs database
```

### 3. 빌드 실패

```powershell
# 캐시 없이 재빌드
docker compose build --no-cache

# 특정 서비스만 재빌드
docker compose build --no-cache backend
```

### 4. 볼륨 문제

```powershell
# 볼륨 목록 확인
docker volume ls

# 특정 볼륨 검사
docker volume inspect community_backend_data

# 볼륨 삭제 (⚠️ 데이터 손실)
docker volume rm community_backend_data
```

### 5. 네트워크 문제

```powershell
# 네트워크 확인
docker network ls

# 네트워크 검사
docker network inspect community_community-network

# 서비스 간 연결 테스트
docker compose exec backend ping database
docker compose exec frontend ping backend
```

### 6. 메모리 부족

```powershell
# 컨테이너 리소스 사용량 확인
docker stats

# 리소스 제한 완화 (docker-compose.yml 수정)
# limits.memory: 512M -> 1G
```

### 7. 포트 충돌

```powershell
# 포트 사용 중인 프로세스 확인
netstat -ano | findstr :50000
netstat -ano | findstr :3000

# 프로세스 종료
Stop-Process -Id <PID>

# 또는 docker-compose.yml의 포트 변경
ports:
  - "50001:50000"  # 호스트 포트 변경
```

---

## 유지보수

### 로그 관리

```powershell
# 로그 크기 제한 (docker-compose.yml)
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 백업

```powershell
# SQLite 데이터베이스 백업
docker compose exec backend cp /app/data/community.db /app/data/community.db.backup

# 볼륨 백업
docker run --rm -v community_backend_data:/data -v ${PWD}:/backup alpine tar czf /backup/backend_data_backup.tar.gz -C /data .
```

### 업데이트

```powershell
# 이미지 재빌드
docker compose build

# 서비스 재시작 (다운타임 최소화)
docker compose up -d --no-deps --build backend
```

---

## 보안 고려사항

### 1. 환경변수 보안

```powershell
# .env 파일 권한 설정 (Linux/Mac)
chmod 600 .env

# Git에서 제외
echo ".env" >> .gitignore
```

### 2. 컨테이너 보안

- ✅ 비루트 사용자 실행 (`user: "1001:1001"`)
- ✅ 읽기 전용 파일시스템 (`read_only: true`)
- ✅ 리소스 제한 (`deploy.resources`)
- ✅ 헬스체크 구성

### 3. 네트워크 보안

```yaml
# 프로덕션 환경에서는 포트 노출 최소화
# frontend만 외부 노출, 나머지는 내부 네트워크
services:
  frontend:
    ports:
      - "80:80"
  backend:
    expose:
      - "50000"  # 외부 노출 X
```

---

## 다음 단계

1. ✅ `.env.example` 파일에 Docker 설정 추가 완료
2. ⚠️ **데이터베이스 불일치 해결 필요** (MySQL vs SQLite)
3. ⏳ `server-backend/migrations` 디렉토리 생성
4. ⏳ Docker 환경 테스트
5. ⏳ CI/CD 파이프라인 구성

---

## 참고 자료

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [Nginx Docker Official Image](https://hub.docker.com/_/nginx)
- [Node.js Docker Official Image](https://hub.docker.com/_/node)

---

## 문의 및 지원

문제가 발생하면 다음을 확인하세요:

1. `docker compose logs <service>` - 로그 확인
2. `docker compose ps` - 서비스 상태 확인
3. `docker compose config` - 설정 검증
4. GitHub Issues 또는 팀 채널에 문의

