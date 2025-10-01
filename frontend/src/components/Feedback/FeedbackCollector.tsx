import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Textarea,
    Select,
    RadioGroup,
    Radio,
    Stack,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    useToast,
    Progress,
    Badge,
    IconButton,
    Tooltip,
    useColorModeValue,
    FormControl,
    FormLabel,
    FormErrorMessage,
    FormHelperText,
    Divider,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow
} from '@chakra-ui/react';
import {
    StarIcon,
    ThumbsUpIcon,
    ThumbsDownIcon,
    ChatIcon,
    BugIcon,
    LightbulbIcon,
    CloseIcon,
    CheckIcon
} from '@chakra-ui/icons';

interface FeedbackData {
    id: string;
    type: 'bug' | 'suggestion' | 'complaint' | 'praise';
    category: 'ui' | 'ux' | 'performance' | 'accessibility' | 'mobile' | 'other';
    priority: 'low' | 'medium' | 'high' | 'critical';
    rating: number;
    description: string;
    userAgent: string;
    url: string;
    timestamp: string;
    status: 'pending' | 'reviewed' | 'in-progress' | 'resolved' | 'rejected';
    screenshots?: string[];
    steps?: string;
    expected?: string;
    actual?: string;
}

interface FeedbackCollectorProps {
    onFeedbackSubmit?: (feedback: FeedbackData) => void;
    showFloatingButton?: boolean;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const FeedbackCollector: React.FC<FeedbackCollectorProps> = ({
    onFeedbackSubmit,
    showFloatingButton = true,
    position = 'bottom-right'
}) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    const [feedbackType, setFeedbackType] = useState<'bug' | 'suggestion' | 'complaint' | 'praise'>('suggestion');
    const [category, setCategory] = useState<'ui' | 'ux' | 'performance' | 'accessibility' | 'mobile' | 'other'>('ui');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
    const [rating, setRating] = useState(0);
    const [description, setDescription] = useState('');
    const [steps, setSteps] = useState('');
    const [expected, setExpected] = useState('');
    const [actual, setActual] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedFeedbacks, setSubmittedFeedbacks] = useState<FeedbackData[]>([]);

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const textColor = useColorModeValue('gray.600', 'gray.300');

    // 피드백 타입별 설정
    const feedbackConfig = {
        bug: {
            icon: BugIcon,
            color: 'red',
            title: '버그 신고',
            description: '발견한 버그를 신고해주세요',
            requiredFields: ['description', 'steps', 'expected', 'actual']
        },
        suggestion: {
            icon: LightbulbIcon,
            color: 'blue',
            title: '개선 제안',
            description: '더 나은 사용자 경험을 위한 제안을 해주세요',
            requiredFields: ['description']
        },
        complaint: {
            icon: ThumbsDownIcon,
            color: 'orange',
            title: '불만 사항',
            description: '개선이 필요한 부분을 알려주세요',
            requiredFields: ['description']
        },
        praise: {
            icon: ThumbsUpIcon,
            color: 'green',
            title: '칭찬하기',
            description: '마음에 드는 기능을 칭찬해주세요',
            requiredFields: ['description']
        }
    };

    // 피드백 제출
    const handleSubmit = async () => {
        const config = feedbackConfig[feedbackType];
        const requiredFields = config.requiredFields;

        // 필수 필드 검증
        const missingFields = requiredFields.filter(field => {
            switch (field) {
                case 'description': return !description.trim();
                case 'steps': return !steps.trim();
                case 'expected': return !expected.trim();
                case 'actual': return !actual.trim();
                default: return false;
            }
        });

        if (missingFields.length > 0) {
            toast({
                title: '필수 정보를 입력해주세요',
                description: `${missingFields.join(', ')} 필드를 입력해주세요.`,
                status: 'warning',
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const feedback: FeedbackData = {
                id: `feedback_${Date.now()}`,
                type: feedbackType,
                category,
                priority,
                rating,
                description: description.trim(),
                userAgent: navigator.userAgent,
                url: window.location.href,
                timestamp: new Date().toISOString(),
                status: 'pending',
                steps: steps.trim() || undefined,
                expected: expected.trim() || undefined,
                actual: actual.trim() || undefined
            };

            // 로컬 스토리지에 저장
            const existingFeedbacks = JSON.parse(localStorage.getItem('user-feedbacks') || '[]');
            existingFeedbacks.push(feedback);
            localStorage.setItem('user-feedbacks', JSON.stringify(existingFeedbacks));

            // 상태 업데이트
            setSubmittedFeedbacks(existingFeedbacks);

            // 콜백 실행
            if (onFeedbackSubmit) {
                onFeedbackSubmit(feedback);
            }

            // 성공 메시지
            toast({
                title: '피드백이 제출되었습니다',
                description: '소중한 의견 감사합니다. 검토 후 개선하겠습니다.',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });

            // 폼 초기화
            resetForm();
            onClose();

        } catch (error) {
            console.error('피드백 제출 오류:', error);
            toast({
                title: '피드백 제출 실패',
                description: '다시 시도해주세요.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 폼 초기화
    const resetForm = () => {
        setFeedbackType('suggestion');
        setCategory('ui');
        setPriority('medium');
        setRating(0);
        setDescription('');
        setSteps('');
        setExpected('');
        setActual('');
    };

    // 제출된 피드백 로드
    useEffect(() => {
        const saved = localStorage.getItem('user-feedbacks');
        if (saved) {
            setSubmittedFeedbacks(JSON.parse(saved));
        }
    }, []);

    // 피드백 통계
    const feedbackStats = {
        total: submittedFeedbacks.length,
        bugs: submittedFeedbacks.filter(f => f.type === 'bug').length,
        suggestions: submittedFeedbacks.filter(f => f.type === 'suggestion').length,
        complaints: submittedFeedbacks.filter(f => f.type === 'complaint').length,
        praise: submittedFeedbacks.filter(f => f.type === 'praise').length,
        resolved: submittedFeedbacks.filter(f => f.status === 'resolved').length
    };

    const currentConfig = feedbackConfig[feedbackType];

    return (
        <>
            {/* 플로팅 버튼 */}
            {showFloatingButton && (
                <Box
                    position="fixed"
                    bottom={position.includes('bottom') ? 4 : 'auto'}
                    top={position.includes('top') ? 4 : 'auto'}
                    right={position.includes('right') ? 4 : 'auto'}
                    left={position.includes('left') ? 4 : 'auto'}
                    zIndex={1000}
                >
                    <Tooltip label="피드백 보내기" placement="left">
                        <IconButton
                            aria-label="피드백 보내기"
                            icon={<ChatIcon />}
                            colorScheme="blue"
                            size="lg"
                            borderRadius="full"
                            boxShadow="lg"
                            onClick={onOpen}
                            _hover={{ transform: 'scale(1.1)' }}
                            transition="all 0.2s"
                        />
                    </Tooltip>
                </Box>
            )}

            {/* 피드백 모달 */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        <HStack spacing={3}>
                            <Box
                                p={2}
                                borderRadius="full"
                                bg={`${currentConfig.color}.100`}
                                color={`${currentConfig.color}.600`}
                            >
                                <currentConfig.icon boxSize={5} />
                            </Box>
                            <VStack align="start" spacing={0}>
                                <Text fontSize="lg" fontWeight="bold">
                                    {currentConfig.title}
                                </Text>
                                <Text fontSize="sm" color={textColor}>
                                    {currentConfig.description}
                                </Text>
                            </VStack>
                        </HStack>
                    </ModalHeader>
                    <ModalCloseButton />

                    <ModalBody>
                        <VStack spacing={6} align="stretch">
                            {/* 피드백 타입 선택 */}
                            <FormControl>
                                <FormLabel>피드백 유형</FormLabel>
                                <RadioGroup value={feedbackType} onChange={(value: any) => setFeedbackType(value)}>
                                    <Stack direction="row" spacing={4}>
                                        {Object.entries(feedbackConfig).map(([type, config]) => (
                                            <Radio key={type} value={type} colorScheme={config.color}>
                                                <HStack spacing={2}>
                                                    <config.icon boxSize={4} />
                                                    <Text fontSize="sm">{config.title}</Text>
                                                </HStack>
                                            </Radio>
                                        ))}
                                    </Stack>
                                </RadioGroup>
                            </FormControl>

                            {/* 카테고리 및 우선순위 */}
                            <HStack spacing={4}>
                                <FormControl flex={1}>
                                    <FormLabel>카테고리</FormLabel>
                                    <Select value={category} onChange={(e: any) => setCategory(e.target.value)}>
                                        <option value="ui">UI 디자인</option>
                                        <option value="ux">사용자 경험</option>
                                        <option value="performance">성능</option>
                                        <option value="accessibility">접근성</option>
                                        <option value="mobile">모바일</option>
                                        <option value="other">기타</option>
                                    </Select>
                                </FormControl>

                                <FormControl flex={1}>
                                    <FormLabel>우선순위</FormLabel>
                                    <Select value={priority} onChange={(e: any) => setPriority(e.target.value)}>
                                        <option value="low">낮음</option>
                                        <option value="medium">보통</option>
                                        <option value="high">높음</option>
                                        <option value="critical">긴급</option>
                                    </Select>
                                </FormControl>
                            </HStack>

                            {/* 만족도 평가 */}
                            <FormControl>
                                <FormLabel>전체적인 만족도</FormLabel>
                                <HStack spacing={2}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <IconButton
                                            key={star}
                                            aria-label={`${star}점`}
                                            icon={<StarIcon />}
                                            variant="ghost"
                                            colorScheme={star <= rating ? 'yellow' : 'gray'}
                                            onClick={() => setRating(star)}
                                            size="sm"
                                        />
                                    ))}
                                    <Text fontSize="sm" color={textColor} ml={2}>
                                        {rating > 0 ? `${rating}점` : '평가해주세요'}
                                    </Text>
                                </HStack>
                            </FormControl>

                            {/* 상세 설명 */}
                            <FormControl isRequired>
                                <FormLabel>상세 설명</FormLabel>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="구체적으로 설명해주세요..."
                                    rows={4}
                                />
                                <FormHelperText>
                                    {feedbackType === 'bug' && '버그가 발생한 상황을 자세히 설명해주세요.'}
                                    {feedbackType === 'suggestion' && '개선하고 싶은 부분과 제안사항을 알려주세요.'}
                                    {feedbackType === 'complaint' && '불만스러운 점을 구체적으로 설명해주세요.'}
                                    {feedbackType === 'praise' && '마음에 드는 점을 자세히 설명해주세요.'}
                                </FormHelperText>
                            </FormControl>

                            {/* 버그 신고 시 추가 필드 */}
                            {feedbackType === 'bug' && (
                                <>
                                    <Divider />
                                    <Text fontWeight="semibold" color="red.600">
                                        버그 신고 추가 정보
                                    </Text>

                                    <FormControl isRequired>
                                        <FormLabel>재현 단계</FormLabel>
                                        <Textarea
                                            value={steps}
                                            onChange={(e) => setSteps(e.target.value)}
                                            placeholder="1. 페이지에 접속합니다&#10;2. 버튼을 클릭합니다&#10;3. 오류가 발생합니다"
                                            rows={3}
                                        />
                                    </FormControl>

                                    <HStack spacing={4}>
                                        <FormControl isRequired>
                                            <FormLabel>예상 결과</FormLabel>
                                            <Textarea
                                                value={expected}
                                                onChange={(e) => setExpected(e.target.value)}
                                                placeholder="어떤 결과가 나와야 하는지..."
                                                rows={2}
                                            />
                                        </FormControl>

                                        <FormControl isRequired>
                                            <FormLabel>실제 결과</FormLabel>
                                            <Textarea
                                                value={actual}
                                                onChange={(e) => setActual(e.target.value)}
                                                placeholder="실제로 어떤 일이 일어났는지..."
                                                rows={2}
                                            />
                                        </FormControl>
                                    </HStack>
                                </>
                            )}

                            {/* 제출된 피드백 통계 */}
                            {submittedFeedbacks.length > 0 && (
                                <>
                                    <Divider />
                                    <Box>
                                        <Text fontWeight="semibold" mb={3}>
                                            내 피드백 현황
                                        </Text>
                                        <SimpleGrid columns={3} spacing={4}>
                                            <Stat textAlign="center">
                                                <StatLabel>총 제출</StatLabel>
                                                <StatNumber>{feedbackStats.total}</StatNumber>
                                            </Stat>
                                            <Stat textAlign="center">
                                                <StatLabel>해결됨</StatLabel>
                                                <StatNumber color="green.500">{feedbackStats.resolved}</StatNumber>
                                            </Stat>
                                            <Stat textAlign="center">
                                                <StatLabel>평균 만족도</StatLabel>
                                                <StatNumber>
                                                    {submittedFeedbacks.length > 0
                                                        ? (submittedFeedbacks.reduce((sum, f) => sum + f.rating, 0) / submittedFeedbacks.length).toFixed(1)
                                                        : 0
                                                    }점
                                                </StatNumber>
                                            </Stat>
                                        </SimpleGrid>
                                    </Box>
                                </>
                            )}
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <HStack spacing={2}>
                            <Button variant="ghost" onClick={onClose}>
                                취소
                            </Button>
                            <Button
                                colorScheme={currentConfig.color}
                                onClick={handleSubmit}
                                isLoading={isSubmitting}
                                loadingText="제출 중..."
                                leftIcon={<CheckIcon />}
                            >
                                피드백 제출
                            </Button>
                        </HStack>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default FeedbackCollector;
