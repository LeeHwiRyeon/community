import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { CodeFile, Goal, TechStack } from '@/types';

export class TestGenerator {
    private openai: OpenAI;
    private outputDir: string;

    constructor(apiKey: string, outputDir: string = './generated-projects') {
        this.openai = new OpenAI({ apiKey });
        this.outputDir = outputDir;
    }

    /**
     * 자동 테스트 생성
     */
    async generateTests(
        goal: Goal,
        techStack: TechStack,
        sourceFiles: CodeFile[]
    ): Promise<CodeFile[]> {
        console.log('🧪 자동 테스트 생성 중...');

        const generatedTests: CodeFile[] = [];

        try {
            // 1. 단위 테스트 생성
            const unitTests = await this.generateUnitTests(sourceFiles, techStack);
            generatedTests.push(...unitTests);

            // 2. 통합 테스트 생성
            const integrationTests = await this.generateIntegrationTests(sourceFiles, techStack);
            generatedTests.push(...integrationTests);

            // 3. E2E 테스트 생성
            const e2eTests = await this.generateE2ETests(goal, techStack);
            generatedTests.push(...e2eTests);

            // 4. 성능 테스트 생성
            const performanceTests = await this.generatePerformanceTests(goal, techStack);
            generatedTests.push(...performanceTests);

            // 5. 보안 테스트 생성
            const securityTests = await this.generateSecurityTests(goal, techStack);
            generatedTests.push(...securityTests);

            // 6. 테스트 설정 파일 생성
            const configFiles = await this.generateTestConfigFiles(techStack);
            generatedTests.push(...configFiles);

            console.log(`✅ 자동 테스트 생성 완료: ${generatedTests.length}개 파일`);
            return generatedTests;

        } catch (error) {
            console.error('❌ 자동 테스트 생성 실패:', error);
            throw error;
        }
    }

    /**
     * 단위 테스트 생성
     */
    private async generateUnitTests(sourceFiles: CodeFile[], techStack: TechStack): Promise<CodeFile[]> {
        const tests: CodeFile[] = [];

        for (const file of sourceFiles) {
            if (this.shouldGenerateUnitTest(file)) {
                const testContent = await this.generateUnitTestForFile(file, techStack);
                tests.push({
                    id: this.generateId(),
                    name: this.getTestFileName(file.name),
                    path: this.getTestFilePath(file.path),
                    content: testContent,
                    language: this.getTestLanguage(file.language),
                    size: testContent.length,
                    complexity: this.calculateComplexity(testContent),
                    quality: this.calculateQuality(testContent),
                    lastModified: new Date()
                });
            }
        }

        return tests;
    }

    /**
     * 통합 테스트 생성
     */
    private async generateIntegrationTests(sourceFiles: CodeFile[], techStack: TechStack): Promise<CodeFile[]> {
        const tests: CodeFile[] = [];

        // API 통합 테스트
        const apiTestContent = await this.generateAPIIntegrationTest(techStack);
        tests.push({
            id: this.generateId(),
            name: 'api.integration.test.ts',
            path: 'tests/integration/api.integration.test.ts',
            content: apiTestContent,
            language: 'typescript',
            size: apiTestContent.length,
            complexity: this.calculateComplexity(apiTestContent),
            quality: this.calculateQuality(apiTestContent),
            lastModified: new Date()
        });

        // 데이터베이스 통합 테스트
        const dbTestContent = await this.generateDatabaseIntegrationTest(techStack);
        tests.push({
            id: this.generateId(),
            name: 'database.integration.test.ts',
            path: 'tests/integration/database.integration.test.ts',
            content: dbTestContent,
            language: 'typescript',
            size: dbTestContent.length,
            complexity: this.calculateComplexity(dbTestContent),
            quality: this.calculateQuality(dbTestContent),
            lastModified: new Date()
        });

        return tests;
    }

    /**
     * E2E 테스트 생성
     */
    private async generateE2ETests(goal: Goal, techStack: TechStack): Promise<CodeFile[]> {
        const tests: CodeFile[] = [];

        // Playwright E2E 테스트
        const e2eTestContent = await this.generatePlaywrightE2ETest(goal, techStack);
        tests.push({
            id: this.generateId(),
            name: 'app.e2e.spec.ts',
            path: 'tests/e2e/app.e2e.spec.ts',
            content: e2eTestContent,
            language: 'typescript',
            size: e2eTestContent.length,
            complexity: this.calculateComplexity(e2eTestContent),
            quality: this.calculateQuality(e2eTestContent),
            lastModified: new Date()
        });

        return tests;
    }

