import React, { useState, useEffect } from 'react';
import {
    Container,
    Box,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Paper,
    Button,
    Divider,
    CircularProgress,
    Chip,
    Stack,
    Alert,
    IconButton,
    Menu,
    MenuItem,
} from '@mui/material';
import {
    Comment,
    ThumbUp,
    PersonAdd,
    Article,
    CheckCircle,
    Delete,
    MoreVert,
    Refresh,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Notification {
    id: number;
    user_id: number;
    type: string;
    title: string;
    content: string;
    related_id: number | null;
    related_type: string | null;
    actor_id: number | null;
    is_read: number;
    created_at: string;
    read_at: string | null;
    actor_username: string | null;
    actor_display_name: string | null;
    actor_avatar_url: string | null;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const NotificationList: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [total, setTotal] = useState(0);
    const [anchorEl, setAnchorEl] = useState<{ [key: number]: HTMLElement | null }>({});
    const navigate = useNavigate();

    // 알림 목록 가져오기
    const fetchNotifications = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('로그인이 필요합니다.');
                return;
            }

            const unreadOnly = filter === 'unread' ? 'true' : 'false';
            const response = await axios.get(
                `${API_BASE_URL}/notifications-simple?limit=50&unread_only=${unreadOnly}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                setNotifications(response.data.notifications);
                setTotal(response.data.total);
            }
        } catch (err: any) {
            console.error('Failed to fetch notifications:', err);
            setError(err.response?.data?.message || '알림을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [filter]);

    // 알림 클릭
    const handleNotificationClick = async (notification: Notification) => {
        try {
            const token = localStorage.getItem('token');
            if (token && notification.is_read === 0) {
                // 읽음 처리
                await axios.put(
                    `${API_BASE_URL}/notifications-simple/${notification.id}/read`,
                    {},
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
            }

            // 관련 페이지로 이동
            if (notification.related_type === 'post' && notification.related_id) {
                navigate(`/posts/${notification.related_id}`);
            } else if (notification.related_type === 'comment' && notification.related_id) {
                navigate(`/posts/${notification.related_id}`);
            } else if (notification.related_type === 'user' && notification.related_id) {
                navigate(`/users/${notification.related_id}`);
            }

            // 알림 목록 새로고침
            fetchNotifications();
        } catch (error) {
            console.error('Failed to handle notification click:', error);
        }
    };

    // 모두 읽음 처리
    const handleMarkAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await axios.put(
                `${API_BASE_URL}/notifications-simple/read-all`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    // 알림 삭제
    const handleDeleteNotification = async (notificationId: number) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await axios.delete(
                `${API_BASE_URL}/notifications-simple/${notificationId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            fetchNotifications();
            handleMenuClose(notificationId);
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    // 읽은 알림 모두 삭제
    const handleDeleteRead = async () => {
        if (!window.confirm('읽은 알림을 모두 삭제하시겠습니까?')) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await axios.delete(
                `${API_BASE_URL}/notifications-simple?read_only=true`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            fetchNotifications();
        } catch (error) {
            console.error('Failed to delete read notifications:', error);
        }
    };

    // 메뉴 열기/닫기
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, id: number) => {
        event.stopPropagation();
        setAnchorEl({ ...anchorEl, [id]: event.currentTarget });
    };

    const handleMenuClose = (id: number) => {
        setAnchorEl({ ...anchorEl, [id]: null });
    };

    // 알림 타입별 아이콘
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'comment':
            case 'reply':
                return <Comment color="primary" />;
            case 'like':
            case 'comment_like':
                return <ThumbUp color="error" />;
            case 'follow':
                return <PersonAdd color="success" />;
            case 'post':
                return <Article color="info" />;
            default:
                return <Article />;
        }
    };

    if (loading && notifications.length === 0) {
        return (
            <Container maxWidth="md">
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="md">
            <Box sx={{ py: 4 }}>
                {/* 헤더 */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        flexWrap="wrap"
                        gap={2}
                    >
                        <Typography variant="h5" component="h1">
                            알림
                        </Typography>

                        <Stack direction="row" spacing={1}>
                            <Button
                                size="small"
                                startIcon={<Refresh />}
                                onClick={fetchNotifications}
                                disabled={loading}
                            >
                                새로고침
                            </Button>
                            <Button
                                size="small"
                                startIcon={<CheckCircle />}
                                onClick={handleMarkAllAsRead}
                                disabled={loading}
                            >
                                모두 읽음
                            </Button>
                            <Button
                                size="small"
                                startIcon={<Delete />}
                                onClick={handleDeleteRead}
                                disabled={loading}
                                color="error"
                            >
                                읽은 알림 삭제
                            </Button>
                        </Stack>
                    </Stack>

                    {/* 필터 */}
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        <Chip
                            label={`전체 (${total})`}
                            onClick={() => setFilter('all')}
                            color={filter === 'all' ? 'primary' : 'default'}
                            variant={filter === 'all' ? 'filled' : 'outlined'}
                        />
                        <Chip
                            label="읽지 않음"
                            onClick={() => setFilter('unread')}
                            color={filter === 'unread' ? 'primary' : 'default'}
                            variant={filter === 'unread' ? 'filled' : 'outlined'}
                        />
                    </Stack>
                </Paper>

                {/* 에러 메시지 */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {/* 알림 목록 */}
                <Paper>
                    {notifications.length === 0 ? (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                {filter === 'unread' ? '읽지 않은 알림이 없습니다' : '알림이 없습니다'}
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ p: 0 }}>
                            {notifications.map((notification, index) => (
                                <React.Fragment key={notification.id}>
                                    {index > 0 && <Divider />}
                                    <ListItemButton
                                        onClick={() => handleNotificationClick(notification)}
                                        sx={{
                                            backgroundColor:
                                                notification.is_read === 0 ? 'action.hover' : 'transparent',
                                            '&:hover': {
                                                backgroundColor: 'action.selected',
                                            },
                                            alignItems: 'flex-start',
                                            py: 2,
                                        }}
                                    >
                                        <ListItemAvatar>
                                            {notification.actor_avatar_url ? (
                                                <Avatar
                                                    src={notification.actor_avatar_url}
                                                    alt={
                                                        notification.actor_display_name || notification.actor_username || ''
                                                    }
                                                />
                                            ) : (
                                                <Avatar>{getNotificationIcon(notification.type)}</Avatar>
                                            )}
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'flex-start',
                                                    }}
                                                >
                                                    <Typography variant="subtitle2">
                                                        {notification.title}
                                                        {notification.is_read === 0 && (
                                                            <Chip
                                                                label="New"
                                                                size="small"
                                                                color="primary"
                                                                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                                            />
                                                        )}
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {notification.content}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{ mt: 0.5, display: 'block' }}
                                                    >
                                                        {formatDistanceToNow(new Date(notification.created_at), {
                                                            addSuffix: true,
                                                            locale: ko,
                                                        })}
                                                    </Typography>
                                                </>
                                            }
                                        />
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleMenuOpen(e, notification.id)}
                                        >
                                            <MoreVert fontSize="small" />
                                        </IconButton>
                                        <Menu
                                            anchorEl={anchorEl[notification.id]}
                                            open={Boolean(anchorEl[notification.id])}
                                            onClose={() => handleMenuClose(notification.id)}
                                        >
                                            <MenuItem
                                                onClick={() => handleDeleteNotification(notification.id)}
                                            >
                                                <Delete fontSize="small" sx={{ mr: 1 }} />
                                                삭제
                                            </MenuItem>
                                        </Menu>
                                    </ListItemButton>
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </Paper>
            </Box>
        </Container>
    );
};

export default NotificationList;
