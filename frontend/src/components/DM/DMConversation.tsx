import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Avatar,
    IconButton,
    CircularProgress,
    Chip,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonIcon from '@mui/icons-material/Person';
import { dmService, DMMessage, type DMConversation as DMConversationType } from '../../services/dmService';
import DMMessageInput from './DMMessageInput';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface DMConversationProps {
    conversation: DMConversationType;
    currentUserId: number;
}

const DMConversation: React.FC<DMConversationProps> = ({ conversation, currentUserId }) => {
    const [messages, setMessages] = useState<DMMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(1);
    const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadMessages();

        // 대화방 참여
        dmService.joinConversation(conversation.id);

        // 모든 메시지 읽음 처리
        dmService.markAllMessagesAsRead(conversation.id);

        return () => {
            // 대화방 나가기
            dmService.leaveConversation(conversation.id);
        };
    }, [conversation.id]);

    useEffect(() => {
        // 새 메시지 수신
        dmService.onNewMessage((data) => {
            if (data.conversation_id === conversation.id) {
                setMessages((prev) => [...prev, data.message]);
                scrollToBottom();

                // 자동 읽음 처리
                if (data.message.receiver_id === currentUserId) {
                    dmService.markMessageAsRead(data.message.id);
                }
            }
        });

        // 타이핑 상태 수신
        dmService.onTyping((data) => {
            if (data.conversation_id === conversation.id && data.user_id !== currentUserId) {
                setTypingUsers((prev) => {
                    const newSet = new Set(prev);
                    if (data.is_typing) {
                        newSet.add(data.user_id);
                    } else {
                        newSet.delete(data.user_id);
                    }
                    return newSet;
                });
            }
        });

        // 메시지 읽음 상태 수신
        dmService.onMessagesRead((data) => {
            if (data.conversation_id === conversation.id) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.sender_id === currentUserId && !msg.is_read
                            ? { ...msg, is_read: true, read_at: new Date().toISOString() }
                            : msg
                    )
                );
            }
        });
    }, [conversation.id, currentUserId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const response = await dmService.getMessages(conversation.id, page, 50);

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
            await dmService.sendMessage({
                receiver_id: conversation.participant.id,
                content,
                message_type: attachment ? 'file' : 'text',
                attachment,
            });
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleTyping = (isTyping: boolean) => {
        dmService.sendTypingStatus(conversation.id, isTyping);
    };

    const formatMessageTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), {
                addSuffix: true,
                locale: ko
            });
        } catch {
            return '';
        }
    };

    const renderMessage = (message: DMMessage) => {
        const isMine = message.sender_id === currentUserId;

        return (
            <Box
                key={message.id}
                data-testid="dm-message"
                sx={{
                    display: 'flex',
                    flexDirection: isMine ? 'row-reverse' : 'row',
                    mb: 2,
                    alignItems: 'flex-end',
                }}
            >
                {!isMine && (
                    <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                        <PersonIcon />
                    </Avatar>
                )}

                <Box sx={{ maxWidth: '70%' }}>
                    <Paper
                        elevation={1}
                        sx={{
                            p: 1.5,
                            backgroundColor: isMine ? 'primary.main' : 'grey.100',
                            color: isMine ? 'primary.contrastText' : 'text.primary',
                            borderRadius: 2,
                            wordBreak: 'break-word',
                        }}
                    >
                        <Typography variant="body2">{message.content}</Typography>

                        {message.attachment_url && (
                            <Box sx={{ mt: 1 }}>
                                <Chip
                                    label={message.attachment_name || '첨부파일'}
                                    size="small"
                                    onClick={() => window.open(message.attachment_url, '_blank')}
                                />
                            </Box>
                        )}
                    </Paper>

                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mt: 0.5,
                            justifyContent: isMine ? 'flex-end' : 'flex-start',
                        }}
                    >
                        <Typography variant="caption" color="textSecondary">
                            {formatMessageTime(message.created_at)}
                        </Typography>

                        {isMine && message.is_read && (
                            <Typography variant="caption" color="primary" data-testid="dm-message-read">
                                읽음
                            </Typography>
                        )}
                    </Box>
                </Box>
            </Box>
        );
    };

    return (
        <Paper
            elevation={2}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
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
                    <Avatar>
                        <PersonIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                            {conversation.participant.username}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            {conversation.participant.is_online ? '온라인' : '오프라인'}
                        </Typography>
                    </Box>
                </Box>

                <IconButton>
                    <MoreVertIcon />
                </IconButton>
            </Box>

            {/* 메시지 목록 */}
            <Box
                ref={messagesContainerRef}
                sx={{
                    flexGrow: 1,
                    overflow: 'auto',
                    p: 2,
                    backgroundColor: 'grey.50',
                }}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {messages.map(renderMessage)}

                        {/* 타이핑 인디케이터 */}
                        {typingUsers.size > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 32, height: 32 }}>
                                    <PersonIcon />
                                </Avatar>
                                <Paper elevation={1} sx={{ p: 1, backgroundColor: 'grey.100' }}>
                                    <Typography variant="body2" color="textSecondary">
                                        입력 중...
                                    </Typography>
                                </Paper>
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

export default DMConversation;
