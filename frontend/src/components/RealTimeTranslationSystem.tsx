/**
 * 🌍 실시간 번역 시스템
 * 
 * AI 기반 실시간 다국어 번역, 언어 감지, 문화적 맥락 고려를 제공하는
 * 글로벌 커뮤니케이션 시스템
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-10-02
 */

import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
    createContext,
    useContext,
    ReactNode,
    useRef
} from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    Card,
    CardContent,
    CardActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    Avatar,
    LinearProgress,
    CircularProgress,
    Alert,
    Tooltip,
    Switch,
    FormControlLabel,
    Slider,
    Divider,
    useTheme
} from '@mui/material';
import {
    Translate as TranslateIcon,
    Language as LanguageIcon,
    VolumeUp as SpeakIcon,
    VolumeOff as MuteIcon,
    Mic as MicIcon,
    MicOff as MicOffIcon,
    SwapHoriz as SwapIcon,
    ContentCopy as CopyIcon,
    Share as ShareIcon,
    History as HistoryIcon,
    Settings as SettingsIcon,
    AutoAwesome as AIIcon,
    Public as GlobalIcon,
    RecordVoiceOver as VoiceIcon,
    Hearing as ListenIcon,
    Speed as SpeedIcon,
    Psychology as ContextIcon,
    Star as FavoriteIcon,
    Download as DownloadIcon,
    Upload as UploadIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';

// 번역 시스템 타입 정의
export type SupportedLanguage = {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
    rtl: boolean;
    voiceSupported: boolean;
    confidence: number;
};

export interface TranslationRequest {
    id: string;
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
    timestamp: Date;
    context?: string;
    domain?: 'general' | 'technical' | 'medical' | 'legal' | 'business' | 'casual';
}

export interface TranslationResult {
    id: string;
    originalText: string;
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
    confidence: number;
    alternatives: string[];
    detectedLanguage?: string;
    culturalNotes?: string[];
    processingTime: number;
    timestamp: Date;
}

export interface LanguageDetectionResult {
    language: string;
    confidence: number;
    alternatives: Array<{ language: string; confidence: number }>;
}

export interface VoiceTranslationSession {
    id: string;
    isActive: boolean;
    sourceLanguage: string;
    targetLanguage: string;
    startTime: Date;
    translations: TranslationResult[];
}

export interface TranslationSettings {
    defaultSourceLanguage: string;
    defaultTargetLanguage: string;
    autoDetectLanguage: boolean;
    showConfidence: boolean;
    showAlternatives: boolean;
    enableVoiceInput: boolean;
    enableVoiceOutput: boolean;
    voiceSpeed: number;
    culturalContext: boolean;
    formalityLevel: 'formal' | 'informal' | 'auto';
    cacheTranslations: boolean;
    offlineMode: boolean;
}

interface TranslationContextValue {
    supportedLanguages: SupportedLanguage[];
    translationHistory: TranslationResult[];
    currentSession: VoiceTranslationSession | null;
    settings: TranslationSettings;
    isTranslating: boolean;
    isListening: boolean;
    isSpeaking: boolean;

    // 텍스트 번역
    translateText: (text: string, sourceLanguage: string, targetLanguage: string, context?: string) => Promise<TranslationResult>;
    detectLanguage: (text: string) => Promise<LanguageDetectionResult>;

    // 음성 번역
    startVoiceSession: (sourceLanguage: string, targetLanguage: string) => Promise<string>;
    stopVoiceSession: () => void;
    speakText: (text: string, language: string) => void;
    stopSpeaking: () => void;

    // 히스토리 관리
    clearHistory: () => void;
    saveTranslation: (translation: TranslationResult) => void;
    removeFromHistory: (translationId: string) => void;

    // 설정
    updateSettings: (newSettings: Partial<TranslationSettings>) => void;

    // 유틸리티
    swapLanguages: () => void;
    copyToClipboard: (text: string) => void;
    shareTranslation: (translation: TranslationResult) => void;
}

// 지원 언어 목록
const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', rtl: false, voiceSupported: true, confidence: 0.95 },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false, voiceSupported: true, confidence: 0.98 },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', rtl: false, voiceSupported: true, confidence: 0.93 },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', rtl: false, voiceSupported: true, confidence: 0.94 },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false, voiceSupported: true, confidence: 0.96 },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false, voiceSupported: true, confidence: 0.95 },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false, voiceSupported: true, confidence: 0.94 },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', rtl: false, voiceSupported: true, confidence: 0.93 },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', rtl: false, voiceSupported: true, confidence: 0.92 },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', rtl: false, voiceSupported: true, confidence: 0.91 },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true, voiceSupported: true, confidence: 0.89 },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', rtl: false, voiceSupported: true, confidence: 0.88 }
];

