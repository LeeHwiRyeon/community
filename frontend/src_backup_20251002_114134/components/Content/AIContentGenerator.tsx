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
    FormControl,
    FormLabel,
    Input,
    Select,
    Textarea,
    Switch,
    Divider,
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
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Progress,
    CircularProgress,
    CircularProgressLabel,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
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
    Wrap,
    WrapItem,
    Tag,
    TagLabel,
    TagCloseButton,
    useColorModeValue,
    Flex,
    Spacer,
    Tooltip,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverArrow,
    PopoverCloseButton,
    PopoverHeader,
    PopoverBody,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
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

interface AIContentGeneratorProps {
    onContentGenerated?: (content: string) => void;
    onContentOptimized?: (content: string) => void;
}

interface GenerationRequest {
    type: string;
    topic: string;
    keywords: string[];
    tone: string;
    length: string;
    language: string;
    targetAudience: string;
    style: string;
    includeImages: boolean;
    includeCallToAction: boolean;
    seoOptimized: boolean;
    customPrompt: string;
}

interface OptimizationRequest {
    content: string;
    optimizationType: string;
    targetKeywords: string[];
    targetAudience: string;
    tone: string;
    maxLength?: number;
    minLength?: number;
    includeSuggestions: boolean;
}

interface GeneratedContent {
    content: string;
    metadata: {
        wordCount: number;
        readingTime: number;
        readabilityScore: number;
        seoScore: number;
        sentiment: string;
        keywords: string[];
        topics: string[];
    };
    suggestions: {
        improvements: string[];
        imageSuggestions: any[];
        callToAction?: string;
        seoRecommendations: string[];
    };
    generationInfo: {
        type: string;
        topic: string;
        tone: string;
        length: string;
        language: string;
        generatedAt: string;
        model: string;
    };
}

