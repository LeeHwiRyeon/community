/**
 * 검색 바 컴포넌트
 * 자동완성 기능이 포함된 검색 입력 필드
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Input,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    List,
    ListItem,
    IconButton,
    Text,
    VStack,
    HStack,
    Badge,
    useColorModeValue,
    Spinner
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon } from '@chakra-ui/icons';
import { apiClient } from '../utils/apiClient';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:50000';

interface AutocompleteSuggestion {
    id: number;
    title: string;
    category: string;
}

interface SearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
    showPopular?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
    onSearch,
    placeholder = '게시물 검색...',
    showPopular = true
}) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
    const [popularTerms, setPopularTerms] = useState<Array<{ term: string; count: number }>>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

    // 인기 검색어 가져오기
    useEffect(() => {
        if (showPopular) {
            fetchPopularTerms();
        }
    }, [showPopular]);

    // 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 자동완성 디바운스
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length > 0) {
                fetchAutocomplete(query);
            } else {
                setSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const fetchPopularTerms = async () => {
        try {
            // Simple Search API 사용 (MySQL Full-Text)
            const response = await apiClient.get('/api/simple-search/popular?limit=5');
            if (response.data.terms) {
                setPopularTerms(response.data.terms);
            }
        } catch (error) {
            console.error('인기 검색어 조회 실패:', error);
        }
    };

    const fetchAutocomplete = async (q: string) => {
        try {
            setIsLoading(true);
            // Simple Search API 사용 (MySQL Full-Text)
            const response = await apiClient.get('/api/simple-search/autocomplete', {
                params: { q, limit: 5 }
            });

            // 응답 형식: { suggestions: ["title1", "title2", ...] }
            if (response.data.suggestions) {
                // 간단한 형태로 변환
                const formattedSuggestions = response.data.suggestions.map((title: string, index: number) => ({
                    id: index,
                    title,
                    category: '게시물' // 기본 카테고리
                }));
                setSuggestions(formattedSuggestions);
                setShowSuggestions(true);
            }
        } catch (error) {
            console.error('자동완성 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        if (query.trim()) {
            onSearch(query.trim());
            setShowSuggestions(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestion: AutocompleteSuggestion) => {
        setQuery(suggestion.title);
        onSearch(suggestion.title);
        setShowSuggestions(false);
    };

    const handlePopularTermClick = (term: string) => {
        setQuery(term);
        onSearch(term);
        setShowSuggestions(false);
    };

    const handleClear = () => {
        setQuery('');
        setSuggestions([]);
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    return (
        <Box ref={containerRef} position="relative" width="100%">
            <InputGroup size="lg">
                <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder={placeholder}
                    bg={bgColor}
                    borderColor={borderColor}
                    _focus={{
                        borderColor: 'blue.400',
                        boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)'
                    }}
                    data-testid="search-bar"
                />
                <InputRightElement width="4.5rem">
                    <HStack spacing={1}>
                        {isLoading && <Spinner size="sm" />}
                        {query && (
                            <IconButton
                                aria-label="검색어 지우기"
                                icon={<CloseIcon />}
                                size="sm"
                                variant="ghost"
                                onClick={handleClear}
                            />
                        )}
                    </HStack>
                </InputRightElement>
            </InputGroup>

            {/* 자동완성 및 인기 검색어 */}
            {showSuggestions && (
                <Box
                    position="absolute"
                    top="calc(100% + 8px)"
                    left={0}
                    right={0}
                    bg={bgColor}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="md"
                    boxShadow="lg"
                    maxH="400px"
                    overflowY="auto"
                    zIndex={1000}
                    data-testid="autocomplete-dropdown"
                >
                    {/* 자동완성 결과 */}
                    {suggestions.length > 0 && (
                        <VStack align="stretch" spacing={0}>
                            <Box px={4} py={2} borderBottomWidth="1px" borderColor={borderColor}>
                                <Text fontSize="sm" fontWeight="bold" color="gray.500">
                                    검색 제안
                                </Text>
                            </Box>
                            <List>
                                {suggestions.map((suggestion) => (
                                    <ListItem
                                        key={suggestion.id}
                                        px={4}
                                        py={3}
                                        cursor="pointer"
                                        _hover={{ bg: hoverBgColor }}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                    >
                                        <HStack justify="space-between">
                                            <Text fontSize="sm">{suggestion.title}</Text>
                                            <Badge colorScheme="blue" fontSize="xs">
                                                {suggestion.category}
                                            </Badge>
                                        </HStack>
                                    </ListItem>
                                ))}
                            </List>
                        </VStack>
                    )}

                    {/* 인기 검색어 */}
                    {!query && showPopular && popularTerms.length > 0 && (
                        <VStack align="stretch" spacing={0} mt={suggestions.length > 0 ? 2 : 0} data-testid="search-history">
                            <Box px={4} py={2} borderBottomWidth="1px" borderColor={borderColor}>
                                <Text fontSize="sm" fontWeight="bold" color="gray.500">
                                    인기 검색어
                                </Text>
                            </Box>
                            <List>
                                {popularTerms.map((item, index) => (
                                    <ListItem
                                        key={index}
                                        px={4}
                                        py={3}
                                        cursor="pointer"
                                        _hover={{ bg: hoverBgColor }}
                                        onClick={() => handlePopularTermClick(item.term)}
                                    >
                                        <HStack justify="space-between">
                                            <HStack>
                                                <Badge colorScheme="red" fontSize="xs">
                                                    {index + 1}
                                                </Badge>
                                                <Text fontSize="sm">{item.term}</Text>
                                            </HStack>
                                            <Text fontSize="xs" color="gray.500">
                                                {item.count}개
                                            </Text>
                                        </HStack>
                                    </ListItem>
                                ))}
                            </List>
                        </VStack>
                    )}

                    {/* 검색 결과 없음 */}
                    {query && suggestions.length === 0 && !isLoading && (
                        <Box px={4} py={6} textAlign="center">
                            <Text fontSize="sm" color="gray.500">
                                검색 결과가 없습니다
                            </Text>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default SearchBar;