// 기본 설정
const DEFAULT_TRANSLATION_SETTINGS: TranslationSettings = {
    defaultSourceLanguage: 'auto',
    defaultTargetLanguage: 'en',
    autoDetectLanguage: true,
    showConfidence: true,
    showAlternatives: true,
    enableVoiceInput: true,
    enableVoiceOutput: true,
    voiceSpeed: 1.0,
    culturalContext: true,
    formalityLevel: 'auto',
    cacheTranslations: true,
    offlineMode: false
};

// 스타일드 컴포넌트
const TranslationContainer = styled(Paper)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
}));

const TranslationCard = styled(Card)<{ confidence: number }>(({ theme, confidence }) => ({
    marginBottom: theme.spacing(2),
    border: `2px solid ${confidence > 0.9 ? theme.palette.success.main :
        confidence > 0.7 ? theme.palette.warning.main :
            theme.palette.error.main
        }`,
    position: 'relative'
}));

const LanguageSelector = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2)
}));

const VoiceVisualization = styled(Box)<{ isActive: boolean }>(({ theme, isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    backgroundColor: isActive ? theme.palette.primary.light + '20' : theme.palette.grey[100],
    borderRadius: theme.shape.borderRadius,
    margin: theme.spacing(1, 0),
    position: 'relative',

    '&::before': {
        content: '""',
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: theme.shape.borderRadius,
        background: isActive ?
            `radial-gradient(circle, ${theme.palette.primary.main}20 0%, transparent 70%)` :
            'transparent',
        animation: isActive ? 'pulse 2s infinite' : 'none'
    },

    '@keyframes pulse': {
        '0%': { opacity: 1 },
        '50%': { opacity: 0.5 },
        '100%': { opacity: 1 }
    }
}));

// 번역 컨텍스트
const TranslationContext = createContext<TranslationContextValue | undefined>(undefined);

// 커스텀 훅
export const useTranslation = (): TranslationContextValue => {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error('useTranslation must be used within TranslationProvider');
    }
    return context;
};

// 음성 인식 훅
const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);

    const startListening = useCallback((language: string) => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();

        const recognition = recognitionRef.current;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                setTranscript(finalTranscript);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognition.start();
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    return { isListening, transcript, startListening, stopListening, setTranscript };
};

// 음성 합성 훅
const useSpeechSynthesis = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        const updateVoices = () => {
            setVoices(speechSynthesis.getVoices());
        };

        updateVoices();
        speechSynthesis.addEventListener('voiceschanged', updateVoices);

        return () => {
            speechSynthesis.removeEventListener('voiceschanged', updateVoices);
        };
    }, []);

    const speak = useCallback((text: string, language: string, rate = 1.0) => {
        if (!text) return;

        const utterance = new SpeechSynthesisUtterance(text);

        // 언어에 맞는 음성 찾기
        const voice = voices.find(v => v.lang.startsWith(language));
        if (voice) {
            utterance.voice = voice;
        }

        utterance.rate = rate;
        utterance.lang = language;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        speechSynthesis.speak(utterance);
    }, [voices]);

    const stopSpeaking = useCallback(() => {
        speechSynthesis.cancel();
        setIsSpeaking(false);
    }, []);

    return { isSpeaking, speak, stopSpeaking };
};

