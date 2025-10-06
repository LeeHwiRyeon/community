/**
 * 🌍 국제화 시스템 컴포넌트
 * 
 * 25개 언어 지원, RTL 언어 지원, 현지화 관리 시스템
 * 
 * @author AUTOAGENTS Manager
 * @version 2.0.0
 * @created 2025-01-02
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Tooltip,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    LinearProgress,
    Badge,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Tabs,
    Tab,
    Switch,
    FormControlLabel,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Rating,
    Avatar
} from '@mui/material';
import {
    Language,
    Translate,
    Public,
    Flag,
    CheckCircle,
    Warning,
    Error,
    Info,
    Refresh,
    Add,
    Edit,
    Delete,
    Download,
    Upload,
    Visibility,
    ExpandMore,
    AutoFixHigh,
    Speed,
    CheckCircle as Accuracy,
    TrendingUp,
    Assessment,
    Timeline,
    Security,
    Block,
    Person,
    Message,
    Flag as FlagIcon
} from '@mui/icons-material';

// 타입 정의
interface LanguageConfig {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
    rtl: boolean;
    enabled: boolean;
    completionRate: number;
    lastUpdated: string;
    translatorCount: number;
    quality: number;
}

interface TranslationKey {
    id: string;
    key: string;
    category: string;
    context: string;
    translations: Record<string, string>;
    status: 'complete' | 'partial' | 'missing';
    lastModified: string;
    modifiedBy: string;
}

interface TranslationStats {
    totalKeys: number;
    completedTranslations: number;
    missingTranslations: number;
    qualityScore: number;
    topLanguages: Array<{
        language: string;
        completionRate: number;
        quality: number;
        userCount: number;
    }>;
    translationTrends: Array<{
        date: string;
        completed: number;
        updated: number;
        newKeys: number;
    }>;
}

interface LocalizationConfig {
    defaultLanguage: string;
    fallbackLanguage: string;
    autoDetect: boolean;
    enableRTL: boolean;
    enablePluralization: boolean;
    enableContext: boolean;
    enableQualityCheck: boolean;
    enableAutoTranslation: boolean;
    translationAPI: string;
    qualityThreshold: number;
}

const InternationalizationSystem: React.FC = () => {
    const [languages, setLanguages] = useState<LanguageConfig[]>([]);
    const [translations, setTranslations] = useState<TranslationKey[]>([]);
    const [stats, setStats] = useState<TranslationStats | null>(null);
    const [config, setConfig] = useState<LocalizationConfig>({
        defaultLanguage: 'ko',
        fallbackLanguage: 'en',
        autoDetect: true,
        enableRTL: true,
        enablePluralization: true,
        enableContext: true,
        enableQualityCheck: true,
        enableAutoTranslation: true,
        translationAPI: 'google',
        qualityThreshold: 80
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState('ko');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [activeTab, setActiveTab] = useState(0);
    const [showTranslationDialog, setShowTranslationDialog] = useState(false);
    const [editingTranslation, setEditingTranslation] = useState<TranslationKey | null>(null);

    useEffect(() => {
        fetchI18nData();
    }, []);

    const fetchI18nData = async () => {
        try {
            setLoading(true);
            setError(null);

            // 모의 데이터 생성
            const mockLanguages: LanguageConfig[] = [
                { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', rtl: false, enabled: true, completionRate: 100, lastUpdated: '2025-01-02T00:00:00Z', translatorCount: 5, quality: 98 },
                { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false, enabled: true, completionRate: 100, lastUpdated: '2025-01-02T00:00:00Z', translatorCount: 8, quality: 100 },
                { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', rtl: false, enabled: true, completionRate: 95, lastUpdated: '2025-01-01T00:00:00Z', translatorCount: 3, quality: 96 },
                { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳', rtl: false, enabled: true, completionRate: 92, lastUpdated: '2025-01-01T00:00:00Z', translatorCount: 4, quality: 94 },
                { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼', rtl: false, enabled: true, completionRate: 88, lastUpdated: '2024-12-31T00:00:00Z', translatorCount: 2, quality: 92 },
                { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false, enabled: true, completionRate: 85, lastUpdated: '2024-12-31T00:00:00Z', translatorCount: 3, quality: 90 },
                { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false, enabled: true, completionRate: 82, lastUpdated: '2024-12-30T00:00:00Z', translatorCount: 2, quality: 88 },
                { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false, enabled: true, completionRate: 78, lastUpdated: '2024-12-30T00:00:00Z', translatorCount: 2, quality: 86 },
                { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true, enabled: true, completionRate: 75, lastUpdated: '2024-12-29T00:00:00Z', translatorCount: 2, quality: 84 },
                { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', rtl: false, enabled: true, completionRate: 70, lastUpdated: '2024-12-29T00:00:00Z', translatorCount: 1, quality: 82 }
            ];

            const mockTranslations: TranslationKey[] = [
                {
                    id: '1',
                    key: 'common.welcome',
                    category: 'common',
                    context: 'Welcome message on homepage',
                    translations: {
                        ko: '환영합니다',
                        en: 'Welcome',
                        ja: 'ようこそ',
                        'zh-CN': '欢迎',
                        'zh-TW': '歡迎',
                        es: 'Bienvenido',
                        fr: 'Bienvenue',
                        de: 'Willkommen',
                        ar: 'أهلاً وسهلاً',
                        hi: 'स्वागत है'
                    },
                    status: 'complete',
                    lastModified: '2025-01-02T00:00:00Z',
                    modifiedBy: 'translator1'
                },
                {
                    id: '2',
                    key: 'common.login',
                    category: 'common',
                    context: 'Login button text',
                    translations: {
                        ko: '로그인',
                        en: 'Login',
                        ja: 'ログイン',
                        'zh-CN': '登录',
                        'zh-TW': '登入',
                        es: 'Iniciar sesión',
                        fr: 'Se connecter',
                        de: 'Anmelden',
                        ar: 'تسجيل الدخول',
                        hi: 'लॉग इन करें'
                    },
                    status: 'complete',
                    lastModified: '2025-01-02T00:00:00Z',
                    modifiedBy: 'translator1'
                },
                {
                    id: '3',
                    key: 'community.create_post',
                    category: 'community',
                    context: 'Button to create new post',
                    translations: {
                        ko: '게시물 작성',
                        en: 'Create Post',
                        ja: '投稿を作成',
                        'zh-CN': '创建帖子',
                        'zh-TW': '建立貼文',
                        es: 'Crear publicación',
                        fr: 'Créer un post',
                        de: 'Beitrag erstellen',
                        ar: 'إنشاء منشور',
                        hi: 'पोस्ट बनाएं'
                    },
                    status: 'complete',
                    lastModified: '2025-01-01T00:00:00Z',
                    modifiedBy: 'translator2'
                },
                {
                    id: '4',
                    key: 'game.leaderboard',
                    category: 'game',
                    context: 'Leaderboard section title',
                    translations: {
                        ko: '리더보드',
                        en: 'Leaderboard',
                        ja: 'リーダーボード',
                        'zh-CN': '排行榜',
                        'zh-TW': '排行榜',
                        es: 'Tabla de clasificación',
                        fr: 'Classement',
                        de: 'Bestenliste',
                        ar: 'لوحة المتصدرين',
                        hi: 'लीडरबोर्ड'
                    },
                    status: 'complete',
                    lastModified: '2025-01-01T00:00:00Z',
                    modifiedBy: 'translator3'
                },
                {
                    id: '5',
                    key: 'analytics.user_behavior',
                    category: 'analytics',
                    context: 'Analytics section for user behavior',
                    translations: {
                        ko: '사용자 행동 분석',
                        en: 'User Behavior Analytics',
                        ja: 'ユーザー行動分析',
                        'zh-CN': '用户行为分析',
                        'zh-TW': '使用者行為分析',
                        es: 'Análisis de comportamiento del usuario',
                        fr: 'Analyse du comportement utilisateur',
                        de: 'Benutzerverhalten-Analyse',
                        ar: 'تحليل سلوك المستخدم',
                        hi: 'उपयोगकर्ता व्यवहार विश्लेषण'
                    },
                    status: 'complete',
                    lastModified: '2024-12-31T00:00:00Z',
                    modifiedBy: 'translator1'
                }
            ];

            const mockStats: TranslationStats = {
                totalKeys: 1250,
                completedTranslations: 11250,
                missingTranslations: 250,
                qualityScore: 94.2,
                topLanguages: [
                    { language: 'Korean', completionRate: 100, quality: 98, userCount: 15420 },
                    { language: 'English', completionRate: 100, quality: 100, userCount: 8930 },
                    { language: 'Japanese', completionRate: 95, quality: 96, userCount: 3200 },
                    { language: 'Chinese (Simplified)', completionRate: 92, quality: 94, userCount: 2800 },
                    { language: 'Spanish', completionRate: 85, quality: 90, userCount: 2100 }
                ],
                translationTrends: [
                    { date: '2025-01-01', completed: 45, updated: 23, newKeys: 12 },
                    { date: '2025-01-02', completed: 52, updated: 31, newKeys: 8 },
                    { date: '2025-01-03', completed: 38, updated: 19, newKeys: 15 },
                    { date: '2025-01-04', completed: 41, updated: 27, newKeys: 6 },
                    { date: '2025-01-05', completed: 29, updated: 14, newKeys: 9 }
                ]
            };

            // API 호출 시뮬레이션 지연
            await new Promise(resolve => setTimeout(resolve, 1000));

            setLanguages(mockLanguages);
            setTranslations(mockTranslations);
            setStats(mockStats);
        } catch (err) {
            setError('국제화 데이터를 불러오는 중 오류가 발생했습니다.');
            console.error('I18n fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLanguageToggle = (languageCode: string) => {
        setLanguages(prev => prev.map(lang =>
            lang.code === languageCode ? { ...lang, enabled: !lang.enabled } : lang
        ));
    };

    const handleConfigChange = (key: keyof LocalizationConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleTranslationUpdate = (keyId: string, languageCode: string, newTranslation: string) => {
        setTranslations(prev => prev.map(translation =>
            translation.id === keyId
                ? {
                    ...translation,
                    translations: { ...translation.translations, [languageCode]: newTranslation },
                    lastModified: new Date().toISOString(),
                    modifiedBy: 'current_user'
                }
                : translation
        ));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'complete': return 'success';
            case 'partial': return 'warning';
            case 'missing': return 'error';
            default: return 'default';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'complete': return <CheckCircle color="success" />;
            case 'partial': return <Warning color="warning" />;
            case 'missing': return <Error color="error" />;
            default: return <Info />;
        }
    };

    const filteredTranslations = translations.filter(translation => {
        if (selectedCategory !== 'all' && translation.category !== selectedCategory) {
            return false;
        }
        return true;
    });

    if (loading && !stats) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography variant="h6">국제화 시스템을 불러오는 중...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
                <Button onClick={fetchI18nData} sx={{ ml: 2 }}>
                    다시 시도
                </Button>
            </Alert>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* 헤더 */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    🌍 국제화 시스템
                </Typography>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchI18nData}
                        disabled={loading}
                    >
                        새로고침
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<Download />}
                        color="primary"
                    >
                        번역 내보내기
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<Upload />}
                        color="secondary"
                    >
                        번역 가져오기
                    </Button>
                </Box>
            </Box>

            {/* 통계 카드 */}
            {stats && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
                    <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            총 번역 키
                                        </Typography>
                                        <Typography variant="h4" component="div">
                                            {stats.totalKeys.toLocaleString()}
                                        </Typography>
                                    </Box>
                                    <Language sx={{ fontSize: 40, color: 'primary.main' }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            완료된 번역
                                        </Typography>
                                        <Typography variant="h4" component="div">
                                            {stats.completedTranslations.toLocaleString()}
                                        </Typography>
                                    </Box>
                                    <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            번역 품질
                                        </Typography>
                                        <Typography variant="h4" component="div">
                                            {stats.qualityScore}%
                                        </Typography>
                                    </Box>
                                    <Accuracy sx={{ fontSize: 40, color: 'info.main' }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            지원 언어
                                        </Typography>
                                        <Typography variant="h4" component="div">
                                            {languages.length}
                                        </Typography>
                                    </Box>
                                    <Public sx={{ fontSize: 40, color: 'warning.main' }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            )}

            {/* 설정 패널 */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        ⚙️ 국제화 설정
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.autoDetect}
                                        onChange={(e) => handleConfigChange('autoDetect', e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="자동 언어 감지"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.enableRTL}
                                        onChange={(e) => handleConfigChange('enableRTL', e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="RTL 언어 지원"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.enablePluralization}
                                        onChange={(e) => handleConfigChange('enablePluralization', e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="복수형 지원"
                            />
                        </Box>
                        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.enableContext}
                                        onChange={(e) => handleConfigChange('enableContext', e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="컨텍스트 지원"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.enableQualityCheck}
                                        onChange={(e) => handleConfigChange('enableQualityCheck', e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="품질 검사"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.enableAutoTranslation}
                                        onChange={(e) => handleConfigChange('enableAutoTranslation', e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="자동 번역"
                            />
                        </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>기본 언어</InputLabel>
                                <Select
                                    value={config.defaultLanguage}
                                    onChange={(e) => handleConfigChange('defaultLanguage', e.target.value)}
                                    label="기본 언어"
                                >
                                    {languages.map(lang => (
                                        <MenuItem key={lang.code} value={lang.code}>
                                            {lang.flag} {lang.nativeName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>폴백 언어</InputLabel>
                                <Select
                                    value={config.fallbackLanguage}
                                    onChange={(e) => handleConfigChange('fallbackLanguage', e.target.value)}
                                    label="폴백 언어"
                                >
                                    {languages.map(lang => (
                                        <MenuItem key={lang.code} value={lang.code}>
                                            {lang.flag} {lang.nativeName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>번역 API</InputLabel>
                                <Select
                                    value={config.translationAPI}
                                    onChange={(e) => handleConfigChange('translationAPI', e.target.value)}
                                    label="번역 API"
                                >
                                    <MenuItem value="google">Google Translate</MenuItem>
                                    <MenuItem value="azure">Azure Translator</MenuItem>
                                    <MenuItem value="aws">AWS Translate</MenuItem>
                                    <MenuItem value="deepl">DeepL</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* 탭 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                    <Tab label="언어 관리" />
                    <Tab label="번역 관리" />
                    <Tab label="번역 통계" />
                </Tabs>
            </Box>

            {/* 언어 관리 탭 */}
            {activeTab === 0 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            🌐 지원 언어 ({languages.length}개)
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>언어</TableCell>
                                        <TableCell>RTL</TableCell>
                                        <TableCell>완성도</TableCell>
                                        <TableCell>품질</TableCell>
                                        <TableCell>번역자</TableCell>
                                        <TableCell>마지막 업데이트</TableCell>
                                        <TableCell>상태</TableCell>
                                        <TableCell>작업</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {languages.map((language) => (
                                        <TableRow key={language.code}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Typography variant="h6" sx={{ mr: 1 }}>
                                                        {language.flag}
                                                    </Typography>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                            {language.nativeName}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {language.name}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                {language.rtl ? (
                                                    <Chip label="RTL" size="small" color="warning" />
                                                ) : (
                                                    <Chip label="LTR" size="small" color="success" />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={language.completionRate}
                                                        sx={{ width: 60, height: 6, borderRadius: 3, mr: 1 }}
                                                    />
                                                    <Typography variant="body2">
                                                        {language.completionRate}%
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Rating value={language.quality / 20} readOnly size="small" />
                                            </TableCell>
                                            <TableCell>
                                                <Badge badgeContent={language.translatorCount} color="primary">
                                                    <Typography variant="body2">
                                                        {language.translatorCount}명
                                                    </Typography>
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="textSecondary">
                                                    {new Date(language.lastUpdated).toLocaleDateString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Switch
                                                    checked={language.enabled}
                                                    onChange={() => handleLanguageToggle(language.code)}
                                                    color="primary"
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <IconButton size="small">
                                                    <Edit />
                                                </IconButton>
                                                <IconButton size="small" color="error">
                                                    <Delete />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {/* 번역 관리 탭 */}
            {activeTab === 1 && (
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                📝 번역 관리 ({filteredTranslations.length}개)
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>카테고리</InputLabel>
                                    <Select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        label="카테고리"
                                    >
                                        <MenuItem value="all">전체</MenuItem>
                                        <MenuItem value="common">공통</MenuItem>
                                        <MenuItem value="community">커뮤니티</MenuItem>
                                        <MenuItem value="game">게임</MenuItem>
                                        <MenuItem value="analytics">분석</MenuItem>
                                        <MenuItem value="security">보안</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>언어</InputLabel>
                                    <Select
                                        value={selectedLanguage}
                                        onChange={(e) => setSelectedLanguage(e.target.value)}
                                        label="언어"
                                    >
                                        {languages.map(lang => (
                                            <MenuItem key={lang.code} value={lang.code}>
                                                {lang.flag} {lang.nativeName}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>

                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>키</TableCell>
                                        <TableCell>카테고리</TableCell>
                                        <TableCell>컨텍스트</TableCell>
                                        <TableCell>번역 상태</TableCell>
                                        <TableCell>번역 내용</TableCell>
                                        <TableCell>마지막 수정</TableCell>
                                        <TableCell>수정자</TableCell>
                                        <TableCell>작업</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredTranslations.map((translation) => (
                                        <TableRow key={translation.id}>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                                                    {translation.key}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={translation.category} size="small" color="primary" />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="textSecondary">
                                                    {translation.context}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    {getStatusIcon(translation.status)}
                                                    <Typography variant="body2" sx={{ ml: 1 }}>
                                                        {translation.status}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {translation.translations[selectedLanguage] || '번역 없음'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="textSecondary">
                                                    {new Date(translation.lastModified).toLocaleDateString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="textSecondary">
                                                    {translation.modifiedBy}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setEditingTranslation(translation);
                                                        setShowTranslationDialog(true);
                                                    }}
                                                    color="info"
                                                >
                                                    <Edit />
                                                </IconButton>
                                                <IconButton size="small" color="error">
                                                    <Delete />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {/* 번역 통계 탭 */}
            {activeTab === 2 && stats && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    📊 언어별 완성도
                                </Typography>
                                <List>
                                    {stats.topLanguages.map((lang, index) => (
                                        <ListItem key={index}>
                                            <ListItemText
                                                primary={lang.language}
                                                secondary={`완성도: ${lang.completionRate}%, 품질: ${lang.quality}%, 사용자: ${lang.userCount.toLocaleString()}명`}
                                            />
                                            <LinearProgress
                                                variant="determinate"
                                                value={lang.completionRate}
                                                sx={{ width: 100, height: 8, borderRadius: 4 }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    📈 번역 진행 상황
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        완료된 번역
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(stats.completedTranslations / (stats.completedTranslations + stats.missingTranslations)) * 100}
                                            color="success"
                                            sx={{ flexGrow: 1, height: 8, borderRadius: 4, mr: 2 }}
                                        />
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                            {stats.completedTranslations.toLocaleString()}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        누락된 번역
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(stats.missingTranslations / (stats.completedTranslations + stats.missingTranslations)) * 100}
                                            color="error"
                                            sx={{ flexGrow: 1, height: 8, borderRadius: 4, mr: 2 }}
                                        />
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                            {stats.missingTranslations.toLocaleString()}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box>
                                    <Typography variant="body2" color="textSecondary">
                                        전체 품질 점수
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={stats.qualityScore}
                                            color="info"
                                            sx={{ flexGrow: 1, height: 8, borderRadius: 4, mr: 2 }}
                                        />
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                            {stats.qualityScore}%
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            )}

            {/* 번역 편집 다이얼로그 */}
            <Dialog open={showTranslationDialog} onClose={() => setShowTranslationDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>번역 편집</DialogTitle>
                <DialogContent>
                    {editingTranslation && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                {editingTranslation.key}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                {editingTranslation.context}
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            {languages.filter(lang => lang.enabled).map(language => (
                                <Box key={language.code} sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                        {language.flag} {language.nativeName}
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
                                        value={editingTranslation.translations[language.code] || ''}
                                        onChange={(e) => handleTranslationUpdate(editingTranslation.id, language.code, e.target.value)}
                                        placeholder={`${language.nativeName}로 번역하세요...`}
                                        variant="outlined"
                                        size="small"
                                    />
                                </Box>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowTranslationDialog(false)}>취소</Button>
                    <Button
                        onClick={() => {
                            setShowTranslationDialog(false);
                            setEditingTranslation(null);
                        }}
                        color="primary"
                    >
                        저장
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default InternationalizationSystem;
