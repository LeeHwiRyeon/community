import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Badge,
    Progress,
    Icon,
    useColorModeValue,
    Skeleton,
    SkeletonText,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    useToast,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    Tooltip,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Divider
} from '@chakra-ui/react';
import {
    StarIcon,
    ThumbsUpIcon,
    ThumbsDownIcon,
    ViewIcon,
    ChevronDownIcon,
    RefreshIcon,
    SettingsIcon,
    InfoIcon,
    ExternalLinkIcon
} from '@chakra-ui/icons';

interface Recommendation {
    contentId: string;
    score: number;
    reason: string;
    confidence: number;
    reasons?: string[];
    similarUser?: string;
}

interface RecommendationEngineProps {
    userId: string;
    onRecommendationClick?: (contentId: string) => void;
    onFeedback?: (contentId: string, feedback: 'like' | 'dislike') => void;
    autoRefresh?: boolean;
    refreshInterval?: number;
}

const RecommendationEngine: React.FC<RecommendationEngineProps> = ({
    userId,
    onRecommendationClick,
    onFeedback,
    autoRefresh = true,
    refreshInterval = 300000 // 5분
}) => {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [stats, setStats] = useState<any>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const textColor = useColorModeValue('gray.600', 'gray.300');

    // 추천 타입별 설정
    const recommendationTypes = [
        {
            id: 'all',
            name: '통합 추천',
            description: '모든 알고리즘을 종합한 추천',
            color: 'blue'
        },
        {
            id: 'content_based',
            name: '콘텐츠 기반',
            description: '사용자 관심사 기반 추천',
            color: 'green'
        },
        {
            id: 'collaborative',
            name: '협업 필터링',
            description: '비슷한 사용자 기반 추천',
            color: 'purple'
        },
        {
            id: 'popularity',
            name: '인기도 기반',
            description: '인기 콘텐츠 추천',
            color: 'orange'
        }
    ];

    // 추천 데이터 가져오기
    const fetchRecommendations = useCallback(async (type: string = 'all') => {
        setLoading(true);
        setError(null);

        try {
            const endpoint = type === 'all'
                ? '/api/recommendations'
                : `/api/recommendations/${type}`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    limit: 20
                })
            });

            const data = await response.json();

            if (data.success) {
                setRecommendations(data.data.recommendations || []);
                setLastUpdated(new Date());
            } else {
                throw new Error(data.message || '추천 데이터를 가져올 수 없습니다.');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
            setError(errorMessage);
            console.error('추천 데이터 가져오기 오류:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // 통계 데이터 가져오기
    const fetchStats = useCallback(async () => {
        try {
            const response = await fetch('/api/recommendations/stats');
            const data = await response.json();

            if (data.success) {
                setStats(data.data);
            }
        } catch (err) {
            console.error('통계 데이터 가져오기 오류:', err);
        }
    }, []);

    // 상호작용 기록
    const recordInteraction = useCallback(async (contentId: string, type: string, rating?: number) => {
        try {
            await fetch('/api/recommendations/interaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    type,
                    contentId,
                    contentType: 'content', // 실제로는 콘텐츠 타입을 가져와야 함
                    rating
                })
            });

            // 피드백 콜백 실행
            if (onFeedback && (type === 'like' || type === 'dislike')) {
                onFeedback(contentId, type as 'like' | 'dislike');
            }
        } catch (err) {
            console.error('상호작용 기록 오류:', err);
        }
    }, [userId, onFeedback]);

    // 추천 클릭 처리
    const handleRecommendationClick = useCallback((contentId: string) => {
        recordInteraction(contentId, 'view');
        onRecommendationClick?.(contentId);
    }, [recordInteraction, onRecommendationClick]);

    // 좋아요/싫어요 처리
    const handleFeedback = useCallback((contentId: string, feedback: 'like' | 'dislike') => {
        recordInteraction(contentId, feedback, feedback === 'like' ? 5 : 1);

        toast({
            title: feedback === 'like' ? '좋아요!' : '피드백 감사합니다',
            description: `추천 시스템이 학습합니다.`,
            status: 'success',
            duration: 2000,
            isClosable: true,
        });
    }, [recordInteraction, toast]);

    // 추천 새로고침
    const handleRefresh = useCallback(() => {
        const currentType = recommendationTypes[activeTab]?.id || 'all';
        fetchRecommendations(currentType);
    }, [activeTab, fetchRecommendations]);

    // 탭 변경 처리
    const handleTabChange = useCallback((index: number) => {
        setActiveTab(index);
        const type = recommendationTypes[index]?.id || 'all';
        fetchRecommendations(type);
    }, [fetchRecommendations]);

    // 초기 로드
    useEffect(() => {
        fetchRecommendations();
        fetchStats();
    }, [fetchRecommendations, fetchStats]);

    // 자동 새로고침
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            handleRefresh();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, handleRefresh]);

    // 추천 아이템 렌더링
    const renderRecommendationItem = (rec: Recommendation, index: number) => {
        const confidenceColor = rec.confidence > 0.8 ? 'green' : rec.confidence > 0.6 ? 'yellow' : 'red';
        const scorePercentage = Math.round(rec.score * 100);

        return (
            <Box
                key={rec.contentId}
                p={4}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="lg"
                bg={bgColor}
                cursor="pointer"
                _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                transition="all 0.2s"
                onClick={() => handleRecommendationClick(rec.contentId)}
            >
                <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between" align="start">
                        <VStack align="start" spacing={1} flex={1}>
                            <Text fontWeight="bold" fontSize="lg">
                                콘텐츠 {rec.contentId}
                            </Text>
                            <Text fontSize="sm" color={textColor}>
                                추천 이유: {rec.reason}
                            </Text>
                        </VStack>

                        <VStack spacing={1}>
                            <Badge colorScheme={confidenceColor} variant="subtle">
                                {Math.round(rec.confidence * 100)}% 신뢰도
                            </Badge>
                            <Text fontSize="xs" color={textColor}>
                                {scorePercentage}점
                            </Text>
                        </VStack>
                    </HStack>

                    <Progress
                        value={rec.score * 100}
                        colorScheme={confidenceColor}
                        size="sm"
                        borderRadius="full"
                    />

                    {rec.reasons && rec.reasons.length > 1 && (
                        <HStack spacing={1} wrap="wrap">
                            {rec.reasons.map((reason, idx) => (
                                <Badge key={idx} size="sm" colorScheme="blue" variant="outline">
                                    {reason}
                                </Badge>
                            ))}
                        </HStack>
                    )}

                    <HStack justify="space-between">
                        <HStack spacing={2}>
                            <Tooltip label="좋아요">
                                <IconButton
                                    aria-label="좋아요"
                                    icon={<ThumbsUpIcon />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="green"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleFeedback(rec.contentId, 'like');
                                    }}
                                />
                            </Tooltip>
                            <Tooltip label="싫어요">
                                <IconButton
                                    aria-label="싫어요"
                                    icon={<ThumbsDownIcon />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleFeedback(rec.contentId, 'dislike');
                                    }}
                                />
                            </Tooltip>
                        </HStack>

                        <HStack spacing={2}>
                            <Icon as={ViewIcon} boxSize={4} color={textColor} />
                            <Text fontSize="xs" color={textColor}>
                                #{index + 1}
                            </Text>
                        </HStack>
                    </HStack>
                </VStack>
            </Box>
        );
    };

    // 로딩 스켈레톤
    const renderSkeleton = () => (
        <VStack spacing={4} align="stretch">
            {[...Array(3)].map((_, i) => (
                <Box key={i} p={4} border="1px solid" borderColor={borderColor} borderRadius="lg">
                    <SkeletonText noOfLines={2} spacing="4" skeletonHeight="2" />
                    <Skeleton height="20px" mt={4} />
                </Box>
            ))}
        </VStack>
    );

    return (
        <Box w="full" maxW="4xl" mx="auto">
            {/* 헤더 */}
            <HStack justify="space-between" mb={6}>
                <VStack align="start" spacing={1}>
                    <Text fontSize="2xl" fontWeight="bold">
                        AI 추천 시스템
                    </Text>
                    <Text fontSize="sm" color={textColor}>
                        {lastUpdated ? `마지막 업데이트: ${lastUpdated.toLocaleString()}` : '로딩 중...'}
                    </Text>
                </VStack>

                <HStack spacing={2}>
                    <Tooltip label="새로고침">
                        <IconButton
                            aria-label="새로고침"
                            icon={<RefreshIcon />}
                            onClick={handleRefresh}
                            isLoading={loading}
                        />
                    </Tooltip>
                    <Menu>
                        <MenuButton as={IconButton} icon={<SettingsIcon />} />
                        <MenuList>
                            <MenuItem icon={<InfoIcon />}>추천 설정</MenuItem>
                            <MenuItem icon={<ExternalLinkIcon />}>고급 옵션</MenuItem>
                        </MenuList>
                    </Menu>
                </HStack>
            </HStack>

            {/* 통계 */}
            {stats && (
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
                    <Stat textAlign="center" p={3} bg={bgColor} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                        <StatLabel>총 사용자</StatLabel>
                        <StatNumber>{stats.totalUsers}</StatNumber>
                    </Stat>
                    <Stat textAlign="center" p={3} bg={bgColor} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                        <StatLabel>총 콘텐츠</StatLabel>
                        <StatNumber>{stats.totalContent}</StatNumber>
                    </Stat>
                    <Stat textAlign="center" p={3} bg={bgColor} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                        <StatLabel>추천 정확도</StatLabel>
                        <StatNumber>87%</StatNumber>
                        <StatHelpText>
                            <StatArrow type="increase" />
                            12% 증가
                        </StatHelpText>
                    </Stat>
                    <Stat textAlign="center" p={3} bg={bgColor} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                        <StatLabel>활성 추천</StatLabel>
                        <StatNumber>{recommendations.length}</StatNumber>
                    </Stat>
                </SimpleGrid>
            )}

            {/* 추천 타입 탭 */}
            <Tabs index={activeTab} onChange={handleTabChange} mb={6}>
                <TabList>
                    {recommendationTypes.map((type) => (
                        <Tab key={type.id} colorScheme={type.color}>
                            {type.name}
                        </Tab>
                    ))}
                </TabList>

                <TabPanels>
                    {recommendationTypes.map((type) => (
                        <TabPanel key={type.id} px={0}>
                            <VStack align="stretch" spacing={4}>
                                <Text fontSize="sm" color={textColor} mb={4}>
                                    {type.description}
                                </Text>

                                {loading ? (
                                    renderSkeleton()
                                ) : error ? (
                                    <Alert status="error">
                                        <AlertIcon />
                                        <Box>
                                            <AlertTitle>추천을 불러올 수 없습니다!</AlertTitle>
                                            <AlertDescription>{error}</AlertDescription>
                                        </Box>
                                    </Alert>
                                ) : recommendations.length === 0 ? (
                                    <Alert status="info">
                                        <AlertIcon />
                                        <Box>
                                            <AlertTitle>추천할 콘텐츠가 없습니다</AlertTitle>
                                            <AlertDescription>
                                                더 많은 상호작용을 하시면 개인화된 추천을 받을 수 있습니다.
                                            </AlertDescription>
                                        </Box>
                                    </Alert>
                                ) : (
                                    <VStack spacing={4} align="stretch">
                                        {recommendations.map((rec, index) => renderRecommendationItem(rec, index))}
                                    </VStack>
                                )}
                            </VStack>
                        </TabPanel>
                    ))}
                </TabPanels>
            </Tabs>
        </Box>
    );
};

export default RecommendationEngine;
