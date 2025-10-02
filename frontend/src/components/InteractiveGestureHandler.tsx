/**
 * 👆 인터랙티브 제스처 핸들러
 * 
 * 터치 제스처, 마우스 인터랙션, 키보드 단축키를 지원하는
 * 고급 인터랙션 시스템
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-10-02
 */

import React, {
    useState,
    useEffect,
    useCallback,
    useRef,
    createContext,
    useContext,
    ReactNode,
    TouchEvent,
    MouseEvent,
    KeyboardEvent
} from 'react';
import {
    Box,
    Snackbar,
    Alert,
    Chip,
    Typography,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { styled } from '@mui/system';

// 제스처 타입 정의
export type GestureType =
    | 'swipe-left'
    | 'swipe-right'
    | 'swipe-up'
    | 'swipe-down'
    | 'pinch-in'
    | 'pinch-out'
    | 'long-press'
    | 'double-tap'
    | 'triple-tap'
    | 'pan'
    | 'rotate';

export type KeyboardShortcut = {
    key: string;
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
    description: string;
    action: () => void;
};

export interface GestureEvent {
    type: GestureType;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    deltaX: number;
    deltaY: number;
    distance: number;
    duration: number;
    velocity: number;
    scale?: number;
    rotation?: number;
    target: HTMLElement;
}

export interface GestureHandlerOptions {
    swipeThreshold?: number;
    longPressDelay?: number;
    doubleTapDelay?: number;
    pinchThreshold?: number;
    velocityThreshold?: number;
    preventDefaults?: boolean;
    enabledGestures?: GestureType[];
}

interface GestureContextValue {
    registerGestureHandler: (
        element: HTMLElement,
        gestures: Partial<Record<GestureType, (event: GestureEvent) => void>>,
        options?: GestureHandlerOptions
    ) => () => void;
    registerKeyboardShortcuts: (shortcuts: KeyboardShortcut[]) => () => void;
    showGestureHint: (gesture: GestureType, message: string) => void;
    isGestureEnabled: (gesture: GestureType) => boolean;
    settings: GestureSettings;
    updateSettings: (newSettings: Partial<GestureSettings>) => void;
}

interface GestureSettings {
    touchGestures: boolean;
    keyboardShortcuts: boolean;
    gestureHints: boolean;
    hapticFeedback: boolean;
    soundFeedback: boolean;
    swipeSensitivity: number;
    longPressDuration: number;
    doubleTapSpeed: number;
}

// 기본 설정
const DEFAULT_GESTURE_SETTINGS: GestureSettings = {
    touchGestures: true,
    keyboardShortcuts: true,
    gestureHints: true,
    hapticFeedback: true,
    soundFeedback: false,
    swipeSensitivity: 50,
    longPressDuration: 500,
    doubleTapSpeed: 300
};

// 스타일드 컴포넌트
const GestureHintContainer = styled(Box)(({ theme }) => ({
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 2000,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(2),
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    borderRadius: theme.shape.borderRadius * 2,
    backdropFilter: 'blur(10px)',
    animation: 'gestureHintFadeIn 0.3s ease-out',

    '@keyframes gestureHintFadeIn': {
        '0%': {
            opacity: 0,
            transform: 'translate(-50%, -50%) scale(0.8)'
        },
        '100%': {
            opacity: 1,
            transform: 'translate(-50%, -50%) scale(1)'
        }
    }
}));

const KeyboardShortcutIndicator = styled(Box)(({ theme }) => ({
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
    zIndex: 1500,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    maxWidth: 300,
    opacity: 0.8,
    transition: 'opacity 0.3s ease',

    '&:hover': {
        opacity: 1
    }
}));

// 제스처 컨텍스트
const GestureContext = createContext<GestureContextValue | undefined>(undefined);

// 커스텀 훅
export const useGestures = (): GestureContextValue => {
    const context = useContext(GestureContext);
    if (!context) {
        throw new Error('useGestures must be used within GestureProvider');
    }
    return context;
};

// 제스처 감지 클래스
class GestureDetector {
    private element: HTMLElement;
    private handlers: Partial<Record<GestureType, (event: GestureEvent) => void>>;
    private options: GestureHandlerOptions;
    private touchStartTime: number = 0;
    private touchStartPos: { x: number; y: number } = { x: 0, y: 0 };
    private touchEndPos: { x: number; y: number } = { x: 0, y: 0 };
    private lastTapTime: number = 0;
    private tapCount: number = 0;
    private longPressTimer: NodeJS.Timeout | null = null;
    private initialDistance: number = 0;
    private initialScale: number = 1;
    private initialRotation: number = 0;

    constructor(
        element: HTMLElement,
        handlers: Partial<Record<GestureType, (event: GestureEvent) => void>>,
        options: GestureHandlerOptions = {}
    ) {
        this.element = element;
        this.handlers = handlers;
        this.options = {
            swipeThreshold: 50,
            longPressDelay: 500,
            doubleTapDelay: 300,
            pinchThreshold: 10,
            velocityThreshold: 0.5,
            preventDefaults: true,
            enabledGestures: Object.keys(handlers) as GestureType[],
            ...options
        };

        this.attachEventListeners();
    }

    private attachEventListeners(): void {
        // 터치 이벤트
        this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });

        // 마우스 이벤트 (데스크톱 지원)
        this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // 휠 이벤트 (핀치 줌 시뮬레이션)
        this.element.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    }

    private handleTouchStart(event: TouchEvent): void {
        if (this.options.preventDefaults) {
            event.preventDefault();
        }

        const touch = event.touches[0];
        this.touchStartTime = Date.now();
        this.touchStartPos = { x: touch.clientX, y: touch.clientY };

        // 멀티터치 감지
        if (event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            this.initialDistance = this.getDistance(touch1, touch2);
            this.initialRotation = this.getRotation(touch1, touch2);
        }

        // 롱 프레스 타이머 시작
        if (this.handlers['long-press']) {
            this.longPressTimer = setTimeout(() => {
                this.triggerGesture('long-press');
                this.vibrate(100);
            }, this.options.longPressDelay);
        }
    }

    private handleTouchMove(event: TouchEvent): void {
        if (this.options.preventDefaults) {
            event.preventDefault();
        }

        // 롱 프레스 취소
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        // 핀치 제스처 감지
        if (event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            const currentDistance = this.getDistance(touch1, touch2);
            const currentRotation = this.getRotation(touch1, touch2);

            const scale = currentDistance / this.initialDistance;
            const rotation = currentRotation - this.initialRotation;

            if (Math.abs(scale - 1) > 0.1) {
                const gestureType = scale > 1 ? 'pinch-out' : 'pinch-in';
                if (this.handlers[gestureType]) {
                    this.triggerGesture(gestureType, { scale, rotation });
                }
            }
        }
    }

    private handleTouchEnd(event: TouchEvent): void {
        if (this.options.preventDefaults) {
            event.preventDefault();
        }

        // 롱 프레스 타이머 정리
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        const touch = event.changedTouches[0];
        this.touchEndPos = { x: touch.clientX, y: touch.clientY };

        const deltaX = this.touchEndPos.x - this.touchStartPos.x;
        const deltaY = this.touchEndPos.y - this.touchStartPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const duration = Date.now() - this.touchStartTime;
        const velocity = distance / duration;

        // 탭 제스처 감지
        if (distance < 10 && duration < 300) {
            this.handleTap();
            return;
        }

        // 스와이프 제스처 감지
        if (distance > this.options.swipeThreshold! && velocity > this.options.velocityThreshold!) {
            let gestureType: GestureType;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                gestureType = deltaX > 0 ? 'swipe-right' : 'swipe-left';
            } else {
                gestureType = deltaY > 0 ? 'swipe-down' : 'swipe-up';
            }

            if (this.handlers[gestureType]) {
                this.triggerGesture(gestureType, { velocity });
                this.vibrate(50);
            }
        }
    }

    private handleTap(): void {
        const now = Date.now();

        if (now - this.lastTapTime < this.options.doubleTapDelay!) {
            this.tapCount++;
        } else {
            this.tapCount = 1;
        }

        this.lastTapTime = now;

        // 딜레이 후 탭 처리
        setTimeout(() => {
            if (this.tapCount === 2 && this.handlers['double-tap']) {
                this.triggerGesture('double-tap');
                this.vibrate(30);
            } else if (this.tapCount === 3 && this.handlers['triple-tap']) {
                this.triggerGesture('triple-tap');
                this.vibrate([30, 30, 30]);
            }
            this.tapCount = 0;
        }, this.options.doubleTapDelay);
    }

    private handleMouseDown(event: MouseEvent): void {
        // 마우스 이벤트를 터치 이벤트로 변환
        const fakeTouch = {
            clientX: event.clientX,
            clientY: event.clientY
        };

        this.handleTouchStart({
            touches: [fakeTouch],
            changedTouches: [fakeTouch],
            preventDefault: () => event.preventDefault()
        } as any);
    }

    private handleMouseMove(event: MouseEvent): void {
        // 드래그 중일 때만 처리
        if (event.buttons === 1) {
            const fakeTouch = {
                clientX: event.clientX,
                clientY: event.clientY
            };

            this.handleTouchMove({
                touches: [fakeTouch],
                preventDefault: () => event.preventDefault()
            } as any);
        }
    }

    private handleMouseUp(event: MouseEvent): void {
        const fakeTouch = {
            clientX: event.clientX,
            clientY: event.clientY
        };

        this.handleTouchEnd({
            changedTouches: [fakeTouch],
            preventDefault: () => event.preventDefault()
        } as any);
    }

    private handleWheel(event: WheelEvent): void {
        if (event.ctrlKey || event.metaKey) {
            event.preventDefault();

            const gestureType = event.deltaY < 0 ? 'pinch-out' : 'pinch-in';
            if (this.handlers[gestureType]) {
                this.triggerGesture(gestureType, {
                    scale: event.deltaY < 0 ? 1.1 : 0.9
                });
            }
        }
    }

    private triggerGesture(type: GestureType, extraData: any = {}): void {
        const handler = this.handlers[type];
        if (!handler) return;

        const gestureEvent: GestureEvent = {
            type,
            startX: this.touchStartPos.x,
            startY: this.touchStartPos.y,
            endX: this.touchEndPos.x,
            endY: this.touchEndPos.y,
            deltaX: this.touchEndPos.x - this.touchStartPos.x,
            deltaY: this.touchEndPos.y - this.touchStartPos.y,
            distance: Math.sqrt(
                Math.pow(this.touchEndPos.x - this.touchStartPos.x, 2) +
                Math.pow(this.touchEndPos.y - this.touchStartPos.y, 2)
            ),
            duration: Date.now() - this.touchStartTime,
            velocity: 0,
            target: this.element,
            ...extraData
        };

        handler(gestureEvent);
    }

    private getDistance(touch1: Touch, touch2: Touch): number {
        return Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
    }

    private getRotation(touch1: Touch, touch2: Touch): number {
        return Math.atan2(
            touch2.clientY - touch1.clientY,
            touch2.clientX - touch1.clientX
        ) * 180 / Math.PI;
    }

    private vibrate(pattern: number | number[]): void {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    public destroy(): void {
        this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
        this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
        this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
        this.element.removeEventListener('mousedown', this.handleMouseDown.bind(this));
        this.element.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        this.element.removeEventListener('mouseup', this.handleMouseUp.bind(this));
        this.element.removeEventListener('wheel', this.handleWheel.bind(this));

        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
        }
    }
}

