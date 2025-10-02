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
    SliderThumb,
    Flex,
    Spacer,
    Wrap,
    WrapItem
} from '@chakra-ui/react';
import {
    FaCamera,
    FaVideo,
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
    FaRocket,
    FaGamepad,
    FaMusic,
    FaPalette,
    FaMicrophone,
    FaDesktop,
    FaBookmark,
    FaThumbsUp,
    FaEye,
    FaDownload,
    FaExternalLinkAlt
} from 'react-icons/fa';

interface CommunityMember {
    id: string;
    username: string;
    avatar: string;
    type: 'cosplayer' | 'streamer' | 'viewer' | 'fan';
    tier: 'basic' | 'premium' | 'vip' | 'moderator';
    joinDate: string;
    lastActive: string;
    isOnline: boolean;
    stats: {
        followers: number;
        following: number;
        posts: number;
        likes: number;
        views: number;
    };
    tags: string[];
    bio: string;
    location: string;
    socialMedia: {
        instagram?: string;
        twitter?: string;
        youtube?: string;
        tiktok?: string;
    };
}

interface Collaboration {
    id: string;
    title: string;
    description: string;
    type: 'cosplay_stream' | 'event_promotion' | 'cross_promotion' | 'workshop';
    cosplayerId: string;
    streamerId: string;
    status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed';
    startDate: string;
    endDate: string;
    budget: number;
    participants: number;
    maxParticipants: number;
    tags: string[];
    thumbnail: string;
    createdAt: string;
}

interface Event {
    id: string;
    title: string;
    description: string;
    type: 'convention' | 'competition' | 'meetup' | 'workshop' | 'streaming_event';
    organizerId: string;
    startDate: string;
    endDate: string;
    location: string;
    isOnline: boolean;
    participants: number;
    maxParticipants: number;
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    tags: string[];
    thumbnail: string;
    streamUrl?: string;
    socialMedia: {
        instagram?: string;
        twitter?: string;
        youtube?: string;
    };
}

interface FanClub {
    id: string;
    name: string;
    description: string;
    ownerId: string;
    ownerType: 'cosplayer' | 'streamer';
    members: number;
    maxMembers: number;
    isPublic: boolean;
    categories: string[];
    rules: string[];
    thumbnail: string;
    createdAt: string;
}

