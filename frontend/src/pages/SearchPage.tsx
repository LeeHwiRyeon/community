/**
 * 검색 페이지
 * SearchBar, SearchFilters, SearchResults 통합
 * MySQL Full-Text Search API 연동
 * 
 * @author AUTOAGENTS
 * @date 2025-11-11
 * @version 1.1
 */

import React, { useState, useEffect } from 'react';
import {
    Container,
    Box,
    Heading,
    Grid,
    GridItem,
    VStack,
    HStack,
    Text,
    Button,
    useToast,
    useColorModeValue
} from '@chakra-ui/react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import SearchFilters, { SearchFilters as Filters } from '../components/SearchFilters';
import SearchResults from '../components/SearchResults';
import { apiClient } from '../utils/apiClient';

interface SearchResult {
    id: number;
    title: string;
    content: string;
    category: string;
    tags: string[];
    author_name: string;
    view_count: number;
    like_count: number;
    comment_count: number;
    created_at: string;
    score: number;
    highlights?: {
        title?: string[];
        content?: string[];
    };
}

interface SearchResponse {
    total: number;
    posts: SearchResult[];
    page: number;
    totalPages: number;
}

const SearchPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const toast = useToast();

    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [filters, setFilters] = useState<Filters>({
        category: searchParams.get('category') || null,
        tags: searchParams.getAll('tags') || [],
        author: searchParams.get('author') || null,
        dateFrom: searchParams.get('dateFrom') || null,
        dateTo: searchParams.get('dateTo') || null,
        sortBy: (searchParams.get('sortBy') as Filters['sortBy']) || 'relevance'
    });
    const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

    const [results, setResults] = useState<SearchResult[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // 검색 히스토리 및 인기 검색어
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [popularTerms, setPopularTerms] = useState<Array<{ term: string; count: number }>>([]);

    const cardBgColor = useColorModeValue('white', 'gray.800');
    const hoverBgColor = useColorModeValue('gray.100', 'gray.700');

    // 초기 로드: 검색 히스토리 및 인기 검색어
    useEffect(() => {
        fetchSearchHistory();
        fetchPopularTerms();
    }, []);

    // 검색 히스토리 조회
    const fetchSearchHistory = async () => {
        try {
            const response = await apiClient.get('/api/simple-search/history?limit=10');
            if (response.data.history) {
                setSearchHistory(response.data.history);
            }
        } catch (error) {
            console.error('검색 히스토리 조회 실패:', error);
        }
    };

    // 인기 검색어 조회
    const fetchPopularTerms = async () => {
        try {
            const response = await apiClient.get('/api/simple-search/popular?limit=10');
            if (response.data.terms) {
                setPopularTerms(response.data.terms);
            }
        } catch (error) {
            console.error('인기 검색어 조회 실패:', error);
        }
    };

    // URL 파라미터 업데이트
    useEffect(() => {
        const params: Record<string, string> = {};
        if (query) params.q = query;
        if (filters.category) params.category = filters.category;
        if (filters.author) params.author = filters.author;
        if (filters.dateFrom) params.dateFrom = filters.dateFrom;
        if (filters.dateTo) params.dateTo = filters.dateTo;
        if (filters.sortBy !== 'relevance') params.sortBy = filters.sortBy;
        if (page > 1) params.page = page.toString();

        setSearchParams(params);
    }, [query, filters, page, setSearchParams]);

    // 검색 실행
    useEffect(() => {
        if (query.trim()) {
            performSearch();
        }
    }, [query, filters, page]);

    const performSearch = async () => {
        try {
            setIsLoading(true);
            // Simple Search API 사용 (MySQL Full-Text)
            const response = await apiClient.post(
                '/api/simple-search/posts',
                {
                    query: query.trim() || undefined,
                    category: filters.category || undefined,
                    tags: filters.tags.length > 0 ? filters.tags : undefined,
                    author: filters.author || undefined,
                    dateFrom: filters.dateFrom || undefined,
                    dateTo: filters.dateTo || undefined,
                    sortBy: filters.sortBy,
                    page,
                    limit: 20
                }
            );

            if (response.data) {
                // 데이터 형식 변환
                const formattedResults = response.data.posts.map((post: any) => ({
                    id: post.id,
                    title: post.title,
                    content: post.excerpt || post.content || '',
                    category: post.category || '일반',
                    tags: post.tag ? post.tag.split(',').map((t: string) => t.trim()) : [],
                    author_name: post.author || '알 수 없음',
                    view_count: post.views || 0,
                    like_count: 0,
                    comment_count: 0,
                    created_at: post.created_at,
                    score: 1
                }));

                setResults(formattedResults);
                setTotal(response.data.pagination.total);
                setTotalPages(response.data.pagination.totalPages);
            }
        } catch (error) {
            console.error('검색 실패:', error);
            toast({
                title: '검색 실패',
                description: '검색 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (newQuery: string) => {
        setQuery(newQuery);
        setPage(1); // 새 검색 시 첫 페이지로
    };

    const handleFiltersChange = (newFilters: Filters) => {
        setFilters(newFilters);
        setPage(1); // 필터 변경 시 첫 페이지로
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <Container maxW="container.xl" py={8}>
            <VStack align="stretch" spacing={8}>
                {/* 헤더 */}
                <Box>
                    <Heading size="lg" mb={4}>
                        게시물 검색
                    </Heading>
                    <SearchBar onSearch={handleSearch} placeholder="검색어를 입력하세요..." showPopular={true} />
                </Box>

                {/* 검색 결과 */}
                {query && (
                    <Grid templateColumns={{ base: '1fr', lg: '300px 1fr' }} gap={6}>
                        {/* 필터 (왼쪽) */}
                        <GridItem>
                            <SearchFilters
                                filters={filters}
                                onFiltersChange={handleFiltersChange}
                            />
                        </GridItem>

                        {/* 검색 결과 (오른쪽) */}
                        <GridItem>
                            {total > 0 && (
                                <Box mb={4}>
                                    <Text color="gray.500" fontSize="sm">
                                        총 {total}개의 검색 결과
                                    </Text>
                                </Box>
                            )}
                            <SearchResults
                                results={results}
                                total={total}
                                page={page}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                isLoading={isLoading}
                            />
                        </GridItem>
                    </Grid>
                )}

                {/* 검색 전: 검색 히스토리 & 인기 검색어 */}
                {!query && !isLoading && (
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                        {/* 최근 검색어 */}
                        {searchHistory.length > 0 && (
                            <Box bg={cardBgColor} p={6} borderRadius="lg" boxShadow="sm">
                                <Heading size="md" mb={4}>최근 검색어</Heading>
                                <VStack align="stretch" spacing={2}>
                                    {searchHistory.map((term, index) => (
                                        <Button
                                            key={index}
                                            variant="ghost"
                                            justifyContent="flex-start"
                                            onClick={() => handleSearch(term)}
                                        >
                                            {term}
                                        </Button>
                                    ))}
                                </VStack>
                            </Box>
                        )}

                        {/* 인기 검색어 */}
                        {popularTerms.length > 0 && (
                            <Box bg={cardBgColor} p={6} borderRadius="lg" boxShadow="sm">
                                <Heading size="md" mb={4}>인기 검색어</Heading>
                                <VStack align="stretch" spacing={2}>
                                    {popularTerms.map((item, index) => (
                                        <HStack
                                            key={index}
                                            justify="space-between"
                                            cursor="pointer"
                                            p={2}
                                            borderRadius="md"
                                            _hover={{ bg: hoverBgColor }}
                                            onClick={() => handleSearch(item.term)}
                                        >
                                            <HStack>
                                                <Text fontWeight="bold" color="blue.500">
                                                    {index + 1}
                                                </Text>
                                                <Text>{item.term}</Text>
                                            </HStack>
                                            <Text fontSize="sm" color="gray.500">
                                                {item.count}회
                                            </Text>
                                        </HStack>
                                    ))}
                                </VStack>
                            </Box>
                        )}
                    </Grid>
                )}
            </VStack>
        </Container>
    );
};

export default SearchPage;
