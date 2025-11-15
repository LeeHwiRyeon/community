import React from 'react';
import { Box, Chip, CircularProgress, Typography } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useDraft } from '../contexts/DraftContext';

const DraftSaveIndicator: React.FC = () => {
    const { saveStatus, lastSaved, error } = useDraft();

    const getStatusConfig = () => {
        switch (saveStatus) {
            case 'saving':
                return {
                    icon: <CircularProgress size={16} />,
                    label: '저장 중...',
                    color: 'info' as const,
                };
            case 'saved':
                return {
                    icon: <CheckCircleIcon fontSize="small" />,
                    label: '저장 완료',
                    color: 'success' as const,
                };
            case 'error':
                return {
                    icon: <ErrorIcon fontSize="small" />,
                    label: '저장 실패',
                    color: 'error' as const,
                };
            default:
                return {
                    icon: <SaveIcon fontSize="small" />,
                    label: '저장 안됨',
                    color: 'default' as const,
                };
        }
    };

    const config = getStatusConfig();

    const formatLastSaved = (date: Date | null) => {
        if (!date) return '';

        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diff < 60) return '방금 전';
        if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;

        return date.toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
                icon={config.icon}
                label={config.label}
                color={config.color}
                size="small"
                variant="outlined"
            />

            {lastSaved && saveStatus !== 'error' && (
                <Typography variant="caption" color="text.secondary">
                    {formatLastSaved(lastSaved)}
                </Typography>
            )}

            {error && (
                <Typography variant="caption" color="error">
                    {error}
                </Typography>
            )}
        </Box>
    );
};

export default DraftSaveIndicator;
