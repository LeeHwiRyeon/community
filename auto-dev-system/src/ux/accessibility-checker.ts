import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { CodeFile, Issue } from '@/types';

export class AccessibilityChecker {
    private openai: OpenAI;
    private projectPath: string;

    constructor(apiKey: string, projectPath: string = './generated-projects') {
        this.openai = new OpenAI({ apiKey });
        this.projectPath = projectPath;
    }

    /**
     * 접근성 검사 실행
     */
    async checkAccessibility(sourceFiles: CodeFile[]): Promise<AccessibilityCheckResult> {
        console.log('♿ 접근성 검사 시작...');

        try {
            // 1. WCAG 준수도 검사
            const wcagCompliance = await this.checkWCAGCompliance(sourceFiles);

            // 2. ARIA 속성 검사
            const ariaCheck = await this.checkARIAAttributes(sourceFiles);

            // 3. 키보드 접근성 검사
            const keyboardAccessibility = await this.checkKeyboardAccessibility(sourceFiles);

            // 4. 스크린 리더 호환성 검사
            const screenReaderCompatibility = await this.checkScreenReaderCompatibility(sourceFiles);

            // 5. 색상 대비 검사
            const colorContrast = await this.checkColorContrast(sourceFiles);

            // 6. 포커스 관리 검사
            const focusManagement = await this.checkFocusManagement(sourceFiles);

            // 7. 시맨틱 HTML 검사
            const semanticHTML = await this.checkSemanticHTML(sourceFiles);

            // 8. 모바일 접근성 검사
            const mobileAccessibility = await this.checkMobileAccessibility(sourceFiles);

            // 9. 전체 점수 계산
            const overallScore = this.calculateOverallScore({
                wcagCompliance,
                ariaCheck,
                keyboardAccessibility,
                screenReaderCompatibility,
                colorContrast,
                focusManagement,
                semanticHTML,
                mobileAccessibility
            });

            // 10. 개선 제안 생성
            const improvementSuggestions = await this.generateImprovementSuggestions({
                wcagCompliance,
                ariaCheck,
                keyboardAccessibility,
                screenReaderCompatibility,
                colorContrast,
                focusManagement,
                semanticHTML,
                mobileAccessibility
            });

            // 11. 검사 리포트 생성
            const report = await this.generateAccessibilityReport({
                wcagCompliance,
                ariaCheck,
                keyboardAccessibility,
                screenReaderCompatibility,
                colorContrast,
                focusManagement,
                semanticHTML,
                mobileAccessibility,
                overallScore,
                improvementSuggestions
            });

            console.log('✅ 접근성 검사 완료');

            return {
                wcagCompliance,
                ariaCheck,
                keyboardAccessibility,
                screenReaderCompatibility,
                colorContrast,
                focusManagement,
                semanticHTML,
                mobileAccessibility,
                overallScore,
                improvementSuggestions,
                report,
                summary: this.generateAccessibilitySummary(overallScore, improvementSuggestions)
            };

        } catch (error) {
            console.error('❌ 접근성 검사 실패:', error);
            throw error;
        }
    }

    /**
     * WCAG 준수도 검사
     */
    private async checkWCAGCompliance(sourceFiles: CodeFile[]): Promise<WCAGCompliance> {
        console.log('📋 WCAG 준수도 검사 중...');

        const issues: Issue[] = [];
        let levelAScore = 0;
        let levelAAScore = 0;
        let levelAAAScore = 0;

        for (const file of sourceFiles) {
            if (this.isUIComponent(file)) {
                const fileIssues = this.checkWCAGLevelA(file.content);
                issues.push(...fileIssues);

                const fileIssuesAA = this.checkWCAGLevelAA(file.content);
                issues.push(...fileIssuesAA);

                const fileIssuesAAA = this.checkWCAGLevelAAA(file.content);
                issues.push(...fileIssuesAAA);
            }
        }

        // 점수 계산
        levelAScore = this.calculateWCAGScore(issues, 'A');
        levelAAScore = this.calculateWCAGScore(issues, 'AA');
        levelAAAScore = this.calculateWCAGScore(issues, 'AAA');

        return {
            levelA: { score: levelAScore, issues: issues.filter(i => i.rule.includes('wcag-a')) },
            levelAA: { score: levelAAScore, issues: issues.filter(i => i.rule.includes('wcag-aa')) },
            levelAAA: { score: levelAAAScore, issues: issues.filter(i => i.rule.includes('wcag-aaa')) },
            overallLevel: this.determineOverallLevel(levelAScore, levelAAScore, levelAAAScore)
        };
    }

