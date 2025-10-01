import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { CodeFile, UXInsight, Issue } from '@/types';

export class BehaviorAnalyzer {
    private openai: OpenAI;
    private projectPath: string;

    constructor(apiKey: string, projectPath: string = './generated-projects') {
        this.openai = new OpenAI({ apiKey });
        this.projectPath = projectPath;
    }

    /**
     * 사용자 행동 분석 실행
     */
    async analyzeUserBehavior(
        sourceFiles: CodeFile[],
        userData?: any
    ): Promise<BehaviorAnalysisResult> {
        console.log('👥 사용자 행동 분석 시작...');

        try {
            // 1. UI 컴포넌트 분석
            const uiAnalysis = await this.analyzeUIComponents(sourceFiles);

            // 2. 사용자 플로우 분석
            const flowAnalysis = await this.analyzeUserFlows(sourceFiles);

            // 3. 상호작용 패턴 분석
            const interactionAnalysis = await this.analyzeInteractionPatterns(sourceFiles);

            // 4. 사용성 이슈 감지
            const usabilityIssues = await this.detectUsabilityIssues(sourceFiles);

            // 5. 접근성 분석
            const accessibilityAnalysis = await this.analyzeAccessibility(sourceFiles);

            // 6. 반응형 디자인 분석
            const responsiveAnalysis = await this.analyzeResponsiveDesign(sourceFiles);

            // 7. 성능 영향 분석
            const performanceImpact = await this.analyzePerformanceImpact(sourceFiles);

            // 8. 개선 제안 생성
            const improvementSuggestions = await this.generateImprovementSuggestions(
                uiAnalysis,
                flowAnalysis,
                interactionAnalysis,
                usabilityIssues,
                accessibilityAnalysis,
                responsiveAnalysis
            );

            // 9. 분석 리포트 생성
            const report = await this.generateBehaviorAnalysisReport(
                uiAnalysis,
                flowAnalysis,
                interactionAnalysis,
                usabilityIssues,
                accessibilityAnalysis,
                responsiveAnalysis,
                performanceImpact,
                improvementSuggestions
            );

            console.log('✅ 사용자 행동 분석 완료');

            return {
                uiAnalysis,
                flowAnalysis,
                interactionAnalysis,
                usabilityIssues,
                accessibilityAnalysis,
                responsiveAnalysis,
                performanceImpact,
                improvementSuggestions,
                report,
                summary: this.generateBehaviorAnalysisSummary(
                    uiAnalysis,
                    flowAnalysis,
                    usabilityIssues,
                    improvementSuggestions
                )
            };

        } catch (error) {
            console.error('❌ 사용자 행동 분석 실패:', error);
            throw error;
        }
    }

    /**
     * UI 컴포넌트 분석
     */
    private async analyzeUIComponents(sourceFiles: CodeFile[]): Promise<UIAnalysis> {
        console.log('🎨 UI 컴포넌트 분석 중...');

        const analysis: UIAnalysis = {
            components: [],
            patterns: [],
            consistency: {
                score: 0,
                issues: []
            },
            reusability: {
                score: 0,
                issues: []
            },
            maintainability: {
                score: 0,
                issues: []
            }
        };

        for (const file of sourceFiles) {
            if (this.isUIComponent(file)) {
                const componentAnalysis = await this.analyzeComponent(file);
                analysis.components.push(componentAnalysis);
            }
        }

        // 일관성 분석
        analysis.consistency = await this.analyzeConsistency(analysis.components);

        // 재사용성 분석
        analysis.reusability = await this.analyzeReusability(analysis.components);

        // 유지보수성 분석
        analysis.maintainability = await this.analyzeMaintainability(analysis.components);

        return analysis;
    }

    /**
     * UI 컴포넌트인지 확인
     */
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

    /**
     * 개별 컴포넌트 분석
     */
    private async analyzeComponent(file: CodeFile): Promise<ComponentAnalysis> {
        const content = file.content;

        return {
            name: file.name,
            path: file.path,
            type: this.detectComponentType(content),
            complexity: this.calculateComponentComplexity(content),
            props: this.extractProps(content),
            state: this.extractState(content),
            events: this.extractEvents(content),
            styles: this.extractStyles(content),
            accessibility: this.analyzeComponentAccessibility(content),
            responsiveness: this.analyzeComponentResponsiveness(content),
            performance: this.analyzeComponentPerformance(content),
            issues: this.detectComponentIssues(content)
        };
    }

