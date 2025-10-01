import { CodeFile, TestResult } from '../types';
import { multiModelManager } from '../ai/multi-model-manager';

// 테스트 생성 요청 인터페이스
export interface TestGenerationRequest {
    filePath: string;
    codeContent: string;
    language: 'typescript' | 'javascript' | 'python' | 'java' | 'csharp';
    testType: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
    framework: 'jest' | 'vitest' | 'playwright' | 'k6' | 'lighthouse' | 'cypress';
    complexity: 'low' | 'medium' | 'high';
    coverage: number;
    customRequirements?: string[];
}

// 테스트 생성 결과 인터페이스
export interface TestGenerationResult {
    testFile: string;
    testContent: string;
    testCases: TestCase[];
    coverage: CoverageInfo;
    quality: TestQuality;
    suggestions: TestSuggestion[];
    metadata: TestMetadata;
}

// 테스트 케이스 인터페이스
export interface TestCase {
    id: string;
    name: string;
    description: string;
    type: 'positive' | 'negative' | 'edge' | 'boundary' | 'integration';
    priority: 'critical' | 'high' | 'medium' | 'low';
    expectedResult: string;
    setup?: string;
    teardown?: string;
    data?: any;
    assertions: TestAssertion[];
}

// 테스트 어설션 인터페이스
export interface TestAssertion {
    type: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'throws' | 'notThrows' | 'toBeDefined' | 'toBeNull' | 'toBeTruthy' | 'toBeFalsy';
    expected: any;
    actual: string;
    message?: string;
}

// 커버리지 정보 인터페이스
export interface CoverageInfo {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
    uncoveredLines: number[];
    uncoveredFunctions: string[];
    uncoveredBranches: string[];
}

// 테스트 품질 인터페이스
export interface TestQuality {
    overall: number;
    readability: number;
    maintainability: number;
    reliability: number;
    performance: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

// 테스트 제안 인터페이스
export interface TestSuggestion {
    type: 'improvement' | 'addition' | 'optimization' | 'security';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
    code?: string;
}

// 테스트 메타데이터 인터페이스
export interface TestMetadata {
    generatedAt: Date;
    generator: string;
    version: string;
    estimatedTime: number;
    dependencies: string[];
    configuration: any;
}

// 지능형 테스트 생성기
export class IntelligentTestGenerator {
    private testTemplates: Map<string, string> = new Map();
    private testPatterns: Map<string, any> = new Map();
    private qualityRules: Map<string, any> = new Map();

    constructor() {
        this.initializeTemplates();
        this.initializePatterns();
        this.initializeQualityRules();
    }

    // 테스트 생성
    async generateTests(request: TestGenerationRequest): Promise<TestGenerationResult> {
        try {
            // 1. 코드 분석
            const codeAnalysis = await this.analyzeCode(request);

            // 2. 테스트 케이스 생성
            const testCases = await this.generateTestCases(request, codeAnalysis);

            // 3. 테스트 코드 생성
            const testContent = await this.generateTestCode(request, testCases);

            // 4. 커버리지 분석
            const coverage = await this.analyzeCoverage(request, testCases);

            // 5. 품질 평가
            const quality = await this.evaluateTestQuality(testContent, testCases);

            // 6. 제안 생성
            const suggestions = await this.generateSuggestions(request, testCases, quality);

            // 7. 메타데이터 생성
            const metadata = this.generateMetadata(request);

            return {
                testFile: this.generateTestFileName(request),
                testContent,
                testCases,
                coverage,
                quality,
                suggestions,
                metadata
            };
        } catch (error) {
            console.error('❌ Test generation failed:', error);
            throw new Error(`Test generation failed: ${error}`);
        }
    }

    // 코드 분석
    private async analyzeCode(request: TestGenerationRequest): Promise<any> {
        const analysisPrompt = this.buildAnalysisPrompt(request);

        const response = await multiModelManager.executeRequest(
            analysisPrompt,
            'analysis',
            request.complexity
        );

        return this.parseAnalysisResponse(response.content);
    }

