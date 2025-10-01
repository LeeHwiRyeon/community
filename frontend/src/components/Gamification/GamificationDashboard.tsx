import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Card,
    CardBody,
    CardHeader,
    SimpleGrid,
    Progress,
    Badge,
    Avatar,
    Divider,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    useToast,
    Spinner,
    Alert,
    AlertIcon,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    List,
    ListItem,
    ListIcon,
    OrderedList,
    UnorderedList,
    Wrap,
    WrapItem,
    Tooltip,
    IconButton,
    Flex,
    Spacer,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    Image,
    Circle,
    useColorModeValue
} from '@chakra-ui/react';
import {
    StarIcon,
    TrophyIcon,
    MedalIcon,
    GiftIcon,
    FireIcon,
    TimeIcon,
    CheckIcon,
    CloseIcon,
    SettingsIcon,
    RefreshIcon,
    DownloadIcon,
    ViewIcon,
    HeartIcon,
    ChatIcon,
    ShareIcon,
    AddIcon,
    MinusIcon
} from '@chakra-ui/icons';

interface UserProfile {
    userId: string;
    level: number;
    levelName: string;
    experience: number;
    points: number;
    badges: string[];
    achievements: string[];
    rewards: string[];
    quests: string[];
    streaks: Record<string, { count: number; lastDate: string }>;
    statistics: {
        posts: number;
        comments: number;
        likes: number;
        followers: number;
        following: number;
        loginDays: number;
        totalPoints: number;
    };
    progress: {
        currentLevel: {
            name: string;
            minExp: number;
            maxExp: number;
            progress: number;
        };
        nextLevel: {
            name: string;
            minExp: number;
            requiredExp: number;
        } | null;
    };
}

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    points: number;
    category: string;
    rarity: string;
}

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
}

interface Reward {
    id: string;
    name: string;
    description: string;
    cost: number;
    type: string;
    category: string;
}

interface Quest {
    id: string;
    name: string;
    description: string;
    type: string;
    points: number;
    completed: boolean;
    progress: number;
}

interface LeaderboardEntry {
    rank: number;
    userId: string;
    level: number;
    points: number;
    experience: number;
    statistics: any;
}

