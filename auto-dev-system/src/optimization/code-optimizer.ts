import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { CodeFile, OptimizationSuggestion, Issue } from '@/types';

export class CodeOptimizer {
    private openai: OpenAI;
    private projectPath: string;

    constructor(apiKey: string, projectPath: string = './generated-projects') {
        this.openai = new OpenAI({ apiKey });
        this.projectPath = projectPath;
    }

    /**
     * 코드 최적화 실행
     */
    async optimizeCode(sourceFiles: CodeFile[]): Promise<CodeOptimizationResult> {
        console.log('⚡ 코드 최적화 시작...');

        try {
            // 1. 코드 분석
            const analysis = await this.analyzeCode(sourceFiles);

            // 2. 최적화 제안 생성
            const suggestions = await this.generateOptimizationSuggestions(sourceFiles, analysis);

            // 3. 자동 최적화 적용
            const optimizedFiles = await this.applyOptimizations(sourceFiles, suggestions);

            // 4. 성능 측정
            const performanceMetrics = await this.measurePerformance(optimizedFiles);

            // 5. 최적화 리포트 생성
            const report = await this.generateOptimizationReport(analysis, suggestions, performanceMetrics);

            console.log('✅ 코드 최적화 완료');

            return {
                originalFiles: sourceFiles,
                optimizedFiles,
                suggestions,
                performanceMetrics,
                report,
                summary: this.generateOptimizationSummary(analysis, suggestions, performanceMetrics)
            };

        } catch (error) {
            console.error('❌ 코드 최적화 실패:', error);
            throw error;
        }
    }

    /**
     * 코드 분석
     */
    private async analyzeCode(sourceFiles: CodeFile[]): Promise<CodeAnalysis> {
        console.log('🔍 코드 분석 중...');

        const analysis: CodeAnalysis = {
            complexity: {
                average: 0,
                max: 0,
                files: []
            },
            performance: {
                bottlenecks: [],
                slowFunctions: [],
                memoryLeaks: []
            },
            maintainability: {
                codeSmells: [],
                duplication: [],
                coupling: []
            },
            security: {
                vulnerabilities: [],
                unsafePatterns: []
            },
            quality: {
                overall: 0,
                metrics: {}
            }
        };

        for (const file of sourceFiles) {
            const fileAnalysis = await this.analyzeFile(file);

            // 복잡도 분석
            analysis.complexity.files.push({
                file: file.name,
                complexity: fileAnalysis.complexity,
                lines: file.content.split('\n').length
            });

            // 성능 분석
            analysis.performance.bottlenecks.push(...fileAnalysis.performance.bottlenecks);
            analysis.performance.slowFunctions.push(...fileAnalysis.performance.slowFunctions);
            analysis.performance.memoryLeaks.push(...fileAnalysis.performance.memoryLeaks);

            // 유지보수성 분석
            analysis.maintainability.codeSmells.push(...fileAnalysis.maintainability.codeSmells);
            analysis.maintainability.duplication.push(...fileAnalysis.maintainability.duplication);
            analysis.maintainability.coupling.push(...fileAnalysis.maintainability.coupling);

            // 보안 분석
            analysis.security.vulnerabilities.push(...fileAnalysis.security.vulnerabilities);
            analysis.security.unsafePatterns.push(...fileAnalysis.security.unsafePatterns);
        }

        // 전체 복잡도 계산
        analysis.complexity.average = analysis.complexity.files.reduce((sum, f) => sum + f.complexity, 0) / analysis.complexity.files.length;
        analysis.complexity.max = Math.max(...analysis.complexity.files.map(f => f.complexity));

        // 전체 품질 점수 계산
        analysis.quality.overall = this.calculateOverallQuality(analysis);

        return analysis;
    }

    /**
     * 개별 파일 분석
     */
    private async analyzeFile(file: CodeFile): Promise<FileAnalysis> {
        const content = file.content;
        const lines = content.split('\n');

        return {
            complexity: this.calculateComplexity(content),
            performance: this.analyzePerformance(content),
            maintainability: this.analyzeMaintainability(content),
            security: this.analyzeSecurity(content),
            quality: this.calculateFileQuality(content)
        };
    }

