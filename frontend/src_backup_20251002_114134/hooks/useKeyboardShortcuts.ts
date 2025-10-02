import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcut {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    action: () => void;
    description?: string;
    preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
    enableGlobal?: boolean;
    enableInInputs?: boolean;
    enableInTextareas?: boolean;
    enableInContentEditable?: boolean;
    preventDefault?: boolean;
}

/**
 * 키보드 단축키 훅
 * 전역 및 컴포넌트별 키보드 단축키를 관리합니다.
 */
export const useKeyboardShortcuts = (
    shortcuts: KeyboardShortcut[],
    options: UseKeyboardShortcutsOptions = {}
) => {
    const {
        enableGlobal = true,
        enableInInputs = false,
        enableInTextareas = false,
        enableInContentEditable = false,
        preventDefault = true,
    } = options;

    const shortcutsRef = useRef(shortcuts);
    shortcutsRef.current = shortcuts;

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // 입력 필드에서의 단축키 비활성화 옵션
        const target = event.target as HTMLElement;
        const isInput = target.tagName === 'INPUT';
        const isTextarea = target.tagName === 'TEXTAREA';
        const isContentEditable = target.contentEditable === 'true';

        if (isInput && !enableInInputs) return;
        if (isTextarea && !enableInTextareas) return;
        if (isContentEditable && !enableInContentEditable) return;

        // 단축키 매칭
        const matchingShortcut = shortcutsRef.current.find(shortcut => {
            const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
            const ctrlMatch = !!shortcut.ctrlKey === event.ctrlKey;
            const shiftMatch = !!shortcut.shiftKey === event.shiftKey;
            const altMatch = !!shortcut.altKey === event.altKey;
            const metaMatch = !!shortcut.metaKey === event.metaKey;

            return keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch;
        });

        if (matchingShortcut) {
            if (preventDefault || matchingShortcut.preventDefault !== false) {
                event.preventDefault();
            }

            matchingShortcut.action();
        }
    }, [enableInInputs, enableInTextareas, enableInContentEditable, preventDefault]);

    useEffect(() => {
        if (enableGlobal) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [enableGlobal, handleKeyDown]);

    return {
        handleKeyDown,
    };
};

/**
 * 전역 키보드 단축키 관리자
 */
class KeyboardShortcutManager {
    private shortcuts: Map<string, KeyboardShortcut> = new Map();
    private isEnabled = true;

    register(shortcut: KeyboardShortcut) {
        const key = this.generateKey(shortcut);
        this.shortcuts.set(key, shortcut);
    }

    unregister(shortcut: KeyboardShortcut) {
        const key = this.generateKey(shortcut);
        this.shortcuts.delete(key);
    }

    clear() {
        this.shortcuts.clear();
    }

    enable() {
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
    }

    private generateKey(shortcut: KeyboardShortcut): string {
        const parts = [
            shortcut.ctrlKey ? 'ctrl' : '',
            shortcut.shiftKey ? 'shift' : '',
            shortcut.altKey ? 'alt' : '',
            shortcut.metaKey ? 'meta' : '',
            shortcut.key.toLowerCase(),
        ].filter(Boolean);

        return parts.join('+');
    }

    private handleKeyDown = (event: KeyboardEvent) => {
        if (!this.isEnabled) return;

        const key = this.generateKey({
            key: event.key,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            metaKey: event.metaKey,
            action: () => { },
        });

        const shortcut = this.shortcuts.get(key);
        if (shortcut) {
            if (shortcut.preventDefault !== false) {
                event.preventDefault();
            }
            shortcut.action();
        }
    };

    start() {
        document.addEventListener('keydown', this.handleKeyDown);
    }

    stop() {
        document.removeEventListener('keydown', this.handleKeyDown);
    }
}

// 전역 단축키 관리자 인스턴스
export const globalShortcutManager = new KeyboardShortcutManager();

// 일반적인 단축키들
export const commonShortcuts = {
    // 네비게이션
    goHome: {
        key: 'h',
        ctrlKey: true,
        action: () => window.location.href = '/',
        description: '홈으로 이동',
    },
    goBack: {
        key: 'ArrowLeft',
        altKey: true,
        action: () => window.history.back(),
        description: '뒤로 가기',
    },
    goForward: {
        key: 'ArrowRight',
        altKey: true,
        action: () => window.history.forward(),
        description: '앞으로 가기',
    },

    // 검색
    focusSearch: {
        key: '/',
        action: () => {
            const searchInput = document.querySelector('input[type="search"], input[placeholder*="검색"]') as HTMLInputElement;
            if (searchInput) {
                searchInput.focus();
            }
        },
        description: '검색창 포커스',
    },

    // 편집
    save: {
        key: 's',
        ctrlKey: true,
        action: () => {
            const saveButton = document.querySelector('button[type="submit"], button[data-action="save"]') as HTMLButtonElement;
            if (saveButton) {
                saveButton.click();
            }
        },
        description: '저장',
    },

    // 새로고침
    refresh: {
        key: 'r',
        ctrlKey: true,
        action: () => window.location.reload(),
        description: '새로고침',
    },

    // 도움말
    help: {
        key: '?',
        action: () => {
            // 도움말 모달 또는 페이지 표시
            console.log('도움말 표시');
        },
        description: '도움말 표시',
    },

    // 닫기
    close: {
        key: 'Escape',
        action: () => {
            const closeButton = document.querySelector('button[aria-label="닫기"], button[data-action="close"]') as HTMLButtonElement;
            if (closeButton) {
                closeButton.click();
            }
        },
        description: '닫기',
    },
};

// 단축키 도움말 컴포넌트용 데이터
export const getShortcutHelp = (shortcuts: KeyboardShortcut[]) => {
    return shortcuts.map(shortcut => ({
        keys: [
            shortcut.ctrlKey && 'Ctrl',
            shortcut.shiftKey && 'Shift',
            shortcut.altKey && 'Alt',
            shortcut.metaKey && 'Cmd',
            shortcut.key,
        ].filter(Boolean).join(' + '),
        description: shortcut.description || '설명 없음',
    }));
};

export default useKeyboardShortcuts;
