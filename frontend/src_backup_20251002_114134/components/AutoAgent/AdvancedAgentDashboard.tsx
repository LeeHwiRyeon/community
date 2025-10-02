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
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    Select,
    Switch,
    Divider,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    Progress,
    CircularProgress,
    CircularProgressLabel,
    useColorModeValue,
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
    Code,
    Tooltip,
    IconButton,
    Flex,
    Spacer,
    Wrap,
    WrapItem,
    Tag,
    TagLabel,
    TagCloseButton,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
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
    SettingsIcon,
    PlayIcon,
    PauseIcon,
    StopIcon,
    RefreshIcon,
    AddIcon,
    EditIcon,
    DeleteIcon,
    ViewIcon,
    DownloadIcon,
    UploadIcon,
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
    UploadIcon as Upload,
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

interface Agent {
    id: string;
    name: string;
    type: string;
    capabilities: string[];
    status: string;
    priority: number;
    maxConcurrentTasks: number;
    performance: {
        successRate: number;
        averageExecutionTime: number;
        totalTasksCompleted: number;
    };
    tasks: Task[];
    collaboration: Collaboration[];
}

interface Task {
    id: string;
    agentId: string;
    type: string;
    priority: number;
    data: any;
    status: string;
    createdAt: string;
    assignedAt: string;
    startedAt: string | null;
    completedAt: string | null;
    result: any;
    error: string | null;
}

interface Collaboration {
    id: string;
    agent1: string;
    agent2: string;
    type: string;
    status: string;
    createdAt: string;
    sharedTasks: string[];
    communicationLog: any[];
}

interface AgentMetrics {
    totalAgents: number;
    activeAgents: number;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averagePerformance: {
        successRate: number;
        averageExecutionTime: number;
    };
    agentDetails: any[];
}

