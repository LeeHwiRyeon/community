# 작업공간 분리 가이드

## 🎯 목표
**작업공간 컨텐츠 기능**과 **코드 작업 영역**을 명확하게 분리하여 효율적인 개발 환경 구축

## 📊 분리 전후 비교

### 🔍 분리 전 (현재)
```
community/
├── frontend/src/components/     # 모든 컴포넌트가 섞여있음
│   ├── editor/                  # 컨텐츠 관련
│   ├── AttachmentUploader.tsx   # 컨텐츠 관련
│   ├── Header.tsx              # 핵심 기능
│   └── Todo/                   # 비즈니스 로직
├── server-backend/src/         # 모든 API가 섞여있음
├── scripts/                    # 자동화 스크립트
└── docs/                       # 문서
```

### 🚀 분리 후 (목표)
```
community/
├── workspace-content/           # 컨텐츠 작업 영역
│   ├── content-management/      # 컨텐츠 관리
│   ├── content-storage/         # 컨텐츠 저장소
│   ├── content-processing/      # 컨텐츠 처리
│   └── content-api/            # 컨텐츠 API
├── code-workspace/             # 코드 작업 영역
│   ├── frontend/               # 프론트엔드 개발
│   ├── backend/                # 백엔드 개발
│   ├── automation/             # 자동화 시스템
│   └── infrastructure/         # 인프라
└── shared/                     # 공유 리소스
    ├── types/                  # 공통 타입
    ├── utils/                  # 공통 유틸리티
    └── constants/              # 공통 상수
```

## 🏗️ 분리 전략

### 1. 컨텐츠 영역 (workspace-content)

#### 🎯 담당 기능
- **컨텐츠 생성**: 게시물, 댓글, 첨부파일 작성
- **컨텐츠 편집**: WYSIWYG 에디터, 템플릿 관리
- **컨텐츠 관리**: 분류, 태그, 메타데이터 관리
- **컨텐츠 배포**: 발행, 스케줄링, 버전 관리

#### 📁 구조
```
workspace-content/
├── content-management/          # 컨텐츠 관리 시스템
│   ├── components/             # 컨텐츠 UI 컴포넌트
│   │   ├── editor/            # 에디터 컴포넌트
│   │   ├── AttachmentUploader.tsx
│   │   ├── TagInput.tsx
│   │   └── TemplateDashboard.tsx
│   ├── pages/                 # 컨텐츠 페이지
│   │   ├── CreatePostPage.tsx
│   │   ├── EditPostPage.tsx
│   │   └── BroadcastPage.tsx
│   ├── hooks/                 # 컨텐츠 훅
│   │   ├── useEditor.ts
│   │   ├── useContentValidation.ts
│   │   └── useTemplate.ts
│   └── services/              # 컨텐츠 서비스
├── content-storage/            # 컨텐츠 저장소
│   ├── templates/             # 컨텐츠 템플릿
│   ├── assets/                # 컨텐츠 에셋
│   └── cache/                 # 컨텐츠 캐시
├── content-processing/         # 컨텐츠 처리
│   ├── generators/            # 컨텐츠 생성기
│   ├── transformers/          # 컨텐츠 변환기
│   └── validators/            # 컨텐츠 검증기
└── content-api/               # 컨텐츠 API
    ├── routes/                # 컨텐츠 라우트
    ├── middleware/            # 컨텐츠 미들웨어
    └── controllers/           # 컨텐츠 컨트롤러
```

### 2. 코드 작업 영역 (code-workspace)

#### 🎯 담당 기능
- **핵심 기능**: 인증, 라우팅, 에러 처리
- **비즈니스 로직**: TODO, 채팅, 분석
- **자동화**: 빌드, 배포, 모니터링
- **인프라**: 서버, 데이터베이스, 네트워크

#### 📁 구조
```
code-workspace/
├── frontend/                   # 프론트엔드 개발
│   ├── src/
│   │   ├── core/              # 핵심 기능
│   │   │   ├── Header.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── ui/                # 순수 UI 컴포넌트
│   │   │   ├── Skeleton.tsx
│   │   │   └── LazyImage.tsx
│   │   ├── business/          # 비즈니스 로직
│   │   │   ├── Todo/
│   │   │   ├── Chat/
│   │   │   └── Analytics/
│   │   └── integration/       # 외부 연동
│   └── tests/
├── backend/                    # 백엔드 개발
│   ├── src/
│   │   ├── core/              # 핵심 서비스
│   │   ├── api/               # API 엔드포인트
│   │   ├── database/          # 데이터베이스
│   │   └── middleware/        # 미들웨어
│   └── tests/
├── automation/                 # 자동화 시스템
│   ├── scripts/               # 자동화 스크립트
│   ├── workflows/             # 워크플로우
│   └── monitoring/            # 모니터링
└── infrastructure/             # 인프라
    ├── docker/                # 컨테이너 설정
    ├── ci-cd/                 # CI/CD 파이프라인
    └── deployment/            # 배포 설정
```

## 🚀 실행 방법

### 1. 자동 분리 실행
```bash
# 작업공간 분리 스크립트 실행
node scripts/workspace-separator.js

# 의존성 설치
chmod +x install-content-deps.sh install-code-deps.sh
./install-content-deps.sh
./install-code-deps.sh
```