    /**
     * 성능 테스트 생성
     */
    private async generatePerformanceTests(goal: Goal, techStack: TechStack): Promise<CodeFile[]> {
        const tests: CodeFile[] = [];

        // k6 성능 테스트
        const k6TestContent = this.generateK6PerformanceTest(goal);
        tests.push({
            id: this.generateId(),
            name: 'performance.js',
            path: 'tests/performance/performance.js',
            content: k6TestContent,
            language: 'javascript',
            size: k6TestContent.length,
            complexity: this.calculateComplexity(k6TestContent),
            quality: this.calculateQuality(k6TestContent),
            lastModified: new Date()
        });

        // Lighthouse 성능 테스트
        const lighthouseTestContent = await this.generateLighthouseTest(goal, techStack);
        tests.push({
            id: this.generateId(),
            name: 'lighthouse.test.ts',
            path: 'tests/performance/lighthouse.test.ts',
            content: lighthouseTestContent,
            language: 'typescript',
            size: lighthouseTestContent.length,
            complexity: this.calculateComplexity(lighthouseTestContent),
            quality: this.calculateQuality(lighthouseTestContent),
            lastModified: new Date()
        });

        return tests;
    }

    /**
     * 보안 테스트 생성
     */
    private async generateSecurityTests(goal: Goal, techStack: TechStack): Promise<CodeFile[]> {
        const tests: CodeFile[] = [];

        // OWASP 보안 테스트
        const securityTestContent = await this.generateOWASPSecurityTest(goal, techStack);
        tests.push({
            id: this.generateId(),
            name: 'security.test.ts',
            path: 'tests/security/security.test.ts',
            content: securityTestContent,
            language: 'typescript',
            size: securityTestContent.length,
            complexity: this.calculateComplexity(securityTestContent),
            quality: this.calculateQuality(securityTestContent),
            lastModified: new Date()
        });

        return tests;
    }

    /**
     * 테스트 설정 파일 생성
     */
    private async generateTestConfigFiles(techStack: TechStack): Promise<CodeFile[]> {
        const configs: CodeFile[] = [];

        // Jest 설정
        const jestConfig = this.generateJestConfig(techStack);
        configs.push({
            id: this.generateId(),
            name: 'jest.config.js',
            path: 'jest.config.js',
            content: jestConfig,
            language: 'javascript',
            size: jestConfig.length,
            complexity: this.calculateComplexity(jestConfig),
            quality: this.calculateQuality(jestConfig),
            lastModified: new Date()
        });

        // Playwright 설정
        const playwrightConfig = this.generatePlaywrightConfig(techStack);
        configs.push({
            id: this.generateId(),
            name: 'playwright.config.ts',
            path: 'playwright.config.ts',
            content: playwrightConfig,
            language: 'typescript',
            size: playwrightConfig.length,
            complexity: this.calculateComplexity(playwrightConfig),
            quality: this.calculateQuality(playwrightConfig),
            lastModified: new Date()
        });

        return configs;
    }

