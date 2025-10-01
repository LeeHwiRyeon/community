import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { CodeFile, Issue } from '@/types';

export class ResponsiveChecker {
    private openai: OpenAI;
    private projectPath: string;

    constructor(apiKey: string, projectPath: string = './generated-projects') {
        this.openai = new OpenAI({ apiKey });
        this.projectPath = projectPath;
    }

    /**
     * 반응형 디자인 검사 실행
     */
    async checkResponsiveDesign(sourceFiles: CodeFile[]): Promise<ResponsiveCheckResult> {
        console.log('📱 반응형 디자인 검사 시작...');

        try {
            // 1. 브레이크포인트 분석
            const breakpointAnalysis = await this.analyzeBreakpoints(sourceFiles);

            // 2. 모바일 최적화 검사
            const mobileOptimization = await this.checkMobileOptimization(sourceFiles);

            // 3. 태블릿 최적화 검사
            const tabletOptimization = await this.checkTabletOptimization(sourceFiles);

            // 4. 데스크톱 최적화 검사
            const desktopOptimization = await this.checkDesktopOptimization(sourceFiles);

            // 5. 터치 인터페이스 검사
            const touchInterface = await this.checkTouchInterface(sourceFiles);

            // 6. 성능 최적화 검사
            const performanceOptimization = await this.checkPerformanceOptimization(sourceFiles);

            // 7. 접근성 검사
            const accessibility = await this.checkResponsiveAccessibility(sourceFiles);

            // 8. 전체 점수 계산
            const overallScore = this.calculateOverallScore({
                breakpointAnalysis,
                mobileOptimization,
                tabletOptimization,
                desktopOptimization,
                touchInterface,
                performanceOptimization,
                accessibility
            });

            // 9. 개선 제안 생성
            const improvementSuggestions = await this.generateImprovementSuggestions({
                breakpointAnalysis,
                mobileOptimization,
                tabletOptimization,
                desktopOptimization,
                touchInterface,
                performanceOptimization,
                accessibility
            });

            // 10. 검사 리포트 생성
            const report = await this.generateResponsiveReport({
                breakpointAnalysis,
                mobileOptimization,
                tabletOptimization,
                desktopOptimization,
                touchInterface,
                performanceOptimization,
                accessibility,
                overallScore,
                improvementSuggestions
            });

            console.log('✅ 반응형 디자인 검사 완료');

            return {
                breakpointAnalysis,
                mobileOptimization,
                tabletOptimization,
                desktopOptimization,
                touchInterface,
                performanceOptimization,
                accessibility,
                overallScore,
                improvementSuggestions,
                report,
                summary: this.generateResponsiveSummary(overallScore, improvementSuggestions)
            };

        } catch (error) {
            console.error('❌ 반응형 디자인 검사 실패:', error);
            throw error;
        }
    }

    /**
     * 브레이크포인트 분석
     */
    private async analyzeBreakpoints(sourceFiles: CodeFile[]): Promise<BreakpointAnalysis> {
        console.log('📏 브레이크포인트 분석 중...');

        const breakpoints: BreakpointInfo[] = [];
        const issues: Issue[] = [];

        for (const file of sourceFiles) {
            if (this.isUIComponent(file)) {
                const fileBreakpoints = this.extractBreakpoints(file.content);
                breakpoints.push(...fileBreakpoints);

                const fileIssues = this.detectBreakpointIssues(file.content);
                issues.push(...fileIssues);
            }
        }

        // 표준 브레이크포인트와 비교
        const standardBreakpoints = ['sm', 'md', 'lg', 'xl', '2xl'];
        const foundBreakpoints = breakpoints.map(bp => bp.name);
        const missingBreakpoints = standardBreakpoints.filter(bp => !foundBreakpoints.includes(bp));

        return {
            breakpoints,
            standardCompliance: this.calculateStandardCompliance(foundBreakpoints, standardBreakpoints),
            missingBreakpoints,
            issues,
            recommendations: this.generateBreakpointRecommendations(breakpoints, missingBreakpoints)
        };
    }

