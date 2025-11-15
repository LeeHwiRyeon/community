import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    List,
    ListItem,
    ListItemButton,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Badge,
    Typography,
    TextField,
    InputAdornment,
    IconButton,
    Divider,
    CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import { dmService, type DMConversation } from '../../services/dmService';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface DMInboxProps {
    onSelectConversation: (conversation: DMConversation) => void;
    selectedConversationId?: number;
}

const DMInbox: React.FC<DMInboxProps> = ({ onSelectConversation, selectedConversationId }) => {
    const [conversations, setConversations] = useState<DMConversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    useEffect(() => {
        loadConversations();
    }, [page, searchQuery]);

    useEffect(() => {
        // 새 메시지 수신 시 목록 업데이트
        dmService.onNewMessage((data: any) => {
            loadConversations();
        });

        // 메시지 읽음 시 목록 업데이트
        dmService.onMessagesRead((data: any) => {
            setConversations((prev) =>
                prev.map((conv) =>
                    conv.id === data.conversation_id
                        ? { ...conv, unread_count: Math.max(0, conv.unread_count - data.marked_count) }
                        : conv
                )
            );
        });
    }, []);

    const loadConversations = async () => {
        try {
            setLoading(true);
            const response = await dmService.getConversations(page, 20, searchQuery);

            if (response.success) {
                setConversations(response.data.conversations);
                setHasMore(page < response.data.pagination.total_pages);
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
        setPage(1);
    };

    const formatLastMessageTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), {
                addSuffix: true,
                locale: ko
            });
        } catch {
            return '';
        }
    };

    return (
        <Paper
            elevation={2}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            {/* 검색 바 */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="대화 검색..."
                    value={searchQuery}
                    onChange={handleSearch}
                    inputProps={{ 'data-testid': 'dm-search-input' }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            {/* 대화 목록 */}
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                {loading && conversations.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : conversations.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }} data-testid="dm-empty-state">
                        <Typography color="textSecondary">
                            대화가 없습니다
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {conversations.map((conversation) => (
                            <React.Fragment key={conversation.id}>
                                <ListItem disablePadding>
                                    <ListItemButton
                                        selected={selectedConversationId === conversation.id}
                                        onClick={() => onSelectConversation(conversation)}
                                        data-testid={`dm-conversation${conversation.unread_count > 0 ? '-unread' : ''}`}
                                    >
                                        <ListItemAvatar>
                                            <Badge
                                                overlap="circular"
                                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                variant="dot"
                                                sx={{
                                                    '& .MuiBadge-badge': {
                                                        backgroundColor: conversation.participant.is_online
                                                            ? '#44b700'
                                                            : 'grey.400',
                                                        boxShadow: (theme) => `0 0 0 2px ${theme.palette.background.paper}`,
                                                    },
                                                }}
                                            >
                                                <Avatar>
                                                    <PersonIcon />
                                                </Avatar>
                                            </Badge>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography
                                                        variant="subtitle2"
                                                        fontWeight={conversation.unread_count > 0 ? 'bold' : 'normal'}
                                                    >
                                                        {conversation.participant.username}
                                                    </Typography>
                                                    {conversation.last_message && (
                                                        <Typography variant="caption" color="textSecondary">
                                                            {formatLastMessageTime(conversation.last_message.created_at)}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography
                                                        variant="body2"
                                                        color="textSecondary"
                                                        noWrap
                                                        sx={{
                                                            maxWidth: '200px',
                                                            fontWeight: conversation.unread_count > 0 ? 'bold' : 'normal',
                                                        }}
                                                        data-testid="dm-timestamp"
                                                    >
                                                        {conversation.last_message?.content || '메시지가 없습니다'}
                                                    </Typography>
                                                    {conversation.unread_count > 0 && (
                                                        <Badge
                                                            badgeContent={conversation.unread_count}
                                                            color="primary"
                                                            sx={{ ml: 1 }}
                                                        />
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItemButton>
                                </ListItem>
                                <Divider variant="inset" component="li" />
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Box>

            {/* 더 불러오기 */}
            {hasMore && (
                <Box sx={{ p: 2, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
                    <IconButton onClick={() => setPage(page + 1)} disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : <Typography>더 보기</Typography>}
                    </IconButton>
                </Box>
            )}
        </Paper>
    );
};

export default DMInbox;
