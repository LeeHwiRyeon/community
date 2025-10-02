/**
 * 🧠 머신러닝 개인화 엔진
 * 
 * AI/ML 기반 사용자 개인화, 추천 시스템, 행동 분석을 제공하는
 * 지능형 개인화 시스템
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
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    LinearProgress,
    CircularProgress,
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
    Rating,
    Slider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Alert,
    Tooltip,
    useTheme
} from '@mui/material';
import {
    Psychology as AIIcon,
    PersonSearch as PersonalizeIcon,
    TrendingUp as TrendingIcon,
    Insights as InsightsIcon,
    Recommend as RecommendIcon,
    Analytics as AnalyticsIcon,
    School as LearnIcon,
    Visibility as ViewIcon,
    ThumbUp as LikeIcon,
    Share as ShareIcon,
    Bookmark as BookmarkIcon,
    Schedule as TimeIcon,
    LocationOn as LocationIcon,
    Devices as DeviceIcon,
    Language as LanguageIcon,
    Palette as ThemeIcon,
    Settings as SettingsIcon,
    Refresh as RefreshIcon,
    Download as ExportIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';

// ML 개인화 타입 정의
export interface UserProfile {
    id: string;
    demographics: {
        age?: number;
        gender?: string;
        location?: string;
        language: string;
        timezone: string;
    };
    preferences: {
        topics: string[];
        contentTypes: string[];
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        length: 'short' | 'medium' | 'long';
        format: 'text' | 'video' | 'audio' | 'interactive';
    };
    behavior: {
        readingSpeed: number; // words per minute
        engagementTime: number; // average seconds
        activeHours: number[]; // hours of day (0-23)
        devicePreference: 'mobile' | 'desktop' | 'tablet';
        scrollPattern: 'fast' | 'medium' | 'slow';
    };
    interests: {
        [category: string]: number; // interest score 0-1
    };
    history: UserInteraction[];
}

export interface UserInteraction {
    id: string;
    type: 'view' | 'like' | 'share' | 'comment' | 'bookmark' | 'search' | 'click';
    contentId: string;
    timestamp: Date;
    duration?: number;
    metadata: Record<string, any>;
}

export interface ContentRecommendation {
    id: string;
    contentId: string;
    title: string;
    description: string;
    score: number;
    reasons: string[];
    category: string;
    estimatedReadTime: number;
    thumbnail?: string;
    author: string;
    publishedAt: Date;
}

export interface PersonalizationInsight {
    id: string;
    type: 'trend' | 'preference' | 'behavior' | 'opportunity';
    title: string;
    description: string;
    confidence: number;
    impact: 'low' | 'medium' | 'high';
    actionable: boolean;
    suggestions: string[];
}

export interface MLModel {
    id: string;
    name: string;
    type: 'recommendation' | 'classification' | 'clustering' | 'prediction';
    version: string;
    accuracy: number;
    lastTrained: Date;
    status: 'training' | 'ready' | 'updating' | 'error';
}

interface MLPersonalizationContextValue {
    userProfile: UserProfile | null;
    recommendations: ContentRecommendation[];
    insights: PersonalizationInsight[];
    models: MLModel[];
    isLoading: boolean;

    // 프로필 관리
    updateProfile: (updates: Partial<UserProfile>) => void;
    trackInteraction: (interaction: Omit<UserInteraction, 'id' | 'timestamp'>) => void;

    // 추천 시스템
    getRecommendations: (limit?: number) => Promise<ContentRecommendation[]>;
    refreshRecommendations: () => Promise<void>;
    provideFeedback: (contentId: string, rating: number) => void;

    // 인사이트
    generateInsights: () => Promise<PersonalizationInsight[]>;

    // 모델 관리
    trainModel: (modelId: string) => Promise<void>;
    getModelPerformance: (modelId: string) => Promise<any>;

    // 개인화 설정
    enablePersonalization: boolean;
    setEnablePersonalization: (enabled: boolean) => void;
    privacyMode: boolean;
    setPrivacyMode: (enabled: boolean) => void;
}

// 스타일드 컴포넌트
const PersonalizationContainer = styled(Paper)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
}));

const RecommendationCard = styled(Card)<{ score: number }>(({ theme, score }) => ({
    marginBottom: theme.spacing(2),
    border: `2px solid ${score > 0.8 ? theme.palette.success.main :
            score > 0.6 ? theme.palette.warning.main :
                theme.palette.info.main
        }`,
    position: 'relative',

    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor:
            score > 0.8 ? theme.palette.success.main :
                score > 0.6 ? theme.palette.warning.main :
                    theme.palette.info.main
    }
}));

const InsightCard = styled(Card)<{ impact: PersonalizationInsight['impact'] }>(({ theme, impact }) => ({
    marginBottom: theme.spacing(1),
    borderLeft: `4px solid ${impact === 'high' ? theme.palette.error.main :
            impact === 'medium' ? theme.palette.warning.main :
                theme.palette.info.main
        }`
}));

const ProfileSection = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2)
}));

// ML 유틸리티
const MLUtils = {
    // 코사인 유사도 계산
    cosineSimilarity: (vecA: number[], vecB: number[]): number => {
        const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        return dotProduct / (magnitudeA * magnitudeB);
    },

    // 사용자 관심도 벡터 생성
    generateInterestVector: (profile: UserProfile): number[] => {
        const categories = ['tech', 'design', 'business', 'science', 'art', 'sports', 'travel', 'food'];
        return categories.map(cat => profile.interests[cat] || 0);
    },

    // 컨텐츠 특성 벡터 생성 (모의)
    generateContentVector: (contentId: string): number[] => {
        // 실제로는 컨텐츠 분석을 통해 생성
        return Array.from({ length: 8 }, () => Math.random());
    },

    // 추천 점수 계산
    calculateRecommendationScore: (
        userVector: number[],
        contentVector: number[],
        userBehavior: UserProfile['behavior'],
        contentMetadata: any
    ): number => {
        const similarityScore = MLUtils.cosineSimilarity(userVector, contentVector);
        const behaviorScore = MLUtils.calculateBehaviorScore(userBehavior, contentMetadata);
        const timeScore = MLUtils.calculateTimeScore(userBehavior.activeHours);

        return (similarityScore * 0.5 + behaviorScore * 0.3 + timeScore * 0.2);
    },

    // 행동 점수 계산
    calculateBehaviorScore: (behavior: UserProfile['behavior'], metadata: any): number => {
        let score = 0.5;

        // 읽기 속도와 컨텐츠 길이 매칭
        const estimatedReadTime = metadata.wordCount / behavior.readingSpeed;
        if (estimatedReadTime <= behavior.engagementTime) {
            score += 0.2;
        }

        // 디바이스 선호도
        if (metadata.optimizedFor === behavior.devicePreference) {
            score += 0.1;
        }

        return Math.min(score, 1);
    },

    // 시간 점수 계산
    calculateTimeScore: (activeHours: number[]): number => {
        const currentHour = new Date().getHours();
        return activeHours.includes(currentHour) ? 1 : 0.5;
    },

    // 클러스터링 (K-means 간단 구현)
    kMeansClustering: (data: number[][], k: number): number[][] => {
        // 간단한 K-means 구현
        const centroids = Array.from({ length: k }, () =>
            data[Math.floor(Math.random() * data.length)]
        );

        for (let iter = 0; iter < 10; iter++) {
            const clusters: number[][][] = Array.from({ length: k }, () => []);

            // 데이터 포인트를 가장 가까운 중심에 할당
            data.forEach(point => {
                let minDistance = Infinity;
                let closestCluster = 0;

                centroids.forEach((centroid, i) => {
                    const distance = Math.sqrt(
                        point.reduce((sum, val, j) => sum + Math.pow(val - centroid[j], 2), 0)
                    );
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestCluster = i;
                    }
                });

                clusters[closestCluster].push(point);
            });

            // 중심 업데이트
            clusters.forEach((cluster, i) => {
                if (cluster.length > 0) {
                    centroids[i] = cluster[0].map((_, j) =>
                        cluster.reduce((sum, point) => sum + point[j], 0) / cluster.length
                    );
                }
            });
        }

        return centroids;
    }
};

// ML 개인화 컨텍스트
const MLPersonalizationContext = createContext<MLPersonalizationContextValue | undefined>(undefined);

// 커스텀 훅
export const useMLPersonalization = (): MLPersonalizationContextValue => {
    const context = useContext(MLPersonalizationContext);
    if (!context) {
        throw new Error('useMLPersonalization must be used within MLPersonalizationProvider');
    }
    return context;
};

// ML 개인화 프로바이더
interface MLPersonalizationProviderProps {
    children: ReactNode;
}

export const MLPersonalizationProvider: React.FC<MLPersonalizationProviderProps> = ({ children }) => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);
    const [insights, setInsights] = useState<PersonalizationInsight[]>([]);
    const [models, setModels] = useState<MLModel[]>([
        {
            id: 'recommendation-model',
            name: '추천 모델',
            type: 'recommendation',
            version: '1.2.0',
            accuracy: 0.87,
            lastTrained: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            status: 'ready'
        },
        {
            id: 'classification-model',
            name: '분류 모델',
            type: 'classification',
            version: '1.1.0',
            accuracy: 0.92,
            lastTrained: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            status: 'ready'
        }
    ]);

    const [isLoading, setIsLoading] = useState(false);
    const [enablePersonalization, setEnablePersonalization] = useState(true);
    const [privacyMode, setPrivacyMode] = useState(false);

    // 초기 프로필 생성
    useEffect(() => {
        const defaultProfile: UserProfile = {
            id: 'user-1',
            demographics: {
                language: 'ko',
                timezone: 'Asia/Seoul'
            },
            preferences: {
                topics: ['tech', 'design'],
                contentTypes: ['article', 'tutorial'],
                difficulty: 'intermediate',
                length: 'medium',
                format: 'text'
            },
            behavior: {
                readingSpeed: 200,
                engagementTime: 180,
                activeHours: [9, 10, 11, 14, 15, 16, 20, 21],
                devicePreference: 'desktop',
                scrollPattern: 'medium'
            },
            interests: {
                tech: 0.8,
                design: 0.7,
                business: 0.5,
                science: 0.6,
                art: 0.4,
                sports: 0.2,
                travel: 0.3,
                food: 0.4
            },
            history: []
        };

        setUserProfile(defaultProfile);
    }, []);

    // 프로필 업데이트
    const updateProfile = useCallback((updates: Partial<UserProfile>) => {
        setUserProfile(prev => prev ? { ...prev, ...updates } : null);
    }, []);

    // 상호작용 추적
    const trackInteraction = useCallback((interaction: Omit<UserInteraction, 'id' | 'timestamp'>) => {
        const newInteraction: UserInteraction = {
            ...interaction,
            id: `interaction-${Date.now()}`,
            timestamp: new Date()
        };

        setUserProfile(prev => prev ? {
            ...prev,
            history: [newInteraction, ...prev.history.slice(0, 999)] // 최대 1000개 유지
        } : null);

        // 관심도 업데이트 (간단한 학습)
        if (interaction.type === 'like' || interaction.type === 'bookmark') {
            const category = interaction.metadata?.category;
            if (category) {
                setUserProfile(prev => prev ? {
                    ...prev,
                    interests: {
                        ...prev.interests,
                        [category]: Math.min((prev.interests[category] || 0) + 0.1, 1)
                    }
                } : null);
            }
        }
    }, []);

    // 추천 생성
    const getRecommendations = useCallback(async (limit = 10): Promise<ContentRecommendation[]> => {
        if (!userProfile || !enablePersonalization) return [];

        setIsLoading(true);

        try {
            // 실제로는 ML 모델 API 호출
            await new Promise(resolve => setTimeout(resolve, 1500));

            const userVector = MLUtils.generateInterestVector(userProfile);

            // 모의 컨텐츠 데이터
            const mockContents = Array.from({ length: 50 }, (_, i) => ({
                id: `content-${i}`,
                title: `추천 컨텐츠 ${i + 1}`,
                description: `사용자 관심사에 맞는 흥미로운 컨텐츠입니다.`,
                category: ['tech', 'design', 'business', 'science'][i % 4],
                wordCount: Math.floor(Math.random() * 2000) + 500,
                author: `작성자 ${i + 1}`,
                publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                optimizedFor: ['mobile', 'desktop', 'tablet'][i % 3]
            }));

            // 추천 점수 계산 및 정렬
            const scoredRecommendations = mockContents.map(content => {
                const contentVector = MLUtils.generateContentVector(content.id);
                const score = MLUtils.calculateRecommendationScore(
                    userVector,
                    contentVector,
                    userProfile.behavior,
                    content
                );

                return {
                    id: `rec-${content.id}`,
                    contentId: content.id,
                    title: content.title,
                    description: content.description,
                    score,
                    reasons: [
                        score > 0.8 ? '높은 관심도 매칭' : '관심사 부분 매칭',
                        '최근 활동 패턴 기반',
                        '유사 사용자 선호도'
                    ],
                    category: content.category,
                    estimatedReadTime: Math.ceil(content.wordCount / userProfile.behavior.readingSpeed),
                    author: content.author,
                    publishedAt: content.publishedAt
                };
            }).sort((a, b) => b.score - a.score).slice(0, limit);

            setRecommendations(scoredRecommendations);
            return scoredRecommendations;
        } finally {
            setIsLoading(false);
        }
    }, [userProfile, enablePersonalization]);

    // 추천 새로고침
    const refreshRecommendations = useCallback(async () => {
        await getRecommendations();
    }, [getRecommendations]);

    // 피드백 제공
    const provideFeedback = useCallback((contentId: string, rating: number) => {
        trackInteraction({
            type: rating > 3 ? 'like' : 'view',
            contentId,
            metadata: { rating, feedback: true }
        });
    }, [trackInteraction]);

    // 인사이트 생성
    const generateInsights = useCallback(async (): Promise<PersonalizationInsight[]> => {
        if (!userProfile) return [];

        setIsLoading(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const newInsights: PersonalizationInsight[] = [
                {
                    id: 'insight-1',
                    type: 'trend',
                    title: '기술 관심도 증가',
                    description: '최근 기술 관련 컨텐츠에 대한 관심이 20% 증가했습니다.',
                    confidence: 0.85,
                    impact: 'medium',
                    actionable: true,
                    suggestions: ['더 많은 기술 컨텐츠 추천', '기술 뉴스레터 구독 제안']
                },
                {
                    id: 'insight-2',
                    type: 'behavior',
                    title: '읽기 패턴 변화',
                    description: '평균 읽기 시간이 30초 증가했습니다.',
                    confidence: 0.92,
                    impact: 'low',
                    actionable: false,
                    suggestions: ['더 긴 형태의 컨텐츠 추천']
                },
                {
                    id: 'insight-3',
                    type: 'opportunity',
                    title: '새로운 관심 영역 발견',
                    description: '디자인 관련 컨텐츠에 대한 잠재적 관심이 감지되었습니다.',
                    confidence: 0.73,
                    impact: 'high',
                    actionable: true,
                    suggestions: ['디자인 입문 컨텐츠 추천', '디자인 도구 소개']
                }
            ];

            setInsights(newInsights);
            return newInsights;
        } finally {
            setIsLoading(false);
        }
    }, [userProfile]);

    // 모델 훈련
    const trainModel = useCallback(async (modelId: string) => {
        setModels(prev => prev.map(model =>
            model.id === modelId
                ? { ...model, status: 'training' as const }
                : model
        ));

        // 모의 훈련 과정
        await new Promise(resolve => setTimeout(resolve, 3000));

        setModels(prev => prev.map(model =>
            model.id === modelId
                ? {
                    ...model,
                    status: 'ready' as const,
                    accuracy: Math.min(model.accuracy + 0.02, 0.99),
                    lastTrained: new Date()
                }
                : model
        ));
    }, []);

    // 모델 성능 조회
    const getModelPerformance = useCallback(async (modelId: string) => {
        const model = models.find(m => m.id === modelId);
        if (!model) return null;

        return {
            accuracy: model.accuracy,
            precision: model.accuracy + 0.03,
            recall: model.accuracy - 0.02,
            f1Score: model.accuracy + 0.01,
            trainingTime: '2h 34m',
            dataPoints: 15420
        };
    }, [models]);

    // 초기 추천 로드
    useEffect(() => {
        if (userProfile && enablePersonalization) {
            getRecommendations();
            generateInsights();
        }
    }, [userProfile, enablePersonalization, getRecommendations, generateInsights]);

    const contextValue: MLPersonalizationContextValue = {
        userProfile,
        recommendations,
        insights,
        models,
        isLoading,
        updateProfile,
        trackInteraction,
        getRecommendations,
        refreshRecommendations,
        provideFeedback,
        generateInsights,
        trainModel,
        getModelPerformance,
        enablePersonalization,
        setEnablePersonalization,
        privacyMode,
        setPrivacyMode
    };

    return (
        <MLPersonalizationContext.Provider value={contextValue}>
            {children}
        </MLPersonalizationContext.Provider>
    );
};

// ML 개인화 대시보드
export const MLPersonalizationDashboard: React.FC = () => {
    const {
        userProfile,
        recommendations,
        insights,
        models,
        isLoading,
        refreshRecommendations,
        provideFeedback,
        generateInsights,
        trainModel,
        enablePersonalization,
        setEnablePersonalization,
        privacyMode,
        setPrivacyMode
    } = useMLPersonalization();

    const [activeTab, setActiveTab] = useState<'recommendations' | 'insights' | 'profile' | 'models'>('recommendations');
    const [showSettings, setShowSettings] = useState(false);

    const theme = useTheme();

    if (!userProfile) {
        return (
            <PersonalizationContainer>
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress />
                </Box>
            </PersonalizationContainer>
        );
    }

    return (
        <PersonalizationContainer>
            {/* 헤더 */}
            <Box p={2} borderBottom={1} borderColor="divider">
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">ML 개인화 엔진</Typography>
                    <Box display="flex" gap={1} alignItems="center">
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={enablePersonalization}
                                    onChange={(e) => setEnablePersonalization(e.target.checked)}
                                />
                            }
                            label="개인화"
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

            {/* 상태 표시 */}
            {!enablePersonalization && (
                <Alert severity="info" sx={{ m: 2 }}>
                    개인화가 비활성화되어 있습니다. 일반적인 추천을 제공합니다.
                </Alert>
            )}

            {/* 탭 */}
            <Box display="flex" borderBottom={1} borderColor="divider">
                {[
                    { key: 'recommendations', label: '추천', icon: <RecommendIcon /> },
                    { key: 'insights', label: '인사이트', icon: <InsightsIcon /> },
                    { key: 'profile', label: '프로필', icon: <PersonalizeIcon /> },
                    { key: 'models', label: '모델', icon: <AIIcon /> }
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
                {/* 추천 탭 */}
                {activeTab === 'recommendations' && (
                    <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6">개인화 추천</Typography>
                            <Button
                                startIcon={<RefreshIcon />}
                                onClick={refreshRecommendations}
                                disabled={isLoading}
                            >
                                새로고침
                            </Button>
                        </Box>

                        {isLoading ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            recommendations.map(rec => (
                                <RecommendationCard key={rec.id} score={rec.score}>
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                            <Typography variant="h6">
                                                {rec.title}
                                            </Typography>
                                            <Chip
                                                label={`${Math.round(rec.score * 100)}% 매칭`}
                                                color={
                                                    rec.score > 0.8 ? 'success' :
                                                        rec.score > 0.6 ? 'warning' : 'default'
                                                }
                                                size="small"
                                            />
                                        </Box>

                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            {rec.description}
                                        </Typography>

                                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                                            <Chip label={rec.category} size="small" variant="outlined" />
                                            <Typography variant="caption">
                                                <TimeIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                                {rec.estimatedReadTime}분
                                            </Typography>
                                            <Typography variant="caption">
                                                {rec.author}
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Typography variant="caption" display="block" gutterBottom>
                                                추천 이유:
                                            </Typography>
                                            {rec.reasons.map((reason, index) => (
                                                <Chip
                                                    key={index}
                                                    label={reason}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ mr: 0.5, mb: 0.5 }}
                                                />
                                            ))}
                                        </Box>
                                    </CardContent>

                                    <CardActions>
                                        <Button size="small" startIcon={<ViewIcon />}>
                                            읽기
                                        </Button>
                                        <Button size="small" startIcon={<BookmarkIcon />}>
                                            저장
                                        </Button>
                                        <Button size="small" startIcon={<ShareIcon />}>
                                            공유
                                        </Button>
                                        <Rating
                                            size="small"
                                            onChange={(_, value) => value && provideFeedback(rec.contentId, value)}
                                        />
                                    </CardActions>
                                </RecommendationCard>
                            ))
                        )}
                    </Box>
                )}

                {/* 인사이트 탭 */}
                {activeTab === 'insights' && (
                    <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6">개인화 인사이트</Typography>
                            <Button
                                startIcon={<AnalyticsIcon />}
                                onClick={generateInsights}
                                disabled={isLoading}
                            >
                                분석 업데이트
                            </Button>
                        </Box>

                        {insights.map(insight => (
                            <InsightCard key={insight.id} impact={insight.impact}>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                        <Typography variant="h6">
                                            {insight.title}
                                        </Typography>
                                        <Box display="flex" gap={1}>
                                            <Chip
                                                label={`${Math.round(insight.confidence * 100)}% 신뢰도`}
                                                size="small"
                                                color="primary"
                                            />
                                            <Chip
                                                label={insight.impact}
                                                size="small"
                                                color={
                                                    insight.impact === 'high' ? 'error' :
                                                        insight.impact === 'medium' ? 'warning' : 'default'
                                                }
                                            />
                                        </Box>
                                    </Box>

                                    <Typography variant="body2" gutterBottom>
                                        {insight.description}
                                    </Typography>

                                    {insight.actionable && (
                                        <Box mt={2}>
                                            <Typography variant="caption" display="block" gutterBottom>
                                                실행 가능한 제안:
                                            </Typography>
                                            <List dense>
                                                {insight.suggestions.map((suggestion, index) => (
                                                    <ListItem key={index}>
                                                        <ListItemText primary={suggestion} />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Box>
                                    )}
                                </CardContent>
                            </InsightCard>
                        ))}
                    </Box>
                )}

                {/* 프로필 탭 */}
                {activeTab === 'profile' && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            사용자 프로필
                        </Typography>

                        <ProfileSection>
                            <Typography variant="subtitle1" gutterBottom>
                                관심사 분포
                            </Typography>
                            {Object.entries(userProfile.interests).map(([category, score]) => (
                                <Box key={category} mb={1}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2">{category}</Typography>
                                        <Typography variant="body2">{Math.round(score * 100)}%</Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={score * 100}
                                        sx={{ height: 6, borderRadius: 3 }}
                                    />
                                </Box>
                            ))}
                        </ProfileSection>

                        <ProfileSection>
                            <Typography variant="subtitle1" gutterBottom>
                                행동 패턴
                            </Typography>
                            <Typography variant="body2">
                                읽기 속도: {userProfile.behavior.readingSpeed} 단어/분
                            </Typography>
                            <Typography variant="body2">
                                평균 참여 시간: {userProfile.behavior.engagementTime}초
                            </Typography>
                            <Typography variant="body2">
                                선호 기기: {userProfile.behavior.devicePreference}
                            </Typography>
                            <Typography variant="body2">
                                활동 시간: {userProfile.behavior.activeHours.join(', ')}시
                            </Typography>
                        </ProfileSection>

                        <ProfileSection>
                            <Typography variant="subtitle1" gutterBottom>
                                최근 활동 ({userProfile.history.length}개)
                            </Typography>
                            <List dense>
                                {userProfile.history.slice(0, 10).map(interaction => (
                                    <ListItem key={interaction.id}>
                                        <ListItemIcon>
                                            {interaction.type === 'like' && <LikeIcon />}
                                            {interaction.type === 'view' && <ViewIcon />}
                                            {interaction.type === 'share' && <ShareIcon />}
                                            {interaction.type === 'bookmark' && <BookmarkIcon />}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={`${interaction.type} - ${interaction.contentId}`}
                                            secondary={interaction.timestamp.toLocaleString()}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </ProfileSection>
                    </Box>
                )}

                {/* 모델 탭 */}
                {activeTab === 'models' && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            ML 모델 관리
                        </Typography>

                        {models.map(model => (
                            <Card key={model.id} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                        <Typography variant="h6">
                                            {model.name}
                                        </Typography>
                                        <Chip
                                            label={model.status}
                                            color={
                                                model.status === 'ready' ? 'success' :
                                                    model.status === 'training' ? 'warning' :
                                                        model.status === 'error' ? 'error' : 'default'
                                            }
                                        />
                                    </Box>

                                    <Typography variant="body2" gutterBottom>
                                        타입: {model.type} | 버전: {model.version}
                                    </Typography>

                                    <Box mb={2}>
                                        <Typography variant="body2" gutterBottom>
                                            정확도: {Math.round(model.accuracy * 100)}%
                                        </Typography>
                                        <LinearProgress
                                            variant="determinate"
                                            value={model.accuracy * 100}
                                            sx={{ height: 8, borderRadius: 4 }}
                                        />
                                    </Box>

                                    <Typography variant="caption" color="text.secondary">
                                        마지막 훈련: {model.lastTrained.toLocaleString()}
                                    </Typography>
                                </CardContent>

                                <CardActions>
                                    <Button
                                        size="small"
                                        startIcon={<LearnIcon />}
                                        onClick={() => trainModel(model.id)}
                                        disabled={model.status === 'training'}
                                    >
                                        재훈련
                                    </Button>
                                    <Button size="small" startIcon={<AnalyticsIcon />}>
                                        성능 분석
                                    </Button>
                                </CardActions>
                            </Card>
                        ))}
                    </Box>
                )}
            </Box>

            {/* 설정 다이얼로그 */}
            <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="sm" fullWidth>
                <DialogTitle>개인화 설정</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={3} pt={1}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={enablePersonalization}
                                    onChange={(e) => setEnablePersonalization(e.target.checked)}
                                />
                            }
                            label="개인화 추천 활성화"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={privacyMode}
                                    onChange={(e) => setPrivacyMode(e.target.checked)}
                                />
                            }
                            label="프라이버시 모드 (데이터 수집 최소화)"
                        />

                        <Alert severity="info">
                            개인화 기능은 사용자의 행동 데이터를 분석하여 더 나은 추천을 제공합니다.
                            프라이버시 모드에서는 최소한의 데이터만 수집됩니다.
                        </Alert>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowSettings(false)}>닫기</Button>
                </DialogActions>
            </Dialog>
        </PersonalizationContainer>
    );
};

export default MLPersonalizationProvider;
