# 자동 테스트 프레임워크 구축 계획

## 1. 현재 테스트 상태 분석

### 1.1 기존 테스트 구조
- **단위 테스트**: Jest 기반 (일부 구현)
- **통합 테스트**: API 테스트 (기본 구현)
- **E2E 테스트**: Playwright (부분 구현)
- **성능 테스트**: 미구현
- **보안 테스트**: 기본 구현

### 1.2 문제점
1. **테스트 커버리지 부족**: 전체 코드의 30% 미만
2. **자동화 부족**: 수동 테스트 의존도 높음
3. **성능 테스트 부재**: 성능 회귀 감지 불가
4. **CI/CD 통합 부족**: 자동 테스트 실행 미흡

## 2. 테스트 전략 설계

### 2.1 테스트 피라미드
```
        /\
       /  \
      / E2E \     (10%) - 사용자 시나리오 테스트
     /______\
    /        \
   /Integration\ (20%) - API 통합 테스트
  /____________\
 /              \
/   Unit Tests   \ (70%) - 개별 함수/컴포넌트 테스트
/________________\
```

### 2.2 테스트 유형별 전략

#### A. 단위 테스트 (Unit Tests)
**목표**: 90% 이상 커버리지
**도구**: Jest + React Testing Library
**범위**: 
- 개별 함수/메서드
- React 컴포넌트
- 유틸리티 함수
- 비즈니스 로직

#### B. 통합 테스트 (Integration Tests)
**목표**: API 엔드포인트 100% 커버리지
**도구**: Jest + Supertest
**범위**:
- API 엔드포인트
- 데이터베이스 연동
- 외부 서비스 연동
- 인증/인가

#### C. E2E 테스트 (End-to-End Tests)
**목표**: 주요 사용자 플로우 100% 커버리지
**도구**: Playwright
**범위**:
- 사용자 등록/로그인
- 게시물 작성/수정/삭제
- 검색 기능
- 실시간 채팅

#### D. 성능 테스트 (Performance Tests)
**목표**: 성능 기준 100% 준수
**도구**: Artillery + k6
**범위**:
- API 응답 시간
- 동시 사용자 처리
- 메모리 사용량
- 데이터베이스 성능

#### E. 보안 테스트 (Security Tests)
**목표**: 보안 취약점 0개
**도구**: OWASP ZAP + Custom Scripts
**범위**:
- SQL 인젝션
- XSS 공격
- CSRF 보호
- 인증 우회

## 3. 테스트 프레임워크 구축

### 3.1 프론트엔드 테스트 설정

#### Jest 설정 (vitest.config.ts)
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
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
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

