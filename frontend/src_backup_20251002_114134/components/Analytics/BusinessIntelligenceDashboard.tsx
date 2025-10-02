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
    Progress,
    Badge,
    Divider,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    useToast,
    Spinner,
    Alert,
    AlertIcon,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    Flex,
    Spacer,
    IconButton,
    Tooltip,
    useColorModeValue,
    Select,
    Input,
    InputGroup,
    InputLeftElement,
    Wrap,
    WrapItem,
    Circle,
    List,
    ListItem,
    ListIcon,
    OrderedList,
    UnorderedList
} from '@chakra-ui/react';
import {
    TrendingUpIcon,
    TrendingDownIcon,
    ViewIcon,
    DownloadIcon,
    RefreshIcon,
    SettingsIcon,
    InfoIcon,
    WarningIcon,
    CheckIcon,
    CloseIcon,
    StarIcon,
    UsersIcon,
    DollarIcon,
    TimeIcon,
    ChartBarIcon,
    PieChartIcon,
    BarChartIcon,
    LineChartIcon
} from '@chakra-ui/icons';

interface KPIData {
    id: string;
    name: string;
    description: string;
    type: string;
    target: number;
    current: number;
    trend: string;
    category: string;
    priority: string;
    status: string;
    variance: number;
    forecast: {
        nextMonth: number;
        nextQuarter: number;
        nextYear: number;
    };
}

interface DashboardData {
    summary: {
        totalUsers: number;
        activeUsers: number;
        revenue: number;
        growth: number;
        satisfaction: number;
    };
    kpis: KPIData[];
    charts: {
        userGrowth: Array<{ date: string; value: number }>;
        revenue: Array<{ date: string; value: number }>;
        engagement: Array<{ date: string; sessions: number; pageViews: number }>;
        conversion: Array<{ date: string; value: number }>;
        satisfaction: Array<{ date: string; value: number }>;
    };
    insights: Array<{
        id: string;
        type: string;
        title: string;
        description: string;
        impact: string;
        recommendation: string;
        confidence: number;
    }>;
    alerts: Array<{
        id: string;
        type: string;
        title: string;
        description: string;
        timestamp: string;
        action: string;
    }>;
    trends: {
        userGrowth: { trend: string; change: number; period: string };
        revenue: { trend: string; change: number; period: string };
        engagement: { trend: string; change: number; period: string };
        satisfaction: { trend: string; change: number; period: string };
    };
}

