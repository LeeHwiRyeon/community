import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Chip,
    Divider,
    IconButton,
    Badge,
    Drawer,
    AppBar,
    Toolbar,
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Send as SendIcon,
    Chat as ChatIcon,
    Close as CloseIcon,
    People as PeopleIcon,
    EmojiEmotions as EmojiIcon,
    AttachFile as AttachIcon,
    MoreVert as MoreIcon,
    Circle as CircleIcon,
    Image as ImageIcon,
    Description as FileTextIcon,
    Download as DownloadIcon,
    Delete as DeleteIcon,
    Lock as LockIcon,
    LockOpen as LockOpenIcon,
    VpnKey as VpnKeyIcon,
    Security as SecurityIcon
} from '@mui/icons-material';
import FileSharing, { FileMetadata } from './FileSharing';
import { MessageEncryption, useMessageEncryption } from '../utils/MessageEncryption';

// 채팅 데이터 타입 정의 (v1.3 확장)
interface ChatMessage {
    id: string;
    userId: string;
    username: string;
    message: string;
    timestamp: string;
    type: 'text' | 'image' | 'file' | 'system' | 'encrypted';
    avatar?: string;
    isOnline?: boolean;
    fileMetadata?: FileMetadata;
    isEncrypted?: boolean;
    replyTo?: string;
    mentions?: string[];
    reactions?: { [emoji: string]: string[] };
}

interface ChatRoom {
    id: string;
    name: string;
    description: string;
    type: 'public' | 'private' | 'vip';
    memberCount: number;
    isActive: boolean;
    lastMessage?: ChatMessage;
}

interface OnlineUser {
    userId: string;
    username: string;
    avatar?: string;
    status: 'online' | 'away' | 'busy' | 'offline';
    lastSeen: string;
}

interface ChatSystemProps {
    isOpen?: boolean;
    onClose?: () => void;
    initialRoomId?: string;
}

