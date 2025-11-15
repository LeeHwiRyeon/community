/**
 * 팔로워/팔로잉 목록 컴포넌트
 * 사용자의 팔로워 및 팔로잉 목록 표시
 * 
 * @author AUTOAGENTS
 * @date 2025-11-11
 * @version 1.0
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Avatar,
    Text,
    Button,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Spinner,
    Center,
    Badge,
    useColorModeValue,
    Divider,
    Grid,
    GridItem
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../utils/apiClient';

interface User {
    id: number;
    username: string;
    display_name: string;
    avatar_url: string;
    bio: string;
    followed_at: string;
    reputation_score: number;
    level: number;
    total_posts: number;
}

interface FollowListProps {
    userId: number;
    initialTab?: 'followers' | 'following';
}

const FollowList: React.FC<FollowListProps> = ({ userId, initialTab = 'followers' }) => {
    const navigate = useNavigate();
    const [followers, setFollowers] = useState<User[]>([]);
    const [following, setFollowing] = useState<User[]>([]);
    const [followersPage, setFollowersPage] = useState(1);
    const [followingPage, setFollowingPage] = useState(1);
    const [followersPagination, setFollowersPagination] = useState<any>(null);
    const [followingPagination, setFollowingPagination] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [tabIndex, setTabIndex] = useState(initialTab === 'following' ? 1 : 0);

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

    useEffect(() => {
        if (tabIndex === 0) {
            fetchFollowers();
        } else {
            fetchFollowing();
        }
    }, [userId, tabIndex, followersPage, followingPage]);

    const fetchFollowers = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/api/users/${userId}/followers`, {
                params: {
                    page: followersPage,
                    limit: 20
                }
            });

            if (response.data) {
                setFollowers(response.data.followers);
                setFollowersPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('팔로워 목록 조회 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFollowing = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/api/users/${userId}/following`, {
                params: {
                    page: followingPage,
                    limit: 20
                }
            });

            if (response.data) {
                setFollowing(response.data.following);
                setFollowingPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('팔로잉 목록 조회 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUserClick = (clickedUserId: number) => {
        navigate(`/profile/${clickedUserId}`);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return '오늘';
        if (days === 1) return '어제';
        if (days < 7) return `${days}일 전`;
        if (days < 30) return `${Math.floor(days / 7)}주 전`;
        if (days < 365) return `${Math.floor(days / 30)}개월 전`;
        return `${Math.floor(days / 365)}년 전`;
    };

    const renderUserCard = (user: User) => (
        <Box
            key={user.id}
            p={4}
            bg={bgColor}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="md"
            _hover={{ bg: hoverBgColor, cursor: 'pointer' }}
            onClick={() => handleUserClick(user.id)}
        >
            <HStack spacing={4}>
                <Avatar
                    size="lg"
                    src={user.avatar_url}
                    name={user.display_name || user.username}
                />
                <VStack align="start" flex={1} spacing={1}>
                    <HStack>
                        <Text fontWeight="bold" fontSize="lg">
                            {user.display_name || user.username}
                        </Text>
                        <Badge colorScheme="blue">Lv. {user.level}</Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.500">
                        @{user.username}
                    </Text>
                    {user.bio && (
                        <Text fontSize="sm" noOfLines={2} color="gray.600">
                            {user.bio}
                        </Text>
                    )}
                    <HStack spacing={4} fontSize="sm" color="gray.500">
                        <Text>평판: {user.reputation_score}</Text>
                        <Text>게시물: {user.total_posts}</Text>
                        <Text>팔로우: {formatDate(user.followed_at)}</Text>
                    </HStack>
                </VStack>
                <Button
                    size="sm"
                    colorScheme="blue"
                    variant="outline"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleUserClick(user.id);
                    }}
                >
                    프로필 보기
                </Button>
            </HStack>
        </Box>
    );

    return (
        <Box>
            <Tabs
                index={tabIndex}
                onChange={(index) => setTabIndex(index)}
                colorScheme="blue"
            >
                <TabList>
                    <Tab>
                        팔로워 {followersPagination && `(${followersPagination.total})`}
                    </Tab>
                    <Tab>
                        팔로잉 {followingPagination && `(${followingPagination.total})`}
                    </Tab>
                </TabList>

                <TabPanels>
                    {/* 팔로워 탭 */}
                    <TabPanel>
                        {loading ? (
                            <Center py={10}>
                                <Spinner size="xl" color="blue.500" />
                            </Center>
                        ) : followers.length === 0 ? (
                            <Center py={10}>
                                <Text color="gray.500">팔로워가 없습니다</Text>
                            </Center>
                        ) : (
                            <VStack spacing={4} align="stretch">
                                {followers.map(renderUserCard)}

                                {/* 페이지네이션 */}
                                {followersPagination && followersPagination.totalPages > 1 && (
                                    <HStack justify="center" mt={4}>
                                        <Button
                                            size="sm"
                                            isDisabled={followersPage === 1}
                                            onClick={() => setFollowersPage(followersPage - 1)}
                                        >
                                            이전
                                        </Button>
                                        <Text fontSize="sm">
                                            {followersPage} / {followersPagination.totalPages}
                                        </Text>
                                        <Button
                                            size="sm"
                                            isDisabled={followersPage === followersPagination.totalPages}
                                            onClick={() => setFollowersPage(followersPage + 1)}
                                        >
                                            다음
                                        </Button>
                                    </HStack>
                                )}
                            </VStack>
                        )}
                    </TabPanel>

                    {/* 팔로잉 탭 */}
                    <TabPanel>
                        {loading ? (
                            <Center py={10}>
                                <Spinner size="xl" color="blue.500" />
                            </Center>
                        ) : following.length === 0 ? (
                            <Center py={10}>
                                <Text color="gray.500">팔로잉하는 사용자가 없습니다</Text>
                            </Center>
                        ) : (
                            <VStack spacing={4} align="stretch">
                                {following.map(renderUserCard)}

                                {/* 페이지네이션 */}
                                {followingPagination && followingPagination.totalPages > 1 && (
                                    <HStack justify="center" mt={4}>
                                        <Button
                                            size="sm"
                                            isDisabled={followingPage === 1}
                                            onClick={() => setFollowingPage(followingPage - 1)}
                                        >
                                            이전
                                        </Button>
                                        <Text fontSize="sm">
                                            {followingPage} / {followingPagination.totalPages}
                                        </Text>
                                        <Button
                                            size="sm"
                                            isDisabled={followingPage === followingPagination.totalPages}
                                            onClick={() => setFollowingPage(followingPage + 1)}
                                        >
                                            다음
                                        </Button>
                                    </HStack>
                                )}
                            </VStack>
                        )}
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
};

export default FollowList;