const EnhancedCommunityHub: React.FC = () => {
    const [members, setMembers] = useState<CommunityMember[]>([]);
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [fanClubs, setFanClubs] = useState<FanClub[]>([]);
    const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isCollaborationModalOpen, setIsCollaborationModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterTier, setFilterTier] = useState('all');
    const [sortBy, setSortBy] = useState('recent');

    useEffect(() => {
        loadCommunityData();
    }, []);

    const loadCommunityData = async () => {
        // API에서 커뮤니티 데이터 로드
        const mockMembers: CommunityMember[] = [
            {
                id: '1',
                username: 'CosplayQueen',
                avatar: '/images/cosplay-queen.jpg',
                type: 'cosplayer',
                tier: 'vip',
                joinDate: '2024-01-15',
                lastActive: '2024-02-17T10:30:00Z',
                isOnline: true,
                stats: {
                    followers: 15420,
                    following: 892,
                    posts: 156,
                    likes: 45230,
                    views: 125000
                },
                tags: ['anime', 'disney', 'gaming', 'sewing'],
                bio: '프로 코스플레이어 | 애니메이션 & 게임 전문 | 의상 제작 강의',
                location: '서울, 대한민국',
                socialMedia: {
                    instagram: '@cosplay_queen',
                    twitter: '@cosplay_queen_kr',
                    youtube: 'CosplayQueen Channel'
                }
            },
            {
                id: '2',
                username: 'StreamMaster',
                avatar: '/images/stream-master.jpg',
                type: 'streamer',
                tier: 'vip',
                joinDate: '2024-01-20',
                lastActive: '2024-02-17T09:15:00Z',
                isOnline: true,
                stats: {
                    followers: 23450,
                    following: 1205,
                    posts: 89,
                    likes: 67890,
                    views: 450000
                },
                tags: ['gaming', 'programming', 'tech', 'entertainment'],
                bio: '게임 & 코딩 스트리머 | 오버워치 프로 | React 개발자',
                location: '부산, 대한민국',
                socialMedia: {
                    youtube: 'StreamMaster Gaming',
                    twitter: '@stream_master_kr',
                    tiktok: '@streammaster'
                }
            },
            {
                id: '3',
                username: 'ArtFan123',
                avatar: '/images/art-fan.jpg',
                type: 'fan',
                tier: 'premium',
                joinDate: '2024-02-01',
                lastActive: '2024-02-16T20:45:00Z',
                isOnline: false,
                stats: {
                    followers: 234,
                    following: 1456,
                    posts: 23,
                    likes: 890,
                    views: 5600
                },
                tags: ['art', 'anime', 'fanart', 'digital'],
                bio: '애니메이션 팬아트 작가 | 디지털 아트 전문',
                location: '대구, 대한민국',
                socialMedia: {
                    instagram: '@art_fan_123',
                    twitter: '@artfan_kr'
                }
            }
        ];

        const mockCollaborations: Collaboration[] = [
            {
                id: '1',
                title: '애니메이션 코스플레이 라이브 스트리밍',
                description: '인기 애니메이션 캐릭터 코스플레이를 실시간으로 스트리밍합니다.',
                type: 'cosplay_stream',
                cosplayerId: '1',
                streamerId: '2',
                status: 'active',
                startDate: '2024-02-20T19:00:00Z',
                endDate: '2024-02-20T22:00:00Z',
                budget: 500000,
                participants: 15,
                maxParticipants: 20,
                tags: ['anime', 'cosplay', 'streaming', 'live'],
                thumbnail: '/images/collaboration-1.jpg',
                createdAt: '2024-02-15T10:00:00Z'
            },
            {
                id: '2',
                title: '게임 캐릭터 코스플레이 워크샵',
                description: '게임 캐릭터 코스플레이 제작 기법을 배우는 워크샵입니다.',
                type: 'workshop',
                cosplayerId: '1',
                streamerId: '2',
                status: 'scheduled',
                startDate: '2024-02-25T14:00:00Z',
                endDate: '2024-02-25T17:00:00Z',
                budget: 300000,
                participants: 8,
                maxParticipants: 15,
                tags: ['gaming', 'cosplay', 'workshop', 'education'],
                thumbnail: '/images/collaboration-2.jpg',
                createdAt: '2024-02-10T15:30:00Z'
            }
        ];

        const mockEvents: Event[] = [
            {
                id: '1',
                title: '서울 코스플레이 대회 2024',
                description: '연간 최대 규모의 코스플레이 대회',
                type: 'competition',
                organizerId: '1',
                startDate: '2024-03-15T10:00:00Z',
                endDate: '2024-03-17T18:00:00Z',
                location: '서울 코엑스',
                isOnline: false,
                participants: 150,
                maxParticipants: 200,
                status: 'scheduled',
                tags: ['competition', 'cosplay', 'convention'],
                thumbnail: '/images/event-1.jpg',
                socialMedia: {
                    instagram: '@seoul_cosplay_2024',
                    twitter: '@seoul_cosplay'
                }
            },
            {
                id: '2',
                title: '라이브 코딩 스트리밍',
                description: 'React로 웹 애플리케이션을 개발하는 라이브 코딩',
                type: 'streaming_event',
                organizerId: '2',
                startDate: '2024-02-18T20:00:00Z',
                endDate: '2024-02-18T23:00:00Z',
                location: '온라인',
                isOnline: true,
                participants: 45,
                maxParticipants: 100,
                status: 'scheduled',
                tags: ['programming', 'react', 'streaming', 'education'],
                thumbnail: '/images/event-2.jpg',
                streamUrl: 'https://twitch.tv/streammaster',
                socialMedia: {
                    youtube: 'StreamMaster Channel',
                    twitter: '@stream_master_kr'
                }
            }
        ];

        const mockFanClubs: FanClub[] = [
            {
                id: '1',
                name: 'CosplayQueen 팬클럽',
                description: 'CosplayQueen의 공식 팬클럽입니다.',
                ownerId: '1',
                ownerType: 'cosplayer',
                members: 1250,
                maxMembers: 2000,
                isPublic: true,
                categories: ['cosplay', 'anime', 'fashion'],
                rules: ['친절하게 소통하기', '스팸 금지', '욕설 금지'],
                thumbnail: '/images/fanclub-1.jpg',
                createdAt: '2024-01-15T00:00:00Z'
            },
            {
                id: '2',
                name: 'StreamMaster 커뮤니티',
                description: 'StreamMaster의 게임 & 코딩 커뮤니티',
                ownerId: '2',
                ownerType: 'streamer',
                members: 3200,
                maxMembers: 5000,
                isPublic: true,
                categories: ['gaming', 'programming', 'tech'],
                rules: ['건전한 토론', '도움 요청 환영', '광고 금지'],
                thumbnail: '/images/fanclub-2.jpg',
                createdAt: '2024-01-20T00:00:00Z'
            }
        ];

        setMembers(mockMembers);
        setCollaborations(mockCollaborations);
        setEvents(mockEvents);
        setFanClubs(mockFanClubs);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'cosplayer': return '🎭';
            case 'streamer': return '📺';
            case 'viewer': return '👀';
            case 'fan': return '💖';
            default: return '👤';
        }
    };

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'vip': return 'purple';
            case 'premium': return 'blue';
            case 'moderator': return 'green';
            case 'basic': return 'gray';
            default: return 'gray';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'green';
            case 'scheduled': return 'blue';
            case 'completed': return 'gray';
            case 'cancelled': return 'red';
            default: return 'gray';
        }
    };

    const getEventTypeIcon = (type: string) => {
        switch (type) {
            case 'convention': return '🎪';
            case 'competition': return '🏆';
            case 'meetup': return '👥';
            case 'workshop': return '🔧';
            case 'streaming_event': return '📺';
            default: return '📅';
        }
    };

    const filteredMembers = members.filter(member => {
        const matchesSearch = member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = filterType === 'all' || member.type === filterType;
        const matchesTier = filterTier === 'all' || member.tier === filterTier;
        return matchesSearch && matchesType && matchesTier;
    });

    const sortedMembers = filteredMembers.sort((a, b) => {
        switch (sortBy) {
            case 'followers':
                return b.stats.followers - a.stats.followers;
            case 'recent':
                return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
            case 'posts':
                return b.stats.posts - a.stats.posts;
            default:
                return 0;
        }
    });

    return (
        <Box p={6}>
            <VStack spacing={6} align="stretch">
                {/* 헤더 */}
                <Box>
                    <Heading size="xl" mb={2} color="purple.500">
                        🌟 향상된 커뮤니티 허브
                    </Heading>
                    <Text color="gray.600">
                        코스플레이어와 스트리머가 함께 만드는 특별한 커뮤니티
                    </Text>
                </Box>

                {/* 통계 카드 */}
                <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4}>
                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>총 멤버</StatLabel>
                                <StatNumber>{members.length}</StatNumber>
                                <StatHelpText>온라인: {members.filter(m => m.isOnline).length}명</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>협업 프로젝트</StatLabel>
                                <StatNumber>{collaborations.length}</StatNumber>
                                <StatHelpText>활성: {collaborations.filter(c => c.status === 'active').length}개</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>이벤트</StatLabel>
                                <StatNumber>{events.length}</StatNumber>
                                <StatHelpText>예정: {events.filter(e => e.status === 'scheduled').length}개</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>팬클럽</StatLabel>
                                <StatNumber>{fanClubs.length}</StatNumber>
                                <StatHelpText>총 멤버: {fanClubs.reduce((sum, f) => sum + f.members, 0)}명</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                </Grid>

                {/* 메인 컨텐츠 */}
                <Tabs>
                    <TabList>
                        <Tab>멤버</Tab>
                        <Tab>협업</Tab>
                        <Tab>이벤트</Tab>
                        <Tab>팬클럽</Tab>
                        <Tab>트렌드</Tab>
                    </TabList>

                    <TabPanels>
                        {/* 멤버 탭 */}
                        <TabPanel>
                            <VStack spacing={4} align="stretch">
                                {/* 검색 및 필터 */}
                                <HStack spacing={4}>
                                    <Input
                                        placeholder="멤버 검색..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        leftIcon={<FaSearch />}
                                    />
                                    <Select
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                        width="150px"
                                    >
                                        <option value="all">모든 타입</option>
                                        <option value="cosplayer">코스플레이어</option>
                                        <option value="streamer">스트리머</option>
                                        <option value="fan">팬</option>
                                        <option value="viewer">시청자</option>
                                    </Select>
                                    <Select
                                        value={filterTier}
                                        onChange={(e) => setFilterTier(e.target.value)}
                                        width="150px"
                                    >
                                        <option value="all">모든 등급</option>
                                        <option value="vip">VIP</option>
                                        <option value="premium">프리미엄</option>
                                        <option value="moderator">모더레이터</option>
                                        <option value="basic">베이직</option>
                                    </Select>
                                    <Select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        width="150px"
                                    >
                                        <option value="recent">최근 활동</option>
                                        <option value="followers">팔로워 수</option>
                                        <option value="posts">게시물 수</option>
                                    </Select>
                                </HStack>

                                {/* 멤버 목록 */}
                                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
                                    {sortedMembers.map((member) => (
                                        <Card key={member.id} maxW="sm" mx="auto" cursor="pointer"
                                            onClick={() => { setSelectedMember(member); setIsProfileModalOpen(true); }}>
                                            <CardHeader>
                                                <HStack justify="space-between">
                                                    <HStack>
                                                        <Avatar src={member.avatar} size="md" />
                                                        <VStack align="start" spacing={0}>
                                                            <HStack>
                                                                <Text fontWeight="bold">{member.username}</Text>
                                                                {member.isOnline && <Box w="8px" h="8px" bg="green.500" borderRadius="full" />}
                                                            </HStack>
                                                            <Text fontSize="sm" color="gray.600">
                                                                {getTypeIcon(member.type)} {member.type}
                                                            </Text>
                                                        </VStack>
                                                    </HStack>
                                                    <Badge colorScheme={getTierColor(member.tier)}>
                                                        {member.tier.toUpperCase()}
                                                    </Badge>
                                                </HStack>
                                            </CardHeader>
                                            <CardBody>
                                                <VStack align="stretch" spacing={4}>
                                                    <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                                        {member.bio}
                                                    </Text>

                                                    <HStack justify="space-between" fontSize="sm">
                                                        <HStack>
                                                            <FaUsers />
                                                            <Text>{member.stats.followers.toLocaleString()}</Text>
                                                        </HStack>
                                                        <HStack>
                                                            <FaHeart />
                                                            <Text>{member.stats.likes.toLocaleString()}</Text>
                                                        </HStack>
                                                        <HStack>
                                                            <FaEye />
                                                            <Text>{member.stats.views.toLocaleString()}</Text>
                                                        </HStack>
                                                    </HStack>

                                                    <Wrap spacing={1}>
                                                        {member.tags.slice(0, 3).map((tag, index) => (
                                                            <WrapItem key={index}>
                                                                <Tag size="sm" colorScheme="purple">
                                                                    <TagLabel>{tag}</TagLabel>
                                                                </Tag>
                                                            </WrapItem>
                                                        ))}
                                                        {member.tags.length > 3 && (
                                                            <WrapItem>
                                                                <Tag size="sm" colorScheme="gray">
                                                                    <TagLabel>+{member.tags.length - 3}</TagLabel>
                                                                </Tag>
                                                            </WrapItem>
                                                        )}
                                                    </Wrap>

                                                    <HStack spacing={2}>
                                                        <Button size="sm" leftIcon={<FaHeart />} colorScheme="red">
                                                            팔로우
                                                        </Button>
                                                        <Button size="sm" leftIcon={<FaComments />} colorScheme="blue">
                                                            메시지
                                                        </Button>
                                                    </HStack>
                                                </VStack>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </Grid>
                            </VStack>
                        </TabPanel>

                        {/* 협업 탭 */}
                        <TabPanel>
                            <VStack spacing={4} align="stretch">
                                <HStack justify="space-between">
                                    <Heading size="lg">🤝 협업 프로젝트</Heading>
                                    <Button leftIcon={<FaPlus />} colorScheme="purple" onClick={() => setIsCollaborationModalOpen(true)}>
                                        협업 제안
                                    </Button>
                                </HStack>
                                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                                    {collaborations.map((collaboration) => (
                                        <Card key={collaboration.id}>
                                            <CardHeader>
                                                <HStack justify="space-between">
                                                    <Heading size="md">{collaboration.title}</Heading>
                                                    <Badge colorScheme={getStatusColor(collaboration.status)}>
                                                        {collaboration.status}
                                                    </Badge>
                                                </HStack>
                                                <Text fontSize="sm" color="gray.600">
                                                    {new Date(collaboration.startDate).toLocaleDateString()} - {new Date(collaboration.endDate).toLocaleDateString()}
                                                </Text>
                                            </CardHeader>
                                            <CardBody>
                                                <VStack align="stretch" spacing={3}>
                                                    <Image
                                                        src={collaboration.thumbnail}
                                                        alt={collaboration.title}
                                                        borderRadius="md"
                                                        h="150px"
                                                        objectFit="cover"
                                                        fallbackSrc="https://via.placeholder.com/300x150?text=Collaboration"
                                                    />

                                                    <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                                        {collaboration.description}
                                                    </Text>

                                                    <HStack justify="space-between" fontSize="sm">
                                                        <Text>예산: {collaboration.budget.toLocaleString()}원</Text>
                                                        <Text>참가자: {collaboration.participants}/{collaboration.maxParticipants}</Text>
                                                    </HStack>

                                                    <Wrap spacing={1}>
                                                        {collaboration.tags.map((tag, index) => (
                                                            <WrapItem key={index}>
                                                                <Tag size="sm" colorScheme="purple">
                                                                    <TagLabel>{tag}</TagLabel>
                                                                </Tag>
                                                            </WrapItem>
                                                        ))}
                                                    </Wrap>

                                                    <HStack spacing={2}>
                                                        <Button size="sm" leftIcon={<FaEye />} colorScheme="blue">
                                                            자세히 보기
                                                        </Button>
                                                        <Button size="sm" leftIcon={<FaHeart />} colorScheme="red">
                                                            관심 표시
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
                                <Heading size="lg">📅 커뮤니티 이벤트</Heading>
                                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                                    {events.map((event) => (
                                        <Card key={event.id}>
                                            <CardHeader>
                                                <HStack justify="space-between">
                                                    <Heading size="md">
                                                        {getEventTypeIcon(event.type)} {event.title}
                                                    </Heading>
                                                    <Badge colorScheme={getStatusColor(event.status)}>
                                                        {event.status}
                                                    </Badge>
                                                </HStack>
                                                <Text fontSize="sm" color="gray.600">
                                                    📅 {new Date(event.startDate).toLocaleDateString()} | 📍 {event.location}
                                                </Text>
                                            </CardHeader>
                                            <CardBody>
                                                <VStack align="stretch" spacing={3}>
                                                    <Image
                                                        src={event.thumbnail}
                                                        alt={event.title}
                                                        borderRadius="md"
                                                        h="150px"
                                                        objectFit="cover"
                                                        fallbackSrc="https://via.placeholder.com/300x150?text=Event"
                                                    />

                                                    <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                                        {event.description}
                                                    </Text>

                                                    <HStack justify="space-between" fontSize="sm">
                                                        <Text>참가자: {event.participants}/{event.maxParticipants}</Text>
                                                        <Text>{event.isOnline ? '온라인' : '오프라인'}</Text>
                                                    </HStack>

                                                    <HStack spacing={2}>
                                                        <Button size="sm" leftIcon={<FaCalendarAlt />} colorScheme="blue">
                                                            참가 신청
                                                        </Button>
                                                        <Button size="sm" leftIcon={<FaShare />} colorScheme="green">
                                                            공유
                                                        </Button>
                                                    </HStack>
                                                </VStack>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </Grid>
                            </VStack>
                        </TabPanel>

                        {/* 팬클럽 탭 */}
                        <TabPanel>
                            <VStack spacing={4} align="stretch">
                                <Heading size="lg">💖 팬클럽</Heading>
                                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                                    {fanClubs.map((fanClub) => (
                                        <Card key={fanClub.id}>
                                            <CardHeader>
                                                <HStack justify="space-between">
                                                    <Heading size="md">{fanClub.name}</Heading>
                                                    <Badge colorScheme={fanClub.isPublic ? 'green' : 'gray'}>
                                                        {fanClub.isPublic ? '공개' : '비공개'}
                                                    </Badge>
                                                </HStack>
                                                <Text fontSize="sm" color="gray.600">
                                                    멤버: {fanClub.members}/{fanClub.maxMembers}
                                                </Text>
                                            </CardHeader>
                                            <CardBody>
                                                <VStack align="stretch" spacing={3}>
                                                    <Image
                                                        src={fanClub.thumbnail}
                                                        alt={fanClub.name}
                                                        borderRadius="md"
                                                        h="150px"
                                                        objectFit="cover"
                                                        fallbackSrc="https://via.placeholder.com/300x150?text=FanClub"
                                                    />

                                                    <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                                        {fanClub.description}
                                                    </Text>

                                                    <Wrap spacing={1}>
                                                        {fanClub.categories.map((category, index) => (
                                                            <WrapItem key={index}>
                                                                <Tag size="sm" colorScheme="purple">
                                                                    <TagLabel>{category}</TagLabel>
                                                                </Tag>
                                                            </WrapItem>
                                                        ))}
                                                    </Wrap>

                                                    <HStack spacing={2}>
                                                        <Button size="sm" leftIcon={<FaUsers />} colorScheme="blue">
                                                            가입하기
                                                        </Button>
                                                        <Button size="sm" leftIcon={<FaEye />} colorScheme="gray">
                                                            둘러보기
                                                        </Button>
                                                    </HStack>
                                                </VStack>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </Grid>
                            </VStack>
                        </TabPanel>

                        {/* 트렌드 탭 */}
                        <TabPanel>
                            <VStack spacing={4} align="stretch">
                                <Heading size="lg">📈 커뮤니티 트렌드</Heading>
                                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                                    <Card>
                                        <CardHeader>
                                            <Heading size="md">🔥 인기 태그</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <VStack align="stretch" spacing={2}>
                                                {['anime', 'gaming', 'cosplay', 'streaming', 'art', 'programming'].map((tag, index) => (
                                                    <HStack key={tag} justify="space-between">
                                                        <Tag colorScheme="purple">{tag}</Tag>
                                                        <Text fontSize="sm">{Math.floor(Math.random() * 1000) + 100}개</Text>
                                                    </HStack>
                                                ))}
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <Heading size="md">⭐ 인기 멤버</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <VStack align="stretch" spacing={2}>
                                                {members.slice(0, 5).map((member, index) => (
                                                    <HStack key={member.id} justify="space-between">
                                                        <HStack>
                                                            <Avatar src={member.avatar} size="sm" />
                                                            <Text fontSize="sm">{member.username}</Text>
                                                        </HStack>
                                                        <Text fontSize="sm" color="blue.500">{member.stats.followers.toLocaleString()}</Text>
                                                    </HStack>
                                                ))}
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                </Grid>
                            </VStack>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </VStack>

            {/* 프로필 모달 */}
            <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        <HStack>
                            <Avatar src={selectedMember?.avatar} size="md" />
                            <VStack align="start" spacing={0}>
                                <Text fontWeight="bold">{selectedMember?.username}</Text>
                                <Text fontSize="sm" color="gray.600">
                                    {getTypeIcon(selectedMember?.type || '')} {selectedMember?.type}
                                </Text>
                            </VStack>
                        </HStack>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedMember && (
                            <VStack align="stretch" spacing={4}>
                                <Text>{selectedMember.bio}</Text>
                                <Text fontSize="sm" color="gray.600">📍 {selectedMember.location}</Text>

                                <Divider />

                                <HStack justify="space-around">
                                    <VStack>
                                        <Text fontWeight="bold" fontSize="lg">{selectedMember.stats.followers.toLocaleString()}</Text>
                                        <Text fontSize="sm" color="gray.600">팔로워</Text>
                                    </VStack>
                                    <VStack>
                                        <Text fontWeight="bold" fontSize="lg">{selectedMember.stats.following.toLocaleString()}</Text>
                                        <Text fontSize="sm" color="gray.600">팔로잉</Text>
                                    </VStack>
                                    <VStack>
                                        <Text fontWeight="bold" fontSize="lg">{selectedMember.stats.posts}</Text>
                                        <Text fontSize="sm" color="gray.600">게시물</Text>
                                    </VStack>
                                    <VStack>
                                        <Text fontWeight="bold" fontSize="lg">{selectedMember.stats.likes.toLocaleString()}</Text>
                                        <Text fontSize="sm" color="gray.600">좋아요</Text>
                                    </VStack>
                                </HStack>

                                <Divider />

                                <Box>
                                    <Text fontWeight="bold" mb={2}>태그</Text>
                                    <Wrap spacing={1}>
                                        {selectedMember.tags.map((tag, index) => (
                                            <WrapItem key={index}>
                                                <Tag colorScheme="purple">{tag}</Tag>
                                            </WrapItem>
                                        ))}
                                    </Wrap>
                                </Box>

                                <Box>
                                    <Text fontWeight="bold" mb={2}>소셜 미디어</Text>
                                    <VStack align="start" spacing={1}>
                                        {selectedMember.socialMedia.instagram && (
                                            <Text fontSize="sm">📷 Instagram: {selectedMember.socialMedia.instagram}</Text>
                                        )}
                                        {selectedMember.socialMedia.twitter && (
                                            <Text fontSize="sm">🐦 Twitter: {selectedMember.socialMedia.twitter}</Text>
                                        )}
                                        {selectedMember.socialMedia.youtube && (
                                            <Text fontSize="sm">📺 YouTube: {selectedMember.socialMedia.youtube}</Text>
                                        )}
                                        {selectedMember.socialMedia.tiktok && (
                                            <Text fontSize="sm">🎵 TikTok: {selectedMember.socialMedia.tiktok}</Text>
                                        )}
                                    </VStack>
                                </Box>

                                <HStack spacing={2}>
                                    <Button leftIcon={<FaHeart />} colorScheme="red" flex={1}>
                                        팔로우
                                    </Button>
                                    <Button leftIcon={<FaComments />} colorScheme="blue" flex={1}>
                                        메시지
                                    </Button>
                                    <Button leftIcon={<FaShare />} colorScheme="green" flex={1}>
                                        공유
                                    </Button>
                                </HStack>
                            </VStack>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default EnhancedCommunityHub;
