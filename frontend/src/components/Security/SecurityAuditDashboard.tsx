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
    Code,
    Collapse,
    useColorModeValue,
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
    ShieldIcon,
    WarningIcon,
    CheckIcon,
    CloseIcon,
    ViewIcon,
    DownloadIcon,
    RefreshIcon,
    SettingsIcon,
    InfoIcon,
    TimeIcon,
    FileIcon,
    CodeIcon,
    DatabaseIcon,
    NetworkIcon,
    SecurityIcon
} from '@chakra-ui/icons';

interface Vulnerability {
    id: string;
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    file?: string;
    line?: number;
    code?: string;
    matches?: string[];
    recommendation: string;
    timestamp: string;
}

interface ScanResult {
    scanId: string;
    timestamp: string;
    scanType: string;
    summary: {
        totalFiles: number;
        vulnerabilitiesFound: number;
        criticalIssues: number;
        highIssues: number;
        mediumIssues: number;
        lowIssues: number;
    };
    vulnerabilities: Vulnerability[];
    recommendations: Array<{
        priority: string;
        title: string;
        description: string;
        actions: string[];
    }>;
    scanDuration: number;
}

interface SecurityMetrics {
    totalScans: number;
    vulnerabilitiesFound: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    lastScanTime: string | null;
    averageScanDuration: number;
    vulnerabilityTrend: 'increasing' | 'decreasing' | 'stable';
}