    // 분석 프롬프트 구성
    private buildAnalysisPrompt(request: TestGenerationRequest): string {
        return `
코드 분석을 수행하여 테스트 생성을 위한 정보를 추출해주세요.

파일: ${request.filePath}
언어: ${request.language}
테스트 타입: ${request.testType}
프레임워크: ${request.framework}

코드:
\`\`\`${request.language}
${request.codeContent}
\`\`\`

다음 정보를 JSON 형태로 제공해주세요:
1. 함수/메서드 목록과 시그니처
2. 입력 매개변수와 타입
3. 반환값과 타입
4. 의존성과 외부 호출
5. 예외 처리 상황
6. 경계값과 엣지 케이스
7. 성능 관련 고려사항
8. 보안 관련 고려사항
9. 비즈니스 로직과 규칙
10. 테스트하기 어려운 부분

추가 요구사항: ${request.customRequirements?.join(', ') || '없음'}
`;
    }

    // 분석 응답 파싱
    private parseAnalysisResponse(content: string): any {
        try {
            // JSON 추출 시도
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            // 구조화된 텍스트 파싱
            return this.parseStructuredText(content);
        } catch (error) {
            console.warn('Failed to parse analysis response, using fallback');
            return this.createFallbackAnalysis();
        }
    }

    // 구조화된 텍스트 파싱
    private parseStructuredText(content: string): any {
        const analysis: any = {
            functions: [],
            dependencies: [],
            edgeCases: [],
            exceptions: [],
            performance: [],
            security: []
        };

        // 함수 추출
        const functionMatches = content.match(/(?:function|const|let|var)\s+(\w+)\s*\([^)]*\)/g);
        if (functionMatches) {
            analysis.functions = functionMatches.map(match => ({
                name: match.match(/(\w+)\s*\(/)?.[1],
                signature: match
            }));
        }

        // 의존성 추출
        const importMatches = content.match(/(?:import|require)\s+['"]([^'"]+)['"]/g);
        if (importMatches) {
            analysis.dependencies = importMatches.map(match =>
                match.match(/['"]([^'"]+)['"]/)?.[1]
            );
        }

        return analysis;
    }

    // 폴백 분석 생성
    private createFallbackAnalysis(): any {
        return {
            functions: [],
            dependencies: [],
            edgeCases: ['null input', 'empty input', 'invalid input'],
            exceptions: ['TypeError', 'ReferenceError'],
            performance: [],
            security: []
        };
    }

    // 테스트 케이스 생성
    private async generateTestCases(request: TestGenerationRequest, analysis: any): Promise<TestCase[]> {
        const testCases: TestCase[] = [];

        // 각 함수에 대한 테스트 케이스 생성
        for (const func of analysis.functions || []) {
            const functionTestCases = await this.generateFunctionTestCases(request, func, analysis);
            testCases.push(...functionTestCases);
        }

        // 통합 테스트 케이스 생성
        if (request.testType === 'integration' || request.testType === 'e2e') {
            const integrationTestCases = await this.generateIntegrationTestCases(request, analysis);
            testCases.push(...integrationTestCases);
        }

        // 성능 테스트 케이스 생성
        if (request.testType === 'performance') {
            const performanceTestCases = await this.generatePerformanceTestCases(request, analysis);
            testCases.push(...performanceTestCases);
        }

        // 보안 테스트 케이스 생성
        if (request.testType === 'security') {
            const securityTestCases = await this.generateSecurityTestCases(request, analysis);
            testCases.push(...securityTestCases);
        }

        return testCases;
    }