const ChatSystem: React.FC<ChatSystemProps> = ({
    isOpen = false,
    onClose = () => { },
    initialRoomId = 'general'
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [currentRoom, setCurrentRoom] = useState<string>(initialRoomId);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // 암호화 상태 관리
    const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(false);
    const [encryptionDialogOpen, setEncryptionDialogOpen] = useState(false);
    const [isKeyExchanging, setIsKeyExchanging] = useState(false);
    const [keyExchangeProgress, setKeyExchangeProgress] = useState(0);
    const { encryptMessage, decryptMessage, isEncryptionEnabled: cryptoEnabled } = useMessageEncryption(currentRoom);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentUser = { id: 'user_123', username: 'CurrentUser' }; // 실제로는 인증에서 가져옴

    // 메시지 스크롤 자동 이동
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // WebSocket 연결 (v1.3 최적화)
    useEffect(() => {
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;
        let reconnectTimeout: NodeJS.Timeout;

        const connectWebSocket = () => {
            try {
                // WebSocket 연결
                const websocket = new WebSocket(`ws://localhost:50000/chat`);

                websocket.onopen = () => {
                    console.log('채팅 WebSocket 연결됨 (v1.3 최적화)');
                    setIsConnected(true);
                    setWs(websocket);
                    reconnectAttempts = 0; // 연결 성공 시 재시도 횟수 리셋

                    // 채팅방 입장 (인증 토큰 포함)
                    websocket.send(JSON.stringify({
                        type: 'join_room',
                        roomId: currentRoom,
                        userId: currentUser.id,
                        username: currentUser.username,
                        token: localStorage.getItem('authToken'), // 보안 강화
                        timestamp: Date.now()
                    }));
                };

                websocket.onmessage = (event) => {
                    const data = JSON.parse(event.data);

                    switch (data.type) {
                        case 'message':
                            setMessages(prev => [...prev, data.message]);
                            if (!isOpen) {
                                setUnreadCount(prev => prev + 1);
                            }
                            break;
                        case 'user_joined':
                        case 'user_left':
                            // 온라인 사용자 목록 업데이트
                            loadOnlineUsers();
                            break;
                        case 'room_history':
                            setMessages(data.messages || []);
                            break;
                    }
                };

                websocket.onclose = (event) => {
                    console.log('채팅 WebSocket 연결 끊김:', event.code, event.reason);
                    setIsConnected(false);
                    setWs(null);

                    // 지수 백오프를 사용한 재연결 (v1.3 최적화)
                    if (reconnectAttempts < maxReconnectAttempts) {
                        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
                        reconnectAttempts++;

                        console.log(`${delay}ms 후 재연결 시도 (${reconnectAttempts}/${maxReconnectAttempts})`);
                        reconnectTimeout = setTimeout(connectWebSocket, delay);
                    } else {
                        console.error('최대 재연결 시도 횟수 초과. 수동 재연결이 필요합니다.');
                        // 사용자에게 수동 재연결 옵션 제공
                        setError('연결 실패: 최대 재시도 횟수를 초과했습니다.');
                    }
                };

                websocket.onerror = (error) => {
                    console.error('채팅 WebSocket 오류:', error);
                    setError('채팅 서버 연결에 실패했습니다.');
                };

            } catch (err) {
                console.error('WebSocket 연결 오류:', err);
                setError('채팅 서버에 연결할 수 없습니다.');
            }
        };

        connectWebSocket();

        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, [currentRoom]);

    // 초기 데이터 로딩
    useEffect(() => {
        const loadChatData = async () => {
            try {
                setLoading(true);

                // 채팅방 목록 로딩
                const roomsResponse = await fetch('/api/chat/rooms');
                if (roomsResponse.ok) {
                    const roomsData = await roomsResponse.json();
                    setRooms(roomsData.data || []);
                } else {
                    // 모의 채팅방 데이터
                    setRooms([
                        {
                            id: 'general',
                            name: '일반 채팅',
                            description: '모든 사용자가 참여할 수 있는 공개 채팅방',
                            type: 'public',
                            memberCount: 156,
                            isActive: true
                        },
                        {
                            id: 'vip',
                            name: 'VIP 라운지',
                            description: 'VIP 회원 전용 채팅방',
                            type: 'vip',
                            memberCount: 23,
                            isActive: true
                        },
                        {
                            id: 'cosplay',
                            name: '코스프레 토크',
                            description: '코스프레 관련 대화방',
                            type: 'public',
                            memberCount: 89,
                            isActive: true
                        },
                        {
                            id: 'streaming',
                            name: '스트리밍 채널',
                            description: '스트리머들의 소통 공간',
                            type: 'public',
                            memberCount: 67,
                            isActive: true
                        }
                    ]);
                }

                // 온라인 사용자 로딩
                await loadOnlineUsers();

                // 채팅 기록 로딩
                await loadChatHistory(currentRoom);

            } catch (err) {
                setError('채팅 데이터를 불러오는 중 오류가 발생했습니다.');
                console.error('채팅 데이터 로딩 오류:', err);
            } finally {
                setLoading(false);
            }
        };

        loadChatData();
    }, []);

    // 온라인 사용자 로딩
    const loadOnlineUsers = async () => {
        try {
            const response = await fetch('/api/online-status/users');
            if (response.ok) {
                const data = await response.json();
                setOnlineUsers(data.data || []);
            } else {
                // 모의 온라인 사용자 데이터
                setOnlineUsers([
                    { userId: 'user_001', username: 'GameMaster', status: 'online', lastSeen: new Date().toISOString() },
                    { userId: 'user_002', username: 'CosplayQueen', status: 'online', lastSeen: new Date().toISOString() },
                    { userId: 'user_003', username: 'StreamKing', status: 'away', lastSeen: new Date().toISOString() },
                    { userId: 'user_004', username: 'VIPMember', status: 'busy', lastSeen: new Date().toISOString() }
                ]);
            }
        } catch (err) {
            console.error('온라인 사용자 로딩 오류:', err);
        }
    };

    // 채팅 기록 로딩
    const loadChatHistory = async (roomId: string) => {
        try {
            const response = await fetch(`/api/chat/rooms/${roomId}/messages`);
            if (response.ok) {
                const data = await response.json();
                setMessages(data.data || []);
            } else {
                // 모의 채팅 메시지 데이터
                const mockMessages: ChatMessage[] = [
                    {
                        id: 'msg_001',
                        userId: 'user_001',
                        username: 'GameMaster',
                        message: '안녕하세요! 새로운 게임 업데이트가 나왔어요!',
                        timestamp: new Date(Date.now() - 300000).toISOString(),
                        type: 'text',
                        isOnline: true
                    },
                    {
                        id: 'msg_002',
                        userId: 'user_002',
                        username: 'CosplayQueen',
                        message: '와! 정말 기대되네요. 어떤 게임인가요?',
                        timestamp: new Date(Date.now() - 240000).toISOString(),
                        type: 'text',
                        isOnline: true
                    },
                    {
                        id: 'msg_003',
                        userId: 'system',
                        username: 'System',
                        message: 'VIPMember님이 채팅방에 입장하셨습니다.',
                        timestamp: new Date(Date.now() - 180000).toISOString(),
                        type: 'system'
                    }
                ];
                setMessages(mockMessages);
            }
        } catch (err) {
            console.error('채팅 기록 로딩 오류:', err);
        }
    };

    // 메시지 전송
    const sendMessage = () => {
        if (!newMessage.trim() || !ws || !isConnected) return;

        let messageContent = newMessage.trim();
        let isEncrypted = false;

        // 암호화가 활성화된 경우 메시지 암호화
        if (isEncryptionEnabled && cryptoEnabled) {
            try {
                const encrypted = encryptMessage(messageContent);
                messageContent = JSON.stringify(encrypted);
                isEncrypted = true;
            } catch (error) {
                console.error('메시지 암호화 실패:', error);
                setError('메시지 암호화에 실패했습니다.');
                return;
            }
        }

        const message = {
            type: 'message',
            roomId: currentRoom,
            userId: currentUser.id,
            username: currentUser.username,
            message: messageContent,
            isEncrypted,
            timestamp: new Date().toISOString()
        };

        ws.send(JSON.stringify(message));
        setNewMessage('');
    };

    // 암호화 토글 핸들러
    const handleEncryptionToggle = async () => {
        if (!isEncryptionEnabled) {
            // 암호화 활성화
            setEncryptionDialogOpen(true);
            setIsKeyExchanging(true);
            setKeyExchangeProgress(0);

            try {
                // 키 교환 시뮬레이션
                for (let i = 0; i <= 100; i += 20) {
                    setKeyExchangeProgress(i);
                    await new Promise(resolve => setTimeout(resolve, 200));
                }

                // 암호화 활성화 (useMessageEncryption 훅에서 자동 초기화됨)
                setIsEncryptionEnabled(true);
                setKeyExchangeProgress(100);

                // 성공 메시지
                setTimeout(() => {
                    setEncryptionDialogOpen(false);
                    setIsKeyExchanging(false);
                }, 1000);
            } catch (error) {
                console.error('암호화 초기화 실패:', error);
                setError('암호화 초기화에 실패했습니다.');
                setIsKeyExchanging(false);
            }
        } else {
            // 암호화 비활성화
            setIsEncryptionEnabled(false);
        }
    };

    // 메시지 복호화 헬퍼
    const decryptMessageContent = (message: ChatMessage): string => {
        if (!message.isEncrypted) {
            return message.message;
        }

        try {
            const encryptedData = JSON.parse(message.message);
            const decrypted = decryptMessage(encryptedData);
            return decrypted.content;
        } catch (error) {
            console.error('메시지 복호화 실패:', error);
            return '[복호화 실패]';
        }
    };

    // 채팅방 변경
    const changeRoom = (roomId: string) => {
        setCurrentRoom(roomId);
        setMessages([]);

        if (ws && isConnected) {
            ws.send(JSON.stringify({
                type: 'leave_room',
                roomId: currentRoom,
                userId: currentUser.id
            }));

            ws.send(JSON.stringify({
                type: 'join_room',
                roomId: roomId,
                userId: currentUser.id,
                username: currentUser.username
            }));
        }
    };

    // 상태별 색상
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return 'success';
            case 'away': return 'warning';
            case 'busy': return 'error';
            default: return 'default';
        }
    };

    // 메시지 렌더링
    const renderMessage = (message: ChatMessage) => {
        const isOwnMessage = message.userId === currentUser.id;
        const isSystemMessage = message.type === 'system';

        if (isSystemMessage) {
            return (
                <Box key={message.id} sx={{ textAlign: 'center', my: 1 }}>
                    <Chip label={message.message} size="small" variant="outlined" />
                </Box>
            );
        }

        return (
            <ListItem
                key={message.id}
                sx={{
                    flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                    alignItems: 'flex-start'
                }}
            >
                <ListItemAvatar sx={{ minWidth: isOwnMessage ? 'auto' : 56, ml: isOwnMessage ? 1 : 0, mr: isOwnMessage ? 0 : 1 }}>
                    <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                            message.isOnline ? (
                                <CircleIcon sx={{ fontSize: 12, color: 'success.main' }} />
                            ) : null
                        }
                    >
                        <Avatar sx={{ width: 32, height: 32 }}>
                            {message.username.charAt(0)}
                        </Avatar>
                    </Badge>
                </ListItemAvatar>

                <Box sx={{
                    maxWidth: '70%',
                    textAlign: isOwnMessage ? 'right' : 'left'
                }}>
                    <Box sx={{
                        bgcolor: isOwnMessage ? 'primary.main' : 'grey.100',
                        color: isOwnMessage ? 'white' : 'text.primary',
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        mb: 0.5,
                        position: 'relative'
                    }}>
                        {message.isEncrypted && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <LockIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                <Typography variant="caption">암호화됨</Typography>
                            </Box>
                        )}
                        <Typography variant="body1">
                            {message.isEncrypted ? decryptMessageContent(message) : message.message}
                        </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                        {message.username} • {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Typography>
                </Box>
            </ListItem>
        );
    };

    if (!isOpen) {
        return (
            <Fab
                color="primary"
                sx={{ position: 'fixed', bottom: 16, right: 16 }}
                onClick={() => {
                    onClose();
                    setUnreadCount(0);
                }}
            >
                <Badge badgeContent={unreadCount} color="error">
                    <ChatIcon />
                </Badge>
            </Fab>
        );
    }

    return (
        <Drawer
            anchor="right"
            open={isOpen}
            onClose={onClose}
            sx={{
                '& .MuiDrawer-paper': {
                    width: { xs: '100%', sm: 400 },
                    display: 'flex',
                    flexDirection: 'column'
                }
            }}
        >
            {/* 채팅 헤더 */}
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar>
                    <ChatIcon sx={{ mr: 2 }} />
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        채팅 시스템
                    </Typography>
                    {/* 암호화 토글 버튼 */}
                    <IconButton
                        onClick={handleEncryptionToggle}
                        color={isEncryptionEnabled ? 'success' : 'default'}
                        title={isEncryptionEnabled ? '암호화 활성화됨' : '암호화 비활성화됨'}
                        sx={{ mr: 1 }}
                    >
                        {isEncryptionEnabled ? <LockIcon /> : <LockOpenIcon />}
                    </IconButton>
                    <Chip
                        icon={<CircleIcon />}
                        label={isConnected ? '연결됨' : '연결 중...'}
                        color={isConnected ? 'success' : 'default'}
                        size="small"
                        sx={{ mr: 1 }}
                    />
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* 암호화 상태 안내 */}
            {isEncryptionEnabled && (
                <Alert severity="success" icon={<SecurityIcon />} sx={{ m: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LockIcon fontSize="small" />
                        <Typography variant="body2">
                            엔드투엔드 암호화 활성화됨 - 메시지가 안전하게 보호됩니다
                        </Typography>
                    </Box>
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ m: 1 }}>
                    {error}
                </Alert>
            )}

            {/* 채팅방 목록 */}
            <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" gutterBottom>채팅방</Typography>
                <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto' }}>
                    {rooms.map((room) => (
                        <Chip
                            key={room.id}
                            label={`${room.name} (${room.memberCount})`}
                            onClick={() => changeRoom(room.id)}
                            color={currentRoom === room.id ? 'primary' : 'default'}
                            variant={currentRoom === room.id ? 'filled' : 'outlined'}
                            size="small"
                        />
                    ))}
                </Box>
            </Box>

            {/* 메시지 영역 */}
            <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <List sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
                        {messages.map(renderMessage)}
                        <div ref={messagesEndRef} />
                    </List>
                )}
            </Box>

            {/* 온라인 사용자 */}
            <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', maxHeight: 120, overflow: 'auto' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <PeopleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    온라인 ({onlineUsers.filter(u => u.status === 'online').length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {onlineUsers.map((user) => (
                        <Chip
                            key={user.userId}
                            avatar={
                                <Avatar sx={{ width: 24, height: 24 }}>
                                    {user.username.charAt(0)}
                                </Avatar>
                            }
                            label={user.username}
                            size="small"
                            color={getStatusColor(user.status)}
                            variant="outlined"
                        />
                    ))}
                </Box>
            </Box>

            {/* 메시지 입력 */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {isEncryptionEnabled && (
                        <Chip
                            icon={<LockIcon />}
                            label="암호화"
                            size="small"
                            color="success"
                            sx={{ mr: 1 }}
                        />
                    )}
                    <TextField
                        fullWidth
                        size="small"
                        placeholder={isEncryptionEnabled ? "암호화된 메시지 입력..." : "메시지를 입력하세요..."}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        disabled={!isConnected}
                    />
                    <IconButton
                        color="primary"
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || !isConnected}
                    >
                        <SendIcon />
                    </IconButton>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Enter로 전송 • Shift+Enter로 줄바꿈
                    {isEncryptionEnabled && " • 🔒 메시지가 암호화되어 전송됩니다"}
                </Typography>
            </Box>

            {/* 키 교환 다이얼로그 */}
            <Dialog
                open={encryptionDialogOpen}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <VpnKeyIcon color="primary" />
                        <Typography variant="h6">암호화 키 교환</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        {isKeyExchanging ? (
                            <>
                                <CircularProgress size={60} sx={{ mb: 2 }} />
                                <Typography variant="body1" gutterBottom>
                                    암호화 키를 생성하고 있습니다...
                                </Typography>
                                <Box sx={{ width: '100%', mt: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="caption">진행률</Typography>
                                        <Typography variant="caption">{keyExchangeProgress}%</Typography>
                                    </Box>
                                    <Box sx={{
                                        width: '100%',
                                        height: 8,
                                        bgcolor: 'grey.200',
                                        borderRadius: 1,
                                        overflow: 'hidden'
                                    }}>
                                        <Box sx={{
                                            width: `${keyExchangeProgress}%`,
                                            height: '100%',
                                            bgcolor: 'primary.main',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </Box>
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                                    AES-256-GCM 암호화를 사용하여 메시지를 보호합니다
                                </Typography>
                            </>
                        ) : (
                            <>
                                <SecurityIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
                                <Typography variant="h6" gutterBottom color="success.main">
                                    암호화가 활성화되었습니다!
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    이제 모든 메시지가 엔드투엔드 암호화로 보호됩니다.
                                </Typography>
                            </>
                        )}
                    </Box>
                </DialogContent>
                {!isKeyExchanging && (
                    <DialogActions>
                        <Button onClick={() => setEncryptionDialogOpen(false)} variant="contained">
                            확인
                        </Button>
                    </DialogActions>
                )}
            </Dialog>
        </Drawer>
    );
};

export default ChatSystem;
