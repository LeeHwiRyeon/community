import { CodeFile, OptimizationSuggestion } from '../types';
import * as fs from 'fs';
import * as path from 'path';

// 코드 분석 결과 인터페이스
export interface CodeAnalysisResult {
    filePath: string;
    timestamp: Date;
    metrics: CodeMetrics;
    issues: CodeIssue[];
    suggestions: OptimizationSuggestion[];
    quality: QualityScore;
}

// 코드 메트릭 인터페이스
export interface CodeMetrics {
    linesOfCode: number;
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    maintainabilityIndex: number;
    technicalDebt: number;
    codeSmells: number;
    duplications: number;
    testCoverage: number;
    performanceScore: number;
    securityScore: number;
}

// 코드 이슈 인터페이스
export interface CodeIssue {
    id: string;
    type: 'error' | 'warning' | 'info' | 'suggestion';
    severity: 'critical' | 'major' | 'minor' | 'info';
    message: string;
    line: number;
    column: number;
    rule: string;
    category: 'performance' | 'security' | 'maintainability' | 'style' | 'bug';
    fix?: string;
    effort: 'low' | 'medium' | 'high';
}

// 품질 점수 인터페이스
export interface QualityScore {
    overall: number;
    maintainability: number;
    reliability: number;
    security: number;
    performance: number;
    usability: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

// 실시간 코드 분석기
export class RealtimeCodeAnalyzer {
    private watchers: Map<string, fs.FSWatcher> = new Map();
    private analysisCache: Map<string, CodeAnalysisResult> = new Map();
    private analysisQueue: Set<string> = new Set();
    private isAnalyzing: boolean = false;
    private analysisInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.startAnalysisLoop();
    }

    // 파일 감시 시작
    watchDirectory(directoryPath: string): void {
        if (this.watchers.has(directoryPath)) {
            return;
        }

        const watcher = fs.watch(directoryPath, { recursive: true }, (eventType, filename) => {
            if (filename && this.isCodeFile(filename)) {
                const fullPath = path.join(directoryPath, filename);
                this.queueAnalysis(fullPath);
            }
        });

        this.watchers.set(directoryPath, watcher);
        console.log(`📁 Watching directory: ${directoryPath}`);
    }

    // 파일 감시 중지
    unwatchDirectory(directoryPath: string): void {
        const watcher = this.watchers.get(directoryPath);
        if (watcher) {
            watcher.close();
            this.watchers.delete(directoryPath);
            console.log(`📁 Stopped watching: ${directoryPath}`);
        }
    }

