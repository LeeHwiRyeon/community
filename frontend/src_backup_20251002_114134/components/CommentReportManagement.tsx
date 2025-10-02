import React, { useState, useEffect } from 'react';
import {
    Box,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    Button,
    VStack,
    HStack,
    Text,
    Select,
    Input,
    InputGroup,
    InputLeftElement,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Textarea,
    FormControl,
    FormLabel,
    Alert,
    AlertIcon,
    Divider,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    Grid,
    GridItem,
    IconButton,
    Tooltip,
    Menu,
    MenuButton,
    MenuList,
    MenuItem
} from '@chakra-ui/react';
import { SearchIcon, ChevronDownIcon, ViewIcon, EditIcon } from '@chakra-ui/icons';

interface CommentReport {
    id: string;
    commentId: string;
    reporterId?: number;
    reporterName?: string;
    reportType: string;
    reason: string;
    status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    isAnonymous: boolean;
    adminNotes?: string;
    resolvedBy?: number;
    resolvedAt?: string;
    actionTaken?: string;
    createdAt: string;
    comment?: {
        id: string;
        content: string;
        authorName: string;
        createdAt: string;
    };
    reporter?: {
        id: number;
        username: string;
        email: string;
    };
    resolver?: {
        id: number;
        username: string;
    };
}

interface CommentReportManagementProps {
    reports: CommentReport[];
    onLoadReports: (filters?: any) => Promise<void>;
    onResolveReport: (reportId: string, data: any) => Promise<void>;
    onDeleteReport: (reportId: string) => Promise<void>;
    isLoading?: boolean;
}

const REPORT_TYPE_LABELS = {
    spam: '스팸',
    harassment: '괴롭힘',
    hate_speech: '혐오 발언',
    inappropriate: '부적절한 내용',
    violence: '폭력',
    fake_news: '가짜 뉴스',
    copyright: '저작권 침해',
    privacy: '개인정보 침해',
    other: '기타'
};

const STATUS_COLORS = {
    pending: 'yellow',
    reviewing: 'blue',
    resolved: 'green',
    dismissed: 'gray'
};

const PRIORITY_COLORS = {
    low: 'gray',
    medium: 'blue',
    high: 'orange',
    urgent: 'red'
};

