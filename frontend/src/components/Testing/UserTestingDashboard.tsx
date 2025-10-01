import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    Progress,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    Select,
    Checkbox,
    CheckboxGroup,
    Divider,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Card,
    CardHeader,
    CardBody,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    useToast
} from '@chakra-ui/react';
import { ChevronDownIcon, AddIcon, EditIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';

interface TestSession {
    id: string;
    title: string;
    description: string;
    type: 'usability' | 'accessibility' | 'performance' | 'security' | 'compatibility';
    status: 'draft' | 'active' | 'completed' | 'cancelled';
    participants: number;
    targetUsers: string[];
    tasks: TestTask[];
    metrics: TestMetrics;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}

interface TestTask {
    id: string;
    title: string;
    description: string;
    steps: string[];
    expectedOutcome: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
}

interface TestMetrics {
    completionRate: number;
    averageTime: number;
    errorRate: number;
    satisfactionScore: number;
    accessibilityScore: number;
    performanceScore: number;
}

interface TestResult {
    id: string;
    sessionId: string;
    participantId: string;
    participantName: string;
    taskId: string;
    taskTitle: string;
    completed: boolean;
    timeSpent: number;
    errors: number;
    satisfaction: number;
    comments: string;
    screenshots: string[];
    recordings: string[];
    createdAt: string;
}

const UserTestingDashboard: React.FC = () => {
    const [testSessions, setTestSessions] = useState<TestSession[]>([]);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [selectedSession, setSelectedSession] = useState<TestSession | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSession, setEditingSession] = useState<TestSession | null>(null);
    const toast = useToast();

    useEffect(() => {
        loadTestSessions();
        loadTestResults();
    }, []);

    const loadTestSessions = async () => {
        try {
            const response = await fetch('/api/testing/sessions');
            const data = await response.json();
            setTestSessions(data);
        } catch (error) {
            console.error('Failed to load test sessions:', error);
        }
    };

    const loadTestResults = async () => {
        try {
            const response = await fetch('/api/testing/results');
            const data = await response.json();
            setTestResults(data);
        } catch (error) {
            console.error('Failed to load test results:', error);
        }
    };

    const handleCreateSession = async (sessionData: Partial<TestSession>) => {
        try {
            const response = await fetch('/api/testing/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sessionData)
            });

            if (response.ok) {
                toast({
                    title: '테스트 세션이 생성되었습니다!',
                    status: 'success',
                    duration: 3000
                });
                loadTestSessions();
                setIsCreateModalOpen(false);
            }
        } catch (error) {
            toast({
                title: '테스트 세션 생성 실패',
                status: 'error',
                duration: 3000
            });
        }
    };

    const handleUpdateSession = async (sessionId: string, sessionData: Partial<TestSession>) => {
        try {
            const response = await fetch(`/api/testing/sessions/${sessionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sessionData)
            });

            if (response.ok) {
                toast({
                    title: '테스트 세션이 업데이트되었습니다!',
                    status: 'success',
                    duration: 3000
                });
                loadTestSessions();
                setIsEditModalOpen(false);
            }
        } catch (error) {
            toast({
                title: '테스트 세션 업데이트 실패',
                status: 'error',
                duration: 3000
            });
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        try {
            const response = await fetch(`/api/testing/sessions/${sessionId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                toast({
                    title: '테스트 세션이 삭제되었습니다!',
                    status: 'success',
                    duration: 3000
                });
                loadTestSessions();
            }
        } catch (error) {
            toast({
                title: '테스트 세션 삭제 실패',
                status: 'error',
                duration: 3000
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'gray';
            case 'active': return 'green';
            case 'completed': return 'blue';
            case 'cancelled': return 'red';
            default: return 'gray';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'usability': return 'purple';
            case 'accessibility': return 'orange';
            case 'performance': return 'blue';
            case 'security': return 'red';
            case 'compatibility': return 'green';
            default: return 'gray';
        }
    };

    const calculateOverallMetrics = () => {
        const totalSessions = testSessions.length;
        const activeSessions = testSessions.filter(s => s.status === 'active').length;
        const completedSessions = testSessions.filter(s => s.status === 'completed').length;
        const totalParticipants = testSessions.reduce((sum, s) => sum + s.participants, 0);
        const averageCompletionRate = testSessions.length > 0
            ? testSessions.reduce((sum, s) => sum + s.metrics.completionRate, 0) / testSessions.length
            : 0;

        return {
            totalSessions,
            activeSessions,
            completedSessions,
            totalParticipants,
            averageCompletionRate
        };
    };

    const metrics = calculateOverallMetrics();

    return (
        <Box p={6}>
            <VStack spacing={6} align="stretch">
                {/* Header */}
                <HStack justify="space-between">
                    <Text fontSize="2xl" fontWeight="bold">사용자 테스트 관리</Text>
                    <Button
                        leftIcon={<AddIcon />}
                        colorScheme="blue"
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        새 테스트 세션
                    </Button>
                </HStack>

                {/* Metrics Cards */}
                <HStack spacing={4}>
                    <Card flex={1}>
                        <CardBody>
                            <Stat>
                                <StatLabel>총 테스트 세션</StatLabel>
                                <StatNumber>{metrics.totalSessions}</StatNumber>
                                <StatHelpText>
                                    <StatArrow type="increase" />
                                    활성: {metrics.activeSessions}
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>

                    <Card flex={1}>
                        <CardBody>
                            <Stat>
                                <StatLabel>완료된 세션</StatLabel>
                                <StatNumber>{metrics.completedSessions}</StatNumber>
                                <StatHelpText>
                                    완료율: {((metrics.completedSessions / metrics.totalSessions) * 100).toFixed(1)}%
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>

                    <Card flex={1}>
                        <CardBody>
                            <Stat>
                                <StatLabel>총 참가자</StatLabel>
                                <StatNumber>{metrics.totalParticipants}</StatNumber>
                                <StatHelpText>
                                    평균 완료율: {metrics.averageCompletionRate.toFixed(1)}%
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                </HStack>

                {/* Tabs */}
                <Tabs>
                    <TabList>
                        <Tab>테스트 세션</Tab>
                        <Tab>테스트 결과</Tab>
                        <Tab>분석 리포트</Tab>
                    </TabList>

                    <TabPanels>
                        {/* Test Sessions Tab */}
                        <TabPanel>
                            <Table variant="simple">
                                <Thead>
                                    <Tr>
                                        <Th>제목</Th>
                                        <Th>유형</Th>
                                        <Th>상태</Th>
                                        <Th>참가자</Th>
                                        <Th>완료율</Th>
                                        <Th>생성일</Th>
                                        <Th>액션</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {testSessions.map((session) => (
                                        <Tr key={session.id}>
                                            <Td>
                                                <VStack align="start" spacing={1}>
                                                    <Text fontWeight="medium">{session.title}</Text>
                                                    <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                                        {session.description}
                                                    </Text>
                                                </VStack>
                                            </Td>
                                            <Td>
                                                <Badge colorScheme={getTypeColor(session.type)}>
                                                    {session.type}
                                                </Badge>
                                            </Td>
                                            <Td>
                                                <Badge colorScheme={getStatusColor(session.status)}>
                                                    {session.status}
                                                </Badge>
                                            </Td>
                                            <Td>{session.participants}</Td>
                                            <Td>
                                                <VStack align="start" spacing={1}>
                                                    <Text fontSize="sm">{session.metrics.completionRate}%</Text>
                                                    <Progress
                                                        value={session.metrics.completionRate}
                                                        size="sm"
                                                        colorScheme="blue"
                                                        width="60px"
                                                    />
                                                </VStack>
                                            </Td>
                                            <Td fontSize="sm">
                                                {new Date(session.createdAt).toLocaleDateString()}
                                            </Td>
                                            <Td>
                                                <Menu>
                                                    <MenuButton as={IconButton} icon={<ChevronDownIcon />} size="sm" />
                                                    <MenuList>
                                                        <MenuItem icon={<ViewIcon />} onClick={() => setSelectedSession(session)}>
                                                            상세보기
                                                        </MenuItem>
                                                        <MenuItem icon={<EditIcon />} onClick={() => {
                                                            setEditingSession(session);
                                                            setIsEditModalOpen(true);
                                                        }}>
                                                            편집
                                                        </MenuItem>
                                                        <MenuItem icon={<DeleteIcon />} onClick={() => handleDeleteSession(session.id)}>
                                                            삭제
                                                        </MenuItem>
                                                    </MenuList>
                                                </Menu>
                                            </Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </TabPanel>

                        {/* Test Results Tab */}
                        <TabPanel>
                            <Table variant="simple">
                                <Thead>
                                    <Tr>
                                        <Th>참가자</Th>
                                        <Th>태스크</Th>
                                        <Th>완료</Th>
                                        <Th>소요시간</Th>
                                        <Th>오류</Th>
                                        <Th>만족도</Th>
                                        <Th>날짜</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {testResults.map((result) => (
                                        <Tr key={result.id}>
                                            <Td>{result.participantName}</Td>
                                            <Td>{result.taskTitle}</Td>
                                            <Td>
                                                <Badge colorScheme={result.completed ? 'green' : 'red'}>
                                                    {result.completed ? '완료' : '미완료'}
                                                </Badge>
                                            </Td>
                                            <Td>{result.timeSpent}초</Td>
                                            <Td>{result.errors}</Td>
                                            <Td>
                                                <HStack>
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Text key={i} color={i < result.satisfaction ? 'yellow.400' : 'gray.300'}>
                                                            ★
                                                        </Text>
                                                    ))}
                                                </HStack>
                                            </Td>
                                            <Td fontSize="sm">
                                                {new Date(result.createdAt).toLocaleDateString()}
                                            </Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </TabPanel>

                        {/* Analysis Report Tab */}
                        <TabPanel>
                            <VStack spacing={4} align="stretch">
                                <Text fontSize="lg" fontWeight="bold">테스트 분석 리포트</Text>

                                <Card>
                                    <CardHeader>
                                        <Text fontWeight="bold">완료율 분석</Text>
                                    </CardHeader>
                                    <CardBody>
                                        <VStack spacing={2}>
                                            {testSessions.map((session) => (
                                                <HStack key={session.id} width="100%" justify="space-between">
                                                    <Text fontSize="sm">{session.title}</Text>
                                                    <HStack>
                                                        <Text fontSize="sm">{session.metrics.completionRate}%</Text>
                                                        <Progress
                                                            value={session.metrics.completionRate}
                                                            size="sm"
                                                            colorScheme="blue"
                                                            width="100px"
                                                        />
                                                    </HStack>
                                                </HStack>
                                            ))}
                                        </VStack>
                                    </CardBody>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <Text fontWeight="bold">만족도 분석</Text>
                                    </CardHeader>
                                    <CardBody>
                                        <VStack spacing={2}>
                                            {testSessions.map((session) => (
                                                <HStack key={session.id} width="100%" justify="space-between">
                                                    <Text fontSize="sm">{session.title}</Text>
                                                    <HStack>
                                                        <Text fontSize="sm">{session.metrics.satisfactionScore}/5</Text>
                                                        <Progress
                                                            value={(session.metrics.satisfactionScore / 5) * 100}
                                                            size="sm"
                                                            colorScheme="green"
                                                            width="100px"
                                                        />
                                                    </HStack>
                                                </HStack>
                                            ))}
                                        </VStack>
                                    </CardBody>
                                </Card>
                            </VStack>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </VStack>

            {/* Create Session Modal */}
            <CreateSessionModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateSession}
            />

            {/* Edit Session Modal */}
            <EditSessionModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                session={editingSession}
                onSubmit={handleUpdateSession}
            />
        </Box>
    );
};

// Create Session Modal Component
const CreateSessionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<TestSession>) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'usability' as const,
        targetUsers: [] as string[],
        tasks: [] as TestTask[]
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>새 테스트 세션 생성</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <form onSubmit={handleSubmit}>
                        <VStack spacing={4} align="stretch">
                            <FormControl isRequired>
                                <FormLabel>제목</FormLabel>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="테스트 세션 제목"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>설명</FormLabel>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="테스트 세션 설명"
                                    rows={3}
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>테스트 유형</FormLabel>
                                <Select
                                    value={formData.type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                                >
                                    <option value="usability">사용성 테스트</option>
                                    <option value="accessibility">접근성 테스트</option>
                                    <option value="performance">성능 테스트</option>
                                    <option value="security">보안 테스트</option>
                                    <option value="compatibility">호환성 테스트</option>
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel>대상 사용자</FormLabel>
                                <CheckboxGroup
                                    value={formData.targetUsers}
                                    onChange={(values) => setFormData(prev => ({ ...prev, targetUsers: values as string[] }))}
                                >
                                    <VStack align="start">
                                        <Checkbox value="new-users">신규 사용자</Checkbox>
                                        <Checkbox value="regular-users">일반 사용자</Checkbox>
                                        <Checkbox value="power-users">파워 사용자</Checkbox>
                                        <Checkbox value="mobile-users">모바일 사용자</Checkbox>
                                        <Checkbox value="desktop-users">데스크톱 사용자</Checkbox>
                                    </VStack>
                                </CheckboxGroup>
                            </FormControl>

                            <Button type="submit" colorScheme="blue">
                                생성
                            </Button>
                        </VStack>
                    </form>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

// Edit Session Modal Component
const EditSessionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    session: TestSession | null;
    onSubmit: (id: string, data: Partial<TestSession>) => void;
}> = ({ isOpen, onClose, session, onSubmit }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'usability' as const,
        status: 'draft' as const,
        targetUsers: [] as string[]
    });

    useEffect(() => {
        if (session) {
            setFormData({
                title: session.title,
                description: session.description,
                type: session.type,
                status: session.status,
                targetUsers: session.targetUsers
            });
        }
    }, [session]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (session) {
            onSubmit(session.id, formData);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>테스트 세션 편집</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <form onSubmit={handleSubmit}>
                        <VStack spacing={4} align="stretch">
                            <FormControl isRequired>
                                <FormLabel>제목</FormLabel>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>설명</FormLabel>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>테스트 유형</FormLabel>
                                <Select
                                    value={formData.type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                                >
                                    <option value="usability">사용성 테스트</option>
                                    <option value="accessibility">접근성 테스트</option>
                                    <option value="performance">성능 테스트</option>
                                    <option value="security">보안 테스트</option>
                                    <option value="compatibility">호환성 테스트</option>
                                </Select>
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>상태</FormLabel>
                                <Select
                                    value={formData.status}
                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                                >
                                    <option value="draft">초안</option>
                                    <option value="active">활성</option>
                                    <option value="completed">완료</option>
                                    <option value="cancelled">취소</option>
                                </Select>
                            </FormControl>

                            <Button type="submit" colorScheme="blue">
                                업데이트
                            </Button>
                        </VStack>
                    </form>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default UserTestingDashboard;
