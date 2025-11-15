import React, { useState, useEffect } from 'react';
import {
    HStack,
    VStack,
    Text,
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    useColorModeValue,
    Spinner
} from '@chakra-ui/react';
import { apiClient } from '../utils/apiClient';
import FollowersList from './FollowersList';

interface FollowStatsProps {
    userId: number;
    size?: 'sm' | 'md' | 'lg';
    showLabels?: boolean;
}

interface Stats {
    user_id: number;
    followers_count: number;
    following_count: number;
}

/**
 * 팔로우 통계 컴포넌트
 * 팔로워/팔로잉 수를 표시하고 클릭 시 모달로 목록 보여줌
 */
const FollowStats: React.FC<FollowStatsProps> = ({
    userId,
    size = 'md',
    showLabels = true
}) => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [modalTab, setModalTab] = useState<'followers' | 'following'>('followers');

    const { isOpen, onOpen, onClose } = useDisclosure();
    const textColor = useColorModeValue('gray.600', 'gray.400');

    // 통계 조회
    const fetchStats = async () => {
        try {
            setLoading(true);
            // user_follow_stats 뷰 사용 (있다면) 또는 followers/following 카운트
            const [followersRes, followingRes] = await Promise.all([
                apiClient.get(`/api/follow/${userId}/followers?limit=1`),
                apiClient.get(`/api/follow/${userId}/following?limit=1`)
            ]);

            setStats({
                user_id: userId,
                followers_count: followersRes.pagination?.total || 0,
                following_count: followingRes.pagination?.total || 0
            });
        } catch (error) {
            console.error('팔로우 통계 조회 실패:', error);
            setStats({
                user_id: userId,
                followers_count: 0,
                following_count: 0
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [userId]);

    // 모달 열기
    const handleOpenModal = (tab: 'followers' | 'following') => {
        setModalTab(tab);
        onOpen();
    };

    // 크기별 폰트 설정
    const getFontSize = () => {
        switch (size) {
            case 'sm':
                return 'xs';
            case 'lg':
                return 'md';
            default:
                return 'sm';
        }
    };

    if (loading) {
        return <Spinner size={size} />;
    }

    if (!stats) {
        return null;
    }

    return (
        <>
            <HStack spacing={4} fontSize={getFontSize()}>
                <Button
                    variant="ghost"
                    size={size}
                    onClick={() => handleOpenModal('followers')}
                    p={size === 'sm' ? 1 : 2}
                >
                    <VStack spacing={0}>
                        <Text fontWeight="bold" fontSize={size === 'lg' ? 'lg' : 'md'}>
                            {stats.followers_count.toLocaleString()}
                        </Text>
                        {showLabels && (
                            <Text color={textColor} fontSize={getFontSize()}>
                                팔로워
                            </Text>
                        )}
                    </VStack>
                </Button>

                <Button
                    variant="ghost"
                    size={size}
                    onClick={() => handleOpenModal('following')}
                    p={size === 'sm' ? 1 : 2}
                >
                    <VStack spacing={0}>
                        <Text fontWeight="bold" fontSize={size === 'lg' ? 'lg' : 'md'}>
                            {stats.following_count.toLocaleString()}
                        </Text>
                        {showLabels && (
                            <Text color={textColor} fontSize={getFontSize()}>
                                팔로잉
                            </Text>
                        )}
                    </VStack>
                </Button>
            </HStack>

            {/* 팔로워/팔로잉 목록 모달 */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        {modalTab === 'followers' ? '팔로워' : '팔로잉'}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <FollowersList
                            userId={userId}
                            defaultTab={modalTab}
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
};

export default FollowStats;
