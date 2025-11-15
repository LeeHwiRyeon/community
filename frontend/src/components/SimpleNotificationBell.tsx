import React, { useState, useEffect } from 'react';
import {
    Badge,
    IconButton,
    Popover,
    Box,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Divider,
    Button,
    CircularProgress,
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Comment,
    ThumbUp,
    PersonAdd,
    Article,
    CheckCircle,
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

const SimpleNotificationBell: React.FC = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const open = Boolean(anchorEl);

    // 알림 개수 가져오기
    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) return;

            const response = await axios.get(
                `${API_BASE_URL}/notifications-simple/unread-count`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                setUnreadCount(response.data.count);
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    // 알림 목록 가져오기
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) return;

            const response = await axios.get(
                `${API_BASE_URL}/notifications-simple?limit=10`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                setNotifications(response.data.notifications);
                setUnreadCount(response.data.unread_count);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // 초기 로드 및 주기적 업데이트
    useEffect(() => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // 30초마다 업데이트
        return () => clearInterval(interval);
    }, []);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
        fetchNotifications();
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    // 알림 클릭
    const handleNotificationClick = async (notification: Notification) => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
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

            handleClose();
            fetchUnreadCount();
        } catch (error) {
            console.error('Failed to handle notification click:', error);
        }
    };

    // 모두 읽음 처리
    const handleMarkAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) return;

            await axios.put(
                `${API_BASE_URL}/notifications-simple/read-all`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            fetchNotifications();
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
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
                return <NotificationsIcon />;
        }
    };

    return (
        <>
            <IconButton color="inherit" onClick={handleClick} data-testid="notification-bell">
                <Badge badgeContent={unreadCount} color="error" data-testid="notification-badge">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        width: 400,
                        maxHeight: 600,
                    },
                }}
                data-testid="notification-center"
            >
                {/* 헤더 */}
                <Box sx={{ p: 2, pb: 1 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <Typography variant="h6">알림</Typography>
                        {unreadCount > 0 && (
                            <Button
                                size="small"
                                startIcon={<CheckCircle />}
                                onClick={handleMarkAllAsRead}
                                data-testid="mark-all-read"
                            >
                                모두 읽음
                            </Button>
                        )}
                    </Box>
                </Box>

                <Divider />

                {/* 알림 목록 */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : notifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            알림이 없습니다
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0, maxHeight: 450, overflow: 'auto' }}>
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
                                    }}
                                    data-testid="notification-item"
                                    className={notification.is_read === 0 ? 'unread' : 'read'}
                                >
                                    <ListItemAvatar>
                                        {notification.actor_avatar_url ? (
                                            <Avatar
                                                src={notification.actor_avatar_url}
                                                alt={notification.actor_display_name || notification.actor_username || ''}
                                                data-testid="notification-icon"
                                            />
                                        ) : (
                                            <Avatar data-testid="notification-icon">{getNotificationIcon(notification.type)}</Avatar>
                                        )}
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography variant="subtitle2" noWrap>
                                                {notification.title}
                                            </Typography>
                                        }
                                        secondary={
                                            <>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    {notification.content}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatDistanceToNow(new Date(notification.created_at), {
                                                        addSuffix: true,
                                                        locale: ko,
                                                    })}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItemButton>
                            </React.Fragment>
                        ))}
                    </List>
                )}

                <Divider />

                {/* 푸터 */}
                <Box sx={{ p: 1, textAlign: 'center' }}>
                    <Button
                        fullWidth
                        onClick={() => {
                            navigate('/notifications');
                            handleClose();
                        }}
                    >
                        모든 알림 보기
                    </Button>
                </Box>
            </Popover>
        </>
    );
};

export default SimpleNotificationBell;