    /**
     * 복잡도 계산
     */
    private calculateComplexity(content: string): number {
        const lines = content.split('\n').length;
        const functions = (content.match(/function|=>/g) || []).length;
        const conditions = (content.match(/if|else|switch|case/g) || []).length;
        const loops = (content.match(/for|while|do/g) || []).length;
        const nested = (content.match(/\{[\s\S]*\{/g) || []).length;

        // 순환 복잡도 계산
        return Math.min(10, Math.max(1, (lines / 50) + (functions / 10) + (conditions / 5) + (loops / 3) + (nested / 2)));
    }

    /**
     * 성능 분석
     */
    private analyzePerformance(content: string): PerformanceAnalysis {
        const bottlenecks: Issue[] = [];
        const slowFunctions: Issue[] = [];
        const memoryLeaks: Issue[] = [];

        // 동기 작업 감지
        if (content.includes('sync') && !content.includes('async')) {
            bottlenecks.push({
                id: this.generateId(),
                type: 'warning',
                severity: 'medium',
                message: '동기 작업이 감지되었습니다. 비동기 처리로 변경을 고려하세요.',
                file: 'performance-analysis',
                line: 0,
                column: 0,
                rule: 'sync-operation'
            });
        }

        // 중첩 루프 감지
        const nestedLoops = content.match(/for[\s\S]*for[\s\S]*{/g);
        if (nestedLoops) {
            bottlenecks.push({
                id: this.generateId(),
                type: 'warning',
                severity: 'high',
                message: '중첩 루프가 감지되었습니다. 성능 최적화가 필요합니다.',
                file: 'performance-analysis',
                line: 0,
                column: 0,
                rule: 'nested-loops'
            });
        }

        // 메모리 누수 패턴 감지
        if (content.includes('setInterval') && !content.includes('clearInterval')) {
            memoryLeaks.push({
                id: this.generateId(),
                type: 'error',
                severity: 'high',
                message: 'setInterval 사용 시 clearInterval을 호출하지 않아 메모리 누수가 발생할 수 있습니다.',
                file: 'performance-analysis',
                line: 0,
                column: 0,
                rule: 'memory-leak'
            });
        }

        return { bottlenecks, slowFunctions, memoryLeaks };
    }

    /**
     * 유지보수성 분석
     */
    private analyzeMaintainability(content: string): MaintainabilityAnalysis {
        const codeSmells: Issue[] = [];
        const duplication: Issue[] = [];
        const coupling: Issue[] = [];

        // 긴 함수 감지
        const functions = content.match(/function\s+\w+\([^)]*\)\s*{[\s\S]*?}/g);
        if (functions) {
            for (const func of functions) {
                const lines = func.split('\n').length;
                if (lines > 50) {
                    codeSmells.push({
                        id: this.generateId(),
                        type: 'warning',
                        severity: 'medium',
                        message: `긴 함수가 감지되었습니다 (${lines}줄). 함수를 분리하는 것을 고려하세요.`,
                        file: 'maintainability-analysis',
                        line: 0,
                        column: 0,
                        rule: 'long-function'
                    });
                }
            }
        }

        // 중복 코드 감지
        const lines = content.split('\n');
        const lineCounts = new Map<string, number>();

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length > 20) {
                lineCounts.set(trimmed, (lineCounts.get(trimmed) || 0) + 1);
            }
        }

        for (const [line, count] of lineCounts) {
            if (count > 3) {
                duplication.push({
                    id: this.generateId(),
                    type: 'warning',
                    severity: 'low',
                    message: `중복 코드가 감지되었습니다 (${count}회 반복). 공통 함수로 추출하는 것을 고려하세요.`,
                    file: 'maintainability-analysis',
                    line: 0,
                    column: 0,
                    rule: 'duplicate-code'
                });
            }
        }

        return { codeSmells, duplication, coupling };
    }

    /**
     * 보안 분석
     */
    private analyzeSecurity(content: string): SecurityAnalysis {
        const vulnerabilities: Issue[] = [];
        const unsafePatterns: Issue[] = [];

        // SQL 인젝션 패턴 감지
        if (content.includes('query') && content.includes('+') && !content.includes('prepared')) {
            vulnerabilities.push({
                id: this.generateId(),
                type: 'error',
                severity: 'high',
                message: 'SQL 인젝션 취약점이 감지되었습니다. Prepared Statement를 사용하세요.',
                file: 'security-analysis',
                line: 0,
                column: 0,
                rule: 'sql-injection'
            });
        }

        // XSS 패턴 감지
        if (content.includes('innerHTML') && !content.includes('sanitize')) {
            vulnerabilities.push({
                id: this.generateId(),
                type: 'error',
                severity: 'high',
                message: 'XSS 취약점이 감지되었습니다. innerHTML 사용 시 입력값을 검증하세요.',
                file: 'security-analysis',
                line: 0,
                column: 0,
                rule: 'xss'
            });
        }

        // 하드코딩된 비밀번호 감지
        if (content.match(/password\s*=\s*['"][^'"]+['"]/)) {
            unsafePatterns.push({
                id: this.generateId(),
                type: 'warning',
                severity: 'high',
                message: '하드코딩된 비밀번호가 감지되었습니다. 환경 변수를 사용하세요.',
                file: 'security-analysis',
                line: 0,
                column: 0,
                rule: 'hardcoded-password'
            });
        }

        return { vulnerabilities, unsafePatterns };
    }

