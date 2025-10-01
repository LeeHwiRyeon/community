# Community Hub 프로젝트 구조

## 📁 **최종 프로젝트 구조 (2025-10-02 업데이트)**

```
community/
├── 📁 frontend/                    # React + TypeScript 프론트엔드
│   ├── src/                        # 소스 코드
│   │   ├── components/             # React 컴포넌트
│   │   ├── pages/                  # 페이지 컴포넌트
│   │   ├── contexts/               # React Context
│   │   ├── hooks/                  # 커스텀 훅
│   │   ├── api/                    # API 클라이언트
│   │   └── utils/                  # 유틸리티 함수
│   ├── public/                     # 정적 파일
│   ├── dist/                       # 빌드 결과물
│   ├── tests/                      # 테스트 파일
│   └── package.json                # 프론트엔드 의존성
│
├── 📁 server-backend/              # Express.js 백엔드
│   ├── src/                        # 소스 코드
│   │   ├── auth/                   # 인증 관련
│   │   ├── config/                 # 설정 파일
│   │   ├── services/               # 비즈니스 로직
│   │   └── routes/                 # API 라우트
│   ├── scripts/                    # 유틸리티 스크립트
│   ├── tests/                      # 테스트 파일
│   └── package.json                # 백엔드 의존성
│
├── 📁 data/                        # 초기 데이터
│   ├── boards.json                 # 게시판 데이터
│   ├── posts.json                  # 게시글 데이터
│   └── categories/                 # 카테고리 데이터
│
├── 📁 scripts/                     # 실행 스크립트
│   ├── dev-env.ps1                 # 통합 개발 환경
│   ├── stable-launcher.ps1         # 안정적인 런처
│   ├── quick-start.bat             # 빠른 시작
│   └── *.ps1, *.bat                # 기타 스크립트
│
├── 📁 docs/                        # 프로젝트 문서
│   ├── COMPLETED_FEATURES.md       # 완료된 기능
│   ├── todo-backlog.md             # 작업 백로그
│   ├── deployment.md               # 배포 가이드
│   └── *.md                        # 기타 문서
│
├── 📁 archive/                     # 아카이브 폴더
│   ├── old-versions/               # 이전 버전
│   ├── logs/                       # 로그 파일
│   ├── temp-files/                 # 임시 파일
│   └── backup/                     # 백업 파일
│
├── 📁 monitoring/                  # 모니터링 도구
├── 📁 services/                    # 외부 서비스
├── 📁 cypress/                     # E2E 테스트
├── 📁 logs/                        # 현재 로그
└── 📄 *.md                         # 프로젝트 문서
```

## 🎯 **핵심 디렉토리 설명**

### **Frontend (React + TypeScript)**
- **포트**: 5002 (개발), 5000 (프로덕션)
- **기술스택**: React 19, Vite, Chakra UI, Redux Toolkit
- **주요 기능**: 게시판, 검색, 프로필, RPG 시스템

### **Backend (Express.js)**
- **포트**: 50000
- **기술스택**: Node.js, Express, MariaDB/MySQL, Redis
- **주요 기능**: REST API, 인증, 실시간 알림, 목데이터

### **Data (목데이터)**
- **16개 게시판**: League of Legends, Valorant, Star Rail, FC Clubhouse
- **480개 게시글**: 각 게시판당 30개씩 다양한 카테고리
- **완전한 목데이터**: 이미지, 썸네일, 카테고리 포함

## 🚀 **실행 방법**

### **1. 통합 실행 (추천)**
```powershell
.\scripts\dev-env.ps1 -Action start
```

### **2. 안정적인 런처**
```powershell
.\scripts\stable-launcher.ps1 -Action start
```

### **3. 빠른 시작**
```cmd
.\scripts\quick-start.bat
```

## 🌐 **접속 URL**

| 서비스         | URL                    | 설명        |
| -------------- | ---------------------- | ----------- |
| **프론트엔드** | http://localhost:5002  | 개발 서버   |
| **프로덕션**   | http://localhost:5000  | 빌드된 버전 |
| **백엔드 API** | http://localhost:50000 | REST API    |

## 📊 **현재 상태**

- ✅ **프론트엔드**: React 19 + Vite, 모든 페이지 완성
- ✅ **백엔드**: Express.js, Mock DB 모드, 16개 게시판
- ✅ **목데이터**: 480개 게시글, 완전한 테스트 데이터
- ✅ **실행 스크립트**: 안정적인 런처, 멈추는 현상 해결
- ✅ **문서화**: 완전한 API 문서, 가이드

## 🔧 **개발 환경**

- **Node.js**: v24.9.0
- **npm**: v11.6.0
- **OS**: Windows 10/11
- **Shell**: PowerShell 7+

## 📝 **주요 기능**

1. **게시판 시스템**: 16개 게시판, CRUD 완비
2. **검색 기능**: 전체 텍스트 검색, 필터링
3. **RPG 시스템**: 레벨, XP, 배지 시스템
4. **실시간 알림**: WebSocket 기반
5. **첨부파일**: 업로드, 미리보기, 처리 큐
6. **초안 관리**: 자동 저장, 충돌 해결
7. **방송 시스템**: 라이브 스트리밍 연동

---

**최종 업데이트**: 2025-10-02  
**상태**: ✅ 완전 작동, 목데이터 완비, 안정적인 실행