// 제스처 프로바이더
interface GestureProviderProps {
    children: ReactNode;
}

export const GestureProvider: React.FC<GestureProviderProps> = ({ children }) => {
    const [settings, setSettings] = useState<GestureSettings>(() => {
        try {
            const saved = localStorage.getItem('gesture-settings');
            return saved ? { ...DEFAULT_GESTURE_SETTINGS, ...JSON.parse(saved) } : DEFAULT_GESTURE_SETTINGS;
        } catch {
            return DEFAULT_GESTURE_SETTINGS;
        }
    });

    const [gestureHint, setGestureHint] = useState<{ gesture: GestureType; message: string } | null>(null);
    const [activeShortcuts, setActiveShortcuts] = useState<KeyboardShortcut[]>([]);
    const gestureDetectors = useRef<Map<HTMLElement, GestureDetector>>(new Map());
    const keyboardHandlers = useRef<Map<string, KeyboardShortcut>>(new Map());

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // 제스처 핸들러 등록
    const registerGestureHandler = useCallback((
        element: HTMLElement,
        gestures: Partial<Record<GestureType, (event: GestureEvent) => void>>,
        options?: GestureHandlerOptions
    ) => {
        if (!settings.touchGestures) return () => { };

        const detector = new GestureDetector(element, gestures, options);
        gestureDetectors.current.set(element, detector);

        return () => {
            detector.destroy();
            gestureDetectors.current.delete(element);
        };
    }, [settings.touchGestures]);

    // 키보드 단축키 등록
    const registerKeyboardShortcuts = useCallback((shortcuts: KeyboardShortcut[]) => {
        if (!settings.keyboardShortcuts) return () => { };

        shortcuts.forEach(shortcut => {
            const key = `${shortcut.ctrlKey ? 'ctrl+' : ''}${shortcut.altKey ? 'alt+' : ''}${shortcut.shiftKey ? 'shift+' : ''}${shortcut.metaKey ? 'meta+' : ''}${shortcut.key.toLowerCase()}`;
            keyboardHandlers.current.set(key, shortcut);
        });

        setActiveShortcuts(prev => [...prev, ...shortcuts]);

        return () => {
            shortcuts.forEach(shortcut => {
                const key = `${shortcut.ctrlKey ? 'ctrl+' : ''}${shortcut.altKey ? 'alt+' : ''}${shortcut.shiftKey ? 'shift+' : ''}${shortcut.metaKey ? 'meta+' : ''}${shortcut.key.toLowerCase()}`;
                keyboardHandlers.current.delete(key);
            });

            setActiveShortcuts(prev => prev.filter(s => !shortcuts.includes(s)));
        };
    }, [settings.keyboardShortcuts]);

    // 제스처 힌트 표시
    const showGestureHint = useCallback((gesture: GestureType, message: string) => {
        if (!settings.gestureHints) return;

        setGestureHint({ gesture, message });
        setTimeout(() => setGestureHint(null), 2000);
    }, [settings.gestureHints]);

    // 제스처 활성화 여부 확인
    const isGestureEnabled = useCallback((gesture: GestureType) => {
        return settings.touchGestures;
    }, [settings.touchGestures]);

    // 설정 업데이트
    const updateSettings = useCallback((newSettings: Partial<GestureSettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('gesture-settings', JSON.stringify(updated));
            return updated;
        });
    }, []);

    // 키보드 이벤트 핸들러
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const key = `${event.ctrlKey ? 'ctrl+' : ''}${event.altKey ? 'alt+' : ''}${event.shiftKey ? 'shift+' : ''}${event.metaKey ? 'meta+' : ''}${event.key.toLowerCase()}`;

            const handler = keyboardHandlers.current.get(key);
            if (handler) {
                event.preventDefault();
                handler.action();

                if (settings.hapticFeedback && 'vibrate' in navigator) {
                    navigator.vibrate(20);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown as any);
        return () => document.removeEventListener('keydown', handleKeyDown as any);
    }, [settings.hapticFeedback]);

    const contextValue: GestureContextValue = {
        registerGestureHandler,
        registerKeyboardShortcuts,
        showGestureHint,
        isGestureEnabled,
        settings,
        updateSettings
    };

    return (
        <GestureContext.Provider value={contextValue}>
            {children}

            {/* 제스처 힌트 */}
            {gestureHint && (
                <GestureHintContainer>
                    <Typography variant="body1" align="center">
                        {gestureHint.message}
                    </Typography>
                </GestureHintContainer>
            )}

            {/* 키보드 단축키 표시 (데스크톱에서만) */}
            {!isMobile && activeShortcuts.length > 0 && (
                <KeyboardShortcutIndicator>
                    <Typography variant="caption" gutterBottom>
                        키보드 단축키:
                    </Typography>
                    {activeShortcuts.slice(0, 5).map((shortcut, index) => (
                        <Chip
                            key={index}
                            size="small"
                            label={`${shortcut.ctrlKey ? 'Ctrl+' : ''}${shortcut.altKey ? 'Alt+' : ''}${shortcut.shiftKey ? 'Shift+' : ''}${shortcut.key.toUpperCase()}: ${shortcut.description}`}
                            variant="outlined"
                        />
                    ))}
                </KeyboardShortcutIndicator>
            )}
        </GestureContext.Provider>
    );
};

// 제스처 훅 (개별 컴포넌트에서 사용)
export const useGestureHandler = (
    gestures: Partial<Record<GestureType, (event: GestureEvent) => void>>,
    options?: GestureHandlerOptions
) => {
    const { registerGestureHandler } = useGestures();
    const elementRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!elementRef.current) return;

        return registerGestureHandler(elementRef.current, gestures, options);
    }, [registerGestureHandler, gestures, options]);

    return elementRef;
};

// 키보드 단축키 훅
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
    const { registerKeyboardShortcuts } = useGestures();

    useEffect(() => {
        return registerKeyboardShortcuts(shortcuts);
    }, [registerKeyboardShortcuts, shortcuts]);
};

export default GestureProvider;
