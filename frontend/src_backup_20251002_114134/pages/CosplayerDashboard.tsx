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
    Input,
    Textarea,
    Select,
    FormControl,
    FormLabel,
    Tag,
    TagLabel,
    TagCloseButton,
    Progress,
    IconButton,
    Tooltip,
    Avatar,
    Divider
} from '@chakra-ui/react';
import {
    FaCamera,
    FaCalendarAlt,
    FaHeart,
    FaComments,
    FaShare,
    FaEdit,
    FaTrash,
    FaPlus,
    FaSearch,
    FaFilter,
    FaStar,
    FaShoppingCart,
    FaBookmark,
    FaRocket
} from 'react-icons/fa';

interface CosplayItem {
    id: string;
    name: string;
    character: string;
    series: string;
    category: string;
    status: 'planning' | 'in_progress' | 'completed' | 'worn';
    images: string[];
    tags: string[];
    cost: number;
    timeSpent: number;
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    rating: number;
    notes: string;
    createdAt: string;
    updatedAt: string;
}

interface Event {
    id: string;
    title: string;
    type: 'convention' | 'competition' | 'meetup' | 'workshop';
    date: string;
    location: string;
    status: 'upcoming' | 'ongoing' | 'completed';
    description: string;
    participants: number;
    maxParticipants: number;
    isRegistered: boolean;
}

interface PortfolioItem {
    id: string;
    title: string;
    character: string;
    series: string;
    images: string[];
    likes: number;
    comments: number;
    shares: number;
    views: number;
    tags: string[];
    createdAt: string;
    isPublic: boolean;
}

