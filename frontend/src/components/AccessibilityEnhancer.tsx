/**
 * ♿ 접근성 향상 컴포넌트
 * 
 * WCAG 2.1 AA 준수를 위한 접근성 기능 제공
 * 스크린 리더, 키보드 네비게이션, 고대비 모드 등을 지원
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
    ReactNode
} from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Switch,
    FormControlLabel,
    Slider,
    Divider,
    IconButton,
    Tooltip,
    Alert,
    Snackbar,
    Fab,
    useTheme
} from '@mui/material';
import {
    Accessibility as AccessibilityIcon,
    VolumeUp as VolumeUpIcon,
    Visibility as VisibilityIcon,
    KeyboardAlt as KeyboardIcon,
    Settings as SettingsIcon,
    Close as CloseIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    Contrast as ContrastIcon,
    RecordVoiceOver as VoiceIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';

// 접근성 설정 인터페이스
interface AccessibilitySettings {
    screenReader: boolean;
    keyboardNavigation: boolean;
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    voiceAnnouncements: boolean;
    focusIndicators: boolean;
    skipLinks: boolean;
    textSpacing: number;
    lineHeight: number;
    fontSize: number;
}

interface AccessibilityContextValue {
    settings: AccessibilitySettings;
    updateSetting: (key: keyof AccessibilitySettings, value: any) => void;
    announceToScreenReader: (message: string) => void;
    focusElement: (selector: string) => void;
    isAccessibilityMode: boolean;
}

// 기본 설정
const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
    screenReader: false,
    keyboardNavigation: true,
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    voiceAnnouncements: false,
    focusIndicators: true,
    skipLinks: true,
    textSpacing: 1,
    lineHeight: 1.5,
    fontSize: 1
};

// 스타일드 컴포넌트
const AccessibilityFab = styled(Fab)(({ theme }) => ({
    position: 'fixed',
    bottom: theme.spacing(2),
    left: theme.spacing(2),
    zIndex: 1300,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
        backgroundColor: theme.palette.primary.dark,
    },
    '&:focus': {
        outline: `3px solid ${theme.palette.secondary.main}`,
        outlineOffset: '2px'
    }
}));

const SkipLink = styled('a')(({ theme }) => ({
    position: 'absolute',
    top: '-40px',
    left: '6px',
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: '8px',
    textDecoration: 'none',
    borderRadius: '4px',
    zIndex: 1400,
    '&:focus': {
        top: '6px'
    }
}));

const LiveRegion = styled('div')({
    position: 'absolute',
    left: '-10000px',
    width: '1px',
    height: '1px',
    overflow: 'hidden'
});

// 접근성 컨텍스트
const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

// 커스텀 훅
export const useAccessibility = (): AccessibilityContextValue => {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error('useAccessibility must be used within AccessibilityProvider');
    }
    return context;
};

// 키보드 네비게이션 훅
const useKeyboardNavigation = (enabled: boolean) => {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            // Tab 키로 포커스 이동 시 시각적 표시
            if (event.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }

            // Escape 키로 모달/드롭다운 닫기
            if (event.key === 'Escape') {
                const activeElement = document.activeElement as HTMLElement;
                if (activeElement && activeElement.blur) {
                    activeElement.blur();
                }
            }

            // 화살표 키로 리스트 네비게이션
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                const focusableElements = document.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as Element);

                if (currentIndex !== -1) {
                    let nextIndex = currentIndex;

                    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
                        nextIndex = (currentIndex + 1) % focusableElements.length;
                    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
                        nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
                    }

                    (focusableElements[nextIndex] as HTMLElement).focus();
                    event.preventDefault();
                }
            }
        };

        const handleMouseDown = () => {
            document.body.classList.remove('keyboard-navigation');
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleMouseDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, [enabled]);
};

// 스크린 리더 지원 훅
const useScreenReader = () => {
    const [announcements, setAnnouncements] = useState<string[]>([]);

    const announce = useCallback((message: string) => {
        setAnnouncements(prev => [...prev, message]);

        // 음성 합성 API 사용 (지원되는 경우)
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.rate = 0.8;
            utterance.pitch = 1;
            utterance.volume = 0.8;
            speechSynthesis.speak(utterance);
        }

        // 일정 시간 후 제거
        setTimeout(() => {
            setAnnouncements(prev => prev.slice(1));
        }, 3000);
    }, []);

    return { announcements, announce };
};

// 접근성 프로바이더
interface AccessibilityProviderProps {
    children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
    const [settings, setSettings] = useState<AccessibilitySettings>(() => {
        try {
            const saved = localStorage.getItem('accessibility-settings');
            return saved ? { ...DEFAULT_ACCESSIBILITY_SETTINGS, ...JSON.parse(saved) } : DEFAULT_ACCESSIBILITY_SETTINGS;
        } catch {
            return DEFAULT_ACCESSIBILITY_SETTINGS;
        }
    });

    const { announcements, announce } = useScreenReader();

    // 키보드 네비게이션 활성화
    useKeyboardNavigation(settings.keyboardNavigation);

    // 설정 업데이트
    const updateSetting = useCallback((key: keyof AccessibilitySettings, value: any) => {
        setSettings(prev => {
            const updated = { ...prev, [key]: value };
            localStorage.setItem('accessibility-settings', JSON.stringify(updated));
            return updated;
        });
    }, []);

    // 요소에 포커스
    const focusElement = useCallback((selector: string) => {
        const element = document.querySelector(selector) as HTMLElement;
        if (element && element.focus) {
            element.focus();
        }
    }, []);

    // 접근성 모드 여부
    const isAccessibilityMode = settings.screenReader || settings.highContrast || settings.largeText;

    // CSS 변수 업데이트
    useEffect(() => {
        const root = document.documentElement;

        root.style.setProperty('--accessibility-font-size', `${settings.fontSize}em`);
        root.style.setProperty('--accessibility-line-height', settings.lineHeight.toString());
        root.style.setProperty('--accessibility-text-spacing', `${settings.textSpacing}px`);

        // 고대비 모드
        if (settings.highContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }

        // 큰 텍스트 모드
        if (settings.largeText) {
            document.body.classList.add('large-text');
        } else {
            document.body.classList.remove('large-text');
        }

        // 모션 감소
        if (settings.reducedMotion) {
            document.body.classList.add('reduced-motion');
        } else {
            document.body.classList.remove('reduced-motion');
        }
    }, [settings]);

    const contextValue: AccessibilityContextValue = {
        settings,
        updateSetting,
        announceToScreenReader: announce,
        focusElement,
        isAccessibilityMode
    };

    return (
        <AccessibilityContext.Provider value={contextValue}>
            {children}

            {/* 라이브 리전 (스크린 리더용) */}
            <LiveRegion aria-live="polite" aria-atomic="true">
                {announcements.map((announcement, index) => (
                    <div key={index}>{announcement}</div>
                ))}
            </LiveRegion>
        </AccessibilityContext.Provider>
    );
};

