import React, { useState, useEffect } from 'react';
import {
    Button,
    IconButton,
    Tooltip,
    useToast
} from '@chakra-ui/react';
import { FiUserPlus, FiUserMinus } from 'react-icons/fi';
import { apiClient } from '../utils/apiClient';

interface FollowButtonProps {
    targetType: 'user' | 'board';
    targetId: number;
    targetName?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    variant?: 'solid' | 'outline' | 'ghost' | 'icon';
    colorScheme?: string;
    onFollowChange?: (isFollowing: boolean) => void;
}

/**
 * 팔로우 버튼 컴포넌트
 * 사용자 또는 게시판을 팔로우/언팔로우하는 버튼
 */
const FollowButton: React.FC<FollowButtonProps> = ({
    targetType,
    targetId,
    targetName = '',
    size = 'md',
    variant = 'solid',
    colorScheme = 'blue',
    onFollowChange
}) => {
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const toast = useToast();

    // 팔로우 상태 확인
    useEffect(() => {
        const checkFollowStatus = async () => {
            try {
                setChecking(true);
                const endpoint = targetType === 'user'
                    ? `/api/follow/${targetId}/status`
                    : `/api/follow/board/${targetId}/status`;

                const response = await apiClient.get(endpoint);
                setIsFollowing(response.isFollowing || false);
            } catch (error) {
                console.error('팔로우 상태 확인 실패:', error);
            } finally {
                setChecking(false);
            }
        };

        checkFollowStatus();
    }, [targetType, targetId]);

    // 팔로우/언팔로우 처리
    const handleToggleFollow = async () => {
        try {
            setLoading(true);

            if (isFollowing) {
                // 언팔로우
                const endpoint = targetType === 'user'
                    ? `/api/follow/${targetId}`
                    : `/api/follow/board/${targetId}`;

                await apiClient.delete(endpoint);

                setIsFollowing(false);
                if (onFollowChange) onFollowChange(false);

                toast({
                    title: '언팔로우 완료',
                    description: `${targetName || (targetType === 'user' ? '사용자' : '게시판')}을 언팔로우했습니다.`,
                    status: 'info',
                    duration: 3000,
                    isClosable: true
                });
            } else {
                // 팔로우
                const endpoint = targetType === 'user'
                    ? `/api/follow/${targetId}`
                    : `/api/follow/board/${targetId}`;

                await apiClient.post(endpoint);

                setIsFollowing(true);
                if (onFollowChange) onFollowChange(true);

                toast({
                    title: '팔로우 완료',
                    description: `${targetName || (targetType === 'user' ? '사용자' : '게시판')}을 팔로우했습니다.`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
            }
        } catch (error: any) {
            console.error('팔로우 처리 실패:', error);
            toast({
                title: '오류 발생',
                description: error.response?.data?.error || '팔로우 처리 중 오류가 발생했습니다.',
                status: 'error',
                duration: 5000,
                isClosable: true
            });
        } finally {
            setLoading(false);
        }
    };

    // 아이콘 버튼 버전
    if (variant === 'icon') {
        return (
            <Tooltip label={isFollowing ? '언팔로우' : '팔로우'}>
                <IconButton
                    aria-label={isFollowing ? '언팔로우' : '팔로우'}
                    icon={isFollowing ? <FiUserMinus /> : <FiUserPlus />}
                    size={size}
                    colorScheme={isFollowing ? 'gray' : colorScheme}
                    isLoading={loading || checking}
                    onClick={handleToggleFollow}
                />
            </Tooltip>
        );
    }

    // 일반 버튼 버전
    return (
        <Button
            leftIcon={isFollowing ? <FiUserMinus /> : <FiUserPlus />}
            size={size}
            variant={variant}
            colorScheme={isFollowing ? 'gray' : colorScheme}
            isLoading={loading || checking}
            onClick={handleToggleFollow}
        >
            {isFollowing ? '팔로잉' : '팔로우'}
        </Button>
    );
};

export default FollowButton;
