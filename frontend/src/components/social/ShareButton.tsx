/**
 * ShareButton Component
 * 게시물 공유 버튼 및 다이얼로그
 */

import React, { useState } from 'react';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    Tooltip,
    Snackbar,
    Alert,
    Typography,
    Box,
    Divider
} from '@mui/material';
import {
    Share as ShareIcon,
    Close as CloseIcon,
    ContentCopy as CopyIcon,
    Check as CheckIcon
} from '@mui/icons-material';
import {
    FaTwitter,
    FaFacebook,
    FaLinkedin,
    FaReddit,
    FaTelegram,
    FaWhatsapp
} from 'react-icons/fa';
import { trackShare } from '../../services/socialService';
import type { SharePlatform } from '../../types/social';
import './ShareButton.css';

interface ShareButtonProps {
    postId: number;
    postTitle: string;
    postContent?: string;
    postImage?: string; // 미리보기 이미지 URL 추가
    size?: 'small' | 'medium' | 'large';
    variant?: 'text' | 'outlined' | 'contained';
    showLabel?: boolean;
    showPreview?: boolean; // 미리보기 표시 여부
    onShareComplete?: (platform: SharePlatform) => void;
}

const ShareButton: React.FC<ShareButtonProps> = ({
    postId,
    postTitle,
    postContent = '',
    postImage,
    size = 'medium',
    variant = 'outlined',
    showLabel = true,
    showPreview = true,
    onShareComplete
}) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error';
    }>({
        open: false,
        message: '',
        severity: 'success'
    });

    /**
     * 공유 URL 생성
     */
    const getShareUrl = () => {
        return `${window.location.origin}/posts/${postId}`;
    };

    /**
     * 공유 텍스트 생성
     */
    const getShareText = () => {
        const excerpt = postContent.length > 100
            ? postContent.substring(0, 100) + '...'
            : postContent;
        return `${postTitle}\n\n${excerpt}`;
    };

    /**
     * Twitter 공유
     */
    const shareToTwitter = async () => {
        const url = getShareUrl();
        const text = postTitle;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

        window.open(twitterUrl, '_blank', 'width=600,height=400');

        await handleTrackShare('twitter');
        setDialogOpen(false);
    };

    /**
     * Facebook 공유
     */
    const shareToFacebook = async () => {
        const url = getShareUrl();
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

        window.open(facebookUrl, '_blank', 'width=600,height=400');

        await handleTrackShare('facebook');
        setDialogOpen(false);
    };

    /**
     * LinkedIn 공유
     */
    const shareToLinkedIn = async () => {
        const url = getShareUrl();
        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

        window.open(linkedInUrl, '_blank', 'width=600,height=400');

        await handleTrackShare('linkedin');
        setDialogOpen(false);
    };

    /**
     * Reddit 공유
     */
    const shareToReddit = async () => {
        const url = getShareUrl();
        const text = postTitle;
        const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;

        window.open(redditUrl, '_blank', 'width=600,height=400');

        await handleTrackShare('other');
        setDialogOpen(false);
    };

    /**
     * WhatsApp 공유
     */
    const shareToWhatsApp = async () => {
        const url = getShareUrl();
        const text = `${postTitle}\n\n${url}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;

        window.open(whatsappUrl, '_blank', 'width=600,height=400');

        await handleTrackShare('other');
        setDialogOpen(false);
    };

    /**
     * Telegram 공유
     */
    const shareToTelegram = async () => {
        const url = getShareUrl();
        const text = postTitle;
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;

        window.open(telegramUrl, '_blank', 'width=600,height=400');

        await handleTrackShare('other');
        setDialogOpen(false);
    };

    /**
     * 클립보드에 복사
     */
    const copyToClipboard = async () => {
        const url = getShareUrl();
        const text = `${postTitle}\n\n${url}`;

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);

            await handleTrackShare('clipboard');

            setSnackbar({
                open: true,
                message: '링크가 클립보드에 복사되었습니다!',
                severity: 'success'
            });

            setTimeout(() => {
                setCopied(false);
                setDialogOpen(false);
            }, 1500);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            setSnackbar({
                open: true,
                message: '복사에 실패했습니다.',
                severity: 'error'
            });
        }
    };

    /**
     * 공유 추적
     */
    const handleTrackShare = async (platform: SharePlatform) => {
        try {
            await trackShare(postId, platform);

            if (onShareComplete) {
                onShareComplete(platform);
            }
        } catch (error) {
            console.error('Failed to track share:', error);
        }
    };

    /**
     * 다이얼로그 열기
     */
    const handleOpenDialog = () => {
        setDialogOpen(true);
    };

    /**
     * 다이얼로그 닫기
     */
    const handleCloseDialog = () => {
        setDialogOpen(false);
        setCopied(false);
    };

    /**
     * Snackbar 닫기
     */
    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <>
            <Tooltip title="공유하기">
                <Button
                    size={size}
                    variant={variant}
                    startIcon={<ShareIcon />}
                    onClick={handleOpenDialog}
                    className="share-button"
                >
                    {showLabel && '공유'}
                </Button>
            </Tooltip>

            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="xs"
                fullWidth
                className="share-dialog"
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6" component="span">
                            게시물 공유
                        </Typography>
                        <IconButton
                            edge="end"
                            onClick={handleCloseDialog}
                            aria-label="close"
                            size="small"
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent dividers>
                    {/* 미리보기 */}
                    {showPreview && (
                        <Box className="share-preview" sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                공유 미리보기
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                {postImage && (
                                    <Box
                                        component="img"
                                        src={postImage}
                                        alt={postTitle}
                                        sx={{
                                            width: 80,
                                            height: 80,
                                            objectFit: 'cover',
                                            borderRadius: 1,
                                            flexShrink: 0
                                        }}
                                    />
                                )}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                        variant="subtitle2"
                                        sx={{
                                            fontWeight: 600,
                                            mb: 0.5,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical'
                                        }}
                                    >
                                        {postTitle}
                                    </Typography>
                                    {postContent && (
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical'
                                            }}
                                        >
                                            {postContent.substring(0, 100)}
                                            {postContent.length > 100 && '...'}
                                        </Typography>
                                    )}
                                    <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block' }}>
                                        {getShareUrl()}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}

                    <List className="share-options-list">
                        {/* Twitter */}
                        <ListItem
                            className="share-option-item twitter"
                            onClick={shareToTwitter}
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        >
                            <ListItemIcon>
                                <FaTwitter size={24} color="#1DA1F2" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Twitter"
                                secondary="트위터에서 공유"
                            />
                        </ListItem>

                        <Divider />

                        {/* Facebook */}
                        <ListItem
                            className="share-option-item facebook"
                            onClick={shareToFacebook}
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        >
                            <ListItemIcon>
                                <FaFacebook size={24} color="#1877F2" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Facebook"
                                secondary="페이스북에서 공유"
                            />
                        </ListItem>

                        <Divider />

                        {/* LinkedIn */}
                        <ListItem
                            className="share-option-item linkedin"
                            onClick={shareToLinkedIn}
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        >
                            <ListItemIcon>
                                <FaLinkedin size={24} color="#0A66C2" />
                            </ListItemIcon>
                            <ListItemText
                                primary="LinkedIn"
                                secondary="링크드인에서 공유"
                            />
                        </ListItem>

                        <Divider />

                        {/* Reddit */}
                        <ListItem
                            className="share-option-item reddit"
                            onClick={shareToReddit}
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        >
                            <ListItemIcon>
                                <FaReddit size={24} color="#FF4500" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Reddit"
                                secondary="레딧에서 공유"
                            />
                        </ListItem>

                        <Divider />

                        {/* WhatsApp */}
                        <ListItem
                            className="share-option-item whatsapp"
                            onClick={shareToWhatsApp}
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        >
                            <ListItemIcon>
                                <FaWhatsapp size={24} color="#25D366" />
                            </ListItemIcon>
                            <ListItemText
                                primary="WhatsApp"
                                secondary="왓츠앱으로 공유"
                            />
                        </ListItem>

                        <Divider />

                        {/* Telegram */}
                        <ListItem
                            className="share-option-item telegram"
                            onClick={shareToTelegram}
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        >
                            <ListItemIcon>
                                <FaTelegram size={24} color="#0088cc" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Telegram"
                                secondary="텔레그램으로 공유"
                            />
                        </ListItem>

                        <Divider />

                        {/* 클립보드 복사 */}
                        <ListItem
                            className="share-option-item clipboard"
                            onClick={copyToClipboard}
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        >
                            <ListItemIcon>
                                {copied ? (
                                    <CheckIcon color="success" />
                                ) : (
                                    <CopyIcon />
                                )}
                            </ListItemIcon>
                            <ListItemText
                                primary={copied ? '복사됨!' : '링크 복사'}
                                secondary="클립보드에 링크 복사"
                            />
                        </ListItem>
                    </List>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleCloseDialog} color="inherit">
                        닫기
                    </Button>
                </DialogActions>
            </Dialog>

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
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default ShareButton;
