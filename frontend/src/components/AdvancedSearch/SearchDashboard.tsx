import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Card,
    CardBody,
    CardHeader,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    Badge,
    Progress,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    useToast,
    Spinner,
    Alert,
    AlertIcon,
    Divider,
    Flex,
    Spacer,
    IconButton,
    Tooltip,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    List,
    ListItem,
    ListIcon,
    OrderedList,
    UnorderedList
} from '@chakra-ui/react';
import {
    SearchIcon,
    TrendingUpIcon,
    ViewIcon,
    StarIcon,
    TimeIcon,
    SettingsIcon,
    DownloadIcon,
    RefreshIcon,
    InfoIcon,
    WarningIcon,
    CheckIcon,
    CloseIcon
} from '@chakra-ui/icons';
import AdvancedSearchBar from './AdvancedSearchBar';

interface SearchAnalytics {
    totalSearches: number;
    popularSearches: Array<{ query: string; count: number }>;
    averageResultsPerSearch: number;
    searchTrends: {
        hourly: Array<{ hour: number; searches: number }>;
        daily: Array<{ day: number; searches: number }>;
    };
}

interface SearchPerformance {
    averageSearchTime: number;
    totalSearches: number;
    cacheHitRate: number;
    indexSize: number;
    memoryUsage: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
        arrayBuffers: number;
    };
    uptime: number;
}

