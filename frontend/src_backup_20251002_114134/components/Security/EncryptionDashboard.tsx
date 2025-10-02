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
    ShieldIcon,
    LockIcon,
    KeyIcon,
    EyeIcon,
    EyeOffIcon,
    CheckIcon,
    CloseIcon,
    WarningIcon,
    InfoIcon,
    SettingsIcon,
    RefreshIcon,
    DownloadIcon,
    ViewIcon,
    EditIcon,
    DeleteIcon,
    AddIcon,
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
    ShareIcon,
    LinkIcon,
    CopyIcon,
    PasteIcon,
    CutIcon,
    UndoIcon,
    RedoIcon,
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
    ShieldIcon as Shield,
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

interface EncryptionStats {
    classifications: {
        [key: string]: {
            encryptCount: number;
            decryptCount: number;
            lastActivity: string;
        };
    };
    totalEncryptions: number;
    totalDecryptions: number;
    keyVersions: {
        aes256: number;
        rsa: number;
        hmac: number;
    };
    lastKeyRotation: string;
    nextKeyRotation: string;
}

interface DataClassification {
    level: string;
    name: string;
    description: string;
    encryptionRequired: boolean;
    retentionDays: number;
    accessLevel: number;
}

interface AccessLog {
    id: string;
    action: string;
    userId: string;
    classification: string;
    timestamp: string;
    dataId: string;
    ipAddress: string;
    userAgent: string;
}

interface PrivacyStats {
    totalConsents: number;
    activeConsents: number;
    totalBreaches: number;
    activeBreaches: number;
    gdprRights: number;
    retentionPolicies: number;
}