    /**
     * WCAG Level A 검사
     */
    private checkWCAGLevelA(content: string): Issue[] {
        const issues: Issue[] = [];

        // 1.1.1 대체 텍스트
        if (content.includes('<img') && !content.includes('alt=')) {
            issues.push({
                id: this.generateId(),
                type: 'error',
                severity: 'high',
                message: '이미지에 대체 텍스트가 없습니다. (WCAG 1.1.1)',
                file: 'accessibility-check',
                line: 0,
                column: 0,
                rule: 'wcag-a-1-1-1'
            });
        }

        // 1.3.1 정보와 관계
        if (content.includes('<table') && !content.includes('<th')) {
            issues.push({
                id: this.generateId(),
                type: 'error',
                severity: 'high',
                message: '테이블에 헤더가 없습니다. (WCAG 1.3.1)',
                file: 'accessibility-check',
                line: 0,
                column: 0,
                rule: 'wcag-a-1-3-1'
            });
        }

        // 1.4.1 색상 사용
        if (content.includes('color:') && !content.includes('background-color:')) {
            issues.push({
                id: this.generateId(),
                type: 'warning',
                severity: 'medium',
                message: '색상만으로 정보를 전달하고 있습니다. (WCAG 1.4.1)',
                file: 'accessibility-check',
                line: 0,
                column: 0,
                rule: 'wcag-a-1-4-1'
            });
        }

        return issues;
    }

    /**
     * WCAG Level AA 검사
     */
    private checkWCAGLevelAA(content: string): Issue[] {
        const issues: Issue[] = [];

        // 1.4.3 대비 (최소)
        if (content.includes('color:') && content.includes('background-color:')) {
            // 실제 구현에서는 색상 대비 계산
            issues.push({
                id: this.generateId(),
                type: 'warning',
                severity: 'medium',
                message: '색상 대비를 확인하세요. (WCAG 1.4.3)',
                file: 'accessibility-check',
                line: 0,
                column: 0,
                rule: 'wcag-aa-1-4-3'
            });
        }

        // 1.4.4 텍스트 크기 조정
        if (content.includes('font-size:') && content.includes('px')) {
            issues.push({
                id: this.generateId(),
                type: 'warning',
                severity: 'low',
                message: '고정 픽셀 단위 사용을 고려하세요. (WCAG 1.4.4)',
                file: 'accessibility-check',
                line: 0,
                column: 0,
                rule: 'wcag-aa-1-4-4'
            });
        }

        return issues;
    }

    /**
     * WCAG Level AAA 검사
     */
    private checkWCAGLevelAAA(content: string): Issue[] {
        const issues: Issue[] = [];

        // 1.4.6 대비 (향상)
        if (content.includes('color:') && content.includes('background-color:')) {
            issues.push({
                id: this.generateId(),
                type: 'info',
                severity: 'low',
                message: '향상된 색상 대비를 고려하세요. (WCAG 1.4.6)',
                file: 'accessibility-check',
                line: 0,
                column: 0,
                rule: 'wcag-aaa-1-4-6'
            });
        }

        return issues;
    }

    /**
     * ARIA 속성 검사
     */
    private async checkARIAAttributes(sourceFiles: CodeFile[]): Promise<ARIACheck> {
        console.log('🏷️ ARIA 속성 검사 중...');

        const issues: Issue[] = [];
        let score = 10;

        for (const file of sourceFiles) {
            if (this.isUIComponent(file)) {
                const fileIssues = this.checkARIAInFile(file.content);
                issues.push(...fileIssues);
            }
        }

        // 점수 계산
        const criticalIssues = issues.filter(issue => issue.severity === 'high').length;
        const mediumIssues = issues.filter(issue => issue.severity === 'medium').length;
        const lowIssues = issues.filter(issue => issue.severity === 'low').length;

        score = Math.max(0, 10 - (criticalIssues * 3 + mediumIssues * 2 + lowIssues * 1));

        return {
            score,
            issues,
            recommendations: this.generateARIARecommendations(issues)
        };
    }