const CosplayerDashboard: React.FC = () => {
    const [cosplayItems, setCosplayItems] = useState<CosplayItem[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<CosplayItem | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        // 초기 데이터 로드
        loadCosplayData();
        loadEvents();
        loadPortfolio();
    }, []);

    const loadCosplayData = async () => {
        // API에서 코스플레이 데이터 로드
        const mockData: CosplayItem[] = [
            {
                id: '1',
                name: 'Sailor Moon',
                character: 'Usagi Tsukino',
                series: 'Sailor Moon',
                category: 'Anime',
                status: 'completed',
                images: ['/images/sailor-moon-1.jpg', '/images/sailor-moon-2.jpg'],
                tags: ['magical girl', 'school uniform', 'transformation'],
                cost: 150000,
                timeSpent: 40,
                difficulty: 'medium',
                rating: 4.5,
                notes: '첫 번째 코스플레이! 정말 재미있었어요.',
                createdAt: '2024-01-15',
                updatedAt: '2024-01-20'
            },
            {
                id: '2',
                name: 'Elsa',
                character: 'Elsa',
                series: 'Frozen',
                category: 'Disney',
                status: 'in_progress',
                images: [],
                tags: ['princess', 'ice', 'dress'],
                cost: 200000,
                timeSpent: 25,
                difficulty: 'hard',
                rating: 0,
                notes: '드레스 제작 중...',
                createdAt: '2024-02-01',
                updatedAt: '2024-02-10'
            }
        ];
        setCosplayItems(mockData);
    };

    const loadEvents = async () => {
        const mockEvents: Event[] = [
            {
                id: '1',
                title: '서울 코스플레이 대회',
                type: 'competition',
                date: '2024-03-15',
                location: '서울 코엑스',
                status: 'upcoming',
                description: '연간 최대 규모의 코스플레이 대회',
                participants: 150,
                maxParticipants: 200,
                isRegistered: true
            },
            {
                id: '2',
                title: '애니메이션 워크샵',
                type: 'workshop',
                date: '2024-02-28',
                location: '강남 문화센터',
                status: 'upcoming',
                description: '애니메이션 코스플레이 기법 워크샵',
                participants: 30,
                maxParticipants: 50,
                isRegistered: false
            }
        ];
        setEvents(mockEvents);
    };

    const loadPortfolio = async () => {
        const mockPortfolio: PortfolioItem[] = [
            {
                id: '1',
                title: 'Sailor Moon Transformation',
                character: 'Usagi Tsukino',
                series: 'Sailor Moon',
                images: ['/images/portfolio-1.jpg', '/images/portfolio-2.jpg'],
                likes: 234,
                comments: 45,
                shares: 12,
                views: 1250,
                tags: ['magical girl', 'transformation', 'anime'],
                createdAt: '2024-01-20',
                isPublic: true
            }
        ];
        setPortfolio(mockPortfolio);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'green';
            case 'in_progress': return 'blue';
            case 'planning': return 'yellow';
            case 'worn': return 'purple';
            default: return 'gray';
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'green';
            case 'medium': return 'yellow';
            case 'hard': return 'orange';
            case 'expert': return 'red';
            default: return 'gray';
        }
    };

    const getEventTypeIcon = (type: string) => {
        switch (type) {
            case 'convention': return '🎪';
            case 'competition': return '🏆';
            case 'meetup': return '👥';
            case 'workshop': return '🔧';
            default: return '📅';
        }
    };

    const filteredCosplayItems = cosplayItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.character.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.series.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
        const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    return (
        <Box p={6}>
            <VStack spacing={6} align="stretch">
                {/* 헤더 */}
                <Box>
                    <Heading size="xl" mb={2} color="purple.500">
                        🎭 코스플레이어 대시보드
                    </Heading>
                    <Text color="gray.600">
                        나의 코스플레이 여정을 관리하고 공유하세요!
                    </Text>
                </Box>

                {/* 통계 카드 */}
                <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4}>
                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>총 코스플레이</StatLabel>
                                <StatNumber>{cosplayItems.length}</StatNumber>
                                <StatHelpText>완료: {cosplayItems.filter(item => item.status === 'completed').length}개</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>총 비용</StatLabel>
                                <StatNumber>{cosplayItems.reduce((sum, item) => sum + item.cost, 0).toLocaleString()}원</StatNumber>
                                <StatHelpText>평균: {Math.round(cosplayItems.reduce((sum, item) => sum + item.cost, 0) / cosplayItems.length).toLocaleString()}원</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>총 시간</StatLabel>
                                <StatNumber>{cosplayItems.reduce((sum, item) => sum + item.timeSpent, 0)}시간</StatNumber>
                                <StatHelpText>평균: {Math.round(cosplayItems.reduce((sum, item) => sum + item.timeSpent, 0) / cosplayItems.length)}시간</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>포트폴리오</StatLabel>
                                <StatNumber>{portfolio.length}</StatNumber>
                                <StatHelpText>총 조회수: {portfolio.reduce((sum, item) => sum + item.views, 0)}</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                </Grid>

                {/* 메인 컨텐츠 */}
                <Tabs>
                    <TabList>
                        <Tab>내 코스플레이</Tab>
                        <Tab>이벤트</Tab>
                        <Tab>포트폴리오</Tab>
                        <Tab>의상 추천</Tab>
                    </TabList>

                    <TabPanels>
                        {/* 코스플레이 관리 탭 */}
                        <TabPanel>
                            <VStack spacing={4} align="stretch">
                                {/* 검색 및 필터 */}
                                <HStack spacing={4}>
                                    <Input
                                        placeholder="코스플레이 검색..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        leftIcon={<FaSearch />}
                                    />
                                    <Select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        width="150px"
                                    >
                                        <option value="all">모든 카테고리</option>
                                        <option value="Anime">애니메이션</option>
                                        <option value="Disney">디즈니</option>
                                        <option value="Game">게임</option>
                                        <option value="Movie">영화</option>
                                    </Select>
                                    <Select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        width="150px"
                                    >
                                        <option value="all">모든 상태</option>
                                        <option value="planning">계획 중</option>
                                        <option value="in_progress">진행 중</option>
                                        <option value="completed">완료</option>
                                        <option value="worn">착용 완료</option>
                                    </Select>
                                    <Button
                                        leftIcon={<FaPlus />}
                                        colorScheme="purple"
                                        onClick={() => setIsAddModalOpen(true)}
                                    >
                                        코스플레이 추가
                                    </Button>
                                </HStack>

                                {/* 코스플레이 목록 */}
                                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
                                    {filteredCosplayItems.map((item) => (
                                        <Card key={item.id} maxW="sm" mx="auto">
                                            <CardHeader>
                                                <HStack justify="space-between">
                                                    <Heading size="md">{item.name}</Heading>
                                                    <Badge colorScheme={getStatusColor(item.status)}>
                                                        {item.status}
                                                    </Badge>
                                                </HStack>
                                                <Text fontSize="sm" color="gray.600">
                                                    {item.character} - {item.series}
                                                </Text>
                                            </CardHeader>
                                            <CardBody>
                                                <VStack align="stretch" spacing={4}>
                                                    {item.images.length > 0 && (
                                                        <Image
                                                            src={item.images[0]}
                                                            alt={item.name}
                                                            borderRadius="md"
                                                            h="200px"
                                                            objectFit="cover"
                                                            fallbackSrc="https://via.placeholder.com/300x200?text=Cosplay+Image"
                                                        />
                                                    )}

                                                    <HStack justify="space-between">
                                                        <Badge colorScheme={getDifficultyColor(item.difficulty)}>
                                                            {item.difficulty}
                                                        </Badge>
                                                        <Text fontSize="sm" fontWeight="bold">
                                                            {item.cost.toLocaleString()}원
                                                        </Text>
                                                    </HStack>

                                                    <HStack justify="space-between" fontSize="sm">
                                                        <Text>소요 시간: {item.timeSpent}시간</Text>
                                                        <Text>평점: {item.rating}/5</Text>
                                                    </HStack>

                                                    <HStack flexWrap="wrap" spacing={1}>
                                                        {item.tags.map((tag, index) => (
                                                            <Tag key={index} size="sm" colorScheme="purple">
                                                                <TagLabel>{tag}</TagLabel>
                                                            </Tag>
                                                        ))}
                                                    </HStack>

                                                    <HStack spacing={2}>
                                                        <Button
                                                            size="sm"
                                                            leftIcon={<FaEdit />}
                                                            onClick={() => {
                                                                setSelectedItem(item);
                                                                setIsEditModalOpen(true);
                                                            }}
                                                        >
                                                            편집
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            leftIcon={<FaCamera />}
                                                            colorScheme="green"
                                                        >
                                                            사진 추가
                                                        </Button>
                                                    </HStack>
                                                </VStack>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </Grid>
                            </VStack>
                        </TabPanel>

                        {/* 이벤트 탭 */}
                        <TabPanel>
                            <VStack spacing={4} align="stretch">
                                <Heading size="lg" mb={4}>🎪 코스플레이 이벤트</Heading>
                                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                                    {events.map((event) => (
                                        <Card key={event.id}>
                                            <CardHeader>
                                                <HStack justify="space-between">
                                                    <Heading size="md">
                                                        {getEventTypeIcon(event.type)} {event.title}
                                                    </Heading>
                                                    <Badge colorScheme={event.isRegistered ? 'green' : 'gray'}>
                                                        {event.isRegistered ? '등록됨' : '미등록'}
                                                    </Badge>
                                                </HStack>
                                                <Text fontSize="sm" color="gray.600">
                                                    📅 {event.date} | 📍 {event.location}
                                                </Text>
                                            </CardHeader>
                                            <CardBody>
                                                <VStack align="stretch" spacing={3}>
                                                    <Text fontSize="sm">{event.description}</Text>
                                                    <HStack justify="space-between">
                                                        <Text fontSize="sm">
                                                            참가자: {event.participants}/{event.maxParticipants}
                                                        </Text>
                                                        <Progress
                                                            value={(event.participants / event.maxParticipants) * 100}
                                                            size="sm"
                                                            colorScheme="blue"
                                                            width="100px"
                                                        />
                                                    </HStack>
                                                    <Button
                                                        colorScheme={event.isRegistered ? 'red' : 'blue'}
                                                        size="sm"
                                                        width="100%"
                                                    >
                                                        {event.isRegistered ? '등록 취소' : '등록하기'}
                                                    </Button>
                                                </VStack>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </Grid>
                            </VStack>
                        </TabPanel>

                        {/* 포트폴리오 탭 */}
                        <TabPanel>
                            <VStack spacing={4} align="stretch">
                                <HStack justify="space-between">
                                    <Heading size="lg">📸 포트폴리오 갤러리</Heading>
                                    <Button leftIcon={<FaPlus />} colorScheme="purple">
                                        포트폴리오 추가
                                    </Button>
                                </HStack>
                                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
                                    {portfolio.map((item) => (
                                        <Card key={item.id}>
                                            <CardHeader>
                                                <Heading size="md">{item.title}</Heading>
                                                <Text fontSize="sm" color="gray.600">
                                                    {item.character} - {item.series}
                                                </Text>
                                            </CardHeader>
                                            <CardBody>
                                                <VStack align="stretch" spacing={3}>
                                                    {item.images.length > 0 && (
                                                        <Image
                                                            src={item.images[0]}
                                                            alt={item.title}
                                                            borderRadius="md"
                                                            h="200px"
                                                            objectFit="cover"
                                                            fallbackSrc="https://via.placeholder.com/300x200?text=Portfolio+Image"
                                                        />
                                                    )}
                                                    <HStack justify="space-between" fontSize="sm">
                                                        <HStack>
                                                            <FaHeart color="red" />
                                                            <Text>{item.likes}</Text>
                                                        </HStack>
                                                        <HStack>
                                                            <FaComments />
                                                            <Text>{item.comments}</Text>
                                                        </HStack>
                                                        <HStack>
                                                            <FaShare />
                                                            <Text>{item.shares}</Text>
                                                        </HStack>
                                                        <Text>조회: {item.views}</Text>
                                                    </HStack>
                                                    <HStack flexWrap="wrap" spacing={1}>
                                                        {item.tags.map((tag, index) => (
                                                            <Tag key={index} size="sm" colorScheme="purple">
                                                                <TagLabel>{tag}</TagLabel>
                                                            </Tag>
                                                        ))}
                                                    </HStack>
                                                </VStack>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </Grid>
                            </VStack>
                        </TabPanel>

                        {/* 의상 추천 탭 */}
                        <TabPanel>
                            <VStack spacing={4} align="stretch">
                                <Heading size="lg">🤖 AI 의상 추천</Heading>
                                <Text color="gray.600">
                                    당신의 취향과 예산에 맞는 완벽한 코스플레이를 추천해드립니다!
                                </Text>
                                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                                    <Card>
                                        <CardHeader>
                                            <Heading size="md">🎯 맞춤 추천</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <VStack align="stretch" spacing={3}>
                                                <Text fontSize="sm" color="gray.600">
                                                    AI가 분석한 당신의 취향 기반 추천
                                                </Text>
                                                <Button colorScheme="purple" leftIcon={<FaRocket />}>
                                                    추천 받기
                                                </Button>
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <Heading size="md">💰 예산별 추천</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <VStack align="stretch" spacing={3}>
                                                <Text fontSize="sm" color="gray.600">
                                                    예산에 맞는 최적의 코스플레이 옵션
                                                </Text>
                                                <Button colorScheme="blue" leftIcon={<FaShoppingCart />}>
                                                    쇼핑하기
                                                </Button>
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                </Grid>
                            </VStack>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </VStack>
        </Box>
    );
};

export default CosplayerDashboard;
