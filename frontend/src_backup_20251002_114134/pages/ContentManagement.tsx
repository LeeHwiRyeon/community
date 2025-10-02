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
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    FormControl,
    FormLabel,
    Input,
    Select,
    Textarea,
    Switch,
    Divider,
    Flex,
    Spacer,
    Wrap,
    WrapItem,
    Tag,
    TagLabel,
    TagCloseButton,
    useColorModeValue,
    Alert,
    AlertIcon,
    Progress,
    CircularProgress,
    CircularProgressLabel,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    List,
    ListItem,
    ListIcon,
    OrderedList,
    UnorderedList,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    SimpleGrid,
    Grid,
    GridItem,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    DrawerFooter,
    ButtonGroup,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverArrow,
    PopoverCloseButton,
    PopoverHeader,
    PopoverBody,
    Tooltip,
    Avatar,
    AvatarGroup,
    Image,
    Link,
    Code,
    Kbd,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    AlertDialogCloseButton,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    SliderMark,
    RangeSlider,
    RangeSliderTrack,
    RangeSliderFilledTrack,
    RangeSliderThumb,
    Checkbox,
    CheckboxGroup,
    Radio,
    RadioGroup,
    Stack,
    Container,
    Heading,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    Spinner,
    Skeleton,
    SkeletonText,
    SkeletonCircle,
    SkeletonBox,
    AspectRatio,
    Center,
    Square,
    Circle,
    Triangle,
    Polygon,
    Star,
    Heart,
    Diamond,
    Hexagon,
    Octagon,
    Pentagon,
    Trapezoid,
    Parallelogram,
    Rhombus,
    Kite,
    Arrow,
    ArrowUpIcon,
    ArrowDownIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronIcon,
    TriangleUpIcon,
    TriangleDownIcon,
    TriangleLeftIcon,
    TriangleRightIcon,
    TriangleIcon,
    PlusIcon,
    MinusIcon,
    CloseIcon,
    CheckIcon,
    InfoIcon,
    WarningIcon,
    QuestionIcon,
    SearchIcon,
    EditIcon,
    DeleteIcon,
    ViewIcon,
    ViewOffIcon,
    AddIcon,
    SettingsIcon,
    HamburgerIcon,
    BellIcon,
    EmailIcon,
    PhoneIcon,
    CalendarIcon,
    TimeIcon,
    LocationIcon,
    LinkIcon,
    ExternalLinkIcon,
    DownloadIcon,
    UploadIcon,
    CopyIcon,
    AttachmentIcon,
    StarIcon,
    AtSignIcon,
    LockIcon,
    UnlockIcon,
    RepeatIcon,
    RepeatClockIcon,
    RepeatIcon as Repeat,
    RepeatClockIcon as RepeatClock,
    RepeatIcon as RepeatIcon,
    RepeatClockIcon as RepeatClockIcon,
    RepeatIcon as RepeatIcon2,
    RepeatClockIcon as RepeatClockIcon2,
    RepeatIcon as RepeatIcon3,
    RepeatClockIcon as RepeatClockIcon3,
    RepeatIcon as RepeatIcon4,
    RepeatClockIcon as RepeatClockIcon4,
    RepeatIcon as RepeatIcon5,
    RepeatClockIcon as RepeatClockIcon5,
    RepeatIcon as RepeatIcon6,
    RepeatClockIcon as RepeatClockIcon6,
    RepeatIcon as RepeatIcon7,
    RepeatClockIcon as RepeatClockIcon7,
    RepeatIcon as RepeatIcon8,
    RepeatClockIcon as RepeatClockIcon8,
    RepeatIcon as RepeatIcon9,
    RepeatClockIcon as RepeatClockIcon9,
    RepeatIcon as RepeatIcon10,
    RepeatClockIcon as RepeatClockIcon10
} from '@chakra-ui/react';

interface ContentItem {
    id: string;
    title: string;
    type: string;
    status: string;
    author: string;
    category: string;
    tags: string[];
    viewCount: number;
    likeCount: number;
    commentCount: number;
    createdAt: string;
    lastModified: string;
    isFeatured: boolean;
    isPinned: boolean;
}

interface ContentStats {
    total: number;
    published: number;
    draft: number;
    archived: number;
    deleted: number;
    featured: number;
    pinned: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    byAuthor: Record<string, number>;
    recentActivity: ContentItem[];
}

