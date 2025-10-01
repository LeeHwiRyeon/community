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
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Divider,
    Avatar,
    Tooltip,
    useToast,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Image,
    Flex,
    Spacer,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription
} from '@chakra-ui/react';
import {
    StarIcon,
    ThumbsUpIcon,
    ThumbsDownIcon,
    ViewIcon,
    BookmarkIcon,
    ShareIcon,
    CommentIcon,
    ChevronRightIcon,
    SettingsIcon,
    RefreshIcon,
    TrendingUpIcon,
    ClockIcon,
    UsersIcon,
    HeartIcon,
    EyeIcon
} from '@chakra-ui/icons';

interface PersonalizedContent {
    id: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    author: {
        name: string;
        avatar: string;
    };
    stats: {
        views: number;
        likes: number;
        comments: number;
        shares: number;
    };
    score: number;
    confidence: number;
    reason: string;
    thumbnail?: string;
    publishedAt: string;
    readTime: number;
}

interface UserInsights {
    interests: string[];
    activityLevel: number;
    engagementScore: number;
    preferredCategories: Array<{
        category: string;
        score: number;
        count: number;
    }>;
    readingPatterns: {
        averageReadTime: number;
        preferredTimeOfDay: string;
        mostActiveDay: string;
    };
    recommendations: {
        total: number;
        viewed: number;
        liked: number;
        clicked: number;
    };
}

interface PersonalizedDashboardProps {
    userId: string;
    onContentClick?: (contentId: string) => void;
    onCategoryClick?: (category: string) => void;
    onAuthorClick?: (authorId: string) => void;
}