### 2. 수동 분리 (권장)
```bash
# 1. 컨텐츠 영역 생성
mkdir -p workspace-content/content-management/{components,pages,hooks,services}
mkdir -p workspace-content/content-storage/{templates,assets,cache}
mkdir -p workspace-content/content-processing/{generators,transformers,validators}
mkdir -p workspace-content/content-api/{routes,middleware,controllers}

# 2. 코드 작업 영역 생성
mkdir -p code-workspace/frontend/src/{core,ui,business,integration}
mkdir -p code-workspace/backend/src/{core,api,database,middleware}
mkdir -p code-workspace/automation/{scripts,workflows,monitoring}
mkdir -p code-workspace/infrastructure/{docker,ci-cd,deployment}

# 3. 파일 이동
# 컨텐츠 관련 파일들을 workspace-content/로 이동
# 핵심 기능 파일들을 code-workspace/로 이동
```

## 🔧 설정 파일

### 1. 컨텐츠 영역 설정

#### package.json
```json
{
  "name": "workspace-content",
  "version": "1.0.0",
  "description": "Content management and editing workspace",
  "scripts": {
    "dev": "vite --config vite.content.config.ts",
    "build": "vite build --config vite.content.config.ts",
    "test": "vitest --config vitest.content.config.ts"
  },
  "dependencies": {
    "react": "^18.0.0",
    "quill": "^1.3.7",
    "multer": "^1.4.5",
    "sharp": "^0.32.0"
  }
}
```

#### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../dist/content',
    rollupOptions: {
      input: {
        content: './content-management/index.ts'
      }
    }
  },
  server: {
    port: 5001,
    proxy: {
      '/api/content': 'http://localhost:50000'
    }
  }
})
```

### 2. 코드 작업 영역 설정

#### package.json
```json
{
  "name": "code-workspace",
  "version": "1.0.0",
  "description": "Core development and automation workspace",
  "scripts": {
    "dev": "vite --config vite.code.config.ts",
    "build": "vite build --config vite.code.config.ts",
    "test": "jest --config jest.code.config.js",
    "automation": "node automation/scripts/run-all.js"
  },
  "dependencies": {
    "react": "^18.0.0",
    "express": "^4.18.0",
    "socket.io": "^4.7.0",
    "mongoose": "^7.0.0"
  }
}
```

#### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../dist/core',
    rollupOptions: {
      input: {
        core: './frontend/src/core/index.ts'
      }
    }
  },
  server: {
    port: 5002,
    proxy: {
      '/api/core': 'http://localhost:50000'
    }
  }
})
```

## 📋 마이그레이션 체크리스트

### ✅ Phase 1: 구조 분리
- [ ] `workspace-content/` 디렉토리 생성
- [ ] `code-workspace/` 디렉토리 생성
- [ ] 컨텐츠 관련 파일 이동
- [ ] 핵심 기능 파일 이동
- [ ] 공유 리소스 분리

### ✅ Phase 2: 설정 분리
- [ ] 각 영역별 package.json 생성
- [ ] 각 영역별 vite.config.ts 생성
- [ ] 각 영역별 테스트 설정 생성
- [ ] 각 영역별 린트 설정 생성

### ✅ Phase 3: 의존성 분리
- [ ] 컨텐츠 영역 의존성 설치
- [ ] 코드 작업 영역 의존성 설치
- [ ] 공유 의존성 분리
- [ ] 의존성 충돌 해결

### ✅ Phase 4: 빌드 시스템 분리
- [ ] 각 영역별 빌드 스크립트 생성
- [ ] 각 영역별 개발 서버 설정
- [ ] 각 영역별 배포 설정
- [ ] 통합 빌드 스크립트 생성

## 🎯 예상 효과

### 1. 개발 효율성 향상
- **명확한 책임 분리**: 각 개발자가 담당 영역을 명확히 인식
- **독립적 개발**: 컨텐츠와 코드 작업이 서로 방해받지 않음
- **병렬 개발**: 두 영역을 동시에 개발 가능

### 2. 유지보수성 향상
- **모듈화**: 각 영역이 독립적으로 관리됨
- **테스트 용이성**: 영역별로 테스트 작성 및 실행 가능
- **배포 독립성**: 각 영역을 독립적으로 배포 가능

### 3. 확장성 향상
- **스케일링**: 각 영역을 독립적으로 스케일링 가능
- **기술 스택 다양화**: 영역별로 최적의 기술 스택 선택 가능
- **팀 분리**: 컨텐츠 팀과 개발 팀으로 분리 가능

## 🚨 주의사항

### 1. 의존성 관리
- 공유 의존성은 `shared/` 폴더에 배치
- 각 영역별로 필요한 의존성만 설치
- 의존성 버전 충돌 주의

### 2. API 통신
- 컨텐츠 영역과 코드 작업 영역 간 API 통신 설정
- CORS 설정 및 인증 토큰 공유
- 데이터 동기화 메커니즘 구축

### 3. 테스트 통합
- 각 영역별 단위 테스트
- 통합 테스트를 위한 공통 테스트 환경
- E2E 테스트 시나리오 업데이트

## 🚀 다음 단계

1. **즉시 실행**: 작업공간 분리 스크립트 실행
2. **팀 교육**: 새로운 구조에 대한 팀 교육
3. **문서화**: 각 영역별 상세 문서 작성
4. **모니터링**: 분리 후 성능 및 안정성 모니터링

---

**이 가이드를 통해 작업공간 컨텐츠 기능과 코드 작업 영역이 명확하게 분리되어 더 효율적인 개발 환경을 구축할 수 있습니다.**