    /**
     * 파일 품질 계산
     */
    private calculateFileQuality(content: string): number {
        let score = 5; // 기본 점수

        // JSDoc 주석 확인
        if (content.includes('/**')) score += 1;

        // 에러 핸들링 확인
        if (content.includes('try') && content.includes('catch')) score += 1;

        // 타입 검사 확인
        if (content.includes('typeof') || content.includes('instanceof')) score += 1;

        // 상수 사용 확인
        if (content.includes('const ') && !content.includes('var ')) score += 1;

        // 함수 분리 확인
        const functions = (content.match(/function|=>/g) || []).length;
        const lines = content.split('\n').length;
        if (functions > 0 && lines / functions < 20) score += 1;

        return Math.min(10, Math.max(1, score));
    }

    /**
     * 전체 품질 계산
     */
    private calculateOverallQuality(analysis: CodeAnalysis): number {
        const complexityScore = Math.max(0, 10 - analysis.complexity.average);
        const performanceScore = analysis.performance.bottlenecks.length === 0 ? 10 : 5;
        const maintainabilityScore = analysis.maintainability.codeSmells.length === 0 ? 10 : 7;
        const securityScore = analysis.security.vulnerabilities.length === 0 ? 10 : 3;

        return (complexityScore + performanceScore + maintainabilityScore + securityScore) / 4;
    }

    /**
     * 최적화 제안 생성
     */
    private async generateOptimizationSuggestions(
        sourceFiles: CodeFile[],
        analysis: CodeAnalysis
    ): Promise<OptimizationSuggestion[]> {
        const suggestions: OptimizationSuggestion[] = [];

        // 복잡도 기반 제안
        if (analysis.complexity.average > 7) {
            suggestions.push({
                type: 'code',
                description: '코드 복잡도가 높습니다. 함수를 분리하고 중첩을 줄이세요.',
                severity: 'high',
                estimatedImpact: '성능 향상 및 유지보수성 개선',
                suggestedChanges: await this.generateComplexityReductionChanges(sourceFiles)
            });
        }

        // 성능 기반 제안
        if (analysis.performance.bottlenecks.length > 0) {
            suggestions.push({
                type: 'code',
                description: '성능 병목이 감지되었습니다. 비동기 처리와 최적화가 필요합니다.',
                severity: 'high',
                estimatedImpact: '응답 시간 30-50% 단축',
                suggestedChanges: await this.generatePerformanceOptimizationChanges(sourceFiles)
            });
        }

        // 보안 기반 제안
        if (analysis.security.vulnerabilities.length > 0) {
            suggestions.push({
                type: 'code',
                description: '보안 취약점이 감지되었습니다. 즉시 수정이 필요합니다.',
                severity: 'critical',
                estimatedImpact: '보안 위험 제거',
                suggestedChanges: await this.generateSecurityFixChanges(sourceFiles)
            });
        }

        return suggestions;
    }

    /**
     * 복잡도 감소 변경사항 생성
     */
    private async generateComplexityReductionChanges(sourceFiles: CodeFile[]): Promise<CodeFile[]> {
        const changes: CodeFile[] = [];

        for (const file of sourceFiles) {
            if (this.calculateComplexity(file.content) > 7) {
                const optimizedContent = await this.optimizeFileComplexity(file);
                changes.push({
                    ...file,
                    content: optimizedContent,
                    lastModified: new Date()
                });
            }
        }

        return changes;
    }

