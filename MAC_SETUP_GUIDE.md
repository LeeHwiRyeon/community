# 🍎 맥PC에서 Community Platform 2.0 원클릭 인프라 구축 가이드

## 📋 **개요**

맥PC에서 Community Platform 2.0의 GCP 인프라를 원클릭으로 구축하는 완전한 가이드입니다.

---

## 🛠️ **맥PC 환경 준비**

### **1. 필수 도구 설치**

#### **Homebrew 설치 (아직 없다면)**
```bash
# Homebrew 설치
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# PATH 설정 (Apple Silicon Mac)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc

# PATH 설정 (Intel Mac)
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
```

#### **필수 도구 설치**
```bash
# Google Cloud CLI 설치
brew install google-cloud-sdk

# Docker 설치
brew install --cask docker

# Node.js 설치 (18.x)
brew install node@18

# Git 설치 (이미 있을 수 있음)
brew install git

# jq 설치 (JSON 처리)
brew install jq

# curl 설치 (이미 있을 수 있음)
brew install curl
```

### **2. GCP CLI 설정**

#### **GCP CLI 초기화**
```bash
# GCP CLI 초기화
gcloud init

# 인증 설정
gcloud auth login

# 기본 프로젝트 설정
gcloud config set project YOUR_PROJECT_ID
```

#### **필요한 API 활성화**
```bash
# 필요한 API 활성화
gcloud services enable compute.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable redis.googleapis.com
gcloud services enable dns.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
```

---

## 🚀 **원클릭 인프라 구축**

### **1. 스크립트 다운로드 및 실행**

#### **스크립트 실행 권한 부여**
```bash
# 스크립트 실행 권한 부여
chmod +x scripts/setup-gcp-hosting.sh

# 스크립트 실행
./scripts/setup-gcp-hosting.sh community-platform-2 your-domain.com
```

#### **실행 과정 설명**
```bash
# 1단계: GCP CLI 설치 확인
✅ GCP CLI 확인 완료

# 2단계: GCP 인증 확인
✅ GCP 인증 확인 완료

# 3단계: 프로젝트 설정
✅ 프로젝트 설정 완료

# 4단계: API 활성화
✅ API 활성화 완료

# 5단계: VPC 네트워크 생성
✅ VPC 네트워크 생성 완료

# 6단계: Compute Engine 인스턴스 생성
✅ Compute Engine 인스턴스 생성 완료

# 7단계: Cloud SQL 인스턴스 생성
✅ Cloud SQL 인스턴스 생성 완료

# 8단계: Memorystore (Redis) 인스턴스 생성
✅ Memorystore 인스턴스 생성 완료

# 9단계: 로드 밸런서 설정
✅ 로드 밸런서 설정 완료

# 10단계: SSL 인증서 설정
✅ SSL 인증서 설정 완료

# 11단계: DNS 설정
✅ DNS 설정 완료

# 12단계: 배포 스크립트 생성
✅ 배포 스크립트 생성 완료
```

### **2. 생성되는 리소스**

#### **GCP 리소스 목록**
```yaml
# 네트워킹
- VPC: community-platform-vpc
- 서브넷: community-platform-subnet
- 방화벽 규칙: allow-http, allow-https, allow-ssh, allow-app

# 컴퓨팅
- Compute Engine: community-platform-vm (e2-standard-4)
- 부트 디스크: 100GB SSD

# 데이터베이스
- Cloud SQL: community-platform-db (MySQL 8.0)
- 데이터베이스: community_platform
- 사용자: app_user

# 캐시
- Memorystore: community-platform-redis (4GB)

# 로드 밸런싱
- 백엔드 서비스: community-platform-backend
- URL 맵: community-platform-url-map
- HTTP 프록시: community-platform-http-proxy
- HTTPS 프록시: community-platform-https-proxy

# SSL 인증서
- 관리형 SSL: community-platform-ssl-cert

# DNS
- DNS 존: community-platform-zone
- A 레코드: your-domain.com, www.your-domain.com
```

---

## 🔧 **맥PC 특화 설정**

### **1. SSH 키 설정**

#### **SSH 키 생성**
```bash
# SSH 키 생성 (이미 존재하면 무시)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/gcp_rsa -N ""

# SSH 키 확인
ls -la ~/.ssh/gcp_rsa*
```

