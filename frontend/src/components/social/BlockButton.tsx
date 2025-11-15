/**
 * BlockButton Component
 * 사용자 차단/차단 해제 버튼 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import {
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Tooltip,
    Alert
} from '@mui/material';
import {
    Block as BlockIcon,
    BlockOutlined as BlockOutlinedIcon
} from '@mui/icons-material';
import { blockUser, unblockUser, checkBlockStatus } from '../../services/socialService';
import type { BlockStatus } from '../../types/social';
import './BlockButton.css';

interface BlockButtonProps {
    userId: number;
    username: string;
    size?: 'small' | 'medium' | 'large';
    variant?: 'text' | 'outlined' | 'contained';
    showIcon?: boolean;
    iconOnly?: boolean;
    onBlockChange?: (isBlocked: boolean) => void;
}

export const BlockButton: React.FC<BlockButtonProps> = ({
    userId,
    username,
    size = 'medium',
    variant = 'contained',
    showIcon = true,
    iconOnly = false,
    onBlockChange
}) => {
    const [blockStatus, setBlockStatus] = useState<BlockStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [blockDialogOpen, setBlockDialogOpen] = useState(false);
    const [blockReason, setBlockReason] = useState('');

    // 차단 상태 확인
    useEffect(() => {
        loadBlockStatus();
    }, [userId]);

    const loadBlockStatus = async () => {
        try {
            setChecking(true);
            setError(null);
            const status = await checkBlockStatus(userId);
            setBlockStatus(status);
        } catch (err: any) {
            console.error('차단 상태 확인 실패:', err);
            setError(err.response?.data?.error || '차단 상태를 확인할 수 없습니다.');
        } finally {
            setChecking(false);
        }
    };

    const handleBlockClick = () => {
        setBlockDialogOpen(true);
    };

    const handleBlockConfirm = async () => {
        try {
            setLoading(true);
            setError(null);

            await blockUser(userId, blockReason.trim() || undefined);

            const newStatus: BlockStatus = {
                isBlocked: true,
                iBlockedThem: true,
                theyBlockedMe: blockStatus?.theyBlockedMe || false
            };
            setBlockStatus(newStatus);
            setBlockDialogOpen(false);
            setBlockReason('');

            if (onBlockChange) {
                onBlockChange(true);
            }
        } catch (err: any) {
            console.error('차단 실패:', err);
            setError(err.response?.data?.error || '차단에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleUnblock = async () => {
        try {
            setLoading(true);
            setError(null);

            await unblockUser(userId);

            const newStatus: BlockStatus = {
                isBlocked: blockStatus?.theyBlockedMe || false,
                iBlockedThem: false,
                theyBlockedMe: blockStatus?.theyBlockedMe || false
            };
            setBlockStatus(newStatus);

            if (onBlockChange) {
                onBlockChange(false);
            }
        } catch (err: any) {
            console.error('차단 해제 실패:', err);
            setError(err.response?.data?.error || '차단 해제에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDialogClose = () => {
        if (!loading) {
            setBlockDialogOpen(false);
            setBlockReason('');
            setError(null);
        }
    };

    if (checking) {
        return (
            <IconButton size={size} disabled>
                <CircularProgress size={20} />
            </IconButton>
        );
    }

    const isBlocked = blockStatus?.iBlockedThem || false;

    // 아이콘 전용 버튼
    if (iconOnly) {
        return (
            <>
                <Tooltip title={isBlocked ? '차단 해제' : '차단'}>
                    <span>
                        <IconButton
                            size={size}
                            onClick={isBlocked ? handleUnblock : handleBlockClick}
                            disabled={loading}
                            className={`block-icon-button ${isBlocked ? 'blocked' : 'not-blocked'}`}
                        >
                            {loading ? (
                                <CircularProgress size={20} />
                            ) : isBlocked ? (
                                <BlockIcon />
                            ) : (
                                <BlockOutlinedIcon />
                            )}
                        </IconButton>
                    </span>
                </Tooltip>
                {renderBlockDialog()}
            </>
        );
    }

    // 일반 버튼
    return (
        <>
            <Button
                variant={variant}
                size={size}
                color={isBlocked ? 'inherit' : 'error'}
                onClick={isBlocked ? handleUnblock : handleBlockClick}
                disabled={loading}
                startIcon={showIcon && !loading ? (isBlocked ? <BlockIcon /> : <BlockOutlinedIcon />) : undefined}
                className={`block-button ${isBlocked ? 'blocked' : 'not-blocked'}`}
            >
                {loading ? (
                    <CircularProgress size={20} />
                ) : isBlocked ? (
                    '차단 해제'
                ) : (
                    '차단'
                )}
            </Button>
            {renderBlockDialog()}
        </>
    );

    function renderBlockDialog() {
        return (
            <Dialog
                open={blockDialogOpen}
                onClose={handleDialogClose}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>사용자 차단</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        <strong>@{username}</strong> 님을 차단하시겠습니까?
                        <br />
                        차단된 사용자는 회원님의 게시물과 댓글을 볼 수 없으며,
                        회원님도 상대방의 콘텐츠를 볼 수 없습니다.
                    </Alert>

                    <TextField
                        label="차단 이유 (선택사항)"
                        multiline
                        rows={3}
                        fullWidth
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        placeholder="차단 이유를 입력하세요 (최대 255자)"
                        inputProps={{ maxLength: 255 }}
                        helperText={`${blockReason.length}/255`}
                        disabled={loading}
                    />

                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose} disabled={loading}>
                        취소
                    </Button>
                    <Button
                        onClick={handleBlockConfirm}
                        color="error"
                        variant="contained"
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={20} /> : '차단'}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
};

export default BlockButton;
