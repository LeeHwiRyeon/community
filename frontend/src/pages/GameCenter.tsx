import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardBody,
    CardHeader,
    Heading,
    Text,
    Button,
    Badge,
    Image,
    VStack,
    HStack,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Progress,
    IconButton,
    Tooltip
} from '@chakra-ui/react';
import { FaPlay, FaTrophy, FaStar, FaUsers, FaClock, FaGamepad } from 'react-icons/fa';

interface Game {
    id: string;
    name: string;
    description: string;
    category: string;
    difficulty: string;
    maxPlayers: number;
    estimatedTime: number;
    thumbnail: string;
    gameUrl: string;
    isActive: boolean;
    stats: {
        totalPlays: number;
        highScore: number;
        averageScore: number;
        completionRate: number;
    };
}

interface GameSession {
    id: string;
    gameId: string;
    userId: string;
    status: string;
    score: number;
    level: number;
    lives: number;
    startTime: string;
    gameData: any;
}

interface LeaderboardEntry {
    userId: string;
    score: number;
    rank: number;
    createdAt: string;
}

const GameCenter: React.FC = () => {
    const [games, setGames] = useState<Game[]>([]);
    const [leaderboards, setLeaderboards] = useState<Record<string, LeaderboardEntry[]>>({});
    const [stats, setStats] = useState<any>(null);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [activeSession, setActiveSession] = useState<GameSession | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();

    useEffect(() => {
        fetchGames();
        fetchStats();
    }, []);

    const fetchGames = async () => {
        try {
            const response = await fetch('/api/community-games/games');
            const data = await response.json();
            if (data.success) {
                setGames(data.data);
                // 각 게임의 리더보드도 가져오기
                data.data.forEach((game: Game) => {
                    fetchLeaderboard(game.id);
                });
            }
        } catch (error) {
            console.error('게임 목록 조회 오류:', error);
        }
    };

    const fetchLeaderboard = async (gameId: string) => {
        try {
            const response = await fetch(`/api/community-games/leaderboard/${gameId}`);
            const data = await response.json();
            if (data.success) {
                setLeaderboards(prev => ({
                    ...prev,
                    [gameId]: data.data
                }));
            }
        } catch (error) {
            console.error('리더보드 조회 오류:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/community-games/stats');
            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('통계 조회 오류:', error);
        }
    };

    const startGame = async (game: Game) => {
        try {
            const response = await fetch(`/api/community-games/games/${game.id}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                body: JSON.stringify({ playerCount: game.maxPlayers })
            });

            const data = await response.json();
            if (data.success) {
                setActiveSession(data.data);
                setSelectedGame(game);
                onOpen();
            }
        } catch (error) {
            console.error('게임 시작 오류:', error);
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'green';
            case 'medium': return 'yellow';
            case 'hard': return 'red';
            default: return 'gray';
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'arcade': return '🎮';
            case 'puzzle': return '🧩';
            case 'trivia': return '❓';
            case 'action': return '⚡';
            default: return '🎯';
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <Box p={6}>
            <VStack spacing={6} align="stretch">
                {/* 헤더 */}
                <Box textAlign="center">
                    <Heading size="xl" mb={2} color="blue.500">
                        🎮 게임 센터
                    </Heading>
                    <Text color="gray.600">
                        플래시 게임 스타일의 커뮤니티 게임을 즐겨보세요!
                    </Text>
                </Box>

                {/* 통계 카드 */}
                {stats && (
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4}>
                        <Card>
                            <CardBody>
                                <Stat>
                                    <StatLabel>총 게임 수</StatLabel>
                                    <StatNumber>{stats.totalGames}</StatNumber>
                                    <StatHelpText>활성: {stats.activeGames}개</StatHelpText>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody>
                                <Stat>
                                    <StatLabel>총 플레이 수</StatLabel>
                                    <StatNumber>{stats.totalSessions}</StatNumber>
                                    <StatHelpText>완료: {stats.completedSessions}회</StatHelpText>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody>
                                <Stat>
                                    <StatLabel>총 플레이어</StatLabel>
                                    <StatNumber>{stats.totalPlayers}</StatNumber>
                                    <StatHelpText>활성 세션: {stats.activeSessions}개</StatHelpText>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody>
                                <Stat>
                                    <StatLabel>평균 점수</StatLabel>
                                    <StatNumber>{Math.round(stats.averageScore)}</StatNumber>
                                    <StatHelpText>최고 기록</StatHelpText>
                                </Stat>
                            </CardBody>
                        </Card>
                    </Grid>
                )}

                {/* 게임 목록 */}
                <Tabs>
                    <TabList>
                        <Tab>전체 게임</Tab>
                        <Tab>아케이드</Tab>
                        <Tab>퍼즐</Tab>
                        <Tab>퀴즈</Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel>
                            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
                                {games.map((game) => (
                                    <Card key={game.id} maxW="sm" mx="auto">
                                        <CardHeader>
                                            <HStack justify="space-between">
                                                <Heading size="md">{getCategoryIcon(game.category)} {game.name}</Heading>
                                                <Badge colorScheme={getDifficultyColor(game.difficulty)}>
                                                    {game.difficulty}
                                                </Badge>
                                            </HStack>
                                        </CardHeader>
                                        <CardBody>
                                            <VStack align="stretch" spacing={4}>
                                                <Image
                                                    src={game.thumbnail}
                                                    alt={game.name}
                                                    borderRadius="md"
                                                    h="200px"
                                                    objectFit="cover"
                                                    fallbackSrc="https://via.placeholder.com/300x200?text=Game+Thumbnail"
                                                />

                                                <Text fontSize="sm" color="gray.600">
                                                    {game.description}
                                                </Text>

                                                <HStack justify="space-between" fontSize="sm">
                                                    <HStack>
                                                        <FaUsers />
                                                        <Text>{game.maxPlayers}명</Text>
                                                    </HStack>
                                                    <HStack>
                                                        <FaClock />
                                                        <Text>{formatTime(game.estimatedTime)}</Text>
                                                    </HStack>
                                                </HStack>

                                                <VStack spacing={2} align="stretch">
                                                    <HStack justify="space-between">
                                                        <Text fontSize="sm">플레이 수:</Text>
                                                        <Text fontSize="sm" fontWeight="bold">{game.stats.totalPlays}</Text>
                                                    </HStack>
                                                    <HStack justify="space-between">
                                                        <Text fontSize="sm">최고 점수:</Text>
                                                        <Text fontSize="sm" fontWeight="bold">{game.stats.highScore}</Text>
                                                    </HStack>
                                                    <HStack justify="space-between">
                                                        <Text fontSize="sm">완주율:</Text>
                                                        <Text fontSize="sm" fontWeight="bold">
                                                            {Math.round(game.stats.completionRate * 100)}%
                                                        </Text>
                                                    </HStack>
                                                </VStack>

                                                <Button
                                                    colorScheme="blue"
                                                    leftIcon={<FaPlay />}
                                                    onClick={() => startGame(game)}
                                                    isDisabled={!game.isActive}
                                                >
                                                    게임 시작
                                                </Button>
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                ))}
                            </Grid>
                        </TabPanel>

                        {/* 카테고리별 탭들 */}
                        {['arcade', 'puzzle', 'trivia'].map((category) => (
                            <TabPanel key={category}>
                                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
                                    {games
                                        .filter(game => game.category === category)
                                        .map((game) => (
                                            <Card key={game.id} maxW="sm" mx="auto">
                                                <CardHeader>
                                                    <HStack justify="space-between">
                                                        <Heading size="md">{getCategoryIcon(game.category)} {game.name}</Heading>
                                                        <Badge colorScheme={getDifficultyColor(game.difficulty)}>
                                                            {game.difficulty}
                                                        </Badge>
                                                    </HStack>
                                                </CardHeader>
                                                <CardBody>
                                                    <VStack align="stretch" spacing={4}>
                                                        <Image
                                                            src={game.thumbnail}
                                                            alt={game.name}
                                                            borderRadius="md"
                                                            h="200px"
                                                            objectFit="cover"
                                                            fallbackSrc="https://via.placeholder.com/300x200?text=Game+Thumbnail"
                                                        />

                                                        <Text fontSize="sm" color="gray.600">
                                                            {game.description}
                                                        </Text>

                                                        <HStack justify="space-between" fontSize="sm">
                                                            <HStack>
                                                                <FaUsers />
                                                                <Text>{game.maxPlayers}명</Text>
                                                            </HStack>
                                                            <HStack>
                                                                <FaClock />
                                                                <Text>{formatTime(game.estimatedTime)}</Text>
                                                            </HStack>
                                                        </HStack>

                                                        <Button
                                                            colorScheme="blue"
                                                            leftIcon={<FaPlay />}
                                                            onClick={() => startGame(game)}
                                                            isDisabled={!game.isActive}
                                                        >
                                                            게임 시작
                                                        </Button>
                                                    </VStack>
                                                </CardBody>
                                            </Card>
                                        ))}
                                </Grid>
                            </TabPanel>
                        ))}
                    </TabPanels>
                </Tabs>

                {/* 리더보드 섹션 */}
                <Box>
                    <Heading size="lg" mb={4}>
                        <FaTrophy /> 리더보드
                    </Heading>
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
                        {games.slice(0, 6).map((game) => (
                            <Card key={game.id}>
                                <CardHeader>
                                    <Heading size="sm">{getCategoryIcon(game.category)} {game.name}</Heading>
                                </CardHeader>
                                <CardBody>
                                    <VStack align="stretch" spacing={2}>
                                        {leaderboards[game.id]?.slice(0, 5).map((entry, index) => (
                                            <HStack key={entry.userId} justify="space-between">
                                                <HStack>
                                                    <Text fontSize="sm" fontWeight="bold">
                                                        #{entry.rank}
                                                    </Text>
                                                    <Text fontSize="sm">User {entry.userId.slice(-4)}</Text>
                                                </HStack>
                                                <Text fontSize="sm" fontWeight="bold" color="blue.500">
                                                    {entry.score}
                                                </Text>
                                            </HStack>
                                        ))}
                                        {(!leaderboards[game.id] || leaderboards[game.id].length === 0) && (
                                            <Text fontSize="sm" color="gray.500" textAlign="center">
                                                아직 기록이 없습니다
                                            </Text>
                                        )}
                                    </VStack>
                                </CardBody>
                            </Card>
                        ))}
                    </Grid>
                </Box>
            </VStack>

            {/* 게임 모달 */}
            <Modal isOpen={isOpen} onClose={onClose} size="full">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        <HStack>
                            <FaGamepad />
                            <Text>{selectedGame?.name}</Text>
                        </HStack>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {activeSession && (
                            <VStack spacing={4} align="stretch">
                                <HStack justify="space-between" p={4} bg="gray.50" borderRadius="md">
                                    <HStack>
                                        <Text fontWeight="bold">점수: {activeSession.score}</Text>
                                        <Text>레벨: {activeSession.level}</Text>
                                        <Text>생명: {activeSession.lives}</Text>
                                    </HStack>
                                    <Button colorScheme="red" size="sm" onClick={onClose}>
                                        게임 종료
                                    </Button>
                                </HStack>

                                <Box
                                    border="2px solid"
                                    borderColor="gray.200"
                                    borderRadius="md"
                                    p={4}
                                    minH="400px"
                                    bg="black"
                                    position="relative"
                                >
                                    <Text color="white" textAlign="center" mt="50%">
                                        게임 화면이 여기에 표시됩니다
                                    </Text>
                                    <Text color="gray.400" textAlign="center" fontSize="sm">
                                        실제 게임은 iframe이나 Canvas로 구현됩니다
                                    </Text>
                                </Box>
                            </VStack>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default GameCenter;
