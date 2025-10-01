# 커뮤니티 허브 테스트 가이드

커뮤니티 허브 플랫폼의 품질을 보장하기 위한 포괄적인 테스트 전략과 실행 방법을 안내합니다.

## 목차

1. [테스트 개요](#테스트-개요)
2. [프론트엔드 테스트](#프론트엔드-테스트)
3. [백엔드 테스트](#백엔드-테스트)
4. [종단간 테스트](#종단간-테스트)
5. [성능 테스트](#성능-테스트)
6. [보안 테스트](#보안-테스트)
7. [CI/CD 통합](#cicd-통합)
8. [문제 해결](#문제-해결)

## 테스트 개요

### 테스트 철학

- **테스트 주도 개발 (TDD)**: 기능 구현 전에 테스트를 먼저 작성
- **높은 커버리지**: 85% 이상의 코드 커버리지 목표
- **사용자 중심**: 실제 사용자 시나리오를 중심으로 테스트 설계
- **성능 우선**: 모든 변경사항이 성능에 미치는 영향 검증
- **보안 강화**: 보안 취약점을 사전에 발견하고 방지

### 테스트 피라미드

```
    /\
   /  \
  / E2E \     ← 적고 포괄적인 사용자 여정 테스트
 /______\
/        \
/통합 테스트\ ← API 및 컴포넌트 통합 테스트
/____________\
/              \
/   단위 테스트   \ ← 많고 빠르고 격리된 테스트
/________________\
```

## 프론트엔드 테스트

### 단위 테스트 (Vitest)

#### 컴포넌트 테스트 예제

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { PostCard } from './PostCard';

describe('PostCard 컴포넌트', () => {
  const mockPost = {
    id: 1,
    title: '테스트 게시물',
    content: '테스트 내용',
    author: { id: 1, username: 'testuser' },
    views: 100,
    createdAt: '2024-01-01T00:00:00Z'
  };

  it('게시물 제목과 내용을 올바르게 표시한다', () => {
    render(<PostCard post={mockPost} />);
    
    expect(screen.getByText('테스트 게시물')).toBeInTheDocument();
    expect(screen.getByText('테스트 내용')).toBeInTheDocument();
  });

  it('투표 버튼 클릭 시 콜백 함수를 호출한다', () => {
    const mockOnVote = jest.fn();
    render(<PostCard post={mockPost} onVote={mockOnVote} />);
    
    fireEvent.click(screen.getByText('추천'));
    expect(mockOnVote).toHaveBeenCalledWith(1, 'up');
  });

  it('조회수를 정확히 표시한다', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText('100 조회')).toBeInTheDocument();
  });
});
```

#### 커스텀 훅 테스트

```typescript
import { renderHook, act } from '@testing-library/react';
import { usePosts } from './usePosts';

describe('usePosts 훅', () => {
  it('초기 로딩 상태가 올바르다', async () => {
    const { result } = renderHook(() => usePosts(1));
    
    expect(result.current.loading).toBe(true);
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.posts).toHaveLength(0);
  });

  it('API 오류를 적절히 처리한다', async () => {
    jest.spyOn(apiService, 'getPosts').mockRejectedValue(new Error('API 오류'));
    
    const { result } = renderHook(() => usePosts(1));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.error).toBe('API 오류');
    expect(result.current.loading).toBe(false);
  });
});
```

#### 테스트 유틸리티 설정

```typescript
// test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '../store';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider>
          {children}
        </ChakraProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
};

const customRender = (ui: React.ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### 통합 테스트

#### API 통합 테스트

```typescript
import { apiService } from '../api';

describe('API 통합 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('게시물 목록을 성공적으로 가져온다', async () => {
    const mockPosts = [
      { id: 1, title: '게시물 1', content: '내용 1' },
      { id: 2, title: '게시물 2', content: '내용 2' }
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockPosts })
    });

    const result = await apiService.getPosts(1);
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockPosts);
  });

  it('API 오류를 적절히 처리한다', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ success: false, error: '서버 오류' })
    });

    await expect(apiService.getPosts(1)).rejects.toThrow('서버 오류');
  });
});
```

## 백엔드 테스트

### 단위 테스트 (Jest)

#### 서비스 테스트

```javascript
// services/posts/post-service.test.js
import { PostService } from './post-service.js';
import { query } from '../../db.js';

jest.mock('../../db.js');

describe('PostService', () => {
  let postService;

  beforeEach(() => {
    postService = new PostService();
    jest.clearAllMocks();
  });

  describe('getPosts', () => {
    it('올바른 쿼리로 게시물을 조회한다', async () => {
      const mockPosts = [
        { id: 1, title: '게시물 1', content: '내용 1' },
        { id: 2, title: '게시물 2', content: '내용 2' }
      ];

      query.mockResolvedValue(mockPosts);

      const result = await postService.getPosts({ boardId: 1, page: 1, limit: 20 });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1, 20, 0]
      );
      expect(result).toEqual(mockPosts);
    });

    it('데이터베이스 오류를 처리한다', async () => {
      query.mockRejectedValue(new Error('데이터베이스 연결 실패'));

      await expect(postService.getPosts({})).rejects.toThrow('데이터베이스 연결 실패');
    });
  });

  describe('createPost', () => {
    it('새 게시물을 성공적으로 생성한다', async () => {
      const postData = {
        title: '새 게시물',
        content: '새 내용',
        boardId: 1
      };

      query.mockResolvedValue({ insertId: 123 });

      const result = await postService.createPost(postData, 1);

      expect(query).toHaveBeenCalledWith(
        'INSERT INTO posts (title, content, board_id, author_id) VALUES (?, ?, ?, ?)',
        ['새 게시물', '새 내용', 1, 1]
      );
      expect(result.id).toBe(123);
    });
  });
});
```

#### API 라우트 테스트

```javascript
// routes/posts.test.js
import request from 'supertest';
import express from 'express';
import postsRouter from './posts.js';

const app = express();
app.use('/api/posts', postsRouter);

describe('POST /api/posts', () => {
  it('새 게시물을 생성한다', async () => {
    const postData = {
      title: '테스트 게시물',
      content: '테스트 내용',
      boardId: 1
    };

    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', 'Bearer valid-token')
      .send(postData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe('테스트 게시물');
  });

  it('인증되지 않은 요청에 401을 반환한다', async () => {
    const response = await request(app)
      .post('/api/posts')
      .send({ title: '테스트' })
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('필수 필드 검증을 수행한다', async () => {
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', 'Bearer valid-token')
      .send({})
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

### 데이터베이스 테스트

#### 스키마 검증

```javascript
// tests/database/schema.test.js
import { query } from '../../src/db.js';

describe('데이터베이스 스키마', () => {
  it('필수 테이블들이 존재한다', async () => {
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `);

    const tableNames = tables.map(row => row.table_name);
    
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('posts');
    expect(tableNames).toContain('comments');
    expect(tableNames).toContain('boards');
  });

  it('외래 키 제약조건이 올바르게 설정되어 있다', async () => {
    const constraints = await query(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE REFERENCED_TABLE_NAME IS NOT NULL
      AND TABLE_SCHEMA = DATABASE()
    `);

    const postAuthorConstraint = constraints.find(
      c => c.TABLE_NAME === 'posts' && c.COLUMN_NAME === 'author_id'
    );

    expect(postAuthorConstraint).toBeDefined();
    expect(postAuthorConstraint.REFERENCED_TABLE_NAME).toBe('users');
  });
});
```

## 종단간 테스트

### Playwright 설정

#### 기본 구성

```javascript
// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### 사용자 워크플로우 테스트

```javascript
// tests/e2e/user-workflow.spec.js
import { test, expect } from '@playwright/test';

test.describe('사용자 워크플로우', () => {
  test('사용자가 게시물을 생성하고 확인할 수 있다', async ({ page }) => {
    // 로그인
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');

    // 게시판으로 이동
    await page.goto('/board/1');
    
    // 게시물 생성
    await page.click('[data-testid="create-post-button"]');
    await page.fill('[data-testid="post-title"]', '테스트 게시물');
    await page.fill('[data-testid="post-content"]', '테스트 내용');
    await page.click('[data-testid="submit-post"]');

    // 게시물이 표시되는지 확인
    await expect(page.locator('[data-testid="post-title"]')).toContainText('테스트 게시물');
  });

  test('사용자가 게시물에 투표할 수 있다', async ({ page }) => {
    await page.goto('/board/1');
    
    const voteButton = page.locator('[data-testid="vote-up-button"]').first();
    await voteButton.click();
    
    await expect(voteButton).toHaveClass(/voted/);
  });

  test('사용자가 게시물을 검색할 수 있다', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('[data-testid="search-input"]', '테스트 쿼리');
    await page.click('[data-testid="search-button"]');
    
    await expect(page).toHaveURL(/search\?q=test%20query/);
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });
});
```

### 페이지 객체 모델

```javascript
// tests/e2e/pages/LoginPage.js
export class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="email"]');
    this.passwordInput = page.locator('[data-testid="password"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}

// tests/e2e/pages/BoardPage.js
export class BoardPage {
  constructor(page) {
    this.page = page;
    this.createPostButton = page.locator('[data-testid="create-post-button"]');
    this.postList = page.locator('[data-testid="post-list"]');
    this.postItems = page.locator('[data-testid="post-item"]');
  }

  async createPost(title, content) {
    await this.createPostButton.click();
    await this.page.fill('[data-testid="post-title"]', title);
    await this.page.fill('[data-testid="post-content"]', content);
    await this.page.click('[data-testid="submit-post"]');
  }

  async getPostCount() {
    return await this.postItems.count();
  }
}
```

## 성능 테스트

### 부하 테스트 (Artillery)

```yaml
# artillery-config.yml
config:
  target: 'http://localhost:50000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 20
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "API 부하 테스트"
    weight: 100
    flow:
      - get:
          url: "/api/health"
      - get:
          url: "/api/posts"
      - post:
          url: "/api/posts"
          json:
            title: "부하 테스트 게시물"
            content: "이것은 부하 테스트 게시물입니다"
```

### 프론트엔드 성능 테스트

```javascript
// tests/performance/frontend-performance.test.js
import { test, expect } from '@playwright/test';

test.describe('성능 테스트', () => {
  test('홈페이지가 2초 내에 로드된다', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(2000);
  });

  test('대용량 게시물 목록이 효율적으로 렌더링된다', async ({ page }) => {
    await page.goto('/board/1');
    
    const startTime = Date.now();
    await page.waitForSelector('[data-testid="post-item"]');
    const renderTime = Date.now() - startTime;
    
    expect(renderTime).toBeLessThan(1000);
  });

  test('메모리 사용량이 적절한 수준을 유지한다', async ({ page }) => {
    await page.goto('/');
    
    const metrics = await page.evaluate(() => {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize
      };
    });
    
    expect(metrics.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024);
  });
});
```

## 보안 테스트

### 인증 보안 테스트

```javascript
// tests/security/auth.test.js
import request from 'supertest';
import app from '../src/app.js';

describe('인증 보안', () => {
  it('무차별 대입 공격을 방지한다', async () => {
    const attempts = 5;
    
    for (let i = 0; i < attempts; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' })
        .expect(401);
    }
    
    // 5번 시도 후 속도 제한
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' })
      .expect(429);
  });

  it('JWT 토큰을 올바르게 검증한다', async () => {
    const invalidToken = 'invalid.jwt.token';
    
    await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${invalidToken}`)
      .expect(401);
  });

  it('SQL 인젝션을 방지한다', async () => {
    const maliciousInput = "'; DROP TABLE posts; --";
    
    await request(app)
      .post('/api/posts')
      .set('Authorization', 'Bearer valid-token')
      .send({ title: maliciousInput, content: 'test' })
      .expect(400);
  });
});
```

### 입력 검증 테스트

```javascript
// tests/security/input-validation.test.js
describe('입력 검증', () => {
  it('HTML 입력을 안전하게 정화한다', async () => {
    const maliciousInput = '<script>alert("xss")</script>';
    
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', 'Bearer valid-token')
      .send({ title: '테스트', content: maliciousInput });
    
    expect(response.body.data.content).not.toContain('<script>');
  });

  it('파일 업로드를 안전하게 검증한다', async () => {
    const maliciousFile = Buffer.from('악성 콘텐츠');
    
    await request(app)
      .post('/api/attachments/upload')
      .set('Authorization', 'Bearer valid-token')
      .attach('file', maliciousFile, 'malicious.exe')
      .expect(400);
  });
});
```

## CI/CD 통합

### GitHub Actions 워크플로우

```yaml
# .github/workflows/test.yml
name: 테스트 스위트

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: password
          MYSQL_DATABASE: community_hub_test
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3

      redis:
        image: redis:6
        ports:
          - 6379:6379
        options: --health-cmd="redis-cli ping" --health-interval=10s --health-timeout=5s --health-retries=3

    steps:
      - uses: actions/checkout@v3
      
      - name: Node.js 설정
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: 의존성 설치
        run: |
          cd server-backend
          npm ci
          cd ../frontend
          npm ci
      
      - name: 백엔드 테스트 실행
        run: |
          cd server-backend
          npm test
        env:
          DB_HOST: localhost
          DB_USER: root
          DB_PASSWORD: password
          DB_NAME: community_hub_test
          REDIS_HOST: localhost
      
      - name: 프론트엔드 테스트 실행
        run: |
          cd frontend
          npm test
      
      - name: E2E 테스트 실행
        run: |
          cd frontend
          npm run test:e2e:ci
      
      - name: 테스트 결과 업로드
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: |
            frontend/test-results/
            server-backend/coverage/
