interface UIUXIssue {
    id: string;
    type: 'error' | 'warning' | 'info';
    category: 'accessibility' | 'usability' | 'performance' | 'consistency' | 'responsive';
    severity: 'high' | 'medium' | 'low';
    element: string;
    message: string;
    suggestion: string;
    selector?: string;
    line?: number;
    column?: number;
}

interface UIUXValidationResult {
    totalIssues: number;
    errors: number;
    warnings: number;
    info: number;
    issues: UIUXIssue[];
    score: number;
    recommendations: string[];
}

export class UIUXValidator {
    private issues: UIUXIssue[] = [];
    private score = 100;

    // 전체 UI/UX 검증 실행
    validateAll(): UIUXValidationResult {
        this.issues = [];
        this.score = 100;

        // 각 카테고리별 검증 실행
        this.validateAccessibility();
        this.validateUsability();
        this.validatePerformance();
        this.validateConsistency();
        this.validateResponsive();

        // 점수 계산
        this.calculateScore();

        // 권장사항 생성
        const recommendations = this.generateRecommendations();

        return {
            totalIssues: this.issues.length,
            errors: this.issues.filter(i => i.type === 'error').length,
            warnings: this.issues.filter(i => i.type === 'warning').length,
            info: this.issues.filter(i => i.type === 'info').length,
            issues: this.issues,
            score: this.score,
            recommendations
        };
    }

    // 접근성 검증
    private validateAccessibility(): void {
        // ARIA 라벨 검증
        const elementsWithoutAriaLabel = document.querySelectorAll(
            'button:not([aria-label]):not([aria-labelledby]), input:not([aria-label]):not([aria-labelledby]), a:not([aria-label]):not([aria-labelledby])'
        );

        elementsWithoutAriaLabel.forEach((element, index) => {
            this.addIssue({
                id: `aria-label-${index}`,
                type: 'warning',
                category: 'accessibility',
                severity: 'medium',
                element: element.tagName.toLowerCase(),
                message: 'ARIA 라벨이 없는 인터랙티브 요소',
                suggestion: 'aria-label 또는 aria-labelledby 속성을 추가하세요',
                selector: this.getElementSelector(element)
            });
        });

        // 색상 대비 검증
        this.validateColorContrast();

        // 키보드 접근성 검증
        this.validateKeyboardAccessibility();

        // 포커스 관리 검증
        this.validateFocusManagement();
    }

    // 사용성 검증
    private validateUsability(): void {
        // 버튼 크기 검증
        const smallButtons = document.querySelectorAll('button[style*="height: 20px"], button[style*="height: 24px"], button[style*="height: 28px"]');
        smallButtons.forEach((button, index) => {
            this.addIssue({
                id: `button-size-${index}`,
                type: 'warning',
                category: 'usability',
                severity: 'medium',
                element: 'button',
                message: '터치하기 어려운 작은 버튼',
                suggestion: '버튼 높이를 최소 44px 이상으로 설정하세요',
                selector: this.getElementSelector(button)
            });
        });

        // 링크 텍스트 검증
        const unclearLinks = document.querySelectorAll('a[href]:not([aria-label])');
        unclearLinks.forEach((link, index) => {
            const text = link.textContent?.trim();
            if (text && (text === '더보기' || text === '자세히' || text === '클릭' || text === '여기')) {
                this.addIssue({
                    id: `unclear-link-${index}`,
                    type: 'warning',
                    category: 'usability',
                    severity: 'low',
                    element: 'a',
                    message: '명확하지 않은 링크 텍스트',
                    suggestion: '링크의 목적을 명확히 나타내는 텍스트를 사용하세요',
                    selector: this.getElementSelector(link)
                });
            }
        });

        // 폼 검증
        this.validateForms();

        // 로딩 상태 검증
        this.validateLoadingStates();
    }

    // 성능 검증
    private validatePerformance(): void {
        // 이미지 최적화 검증
        const unoptimizedImages = document.querySelectorAll('img[src*=".jpg"]:not([loading="lazy"]), img[src*=".png"]:not([loading="lazy"])');
        unoptimizedImages.forEach((img, index) => {
            this.addIssue({
                id: `image-lazy-${index}`,
                type: 'info',
                category: 'performance',
                severity: 'low',
                element: 'img',
                message: '지연 로딩이 적용되지 않은 이미지',
                suggestion: 'loading="lazy" 속성을 추가하여 성능을 개선하세요',
                selector: this.getElementSelector(img)
            });
        });

        // 큰 이미지 검증
        const largeImages = document.querySelectorAll('img');
        largeImages.forEach((img, index) => {
            const imgElement = img as HTMLImageElement;
            if (imgElement.naturalWidth > 1920 || imgElement.naturalHeight > 1080) {
                this.addIssue({
                    id: `large-image-${index}`,
                    type: 'warning',
                    category: 'performance',
                    severity: 'medium',
                    element: 'img',
                    message: '너무 큰 이미지 파일',
                    suggestion: '이미지 크기를 최적화하거나 반응형 이미지를 사용하세요',
                    selector: this.getElementSelector(img)
                });
            }
        });

        // CSS 최적화 검증
        this.validateCSSOptimization();
    }

