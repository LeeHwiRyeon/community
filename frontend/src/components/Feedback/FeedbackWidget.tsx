import React, { useState } from 'react';
import {
    Box,
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Textarea,
    Select,
    VStack,
    HStack,
    Text,
    useToast,
    IconButton,
    Tooltip,
    Badge
} from '@chakra-ui/react';
import { ChatIcon, CloseIcon } from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

interface FeedbackWidgetProps {
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({
    position = 'bottom-right'
}) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { t } = useTranslation();
    const { isDark } = useTheme();
    const toast = useToast();

    const [feedback, setFeedback] = useState('');
    const [category, setCategory] = useState('');
    const [rating, setRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const positionStyles = {
        'bottom-right': { bottom: 4, right: 4 },
        'bottom-left': { bottom: 4, left: 4 },
        'top-right': { top: 4, right: 4 },
        'top-left': { top: 4, left: 4 }
    };

    const handleSubmit = async () => {
        if (!feedback.trim() || !category) {
            toast({
                title: t('forms.required'),
                status: 'warning',
                duration: 3000,
                isClosable: true
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // 피드백 제출 API 호출
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    feedback,
                    category,
                    rating,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    url: window.location.href
                })
            });

            if (response.ok) {
                toast({
                    title: t('messages.feedbackSubmitted'),
                    description: t('messages.thankYouForFeedback'),
                    status: 'success',
                    duration: 5000,
                    isClosable: true
                });

                // 폼 초기화
                setFeedback('');
                setCategory('');
                setRating(0);
                onClose();
            } else {
                throw new Error('Failed to submit feedback');
            }
        } catch (error) {
            toast({
                title: t('errors.unknownError'),
                description: t('errors.tryAgainLater'),
                status: 'error',
                duration: 5000,
                isClosable: true
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* 피드백 버튼 */}
            <Box
                position="fixed"
                {...positionStyles[position]}
                zIndex={1000}
            >
                <Tooltip label={t('feedback.giveFeedback')} placement="left">
                    <IconButton
                        aria-label={t('feedback.giveFeedback')}
                        icon={<ChatIcon />}
                        onClick={onOpen}
                        size="lg"
                        colorScheme="blue"
                        borderRadius="full"
                        boxShadow="lg"
                        _hover={{
                            transform: 'scale(1.1)',
                            boxShadow: 'xl'
                        }}
                        transition="all 0.2s"
                    />
                </Tooltip>
            </Box>

            {/* 피드백 모달 */}
            <Modal isOpen={isOpen} onClose={onClose} size="md">
                <ModalOverlay />
                <ModalContent bg={isDark ? 'gray.800' : 'white'}>
                    <ModalHeader color={isDark ? 'white' : 'gray.800'}>
                        {t('feedback.title')}
                    </ModalHeader>
                    <ModalCloseButton />

                    <ModalBody pb={6}>
                        <VStack spacing={4} align="stretch">
                            {/* 카테고리 선택 */}
                            <Box>
                                <Text mb={2} color={isDark ? 'white' : 'gray.700'}>
                                    {t('feedback.category')} *
                                </Text>
                                <Select
                                    placeholder={t('feedback.selectCategory')}
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    bg={isDark ? 'gray.700' : 'white'}
                                    color={isDark ? 'white' : 'gray.800'}
                                >
                                    <option value="bug">{t('feedback.categories.bug')}</option>
                                    <option value="feature">{t('feedback.categories.feature')}</option>
                                    <option value="improvement">{t('feedback.categories.improvement')}</option>
                                    <option value="ui">{t('feedback.categories.ui')}</option>
                                    <option value="performance">{t('feedback.categories.performance')}</option>
                                    <option value="other">{t('feedback.categories.other')}</option>
                                </Select>
                            </Box>

                            {/* 평점 */}
                            <Box>
                                <Text mb={2} color={isDark ? 'white' : 'gray.700'}>
                                    {t('feedback.rating')}
                                </Text>
                                <HStack spacing={1}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Button
                                            key={star}
                                            size="sm"
                                            variant="ghost"
                                            color={star <= rating ? 'yellow.400' : 'gray.400'}
                                            onClick={() => setRating(star)}
                                            _hover={{
                                                color: 'yellow.400'
                                            }}
                                        >
                                            ⭐
                                        </Button>
                                    ))}
                                </HStack>
                            </Box>

                            {/* 피드백 내용 */}
                            <Box>
                                <Text mb={2} color={isDark ? 'white' : 'gray.700'}>
                                    {t('feedback.message')} *
                                </Text>
                                <Textarea
                                    placeholder={t('feedback.placeholder')}
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    rows={4}
                                    bg={isDark ? 'gray.700' : 'white'}
                                    color={isDark ? 'white' : 'gray.800'}
                                    resize="vertical"
                                />
                            </Box>

                            {/* 제출 버튼 */}
                            <HStack spacing={3} justify="flex-end">
                                <Button
                                    variant="ghost"
                                    onClick={onClose}
                                    color={isDark ? 'white' : 'gray.600'}
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    colorScheme="blue"
                                    onClick={handleSubmit}
                                    isLoading={isSubmitting}
                                    loadingText={t('common.submitting')}
                                    isDisabled={!feedback.trim() || !category}
                                >
                                    {t('common.submit')}
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
};

// 피드백 통계 컴포넌트 (관리자용)
export const FeedbackStats: React.FC = () => {
    const { t } = useTranslation();
    const { isDark } = useTheme();
    const [stats, setStats] = useState({
        total: 0,
        byCategory: {},
        averageRating: 0,
        recentCount: 0
    });

    // 피드백 통계 로드
    React.useEffect(() => {
        const loadStats = async () => {
            try {
                const response = await fetch('/api/feedback/stats');
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error('Failed to load feedback stats:', error);
            }
        };

        loadStats();
    }, []);

    return (
        <Box p={6} bg={isDark ? 'gray.800' : 'white'} borderRadius="md" boxShadow="md">
            <Text fontSize="xl" fontWeight="bold" mb={4} color={isDark ? 'white' : 'gray.800'}>
                {t('feedback.stats.title')}
            </Text>

            <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                    <Text color={isDark ? 'white' : 'gray.700'}>
                        {t('feedback.stats.total')}
                    </Text>
                    <Badge colorScheme="blue" fontSize="md">
                        {stats.total}
                    </Badge>
                </HStack>

                <HStack justify="space-between">
                    <Text color={isDark ? 'white' : 'gray.700'}>
                        {t('feedback.stats.averageRating')}
                    </Text>
                    <Badge colorScheme="green" fontSize="md">
                        {stats.averageRating.toFixed(1)} ⭐
                    </Badge>
                </HStack>

                <HStack justify="space-between">
                    <Text color={isDark ? 'white' : 'gray.700'}>
                        {t('feedback.stats.recent')}
                    </Text>
                    <Badge colorScheme="orange" fontSize="md">
                        {stats.recentCount}
                    </Badge>
                </HStack>
            </VStack>
        </Box>
    );
};
