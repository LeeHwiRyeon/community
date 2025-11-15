import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Avatar,
    IconButton,
    CircularProgress,
    Chip,
    Divider,
    Menu,
    MenuItem,
    Badge,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import GroupIcon from '@mui/icons-material/Group';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { groupChatService, type GroupChat, type GroupMessage } from '../../services/groupChatService';
import DMMessageInput from '../DM/DMMessageInput';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface GroupChatRoomProps {
    group: GroupChat;
    currentUserId: number;
    onShowMembers?: () => void;
    onShowSettings?: () => void;
    onLeaveGroup?: () => void;
}

const GroupChatRoom: React.FC<GroupChatRoomProps> = ({
    group,
    currentUserId,
    onShowMembers,
    onShowSettings,
    onLeaveGroup,
}) => {
    const [messages, setMessages] = useState<GroupMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(1);
    const [typingUsers, setTypingUsers] = useState<Map<number, string>>(new Map());
    const [onlineCount, setOnlineCount] = useState(0);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadMessages();

        // 그룹 채팅방 참여
        groupChatService.joinRoom(group.id);

        // 온라인 멤버 조회
        groupChatService.getOnlineMembers(group.id, (data) => {
            setOnlineCount(data.online_members?.length || 0);
        });

        return () => {
            // 그룹 채팅방 나가기
            groupChatService.leaveRoom(group.id);
        };
    }, [group.id]);

    useEffect(() => {
        // 새 메시지 수신
        groupChatService.onNewMessage((data) => {
            if (data.group_id === group.id) {
                setMessages((prev) => [...prev, data.message]);
                scrollToBottom();

                // 자동 읽음 처리 (내가 보낸 메시지가 아닌 경우)
                if (data.message.sender_id !== currentUserId) {
                    groupChatService.markAsRead(group.id, data.message.id);
                }
            }
        });

        // 타이핑 상태 수신
        groupChatService.onTyping((data) => {
            if (data.group_id === group.id && data.user_id !== currentUserId) {
                setTypingUsers((prev) => {
                    const newMap = new Map(prev);
                    if (data.is_typing) {
                        newMap.set(data.user_id, data.username);
                    } else {
                        newMap.delete(data.user_id);
                    }
                    return newMap;
                });
            }
        });

        // 메시지 읽음 상태 수신
        groupChatService.onMessageRead((data) => {
            if (data.group_id === group.id) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === data.message_id
                            ? {
                                ...msg,
                                read_by: [...(msg.read_by || []), data.user_id],
                            }
                            : msg
                    )
                );
            }
        });

        // 메시지 삭제 수신
        groupChatService.onMessageDeleted((data) => {
            if (data.group_id === group.id) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === data.message_id
                            ? { ...msg, is_deleted: true, content: '삭제된 메시지입니다' }
                            : msg
                    )
                );
            }
        });

        // 사용자 입장/퇴장
        groupChatService.onUserJoined((data) => {
            if (data.group_id === group.id) {
                setOnlineCount((prev) => prev + 1);
            }
        });

        groupChatService.onUserLeft((data) => {
            if (data.group_id === group.id) {
                setOnlineCount((prev) => Math.max(0, prev - 1));
            }
        });
    }, [group.id, currentUserId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const response = await groupChatService.getMessages(group.id, page, 50);

            if (response.success) {
                setMessages(response.data.messages);
                setHasMore(response.data.pagination.has_more);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (content: string, attachment?: any) => {
        try {
            // WebSocket으로 메시지 전송
            groupChatService.sendMessageViaSocket(
                group.id,
                content,
                attachment ? 'file' : 'text'
            );
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleTyping = (isTyping: boolean) => {
        groupChatService.sendTypingStatus(group.id, isTyping);

        // 타이핑 중지 타이머 설정
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        if (isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
                groupChatService.sendTypingStatus(group.id, false);
            }, 3000);
        }
    };

    const handleDeleteMessage = async (messageId: number) => {
        try {
            await groupChatService.deleteMessage(messageId);
        } catch (error) {
            console.error('Failed to delete message:', error);
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const formatMessageTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), {
                addSuffix: true,
                locale: ko,
            });
        } catch {
            return '';
        }
    };

    const renderMessage = (message: GroupMessage) => {
        const isMine = message.sender_id === currentUserId;
        const isSystem = message.message_type === 'system';

        // 시스템 메시지
        if (isSystem) {
            return (
                <Box
                    key={message.id}
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        my: 2,
                    }}
                >
                    <Chip
                        label={message.content}
                        size="small"
                        sx={{
                            bgcolor: 'grey.200',
                            color: 'text.secondary',
                            fontSize: '0.75rem',
                        }}
                    />
                </Box>
            );
        }

        return (
            <Box
                key={message.id}
                sx={{
                    display: 'flex',
                    flexDirection: isMine ? 'row-reverse' : 'row',
                    mb: 2,
                    gap: 1,
                }}
            >
                {!isMine && (
                    <Avatar
                        src={message.sender_avatar}
                        sx={{ width: 32, height: 32 }}
                    >
                        {message.sender_username?.[0]?.toUpperCase()}
                    </Avatar>
                )}

                <Box sx={{ maxWidth: '70%' }}>
                    {!isMine && (
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                mb: 0.5,
                                ml: 1,
                                color: 'text.secondary',
                            }}
                        >
                            {message.sender_username}
                        </Typography>
                    )}

                    <Paper
                        sx={{
                            p: 1.5,
                            bgcolor: isMine ? 'primary.main' : 'grey.100',
                            color: isMine ? 'white' : 'text.primary',
                            borderRadius: 2,
                            ...(message.is_deleted && {
                                bgcolor: 'grey.200',
                                fontStyle: 'italic',
                            }),
                        }}
                    >
                        {message.is_deleted ? (
                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                삭제된 메시지입니다
                            </Typography>
                        ) : (
                            <>
                                {message.message_type === 'image' && (
                                    <Box
                                        component="img"
                                        src={message.attachment_url}
                                        alt="Image"
                                        sx={{
                                            maxWidth: '100%',
                                            borderRadius: 1,
                                            mb: 1,
                                        }}
                                    />
                                )}
                                {message.message_type === 'file' && (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            mb: 1,
                                        }}
                                    >
                                        <Typography variant="body2">
                                            📎 {message.attachment_name}
                                        </Typography>
                                    </Box>
                                )}
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {message.content}
                                </Typography>
                            </>
                        )}
                    </Paper>

                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mt: 0.5,
                            ml: isMine ? 0 : 1,
                            mr: isMine ? 1 : 0,
                            justifyContent: isMine ? 'flex-end' : 'flex-start',
                        }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            {formatMessageTime(message.created_at)}
                        </Typography>
                        {message.is_edited && (
                            <Typography variant="caption" color="text.secondary">
                                (수정됨)
                            </Typography>
                        )}
                        {isMine && message.read_by && message.read_by.length > 0 && (
                            <Typography variant="caption" color="primary">
                                읽음 {message.read_by.length}
                            </Typography>
                        )}
                    </Box>
                </Box>
            </Box>
        );
    };

    const typingText = Array.from(typingUsers.values()).join(', ');

    return (
        <Paper
            elevation={2}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {/* 헤더 */}
            <Box
                sx={{
                    p: 2,
                    borderBottom: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={group.avatar_url} sx={{ width: 40, height: 40 }}>
                        <GroupIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {group.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                멤버 {group.member_count || 0}명
                            </Typography>
                            <Badge
                                badgeContent={onlineCount}
                                color="success"
                                max={99}
                            >
                                <Typography variant="caption" color="text.secondary">
                                    온라인
                                </Typography>
                            </Badge>
                        </Box>
                    </Box>
                </Box>

                <IconButton onClick={handleMenuOpen}>
                    <MoreVertIcon />
                </IconButton>

                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    {onShowMembers && (
                        <MenuItem
                            onClick={() => {
                                onShowMembers();
                                handleMenuClose();
                            }}
                        >
                            <GroupIcon sx={{ mr: 1 }} fontSize="small" />
                            멤버 목록
                        </MenuItem>
                    )}
                    {onShowSettings && group.my_role !== 'member' && (
                        <MenuItem
                            onClick={() => {
                                onShowSettings();
                                handleMenuClose();
                            }}
                        >
                            <SettingsIcon sx={{ mr: 1 }} fontSize="small" />
                            그룹 설정
                        </MenuItem>
                    )}
                    <Divider />
                    {onLeaveGroup && (
                        <MenuItem
                            onClick={() => {
                                onLeaveGroup();
                                handleMenuClose();
                            }}
                            sx={{ color: 'error.main' }}
                        >
                            <ExitToAppIcon sx={{ mr: 1 }} fontSize="small" />
                            그룹 나가기
                        </MenuItem>
                    )}
                </Menu>
            </Box>

            {/* 메시지 영역 */}
            <Box
                ref={messagesContainerRef}
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: 2,
                    bgcolor: 'grey.50',
                }}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : messages.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant="body1" color="text.secondary">
                            아직 메시지가 없습니다
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            첫 메시지를 보내보세요!
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {messages.map(renderMessage)}
                        {typingUsers.size > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 5 }}>
                                <Typography variant="caption" color="text.secondary">
                                    {typingText}님이 입력 중...
                                </Typography>
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </Box>

            {/* 메시지 입력 */}
            <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
                <DMMessageInput
                    onSend={handleSendMessage}
                    onTyping={handleTyping}
                />
            </Box>
        </Paper>
    );
};

export default GroupChatRoom;
