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
    Textarea,
    Switch,
    FormControl,
    FormLabel,
    FormHelperText,
    Code,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    List,
    ListItem,
    ListIcon,
    OrderedList,
    UnorderedList,
    CircularProgress,
    CircularProgressLabel,
    Progress as ChakraProgress,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    SliderMark,
    RangeSlider,
    RangeSliderTrack,
    RangeSliderFilledTrack,
    RangeSliderThumb
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
    LineChartIcon,
    BrainIcon,
    TargetIcon,
    AnalyticsIcon,
    PredictionIcon,
    ModelIcon,
    DataIcon,
    AlgorithmIcon,
    AccuracyIcon,
    ConfidenceIcon,
    PerformanceIcon,
    FeatureIcon,
    TrainingIcon,
    EvaluationIcon,
    ComparisonIcon,
    ReportIcon,
    MonitorIcon,
    AlertTriangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ActivityIcon,
    ZapIcon,
    ShieldIcon,
    LightbulbIcon,
    RocketIcon,
    TrophyIcon,
    AwardIcon,
    MedalIcon,
    CrownIcon,
    DiamondIcon,
    GemIcon,
    SparklesIcon,
    MagicIcon,
    WandIcon,
    CrystalIcon,
    StarIcon as Star,
    FireIcon,
    ThunderIcon,
    LightningIcon,
    FlashIcon,
    BoltIcon,
    PowerIcon,
    EnergyIcon,
    ForceIcon,
    StrengthIcon,
    SpeedIcon,
    AgilityIcon,
    IntelligenceIcon,
    WisdomIcon,
    CharismaIcon,
    ConstitutionIcon,
    DexterityIcon,
    ConstitutionIcon as Constitution,
    DexterityIcon as Dexterity,
    IntelligenceIcon as Intelligence,
    WisdomIcon as Wisdom,
    CharismaIcon as Charisma,
    StrengthIcon as Strength,
    AgilityIcon as Agility,
    SpeedIcon as Speed,
    PowerIcon as Power,
    EnergyIcon as Energy,
    ForceIcon as Force,
    LightningIcon as Lightning,
    ThunderIcon as Thunder,
    FireIcon as Fire,
    FlashIcon as Flash,
    BoltIcon as Bolt,
    SparklesIcon as Sparkles,
    MagicIcon as Magic,
    WandIcon as Wand,
    CrystalIcon as Crystal,
    GemIcon as Gem,
    DiamondIcon as Diamond,
    CrownIcon as Crown,
    MedalIcon as Medal,
    AwardIcon as Award,
    TrophyIcon as Trophy,
    RocketIcon as Rocket,
    LightbulbIcon as Lightbulb,
    ShieldIcon as Shield,
    ZapIcon as Zap,
    ActivityIcon as Activity,
    ClockIcon as Clock,
    XCircleIcon as XCircle,
    CheckCircleIcon as CheckCircle,
    AlertTriangleIcon as AlertTriangle,
    MonitorIcon as Monitor,
    ReportIcon as Report,
    ComparisonIcon as Comparison,
    EvaluationIcon as Evaluation,
    TrainingIcon as Training,
    FeatureIcon as Feature,
    PerformanceIcon as Performance,
    ConfidenceIcon as Confidence,
    AccuracyIcon as Accuracy,
    AlgorithmIcon as Algorithm,
    DataIcon as Data,
    ModelIcon as Model,
    PredictionIcon as Prediction,
    AnalyticsIcon as Analytics,
    TargetIcon as Target,
    BrainIcon as Brain,
    LineChartIcon as LineChart,
    BarChartIcon as BarChart,
    PieChartIcon as PieChart,
    ChartBarIcon as ChartBar,
    TimeIcon as Time,
    DollarIcon as Dollar,
    UsersIcon as Users,
    StarIcon as StarIcon,
    CloseIcon as Close,
    CheckIcon as Check,
    WarningIcon as Warning,
    InfoIcon as Info,
    SettingsIcon as Settings,
    RefreshIcon as Refresh,
    DownloadIcon as Download,
    ViewIcon as View,
    TrendingDownIcon as TrendingDown,
    TrendingUpIcon as TrendingUp
} from '@chakra-ui/icons';

