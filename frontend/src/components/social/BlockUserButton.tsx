/**
 * BlockUserButton Component
 * 사용자 차단/차단 해제 버튼
 */

import React, { useState, useEffect } from 'react';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Tooltip,
    Snackbar,
    Alert,
    Typography,
    Box,
    CircularProgress
} from '@mui/material';
import {
    Block as BlockIcon,
    BlockOutlined as BlockOutlinedIcon,
    Close as CloseIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { blockUser, unblockUser, checkBlockStatus } from '../../services/socialService';
import './BlockUserButton.css';

interface BlockUserButtonProps {
    targetUserId: number;
    targetUsername: string;
    size?: 'small' | 'medium' | 'large';
    variant?: 'text' | 'outlined' | 'contained';
    showLabel?: boolean;
    showIcon?: boolean;
    onBlockChange?: (isBlocked: boolean) => void;
}

const BlockUserButton: React.FC<BlockUserButtonProps> = ({
    targetUserId,
    targetUsername,
    size = 'medium',
    variant = 'outlined',
    showLabel = true,
    showIcon = true,
    onBlockChange
}) => {
    const [isBlocked, setIsBlocked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'warning' | 'info';
    }>({
        open: false,
        message: '',
        severity: 'success'
    });

    /**
     * 컴포넌트 마운트 시 차단 상태 확인
     */
    useEffect(() => {
        checkInitialBlockStatus();
    }, [targetUserId]);

    /**
     * 초기 차단 상태 확인
     */
    const checkInitialBlockStatus = async () => {
        try {
            setCheckingStatus(true);
            const status = await checkBlockStatus(targetUserId);
            setIsBlocked(status.isBlocked);
        } catch (error) {
            console.error('Failed to check block status:', error);
        } finally {
            setCheckingStatus(false);
        }
    };

    /**
     * 차단/차단 해제 처리
     */
    const handleBlockToggle = async () => {
        if (isBlocked) {
            // 차단 해제는 바로 실행
            await handleUnblock();
        } else {
            // 차단은 확인 다이얼로그 표시
            setConfirmDialogOpen(true);
        }
    };

    /**
     * 사용자 차단
     */
    const handleBlock = async () => {
        setLoading(true);
        setConfirmDialogOpen(false);

        try {
            const response = await blockUser(targetUserId);

            if (response.success) {
                setIsBlocked(true);

                setSnackbar({
                    open: true,
                    message: `${targetUsername}님을 차단했습니다.`,
                    severity: 'success'
                });

                if (onBlockChange) {
                    onBlockChange(true);
                }
            } else {
                throw new Error(response.message || '차단 실패');
            }
        } catch (error: any) {
            console.error('Failed to block user:', error);

            setSnackbar({
                open: true,
                message: error.message || '사용자 차단에 실패했습니다.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * 사용자 차단 해제
     */
    const handleUnblock = async () => {
        setLoading(true);

        try {
            const response = await unblockUser(targetUserId);

            if (response.success) {
                setIsBlocked(false);

                setSnackbar({
                    open: true,
                    message: `${targetUsername}님의 차단을 해제했습니다.`,
                    severity: 'info'
                });

                if (onBlockChange) {
                    onBlockChange(false);
                }
            } else {
                throw new Error(response.message || '차단 해제 실패');
            }
        } catch (error: any) {
            console.error('Failed to unblock user:', error);

            setSnackbar({
                open: true,
                message: error.message || '차단 해제에 실패했습니다.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * 확인 다이얼로그 닫기
     */
    const handleCloseConfirmDialog = () => {
        setConfirmDialogOpen(false);
    };

    /**
     * Snackbar 닫기
     */
    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    /**
     * 로딩 중일 때
     */
    if (checkingStatus) {
        return (
            <Button
                size={size}
                variant={variant}
                disabled
                startIcon={showIcon && <CircularProgress size={16} />}
            >
                {showLabel && '확인 중...'}
            </Button>
        );
    }

    return (
        <>
            <Tooltip title={isBlocked ? '차단 해제' : '사용자 차단'}>
                <Button
                    size={size}
                    variant={variant}
                    color={isBlocked ? 'warning' : 'error'}
                    startIcon={showIcon && (loading ? (
                        <CircularProgress size={16} />
                    ) : isBlocked ? (
                        <BlockOutlinedIcon />
                    ) : (
                        <BlockIcon />
                    ))}
                    onClick={handleBlockToggle}
                    disabled={loading}
                    className={`block-user-button ${isBlocked ? 'blocked' : 'not-blocked'}`}
                >
                    {showLabel && (isBlocked ? '차단 해제' : '차단')}
                </Button>
            </Tooltip>

            {/* 차단 확인 다이얼로그 */}
            <Dialog
                open={confirmDialogOpen}
                onClose={handleCloseConfirmDialog}
                maxWidth="xs"
                fullWidth
                className="block-confirm-dialog"
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningIcon color="error" />
                        <Typography variant="h6" component="span">
                            사용자 차단
                        </Typography>
                        <IconButton
                            edge="end"
                            onClick={handleCloseConfirmDialog}
                            aria-label="close"
                            size="small"
                            sx={{ ml: 'auto' }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent>
                    <Box sx={{ py: 1 }}>
                        <Typography variant="body1" gutterBottom>
                            <strong>{targetUsername}</strong>님을 차단하시겠습니까?
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            차단하면 다음과 같은 효과가 있습니다:
                        </Typography>
                        <Box component="ul" sx={{ mt: 1, pl: 2, color: 'text.secondary' }}>
                            <Typography component="li" variant="body2">
                                상대방의 게시물이 보이지 않습니다
                            </Typography>
                            <Typography component="li" variant="body2">
                                상대방의 댓글이 보이지 않습니다
                            </Typography>
                            <Typography component="li" variant="body2">
                                상대방에게 DM을 받지 않습니다
                            </Typography>
                            <Typography component="li" variant="body2">
                                상대방의 알림을 받지 않습니다
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
                            ⚠️ 차단은 언제든지 해제할 수 있습니다.
                        </Typography>
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleCloseConfirmDialog} color="inherit">
                        취소
                    </Button>
                    <Button
                        onClick={handleBlock}
                        color="error"
                        variant="contained"
                        startIcon={<BlockIcon />}
                        disabled={loading}
                    >
                        {loading ? '차단 중...' : '차단하기'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 알림 Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                    icon={isBlocked ? <BlockIcon /> : <BlockOutlinedIcon />}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default BlockUserButton;
