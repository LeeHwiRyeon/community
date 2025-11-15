import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    IconButton,
    Menu,
    MenuItem,
    Chip,
    Badge,
    Divider,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import { groupChatService, type GroupMember } from '../../services/groupChatService';

interface GroupMemberListProps {
    groupId: number;
    currentUserId: number;
    myRole: 'admin' | 'moderator' | 'member';
    onClose?: () => void;
}

const GroupMemberList: React.FC<GroupMemberListProps> = ({
    groupId,
    currentUserId,
    myRole,
    onClose,
}) => {
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [inviteUserId, setInviteUserId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadMembers();
    }, [groupId]);

    useEffect(() => {
        // WebSocket 이벤트 리스너
        groupChatService.onMemberAdded((data) => {
            if (data.group_id === groupId) {
                loadMembers();
            }
        });

        groupChatService.onMemberRemoved((data) => {
            if (data.group_id === groupId) {
                setMembers((prev) => prev.filter((m) => m.user_id !== data.user_id));
            }
        });

        groupChatService.onRoleChanged((data) => {
            if (data.group_id === groupId) {
                setMembers((prev) =>
                    prev.map((m) =>
                        m.user_id === data.user_id ? { ...m, role: data.new_role } : m
                    )
                );
            }
        });

        groupChatService.onUserJoined((data) => {
            if (data.group_id === groupId) {
                setMembers((prev) =>
                    prev.map((m) =>
                        m.user_id === data.user_id ? { ...m, is_online: true } : m
                    )
                );
            }
        });

        groupChatService.onUserLeft((data) => {
            if (data.group_id === groupId) {
                setMembers((prev) =>
                    prev.map((m) =>
                        m.user_id === data.user_id ? { ...m, is_online: false } : m
                    )
                );
            }
        });
    }, [groupId]);

    const loadMembers = async () => {
        try {
            setLoading(true);
            const response = await groupChatService.getGroupDetails(groupId);

            if (response.success) {
                setMembers(response.data.members);
            }
        } catch (error) {
            console.error('Failed to load members:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, member: GroupMember) => {
        setAnchorEl(event.currentTarget);
        setSelectedMember(member);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedMember(null);
    };

    const handleKickMember = async () => {
        if (!selectedMember) return;

        try {
            await groupChatService.kickMember(groupId, selectedMember.user_id);
            handleMenuClose();
        } catch (error) {
            console.error('Failed to kick member:', error);
        }
    };

    const handleChangeRole = async (newRole: 'admin' | 'moderator' | 'member') => {
        if (!selectedMember) return;

        try {
            await groupChatService.changeMemberRole(groupId, selectedMember.user_id, newRole);
            handleMenuClose();
        } catch (error) {
            console.error('Failed to change role:', error);
        }
    };

    const handleInviteMember = async () => {
        if (!inviteUserId.trim()) return;

        try {
            const userId = parseInt(inviteUserId);
            if (isNaN(userId)) {
                alert('유효한 사용자 ID를 입력하세요');
                return;
            }

            await groupChatService.inviteMember(groupId, userId);
            setInviteDialogOpen(false);
            setInviteUserId('');
            alert('초대를 보냈습니다');
        } catch (error: any) {
            console.error('Failed to invite member:', error);
            alert(error.response?.data?.message || '초대에 실패했습니다');
        }
    };

    const canManageMembers = myRole === 'admin' || myRole === 'moderator';

    const filteredMembers = members.filter(
        (member) =>
            member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleChip = (role: string) => {
        if (role === 'admin') {
            return <Chip label="관리자" size="small" color="primary" />;
        }
        if (role === 'moderator') {
            return <Chip label="운영진" size="small" color="secondary" />;
        }
        return <Chip label="멤버" size="small" variant="outlined" />;
    };

    return (
        <>
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
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        멤버 목록 ({members.length}명)
                    </Typography>
                    {canManageMembers && (
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<PersonAddIcon />}
                            onClick={() => setInviteDialogOpen(true)}
                        >
                            초대
                        </Button>
                    )}
                </Box>

                {/* 검색 */}
                <Box sx={{ p: 2 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="멤버 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                    />
                </Box>

                {/* 멤버 목록 */}
                <Box sx={{ flex: 1, overflowY: 'auto' }}>
                    <List sx={{ p: 0 }}>
                        {filteredMembers.map((member, index) => (
                            <React.Fragment key={member.user_id}>
                                {index > 0 && <Divider />}
                                <ListItem
                                    secondaryAction={
                                        canManageMembers &&
                                        member.user_id !== currentUserId && (
                                            <IconButton
                                                edge="end"
                                                onClick={(e) => handleMenuOpen(e, member)}
                                            >
                                                <MoreVertIcon />
                                            </IconButton>
                                        )
                                    }
                                >
                                    <ListItemAvatar>
                                        <Badge
                                            overlap="circular"
                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                            variant="dot"
                                            color={member.is_online ? 'success' : 'default'}
                                        >
                                            <Avatar src={member.avatar_url}>
                                                {member.username[0]?.toUpperCase()}
                                            </Avatar>
                                        </Badge>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body1">
                                                    {member.username}
                                                </Typography>
                                                {member.user_id === currentUserId && (
                                                    <Chip label="나" size="small" color="info" />
                                                )}
                                                {getRoleChip(member.role)}
                                                {member.is_muted && (
                                                    <Chip label="음소거" size="small" color="default" />
                                                )}
                                                {member.is_banned && (
                                                    <Chip label="추방됨" size="small" color="error" />
                                                )}
                                            </Box>
                                        }
                                        secondary={member.email}
                                    />
                                </ListItem>
                            </React.Fragment>
                        ))}
                    </List>
                </Box>
            </Paper>

            {/* 멤버 관리 메뉴 */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                {selectedMember && (
                    <>
                        {myRole === 'admin' && selectedMember.role !== 'admin' && (
                            <>
                                <MenuItem onClick={() => handleChangeRole('admin')}>
                                    관리자로 지정
                                </MenuItem>
                                <MenuItem onClick={() => handleChangeRole('moderator')}>
                                    운영진으로 지정
                                </MenuItem>
                                <MenuItem onClick={() => handleChangeRole('member')}>
                                    일반 멤버로 지정
                                </MenuItem>
                                <Divider />
                            </>
                        )}
                        {myRole === 'admin' && (
                            <MenuItem onClick={handleKickMember} sx={{ color: 'error.main' }}>
                                추방하기
                            </MenuItem>
                        )}
                    </>
                )}
            </Menu>

            {/* 멤버 초대 다이얼로그 */}
            <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)}>
                <DialogTitle>멤버 초대</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="사용자 ID"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={inviteUserId}
                        onChange={(e) => setInviteUserId(e.target.value)}
                        helperText="초대할 사용자의 ID를 입력하세요"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setInviteDialogOpen(false)}>취소</Button>
                    <Button onClick={handleInviteMember} variant="contained">
                        초대
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default GroupMemberList;
