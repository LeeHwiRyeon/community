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
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    IconButton,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    FormControl,
    FormLabel,
    Input,
    Select,
    Textarea,
    Switch,
    Divider,
    Flex,
    Spacer,
    Wrap,
    WrapItem,
    Tag,
    TagLabel,
    TagCloseButton,
    useColorModeValue,
    Alert,
    AlertIcon,
    Progress,
    CircularProgress,
    CircularProgressLabel,
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
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    SimpleGrid,
    Grid,
    GridItem,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    DrawerFooter,
    ButtonGroup,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverArrow,
    PopoverCloseButton,
    PopoverHeader,
    PopoverBody,
    Tooltip,
    Avatar,
    AvatarGroup,
    Image,
    Link,
    Code,
    Kbd,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    AlertDialogCloseButton,
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
    RangeSliderThumb,
    Checkbox,
    CheckboxGroup,
    Radio,
    RadioGroup,
    Stack,
    Container,
    Heading,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    Spinner,
    Skeleton,
    SkeletonText,
    SkeletonCircle,
    SkeletonBox,
    AspectRatio,
    Center,
    Square,
    Circle,
    Triangle,
    Polygon,
    Star,
    Heart,
    Diamond,
    Hexagon,
    Octagon,
    Pentagon,
    Trapezoid,
    Parallelogram,
    Rhombus,
    Kite,
    Arrow,
    ArrowUpIcon,
    ArrowDownIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronIcon,
    TriangleUpIcon,
    TriangleDownIcon,
    TriangleLeftIcon,
    TriangleRightIcon,
    TriangleIcon,
    PlusIcon,
    MinusIcon,
    CloseIcon,
    CheckIcon,
    InfoIcon,
    WarningIcon,
    QuestionIcon,
    SearchIcon,
    EditIcon,
    DeleteIcon,
    ViewIcon,
    ViewOffIcon,
    AddIcon,
    SettingsIcon,
    HamburgerIcon,
    BellIcon,
    EmailIcon,
    PhoneIcon,
    CalendarIcon,
    TimeIcon,
    LocationIcon,
    LinkIcon,
    ExternalLinkIcon,
    DownloadIcon,
    UploadIcon,
    CopyIcon,
    AttachmentIcon,
    StarIcon,
    AtSignIcon,
    LockIcon,
    UnlockIcon,
    RepeatIcon,
    RepeatClockIcon,
    MagicIcon,
    SparklesIcon,
    WandIcon,
    BrainIcon,
    LightbulbIcon,
    BulbIcon,
    IdeaIcon,
    InnovationIcon,
    CreativeIcon,
    ArtIcon,
    DesignIcon,
    PaintIcon,
    BrushIcon,
    PaletteIcon,
    ColorIcon,
    ImageIcon,
    PhotoIcon,
    CameraIcon,
    VideoIcon,
    FilmIcon,
    MusicIcon,
    SoundIcon,
    VolumeIcon,
    PlayIcon,
    PauseIcon,
    StopIcon,
    RecordIcon,
    MicrophoneIcon,
    SpeakerIcon,
    HeadphonesIcon,
    RadioIcon,
    TvIcon,
    MonitorIcon,
    LaptopIcon,
    ComputerIcon,
    DesktopIcon,
    MobileIcon,
    TabletIcon,
    PhoneIcon as Phone,
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
    ShareIcon,
    LinkIcon as Link,
    CopyIcon as Copy,
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
    StarIcon as Star,
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
    SortIcon,
    UnsortIcon,
    FilterIcon,
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
} from '@chakra-ui/react';

interface Release {
    id: string;
    version: string;
    versionType: string;
    title: string;
    description: string;
    releaseNotes: string;
    changelog: Array<{
        type: string;
        description: string;
        category: string;
        priority: string;
    }>;
    files: Array<{
        name: string;
        url: string;
        size: number;
        checksum: string;
        platform: string;
        architecture: string;
        fileType: string;
        downloadCount: number;
        uploadedAt: Date;
    }>;
    status: string;
    releaseDate: Date;
    endOfLife: Date;
    isPrerelease: boolean;
    isDraft: boolean;
    isLatest: boolean;
    isStable: boolean;
    downloadCount: number;
    installCount: number;
    rating: number;
    reviews: Array<{
        userId: string;
        userName: string;
        rating: number;
        comment: string;
        createdAt: Date;
        isVerified: boolean;
    }>;
    dependencies: {
        minOSVersion: string;
        minRAM: number;
        minStorage: number;
        requiredSoftware: string[];
        optionalSoftware: string[];
    };
    security: {
        isSigned: boolean;
        signature: string;
        vulnerabilityScan: {
            status: string;
            lastScan: Date;
            issues: string[];
        };
    };
    deployment: {
        environments: string[];
        regions: string[];
        rolloutPercentage: number;
        autoDeploy: boolean;
        rollbackVersion: string;
    };
    metrics: {
        downloads: {
            total: number;
            daily: number;
            weekly: number;
            monthly: number;
            byPlatform: Record<string, number>;
            byRegion: Record<string, number>;
        };
        installations: {
            total: number;
            successful: number;
            failed: number;
            byPlatform: Record<string, number>;
        };
        feedback: {
            bugReports: number;
            featureRequests: number;
            supportTickets: number;
        };
    };
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    publishedBy: string;
    publishedAt: Date;
}

