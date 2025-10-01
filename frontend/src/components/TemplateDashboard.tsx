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
    Divider,
    Tag,
    TagLabel,
    TagCloseButton,
    InputGroup,
    InputLeftElement,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Code,
    List,
    ListItem,
    ListIcon
} from '@chakra-ui/react';
import {
    AddIcon,
    DeleteIcon,
    EditIcon,
    CopyIcon,
    PlayIcon,
    StopIcon,
    SearchIcon,
    FilterIcon,
    StarIcon,
    InfoIcon,
    SettingsIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    CheckIcon,
    CloseIcon,
    WarningIcon
} from '@chakra-ui/icons';
import {
    actionTemplateManager,
    ActionTemplate,
    TemplateExecution,
    TemplateVariable,
    TemplateAction
} from '../utils/actionTemplates';
import { ACTION_REGISTRY } from '../utils/actionGenerators';

const TemplateDashboard: React.FC = () => {
    const [templates, setTemplates] = useState<ActionTemplate[]>([]);
    const [executions, setExecutions] = useState<TemplateExecution[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<ActionTemplate | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
    const [isCreating, setIsCreating] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionVariables, setExecutionVariables] = useState<Record<string, any>>({});
    const [newTemplate, setNewTemplate] = useState<Partial<ActionTemplate>>({
        name: '',
        description: '',
        category: 'custom',
        tags: [],
        actions: [],
        variables: [],
        settings: {
            allowCustomization: true,
            allowVariableOverride: true,
            requireConfirmation: true,
            showProgress: true,
            enableNotifications: true,
            autoSave: true
        },
        metadata: {
            version: '1.0.0',
            author: 'User',
            compatibility: ['all'],
            lastTested: new Date().toISOString()
        },
        isDefault: false,
        isPublic: false,
        createdBy: 'user',
        difficulty: 'beginner',
        estimatedDuration: 5
    });

    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isExecutionOpen, onOpen: onExecutionOpen, onClose: onExecutionClose } = useDisclosure();
    const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();
    const toast = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setTemplates(actionTemplateManager.getTemplates());
        setExecutions(actionTemplateManager.getExecutions());
    };

    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
        const matchesDifficulty = selectedDifficulty === 'all' || template.difficulty === selectedDifficulty;

        return matchesSearch && matchesCategory && matchesDifficulty;
    });

    const handleCreateTemplate = () => {
        if (!newTemplate.name || !newTemplate.description) {
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
            const template = actionTemplateManager.createTemplate(newTemplate as any);
            setTemplates(actionTemplateManager.getTemplates());
            setIsCreating(false);
            setNewTemplate({
                name: '',
                description: '',
                category: 'custom',
                tags: [],
                actions: [],
                variables: [],
                settings: {
                    allowCustomization: true,
                    allowVariableOverride: true,
                    requireConfirmation: true,
                    showProgress: true,
                    enableNotifications: true,
                    autoSave: true
                },
                metadata: {
                    version: '1.0.0',
                    author: 'User',
                    compatibility: ['all'],
                    lastTested: new Date().toISOString()
                },
                isDefault: false,
                isPublic: false,
                createdBy: 'user',
                difficulty: 'beginner',
                estimatedDuration: 5
            });

            toast({
                title: 'Template Created',
                description: `"${template.name}" has been created successfully`,
                status: 'success',
                duration: 2000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to create template',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleExecuteTemplate = async (template: ActionTemplate) => {
        setSelectedTemplate(template);
        setExecutionVariables({});
        onExecutionOpen();
    };

    const handleStartExecution = async () => {
        if (!selectedTemplate) return;

        setIsExecuting(true);

        try {
            const execution = await actionTemplateManager.executeTemplate(selectedTemplate.id, executionVariables);
            setExecutions(actionTemplateManager.getExecutions());

            toast({
                title: 'Template Executed',
                description: `"${selectedTemplate.name}" has been executed successfully`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: 'Execution Failed',
                description: error instanceof Error ? error.message : 'Failed to execute template',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsExecuting(false);
            onExecutionClose();
        }
    };

    const handleDuplicateTemplate = (template: ActionTemplate) => {
        const newName = `${template.name} (Copy)`;
        const duplicated = actionTemplateManager.duplicateTemplate(template.id, newName);
        if (duplicated) {
            setTemplates(actionTemplateManager.getTemplates());
            toast({
                title: 'Template Duplicated',
                description: `"${newName}" has been created`,
                status: 'success',
                duration: 2000,
                isClosable: true,
            });
        }
    };

    const handleDeleteTemplate = (template: ActionTemplate) => {
        if (template.isDefault) {
            toast({
                title: 'Cannot Delete',
                description: 'Default templates cannot be deleted',
                status: 'warning',
                duration: 2000,
                isClosable: true,
            });
            return;
        }

        const success = actionTemplateManager.deleteTemplate(template.id);
        if (success) {
            setTemplates(actionTemplateManager.getTemplates());
            toast({
                title: 'Template Deleted',
                description: `"${template.name}" has been deleted`,
                status: 'info',
                duration: 2000,
                isClosable: true,
            });
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner': return 'green';
            case 'intermediate': return 'yellow';
            case 'advanced': return 'red';
            default: return 'gray';
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'social': return 'blue';
            case 'content': return 'purple';
            case 'navigation': return 'cyan';
            case 'automation': return 'orange';
            case 'testing': return 'red';
            case 'custom': return 'gray';
            default: return 'gray';
        }
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

    const globalStats = actionTemplateManager.getGlobalStats();

    return (
        <Box p={6}>
            <VStack spacing={6} align="stretch">
                {/* Header */}
                <Flex justify="space-between" align="center">
                    <Box>
                        <Heading size="lg" mb={2}>Action Templates</Heading>
                        <Text color="gray.600">Create and manage reusable action workflows</Text>
                    </Box>
                    <HStack spacing={3}>
                        <Button
                            leftIcon={<AddIcon />}
                            colorScheme="blue"
                            onClick={() => setIsCreating(true)}
                            size="sm"
                        >
                            Create Template
                        </Button>
                        <Button
                            leftIcon={<FilterIcon />}
                            variant="outline"
                            size="sm"
                        >
                            Filters
                        </Button>
                    </HStack>
                </Flex>

                {/* Statistics */}
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
                    <GridItem>
                        <Card>
                            <CardBody>
                                <Stat>
                                    <StatLabel>Total Templates</StatLabel>
                                    <StatNumber>{globalStats.totalTemplates}</StatNumber>
                                    <StatHelpText>
                                        <StatArrow type="increase" />
                                        {globalStats.publicTemplates} public
                                    </StatHelpText>
                                </Stat>
                            </CardBody>
                        </Card>
                    </GridItem>

                    <GridItem>
                        <Card>
                            <CardBody>
                                <Stat>
                                    <StatLabel>Total Executions</StatLabel>
                                    <StatNumber>{globalStats.totalExecutions}</StatNumber>
                                    <StatHelpText>
                                        Success rate: {globalStats.successRate}%
                                    </StatHelpText>
                                </Stat>
                            </CardBody>
                        </Card>
                    </GridItem>

                    <GridItem>
                        <Card>
                            <CardBody>
                                <Stat>
                                    <StatLabel>Most Used</StatLabel>
                                    <StatNumber fontSize="sm">
                                        {globalStats.mostUsedTemplate?.name || 'None'}
                                    </StatNumber>
                                    <StatHelpText>
                                        {globalStats.mostUsedTemplate?.usageCount || 0} uses
                                    </StatHelpText>
                                </Stat>
                            </CardBody>
                        </Card>
                    </GridItem>

                    <GridItem>
                        <Card>
                            <CardBody>
                                <Stat>
                                    <StatLabel>Success Rate</StatLabel>
                                    <StatNumber color="green.500">{globalStats.successRate}%</StatNumber>
                                    <StatHelpText>
                                        {globalStats.successfulExecutions} successful
                                    </StatHelpText>
                                </Stat>
                            </CardBody>
                        </Card>
                    </GridItem>
                </Grid>

                {/* Search and Filters */}
                <Card>
                    <CardBody>
                        <HStack spacing={4} wrap="wrap">
                            <InputGroup maxW="300px">
                                <InputLeftElement pointerEvents="none">
                                    <SearchIcon color="gray.300" />
                                </InputLeftElement>
                                <Input
                                    placeholder="Search templates..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </InputGroup>

                            <Select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                maxW="150px"
                            >
                                <option value="all">All Categories</option>
                                <option value="social">Social</option>
                                <option value="content">Content</option>
                                <option value="navigation">Navigation</option>
                                <option value="automation">Automation</option>
                                <option value="testing">Testing</option>
                                <option value="custom">Custom</option>
                            </Select>

                            <Select
                                value={selectedDifficulty}
                                onChange={(e) => setSelectedDifficulty(e.target.value)}
                                maxW="150px"
                            >
                                <option value="all">All Levels</option>
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </Select>
                        </HStack>
                    </CardBody>
                </Card>

                {/* Templates Grid */}
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
                    {filteredTemplates.map((template) => (
                        <Card key={template.id} cursor="pointer" _hover={{ shadow: 'md' }}>
                            <CardHeader>
                                <Flex justify="space-between" align="start">
                                    <VStack align="start" spacing={1}>
                                        <Heading size="md">{template.name}</Heading>
                                        <Text fontSize="sm" color="gray.600">{template.description}</Text>
                                    </VStack>
                                    <HStack>
                                        <Badge colorScheme={getCategoryColor(template.category)} size="sm">
                                            {template.category}
                                        </Badge>
                                        <Badge colorScheme={getDifficultyColor(template.difficulty)} size="sm">
                                            {template.difficulty}
                                        </Badge>
                                    </HStack>
                                </Flex>
                            </CardHeader>
                            <CardBody>
                                <VStack spacing={3} align="stretch">
                                    <HStack wrap="wrap">
                                        {template.tags.slice(0, 3).map((tag) => (
                                            <Tag key={tag} size="sm" colorScheme="blue">
                                                <TagLabel>{tag}</TagLabel>
                                            </Tag>
                                        ))}
                                        {template.tags.length > 3 && (
                                            <Tag size="sm" colorScheme="gray">
                                                <TagLabel>+{template.tags.length - 3}</TagLabel>
                                            </Tag>
                                        )}
                                    </HStack>

                                    <HStack justify="space-between" fontSize="sm" color="gray.500">
                                        <Text>{template.actions.length} actions</Text>
                                        <Text>{template.estimatedDuration}min</Text>
                                        <Text>{template.usageCount} uses</Text>
                                    </HStack>

                                    <HStack spacing={2}>
                                        <Button
                                            size="sm"
                                            colorScheme="blue"
                                            leftIcon={<PlayIcon />}
                                            onClick={() => handleExecuteTemplate(template)}
                                            flex={1}
                                        >
                                            Execute
                                        </Button>
                                        <IconButton
                                            aria-label="View details"
                                            icon={<InfoIcon />}
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setSelectedTemplate(template);
                                                onDetailsOpen();
                                            }}
                                        />
                                        <IconButton
                                            aria-label="Duplicate template"
                                            icon={<CopyIcon />}
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDuplicateTemplate(template)}
                                        />
                                        {!template.isDefault && (
                                            <IconButton
                                                aria-label="Delete template"
                                                icon={<DeleteIcon />}
                                                size="sm"
                                                variant="outline"
                                                colorScheme="red"
                                                onClick={() => handleDeleteTemplate(template)}
                                            />
                                        )}
                                    </HStack>
                                </VStack>
                            </CardBody>
                        </Card>
                    ))}
                </Grid>

                {filteredTemplates.length === 0 && (
                    <Card>
                        <CardBody>
                            <Text color="gray.500" textAlign="center" py={8}>
                                No templates found matching your criteria.
                            </Text>
                        </CardBody>
                    </Card>
                )}
            </VStack>

            {/* Create Template Modal */}
            <Modal isOpen={isCreating} onClose={() => setIsCreating(false)} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Create New Template</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={4} align="stretch">
                            <FormControl isRequired>
                                <FormLabel>Template Name</FormLabel>
                                <Input
                                    value={newTemplate.name || ''}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                    placeholder="Enter template name..."
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Description</FormLabel>
                                <Textarea
                                    value={newTemplate.description || ''}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                                    placeholder="Enter template description..."
                                />
                            </FormControl>

                            <HStack spacing={4}>
                                <FormControl>
                                    <FormLabel>Category</FormLabel>
                                    <Select
                                        value={newTemplate.category || 'custom'}
                                        onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value as any })}
                                    >
                                        <option value="social">Social</option>
                                        <option value="content">Content</option>
                                        <option value="navigation">Navigation</option>
                                        <option value="automation">Automation</option>
                                        <option value="testing">Testing</option>
                                        <option value="custom">Custom</option>
                                    </Select>
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Difficulty</FormLabel>
                                    <Select
                                        value={newTemplate.difficulty || 'beginner'}
                                        onChange={(e) => setNewTemplate({ ...newTemplate, difficulty: e.target.value as any })}
                                    >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </Select>
                                </FormControl>
                            </HStack>

                            <FormControl>
                                <FormLabel>Estimated Duration (minutes)</FormLabel>
                                <NumberInput
                                    value={newTemplate.estimatedDuration || 5}
                                    onChange={(valueString) => setNewTemplate({ ...newTemplate, estimatedDuration: parseInt(valueString) || 5 })}
                                    min={1}
                                    max={120}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            <FormControl>
                                <FormLabel>Tags</FormLabel>
                                <Input
                                    placeholder="Enter tags separated by commas..."
                                    onChange={(e) => {
                                        const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                                        setNewTemplate({ ...newTemplate, tags });
                                    }}
                                />
                            </FormControl>

                            <FormControl display="flex" alignItems="center">
                                <FormLabel htmlFor="is-public" mb="0">
                                    Make Public
                                </FormLabel>
                                <Switch
                                    id="is-public"
                                    isChecked={newTemplate.isPublic || false}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, isPublic: e.target.checked })}
                                />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={() => setIsCreating(false)}>
                            Cancel
                        </Button>
                        <Button colorScheme="blue" onClick={handleCreateTemplate}>
                            Create Template
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Execute Template Modal */}
            <Modal isOpen={isExecutionOpen} onClose={onExecutionClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Execute Template: {selectedTemplate?.name}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        {selectedTemplate && (
                            <VStack spacing={4} align="stretch">
                                <Text color="gray.600">{selectedTemplate.description}</Text>

                                {selectedTemplate.variables.length > 0 && (
                                    <Box>
                                        <Text fontWeight="semibold" mb={3}>Template Variables</Text>
                                        {selectedTemplate.variables.map((variable) => (
                                            <FormControl key={variable.id} mb={3}>
                                                <FormLabel>
                                                    {variable.name}
                                                    {variable.required && <Text as="span" color="red.500"> *</Text>}
                                                </FormLabel>
                                                <Text fontSize="sm" color="gray.500" mb={2}>{variable.description}</Text>

                                                {variable.type === 'string' && (
                                                    <Input
                                                        value={executionVariables[variable.id] || variable.defaultValue || ''}
                                                        onChange={(e) => setExecutionVariables({
                                                            ...executionVariables,
                                                            [variable.id]: e.target.value
                                                        })}
                                                        placeholder={`Enter ${variable.name.toLowerCase()}...`}
                                                    />
                                                )}

                                                {variable.type === 'number' && (
                                                    <NumberInput
                                                        value={executionVariables[variable.id] || variable.defaultValue || 0}
                                                        onChange={(valueString) => setExecutionVariables({
                                                            ...executionVariables,
                                                            [variable.id]: parseInt(valueString) || 0
                                                        })}
                                                        min={variable.validation?.min}
                                                        max={variable.validation?.max}
                                                    >
                                                        <NumberInputField />
                                                        <NumberInputStepper>
                                                            <NumberIncrementStepper />
                                                            <NumberDecrementStepper />
                                                        </NumberInputStepper>
                                                    </NumberInput>
                                                )}

                                                {variable.type === 'boolean' && (
                                                    <Switch
                                                        isChecked={executionVariables[variable.id] ?? variable.defaultValue ?? false}
                                                        onChange={(e) => setExecutionVariables({
                                                            ...executionVariables,
                                                            [variable.id]: e.target.checked
                                                        })}
                                                    />
                                                )}

                                                {variable.type === 'select' && (
                                                    <Select
                                                        value={executionVariables[variable.id] || variable.defaultValue || ''}
                                                        onChange={(e) => setExecutionVariables({
                                                            ...executionVariables,
                                                            [variable.id]: e.target.value
                                                        })}
                                                    >
                                                        {variable.options?.map((option) => (
                                                            <option key={option} value={option}>{option}</option>
                                                        ))}
                                                    </Select>
                                                )}
                                            </FormControl>
                                        ))}
                                    </Box>
                                )}

                                <Box>
                                    <Text fontWeight="semibold" mb={3}>Template Actions</Text>
                                    <List spacing={2}>
                                        {selectedTemplate.actions.map((action, index) => (
                                            <ListItem key={action.id}>
                                                <HStack>
                                                    <Text fontSize="sm" fontWeight="medium">{index + 1}.</Text>
                                                    <Text fontSize="sm">{action.name}</Text>
                                                    <Badge size="sm" colorScheme="blue">
                                                        {action.actionType.replace('create', '').replace('Action', '')}
                                                    </Badge>
                                                </HStack>
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            </VStack>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onExecutionClose}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="blue"
                            onClick={handleStartExecution}
                            isLoading={isExecuting}
                            loadingText="Executing..."
                        >
                            Execute Template
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Template Details Drawer */}
            <Drawer isOpen={isDetailsOpen} onClose={onDetailsClose} size="lg">
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerCloseButton />
                        {selectedTemplate?.name}
                    </DrawerHeader>
                    <DrawerBody>
                        {selectedTemplate && (
                            <VStack spacing={4} align="stretch">
                                <Text color="gray.600">{selectedTemplate.description}</Text>

                                <HStack wrap="wrap">
                                    {selectedTemplate.tags.map((tag) => (
                                        <Tag key={tag} colorScheme="blue">
                                            <TagLabel>{tag}</TagLabel>
                                        </Tag>
                                    ))}
                                </HStack>

                                <HStack justify="space-between">
                                    <Badge colorScheme={getCategoryColor(selectedTemplate.category)}>
                                        {selectedTemplate.category}
                                    </Badge>
                                    <Badge colorScheme={getDifficultyColor(selectedTemplate.difficulty)}>
                                        {selectedTemplate.difficulty}
                                    </Badge>
                                    <Text fontSize="sm" color="gray.500">
                                        {selectedTemplate.estimatedDuration} minutes
                                    </Text>
                                </HStack>

                                <Divider />

                                <Box>
                                    <Text fontWeight="semibold" mb={3}>Actions ({selectedTemplate.actions.length})</Text>
                                    <Accordion allowToggle>
                                        {selectedTemplate.actions.map((action, index) => (
                                            <AccordionItem key={action.id}>
                                                <h2>
                                                    <AccordionButton>
                                                        <Box flex="1" textAlign="left">
                                                            <HStack>
                                                                <Text fontSize="sm" fontWeight="medium">{index + 1}.</Text>
                                                                <Text fontSize="sm">{action.name}</Text>
                                                                <Badge size="sm" colorScheme="blue">
                                                                    {action.actionType.replace('create', '').replace('Action', '')}
                                                                </Badge>
                                                            </HStack>
                                                        </Box>
                                                        <AccordionIcon />
                                                    </AccordionButton>
                                                </h2>
                                                <AccordionPanel pb={4}>
                                                    <VStack align="stretch" spacing={2}>
                                                        {action.description && (
                                                            <Text fontSize="sm" color="gray.600">{action.description}</Text>
                                                        )}
                                                        <HStack fontSize="xs" color="gray.500">
                                                            <Text>Order: {action.order}</Text>
                                                            <Text>Required: {action.required ? 'Yes' : 'No'}</Text>
                                                            {action.settings.delay && (
                                                                <Text>Delay: {action.settings.delay}ms</Text>
                                                            )}
                                                        </HStack>
                                                    </VStack>
                                                </AccordionPanel>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </Box>

                                {selectedTemplate.variables.length > 0 && (
                                    <Box>
                                        <Text fontWeight="semibold" mb={3}>Variables ({selectedTemplate.variables.length})</Text>
                                        <VStack align="stretch" spacing={2}>
                                            {selectedTemplate.variables.map((variable) => (
                                                <Box key={variable.id} p={3} bg="gray.50" borderRadius="md">
                                                    <HStack justify="space-between" mb={1}>
                                                        <Text fontSize="sm" fontWeight="medium">{variable.name}</Text>
                                                        <Badge size="sm" colorScheme="purple">{variable.type}</Badge>
                                                    </HStack>
                                                    <Text fontSize="xs" color="gray.600" mb={2}>{variable.description}</Text>
                                                    <Text fontSize="xs" color="gray.500">
                                                        Default: {String(variable.defaultValue)} | Required: {variable.required ? 'Yes' : 'No'}
                                                    </Text>
                                                </Box>
                                            ))}
                                        </VStack>
                                    </Box>
                                )}
                            </VStack>
                        )}
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </Box>
    );
};

export default TemplateDashboard;