```

### 테스트 커버리지 설정

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.{js,ts,jsx,tsx}',
        '**/*.spec.{js,ts,jsx,tsx}'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
```

## 문제 해결

### 일반적인 테스트 문제

#### 프론트엔드 테스트 문제

```javascript
// 문제: 테스트 시간 초과
// 해결책: 타임아웃 증가
test.setTimeout(10000);

// 문제: 모킹이 작동하지 않음
// 해결책: 테스트 간 모킹 초기화
beforeEach(() => {
  jest.clearAllMocks();
});

// 문제: 컴포넌트가 렌더링되지 않음
// 해결책: 모든 프로바이더가 래핑되었는지 확인
const renderWithProviders = (ui) => {
  return render(ui, { wrapper: AllTheProviders });
};
```

#### 백엔드 테스트 문제

```javascript
// 문제: 데이터베이스 연결 오류
// 해결책: 테스트 데이터베이스 설정 확인
beforeAll(async () => {
  await ensureDatabase();
  await initSchema();
});

// 문제: 테스트 간 간섭
// 해결책: 각 테스트 후 정리
afterEach(async () => {
  await cleanupTestData();
});

// 문제: 비동기 작업 미완료
// 해결책: 적절한 async/await 사용
it('비동기 작업을 처리한다', async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});
```