const ReleaseSite: React.FC = () => {
    const [releases, setReleases] = useState<Release[]>([]);
    const [latestRelease, setLatestRelease] = useState<Release | null>(null);
    const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        platform: '',
        versionType: '',
        status: 'released',
        search: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
    });

    const { isOpen: isReleaseOpen, onOpen: onReleaseOpen, onClose: onReleaseClose } = useDisclosure();
    const { isOpen: isReviewOpen, onOpen: onReviewOpen, onClose: onReviewClose } = useDisclosure();
    const { isOpen: isStatsOpen, onOpen: onStatsOpen, onClose: onStatsClose } = useDisclosure();

    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // 릴리즈 목록 조회
    const fetchReleases = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...filters
            });

            const response = await fetch(`/api/release-site?${params}`);
            const data = await response.json();

            if (data.success) {
                setReleases(data.data.releases);
                setPagination(data.data.pagination);
            }
        } catch (error) {
            console.error('릴리즈 목록 조회 오류:', error);
            toast({
                title: '오류 발생',
                description: '릴리즈 목록을 불러오는데 실패했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        } finally {
            setLoading(false);
        }
    };

    // 최신 릴리즈 조회
    const fetchLatestRelease = async () => {
        try {
            const response = await fetch('/api/release-site/latest');
            const data = await response.json();

            if (data.success) {
                setLatestRelease(data.data);
            }
        } catch (error) {
            console.error('최신 릴리즈 조회 오류:', error);
        }
    };

    // 파일 다운로드
    const downloadFile = async (releaseId: string, fileName: string) => {
        try {
            const response = await fetch(`/api/release-site/${releaseId}/download/${fileName}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                toast({
                    title: '다운로드 시작',
                    description: `${fileName} 다운로드가 시작되었습니다.`,
                    status: 'success',
                    duration: 2000,
                    isClosable: true
                });
            }
        } catch (error) {
            console.error('파일 다운로드 오류:', error);
            toast({
                title: '다운로드 실패',
                description: '파일 다운로드에 실패했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 필터 적용
    const applyFilters = () => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchReleases();
    };

    // 필터 초기화
    const resetFilters = () => {
        setFilters({
            platform: '',
            versionType: '',
            status: 'released',
            search: ''
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    useEffect(() => {
        fetchReleases();
        fetchLatestRelease();
    }, [pagination.page, pagination.limit]);

    const getVersionTypeColor = (type: string) => {
        const colors = {
            'major': 'red',
            'minor': 'blue',
            'patch': 'green',
            'beta': 'orange',
            'alpha': 'purple',
            'rc': 'yellow'
        };
        return colors[type as keyof typeof colors] || 'gray';
    };

    const getStatusColor = (status: string) => {
        const colors = {
            'draft': 'gray',
            'staging': 'yellow',
            'released': 'green',
            'deprecated': 'red',
            'cancelled': 'red'
        };
        return colors[status as keyof typeof colors] || 'gray';
    };

    const getPlatformIcon = (platform: string) => {
        const icons = {
            'windows': '🪟',
            'macos': '🍎',
            'linux': '🐧',
            'android': '🤖',
            'ios': '📱',
            'web': '🌐'
        };
        return icons[platform as keyof typeof icons] || '💻';
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Box p={6}>
            <VStack spacing={6} align="stretch">
                {/* 헤더 */}
                <Flex justify="space-between" align="center">
                    <VStack align="start" spacing={2}>
                        <Heading size="lg">릴리즈 사이트</Heading>
                        <Text color="gray.600">소프트웨어 다운로드 및 릴리즈 노트</Text>
                    </VStack>
                    <HStack spacing={3}>
                        <Button
                            leftIcon={<SettingsIcon />}
                            variant="outline"
                            onClick={onStatsOpen}
                        >
                            통계
                        </Button>
                        <Button
                            leftIcon={<AddIcon />}
                            colorScheme="blue"
                            onClick={onReleaseOpen}
                        >
                            새 릴리즈
                        </Button>
                    </HStack>
                </Flex>

                {/* 최신 릴리즈 */}
                {latestRelease && (
                    <Card>
                        <CardHeader>
                            <HStack justify="space-between">
                                <VStack align="start" spacing={1}>
                                    <HStack spacing={2}>
                                        <Text fontSize="lg" fontWeight="bold">
                                            최신 릴리즈
                                        </Text>
                                        <Badge colorScheme={getVersionTypeColor(latestRelease.versionType)}>
                                            {latestRelease.version}
                                        </Badge>
                                        {latestRelease.isLatest && (
                                            <Badge colorScheme="green">최신</Badge>
                                        )}
                                        {latestRelease.isStable && (
                                            <Badge colorScheme="blue">안정</Badge>
                                        )}
                                    </HStack>
                                    <Text color="gray.600">
                                        {latestRelease.title}
                                    </Text>
                                </VStack>
                                <Button
                                    colorScheme="green"
                                    leftIcon={<DownloadIcon />}
                                    onClick={() => setSelectedRelease(latestRelease)}
                                >
                                    다운로드
                                </Button>
                            </HStack>
                        </CardHeader>
                        <CardBody>
                            <Text mb={4}>{latestRelease.description}</Text>
                            <HStack spacing={4}>
                                <Text fontSize="sm" color="gray.600">
                                    다운로드: {latestRelease.downloadCount.toLocaleString()}
                                </Text>
                                <Text fontSize="sm" color="gray.600">
                                    평점: {latestRelease.rating.toFixed(1)}/5
                                </Text>
                                <Text fontSize="sm" color="gray.600">
                                    릴리즈: {new Date(latestRelease.releaseDate).toLocaleDateString()}
                                </Text>
                            </HStack>
                        </CardBody>
                    </Card>
                )}

                {/* 필터 */}
                <Card>
                    <CardBody>
                        <VStack spacing={4}>
                            <HStack spacing={4} wrap="wrap" width="100%">
                                <FormControl maxW="200px">
                                    <FormLabel>플랫폼</FormLabel>
                                    <Select
                                        value={filters.platform}
                                        onChange={(e) => setFilters(prev => ({ ...prev, platform: e.target.value }))}
                                    >
                                        <option value="">전체</option>
                                        <option value="windows">Windows</option>
                                        <option value="macos">macOS</option>
                                        <option value="linux">Linux</option>
                                        <option value="android">Android</option>
                                        <option value="ios">iOS</option>
                                        <option value="web">Web</option>
                                    </Select>
                                </FormControl>
                                <FormControl maxW="200px">
                                    <FormLabel>버전 타입</FormLabel>
                                    <Select
                                        value={filters.versionType}
                                        onChange={(e) => setFilters(prev => ({ ...prev, versionType: e.target.value }))}
                                    >
                                        <option value="">전체</option>
                                        <option value="major">Major</option>
                                        <option value="minor">Minor</option>
                                        <option value="patch">Patch</option>
                                        <option value="beta">Beta</option>
                                        <option value="alpha">Alpha</option>
                                        <option value="rc">Release Candidate</option>
                                    </Select>
                                </FormControl>
                                <FormControl maxW="200px">
                                    <FormLabel>상태</FormLabel>
                                    <Select
                                        value={filters.status}
                                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                    >
                                        <option value="released">발행됨</option>
                                        <option value="staging">스테이징</option>
                                        <option value="draft">초안</option>
                                        <option value="deprecated">사용 중단</option>
                                    </Select>
                                </FormControl>
                                <FormControl flex="1" minW="300px">
                                    <FormLabel>검색</FormLabel>
                                    <InputGroup>
                                        <InputLeftElement>
                                            <SearchIcon />
                                        </InputLeftElement>
                                        <Input
                                            value={filters.search}
                                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                            placeholder="버전, 제목, 설명으로 검색..."
                                        />
                                    </InputGroup>
                                </FormControl>
                            </HStack>
                            <HStack spacing={2}>
                                <Button colorScheme="blue" onClick={applyFilters}>
                                    필터 적용
                                </Button>
                                <Button variant="outline" onClick={resetFilters}>
                                    초기화
                                </Button>
                            </HStack>
                        </VStack>
                    </CardBody>
                </Card>

                {/* 릴리즈 목록 */}
                <Card>
                    <CardHeader>
                        <Flex justify="space-between" align="center">
                            <Text fontSize="lg" fontWeight="bold">
                                릴리즈 목록 ({pagination.total}개)
                            </Text>
                            <HStack spacing={2}>
                                <Text fontSize="sm" color="gray.600">
                                    {pagination.page} / {pagination.pages} 페이지
                                </Text>
                            </HStack>
                        </Flex>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <VStack spacing={4}>
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} height="100px" />
                                ))}
                            </VStack>
                        ) : (
                            <VStack spacing={4} align="stretch">
                                {releases.map((release) => (
                                    <Card key={release.id} variant="outline">
                                        <CardBody>
                                            <VStack spacing={4} align="stretch">
                                                <HStack justify="space-between">
                                                    <VStack align="start" spacing={1}>
                                                        <HStack spacing={2}>
                                                            <Text fontSize="lg" fontWeight="bold">
                                                                {release.title}
                                                            </Text>
                                                            <Badge colorScheme={getVersionTypeColor(release.versionType)}>
                                                                {release.version}
                                                            </Badge>
                                                            <Badge colorScheme={getStatusColor(release.status)}>
                                                                {release.status}
                                                            </Badge>
                                                            {release.isLatest && (
                                                                <Badge colorScheme="green">최신</Badge>
                                                            )}
                                                            {release.isStable && (
                                                                <Badge colorScheme="blue">안정</Badge>
                                                            )}
                                                            {release.isPrerelease && (
                                                                <Badge colorScheme="orange">사전 릴리즈</Badge>
                                                            )}
                                                        </HStack>
                                                        <Text color="gray.600" noOfLines={2}>
                                                            {release.description}
                                                        </Text>
                                                    </VStack>
                                                    <VStack spacing={2}>
                                                        <Button
                                                            colorScheme="blue"
                                                            leftIcon={<DownloadIcon />}
                                                            onClick={() => setSelectedRelease(release)}
                                                        >
                                                            다운로드
                                                        </Button>
                                                        <HStack spacing={4}>
                                                            <Text fontSize="sm" color="gray.600">
                                                                다운로드: {release.downloadCount.toLocaleString()}
                                                            </Text>
                                                            <Text fontSize="sm" color="gray.600">
                                                                평점: {release.rating.toFixed(1)}/5
                                                            </Text>
                                                        </HStack>
                                                    </VStack>
                                                </HStack>

                                                {/* 파일 목록 */}
                                                <Box>
                                                    <Text fontSize="sm" fontWeight="bold" mb={2}>
                                                        다운로드 파일
                                                    </Text>
                                                    <HStack spacing={2} wrap="wrap">
                                                        {release.files.map((file, index) => (
                                                            <Button
                                                                key={index}
                                                                size="sm"
                                                                variant="outline"
                                                                leftIcon={<DownloadIcon />}
                                                                onClick={() => downloadFile(release.id, file.name)}
                                                            >
                                                                <HStack spacing={1}>
                                                                    <Text>{getPlatformIcon(file.platform)}</Text>
                                                                    <Text>{file.platform}</Text>
                                                                    <Text fontSize="xs" color="gray.500">
                                                                        {formatFileSize(file.size)}
                                                                    </Text>
                                                                </HStack>
                                                            </Button>
                                                        ))}
                                                    </HStack>
                                                </Box>

                                                {/* 릴리즈 정보 */}
                                                <HStack spacing={4} fontSize="sm" color="gray.600">
                                                    <Text>
                                                        릴리즈: {new Date(release.releaseDate).toLocaleDateString()}
                                                    </Text>
                                                    <Text>
                                                        생성: {new Date(release.createdAt).toLocaleDateString()}
                                                    </Text>
                                                    {release.security.isSigned && (
                                                        <HStack spacing={1}>
                                                            <CheckIcon color="green.500" />
                                                            <Text color="green.500">서명됨</Text>
                                                        </HStack>
                                                    )}
                                                </HStack>
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                ))}
                            </VStack>
                        )}

                        {/* 페이지네이션 */}
                        {pagination.pages > 1 && (
                            <HStack justify="center" mt={4}>
                                <Button
                                    size="sm"
                                    isDisabled={pagination.page === 1}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                >
                                    이전
                                </Button>
                                <Text>
                                    {pagination.page} / {pagination.pages}
                                </Text>
                                <Button
                                    size="sm"
                                    isDisabled={pagination.page === pagination.pages}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                >
                                    다음
                                </Button>
                            </HStack>
                        )}
                    </CardBody>
                </Card>
            </VStack>

            {/* 릴리즈 상세 모달 */}
            <Modal isOpen={isReleaseOpen} onClose={onReleaseClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>새 릴리즈</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text>릴리즈 생성 기능은 곧 추가될 예정입니다.</Text>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 리뷰 모달 */}
            <Modal isOpen={isReviewOpen} onClose={onReviewClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>리뷰 작성</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text>리뷰 작성 기능은 곧 추가될 예정입니다.</Text>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 통계 모달 */}
            <Modal isOpen={isStatsOpen} onClose={onStatsClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>릴리즈 통계</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text>통계 기능은 곧 추가될 예정입니다.</Text>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default ReleaseSite;
