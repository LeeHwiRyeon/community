/**
 * 검색 결과 컴포넌트
 * 게시물 검색 결과 표시 및 페이지네이션
 */

import React from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Heading,
    Badge,
    Button,
    Divider,
    useColorModeValue,
    Flex,
    Avatar,
    Icon
} from '@chakra-ui/react';
import { ViewIcon, ChatIcon, StarIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';

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

interface SearchResultsProps {
    results: SearchResult[];
    total: number;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({
    results,
    total,
    page,
    totalPages,
    onPageChange,
    isLoading = false
}) => {
    const navigate = useNavigate();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

    const handlePostClick = (postId: number) => {
        navigate(`/post/${postId}`);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return '오늘';
        if (days === 1) return '어제';
        if (days < 7) return `${days}일 전`;
        if (days < 30) return `${Math.floor(days / 7)}주 전`;
        if (days < 365) return `${Math.floor(days / 30)}개월 전`;
        return `${Math.floor(days / 365)}년 전`;
    };

    const stripHtml = (html: string) => {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    if (isLoading) {
        return (
            <Box textAlign="center" py={10}>
                <Text color="gray.500">검색 중...</Text>
            </Box>
        );
    }

    if (results.length === 0) {
        return (
            <Box textAlign="center" py={10} data-testid="no-results">
                <Heading size="md" mb={2}>검색 결과가 없습니다</Heading>
                <Text color="gray.500">다른 검색어로 다시 시도해보세요</Text>
            </Box>
        );
    }

    return (
        <VStack align="stretch" spacing={4} data-testid="search-results">
            {/* 검색 결과 개수 */}
            <Box>
                <Text fontSize="sm" color="gray.500">
                    총 <strong>{total.toLocaleString()}</strong>개의 검색 결과
                </Text>
            </Box>

            {/* 검색 결과 목록 */}
            {results.map((result, index) => (
                <Box
                    key={result.id}
                    bg={bgColor}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="md"
                    p={5}
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{
                        bg: hoverBgColor,
                        transform: 'translateY(-2px)',
                        boxShadow: 'md'
                    }}
                    onClick={() => handlePostClick(result.id)}
                >
                    <VStack align="stretch" spacing={3}>
                        {/* 제목 및 카테고리 */}
                        <HStack justify="space-between" align="start">
                            <Heading
                                size="md"
                                dangerouslySetInnerHTML={{
                                    __html: result.highlights?.title?.[0] || result.title
                                }}
                            />
                            <Badge colorScheme="blue" fontSize="sm">
                                {result.category}
                            </Badge>
                        </HStack>

                        {/* 내용 미리보기 */}
                        <Text
                            color="gray.600"
                            fontSize="sm"
                            noOfLines={2}
                            dangerouslySetInnerHTML={{
                                __html: result.highlights?.content?.[0]
                                    ? stripHtml(result.highlights.content[0])
                                    : result.content.substring(0, 150) + '...'
                            }}
                        />

                        {/* 태그 */}
                        {result.tags && result.tags.length > 0 && (
                            <HStack spacing={2}>
                                {result.tags.slice(0, 5).map((tag, idx) => (
                                    <Badge key={idx} variant="outline" colorScheme="purple" fontSize="xs">
                                        #{tag}
                                    </Badge>
                                ))}
                            </HStack>
                        )}

                        <Divider />

                        {/* 작성자 및 통계 */}
                        <Flex justify="space-between" align="center">
                            <HStack spacing={2}>
                                <Avatar size="xs" name={result.author_name} />
                                <Text fontSize="sm" fontWeight="medium">
                                    {result.author_name}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                    · {formatDate(result.created_at)}
                                </Text>
                            </HStack>

                            <HStack spacing={4} fontSize="sm" color="gray.500">
                                <HStack spacing={1}>
                                    <Icon as={ViewIcon} />
                                    <Text>{result.view_count}</Text>
                                </HStack>
                                <HStack spacing={1}>
                                    <Icon as={StarIcon} />
                                    <Text>{result.like_count}</Text>
                                </HStack>
                                <HStack spacing={1}>
                                    <Icon as={ChatIcon} />
                                    <Text>{result.comment_count}</Text>
                                </HStack>
                            </HStack>
                        </Flex>
                    </VStack>
                </Box>
            ))}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <Flex justify="center" mt={8} gap={2} data-testid="pagination">
                    <Button
                        size="sm"
                        onClick={() => onPageChange(page - 1)}
                        isDisabled={page === 1}
                    >
                        이전
                    </Button>

                    {[...Array(Math.min(totalPages, 10))].map((_, idx) => {
                        let pageNum;
                        if (totalPages <= 10) {
                            pageNum = idx + 1;
                        } else {
                            // 현재 페이지 주변 페이지만 표시
                            const startPage = Math.max(1, page - 5);
                            pageNum = startPage + idx;
                            if (pageNum > totalPages) return null;
                        }

                        return (
                            <Button
                                key={pageNum}
                                size="sm"
                                variant={page === pageNum ? 'solid' : 'outline'}
                                colorScheme={page === pageNum ? 'blue' : 'gray'}
                                onClick={() => onPageChange(pageNum)}
                            >
                                {pageNum}
                            </Button>
                        );
                    })}

                    <Button
                        size="sm"
                        onClick={() => onPageChange(page + 1)}
                        isDisabled={page === totalPages}
                        data-testid="next-page"
                    >
                        다음
                    </Button>
                </Flex>
            )}
        </VStack>
    );
};

export default SearchResults;