### 디버깅 방법

#### 프론트엔드 디버깅

```javascript
// DOM 상태 확인
import { screen } from '@testing-library/react';

test('디버그 테스트', () => {
  render(<Component />);
  screen.debug(); // 현재 DOM 출력
});

// 사용 가능한 역할 확인
import { logRoles } from '@testing-library/react';

test('역할 디버그', () => {
  const { container } = render(<Component />);
  logRoles(container);
});
```

#### 백엔드 디버깅

```javascript
// 데이터베이스 쿼리 디버깅
test('쿼리 디버그', async () => {
  const result = await db.query('SELECT * FROM users');
  console.log('쿼리 결과:', result);
  expect(result).toBeDefined();
});

// API 응답 디버깅
import request from 'supertest';

test('API 응답 디버그', async () => {
  const response = await request(app)
    .get('/api/posts')
    .expect(200);
  
  console.log('응답 본문:', response.body);
});
```

## 모범 사례

### 테스트 구성
- 관련 테스트를 `describe` 블록으로 그룹화
- 명확하고 설명적인 테스트 이름 사용
- 테스트를 독립적이고 격리된 상태로 유지
- 적절한 설정 및 정리 함수 활용

### 테스트 데이터
- 프로덕션과 유사한 현실적인 테스트 데이터 사용
- 공통 테스트 데이터 설정을 위한 헬퍼 함수 생성
- 각 테스트 후 데이터 정리
- 복잡한 객체 생성을 위한 팩토리 패턴 활용

### 성능
- 단위 테스트를 빠르게 유지 (100ms 미만)
- 외부 의존성에 대해 모킹 사용
- 가능한 경우 병렬 테스트 실행
- 테스트 실행 시간 모니터링

### 유지보수
- 요구사항 변경 시 테스트 업데이트
- 오래된 테스트 제거
- 중복을 줄이기 위한 테스트 리팩토링
- 복잡한 테스트 시나리오 문서화

---

이 테스트 가이드는 커뮤니티 허브 플랫폼의 품질과 신뢰성을 보장하기 위한 포괄적인 프레임워크를 제공합니다. 정기적인 테스트를 통해 문제를 조기에 발견하고 높은 수준의 코드 품질을 유지할 수 있습니다.
