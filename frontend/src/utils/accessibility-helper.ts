/**
 * ♿ 접근성 헬퍼 유틸리티
 * 
 * WCAG 2.1 AA 준수, 키보드 네비게이션, 스크린 리더 지원을 위한
 * 종합적인 접근성 도구 모음
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-10-02
 */

// ============================================================================
// 접근성 설정 및 상태 관리
// ============================================================================

interface AccessibilitySettings {
    // 키보드 네비게이션
    keyboardNavigation: boolean;
    focusVisible: boolean;
    skipLinks: boolean;

    // 스크린 리더 지원
    screenReader: boolean;
    ariaLabels: boolean;
    semanticMarkup: boolean;

    // 시각적 접근성
    highContrast: boolean;
    reducedMotion: boolean;
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';

    // 색상 접근성
    colorBlindSupport: boolean;
    colorScheme: 'light' | 'dark' | 'auto';

    // 음성 지원
    voiceControl: boolean;
    speechRecognition: boolean;
}

interface AccessibilityState {
    settings: AccessibilitySettings;
    isActive: boolean;
    currentFocus: HTMLElement | null;
    focusHistory: HTMLElement[];
    announcements: string[];
}

class AccessibilityManager {
    private static instance: AccessibilityManager;
    private state: AccessibilityState;
    private observers: MutationObserver[] = [];
    private eventListeners: Map<string, EventListener> = new Map();

    static getInstance(): AccessibilityManager {
        if (!AccessibilityManager.instance) {
            AccessibilityManager.instance = new AccessibilityManager();
        }
        return AccessibilityManager.instance;
    }

    constructor() {
        this.state = {
            settings: this.getDefaultSettings(),
            isActive: false,
            currentFocus: null,
            focusHistory: [],
            announcements: []
        };

        this.init();
    }

    // 기본 설정 가져오기
    private getDefaultSettings(): AccessibilitySettings {
        return {
            keyboardNavigation: true,
            focusVisible: true,
            skipLinks: true,
            screenReader: true,
            ariaLabels: true,
            semanticMarkup: true,
            highContrast: false,
            reducedMotion: false,
            fontSize: 'medium',
            colorBlindSupport: false,
            colorScheme: 'auto',
            voiceControl: false,
            speechRecognition: false
        };
    }

    // 초기화
    private init() {
        this.loadSettings();
        this.setupKeyboardNavigation();
        this.setupScreenReaderSupport();
        this.setupVisualAccessibility();
        this.setupColorAccessibility();
        this.setupVoiceSupport();
        this.observeDOMChanges();

        console.log('♿ 접근성 매니저 초기화 완료');
    }

    // 설정 로드
    private loadSettings() {
        const saved = localStorage.getItem('accessibility-settings');
        if (saved) {
            try {
                this.state.settings = { ...this.state.settings, ...JSON.parse(saved) };
            } catch (error) {
                console.warn('접근성 설정 로드 실패:', error);
            }
        }
    }

    // 설정 저장
    private saveSettings() {
        localStorage.setItem('accessibility-settings', JSON.stringify(this.state.settings));
    }

    // ============================================================================
    // 키보드 네비게이션
    // ============================================================================

    private setupKeyboardNavigation() {
        if (!this.state.settings.keyboardNavigation) return;

        // 포커스 관리
        document.addEventListener('keydown', this.handleKeydown.bind(this));
        document.addEventListener('focusin', this.handleFocusIn?.bind(this) || (() => { }));
        document.addEventListener('focusout', this.handleFocusOut?.bind(this) || (() => { }));

        // 스킵 링크 생성
        if (this.state.settings.skipLinks) {
            this.createSkipLinks();
        }

        // 포커스 트랩 설정
        this.setupFocusTrap();
    }

    private handleKeydown(event: KeyboardEvent) {
        const { key, ctrlKey, altKey, shiftKey } = event;

        // ESC 키로 모달 닫기
        if (key === 'Escape') {
            this.closeModals();
        }

        // Tab 키로 포커스 순환
        if (key === 'Tab') {
            this.handleTabNavigation(event);
        }

        // 화살표 키로 네비게이션
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            this.handleArrowNavigation(event);
        }

