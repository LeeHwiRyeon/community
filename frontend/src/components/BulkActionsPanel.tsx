import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Checkbox,
    Progress,
    Badge,
    Divider,
    Card,
    CardHeader,
    CardBody,
    Heading,
    Select,
    Input,
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
    Switch,
    FormControl,
    FormLabel,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper
} from '@chakra-ui/react';
import {
    AddIcon,
    DeleteIcon,
    PlayIcon,
    StopIcon,
    CheckIcon,
    CloseIcon,
    SettingsIcon,
    InfoIcon
} from '@chakra-ui/icons';
import {
    bulkActionManager,
    BulkActionBatch,
    BulkActionTemplate,
    BulkActionItem
} from '../utils/bulkActions';
import { ACTION_REGISTRY } from '../utils/actionGenerators';

const BulkActionsPanel: React.FC = () => {
    const [batches, setBatches] = useState<BulkActionBatch[]>([]);
    const [templates, setTemplates] = useState<BulkActionTemplate[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<BulkActionBatch | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionOptions, setExecutionOptions] = useState({
        delay: 1000,
        stopOnError: false,
        playSounds: true,
        showAnimations: true
    });
    const [newBatchName, setNewBatchName] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedActions, setSelectedActions] = useState<(keyof typeof ACTION_REGISTRY)[]>([]);

    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
    const toast = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setBatches(bulkActionManager.getBatches());
        setTemplates(bulkActionManager.getTemplates());
    };

    const handleCreateBatch = () => {
        if (!newBatchName.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter a batch name',
                status: 'error',
                duration: 2000,
                isClosable: true,
            });
            return;
        }

        if (selectedActions.length === 0) {
            toast({
                title: 'Error',
                description: 'Please select at least one action',
                status: 'error',
                duration: 2000,
                isClosable: true,
            });
            return;
        }

        const batch = bulkActionManager.createBatch(newBatchName, selectedActions);
        setBatches(bulkActionManager.getBatches());
        setSelectedBatch(batch);
        setNewBatchName('');
        setSelectedActions([]);
        onClose();

        toast({
            title: 'Batch Created',
            description: `Created batch "${batch.name}" with ${batch.totalItems} actions`,
            status: 'success',
            duration: 2000,
            isClosable: true,
        });
    };

    const handleCreateFromTemplate = () => {
        if (!selectedTemplate) {
            toast({
                title: 'Error',
                description: 'Please select a template',
                status: 'error',
                duration: 2000,
                isClosable: true,
            });
            return;
        }

        const batch = bulkActionManager.createBatchFromTemplate(selectedTemplate);
        setBatches(bulkActionManager.getBatches());
        setSelectedBatch(batch);
        setSelectedTemplate('');
        onClose();

        toast({
            title: 'Batch Created',
            description: `Created batch from template: ${batch.name}`,
            status: 'success',
            duration: 2000,
            isClosable: true,
        });
    };

    const handleExecuteBatch = async () => {
        if (!selectedBatch) return;

        setIsExecuting(true);

        try {
            const result = await bulkActionManager.executeBatch(selectedBatch.id, executionOptions);
            if (result) {
                setBatches(bulkActionManager.getBatches());
                setSelectedBatch(result);

                toast({
                    title: 'Batch Executed',
                    description: `Executed ${result.executedItems} actions successfully`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            }
        } catch (error) {
            toast({
                title: 'Execution Failed',
                description: error instanceof Error ? error.message : 'Unknown error',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsExecuting(false);
        }
    };

    const handleCancelBatch = () => {
        if (!selectedBatch) return;

        const result = bulkActionManager.cancelBatch(selectedBatch.id);
        if (result) {
            setBatches(bulkActionManager.getBatches());
            setSelectedBatch(result);

            toast({
                title: 'Batch Cancelled',
                description: 'Batch execution has been cancelled',
                status: 'info',
                duration: 2000,
                isClosable: true,
            });
        }
    };

    const handleToggleItemSelection = (itemId: string) => {
        if (!selectedBatch) return;

        const result = bulkActionManager.toggleItemSelection(selectedBatch.id, itemId);
        if (result) {
            setSelectedBatch(result);
        }
    };

    const handleSelectAll = () => {
        if (!selectedBatch) return;

        const result = bulkActionManager.selectAllItems(selectedBatch.id);
        if (result) {
            setSelectedBatch(result);
        }
    };

    const handleDeselectAll = () => {
        if (!selectedBatch) return;

        const result = bulkActionManager.deselectAllItems(selectedBatch.id);
        if (result) {
            setSelectedBatch(result);
        }
    };

    const handleDeleteBatch = (batchId: string) => {
        const success = bulkActionManager.deleteBatch(batchId);
        if (success) {
            setBatches(bulkActionManager.getBatches());
            if (selectedBatch?.id === batchId) {
                setSelectedBatch(null);
            }

            toast({
                title: 'Batch Deleted',
                description: 'Batch has been deleted successfully',
                status: 'info',
                duration: 2000,
                isClosable: true,
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'green';
            case 'failed': return 'red';
            case 'running': return 'blue';
            case 'cancelled': return 'gray';
            default: return 'gray';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckIcon />;
            case 'failed': return <CloseIcon />;
            case 'running': return <PlayIcon />;
            case 'cancelled': return <StopIcon />;
            default: return null;
        }
    };

    return (
        <Box p={6}>
            <VStack spacing={6} align="stretch">
                {/* Header */}
                <Flex justify="space-between" align="center">
                    <Box>
                        <Heading size="lg" mb={2}>Bulk Actions Manager</Heading>
                        <Text color="gray.600">Create and execute multiple actions simultaneously</Text>
                    </Box>
                    <HStack spacing={3}>
                        <Button
                            leftIcon={<AddIcon />}
                            colorScheme="blue"
                            onClick={onOpen}
                            size="sm"
                        >
                            New Batch
                        </Button>
                        <Tooltip label="Execution settings">
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
                <Card>
                    <CardBody>
                        <HStack spacing={6} wrap="wrap">
                            <VStack align="start" spacing={1}>
                                <Text fontSize="sm" color="gray.600">Total Batches</Text>
                                <Text fontSize="2xl" fontWeight="bold">{batches.length}</Text>
                            </VStack>
                            <VStack align="start" spacing={1}>
                                <Text fontSize="sm" color="gray.600">Completed</Text>
                                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                                    {batches.filter(b => b.status === 'completed').length}
                                </Text>
                            </VStack>
                            <VStack align="start" spacing={1}>
                                <Text fontSize="sm" color="gray.600">Failed</Text>
                                <Text fontSize="2xl" fontWeight="bold" color="red.500">
                                    {batches.filter(b => b.status === 'failed').length}
                                </Text>
                            </VStack>
                            <VStack align="start" spacing={1}>
                                <Text fontSize="sm" color="gray.600">Success Rate</Text>
                                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                                    {bulkActionManager.getBatchStatistics().successRate}%
                                </Text>
                            </VStack>
                        </HStack>
                    </CardBody>
                </Card>

                {/* Batch List */}
                <Card>
                    <CardHeader>
                        <Heading size="md">Batches</Heading>
                    </CardHeader>
                    <CardBody>
                        {batches.length === 0 ? (
                            <Text color="gray.500" textAlign="center" py={4}>
                                No batches created yet. Click "New Batch" to get started.
                            </Text>
                        ) : (
                            <VStack spacing={3} align="stretch">
                                {batches.map((batch) => (
                                    <Card
                                        key={batch.id}
                                        borderColor={selectedBatch?.id === batch.id ? 'blue.300' : 'gray.200'}
                                        borderWidth={selectedBatch?.id === batch.id ? 2 : 1}
                                        cursor="pointer"
                                        onClick={() => setSelectedBatch(batch)}
                                        _hover={{ borderColor: 'blue.300' }}
                                    >
                                        <CardBody>
                                            <Flex justify="space-between" align="center">
                                                <VStack align="start" spacing={1}>
                                                    <HStack>
                                                        <Text fontWeight="semibold">{batch.name}</Text>
                                                        <Badge colorScheme={getStatusColor(batch.status)}>
                                                            {getStatusIcon(batch.status)}
                                                            {batch.status}
                                                        </Badge>
                                                    </HStack>
                                                    <Text fontSize="sm" color="gray.600">
                                                        {batch.totalItems} actions • {batch.executedItems} executed • {batch.failedItems} failed
                                                    </Text>
                                                    <Text fontSize="xs" color="gray.500">
                                                        Created: {new Date(batch.createdAt).toLocaleString()}
                                                    </Text>
                                                </VStack>
                                                <HStack>
                                                    {batch.status === 'running' && (
                                                        <Progress
                                                            value={batch.progress}
                                                            size="sm"
                                                            width="100px"
                                                            colorScheme="blue"
                                                        />
                                                    )}
                                                    <IconButton
                                                        aria-label="Delete batch"
                                                        icon={<DeleteIcon />}
                                                        size="sm"
                                                        variant="ghost"
                                                        colorScheme="red"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteBatch(batch.id);
                                                        }}
                                                    />
                                                </HStack>
                                            </Flex>
                                        </CardBody>
                                    </Card>
                                ))}
                            </VStack>
                        )}
                    </CardBody>
                </Card>

                {/* Selected Batch Details */}
                {selectedBatch && (
                    <Card>
                        <CardHeader>
                            <Flex justify="space-between" align="center">
                                <Heading size="md">{selectedBatch.name}</Heading>
                                <HStack>
                                    <Button
                                        leftIcon={<PlayIcon />}
                                        colorScheme="green"
                                        onClick={handleExecuteBatch}
                                        isDisabled={isExecuting || selectedBatch.status === 'running'}
                                        size="sm"
                                    >
                                        Execute
                                    </Button>
                                    {selectedBatch.status === 'running' && (
                                        <Button
                                            leftIcon={<StopIcon />}
                                            colorScheme="red"
                                            onClick={handleCancelBatch}
                                            size="sm"
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </HStack>
                            </Flex>
                        </CardHeader>
                        <CardBody>
                            <VStack spacing={4} align="stretch">
                                {/* Batch Info */}
                                <HStack justify="space-between" wrap="wrap">
                                    <Text fontSize="sm">
                                        <strong>Status:</strong> {selectedBatch.status}
                                    </Text>
                                    <Text fontSize="sm">
                                        <strong>Progress:</strong> {selectedBatch.progress}%
                                    </Text>
                                    <Text fontSize="sm">
                                        <strong>Selected:</strong> {selectedBatch.items.filter(i => i.selected).length} / {selectedBatch.totalItems}
                                    </Text>
                                </HStack>

                                {/* Progress Bar */}
                                {selectedBatch.status === 'running' && (
                                    <Progress
                                        value={selectedBatch.progress}
                                        size="lg"
                                        colorScheme="blue"
                                        borderRadius="md"
                                    />
                                )}

                                {/* Action Items */}
                                <Box>
                                    <HStack justify="space-between" mb={3}>
                                        <Text fontWeight="semibold">Actions</Text>
                                        <HStack>
                                            <Button size="xs" onClick={handleSelectAll}>
                                                Select All
                                            </Button>
                                            <Button size="xs" onClick={handleDeselectAll}>
                                                Deselect All
                                            </Button>
                                        </HStack>
                                    </HStack>

                                    <Table size="sm">
                                        <Thead>
                                            <Tr>
                                                <Th>Select</Th>
                                                <Th>Action</Th>
                                                <Th>Status</Th>
                                                <Th>Result</Th>
                                                <Th>Time</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {selectedBatch.items.map((item) => (
                                                <Tr key={item.id}>
                                                    <Td>
                                                        <Checkbox
                                                            isChecked={item.selected}
                                                            onChange={() => handleToggleItemSelection(item.id)}
                                                            isDisabled={isExecuting}
                                                        />
                                                    </Td>
                                                    <Td>
                                                        <Text fontSize="sm">
                                                            {item.actionType.replace('create', '').replace('Action', '')}
                                                        </Text>
                                                    </Td>
                                                    <Td>
                                                        {item.executed ? (
                                                            <Badge colorScheme="green" size="sm">
                                                                <CheckIcon />
                                                                Executed
                                                            </Badge>
                                                        ) : item.error ? (
                                                            <Badge colorScheme="red" size="sm">
                                                                <CloseIcon />
                                                                Failed
                                                            </Badge>
                                                        ) : (
                                                            <Badge colorScheme="gray" size="sm">
                                                                Pending
                                                            </Badge>
                                                        )}
                                                    </Td>
                                                    <Td>
                                                        {item.result && (
                                                            <Text fontSize="xs" color="gray.600">
                                                                {item.result.message}
                                                            </Text>
                                                        )}
                                                        {item.error && (
                                                            <Text fontSize="xs" color="red.500">
                                                                {item.error}
                                                            </Text>
                                                        )}
                                                    </Td>
                                                    <Td>
                                                        {item.timestamp && (
                                                            <Text fontSize="xs" color="gray.500">
                                                                {new Date(item.timestamp).toLocaleTimeString()}
                                                            </Text>
                                                        )}
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </Box>
                            </VStack>
                        </CardBody>
                    </Card>
                )}
            </VStack>

            {/* Create Batch Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Create New Batch</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={4} align="stretch">
                            <FormControl>
                                <FormLabel>Batch Name</FormLabel>
                                <Input
                                    value={newBatchName}
                                    onChange={(e) => setNewBatchName(e.target.value)}
                                    placeholder="Enter batch name..."
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Select Actions</FormLabel>
                                <VStack spacing={2} align="stretch" maxHeight="200px" overflowY="auto">
                                    {Object.keys(ACTION_REGISTRY).map((actionType) => (
                                        <Checkbox
                                            key={actionType}
                                            isChecked={selectedActions.includes(actionType as keyof typeof ACTION_REGISTRY)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedActions([...selectedActions, actionType as keyof typeof ACTION_REGISTRY]);
                                                } else {
                                                    setSelectedActions(selectedActions.filter(a => a !== actionType));
                                                }
                                            }}
                                        >
                                            {actionType.replace('create', '').replace('Action', '')}
                                        </Checkbox>
                                    ))}
                                </VStack>
                            </FormControl>

                            <Divider />

                            <FormControl>
                                <FormLabel>Or Create from Template</FormLabel>
                                <Select
                                    value={selectedTemplate}
                                    onChange={(e) => setSelectedTemplate(e.target.value)}
                                    placeholder="Select a template..."
                                >
                                    {templates.map((template) => (
                                        <option key={template.id} value={template.id}>
                                            {template.name} - {template.description}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="blue"
                            onClick={selectedTemplate ? handleCreateFromTemplate : handleCreateBatch}
                        >
                            Create Batch
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Settings Modal */}
            <Modal isOpen={isSettingsOpen} onClose={onSettingsClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Execution Settings</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={4} align="stretch">
                            <FormControl>
                                <FormLabel>Delay Between Actions (ms)</FormLabel>
                                <NumberInput
                                    value={executionOptions.delay}
                                    onChange={(valueString) => setExecutionOptions({
                                        ...executionOptions,
                                        delay: parseInt(valueString) || 1000
                                    })}
                                    min={0}
                                    max={10000}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            <FormControl display="flex" alignItems="center">
                                <FormLabel htmlFor="stop-on-error" mb="0">
                                    Stop on Error
                                </FormLabel>
                                <Switch
                                    id="stop-on-error"
                                    isChecked={executionOptions.stopOnError}
                                    onChange={(e) => setExecutionOptions({
                                        ...executionOptions,
                                        stopOnError: e.target.checked
                                    })}
                                />
                            </FormControl>

                            <FormControl display="flex" alignItems="center">
                                <FormLabel htmlFor="play-sounds" mb="0">
                                    Play Sounds
                                </FormLabel>
                                <Switch
                                    id="play-sounds"
                                    isChecked={executionOptions.playSounds}
                                    onChange={(e) => setExecutionOptions({
                                        ...executionOptions,
                                        playSounds: e.target.checked
                                    })}
                                />
                            </FormControl>

                            <FormControl display="flex" alignItems="center">
                                <FormLabel htmlFor="show-animations" mb="0">
                                    Show Animations
                                </FormLabel>
                                <Switch
                                    id="show-animations"
                                    isChecked={executionOptions.showAnimations}
                                    onChange={(e) => setExecutionOptions({
                                        ...executionOptions,
                                        showAnimations: e.target.checked
                                    })}
                                />
                            </FormControl>
                        </VStack>
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

export default BulkActionsPanel;
