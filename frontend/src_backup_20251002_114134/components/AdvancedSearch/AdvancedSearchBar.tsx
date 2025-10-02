import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    Input,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    VStack,
    HStack,
    Text,
    Button,
    Badge,
    IconButton,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverBody,
    PopoverArrow,
    useDisclosure,
    Spinner,
    Divider,
    Flex,
    Spacer,
    Tooltip,
    useToast,
    Collapse,
    SimpleGrid,
    Card,
    CardBody,
    Image,
    Avatar,
    Tag,
    TagLabel,
    TagCloseButton,
    Wrap,
    WrapItem,
    Select,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    RangeSlider,
    RangeSliderTrack,
    RangeSliderFilledTrack,
    RangeSliderThumb,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Checkbox,
    CheckboxGroup,
    Radio,
    RadioGroup,
    Stack
} from '@chakra-ui/react';
import {
    SearchIcon,
    CloseIcon,
    FilterIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    StarIcon,
    ViewIcon,
    HeartIcon,
    ChatIcon,
    CalendarIcon,
    TagIcon,
    PriceIcon,
    SortIcon
} from '@chakra-ui/icons';

interface SearchResult {
    id: string;
    type: 'post' | 'user' | 'community' | 'product' | 'stream';
    title: string;
    content?: string;
    description?: string;
    author?: string;
    category?: string;
    tags?: string[];
    createdAt: string;
    views?: number;
    likes?: number;
    comments?: number;
    rating?: number;
    price?: number;
    score: number;
    thumbnail?: string;
    avatar?: string;
}

interface SearchFilters {
    category?: string;
    author?: string;
    date?: string;
    price?: string;
    rating?: string;
    tags?: string[];
    sortBy?: string;
}

interface AdvancedSearchBarProps {
    onSearch?: (query: string, filters: SearchFilters) => void;
    placeholder?: string;
    showFilters?: boolean;
    showSuggestions?: boolean;
    maxSuggestions?: number;
    debounceMs?: number;
}

