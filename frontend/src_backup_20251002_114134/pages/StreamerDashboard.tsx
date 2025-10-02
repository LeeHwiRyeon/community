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
    Divider,
    Switch,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb
} from '@chakra-ui/react';
import {
    FaPlay,
    FaStop,
    FaPause,
    FaUsers,
    FaHeart,
    FaComments,
    FaShare,
    FaEdit,
    FaTrash,
    FaPlus,
    FaSearch,
    FaFilter,
    FaStar,
    FaGift,
    FaCalendarAlt,
    FaChartLine,
    FaCog,
    FaBell,
    FaVideo,
    FaMicrophone,
    FaDesktop,
    FaGamepad,
    FaMusic,
    FaCamera,
    FaRocket
} from 'react-icons/fa';

interface StreamSession {
    id: string;
    title: string;
    category: string;
    startTime: string;
    endTime?: string;
    duration: number;
    viewers: number;
    peakViewers: number;
    likes: number;
    comments: number;
    shares: number;
    donations: number;
    status: 'live' | 'ended' | 'scheduled';
    thumbnail: string;
    description: string;
    tags: string[];
}

interface Subscriber {
    id: string;
    username: string;
    avatar: string;
    tier: 'basic' | 'premium' | 'vip';
    joinDate: string;
    totalDonations: number;
    lastSeen: string;
    isActive: boolean;
}

interface Revenue {
    id: string;
    type: 'donation' | 'subscription' | 'merchandise' | 'advertisement';
    amount: number;
    date: string;
    source: string;
    description: string;
}

interface Schedule {
    id: string;
    title: string;
    date: string;
    time: string;
    duration: number;
    category: string;
    description: string;
    isRecurring: boolean;
    isNotified: boolean;
}

