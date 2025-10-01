import { useCallback, useEffect, useState } from 'react';

interface ScreenReaderOptions {
    announceChanges?: boolean;
    announcePageChanges?: boolean;
    announceFocusChanges?: boolean;
}

export const useScreenReader = (options: ScreenReaderOptions = {}) => {
    const {
        announceChanges = true,
        announcePageChanges = true,
        announceFocusChanges = false
    } = options;

    const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);

    // 스크린 리더 감지
    useEffect(() => {
        const checkScreenReader = () => {
            // 스크린 리더 사용 여부를 감지하는 여러 방법들
            const hasScreenReader =
                window.speechSynthesis ||
                window.navigator.userAgent.includes('NVDA') ||
                window.navigator.userAgent.includes('JAWS') ||
                window.navigator.userAgent.includes('VoiceOver') ||
                window.navigator.userAgent.includes('TalkBack') ||
                // 접근성 API 지원 여부
                'speechSynthesis' in window ||
                'speechRecognition' in window;

            setIsScreenReaderActive(!!hasScreenReader);
        };

        checkScreenReader();

        // 주기적으로 재확인
        const interval = setInterval(checkScreenReader, 5000);
        return () => clearInterval(interval);
    }, []);

    // 라이브 영역에 메시지 전달
    const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
        if (!announceChanges) return;

        const liveRegion = document.getElementById('live-region') || createLiveRegion();
        liveRegion.setAttribute('aria-live', priority);
        liveRegion.textContent = message;

        // 메시지 전달 후 정리
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    }, [announceChanges]);

    // 페이지 변경 알림
    const announcePageChange = useCallback((pageTitle: string) => {
        if (!announcePageChanges) return;
        announce(`페이지가 변경되었습니다: ${pageTitle}`, 'polite');
    }, [announce, announcePageChanges]);

    // 포커스 변경 알림
    const announceFocusChange = useCallback((elementDescription: string) => {
        if (!announceFocusChanges) return;
        announce(`포커스: ${elementDescription}`, 'polite');
    }, [announce, announceFocusChanges]);

    // 라이브 영역 생성
    const createLiveRegion = () => {
        const liveRegion = document.createElement('div');
        liveRegion.id = 'live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.position = 'absolute';
        liveRegion.style.left = '-10000px';
        liveRegion.style.width = '1px';
        liveRegion.style.height = '1px';
        liveRegion.style.overflow = 'hidden';
        document.body.appendChild(liveRegion);
        return liveRegion;
    };

    // 접근성 개선을 위한 포커스 관리
    const focusElement = useCallback((selector: string) => {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
            element.focus();
            if (announceFocusChanges) {
                const label = element.getAttribute('aria-label') ||
                    element.textContent ||
                    element.getAttribute('title') ||
                    '요소';
                announceFocusChange(label);
            }
        }
    }, [announceFocusChanges, announceFocusChange]);

    return {
        isScreenReaderActive,
        announce,
        announcePageChange,
        announceFocusChange,
        focusElement
    };
};