// 번역 프로바이더
interface TranslationProviderProps {
    children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
    const [translationHistory, setTranslationHistory] = useState<TranslationResult[]>([]);
    const [currentSession, setCurrentSession] = useState<VoiceTranslationSession | null>(null);
    const [settings, setSettings] = useState<TranslationSettings>(() => {
        try {
            const saved = localStorage.getItem('translation-settings');
            return saved ? { ...DEFAULT_TRANSLATION_SETTINGS, ...JSON.parse(saved) } : DEFAULT_TRANSLATION_SETTINGS;
        } catch {
            return DEFAULT_TRANSLATION_SETTINGS;
        }
    });

    const [isTranslating, setIsTranslating] = useState(false);
    const speechRecognition = useSpeechRecognition();
    const speechSynthesis = useSpeechSynthesis();

    // 모의 번역 API
    const mockTranslateAPI = useCallback(async (
        text: string,
        sourceLanguage: string,
        targetLanguage: string,
        context?: string
    ): Promise<TranslationResult> => {
        const startTime = Date.now();

        // 실제로는 Google Translate API, DeepL API 등 호출
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

        const mockTranslations: Record<string, Record<string, string>> = {
            'ko': {
                'en': 'Hello, this is a translation test.',
                'ja': 'こんにちは、これは翻訳テストです。',
                'zh': '你好，这是翻译测试。'
            },
            'en': {
                'ko': '안녕하세요, 이것은 번역 테스트입니다.',
                'ja': 'こんにちは、これは翻訳テストです。',
                'zh': '你好，这是翻译测试。'
            }
        };

        const translatedText = mockTranslations[sourceLanguage]?.[targetLanguage] ||
            `[${targetLanguage.toUpperCase()}] ${text}`;

        const processingTime = Date.now() - startTime;

        return {
            id: `translation-${Date.now()}`,
            originalText: text,
            translatedText,
            sourceLanguage,
            targetLanguage,
            confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
            alternatives: [
                translatedText + ' (alternative 1)',
                translatedText + ' (alternative 2)'
            ],
            culturalNotes: settings.culturalContext ? [
                '이 표현은 격식을 차린 상황에서 사용됩니다.',
                '문화적 맥락을 고려한 번역입니다.'
            ] : [],
            processingTime,
            timestamp: new Date()
        };
    }, [settings.culturalContext]);

    // 언어 감지
    const detectLanguage = useCallback(async (text: string): Promise<LanguageDetectionResult> => {
        // 실제로는 언어 감지 API 호출
        await new Promise(resolve => setTimeout(resolve, 300));

        // 간단한 언어 감지 로직 (실제로는 더 정교한 알고리즘 사용)
        const koreanPattern = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
        const japanesePattern = /[ひらがな|カタカナ|漢字]/;
        const chinesePattern = /[\u4e00-\u9fff]/;
        const arabicPattern = /[\u0600-\u06ff]/;

        let detectedLanguage = 'en';
        let confidence = 0.8;

        if (koreanPattern.test(text)) {
            detectedLanguage = 'ko';
            confidence = 0.95;
        } else if (japanesePattern.test(text)) {
            detectedLanguage = 'ja';
            confidence = 0.93;
        } else if (chinesePattern.test(text)) {
            detectedLanguage = 'zh';
            confidence = 0.94;
        } else if (arabicPattern.test(text)) {
            detectedLanguage = 'ar';
            confidence = 0.89;
        }

        return {
            language: detectedLanguage,
            confidence,
            alternatives: [
                { language: 'en', confidence: 0.3 },
                { language: 'es', confidence: 0.2 }
            ]
        };
    }, []);