#### 테스트 설정 파일 (src/test/setup.ts)
```typescript
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// MSW 서버 시작
beforeAll(() => server.listen());

// 각 테스트 후 핸들러 리셋
afterEach(() => server.resetHandlers());

// 모든 테스트 후 서버 정리
afterAll(() => server.close());

// 전역 테스트 설정
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// 모킹 설정
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

### 3.2 백엔드 테스트 설정

#### Jest 설정 (server-backend/jest.config.js)
```javascript
export default {
  preset: 'node',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/test/**',
    '!src/migrations/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],
  testTimeout: 10000
};
```

#### 테스트 데이터베이스 설정
```javascript
// src/test/setup.js
import { createConnection } from 'mysql2/promise';

const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  user: process.env.TEST_DB_USER || 'test',
  password: process.env.TEST_DB_PASSWORD || 'test',
  database: process.env.TEST_DB_NAME || 'community_test'
};

let testConnection;

beforeAll(async () => {
  testConnection = await createConnection(testDbConfig);
  // 테스트 데이터베이스 초기화
  await initializeTestDatabase();
});

afterAll(async () => {
  if (testConnection) {
    await testConnection.end();
  }
});

beforeEach(async () => {
  // 각 테스트 전 데이터 정리
  await cleanupTestData();
});
```

### 3.3 E2E 테스트 설정

#### Playwright 설정 (playwright.config.ts)
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
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
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev:frontend',
      port: 5000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev:backend',
      port: 50000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

## 4. 테스트 자동화 구현

### 4.1 CI/CD 파이프라인 (GitHub Actions)

#### 메인 워크플로우 (.github/workflows/test.yml)
```yaml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        npm ci
        cd frontend && npm ci
        cd ../server-backend && npm ci
    
    - name: Run frontend unit tests
      run: |
        cd frontend
        npm run test:unit:ci
    
    - name: Run backend unit tests
      run: |
        cd server-backend
        npm run test:unit:ci
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        files: ./frontend/coverage/lcov.info,./server-backend/coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: community_test
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
        ports:
          - 3306:3306
      
      redis:
        image: redis:7
        options: >-
          --health-cmd="redis-cli ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
        ports:
          - 6379:6379
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js 20
      uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        npm ci
        cd server-backend && npm ci
    
    - name: Run integration tests
      run: |
        cd server-backend
        npm run test:integration:ci
      env:
        DB_HOST: localhost
        DB_USER: root
        DB_PASSWORD: root
        DB_NAME: community_test
        REDIS_URL: redis://localhost:6379

  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js 20
      uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        npm ci
        cd frontend && npm ci
        cd ../server-backend && npm ci
    
    - name: Install Playwright browsers
      run: |
        cd frontend
        npx playwright install --with-deps
    
    - name: Run E2E tests
      run: |
        cd frontend
        npm run test:e2e:ci
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: frontend/playwright-report/
        retention-days: 30

  performance-tests:
    runs-on: ubuntu-latest
    needs: e2e-tests
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js 20
      uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        npm ci
        cd server-backend && npm ci
    
    - name: Run performance tests
      run: |
        cd server-backend
        npm run test:performance:ci
    
    - name: Upload performance results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: performance-results
        path: server-backend/test-results/
        retention-days: 30

  security-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Run security audit
      run: |
        npm audit --audit-level moderate
        cd frontend && npm audit --audit-level moderate
        cd ../server-backend && npm audit --audit-level moderate
    
    - name: Run OWASP ZAP scan
      uses: zaproxy/action-full-scan@v0.4.0
      with:
        target: 'http://localhost:5000'
        rules_file_name: '.zap/rules.tsv'
        cmd_options: '-a'
```

### 4.2 성능 테스트 자동화

#### Artillery 설정 (artillery.yml)
```yaml
config:
  target: 'http://localhost:50000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up load"
    - duration: 300
      arrivalRate: 100
      name: "Sustained load"
  defaults:
    headers:
      Content-Type: 'application/json'

scenarios:
  - name: "API Load Test"
    weight: 100
    flow:
      - get:
          url: "/api/health"
      - get:
          url: "/api/posts"
      - get:
          url: "/api/search?q=test"
      - post:
          url: "/api/posts"
          json:
            title: "Test Post {{ $randomString() }}"
            content: "Test content {{ $randomString() }}"
            board_id: 1
```

#### k6 성능 테스트 스크립트
```javascript
// tests/performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export let errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
    errors: ['rate<0.1'],
  },
};

export default function() {
  // Health check
  let response = http.get('http://localhost:50000/api/health');
  check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  }) || errorRate.add(1);

  // Get posts
  response = http.get('http://localhost:50000/api/posts');
  check(response, {
    'posts status is 200': (r) => r.status === 200,
    'posts response time < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);

  // Search
  response = http.get('http://localhost:50000/api/search?q=test');
  check(response, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 300ms': (r) => r.timings.duration < 300,
  }) || errorRate.add(1);

  sleep(1);
}
```

### 4.3 테스트 데이터 관리

#### 테스트 데이터 팩토리
```javascript
// src/test/factories/PostFactory.js
export class PostFactory {
  static create(overrides = {}) {
    return {
      id: Math.floor(Math.random() * 10000),
      title: `Test Post ${Date.now()}`,
      content: 'This is test content',
      author: 'testuser',
      board_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted: 0,
      views: 0,
      ...overrides
    };
  }

  static createMany(count, overrides = {}) {
    return Array(count).fill().map(() => this.create(overrides));
  }
}

// src/test/factories/UserFactory.js
export class UserFactory {
  static create(overrides = {}) {
    return {
      id: Math.floor(Math.random() * 10000),
      username: `user${Date.now()}`,
      email: `user${Date.now()}@test.com`,
      created_at: new Date().toISOString(),
      ...overrides
    };
  }
}
```

#### 테스트 데이터베이스 시드
```javascript
// src/test/seed.js
import { PostFactory } from './factories/PostFactory.js';
import { UserFactory } from './factories/UserFactory.js';
import { query } from '../db.js';

export async function seedTestData() {
  // 사용자 데이터 생성
  const users = UserFactory.createMany(10);
  for (const user of users) {
    await query(
      'INSERT INTO users (id, username, email, created_at) VALUES (?, ?, ?, ?)',
      [user.id, user.username, user.email, user.created_at]
    );
  }

  // 게시물 데이터 생성
  const posts = PostFactory.createMany(100);
  for (const post of posts) {
    await query(
      'INSERT INTO posts (id, title, content, author, board_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [post.id, post.title, post.content, post.author, post.board_id, post.created_at, post.updated_at]
    );
  }
}
```

## 5. 테스트 실행 및 모니터링

### 5.1 테스트 실행 스크립트

#### package.json 스크립트
```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:unit": "npm run test:unit:frontend && npm run test:unit:backend",
    "test:unit:frontend": "cd frontend && npm run test:unit",
    "test:unit:backend": "cd server-backend && npm run test:unit",
    "test:integration": "cd server-backend && npm run test:integration",
    "test:e2e": "cd frontend && npm run test:e2e",
    "test:performance": "cd server-backend && npm run test:performance",
    "test:security": "npm run test:security:audit && npm run test:security:scan",
    "test:ci": "npm run test:unit:ci && npm run test:integration:ci && npm run test:e2e:ci",
    "test:watch": "npm run test:unit:watch",
    "test:coverage": "npm run test:unit:coverage && npm run test:integration:coverage",
    "test:debug": "npm run test:unit:debug && npm run test:e2e:debug"
  }
}
```

### 5.2 테스트 결과 모니터링

#### 테스트 대시보드 설정
```javascript
// scripts/test-dashboard.js
import fs from 'fs';
import path from 'path';

class TestDashboard {
  constructor() {
    this.results = {
      unit: { passed: 0, failed: 0, total: 0 },
      integration: { passed: 0, failed: 0, total: 0 },
      e2e: { passed: 0, failed: 0, total: 0 },
      performance: { passed: 0, failed: 0, total: 0 },
      security: { passed: 0, failed: 0, total: 0 }
    };
  }

  async generateReport() {
    // 테스트 결과 수집
    await this.collectResults();
    
    // HTML 리포트 생성
    await this.generateHTMLReport();
    
    // JSON 리포트 생성
    await this.generateJSONReport();
  }

  async collectResults() {
    // Jest 결과 파일 읽기
    const unitResults = JSON.parse(fs.readFileSync('frontend/coverage/coverage-summary.json', 'utf8'));
    const integrationResults = JSON.parse(fs.readFileSync('server-backend/coverage/coverage-summary.json', 'utf8'));
    
    // 결과 파싱 및 저장
    this.results.unit = this.parseJestResults(unitResults);
    this.results.integration = this.parseJestResults(integrationResults);
  }

  async generateHTMLReport() {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
            .passed { color: green; }
            .failed { color: red; }
            .coverage { background: #f5f5f5; padding: 10px; }
        </style>
    </head>
    <body>
        <h1>Test Dashboard</h1>
        ${this.generateTestSection('Unit Tests', this.results.unit)}
        ${this.generateTestSection('Integration Tests', this.results.integration)}
        ${this.generateTestSection('E2E Tests', this.results.e2e)}
        ${this.generateTestSection('Performance Tests', this.results.performance)}
        ${this.generateTestSection('Security Tests', this.results.security)}
    </body>
    </html>
    `;
    
    fs.writeFileSync('test-results/dashboard.html', html);
  }

  generateTestSection(title, results) {
    const passRate = ((results.passed / results.total) * 100).toFixed(1);
    return `
    <div class="test-section">
        <h2>${title}</h2>
        <p>Passed: <span class="passed">${results.passed}</span> | 
           Failed: <span class="failed">${results.failed}</span> | 
           Total: ${results.total} | 
           Pass Rate: ${passRate}%</p>
    </div>
    `;
  }
}

// 실행
const dashboard = new TestDashboard();
dashboard.generateReport();
```

## 6. 테스트 품질 관리

### 6.1 코드 커버리지 기준
- **단위 테스트**: 90% 이상
- **통합 테스트**: 80% 이상
- **E2E 테스트**: 주요 플로우 100%
- **성능 테스트**: 모든 API 엔드포인트
- **보안 테스트**: 모든 취약점 스캔

### 6.2 테스트 품질 체크리스트
- [ ] 모든 새로운 기능에 대한 테스트 작성
- [ ] 테스트 케이스가 명확하고 이해하기 쉬움
- [ ] 테스트 데이터가 격리되어 있음
- [ ] 테스트가 독립적으로 실행 가능
- [ ] 테스트 결과가 재현 가능
- [ ] 성능 기준을 만족하는지 확인
- [ ] 보안 취약점이 없는지 확인

## 7. 예상 효과

### 7.1 개발 효율성
- **버그 발견 시간**: 50% 단축
- **수동 테스트 시간**: 80% 절약
- **배포 신뢰성**: 95% 향상
- **코드 품질**: 40% 향상

### 7.2 운영 안정성
- **프로덕션 장애**: 70% 감소
- **복구 시간**: 60% 단축
- **사용자 만족도**: 30% 향상
- **개발팀 생산성**: 50% 향상

이 자동 테스트 프레임워크를 통해 안정적이고 신뢰할 수 있는 소프트웨어를 지속적으로 제공할 수 있습니다.

