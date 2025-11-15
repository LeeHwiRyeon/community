/**
 * 검색 필터 컴포넌트
 * 카테고리, 태그, 날짜, 정렬 옵션
 */

import React, { useState } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Select,
    Input,
    Checkbox,
    CheckboxGroup,
    Stack,
    Divider,
    useColorModeValue,
    Collapse,
    IconButton
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';

export interface SearchFilters {
    category: string | null;
    tags: string[];
    author: string | null;
    dateFrom: string | null;
    dateTo: string | null;
    sortBy: 'relevance' | 'date' | 'views' | 'likes';
}

interface SearchFiltersProps {
    filters: SearchFilters;
    onFiltersChange: (filters: SearchFilters) => void;
    categories?: string[];
    popularTags?: string[];
}

const defaultCategories = [
    '자유게시판',
    '질문게시판',
    '정보공유',
    '공지사항',
    '이벤트'
];

const defaultPopularTags = [
    'JavaScript',
    'React',
    'TypeScript',
    'Node.js',
    'Python',
    '개발',
    '프론트엔드',
    '백엔드'
];

const SearchFiltersComponent: React.FC<SearchFiltersProps> = ({
    filters,
    onFiltersChange,
    categories = defaultCategories,
    popularTags = defaultPopularTags
}) => {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    const handleFilterChange = (key: keyof SearchFilters, value: any) => {
        onFiltersChange({
            ...filters,
            [key]: value
        });
    };

    const handleReset = () => {
        onFiltersChange({
            category: null,
            tags: [],
            author: null,
            dateFrom: null,
            dateTo: null,
            sortBy: 'relevance'
        });
    };

    const activeFilterCount = [
        filters.category,
        filters.tags.length > 0,
        filters.author,
        filters.dateFrom,
        filters.dateTo,
        filters.sortBy !== 'relevance'
    ].filter(Boolean).length;

    return (
        <Box
            bg={bgColor}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="md"
            p={4}
        >
            <VStack align="stretch" spacing={4}>
                {/* 헤더 */}
                <HStack justify="space-between">
                    <HStack>
                        <Text fontWeight="bold">필터</Text>
                        {activeFilterCount > 0 && (
                            <Text fontSize="sm" color="blue.500">
                                ({activeFilterCount}개 적용)
                            </Text>
                        )}
                    </HStack>
                    <Button size="sm" variant="ghost" onClick={handleReset}>
                        초기화
                    </Button>
                </HStack>

                <Divider />

                {/* 정렬 옵션 */}
                <VStack align="stretch" spacing={2}>
                    <Text fontSize="sm" fontWeight="medium">
                        정렬 기준
                    </Text>
                    <Select
                        size="sm"
                        value={filters.sortBy}
                        onChange={(e) =>
                            handleFilterChange('sortBy', e.target.value as SearchFilters['sortBy'])
                        }
                        data-testid="sort-dropdown"
                    >
                        <option value="relevance">관련성</option>
                        <option value="date">최신순</option>
                        <option value="views">조회수</option>
                        <option value="likes">좋아요</option>
                    </Select>
                </VStack>

                {/* 카테고리 */}
                <VStack align="stretch" spacing={2}>
                    <Text fontSize="sm" fontWeight="medium">
                        카테고리
                    </Text>
                    <Select
                        size="sm"
                        placeholder="전체"
                        value={filters.category || ''}
                        onChange={(e) =>
                            handleFilterChange('category', e.target.value || null)
                        }
                        data-testid="category-filter"
                    >
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </Select>
                </VStack>

                {/* 태그 */}
                <VStack align="stretch" spacing={2}>
                    <Text fontSize="sm" fontWeight="medium">
                        인기 태그
                    </Text>
                    <CheckboxGroup
                        value={filters.tags}
                        onChange={(values) => handleFilterChange('tags', values as string[])}
                    >
                        <Stack spacing={2}>
                            {popularTags.slice(0, 6).map((tag) => (
                                <Checkbox key={tag} value={tag} size="sm">
                                    #{tag}
                                </Checkbox>
                            ))}
                        </Stack>
                    </CheckboxGroup>
                </VStack>

                <Divider />

                {/* 고급 필터 토글 */}
                <Button
                    size="sm"
                    variant="ghost"
                    rightIcon={showAdvanced ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    data-testid="advanced-filter"
                >
                    고급 필터
                </Button>

                {/* 고급 필터 */}
                <Collapse in={showAdvanced}>
                    <VStack align="stretch" spacing={4} pt={2} data-testid="filter-panel">
                        {/* 작성자 */}
                        <VStack align="stretch" spacing={2}>
                            <Text fontSize="sm" fontWeight="medium">
                                작성자
                            </Text>
                            <Input
                                size="sm"
                                placeholder="작성자 이름"
                                value={filters.author || ''}
                                onChange={(e) =>
                                    handleFilterChange('author', e.target.value || null)
                                }
                            />
                        </VStack>

                        {/* 날짜 범위 */}
                        <VStack align="stretch" spacing={2}>
                            <Text fontSize="sm" fontWeight="medium">
                                작성일
                            </Text>
                            <HStack data-testid="date-filter">
                                <Input
                                    size="sm"
                                    type="date"
                                    placeholder="시작일"
                                    value={filters.dateFrom || ''}
                                    onChange={(e) =>
                                        handleFilterChange('dateFrom', e.target.value || null)
                                    }
                                />
                                <Text fontSize="sm">~</Text>
                                <Input
                                    size="sm"
                                    type="date"
                                    placeholder="종료일"
                                    value={filters.dateTo || ''}
                                    onChange={(e) =>
                                        handleFilterChange('dateTo', e.target.value || null)
                                    }
                                />
                            </HStack>
                        </VStack>

                        {/* 빠른 날짜 선택 */}
                        <Stack direction="row" spacing={2} flexWrap="wrap">
                            <Button
                                size="xs"
                                variant="outline"
                                onClick={() => {
                                    const today = new Date();
                                    const weekAgo = new Date(today);
                                    weekAgo.setDate(weekAgo.getDate() - 7);
                                    handleFilterChange('dateFrom', weekAgo.toISOString().split('T')[0]);
                                    handleFilterChange('dateTo', today.toISOString().split('T')[0]);
                                }}
                            >
                                최근 1주일
                            </Button>
                            <Button
                                size="xs"
                                variant="outline"
                                onClick={() => {
                                    const today = new Date();
                                    const monthAgo = new Date(today);
                                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                                    handleFilterChange('dateFrom', monthAgo.toISOString().split('T')[0]);
                                    handleFilterChange('dateTo', today.toISOString().split('T')[0]);
                                }}
                            >
                                최근 1개월
                            </Button>
                            <Button
                                size="xs"
                                variant="outline"
                                onClick={() => {
                                    const today = new Date();
                                    const yearAgo = new Date(today);
                                    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                                    handleFilterChange('dateFrom', yearAgo.toISOString().split('T')[0]);
                                    handleFilterChange('dateTo', today.toISOString().split('T')[0]);
                                }}
                            >
                                최근 1년
                            </Button>
                        </Stack>
                    </VStack>
                </Collapse>
            </VStack>
        </Box>
    );
};

export default SearchFiltersComponent;
