import React, { useEffect, useState } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    IconButton,
    Snackbar,
    Alert,
} from '@mui/material';
import {
    Save as SaveIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAutoDraft } from '../hooks/useAutoDraft';
import { useUnsavedChangesWarning } from '../hooks/useAutoDraft';
import DraftSaveIndicator from './DraftSaveIndicator';
import DraftConflictModal from './DraftConflictModal';

/**
 * 충돌 감지 기능이 포함된 초안 에디터 예제
 */
const DraftEditorWithConflict: React.FC = () => {
    const {
        draft,
        draftId,
        isDirty,
        isSaving,
        conflictState,
        initializeDraft,
        updateFields,
        saveDraft,
        clearDraft,
        checkConflict,
        resolveConflict,
        dismissConflict,
    } = useAutoDraft({ enabled: true });

    useUnsavedChangesWarning();

    const [showSaveNotification, setShowSaveNotification] = useState(false);
    const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

    // 초기화
    useEffect(() => {
        initializeDraft({
            title: '',
            content: '',
            category: '',
            tags: [],
        });
    }, []);

    // 주기적 충돌 감지 (30초마다)
    useEffect(() => {
        if (!draftId) return;

        const intervalId = setInterval(async () => {
            const hasConflict = await checkConflict();
            setLastCheckTime(new Date());

            if (hasConflict) {
                console.log('충돌 감지됨');
            }
        }, 30000); // 30초

        return () => clearInterval(intervalId);
    }, [draftId, checkConflict]);

    // 저장 시 충돌 감지
    const handleManualSave = async () => {
        // 저장 전 충돌 확인
        const hasConflict = await checkConflict();

        if (hasConflict) {
            // 충돌이 있으면 모달을 통해 해결
            return;
        }

        await saveDraft();
        setShowSaveNotification(true);
    };

    // 수동 충돌 확인
    const handleCheckConflict = async () => {
        const hasConflict = await checkConflict();
        setLastCheckTime(new Date());

        if (!hasConflict) {
            setShowSaveNotification(true);
        }
    };

    const handleClear = () => {
        if (confirm('작성 중인 초안을 삭제하시겠습니까?')) {
            clearDraft();
        }
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateFields({ title: e.target.value });
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateFields({ content: e.target.value });
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateFields({ category: e.target.value });
    };

    // 충돌 해결 핸들러
    const handleResolveConflict = (useLocal: boolean) => {
        resolveConflict(useLocal);

        if (!useLocal) {
            // 서버 버전 사용 시 알림
            setShowSaveNotification(true);
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 3, maxWidth: 900, mx: 'auto', my: 4 }}>
            {/* 헤더 */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h1">
                    게시글 작성 {draftId && `(초안 #${draftId})`}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                    <DraftSaveIndicator />
                    <IconButton
                        onClick={handleCheckConflict}
                        title="충돌 확인"
                        color="info"
                        size="small"
                    >
                        <RefreshIcon />
                    </IconButton>
                    <IconButton
                        onClick={handleManualSave}
                        disabled={!isDirty || isSaving}
                        color="primary"
                        title="수동 저장"
                    >
                        <SaveIcon />
                    </IconButton>
                    <IconButton
                        onClick={handleClear}
                        color="error"
                        title="초안 삭제"
                    >
                        <DeleteIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* 충돌 경고 */}
            {conflictState.detected && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    ⚠️ 다른 기기에서 이 초안이 수정되었습니다. 충돌을 해결해주세요.
                </Alert>
            )}

            {/* 마지막 충돌 확인 시간 */}
            {lastCheckTime && (
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                    마지막 충돌 확인: {lastCheckTime.toLocaleTimeString('ko-KR')}
                </Typography>
            )}

            {/* 폼 필드 */}
            <Box component="form" noValidate autoComplete="off">
                <TextField
                    fullWidth
                    label="카테고리"
                    value={draft?.category || ''}
                    onChange={handleCategoryChange}
                    margin="normal"
                    size="small"
                    placeholder="예: 공지사항, 자유게시판"
                />

                <TextField
                    fullWidth
                    label="제목"
                    value={draft?.title || ''}
                    onChange={handleTitleChange}
                    margin="normal"
                    required
                    placeholder="게시글 제목을 입력하세요"
                />

                <TextField
                    fullWidth
                    label="내용"
                    value={draft?.content || ''}
                    onChange={handleContentChange}
                    margin="normal"
                    required
                    multiline
                    rows={15}
                    placeholder="내용을 입력하세요..."
                />

                {/* 자동 저장 안내 */}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    💡 작성 중인 내용은 5초마다 자동으로 저장됩니다. 다른 기기에서의 변경사항은 30초마다 확인됩니다.
                </Typography>

                {/* 글자 수 */}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    글자 수: {draft?.content?.length || 0}자
                </Typography>

                {/* 액션 버튼 */}
                <Box display="flex" gap={2} mt={3}>
                    <Button
                        variant="outlined"
                        onClick={handleClear}
                        disabled={isSaving}
                    >
                        취소
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleManualSave}
                        disabled={!isDirty || isSaving}
                        startIcon={<SaveIcon />}
                    >
                        저장하기
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={!draft?.title || !draft?.content || isDirty}
                        sx={{ ml: 'auto' }}
                    >
                        게시하기
                    </Button>
                </Box>
            </Box>

            {/* 충돌 해결 모달 */}
            {conflictState.detected &&
                conflictState.localDraft &&
                conflictState.serverDraft && (
                    <DraftConflictModal
                        open={conflictState.detected}
                        onClose={dismissConflict}
                        localDraft={conflictState.localDraft}
                        serverDraft={conflictState.serverDraft}
                        onSelectLocal={() => handleResolveConflict(true)}
                        onSelectServer={() => handleResolveConflict(false)}
                    />
                )}

            {/* 저장 완료 알림 */}
            <Snackbar
                open={showSaveNotification}
                autoHideDuration={3000}
                onClose={() => setShowSaveNotification(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setShowSaveNotification(false)}
                    severity="success"
                    sx={{ width: '100%' }}
                >
                    저장되었습니다!
                </Alert>
            </Snackbar>
        </Paper>
    );
};

export default DraftEditorWithConflict;
