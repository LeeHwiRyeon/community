import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Checkbox,
    Radio,
    RadioGroup,
    Progress,
    Badge,
    Divider,
    Alert,
    AlertIcon,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    Select,
    Switch
} from '@chakra-ui/react';
import { CalendarIcon, TimeIcon, LockIcon, UnlockIcon } from '@chakra-ui/icons';
import VotingResultsChart from './VotingResultsChart';
import VotingScheduleForm from './VotingScheduleForm';
import AnonymousVotingSettings from './AnonymousVotingSettings';
import AnonymousVotingResults from './AnonymousVotingResults';

// 투표 타입 정의
export type VotingType = 'single' | 'multiple' | 'rating' | 'ranking';
export type VotingStatus = 'draft' | 'active' | 'ended' | 'cancelled';

export interface VotingOption {
    id: string;
    text: string;
    description?: string;
    imageUrl?: string;
    order: number;
}

export interface VotingPoll {
    id: string;
    title: string;
    description?: string;
    type: VotingType;
    status: VotingStatus;
    options: VotingOption[];
    allowAnonymous: boolean;
    allowMultipleVotes: boolean;
    maxSelections?: number;
    startDate?: Date;
    endDate?: Date;
    totalVotes: number;
    userVotes?: string[]; // 사용자가 선택한 옵션 ID들
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}

interface AdvancedVotingSystemProps {
    poll: VotingPoll;
    onVote?: (optionIds: string[]) => Promise<void>;
    onEdit?: (poll: VotingPoll) => void;
    onDelete?: (pollId: string) => void;
    canEdit?: boolean;
    canVote?: boolean;
}