    // 모든 감시 중지
    stopAllWatching(): void {
        for (const [path, watcher] of this.watchers) {
            watcher.close();
        }
        this.watchers.clear();

        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = null;
        }
    }

    // 분석 큐에 추가
    private queueAnalysis(filePath: string): void {
        this.analysisQueue.add(filePath);
    }

    // 분석 루프 시작
    private startAnalysisLoop(): void {
        this.analysisInterval = setInterval(async () => {
            if (this.analysisQueue.size > 0 && !this.isAnalyzing) {
                await this.processAnalysisQueue();
            }
        }, 1000); // 1초마다 체크
    }

    // 분석 큐 처리
    private async processAnalysisQueue(): Promise<void> {
        if (this.isAnalyzing) return;

        this.isAnalyzing = true;
        const filesToAnalyze = Array.from(this.analysisQueue);
        this.analysisQueue.clear();

        for (const filePath of filesToAnalyze) {
            try {
                await this.analyzeFile(filePath);
            } catch (error) {
                console.error(`❌ Analysis failed for ${filePath}:`, error);
            }
        }

        this.isAnalyzing = false;
    }

    // 파일 분석
    async analyzeFile(filePath: string): Promise<CodeAnalysisResult | null> {
        try {
            if (!fs.existsSync(filePath)) {
                return null;
            }

            const content = fs.readFileSync(filePath, 'utf-8');
            const extension = path.extname(filePath).toLowerCase();

            // 파일 타입별 분석
            let analysisResult: CodeAnalysisResult;

            switch (extension) {
                case '.ts':
                case '.tsx':
                case '.js':
                case '.jsx':
                    analysisResult = await this.analyzeJavaScriptFile(filePath, content);
                    break;
                case '.py':
                    analysisResult = await this.analyzePythonFile(filePath, content);
                    break;
                case '.java':
                    analysisResult = await this.analyzeJavaFile(filePath, content);
                    break;
                case '.cs':
                    analysisResult = await this.analyzeCSharpFile(filePath, content);
                    break;
                default:
                    return null;
            }

            // 캐시에 저장
            this.analysisCache.set(filePath, analysisResult);

            // 실시간 알림
            this.notifyAnalysisResult(analysisResult);

            return analysisResult;
        } catch (error) {
            console.error(`❌ Error analyzing ${filePath}:`, error);
            return null;
        }
    }

    // JavaScript/TypeScript 파일 분석
    private async analyzeJavaScriptFile(filePath: string, content: string): Promise<CodeAnalysisResult> {
        const lines = content.split('\n');
        const metrics = this.calculateJavaScriptMetrics(content, lines);
        const issues = this.detectJavaScriptIssues(content, lines);
        const suggestions = this.generateOptimizationSuggestions(issues, metrics);
        const quality = this.calculateQualityScore(metrics, issues);

        return {
            filePath,
            timestamp: new Date(),
            metrics,
            issues,
            suggestions,
            quality
        };
    }

    // Python 파일 분석
    private async analyzePythonFile(filePath: string, content: string): Promise<CodeAnalysisResult> {
        const lines = content.split('\n');
        const metrics = this.calculatePythonMetrics(content, lines);
        const issues = this.detectPythonIssues(content, lines);
        const suggestions = this.generateOptimizationSuggestions(issues, metrics);
        const quality = this.calculateQualityScore(metrics, issues);

        return {
            filePath,
            timestamp: new Date(),
            metrics,
            issues,
            suggestions,
            quality
        };
    }

    // Java 파일 분석
    private async analyzeJavaFile(filePath: string, content: string): Promise<CodeAnalysisResult> {
        const lines = content.split('\n');
        const metrics = this.calculateJavaMetrics(content, lines);
        const issues = this.detectJavaIssues(content, lines);
        const suggestions = this.generateOptimizationSuggestions(issues, metrics);
        const quality = this.calculateQualityScore(metrics, issues);

        return {
            filePath,
            timestamp: new Date(),
            metrics,
            issues,
            suggestions,
            quality
        };
    }

    // C# 파일 분석
    private async analyzeCSharpFile(filePath: string, content: string): Promise<CodeAnalysisResult> {
        const lines = content.split('\n');
        const metrics = this.calculateCSharpMetrics(content, lines);
        const issues = this.detectCSharpIssues(content, lines);
        const suggestions = this.generateOptimizationSuggestions(issues, metrics);
        const quality = this.calculateQualityScore(metrics, issues);

        return {
            filePath,
            timestamp: new Date(),
            metrics,
            issues,
            suggestions,
            quality
        };
    }

    // JavaScript 메트릭 계산
    private calculateJavaScriptMetrics(content: string, lines: string[]): CodeMetrics {
        const linesOfCode = lines.filter(line => line.trim().length > 0).length;
        const cyclomaticComplexity = this.calculateCyclomaticComplexity(content);
        const cognitiveComplexity = this.calculateCognitiveComplexity(content);
        const maintainabilityIndex = this.calculateMaintainabilityIndex(content, cyclomaticComplexity);
        const technicalDebt = this.calculateTechnicalDebt(content);
        const codeSmells = this.detectCodeSmells(content);
        const duplications = this.detectDuplications(content);
        const testCoverage = this.calculateTestCoverage(content);
        const performanceScore = this.calculatePerformanceScore(content);
        const securityScore = this.calculateSecurityScore(content);

        return {
            linesOfCode,
            cyclomaticComplexity,
            cognitiveComplexity,
            maintainabilityIndex,
            technicalDebt,
            codeSmells,
            duplications,
            testCoverage,
            performanceScore,
            securityScore
        };
    }

    // Python 메트릭 계산
    private calculatePythonMetrics(content: string, lines: string[]): CodeMetrics {
        // Python 특화 메트릭 계산 로직
        return this.calculateJavaScriptMetrics(content, lines); // 임시로 동일한 로직 사용
    }

    // Java 메트릭 계산
    private calculateJavaMetrics(content: string, lines: string[]): CodeMetrics {
        // Java 특화 메트릭 계산 로직
        return this.calculateJavaScriptMetrics(content, lines); // 임시로 동일한 로직 사용
    }

    // C# 메트릭 계산
    private calculateCSharpMetrics(content: string, lines: string[]): CodeMetrics {
        // C# 특화 메트릭 계산 로직
        return this.calculateJavaScriptMetrics(content, lines); // 임시로 동일한 로직 사용
    }

    // 순환 복잡도 계산
    private calculateCyclomaticComplexity(content: string): number {
        const complexityKeywords = [
            'if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||', '?', ':'
        ];

        let complexity = 1; // 기본 복잡도

        for (const keyword of complexityKeywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const matches = content.match(regex);
            if (matches) {
                complexity += matches.length;
            }
        }

        return complexity;
    }

    // 인지 복잡도 계산
    private calculateCognitiveComplexity(content: string): number {
        // 간단한 인지 복잡도 계산
        return this.calculateCyclomaticComplexity(content) * 1.2;
    }

    // 유지보수성 지수 계산
    private calculateMaintainabilityIndex(content: string, cyclomaticComplexity: number): number {
        const linesOfCode = content.split('\n').length;
        const commentLines = (content.match(/\/\*[\s\S]*?\*\/|\/\/.*$/gm) || []).length;
        const commentRatio = commentLines / linesOfCode;

        // 유지보수성 지수 공식 (0-100)
        const maintainability = Math.max(0, 100 - (cyclomaticComplexity * 2) - (linesOfCode / 10) + (commentRatio * 20));
        return Math.min(100, maintainability);
    }

    // 기술 부채 계산
    private calculateTechnicalDebt(content: string): number {
        const debtIndicators = [
            'TODO', 'FIXME', 'HACK', 'XXX', 'BUG', 'DEPRECATED'
        ];

        let debt = 0;
        for (const indicator of debtIndicators) {
            const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
            const matches = content.match(regex);
            if (matches) {
                debt += matches.length * 10; // 각 지표당 10점
            }
        }

        return debt;
    }

    // 코드 스멜 감지
    private detectCodeSmells(content: string): number {
        const smellPatterns = [
            /function\s+\w+\s*\([^)]*\)\s*\{[\s\S]{500,}\}/g, // 긴 함수
            /if\s*\([^)]*\)\s*\{[\s\S]*if\s*\([^)]*\)\s*\{[\s\S]*if\s*\([^)]*\)\s*\{/g, // 중첩된 if
            /var\s+\w+\s*=\s*[^;]*;\s*[\s\S]*var\s+\w+\s*=\s*[^;]*;\s*[\s\S]*var\s+\w+\s*=\s*[^;]*;/g, // 긴 변수 선언
        ];

        let smells = 0;
        for (const pattern of smellPatterns) {
            const matches = content.match(pattern);
            if (matches) {
                smells += matches.length;
            }
        }

        return smells;
    }

    // 중복 코드 감지
    private detectDuplications(content: string): number {
        const lines = content.split('\n');
        const lineMap = new Map<string, number>();

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length > 10) { // 최소 10자 이상
                lineMap.set(trimmed, (lineMap.get(trimmed) || 0) + 1);
            }
        }

        let duplications = 0;
        for (const count of lineMap.values()) {
            if (count > 1) {
                duplications += count - 1;
            }
        }

        return duplications;
    }

    // 테스트 커버리지 계산
    private calculateTestCoverage(content: string): number {
        const testKeywords = ['test', 'spec', 'describe', 'it', 'expect', 'assert'];
        const testLines = testKeywords.reduce((count, keyword) => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const matches = content.match(regex);
            return count + (matches ? matches.length : 0);
        }, 0);

        const totalLines = content.split('\n').length;
        return totalLines > 0 ? (testLines / totalLines) * 100 : 0;
    }

    // 성능 점수 계산
    private calculatePerformanceScore(content: string): number {
        let score = 100;

        // 성능 저하 패턴 감지
        const performanceIssues = [
            /for\s*\([^)]*\)\s*\{[\s\S]*for\s*\([^)]*\)\s*\{/g, // 중첩된 루프
            /eval\s*\(/g, // eval 사용
            /document\.write\s*\(/g, // document.write 사용
            /innerHTML\s*=/g, // innerHTML 직접 할당
        ];

        for (const pattern of performanceIssues) {
            const matches = content.match(pattern);
            if (matches) {
                score -= matches.length * 10;
            }
        }

        return Math.max(0, score);
    }

    // 보안 점수 계산
    private calculateSecurityScore(content: string): number {
        let score = 100;

        // 보안 취약점 패턴 감지
        const securityIssues = [
            /innerHTML\s*=\s*[^;]*\+/g, // XSS 취약점
            /eval\s*\(/g, // 코드 인젝션
            /document\.cookie/g, // 쿠키 직접 조작
            /localStorage\.setItem\s*\([^,]*,[^)]*\+/g, // 저장소 XSS
        ];

        for (const pattern of securityIssues) {
            const matches = content.match(pattern);
            if (matches) {
                score -= matches.length * 20;
            }
        }

        return Math.max(0, score);
    }

    // JavaScript 이슈 감지
    private detectJavaScriptIssues(content: string, lines: string[]): CodeIssue[] {
        const issues: CodeIssue[] = [];

        // ESLint 규칙 기반 이슈 감지
        const rules = [
            {
                pattern: /console\.log\s*\(/g,
                type: 'warning' as const,
                message: 'console.log should be removed in production',
                rule: 'no-console',
                category: 'style' as const
            },
            {
                pattern: /var\s+\w+/g,
                type: 'suggestion' as const,
                message: 'Use let or const instead of var',
                rule: 'no-var',
                category: 'style' as const
            },
            {
                pattern: /==\s*[^=]/g,
                type: 'warning' as const,
                message: 'Use === instead of ==',
                rule: 'eqeqeq',
                category: 'bug' as const
            }
        ];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            for (const rule of rules) {
                const matches = line.match(rule.pattern);
                if (matches) {
                    for (const match of matches) {
                        issues.push({
                            id: `${i}-${rule.rule}`,
                            type: rule.type,
                            severity: rule.type === 'error' ? 'major' : 'minor',
                            message: rule.message,
                            line: i + 1,
                            column: line.indexOf(match) + 1,
                            rule: rule.rule,
                            category: rule.category,
                            effort: 'low'
                        });
                    }
                }
            }
        }

        return issues;
    }

    // Python 이슈 감지
    private detectPythonIssues(content: string, lines: string[]): CodeIssue[] {
        // Python 특화 이슈 감지 로직
        return this.detectJavaScriptIssues(content, lines); // 임시로 동일한 로직 사용
    }

    // Java 이슈 감지
    private detectJavaIssues(content: string, lines: string[]): CodeIssue[] {
        // Java 특화 이슈 감지 로직
        return this.detectJavaScriptIssues(content, lines); // 임시로 동일한 로직 사용
    }

    // C# 이슈 감지
    private detectCSharpIssues(content: string, lines: string[]): CodeIssue[] {
        // C# 특화 이슈 감지 로직
        return this.detectJavaScriptIssues(content, lines); // 임시로 동일한 로직 사용
    }

    // 최적화 제안 생성
    private generateOptimizationSuggestions(issues: CodeIssue[], metrics: CodeMetrics): OptimizationSuggestion[] {
        const suggestions: OptimizationSuggestion[] = [];

        // 복잡도 기반 제안
        if (metrics.cyclomaticComplexity > 10) {
            suggestions.push({
                type: 'refactor',
                title: '함수 복잡도 감소',
                description: `현재 복잡도가 ${metrics.cyclomaticComplexity}입니다. 함수를 분리하여 복잡도를 10 이하로 줄이세요.`,
                impact: 'high',
                effort: 'medium',
                category: 'maintainability'
            });
        }

        // 성능 기반 제안
        if (metrics.performanceScore < 70) {
            suggestions.push({
                type: 'optimize',
                title: '성능 최적화',
                description: '성능 점수가 낮습니다. 중첩된 루프나 비효율적인 DOM 조작을 개선하세요.',
                impact: 'medium',
                effort: 'high',
                category: 'performance'
            });
        }

        // 보안 기반 제안
        if (metrics.securityScore < 80) {
            suggestions.push({
                type: 'security',
                title: '보안 강화',
                description: '보안 취약점이 감지되었습니다. XSS나 코드 인젝션 방지를 위한 검증을 추가하세요.',
                impact: 'high',
                effort: 'medium',
                category: 'security'
            });
        }

        return suggestions;
    }

    // 품질 점수 계산
    private calculateQualityScore(metrics: CodeMetrics, issues: CodeIssue[]): QualityScore {
        const maintainability = Math.max(0, 100 - metrics.cyclomaticComplexity * 5 - metrics.codeSmells * 2);
        const reliability = Math.max(0, 100 - issues.filter(i => i.category === 'bug').length * 10);
        const security = metrics.securityScore;
        const performance = metrics.performanceScore;
        const usability = Math.max(0, 100 - issues.filter(i => i.category === 'style').length * 5);

        const overall = (maintainability + reliability + security + performance + usability) / 5;

        let grade: 'A' | 'B' | 'C' | 'D' | 'F';
        if (overall >= 90) grade = 'A';
        else if (overall >= 80) grade = 'B';
        else if (overall >= 70) grade = 'C';
        else if (overall >= 60) grade = 'D';
        else grade = 'F';

        return {
            overall,
            maintainability,
            reliability,
            security,
            performance,
            usability,
            grade
        };
    }

    // 코드 파일인지 확인
    private isCodeFile(filename: string): boolean {
        const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cs', '.cpp', '.c', '.h'];
        const ext = path.extname(filename).toLowerCase();
        return codeExtensions.includes(ext);
    }

    // 분석 결과 알림
    private notifyAnalysisResult(result: CodeAnalysisResult): void {
        const criticalIssues = result.issues.filter(i => i.severity === 'critical').length;
        const majorIssues = result.issues.filter(i => i.severity === 'major').length;

        if (criticalIssues > 0) {
            console.log(`🚨 ${result.filePath}: ${criticalIssues}개 중요 이슈 발견`);
        } else if (majorIssues > 0) {
            console.log(`⚠️ ${result.filePath}: ${majorIssues}개 주요 이슈 발견`);
        } else if (result.quality.grade === 'A') {
            console.log(`✅ ${result.filePath}: 우수한 코드 품질 (${result.quality.grade})`);
        }
    }

    // 분석 결과 가져오기
    getAnalysisResult(filePath: string): CodeAnalysisResult | null {
        return this.analysisCache.get(filePath) || null;
    }

    // 모든 분석 결과 가져오기
    getAllAnalysisResults(): CodeAnalysisResult[] {
        return Array.from(this.analysisCache.values());
    }

    // 분석 통계 가져오기
    getAnalysisStats(): any {
        const results = this.getAllAnalysisResults();

        if (results.length === 0) {
            return { totalFiles: 0 };
        }

        const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
        const criticalIssues = results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'critical').length, 0);
        const averageQuality = results.reduce((sum, r) => sum + r.quality.overall, 0) / results.length;

        return {
            totalFiles: results.length,
            totalIssues,
            criticalIssues,
            averageQuality: Math.round(averageQuality * 100) / 100,
            qualityDistribution: this.getQualityDistribution(results)
        };
    }

    // 품질 분포 가져오기
    private getQualityDistribution(results: CodeAnalysisResult[]): any {
        const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };

        for (const result of results) {
            distribution[result.quality.grade]++;
        }

        return distribution;
    }
}

// 싱글톤 인스턴스
export const realtimeAnalyzer = new RealtimeCodeAnalyzer();
