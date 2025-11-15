import React, { useState, useEffect } from 'react';
import {
    Badge,
    IconButton,
    Popover,
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    Divider,
    Button,
} from '@mui/material';
import MailIcon from '@mui/icons-material/Mail';
import { dmService } from '../../services/dmService';

interface DMNotificationProps {
    userId: number;
    onOpenInbox: () => void;
}

const DMNotification: React.FC<DMNotificationProps> = ({ userId, onOpenInbox }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [recentMessages, setRecentMessages] = useState<any[]>([]);

    useEffect(() => {
        loadUnreadCount();

        // WebSocket 초기화
        dmService.initSocket(userId);

        // 새 메시지 수신 시 알림
        dmService.onNewMessage((data) => {
            setUnreadCount((prev) => prev + 1);

            // 알림 표시 (브라우저 알림)
            if (Notification.permission === 'granted') {
                new Notification('새 메시지', {
                    body: `${data.sender.username}: ${data.message.content}`,
                    icon: '/logo.png',
                });
            }
        });

        // 메시지 읽음 시 카운트 감소
        dmService.onMessagesRead((data) => {
            setUnreadCount((prev) => Math.max(0, prev - data.marked_count));
        });

        // 브라우저 알림 권한 요청
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => {
            dmService.disconnectSocket();
        };
    }, [userId]);

    const loadUnreadCount = async () => {
        try {
            const response = await dmService.getUnreadCount();
            if (response.success) {
                setUnreadCount(response.data.unread_count);
            }
        } catch (error) {
            console.error('Failed to load unread count:', error);
        }
    };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleOpenInbox = () => {
        handleClose();
        onOpenInbox();
    };

    const open = Boolean(anchorEl);
    const id = open ? 'dm-notification-popover' : undefined;

    return (
        <>
            <IconButton
                color="inherit"
                onClick={handleClick}
                aria-describedby={id}
            >
                <Badge badgeContent={unreadCount} color="error">
                    <MailIcon />
                </Badge>
            </IconButton>

            <Popover
                id={id}
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
            >
                <Box sx={{ width: 320, maxHeight: 400 }}>
                    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="h6">
                            메시지 알림
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            {unreadCount}개의 읽지 않은 메시지
                        </Typography>
                    </Box>

                    {unreadCount === 0 ? (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography color="textSecondary">
                                새 메시지가 없습니다
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ p: 0 }}>
                            {recentMessages.length === 0 ? (
                                <ListItem>
                                    <ListItemText
                                        primary="읽지 않은 메시지가 있습니다"
                                        secondary="받은 메시지함을 확인하세요"
                                    />
                                </ListItem>
                            ) : (
                                recentMessages.map((msg, index) => (
                                    <React.Fragment key={index}>
                                        <ListItem>
                                            <ListItemText
                                                primary={msg.sender}
                                                secondary={msg.content}
                                            />
                                        </ListItem>
                                        {index < recentMessages.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))
                            )}
                        </List>
                    )}

                    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleOpenInbox}
                        >
                            전체 메시지 보기
                        </Button>
                    </Box>
                </Box>
            </Popover>
        </>
    );
};

export default DMNotification;
