/**
 * 🎨 3D 시각화 및 인터랙티브 차트
 * 
 * Three.js 기반 3D 시각화, 인터랙티브 차트, 데이터 시각화를 제공하는
 * 차세대 시각화 시스템
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-10-02
 */

import React, {
    useState,
    useEffect,
    useCallback,
    useRef,
    useMemo,
    Suspense
} from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    Card,
    CardContent,
    Slider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    useTheme
} from '@mui/material';
import {
    ThreeDRotation as ThreeDIcon,
    BarChart as ChartIcon,
    PieChart as PieIcon,
    Timeline as TimelineIcon,
    ScatterPlot as ScatterIcon,
    TrendingUp as TrendIcon,
    Fullscreen as FullscreenIcon,
    FullscreenExit as FullscreenExitIcon,
    CameraAlt as CameraIcon,
    VideoCall as VideoIcon,
    Settings as SettingsIcon,
    Refresh as RefreshIcon,
    Download as DownloadIcon,
    Share as ShareIcon,
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    Speed as SpeedIcon
} from '@mui/icons-material';
// import { Canvas, useFrame, useThree } from '@react-three/fiber';
// import {
//     OrbitControls,
//     Text,
//     Box as ThreeBox,
//     Sphere,
//     Cylinder,
//     Plane,
//     Html,
//     Environment,
//     PerspectiveCamera,
//     Stats
// } from '@react-three/drei';
import { styled } from '@mui/system';
// import * as THREE from 'three';

// 3D 시각화 타입 정의
export type ChartType = '3d-bar' | '3d-pie' | '3d-scatter' | '3d-surface' | '3d-network' | '3d-timeline';
export type AnimationType = 'rotate' | 'bounce' | 'pulse' | 'wave' | 'spiral' | 'none';
export type InteractionMode = 'orbit' | 'fly' | 'first-person' | 'fixed';

export interface DataPoint {
    id: string;
    x: number;
    y: number;
    z: number;
    value: number;
    label: string;
    color?: string;
    metadata?: Record<string, any>;
}

export interface ChartConfig {
    type: ChartType;
    title: string;
    data: DataPoint[];
    animation: AnimationType;
    interaction: InteractionMode;
    colors: string[];
    dimensions: {
        width: number;
        height: number;
        depth: number;
    };
    camera: {
        position: [number, number, number];
        target: [number, number, number];
    };
    lighting: {
        ambient: number;
        directional: number;
        shadows: boolean;
    };
    effects: {
        fog: boolean;
        bloom: boolean;
        particles: boolean;
    };
}

// 스타일드 컴포넌트
const VisualizationContainer = styled(Paper)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative'
}));

const CanvasContainer = styled(Box)(({ theme }) => ({
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden'
}));

const ControlPanel = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: theme.spacing(2),
    right: theme.spacing(2),
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1)
}));

const InfoPanel = styled(Card)(({ theme }) => ({
    position: 'absolute',
    bottom: theme.spacing(2),
    left: theme.spacing(2),
    zIndex: 10,
    minWidth: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white'
}));

// 3D 바 차트 컴포넌트
const Bar3D: React.FC<{
    position: [number, number, number];
    height: number;
    color: string;
    label: string;
    onClick?: () => void;
}> = ({ position, height, color, label, onClick }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <Box
            sx={{
                position: 'absolute',
                left: position[0] * 50,
                top: position[1] * 50,
                width: 40,
                height: height * 10,
                backgroundColor: hovered ? '#ffffff' : color,
                borderRadius: 1,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'scale(1.1)',
                }
            }}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >

            <Typography
                variant="caption"
                sx={{
                    position: 'absolute',
                    top: -20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: 'white',
                    fontSize: '12px',
                    textAlign: 'center',
                    pointerEvents: 'none'
                }}
            >
                {label}
            </Typography>
        </Box>
    );
};

// 3D 파이 차트 컴포넌트 (대체)
const Pie3D: React.FC<{ data: DataPoint[] }> = ({ data }) => {
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {data.map((item, index) => (
                <Box
                    key={item.id}
                    sx={{
                        width: 20,
                        height: 20,
                        backgroundColor: item.color || '#3f51b5',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '10px'
                    }}
                >
                    {index + 1}
                </Box>
            ))}
        </Box>
    );
};

// 3D 산점도 컴포넌트 (대체)
const Scatter3D: React.FC<{ data: DataPoint[] }> = ({ data }) => {
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {data.map((point) => (
                <Box
                    key={point.id}
                    sx={{
                        width: 20,
                        height: 20,
                        backgroundColor: point.color || '#ff6b6b',
                        borderRadius: '50%',
                        opacity: 0.8
                    }}
                />
            ))}
        </Box>
    );
};

// 3D 네트워크 그래프 컴포넌트 (대체)
const Network3D: React.FC<{ data: DataPoint[] }> = ({ data }) => {
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {data.map((node) => (
                <Box
                    key={node.id}
                    sx={{
                        width: 20,
                        height: 20,
                        backgroundColor: node.color || '#4caf50',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '10px'
                    }}
                >
                    {node.id}
                </Box>
            ))}

        </Box>
    );
};

