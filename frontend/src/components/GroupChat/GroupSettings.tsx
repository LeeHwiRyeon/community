import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Switch,
    FormControlLabel,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Divider,
    Alert,
    CircularProgress,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { groupChatService, type GroupChat, type GroupSettings as GroupSettingsType } from '../../services/groupChatService';

interface GroupSettingsProps {
    groupId: number;
    group: GroupChat;
    myRole: 'admin' | 'moderator' | 'member';
    onUpdate?: () => void;
}

const GroupSettings: React.FC<GroupSettingsProps> = ({ groupId, group, myRole, onUpdate }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // 그룹 정보
    const [groupName, setGroupName] = useState(group.name);
    const [groupDescription, setGroupDescription] = useState(group.description || '');
    const [maxMembers, setMaxMembers] = useState(group.max_members);
    const [isPrivate, setIsPrivate] = useState(group.is_private);

    // 그룹 설정
    const [settings, setSettings] = useState<GroupSettingsType>({
        group_id: groupId,
        who_can_send_messages: 'all',
        who_can_add_members: 'moderators',
        who_can_edit_group: 'admins',
        allow_file_upload: true,
        max_file_size_mb: 10,
        message_retention_days: 365,
    });

    useEffect(() => {
        loadSettings();
    }, [groupId]);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await groupChatService.getGroupDetails(groupId);

            if (response.success) {
                setSettings(response.data.settings);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            setError('설정을 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGroupInfo = async () => {
        try {
            setSaving(true);
            setError(null);

            await groupChatService.updateGroup(groupId, {
                name: groupName,
                description: groupDescription,
                max_members: maxMembers,
            });

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);

            if (onUpdate) {
                onUpdate();
            }
        } catch (error: any) {
            console.error('Failed to update group:', error);
            setError(error.response?.data?.message || '그룹 정보 업데이트에 실패했습니다');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            setSaving(true);
            setError(null);

            await groupChatService.updateSettings(groupId, settings);

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);

            if (onUpdate) {
                onUpdate();
            }
        } catch (error: any) {
            console.error('Failed to update settings:', error);
            setError(error.response?.data?.message || '설정 업데이트에 실패했습니다');
        } finally {
            setSaving(false);
        }
    };

    const canEditGroup = myRole === 'admin' || myRole === 'moderator';
    const canEditAdvanced = myRole === 'admin';

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

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
                    그룹 설정
                </Typography>
            </Box>

            {/* 설정 내용 */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
                        설정이 저장되었습니다
                    </Alert>
                )}

                {/* 기본 정보 */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        기본 정보
                    </Typography>

                    <TextField
                        fullWidth
                        label="그룹 이름"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        disabled={!canEditGroup}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="그룹 설명"
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        disabled={!canEditGroup}
                        multiline
                        rows={3}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="최대 멤버 수"
                        type="number"
                        value={maxMembers}
                        onChange={(e) => setMaxMembers(parseInt(e.target.value))}
                        disabled={!canEditAdvanced}
                        inputProps={{ min: 2, max: 1000 }}
                        sx={{ mb: 2 }}
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={isPrivate}
                                onChange={(e) => setIsPrivate(e.target.checked)}
                                disabled={!canEditAdvanced}
                            />
                        }
                        label="비공개 그룹"
                    />

                    {canEditGroup && (
                        <Box sx={{ mt: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={handleSaveGroupInfo}
                                disabled={saving}
                            >
                                기본 정보 저장
                            </Button>
                        </Box>
                    )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* 권한 설정 */}
                {canEditAdvanced && (
                    <>
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                권한 설정
                            </Typography>

                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>메시지 전송 권한</InputLabel>
                                <Select
                                    value={settings.who_can_send_messages}
                                    label="메시지 전송 권한"
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            who_can_send_messages: e.target.value as any,
                                        })
                                    }
                                >
                                    <MenuItem value="all">모든 멤버</MenuItem>
                                    <MenuItem value="moderators">운영진 이상</MenuItem>
                                    <MenuItem value="admins">관리자만</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>멤버 초대 권한</InputLabel>
                                <Select
                                    value={settings.who_can_add_members}
                                    label="멤버 초대 권한"
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            who_can_add_members: e.target.value as any,
                                        })
                                    }
                                >
                                    <MenuItem value="all">모든 멤버</MenuItem>
                                    <MenuItem value="moderators">운영진 이상</MenuItem>
                                    <MenuItem value="admins">관리자만</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>그룹 수정 권한</InputLabel>
                                <Select
                                    value={settings.who_can_edit_group}
                                    label="그룹 수정 권한"
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            who_can_edit_group: e.target.value as any,
                                        })
                                    }
                                >
                                    <MenuItem value="moderators">운영진 이상</MenuItem>
                                    <MenuItem value="admins">관리자만</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        {/* 파일 업로드 설정 */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                파일 업로드
                            </Typography>

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings.allow_file_upload}
                                        onChange={(e) =>
                                            setSettings({
                                                ...settings,
                                                allow_file_upload: e.target.checked,
                                            })
                                        }
                                    />
                                }
                                label="파일 업로드 허용"
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                fullWidth
                                label="최대 파일 크기 (MB)"
                                type="number"
                                value={settings.max_file_size_mb}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        max_file_size_mb: parseInt(e.target.value),
                                    })
                                }
                                inputProps={{ min: 1, max: 100 }}
                                disabled={!settings.allow_file_upload}
                            />
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        {/* 메시지 보관 */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                메시지 보관
                            </Typography>

                            <TextField
                                fullWidth
                                label="메시지 보관 기간 (일)"
                                type="number"
                                value={settings.message_retention_days}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        message_retention_days: parseInt(e.target.value),
                                    })
                                }
                                inputProps={{ min: 1, max: 3650 }}
                                helperText="설정한 기간이 지난 메시지는 자동으로 삭제됩니다"
                            />
                        </Box>

                        <Box sx={{ mt: 3 }}>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={handleSaveSettings}
                                disabled={saving}
                            >
                                설정 저장
                            </Button>
                        </Box>
                    </>
                )}

                {!canEditAdvanced && (
                    <Alert severity="info">
                        관리자만 고급 설정을 변경할 수 있습니다
                    </Alert>
                )}
            </Box>
        </Paper>
    );
};

export default GroupSettings;