const CommentReportManagement: React.FC<CommentReportManagementProps> = ({
    reports,
    onLoadReports,
    onResolveReport,
    onDeleteReport,
    isLoading = false
}) => {
    const [filters, setFilters] = useState({
        status: '',
        reportType: '',
        priority: '',
        search: ''
    });
    const [selectedReport, setSelectedReport] = useState<CommentReport | null>(null);
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
    const [resolveData, setResolveData] = useState({
        status: 'resolved',
        actionTaken: '',
        adminNotes: '',
        priority: 'medium'
    });

    useEffect(() => {
        onLoadReports(filters);
    }, [filters]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleResolveReport = (report: CommentReport) => {
        setSelectedReport(report);
        setResolveData({
            status: 'resolved',
            actionTaken: '',
            adminNotes: '',
            priority: report.priority
        });
        setIsResolveModalOpen(true);
    };

    const handleResolveSubmit = async () => {
        if (!selectedReport) return;

        try {
            await onResolveReport(selectedReport.id, resolveData);
            setIsResolveModalOpen(false);
            setSelectedReport(null);
            onLoadReports(filters);
        } catch (error) {
            console.error('Error resolving report:', error);
        }
    };

    const handleDeleteReport = async (reportId: string) => {
        if (window.confirm('정말로 이 신고를 삭제하시겠습니까?')) {
            try {
                await onDeleteReport(reportId);
                onLoadReports(filters);
            } catch (error) {
                console.error('Error deleting report:', error);
            }
        }
    };

    const getStatusCounts = () => {
        const counts = reports.reduce((acc, report) => {
            acc[report.status] = (acc[report.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            pending: counts.pending || 0,
            reviewing: counts.reviewing || 0,
            resolved: counts.resolved || 0,
            dismissed: counts.dismissed || 0,
            total: reports.length
        };
    };

    const statusCounts = getStatusCounts();

    return (
        <Box>
            <VStack spacing={6} align="stretch">
                {/* 통계 카드 */}
                <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                    <GridItem>
                        <Stat p={4} bg="white" borderRadius="md" boxShadow="sm">
                            <StatLabel>전체 신고</StatLabel>
                            <StatNumber>{statusCounts.total}</StatNumber>
                        </Stat>
                    </GridItem>
                    <GridItem>
                        <Stat p={4} bg="white" borderRadius="md" boxShadow="sm">
                            <StatLabel>대기 중</StatLabel>
                            <StatNumber color="yellow.500">{statusCounts.pending}</StatNumber>
                        </Stat>
                    </GridItem>
                    <GridItem>
                        <Stat p={4} bg="white" borderRadius="md" boxShadow="sm">
                            <StatLabel>검토 중</StatLabel>
                            <StatNumber color="blue.500">{statusCounts.reviewing}</StatNumber>
                        </Stat>
                    </GridItem>
                    <GridItem>
                        <Stat p={4} bg="white" borderRadius="md" boxShadow="sm">
                            <StatLabel>처리 완료</StatLabel>
                            <StatNumber color="green.500">{statusCounts.resolved}</StatNumber>
                        </Stat>
                    </GridItem>
                </Grid>

                {/* 필터 */}
                <Box p={4} bg="white" borderRadius="md" boxShadow="sm">
                    <HStack spacing={4} wrap="wrap">
                        <Select
                            placeholder="상태"
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            w="150px"
                        >
                            <option value="pending">대기 중</option>
                            <option value="reviewing">검토 중</option>
                            <option value="resolved">처리 완료</option>
                            <option value="dismissed">기각</option>
                        </Select>

                        <Select
                            placeholder="신고 유형"
                            value={filters.reportType}
                            onChange={(e) => handleFilterChange('reportType', e.target.value)}
                            w="150px"
                        >
                            {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </Select>

                        <Select
                            placeholder="우선순위"
                            value={filters.priority}
                            onChange={(e) => handleFilterChange('priority', e.target.value)}
                            w="150px"
                        >
                            <option value="low">낮음</option>
                            <option value="medium">보통</option>
                            <option value="high">높음</option>
                            <option value="urgent">긴급</option>
                        </Select>

                        <InputGroup w="250px">
                            <InputLeftElement>
                                <SearchIcon color="gray.300" />
                            </InputLeftElement>
                            <Input
                                placeholder="검색..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </InputGroup>
                    </HStack>
                </Box>

                {/* 신고 목록 */}
                <Box bg="white" borderRadius="md" boxShadow="sm" overflow="hidden">
                    <Table variant="simple">
                        <Thead bg="gray.50">
                            <Tr>
                                <Th>신고 ID</Th>
                                <Th>댓글 내용</Th>
                                <Th>신고자</Th>
                                <Th>신고 유형</Th>
                                <Th>상태</Th>
                                <Th>우선순위</Th>
                                <Th>신고일</Th>
                                <Th>작업</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {reports.map((report) => (
                                <Tr key={report.id}>
                                    <Td>
                                        <Text fontSize="sm" fontFamily="mono">
                                            {report.id.substring(0, 12)}...
                                        </Text>
                                    </Td>
                                    <Td maxW="200px">
                                        <VStack align="start" spacing={1}>
                                            <Text fontSize="sm" noOfLines={2}>
                                                {report.comment?.content || '댓글 정보 없음'}
                                            </Text>
                                            <Text fontSize="xs" color="gray.500">
                                                by {report.comment?.authorName || '알 수 없음'}
                                            </Text>
                                        </VStack>
                                    </Td>
                                    <Td>
                                        <VStack align="start" spacing={1}>
                                            <Text fontSize="sm">
                                                {report.isAnonymous ? '익명' : (report.reporterName || '알 수 없음')}
                                            </Text>
                                            {report.isAnonymous && (
                                                <Badge size="sm" colorScheme="gray">익명</Badge>
                                            )}
                                        </VStack>
                                    </Td>
                                    <Td>
                                        <Badge colorScheme="blue">
                                            {REPORT_TYPE_LABELS[report.reportType as keyof typeof REPORT_TYPE_LABELS]}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        <Badge colorScheme={STATUS_COLORS[report.status]}>
                                            {report.status === 'pending' && '대기 중'}
                                            {report.status === 'reviewing' && '검토 중'}
                                            {report.status === 'resolved' && '처리 완료'}
                                            {report.status === 'dismissed' && '기각'}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        <Badge colorScheme={PRIORITY_COLORS[report.priority]}>
                                            {report.priority === 'low' && '낮음'}
                                            {report.priority === 'medium' && '보통'}
                                            {report.priority === 'high' && '높음'}
                                            {report.priority === 'urgent' && '긴급'}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        <Text fontSize="sm">
                                            {new Date(report.createdAt).toLocaleDateString()}
                                        </Text>
                                    </Td>
                                    <Td>
                                        <HStack spacing={2}>
                                            <Tooltip label="상세 보기">
                                                <IconButton
                                                    size="sm"
                                                    icon={<ViewIcon />}
                                                    onClick={() => setSelectedReport(report)}
                                                />
                                            </Tooltip>
                                            {report.status !== 'resolved' && (
                                                <Tooltip label="처리하기">
                                                    <IconButton
                                                        size="sm"
                                                        icon={<EditIcon />}
                                                        onClick={() => handleResolveReport(report)}
                                                    />
                                                </Tooltip>
                                            )}
                                        </HStack>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>

                {/* 신고 처리 모달 */}
                <Modal isOpen={isResolveModalOpen} onClose={() => setIsResolveModalOpen(false)} size="lg">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>신고 처리</ModalHeader>
                        <ModalBody>
                            <VStack spacing={4} align="stretch">
                                {selectedReport && (
                                    <Box p={3} bg="gray.50" borderRadius="md">
                                        <Text fontSize="sm" fontWeight="bold" mb={2}>신고 정보</Text>
                                        <Text fontSize="sm">신고 유형: {REPORT_TYPE_LABELS[selectedReport.reportType as keyof typeof REPORT_TYPE_LABELS]}</Text>
                                        <Text fontSize="sm">신고 사유: {selectedReport.reason}</Text>
                                    </Box>
                                )}

                                <FormControl>
                                    <FormLabel>처리 상태</FormLabel>
                                    <Select
                                        value={resolveData.status}
                                        onChange={(e) => setResolveData(prev => ({ ...prev, status: e.target.value }))}
                                    >
                                        <option value="resolved">처리 완료</option>
                                        <option value="dismissed">기각</option>
                                    </Select>
                                </FormControl>

                                <FormControl>
                                    <FormLabel>취해진 조치</FormLabel>
                                    <Select
                                        value={resolveData.actionTaken}
                                        onChange={(e) => setResolveData(prev => ({ ...prev, actionTaken: e.target.value }))}
                                    >
                                        <option value="">조치 없음</option>
                                        <option value="warning">경고</option>
                                        <option value="comment_hidden">댓글 숨김</option>
                                        <option value="comment_deleted">댓글 삭제</option>
                                        <option value="user_warned">사용자 경고</option>
                                        <option value="user_suspended">사용자 정지</option>
                                        <option value="user_banned">사용자 차단</option>
                                    </Select>
                                </FormControl>

                                <FormControl>
                                    <FormLabel>관리자 메모</FormLabel>
                                    <Textarea
                                        placeholder="처리 내용을 기록하세요..."
                                        value={resolveData.adminNotes}
                                        onChange={(e) => setResolveData(prev => ({ ...prev, adminNotes: e.target.value }))}
                                        rows={3}
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>우선순위</FormLabel>
                                    <Select
                                        value={resolveData.priority}
                                        onChange={(e) => setResolveData(prev => ({ ...prev, priority: e.target.value }))}
                                    >
                                        <option value="low">낮음</option>
                                        <option value="medium">보통</option>
                                        <option value="high">높음</option>
                                        <option value="urgent">긴급</option>
                                    </Select>
                                </FormControl>
                            </VStack>
                        </ModalBody>
                        <ModalFooter>
                            <HStack spacing={3}>
                                <Button variant="outline" onClick={() => setIsResolveModalOpen(false)}>
                                    취소
                                </Button>
                                <Button colorScheme="blue" onClick={handleResolveSubmit}>
                                    처리 완료
                                </Button>
                            </HStack>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </VStack>
        </Box>
    );
};

export default CommentReportManagement;
