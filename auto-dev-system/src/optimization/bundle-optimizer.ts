import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { CodeFile, OptimizationSuggestion, Issue } from '@/types';

export class BundleOptimizer {
    private openai: OpenAI;
    private projectPath: string;

    constructor(apiKey: string, projectPath: string = './generated-projects') {
        this.openai = new OpenAI({ apiKey });
        this.projectPath = projectPath;
    }

    /**
     * 번들 최적화 실행
     */
    async optimizeBundle(
        sourceFiles: CodeFile[],
        buildConfig: any = {}
    ): Promise<BundleOptimizationResult> {
        console.log('📦 번들 최적화 시작...');

        try {
            // 1. 번들 분석
            const analysis = await this.analyzeBundle(sourceFiles, buildConfig);

            // 2. 최적화 전략 생성
            const strategies = await this.generateBundleStrategies(analysis);

            // 3. 코드 분할 최적화
            const codeSplitting = await this.optimizeCodeSplitting(analysis);

            // 4. 트리 셰이킹 최적화
            const treeShaking = await this.optimizeTreeShaking(analysis);

            // 5. 압축 최적화
            const compression = await this.optimizeCompression(analysis);

            // 6. 성능 측정
            const performanceMetrics = await this.measureBundlePerformance(analysis);

            // 7. 최적화 리포트 생성
            const report = await this.generateBundleOptimizationReport(
                analysis,
                strategies,
                performanceMetrics
            );

            console.log('✅ 번들 최적화 완료');

            return {
                analysis,
                strategies,
                codeSplitting,
                treeShaking,
                compression,
                performanceMetrics,
                report,
                summary: this.generateBundleOptimizationSummary(analysis, strategies, performanceMetrics)
            };

        } catch (error) {
            console.error('❌ 번들 최적화 실패:', error);
            throw error;
        }
    }

    /**
     * 번들 분석
     */
    private async analyzeBundle(
        sourceFiles: CodeFile[],
        buildConfig: any
    ): Promise<BundleAnalysis> {
        console.log('🔍 번들 분석 중...');

        const analysis: BundleAnalysis = {
            totalSize: 0,
            fileCount: sourceFiles.length,
            dependencies: [],
            chunks: [],
            performance: {
                bundleSize: 0,
                loadTime: 0,
                parseTime: 0,
                renderTime: 0
            },
            issues: [],
            opportunities: []
        };

        // 파일 크기 분석
        for (const file of sourceFiles) {
            analysis.totalSize += file.size;

            // 의존성 분석
            const dependencies = this.extractDependencies(file.content);
            analysis.dependencies.push(...dependencies);

            // 청크 분석
            const chunks = this.analyzeChunks(file);
            analysis.chunks.push(...chunks);

            // 이슈 감지
            const issues = this.detectBundleIssues(file);
            analysis.issues.push(...issues);

            // 최적화 기회 식별
            const opportunities = this.identifyBundleOpportunities(file);
            analysis.opportunities.push(...opportunities);
        }

        // 성능 분석
        analysis.performance = await this.analyzeBundlePerformance(analysis);

        return analysis;
    }

    /**
     * 의존성 추출
     */
    private extractDependencies(content: string): DependencyInfo[] {
        const dependencies: DependencyInfo[] = [];

        // import 문 분석
        const importMatches = content.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
        if (importMatches) {
            for (const importMatch of importMatches) {
                const moduleMatch = importMatch.match(/from\s+['"]([^'"]+)['"]/);
                if (moduleMatch) {
                    dependencies.push({
                        name: moduleMatch[1],
                        type: 'es6',
                        size: 0, // 실제 구현에서는 모듈 크기 계산
                        used: true
                    });
                }
            }
        }

        // require 문 분석
        const requireMatches = content.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
        if (requireMatches) {
            for (const requireMatch of requireMatches) {
                const moduleMatch = requireMatch.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
                if (moduleMatch) {
                    dependencies.push({
                        name: moduleMatch[1],
                        type: 'commonjs',
                        size: 0,
                        used: true
                    });
                }
            }
        }

        return dependencies;
    }

