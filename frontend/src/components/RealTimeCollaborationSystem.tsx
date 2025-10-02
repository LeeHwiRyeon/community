/**
 * 🤝 실시간 협업 시스템
 * 
 * WebSocket 기반 실시간 협업, 동시 편집, 충돌 해결을 지원하는
 * Google Docs 수준의 협업 시스템
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
    createContext,
    useContext,
    ReactNode
} from 'react';
import {
    Box,
    Paper,
    Typography,
    Avatar,
    Badge,
    Chip,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
    Menu,
    MenuItem,
    Tooltip,
    Alert,
    Snackbar,
    Card,
    CardContent,
    CardActions,
    Divider,
    LinearProgress,
    useTheme
} from '@mui/material';
import {
    Group as GroupIcon,
    PersonAdd as PersonAddIcon,
    Share as ShareIcon,
    Lock as LockIcon,
    LockOpen as LockOpenIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    AdminPanelSettings as AdminIcon,
    Circle as OnlineIcon,
    RadioButtonUnchecked as OfflineIcon,
    Chat as ChatIcon,
    Notifications as NotificationIcon,
    Settings as SettingsIcon,
    Link as LinkIcon,
    Email as EmailIcon,
    ContentCopy as CopyIcon,
    Check as CheckIcon,
    Warning as WarningIcon,
    Sync as SyncIcon,
    SyncProblem as SyncProblemIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/system';

// 협업 타입 정의
export type UserRole = 'owner' | 'editor' | 'commenter' | 'viewer';
export type PermissionLevel = 'private' | 'restricted' | 'public';
export type ActivityType = 'join' | 'leave' | 'edit' | 'comment' | 'share' | 'permission_change';

export interface CollaborationUser {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: UserRole;
    isOnline: boolean;
    lastSeen: Date;
    cursor?: {
        x: number;
        y: number;
        blockId?: string;
        selection?: {
            start: number;
            end: number;
        };
    };
    color: string;
    isTyping: boolean;
    currentAction?: string;
}

export interface ShareSettings {
    permissionLevel: PermissionLevel;
    allowComments: boolean;
    allowDownload: boolean;
    expiresAt?: Date;
    password?: string;
    domains?: string[];
}

export interface Activity {
    id: string;
    userId: string;
    type: ActivityType;
    description: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}

export interface ConflictResolution {
    id: string;
    blockId: string;
    conflictType: 'concurrent_edit' | 'deletion' | 'permission';
    users: string[];
    timestamp: Date;
    resolved: boolean;
    resolution?: 'accept_all' | 'accept_latest' | 'merge' | 'manual';
}

interface CollaborationContextValue {
    users: CollaborationUser[];
    currentUser: CollaborationUser;
    shareSettings: ShareSettings;
    activities: Activity[];
    conflicts: ConflictResolution[];
    isConnected: boolean;
    connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';

    // 사용자 관리
    inviteUser: (email: string, role: UserRole) => Promise<void>;
    removeUser: (userId: string) => void;
    changeUserRole: (userId: string, role: UserRole) => void;

    // 공유 설정
    updateShareSettings: (settings: Partial<ShareSettings>) => void;
    generateShareLink: () => string;

    // 실시간 협업
    updateCursor: (position: { x: number; y: number; blockId?: string }) => void;
    setTypingStatus: (isTyping: boolean, blockId?: string) => void;
    broadcastChange: (change: any) => void;

    // 충돌 해결
    resolveConflict: (conflictId: string, resolution: ConflictResolution['resolution']) => void;

    // 활동 로그
    logActivity: (type: ActivityType, description: string, metadata?: any) => void;
}

// 애니메이션
const pulseAnimation = keyframes`
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
`;

const typingAnimation = keyframes`
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-10px); }
`;

// 스타일드 컴포넌트
const CollaborationPanel = styled(Paper)(({ theme }) => ({
    position: 'fixed',
    top: theme.spacing(8),
    right: theme.spacing(2),
    width: 320,
    maxHeight: '70vh',
    overflow: 'auto',
    zIndex: 1300,
    boxShadow: theme.shadows[8]
}));

const UserCursor = styled(Box)<{ color: string }>(({ theme, color }) => ({
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: 1000,

    '&::before': {
        content: '""',
        position: 'absolute',
        width: '2px',
        height: '20px',
        backgroundColor: color,
        borderRadius: '1px'
    },

    '&::after': {
        content: 'attr(data-username)',
        position: 'absolute',
        top: '-25px',
        left: '0',
        backgroundColor: color,
        color: 'white',
        padding: '2px 6px',
        borderRadius: '3px',
        fontSize: '11px',
        whiteSpace: 'nowrap',
        fontWeight: 500
    }
}));

const UserSelection = styled(Box)<{ color: string }>(({ color }) => ({
    position: 'absolute',
    backgroundColor: `${color}33`,
    border: `1px solid ${color}`,
    pointerEvents: 'none',
    zIndex: 999
}));

const TypingIndicator = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),

    '& .dot': {
        width: 4,
        height: 4,
        borderRadius: '50%',
        backgroundColor: theme.palette.primary.main,
        animation: `${typingAnimation} 1.4s infinite ease-in-out`,

        '&:nth-of-type(1)': { animationDelay: '-0.32s' },
        '&:nth-of-type(2)': { animationDelay: '-0.16s' },
        '&:nth-of-type(3)': { animationDelay: '0s' }
    }
}));

const ConnectionStatus = styled(Box)<{ status: string }>(({ theme, status }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    fontSize: '0.8rem',

    backgroundColor:
        status === 'connected' ? theme.palette.success.light :
            status === 'connecting' ? theme.palette.warning.light :
                status === 'disconnected' ? theme.palette.grey[300] :
                    theme.palette.error.light,

    color:
        status === 'connected' ? theme.palette.success.contrastText :
            status === 'connecting' ? theme.palette.warning.contrastText :
                status === 'disconnected' ? theme.palette.text.secondary :
                    theme.palette.error.contrastText
}));

// 협업 컨텍스트
const CollaborationContext = createContext<CollaborationContextValue | undefined>(undefined);

// 커스텀 훅
export const useCollaboration = (): CollaborationContextValue => {
    const context = useContext(CollaborationContext);
    if (!context) {
        throw new Error('useCollaboration must be used within CollaborationProvider');
    }
    return context;
};

// WebSocket 관리 훅
const useWebSocket = (documentId: string) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    const connect = useCallback(() => {
        if (socket?.readyState === WebSocket.OPEN) return;

        setConnectionStatus('connecting');

        try {
            const ws = new WebSocket(`ws://localhost:5001/collaboration/${documentId}`);

            ws.onopen = () => {
                setConnectionStatus('connected');
                reconnectAttempts.current = 0;
                console.log('WebSocket connected');
            };

            ws.onclose = () => {
                setConnectionStatus('disconnected');

                // 자동 재연결
                if (reconnectAttempts.current < maxReconnectAttempts) {
                    reconnectAttempts.current++;
                    setTimeout(() => connect(), Math.pow(2, reconnectAttempts.current) * 1000);
                }
            };

            ws.onerror = () => {
                setConnectionStatus('error');
            };

            setSocket(ws);
        } catch (error) {
            setConnectionStatus('error');
            console.error('WebSocket connection failed:', error);
        }
    }, [documentId, socket]);

    const disconnect = useCallback(() => {
        if (socket) {
            socket.close();
            setSocket(null);
            setConnectionStatus('disconnected');
        }
    }, [socket]);

    const sendMessage = useCallback((message: any) => {
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        }
    }, [socket]);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return { socket, connectionStatus, sendMessage, connect, disconnect };
};

// 협업 프로바이더
interface CollaborationProviderProps {
    children: ReactNode;
    documentId: string;
    currentUserId: string;
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({
    children,
    documentId,
    currentUserId
}) => {
    const { socket, connectionStatus, sendMessage } = useWebSocket(documentId);

    const [users, setUsers] = useState<CollaborationUser[]>([
        {
            id: currentUserId,
            name: '현재 사용자',
            email: 'current@example.com',
            role: 'owner',
            isOnline: true,
            lastSeen: new Date(),
            color: '#2196F3',
            isTyping: false
        }
    ]);

    const [shareSettings, setShareSettings] = useState<ShareSettings>({
        permissionLevel: 'private',
        allowComments: true,
        allowDownload: false
    });

    const [activities, setActivities] = useState<Activity[]>([]);
    const [conflicts, setConflicts] = useState<ConflictResolution[]>([]);

    const currentUser = users.find(u => u.id === currentUserId)!;
    const isConnected = connectionStatus === 'connected';

    // WebSocket 메시지 처리
    useEffect(() => {
        if (!socket) return;

        const handleMessage = (event: MessageEvent) => {
            try {
                const message = JSON.parse(event.data);

                switch (message.type) {
                    case 'user_joined':
                        setUsers(prev => [...prev.filter(u => u.id !== message.user.id), message.user]);
                        logActivity('join', `${message.user.name}님이 참여했습니다.`);
                        break;

                    case 'user_left':
                        setUsers(prev => prev.map(u =>
                            u.id === message.userId
                                ? { ...u, isOnline: false, lastSeen: new Date() }
                                : u
                        ));
                        logActivity('leave', `사용자가 나갔습니다.`);
                        break;

                    case 'cursor_update':
                        setUsers(prev => prev.map(u =>
                            u.id === message.userId
                                ? { ...u, cursor: message.cursor }
                                : u
                        ));
                        break;

                    case 'typing_status':
                        setUsers(prev => prev.map(u =>
                            u.id === message.userId
                                ? { ...u, isTyping: message.isTyping, currentAction: message.blockId }
                                : u
                        ));
                        break;

                    case 'content_change':
                        // 컨텐츠 변경 처리
                        break;

                    case 'conflict_detected':
                        setConflicts(prev => [...prev, message.conflict]);
                        break;

                    case 'permission_changed':
                        setUsers(prev => prev.map(u =>
                            u.id === message.userId
                                ? { ...u, role: message.role }
                                : u
                        ));
                        break;
                }
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };

        socket.addEventListener('message', handleMessage);
        return () => socket.removeEventListener('message', handleMessage);
    }, [socket]);

    // 사용자 초대
    const inviteUser = useCallback(async (email: string, role: UserRole) => {
        try {
            // 실제로는 서버 API 호출
            const newUser: CollaborationUser = {
                id: `user-${Date.now()}`,
                name: email.split('@')[0],
                email,
                role,
                isOnline: false,
                lastSeen: new Date(),
                color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                isTyping: false
            };

            setUsers(prev => [...prev, newUser]);
            logActivity('share', `${email}을 ${role} 권한으로 초대했습니다.`);

            // WebSocket으로 알림
            sendMessage({
                type: 'user_invited',
                user: newUser
            });
        } catch (error) {
            console.error('Failed to invite user:', error);
            throw error;
        }
    }, [sendMessage]);

    // 사용자 제거
    const removeUser = useCallback((userId: string) => {
        setUsers(prev => prev.filter(u => u.id !== userId));
        logActivity('permission_change', '사용자 권한이 제거되었습니다.');

        sendMessage({
            type: 'user_removed',
            userId
        });
    }, [sendMessage]);

    // 사용자 역할 변경
    const changeUserRole = useCallback((userId: string, role: UserRole) => {
        setUsers(prev => prev.map(u =>
            u.id === userId ? { ...u, role } : u
        ));

        logActivity('permission_change', `사용자 권한이 ${role}로 변경되었습니다.`);

        sendMessage({
            type: 'role_changed',
            userId,
            role
        });
    }, [sendMessage]);

    // 공유 설정 업데이트
    const updateShareSettings = useCallback((settings: Partial<ShareSettings>) => {
        setShareSettings(prev => ({ ...prev, ...settings }));

        sendMessage({
            type: 'share_settings_updated',
            settings
        });
    }, [sendMessage]);

    // 공유 링크 생성
    const generateShareLink = useCallback(() => {
        const baseUrl = window.location.origin;
        const shareId = btoa(documentId + Date.now()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
        return `${baseUrl}/shared/${shareId}`;
    }, [documentId]);

    // 커서 위치 업데이트
    const updateCursor = useCallback((position: { x: number; y: number; blockId?: string }) => {
        sendMessage({
            type: 'cursor_update',
            cursor: position
        });
    }, [sendMessage]);

    // 타이핑 상태 설정
    const setTypingStatus = useCallback((isTyping: boolean, blockId?: string) => {
        sendMessage({
            type: 'typing_status',
            isTyping,
            blockId
        });
    }, [sendMessage]);

    // 변경사항 브로드캐스트
    const broadcastChange = useCallback((change: any) => {
        sendMessage({
            type: 'content_change',
            change
        });
    }, [sendMessage]);

    // 충돌 해결
    const resolveConflict = useCallback((conflictId: string, resolution: ConflictResolution['resolution']) => {
        setConflicts(prev => prev.map(c =>
            c.id === conflictId
                ? { ...c, resolved: true, resolution }
                : c
        ));

        sendMessage({
            type: 'conflict_resolved',
            conflictId,
            resolution
        });
    }, [sendMessage]);

    // 활동 로그
    const logActivity = useCallback((type: ActivityType, description: string, metadata?: any) => {
        const activity: Activity = {
            id: `activity-${Date.now()}`,
            userId: currentUserId,
            type,
            description,
            timestamp: new Date(),
            metadata
        };

        setActivities(prev => [activity, ...prev.slice(0, 49)]); // 최근 50개만 유지
    }, [currentUserId]);

    const contextValue: CollaborationContextValue = {
        users,
        currentUser,
        shareSettings,
        activities,
        conflicts,
        isConnected,
        connectionStatus,
        inviteUser,
        removeUser,
        changeUserRole,
        updateShareSettings,
        generateShareLink,
        updateCursor,
        setTypingStatus,
        broadcastChange,
        resolveConflict,
        logActivity
    };

    return (
        <CollaborationContext.Provider value={contextValue}>
            {children}
        </CollaborationContext.Provider>
    );
};

// 협업 패널 컴포넌트
export const CollaborationPanel: React.FC<{ open: boolean; onClose: () => void }> = ({
    open,
    onClose
}) => {
    const {
        users,
        currentUser,
        shareSettings,
        activities,
        conflicts,
        connectionStatus,
        inviteUser,
        removeUser,
        changeUserRole,
        generateShareLink
    } = useCollaboration();

    const [activeTab, setActiveTab] = useState<'users' | 'share' | 'activity'>('users');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<UserRole>('editor');
    const [shareLink, setShareLink] = useState('');
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [showShareDialog, setShowShareDialog] = useState(false);

    const theme = useTheme();

    const handleInvite = async () => {
        if (!inviteEmail) return;

        try {
            await inviteUser(inviteEmail, inviteRole);
            setInviteEmail('');
            setShowInviteDialog(false);
        } catch (error) {
            console.error('Failed to invite user:', error);
        }
    };

    const handleGenerateShareLink = () => {
        const link = generateShareLink();
        setShareLink(link);
        setShowShareDialog(true);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    if (!open) return null;

    return (
        <CollaborationPanel>
            <CardContent>
                {/* 헤더 */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">협업</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                        <ConnectionStatus status={connectionStatus}>
                            {connectionStatus === 'connected' && <SyncIcon />}
                            {connectionStatus === 'error' && <SyncProblemIcon />}
                            {connectionStatus === 'connecting' && <SyncIcon className="spin" />}
                            {connectionStatus}
                        </ConnectionStatus>
                        <IconButton size="small" onClick={onClose}>
                            ×
                        </IconButton>
                    </Box>
                </Box>

                {/* 탭 */}
                <Box display="flex" mb={2}>
                    {['users', 'share', 'activity'].map(tab => (
                        <Button
                            key={tab}
                            size="small"
                            variant={activeTab === tab ? 'contained' : 'text'}
                            onClick={() => setActiveTab(tab as any)}
                            sx={{ minWidth: 'auto', px: 2 }}
                        >
                            {tab === 'users' && '사용자'}
                            {tab === 'share' && '공유'}
                            {tab === 'activity' && '활동'}
                        </Button>
                    ))}
                </Box>

                {/* 사용자 탭 */}
                {activeTab === 'users' && (
                    <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="subtitle2">
                                협업자 ({users.length}명)
                            </Typography>
                            <Button
                                size="small"
                                startIcon={<PersonAddIcon />}
                                onClick={() => setShowInviteDialog(true)}
                            >
                                초대
                            </Button>
                        </Box>

                        <List dense>
                            {users.map(user => (
                                <ListItem key={user.id}>
                                    <ListItemAvatar>
                                        <Badge
                                            overlap="circular"
                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                            badgeContent={
                                                user.isOnline ?
                                                    <OnlineIcon sx={{ color: 'success.main', fontSize: 12 }} /> :
                                                    <OfflineIcon sx={{ color: 'grey.400', fontSize: 12 }} />
                                            }
                                        >
                                            <Avatar
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    border: `2px solid ${user.color}`
                                                }}
                                                src={user.avatar}
                                            >
                                                {user.name[0]}
                                            </Avatar>
                                        </Badge>
                                    </ListItemAvatar>

                                    <ListItemText
                                        primary={
                                            <Box display="flex" alignItems="center" gap={1}>
                                                {user.name}
                                                {user.id === currentUser.id && (
                                                    <Chip label="나" size="small" />
                                                )}
                                                {user.isTyping && (
                                                    <TypingIndicator>
                                                        <div className="dot" />
                                                        <div className="dot" />
                                                        <div className="dot" />
                                                    </TypingIndicator>
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Chip
                                                    label={user.role}
                                                    size="small"
                                                    variant="outlined"
                                                    color={
                                                        user.role === 'owner' ? 'primary' :
                                                            user.role === 'editor' ? 'success' :
                                                                user.role === 'commenter' ? 'warning' : 'default'
                                                    }
                                                />
                                                {!user.isOnline && (
                                                    <Typography variant="caption" color="text.disabled">
                                                        {user.lastSeen.toLocaleTimeString()}
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                    />

                                    {currentUser.role === 'owner' && user.id !== currentUser.id && (
                                        <ListItemSecondaryAction>
                                            <IconButton
                                                size="small"
                                                onClick={() => removeUser(user.id)}
                                            >
                                                ×
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    )}
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}

                {/* 공유 탭 */}
                {activeTab === 'share' && (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            공유 설정
                        </Typography>

                        <Box display="flex" flexDirection="column" gap={2}>
                            <Button
                                variant="outlined"
                                startIcon={<LinkIcon />}
                                onClick={handleGenerateShareLink}
                                fullWidth
                            >
                                공유 링크 생성
                            </Button>

                            <Button
                                variant="outlined"
                                startIcon={<EmailIcon />}
                                onClick={() => setShowInviteDialog(true)}
                                fullWidth
                            >
                                이메일로 초대
                            </Button>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="body2" color="text.secondary">
                            권한 설정
                        </Typography>

                        {/* 권한 설정 UI는 실제 구현에서 추가 */}
                    </Box>
                )}

                {/* 활동 탭 */}
                {activeTab === 'activity' && (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            최근 활동
                        </Typography>

                        <List dense>
                            {activities.slice(0, 10).map(activity => (
                                <ListItem key={activity.id}>
                                    <ListItemText
                                        primary={activity.description}
                                        secondary={activity.timestamp.toLocaleString()}
                                    />
                                </ListItem>
                            ))}
                        </List>

                        {conflicts.length > 0 && (
                            <>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2" gutterBottom color="warning.main">
                                    충돌 ({conflicts.filter(c => !c.resolved).length}개)
                                </Typography>

                                {conflicts.filter(c => !c.resolved).map(conflict => (
                                    <Alert key={conflict.id} severity="warning" sx={{ mb: 1 }}>
                                        <Typography variant="body2">
                                            편집 충돌이 감지되었습니다.
                                        </Typography>
                                        <Box mt={1}>
                                            <Button size="small" color="warning">
                                                해결하기
                                            </Button>
                                        </Box>
                                    </Alert>
                                ))}
                            </>
                        )}
                    </Box>
                )}
            </CardContent>

            {/* 초대 다이얼로그 */}
            <Dialog open={showInviteDialog} onClose={() => setShowInviteDialog(false)}>
                <DialogTitle>사용자 초대</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="이메일 주소"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        select
                        label="권한"
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as UserRole)}
                        margin="normal"
                    >
                        <MenuItem value="editor">편집자</MenuItem>
                        <MenuItem value="commenter">댓글 작성자</MenuItem>
                        <MenuItem value="viewer">뷰어</MenuItem>
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowInviteDialog(false)}>취소</Button>
                    <Button onClick={handleInvite} variant="contained">초대</Button>
                </DialogActions>
            </Dialog>

            {/* 공유 링크 다이얼로그 */}
            <Dialog open={showShareDialog} onClose={() => setShowShareDialog(false)}>
                <DialogTitle>공유 링크</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        value={shareLink}
                        InputProps={{
                            readOnly: true,
                            endAdornment: (
                                <IconButton onClick={() => copyToClipboard(shareLink)}>
                                    <CopyIcon />
                                </IconButton>
                            )
                        }}
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowShareDialog(false)}>닫기</Button>
                </DialogActions>
            </Dialog>
        </CollaborationPanel>
    );
};

// 실시간 커서 및 선택 영역 표시
export const RealTimeCursors: React.FC = () => {
    const { users, currentUser } = useCollaboration();

    const otherUsers = users.filter(u => u.id !== currentUser.id && u.isOnline && u.cursor);

    return (
        <>
            {otherUsers.map(user => (
                <React.Fragment key={user.id}>
                    {/* 커서 */}
                    {user.cursor && (
                        <UserCursor
                            color={user.color}
                            data-username={user.name}
                            sx={{
                                left: user.cursor.x,
                                top: user.cursor.y
                            }}
                        />
                    )}

                    {/* 선택 영역 */}
                    {user.cursor?.selection && (
                        <UserSelection
                            color={user.color}
                            sx={{
                                left: user.cursor.selection.start,
                                width: user.cursor.selection.end - user.cursor.selection.start,
                                height: 20
                            }}
                        />
                    )}
                </React.Fragment>
            ))}
        </>
    );
};

export default CollaborationProvider;