const ContentManagement: React.FC = () => {
    const [contents, setContents] = useState<ContentItem[]>([]);
    const [stats, setStats] = useState<ContentStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
    const [filters, setFilters] = useState({
        type: '',
        status: '',
        category: '',
        author: '',
        search: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
    });

    const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
    const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    const { isOpen: isStatsOpen, onOpen: onStatsOpen, onClose: onStatsClose } = useDisclosure();

    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // 컨텐츠 목록 조회
    const fetchContents = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...filters
            });

            const response = await fetch(`/api/content-management?${params}`);
            const data = await response.json();

            if (data.success) {
                setContents(data.data.contents);
                setPagination(data.data.pagination);
            }
        } catch (error) {
            console.error('컨텐츠 목록 조회 오류:', error);
            toast({
                title: '오류 발생',
                description: '컨텐츠 목록을 불러오는데 실패했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        } finally {
            setLoading(false);
        }
    };

    // 통계 조회
    const fetchStats = async () => {
        try {
            const response = await fetch('/api/content-management/stats/overview');
            const data = await response.json();

            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('통계 조회 오류:', error);
        }
    };

    // 컨텐츠 상태 변경
    const changeContentStatus = async (id: string, status: string) => {
        try {
            const response = await fetch(`/api/content-management/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status })
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: '상태 변경 완료',
                    description: `컨텐츠 상태가 ${status}로 변경되었습니다.`,
                    status: 'success',
                    duration: 2000,
                    isClosable: true
                });
                fetchContents();
            }
        } catch (error) {
            console.error('상태 변경 오류:', error);
            toast({
                title: '오류 발생',
                description: '상태 변경에 실패했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 컨텐츠 삭제
    const deleteContent = async (id: string) => {
        try {
            const response = await fetch(`/api/content-management/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: '삭제 완료',
                    description: '컨텐츠가 삭제되었습니다.',
                    status: 'success',
                    duration: 2000,
                    isClosable: true
                });
                fetchContents();
                onDeleteClose();
            }
        } catch (error) {
            console.error('삭제 오류:', error);
            toast({
                title: '오류 발생',
                description: '삭제에 실패했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 필터 적용
    const applyFilters = () => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchContents();
    };

    // 필터 초기화
    const resetFilters = () => {
        setFilters({
            type: '',
            status: '',
            category: '',
            author: '',
            search: ''
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    useEffect(() => {
        fetchContents();
        fetchStats();
    }, [pagination.page, pagination.limit]);

    const getStatusColor = (status: string) => {
        const colors = {
            'draft': 'gray',
            'published': 'green',
            'archived': 'blue',
            'deleted': 'red'
        };
        return colors[status as keyof typeof colors] || 'gray';
    };

    const getTypeColor = (type: string) => {
        const colors = {
            'post': 'blue',
            'page': 'purple',
            'article': 'green',
            'media': 'orange'
        };
        return colors[type as keyof typeof colors] || 'gray';
    };

    return (
        <Box p={6}>
            <VStack spacing={6} align="stretch">
                {/* 헤더 */}
                <Flex justify="space-between" align="center">
                    <VStack align="start" spacing={2}>
                        <Heading size="lg">컨텐츠 관리</Heading>
                        <Text color="gray.600">컨텐츠를 생성, 수정, 관리하세요</Text>
                    </VStack>
                    <HStack spacing={3}>
                        <Button
                            leftIcon={<SettingsIcon />}
                            variant="outline"
                            onClick={onStatsOpen}
                        >
                            통계
                        </Button>
                        <Button
                            leftIcon={<AddIcon />}
                            colorScheme="blue"
                            onClick={onCreateOpen}
                        >
                            새 컨텐츠
                        </Button>
                    </HStack>
                </Flex>

                {/* 통계 카드 */}
                {stats && (
                    <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4}>
                        <Card>
                            <CardBody>
                                <Stat>
                                    <StatLabel>전체</StatLabel>
                                    <StatNumber>{stats.total}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody>
                                <Stat>
                                    <StatLabel>발행됨</StatLabel>
                                    <StatNumber color="green.500">{stats.published}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody>
                                <Stat>
                                    <StatLabel>초안</StatLabel>
                                    <StatNumber color="gray.500">{stats.draft}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody>
                                <Stat>
                                    <StatLabel>조회수</StatLabel>
                                    <StatNumber>{stats.totalViews.toLocaleString()}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody>
                                <Stat>
                                    <StatLabel>좋아요</StatLabel>
                                    <StatNumber>{stats.totalLikes.toLocaleString()}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody>
                                <Stat>
                                    <StatLabel>댓글</StatLabel>
                                    <StatNumber>{stats.totalComments.toLocaleString()}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                    </SimpleGrid>
                )}

                {/* 필터 */}
                <Card>
                    <CardBody>
                        <VStack spacing={4}>
                            <HStack spacing={4} wrap="wrap" width="100%">
                                <FormControl maxW="200px">
                                    <FormLabel>타입</FormLabel>
                                    <Select
                                        value={filters.type}
                                        onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                                    >
                                        <option value="">전체</option>
                                        <option value="post">포스트</option>
                                        <option value="page">페이지</option>
                                        <option value="article">기사</option>
                                        <option value="media">미디어</option>
                                    </Select>
                                </FormControl>
                                <FormControl maxW="200px">
                                    <FormLabel>상태</FormLabel>
                                    <Select
                                        value={filters.status}
                                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                    >
                                        <option value="">전체</option>
                                        <option value="draft">초안</option>
                                        <option value="published">발행됨</option>
                                        <option value="archived">보관됨</option>
                                        <option value="deleted">삭제됨</option>
                                    </Select>
                                </FormControl>
                                <FormControl maxW="200px">
                                    <FormLabel>카테고리</FormLabel>
                                    <Input
                                        value={filters.category}
                                        onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                                        placeholder="카테고리"
                                    />
                                </FormControl>
                                <FormControl maxW="200px">
                                    <FormLabel>작성자</FormLabel>
                                    <Input
                                        value={filters.author}
                                        onChange={(e) => setFilters(prev => ({ ...prev, author: e.target.value }))}
                                        placeholder="작성자"
                                    />
                                </FormControl>
                                <FormControl flex="1" minW="300px">
                                    <FormLabel>검색</FormLabel>
                                    <InputGroup>
                                        <InputLeftElement>
                                            <SearchIcon />
                                        </InputLeftElement>
                                        <Input
                                            value={filters.search}
                                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                            placeholder="제목, 내용, 태그로 검색..."
                                        />
                                    </InputGroup>
                                </FormControl>
                            </HStack>
                            <HStack spacing={2}>
                                <Button colorScheme="blue" onClick={applyFilters}>
                                    필터 적용
                                </Button>
                                <Button variant="outline" onClick={resetFilters}>
                                    초기화
                                </Button>
                            </HStack>
                        </VStack>
                    </CardBody>
                </Card>

                {/* 컨텐츠 목록 */}
                <Card>
                    <CardHeader>
                        <Flex justify="space-between" align="center">
                            <Text fontSize="lg" fontWeight="bold">
                                컨텐츠 목록 ({pagination.total}개)
                            </Text>
                            <HStack spacing={2}>
                                <Text fontSize="sm" color="gray.600">
                                    {pagination.page} / {pagination.pages} 페이지
                                </Text>
                            </HStack>
                        </Flex>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <VStack spacing={4}>
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} height="60px" />
                                ))}
                            </VStack>
                        ) : (
                            <Table variant="simple">
                                <Thead>
                                    <Tr>
                                        <Th>제목</Th>
                                        <Th>타입</Th>
                                        <Th>상태</Th>
                                        <Th>작성자</Th>
                                        <Th>조회수</Th>
                                        <Th>생성일</Th>
                                        <Th>액션</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {contents.map((content) => (
                                        <Tr key={content.id}>
                                            <Td>
                                                <VStack align="start" spacing={1}>
                                                    <Text fontWeight="bold" noOfLines={1}>
                                                        {content.title}
                                                    </Text>
                                                    <HStack spacing={1}>
                                                        {content.isFeatured && (
                                                            <Badge colorScheme="yellow" size="sm">추천</Badge>
                                                        )}
                                                        {content.isPinned && (
                                                            <Badge colorScheme="blue" size="sm">고정</Badge>
                                                        )}
                                                    </HStack>
                                                </VStack>
                                            </Td>
                                            <Td>
                                                <Badge colorScheme={getTypeColor(content.type)}>
                                                    {content.type}
                                                </Badge>
                                            </Td>
                                            <Td>
                                                <Badge colorScheme={getStatusColor(content.status)}>
                                                    {content.status}
                                                </Badge>
                                            </Td>
                                            <Td>{content.author}</Td>
                                            <Td>{content.viewCount.toLocaleString()}</Td>
                                            <Td>
                                                {new Date(content.createdAt).toLocaleDateString()}
                                            </Td>
                                            <Td>
                                                <HStack spacing={1}>
                                                    <Menu>
                                                        <MenuButton as={IconButton} icon={<SettingsIcon />} size="sm" />
                                                        <MenuList>
                                                            <MenuItem onClick={() => setSelectedContent(content)}>
                                                                <ViewIcon mr={2} />
                                                                보기
                                                            </MenuItem>
                                                            <MenuItem onClick={() => {
                                                                setSelectedContent(content);
                                                                onEditOpen();
                                                            }}>
                                                                <EditIcon mr={2} />
                                                                수정
                                                            </MenuItem>
                                                            <MenuItem onClick={() => changeContentStatus(content.id, 'published')}>
                                                                발행
                                                            </MenuItem>
                                                            <MenuItem onClick={() => changeContentStatus(content.id, 'archived')}>
                                                                보관
                                                            </MenuItem>
                                                            <MenuItem onClick={() => {
                                                                setSelectedContent(content);
                                                                onDeleteOpen();
                                                            }}>
                                                                <DeleteIcon mr={2} />
                                                                삭제
                                                            </MenuItem>
                                                        </MenuList>
                                                    </Menu>
                                                </HStack>
                                            </Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        )}

                        {/* 페이지네이션 */}
                        {pagination.pages > 1 && (
                            <HStack justify="center" mt={4}>
                                <Button
                                    size="sm"
                                    isDisabled={pagination.page === 1}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                >
                                    이전
                                </Button>
                                <Text>
                                    {pagination.page} / {pagination.pages}
                                </Text>
                                <Button
                                    size="sm"
                                    isDisabled={pagination.page === pagination.pages}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                >
                                    다음
                                </Button>
                            </HStack>
                        )}
                    </CardBody>
                </Card>
            </VStack>

            {/* 통계 모달 */}
            <Modal isOpen={isStatsOpen} onClose={onStatsClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>컨텐츠 통계</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {stats && (
                            <VStack spacing={6} align="stretch">
                                <SimpleGrid columns={2} spacing={4}>
                                    <Card>
                                        <CardBody>
                                            <Stat>
                                                <StatLabel>타입별 분포</StatLabel>
                                                {Object.entries(stats.byType).map(([type, count]) => (
                                                    <HStack key={type} justify="space-between">
                                                        <Text>{type}</Text>
                                                        <Text fontWeight="bold">{count}</Text>
                                                    </HStack>
                                                ))}
                                            </Stat>
                                        </CardBody>
                                    </Card>
                                    <Card>
                                        <CardBody>
                                            <Stat>
                                                <StatLabel>카테고리별 분포</StatLabel>
                                                {Object.entries(stats.byCategory).map(([category, count]) => (
                                                    <HStack key={category} justify="space-between">
                                                        <Text>{category}</Text>
                                                        <Text fontWeight="bold">{count}</Text>
                                                    </HStack>
                                                ))}
                                            </Stat>
                                        </CardBody>
                                    </Card>
                                </SimpleGrid>
                            </VStack>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 삭제 확인 다이얼로그 */}
            <AlertDialog isOpen={isDeleteOpen} onClose={onDeleteClose}>
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader>컨텐츠 삭제</AlertDialogHeader>
                        <AlertDialogCloseButton />
                        <AlertDialogBody>
                            정말로 이 컨텐츠를 삭제하시겠습니까?
                            <br />
                            <Text fontWeight="bold">{selectedContent?.title}</Text>
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button onClick={onDeleteClose}>취소</Button>
                            <Button colorScheme="red" onClick={() => selectedContent && deleteContent(selectedContent.id)}>
                                삭제
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Box>
    );
};

export default ContentManagement;
