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
    StatArrow
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
    DollarIcon
} from '@chakra-ui/icons';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    images: string[];
    rating: number;
    reviewCount: number;
    views: number;
    sales: number;
    tags: string[];
    manufacturer: string;
    cosplayer?: string;
    createdAt: string;
}

interface Cosplayer {
    id: string;
    name: string;
    avatar: string;
    specialties: string[];
    rating: number;
    followers: number;
    portfolio: string[];
    isOnline: boolean;
}

interface Manufacturer {
    id: string;
    name: string;
    logo: string;
    description: string;
    categories: string[];
    verified: boolean;
    rating: number;
    productCount: number;
}

interface StoreStats {
    totalProducts: number;
    totalCosplayers: number;
    totalManufacturers: number;
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    monthlyGrowth: {
        products: number;
        orders: number;
        revenue: number;
    };
}

const CosplayStoreDashboard: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [cosplayers, setCosplayers] = useState<Cosplayer[]>([]);
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
    const [stats, setStats] = useState<StoreStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sortBy, setSortBy] = useState('popularity');
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState(0);

    const { isOpen: isProductOpen, onOpen: onProductOpen, onClose: onProductClose } = useDisclosure();
    const { isOpen: isCosplayerOpen, onOpen: onCosplayerOpen, onClose: onCosplayerClose } = useDisclosure();
    const { isOpen: isManufacturerOpen, onOpen: onManufacturerOpen, onClose: onManufacturerClose } = useDisclosure();

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedCosplayer, setSelectedCosplayer] = useState<Cosplayer | null>(null);
    const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null);

    const toast = useToast();

    // 데이터 로드
    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // 제품 데이터 로드
            const productsResponse = await fetch('/api/cosplay-store/products');
            const productsData = await productsResponse.json();
            if (productsData.success) {
                setProducts(productsData.data.products);
            }

            // 코스플레이어 데이터 로드
            const cosplayersResponse = await fetch('/api/cosplay-store/cosplayers');
            const cosplayersData = await cosplayersResponse.json();
            if (cosplayersData.success) {
                setCosplayers(cosplayersData.data.cosplayers);
            }

            // 제작사 데이터 로드
            const manufacturersResponse = await fetch('/api/cosplay-store/manufacturers');
            const manufacturersData = await manufacturersResponse.json();
            if (manufacturersData.success) {
                setManufacturers(manufacturersData.data.manufacturers);
            }

            // 통계 데이터 로드
            const statsResponse = await fetch('/api/cosplay-store/stats');
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

    // 제품 상세 보기
    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        onProductOpen();
    };

    // 코스플레이어 상세 보기
    const handleCosplayerClick = (cosplayer: Cosplayer) => {
        setSelectedCosplayer(cosplayer);
        onCosplayerOpen();
    };

    // 제작사 상세 보기
    const handleManufacturerClick = (manufacturer: Manufacturer) => {
        setSelectedManufacturer(manufacturer);
        onManufacturerOpen();
    };

    // 장바구니에 추가
    const handleAddToCart = (product: Product) => {
        toast({
            title: '장바구니에 추가됨',
            description: `${product.name}이(가) 장바구니에 추가되었습니다.`,
            status: 'success',
            duration: 3000,
            isClosable: true
        });
    };

    // 즐겨찾기 추가
    const handleAddToFavorites = (product: Product) => {
        toast({
            title: '즐겨찾기 추가됨',
            description: `${product.name}이(가) 즐겨찾기에 추가되었습니다.`,
            status: 'success',
            duration: 3000,
            isClosable: true
        });
    };

    // 검색 및 필터링
    const filteredProducts = products.filter(product => {
        const matchesSearch = !searchTerm ||
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = !selectedCategory || product.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    // 정렬
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortBy) {
            case 'price_asc':
                return a.price - b.price;
            case 'price_desc':
                return b.price - a.price;
            case 'rating':
                return b.rating - a.rating;
            case 'newest':
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case 'popularity':
            default:
                return b.views - a.views;
        }
    });

    // 페이지네이션
    const itemsPerPage = 12;
    const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = sortedProducts.slice(startIndex, endIndex);

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        fetchData();
    }, []);

    if (isLoading && !products.length) {
        return (
            <Box p={8} textAlign="center">
                <Spinner size="xl" />
                <Text mt={4}>코스프레 상점 데이터를 불러오는 중...</Text>
            </Box>
        );
    }

    return (
        <Box p={6}>
            {/* Header */}
            <VStack spacing={4} align="stretch" mb={8}>
                <HStack justify="space-between">
                    <Text fontSize="3xl" fontWeight="bold" color="purple.600">
                        🎭 코스프레 상점
                    </Text>
                    <HStack spacing={2}>
                        <Button leftIcon={<AddIcon />} colorScheme="purple" onClick={onProductOpen}>
                            제품 등록
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
                                    <StatLabel>총 제품</StatLabel>
                                    <StatNumber color="purple.500">{stats.totalProducts}</StatNumber>
                                    <StatHelpText>
                                        <StatArrow type="increase" />
                                        {stats.monthlyGrowth.products}%
                                    </StatHelpText>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>총 주문</StatLabel>
                                    <StatNumber color="green.500">{stats.totalOrders}</StatNumber>
                                    <StatHelpText>
                                        <StatArrow type="increase" />
                                        {stats.monthlyGrowth.orders}%
                                    </StatHelpText>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>총 매출</StatLabel>
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
                                    <StatLabel>평균 주문액</StatLabel>
                                    <StatNumber color="orange.500">${stats.averageOrderValue.toFixed(2)}</StatNumber>
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
                            placeholder="제품 검색..."
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
                            <option value="anime">애니메이션</option>
                            <option value="game">게임</option>
                            <option value="manga">만화</option>
                            <option value="movie">영화</option>
                            <option value="drama">드라마</option>
                        </Select>
                        <Select
                            placeholder="정렬 기준"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            w="150px"
                        >
                            <option value="popularity">인기순</option>
                            <option value="newest">최신순</option>
                            <option value="rating">평점순</option>
                            <option value="price_asc">가격 낮은순</option>
                            <option value="price_desc">가격 높은순</option>
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
                    <Tab>제품 ({products.length})</Tab>
                    <Tab>코스플레이어 ({cosplayers.length})</Tab>
                    <Tab>제작사 ({manufacturers.length})</Tab>
                </TabList>

                <TabPanels>
                    {/* 제품 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
                            {paginatedProducts.map(product => (
                                <Card key={product.id} variant="outline" cursor="pointer"
                                    onClick={() => handleProductClick(product)}
                                    _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                                    transition="all 0.2s">
                                    <CardHeader p={0}>
                                        <Box position="relative">
                                            <Image
                                                src={product.images[0] || '/placeholder-product.jpg'}
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
                                                        handleAddToFavorites(product);
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
                                                    <Text fontSize="sm" color="gray.500">
                                                        ({product.reviewCount})
                                                    </Text>
                                                </HStack>
                                            </HStack>
                                            <HStack justify="space-between" fontSize="sm" color="gray.500">
                                                <Text>조회 {product.views}</Text>
                                                <Text>판매 {product.sales}</Text>
                                            </HStack>
                                            <Button
                                                colorScheme="purple"
                                                size="sm"
                                                leftIcon={<ShoppingCartIcon />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAddToCart(product);
                                                }}
                                            >
                                                장바구니
                                            </Button>
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

                    {/* 코스플레이어 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                            {cosplayers.map(cosplayer => (
                                <Card key={cosplayer.id} variant="outline" cursor="pointer"
                                    onClick={() => handleCosplayerClick(cosplayer)}
                                    _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                                    transition="all 0.2s">
                                    <CardBody p={4}>
                                        <VStack spacing={3}>
                                            <Box position="relative">
                                                <Image
                                                    src={cosplayer.avatar}
                                                    alt={cosplayer.name}
                                                    w="100px"
                                                    h="100px"
                                                    borderRadius="full"
                                                    objectFit="cover"
                                                />
                                                {cosplayer.isOnline && (
                                                    <Box
                                                        position="absolute"
                                                        bottom={2}
                                                        right={2}
                                                        w="20px"
                                                        h="20px"
                                                        bg="green.500"
                                                        borderRadius="full"
                                                        border="2px solid white"
                                                    />
                                                )}
                                            </Box>
                                            <VStack spacing={1}>
                                                <Text fontWeight="bold" fontSize="lg">
                                                    {cosplayer.name}
                                                </Text>
                                                <HStack spacing={1}>
                                                    <StarIcon color="yellow.400" />
                                                    <Text fontSize="sm">{cosplayer.rating}</Text>
                                                </HStack>
                                                <Text fontSize="sm" color="gray.600">
                                                    팔로워 {cosplayer.followers.toLocaleString()}
                                                </Text>
                                                <HStack spacing={1} wrap="wrap" justify="center">
                                                    {cosplayer.specialties.slice(0, 3).map(specialty => (
                                                        <Badge key={specialty} colorScheme="purple" size="sm">
                                                            {specialty}
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

                    {/* 제작사 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                            {manufacturers.map(manufacturer => (
                                <Card key={manufacturer.id} variant="outline" cursor="pointer"
                                    onClick={() => handleManufacturerClick(manufacturer)}
                                    _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                                    transition="all 0.2s">
                                    <CardBody p={4}>
                                        <VStack spacing={3}>
                                            <Image
                                                src={manufacturer.logo}
                                                alt={manufacturer.name}
                                                w="80px"
                                                h="80px"
                                                objectFit="contain"
                                            />
                                            <VStack spacing={1}>
                                                <HStack>
                                                    <Text fontWeight="bold" fontSize="lg">
                                                        {manufacturer.name}
                                                    </Text>
                                                    {manufacturer.verified && (
                                                        <Badge colorScheme="green" size="sm">
                                                            인증
                                                        </Badge>
                                                    )}
                                                </HStack>
                                                <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                                    {manufacturer.description}
                                                </Text>
                                                <HStack spacing={1}>
                                                    <StarIcon color="yellow.400" />
                                                    <Text fontSize="sm">{manufacturer.rating}</Text>
                                                </HStack>
                                                <Text fontSize="sm" color="gray.600">
                                                    제품 {manufacturer.productCount}개
                                                </Text>
                                                <HStack spacing={1} wrap="wrap" justify="center">
                                                    {manufacturer.categories.slice(0, 3).map(category => (
                                                        <Badge key={category} colorScheme="blue" size="sm">
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
                </TabPanels>
            </Tabs>

            {/* 제품 상세 모달 */}
            <Modal isOpen={isProductOpen} onClose={onProductClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>{selectedProduct?.name}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedProduct && (
                            <VStack spacing={4} align="stretch">
                                <Image
                                    src={selectedProduct.images[0] || '/placeholder-product.jpg'}
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
                                        <Text color="gray.500">({selectedProduct.reviewCount})</Text>
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

            {/* 코스플레이어 상세 모달 */}
            <Modal isOpen={isCosplayerOpen} onClose={onCosplayerClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>{selectedCosplayer?.name}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedCosplayer && (
                            <VStack spacing={4} align="stretch">
                                <HStack spacing={4}>
                                    <Image
                                        src={selectedCosplayer.avatar}
                                        alt={selectedCosplayer.name}
                                        w="100px"
                                        h="100px"
                                        borderRadius="full"
                                        objectFit="cover"
                                    />
                                    <VStack align="start" spacing={2}>
                                        <Text fontSize="xl" fontWeight="bold">
                                            {selectedCosplayer.name}
                                        </Text>
                                        <HStack spacing={1}>
                                            <StarIcon color="yellow.400" />
                                            <Text>{selectedCosplayer.rating}</Text>
                                        </HStack>
                                        <Text color="gray.600">
                                            팔로워 {selectedCosplayer.followers.toLocaleString()}
                                        </Text>
                                    </VStack>
                                </HStack>
                                <Divider />
                                <Text fontWeight="bold">전문 분야</Text>
                                <HStack spacing={2} wrap="wrap">
                                    {selectedCosplayer.specialties.map(specialty => (
                                        <Badge key={specialty} colorScheme="purple">
                                            {specialty}
                                        </Badge>
                                    ))}
                                </HStack>
                                <HStack spacing={2}>
                                    <Button colorScheme="purple" flex="1">
                                        팔로우
                                    </Button>
                                    <Button colorScheme="purple" variant="outline" flex="1">
                                        메시지
                                    </Button>
                                </HStack>
                            </VStack>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 제작사 상세 모달 */}
            <Modal isOpen={isManufacturerOpen} onClose={onManufacturerClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>{selectedManufacturer?.name}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedManufacturer && (
                            <VStack spacing={4} align="stretch">
                                <HStack spacing={4}>
                                    <Image
                                        src={selectedManufacturer.logo}
                                        alt={selectedManufacturer.name}
                                        w="100px"
                                        h="100px"
                                        objectFit="contain"
                                    />
                                    <VStack align="start" spacing={2}>
                                        <HStack>
                                            <Text fontSize="xl" fontWeight="bold">
                                                {selectedManufacturer.name}
                                            </Text>
                                            {selectedManufacturer.verified && (
                                                <Badge colorScheme="green">인증</Badge>
                                            )}
                                        </HStack>
                                        <HStack spacing={1}>
                                            <StarIcon color="yellow.400" />
                                            <Text>{selectedManufacturer.rating}</Text>
                                        </HStack>
                                        <Text color="gray.600">
                                            제품 {selectedManufacturer.productCount}개
                                        </Text>
                                    </VStack>
                                </HStack>
                                <Divider />
                                <Text>{selectedManufacturer.description}</Text>
                                <Text fontWeight="bold">제품 카테고리</Text>
                                <HStack spacing={2} wrap="wrap">
                                    {selectedManufacturer.categories.map(category => (
                                        <Badge key={category} colorScheme="blue">
                                            {category}
                                        </Badge>
                                    ))}
                                </HStack>
                                <HStack spacing={2}>
                                    <Button colorScheme="purple" flex="1">
                                        제품 보기
                                    </Button>
                                    <Button colorScheme="purple" variant="outline" flex="1">
                                        문의하기
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

export default CosplayStoreDashboard;
