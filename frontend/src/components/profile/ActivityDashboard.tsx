/**
 * 활동 통계 대시보드 컴포넌트
 * 사용자의 활동 데이터를 시각적으로 표시
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
    Text,
    Grid,
    GridItem,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    Progress,
    Badge,
    Divider,
    useColorModeValue,
    Icon,
    Tooltip
} from '@chakra-ui/react';
import {
    FiTrendingUp,
    FiActivity,
    FiAward,
    FiEye,
    FiThumbsUp,
    FiMessageSquare,
    FiEdit,
    FiCalendar
} from 'react-icons/fi';
import { apiClient } from '../../utils/apiClient';

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

interface ActivityDashboardProps {
    userId: number;
    statistics: Statistics;
}

const ActivityDashboard: React.FC<ActivityDashboardProps> = ({ userId, statistics }) => {
    const [activityLog, setActivityLog] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const accentColor = useColorModeValue('blue.500', 'blue.300');

    useEffect(() => {
        fetchActivityLog();
    }, [userId]);

    const fetchActivityLog = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/api/users/${userId}/activity-log`, {
                params: { days: 30 }
            });
            if (response.data) {
                setActivityLog(response.data);
            }
        } catch (error) {
            console.error('활동 로그 조회 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    // 다음 레벨까지 필요한 경험치 계산 (간단한 공식)
    const getExpForNextLevel = (level: number) => {
        return level * 100; // 레벨당 100 EXP
    };

    const currentLevelExp = getExpForNextLevel(statistics.level - 1);
    const nextLevelExp = getExpForNextLevel(statistics.level);
    const expProgress = ((statistics.experience_points - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;

    const StatCard = ({ icon, label, value, helpText, color }: any) => (
        <Box
            p={4}
            bg={bgColor}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            boxShadow="sm"
        >
            <Stat>
                <HStack justify="space-between" mb={2}>
                    <StatLabel fontSize="sm" color="gray.600">
                        {label}
                    </StatLabel>
                    <Icon as={icon} color={color} boxSize={5} />
                </HStack>
                <StatNumber fontSize="2xl" fontWeight="bold">
                    {value.toLocaleString()}
                </StatNumber>
                {helpText && (
                    <StatHelpText fontSize="xs">
                        {helpText}
                    </StatHelpText>
                )}
            </Stat>
        </Box>
    );

    return (
        <VStack spacing={6} align="stretch">
            {/* 레벨 및 경험치 */}
            <Box
                p={6}
                bg={bgColor}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                boxShadow="md"
            >
                <VStack spacing={4}>
                    <HStack justify="space-between" width="100%">
                        <VStack align="start" spacing={0}>
                            <Text fontSize="sm" color="gray.600">현재 레벨</Text>
                            <HStack>
                                <Badge colorScheme="blue" fontSize="2xl" px={4} py={2}>
                                    Level {statistics.level}
                                </Badge>
                                <Text fontSize="lg" fontWeight="bold" color={accentColor}>
                                    {statistics.reputation_score} 평판
                                </Text>
                            </HStack>
                        </VStack>
                        <VStack align="end" spacing={0}>
                            <Text fontSize="sm" color="gray.600">다음 레벨까지</Text>
                            <Text fontSize="lg" fontWeight="bold">
                                {(nextLevelExp - statistics.experience_points).toLocaleString()} EXP
                            </Text>
                        </VStack>
                    </HStack>
                    <Box width="100%">
                        <HStack justify="space-between" mb={2}>
                            <Text fontSize="xs" color="gray.500">
                                {statistics.experience_points.toLocaleString()} / {nextLevelExp.toLocaleString()} EXP
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                                {expProgress.toFixed(1)}%
                            </Text>
                        </HStack>
                        <Progress
                            value={expProgress}
                            colorScheme="blue"
                            size="lg"
                            borderRadius="full"
                        />
                    </Box>
                </VStack>
            </Box>

            {/* 통계 그리드 */}
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
                <StatCard
                    icon={FiEdit}
                    label="작성한 게시물"
                    value={statistics.total_posts}
                    helpText="총 게시물 수"
                    color="blue.500"
                />
                <StatCard
                    icon={FiEye}
                    label="총 조회수"
                    value={statistics.total_views}
                    helpText="내 게시물 조회수"
                    color="green.500"
                />
                <StatCard
                    icon={FiThumbsUp}
                    label="받은 좋아요"
                    value={statistics.total_likes_received}
                    helpText="내 게시물에 받은 좋아요"
                    color="red.500"
                />
                <StatCard
                    icon={FiMessageSquare}
                    label="받은 댓글"
                    value={statistics.total_comments_received}
                    helpText="내 게시물에 받은 댓글"
                    color="purple.500"
                />
            </Grid>

            {/* 활동 및 업적 */}
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                <Box
                    p={4}
                    bg={bgColor}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="lg"
                >
                    <HStack justify="space-between" mb={4}>
                        <Text fontSize="lg" fontWeight="bold">활동 스트릭</Text>
                        <Icon as={FiActivity} color="orange.500" boxSize={5} />
                    </HStack>
                    <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.600">현재 연속 활동</Text>
                            <Badge colorScheme="orange" fontSize="md">
                                {statistics.current_streak}일
                            </Badge>
                        </HStack>
                        <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.600">최장 연속 기록</Text>
                            <Badge colorScheme="green" fontSize="md">
                                {statistics.longest_streak}일
                            </Badge>
                        </HStack>
                        <Divider />
                        <HStack justify="space-between">
                            <Text fontSize="xs" color="gray.500">마지막 활동</Text>
                            <Text fontSize="xs" color="gray.600">
                                {new Date(statistics.last_activity_date).toLocaleDateString('ko-KR')}
                            </Text>
                        </HStack>
                    </VStack>
                </Box>

                <Box
                    p={4}
                    bg={bgColor}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="lg"
                >
                    <HStack justify="space-between" mb={4}>
                        <Text fontSize="lg" fontWeight="bold">업적</Text>
                        <Icon as={FiAward} color="yellow.500" boxSize={5} />
                    </HStack>
                    <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.600">획득한 배지</Text>
                            <Badge colorScheme="yellow" fontSize="md">
                                {statistics.total_badges}개
                            </Badge>
                        </HStack>
                        <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.600">달성한 업적</Text>
                            <Badge colorScheme="purple" fontSize="md">
                                {statistics.total_achievements}개
                            </Badge>
                        </HStack>
                        <Divider />
                        <HStack justify="space-between">
                            <Text fontSize="xs" color="gray.500">참여도</Text>
                            <Text fontSize="xs" fontWeight="bold" color={accentColor}>
                                {statistics.total_comments + statistics.total_likes_given > 0 ? '활발함' : '보통'}
                            </Text>
                        </HStack>
                    </VStack>
                </Box>
            </Grid>

            {/* 상세 활동 분석 */}
            <Box
                p={6}
                bg={bgColor}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
            >
                <Text fontSize="lg" fontWeight="bold" mb={4}>활동 분석</Text>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
                    <VStack align="start">
                        <Text fontSize="sm" color="gray.600">작성한 댓글</Text>
                        <Text fontSize="2xl" fontWeight="bold">
                            {statistics.total_comments.toLocaleString()}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                            다른 게시물에 남긴 댓글
                        </Text>
                    </VStack>
                    <VStack align="start">
                        <Text fontSize="sm" color="gray.600">준 좋아요</Text>
                        <Text fontSize="2xl" fontWeight="bold">
                            {statistics.total_likes_given.toLocaleString()}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                            다른 게시물에 누른 좋아요
                        </Text>
                    </VStack>
                    <VStack align="start">
                        <Text fontSize="sm" color="gray.600">평균 인기도</Text>
                        <Text fontSize="2xl" fontWeight="bold">
                            {statistics.total_posts > 0
                                ? ((statistics.total_likes_received + statistics.total_comments_received) / statistics.total_posts).toFixed(1)
                                : '0'}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                            게시물당 평균 반응
                        </Text>
                    </VStack>
                </Grid>
            </Box>
        </VStack>
    );
};

export default ActivityDashboard;