const SearchDashboard: React.FC = () => {
    const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
    const [performance, setPerformance] = useState<SearchPerformance | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFilters, setSearchFilters] = useState<any>({});
    const [recentSearches, setRecentSearches] = useState<any[]>([]);

    const { isOpen: isPerformanceOpen, onOpen: onPerformanceOpen, onClose: onPerformanceClose } = useDisclosure();
    const { isOpen: isAnalyticsOpen, onOpen: onAnalyticsOpen, onClose: onAnalyticsClose } = useDisclosure();

    const toast = useToast();

    // 데이터 로드
    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // 검색 분석 데이터 로드
            const analyticsResponse = await fetch('/api/advanced-search/analytics');
            const analyticsData = await analyticsResponse.json();
            if (analyticsData.success) {
                setAnalytics(analyticsData.data);
            }

            // 성능 데이터 로드
            const performanceResponse = await fetch('/api/advanced-search/performance');
            const performanceData = await performanceResponse.json();
            if (performanceData.success) {
                setPerformance(performanceData.data);
            }

            // 최근 검색 로드
            const historyResponse = await fetch('/api/advanced-search/history/current_user');
            const historyData = await historyResponse.json();
            if (historyData.success) {
                setRecentSearches(historyData.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('데이터를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 검색 실행 핸들러
    const handleSearch = (query: string, filters: any) => {
        setSearchQuery(query);
        setSearchFilters(filters);
        toast({
            title: '검색 실행',
            description: `"${query}" 검색이 실행되었습니다.`,
            status: 'info',
            duration: 2000,
            isClosable: true
        });
    };

    // 인덱스 재구축
    const rebuildIndex = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/advanced-search/index/rebuild', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type: 'all' })
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: '인덱스 재구축 완료',
                    description: '검색 인덱스가 성공적으로 재구축되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error rebuilding index:', error);
            toast({
                title: '인덱스 재구축 실패',
                description: '인덱스 재구축 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        } finally {
            setIsLoading(false);
        }
    };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        fetchData();
    }, []);

    // 메모리 사용량 포맷팅
    const formatMemoryUsage = (bytes: number) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    // 시간 포맷팅
    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}일 ${hours}시간 ${minutes}분`;
    };

    if (isLoading && !analytics) {
        return (
            <Box p={8} textAlign="center">
                <Spinner size="xl" />
                <Text mt={4}>검색 대시보드 데이터를 불러오는 중...</Text>
            </Box>
        );
    }

    return (
        <Box p={6}>
            {/* Header */}
            <VStack spacing={4} align="stretch" mb={8}>
                <HStack justify="space-between">
                    <Text fontSize="3xl" fontWeight="bold" color="purple.600">
                        🔍 고급 검색 대시보드
                    </Text>
                    <HStack spacing={2}>
                        <Button leftIcon={<RefreshIcon />} colorScheme="purple" variant="outline" onClick={fetchData}>
                            새로고침
                        </Button>
                        <Button leftIcon={<SettingsIcon />} colorScheme="purple" variant="outline" onClick={onPerformanceOpen}>
                            성능 모니터링
                        </Button>
                        <Button leftIcon={<DownloadIcon />} colorScheme="purple" variant="outline" onClick={onAnalyticsOpen}>
                            분석 상세보기
                        </Button>
                    </HStack>
                </HStack>

                {/* 검색 바 */}
                <Card>
                    <CardBody>
                        <AdvancedSearchBar
                            onSearch={handleSearch}
                            placeholder="고급 검색을 시작하세요..."
                            showFilters={true}
                            showSuggestions={true}
                        />
                    </CardBody>
                </Card>
            </VStack>

            {/* Error Alert */}
            {error && (
                <Alert status="error" mb={4}>
                    <AlertIcon />
                    {error}
                </Alert>
            )}

            {/* 통계 카드 */}
            {analytics && (
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
                    <Card>
                        <CardBody textAlign="center">
                            <Stat>
                                <StatLabel>총 검색 수</StatLabel>
                                <StatNumber color="purple.500">{analytics.totalSearches.toLocaleString()}</StatNumber>
                                <StatHelpText>
                                    <StatArrow type="increase" />
                                    12% 증가
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody textAlign="center">
                            <Stat>
                                <StatLabel>평균 결과 수</StatLabel>
                                <StatNumber color="green.500">{analytics.averageResultsPerSearch.toFixed(1)}</StatNumber>
                                <StatHelpText>
                                    검색당 평균
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody textAlign="center">
                            <Stat>
                                <StatLabel>인기 검색어</StatLabel>
                                <StatNumber color="blue.500">{analytics.popularSearches.length}</StatNumber>
                                <StatHelpText>
                                    추적 중인 키워드
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody textAlign="center">
                            <Stat>
                                <StatLabel>캐시 적중률</StatLabel>
                                <StatNumber color="orange.500">{(performance?.cacheHitRate * 100 || 0).toFixed(1)}%</StatNumber>
                                <StatHelpText>
                                    성능 최적화
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                </SimpleGrid>
            )}

            {/* 탭 네비게이션 */}
            <Tabs>
                <TabList>
                    <Tab>인기 검색어</Tab>
                    <Tab>검색 트렌드</Tab>
                    <Tab>최근 검색</Tab>
                    <Tab>성능 지표</Tab>
                    <Tab>관리 도구</Tab>
                </TabList>

                <TabPanels>
                    {/* 인기 검색어 탭 */}
                    <TabPanel p={0}>
                        <Card>
                            <CardHeader>
                                <Text fontSize="lg" fontWeight="bold">인기 검색어</Text>
                            </CardHeader>
                            <CardBody>
                                {analytics?.popularSearches && analytics.popularSearches.length > 0 ? (
                                    <VStack spacing={3} align="stretch">
                                        {analytics.popularSearches.map((item, index) => (
                                            <HStack key={index} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                                                <HStack spacing={3}>
                                                    <Badge colorScheme="purple" size="sm">
                                                        #{index + 1}
                                                    </Badge>
                                                    <Text fontWeight="medium">{item.query}</Text>
                                                </HStack>
                                                <HStack spacing={2}>
                                                    <Text fontSize="sm" color="gray.500">
                                                        {item.count}회
                                                    </Text>
                                                    <Progress
                                                        value={(item.count / analytics.popularSearches[0].count) * 100}
                                                        size="sm"
                                                        colorScheme="purple"
                                                        w="100px"
                                                    />
                                                </HStack>
                                            </HStack>
                                        ))}
                                    </VStack>
                                ) : (
                                    <Text color="gray.500">인기 검색어 데이터가 없습니다.</Text>
                                )}
                            </CardBody>
                        </Card>
                    </TabPanel>

                    {/* 검색 트렌드 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">시간대별 검색량</Text>
                                </CardHeader>
                                <CardBody>
                                    {analytics?.searchTrends.hourly ? (
                                        <VStack spacing={2} align="stretch">
                                            {analytics.searchTrends.hourly.slice(0, 12).map((item, index) => (
                                                <HStack key={index} justify="space-between">
                                                    <Text fontSize="sm">{item.hour}시</Text>
                                                    <HStack spacing={2}>
                                                        <Progress
                                                            value={(item.searches / Math.max(...analytics.searchTrends.hourly.map(h => h.searches))) * 100}
                                                            size="sm"
                                                            colorScheme="blue"
                                                            w="100px"
                                                        />
                                                        <Text fontSize="sm" color="gray.500">{item.searches}</Text>
                                                    </HStack>
                                                </HStack>
                                            ))}
                                        </VStack>
                                    ) : (
                                        <Text color="gray.500">트렌드 데이터가 없습니다.</Text>
                                    )}
                                </CardBody>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">요일별 검색량</Text>
                                </CardHeader>
                                <CardBody>
                                    {analytics?.searchTrends.daily ? (
                                        <VStack spacing={2} align="stretch">
                                            {analytics.searchTrends.daily.map((item, index) => {
                                                const days = ['일', '월', '화', '수', '목', '금', '토'];
                                                return (
                                                    <HStack key={index} justify="space-between">
                                                        <Text fontSize="sm">{days[item.day]}요일</Text>
                                                        <HStack spacing={2}>
                                                            <Progress
                                                                value={(item.searches / Math.max(...analytics.searchTrends.daily.map(d => d.searches))) * 100}
                                                                size="sm"
                                                                colorScheme="green"
                                                                w="100px"
                                                            />
                                                            <Text fontSize="sm" color="gray.500">{item.searches}</Text>
                                                        </HStack>
                                                    </HStack>
                                                );
                                            })}
                                        </VStack>
                                    ) : (
                                        <Text color="gray.500">트렌드 데이터가 없습니다.</Text>
                                    )}
                                </CardBody>
                            </Card>
                        </SimpleGrid>
                    </TabPanel>

                    {/* 최근 검색 탭 */}
                    <TabPanel p={0}>
                        <Card>
                            <CardHeader>
                                <HStack justify="space-between">
                                    <Text fontSize="lg" fontWeight="bold">최근 검색 기록</Text>
                                    <Button size="sm" variant="outline" colorScheme="red">
                                        전체 삭제
                                    </Button>
                                </HStack>
                            </CardHeader>
                            <CardBody>
                                {recentSearches.length > 0 ? (
                                    <VStack spacing={2} align="stretch">
                                        {recentSearches.slice(0, 10).map((search, index) => (
                                            <HStack key={index} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                                                <HStack spacing={3}>
                                                    <SearchIcon color="gray.400" />
                                                    <Text>{search.query}</Text>
                                                    <Badge colorScheme="gray" size="sm">
                                                        {search.analyzedQuery?.intent || 'general'}
                                                    </Badge>
                                                </HStack>
                                                <HStack spacing={2}>
                                                    <Text fontSize="sm" color="gray.500">
                                                        {new Date(search.timestamp).toLocaleString('ko-KR')}
                                                    </Text>
                                                    <IconButton
                                                        size="sm"
                                                        variant="ghost"
                                                        icon={<CloseIcon />}
                                                        aria-label="Delete search"
                                                        colorScheme="red"
                                                    />
                                                </HStack>
                                            </HStack>
                                        ))}
                                    </VStack>
                                ) : (
                                    <Text color="gray.500">최근 검색 기록이 없습니다.</Text>
                                )}
                            </CardBody>
                        </Card>
                    </TabPanel>

                    {/* 성능 지표 탭 */}
                    <TabPanel p={0}>
                        {performance && (
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                                <Card>
                                    <CardHeader>
                                        <Text fontSize="lg" fontWeight="bold">검색 성능</Text>
                                    </CardHeader>
                                    <CardBody>
                                        <VStack spacing={4} align="stretch">
                                            <HStack justify="space-between">
                                                <Text>평균 검색 시간</Text>
                                                <Text fontWeight="bold" color="green.500">
                                                    {performance.averageSearchTime}ms
                                                </Text>
                                            </HStack>
                                            <HStack justify="space-between">
                                                <Text>캐시 적중률</Text>
                                                <Text fontWeight="bold" color="blue.500">
                                                    {(performance.cacheHitRate * 100).toFixed(1)}%
                                                </Text>
                                            </HStack>
                                            <HStack justify="space-between">
                                                <Text>인덱스 크기</Text>
                                                <Text fontWeight="bold" color="purple.500">
                                                    {performance.indexSize.toLocaleString()}개
                                                </Text>
                                            </HStack>
                                            <HStack justify="space-between">
                                                <Text>서버 가동시간</Text>
                                                <Text fontWeight="bold" color="orange.500">
                                                    {formatUptime(performance.uptime)}
                                                </Text>
                                            </HStack>
                                        </VStack>
                                    </CardBody>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <Text fontSize="lg" fontWeight="bold">메모리 사용량</Text>
                                    </CardHeader>
                                    <CardBody>
                                        <VStack spacing={4} align="stretch">
                                            <HStack justify="space-between">
                                                <Text>RSS</Text>
                                                <Text fontWeight="bold">
                                                    {formatMemoryUsage(performance.memoryUsage.rss)}
                                                </Text>
                                            </HStack>
                                            <HStack justify="space-between">
                                                <Text>Heap Total</Text>
                                                <Text fontWeight="bold">
                                                    {formatMemoryUsage(performance.memoryUsage.heapTotal)}
                                                </Text>
                                            </HStack>
                                            <HStack justify="space-between">
                                                <Text>Heap Used</Text>
                                                <Text fontWeight="bold" color="red.500">
                                                    {formatMemoryUsage(performance.memoryUsage.heapUsed)}
                                                </Text>
                                            </HStack>
                                            <HStack justify="space-between">
                                                <Text>External</Text>
                                                <Text fontWeight="bold">
                                                    {formatMemoryUsage(performance.memoryUsage.external)}
                                                </Text>
                                            </HStack>
                                        </VStack>
                                    </CardBody>
                                </Card>
                            </SimpleGrid>
                        )}
                    </TabPanel>

                    {/* 관리 도구 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">인덱스 관리</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <Button
                                            colorScheme="purple"
                                            leftIcon={<RefreshIcon />}
                                            onClick={rebuildIndex}
                                            isLoading={isLoading}
                                            loadingText="재구축 중..."
                                        >
                                            전체 인덱스 재구축
                                        </Button>
                                        <Button
                                            colorScheme="blue"
                                            variant="outline"
                                            leftIcon={<SettingsIcon />}
                                        >
                                            인덱스 설정
                                        </Button>
                                        <Button
                                            colorScheme="green"
                                            variant="outline"
                                            leftIcon={<CheckIcon />}
                                        >
                                            인덱스 상태 확인
                                        </Button>
                                    </VStack>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">검색 최적화</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <Button
                                            colorScheme="orange"
                                            leftIcon={<TrendingUpIcon />}
                                        >
                                            성능 분석 실행
                                        </Button>
                                        <Button
                                            colorScheme="teal"
                                            variant="outline"
                                            leftIcon={<ViewIcon />}
                                        >
                                            검색 로그 분석
                                        </Button>
                                        <Button
                                            colorScheme="pink"
                                            variant="outline"
                                            leftIcon={<StarIcon />}
                                        >
                                            추천 알고리즘 튜닝
                                        </Button>
                                    </VStack>
                                </CardBody>
                            </Card>
                        </SimpleGrid>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            {/* 성능 모니터링 모달 */}
            <Modal isOpen={isPerformanceOpen} onClose={onPerformanceClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>성능 모니터링 상세</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {performance && (
                            <VStack spacing={6} align="stretch">
                                <Card>
                                    <CardHeader>
                                        <Text fontWeight="bold">실시간 성능 지표</Text>
                                    </CardHeader>
                                    <CardBody>
                                        <SimpleGrid columns={2} spacing={4}>
                                            <Box>
                                                <Text fontSize="sm" color="gray.500">평균 검색 시간</Text>
                                                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                                                    {performance.averageSearchTime}ms
                                                </Text>
                                            </Box>
                                            <Box>
                                                <Text fontSize="sm" color="gray.500">캐시 적중률</Text>
                                                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                                                    {(performance.cacheHitRate * 100).toFixed(1)}%
                                                </Text>
                                            </Box>
                                        </SimpleGrid>
                                    </CardBody>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <Text fontWeight="bold">메모리 사용량 상세</Text>
                                    </CardHeader>
                                    <CardBody>
                                        <VStack spacing={3} align="stretch">
                                            {Object.entries(performance.memoryUsage).map(([key, value]) => (
                                                <HStack key={key} justify="space-between">
                                                    <Text fontSize="sm" textTransform="capitalize">
                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                    </Text>
                                                    <Text fontWeight="bold">
                                                        {formatMemoryUsage(value)}
                                                    </Text>
                                                </HStack>
                                            ))}
                                        </VStack>
                                    </CardBody>
                                </Card>
                            </VStack>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 분석 상세보기 모달 */}
            <Modal isOpen={isAnalyticsOpen} onClose={onAnalyticsClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>검색 분석 상세</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {analytics && (
                            <VStack spacing={6} align="stretch">
                                <Card>
                                    <CardHeader>
                                        <Text fontWeight="bold">검색 통계</Text>
                                    </CardHeader>
                                    <CardBody>
                                        <SimpleGrid columns={2} spacing={4}>
                                            <Box>
                                                <Text fontSize="sm" color="gray.500">총 검색 수</Text>
                                                <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                                                    {analytics.totalSearches.toLocaleString()}
                                                </Text>
                                            </Box>
                                            <Box>
                                                <Text fontSize="sm" color="gray.500">평균 결과 수</Text>
                                                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                                                    {analytics.averageResultsPerSearch.toFixed(1)}
                                                </Text>
                                            </Box>
                                        </SimpleGrid>
                                    </CardBody>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <Text fontWeight="bold">인기 검색어 TOP 10</Text>
                                    </CardHeader>
                                    <CardBody>
                                        <OrderedList spacing={2}>
                                            {analytics.popularSearches.slice(0, 10).map((item, index) => (
                                                <ListItem key={index}>
                                                    <HStack justify="space-between">
                                                        <Text>{item.query}</Text>
                                                        <Badge colorScheme="purple">{item.count}회</Badge>
                                                    </HStack>
                                                </ListItem>
                                            ))}
                                        </OrderedList>
                                    </CardBody>
                                </Card>
                            </VStack>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default SearchDashboard;
