import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    useTheme,
    useMediaQuery,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControlLabel,
    Switch,
    Drawer,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import GroupList from '../components/GroupChat/GroupList';
import GroupChatRoom from '../components/GroupChat/GroupChatRoom';
import GroupMemberList from '../components/GroupChat/GroupMemberList';
import GroupSettings from '../components/GroupChat/GroupSettings';
import GroupInvite from '../components/GroupChat/GroupInvite';
import { groupChatService, type GroupChat } from '../services/groupChatService';

const GroupChats: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number>(0);
    const [showChatRoom, setShowChatRoom] = useState(false);

    // 다이얼로그 및 드로어 상태
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [inviteDrawerOpen, setInviteDrawerOpen] = useState(false);
    const [memberDrawerOpen, setMemberDrawerOpen] = useState(false);
    const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);

    // 그룹 생성 폼
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [newGroupIsPrivate, setNewGroupIsPrivate] = useState(false);
    const [newGroupMaxMembers, setNewGroupMaxMembers] = useState(100);

    useEffect(() => {
        // 현재 사용자 ID 가져오기
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUserId(payload.id || payload.userId);

                // WebSocket 초기화
                groupChatService.initSocket(payload.id || payload.userId);
            } catch (error) {
                console.error('Failed to parse token:', error);
            }
        }

        return () => {
            // 컴포넌트 언마운트 시 WebSocket 연결 해제
            groupChatService.disconnectSocket();
        };
    }, []);

    const handleSelectGroup = (group: GroupChat) => {
        setSelectedGroup(group);
        if (isMobile) {
            setShowChatRoom(true);
        }
    };

    const handleBack = () => {
        setShowChatRoom(false);
        setSelectedGroup(null);
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
            alert('그룹 이름을 입력하세요');
            return;
        }

        try {
            await groupChatService.createGroup({
                name: newGroupName,
                description: newGroupDescription,
                is_private: newGroupIsPrivate,
                max_members: newGroupMaxMembers,
            });

            // 폼 초기화
            setNewGroupName('');
            setNewGroupDescription('');
            setNewGroupIsPrivate(false);
            setNewGroupMaxMembers(100);
            setCreateDialogOpen(false);

            // 그룹 목록 새로고침 (GroupList 컴포넌트에서 자동으로 업데이트됨)
            alert('그룹이 생성되었습니다');
        } catch (error: any) {
            console.error('Failed to create group:', error);
            alert(error.response?.data?.message || '그룹 생성에 실패했습니다');
        }
    };

    const handleLeaveGroup = async () => {
        if (!selectedGroup) return;

        const confirmed = window.confirm(`${selectedGroup.name} 그룹을 나가시겠습니까?`);
        if (!confirmed) return;

        try {
            await groupChatService.leaveGroup(selectedGroup.id);
            setSelectedGroup(null);
            setShowChatRoom(false);
            alert('그룹을 나갔습니다');
        } catch (error: any) {
            console.error('Failed to leave group:', error);
            alert(error.response?.data?.message || '그룹 나가기에 실패했습니다');
        }
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h4">그룹 채팅</Typography>
                <Button variant="outlined" onClick={() => setInviteDrawerOpen(true)}>
                    초대 관리
                </Button>
            </Box>

            <Paper elevation={3} sx={{ height: 'calc(100vh - 200px)', overflow: 'hidden', display: 'flex' }}>
                {/* 그룹 목록 (왼쪽) */}
                {(!isMobile || !showChatRoom) && (
                    <Box
                        sx={{
                            width: isMobile ? '100%' : '33.33%',
                            borderRight: isMobile ? 0 : 1,
                            borderColor: 'divider',
                            height: '100%',
                        }}
                    >
                        <GroupList
                            onSelectGroup={handleSelectGroup}
                            selectedGroupId={selectedGroup?.id}
                            onCreateGroup={() => setCreateDialogOpen(true)}
                        />
                    </Box>
                )}

                {/* 채팅방 (오른쪽) */}
                {(!isMobile || showChatRoom) && (
                    <Box sx={{ flexGrow: 1, height: '100%' }}>
                        {selectedGroup && currentUserId ? (
                            <GroupChatRoom
                                group={selectedGroup}
                                currentUserId={currentUserId}
                                onShowMembers={() => setMemberDrawerOpen(true)}
                                onShowSettings={() => setSettingsDrawerOpen(true)}
                                onLeaveGroup={handleLeaveGroup}
                            />
                        ) : (
                            <Box
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'grey.50',
                                }}
                            >
                                <Typography variant="h6" color="textSecondary">
                                    그룹을 선택하세요
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Paper>

            {/* 모바일 뒤로가기 버튼 */}
            {isMobile && showChatRoom && (
                <IconButton
                    onClick={handleBack}
                    sx={{
                        position: 'fixed',
                        top: 80,
                        left: 16,
                        bgcolor: 'background.paper',
                        boxShadow: 2,
                    }}
                >
                    <ArrowBackIcon />
                </IconButton>
            )}

            {/* 그룹 생성 다이얼로그 */}
            <Dialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>새 그룹 만들기</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="그룹 이름"
                        fullWidth
                        variant="outlined"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="그룹 설명"
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={3}
                        value={newGroupDescription}
                        onChange={(e) => setNewGroupDescription(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="최대 멤버 수"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={newGroupMaxMembers}
                        onChange={(e) => setNewGroupMaxMembers(parseInt(e.target.value))}
                        inputProps={{ min: 2, max: 1000 }}
                        sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={newGroupIsPrivate}
                                onChange={(e) => setNewGroupIsPrivate(e.target.checked)}
                            />
                        }
                        label="비공개 그룹"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>취소</Button>
                    <Button onClick={handleCreateGroup} variant="contained">
                        만들기
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 초대 관리 드로어 */}
            <Drawer
                anchor="right"
                open={inviteDrawerOpen}
                onClose={() => setInviteDrawerOpen(false)}
            >
                <Box sx={{ width: 400, height: '100%' }}>
                    <Box
                        sx={{
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: 1,
                            borderColor: 'divider',
                        }}
                    >
                        <Typography variant="h6">초대 관리</Typography>
                        <IconButton onClick={() => setInviteDrawerOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <GroupInvite
                        currentUserId={currentUserId}
                        onRefresh={() => {
                            // 그룹 목록 새로고침
                        }}
                    />
                </Box>
            </Drawer>

            {/* 멤버 목록 드로어 */}
            {selectedGroup && (
                <Drawer
                    anchor="right"
                    open={memberDrawerOpen}
                    onClose={() => setMemberDrawerOpen(false)}
                >
                    <Box sx={{ width: 400, height: '100%' }}>
                        <Box
                            sx={{
                                p: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderBottom: 1,
                                borderColor: 'divider',
                            }}
                        >
                            <Typography variant="h6">멤버 목록</Typography>
                            <IconButton onClick={() => setMemberDrawerOpen(false)}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                        <GroupMemberList
                            groupId={selectedGroup.id}
                            currentUserId={currentUserId}
                            myRole={selectedGroup.my_role || 'member'}
                        />
                    </Box>
                </Drawer>
            )}

            {/* 설정 드로어 */}
            {selectedGroup && (
                <Drawer
                    anchor="right"
                    open={settingsDrawerOpen}
                    onClose={() => setSettingsDrawerOpen(false)}
                >
                    <Box sx={{ width: 400, height: '100%' }}>
                        <Box
                            sx={{
                                p: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderBottom: 1,
                                borderColor: 'divider',
                            }}
                        >
                            <Typography variant="h6">그룹 설정</Typography>
                            <IconButton onClick={() => setSettingsDrawerOpen(false)}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                        <GroupSettings
                            groupId={selectedGroup.id}
                            group={selectedGroup}
                            myRole={selectedGroup.my_role || 'member'}
                            onUpdate={() => {
                                // 그룹 정보 새로고침
                            }}
                        />
                    </Box>
                </Drawer>
            )}
        </Container>
    );
};

export default GroupChats;