    // 텍스트 번역
    const translateText = useCallback(async (
        text: string,
        sourceLanguage: string,
        targetLanguage: string,
        context?: string
    ): Promise<TranslationResult> => {
        setIsTranslating(true);

        try {
            let actualSourceLanguage = sourceLanguage;

            // 자동 언어 감지
            if (sourceLanguage === 'auto' && settings.autoDetectLanguage) {
                const detection = await detectLanguage(text);
                actualSourceLanguage = detection.language;
            }

            const result = await mockTranslateAPI(text, actualSourceLanguage, targetLanguage, context);

            // 히스토리에 추가
            if (settings.cacheTranslations) {
                setTranslationHistory(prev => [result, ...prev.slice(0, 99)]); // 최대 100개 유지
            }

            return result;
        } finally {
            setIsTranslating(false);
        }
    }, [settings.autoDetectLanguage, settings.cacheTranslations, detectLanguage, mockTranslateAPI]);

    // 음성 세션 시작
    const startVoiceSession = useCallback(async (sourceLanguage: string, targetLanguage: string): Promise<string> => {
        const sessionId = `voice-session-${Date.now()}`;

        const session: VoiceTranslationSession = {
            id: sessionId,
            isActive: true,
            sourceLanguage,
            targetLanguage,
            startTime: new Date(),
            translations: []
        };

        setCurrentSession(session);
        speechRecognition.startListening(sourceLanguage);

        return sessionId;
    }, [speechRecognition]);

    // 음성 세션 중지
    const stopVoiceSession = useCallback(() => {
        speechRecognition.stopListening();
        setCurrentSession(null);
    }, [speechRecognition]);

    // 텍스트 음성 출력
    const speakText = useCallback((text: string, language: string) => {
        speechSynthesis.speak(text, language, settings.voiceSpeed);
    }, [speechSynthesis, settings.voiceSpeed]);

    // 음성 출력 중지
    const stopSpeaking = useCallback(() => {
        speechSynthesis.stopSpeaking();
    }, [speechSynthesis]);

    // 히스토리 관리
    const clearHistory = useCallback(() => {
        setTranslationHistory([]);
    }, []);

    const saveTranslation = useCallback((translation: TranslationResult) => {
        setTranslationHistory(prev => [translation, ...prev.filter(t => t.id !== translation.id)]);
    }, []);

    const removeFromHistory = useCallback((translationId: string) => {
        setTranslationHistory(prev => prev.filter(t => t.id !== translationId));
    }, []);

    // 설정 업데이트
    const updateSettings = useCallback((newSettings: Partial<TranslationSettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('translation-settings', JSON.stringify(updated));
            return updated;
        });
    }, []);

    // 언어 교체
    const swapLanguages = useCallback(() => {
        setSettings(prev => ({
            ...prev,
            defaultSourceLanguage: prev.defaultTargetLanguage,
            defaultTargetLanguage: prev.defaultSourceLanguage
        }));
    }, []);

    // 클립보드 복사
    const copyToClipboard = useCallback((text: string) => {
        navigator.clipboard.writeText(text);
    }, []);

    // 번역 공유
    const shareTranslation = useCallback((translation: TranslationResult) => {
        const shareText = `원문: ${translation.originalText}\n번역: ${translation.translatedText}`;

        if (navigator.share) {
            navigator.share({
                title: '번역 결과',
                text: shareText
            });
        } else {
            copyToClipboard(shareText);
        }
    }, [copyToClipboard]);

    // 음성 인식 결과 처리
    useEffect(() => {
        if (speechRecognition.transcript && currentSession) {
            const translateAndSpeak = async () => {
                const result = await translateText(
                    speechRecognition.transcript,
                    currentSession.sourceLanguage,
                    currentSession.targetLanguage
                );

                // 번역 결과를 세션에 추가
                setCurrentSession(prev => prev ? {
                    ...prev,
                    translations: [result, ...prev.translations]
                } : null);

                // 자동 음성 출력
                if (settings.enableVoiceOutput) {
                    speakText(result.translatedText, currentSession.targetLanguage);
                }
            };

            translateAndSpeak();
            speechRecognition.setTranscript(''); // 트랜스크립트 초기화
        }
    }, [speechRecognition.transcript, currentSession, translateText, speakText, settings.enableVoiceOutput]);

    const contextValue: TranslationContextValue = {
        supportedLanguages: SUPPORTED_LANGUAGES,
        translationHistory,
        currentSession,
        settings,
        isTranslating,
        isListening: speechRecognition.isListening,
        isSpeaking: speechSynthesis.isSpeaking,
        translateText,
        detectLanguage,
        startVoiceSession,
        stopVoiceSession,
        speakText,
        stopSpeaking,
        clearHistory,
        saveTranslation,
        removeFromHistory,
        updateSettings,
        swapLanguages,
        copyToClipboard,
        shareTranslation
    };

    return (
        <TranslationContext.Provider value={contextValue}>
            {children}
        </TranslationContext.Provider>
    );
};