const AIContentGenerator: React.FC<AIContentGeneratorProps> = ({
    onContentGenerated,
    onContentOptimized
}) => {
    const [activeTab, setActiveTab] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
    const [optimizedContent, setOptimizedContent] = useState<any>(null);
    const [generationRequest, setGenerationRequest] = useState<GenerationRequest>({
        type: 'article',
        topic: '',
        keywords: [],
        tone: 'professional',
        length: 'medium',
        language: 'ko',
        targetAudience: '',
        style: 'informative',
        includeImages: false,
        includeCallToAction: false,
        seoOptimized: true,
        customPrompt: ''
    });
    const [optimizationRequest, setOptimizationRequest] = useState<OptimizationRequest>({
        content: '',
        optimizationType: 'seo',
        targetKeywords: [],
        targetAudience: '',
        tone: 'professional',
        includeSuggestions: true
    });
    const [keywordInput, setKeywordInput] = useState('');
    const [targetKeywordInput, setTargetKeywordInput] = useState('');

    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // 키워드 추가
    const addKeyword = (keyword: string) => {
        if (keyword.trim() && !generationRequest.keywords.includes(keyword.trim())) {
            setGenerationRequest(prev => ({
                ...prev,
                keywords: [...prev.keywords, keyword.trim()]
            }));
            setKeywordInput('');
        }
    };

    // 키워드 제거
    const removeKeyword = (keyword: string) => {
        setGenerationRequest(prev => ({
            ...prev,
            keywords: prev.keywords.filter(k => k !== keyword)
        }));
    };

    // 타겟 키워드 추가
    const addTargetKeyword = (keyword: string) => {
        if (keyword.trim() && !optimizationRequest.targetKeywords.includes(keyword.trim())) {
            setOptimizationRequest(prev => ({
                ...prev,
                targetKeywords: [...prev.targetKeywords, keyword.trim()]
            }));
            setTargetKeywordInput('');
        }
    };

    // 타겟 키워드 제거
    const removeTargetKeyword = (keyword: string) => {
        setOptimizationRequest(prev => ({
            ...prev,
            targetKeywords: prev.targetKeywords.filter(k => k !== keyword)
        }));
    };

    // AI 컨텐츠 생성
    const generateContent = async () => {
        if (!generationRequest.topic.trim()) {
            toast({
                title: '오류',
                description: '주제를 입력해주세요.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
            return;
        }

        setIsGenerating(true);
        try {
            const response = await fetch('/api/ai-content/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(generationRequest)
            });

            const data = await response.json();

            if (data.success) {
                setGeneratedContent(data.data);
                onContentGenerated?.(data.data.content);
                toast({
                    title: '생성 완료',
                    description: 'AI 컨텐츠가 생성되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('AI 컨텐츠 생성 오류:', error);
            toast({
                title: '오류 발생',
                description: 'AI 컨텐츠 생성에 실패했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        } finally {
            setIsGenerating(false);
        }
    };

    // AI 컨텐츠 최적화
    const optimizeContent = async () => {
        if (!optimizationRequest.content.trim()) {
            toast({
                title: '오류',
                description: '컨텐츠를 입력해주세요.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
            return;
        }

        setIsOptimizing(true);
        try {
            const response = await fetch('/api/ai-content/optimize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(optimizationRequest)
            });

            const data = await response.json();

            if (data.success) {
                setOptimizedContent(data.data);
                onContentOptimized?.(data.data.optimizedContent);
                toast({
                    title: '최적화 완료',
                    description: 'AI 컨텐츠 최적화가 완료되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('AI 컨텐츠 최적화 오류:', error);
            toast({
                title: '오류 발생',
                description: 'AI 컨텐츠 최적화에 실패했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        } finally {
            setIsOptimizing(false);
        }
    };

    return (
        <Box>
            <Tabs index={activeTab} onChange={setActiveTab}>
                <TabList>
                    <Tab>컨텐츠 생성</Tab>
                    <Tab>컨텐츠 최적화</Tab>
                    <Tab>아이디어 생성</Tab>
                    <Tab>번역</Tab>
                    <Tab>요약</Tab>
                </TabList>

                <TabPanels>
                    {/* 컨텐츠 생성 탭 */}
                    <TabPanel>
                        <VStack spacing={6} align="stretch">
                            <Card>
                                <CardHeader>
                                    <Heading size="md">AI 컨텐츠 생성</Heading>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                            <FormControl>
                                                <FormLabel>컨텐츠 타입</FormLabel>
                                                <Select
                                                    value={generationRequest.type}
                                                    onChange={(e) => setGenerationRequest(prev => ({ ...prev, type: e.target.value }))}
                                                >
                                                    <option value="article">기사</option>
                                                    <option value="blog">블로그</option>
                                                    <option value="social">소셜미디어</option>
                                                    <option value="email">이메일</option>
                                                    <option value="ad">광고</option>
                                                    <option value="product">제품 설명</option>
                                                </Select>
                                            </FormControl>

                                            <FormControl>
                                                <FormLabel>톤</FormLabel>
                                                <Select
                                                    value={generationRequest.tone}
                                                    onChange={(e) => setGenerationRequest(prev => ({ ...prev, tone: e.target.value }))}
                                                >
                                                    <option value="professional">전문적</option>
                                                    <option value="casual">캐주얼</option>
                                                    <option value="friendly">친근한</option>
                                                    <option value="formal">격식있는</option>
                                                    <option value="creative">창의적</option>
                                                </Select>
                                            </FormControl>

                                            <FormControl>
                                                <FormLabel>길이</FormLabel>
                                                <Select
                                                    value={generationRequest.length}
                                                    onChange={(e) => setGenerationRequest(prev => ({ ...prev, length: e.target.value }))}
                                                >
                                                    <option value="short">짧음 (300-500자)</option>
                                                    <option value="medium">보통 (500-1000자)</option>
                                                    <option value="long">김 (1000자 이상)</option>
                                                </Select>
                                            </FormControl>

                                            <FormControl>
                                                <FormLabel>언어</FormLabel>
                                                <Select
                                                    value={generationRequest.language}
                                                    onChange={(e) => setGenerationRequest(prev => ({ ...prev, language: e.target.value }))}
                                                >
                                                    <option value="ko">한국어</option>
                                                    <option value="en">English</option>
                                                    <option value="ja">日本語</option>
                                                    <option value="zh">中文</option>
                                                </Select>
                                            </FormControl>
                                        </SimpleGrid>

                                        <FormControl>
                                            <FormLabel>주제 *</FormLabel>
                                            <Input
                                                value={generationRequest.topic}
                                                onChange={(e) => setGenerationRequest(prev => ({ ...prev, topic: e.target.value }))}
                                                placeholder="컨텐츠 주제를 입력하세요"
                                            />
                                        </FormControl>

                                        <FormControl>
                                            <FormLabel>키워드</FormLabel>
                                            <HStack>
                                                <Input
                                                    value={keywordInput}
                                                    onChange={(e) => setKeywordInput(e.target.value)}
                                                    placeholder="키워드를 입력하세요"
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            addKeyword(keywordInput);
                                                        }
                                                    }}
                                                />
                                                <Button onClick={() => addKeyword(keywordInput)}>
                                                    추가
                                                </Button>
                                            </HStack>
                                            <Wrap mt={2}>
                                                {generationRequest.keywords.map((keyword, index) => (
                                                    <WrapItem key={index}>
                                                        <Tag>
                                                            <TagLabel>{keyword}</TagLabel>
                                                            <TagCloseButton onClick={() => removeKeyword(keyword)} />
                                                        </Tag>
                                                    </WrapItem>
                                                ))}
                                            </Wrap>
                                        </FormControl>

                                        <FormControl>
                                            <FormLabel>타겟 오디언스</FormLabel>
                                            <Input
                                                value={generationRequest.targetAudience}
                                                onChange={(e) => setGenerationRequest(prev => ({ ...prev, targetAudience: e.target.value }))}
                                                placeholder="예: 20-30대 직장인, 학생, 부모님 등"
                                            />
                                        </FormControl>

                                        <FormControl>
                                            <FormLabel>스타일</FormLabel>
                                            <Select
                                                value={generationRequest.style}
                                                onChange={(e) => setGenerationRequest(prev => ({ ...prev, style: e.target.value }))}
                                            >
                                                <option value="informative">정보 제공형</option>
                                                <option value="persuasive">설득형</option>
                                                <option value="narrative">서사형</option>
                                                <option value="technical">기술적</option>
                                            </Select>
                                        </FormControl>

                                        <FormControl>
                                            <FormLabel>추가 요구사항</FormLabel>
                                            <Textarea
                                                value={generationRequest.customPrompt}
                                                onChange={(e) => setGenerationRequest(prev => ({ ...prev, customPrompt: e.target.value }))}
                                                placeholder="특별한 요구사항이 있다면 입력하세요"
                                                rows={3}
                                            />
                                        </FormControl>

                                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                                            <FormControl display="flex" alignItems="center">
                                                <Switch
                                                    id="includeImages"
                                                    isChecked={generationRequest.includeImages}
                                                    onChange={(e) => setGenerationRequest(prev => ({ ...prev, includeImages: e.target.checked }))}
                                                />
                                                <FormLabel htmlFor="includeImages" mb="0" ml={2}>
                                                    이미지 포함
                                                </FormLabel>
                                            </FormControl>

                                            <FormControl display="flex" alignItems="center">
                                                <Switch
                                                    id="includeCallToAction"
                                                    isChecked={generationRequest.includeCallToAction}
                                                    onChange={(e) => setGenerationRequest(prev => ({ ...prev, includeCallToAction: e.target.checked }))}
                                                />
                                                <FormLabel htmlFor="includeCallToAction" mb="0" ml={2}>
                                                    CTA 포함
                                                </FormLabel>
                                            </FormControl>

                                            <FormControl display="flex" alignItems="center">
                                                <Switch
                                                    id="seoOptimized"
                                                    isChecked={generationRequest.seoOptimized}
                                                    onChange={(e) => setGenerationRequest(prev => ({ ...prev, seoOptimized: e.target.checked }))}
                                                />
                                                <FormLabel htmlFor="seoOptimized" mb="0" ml={2}>
                                                    SEO 최적화
                                                </FormLabel>
                                            </FormControl>
                                        </SimpleGrid>

                                        <Button
                                            colorScheme="blue"
                                            size="lg"
                                            leftIcon={<MagicIcon />}
                                            onClick={generateContent}
                                            isLoading={isGenerating}
                                            loadingText="생성 중..."
                                        >
                                            AI 컨텐츠 생성
                                        </Button>
                                    </VStack>
                                </CardBody>
                            </Card>

                            {/* 생성된 컨텐츠 */}
                            {generatedContent && (
                                <Card>
                                    <CardHeader>
                                        <HStack justify="space-between">
                                            <Heading size="md">생성된 컨텐츠</Heading>
                                            <HStack spacing={2}>
                                                <Button size="sm" leftIcon={<CopyIcon />}>
                                                    복사
                                                </Button>
                                                <Button size="sm" leftIcon={<DownloadIcon />}>
                                                    다운로드
                                                </Button>
                                            </HStack>
                                        </HStack>
                                    </CardHeader>
                                    <CardBody>
                                        <VStack spacing={4} align="stretch">
                                            <Box
                                                p={4}
                                                border="1px solid"
                                                borderColor={borderColor}
                                                borderRadius="md"
                                                bg={bgColor}
                                                whiteSpace="pre-wrap"
                                            >
                                                {generatedContent.content}
                                            </Box>

                                            {/* 메타데이터 */}
                                            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                                                <Stat>
                                                    <StatLabel>단어 수</StatLabel>
                                                    <StatNumber>{generatedContent.metadata.wordCount}</StatNumber>
                                                </Stat>
                                                <Stat>
                                                    <StatLabel>읽기 시간</StatLabel>
                                                    <StatNumber>{generatedContent.metadata.readingTime}분</StatNumber>
                                                </Stat>
                                                <Stat>
                                                    <StatLabel>가독성 점수</StatLabel>
                                                    <StatNumber>{generatedContent.metadata.readabilityScore}/100</StatNumber>
                                                </Stat>
                                                <Stat>
                                                    <StatLabel>SEO 점수</StatLabel>
                                                    <StatNumber>{generatedContent.metadata.seoScore}/100</StatNumber>
                                                </Stat>
                                            </SimpleGrid>

                                            {/* 개선 제안 */}
                                            {generatedContent.suggestions.improvements.length > 0 && (
                                                <Accordion allowToggle>
                                                    <AccordionItem>
                                                        <AccordionButton>
                                                            <Box flex="1" textAlign="left">
                                                                개선 제안
                                                            </Box>
                                                            <AccordionIcon />
                                                        </AccordionButton>
                                                        <AccordionPanel>
                                                            <List spacing={2}>
                                                                {generatedContent.suggestions.improvements.map((improvement, index) => (
                                                                    <ListItem key={index}>
                                                                        <ListIcon as={CheckIcon} color="green.500" />
                                                                        {improvement}
                                                                    </ListItem>
                                                                ))}
                                                            </List>
                                                        </AccordionPanel>
                                                    </AccordionItem>
                                                </Accordion>
                                            )}
                                        </VStack>
                                    </CardBody>
                                </Card>
                            )}
                        </VStack>
                    </TabPanel>

                    {/* 컨텐츠 최적화 탭 */}
                    <TabPanel>
                        <VStack spacing={6} align="stretch">
                            <Card>
                                <CardHeader>
                                    <Heading size="md">AI 컨텐츠 최적화</Heading>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        <FormControl>
                                            <FormLabel>컨텐츠</FormLabel>
                                            <Textarea
                                                value={optimizationRequest.content}
                                                onChange={(e) => setOptimizationRequest(prev => ({ ...prev, content: e.target.value }))}
                                                placeholder="최적화할 컨텐츠를 입력하세요"
                                                rows={8}
                                            />
                                        </FormControl>

                                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                            <FormControl>
                                                <FormLabel>최적화 타입</FormLabel>
                                                <Select
                                                    value={optimizationRequest.optimizationType}
                                                    onChange={(e) => setOptimizationRequest(prev => ({ ...prev, optimizationType: e.target.value }))}
                                                >
                                                    <option value="seo">SEO</option>
                                                    <option value="readability">가독성</option>
                                                    <option value="engagement">참여도</option>
                                                    <option value="conversion">전환율</option>
                                                </Select>
                                            </FormControl>

                                            <FormControl>
                                                <FormLabel>톤</FormLabel>
                                                <Select
                                                    value={optimizationRequest.tone}
                                                    onChange={(e) => setOptimizationRequest(prev => ({ ...prev, tone: e.target.value }))}
                                                >
                                                    <option value="professional">전문적</option>
                                                    <option value="casual">캐주얼</option>
                                                    <option value="friendly">친근한</option>
                                                    <option value="formal">격식있는</option>
                                                </Select>
                                            </FormControl>
                                        </SimpleGrid>

                                        <FormControl>
                                            <FormLabel>타겟 키워드</FormLabel>
                                            <HStack>
                                                <Input
                                                    value={targetKeywordInput}
                                                    onChange={(e) => setTargetKeywordInput(e.target.value)}
                                                    placeholder="타겟 키워드를 입력하세요"
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            addTargetKeyword(targetKeywordInput);
                                                        }
                                                    }}
                                                />
                                                <Button onClick={() => addTargetKeyword(targetKeywordInput)}>
                                                    추가
                                                </Button>
                                            </HStack>
                                            <Wrap mt={2}>
                                                {optimizationRequest.targetKeywords.map((keyword, index) => (
                                                    <WrapItem key={index}>
                                                        <Tag>
                                                            <TagLabel>{keyword}</TagLabel>
                                                            <TagCloseButton onClick={() => removeTargetKeyword(keyword)} />
                                                        </Tag>
                                                    </WrapItem>
                                                ))}
                                            </Wrap>
                                        </FormControl>

                                        <FormControl>
                                            <FormLabel>타겟 오디언스</FormLabel>
                                            <Input
                                                value={optimizationRequest.targetAudience}
                                                onChange={(e) => setOptimizationRequest(prev => ({ ...prev, targetAudience: e.target.value }))}
                                                placeholder="예: 20-30대 직장인, 학생, 부모님 등"
                                            />
                                        </FormControl>

                                        <HStack spacing={4}>
                                            <NumberInput
                                                value={optimizationRequest.maxLength}
                                                onChange={(value) => setOptimizationRequest(prev => ({ ...prev, maxLength: parseInt(value) }))}
                                                min={100}
                                                max={5000}
                                            >
                                                <NumberInputField placeholder="최대 길이" />
                                                <NumberInputStepper>
                                                    <NumberIncrementStepper />
                                                    <NumberDecrementStepper />
                                                </NumberInputStepper>
                                            </NumberInput>

                                            <NumberInput
                                                value={optimizationRequest.minLength}
                                                onChange={(value) => setOptimizationRequest(prev => ({ ...prev, minLength: parseInt(value) }))}
                                                min={50}
                                                max={2000}
                                            >
                                                <NumberInputField placeholder="최소 길이" />
                                                <NumberInputStepper>
                                                    <NumberIncrementStepper />
                                                    <NumberDecrementStepper />
                                                </NumberInputStepper>
                                            </NumberInput>
                                        </HStack>

                                        <FormControl display="flex" alignItems="center">
                                            <Switch
                                                id="includeSuggestions"
                                                isChecked={optimizationRequest.includeSuggestions}
                                                onChange={(e) => setOptimizationRequest(prev => ({ ...prev, includeSuggestions: e.target.checked }))}
                                            />
                                            <FormLabel htmlFor="includeSuggestions" mb="0" ml={2}>
                                                개선 제안 포함
                                            </FormLabel>
                                        </FormControl>

                                        <Button
                                            colorScheme="green"
                                            size="lg"
                                            leftIcon={<SparklesIcon />}
                                            onClick={optimizeContent}
                                            isLoading={isOptimizing}
                                            loadingText="최적화 중..."
                                        >
                                            AI 컨텐츠 최적화
                                        </Button>
                                    </VStack>
                                </CardBody>
                            </Card>

                            {/* 최적화된 컨텐츠 */}
                            {optimizedContent && (
                                <Card>
                                    <CardHeader>
                                        <Heading size="md">최적화된 컨텐츠</Heading>
                                    </CardHeader>
                                    <CardBody>
                                        <VStack spacing={4} align="stretch">
                                            <Box
                                                p={4}
                                                border="1px solid"
                                                borderColor={borderColor}
                                                borderRadius="md"
                                                bg={bgColor}
                                                whiteSpace="pre-wrap"
                                            >
                                                {optimizedContent.optimizedContent}
                                            </Box>

                                            {/* 개선 지표 */}
                                            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                                                <Stat>
                                                    <StatLabel>SEO 점수</StatLabel>
                                                    <StatNumber color="green.500">
                                                        {optimizedContent.improvements.seoScore}/100
                                                    </StatNumber>
                                                </Stat>
                                                <Stat>
                                                    <StatLabel>가독성 점수</StatLabel>
                                                    <StatNumber color="blue.500">
                                                        {optimizedContent.improvements.readabilityScore}/100
                                                    </StatNumber>
                                                </Stat>
                                                <Stat>
                                                    <StatLabel>참여도 점수</StatLabel>
                                                    <StatNumber color="purple.500">
                                                        {optimizedContent.improvements.engagementScore}/100
                                                    </StatNumber>
                                                </Stat>
                                                <Stat>
                                                    <StatLabel>단어 수 변화</StatLabel>
                                                    <StatNumber color={optimizedContent.improvements.wordCountChange > 0 ? "green.500" : "red.500"}>
                                                        {optimizedContent.improvements.wordCountChange > 0 ? "+" : ""}{optimizedContent.improvements.wordCountChange}
                                                    </StatNumber>
                                                </Stat>
                                            </SimpleGrid>
                                        </VStack>
                                    </CardBody>
                                </Card>
                            )}
                        </VStack>
                    </TabPanel>

                    {/* 기타 탭들은 간단한 폼으로 구현 */}
                    <TabPanel>
                        <Card>
                            <CardBody>
                                <Text>아이디어 생성 기능은 곧 추가될 예정입니다.</Text>
                            </CardBody>
                        </Card>
                    </TabPanel>

                    <TabPanel>
                        <Card>
                            <CardBody>
                                <Text>번역 기능은 곧 추가될 예정입니다.</Text>
                            </CardBody>
                        </Card>
                    </TabPanel>

                    <TabPanel>
                        <Card>
                            <CardBody>
                                <Text>요약 기능은 곧 추가될 예정입니다.</Text>
                            </CardBody>
                        </Card>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
};

export default AIContentGenerator;
