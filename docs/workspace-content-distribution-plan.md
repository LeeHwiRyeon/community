# 작업공간 컨텐츠 기능 분배 계획

## 🎯 목표
**작업공간 컨텐츠 기능**과 **코드 작업 영역**이 겹치지 않게 명확하게 분배하여 효율적인 개발 환경 구축

## 📊 현재 상황 분석

### 🔍 기존 구조
```
community/
├── frontend/src/           # 프론트엔드 코드 작업 영역
│   ├── components/         # UI 컴포넌트
│   ├── pages/             # 페이지 컴포넌트
│   ├── hooks/             # 커스텀 훅
│   └── utils/             # 유틸리티 함수
├── server-backend/src/    # 백엔드 코드 작업 영역
├── scripts/               # 자동화 스크립트
├── docs/                  # 문서 작업 영역
└── logs/                  # 로그 파일
```

### ⚠️ 겹치는 영역 식별
1. **컨텐츠 관리**: `frontend/src/components/` 내 컨텐츠 관련 컴포넌트
2. **문서 작업**: `docs/` 폴더의 다양한 문서들
3. **자동화**: `scripts/` 폴더의 TODO 생성 및 관리 스크립트

## 🏗️ 분배 전략

### 1. 작업공간 컨텐츠 기능 영역

#### 📁 `workspace-content/` (새로 생성)
```
workspace-content/
├── content-management/     # 컨텐츠 관리 시스템
│   ├── components/         # 컨텐츠 관련 UI 컴포넌트
│   ├── services/          # 컨텐츠 서비스 로직
│   └── types/             # 컨텐츠 타입 정의
├── content-storage/        # 컨텐츠 저장소
│   ├── templates/         # 컨텐츠 템플릿
│   ├── assets/            # 컨텐츠 에셋
│   └── cache/             # 컨텐츠 캐시
├── content-processing/     # 컨텐츠 처리 로직
│   ├── generators/        # 컨텐츠 생성기
│   ├── transformers/      # 컨텐츠 변환기
│   └── validators/        # 컨텐츠 검증기
└── content-api/           # 컨텐츠 API
    ├── routes/            # 컨텐츠 라우트
    ├── middleware/        # 컨텐츠 미들웨어
    └── controllers/       # 컨텐츠 컨트롤러
```

#### 🎯 담당 기능
- **컨텐츠 생성**: 게시물, 댓글, 첨부파일
- **컨텐츠 편집**: WYSIWYG 에디터, 템플릿
- **컨텐츠 관리**: 분류, 태그, 메타데이터
- **컨텐츠 배포**: 발행, 스케줄링, 버전 관리

### 2. 코드 작업 영역

#### 📁 `code-workspace/` (기존 구조 개선)
```
code-workspace/
├── frontend/              # 프론트엔드 개발
│   ├── src/
│   │   ├── core/         # 핵심 기능 (인증, 라우팅)
│   │   ├── ui/           # 순수 UI 컴포넌트
│   │   ├── business/     # 비즈니스 로직
│   │   └── integration/  # 외부 연동
│   └── tests/
├── backend/               # 백엔드 개발
│   ├── src/
│   │   ├── core/         # 핵심 서비스
│   │   ├── api/          # API 엔드포인트
│   │   ├── database/     # 데이터베이스
│   │   └── middleware/   # 미들웨어
│   └── tests/
├── automation/            # 자동화 시스템
│   ├── scripts/          # 자동화 스크립트
│   ├── workflows/        # 워크플로우
│   └── monitoring/       # 모니터링
└── infrastructure/        # 인프라
    ├── docker/           # 컨테이너 설정
    ├── ci-cd/            # CI/CD 파이프라인
    └── deployment/       # 배포 설정
```

#### 🎯 담당 기능
- **코드 개발**: 기능 구현, 버그 수정
- **테스트**: 단위/통합/E2E 테스트
- **자동화**: 빌드, 배포, 모니터링
- **인프라**: 서버, 데이터베이스, 네트워크

## 🔄 분배 실행 계획

### Phase 1: 구조 분리 (1주)

#### 1.1 작업공간 컨텐츠 기능 이동
```bash
# 컨텐츠 관련 컴포넌트 이동
mv frontend/src/components/editor/ workspace-content/content-management/components/
mv frontend/src/components/AttachmentUploader.tsx workspace-content/content-management/components/
mv frontend/src/components/TagInput.tsx workspace-content/content-management/components/
mv frontend/src/components/TemplateDashboard.tsx workspace-content/content-management/components/

# 컨텐츠 관련 페이지 이동
mv frontend/src/pages/CreatePostPage.tsx workspace-content/content-management/pages/
mv frontend/src/pages/EditPostPage.tsx workspace-content/content-management/pages/
mv frontend/src/pages/BroadcastPage.tsx workspace-content/content-management/pages/

# 컨텐츠 관련 훅 이동
mv frontend/src/hooks/useEditor.ts workspace-content/content-management/hooks/
mv frontend/src/hooks/useContentValidation.ts workspace-content/content-management/hooks/
```

