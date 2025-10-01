import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Input,
    Textarea,
    Select,
    FormControl,
    FormLabel,
    FormErrorMessage,
    Switch,
    Divider,
    Badge,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    IconButton,
    Tooltip,
    Flex,
    Spacer,
    Code,
    Collapse,
    useColorModeValue
} from '@chakra-ui/react';
import {
    AddIcon,
    ChatIcon,
    StarIcon,
    ExternalLinkIcon,
    ArrowForwardIcon,
    ArrowBackIcon,
    DeleteIcon,
    RepeatIcon,
    VolumeUpIcon,
    VolumeOffIcon,
    InfoIcon,
    CalendarIcon,
    SettingsIcon,
    CheckIcon,
    CloseIcon
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
import { analyticsManager } from '../utils/analytics';
import { useAutoTranslation } from '../hooks/useTranslation';

interface ActionResult {
    actionType: string;
    actionString: string;
    timestamp: number;
    uniqueId: string;
    message: string;
    data: any;
}

interface RequestFormData {
    requestType: string;
    title: string;
    content: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    scheduledTime?: string;
    isRecurring: boolean;
    recurringPattern?: 'daily' | 'weekly' | 'monthly';
    tags: string[];
    attachments: File[];
    isPublic: boolean;
    notifyUsers: boolean;
    customFields: Record<string, any>;
}

const UnifiedRequestForm: React.FC = () => {
    const [formData, setFormData] = useState<RequestFormData>({
        requestType: 'post',
        title: '',
        content: '',
        category: '',
        priority: 'medium',
        isRecurring: false,
        tags: [],
        attachments: [],
        isPublic: true,
        notifyUsers: false,
        customFields: {}
    });

    const [actionHistory, setActionHistory] = useState<ActionResult[]>([]);
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const [isAnimationsEnabled, setIsAnimationsEnabled] = useState(true);
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [activeTab, setActiveTab] = useState(0);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [customFieldKey, setCustomFieldKey] = useState('');
    const [customFieldValue, setCustomFieldValue] = useState('');

    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();
    const { translateField, getTranslatedValue, clearTranslatedValues } = useAutoTranslation(true);

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // Load action history on component mount
    useEffect(() => {
        const history = getActionHistory();
        setActionHistory(history);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                    case 'h':
                        event.preventDefault();
                        setShowShortcutsHelp(true);
                        break;
                    case 's':
                        event.preventDefault();
                        handleSubmit();
                        break;
                    case 'r':
                        event.preventDefault();
                        handleReset();
                        break;
                    case 'Enter':
                        event.preventDefault();
                        handleSubmit();
                        break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [formData]);

    const handleInputChange = (field: keyof RequestFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }

        // Auto-translate Korean content
        if (field === 'title' || field === 'content') {
            translateField(field, value);
        }
    };

    const handleAddTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }));
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleAddCustomField = () => {
        if (customFieldKey.trim() && customFieldValue.trim()) {
            setFormData(prev => ({
                ...prev,
                customFields: {
                    ...prev.customFields,
                    [customFieldKey.trim()]: customFieldValue.trim()
                }
            }));
            setCustomFieldKey('');
            setCustomFieldValue('');
        }
    };

    const handleRemoveCustomField = (key: string) => {
        setFormData(prev => {
            const newCustomFields = { ...prev.customFields };
            delete newCustomFields[key];
            return { ...prev, customFields: newCustomFields };
        });
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.content.trim()) {
            newErrors.content = 'Content is required';
        }

        if (formData.requestType === 'scheduled' && !formData.scheduledTime) {
            newErrors.scheduledTime = 'Scheduled time is required for scheduled requests';
        }

        if (formData.isRecurring && !formData.recurringPattern) {
            newErrors.recurringPattern = 'Recurring pattern is required for recurring requests';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            toast({
                title: 'Validation Error',
                description: 'Please fix the errors before submitting',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // Play sound effect
            if (isSoundEnabled) {
                playActionSound('submit');
            }

            // Show animation
            if (isAnimationsEnabled) {
                const animation = getAnimationForAction('submit');
                animationUtils.playAnimation(animation);
            }

            // Execute action based on request type
            let actionResult: ActionResult;

            switch (formData.requestType) {
                case 'post':
                    actionResult = executeAction('createPost');
                    break;
                case 'comment':
                    actionResult = executeAction('createComment');
                    break;
                case 'like':
                    actionResult = executeAction('createLike');
                    break;
                case 'share':
                    actionResult = executeAction('createShare');
                    break;
                case 'follow':
                    actionResult = executeAction('createFollow');
                    break;
                case 'bookmark':
                    actionResult = executeAction('createBookmark');
                    break;
                case 'scheduled':
                    // Handle scheduled action
                    actionResult = {
                        actionType: 'SCHEDULED_REQUEST',
                        actionString: `SCHEDULED_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        timestamp: Date.now(),
                        uniqueId: Math.random().toString(36).substr(2, 9),
                        message: `Scheduled request created for ${formData.scheduledTime}`,
                        data: formData
                    };
                    break;
                default:
                    actionResult = executeAction('createPost');
            }

            // Update action history
            const updatedHistory = [...actionHistory, actionResult];
            setActionHistory(updatedHistory);

            // Track analytics
            analyticsManager.trackEvent('request_submitted', {
                requestType: formData.requestType,
                priority: formData.priority,
                hasAttachments: formData.attachments.length > 0,
                isRecurring: formData.isRecurring
            });

            // Show success message
            toast({
                title: 'Request Submitted Successfully',
                description: actionResult.message,
                status: 'success',
                duration: 3000,
                isClosable: true
            });

            // Reset form
            handleReset();

        } catch (error) {
            console.error('Error submitting request:', error);
            toast({
                title: 'Submission Error',
                description: 'Failed to submit request. Please try again.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            requestType: 'post',
            title: '',
            content: '',
            category: '',
            priority: 'medium',
            isRecurring: false,
            tags: [],
            attachments: [],
            isPublic: true,
            notifyUsers: false,
            customFields: {}
        });
        setErrors({});
        clearTranslatedValues();
    };

    const handleClearHistory = () => {
        clearActionHistory();
        setActionHistory([]);
        toast({
            title: 'History Cleared',
            description: 'Action history has been cleared',
            status: 'info',
            duration: 2000,
            isClosable: true
        });
    };

    const handleToggleSound = () => {
        setIsSoundEnabled(!isSoundEnabled);
        if (!isSoundEnabled) {
            playActionSound('toggle');
        }
    };

    const handleToggleAnimations = () => {
        setIsAnimationsEnabled(!isAnimationsEnabled);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'red';
            case 'high': return 'orange';
            case 'medium': return 'yellow';
            case 'low': return 'green';
            default: return 'gray';
        }
    };

    return (
        <Box p={6} bg={bgColor} borderRadius="lg" boxShadow="md" border="1px" borderColor={borderColor}>
            <VStack spacing={6} align="stretch">
                {/* Header */}
                <Box>
                    <Flex justify="space-between" align="center" mb={2}>
                        <Box>
                            <Text fontSize="2xl" fontWeight="bold">
                                Unified Request Form
                            </Text>
                            <Text color="gray.600" fontSize="sm">
                                Submit any type of request through a single, unified interface
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
                            <FormControl display="flex" alignItems="center" width="auto">
                                <FormLabel htmlFor="animations-toggle" mb="0" fontSize="sm">
                                    Animations
                                </FormLabel>
                                <Tooltip label={isAnimationsEnabled ? "Disable animations" : "Enable animations"}>
                                    <Switch
                                        id="animations-toggle"
                                        isChecked={isAnimationsEnabled}
                                        onChange={handleToggleAnimations}
                                        colorScheme="blue"
                                    />
                                </Tooltip>
                            </FormControl>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowShortcutsHelp(true)}
                                leftIcon={<InfoIcon />}
                            >
                                Shortcuts (Ctrl+H)
                            </Button>
                        </HStack>
                    </Flex>
                </Box>

                <Divider />

                {/* Main Form */}
                <Tabs index={activeTab} onChange={setActiveTab}>
                    <TabList>
                        <Tab>Basic Request</Tab>
                        <Tab>Scheduled Request</Tab>
                        <Tab>Bulk Request</Tab>
                        <Tab>Template Request</Tab>
                        <Tab>History</Tab>
                    </TabList>

                    <TabPanels>
                        {/* Basic Request Tab */}
                        <TabPanel px={0}>
                            <VStack spacing={4} align="stretch">
                                {/* Request Type */}
                                <FormControl isRequired>
                                    <FormLabel>Request Type</FormLabel>
                                    <Select
                                        value={formData.requestType}
                                        onChange={(e) => handleInputChange('requestType', e.target.value)}
                                    >
                                        <option value="post">Create Post</option>
                                        <option value="comment">Add Comment</option>
                                        <option value="like">Add Like</option>
                                        <option value="share">Share Content</option>
                                        <option value="follow">Follow User</option>
                                        <option value="bookmark">Bookmark Content</option>
                                        <option value="custom">Custom Request</option>
                                    </Select>
                                </FormControl>

                                {/* Title */}
                                <FormControl isRequired isInvalid={!!errors.title}>
                                    <FormLabel>Title</FormLabel>
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        placeholder="Enter request title..."
                                    />
                                    <FormErrorMessage>{errors.title}</FormErrorMessage>
                                </FormControl>

                                {/* Content */}
                                <FormControl isRequired isInvalid={!!errors.content}>
                                    <FormLabel>Content</FormLabel>
                                    <Textarea
                                        value={formData.content}
                                        onChange={(e) => handleInputChange('content', e.target.value)}
                                        placeholder="Enter request content..."
                                        rows={6}
                                    />
                                    <FormErrorMessage>{errors.content}</FormErrorMessage>
                                </FormControl>

                                {/* Category and Priority */}
                                <HStack spacing={4}>
                                    <FormControl>
                                        <FormLabel>Category</FormLabel>
                                        <Input
                                            value={formData.category}
                                            onChange={(e) => handleInputChange('category', e.target.value)}
                                            placeholder="Enter category..."
                                        />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel>Priority</FormLabel>
                                        <Select
                                            value={formData.priority}
                                            onChange={(e) => handleInputChange('priority', e.target.value)}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </Select>
                                    </FormControl>
                                </HStack>

                                {/* Tags */}
                                <FormControl>
                                    <FormLabel>Tags</FormLabel>
                                    <HStack>
                                        <Input
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            placeholder="Add tag..."
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                                        />
                                        <Button onClick={handleAddTag} size="sm" colorScheme="blue">
                                            Add
                                        </Button>
                                    </HStack>
                                    {formData.tags.length > 0 && (
                                        <HStack mt={2} flexWrap="wrap">
                                            {formData.tags.map((tag, index) => (
                                                <Badge key={index} colorScheme="blue" variant="subtle">
                                                    {tag}
                                                    <IconButton
                                                        aria-label="Remove tag"
                                                        icon={<CloseIcon />}
                                                        size="xs"
                                                        ml={1}
                                                        onClick={() => handleRemoveTag(tag)}
                                                    />
                                                </Badge>
                                            ))}
                                        </HStack>
                                    )}
                                </FormControl>

                                {/* Advanced Options */}
                                <Box>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        leftIcon={<SettingsIcon />}
                                    >
                                        {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                                    </Button>
                                    <Collapse in={showAdvanced}>
                                        <VStack spacing={4} align="stretch" mt={4}>
                                            <HStack>
                                                <FormControl display="flex" alignItems="center">
                                                    <FormLabel mb="0">Public Request</FormLabel>
                                                    <Switch
                                                        isChecked={formData.isPublic}
                                                        onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                                                    />
                                                </FormControl>
                                                <FormControl display="flex" alignItems="center">
                                                    <FormLabel mb="0">Notify Users</FormLabel>
                                                    <Switch
                                                        isChecked={formData.notifyUsers}
                                                        onChange={(e) => handleInputChange('notifyUsers', e.target.checked)}
                                                    />
                                                </FormControl>
                                            </HStack>
                                        </VStack>
                                    </Collapse>
                                </Box>

                                {/* Action Buttons */}
                                <HStack spacing={4} justify="flex-end">
                                    <Button
                                        variant="outline"
                                        onClick={handleReset}
                                        leftIcon={<DeleteIcon />}
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        colorScheme="blue"
                                        onClick={handleSubmit}
                                        isLoading={isSubmitting}
                                        loadingText="Submitting..."
                                        leftIcon={<CheckIcon />}
                                    >
                                        Submit Request
                                    </Button>
                                </HStack>
                            </VStack>
                        </TabPanel>

                        {/* Scheduled Request Tab */}
                        <TabPanel px={0}>
                            <VStack spacing={4} align="stretch">
                                <Alert status="info">
                                    <AlertIcon />
                                    <AlertTitle>Scheduled Request</AlertTitle>
                                    <AlertDescription>
                                        Schedule your request to be executed at a specific time.
                                    </AlertDescription>
                                </Alert>

                                <FormControl isRequired isInvalid={!!errors.scheduledTime}>
                                    <FormLabel>Scheduled Time</FormLabel>
                                    <Input
                                        type="datetime-local"
                                        value={formData.scheduledTime || ''}
                                        onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                                    />
                                    <FormErrorMessage>{errors.scheduledTime}</FormErrorMessage>
                                </FormControl>

                                <FormControl display="flex" alignItems="center">
                                    <FormLabel mb="0">Recurring Request</FormLabel>
                                    <Switch
                                        isChecked={formData.isRecurring}
                                        onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
                                    />
                                </FormControl>

                                {formData.isRecurring && (
                                    <FormControl isRequired isInvalid={!!errors.recurringPattern}>
                                        <FormLabel>Recurring Pattern</FormLabel>
                                        <Select
                                            value={formData.recurringPattern || ''}
                                            onChange={(e) => handleInputChange('recurringPattern', e.target.value)}
                                        >
                                            <option value="">Select pattern...</option>
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </Select>
                                        <FormErrorMessage>{errors.recurringPattern}</FormErrorMessage>
                                    </FormControl>
                                )}

                                <Button
                                    colorScheme="blue"
                                    onClick={handleSubmit}
                                    isLoading={isSubmitting}
                                    loadingText="Scheduling..."
                                    leftIcon={<CalendarIcon />}
                                >
                                    Schedule Request
                                </Button>
                            </VStack>
                        </TabPanel>

                        {/* Bulk Request Tab */}
                        <TabPanel px={0}>
                            <VStack spacing={4} align="stretch">
                                <Alert status="warning">
                                    <AlertIcon />
                                    <AlertTitle>Bulk Request</AlertTitle>
                                    <AlertDescription>
                                        Submit multiple requests at once. Use CSV format or JSON.
                                    </AlertDescription>
                                </Alert>

                                <Textarea
                                    placeholder="Enter bulk requests in CSV or JSON format..."
                                    rows={10}
                                />

                                <HStack>
                                    <Button size="sm" variant="outline">
                                        Upload CSV File
                                    </Button>
                                    <Button size="sm" variant="outline">
                                        Upload JSON File
                                    </Button>
                                </HStack>

                                <Button
                                    colorScheme="blue"
                                    onClick={handleSubmit}
                                    isLoading={isSubmitting}
                                    loadingText="Processing..."
                                    leftIcon={<RepeatIcon />}
                                >
                                    Process Bulk Requests
                                </Button>
                            </VStack>
                        </TabPanel>

                        {/* Template Request Tab */}
                        <TabPanel px={0}>
                            <VStack spacing={4} align="stretch">
                                <Alert status="info">
                                    <AlertIcon />
                                    <AlertTitle>Template Request</AlertTitle>
                                    <AlertDescription>
                                        Use pre-defined templates for common request types.
                                    </AlertDescription>
                                </Alert>

                                <FormControl>
                                    <FormLabel>Select Template</FormLabel>
                                    <Select placeholder="Choose a template...">
                                        <option value="bug-report">Bug Report</option>
                                        <option value="feature-request">Feature Request</option>
                                        <option value="support-ticket">Support Ticket</option>
                                        <option value="content-request">Content Request</option>
                                    </Select>
                                </FormControl>

                                <Button
                                    colorScheme="blue"
                                    onClick={handleSubmit}
                                    isLoading={isSubmitting}
                                    loadingText="Loading Template..."
                                    leftIcon={<SettingsIcon />}
                                >
                                    Load Template
                                </Button>
                            </VStack>
                        </TabPanel>

                        {/* History Tab */}
                        <TabPanel px={0}>
                            <VStack spacing={4} align="stretch">
                                <Flex justify="space-between" align="center">
                                    <Text fontSize="lg" fontWeight="semibold">
                                        Request History ({actionHistory.length})
                                    </Text>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleClearHistory}
                                        leftIcon={<DeleteIcon />}
                                    >
                                        Clear History
                                    </Button>
                                </Flex>

                                {actionHistory.length === 0 ? (
                                    <Text color="gray.500" textAlign="center" py={8}>
                                        No requests submitted yet
                                    </Text>
                                ) : (
                                    <VStack spacing={2} align="stretch">
                                        {actionHistory.slice().reverse().map((action, index) => (
                                            <Box
                                                key={index}
                                                p={4}
                                                border="1px"
                                                borderColor={borderColor}
                                                borderRadius="md"
                                                bg={bgColor}
                                            >
                                                <Flex justify="space-between" align="start">
                                                    <VStack align="start" spacing={1}>
                                                        <HStack>
                                                            <Badge colorScheme="blue">
                                                                {action.actionType}
                                                            </Badge>
                                                            <Text fontSize="sm" color="gray.500">
                                                                {new Date(action.timestamp).toLocaleString()}
                                                            </Text>
                                                        </HStack>
                                                        <Text fontWeight="medium">
                                                            {action.message}
                                                        </Text>
                                                        <Code fontSize="xs">
                                                            {action.actionString}
                                                        </Code>
                                                    </VStack>
                                                </Flex>
                                            </Box>
                                        ))}
                                    </VStack>
                                )}
                            </VStack>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </VStack>

            {/* Keyboard Shortcuts Help Modal */}
            <Modal isOpen={showShortcutsHelp} onClose={() => setShowShortcutsHelp(false)}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Keyboard Shortcuts</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={3} align="stretch">
                            <HStack justify="space-between">
                                <Text>Submit Request</Text>
                                <Code>Ctrl + S</Code>
                            </HStack>
                            <HStack justify="space-between">
                                <Text>Reset Form</Text>
                                <Code>Ctrl + R</Code>
                            </HStack>
                            <HStack justify="space-between">
                                <Text>Show Shortcuts</Text>
                                <Code>Ctrl + H</Code>
                            </HStack>
                            <HStack justify="space-between">
                                <Text>Submit (Enter)</Text>
                                <Code>Ctrl + Enter</Code>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default UnifiedRequestForm;
