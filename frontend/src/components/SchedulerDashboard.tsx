import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Badge,
    Card,
    CardHeader,
    CardBody,
    Heading,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    ModalFooter,
    useDisclosure,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    FormControl,
    FormLabel,
    Input,
    Select,
    Textarea,
    Switch,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Checkbox,
    CheckboxGroup,
    Grid,
    GridItem,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    Progress,
    IconButton,
    Tooltip,
    Flex,
    Spacer,
    useToast,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Divider
} from '@chakra-ui/react';
import {
    AddIcon,
    DeleteIcon,
    PlayIcon,
    StopIcon,
    EditIcon,
    SettingsIcon,
    CalendarIcon,
    ClockIcon,
    CheckIcon,
    CloseIcon,
    WarningIcon,
    InfoIcon
} from '@chakra-ui/icons';
import {
    actionScheduler,
    ScheduledAction,
    SchedulerSettings,
    SchedulerStats
} from '../utils/actionScheduler';
import { ACTION_REGISTRY } from '../utils/actionGenerators';

const SchedulerDashboard: React.FC = () => {
    const [scheduledActions, setScheduledActions] = useState<ScheduledAction[]>([]);
    const [stats, setStats] = useState<SchedulerStats | null>(null);
    const [settings, setSettings] = useState<SchedulerSettings | null>(null);
    const [selectedAction, setSelectedAction] = useState<ScheduledAction | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newAction, setNewAction] = useState<Partial<ScheduledAction>>({
        actionType: 'createPost',
        name: '',
        description: '',
        scheduledTime: new Date(Date.now() + 60000).toISOString().slice(0, 16),
        repeatType: 'once',
        priority: 'medium',
        enabled: true,
        tags: []
    });

    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
    const toast = useToast();

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000); // Update every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const loadData = () => {
        setScheduledActions(actionScheduler.getScheduledActions());
        setStats(actionScheduler.getStats());
        setSettings(actionScheduler.getSettings());
    };

    const handleCreateAction = () => {
        if (!newAction.name || !newAction.actionType || !newAction.scheduledTime) {
            toast({
                title: 'Error',
                description: 'Please fill in all required fields',
                status: 'error',
                duration: 2000,
                isClosable: true,
            });
            return;
        }

        try {
            const action = actionScheduler.createScheduledAction({
                actionType: newAction.actionType!,
                name: newAction.name!,
                description: newAction.description || '',
                scheduledTime: newAction.scheduledTime!,
                repeatType: newAction.repeatType || 'once',
                repeatInterval: newAction.repeatInterval,
                repeatDays: newAction.repeatDays,
                repeatTime: newAction.repeatTime,
                endDate: newAction.endDate,
                maxExecutions: newAction.maxExecutions,
                priority: newAction.priority || 'medium',
                enabled: newAction.enabled || true,
                tags: newAction.tags || [],
                createdBy: 'user'
            });

            setScheduledActions(actionScheduler.getScheduledActions());
            setStats(actionScheduler.getStats());
            setIsCreating(false);
            setNewAction({
                actionType: 'createPost',
                name: '',
                description: '',
                scheduledTime: new Date(Date.now() + 60000).toISOString().slice(0, 16),
                repeatType: 'once',
                priority: 'medium',
                enabled: true,
                tags: []
            });

            toast({
                title: 'Action Scheduled',
                description: `"${action.name}" has been scheduled successfully`,
                status: 'success',
                duration: 2000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to create scheduled action',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleCancelAction = (id: string) => {
        const success = actionScheduler.cancelScheduledAction(id);
        if (success) {
            loadData();
            toast({
                title: 'Action Cancelled',
                description: 'Scheduled action has been cancelled',
                status: 'info',
                duration: 2000,
                isClosable: true,
            });
        }
    };

    const handleDeleteAction = (id: string) => {
        const success = actionScheduler.deleteScheduledAction(id);
        if (success) {
            loadData();
            toast({
                title: 'Action Deleted',
                description: 'Scheduled action has been deleted',
                status: 'info',
                duration: 2000,
                isClosable: true,
            });
        }
    };

    const handleToggleAction = (id: string, enabled: boolean) => {
        const action = actionScheduler.updateScheduledAction(id, { enabled });
        if (action) {
            loadData();
            toast({
                title: enabled ? 'Action Enabled' : 'Action Disabled',
                description: `Scheduled action has been ${enabled ? 'enabled' : 'disabled'}`,
                status: 'info',
                duration: 2000,
                isClosable: true,
            });
        }
    };

    const handleUpdateSettings = (newSettings: Partial<SchedulerSettings>) => {
        actionScheduler.updateSettings(newSettings);
        setSettings(actionScheduler.getSettings());
        toast({
            title: 'Settings Updated',
            description: 'Scheduler settings have been updated',
            status: 'success',
            duration: 2000,
            isClosable: true,
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'green';
            case 'failed': return 'red';
            case 'running': return 'blue';
            case 'cancelled': return 'gray';
            case 'pending': return 'yellow';
            default: return 'gray';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckIcon />;
            case 'failed': return <CloseIcon />;
            case 'running': return <PlayIcon />;
            case 'cancelled': return <StopIcon />;
            case 'pending': return <ClockIcon />;
            default: return null;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'red';
            case 'medium': return 'yellow';
            case 'low': return 'green';
            default: return 'gray';
        }
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getTimeUntilExecution = (scheduledTime: string) => {
        const now = new Date();
        const scheduled = new Date(scheduledTime);
        const diff = scheduled.getTime() - now.getTime();

        if (diff <= 0) return 'Overdue';

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        return `${minutes}m`;
    };

    return (
        <Box p={6}>
            <VStack spacing={6} align="stretch">
                {/* Header */}
                <Flex justify="space-between" align="center">
                    <Box>
                        <Heading size="lg" mb={2}>Action Scheduler</Heading>
                        <Text color="gray.600">Schedule actions to run at specific times or intervals</Text>
                    </Box>
                    <HStack spacing={3}>
                        <Button
                            leftIcon={<AddIcon />}
                            colorScheme="blue"
                            onClick={() => setIsCreating(true)}
                            size="sm"
                        >
                            Schedule Action
                        </Button>
                        <Tooltip label="Scheduler settings">
                            <IconButton
                                aria-label="Settings"
                                icon={<SettingsIcon />}
                                onClick={onSettingsOpen}
                                size="sm"
                                variant="outline"
                            />
                        </Tooltip>
                    </HStack>
                </Flex>

                {/* Statistics */}
                {stats && (
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
                        <GridItem>
                            <Card>
                                <CardBody>
                                    <Stat>
                                        <StatLabel>Total Scheduled</StatLabel>
                                        <StatNumber>{stats.totalScheduled}</StatNumber>
                                        <StatHelpText>
                                            <StatArrow type="increase" />
                                            All time
                                        </StatHelpText>
                                    </Stat>
                                </CardBody>
                            </Card>
                        </GridItem>

                        <GridItem>
                            <Card>
                                <CardBody>
                                    <Stat>
                                        <StatLabel>Pending</StatLabel>
                                        <StatNumber color="yellow.500">{stats.pendingJobs}</StatNumber>
                                        <StatHelpText>Waiting to execute</StatHelpText>
                                    </Stat>
                                </CardBody>
                            </Card>
                        </GridItem>

                        <GridItem>
                            <Card>
                                <CardBody>
                                    <Stat>
                                        <StatLabel>Success Rate</StatLabel>
                                        <StatNumber color="green.500">{stats.successRate}%</StatNumber>
                                        <StatHelpText>Completed successfully</StatHelpText>
                                    </Stat>
                                </CardBody>
                            </Card>
                        </GridItem>

                        <GridItem>
                            <Card>
                                <CardBody>
                                    <Stat>
                                        <StatLabel>Next Execution</StatLabel>
                                        <StatNumber fontSize="sm">
                                            {stats.nextExecution ? getTimeUntilExecution(stats.nextExecution) : 'None'}
                                        </StatNumber>
                                        <StatHelpText>
                                            {stats.nextExecution ? formatDateTime(stats.nextExecution) : 'No pending actions'}
                                        </StatHelpText>
                                    </Stat>
                                </CardBody>
                            </Card>
                        </GridItem>
                    </Grid>
                )}

                {/* Actions List */}
                <Card>
                    <CardHeader>
                        <Heading size="md">Scheduled Actions</Heading>
                    </CardHeader>
                    <CardBody>
                        {scheduledActions.length === 0 ? (
                            <Text color="gray.500" textAlign="center" py={4}>
                                No scheduled actions. Click "Schedule Action" to get started.
                            </Text>
                        ) : (
                            <Table size="sm">
                                <Thead>
                                    <Tr>
                                        <Th>Name</Th>
                                        <Th>Action</Th>
                                        <Th>Status</Th>
                                        <Th>Scheduled Time</Th>
                                        <Th>Repeat</Th>
                                        <Th>Priority</Th>
                                        <Th>Executions</Th>
                                        <Th>Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {scheduledActions.map((action) => (
                                        <Tr key={action.id}>
                                            <Td>
                                                <VStack align="start" spacing={0}>
                                                    <Text fontWeight="semibold" fontSize="sm">{action.name}</Text>
                                                    {action.description && (
                                                        <Text fontSize="xs" color="gray.500">{action.description}</Text>
                                                    )}
                                                </VStack>
                                            </Td>
                                            <Td>
                                                <Text fontSize="sm">
                                                    {action.actionType.replace('create', '').replace('Action', '')}
                                                </Text>
                                            </Td>
                                            <Td>
                                                <Badge colorScheme={getStatusColor(action.status)} size="sm">
                                                    {getStatusIcon(action.status)}
                                                    {action.status}
                                                </Badge>
                                            </Td>
                                            <Td>
                                                <VStack align="start" spacing={0}>
                                                    <Text fontSize="sm">{formatDateTime(action.scheduledTime)}</Text>
                                                    <Text fontSize="xs" color="gray.500">
                                                        {getTimeUntilExecution(action.scheduledTime)}
                                                    </Text>
                                                </VStack>
                                            </Td>
                                            <Td>
                                                <Text fontSize="sm" textTransform="capitalize">
                                                    {action.repeatType}
                                                </Text>
                                            </Td>
                                            <Td>
                                                <Badge colorScheme={getPriorityColor(action.priority)} size="sm">
                                                    {action.priority}
                                                </Badge>
                                            </Td>
                                            <Td>
                                                <Text fontSize="sm">{action.executionCount}</Text>
                                            </Td>
                                            <Td>
                                                <HStack spacing={1}>
                                                    <Tooltip label={action.enabled ? 'Disable' : 'Enable'}>
                                                        <IconButton
                                                            aria-label="Toggle action"
                                                            icon={action.enabled ? <CheckIcon /> : <CloseIcon />}
                                                            size="xs"
                                                            colorScheme={action.enabled ? 'green' : 'red'}
                                                            onClick={() => handleToggleAction(action.id, !action.enabled)}
                                                        />
                                                    </Tooltip>
                                                    {action.status === 'pending' && (
                                                        <Tooltip label="Cancel">
                                                            <IconButton
                                                                aria-label="Cancel action"
                                                                icon={<StopIcon />}
                                                                size="xs"
                                                                colorScheme="red"
                                                                onClick={() => handleCancelAction(action.id)}
                                                            />
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip label="Delete">
                                                        <IconButton
                                                            aria-label="Delete action"
                                                            icon={<DeleteIcon />}
                                                            size="xs"
                                                            colorScheme="red"
                                                            onClick={() => handleDeleteAction(action.id)}
                                                        />
                                                    </Tooltip>
                                                </HStack>
                                            </Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        )}
                    </CardBody>
                </Card>
            </VStack>

            {/* Create Action Modal */}
            <Modal isOpen={isCreating} onClose={() => setIsCreating(false)} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Schedule New Action</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={4} align="stretch">
                            <FormControl isRequired>
                                <FormLabel>Action Name</FormLabel>
                                <Input
                                    value={newAction.name || ''}
                                    onChange={(e) => setNewAction({ ...newAction, name: e.target.value })}
                                    placeholder="Enter action name..."
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Description</FormLabel>
                                <Textarea
                                    value={newAction.description || ''}
                                    onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                                    placeholder="Enter action description..."
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Action Type</FormLabel>
                                <Select
                                    value={newAction.actionType || 'createPost'}
                                    onChange={(e) => setNewAction({ ...newAction, actionType: e.target.value as keyof typeof ACTION_REGISTRY })}
                                >
                                    {Object.keys(ACTION_REGISTRY).map((actionType) => (
                                        <option key={actionType} value={actionType}>
                                            {actionType.replace('create', '').replace('Action', '')}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Scheduled Time</FormLabel>
                                <Input
                                    type="datetime-local"
                                    value={newAction.scheduledTime || ''}
                                    onChange={(e) => setNewAction({ ...newAction, scheduledTime: e.target.value })}
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Repeat Type</FormLabel>
                                <Select
                                    value={newAction.repeatType || 'once'}
                                    onChange={(e) => setNewAction({ ...newAction, repeatType: e.target.value as any })}
                                >
                                    <option value="once">Once</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="interval">Interval</option>
                                </Select>
                            </FormControl>

                            {newAction.repeatType === 'interval' && (
                                <FormControl>
                                    <FormLabel>Interval (minutes)</FormLabel>
                                    <NumberInput
                                        value={newAction.repeatInterval || 60}
                                        onChange={(valueString) => setNewAction({ ...newAction, repeatInterval: parseInt(valueString) || 60 })}
                                        min={1}
                                        max={1440}
                                    >
                                        <NumberInputField />
                                        <NumberInputStepper>
                                            <NumberIncrementStepper />
                                            <NumberDecrementStepper />
                                        </NumberInputStepper>
                                    </NumberInput>
                                </FormControl>
                            )}

                            {(newAction.repeatType === 'daily' || newAction.repeatType === 'weekly' || newAction.repeatType === 'monthly') && (
                                <FormControl>
                                    <FormLabel>Repeat Time</FormLabel>
                                    <Input
                                        type="time"
                                        value={newAction.repeatTime || '12:00'}
                                        onChange={(e) => setNewAction({ ...newAction, repeatTime: e.target.value })}
                                    />
                                </FormControl>
                            )}

                            <FormControl>
                                <FormLabel>Priority</FormLabel>
                                <Select
                                    value={newAction.priority || 'medium'}
                                    onChange={(e) => setNewAction({ ...newAction, priority: e.target.value as any })}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </Select>
                            </FormControl>

                            <FormControl display="flex" alignItems="center">
                                <FormLabel htmlFor="enabled" mb="0">
                                    Enabled
                                </FormLabel>
                                <Switch
                                    id="enabled"
                                    isChecked={newAction.enabled || false}
                                    onChange={(e) => setNewAction({ ...newAction, enabled: e.target.checked })}
                                />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={() => setIsCreating(false)}>
                            Cancel
                        </Button>
                        <Button colorScheme="blue" onClick={handleCreateAction}>
                            Schedule Action
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Settings Modal */}
            <Modal isOpen={isSettingsOpen} onClose={onSettingsClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Scheduler Settings</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        {settings && (
                            <VStack spacing={4} align="stretch">
                                <FormControl>
                                    <FormLabel>Max Concurrent Jobs</FormLabel>
                                    <NumberInput
                                        value={settings.maxConcurrentJobs}
                                        onChange={(valueString) => handleUpdateSettings({ maxConcurrentJobs: parseInt(valueString) || 5 })}
                                        min={1}
                                        max={20}
                                    >
                                        <NumberInputField />
                                        <NumberInputStepper>
                                            <NumberIncrementStepper />
                                            <NumberDecrementStepper />
                                        </NumberInputStepper>
                                    </NumberInput>
                                </FormControl>

                                <FormControl display="flex" alignItems="center">
                                    <FormLabel htmlFor="retry-failed" mb="0">
                                        Retry Failed Jobs
                                    </FormLabel>
                                    <Switch
                                        id="retry-failed"
                                        isChecked={settings.retryFailedJobs}
                                        onChange={(e) => handleUpdateSettings({ retryFailedJobs: e.target.checked })}
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Max Retries</FormLabel>
                                    <NumberInput
                                        value={settings.maxRetries}
                                        onChange={(valueString) => handleUpdateSettings({ maxRetries: parseInt(valueString) || 3 })}
                                        min={0}
                                        max={10}
                                    >
                                        <NumberInputField />
                                        <NumberInputStepper>
                                            <NumberIncrementStepper />
                                            <NumberDecrementStepper />
                                        </NumberInputStepper>
                                    </NumberInput>
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Retry Delay (minutes)</FormLabel>
                                    <NumberInput
                                        value={settings.retryDelay}
                                        onChange={(valueString) => handleUpdateSettings({ retryDelay: parseInt(valueString) || 5 })}
                                        min={1}
                                        max={60}
                                    >
                                        <NumberInputField />
                                        <NumberInputStepper>
                                            <NumberIncrementStepper />
                                            <NumberDecrementStepper />
                                        </NumberInputStepper>
                                    </NumberInput>
                                </FormControl>

                                <Divider />

                                <Text fontWeight="semibold">Notifications</Text>

                                <FormControl display="flex" alignItems="center">
                                    <FormLabel htmlFor="notify-success" mb="0">
                                        Success Notifications
                                    </FormLabel>
                                    <Switch
                                        id="notify-success"
                                        isChecked={settings.notifications.onSuccess}
                                        onChange={(e) => handleUpdateSettings({
                                            notifications: { ...settings.notifications, onSuccess: e.target.checked }
                                        })}
                                    />
                                </FormControl>

                                <FormControl display="flex" alignItems="center">
                                    <FormLabel htmlFor="notify-failure" mb="0">
                                        Failure Notifications
                                    </FormLabel>
                                    <Switch
                                        id="notify-failure"
                                        isChecked={settings.notifications.onFailure}
                                        onChange={(e) => handleUpdateSettings({
                                            notifications: { ...settings.notifications, onFailure: e.target.checked }
                                        })}
                                    />
                                </FormControl>

                                <FormControl display="flex" alignItems="center">
                                    <FormLabel htmlFor="notify-completion" mb="0">
                                        Completion Notifications
                                    </FormLabel>
                                    <Switch
                                        id="notify-completion"
                                        isChecked={settings.notifications.onCompletion}
                                        onChange={(e) => handleUpdateSettings({
                                            notifications: { ...settings.notifications, onCompletion: e.target.checked }
                                        })}
                                    />
                                </FormControl>
                            </VStack>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button onClick={onSettingsClose}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default SchedulerDashboard;
