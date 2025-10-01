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
    RangeSliderThumb,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper
} from '@chakra-ui/react';
import {
    ExperimentIcon,
    ChartBarIcon,
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
    ActivityIcon,
    TargetIcon,
    AnalyticsIcon,
    DataIcon,
    BarChartIcon,
    PieChartIcon,
    LineChartIcon,
    PlayIcon,
    PauseIcon,
    StopIcon,
    EditIcon,
    DeleteIcon,
    AddIcon,
    SearchIcon,
    FilterIcon,
    SortIcon,
    CalendarIcon,
    ClockIcon,
    EyeIcon,
    EyeOffIcon,
    CopyIcon,
    ShareIcon,
    LinkIcon,
    DownloadIcon as Download,
    UploadIcon,
    SaveIcon,
    LoadIcon,
    OpenIcon,
    CloseIcon as Close,
    MinimizeIcon,
    MaximizeIcon,
    FullscreenIcon,
    ExitFullscreenIcon,
    ZoomInIcon,
    ZoomOutIcon,
    ResetIcon,
    ClearIcon,
    TrashIcon,
    ArchiveIcon,
    UnarchiveIcon,
    PinIcon,
    UnpinIcon,
    FlagIcon,
    UnflagIcon,
    ReportIcon,
    UnreportIcon,
    BlockIcon,
    UnblockIcon,
    MuteIcon,
    UnmuteIcon,
    FollowIcon,
    UnfollowIcon,
    SubscribeIcon,
    UnsubscribeIcon,
    JoinIcon,
    LeaveIcon,
    EnterIcon,
    ExitIcon,
    LoginIcon,
    LogoutIcon,
    SignInIcon,
    SignOutIcon,
    RegisterIcon,
    UnregisterIcon,
    EnrollIcon,
    UnenrollIcon,
    EnlistIcon,
    UnenlistIcon,
    RecruitIcon,
    UnrecruitIcon,
    HireIcon,
    FireIcon,
    EmployIcon,
    UnemployIcon,
    ContractIcon,
    UncontractIcon,
    AgreeIcon,
    DisagreeIcon,
    AcceptIcon,
    RejectIcon,
    ApproveIcon,
    DisapproveIcon,
    ConfirmIcon,
    DenyIcon,
    GrantIcon,
    RevokeIcon,
    AllowIcon,
    DisallowIcon,
    PermitIcon,
    ForbidIcon,
    AuthorizeIcon,
    UnauthorizeIcon,
    AuthenticateIcon,
    UnauthenticateIcon,
    VerifyIcon,
    UnverifyIcon,
    ValidateIcon,
    InvalidateIcon,
    CertifyIcon,
    DecertifyIcon,
    LicenseIcon,
    UnlicenseIcon,
    PatentIcon,
    UnpatentIcon,
    CopyrightIcon,
    UncopyrightIcon,
    TrademarkIcon,
    UntrademarkIcon,
    BrandIcon,
    UnbrandIcon,
    LabelIcon,
    UnlabelIcon,
    TagIcon,
    UntagIcon,
    MarkIcon,
    UnmarkIcon,
    NoteIcon,
    UnnoteIcon,
    CommentIcon,
    UncommentIcon,
    ReviewIcon,
    UnreviewIcon,
    RateIcon,
    UnrateIcon,
    ScoreIcon,
    UnscoreIcon,
    GradeIcon,
    UngradeIcon,
    RankIcon,
    UnrankIcon,
    OrderIcon,
    UnorderIcon,
    SortIcon as Sort,
    UnsortIcon,
    FilterIcon as Filter,
    UnfilterIcon,
    SearchIcon as Search,
    UnsearchIcon,
    FindIcon,
    UnfindIcon,
    LocateIcon,
    UnlocateIcon,
    TrackIcon,
    UntrackIcon,
    TraceIcon,
    UntraceIcon,
    FollowIcon as Follow,
    UnfollowIcon as Unfollow,
    MonitorIcon,
    UnmonitorIcon,
    WatchIcon,
    UnwatchIcon,
    ObserveIcon,
    UnobserveIcon,
    SurveyIcon,
    UnsurveyIcon,
    InspectIcon,
    UninspectIcon,
    ExamineIcon,
    UnexamineIcon,
    AnalyzeIcon,
    UnanalyzeIcon,
    StudyIcon,
    UnstudyIcon,
    ResearchIcon,
    UnresearchIcon,
    InvestigateIcon,
    UninvestigateIcon,
    ExploreIcon,
    UnexploreIcon,
    DiscoverIcon,
    UndiscoverIcon,
    FindIcon as Find,
    UnfindIcon as Unfind,
    DetectIcon,
    UndetectIcon,
    IdentifyIcon,
    UnidentifyIcon,
    RecognizeIcon,
    UnrecognizeIcon,
    DistinguishIcon,
    UndistinguishIcon,
    DifferentiateIcon,
    UndifferentiateIcon,
    SeparateIcon,
    UnseparateIcon,
    DivideIcon,
    UndivideIcon,
    SplitIcon,
    UnsplitIcon,
    BreakIcon,
    UnbreakIcon,
    CrackIcon,
    UncrackIcon,
    FractureIcon,
    UnfractureIcon,
    ShatterIcon,
    UnshatterIcon,
    SmashIcon,
    UnsmashIcon,
    CrushIcon,
    UncrushIcon,
    SquashIcon,
    UnsquashIcon,
    SqueezeIcon,
    UnsqueezeIcon,
    CompressIcon,
    UncompressIcon,
    CompactIcon,
    UncompactIcon,
    CondenseIcon,
    UncondenseIcon,
    ConcentrateIcon,
    UnconcentrateIcon,
    FocusIcon,
    UnfocusIcon,
    CenterIcon,
    UncenterIcon,
    AlignIcon,
    UnalignIcon,
    JustifyIcon,
    UnjustifyIcon,
    BalanceIcon,
    UnbalanceIcon,
    EqualizeIcon,
    UnequalizeIcon,
    NormalizeIcon,
    UnnormalizeIcon,
    StandardizeIcon,
    UnstandardizeIcon,
    RegularizeIcon,
    UnregularizeIcon,
    StabilizeIcon,
    UnstabilizeIcon,
    SecureIcon,
    UnsecureIcon,
    ProtectIcon,
    UnprotectIcon,
    GuardIcon,
    UnguardIcon,
    DefendIcon,
    UndefendIcon,
    ShieldIcon,
    UnshieldIcon,
    ArmorIcon,
    UnarmorIcon,
    FortifyIcon,
    UnfortifyIcon,
    StrengthenIcon,
    UnstrengthenIcon,
    ReinforceIcon,
    UnreinforceIcon,
    SupportIcon,
    UnsupportIcon,
    SustainIcon,
    UnsustainIcon,
    MaintainIcon,
    UnmaintainIcon,
    PreserveIcon,
    UnpreserveIcon,
    ConserveIcon,
    UnconserveIcon,
    SaveIcon as Save,
    UnsaveIcon,
    StoreIcon,
    UnstoreIcon,
    KeepIcon,
    UnkeepIcon,
    HoldIcon,
    UnholdIcon,
    RetainIcon,
    UnretainIcon,
    ReserveIcon,
    UnreserveIcon,
    BookIcon,
    UnbookIcon,
    ReserveIcon as Reserve,
    UnreserveIcon as Unreserve,
    ScheduleIcon,
    UnscheduleIcon,
    PlanIcon,
    UnplanIcon,
    DesignIcon,
    UndesignIcon,
    CreateIcon,
    UncreateIcon,
    MakeIcon,
    UnmakeIcon,
    BuildIcon,
    UnbuildIcon,
    ConstructIcon,
    UnconstructIcon,
    AssembleIcon,
    UnassembleIcon,
    ComposeIcon,
    UncomposeIcon,
    FormIcon,
    UnformIcon,
    ShapeIcon,
    UnshapeIcon,
    MoldIcon,
    UnmoldIcon,
    CastIcon,
    UncastIcon,
    ForgeIcon,
    UnforgeIcon,
    CraftIcon,
    UncraftIcon,
    ManufactureIcon,
    UnmanufactureIcon,
    ProduceIcon,
    UnproduceIcon,
    GenerateIcon,
    UngenerateIcon,
    CreateIcon as Create,
    UncreateIcon as Uncreate,
    MakeIcon as Make,
    UnmakeIcon as Unmake,
    BuildIcon as Build,
    UnbuildIcon as Unbuild,
    ConstructIcon as Construct,
    UnconstructIcon as Unconstruct,
    AssembleIcon as Assemble,
    UnassembleIcon as Unassemble,
    ComposeIcon as Compose,
    UncomposeIcon as Uncompose,
    FormIcon as Form,
    UnformIcon as Unform,
    ShapeIcon as Shape,
    UnshapeIcon as Unshape,
    MoldIcon as Mold,
    UnmoldIcon as Unmold,
    CastIcon as Cast,
    UncastIcon as Uncast,
    ForgeIcon as Forge,
    UnforgeIcon as Unforge,
    CraftIcon as Craft,
    UncraftIcon as Uncraft,
    ManufactureIcon as Manufacture,
    UnmanufactureIcon as Unmanufacture,
    ProduceIcon as Produce,
    UnproduceIcon as Unproduce,
    GenerateIcon as Generate,
    UngenerateIcon as Ungenerate
} from '@chakra-ui/icons';

