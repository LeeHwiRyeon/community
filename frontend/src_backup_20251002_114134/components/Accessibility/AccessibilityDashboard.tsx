import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Progress,
    Badge,
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
    Collapse,
    useDisclosure,
    Heading,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    SimpleGrid
} from '@chakra-ui/react';
import { accessibilityTester, AccessibilityTestSuite } from '../../utils/accessibilityTest';

const AccessibilityDashboard: React.FC = () => {
    const [testResults, setTestResults] = useState<AccessibilityTestSuite | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const { isOpen, onToggle } = useDisclosure();

    const runAccessibilityTest = async () => {
        setIsRunning(true);

        // 테스트 실행 (실제로는 비동기적으로 실행)
        await new Promise(resolve => setTimeout(resolve, 1000));

        const results = accessibilityTester.testPageAccessibility();
        setTestResults(results);
        setIsRunning(false);
    };

    useEffect(() => {
        // 컴포넌트 마운트 시 자동 테스트 실행
        runAccessibilityTest();
    }, []);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'error': return 'red';
            case 'warning': return 'yellow';
            case 'info': return 'green';
            default: return 'gray';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'green';
        if (score >= 70) return 'yellow';
        return 'red';
    };

    return (
        <Box p={6} maxW="1200px" mx="auto">
            <VStack spacing={6} align="stretch">
                <Box>
                    <Heading as="h1" size="xl" mb={2}>
                        접근성 대시보드
                    </Heading>
                    <Text color="gray.600">
                        웹 접근성 표준(WCAG 2.1 AA) 준수 여부를 확인합니다.
                    </Text>
                </Box>

                <HStack spacing={4}>
                    <Button
                        colorScheme="blue"
                        onClick={runAccessibilityTest}
                        isLoading={isRunning}
                        loadingText="테스트 실행 중..."
                    >
                        접근성 테스트 실행
                    </Button>
                    <Button variant="outline" onClick={onToggle}>
                        {isOpen ? '상세 결과 숨기기' : '상세 결과 보기'}
                    </Button>
                </HStack>

                {testResults && (
                    <>
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                            <Stat p={4} shadow="sm" borderWidth="1px" borderRadius="md">
                                <StatLabel>전체 점수</StatLabel>
                                <StatNumber color={getScoreColor(testResults.score)}>
                                    {testResults.score.toFixed(1)}%
                                </StatNumber>
                                <StatHelpText>
                                    <Progress
                                        value={testResults.score}
                                        colorScheme={getScoreColor(testResults.score)}
                                        size="sm"
                                    />
                                </StatHelpText>
                            </Stat>

                            <Stat p={4} shadow="sm" borderWidth="1px" borderRadius="md">
                                <StatLabel>통과한 테스트</StatLabel>
                                <StatNumber color="green">
                                    {testResults.tests.filter(t => t.passed).length}
                                </StatNumber>
                                <StatHelpText>
                                    총 {testResults.tests.length}개 중
                                </StatHelpText>
                            </Stat>

                            <Stat p={4} shadow="sm" borderWidth="1px" borderRadius="md">
                                <StatLabel>오류</StatLabel>
                                <StatNumber color="red">
                                    {testResults.tests.filter(t => !t.passed && t.severity === 'error').length}
                                </StatNumber>
                                <StatHelpText>
                                    즉시 수정 필요
                                </StatHelpText>
                            </Stat>
                        </SimpleGrid>

                        {testResults.score < 70 && (
                            <Alert status="error">
                                <AlertIcon />
                                <Box>
                                    <AlertTitle>접근성 개선이 필요합니다!</AlertTitle>
                                    <AlertDescription>
                                        현재 점수가 {testResults.score.toFixed(1)}%로 WCAG 2.1 AA 기준에 미달합니다.
                                        아래 상세 결과를 확인하여 개선사항을 적용해주세요.
                                    </AlertDescription>
                                </Box>
                            </Alert>
                        )}

                        <Collapse in={isOpen} animateOpacity>
                            <Box>
                                <Heading as="h3" size="md" mb={4}>
                                    상세 테스트 결과
                                </Heading>

                                <Table variant="simple" size="sm">
                                    <Thead>
                                        <Tr>
                                            <Th>상태</Th>
                                            <Th>심각도</Th>
                                            <Th>메시지</Th>
                                            <Th>요소</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {testResults.tests.map((test, index) => (
                                            <Tr key={index}>
                                                <Td>
                                                    <Badge colorScheme={test.passed ? 'green' : 'red'}>
                                                        {test.passed ? '통과' : '실패'}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme={getSeverityColor(test.severity)}>
                                                        {test.severity}
                                                    </Badge>
                                                </Td>
                                                <Td>{test.message}</Td>
                                                <Td>
                                                    {test.element ? (
                                                        <Text fontSize="xs" color="gray.500">
                                                            {test.element.tagName.toLowerCase()}
                                                            {test.element.id && `#${test.element.id}`}
                                                            {test.element.className && `.${test.element.className.split(' ')[0]}`}
                                                        </Text>
                                                    ) : (
                                                        <Text fontSize="xs" color="gray.400">전체 페이지</Text>
                                                    )}
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </Box>
                        </Collapse>
                    </>
                )}

                <Box p={4} bg="gray.50" borderRadius="md">
                    <Heading as="h3" size="md" mb={2}>
                        접근성 개선 가이드
                    </Heading>
                    <VStack align="stretch" spacing={2}>
                        <Text fontSize="sm">
                            • 모든 인터랙티브 요소에 적절한 ARIA 라벨을 추가하세요
                        </Text>
                        <Text fontSize="sm">
                            • 색상 대비를 4.5:1 이상으로 유지하세요
                        </Text>
                        <Text fontSize="sm">
                            • 키보드만으로 모든 기능에 접근할 수 있도록 하세요
                        </Text>
                        <Text fontSize="sm">
                            • 논리적인 포커스 순서를 유지하세요
                        </Text>
                        <Text fontSize="sm">
                            • 스크린 리더 사용자를 위한 의미있는 HTML 구조를 사용하세요
                        </Text>
                    </VStack>
                </Box>
            </VStack>
        </Box>
    );
};

export default AccessibilityDashboard;
