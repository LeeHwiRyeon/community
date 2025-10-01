# 🆓 Community Platform 2.0 무료 테스트 환경 가이드

## 📋 **개요**

Community Platform 2.0을 무료로 테스트할 수 있는 완전한 가이드입니다. GCP 무료 크레딧을 활용하여 실제 서비스와 동일한 환경에서 테스트할 수 있습니다.

---

## 💰 **비용 정보**

### **🆓 무료 혜택**
```yaml
GCP 무료 크레딧: $300 (90일간)
무료 등급:
  - Compute Engine: f1-micro (1 vCPU, 0.6GB RAM)
  - Cloud SQL: db-f1-micro (1 vCPU, 0.6GB RAM)
  - Memorystore: 1GB Redis
  - 네트워킹: 무제한
  - 기타 서비스: 제한적 무료 사용
```

### **💰 예상 비용**
```yaml
현재 비용: $0/월 (무료 등급 사용)
예상 월 비용: $0-5 (무료 등급 한도 내)
크레딧 사용: $300 (90일간)
```

---

## 🚀 **빠른 시작**

### **1. 무료 테스트 환경 구축**

#### **Windows에서 실행**
```cmd
# 스크립트 실행 권한 부여 (Git Bash 사용)
chmod +x scripts/setup-gcp-free-test.sh

# 무료 테스트 환경 구축
./scripts/setup-gcp-free-test.sh community-platform-test
```

#### **맥PC에서 실행**
```bash
# 스크립트 실행 권한 부여
chmod +x scripts/setup-gcp-free-test.sh

# 무료 테스트 환경 구축
./scripts/setup-gcp-free-test.sh community-platform-test
```

### **2. 애플리케이션 배포**

```bash
# 무료 테스트 환경에 배포
./scripts/deploy-free-test.sh community-platform-test
```

### **3. 비용 모니터링**

```bash
# 비용 및 리소스 사용량 확인
./scripts/monitor-costs.sh community-platform-test
```

---

## 🛠️ **상세 설정 과정**

### **1. GCP 계정 설정**

#### **GCP 계정 생성**
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. Google 계정으로 로그인
3. 새 프로젝트 생성 또는 기존 프로젝트 선택

#### **무료 크레딧 활성화**
1. 결제 계정 연결 (신용카드 정보 입력)
2. $300 무료 크레딧 자동 활성화
3. 90일간 무료 사용 가능

### **2. GCP CLI 설치 및 설정**

#### **Windows에서 설치**
```cmd
# Chocolatey 사용
choco install gcloudsdk

# 또는 수동 설치
# https://cloud.google.com/sdk/docs/install-sdk#windows
```

#### **맥PC에서 설치**
```bash
# Homebrew 사용
brew install google-cloud-sdk

# 또는 수동 설치
# https://cloud.google.com/sdk/docs/install-sdk#mac
```

#### **GCP CLI 초기화**
```bash
# GCP CLI 초기화
gcloud init

# 인증 설정
gcloud auth login

# 프로젝트 설정
gcloud config set project community-platform-test
```

### **3. 무료 테스트 환경 구축**

#### **자동 구축 (권장)**
```bash
# 무료 테스트 환경 구축
./scripts/setup-gcp-free-test.sh community-platform-test
```

#### **수동 구축**
```bash
# 1. VPC 네트워크 생성
gcloud compute networks create community-platform-test-vpc --subnet-mode=custom

# 2. 서브넷 생성
gcloud compute networks subnets create community-platform-test-subnet \
    --network=community-platform-test-vpc \
    --range=10.0.0.0/24 \
    --region=asia-northeast3

# 3. 방화벽 규칙 생성
gcloud compute firewall-rules create allow-http \
    --network=community-platform-test-vpc \
    --allow=tcp:80 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=http-server

# 4. Compute Engine 인스턴스 생성 (무료 등급)
gcloud compute instances create community-platform-test-vm \
    --zone=asia-northeast3-a \
    --machine-type=f1-micro \
    --network-interface=subnet=community-platform-test-subnet,no-address \
    --create-disk=auto-delete=yes,boot=yes,device-name=community-platform-test-vm,image=projects/ubuntu-os-cloud/global/images/family/ubuntu-2004-lts,mode=rw,size=30,type=pd-standard \
    --tags=http-server,https-server,ssh-server,app-server

# 5. Cloud SQL 인스턴스 생성 (무료 등급)
gcloud sql instances create community-platform-test-db \
    --database-version=MYSQL_8_0 \
    --tier=db-f1-micro \
    --region=asia-northeast3 \
    --storage-type=HDD \
    --storage-size=10GB

# 6. Memorystore 인스턴스 생성 (무료 등급)
gcloud redis instances create community-platform-test-redis \
    --size=1 \
    --region=asia-northeast3 \
    --network=projects/community-platform-test/global/networks/community-platform-test-vpc
```

