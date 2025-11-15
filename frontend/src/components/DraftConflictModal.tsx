import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Card,
    CardContent,
    Chip,
    Divider,
    Alert,
} from '@mui/material';
import {
    Warning as WarningIcon,
    Storage as StorageIcon,
    Devices as DevicesIcon,
    Schedule as ScheduleIcon,
} from '@mui/icons-material';

interface Draft {
    id?: number;
    title: string;
    content: string;
    category?: string;
    tags?: string[];
    version?: number;
    last_saved_at?: string;
}

interface DraftConflictModalProps {
    open: boolean;
    onClose: () => void;
    localDraft: Draft;
    serverDraft: Draft;
    onSelectLocal: () => void;
    onSelectServer: () => void;
    onMerge?: () => void;
}

const DraftConflictModal: React.FC<DraftConflictModalProps> = ({
    open,
    onClose,
    localDraft,
    serverDraft,
    onSelectLocal,
    onSelectServer,
    onMerge,
}) => {
    // 시간 포맷팅
    const formatTime = (dateString?: string) => {
        if (!dateString) return '알 수 없음';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return '방금 전';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        return date.toLocaleString('ko-KR');
    };

    // 글자 수
    const getContentLength = (content: string) => {
        return content?.length || 0;
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <WarningIcon color="warning" fontSize="large" />
                    <Typography variant="h6" component="span">
                        초안 충돌 감지
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Alert severity="warning" sx={{ mb: 3 }}>
                    다른 기기 또는 탭에서 이 초안이 수정되었습니다.
                    어느 버전을 사용할지 선택해주세요.
                </Alert>

                <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2}>
                    {/* 로컬 버전 */}
                    <Card variant="outlined" sx={{ flex: 1, border: 2, borderColor: 'primary.main' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <DevicesIcon color="primary" />
                                <Typography variant="h6" color="primary">
                                    현재 작업 중인 버전 (로컬)
                                </Typography>
                            </Box>

                            <Box mb={2}>
                                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                    <ScheduleIcon fontSize="small" />
                                    {formatTime(localDraft.last_saved_at)}
                                </Typography>
                                <Chip
                                    label={`버전 ${localDraft.version || 0}`}
                                    size="small"
                                    sx={{ mt: 1 }}
                                />
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="subtitle2" gutterBottom>
                                제목:
                            </Typography>
                            <Typography variant="body2" gutterBottom sx={{
                                mb: 2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {localDraft.title || '(제목 없음)'}
                            </Typography>

                            <Typography variant="subtitle2" gutterBottom>
                                내용 미리보기:
                            </Typography>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    mb: 2,
                                    maxHeight: 100,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 4,
                                    WebkitBoxOrient: 'vertical',
                                }}
                            >
                                {localDraft.content || '(내용 없음)'}
                            </Typography>

                            <Typography variant="caption" color="text.secondary">
                                글자 수: {getContentLength(localDraft.content)}자
                            </Typography>
                        </CardContent>
                    </Card>

                    {/* 서버 버전 */}
                    <Card variant="outlined" sx={{ flex: 1, border: 2, borderColor: 'info.main' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <StorageIcon color="info" />
                                <Typography variant="h6" color="info.main">
                                    서버에 저장된 버전
                                </Typography>
                            </Box>

                            <Box mb={2}>
                                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                    <ScheduleIcon fontSize="small" />
                                    {formatTime(serverDraft.last_saved_at)}
                                </Typography>
                                <Chip
                                    label={`버전 ${serverDraft.version || 0}`}
                                    size="small"
                                    color="info"
                                    sx={{ mt: 1 }}
                                />
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="subtitle2" gutterBottom>
                                제목:
                            </Typography>
                            <Typography variant="body2" gutterBottom sx={{
                                mb: 2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {serverDraft.title || '(제목 없음)'}
                            </Typography>

                            <Typography variant="subtitle2" gutterBottom>
                                내용 미리보기:
                            </Typography>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    mb: 2,
                                    maxHeight: 100,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 4,
                                    WebkitBoxOrient: 'vertical',
                                }}
                            >
                                {serverDraft.content || '(내용 없음)'}
                            </Typography>

                            <Typography variant="caption" color="text.secondary">
                                글자 수: {getContentLength(serverDraft.content)}자
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>

                <Alert severity="info" sx={{ mt: 2 }}>
                    💡 팁: 일반적으로 최근에 수정된 버전을 선택하는 것이 안전합니다.
                </Alert>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} color="inherit">
                    취소
                </Button>
                {onMerge && (
                    <Button
                        onClick={onMerge}
                        variant="outlined"
                        color="secondary"
                    >
                        수동 병합
                    </Button>
                )}
                <Button
                    onClick={onSelectLocal}
                    variant="contained"
                    color="primary"
                >
                    로컬 버전 사용
                </Button>
                <Button
                    onClick={onSelectServer}
                    variant="contained"
                    color="info"
                >
                    서버 버전 사용
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DraftConflictModal;
