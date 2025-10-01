# 🔧 GCP CLI 수동 설치 가이드 (Windows)

## 📋 **개요**

Community Platform 2.0 v1 호스팅을 위해 GCP CLI를 수동으로 설치하는 상세한 가이드입니다.

---

## 🚀 **단계별 설치 과정**

### **1단계: GCP CLI 다운로드**

#### **방법 1: 공식 웹사이트 (권장)**
1. **브라우저에서 접속**: https://cloud.google.com/sdk/docs/install
2. **Windows 섹션 찾기**: 페이지에서 "Windows" 섹션 찾기
3. **설치 파일 다운로드**: "Google Cloud SDK installer" 클릭
4. **파일 저장**: 다운로드 폴더에 저장

#### **방법 2: 직접 다운로드 링크**
```
https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe
```

### **2단계: 설치 파일 실행**

#### **설치 파일 실행**
1. **다운로드 폴더 열기**: 파일 탐색기에서 다운로드 폴더 열기
2. **설치 파일 찾기**: `GoogleCloudSDKInstaller.exe` 파일 찾기
3. **관리자 권한으로 실행**: 
   - 파일을 우클릭
   - "관리자 권한으로 실행" 선택
   - 또는 파일을 더블클릭

#### **설치 마법사 진행**
1. **설치 마법사 시작**: 설치 마법사가 자동으로 시작
2. **라이선스 동의**: 라이선스 약관에 동의
3. **설치 경로 선택**: 기본 경로 사용 (권장)
   - 기본 경로: `C:\Program Files (x86)\Google\Cloud SDK\`
4. **설치 시작**: "Install" 버튼 클릭
5. **설치 완료 대기**: 설치 진행 상황 확인
6. **설치 완료**: "Finish" 버튼 클릭

### **3단계: 설치 확인**

#### **새 터미널 열기**
1. **현재 터미널 닫기**: 모든 명령 프롬프트/PowerShell 창 닫기
2. **새 터미널 열기**: 
   - `Win + R` 키 누르기
   - `cmd` 입력 후 Enter
   - 또는 PowerShell 열기

#### **GCP CLI 버전 확인**
```cmd
gcloud version
```

#### **설치 성공 시 출력 예시**
```
Google Cloud SDK 450.0.1
bq 2.0.91
core 2023.11.17
gcloud 2023.11.17
gsutil 5.25
```

### **4단계: GCP CLI 초기화**

#### **GCP CLI 초기화**
```cmd
gcloud init
```

#### **초기화 과정**
1. **Google 계정 선택**: 
   - 브라우저가 자동으로 열림
   - Google 계정으로 로그인
   - 권한 승인

2. **프로젝트 선택**:
   - 기존 프로젝트 선택 또는 새 프로젝트 생성
   - `community-platform-v1` 프로젝트 생성 권장

3. **기본 리전 설정**:
   - `asia-northeast3` 선택 (권장)
   - 또는 `asia-northeast1` 선택

#### **초기화 확인**
```cmd
gcloud config list
```

---

## 🔍 **문제 해결**

### **문제 1: 설치 파일이 실행되지 않음**
```cmd
# 해결: 관리자 권한으로 실행
# 파일을 우클릭 → "관리자 권한으로 실행"
```

### **문제 2: gcloud 명령어를 찾을 수 없음**
```cmd
# 해결: 새 터미널 열기
# 현재 터미널을 닫고 새 터미널 열기

# 해결: PATH 환경변수 수동 추가
setx PATH "%PATH%;C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin" /M
```

### **문제 3: 초기화 실패**
```cmd
# 해결: 수동 인증
gcloud auth login

# 해결: 프로젝트 수동 설정
gcloud config set project YOUR_PROJECT_ID
```

### **문제 4: 브라우저가 열리지 않음**
```cmd
# 해결: 수동 인증
gcloud auth login --no-launch-browser
```

---

## 📊 **설치 후 확인사항**

### **✅ 체크리스트**
- [ ] GCP CLI 설치 완료
- [ ] `gcloud version` 명령어 실행 성공
- [ ] `gcloud init` 초기화 완료
- [ ] Google 계정 로그인 완료
- [ ] 프로젝트 설정 완료
- [ ] 기본 리전 설정 완료

### **🎯 다음 단계**
1. **GCP CLI 설치 완료** ✅
2. **AUTOAGENTS 재실행** (다음 단계)
3. **자동 인프라 구축** (다음 단계)
4. **자동 애플리케이션 배포** (다음 단계)

---

## 🚀 **AUTOAGENTS 재실행**

### **GCP CLI 설치 완료 후**
```cmd
# AUTOAGENTS 재실행
node scripts/autoagents-v1-hosting.js
```

### **자동 진행 과정**
1. **GCP 초기화** - 프로젝트 생성 및 API 활성화
2. **인프라 구축** - VPC, Compute Engine, Cloud SQL, Redis
3. **로드 밸런서 구축** - 고가용성 로드 밸런싱
4. **비용 모니터링 설정** - 예산 알림 설정
5. **애플리케이션 빌드** - 프론트엔드/백엔드 빌드
6. **애플리케이션 배포** - 인스턴스에 자동 배포
7. **헬스 체크** - 자동 상태 확인
8. **보고서 생성** - 배포 결과 보고서

---

## 💰 **비용 정보**

### **🆓 무료 테스트 환경**
- **GCP 무료 크레딧**: $300 (90일간)
- **현재 비용**: $0/월
- **예상 월 비용**: $0-5 (무료 등급 사용)

### **🚀 실제 서비스 환경 (완성 후)**
- **DigitalOcean**: $56-71/월 (가장 저렴!)
- **GCP 표준**: $135-200/월 (기능 대비 최적)

---

## 🎉 **완료!**

**GCP CLI 설치가 완료되면 AUTOAGENTS가 자동으로 v1 호스팅을 진행합니다!**

### **✅ 설치 완료 후 혜택**
- **완전 자동화**: AUTOAGENTS가 모든 과정 자동 진행
- **무료 테스트**: 90일간 무료로 개발 가능
- **실시간 모니터링**: 모든 과정 실시간 추적
- **상세한 보고서**: 배포 결과 상세 보고서

### **🚀 v1 호스팅 혜택**
- **무료 크레딧**: $300 (90일간)
- **실제 환경**: GCP의 실제 인프라 사용
- **안전한 테스트**: 실제 서비스에 영향 없음
- **완성 후 전환**: DigitalOcean으로 저렴하게 전환

---

*Community Platform 2.0 v1 호스팅 - GCP CLI 수동 설치 가이드*

**🔧 GCP CLI를 설치하고 AUTOAGENTS로 자동 호스팅을 시작하세요!** 🚀