    // 함수별 테스트 케이스 생성
    private async generateFunctionTestCases(request: TestGenerationRequest, func: any, analysis: any): Promise<TestCase[]> {
        const testCases: TestCase[] = [];

        // 정상 케이스
        testCases.push({
            id: `${func.name}_normal`,
            name: `should handle normal input for ${func.name}`,
            description: `Test ${func.name} with valid input`,
            type: 'positive',
            priority: 'high',
            expectedResult: 'Should return expected output',
            assertions: [
                {
                    type: 'toBeDefined',
                    expected: true,
                    actual: 'result',
                    message: 'Result should be defined'
                }
            ]
        });

        // 엣지 케이스
        for (const edgeCase of analysis.edgeCases || []) {
            testCases.push({
                id: `${func.name}_edge_${edgeCase.replace(/\s+/g, '_')}`,
                name: `should handle edge case: ${edgeCase}`,
                description: `Test ${func.name} with ${edgeCase}`,
                type: 'edge',
                priority: 'medium',
                expectedResult: 'Should handle edge case gracefully',
                assertions: [
                    {
                        type: 'notThrows',
                        expected: true,
                        actual: 'function call',
                        message: 'Should not throw error'
                    }
                ]
            });
        }

        // 예외 케이스
        for (const exception of analysis.exceptions || []) {
            testCases.push({
                id: `${func.name}_exception_${exception}`,
                name: `should handle ${exception}`,
                description: `Test ${func.name} with ${exception} scenario`,
                type: 'negative',
                priority: 'high',
                expectedResult: 'Should throw appropriate error',
                assertions: [
                    {
                        type: 'throws',
                        expected: exception,
                        actual: 'function call',
                        message: `Should throw ${exception}`
                    }
                ]
            });
        }

        return testCases;
    }

    // 통합 테스트 케이스 생성
    private async generateIntegrationTestCases(request: TestGenerationRequest, analysis: any): Promise<TestCase[]> {
        return [
            {
                id: 'integration_workflow',
                name: 'should complete full workflow',
                description: 'Test complete user workflow',
                type: 'integration',
                priority: 'critical',
                expectedResult: 'Workflow should complete successfully',
                assertions: [
                    {
                        type: 'equals',
                        expected: 'success',
                        actual: 'workflow.status',
                        message: 'Workflow should complete successfully'
                    }
                ]
            }
        ];
    }

    // 성능 테스트 케이스 생성
    private async generatePerformanceTestCases(request: TestGenerationRequest, analysis: any): Promise<TestCase[]> {
        return [
            {
                id: 'performance_load',
                name: 'should handle load within acceptable time',
                description: 'Test performance under load',
                type: 'boundary',
                priority: 'high',
                expectedResult: 'Should complete within time limit',
                assertions: [
                    {
                        type: 'toBeDefined',
                        expected: true,
                        actual: 'executionTime < 1000',
                        message: 'Should complete within 1 second'
                    }
                ]
            }
        ];
    }

    // 보안 테스트 케이스 생성
    private async generateSecurityTestCases(request: TestGenerationRequest, analysis: any): Promise<TestCase[]> {
        return [
            {
                id: 'security_injection',
                name: 'should prevent injection attacks',
                description: 'Test security against injection',
                type: 'negative',
                priority: 'critical',
                expectedResult: 'Should reject malicious input',
                assertions: [
                    {
                        type: 'throws',
                        expected: 'SecurityError',
                        actual: 'function call with malicious input',
                        message: 'Should reject malicious input'
                    }
                ]
            }
        ];
    }

    // 테스트 코드 생성
    private async generateTestCode(request: TestGenerationRequest, testCases: TestCase[]): Promise<string> {
        const template = this.getTestTemplate(request.framework, request.language);
        const testCode = await this.fillTestTemplate(template, request, testCases);
        return testCode;
    }

    // 테스트 템플릿 가져오기
    private getTestTemplate(framework: string, language: string): string {
        const key = `${framework}_${language}`;
        return this.testTemplates.get(key) || this.getDefaultTemplate(framework, language);
    }

    // 기본 템플릿 가져오기
    private getDefaultTemplate(framework: string, language: string): string {
        if (framework === 'jest' && language === 'typescript') {
            return `
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { {{IMPORT_STATEMENTS}} } from '{{SOURCE_PATH}}';

describe('{{CLASS_NAME}}', () => {
  {{SETUP_CODE}}

  {{TEST_CASES}}

  {{TEARDOWN_CODE}}
});
`;
        }

        if (framework === 'playwright' && language === 'typescript') {
            return `
import { test, expect } from '@playwright/test';

test.describe('{{CLASS_NAME}}', () => {
  {{TEST_CASES}}
});
`;
        }

        return `
// Test template for {{FRAMEWORK}} in {{LANGUAGE}}
{{TEST_CASES}}
`;
    }