    // 일관성 검증
    private validateConsistency(): void {
        // 색상 일관성 검증
        this.validateColorConsistency();

        // 폰트 일관성 검증
        this.validateFontConsistency();

        // 간격 일관성 검증
        this.validateSpacingConsistency();

        // 버튼 스타일 일관성 검증
        this.validateButtonConsistency();
    }

    // 반응형 검증
    private validateResponsive(): void {
        // 뷰포트 메타 태그 검증
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (!viewportMeta) {
            this.addIssue({
                id: 'viewport-meta',
                type: 'error',
                category: 'responsive',
                severity: 'high',
                element: 'meta',
                message: '뷰포트 메타 태그가 없습니다',
                suggestion: '모바일 반응형을 위해 뷰포트 메타 태그를 추가하세요'
            });
        }

        // 고정 너비 요소 검증
        const fixedWidthElements = document.querySelectorAll('[style*="width: "][style*="px"]');
        fixedWidthElements.forEach((element, index) => {
            const style = element.getAttribute('style');
            const widthMatch = style?.match(/width:\s*(\d+)px/);
            if (widthMatch && parseInt(widthMatch[1]) > 1200) {
                this.addIssue({
                    id: `fixed-width-${index}`,
                    type: 'warning',
                    category: 'responsive',
                    severity: 'medium',
                    element: element.tagName.toLowerCase(),
                    message: '고정 너비로 인한 반응형 문제',
                    suggestion: '상대적 단위(%, vw, rem)를 사용하세요',
                    selector: this.getElementSelector(element)
                });
            }
        });

        // 모바일 터치 영역 검증
        this.validateTouchTargets();
    }

    // 색상 대비 검증
    private validateColorContrast(): void {
        const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button');

        textElements.forEach((element, index) => {
            const computedStyle = window.getComputedStyle(element);
            const color = computedStyle.color;
            const backgroundColor = this.getBackgroundColor(element);

            if (color && backgroundColor) {
                const contrast = this.calculateContrast(color, backgroundColor);
                if (contrast < 4.5) {
                    this.addIssue({
                        id: `contrast-${index}`,
                        type: 'error',
                        category: 'accessibility',
                        severity: 'high',
                        element: element.tagName.toLowerCase(),
                        message: `색상 대비 부족 (${contrast.toFixed(2)}:1)`,
                        suggestion: 'WCAG AA 기준(4.5:1)을 만족하도록 색상을 조정하세요',
                        selector: this.getElementSelector(element)
                    });
                }
            }
        });
    }

    // 키보드 접근성 검증
    private validateKeyboardAccessibility(): void {
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');

        interactiveElements.forEach((element, index) => {
            const tabIndex = element.getAttribute('tabindex');
            if (tabIndex === '-1' && element.getAttribute('role') !== 'presentation') {
                this.addIssue({
                    id: `keyboard-${index}`,
                    type: 'warning',
                    category: 'accessibility',
                    severity: 'medium',
                    element: element.tagName.toLowerCase(),
                    message: '키보드로 접근할 수 없는 요소',
                    suggestion: 'tabindex를 제거하거나 0으로 설정하세요',
                    selector: this.getElementSelector(element)
                });
            }
        });
    }

    // 포커스 관리 검증
    private validateFocusManagement(): void {
        const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        // 포커스 순서 검증
        const tabOrder = Array.from(focusableElements).map(el => ({
            element: el,
            tabIndex: parseInt(el.getAttribute('tabindex') || '0')
        })).sort((a, b) => a.tabIndex - b.tabIndex);

        // 논리적 순서 확인
        for (let i = 1; i < tabOrder.length; i++) {
            const prevElement = tabOrder[i - 1].element;
            const currentElement = tabOrder[i].element;

            if (!this.isElementBefore(prevElement, currentElement)) {
                this.addIssue({
                    id: `focus-order-${i}`,
                    type: 'warning',
                    category: 'accessibility',
                    severity: 'low',
                    element: currentElement.tagName.toLowerCase(),
                    message: '논리적이지 않은 포커스 순서',
                    suggestion: 'DOM 순서와 일치하도록 tabindex를 조정하세요',
                    selector: this.getElementSelector(currentElement)
                });
            }
        }
    }

