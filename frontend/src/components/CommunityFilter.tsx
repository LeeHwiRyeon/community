import React, { useState, useMemo } from 'react';
import {
    Box,
    Select,
    HStack,
    VStack,
    Text,
    Badge,
    Flex,
    Divider
} from '@chakra-ui/react';
import { Post } from '../api';
import EnhancedCommunitySelector from './EnhancedCommunitySelector';
import EnhancedSearchBox from './EnhancedSearchBox';

interface Community {
    id: string;
    title: string;
    description?: string;
}

interface CommunityFilterProps {
    communities: Community[];
    selectedCommunityId: string | null;
    onCommunitySelect: (communityId: string) => void;
    posts: Post[];
    onFilteredPostsChange: (posts: Post[]) => void;
}

const CommunityFilter: React.FC<CommunityFilterProps> = ({
    communities = [],
    selectedCommunityId,
    onCommunitySelect,
    posts = [],
    onFilteredPostsChange
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'views'>('recent');

    // 필터링된 게시글 계산
    const filteredPosts = useMemo(() => {
        if (!posts || !Array.isArray(posts)) {
            return [];
        }
        let filtered = [...posts];

        // 검색어 필터링
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(post =>
                post.title.toLowerCase().includes(query) ||
                post.content?.toLowerCase().includes(query) ||
                post.author?.toLowerCase().includes(query)
            );
        }

        // 정렬
        switch (sortBy) {
            case 'popular':
                filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
                break;
            case 'views':
                filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
                break;
            case 'recent':
            default:
                filtered.sort((a, b) => {
                    const dateA = new Date(a.created_at || a.updated_at || a.date || 0).getTime();
                    const dateB = new Date(b.created_at || b.updated_at || b.date || 0).getTime();
                    return dateB - dateA;
                });
                break;
        }

        return filtered;
    }, [posts, searchQuery, sortBy]);

    // 필터링된 게시글이 변경될 때마다 부모 컴포넌트에 알림
    React.useEffect(() => {
        onFilteredPostsChange(filteredPosts);
    }, [filteredPosts, onFilteredPostsChange]);

    const clearSearch = () => {
        setSearchQuery('');
    };

    const selectedCommunity = communities.find(c => c.id === selectedCommunityId);

    return (
        <Box className="community-filter" p={4} bg="white" borderRadius="md" border="1px" borderColor="gray.200">
            <VStack spacing={4} align="stretch">
                {/* 커뮤니티 선택 */}
                <EnhancedCommunitySelector
                    communities={communities}
                    selectedCommunityId={selectedCommunityId}
                    onCommunitySelect={onCommunitySelect}
                    placeholder="Select a community..."
                />

                <Divider />

                {/* 검색 및 정렬 */}
                <Box>
                    <EnhancedSearchBox
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onSearchSubmit={(query) => {
                            setSearchQuery(query);
                            // Trigger search immediately
                        }}
                        onClearSearch={clearSearch}
                        placeholder="Search posts by title, content, or author..."
                    />

                    {/* 정렬 옵션 */}
                    <HStack spacing={2} wrap="wrap" mt={3}>
                        <Text fontSize="xs" color="gray.600" minW="fit-content">
                            Sort by:
                        </Text>
                        <Select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            size="sm"
                            maxW="150px"
                        >
                            <option value="recent">Most Recent</option>
                            <option value="popular">Most Popular</option>
                            <option value="views">Most Views</option>
                        </Select>
                    </HStack>
                </Box>

                {/* 필터 결과 요약 */}
                <Box>
                    <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                        <HStack spacing={2}>
                            {searchQuery && (
                                <Badge colorScheme="green" variant="subtle">
                                    Filtered by: "{searchQuery}"
                                </Badge>
                            )}
                            <Badge colorScheme="purple" variant="subtle">
                                Sorted by: {sortBy === 'recent' ? 'Recent' : sortBy === 'popular' ? 'Popular' : 'Views'}
                            </Badge>
                        </HStack>

                        {filteredPosts.length !== posts.length && (
                            <Text fontSize="xs" color="gray.500">
                                Showing {filteredPosts.length} of {posts.length} posts
                            </Text>
                        )}
                    </Flex>
                </Box>
            </VStack>
        </Box>
    );
};

export default CommunityFilter;