#### **SSH 설정 파일 생성**
```bash
# SSH 설정 파일 생성
cat >> ~/.ssh/config << EOF
Host community-platform-vm
    HostName EXTERNAL_IP
    User ubuntu
    IdentityFile ~/.ssh/gcp_rsa
    StrictHostKeyChecking no
EOF
```

### **2. Docker 설정**

#### **Docker Desktop 실행**
```bash
# Docker Desktop 실행
open -a Docker

# Docker 상태 확인
docker --version
docker-compose --version
```

#### **Docker 로그인 (GCP Container Registry)**
```bash
# GCP Container Registry 인증
gcloud auth configure-docker

# Docker 로그인 테스트
docker pull hello-world
```

### **3. 환경 변수 설정**

#### **환경 변수 파일 생성**
```bash
# .env 파일 생성
cat > .env << EOF
# GCP 설정
GCP_PROJECT_ID=community-platform-2
GCP_REGION=asia-northeast3
GCP_ZONE=asia-northeast3-a

# 데이터베이스 설정
DATABASE_URL=mysql://app_user:PASSWORD@PRIVATE_IP:3306/community_platform
REDIS_URL=redis://PRIVATE_IP:6379

# 애플리케이션 설정
NODE_ENV=production
PORT=3000

# 도메인 설정
DOMAIN=your-domain.com
EOF
```

---

## 🚀 **애플리케이션 배포**

### **1. 배포 스크립트 실행**

#### **배포 스크립트 실행**
```bash
# 배포 스크립트 실행
./deploy-to-gcp.sh

# 배포 과정 설명
echo "🚀 Community Platform 2.0 GCP 배포 시작"

# 1. 애플리케이션 빌드
echo "🔨 애플리케이션 빌드..."
npm run build:prod

# 2. Docker 이미지 빌드
echo "🐳 Docker 이미지 빌드..."
docker build -t community-platform:latest .

# 3. 이미지를 GCP Container Registry에 푸시
echo "📤 이미지 푸시..."
docker tag community-platform:latest gcr.io/PROJECT_ID/community-platform:latest
docker push gcr.io/PROJECT_ID/community-platform:latest

# 4. 인스턴스에 배포
echo "🚀 인스턴스에 배포..."
gcloud compute ssh community-platform-vm --zone=ZONE --command="
    # Docker 이미지 풀
    docker pull gcr.io/PROJECT_ID/community-platform:latest
    
    # 기존 컨테이너 중지 및 제거
    docker stop community-platform || true
    docker rm community-platform || true
    
    # 새 컨테이너 실행
    docker run -d \\
        --name community-platform \\
        --restart=unless-stopped \\
        -p 3000:3000 \\
        -e NODE_ENV=production \\
        -e DATABASE_URL=\$DATABASE_URL \\
        -e REDIS_URL=\$REDIS_URL \\
        gcr.io/PROJECT_ID/community-platform:latest
"

echo "✅ 배포 완료!"
```

### **2. 배포 확인**

#### **애플리케이션 상태 확인**
```bash
# 인스턴스 SSH 접속
gcloud compute ssh community-platform-vm --zone=asia-northeast3-a

# 컨테이너 상태 확인
docker ps

# 애플리케이션 로그 확인
docker logs community-platform

# 헬스 체크
curl http://localhost:3000/api/health
```

#### **외부 접속 확인**
```bash
# 로드 밸런서 IP 확인
gcloud compute forwarding-rules describe community-platform-http-rule --global --format="value(IPAddress)"

# 웹사이트 접속 확인
curl -I http://YOUR_DOMAIN.com
curl -I https://YOUR_DOMAIN.com
```

---

## 🔍 **문제 해결**

### **1. 일반적인 문제**

#### **GCP CLI 인증 문제**
```bash
# 문제: gcloud auth login 실패
# 해결: 브라우저에서 인증 완료
gcloud auth login --no-launch-browser

# 문제: 프로젝트 권한 없음
# 해결: 프로젝트 소유자 권한 확인
gcloud projects get-iam-policy PROJECT_ID
```

#### **Docker 빌드 문제**
```bash
# 문제: Docker 빌드 실패
# 해결: Docker Desktop 실행 확인
open -a Docker

# 문제: 이미지 푸시 실패
# 해결: GCP Container Registry 인증
gcloud auth configure-docker
```