interface Experiment {
    id: string;
    name: string;
    description: string;
    hypothesis: string;
    primaryGoal: string;
    secondaryGoals: string[];
    segments: string[];
    trafficAllocation: number;
    minSampleSize: number;
    maxDuration: number;
    variants: string[];
    status: 'draft' | 'running' | 'stopped';
    startDate: string;
    endDate: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    stats: {
        totalUsers: number;
        conversions: number;
        conversionRate: number;
        confidence: number;
        significance: boolean;
    };
}

interface Variant {
    id: string;
    name: string;
    description: string;
    weight: number;
    configuration: any;
    isControl: boolean;
    createdAt: string;
}

interface ExperimentResult {
    experimentId: string;
    calculatedAt: string;
    results: {
        [variantId: string]: {
            variant: Variant;
            totalUsers: number;
            conversions: number;
            conversionRate: number;
            events: number;
            avgEventsPerUser: number;
            significance?: {
                isSignificant: boolean;
                confidence: number;
                pValue: number;
                zScore: number;
                improvement: number;
            };
        };
    };
    summary: {
        controlConversionRate: number;
        bestVariant: string;
        bestConversionRate: number;
        improvement: number;
        isSignificant: boolean;
        confidence: number;
    };
}

interface ExperimentStats {
    totalExperiments: number;
    runningExperiments: number;
    completedExperiments: number;
    draftExperiments: number;
    totalUsers: number;
    totalConversions: number;
}

