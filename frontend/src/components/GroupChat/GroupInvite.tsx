import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Chip,
    Divider,
    IconButton,
    InputAdornment,
    Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import GroupIcon from '@mui/icons-material/Group';
import { groupChatService, type GroupInvitation } from '../../services/groupChatService';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface GroupInviteProps {
    currentUserId: number;
    invitations?: GroupInvitation[];
    onRefresh?: () => void;
}

const GroupInvite: React.FC<GroupInviteProps> = ({ currentUserId, invitations = [], onRefresh }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [joinGroupId, setJoinGroupId] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleRespondToInvitation = async (invitationId: number, accept: boolean) => {
        try {
            await groupChatService.respondToInvitation(invitationId, accept);
            setSuccess(accept ? '초대를 수락했습니다' : '초대를 거절했습니다');
            setTimeout(() => setSuccess(null), 3000);

            if (onRefresh) {
                onRefresh();
            }
        } catch (error: any) {
            console.error('Failed to respond to invitation:', error);
            setError(error.response?.data?.message || '초대 응답에 실패했습니다');
        }
    };

    const handleJoinGroup = async () => {
        if (!joinGroupId.trim()) {
            setError('그룹 ID를 입력하세요');
            return;
        }

        try {
            const groupId = parseInt(joinGroupId);
            if (isNaN(groupId)) {
                setError('유효한 그룹 ID를 입력하세요');
                return;
            }

            await groupChatService.joinGroup(groupId, inviteCode || undefined);
            setSuccess('그룹에 가입했습니다');
            setJoinGroupId('');
            setInviteCode('');
            setTimeout(() => setSuccess(null), 3000);

            if (onRefresh) {
                onRefresh();
            }
        } catch (error: any) {
            console.error('Failed to join group:', error);
            setError(error.response?.data?.message || '그룹 가입에 실패했습니다');
        }
    };

    const handleCopyInviteCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setSuccess('초대 코드를 복사했습니다');
        setTimeout(() => setSuccess(null), 2000);
    };

    const formatTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), {
                addSuffix: true,
                locale: ko,
            });
        } catch {
            return '';
        }
    };

    const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');
    const filteredInvitations = pendingInvitations.filter(
        (inv) =>
            inv.group_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.inviter_username.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    그룹 초대 및 가입
                </Typography>
            </Box>

            {/* 내용 */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                        {success}
                    </Alert>
                )}

                {/* 그룹 가입 */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        그룹 가입하기
                    </Typography>

                    <TextField
                        fullWidth
                        label="그룹 ID"
                        type="number"
                        value={joinGroupId}
                        onChange={(e) => setJoinGroupId(e.target.value)}
                        sx={{ mb: 2 }}
                        helperText="가입하려는 그룹의 ID를 입력하세요"
                    />

                    <TextField
                        fullWidth
                        label="초대 코드 (선택사항)"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        sx={{ mb: 2 }}
                        helperText="비공개 그룹의 경우 초대 코드가 필요합니다"
                    />

                    <Button variant="contained" fullWidth onClick={handleJoinGroup}>
                        그룹 가입
                    </Button>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* 받은 초대 */}
                <Box>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 2,
                        }}
                    >
                        <Typography variant="h6">
                            받은 초대 ({pendingInvitations.length})
                        </Typography>

                        {pendingInvitations.length > 0 && (
                            <TextField
                                size="small"
                                placeholder="검색..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ width: 200 }}
                            />
                        )}
                    </Box>

                    {pendingInvitations.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <GroupIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="body1" color="text.secondary">
                                받은 초대가 없습니다
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                            {filteredInvitations.map((invitation, index) => (
                                <React.Fragment key={invitation.id}>
                                    {index > 0 && <Divider />}
                                    <ListItem
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'stretch',
                                            py: 2,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                width: '100%',
                                                mb: 1,
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar>
                                                    <GroupIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                        {invitation.group_name}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <>
                                                        <Typography
                                                            component="span"
                                                            variant="body2"
                                                            color="text.secondary"
                                                        >
                                                            {invitation.inviter_username}님의 초대
                                                        </Typography>
                                                        <Typography
                                                            component="span"
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ ml: 1 }}
                                                        >
                                                            • {formatTime(invitation.created_at)}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                        </Box>

                                        <Box
                                            sx={{
                                                display: 'flex',
                                                gap: 1,
                                                justifyContent: 'flex-end',
                                            }}
                                        >
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                startIcon={<CloseIcon />}
                                                onClick={() =>
                                                    handleRespondToInvitation(invitation.id, false)
                                                }
                                            >
                                                거절
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                                startIcon={<CheckIcon />}
                                                onClick={() =>
                                                    handleRespondToInvitation(invitation.id, true)
                                                }
                                            >
                                                수락
                                            </Button>
                                        </Box>
                                    </ListItem>
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </Box>
            </Box>
        </Paper>
    );
};

export default GroupInvite;