    // 폼 검증
    private validateForms(): void {
        const forms = document.querySelectorAll('form');

        forms.forEach((form, formIndex) => {
            const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');

            inputs.forEach((input, inputIndex) => {
                const label = form.querySelector(`label[for="${input.id}"]`);
                if (!label && !input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
                    this.addIssue({
                        id: `form-label-${formIndex}-${inputIndex}`,
                        type: 'error',
                        category: 'usability',
                        severity: 'high',
                        element: 'input',
                        message: '라벨이 없는 필수 입력 필드',
                        suggestion: 'label 요소를 추가하거나 aria-label을 설정하세요',
                        selector: this.getElementSelector(input)
                    });
                }
            });
        });
    }

    // 로딩 상태 검증
    private validateLoadingStates(): void {
        const loadingElements = document.querySelectorAll('[data-loading="true"], .loading, .spinner');

        if (loadingElements.length === 0) {
            // 비동기 작업이 있는지 확인
            const asyncElements = document.querySelectorAll('[data-async], [data-fetch]');
            if (asyncElements.length > 0) {
                this.addIssue({
                    id: 'loading-states',
                    type: 'info',
                    category: 'usability',
                    severity: 'low',
                    element: 'div',
                    message: '로딩 상태 표시가 없습니다',
                    suggestion: '비동기 작업 시 로딩 상태를 표시하세요'
                });
            }
        }
    }

