import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Badge,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Select,
    useColorModeValue,
    Spinner,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    Textarea,
    useDisclosure,
    useToast
} from '@chakra-ui/react';
import { FiCheck, FiX, FiEye } from 'react-icons/fi';
import { apiClient } from '../utils/apiClient';

interface ContentReport {
    id: number;
    reporter_username: string;
    reported_username: string;
    content_type: string;
    content_id: number;
    reason: string;
    description: string;
    priority: string;
    status: string;
    created_at: string;
    moderator_username?: string;
}

interface ReportModalData {
    report: ContentReport;
    action: string;
}

const ContentReportList: React.FC = () => {
    const [reports, setReports] = useState<ContentReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [selectedReport, setSelectedReport] = useState<ReportModalData | null>(null);
    const [resolutionNote, setResolutionNote] = useState('');
    const [processing, setProcessing] = useState(false);

    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    useEffect(() => {
        loadReports();
    }, [statusFilter, priorityFilter]);

    const loadReports = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (priorityFilter) params.append('priority', priorityFilter);

            const response = await apiClient.get(`/api/moderator/reports-v2?${params.toString()}`);
            setReports(response.data.reports || []);
        } catch (error) {
            console.error('신고 목록 로드 실패:', error);
            toast({
                title: '신고 목록 로드 실패',
                status: 'error',
                duration: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = (report: ContentReport, action: string) => {
        setSelectedReport({ report, action });
        setResolutionNote('');
        onOpen();
    };

    const confirmResolve = async () => {
        if (!selectedReport) return;

        try {
            setProcessing(true);
            await apiClient.put(
                `/api/moderator/reports-v2/${selectedReport.report.id}/resolve`,
                {
                    action: selectedReport.action,
                    note: resolutionNote
                }
            );

            toast({
                title: '신고 처리 완료',
                status: 'success',
                duration: 3000
            });

            onClose();
            loadReports();
        } catch (error) {
            console.error('신고 처리 실패:', error);
            toast({
                title: '신고 처리 실패',
                status: 'error',
                duration: 3000
            });
        } finally {
            setProcessing(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'red';
            case 'high': return 'orange';
            case 'normal': return 'blue';
            case 'low': return 'gray';
            default: return 'gray';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'yellow';
            case 'reviewing': return 'blue';
            case 'resolved': return 'green';
            case 'rejected': return 'red';
            default: return 'gray';
        }
    };

    return (
        <Box>
            {/* 필터 */}
            <HStack spacing={4} mb={4}>
                <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    maxW="200px"
                >
                    <option value="">전체 상태</option>
                    <option value="pending">대기 중</option>
                    <option value="reviewing">검토 중</option>
                    <option value="resolved">처리 완료</option>
                    <option value="rejected">거부됨</option>
                </Select>

                <Select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    maxW="200px"
                >
                    <option value="">전체 우선순위</option>
                    <option value="urgent">긴급</option>
                    <option value="high">높음</option>
                    <option value="normal">보통</option>
                    <option value="low">낮음</option>
                </Select>

                <Button onClick={loadReports} isLoading={loading}>
                    새로고침
                </Button>
            </HStack>

            {/* 신고 테이블 */}
            <Box
                bg={bgColor}
                borderRadius="lg"
                borderWidth="1px"
                borderColor={borderColor}
                overflowX="auto"
            >
                {loading ? (
                    <Box textAlign="center" py={10}>
                        <Spinner />
                    </Box>
                ) : reports.length === 0 ? (
                    <Box textAlign="center" py={10}>
                        <Text color="gray.500">신고가 없습니다</Text>
                    </Box>
                ) : (
                    <Table variant="simple">
                        <Thead>
                            <Tr>
                                <Th>ID</Th>
                                <Th>우선순위</Th>
                                <Th>콘텐츠</Th>
                                <Th>신고자</Th>
                                <Th>신고대상</Th>
                                <Th>사유</Th>
                                <Th>상태</Th>
                                <Th>작업</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {reports.map((report) => (
                                <Tr key={report.id}>
                                    <Td>{report.id}</Td>
                                    <Td>
                                        <Badge colorScheme={getPriorityColor(report.priority)}>
                                            {report.priority}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        <VStack align="start" spacing={0}>
                                            <Text fontSize="sm">{report.content_type}</Text>
                                            <Text fontSize="xs" color="gray.500">
                                                #{report.content_id}
                                            </Text>
                                        </VStack>
                                    </Td>
                                    <Td>{report.reporter_username}</Td>
                                    <Td>{report.reported_username}</Td>
                                    <Td>
                                        <Text noOfLines={2} maxW="200px">
                                            {report.reason}
                                        </Text>
                                    </Td>
                                    <Td>
                                        <Badge colorScheme={getStatusColor(report.status)}>
                                            {report.status}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        {report.status === 'pending' && (
                                            <HStack>
                                                <Button
                                                    size="sm"
                                                    leftIcon={<FiCheck />}
                                                    colorScheme="green"
                                                    onClick={() => handleResolve(report, 'approved')}
                                                >
                                                    승인
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    leftIcon={<FiX />}
                                                    colorScheme="red"
                                                    onClick={() => handleResolve(report, 'rejected')}
                                                >
                                                    거부
                                                </Button>
                                            </HStack>
                                        )}
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                )}
            </Box>

            {/* 처리 확인 모달 */}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>신고 처리</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedReport && (
                            <VStack spacing={4} align="stretch">
                                <Text>
                                    <strong>처리 결과:</strong>{' '}
                                    {selectedReport.action === 'approved' ? '승인' : '거부'}
                                </Text>
                                <Text>
                                    <strong>신고 ID:</strong> {selectedReport.report.id}
                                </Text>
                                <Box>
                                    <Text mb={2}>처리 메모:</Text>
                                    <Textarea
                                        value={resolutionNote}
                                        onChange={(e) => setResolutionNote(e.target.value)}
                                        placeholder="처리 사유를 입력하세요..."
                                        rows={4}
                                    />
                                </Box>
                            </VStack>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            취소
                        </Button>
                        <Button
                            colorScheme="blue"
                            onClick={confirmResolve}
                            isLoading={processing}
                        >
                            확인
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default ContentReportList;