// 접근성 설정 패널
interface AccessibilityPanelProps {
    open: boolean;
    onClose: () => void;
}

const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({ open, onClose }) => {
    const { settings, updateSetting, announceToScreenReader } = useAccessibility();
    const theme = useTheme();

    const handleSettingChange = (key: keyof AccessibilitySettings, value: any) => {
        updateSetting(key, value);
        announceToScreenReader(`${key} 설정이 ${value ? '활성화' : '비활성화'}되었습니다.`);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            aria-labelledby="accessibility-dialog-title"
        >
            <DialogTitle id="accessibility-dialog-title">
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6">접근성 설정</Typography>
                    <IconButton onClick={onClose} aria-label="닫기">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Box display="flex" flexDirection="column" gap={3}>
                    {/* 시각적 접근성 */}
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            <VisibilityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            시각적 접근성
                        </Typography>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.highContrast}
                                    onChange={(e) => handleSettingChange('highContrast', e.target.checked)}
                                />
                            }
                            label="고대비 모드"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.largeText}
                                    onChange={(e) => handleSettingChange('largeText', e.target.checked)}
                                />
                            }
                            label="큰 텍스트"
                        />

                        <Box sx={{ mt: 2 }}>
                            <Typography gutterBottom>글꼴 크기: {Math.round(settings.fontSize * 100)}%</Typography>
                            <Slider
                                value={settings.fontSize}
                                onChange={(_, value) => handleSettingChange('fontSize', value)}
                                min={0.8}
                                max={2.0}
                                step={0.1}
                                marks={[
                                    { value: 0.8, label: '80%' },
                                    { value: 1.0, label: '100%' },
                                    { value: 1.5, label: '150%' },
                                    { value: 2.0, label: '200%' }
                                ]}
                                aria-label="글꼴 크기"
                            />
                        </Box>

                        <Box sx={{ mt: 2 }}>
                            <Typography gutterBottom>줄 간격: {settings.lineHeight}</Typography>
                            <Slider
                                value={settings.lineHeight}
                                onChange={(_, value) => handleSettingChange('lineHeight', value)}
                                min={1.0}
                                max={2.5}
                                step={0.1}
                                marks={[
                                    { value: 1.0, label: '1.0' },
                                    { value: 1.5, label: '1.5' },
                                    { value: 2.0, label: '2.0' },
                                    { value: 2.5, label: '2.5' }
                                ]}
                                aria-label="줄 간격"
                            />
                        </Box>
                    </Box>

                    <Divider />

                    {/* 키보드 및 네비게이션 */}
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            <KeyboardIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            키보드 및 네비게이션
                        </Typography>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.keyboardNavigation}
                                    onChange={(e) => handleSettingChange('keyboardNavigation', e.target.checked)}
                                />
                            }
                            label="키보드 네비게이션 강화"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.focusIndicators}
                                    onChange={(e) => handleSettingChange('focusIndicators', e.target.checked)}
                                />
                            }
                            label="포커스 표시 강화"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.skipLinks}
                                    onChange={(e) => handleSettingChange('skipLinks', e.target.checked)}
                                />
                            }
                            label="건너뛰기 링크"
                        />
                    </Box>

                    <Divider />

                    {/* 스크린 리더 및 음성 */}
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            <VoiceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            스크린 리더 및 음성
                        </Typography>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.screenReader}
                                    onChange={(e) => handleSettingChange('screenReader', e.target.checked)}
                                />
                            }
                            label="스크린 리더 최적화"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.voiceAnnouncements}
                                    onChange={(e) => handleSettingChange('voiceAnnouncements', e.target.checked)}
                                />
                            }
                            label="음성 안내"
                        />
                    </Box>

                    <Divider />

                    {/* 모션 및 애니메이션 */}
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            애니메이션 및 모션
                        </Typography>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.reducedMotion}
                                    onChange={(e) => handleSettingChange('reducedMotion', e.target.checked)}
                                />
                            }
                            label="모션 감소"
                        />
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} variant="contained">
                    설정 완료
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// 메인 접근성 컴포넌트
export const AccessibilityEnhancer: React.FC = () => {
    const [panelOpen, setPanelOpen] = useState(false);
    const { settings, announceToScreenReader } = useAccessibility();

    const handleOpenPanel = () => {
        setPanelOpen(true);
        announceToScreenReader('접근성 설정 패널이 열렸습니다.');
    };

    const handleClosePanel = () => {
        setPanelOpen(false);
        announceToScreenReader('접근성 설정 패널이 닫혔습니다.');
    };

    return (
        <>
            {/* 건너뛰기 링크 */}
            {settings.skipLinks && (
                <>
                    <SkipLink href="#main-content">메인 컨텐츠로 건너뛰기</SkipLink>
                    <SkipLink href="#navigation">네비게이션으로 건너뛰기</SkipLink>
                </>
            )}

            {/* 접근성 설정 버튼 */}
            <AccessibilityFab
                onClick={handleOpenPanel}
                aria-label="접근성 설정 열기"
                title="접근성 설정"
            >
                <AccessibilityIcon />
            </AccessibilityFab>

            {/* 접근성 설정 패널 */}
            <AccessibilityPanel open={panelOpen} onClose={handleClosePanel} />

            {/* 전역 접근성 스타일 */}
            <style>{`
                .keyboard-navigation *:focus {
                    outline: 3px solid #2196F3 !important;
                    outline-offset: 2px !important;
                }
                
                .high-contrast {
                    filter: contrast(150%) brightness(120%);
                }
                
                .large-text {
                    font-size: 1.2em !important;
                }
                
                .reduced-motion * {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
                
                /* 스크린 리더 전용 텍스트 */
                .sr-only {
                    position: absolute !important;
                    width: 1px !important;
                    height: 1px !important;
                    padding: 0 !important;
                    margin: -1px !important;
                    overflow: hidden !important;
                    clip: rect(0, 0, 0, 0) !important;
                    white-space: nowrap !important;
                    border: 0 !important;
                }
                
                /* 포커스 가능한 요소들의 기본 스타일 */
                button:focus-visible,
                a:focus-visible,
                input:focus-visible,
                select:focus-visible,
                textarea:focus-visible {
                    outline: 2px solid #2196F3;
                    outline-offset: 2px;
                }
            `}</style>
        </>
    );
};

export default AccessibilityEnhancer;