    /**
     * 파일 내 ARIA 검사
     */
    private checkARIAInFile(content: string): Issue[] {
        const issues: Issue[] = [];

        // aria-label 누락
        if (content.includes('<button') && !content.includes('aria-label') && !content.includes('aria-labelledby')) {
            issues.push({
                id: this.generateId(),
                type: 'warning',
                severity: 'medium',
                message: '버튼에 aria-label 또는 aria-labelledby가 없습니다.',
                file: 'aria-check',
                line: 0,
                column: 0,
                rule: 'missing-aria-label'
            });
        }

        // aria-describedby 누락
        if (content.includes('<input') && !content.includes('aria-describedby')) {
            issues.push({
                id: this.generateId(),
                type: 'info',
                severity: 'low',
                message: '입력 필드에 aria-describedby를 고려하세요.',
                file: 'aria-check',
                line: 0,
                column: 0,
                rule: 'missing-aria-describedby'
            });
        }

        // role 속성 검사
        if (content.includes('<div') && content.includes('onClick') && !content.includes('role=')) {
            issues.push({
                id: this.generateId(),
                type: 'warning',
                severity: 'medium',
                message: '클릭 가능한 div에 role 속성을 추가하세요.',
                file: 'aria-check',
                line: 0,
                column: 0,
                rule: 'missing-role'
            });
        }

        return issues;
    }

