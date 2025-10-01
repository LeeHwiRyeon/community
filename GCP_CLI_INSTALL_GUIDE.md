# 🔧 GCP CLI 설치 가이드 (Windows)

## 📋 **개요**

Community Platform 2.0 v1 호스팅을 위해 GCP CLI를 설치하는 가이드입니다.

---

## 🚀 **빠른 설치 (권장)**

### **방법 1: Chocolatey 사용**

#### **1단계: Chocolatey 설치**
```powershell
# PowerShell을 관리자 권한으로 실행
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### **2단계: GCP CLI 설치**
```cmd
# 명령 프롬프트를 관리자 권한으로 실행
choco install gcloudsdk -y
```

#### **3단계: PATH 환경변수 업데이트**
```cmd
# 시스템 환경변수에 추가
setx PATH "%PATH%;C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin" /M
```

#### **4단계: 새 터미널 열기**
- 현재 터미널을 닫고 새 터미널을 열어주세요
- PATH 업데이트가 적용됩니다

---

## 🛠️ **수동 설치**

### **방법 2: 직접 다운로드**

#### **1단계: GCP CLI 다운로드**
1. [GCP CLI 다운로드 페이지](https://cloud.google.com/sdk/docs/install) 접속
2. Windows용 설치 파일 다운로드
3. 설치 파일 실행

#### **2단계: 설치 과정**
1. 설치 마법사 실행
2. 기본 설정으로 설치 진행
3. 설치 완료 후 터미널 재시작

---

## 🔧 **설치 확인**

### **GCP CLI 버전 확인**
```cmd
gcloud version
```

### **설치 성공 시 출력 예시**
```
Google Cloud SDK 450.0.1
bq 2.0.91
core 2023.11.17
gcloud 2023.11.17
gsutil 5.25
```

---

## 🚀 **GCP CLI 초기화**

### **1단계: GCP CLI 초기화**
```cmd
gcloud init
```

### **2단계: 초기화 과정**
1. **Google 계정 선택**: 브라우저에서 Google 계정으로 로그인
2. **프로젝트 선택**: 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **기본 리전 설정**: `asia-northeast3` 선택 (권장)

### **3단계: 초기화 확인**
```cmd
gcloud config list
```

---

## 🎯 **v1 호스팅 진행**

### **GCP CLI 설치 완료 후**

#### **1단계: 무료 테스트 환경 구축**
```cmd
scripts\setup-gcp-free-test.bat community-platform-v1
```

#### **2단계: 애플리케이션 배포**
```cmd
deploy-v1.bat
```

#### **3단계: 비용 모니터링**
```cmd
scripts\monitor-costs.bat community-platform-v1
```

---

## 🔍 **문제 해결**

### **문제 1: gcloud 명령어를 찾을 수 없음**
```cmd
# 해결: PATH 환경변수 확인
echo %PATH%

# 해결: GCP CLI 경로 수동 추가
setx PATH "%PATH%;C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin" /M
```

### **문제 2: 권한 오류**
```cmd
# 해결: 관리자 권한으로 실행
# 명령 프롬프트를 관리자 권한으로 실행 후 다시 시도
```

### **문제 3: 초기화 실패**
```cmd
# 해결: 수동 초기화
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

---

## 📊 **설치 후 확인사항**

### **✅ 체크리스트**
- [ ] GCP CLI 설치 완료
- [ ] `gcloud version` 명령어 실행 성공
- [ ] `gcloud init` 초기화 완료
- [ ] Google 계정 로그인 완료
- [ ] 프로젝트 설정 완료

### **🎯 다음 단계**
1. **GCP CLI 설치 완료** ✅
2. **무료 테스트 환경 구축** (다음 단계)
3. **애플리케이션 배포** (다음 단계)
4. **비용 모니터링** (다음 단계)

---

## 🎉 **완료!**

**GCP CLI 설치가 완료되면 v1 호스팅을 진행할 수 있습니다!**

### **💰 비용 정보**
- **무료 크레딧**: $300 (90일간)
- **현재 비용**: $0
- **예상 월 비용**: $0-5 (무료 등급 사용)

### **🚀 v1 호스팅 혜택**
- **무료 테스트**: 90일간 무료로 개발
- **실제 환경**: GCP의 실제 인프라 사용
- **안전한 테스트**: 실제 서비스에 영향 없음
- **완성 후 전환**: DigitalOcean으로 저렴하게 전환

---

*Community Platform 2.0 v1 호스팅 - GCP CLI 설치 가이드*

**🔧 GCP CLI를 설치하고 v1 호스팅을 시작하세요!** 🚀