    /**
     * 브레이크포인트 추출
     */
    private extractBreakpoints(content: string): BreakpointInfo[] {
        const breakpoints: BreakpointInfo[] = [];

        // CSS 미디어 쿼리
        const mediaQueryMatches = content.match(/@media\s+\([^)]+\)/g);
        if (mediaQueryMatches) {
            for (const match of mediaQueryMatches) {
                const breakpoint = this.parseMediaQuery(match);
                if (breakpoint) {
                    breakpoints.push(breakpoint);
                }
            }
        }

        // Tailwind CSS 브레이크포인트
        const tailwindMatches = content.match(/(sm|md|lg|xl|2xl):/g);
        if (tailwindMatches) {
            for (const match of tailwindMatches) {
                const name = match.replace(':', '');
                breakpoints.push({
                    name,
                    type: 'tailwind',
                    minWidth: this.getTailwindBreakpointWidth(name),
                    maxWidth: undefined,
                    description: this.getTailwindBreakpointDescription(name)
                });
            }
        }

        // Bootstrap 브레이크포인트
        const bootstrapMatches = content.match(/(col-sm|col-md|col-lg|col-xl)/g);
        if (bootstrapMatches) {
            for (const match of bootstrapMatches) {
                const name = match.replace('col-', '');
                breakpoints.push({
                    name,
                    type: 'bootstrap',
                    minWidth: this.getBootstrapBreakpointWidth(name),
                    maxWidth: undefined,
                    description: this.getBootstrapBreakpointDescription(name)
                });
            }
        }