---

## 🔧 **애플리케이션 배포**

### **1. 자동 배포 (권장)**

```bash
# 무료 테스트 환경에 배포
./scripts/deploy-free-test.sh community-platform-test
```

### **2. 수동 배포**

#### **인스턴스에 SSH 접속**
```bash
# SSH 접속
gcloud compute ssh community-platform-test-vm --zone=asia-northeast3-a
```

#### **애플리케이션 설치**
```bash
# 시스템 업데이트
sudo apt-get update

# Node.js 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Git 설치
sudo apt-get install -y git

# 애플리케이션 클론
git clone https://github.com/your-repo/community-platform.git /home/ubuntu/app
cd /home/ubuntu/app

# 의존성 설치
npm install
cd server-backend && npm install && cd ..
cd frontend && npm install && cd ..

# 환경 변수 설정
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://app_user:test_password_123@DB_IP:3306/community_platform
REDIS_URL=redis://REDIS_IP:6379
EOF

# 프론트엔드 빌드
cd frontend && npm run build && cd ..

# PM2 설치 및 실행
sudo npm install -g pm2
pm2 start server-backend/api-server/server.js --name community-platform
pm2 save
pm2 startup
```

---

## 📊 **비용 모니터링**

### **1. 자동 모니터링**

```bash
# 비용 및 리소스 사용량 확인
./scripts/monitor-costs.sh community-platform-test
```

### **2. 수동 모니터링**

