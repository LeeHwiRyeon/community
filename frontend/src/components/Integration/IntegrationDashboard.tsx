import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Card,
    CardBody,
    CardHeader,
    SimpleGrid,
    Progress,
    Badge,
    Divider,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    useToast,
    Spinner,
    Alert,
    AlertIcon,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    Flex,
    Spacer,
    IconButton,
    Tooltip,
    useColorModeValue,
    Select,
    Input,
    InputGroup,
    InputLeftElement,
    Textarea,
    Switch,
    FormControl,
    FormLabel,
    FormHelperText,
    Code,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    List,
    ListItem,
    ListIcon,
    OrderedList,
    UnorderedList
} from '@chakra-ui/react';
import {
    LinkIcon,
    SettingsIcon,
    ViewIcon,
    RefreshIcon,
    CheckIcon,
    CloseIcon,
    WarningIcon,
    InfoIcon,
    TimeIcon,
    ExternalLinkIcon,
    DownloadIcon,
    UploadIcon,
    ChatIcon,
    CodeIcon,
    AnalyticsIcon,
    CreditCardIcon,
    EmailIcon,
    StorageIcon,
    BrainIcon,
    WebhookIcon,
    SyncIcon,
    TestIcon
} from '@chakra-ui/icons';

interface Integration {
    id: string;
    name: string;
    type: string;
    status: 'active' | 'inactive' | 'error';
    config: Record<string, any>;
    capabilities: string[];
    lastSync: string | null;
    syncFrequency: number;
}

interface Webhook {
    id: string;
    integrationId: string;
    eventType: string;
    callbackUrl: string;
    status: 'active' | 'inactive';
    createdAt: string;
    lastTriggered: string | null;
    triggerCount: number;
}

interface SyncJob {
    id: string;
    integrationId: string;
    syncType: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
    error: string | null;
    progress: number;
}

