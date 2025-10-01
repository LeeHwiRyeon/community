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
    ShieldIcon,
    UserIcon,
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

interface User {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    twoFactorEnabled: boolean;
    emailVerified: boolean;
    isActive: boolean;
    createdAt: string;
    lastLoginAt: string | null;
    failedLoginAttempts: number;
    lockedUntil: string | null;
}

interface Role {
    id: string;
    name: string;
    description: string;
    level: number;
    permissions: string[];
    isSystem: boolean;
    createdAt: string;
}

interface Permission {
    id: string;
    name: string;
    category: string;
}

interface AuditLog {
    id: string;
    action: string;
    userId: string;
    details: any;
    timestamp: string;
    ipAddress: string | null;
    userAgent: string | null;
}

interface SecurityStats {
    totalUsers: number;
    activeUsers: number;
    twoFactorUsers: number;
    lockedUsers: number;
    totalSessions: number;
    activeSessions: number;
    twoFactorRate: number;
    lockoutRate: number;
}

const AdvancedAuthDashboard: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [stats, setStats] = useState<SecurityStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState(0);

    const { isOpen: isUserModalOpen, onOpen: onUserModalOpen, onClose: onUserModalClose } = useDisclosure();
    const { isOpen: isRoleModalOpen, onOpen: onRoleModalOpen, onClose: onRoleModalClose } = useDisclosure();
    const { isOpen: isPermissionModalOpen, onOpen: onPermissionModalOpen, onClose: onPermissionModalClose } = useDisclosure();

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<any>({});
    const [roleData, setRoleData] = useState<any>({});
    const [permissionData, setPermissionData] = useState<any>({});

    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // 데이터 로드
    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // 사용자 목록 로드
            const usersResponse = await fetch('/api/advanced-auth/users');
            const usersData = await usersResponse.json();
            if (usersData.success) {
                setUsers(usersData.data);
            }

            // 역할 목록 로드
            const rolesResponse = await fetch('/api/advanced-auth/roles');
            const rolesData = await rolesResponse.json();
            if (rolesData.success) {
                setRoles(rolesData.data);
            }

            // 권한 목록 로드
            const permissionsResponse = await fetch('/api/advanced-auth/permissions');
            const permissionsData = await permissionsResponse.json();
            if (permissionsData.success) {
                setPermissions(permissionsData.data);
            }

            // 감사 로그 로드
            const auditLogsResponse = await fetch('/api/advanced-auth/audit-logs?limit=50');
            const auditLogsData = await auditLogsResponse.json();
            if (auditLogsData.success) {
                setAuditLogs(auditLogsData.data);
            }

            // 보안 통계 로드
            const statsResponse = await fetch('/api/advanced-auth/security-stats');
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

    // 사용자 역할 변경
    const changeUserRole = async (userId: string, newRole: string) => {
        try {
            const response = await fetch('/api/advanced-auth/change-role', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    newRole,
                    changedBy: 'current_user' // 실제로는 현재 사용자 ID
                })
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: '역할 변경 완료',
                    description: '사용자 역할이 성공적으로 변경되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                fetchData(); // 데이터 새로고침
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error changing user role:', error);
            toast({
                title: '역할 변경 실패',
                description: error.message || '역할 변경 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 계정 잠금 해제
    const unlockAccount = async (userId: string) => {
        try {
            const response = await fetch('/api/advanced-auth/unlock-account', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId })
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: '계정 잠금 해제 완료',
                    description: '계정이 성공적으로 잠금 해제되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                fetchData(); // 데이터 새로고침
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error unlocking account:', error);
            toast({
                title: '계정 잠금 해제 실패',
                description: error.message || '계정 잠금 해제 중 오류가 발생했습니다.',
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

    // 역할 레벨 색상
    const getRoleLevelColor = (level: number) => {
        if (level >= 100) return 'red';
        if (level >= 90) return 'orange';
        if (level >= 70) return 'yellow';
        if (level >= 50) return 'blue';
        if (level >= 30) return 'green';
        return 'gray';
    };

    // 사용자 상태 색상
    const getUserStatusColor = (user: User) => {
        if (!user.isActive) return 'red';
        if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) return 'orange';
        if (!user.emailVerified) return 'yellow';
        return 'green';
    };

    // 사용자 상태 텍스트
    const getUserStatusText = (user: User) => {
        if (!user.isActive) return '비활성';
        if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) return '잠김';
        if (!user.emailVerified) return '미인증';
        return '활성';
    };

    if (isLoading && !users.length) {
        return (
            <Box p={8} textAlign="center">
                <Spinner size="xl" />
                <Text mt={4}>인증 시스템 데이터를 불러오는 중...</Text>
            </Box>
        );
    }

    return (
        <Box p={6}>
            {/* Header */}
            <VStack spacing={4} align="stretch" mb={8}>
                <HStack justify="space-between">
                    <Text fontSize="3xl" fontWeight="bold" color="blue.600">
                        🔐 고급 인증 및 권한 관리
                    </Text>
                    <HStack spacing={2}>
                        <Button leftIcon={<RefreshIcon />} colorScheme="blue" variant="outline" onClick={fetchData}>
                            새로고침
                        </Button>
                        <Button leftIcon={<UserIcon />} colorScheme="blue" onClick={onUserModalOpen}>
                            사용자 추가
                        </Button>
                        <Button leftIcon={<RoleIcon />} colorScheme="blue" variant="outline" onClick={onRoleModalOpen}>
                            역할 관리
                        </Button>
                    </HStack>
                </HStack>

                {/* 보안 통계 카드 */}
                {stats && (
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>총 사용자</StatLabel>
                                    <StatNumber color="blue.500">{stats.totalUsers}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>활성 사용자</StatLabel>
                                    <StatNumber color="green.500">{stats.activeUsers}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>2FA 사용자</StatLabel>
                                    <StatNumber color="purple.500">{stats.twoFactorUsers}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>잠긴 계정</StatLabel>
                                    <StatNumber color="red.500">{stats.lockedUsers}</StatNumber>
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
                    <Tab>사용자 관리</Tab>
                    <Tab>역할 및 권한</Tab>
                    <Tab>감사 로그</Tab>
                    <Tab>보안 설정</Tab>
                </TabList>

                <TabPanels>
                    {/* 사용자 관리 탭 */}
                    <TabPanel p={0}>
                        <Card>
                            <CardHeader>
                                <HStack justify="space-between">
                                    <Text fontSize="lg" fontWeight="bold">사용자 목록</Text>
                                    <Button leftIcon={<UserIcon />} colorScheme="blue" onClick={onUserModalOpen}>
                                        사용자 추가
                                    </Button>
                                </HStack>
                            </CardHeader>
                            <CardBody>
                                <Table>
                                    <Thead>
                                        <Tr>
                                            <Th>사용자</Th>
                                            <Th>역할</Th>
                                            <Th>상태</Th>
                                            <Th>2FA</Th>
                                            <Th>마지막 로그인</Th>
                                            <Th>작업</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {users.map(user => (
                                            <Tr key={user.id}>
                                                <Td>
                                                    <VStack align="start" spacing={1}>
                                                        <Text fontWeight="medium">
                                                            {user.firstName} {user.lastName}
                                                        </Text>
                                                        <Text fontSize="sm" color="gray.600">
                                                            {user.email}
                                                        </Text>
                                                        <Text fontSize="sm" color="gray.500">
                                                            @{user.username}
                                                        </Text>
                                                    </VStack>
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme={getRoleLevelColor(roles.find(r => r.id === user.role)?.level || 0)} size="sm">
                                                        {roles.find(r => r.id === user.role)?.name || user.role}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme={getUserStatusColor(user)} size="sm">
                                                        {getUserStatusText(user)}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    {user.twoFactorEnabled ? (
                                                        <CheckIcon color="green.500" />
                                                    ) : (
                                                        <CloseIcon color="red.500" />
                                                    )}
                                                </Td>
                                                <Td>
                                                    {user.lastLoginAt ?
                                                        new Date(user.lastLoginAt).toLocaleString('ko-KR') :
                                                        '없음'
                                                    }
                                                </Td>
                                                <Td>
                                                    <HStack spacing={2}>
                                                        <Button
                                                            size="sm"
                                                            colorScheme="blue"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                onUserModalOpen();
                                                            }}
                                                        >
                                                            편집
                                                        </Button>
                                                        {user.lockedUntil && new Date(user.lockedUntil) > new Date() && (
                                                            <Button
                                                                size="sm"
                                                                colorScheme="green"
                                                                variant="outline"
                                                                onClick={() => unlockAccount(user.id)}
                                                            >
                                                                잠금 해제
                                                            </Button>
                                                        )}
                                                    </HStack>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </TabPanel>

                    {/* 역할 및 권한 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">역할 목록</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        {roles.map(role => (
                                            <Box key={role.id} p={4} bg="gray.50" borderRadius="md">
                                                <HStack justify="space-between" mb={2}>
                                                    <Text fontWeight="medium">{role.name}</Text>
                                                    <Badge colorScheme={getRoleLevelColor(role.level)} size="sm">
                                                        Level {role.level}
                                                    </Badge>
                                                </HStack>
                                                <Text fontSize="sm" color="gray.600" mb={2}>
                                                    {role.description}
                                                </Text>
                                                <Text fontSize="sm" color="gray.500">
                                                    {role.permissions.length}개 권한
                                                </Text>
                                            </Box>
                                        ))}
                                    </VStack>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">권한 목록</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        {permissions.map(permission => (
                                            <Box key={permission.id} p={3} bg="gray.50" borderRadius="md">
                                                <HStack justify="space-between">
                                                    <Text fontWeight="medium">{permission.name}</Text>
                                                    <Badge colorScheme="blue" size="sm">
                                                        {permission.category}
                                                    </Badge>
                                                </HStack>
                                            </Box>
                                        ))}
                                    </VStack>
                                </CardBody>
                            </Card>
                        </SimpleGrid>
                    </TabPanel>

                    {/* 감사 로그 탭 */}
                    <TabPanel p={0}>
                        <Card>
                            <CardHeader>
                                <Text fontSize="lg" fontWeight="bold">감사 로그</Text>
                            </CardHeader>
                            <CardBody>
                                <Table>
                                    <Thead>
                                        <Tr>
                                            <Th>시간</Th>
                                            <Th>사용자</Th>
                                            <Th>작업</Th>
                                            <Th>IP 주소</Th>
                                            <Th>상세 정보</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {auditLogs.map(log => (
                                            <Tr key={log.id}>
                                                <Td>
                                                    {new Date(log.timestamp).toLocaleString('ko-KR')}
                                                </Td>
                                                <Td>
                                                    <Text fontSize="sm">
                                                        {users.find(u => u.id === log.userId)?.email || log.userId}
                                                    </Text>
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme="blue" size="sm">
                                                        {log.action}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <Text fontSize="sm">{log.ipAddress || '-'}</Text>
                                                </Td>
                                                <Td>
                                                    <Text fontSize="sm" maxW="200px" isTruncated>
                                                        {JSON.stringify(log.details)}
                                                    </Text>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </TabPanel>

                    {/* 보안 설정 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">보안 정책</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <Box>
                                            <Text fontWeight="medium" mb={2}>비밀번호 정책</Text>
                                            <VStack spacing={2} align="stretch">
                                                <HStack justify="space-between">
                                                    <Text fontSize="sm">최소 길이</Text>
                                                    <Text fontSize="sm" fontWeight="bold">8자</Text>
                                                </HStack>
                                                <HStack justify="space-between">
                                                    <Text fontSize="sm">대문자 필수</Text>
                                                    <CheckIcon color="green.500" />
                                                </HStack>
                                                <HStack justify="space-between">
                                                    <Text fontSize="sm">숫자 필수</Text>
                                                    <CheckIcon color="green.500" />
                                                </HStack>
                                                <HStack justify="space-between">
                                                    <Text fontSize="sm">특수문자 필수</Text>
                                                    <CheckIcon color="green.500" />
                                                </HStack>
                                            </VStack>
                                        </Box>

                                        <Box>
                                            <Text fontWeight="medium" mb={2}>세션 정책</Text>
                                            <VStack spacing={2} align="stretch">
                                                <HStack justify="space-between">
                                                    <Text fontSize="sm">세션 만료</Text>
                                                    <Text fontSize="sm" fontWeight="bold">24시간</Text>
                                                </HStack>
                                                <HStack justify="space-between">
                                                    <Text fontSize="sm">최대 동시 세션</Text>
                                                    <Text fontSize="sm" fontWeight="bold">5개</Text>
                                                </HStack>
                                            </VStack>
                                        </Box>
                                    </VStack>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">보안 통계</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <Box textAlign="center">
                                            <CircularProgress
                                                value={stats?.twoFactorRate || 0}
                                                color="purple.500"
                                                size="80px"
                                            >
                                                <CircularProgressLabel>
                                                    {stats?.twoFactorRate.toFixed(1) || 0}%
                                                </CircularProgressLabel>
                                            </CircularProgress>
                                            <Text fontSize="sm" color="gray.600" mt={2}>
                                                2FA 사용률
                                            </Text>
                                        </Box>

                                        <Box textAlign="center">
                                            <CircularProgress
                                                value={stats?.lockoutRate || 0}
                                                color="red.500"
                                                size="80px"
                                            >
                                                <CircularProgressLabel>
                                                    {stats?.lockoutRate.toFixed(1) || 0}%
                                                </CircularProgressLabel>
                                            </CircularProgress>
                                            <Text fontSize="sm" color="gray.600" mt={2}>
                                                계정 잠금률
                                            </Text>
                                        </Box>
                                    </VStack>
                                </CardBody>
                            </Card>
                        </SimpleGrid>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            {/* 사용자 모달 */}
            <Modal isOpen={isUserModalOpen} onClose={onUserModalClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        {selectedUser ? '사용자 편집' : '사용자 추가'}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <FormControl>
                                <FormLabel>이메일</FormLabel>
                                <Input
                                    value={userData.email || ''}
                                    onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="이메일을 입력하세요"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>사용자명</FormLabel>
                                <Input
                                    value={userData.username || ''}
                                    onChange={(e) => setUserData(prev => ({ ...prev, username: e.target.value }))}
                                    placeholder="사용자명을 입력하세요"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>이름</FormLabel>
                                <HStack spacing={2}>
                                    <Input
                                        value={userData.firstName || ''}
                                        onChange={(e) => setUserData(prev => ({ ...prev, firstName: e.target.value }))}
                                        placeholder="이름"
                                    />
                                    <Input
                                        value={userData.lastName || ''}
                                        onChange={(e) => setUserData(prev => ({ ...prev, lastName: e.target.value }))}
                                        placeholder="성"
                                    />
                                </HStack>
                            </FormControl>

                            <FormControl>
                                <FormLabel>역할</FormLabel>
                                <Select
                                    value={userData.role || ''}
                                    onChange={(e) => setUserData(prev => ({ ...prev, role: e.target.value }))}
                                >
                                    <option value="">역할을 선택하세요</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            <HStack spacing={2}>
                                <Button colorScheme="blue" flex="1">
                                    {selectedUser ? '수정' : '추가'}
                                </Button>
                                <Button variant="outline" flex="1" onClick={onUserModalClose}>
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

export default AdvancedAuthDashboard;

