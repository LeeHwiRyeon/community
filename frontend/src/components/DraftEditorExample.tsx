import React, { useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Paper,
    Typography,
    Stack,
    IconButton,
    Tooltip,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAutoDraft, useUnsavedChangesWarning } from '../hooks/useAutoDraft';
import DraftSaveIndicator from '../components/DraftSaveIndicator';

/**
 * Example component showing how to use draft auto-save
 * This can be integrated into the post creation/edit page
 */
const DraftEditorExample: React.FC = () => {
    const {
        draft,
        draftId,
        isDirty,
        isSaving,
        initializeDraft,
        updateFields,
        saveDraft,
        clearDraft,
    } = useAutoDraft({ enabled: true });

    // Warn about unsaved changes
    useUnsavedChangesWarning();

    // Initialize draft on mount
    useEffect(() => {
        initializeDraft({
            title: '',
            content: '',
            category: '',
            tags: [],
        });
    }, []);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateFields({ title: e.target.value });
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateFields({ content: e.target.value });
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateFields({ category: e.target.value });
    };

    const handleManualSave = async () => {
        await saveDraft();
    };

    const handleClear = () => {
        if (window.confirm('초안을 삭제하시겠습니까?')) {
            clearDraft();
        }
    };

    if (!draft) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography>초안을 불러오는 중...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Stack spacing={3}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5" component="h1">
                            게시글 작성 {draftId && `(초안 #${draftId})`}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <DraftSaveIndicator />

                            <Tooltip title="수동 저장">
                                <IconButton
                                    onClick={handleManualSave}
                                    disabled={isSaving || !isDirty}
                                    color="primary"
                                >
                                    <SaveIcon />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="초안 삭제">
                                <IconButton
                                    onClick={handleClear}
                                    disabled={isSaving}
                                    color="error"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    {/* Category */}
                    <TextField
                        label="카테고리"
                        value={draft.category || ''}
                        onChange={handleCategoryChange}
                        fullWidth
                        size="small"
                        placeholder="예: 자유게시판, 공지사항 등"
                    />

                    {/* Title */}
                    <TextField
                        label="제목"
                        value={draft.title}
                        onChange={handleTitleChange}
                        fullWidth
                        required
                        placeholder="게시글 제목을 입력하세요"
                        disabled={isSaving}
                    />

                    {/* Content */}
                    <TextField
                        label="내용"
                        value={draft.content}
                        onChange={handleContentChange}
                        fullWidth
                        required
                        multiline
                        rows={15}
                        placeholder="게시글 내용을 입력하세요"
                        disabled={isSaving}
                    />

                    {/* Info */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            💡 작성 중인 내용은 5초마다 자동으로 저장됩니다.
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                            글자 수: {draft.content.length}
                        </Typography>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
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
                            disabled={isSaving || !isDirty}
                            startIcon={<SaveIcon />}
                        >
                            저장하기
                        </Button>

                        <Button
                            variant="contained"
                            color="primary"
                            disabled={!draft.title || !draft.content || isDirty}
                        >
                            게시하기
                        </Button>
                    </Box>
                </Stack>
            </Paper>
        </Box>
    );
};

export default DraftEditorExample;