// 번역 대시보드
export const TranslationDashboard: React.FC = () => {
    const {
        supportedLanguages,
        translationHistory,
        currentSession,
        settings,
        isTranslating,
        isListening,
        isSpeaking,
        translateText,
        startVoiceSession,
        stopVoiceSession,
        speakText,
        stopSpeaking,
        swapLanguages,
        copyToClipboard,
        shareTranslation,
        updateSettings
    } = useTranslation();

    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [sourceLanguage, setSourceLanguage] = useState(settings.defaultSourceLanguage);
    const [targetLanguage, setTargetLanguage] = useState(settings.defaultTargetLanguage);
    const [showSettings, setShowSettings] = useState(false);
    const [activeTab, setActiveTab] = useState<'text' | 'voice' | 'history'>('text');

    const theme = useTheme();

    const handleTranslate = async () => {
        if (!sourceText.trim()) return;

        const result = await translateText(sourceText, sourceLanguage, targetLanguage);
        setTranslatedText(result.translatedText);
    };

    const handleVoiceToggle = () => {
        if (currentSession) {
            stopVoiceSession();
        } else {
            startVoiceSession(sourceLanguage, targetLanguage);
        }
    };

    return (
        <TranslationContainer>
            {/* 헤더 */}
            <Box p={2} borderBottom={1} borderColor="divider">
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">실시간 번역 시스템</Typography>
                    <Box display="flex" gap={1}>
                        <Chip
                            icon={<GlobalIcon />}
                            label={`${supportedLanguages.length}개 언어 지원`}
                            color="primary"
                        />
                        <Button
                            startIcon={<SettingsIcon />}
                            onClick={() => setShowSettings(true)}
                        >
                            설정
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* 탭 */}
            <Box display="flex" borderBottom={1} borderColor="divider">
                {[
                    { key: 'text', label: '텍스트 번역', icon: <TranslateIcon /> },
                    { key: 'voice', label: '음성 번역', icon: <VoiceIcon /> },
                    { key: 'history', label: '번역 기록', icon: <HistoryIcon /> }
                ].map(tab => (
                    <Button
                        key={tab.key}
                        startIcon={tab.icon}
                        onClick={() => setActiveTab(tab.key as any)}
                        variant={activeTab === tab.key ? 'contained' : 'text'}
                        sx={{ minWidth: 'auto', px: 3 }}
                    >
                        {tab.label}
                    </Button>
                ))}
            </Box>

            <Box flex={1} overflow="auto" p={2}>
                {/* 텍스트 번역 탭 */}
                {activeTab === 'text' && (
                    <Box>
                        {/* 언어 선택 */}
                        <LanguageSelector>
                            <FormControl sx={{ minWidth: 150 }}>
                                <InputLabel>원본 언어</InputLabel>
                                <Select
                                    value={sourceLanguage}
                                    label="원본 언어"
                                    onChange={(e) => setSourceLanguage(e.target.value)}
                                >
                                    <MenuItem value="auto">자동 감지</MenuItem>
                                    {supportedLanguages.map(lang => (
                                        <MenuItem key={lang.code} value={lang.code}>
                                            {lang.flag} {lang.nativeName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <IconButton onClick={swapLanguages}>
                                <SwapIcon />
                            </IconButton>

                            <FormControl sx={{ minWidth: 150 }}>
                                <InputLabel>번역 언어</InputLabel>
                                <Select
                                    value={targetLanguage}
                                    label="번역 언어"
                                    onChange={(e) => setTargetLanguage(e.target.value)}
                                >
                                    {supportedLanguages.map(lang => (
                                        <MenuItem key={lang.code} value={lang.code}>
                                            {lang.flag} {lang.nativeName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </LanguageSelector>

                        {/* 번역 입력/출력 */}
                        <Box display="flex" gap={2} mb={2}>
                            <Card sx={{ flex: 1 }}>
                                <CardContent>
                                    <Typography variant="subtitle2" gutterBottom>
                                        원본 텍스트
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={6}
                                        value={sourceText}
                                        onChange={(e) => setSourceText(e.target.value)}
                                        placeholder="번역할 텍스트를 입력하세요..."
                                        variant="outlined"
                                    />
                                </CardContent>
                                <CardActions>
                                    <Button
                                        variant="contained"
                                        startIcon={<TranslateIcon />}
                                        onClick={handleTranslate}
                                        disabled={isTranslating || !sourceText.trim()}
                                    >
                                        {isTranslating ? '번역 중...' : '번역'}
                                    </Button>
                                    {sourceText && (
                                        <IconButton onClick={() => speakText(sourceText, sourceLanguage)}>
                                            <SpeakIcon />
                                        </IconButton>
                                    )}
                                </CardActions>
                            </Card>

                            <Card sx={{ flex: 1 }}>
                                <CardContent>
                                    <Typography variant="subtitle2" gutterBottom>
                                        번역 결과
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={6}
                                        value={translatedText}
                                        InputProps={{ readOnly: true }}
                                        placeholder="번역 결과가 여기에 표시됩니다..."
                                        variant="outlined"
                                    />
                                </CardContent>
                                <CardActions>
                                    <IconButton
                                        onClick={() => copyToClipboard(translatedText)}
                                        disabled={!translatedText}
                                    >
                                        <CopyIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => speakText(translatedText, targetLanguage)}
                                        disabled={!translatedText}
                                    >
                                        <SpeakIcon />
                                    </IconButton>
                                    <IconButton disabled={!translatedText}>
                                        <ShareIcon />
                                    </IconButton>
                                </CardActions>
                            </Card>
                        </Box>

                        {isTranslating && (
                            <LinearProgress sx={{ mb: 2 }} />
                        )}
                    </Box>
                )}

                {/* 음성 번역 탭 */}
                {activeTab === 'voice' && (
                    <Box>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            음성 번역을 시작하려면 마이크 버튼을 클릭하세요.
                            실시간으로 음성을 인식하고 번역합니다.
                        </Alert>

                        {/* 언어 선택 */}
                        <LanguageSelector>
                            <FormControl sx={{ minWidth: 150 }}>
                                <InputLabel>말하는 언어</InputLabel>
                                <Select
                                    value={sourceLanguage}
                                    label="말하는 언어"
                                    onChange={(e) => setSourceLanguage(e.target.value)}
                                >
                                    {supportedLanguages.filter(lang => lang.voiceSupported).map(lang => (
                                        <MenuItem key={lang.code} value={lang.code}>
                                            {lang.flag} {lang.nativeName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <IconButton onClick={swapLanguages}>
                                <SwapIcon />
                            </IconButton>

                            <FormControl sx={{ minWidth: 150 }}>
                                <InputLabel>번역 언어</InputLabel>
                                <Select
                                    value={targetLanguage}
                                    label="번역 언어"
                                    onChange={(e) => setTargetLanguage(e.target.value)}
                                >
                                    {supportedLanguages.filter(lang => lang.voiceSupported).map(lang => (
                                        <MenuItem key={lang.code} value={lang.code}>
                                            {lang.flag} {lang.nativeName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </LanguageSelector>

                        {/* 음성 시각화 */}
                        <VoiceVisualization isActive={isListening || isSpeaking}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <IconButton
                                    onClick={handleVoiceToggle}
                                    sx={{
                                        width: 60,
                                        height: 60,
                                        backgroundColor: currentSession ? 'error.main' : 'primary.main',
                                        color: 'white',
                                        '&:hover': {
                                            backgroundColor: currentSession ? 'error.dark' : 'primary.dark'
                                        }
                                    }}
                                >
                                    {isListening ? <MicOffIcon /> : <MicIcon />}
                                </IconButton>

                                {isSpeaking && (
                                    <IconButton onClick={stopSpeaking}>
                                        <MuteIcon />
                                    </IconButton>
                                )}
                            </Box>
                        </VoiceVisualization>

                        <Box textAlign="center" mb={2}>
                            <Typography variant="body2" color="text.secondary">
                                {currentSession ?
                                    (isListening ? '듣고 있습니다...' : '음성 세션 활성') :
                                    '음성 번역을 시작하려면 마이크 버튼을 클릭하세요'
                                }
                            </Typography>
                        </Box>

                        {/* 실시간 번역 결과 */}
                        {currentSession && currentSession.translations.length > 0 && (
                            <Box>
                                <Typography variant="h6" gutterBottom>
                                    실시간 번역 결과
                                </Typography>
                                {currentSession.translations.map(translation => (
                                    <TranslationCard key={translation.id} confidence={translation.confidence}>
                                        <CardContent>
                                            <Typography variant="body1" gutterBottom>
                                                <strong>원문:</strong> {translation.originalText}
                                            </Typography>
                                            <Typography variant="body1" color="primary">
                                                <strong>번역:</strong> {translation.translatedText}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                신뢰도: {Math.round(translation.confidence * 100)}% |
                                                처리시간: {translation.processingTime}ms
                                            </Typography>
                                        </CardContent>
                                        <CardActions>
                                            <IconButton onClick={() => copyToClipboard(translation.translatedText)}>
                                                <CopyIcon />
                                            </IconButton>
                                            <IconButton onClick={() => speakText(translation.translatedText, targetLanguage)}>
                                                <SpeakIcon />
                                            </IconButton>
                                            <IconButton onClick={() => shareTranslation(translation)}>
                                                <ShareIcon />
                                            </IconButton>
                                        </CardActions>
                                    </TranslationCard>
                                ))}
                            </Box>
                        )}
                    </Box>
                )}

                {/* 번역 기록 탭 */}
                {activeTab === 'history' && (
                    <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6">번역 기록</Typography>
                            <Button startIcon={<DownloadIcon />}>
                                내보내기
                            </Button>
                        </Box>

                        {translationHistory.length === 0 ? (
                            <Alert severity="info">
                                번역 기록이 없습니다. 텍스트나 음성을 번역해보세요.
                            </Alert>
                        ) : (
                            translationHistory.map(translation => (
                                <TranslationCard key={translation.id} confidence={translation.confidence}>
                                    <CardContent>
                                        <Box display="flex" justifyContent="between" alignItems="flex-start" mb={1}>
                                            <Typography variant="caption" color="text.secondary">
                                                {translation.timestamp.toLocaleString()}
                                            </Typography>
                                            <Chip
                                                label={`${Math.round(translation.confidence * 100)}%`}
                                                size="small"
                                                color={
                                                    translation.confidence > 0.9 ? 'success' :
                                                        translation.confidence > 0.7 ? 'warning' : 'error'
                                                }
                                            />
                                        </Box>

                                        <Typography variant="body1" gutterBottom>
                                            <strong>
                                                {supportedLanguages.find(l => l.code === translation.sourceLanguage)?.flag}
                                                {' → '}
                                                {supportedLanguages.find(l => l.code === translation.targetLanguage)?.flag}
                                            </strong>
                                        </Typography>

                                        <Typography variant="body2" gutterBottom>
                                            {translation.originalText}
                                        </Typography>

                                        <Divider sx={{ my: 1 }} />

                                        <Typography variant="body1" color="primary">
                                            {translation.translatedText}
                                        </Typography>

                                        {translation.culturalNotes && translation.culturalNotes.length > 0 && (
                                            <Box mt={1}>
                                                <Typography variant="caption" display="block">
                                                    문화적 참고사항:
                                                </Typography>
                                                {translation.culturalNotes.map((note, index) => (
                                                    <Typography key={index} variant="caption" display="block" color="text.secondary">
                                                        • {note}
                                                    </Typography>
                                                ))}
                                            </Box>
                                        )}
                                    </CardContent>

                                    <CardActions>
                                        <IconButton onClick={() => copyToClipboard(translation.translatedText)}>
                                            <CopyIcon />
                                        </IconButton>
                                        <IconButton onClick={() => speakText(translation.translatedText, translation.targetLanguage)}>
                                            <SpeakIcon />
                                        </IconButton>
                                        <IconButton onClick={() => shareTranslation(translation)}>
                                            <ShareIcon />
                                        </IconButton>
                                        <IconButton>
                                            <FavoriteIcon />
                                        </IconButton>
                                    </CardActions>
                                </TranslationCard>
                            ))
                        )}
                    </Box>
                )}
            </Box>

            {/* 설정 다이얼로그 */}
            <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="md" fullWidth>
                <DialogTitle>번역 설정</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={3} pt={1}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.autoDetectLanguage}
                                    onChange={(e) => updateSettings({ autoDetectLanguage: e.target.checked })}
                                />
                            }
                            label="자동 언어 감지"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.showConfidence}
                                    onChange={(e) => updateSettings({ showConfidence: e.target.checked })}
                                />
                            }
                            label="신뢰도 표시"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.culturalContext}
                                    onChange={(e) => updateSettings({ culturalContext: e.target.checked })}
                                />
                            }
                            label="문화적 맥락 고려"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.enableVoiceOutput}
                                    onChange={(e) => updateSettings({ enableVoiceOutput: e.target.checked })}
                                />
                            }
                            label="자동 음성 출력"
                        />

                        <Box>
                            <Typography gutterBottom>음성 속도</Typography>
                            <Slider
                                value={settings.voiceSpeed}
                                onChange={(_, value) => updateSettings({ voiceSpeed: value as number })}
                                min={0.5}
                                max={2.0}
                                step={0.1}
                                marks={[
                                    { value: 0.5, label: '느림' },
                                    { value: 1.0, label: '보통' },
                                    { value: 2.0, label: '빠름' }
                                ]}
                            />
                        </Box>

                        <FormControl fullWidth>
                            <InputLabel>격식 수준</InputLabel>
                            <Select
                                value={settings.formalityLevel}
                                label="격식 수준"
                                onChange={(e) => updateSettings({ formalityLevel: e.target.value as any })}
                            >
                                <MenuItem value="formal">격식체</MenuItem>
                                <MenuItem value="informal">비격식체</MenuItem>
                                <MenuItem value="auto">자동</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowSettings(false)}>취소</Button>
                    <Button variant="contained">저장</Button>
                </DialogActions>
            </Dialog>
        </TranslationContainer>
    );
};

export default TranslationProvider;