const AdvancedSearchBar: React.FC<AdvancedSearchBarProps> = ({
    onSearch,
    placeholder = "고급 검색...",
    showFilters = true,
    showSuggestions = true,
    maxSuggestions = 10,
    debounceMs = 300
}) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [filters, setFilters] = useState<SearchFilters>({});
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [filterOptions, setFilterOptions] = useState<any>(null);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
    const [ratingFilter, setRatingFilter] = useState<string>('');
    const [dateFilter, setDateFilter] = useState<string>('');

    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>();
    const toast = useToast();

    // 컴포넌트 마운트 시 필터 옵션 로드
    useEffect(() => {
        loadFilterOptions();
        loadSearchHistory();
    }, []);

    // 검색 쿼리 디바운스 처리
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (query.length >= 2) {
            debounceRef.current = setTimeout(() => {
                fetchSuggestions(query);
            }, debounceMs);
        } else {
            setSuggestions([]);
        }

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, debounceMs]);

    // 필터 옵션 로드
    const loadFilterOptions = async () => {
        try {
            const response = await fetch('/api/advanced-search/filters');
            const data = await response.json();
            if (data.success) {
                setFilterOptions(data.data);
            }
        } catch (error) {
            console.error('Error loading filter options:', error);
        }
    };

    // 검색 기록 로드
    const loadSearchHistory = async () => {
        try {
            const userId = 'current_user'; // 실제로는 인증된 사용자 ID
            const response = await fetch(`/api/advanced-search/history/${userId}`);
            const data = await response.json();
            if (data.success) {
                setSearchHistory(data.data.map((item: any) => item.query));
            }
        } catch (error) {
            console.error('Error loading search history:', error);
        }
    };

    // 자동완성 제안 가져오기
    const fetchSuggestions = async (searchQuery: string) => {
        try {
            const response = await fetch(`/api/advanced-search/autocomplete?q=${encodeURIComponent(searchQuery)}&limit=${maxSuggestions}`);
            const data = await response.json();
            if (data.success) {
                setSuggestions(data.data);
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    };

    // 검색 실행
    const performSearch = async (searchQuery: string, searchFilters: SearchFilters = {}) => {
        try {
            setIsLoading(true);

            const queryParams = new URLSearchParams({
                q: searchQuery,
                ...searchFilters
            });

            const response = await fetch(`/api/advanced-search/search?${queryParams}`);
            const data = await response.json();

            if (data.success) {
                setSearchResults(data.data.results);
                setShowResults(true);

                // 검색 기록에 추가
                if (!searchHistory.includes(searchQuery)) {
                    setSearchHistory(prev => [searchQuery, ...prev.slice(0, 9)]);
                }

                onSearch?.(searchQuery, searchFilters);
            } else {
                toast({
                    title: '검색 실패',
                    description: data.message || '검색 중 오류가 발생했습니다.',
                    status: 'error',
                    duration: 3000,
                    isClosable: true
                });
            }
        } catch (error) {
            console.error('Search error:', error);
            toast({
                title: '검색 오류',
                description: '검색 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        } finally {
            setIsLoading(false);
        }
    };

    // 검색 실행 핸들러
    const handleSearch = useCallback(() => {
        if (query.trim()) {
            performSearch(query.trim(), filters);
        }
    }, [query, filters]);

    // 엔터키 검색
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // 제안 클릭
    const handleSuggestionClick = (suggestion: string) => {
        setQuery(suggestion);
        performSearch(suggestion, filters);
        setSuggestions([]);
    };

    // 필터 적용
    const applyFilters = () => {
        const newFilters: SearchFilters = {
            ...filters,
            category: filters.category,
            author: filters.author,
            date: dateFilter,
            price: priceRange[0] > 0 || priceRange[1] < 1000000 ? `${priceRange[0]}-${priceRange[1]}` : undefined,
            rating: ratingFilter,
            tags: selectedTags.length > 0 ? selectedTags : undefined,
            sortBy: filters.sortBy || 'relevance'
        };

        setFilters(newFilters);
        if (query.trim()) {
            performSearch(query.trim(), newFilters);
        }
        setShowFilterPanel(false);
    };

    // 필터 초기화
    const clearFilters = () => {
        setFilters({});
        setSelectedTags([]);
        setPriceRange([0, 1000000]);
        setRatingFilter('');
        setDateFilter('');
    };

    // 태그 추가
    const addTag = (tag: string) => {
        if (!selectedTags.includes(tag)) {
            setSelectedTags(prev => [...prev, tag]);
        }
    };

    // 태그 제거
    const removeTag = (tag: string) => {
        setSelectedTags(prev => prev.filter(t => t !== tag));
    };

    // 검색 결과 렌더링
    const renderSearchResult = (result: SearchResult) => {
        const formatDate = (dateString: string) => {
            return new Date(dateString).toLocaleDateString('ko-KR');
        };

        const formatNumber = (num: number) => {
            return num.toLocaleString();
        };

        return (
            <Card key={`${result.type}_${result.id}`} variant="outline" cursor="pointer"
                _hover={{ shadow: 'md', transform: 'translateY(-1px)' }}
                transition="all 0.2s">
                <CardBody p={4}>
                    <HStack spacing={4} align="start">
                        {/* 썸네일/아바타 */}
                        <Box flexShrink={0}>
                            {result.thumbnail ? (
                                <Image
                                    src={result.thumbnail}
                                    alt={result.title}
                                    w="60px"
                                    h="60px"
                                    objectFit="cover"
                                    borderRadius="md"
                                />
                            ) : result.avatar ? (
                                <Avatar
                                    src={result.avatar}
                                    name={result.title}
                                    size="md"
                                />
                            ) : (
                                <Box
                                    w="60px"
                                    h="60px"
                                    bg="gray.100"
                                    borderRadius="md"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <Text fontSize="2xl">
                                        {result.type === 'post' ? '📝' :
                                            result.type === 'user' ? '👤' :
                                                result.type === 'community' ? '👥' :
                                                    result.type === 'product' ? '🛍️' :
                                                        result.type === 'stream' ? '📺' : '📄'}
                                    </Text>
                                </Box>
                            )}
                        </Box>

                        {/* 콘텐츠 */}
                        <VStack align="start" spacing={2} flex="1">
                            <HStack justify="space-between" w="100%">
                                <Text fontWeight="bold" fontSize="md" noOfLines={1}>
                                    {result.title}
                                </Text>
                                <Badge colorScheme="purple" size="sm">
                                    {result.type}
                                </Badge>
                            </HStack>

                            <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                {result.content || result.description}
                            </Text>

                            <HStack spacing={4} fontSize="sm" color="gray.500">
                                {result.author && (
                                    <Text>작성자: {result.author}</Text>
                                )}
                                {result.category && (
                                    <Badge colorScheme="blue" size="sm">
                                        {result.category}
                                    </Badge>
                                )}
                                <Text>작성일: {formatDate(result.createdAt)}</Text>
                            </HStack>

                            {result.tags && result.tags.length > 0 && (
                                <Wrap spacing={1}>
                                    {result.tags.slice(0, 3).map(tag => (
                                        <WrapItem key={tag}>
                                            <Tag size="sm" colorScheme="gray">
                                                <TagLabel>{tag}</TagLabel>
                                            </Tag>
                                        </WrapItem>
                                    ))}
                                </Wrap>
                            )}

                            <HStack spacing={4} fontSize="sm" color="gray.500">
                                {result.views !== undefined && (
                                    <HStack spacing={1}>
                                        <ViewIcon />
                                        <Text>{formatNumber(result.views)}</Text>
                                    </HStack>
                                )}
                                {result.likes !== undefined && (
                                    <HStack spacing={1}>
                                        <HeartIcon />
                                        <Text>{formatNumber(result.likes)}</Text>
                                    </HStack>
                                )}
                                {result.comments !== undefined && (
                                    <HStack spacing={1}>
                                        <ChatIcon />
                                        <Text>{formatNumber(result.comments)}</Text>
                                    </HStack>
                                )}
                                {result.rating !== undefined && (
                                    <HStack spacing={1}>
                                        <StarIcon color="yellow.400" />
                                        <Text>{result.rating}</Text>
                                    </HStack>
                                )}
                                {result.price !== undefined && (
                                    <HStack spacing={1}>
                                        <PriceIcon />
                                        <Text>₩{formatNumber(result.price)}</Text>
                                    </HStack>
                                )}
                            </HStack>
                        </VStack>
                    </HStack>
                </CardBody>
            </Card>
        );
    };

    return (
        <Box position="relative" w="100%">
            {/* 검색 바 */}
            <HStack spacing={2} w="100%">
                <InputGroup flex="1">
                    <InputLeftElement>
                        <SearchIcon color="gray.400" />
                    </InputLeftElement>
                    <Input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={placeholder}
                        bg="white"
                        borderColor="gray.300"
                        _focus={{
                            borderColor: 'purple.500',
                            boxShadow: '0 0 0 1px var(--chakra-colors-purple-500)'
                        }}
                    />
                    <InputRightElement>
                        {isLoading ? (
                            <Spinner size="sm" color="purple.500" />
                        ) : query && (
                            <IconButton
                                size="sm"
                                variant="ghost"
                                icon={<CloseIcon />}
                                aria-label="Clear search"
                                onClick={() => {
                                    setQuery('');
                                    setSuggestions([]);
                                    setShowResults(false);
                                }}
                            />
                        )}
                    </InputRightElement>
                </InputGroup>

                {showFilters && (
                    <Button
                        leftIcon={<FilterIcon />}
                        colorScheme="purple"
                        variant="outline"
                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                    >
                        필터
                    </Button>
                )}

                <Button
                    colorScheme="purple"
                    onClick={handleSearch}
                    isLoading={isLoading}
                    loadingText="검색 중..."
                >
                    검색
                </Button>
            </HStack>

            {/* 자동완성 제안 */}
            {showSuggestions && suggestions.length > 0 && (
                <Box
                    position="absolute"
                    top="100%"
                    left={0}
                    right={0}
                    zIndex={1000}
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    shadow="lg"
                    mt={1}
                >
                    <VStack spacing={0} align="stretch">
                        {suggestions.map((suggestion, index) => (
                            <Box
                                key={index}
                                p={3}
                                cursor="pointer"
                                _hover={{ bg: 'gray.50' }}
                                onClick={() => handleSuggestionClick(suggestion)}
                            >
                                <HStack>
                                    <SearchIcon color="gray.400" />
                                    <Text>{suggestion}</Text>
                                </HStack>
                            </Box>
                        ))}
                    </VStack>
                </Box>
            )}

            {/* 필터 패널 */}
            <Collapse in={showFilterPanel} animateOpacity>
                <Box
                    mt={4}
                    p={6}
                    bg="gray.50"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.200"
                >
                    <VStack spacing={6} align="stretch">
                        <HStack justify="space-between">
                            <Text fontWeight="bold" fontSize="lg">
                                고급 필터
                            </Text>
                            <HStack spacing={2}>
                                <Button size="sm" variant="outline" onClick={clearFilters}>
                                    초기화
                                </Button>
                                <Button size="sm" colorScheme="purple" onClick={applyFilters}>
                                    적용
                                </Button>
                            </HStack>
                        </HStack>

                        {filterOptions && (
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                                {/* 카테고리 필터 */}
                                <VStack align="start" spacing={2}>
                                    <Text fontWeight="medium">카테고리</Text>
                                    <Select
                                        placeholder="카테고리 선택"
                                        value={filters.category || ''}
                                        onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                                    >
                                        {filterOptions.categories.map((category: any) => (
                                            <option key={category.value} value={category.value}>
                                                {category.label} ({category.count})
                                            </option>
                                        ))}
                                    </Select>
                                </VStack>

                                {/* 정렬 기준 */}
                                <VStack align="start" spacing={2}>
                                    <Text fontWeight="medium">정렬 기준</Text>
                                    <Select
                                        value={filters.sortBy || 'relevance'}
                                        onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                                    >
                                        <option value="relevance">관련성</option>
                                        <option value="date">최신순</option>
                                        <option value="popularity">인기순</option>
                                        <option value="rating">평점순</option>
                                        <option value="price_low">가격 낮은순</option>
                                        <option value="price_high">가격 높은순</option>
                                    </Select>
                                </VStack>

                                {/* 날짜 필터 */}
                                <VStack align="start" spacing={2}>
                                    <Text fontWeight="medium">작성일</Text>
                                    <Select
                                        placeholder="날짜 선택"
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value)}
                                    >
                                        {filterOptions.dateRanges.map((range: any) => (
                                            <option key={range.value} value={range.value}>
                                                {range.label}
                                            </option>
                                        ))}
                                    </Select>
                                </VStack>

                                {/* 가격 범위 */}
                                <VStack align="start" spacing={2}>
                                    <Text fontWeight="medium">가격 범위</Text>
                                    <VStack spacing={2} w="100%">
                                        <RangeSlider
                                            value={priceRange}
                                            onChange={setPriceRange}
                                            min={0}
                                            max={1000000}
                                            step={10000}
                                        >
                                            <RangeSliderTrack>
                                                <RangeSliderFilledTrack />
                                            </RangeSliderTrack>
                                            <RangeSliderThumb index={0} />
                                            <RangeSliderThumb index={1} />
                                        </RangeSlider>
                                        <HStack justify="space-between" w="100%">
                                            <Text fontSize="sm">₩{priceRange[0].toLocaleString()}</Text>
                                            <Text fontSize="sm">₩{priceRange[1].toLocaleString()}</Text>
                                        </HStack>
                                    </VStack>
                                </VStack>

                                {/* 평점 필터 */}
                                <VStack align="start" spacing={2}>
                                    <Text fontWeight="medium">최소 평점</Text>
                                    <RadioGroup value={ratingFilter} onChange={setRatingFilter}>
                                        <Stack spacing={2}>
                                            {filterOptions.ratings.map((rating: any) => (
                                                <Radio key={rating.value} value={rating.value}>
                                                    {rating.label}
                                                </Radio>
                                            ))}
                                        </Stack>
                                    </RadioGroup>
                                </VStack>

                                {/* 태그 필터 */}
                                <VStack align="start" spacing={2}>
                                    <Text fontWeight="medium">태그</Text>
                                    <Wrap spacing={2}>
                                        {filterOptions.tags.map((tag: any) => (
                                            <WrapItem key={tag.value}>
                                                <Tag
                                                    size="sm"
                                                    colorScheme={selectedTags.includes(tag.value) ? "purple" : "gray"}
                                                    cursor="pointer"
                                                    onClick={() => {
                                                        if (selectedTags.includes(tag.value)) {
                                                            removeTag(tag.value);
                                                        } else {
                                                            addTag(tag.value);
                                                        }
                                                    }}
                                                >
                                                    <TagLabel>{tag.label}</TagLabel>
                                                </Tag>
                                            </WrapItem>
                                        ))}
                                    </Wrap>
                                </VStack>
                            </SimpleGrid>
                        )}

                        {/* 선택된 태그 표시 */}
                        {selectedTags.length > 0 && (
                            <VStack align="start" spacing={2}>
                                <Text fontWeight="medium">선택된 태그</Text>
                                <Wrap spacing={2}>
                                    {selectedTags.map(tag => (
                                        <WrapItem key={tag}>
                                            <Tag colorScheme="purple" size="sm">
                                                <TagLabel>{tag}</TagLabel>
                                                <TagCloseButton onClick={() => removeTag(tag)} />
                                            </Tag>
                                        </WrapItem>
                                    ))}
                                </Wrap>
                            </VStack>
                        )}
                    </VStack>
                </Box>
            </Collapse>

            {/* 검색 결과 */}
            {showResults && (
                <Box mt={6}>
                    <VStack spacing={4} align="stretch">
                        <HStack justify="space-between">
                            <Text fontWeight="bold" fontSize="lg">
                                검색 결과 ({searchResults.length}개)
                            </Text>
                            <HStack spacing={2}>
                                <Text fontSize="sm" color="gray.500">
                                    쿼리: "{query}"
                                </Text>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowResults(false)}
                                >
                                    닫기
                                </Button>
                            </HStack>
                        </HStack>

                        {searchResults.length > 0 ? (
                            <VStack spacing={4} align="stretch">
                                {searchResults.map(renderSearchResult)}
                            </VStack>
                        ) : (
                            <Box textAlign="center" py={8}>
                                <Text color="gray.500">검색 결과가 없습니다.</Text>
                            </Box>
                        )}
                    </VStack>
                </Box>
            )}
        </Box>
    );
};

export default AdvancedSearchBar;
