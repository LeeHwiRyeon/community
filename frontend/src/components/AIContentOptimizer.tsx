/**
 * 🤖 AI 컨텐츠 최적화 시스템
 * 
 * AI 기반 컨텐츠 분석, 최적화, SEO, 품질 개선을 제공하는
 * 지능형 컨텐츠 최적화 시스템
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
    CardActions,
    Chip,
    LinearProgress,
    CircularProgress,
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Tooltip,
    Badge,
    Divider,
    useTheme
} from '@mui/material';
import {
    AutoAwesome as AIIcon,
    TrendingUp as OptimizeIcon,
    Search as SEOIcon,
    Spellcheck as GrammarIcon,
    Translate as TranslateIcon,
    Psychology as ToneIcon,
    Speed as PerformanceIcon,
    Visibility as ReadabilityIcon,
    Tag as KeywordIcon,
    Share as SocialIcon,
    Analytics as AnalyticsIcon,
    Lightbulb as SuggestionIcon,
    Check as CheckIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    ExpandMore as ExpandMoreIcon,
    Refresh as RefreshIcon,
    Download as ExportIcon,
    Settings as SettingsIcon,
    Star as StarIcon,
    ThumbUp as ThumbUpIcon,
    ThumbDown as ThumbDownIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';

// AI 최적화 타입 정의
export interface ContentAnalysis {
    id: string;
    timestamp: Date;
    content: string;
    scores: {
        overall: number;
        readability: number;
        seo: number;
        engagement: number;
        grammar: number;
        tone: number;
    };
    metrics: {
        wordCount: number;
        sentenceCount: number;
        paragraphCount: number;
        readingTime: number;
        keywordDensity: Record<string, number>;
        sentimentScore: number;
    };
    issues: ContentIssue[];
    suggestions: ContentSuggestion[];
    seoAnalysis: SEOAnalysis;
    socialOptimization: SocialOptimization;
}

export interface ContentIssue {
    id: string;
    type: 'grammar' | 'spelling' | 'style' | 'seo' | 'readability' | 'accessibility';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    position: {
        start: number;
        end: number;
        blockId?: string;
    };
    suggestion?: string;
    autoFixable: boolean;
}

export interface ContentSuggestion {
    id: string;
    category: 'structure' | 'style' | 'seo' | 'engagement' | 'accessibility';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'easy' | 'moderate' | 'complex';
    implementation: string;
    beforeAfter?: {
        before: string;
        after: string;
    };
}

export interface SEOAnalysis {
    score: number;
    title: {
        length: number;
        optimal: boolean;
        suggestions: string[];
    };
    description: {
        length: number;
        optimal: boolean;
        suggestions: string[];
    };
    keywords: {
        primary: string[];
        secondary: string[];
        density: Record<string, number>;
        suggestions: string[];
    };
    headings: {
        structure: boolean;
        h1Count: number;
        missingLevels: number[];
    };
    images: {
        total: number;
        withAlt: number;
        optimized: number;
    };
    links: {
        internal: number;
        external: number;
        broken: number;
    };
}

export interface SocialOptimization {
    platforms: {
        facebook: {
            title: string;
            description: string;
            image: string;
            score: number;
        };
        twitter: {
            title: string;
            description: string;
            image: string;
            hashtags: string[];
            score: number;
        };
        linkedin: {
            title: string;
            description: string;
            image: string;
            score: number;
        };
    };
    engagement: {
        hooks: string[];
        callToActions: string[];
        shareability: number;
    };
}

export interface AIOptimizationSettings {
    autoAnalyze: boolean;
    realTimeCheck: boolean;
    language: string;
    targetAudience: 'general' | 'professional' | 'academic' | 'casual';
    contentType: 'blog' | 'article' | 'social' | 'email' | 'documentation';
    seoFocus: boolean;
    accessibilityCheck: boolean;
    tonePreference: 'formal' | 'casual' | 'friendly' | 'professional' | 'persuasive';
}

interface AIOptimizerContextValue {
    analysis: ContentAnalysis | null;
    isAnalyzing: boolean;
    settings: AIOptimizationSettings;

    // 분석 기능
    analyzeContent: (content: string) => Promise<ContentAnalysis>;
    reanalyze: () => Promise<void>;

    // 최적화 기능
    applySuggestion: (suggestionId: string) => Promise<void>;
    fixIssue: (issueId: string) => Promise<void>;
    optimizeForSEO: () => Promise<void>;
    improveReadability: () => Promise<void>;

    // 설정 관리
    updateSettings: (newSettings: Partial<AIOptimizationSettings>) => void;

    // 내보내기
    exportReport: () => Promise<Blob>;
}

// 기본 설정
const DEFAULT_AI_SETTINGS: AIOptimizationSettings = {
    autoAnalyze: true,
    realTimeCheck: false,
    language: 'ko',
    targetAudience: 'general',
    contentType: 'blog',
    seoFocus: true,
    accessibilityCheck: true,
    tonePreference: 'professional'
};

// 스타일드 컴포넌트
const OptimizerPanel = styled(Paper)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
}));

const ScoreCard = styled(Card)<{ score: number }>(({ theme, score }) => ({
    background: `linear-gradient(135deg, ${score >= 80 ? theme.palette.success.light :
            score >= 60 ? theme.palette.warning.light :
                theme.palette.error.light
        }, ${score >= 80 ? theme.palette.success.main :
            score >= 60 ? theme.palette.warning.main :
                theme.palette.error.main
        })`,
    color: 'white',
    textAlign: 'center'
}));

const IssueChip = styled(Chip)<{ severity: ContentIssue['severity'] }>(({ theme, severity }) => ({
    backgroundColor:
        severity === 'critical' ? theme.palette.error.main :
            severity === 'high' ? theme.palette.error.light :
                severity === 'medium' ? theme.palette.warning.main :
                    theme.palette.info.main,
    color: 'white'
}));

const SuggestionCard = styled(Card)<{ impact: ContentSuggestion['impact'] }>(({ theme, impact }) => ({
    borderLeft: `4px solid ${impact === 'high' ? theme.palette.success.main :
            impact === 'medium' ? theme.palette.warning.main :
                theme.palette.info.main
        }`,
    marginBottom: theme.spacing(1)
}));

// AI 최적화 컨텍스트
const AIOptimizerContext = createContext<AIOptimizerContextValue | undefined>(undefined);

// 커스텀 훅
export const useAIOptimizer = (): AIOptimizerContextValue => {
    const context = useContext(AIOptimizerContext);
    if (!context) {
        throw new Error('useAIOptimizer must be used within AIOptimizerProvider');
    }
    return context;
};

// AI 최적화 프로바이더
interface AIOptimizerProviderProps {
    children: ReactNode;
}

export const AIOptimizerProvider: React.FC<AIOptimizerProviderProps> = ({ children }) => {
    const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [settings, setSettings] = useState<AIOptimizationSettings>(() => {
        try {
            const saved = localStorage.getItem('ai-optimizer-settings');
            return saved ? { ...DEFAULT_AI_SETTINGS, ...JSON.parse(saved) } : DEFAULT_AI_SETTINGS;
        } catch {
            return DEFAULT_AI_SETTINGS;
        }
    });

    // 모의 AI 분석 함수
    const analyzeContent = useCallback(async (content: string): Promise<ContentAnalysis> => {
        setIsAnalyzing(true);

        try {
            // 실제로는 AI API 호출
            await new Promise(resolve => setTimeout(resolve, 2000));

            const wordCount = content.split(/\s+/).length;
            const sentenceCount = content.split(/[.!?]+/).length;
            const paragraphCount = content.split(/\n\s*\n/).length;

            const mockAnalysis: ContentAnalysis = {
                id: `analysis-${Date.now()}`,
                timestamp: new Date(),
                content,
                scores: {
                    overall: Math.floor(Math.random() * 40) + 60,
                    readability: Math.floor(Math.random() * 30) + 70,
                    seo: Math.floor(Math.random() * 50) + 50,
                    engagement: Math.floor(Math.random() * 40) + 60,
                    grammar: Math.floor(Math.random() * 20) + 80,
                    tone: Math.floor(Math.random() * 30) + 70
                },
                metrics: {
                    wordCount,
                    sentenceCount,
                    paragraphCount,
                    readingTime: Math.ceil(wordCount / 200),
                    keywordDensity: {
                        '컨텐츠': 0.05,
                        '최적화': 0.03,
                        'AI': 0.02
                    },
                    sentimentScore: Math.random() * 2 - 1
                },
                issues: [
                    {
                        id: 'issue-1',
                        type: 'seo',
                        severity: 'medium',
                        message: 'H1 태그가 누락되었습니다.',
                        position: { start: 0, end: 10 },
                        suggestion: '메인 제목에 H1 태그를 추가하세요.',
                        autoFixable: true
                    },
                    {
                        id: 'issue-2',
                        type: 'readability',
                        severity: 'low',
                        message: '문장이 너무 깁니다.',
                        position: { start: 50, end: 120 },
                        suggestion: '문장을 두 개로 나누어 가독성을 높이세요.',
                        autoFixable: false
                    }
                ],
                suggestions: [
                    {
                        id: 'suggestion-1',
                        category: 'seo',
                        title: '메타 설명 최적화',
                        description: '검색 엔진 최적화를 위해 메타 설명을 개선하세요.',
                        impact: 'high',
                        effort: 'easy',
                        implementation: '150-160자 내외의 매력적인 메타 설명을 작성하세요.',
                        beforeAfter: {
                            before: '기존 설명...',
                            after: '최적화된 설명...'
                        }
                    },
                    {
                        id: 'suggestion-2',
                        category: 'engagement',
                        title: '콜투액션 추가',
                        description: '독자의 참여를 유도하는 콜투액션을 추가하세요.',
                        impact: 'medium',
                        effort: 'easy',
                        implementation: '글 마지막에 댓글이나 공유를 유도하는 문구를 추가하세요.'
                    }
                ],
                seoAnalysis: {
                    score: Math.floor(Math.random() * 50) + 50,
                    title: {
                        length: 45,
                        optimal: true,
                        suggestions: ['키워드를 앞쪽에 배치하세요']
                    },
                    description: {
                        length: 120,
                        optimal: false,
                        suggestions: ['150-160자로 확장하세요']
                    },
                    keywords: {
                        primary: ['컨텐츠', '최적화'],
                        secondary: ['AI', '분석', '개선'],
                        density: { '컨텐츠': 0.05, '최적화': 0.03 },
                        suggestions: ['롱테일 키워드를 추가하세요']
                    },
                    headings: {
                        structure: false,
                        h1Count: 0,
                        missingLevels: [1]
                    },
                    images: {
                        total: 3,
                        withAlt: 1,
                        optimized: 2
                    },
                    links: {
                        internal: 2,
                        external: 1,
                        broken: 0
                    }
                },
                socialOptimization: {
                    platforms: {
                        facebook: {
                            title: '페이스북 최적화 제목',
                            description: '페이스북용 설명',
                            image: '/og-image.jpg',
                            score: 75
                        },
                        twitter: {
                            title: '트위터 최적화 제목',
                            description: '트위터용 설명',
                            image: '/twitter-card.jpg',
                            hashtags: ['#컨텐츠', '#AI', '#최적화'],
                            score: 80
                        },
                        linkedin: {
                            title: '링크드인 최적화 제목',
                            description: '링크드인용 설명',
                            image: '/linkedin-image.jpg',
                            score: 70
                        }
                    },
                    engagement: {
                        hooks: ['궁금하지 않으신가요?', '이것만 알면 됩니다'],
                        callToActions: ['지금 시작하세요', '더 알아보기'],
                        shareability: 65
                    }
                }
            };

            setAnalysis(mockAnalysis);
            return mockAnalysis;
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    // 재분석
    const reanalyze = useCallback(async () => {
        if (analysis) {
            await analyzeContent(analysis.content);
        }
    }, [analysis, analyzeContent]);

    // 제안 적용
    const applySuggestion = useCallback(async (suggestionId: string) => {
        // 실제로는 제안을 적용하는 로직
        console.log('Applying suggestion:', suggestionId);
    }, []);

    // 이슈 수정
    const fixIssue = useCallback(async (issueId: string) => {
        if (!analysis) return;

        setAnalysis(prev => prev ? {
            ...prev,
            issues: prev.issues.filter(issue => issue.id !== issueId)
        } : null);
    }, [analysis]);

    // SEO 최적화
    const optimizeForSEO = useCallback(async () => {
        // SEO 최적화 로직
        console.log('Optimizing for SEO...');
    }, []);

    // 가독성 개선
    const improveReadability = useCallback(async () => {
        // 가독성 개선 로직
        console.log('Improving readability...');
    }, []);

    // 설정 업데이트
    const updateSettings = useCallback((newSettings: Partial<AIOptimizationSettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('ai-optimizer-settings', JSON.stringify(updated));
            return updated;
        });
    }, []);

    // 보고서 내보내기
    const exportReport = useCallback(async (): Promise<Blob> => {
        if (!analysis) throw new Error('No analysis available');

        const report = {
            analysis,
            generatedAt: new Date(),
            settings
        };

        return new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    }, [analysis, settings]);

    const contextValue: AIOptimizerContextValue = {
        analysis,
        isAnalyzing,
        settings,
        analyzeContent,
        reanalyze,
        applySuggestion,
        fixIssue,
        optimizeForSEO,
        improveReadability,
        updateSettings,
        exportReport
    };

    return (
        <AIOptimizerContext.Provider value={contextValue}>
            {children}
        </AIOptimizerContext.Provider>
    );
};

// AI 최적화 대시보드
export const AIOptimizerDashboard: React.FC = () => {
    const {
        analysis,
        isAnalyzing,
        reanalyze,
        applySuggestion,
        fixIssue,
        exportReport
    } = useAIOptimizer();

    const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'suggestions' | 'seo' | 'social'>('overview');

    const theme = useTheme();

    const handleExportReport = async () => {
        try {
            const blob = await exportReport();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `content-analysis-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    if (!analysis && !isAnalyzing) {
        return (
            <OptimizerPanel>
                <Box p={3} textAlign="center">
                    <AIIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        AI 컨텐츠 분석
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                        컨텐츠를 입력하면 AI가 자동으로 분석하고 최적화 제안을 제공합니다.
                    </Typography>
                </Box>
            </OptimizerPanel>
        );
    }

    if (isAnalyzing) {
        return (
            <OptimizerPanel>
                <Box p={3} textAlign="center">
                    <CircularProgress size={64} sx={{ mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        AI 분석 중...
                    </Typography>
                    <Typography color="text.secondary">
                        컨텐츠를 분석하고 최적화 제안을 생성하고 있습니다.
                    </Typography>
                </Box>
            </OptimizerPanel>
        );
    }

    return (
        <OptimizerPanel>
            {/* 헤더 */}
            <Box p={2} borderBottom={1} borderColor="divider">
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">AI 컨텐츠 최적화</Typography>
                    <Box>
                        <IconButton onClick={reanalyze} disabled={isAnalyzing}>
                            <RefreshIcon />
                        </IconButton>
                        <IconButton onClick={handleExportReport}>
                            <ExportIcon />
                        </IconButton>
                    </Box>
                </Box>
            </Box>

            {/* 탭 */}
            <Box display="flex" borderBottom={1} borderColor="divider">
                {[
                    { key: 'overview', label: '개요', icon: <AnalyticsIcon /> },
                    { key: 'issues', label: '이슈', icon: <WarningIcon /> },
                    { key: 'suggestions', label: '제안', icon: <SuggestionIcon /> },
                    { key: 'seo', label: 'SEO', icon: <SEOIcon /> },
                    { key: 'social', label: '소셜', icon: <SocialIcon /> }
                ].map(tab => (
                    <Button
                        key={tab.key}
                        startIcon={tab.icon}
                        onClick={() => setActiveTab(tab.key as any)}
                        variant={activeTab === tab.key ? 'contained' : 'text'}
                        sx={{ minWidth: 'auto', px: 2 }}
                    >
                        {tab.label}
                        {tab.key === 'issues' && analysis && (
                            <Badge
                                badgeContent={analysis.issues.length}
                                color="error"
                                sx={{ ml: 1 }}
                            />
                        )}
                        {tab.key === 'suggestions' && analysis && (
                            <Badge
                                badgeContent={analysis.suggestions.length}
                                color="primary"
                                sx={{ ml: 1 }}
                            />
                        )}
                    </Button>
                ))}
            </Box>

            <Box flex={1} overflow="auto" p={2}>
                {/* 개요 탭 */}
                {activeTab === 'overview' && analysis && (
                    <Box>
                        {/* 점수 카드들 */}
                        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={2} mb={3}>
                            {Object.entries(analysis.scores).map(([key, score]) => (
                                <ScoreCard key={key} score={score}>
                                    <CardContent>
                                        <Typography variant="h4" gutterBottom>
                                            {score}
                                        </Typography>
                                        <Typography variant="body2">
                                            {key === 'overall' && '전체'}
                                            {key === 'readability' && '가독성'}
                                            {key === 'seo' && 'SEO'}
                                            {key === 'engagement' && '참여도'}
                                            {key === 'grammar' && '문법'}
                                            {key === 'tone' && '톤'}
                                        </Typography>
                                    </CardContent>
                                </ScoreCard>
                            ))}
                        </Box>

                        {/* 메트릭 */}
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    컨텐츠 메트릭
                                </Typography>
                                <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(120px, 1fr))" gap={2}>
                                    <Box textAlign="center">
                                        <Typography variant="h5" color="primary">
                                            {analysis.metrics.wordCount}
                                        </Typography>
                                        <Typography variant="caption">단어</Typography>
                                    </Box>
                                    <Box textAlign="center">
                                        <Typography variant="h5" color="primary">
                                            {analysis.metrics.sentenceCount}
                                        </Typography>
                                        <Typography variant="caption">문장</Typography>
                                    </Box>
                                    <Box textAlign="center">
                                        <Typography variant="h5" color="primary">
                                            {analysis.metrics.paragraphCount}
                                        </Typography>
                                        <Typography variant="caption">단락</Typography>
                                    </Box>
                                    <Box textAlign="center">
                                        <Typography variant="h5" color="primary">
                                            {analysis.metrics.readingTime}분
                                        </Typography>
                                        <Typography variant="caption">읽기 시간</Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* 키워드 밀도 */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    키워드 밀도
                                </Typography>
                                {Object.entries(analysis.metrics.keywordDensity).map(([keyword, density]) => (
                                    <Box key={keyword} mb={1}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body2">{keyword}</Typography>
                                            <Typography variant="body2">{(density * 100).toFixed(1)}%</Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={density * 100}
                                            sx={{ height: 6, borderRadius: 3 }}
                                        />
                                    </Box>
                                ))}
                            </CardContent>
                        </Card>
                    </Box>
                )}

                {/* 이슈 탭 */}
                {activeTab === 'issues' && analysis && (
                    <Box>
                        {analysis.issues.length === 0 ? (
                            <Alert severity="success">
                                <Typography>발견된 이슈가 없습니다! 컨텐츠가 잘 최적화되어 있습니다.</Typography>
                            </Alert>
                        ) : (
                            <List>
                                {analysis.issues.map(issue => (
                                    <ListItem key={issue.id}>
                                        <ListItemIcon>
                                            {issue.severity === 'critical' && <ErrorIcon color="error" />}
                                            {issue.severity === 'high' && <WarningIcon color="error" />}
                                            {issue.severity === 'medium' && <WarningIcon color="warning" />}
                                            {issue.severity === 'low' && <InfoIcon color="info" />}
                                        </ListItemIcon>

                                        <ListItemText
                                            primary={
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    {issue.message}
                                                    <IssueChip
                                                        label={issue.severity}
                                                        size="small"
                                                        severity={issue.severity}
                                                    />
                                                    <Chip
                                                        label={issue.type}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </Box>
                                            }
                                            secondary={issue.suggestion}
                                        />

                                        {issue.autoFixable && (
                                            <Button
                                                size="small"
                                                startIcon={<CheckIcon />}
                                                onClick={() => fixIssue(issue.id)}
                                            >
                                                자동 수정
                                            </Button>
                                        )}
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Box>
                )}

                {/* 제안 탭 */}
                {activeTab === 'suggestions' && analysis && (
                    <Box>
                        {analysis.suggestions.map(suggestion => (
                            <SuggestionCard key={suggestion.id} impact={suggestion.impact}>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                        <Typography variant="h6">
                                            {suggestion.title}
                                        </Typography>
                                        <Box display="flex" gap={1}>
                                            <Chip
                                                label={`${suggestion.impact} 영향`}
                                                size="small"
                                                color={
                                                    suggestion.impact === 'high' ? 'success' :
                                                        suggestion.impact === 'medium' ? 'warning' : 'default'
                                                }
                                            />
                                            <Chip
                                                label={`${suggestion.effort} 난이도`}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </Box>
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        {suggestion.description}
                                    </Typography>

                                    <Typography variant="body2" gutterBottom>
                                        {suggestion.implementation}
                                    </Typography>

                                    {suggestion.beforeAfter && (
                                        <Accordion>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                <Typography variant="body2">예시 보기</Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Box>
                                                    <Typography variant="subtitle2" color="error">
                                                        변경 전:
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                                        {suggestion.beforeAfter.before}
                                                    </Typography>

                                                    <Typography variant="subtitle2" color="success.main">
                                                        변경 후:
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {suggestion.beforeAfter.after}
                                                    </Typography>
                                                </Box>
                                            </AccordionDetails>
                                        </Accordion>
                                    )}
                                </CardContent>

                                <CardActions>
                                    <Button
                                        size="small"
                                        startIcon={<CheckIcon />}
                                        onClick={() => applySuggestion(suggestion.id)}
                                    >
                                        적용하기
                                    </Button>
                                    <Button size="small" startIcon={<ThumbUpIcon />}>
                                        도움됨
                                    </Button>
                                    <Button size="small" startIcon={<ThumbDownIcon />}>
                                        도움안됨
                                    </Button>
                                </CardActions>
                            </SuggestionCard>
                        ))}
                    </Box>
                )}

                {/* SEO 탭 */}
                {activeTab === 'seo' && analysis && (
                    <Box>
                        <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    SEO 점수: {analysis.seoAnalysis.score}/100
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={analysis.seoAnalysis.score}
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                            </CardContent>
                        </Card>

                        {/* SEO 세부 분석은 실제 구현에서 추가 */}
                    </Box>
                )}

                {/* 소셜 탭 */}
                {activeTab === 'social' && analysis && (
                    <Box>
                        {Object.entries(analysis.socialOptimization.platforms).map(([platform, data]) => (
                            <Card key={platform} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        {platform.charAt(0).toUpperCase() + platform.slice(1)} 최적화
                                    </Typography>
                                    <Typography variant="body2" gutterBottom>
                                        점수: {data.score}/100
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={data.score}
                                        sx={{ height: 6, borderRadius: 3, mb: 2 }}
                                    />

                                    <Typography variant="subtitle2">제목:</Typography>
                                    <Typography variant="body2" gutterBottom>{data.title}</Typography>

                                    <Typography variant="subtitle2">설명:</Typography>
                                    <Typography variant="body2">{data.description}</Typography>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}
            </Box>
        </OptimizerPanel>
    );
};

export default AIOptimizerProvider;