    // CSS 최적화 검증
    private validateCSSOptimization(): void {
        // 인라인 스타일 검증
        const inlineStyles = document.querySelectorAll('[style]');
        if (inlineStyles.length > 10) {
            this.addIssue({
                id: 'inline-styles',
                type: 'warning',
                category: 'performance',
                severity: 'low',
                element: 'div',
                message: '과도한 인라인 스타일 사용',
                suggestion: 'CSS 클래스를 사용하여 성능을 개선하세요'
            });
        }

        // 미사용 CSS 검증 (간단한 체크)
        const allClasses = new Set<string>();
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            el.className.split(' ').forEach(cls => {
                if (cls.trim()) allClasses.add(cls.trim());
            });
        });
    }

    // 색상 일관성 검증
    private validateColorConsistency(): void {
        const colorUsage = new Map<string, number>();
        const elements = document.querySelectorAll('*');

        elements.forEach(el => {
            const computedStyle = window.getComputedStyle(el);
            const color = computedStyle.color;
            if (color && color !== 'rgb(0, 0, 0)') {
                colorUsage.set(color, (colorUsage.get(color) || 0) + 1);
            }
        });

        if (colorUsage.size > 20) {
            this.addIssue({
                id: 'color-consistency',
                type: 'warning',
                category: 'consistency',
                severity: 'low',
                element: 'div',
                message: '너무 많은 색상 사용',
                suggestion: '디자인 시스템에 맞춰 색상을 통일하세요'
            });
        }
    }

    // 폰트 일관성 검증
    private validateFontConsistency(): void {
        const fontFamilies = new Set<string>();
        const elements = document.querySelectorAll('*');

        elements.forEach(el => {
            const computedStyle = window.getComputedStyle(el);
            const fontFamily = computedStyle.fontFamily;
            if (fontFamily) {
                fontFamilies.add(fontFamily);
            }
        });

        if (fontFamilies.size > 5) {
            this.addIssue({
                id: 'font-consistency',
                type: 'warning',
                category: 'consistency',
                severity: 'low',
                element: 'div',
                message: '너무 많은 폰트 패밀리 사용',
                suggestion: '2-3개의 폰트 패밀리로 통일하세요'
            });
        }
    }

    // 간격 일관성 검증
    private validateSpacingConsistency(): void {
        const marginValues = new Set<string>();
        const paddingValues = new Set<string>();
        const elements = document.querySelectorAll('*');

        elements.forEach(el => {
            const computedStyle = window.getComputedStyle(el);
            const margin = computedStyle.margin;
            const padding = computedStyle.padding;

            if (margin && margin !== '0px') marginValues.add(margin);
            if (padding && padding !== '0px') paddingValues.add(padding);
        });

        if (marginValues.size > 15 || paddingValues.size > 15) {
            this.addIssue({
                id: 'spacing-consistency',
                type: 'info',
                category: 'consistency',
                severity: 'low',
                element: 'div',
                message: '일관성 없는 간격 사용',
                suggestion: '8px 그리드 시스템을 사용하여 간격을 통일하세요'
            });
        }
    }

    // 버튼 스타일 일관성 검증
    private validateButtonConsistency(): void {
        const buttons = document.querySelectorAll('button');
        const buttonStyles = new Map<string, number>();

        buttons.forEach(button => {
            const computedStyle = window.getComputedStyle(button);
            const styleKey = `${computedStyle.backgroundColor}-${computedStyle.color}-${computedStyle.borderRadius}`;
            buttonStyles.set(styleKey, (buttonStyles.get(styleKey) || 0) + 1);
        });

        if (buttonStyles.size > 5) {
            this.addIssue({
                id: 'button-consistency',
                type: 'warning',
                category: 'consistency',
                severity: 'medium',
                element: 'button',
                message: '일관성 없는 버튼 스타일',
                suggestion: '버튼 컴포넌트를 사용하여 스타일을 통일하세요'
            });
        }
    }

    // 터치 타겟 검증
    private validateTouchTargets(): void {
        const touchElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');

        touchElements.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            if (rect.height < 44 || rect.width < 44) {
                this.addIssue({
                    id: `touch-target-${index}`,
                    type: 'warning',
                    category: 'responsive',
                    severity: 'medium',
                    element: element.tagName.toLowerCase(),
                    message: '터치하기 어려운 작은 요소',
                    suggestion: '최소 44x44px 크기로 설정하세요',
                    selector: this.getElementSelector(element)
                });
            }
        });
    }

    // 유틸리티 메서드들
    private addIssue(issue: UIUXIssue): void {
        this.issues.push(issue);
    }

    private getElementSelector(element: Element): string {
        if (element.id) return `#${element.id}`;
        if (element.className) return `.${element.className.split(' ')[0]}`;
        return element.tagName.toLowerCase();
    }

    private getBackgroundColor(element: Element): string {
        const computedStyle = window.getComputedStyle(element);
        let backgroundColor = computedStyle.backgroundColor;

        if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
            const parent = element.parentElement;
            if (parent) {
                return this.getBackgroundColor(parent);
            }
            return '#ffffff';
        }

        return backgroundColor;
    }

    private calculateContrast(color1: string, color2: string): number {
        // 간단한 대비 계산 (실제로는 더 정확한 계산 필요)
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);

        if (!rgb1 || !rgb2) return 0;

        const luminance1 = this.getLuminance(rgb1);
        const luminance2 = this.getLuminance(rgb2);

        const lighter = Math.max(luminance1, luminance2);
        const darker = Math.min(luminance1, luminance2);

        return (lighter + 0.05) / (darker + 0.05);
    }

    private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    private getLuminance(rgb: { r: number; g: number; b: number }): number {
        const { r, g, b } = rgb;
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    private isElementBefore(element1: Element, element2: Element): boolean {
        const position = element1.compareDocumentPosition(element2);
        return (position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    }

    private calculateScore(): void {
        let totalDeduction = 0;

        this.issues.forEach(issue => {
            switch (issue.type) {
                case 'error':
                    totalDeduction += issue.severity === 'high' ? 10 : issue.severity === 'medium' ? 5 : 2;
                    break;
                case 'warning':
                    totalDeduction += issue.severity === 'high' ? 5 : issue.severity === 'medium' ? 3 : 1;
                    break;
                case 'info':
                    totalDeduction += 0.5;
                    break;
            }
        });

        this.score = Math.max(0, 100 - totalDeduction);
    }

    private generateRecommendations(): string[] {
        const recommendations: string[] = [];
        const issueCounts = {
            accessibility: 0,
            usability: 0,
            performance: 0,
            consistency: 0,
            responsive: 0
        };

        this.issues.forEach(issue => {
            issueCounts[issue.category]++;
        });

        if (issueCounts.accessibility > 5) {
            recommendations.push('접근성 개선이 필요합니다. ARIA 라벨과 키보드 네비게이션을 확인하세요.');
        }

        if (issueCounts.usability > 3) {
            recommendations.push('사용성을 개선하세요. 버튼 크기와 폼 라벨을 확인하세요.');
        }

        if (issueCounts.performance > 2) {
            recommendations.push('성능 최적화가 필요합니다. 이미지 최적화와 CSS 정리를 고려하세요.');
        }

        if (issueCounts.consistency > 4) {
            recommendations.push('디자인 일관성을 개선하세요. 색상, 폰트, 간격을 통일하세요.');
        }

        if (issueCounts.responsive > 2) {
            recommendations.push('반응형 디자인을 개선하세요. 모바일 터치 영역을 확인하세요.');
        }

        return recommendations;
    }
}

// 전역 인스턴스
export const uiuxValidator = new UIUXValidator();