const GamificationDashboard: React.FC = () => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [quests, setQuests] = useState<Quest[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState(0);

    const { isOpen: isRewardOpen, onOpen: onRewardOpen, onClose: onRewardClose } = useDisclosure();
    const { isOpen: isAchievementOpen, onOpen: onAchievementOpen, onClose: onAchievementClose } = useDisclosure();
    const { isOpen: isLeaderboardOpen, onOpen: onLeaderboardOpen, onClose: onLeaderboardClose } = useDisclosure();

    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // 데이터 로드
    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const userId = 'current_user'; // 실제로는 인증된 사용자 ID

            // 사용자 프로필 로드
            const profileResponse = await fetch(`/api/gamification/profile/${userId}`);
            const profileData = await profileResponse.json();
            if (profileData.success) {
                setUserProfile(profileData.data);
            }

            // 업적 로드
            const achievementsResponse = await fetch('/api/gamification/achievements');
            const achievementsData = await achievementsResponse.json();
            if (achievementsData.success) {
                setAchievements(achievementsData.data);
            }

            // 배지 로드
            const badgesResponse = await fetch('/api/gamification/badges');
            const badgesData = await badgesResponse.json();
            if (badgesData.success) {
                setBadges(badgesData.data);
            }

            // 리워드 로드
            const rewardsResponse = await fetch('/api/gamification/rewards');
            const rewardsData = await rewardsResponse.json();
            if (rewardsData.success) {
                setRewards(rewardsData.data);
            }

            // 퀘스트 로드
            const questsResponse = await fetch(`/api/gamification/daily-quests/${userId}`);
            const questsData = await questsResponse.json();
            if (questsData.success) {
                setQuests(questsData.data);
            }

            // 리더보드 로드
            const leaderboardResponse = await fetch('/api/gamification/leaderboard?limit=10');
            const leaderboardData = await leaderboardResponse.json();
            if (leaderboardData.success) {
                setLeaderboard(leaderboardData.data.leaderboard);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('데이터를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 리워드 구매
    const purchaseReward = async (rewardId: string) => {
        try {
            const response = await fetch('/api/gamification/purchase-reward', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: 'current_user',
                    rewardId
                })
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: '리워드 구매 완료',
                    description: data.data.name + '을(를) 구매했습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                fetchData(); // 데이터 새로고침
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error purchasing reward:', error);
            toast({
                title: '구매 실패',
                description: error.message || '리워드 구매 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        fetchData();
    }, []);

    // 레벨 진행률 계산
    const getLevelProgress = () => {
        if (!userProfile) return 0;
        return userProfile.progress.currentLevel.progress;
    };

    // 다음 레벨까지 필요한 경험치
    const getRequiredExp = () => {
        if (!userProfile || !userProfile.progress.nextLevel) return 0;
        return userProfile.progress.nextLevel.requiredExp;
    };

    // 획득한 업적 필터링
    const getEarnedAchievements = () => {
        if (!userProfile) return [];
        return achievements.filter(achievement =>
            userProfile.achievements.includes(achievement.id)
        );
    };

    // 획득한 배지 필터링
    const getEarnedBadges = () => {
        if (!userProfile) return [];
        return badges.filter(badge =>
            userProfile.badges.includes(badge.id)
        );
    };

    // 구매 가능한 리워드 필터링
    const getAvailableRewards = () => {
        if (!userProfile) return [];
        return rewards.filter(reward =>
            !userProfile.rewards.includes(reward.id) &&
            userProfile.points >= reward.cost
        );
    };

    // 완료된 퀘스트 필터링
    const getCompletedQuests = () => {
        return quests.filter(quest => quest.completed);
    };

    // 진행 중인 퀘스트 필터링
    const getActiveQuests = () => {
        return quests.filter(quest => !quest.completed);
    };

    if (isLoading && !userProfile) {
        return (
            <Box p={8} textAlign="center">
                <Spinner size="xl" />
                <Text mt={4}>게임화 데이터를 불러오는 중...</Text>
            </Box>
        );
    }

    return (
        <Box p={6}>
            {/* Header */}
            <VStack spacing={4} align="stretch" mb={8}>
                <HStack justify="space-between">
                    <Text fontSize="3xl" fontWeight="bold" color="purple.600">
                        🎮 게임화 대시보드
                    </Text>
                    <HStack spacing={2}>
                        <Button leftIcon={<RefreshIcon />} colorScheme="purple" variant="outline" onClick={fetchData}>
                            새로고침
                        </Button>
                        <Button leftIcon={<SettingsIcon />} colorScheme="purple" variant="outline">
                            설정
                        </Button>
                    </HStack>
                </HStack>

                {/* 사용자 프로필 카드 */}
                {userProfile && (
                    <Card bg={bgColor} borderColor={borderColor}>
                        <CardBody>
                            <HStack spacing={6}>
                                <Avatar
                                    size="xl"
                                    name={userProfile.userId}
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.userId}`}
                                />
                                <VStack align="start" spacing={2} flex="1">
                                    <HStack spacing={4}>
                                        <Text fontSize="2xl" fontWeight="bold">
                                            {userProfile.userId}
                                        </Text>
                                        <Badge colorScheme="purple" size="lg">
                                            Level {userProfile.level}
                                        </Badge>
                                        <Badge colorScheme="blue" size="lg">
                                            {userProfile.levelName}
                                        </Badge>
                                    </HStack>

                                    <HStack spacing={6} color="gray.600">
                                        <HStack spacing={1}>
                                            <StarIcon color="yellow.400" />
                                            <Text fontWeight="bold">{userProfile.points.toLocaleString()}</Text>
                                            <Text>포인트</Text>
                                        </HStack>
                                        <HStack spacing={1}>
                                            <TrophyIcon color="orange.400" />
                                            <Text fontWeight="bold">{userProfile.experience.toLocaleString()}</Text>
                                            <Text>경험치</Text>
                                        </HStack>
                                        <HStack spacing={1}>
                                            <MedalIcon color="green.400" />
                                            <Text fontWeight="bold">{userProfile.achievements.length}</Text>
                                            <Text>업적</Text>
                                        </HStack>
                                    </HStack>

                                    {/* 레벨 진행률 */}
                                    <Box w="100%">
                                        <HStack justify="space-between" mb={2}>
                                            <Text fontSize="sm" color="gray.600">
                                                다음 레벨까지
                                            </Text>
                                            <Text fontSize="sm" color="gray.600">
                                                {getRequiredExp()} EXP
                                            </Text>
                                        </HStack>
                                        <Progress
                                            value={getLevelProgress()}
                                            colorScheme="purple"
                                            size="lg"
                                            borderRadius="md"
                                        />
                                    </Box>
                                </VStack>
                            </HStack>
                        </CardBody>
                    </Card>
                )}
            </VStack>

            {/* Error Alert */}
            {error && (
                <Alert status="error" mb={4}>
                    <AlertIcon />
                    {error}
                </Alert>
            )}

            {/* 통계 카드 */}
            {userProfile && (
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
                    <Card>
                        <CardBody textAlign="center">
                            <Stat>
                                <StatLabel>게시물</StatLabel>
                                <StatNumber color="blue.500">{userProfile.statistics.posts}</StatNumber>
                            </Stat>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody textAlign="center">
                            <Stat>
                                <StatLabel>댓글</StatLabel>
                                <StatNumber color="green.500">{userProfile.statistics.comments}</StatNumber>
                            </Stat>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody textAlign="center">
                            <Stat>
                                <StatLabel>팔로워</StatLabel>
                                <StatNumber color="purple.500">{userProfile.statistics.followers}</StatNumber>
                            </Stat>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody textAlign="center">
                            <Stat>
                                <StatLabel>연속 로그인</StatLabel>
                                <StatNumber color="orange.500">
                                    {userProfile.streaks.login?.count || 0}일
                                </StatNumber>
                            </Stat>
                        </CardBody>
                    </Card>
                </SimpleGrid>
            )}

            {/* 탭 네비게이션 */}
            <Tabs index={selectedTab} onChange={setSelectedTab}>
                <TabList>
                    <Tab>퀘스트</Tab>
                    <Tab>업적</Tab>
                    <Tab>배지</Tab>
                    <Tab>리워드</Tab>
                    <Tab>리더보드</Tab>
                </TabList>

                <TabPanels>
                    {/* 퀘스트 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            {/* 일일 퀘스트 */}
                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">일일 퀘스트</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        {getActiveQuests().map(quest => (
                                            <Box key={quest.id} p={4} bg="gray.50" borderRadius="md">
                                                <HStack justify="space-between" mb={2}>
                                                    <Text fontWeight="bold">{quest.name}</Text>
                                                    <Badge colorScheme="blue">{quest.points}점</Badge>
                                                </HStack>
                                                <Text fontSize="sm" color="gray.600" mb={2}>
                                                    {quest.description}
                                                </Text>
                                                <Progress
                                                    value={quest.progress}
                                                    colorScheme="blue"
                                                    size="sm"
                                                />
                                            </Box>
                                        ))}
                                        {getActiveQuests().length === 0 && (
                                            <Text color="gray.500" textAlign="center">
                                                진행 중인 퀘스트가 없습니다.
                                            </Text>
                                        )}
                                    </VStack>
                                </CardBody>
                            </Card>

                            {/* 완료된 퀘스트 */}
                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">완료된 퀘스트</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={4} align="stretch">
                                        {getCompletedQuests().map(quest => (
                                            <Box key={quest.id} p={4} bg="green.50" borderRadius="md">
                                                <HStack justify="space-between" mb={2}>
                                                    <HStack>
                                                        <CheckIcon color="green.500" />
                                                        <Text fontWeight="bold">{quest.name}</Text>
                                                    </HStack>
                                                    <Badge colorScheme="green">{quest.points}점</Badge>
                                                </HStack>
                                                <Text fontSize="sm" color="gray.600">
                                                    {quest.description}
                                                </Text>
                                            </Box>
                                        ))}
                                        {getCompletedQuests().length === 0 && (
                                            <Text color="gray.500" textAlign="center">
                                                완료된 퀘스트가 없습니다.
                                            </Text>
                                        )}
                                    </VStack>
                                </CardBody>
                            </Card>
                        </SimpleGrid>
                    </TabPanel>

                    {/* 업적 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                            {achievements.map(achievement => {
                                const isEarned = userProfile?.achievements.includes(achievement.id) || false;
                                return (
                                    <Card
                                        key={achievement.id}
                                        opacity={isEarned ? 1 : 0.6}
                                        cursor="pointer"
                                        onClick={() => {
                                            setSelectedAchievement(achievement);
                                            onAchievementOpen();
                                        }}
                                        _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                                        transition="all 0.2s"
                                    >
                                        <CardBody textAlign="center">
                                            <Text fontSize="4xl" mb={2}>
                                                {achievement.icon}
                                            </Text>
                                            <Text fontWeight="bold" mb={1}>
                                                {achievement.name}
                                            </Text>
                                            <Text fontSize="sm" color="gray.600" mb={2}>
                                                {achievement.description}
                                            </Text>
                                            <HStack justify="center" spacing={2}>
                                                <Badge colorScheme="purple" size="sm">
                                                    {achievement.points}점
                                                </Badge>
                                                <Badge
                                                    colorScheme={
                                                        achievement.rarity === 'common' ? 'gray' :
                                                            achievement.rarity === 'uncommon' ? 'green' :
                                                                achievement.rarity === 'rare' ? 'blue' :
                                                                    achievement.rarity === 'epic' ? 'purple' : 'red'
                                                    }
                                                    size="sm"
                                                >
                                                    {achievement.rarity}
                                                </Badge>
                                            </HStack>
                                            {isEarned && (
                                                <CheckIcon color="green.500" mt={2} />
                                            )}
                                        </CardBody>
                                    </Card>
                                );
                            })}
                        </SimpleGrid>
                    </TabPanel>

                    {/* 배지 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                            {badges.map(badge => {
                                const isEarned = userProfile?.badges.includes(badge.id) || false;
                                return (
                                    <Card
                                        key={badge.id}
                                        opacity={isEarned ? 1 : 0.6}
                                        cursor="pointer"
                                        _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                                        transition="all 0.2s"
                                    >
                                        <CardBody textAlign="center">
                                            <Circle
                                                size="60px"
                                                bg={isEarned ? badge.color : 'gray.200'}
                                                mb={3}
                                            >
                                                <Text fontSize="2xl">{badge.icon}</Text>
                                            </Circle>
                                            <Text fontWeight="bold" mb={1}>
                                                {badge.name}
                                            </Text>
                                            <Text fontSize="sm" color="gray.600">
                                                {badge.description}
                                            </Text>
                                            {isEarned && (
                                                <CheckIcon color="green.500" mt={2} />
                                            )}
                                        </CardBody>
                                    </Card>
                                );
                            })}
                        </SimpleGrid>
                    </TabPanel>

                    {/* 리워드 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                            {rewards.map(reward => {
                                const isPurchased = userProfile?.rewards.includes(reward.id) || false;
                                const canPurchase = userProfile && userProfile.points >= reward.cost && !isPurchased;

                                return (
                                    <Card
                                        key={reward.id}
                                        opacity={isPurchased ? 0.6 : 1}
                                        cursor={canPurchase ? 'pointer' : 'default'}
                                        onClick={() => {
                                            if (canPurchase) {
                                                setSelectedReward(reward);
                                                onRewardOpen();
                                            }
                                        }}
                                        _hover={canPurchase ? { shadow: 'md', transform: 'translateY(-2px)' } : {}}
                                        transition="all 0.2s"
                                    >
                                        <CardBody>
                                            <VStack spacing={3}>
                                                <Text fontSize="3xl">{reward.icon || '🎁'}</Text>
                                                <Text fontWeight="bold" textAlign="center">
                                                    {reward.name}
                                                </Text>
                                                <Text fontSize="sm" color="gray.600" textAlign="center">
                                                    {reward.description}
                                                </Text>
                                                <HStack justify="space-between" w="100%">
                                                    <Badge colorScheme="purple">
                                                        {reward.cost}점
                                                    </Badge>
                                                    <Badge colorScheme="blue" size="sm">
                                                        {reward.category}
                                                    </Badge>
                                                </HStack>
                                                {isPurchased ? (
                                                    <Badge colorScheme="green" size="sm">
                                                        구매 완료
                                                    </Badge>
                                                ) : canPurchase ? (
                                                    <Button
                                                        size="sm"
                                                        colorScheme="purple"
                                                        leftIcon={<GiftIcon />}
                                                    >
                                                        구매하기
                                                    </Button>
                                                ) : (
                                                    <Text fontSize="sm" color="gray.500">
                                                        포인트 부족
                                                    </Text>
                                                )}
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                );
                            })}
                        </SimpleGrid>
                    </TabPanel>

                    {/* 리더보드 탭 */}
                    <TabPanel p={0}>
                        <Card>
                            <CardHeader>
                                <HStack justify="space-between">
                                    <Text fontSize="lg" fontWeight="bold">포인트 리더보드</Text>
                                    <Button
                                        size="sm"
                                        colorScheme="purple"
                                        variant="outline"
                                        onClick={onLeaderboardOpen}
                                    >
                                        전체 보기
                                    </Button>
                                </HStack>
                            </CardHeader>
                            <CardBody>
                                <VStack spacing={3} align="stretch">
                                    {leaderboard.map((entry, index) => (
                                        <HStack
                                            key={entry.userId}
                                            p={3}
                                            bg={index < 3 ? 'yellow.50' : 'gray.50'}
                                            borderRadius="md"
                                            justify="space-between"
                                        >
                                            <HStack spacing={3}>
                                                <Text fontWeight="bold" fontSize="lg">
                                                    #{entry.rank}
                                                </Text>
                                                <Avatar
                                                    size="sm"
                                                    name={entry.userId}
                                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.userId}`}
                                                />
                                                <VStack align="start" spacing={0}>
                                                    <Text fontWeight="bold">{entry.userId}</Text>
                                                    <Text fontSize="sm" color="gray.600">
                                                        Level {entry.level}
                                                    </Text>
                                                </VStack>
                                            </HStack>
                                            <HStack spacing={4}>
                                                <VStack spacing={0}>
                                                    <Text fontSize="sm" color="gray.600">포인트</Text>
                                                    <Text fontWeight="bold">{entry.points.toLocaleString()}</Text>
                                                </VStack>
                                                <VStack spacing={0}>
                                                    <Text fontSize="sm" color="gray.600">경험치</Text>
                                                    <Text fontWeight="bold">{entry.experience.toLocaleString()}</Text>
                                                </VStack>
                                            </HStack>
                                        </HStack>
                                    ))}
                                </VStack>
                            </CardBody>
                        </Card>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            {/* 리워드 구매 모달 */}
            <Modal isOpen={isRewardOpen} onClose={onRewardClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>리워드 구매</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedReward && (
                            <VStack spacing={4} align="stretch">
                                <Text fontSize="4xl" textAlign="center">
                                    {selectedReward.icon || '🎁'}
                                </Text>
                                <Text fontSize="xl" fontWeight="bold" textAlign="center">
                                    {selectedReward.name}
                                </Text>
                                <Text textAlign="center" color="gray.600">
                                    {selectedReward.description}
                                </Text>
                                <HStack justify="center" spacing={4}>
                                    <Badge colorScheme="purple" size="lg">
                                        {selectedReward.cost}점
                                    </Badge>
                                    <Badge colorScheme="blue" size="lg">
                                        {selectedReward.category}
                                    </Badge>
                                </HStack>
                                <HStack spacing={2}>
                                    <Button
                                        colorScheme="purple"
                                        flex="1"
                                        onClick={() => {
                                            purchaseReward(selectedReward.id);
                                            onRewardClose();
                                        }}
                                    >
                                        구매하기
                                    </Button>
                                    <Button variant="outline" flex="1" onClick={onRewardClose}>
                                        취소
                                    </Button>
                                </HStack>
                            </VStack>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 업적 상세 모달 */}
            <Modal isOpen={isAchievementOpen} onClose={onAchievementClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>업적 상세</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedAchievement && (
                            <VStack spacing={4} align="stretch">
                                <Text fontSize="6xl" textAlign="center">
                                    {selectedAchievement.icon}
                                </Text>
                                <Text fontSize="2xl" fontWeight="bold" textAlign="center">
                                    {selectedAchievement.name}
                                </Text>
                                <Text textAlign="center" color="gray.600">
                                    {selectedAchievement.description}
                                </Text>
                                <HStack justify="center" spacing={4}>
                                    <Badge colorScheme="purple" size="lg">
                                        {selectedAchievement.points}점
                                    </Badge>
                                    <Badge
                                        colorScheme={
                                            selectedAchievement.rarity === 'common' ? 'gray' :
                                                selectedAchievement.rarity === 'uncommon' ? 'green' :
                                                    selectedAchievement.rarity === 'rare' ? 'blue' :
                                                        selectedAchievement.rarity === 'epic' ? 'purple' : 'red'
                                        }
                                        size="lg"
                                    >
                                        {selectedAchievement.rarity}
                                    </Badge>
                                </HStack>
                                <Button colorScheme="purple" onClick={onAchievementClose}>
                                    닫기
                                </Button>
                            </VStack>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 리더보드 모달 */}
            <Modal isOpen={isLeaderboardOpen} onClose={onLeaderboardClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>전체 리더보드</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={3} align="stretch">
                            {leaderboard.map((entry, index) => (
                                <HStack
                                    key={entry.userId}
                                    p={4}
                                    bg={index < 3 ? 'yellow.50' : 'gray.50'}
                                    borderRadius="md"
                                    justify="space-between"
                                >
                                    <HStack spacing={4}>
                                        <Text fontWeight="bold" fontSize="xl">
                                            #{entry.rank}
                                        </Text>
                                        <Avatar
                                            size="md"
                                            name={entry.userId}
                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.userId}`}
                                        />
                                        <VStack align="start" spacing={1}>
                                            <Text fontWeight="bold" fontSize="lg">{entry.userId}</Text>
                                            <Text fontSize="sm" color="gray.600">
                                                Level {entry.level}
                                            </Text>
                                        </VStack>
                                    </HStack>
                                    <HStack spacing={6}>
                                        <VStack spacing={0}>
                                            <Text fontSize="sm" color="gray.600">포인트</Text>
                                            <Text fontWeight="bold" fontSize="lg">{entry.points.toLocaleString()}</Text>
                                        </VStack>
                                        <VStack spacing={0}>
                                            <Text fontSize="sm" color="gray.600">경험치</Text>
                                            <Text fontWeight="bold" fontSize="lg">{entry.experience.toLocaleString()}</Text>
                                        </VStack>
                                    </HStack>
                                </HStack>
                            ))}
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default GamificationDashboard;
