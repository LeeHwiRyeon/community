import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Input,
    Select,
    Badge,
    Card,
    CardBody,
    CardHeader,
    SimpleGrid,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Image,
    IconButton,
    Tooltip,
    Alert,
    AlertIcon,
    Spinner,
    Flex,
    Spacer,
    Divider,
    Progress,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    Avatar,
    Circle
} from '@chakra-ui/react';
import {
    SearchIcon,
    FilterIcon,
    StarIcon,
    ViewIcon,
    ShoppingCartIcon,
    HeartIcon,
    ShareIcon,
    AddIcon,
    EditIcon,
    DeleteIcon,
    SettingsIcon,
    TrendingUpIcon,
    UsersIcon,
    DollarIcon,
    PlayIcon,
    PauseIcon,
    VolumeIcon,
    VolumeOffIcon,
    FullScreenIcon,
    ChatIcon,
    BellIcon
} from '@chakra-ui/icons';

interface Streamer {
    id: string;
    name: string;
    avatar: string;
    categories: string[];
    rating: number;
    followers: number;
    subscribers: number;
    isLive: boolean;
    currentViewers: number;
    description: string;
}

interface Stream {
    id: string;
    streamerId: string;
    title: string;
    description: string;
    category: string;
    thumbnail: string;
    viewers: number;
    likes: number;
    shares: number;
    comments: number;
    status: 'live' | 'offline' | 'scheduled';
    startTime: string;
    duration: number;
}

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    rating: number;
    sales: number;
    trendingScore: number;
    recommendedBy?: string;
}

interface PlatformStats {
    totalStreamers: number;
    totalViewers: number;
    totalStreams: number;
    totalProducts: number;
    totalSubscriptions: number;
    totalRevenue: number;
    averageViewers: number;
    monthlyGrowth: {
        streamers: number;
        viewers: number;
        revenue: number;
    };
}