const PersonalizedDashboard: React.FC<PersonalizedDashboardProps> = ({
    userId,
    onContentClick,
    onCategoryClick,
    onAuthorClick
}) => {
    const [personalizedContent, setPersonalizedContent] = useState<PersonalizedContent[]>([]);
    const [userInsights, setUserInsights] = useState<UserInsights | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);

    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const textColor = useColorModeValue('gray.600', 'gray.300');
    const cardBg = useColorModeValue('white', 'gray.700');

    // 샘플 데이터 생성
    const generateSampleData = useCallback(() => {
        const sampleContent: PersonalizedContent[] = [
            {
                id: 'content_1',
                title: 'React 18의 새로운 기능들',
                description: 'React 18에서 도입된 Concurrent Features, Suspense, 그리고 새로운 Hooks에 대해 알아보세요.',
                category: 'programming',
                tags: ['react', 'javascript', 'frontend', 'hooks'],
                author: {
                    name: '김개발',
                    avatar: 'https://bit.ly/dan-abramov'
                },
                stats: {
                    views: 1250,
                    likes: 89,
                    comments: 23,
                    shares: 12
                },
                score: 0.92,
                confidence: 0.88,
                reason: 'content_based',
                thumbnail: 'https://via.placeholder.com/300x200',
                publishedAt: '2024-01-15',
                readTime: 8
            },
            {
                id: 'content_2',
                title: 'Node.js 성능 최적화 가이드',
                description: 'Node.js 애플리케이션의 성능을 향상시키는 실전 기법들을 소개합니다.',
                category: 'programming',
                tags: ['nodejs', 'performance', 'backend', 'optimization'],
                author: {
                    name: '박서버',
                    avatar: 'https://bit.ly/kent-c-dodds'
                },
                stats: {
                    views: 980,
                    likes: 67,
                    comments: 15,
                    shares: 8
                },
                score: 0.87,
                confidence: 0.82,
                reason: 'collaborative',
                thumbnail: 'https://via.placeholder.com/300x200',
                publishedAt: '2024-01-20',
                readTime: 12
            },
            {
                id: 'content_3',
                title: 'UI/UX 디자인 트렌드 2024',
                description: '2024년을 주도할 UI/UX 디자인 트렌드와 실무 적용 방법을 살펴봅니다.',
                category: 'design',
                tags: ['ui', 'ux', 'design', 'trends'],
                author: {
                    name: '이디자인',
                    avatar: 'https://bit.ly/ryan-florence'
                },
                stats: {
                    views: 2100,
                    likes: 156,
                    comments: 34,
                    shares: 28
                },
                score: 0.89,
                confidence: 0.85,
                reason: 'popularity',
                thumbnail: 'https://via.placeholder.com/300x200',
                publishedAt: '2024-01-25',
                readTime: 6
            }
        ];

        const sampleInsights: UserInsights = {
            interests: ['programming', 'design', 'technology'],
            activityLevel: 85,
            engagementScore: 0.78,
            preferredCategories: [
                { category: 'programming', score: 0.92, count: 15 },
                { category: 'design', score: 0.78, count: 8 },
                { category: 'technology', score: 0.65, count: 5 }
            ],
            readingPatterns: {
                averageReadTime: 9,
                preferredTimeOfDay: '오후 2-4시',
                mostActiveDay: '화요일'
            },
            recommendations: {
                total: 45,
                viewed: 32,
                liked: 18,
                clicked: 28
            }
        };

        setPersonalizedContent(sampleContent);
        setUserInsights(sampleInsights);
    }, []);

    // 데이터 로드
    useEffect(() => {
        setLoading(true);
        // 실제로는 API 호출
        setTimeout(() => {
            generateSampleData();
            setLoading(false);
        }, 1000);
    }, [generateSampleData]);

    // 콘텐츠 상호작용 처리
    const handleInteraction = useCallback(async (contentId: string, type: string) => {
        try {
            // API 호출 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 500));

            toast({
                title: '상호작용이 기록되었습니다',
                description: '추천 시스템이 학습합니다.',
                status: 'success',
                duration: 2000,
                isClosable: true,
            });
        } catch (error) {
            console.error('상호작용 기록 오류:', error);
        }
    }, [toast]);

    // 콘텐츠 카드 렌더링
    const renderContentCard = (content: PersonalizedContent, index: number) => {
        const confidenceColor = content.confidence > 0.8 ? 'green' : content.confidence > 0.6 ? 'yellow' : 'red';
        const scorePercentage = Math.round(content.score * 100);

        return (
            <Card
                key={content.id}
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                cursor="pointer"
                _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
                transition="all 0.2s"
                onClick={() => onContentClick?.(content.id)}
            >
                <CardHeader pb={2}>
                    <HStack justify="space-between" align="start">
                        <VStack align="start" spacing={2} flex={1}>
                            <HStack spacing={2}>
                                <Badge colorScheme={confidenceColor} variant="subtle">
                                    {Math.round(content.confidence * 100)}% 신뢰도
                                </Badge>
                                <Badge colorScheme="blue" variant="outline">
                                    {content.reason}
                                </Badge>
                            </HStack>
                            <Text fontSize="lg" fontWeight="bold" noOfLines={2}>
                                {content.title}
                            </Text>
                            <Text fontSize="sm" color={textColor} noOfLines={2}>
                                {content.description}
                            </Text>
                        </VStack>

                        <VStack spacing={1}>
                            <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                                {scorePercentage}
                            </Text>
                            <Text fontSize="xs" color={textColor}>
                                추천 점수
                            </Text>
                        </VStack>
                    </HStack>
                </CardHeader>

                {content.thumbnail && (
                    <Box px={4} pb={2}>
                        <Image
                            src={content.thumbnail}
                            alt={content.title}
                            borderRadius="md"
                            w="full"
                            h="200px"
                            objectFit="cover"
                        />
                    </Box>
                )}

                <CardBody pt={2}>
                    <VStack align="stretch" spacing={3}>
                        {/* 태그 */}
                        <HStack spacing={2} wrap="wrap">
                            {content.tags.slice(0, 3).map((tag) => (
                                <Badge
                                    key={tag}
                                    size="sm"
                                    colorScheme="gray"
                                    variant="subtle"
                                    cursor="pointer"
                                    _hover={{ bg: 'gray.100' }}
                                >
                                    #{tag}
                                </Badge>
                            ))}
                            {content.tags.length > 3 && (
                                <Badge size="sm" colorScheme="gray" variant="outline">
                                    +{content.tags.length - 3}
                                </Badge>
                            )}
                        </HStack>

                        {/* 통계 */}
                        <HStack justify="space-between" fontSize="sm" color={textColor}>
                            <HStack spacing={4}>
                                <HStack spacing={1}>
                                    <Icon as={EyeIcon} boxSize={4} />
                                    <Text>{content.stats.views.toLocaleString()}</Text>
                                </HStack>
                                <HStack spacing={1}>
                                    <Icon as={HeartIcon} boxSize={4} />
                                    <Text>{content.stats.likes}</Text>
                                </HStack>
                                <HStack spacing={1}>
                                    <Icon as={CommentIcon} boxSize={4} />
                                    <Text>{content.stats.comments}</Text>
                                </HStack>
                            </HStack>
                            <HStack spacing={1}>
                                <Icon as={ClockIcon} boxSize={4} />
                                <Text>{content.readTime}분</Text>
                            </HStack>
                        </HStack>

                        {/* 추천 점수 바 */}
                        <Box>
                            <HStack justify="space-between" mb={1}>
                                <Text fontSize="xs" color={textColor}>
                                    추천 점수
                                </Text>
                                <Text fontSize="xs" color={textColor}>
                                    {scorePercentage}%
                                </Text>
                            </HStack>
                            <Progress
                                value={content.score * 100}
                                colorScheme={confidenceColor}
                                size="sm"
                                borderRadius="full"
                            />
                        </Box>
                    </VStack>
                </CardBody>

                <CardFooter pt={2}>
                    <HStack justify="space-between" w="full">
                        <HStack spacing={2}>
                            <Avatar
                                size="sm"
                                src={content.author.avatar}
                                name={content.author.name}
                                cursor="pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAuthorClick?.(content.author.name);
                                }}
                            />
                            <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="medium">
                                    {content.author.name}
                                </Text>
                                <Text fontSize="xs" color={textColor}>
                                    {new Date(content.publishedAt).toLocaleDateString()}
                                </Text>
                            </VStack>
                        </HStack>

                        <HStack spacing={1}>
                            <Tooltip label="좋아요">
                                <IconButton
                                    aria-label="좋아요"
                                    icon={<ThumbsUpIcon />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="green"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleInteraction(content.id, 'like');
                                    }}
                                />
                            </Tooltip>
                            <Tooltip label="북마크">
                                <IconButton
                                    aria-label="북마크"
                                    icon={<BookmarkIcon />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="blue"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleInteraction(content.id, 'bookmark');
                                    }}
                                />
                            </Tooltip>
                            <Tooltip label="공유">
                                <IconButton
                                    aria-label="공유"
                                    icon={<ShareIcon />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="purple"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleInteraction(content.id, 'share');
                                    }}
                                />
                            </Tooltip>
                        </HStack>
                    </HStack>
                </CardFooter>
            </Card>
        );
    };

    // 사용자 인사이트 렌더링
    const renderUserInsights = () => {
        if (!userInsights) return null;

        return (
            <VStack spacing={6} align="stretch">
                {/* 활동 수준 */}
                <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                    <CardHeader>
                        <Text fontSize="lg" fontWeight="bold">
                            활동 수준
                        </Text>
                    </CardHeader>
                    <CardBody>
                        <VStack spacing={4}>
                            <HStack w="full" justify="space-between">
                                <Text>전체 활동</Text>
                                <Text fontWeight="bold">{userInsights.activityLevel}%</Text>
                            </HStack>
                            <Progress
                                value={userInsights.activityLevel}
                                colorScheme="blue"
                                size="lg"
                                borderRadius="full"
                            />
                            <HStack w="full" justify="space-between">
                                <Text>참여도</Text>
                                <Text fontWeight="bold">{Math.round(userInsights.engagementScore * 100)}%</Text>
                            </HStack>
                            <Progress
                                value={userInsights.engagementScore * 100}
                                colorScheme="green"
                                size="lg"
                                borderRadius="full"
                            />
                        </VStack>
                    </CardBody>
                </Card>

                {/* 선호 카테고리 */}
                <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                    <CardHeader>
                        <Text fontSize="lg" fontWeight="bold">
                            선호 카테고리
                        </Text>
                    </CardHeader>
                    <CardBody>
                        <VStack spacing={3}>
                            {userInsights.preferredCategories.map((category, index) => (
                                <Box key={category.category} w="full">
                                    <HStack justify="space-between" mb={1}>
                                        <Text fontSize="sm" fontWeight="medium">
                                            {category.category}
                                        </Text>
                                        <Text fontSize="sm" color={textColor}>
                                            {Math.round(category.score * 100)}% ({category.count}개)
                                        </Text>
                                    </HStack>
                                    <Progress
                                        value={category.score * 100}
                                        colorScheme="purple"
                                        size="sm"
                                        borderRadius="full"
                                    />
                                </Box>
                            ))}
                        </VStack>
                    </CardBody>
                </Card>

                {/* 읽기 패턴 */}
                <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                    <CardHeader>
                        <Text fontSize="lg" fontWeight="bold">
                            읽기 패턴
                        </Text>
                    </CardHeader>
                    <CardBody>
                        <SimpleGrid columns={2} spacing={4}>
                            <Stat textAlign="center">
                                <StatLabel>평균 읽기 시간</StatLabel>
                                <StatNumber>{userInsights.readingPatterns.averageReadTime}분</StatNumber>
                            </Stat>
                            <Stat textAlign="center">
                                <StatLabel>선호 시간대</StatLabel>
                                <StatNumber fontSize="sm">{userInsights.readingPatterns.preferredTimeOfDay}</StatNumber>
                            </Stat>
                        </SimpleGrid>
                    </CardBody>
                </Card>
            </VStack>
        );
    };

    if (loading) {
        return (
            <Box p={6} textAlign="center">
                <Text>개인화된 대시보드를 준비하고 있습니다...</Text>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert status="error">
                <AlertIcon />
                <Box>
                    <AlertTitle>대시보드를 불러올 수 없습니다!</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Box>
            </Alert>
        );
    }

    return (
        <Box w="full" maxW="6xl" mx="auto" p={6}>
            {/* 헤더 */}
            <HStack justify="space-between" mb={8}>
                <VStack align="start" spacing={1}>
                    <Text fontSize="3xl" fontWeight="bold">
                        개인화된 대시보드
                    </Text>
                    <Text fontSize="md" color={textColor}>
                        당신만을 위한 맞춤형 콘텐츠 추천
                    </Text>
                </VStack>

                <HStack spacing={2}>
                    <IconButton
                        aria-label="새로고침"
                        icon={<RefreshIcon />}
                        onClick={() => window.location.reload()}
                    />
                    <Menu>
                        <MenuButton as={IconButton} icon={<SettingsIcon />} />
                        <MenuList>
                            <MenuItem>추천 설정</MenuItem>
                            <MenuItem>알림 설정</MenuItem>
                            <MenuItem>데이터 관리</MenuItem>
                        </MenuList>
                    </Menu>
                </HStack>
            </HStack>

            {/* 통계 요약 */}
            {userInsights && (
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
                    <Stat textAlign="center" p={4} bg={cardBg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                        <StatLabel>총 추천</StatLabel>
                        <StatNumber>{userInsights.recommendations.total}</StatNumber>
                        <StatHelpText>
                            <StatArrow type="increase" />
                            이번 주
                        </StatHelpText>
                    </Stat>
                    <Stat textAlign="center" p={4} bg={cardBg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                        <StatLabel>조회한 콘텐츠</StatLabel>
                        <StatNumber>{userInsights.recommendations.viewed}</StatNumber>
                        <StatHelpText>
                            {Math.round((userInsights.recommendations.viewed / userInsights.recommendations.total) * 100)}% 클릭률
                        </StatHelpText>
                    </Stat>
                    <Stat textAlign="center" p={4} bg={cardBg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                        <StatLabel>좋아요</StatLabel>
                        <StatNumber>{userInsights.recommendations.liked}</StatNumber>
                        <StatHelpText>
                            {Math.round((userInsights.recommendations.liked / userInsights.recommendations.viewed) * 100)}% 만족도
                        </StatHelpText>
                    </Stat>
                    <Stat textAlign="center" p={4} bg={cardBg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                        <StatLabel>활동 수준</StatLabel>
                        <StatNumber>{userInsights.activityLevel}%</StatNumber>
                        <StatHelpText>
                            <StatArrow type="increase" />
                            활발함
                        </StatHelpText>
                    </Stat>
                </SimpleGrid>
            )}

            {/* 메인 콘텐츠 */}
            <Tabs index={activeTab} onChange={setActiveTab}>
                <TabList>
                    <Tab>추천 콘텐츠</Tab>
                    <Tab>내 인사이트</Tab>
                    <Tab>트렌딩</Tab>
                </TabList>

                <TabPanels>
                    <TabPanel px={0}>
                        <VStack spacing={6} align="stretch">
                            <HStack justify="space-between">
                                <Text fontSize="xl" fontWeight="bold">
                                    당신을 위한 추천
                                </Text>
                                <Button size="sm" rightIcon={<ChevronRightIcon />}>
                                    더 보기
                                </Button>
                            </HStack>

                            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                                {personalizedContent.map((content, index) => renderContentCard(content, index))}
                            </SimpleGrid>
                        </VStack>
                    </TabPanel>

                    <TabPanel px={0}>
                        {renderUserInsights()}
                    </TabPanel>

                    <TabPanel px={0}>
                        <VStack spacing={6} align="stretch">
                            <Text fontSize="xl" fontWeight="bold">
                                지금 뜨는 콘텐츠
                            </Text>
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                                {personalizedContent
                                    .sort((a, b) => b.stats.views - a.stats.views)
                                    .map((content, index) => renderContentCard(content, index))}
                            </SimpleGrid>
                        </VStack>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
};

export default PersonalizedDashboard;
