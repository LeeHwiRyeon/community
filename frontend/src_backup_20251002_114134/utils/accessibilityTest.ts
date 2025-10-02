interface AccessibilityTestResult {
    passed: boolean;
    message: string;
    element?: HTMLElement;
    severity: 'error' | 'warning' | 'info';
}

interface AccessibilityTestSuite {
    name: string;
    tests: AccessibilityTestResult[];
    score: number;
}

export class AccessibilityTester {
    private results: AccessibilityTestResult[] = [];

    // 색상 대비 테스트
    testColorContrast(element: HTMLElement): AccessibilityTestResult {
        const computedStyle = window.getComputedStyle(element);
        const backgroundColor = this.getBackgroundColor(element);
        const textColor = computedStyle.color;

        const contrast = this.calculateContrast(backgroundColor, textColor);
        const minContrast = 4.5; // WCAG AA 기준

        return {
            passed: contrast >= minContrast,
            message: `색상 대비: ${contrast.toFixed(2)}:1 (최소 ${minContrast}:1 필요)`,
            element,
            severity: contrast >= minContrast ? 'info' : 'error'
        };
    }

    // 키보드 접근성 테스트
    testKeyboardAccessibility(element: HTMLElement): AccessibilityTestResult {
        const tabIndex = element.getAttribute('tabindex');
        const isInteractive = this.isInteractiveElement(element);

        if (isInteractive && !tabIndex && tabIndex !== '0') {
            return {
                passed: false,
                message: '인터랙티브 요소에 키보드 접근성이 없습니다.',
                element,
                severity: 'error'
            };
        }

        return {
            passed: true,
            message: '키보드 접근성 양호',
            element,
            severity: 'info'
        };
    }

    // ARIA 라벨 테스트
    testAriaLabels(element: HTMLElement): AccessibilityTestResult {
        const hasAriaLabel = element.hasAttribute('aria-label');
        const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
        const hasVisibleText = element.textContent?.trim().length > 0;
        const isInteractive = this.isInteractiveElement(element);

        if (isInteractive && !hasAriaLabel && !hasAriaLabelledBy && !hasVisibleText) {
            return {
                passed: false,
                message: '인터랙티브 요소에 접근 가능한 이름이 없습니다.',
                element,
                severity: 'error'
            };
        }

        return {
            passed: true,
            message: 'ARIA 라벨 양호',
            element,
            severity: 'info'
        };
    }

    // 포커스 관리 테스트
    testFocusManagement(): AccessibilityTestResult {
        const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const tabOrder = Array.from(focusableElements).map(el => ({
            element: el as HTMLElement,
            tabIndex: parseInt(el.getAttribute('tabindex') || '0')
        })).sort((a, b) => a.tabIndex - b.tabIndex);

        const hasLogicalOrder = this.hasLogicalTabOrder(tabOrder);

        return {
            passed: hasLogicalOrder,
            message: hasLogicalOrder ? '포커스 순서가 논리적입니다.' : '포커스 순서가 논리적이지 않습니다.',
            severity: hasLogicalOrder ? 'info' : 'warning'
        };
    }

    // 전체 페이지 접근성 테스트
    testPageAccessibility(): AccessibilityTestSuite {
        this.results = [];

        // 모든 인터랙티브 요소 테스트
        const interactiveElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [role="button"], [role="link"]'
        );

        interactiveElements.forEach(element => {
            this.results.push(this.testKeyboardAccessibility(element as HTMLElement));
            this.results.push(this.testAriaLabels(element as HTMLElement));
            this.results.push(this.testColorContrast(element as HTMLElement));
        });

        // 포커스 관리 테스트
        this.results.push(this.testFocusManagement());

        // 랜드마크 테스트
        this.results.push(this.testLandmarks());

        const passedTests = this.results.filter(r => r.passed).length;
        const totalTests = this.results.length;
        const score = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

        return {
            name: '페이지 접근성 테스트',
            tests: this.results,
            score
        };
    }

    // 랜드마크 테스트
    private testLandmarks(): AccessibilityTestResult {
        const landmarks = document.querySelectorAll(
            'main, nav, header, footer, aside, section[aria-label], section[aria-labelledby]'
        );

        const hasMain = document.querySelector('main') !== null;
        const hasNavigation = document.querySelector('nav') !== null;

        if (!hasMain) {
            return {
                passed: false,
                message: '메인 콘텐츠 영역이 없습니다.',
                severity: 'error'
            };
        }

        if (!hasNavigation) {
            return {
                passed: false,
                message: '네비게이션 영역이 없습니다.',
                severity: 'warning'
            };
        }

        return {
            passed: true,
            message: '랜드마크 구조 양호',
            severity: 'info'
        };
    }

    // 배경색 계산
    private getBackgroundColor(element: HTMLElement): string {
        const computedStyle = window.getComputedStyle(element);
        let backgroundColor = computedStyle.backgroundColor;

        if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
            const parent = element.parentElement;
            if (parent) {
                return this.getBackgroundColor(parent);
            }
            return '#ffffff'; // 기본 배경색
        }

        return backgroundColor;
    }

    // 색상 대비 계산
    private calculateContrast(color1: string, color2: string): number {
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);

        if (!rgb1 || !rgb2) return 0;

        const luminance1 = this.getLuminance(rgb1);
        const luminance2 = this.getLuminance(rgb2);

        const lighter = Math.max(luminance1, luminance2);
        const darker = Math.min(luminance1, luminance2);

        return (lighter + 0.05) / (darker + 0.05);
    }

    // HEX를 RGB로 변환
    private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // 명도 계산
    private getLuminance(rgb: { r: number; g: number; b: number }): number {
        const { r, g, b } = rgb;
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    // 인터랙티브 요소 확인
    private isInteractiveElement(element: HTMLElement): boolean {
        const interactiveTags = ['button', 'a', 'input', 'select', 'textarea'];
        const interactiveRoles = ['button', 'link', 'textbox', 'combobox', 'checkbox', 'radio'];

        return interactiveTags.includes(element.tagName.toLowerCase()) ||
            interactiveRoles.includes(element.getAttribute('role') || '');
    }

    // 논리적 탭 순서 확인
    private hasLogicalTabOrder(tabOrder: Array<{ element: HTMLElement; tabIndex: number }>): boolean {
        // 간단한 검증: tabIndex가 0인 요소들이 DOM 순서를 따르는지 확인
        const zeroIndexElements = tabOrder.filter(item => item.tabIndex === 0);

        for (let i = 1; i < zeroIndexElements.length; i++) {
            const prevElement = zeroIndexElements[i - 1].element;
            const currentElement = zeroIndexElements[i].element;

            if (!prevElement.compareDocumentPosition(currentElement) & Node.DOCUMENT_POSITION_FOLLOWING) {
                return false;
            }
        }

        return true;
    }
}

// 전역 접근성 테스터 인스턴스
export const accessibilityTester = new AccessibilityTester();
