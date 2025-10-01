import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Input,
    VStack,
    Text,
    Button,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    IconButton,
    HStack,
    Badge,
    Flex
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon, FilterIcon } from '@chakra-ui/icons';

interface EnhancedSearchBoxProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onSearchSubmit: (query: string) => void;
    onClearSearch: () => void;
    placeholder?: string;
    showFilters?: boolean;
    onFilterClick?: () => void;
}

const EnhancedSearchBox: React.FC<EnhancedSearchBoxProps> = ({
    searchQuery,
    onSearchChange,
    onSearchSubmit,
    onClearSearch,
    placeholder = "Search posts by title, content, or author...",
    showFilters = false,
    onFilterClick
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Handle search input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSearchChange(e.target.value);
    };

    // Handle search submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearchSubmit(searchQuery);
    };

    // Handle clear search
    const handleClear = () => {
        onClearSearch();
        inputRef.current?.focus();
    };

    // Handle keyboard shortcuts
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleClear();
        } else if (e.key === 'Enter') {
            onSearchSubmit(searchQuery);
        }
    };

    // Focus input when component mounts
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    return (
        <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
                Search & Sort Posts
            </Text>

            <form onSubmit={handleSubmit}>
                <InputGroup size="sm">
                    <InputLeftElement pointerEvents="none">
                        <SearchIcon color="gray.300" />
                    </InputLeftElement>
                    <Input
                        ref={inputRef}
                        value={searchQuery}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder={placeholder}
                        pr={searchQuery ? "4rem" : "2.5rem"}
                        borderColor={isFocused ? "blue.300" : "gray.200"}
                        _focus={{
                            borderColor: "blue.500",
                            boxShadow: "0 0 0 1px #3182ce"
                        }}
                    />
                    <InputRightElement width="4rem">
                        <HStack spacing={1}>
                            {searchQuery && (
                                <IconButton
                                    aria-label="Clear search"
                                    icon={<CloseIcon />}
                                    size="xs"
                                    variant="ghost"
                                    onClick={handleClear}
                                />
                            )}
                            {showFilters && onFilterClick && (
                                <IconButton
                                    aria-label="Open filters"
                                    icon={<FilterIcon />}
                                    size="xs"
                                    variant="ghost"
                                    onClick={onFilterClick}
                                />
                            )}
                        </HStack>
                    </InputRightElement>
                </InputGroup>
            </form>

            {/* Search status */}
            {searchQuery && (
                <Flex justify="space-between" align="center" mt={2}>
                    <HStack spacing={2}>
                        <Badge colorScheme="green" variant="subtle" fontSize="xs">
                            Searching: "{searchQuery}"
                        </Badge>
                    </HStack>
                    <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        onClick={handleClear}
                    >
                        Clear
                    </Button>
                </Flex>
            )}

            {/* Search tips */}
            {isFocused && !searchQuery && (
                <Box mt={2} p={2} bg="gray.50" borderRadius="md">
                    <Text fontSize="xs" color="gray.600">
                        💡 Press Enter to search or Escape to clear
                    </Text>
                </Box>
            )}
        </Box>
    );
};

export default EnhancedSearchBox;
