/**
 * 🥽 AR/VR 컨텐츠 시스템
 * 
 * WebXR 기반 증강현실(AR) 및 가상현실(VR) 컨텐츠 지원
 * 몰입형 컨텐츠 경험을 제공하는 차세대 시스템
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
    CardActions,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Chip,
    Tooltip,
    Slider,
    FormControlLabel,
    Switch,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    useTheme
} from '@mui/material';
import {
    ViewInAr as ARIcon,
    Vrpano as VRIcon,
    CameraAlt as CameraIcon,
    Videocam as VideoIcon,
    ThreeDRotation as ThreeDIcon,
    Fullscreen as FullscreenIcon,
    Settings as SettingsIcon,
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    Stop as StopIcon,
    Refresh as RefreshIcon,
    Share as ShareIcon,
    Download as DownloadIcon,
    Warning as WarningIcon,
    CheckCircle as CheckIcon,
    Error as ErrorIcon
} from '@mui/icons-material';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
    XR,
    Controllers,
    Hands,
    VRButton,
    ARButton,
    useXR,
    useController,
    useHitTest,
    Interactive
} from '@react-three/xr';
import {
    OrbitControls,
    Text,
    Box as ThreeBox,
    Sphere,
    Plane,
    Html,
    Environment,
    PerspectiveCamera,
    useGLTF,
    useTexture
} from '@react-three/drei';
import { styled } from '@mui/system';
import * as THREE from 'three';

// AR/VR 타입 정의
export type XRMode = 'ar' | 'vr' | 'inline';
export type ContentType = '3d-model' | 'video' | 'image' | 'text' | 'interactive' | 'game';
export type InteractionType = 'gaze' | 'hand' | 'controller' | 'voice' | 'gesture';

export interface XRContent {
    id: string;
    type: ContentType;
    title: string;
    description: string;
    url?: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    interactions: InteractionType[];
    metadata: {
        author: string;
        created: Date;
        tags: string[];
        duration?: number;
        fileSize?: number;
    };
}

export interface XRSession {
    id: string;
    mode: XRMode;
    isActive: boolean;
    startTime: Date;
    duration: number;
    contents: XRContent[];
    settings: XRSettings;
}

export interface XRSettings {
    renderQuality: 'low' | 'medium' | 'high' | 'ultra';
    frameRate: 30 | 60 | 90 | 120;
    enableHandTracking: boolean;
    enableEyeTracking: boolean;
    enableSpatialAudio: boolean;
    enableHapticFeedback: boolean;
    safetyBoundary: boolean;
    comfortSettings: {
        locomotion: 'teleport' | 'smooth' | 'room-scale';
        turnSpeed: number;
        snapTurn: boolean;
        vignetteOnMove: boolean;
    };
}

// 스타일드 컴포넌트
const XRContainer = styled(Paper)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative'
}));

const XRCanvas = styled(Box)(({ theme }) => ({
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden'
}));

const XRControls = styled(Box)(({ theme }) => ({
    position: 'absolute',
    bottom: theme.spacing(2),
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    display: 'flex',
    gap: theme.spacing(1),
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1)
}));

const XRStatus = styled(Card)(({ theme }) => ({
    position: 'absolute',
    top: theme.spacing(2),
    left: theme.spacing(2),
    zIndex: 10,
    minWidth: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white'
}));

// WebXR 호환성 체크
const useXRSupport = () => {
    const [support, setSupport] = useState({
        ar: false,
        vr: false,
        immersiveAR: false,
        immersiveVR: false
    });

    useEffect(() => {
        const checkSupport = async () => {
            if ('xr' in navigator) {
                try {
                    const arSupported = await navigator.xr?.isSessionSupported('immersive-ar');
                    const vrSupported = await navigator.xr?.isSessionSupported('immersive-vr');

                    setSupport({
                        ar: !!arSupported,
                        vr: !!vrSupported,
                        immersiveAR: !!arSupported,
                        immersiveVR: !!vrSupported
                    });
                } catch (error) {
                    console.warn('XR support check failed:', error);
                }
            }
        };

        checkSupport();
    }, []);

    return support;
};

// 3D 모델 컴포넌트
const XRModel: React.FC<{ content: XRContent }> = ({ content }) => {
    const { scene } = useGLTF(content.url || '/models/default.glb');
    const meshRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);
    const [selected, setSelected] = useState(false);

    useFrame((state) => {
        if (meshRef.current && selected) {
            meshRef.current.rotation.y += 0.01;
        }
    });

    return (
        <Interactive
            onSelect={() => setSelected(!selected)}
            onHover={() => setHovered(true)}
            onBlur={() => setHovered(false)}
        >
            <group
                ref={meshRef}
                position={content.position}
                rotation={content.rotation}
                scale={content.scale}
            >
                <primitive
                    object={scene}
                    scale={hovered ? 1.1 : 1}
                />

                {selected && (
                    <Html position={[0, 2, 0]} center>
                        <div style={{
                            background: 'rgba(0,0,0,0.8)',
                            color: 'white',
                            padding: '8px',
                            borderRadius: '4px',
                            fontSize: '14px',
                            textAlign: 'center'
                        }}>
                            {content.title}
                        </div>
                    </Html>
                )}
            </group>
        </Interactive>
    );
};

// AR 히트 테스트 컴포넌트
const ARPlacement: React.FC<{ onPlace: (position: THREE.Vector3) => void }> = ({ onPlace }) => {
    const hitTestRef = useRef<THREE.Group>(null);

    useHitTest((hitMatrix) => {
        if (hitTestRef.current) {
            hitTestRef.current.matrix.copy(hitMatrix);
        }
    });

    const handleSelect = useCallback(() => {
        if (hitTestRef.current) {
            const position = new THREE.Vector3();
            hitTestRef.current.getWorldPosition(position);
            onPlace(position);
        }
    }, [onPlace]);

    return (
        <Interactive onSelect={handleSelect}>
            <group ref={hitTestRef}>
                <Sphere args={[0.1, 16, 16]}>
                    <meshBasicMaterial color="#00ff00" transparent opacity={0.5} />
                </Sphere>
                <Html position={[0, 0.2, 0]} center>
                    <div style={{
                        color: 'white',
                        fontSize: '12px',
                        textAlign: 'center',
                        pointerEvents: 'none'
                    }}>
                        탭하여 배치
                    </div>
                </Html>
            </group>
        </Interactive>
    );
};

// VR 컨트롤러 인터랙션
const VRController: React.FC<{ id: number }> = ({ id }) => {
    const controller = useController(id);
    const [isPointing, setIsPointing] = useState(false);

    useFrame(() => {
        if (controller) {
            const gamepad = controller.inputSource.gamepad;
            if (gamepad) {
                const triggerPressed = gamepad.buttons[0]?.pressed;
                setIsPointing(triggerPressed);
            }
        }
    });

    return (
        <group>
            {controller && (
                <group>
                    <ThreeBox args={[0.05, 0.05, 0.2]} position={[0, 0, -0.1]}>
                        <meshStandardMaterial color={isPointing ? "#ff0000" : "#ffffff"} />
                    </ThreeBox>

                    {isPointing && (
                        <line>
                            <bufferGeometry>
                                <bufferAttribute
                                    attach="attributes-position"
                                    count={2}
                                    array={new Float32Array([0, 0, 0, 0, 0, -10])}
                                    itemSize={3}
                                />
                            </bufferGeometry>
                            <lineBasicMaterial color="#ff0000" />
                        </line>
                    )}
                </group>
            )}
        </group>
    );
};

// 핸드 트래킹 컴포넌트
const HandTracking: React.FC = () => {
    return (
        <Hands>
            {(hand) => (
                <group key={hand.inputSource.handedness}>
                    {hand.joints.map((joint, index) => (
                        <Sphere key={index} args={[0.01, 8, 8]} position={joint.position}>
                            <meshBasicMaterial color="#00ff00" />
                        </Sphere>
                    ))}
                </group>
            )}
        </Hands>
    );
};

// XR 씬 컴포넌트
const XRScene: React.FC<{
    contents: XRContent[];
    mode: XRMode;
    settings: XRSettings;
}> = ({ contents, mode, settings }) => {
    const { isPresenting, player } = useXR();
    const [placedObjects, setPlacedObjects] = useState<XRContent[]>([]);

    const handleARPlacement = useCallback((position: THREE.Vector3) => {
        const newContent: XRContent = {
            id: `placed-${Date.now()}`,
            type: '3d-model',
            title: '배치된 객체',
            description: 'AR로 배치된 3D 객체',
            position: [position.x, position.y, position.z],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            interactions: ['gaze', 'hand'],
            metadata: {
                author: 'AR 사용자',
                created: new Date(),
                tags: ['ar', 'placed']
            }
        };

        setPlacedObjects(prev => [...prev, newContent]);
    }, []);

    return (
        <>
            {/* 조명 */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />

            {/* 환경 */}
            {mode === 'vr' && <Environment preset="city" />}

            {/* 컨트롤러 */}
            <Controllers />
            <VRController id={0} />
            <VRController id={1} />

            {/* 핸드 트래킹 */}
            {settings.enableHandTracking && <HandTracking />}

            {/* 컨텐츠 렌더링 */}
            {contents.map(content => (
                <XRModel key={content.id} content={content} />
            ))}

            {/* 배치된 객체들 */}
            {placedObjects.map(content => (
                <XRModel key={content.id} content={content} />
            ))}

            {/* AR 배치 도구 */}
            {mode === 'ar' && isPresenting && (
                <ARPlacement onPlace={handleARPlacement} />
            )}

            {/* VR 환경 */}
            {mode === 'vr' && (
                <>
                    <Plane args={[50, 50]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
                        <meshStandardMaterial color="#333333" />
                    </Plane>

                    {/* 가상 룸 */}
                    <group>
                        {/* 벽들 */}
                        <Plane args={[10, 5]} position={[0, 2.5, -5]}>
                            <meshStandardMaterial color="#666666" />
                        </Plane>
                        <Plane args={[10, 5]} position={[-5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
                            <meshStandardMaterial color="#666666" />
                        </Plane>
                        <Plane args={[10, 5]} position={[5, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
                            <meshStandardMaterial color="#666666" />
                        </Plane>
                    </group>
                </>
            )}
        </>
    );
};

// 메인 AR/VR 컴포넌트
export const ARVRContentSystem: React.FC = () => {
    const [currentMode, setCurrentMode] = useState<XRMode>('inline');
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [contents, setContents] = useState<XRContent[]>([
        {
            id: 'sample-1',
            type: '3d-model',
            title: '샘플 3D 모델',
            description: '테스트용 3D 모델',
            position: [0, 0, -2],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            interactions: ['gaze', 'hand', 'controller'],
            metadata: {
                author: 'AUTOAGENTS',
                created: new Date(),
                tags: ['sample', '3d']
            }
        }
    ]);

    const [settings, setSettings] = useState<XRSettings>({
        renderQuality: 'high',
        frameRate: 60,
        enableHandTracking: true,
        enableEyeTracking: false,
        enableSpatialAudio: true,
        enableHapticFeedback: true,
        safetyBoundary: true,
        comfortSettings: {
            locomotion: 'teleport',
            turnSpeed: 45,
            snapTurn: true,
            vignetteOnMove: true
        }
    });

    const xrSupport = useXRSupport();
    const theme = useTheme();

    const handleSessionStart = useCallback((mode: XRMode) => {
        setCurrentMode(mode);
        setIsSessionActive(true);
    }, []);

    const handleSessionEnd = useCallback(() => {
        setIsSessionActive(false);
        setCurrentMode('inline');
    }, []);

    const addContent = useCallback((content: Omit<XRContent, 'id'>) => {
        const newContent: XRContent = {
            ...content,
            id: `content-${Date.now()}`
        };
        setContents(prev => [...prev, newContent]);
    }, []);

    const removeContent = useCallback((id: string) => {
        setContents(prev => prev.filter(content => content.id !== id));
    }, []);

    return (
        <XRContainer>
            {/* 헤더 */}
            <Box p={2} borderBottom={1} borderColor="divider">
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">AR/VR 컨텐츠 시스템</Typography>
                    <Box display="flex" gap={1}>
                        <Chip
                            icon={currentMode === 'ar' ? <ARIcon /> : currentMode === 'vr' ? <VRIcon /> : <ThreeDIcon />}
                            label={currentMode.toUpperCase()}
                            color={isSessionActive ? 'success' : 'default'}
                        />
                        <Chip
                            label={`${contents.length} 컨텐츠`}
                            variant="outlined"
                        />
                    </Box>
                </Box>
            </Box>

            {/* WebXR 지원 상태 */}
            <Box p={2}>
                <Alert
                    severity={xrSupport.ar || xrSupport.vr ? 'success' : 'warning'}
                    sx={{ mb: 2 }}
                >
                    <Typography variant="body2">
                        WebXR 지원 상태:
                        AR {xrSupport.ar ? '✓' : '✗'},
                        VR {xrSupport.vr ? '✓' : '✗'}
                        {!xrSupport.ar && !xrSupport.vr && ' - HTTPS 환경에서 XR 지원 기기가 필요합니다.'}
                    </Typography>
                </Alert>

                <Box display="flex" gap={2} mb={2}>
                    <Button
                        variant={currentMode === 'ar' ? 'contained' : 'outlined'}
                        startIcon={<ARIcon />}
                        onClick={() => handleSessionStart('ar')}
                        disabled={!xrSupport.ar}
                    >
                        AR 모드
                    </Button>

                    <Button
                        variant={currentMode === 'vr' ? 'contained' : 'outlined'}
                        startIcon={<VRIcon />}
                        onClick={() => handleSessionStart('vr')}
                        disabled={!xrSupport.vr}
                    >
                        VR 모드
                    </Button>

                    <Button
                        variant={currentMode === 'inline' ? 'contained' : 'outlined'}
                        startIcon={<ThreeDIcon />}
                        onClick={() => handleSessionStart('inline')}
                    >
                        3D 모드
                    </Button>

                    <Button
                        startIcon={<SettingsIcon />}
                        onClick={() => setShowSettings(true)}
                    >
                        설정
                    </Button>
                </Box>
            </Box>

            {/* XR 캔버스 */}
            <XRCanvas>
                <Suspense fallback={
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <CircularProgress />
                    </Box>
                }>
                    <Canvas>
                        <XR
                            onSessionStart={() => setIsSessionActive(true)}
                            onSessionEnd={() => setIsSessionActive(false)}
                        >
                            <XRScene
                                contents={contents}
                                mode={currentMode}
                                settings={settings}
                            />
                        </XR>

                        {/* 인라인 모드용 컨트롤 */}
                        {currentMode === 'inline' && (
                            <OrbitControls enablePan enableZoom enableRotate />
                        )}
                    </Canvas>
                </Suspense>

                {/* XR 버튼들 */}
                <XRControls>
                    {xrSupport.ar && (
                        <ARButton
                            sessionInit={{
                                requiredFeatures: ['hit-test'],
                                optionalFeatures: ['hand-tracking']
                            }}
                        />
                    )}

                    {xrSupport.vr && (
                        <VRButton
                            sessionInit={{
                                optionalFeatures: ['hand-tracking', 'eye-tracking']
                            }}
                        />
                    )}

                    <IconButton sx={{ color: 'white' }}>
                        <CameraIcon />
                    </IconButton>

                    <IconButton sx={{ color: 'white' }}>
                        <ShareIcon />
                    </IconButton>
                </XRControls>

                {/* 상태 정보 */}
                {isSessionActive && (
                    <XRStatus>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                {currentMode.toUpperCase()} 세션 활성
                            </Typography>
                            <Typography variant="body2">
                                컨텐츠: {contents.length}개
                            </Typography>
                            <Typography variant="body2">
                                품질: {settings.renderQuality}
                            </Typography>
                            <Typography variant="body2">
                                프레임율: {settings.frameRate}fps
                            </Typography>
                        </CardContent>
                    </XRStatus>
                )}
            </XRCanvas>

            {/* 컨텐츠 목록 */}
            <Box p={2} borderTop={1} borderColor="divider">
                <Typography variant="h6" gutterBottom>
                    컨텐츠 목록
                </Typography>

                <Box display="flex" gap={1} flexWrap="wrap">
                    {contents.map(content => (
                        <Card key={content.id} sx={{ minWidth: 200 }}>
                            <CardContent>
                                <Typography variant="subtitle1">
                                    {content.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {content.description}
                                </Typography>
                                <Box mt={1}>
                                    <Chip
                                        label={content.type}
                                        size="small"
                                        variant="outlined"
                                    />
                                </Box>
                            </CardContent>
                            <CardActions>
                                <Button size="small">편집</Button>
                                <Button
                                    size="small"
                                    color="error"
                                    onClick={() => removeContent(content.id)}
                                >
                                    삭제
                                </Button>
                            </CardActions>
                        </Card>
                    ))}

                    <Card sx={{ minWidth: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CardContent>
                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={() => {
                                    addContent({
                                        type: '3d-model',
                                        title: '새 컨텐츠',
                                        description: '새로운 XR 컨텐츠',
                                        position: [Math.random() * 4 - 2, 0, Math.random() * 4 - 2],
                                        rotation: [0, 0, 0],
                                        scale: [1, 1, 1],
                                        interactions: ['gaze'],
                                        metadata: {
                                            author: '사용자',
                                            created: new Date(),
                                            tags: ['new']
                                        }
                                    });
                                }}
                            >
                                + 컨텐츠 추가
                            </Button>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* 설정 다이얼로그 */}
            <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="md" fullWidth>
                <DialogTitle>XR 설정</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={3} pt={1}>
                        <FormControl fullWidth>
                            <InputLabel>렌더링 품질</InputLabel>
                            <Select
                                value={settings.renderQuality}
                                label="렌더링 품질"
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    renderQuality: e.target.value as any
                                }))}
                            >
                                <MenuItem value="low">낮음</MenuItem>
                                <MenuItem value="medium">보통</MenuItem>
                                <MenuItem value="high">높음</MenuItem>
                                <MenuItem value="ultra">최고</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>프레임율</InputLabel>
                            <Select
                                value={settings.frameRate}
                                label="프레임율"
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    frameRate: e.target.value as any
                                }))}
                            >
                                <MenuItem value={30}>30 FPS</MenuItem>
                                <MenuItem value={60}>60 FPS</MenuItem>
                                <MenuItem value={90}>90 FPS</MenuItem>
                                <MenuItem value={120}>120 FPS</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.enableHandTracking}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        enableHandTracking: e.target.checked
                                    }))}
                                />
                            }
                            label="핸드 트래킹"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.enableSpatialAudio}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        enableSpatialAudio: e.target.checked
                                    }))}
                                />
                            }
                            label="공간 오디오"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.enableHapticFeedback}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        enableHapticFeedback: e.target.checked
                                    }))}
                                />
                            }
                            label="햅틱 피드백"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.safetyBoundary}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        safetyBoundary: e.target.checked
                                    }))}
                                />
                            }
                            label="안전 경계"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowSettings(false)}>취소</Button>
                    <Button variant="contained">저장</Button>
                </DialogActions>
            </Dialog>
        </XRContainer>
    );
};

export default ARVRContentSystem;