    // 개별 테스트 생성 메서드들
    private async generateUnitTestForFile(file: CodeFile, techStack: TechStack): Promise<string> {
        const prompt = `
다음 파일에 대한 단위 테스트를 생성해주세요:

파일명: ${file.name}
언어: ${file.language}
내용: ${file.content.substring(0, 1000)}...

기술 스택: ${techStack.backend.map(t => t.name).join(', ')}

다음 기능들을 포함해야 합니다:
1. 모든 public 함수/메서드 테스트
2. 경계값 테스트
3. 에러 케이스 테스트
4. Mock 사용
5. 100% 커버리지 목표
6. 명확한 테스트 이름
7. AAA 패턴 (Arrange, Act, Assert)

완전한 단위 테스트를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2000
        });

        return response.choices[0].message.content || this.getDefaultUnitTest(file);
    }

    private async generateAPIIntegrationTest(techStack: TechStack): Promise<string> {
        const prompt = `
다음 기술 스택을 사용한 API 통합 테스트를 생성해주세요:

기술 스택: ${techStack.backend.map(t => t.name).join(', ')}
데이터베이스: ${techStack.database.map(t => t.name).join(', ')}

다음 기능들을 포함해야 합니다:
1. API 엔드포인트 테스트
2. 데이터베이스 연동 테스트
3. 인증/인가 테스트
4. 에러 핸들링 테스트
5. 데이터 유효성 검사 테스트
6. 성능 테스트
7. 테스트 데이터 설정/정리

완전한 API 통합 테스트를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2000
        });

        return response.choices[0].message.content || this.getDefaultAPIIntegrationTest();
    }

    private async generateDatabaseIntegrationTest(techStack: TechStack): Promise<string> {
        const prompt = `
다음 데이터베이스를 사용한 통합 테스트를 생성해주세요:

데이터베이스: ${techStack.database.map(t => t.name).join(', ')}

다음 기능들을 포함해야 합니다:
1. 데이터베이스 연결 테스트
2. CRUD 작업 테스트
3. 트랜잭션 테스트
4. 제약조건 테스트
5. 인덱스 성능 테스트
6. 데이터 무결성 테스트
7. 동시성 테스트

완전한 데이터베이스 통합 테스트를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2000
        });

        return response.choices[0].message.content || this.getDefaultDatabaseIntegrationTest();
    }

    private async generatePlaywrightE2ETest(goal: Goal, techStack: TechStack): Promise<string> {
        const prompt = `
다음 목표에 맞는 Playwright E2E 테스트를 생성해주세요:

목표: ${goal.description}
카테고리: ${goal.category}
요구사항: ${goal.requirements.map(r => r.description).join(', ')}

기술 스택: ${techStack.frontend.map(t => t.name).join(', ')}

다음 기능들을 포함해야 합니다:
1. 사용자 시나리오 테스트
2. UI 상호작용 테스트
3. 폼 제출 테스트
4. 네비게이션 테스트
5. 반응형 디자인 테스트
6. 접근성 테스트
7. 크로스 브라우저 테스트

완전한 E2E 테스트를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2000
        });

        return response.choices[0].message.content || this.getDefaultPlaywrightE2ETest();
    }

    private generateK6PerformanceTest(goal: Goal): string {
        return `import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function() {
  // ${goal.description} 성능 테스트
  
  // 1. 홈페이지 로드 테스트
  let response = http.get('http://localhost:3000/');
  check(response, {
    '홈페이지 상태 200': (r) => r.status === 200,
    '홈페이지 응답시간 < 500ms': (r) => r.timings.duration < 500,
  });

  // 2. API 엔드포인트 테스트
  response = http.get('http://localhost:3000/api/health');
  check(response, {
    'API 상태 200': (r) => r.status === 200,
    'API 응답시간 < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
`;
    }

    private async generateLighthouseTest(goal: Goal, techStack: TechStack): Promise<string> {
        const prompt = `
다음 목표에 맞는 Lighthouse 성능 테스트를 생성해주세요:

목표: ${goal.description}
기술 스택: ${techStack.frontend.map(t => t.name).join(', ')}

다음 기능들을 포함해야 합니다:
1. 성능 점수 측정
2. 접근성 점수 측정
3. SEO 점수 측정
4. 모범 사례 점수 측정
5. PWA 점수 측정
6. 임계값 설정
7. 리포트 생성

완전한 Lighthouse 테스트를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 1500
        });

        return response.choices[0].message.content || this.getDefaultLighthouseTest();
    }

    private async generateOWASPSecurityTest(goal: Goal, techStack: TechStack): Promise<string> {
        const prompt = `
다음 목표에 맞는 OWASP 보안 테스트를 생성해주세요:

목표: ${goal.description}
기술 스택: ${techStack.backend.map(t => t.name).join(', ')}

다음 기능들을 포함해야 합니다:
1. SQL 인젝션 테스트
2. XSS 테스트
3. CSRF 테스트
4. 인증 우회 테스트
5. 권한 상승 테스트
6. 데이터 노출 테스트
7. 보안 헤더 테스트

완전한 OWASP 보안 테스트를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 1500
        });

        return response.choices[0].message.content || this.getDefaultOWASPSecurityTest();
    }

    // 설정 파일 생성 메서드들
    private generateJestConfig(techStack: TechStack): string {
        return `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/test-utils.ts',
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
  setupFilesAfterEnv: ['<rootDir>/src/test-utils.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 10000,
  verbose: true
};
`;
    }

    private generatePlaywrightConfig(techStack: TechStack): string {
        return `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
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
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
`;
    }

    // 기본 구현 메서드들
    private shouldGenerateUnitTest(file: CodeFile): boolean {
        // 단위 테스트 생성 대상 파일 판단
        return file.language === 'typescript' || file.language === 'javascript';
    }

    private getTestFileName(originalName: string): string {
        return originalName.replace(/\.(ts|js)$/, '.test.$1');
    }

    private getTestFilePath(originalPath: string): string {
        return originalPath.replace('src/', 'tests/unit/');
    }

    private getTestLanguage(originalLanguage: string): string {
        return originalLanguage === 'typescript' ? 'typescript' : 'javascript';
    }

    private getDefaultUnitTest(file: CodeFile): string {
        return `import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('${file.name}', () => {
  beforeEach(() => {
    // 테스트 전 설정
  });

  afterEach(() => {
    // 테스트 후 정리
  });

  it('should work correctly', () => {
    // TODO: 실제 테스트 구현
    expect(true).toBe(true);
  });
});
`;
    }

    private getDefaultAPIIntegrationTest(): string {
        return `import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // 테스트 데이터베이스 설정
  });

  afterAll(async () => {
    // 테스트 데이터베이스 정리
  });

  it('should return health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('healthy');
  });
});
`;
    }

    private getDefaultDatabaseIntegrationTest(): string {
        return `import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    // 데이터베이스 연결 설정
  });

  afterAll(async () => {
    // 데이터베이스 연결 정리
  });

  it('should connect to database', async () => {
    // TODO: 데이터베이스 연결 테스트
    expect(true).toBe(true);
  });
});
`;
    }

    private getDefaultPlaywrightE2ETest(): string {
        return `import { test, expect } from '@playwright/test';

test.describe('E2E Tests', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.*/);
  });

  test('should navigate to different pages', async ({ page }) => {
    await page.goto('/');
    // TODO: 네비게이션 테스트 구현
  });
});
`;
    }

    private getDefaultLighthouseTest(): string {
        return `import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';

test.describe('Lighthouse Performance Tests', () => {
  test('should pass lighthouse audit', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    await page.goto('http://localhost:3000');
    
    // TODO: Lighthouse 감사 실행
    // const results = await lighthouse(page);
    
    await browser.close();
  });
});
`;
    }

    private getDefaultOWASPSecurityTest(): string {
        return `import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';

describe('OWASP Security Tests', () => {
  it('should prevent SQL injection', async () => {
    // TODO: SQL 인젝션 테스트 구현
    expect(true).toBe(true);
  });

  it('should prevent XSS attacks', async () => {
    // TODO: XSS 테스트 구현
    expect(true).toBe(true);
  });
});
`;
    }

    /**
     * 코드 복잡도 계산
     */
    private calculateComplexity(content: string): number {
        const lines = content.split('\n').length;
        const functions = (content.match(/function|=>/g) || []).length;
        const conditions = (content.match(/if|else|switch|case/g) || []).length;
        const loops = (content.match(/for|while|do/g) || []).length;

        return Math.min(10, Math.max(1, (lines / 50) + (functions / 10) + (conditions / 5) + (loops / 3)));
    }

    /**
     * 코드 품질 계산
     */
    private calculateQuality(content: string): number {
        let score = 5; // 기본 점수

        // 테스트 구조 확인
        if (content.includes('describe') && content.includes('it')) score += 1;

        // 에러 핸들링 확인
        if (content.includes('try') && content.includes('catch')) score += 1;

        // Mock 사용 확인
        if (content.includes('mock') || content.includes('jest.mock')) score += 1;

        // 명확한 테스트 이름 확인
        if (content.includes('should') || content.includes('expect')) score += 1;

        // AAA 패턴 확인
        if (content.includes('// Arrange') || content.includes('// Act') || content.includes('// Assert')) score += 1;

        return Math.min(10, Math.max(1, score));
    }

    /**
     * 고유 ID 생성
     */
    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}