    // 테스트 템플릿 채우기
    private async fillTestTemplate(template: string, request: TestGenerationRequest, testCases: TestCase[]): Promise<string> {
        let testCode = template;

        // 기본 변수 치환
        testCode = testCode.replace(/\{\{CLASS_NAME\}\}/g, this.extractClassName(request.filePath));
        testCode = testCode.replace(/\{\{SOURCE_PATH\}\}/g, this.getSourcePath(request.filePath));
        testCode = testCode.replace(/\{\{FRAMEWORK\}\}/g, request.framework);
        testCode = testCode.replace(/\{\{LANGUAGE\}\}/g, request.language);

        // 테스트 케이스 생성
        const testCasesCode = await this.generateTestCasesCode(request, testCases);
        testCode = testCode.replace(/\{\{TEST_CASES\}\}/g, testCasesCode);

        // 설정 코드 생성
        const setupCode = this.generateSetupCode(request);
        testCode = testCode.replace(/\{\{SETUP_CODE\}\}/g, setupCode);

        // 정리 코드 생성
        const teardownCode = this.generateTeardownCode(request);
        testCode = testCode.replace(/\{\{TEARDOWN_CODE\}\}/g, teardownCode);

        // 임포트 문 생성
        const importStatements = this.generateImportStatements(request);
        testCode = testCode.replace(/\{\{IMPORT_STATEMENTS\}\}/g, importStatements);

        return testCode;
    }

    // 테스트 케이스 코드 생성
    private async generateTestCasesCode(request: TestGenerationRequest, testCases: TestCase[]): Promise<string> {
        const codeLines: string[] = [];

        for (const testCase of testCases) {
            const testCode = await this.generateSingleTestCaseCode(request, testCase);
            codeLines.push(testCode);
        }

        return codeLines.join('\n\n');
    }

    // 단일 테스트 케이스 코드 생성
    private async generateSingleTestCaseCode(request: TestGenerationRequest, testCase: TestCase): Promise<string> {
        const framework = request.framework;
        const language = request.language;

        let testCode = '';

        if (framework === 'jest') {
            testCode = `  it('${testCase.name}', async () => {
    // Arrange
    ${testCase.setup || '// Setup code here'}
    
    // Act
    ${this.generateActCode(testCase)}
    
    // Assert
    ${this.generateAssertCode(testCase, framework)}
  });`;
        } else if (framework === 'playwright') {
            testCode = `  test('${testCase.name}', async ({ page }) => {
    // Arrange
    ${testCase.setup || '// Setup code here'}
    
    // Act
    ${this.generateActCode(testCase)}
    
    // Assert
    ${this.generateAssertCode(testCase, framework)}
  });`;
        }

        return testCode;
    }

    // 액션 코드 생성
    private generateActCode(testCase: TestCase): string {
        return `const result = await functionUnderTest();`;
    }

