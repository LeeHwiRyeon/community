import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    Chip,
    LinearProgress,
    Alert,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Switch,
    FormControlLabel,
    Slider
} from '@mui/material';
import {
    SmartToy,
    Psychology,
    AutoAwesome,
    Analytics,
    Security,
    Speed,
    Memory,
    CloudQueue,
    Settings,
    PlayArrow,
    Pause,
    Stop,
    Refresh
} from '@mui/icons-material';

interface AIFeature {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'inactive' | 'pending';
    performance: number;
    category: 'nlp' | 'vision' | 'prediction' | 'optimization' | 'security';
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`ai-tabpanel-${index}`}
            aria-labelledby={`ai-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const AdvancedAIIntegration: React.FC = () => {
    const [value, setValue] = useState(0);
    const [aiFeatures, setAiFeatures] = useState<AIFeature[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState<AIFeature | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [aiSettings, setAiSettings] = useState({
        autoOptimization: true,
        realTimeAnalysis: true,
        predictiveMode: false,
        securityLevel: 5,
        performanceThreshold: 80
    });

    useEffect(() => {
        loadAIFeatures();
    }, []);

    const loadAIFeatures = async () => {
        setLoading(true);
        try {
            // 시뮬레이션된 AI 기능 데이터
            const features: AIFeature[] = [
                {
                    id: 'emotion-analysis',
                    name: '감정 분석 AI',
                    description: '사용자 텍스트와 음성을 분석하여 감정 상태를 실시간으로 파악',
                    status: 'active',
                    performance: 92,
                    category: 'nlp'
                },
                {
                    id: 'content-recommendation',
                    name: '콘텐츠 추천 AI',
                    description: '사용자 행동 패턴을 학습하여 개인화된 콘텐츠 추천',
                    status: 'active',
                    performance: 88,
                    category: 'prediction'
                },
                {
                    id: 'image-recognition',
                    name: '이미지 인식 AI',
                    description: '업로드된 이미지를 분석하여 자동 태깅 및 분류',
                    status: 'active',
                    performance: 95,
                    category: 'vision'
                },
                {
                    id: 'performance-optimizer',
                    name: '성능 최적화 AI',
                    description: '시스템 성능을 실시간 모니터링하고 자동 최적화',
                    status: 'active',
                    performance: 87,
                    category: 'optimization'
                },
                {
                    id: 'security-monitor',
                    name: '보안 모니터링 AI',
                    description: '의심스러운 활동을 감지하고 자동 대응',
                    status: 'active',
                    performance: 94,
                    category: 'security'
                },
                {
                    id: 'chat-moderator',
                    name: '채팅 모더레이션 AI',
                    description: '부적절한 콘텐츠를 실시간으로 감지하고 필터링',
                    status: 'pending',
                    performance: 0,
                    category: 'nlp'
                }
            ];
            setAiFeatures(features);
        } catch (error) {
            console.error('AI 기능 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const handleFeatureToggle = (featureId: string) => {
        setAiFeatures(prev => prev.map(feature =>
            feature.id === featureId
                ? { ...feature, status: feature.status === 'active' ? 'inactive' : 'active' }
                : feature
        ));
    };

    const handleFeatureClick = (feature: AIFeature) => {
        setSelectedFeature(feature);
        setOpenDialog(true);
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'nlp': return <Psychology />;
            case 'vision': return <AutoAwesome />;
            case 'prediction': return <Analytics />;
            case 'optimization': return <Speed />;
            case 'security': return <Security />;
            default: return <SmartToy />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'success';
            case 'inactive': return 'error';
            case 'pending': return 'warning';
            default: return 'default';
        }
    };

    const getPerformanceColor = (performance: number) => {
        if (performance >= 90) return 'success';
        if (performance >= 70) return 'warning';
        return 'error';
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h4" component="h1" gutterBottom>
                🤖 고급 AI 통합 시스템
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Community Platform v1.3의 AI 기능들을 통합 관리하고 최적화합니다.
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleTabChange} aria-label="AI features tabs">
                    <Tab label="AI 기능 관리" icon={<SmartToy />} />
                    <Tab label="성능 모니터링" icon={<Analytics />} />
                    <Tab label="설정" icon={<Settings />} />
                </Tabs>
            </Box>

            <TabPanel value={value} index={0}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {aiFeatures.map((feature) => (
                        <Box sx={{ width: { xs: '100%', md: '33.33%', lg: '25%' }, p: 1 }} key={feature.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 4
                                    }
                                }}
                                onClick={() => handleFeatureClick(feature)}
                            >
                                <CardContent>
                                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                        <Box display="flex" alignItems="center">
                                            {getCategoryIcon(feature.category)}
                                            <Typography variant="h6" sx={{ ml: 1 }}>
                                                {feature.name}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={feature.status}
                                            color={getStatusColor(feature.status) as any}
                                            size="small"
                                        />
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {feature.description}
                                    </Typography>

                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Typography variant="body2">
                                            성능: {feature.performance}%
                                        </Typography>
                                        <LinearProgress
                                            variant="determinate"
                                            value={feature.performance}
                                            color={getPerformanceColor(feature.performance) as any}
                                            sx={{ width: 100, height: 8, borderRadius: 4 }}
                                        />
                                    </Box>

                                    <Box display="flex" justifyContent="flex-end" mt={2}>
                                        <Switch
                                            checked={feature.status === 'active'}
                                            onChange={() => handleFeatureToggle(feature.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Box>
                    ))}
                </Box>
            </TabPanel>

            <TabPanel value={value} index={1}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    전체 AI 성능
                                </Typography>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <Memory sx={{ mr: 1 }} />
                                    <Typography variant="body2">
                                        평균 성능: {Math.round(aiFeatures.reduce((acc, f) => acc + f.performance, 0) / aiFeatures.length)}%
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={Math.round(aiFeatures.reduce((acc, f) => acc + f.performance, 0) / aiFeatures.length)}
                                    sx={{ height: 10, borderRadius: 5 }}
                                />
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    활성 AI 기능
                                </Typography>
                                <List dense>
                                    {aiFeatures.filter(f => f.status === 'active').map((feature) => (
                                        <ListItem key={feature.id}>
                                            <ListItemIcon>
                                                {getCategoryIcon(feature.category)}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={feature.name}
                                                secondary={`성능: ${feature.performance}%`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </TabPanel>

            <TabPanel value={value} index={2}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            AI 시스템 설정
                        </Typography>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={aiSettings.autoOptimization}
                                    onChange={(e) => setAiSettings(prev => ({ ...prev, autoOptimization: e.target.checked }))}
                                />
                            }
                            label="자동 최적화 활성화"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={aiSettings.realTimeAnalysis}
                                    onChange={(e) => setAiSettings(prev => ({ ...prev, realTimeAnalysis: e.target.checked }))}
                                />
                            }
                            label="실시간 분석 활성화"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={aiSettings.predictiveMode}
                                    onChange={(e) => setAiSettings(prev => ({ ...prev, predictiveMode: e.target.checked }))}
                                />
                            }
                            label="예측 모드 활성화"
                        />

                        <Box sx={{ mt: 3 }}>
                            <Typography gutterBottom>
                                보안 수준: {aiSettings.securityLevel}
                            </Typography>
                            <Slider
                                value={aiSettings.securityLevel}
                                onChange={(e, value) => setAiSettings(prev => ({ ...prev, securityLevel: value as number }))}
                                min={1}
                                max={10}
                                step={1}
                                marks
                                valueLabelDisplay="auto"
                            />
                        </Box>

                        <Box sx={{ mt: 3 }}>
                            <Typography gutterBottom>
                                성능 임계값: {aiSettings.performanceThreshold}%
                            </Typography>
                            <Slider
                                value={aiSettings.performanceThreshold}
                                onChange={(e, value) => setAiSettings(prev => ({ ...prev, performanceThreshold: value as number }))}
                                min={50}
                                max={100}
                                step={5}
                                marks
                                valueLabelDisplay="auto"
                            />
                        </Box>
                    </CardContent>
                </Card>
            </TabPanel>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedFeature?.name} 상세 정보
                </DialogTitle>
                <DialogContent>
                    {selectedFeature && (
                        <Box>
                            <Typography variant="body1" paragraph>
                                {selectedFeature.description}
                            </Typography>

                            <Box display="flex" alignItems="center" mb={2}>
                                <Typography variant="body2" sx={{ mr: 2 }}>
                                    현재 상태:
                                </Typography>
                                <Chip
                                    label={selectedFeature.status}
                                    color={getStatusColor(selectedFeature.status) as any}
                                />
                            </Box>

                            <Box display="flex" alignItems="center" mb={2}>
                                <Typography variant="body2" sx={{ mr: 2 }}>
                                    성능 지표:
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={selectedFeature.performance}
                                    color={getPerformanceColor(selectedFeature.performance) as any}
                                    sx={{ width: 200, height: 8, borderRadius: 4 }}
                                />
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                    {selectedFeature.performance}%
                                </Typography>
                            </Box>

                            <Typography variant="body2" color="text.secondary">
                                카테고리: {selectedFeature.category.toUpperCase()}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>닫기</Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            if (selectedFeature) {
                                handleFeatureToggle(selectedFeature.id);
                                setOpenDialog(false);
                            }
                        }}
                    >
                        {selectedFeature?.status === 'active' ? '비활성화' : '활성화'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdvancedAIIntegration;
