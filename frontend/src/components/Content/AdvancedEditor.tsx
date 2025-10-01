import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Card,
    CardBody,
    CardHeader,
    Toolbar,
    ToolbarGroup,
    ToolbarButton,
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
    Textarea,
    Select,
    Switch,
    Divider,
    Badge,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    useColorModeValue,
    Flex,
    Spacer,
    Wrap,
    WrapItem,
    Tag,
    TagLabel,
    TagCloseButton,
    Code,
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
    UnorderedList
} from '@chakra-ui/react';
import {
    BoldIcon,
    ItalicIcon,
    UnderlineIcon,
    StrikethroughIcon,
    CodeIcon,
    LinkIcon,
    ImageIcon,
    VideoIcon,
    TableIcon,
    ListIcon as List,
    NumberedListIcon,
    QuoteIcon,
    HeadingIcon,
    AlignLeftIcon,
    AlignCenterIcon,
    AlignRightIcon,
    AlignJustifyIcon,
    UndoIcon,
    RedoIcon,
    SaveIcon,
    DownloadIcon,
    UploadIcon,
    ShareIcon,
    EyeIcon,
    SettingsIcon,
    PaletteIcon,
    FontSizeIcon,
    FormatIcon,
    MagicIcon,
    CheckIcon,
    CloseIcon,
    AddIcon,
    EditIcon,
    DeleteIcon,
    CopyIcon,
    PasteIcon,
    CutIcon,
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
    PasteIcon as Paste,
    CutIcon as Cut,
    UndoIcon as Undo,
    RedoIcon as Redo,
    SaveIcon as Save,
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

interface EditorState {
    content: string;
    mode: 'wysiwyg' | 'markdown' | 'code';
    fontSize: number;
    fontFamily: string;
    textAlign: 'left' | 'center' | 'right' | 'justify';
    lineHeight: number;
    wordCount: number;
    charCount: number;
    readTime: number;
}

interface EditorProps {
    initialContent?: string;
    onContentChange?: (content: string) => void;
    onSave?: (content: string) => void;
    readOnly?: boolean;
    showToolbar?: boolean;
    showStats?: boolean;
    maxLength?: number;
}

const AdvancedEditor: React.FC<EditorProps> = ({
    initialContent = '',
    onContentChange,
    onSave,
    readOnly = false,
    showToolbar = true,
    showStats = true,
    maxLength = 10000
}) => {
    const [editorState, setEditorState] = useState<EditorState>({
        content: initialContent,
        mode: 'wysiwyg',
        fontSize: 16,
        fontFamily: 'Arial',
        textAlign: 'left',
        lineHeight: 1.5,
        wordCount: 0,
        charCount: 0,
        readTime: 0
    });

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const editorRef = useRef<HTMLDivElement>(null);
    const { isOpen: isImageModalOpen, onOpen: onImageModalOpen, onClose: onImageModalClose } = useDisclosure();
    const { isOpen: isLinkModalOpen, onOpen: onLinkModalOpen, onClose: onLinkModalClose } = useDisclosure();
    const { isOpen: isTableModalOpen, onOpen: onTableModalOpen, onClose: onTableModalClose } = useDisclosure();

    const [imageUrl, setImageUrl] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const [tableRows, setTableRows] = useState(3);
    const [tableCols, setTableCols] = useState(3);

    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // 에디터 상태 업데이트
    const updateEditorState = (updates: Partial<EditorState>) => {
        setEditorState(prev => {
            const newState = { ...prev, ...updates };

            // 통계 계산
            if (updates.content !== undefined) {
                const words = updates.content.trim().split(/\s+/).filter(word => word.length > 0);
                const chars = updates.content.length;
                const readTime = Math.ceil(words.length / 200); // 분당 200단어 기준

                newState.wordCount = words.length;
                newState.charCount = chars;
                newState.readTime = readTime;
            }

            return newState;
        });

        if (updates.content !== undefined) {
            setHasUnsavedChanges(true);
            onContentChange?.(updates.content);
        }
    };

    // 텍스트 서식 적용
    const applyFormat = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    // 선택된 텍스트 가져오기
    const getSelectedText = () => {
        return window.getSelection()?.toString() || '';
    };

    // 이미지 삽입
    const insertImage = () => {
        if (imageUrl) {
            const img = `<img src="${imageUrl}" alt="이미지" style="max-width: 100%; height: auto;" />`;
            applyFormat('insertHTML', img);
            setImageUrl('');
            onImageModalClose();
            toast({
                title: '이미지 삽입 완료',
                status: 'success',
                duration: 2000,
                isClosable: true
            });
        }
    };

    // 링크 삽입
    const insertLink = () => {
        if (linkUrl && linkText) {
            const link = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
            applyFormat('insertHTML', link);
            setLinkUrl('');
            setLinkText('');
            onLinkModalClose();
            toast({
                title: '링크 삽입 완료',
                status: 'success',
                duration: 2000,
                isClosable: true
            });
        }
    };

    // 테이블 삽입
    const insertTable = () => {
        let table = '<table border="1" style="border-collapse: collapse; width: 100%;">';
        for (let i = 0; i < tableRows; i++) {
            table += '<tr>';
            for (let j = 0; j < tableCols; j++) {
                table += '<td style="padding: 8px;">셀</td>';
            }
            table += '</tr>';
        }
        table += '</table>';

        applyFormat('insertHTML', table);
        onTableModalClose();
        toast({
            title: '테이블 삽입 완료',
            status: 'success',
            duration: 2000,
            isClosable: true
        });
    };

    // 저장
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave?.(editorState.content);
            setHasUnsavedChanges(false);
            toast({
                title: '저장 완료',
                status: 'success',
                duration: 2000,
                isClosable: true
            });
        } catch (error) {
            toast({
                title: '저장 실패',
                description: '다시 시도해주세요.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        } finally {
            setIsSaving(false);
        }
    };

    // 전체화면 토글
    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    // 미리보기 토글
    const togglePreview = () => {
        setShowPreview(!showPreview);
    };

    // 에디터 모드 변경
    const changeMode = (mode: 'wysiwyg' | 'markdown' | 'code') => {
        updateEditorState({ mode });
    };

    // 폰트 크기 변경
    const changeFontSize = (size: number) => {
        updateEditorState({ fontSize: size });
        if (editorRef.current) {
            editorRef.current.style.fontSize = `${size}px`;
        }
    };

    // 폰트 패밀리 변경
    const changeFontFamily = (family: string) => {
        updateEditorState({ fontFamily: family });
        if (editorRef.current) {
            editorRef.current.style.fontFamily = family;
        }
    };

    // 텍스트 정렬 변경
    const changeTextAlign = (align: 'left' | 'center' | 'right' | 'justify') => {
        updateEditorState({ textAlign: align });
        applyFormat('justifyLeft');
        if (align === 'center') applyFormat('justifyCenter');
        if (align === 'right') applyFormat('justifyRight');
        if (align === 'justify') applyFormat('justifyFull');
    };

    // 키보드 단축키
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        handleSave();
                        break;
                    case 'b':
                        e.preventDefault();
                        applyFormat('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        applyFormat('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        applyFormat('underline');
                        break;
                    case 'z':
                        e.preventDefault();
                        applyFormat('undo');
                        break;
                    case 'y':
                        e.preventDefault();
                        applyFormat('redo');
                        break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <Box
            position={isFullscreen ? 'fixed' : 'relative'}
            top={isFullscreen ? 0 : 'auto'}
            left={isFullscreen ? 0 : 'auto'}
            right={isFullscreen ? 0 : 'auto'}
            bottom={isFullscreen ? 0 : 'auto'}
            zIndex={isFullscreen ? 1000 : 'auto'}
            bg={bgColor}
            h={isFullscreen ? '100vh' : 'auto'}
            display="flex"
            flexDirection="column"
        >
            {/* 툴바 */}
            {showToolbar && (
                <Card mb={4}>
                    <CardBody p={2}>
                        <VStack spacing={2} align="stretch">
                            {/* 메인 툴바 */}
                            <HStack spacing={2} wrap="wrap">
                                {/* 모드 선택 */}
                                <HStack spacing={1}>
                                    <Button
                                        size="sm"
                                        colorScheme={editorState.mode === 'wysiwyg' ? 'blue' : 'gray'}
                                        onClick={() => changeMode('wysiwyg')}
                                    >
                                        WYSIWYG
                                    </Button>
                                    <Button
                                        size="sm"
                                        colorScheme={editorState.mode === 'markdown' ? 'blue' : 'gray'}
                                        onClick={() => changeMode('markdown')}
                                    >
                                        Markdown
                                    </Button>
                                    <Button
                                        size="sm"
                                        colorScheme={editorState.mode === 'code' ? 'blue' : 'gray'}
                                        onClick={() => changeMode('code')}
                                    >
                                        Code
                                    </Button>
                                </HStack>

                                <Divider orientation="vertical" />

                                {/* 텍스트 서식 */}
                                <HStack spacing={1}>
                                    <IconButton
                                        size="sm"
                                        aria-label="굵게"
                                        icon={<BoldIcon />}
                                        onClick={() => applyFormat('bold')}
                                    />
                                    <IconButton
                                        size="sm"
                                        aria-label="기울임"
                                        icon={<ItalicIcon />}
                                        onClick={() => applyFormat('italic')}
                                    />
                                    <IconButton
                                        size="sm"
                                        aria-label="밑줄"
                                        icon={<UnderlineIcon />}
                                        onClick={() => applyFormat('underline')}
                                    />
                                    <IconButton
                                        size="sm"
                                        aria-label="취소선"
                                        icon={<StrikethroughIcon />}
                                        onClick={() => applyFormat('strikeThrough')}
                                    />
                                </HStack>

                                <Divider orientation="vertical" />

                                {/* 제목 */}
                                <Menu>
                                    <MenuButton as={Button} size="sm" rightIcon={<HeadingIcon />}>
                                        제목
                                    </MenuButton>
                                    <MenuList>
                                        <MenuItem onClick={() => applyFormat('formatBlock', 'h1')}>제목 1</MenuItem>
                                        <MenuItem onClick={() => applyFormat('formatBlock', 'h2')}>제목 2</MenuItem>
                                        <MenuItem onClick={() => applyFormat('formatBlock', 'h3')}>제목 3</MenuItem>
                                        <MenuItem onClick={() => applyFormat('formatBlock', 'h4')}>제목 4</MenuItem>
                                        <MenuItem onClick={() => applyFormat('formatBlock', 'h5')}>제목 5</MenuItem>
                                        <MenuItem onClick={() => applyFormat('formatBlock', 'h6')}>제목 6</MenuItem>
                                    </MenuList>
                                </Menu>

                                <Divider orientation="vertical" />

                                {/* 정렬 */}
                                <HStack spacing={1}>
                                    <IconButton
                                        size="sm"
                                        aria-label="왼쪽 정렬"
                                        icon={<AlignLeftIcon />}
                                        onClick={() => changeTextAlign('left')}
                                    />
                                    <IconButton
                                        size="sm"
                                        aria-label="가운데 정렬"
                                        icon={<AlignCenterIcon />}
                                        onClick={() => changeTextAlign('center')}
                                    />
                                    <IconButton
                                        size="sm"
                                        aria-label="오른쪽 정렬"
                                        icon={<AlignRightIcon />}
                                        onClick={() => changeTextAlign('right')}
                                    />
                                    <IconButton
                                        size="sm"
                                        aria-label="양쪽 정렬"
                                        icon={<AlignJustifyIcon />}
                                        onClick={() => changeTextAlign('justify')}
                                    />
                                </HStack>

                                <Divider orientation="vertical" />

                                {/* 목록 */}
                                <HStack spacing={1}>
                                    <IconButton
                                        size="sm"
                                        aria-label="순서 없는 목록"
                                        icon={<List />}
                                        onClick={() => applyFormat('insertUnorderedList')}
                                    />
                                    <IconButton
                                        size="sm"
                                        aria-label="순서 있는 목록"
                                        icon={<NumberedListIcon />}
                                        onClick={() => applyFormat('insertOrderedList')}
                                    />
                                </HStack>

                                <Divider orientation="vertical" />

                                {/* 삽입 */}
                                <HStack spacing={1}>
                                    <IconButton
                                        size="sm"
                                        aria-label="이미지"
                                        icon={<ImageIcon />}
                                        onClick={onImageModalOpen}
                                    />
                                    <IconButton
                                        size="sm"
                                        aria-label="링크"
                                        icon={<LinkIcon />}
                                        onClick={onLinkModalOpen}
                                    />
                                    <IconButton
                                        size="sm"
                                        aria-label="테이블"
                                        icon={<TableIcon />}
                                        onClick={onTableModalOpen}
                                    />
                                    <IconButton
                                        size="sm"
                                        aria-label="코드"
                                        icon={<CodeIcon />}
                                        onClick={() => applyFormat('insertHTML', '<code>코드</code>')}
                                    />
                                </HStack>

                                <Spacer />

                                {/* 액션 */}
                                <HStack spacing={1}>
                                    <IconButton
                                        size="sm"
                                        aria-label="실행 취소"
                                        icon={<UndoIcon />}
                                        onClick={() => applyFormat('undo')}
                                    />
                                    <IconButton
                                        size="sm"
                                        aria-label="다시 실행"
                                        icon={<RedoIcon />}
                                        onClick={() => applyFormat('redo')}
                                    />
                                    <IconButton
                                        size="sm"
                                        aria-label="미리보기"
                                        icon={<EyeIcon />}
                                        onClick={togglePreview}
                                    />
                                    <IconButton
                                        size="sm"
                                        aria-label="전체화면"
                                        icon={isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
                                        onClick={toggleFullscreen}
                                    />
                                </HStack>
                            </HStack>

                            {/* 폰트 설정 */}
                            <HStack spacing={4}>
                                <HStack spacing={2}>
                                    <Text fontSize="sm">폰트:</Text>
                                    <Select
                                        size="sm"
                                        value={editorState.fontFamily}
                                        onChange={(e) => changeFontFamily(e.target.value)}
                                        width="120px"
                                    >
                                        <option value="Arial">Arial</option>
                                        <option value="Times New Roman">Times New Roman</option>
                                        <option value="Georgia">Georgia</option>
                                        <option value="Verdana">Verdana</option>
                                        <option value="Helvetica">Helvetica</option>
                                        <option value="맑은 고딕">맑은 고딕</option>
                                        <option value="나눔고딕">나눔고딕</option>
                                    </Select>
                                </HStack>

                                <HStack spacing={2}>
                                    <Text fontSize="sm">크기:</Text>
                                    <Select
                                        size="sm"
                                        value={editorState.fontSize}
                                        onChange={(e) => changeFontSize(Number(e.target.value))}
                                        width="80px"
                                    >
                                        <option value={12}>12px</option>
                                        <option value={14}>14px</option>
                                        <option value={16}>16px</option>
                                        <option value={18}>18px</option>
                                        <option value={20}>20px</option>
                                        <option value={24}>24px</option>
                                        <option value={28}>28px</option>
                                        <option value={32}>32px</option>
                                    </Select>
                                </HStack>
                            </HStack>
                        </VStack>
                    </CardBody>
                </Card>
            )}

            {/* 에디터 영역 */}
            <Card flex="1" display="flex" flexDirection="column">
                <CardBody p={0} flex="1" display="flex" flexDirection="column">
                    {showPreview ? (
                        <Box
                            p={4}
                            flex="1"
                            overflow="auto"
                            dangerouslySetInnerHTML={{ __html: editorState.content }}
                        />
                    ) : (
                        <Box
                            ref={editorRef}
                            contentEditable={!readOnly}
                            suppressContentEditableWarning
                            p={4}
                            flex="1"
                            overflow="auto"
                            minH="400px"
                            border="1px solid"
                            borderColor={borderColor}
                            borderRadius="md"
                            fontSize={`${editorState.fontSize}px`}
                            fontFamily={editorState.fontFamily}
                            lineHeight={editorState.lineHeight}
                            textAlign={editorState.textAlign}
                            onInput={(e) => {
                                const content = e.currentTarget.innerHTML;
                                if (content.length <= maxLength) {
                                    updateEditorState({ content });
                                }
                            }}
                            style={{
                                outline: 'none',
                                wordWrap: 'break-word',
                                whiteSpace: 'pre-wrap'
                            }}
                        />
                    )}
                </CardBody>
            </Card>

            {/* 통계 및 액션 */}
            {showStats && (
                <Card mt={4}>
                    <CardBody p={2}>
                        <HStack justify="space-between">
                            <HStack spacing={4}>
                                <Text fontSize="sm" color="gray.600">
                                    단어: {editorState.wordCount}
                                </Text>
                                <Text fontSize="sm" color="gray.600">
                                    글자: {editorState.charCount}
                                </Text>
                                <Text fontSize="sm" color="gray.600">
                                    읽기 시간: {editorState.readTime}분
                                </Text>
                                {hasUnsavedChanges && (
                                    <Badge colorScheme="orange">저장되지 않음</Badge>
                                )}
                            </HStack>

                            <HStack spacing={2}>
                                <Button
                                    size="sm"
                                    colorScheme="blue"
                                    leftIcon={isSaving ? <CircularProgress size="16px" isIndeterminate /> : <SaveIcon />}
                                    onClick={handleSave}
                                    isLoading={isSaving}
                                >
                                    저장
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    leftIcon={<DownloadIcon />}
                                >
                                    내보내기
                                </Button>
                            </HStack>
                        </HStack>
                    </CardBody>
                </Card>
            )}

            {/* 이미지 삽입 모달 */}
            <Modal isOpen={isImageModalOpen} onClose={onImageModalClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>이미지 삽입</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl>
                                <FormLabel>이미지 URL</FormLabel>
                                <Input
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                />
                            </FormControl>
                            <HStack spacing={2}>
                                <Button colorScheme="blue" onClick={insertImage}>
                                    삽입
                                </Button>
                                <Button variant="outline" onClick={onImageModalClose}>
                                    취소
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 링크 삽입 모달 */}
            <Modal isOpen={isLinkModalOpen} onClose={onLinkModalClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>링크 삽입</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl>
                                <FormLabel>링크 URL</FormLabel>
                                <Input
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="https://example.com"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>링크 텍스트</FormLabel>
                                <Input
                                    value={linkText}
                                    onChange={(e) => setLinkText(e.target.value)}
                                    placeholder="링크 텍스트"
                                />
                            </FormControl>
                            <HStack spacing={2}>
                                <Button colorScheme="blue" onClick={insertLink}>
                                    삽입
                                </Button>
                                <Button variant="outline" onClick={onLinkModalClose}>
                                    취소
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 테이블 삽입 모달 */}
            <Modal isOpen={isTableModalOpen} onClose={onTableModalClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>테이블 삽입</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <HStack spacing={4}>
                                <FormControl>
                                    <FormLabel>행 수</FormLabel>
                                    <Input
                                        type="number"
                                        value={tableRows}
                                        onChange={(e) => setTableRows(Number(e.target.value))}
                                        min="1"
                                        max="10"
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>열 수</FormLabel>
                                    <Input
                                        type="number"
                                        value={tableCols}
                                        onChange={(e) => setTableCols(Number(e.target.value))}
                                        min="1"
                                        max="10"
                                    />
                                </FormControl>
                            </HStack>
                            <HStack spacing={2}>
                                <Button colorScheme="blue" onClick={insertTable}>
                                    삽입
                                </Button>
                                <Button variant="outline" onClick={onTableModalClose}>
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

export default AdvancedEditor;