// 파티클 시스템 컴포넌트 (대체)
const ParticleSystem: React.FC<{ count: number }> = ({ count }) => {
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Array.from({ length: Math.min(count, 50) }, (_, index) => (
                <Box
                    key={index}
                    sx={{
                        width: 4,
                        height: 4,
                        backgroundColor: '#ffffff',
                        borderRadius: '50%',
                        opacity: 0.6
                    }}
                />
            ))}
        </Box>
    );
};


// 메인 3D 시각화 컴포넌트
export const Interactive3DVisualization: React.FC<{
    config: ChartConfig;
    onDataPointClick?: (point: DataPoint) => void;
}> = ({ config, onDataPointClick }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);
    const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [cameraPosition, setCameraPosition] = useState<[number, number, number]>(config.camera.position);
    const [animationSpeed, setAnimationSpeed] = useState(1);

    const theme = useTheme();

    const handleDataPointClick = useCallback((point: DataPoint) => {
        setSelectedPoint(point);
        onDataPointClick?.(point);
    }, [onDataPointClick]);

    const renderChart = () => {
        switch (config.type) {
            case '3d-bar':
                return (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {config.data.map((point, index) => (
                            <Bar3D
                                key={point.id}
                                position={[point.x, 0, point.z]}
                                height={point.value}
                                color={point.color || config.colors[index % config.colors.length]}
                                label={point.label}
                                onClick={() => handleDataPointClick(point)}
                            />
                        ))}
                    </Box>
                );

            case '3d-pie':
                return <Pie3D data={config.data} />;

            case '3d-scatter':
                return <Scatter3D data={config.data} />;

            case '3d-network':
                return <Network3D data={config.data} />;

            default:
                return <Scatter3D data={config.data} />;
        }
    };

    const Scene: React.FC = () => {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    3D 시각화 (대체 모드)
                </Typography>
                {renderChart()}
            </Box>
        );
    };



    return (
        <VisualizationContainer>
            {/* 헤더 */}
            <Box p={2} borderBottom={1} borderColor="divider">
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">{config.title}</Typography>
                    <Box display="flex" gap={1}>
                        <Chip
                            icon={<ThreeDIcon />}
                            label={config.type}
                            size="small"
                            color="primary"
                        />
                        <Chip
                            label={`${config.data.length} 데이터`}
                            size="small"
                            variant="outlined"
                        />
                    </Box>
                </Box>
            </Box>

            {/* 3D 캔버스 */}
            <CanvasContainer>
                <Suspense fallback={
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <CircularProgress />
                    </Box>
                }>
                    <Scene />
                </Suspense>

                {/* 컨트롤 패널 */}
                <ControlPanel>
                    <Tooltip title={isFullscreen ? "전체화면 종료" : "전체화면"}>
                        <IconButton
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            sx={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}
                        >
                            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={isPlaying ? "일시정지" : "재생"}>
                        <IconButton
                            onClick={() => setIsPlaying(!isPlaying)}
                            sx={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}
                        >
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="설정">
                        <IconButton
                            onClick={() => setShowSettings(true)}
                            sx={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}
                        >
                            <SettingsIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="스크린샷">
                        <IconButton
                            sx={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}
                        >
                            <CameraIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="공유">
                        <IconButton
                            sx={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}
                        >
                            <ShareIcon />
                        </IconButton>
                    </Tooltip>
                </ControlPanel>

                {/* 정보 패널 */}
                {selectedPoint && (
                    <InfoPanel>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                {selectedPoint.label}
                            </Typography>
                            <Typography variant="body2">
                                값: {selectedPoint.value}
                            </Typography>
                            <Typography variant="body2">
                                위치: ({selectedPoint.x}, {selectedPoint.y}, {selectedPoint.z})
                            </Typography>
                            {selectedPoint.metadata && (
                                <Box mt={1}>
                                    {Object.entries(selectedPoint.metadata).map(([key, value]) => (
                                        <Typography key={key} variant="caption" display="block">
                                            {key}: {value}
                                        </Typography>
                                    ))}
                                </Box>
                            )}
                        </CardContent>
                    </InfoPanel>
                )}
            </CanvasContainer>

            {/* 설정 다이얼로그 */}
            <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="sm" fullWidth>
                <DialogTitle>3D 시각화 설정</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={3} pt={1}>
                        <FormControl fullWidth>
                            <InputLabel>차트 타입</InputLabel>
                            <Select value={config.type} label="차트 타입">
                                <MenuItem value="3d-bar">3D 바 차트</MenuItem>
                                <MenuItem value="3d-pie">3D 파이 차트</MenuItem>
                                <MenuItem value="3d-scatter">3D 산점도</MenuItem>
                                <MenuItem value="3d-network">3D 네트워크</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>애니메이션</InputLabel>
                            <Select value={config.animation} label="애니메이션">
                                <MenuItem value="none">없음</MenuItem>
                                <MenuItem value="rotate">회전</MenuItem>
                                <MenuItem value="bounce">바운스</MenuItem>
                                <MenuItem value="wave">웨이브</MenuItem>
                            </Select>
                        </FormControl>

                        <Box>
                            <Typography gutterBottom>애니메이션 속도</Typography>
                            <Slider
                                value={animationSpeed}
                                onChange={(_, value) => setAnimationSpeed(value as number)}
                                min={0.1}
                                max={3}
                                step={0.1}
                                marks={[
                                    { value: 0.5, label: '느림' },
                                    { value: 1, label: '보통' },
                                    { value: 2, label: '빠름' }
                                ]}
                            />
                        </Box>

                        <Box>
                            <Typography gutterBottom>주변광 강도</Typography>
                            <Slider
                                value={config.lighting.ambient}
                                min={0}
                                max={2}
                                step={0.1}
                            />
                        </Box>

                        <Box>
                            <Typography gutterBottom>직사광 강도</Typography>
                            <Slider
                                value={config.lighting.directional}
                                min={0}
                                max={3}
                                step={0.1}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowSettings(false)}>취소</Button>
                    <Button variant="contained">적용</Button>
                </DialogActions>
            </Dialog>
        </VisualizationContainer>
    );
};