const EncryptionDashboard: React.FC = () => {
    const [encryptionStats, setEncryptionStats] = useState<EncryptionStats | null>(null);
    const [classifications, setClassifications] = useState<DataClassification[]>([]);
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
    const [privacyStats, setPrivacyStats] = useState<PrivacyStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState(0);

    const { isOpen: isEncryptModalOpen, onOpen: onEncryptModalOpen, onClose: onEncryptModalClose } = useDisclosure();
    const { isOpen: isDecryptModalOpen, onOpen: onDecryptModalOpen, onClose: onDecryptModalClose } = useDisclosure();
    const { isOpen: isPIIModalOpen, onOpen: onPIIModalOpen, onClose: onPIIModalClose } = useDisclosure();

    const [encryptData, setEncryptData] = useState<any>({});
    const [decryptData, setDecryptData] = useState<any>({});
    const [piiData, setPiiData] = useState<any>({});

    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // 데이터 로드
    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // 암호화 통계 로드
            const statsResponse = await fetch('/api/encryption/stats');
            const statsData = await statsResponse.json();
            if (statsData.success) {
                setEncryptionStats(statsData.data);
            }

            // 데이터 분류 로드
            const classificationsResponse = await fetch('/api/encryption/classifications');
            const classificationsData = await classificationsResponse.json();
            if (classificationsData.success) {
                setClassifications(classificationsData.data);
            }

            // 접근 로그 로드
            const logsResponse = await fetch('/api/encryption/access-logs?limit=50');
            const logsData = await logsResponse.json();
            if (logsData.success) {
                setAccessLogs(logsData.data);
            }

            // 개인정보 보호 통계 로드
            const privacyStatsResponse = await fetch('/api/encryption/privacy-stats');
            const privacyStatsData = await privacyStatsResponse.json();
            if (privacyStatsData.success) {
                setPrivacyStats(privacyStatsData.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('데이터를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 데이터 암호화
    const encryptData = async () => {
        try {
            const response = await fetch('/api/encryption/encrypt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(encryptData)
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: '암호화 완료',
                    description: '데이터가 성공적으로 암호화되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                fetchData(); // 데이터 새로고침
                onEncryptModalClose();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error encrypting data:', error);
            toast({
                title: '암호화 실패',
                description: error.message || '데이터 암호화 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 데이터 복호화
    const decryptData = async () => {
        try {
            const response = await fetch('/api/encryption/decrypt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(decryptData)
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: '복호화 완료',
                    description: '데이터가 성공적으로 복호화되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                fetchData(); // 데이터 새로고침
                onDecryptModalClose();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error decrypting data:', error);
            toast({
                title: '복호화 실패',
                description: error.message || '데이터 복호화 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // PII 데이터 감지
    const detectPII = async () => {
        try {
            const response = await fetch('/api/encryption/detect-pii', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: piiData })
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: 'PII 감지 완료',
                    description: `${data.detectedPII.length}개의 PII 패턴이 감지되었습니다.`,
                    status: 'info',
                    duration: 3000,
                    isClosable: true
                });
                onPIIModalClose();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error detecting PII:', error);
            toast({
                title: 'PII 감지 실패',
                description: error.message || 'PII 감지 중 오류가 발생했습니다.',
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

    // 분류 레벨 색상
    const getClassificationColor = (level: string) => {
        switch (level) {
            case 'pii': return 'red';
            case 'restricted': return 'orange';
            case 'confidential': return 'yellow';
            case 'internal': return 'blue';
            case 'public': return 'green';
            default: return 'gray';
        }
    };

    // 액션 색상
    const getActionColor = (action: string) => {
        switch (action) {
            case 'encrypt': return 'green';
            case 'decrypt': return 'blue';
            case 'access': return 'purple';
            default: return 'gray';
        }
    };

    if (isLoading && !encryptionStats) {
        return (
            <Box p={8} textAlign="center">
                <Spinner size="xl" />
                <Text mt={4}>암호화 시스템 데이터를 불러오는 중...</Text>
            </Box>
        );
    }

    return (
        <Box p={6}>
            {/* Header */}
            <VStack spacing={4} align="stretch" mb={8}>
                <HStack justify="space-between">
                    <Text fontSize="3xl" fontWeight="bold" color="green.600">
                        🔐 데이터 암호화 및 개인정보 보호
                    </Text>
                    <HStack spacing={2}>
                        <Button leftIcon={<RefreshIcon />} colorScheme="green" variant="outline" onClick={fetchData}>
                            새로고침
                        </Button>
                        <Button leftIcon={<LockIcon />} colorScheme="green" onClick={onEncryptModalOpen}>
                            데이터 암호화
                        </Button>
                        <Button leftIcon={<EyeIcon />} colorScheme="green" variant="outline" onClick={onDecryptModalOpen}>
                            데이터 복호화
                        </Button>
                        <Button leftIcon={<SearchIcon />} colorScheme="green" variant="outline" onClick={onPIIModalOpen}>
                            PII 감지
                        </Button>
                    </HStack>
                </HStack>

                {/* 통계 카드 */}
                {encryptionStats && (
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>총 암호화</StatLabel>
                                    <StatNumber color="green.500">{encryptionStats.totalEncryptions}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>총 복호화</StatLabel>
                                    <StatNumber color="blue.500">{encryptionStats.totalDecryptions}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>AES-256 키 버전</StatLabel>
                                    <StatNumber color="purple.500">{encryptionStats.keyVersions.aes256}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>RSA 키 버전</StatLabel>
                                    <StatNumber color="orange.500">{encryptionStats.keyVersions.rsa}</StatNumber>
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
                    <Tab>암호화 관리</Tab>
                    <Tab>데이터 분류</Tab>
                    <Tab>접근 로그</Tab>
                    <Tab>개인정보 보호</Tab>
                </TabList>

                <TabPanels>
                    {/* 암호화 관리 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">암호화 통계</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        {encryptionStats && Object.entries(encryptionStats.classifications).map(([level, stats]) => (
                                            <Box key={level} p={4} bg="gray.50" borderRadius="md">
                                                <HStack justify="space-between" mb={2}>
                                                    <Text fontWeight="medium" textTransform="capitalize">
                                                        {level}
                                                    </Text>
                                                    <Badge colorScheme={getClassificationColor(level)} size="sm">
                                                        {level.toUpperCase()}
                                                    </Badge>
                                                </HStack>

                                                <VStack spacing={2} align="stretch">
                                                    <HStack justify="space-between">
                                                        <Text fontSize="sm">암호화</Text>
                                                        <Text fontSize="sm" fontWeight="bold">
                                                            {stats.encryptCount.toLocaleString()}
                                                        </Text>
                                                    </HStack>
                                                    <HStack justify="space-between">
                                                        <Text fontSize="sm">복호화</Text>
                                                        <Text fontSize="sm" fontWeight="bold">
                                                            {stats.decryptCount.toLocaleString()}
                                                        </Text>
                                                    </HStack>
                                                    <HStack justify="space-between">
                                                        <Text fontSize="sm">마지막 활동</Text>
                                                        <Text fontSize="sm" color="gray.600">
                                                            {new Date(stats.lastActivity).toLocaleDateString('ko-KR')}
                                                        </Text>
                                                    </HStack>
                                                </VStack>
                                            </Box>
                                        ))}
                                    </VStack>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">키 관리</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <Box textAlign="center">
                                            <Text fontSize="2xl" fontWeight="bold" color="green.500">
                                                {encryptionStats?.keyVersions.aes256 || 0}
                                            </Text>
                                            <Text fontSize="sm" color="gray.600">AES-256 키 버전</Text>
                                        </Box>

                                        <Box textAlign="center">
                                            <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                                                {encryptionStats?.keyVersions.rsa || 0}
                                            </Text>
                                            <Text fontSize="sm" color="gray.600">RSA 키 버전</Text>
                                        </Box>

                                        <Box textAlign="center">
                                            <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                                                {encryptionStats?.keyVersions.hmac || 0}
                                            </Text>
                                            <Text fontSize="sm" color="gray.600">HMAC 키 버전</Text>
                                        </Box>

                                        <Divider />

                                        <VStack spacing={2} align="stretch">
                                            <Text fontSize="sm" fontWeight="medium">마지막 키 로테이션</Text>
                                            <Text fontSize="sm" color="gray.600">
                                                {encryptionStats?.lastKeyRotation ?
                                                    new Date(encryptionStats.lastKeyRotation).toLocaleString('ko-KR') :
                                                    '없음'
                                                }
                                            </Text>
                                        </VStack>

                                        <VStack spacing={2} align="stretch">
                                            <Text fontSize="sm" fontWeight="medium">다음 키 로테이션</Text>
                                            <Text fontSize="sm" color="gray.600">
                                                {encryptionStats?.nextKeyRotation ?
                                                    new Date(encryptionStats.nextKeyRotation).toLocaleString('ko-KR') :
                                                    '예정 없음'
                                                }
                                            </Text>
                                        </VStack>

                                        <Button colorScheme="green" size="sm">
                                            키 로테이션 실행
                                        </Button>
                                    </VStack>
                                </CardBody>
                            </Card>
                        </SimpleGrid>
                    </TabPanel>

                    {/* 데이터 분류 탭 */}
                    <TabPanel p={0}>
                        <Card>
                            <CardHeader>
                                <Text fontSize="lg" fontWeight="bold">데이터 분류 체계</Text>
                            </CardHeader>
                            <CardBody>
                                <Table>
                                    <Thead>
                                        <Tr>
                                            <Th>분류</Th>
                                            <Th>설명</Th>
                                            <Th>암호화 필요</Th>
                                            <Th>보존 기간</Th>
                                            <Th>접근 레벨</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {classifications.map(classification => (
                                            <Tr key={classification.level}>
                                                <Td>
                                                    <HStack spacing={2}>
                                                        <Text fontWeight="medium">{classification.name}</Text>
                                                        <Badge colorScheme={getClassificationColor(classification.level)} size="sm">
                                                            {classification.level.toUpperCase()}
                                                        </Badge>
                                                    </HStack>
                                                </Td>
                                                <Td>
                                                    <Text fontSize="sm" color="gray.600">
                                                        {classification.description}
                                                    </Text>
                                                </Td>
                                                <Td>
                                                    {classification.encryptionRequired ? (
                                                        <CheckIcon color="green.500" />
                                                    ) : (
                                                        <CloseIcon color="red.500" />
                                                    )}
                                                </Td>
                                                <Td>
                                                    <Text fontSize="sm">
                                                        {classification.retentionDays}일
                                                    </Text>
                                                </Td>
                                                <Td>
                                                    <Text fontSize="sm">
                                                        Level {classification.accessLevel}
                                                    </Text>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </TabPanel>

                    {/* 접근 로그 탭 */}
                    <TabPanel p={0}>
                        <Card>
                            <CardHeader>
                                <Text fontSize="lg" fontWeight="bold">접근 로그</Text>
                            </CardHeader>
                            <CardBody>
                                <Table>
                                    <Thead>
                                        <Tr>
                                            <Th>시간</Th>
                                            <Th>사용자</Th>
                                            <Th>액션</Th>
                                            <Th>분류</Th>
                                            <Th>데이터 ID</Th>
                                            <Th>IP 주소</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {accessLogs.map(log => (
                                            <Tr key={log.id}>
                                                <Td>
                                                    {new Date(log.timestamp).toLocaleString('ko-KR')}
                                                </Td>
                                                <Td>
                                                    <Text fontSize="sm">{log.userId}</Text>
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme={getActionColor(log.action)} size="sm">
                                                        {log.action.toUpperCase()}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme={getClassificationColor(log.classification)} size="sm">
                                                        {log.classification.toUpperCase()}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <Text fontSize="sm">{log.dataId}</Text>
                                                </Td>
                                                <Td>
                                                    <Text fontSize="sm">{log.ipAddress}</Text>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </TabPanel>

                    {/* 개인정보 보호 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">개인정보 보호 통계</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <Box textAlign="center">
                                            <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                                                {privacyStats?.totalConsents || 0}
                                            </Text>
                                            <Text fontSize="sm" color="gray.600">총 동의 기록</Text>
                                        </Box>

                                        <Box textAlign="center">
                                            <Text fontSize="2xl" fontWeight="bold" color="green.500">
                                                {privacyStats?.activeConsents || 0}
                                            </Text>
                                            <Text fontSize="sm" color="gray.600">활성 동의</Text>
                                        </Box>

                                        <Box textAlign="center">
                                            <Text fontSize="2xl" fontWeight="bold" color="red.500">
                                                {privacyStats?.totalBreaches || 0}
                                            </Text>
                                            <Text fontSize="sm" color="gray.600">데이터 유출 신고</Text>
                                        </Box>

                                        <Box textAlign="center">
                                            <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                                                {privacyStats?.gdprRights || 0}
                                            </Text>
                                            <Text fontSize="sm" color="gray.600">GDPR 권리</Text>
                                        </Box>
                                    </VStack>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">GDPR 권리</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={3} align="stretch">
                                        <Box p={3} bg="blue.50" borderRadius="md">
                                            <Text fontWeight="medium" fontSize="sm">접근권</Text>
                                            <Text fontSize="xs" color="gray.600">개인정보 처리 현황에 대한 정보 제공</Text>
                                        </Box>

                                        <Box p={3} bg="green.50" borderRadius="md">
                                            <Text fontWeight="medium" fontSize="sm">정정권</Text>
                                            <Text fontSize="xs" color="gray.600">부정확한 개인정보의 정정</Text>
                                        </Box>

                                        <Box p={3} bg="red.50" borderRadius="md">
                                            <Text fontWeight="medium" fontSize="sm">삭제권</Text>
                                            <Text fontSize="xs" color="gray.600">개인정보의 삭제 (잊혀질 권리)</Text>
                                        </Box>

                                        <Box p={3} bg="purple.50" borderRadius="md">
                                            <Text fontWeight="medium" fontSize="sm">이전권</Text>
                                            <Text fontSize="xs" color="gray.600">개인정보의 이전</Text>
                                        </Box>

                                        <Box p={3} bg="orange.50" borderRadius="md">
                                            <Text fontWeight="medium" fontSize="sm">이의제기권</Text>
                                            <Text fontSize="xs" color="gray.600">개인정보 처리에 대한 이의제기</Text>
                                        </Box>

                                        <Box p={3} bg="yellow.50" borderRadius="md">
                                            <Text fontWeight="medium" fontSize="sm">제한권</Text>
                                            <Text fontSize="xs" color="gray.600">개인정보 처리의 제한</Text>
                                        </Box>
                                    </VStack>
                                </CardBody>
                            </Card>
                        </SimpleGrid>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            {/* 데이터 암호화 모달 */}
            <Modal isOpen={isEncryptModalOpen} onClose={onEncryptModalClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>데이터 암호화</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <FormControl>
                                <FormLabel>데이터</FormLabel>
                                <Textarea
                                    value={encryptData.data || ''}
                                    onChange={(e) => setEncryptData(prev => ({ ...prev, data: e.target.value }))}
                                    placeholder="암호화할 데이터를 입력하세요 (JSON 형식)"
                                    rows={6}
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>데이터 분류</FormLabel>
                                <Select
                                    value={encryptData.classification || 'internal'}
                                    onChange={(e) => setEncryptData(prev => ({ ...prev, classification: e.target.value }))}
                                >
                                    {classifications.map(classification => (
                                        <option key={classification.level} value={classification.level}>
                                            {classification.name} ({classification.level})
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            <HStack spacing={2}>
                                <Button colorScheme="green" flex="1" onClick={encryptData}>
                                    암호화 실행
                                </Button>
                                <Button variant="outline" flex="1" onClick={onEncryptModalClose}>
                                    취소
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 데이터 복호화 모달 */}
            <Modal isOpen={isDecryptModalOpen} onClose={onDecryptModalClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>데이터 복호화</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <FormControl>
                                <FormLabel>암호화된 데이터</FormLabel>
                                <Textarea
                                    value={decryptData.encryptedData || ''}
                                    onChange={(e) => setDecryptData(prev => ({ ...prev, encryptedData: e.target.value }))}
                                    placeholder="복호화할 암호화된 데이터를 입력하세요 (JSON 형식)"
                                    rows={6}
                                />
                            </FormControl>

                            <HStack spacing={2}>
                                <Button colorScheme="blue" flex="1" onClick={decryptData}>
                                    복호화 실행
                                </Button>
                                <Button variant="outline" flex="1" onClick={onDecryptModalClose}>
                                    취소
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* PII 감지 모달 */}
            <Modal isOpen={isPIIModalOpen} onClose={onPIIModalClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>PII 데이터 감지</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <FormControl>
                                <FormLabel>분석할 데이터</FormLabel>
                                <Textarea
                                    value={piiData.data || ''}
                                    onChange={(e) => setPiiData(prev => ({ ...prev, data: e.target.value }))}
                                    placeholder="PII 감지를 위한 데이터를 입력하세요"
                                    rows={6}
                                />
                            </FormControl>

                            <HStack spacing={2}>
                                <Button colorScheme="purple" flex="1" onClick={detectPII}>
                                    PII 감지 실행
                                </Button>
                                <Button variant="outline" flex="1" onClick={onPIIModalClose}>
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

export default EncryptionDashboard;