    /**
     * 컴포넌트 타입 감지
     */
    private detectComponentType(content: string): string {
        if (content.includes('class ') && content.includes('Component')) return 'class';
        if (content.includes('function ') && content.includes('(')) return 'function';
        if (content.includes('const ') && content.includes('=>')) return 'arrow';
        if (content.includes('<template>')) return 'vue';
        if (content.includes('<script>')) return 'svelte';
        return 'unknown';
    }

    /**
     * 컴포넌트 복잡도 계산
     */
    private calculateComponentComplexity(content: string): number {
        const lines = content.split('\n').length;
        const functions = (content.match(/function|=>/g) || []).length;
        const conditions = (content.match(/if|else|switch|case/g) || []).length;
        const loops = (content.match(/for|while|do/g) || []).length;
        const jsxElements = (content.match(/<[A-Z]\w*/g) || []).length;

        return Math.min(10, Math.max(1,
            (lines / 100) +
            (functions / 10) +
            (conditions / 5) +
            (loops / 3) +
            (jsxElements / 20)
        ));
    }

    /**
     * Props 추출
     */
    private extractProps(content: string): PropInfo[] {
        const props: PropInfo[] = [];

        // TypeScript interface props
        const interfaceMatches = content.match(/interface\s+\w*Props\s*{([^}]+)}/g);
        if (interfaceMatches) {
            for (const match of interfaceMatches) {
                const propMatches = match.match(/(\w+)\s*:\s*([^;]+)/g);
                if (propMatches) {
                    for (const propMatch of propMatches) {
                        const [name, type] = propMatch.split(':').map(s => s.trim());
                        props.push({ name, type, required: !type.includes('?') });
                    }
                }
            }
        }

