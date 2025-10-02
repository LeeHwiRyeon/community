import React, { useState, useEffect, useRef } from 'react';
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
    Badge,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    useToast,
    Spinner,
    Alert,
    AlertIcon,
    Progress,
    CircularProgress,
    CircularProgressLabel,
    useColorModeValue,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    Divider,
    Switch,
    FormControl,
    FormLabel,
    Tooltip,
    IconButton,
    Flex,
    Spacer,
    Wrap,
    WrapItem,
    Tag,
    TagLabel,
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
    UnorderedList
} from '@chakra-ui/react';
import {
    PlayIcon,
    PauseIcon,
    StopIcon,
    RefreshIcon,
    SettingsIcon,
    ViewIcon,
    DownloadIcon,
    ShareIcon,
    LinkIcon,
    CopyIcon,
    SearchIcon,
    FilterIcon,
    SortIcon,
    CalendarIcon,
    TimeIcon,
    ActivityIcon,
    SecurityIcon,
    UserGroupIcon,
    RoleIcon,
    PermissionIcon,
    AuditIcon,
    SessionIcon,
    TwoFactorIcon,
    PasswordIcon,
    EmailIcon,
    PhoneIcon,
    LocationIcon,
    GlobeIcon,
    DatabaseIcon,
    ServerIcon,
    NetworkIcon,
    CloudIcon,
    MobileIcon,
    DesktopIcon,
    TabletIcon,
    BrowserIcon,
    DeviceIcon,
    PlatformIcon,
    OperatingSystemIcon,
    VersionIcon,
    BuildIcon,
    ReleaseIcon,
    EnvironmentIcon,
    ConfigurationIcon,
    SetupIcon,
    InstallIcon,
    UpdateIcon,
    UpgradeIcon,
    DowngradeIcon,
    MigrateIcon,
    BackupIcon,
    RestoreIcon,
    SyncIcon,
    ImportIcon,
    ExportIcon,
    UploadIcon,
    DownloadIcon as Download,
    ShareIcon as Share,
    LinkIcon as Link,
    CopyIcon as Copy,
    PasteIcon,
    CutIcon,
    UndoIcon,
    RedoIcon,
    SaveIcon,
    LoadIcon,
    OpenIcon,
    CloseIcon,
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
    StarIcon,
    UnstarIcon,
    HeartIcon,
    UnheartIcon,
    LikeIcon,
    UnlikeIcon,
    DislikeIcon,
    UndislikeIcon,
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

interface AgentMonitor {
    id: string;
    name: string;
    type: string;
    status: string;
    performance: {
        successRate: number;
        averageExecutionTime: number;
        totalTasksCompleted: number;
    };
    currentTasks: number;
    maxConcurrentTasks: number;
    resourceUsage: {
        cpu: number;
        memory: number;
        network: number;
        storage: number;
    };
    lastActivity: string;
    healthScore: number;
}

interface SystemMetrics {
    totalAgents: number;
    activeAgents: number;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averagePerformance: {
        successRate: number;
        averageExecutionTime: number;
    };
    systemLoad: {
        cpu: number;
        memory: number;
        network: number;
        storage: number;
    };
    alerts: Array<{
        id: string;
        type: string;
        message: string;
        severity: string;
        timestamp: string;
    }>;
}

const RealTimeAgentMonitor: React.FC = () => {
    const [agents, setAgents] = useState<AgentMonitor[]>([]);
    const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshInterval, setRefreshInterval] = useState(5000); // 5초
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // 실시간 모니터링 시작
    const startMonitoring = () => {
        if (isMonitoring) return;

        setIsMonitoring(true);
        fetchData(); // 즉시 한 번 실행

        intervalRef.current = setInterval(() => {
            fetchData();
        }, refreshInterval);

        toast({
            title: '실시간 모니터링 시작',
            description: `${refreshInterval / 1000}초마다 데이터를 업데이트합니다.`,
            status: 'success',
            duration: 3000,
            isClosable: true
        });
    };

    // 실시간 모니터링 중지
    const stopMonitoring = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsMonitoring(false);

        toast({
            title: '실시간 모니터링 중지',
            description: '실시간 모니터링이 중지되었습니다.',
            status: 'info',
            duration: 3000,
            isClosable: true
        });
    };

    // 데이터 로드
    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // 에이전트 상태 로드
            const agentsResponse = await fetch('/api/advanced-agent/status');
            const agentsData = await agentsResponse.json();
            if (agentsData.success) {
                const agentMonitors = agentsData.data.agents.map((agent: any) => ({
                    ...agent,
                    resourceUsage: {
                        cpu: Math.random() * 100,
                        memory: Math.random() * 100,
                        network: Math.random() * 100,
                        storage: Math.random() * 100
                    },
                    healthScore: Math.random() * 100
                }));
                setAgents(agentMonitors);
            }

            // 시스템 메트릭 로드
            const metricsResponse = await fetch('/api/advanced-agent/metrics');
            const metricsData = await metricsResponse.json();
            if (metricsData.success) {
                setSystemMetrics({
                    ...metricsData.data,
                    systemLoad: {
                        cpu: Math.random() * 100,
                        memory: Math.random() * 100,
                        network: Math.random() * 100,
                        storage: Math.random() * 100
                    },
                    alerts: generateMockAlerts()
                });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('데이터를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 모의 알림 생성
    const generateMockAlerts = () => {
        const alertTypes = ['performance', 'resource', 'error', 'warning'];
        const severities = ['low', 'medium', 'high', 'critical'];
        const messages = [
            '에이전트 성능 저하 감지',
            '리소스 사용량 증가',
            '작업 실행 실패',
            '연결 시간 초과',
            '메모리 부족 경고'
        ];

        return Array.from({ length: Math.floor(Math.random() * 5) }, (_, i) => ({
            id: `alert_${Date.now()}_${i}`,
            type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
            message: messages[Math.floor(Math.random() * messages.length)],
            severity: severities[Math.floor(Math.random() * severities.length)],
            timestamp: new Date().toISOString()
        }));
    };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        fetchData();

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // 에이전트 상태 색상
    const getAgentStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'green';
            case 'busy': return 'yellow';
            case 'idle': return 'blue';
            case 'error': return 'red';
            default: return 'gray';
        }
    };

    // 알림 심각도 색상
    const getAlertSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'red';
            case 'high': return 'orange';
            case 'medium': return 'yellow';
            case 'low': return 'blue';
            default: return 'gray';
        }
    };

    // 리소스 사용량 색상
    const getResourceColor = (usage: number) => {
        if (usage > 90) return 'red';
        if (usage > 70) return 'orange';
        if (usage > 50) return 'yellow';
        return 'green';
    };

    if (isLoading && agents.length === 0) {
        return (
            <Box p={8} textAlign="center">
                <Spinner size="xl" />
                <Text mt={4}>실시간 에이전트 모니터링 데이터를 불러오는 중...</Text>
            </Box>
        );
    }

    return (
        <Box p={6}>
            {/* Header */}
            <VStack spacing={4} align="stretch" mb={8}>
                <HStack justify="space-between">
                    <Text fontSize="3xl" fontWeight="bold" color="blue.600">
                        📊 실시간 에이전트 모니터링
                    </Text>
                    <HStack spacing={2}>
                        <Button
                            leftIcon={isMonitoring ? <PauseIcon /> : <PlayIcon />}
                            colorScheme={isMonitoring ? "red" : "green"}
                            onClick={isMonitoring ? stopMonitoring : startMonitoring}
                        >
                            {isMonitoring ? '모니터링 중지' : '모니터링 시작'}
                        </Button>
                        <Button leftIcon={<RefreshIcon />} colorScheme="blue" variant="outline" onClick={fetchData}>
                            새로고침
                        </Button>
                        <Button leftIcon={<SettingsIcon />} colorScheme="blue" variant="outline">
                            설정
                        </Button>
                    </HStack>
                </HStack>

                {/* 시스템 상태 카드 */}
                {systemMetrics && (
                    <SimpleGrid columns={{ base: 2, md: 6 }} spacing={4}>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>총 에이전트</StatLabel>
                                    <StatNumber color="blue.500">{systemMetrics.totalAgents}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>활성 에이전트</StatLabel>
                                    <StatNumber color="green.500">{systemMetrics.activeAgents}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>총 작업</StatLabel>
                                    <StatNumber color="purple.500">{systemMetrics.totalTasks}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>완료된 작업</StatLabel>
                                    <StatNumber color="green.500">{systemMetrics.completedTasks}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>시스템 부하</StatLabel>
                                    <StatNumber color="orange.500">
                                        {Math.round(systemMetrics.systemLoad.cpu)}%
                                    </StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>알림</StatLabel>
                                    <StatNumber color="red.500">{systemMetrics.alerts.length}</StatNumber>
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

            {/* 실시간 모니터링 상태 */}
            {isMonitoring && (
                <Alert status="info" mb={4}>
                    <AlertIcon />
                    <Text>실시간 모니터링 중... {refreshInterval / 1000}초마다 업데이트</Text>
                </Alert>
            )}

            {/* 에이전트 모니터링 그리드 */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={8}>
                {agents.map(agent => (
                    <Card key={agent.id} borderColor={selectedAgent === agent.id ? 'blue.500' : undefined}>
                        <CardHeader>
                            <HStack justify="space-between">
                                <Text fontSize="lg" fontWeight="bold">{agent.name}</Text>
                                <HStack spacing={2}>
                                    <Badge colorScheme={getAgentStatusColor(agent.status)}>
                                        {agent.status}
                                    </Badge>
                                    <CircularProgress
                                        value={agent.healthScore}
                                        color={agent.healthScore > 80 ? 'green.500' : agent.healthScore > 60 ? 'yellow.500' : 'red.500'}
                                        size="40px"
                                    >
                                        <CircularProgressLabel fontSize="xs">
                                            {Math.round(agent.healthScore)}
                                        </CircularProgressLabel>
                                    </CircularProgress>
                                </HStack>
                            </HStack>
                        </CardHeader>
                        <CardBody>
                            <VStack spacing={4} align="stretch">
                                {/* 성능 지표 */}
                                <VStack spacing={2} align="stretch">
                                    <Text fontSize="sm" fontWeight="medium">성능 지표</Text>
                                    <HStack justify="space-between">
                                        <Text fontSize="xs">성공률</Text>
                                        <Text fontSize="xs" fontWeight="bold">
                                            {Math.round(agent.performance.successRate * 100)}%
                                        </Text>
                                    </HStack>
                                    <HStack justify="space-between">
                                        <Text fontSize="xs">평균 실행 시간</Text>
                                        <Text fontSize="xs" fontWeight="bold">
                                            {Math.round(agent.performance.averageExecutionTime)}ms
                                        </Text>
                                    </HStack>
                                    <HStack justify="space-between">
                                        <Text fontSize="xs">완료된 작업</Text>
                                        <Text fontSize="xs" fontWeight="bold">
                                            {agent.performance.totalTasksCompleted}
                                        </Text>
                                    </HStack>
                                </VStack>

                                <Divider />

                                {/* 리소스 사용량 */}
                                <VStack spacing={2} align="stretch">
                                    <Text fontSize="sm" fontWeight="medium">리소스 사용량</Text>
                                    <HStack justify="space-between">
                                        <Text fontSize="xs">CPU</Text>
                                        <HStack spacing={2}>
                                            <Progress
                                                value={agent.resourceUsage.cpu}
                                                colorScheme={getResourceColor(agent.resourceUsage.cpu)}
                                                size="sm"
                                                width="60px"
                                            />
                                            <Text fontSize="xs" fontWeight="bold">
                                                {Math.round(agent.resourceUsage.cpu)}%
                                            </Text>
                                        </HStack>
                                    </HStack>
                                    <HStack justify="space-between">
                                        <Text fontSize="xs">메모리</Text>
                                        <HStack spacing={2}>
                                            <Progress
                                                value={agent.resourceUsage.memory}
                                                colorScheme={getResourceColor(agent.resourceUsage.memory)}
                                                size="sm"
                                                width="60px"
                                            />
                                            <Text fontSize="xs" fontWeight="bold">
                                                {Math.round(agent.resourceUsage.memory)}%
                                            </Text>
                                        </HStack>
                                    </HStack>
                                    <HStack justify="space-between">
                                        <Text fontSize="xs">네트워크</Text>
                                        <HStack spacing={2}>
                                            <Progress
                                                value={agent.resourceUsage.network}
                                                colorScheme={getResourceColor(agent.resourceUsage.network)}
                                                size="sm"
                                                width="60px"
                                            />
                                            <Text fontSize="xs" fontWeight="bold">
                                                {Math.round(agent.resourceUsage.network)}%
                                            </Text>
                                        </HStack>
                                    </HStack>
                                </VStack>

                                <Divider />

                                {/* 작업 상태 */}
                                <VStack spacing={2} align="stretch">
                                    <Text fontSize="sm" fontWeight="medium">작업 상태</Text>
                                    <HStack justify="space-between">
                                        <Text fontSize="xs">현재 작업</Text>
                                        <Text fontSize="xs" fontWeight="bold">
                                            {agent.currentTasks} / {agent.maxConcurrentTasks}
                                        </Text>
                                    </HStack>
                                    <HStack justify="space-between">
                                        <Text fontSize="xs">마지막 활동</Text>
                                        <Text fontSize="xs" color="gray.600">
                                            {new Date(agent.lastActivity).toLocaleTimeString('ko-KR')}
                                        </Text>
                                    </HStack>
                                </VStack>

                                {/* 액션 버튼 */}
                                <HStack spacing={2}>
                                    <Button
                                        size="sm"
                                        colorScheme="blue"
                                        variant="outline"
                                        onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                                    >
                                        {selectedAgent === agent.id ? '선택 해제' : '상세 보기'}
                                    </Button>
                                    <Button size="sm" colorScheme="green" variant="outline">
                                        제어
                                    </Button>
                                </HStack>
                            </VStack>
                        </CardBody>
                    </Card>
                ))}
            </SimpleGrid>

            {/* 선택된 에이전트 상세 정보 */}
            {selectedAgent && (
                <Card mb={8}>
                    <CardHeader>
                        <Text fontSize="lg" fontWeight="bold">
                            {agents.find(a => a.id === selectedAgent)?.name} 상세 정보
                        </Text>
                    </CardHeader>
                    <CardBody>
                        <VStack spacing={4} align="stretch">
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                <Box>
                                    <Text fontSize="sm" fontWeight="medium" mb={2}>성능 트렌드</Text>
                                    <Box p={4} bg="gray.50" borderRadius="md">
                                        <Text fontSize="xs" color="gray.600">성능 데이터 차트 (실제로는 차트 라이브러리 사용)</Text>
                                    </Box>
                                </Box>
                                <Box>
                                    <Text fontSize="sm" fontWeight="medium" mb={2}>리소스 사용량 히스토리</Text>
                                    <Box p={4} bg="gray.50" borderRadius="md">
                                        <Text fontSize="xs" color="gray.600">리소스 사용량 차트 (실제로는 차트 라이브러리 사용)</Text>
                                    </Box>
                                </Box>
                            </SimpleGrid>
                        </VStack>
                    </CardBody>
                </Card>
            )}

            {/* 알림 섹션 */}
            {systemMetrics && systemMetrics.alerts.length > 0 && (
                <Card>
                    <CardHeader>
                        <Text fontSize="lg" fontWeight="bold">시스템 알림</Text>
                    </CardHeader>
                    <CardBody>
                        <VStack spacing={3} align="stretch">
                            {systemMetrics.alerts.map(alert => (
                                <HStack key={alert.id} p={3} bg="gray.50" borderRadius="md" justify="space-between">
                                    <HStack spacing={3}>
                                        <Badge colorScheme={getAlertSeverityColor(alert.severity)}>
                                            {alert.severity}
                                        </Badge>
                                        <Text fontSize="sm">{alert.message}</Text>
                                    </HStack>
                                    <Text fontSize="xs" color="gray.600">
                                        {new Date(alert.timestamp).toLocaleTimeString('ko-KR')}
                                    </Text>
                                </HStack>
                            ))}
                        </VStack>
                    </CardBody>
                </Card>
            )}

            {/* 모니터링 설정 */}
            <Card mt={8}>
                <CardHeader>
                    <Text fontSize="lg" fontWeight="bold">모니터링 설정</Text>
                </CardHeader>
                <CardBody>
                    <VStack spacing={4} align="stretch">
                        <FormControl>
                            <FormLabel>새로고침 간격 (초)</FormLabel>
                            <HStack spacing={4}>
                                <Button
                                    size="sm"
                                    colorScheme={refreshInterval === 1000 ? "blue" : "gray"}
                                    onClick={() => setRefreshInterval(1000)}
                                >
                                    1초
                                </Button>
                                <Button
                                    size="sm"
                                    colorScheme={refreshInterval === 5000 ? "blue" : "gray"}
                                    onClick={() => setRefreshInterval(5000)}
                                >
                                    5초
                                </Button>
                                <Button
                                    size="sm"
                                    colorScheme={refreshInterval === 10000 ? "blue" : "gray"}
                                    onClick={() => setRefreshInterval(10000)}
                                >
                                    10초
                                </Button>
                                <Button
                                    size="sm"
                                    colorScheme={refreshInterval === 30000 ? "blue" : "gray"}
                                    onClick={() => setRefreshInterval(30000)}
                                >
                                    30초
                                </Button>
                            </HStack>
                        </FormControl>

                        <FormControl>
                            <HStack>
                                <Switch
                                    isChecked={isMonitoring}
                                    onChange={(e) => e.target.checked ? startMonitoring() : stopMonitoring()}
                                />
                                <FormLabel mb={0}>실시간 모니터링 활성화</FormLabel>
                            </HStack>
                        </FormControl>
                    </VStack>
                </CardBody>
            </Card>
        </Box>
    );
};

export default RealTimeAgentMonitor;
