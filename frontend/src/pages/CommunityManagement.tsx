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
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
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

interface Community {
    id: string;
    name: string;
    description: string;
    type: string;
    parentId?: string;
    level: number;
    path: string;
    category: string;
    tags: string[];
    status: string;
    visibility: string;
    membership: {
        totalMembers: number;
        activeMembers: number;
        moderators: string[];
        admins: string[];
    };
    statistics: {
        totalPosts: number;
        totalComments: number;
        totalViews: number;
        dailyActiveUsers: number;
        weeklyActiveUsers: number;
        monthlyActiveUsers: number;
        growthRate: number;
        engagementScore: number;
    };
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    lastActivity: string;
}

interface CommunityStats {
    totalCommunities: number;
    activeCommunities: number;
    totalMembers: number;
    totalPosts: number;
    totalComments: number;
    totalViews: number;
    averageEngagement: number;
    topCommunities: Community[];
    recentActivity: any[];
}

const CommunityManagement: React.FC = () => {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [stats, setStats] = useState<CommunityStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
    const [filters, setFilters] = useState({
        type: '',
        category: '',
        status: 'active',
        search: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
    });

    const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
    const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    const { isOpen: isStatsOpen, onOpen: onStatsOpen, onClose: onStatsClose } = useDisclosure();
    const { isOpen: isHierarchyOpen, onOpen: onHierarchyOpen, onClose: onHierarchyClose } = useDisclosure();

    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // 커뮤니티 목록 조회
    const fetchCommunities = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...filters
            });

            const response = await fetch(`/api/community-management?${params}`);
            const data = await response.json();

            if (data.success) {
                setCommunities(data.data.communities);
                setPagination(data.data.pagination);
            }
        } catch (error) {
            console.error('커뮤니티 목록 조회 오류:', error);
            toast({
                title: '오류 발생',
                description: '커뮤니티 목록을 불러오는데 실패했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        } finally {
            setLoading(false);
        }
    };

    // 통계 조회
    const fetchStats = async () => {
        try {
            const response = await fetch('/api/community-management/stats/overview');
            const data = await response.json();

            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('통계 조회 오류:', error);
        }
    };

    // 커뮤니티 상태 변경
    const changeCommunityStatus = async (id: string, status: string) => {
        try {
            const response = await fetch(`/api/community-management/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status })
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: '상태 변경 완료',
                    description: `커뮤니티 상태가 ${status}로 변경되었습니다.`,
                    status: 'success',
                    duration: 2000,
                    isClosable: true
                });
                fetchCommunities();
            }
        } catch (error) {
            console.error('상태 변경 오류:', error);
            toast({
                title: '오류 발생',
                description: '상태 변경에 실패했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 커뮤니티 삭제
    const deleteCommunity = async (id: string) => {
        try {
            const response = await fetch(`/api/community-management/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: '삭제 완료',
                    description: '커뮤니티가 삭제되었습니다.',
                    status: 'success',
                    duration: 2000,
                    isClosable: true
                });
                fetchCommunities();
                onDeleteClose();
            }
        } catch (error) {
            console.error('삭제 오류:', error);
            toast({
                title: '오류 발생',
                description: '삭제에 실패했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 필터 적용
    const applyFilters = () => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchCommunities();
    };

    // 필터 초기화
    const resetFilters = () => {
        setFilters({
            type: '',
            category: '',
            status: 'active',
            search: ''
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    useEffect(() => {
        fetchCommunities();
        fetchStats();
    }, [pagination.page, pagination.limit]);

    const getTypeColor = (type: string) => {
        const colors = {
            'public': 'green',
            'private': 'blue',
            'secret': 'red',
            'subcommunity': 'purple'
        };
        return colors[type as keyof typeof colors] || 'gray';
    };

    const getStatusColor = (status: string) => {
        const colors = {
            'active': 'green',
            'inactive': 'gray',
            'suspended': 'red',
            'archived': 'blue'
        };
        return colors[status as keyof typeof colors] || 'gray';
    };

    const getCategoryColor = (category: string) => {
        const colors = {
            'general': 'gray',
            'tech': 'blue',
            'gaming': 'purple',
            'business': 'green',
            'education': 'orange'
        };
        return colors[category as keyof typeof colors] || 'gray';
    };

    return (
        <Box p={6}>
            <VStack spacing={6} align="stretch">
                {/* 헤더 */}
                <Flex justify="space-between" align="center">
                    <VStack align="start" spacing={2}>
                        <Heading size="lg">커뮤니티 관리</Heading>
                        <Text color="gray.600">다중 커뮤니티를 생성, 관리, 모니터링하세요</Text>
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
                            onClick={onCreateOpen}
                        >
                            새 커뮤니티
                        </Button>
                    </HStack>
                </Flex>

                {/* 통계 카드 */}
                {stats && (
                    <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4}>
                        <Card>
                            <CardBody>
                                <Stat>
                                    <StatLabel>전체 커뮤니티</StatLabel>
                                    <StatNumber>{stats.totalCommunities}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody>
                                <Stat>
                                    <StatLabel>활성 커뮤니티</StatLabel>
                                    <StatNumber color="green.500">{stats.activeCommunities}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody>
                                <Stat>
                                    <StatLabel>전체 멤버</StatLabel>
                                    <StatNumber>{stats.totalMembers.toLocaleString()}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody>
                                <Stat>
                                    <StatLabel>전체 게시물</StatLabel>
                                    <StatNumber>{stats.totalPosts.toLocaleString()}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody>
                                <Stat>
                                    <StatLabel>전체 댓글</StatLabel>
                                    <StatNumber>{stats.totalComments.toLocaleString()}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody>
                                <Stat>
                                    <StatLabel>평균 참여도</StatLabel>
                                    <StatNumber>{stats.averageEngagement}%</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                    </SimpleGrid>
                )}

                {/* 필터 */}
                <Card>
                    <CardBody>
                        <VStack spacing={4}>
                            <HStack spacing={4} wrap="wrap" width="100%">
                                <FormControl maxW="200px">
                                    <FormLabel>타입</FormLabel>
                                    <Select
                                        value={filters.type}
                                        onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                                    >
                                        <option value="">전체</option>
                                        <option value="public">공개</option>
                                        <option value="private">비공개</option>
                                        <option value="secret">비밀</option>
                                        <option value="subcommunity">서브커뮤니티</option>
                                    </Select>
                                </FormControl>
                                <FormControl maxW="200px">
                                    <FormLabel>카테고리</FormLabel>
                                    <Select
                                        value={filters.category}
                                        onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                                    >
                                        <option value="">전체</option>
                                        <option value="general">일반</option>
                                        <option value="tech">기술</option>
                                        <option value="gaming">게임</option>
                                        <option value="business">비즈니스</option>
                                        <option value="education">교육</option>
                                    </Select>
                                </FormControl>
                                <FormControl maxW="200px">
                                    <FormLabel>상태</FormLabel>
                                    <Select
                                        value={filters.status}
                                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                    >
                                        <option value="active">활성</option>
                                        <option value="inactive">비활성</option>
                                        <option value="suspended">정지</option>
                                        <option value="archived">보관</option>
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
                                            placeholder="커뮤니티 이름, 설명, 태그로 검색..."
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

                {/* 커뮤니티 목록 */}
                <Card>
                    <CardHeader>
                        <Flex justify="space-between" align="center">
                            <Text fontSize="lg" fontWeight="bold">
                                커뮤니티 목록 ({pagination.total}개)
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
                                    <Skeleton key={i} height="80px" />
                                ))}
                            </VStack>
                        ) : (
                            <Table variant="simple">
                                <Thead>
                                    <Tr>
                                        <Th>커뮤니티</Th>
                                        <Th>타입</Th>
                                        <Th>카테고리</Th>
                                        <Th>상태</Th>
                                        <Th>멤버</Th>
                                        <Th>활동</Th>
                                        <Th>생성일</Th>
                                        <Th>액션</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {communities.map((community) => (
                                        <Tr key={community.id}>
                                            <Td>
                                                <VStack align="start" spacing={1}>
                                                    <Text fontWeight="bold" noOfLines={1}>
                                                        {community.name}
                                                    </Text>
                                                    <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                                        {community.description}
                                                    </Text>
                                                    <HStack spacing={1}>
                                                        {community.tags.slice(0, 3).map((tag, index) => (
                                                            <Tag key={index} size="sm">
                                                                <TagLabel>{tag}</TagLabel>
                                                            </Tag>
                                                        ))}
                                                        {community.tags.length > 3 && (
                                                            <Text fontSize="xs" color="gray.500">
                                                                +{community.tags.length - 3}
                                                            </Text>
                                                        )}
                                                    </HStack>
                                                    {community.level > 0 && (
                                                        <Badge colorScheme="purple" size="sm">
                                                            Lv.{community.level}
                                                        </Badge>
                                                    )}
                                                </VStack>
                                            </Td>
                                            <Td>
                                                <Badge colorScheme={getTypeColor(community.type)}>
                                                    {community.type}
                                                </Badge>
                                            </Td>
                                            <Td>
                                                <Badge colorScheme={getCategoryColor(community.category)}>
                                                    {community.category}
                                                </Badge>
                                            </Td>
                                            <Td>
                                                <Badge colorScheme={getStatusColor(community.status)}>
                                                    {community.status}
                                                </Badge>
                                            </Td>
                                            <Td>
                                                <VStack spacing={1} align="start">
                                                    <Text fontSize="sm">
                                                        {community.membership.totalMembers.toLocaleString()}
                                                    </Text>
                                                    <Text fontSize="xs" color="gray.500">
                                                        활성: {community.membership.activeMembers}
                                                    </Text>
                                                </VStack>
                                            </Td>
                                            <Td>
                                                <VStack spacing={1} align="start">
                                                    <Text fontSize="sm">
                                                        게시물: {community.statistics.totalPosts}
                                                    </Text>
                                                    <Text fontSize="sm">
                                                        댓글: {community.statistics.totalComments}
                                                    </Text>
                                                    <Text fontSize="xs" color="gray.500">
                                                        참여도: {community.statistics.engagementScore}%
                                                    </Text>
                                                </VStack>
                                            </Td>
                                            <Td>
                                                <Text fontSize="sm">
                                                    {new Date(community.createdAt).toLocaleDateString()}
                                                </Text>
                                            </Td>
                                            <Td>
                                                <HStack spacing={1}>
                                                    <Menu>
                                                        <MenuButton as={IconButton} icon={<SettingsIcon />} size="sm" />
                                                        <MenuList>
                                                            <MenuItem onClick={() => setSelectedCommunity(community)}>
                                                                <ViewIcon mr={2} />
                                                                보기
                                                            </MenuItem>
                                                            <MenuItem onClick={() => {
                                                                setSelectedCommunity(community);
                                                                onEditOpen();
                                                            }}>
                                                                <EditIcon mr={2} />
                                                                수정
                                                            </MenuItem>
                                                            <MenuItem onClick={() => onHierarchyOpen()}>
                                                                계층 구조
                                                            </MenuItem>
                                                            <MenuItem onClick={() => changeCommunityStatus(community.id, 'active')}>
                                                                활성화
                                                            </MenuItem>
                                                            <MenuItem onClick={() => changeCommunityStatus(community.id, 'suspended')}>
                                                                정지
                                                            </MenuItem>
                                                            <MenuItem onClick={() => {
                                                                setSelectedCommunity(community);
                                                                onDeleteOpen();
                                                            }}>
                                                                <DeleteIcon mr={2} />
                                                                삭제
                                                            </MenuItem>
                                                        </MenuList>
                                                    </Menu>
                                                </HStack>
                                            </Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
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

            {/* 삭제 확인 다이얼로그 */}
            <AlertDialog isOpen={isDeleteOpen} onClose={onDeleteClose}>
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader>커뮤니티 삭제</AlertDialogHeader>
                        <AlertDialogCloseButton />
                        <AlertDialogBody>
                            정말로 이 커뮤니티를 삭제하시겠습니까?
                            <br />
                            <Text fontWeight="bold">{selectedCommunity?.name}</Text>
                            <br />
                            <Text fontSize="sm" color="red.500">
                                이 작업은 되돌릴 수 없습니다.
                            </Text>
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button onClick={onDeleteClose}>취소</Button>
                            <Button colorScheme="red" onClick={() => selectedCommunity && deleteCommunity(selectedCommunity.id)}>
                                삭제
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Box>
    );
};

export default CommunityManagement;