const IntegrationDashboard: React.FC = () => {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState(0);

    const { isOpen: isTestModalOpen, onOpen: onTestModalOpen, onClose: onTestModalClose } = useDisclosure();
    const { isOpen: isWebhookModalOpen, onOpen: onWebhookModalOpen, onClose: onWebhookModalClose } = useDisclosure();
    const { isOpen: isSyncModalOpen, onOpen: onSyncModalOpen, onClose: onSyncModalClose } = useDisclosure();

    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
    const [testData, setTestData] = useState<any>({});
    const [webhookData, setWebhookData] = useState({
        integrationId: '',
        eventType: '',
        callbackUrl: '',
        secret: ''
    });
    const [syncData, setSyncData] = useState({
        integrationId: '',
        syncType: '',
        config: {}
    });

    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // 데이터 로드
    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // 통합 서비스 목록 로드
            const integrationsResponse = await fetch('/api/integration/services');
            const integrationsData = await integrationsResponse.json();
            if (integrationsData.success) {
                setIntegrations(integrationsData.data);
            }

            // 웹훅 목록 로드
            const webhooksResponse = await fetch('/api/integration/webhooks');
            const webhooksData = await webhooksResponse.json();
            if (webhooksData.success) {
                setWebhooks(webhooksData.data);
            }

            // 동기화 작업 목록 로드
            const syncJobsResponse = await fetch('/api/integration/sync/jobs');
            const syncJobsData = await syncJobsResponse.json();
            if (syncJobsData.success) {
                setSyncJobs(syncJobsData.data);
            }

            // 통계 로드
            const statsResponse = await fetch('/api/integration/stats');
            const statsData = await statsResponse.json();
            if (statsData.success) {
                setStats(statsData.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('데이터를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 통합 서비스 상태 업데이트
    const updateIntegrationStatus = async (integrationId: string, status: string) => {
        try {
            const response = await fetch(`/api/integration/services/${integrationId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: '상태 업데이트 완료',
                    description: '통합 서비스 상태가 업데이트되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                fetchData(); // 데이터 새로고침
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error updating integration status:', error);
            toast({
                title: '상태 업데이트 실패',
                description: error.message || '상태 업데이트 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 통합 서비스 테스트
    const testIntegration = async (integration: Integration) => {
        try {
            setSelectedIntegration(integration);
            setTestData({});
            onTestModalOpen();
        } catch (error) {
            console.error('Error testing integration:', error);
        }
    };

    // 실제 테스트 실행
    const executeTest = async () => {
        if (!selectedIntegration) return;

        try {
            const response = await fetch(`/api/integration/services/${selectedIntegration.id}/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    testType: 'basic',
                    testData: testData
                })
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: '테스트 성공',
                    description: '통합 서비스 테스트가 성공적으로 완료되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error executing test:', error);
            toast({
                title: '테스트 실패',
                description: error.message || '테스트 실행 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        } finally {
            onTestModalClose();
        }
    };

    // 웹훅 등록
    const registerWebhook = async () => {
        try {
            const response = await fetch('/api/integration/webhooks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(webhookData)
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: '웹훅 등록 완료',
                    description: '웹훅이 성공적으로 등록되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                fetchData(); // 데이터 새로고침
                onWebhookModalClose();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error registering webhook:', error);
            toast({
                title: '웹훅 등록 실패',
                description: error.message || '웹훅 등록 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 동기화 작업 생성
    const createSyncJob = async () => {
        try {
            const response = await fetch('/api/integration/sync/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(syncData)
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: '동기화 작업 생성 완료',
                    description: '동기화 작업이 성공적으로 생성되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                fetchData(); // 데이터 새로고침
                onSyncModalClose();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error creating sync job:', error);
            toast({
                title: '동기화 작업 생성 실패',
                description: error.message || '동기화 작업 생성 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        fetchData();
    }, []);

    // 상태 색상
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'green';
            case 'inactive': return 'gray';
            case 'error': return 'red';
            case 'running': return 'blue';
            case 'completed': return 'green';
            case 'failed': return 'red';
            case 'pending': return 'yellow';
            default: return 'gray';
        }
    };

    // 타입 아이콘
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'chat': return <ChatIcon />;
            case 'development': return <CodeIcon />;
            case 'analytics': return <AnalyticsIcon />;
            case 'payment': return <CreditCardIcon />;
            case 'email': return <EmailIcon />;
            case 'storage': return <StorageIcon />;
            case 'ai': return <BrainIcon />;
            default: return <LinkIcon />;
        }
    };

    if (isLoading && !integrations.length) {
        return (
            <Box p={8} textAlign="center">
                <Spinner size="xl" />
                <Text mt={4}>통합 서비스 데이터를 불러오는 중...</Text>
            </Box>
        );
    }

    return (
        <Box p={6}>
            {/* Header */}
            <VStack spacing={4} align="stretch" mb={8}>
                <HStack justify="space-between">
                    <Text fontSize="3xl" fontWeight="bold" color="purple.600">
                        🔗 통합 서비스 관리
                    </Text>
                    <HStack spacing={2}>
                        <Button leftIcon={<RefreshIcon />} colorScheme="purple" variant="outline" onClick={fetchData}>
                            새로고침
                        </Button>
                        <Button leftIcon={<WebhookIcon />} colorScheme="purple" variant="outline" onClick={onWebhookModalOpen}>
                            웹훅 등록
                        </Button>
                        <Button leftIcon={<SyncIcon />} colorScheme="purple" variant="outline" onClick={onSyncModalOpen}>
                            동기화 작업
                        </Button>
                    </HStack>
                </HStack>

                {/* 통계 카드 */}
                {stats && (
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>총 통합 서비스</StatLabel>
                                    <StatNumber color="purple.500">{stats.totalIntegrations}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>활성 서비스</StatLabel>
                                    <StatNumber color="green.500">{stats.activeIntegrations}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>웹훅</StatLabel>
                                    <StatNumber color="blue.500">{stats.totalWebhooks}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody textAlign="center">
                                <Stat>
                                    <StatLabel>동기화 작업</StatLabel>
                                    <StatNumber color="orange.500">{stats.totalSyncJobs}</StatNumber>
                                </Stat>
                            </CardBody>
                        </Card>
                    </SimpleGrid>
                )}
            </VStack>

            {/* Error Alert */}
            {error && (
                <Alert status="error" mb={4}>
                    <AlertIcon />
                    {error}
                </Alert>
            )}

            {/* 탭 네비게이션 */}
            <Tabs index={selectedTab} onChange={setSelectedTab}>
                <TabList>
                    <Tab>통합 서비스</Tab>
                    <Tab>웹훅</Tab>
                    <Tab>동기화 작업</Tab>
                    <Tab>이벤트 로그</Tab>
                </TabList>

                <TabPanels>
                    {/* 통합 서비스 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                            {integrations.map(integration => (
                                <Card key={integration.id} bg={bgColor} borderColor={borderColor}>
                                    <CardHeader>
                                        <HStack justify="space-between">
                                            <HStack spacing={3}>
                                                {getTypeIcon(integration.type)}
                                                <VStack align="start" spacing={0}>
                                                    <Text fontWeight="bold" fontSize="lg">
                                                        {integration.name}
                                                    </Text>
                                                    <Text fontSize="sm" color="gray.600">
                                                        {integration.type}
                                                    </Text>
                                                </VStack>
                                            </HStack>
                                            <Badge colorScheme={getStatusColor(integration.status)} size="sm">
                                                {integration.status.toUpperCase()}
                                            </Badge>
                                        </HStack>
                                    </CardHeader>
                                    <CardBody>
                                        <VStack spacing={4} align="stretch">
                                            <Box>
                                                <Text fontWeight="medium" mb={2}>기능</Text>
                                                <Wrap>
                                                    {integration.capabilities.map(capability => (
                                                        <WrapItem key={capability}>
                                                            <Badge size="sm" colorScheme="blue">
                                                                {capability}
                                                            </Badge>
                                                        </WrapItem>
                                                    ))}
                                                </Wrap>
                                            </Box>

                                            {integration.lastSync && (
                                                <Box>
                                                    <Text fontSize="sm" color="gray.600">
                                                        마지막 동기화: {new Date(integration.lastSync).toLocaleString('ko-KR')}
                                                    </Text>
                                                </Box>
                                            )}

                                            <HStack spacing={2}>
                                                <Button
                                                    size="sm"
                                                    colorScheme="blue"
                                                    variant="outline"
                                                    onClick={() => testIntegration(integration)}
                                                >
                                                    테스트
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    colorScheme={integration.status === 'active' ? 'red' : 'green'}
                                                    variant="outline"
                                                    onClick={() => updateIntegrationStatus(
                                                        integration.id,
                                                        integration.status === 'active' ? 'inactive' : 'active'
                                                    )}
                                                >
                                                    {integration.status === 'active' ? '비활성화' : '활성화'}
                                                </Button>
                                            </HStack>
                                        </VStack>
                                    </CardBody>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </TabPanel>

                    {/* 웹훅 탭 */}
                    <TabPanel p={0}>
                        <Card>
                            <CardHeader>
                                <HStack justify="space-between">
                                    <Text fontSize="lg" fontWeight="bold">웹훅 목록</Text>
                                    <Button leftIcon={<WebhookIcon />} colorScheme="purple" onClick={onWebhookModalOpen}>
                                        웹훅 등록
                                    </Button>
                                </HStack>
                            </CardHeader>
                            <CardBody>
                                <Table>
                                    <Thead>
                                        <Tr>
                                            <Th>ID</Th>
                                            <Th>통합 서비스</Th>
                                            <Th>이벤트 타입</Th>
                                            <Th>콜백 URL</Th>
                                            <Th>상태</Th>
                                            <Th>트리거 수</Th>
                                            <Th>마지막 트리거</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {webhooks.map(webhook => (
                                            <Tr key={webhook.id}>
                                                <Td>
                                                    <Code fontSize="sm">{webhook.id}</Code>
                                                </Td>
                                                <Td>{webhook.integrationId}</Td>
                                                <Td>{webhook.eventType}</Td>
                                                <Td>
                                                    <Text fontSize="sm" maxW="200px" isTruncated>
                                                        {webhook.callbackUrl}
                                                    </Text>
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme={getStatusColor(webhook.status)} size="sm">
                                                        {webhook.status.toUpperCase()}
                                                    </Badge>
                                                </Td>
                                                <Td>{webhook.triggerCount}</Td>
                                                <Td>
                                                    {webhook.lastTriggered ?
                                                        new Date(webhook.lastTriggered).toLocaleString('ko-KR') :
                                                        '없음'
                                                    }
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </TabPanel>

                    {/* 동기화 작업 탭 */}
                    <TabPanel p={0}>
                        <Card>
                            <CardHeader>
                                <HStack justify="space-between">
                                    <Text fontSize="lg" fontWeight="bold">동기화 작업</Text>
                                    <Button leftIcon={<SyncIcon />} colorScheme="purple" onClick={onSyncModalOpen}>
                                        작업 생성
                                    </Button>
                                </HStack>
                            </CardHeader>
                            <CardBody>
                                <Table>
                                    <Thead>
                                        <Tr>
                                            <Th>ID</Th>
                                            <Th>통합 서비스</Th>
                                            <Th>동기화 타입</Th>
                                            <Th>상태</Th>
                                            <Th>진행률</Th>
                                            <Th>생성 시간</Th>
                                            <Th>완료 시간</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {syncJobs.map(job => (
                                            <Tr key={job.id}>
                                                <Td>
                                                    <Code fontSize="sm">{job.id}</Code>
                                                </Td>
                                                <Td>{job.integrationId}</Td>
                                                <Td>{job.syncType}</Td>
                                                <Td>
                                                    <Badge colorScheme={getStatusColor(job.status)} size="sm">
                                                        {job.status.toUpperCase()}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <HStack spacing={2}>
                                                        <Progress value={job.progress} size="sm" w="100px" />
                                                        <Text fontSize="sm">{job.progress}%</Text>
                                                    </HStack>
                                                </Td>
                                                <Td>
                                                    {new Date(job.createdAt).toLocaleString('ko-KR')}
                                                </Td>
                                                <Td>
                                                    {job.completedAt ?
                                                        new Date(job.completedAt).toLocaleString('ko-KR') :
                                                        '-'
                                                    }
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </TabPanel>

                    {/* 이벤트 로그 탭 */}
                    <TabPanel p={0}>
                        <Card>
                            <CardHeader>
                                <Text fontSize="lg" fontWeight="bold">이벤트 로그</Text>
                            </CardHeader>
                            <CardBody>
                                <Text color="gray.500">이벤트 로그 기능은 개발 중입니다.</Text>
                            </CardBody>
                        </Card>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            {/* 테스트 모달 */}
            <Modal isOpen={isTestModalOpen} onClose={onTestModalClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        {selectedIntegration?.name} 테스트
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <Text>통합 서비스를 테스트합니다.</Text>

                            {selectedIntegration?.id === 'discord' && (
                                <VStack spacing={4} align="stretch">
                                    <FormControl>
                                        <FormLabel>채널 ID</FormLabel>
                                        <Input
                                            value={testData.channelId || ''}
                                            onChange={(e) => setTestData(prev => ({ ...prev, channelId: e.target.value }))}
                                            placeholder="채널 ID를 입력하세요"
                                        />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel>메시지</FormLabel>
                                        <Textarea
                                            value={testData.message || ''}
                                            onChange={(e) => setTestData(prev => ({ ...prev, message: e.target.value }))}
                                            placeholder="테스트 메시지를 입력하세요"
                                        />
                                    </FormControl>
                                </VStack>
                            )}

                            {selectedIntegration?.id === 'slack' && (
                                <VStack spacing={4} align="stretch">
                                    <FormControl>
                                        <FormLabel>채널</FormLabel>
                                        <Input
                                            value={testData.channel || ''}
                                            onChange={(e) => setTestData(prev => ({ ...prev, channel: e.target.value }))}
                                            placeholder="채널명을 입력하세요"
                                        />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel>메시지</FormLabel>
                                        <Textarea
                                            value={testData.message || ''}
                                            onChange={(e) => setTestData(prev => ({ ...prev, message: e.target.value }))}
                                            placeholder="테스트 메시지를 입력하세요"
                                        />
                                    </FormControl>
                                </VStack>
                            )}

                            {selectedIntegration?.id === 'openai' && (
                                <VStack spacing={4} align="stretch">
                                    <FormControl>
                                        <FormLabel>프롬프트</FormLabel>
                                        <Textarea
                                            value={testData.prompt || ''}
                                            onChange={(e) => setTestData(prev => ({ ...prev, prompt: e.target.value }))}
                                            placeholder="테스트 프롬프트를 입력하세요"
                                        />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel>최대 토큰 수</FormLabel>
                                        <Input
                                            type="number"
                                            value={testData.maxTokens || 100}
                                            onChange={(e) => setTestData(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                                        />
                                    </FormControl>
                                </VStack>
                            )}

                            <HStack spacing={2}>
                                <Button colorScheme="purple" flex="1" onClick={executeTest}>
                                    테스트 실행
                                </Button>
                                <Button variant="outline" flex="1" onClick={onTestModalClose}>
                                    취소
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 웹훅 등록 모달 */}
            <Modal isOpen={isWebhookModalOpen} onClose={onWebhookModalClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>웹훅 등록</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <FormControl>
                                <FormLabel>통합 서비스</FormLabel>
                                <Select
                                    value={webhookData.integrationId}
                                    onChange={(e) => setWebhookData(prev => ({ ...prev, integrationId: e.target.value }))}
                                >
                                    <option value="">선택하세요</option>
                                    {integrations.map(integration => (
                                        <option key={integration.id} value={integration.id}>
                                            {integration.name}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel>이벤트 타입</FormLabel>
                                <Input
                                    value={webhookData.eventType}
                                    onChange={(e) => setWebhookData(prev => ({ ...prev, eventType: e.target.value }))}
                                    placeholder="이벤트 타입을 입력하세요"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>콜백 URL</FormLabel>
                                <Input
                                    value={webhookData.callbackUrl}
                                    onChange={(e) => setWebhookData(prev => ({ ...prev, callbackUrl: e.target.value }))}
                                    placeholder="콜백 URL을 입력하세요"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>시크릿 (선택사항)</FormLabel>
                                <Input
                                    value={webhookData.secret}
                                    onChange={(e) => setWebhookData(prev => ({ ...prev, secret: e.target.value }))}
                                    placeholder="웹훅 시크릿을 입력하세요"
                                />
                            </FormControl>

                            <HStack spacing={2}>
                                <Button colorScheme="purple" flex="1" onClick={registerWebhook}>
                                    등록
                                </Button>
                                <Button variant="outline" flex="1" onClick={onWebhookModalClose}>
                                    취소
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 동기화 작업 생성 모달 */}
            <Modal isOpen={isSyncModalOpen} onClose={onSyncModalClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>동기화 작업 생성</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <FormControl>
                                <FormLabel>통합 서비스</FormLabel>
                                <Select
                                    value={syncData.integrationId}
                                    onChange={(e) => setSyncData(prev => ({ ...prev, integrationId: e.target.value }))}
                                >
                                    <option value="">선택하세요</option>
                                    {integrations.map(integration => (
                                        <option key={integration.id} value={integration.id}>
                                            {integration.name}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel>동기화 타입</FormLabel>
                                <Select
                                    value={syncData.syncType}
                                    onChange={(e) => setSyncData(prev => ({ ...prev, syncType: e.target.value }))}
                                >
                                    <option value="">선택하세요</option>
                                    <option value="users">사용자</option>
                                    <option value="content">콘텐츠</option>
                                    <option value="analytics">분석 데이터</option>
                                    <option value="payments">결제 데이터</option>
                                </Select>
                            </FormControl>

                            <HStack spacing={2}>
                                <Button colorScheme="purple" flex="1" onClick={createSyncJob}>
                                    생성
                                </Button>
                                <Button variant="outline" flex="1" onClick={onSyncModalClose}>
                                    취소
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default IntegrationDashboard;