#### **SSH 연결 문제**
```bash
# 문제: SSH 연결 실패
# 해결: SSH 키 확인
gcloud compute ssh community-platform-vm --zone=asia-northeast3-a --dry-run

# 문제: 방화벽 규칙 문제
# 해결: 방화벽 규칙 확인
gcloud compute firewall-rules list
```

### **2. 맥PC 특화 문제**

#### **Homebrew 권한 문제**
```bash
# 문제: Homebrew 권한 오류
# 해결: 권한 수정
sudo chown -R $(whoami) /opt/homebrew
sudo chown -R $(whoami) /usr/local
```

#### **Docker Desktop 문제**
```bash
# 문제: Docker Desktop 실행 안됨
# 해결: Docker Desktop 재설치
brew uninstall --cask docker
brew install --cask docker
```

#### **Node.js 버전 문제**
```bash
# 문제: Node.js 버전 불일치
# 해결: Node.js 18.x 설치
brew uninstall node
brew install node@18
brew link node@18 --force
```

---

## 📊 **비용 모니터링**

### **1. GCP 비용 확인**

#### **비용 대시보드**
```bash
# GCP 콘솔에서 비용 확인
open https://console.cloud.google.com/billing

# 명령어로 비용 확인
gcloud billing budgets list
```

#### **리소스 사용량 확인**
```bash
# Compute Engine 사용량
gcloud compute instances list

# Cloud SQL 사용량
gcloud sql instances list

# Memorystore 사용량
gcloud redis instances list
```

### **2. 비용 최적화**

#### **자동 스케일링 설정**
```bash
# 인스턴스 그룹 자동 스케일링
gcloud compute instance-groups managed set-autoscaling community-platform-ig \
    --max-num-replicas=5 \
    --min-num-replicas=1 \
    --target-cpu-utilization=0.6 \
    --zone=asia-northeast3-a
```

#### **스팟 인스턴스 사용 (개발 환경)**
```bash
# 스팟 인스턴스 생성
gcloud compute instances create community-platform-vm-spot \
    --zone=asia-northeast3-a \
    --machine-type=e2-standard-4 \
    --preemptible \
    --restart-on-failure
```

---

## 🎯 **최종 체크리스트**

### **✅ 맥PC 환경 준비**
- [ ] Homebrew 설치 완료
- [ ] GCP CLI 설치 및 인증 완료
- [ ] Docker Desktop 설치 및 실행 완료
- [ ] Node.js 18.x 설치 완료
- [ ] SSH 키 생성 완료

### **✅ GCP 인프라 구축**
- [ ] 프로젝트 생성 완료
- [ ] API 활성화 완료
- [ ] VPC 네트워크 생성 완료
- [ ] Compute Engine 인스턴스 생성 완료
- [ ] Cloud SQL 인스턴스 생성 완료
- [ ] Memorystore 인스턴스 생성 완료
- [ ] 로드 밸런서 설정 완료
- [ ] SSL 인증서 설정 완료
- [ ] DNS 설정 완료

### **✅ 애플리케이션 배포**
- [ ] 애플리케이션 빌드 완료
- [ ] Docker 이미지 빌드 완료
- [ ] GCP Container Registry 푸시 완료
- [ ] 인스턴스 배포 완료
- [ ] 헬스 체크 통과 완료

---

## 🎉 **최종 결과**

### **🌐 완성된 인프라**
- **웹사이트**: https://your-domain.com
- **API**: https://your-domain.com/api
- **관리자**: https://your-domain.com/admin
- **모니터링**: GCP 콘솔

### **💰 예상 월 비용**
- **GCP 기본 구성**: $135-200
- **DigitalOcean 대안**: $56-71
- **비용 최적화 후**: 20-30% 절약 가능

### **🚀 다음 단계**
1. **도메인 설정**: DNS 설정 완료
2. **SSL 인증서**: 자동 발급 대기
3. **모니터링**: Uptime Robot 설정
4. **백업**: 자동 백업 스케줄
5. **사용자 알림**: 서비스 공개

---

*Community Platform 2.0 - 맥PC 원클릭 인프라 구축 가이드*

**🍎 맥PC에서 Community Platform 2.0을 원클릭으로 구축하세요!** 🚀
