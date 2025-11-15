/**
 * FollowButton Component
 * 팔로우/언팔로우 버튼 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import {
    Button,
    CircularProgress,
    Tooltip,
    Box
} from '@mui/material';
import {
    PersonAdd as PersonAddIcon,
    PersonRemove as PersonRemoveIcon,
    Done as DoneIcon
} from '@mui/icons-material';
import { followUser, unfollowUser, checkFollowStatus } from '../../services/socialService';
import type { FollowStatus } from '../../types/social';
import './FollowButton.css';

interface FollowButtonProps {
    userId: number;
    username?: string;
    size?: 'small' | 'medium' | 'large';
    variant?: 'contained' | 'outlined' | 'text';
    showIcon?: boolean;
    fullWidth?: boolean;
    onFollowChange?: (isFollowing: boolean) => void;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
    userId,
    username,
    size = 'medium',
    variant = 'contained',
    showIcon = true,
    fullWidth = false,
    onFollowChange
}) => {
    const [followStatus, setFollowStatus] = useState<FollowStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 팔로우 상태 로드
    useEffect(() => {
        loadFollowStatus();
    }, [userId]);

    const loadFollowStatus = async () => {
        try {
            setInitialLoading(true);
            const status = await checkFollowStatus(userId);
            setFollowStatus(status);
        } catch (err: any) {
            console.error('Failed to load follow status:', err);
            setError(err.response?.data?.error || '팔로우 상태를 불러올 수 없습니다.');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleFollow = async () => {
        try {
            setLoading(true);
            setError(null);

            await followUser(userId);

            // 상태 업데이트
            setFollowStatus({
                isFollowing: true,
                isMutual: followStatus?.isMutual || false,
                userId
            });

            // 부모 컴포넌트에 알림
            onFollowChange?.(true);
        } catch (err: any) {
            console.error('Failed to follow user:', err);
            setError(err.response?.data?.error || '팔로우에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleUnfollow = async () => {
        try {
            setLoading(true);
            setError(null);

            await unfollowUser(userId);

            // 상태 업데이트
            setFollowStatus({
                isFollowing: false,
                isMutual: false,
                userId
            });

            // 부모 컴포넌트에 알림
            onFollowChange?.(false);
        } catch (err: any) {
            console.error('Failed to unfollow user:', err);
            setError(err.response?.data?.error || '언팔로우에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 초기 로딩 중
    if (initialLoading) {
        return (
            <Button
                size={size}
                variant={variant}
                disabled
                fullWidth={fullWidth}
            >
                <CircularProgress size={20} />
            </Button>
        );
    }

    // 에러 상태
    if (error) {
        return (
            <Tooltip title={error}>
                <Button
                    size={size}
                    variant="outlined"
                    color="error"
                    disabled
                    fullWidth={fullWidth}
                >
                    오류
                </Button>
            </Tooltip>
        );
    }

    // 팔로우 중인 경우
    if (followStatus?.isFollowing) {
        const tooltipText = followStatus.isMutual
            ? `${username || '사용자'}님과 서로 팔로우 중입니다`
            : `${username || '사용자'}님을 팔로우 중입니다`;

        return (
            <Tooltip title={tooltipText}>
                <Button
                    className="follow-button following"
                    size={size}
                    variant={variant === 'contained' ? 'outlined' : variant}
                    color="primary"
                    onClick={handleUnfollow}
                    disabled={loading}
                    fullWidth={fullWidth}
                    startIcon={showIcon && (
                        followStatus.isMutual ? <DoneIcon /> : <PersonRemoveIcon />
                    )}
                >
                    {loading ? (
                        <CircularProgress size={20} />
                    ) : followStatus.isMutual ? (
                        '맞팔로우'
                    ) : (
                        '팔로잉'
                    )}
                </Button>
            </Tooltip>
        );
    }

    // 팔로우하지 않은 경우
    return (
        <Tooltip title={`${username || '사용자'}님을 팔로우합니다`}>
            <Button
                className="follow-button not-following"
                size={size}
                variant={variant}
                color="primary"
                onClick={handleFollow}
                disabled={loading}
                fullWidth={fullWidth}
                startIcon={showIcon && <PersonAddIcon />}
            >
                {loading ? <CircularProgress size={20} /> : '팔로우'}
            </Button>
        </Tooltip>
    );
};

export default FollowButton;
