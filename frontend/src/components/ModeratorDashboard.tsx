import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Badge,
    Button,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    useColorModeValue,
    Grid,
    GridItem,
    Icon,
    Spinner,
    Alert,
    AlertIcon
} from '@chakra-ui/react';
import {
    FiShield,
    FiAlertTriangle,
    FiUserX,
    FiFileText,
    FiActivity
} from 'react-icons/fi';
import { apiClient } from '../utils/apiClient';
import ContentReportList from './ContentReportList';
import ModeratorActionLog from './ModeratorActionLog';

interface ModeratorStats {
    active_posts: number;
    deleted_posts: number;
    active_comments: number;
    deleted_comments: number;
    banned_users: number;
    restricted_users: number;
    pending_reports: number;
    actions_today: number;
}

interface PendingReportSummary {
    status: string;
    priority: string;
    content_type: string;
    count: number;
}

const ModeratorDashboard: React.FC = () => {
    const [stats, setStats] = useState<ModeratorStats | null>(null);
    const [reportSummary, setReportSummary] = useState<PendingReportSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    useEffect(() => {
        loadDashboardData();

        // 30초마다 자동 새로고침
        const interval = setInterval(loadDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            // 기존 통계 로드
            const statsResponse = await apiClient.get('/api/moderator/stats');
            if (statsResponse.data.success) {
                setStats(statsResponse.data.stats);
            }

            // 새 시스템 신고 요약 로드
            try {
                const summaryResponse = await apiClient.get('/api/moderator/reports-v2/pending/summary');
                if (summaryResponse.data.success) {
                    setReportSummary(summaryResponse.data.summary);
                }
            } catch (err) {
                console.error('신고 요약 로드 실패:', err);
            }

        } catch (err) {
            console.error('대시보드 데이터 로드 실패:', err);
            setError('대시보드 데이터를 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'red';
            case 'high': return 'orange';
            case 'normal': return 'blue';
            case 'low': return 'gray';
            default: return 'gray';
        }
    };

    if (loading && !stats) {
        return (
            <Box textAlign="center" py={10}>
                <Spinner size="xl" />
                <Text mt={4}>대시보드 로딩 중...</Text>
            </Box>
        );
    }

    return (
        <Box maxW="1400px" mx="auto" p={6}>
            <VStack spacing={6} align="stretch">
                {/* 헤더 */}
                <HStack justify="space-between">
                    <HStack>
                        <Icon as={FiShield} boxSize={8} color="blue.500" />
                        <Text fontSize="2xl" fontWeight="bold">
                            모더레이터 대시보드
                        </Text>
                    </HStack>
                    <Button onClick={loadDashboardData} size="sm" isLoading={loading}>
                        새로고침
                    </Button>
                </HStack>

                {error && (
                    <Alert status="error">
                        <AlertIcon />
                        {error}
                    </Alert>
                )}

                {/* 통계 카드 */}
                {stats && (
                    <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                        <GridItem>
                            <Box
                                p={5}
                                bg={bgColor}
                                borderRadius="lg"
                                borderWidth="1px"
                                borderColor={borderColor}
                            >
                                <Stat>
                                    <StatLabel>
                                        <HStack>
                                            <Icon as={FiAlertTriangle} />
                                            <Text>미처리 신고</Text>
                                        </HStack>
                                    </StatLabel>
                                    <StatNumber>{stats.pending_reports}</StatNumber>
                                    <StatHelpText>대기 중인 신고</StatHelpText>
                                </Stat>
                            </Box>
                        </GridItem>

                        <GridItem>
                            <Box
                                p={5}
                                bg={bgColor}
                                borderRadius="lg"
                                borderWidth="1px"
                                borderColor={borderColor}
                            >
                                <Stat>
                                    <StatLabel>
                                        <HStack>
                                            <Icon as={FiUserX} />
                                            <Text>차단된 사용자</Text>
                                        </HStack>
                                    </StatLabel>
                                    <StatNumber>{stats.banned_users}</StatNumber>
                                    <StatHelpText>전체 차단 계정</StatHelpText>
                                </Stat>
                            </Box>
                        </GridItem>

                        <GridItem>
                            <Box
                                p={5}
                                bg={bgColor}
                                borderRadius="lg"
                                borderWidth="1px"
                                borderColor={borderColor}
                            >
                                <Stat>
                                    <StatLabel>
                                        <HStack>
                                            <Icon as={FiFileText} />
                                            <Text>활성 게시물</Text>
                                        </HStack>
                                    </StatLabel>
                                    <StatNumber>{stats.active_posts}</StatNumber>
                                    <StatHelpText>삭제됨: {stats.deleted_posts}</StatHelpText>
                                </Stat>
                            </Box>
                        </GridItem>

                        <GridItem>
                            <Box
                                p={5}
                                bg={bgColor}
                                borderRadius="lg"
                                borderWidth="1px"
                                borderColor={borderColor}
                            >
                                <Stat>
                                    <StatLabel>
                                        <HStack>
                                            <Icon as={FiActivity} />
                                            <Text>오늘의 활동</Text>
                                        </HStack>
                                    </StatLabel>
                                    <StatNumber>{stats.actions_today}</StatNumber>
                                    <StatHelpText>모더레이션 작업</StatHelpText>
                                </Stat>
                            </Box>
                        </GridItem>
                    </Grid>
                )}

                {/* 신고 요약 */}
                {reportSummary.length > 0 && (
                    <Box
                        p={5}
                        bg={bgColor}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor={borderColor}
                    >
                        <Text fontSize="lg" fontWeight="bold" mb={3}>
                            신고 현황
                        </Text>
                        <HStack spacing={2} flexWrap="wrap">
                            {reportSummary.map((item, index) => (
                                <Badge
                                    key={index}
                                    colorScheme={getPriorityColor(item.priority)}
                                    fontSize="sm"
                                    p={2}
                                >
                                    {item.content_type} • {item.priority} • {item.count}건
                                </Badge>
                            ))}
                        </HStack>
                    </Box>
                )}

                {/* 탭 메뉴 */}
                <Tabs>
                    <TabList>
                        <Tab>신고 관리</Tab>
                        <Tab>활동 로그</Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel>
                            <ContentReportList />
                        </TabPanel>
                        <TabPanel>
                            <ModeratorActionLog />
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </VStack>
        </Box>
    );
};

export default ModeratorDashboard;
