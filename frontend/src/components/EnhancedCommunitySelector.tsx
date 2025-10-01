import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    Box,
    Input,
    VStack,
    Text,
    Button,
    List,
    ListItem,
    Flex,
    IconButton,
    InputGroup,
    InputRightElement,
    useDisclosure,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverBody,
    Portal
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, SearchIcon } from '@chakra-ui/icons';

interface Community {
    id: string;
    title: string;
    description?: string;
}

interface EnhancedCommunitySelectorProps {
    communities: Community[];
    selectedCommunityId: string | null;
    onCommunitySelect: (communityId: string) => void;
    placeholder?: string;
}

const EnhancedCommunitySelector: React.FC<EnhancedCommunitySelectorProps> = ({
    communities,
    selectedCommunityId,
    onCommunitySelect,
    placeholder = "Select a community..."
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Filter communities based on search query
    const filteredCommunities = useMemo(() => {
        if (!searchQuery.trim()) return communities;
        return communities.filter(community =>
            community.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            community.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [communities, searchQuery]);

    // Get selected community info
    const selectedCommunity = communities.find(c => c.id === selectedCommunityId);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredCommunities.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredCommunities.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && filteredCommunities[highlightedIndex]) {
                    onCommunitySelect(filteredCommunities[highlightedIndex].id);
                    setIsOpen(false);
                    setSearchQuery('');
                    setHighlightedIndex(-1);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSearchQuery('');
                setHighlightedIndex(-1);
                break;
        }
    };

    // Handle community selection
    const handleCommunitySelect = (communityId: string) => {
        onCommunitySelect(communityId);
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
    };

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setHighlightedIndex(-1);
        if (!isOpen) setIsOpen(true);
    };

    // Handle input focus
    const handleInputFocus = () => {
        setIsOpen(true);
    };

    // Handle input blur (with delay to allow clicks)
    const handleInputBlur = () => {
        setTimeout(() => setIsOpen(false), 150);
    };

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const highlightedItem = listRef.current.children[highlightedIndex] as HTMLElement;
            if (highlightedItem) {
                highlightedItem.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex]);

    return (
        <Box position="relative">
            <Text fontSize="sm" fontWeight="medium" mb={2}>
                Community Selection
            </Text>

            <InputGroup>
                <Input
                    ref={inputRef}
                    value={isOpen ? searchQuery : (selectedCommunity?.title || '')}
                    onChange={handleSearchChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    size="sm"
                    pr="2.5rem"
                />
                <InputRightElement width="2.5rem">
                    <IconButton
                        aria-label="Toggle dropdown"
                        icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsOpen(!isOpen)}
                    />
                </InputRightElement>
            </InputGroup>

            {isOpen && (
                <Box
                    ref={listRef}
                    position="absolute"
                    top="100%"
                    left={0}
                    right={0}
                    zIndex={1000}
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    boxShadow="lg"
                    maxH="300px"
                    overflowY="auto"
                    mt={1}
                >
                    <List spacing={0}>
                        {filteredCommunities.length > 0 ? (
                            filteredCommunities.map((community, index) => (
                                <ListItem
                                    key={community.id}
                                    bg={highlightedIndex === index ? "blue.50" : "transparent"}
                                    _hover={{ bg: "gray.50" }}
                                    cursor="pointer"
                                    onClick={() => handleCommunitySelect(community.id)}
                                    px={3}
                                    py={2}
                                    borderBottom="1px solid"
                                    borderBottomColor="gray.100"
                                >
                                    <VStack align="start" spacing={1}>
                                        <Text
                                            fontSize="sm"
                                            fontWeight="medium"
                                            color={selectedCommunityId === community.id ? "blue.600" : "gray.700"}
                                        >
                                            {community.title}
                                        </Text>
                                        {community.description && (
                                            <Text fontSize="xs" color="gray.500">
                                                {community.description}
                                            </Text>
                                        )}
                                    </VStack>
                                </ListItem>
                            ))
                        ) : (
                            <ListItem px={3} py={2}>
                                <Text fontSize="sm" color="gray.500">
                                    No communities found
                                </Text>
                            </ListItem>
                        )}
                    </List>
                </Box>
            )}

            {selectedCommunity && (
                <Text fontSize="xs" color="gray.600" mt={1}>
                    {selectedCommunity.description || 'No description available'}
                </Text>
            )}
        </Box>
    );
};

export default EnhancedCommunitySelector;
