# 🗂️ Community Platform v1.1 - 완벽한 파일구조 매핑

## 📋 **프로젝트 구조 개요**

```
📂 community/
├── 📋 **핵심 문서들**
│   ├── README.md                    # 메인 가이드 (UTF-8)
│   ├── API_REFERENCE.md             # API 문서 (UTF-8)
│   ├── FEATURES.md                  # 기능 목록 (UTF-8)
│   ├── DB_SCHEMA.md                 # 데이터베이스 스키마 (UTF-8)
│   ├── VIEWLIST.md                  # 뷰 목록
│   └── AGENT_UTF8_ENCODING_RULES.md # 에이전트 인코딩 규칙
│
├── 🎨 **프론트엔드** (frontend/)
│   ├── src/
│   │   ├── components/              # React 컴포넌트들
│   │   ├── pages/                   # 페이지 컴포넌트들
│   │   ├── hooks/                   # 커스텀 훅들
│   │   ├── store/                   # Redux 스토어
│   │   ├── App.tsx                  # 메인 앱 컴포넌트
│   │   ├── main.tsx                 # 엔트리 포인트
│   │   └── index.css                # 글로벌 스타일
│   ├── public/                      # 정적 파일들
│   ├── package.json                 # 프론트엔드 의존성
│   └── vite.config.ts               # Vite 설정
│
├── ⚙️ **백엔드** (server-backend/)
│   ├── src/
│   │   ├── index.js                 # 메인 서버 엔트리
│   │   ├── db.js                    # 데이터베이스 연결
│   │   └── routes/                  # API 라우트들
│   ├── api-server/
│   │   ├── server.js                # Express 서버
│   │   └── routes/                  # API 엔드포인트들
│   ├── services/                    # 비즈니스 로직 서비스들
│   ├── workers/                     # 백그라운드 작업들
│   ├── tests/                       # 테스트 파일들
│   └── package.json                 # 백엔드 의존성
│
├── 📊 **데이터** (data/)
│   ├── boards.json                  # 게시판 데이터
│   ├── posts.json                   # 게시글 데이터
│   ├── news.json                    # 뉴스 데이터
│   ├── menu.json                    # 메뉴 구조
│   └── categories/                  # 카테고리별 데이터
│
├── 📜 **스크립트** (scripts/)
│   ├── dev-env.ps1                  # 개발환경 실행
│   ├── cleanup-project-v1-1.ps1     # 프로젝트 정리
│   └── mock-data.js                 # 목 데이터 생성
│
├── 📚 **문서** (docs/)
│   ├── accessibility-checklist.md   # 접근성 체크리스트
│   ├── ADMIN_GUIDE.md               # 관리자 가이드
│   └── news-manuals/                # 뉴스 매뉴얼들
│
├── 🐳 **Docker 설정**
│   ├── docker-compose.yml           # 개발용 Docker 구성
│   ├── Dockerfile                   # 메인 Dockerfile
│   └── Dockerfile.production        # 프로덕션 Dockerfile
│
└── ⚙️ **설정 파일들**
    ├── .gitignore                   # Git 무시 파일들
    ├── package.json                 # 루트 의존성
    └── .vscode/                     # VSCode 설정
```

## 🎯 **파일 성격별 분류**

### 📋 **1. 핵심 문서 (Root Level)**
- **README.md** - 프로젝트 메인 가이드
- **API_REFERENCE.md** - API 문서화
- **FEATURES.md** - 기능 명세서
- **DB_SCHEMA.md** - 데이터베이스 구조
- **AGENT_UTF8_ENCODING_RULES.md** - 개발 규칙

### 🎨 **2. 프론트엔드 (frontend/)**
```
frontend/
├── src/
│   ├── components/          # 재사용 가능한 컴포넌트들
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── ChatSystem.tsx
│   │   └── VotingSystem.tsx
│   ├── pages/               # 페이지별 컴포넌트들
│   │   ├── Home.tsx
│   │   ├── CommunityHub.tsx
│   │   ├── GameCenter.tsx
│   │   ├── VIPDashboard.tsx
│   │   └── SimpleBoard.tsx
│   ├── hooks/               # 커스텀 훅들
│   │   └── useOptimizedData.ts
│   ├── store/               # 상태 관리
│   │   └── index.ts
│   └── styles/              # 스타일 파일들
└── public/                  # 정적 리소스
    └── data/                # 클라이언트용 데이터
```