    /**
     * 청크 분석
     */
    private analyzeChunks(file: CodeFile): ChunkInfo[] {
        const chunks: ChunkInfo[] = [];

        // 파일을 청크로 분할
        const lines = file.content.split('\n');
        const chunkSize = 100; // 100줄씩 청크 분할

        for (let i = 0; i < lines.length; i += chunkSize) {
            const chunkLines = lines.slice(i, i + chunkSize);
            const chunkContent = chunkLines.join('\n');

            chunks.push({
                id: `${file.name}_chunk_${Math.floor(i / chunkSize)}`,
                size: chunkContent.length,
                lines: chunkLines.length,
                dependencies: this.extractDependencies(chunkContent),
                complexity: this.calculateChunkComplexity(chunkContent)
            });
        }

        return chunks;
    }

    /**
     * 청크 복잡도 계산
     */
    private calculateChunkComplexity(content: string): number {
        const functions = (content.match(/function|=>/g) || []).length;
        const conditions = (content.match(/if|else|switch|case/g) || []).length;
        const loops = (content.match(/for|while|do/g) || []).length;
        const lines = content.split('\n').length;

        return Math.min(10, Math.max(1, (lines / 50) + (functions / 10) + (conditions / 5) + (loops / 3)));
    }

    /**
     * 번들 이슈 감지
     */
    private detectBundleIssues(file: CodeFile): Issue[] {
        const issues: Issue[] = [];
        const content = file.content;

        // 큰 파일 감지
        if (file.size > 100000) { // 100KB 이상
            issues.push({
                id: this.generateId(),
                type: 'warning',
                severity: 'medium',
                message: `파일 ${file.name}이 너무 큽니다 (${file.size} bytes). 분할을 고려하세요.`,
                file: file.name,
                line: 0,
                column: 0,
                rule: 'large-file'
            });
        }

        // 중복 import 감지
        const imports = content.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
        if (imports) {
            const moduleNames = imports.map(imp => {
                const match = imp.match(/from\s+['"]([^'"]+)['"]/);
                return match ? match[1] : '';
            });

            const duplicates = moduleNames.filter((name, index) =>
                moduleNames.indexOf(name) !== index
            );

            if (duplicates.length > 0) {
                issues.push({
                    id: this.generateId(),
                    type: 'warning',
                    severity: 'low',
                    message: `중복된 import가 감지되었습니다: ${duplicates.join(', ')}`,
                    file: file.name,
                    line: 0,
                    column: 0,
                    rule: 'duplicate-import'
                });
            }
        }

        // 사용하지 않는 import 감지
        const unusedImports = this.detectUnusedImports(content);
        for (const unused of unusedImports) {
            issues.push({
                id: this.generateId(),
                type: 'warning',
                severity: 'low',
                message: `사용하지 않는 import: ${unused}`,
                file: file.name,
                line: 0,
                column: 0,
                rule: 'unused-import'
            });
        }

        return issues;
    }

    /**
     * 사용하지 않는 import 감지
     */
    private detectUnusedImports(content: string): string[] {
        const unused: string[] = [];
        const imports = content.match(/import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g);

        if (imports) {
            for (const importStatement of imports) {
                const match = importStatement.match(/import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/);
                if (match) {
                    const importedItems = match[1].split(',').map(item => item.trim());
                    const moduleName = match[2];

                    for (const item of importedItems) {
                        const cleanItem = item.replace(/\s+as\s+\w+/, '').trim();
                        if (!content.includes(cleanItem) && !content.includes(item)) {
                            unused.push(`${cleanItem} from ${moduleName}`);
                        }
                    }
                }
            }
        }

        return unused;
    }

    /**
     * 번들 최적화 기회 식별
     */
    private identifyBundleOpportunities(file: CodeFile): BundleOpportunity[] {
        const opportunities: BundleOpportunity[] = [];
        const content = file.content;

        // 동적 import 기회
        const staticImports = content.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
        if (staticImports && staticImports.length > 5) {
            opportunities.push({
                type: 'dynamic_import',
                description: '정적 import를 동적 import로 변경하여 번들 크기를 줄일 수 있습니다.',
                impact: 'high',
                effort: 'medium',
                example: 'import() 함수 사용'
            });
        }

        // 코드 분할 기회
        const functions = content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g);
        if (functions && functions.length > 10) {
            opportunities.push({
                type: 'code_splitting',
                description: '큰 함수들을 별도 모듈로 분할할 수 있습니다.',
                impact: 'medium',
                effort: 'low',
                example: '함수별 모듈 분리'
            });
        }

