# 🚀 프로덕션 배포 가이드

## 📋 개요

이 가이드는 커뮤니티 플랫폼을 프로덕션 환경에 배포하는 방법을 설명합니다.

## 🔧 사전 요구사항

### 시스템 요구사항
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+
- **CPU**: 4코어 이상
- **RAM**: 8GB 이상
- **Storage**: 50GB 이상 (SSD 권장)
- **Network**: 안정적인 인터넷 연결

### 소프트웨어 요구사항
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: 2.30+
- **curl**: 7.68+

## 📦 배포 파일 구조

```
community/
├── docker-compose.production.yml    # 프로덕션 Docker Compose 설정
├── Dockerfile.production            # 프로덕션 Dockerfile
├── env.production.template          # 환경 변수 템플릿
├── nginx/
│   └── nginx.production.conf        # 프로덕션 Nginx 설정
├── scripts/
│   ├── deploy-production.sh         # 배포 스크립트
│   └── verify-deployment.sh         # 배포 검증 스크립트
└── monitoring/
    ├── prometheus/
    └── grafana/
```

## 🚀 배포 단계

### 1단계: 환경 설정

#### 1.1 환경 변수 파일 생성
```bash
# 템플릿 파일을 복사
cp env.production.template .env.production

# 환경 변수 편집
nano .env.production
```

#### 1.2 필수 환경 변수 설정
```bash
# 데이터베이스 설정
DATABASE_HOST=localhost
DATABASE_NAME=community_production
DATABASE_USER=community_user
DATABASE_PASSWORD=your_secure_password

# Redis 설정
REDIS_PASSWORD=your_redis_password

# JWT 설정
JWT_SECRET=your_super_secure_jwt_secret_key

# 보안 설정
MYSQL_ROOT_PASSWORD=your_mysql_root_password
GRAFANA_PASSWORD=your_grafana_password
```

### 2단계: SSL 인증서 준비

#### 2.1 Let's Encrypt 인증서 (권장)
```bash
# Certbot 설치
sudo apt update
sudo apt install certbot

# 인증서 발급
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# 인증서를 Nginx 디렉토리로 복사
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
```

#### 2.2 자체 서명 인증서 (개발/테스트용)
```bash
# SSL 디렉토리 생성
mkdir -p nginx/ssl

# 자체 서명 인증서 생성
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/key.pem \
    -out nginx/ssl/cert.pem \
    -subj "/C=KR/ST=Seoul/L=Seoul/O=Community/CN=yourdomain.com"
```

### 3단계: 배포 실행

#### 3.1 배포 스크립트 실행
```bash
# 실행 권한 부여
chmod +x scripts/deploy-production.sh
chmod +x scripts/verify-deployment.sh

# 배포 실행
./scripts/deploy-production.sh
```

#### 3.2 수동 배포 (스크립트 사용 불가 시)
```bash
# 1. 기존 컨테이너 중지
docker-compose -f docker-compose.production.yml down

# 2. 이미지 빌드
docker-compose -f docker-compose.production.yml build

# 3. 서비스 시작
docker-compose -f docker-compose.production.yml up -d

# 4. 상태 확인
docker-compose -f docker-compose.production.yml ps
```

### 4단계: 배포 검증

#### 4.1 자동 검증
```bash
# 검증 스크립트 실행
./scripts/verify-deployment.sh
```

#### 4.2 수동 검증
```bash
# 서비스 상태 확인
docker-compose -f docker-compose.production.yml ps

# 로그 확인
docker-compose -f docker-compose.production.yml logs -f

# API 테스트
curl http://localhost:50000/api/health-check
curl http://localhost/api/health-check

# 웹사이트 접근
curl http://localhost
```

## 🔍 서비스 확인

### 접근 URL
- **웹사이트**: https://yourdomain.com
- **API**: https://yourdomain.com/api/
- **Prometheus**: https://yourdomain.com:9090
- **Grafana**: https://yourdomain.com:3000