const StreamerDashboard: React.FC = () => {
    const [streamSessions, setStreamSessions] = useState<StreamSession[]>([]);
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [revenue, setRevenue] = useState<Revenue[]>([]);
    const [schedule, setSchedule] = useState<Schedule[]>([]);
    const [isLive, setIsLive] = useState(false);
    const [currentViewers, setCurrentViewers] = useState(0);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<StreamSession | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        loadStreamData();
        loadSubscribers();
        loadRevenue();
        loadSchedule();
    }, []);

    const loadStreamData = async () => {
        const mockSessions: StreamSession[] = [
            {
                id: '1',
                title: '게임 스트리밍 - 오버워치 2',
                category: 'Gaming',
                startTime: '2024-02-15T19:00:00Z',
                endTime: '2024-02-15T22:00:00Z',
                duration: 180,
                viewers: 1250,
                peakViewers: 1500,
                likes: 89,
                comments: 234,
                shares: 45,
                donations: 150000,
                status: 'ended',
                thumbnail: '/images/stream-thumbnail-1.jpg',
                description: '오버워치 2 랭크 게임 스트리밍',
                tags: ['overwatch', 'gaming', 'fps', 'ranked']
            },
            {
                id: '2',
                title: '라이브 코딩 - React 프로젝트',
                category: 'Programming',
                startTime: '2024-02-16T20:00:00Z',
                endTime: '2024-02-16T23:00:00Z',
                duration: 180,
                viewers: 850,
                peakViewers: 1000,
                likes: 67,
                comments: 156,
                shares: 23,
                donations: 75000,
                status: 'ended',
                thumbnail: '/images/stream-thumbnail-2.jpg',
                description: 'React로 웹 애플리케이션 개발하기',
                tags: ['react', 'programming', 'coding', 'webdev']
            },
            {
                id: '3',
                title: '음악 스트리밍 - 피아노 연주',
                category: 'Music',
                startTime: '2024-02-17T21:00:00Z',
                duration: 0,
                viewers: 0,
                peakViewers: 0,
                likes: 0,
                comments: 0,
                shares: 0,
                donations: 0,
                status: 'scheduled',
                thumbnail: '/images/stream-thumbnail-3.jpg',
                description: '클래식 피아노 연주 라이브',
                tags: ['piano', 'music', 'classical', 'live']
            }
        ];
        setStreamSessions(mockSessions);
    };

    const loadSubscribers = async () => {
        const mockSubscribers: Subscriber[] = [
            {
                id: '1',
                username: 'GamerPro123',
                avatar: '/images/avatar-1.jpg',
                tier: 'vip',
                joinDate: '2024-01-15',
                totalDonations: 500000,
                lastSeen: '2024-02-17T10:30:00Z',
                isActive: true
            },
            {
                id: '2',
                username: 'CodeMaster',
                avatar: '/images/avatar-2.jpg',
                tier: 'premium',
                joinDate: '2024-01-20',
                totalDonations: 250000,
                lastSeen: '2024-02-16T15:45:00Z',
                isActive: true
            },
            {
                id: '3',
                username: 'MusicLover',
                avatar: '/images/avatar-3.jpg',
                tier: 'basic',
                joinDate: '2024-02-01',
                totalDonations: 50000,
                lastSeen: '2024-02-15T20:15:00Z',
                isActive: false
            }
        ];
        setSubscribers(mockSubscribers);
    };

    const loadRevenue = async () => {
        const mockRevenue: Revenue[] = [
            {
                id: '1',
                type: 'donation',
                amount: 50000,
                date: '2024-02-17',
                source: 'GamerPro123',
                description: '오버워치 스트리밍 후원'
            },
            {
                id: '2',
                type: 'subscription',
                amount: 100000,
                date: '2024-02-16',
                source: 'CodeMaster',
                description: '프리미엄 구독'
            },
            {
                id: '3',
                type: 'merchandise',
                amount: 75000,
                date: '2024-02-15',
                source: 'MusicLover',
                description: '스트리머 굿즈 구매'
            }
        ];
        setRevenue(mockRevenue);
    };

    const loadSchedule = async () => {
        const mockSchedule: Schedule[] = [
            {
                id: '1',
                title: '게임 스트리밍 - 발로란트',
                date: '2024-02-18',
                time: '19:00',
                duration: 120,
                category: 'Gaming',
                description: '발로란트 랭크 게임',
                isRecurring: false,
                isNotified: true
            },
            {
                id: '2',
                title: '주간 코딩 세션',
                date: '2024-02-19',
                time: '20:00',
                duration: 180,
                category: 'Programming',
                description: '매주 화요일 정기 코딩 스트리밍',
                isRecurring: true,
                isNotified: false
            }
        ];
        setSchedule(mockSchedule);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'live': return 'red';
            case 'ended': return 'gray';
            case 'scheduled': return 'blue';
            default: return 'gray';
        }
    };

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'vip': return 'purple';
            case 'premium': return 'blue';
            case 'basic': return 'green';
            default: return 'gray';
        }
    };

    const getRevenueTypeIcon = (type: string) => {
        switch (type) {
            case 'donation': return '💝';
            case 'subscription': return '⭐';
            case 'merchandise': return '🛍️';
            case 'advertisement': return '📢';
            default: return '💰';
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Gaming': return '🎮';
            case 'Programming': return '💻';
            case 'Music': return '🎵';
            case 'Art': return '🎨';
            case 'Talk': return '💬';
            default: return '📺';
        }
    };

    const filteredSessions = streamSessions.filter(session => {
        const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            session.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || session.category === filterCategory;
        const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    const totalRevenue = revenue.reduce((sum, item) => sum + item.amount, 0);
    const totalViewers = streamSessions.reduce((sum, session) => sum + session.viewers, 0);
    const totalSubscribers = subscribers.length;
    const activeSubscribers = subscribers.filter(sub => sub.isActive).length;

    return (
        <Box p={6}>
            <VStack spacing={6} align="stretch">
                {/* 헤더 */}
                <Box>
                    <HStack justify="space-between" align="center">
                        <Box>
                            <Heading size="xl" mb={2} color="red.500">
                                📺 스트리머 대시보드
                            </Heading>
                            <Text color="gray.600">
                                방송을 관리하고 시청자와 소통하세요!
                            </Text>
                        </Box>
                        <HStack spacing={4}>
                            <Button
                                leftIcon={isLive ? <FaStop /> : <FaPlay />}
                                colorScheme={isLive ? 'red' : 'green'}
                                size="lg"
                                onClick={() => setIsLive(!isLive)}
                            >
                                {isLive ? '방송 종료' : '방송 시작'}
                            </Button>
                            <Button leftIcon={<FaCog />} colorScheme="gray">
                                설정
                            </Button>
                        </HStack>
                    </HStack>
                </Box>

                {/* 실시간 통계 */}
                {isLive && (
                    <Card bg="red.50" borderColor="red.200">
                        <CardBody>
                            <HStack justify="space-between">
                                <HStack>
                                    <Box w="10px" h="10px" bg="red.500" borderRadius="full" />
                                    <Text fontWeight="bold" color="red.600">LIVE</Text>
                                </HStack>
                                <HStack spacing={6}>
                                    <HStack>
                                        <FaUsers color="blue" />
                                        <Text fontWeight="bold">{currentViewers}명 시청 중</Text>
                                    </HStack>
                                    <HStack>
                                        <FaHeart color="red" />
                                        <Text>좋아요 0</Text>
                                    </HStack>
                                    <HStack>
                                        <FaComments color="green" />
                                        <Text>댓글 0</Text>
                                    </HStack>
                                </HStack>
                            </HStack>
                        </CardBody>
                    </Card>
                )}

                {/* 통계 카드 */}
                <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4}>
                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>총 수익</StatLabel>
                                <StatNumber>{totalRevenue.toLocaleString()}원</StatNumber>
                                <StatHelpText>이번 달: {totalRevenue.toLocaleString()}원</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>총 시청자</StatLabel>
                                <StatNumber>{totalViewers.toLocaleString()}</StatNumber>
                                <StatHelpText>평균: {Math.round(totalViewers / streamSessions.length)}명</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>구독자</StatLabel>
                                <StatNumber>{totalSubscribers}</StatNumber>
                                <StatHelpText>활성: {activeSubscribers}명</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>총 방송</StatLabel>
                                <StatNumber>{streamSessions.length}</StatNumber>
                                <StatHelpText>완료: {streamSessions.filter(s => s.status === 'ended').length}회</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                </Grid>

                {/* 메인 컨텐츠 */}
                <Tabs>
                    <TabList>
                        <Tab>방송 관리</Tab>
                        <Tab>구독자 관리</Tab>
                        <Tab>수익 분석</Tab>
                        <Tab>방송 일정</Tab>
                        <Tab>방송 도구</Tab>
                    </TabList>

                    <TabPanels>
                        {/* 방송 관리 탭 */}
                        <TabPanel>
                            <VStack spacing={4} align="stretch">
                                {/* 검색 및 필터 */}
                                <HStack spacing={4}>
                                    <Input
                                        placeholder="방송 검색..."
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
                                        <option value="Gaming">게임</option>
                                        <option value="Programming">프로그래밍</option>
                                        <option value="Music">음악</option>
                                        <option value="Art">아트</option>
                                        <option value="Talk">토크</option>
                                    </Select>
                                    <Select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        width="150px"
                                    >
                                        <option value="all">모든 상태</option>
                                        <option value="live">라이브</option>
                                        <option value="ended">종료</option>
                                        <option value="scheduled">예정</option>
                                    </Select>
                                    <Button
                                        leftIcon={<FaPlus />}
                                        colorScheme="red"
                                        onClick={() => setIsAddModalOpen(true)}
                                    >
                                        방송 추가
                                    </Button>
                                </HStack>

                                {/* 방송 목록 */}
                                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
                                    {filteredSessions.map((session) => (
                                        <Card key={session.id} maxW="sm" mx="auto">
                                            <CardHeader>
                                                <HStack justify="space-between">
                                                    <Heading size="md">{getCategoryIcon(session.category)} {session.title}</Heading>
                                                    <Badge colorScheme={getStatusColor(session.status)}>
                                                        {session.status}
                                                    </Badge>
                                                </HStack>
                                                <Text fontSize="sm" color="gray.600">
                                                    {new Date(session.startTime).toLocaleDateString()}
                                                </Text>
                                            </CardHeader>
                                            <CardBody>
                                                <VStack align="stretch" spacing={4}>
                                                    <Image
                                                        src={session.thumbnail}
                                                        alt={session.title}
                                                        borderRadius="md"
                                                        h="200px"
                                                        objectFit="cover"
                                                        fallbackSrc="https://via.placeholder.com/300x200?text=Stream+Thumbnail"
                                                    />

                                                    <Text fontSize="sm" color="gray.600">
                                                        {session.description}
                                                    </Text>

                                                    <HStack justify="space-between" fontSize="sm">
                                                        <HStack>
                                                            <FaUsers />
                                                            <Text>{session.viewers}명</Text>
                                                        </HStack>
                                                        <HStack>
                                                            <FaHeart />
                                                            <Text>{session.likes}</Text>
                                                        </HStack>
                                                        <HStack>
                                                            <FaComments />
                                                            <Text>{session.comments}</Text>
                                                        </HStack>
                                                        <HStack>
                                                            <FaGift />
                                                            <Text>{session.donations.toLocaleString()}원</Text>
                                                        </HStack>
                                                    </HStack>

                                                    <HStack flexWrap="wrap" spacing={1}>
                                                        {session.tags.map((tag, index) => (
                                                            <Tag key={index} size="sm" colorScheme="red">
                                                                <TagLabel>{tag}</TagLabel>
                                                            </Tag>
                                                        ))}
                                                    </HStack>

                                                    <HStack spacing={2}>
                                                        <Button
                                                            size="sm"
                                                            leftIcon={<FaEdit />}
                                                            onClick={() => {
                                                                setSelectedSession(session);
                                                                setIsEditModalOpen(true);
                                                            }}
                                                        >
                                                            편집
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            leftIcon={<FaChartLine />}
                                                            colorScheme="blue"
                                                        >
                                                            분석
                                                        </Button>
                                                    </HStack>
                                                </VStack>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </Grid>
                            </VStack>
                        </TabPanel>

                        {/* 구독자 관리 탭 */}
                        <TabPanel>
                            <VStack spacing={4} align="stretch">
                                <HStack justify="space-between">
                                    <Heading size="lg">👥 구독자 관리</Heading>
                                    <HStack>
                                        <Input placeholder="구독자 검색..." width="200px" />
                                        <Button leftIcon={<FaFilter />}>필터</Button>
                                    </HStack>
                                </HStack>
                                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
                                    {subscribers.map((subscriber) => (
                                        <Card key={subscriber.id}>
                                            <CardBody>
                                                <HStack spacing={4}>
                                                    <Avatar src={subscriber.avatar} size="md" />
                                                    <VStack align="start" spacing={1} flex={1}>
                                                        <HStack>
                                                            <Text fontWeight="bold">{subscriber.username}</Text>
                                                            <Badge colorScheme={getTierColor(subscriber.tier)} size="sm">
                                                                {subscriber.tier.toUpperCase()}
                                                            </Badge>
                                                        </HStack>
                                                        <Text fontSize="sm" color="gray.600">
                                                            가입일: {new Date(subscriber.joinDate).toLocaleDateString()}
                                                        </Text>
                                                        <Text fontSize="sm" color="gray.600">
                                                            총 후원: {subscriber.totalDonations.toLocaleString()}원
                                                        </Text>
                                                        <HStack>
                                                            <Text fontSize="sm">
                                                                마지막 접속: {new Date(subscriber.lastSeen).toLocaleDateString()}
                                                            </Text>
                                                            <Badge colorScheme={subscriber.isActive ? 'green' : 'gray'} size="sm">
                                                                {subscriber.isActive ? '활성' : '비활성'}
                                                            </Badge>
                                                        </HStack>
                                                    </VStack>
                                                </HStack>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </Grid>
                            </VStack>
                        </TabPanel>

                        {/* 수익 분석 탭 */}
                        <TabPanel>
                            <VStack spacing={4} align="stretch">
                                <Heading size="lg">💰 수익 분석</Heading>
                                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                                    <Card>
                                        <CardHeader>
                                            <Heading size="md">수익 내역</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <VStack align="stretch" spacing={3}>
                                                {revenue.map((item) => (
                                                    <HStack key={item.id} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                                                        <HStack>
                                                            <Text fontSize="2xl">{getRevenueTypeIcon(item.type)}</Text>
                                                            <VStack align="start" spacing={0}>
                                                                <Text fontWeight="bold">{item.source}</Text>
                                                                <Text fontSize="sm" color="gray.600">{item.description}</Text>
                                                            </VStack>
                                                        </HStack>
                                                        <VStack align="end" spacing={0}>
                                                            <Text fontWeight="bold" color="green.500">
                                                                +{item.amount.toLocaleString()}원
                                                            </Text>
                                                            <Text fontSize="sm" color="gray.600">
                                                                {new Date(item.date).toLocaleDateString()}
                                                            </Text>
                                                        </VStack>
                                                    </HStack>
                                                ))}
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <Heading size="md">수익 통계</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <VStack align="stretch" spacing={4}>
                                                <HStack justify="space-between">
                                                    <Text>총 수익</Text>
                                                    <Text fontWeight="bold" fontSize="xl">{totalRevenue.toLocaleString()}원</Text>
                                                </HStack>
                                                <HStack justify="space-between">
                                                    <Text>후원</Text>
                                                    <Text>{revenue.filter(r => r.type === 'donation').reduce((sum, r) => sum + r.amount, 0).toLocaleString()}원</Text>
                                                </HStack>
                                                <HStack justify="space-between">
                                                    <Text>구독</Text>
                                                    <Text>{revenue.filter(r => r.type === 'subscription').reduce((sum, r) => sum + r.amount, 0).toLocaleString()}원</Text>
                                                </HStack>
                                                <HStack justify="space-between">
                                                    <Text>굿즈</Text>
                                                    <Text>{revenue.filter(r => r.type === 'merchandise').reduce((sum, r) => sum + r.amount, 0).toLocaleString()}원</Text>
                                                </HStack>
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                </Grid>
                            </VStack>
                        </TabPanel>

                        {/* 방송 일정 탭 */}
                        <TabPanel>
                            <VStack spacing={4} align="stretch">
                                <HStack justify="space-between">
                                    <Heading size="lg">📅 방송 일정</Heading>
                                    <Button leftIcon={<FaPlus />} colorScheme="blue">
                                        일정 추가
                                    </Button>
                                </HStack>
                                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                                    {schedule.map((item) => (
                                        <Card key={item.id}>
                                            <CardHeader>
                                                <HStack justify="space-between">
                                                    <Heading size="md">{getCategoryIcon(item.category)} {item.title}</Heading>
                                                    <Badge colorScheme="blue">예정</Badge>
                                                </HStack>
                                                <Text fontSize="sm" color="gray.600">
                                                    📅 {item.date} {item.time} ({item.duration}분)
                                                </Text>
                                            </CardHeader>
                                            <CardBody>
                                                <VStack align="stretch" spacing={3}>
                                                    <Text fontSize="sm">{item.description}</Text>
                                                    <HStack justify="space-between">
                                                        <HStack>
                                                            <Switch size="sm" isChecked={item.isRecurring} />
                                                            <Text fontSize="sm">반복</Text>
                                                        </HStack>
                                                        <HStack>
                                                            <Switch size="sm" isChecked={item.isNotified} />
                                                            <Text fontSize="sm">알림</Text>
                                                        </HStack>
                                                    </HStack>
                                                    <HStack spacing={2}>
                                                        <Button size="sm" leftIcon={<FaEdit />}>편집</Button>
                                                        <Button size="sm" leftIcon={<FaBell />} colorScheme="blue">알림 설정</Button>
                                                    </HStack>
                                                </VStack>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </Grid>
                            </VStack>
                        </TabPanel>

                        {/* 방송 도구 탭 */}
                        <TabPanel>
                            <VStack spacing={4} align="stretch">
                                <Heading size="lg">🛠️ 방송 도구</Heading>
                                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
                                    <Card>
                                        <CardHeader>
                                            <Heading size="md">🎥 OBS 연동</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <VStack align="stretch" spacing={3}>
                                                <Text fontSize="sm">OBS Studio와 연동하여 방송을 시작하세요</Text>
                                                <Button colorScheme="purple" leftIcon={<FaVideo />}>
                                                    OBS 연결
                                                </Button>
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <Heading size="md">🎤 오디오 설정</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <VStack align="stretch" spacing={3}>
                                                <Text fontSize="sm">마이크 볼륨 조절</Text>
                                                <Slider defaultValue={50} min={0} max={100}>
                                                    <SliderTrack>
                                                        <SliderFilledTrack />
                                                    </SliderTrack>
                                                    <SliderThumb />
                                                </Slider>
                                                <Button colorScheme="blue" leftIcon={<FaMicrophone />}>
                                                    테스트
                                                </Button>
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <Heading size="md">🖥️ 화면 공유</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <VStack align="stretch" spacing={3}>
                                                <Text fontSize="sm">데스크톱 화면을 공유하세요</Text>
                                                <Button colorScheme="green" leftIcon={<FaDesktop />}>
                                                    화면 공유
                                                </Button>
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <Heading size="md">🎮 게임 오버레이</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <VStack align="stretch" spacing={3}>
                                                <Text fontSize="sm">게임 화면에 정보를 오버레이하세요</Text>
                                                <Button colorScheme="orange" leftIcon={<FaGamepad />}>
                                                    오버레이 설정
                                                </Button>
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <Heading size="md">🎵 음악 플레이어</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <VStack align="stretch" spacing={3}>
                                                <Text fontSize="sm">방송용 음악을 재생하세요</Text>
                                                <Button colorScheme="pink" leftIcon={<FaMusic />}>
                                                    음악 재생
                                                </Button>
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <Heading size="md">📷 카메라 설정</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <VStack align="stretch" spacing={3}>
                                                <Text fontSize="sm">웹캠 설정을 조정하세요</Text>
                                                <Button colorScheme="teal" leftIcon={<FaCamera />}>
                                                    카메라 설정
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

export default StreamerDashboard;