const BusinessIntelligenceDashboard: React.FC = () => {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState('30d');
    const [selectedTab, setSelectedTab] = useState(0);

    const { isOpen: isExportModalOpen, onOpen: onExportModalOpen, onClose: onExportModalClose } = useDisclosure();
    const { isOpen: isSettingsModalOpen, onOpen: onSettingsModalOpen, onClose: onSettingsModalClose } = useDisclosure();

    const [exportType, setExportType] = useState('dashboard');
    const [exportFormat, setExportFormat] = useState('json');

    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // 데이터 로드
    const fetchData = async (period = '30d') => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch(`/api/business-intelligence/dashboard?period=${period}`);
            const data = await response.json();

            if (data.success) {
                setDashboardData(data.data);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('데이터를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 데이터 내보내기
    const exportData = async () => {
        try {
            const response = await fetch(`/api/business-intelligence/export/${exportType}?format=${exportFormat}`);

            if (exportFormat === 'csv') {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${exportType}_export.${exportFormat}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const data = await response.json();
                const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${exportType}_export.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }

            toast({
                title: '데이터 내보내기 완료',
                description: `${exportType} 데이터가 성공적으로 내보내기되었습니다.`,
                status: 'success',
                duration: 3000,
                isClosable: true
            });

            onExportModalClose();
        } catch (error) {
            console.error('Error exporting data:', error);
            toast({
                title: '내보내기 실패',
                description: '데이터 내보내기 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        fetchData(selectedPeriod);
    }, [selectedPeriod]);

    // KPI 상태 색상
    const getKPIStatusColor = (status: string) => {
        switch (status) {
            case 'excellent': return 'green';
            case 'good': return 'blue';
            case 'warning': return 'yellow';
            case 'critical': return 'red';
            default: return 'gray';
        }
    };

    // 트렌드 아이콘
    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'increasing': return <TrendingUpIcon color="green.500" />;
            case 'decreasing': return <TrendingDownIcon color="red.500" />;
            default: return <ViewIcon color="gray.500" />;
        }
    };

    // 인사이트 타입 색상
    const getInsightColor = (type: string) => {
        switch (type) {
            case 'positive': return 'green';
            case 'warning': return 'yellow';
            case 'opportunity': return 'blue';
            case 'negative': return 'red';
            default: return 'gray';
        }
    };

    // 알림 타입 색상
    const getAlertColor = (type: string) => {
        switch (type) {
            case 'critical': return 'red';
            case 'warning': return 'yellow';
            case 'info': return 'blue';
            case 'success': return 'green';
            default: return 'gray';
        }
    };

    if (isLoading && !dashboardData) {
        return (
            <Box p={8} textAlign="center">
                <Spinner size="xl" />
                <Text mt={4}>비즈니스 인텔리전스 데이터를 불러오는 중...</Text>
            </Box>
        );
    }

    return (
        <Box p={6}>
            {/* Header */}
            <VStack spacing={4} align="stretch" mb={8}>
                <HStack justify="space-between">
                    <Text fontSize="3xl" fontWeight="bold" color="blue.600">
                        📊 비즈니스 인텔리전스 대시보드
                    </Text>
                    <HStack spacing={2}>
                        <Select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            w="150px"
                        >
                            <option value="7d">최근 7일</option>
                            <option value="30d">최근 30일</option>
                            <option value="90d">최근 90일</option>
                        </Select>
                        <Button leftIcon={<RefreshIcon />} colorScheme="blue" variant="outline" onClick={() => fetchData(selectedPeriod)}>
                            새로고침
                        </Button>
                        <Button leftIcon={<DownloadIcon />} colorScheme="blue" variant="outline" onClick={onExportModalOpen}>
                            내보내기
                        </Button>
                        <Button leftIcon={<SettingsIcon />} colorScheme="blue" variant="outline" onClick={onSettingsModalOpen}>
                            설정
                        </Button>
                    </HStack>
                </HStack>

                {/* 요약 카드 */}
                {dashboardData && (
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>총 사용자</StatLabel>
                                    <StatNumber color="blue.500">{dashboardData.summary.totalUsers.toLocaleString()}</StatNumber>
                                    <StatHelpText>
                                        <StatArrow type="increase" />
                                        {dashboardData.summary.growth}%
                                    </StatHelpText>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>활성 사용자</StatLabel>
                                    <StatNumber color="green.500">{dashboardData.summary.activeUsers.toLocaleString()}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>월간 수익</StatLabel>
                                    <StatNumber color="purple.500">${dashboardData.summary.revenue.toLocaleString()}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>고객 만족도</StatLabel>
                                    <StatNumber color="orange.500">{dashboardData.summary.satisfaction}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                    </SimpleGrid>
                )}
            </VStack>

            {/* Error Alert */}
            {error && (
                <Alert status="error" mb={4}>
                    <AlertIcon />
                    {error}
                </Alert>
            )}

            {/* 탭 네비게이션 */}
            <Tabs index={selectedTab} onChange={setSelectedTab}>
                <TabList>
                    <Tab>KPI 대시보드</Tab>
                    <Tab>사용자 분석</Tab>
                    <Tab>수익 분석</Tab>
                    <Tab>콘텐츠 분석</Tab>
                    <Tab>성능 분석</Tab>
                    <Tab>인사이트</Tab>
                </TabList>

                <TabPanels>
                    {/* KPI 대시보드 탭 */}
                    <TabPanel p={0}>
                        <VStack spacing={6} align="stretch">
                            {/* KPI 카드들 */}
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                                {dashboardData?.kpis.map(kpi => (
                                    <Card key={kpi.id} bg={bgColor} borderColor={borderColor}>
                                        <CardBody>
                                            <VStack spacing={3} align="stretch">
                                                <HStack justify="space-between">
                                                    <Text fontWeight="bold" fontSize="lg">
                                                        {kpi.name}
                                                    </Text>
                                                    <Badge colorScheme={getKPIStatusColor(kpi.status)} size="sm">
                                                        {kpi.status.toUpperCase()}
                                                    </Badge>
                                                </HStack>

                                                <Text fontSize="sm" color="gray.600">
                                                    {kpi.description}
                                                </Text>

                                                <HStack justify="space-between">
                                                    <Text fontSize="2xl" fontWeight="bold">
                                                        {kpi.current.toLocaleString()}
                                                        {kpi.type === 'percentage' && '%'}
                                                        {kpi.type === 'duration' && '초'}
                                                    </Text>
                                                    <HStack>
                                                        {getTrendIcon(kpi.trend)}
                                                        <Text fontSize="sm" color="gray.600">
                                                            {kpi.target.toLocaleString()}
                                                            {kpi.type === 'percentage' && '%'}
                                                        </Text>
                                                    </HStack>
                                                </HStack>

                                                <Progress
                                                    value={(kpi.current / kpi.target) * 100}
                                                    colorScheme={getKPIStatusColor(kpi.status)}
                                                    size="sm"
                                                />

                                                <HStack justify="space-between" fontSize="sm">
                                                    <Text color="gray.600">목표 대비</Text>
                                                    <Text color={kpi.variance >= 0 ? 'green.500' : 'red.500'}>
                                                        {kpi.variance >= 0 ? '+' : ''}{kpi.variance.toFixed(1)}%
                                                    </Text>
                                                </HStack>
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                ))}
                            </SimpleGrid>

                            {/* 차트 영역 */}
                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">주요 지표 트렌드</Text>
                                </CardHeader>
                                <CardBody>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                                        <Box>
                                            <Text fontWeight="medium" mb={4}>사용자 증가</Text>
                                            <Box h="200px" bg="gray.50" borderRadius="md" p={4}>
                                                <Text color="gray.500" textAlign="center">
                                                    차트 컴포넌트 (Chart.js 또는 Recharts 사용)
                                                </Text>
                                            </Box>
                                        </Box>
                                        <Box>
                                            <Text fontWeight="medium" mb={4}>수익 트렌드</Text>
                                            <Box h="200px" bg="gray.50" borderRadius="md" p={4}>
                                                <Text color="gray.500" textAlign="center">
                                                    차트 컴포넌트 (Chart.js 또는 Recharts 사용)
                                                </Text>
                                            </Box>
                                        </Box>
                                    </SimpleGrid>
                                </CardBody>
                            </Card>
                        </VStack>
                    </TabPanel>

                    {/* 사용자 분석 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">사용자 인구통계</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <Box>
                                            <Text fontWeight="medium" mb={2}>연령대별 분포</Text>
                                            <VStack spacing={2} align="stretch">
                                                {[
                                                    { age: '18-24', percentage: 25, color: 'blue' },
                                                    { age: '25-34', percentage: 35, color: 'green' },
                                                    { age: '35-44', percentage: 28, color: 'yellow' },
                                                    { age: '45-54', percentage: 12, color: 'red' }
                                                ].map((item, index) => (
                                                    <HStack key={index} justify="space-between">
                                                        <Text fontSize="sm">{item.age}세</Text>
                                                        <HStack spacing={2}>
                                                            <Progress
                                                                value={item.percentage}
                                                                colorScheme={item.color}
                                                                size="sm"
                                                                w="100px"
                                                            />
                                                            <Text fontSize="sm" fontWeight="bold">{item.percentage}%</Text>
                                                        </HStack>
                                                    </HStack>
                                                ))}
                                            </VStack>
                                        </Box>

                                        <Box>
                                            <Text fontWeight="medium" mb={2}>성별 분포</Text>
                                            <HStack spacing={4}>
                                                <VStack>
                                                    <Circle size="60px" bg="blue.500" color="white">
                                                        <Text fontWeight="bold">55%</Text>
                                                    </Circle>
                                                    <Text fontSize="sm">남성</Text>
                                                </VStack>
                                                <VStack>
                                                    <Circle size="60px" bg="pink.500" color="white">
                                                        <Text fontWeight="bold">42%</Text>
                                                    </Circle>
                                                    <Text fontSize="sm">여성</Text>
                                                </VStack>
                                                <VStack>
                                                    <Circle size="60px" bg="gray.500" color="white">
                                                        <Text fontWeight="bold">3%</Text>
                                                    </Circle>
                                                    <Text fontSize="sm">기타</Text>
                                                </VStack>
                                            </HStack>
                                        </Box>
                                    </VStack>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">사용자 행동</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <Box>
                                            <Text fontWeight="medium" mb={2}>디바이스 유형</Text>
                                            <VStack spacing={2} align="stretch">
                                                {[
                                                    { device: '모바일', percentage: 60, color: 'blue' },
                                                    { device: '데스크톱', percentage: 35, color: 'green' },
                                                    { device: '태블릿', percentage: 5, color: 'yellow' }
                                                ].map((item, index) => (
                                                    <HStack key={index} justify="space-between">
                                                        <Text fontSize="sm">{item.device}</Text>
                                                        <HStack spacing={2}>
                                                            <Progress
                                                                value={item.percentage}
                                                                colorScheme={item.color}
                                                                size="sm"
                                                                w="100px"
                                                            />
                                                            <Text fontSize="sm" fontWeight="bold">{item.percentage}%</Text>
                                                        </HStack>
                                                    </HStack>
                                                ))}
                                            </VStack>
                                        </Box>

                                        <Box>
                                            <Text fontWeight="medium" mb={2}>브라우저 분포</Text>
                                            <VStack spacing={2} align="stretch">
                                                {[
                                                    { browser: 'Chrome', percentage: 65 },
                                                    { browser: 'Safari', percentage: 20 },
                                                    { browser: 'Firefox', percentage: 10 },
                                                    { browser: 'Edge', percentage: 5 }
                                                ].map((item, index) => (
                                                    <HStack key={index} justify="space-between">
                                                        <Text fontSize="sm">{item.browser}</Text>
                                                        <Text fontSize="sm" fontWeight="bold">{item.percentage}%</Text>
                                                    </HStack>
                                                ))}
                                            </VStack>
                                        </Box>
                                    </VStack>
                                </CardBody>
                            </Card>
                        </SimpleGrid>
                    </TabPanel>

                    {/* 수익 분석 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">수익 개요</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <HStack justify="space-between">
                                            <Text>월간 수익</Text>
                                            <Text fontWeight="bold" fontSize="lg">$125,000</Text>
                                        </HStack>
                                        <HStack justify="space-between">
                                            <Text>연간 수익</Text>
                                            <Text fontWeight="bold" fontSize="lg">$1,500,000</Text>
                                        </HStack>
                                        <HStack justify="space-between">
                                            <Text>성장률</Text>
                                            <Text fontWeight="bold" color="green.500">+18.3%</Text>
                                        </HStack>
                                        <HStack justify="space-between">
                                            <Text>ARPU</Text>
                                            <Text fontWeight="bold">$14.04</Text>
                                        </HStack>
                                        <HStack justify="space-between">
                                            <Text>LTV</Text>
                                            <Text fontWeight="bold">$420</Text>
                                        </HStack>
                                        <HStack justify="space-between">
                                            <Text>CAC</Text>
                                            <Text fontWeight="bold">$25</Text>
                                        </HStack>
                                    </VStack>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">수익원별 분포</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        {[
                                            { source: '구독', percentage: 60, color: 'blue' },
                                            { source: '광고', percentage: 25, color: 'green' },
                                            { source: '거래', percentage: 10, color: 'yellow' },
                                            { source: '기타', percentage: 5, color: 'red' }
                                        ].map((item, index) => (
                                            <HStack key={index} justify="space-between">
                                                <Text fontSize="sm">{item.source}</Text>
                                                <HStack spacing={2}>
                                                    <Progress
                                                        value={item.percentage}
                                                        colorScheme={item.color}
                                                        size="sm"
                                                        w="100px"
                                                    />
                                                    <Text fontSize="sm" fontWeight="bold">{item.percentage}%</Text>
                                                </HStack>
                                            </HStack>
                                        ))}
                                    </VStack>
                                </CardBody>
                            </Card>
                        </SimpleGrid>
                    </TabPanel>

                    {/* 콘텐츠 분석 탭 */}
                    <TabPanel p={0}>
                        <Card>
                            <CardHeader>
                                <Text fontSize="lg" fontWeight="bold">콘텐츠 성과</Text>
                            </CardHeader>
                            <CardBody>
                                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
                                    <Box textAlign="center">
                                        <Text fontSize="2xl" fontWeight="bold" color="blue.500">12,500</Text>
                                        <Text fontSize="sm" color="gray.600">총 게시물</Text>
                                    </Box>
                                    <Box textAlign="center">
                                        <Text fontSize="2xl" fontWeight="bold" color="green.500">45,000</Text>
                                        <Text fontSize="sm" color="gray.600">총 댓글</Text>
                                    </Box>
                                    <Box textAlign="center">
                                        <Text fontSize="2xl" fontWeight="bold" color="purple.500">125,000</Text>
                                        <Text fontSize="sm" color="gray.600">총 좋아요</Text>
                                    </Box>
                                    <Box textAlign="center">
                                        <Text fontSize="2xl" fontWeight="bold" color="orange.500">8,500</Text>
                                        <Text fontSize="sm" color="gray.600">총 공유</Text>
                                    </Box>
                                </SimpleGrid>

                                <Text fontWeight="medium" mb={4}>인기 콘텐츠</Text>
                                <VStack spacing={3} align="stretch">
                                    {[
                                        { title: 'React 고급 패턴 가이드', views: 12500, likes: 450, comments: 89 },
                                        { title: 'Node.js 성능 최적화', views: 9800, likes: 320, comments: 67 },
                                        { title: 'JavaScript ES2024 신기능', views: 8700, likes: 280, comments: 45 }
                                    ].map((content, index) => (
                                        <Box key={index} p={4} bg="gray.50" borderRadius="md">
                                            <Text fontWeight="bold" mb={2}>{content.title}</Text>
                                            <HStack spacing={4} fontSize="sm" color="gray.600">
                                                <HStack>
                                                    <ViewIcon />
                                                    <Text>{content.views.toLocaleString()}</Text>
                                                </HStack>
                                                <HStack>
                                                    <StarIcon />
                                                    <Text>{content.likes.toLocaleString()}</Text>
                                                </HStack>
                                                <HStack>
                                                    <InfoIcon />
                                                    <Text>{content.comments}</Text>
                                                </HStack>
                                            </HStack>
                                        </Box>
                                    ))}
                                </VStack>
                            </CardBody>
                        </Card>
                    </TabPanel>

                    {/* 성능 분석 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">성능 개요</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <HStack justify="space-between">
                                            <Text>가동률</Text>
                                            <Text fontWeight="bold" color="green.500">99.9%</Text>
                                        </HStack>
                                        <HStack justify="space-between">
                                            <Text>응답 시간</Text>
                                            <Text fontWeight="bold">180ms</Text>
                                        </HStack>
                                        <HStack justify="space-between">
                                            <Text>오류율</Text>
                                            <Text fontWeight="bold" color="green.500">0.1%</Text>
                                        </HStack>
                                        <HStack justify="space-between">
                                            <Text>처리량</Text>
                                            <Text fontWeight="bold">1,250 req/s</Text>
                                        </HStack>
                                    </VStack>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">성능 분해</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <Box>
                                            <Text fontWeight="medium" mb={2}>API</Text>
                                            <HStack justify="space-between">
                                                <Text fontSize="sm">응답 시간</Text>
                                                <Text fontSize="sm" fontWeight="bold">120ms</Text>
                                            </HStack>
                                            <HStack justify="space-between">
                                                <Text fontSize="sm">오류율</Text>
                                                <Text fontSize="sm" fontWeight="bold" color="green.500">0.05%</Text>
                                            </HStack>
                                        </Box>
                                        <Box>
                                            <Text fontWeight="medium" mb={2}>데이터베이스</Text>
                                            <HStack justify="space-between">
                                                <Text fontSize="sm">응답 시간</Text>
                                                <Text fontSize="sm" fontWeight="bold">45ms</Text>
                                            </HStack>
                                            <HStack justify="space-between">
                                                <Text fontSize="sm">오류율</Text>
                                                <Text fontSize="sm" fontWeight="bold" color="green.500">0.02%</Text>
                                            </HStack>
                                        </Box>
                                        <Box>
                                            <Text fontWeight="medium" mb={2}>캐시</Text>
                                            <HStack justify="space-between">
                                                <Text fontSize="sm">적중률</Text>
                                                <Text fontSize="sm" fontWeight="bold" color="blue.500">85%</Text>
                                            </HStack>
                                            <HStack justify="space-between">
                                                <Text fontSize="sm">응답 시간</Text>
                                                <Text fontSize="sm" fontWeight="bold">15ms</Text>
                                            </HStack>
                                        </Box>
                                    </VStack>
                                </CardBody>
                            </Card>
                        </SimpleGrid>
                    </TabPanel>

                    {/* 인사이트 탭 */}
                    <TabPanel p={0}>
                        <VStack spacing={6} align="stretch">
                            {/* 인사이트 카드들 */}
                            {dashboardData?.insights.map(insight => (
                                <Card key={insight.id} bg={bgColor} borderColor={borderColor}>
                                    <CardBody>
                                        <HStack justify="space-between" mb={3}>
                                            <HStack spacing={2}>
                                                <Badge colorScheme={getInsightColor(insight.type)} size="sm">
                                                    {insight.type.toUpperCase()}
                                                </Badge>
                                                <Text fontWeight="bold">{insight.title}</Text>
                                            </HStack>
                                            <Badge colorScheme="blue" size="sm">
                                                {insight.confidence}% 신뢰도
                                            </Badge>
                                        </HStack>

                                        <Text mb={3} color="gray.700">
                                            {insight.description}
                                        </Text>

                                        <Box p={3} bg="blue.50" borderRadius="md">
                                            <Text fontWeight="medium" mb={1}>권장사항</Text>
                                            <Text fontSize="sm" color="gray.700">
                                                {insight.recommendation}
                                            </Text>
                                        </Box>
                                    </CardBody>
                                </Card>
                            ))}

                            {/* 알림 섹션 */}
                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">알림</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={3} align="stretch">
                                        {dashboardData?.alerts.map(alert => (
                                            <HStack key={alert.id} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                                                <HStack spacing={3}>
                                                    <Badge colorScheme={getAlertColor(alert.type)} size="sm">
                                                        {alert.type.toUpperCase()}
                                                    </Badge>
                                                    <VStack align="start" spacing={0}>
                                                        <Text fontWeight="medium">{alert.title}</Text>
                                                        <Text fontSize="sm" color="gray.600">{alert.description}</Text>
                                                    </VStack>
                                                </HStack>
                                                <Text fontSize="sm" color="gray.500">
                                                    {new Date(alert.timestamp).toLocaleString('ko-KR')}
                                                </Text>
                                            </HStack>
                                        ))}
                                    </VStack>
                                </CardBody>
                            </Card>
                        </VStack>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            {/* 내보내기 모달 */}
            <Modal isOpen={isExportModalOpen} onClose={onExportModalClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>데이터 내보내기</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <Box>
                                <Text fontWeight="medium" mb={2}>내보낼 데이터 유형</Text>
                                <Select value={exportType} onChange={(e) => setExportType(e.target.value)}>
                                    <option value="dashboard">대시보드 데이터</option>
                                    <option value="kpis">KPI 데이터</option>
                                    <option value="users">사용자 분석</option>
                                    <option value="revenue">수익 분석</option>
                                </Select>
                            </Box>

                            <Box>
                                <Text fontWeight="medium" mb={2}>파일 형식</Text>
                                <Select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                                    <option value="json">JSON</option>
                                    <option value="csv">CSV</option>
                                </Select>
                            </Box>

                            <HStack spacing={2}>
                                <Button colorScheme="blue" flex="1" onClick={exportData}>
                                    내보내기
                                </Button>
                                <Button variant="outline" flex="1" onClick={onExportModalClose}>
                                    취소
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 설정 모달 */}
            <Modal isOpen={isSettingsModalOpen} onClose={onSettingsModalClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>대시보드 설정</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text>설정 기능은 개발 중입니다.</Text>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default BusinessIntelligenceDashboard;

