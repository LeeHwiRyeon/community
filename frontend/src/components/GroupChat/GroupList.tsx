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
    Button,
    Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import GroupIcon from '@mui/icons-material/Group';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';
import { groupChatService, type GroupChat } from '../../services/groupChatService';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface GroupListProps {
    onSelectGroup: (group: GroupChat) => void;
    selectedGroupId?: number;
    onCreateGroup?: () => void;
}

const GroupList: React.FC<GroupListProps> = ({ onSelectGroup, selectedGroupId, onCreateGroup }) => {
    const [groups, setGroups] = useState<GroupChat[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    useEffect(() => {
        loadGroups();
    }, [page]);

    useEffect(() => {
        // WebSocket 이벤트 리스너 설정
        groupChatService.onNewMessage((data: any) => {
            // 새 메시지 수신 시 해당 그룹의 last_message 업데이트
            setGroups((prev) =>
                prev.map((group) =>
                    group.id === data.group_id
                        ? {
                            ...group,
                            last_message: data.message,
                            unread_count: (group.unread_count || 0) + 1,
                        }
                        : group
                )
            );
        });

        groupChatService.onMessageRead((data: any) => {
            // 메시지 읽음 처리 시 unread_count 감소
            setGroups((prev) =>
                prev.map((group) =>
                    group.id === data.group_id
                        ? { ...group, unread_count: Math.max(0, (group.unread_count || 0) - 1) }
                        : group
                )
            );
        });

        groupChatService.onMemberAdded((data: any) => {
            // 새 멤버 추가 시 member_count 증가
            setGroups((prev) =>
                prev.map((group) =>
                    group.id === data.group_id
                        ? { ...group, member_count: (group.member_count || 0) + 1 }
                        : group
                )
            );
        });

        groupChatService.onMemberRemoved((data: any) => {
            // 멤버 제거 시 member_count 감소
            setGroups((prev) =>
                prev.map((group) =>
                    group.id === data.group_id
                        ? { ...group, member_count: Math.max(0, (group.member_count || 0) - 1) }
                        : group
                )
            );
        });
    }, []);

    const loadGroups = async () => {
        try {
            setLoading(true);
            const response = await groupChatService.getMyGroups(page, 20);

            if (response.success) {
                setGroups(response.data.groups);
                setHasMore(page < response.data.pagination.total_pages);
            }
        } catch (error) {
            console.error('Failed to load groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatLastMessageTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), {
                addSuffix: true,
                locale: ko,
            });
        } catch {
            return '';
        }
    };

    const getLastMessagePreview = (group: GroupChat): string => {
        if (!group.last_message) return '메시지가 없습니다';

        const { content, message_type } = group.last_message;

        if (message_type === 'image') return '📷 이미지';
        if (message_type === 'file') return '📎 파일';
        if (message_type === 'system') return `🔔 ${content}`;

        return content.length > 30 ? content.substring(0, 30) + '...' : content;
    };

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
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        그룹 채팅
                    </Typography>
                    {onCreateGroup && (
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={onCreateGroup}
                            sx={{ borderRadius: 2 }}
                        >
                            새 그룹
                        </Button>
                    )}
                </Box>
            </Box>

            {/* 그룹 목록 */}
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : groups.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <GroupIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                            참여 중인 그룹이 없습니다
                        </Typography>
                        {onCreateGroup && (
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={onCreateGroup}
                                sx={{ mt: 2 }}
                            >
                                그룹 만들기
                            </Button>
                        )}
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {groups.map((group, index) => (
                            <React.Fragment key={group.id}>
                                {index > 0 && <Divider />}
                                <ListItem disablePadding>
                                    <ListItemButton
                                        onClick={() => onSelectGroup(group)}
                                        selected={selectedGroupId === group.id}
                                        sx={{
                                            py: 2,
                                            '&.Mui-selected': {
                                                bgcolor: 'action.selected',
                                            },
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Badge
                                                badgeContent={group.unread_count || 0}
                                                color="error"
                                                max={99}
                                            >
                                                <Avatar
                                                    src={group.avatar_url}
                                                    sx={{
                                                        bgcolor: 'primary.main',
                                                        width: 48,
                                                        height: 48,
                                                    }}
                                                >
                                                    <GroupIcon />
                                                </Avatar>
                                            </Badge>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography
                                                        variant="subtitle1"
                                                        sx={{
                                                            fontWeight: group.unread_count ? 600 : 400,
                                                        }}
                                                    >
                                                        {group.name}
                                                    </Typography>
                                                    {group.is_private && (
                                                        <LockIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    )}
                                                    {group.my_role === 'admin' && (
                                                        <Chip
                                                            label="관리자"
                                                            size="small"
                                                            color="primary"
                                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                                        />
                                                    )}
                                                    {group.my_role === 'moderator' && (
                                                        <Chip
                                                            label="운영진"
                                                            size="small"
                                                            color="secondary"
                                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                                        />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {getLastMessagePreview(group)}
                                                    </Typography>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1,
                                                            mt: 0.5,
                                                        }}
                                                    >
                                                        <Typography variant="caption" color="text.secondary">
                                                            멤버 {group.member_count || 0}명
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            •
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {group.last_message
                                                                ? formatLastMessageTime(
                                                                    group.last_message.created_at
                                                                )
                                                                : formatLastMessageTime(group.created_at)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            }
                                        />
                                    </ListItemButton>
                                </ListItem>
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Box>

            {/* 더 보기 버튼 */}
            {hasMore && !loading && (
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Button fullWidth onClick={() => setPage(page + 1)}>
                        더 보기
                    </Button>
                </Box>
            )}
        </Paper>
    );
};

export default GroupList;