// 차트 빌더 컴포넌트
export const ChartBuilder: React.FC<{
    onConfigChange: (config: ChartConfig) => void;
}> = ({ onConfigChange }) => {
    const [config, setConfig] = useState<ChartConfig>({
        type: '3d-bar',
        title: '새 3D 차트',
        data: [],
        animation: 'rotate',
        interaction: 'orbit',
        colors: ['#3f51b5', '#f50057', '#ff9800', '#4caf50', '#9c27b0'],
        dimensions: { width: 10, height: 10, depth: 10 },
        camera: { position: [10, 10, 10], target: [0, 0, 0] },
        lighting: { ambient: 0.5, directional: 1, shadows: true },
        effects: { fog: false, bloom: false, particles: false }
    });

    const generateSampleData = useCallback((type: ChartType) => {
        const sampleData: DataPoint[] = [];

        switch (type) {
            case '3d-bar':
                for (let i = 0; i < 10; i++) {
                    sampleData.push({
                        id: `bar-${i}`,
                        x: (i % 5) * 2 - 4,
                        y: 0,
                        z: Math.floor(i / 5) * 2 - 1,
                        value: Math.random() * 5 + 1,
                        label: `항목 ${i + 1}`,
                        color: config.colors[i % config.colors.length]
                    });
                }
                break;

            case '3d-scatter':
                for (let i = 0; i < 50; i++) {
                    sampleData.push({
                        id: `point-${i}`,
                        x: (Math.random() - 0.5) * 10,
                        y: (Math.random() - 0.5) * 10,
                        z: (Math.random() - 0.5) * 10,
                        value: Math.random() * 3 + 0.5,
                        label: `포인트 ${i + 1}`,
                        color: config.colors[i % config.colors.length]
                    });
                }
                break;

            case '3d-network':
                for (let i = 0; i < 20; i++) {
                    sampleData.push({
                        id: `node-${i}`,
                        x: (Math.random() - 0.5) * 8,
                        y: (Math.random() - 0.5) * 8,
                        z: (Math.random() - 0.5) * 8,
                        value: Math.random() * 2 + 0.5,
                        label: `노드 ${i + 1}`,
                        color: config.colors[i % config.colors.length]
                    });
                }
                break;
        }

        return sampleData;
    }, [config.colors]);

    const handleTypeChange = (type: ChartType) => {
        const newConfig = {
            ...config,
            type,
            data: generateSampleData(type)
        };
        setConfig(newConfig);
        onConfigChange(newConfig);
    };

    useEffect(() => {
        const initialData = generateSampleData(config.type);
        const initialConfig = { ...config, data: initialData };
        setConfig(initialConfig);
        onConfigChange(initialConfig);
    }, []);

    return (
        <Box p={2}>
            <Typography variant="h6" gutterBottom>
                3D 차트 빌더
            </Typography>

            <Box display="flex" gap={2} flexWrap="wrap">
                {(['3d-bar', '3d-pie', '3d-scatter', '3d-network'] as ChartType[]).map(type => (
                    <Button
                        key={type}
                        variant={config.type === type ? 'contained' : 'outlined'}
                        onClick={() => handleTypeChange(type)}
                        startIcon={
                            type === '3d-bar' ? <ChartIcon /> :
                                type === '3d-pie' ? <PieIcon /> :
                                    type === '3d-scatter' ? <ScatterIcon /> :
                                        <ThreeDIcon />
                        }
                    >
                        {type === '3d-bar' && '3D 바'}
                        {type === '3d-pie' && '3D 파이'}
                        {type === '3d-scatter' && '3D 산점도'}
                        {type === '3d-network' && '3D 네트워크'}
                    </Button>
                ))}
            </Box>
        </Box>
    );
};

export default Interactive3DVisualization;
