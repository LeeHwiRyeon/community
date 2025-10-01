import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Textarea,
    Select,
    Input,
    VStack,
    HStack,
    Text,
    Rating,
    useToast,
    useDisclosure,
    IconButton,
    Badge,
    Divider
} from '@chakra-ui/react';
import { StarIcon, ChatIcon, BugIcon, LightbulbIcon, CloseIcon } from '@chakra-ui/icons';

interface FeedbackData {
    id: string;
    type: 'bug' | 'feature' | 'improvement' | 'general';
    rating: number;
    title: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    user: {
        id: string;
        name: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
    attachments?: string[];
    tags?: string[];
}

interface FeedbackFormData {
    type: 'bug' | 'feature' | 'improvement' | 'general';
    rating: number;
    title: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    attachments: File[];
}

const FeedbackSystem: React.FC = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [feedback, setFeedback] = useState<FeedbackFormData>({
        type: 'general',
        rating: 5,
        title: '',
        description: '',
        category: '',
        priority: 'medium',
        attachments: []
    });
    const [recentFeedback, setRecentFeedback] = useState<FeedbackData[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    useEffect(() => {
        loadRecentFeedback();
    }, []);

    const loadRecentFeedback = async () => {
        try {
            const response = await fetch('/api/feedback/recent');
            const data = await response.json();
            setRecentFeedback(data);
        } catch (error) {
            console.error('Failed to load recent feedback:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('type', feedback.type);
            formData.append('rating', feedback.rating.toString());
            formData.append('title', feedback.title);
            formData.append('description', feedback.description);
            formData.append('category', feedback.category);
            formData.append('priority', feedback.priority);

            feedback.attachments.forEach((file, index) => {
                formData.append(`attachment_${index}`, file);
            });

            const response = await fetch('/api/feedback', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                toast({
                    title: '피드백이 성공적으로 제출되었습니다!',
                    description: '소중한 의견 감사합니다.',
                    status: 'success',
                    duration: 5000,
                    isClosable: true
                });

                setFeedback({
                    type: 'general',
                    rating: 5,
                    title: '',
                    description: '',
                    category: '',
                    priority: 'medium',
                    attachments: []
                });

                onClose();
                loadRecentFeedback();
            } else {
                throw new Error('Failed to submit feedback');
            }
        } catch (error) {
            toast({
                title: '피드백 제출 실패',
                description: '다시 시도해주세요.',
                status: 'error',
                duration: 5000,
                isClosable: true
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setFeedback(prev => ({
                ...prev,
                attachments: [...prev.attachments, ...files]
            }));
        }
    };

    const removeAttachment = (index: number) => {
        setFeedback(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'bug': return <BugIcon color="red.500" />;
            case 'feature': return <LightbulbIcon color="blue.500" />;
            case 'improvement': return <StarIcon color="green.500" />;
            default: return <ChatIcon color="gray.500" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'red';
            case 'high': return 'orange';
            case 'medium': return 'yellow';
            case 'low': return 'green';
            default: return 'gray';
        }
    };

    return (
        <>
            {/* Feedback Button */}
            <Box position="fixed" bottom="20px" right="20px" zIndex={1000}>
                <Button
                    onClick={onOpen}
                    colorScheme="blue"
                    size="lg"
                    borderRadius="full"
                    boxShadow="lg"
                    _hover={{ transform: 'scale(1.05)' }}
                    transition="all 0.2s"
                >
                    <ChatIcon mr={2} />
                    피드백
                </Button>
            </Box>

            {/* Feedback Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>피드백 제출</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <form onSubmit={handleSubmit}>
                            <VStack spacing={4} align="stretch">
                                {/* Rating */}
                                <FormControl>
                                    <FormLabel>만족도 평가</FormLabel>
                                    <HStack>
                                        <Text>1</Text>
                                        <Rating
                                            value={feedback.rating}
                                            onChange={(value) => setFeedback(prev => ({ ...prev, rating: value }))}
                                            size="lg"
                                        />
                                        <Text>5</Text>
                                    </HStack>
                                </FormControl>

                                {/* Type */}
                                <FormControl isRequired>
                                    <FormLabel>피드백 유형</FormLabel>
                                    <Select
                                        value={feedback.type}
                                        onChange={(e) => setFeedback(prev => ({ ...prev, type: e.target.value as any }))}
                                    >
                                        <option value="general">일반 피드백</option>
                                        <option value="bug">버그 신고</option>
                                        <option value="feature">기능 요청</option>
                                        <option value="improvement">개선 제안</option>
                                    </Select>
                                </FormControl>

                                {/* Title */}
                                <FormControl isRequired>
                                    <FormLabel>제목</FormLabel>
                                    <Input
                                        value={feedback.title}
                                        onChange={(e) => setFeedback(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="피드백 제목을 입력하세요"
                                    />
                                </FormControl>

                                {/* Description */}
                                <FormControl isRequired>
                                    <FormLabel>상세 설명</FormLabel>
                                    <Textarea
                                        value={feedback.description}
                                        onChange={(e) => setFeedback(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="자세한 내용을 입력하세요"
                                        rows={4}
                                    />
                                </FormControl>

                                {/* Category */}
                                <FormControl>
                                    <FormLabel>카테고리</FormLabel>
                                    <Select
                                        value={feedback.category}
                                        onChange={(e) => setFeedback(prev => ({ ...prev, category: e.target.value }))}
                                    >
                                        <option value="">카테고리 선택</option>
                                        <option value="ui-ux">UI/UX</option>
                                        <option value="performance">성능</option>
                                        <option value="functionality">기능</option>
                                        <option value="security">보안</option>
                                        <option value="accessibility">접근성</option>
                                        <option value="mobile">모바일</option>
                                        <option value="other">기타</option>
                                    </Select>
                                </FormControl>

                                {/* Priority */}
                                <FormControl>
                                    <FormLabel>우선순위</FormLabel>
                                    <Select
                                        value={feedback.priority}
                                        onChange={(e) => setFeedback(prev => ({ ...prev, priority: e.target.value as any }))}
                                    >
                                        <option value="low">낮음</option>
                                        <option value="medium">보통</option>
                                        <option value="high">높음</option>
                                        <option value="critical">긴급</option>
                                    </Select>
                                </FormControl>

                                {/* File Upload */}
                                <FormControl>
                                    <FormLabel>첨부 파일</FormLabel>
                                    <Input
                                        type="file"
                                        multiple
                                        onChange={handleFileUpload}
                                        accept="image/*,.pdf,.doc,.docx,.txt"
                                    />
                                    {feedback.attachments.length > 0 && (
                                        <VStack align="stretch" mt={2}>
                                            {feedback.attachments.map((file, index) => (
                                                <HStack key={index} justify="space-between">
                                                    <Text fontSize="sm">{file.name}</Text>
                                                    <IconButton
                                                        aria-label="Remove file"
                                                        icon={<CloseIcon />}
                                                        size="sm"
                                                        onClick={() => removeAttachment(index)}
                                                    />
                                                </HStack>
                                            ))}
                                        </VStack>
                                    )}
                                </FormControl>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    colorScheme="blue"
                                    isLoading={isSubmitting}
                                    loadingText="제출 중..."
                                >
                                    피드백 제출
                                </Button>
                            </VStack>
                        </form>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Recent Feedback Display */}
            {recentFeedback.length > 0 && (
                <Box position="fixed" bottom="80px" right="20px" zIndex={999} maxW="300px">
                    <Box bg="white" p={4} borderRadius="md" boxShadow="lg" border="1px solid" borderColor="gray.200">
                        <Text fontWeight="bold" mb={2}>최근 피드백</Text>
                        <VStack align="stretch" spacing={2}>
                            {recentFeedback.slice(0, 3).map((item) => (
                                <Box key={item.id} p={2} bg="gray.50" borderRadius="md">
                                    <HStack justify="space-between" mb={1}>
                                        <HStack>
                                            {getTypeIcon(item.type)}
                                            <Text fontSize="sm" fontWeight="medium">{item.title}</Text>
                                        </HStack>
                                        <Badge colorScheme={getPriorityColor(item.priority)} size="sm">
                                            {item.priority}
                                        </Badge>
                                    </HStack>
                                    <Text fontSize="xs" color="gray.600" noOfLines={2}>
                                        {item.description}
                                    </Text>
                                    <HStack justify="space-between" mt={1}>
                                        <Text fontSize="xs" color="gray.500">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </Text>
                                        <HStack>
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <StarIcon
                                                    key={i}
                                                    color={i < item.rating ? 'yellow.400' : 'gray.300'}
                                                    boxSize={3}
                                                />
                                            ))}
                                        </HStack>
                                    </HStack>
                                </Box>
                            ))}
                        </VStack>
                    </Box>
                </Box>
            )}
        </>
    );
};

export default FeedbackSystem;
