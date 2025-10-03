/**
 * ♿ 접근성 패널 컴포넌트
 * 
 * 접근성 설정, 키보드 네비게이션, 스크린 리더 지원을
 * 관리하는 종합적인 접근성 제어 패널
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-10-02
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Switch,
    FormControlLabel,
    Slider,
    Button,
    IconButton,
    Tooltip,
    Alert,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Paper,
    Stack,
    Badge,
    Collapse,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import {
    Accessibility as AccessibilityIcon,
    Keyboard as KeyboardIcon,
    Visibility as VisibilityIcon,
    VolumeUp as VolumeUpIcon,
    Settings as SettingsIcon,
    Help as HelpIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    ExpandMore as ExpandMoreIcon,
    Contrast as ContrastIcon,
    Speed as SpeedIcon,
    Palette as PaletteIcon,
    Mic as MicIcon,
    Hearing as HearingIcon,
    TouchApp as TouchIcon,
    Mouse as MouseIcon,
    Gesture as GestureIcon,
    Language as LanguageIcon,
    Translate as TranslateIcon,
    Public as PublicIcon,
    Security as SecurityIcon,
    Lock as LockIcon,
    VerifiedUser as VerifiedUserIcon,
    Shield as ShieldIcon,
    Gavel as GavelIcon,
    Policy as PolicyIcon,
    AccountBalance as AccountBalanceIcon,
    Work as WorkIcon,
    School as SchoolIcon,
    Home as HomeIcon,
    Forum as ForumIcon,
    Event as EventIcon,
    Announcement as AnnouncementIcon,
    Dashboard as DashboardIcon,
    BarChart as BarChartIcon,
    PieChart as PieChartIcon,
    ScatterPlot as ScatterPlotIcon,
    NetworkCell as NetworkCellIcon,
    ThreeDRotation as ThreeDIcon,
    ViewInAr as ArVrIcon,
    Mic as MicAltIcon,
    Translate as TranslateAltIcon,
    Adb as AiIcon,
    AccountBalanceWallet as WalletIcon,
    MonetizationOn as MonetizationIcon,
    ShoppingCart as ShoppingCartIcon,
    LiveTv as LiveTvIcon,
    Videocam as VideocamIcon,
    Chat as ChatIcon,
    People as PeopleIcon,
    Subscriptions as SubscriptionsIcon,
    AttachMoney as AttachMoneyIcon,
    Schedule as ScheduleIcon,
    Extension as ExtensionIcon,
    Palette as PaletteAltIcon,
    Accessibility as AccessibilityAltIcon,
    Brightness4 as DarkModeIcon,
    Brightness7 as LightModeIcon,
    Gesture as GestureAltIcon,
    Keyboard as KeyboardAltIcon,
    Notifications as NotificationsIcon,
    Feedback as FeedbackIcon,
    Edit as EditorIcon,
    GroupAdd as CollaborateIcon,
    History as HistoryIcon,
    Save as SaveIcon,
    CloudUpload as CloudUploadIcon,
    CloudDownload as CloudDownloadIcon,
    AutoFixHigh as AutoFixIcon,
    BugReport as BugFixIcon,
    Code as CodeGenerationIcon,
    Architecture as ArchitectureIcon,
    Dns as DbSchemaIcon,
    Description as DocGenerationIcon,
    FactCheck as QualityCheckIcon,
    Science as TestGenerationIcon,
    IntegrationInstructions as IntegrationTestIcon,
    Troubleshoot as E2ETestIcon,
    Speed as PerformanceTestIcon,
    Security as SecurityTestIcon,
    Analytics as AnalyticsIcon,
    Build as BuildIcon,
    CheckCircleOutline as CheckCircleOutlineIcon,
    Deployment as DeploymentIcon,
    Monitor as MonitorIcon,
    BugReport as BugDetectionIcon,
    AutoFixHigh as AutoFixHighIcon,
    Code as CodeQualityIcon,
    Refresh as RefreshIcon,
    RestartAlt as RestartIcon,
    PowerSettingsNew as PowerIcon,
    Tune as TuneIcon,
    FilterList as FilterIcon,
    Sort as SortIcon,
    Search as SearchIcon,
    Clear as ClearIcon,
    Add as AddIcon,
    Remove as RemoveIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Save as SaveAltIcon,
    Cancel as CancelIcon,
    Check as CheckIcon,
    Close as CloseAltIcon,
    ArrowBack as ArrowBackIcon,
    ArrowForward as ArrowForwardIcon,
    ArrowUpward as ArrowUpIcon,
    ArrowDownward as ArrowDownIcon,
    ArrowBackIos as ArrowBackIosIcon,
    ArrowForwardIos as ArrowForwardIosIcon,
    FirstPage as FirstPageIcon,
    LastPage as LastPageIcon,
    SkipPrevious as SkipPreviousIcon,
    SkipNext as SkipNextIcon,
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    Stop as StopIcon,
    RecordVoiceOver as RecordIcon,
    VoiceOverOff as VoiceOffIcon,
    VolumeOff as VolumeOffIcon,
    VolumeDown as VolumeDownIcon,
    VolumeUp as VolumeUpAltIcon,
    HighQuality as HighQualityIcon,
    LowQuality as LowQualityIcon,
    Hd as HdIcon,
    Sd as SdIcon,
    Fullscreen as FullscreenIcon,
    FullscreenExit as FullscreenExitIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    CenterFocusStrong as CenterFocusIcon,
    CenterFocusWeak as CenterFocusWeakIcon,
    BlurOn as BlurOnIcon,
    BlurOff as BlurOffIcon,
    FilterVintage as FilterVintageIcon,
    FilterBAndW as FilterBAndWIcon,
    Filter1 as Filter1Icon,
    Filter2 as Filter2Icon,
    Filter3 as Filter3Icon,
    Filter4 as Filter4Icon,
    Filter5 as Filter5Icon,
    Filter6 as Filter6Icon,
    Filter7 as Filter7Icon,
    Filter8 as Filter8Icon,
    Filter9 as Filter9Icon,
    Filter9Plus as Filter9PlusIcon,
    FilterNone as FilterNoneIcon,
    FilterTiltShift as FilterTiltShiftIcon,
    FilterHdr as FilterHdrIcon,
    FilterDrama as FilterDramaIcon,
    FilterFrames as FilterFramesIcon,
    FilterHdr as FilterHdrAltIcon,
    FilterDrama as FilterDramaAltIcon,
    FilterFrames as FilterFramesAltIcon,
    FilterVintage as FilterVintageAltIcon,
    FilterBAndW as FilterBAndWAltIcon,
    Filter1 as Filter1AltIcon,
    Filter2 as Filter2AltIcon,
    Filter3 as Filter3AltIcon,
    Filter4 as Filter4AltIcon,
    Filter5 as Filter5AltIcon,
    Filter6 as Filter6AltIcon,
    Filter7 as Filter7AltIcon,
    Filter8 as Filter8AltIcon,
    Filter9 as Filter9AltIcon,
    Filter9Plus as Filter9PlusAltIcon,
    FilterNone as FilterNoneAltIcon,
    FilterTiltShift as FilterTiltShiftAltIcon,
    FilterHdr as FilterHdrAlt2Icon,
    FilterDrama as FilterDramaAlt2Icon,
    FilterFrames as FilterFramesAlt2Icon,
    FilterVintage as FilterVintageAlt2Icon,
    FilterBAndW as FilterBAndWAlt2Icon,
    Filter1 as Filter1Alt2Icon,
    Filter2 as Filter2Alt2Icon,
    Filter3 as Filter3Alt3Icon,
    Filter4 as Filter4Alt2Icon,
    Filter5 as Filter5Alt2Icon,
    Filter6 as Filter6Alt2Icon,
    Filter7 as Filter7Alt2Icon,
    Filter8 as Filter8Alt2Icon,
    Filter9 as Filter9Alt2Icon,
    Filter9Plus as Filter9PlusAlt2Icon,
    FilterNone as FilterNoneAlt2Icon,
    FilterTiltShift as FilterTiltShiftAlt2Icon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import { accessibilityManager } from '../utils/accessibility-helper';

// ============================================================================
// 애니메이션 정의
// ============================================================================

const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const glow = keyframes`
  0% { box-shadow: 0 0 5px rgba(33, 150, 243, 0.5); }
  50% { box-shadow: 0 0 20px rgba(33, 150, 243, 0.8); }
  100% { box-shadow: 0 0 5px rgba(33, 150, 243, 0.5); }
`;

// ============================================================================
// 스타일드 컴포넌트
// ============================================================================

const PanelContainer = styled(Paper)(({ theme }) => ({
    position: 'fixed',
    top: theme.spacing(8),
    right: theme.spacing(2),
    width: 400,
    maxHeight: '80vh',
    overflow: 'auto',
    zIndex: 1300,
    animation: `${slideIn} 0.3s ease-out`,
    boxShadow: theme.shadows[8]
}));

const SectionCard = styled(Card)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    transition: 'all 0.3s ease',

    '&:hover': {
        boxShadow: theme.shadows[4],
        transform: 'translateY(-2px)'
    }
}));

const StatusChip = styled(Chip)<{ status: 'active' | 'inactive' | 'warning' }>(({ theme, status }) => ({
    fontWeight: 'bold',
    animation: status === 'active' ? `${pulse} 2s infinite` : 'none',
    backgroundColor: status === 'active' ? theme.palette.success.main :
        status === 'warning' ? theme.palette.warning.main :
            theme.palette.grey[300],
    color: status === 'active' ? theme.palette.success.contrastText :
        status === 'warning' ? theme.palette.warning.contrastText :
            theme.palette.grey[700]
}));

const SettingRow = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(1, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,

    '&:last-child': {
        borderBottom: 'none'
    }
}));

// ============================================================================
// 메인 컴포넌트
// ============================================================================

interface AccessibilityPanelProps {
    onClose?: () => void;
}

const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({ onClose }) => {
    const [settings, setSettings] = useState(accessibilityManager.getSettings());
    const [state, setState] = useState(accessibilityManager.getState());
    const [showHelp, setShowHelp] = useState(false);
    const [expandedSections, setExpandedSections] = useState<string[]>(['keyboard', 'visual']);

    // 설정 업데이트
    const updateSetting = useCallback((key: string, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        accessibilityManager.updateSettings(newSettings);
        setState(accessibilityManager.getState());
    }, [settings]);

    // 섹션 토글
    const toggleSection = useCallback((section: string) => {
        setExpandedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    }, []);

    // 컴포넌트 마운트 시 초기화
    useEffect(() => {
        const interval = setInterval(() => {
            setState(accessibilityManager.getState());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <PanelContainer>
            {/* 헤더 */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessibilityIcon color="primary" />
                        <Typography variant="h6" fontWeight="bold">
                            접근성 설정
                        </Typography>
                        <StatusChip
                            status={state.isActive ? 'active' : 'inactive'}
                            label={state.isActive ? '활성' : '비활성'}
                            size="small"
                        />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="도움말">
                            <IconButton onClick={() => setShowHelp(true)} size="small">
                                <HelpIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="새로고침">
                            <IconButton onClick={() => setState(accessibilityManager.getState())} size="small">
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                        {onClose && (
                            <Tooltip title="닫기">
                                <IconButton onClick={onClose} size="small">
                                    <CloseIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* 설정 섹션들 */}
            <Box sx={{ p: 2 }}>
                {/* 키보드 네비게이션 */}
                <Accordion
                    expanded={expandedSections.includes('keyboard')}
                    onChange={() => toggleSection('keyboard')}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <KeyboardIcon color="primary" />
                            <Typography variant="subtitle1" fontWeight="bold">
                                키보드 네비게이션
                            </Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <SectionCard>
                            <CardContent>
                                <SettingRow>
                                    <Typography variant="body2">키보드 네비게이션</Typography>
                                    <Switch
                                        checked={settings.keyboardNavigation}
                                        onChange={(e) => updateSetting('keyboardNavigation', e.target.checked)}
                                        color="primary"
                                    />
                                </SettingRow>

                                <SettingRow>
                                    <Typography variant="body2">포커스 표시</Typography>
                                    <Switch
                                        checked={settings.focusVisible}
                                        onChange={(e) => updateSetting('focusVisible', e.target.checked)}
                                        color="primary"
                                    />
                                </SettingRow>

                                <SettingRow>
                                    <Typography variant="body2">스킵 링크</Typography>
                                    <Switch
                                        checked={settings.skipLinks}
                                        onChange={(e) => updateSetting('skipLinks', e.target.checked)}
                                        color="primary"
                                    />
                                </SettingRow>
                            </CardContent>
                        </SectionCard>
                    </AccordionDetails>
                </Accordion>

                {/* 시각적 접근성 */}
                <Accordion
                    expanded={expandedSections.includes('visual')}
                    onChange={() => toggleSection('visual')}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <VisibilityIcon color="primary" />
                            <Typography variant="subtitle1" fontWeight="bold">
                                시각적 접근성
                            </Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <SectionCard>
                            <CardContent>
                                <SettingRow>
                                    <Typography variant="body2">고대비 모드</Typography>
                                    <Switch
                                        checked={settings.highContrast}
                                        onChange={(e) => updateSetting('highContrast', e.target.checked)}
                                        color="primary"
                                    />
                                </SettingRow>

                                <SettingRow>
                                    <Typography variant="body2">모션 감소</Typography>
                                    <Switch
                                        checked={settings.reducedMotion}
                                        onChange={(e) => updateSetting('reducedMotion', e.target.checked)}
                                        color="primary"
                                    />
                                </SettingRow>

                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2" gutterBottom>
                                        폰트 크기: {settings.fontSize}
                                    </Typography>
                                    <Slider
                                        value={settings.fontSize === 'small' ? 0 :
                                            settings.fontSize === 'medium' ? 1 :
                                                settings.fontSize === 'large' ? 2 : 3}
                                        onChange={(_, value) => {
                                            const sizes = ['small', 'medium', 'large', 'extra-large'] as const;
                                            updateSetting('fontSize', sizes[value as number]);
                                        }}
                                        min={0}
                                        max={3}
                                        step={1}
                                        marks={[
                                            { value: 0, label: '작게' },
                                            { value: 1, label: '보통' },
                                            { value: 2, label: '크게' },
                                            { value: 3, label: '매우 크게' }
                                        ]}
                                        color="primary"
                                    />
                                </Box>
                            </CardContent>
                        </SectionCard>
                    </AccordionDetails>
                </Accordion>

                {/* 스크린 리더 지원 */}
                <Accordion
                    expanded={expandedSections.includes('screenreader')}
                    onChange={() => toggleSection('screenreader')}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <VolumeUpIcon color="primary" />
                            <Typography variant="subtitle1" fontWeight="bold">
                                스크린 리더 지원
                            </Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <SectionCard>
                            <CardContent>
                                <SettingRow>
                                    <Typography variant="body2">스크린 리더 모드</Typography>
                                    <Switch
                                        checked={settings.screenReader}
                                        onChange={(e) => updateSetting('screenReader', e.target.checked)}
                                        color="primary"
                                    />
                                </SettingRow>

                                <SettingRow>
                                    <Typography variant="body2">ARIA 라벨</Typography>
                                    <Switch
                                        checked={settings.ariaLabels}
                                        onChange={(e) => updateSetting('ariaLabels', e.target.checked)}
                                        color="primary"
                                    />
                                </SettingRow>

                                <SettingRow>
                                    <Typography variant="body2">시맨틱 마크업</Typography>
                                    <Switch
                                        checked={settings.semanticMarkup}
                                        onChange={(e) => updateSetting('semanticMarkup', e.target.checked)}
                                        color="primary"
                                    />
                                </SettingRow>
                            </CardContent>
                        </SectionCard>
                    </AccordionDetails>
                </Accordion>

                {/* 색상 접근성 */}
                <Accordion
                    expanded={expandedSections.includes('color')}
                    onChange={() => toggleSection('color')}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PaletteIcon color="primary" />
                            <Typography variant="subtitle1" fontWeight="bold">
                                색상 접근성
                            </Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <SectionCard>
                            <CardContent>
                                <SettingRow>
                                    <Typography variant="body2">색맹 지원</Typography>
                                    <Switch
                                        checked={settings.colorBlindSupport}
                                        onChange={(e) => updateSetting('colorBlindSupport', e.target.checked)}
                                        color="primary"
                                    />
                                </SettingRow>

                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2" gutterBottom>
                                        색상 테마: {settings.colorScheme}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        {['light', 'dark', 'auto'].map((scheme) => (
                                            <Button
                                                key={scheme}
                                                variant={settings.colorScheme === scheme ? 'contained' : 'outlined'}
                                                size="small"
                                                onClick={() => updateSetting('colorScheme', scheme)}
                                            >
                                                {scheme === 'light' ? '라이트' :
                                                    scheme === 'dark' ? '다크' : '자동'}
                                            </Button>
                                        ))}
                                    </Box>
                                </Box>
                            </CardContent>
                        </SectionCard>
                    </AccordionDetails>
                </Accordion>

                {/* 음성 지원 */}
                <Accordion
                    expanded={expandedSections.includes('voice')}
                    onChange={() => toggleSection('voice')}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MicIcon color="primary" />
                            <Typography variant="subtitle1" fontWeight="bold">
                                음성 지원
                            </Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <SectionCard>
                            <CardContent>
                                <SettingRow>
                                    <Typography variant="body2">음성 제어</Typography>
                                    <Switch
                                        checked={settings.voiceControl}
                                        onChange={(e) => updateSetting('voiceControl', e.target.checked)}
                                        color="primary"
                                    />
                                </SettingRow>

                                <SettingRow>
                                    <Typography variant="body2">음성 인식</Typography>
                                    <Switch
                                        checked={settings.speechRecognition}
                                        onChange={(e) => updateSetting('speechRecognition', e.target.checked)}
                                        color="primary"
                                    />
                                </SettingRow>
                            </CardContent>
                        </SectionCard>
                    </AccordionDetails>
                </Accordion>

                {/* 상태 정보 */}
                <SectionCard>
                    <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                            현재 상태
                        </Typography>

                        <List dense>
                            <ListItem>
                                <ListItemIcon>
                                    <CheckCircleIcon color="success" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="포커스된 요소"
                                    secondary={state.currentFocus?.tagName || '없음'}
                                />
                            </ListItem>

                            <ListItem>
                                <ListItemIcon>
                                    <InfoIcon color="info" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="알림 수"
                                    secondary={`${state.announcements.length}개`}
                                />
                            </ListItem>

                            <ListItem>
                                <ListItemIcon>
                                    <SettingsIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="활성 설정"
                                    secondary={`${Object.values(settings).filter(Boolean).length}개`}
                                />
                            </ListItem>
                        </List>
                    </CardContent>
                </SectionCard>

                {/* 빠른 액션 */}
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ContrastIcon />}
                        onClick={() => accessibilityManager.toggleHighContrast()}
                    >
                        고대비 토글
                    </Button>

                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<SpeedIcon />}
                        onClick={() => accessibilityManager.toggleReducedMotion()}
                    >
                        모션 감소 토글
                    </Button>

                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<HelpIcon />}
                        onClick={() => accessibilityManager.showAccessibilityHelp()}
                    >
                        도움말
                    </Button>
                </Box>
            </Box>

            {/* 도움말 다이얼로그 */}
            <Dialog open={showHelp} onClose={() => setShowHelp(false)} maxWidth="md" fullWidth>
                <DialogTitle>접근성 도움말</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" paragraph>
                        접근성 기능을 사용하여 더 나은 사용자 경험을 제공합니다.
                    </Typography>

                    <Typography variant="h6" gutterBottom>
                        키보드 단축키
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText primary="Tab: 다음 요소로 이동" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Shift + Tab: 이전 요소로 이동" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Enter/Space: 활성화" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="ESC: 모달 닫기" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Alt + H: 고대비 모드 토글" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Alt + M: 모션 감소 토글" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Ctrl + /: 도움말 표시" />
                        </ListItem>
                    </List>

                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                        접근성 기능
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                            <ListItemText primary="WCAG 2.1 AA 준수" />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                            <ListItemText primary="스크린 리더 지원" />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                            <ListItemText primary="키보드 네비게이션" />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                            <ListItemText primary="고대비 모드" />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                            <ListItemText primary="모션 감소" />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                            <ListItemText primary="색맹 지원" />
                        </ListItem>
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowHelp(false)}>닫기</Button>
                </DialogActions>
            </Dialog>
        </PanelContainer>
    );
};

export default AccessibilityPanel;