### ⚙️ **3. 백엔드 (server-backend/)**
```
server-backend/
├── src/
│   ├── index.js             # 메인 서버 엔트리
│   ├── db.js                # 데이터베이스 연결
│   └── routes.js            # 기본 라우팅
├── api-server/
│   ├── server.js            # Express 앱 설정
│   └── routes/              # API 엔드포인트들
│       ├── auth.js
│       ├── boards.js
│       ├── posts.js
│       ├── vip-system.js
│       └── community-games.js
├── services/                # 비즈니스 로직
│   ├── bug-deduplication-service.js
│   ├── worker-workflow-automation.js
│   └── auto-recovery-system.js
├── workers/                 # 백그라운드 작업
└── tests/                   # 테스트 파일들
```

### 📊 **4. 데이터 (data/)**
```
data/
├── boards.json              # 게시판 구조 데이터
├── posts.json               # 게시글 목 데이터
├── news.json                # 뉴스 데이터
├── menu.json                # 네비게이션 메뉴
└── categories/              # 카테고리별 분류 데이터
```

### 📜 **5. 스크립트 (scripts/)**
```
scripts/
├── dev-env.ps1              # 통합 개발환경 실행
├── cleanup-project-v1-1.ps1 # 프로젝트 정리 스크립트
├── mock-data.js             # 목 데이터 생성기
└── auto-progress-tracker.js # 진행상황 자동 추적
```

## 🔗 **파일 간 매핑 관계**

### **Frontend ↔ Backend 매핑**
```
Frontend Page          → Backend API Route
─────────────────────────────────────────────
Home.tsx              → /api/community-content
CommunityHub.tsx      → /api/boards
GameCenter.tsx        → /api/community-games
VIPDashboard.tsx      → /api/vip-system
SimpleBoard.tsx       → /api/posts
```

### **Data ↔ API 매핑**
```
Data File             → API Endpoint
─────────────────────────────────────
data/boards.json      → /api/boards
data/posts.json       → /api/posts
data/news.json        → /api/community-content
data/menu.json        → /api/navigation
```

### **Component ↔ Service 매핑**
```
Frontend Component    → Backend Service
─────────────────────────────────────────
ChatSystem.tsx       → services/chatService.js
VotingSystem.tsx     → routes/voting.js
TodoManagement.tsx   → routes/todos.js
```

## 🚀 **빠른 개발 이터레이션 가이드**

### **1. 새 기능 추가 시:**
```
1. data/ 에 목 데이터 추가
2. server-backend/api-server/routes/ 에 API 엔드포인트 추가
3. frontend/src/pages/ 에 페이지 컴포넌트 추가
4. frontend/src/App.tsx 에 라우팅 추가
```

### **2. API 수정 시:**
```
1. server-backend/api-server/routes/ 파일 수정
2. frontend/src/pages/ 관련 컴포넌트 업데이트
3. data/ 목 데이터 동기화
```

### **3. UI 컴포넌트 추가 시:**
```
1. frontend/src/components/ 에 컴포넌트 생성
2. frontend/src/pages/ 에서 import 및 사용
3. 필요시 backend API 연동
```

## 📋 **문서 업데이트 우선순위**

### **High Priority:**
1. **README.md** - 프로젝트 개요 및 실행 방법
2. **API_REFERENCE.md** - 최신 API 엔드포인트 반영
3. **FEATURES.md** - 완성된 기능 목록 업데이트

### **Medium Priority:**
4. **DB_SCHEMA.md** - 데이터베이스 구조 최신화
5. **docs/ADMIN_GUIDE.md** - 관리자 기능 가이드

### **Low Priority:**
6. **VIEWLIST.md** - 페이지 목록 정리
7. **docs/** 하위 세부 문서들

---

**🎯 이제 완벽한 파일구조 매핑이 완성되었습니다!**
**빠른 개발 이터레이션을 위한 모든 준비가 완료되었습니다!** 🚀