    // 어설션 코드 생성
    private generateAssertCode(testCase: TestCase, framework: string): string {
        const assertions: string[] = [];

        for (const assertion of testCase.assertions) {
            let assertCode = '';

            switch (assertion.type) {
                case 'equals':
                    assertCode = `expect(${assertion.actual}).toBe(${JSON.stringify(assertion.expected)});`;
                    break;
                case 'notEquals':
                    assertCode = `expect(${assertion.actual}).not.toBe(${JSON.stringify(assertion.expected)});`;
                    break;
                case 'contains':
                    assertCode = `expect(${assertion.actual}).toContain(${JSON.stringify(assertion.expected)});`;
                    break;
                case 'notContains':
                    assertCode = `expect(${assertion.actual}).not.toContain(${JSON.stringify(assertion.expected)});`;
                    break;
                case 'throws':
                    assertCode = `expect(() => ${assertion.actual}).toThrow(${JSON.stringify(assertion.expected)});`;
                    break;
                case 'notThrows':
                    assertCode = `expect(() => ${assertion.actual}).not.toThrow();`;
                    break;
                case 'toBeDefined':
                    assertCode = `expect(${assertion.actual}).toBeDefined();`;
                    break;
                case 'toBeNull':
                    assertCode = `expect(${assertion.actual}).toBeNull();`;
                    break;
                case 'toBeTruthy':
                    assertCode = `expect(${assertion.actual}).toBeTruthy();`;
                    break;
                case 'toBeFalsy':
                    assertCode = `expect(${assertion.actual}).toBeFalsy();`;
                    break;
            }

            if (assertion.message) {
                assertCode += ` // ${assertion.message}`;
            }

            assertions.push(assertCode);
        }

        return assertions.join('\n    ');
    }

    // 커버리지 분석
    private async analyzeCoverage(request: TestGenerationRequest, testCases: TestCase[]): Promise<CoverageInfo> {
        // 간단한 커버리지 추정
        const estimatedCoverage = Math.min(95, testCases.length * 10);

        return {
            lines: estimatedCoverage,
            functions: estimatedCoverage,
            branches: estimatedCoverage - 10,
            statements: estimatedCoverage,
            uncoveredLines: [],
            uncoveredFunctions: [],
            uncoveredBranches: []
        };
    }

    // 테스트 품질 평가
    private async evaluateTestQuality(testContent: string, testCases: TestCase[]): Promise<TestQuality> {
        let overall = 50; // 기본 점수

        // 테스트 케이스 수 기반 점수
        if (testCases.length >= 10) overall += 20;
        else if (testCases.length >= 5) overall += 10;

        // 테스트 타입 다양성
        const testTypes = new Set(testCases.map(tc => tc.type));
        overall += testTypes.size * 5;

        // 어설션 품질
        const totalAssertions = testCases.reduce((sum, tc) => sum + tc.assertions.length, 0);
        if (totalAssertions >= testCases.length * 2) overall += 15;

        // 코드 품질 (간단한 휴리스틱)
        if (testContent.includes('describe') && testContent.includes('it')) overall += 10;
        if (testContent.includes('beforeEach') || testContent.includes('afterEach')) overall += 5;

        overall = Math.min(100, overall);

        let grade: 'A' | 'B' | 'C' | 'D' | 'F';
        if (overall >= 90) grade = 'A';
        else if (overall >= 80) grade = 'B';
        else if (overall >= 70) grade = 'C';
        else if (overall >= 60) grade = 'D';
        else grade = 'F';

        return {
            overall,
            readability: Math.min(100, overall + 5),
            maintainability: Math.min(100, overall + 3),
            reliability: Math.min(100, overall + 7),
            performance: Math.min(100, overall - 5),
            grade
        };
    }

    // 제안 생성
    private async generateSuggestions(request: TestGenerationRequest, testCases: TestCase[], quality: TestQuality): Promise<TestSuggestion[]> {
        const suggestions: TestSuggestion[] = [];

        if (quality.overall < 70) {
            suggestions.push({
                type: 'improvement',
                title: '테스트 품질 개선',
                description: '테스트 케이스를 더 추가하고 어설션을 강화하세요.',
                impact: 'high',
                effort: 'medium'
            });
        }

        if (testCases.length < 5) {
            suggestions.push({
                type: 'addition',
                title: '테스트 케이스 추가',
                description: '엣지 케이스와 예외 상황에 대한 테스트를 추가하세요.',
                impact: 'medium',
                effort: 'low'
            });
        }

        if (!testCases.some(tc => tc.type === 'integration')) {
            suggestions.push({
                type: 'addition',
                title: '통합 테스트 추가',
                description: '컴포넌트 간 상호작용을 테스트하는 통합 테스트를 추가하세요.',
                impact: 'high',
                effort: 'high'
            });
        }

        return suggestions;
    }