#### **GCP 콘솔에서 확인**
- [비용 대시보드](https://console.cloud.google.com/billing)
- [리소스 사용량](https://console.cloud.google.com/compute/instances)
- [예산 관리](https://console.cloud.google.com/billing/budgets)

#### **명령어로 확인**
```bash
# Compute Engine 사용량
gcloud compute instances list

# Cloud SQL 사용량
gcloud sql instances list

# Memorystore 사용량
gcloud redis instances list

# 비용 정보
gcloud billing budgets list
```

### **3. 비용 알림 설정**

```bash
# 예산 알림 설정
gcloud billing budgets create \
    --billing-account=$(gcloud billing accounts list --format="value(name)" --limit=1) \
    --display-name="Community Platform Test Budget" \
    --budget-amount=10USD \
    --threshold-rule=percent=50 \
    --threshold-rule=percent=90 \
    --threshold-rule=percent=100
```

---

## 🗑️ **리소스 정리**

### **1. 자동 정리 (권장)**

```bash
# 무료 테스트 환경 정리
./cleanup-test.sh
```

### **2. 수동 정리**

```bash
# 인스턴스 삭제
gcloud compute instances delete community-platform-test-vm --zone=asia-northeast3-a

# 데이터베이스 삭제
gcloud sql instances delete community-platform-test-db

# Redis 삭제
gcloud redis instances delete community-platform-test-redis --region=asia-northeast3

# VPC 네트워크 삭제
gcloud compute networks delete community-platform-test-vpc

# 프로젝트 삭제 (선택사항)
gcloud projects delete community-platform-test
```

---

## 🚀 **실제 서비스 전환**

### **1. 서비스 선택**

#### **🥇 DigitalOcean (가장 저렴)**
```yaml
월 비용: $56-71
장점: 간단한 관리, 빠른 배포
단점: 제한적 서비스, 확장성 제한
```

#### **🥈 GCP 표준 (기능 대비 최적)**
```yaml
월 비용: $135-200
장점: 강력한 기능, 높은 확장성, AI/ML 준비
단점: 상대적으로 높은 비용
```

#### **🥉 AWS (안정성 우수)**
```yaml
월 비용: $160-240
장점: 높은 안정성, 풍부한 서비스
단점: 복잡한 관리, 높은 비용
```

### **2. 전환 과정**

#### **1단계: 무료 테스트 완료**
- [ ] 모든 기능 테스트 완료
- [ ] 성능 검증 완료
- [ ] 사용자 피드백 수집 완료
- [ ] 버그 수정 완료

#### **2단계: 실제 서비스 환경 구축**
- [ ] 서비스 선택 (DigitalOcean 권장)
- [ ] 인프라 구축
- [ ] 애플리케이션 배포
- [ ] 도메인 설정
- [ ] SSL 인증서 설정

#### **3단계: 무료 테스트 환경 정리**
- [ ] 리소스 삭제
- [ ] 비용 정리
- [ ] 프로젝트 삭제

---

## 🔍 **문제 해결**

### **1. 일반적인 문제**

#### **GCP CLI 인증 문제**
```bash
# 문제: gcloud auth login 실패
# 해결: 브라우저에서 인증 완료
gcloud auth login --no-launch-browser
```

#### **인스턴스 생성 실패**
```bash
# 문제: 인스턴스 생성 실패
# 해결: 리전 변경 또는 리소스 확인
gcloud compute regions list
gcloud compute zones list
```

#### **데이터베이스 연결 실패**
```bash
# 문제: 데이터베이스 연결 실패
# 해결: 방화벽 규칙 확인
gcloud compute firewall-rules list
```

### **2. 비용 관련 문제**

#### **예상보다 높은 비용**
```bash
# 문제: 예상보다 높은 비용
# 해결: 리소스 사용량 확인
./scripts/monitor-costs.sh
```

#### **무료 크레딧 초과**
```bash
# 문제: 무료 크레딧 초과
# 해결: 리소스 정리 또는 유료 전환
./cleanup-test.sh
```

---

## 📋 **체크리스트**

### **✅ 무료 테스트 환경 구축**
- [ ] GCP 계정 생성 및 무료 크레딧 활성화
- [ ] GCP CLI 설치 및 설정
- [ ] 무료 테스트 환경 구축
- [ ] 애플리케이션 배포
- [ ] 헬스 체크 통과

### **✅ 개발 및 테스트**
- [ ] 모든 기능 테스트 완료
- [ ] 성능 검증 완료
- [ ] 사용자 피드백 수집
- [ ] 버그 수정 완료
- [ ] 릴리즈 v1 완성

### **✅ 실제 서비스 전환**
- [ ] 서비스 선택 (DigitalOcean 권장)
- [ ] 실제 서비스 환경 구축
- [ ] 애플리케이션 배포
- [ ] 도메인 및 SSL 설정
- [ ] 무료 테스트 환경 정리

---

## 🎯 **최종 권장사항**

### **💰 비용 우선: DigitalOcean 선택**
- **월 비용**: $56-71 (가장 저렴)
- **장점**: 간단한 관리, 빠른 배포
- **단점**: 제한적 서비스, 확장성 제한

### **🚀 기능 우선: GCP 표준 선택**
- **월 비용**: $135-200 (기능 대비 최적)
- **장점**: 강력한 기능, 높은 확장성, AI/ML 준비
- **단점**: 상대적으로 높은 비용

### **🆓 무료 테스트 전략**
1. **무료 크레딧 활용**: GCP $300 크레딧 사용
2. **무료 등급 사용**: f1-micro, db-f1-micro 사용
3. **90일간 테스트**: 충분한 개발 및 테스트 시간
4. **비용 모니터링**: 예산 알림 설정으로 비용 관리
5. **완료 후 정리**: 테스트 완료 후 리소스 삭제

---

## 🎉 **결론**

### **🆓 무료 테스트 환경의 장점**
- **비용 부담 없음**: $0으로 실제 서비스와 동일한 환경 테스트
- **충분한 시간**: 90일간 무료 사용 가능
- **실제 환경**: GCP의 실제 인프라 사용
- **안전한 테스트**: 실제 서비스에 영향 없이 테스트

### **🚀 다음 단계**
1. **무료 테스트 환경 구축**: `./scripts/setup-gcp-free-test.sh`
2. **애플리케이션 배포**: `./scripts/deploy-free-test.sh`
3. **개발 및 테스트**: 90일간 무료로 개발
4. **릴리즈 v1 완성**: 모든 기능 완성
5. **실제 서비스 전환**: DigitalOcean 또는 GCP 표준 선택

**매니저님! 이제 무료로 안전하게 테스트하면서 릴리즈 v1을 완성할 수 있습니다!** 🎉

---

*Community Platform 2.0 - 무료 테스트 환경 가이드*

**🆓 무료로 테스트하고, 완성 후 실제 서비스로 전환하세요!** 🚀
