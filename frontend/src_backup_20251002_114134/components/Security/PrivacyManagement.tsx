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
    Badge,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
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
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    Select,
    Switch,
    Divider,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    useColorModeValue
} from '@chakra-ui/react';

interface ConsentRecord {
    id: string;
    userId: string;
    consentType: string;
    purpose: string;
    legalBasis: string;
    granted: boolean;
    grantedAt: string | null;
    withdrawnAt: string | null;
    createdAt: string;
}

interface DataSubjectRequest {
    id: string;
    userId: string;
    requestType: string;
    status: string;
    requestedAt: string;
    dueDate: string;
    processedAt: string | null;
}

interface DataBreach {
    id: string;
    type: string;
    severity: string;
    description: string;
    affectedUsers: number;
    discoveredAt: string;
    status: string;
    notificationSent: boolean;
    authoritiesNotified: boolean;
}

const PrivacyManagement: React.FC = () => {
    const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
    const [dataSubjectRequests, setDataSubjectRequests] = useState<DataSubjectRequest[]>([]);
    const [dataBreaches, setDataBreaches] = useState<DataBreach[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { isOpen: isConsentModalOpen, onOpen: onConsentModalOpen, onClose: onConsentModalClose } = useDisclosure();
    const { isOpen: isRequestModalOpen, onOpen: onRequestModalOpen, onClose: onRequestModalClose } = useDisclosure();
    const { isOpen: isBreachModalOpen, onOpen: onBreachModalOpen, onClose: onBreachModalClose } = useDisclosure();

    const [newConsent, setNewConsent] = useState({
        userId: '',
        consentType: '',
        purpose: '',
        legalBasis: '',
        granted: true
    });

    const [newRequest, setNewRequest] = useState({
        userId: '',
        requestType: '',
        requestData: {}
    });

    const [newBreach, setNewBreach] = useState({
        type: '',
        severity: '',
        description: '',
        affectedUsers: 0,
        containmentActions: []
    });

    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.800');

    // 데이터 로드
    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // 동의 기록 로드
            const consentResponse = await fetch('/api/encryption/consent');
            const consentData = await consentResponse.json();
            if (consentData.success) {
                setConsentRecords(consentData.data || []);
            }

            // 데이터 주체 요청 로드
            const requestResponse = await fetch('/api/encryption/data-subject-request');
            const requestData = await requestResponse.json();
            if (requestData.success) {
                setDataSubjectRequests(requestData.data || []);
            }

            // 데이터 유출 로드
            const breachResponse = await fetch('/api/encryption/breach-report');
            const breachData = await breachResponse.json();
            if (breachData.success) {
                setDataBreaches(breachData.data || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('데이터를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 동의 기록 생성
    const createConsent = async () => {
        try {
            const response = await fetch('/api/encryption/consent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newConsent)
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: '동의 기록 생성 완료',
                    description: '동의 기록이 성공적으로 생성되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                fetchData();
                onConsentModalClose();
                setNewConsent({
                    userId: '',
                    consentType: '',
                    purpose: '',
                    legalBasis: '',
                    granted: true
                });
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error creating consent:', error);
            toast({
                title: '동의 기록 생성 실패',
                description: error.message || '동의 기록 생성 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 데이터 주체 요청 생성
    const createDataSubjectRequest = async () => {
        try {
            const response = await fetch('/api/encryption/data-subject-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newRequest)
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: '데이터 주체 요청 생성 완료',
                    description: '데이터 주체 요청이 성공적으로 생성되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                fetchData();
                onRequestModalClose();
                setNewRequest({
                    userId: '',
                    requestType: '',
                    requestData: {}
                });
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error creating data subject request:', error);
            toast({
                title: '데이터 주체 요청 생성 실패',
                description: error.message || '데이터 주체 요청 생성 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    // 데이터 유출 신고
    const reportDataBreach = async () => {
        try {
            const response = await fetch('/api/encryption/breach-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newBreach)
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: '데이터 유출 신고 완료',
                    description: '데이터 유출이 성공적으로 신고되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                fetchData();
                onBreachModalClose();
                setNewBreach({
                    type: '',
                    severity: '',
                    description: '',
                    affectedUsers: 0,
                    containmentActions: []
                });
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error reporting data breach:', error);
            toast({
                title: '데이터 유출 신고 실패',
                description: error.message || '데이터 유출 신고 중 오류가 발생했습니다.',
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

    // 심각도 색상
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'red';
            case 'high': return 'orange';
            case 'medium': return 'yellow';
            case 'low': return 'green';
            default: return 'gray';
        }
    };

    // 상태 색상
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'green';
            case 'pending': return 'yellow';
            case 'reported': return 'red';
            case 'contained': return 'blue';
            default: return 'gray';
        }
    };

    if (isLoading && consentRecords.length === 0) {
        return (
            <Box p={8} textAlign="center">
                <Spinner size="xl" />
                <Text mt={4}>개인정보 보호 데이터를 불러오는 중...</Text>
            </Box>
        );
    }

    return (
        <Box p={6}>
            {/* Header */}
            <VStack spacing={4} align="stretch" mb={8}>
                <HStack justify="space-between">
                    <Text fontSize="3xl" fontWeight="bold" color="blue.600">
                        🛡️ 개인정보 보호 관리
                    </Text>
                    <HStack spacing={2}>
                        <Button colorScheme="blue" onClick={onConsentModalOpen}>
                            동의 기록 생성
                        </Button>
                        <Button colorScheme="blue" variant="outline" onClick={onRequestModalOpen}>
                            데이터 주체 요청
                        </Button>
                        <Button colorScheme="red" variant="outline" onClick={onBreachModalOpen}>
                            데이터 유출 신고
                        </Button>
                    </HStack>
                </HStack>

                {/* 통계 카드 */}
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                    <Card>
                        <CardBody textAlign="center">
                            <Stat>
                                <StatLabel>총 동의 기록</StatLabel>
                                <StatNumber color="blue.500">{consentRecords.length}</StatNumber>
                            </Stat>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody textAlign="center">
                            <Stat>
                                <StatLabel>활성 동의</StatLabel>
                                <StatNumber color="green.500">
                                    {consentRecords.filter(c => c.granted).length}
                                </StatNumber>
                            </Stat>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody textAlign="center">
                            <Stat>
                                <StatLabel>데이터 주체 요청</StatLabel>
                                <StatNumber color="purple.500">{dataSubjectRequests.length}</StatNumber>
                            </Stat>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody textAlign="center">
                            <Stat>
                                <StatLabel>데이터 유출</StatLabel>
                                <StatNumber color="red.500">{dataBreaches.length}</StatNumber>
                            </Stat>
                        </CardBody>
                    </Card>
                </SimpleGrid>
            </VStack>

            {/* Error Alert */}
            {error && (
                <Alert status="error" mb={4}>
                    <AlertIcon />
                    {error}
                </Alert>
            )}

            {/* 탭 네비게이션 */}
            <Tabs>
                <TabList>
                    <Tab>동의 관리</Tab>
                    <Tab>데이터 주체 요청</Tab>
                    <Tab>데이터 유출 관리</Tab>
                </TabList>

                <TabPanels>
                    {/* 동의 관리 탭 */}
                    <TabPanel p={0}>
                        <Card>
                            <CardHeader>
                                <Text fontSize="lg" fontWeight="bold">동의 기록</Text>
                            </CardHeader>
                            <CardBody>
                                <Table>
                                    <Thead>
                                        <Tr>
                                            <Th>사용자 ID</Th>
                                            <Th>동의 유형</Th>
                                            <Th>목적</Th>
                                            <Th>법적 근거</Th>
                                            <Th>상태</Th>
                                            <Th>생성일</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {consentRecords.map(record => (
                                            <Tr key={record.id}>
                                                <Td>{record.userId}</Td>
                                                <Td>{record.consentType}</Td>
                                                <Td>{record.purpose}</Td>
                                                <Td>{record.legalBasis}</Td>
                                                <Td>
                                                    <Badge colorScheme={record.granted ? 'green' : 'red'}>
                                                        {record.granted ? '허용' : '철회'}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    {new Date(record.createdAt).toLocaleDateString('ko-KR')}
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </TabPanel>

                    {/* 데이터 주체 요청 탭 */}
                    <TabPanel p={0}>
                        <Card>
                            <CardHeader>
                                <Text fontSize="lg" fontWeight="bold">데이터 주체 요청</Text>
                            </CardHeader>
                            <CardBody>
                                <Table>
                                    <Thead>
                                        <Tr>
                                            <Th>사용자 ID</Th>
                                            <Th>요청 유형</Th>
                                            <Th>상태</Th>
                                            <Th>요청일</Th>
                                            <Th>마감일</Th>
                                            <Th>처리일</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {dataSubjectRequests.map(request => (
                                            <Tr key={request.id}>
                                                <Td>{request.userId}</Td>
                                                <Td>{request.requestType}</Td>
                                                <Td>
                                                    <Badge colorScheme={getStatusColor(request.status)}>
                                                        {request.status}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    {new Date(request.requestedAt).toLocaleDateString('ko-KR')}
                                                </Td>
                                                <Td>
                                                    {new Date(request.dueDate).toLocaleDateString('ko-KR')}
                                                </Td>
                                                <Td>
                                                    {request.processedAt ?
                                                        new Date(request.processedAt).toLocaleDateString('ko-KR') :
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

                    {/* 데이터 유출 관리 탭 */}
                    <TabPanel p={0}>
                        <Card>
                            <CardHeader>
                                <Text fontSize="lg" fontWeight="bold">데이터 유출 관리</Text>
                            </CardHeader>
                            <CardBody>
                                <Table>
                                    <Thead>
                                        <Tr>
                                            <Th>유형</Th>
                                            <Th>심각도</Th>
                                            <Th>설명</Th>
                                            <Th>영향받은 사용자</Th>
                                            <Th>발견일</Th>
                                            <Th>상태</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {dataBreaches.map(breach => (
                                            <Tr key={breach.id}>
                                                <Td>{breach.type}</Td>
                                                <Td>
                                                    <Badge colorScheme={getSeverityColor(breach.severity)}>
                                                        {breach.severity}
                                                    </Badge>
                                                </Td>
                                                <Td>{breach.description}</Td>
                                                <Td>{breach.affectedUsers.toLocaleString()}</Td>
                                                <Td>
                                                    {new Date(breach.discoveredAt).toLocaleDateString('ko-KR')}
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme={getStatusColor(breach.status)}>
                                                        {breach.status}
                                                    </Badge>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            {/* 동의 기록 생성 모달 */}
            <Modal isOpen={isConsentModalOpen} onClose={onConsentModalClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>동의 기록 생성</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <FormControl>
                                <FormLabel>사용자 ID</FormLabel>
                                <Input
                                    value={newConsent.userId}
                                    onChange={(e) => setNewConsent(prev => ({ ...prev, userId: e.target.value }))}
                                    placeholder="사용자 ID를 입력하세요"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>동의 유형</FormLabel>
                                <Select
                                    value={newConsent.consentType}
                                    onChange={(e) => setNewConsent(prev => ({ ...prev, consentType: e.target.value }))}
                                >
                                    <option value="">선택하세요</option>
                                    <option value="data_processing">데이터 처리</option>
                                    <option value="marketing">마케팅</option>
                                    <option value="analytics">분석</option>
                                    <option value="third_party">제3자 공유</option>
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel>목적</FormLabel>
                                <Input
                                    value={newConsent.purpose}
                                    onChange={(e) => setNewConsent(prev => ({ ...prev, purpose: e.target.value }))}
                                    placeholder="동의 목적을 입력하세요"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>법적 근거</FormLabel>
                                <Select
                                    value={newConsent.legalBasis}
                                    onChange={(e) => setNewConsent(prev => ({ ...prev, legalBasis: e.target.value }))}
                                >
                                    <option value="">선택하세요</option>
                                    <option value="consent">동의</option>
                                    <option value="contract">계약</option>
                                    <option value="legal_obligation">법적 의무</option>
                                    <option value="legitimate_interest">정당한 이익</option>
                                </Select>
                            </FormControl>

                            <FormControl>
                                <HStack>
                                    <Switch
                                        isChecked={newConsent.granted}
                                        onChange={(e) => setNewConsent(prev => ({ ...prev, granted: e.target.checked }))}
                                    />
                                    <FormLabel mb={0}>동의 허용</FormLabel>
                                </HStack>
                            </FormControl>

                            <HStack spacing={2}>
                                <Button colorScheme="blue" flex="1" onClick={createConsent}>
                                    동의 기록 생성
                                </Button>
                                <Button variant="outline" flex="1" onClick={onConsentModalClose}>
                                    취소
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 데이터 주체 요청 모달 */}
            <Modal isOpen={isRequestModalOpen} onClose={onRequestModalClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>데이터 주체 요청</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <FormControl>
                                <FormLabel>사용자 ID</FormLabel>
                                <Input
                                    value={newRequest.userId}
                                    onChange={(e) => setNewRequest(prev => ({ ...prev, userId: e.target.value }))}
                                    placeholder="사용자 ID를 입력하세요"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>요청 유형</FormLabel>
                                <Select
                                    value={newRequest.requestType}
                                    onChange={(e) => setNewRequest(prev => ({ ...prev, requestType: e.target.value }))}
                                >
                                    <option value="">선택하세요</option>
                                    <option value="access">접근권</option>
                                    <option value="rectification">정정권</option>
                                    <option value="erasure">삭제권</option>
                                    <option value="portability">이전권</option>
                                    <option value="objection">이의제기권</option>
                                    <option value="restriction">제한권</option>
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel>요청 데이터 (JSON)</FormLabel>
                                <Textarea
                                    value={JSON.stringify(newRequest.requestData, null, 2)}
                                    onChange={(e) => {
                                        try {
                                            const parsed = JSON.parse(e.target.value);
                                            setNewRequest(prev => ({ ...prev, requestData: parsed }));
                                        } catch (error) {
                                            // JSON 파싱 오류 무시
                                        }
                                    }}
                                    placeholder="요청 데이터를 JSON 형식으로 입력하세요"
                                    rows={4}
                                />
                            </FormControl>

                            <HStack spacing={2}>
                                <Button colorScheme="purple" flex="1" onClick={createDataSubjectRequest}>
                                    요청 생성
                                </Button>
                                <Button variant="outline" flex="1" onClick={onRequestModalClose}>
                                    취소
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 데이터 유출 신고 모달 */}
            <Modal isOpen={isBreachModalOpen} onClose={onBreachModalClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>데이터 유출 신고</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <FormControl>
                                <FormLabel>유출 유형</FormLabel>
                                <Select
                                    value={newBreach.type}
                                    onChange={(e) => setNewBreach(prev => ({ ...prev, type: e.target.value }))}
                                >
                                    <option value="">선택하세요</option>
                                    <option value="unauthorized_access">무단 접근</option>
                                    <option value="data_loss">데이터 손실</option>
                                    <option value="system_compromise">시스템 침해</option>
                                    <option value="insider_threat">내부자 위협</option>
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel>심각도</FormLabel>
                                <Select
                                    value={newBreach.severity}
                                    onChange={(e) => setNewBreach(prev => ({ ...prev, severity: e.target.value }))}
                                >
                                    <option value="">선택하세요</option>
                                    <option value="low">낮음</option>
                                    <option value="medium">보통</option>
                                    <option value="high">높음</option>
                                    <option value="critical">치명적</option>
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel>설명</FormLabel>
                                <Textarea
                                    value={newBreach.description}
                                    onChange={(e) => setNewBreach(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="유출 상황을 자세히 설명하세요"
                                    rows={4}
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>영향받은 사용자 수</FormLabel>
                                <Input
                                    type="number"
                                    value={newBreach.affectedUsers}
                                    onChange={(e) => setNewBreach(prev => ({ ...prev, affectedUsers: parseInt(e.target.value) || 0 }))}
                                    placeholder="영향받은 사용자 수를 입력하세요"
                                />
                            </FormControl>

                            <HStack spacing={2}>
                                <Button colorScheme="red" flex="1" onClick={reportDataBreach}>
                                    유출 신고
                                </Button>
                                <Button variant="outline" flex="1" onClick={onBreachModalClose}>
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

export default PrivacyManagement;