### 기본 계정
- **Grafana**: admin / ${GRAFANA_PASSWORD}
- **MySQL**: root / ${MYSQL_ROOT_PASSWORD}

## 📊 모니터링 설정

### 1. Grafana 대시보드 설정
1. http://yourdomain.com:3000 접속
2. admin / ${GRAFANA_PASSWORD} 로 로그인
3. Prometheus 데이터소스 추가
4. 대시보드 임포트

### 2. Prometheus 메트릭 확인
- **메트릭 URL**: http://yourdomain.com:9090/metrics
- **대시보드**: http://yourdomain.com:9090

## 🛠️ 운영 관리

### 서비스 관리 명령어

#### 서비스 시작/중지
```bash
# 서비스 시작
docker-compose -f docker-compose.production.yml up -d

# 서비스 중지
docker-compose -f docker-compose.production.yml down

# 서비스 재시작
docker-compose -f docker-compose.production.yml restart
```

#### 로그 확인
```bash
# 전체 로그
docker-compose -f docker-compose.production.yml logs -f

# 특정 서비스 로그
docker-compose -f docker-compose.production.yml logs -f backend
docker-compose -f docker-compose.production.yml logs -f frontend
```

#### 백업 및 복원
```bash
# 데이터베이스 백업
docker exec community-mysql-prod mysqldump -u root -p${MYSQL_ROOT_PASSWORD} community_production > backup.sql

# 데이터베이스 복원
docker exec -i community-mysql-prod mysql -u root -p${MYSQL_ROOT_PASSWORD} community_production < backup.sql
```

### 업데이트 배포

#### 1. 코드 업데이트
```bash
# 최신 코드 가져오기
git pull origin main

# 이미지 재빌드 및 배포
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d
```

#### 2. 롤백
```bash
# 이전 버전으로 롤백
git checkout previous-version
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d
```

## 🔒 보안 설정

### 1. 방화벽 설정
```bash
# UFW 방화벽 설정 (Ubuntu)
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw enable
```

### 2. SSL 인증서 자동 갱신
```bash
# Crontab에 자동 갱신 추가
0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f /path/to/docker-compose.production.yml restart nginx
```

### 3. 보안 모니터링
- 정기적인 보안 업데이트 확인
- 로그 모니터링
- 침입 탐지 시스템 설정

## 🚨 문제 해결

### 일반적인 문제

#### 1. 서비스 시작 실패
```bash
# 로그 확인
docker-compose -f docker-compose.production.yml logs

# 컨테이너 상태 확인
docker ps -a

# 포트 충돌 확인
netstat -tulpn | grep :50000
```

#### 2. 데이터베이스 연결 실패
```bash
# MySQL 컨테이너 상태 확인
docker exec community-mysql-prod mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SHOW DATABASES;"

# 연결 정보 확인
docker-compose -f docker-compose.production.yml config
```

#### 3. SSL 인증서 문제
```bash
# 인증서 유효성 확인
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Nginx 설정 테스트
docker exec community-nginx-prod nginx -t
```

### 성능 최적화

#### 1. 메모리 사용량 최적화
```bash
# 메모리 사용량 확인
docker stats

# 컨테이너 리소스 제한 설정
# docker-compose.production.yml에서 resources 설정
```

#### 2. 데이터베이스 최적화
```bash
# 데이터베이스 성능 분석
docker exec community-mysql-prod mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SHOW PROCESSLIST;"
```

## 📞 지원 및 문의

### 기술 지원
- **이메일**: dev@community-platform.com
- **슬랙**: #production-support
- **문서**: [운영 가이드](./OPERATIONS_GUIDE.md)

### 긴급 상황
- **24/7 지원**: +82-2-1234-5678
- **이메일**: emergency@community-platform.com

---

*이 가이드는 커뮤니티 플랫폼 v2.0.0 프로덕션 배포를 위한 것입니다.*  
*작성일: 2024년 7월 29일*  
*최종 업데이트: 2024년 7월 29일*