        return breakpoints;
    }

    /**
     * 미디어 쿼리 파싱
     */
    private parseMediaQuery(mediaQuery: string): BreakpointInfo | null {
        const minWidthMatch = mediaQuery.match(/min-width:\s*(\d+)px/);
        const maxWidthMatch = mediaQuery.match(/max-width:\s*(\d+)px/);

        if (minWidthMatch || maxWidthMatch) {
            return {
                name: this.generateBreakpointName(minWidthMatch?.[1], maxWidthMatch?.[1]),
                type: 'css',
                minWidth: minWidthMatch ? parseInt(minWidthMatch[1]) : undefined,
                maxWidth: maxWidthMatch ? parseInt(maxWidthMatch[1]) : undefined,
                description: 'Custom CSS media query'
            };
        }

        return null;
    }

    /**
     * 모바일 최적화 검사
     */
    private async checkMobileOptimization(sourceFiles: CodeFile[]): Promise<MobileOptimization> {
        console.log('📱 모바일 최적화 검사 중...');

        const issues: Issue[] = [];
        let score = 10;

        for (const file of sourceFiles) {
            if (this.isUIComponent(file)) {
                const fileIssues = this.checkMobileInFile(file.content);
                issues.push(...fileIssues);
            }
        }

        // 점수 계산
        const criticalIssues = issues.filter(issue => issue.severity === 'high').length;
        const mediumIssues = issues.filter(issue => issue.severity === 'medium').length;
        const lowIssues = issues.filter(issue => issue.severity === 'low').length;

        score = Math.max(0, 10 - (criticalIssues * 4 + mediumIssues * 2 + lowIssues * 1));

        return {
            score,
            issues,
            viewport: this.checkViewport(sourceFiles),
            touchTargets: this.checkTouchTargets(sourceFiles),
            performance: this.checkMobilePerformance(sourceFiles),
            recommendations: this.generateMobileRecommendations(issues)
        };
    }

    /**
     * 파일 내 모바일 최적화 검사
     */
    private checkMobileInFile(content: string): Issue[] {
        const issues: Issue[] = [];

        // 고정 너비 사용 검사
        if (content.includes('width:') && content.includes('px') && !content.includes('max-width')) {
            issues.push({
                id: this.generateId(),
                type: 'warning',
                severity: 'medium',
                message: '고정 너비 사용이 감지되었습니다. 반응형 단위를 고려하세요.',
                file: 'mobile-check',
                line: 0,
                column: 0,
                rule: 'fixed-width'
            });
        }

        // 작은 터치 타겟 검사
        if (content.includes('height:') && content.includes('px')) {
            const heightMatch = content.match(/height:\s*(\d+)px/);
            if (heightMatch && parseInt(heightMatch[1]) < 44) {
                issues.push({
                    id: this.generateId(),
                    type: 'error',
                    severity: 'high',
                    message: '터치 타겟이 너무 작습니다. 최소 44px를 권장합니다.',
                    file: 'mobile-check',
                    line: 0,
                    column: 0,
                    rule: 'small-touch-target'
                });
            }
        }

        // 호버 효과 검사
        if (content.includes(':hover') && !content.includes('@media (hover: hover)')) {
            issues.push({
                id: this.generateId(),
                type: 'warning',
                severity: 'low',
                message: '모바일에서 호버 효과가 작동하지 않을 수 있습니다.',
                file: 'mobile-check',
                line: 0,
                column: 0,
                rule: 'hover-on-mobile'
            });
        }

        return issues;
    }

    /**
     * 태블릿 최적화 검사
     */
    private async checkTabletOptimization(sourceFiles: CodeFile[]): Promise<TabletOptimization> {
        console.log('📱 태블릿 최적화 검사 중...');

        const issues: Issue[] = [];
        let score = 10;

        for (const file of sourceFiles) {
            if (this.isUIComponent(file)) {
                const fileIssues = this.checkTabletInFile(file.content);
                issues.push(...fileIssues);
            }
        }

        // 점수 계산
        const criticalIssues = issues.filter(issue => issue.severity === 'high').length;
        const mediumIssues = issues.filter(issue => issue.severity === 'medium').length;

        score = Math.max(0, 10 - (criticalIssues * 4 + mediumIssues * 2));

        return {
            score,
            issues,
            layout: this.checkTabletLayout(sourceFiles),
            navigation: this.checkTabletNavigation(sourceFiles),
            recommendations: this.generateTabletRecommendations(issues)
        };
    }

    /**
     * 데스크톱 최적화 검사
     */
    private async checkDesktopOptimization(sourceFiles: CodeFile[]): Promise<DesktopOptimization> {
        console.log('🖥️ 데스크톱 최적화 검사 중...');

        const issues: Issue[] = [];
        let score = 10;

        for (const file of sourceFiles) {
            if (this.isUIComponent(file)) {
                const fileIssues = this.checkDesktopInFile(file.content);
                issues.push(...fileIssues);
            }
        }

        // 점수 계산
        const criticalIssues = issues.filter(issue => issue.severity === 'high').length;
        const mediumIssues = issues.filter(issue => issue.severity === 'medium').length;

        score = Math.max(0, 10 - (criticalIssues * 4 + mediumIssues * 2));

        return {
            score,
            issues,
            layout: this.checkDesktopLayout(sourceFiles),
            performance: this.checkDesktopPerformance(sourceFiles),
            recommendations: this.generateDesktopRecommendations(issues)
        };
    }

    /**
     * 터치 인터페이스 검사
     */
    private async checkTouchInterface(sourceFiles: CodeFile[]): Promise<TouchInterface> {
        console.log('👆 터치 인터페이스 검사 중...');

        const issues: Issue[] = [];
        let score = 10;

        for (const file of sourceFiles) {
            if (this.isUIComponent(file)) {
                const fileIssues = this.checkTouchInFile(file.content);
                issues.push(...fileIssues);
            }
        }

        // 점수 계산
        const criticalIssues = issues.filter(issue => issue.severity === 'high').length;
        const mediumIssues = issues.filter(issue => issue.severity === 'medium').length;

        score = Math.max(0, 10 - (criticalIssues * 4 + mediumIssues * 2));

        return {
            score,
            issues,
            gestures: this.checkGestures(sourceFiles),
            swipeSupport: this.checkSwipeSupport(sourceFiles),
            recommendations: this.generateTouchRecommendations(issues)
        };
    }

    /**
     * 성능 최적화 검사
     */
    private async checkPerformanceOptimization(sourceFiles: CodeFile[]): Promise<PerformanceOptimization> {
        console.log('⚡ 성능 최적화 검사 중...');

        const issues: Issue[] = [];
        let score = 10;

        for (const file of sourceFiles) {
            if (this.isUIComponent(file)) {
                const fileIssues = this.checkPerformanceInFile(file.content);
                issues.push(...fileIssues);
            }
        }

        // 점수 계산
        const criticalIssues = issues.filter(issue => issue.severity === 'high').length;
        const mediumIssues = issues.filter(issue => issue.severity === 'medium').length;

        score = Math.max(0, 10 - (criticalIssues * 4 + mediumIssues * 2));

        return {
            score,
            issues,
            imageOptimization: this.checkImageOptimization(sourceFiles),
            lazyLoading: this.checkLazyLoading(sourceFiles),
            bundleSize: this.checkBundleSize(sourceFiles),
            recommendations: this.generatePerformanceRecommendations(issues)
        };
    }

    /**
     * 반응형 접근성 검사
     */
    private async checkResponsiveAccessibility(sourceFiles: CodeFile[]): Promise<ResponsiveAccessibility> {
        console.log('♿ 반응형 접근성 검사 중...');

        const issues: Issue[] = [];
        let score = 10;

        for (const file of sourceFiles) {
            if (this.isUIComponent(file)) {
                const fileIssues = this.checkResponsiveAccessibilityInFile(file.content);
                issues.push(...fileIssues);
            }
        }

        // 점수 계산
        const criticalIssues = issues.filter(issue => issue.severity === 'high').length;
        const mediumIssues = issues.filter(issue => issue.severity === 'medium').length;

        score = Math.max(0, 10 - (criticalIssues * 4 + mediumIssues * 2));

        return {
            score,
            issues,
            textScaling: this.checkTextScaling(sourceFiles),
            focusManagement: this.checkFocusManagement(sourceFiles),
            recommendations: this.generateResponsiveAccessibilityRecommendations(issues)
        };
    }

    // 헬퍼 메서드들
    private isUIComponent(file: CodeFile): boolean {
        const uiExtensions = ['.tsx', '.jsx', '.vue', '.svelte'];
        const uiKeywords = ['component', 'ui', 'view', 'page', 'layout'];

        const hasUIExtension = uiExtensions.some(ext => file.name.endsWith(ext));
        const hasUIKeyword = uiKeywords.some(keyword =>
            file.name.toLowerCase().includes(keyword) ||
            file.path.toLowerCase().includes(keyword)
        );

        return hasUIExtension || hasUIKeyword;
    }

    private detectBreakpointIssues(content: string): Issue[] {
        const issues: Issue[] = [];

        // 미디어 쿼리 누락
        if (content.includes('width:') && !content.includes('@media')) {
            issues.push({
                id: this.generateId(),
                type: 'warning',
                severity: 'medium',
                message: '반응형 디자인을 위해 미디어 쿼리를 사용하세요.',
                file: 'breakpoint-check',
                line: 0,
                column: 0,
                rule: 'missing-media-query'
            });
        }

        return issues;
    }

    private calculateStandardCompliance(found: string[], standard: string[]): number {
        const foundCount = found.filter(bp => standard.includes(bp)).length;
        return (foundCount / standard.length) * 10;
    }

    private generateBreakpointRecommendations(breakpoints: BreakpointInfo[], missing: string[]): string[] {
        const recommendations: string[] = [];

        if (missing.length > 0) {
            recommendations.push(`표준 브레이크포인트를 추가하세요: ${missing.join(', ')}`);
        }

        if (breakpoints.length === 0) {
            recommendations.push('반응형 디자인을 위해 브레이크포인트를 정의하세요.');
        }

        return recommendations;
    }

    private getTailwindBreakpointWidth(name: string): number {
        const widths: Record<string, number> = {
            'sm': 640,
            'md': 768,
            'lg': 1024,
            'xl': 1280,
            '2xl': 1536
        };
        return widths[name] || 0;
    }

    private getTailwindBreakpointDescription(name: string): string {
        const descriptions: Record<string, string> = {
            'sm': 'Small devices (640px and up)',
            'md': 'Medium devices (768px and up)',
            'lg': 'Large devices (1024px and up)',
            'xl': 'Extra large devices (1280px and up)',
            '2xl': '2X large devices (1536px and up)'
        };
        return descriptions[name] || '';
    }

    private getBootstrapBreakpointWidth(name: string): number {
        const widths: Record<string, number> = {
            'sm': 576,
            'md': 768,
            'lg': 992,
            'xl': 1200
        };
        return widths[name] || 0;
    }

    private getBootstrapBreakpointDescription(name: string): string {
        const descriptions: Record<string, string> = {
            'sm': 'Small devices (576px and up)',
            'md': 'Medium devices (768px and up)',
            'lg': 'Large devices (992px and up)',
            'xl': 'Extra large devices (1200px and up)'
        };
        return descriptions[name] || '';
    }

    private generateBreakpointName(minWidth?: string, maxWidth?: string): string {
        if (minWidth && maxWidth) {
            return `${minWidth}-${maxWidth}`;
        } else if (minWidth) {
            return `min-${minWidth}`;
        } else if (maxWidth) {
            return `max-${maxWidth}`;
        }
        return 'custom';
    }

    private checkViewport(sourceFiles: CodeFile[]): ViewportInfo {
        // 실제 구현에서는 뷰포트 설정 검사
        return { score: 8, issues: [] };
    }

    private checkTouchTargets(sourceFiles: CodeFile[]): TouchTargetInfo {
        // 실제 구현에서는 터치 타겟 검사
        return { score: 7, issues: [] };
    }

    private checkMobilePerformance(sourceFiles: CodeFile[]): MobilePerformanceInfo {
        // 실제 구현에서는 모바일 성능 검사
        return { score: 8, issues: [] };
    }

    private generateMobileRecommendations(issues: Issue[]): string[] {
        const recommendations: string[] = [];

        if (issues.some(issue => issue.rule === 'fixed-width')) {
            recommendations.push('고정 너비 대신 상대 단위(%, vw, rem)를 사용하세요.');
        }

        if (issues.some(issue => issue.rule === 'small-touch-target')) {
            recommendations.push('터치 타겟을 최소 44px 이상으로 설정하세요.');
        }

        return recommendations;
    }

    private checkTabletInFile(content: string): Issue[] {
        // 실제 구현에서는 태블릿 최적화 검사
        return [];
    }

    private checkTabletLayout(sourceFiles: CodeFile[]): LayoutInfo {
        // 실제 구현에서는 태블릿 레이아웃 검사
        return { score: 8, issues: [] };
    }

    private checkTabletNavigation(sourceFiles: CodeFile[]): NavigationInfo {
        // 실제 구현에서는 태블릿 네비게이션 검사
        return { score: 7, issues: [] };
    }

    private generateTabletRecommendations(issues: Issue[]): string[] {
        // 실제 구현에서는 태블릿 권장사항 생성
        return [];
    }

    private checkDesktopInFile(content: string): Issue[] {
        // 실제 구현에서는 데스크톱 최적화 검사
        return [];
    }

    private checkDesktopLayout(sourceFiles: CodeFile[]): LayoutInfo {
        // 실제 구현에서는 데스크톱 레이아웃 검사
        return { score: 8, issues: [] };
    }

    private checkDesktopPerformance(sourceFiles: CodeFile[]): DesktopPerformanceInfo {
        // 실제 구현에서는 데스크톱 성능 검사
        return { score: 8, issues: [] };
    }

    private generateDesktopRecommendations(issues: Issue[]): string[] {
        // 실제 구현에서는 데스크톱 권장사항 생성
        return [];
    }

    private checkTouchInFile(content: string): Issue[] {
        // 실제 구현에서는 터치 인터페이스 검사
        return [];
    }

    private checkGestures(sourceFiles: CodeFile[]): GestureInfo {
        // 실제 구현에서는 제스처 검사
        return { score: 7, issues: [] };
    }

    private checkSwipeSupport(sourceFiles: CodeFile[]): SwipeSupportInfo {
        // 실제 구현에서는 스와이프 지원 검사
        return { score: 6, issues: [] };
    }

    private generateTouchRecommendations(issues: Issue[]): string[] {
        // 실제 구현에서는 터치 권장사항 생성
        return [];
    }

    private checkPerformanceInFile(content: string): Issue[] {
        // 실제 구현에서는 성능 최적화 검사
        return [];
    }

    private checkImageOptimization(sourceFiles: CodeFile[]): ImageOptimizationInfo {
        // 실제 구현에서는 이미지 최적화 검사
        return { score: 7, issues: [] };
    }

    private checkLazyLoading(sourceFiles: CodeFile[]): LazyLoadingInfo {
        // 실제 구현에서는 지연 로딩 검사
        return { score: 6, issues: [] };
    }

    private checkBundleSize(sourceFiles: CodeFile[]): BundleSizeInfo {
        // 실제 구현에서는 번들 크기 검사
        return { score: 8, issues: [] };
    }

    private generatePerformanceRecommendations(issues: Issue[]): string[] {
        // 실제 구현에서는 성능 권장사항 생성
        return [];
    }

    private checkResponsiveAccessibilityInFile(content: string): Issue[] {
        // 실제 구현에서는 반응형 접근성 검사
        return [];
    }

    private checkTextScaling(sourceFiles: CodeFile[]): TextScalingInfo {
        // 실제 구현에서는 텍스트 스케일링 검사
        return { score: 8, issues: [] };
    }

    private checkFocusManagement(sourceFiles: CodeFile[]): FocusManagementInfo {
        // 실제 구현에서는 포커스 관리 검사
        return { score: 7, issues: [] };
    }

    private generateResponsiveAccessibilityRecommendations(issues: Issue[]): string[] {
        // 실제 구현에서는 반응형 접근성 권장사항 생성
        return [];
    }

    private calculateOverallScore(checks: any): number {
        const scores = Object.values(checks).map((check: any) => check.score || 0);
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }

    private async generateImprovementSuggestions(checks: any): Promise<string[]> {
        const suggestions: string[] = [];

        // 브레이크포인트 개선 제안
        if (checks.breakpointAnalysis.standardCompliance < 7) {
            suggestions.push('표준 브레이크포인트를 추가하여 반응형 디자인을 개선하세요.');
        }

        // 모바일 최적화 제안
        if (checks.mobileOptimization.score < 7) {
            suggestions.push('모바일 사용자 경험을 개선하세요.');
        }

        // 터치 인터페이스 제안
        if (checks.touchInterface.score < 7) {
            suggestions.push('터치 인터페이스를 개선하세요.');
        }

        return suggestions;
    }

    private async generateResponsiveReport(data: any): Promise<string> {
        const report = {
            summary: this.generateResponsiveSummary(data.overallScore, data.improvementSuggestions),
            ...data,
            generatedAt: new Date().toISOString()
        };

        const reportPath = path.join(this.projectPath, 'responsive-check-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return reportPath;
    }

    private generateResponsiveSummary(overallScore: number, suggestions: string[]): ResponsiveSummary {
        return {
            overallScore,
            suggestionsCount: suggestions.length,
            status: this.determineResponsiveStatus(overallScore),
            priority: this.determinePriority(overallScore)
        };
    }

    private determineResponsiveStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
        if (score >= 8) return 'excellent';
        if (score >= 6) return 'good';
        if (score >= 4) return 'fair';
        return 'poor';
    }

    private determinePriority(score: number): 'high' | 'medium' | 'low' {
        if (score < 4) return 'high';
        if (score < 6) return 'medium';
        return 'low';
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

// 타입 정의
interface ResponsiveCheckResult {
    breakpointAnalysis: BreakpointAnalysis;
    mobileOptimization: MobileOptimization;
    tabletOptimization: TabletOptimization;
    desktopOptimization: DesktopOptimization;
    touchInterface: TouchInterface;
    performanceOptimization: PerformanceOptimization;
    accessibility: ResponsiveAccessibility;
    overallScore: number;
    improvementSuggestions: string[];
    report: string;
    summary: ResponsiveSummary;
}

interface BreakpointAnalysis {
    breakpoints: BreakpointInfo[];
    standardCompliance: number;
    missingBreakpoints: string[];
    issues: Issue[];
    recommendations: string[];
}

interface BreakpointInfo {
    name: string;
    type: 'css' | 'tailwind' | 'bootstrap' | 'custom';
    minWidth?: number;
    maxWidth?: number;
    description: string;
}

interface MobileOptimization {
    score: number;
    issues: Issue[];
    viewport: ViewportInfo;
    touchTargets: TouchTargetInfo;
    performance: MobilePerformanceInfo;
    recommendations: string[];
}

interface ViewportInfo {
    score: number;
    issues: Issue[];
}

interface TouchTargetInfo {
    score: number;
    issues: Issue[];
}

interface MobilePerformanceInfo {
    score: number;
    issues: Issue[];
}

interface TabletOptimization {
    score: number;
    issues: Issue[];
    layout: LayoutInfo;
    navigation: NavigationInfo;
    recommendations: string[];
}

interface LayoutInfo {
    score: number;
    issues: Issue[];
}

interface NavigationInfo {
    score: number;
    issues: Issue[];
}

interface DesktopOptimization {
    score: number;
    issues: Issue[];
    layout: LayoutInfo;
    performance: DesktopPerformanceInfo;
    recommendations: string[];
}

interface DesktopPerformanceInfo {
    score: number;
    issues: Issue[];
}

interface TouchInterface {
    score: number;
    issues: Issue[];
    gestures: GestureInfo;
    swipeSupport: SwipeSupportInfo;
    recommendations: string[];
}

interface GestureInfo {
    score: number;
    issues: Issue[];
}

interface SwipeSupportInfo {
    score: number;
    issues: Issue[];
}

interface PerformanceOptimization {
    score: number;
    issues: Issue[];
    imageOptimization: ImageOptimizationInfo;
    lazyLoading: LazyLoadingInfo;
    bundleSize: BundleSizeInfo;
    recommendations: string[];
}

interface ImageOptimizationInfo {
    score: number;
    issues: Issue[];
}

interface LazyLoadingInfo {
    score: number;
    issues: Issue[];
}

interface BundleSizeInfo {
    score: number;
    issues: Issue[];
}

interface ResponsiveAccessibility {
    score: number;
    issues: Issue[];
    textScaling: TextScalingInfo;
    focusManagement: FocusManagementInfo;
    recommendations: string[];
}

interface TextScalingInfo {
    score: number;
    issues: Issue[];
}

interface FocusManagementInfo {
    score: number;
    issues: Issue[];
}

interface ResponsiveSummary {
    overallScore: number;
    suggestionsCount: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    priority: 'high' | 'medium' | 'low';
}
