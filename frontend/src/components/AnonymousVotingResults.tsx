import React from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Badge,
    Progress,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    SimpleGrid,
    Alert,
    AlertIcon,
    useColorModeValue,
    Tooltip,
    Icon
} from '@chakra-ui/react';
import { LockIcon, UnlockIcon, InfoIcon, ViewIcon } from '@chakra-ui/icons';

export interface AnonymousVotingResult {
    id: string;
    text: string;
    description?: string;
    votes: number;
    percentage: number;
    isAnonymous: boolean;
}

export interface AnonymousVotingResultsData {
    poll: {
        id: string;
        title: string;
        allowAnonymous: boolean;
        totalVotes: number;
        anonymousVotes: number;
        registeredVotes: number;
    };
    results: AnonymousVotingResult[];
    showVoterDetails?: boolean;
    isAdmin?: boolean;
}

interface AnonymousVotingResultsProps {
    data: AnonymousVotingResultsData;
    showVoterCount?: boolean;
    showVoterDetails?: boolean;
    isAdmin?: boolean;
}

const AnonymousVotingResults: React.FC<AnonymousVotingResultsProps> = ({
    data,
    showVoterCount = true,
    showVoterDetails = false,
    isAdmin = false
}) => {
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const anonymousBgColor = useColorModeValue('blue.50', 'blue.900');
    const anonymousBorderColor = useColorModeValue('blue.200', 'blue.700');

    const { poll, results } = data;
    const totalVotes = poll.totalVotes;
    const anonymousVotes = poll.anonymousVotes;
    const registeredVotes = poll.registeredVotes;

    // 익명 투표 비율 계산
    const anonymousPercentage = totalVotes > 0 ? ((anonymousVotes / totalVotes) * 100).toFixed(1) : '0';
    const registeredPercentage = totalVotes > 0 ? ((registeredVotes / totalVotes) * 100).toFixed(1) : '0';

    // 투표자 정보 표시 여부 결정
    const canShowVoterDetails = isAdmin && showVoterDetails;

    return (
        <Box className="anonymous-voting-results" p={6} bg={bgColor} borderRadius="lg" border="1px solid" borderColor={borderColor}>
            <VStack spacing={4} align="stretch">
                {/* 헤더 */}
                <VStack spacing={2} align="start">
                    <HStack spacing={2}>
                        <Text fontSize="lg" fontWeight="bold">
                            {poll.title}
                        </Text>
                        {poll.allowAnonymous ? (
                            <Badge colorScheme="blue" variant="solid">
                                <HStack spacing={1}>
                                    <UnlockIcon />
                                    <Text>익명 투표</Text>
                                </HStack>
                            </Badge>
                        ) : (
                            <Badge colorScheme="red" variant="solid">
                                <HStack spacing={1}>
                                    <LockIcon />
                                    <Text>실명 투표</Text>
                                </HStack>
                            </Badge>
                        )}
                    </HStack>

                    {/* 투표 통계 */}
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
                        <Stat>
                            <StatLabel>총 투표수</StatLabel>
                            <StatNumber>{totalVotes}</StatNumber>
                            <StatHelpText>표</StatHelpText>
                        </Stat>

                        {poll.allowAnonymous && (
                            <>
                                <Stat>
                                    <StatLabel>익명 투표</StatLabel>
                                    <StatNumber color="blue.500">{anonymousVotes}</StatNumber>
                                    <StatHelpText>{anonymousPercentage}%</StatHelpText>
                                </Stat>

                                <Stat>
                                    <StatLabel>실명 투표</StatLabel>
                                    <StatNumber color="green.500">{registeredVotes}</StatNumber>
                                    <StatHelpText>{registeredPercentage}%</StatHelpText>
                                </Stat>
                            </>
                        )}
                    </SimpleGrid>
                </VStack>

                {/* 익명 투표 안내 */}
                {poll.allowAnonymous && (
                    <Alert status="info" borderRadius="md" bg={anonymousBgColor} borderColor={anonymousBorderColor}>
                        <AlertIcon />
                        <VStack align="start" spacing={1}>
                            <Text fontSize="sm" fontWeight="medium">
                                익명 투표 결과
                            </Text>
                            <Text fontSize="xs">
                                투표자 개인정보는 보호되며, 집계된 결과만 표시됩니다.
                                {canShowVoterDetails && ' (관리자: 상세 정보 표시됨)'}
                            </Text>
                        </VStack>
                    </Alert>
                )}

                {/* 투표 결과 */}
                <VStack spacing={3} align="stretch">
                    {results
                        .sort((a, b) => b.votes - a.votes)
                        .map((result, index) => (
                            <Box key={result.id} p={4} border="1px solid" borderColor={borderColor} borderRadius="md">
                                <HStack justify="space-between" mb={2}>
                                    <HStack spacing={2}>
                                        <Text fontWeight="bold" color={index < 3 ? 'blue.600' : 'gray.600'}>
                                            #{index + 1}
                                        </Text>
                                        <Text fontWeight="medium">{result.text}</Text>
                                        {result.isAnonymous && poll.allowAnonymous && (
                                            <Tooltip label="익명 투표로 집계됨">
                                                <Icon as={UnlockIcon} color="blue.500" boxSize={3} />
                                            </Tooltip>
                                        )}
                                    </HStack>

                                    <HStack spacing={2}>
                                        <Text fontWeight="bold" fontSize="lg">
                                            {result.votes}
                                        </Text>
                                        <Text fontSize="sm" color="gray.600">
                                            표
                                        </Text>
                                        <Badge colorScheme="blue" variant="subtle">
                                            {result.percentage}%
                                        </Badge>
                                    </HStack>
                                </HStack>

                                <Progress
                                    value={parseFloat(result.percentage)}
                                    colorScheme="blue"
                                    size="lg"
                                    borderRadius="md"
                                    bg="gray.100"
                                />

                                {result.description && (
                                    <Text fontSize="sm" color="gray.600" mt={2}>
                                        {result.description}
                                    </Text>
                                )}

                                {/* 관리자용 상세 정보 */}
                                {canShowVoterDetails && (
                                    <Box mt={2} p={2} bg="gray.50" borderRadius="md">
                                        <HStack spacing={4} fontSize="xs" color="gray.600">
                                            <Text>
                                                <strong>투표 타입:</strong> {result.isAnonymous ? '익명' : '실명'}
                                            </Text>
                                            <Text>
                                                <strong>집계 시간:</strong> {new Date().toLocaleString()}
                                            </Text>
                                        </HStack>
                                    </Box>
                                )}
                            </Box>
                        ))}
                </VStack>

                {/* 투표자 정보 요약 */}
                {showVoterCount && (
                    <Box p={3} bg="gray.50" borderRadius="md">
                        <HStack spacing={4} fontSize="sm">
                            <HStack>
                                <ViewIcon color="gray.500" />
                                <Text>
                                    <strong>총 투표자:</strong> {totalVotes}명
                                </Text>
                            </HStack>

                            {poll.allowAnonymous && (
                                <>
                                    <HStack>
                                        <UnlockIcon color="blue.500" />
                                        <Text color="blue.600">
                                            <strong>익명:</strong> {anonymousVotes}명 ({anonymousPercentage}%)
                                        </Text>
                                    </HStack>

                                    <HStack>
                                        <LockIcon color="green.500" />
                                        <Text color="green.600">
                                            <strong>실명:</strong> {registeredVotes}명 ({registeredPercentage}%)
                                        </Text>
                                    </HStack>
                                </>
                            )}
                        </HStack>
                    </Box>
                )}

                {/* 관리자 전용 정보 */}
                {isAdmin && (
                    <Box p={3} bg="purple.50" borderRadius="md" border="1px solid" borderColor="purple.200">
                        <HStack spacing={2} mb={2}>
                            <InfoIcon color="purple.500" />
                            <Text fontSize="sm" fontWeight="medium" color="purple.700">
                                관리자 정보
                            </Text>
                        </HStack>
                        <VStack align="start" spacing={1} fontSize="xs" color="purple.600">
                            <Text>• 투표 상세 기록은 데이터베이스에서 확인 가능</Text>
                            <Text>• 익명 투표는 IP 주소만 기록됨</Text>
                            <Text>• 실명 투표는 사용자 ID와 연결됨</Text>
                            <Text>• 투표 시간 및 기기 정보 추적 가능</Text>
                        </VStack>
                    </Box>
                )}
            </VStack>
        </Box>
    );
};

export default AnonymousVotingResults;