#### 1.2 코드 작업 영역 정리
```bash
# 핵심 기능만 남기고 정리
mkdir -p code-workspace/frontend/src/core
mkdir -p code-workspace/frontend/src/ui
mkdir -p code-workspace/frontend/src/business
mkdir -p code-workspace/frontend/src/integration

# 핵심 컴포넌트만 유지
# - Header.tsx (네비게이션)
# - Navigation.tsx (메뉴)
# - ErrorBoundary.tsx (에러 처리)
# - NotificationCenter.tsx (알림)
```

### Phase 2: API 분리 (1주)

#### 2.1 컨텐츠 API 분리
```javascript
// workspace-content/content-api/routes/content.js
const express = require('express');
const router = express.Router();

// 컨텐츠 관련 API만 담당
router.post('/posts', createPost);
router.put('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);
router.post('/upload', uploadFile);
router.get('/templates', getTemplates);

module.exports = router;
```

#### 2.2 코드 작업 API 분리
```javascript
// code-workspace/backend/src/api/core.js
const express = require('express');
const router = express.Router();

// 핵심 기능 API만 담당
router.get('/health', healthCheck);
router.get('/status', getStatus);
router.post('/auth', authenticate);
router.get('/users', getUsers);

module.exports = router;
```

### Phase 3: 데이터베이스 분리 (1주)

#### 3.1 컨텐츠 데이터베이스
```sql
-- workspace-content/content-storage/database/content_schema.sql
CREATE TABLE content_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    author_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE content_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    template_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.2 코드 작업 데이터베이스
```sql
-- code-workspace/backend/database/core_schema.sql
CREATE TABLE system_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('admin', 'developer', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    level VARCHAR(20) NOT NULL,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 기술적 구현

### 1. 네임스페이스 분리

#### 컨텐츠 네임스페이스
```typescript
// workspace-content/content-management/types/index.ts
export namespace Content {
  export interface Post {
    id: string;
    title: string;
    content: string;
    author: User;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
  }

  export interface Template {
    id: string;
    name: string;
    fields: TemplateField[];
    metadata: TemplateMetadata;
  }
}
```

#### 코드 작업 네임스페이스
```typescript
// code-workspace/frontend/src/types/index.ts
export namespace Core {
  export interface User {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    permissions: Permission[];
  }

  export interface SystemStatus {
    uptime: number;
    memory: MemoryUsage;
    database: DatabaseStatus;
  }
}
```

### 2. 의존성 분리

#### 컨텐츠 의존성
```json
// workspace-content/package.json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "quill": "^1.3.7",
    "multer": "^1.4.5",
    "sharp": "^0.32.0"
  }
}
```

#### 코드 작업 의존성
```json
// code-workspace/package.json
{
  "dependencies": {
    "react": "^18.0.0",
    "express": "^4.18.0",
    "socket.io": "^4.7.0",
    "mongoose": "^7.0.0",
    "jest": "^29.0.0"
  }
}
```

### 3. 빌드 시스템 분리

#### 컨텐츠 빌드
```json
// workspace-content/vite.config.ts
export default defineConfig({
  build: {
    outDir: '../dist/content',
    rollupOptions: {
      input: {
        content: './src/content-main.ts'
      }
    }
  }
});
```

#### 코드 작업 빌드
```json
// code-workspace/vite.config.ts
export default defineConfig({
  build: {
    outDir: '../dist/core',
    rollupOptions: {
      input: {
        core: './src/core-main.ts'
      }
    }
  }
});
```

## 📋 마이그레이션 체크리스트

### ✅ Phase 1: 구조 분리
- [ ] `workspace-content/` 디렉토리 생성
- [ ] 컨텐츠 관련 컴포넌트 이동
- [ ] 컨텐츠 관련 페이지 이동
- [ ] 컨텐츠 관련 훅 이동
- [ ] `code-workspace/` 디렉토리 생성
- [ ] 핵심 기능만 남기고 정리

### ✅ Phase 2: API 분리
- [ ] 컨텐츠 API 라우트 분리
- [ ] 코드 작업 API 라우트 분리
- [ ] 미들웨어 분리
- [ ] 컨트롤러 분리

### ✅ Phase 3: 데이터베이스 분리
- [ ] 컨텐츠 데이터베이스 스키마 생성
- [ ] 코드 작업 데이터베이스 스키마 생성
- [ ] 데이터 마이그레이션 스크립트 작성
- [ ] 데이터 동기화 설정

### ✅ Phase 4: 테스트 및 검증
- [ ] 각 영역별 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] 성능 테스트 실행
- [ ] 보안 테스트 실행

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

## 🚀 다음 단계

1. **즉시 실행**: Phase 1 구조 분리 시작
2. **팀 교육**: 새로운 구조에 대한 팀 교육
3. **문서화**: 각 영역별 상세 문서 작성
4. **모니터링**: 분리 후 성능 및 안정성 모니터링

---

**이 계획을 통해 작업공간 컨텐츠 기능과 코드 작업 영역이 명확하게 분리되어 더 효율적인 개발 환경을 구축할 수 있습니다.**