        // Destructured props
        const destructuredMatches = content.match(/{\s*([^}]+)\s*}\s*:\s*\w*Props/g);
        if (destructuredMatches) {
            for (const match of destructuredMatches) {
                const propNames = match.match(/\w+/g);
                if (propNames) {
                    for (const name of propNames) {
                        if (name !== 'Props') {
                            props.push({ name, type: 'any', required: true });
                        }
                    }
                }
            }
        }

        return props;
    }

    /**
     * State 추출
     */
    private extractState(content: string): StateInfo[] {
        const states: StateInfo[] = [];

        // useState hooks
        const useStateMatches = content.match(/useState\s*\(\s*([^)]+)\s*\)/g);
        if (useStateMatches) {
            for (const match of useStateMatches) {
                const nameMatch = match.match(/(\w+)\s*=\s*useState/);
                if (nameMatch) {
                    states.push({
                        name: nameMatch[1],
                        type: 'useState',
                        initialValue: 'undefined'
                    });
                }
            }
        }

        // Class component state
        const stateMatches = content.match(/this\.state\s*=\s*{([^}]+)}/g);
        if (stateMatches) {
            for (const match of stateMatches) {
                const propMatches = match.match(/(\w+)\s*:\s*([^,}]+)/g);
                if (propMatches) {
                    for (const propMatch of propMatches) {
                        const [name, value] = propMatch.split(':').map(s => s.trim());
                        states.push({ name, type: 'class', initialValue: value });
                    }
                }
            }
        }

        return states;
    }

    /**
     * 이벤트 추출
     */
    private extractEvents(content: string): EventInfo[] {
        const events: EventInfo[] = [];

        // onClick, onChange 등 이벤트 핸들러
        const eventMatches = content.match(/(on\w+)\s*=\s*{([^}]+)}/g);
        if (eventMatches) {
            for (const match of eventMatches) {
                const [eventName, handler] = match.split('=').map(s => s.trim());
                events.push({
                    name: eventName,
                    handler: handler.replace(/[{}]/g, '').trim(),
                    type: 'synthetic'
                });
            }
        }

        // addEventListener
        const listenerMatches = content.match(/addEventListener\s*\(\s*['"]([^'"]+)['"]/g);
        if (listenerMatches) {
            for (const match of listenerMatches) {
                const eventName = match.match(/['"]([^'"]+)['"]/)?.[1];
                if (eventName) {
                    events.push({
                        name: eventName,
                        handler: 'unknown',
                        type: 'native'
                    });
                }
            }
        }

        return events;
    }

    /**
     * 스타일 추출
     */
    private extractStyles(content: string): StyleInfo[] {
        const styles: StyleInfo[] = [];

        // CSS modules
        const cssModuleMatches = content.match(/import\s+styles\s+from\s+['"]([^'"]+)['"]/g);
        if (cssModuleMatches) {
            styles.push({
                type: 'css-modules',
                source: 'external',
                scope: 'component'
            });
        }

        // Styled components
        const styledMatches = content.match(/styled\.\w+/g);
        if (styledMatches.length > 0) {
            styles.push({
                type: 'styled-components',
                source: 'inline',
                scope: 'component'
            });
        }

        // Inline styles
        const inlineMatches = content.match(/style\s*=\s*{/g);
        if (inlineMatches.length > 0) {
            styles.push({
                type: 'inline',
                source: 'inline',
                scope: 'element'
            });
        }

        return styles;
    }

    /**
     * 컴포넌트 접근성 분석
     */
    private analyzeComponentAccessibility(content: string): AccessibilityInfo {
        const issues: Issue[] = [];
        let score = 10;

        // alt 속성 검사
        if (content.includes('<img') && !content.includes('alt=')) {
            issues.push({
                id: this.generateId(),
                type: 'error',
                severity: 'high',
                message: '이미지에 alt 속성이 없습니다.',
                file: 'accessibility-analysis',
                line: 0,
                column: 0,
                rule: 'missing-alt-text'
            });
            score -= 2;
        }

        // aria-label 검사
        if (content.includes('<button') && !content.includes('aria-label') && !content.includes('aria-labelledby')) {
            issues.push({
                id: this.generateId(),
                type: 'warning',
                severity: 'medium',
                message: '버튼에 접근성 라벨이 없습니다.',
                file: 'accessibility-analysis',
                line: 0,
                column: 0,
                rule: 'missing-aria-label'
            });
            score -= 1;
        }

        // 키보드 네비게이션 검사
        if (content.includes('onClick') && !content.includes('onKeyDown') && !content.includes('onKeyPress')) {
            issues.push({
                id: this.generateId(),
                type: 'warning',
                severity: 'medium',
                message: '클릭 이벤트에 키보드 이벤트가 없습니다.',
                file: 'accessibility-analysis',
                line: 0,
                column: 0,
                rule: 'missing-keyboard-support'
            });
            score -= 1;
        }

        return {
            score: Math.max(0, score),
            issues,
            level: this.getAccessibilityLevel(score)
        };
    }

    /**
     * 컴포넌트 반응형 분석
     */
    private analyzeComponentResponsiveness(content: string): ResponsivenessInfo {
        const breakpoints = ['sm', 'md', 'lg', 'xl'];
        const foundBreakpoints: string[] = [];

        for (const bp of breakpoints) {
            if (content.includes(bp) || content.includes(`@media`)) {
                foundBreakpoints.push(bp);
            }
        }

        return {
            hasResponsiveDesign: foundBreakpoints.length > 0,
            breakpoints: foundBreakpoints,
            score: Math.min(10, foundBreakpoints.length * 2.5),
            issues: foundBreakpoints.length === 0 ? [{
                id: this.generateId(),
                type: 'warning',
                severity: 'medium',
                message: '반응형 디자인이 구현되지 않았습니다.',
                file: 'responsiveness-analysis',
                line: 0,
                column: 0,
                rule: 'missing-responsive-design'
            }] : []
        };
    }

    /**
     * 컴포넌트 성능 분석
     */
    private analyzeComponentPerformance(content: string): PerformanceInfo {
        const issues: Issue[] = [];
        let score = 10;

        // 불필요한 리렌더링 검사
        if (content.includes('useEffect') && !content.includes('useMemo') && !content.includes('useCallback')) {
            issues.push({
                id: this.generateId(),
                type: 'warning',
                severity: 'low',
                message: '성능 최적화를 위해 useMemo나 useCallback을 고려하세요.',
                file: 'performance-analysis',
                line: 0,
                column: 0,
                rule: 'missing-performance-optimization'
            });
            score -= 1;
        }

        // 큰 컴포넌트 검사
        const lines = content.split('\n').length;
        if (lines > 200) {
            issues.push({
                id: this.generateId(),
                type: 'warning',
                severity: 'medium',
                message: '컴포넌트가 너무 큽니다. 분할을 고려하세요.',
                file: 'performance-analysis',
                line: 0,
                column: 0,
                rule: 'large-component'
            });
            score -= 2;
        }

        return {
            score: Math.max(0, score),
            issues,
            recommendations: this.generatePerformanceRecommendations(content)
        };
    }

    /**
     * 컴포넌트 이슈 감지
     */
    private detectComponentIssues(content: string): Issue[] {
        const issues: Issue[] = [];

        // 하드코딩된 스타일 검사
        if (content.includes('style=') && content.includes('px')) {
            issues.push({
                id: this.generateId(),
                type: 'warning',
                severity: 'low',
                message: '하드코딩된 픽셀 값을 사용하고 있습니다. 상대 단위를 고려하세요.',
                file: 'component-analysis',
                line: 0,
                column: 0,
                rule: 'hardcoded-pixels'
            });
        }

        // 인라인 스타일 검사
        const inlineStyleMatches = content.match(/style\s*=\s*{[^}]+}/g);
        if (inlineStyleMatches && inlineStyleMatches.length > 3) {
            issues.push({
                id: this.generateId(),
                type: 'warning',
                severity: 'medium',
                message: '너무 많은 인라인 스타일이 있습니다. CSS 클래스를 사용하세요.',
                file: 'component-analysis',
                line: 0,
                column: 0,
                rule: 'too-many-inline-styles'
            });
        }

        return issues;
    }

    /**
     * 사용자 플로우 분석
     */
    private async analyzeUserFlows(sourceFiles: CodeFile[]): Promise<FlowAnalysis> {
        console.log('🔄 사용자 플로우 분석 중...');

        const flows: UserFlow[] = [];
        const navigation = this.extractNavigation(sourceFiles);
        const routes = this.extractRoutes(sourceFiles);

        // 주요 플로우 식별
        const mainFlows = this.identifyMainFlows(navigation, routes);

        for (const flow of mainFlows) {
            const flowAnalysis = await this.analyzeFlow(flow, sourceFiles);
            flows.push(flowAnalysis);
        }

        return {
            flows,
            navigation,
            routes,
            complexity: this.calculateFlowComplexity(flows),
            issues: this.detectFlowIssues(flows)
        };
    }

    /**
     * 네비게이션 추출
     */
    private extractNavigation(sourceFiles: CodeFile[]): NavigationInfo[] {
        const navigation: NavigationInfo[] = [];

        for (const file of sourceFiles) {
            if (file.name.includes('nav') || file.name.includes('menu')) {
                const navItems = this.extractNavItems(file.content);
                navigation.push({
                    file: file.name,
                    items: navItems,
                    type: this.detectNavigationType(file.content)
                });
            }
        }

        return navigation;
    }

    /**
     * 라우트 추출
     */
    private extractRoutes(sourceFiles: CodeFile[]): RouteInfo[] {
        const routes: RouteInfo[] = [];

        for (const file of sourceFiles) {
            if (file.name.includes('route') || file.name.includes('router')) {
                const routeItems = this.extractRouteItems(file.content);
                routes.push({
                    file: file.name,
                    routes: routeItems,
                    type: this.detectRouterType(file.content)
                });
            }
        }

        return routes;
    }

    /**
     * 상호작용 패턴 분석
     */
    private async analyzeInteractionPatterns(sourceFiles: CodeFile[]): Promise<InteractionAnalysis> {
        console.log('🖱️ 상호작용 패턴 분석 중...');

        const patterns: InteractionPattern[] = [];
        const events: EventInfo[] = [];
        const gestures: GestureInfo[] = [];

        for (const file of sourceFiles) {
            if (this.isUIComponent(file)) {
                const fileEvents = this.extractEvents(file.content);
                events.push(...fileEvents);

                const fileGestures = this.extractGestures(file.content);
                gestures.push(...fileGestures);
            }
        }

        // 패턴 식별
        patterns.push(...this.identifyInteractionPatterns(events, gestures));

        return {
            patterns,
            events,
            gestures,
            consistency: this.analyzeInteractionConsistency(patterns),
            usability: this.analyzeInteractionUsability(patterns)
        };
    }

    /**
     * 사용성 이슈 감지
     */
    private async detectUsabilityIssues(sourceFiles: CodeFile[]): Promise<UsabilityIssue[]> {
        const issues: UsabilityIssue[] = [];

        for (const file of sourceFiles) {
            if (this.isUIComponent(file)) {
                const fileIssues = this.detectFileUsabilityIssues(file);
                issues.push(...fileIssues);
            }
        }

        return issues;
    }

    /**
     * 접근성 분석
     */
    private async analyzeAccessibility(sourceFiles: CodeFile[]): Promise<AccessibilityAnalysis> {
        console.log('♿ 접근성 분석 중...');

        const analysis: AccessibilityAnalysis = {
            overallScore: 0,
            issues: [],
            recommendations: [],
            compliance: {
                wcag: { level: 'A', score: 0 },
                aria: { score: 0, issues: [] },
                keyboard: { score: 0, issues: [] },
                screenReader: { score: 0, issues: [] }
            }
        };

        for (const file of sourceFiles) {
            if (this.isUIComponent(file)) {
                const componentAccessibility = this.analyzeComponentAccessibility(file.content);
                analysis.issues.push(...componentAccessibility.issues);
            }
        }

        // 전체 점수 계산
        analysis.overallScore = this.calculateAccessibilityScore(analysis.issues);

        // WCAG 준수도 분석
        analysis.compliance.wcag = this.analyzeWCAGCompliance(analysis.issues);

        // ARIA 분석
        analysis.compliance.aria = this.analyzeARIACompliance(sourceFiles);

        // 키보드 접근성 분석
        analysis.compliance.keyboard = this.analyzeKeyboardAccessibility(sourceFiles);

        // 스크린 리더 분석
        analysis.compliance.screenReader = this.analyzeScreenReaderAccessibility(sourceFiles);

        // 권장사항 생성
        analysis.recommendations = this.generateAccessibilityRecommendations(analysis);

        return analysis;
    }

    /**
     * 반응형 디자인 분석
     */
    private async analyzeResponsiveDesign(sourceFiles: CodeFile[]): Promise<ResponsiveAnalysis> {
        console.log('📱 반응형 디자인 분석 중...');

        const analysis: ResponsiveAnalysis = {
            overallScore: 0,
            breakpoints: [],
            issues: [],
            recommendations: [],
            mobile: { score: 0, issues: [] },
            tablet: { score: 0, issues: [] },
            desktop: { score: 0, issues: [] }
        };

        for (const file of sourceFiles) {
            if (this.isUIComponent(file)) {
                const componentResponsiveness = this.analyzeComponentResponsiveness(file.content);
                analysis.breakpoints.push(...componentResponsiveness.breakpoints);
                analysis.issues.push(...componentResponsiveness.issues);
            }
        }

        // 중복 제거
        analysis.breakpoints = [...new Set(analysis.breakpoints)];

        // 각 디바이스별 분석
        analysis.mobile = this.analyzeDeviceResponsiveness(sourceFiles, 'mobile');
        analysis.tablet = this.analyzeDeviceResponsiveness(sourceFiles, 'tablet');
        analysis.desktop = this.analyzeDeviceResponsiveness(sourceFiles, 'desktop');

        // 전체 점수 계산
        analysis.overallScore = this.calculateResponsiveScore(analysis);

        // 권장사항 생성
        analysis.recommendations = this.generateResponsiveRecommendations(analysis);

        return analysis;
    }

    /**
     * 성능 영향 분석
     */
    private async analyzePerformanceImpact(sourceFiles: CodeFile[]): Promise<PerformanceImpact> {
        const impact: PerformanceImpact = {
            uiPerformance: {
                renderTime: 0,
                interactionDelay: 0,
                memoryUsage: 0
            },
            bundleImpact: {
                sizeIncrease: 0,
                loadTimeIncrease: 0
            },
            recommendations: []
        };

        // UI 성능 분석
        for (const file of sourceFiles) {
            if (this.isUIComponent(file)) {
                const componentPerf = this.analyzeComponentPerformance(file.content);
                impact.uiPerformance.renderTime += componentPerf.score * 10; // 임시 계산
            }
        }

        // 번들 영향 분석
        const totalSize = sourceFiles.reduce((sum, file) => sum + file.size, 0);
        impact.bundleImpact.sizeIncrease = totalSize;
        impact.bundleImpact.loadTimeIncrease = totalSize / (1024 * 1024); // 1MB당 1초

        // 권장사항 생성
        impact.recommendations = this.generatePerformanceRecommendations(sourceFiles);

        return impact;
    }

    /**
     * 개선 제안 생성
     */
    private async generateImprovementSuggestions(
        uiAnalysis: UIAnalysis,
        flowAnalysis: FlowAnalysis,
        interactionAnalysis: InteractionAnalysis,
        usabilityIssues: UsabilityIssue[],
        accessibilityAnalysis: AccessibilityAnalysis,
        responsiveAnalysis: ResponsiveAnalysis
    ): Promise<UXInsight[]> {
        const suggestions: UXInsight[] = [];

        // UI 개선 제안
        if (uiAnalysis.consistency.score < 7) {
            suggestions.push({
                id: this.generateId(),
                type: 'consistency',
                priority: 'high',
                title: 'UI 일관성 개선',
                description: '컴포넌트 간 일관성을 높여 사용자 경험을 개선하세요.',
                impact: '사용자 학습 곡선 단축',
                effort: 'medium',
                examples: ['공통 디자인 시스템 구축', '컴포넌트 라이브러리 활용']
            });
        }

        // 접근성 개선 제안
        if (accessibilityAnalysis.overallScore < 7) {
            suggestions.push({
                id: this.generateId(),
                type: 'accessibility',
                priority: 'high',
                title: '접근성 개선',
                description: '접근성 가이드라인을 준수하여 모든 사용자가 접근할 수 있도록 개선하세요.',
                impact: '사용자 범위 확대',
                effort: 'medium',
                examples: ['ARIA 속성 추가', '키보드 네비게이션 지원', '스크린 리더 호환성']
            });
        }

        // 반응형 디자인 개선 제안
        if (responsiveAnalysis.overallScore < 7) {
            suggestions.push({
                id: this.generateId(),
                type: 'responsive',
                priority: 'medium',
                title: '반응형 디자인 개선',
                description: '다양한 디바이스에서 최적의 사용자 경험을 제공하세요.',
                impact: '모바일 사용자 경험 향상',
                effort: 'high',
                examples: ['브레이크포인트 추가', '터치 인터페이스 최적화', '모바일 우선 설계']
            });
        }

        return suggestions;
    }

    // 헬퍼 메서드들
    private async analyzeConsistency(components: ComponentAnalysis[]): Promise<ConsistencyInfo> {
        // 실제 구현에서는 일관성 분석 로직
        return {
            score: 8,
            issues: []
        };
    }

    private async analyzeReusability(components: ComponentAnalysis[]): Promise<ReusabilityInfo> {
        // 실제 구현에서는 재사용성 분석 로직
        return {
            score: 7,
            issues: []
        };
    }

    private async analyzeMaintainability(components: ComponentAnalysis[]): Promise<MaintainabilityInfo> {
        // 실제 구현에서는 유지보수성 분석 로직
        return {
            score: 8,
            issues: []
        };
    }

    private getAccessibilityLevel(score: number): 'A' | 'AA' | 'AAA' | 'none' {
        if (score >= 9) return 'AAA';
        if (score >= 7) return 'AA';
        if (score >= 5) return 'A';
        return 'none';
    }

    private generatePerformanceRecommendations(content: string): string[] {
        const recommendations: string[] = [];

        if (content.includes('useEffect') && !content.includes('useMemo')) {
            recommendations.push('useMemo를 사용하여 불필요한 계산을 방지하세요.');
        }

        if (content.includes('onClick') && !content.includes('useCallback')) {
            recommendations.push('useCallback을 사용하여 함수 재생성을 방지하세요.');
        }

        return recommendations;
    }

    private extractNavItems(content: string): string[] {
        // 실제 구현에서는 네비게이션 아이템 추출
        return [];
    }

    private detectNavigationType(content: string): string {
        if (content.includes('Link')) return 'react-router';
        if (content.includes('router-link')) return 'vue-router';
        return 'unknown';
    }

    private extractRouteItems(content: string): string[] {
        // 실제 구현에서는 라우트 아이템 추출
        return [];
    }

    private detectRouterType(content: string): string {
        if (content.includes('createBrowserRouter')) return 'react-router-v6';
        if (content.includes('Router')) return 'react-router';
        return 'unknown';
    }

    private identifyMainFlows(navigation: NavigationInfo[], routes: RouteInfo[]): any[] {
        // 실제 구현에서는 주요 플로우 식별
        return [];
    }

    private async analyzeFlow(flow: any, sourceFiles: CodeFile[]): Promise<UserFlow> {
        // 실제 구현에서는 플로우 분석
        return {
            name: 'unknown',
            steps: [],
            complexity: 5,
            issues: []
        };
    }

    private calculateFlowComplexity(flows: UserFlow[]): number {
        return flows.reduce((sum, flow) => sum + flow.complexity, 0) / flows.length;
    }

    private detectFlowIssues(flows: UserFlow[]): Issue[] {
        // 실제 구현에서는 플로우 이슈 감지
        return [];
    }

    private extractGestures(content: string): GestureInfo[] {
        // 실제 구현에서는 제스처 추출
        return [];
    }

    private identifyInteractionPatterns(events: EventInfo[], gestures: GestureInfo[]): InteractionPattern[] {
        // 실제 구현에서는 상호작용 패턴 식별
        return [];
    }

    private analyzeInteractionConsistency(patterns: InteractionPattern[]): ConsistencyInfo {
        // 실제 구현에서는 상호작용 일관성 분석
        return { score: 8, issues: [] };
    }

    private analyzeInteractionUsability(patterns: InteractionPattern[]): UsabilityInfo {
        // 실제 구현에서는 상호작용 사용성 분석
        return { score: 8, issues: [] };
    }

    private detectFileUsabilityIssues(file: CodeFile): UsabilityIssue[] {
        // 실제 구현에서는 파일별 사용성 이슈 감지
        return [];
    }

    private calculateAccessibilityScore(issues: Issue[]): number {
        const criticalIssues = issues.filter(issue => issue.severity === 'high').length;
        const mediumIssues = issues.filter(issue => issue.severity === 'medium').length;
        const lowIssues = issues.filter(issue => issue.severity === 'low').length;

        return Math.max(0, 10 - (criticalIssues * 3 + mediumIssues * 2 + lowIssues * 1));
    }

    private analyzeWCAGCompliance(issues: Issue[]): { level: string; score: number } {
        // 실제 구현에서는 WCAG 준수도 분석
        return { level: 'AA', score: 8 };
    }

    private analyzeARIACompliance(sourceFiles: CodeFile[]): { score: number; issues: Issue[] } {
        // 실제 구현에서는 ARIA 준수도 분석
        return { score: 7, issues: [] };
    }

    private analyzeKeyboardAccessibility(sourceFiles: CodeFile[]): { score: number; issues: Issue[] } {
        // 실제 구현에서는 키보드 접근성 분석
        return { score: 8, issues: [] };
    }

    private analyzeScreenReaderAccessibility(sourceFiles: CodeFile[]): { score: number; issues: Issue[] } {
        // 실제 구현에서는 스크린 리더 접근성 분석
        return { score: 7, issues: [] };
    }

    private generateAccessibilityRecommendations(analysis: AccessibilityAnalysis): string[] {
        // 실제 구현에서는 접근성 권장사항 생성
        return [];
    }

    private analyzeDeviceResponsiveness(sourceFiles: CodeFile[], device: string): DeviceResponsiveness {
        // 실제 구현에서는 디바이스별 반응형 분석
        return { score: 8, issues: [] };
    }

    private calculateResponsiveScore(analysis: ResponsiveAnalysis): number {
        return (analysis.mobile.score + analysis.tablet.score + analysis.desktop.score) / 3;
    }

    private generateResponsiveRecommendations(analysis: ResponsiveAnalysis): string[] {
        // 실제 구현에서는 반응형 권장사항 생성
        return [];
    }

    private generatePerformanceRecommendations(sourceFiles: CodeFile[]): string[] {
        // 실제 구현에서는 성능 권장사항 생성
        return [];
    }

    private async generateBehaviorAnalysisReport(
        uiAnalysis: UIAnalysis,
        flowAnalysis: FlowAnalysis,
        interactionAnalysis: InteractionAnalysis,
        usabilityIssues: UsabilityIssue[],
        accessibilityAnalysis: AccessibilityAnalysis,
        responsiveAnalysis: ResponsiveAnalysis,
        performanceImpact: PerformanceImpact,
        improvementSuggestions: UXInsight[]
    ): Promise<string> {
        const report = {
            summary: this.generateBehaviorAnalysisSummary(uiAnalysis, flowAnalysis, usabilityIssues, improvementSuggestions),
            uiAnalysis,
            flowAnalysis,
            interactionAnalysis,
            usabilityIssues,
            accessibilityAnalysis,
            responsiveAnalysis,
            performanceImpact,
            improvementSuggestions,
            generatedAt: new Date().toISOString()
        };

        const reportPath = path.join(this.projectPath, 'behavior-analysis-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return reportPath;
    }

    private generateBehaviorAnalysisSummary(
        uiAnalysis: UIAnalysis,
        flowAnalysis: FlowAnalysis,
        usabilityIssues: UsabilityIssue[],
        improvementSuggestions: UXInsight[]
    ): BehaviorAnalysisSummary {
        return {
            overallScore: (uiAnalysis.consistency.score + flowAnalysis.complexity + improvementSuggestions.length) / 3,
            uiConsistency: uiAnalysis.consistency.score,
            flowComplexity: flowAnalysis.complexity,
            usabilityIssues: usabilityIssues.length,
            improvementSuggestions: improvementSuggestions.length,
            status: this.determineBehaviorStatus(uiAnalysis, flowAnalysis, usabilityIssues)
        };
    }

    private determineBehaviorStatus(
        uiAnalysis: UIAnalysis,
        flowAnalysis: FlowAnalysis,
        usabilityIssues: UsabilityIssue[]
    ): 'excellent' | 'good' | 'fair' | 'poor' {
        const avgScore = (uiAnalysis.consistency.score + (10 - flowAnalysis.complexity)) / 2;
        const issueCount = usabilityIssues.length;

        if (avgScore >= 8 && issueCount <= 2) return 'excellent';
        if (avgScore >= 6 && issueCount <= 5) return 'good';
        if (avgScore >= 4 && issueCount <= 10) return 'fair';
        return 'poor';
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

// 타입 정의
interface BehaviorAnalysisResult {
    uiAnalysis: UIAnalysis;
    flowAnalysis: FlowAnalysis;
    interactionAnalysis: InteractionAnalysis;
    usabilityIssues: UsabilityIssue[];
    accessibilityAnalysis: AccessibilityAnalysis;
    responsiveAnalysis: ResponsiveAnalysis;
    performanceImpact: PerformanceImpact;
    improvementSuggestions: UXInsight[];
    report: string;
    summary: BehaviorAnalysisSummary;
}

interface UIAnalysis {
    components: ComponentAnalysis[];
    patterns: any[];
    consistency: ConsistencyInfo;
    reusability: ReusabilityInfo;
    maintainability: MaintainabilityInfo;
}

interface ComponentAnalysis {
    name: string;
    path: string;
    type: string;
    complexity: number;
    props: PropInfo[];
    state: StateInfo[];
    events: EventInfo[];
    styles: StyleInfo[];
    accessibility: AccessibilityInfo;
    responsiveness: ResponsivenessInfo;
    performance: PerformanceInfo;
    issues: Issue[];
}

interface PropInfo {
    name: string;
    type: string;
    required: boolean;
}

interface StateInfo {
    name: string;
    type: string;
    initialValue: string;
}

interface EventInfo {
    name: string;
    handler: string;
    type: string;
}

interface StyleInfo {
    type: string;
    source: string;
    scope: string;
}

interface AccessibilityInfo {
    score: number;
    issues: Issue[];
    level: string;
}

interface ResponsivenessInfo {
    hasResponsiveDesign: boolean;
    breakpoints: string[];
    score: number;
    issues: Issue[];
}

interface PerformanceInfo {
    score: number;
    issues: Issue[];
    recommendations: string[];
}

interface ConsistencyInfo {
    score: number;
    issues: Issue[];
}

interface ReusabilityInfo {
    score: number;
    issues: Issue[];
}

interface MaintainabilityInfo {
    score: number;
    issues: Issue[];
}

interface FlowAnalysis {
    flows: UserFlow[];
    navigation: NavigationInfo[];
    routes: RouteInfo[];
    complexity: number;
    issues: Issue[];
}

interface UserFlow {
    name: string;
    steps: any[];
    complexity: number;
    issues: Issue[];
}

interface NavigationInfo {
    file: string;
    items: string[];
    type: string;
}

interface RouteInfo {
    file: string;
    routes: string[];
    type: string;
}

interface InteractionAnalysis {
    patterns: InteractionPattern[];
    events: EventInfo[];
    gestures: GestureInfo[];
    consistency: ConsistencyInfo;
    usability: UsabilityInfo;
}

interface InteractionPattern {
    name: string;
    description: string;
    frequency: number;
}

interface GestureInfo {
    type: string;
    element: string;
    action: string;
}

interface UsabilityIssue {
    id: string;
    type: string;
    severity: string;
    description: string;
    file: string;
    line: number;
    column: number;
    rule: string;
}

interface AccessibilityAnalysis {
    overallScore: number;
    issues: Issue[];
    recommendations: string[];
    compliance: {
        wcag: { level: string; score: number };
        aria: { score: number; issues: Issue[] };
        keyboard: { score: number; issues: Issue[] };
        screenReader: { score: number; issues: Issue[] };
    };
}

interface ResponsiveAnalysis {
    overallScore: number;
    breakpoints: string[];
    issues: Issue[];
    recommendations: string[];
    mobile: DeviceResponsiveness;
    tablet: DeviceResponsiveness;
    desktop: DeviceResponsiveness;
}

interface DeviceResponsiveness {
    score: number;
    issues: Issue[];
}

interface PerformanceImpact {
    uiPerformance: {
        renderTime: number;
        interactionDelay: number;
        memoryUsage: number;
    };
    bundleImpact: {
        sizeIncrease: number;
        loadTimeIncrease: number;
    };
    recommendations: string[];
}

interface BehaviorAnalysisSummary {
    overallScore: number;
    uiConsistency: number;
    flowComplexity: number;
    usabilityIssues: number;
    improvementSuggestions: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
}
