import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Button,
    HStack,
    Text,
    VStack,
    Badge,
    Divider,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Code,
    Flex,
    IconButton,
    useToast,
    Switch,
    FormControl,
    FormLabel,
    Tooltip
} from '@chakra-ui/react';
import {
    ArrowForwardIcon,
    ArrowBackIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    VolumeIcon,
    VolumeOffIcon
} from '@chakra-ui/icons';
import { executeAction, getActionHistory } from '../utils/actionGenerators';
import { playActionSound, soundEffects } from '../utils/soundEffects';
import { animationUtils } from '../utils/animations';
import { keyboardShortcutManager } from '../utils/keyboardShortcuts';

interface PaginationState {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
}

const PaginationControls: React.FC = () => {
    const [paginationState, setPaginationState] = useState<PaginationState>({
        currentPage: 1,
        totalPages: 10,
        pageSize: 10,
        totalItems: 100
    });

    const [lastPaginationAction, setLastPaginationAction] = useState<any>(null);
    const [isSoundEnabled, setIsSoundEnabled] = useState(soundEffects.isSoundEnabled());
    const [isAnimating, setIsAnimating] = useState<string | null>(null);
    const toast = useToast();
    const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

    // Load pagination state from localStorage on mount
    useEffect(() => {
        const savedState = localStorage.getItem('paginationState');
        if (savedState) {
            setPaginationState(JSON.parse(savedState));
        }
    }, []);

    // Setup keyboard shortcuts for pagination
    useEffect(() => {
        keyboardShortcutManager.setCallbacks({
            onPageJump: (pageNumber) => {
                handlePageJump(pageNumber);
            }
        });

        return () => {
            keyboardShortcutManager.setCallbacks({});
        };
    }, []);

    // Save pagination state to localStorage
    const savePaginationState = (newState: PaginationState) => {
        setPaginationState(newState);
        localStorage.setItem('paginationState', JSON.stringify(newState));
    };

    // Handle next page with sound and animation
    const handleNextPage = async () => {
        if (paginationState.currentPage < paginationState.totalPages) {
            setIsAnimating('nextPage');

            // Create ripple effect
            const button = buttonRefs.current['nextPage'];
            if (button) {
                animationUtils.createRipple(
                    { currentTarget: button, clientX: 0, clientY: 0 } as React.MouseEvent<HTMLButtonElement>,
                    'rgba(6, 182, 212, 0.3)'
                );
            }

            const newState = {
                ...paginationState,
                currentPage: paginationState.currentPage + 1
            };
            savePaginationState(newState);

            // Execute next page action
            const action = executeAction('nextPage');
            setLastPaginationAction(action);

            // Play sound effect
            if (isSoundEnabled) {
                await playActionSound('PAGE_NEXT');
            }

            // Show success notification
            animationUtils.showSuccessNotification(`Moved to page ${newState.currentPage}`, 2000);

            toast({
                title: 'Page Changed',
                description: `Moved to page ${newState.currentPage}`,
                status: 'success',
                duration: 2000,
                isClosable: true,
            });

            // Clear animation state
            setTimeout(() => {
                setIsAnimating(null);
            }, 500);
        } else {
            // Play error sound
            if (isSoundEnabled) {
                await playActionSound('ERROR');
            }

            toast({
                title: 'Last Page',
                description: 'You are already on the last page',
                status: 'info',
                duration: 2000,
                isClosable: true,
            });
        }
    };

    // Handle previous page with sound and animation
    const handlePreviousPage = async () => {
        if (paginationState.currentPage > 1) {
            setIsAnimating('previousPage');

            // Create ripple effect
            const button = buttonRefs.current['previousPage'];
            if (button) {
                animationUtils.createRipple(
                    { currentTarget: button, clientX: 0, clientY: 0 } as React.MouseEvent<HTMLButtonElement>,
                    'rgba(107, 114, 128, 0.3)'
                );
            }

            const newState = {
                ...paginationState,
                currentPage: paginationState.currentPage - 1
            };
            savePaginationState(newState);

            // Execute previous page action
            const action = executeAction('previousPage');
            setLastPaginationAction(action);

            // Play sound effect
            if (isSoundEnabled) {
                await playActionSound('PAGE_PREV');
            }

            // Show success notification
            animationUtils.showSuccessNotification(`Moved to page ${newState.currentPage}`, 2000);

            toast({
                title: 'Page Changed',
                description: `Moved to page ${newState.currentPage}`,
                status: 'success',
                duration: 2000,
                isClosable: true,
            });

            // Clear animation state
            setTimeout(() => {
                setIsAnimating(null);
            }, 500);
        } else {
            // Play error sound
            if (isSoundEnabled) {
                await playActionSound('ERROR');
            }

            toast({
                title: 'First Page',
                description: 'You are already on the first page',
                status: 'info',
                duration: 2000,
                isClosable: true,
            });
        }
    };

    // Toggle sound on/off
    const handleToggleSound = () => {
        const newSoundState = !isSoundEnabled;
        setIsSoundEnabled(newSoundState);
        soundEffects.toggleSound();

        toast({
            title: newSoundState ? 'Sound Enabled' : 'Sound Disabled',
            description: newSoundState ? 'Pagination sounds are now enabled' : 'Pagination sounds are now disabled',
            status: 'info',
            duration: 1500,
            isClosable: true,
        });
    };

    // Handle page jump
    const handlePageJump = (page: number) => {
        if (page >= 1 && page <= paginationState.totalPages) {
            const newState = {
                ...paginationState,
                currentPage: page
            };
            savePaginationState(newState);

            toast({
                title: 'Page Jumped',
                description: `Jumped to page ${page}`,
                status: 'success',
                duration: 2000,
                isClosable: true,
            });
        }
    };

    // Generate page numbers for display
    const generatePageNumbers = () => {
        const pages = [];
        const { currentPage, totalPages } = paginationState;

        // Always show first page
        pages.push(1);

        // Show ellipsis if needed
        if (currentPage > 3) {
            pages.push('...');
        }

        // Show pages around current page
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            if (!pages.includes(i)) {
                pages.push(i);
            }
        }

        // Show ellipsis if needed
        if (currentPage < totalPages - 2) {
            pages.push('...');
        }

        // Always show last page
        if (totalPages > 1) {
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <Box p={6} bg="white" borderRadius="lg" boxShadow="md">
            <VStack spacing={6} align="stretch">
                {/* Header */}
                <Box>
                    <Flex justify="space-between" align="center" mb={2}>
                        <Box>
                            <Text fontSize="2xl" fontWeight="bold">
                                Pagination Controls
                            </Text>
                            <Text color="gray.600" fontSize="sm">
                                Click to move between pages. Each action generates a unique function.
                            </Text>
                        </Box>
                        <FormControl display="flex" alignItems="center" width="auto">
                            <FormLabel htmlFor="pagination-sound-toggle" mb="0" fontSize="sm">
                                Sound
                            </FormLabel>
                            <Tooltip label={isSoundEnabled ? "Disable pagination sounds" : "Enable pagination sounds"}>
                                <Switch
                                    id="pagination-sound-toggle"
                                    isChecked={isSoundEnabled}
                                    onChange={handleToggleSound}
                                    colorScheme="cyan"
                                />
                            </Tooltip>
                        </FormControl>
                    </Flex>
                </Box>

                {/* Current Page Info */}
                <Box p={4} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                    <VStack spacing={2}>
                        <Text fontSize="lg" fontWeight="semibold" color="blue.700">
                            Current Page: {paginationState.currentPage} of {paginationState.totalPages}
                        </Text>
                        <HStack spacing={4}>
                            <Badge colorScheme="blue" fontSize="sm">
                                Page Size: {paginationState.pageSize}
                            </Badge>
                            <Badge colorScheme="green" fontSize="sm">
                                Total Items: {paginationState.totalItems}
                            </Badge>
                        </HStack>
                    </VStack>
                </Box>

                {/* Navigation Buttons */}
                <Box>
                    <Text fontSize="lg" fontWeight="semibold" mb={3}>
                        Page Navigation
                    </Text>
                    <HStack spacing={3} wrap="wrap" justify="center">
                        <Button
                            ref={(el) => (buttonRefs.current['previousPage'] = el)}
                            leftIcon={<ArrowBackIcon />}
                            colorScheme="gray"
                            onClick={handlePreviousPage}
                            isDisabled={paginationState.currentPage === 1}
                            isLoading={isAnimating === 'previousPage'}
                            loadingText="Loading..."
                            size="md"
                            _hover={{ transform: 'translateY(-2px)' }}
                            transition="all 0.2s ease"
                        >
                            <HStack spacing={2}>
                                <Text>Previous Page</Text>
                                <Code fontSize="xs" colorScheme="gray">
                                    ←
                                </Code>
                            </HStack>
                        </Button>

                        <Button
                            leftIcon={<ChevronLeftIcon />}
                            colorScheme="gray"
                            onClick={() => handlePageJump(Math.max(1, paginationState.currentPage - 5))}
                            isDisabled={paginationState.currentPage <= 5}
                            size="sm"
                        >
                            -5
                        </Button>

                        <Button
                            leftIcon={<ChevronUpIcon />}
                            colorScheme="gray"
                            onClick={() => handlePageJump(Math.max(1, paginationState.currentPage - 1))}
                            isDisabled={paginationState.currentPage === 1}
                            size="sm"
                        >
                            -1
                        </Button>

                        <Button
                            leftIcon={<ChevronDownIcon />}
                            colorScheme="gray"
                            onClick={() => handlePageJump(Math.min(paginationState.totalPages, paginationState.currentPage + 1))}
                            isDisabled={paginationState.currentPage === paginationState.totalPages}
                            size="sm"
                        >
                            +1
                        </Button>

                        <Button
                            leftIcon={<ChevronRightIcon />}
                            colorScheme="gray"
                            onClick={() => handlePageJump(Math.min(paginationState.totalPages, paginationState.currentPage + 5))}
                            isDisabled={paginationState.currentPage >= paginationState.totalPages - 4}
                            size="sm"
                        >
                            +5
                        </Button>

                        <Button
                            ref={(el) => (buttonRefs.current['nextPage'] = el)}
                            rightIcon={<ArrowForwardIcon />}
                            colorScheme="cyan"
                            onClick={handleNextPage}
                            isDisabled={paginationState.currentPage === paginationState.totalPages}
                            isLoading={isAnimating === 'nextPage'}
                            loadingText="Loading..."
                            size="md"
                            _hover={{ transform: 'translateY(-2px)' }}
                            transition="all 0.2s ease"
                        >
                            <HStack spacing={2}>
                                <Text>Next Page</Text>
                                <Code fontSize="xs" colorScheme="cyan">
                                    →
                                </Code>
                            </HStack>
                        </Button>
                    </HStack>
                </Box>

                {/* Page Numbers */}
                <Box>
                    <Text fontSize="lg" fontWeight="semibold" mb={3}>
                        Quick Page Jump
                    </Text>
                    <HStack spacing={2} wrap="wrap" justify="center">
                        {generatePageNumbers().map((page, index) => (
                            <Button
                                key={index}
                                size="sm"
                                colorScheme={page === paginationState.currentPage ? "blue" : "gray"}
                                variant={page === paginationState.currentPage ? "solid" : "outline"}
                                onClick={() => typeof page === 'number' && handlePageJump(page)}
                                isDisabled={page === '...'}
                            >
                                {page}
                            </Button>
                        ))}
                    </HStack>
                </Box>

                {/* Last Pagination Action */}
                {lastPaginationAction && (
                    <Box>
                        <Text fontSize="lg" fontWeight="semibold" mb={3}>
                            Last Pagination Action
                        </Text>
                        <Alert status="success" borderRadius="md">
                            <AlertIcon />
                            <Box>
                                <AlertTitle>{lastPaginationAction.actionType}</AlertTitle>
                                <AlertDescription>
                                    {lastPaginationAction.message}
                                </AlertDescription>
                                <Box mt={2}>
                                    <Code fontSize="xs" colorScheme="green">
                                        {lastPaginationAction.actionString}
                                    </Code>
                                </Box>
                            </Box>
                        </Alert>
                    </Box>
                )}

                {/* Action History for Pagination */}
                <Box>
                    <Text fontSize="lg" fontWeight="semibold" mb={3}>
                        Pagination Action History
                    </Text>
                    <Box maxH="200px" overflowY="auto">
                        {getActionHistory()
                            .filter(action => action.actionType.includes('PAGE'))
                            .slice(-5)
                            .reverse()
                            .map((action, index) => (
                                <Box
                                    key={`${action.timestamp}-${action.uniqueId}`}
                                    p={2}
                                    bg="gray.50"
                                    borderRadius="md"
                                    mb={2}
                                >
                                    <Flex align="center" justify="space-between">
                                        <VStack align="start" spacing={1}>
                                            <HStack spacing={2}>
                                                <Badge colorScheme="cyan" fontSize="xs">
                                                    {action.actionType}
                                                </Badge>
                                                <Text fontSize="xs" color="gray.500">
                                                    {new Date(action.timestamp).toLocaleTimeString()}
                                                </Text>
                                            </HStack>
                                            <Text fontSize="sm" fontWeight="medium">
                                                {action.message}
                                            </Text>
                                            <Code fontSize="xs" colorScheme="gray">
                                                {action.actionString}
                                            </Code>
                                        </VStack>
                                    </Flex>
                                </Box>
                            ))}
                    </Box>
                </Box>
            </VStack>
        </Box>
    );
};

export default PaginationControls;
