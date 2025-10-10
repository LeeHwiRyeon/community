# 🎯 Community Platform v1.3 - 통합 기획 문서 및 페이지 제작 로직

**작성일**: 2024-10-06  
**버전**: v1.3.0  
**상태**: 📋 기획 완료

---

## 📋 목차

1. [통합 기획 개요](#통합-기획-개요)
2. [페이지 제작 로직](#페이지-제작-로직)
3. [컴포넌트 매핑](#컴포넌트-매핑)
4. [자동 생성 템플릿](#자동-생성-템플릿)
5. [검증 및 테스트](#검증-및-테스트)

---

## 🎯 통합 기획 개요

### 전체 시스템 구조

```
Community Platform v1.3
├── 🏠 홈페이지 (통합 대시보드)
├── 📰 뉴스 커뮤니티
├── 🎮 게임 커뮤니티
├── 📺 방송 커뮤니티
├── 🎭 코스프레 커뮤니티
└── ⚙️ 관리 시스템
    ├── 고객 관리
    ├── 커뮤니티 관리
    ├── VIP 관리
    ├── 스트리머 관리
    └── 코스플레이어 관리
```

### 페이지 계층 구조

```
/ (홈페이지)
├── /news (뉴스)
│   ├── /news/list (뉴스 목록)
│   ├── /news/:id (뉴스 상세)
│   ├── /news/create (뉴스 작성)
│   └── /news/manage (뉴스 관리)
├── /games (게임)
│   ├── /games/list (게임 목록)
│   ├── /games/:id (게임 상세)
│   ├── /games/board (게임 게시판)
│   └── /games/guild (길드)
├── /broadcast (방송)
│   ├── /broadcast/live (라이브 방송)
│   ├── /broadcast/vod (VOD)
│   ├── /broadcast/schedule (방송 일정)
│   └── /broadcast/streamer/:id (스트리머 프로필)
├── /cosplay (코스프레)
│   ├── /cosplay/gallery (갤러리)
│   ├── /cosplay/events (이벤트)
│   ├── /cosplay/contests (콘테스트)
│   └── /cosplay/player/:id (코스플레이어 프로필)
└── /admin (관리)
    ├── /admin/dashboard (대시보드)
    ├── /admin/users (사용자 관리)
    ├── /admin/content (콘텐츠 관리)
    └── /admin/settings (설정)
```

---

## 🔧 페이지 제작 로직

### 1. 페이지 생성 규칙

#### 파일 구조
```
src/pages/
├── HomePage/
│   ├── HomePage.tsx
│   ├── HeroBanner.tsx
│   ├── StatsDashboard.tsx
│   ├── SectionCards.tsx
│   └── index.ts
├── NewsPage/
│   ├── NewsPage.tsx
│   ├── NewsList.tsx
│   ├── NewsDetail.tsx
│   ├── NewsEditor.tsx
│   └── index.ts
├── GamePage/
│   ├── GamePage.tsx
│   ├── GameList.tsx
│   ├── GameDetail.tsx
│   ├── GameBoard.tsx
│   └── index.ts
├── BroadcastPage/
│   ├── BroadcastPage.tsx
│   ├── LiveStream.tsx
│   ├── VODList.tsx
│   ├── StreamerProfile.tsx
│   └── index.ts
├── CosplayPage/
│   ├── CosplayPage.tsx
│   ├── Gallery.tsx
│   ├── Events.tsx
│   ├── Contests.tsx
│   └── index.ts
└── AdminPage/
    ├── AdminPage.tsx
    ├── UserManagement.tsx
    ├── ContentManagement.tsx
    └── index.ts
```

#### 컴포넌트 생성 규칙

```typescript
// 페이지 컴포넌트 템플릿
interface PageProps {
  // 공통 props
  title: string;
  description: string;
  breadcrumbs?: BreadcrumbItem[];
  
  // 페이지별 props
  [key: string]: any;
}

// 페이지 컴포넌트 구조
const PageComponent: React.FC<PageProps> = ({
  title,
  description,
  breadcrumbs,
  ...pageProps
}) => {
  // 상태 관리
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  
  // 데이터 로딩
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchPageData();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 렌더링
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <PageLayout
      title={title}
      description={description}
      breadcrumbs={breadcrumbs}
    >
      {/* 페이지별 컨텐츠 */}
    </PageLayout>
  );
};
```

### 2. 라우팅 설정

```typescript
// App.tsx 라우팅 설정
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* 홈페이지 */}
        <Route path="/" element={<HomePage />} />
        
        {/* 뉴스 섹션 */}
        <Route path="/news" element={<NewsPage />}>
          <Route index element={<NewsList />} />
          <Route path=":id" element={<NewsDetail />} />
          <Route path="create" element={<NewsEditor />} />
          <Route path="manage" element={<NewsManagement />} />
        </Route>
        
        {/* 게임 섹션 */}
        <Route path="/games" element={<GamePage />}>
          <Route index element={<GameList />} />
          <Route path=":id" element={<GameDetail />} />
          <Route path="board" element={<GameBoard />} />
          <Route path="guild" element={<GuildList />} />
        </Route>
        
        {/* 방송 섹션 */}
        <Route path="/broadcast" element={<BroadcastPage />}>
          <Route index element={<LiveStreamList />} />
          <Route path="live/:id" element={<LiveStream />} />
          <Route path="vod" element={<VODList />} />
          <Route path="schedule" element={<ScheduleList />} />
          <Route path="streamer/:id" element={<StreamerProfile />} />
        </Route>
        
        {/* 코스프레 섹션 */}
        <Route path="/cosplay" element={<CosplayPage />}>
          <Route index element={<Gallery />} />
          <Route path="gallery/:id" element={<WorkDetail />} />
          <Route path="events" element={<Events />} />
          <Route path="contests" element={<Contests />} />
          <Route path="player/:id" element={<PlayerProfile />} />
        </Route>
        
        {/* 관리 섹션 */}
        <Route path="/admin" element={<AdminPage />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="content" element={<ContentManagement />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
};
```

---

## 🧩 컴포넌트 매핑

### 1. 공통 컴포넌트

```typescript
// 공통 컴포넌트 매핑
const CommonComponents = {
  // 레이아웃
  PageLayout: 'src/components/common/PageLayout',
  Header: 'src/components/common/Header',
  Footer: 'src/components/common/Footer',
  Sidebar: 'src/components/common/Sidebar',
  
  // 네비게이션
  Navigation: 'src/components/common/Navigation',
  Breadcrumbs: 'src/components/common/Breadcrumbs',
  Pagination: 'src/components/common/Pagination',
  
  // 폼
  SearchBar: 'src/components/common/SearchBar',
  FilterPanel: 'src/components/common/FilterPanel',
  Button: 'src/components/common/Button',
  Input: 'src/components/common/Input',
  
  // 피드백
  LoadingSpinner: 'src/components/common/LoadingSpinner',
  ErrorMessage: 'src/components/common/ErrorMessage',
  SuccessMessage: 'src/components/common/SuccessMessage',
  
  // 카드
  Card: 'src/components/common/Card',
  CardHeader: 'src/components/common/CardHeader',
  CardContent: 'src/components/common/CardContent',
  CardActions: 'src/components/common/CardActions',
};
```

### 2. 섹션별 컴포넌트

```typescript
// 뉴스 섹션 컴포넌트
const NewsComponents = {
  NewsList: 'src/components/news/NewsList',
  NewsCard: 'src/components/news/NewsCard',
  NewsDetail: 'src/components/news/NewsDetail',
  NewsEditor: 'src/components/news/NewsEditor',
  NewsFilters: 'src/components/news/NewsFilters',
  CommentList: 'src/components/news/CommentList',
  CommentForm: 'src/components/news/CommentForm',
};

// 게임 섹션 컴포넌트
const GameComponents = {
  GameList: 'src/components/games/GameList',
  GameCard: 'src/components/games/GameCard',
  GameDetail: 'src/components/games/GameDetail',
  GameBoard: 'src/components/games/GameBoard',
  GuildList: 'src/components/games/GuildList',
  GuildCard: 'src/components/games/GuildCard',
};

// 방송 섹션 컴포넌트
const BroadcastComponents = {
  LiveStreamList: 'src/components/broadcast/LiveStreamList',
  LiveStreamCard: 'src/components/broadcast/LiveStreamCard',
  LiveStreamPlayer: 'src/components/broadcast/LiveStreamPlayer',
  ChatContainer: 'src/components/broadcast/ChatContainer',
  StreamerProfile: 'src/components/broadcast/StreamerProfile',
  VODList: 'src/components/broadcast/VODList',
};

// 코스프레 섹션 컴포넌트
const CosplayComponents = {
  Gallery: 'src/components/cosplay/Gallery',
  WorkCard: 'src/components/cosplay/WorkCard',
  WorkDetail: 'src/components/cosplay/WorkDetail',
  WorkEditor: 'src/components/cosplay/WorkEditor',
  Events: 'src/components/cosplay/Events',
  Contests: 'src/components/cosplay/Contests',
  PlayerProfile: 'src/components/cosplay/PlayerProfile',
};
```

---

## 🤖 자동 생성 템플릿

### 1. 페이지 생성 템플릿

```typescript
// 페이지 생성 함수
const generatePage = (pageConfig: PageConfig) => {
  const {
    name,
    path,
    title,
    description,
    components,
    apiEndpoints,
    features
  } = pageConfig;
  
  return `
import React, { useState, useEffect } from 'react';
import { PageLayout, LoadingSpinner, ErrorMessage } from '@/components/common';
import { ${components.join(', ')} } from '@/components/${name.toLowerCase()}';
import { ${name}Service } from '@/services/${name.toLowerCase()}Service';

interface ${name}PageProps {
  // 페이지별 props 정의
}

const ${name}Page: React.FC<${name}PageProps> = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState(null);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const result = await ${name}Service.getData();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <PageLayout
      title="${title}"
      description="${description}"
    >
      {/* 페이지별 컨텐츠 */}
      ${components.map(comp => `<${comp} />`).join('\n      ')}
    </PageLayout>
  );
};

export default ${name}Page;
  `;
};
```

### 2. 컴포넌트 생성 템플릿

```typescript
// 컴포넌트 생성 함수
const generateComponent = (componentConfig: ComponentConfig) => {
  const {
    name,
    type,
    props,
    features,
    styling
  } = componentConfig;
  
  return `
import React from 'react';
import { ${type} } from '@mui/material';
import './${name}.css';

interface ${name}Props {
  ${props.map(prop => `${prop.name}: ${prop.type};`).join('\n  ')}
}

const ${name}: React.FC<${name}Props> = ({
  ${props.map(prop => prop.name).join(',\n  ')}
}) => {
  return (
    <${type} className="${name.toLowerCase()}">
      {/* 컴포넌트 컨텐츠 */}
    </${type}>
  );
};

export default ${name};
  `;
};
```

### 3. API 서비스 생성 템플릿

```typescript
// API 서비스 생성 함수
const generateService = (serviceConfig: ServiceConfig) => {
  const {
    name,
    endpoints,
    models
  } = serviceConfig;
  
  return `
import { apiClient } from '@/utils/apiClient';

export class ${name}Service {
  private baseURL = '/api/${name.toLowerCase()}';
  
  ${endpoints.map(endpoint => `
  async ${endpoint.name}(${endpoint.params}): Promise<${endpoint.returnType}> {
    const response = await apiClient.${endpoint.method}(\`\${this.baseURL}${endpoint.path}\`);
    return response.data;
  }
  `).join('')}
}

export const ${name.toLowerCase()}Service = new ${name}Service();
  `;
};
```

---

## 🧪 검증 및 테스트

### 1. 페이지 생성 검증

```typescript
// 페이지 생성 검증 함수
const validatePageGeneration = (pageConfig: PageConfig) => {
  const errors: string[] = [];
  
  // 필수 필드 검증
  if (!pageConfig.name) errors.push('페이지 이름이 필요합니다');
  if (!pageConfig.path) errors.push('페이지 경로가 필요합니다');
  if (!pageConfig.title) errors.push('페이지 제목이 필요합니다');
  
  // 컴포넌트 검증
  if (!pageConfig.components || pageConfig.components.length === 0) {
    errors.push('최소 하나의 컴포넌트가 필요합니다');
  }
  
  // API 엔드포인트 검증
  if (!pageConfig.apiEndpoints || pageConfig.apiEndpoints.length === 0) {
    errors.push('최소 하나의 API 엔드포인트가 필요합니다');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

### 2. 컴포넌트 매핑 검증

```typescript
// 컴포넌트 매핑 검증 함수
const validateComponentMapping = (componentPath: string) => {
  const fs = require('fs');
  const path = require('path');
  
  const fullPath = path.join(process.cwd(), componentPath);
  
  if (!fs.existsSync(fullPath)) {
    return {
      isValid: false,
      error: `컴포넌트 파일이 존재하지 않습니다: ${componentPath}`
    };
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  
  // 기본 구조 검증
  const hasReactImport = content.includes('import React');
  const hasExport = content.includes('export default');
  const hasComponent = content.includes('React.FC');
  
  if (!hasReactImport || !hasExport || !hasComponent) {
    return {
      isValid: false,
      error: '컴포넌트 구조가 올바르지 않습니다'
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};
```

### 3. 자동 테스트 생성

```typescript
// 자동 테스트 생성 함수
const generateTests = (pageConfig: PageConfig) => {
  return `
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ${pageConfig.name}Page from './${pageConfig.name}Page';

// Mock API 서비스
jest.mock('@/services/${pageConfig.name.toLowerCase()}Service', () => ({
  ${pageConfig.name}Service: {
    getData: jest.fn()
  }
}));

describe('${pageConfig.name}Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders page title correctly', () => {
    render(
      <BrowserRouter>
        <${pageConfig.name}Page />
      </BrowserRouter>
    );
    
    expect(screen.getByText('${pageConfig.title}')).toBeInTheDocument();
  });
  
  it('displays loading state initially', () => {
    render(
      <BrowserRouter>
        <${pageConfig.name}Page />
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
  
  it('handles error state correctly', async () => {
    const mockError = new Error('Test error');
    require('@/services/${pageConfig.name.toLowerCase()}Service').${pageConfig.name}Service.getData.mockRejectedValue(mockError);
    
    render(
      <BrowserRouter>
        <${pageConfig.name}Page />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });
  
  ${pageConfig.components.map(component => `
  it('renders ${component} component', async () => {
    const mockData = { /* mock data */ };
    require('@/services/${pageConfig.name.toLowerCase()}Service').${pageConfig.name}Service.getData.mockResolvedValue(mockData);
    
    render(
      <BrowserRouter>
        <${pageConfig.name}Page />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('${component.toLowerCase()}')).toBeInTheDocument();
    });
  });
  `).join('')}
});
  `;
};
```

---

## 📊 성능 최적화

### 1. 코드 분할

```typescript
// 동적 import를 사용한 코드 분할
const HomePage = React.lazy(() => import('./pages/HomePage'));
const NewsPage = React.lazy(() => import('./pages/NewsPage'));
const GamePage = React.lazy(() => import('./pages/GamePage'));
const BroadcastPage = React.lazy(() => import('./pages/BroadcastPage'));
const CosplayPage = React.lazy(() => import('./pages/CosplayPage'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));

// Suspense로 감싸기
const App: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/news/*" element={<NewsPage />} />
          <Route path="/games/*" element={<GamePage />} />
          <Route path="/broadcast/*" element={<BroadcastPage />} />
          <Route path="/cosplay/*" element={<CosplayPage />} />
          <Route path="/admin/*" element={<AdminPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
};
```

### 2. 메모이제이션

```typescript
// 컴포넌트 메모이제이션
const MemoizedComponent = React.memo(Component, (prevProps, nextProps) => {
  // 커스텀 비교 함수
  return prevProps.id === nextProps.id;
});

// 값 메모이제이션
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// 콜백 메모이제이션
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);
```

---

## 🎯 다음 단계

### 1. 자동 생성 도구 개발
- 페이지 생성 CLI 도구
- 컴포넌트 생성 도구
- 테스트 자동 생성 도구

### 2. 템플릿 확장
- 더 많은 페이지 템플릿
- 커스터마이징 옵션
- 플러그인 시스템

### 3. 품질 관리
- 코드 품질 검사
- 성능 모니터링
- 자동 테스트 실행

---

**작성자**: AI Assistant  
**검토자**: 개발 팀  
**승인자**: 기술 리더  
**최종 업데이트**: 2024-10-06