const StreamingDashboard: React.FC = () => {
    const [streamers, setStreamers] = useState<Streamer[]>([]);
    const [streams, setStreams] = useState<Stream[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [recommendations, setRecommendations] = useState<Product[]>([]);
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sortBy, setSortBy] = useState('popularity');
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState(0);
    const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(50);
    const [isMuted, setIsMuted] = useState(false);

    const { isOpen: isStreamOpen, onOpen: onStreamOpen, onClose: onStreamClose } = useDisclosure();
    const { isOpen: isProductOpen, onOpen: onProductOpen, onClose: onProductClose } = useDisclosure();
    const { isOpen: isStreamerOpen, onOpen: onStreamerOpen, onClose: onStreamerClose } = useDisclosure();

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedStreamer, setSelectedStreamer] = useState<Streamer | null>(null);

    const toast = useToast();

    // 데이터 로드
    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // 스트리머 데이터 로드
            const streamersResponse = await fetch('/api/streaming-platform/streamers');
            const streamersData = await streamersResponse.json();
            if (streamersData.success) {
                setStreamers(streamersData.data.streamers);
            }

            // 스트림 데이터 로드
            const streamsResponse = await fetch('/api/streaming-platform/streams');
            const streamsData = await streamsResponse.json();
            if (streamsData.success) {
                setStreams(streamsData.data.streams);
            }

            // 상품 데이터 로드
            const productsResponse = await fetch('/api/streaming-platform/products');
            const productsData = await productsResponse.json();
            if (productsData.success) {
                setProducts(productsData.data.products);
            }

            // 추천 상품 로드
            const recommendationsResponse = await fetch('/api/streaming-platform/recommendations/products/current_user');
            const recommendationsData = await recommendationsResponse.json();
            if (recommendationsData.success) {
                setRecommendations(recommendationsData.data);
            }

            // 통계 데이터 로드
            const statsResponse = await fetch('/api/streaming-platform/stats');
            const statsData = await statsResponse.json();
            if (statsData.success) {
                setStats(statsData.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('데이터를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 스트림 시청
    const handleStreamClick = (stream: Stream) => {
        setSelectedStream(stream);
        onStreamOpen();
    };

    // 상품 상세 보기
    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        onProductOpen();
    };

    // 스트리머 상세 보기
    const handleStreamerClick = (streamer: Streamer) => {
        setSelectedStreamer(streamer);
        onStreamerOpen();
    };

    // 상품 구매
    const handlePurchase = (product: Product) => {
        toast({
            title: '구매 완료',
            description: `${product.name}을(를) 구매했습니다.`,
            status: 'success',
            duration: 3000,
            isClosable: true
        });
    };

    // 상품 좋아요
    const handleLike = (product: Product) => {
        toast({
            title: '좋아요 추가',
            description: `${product.name}을(를) 좋아요 목록에 추가했습니다.`,
            status: 'success',
            duration: 3000,
            isClosable: true
        });
    };

    // 스트리머 팔로우
    const handleFollow = (streamer: Streamer) => {
        toast({
            title: '팔로우 완료',
            description: `${streamer.name}을(를) 팔로우했습니다.`,
            status: 'success',
            duration: 3000,
            isClosable: true
        });
    };

    // 스트림 재생/일시정지
    const togglePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    // 음소거 토글
    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    // 검색 및 필터링
    const filteredStreams = streams.filter(stream => {
        const matchesSearch = !searchTerm ||
            stream.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            stream.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = !selectedCategory || stream.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    // 정렬
    const sortedStreams = [...filteredStreams].sort((a, b) => {
        switch (sortBy) {
            case 'viewers':
                return b.viewers - a.viewers;
            case 'likes':
                return b.likes - a.likes;
            case 'newest':
                return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
            case 'popularity':
            default:
                return b.viewers - a.viewers;
        }
    });

    // 페이지네이션
    const itemsPerPage = 12;
    const totalPages = Math.ceil(sortedStreams.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedStreams = sortedStreams.slice(startIndex, endIndex);

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        fetchData();
    }, []);

    if (isLoading && !streams.length) {
        return (
            <Box p={8} textAlign="center">
                <Spinner size="xl" />
                <Text mt={4}>스트리밍 플랫폼 데이터를 불러오는 중...</Text>
            </Box>
        );
    }

    return (
        <Box p={6}>
            {/* Header */}
            <VStack spacing={4} align="stretch" mb={8}>
                <HStack justify="space-between">
                    <Text fontSize="3xl" fontWeight="bold" color="purple.600">
                        📺 방송국 스트리밍 플랫폼
                    </Text>
                    <HStack spacing={2}>
                        <Button leftIcon={<AddIcon />} colorScheme="purple" onClick={onStreamOpen}>
                            스트림 시작
                        </Button>
                        <Button leftIcon={<SettingsIcon />} colorScheme="gray" variant="outline">
                            설정
                        </Button>
                    </HStack>
                </HStack>

                {/* 통계 카드 */}
                {stats && (
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>총 스트리머</StatLabel>
                                    <StatNumber color="purple.500">{stats.totalStreamers}</StatNumber>
                                    <StatHelpText>
                                        <StatArrow type="increase" />
                                        {stats.monthlyGrowth.streamers}%
                                    </StatHelpText>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>총 시청자</StatLabel>
                                    <StatNumber color="green.500">{stats.totalViewers.toLocaleString()}</StatNumber>
                                    <StatHelpText>
                                        <StatArrow type="increase" />
                                        {stats.monthlyGrowth.viewers}%
                                    </StatHelpText>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>총 수익</StatLabel>
                                    <StatNumber color="blue.500">${stats.totalRevenue.toLocaleString()}</StatNumber>
                                    <StatHelpText>
                                        <StatArrow type="increase" />
                                        {stats.monthlyGrowth.revenue}%
                                    </StatHelpText>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>평균 시청자</StatLabel>
                                    <StatNumber color="orange.500">{Math.round(stats.averageViewers)}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                    </SimpleGrid>
                )}
            </VStack>

            {/* Error Alert */}
            {error && (
                <Alert status="error" mb={4}>
                    <AlertIcon />
                    {error}
                </Alert>
            )}

            {/* 검색 및 필터 */}
            <Card mb={6}>
                <CardBody>
                    <HStack spacing={4} wrap="wrap">
                        <Input
                            placeholder="스트림 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            leftIcon={<SearchIcon />}
                            flex="1"
                            minW="200px"
                        />
                        <Select
                            placeholder="카테고리 선택"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            w="200px"
                        >
                            <option value="gaming">게임</option>
                            <option value="music">음악</option>
                            <option value="talk">토크</option>
                            <option value="education">교육</option>
                            <option value="lifestyle">라이프스타일</option>
                        </Select>
                        <Select
                            placeholder="정렬 기준"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            w="150px"
                        >
                            <option value="popularity">인기순</option>
                            <option value="viewers">시청자순</option>
                            <option value="likes">좋아요순</option>
                            <option value="newest">최신순</option>
                        </Select>
                        <Button leftIcon={<FilterIcon />} colorScheme="purple" variant="outline">
                            필터
                        </Button>
                    </HStack>
                </CardBody>
            </Card>

            {/* 탭 네비게이션 */}
            <Tabs index={activeTab} onChange={setActiveTab}>
                <TabList>
                    <Tab>라이브 스트림 ({streams.filter(s => s.status === 'live').length})</Tab>
                    <Tab>스트리머 ({streamers.length})</Tab>
                    <Tab>추천 상품 ({recommendations.length})</Tab>
                    <Tab>인기 상품 ({products.length})</Tab>
                </TabList>

                <TabPanels>
                    {/* 라이브 스트림 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
                            {paginatedStreams.map(stream => (
                                <Card key={stream.id} variant="outline" cursor="pointer"
                                    onClick={() => handleStreamClick(stream)}
                                    _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                                    transition="all 0.2s">
                                    <CardHeader p={0}>
                                        <Box position="relative">
                                            <Image
                                                src={stream.thumbnail || '/placeholder-stream.jpg'}
                                                alt={stream.title}
                                                w="100%"
                                                h="200px"
                                                objectFit="cover"
                                                borderRadius="md"
                                            />
                                            <HStack position="absolute" top={2} left={2}>
                                                <Badge colorScheme="red" size="sm">
                                                    LIVE
                                                </Badge>
                                                <Badge colorScheme="purple" size="sm">
                                                    {stream.category}
                                                </Badge>
                                            </HStack>
                                            <HStack position="absolute" top={2} right={2}>
                                                <HStack spacing={1} bg="blackAlpha.700" px={2} py={1} borderRadius="md">
                                                    <ViewIcon color="white" />
                                                    <Text color="white" fontSize="sm">{stream.viewers}</Text>
                                                </HStack>
                                            </HStack>
                                        </Box>
                                    </CardHeader>
                                    <CardBody p={4}>
                                        <VStack spacing={2} align="stretch">
                                            <Text fontWeight="bold" fontSize="md" noOfLines={2}>
                                                {stream.title}
                                            </Text>
                                            <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                                {stream.description}
                                            </Text>
                                            <HStack justify="space-between">
                                                <HStack spacing={1}>
                                                    <HeartIcon color="red.500" />
                                                    <Text fontSize="sm">{stream.likes}</Text>
                                                </HStack>
                                                <HStack spacing={1}>
                                                    <ShareIcon color="blue.500" />
                                                    <Text fontSize="sm">{stream.shares}</Text>
                                                </HStack>
                                                <HStack spacing={1}>
                                                    <ChatIcon color="green.500" />
                                                    <Text fontSize="sm">{stream.comments}</Text>
                                                </HStack>
                                            </HStack>
                                        </VStack>
                                    </CardBody>
                                </Card>
                            ))}
                        </SimpleGrid>

                        {/* 페이지네이션 */}
                        {totalPages > 1 && (
                            <HStack justify="center" mt={8} spacing={2}>
                                <Button
                                    size="sm"
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    isDisabled={currentPage === 1}
                                >
                                    이전
                                </Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <Button
                                        key={page}
                                        size="sm"
                                        colorScheme={page === currentPage ? "purple" : "gray"}
                                        variant={page === currentPage ? "solid" : "outline"}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </Button>
                                ))}
                                <Button
                                    size="sm"
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    isDisabled={currentPage === totalPages}
                                >
                                    다음
                                </Button>
                            </HStack>
                        )}
                    </TabPanel>

                    {/* 스트리머 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                            {streamers.map(streamer => (
                                <Card key={streamer.id} variant="outline" cursor="pointer"
                                    onClick={() => handleStreamerClick(streamer)}
                                    _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                                    transition="all 0.2s">
                                    <CardBody p={4}>
                                        <VStack spacing={3}>
                                            <Box position="relative">
                                                <Avatar
                                                    src={streamer.avatar}
                                                    size="xl"
                                                    name={streamer.name}
                                                />
                                                {streamer.isLive && (
                                                    <Circle
                                                        position="absolute"
                                                        bottom={0}
                                                        right={0}
                                                        size="20px"
                                                        bg="red.500"
                                                        border="2px solid white"
                                                    />
                                                )}
                                            </Box>
                                            <VStack spacing={1}>
                                                <Text fontWeight="bold" fontSize="lg">
                                                    {streamer.name}
                                                </Text>
                                                <HStack spacing={1}>
                                                    <StarIcon color="yellow.400" />
                                                    <Text fontSize="sm">{streamer.rating}</Text>
                                                </HStack>
                                                <HStack spacing={4} fontSize="sm" color="gray.600">
                                                    <Text>팔로워 {streamer.followers.toLocaleString()}</Text>
                                                    <Text>구독자 {streamer.subscribers.toLocaleString()}</Text>
                                                </HStack>
                                                {streamer.isLive && (
                                                    <HStack spacing={1}>
                                                        <ViewIcon color="red.500" />
                                                        <Text fontSize="sm" color="red.500">
                                                            {streamer.currentViewers}명 시청 중
                                                        </Text>
                                                    </HStack>
                                                )}
                                                <HStack spacing={1} wrap="wrap" justify="center">
                                                    {streamer.categories.slice(0, 3).map(category => (
                                                        <Badge key={category} colorScheme="purple" size="sm">
                                                            {category}
                                                        </Badge>
                                                    ))}
                                                </HStack>
                                            </VStack>
                                        </VStack>
                                    </CardBody>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </TabPanel>

                    {/* 추천 상품 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
                            {recommendations.map(product => (
                                <Card key={product.id} variant="outline" cursor="pointer"
                                    onClick={() => handleProductClick(product)}
                                    _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                                    transition="all 0.2s">
                                    <CardHeader p={0}>
                                        <Box position="relative">
                                            <Image
                                                src={product.image || '/placeholder-product.jpg'}
                                                alt={product.name}
                                                w="100%"
                                                h="200px"
                                                objectFit="cover"
                                                borderRadius="md"
                                            />
                                            <HStack position="absolute" top={2} right={2}>
                                                <IconButton
                                                    size="sm"
                                                    colorScheme="red"
                                                    icon={<HeartIcon />}
                                                    aria-label="Add to favorites"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleLike(product);
                                                    }}
                                                />
                                                <IconButton
                                                    size="sm"
                                                    colorScheme="blue"
                                                    icon={<ShareIcon />}
                                                    aria-label="Share"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </HStack>
                                            {product.trendingScore > 50 && (
                                                <Badge position="absolute" top={2} left={2} colorScheme="red">
                                                    트렌딩
                                                </Badge>
                                            )}
                                        </Box>
                                    </CardHeader>
                                    <CardBody p={4}>
                                        <VStack spacing={2} align="stretch">
                                            <Text fontWeight="bold" fontSize="md" noOfLines={2}>
                                                {product.name}
                                            </Text>
                                            <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                                {product.description}
                                            </Text>
                                            <HStack justify="space-between">
                                                <Text fontSize="lg" fontWeight="bold" color="purple.600">
                                                    ${product.price}
                                                </Text>
                                                <HStack spacing={1}>
                                                    <StarIcon color="yellow.400" />
                                                    <Text fontSize="sm">{product.rating}</Text>
                                                </HStack>
                                            </HStack>
                                            <HStack justify="space-between" fontSize="sm" color="gray.500">
                                                <Text>판매 {product.sales}</Text>
                                                <Text>트렌딩 {product.trendingScore}</Text>
                                            </HStack>
                                            <Button
                                                colorScheme="purple"
                                                size="sm"
                                                leftIcon={<ShoppingCartIcon />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePurchase(product);
                                                }}
                                            >
                                                구매하기
                                            </Button>
                                        </VStack>
                                    </CardBody>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </TabPanel>

                    {/* 인기 상품 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
                            {products.map(product => (
                                <Card key={product.id} variant="outline" cursor="pointer"
                                    onClick={() => handleProductClick(product)}
                                    _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                                    transition="all 0.2s">
                                    <CardHeader p={0}>
                                        <Box position="relative">
                                            <Image
                                                src={product.image || '/placeholder-product.jpg'}
                                                alt={product.name}
                                                w="100%"
                                                h="200px"
                                                objectFit="cover"
                                                borderRadius="md"
                                            />
                                            <HStack position="absolute" top={2} right={2}>
                                                <IconButton
                                                    size="sm"
                                                    colorScheme="red"
                                                    icon={<HeartIcon />}
                                                    aria-label="Add to favorites"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleLike(product);
                                                    }}
                                                />
                                                <IconButton
                                                    size="sm"
                                                    colorScheme="blue"
                                                    icon={<ShareIcon />}
                                                    aria-label="Share"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </HStack>
                                        </Box>
                                    </CardHeader>
                                    <CardBody p={4}>
                                        <VStack spacing={2} align="stretch">
                                            <Text fontWeight="bold" fontSize="md" noOfLines={2}>
                                                {product.name}
                                            </Text>
                                            <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                                {product.description}
                                            </Text>
                                            <HStack justify="space-between">
                                                <Text fontSize="lg" fontWeight="bold" color="purple.600">
                                                    ${product.price}
                                                </Text>
                                                <HStack spacing={1}>
                                                    <StarIcon color="yellow.400" />
                                                    <Text fontSize="sm">{product.rating}</Text>
                                                </HStack>
                                            </HStack>
                                            <HStack justify="space-between" fontSize="sm" color="gray.500">
                                                <Text>판매 {product.sales}</Text>
                                                <Text>카테고리 {product.category}</Text>
                                            </HStack>
                                            <Button
                                                colorScheme="purple"
                                                size="sm"
                                                leftIcon={<ShoppingCartIcon />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePurchase(product);
                                                }}
                                            >
                                                구매하기
                                            </Button>
                                        </VStack>
                                    </CardBody>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            {/* 스트림 시청 모달 */}
            <Modal isOpen={isStreamOpen} onClose={onStreamClose} size="full">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        <HStack justify="space-between">
                            <Text>{selectedStream?.title}</Text>
                            <HStack spacing={2}>
                                <Badge colorScheme="red">LIVE</Badge>
                                <HStack spacing={1}>
                                    <ViewIcon />
                                    <Text>{selectedStream?.viewers}</Text>
                                </HStack>
                            </HStack>
                        </HStack>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedStream && (
                            <VStack spacing={4} align="stretch">
                                {/* 비디오 플레이어 */}
                                <Box position="relative" bg="black" borderRadius="md" overflow="hidden">
                                    <Box
                                        w="100%"
                                        h="500px"
                                        bg="gray.800"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        color="white"
                                    >
                                        <VStack spacing={4}>
                                            <IconButton
                                                size="lg"
                                                colorScheme="purple"
                                                icon={isPlaying ? <PauseIcon /> : <PlayIcon />}
                                                onClick={togglePlayPause}
                                                aria-label={isPlaying ? "Pause" : "Play"}
                                            />
                                            <Text>스트림 플레이어</Text>
                                        </VStack>
                                    </Box>

                                    {/* 플레이어 컨트롤 */}
                                    <HStack
                                        position="absolute"
                                        bottom={4}
                                        left={4}
                                        right={4}
                                        bg="blackAlpha.700"
                                        p={2}
                                        borderRadius="md"
                                        justify="space-between"
                                    >
                                        <HStack spacing={2}>
                                            <IconButton
                                                size="sm"
                                                colorScheme="white"
                                                icon={isPlaying ? <PauseIcon /> : <PlayIcon />}
                                                onClick={togglePlayPause}
                                                aria-label={isPlaying ? "Pause" : "Play"}
                                            />
                                            <IconButton
                                                size="sm"
                                                colorScheme="white"
                                                icon={isMuted ? <VolumeOffIcon /> : <VolumeIcon />}
                                                onClick={toggleMute}
                                                aria-label={isMuted ? "Unmute" : "Mute"}
                                            />
                                            <Text color="white" fontSize="sm">
                                                {isMuted ? '음소거' : `${volume}%`}
                                            </Text>
                                        </HStack>
                                        <HStack spacing={2}>
                                            <IconButton
                                                size="sm"
                                                colorScheme="white"
                                                icon={<FullScreenIcon />}
                                                aria-label="Full screen"
                                            />
                                        </HStack>
                                    </HStack>
                                </Box>

                                {/* 스트림 정보 */}
                                <HStack justify="space-between">
                                    <VStack align="start" spacing={1}>
                                        <Text fontWeight="bold" fontSize="lg">
                                            {selectedStream.title}
                                        </Text>
                                        <Text color="gray.600">
                                            {selectedStream.description}
                                        </Text>
                                        <HStack spacing={4}>
                                            <Badge colorScheme="purple">{selectedStream.category}</Badge>
                                            <Text fontSize="sm" color="gray.500">
                                                {selectedStream.viewers}명 시청 중
                                            </Text>
                                        </HStack>
                                    </VStack>
                                    <HStack spacing={2}>
                                        <Button leftIcon={<HeartIcon />} colorScheme="red" variant="outline">
                                            {selectedStream.likes}
                                        </Button>
                                        <Button leftIcon={<ShareIcon />} colorScheme="blue" variant="outline">
                                            {selectedStream.shares}
                                        </Button>
                                        <Button leftIcon={<ChatIcon />} colorScheme="green" variant="outline">
                                            {selectedStream.comments}
                                        </Button>
                                    </HStack>
                                </HStack>

                                {/* 채팅 및 상품 추천 */}
                                <HStack spacing={4} align="start">
                                    {/* 채팅 */}
                                    <Box flex="1">
                                        <Text fontWeight="bold" mb={2}>채팅</Text>
                                        <Box
                                            h="200px"
                                            bg="gray.50"
                                            p={4}
                                            borderRadius="md"
                                            overflow="auto"
                                        >
                                            <Text color="gray.500">채팅이 여기에 표시됩니다.</Text>
                                        </Box>
                                    </Box>

                                    {/* 추천 상품 */}
                                    <Box w="300px">
                                        <Text fontWeight="bold" mb={2}>추천 상품</Text>
                                        <VStack spacing={2} align="stretch">
                                            {recommendations.slice(0, 3).map(product => (
                                                <Card key={product.id} size="sm" cursor="pointer"
                                                    onClick={() => handleProductClick(product)}>
                                                    <CardBody p={2}>
                                                        <HStack spacing={2}>
                                                            <Image
                                                                src={product.image}
                                                                alt={product.name}
                                                                w="50px"
                                                                h="50px"
                                                                objectFit="cover"
                                                                borderRadius="md"
                                                            />
                                                            <VStack align="start" spacing={1} flex="1">
                                                                <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
                                                                    {product.name}
                                                                </Text>
                                                                <Text fontSize="sm" color="purple.600" fontWeight="bold">
                                                                    ${product.price}
                                                                </Text>
                                                            </VStack>
                                                        </HStack>
                                                    </CardBody>
                                                </Card>
                                            ))}
                                        </VStack>
                                    </Box>
                                </HStack>
                            </VStack>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 상품 상세 모달 */}
            <Modal isOpen={isProductOpen} onClose={onProductClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>{selectedProduct?.name}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedProduct && (
                            <VStack spacing={4} align="stretch">
                                <Image
                                    src={selectedProduct.image || '/placeholder-product.jpg'}
                                    alt={selectedProduct.name}
                                    w="100%"
                                    h="300px"
                                    objectFit="cover"
                                    borderRadius="md"
                                />
                                <Text>{selectedProduct.description}</Text>
                                <HStack justify="space-between">
                                    <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                                        ${selectedProduct.price}
                                    </Text>
                                    <HStack spacing={1}>
                                        <StarIcon color="yellow.400" />
                                        <Text>{selectedProduct.rating}</Text>
                                    </HStack>
                                </HStack>
                                <HStack spacing={2}>
                                    <Button colorScheme="purple" flex="1">
                                        구매하기
                                    </Button>
                                    <Button colorScheme="purple" variant="outline" flex="1">
                                        장바구니
                                    </Button>
                                </HStack>
                            </VStack>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 스트리머 상세 모달 */}
            <Modal isOpen={isStreamerOpen} onClose={onStreamerClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>{selectedStreamer?.name}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedStreamer && (
                            <VStack spacing={4} align="stretch">
                                <HStack spacing={4}>
                                    <Avatar
                                        src={selectedStreamer.avatar}
                                        size="xl"
                                        name={selectedStreamer.name}
                                    />
                                    <VStack align="start" spacing={2}>
                                        <Text fontSize="xl" fontWeight="bold">
                                            {selectedStreamer.name}
                                        </Text>
                                        <HStack spacing={1}>
                                            <StarIcon color="yellow.400" />
                                            <Text>{selectedStreamer.rating}</Text>
                                        </HStack>
                                        <HStack spacing={4} color="gray.600">
                                            <Text>팔로워 {selectedStreamer.followers.toLocaleString()}</Text>
                                            <Text>구독자 {selectedStreamer.subscribers.toLocaleString()}</Text>
                                        </HStack>
                                        {selectedStreamer.isLive && (
                                            <HStack spacing={1}>
                                                <ViewIcon color="red.500" />
                                                <Text color="red.500">
                                                    {selectedStreamer.currentViewers}명 시청 중
                                                </Text>
                                            </HStack>
                                        )}
                                    </VStack>
                                </HStack>
                                <Divider />
                                <Text>{selectedStreamer.description}</Text>
                                <Text fontWeight="bold">전문 분야</Text>
                                <HStack spacing={2} wrap="wrap">
                                    {selectedStreamer.categories.map(category => (
                                        <Badge key={category} colorScheme="purple">
                                            {category}
                                        </Badge>
                                    ))}
                                </HStack>
                                <HStack spacing={2}>
                                    <Button colorScheme="purple" flex="1" onClick={() => handleFollow(selectedStreamer)}>
                                        팔로우
                                    </Button>
                                    <Button colorScheme="purple" variant="outline" flex="1">
                                        구독
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

export default StreamingDashboard;
