/**
 * 프로필 v2 페이지
 * 사용자 프로필, 통계, 팔로워/팔로잉, 활동 대시보드 통합
 * 
 * @author AUTOAGENTS
 * @date 2025-11-11
 * @version 2.0
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    VStack,
    HStack,
    Avatar,
    Text,
    Button,
    Heading,
    Badge,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Grid,
    GridItem,
    Icon,
    useColorModeValue,
    Spinner,
    Center,
    Divider,
    Link,
    IconButton,
    useToast
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FiEdit,
    FiMapPin,
    FiGlobe,
    FiGithub,
    FiTwitter,
    FiLinkedin,
    FiCalendar,
    FiSettings
} from 'react-icons/fi';
import ActivityDashboard from '../components/profile/ActivityDashboard';
import FollowList from '../components/profile/FollowList';
import BadgeDisplay from '../components/profile/BadgeDisplay';
import { apiClient } from '../utils/apiClient';

interface UserProfile {
    id: number;
    username: string;
    display_name: string;
    email: string;
    bio: string;
    location: string;
    website: string;
    github_url: string;
    twitter_url: string;
    linkedin_url: string;
    avatar_url: string;
    banner_image: string;
    theme_preference: string;
    show_email: boolean;
    show_location: boolean;
    last_seen_at: string;
    created_at: string;
}

interface Statistics {
    reputation_score: number;
    level: number;
    experience_points: number;
    total_posts: number;
    total_views: number;
    total_likes_received: number;
    total_comments_received: number;
    total_comments: number;
    total_likes_given: number;
    current_streak: number;
    longest_streak: number;
    last_activity_date: string;
    total_badges: number;
    total_achievements: number;
}

interface FullProfile {
    user: UserProfile;
    statistics: Statistics;
    badges: any[];
    achievements: any[];
    activityLog: any[];
}

const ProfileV2Page: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const toast = useToast();

    const [profile, setProfile] = useState<FullProfile | null>(null);
    const [followStats, setFollowStats] = useState<any>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const bgColor = useColorModeValue('gray.50', 'gray.900');
    const cardBgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const accentColor = useColorModeValue('blue.500', 'blue.300');

    useEffect(() => {
        // 현재 로그인한 사용자 ID 가져오기
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUserId(payload.id || payload.userId);
            } catch (error) {
                console.error('토큰 파싱 실패:', error);
            }
        }

        fetchProfile();
        fetchFollowStats();
    }, [userId]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const id = parseInt(userId || '0');
            const response = await apiClient.get(`/api/users/${id}/profile/full`);

            if (response.data) {
                setProfile(response.data);
            }
        } catch (error) {
            console.error('프로필 조회 실패:', error);
            toast({
                title: '프로필 조회 실패',
                description: '프로필을 불러오는데 실패했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchFollowStats = async () => {
        try {
            const id = parseInt(userId || '0');
            const response = await apiClient.get(`/api/users/${id}/follow-stats`);

            if (response.data) {
                setFollowStats(response.data);
            }
        } catch (error) {
            console.error('팔로우 통계 조회 실패:', error);
        }
    };

    const handleFollow = async () => {
        if (!currentUserId) {
            toast({
                title: '로그인 필요',
                description: '팔로우하려면 로그인해주세요.',
                status: 'warning',
                duration: 3000,
                isClosable: true
            });
            return;
        }

        try {
            const id = parseInt(userId || '0');
            if (isFollowing) {
                await apiClient.delete(`/api/follow/${id}`);
                setIsFollowing(false);
                toast({
                    title: '언팔로우 완료',
                    status: 'success',
                    duration: 2000,
                    isClosable: true
                });
            } else {
                await apiClient.post(`/api/follow/${id}`);
                setIsFollowing(true);
                toast({
                    title: '팔로우 완료',
                    status: 'success',
                    duration: 2000,
                    isClosable: true
                });
            }
            fetchFollowStats();
        } catch (error: any) {
            toast({
                title: '오류 발생',
                description: error.response?.data?.error || '팔로우 처리 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const isOwner = currentUserId && profile && currentUserId === profile.user.id;

    if (loading) {
        return (
            <Box bg={bgColor} minH="100vh" py={8}>
                <Center h="400px">
                    <VStack spacing={4}>
                        <Spinner size="xl" color="blue.500" />
                        <Text color="gray.500">프로필을 불러오는 중...</Text>
                    </VStack>
                </Center>
            </Box>
        );
    }

    if (!profile) {
        return (
            <Box bg={bgColor} minH="100vh" py={8}>
                <Center h="400px">
                    <VStack spacing={4}>
                        <Heading size="md">프로필을 찾을 수 없습니다</Heading>
                        <Button onClick={() => navigate(-1)}>뒤로 가기</Button>
                    </VStack>
                </Center>
            </Box>
        );
    }

    return (
        <Box bg={bgColor} minH="100vh">
            {/* 배너 */}
            <Box
                h="200px"
                bgGradient={
                    profile.user.banner_image
                        ? `url(${profile.user.banner_image})`
                        : 'linear(to-r, blue.400, purple.500)'
                }
                bgSize="cover"
                bgPosition="center"
            />

            <Container maxW="container.xl" mt="-100px" position="relative">
                <VStack spacing={6} align="stretch">
                    {/* 프로필 헤더 */}
                    <Box
                        bg={cardBgColor}
                        borderWidth="1px"
                        borderColor={borderColor}
                        borderRadius="lg"
                        boxShadow="lg"
                        p={6}
                    >
                        <HStack spacing={6} align="start">
                            <Avatar
                                size="2xl"
                                src={profile.user.avatar_url}
                                name={profile.user.display_name || profile.user.username}
                                borderWidth="4px"
                                borderColor={cardBgColor}
                            />
                            <VStack align="start" flex={1} spacing={2}>
                                <HStack>
                                    <Heading size="lg">
                                        {profile.user.display_name || profile.user.username}
                                    </Heading>
                                    <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
                                        Lv. {profile.statistics.level}
                                    </Badge>
                                </HStack>
                                <Text color="gray.500">@{profile.user.username}</Text>
                                {profile.user.bio && (
                                    <Text color="gray.600" maxW="600px">
                                        {profile.user.bio}
                                    </Text>
                                )}
                                <HStack spacing={4} flexWrap="wrap">
                                    {profile.user.location && profile.user.show_location && (
                                        <HStack fontSize="sm" color="gray.600">
                                            <Icon as={FiMapPin} />
                                            <Text>{profile.user.location}</Text>
                                        </HStack>
                                    )}
                                    {profile.user.website && (
                                        <Link href={profile.user.website} isExternal>
                                            <HStack fontSize="sm" color={accentColor}>
                                                <Icon as={FiGlobe} />
                                                <Text>웹사이트</Text>
                                            </HStack>
                                        </Link>
                                    )}
                                    {profile.user.github_url && (
                                        <Link href={profile.user.github_url} isExternal>
                                            <HStack fontSize="sm" color={accentColor}>
                                                <Icon as={FiGithub} />
                                                <Text>GitHub</Text>
                                            </HStack>
                                        </Link>
                                    )}
                                    <HStack fontSize="sm" color="gray.600">
                                        <Icon as={FiCalendar} />
                                        <Text>가입일: {formatDate(profile.user.created_at)}</Text>
                                    </HStack>
                                </HStack>
                                {followStats && (
                                    <HStack spacing={6} pt={2}>
                                        <HStack spacing={1} cursor="pointer" _hover={{ textDecoration: 'underline' }}>
                                            <Text fontWeight="bold">{followStats.followers_count}</Text>
                                            <Text color="gray.600">팔로워</Text>
                                        </HStack>
                                        <HStack spacing={1} cursor="pointer" _hover={{ textDecoration: 'underline' }}>
                                            <Text fontWeight="bold">{followStats.following_count}</Text>
                                            <Text color="gray.600">팔로잉</Text>
                                        </HStack>
                                    </HStack>
                                )}
                            </VStack>
                            <VStack spacing={2}>
                                {isOwner ? (
                                    <Button
                                        leftIcon={<FiSettings />}
                                        colorScheme="gray"
                                        variant="outline"
                                        onClick={() => navigate(`/profile/${userId}/edit`)}
                                    >
                                        프로필 수정
                                    </Button>
                                ) : (
                                    <Button
                                        colorScheme={isFollowing ? 'gray' : 'blue'}
                                        variant={isFollowing ? 'outline' : 'solid'}
                                        onClick={handleFollow}
                                    >
                                        {isFollowing ? '팔로잉' : '팔로우'}
                                    </Button>
                                )}
                            </VStack>
                        </HStack>
                    </Box>

                    {/* 탭 메뉴 */}
                    <Tabs colorScheme="blue">
                        <TabList>
                            <Tab>활동 대시보드</Tab>
                            <Tab>팔로우</Tab>
                            <Tab>배지</Tab>
                            <Tab>업적</Tab>
                        </TabList>

                        <TabPanels>
                            {/* 활동 대시보드 탭 */}
                            <TabPanel>
                                <ActivityDashboard
                                    userId={profile.user.id}
                                    statistics={profile.statistics}
                                />
                            </TabPanel>

                            {/* 팔로우 탭 */}
                            <TabPanel>
                                <FollowList userId={profile.user.id} />
                            </TabPanel>

                            {/* 배지 탭 */}
                            <TabPanel>
                                <Box
                                    bg={cardBgColor}
                                    borderWidth="1px"
                                    borderColor={borderColor}
                                    borderRadius="lg"
                                    p={6}
                                >
                                    {profile.badges && profile.badges.length > 0 ? (
                                        <BadgeDisplay badges={profile.badges} />
                                    ) : (
                                        <Center py={10}>
                                            <Text color="gray.500">획득한 배지가 없습니다</Text>
                                        </Center>
                                    )}
                                </Box>
                            </TabPanel>

                            {/* 업적 탭 */}
                            <TabPanel>
                                <Box
                                    bg={cardBgColor}
                                    borderWidth="1px"
                                    borderColor={borderColor}
                                    borderRadius="lg"
                                    p={6}
                                >
                                    {profile.achievements && profile.achievements.length > 0 ? (
                                        <VStack align="stretch" spacing={4}>
                                            {profile.achievements.map((achievement: any, index: number) => (
                                                <Box
                                                    key={index}
                                                    p={4}
                                                    borderWidth="1px"
                                                    borderColor={borderColor}
                                                    borderRadius="md"
                                                >
                                                    <HStack justify="space-between">
                                                        <VStack align="start">
                                                            <Text fontWeight="bold">{achievement.title}</Text>
                                                            <Text fontSize="sm" color="gray.600">
                                                                {achievement.description}
                                                            </Text>
                                                        </VStack>
                                                        <Badge colorScheme="green">
                                                            {formatDate(achievement.unlocked_at)}
                                                        </Badge>
                                                    </HStack>
                                                </Box>
                                            ))}
                                        </VStack>
                                    ) : (
                                        <Center py={10}>
                                            <Text color="gray.500">달성한 업적이 없습니다</Text>
                                        </Center>
                                    )}
                                </Box>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </VStack>
            </Container>
        </Box>
    );
};

export default ProfileV2Page;