    /**
     * 키보드 접근성 검사
     */
    private async checkKeyboardAccessibility(sourceFiles: CodeFile[]): Promise<KeyboardAccessibility> {
        console.log('⌨️ 키보드 접근성 검사 중...');

        const issues: Issue[] = [];
        let score = 10;

        for (const file of sourceFiles) {
            if (this.isUIComponent(file)) {
                const fileIssues = this.checkKeyboardInFile(file.content);
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
            tabOrder: this.checkTabOrder(sourceFiles),
            focusTrapping: this.checkFocusTrapping(sourceFiles),
            recommendations: this.generateKeyboardRecommendations(issues)
        };
    }

    /**
     * 파일 내 키보드 접근성 검사
     */
    private checkKeyboardInFile(content: string): Issue[] {
        const issues: Issue[] = [];

        // onClick만 있고 onKeyDown이 없는 경우
        if (content.includes('onClick') && !content.includes('onKeyDown') && !content.includes('onKeyPress')) {
            issues.push({
                id: this.generateId(),
                type: 'error',
                severity: 'high',
                message: '클릭 이벤트에 키보드 이벤트가 없습니다.',
                file: 'keyboard-check',
                line: 0,
                column: 0,
                rule: 'missing-keyboard-event'
            });
        }

        // tabIndex 검사
        if (content.includes('tabIndex=') && content.includes('tabIndex={-1}')) {
            issues.push({
                id: this.generateId(),
                type: 'warning',
                severity: 'medium',
                message: 'tabIndex={-1} 사용을 검토하세요.',
                file: 'keyboard-check',
                line: 0,
                column: 0,
                rule: 'negative-tabindex'
            });
        }

        return issues;
    }

    /**
     * 스크린 리더 호환성 검사
     */
    private async checkScreenReaderCompatibility(sourceFiles: CodeFile[]): Promise<ScreenReaderCompatibility> {
        console.log('🔊 스크린 리더 호환성 검사 중...');

        const issues: Issue[] = [];
        let score = 10;

        for (const file of sourceFiles) {
            if (this.isUIComponent(file)) {
                const fileIssues = this.checkScreenReaderInFile(file.content);
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
            announcements: this.checkLiveRegions(sourceFiles),
            landmarks: this.checkLandmarks(sourceFiles),
            recommendations: this.generateScreenReaderRecommendations(issues)
        };
    }

    /**
     * 색상 대비 검사
     */
    private async checkColorContrast(sourceFiles: CodeFile[]): Promise<ColorContrast> {
        console.log('🎨 색상 대비 검사 중...');

        const issues: Issue[] = [];
        let score = 10;

        for (const file of sourceFiles) {
            if (this.isUIComponent(file)) {
                const fileIssues = this.checkColorContrastInFile(file.content);
                issues.push(...fileIssues);
            }
        }

        return {
            score,
            issues,
            recommendations: this.generateColorContrastRecommendations(issues)
        };
    }

    /**
     * 포커스 관리 검사
     */
    private async checkFocusManagement(sourceFiles: CodeFile[]): Promise<FocusManagement> {
        console.log('🎯 포커스 관리 검사 중...');

        const issues: Issue[] = [];
        let score = 10;

        for (const file of sourceFiles) {
            if (this.isUIComponent(file)) {
                const fileIssues = this.checkFocusInFile(file.content);
                issues.push(...fileIssues);
            }
        }

        return {
            score,
            issues,
            recommendations: this.generateFocusRecommendations(issues)
        };
    }

    /**
     * 시맨틱 HTML 검사
     */
    private async checkSemanticHTML(sourceFiles: CodeFile[]): Promise<SemanticHTML> {
        console.log('📝 시맨틱 HTML 검사 중...');

        const issues: Issue[] = [];
        let score = 10;

        for (const file of sourceFiles) {
            if (this.isUIComponent(file)) {
                const fileIssues = this.checkSemanticInFile(file.content);
                issues.push(...fileIssues);
            }
        }

        return {
            score,
            issues,
            recommendations: this.generateSemanticRecommendations(issues)
        };
    }

    /**
     * 모바일 접근성 검사
     */
    private async checkMobileAccessibility(sourceFiles: CodeFile[]): Promise<MobileAccessibility> {
        console.log('📱 모바일 접근성 검사 중...');

        const issues: Issue[] = [];
        let score = 10;

        for (const file of sourceFiles) {
            if (this.isUIComponent(file)) {
                const fileIssues = this.checkMobileInFile(file.content);
                issues.push(...fileIssues);
            }
        }

        return {
            score,
            issues,
            touchTargets: this.checkTouchTargets(sourceFiles),
            recommendations: this.generateMobileRecommendations(issues)
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

    private calculateWCAGScore(issues: Issue[], level: string): number {
        const levelIssues = issues.filter(issue => issue.rule.includes(`wcag-${level.toLowerCase()}`));
        const criticalIssues = levelIssues.filter(issue => issue.severity === 'high').length;
        const mediumIssues = levelIssues.filter(issue => issue.severity === 'medium').length;
        const lowIssues = levelIssues.filter(issue => issue.severity === 'low').length;

        return Math.max(0, 10 - (criticalIssues * 4 + mediumIssues * 2 + lowIssues * 1));
    }

    private determineOverallLevel(levelA: number, levelAA: number, levelAAA: number): string {
        if (levelAAA >= 8) return 'AAA';
        if (levelAA >= 8) return 'AA';
        if (levelA >= 8) return 'A';
        return 'None';
    }

    private generateARIARecommendations(issues: Issue[]): string[] {
        const recommendations: string[] = [];

        if (issues.some(issue => issue.rule === 'missing-aria-label')) {
            recommendations.push('모든 인터랙티브 요소에 aria-label을 추가하세요.');
        }

        if (issues.some(issue => issue.rule === 'missing-role')) {
            recommendations.push('의미있는 역할을 가진 요소에 role 속성을 추가하세요.');
        }

        return recommendations;
    }

    private checkTabOrder(sourceFiles: CodeFile[]): TabOrderInfo {
        // 실제 구현에서는 탭 순서 검사
        return { score: 8, issues: [] };
    }

    private checkFocusTrapping(sourceFiles: CodeFile[]): FocusTrappingInfo {
        // 실제 구현에서는 포커스 트래핑 검사
        return { score: 7, issues: [] };
    }

    private generateKeyboardRecommendations(issues: Issue[]): string[] {
        const recommendations: string[] = [];

        if (issues.some(issue => issue.rule === 'missing-keyboard-event')) {
            recommendations.push('모든 클릭 이벤트에 키보드 이벤트를 추가하세요.');
        }

        return recommendations;
    }

    private checkScreenReaderInFile(content: string): Issue[] {
        // 실제 구현에서는 스크린 리더 호환성 검사
        return [];
    }

    private checkLiveRegions(sourceFiles: CodeFile[]): LiveRegionInfo {
        // 실제 구현에서는 라이브 리전 검사
        return { score: 8, issues: [] };
    }

    private checkLandmarks(sourceFiles: CodeFile[]): LandmarkInfo {
        // 실제 구현에서는 랜드마크 검사
        return { score: 7, issues: [] };
    }

    private generateScreenReaderRecommendations(issues: Issue[]): string[] {
        // 실제 구현에서는 스크린 리더 권장사항 생성
        return [];
    }

    private checkColorContrastInFile(content: string): Issue[] {
        // 실제 구현에서는 색상 대비 검사
        return [];
    }

    private generateColorContrastRecommendations(issues: Issue[]): string[] {
        // 실제 구현에서는 색상 대비 권장사항 생성
        return [];
    }

    private checkFocusInFile(content: string): Issue[] {
        // 실제 구현에서는 포커스 관리 검사
        return [];
    }

    private generateFocusRecommendations(issues: Issue[]): string[] {
        // 실제 구현에서는 포커스 권장사항 생성
        return [];
    }

    private checkSemanticInFile(content: string): Issue[] {
        // 실제 구현에서는 시맨틱 HTML 검사
        return [];
    }

    private generateSemanticRecommendations(issues: Issue[]): string[] {
        // 실제 구현에서는 시맨틱 권장사항 생성
        return [];
    }

    private checkMobileInFile(content: string): Issue[] {
        // 실제 구현에서는 모바일 접근성 검사
        return [];
    }

    private checkTouchTargets(sourceFiles: CodeFile[]): TouchTargetInfo {
        // 실제 구현에서는 터치 타겟 검사
        return { score: 8, issues: [] };
    }

    private generateMobileRecommendations(issues: Issue[]): string[] {
        // 실제 구현에서는 모바일 권장사항 생성
        return [];
    }

    private calculateOverallScore(checks: any): number {
        const scores = Object.values(checks).map((check: any) => check.score || 0);
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }

    private async generateImprovementSuggestions(checks: any): Promise<string[]> {
        const suggestions: string[] = [];

        // WCAG 개선 제안
        if (checks.wcagCompliance.overallLevel === 'None') {
            suggestions.push('WCAG 가이드라인을 준수하여 접근성을 개선하세요.');
        }

        // ARIA 개선 제안
        if (checks.ariaCheck.score < 7) {
            suggestions.push('ARIA 속성을 추가하여 스크린 리더 호환성을 개선하세요.');
        }

        // 키보드 접근성 개선 제안
        if (checks.keyboardAccessibility.score < 7) {
            suggestions.push('키보드 네비게이션을 지원하도록 개선하세요.');
        }

        return suggestions;
    }

    private async generateAccessibilityReport(data: any): Promise<string> {
        const report = {
            summary: this.generateAccessibilitySummary(data.overallScore, data.improvementSuggestions),
            ...data,
            generatedAt: new Date().toISOString()
        };

        const reportPath = path.join(this.projectPath, 'accessibility-check-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return reportPath;
    }

    private generateAccessibilitySummary(overallScore: number, suggestions: string[]): AccessibilitySummary {
        return {
            overallScore,
            suggestionsCount: suggestions.length,
            status: this.determineAccessibilityStatus(overallScore),
            priority: this.determinePriority(overallScore)
        };
    }

    private determineAccessibilityStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
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
interface AccessibilityCheckResult {
    wcagCompliance: WCAGCompliance;
    ariaCheck: ARIACheck;
    keyboardAccessibility: KeyboardAccessibility;
    screenReaderCompatibility: ScreenReaderCompatibility;
    colorContrast: ColorContrast;
    focusManagement: FocusManagement;
    semanticHTML: SemanticHTML;
    mobileAccessibility: MobileAccessibility;
    overallScore: number;
    improvementSuggestions: string[];
    report: string;
    summary: AccessibilitySummary;
}

interface WCAGCompliance {
    levelA: { score: number; issues: Issue[] };
    levelAA: { score: number; issues: Issue[] };
    levelAAA: { score: number; issues: Issue[] };
    overallLevel: string;
}

interface ARIACheck {
    score: number;
    issues: Issue[];
    recommendations: string[];
}

interface KeyboardAccessibility {
    score: number;
    issues: Issue[];
    tabOrder: TabOrderInfo;
    focusTrapping: FocusTrappingInfo;
    recommendations: string[];
}

interface TabOrderInfo {
    score: number;
    issues: Issue[];
}

interface FocusTrappingInfo {
    score: number;
    issues: Issue[];
}

interface ScreenReaderCompatibility {
    score: number;
    issues: Issue[];
    announcements: LiveRegionInfo;
    landmarks: LandmarkInfo;
    recommendations: string[];
}

interface LiveRegionInfo {
    score: number;
    issues: Issue[];
}

interface LandmarkInfo {
    score: number;
    issues: Issue[];
}

interface ColorContrast {
    score: number;
    issues: Issue[];
    recommendations: string[];
}

interface FocusManagement {
    score: number;
    issues: Issue[];
    recommendations: string[];
}

interface SemanticHTML {
    score: number;
    issues: Issue[];
    recommendations: string[];
}

interface MobileAccessibility {
    score: number;
    issues: Issue[];
    touchTargets: TouchTargetInfo;
    recommendations: string[];
}

interface TouchTargetInfo {
    score: number;
    issues: Issue[];
}

interface AccessibilitySummary {
    overallScore: number;
    suggestionsCount: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    priority: 'high' | 'medium' | 'low';
}
