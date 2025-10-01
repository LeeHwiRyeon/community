import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Button,
    VStack,
    HStack,
    Text,
    Badge,
    Divider,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Code,
    Flex,
    Spacer,
    IconButton,
    useToast,
    Switch,
    FormControl,
    FormLabel,
    Tooltip
} from '@chakra-ui/react';
import {
    AddIcon,
    ChatIcon,
    StarIcon,
    ShareIcon,
    ArrowForwardIcon,
    ArrowBackIcon,
    DeleteIcon,
    RepeatIcon,
    VolumeIcon,
    VolumeOffIcon,
    InfoIcon,
    CalendarIcon
} from '@chakra-ui/icons';
import {
    executeAction,
    getActionHistory,
    clearActionHistory,
    ACTION_REGISTRY
} from '../utils/actionGenerators';
import { playActionSound, soundEffects } from '../utils/soundEffects';
import { animationUtils, getAnimationForAction } from '../utils/animations';
import { keyboardShortcutManager, formatShortcutDisplay } from '../utils/keyboardShortcuts';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';
import { analyticsManager } from '../utils/analytics';

interface ActionResult {
    actionType: string;
    actionString: string;
    timestamp: number;
    uniqueId: string;
    message: string;
    data: any;
}

const ActionButtons: React.FC = () => {
    const [actionHistory, setActionHistory] = useState<ActionResult[]>([]);
    const [lastAction, setLastAction] = useState<ActionResult | null>(null);
    const [isSoundEnabled, setIsSoundEnabled] = useState(soundEffects.isSoundEnabled());
    const [isAnimating, setIsAnimating] = useState<string | null>(null);
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
    const toast = useToast();
    const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

    // Load action history on component mount
    useEffect(() => {
        const history = getActionHistory();
        setActionHistory(history);
        if (history.length > 0) {
            setLastAction(history[history.length - 1]);
        }
    }, []);

    // Setup keyboard shortcuts
    useEffect(() => {
        keyboardShortcutManager.setCallbacks({
            onActionExecute: (actionType, result) => {
                setLastAction(result);
                const updatedHistory = getActionHistory();
                setActionHistory(updatedHistory);

                // Track analytics for keyboard shortcuts
                analyticsManager.trackAction(result, 'keyboard');

                toast({
                    title: 'Action Executed',
                    description: `${actionType} executed via keyboard shortcut`,
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                });
            },
            onPageJump: (pageNumber) => {
                toast({
                    title: 'Page Jump',
                    description: `Jumped to page ${pageNumber}`,
                    status: 'info',
                    duration: 1500,
                    isClosable: true,
                });
            },
            onHelpToggle: (visible) => {
                setShowShortcutsHelp(visible);
            },
            onClear: () => {
                setLastAction(null);
                toast({
                    title: 'Cleared',
                    description: 'Current action cleared',
                    status: 'info',
                    duration: 1500,
                    isClosable: true,
                });
            }
        });

        return () => {
            keyboardShortcutManager.setCallbacks({});
        };
    }, [toast]);

    // Handle action execution with sound and animation
    const handleAction = async (actionName: keyof typeof ACTION_REGISTRY) => {
        try {
            // Set animation state
            setIsAnimating(actionName);

            // Create ripple effect on button
            const button = buttonRefs.current[actionName];
            if (button) {
                animationUtils.createRipple(
                    { currentTarget: button, clientX: 0, clientY: 0 } as React.MouseEvent<HTMLButtonElement>,
                    'rgba(59, 130, 246, 0.3)'
                );
            }

            const result = executeAction(actionName);
            setLastAction(result);

            // Track analytics
            analyticsManager.trackAction(result, 'click');

            // Play sound effect
            if (isSoundEnabled) {
                await playActionSound(result.actionType);
            }

            // Update history
            const updatedHistory = getActionHistory();
            setActionHistory(updatedHistory);

            // Show success notification with animation
            animationUtils.showSuccessNotification(result.message, 2000);

            // Show success toast
            toast({
                title: 'Action Executed',
                description: result.message,
                status: 'success',
                duration: 2000,
                isClosable: true,
            });

            console.log('Action executed:', result);

            // Clear animation state after delay
            setTimeout(() => {
                setIsAnimating(null);
            }, 500);

        } catch (error) {
            console.error('Error executing action:', error);

            // Play error sound
            if (isSoundEnabled) {
                await playActionSound('ERROR');
            }

            // Show error notification with animation
            animationUtils.showErrorNotification('Failed to execute action', 3000);

            toast({
                title: 'Error',
                description: 'Failed to execute action',
                status: 'error',
                duration: 2000,
                isClosable: true,
            });

            // Clear animation state
            setIsAnimating(null);
        }
    };

    // Toggle sound on/off
    const handleToggleSound = () => {
        const newSoundState = !isSoundEnabled;
        setIsSoundEnabled(newSoundState);
        soundEffects.toggleSound();

        toast({
            title: newSoundState ? 'Sound Enabled' : 'Sound Disabled',
            description: newSoundState ? 'Action sounds are now enabled' : 'Action sounds are now disabled',
            status: 'info',
            duration: 1500,
            isClosable: true,
        });
    };

    // Clear all actions
    const handleClearHistory = () => {
        clearActionHistory();
        setActionHistory([]);
        setLastAction(null);
        toast({
            title: 'History Cleared',
            description: 'All action history has been cleared',
            status: 'info',
            duration: 2000,
            isClosable: true,
        });
    };

    // Refresh history
    const handleRefreshHistory = () => {
        const history = getActionHistory();
        setActionHistory(history);
        if (history.length > 0) {
            setLastAction(history[history.length - 1]);
        }
    };

    return (
        <Box p={6} bg="white" borderRadius="lg" boxShadow="md">
            <VStack spacing={6} align="stretch">
                {/* Header */}
                <Box>
                    <Flex justify="space-between" align="center" mb={2}>
                        <Box>
                            <Text fontSize="2xl" fontWeight="bold">
                                Action Generator Buttons
                            </Text>
                            <Text color="gray.600" fontSize="sm">
                                Each button generates a unique function and string. Click once to see results.
                            </Text>
                        </Box>
                        <HStack spacing={4}>
                            <FormControl display="flex" alignItems="center" width="auto">
                                <FormLabel htmlFor="sound-toggle" mb="0" fontSize="sm">
                                    Sound
                                </FormLabel>
                                <Tooltip label={isSoundEnabled ? "Disable sound effects" : "Enable sound effects"}>
                                    <Switch
                                        id="sound-toggle"
                                        isChecked={isSoundEnabled}
                                        onChange={handleToggleSound}
                                        colorScheme="blue"
                                    />
                                </Tooltip>
                            </FormControl>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowShortcutsHelp(true)}
                                leftIcon={<VolumeIcon />}
                            >
                                Shortcuts (Ctrl+H)
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open('/analytics', '_blank')}
                                leftIcon={<InfoIcon />}
                                colorScheme="purple"
                            >
                                Analytics
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open('/bulk-actions', '_blank')}
                                leftIcon={<AddIcon />}
                                colorScheme="orange"
                            >
                                Bulk Actions
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open('/scheduler', '_blank')}
                                leftIcon={<CalendarIcon />}
                                colorScheme="teal"
                            >
                                Scheduler
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open('/templates', '_blank')}
                                leftIcon={<SettingsIcon />}
                                colorScheme="pink"
                            >
                                Templates
                            </Button>
                        </HStack>
                    </Flex>
                </Box>

                {/* Action Buttons Grid */}
                <Box>
                    <Text fontSize="lg" fontWeight="semibold" mb={4}>
                        Available Actions
                    </Text>
                    <VStack spacing={3} align="stretch">
                        {/* Post Actions */}
                        <HStack spacing={3} wrap="wrap">
                            <Button
                                ref={(el) => (buttonRefs.current['createPost'] = el)}
                                leftIcon={<AddIcon />}
                                colorScheme="blue"
                                onClick={() => handleAction('createPost')}
                                size="md"
                                isLoading={isAnimating === 'createPost'}
                                loadingText="Creating..."
                                _hover={{ transform: 'translateY(-2px)' }}
                                transition="all 0.2s ease"
                            >
                                <HStack spacing={2}>
                                    <Text>Write Post</Text>
                                    <Code fontSize="xs" colorScheme="blue">
                                        Ctrl+P
                                    </Code>
                                </HStack>
                            </Button>
                            <Button
                                ref={(el) => (buttonRefs.current['createComment'] = el)}
                                leftIcon={<ChatIcon />}
                                colorScheme="green"
                                onClick={() => handleAction('createComment')}
                                size="md"
                                isLoading={isAnimating === 'createComment'}
                                loadingText="Adding..."
                                _hover={{ transform: 'translateY(-2px)' }}
                                transition="all 0.2s ease"
                            >
                                <HStack spacing={2}>
                                    <Text>Add Comment</Text>
                                    <Code fontSize="xs" colorScheme="green">
                                        Ctrl+C
                                    </Code>
                                </HStack>
                            </Button>
                            <Button
                                ref={(el) => (buttonRefs.current['createLike'] = el)}
                                leftIcon={<StarIcon />}
                                colorScheme="yellow"
                                onClick={() => handleAction('createLike')}
                                size="md"
                                isLoading={isAnimating === 'createLike'}
                                loadingText="Liking..."
                                _hover={{ transform: 'translateY(-2px)' }}
                                transition="all 0.2s ease"
                            >
                                <HStack spacing={2}>
                                    <Text>Add Like</Text>
                                    <Code fontSize="xs" colorScheme="yellow">
                                        Ctrl+L
                                    </Code>
                                </HStack>
                            </Button>
                        </HStack>

                        {/* Social Actions */}
                        <HStack spacing={3} wrap="wrap">
                            <Button
                                ref={(el) => (buttonRefs.current['createShare'] = el)}
                                leftIcon={<ShareIcon />}
                                colorScheme="purple"
                                onClick={() => handleAction('createShare')}
                                size="md"
                                isLoading={isAnimating === 'createShare'}
                                loadingText="Sharing..."
                                _hover={{ transform: 'translateY(-2px)' }}
                                transition="all 0.2s ease"
                            >
                                <HStack spacing={2}>
                                    <Text>Share Content</Text>
                                    <Code fontSize="xs" colorScheme="purple">
                                        Ctrl+S
                                    </Code>
                                </HStack>
                            </Button>
                            <Button
                                ref={(el) => (buttonRefs.current['createFollow'] = el)}
                                leftIcon={<RepeatIcon />}
                                colorScheme="teal"
                                onClick={() => handleAction('createFollow')}
                                size="md"
                                isLoading={isAnimating === 'createFollow'}
                                loadingText="Following..."
                                _hover={{ transform: 'translateY(-2px)' }}
                                transition="all 0.2s ease"
                            >
                                <HStack spacing={2}>
                                    <Text>Follow User</Text>
                                    <Code fontSize="xs" colorScheme="teal">
                                        Ctrl+F
                                    </Code>
                                </HStack>
                            </Button>
                            <Button
                                ref={(el) => (buttonRefs.current['createBookmark'] = el)}
                                leftIcon={<StarIcon />}
                                colorScheme="orange"
                                onClick={() => handleAction('createBookmark')}
                                size="md"
                                isLoading={isAnimating === 'createBookmark'}
                                loadingText="Bookmarking..."
                                _hover={{ transform: 'translateY(-2px)' }}
                                transition="all 0.2s ease"
                            >
                                <HStack spacing={2}>
                                    <Text>Add Bookmark</Text>
                                    <Code fontSize="xs" colorScheme="orange">
                                        Ctrl+B
                                    </Code>
                                </HStack>
                            </Button>
                        </HStack>

                        {/* Pagination Actions */}
                        <HStack spacing={3} wrap="wrap">
                            <Button
                                ref={(el) => (buttonRefs.current['previousPage'] = el)}
                                leftIcon={<ArrowBackIcon />}
                                colorScheme="gray"
                                onClick={() => handleAction('previousPage')}
                                size="md"
                                isLoading={isAnimating === 'previousPage'}
                                loadingText="Loading..."
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
                                ref={(el) => (buttonRefs.current['nextPage'] = el)}
                                leftIcon={<ArrowForwardIcon />}
                                colorScheme="cyan"
                                onClick={() => handleAction('nextPage')}
                                size="md"
                                isLoading={isAnimating === 'nextPage'}
                                loadingText="Loading..."
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
                    </VStack>
                </Box>

                <Divider />

                {/* Last Action Result */}
                {lastAction && (
                    <Box>
                        <Text fontSize="lg" fontWeight="semibold" mb={3}>
                            Last Action Result
                        </Text>
                        <Alert status="success" borderRadius="md">
                            <AlertIcon />
                            <Box>
                                <AlertTitle>{lastAction.actionType}</AlertTitle>
                                <AlertDescription>
                                    {lastAction.message}
                                </AlertDescription>
                                <Box mt={2}>
                                    <Code fontSize="xs" colorScheme="green">
                                        {lastAction.actionString}
                                    </Code>
                                </Box>
                            </Box>
                        </Alert>
                    </Box>
                )}

                {/* Action History */}
                <Box>
                    <Flex align="center" mb={3}>
                        <Text fontSize="lg" fontWeight="semibold">
                            Action History ({actionHistory.length})
                        </Text>
                        <Spacer />
                        <HStack spacing={2}>
                            <IconButton
                                aria-label="Refresh history"
                                icon={<RepeatIcon />}
                                size="sm"
                                onClick={handleRefreshHistory}
                            />
                            <IconButton
                                aria-label="Clear history"
                                icon={<DeleteIcon />}
                                size="sm"
                                colorScheme="red"
                                onClick={handleClearHistory}
                            />
                        </HStack>
                    </Flex>

                    {actionHistory.length > 0 ? (
                        <VStack spacing={2} align="stretch" maxH="300px" overflowY="auto">
                            {actionHistory.slice().reverse().map((action, index) => (
                                <Box
                                    key={`${action.timestamp}-${action.uniqueId}`}
                                    p={3}
                                    bg="gray.50"
                                    borderRadius="md"
                                    border="1px solid"
                                    borderColor="gray.200"
                                >
                                    <Flex align="center" justify="space-between">
                                        <VStack align="start" spacing={1}>
                                            <HStack spacing={2}>
                                                <Badge colorScheme="blue" fontSize="xs">
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
                        </VStack>
                    ) : (
                        <Box p={4} textAlign="center" color="gray.500">
                            <Text>No actions executed yet. Click a button above to get started!</Text>
                        </Box>
                    )}
                </Box>
            </VStack>

            {/* Keyboard Shortcuts Help Modal */}
            <KeyboardShortcutsHelp
                isOpen={showShortcutsHelp}
                onClose={() => setShowShortcutsHelp(false)}
            />
        </Box>
    );
};

export default ActionButtons;
