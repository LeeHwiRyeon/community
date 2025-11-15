import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Avatar,
    Text,
    Heading,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    useColorModeValue,
    Spinner,
    Center,
    Button,
    Input,
    InputGroup,
    InputLeftElement
} from '@chakra-ui/react';
import { FiSearch } from 'react-icons/fi';
import { apiClient } from '../utils/apiClient';
import FollowButton from './FollowButton';
import { useNavigate } from 'react-router-dom';

interface User {
    id: number;
    username: string;
    display_name: string;
    profile_image?: string;
    bio?: string;
    followers_count: number;
    following_count: number;
    followed_at: string;
}

interface FollowersListProps {
    userId: number;
    defaultTab?: 'followers' | 'following';
}

/**
 * 팔로워/팔로잉 목록 컴포넌트
 */
const FollowersList: React.FC<FollowersListProps> = ({
    userId,
    defaultTab = 'followers'
}) => {
    const [followers, setFollowers] = useState<User[]>([]);
    const [following, setFollowing] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState(defaultTab === 'followers' ? 0 : 1);

    const navigate = useNavigate();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    // 팔로워 목록 조회
    const fetchFollowers = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/api/follow/${userId}/followers?limit=100`);
            setFollowers(response.followers || []);
        } catch (error) {
            console.error('팔로워 목록 조회 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    // 팔로잉 목록 조회
    const fetchFollowing = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/api/follow/${userId}/following?limit=100`);
            setFollowing(response.following || []);
        } catch (error) {
            console.error('팔로잉 목록 조회 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 0) {
            fetchFollowers();
        } else {
            fetchFollowing();
        }
    }, [userId, activeTab]);

    // 검색 필터링
    const filterUsers = (users: User[]) => {
        if (!searchQuery) return users;

        return users.filter(user =>
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    // 사용자 카드 렌더링
    const renderUserCard = (user: User) => (
        <Box
            key={user.id}
            p={4}
            bg={bgColor}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="md"
            _hover={{ shadow: 'md' }}
            transition="all 0.2s"
        >
            <HStack spacing={4} align="start">
                <Avatar
                    size="md"
                    name={user.display_name || user.username}
                    src={user.profile_image}
                    cursor="pointer"
                    onClick={() => navigate(`/profile/${user.id}`)}
                />

                <VStack flex={1} align="start" spacing={1}>
                    <Text
                        fontWeight="bold"
                        fontSize="md"
                        cursor="pointer"
                        onClick={() => navigate(`/profile/${user.id}`)}
                        _hover={{ color: 'blue.500' }}
                    >
                        {user.display_name || user.username}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                        @{user.username}
                    </Text>
                    {user.bio && (
                        <Text fontSize="sm" noOfLines={2}>
                            {user.bio}
                        </Text>
                    )}
                    <HStack fontSize="xs" color="gray.500" spacing={4}>
                        <Text>팔로워 {user.followers_count}</Text>
                        <Text>팔로잉 {user.following_count}</Text>
                    </HStack>
                </VStack>

                <FollowButton
                    targetType="user"
                    targetId={user.id}
                    targetName={user.display_name || user.username}
                    size="sm"
                />
            </HStack>
        </Box>
    );

    return (
        <Box>
            <Tabs
                index={activeTab}
                onChange={(index) => setActiveTab(index)}
                colorScheme="blue"
            >
                <TabList>
                    <Tab>팔로워 ({followers.length})</Tab>
                    <Tab>팔로잉 ({following.length})</Tab>
                </TabList>

                <TabPanels>
                    {/* 팔로워 탭 */}
                    <TabPanel px={0}>
                        <VStack spacing={4} align="stretch">
                            {/* 검색 */}
                            <InputGroup>
                                <InputLeftElement pointerEvents="none">
                                    <FiSearch color="gray" />
                                </InputLeftElement>
                                <Input
                                    placeholder="팔로워 검색..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </InputGroup>

                            {/* 목록 */}
                            {loading ? (
                                <Center py={10}>
                                    <Spinner size="xl" />
                                </Center>
                            ) : filterUsers(followers).length === 0 ? (
                                <Center py={10}>
                                    <Text color="gray.500">
                                        {searchQuery ? '검색 결과가 없습니다' : '팔로워가 없습니다'}
                                    </Text>
                                </Center>
                            ) : (
                                <VStack spacing={3} align="stretch">
                                    {filterUsers(followers).map(renderUserCard)}
                                </VStack>
                            )}
                        </VStack>
                    </TabPanel>

                    {/* 팔로잉 탭 */}
                    <TabPanel px={0}>
                        <VStack spacing={4} align="stretch">
                            {/* 검색 */}
                            <InputGroup>
                                <InputLeftElement pointerEvents="none">
                                    <FiSearch color="gray" />
                                </InputLeftElement>
                                <Input
                                    placeholder="팔로잉 검색..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </InputGroup>

                            {/* 목록 */}
                            {loading ? (
                                <Center py={10}>
                                    <Spinner size="xl" />
                                </Center>
                            ) : filterUsers(following).length === 0 ? (
                                <Center py={10}>
                                    <Text color="gray.500">
                                        {searchQuery ? '검색 결과가 없습니다' : '팔로잉이 없습니다'}
                                    </Text>
                                </Center>
                            ) : (
                                <VStack spacing={3} align="stretch">
                                    {filterUsers(following).map(renderUserCard)}
                                </VStack>
                            )}
                        </VStack>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
};

export default FollowersList;
