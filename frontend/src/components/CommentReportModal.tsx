import React, { useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    FormControl,
    FormLabel,
    Select,
    Textarea,
    VStack,
    HStack,
    Text,
    Alert,
    AlertIcon,
    Checkbox,
    Input,
    Divider,
    Badge,
    Box
} from '@chakra-ui/react';

interface CommentReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    commentId: string;
    commentContent: string;
    commentAuthor: string;
    onReportSubmit: (reportData: ReportData) => Promise<void>;
    isAnonymous?: boolean;
}

interface ReportData {
    commentId: string;
    reportType: string;
    reason: string;
    isAnonymous: boolean;
    reporterName?: string;
}

const REPORT_TYPES = [
    { value: 'spam', label: '스팸', description: '스팸성 댓글' },
    { value: 'harassment', label: '괴롭힘', description: '괴롭힘 또는 위협' },
    { value: 'hate_speech', label: '혐오 발언', description: '혐오적이거나 차별적인 발언' },
    { value: 'inappropriate', label: '부적절한 내용', description: '부적절하거나 성인 콘텐츠' },
    { value: 'violence', label: '폭력', description: '폭력적이거나 위험한 내용' },
    { value: 'fake_news', label: '가짜 뉴스', description: '거짓 정보나 가짜 뉴스' },
    { value: 'copyright', label: '저작권 침해', description: '저작권 침해 의심' },
    { value: 'privacy', label: '개인정보 침해', description: '개인정보 노출' },
    { value: 'other', label: '기타', description: '기타 사유' }
];

const CommentReportModal: React.FC<CommentReportModalProps> = ({
    isOpen,
    onClose,
    commentId,
    commentContent,
    commentAuthor,
    onReportSubmit,
    isAnonymous = false
}) => {
    const [reportType, setReportType] = useState('');
    const [reason, setReason] = useState('');
    const [isAnonymousReport, setIsAnonymousReport] = useState(isAnonymous);
    const [reporterName, setReporterName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!reportType) {
            setError('신고 유형을 선택해주세요.');
            return;
        }

        if (!reason.trim()) {
            setError('신고 사유를 입력해주세요.');
            return;
        }

        if (!isAnonymousReport && !reporterName.trim()) {
            setError('신고자 이름을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await onReportSubmit({
                commentId,
                reportType,
                reason: reason.trim(),
                isAnonymous: isAnonymousReport,
                reporterName: isAnonymousReport ? undefined : reporterName.trim()
            });

            // 폼 초기화
            setReportType('');
            setReason('');
            setReporterName('');
            setIsAnonymousReport(isAnonymous);
            onClose();
        } catch (err) {
            setError('신고 접수 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setReportType('');
            setReason('');
            setReporterName('');
            setIsAnonymousReport(isAnonymous);
            setError('');
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg" isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <VStack align="start" spacing={2}>
                        <Text fontSize="lg" fontWeight="bold">
                            댓글 신고
                        </Text>
                        <Box p={3} bg="gray.50" borderRadius="md" w="full">
                            <Text fontSize="sm" color="gray.600" mb={1}>
                                신고할 댓글:
                            </Text>
                            <Text fontSize="sm" fontWeight="medium">
                                {commentAuthor}: {commentContent.substring(0, 100)}
                                {commentContent.length > 100 && '...'}
                            </Text>
                        </Box>
                    </VStack>
                </ModalHeader>

                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        {error && (
                            <Alert status="error">
                                <AlertIcon />
                                {error}
                            </Alert>
                        )}

                        <FormControl isRequired>
                            <FormLabel>신고 유형</FormLabel>
                            <Select
                                placeholder="신고 유형을 선택하세요"
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                            >
                                {REPORT_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label} - {type.description}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>신고 사유</FormLabel>
                            <Textarea
                                placeholder="신고 사유를 자세히 설명해주세요..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={4}
                                resize="vertical"
                            />
                        </FormControl>

                        <Divider />

                        <FormControl>
                            <Checkbox
                                isChecked={isAnonymousReport}
                                onChange={(e) => setIsAnonymousReport(e.target.checked)}
                            >
                                익명으로 신고하기
                            </Checkbox>
                        </FormControl>

                        {!isAnonymousReport && (
                            <FormControl>
                                <FormLabel>신고자 이름</FormLabel>
                                <Input
                                    placeholder="신고자 이름을 입력하세요"
                                    value={reporterName}
                                    onChange={(e) => setReporterName(e.target.value)}
                                />
                            </FormControl>
                        )}

                        <Box p={3} bg="blue.50" borderRadius="md">
                            <Text fontSize="sm" color="blue.700">
                                <strong>신고 안내:</strong>
                                <br />
                                • 신고된 내용은 관리자가 검토합니다.
                                <br />
                                • 허위 신고는 제재를 받을 수 있습니다.
                                <br />
                                • 신고 처리 결과는 별도로 알려드리지 않습니다.
                            </Text>
                        </Box>
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <HStack spacing={3}>
                        <Button variant="outline" onClick={handleClose} isDisabled={isSubmitting}>
                            취소
                        </Button>
                        <Button
                            colorScheme="red"
                            onClick={handleSubmit}
                            isLoading={isSubmitting}
                            loadingText="신고 중..."
                        >
                            신고하기
                        </Button>
                    </HStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default CommentReportModal;
