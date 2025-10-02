import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    VStack,
    HStack,
    Input,
    Select,
    Button,
    Checkbox,
    CheckboxGroup,
    RangeSlider,
    RangeSliderTrack,
    RangeSliderFilledTrack,
    RangeSliderThumb,
    Text,
    Badge,
    Collapse,
    useDisclosure,
    IconButton,
    Tooltip,
    Divider,
    Tag,
    TagLabel,
    TagCloseButton,
    useToast
} from '@chakra-ui/react';
import { SearchIcon, ChevronDownIcon, ChevronUpIcon, FilterIcon } from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useDebounce } from '../../hooks/useDebounce';

interface SearchFilters {
    query: string;
    category: string;
    tags: string[];
    author: string;
    dateRange: [number, number];
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    contentType: string[];
    minViews: number;
    minLikes: number;
    hasImages: boolean;
    hasCode: boolean;
    isPinned: boolean;
}

interface SearchResult {
    id: string;
    title: string;
    content: string;
    author: string;
    authorId: string;
    category: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    views: number;
    likes: number;
    comments: number;
    hasImages: boolean;
    hasCode: boolean;
    isPinned: boolean;
    score: number;
    highlights: {
        title: string;
        content: string;
    };
}

interface AdvancedSearchProps {
    onSearch: (results: SearchResult[], filters: SearchFilters) => void;
    onFiltersChange?: (filters: SearchFilters) => void;
    initialFilters?: Partial<SearchFilters>;
    placeholder?: string;
    showFilters?: boolean;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
    onSearch,
    onFiltersChange,
    initialFilters = {},
    placeholder = '고급 검색...',
    showFilters = true
}) => {
    const { t } = useTranslation();
    const { isDark } = useTheme();
    const toast = useToast();
    const { isOpen, onToggle } = useDisclosure();

    const [filters, setFilters] = useState<SearchFilters>({
        query: '',
        category: '',
        tags: [],
        author: '',
        dateRange: [0, 365], // 일 단위
        sortBy: 'relevance',
        sortOrder: 'desc',
        contentType: [],
        minViews: 0,
        minLikes: 0,
        hasImages: false,
        hasCode: false,
        isPinned: false,
        ...initialFilters
    });

    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [popularTags, setPopularTags] = useState<string[]>([]);

    // 디바운스된 검색어
    const debouncedQuery = useDebounce(filters.query, 300);

    // 검색 실행
    const executeSearch = useCallback(async (searchFilters: SearchFilters) => {
        if (!searchFilters.query.trim()) {
            setResults([]);
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/search/advanced', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(searchFilters)
            });

            if (!response.ok) {
                throw new Error('검색 실패');
            }

            const data = await response.json();
            setResults(data.results || []);
            onSearch(data.results || [], searchFilters);

            // 최근 검색어 저장
            if (searchFilters.query.trim()) {
                const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
                const updated = [searchFilters.query, ...recent.filter((s: string) => s !== searchFilters.query)].slice(0, 10);
                localStorage.setItem('recentSearches', JSON.stringify(updated));
                setRecentSearches(updated);
            }
        } catch (error) {
            console.error('검색 오류:', error);
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
    }, [onSearch, toast]);

    // 필터 변경 처리
    const handleFilterChange = useCallback((key: keyof SearchFilters, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFiltersChange?.(newFilters);
    }, [filters, onFiltersChange]);

    // 검색어 변경 처리
    const handleQueryChange = useCallback((query: string) => {
        handleFilterChange('query', query);

        // 자동완성 제안
        if (query.length > 2) {
            fetchSuggestions(query);
        } else {
            setSuggestions([]);
        }
    }, [handleFilterChange]);

    // 자동완성 제안 가져오기
    const fetchSuggestions = async (query: string) => {
        try {
            const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            setSuggestions(data.suggestions || []);
        } catch (error) {
            console.error('제안 가져오기 실패:', error);
        }
    };

    // 태그 추가
    const addTag = useCallback((tag: string) => {
        if (tag && !filters.tags.includes(tag)) {
            handleFilterChange('tags', [...filters.tags, tag]);
        }
    }, [filters.tags, handleFilterChange]);

    // 태그 제거
    const removeTag = useCallback((tag: string) => {
        handleFilterChange('tags', filters.tags.filter(t => t !== tag));
    }, [filters.tags, handleFilterChange]);

    // 검색 실행 (디바운스)
    useEffect(() => {
        if (debouncedQuery) {
            executeSearch(filters);
        }
    }, [debouncedQuery, executeSearch, filters]);

    // 초기 데이터 로드
    useEffect(() => {
        // 최근 검색어 로드
        const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        setRecentSearches(recent);

        // 인기 태그 로드
        fetchPopularTags();
    }, []);

    // 인기 태그 가져오기
    const fetchPopularTags = async () => {
        try {
            const response = await fetch('/api/tags/popular');
            const data = await response.json();
            setPopularTags(data.tags || []);
        } catch (error) {
            console.error('인기 태그 가져오기 실패:', error);
        }
    };

    return (
        <Box w="full">
            {/* 검색 입력 */}
            <VStack spacing={4} align="stretch">
                <HStack spacing={2}>
                    <Box position="relative" flex={1}>
                        <Input
                            value={filters.query}
                            onChange={(e) => handleQueryChange(e.target.value)}
                            placeholder={placeholder}
                            size="lg"
                            bg={isDark ? 'gray.700' : 'white'}
                            color={isDark ? 'white' : 'gray.800'}
                            _focus={{
                                borderColor: 'blue.500',
                                boxShadow: '0 0 0 1px #3182CE'
                            }}
                        />

                        {/* 자동완성 제안 */}
                        {suggestions.length > 0 && (
                            <Box
                                position="absolute"
                                top="100%"
                                left={0}
                                right={0}
                                zIndex={1000}
                                bg={isDark ? 'gray.700' : 'white'}
                                border="1px solid"
                                borderColor={isDark ? 'gray.600' : 'gray.200'}
                                borderRadius="md"
                                boxShadow="lg"
                                mt={1}
                            >
                                {suggestions.map((suggestion, index) => (
                                    <Box
                                        key={index}
                                        p={3}
                                        cursor="pointer"
                                        _hover={{ bg: isDark ? 'gray.600' : 'gray.100' }}
                                        onClick={() => {
                                            handleQueryChange(suggestion);
                                            setSuggestions([]);
                                        }}
                                    >
                                        <Text fontSize="sm">{suggestion}</Text>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>

                    <Button
                        onClick={() => executeSearch(filters)}
                        isLoading={isLoading}
                        loadingText="검색 중..."
                        colorScheme="blue"
                        size="lg"
                        leftIcon={<SearchIcon />}
                    >
                        검색
                    </Button>

                    {showFilters && (
                        <IconButton
                            aria-label="필터 토글"
                            icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                            onClick={onToggle}
                            variant="outline"
                            size="lg"
                        />
                    )}
                </HStack>

                {/* 선택된 태그들 */}
                {filters.tags.length > 0 && (
                    <HStack spacing={2} wrap="wrap">
                        {filters.tags.map(tag => (
                            <Tag key={tag} size="md" colorScheme="blue">
                                <TagLabel>{tag}</TagLabel>
                                <TagCloseButton onClick={() => removeTag(tag)} />
                            </Tag>
                        ))}
                    </HStack>
                )}

                {/* 고급 필터 */}
                <Collapse in={isOpen} animateOpacity>
                    <Box p={4} bg={isDark ? 'gray.800' : 'gray.50'} borderRadius="md">
                        <VStack spacing={4} align="stretch">
                            {/* 카테고리 및 작성자 */}
                            <HStack spacing={4}>
                                <Box flex={1}>
                                    <Text mb={2} fontSize="sm" fontWeight="medium">
                                        {t('search.category')}
                                    </Text>
                                    <Select
                                        value={filters.category}
                                        onChange={(e) => handleFilterChange('category', e.target.value)}
                                        placeholder="전체 카테고리"
                                        bg={isDark ? 'gray.700' : 'white'}
                                        color={isDark ? 'white' : 'gray.800'}
                                    >
                                        <option value="technology">기술</option>
                                        <option value="gaming">게임</option>
                                        <option value="learning">학습</option>
                                        <option value="business">비즈니스</option>
                                        <option value="creative">창작</option>
                                        <option value="lifestyle">라이프스타일</option>
                                    </Select>
                                </Box>

                                <Box flex={1}>
                                    <Text mb={2} fontSize="sm" fontWeight="medium">
                                        {t('search.author')}
                                    </Text>
                                    <Input
                                        value={filters.author}
                                        onChange={(e) => handleFilterChange('author', e.target.value)}
                                        placeholder="작성자명"
                                        bg={isDark ? 'gray.700' : 'white'}
                                        color={isDark ? 'white' : 'gray.800'}
                                    />
                                </Box>
                            </HStack>

                            {/* 날짜 범위 */}
                            <Box>
                                <Text mb={2} fontSize="sm" fontWeight="medium">
                                    {t('search.dateRange')}: {filters.dateRange[0]}일 ~ {filters.dateRange[1]}일 전
                                </Text>
                                <RangeSlider
                                    value={filters.dateRange}
                                    onChange={(value) => handleFilterChange('dateRange', value)}
                                    min={0}
                                    max={365}
                                    step={1}
                                    colorScheme="blue"
                                >
                                    <RangeSliderTrack>
                                        <RangeSliderFilledTrack />
                                    </RangeSliderTrack>
                                    <RangeSliderThumb index={0} />
                                    <RangeSliderThumb index={1} />
                                </RangeSlider>
                            </Box>

                            {/* 조회수 및 좋아요 */}
                            <HStack spacing={4}>
                                <Box flex={1}>
                                    <Text mb={2} fontSize="sm" fontWeight="medium">
                                        {t('search.minViews')}: {filters.minViews}
                                    </Text>
                                    <RangeSlider
                                        value={[filters.minViews]}
                                        onChange={(value) => handleFilterChange('minViews', value[0])}
                                        min={0}
                                        max={1000}
                                        step={10}
                                        colorScheme="green"
                                    >
                                        <RangeSliderTrack>
                                            <RangeSliderFilledTrack />
                                        </RangeSliderTrack>
                                        <RangeSliderThumb index={0} />
                                    </RangeSlider>
                                </Box>

                                <Box flex={1}>
                                    <Text mb={2} fontSize="sm" fontWeight="medium">
                                        {t('search.minLikes')}: {filters.minLikes}
                                    </Text>
                                    <RangeSlider
                                        value={[filters.minLikes]}
                                        onChange={(value) => handleFilterChange('minLikes', value[0])}
                                        min={0}
                                        max={100}
                                        step={1}
                                        colorScheme="red"
                                    >
                                        <RangeSliderTrack>
                                            <RangeSliderFilledTrack />
                                        </RangeSliderTrack>
                                        <RangeSliderThumb index={0} />
                                    </RangeSlider>
                                </Box>
                            </HStack>

                            {/* 콘텐츠 타입 */}
                            <Box>
                                <Text mb={2} fontSize="sm" fontWeight="medium">
                                    {t('search.contentType')}
                                </Text>
                                <CheckboxGroup
                                    value={filters.contentType}
                                    onChange={(value) => handleFilterChange('contentType', value)}
                                >
                                    <HStack spacing={4} wrap="wrap">
                                        <Checkbox value="text">텍스트</Checkbox>
                                        <Checkbox value="image">이미지</Checkbox>
                                        <Checkbox value="video">비디오</Checkbox>
                                        <Checkbox value="code">코드</Checkbox>
                                        <Checkbox value="link">링크</Checkbox>
                                    </HStack>
                                </CheckboxGroup>
                            </Box>

                            {/* 추가 옵션 */}
                            <Box>
                                <Text mb={2} fontSize="sm" fontWeight="medium">
                                    {t('search.additionalOptions')}
                                </Text>
                                <HStack spacing={4} wrap="wrap">
                                    <Checkbox
                                        isChecked={filters.hasImages}
                                        onChange={(e) => handleFilterChange('hasImages', e.target.checked)}
                                    >
                                        {t('search.hasImages')}
                                    </Checkbox>
                                    <Checkbox
                                        isChecked={filters.hasCode}
                                        onChange={(e) => handleFilterChange('hasCode', e.target.checked)}
                                    >
                                        {t('search.hasCode')}
                                    </Checkbox>
                                    <Checkbox
                                        isChecked={filters.isPinned}
                                        onChange={(e) => handleFilterChange('isPinned', e.target.checked)}
                                    >
                                        {t('search.isPinned')}
                                    </Checkbox>
                                </HStack>
                            </Box>

                            {/* 정렬 옵션 */}
                            <HStack spacing={4}>
                                <Box flex={1}>
                                    <Text mb={2} fontSize="sm" fontWeight="medium">
                                        {t('search.sortBy')}
                                    </Text>
                                    <Select
                                        value={filters.sortBy}
                                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                        bg={isDark ? 'gray.700' : 'white'}
                                        color={isDark ? 'white' : 'gray.800'}
                                    >
                                        <option value="relevance">관련성</option>
                                        <option value="date">날짜</option>
                                        <option value="views">조회수</option>
                                        <option value="likes">좋아요</option>
                                        <option value="comments">댓글수</option>
                                    </Select>
                                </Box>

                                <Box flex={1}>
                                    <Text mb={2} fontSize="sm" fontWeight="medium">
                                        {t('search.sortOrder')}
                                    </Text>
                                    <Select
                                        value={filters.sortOrder}
                                        onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                                        bg={isDark ? 'gray.700' : 'white'}
                                        color={isDark ? 'white' : 'gray.800'}
                                    >
                                        <option value="desc">내림차순</option>
                                        <option value="asc">오름차순</option>
                                    </Select>
                                </Box>
                            </HStack>
                        </VStack>
                    </Box>
                </Collapse>

                {/* 인기 태그 */}
                {popularTags.length > 0 && (
                    <Box>
                        <Text mb={2} fontSize="sm" fontWeight="medium">
                            {t('search.popularTags')}
                        </Text>
                        <HStack spacing={2} wrap="wrap">
                            {popularTags.map(tag => (
                                <Tag
                                    key={tag}
                                    size="sm"
                                    variant="outline"
                                    cursor="pointer"
                                    _hover={{ bg: 'blue.50', color: 'blue.600' }}
                                    onClick={() => addTag(tag)}
                                >
                                    {tag}
                                </Tag>
                            ))}
                        </HStack>
                    </Box>
                )}

                {/* 최근 검색어 */}
                {recentSearches.length > 0 && (
                    <Box>
                        <Text mb={2} fontSize="sm" fontWeight="medium">
                            {t('search.recentSearches')}
                        </Text>
                        <HStack spacing={2} wrap="wrap">
                            {recentSearches.map((search, index) => (
                                <Badge
                                    key={index}
                                    variant="subtle"
                                    colorScheme="gray"
                                    cursor="pointer"
                                    _hover={{ bg: 'gray.100' }}
                                    onClick={() => handleQueryChange(search)}
                                >
                                    {search}
                                </Badge>
                            ))}
                        </HStack>
                    </Box>
                )}
            </VStack>
        </Box>
    );
};