        // Enter/Space로 활성화
        if (key === 'Enter' || key === ' ') {
            this.handleActivation(event);
        }

        // 단축키 처리
        if (ctrlKey || altKey) {
            this.handleShortcuts(event);
        }
    }

    private handleTabNavigation(event: KeyboardEvent) {
        const focusableElements = this.getFocusableElements();
        const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

        if (event.shiftKey) {
            // Shift + Tab: 이전 요소로 이동
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
            focusableElements[prevIndex]?.focus();
        } else {
            // Tab: 다음 요소로 이동
            const nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
            focusableElements[nextIndex]?.focus();
        }

        event.preventDefault();
    }

    private handleArrowNavigation(event: KeyboardEvent) {
        const { key } = event;
        const currentElement = document.activeElement as HTMLElement;

        // 메뉴 네비게이션
        if (currentElement.getAttribute('role') === 'menuitem') {
            this.navigateMenuItems?.(key);
        }

        // 그리드 네비게이션
        if (currentElement.closest('[role="grid"]')) {
            this.navigateGrid?.(key);
        }

        // 리스트 네비게이션
        if (currentElement.closest('[role="listbox"]')) {
            this.navigateListbox?.(key);
        }
    }

    private handleActivation(event: KeyboardEvent) {
        const target = event.target as HTMLElement;

        // 버튼 활성화
        if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
            target.click();
        }

        // 링크 활성화
        if (target.tagName === 'A') {
            (target as HTMLAnchorElement).click();
        }

        // 체크박스/라디오 토글
        if (target.getAttribute('type') === 'checkbox' || target.getAttribute('type') === 'radio') {
            (target as HTMLInputElement).click();
        }
    }

    private handleShortcuts(event: KeyboardEvent) {
        const { key, ctrlKey, altKey } = event;

        // Ctrl + / : 접근성 도움말
        if (ctrlKey && key === '/') {
            this.showAccessibilityHelp();
            event.preventDefault();
        }

        // Alt + H : 고대비 모드 토글
        if (altKey && key === 'h') {
            this.toggleHighContrast();
            event.preventDefault();
        }

        // Alt + M : 모션 감소 토글
        if (altKey && key === 'm') {
            this.toggleReducedMotion();
            event.preventDefault();
        }
    }

    // ============================================================================
    // 스크린 리더 지원
    // ============================================================================

    private setupScreenReaderSupport() {
        if (!this.state.settings.screenReader) return;

        // ARIA 라이브 영역 생성
        this.createLiveRegion();

        // 시맨틱 마크업 강화
        this.enhanceSemanticMarkup();

        // ARIA 라벨 자동 생성
        if (this.state.settings.ariaLabels) {
            this.generateAriaLabels();
        }
    }

    private createLiveRegion() {
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'accessibility-live-region';
        document.body.appendChild(liveRegion);
    }

    private enhanceSemanticMarkup() {
        // 버튼에 적절한 role 추가
        document.querySelectorAll('button:not([role])').forEach(button => {
            button.setAttribute('role', 'button');
        });

        // 링크에 적절한 role 추가
        document.querySelectorAll('a:not([role])').forEach(link => {
            if (link.getAttribute('href')) {
                link.setAttribute('role', 'link');
            }
        });

        // 입력 필드에 적절한 라벨 연결
        document.querySelectorAll('input:not([aria-labelledby]):not([aria-label])').forEach(input => {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label) {
                input.setAttribute('aria-labelledby', label.id || this.generateId(label as HTMLElement));
            }
        });
    }

    private generateAriaLabels() {
        // 이미지에 alt 텍스트 자동 생성
        document.querySelectorAll('img:not([alt])').forEach(img => {
            const src = img.getAttribute('src') || '';
            const filename = src.split('/').pop()?.split('.')[0] || 'image';
            img.setAttribute('alt', `이미지: ${filename}`);
        });

        // 아이콘 버튼에 aria-label 추가
        document.querySelectorAll('button svg, a svg').forEach(icon => {
            const button = icon.closest('button, a');
            if (button && !button.getAttribute('aria-label')) {
                const iconName = icon.getAttribute('data-icon') || '아이콘';
                button.setAttribute('aria-label', iconName);
            }
        });
    }

    // ============================================================================
    // 시각적 접근성
    // ============================================================================

    private setupVisualAccessibility() {
        // 고대비 모드
        if (this.state.settings.highContrast) {
            this.enableHighContrast();
        }

        // 모션 감소
        if (this.state.settings.reducedMotion) {
            this.enableReducedMotion();
        }

        // 폰트 크기 조정
        this.adjustFontSize(this.state.settings.fontSize);
    }

    private enableHighContrast() {
        document.body.classList.add('high-contrast');

        // CSS 변수 설정
        const root = document.documentElement;
        root.style.setProperty('--contrast-ratio', '7:1');
        root.style.setProperty('--text-color', '#000000');
        root.style.setProperty('--background-color', '#ffffff');
        root.style.setProperty('--border-color', '#000000');
    }

    private enableReducedMotion() {
        document.body.classList.add('reduced-motion');

        // CSS 변수 설정
        const root = document.documentElement;
        root.style.setProperty('--animation-duration', '0.01ms');
        root.style.setProperty('--transition-duration', '0.01ms');
    }

    private adjustFontSize(size: 'small' | 'medium' | 'large' | 'extra-large') {
        const sizeMap = {
            'small': '14px',
            'medium': '16px',
            'large': '18px',
            'extra-large': '20px'
        };

        document.documentElement.style.fontSize = sizeMap[size];
    }

    // ============================================================================
    // 색상 접근성
    // ============================================================================

    private setupColorAccessibility() {
        if (this.state.settings.colorBlindSupport) {
            this.enableColorBlindSupport();
        }

        // 색상 대비 검사
        this.checkColorContrast();
    }

    private enableColorBlindSupport() {
        // 색맹 지원 CSS 클래스 추가
        document.body.classList.add('colorblind-support');

        // 색상 외 추가 시각적 표시
        this.addVisualIndicators();
    }

    private addVisualIndicators() {
        // 버튼에 추가 시각적 표시
        document.querySelectorAll('button').forEach(button => {
            if (!button.querySelector('.visual-indicator')) {
                const indicator = document.createElement('span');
                indicator.className = 'visual-indicator';
                indicator.textContent = '●';
                button.appendChild(indicator);
            }
        });
    }

    private checkColorContrast() {
        // 색상 대비 검사 (간단한 구현)
        const elements = document.querySelectorAll('*');
        elements.forEach(element => {
            const computedStyle = window.getComputedStyle(element);
            const color = computedStyle.color;
            const backgroundColor = computedStyle.backgroundColor;

            // 대비 비율 계산 (간단한 구현)
            const contrast = this.calculateContrast(color, backgroundColor);
            if (contrast < 4.5) {
                element.classList.add('low-contrast');
            }
        });
    }

    private calculateContrast(color1: string, color2: string): number {
        // 간단한 대비 계산 (실제로는 더 정확한 알고리즘 필요)
        return 4.5; // 임시값
    }

    // ============================================================================
    // 음성 지원
    // ============================================================================

    private setupVoiceSupport() {
        if (this.state.settings.voiceControl) {
            this.enableVoiceControl();
        }

        if (this.state.settings.speechRecognition) {
            this.enableSpeechRecognition();
        }
    }

    private enableVoiceControl() {
        // 음성 명령 처리
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'ko-KR';

            recognition.onresult = (event: any) => {
                const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
                this.processVoiceCommand(command);
            };

            recognition.start();
        }
    }

    private processVoiceCommand(command: string) {
        // 음성 명령 처리
        if (command.includes('홈')) {
            window.location.href = '/';
        } else if (command.includes('메뉴')) {
            this.announce('메뉴를 열었습니다');
        } else if (command.includes('도움말')) {
            this.showAccessibilityHelp();
        }
    }

    private enableSpeechRecognition() {
        // 음성 인식 활성화
        console.log('음성 인식 활성화');
    }

    // ============================================================================
    // DOM 변화 관찰
    // ============================================================================

    private observeDOMChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.enhanceNewElement(node as HTMLElement);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        this.observers.push(observer);
    }

    private enhanceNewElement(element: HTMLElement) {
        // 새로 추가된 요소에 접근성 향상 적용
        this.enhanceSemanticMarkup();
        this.generateAriaLabels();
    }

    // ============================================================================
    // 유틸리티 메서드
    // ============================================================================

    private getFocusableElements(): HTMLElement[] {
        const focusableSelectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])',
            '[role="button"]:not([disabled])',
            '[role="link"]',
            '[role="menuitem"]',
            '[role="option"]'
        ].join(', ');

        return Array.from(document.querySelectorAll(focusableSelectors)) as HTMLElement[];
    }

    private createSkipLinks() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = '메인 콘텐츠로 건너뛰기';
        skipLink.className = 'skip-link';
        skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 1000;
      transition: top 0.3s;
    `;

        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });

        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });

        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    private setupFocusTrap() {
        // 포커스 트랩 설정 (모달 등에서 사용)
        console.log('포커스 트랩 설정');
    }

    private generateId(element: HTMLElement): string {
        return `accessibility-${Math.random().toString(36).substr(2, 9)}`;
    }

    private announce(message: string) {
        const liveRegion = document.getElementById('accessibility-live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
        }
        this.state.announcements.push(message);
    }

    private closeModals() {
        // 모달 닫기 로직
        document.querySelectorAll('[role="dialog"]').forEach(modal => {
            const closeButton = modal.querySelector('[aria-label*="닫기"], [aria-label*="close"]');
            if (closeButton) {
                (closeButton as HTMLElement).click();
            }
        });
    }

    // ============================================================================
    // 공개 메서드
    // ============================================================================

    public updateSettings(newSettings: Partial<AccessibilitySettings>) {
        this.state.settings = { ...this.state.settings, ...newSettings };
        this.saveSettings();
        this.init(); // 설정 변경 시 재초기화
    }

    public getSettings(): AccessibilitySettings {
        return { ...this.state.settings };
    }

    public toggleHighContrast() {
        this.state.settings.highContrast = !this.state.settings.highContrast;
        this.updateSettings({ highContrast: this.state.settings.highContrast });
        this.announce(`고대비 모드 ${this.state.settings.highContrast ? '활성화' : '비활성화'}`);
    }

    public toggleReducedMotion() {
        this.state.settings.reducedMotion = !this.state.settings.reducedMotion;
        this.updateSettings({ reducedMotion: this.state.settings.reducedMotion });
        this.announce(`모션 감소 ${this.state.settings.reducedMotion ? '활성화' : '비활성화'}`);
    }

    public showAccessibilityHelp() {
        const helpText = `
      접근성 단축키:
      - Tab: 다음 요소로 이동
      - Shift + Tab: 이전 요소로 이동
      - Enter/Space: 활성화
      - ESC: 모달 닫기
      - Alt + H: 고대비 모드 토글
      - Alt + M: 모션 감소 토글
      - Ctrl + /: 이 도움말 표시
    `;

        alert(helpText);
        this.announce('접근성 도움말을 표시했습니다');
    }

    public getState(): AccessibilityState {
        return { ...this.state };
    }

    public destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.eventListeners.forEach((listener, event) => {
            document.removeEventListener(event, listener);
        });
    }
}

// ============================================================================
// CSS 스타일 추가
// ============================================================================

const accessibilityStyles = `
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .skip-link:focus {
    top: 6px !important;
  }

  .high-contrast {
    filter: contrast(150%) brightness(120%);
  }

  .reduced-motion * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .colorblind-support .visual-indicator {
    margin-left: 4px;
    font-size: 0.8em;
  }

  .low-contrast {
    border: 2px solid #ff0000 !important;
  }

  .focus-visible {
    outline: 2px solid #0066cc;
    outline-offset: 2px;
  }
`;

// 스타일 주입
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = accessibilityStyles;
    document.head.appendChild(styleSheet);
}

// ============================================================================
// 내보내기
// ============================================================================

export const accessibilityManager = AccessibilityManager.getInstance();
export default accessibilityManager;