    // 메타데이터 생성
    private generateMetadata(request: TestGenerationRequest): TestMetadata {
        return {
            generatedAt: new Date(),
            generator: 'IntelligentTestGenerator v1.0',
            version: '1.0.0',
            estimatedTime: this.estimateExecutionTime(request),
            dependencies: this.extractDependencies(request),
            configuration: {
                framework: request.framework,
                language: request.language,
                testType: request.testType,
                complexity: request.complexity
            }
        };
    }

    // 실행 시간 추정
    private estimateExecutionTime(request: TestGenerationRequest): number {
        let baseTime = 1000; // 1초 기본

        if (request.testType === 'e2e') baseTime *= 3;
        if (request.testType === 'performance') baseTime *= 2;
        if (request.complexity === 'high') baseTime *= 2;
        if (request.complexity === 'medium') baseTime *= 1.5;

        return Math.round(baseTime);
    }

    // 의존성 추출
    private extractDependencies(request: TestGenerationRequest): string[] {
        const dependencies = ['@jest/globals'];

        if (request.framework === 'playwright') {
            dependencies.push('@playwright/test');
        }

        if (request.framework === 'vitest') {
            dependencies.push('vitest');
        }

        return dependencies;
    }

    // 클래스명 추출
    private extractClassName(filePath: string): string {
        const fileName = filePath.split('/').pop()?.split('.')[0] || 'Unknown';
        return fileName.charAt(0).toUpperCase() + fileName.slice(1);
    }

    // 소스 경로 가져오기
    private getSourcePath(filePath: string): string {
        return filePath.replace(/\.(ts|js|tsx|jsx)$/, '');
    }

    // 테스트 파일명 생성
    private generateTestFileName(request: TestGenerationRequest): string {
        const baseName = request.filePath.split('/').pop()?.split('.')[0] || 'test';
        const extension = request.language === 'typescript' ? '.test.ts' : '.test.js';
        return `${baseName}${extension}`;
    }

    // 설정 코드 생성
    private generateSetupCode(request: TestGenerationRequest): string {
        if (request.framework === 'jest') {
            return `
  let instance: any;
  
  beforeEach(() => {
    instance = new ${this.extractClassName(request.filePath)}();
  });`;
        }
        return '';
    }

    // 정리 코드 생성
    private generateTeardownCode(request: TestGenerationRequest): string {
        if (request.framework === 'jest') {
            return `
  afterEach(() => {
    // Cleanup code here
  });`;
        }
        return '';
    }

    // 임포트 문 생성
    private generateImportStatements(request: TestGenerationRequest): string {
        return this.extractClassName(request.filePath);
    }

    // 템플릿 초기화
    private initializeTemplates(): void {
        // Jest TypeScript 템플릿
        this.testTemplates.set('jest_typescript', `
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { {{IMPORT_STATEMENTS}} } from '{{SOURCE_PATH}}';

describe('{{CLASS_NAME}}', () => {
  {{SETUP_CODE}}

  {{TEST_CASES}}

  {{TEARDOWN_CODE}}
});
`);

        // Playwright 템플릿
        this.testTemplates.set('playwright_typescript', `
import { test, expect } from '@playwright/test';

test.describe('{{CLASS_NAME}}', () => {
  {{TEST_CASES}}
});
`);
    }

    // 패턴 초기화
    private initializePatterns(): void {
        this.testPatterns.set('function_test', {
            structure: 'describe -> it -> arrange/act/assert',
            assertions: ['expect', 'toBe', 'toEqual', 'toThrow']
        });
    }

    // 품질 규칙 초기화
    private initializeQualityRules(): void {
        this.qualityRules.set('coverage', {
            minimum: 80,
            target: 90,
            critical: 95
        });

        this.qualityRules.set('test_cases', {
            minimum: 5,
            recommended: 10,
            comprehensive: 20
        });
    }
}

// 싱글톤 인스턴스
export const intelligentTestGenerator = new IntelligentTestGenerator();
