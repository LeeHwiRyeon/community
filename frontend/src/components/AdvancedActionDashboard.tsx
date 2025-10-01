import React, { useState, useEffect, useCallback } from 'react';
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
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Grid,
    GridItem,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    Progress,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    ModalFooter,
    useDisclosure,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    IconButton,
    Tooltip,
    Flex,
    Spacer,
    useToast,
    Divider,
    Code,
    Switch,
    FormControl,
    FormLabel,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Select,
    Textarea,
    Input,
    Checkbox,
    CheckboxGroup
} from '@chakra-ui/react';
import {
    UndoIcon,
    RedoIcon,
    CheckIcon,
    CloseIcon,
    WarningIcon,
    InfoIcon,
    DownloadIcon,
    UploadIcon,
    SettingsIcon,
    RefreshIcon,
    PlayIcon,
    StopIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@chakra-ui/icons';
import { actionExportManager } from '../utils/actionExport';
import { actionUndoRedoManager } from '../utils/actionUndoRedo';
import { actionValidationManager } from '../utils/actionValidation';
import { ActionResult } from '../utils/actionGenerators';
import EnhancedPagination from './EnhancedPagination';

const AdvancedActionDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [actions, setActions] = useState<ActionResult[]>([]);
    const [validationResults, setValidationResults] = useState<any[]>([]);
    const [undoRedoState, setUndoRedoState] = useState(actionUndoRedoManager.getState());
    const [validationSettings, setValidationSettings] = useState(actionValidationManager.getSettings());
    const [exportOptions, setExportOptions] = useState({
        format: 'json' as 'csv' | 'json' | 'xlsx' | 'pdf',
        includeAnalytics: true,
        includeScheduled: true,
        includeTemplates: true,
        dateRange: {
            start: '',
            end: ''
        }
    });
    const [paginationConfig, setPaginationConfig] = useState({
        currentPage: 1,
        totalPages: 1,
        pageSize: 10,
        totalItems: 0,
        showPageNumbers: true,
        showPageSizeSelector: true,
        showJumpToPage: true,
        showStats: true,
        enableInfiniteScroll: false,
        enableVirtualScrolling: true,
        enableKeyboardNavigation: true,
        enableAutoScroll: false,
        maxVisiblePages: 5,
        pageSizeOptions: [5, 10, 25, 50, 100]
    });

    const { isOpen: isExportOpen, onOpen: onExportOpen, onClose: onExportClose } = useDisclosure();
    const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
    const { isOpen: isValidationOpen, onOpen: onValidationOpen, onClose: onValidationClose } = useDisclosure();
    const toast = useToast();

    useEffect(() => {
        loadActions();
        loadValidationResults();
        setupUndoRedoCallbacks();
    }, []);

    const loadActions = useCallback(() => {
        try {
            const stored = localStorage.getItem('actionHistory');
            const actionHistory = stored ? JSON.parse(stored) : [];
            setActions(actionHistory);

            const totalPages = Math.ceil(actionHistory.length / paginationConfig.pageSize);
            setPaginationConfig(prev => ({
                ...prev,
                totalPages,
                totalItems: actionHistory.length
            }));
        } catch (error) {
            console.error('Failed to load actions:', error);
        }
    }, [paginationConfig.pageSize]);

    const loadValidationResults = useCallback(async () => {
        try {
            const validationPromises = actions.map(action =>
                actionValidationManager.validateAction(action)
            );
            const results = await Promise.all(validationPromises);
            setValidationResults(results);
        } catch (error) {
            console.error('Failed to load validation results:', error);
        }
    }, [actions]);

    const setupUndoRedoCallbacks = useCallback(() => {
        actionUndoRedoManager.setCallbacks({
            onUndo: (action) => {
                toast({
                    title: 'Action Undone',
                    description: `${action.actionType} has been undone`,
                    status: 'info',
                    duration: 2000,
                    isClosable: true,
                });
                setUndoRedoState(actionUndoRedoManager.getState());
            },
            onRedo: (action) => {
                toast({
                    title: 'Action Redone',
                    description: `${action.actionType} has been redone`,
                    status: 'info',
                    duration: 2000,
                    isClosable: true,
                });
                setUndoRedoState(actionUndoRedoManager.getState());
            },
            onStackChange: (state) => {
                setUndoRedoState(state);
            },
            onError: (error, action) => {
                toast({
                    title: 'Undo/Redo Error',
                    description: `Failed to ${action.canUndo ? 'undo' : 'redo'} ${action.actionType}`,
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
        });
    }, [toast]);

    const handleUndo = useCallback(async () => {
        const success = await actionUndoRedoManager.undo();
        if (success) {
            loadActions();
        }
    }, [loadActions]);

    const handleRedo = useCallback(async () => {
        const success = await actionUndoRedoManager.redo();
        if (success) {
            loadActions();
        }
    }, [loadActions]);

    const handleUndoMultiple = useCallback(async (count: number) => {
        const undoneCount = await actionUndoRedoManager.undoMultiple(count);
        if (undoneCount > 0) {
            loadActions();
            toast({
                title: 'Actions Undone',
                description: `${undoneCount} actions have been undone`,
                status: 'info',
                duration: 2000,
                isClosable: true,
            });
        }
    }, [loadActions, toast]);

    const handleRedoMultiple = useCallback(async (count: number) => {
        const redoneCount = await actionUndoRedoManager.redoMultiple(count);
        if (redoneCount > 0) {
            loadActions();
            toast({
                title: 'Actions Redone',
                description: `${redoneCount} actions have been redone`,
                status: 'info',
                duration: 2000,
                isClosable: true,
            });
        }
    }, [loadActions, toast]);

    const handleExport = useCallback(async () => {
        try {
            const result = await actionExportManager.exportActions(exportOptions);
            if (result.success) {
                actionExportManager.downloadFile(result);
                toast({
                    title: 'Export Successful',
                    description: `Data exported as ${exportOptions.format.toUpperCase()}`,
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({
                title: 'Export Failed',
                description: error instanceof Error ? error.message : 'Unknown error',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    }, [exportOptions, toast]);

    const handleValidateAll = useCallback(async () => {
        try {
            const results = await actionValidationManager.validateActions(actions);
            setValidationResults(results);

            const validCount = results.filter(r => r.isValid).length;
            const totalCount = results.length;

            toast({
                title: 'Validation Complete',
                description: `${validCount}/${totalCount} actions are valid`,
                status: validCount === totalCount ? 'success' : 'warning',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: 'Validation Failed',
                description: 'Failed to validate actions',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    }, [actions, toast]);

    const handleAutoFix = useCallback(async () => {
        try {
            let fixedCount = 0;
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                const validationResult = validationResults[i];
                if (validationResult && !validationResult.isValid) {
                    const fixedAction = await actionValidationManager.autoFixAction(action, validationResult);
                    // Update the action in storage
                    const updatedActions = [...actions];
                    updatedActions[i] = fixedAction;
                    setActions(updatedActions);
                    fixedCount++;
                }
            }

            if (fixedCount > 0) {
                loadValidationResults();
                toast({
                    title: 'Auto-Fix Complete',
                    description: `${fixedCount} actions have been fixed`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                toast({
                    title: 'No Fixes Needed',
                    description: 'All actions are already valid',
                    status: 'info',
                    duration: 2000,
                    isClosable: true,
                });
            }
        } catch (error) {
            toast({
                title: 'Auto-Fix Failed',
                description: 'Failed to auto-fix actions',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    }, [actions, validationResults, loadValidationResults, toast]);

    const handlePageChange = useCallback((page: number) => {
        setPaginationConfig(prev => ({ ...prev, currentPage: page }));
    }, []);

    const handlePageSizeChange = useCallback((pageSize: number) => {
        setPaginationConfig(prev => ({
            ...prev,
            pageSize,
            currentPage: 1,
            totalPages: Math.ceil(prev.totalItems / pageSize)
        }));
    }, []);

    const handleRefresh = useCallback(() => {
        loadActions();
        loadValidationResults();
        setUndoRedoState(actionUndoRedoManager.getState());
    }, [loadActions, loadValidationResults]);

    const renderActionItem = useCallback((action: ActionResult, index: number) => {
        const validationResult = validationResults[index];
        const isValid = validationResult?.isValid ?? true;
        const score = validationResult?.score ?? 100;

        return (
            <Card key={action.uniqueId} size="sm" mb={2}>
                <CardBody>
                    <Flex justify="space-between" align="start">
                        <VStack align="start" spacing={1} flex={1}>
                            <HStack>
                                <Text fontSize="sm" fontWeight="semibold">
                                    {action.actionType.replace('create', '').replace('Action', '')}
                                </Text>
                                <Badge colorScheme={isValid ? 'green' : 'red'} size="sm">
                                    {isValid ? 'Valid' : 'Invalid'}
                                </Badge>
                                <Badge colorScheme="blue" size="sm">
                                    {score}%
                                </Badge>
                            </HStack>

                            <Text fontSize="xs" color="gray.500">
                                {new Date(action.timestamp).toLocaleString()}
                            </Text>

                            <Text fontSize="xs" color="gray.600" noOfLines={2}>
                                {action.message || action.actionString}
                            </Text>

                            {validationResult && !isValid && (
                                <VStack align="start" spacing={1} mt={2}>
                                    {validationResult.errors.slice(0, 2).map((error: any, i: number) => (
                                        <Text key={i} fontSize="xs" color="red.500">
                                            • {error.message}
                                        </Text>
                                    ))}
                                    {validationResult.errors.length > 2 && (
                                        <Text fontSize="xs" color="red.500">
                                            • +{validationResult.errors.length - 2} more errors
                                        </Text>
                                    )}
                                </VStack>
                            )}
                        </VStack>

                        <HStack spacing={1}>
                            <Tooltip label="Validate">
                                <IconButton
                                    aria-label="Validate"
                                    icon={<CheckIcon />}
                                    size="xs"
                                    variant="outline"
                                    colorScheme={isValid ? 'green' : 'red'}
                                />
                            </Tooltip>
                        </HStack>
                    </Flex>
                </CardBody>
            </Card>
        );
    }, [validationResults]);

    const paginationData = {
        items: actions.slice(
            (paginationConfig.currentPage - 1) * paginationConfig.pageSize,
            paginationConfig.currentPage * paginationConfig.pageSize
        ),
        totalCount: actions.length,
        hasMore: paginationConfig.currentPage < paginationConfig.totalPages,
        isLoading: false
    };

    const paginationCallbacks = {
        onPageChange: handlePageChange,
        onPageSizeChange: handlePageSizeChange,
        onRefresh: handleRefresh,
        onExport: handleExport
    };

    const validationStats = actionValidationManager.getStatistics();
    const undoRedoStats = actionUndoRedoManager.getStatistics();
    const exportStats = actionExportManager.getExportStats();

    return (
        <Box p={6}>
            <VStack spacing={6} align="stretch">
                {/* Header */}
                <Flex justify="space-between" align="center">
                    <Box>
                        <Heading size="lg" mb={2}>Advanced Action Dashboard</Heading>
                        <Text color="gray.600">Comprehensive action management with validation, undo/redo, and export</Text>
                    </Box>
                    <HStack spacing={3}>
                        <Button
                            leftIcon={<RefreshIcon />}
                            onClick={handleRefresh}
                            size="sm"
                            variant="outline"
                        >
                            Refresh
                        </Button>
                        <Button
                            leftIcon={<SettingsIcon />}
                            onClick={onSettingsOpen}
                            size="sm"
                            variant="outline"
                        >
                            Settings
                        </Button>
                    </HStack>
                </Flex>

                {/* Statistics */}
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
                    <GridItem>
                        <Card>
                            <CardBody>
                                <Stat>
                                    <StatLabel>Total Actions</StatLabel>
                                    <StatNumber>{actions.length}</StatNumber>
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
                                    <StatLabel>Validation Score</StatLabel>
                                    <StatNumber color="green.500">
                                        {validationStats.averageScore.toFixed(1)}%
                                    </StatNumber>
                                    <StatHelpText>
                                        {validationStats.successfulValidations} valid
                                    </StatHelpText>
                                </Stat>
                            </CardBody>
                        </Card>
                    </GridItem>

                    <GridItem>
                        <Card>
                            <CardBody>
                                <Stat>
                                    <StatLabel>Undo Stack</StatLabel>
                                    <StatNumber color="blue.500">{undoRedoStats.undoableActions}</StatNumber>
                                    <StatHelpText>
                                        {undoRedoStats.redoableActions} redoable
                                    </StatHelpText>
                                </Stat>
                            </CardBody>
                        </Card>
                    </GridItem>

                    <GridItem>
                        <Card>
                            <CardBody>
                                <Stat>
                                    <StatLabel>Export Ready</StatLabel>
                                    <StatNumber color="purple.500">{exportStats.totalActions}</StatNumber>
                                    <StatHelpText>
                                        {exportStats.uniqueActionTypes} types
                                    </StatHelpText>
                                </Stat>
                            </CardBody>
                        </Card>
                    </GridItem>
                </Grid>

                {/* Main Content */}
                <Tabs index={activeTab} onChange={setActiveTab}>
                    <TabList>
                        <Tab>Actions</Tab>
                        <Tab>Validation</Tab>
                        <Tab>Undo/Redo</Tab>
                        <Tab>Export</Tab>
                    </TabList>

                    <TabPanels>
                        {/* Actions Tab */}
                        <TabPanel p={0}>
                            <Box mt={4}>
                                <EnhancedPagination
                                    config={paginationConfig}
                                    data={paginationData}
                                    callbacks={paginationCallbacks}
                                    renderItem={renderActionItem}
                                    height={600}
                                    itemHeight={120}
                                />
                            </Box>
                        </TabPanel>

                        {/* Validation Tab */}
                        <TabPanel p={0}>
                            <Box mt={4}>
                                <Flex justify="space-between" align="center" mb={4}>
                                    <Heading size="md">Action Validation</Heading>
                                    <HStack spacing={2}>
                                        <Button
                                            leftIcon={<CheckIcon />}
                                            onClick={handleValidateAll}
                                            size="sm"
                                            colorScheme="blue"
                                        >
                                            Validate All
                                        </Button>
                                        <Button
                                            leftIcon={<RefreshIcon />}
                                            onClick={handleAutoFix}
                                            size="sm"
                                            colorScheme="green"
                                        >
                                            Auto-Fix
                                        </Button>
                                    </HStack>
                                </Flex>

                                <Card>
                                    <CardHeader>
                                        <Heading size="sm">Validation Results</Heading>
                                    </CardHeader>
                                    <CardBody>
                                        <Table size="sm">
                                            <Thead>
                                                <Tr>
                                                    <Th>Action</Th>
                                                    <Th>Status</Th>
                                                    <Th>Score</Th>
                                                    <Th>Errors</Th>
                                                    <Th>Warnings</Th>
                                                    <Th>Actions</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {validationResults.map((result, index) => (
                                                    <Tr key={index}>
                                                        <Td>
                                                            <Text fontSize="sm">
                                                                {actions[index]?.actionType || 'Unknown'}
                                                            </Text>
                                                        </Td>
                                                        <Td>
                                                            <Badge colorScheme={result.isValid ? 'green' : 'red'} size="sm">
                                                                {result.isValid ? 'Valid' : 'Invalid'}
                                                            </Badge>
                                                        </Td>
                                                        <Td>
                                                            <Text fontSize="sm">{result.score}%</Text>
                                                        </Td>
                                                        <Td>
                                                            <Text fontSize="sm" color="red.500">
                                                                {result.errors.length}
                                                            </Text>
                                                        </Td>
                                                        <Td>
                                                            <Text fontSize="sm" color="yellow.500">
                                                                {result.warnings.length}
                                                            </Text>
                                                        </Td>
                                                        <Td>
                                                            <HStack spacing={1}>
                                                                <Tooltip label="View Details">
                                                                    <IconButton
                                                                        aria-label="View details"
                                                                        icon={<InfoIcon />}
                                                                        size="xs"
                                                                        variant="outline"
                                                                    />
                                                                </Tooltip>
                                                            </HStack>
                                                        </Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </CardBody>
                                </Card>
                            </Box>
                        </TabPanel>

                        {/* Undo/Redo Tab */}
                        <TabPanel p={0}>
                            <Box mt={4}>
                                <Flex justify="space-between" align="center" mb={4}>
                                    <Heading size="md">Undo/Redo Management</Heading>
                                    <HStack spacing={2}>
                                        <Button
                                            leftIcon={<UndoIcon />}
                                            onClick={handleUndo}
                                            isDisabled={!undoRedoState.undoStack.length}
                                            size="sm"
                                            colorScheme="blue"
                                        >
                                            Undo
                                        </Button>
                                        <Button
                                            leftIcon={<RedoIcon />}
                                            onClick={handleRedo}
                                            isDisabled={!undoRedoState.redoStack.length}
                                            size="sm"
                                            colorScheme="green"
                                        >
                                            Redo
                                        </Button>
                                    </HStack>
                                </Flex>

                                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4} mb={4}>
                                    <Card>
                                        <CardHeader>
                                            <Heading size="sm">Undo Stack</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <VStack align="stretch" spacing={2} maxHeight="300px" overflowY="auto">
                                                {undoRedoState.undoStack.slice(-10).reverse().map((action, index) => (
                                                    <Box key={action.uniqueId} p={2} bg="gray.50" borderRadius="md">
                                                        <Text fontSize="sm" fontWeight="medium">
                                                            {action.actionType.replace('create', '').replace('Action', '')}
                                                        </Text>
                                                        <Text fontSize="xs" color="gray.500">
                                                            {new Date(action.timestamp).toLocaleString()}
                                                        </Text>
                                                    </Box>
                                                ))}
                                                {undoRedoState.undoStack.length === 0 && (
                                                    <Text fontSize="sm" color="gray.500" textAlign="center">
                                                        No actions to undo
                                                    </Text>
                                                )}
                                            </VStack>
                                        </CardBody>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <Heading size="sm">Redo Stack</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <VStack align="stretch" spacing={2} maxHeight="300px" overflowY="auto">
                                                {undoRedoState.redoStack.slice(-10).reverse().map((action, index) => (
                                                    <Box key={action.uniqueId} p={2} bg="gray.50" borderRadius="md">
                                                        <Text fontSize="sm" fontWeight="medium">
                                                            {action.actionType.replace('create', '').replace('Action', '')}
                                                        </Text>
                                                        <Text fontSize="xs" color="gray.500">
                                                            {new Date(action.timestamp).toLocaleString()}
                                                        </Text>
                                                    </Box>
                                                ))}
                                                {undoRedoState.redoStack.length === 0 && (
                                                    <Text fontSize="sm" color="gray.500" textAlign="center">
                                                        No actions to redo
                                                    </Text>
                                                )}
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                </Grid>

                                <HStack spacing={2} justify="center">
                                    <Button
                                        onClick={() => handleUndoMultiple(5)}
                                        isDisabled={undoRedoState.undoStack.length < 5}
                                        size="sm"
                                        variant="outline"
                                    >
                                        Undo 5
                                    </Button>
                                    <Button
                                        onClick={() => handleRedoMultiple(5)}
                                        isDisabled={undoRedoState.redoStack.length < 5}
                                        size="sm"
                                        variant="outline"
                                    >
                                        Redo 5
                                    </Button>
                                    <Button
                                        onClick={() => actionUndoRedoManager.clearHistory()}
                                        size="sm"
                                        variant="outline"
                                        colorScheme="red"
                                    >
                                        Clear History
                                    </Button>
                                </HStack>
                            </Box>
                        </TabPanel>

                        {/* Export Tab */}
                        <TabPanel p={0}>
                            <Box mt={4}>
                                <Flex justify="space-between" align="center" mb={4}>
                                    <Heading size="md">Export Data</Heading>
                                    <Button
                                        leftIcon={<DownloadIcon />}
                                        onClick={onExportOpen}
                                        size="sm"
                                        colorScheme="blue"
                                    >
                                        Export
                                    </Button>
                                </Flex>

                                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                                    <Card>
                                        <CardHeader>
                                            <Heading size="sm">Export Options</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <VStack align="stretch" spacing={3}>
                                                <FormControl>
                                                    <FormLabel>Format</FormLabel>
                                                    <Select
                                                        value={exportOptions.format}
                                                        onChange={(e) => setExportOptions(prev => ({
                                                            ...prev,
                                                            format: e.target.value as any
                                                        }))}
                                                    >
                                                        <option value="json">JSON</option>
                                                        <option value="csv">CSV</option>
                                                        <option value="xlsx">Excel</option>
                                                        <option value="pdf">PDF</option>
                                                    </Select>
                                                </FormControl>

                                                <FormControl>
                                                    <FormLabel>Include Data</FormLabel>
                                                    <CheckboxGroup>
                                                        <VStack align="start" spacing={2}>
                                                            <Checkbox
                                                                isChecked={exportOptions.includeAnalytics}
                                                                onChange={(e) => setExportOptions(prev => ({
                                                                    ...prev,
                                                                    includeAnalytics: e.target.checked
                                                                }))}
                                                            >
                                                                Analytics
                                                            </Checkbox>
                                                            <Checkbox
                                                                isChecked={exportOptions.includeScheduled}
                                                                onChange={(e) => setExportOptions(prev => ({
                                                                    ...prev,
                                                                    includeScheduled: e.target.checked
                                                                }))}
                                                            >
                                                                Scheduled Actions
                                                            </Checkbox>
                                                            <Checkbox
                                                                isChecked={exportOptions.includeTemplates}
                                                                onChange={(e) => setExportOptions(prev => ({
                                                                    ...prev,
                                                                    includeTemplates: e.target.checked
                                                                }))}
                                                            >
                                                                Templates
                                                            </Checkbox>
                                                        </VStack>
                                                    </CheckboxGroup>
                                                </FormControl>
                                            </VStack>
                                        </CardBody>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <Heading size="sm">Export Statistics</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <VStack align="stretch" spacing={2}>
                                                <HStack justify="space-between">
                                                    <Text fontSize="sm">Total Actions:</Text>
                                                    <Text fontSize="sm" fontWeight="medium">{exportStats.totalActions}</Text>
                                                </HStack>
                                                <HStack justify="space-between">
                                                    <Text fontSize="sm">Action Types:</Text>
                                                    <Text fontSize="sm" fontWeight="medium">{exportStats.uniqueActionTypes}</Text>
                                                </HStack>
                                                <HStack justify="space-between">
                                                    <Text fontSize="sm">Date Range:</Text>
                                                    <Text fontSize="sm" fontWeight="medium">
                                                        {exportStats.dateRange.earliest ?
                                                            new Date(exportStats.dateRange.earliest).toLocaleDateString() :
                                                            'N/A'
                                                        } - {
                                                            exportStats.dateRange.latest ?
                                                                new Date(exportStats.dateRange.latest).toLocaleDateString() :
                                                                'N/A'
                                                        }
                                                    </Text>
                                                </HStack>
                                                <HStack justify="space-between">
                                                    <Text fontSize="sm">Templates:</Text>
                                                    <Text fontSize="sm" fontWeight="medium">{exportStats.templates}</Text>
                                                </HStack>
                                                <HStack justify="space-between">
                                                    <Text fontSize="sm">Scheduled:</Text>
                                                    <Text fontSize="sm" fontWeight="medium">{exportStats.scheduledActions}</Text>
                                                </HStack>
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                </Grid>
                            </Box>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </VStack>

            {/* Export Modal */}
            <Modal isOpen={isExportOpen} onClose={onExportClose} size="md">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Export Data</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={4} align="stretch">
                            <Text fontSize="sm" color="gray.600">
                                Export {actions.length} actions as {exportOptions.format.toUpperCase()}
                            </Text>

                            <HStack spacing={4} justify="center">
                                <Button
                                    colorScheme="blue"
                                    onClick={handleExport}
                                    leftIcon={<DownloadIcon />}
                                >
                                    Export Now
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={onExportClose}
                                >
                                    Cancel
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default AdvancedActionDashboard;
