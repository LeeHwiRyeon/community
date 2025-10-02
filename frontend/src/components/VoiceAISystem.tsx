/**
 * 🎤 음성 AI 시스템
 * 
 * 음성 인식, 음성 명령, 음성 합성을 지원하는
 * 핸즈프리 컨텐츠 제작 및 제어 시스템
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
    Paper,
    Typography,
    Button,
    IconButton,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Slider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    Avatar,
    LinearProgress,
    Alert,
    Tooltip,
    Switch,
    FormControlLabel,
    useTheme
} from '@mui/material';
import {
    Mic as MicIcon,
    MicOff as MicOffIcon,
    VolumeUp as VolumeUpIcon,
    VolumeOff as VolumeOffIcon,
    RecordVoiceOver as VoiceIcon,
    Hearing as HearingIcon,
    Translate as TranslateIcon,
    Settings as SettingsIcon,
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    Stop as StopIcon,
    Save as SaveIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Add as AddIcon,
    Psychology as AIIcon,
    GraphicEq as WaveformIcon,
    GraphicEq as EqualizerIcon,
    Speed as SpeedIcon,
    Tune as TuneIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/system';

// Web Speech API 타입 정의
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface SpeechRecognition {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: (event: any) => void;
    onerror: (event: any) => void;
    onstart: () => void;
    onend: () => void;
    start: () => void;
    stop: () => void;
}

// 음성 AI 타입 정의
export type VoiceCommand = {
    id: string;
    trigger: string[];
    action: string;
    description: string;
    category: 'navigation' | 'editing' | 'creation' | 'system' | 'custom';
    parameters?: Record<string, any>;
    enabled: boolean;
};

export type VoiceRecognitionLanguage = 'ko-KR' | 'en-US' | 'ja-JP' | 'zh-CN' | 'es-ES' | 'fr-FR';

export interface VoiceSettings {
    recognition: {
        language: VoiceRecognitionLanguage;
        continuous: boolean;
        interimResults: boolean;
        maxAlternatives: number;
        sensitivity: number;
        noiseReduction: boolean;
    };
    synthesis: {
        voice: string;
        rate: number;
        pitch: number;
        volume: number;
        language: string;
    };
    commands: {
        wakeWord: string;
        confirmationRequired: boolean;
        timeout: number;
        customCommands: VoiceCommand[];
    };
    ai: {
        enableNLP: boolean;
        contextAware: boolean;
        learningMode: boolean;
        personalizedResponses: boolean;
    };
}

export interface VoiceSession {
    id: string;
    startTime: Date;
    endTime?: Date;
    transcript: string;
    confidence: number;
    commands: string[];
    language: VoiceRecognitionLanguage;
    duration: number;
}

interface VoiceAIContextValue {
    isListening: boolean;
    isSpeaking: boolean;
    currentTranscript: string;
    confidence: number;
    sessions: VoiceSession[];
    settings: VoiceSettings;
    availableVoices: SpeechSynthesisVoice[];

    // 음성 인식
    startListening: () => void;
    stopListening: () => void;

    // 음성 합성
    speak: (text: string, options?: Partial<VoiceSettings['synthesis']>) => void;
    stopSpeaking: () => void;

    // 명령 처리
    executeCommand: (command: string) => void;
    addCustomCommand: (command: VoiceCommand) => void;
    removeCustomCommand: (commandId: string) => void;

    // 설정
    updateSettings: (newSettings: Partial<VoiceSettings>) => void;

    // AI 기능
    processNaturalLanguage: (text: string) => Promise<string>;
    getContextualSuggestions: () => string[];
}

// 기본 설정
const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
    recognition: {
        language: 'ko-KR',
        continuous: true,
        interimResults: true,
        maxAlternatives: 3,
        sensitivity: 0.7,
        noiseReduction: true
    },
    synthesis: {
        voice: '',
        rate: 1.0,
        pitch: 1.0,
        volume: 0.8,
        language: 'ko-KR'
    },
    commands: {
        wakeWord: '안녕 에이전트',
        confirmationRequired: false,
        timeout: 5000,
        customCommands: []
    },
    ai: {
        enableNLP: true,
        contextAware: true,
        learningMode: true,
        personalizedResponses: true
    }
};

// 기본 음성 명령들
const DEFAULT_COMMANDS: VoiceCommand[] = [
    {
        id: 'create-post',
        trigger: ['새 글 작성', '포스트 만들기', '글쓰기 시작'],
        action: 'CREATE_POST',
        description: '새로운 글을 작성합니다',
        category: 'creation',
        enabled: true
    },
    {
        id: 'save-content',
        trigger: ['저장', '저장해줘', '세이브'],
        action: 'SAVE_CONTENT',
        description: '현재 내용을 저장합니다',
        category: 'editing',
        enabled: true
    },
    {
        id: 'navigate-home',
        trigger: ['홈으로', '메인으로', '처음으로'],
        action: 'NAVIGATE_HOME',
        description: '홈 페이지로 이동합니다',
        category: 'navigation',
        enabled: true
    },
    {
        id: 'toggle-dark-mode',
        trigger: ['다크모드', '어두운 테마', '밝은 테마'],
        action: 'TOGGLE_THEME',
        description: '테마를 변경합니다',
        category: 'system',
        enabled: true
    },
    {
        id: 'read-content',
        trigger: ['읽어줘', '읽기', '음성으로 읽기'],
        action: 'READ_CONTENT',
        description: '현재 내용을 음성으로 읽어줍니다',
        category: 'system',
        enabled: true
    }
];

// 애니메이션
const pulseAnimation = keyframes`
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.7; }
    100% { transform: scale(1); opacity: 1; }
`;

const waveAnimation = keyframes`
    0%, 100% { height: 20px; }
    25% { height: 40px; }
    50% { height: 60px; }
    75% { height: 30px; }
`;

// 스타일드 컴포넌트
const VoiceContainer = styled(Paper)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
}));

const VoiceVisualizer = styled(Box)<{ isActive: boolean }>(({ theme, isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
    margin: theme.spacing(2),
    position: 'relative',

    '&::before': {
        content: '""',
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: theme.shape.borderRadius,
        background: isActive ?
            `radial-gradient(circle, ${theme.palette.primary.light}20 0%, transparent 70%)` :
            'transparent',
        animation: isActive ? `${pulseAnimation} 2s infinite` : 'none'
    }
}));

const WaveBar = styled(Box)<{ isActive: boolean; delay: number }>(({ theme, isActive, delay }) => ({
    width: 4,
    backgroundColor: theme.palette.primary.main,
    margin: '0 2px',
    borderRadius: 2,
    animation: isActive ? `${waveAnimation} 1s infinite ${delay}s` : 'none',
    height: isActive ? 20 : 10,
    transition: 'height 0.3s ease'
}));

const CommandChip = styled(Chip)<{ category: VoiceCommand['category'] }>(({ theme, category }) => ({
    backgroundColor:
        category === 'navigation' ? theme.palette.info.light :
            category === 'editing' ? theme.palette.success.light :
                category === 'creation' ? theme.palette.primary.light :
                    category === 'system' ? theme.palette.warning.light :
                        theme.palette.grey[300],
    margin: theme.spacing(0.5)
}));

// 음성 AI 컨텍스트
const VoiceAIContext = createContext<VoiceAIContextValue | undefined>(undefined);

// 커스텀 훅
export const useVoiceAI = (): VoiceAIContextValue => {
    const context = useContext(VoiceAIContext);
    if (!context) {
        throw new Error('useVoiceAI must be used within VoiceAIProvider');
    }
    return context;
};

// 음성 인식 훅
const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [confidence, setConfidence] = useState(0);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
        }
    }, []);

    const startListening = useCallback((settings: VoiceSettings['recognition']) => {
        if (!recognitionRef.current) return;

        const recognition = recognitionRef.current;
        recognition.continuous = settings.continuous;
        recognition.interimResults = settings.interimResults;
        recognition.lang = settings.language;
        // recognition.maxAlternatives = settings.maxAlternatives; // Property not available in all browsers

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                    setConfidence(result[0].confidence);
                } else {
                    interimTranscript += result[0].transcript;
                }
            }

            setTranscript(finalTranscript || interimTranscript);
        };

        recognition.onerror = (event) => {
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

    return { isListening, transcript, confidence, startListening, stopListening };
};

// 음성 합성 훅
const useSpeechSynthesis = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        const updateVoices = () => {
            setAvailableVoices(speechSynthesis.getVoices());
        };

        updateVoices();
        speechSynthesis.addEventListener('voiceschanged', updateVoices);

        return () => {
            speechSynthesis.removeEventListener('voiceschanged', updateVoices);
        };
    }, []);

    const speak = useCallback((text: string, options: Partial<VoiceSettings['synthesis']> = {}) => {
        if (!text) return;

        const utterance = new SpeechSynthesisUtterance(text);

        if (options.voice) {
            const voice = availableVoices.find(v => v.name === options.voice);
            if (voice) utterance.voice = voice;
        }

        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 0.8;
        utterance.lang = options.language || 'ko-KR';

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        speechSynthesis.speak(utterance);
    }, [availableVoices]);

    const stopSpeaking = useCallback(() => {
        speechSynthesis.cancel();
        setIsSpeaking(false);
    }, []);

    return { isSpeaking, availableVoices, speak, stopSpeaking };
};

// 음성 AI 프로바이더
interface VoiceAIProviderProps {
    children: ReactNode;
}

export const VoiceAIProvider: React.FC<VoiceAIProviderProps> = ({ children }) => {
    const [settings, setSettings] = useState<VoiceSettings>(() => {
        try {
            const saved = localStorage.getItem('voice-ai-settings');
            return saved ? { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(saved) } : DEFAULT_VOICE_SETTINGS;
        } catch {
            return DEFAULT_VOICE_SETTINGS;
        }
    });

    const [sessions, setSessions] = useState<VoiceSession[]>([]);
    const [commands, setCommands] = useState<VoiceCommand[]>(DEFAULT_COMMANDS);

    const speechRecognition = useSpeechRecognition();
    const speechSynthesis = useSpeechSynthesis();

    // 명령 실행
    const executeCommand = useCallback((commandText: string) => {
        const matchedCommand = commands.find(cmd =>
            cmd.enabled && cmd.trigger.some(trigger =>
                commandText.toLowerCase().includes(trigger.toLowerCase())
            )
        );

        if (matchedCommand) {
            console.log('Executing command:', matchedCommand.action);

            switch (matchedCommand.action) {
                case 'CREATE_POST':
                    // 새 글 작성 로직
                    speechSynthesis.speak('새로운 글 작성을 시작합니다.');
                    break;

                case 'SAVE_CONTENT':
                    // 저장 로직
                    speechSynthesis.speak('내용을 저장했습니다.');
                    break;

                case 'NAVIGATE_HOME':
                    // 홈 이동 로직
                    speechSynthesis.speak('홈 페이지로 이동합니다.');
                    break;

                case 'TOGGLE_THEME':
                    // 테마 변경 로직
                    speechSynthesis.speak('테마를 변경했습니다.');
                    break;

                case 'READ_CONTENT':
                    // 컨텐츠 읽기 로직
                    const content = document.querySelector('main')?.textContent || '읽을 내용이 없습니다.';
                    speechSynthesis.speak(content.substring(0, 500));
                    break;

                default:
                    speechSynthesis.speak('명령을 실행했습니다.');
            }
        } else {
            speechSynthesis.speak('인식된 명령이 없습니다.');
        }
    }, [commands, speechSynthesis]);

    // 자연어 처리 (모의 AI)
    const processNaturalLanguage = useCallback(async (text: string): Promise<string> => {
        // 실제로는 AI API 호출
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (text.includes('안녕') || text.includes('hello')) {
            return '안녕하세요! 무엇을 도와드릴까요?';
        } else if (text.includes('도움') || text.includes('help')) {
            return '음성 명령으로 글 작성, 저장, 네비게이션 등을 할 수 있습니다.';
        } else if (text.includes('명령') || text.includes('command')) {
            return `사용 가능한 명령: ${commands.map(c => c.trigger[0]).join(', ')}`;
        } else {
            return '죄송합니다. 이해하지 못했습니다. 다시 말씀해 주세요.';
        }
    }, [commands]);

    // 상황별 제안
    const getContextualSuggestions = useCallback((): string[] => {
        const currentPath = window.location.pathname;

        if (currentPath.includes('write') || currentPath.includes('edit')) {
            return ['저장해줘', '읽어줘', '맞춤법 검사'];
        } else if (currentPath.includes('home')) {
            return ['새 글 작성', '최근 글 보기', '설정 열기'];
        } else {
            return ['홈으로', '뒤로가기', '도움말'];
        }
    }, []);

    // 음성 인식 시작
    const startListening = useCallback(() => {
        speechRecognition.startListening(settings.recognition);
    }, [speechRecognition, settings.recognition]);

    // 음성 인식 중지
    const stopListening = useCallback(() => {
        speechRecognition.stopListening();
    }, [speechRecognition]);

    // 음성 합성
    const speak = useCallback((text: string, options?: Partial<VoiceSettings['synthesis']>) => {
        speechSynthesis.speak(text, { ...settings.synthesis, ...options });
    }, [speechSynthesis, settings.synthesis]);

    // 음성 합성 중지
    const stopSpeaking = useCallback(() => {
        speechSynthesis.stopSpeaking();
    }, [speechSynthesis]);

    // 커스텀 명령 추가
    const addCustomCommand = useCallback((command: VoiceCommand) => {
        setCommands(prev => [...prev, command]);
    }, []);

    // 커스텀 명령 제거
    const removeCustomCommand = useCallback((commandId: string) => {
        setCommands(prev => prev.filter(cmd => cmd.id !== commandId));
    }, []);

    // 설정 업데이트
    const updateSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('voice-ai-settings', JSON.stringify(updated));
            return updated;
        });
    }, []);

    // 음성 인식 결과 처리
    useEffect(() => {
        if (speechRecognition.transcript && speechRecognition.confidence > 0.5) {
            const transcript = speechRecognition.transcript.trim();

            // 웨이크 워드 체크
            if (transcript.toLowerCase().includes(settings.commands.wakeWord.toLowerCase())) {
                executeCommand(transcript);
            }

            // 세션 기록
            const session: VoiceSession = {
                id: `session-${Date.now()}`,
                startTime: new Date(),
                transcript,
                confidence: speechRecognition.confidence,
                commands: [transcript],
                language: settings.recognition.language,
                duration: 0
            };

            setSessions(prev => [session, ...prev.slice(0, 49)]);
        }
    }, [speechRecognition.transcript, speechRecognition.confidence, settings.commands.wakeWord, executeCommand]);

    const contextValue: VoiceAIContextValue = {
        isListening: speechRecognition.isListening,
        isSpeaking: speechSynthesis.isSpeaking,
        currentTranscript: speechRecognition.transcript,
        confidence: speechRecognition.confidence,
        sessions,
        settings,
        availableVoices: speechSynthesis.availableVoices,
        startListening,
        stopListening,
        speak,
        stopSpeaking,
        executeCommand,
        addCustomCommand,
        removeCustomCommand,
        updateSettings,
        processNaturalLanguage,
        getContextualSuggestions
    };

    return (
        <VoiceAIContext.Provider value={contextValue}>
            {children}
        </VoiceAIContext.Provider>
    );
};

// 음성 컨트롤 패널
export const VoiceControlPanel: React.FC = () => {
    const {
        isListening,
        isSpeaking,
        currentTranscript,
        confidence,
        sessions,
        settings,
        availableVoices,
        startListening,
        stopListening,
        speak,
        stopSpeaking,
        updateSettings,
        getContextualSuggestions
    } = useVoiceAI();

    const [showSettings, setShowSettings] = useState(false);
    const [testText, setTestText] = useState('안녕하세요! 음성 합성 테스트입니다.');

    const theme = useTheme();
    const suggestions = getContextualSuggestions();

    return (
        <VoiceContainer>
            {/* 헤더 */}
            <Box p={2} borderBottom={1} borderColor="divider">
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">음성 AI 시스템</Typography>
                    <Box display="flex" gap={1}>
                        <Chip
                            icon={<MicIcon />}
                            label={isListening ? '듣는 중' : '대기 중'}
                            color={isListening ? 'success' : 'default'}
                        />
                        <Chip
                            icon={<VolumeUpIcon />}
                            label={isSpeaking ? '말하는 중' : '조용함'}
                            color={isSpeaking ? 'primary' : 'default'}
                        />
                    </Box>
                </Box>
            </Box>

            {/* 음성 시각화 */}
            <VoiceVisualizer isActive={isListening || isSpeaking}>
                <Box display="flex" alignItems="center" gap={0.5}>
                    {Array.from({ length: 20 }, (_, i) => (
                        <WaveBar
                            key={i}
                            isActive={isListening || isSpeaking}
                            delay={i * 0.1}
                        />
                    ))}
                </Box>

                <IconButton
                    sx={{
                        position: 'absolute',
                        width: 60,
                        height: 60,
                        backgroundColor: isListening ? 'error.main' : 'primary.main',
                        color: 'white',
                        '&:hover': {
                            backgroundColor: isListening ? 'error.dark' : 'primary.dark'
                        }
                    }}
                    onClick={isListening ? stopListening : startListening}
                >
                    {isListening ? <MicOffIcon /> : <MicIcon />}
                </IconButton>
            </VoiceVisualizer>

            {/* 현재 인식 결과 */}
            {currentTranscript && (
                <Card sx={{ m: 2 }}>
                    <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                            인식된 음성 (신뢰도: {Math.round(confidence * 100)}%)
                        </Typography>
                        <Typography variant="body1">
                            "{currentTranscript}"
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={confidence * 100}
                            sx={{ mt: 1 }}
                        />
                    </CardContent>
                </Card>
            )}

            {/* 컨트롤 버튼들 */}
            <Box p={2}>
                <Box display="flex" gap={2} mb={2}>
                    <Button
                        variant={isListening ? 'contained' : 'outlined'}
                        startIcon={isListening ? <MicOffIcon /> : <MicIcon />}
                        onClick={isListening ? stopListening : startListening}
                        color={isListening ? 'error' : 'primary'}
                    >
                        {isListening ? '음성 인식 중지' : '음성 인식 시작'}
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<SettingsIcon />}
                        onClick={() => setShowSettings(true)}
                    >
                        설정
                    </Button>
                </Box>

                {/* 음성 합성 테스트 */}
                <Card sx={{ mb: 2 }}>
                    <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                            음성 합성 테스트
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            value={testText}
                            onChange={(e) => setTestText(e.target.value)}
                            placeholder="읽을 텍스트를 입력하세요..."
                            sx={{ mb: 2 }}
                        />
                        <Box display="flex" gap={1}>
                            <Button
                                variant="contained"
                                startIcon={<PlayIcon />}
                                onClick={() => speak(testText)}
                                disabled={isSpeaking}
                            >
                                재생
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<StopIcon />}
                                onClick={stopSpeaking}
                                disabled={!isSpeaking}
                            >
                                중지
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                {/* 상황별 제안 */}
                <Card sx={{ mb: 2 }}>
                    <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                            추천 음성 명령
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {suggestions.map((suggestion, index) => (
                                <Chip
                                    key={index}
                                    label={suggestion}
                                    onClick={() => speak(`"${suggestion}" 명령을 실행합니다.`)}
                                    variant="outlined"
                                    size="small"
                                />
                            ))}
                        </Box>
                    </CardContent>
                </Card>

                {/* 최근 세션 */}
                <Card>
                    <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                            최근 음성 인식 기록
                        </Typography>
                        <List dense>
                            {sessions.slice(0, 5).map((session) => (
                                <ListItem key={session.id}>
                                    <ListItemIcon>
                                        <VoiceIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={session.transcript}
                                        secondary={`신뢰도: ${Math.round(session.confidence * 100)}% | ${session.startTime.toLocaleTimeString()}`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </CardContent>
                </Card>
            </Box>

            {/* 설정 다이얼로그 */}
            <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="md" fullWidth>
                <DialogTitle>음성 AI 설정</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={3} pt={1}>
                        {/* 음성 인식 설정 */}
                        <Typography variant="h6">음성 인식</Typography>

                        <FormControl fullWidth>
                            <InputLabel>언어</InputLabel>
                            <Select
                                value={settings.recognition.language}
                                label="언어"
                                onChange={(e) => updateSettings({
                                    recognition: {
                                        ...settings.recognition,
                                        language: e.target.value as VoiceRecognitionLanguage
                                    }
                                })}
                            >
                                <MenuItem value="ko-KR">한국어</MenuItem>
                                <MenuItem value="en-US">English (US)</MenuItem>
                                <MenuItem value="ja-JP">日本語</MenuItem>
                                <MenuItem value="zh-CN">中文</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.recognition.continuous}
                                    onChange={(e) => updateSettings({
                                        recognition: {
                                            ...settings.recognition,
                                            continuous: e.target.checked
                                        }
                                    })}
                                />
                            }
                            label="연속 인식"
                        />

                        <Box>
                            <Typography gutterBottom>민감도</Typography>
                            <Slider
                                value={settings.recognition.sensitivity}
                                onChange={(_, value) => updateSettings({
                                    recognition: {
                                        ...settings.recognition,
                                        sensitivity: value as number
                                    }
                                })}
                                min={0.1}
                                max={1.0}
                                step={0.1}
                                marks={[
                                    { value: 0.3, label: '낮음' },
                                    { value: 0.7, label: '보통' },
                                    { value: 1.0, label: '높음' }
                                ]}
                            />
                        </Box>

                        {/* 음성 합성 설정 */}
                        <Typography variant="h6">음성 합성</Typography>

                        <FormControl fullWidth>
                            <InputLabel>음성</InputLabel>
                            <Select
                                value={settings.synthesis.voice}
                                label="음성"
                                onChange={(e) => updateSettings({
                                    synthesis: {
                                        ...settings.synthesis,
                                        voice: e.target.value
                                    }
                                })}
                            >
                                {availableVoices
                                    .filter(voice => voice.lang.startsWith('ko'))
                                    .map(voice => (
                                        <MenuItem key={voice.name} value={voice.name}>
                                            {voice.name}
                                        </MenuItem>
                                    ))}
                            </Select>
                        </FormControl>

                        <Box>
                            <Typography gutterBottom>속도</Typography>
                            <Slider
                                value={settings.synthesis.rate}
                                onChange={(_, value) => updateSettings({
                                    synthesis: {
                                        ...settings.synthesis,
                                        rate: value as number
                                    }
                                })}
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

                        <Box>
                            <Typography gutterBottom>음높이</Typography>
                            <Slider
                                value={settings.synthesis.pitch}
                                onChange={(_, value) => updateSettings({
                                    synthesis: {
                                        ...settings.synthesis,
                                        pitch: value as number
                                    }
                                })}
                                min={0.5}
                                max={2.0}
                                step={0.1}
                                marks={[
                                    { value: 0.5, label: '낮음' },
                                    { value: 1.0, label: '보통' },
                                    { value: 2.0, label: '높음' }
                                ]}
                            />
                        </Box>

                        <Box>
                            <Typography gutterBottom>볼륨</Typography>
                            <Slider
                                value={settings.synthesis.volume}
                                onChange={(_, value) => updateSettings({
                                    synthesis: {
                                        ...settings.synthesis,
                                        volume: value as number
                                    }
                                })}
                                min={0.0}
                                max={1.0}
                                step={0.1}
                            />
                        </Box>

                        {/* AI 설정 */}
                        <Typography variant="h6">AI 기능</Typography>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.ai.enableNLP}
                                    onChange={(e) => updateSettings({
                                        ai: {
                                            ...settings.ai,
                                            enableNLP: e.target.checked
                                        }
                                    })}
                                />
                            }
                            label="자연어 처리"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.ai.contextAware}
                                    onChange={(e) => updateSettings({
                                        ai: {
                                            ...settings.ai,
                                            contextAware: e.target.checked
                                        }
                                    })}
                                />
                            }
                            label="상황 인식"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.ai.learningMode}
                                    onChange={(e) => updateSettings({
                                        ai: {
                                            ...settings.ai,
                                            learningMode: e.target.checked
                                        }
                                    })}
                                />
                            }
                            label="학습 모드"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowSettings(false)}>취소</Button>
                    <Button variant="contained">저장</Button>
                </DialogActions>
            </Dialog>
        </VoiceContainer>
    );
};

export default VoiceAIProvider;