const AdvancedVotingSystem: React.FC<AdvancedVotingSystemProps> = ({
    poll,
    onVote,
    onEdit,
    onDelete,
    canEdit = false,
    canVote = true
}) => {
    const [selectedOptions, setSelectedOptions] = useState<string[]>(poll.userVotes || []);
    const [isVoting, setIsVoting] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [chartType, setChartType] = useState<'bar' | 'pie' | 'line' | 'area' | 'progress'>('bar');
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [showAnonymousSettings, setShowAnonymousSettings] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    // 투표 상태 확인
    const isActive = poll.status === 'active';
    const isEnded = poll.status === 'ended';
    const canUserVote = canVote && isActive && !isEnded;

    // 투표 옵션 선택 처리
    const handleOptionSelect = (optionId: string) => {
        if (!canUserVote) return;

        if (poll.type === 'single') {
            setSelectedOptions([optionId]);
        } else if (poll.type === 'multiple') {
            const maxSelections = poll.maxSelections || poll.options.length;
            if (selectedOptions.includes(optionId)) {
                setSelectedOptions(prev => prev.filter(id => id !== optionId));
            } else if (selectedOptions.length < maxSelections) {
                setSelectedOptions(prev => [...prev, optionId]);
            } else {
                toast({
                    title: '최대 선택 수 초과',
                    description: `최대 ${maxSelections}개까지만 선택할 수 있습니다.`,
                    status: 'warning',
                    duration: 3000,
                    isClosable: true,
                });
            }
        } else if (poll.type === 'ranking') {
            // 순위 투표 로직 (추후 구현)
            setSelectedOptions([optionId]);
        }
    };

    // 투표 제출
    const handleVoteSubmit = async () => {
        if (!onVote || selectedOptions.length === 0) return;

        setIsVoting(true);
        try {
            await onVote(selectedOptions);
            toast({
                title: '투표 완료',
                description: '투표가 성공적으로 제출되었습니다.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            setShowResults(true);
        } catch (error) {
            toast({
                title: '투표 실패',
                description: '투표 제출 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsVoting(false);
        }
    };

    // 투표 결과 계산
    const getVoteResults = () => {
        // 실제 구현에서는 서버에서 결과를 받아와야 함
        const results = poll.options.map(option => ({
            ...option,
            votes: Math.floor(Math.random() * 100), // 임시 데이터
            percentage: 0
        }));

        const totalVotes = results.reduce((sum, option) => sum + option.votes, 0);

        return results.map(option => ({
            ...option,
            percentage: totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(1) : 0
        }));
    };

    const results = getVoteResults();
    const totalVotes = results.reduce((sum, option) => sum + option.votes, 0);

    // 투표 상태 표시
    const getStatusBadge = () => {
        const statusConfig = {
            draft: { color: 'gray', text: '초안' },
            active: { color: 'green', text: '진행중' },
            ended: { color: 'red', text: '종료' },
            cancelled: { color: 'orange', text: '취소' }
        };

        const config = statusConfig[poll.status];
        return (
            <Badge colorScheme={config.color} variant="solid">
                {config.text}
            </Badge>
        );
    };

    // 투표 옵션 렌더링
    const renderVotingOptions = () => {
        if (showResults || isEnded) {
            return (
                <VStack spacing={4} align="stretch">
                    {results.map((option, index) => (
                        <Box key={option.id} p={4} border="1px solid" borderColor="gray.200" borderRadius="md">
                            <HStack justify="space-between" mb={2}>
                                <Text fontWeight="medium">{option.text}</Text>
                                <HStack>
                                    <Text fontSize="sm" color="gray.600">
                                        {option.votes}표 ({((option.votes / totalVotes) * 100).toFixed(1)}%)
                                    </Text>
                                    {selectedOptions.includes(option.id) && (
                                        <Badge colorScheme="blue">선택됨</Badge>
                                    )}
                                </HStack>
                            </HStack>
                            <Progress
                                value={(option.votes / totalVotes) * 100}
                                colorScheme="blue"
                                size="sm"
                                borderRadius="md"
                            />
                            {option.description && (
                                <Text fontSize="sm" color="gray.600" mt={2}>
                                    {option.description}
                                </Text>
                            )}
                        </Box>
                    ))}
                </VStack>
            );
        }

        return (
            <VStack spacing={3} align="stretch">
                {poll.options.map((option) => {
                    const isSelected = selectedOptions.includes(option.id);
                    const isDisabled = !canUserVote ||
                        (poll.type === 'multiple' &&
                            !isSelected &&
                            selectedOptions.length >= (poll.maxSelections || poll.options.length));

                    return (
                        <Box
                            key={option.id}
                            p={4}
                            border="2px solid"
                            borderColor={isSelected ? 'blue.300' : 'gray.200'}
                            borderRadius="md"
                            cursor={canUserVote ? 'pointer' : 'not-allowed'}
                            bg={isSelected ? 'blue.50' : 'white'}
                            onClick={() => handleOptionSelect(option.id)}
                            _hover={canUserVote ? { borderColor: 'blue.400' } : {}}
                            transition="all 0.2s"
                        >
                            <HStack spacing={3}>
                                {poll.type === 'single' ? (
                                    <Radio
                                        value={option.id}
                                        isChecked={isSelected}
                                        isDisabled={!canUserVote}
                                        onChange={() => handleOptionSelect(option.id)}
                                    />
                                ) : (
                                    <Checkbox
                                        isChecked={isSelected}
                                        isDisabled={isDisabled}
                                        onChange={() => handleOptionSelect(option.id)}
                                    />
                                )}
                                <VStack align="start" spacing={1} flex={1}>
                                    <Text fontWeight="medium">{option.text}</Text>
                                    {option.description && (
                                        <Text fontSize="sm" color="gray.600">
                                            {option.description}
                                        </Text>
                                    )}
                                </VStack>
                                {option.imageUrl && (
                                    <Box w="60px" h="40px" bg="gray.100" borderRadius="md" overflow="hidden">
                                        <img
                                            src={option.imageUrl}
                                            alt={option.text}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </Box>
                                )}
                            </HStack>
                        </Box>
                    );
                })}
            </VStack>
        );
    };

    return (
        <Box className="advanced-voting-system">
            {/* 투표 헤더 */}
            <VStack spacing={4} align="stretch">
                <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={2}>
                        <HStack>
                            <Text fontSize="xl" fontWeight="bold">
                                {poll.title}
                            </Text>
                            {getStatusBadge()}
                        </HStack>
                        {poll.description && (
                            <Text color="gray.600">{poll.description}</Text>
                        )}
                    </VStack>
                    {canEdit && (
                        <HStack>
                            <Button size="sm" variant="outline" onClick={onOpen}>
                                편집
                            </Button>
                            <Button size="sm" colorScheme="red" variant="outline" onClick={() => onDelete?.(poll.id)}>
                                삭제
                            </Button>
                        </HStack>
                    )}
                </HStack>

                {/* 투표 정보 */}
                <HStack spacing={4} fontSize="sm" color="gray.600" wrap="wrap">
                    <HStack>
                        <CalendarIcon />
                        <Text>
                            {poll.startDate ? `시작: ${poll.startDate.toLocaleDateString()}` : '즉시 시작'}
                        </Text>
                    </HStack>
                    {poll.endDate && (
                        <HStack>
                            <TimeIcon />
                            <Text>종료: {poll.endDate.toLocaleDateString()}</Text>
                        </HStack>
                    )}
                    <HStack>
                        {poll.allowAnonymous ? <UnlockIcon /> : <LockIcon />}
                        <Text>{poll.allowAnonymous ? '익명 투표' : '실명 투표'}</Text>
                    </HStack>
                    <Text>총 {poll.totalVotes}표</Text>
                    {canEdit && (
                        <HStack spacing={2}>
                            <Button
                                size="xs"
                                variant="outline"
                                onClick={() => setShowScheduleForm(!showScheduleForm)}
                            >
                                {showScheduleForm ? '스케줄 숨기기' : '스케줄 설정'}
                            </Button>
                            <Button
                                size="xs"
                                variant="outline"
                                onClick={() => setShowAnonymousSettings(!showAnonymousSettings)}
                            >
                                {showAnonymousSettings ? '익명 설정 숨기기' : '익명 설정'}
                            </Button>
                        </HStack>
                    )}
                </HStack>

                {/* 스케줄 설정 폼 */}
                {showScheduleForm && canEdit && (
                    <Box p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                        <VotingScheduleForm
                            initialData={{
                                isScheduled: !!(poll.startDate || poll.endDate),
                                startDate: poll.startDate,
                                endDate: poll.endDate,
                                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                            }}
                            onScheduleChange={(data) => {
                                // 스케줄 데이터 업데이트 로직
                                console.log('Schedule changed:', data);
                            }}
                            onSave={async (data) => {
                                // 스케줄 저장 로직
                                console.log('Saving schedule:', data);
                                toast({
                                    title: '스케줄 저장',
                                    description: '투표 스케줄이 업데이트되었습니다.',
                                    status: 'success',
                                    duration: 3000,
                                    isClosable: true,
                                });
                            }}
                            disabled={poll.status === 'ended'}
                            showPreview={true}
                        />
                    </Box>
                )}

                {/* 익명 투표 설정 폼 */}
                {showAnonymousSettings && canEdit && (
                    <Box p={4} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                        <AnonymousVotingSettings
                            settings={{
                                allowAnonymous: poll.allowAnonymous,
                                showVoterCount: true,
                                showVoterDetails: false,
                                requireLogin: true,
                                allowVoteChange: true,
                                maxVotesPerIP: 3
                            }}
                            onSettingsChange={(settings) => {
                                // 익명 투표 설정 업데이트 로직
                                console.log('Anonymous settings changed:', settings);
                            }}
                            disabled={poll.status === 'ended'}
                            isAdmin={canEdit}
                        />
                    </Box>
                )}

                <Divider />

                {/* 투표 옵션 */}
                {renderVotingOptions()}

                {/* 투표 제출 버튼 */}
                {canUserVote && !showResults && (
                    <VStack spacing={3}>
                        {/* 익명 투표 옵션 */}
                        {poll.allowAnonymous && (
                            <HStack justify="center" p={3} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                                <Text fontSize="sm" color="blue.700">
                                    투표 방식을 선택하세요:
                                </Text>
                                <HStack spacing={2}>
                                    <Button
                                        size="sm"
                                        variant={!isAnonymous ? 'solid' : 'outline'}
                                        colorScheme={!isAnonymous ? 'green' : 'gray'}
                                        onClick={() => setIsAnonymous(false)}
                                    >
                                        <HStack spacing={1}>
                                            <LockIcon />
                                            <Text>실명 투표</Text>
                                        </HStack>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={isAnonymous ? 'solid' : 'outline'}
                                        colorScheme={isAnonymous ? 'blue' : 'gray'}
                                        onClick={() => setIsAnonymous(true)}
                                    >
                                        <HStack spacing={1}>
                                            <UnlockIcon />
                                            <Text>익명 투표</Text>
                                        </HStack>
                                    </Button>
                                </HStack>
                            </HStack>
                        )}

                        <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.600">
                                {poll.type === 'multiple' && poll.maxSelections && (
                                    `최대 ${poll.maxSelections}개 선택 가능`
                                )}
                                {poll.allowAnonymous && (
                                    <Text color="blue.600">
                                        {isAnonymous ? ' (익명 투표)' : ' (실명 투표)'}
                                    </Text>
                                )}
                            </Text>
                            <Button
                                colorScheme="blue"
                                onClick={handleVoteSubmit}
                                isLoading={isVoting}
                                isDisabled={selectedOptions.length === 0}
                            >
                                투표하기
                            </Button>
                        </HStack>
                    </VStack>
                )}

                {/* 결과 보기 버튼 */}
                {!showResults && (isEnded || poll.totalVotes > 0) && (
                    <Button
                        variant="outline"
                        onClick={() => setShowResults(true)}
                    >
                        결과 보기
                    </Button>
                )}

                {/* 차트 타입 선택 */}
                {showResults && (
                    <HStack spacing={2} justify="center">
                        <Text fontSize="sm" color="gray.600">차트 타입:</Text>
                        {['bar', 'pie', 'line', 'area', 'progress'].map((type) => (
                            <Button
                                key={type}
                                size="sm"
                                variant={chartType === type ? 'solid' : 'outline'}
                                colorScheme={chartType === type ? 'blue' : 'gray'}
                                onClick={() => setChartType(type as any)}
                            >
                                {type === 'bar' ? '막대' :
                                    type === 'pie' ? '원형' :
                                        type === 'line' ? '선형' :
                                            type === 'area' ? '영역' : '진행률'}
                            </Button>
                        ))}
                    </HStack>
                )}

                {/* 투표 결과 차트 */}
                {showResults && (
                    <VStack spacing={4}>
                        {/* 익명 투표 결과 */}
                        {poll.allowAnonymous ? (
                            <AnonymousVotingResults
                                data={{
                                    poll: {
                                        id: poll.id,
                                        title: poll.title,
                                        allowAnonymous: poll.allowAnonymous,
                                        totalVotes: totalVotes,
                                        anonymousVotes: Math.floor(totalVotes * 0.6), // 임시 데이터
                                        registeredVotes: Math.floor(totalVotes * 0.4) // 임시 데이터
                                    },
                                    results: results.map(result => ({
                                        ...result,
                                        isAnonymous: Math.random() > 0.5 // 임시 데이터
                                    }))
                                }}
                                showVoterCount={true}
                                showVoterDetails={canEdit}
                                isAdmin={canEdit}
                            />
                        ) : (
                            <VotingResultsChart
                                data={{
                                    poll: {
                                        id: poll.id,
                                        title: poll.title,
                                        type: poll.type,
                                        status: poll.status,
                                        totalVotes: totalVotes
                                    },
                                    results: results
                                }}
                                chartType={chartType}
                                showPercentage={true}
                                showVoteCount={true}
                                colorScheme="blue"
                                height={300}
                            />
                        )}
                    </VStack>
                )}
            </VStack>

            {/* 투표 편집 모달 */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>투표 편집</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={4}>
                            <FormControl>
                                <FormLabel>투표 제목</FormLabel>
                                <Input value={poll.title} />
                            </FormControl>
                            <FormControl>
                                <FormLabel>투표 설명</FormLabel>
                                <Textarea value={poll.description || ''} />
                            </FormControl>
                            <FormControl>
                                <FormLabel>투표 타입</FormLabel>
                                <Select value={poll.type}>
                                    <option value="single">단일 선택</option>
                                    <option value="multiple">다중 선택</option>
                                    <option value="rating">평점</option>
                                    <option value="ranking">순위</option>
                                </Select>
                            </FormControl>
                            <HStack>
                                <Switch isChecked={poll.allowAnonymous} />
                                <Text>익명 투표 허용</Text>
                            </HStack>
                            <HStack>
                                <Switch isChecked={poll.allowMultipleVotes} />
                                <Text>중복 투표 허용</Text>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default AdvancedVotingSystem;