const AdvancedAgentDashboard: React.FC = () => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState(0);

    const { isOpen: isTaskModalOpen, onOpen: onTaskModalOpen, onClose: onTaskModalClose } = useDisclosure();
    const { isOpen: isCollaborationModalOpen, onOpen: onCollaborationModalOpen, onClose: onCollaborationModalClose } = useDisclosure();
    const { isOpen: isScheduleModalOpen, onOpen: onScheduleModalOpen, onClose: onScheduleModalClose } = useDisclosure();

    const [newTask, setNewTask] = useState({
        agentId: '',
        type: '',
        priority: 1,
        data: {}
    });

    const [newCollaboration, setNewCollaboration] = useState({
        agentId1: '',
        agentId2: '',
        collaborationType: ''
    });

    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // 데이터 로드
    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // 에이전트 상태 로드
            const agentsResponse = await fetch('/api/advanced-agent/status');
            const agentsData = await agentsResponse.json();
            if (agentsData.success) {
                setAgents(agentsData.data.agents || []);
            }

            // 메트릭 로드
            const metricsResponse = await fetch('/api/advanced-agent/metrics');
            const metricsData = await metricsResponse.json();
            if (metricsData.success) {
                setMetrics(metricsData.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('데이터를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 작업 할당
    const assignTask = async () => {
        try {
            const response = await fetch('/api/advanced-agent/assign-task', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newTask)
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: '작업 할당 완료',
                    description: '작업이 성공적으로 할당되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                fetchData();
                onTaskModalClose();
                setNewTask({
                    agentId: '',
                    type: '',
                    priority: 1,
                    data: {}
                });
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error assigning task:', error);
            toast({
                title: '작업 할당 실패',
                description: error.message || '작업 할당 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 협업 설정
    const setupCollaboration = async () => {
        try {
            const response = await fetch('/api/advanced-agent/collaboration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newCollaboration)
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: '협업 설정 완료',
                    description: '에이전트 간 협업이 설정되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                fetchData();
                onCollaborationModalClose();
                setNewCollaboration({
                    agentId1: '',
                    agentId2: '',
                    collaborationType: ''
                });
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error setting up collaboration:', error);
            toast({
                title: '협업 설정 실패',
                description: error.message || '협업 설정 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 지능형 스케줄링 실행
    const runIntelligentScheduling = async () => {
        try {
            const response = await fetch('/api/advanced-agent/schedule-intelligent', {
                method: 'POST'
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: '지능형 스케줄링 완료',
                    description: `${data.data.assignments.length}개의 작업이 할당되었습니다.`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                fetchData();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error running intelligent scheduling:', error);
            toast({
                title: '지능형 스케줄링 실패',
                description: error.message || '지능형 스케줄링 중 오류가 발생했습니다.',
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

    // 작업 상태 색상
    const getTaskStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'green';
            case 'running': return 'blue';
            case 'assigned': return 'yellow';
            case 'failed': return 'red';
            default: return 'gray';
        }
    };

    if (isLoading && agents.length === 0) {
        return (
            <Box p={8} textAlign="center">
                <Spinner size="xl" />
                <Text mt={4}>고급 에이전트 시스템 데이터를 불러오는 중...</Text>
            </Box>
        );
    }

    return (
        <Box p={6}>
            {/* Header */}
            <VStack spacing={4} align="stretch" mb={8}>
                <HStack justify="space-between">
                    <Text fontSize="3xl" fontWeight="bold" color="purple.600">
                        🤖 고급 AutoAgent 시스템
                    </Text>
                    <HStack spacing={2}>
                        <Button leftIcon={<RefreshIcon />} colorScheme="purple" variant="outline" onClick={fetchData}>
                            새로고침
                        </Button>
                        <Button leftIcon={<AddIcon />} colorScheme="purple" onClick={onTaskModalOpen}>
                            작업 할당
                        </Button>
                        <Button leftIcon={<UserGroupIcon />} colorScheme="purple" variant="outline" onClick={onCollaborationModalOpen}>
                            협업 설정
                        </Button>
                        <Button leftIcon={<SettingsIcon />} colorScheme="purple" variant="outline" onClick={onScheduleModalOpen}>
                            지능형 스케줄링
                        </Button>
                    </HStack>
                </HStack>

                {/* 통계 카드 */}
                {metrics && (
                    <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>총 에이전트</StatLabel>
                                    <StatNumber color="purple.500">{metrics.totalAgents}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>활성 에이전트</StatLabel>
                                    <StatNumber color="green.500">{metrics.activeAgents}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>총 작업</StatLabel>
                                    <StatNumber color="blue.500">{metrics.totalTasks}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>완료된 작업</StatLabel>
                                    <StatNumber color="green.500">{metrics.completedTasks}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>성공률</StatLabel>
                                    <StatNumber color="purple.500">
                                        {Math.round(metrics.averagePerformance.successRate * 100)}%
                                    </StatNumber>
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
            <Tabs index={selectedTab} onChange={setSelectedTab} variant="enclosed" colorScheme="purple">
                <TabList>
                    <Tab>에이전트 관리</Tab>
                    <Tab>작업 관리</Tab>
                    <Tab>협업 관리</Tab>
                    <Tab>성능 분석</Tab>
                    <Tab>스케줄링</Tab>
                </TabList>

                <TabPanels>
                    {/* 에이전트 관리 탭 */}
                    <TabPanel p={0} mt={6}>
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                            {agents.map(agent => (
                                <Card key={agent.id}>
                                    <CardHeader>
                                        <HStack justify="space-between">
                                            <Text fontSize="lg" fontWeight="bold">{agent.name}</Text>
                                            <Badge colorScheme={getAgentStatusColor(agent.status)}>
                                                {agent.status}
                                            </Badge>
                                        </HStack>
                                    </CardHeader>
                                    <CardBody>
                                        <VStack spacing={3} align="stretch">
                                            <HStack justify="space-between">
                                                <Text fontSize="sm" color="gray.600">타입</Text>
                                                <Text fontSize="sm" fontWeight="medium">{agent.type}</Text>
                                            </HStack>

                                            <HStack justify="space-between">
                                                <Text fontSize="sm" color="gray.600">우선순위</Text>
                                                <Text fontSize="sm" fontWeight="medium">{agent.priority}</Text>
                                            </HStack>

                                            <HStack justify="space-between">
                                                <Text fontSize="sm" color="gray.600">최대 동시 작업</Text>
                                                <Text fontSize="sm" fontWeight="medium">{agent.maxConcurrentTasks}</Text>
                                            </HStack>

                                            <HStack justify="space-between">
                                                <Text fontSize="sm" color="gray.600">현재 작업</Text>
                                                <Text fontSize="sm" fontWeight="medium">{agent.tasks.length}</Text>
                                            </HStack>

                                            <Divider />

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

                                            <VStack spacing={1} align="stretch">
                                                <Text fontSize="sm" fontWeight="medium">능력</Text>
                                                <Wrap>
                                                    {agent.capabilities.map(capability => (
                                                        <WrapItem key={capability}>
                                                            <Tag size="sm" colorScheme="blue">
                                                                <TagLabel>{capability}</TagLabel>
                                                            </Tag>
                                                        </WrapItem>
                                                    ))}
                                                </Wrap>
                                            </VStack>
                                        </VStack>
                                    </CardBody>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </TabPanel>

                    {/* 작업 관리 탭 */}
                    <TabPanel p={0} mt={6}>
                        <Card>
                            <CardHeader>
                                <Text fontSize="lg" fontWeight="bold">작업 관리</Text>
                            </CardHeader>
                            <CardBody>
                                <Table>
                                    <Thead>
                                        <Tr>
                                            <Th>작업 ID</Th>
                                            <Th>에이전트</Th>
                                            <Th>유형</Th>
                                            <Th>우선순위</Th>
                                            <Th>상태</Th>
                                            <Th>생성일</Th>
                                            <Th>완료일</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {agents.flatMap(agent =>
                                            agent.tasks.map(task => (
                                                <Tr key={task.id}>
                                                    <Td>
                                                        <Text fontSize="sm" fontFamily="mono">{task.id}</Text>
                                                    </Td>
                                                    <Td>
                                                        <Text fontSize="sm">{agent.name}</Text>
                                                    </Td>
                                                    <Td>
                                                        <Text fontSize="sm">{task.type}</Text>
                                                    </Td>
                                                    <Td>
                                                        <Text fontSize="sm">{task.priority}</Text>
                                                    </Td>
                                                    <Td>
                                                        <Badge colorScheme={getTaskStatusColor(task.status)}>
                                                            {task.status}
                                                        </Badge>
                                                    </Td>
                                                    <Td>
                                                        <Text fontSize="sm">
                                                            {new Date(task.createdAt).toLocaleDateString('ko-KR')}
                                                        </Text>
                                                    </Td>
                                                    <Td>
                                                        <Text fontSize="sm">
                                                            {task.completedAt ?
                                                                new Date(task.completedAt).toLocaleDateString('ko-KR') :
                                                                '-'
                                                            }
                                                        </Text>
                                                    </Td>
                                                </Tr>
                                            ))
                                        )}
                                    </Tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </TabPanel>

                    {/* 협업 관리 탭 */}
                    <TabPanel p={0} mt={6}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">협업 그룹</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <Box p={3} bg="blue.50" borderRadius="md">
                                            <Text fontWeight="medium" fontSize="sm">보안 팀</Text>
                                            <Text fontSize="xs" color="gray.600">security_agent, monitoring_agent</Text>
                                        </Box>

                                        <Box p={3} bg="green.50" borderRadius="md">
                                            <Text fontWeight="medium" fontSize="sm">분석 팀</Text>
                                            <Text fontSize="xs" color="gray.600">analytics_agent, monitoring_agent</Text>
                                        </Box>

                                        <Box p={3} bg="purple.50" borderRadius="md">
                                            <Text fontWeight="medium" fontSize="sm">유지보수 팀</Text>
                                            <Text fontSize="xs" color="gray.600">todo_agent, integration_agent</Text>
                                        </Box>
                                    </VStack>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">협업 통계</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <HStack justify="space-between">
                                            <Text fontSize="sm">활성 협업</Text>
                                            <Text fontSize="sm" fontWeight="bold">12</Text>
                                        </HStack>

                                        <HStack justify="space-between">
                                            <Text fontSize="sm">공유 작업</Text>
                                            <Text fontSize="sm" fontWeight="bold">8</Text>
                                        </HStack>

                                        <HStack justify="space-between">
                                            <Text fontSize="sm">통신 메시지</Text>
                                            <Text fontSize="sm" fontWeight="bold">156</Text>
                                        </HStack>

                                        <HStack justify="space-between">
                                            <Text fontSize="sm">합의 결정</Text>
                                            <Text fontSize="sm" fontWeight="bold">5</Text>
                                        </HStack>
                                    </VStack>
                                </CardBody>
                            </Card>
                        </SimpleGrid>
                    </TabPanel>

                    {/* 성능 분석 탭 */}
                    <TabPanel p={0} mt={6}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">성능 지표</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <Box textAlign="center">
                                            <CircularProgress
                                                value={metrics?.averagePerformance.successRate * 100 || 0}
                                                color="green.500"
                                                size="120px"
                                            >
                                                <CircularProgressLabel>
                                                    {Math.round((metrics?.averagePerformance.successRate || 0) * 100)}%
                                                </CircularProgressLabel>
                                            </CircularProgress>
                                            <Text mt={2} fontSize="sm" color="gray.600">전체 성공률</Text>
                                        </Box>

                                        <Box textAlign="center">
                                            <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                                                {Math.round(metrics?.averagePerformance.averageExecutionTime || 0)}ms
                                            </Text>
                                            <Text fontSize="sm" color="gray.600">평균 실행 시간</Text>
                                        </Box>
                                    </VStack>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">에이전트별 성능</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={3} align="stretch">
                                        {agents.map(agent => (
                                            <Box key={agent.id} p={3} bg="gray.50" borderRadius="md">
                                                <HStack justify="space-between" mb={2}>
                                                    <Text fontWeight="medium" fontSize="sm">{agent.name}</Text>
                                                    <Badge colorScheme={getAgentStatusColor(agent.status)} size="sm">
                                                        {agent.status}
                                                    </Badge>
                                                </HStack>

                                                <VStack spacing={1} align="stretch">
                                                    <HStack justify="space-between">
                                                        <Text fontSize="xs">성공률</Text>
                                                        <Text fontSize="xs" fontWeight="bold">
                                                            {Math.round(agent.performance.successRate * 100)}%
                                                        </Text>
                                                    </HStack>

                                                    <HStack justify="space-between">
                                                        <Text fontSize="xs">실행 시간</Text>
                                                        <Text fontSize="xs" fontWeight="bold">
                                                            {Math.round(agent.performance.averageExecutionTime)}ms
                                                        </Text>
                                                    </HStack>

                                                    <HStack justify="space-between">
                                                        <Text fontSize="xs">완료 작업</Text>
                                                        <Text fontSize="xs" fontWeight="bold">
                                                            {agent.performance.totalTasksCompleted}
                                                        </Text>
                                                    </HStack>
                                                </VStack>
                                            </Box>
                                        ))}
                                    </VStack>
                                </CardBody>
                            </Card>
                        </SimpleGrid>
                    </TabPanel>

                    {/* 스케줄링 탭 */}
                    <TabPanel p={0} mt={6}>
                        <Card>
                            <CardHeader>
                                <Text fontSize="lg" fontWeight="bold">지능형 스케줄링</Text>
                            </CardHeader>
                            <CardBody>
                                <VStack spacing={6} align="stretch">
                                    <HStack spacing={4}>
                                        <Button colorScheme="purple" leftIcon={<PlayIcon />} onClick={runIntelligentScheduling}>
                                            스케줄링 실행
                                        </Button>
                                        <Button colorScheme="blue" variant="outline" leftIcon={<SettingsIcon />}>
                                            스케줄링 설정
                                        </Button>
                                        <Button colorScheme="green" variant="outline" leftIcon={<ViewIcon />}>
                                            스케줄링 히스토리
                                        </Button>
                                    </HStack>

                                    <Divider />

                                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                                        <Box textAlign="center" p={4} bg="purple.50" borderRadius="md">
                                            <Text fontSize="2xl" fontWeight="bold" color="purple.500">15</Text>
                                            <Text fontSize="sm" color="gray.600">대기 중인 작업</Text>
                                        </Box>

                                        <Box textAlign="center" p={4} bg="blue.50" borderRadius="md">
                                            <Text fontSize="2xl" fontWeight="bold" color="blue.500">8</Text>
                                            <Text fontSize="sm" color="gray.600">실행 중인 작업</Text>
                                        </Box>

                                        <Box textAlign="center" p={4} bg="green.50" borderRadius="md">
                                            <Text fontSize="2xl" fontWeight="bold" color="green.500">23</Text>
                                            <Text fontSize="sm" color="gray.600">완료된 작업</Text>
                                        </Box>
                                    </SimpleGrid>

                                    <Divider />

                                    <VStack spacing={3} align="stretch">
                                        <Text fontWeight="medium">스케줄링 알고리즘</Text>
                                        <HStack spacing={4}>
                                            <Badge colorScheme="green">우선순위 기반</Badge>
                                            <Badge colorScheme="blue">리소스 최적화</Badge>
                                            <Badge colorScheme="purple">의존성 관리</Badge>
                                            <Badge colorScheme="orange">부하 분산</Badge>
                                        </HStack>
                                    </VStack>
                                </VStack>
                            </CardBody>
                        </Card>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            {/* 작업 할당 모달 */}
            <Modal isOpen={isTaskModalOpen} onClose={onTaskModalClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>작업 할당</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <FormControl>
                                <FormLabel>에이전트 선택</FormLabel>
                                <Select
                                    value={newTask.agentId}
                                    onChange={(e) => setNewTask(prev => ({ ...prev, agentId: e.target.value }))}
                                >
                                    <option value="">에이전트를 선택하세요</option>
                                    {agents.map(agent => (
                                        <option key={agent.id} value={agent.id}>
                                            {agent.name} ({agent.type})
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel>작업 유형</FormLabel>
                                <Select
                                    value={newTask.type}
                                    onChange={(e) => setNewTask(prev => ({ ...prev, type: e.target.value }))}
                                >
                                    <option value="">작업 유형을 선택하세요</option>
                                    <option value="todo_creation">TODO 생성</option>
                                    <option value="security_scan">보안 스캔</option>
                                    <option value="analytics_report">분석 리포트</option>
                                    <option value="integration_sync">통합 동기화</option>
                                    <option value="monitoring_check">모니터링 체크</option>
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel>우선순위</FormLabel>
                                <NumberInput
                                    value={newTask.priority}
                                    onChange={(value) => setNewTask(prev => ({ ...prev, priority: parseInt(value) || 1 }))}
                                    min={1}
                                    max={10}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            <HStack spacing={2}>
                                <Button colorScheme="purple" flex="1" onClick={assignTask}>
                                    작업 할당
                                </Button>
                                <Button variant="outline" flex="1" onClick={onTaskModalClose}>
                                    취소
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 협업 설정 모달 */}
            <Modal isOpen={isCollaborationModalOpen} onClose={onCollaborationModalClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>협업 설정</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <FormControl>
                                <FormLabel>첫 번째 에이전트</FormLabel>
                                <Select
                                    value={newCollaboration.agentId1}
                                    onChange={(e) => setNewCollaboration(prev => ({ ...prev, agentId1: e.target.value }))}
                                >
                                    <option value="">에이전트를 선택하세요</option>
                                    {agents.map(agent => (
                                        <option key={agent.id} value={agent.id}>
                                            {agent.name} ({agent.type})
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel>두 번째 에이전트</FormLabel>
                                <Select
                                    value={newCollaboration.agentId2}
                                    onChange={(e) => setNewCollaboration(prev => ({ ...prev, agentId2: e.target.value }))}
                                >
                                    <option value="">에이전트를 선택하세요</option>
                                    {agents.map(agent => (
                                        <option key={agent.id} value={agent.id}>
                                            {agent.name} ({agent.type})
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel>협업 유형</FormLabel>
                                <Select
                                    value={newCollaboration.collaborationType}
                                    onChange={(e) => setNewCollaboration(prev => ({ ...prev, collaborationType: e.target.value }))}
                                >
                                    <option value="">협업 유형을 선택하세요</option>
                                    <option value="task_sharing">작업 공유</option>
                                    <option value="data_exchange">데이터 교환</option>
                                    <option value="mutual_support">상호 지원</option>
                                    <option value="workflow_coordination">워크플로우 조정</option>
                                </Select>
                            </FormControl>

                            <HStack spacing={2}>
                                <Button colorScheme="purple" flex="1" onClick={setupCollaboration}>
                                    협업 설정
                                </Button>
                                <Button variant="outline" flex="1" onClick={onCollaborationModalClose}>
                                    취소
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 지능형 스케줄링 모달 */}
            <Modal isOpen={isScheduleModalOpen} onClose={onScheduleModalClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>지능형 스케줄링</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <Text fontSize="sm" color="gray.600">
                                지능형 스케줄링은 AI 알고리즘을 사용하여 작업을 최적의 에이전트에게 자동으로 할당합니다.
                            </Text>

                            <SimpleGrid columns={2} spacing={4}>
                                <Box p={3} bg="blue.50" borderRadius="md">
                                    <Text fontWeight="medium" fontSize="sm">우선순위 기반</Text>
                                    <Text fontSize="xs" color="gray.600">작업 우선순위를 고려한 할당</Text>
                                </Box>

                                <Box p={3} bg="green.50" borderRadius="md">
                                    <Text fontWeight="medium" fontSize="sm">리소스 최적화</Text>
                                    <Text fontSize="xs" color="gray.600">시스템 리소스를 효율적으로 활용</Text>
                                </Box>

                                <Box p={3} bg="purple.50" borderRadius="md">
                                    <Text fontWeight="medium" fontSize="sm">의존성 관리</Text>
                                    <Text fontSize="xs" color="gray.600">작업 간 의존성을 고려한 순서 조정</Text>
                                </Box>

                                <Box p={3} bg="orange.50" borderRadius="md">
                                    <Text fontWeight="medium" fontSize="sm">부하 분산</Text>
                                    <Text fontSize="xs" color="gray.600">에이전트 간 작업 부하 균등 분배</Text>
                                </Box>
                            </SimpleGrid>

                            <HStack spacing={2}>
                                <Button colorScheme="purple" flex="1" onClick={runIntelligentScheduling}>
                                    스케줄링 실행
                                </Button>
                                <Button variant="outline" flex="1" onClick={onScheduleModalClose}>
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

export default AdvancedAgentDashboard;