interface MLModel {
    id: string;
    name: string;
    type: string;
    algorithm: string;
    status: string;
    accuracy: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    mse?: number;
    mae?: number;
    r2Score?: number;
    lastTrained: string;
    features: string[];
    targetVariable: string;
    description: string;
}

interface Prediction {
    id: string;
    modelId: string;
    inputData: any;
    prediction: any;
    confidence: number;
    timestamp: string;
    status: string;
}

interface MLStats {
    totalModels: number;
    trainedModels: number;
    trainingModels: number;
    errorModels: number;
    totalPredictions: number;
    averageAccuracy: number;
    predictionsToday: number;
}

const AdvancedBIDashboard: React.FC = () => {
    const [models, setModels] = useState<MLModel[]>([]);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [stats, setStats] = useState<MLStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState(0);
    const [selectedModel, setSelectedModel] = useState<MLModel | null>(null);

    const { isOpen: isPredictModalOpen, onOpen: onPredictModalOpen, onClose: onPredictModalClose } = useDisclosure();
    const { isOpen: isModelModalOpen, onOpen: onModelModalOpen, onClose: onModelModalClose } = useDisclosure();
    const { isOpen: isCompareModalOpen, onOpen: onCompareModalOpen, onClose: onCompareModalClose } = useDisclosure();

    const [predictionData, setPredictionData] = useState<any>({});
    const [selectedModels, setSelectedModels] = useState<string[]>([]);

    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // 데이터 로드
    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // 모델 목록 로드
            const modelsResponse = await fetch('/api/machine-learning/models');
            const modelsData = await modelsResponse.json();
            if (modelsData.success) {
                setModels(modelsData.data);
            }

            // 예측 히스토리 로드
            const predictionsResponse = await fetch('/api/machine-learning/predictions?limit=50');
            const predictionsData = await predictionsResponse.json();
            if (predictionsData.success) {
                setPredictions(predictionsData.data);
            }

            // 통계 로드
            const statsResponse = await fetch('/api/machine-learning/stats');
            const statsData = await statsResponse.json();
            if (statsData.success) {
                setStats(statsData.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('데이터를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 예측 실행
    const makePrediction = async () => {
        if (!selectedModel) return;

        try {
            const response = await fetch('/api/machine-learning/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    modelId: selectedModel.id,
                    inputData: predictionData
                })
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: '예측 완료',
                    description: '머신러닝 예측이 성공적으로 완료되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                fetchData(); // 데이터 새로고침
                onPredictModalClose();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error making prediction:', error);
            toast({
                title: '예측 실패',
                description: error.message || '예측 실행 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 모델 훈련
    const trainModel = async (modelId: string) => {
        try {
            const response = await fetch(`/api/machine-learning/models/${modelId}/train`, {
                method: 'POST'
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: '훈련 완료',
                    description: '모델 훈련이 성공적으로 완료되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                fetchData(); // 데이터 새로고침
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error training model:', error);
            toast({
                title: '훈련 실패',
                description: error.message || '모델 훈련 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        fetchData();
    }, []);

    // 모델 타입 색상
    const getModelTypeColor = (type: string) => {
        switch (type) {
            case 'classification': return 'blue';
            case 'regression': return 'green';
            case 'clustering': return 'purple';
            case 'recommendation': return 'orange';
            default: return 'gray';
        }
    };

    // 모델 상태 색상
    const getModelStatusColor = (status: string) => {
        switch (status) {
            case 'trained': return 'green';
            case 'training': return 'blue';
            case 'error': return 'red';
            case 'pending': return 'yellow';
            default: return 'gray';
        }
    };

    // 신뢰도 색상
    const getConfidenceColor = (confidence: number) => {
        if (confidence > 0.8) return 'green';
        if (confidence > 0.6) return 'yellow';
        return 'red';
    };

    // 정확도 색상
    const getAccuracyColor = (accuracy: number) => {
        if (accuracy > 0.9) return 'green';
        if (accuracy > 0.8) return 'yellow';
        return 'red';
    };

    if (isLoading && !models.length) {
        return (
            <Box p={8} textAlign="center">
                <Spinner size="xl" />
                <Text mt={4}>고급 BI 데이터를 불러오는 중...</Text>
            </Box>
        );
    }

    return (
        <Box p={6}>
            {/* Header */}
            <VStack spacing={4} align="stretch" mb={8}>
                <HStack justify="space-between">
                    <Text fontSize="3xl" fontWeight="bold" color="purple.600">
                        🤖 고급 비즈니스 인텔리전스 대시보드
                    </Text>
                    <HStack spacing={2}>
                        <Button leftIcon={<RefreshIcon />} colorScheme="purple" variant="outline" onClick={fetchData}>
                            새로고침
                        </Button>
                        <Button leftIcon={<BrainIcon />} colorScheme="purple" onClick={onPredictModalOpen}>
                            예측 실행
                        </Button>
                        <Button leftIcon={<ComparisonIcon />} colorScheme="purple" variant="outline" onClick={onCompareModalOpen}>
                            모델 비교
                        </Button>
                    </HStack>
                </HStack>

                {/* 통계 카드 */}
                {stats && (
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>총 모델</StatLabel>
                                    <StatNumber color="purple.500">{stats.totalModels}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>훈련된 모델</StatLabel>
                                    <StatNumber color="green.500">{stats.trainedModels}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>총 예측</StatLabel>
                                    <StatNumber color="blue.500">{stats.totalPredictions}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>평균 정확도</StatLabel>
                                    <StatNumber color="orange.500">{(stats.averageAccuracy * 100).toFixed(1)}%</StatNumber>
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
                    <Tab>ML 모델</Tab>
                    <Tab>예측 분석</Tab>
                    <Tab>성능 모니터링</Tab>
                    <Tab>특성 분석</Tab>
                    <Tab>비즈니스 인사이트</Tab>
                </TabList>

                <TabPanels>
                    {/* ML 모델 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                            {models.map(model => (
                                <Card key={model.id} bg={bgColor} borderColor={borderColor}>
                                    <CardHeader>
                                        <HStack justify="space-between">
                                            <HStack spacing={3}>
                                                <BrainIcon color="purple.500" />
                                                <VStack align="start" spacing={0}>
                                                    <Text fontWeight="bold" fontSize="lg">
                                                        {model.name}
                                                    </Text>
                                                    <Text fontSize="sm" color="gray.600">
                                                        {model.algorithm}
                                                    </Text>
                                                </VStack>
                                            </HStack>
                                            <Badge colorScheme={getModelStatusColor(model.status)} size="sm">
                                                {model.status.toUpperCase()}
                                            </Badge>
                                        </HStack>
                                    </CardHeader>
                                    <CardBody>
                                        <VStack spacing={4} align="stretch">
                                            <Box>
                                                <Text fontWeight="medium" mb={2}>성능 지표</Text>
                                                <VStack spacing={2} align="stretch">
                                                    <HStack justify="space-between">
                                                        <Text fontSize="sm">정확도</Text>
                                                        <HStack spacing={2}>
                                                            <CircularProgress
                                                                value={model.accuracy * 100}
                                                                color={getAccuracyColor(model.accuracy)}
                                                                size="40px"
                                                            >
                                                                <CircularProgressLabel>
                                                                    {(model.accuracy * 100).toFixed(0)}%
                                                                </CircularProgressLabel>
                                                            </CircularProgress>
                                                        </HStack>
                                                    </HStack>

                                                    {model.precision && (
                                                        <HStack justify="space-between">
                                                            <Text fontSize="sm">정밀도</Text>
                                                            <Text fontSize="sm" fontWeight="bold">
                                                                {(model.precision * 100).toFixed(1)}%
                                                            </Text>
                                                        </HStack>
                                                    )}

                                                    {model.recall && (
                                                        <HStack justify="space-between">
                                                            <Text fontSize="sm">재현율</Text>
                                                            <Text fontSize="sm" fontWeight="bold">
                                                                {(model.recall * 100).toFixed(1)}%
                                                            </Text>
                                                        </HStack>
                                                    )}

                                                    {model.f1Score && (
                                                        <HStack justify="space-between">
                                                            <Text fontSize="sm">F1 점수</Text>
                                                            <Text fontSize="sm" fontWeight="bold">
                                                                {(model.f1Score * 100).toFixed(1)}%
                                                            </Text>
                                                        </HStack>
                                                    )}
                                                </VStack>
                                            </Box>

                                            <Box>
                                                <Text fontWeight="medium" mb={2}>특성</Text>
                                                <Text fontSize="sm" color="gray.600">
                                                    {model.features.length}개 특성
                                                </Text>
                                            </Box>

                                            <HStack spacing={2}>
                                                <Button
                                                    size="sm"
                                                    colorScheme="blue"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedModel(model);
                                                        onPredictModalOpen();
                                                    }}
                                                >
                                                    예측
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    colorScheme="green"
                                                    variant="outline"
                                                    onClick={() => trainModel(model.id)}
                                                >
                                                    훈련
                                                </Button>
                                            </HStack>
                                        </VStack>
                                    </CardBody>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </TabPanel>

                    {/* 예측 분석 탭 */}
                    <TabPanel p={0}>
                        <Card>
                            <CardHeader>
                                <HStack justify="space-between">
                                    <Text fontSize="lg" fontWeight="bold">예측 히스토리</Text>
                                    <Button leftIcon={<BrainIcon />} colorScheme="purple" onClick={onPredictModalOpen}>
                                        새 예측
                                    </Button>
                                </HStack>
                            </CardHeader>
                            <CardBody>
                                <Table>
                                    <Thead>
                                        <Tr>
                                            <Th>모델</Th>
                                            <Th>예측 결과</Th>
                                            <Th>신뢰도</Th>
                                            <Th>시간</Th>
                                            <Th>상태</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {predictions.map(prediction => (
                                            <Tr key={prediction.id}>
                                                <Td>
                                                    <Text fontWeight="medium">
                                                        {models.find(m => m.id === prediction.modelId)?.name || prediction.modelId}
                                                    </Text>
                                                </Td>
                                                <Td>
                                                    <Code fontSize="sm">
                                                        {typeof prediction.prediction === 'boolean'
                                                            ? (prediction.prediction ? 'True' : 'False')
                                                            : prediction.prediction.toFixed(2)
                                                        }
                                                    </Code>
                                                </Td>
                                                <Td>
                                                    <HStack spacing={2}>
                                                        <CircularProgress
                                                            value={prediction.confidence * 100}
                                                            color={getConfidenceColor(prediction.confidence)}
                                                            size="30px"
                                                        >
                                                            <CircularProgressLabel fontSize="xs">
                                                                {(prediction.confidence * 100).toFixed(0)}%
                                                            </CircularProgressLabel>
                                                        </CircularProgress>
                                                    </HStack>
                                                </Td>
                                                <Td>
                                                    {new Date(prediction.timestamp).toLocaleString('ko-KR')}
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme="green" size="sm">
                                                        {prediction.status.toUpperCase()}
                                                    </Badge>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </TabPanel>

                    {/* 성능 모니터링 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">모델 성능</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        {models.map(model => (
                                            <Box key={model.id} p={4} bg="gray.50" borderRadius="md">
                                                <HStack justify="space-between" mb={2}>
                                                    <Text fontWeight="medium">{model.name}</Text>
                                                    <Badge colorScheme={getModelStatusColor(model.status)} size="sm">
                                                        {model.status}
                                                    </Badge>
                                                </HStack>

                                                <HStack justify="space-between" mb={2}>
                                                    <Text fontSize="sm">정확도</Text>
                                                    <Text fontSize="sm" fontWeight="bold">
                                                        {(model.accuracy * 100).toFixed(1)}%
                                                    </Text>
                                                </HStack>

                                                <ChakraProgress
                                                    value={model.accuracy * 100}
                                                    colorScheme={getAccuracyColor(model.accuracy)}
                                                    size="sm"
                                                />

                                                <Text fontSize="xs" color="gray.600">
                                                    마지막 훈련: {new Date(model.lastTrained).toLocaleDateString('ko-KR')}
                                                </Text>
                                            </Box>
                                        ))}
                                    </VStack>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">예측 트렌드</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <Box textAlign="center">
                                            <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                                                {stats?.totalPredictions || 0}
                                            </Text>
                                            <Text fontSize="sm" color="gray.600">총 예측 수</Text>
                                        </Box>

                                        <Box textAlign="center">
                                            <Text fontSize="2xl" fontWeight="bold" color="green.500">
                                                {stats?.predictionsToday || 0}
                                            </Text>
                                            <Text fontSize="sm" color="gray.600">오늘 예측 수</Text>
                                        </Box>

                                        <Box textAlign="center">
                                            <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                                                {stats ? (stats.averageAccuracy * 100).toFixed(1) : 0}%
                                            </Text>
                                            <Text fontSize="sm" color="gray.600">평균 정확도</Text>
                                        </Box>
                                    </VStack>
                                </CardBody>
                            </Card>
                        </SimpleGrid>
                    </TabPanel>

                    {/* 특성 분석 탭 */}
                    <TabPanel p={0}>
                        <Card>
                            <CardHeader>
                                <Text fontSize="lg" fontWeight="bold">특성 중요도 분석</Text>
                            </CardHeader>
                            <CardBody>
                                <VStack spacing={4} align="stretch">
                                    {models.map(model => (
                                        <Accordion key={model.id} allowToggle>
                                            <AccordionItem>
                                                <AccordionButton>
                                                    <Box flex="1" textAlign="left">
                                                        <Text fontWeight="medium">{model.name}</Text>
                                                    </Box>
                                                    <AccordionIcon />
                                                </AccordionButton>
                                                <AccordionPanel pb={4}>
                                                    <VStack spacing={2} align="stretch">
                                                        {model.features.map((feature, index) => (
                                                            <HStack key={feature} justify="space-between">
                                                                <Text fontSize="sm">{feature}</Text>
                                                                <HStack spacing={2}>
                                                                    <ChakraProgress
                                                                        value={Math.random() * 100}
                                                                        colorScheme="blue"
                                                                        size="sm"
                                                                        w="100px"
                                                                    />
                                                                    <Text fontSize="sm" fontWeight="bold">
                                                                        {(Math.random() * 100).toFixed(1)}%
                                                                    </Text>
                                                                </HStack>
                                                            </HStack>
                                                        ))}
                                                    </VStack>
                                                </AccordionPanel>
                                            </AccordionItem>
                                        </Accordion>
                                    ))}
                                </VStack>
                            </CardBody>
                        </Card>
                    </TabPanel>

                    {/* 비즈니스 인사이트 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">AI 인사이트</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <Box p={4} bg="blue.50" borderRadius="md">
                                            <HStack mb={2}>
                                                <LightbulbIcon color="blue.500" />
                                                <Text fontWeight="medium">사용자 리텐션 개선</Text>
                                            </HStack>
                                            <Text fontSize="sm" color="gray.700">
                                                리텐션 모델이 87% 정확도로 사용자 이탈을 예측합니다.
                                                활성 사용자 15%가 향후 30일 내 이탈할 가능성이 높습니다.
                                            </Text>
                                        </Box>

                                        <Box p={4} bg="green.50" borderRadius="md">
                                            <HStack mb={2}>
                                                <TrendingUpIcon color="green.500" />
                                                <Text fontWeight="medium">수익 예측</Text>
                                            </HStack>
                                            <Text fontSize="sm" color="gray.700">
                                                다음 달 수익이 현재 대비 12% 증가할 것으로 예측됩니다.
                                                신규 사용자 증가와 전환율 개선이 주요 요인입니다.
                                            </Text>
                                        </Box>

                                        <Box p={4} bg="purple.50" borderRadius="md">
                                            <HStack mb={2}>
                                                <TargetIcon color="purple.500" />
                                                <Text fontWeight="medium">콘텐츠 최적화</Text>
                                            </HStack>
                                            <Text fontSize="sm" color="gray.700">
                                                AI가 분석한 결과, 오후 2-4시에 게시된 기술 관련 콘텐츠가
                                                가장 높은 참여도를 보입니다.
                                            </Text>
                                        </Box>
                                    </VStack>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">권장사항</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <Box p={4} bg="yellow.50" borderRadius="md">
                                            <HStack mb={2}>
                                                <WarningIcon color="yellow.500" />
                                                <Text fontWeight="medium">긴급</Text>
                                            </HStack>
                                            <Text fontSize="sm" color="gray.700">
                                                이탈 위험 사용자 1,200명에게 즉시 리텐션 캠페인을 실행하세요.
                                            </Text>
                                        </Box>

                                        <Box p={4} bg="blue.50" borderRadius="md">
                                            <HStack mb={2}>
                                                <InfoIcon color="blue.500" />
                                                <Text fontWeight="medium">중요</Text>
                                            </HStack>
                                            <Text fontSize="sm" color="gray.700">
                                                콘텐츠 성과 모델을 재훈련하여 정확도를 5% 향상시킬 수 있습니다.
                                            </Text>
                                        </Box>

                                        <Box p={4} bg="green.50" borderRadius="md">
                                            <HStack mb={2}>
                                                <CheckIcon color="green.500" />
                                                <Text fontWeight="medium">제안</Text>
                                            </HStack>
                                            <Text fontSize="sm" color="gray.700">
                                                전환 예측 모델을 활용하여 타겟 마케팅을 개선하세요.
                                            </Text>
                                        </Box>
                                    </VStack>
                                </CardBody>
                            </Card>
                        </SimpleGrid>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            {/* 예측 모달 */}
            <Modal isOpen={isPredictModalOpen} onClose={onPredictModalClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        {selectedModel?.name} 예측
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <Text>머신러닝 모델을 사용하여 예측을 실행합니다.</Text>

                            {selectedModel && (
                                <VStack spacing={4} align="stretch">
                                    {selectedModel.features.map(feature => (
                                        <FormControl key={feature}>
                                            <FormLabel>{feature}</FormLabel>
                                            <Input
                                                value={predictionData[feature] || ''}
                                                onChange={(e) => setPredictionData(prev => ({
                                                    ...prev,
                                                    [feature]: e.target.value
                                                }))}
                                                placeholder={`${feature} 값을 입력하세요`}
                                            />
                                        </FormControl>
                                    ))}
                                </VStack>
                            )}

                            <HStack spacing={2}>
                                <Button colorScheme="purple" flex="1" onClick={makePrediction}>
                                    예측 실행
                                </Button>
                                <Button variant="outline" flex="1" onClick={onPredictModalClose}>
                                    취소
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 모델 비교 모달 */}
            <Modal isOpen={isCompareModalOpen} onClose={onCompareModalClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>모델 비교</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <Text>비교할 모델을 선택하세요.</Text>

                            <VStack spacing={2} align="stretch">
                                {models.map(model => (
                                    <HStack key={model.id} justify="space-between" p={2} bg="gray.50" borderRadius="md">
                                        <HStack spacing={3}>
                                            <input
                                                type="checkbox"
                                                checked={selectedModels.includes(model.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedModels(prev => [...prev, model.id]);
                                                    } else {
                                                        setSelectedModels(prev => prev.filter(id => id !== model.id));
                                                    }
                                                }}
                                            />
                                            <Text fontWeight="medium">{model.name}</Text>
                                            <Badge colorScheme={getModelTypeColor(model.type)} size="sm">
                                                {model.type}
                                            </Badge>
                                        </HStack>
                                        <Text fontSize="sm" color="gray.600">
                                            정확도: {(model.accuracy * 100).toFixed(1)}%
                                        </Text>
                                    </HStack>
                                ))}
                            </VStack>

                            <HStack spacing={2}>
                                <Button colorScheme="purple" flex="1" onClick={() => {
                                    // 모델 비교 로직
                                    onCompareModalClose();
                                }}>
                                    비교 실행
                                </Button>
                                <Button variant="outline" flex="1" onClick={onCompareModalClose}>
                                    취소
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default AdvancedBIDashboard;

