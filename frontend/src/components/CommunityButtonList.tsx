import React from 'react';
import { Box, Button, ButtonGroup, Flex, Spinner, Text } from '@chakra-ui/react';

interface Community {
    id: string;
    title: string;
    description?: string;
    boards?: Array<{
        id: string;
        title: string;
    }>;
}

interface CommunityButtonListProps {
    communities: Community[];
    selectedCommunityId: string | null;
    onCommunitySelect: (communityId: string) => void;
    isLoading?: boolean;
}

const CommunityButtonList: React.FC<CommunityButtonListProps> = ({
    communities = [],
    selectedCommunityId,
    onCommunitySelect,
    isLoading = false
}) => {
    if (isLoading) {
        return (
            <Box className="community-button-list">
                <Flex align="center" gap={4} mb={4}>
                    <Spinner size="sm" />
                    <Text fontSize="sm" color="gray.500">Loading communities...</Text>
                </Flex>
            </Box>
        );
    }

    if (!communities || communities.length === 0) {
        return (
            <Box className="community-button-list">
                <Text fontSize="sm" color="gray.500" mb={4}>No communities available</Text>
            </Box>
        );
    }

    return (
        <Box className="community-button-list">
            <Text fontSize="sm" color="gray.600" mb={3}>
                Select a community to browse posts:
            </Text>

            <ButtonGroup
                size="sm"
                variant="outline"
                spacing={2}
                flexWrap="wrap"
                gap={2}
            >
                {/* "All" option at the top */}
                <Button
                    key="all"
                    onClick={() => onCommunitySelect('all')}
                    colorScheme={selectedCommunityId === 'all' ? 'blue' : 'gray'}
                    variant={selectedCommunityId === 'all' ? 'solid' : 'outline'}
                    size="sm"
                    minW="auto"
                    px={4}
                    py={2}
                    borderRadius="md"
                    _hover={{
                        transform: 'translateY(-1px)',
                        boxShadow: 'md'
                    }}
                    transition="all 0.2s"
                    className={`community-button ${selectedCommunityId === 'all' ? 'selected' : ''}`}
                >
                    All
                </Button>

                {communities.map((community) => (
                    <Button
                        key={community.id}
                        onClick={() => onCommunitySelect(community.id)}
                        colorScheme={selectedCommunityId === community.id ? 'blue' : 'gray'}
                        variant={selectedCommunityId === community.id ? 'solid' : 'outline'}
                        size="sm"
                        minW="auto"
                        px={4}
                        py={2}
                        borderRadius="md"
                        _hover={{
                            transform: 'translateY(-1px)',
                            boxShadow: 'md'
                        }}
                        transition="all 0.2s"
                        className={`community-button ${selectedCommunityId === community.id ? 'selected' : ''}`}
                    >
                        {community.title}
                    </Button>
                ))}
            </ButtonGroup>

            {selectedCommunityId && (
                <Box mt={3} p={3} bg="gray.50" borderRadius="md">
                    <Text fontSize="xs" color="gray.600">
                        Selected: <strong>
                            {selectedCommunityId === 'all'
                                ? 'All Communities'
                                : communities.find(c => c.id === selectedCommunityId)?.title
                            }
                        </strong>
                    </Text>
                    {selectedCommunityId !== 'all' && communities.find(c => c.id === selectedCommunityId)?.description && (
                        <Text fontSize="xs" color="gray.500" mt={1}>
                            {communities.find(c => c.id === selectedCommunityId)?.description}
                        </Text>
                    )}
                    {selectedCommunityId === 'all' && (
                        <Text fontSize="xs" color="gray.500" mt={1}>
                            Browse posts from all communities in order
                        </Text>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default CommunityButtonList;