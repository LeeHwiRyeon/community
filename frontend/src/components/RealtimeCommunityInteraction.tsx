/**
 * 💬 실시간 커뮤니티 상호작용 시스템
 * 
 * 실시간 채팅, 알림, 사용자 상태 관리
 * WebSocket 기반 실시간 통신
 * 
 * @author AUTOAGENTS Manager
 * @version 2.0.0
 * @created 2025-01-02
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box, Typography, Card, CardContent, CardActions, Button,
    TextField, IconButton, Avatar, Badge, Chip, List, ListItem,
    ListItemText, ListItemAvatar, ListItemSecondaryAction, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions, Alert,
    Snackbar, Tooltip, Paper, Stack, Switch, FormControlLabel,
    Tabs, Tab, Accordion, AccordionSummary, AccordionDetails,
    InputAdornment, Menu, MenuItem, Popper, ClickAwayListener
} from '@mui/material';
import {
    Send as SendIcon, AttachFile as AttachFileIcon,
    EmojiEmotions as EmojiIcon, MoreVert as MoreVertIcon,
    Notifications as NotificationsIcon, NotificationsOff as NotificationsOffIcon,
    OnlinePrediction as OnlineIcon, OfflineBolt as OfflineIcon,
    Chat as ChatIcon, VideoCall as VideoCallIcon,
    Phone as PhoneIcon, Block as BlockIcon, Report as ReportIcon,
    ExpandMore as ExpandMoreIcon, Close as CloseIcon,
    Add as AddIcon, Remove as RemoveIcon, Star as StarIcon
} from '@mui/icons-material';

// 타입 정의
interface User {
    id: string;
    name: string;
    avatar: string;
    status: 'online' | 'offline' | 'away' | 'busy';
    lastSeen: string;
    isTyping: boolean;
    role: 'admin' | 'moderator' | 'member' | 'guest';
    badges: string[];
}

interface Message {
    id: string;
    content: string;
    sender: User;
    timestamp: string;
    type: 'text' | 'image' | 'file' | 'system';
    replyTo?: string;
    reactions: Array<{
        emoji: string;
        users: string[];
        count: number;
    }>;
    isEdited: boolean;
    isDeleted: boolean;
}

interface ChatRoom {
    id: string;
    name: string;
    type: 'public' | 'private' | 'direct';
    participants: User[];
    messages: Message[];
    isActive: boolean;
    unreadCount: number;
    lastMessage?: Message;
    settings: {
        allowFileUpload: boolean;
        allowEmojis: boolean;
        allowReactions: boolean;
        maxMessageLength: number;
        slowMode: boolean;
        slowModeDelay: number;
    };
}

interface Notification {
    id: string;
    type: 'message' | 'mention' | 'reaction' | 'system' | 'invite';
    title: string;
    message: string;
    timestamp: string;
    isRead: boolean;
    actionUrl?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface RealtimeCommunityInteractionProps {
    currentUser: User;
    communities: Array<{
        id: string;
        name: string;
        chatRooms: ChatRoom[];
    }>;
    onMessageSend?: (roomId: string, message: Message) => void;
    onUserStatusChange?: (userId: string, status: User['status']) => void;
    onNotificationReceived?: (notification: Notification) => void;
}

const RealtimeCommunityInteraction: React.FC<RealtimeCommunityInteractionProps> = ({
    currentUser,
    communities = [],
    onMessageSend,
    onUserStatusChange,
    onNotificationReceived
}) => {
    const [selectedCommunity, setSelectedCommunity] = useState<string>('');
    const [selectedRoom, setSelectedRoom] = useState<string>('');
    const [messageInput, setMessageInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [selectedTab, setSelectedTab] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();

    // 현재 선택된 채팅방
    const currentRoom = communities
        .find(c => c.id === selectedCommunity)
        ?.chatRooms.find(r => r.id === selectedRoom);

    // 메시지 스크롤을 맨 아래로
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // 타이핑 상태 관리
    const handleTyping = useCallback(() => {
        setIsTyping(true);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
        }, 1000);
    }, []);

    // 메시지 전송
    const handleSendMessage = useCallback(() => {
        if (!messageInput.trim() || !currentRoom) return;

        const message: Message = {
            id: `msg_${Date.now()}`,
            content: messageInput.trim(),
            sender: currentUser,
            timestamp: new Date().toISOString(),
            type: 'text',
            reactions: [],
            isEdited: false,
            isDeleted: false
        };

        onMessageSend?.(currentRoom.id, message);
        setMessageInput('');
        setIsTyping(false);
        scrollToBottom();
    }, [messageInput, currentRoom, currentUser, onMessageSend, scrollToBottom]);

    // 키보드 이벤트 처리
    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        } else {
            handleTyping();
        }
    }, [handleSendMessage, handleTyping]);

    // 이모지 선택
    const handleEmojiSelect = useCallback((emoji: string) => {
        setMessageInput(prev => prev + emoji);
        setShowEmojiPicker(false);
    }, []);

    // 메시지 반응 추가
    const handleAddReaction = useCallback((messageId: string, emoji: string) => {
        if (!currentRoom) return;

        const message = currentRoom.messages.find(m => m.id === messageId);
        if (!message) return;

        const existingReaction = message.reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
            if (existingReaction.users.includes(currentUser.id)) {
                existingReaction.users = existingReaction.users.filter(id => id !== currentUser.id);
                existingReaction.count = existingReaction.users.length;
            } else {
                existingReaction.users.push(currentUser.id);
                existingReaction.count = existingReaction.users.length;
            }
        } else {
            message.reactions.push({
                emoji,
                users: [currentUser.id],
                count: 1
            });
        }
    }, [currentRoom, currentUser]);

    // 알림 토글
    const toggleNotifications = useCallback(() => {
        setSnackbar({
            open: true,
            message: '알림 설정이 변경되었습니다.',
            severity: 'success'
        });
    }, []);

    // 컴포넌트 마운트 시 스크롤
    useEffect(() => {
        scrollToBottom();
    }, [currentRoom?.messages, scrollToBottom]);

    // 사용자 상태 컴포넌트
    const UserStatus: React.FC<{ user: User }> = ({ user }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                    <Box
                        sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: user.status === 'online' ? 'success.main' :
                                user.status === 'away' ? 'warning.main' :
                                    user.status === 'busy' ? 'error.main' : 'grey.400',
                            border: '2px solid white'
                        }}
                    />
                }
            >
                <Avatar src={user.avatar} sx={{ width: 32, height: 32 }}>
                    {user.name.charAt(0).toUpperCase()}
                </Avatar>
            </Badge>
            <Box>
                <Typography variant="body2" fontWeight="medium">
                    {user.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {user.status === 'online' ? '온라인' :
                        user.status === 'away' ? '자리비움' :
                            user.status === 'busy' ? '바쁨' : '오프라인'}
                </Typography>
            </Box>
        </Box>
    );

    // 메시지 컴포넌트
    const MessageItem: React.FC<{ message: Message }> = ({ message }) => (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Avatar src={message.sender.avatar} sx={{ width: 32, height: 32 }}>
                {message.sender.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="body2" fontWeight="medium">
                        {message.sender.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {new Date(message.timestamp).toLocaleTimeString()}
                    </Typography>
                    {message.isEdited && (
                        <Typography variant="caption" color="text.secondary">
                            (수정됨)
                        </Typography>
                    )}
                </Box>
                <Paper
                    sx={{
                        p: 1.5,
                        bgcolor: message.sender.id === currentUser.id ? 'primary.main' : 'grey.100',
                        color: message.sender.id === currentUser.id ? 'white' : 'text.primary',
                        borderRadius: 2
                    }}
                >
                    <Typography variant="body2">
                        {message.content}
                    </Typography>
                </Paper>
                {message.reactions.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                        {message.reactions.map((reaction, index) => (
                            <Chip
                                key={index}
                                label={`${reaction.emoji} ${reaction.count}`}
                                size="small"
                                onClick={() => handleAddReaction(message.id, reaction.emoji)}
                                sx={{ cursor: 'pointer' }}
                            />
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* 헤더 */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h5" gutterBottom>
                    💬 실시간 커뮤니티 상호작용
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="알림"
                        onChange={toggleNotifications}
                    />
                    <Badge badgeContent={notifications.filter(n => !n.isRead).length} color="error">
                        <NotificationsIcon />
                    </Badge>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                {/* 사이드바 */}
                <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider', p: 2 }}>
                    <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
                        <Tab label="채팅" />
                        <Tab label="사용자" />
                        <Tab label="알림" />
                    </Tabs>

                    {selectedTab === 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                커뮤니티
                            </Typography>
                            <List>
                                {communities.map((community) => (
                                    <ListItem
                                        key={community.id}
                                        onClick={() => setSelectedCommunity(community.id)}
                                        sx={{
                                            cursor: 'pointer',
                                            backgroundColor: selectedCommunity === community.id ? 'action.selected' : 'transparent',
                                            '&:hover': {
                                                backgroundColor: 'action.hover'
                                            }
                                        }}
                                    >
                                        <ListItemText primary={community.name} />
                                        <Badge badgeContent={community.chatRooms.reduce((acc, room) => acc + room.unreadCount, 0)} color="error" />
                                    </ListItem>
                                ))}
                            </List>

                            {selectedCommunity && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        채팅방
                                    </Typography>
                                    <List>
                                        {communities
                                            .find(c => c.id === selectedCommunity)
                                            ?.chatRooms.map((room) => (
                                                <ListItem
                                                    key={room.id}
                                                    onClick={() => setSelectedRoom(room.id)}
                                                    sx={{
                                                        cursor: 'pointer',
                                                        backgroundColor: selectedRoom === room.id ? 'action.selected' : 'transparent',
                                                        '&:hover': {
                                                            backgroundColor: 'action.hover'
                                                        }
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={room.name}
                                                        secondary={room.lastMessage?.content}
                                                    />
                                                    <Badge badgeContent={room.unreadCount} color="error" />
                                                </ListItem>
                                            ))}
                                    </List>
                                </Box>
                            )}
                        </Box>
                    )}

                    {selectedTab === 1 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                온라인 사용자 ({onlineUsers.length})
                            </Typography>
                            <List>
                                {onlineUsers.map((user) => (
                                    <ListItem key={user.id}>
                                        <UserStatus user={user} />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}

                    {selectedTab === 2 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                알림 ({notifications.length})
                            </Typography>
                            <List>
                                {notifications.map((notification) => (
                                    <ListItem key={notification.id}>
                                        <ListItemText
                                            primary={notification.title}
                                            secondary={notification.message}
                                        />
                                        {!notification.isRead && (
                                            <Badge color="error" variant="dot" />
                                        )}
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}
                </Box>

                {/* 메인 채팅 영역 */}
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    {currentRoom ? (
                        <>
                            {/* 채팅방 헤더 */}
                            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                                <Typography variant="h6">
                                    {currentRoom.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {currentRoom.participants.length}명 참여
                                </Typography>
                            </Box>

                            {/* 메시지 목록 */}
                            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                                {currentRoom.messages.map((message) => (
                                    <MessageItem key={message.id} message={message} />
                                ))}
                                {isTyping && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <Avatar sx={{ width: 24, height: 24 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            타이핑 중...
                                        </Typography>
                                    </Box>
                                )}
                                <div ref={messagesEndRef} />
                            </Box>

                            {/* 메시지 입력 */}
                            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <TextField
                                        fullWidth
                                        placeholder="메시지를 입력하세요..."
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                                                        <EmojiIcon />
                                                    </IconButton>
                                                    <IconButton onClick={() => setShowFileUpload(true)}>
                                                        <AttachFileIcon />
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                    <IconButton
                                        color="primary"
                                        onClick={handleSendMessage}
                                        disabled={!messageInput.trim()}
                                    >
                                        <SendIcon />
                                    </IconButton>
                                </Box>
                            </Box>
                        </>
                    ) : (
                        <Box sx={{
                            flexGrow: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: 2
                        }}>
                            <ChatIcon sx={{ fontSize: 64, color: 'grey.400' }} />
                            <Typography variant="h6" color="text.secondary">
                                채팅방을 선택하세요
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* 스낵바 */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default RealtimeCommunityInteraction;