    /**
     * 파일 복잡도 최적화
     */
    private async optimizeFileComplexity(file: CodeFile): Promise<string> {
        const prompt = `
다음 파일의 복잡도를 줄이기 위해 최적화해주세요:

파일명: ${file.name}
언어: ${file.language}
내용: ${file.content}

다음 최적화를 적용하세요:
1. 긴 함수를 작은 함수로 분리
2. 중첩된 조건문을 early return으로 변경
3. 중복 코드를 공통 함수로 추출
4. 복잡한 로직을 명확한 변수명으로 분리
5. 불필요한 중첩 제거

최적화된 코드를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2000
        });

        return response.choices[0].message.content || file.content;
    }

    /**
     * 성능 최적화 변경사항 생성
     */
    private async generatePerformanceOptimizationChanges(sourceFiles: CodeFile[]): Promise<CodeFile[]> {
        const changes: CodeFile[] = [];

        for (const file of sourceFiles) {
            const optimizedContent = await this.optimizeFilePerformance(file);
            if (optimizedContent !== file.content) {
                changes.push({
                    ...file,
                    content: optimizedContent,
                    lastModified: new Date()
                });
            }
        }

        return changes;
    }

    /**
     * 파일 성능 최적화
     */
    private async optimizeFilePerformance(file: CodeFile): Promise<string> {
        const prompt = `
다음 파일의 성능을 최적화해주세요:

파일명: ${file.name}
언어: ${file.language}
내용: ${file.content}

다음 최적화를 적용하세요:
1. 동기 작업을 비동기로 변경
2. 중첩 루프를 효율적인 알고리즘으로 변경
3. 불필요한 DOM 조작 최소화
4. 메모리 누수 방지
5. 캐싱 전략 적용

최적화된 코드를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2000
        });

        return response.choices[0].message.content || file.content;
    }

    /**
     * 보안 수정 변경사항 생성
     */
    private async generateSecurityFixChanges(sourceFiles: CodeFile[]): Promise<CodeFile[]> {
        const changes: CodeFile[] = [];

        for (const file of sourceFiles) {
            const securedContent = await this.secureFile(file);
            if (securedContent !== file.content) {
                changes.push({
                    ...file,
                    content: securedContent,
                    lastModified: new Date()
                });
            }
        }

        return changes;
    }

    /**
     * 파일 보안 강화
     */
    private async secureFile(file: CodeFile): Promise<string> {
        const prompt = `
다음 파일의 보안을 강화해주세요:

파일명: ${file.name}
언어: ${file.language}
내용: ${file.content}

다음 보안 강화를 적용하세요:
1. SQL 인젝션 방지 (Prepared Statement 사용)
2. XSS 방지 (입력값 검증 및 이스케이프)
3. 하드코딩된 비밀번호를 환경 변수로 변경
4. 입력값 검증 추가
5. 에러 메시지에서 민감한 정보 제거

보안이 강화된 코드를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2000
        });

        return response.choices[0].message.content || file.content;
    }

    /**
     * 최적화 적용
     */
    private async applyOptimizations(
        sourceFiles: CodeFile[],
        suggestions: OptimizationSuggestion[]
    ): Promise<CodeFile[]> {
        const optimizedFiles: CodeFile[] = [];

        for (const file of sourceFiles) {
            let optimizedContent = file.content;

            // 각 제안에 대해 최적화 적용
            for (const suggestion of suggestions) {
                if (suggestion.suggestedChanges) {
                    const change = suggestion.suggestedChanges.find(c => c.name === file.name);
                    if (change) {
                        optimizedContent = change.content;
                    }
                }
            }

            optimizedFiles.push({
                ...file,
                content: optimizedContent,
                lastModified: new Date()
            });
        }

        return optimizedFiles;
    }

    /**
     * 성능 측정
     */
    private async measurePerformance(optimizedFiles: CodeFile[]): Promise<PerformanceMetrics> {
        return {
            bundleSize: this.calculateBundleSize(optimizedFiles),
            loadTime: this.estimateLoadTime(optimizedFiles),
            memoryUsage: this.estimateMemoryUsage(optimizedFiles),
            cpuUsage: this.estimateCpuUsage(optimizedFiles),
            improvements: {
                bundleSizeReduction: 0,
                loadTimeReduction: 0,
                memoryUsageReduction: 0,
                cpuUsageReduction: 0
            }
        };
    }

    /**
     * 번들 크기 계산
     */
    private calculateBundleSize(files: CodeFile[]): number {
        return files.reduce((total, file) => total + file.size, 0);
    }

    /**
     * 로드 시간 추정
     */
    private estimateLoadTime(files: CodeFile[]): number {
        const totalSize = this.calculateBundleSize(files);
        // 1MB당 1초로 추정
        return totalSize / (1024 * 1024);
    }

    /**
     * 메모리 사용량 추정
     */
    private estimateMemoryUsage(files: CodeFile[]): number {
        const totalSize = this.calculateBundleSize(files);
        // 번들 크기의 2배로 추정
        return totalSize * 2;
    }

    /**
     * CPU 사용량 추정
     */
    private estimateCpuUsage(files: CodeFile[]): number {
        const totalComplexity = files.reduce((sum, file) => sum + this.calculateComplexity(file.content), 0);
        return totalComplexity / files.length;
    }

    /**
     * 최적화 리포트 생성
     */
    private async generateOptimizationReport(
        analysis: CodeAnalysis,
        suggestions: OptimizationSuggestion[],
        performanceMetrics: PerformanceMetrics
    ): Promise<string> {
        const report = {
            summary: this.generateOptimizationSummary(analysis, suggestions, performanceMetrics),
            analysis,
            suggestions,
            performanceMetrics,
            generatedAt: new Date().toISOString()
        };

        const reportPath = path.join(this.projectPath, 'code-optimization-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return reportPath;
    }

    /**
     * 최적화 요약 생성
     */
    private generateOptimizationSummary(
        analysis: CodeAnalysis,
        suggestions: OptimizationSuggestion[],
        performanceMetrics: PerformanceMetrics
    ): OptimizationSummary {
        return {
            overallQuality: analysis.quality.overall,
            complexityScore: 10 - analysis.complexity.average,
            performanceScore: analysis.performance.bottlenecks.length === 0 ? 10 : 5,
            securityScore: analysis.security.vulnerabilities.length === 0 ? 10 : 3,
            maintainabilityScore: analysis.maintainability.codeSmells.length === 0 ? 10 : 7,
            suggestionsCount: suggestions.length,
            criticalIssues: analysis.security.vulnerabilities.length,
            performanceImprovements: performanceMetrics.improvements,
            status: this.determineOptimizationStatus(analysis, suggestions)
        };
    }

    /**
     * 최적화 상태 결정
     */
    private determineOptimizationStatus(
        analysis: CodeAnalysis,
        suggestions: OptimizationSuggestion[]
    ): 'excellent' | 'good' | 'fair' | 'poor' {
        if (analysis.quality.overall >= 8 && suggestions.length === 0) return 'excellent';
        if (analysis.quality.overall >= 6 && suggestions.length <= 2) return 'good';
        if (analysis.quality.overall >= 4 && suggestions.length <= 5) return 'fair';
        return 'poor';
    }

    /**
     * 고유 ID 생성
     */
    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

// 타입 정의
interface CodeAnalysis {
    complexity: {
        average: number;
        max: number;
        files: Array<{ file: string; complexity: number; lines: number }>;
    };
    performance: {
        bottlenecks: Issue[];
        slowFunctions: Issue[];
        memoryLeaks: Issue[];
    };
    maintainability: {
        codeSmells: Issue[];
        duplication: Issue[];
        coupling: Issue[];
    };
    security: {
        vulnerabilities: Issue[];
        unsafePatterns: Issue[];
    };
    quality: {
        overall: number;
        metrics: Record<string, number>;
    };
}

interface FileAnalysis {
    complexity: number;
    performance: PerformanceAnalysis;
    maintainability: MaintainabilityAnalysis;
    security: SecurityAnalysis;
    quality: number;
}

interface PerformanceAnalysis {
    bottlenecks: Issue[];
    slowFunctions: Issue[];
    memoryLeaks: Issue[];
}

interface MaintainabilityAnalysis {
    codeSmells: Issue[];
    duplication: Issue[];
    coupling: Issue[];
}

interface SecurityAnalysis {
    vulnerabilities: Issue[];
    unsafePatterns: Issue[];
}

interface PerformanceMetrics {
    bundleSize: number;
    loadTime: number;
    memoryUsage: number;
    cpuUsage: number;
    improvements: {
        bundleSizeReduction: number;
        loadTimeReduction: number;
        memoryUsageReduction: number;
        cpuUsageReduction: number;
    };
}

interface CodeOptimizationResult {
    originalFiles: CodeFile[];
    optimizedFiles: CodeFile[];
    suggestions: OptimizationSuggestion[];
    performanceMetrics: PerformanceMetrics;
    report: string;
    summary: OptimizationSummary;
}

interface OptimizationSummary {
    overallQuality: number;
    complexityScore: number;
    performanceScore: number;
    securityScore: number;
    maintainabilityScore: number;
    suggestionsCount: number;
    criticalIssues: number;
    performanceImprovements: any;
    status: 'excellent' | 'good' | 'fair' | 'poor';
}