const ABTestDashboard: React.FC = () => {
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
    const [experimentResults, setExperimentResults] = useState<ExperimentResult | null>(null);
    const [stats, setStats] = useState<ExperimentStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState(0);

    const { isOpen: isCreateModalOpen, onOpen: onCreateModalOpen, onClose: onCreateModalClose } = useDisclosure();
    const { isOpen: isResultsModalOpen, onOpen: onResultsModalOpen, onClose: onResultsModalClose } = useDisclosure();
    const { isOpen: isReportModalOpen, onOpen: onReportModalOpen, onClose: onReportModalClose } = useDisclosure();

    const [experimentData, setExperimentData] = useState<any>({
        name: '',
        description: '',
        hypothesis: '',
        primaryGoal: 'conversion_rate',
        secondaryGoals: [],
        segments: ['all_users'],
        trafficAllocation: 100,
        minSampleSize: 1000,
        maxDuration: 30,
        variants: []
    });

    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // 데이터 로드
    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // 실험 목록 로드
            const experimentsResponse = await fetch('/api/ab-testing/experiments');
            const experimentsData = await experimentsResponse.json();
            if (experimentsData.success) {
                setExperiments(experimentsData.data);
            }

            // 통계 로드
            const statsResponse = await fetch('/api/ab-testing/stats');
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

    // 실험 생성
    const createExperiment = async () => {
        try {
            const response = await fetch('/api/ab-testing/experiments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(experimentData)
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: '실험 생성 완료',
                    description: 'A/B 테스트 실험이 성공적으로 생성되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                fetchData(); // 데이터 새로고침
                onCreateModalClose();
                setExperimentData({
                    name: '',
                    description: '',
                    hypothesis: '',
                    primaryGoal: 'conversion_rate',
                    secondaryGoals: [],
                    segments: ['all_users'],
                    trafficAllocation: 100,
                    minSampleSize: 1000,
                    maxDuration: 30,
                    variants: []
                });
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error creating experiment:', error);
            toast({
                title: '실험 생성 실패',
                description: error.message || '실험 생성 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 실험 시작
    const startExperiment = async (experimentId: string) => {
        try {
            const response = await fetch(`/api/ab-testing/experiments/${experimentId}/start`, {
                method: 'POST'
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: '실험 시작',
                    description: 'A/B 테스트 실험이 시작되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                fetchData(); // 데이터 새로고침
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error starting experiment:', error);
            toast({
                title: '실험 시작 실패',
                description: error.message || '실험 시작 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 실험 중지
    const stopExperiment = async (experimentId: string) => {
        try {
            const response = await fetch(`/api/ab-testing/experiments/${experimentId}/stop`, {
                method: 'POST'
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: '실험 중지',
                    description: 'A/B 테스트 실험이 중지되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                fetchData(); // 데이터 새로고침
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error stopping experiment:', error);
            toast({
                title: '실험 중지 실패',
                description: error.message || '실험 중지 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 실험 결과 조회
    const fetchExperimentResults = async (experimentId: string) => {
        try {
            const response = await fetch(`/api/ab-testing/experiments/${experimentId}/results`);
            const data = await response.json();
            if (data.success) {
                setExperimentResults(data.data);
                onResultsModalOpen();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error fetching results:', error);
            toast({
                title: '결과 조회 실패',
                description: error.message || '실험 결과 조회 중 오류가 발생했습니다.',
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

    // 실험 상태 색상
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running': return 'green';
            case 'stopped': return 'blue';
            case 'draft': return 'yellow';
            default: return 'gray';
        }
    };

    // 실험 상태 텍스트
    const getStatusText = (status: string) => {
        switch (status) {
            case 'running': return '실행 중';
            case 'stopped': return '완료';
            case 'draft': return '초안';
            default: return '알 수 없음';
        }
    };

    // 통계적 유의성 색상
    const getSignificanceColor = (significance: boolean) => {
        return significance ? 'green' : 'red';
    };

    if (isLoading && !experiments.length) {
        return (
            <Box p={8} textAlign="center">
                <Spinner size="xl" />
                <Text mt={4}>A/B 테스트 데이터를 불러오는 중...</Text>
            </Box>
        );
    }

    return (
        <Box p={6}>
            {/* Header */}
            <VStack spacing={4} align="stretch" mb={8}>
                <HStack justify="space-between">
                    <Text fontSize="3xl" fontWeight="bold" color="purple.600">
                        🧪 A/B 테스트 프레임워크
                    </Text>
                    <HStack spacing={2}>
                        <Button leftIcon={<RefreshIcon />} colorScheme="purple" variant="outline" onClick={fetchData}>
                            새로고침
                        </Button>
                        <Button leftIcon={<AddIcon />} colorScheme="purple" onClick={onCreateModalOpen}>
                            실험 생성
                        </Button>
                        <Button leftIcon={<AnalyticsIcon />} colorScheme="purple" variant="outline">
                            분석 리포트
                        </Button>
                    </HStack>
                </HStack>

                {/* 통계 카드 */}
                {stats && (
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>총 실험</StatLabel>
                                    <StatNumber color="purple.500">{stats.totalExperiments}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>실행 중</StatLabel>
                                    <StatNumber color="green.500">{stats.runningExperiments}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>완료</StatLabel>
                                    <StatNumber color="blue.500">{stats.completedExperiments}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>총 사용자</StatLabel>
                                    <StatNumber color="orange.500">{stats.totalUsers}</StatNumber>
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
                    <Tab>실험 관리</Tab>
                    <Tab>실행 중인 실험</Tab>
                    <Tab>완료된 실험</Tab>
                    <Tab>분석 및 리포트</Tab>
                </TabList>

                <TabPanels>
                    {/* 실험 관리 탭 */}
                    <TabPanel p={0}>
                        <Card>
                            <CardHeader>
                                <HStack justify="space-between">
                                    <Text fontSize="lg" fontWeight="bold">실험 목록</Text>
                                    <Button leftIcon={<AddIcon />} colorScheme="purple" onClick={onCreateModalOpen}>
                                        실험 생성
                                    </Button>
                                </HStack>
                            </CardHeader>
                            <CardBody>
                                <Table>
                                    <Thead>
                                        <Tr>
                                            <Th>실험명</Th>
                                            <Th>상태</Th>
                                            <Th>목표</Th>
                                            <Th>사용자 수</Th>
                                            <Th>전환율</Th>
                                            <Th>생성일</Th>
                                            <Th>작업</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {experiments.map(experiment => (
                                            <Tr key={experiment.id}>
                                                <Td>
                                                    <VStack align="start" spacing={1}>
                                                        <Text fontWeight="medium">{experiment.name}</Text>
                                                        <Text fontSize="sm" color="gray.600" maxW="300px" isTruncated>
                                                            {experiment.description}
                                                        </Text>
                                                    </VStack>
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme={getStatusColor(experiment.status)} size="sm">
                                                        {getStatusText(experiment.status)}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <Text fontSize="sm">{experiment.primaryGoal}</Text>
                                                </Td>
                                                <Td>
                                                    <Text fontSize="sm" fontWeight="bold">
                                                        {experiment.stats.totalUsers.toLocaleString()}
                                                    </Text>
                                                </Td>
                                                <Td>
                                                    <HStack spacing={2}>
                                                        <Text fontSize="sm" fontWeight="bold">
                                                            {experiment.stats.conversionRate.toFixed(2)}%
                                                        </Text>
                                                        {experiment.stats.significance && (
                                                            <Badge
                                                                colorScheme={getSignificanceColor(experiment.stats.significance)}
                                                                size="sm"
                                                            >
                                                                {experiment.stats.confidence.toFixed(0)}%
                                                            </Badge>
                                                        )}
                                                    </HStack>
                                                </Td>
                                                <Td>
                                                    {new Date(experiment.createdAt).toLocaleDateString('ko-KR')}
                                                </Td>
                                                <Td>
                                                    <HStack spacing={2}>
                                                        {experiment.status === 'draft' && (
                                                            <Button
                                                                size="sm"
                                                                colorScheme="green"
                                                                leftIcon={<PlayIcon />}
                                                                onClick={() => startExperiment(experiment.id)}
                                                            >
                                                                시작
                                                            </Button>
                                                        )}
                                                        {experiment.status === 'running' && (
                                                            <Button
                                                                size="sm"
                                                                colorScheme="red"
                                                                leftIcon={<StopIcon />}
                                                                onClick={() => stopExperiment(experiment.id)}
                                                            >
                                                                중지
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            colorScheme="blue"
                                                            variant="outline"
                                                            leftIcon={<ChartBarIcon />}
                                                            onClick={() => fetchExperimentResults(experiment.id)}
                                                        >
                                                            결과
                                                        </Button>
                                                    </HStack>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </TabPanel>

                    {/* 실행 중인 실험 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            {experiments
                                .filter(exp => exp.status === 'running')
                                .map(experiment => (
                                    <Card key={experiment.id} bg={bgColor} borderColor={borderColor}>
                                        <CardHeader>
                                            <HStack justify="space-between">
                                                <Text fontWeight="bold" fontSize="lg">
                                                    {experiment.name}
                                                </Text>
                                                <Badge colorScheme="green" size="sm">
                                                    실행 중
                                                </Badge>
                                            </HStack>
                                        </CardHeader>
                                        <CardBody>
                                            <VStack spacing={4} align="stretch">
                                                <Text fontSize="sm" color="gray.600">
                                                    {experiment.description}
                                                </Text>

                                                <Box>
                                                    <Text fontWeight="medium" mb={2}>진행 상황</Text>
                                                    <VStack spacing={2} align="stretch">
                                                        <HStack justify="space-between">
                                                            <Text fontSize="sm">사용자 수</Text>
                                                            <Text fontSize="sm" fontWeight="bold">
                                                                {experiment.stats.totalUsers.toLocaleString()}
                                                            </Text>
                                                        </HStack>
                                                        <HStack justify="space-between">
                                                            <Text fontSize="sm">전환율</Text>
                                                            <Text fontSize="sm" fontWeight="bold">
                                                                {experiment.stats.conversionRate.toFixed(2)}%
                                                            </Text>
                                                        </HStack>
                                                        <HStack justify="space-between">
                                                            <Text fontSize="sm">목표 사용자</Text>
                                                            <Text fontSize="sm" fontWeight="bold">
                                                                {experiment.minSampleSize.toLocaleString()}
                                                            </Text>
                                                        </HStack>
                                                    </VStack>

                                                    <ChakraProgress
                                                        value={(experiment.stats.totalUsers / experiment.minSampleSize) * 100}
                                                        colorScheme="green"
                                                        size="sm"
                                                        mt={2}
                                                    />
                                                </Box>

                                                <HStack spacing={2}>
                                                    <Button
                                                        size="sm"
                                                        colorScheme="red"
                                                        leftIcon={<StopIcon />}
                                                        onClick={() => stopExperiment(experiment.id)}
                                                    >
                                                        중지
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        colorScheme="blue"
                                                        variant="outline"
                                                        leftIcon={<ChartBarIcon />}
                                                        onClick={() => fetchExperimentResults(experiment.id)}
                                                    >
                                                        결과 보기
                                                    </Button>
                                                </HStack>
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                ))}
                        </SimpleGrid>
                    </TabPanel>

                    {/* 완료된 실험 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            {experiments
                                .filter(exp => exp.status === 'stopped')
                                .map(experiment => (
                                    <Card key={experiment.id} bg={bgColor} borderColor={borderColor}>
                                        <CardHeader>
                                            <HStack justify="space-between">
                                                <Text fontWeight="bold" fontSize="lg">
                                                    {experiment.name}
                                                </Text>
                                                <Badge colorScheme="blue" size="sm">
                                                    완료
                                                </Badge>
                                            </HStack>
                                        </CardHeader>
                                        <CardBody>
                                            <VStack spacing={4} align="stretch">
                                                <Text fontSize="sm" color="gray.600">
                                                    {experiment.description}
                                                </Text>

                                                <Box>
                                                    <Text fontWeight="medium" mb={2}>최종 결과</Text>
                                                    <VStack spacing={2} align="stretch">
                                                        <HStack justify="space-between">
                                                            <Text fontSize="sm">총 사용자</Text>
                                                            <Text fontSize="sm" fontWeight="bold">
                                                                {experiment.stats.totalUsers.toLocaleString()}
                                                            </Text>
                                                        </HStack>
                                                        <HStack justify="space-between">
                                                            <Text fontSize="sm">전환율</Text>
                                                            <Text fontSize="sm" fontWeight="bold">
                                                                {experiment.stats.conversionRate.toFixed(2)}%
                                                            </Text>
                                                        </HStack>
                                                        <HStack justify="space-between">
                                                            <Text fontSize="sm">신뢰도</Text>
                                                            <Text fontSize="sm" fontWeight="bold">
                                                                {experiment.stats.confidence.toFixed(1)}%
                                                            </Text>
                                                        </HStack>
                                                        <HStack justify="space-between">
                                                            <Text fontSize="sm">통계적 유의성</Text>
                                                            <Badge
                                                                colorScheme={getSignificanceColor(experiment.stats.significance)}
                                                                size="sm"
                                                            >
                                                                {experiment.stats.significance ? '유의함' : '무의미'}
                                                            </Badge>
                                                        </HStack>
                                                    </VStack>
                                                </Box>

                                                <Button
                                                    size="sm"
                                                    colorScheme="blue"
                                                    leftIcon={<ChartBarIcon />}
                                                    onClick={() => fetchExperimentResults(experiment.id)}
                                                >
                                                    상세 결과 보기
                                                </Button>
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                ))}
                        </SimpleGrid>
                    </TabPanel>

                    {/* 분석 및 리포트 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">실험 성과 요약</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <Box textAlign="center">
                                            <Text fontSize="2xl" fontWeight="bold" color="green.500">
                                                {experiments.filter(e => e.status === 'stopped' && e.stats.significance).length}
                                            </Text>
                                            <Text fontSize="sm" color="gray.600">통계적으로 유의한 실험</Text>
                                        </Box>

                                        <Box textAlign="center">
                                            <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                                                {experiments.length > 0 ?
                                                    (experiments.reduce((sum, e) => sum + e.stats.conversionRate, 0) / experiments.length).toFixed(2) : 0
                                                }%
                                            </Text>
                                            <Text fontSize="sm" color="gray.600">평균 전환율</Text>
                                        </Box>

                                        <Box textAlign="center">
                                            <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                                                {stats?.totalUsers || 0}
                                            </Text>
                                            <Text fontSize="sm" color="gray.600">총 테스트 사용자</Text>
                                        </Box>
                                    </VStack>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">최근 실험</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={3} align="stretch">
                                        {experiments.slice(0, 5).map(experiment => (
                                            <HStack key={experiment.id} justify="space-between" p={2} bg="gray.50" borderRadius="md">
                                                <VStack align="start" spacing={0}>
                                                    <Text fontWeight="medium" fontSize="sm">
                                                        {experiment.name}
                                                    </Text>
                                                    <Text fontSize="xs" color="gray.600">
                                                        {experiment.stats.conversionRate.toFixed(2)}% 전환율
                                                    </Text>
                                                </VStack>
                                                <Badge colorScheme={getStatusColor(experiment.status)} size="sm">
                                                    {getStatusText(experiment.status)}
                                                </Badge>
                                            </HStack>
                                        ))}
                                    </VStack>
                                </CardBody>
                            </Card>
                        </SimpleGrid>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            {/* 실험 생성 모달 */}
            <Modal isOpen={isCreateModalOpen} onClose={onCreateModalClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>새 A/B 테스트 실험 생성</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <FormControl>
                                <FormLabel>실험명</FormLabel>
                                <Input
                                    value={experimentData.name}
                                    onChange={(e) => setExperimentData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="실험명을 입력하세요"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>설명</FormLabel>
                                <Textarea
                                    value={experimentData.description}
                                    onChange={(e) => setExperimentData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="실험에 대한 설명을 입력하세요"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>가설</FormLabel>
                                <Textarea
                                    value={experimentData.hypothesis}
                                    onChange={(e) => setExperimentData(prev => ({ ...prev, hypothesis: e.target.value }))}
                                    placeholder="실험 가설을 입력하세요"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>주요 목표</FormLabel>
                                <Select
                                    value={experimentData.primaryGoal}
                                    onChange={(e) => setExperimentData(prev => ({ ...prev, primaryGoal: e.target.value }))}
                                >
                                    <option value="conversion_rate">전환율</option>
                                    <option value="click_through_rate">클릭률</option>
                                    <option value="time_on_page">페이지 체류 시간</option>
                                    <option value="bounce_rate">이탈률</option>
                                    <option value="revenue_per_user">사용자당 수익</option>
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel>트래픽 할당 (%)</FormLabel>
                                <NumberInput
                                    value={experimentData.trafficAllocation}
                                    onChange={(value) => setExperimentData(prev => ({ ...prev, trafficAllocation: parseInt(value) || 100 }))}
                                    min={1}
                                    max={100}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            <FormControl>
                                <FormLabel>최소 샘플 크기</FormLabel>
                                <NumberInput
                                    value={experimentData.minSampleSize}
                                    onChange={(value) => setExperimentData(prev => ({ ...prev, minSampleSize: parseInt(value) || 1000 }))}
                                    min={100}
                                    max={100000}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            <HStack spacing={2}>
                                <Button colorScheme="purple" flex="1" onClick={createExperiment}>
                                    실험 생성
                                </Button>
                                <Button variant="outline" flex="1" onClick={onCreateModalClose}>
                                    취소
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 실험 결과 모달 */}
            <Modal isOpen={isResultsModalOpen} onClose={onResultsModalClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>실험 결과</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {experimentResults && (
                            <VStack spacing={4} align="stretch">
                                <Box>
                                    <Text fontWeight="bold" mb={2}>요약</Text>
                                    <VStack spacing={2} align="stretch">
                                        <HStack justify="space-between">
                                            <Text fontSize="sm">Control 전환율</Text>
                                            <Text fontSize="sm" fontWeight="bold">
                                                {experimentResults.summary.controlConversionRate.toFixed(2)}%
                                            </Text>
                                        </HStack>
                                        <HStack justify="space-between">
                                            <Text fontSize="sm">최고 변형</Text>
                                            <Text fontSize="sm" fontWeight="bold">
                                                {experimentResults.summary.bestVariant}
                                            </Text>
                                        </HStack>
                                        <HStack justify="space-between">
                                            <Text fontSize="sm">개선율</Text>
                                            <Text fontSize="sm" fontWeight="bold" color="green.500">
                                                {experimentResults.summary.improvement.toFixed(1)}%
                                            </Text>
                                        </HStack>
                                        <HStack justify="space-between">
                                            <Text fontSize="sm">통계적 유의성</Text>
                                            <Badge
                                                colorScheme={getSignificanceColor(experimentResults.summary.isSignificant)}
                                                size="sm"
                                            >
                                                {experimentResults.summary.isSignificant ? '유의함' : '무의미'}
                                            </Badge>
                                        </HStack>
                                    </VStack>
                                </Box>

                                <Divider />

                                <Box>
                                    <Text fontWeight="bold" mb={2}>변형별 상세 결과</Text>
                                    <Table size="sm">
                                        <Thead>
                                            <Tr>
                                                <Th>변형</Th>
                                                <Th>사용자 수</Th>
                                                <Th>전환 수</Th>
                                                <Th>전환율</Th>
                                                <Th>신뢰도</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {Object.values(experimentResults.results).map(result => (
                                                <Tr key={result.variant.id}>
                                                    <Td>
                                                        <Text fontWeight="medium">
                                                            {result.variant.name}
                                                            {result.variant.isControl && (
                                                                <Badge colorScheme="blue" size="sm" ml={2}>
                                                                    Control
                                                                </Badge>
                                                            )}
                                                        </Text>
                                                    </Td>
                                                    <Td>{result.totalUsers.toLocaleString()}</Td>
                                                    <Td>{result.conversions.toLocaleString()}</Td>
                                                    <Td>{result.conversionRate.toFixed(2)}%</Td>
                                                    <Td>
                                                        {result.significance ?
                                                            `${result.significance.confidence.toFixed(1)}%` :
                                                            '-'
                                                        }
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </Box>
                            </VStack>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default ABTestDashboard;

