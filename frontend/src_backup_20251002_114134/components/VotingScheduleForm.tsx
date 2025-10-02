import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    FormControl,
    FormLabel,
    Input,
    Switch,
    Button,
    Alert,
    AlertIcon,
    Divider,
    Badge,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    ModalFooter,
    useDisclosure
} from '@chakra-ui/react';
import { CalendarIcon, TimeIcon, InfoIcon } from '@chakra-ui/icons';

export interface VotingScheduleData {
    startDate?: Date;
    endDate?: Date;
    isScheduled: boolean;
    timezone: string;
    duration?: number; // 시간 단위
}

interface VotingScheduleFormProps {
    initialData?: VotingScheduleData;
    onScheduleChange: (data: VotingScheduleData) => void;
    onSave?: (data: VotingScheduleData) => Promise<void>;
    disabled?: boolean;
    showPreview?: boolean;
}

const VotingScheduleForm: React.FC<VotingScheduleFormProps> = ({
    initialData = {
        isScheduled: false,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    onScheduleChange,
    onSave,
    disabled = false,
    showPreview = true
}) => {
    const [scheduleData, setScheduleData] = useState<VotingScheduleData>(initialData);
    const [isValid, setIsValid] = useState(true);
    const [validationMessage, setValidationMessage] = useState('');
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    // 현재 시간
    const now = new Date();
    const minDate = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM 형식

    // 시간대 옵션들
    const timezones = [
        'Asia/Seoul',
        'UTC',
        'America/New_York',
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Paris',
        'Asia/Tokyo',
        'Asia/Shanghai'
    ];

    // 유효성 검사
    useEffect(() => {
        validateSchedule();
    }, [scheduleData]);

    const validateSchedule = () => {
        if (!scheduleData.isScheduled) {
            setIsValid(true);
            setValidationMessage('');
            return;
        }

        const { startDate, endDate } = scheduleData;

        if (!startDate) {
            setIsValid(false);
            setValidationMessage('시작 시간을 설정해주세요.');
            return;
        }

        if (!endDate) {
            setIsValid(false);
            setValidationMessage('종료 시간을 설정해주세요.');
            return;
        }

        if (startDate <= now) {
            setIsValid(false);
            setValidationMessage('시작 시간은 현재 시간보다 늦어야 합니다.');
            return;
        }

        if (endDate <= startDate) {
            setIsValid(false);
            setValidationMessage('종료 시간은 시작 시간보다 늦어야 합니다.');
            return;
        }

        // 최대 1년 제한
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

        if (endDate > oneYearFromNow) {
            setIsValid(false);
            setValidationMessage('투표 기간은 최대 1년까지 설정할 수 있습니다.');
            return;
        }

        // 최소 1시간 제한
        const minDuration = 60 * 60 * 1000; // 1시간 (밀리초)
        if (endDate.getTime() - startDate.getTime() < minDuration) {
            setIsValid(false);
            setValidationMessage('투표 기간은 최소 1시간이어야 합니다.');
            return;
        }

        setIsValid(true);
        setValidationMessage('');
    };

    // 스케줄 데이터 업데이트
    const updateScheduleData = (updates: Partial<VotingScheduleData>) => {
        const newData = { ...scheduleData, ...updates };
        setScheduleData(newData);
        onScheduleChange(newData);
    };

    // 시작 시간 변경
    const handleStartDateChange = (value: string) => {
        const startDate = new Date(value);
        updateScheduleData({ startDate });
    };

    // 종료 시간 변경
    const handleEndDateChange = (value: string) => {
        const endDate = new Date(value);
        updateScheduleData({ endDate });
    };

    // 기간 설정 (시간 단위)
    const handleDurationChange = (hours: number) => {
        if (!scheduleData.startDate) return;

        const startDate = new Date(scheduleData.startDate);
        const endDate = new Date(startDate.getTime() + hours * 60 * 60 * 1000);

        updateScheduleData({ endDate, duration: hours });
    };

    // 빠른 설정 버튼들
    const quickDurations = [
        { label: '1시간', hours: 1 },
        { label: '6시간', hours: 6 },
        { label: '1일', hours: 24 },
        { label: '3일', hours: 72 },
        { label: '1주일', hours: 168 },
        { label: '1개월', hours: 720 }
    ];

    // 시간대 변경
    const handleTimezoneChange = (timezone: string) => {
        updateScheduleData({ timezone });
    };

    // 저장
    const handleSave = async () => {
        if (!isValid) {
            toast({
                title: '유효하지 않은 설정',
                description: validationMessage,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (onSave) {
            try {
                await onSave(scheduleData);
                toast({
                    title: '스케줄 저장 완료',
                    description: '투표 스케줄이 성공적으로 저장되었습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            } catch (error) {
                toast({
                    title: '저장 실패',
                    description: '투표 스케줄 저장 중 오류가 발생했습니다.',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
        }
    };

    // 미리보기 데이터
    const getPreviewData = () => {
        if (!scheduleData.isScheduled || !scheduleData.startDate || !scheduleData.endDate) {
            return null;
        }

        const start = new Date(scheduleData.startDate);
        const end = new Date(scheduleData.endDate);
        const duration = end.getTime() - start.getTime();
        const durationHours = Math.floor(duration / (1000 * 60 * 60));
        const durationMinutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

        return {
            start: start.toLocaleString('ko-KR', { timeZone: scheduleData.timezone }),
            end: end.toLocaleString('ko-KR', { timeZone: scheduleData.timezone }),
            duration: `${durationHours}시간 ${durationMinutes}분`,
            timezone: scheduleData.timezone
        };
    };

    const preview = getPreviewData();

    return (
        <Box className="voting-schedule-form">
            <VStack spacing={4} align="stretch">
                {/* 스케줄 활성화 토글 */}
                <FormControl>
                    <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                            <FormLabel mb={0} fontWeight="semibold">
                                투표 기간 설정
                            </FormLabel>
                            <Text fontSize="sm" color="gray.600">
                                특정 시간에 투표를 시작하고 종료하도록 설정할 수 있습니다.
                            </Text>
                        </VStack>
                        <Switch
                            isChecked={scheduleData.isScheduled}
                            onChange={(e) => updateScheduleData({ isScheduled: e.target.checked })}
                            isDisabled={disabled}
                            colorScheme="blue"
                        />
                    </HStack>
                </FormControl>

                {scheduleData.isScheduled && (
                    <>
                        <Divider />

                        {/* 시작 시간 */}
                        <FormControl isRequired>
                            <FormLabel>시작 시간</FormLabel>
                            <Input
                                type="datetime-local"
                                value={scheduleData.startDate?.toISOString().slice(0, 16) || ''}
                                onChange={(e) => handleStartDateChange(e.target.value)}
                                min={minDate}
                                isDisabled={disabled}
                            />
                        </FormControl>

                        {/* 종료 시간 */}
                        <FormControl isRequired>
                            <FormLabel>종료 시간</FormLabel>
                            <Input
                                type="datetime-local"
                                value={scheduleData.endDate?.toISOString().slice(0, 16) || ''}
                                onChange={(e) => handleEndDateChange(e.target.value)}
                                min={scheduleData.startDate?.toISOString().slice(0, 16) || minDate}
                                isDisabled={disabled}
                            />
                        </FormControl>

                        {/* 빠른 기간 설정 */}
                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.600">
                                빠른 설정
                            </FormLabel>
                            <HStack wrap="wrap" spacing={2}>
                                {quickDurations.map(({ label, hours }) => (
                                    <Button
                                        key={hours}
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDurationChange(hours)}
                                        isDisabled={!scheduleData.startDate || disabled}
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </HStack>
                        </FormControl>

                        {/* 시간대 설정 */}
                        <FormControl>
                            <FormLabel>시간대</FormLabel>
                            <Input
                                as="select"
                                value={scheduleData.timezone}
                                onChange={(e) => handleTimezoneChange(e.target.value)}
                                isDisabled={disabled}
                            >
                                {timezones.map((tz) => (
                                    <option key={tz} value={tz}>
                                        {tz} ({new Date().toLocaleString('ko-KR', { timeZone: tz })})
                                    </option>
                                ))}
                            </Input>
                        </FormControl>

                        {/* 유효성 검사 메시지 */}
                        {!isValid && (
                            <Alert status="error">
                                <AlertIcon />
                                {validationMessage}
                            </Alert>
                        )}

                        {/* 미리보기 */}
                        {showPreview && preview && (
                            <Box p={4} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                                <HStack mb={2}>
                                    <InfoIcon color="blue.500" />
                                    <Text fontWeight="semibold" color="blue.700">
                                        투표 스케줄 미리보기
                                    </Text>
                                </HStack>
                                <VStack align="start" spacing={1} fontSize="sm">
                                    <HStack>
                                        <CalendarIcon color="blue.500" />
                                        <Text>
                                            <strong>시작:</strong> {preview.start}
                                        </Text>
                                    </HStack>
                                    <HStack>
                                        <TimeIcon color="blue.500" />
                                        <Text>
                                            <strong>종료:</strong> {preview.end}
                                        </Text>
                                    </HStack>
                                    <Text>
                                        <strong>기간:</strong> {preview.duration}
                                    </Text>
                                    <Text>
                                        <strong>시간대:</strong> {preview.timezone}
                                    </Text>
                                </VStack>
                            </Box>
                        )}

                        {/* 저장 버튼 */}
                        {onSave && (
                            <Button
                                colorScheme="blue"
                                onClick={handleSave}
                                isDisabled={!isValid || disabled}
                                isLoading={false}
                            >
                                스케줄 저장
                            </Button>
                        )}
                    </>
                )}
            </VStack>
        </Box>
    );
};

export default VotingScheduleForm;