        // 트리 셰이킹 기회
        const libraryImports = content.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
        if (libraryImports) {
            const libraryNames = libraryImports.map(imp => {
                const match = imp.match(/from\s+['"]([^'"]+)['"]/);
                return match ? match[1] : '';
            }).filter(name => !name.startsWith('.'));

            if (libraryNames.length > 0) {
                opportunities.push({
                    type: 'tree_shaking',
                    description: '라이브러리에서 필요한 부분만 import하여 번들 크기를 줄일 수 있습니다.',
                    impact: 'high',
                    effort: 'low',
                    example: 'named import 사용'
                });
            }
        }

        return opportunities;
    }

    /**
     * 번들 성능 분석
     */
    private async analyzeBundlePerformance(analysis: BundleAnalysis): Promise<BundlePerformance> {
        // 실제 구현에서는 실제 번들 분석 도구 사용
        return {
            bundleSize: analysis.totalSize,
            loadTime: this.estimateLoadTime(analysis.totalSize),
            parseTime: this.estimateParseTime(analysis.totalSize),
            renderTime: this.estimateRenderTime(analysis.totalSize)
        };
    }

    /**
     * 로드 시간 추정
     */
    private estimateLoadTime(size: number): number {
        // 1MB당 1초로 추정
        return size / (1024 * 1024);
    }

    /**
     * 파싱 시간 추정
     */
    private estimateParseTime(size: number): number {
        // 1MB당 0.5초로 추정
        return size / (1024 * 1024) * 0.5;
    }

    /**
     * 렌더링 시간 추정
     */
    private estimateRenderTime(size: number): number {
        // 1MB당 0.3초로 추정
        return size / (1024 * 1024) * 0.3;
    }

    /**
     * 번들 전략 생성
     */
    private async generateBundleStrategies(analysis: BundleAnalysis): Promise<BundleStrategy[]> {
        const strategies: BundleStrategy[] = [];

        // 코드 분할 전략
        strategies.push({
            name: 'Code Splitting',
            description: '코드를 여러 청크로 분할하여 초기 로딩 시간을 단축',
            implementation: await this.generateCodeSplittingStrategy(),
            benefits: ['초기 로딩 시간 단축', '캐싱 효율성 향상', '메모리 사용량 감소'],
            drawbacks: ['복잡성 증가', '네트워크 요청 증가']
        });

        // 트리 셰이킹 전략
        strategies.push({
            name: 'Tree Shaking',
            description: '사용하지 않는 코드를 제거하여 번들 크기 최적화',
            implementation: await this.generateTreeShakingStrategy(),
            benefits: ['번들 크기 감소', '로딩 시간 단축', '메모리 사용량 감소'],
            drawbacks: ['빌드 시간 증가', '복잡한 설정 필요']
        });

        // 압축 전략
        strategies.push({
            name: 'Compression',
            description: '번들을 압축하여 전송 크기 최적화',
            implementation: await this.generateCompressionStrategy(),
            benefits: ['전송 크기 감소', '로딩 시간 단축', '대역폭 절약'],
            drawbacks: ['압축/해제 오버헤드', '서버 리소스 사용']
        });

        // 지연 로딩 전략
        strategies.push({
            name: 'Lazy Loading',
            description: '필요한 시점에 모듈을 로드하여 초기 번들 크기 감소',
            implementation: await this.generateLazyLoadingStrategy(),
            benefits: ['초기 번들 크기 감소', '메모리 사용량 감소', '사용자 경험 향상'],
            drawbacks: ['로딩 지연', '복잡성 증가']
        });

        return strategies;
    }

    /**
     * 코드 분할 최적화
     */
    private async optimizeCodeSplitting(analysis: BundleAnalysis): Promise<CodeSplittingOptimization> {
        const optimizations: CodeSplittingOptimization = {
            chunks: [],
            splitPoints: [],
            lazyRoutes: [],
            vendorChunks: []
        };

        // 청크 분할
        for (const chunk of analysis.chunks) {
            if (chunk.size > 50000) { // 50KB 이상
                optimizations.chunks.push({
                    name: chunk.id,
                    size: chunk.size,
                    splitReason: 'large_size',
                    dependencies: chunk.dependencies
                });
            }
        }

        // 분할 지점 식별
        optimizations.splitPoints = this.identifySplitPoints(analysis);

        // 지연 로딩 라우트
        optimizations.lazyRoutes = this.identifyLazyRoutes(analysis);

        // 벤더 청크 분리
        optimizations.vendorChunks = this.identifyVendorChunks(analysis);

        return optimizations;
    }

    /**
     * 트리 셰이킹 최적화
     */
    private async optimizeTreeShaking(analysis: BundleAnalysis): Promise<TreeShakingOptimization> {
        const optimizations: TreeShakingOptimization = {
            unusedExports: [],
            sideEffectModules: [],
            optimizationSuggestions: []
        };

        // 사용하지 않는 export 식별
        for (const file of analysis.dependencies) {
            if (file.type === 'es6' && !file.used) {
                optimizations.unusedExports.push({
                    module: file.name,
                    exports: [], // 실제 구현에서는 export 분석
                    reason: 'unused'
                });
            }
        }

        // 사이드 이펙트 모듈 식별
        optimizations.sideEffectModules = this.identifySideEffectModules(analysis);

        // 최적화 제안
        optimizations.optimizationSuggestions = this.generateTreeShakingSuggestions(analysis);

        return optimizations;
    }

    /**
     * 압축 최적화
     */
    private async optimizeCompression(analysis: BundleAnalysis): Promise<CompressionOptimization> {
        const optimizations: CompressionOptimization = {
            algorithms: [],
            settings: {},
            compressionRatio: 0
        };

        // 압축 알고리즘 추천
        optimizations.algorithms = [
            {
                name: 'gzip',
                compressionRatio: 0.7,
                cpuUsage: 'low',
                compatibility: 'high'
            },
            {
                name: 'brotli',
                compressionRatio: 0.6,
                cpuUsage: 'medium',
                compatibility: 'medium'
            },
            {
                name: 'deflate',
                compressionRatio: 0.75,
                cpuUsage: 'low',
                compatibility: 'high'
            }
        ];

        // 압축 설정
        optimizations.settings = {
            gzip: {
                level: 6,
                memLevel: 8,
                windowBits: 15
            },
            brotli: {
                level: 4,
                windowBits: 22,
                blockSize: 16
            }
        };

        // 압축 비율 계산
        optimizations.compressionRatio = this.calculateCompressionRatio(analysis);

        return optimizations;
    }

    /**
     * 번들 성능 측정
     */
    private async measureBundlePerformance(analysis: BundleAnalysis): Promise<BundlePerformanceMetrics> {
        return {
            bundleSize: analysis.totalSize,
            gzippedSize: analysis.totalSize * 0.7,
            loadTime: this.estimateLoadTime(analysis.totalSize),
            parseTime: this.estimateParseTime(analysis.totalSize),
            renderTime: this.estimateRenderTime(analysis.totalSize),
            firstContentfulPaint: this.estimateFCP(analysis.totalSize),
            largestContentfulPaint: this.estimateLCP(analysis.totalSize),
            cumulativeLayoutShift: this.estimateCLS(analysis.totalSize)
        };
    }

    /**
     * 번들 최적화 리포트 생성
     */
    private async generateBundleOptimizationReport(
        analysis: BundleAnalysis,
        strategies: BundleStrategy[],
        performanceMetrics: BundlePerformanceMetrics
    ): Promise<string> {
        const report = {
            summary: this.generateBundleOptimizationSummary(analysis, strategies, performanceMetrics),
            analysis,
            strategies,
            performanceMetrics,
            generatedAt: new Date().toISOString()
        };

        const reportPath = path.join(this.projectPath, 'bundle-optimization-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return reportPath;
    }

    /**
     * 번들 최적화 요약 생성
     */
    private generateBundleOptimizationSummary(
        analysis: BundleAnalysis,
        strategies: BundleStrategy[],
        performanceMetrics: BundlePerformanceMetrics
    ): BundleOptimizationSummary {
        return {
            totalSize: analysis.totalSize,
            fileCount: analysis.fileCount,
            performanceScore: this.calculatePerformanceScore(performanceMetrics),
            optimizationScore: this.calculateOptimizationScore(analysis),
            strategiesCount: strategies.length,
            issuesCount: analysis.issues.length,
            opportunitiesCount: analysis.opportunities.length,
            status: this.determineBundleOptimizationStatus(analysis, performanceMetrics)
        };
    }

    // 구현 생성 메서드들
    private async generateCodeSplittingStrategy(): Promise<string> {
        return `// Webpack 설정 예시
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true
        }
      }
    }
  }
};

// 동적 import 예시
const loadModule = async () => {
  const module = await import('./heavy-module');
  return module.default;
};`;
    }

    private async generateTreeShakingStrategy(): Promise<string> {
        return `// Webpack 설정 예시
module.exports = {
  mode: 'production',
  optimization: {
    usedExports: true,
    sideEffects: false
  }
};

// package.json 설정
{
  "sideEffects": false
}

// ES6 모듈 사용 예시
import { specificFunction } from 'large-library';
// 전체 라이브러리 import 대신 필요한 함수만 import`;
    }

    private async generateCompressionStrategy(): Promise<string> {
        return `// Webpack 압축 설정
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  plugins: [
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8
    })
  ]
};

// Express.js 압축 미들웨어
const compression = require('compression');
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));`;
    }

    private async generateLazyLoadingStrategy(): Promise<string> {
        return `// React 지연 로딩 예시
import { lazy, Suspense } from 'react';

const LazyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}

// Vue.js 지연 로딩 예시
const routes = [
  {
    path: '/heavy',
    component: () => import('./HeavyComponent.vue')
  }
];

// 일반 JavaScript 지연 로딩
const loadHeavyModule = () => {
  return import('./heavy-module').then(module => {
    return module.default;
  });
};`;
    }

    // 헬퍼 메서드들
    private identifySplitPoints(analysis: BundleAnalysis): SplitPoint[] {
        const splitPoints: SplitPoint[] = [];

        for (const chunk of analysis.chunks) {
            if (chunk.complexity > 7) {
                splitPoints.push({
                    file: chunk.id,
                    line: 0,
                    reason: 'high_complexity',
                    suggestion: '함수 분할 권장'
                });
            }
        }

        return splitPoints;
    }

    private identifyLazyRoutes(analysis: BundleAnalysis): LazyRoute[] {
        const lazyRoutes: LazyRoute[] = [];

        // 실제 구현에서는 라우트 분석
        lazyRoutes.push({
            path: '/dashboard',
            component: 'Dashboard',
            priority: 'high',
            estimatedSize: 50000
        });

        return lazyRoutes;
    }

    private identifyVendorChunks(analysis: BundleAnalysis): VendorChunk[] {
        const vendorChunks: VendorChunk[] = [];

        const vendorModules = analysis.dependencies.filter(dep =>
            !dep.name.startsWith('.') && !dep.name.startsWith('/')
        );

        for (const module of vendorModules) {
            vendorChunks.push({
                name: module.name,
                size: module.size,
                type: 'library',
                priority: 'medium'
            });
        }

        return vendorChunks;
    }

    private identifySideEffectModules(analysis: BundleAnalysis): SideEffectModule[] {
        const sideEffectModules: SideEffectModule[] = [];

        // 실제 구현에서는 사이드 이펙트 분석
        sideEffectModules.push({
            module: 'polyfill',
            hasSideEffects: true,
            reason: 'global_pollution'
        });

        return sideEffectModules;
    }

    private generateTreeShakingSuggestions(analysis: BundleAnalysis): string[] {
        const suggestions: string[] = [];

        if (analysis.dependencies.length > 10) {
            suggestions.push('라이브러리에서 필요한 부분만 import하세요.');
        }

        if (analysis.issues.some(issue => issue.rule === 'unused-import')) {
            suggestions.push('사용하지 않는 import를 제거하세요.');
        }

        return suggestions;
    }

    private calculateCompressionRatio(analysis: BundleAnalysis): number {
        // 실제 구현에서는 압축 테스트 수행
        return 0.7; // 70% 압축률 가정
    }

    private estimateFCP(size: number): number {
        return size / (1024 * 1024) * 0.5; // 1MB당 0.5초
    }

    private estimateLCP(size: number): number {
        return size / (1024 * 1024) * 0.8; // 1MB당 0.8초
    }

    private estimateCLS(size: number): number {
        return Math.min(0.1, size / (1024 * 1024) * 0.01); // 크기에 비례한 CLS
    }

    private calculatePerformanceScore(metrics: BundlePerformanceMetrics): number {
        const sizeScore = Math.max(0, 10 - (metrics.bundleSize / (1024 * 1024)) * 2);
        const loadTimeScore = Math.max(0, 10 - metrics.loadTime * 2);
        return (sizeScore + loadTimeScore) / 2;
    }

    private calculateOptimizationScore(analysis: BundleAnalysis): number {
        const issuesScore = Math.max(0, 10 - analysis.issues.length * 2);
        const opportunitiesScore = Math.min(10, analysis.opportunities.length * 2);
        return (issuesScore + opportunitiesScore) / 2;
    }

    private determineBundleOptimizationStatus(
        analysis: BundleAnalysis,
        metrics: BundlePerformanceMetrics
    ): 'excellent' | 'good' | 'fair' | 'poor' {
        const performanceScore = this.calculatePerformanceScore(metrics);
        const optimizationScore = this.calculateOptimizationScore(analysis);
        const avgScore = (performanceScore + optimizationScore) / 2;

        if (avgScore >= 8) return 'excellent';
        if (avgScore >= 6) return 'good';
        if (avgScore >= 4) return 'fair';
        return 'poor';
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

// 타입 정의
interface BundleAnalysis {
    totalSize: number;
    fileCount: number;
    dependencies: DependencyInfo[];
    chunks: ChunkInfo[];
    performance: BundlePerformance;
    issues: Issue[];
    opportunities: BundleOpportunity[];
}

interface DependencyInfo {
    name: string;
    type: 'es6' | 'commonjs' | 'amd' | 'umd';
    size: number;
    used: boolean;
}

interface ChunkInfo {
    id: string;
    size: number;
    lines: number;
    dependencies: DependencyInfo[];
    complexity: number;
}

interface BundlePerformance {
    bundleSize: number;
    loadTime: number;
    parseTime: number;
    renderTime: number;
}

interface BundleOpportunity {
    type: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
    example: string;
}

interface BundleStrategy {
    name: string;
    description: string;
    implementation: string;
    benefits: string[];
    drawbacks: string[];
}

interface CodeSplittingOptimization {
    chunks: ChunkSplit[];
    splitPoints: SplitPoint[];
    lazyRoutes: LazyRoute[];
    vendorChunks: VendorChunk[];
}

interface ChunkSplit {
    name: string;
    size: number;
    splitReason: string;
    dependencies: DependencyInfo[];
}

interface SplitPoint {
    file: string;
    line: number;
    reason: string;
    suggestion: string;
}

interface LazyRoute {
    path: string;
    component: string;
    priority: 'high' | 'medium' | 'low';
    estimatedSize: number;
}

interface VendorChunk {
    name: string;
    size: number;
    type: 'library' | 'framework' | 'utility';
    priority: 'high' | 'medium' | 'low';
}

interface TreeShakingOptimization {
    unusedExports: UnusedExport[];
    sideEffectModules: SideEffectModule[];
    optimizationSuggestions: string[];
}

interface UnusedExport {
    module: string;
    exports: string[];
    reason: string;
}

interface SideEffectModule {
    module: string;
    hasSideEffects: boolean;
    reason: string;
}

interface CompressionOptimization {
    algorithms: CompressionAlgorithm[];
    settings: Record<string, any>;
    compressionRatio: number;
}

interface CompressionAlgorithm {
    name: string;
    compressionRatio: number;
    cpuUsage: 'low' | 'medium' | 'high';
    compatibility: 'high' | 'medium' | 'low';
}

interface BundlePerformanceMetrics {
    bundleSize: number;
    gzippedSize: number;
    loadTime: number;
    parseTime: number;
    renderTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
}

interface BundleOptimizationResult {
    analysis: BundleAnalysis;
    strategies: BundleStrategy[];
    codeSplitting: CodeSplittingOptimization;
    treeShaking: TreeShakingOptimization;
    compression: CompressionOptimization;
    performanceMetrics: BundlePerformanceMetrics;
    report: string;
    summary: BundleOptimizationSummary;
}

interface BundleOptimizationSummary {
    totalSize: number;
    fileCount: number;
    performanceScore: number;
    optimizationScore: number;
    strategiesCount: number;
    issuesCount: number;
    opportunitiesCount: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
}