const SecurityAuditDashboard: React.FC = () => {
    const [scanResults, setScanResults] = useState<ScanResult[]>([]);
    const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);
    const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState(0);

    const { isOpen: isScanModalOpen, onOpen: onScanModalOpen, onClose: onScanModalClose } = useDisclosure();
    const { isOpen: isVulnModalOpen, onOpen: onVulnModalOpen, onClose: onVulnModalClose } = useDisclosure();
    const { isOpen: isReportModalOpen, onOpen: onReportModalOpen, onClose: onReportModalClose } = useDisclosure();

    const [selectedVulnerability, setSelectedVulnerability] = useState<Vulnerability | null>(null);
    const [scanOptions, setScanOptions] = useState({
        scanType: 'full',
        includeDependencies: true,
        includeConfigs: true,
        includeLogs: true
    });

    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // 데이터 로드
    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // 스캔 결과 로드
            const logsResponse = await fetch('/api/security-audit/logs?limit=10');
            const logsData = await logsResponse.json();
            if (logsData.success) {
                setScanResults(logsData.data);
            }

            // 메트릭 로드
            const metricsResponse = await fetch('/api/security-audit/metrics');
            const metricsData = await metricsResponse.json();
            if (metricsData.success) {
                setMetrics(metricsData.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('데이터를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 보안 스캔 실행
    const runSecurityScan = async () => {
        try {
            setIsScanning(true);

            const response = await fetch('/api/security-audit/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(scanOptions)
            });

            const data = await response.json();
            if (data.success) {
                setCurrentScan(data.data);
                toast({
                    title: '보안 스캔 완료',
                    description: `${data.data.summary.vulnerabilitiesFound}개의 취약점이 발견되었습니다.`,
                    status: 'info',
                    duration: 5000,
                    isClosable: true
                });
                fetchData(); // 데이터 새로고침
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error running security scan:', error);
            toast({
                title: '스캔 실패',
                description: error.message || '보안 스캔 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        } finally {
            setIsScanning(false);
            onScanModalClose();
        }
    };

    // 취약점 상세 보기
    const viewVulnerability = (vulnerability: Vulnerability) => {
        setSelectedVulnerability(vulnerability);
        onVulnModalOpen();
    };

    // 취약점 보고서 생성
    const generateReport = async (scanId: string) => {
        try {
            const response = await fetch(`/api/security-audit/report/${scanId}`, {
                method: 'POST'
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: '보고서 생성 완료',
                    description: '취약점 보고서가 생성되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error generating report:', error);
            toast({
                title: '보고서 생성 실패',
                description: error.message || '보고서 생성 중 오류가 발생했습니다.',
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

    // 심각도별 색상
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'red';
            case 'high': return 'orange';
            case 'medium': return 'yellow';
            case 'low': return 'green';
            default: return 'gray';
        }
    };

    // 심각도별 아이콘
    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <WarningIcon color="red.500" />;
            case 'high': return <WarningIcon color="orange.500" />;
            case 'medium': return <InfoIcon color="yellow.500" />;
            case 'low': return <CheckIcon color="green.500" />;
            default: return <InfoIcon color="gray.500" />;
        }
    };

    if (isLoading && !metrics) {
        return (
            <Box p={8} textAlign="center">
                <Spinner size="xl" />
                <Text mt={4}>보안 감사 데이터를 불러오는 중...</Text>
            </Box>
        );
    }

    return (
        <Box p={6}>
            {/* Header */}
            <VStack spacing={4} align="stretch" mb={8}>
                <HStack justify="space-between">
                    <Text fontSize="3xl" fontWeight="bold" color="red.600">
                        🔒 보안 감사 대시보드
                    </Text>
                    <HStack spacing={2}>
                        <Button leftIcon={<RefreshIcon />} colorScheme="red" variant="outline" onClick={fetchData}>
                            새로고침
                        </Button>
                        <Button leftIcon={<ShieldIcon />} colorScheme="red" onClick={onScanModalOpen}>
                            보안 스캔
                        </Button>
                        <Button leftIcon={<SettingsIcon />} colorScheme="red" variant="outline">
                            설정
                        </Button>
                    </HStack>
                </HStack>

                {/* 보안 상태 요약 */}
                {metrics && (
                    <Card bg={bgColor} borderColor={borderColor}>
                        <CardBody>
                            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                                <Stat textAlign="center">
                                    <StatLabel>총 스캔</StatLabel>
                                    <StatNumber color="blue.500">{metrics.totalScans}</StatNumber>
                                </Stat>
                                <Stat textAlign="center">
                                    <StatLabel>발견된 취약점</StatLabel>
                                    <StatNumber color="red.500">{metrics.vulnerabilitiesFound}</StatNumber>
                                </Stat>
                                <Stat textAlign="center">
                                    <StatLabel>심각한 문제</StatLabel>
                                    <StatNumber color="red.600">{metrics.criticalIssues}</StatNumber>
                                </Stat>
                                <Stat textAlign="center">
                                    <StatLabel>높은 우선순위</StatLabel>
                                    <StatNumber color="orange.500">{metrics.highIssues}</StatNumber>
                                </Stat>
                            </SimpleGrid>
                        </CardBody>
                    </Card>
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
                    <Tab>최근 스캔</Tab>
                    <Tab>취약점 분석</Tab>
                    <Tab>보고서</Tab>
                    <Tab>통계</Tab>
                </TabList>

                <TabPanels>
                    {/* 최근 스캔 탭 */}
                    <TabPanel p={0}>
                        <VStack spacing={4} align="stretch">
                            {scanResults.map(scan => (
                                <Card key={scan.scanId} bg={bgColor} borderColor={borderColor}>
                                    <CardBody>
                                        <HStack justify="space-between" mb={4}>
                                            <VStack align="start" spacing={1}>
                                                <Text fontWeight="bold" fontSize="lg">
                                                    스캔 {scan.scanId}
                                                </Text>
                                                <Text fontSize="sm" color="gray.600">
                                                    {new Date(scan.timestamp).toLocaleString('ko-KR')}
                                                </Text>
                                                <Badge colorScheme="blue" size="sm">
                                                    {scan.scanType}
                                                </Badge>
                                            </VStack>
                                            <HStack spacing={2}>
                                                <Button
                                                    size="sm"
                                                    colorScheme="blue"
                                                    variant="outline"
                                                    onClick={() => setCurrentScan(scan)}
                                                >
                                                    상세보기
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    colorScheme="green"
                                                    variant="outline"
                                                    onClick={() => generateReport(scan.scanId)}
                                                >
                                                    보고서 생성
                                                </Button>
                                            </HStack>
                                        </HStack>

                                        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                                            <Box textAlign="center">
                                                <Text fontSize="sm" color="gray.600">스캔된 파일</Text>
                                                <Text fontWeight="bold">{scan.summary.totalFiles}</Text>
                                            </Box>
                                            <Box textAlign="center">
                                                <Text fontSize="sm" color="gray.600">발견된 취약점</Text>
                                                <Text fontWeight="bold" color="red.500">
                                                    {scan.summary.vulnerabilitiesFound}
                                                </Text>
                                            </Box>
                                            <Box textAlign="center">
                                                <Text fontSize="sm" color="gray.600">심각한 문제</Text>
                                                <Text fontWeight="bold" color="red.600">
                                                    {scan.summary.criticalIssues}
                                                </Text>
                                            </Box>
                                            <Box textAlign="center">
                                                <Text fontSize="sm" color="gray.600">스캔 시간</Text>
                                                <Text fontWeight="bold">
                                                    {(scan.scanDuration / 1000).toFixed(1)}초
                                                </Text>
                                            </Box>
                                        </SimpleGrid>
                                    </CardBody>
                                </Card>
                            ))}

                            {scanResults.length === 0 && (
                                <Card>
                                    <CardBody textAlign="center" py={8}>
                                        <Text color="gray.500">아직 스캔 결과가 없습니다.</Text>
                                        <Button
                                            mt={4}
                                            colorScheme="red"
                                            leftIcon={<ShieldIcon />}
                                            onClick={onScanModalOpen}
                                        >
                                            첫 번째 스캔 실행
                                        </Button>
                                    </CardBody>
                                </Card>
                            )}
                        </VStack>
                    </TabPanel>

                    {/* 취약점 분석 탭 */}
                    <TabPanel p={0}>
                        {currentScan ? (
                            <VStack spacing={4} align="stretch">
                                <Card>
                                    <CardHeader>
                                        <HStack justify="space-between">
                                            <Text fontSize="lg" fontWeight="bold">
                                                취약점 분석 - {currentScan.scanId}
                                            </Text>
                                            <Badge colorScheme="red" size="lg">
                                                {currentScan.summary.vulnerabilitiesFound}개 발견
                                            </Badge>
                                        </HStack>
                                    </CardHeader>
                                    <CardBody>
                                        <VStack spacing={4} align="stretch">
                                            {currentScan.vulnerabilities.map(vuln => (
                                                <Box
                                                    key={vuln.id}
                                                    p={4}
                                                    bg="gray.50"
                                                    borderRadius="md"
                                                    borderLeft="4px solid"
                                                    borderLeftColor={`${getSeverityColor(vuln.severity)}.500`}
                                                >
                                                    <HStack justify="space-between" mb={2}>
                                                        <HStack spacing={2}>
                                                            {getSeverityIcon(vuln.severity)}
                                                            <Text fontWeight="bold">{vuln.description}</Text>
                                                            <Badge colorScheme={getSeverityColor(vuln.severity)} size="sm">
                                                                {vuln.severity.toUpperCase()}
                                                            </Badge>
                                                        </HStack>
                                                        <Button
                                                            size="sm"
                                                            colorScheme="blue"
                                                            variant="outline"
                                                            onClick={() => viewVulnerability(vuln)}
                                                        >
                                                            상세보기
                                                        </Button>
                                                    </HStack>

                                                    {vuln.file && (
                                                        <Text fontSize="sm" color="gray.600" mb={2}>
                                                            파일: {vuln.file}
                                                            {vuln.line && ` (라인 ${vuln.line})`}
                                                        </Text>
                                                    )}

                                                    <Text fontSize="sm" color="gray.700">
                                                        {vuln.recommendation}
                                                    </Text>
                                                </Box>
                                            ))}
                                        </VStack>
                                    </CardBody>
                                </Card>
                            </VStack>
                        ) : (
                            <Card>
                                <CardBody textAlign="center" py={8}>
                                    <Text color="gray.500">스캔 결과를 선택하세요.</Text>
                                </CardBody>
                            </Card>
                        )}
                    </TabPanel>

                    {/* 보고서 탭 */}
                    <TabPanel p={0}>
                        <Card>
                            <CardHeader>
                                <Text fontSize="lg" fontWeight="bold">취약점 보고서</Text>
                            </CardHeader>
                            <CardBody>
                                <Text color="gray.500">보고서 기능은 개발 중입니다.</Text>
                            </CardBody>
                        </Card>
                    </TabPanel>

                    {/* 통계 탭 */}
                    <TabPanel p={0}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">심각도별 통계</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={3} align="stretch">
                                        <HStack justify="space-between">
                                            <HStack>
                                                <WarningIcon color="red.500" />
                                                <Text>Critical</Text>
                                            </HStack>
                                            <Text fontWeight="bold" color="red.500">
                                                {metrics?.criticalIssues || 0}
                                            </Text>
                                        </HStack>
                                        <HStack justify="space-between">
                                            <HStack>
                                                <WarningIcon color="orange.500" />
                                                <Text>High</Text>
                                            </HStack>
                                            <Text fontWeight="bold" color="orange.500">
                                                {metrics?.highIssues || 0}
                                            </Text>
                                        </HStack>
                                        <HStack justify="space-between">
                                            <HStack>
                                                <InfoIcon color="yellow.500" />
                                                <Text>Medium</Text>
                                            </HStack>
                                            <Text fontWeight="bold" color="yellow.500">
                                                {metrics?.mediumIssues || 0}
                                            </Text>
                                        </HStack>
                                        <HStack justify="space-between">
                                            <HStack>
                                                <CheckIcon color="green.500" />
                                                <Text>Low</Text>
                                            </HStack>
                                            <Text fontWeight="bold" color="green.500">
                                                {metrics?.lowIssues || 0}
                                            </Text>
                                        </HStack>
                                    </VStack>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <Text fontSize="lg" fontWeight="bold">스캔 통계</Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing={3} align="stretch">
                                        <HStack justify="space-between">
                                            <Text>총 스캔 수</Text>
                                            <Text fontWeight="bold">{metrics?.totalScans || 0}</Text>
                                        </HStack>
                                        <HStack justify="space-between">
                                            <Text>평균 스캔 시간</Text>
                                            <Text fontWeight="bold">
                                                {metrics ? (metrics.averageScanDuration / 1000).toFixed(1) : 0}초
                                            </Text>
                                        </HStack>
                                        <HStack justify="space-between">
                                            <Text>마지막 스캔</Text>
                                            <Text fontWeight="bold" fontSize="sm">
                                                {metrics?.lastScanTime ?
                                                    new Date(metrics.lastScanTime).toLocaleDateString('ko-KR') :
                                                    '없음'
                                                }
                                            </Text>
                                        </HStack>
                                        <HStack justify="space-between">
                                            <Text>취약점 트렌드</Text>
                                            <Badge
                                                colorScheme={
                                                    metrics?.vulnerabilityTrend === 'increasing' ? 'red' :
                                                        metrics?.vulnerabilityTrend === 'decreasing' ? 'green' : 'blue'
                                                }
                                            >
                                                {metrics?.vulnerabilityTrend || 'stable'}
                                            </Badge>
                                        </HStack>
                                    </VStack>
                                </CardBody>
                            </Card>
                        </SimpleGrid>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            {/* 스캔 모달 */}
            <Modal isOpen={isScanModalOpen} onClose={onScanModalClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>보안 스캔 실행</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <Text>스캔 옵션을 선택하고 보안 스캔을 실행하세요.</Text>

                            <Box>
                                <Text fontWeight="medium" mb={2}>스캔 유형</Text>
                                <select
                                    value={scanOptions.scanType}
                                    onChange={(e) => setScanOptions(prev => ({ ...prev, scanType: e.target.value }))}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                >
                                    <option value="full">전체 스캔</option>
                                    <option value="quick">빠른 스캔</option>
                                    <option value="custom">사용자 정의</option>
                                </select>
                            </Box>

                            <Box>
                                <Text fontWeight="medium" mb={2}>스캔 옵션</Text>
                                <VStack spacing={2} align="stretch">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={scanOptions.includeDependencies}
                                            onChange={(e) => setScanOptions(prev => ({ ...prev, includeDependencies: e.target.checked }))}
                                        />
                                        <Text ml={2}>의존성 스캔 포함</Text>
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={scanOptions.includeConfigs}
                                            onChange={(e) => setScanOptions(prev => ({ ...prev, includeConfigs: e.target.checked }))}
                                        />
                                        <Text ml={2}>설정 파일 스캔 포함</Text>
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={scanOptions.includeLogs}
                                            onChange={(e) => setScanOptions(prev => ({ ...prev, includeLogs: e.target.checked }))}
                                        />
                                        <Text ml={2}>로그 파일 스캔 포함</Text>
                                    </label>
                                </VStack>
                            </Box>

                            <HStack spacing={2}>
                                <Button
                                    colorScheme="red"
                                    flex="1"
                                    onClick={runSecurityScan}
                                    isLoading={isScanning}
                                    loadingText="스캔 중..."
                                >
                                    스캔 실행
                                </Button>
                                <Button variant="outline" flex="1" onClick={onScanModalClose}>
                                    취소
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 취약점 상세 모달 */}
            <Modal isOpen={isVulnModalOpen} onClose={onVulnModalClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>취약점 상세 정보</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedVulnerability && (
                            <VStack spacing={4} align="stretch">
                                <HStack justify="space-between">
                                    <Text fontSize="lg" fontWeight="bold">
                                        {selectedVulnerability.description}
                                    </Text>
                                    <Badge
                                        colorScheme={getSeverityColor(selectedVulnerability.severity)}
                                        size="lg"
                                    >
                                        {selectedVulnerability.severity.toUpperCase()}
                                    </Badge>
                                </HStack>

                                {selectedVulnerability.file && (
                                    <Box>
                                        <Text fontWeight="medium" mb={2}>파일 정보</Text>
                                        <Code p={2} borderRadius="md" w="100%">
                                            {selectedVulnerability.file}
                                            {selectedVulnerability.line && `:${selectedVulnerability.line}`}
                                        </Code>
                                    </Box>
                                )}

                                {selectedVulnerability.code && (
                                    <Box>
                                        <Text fontWeight="medium" mb={2}>문제 코드</Text>
                                        <Code p={2} borderRadius="md" w="100%" whiteSpace="pre-wrap">
                                            {selectedVulnerability.code}
                                        </Code>
                                    </Box>
                                )}

                                <Box>
                                    <Text fontWeight="medium" mb={2}>권장사항</Text>
                                    <Text p={3} bg="blue.50" borderRadius="md">
                                        {selectedVulnerability.recommendation}
                                    </Text>
                                </Box>

                                <Box>
                                    <Text fontWeight="medium" mb={2}>발견 시간</Text>
                                    <Text>
                                        {new Date(selectedVulnerability.timestamp).toLocaleString('ko-KR')}
                                    </Text>
                                </Box>
                            </VStack>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default SecurityAuditDashboard;

