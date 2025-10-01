import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Badge,
    Progress,
    Icon,
    Tooltip,
    useColorModeValue,
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    useDisclosure,
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
    CrownIcon,
    DiamondIcon,
    LockIcon,
    UnlockIcon,
    ChevronRightIcon,
    InfoIcon
} from '@chakra-ui/icons';

interface UserTier {
    id: string;
    name: string;
    displayName: string;
    color: string;
    icon: any;
    minPoints: number;
    maxPoints?: number;
    benefits: string[];
    privileges: string[];
    nextTier?: string;
    progressToNext: number;
}

interface UserTierSystemProps {
    userTier: string;
    userPoints: number;
    onTierUpgrade?: (newTier: string) => void;
    showUpgradeModal?: boolean;
}

const UserTierSystem: React.FC<UserTierSystemProps> = ({
    userTier,
    userPoints,
    onTierUpgrade,
    showUpgradeModal = true
}) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [currentTier, setCurrentTier] = useState<UserTier | null>(null);
    const [nextTier, setNextTier] = useState<UserTier | null>(null);

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const textColor = useColorModeValue('gray.600', 'gray.300');

    // 사용자 등급 정의
    const tiers: UserTier[] = [
        {
            id: 'bronze',
            name: 'Bronze',
            displayName: '브론즈',
            color: 'orange',
            icon: StarIcon,
            minPoints: 0,
            maxPoints: 99,
            benefits: [
                '기본 커뮤니티 참여',
                '게시글 작성 및 댓글',
                '기본 프로필 커스터마이징'
            ],
            privileges: [
                '일일 게시글 제한: 5개',
                '댓글 작성 제한: 20개',
                '파일 업로드: 5MB'
            ],
            nextTier: 'silver',
            progressToNext: 0
        },
        {
            id: 'silver',
            name: 'Silver',
            displayName: '실버',
            color: 'gray',
            icon: StarIcon,
            minPoints: 100,
            maxPoints: 499,
            benefits: [
                '모든 브론즈 혜택',
                '고급 프로필 테마',
                '우선 고객 지원',
                '커뮤니티 투표 참여'
            ],
            privileges: [
                '일일 게시글 제한: 15개',
                '댓글 작성 제한: 50개',
                '파일 업로드: 10MB',
                '이미지 갤러리 생성'
            ],
            nextTier: 'gold',
            progressToNext: 0
        },
        {
            id: 'gold',
            name: 'Gold',
            displayName: '골드',
            color: 'yellow',
            icon: CrownIcon,
            minPoints: 500,
            maxPoints: 999,
            benefits: [
                '모든 실버 혜택',
                '독점 이모지 및 스티커',
                '커뮤니티 관리 도구',
                '고급 분석 대시보드'
            ],
            privileges: [
                '일일 게시글 제한: 30개',
                '댓글 작성 제한: 100개',
                '파일 업로드: 25MB',
                '비디오 업로드 가능',
                '커스텀 이모지 사용'
            ],
            nextTier: 'platinum',
            progressToNext: 0
        },
        {
            id: 'platinum',
            name: 'Platinum',
            displayName: '플래티넘',
            color: 'blue',
            icon: DiamondIcon,
            minPoints: 1000,
            maxPoints: 1999,
            benefits: [
                '모든 골드 혜택',
                '독점 컨텐츠 접근',
                '1:1 관리자 상담',
                '베타 기능 조기 접근'
            ],
            privileges: [
                '일일 게시글 제한: 50개',
                '댓글 작성 제한: 200개',
                '파일 업로드: 50MB',
                '라이브 스트리밍 가능',
                '커스텀 테마 생성'
            ],
            nextTier: 'diamond',
            progressToNext: 0
        },
        {
            id: 'diamond',
            name: 'Diamond',
            displayName: '다이아몬드',
            color: 'purple',
            icon: DiamondIcon,
            minPoints: 2000,
            benefits: [
                '모든 플래티넘 혜택',
                'VIP 전용 라운지',
                '개인 맞춤형 기능',
                '커뮤니티 영향력 지수'
            ],
            privileges: [
                '무제한 게시글 작성',
                '무제한 댓글 작성',
                '파일 업로드: 100MB',
                '모든 고급 기능 사용',
                '커뮤니티 운영 권한'
            ],
            progressToNext: 0
        }
    ];

    useEffect(() => {
        const current = tiers.find(tier => tier.id === userTier);
        const next = current?.nextTier ? tiers.find(tier => tier.id === current.nextTier) : null;

        if (current) {
            const progressToNext = next ?
                Math.min(100, ((userPoints - current.minPoints) / (next.minPoints - current.minPoints)) * 100) : 100;

            setCurrentTier({ ...current, progressToNext });
            setNextTier(next ? { ...next, progressToNext: 0 } : null);
        }
    }, [userTier, userPoints]);

    const handleUpgrade = () => {
        if (nextTier && onTierUpgrade) {
            onTierUpgrade(nextTier.id);
        }
        onClose();
    };

    if (!currentTier) return null;

    return (
        <>
            <Box
                bg={bgColor}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="lg"
                p={4}
                shadow="sm"
                cursor="pointer"
                onClick={onOpen}
                _hover={{ shadow: 'md' }}
                transition="all 0.2s"
            >
                <HStack spacing={3} align="center">
                    <Box
                        p={2}
                        borderRadius="full"
                        bg={`${currentTier.color}.100`}
                        color={`${currentTier.color}.600`}
                    >
                        <Icon as={currentTier.icon} boxSize={5} />
                    </Box>

                    <VStack align="start" spacing={1} flex={1}>
                        <HStack spacing={2}>
                            <Text fontWeight="bold" fontSize="sm">
                                {currentTier.displayName}
                            </Text>
                            <Badge colorScheme={currentTier.color} variant="subtle">
                                {currentTier.name}
                            </Badge>
                        </HStack>

                        <Text fontSize="xs" color={textColor}>
                            {userPoints.toLocaleString()} 포인트
                        </Text>

                        {nextTier && (
                            <Box w="full">
                                <HStack justify="space-between" mb={1}>
                                    <Text fontSize="xs" color={textColor}>
                                        다음 등급까지
                                    </Text>
                                    <Text fontSize="xs" color={textColor}>
                                        {Math.round(currentTier.progressToNext)}%
                                    </Text>
                                </HStack>
                                <Progress
                                    value={currentTier.progressToNext}
                                    size="sm"
                                    colorScheme={currentTier.color}
                                    borderRadius="full"
                                />
                            </Box>
                        )}
                    </VStack>

                    <ChevronRightIcon boxSize={4} color={textColor} />
                </HStack>
            </Box>

            {/* 등급 상세 모달 */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        <HStack spacing={3}>
                            <Box
                                p={2}
                                borderRadius="full"
                                bg={`${currentTier.color}.100`}
                                color={`${currentTier.color}.600`}
                            >
                                <Icon as={currentTier.icon} boxSize={6} />
                            </Box>
                            <VStack align="start" spacing={0}>
                                <Text fontSize="lg" fontWeight="bold">
                                    {currentTier.displayName} 등급
                                </Text>
                                <Text fontSize="sm" color={textColor}>
                                    {userPoints.toLocaleString()} 포인트 보유
                                </Text>
                            </VStack>
                        </HStack>
                    </ModalHeader>
                    <ModalCloseButton />

                    <ModalBody>
                        <VStack spacing={6} align="stretch">
                            {/* 현재 등급 혜택 */}
                            <Box>
                                <Text fontWeight="semibold" mb={3} color="green.600">
                                    현재 혜택
                                </Text>
                                <VStack align="stretch" spacing={2}>
                                    {currentTier.benefits.map((benefit, index) => (
                                        <HStack key={index} spacing={2}>
                                            <Icon as={UnlockIcon} color="green.500" boxSize={4} />
                                            <Text fontSize="sm">{benefit}</Text>
                                        </HStack>
                                    ))}
                                </VStack>
                            </Box>

                            {/* 현재 등급 권한 */}
                            <Box>
                                <Text fontWeight="semibold" mb={3} color="blue.600">
                                    현재 권한
                                </Text>
                                <VStack align="stretch" spacing={2}>
                                    {currentTier.privileges.map((privilege, index) => (
                                        <HStack key={index} spacing={2}>
                                            <Icon as={InfoIcon} color="blue.500" boxSize={4} />
                                            <Text fontSize="sm">{privilege}</Text>
                                        </HStack>
                                    ))}
                                </VStack>
                            </Box>

                            {/* 다음 등급 정보 */}
                            {nextTier && (
                                <>
                                    <Divider />
                                    <Box>
                                        <HStack justify="space-between" mb={3}>
                                            <Text fontWeight="semibold" color="purple.600">
                                                다음 등급: {nextTier.displayName}
                                            </Text>
                                            <Badge colorScheme={nextTier.color} variant="subtle">
                                                {nextTier.name}
                                            </Badge>
                                        </HStack>

                                        <Box mb={4}>
                                            <HStack justify="space-between" mb={1}>
                                                <Text fontSize="sm" color={textColor}>
                                                    진행률
                                                </Text>
                                                <Text fontSize="sm" color={textColor}>
                                                    {Math.round(currentTier.progressToNext)}%
                                                </Text>
                                            </HStack>
                                            <Progress
                                                value={currentTier.progressToNext}
                                                size="md"
                                                colorScheme={currentTier.color}
                                                borderRadius="full"
                                            />
                                            <Text fontSize="xs" color={textColor} mt={1}>
                                                {nextTier.minPoints - userPoints} 포인트 더 필요
                                            </Text>
                                        </Box>

                                        <Text fontWeight="semibold" mb={2} color="purple.600">
                                            다음 등급 혜택
                                        </Text>
                                        <VStack align="stretch" spacing={2}>
                                            {nextTier.benefits.slice(0, 3).map((benefit, index) => (
                                                <HStack key={index} spacing={2}>
                                                    <Icon as={LockIcon} color="purple.500" boxSize={4} />
                                                    <Text fontSize="sm" color={textColor}>{benefit}</Text>
                                                </HStack>
                                            ))}
                                        </VStack>
                                    </Box>
                                </>
                            )}

                            {/* 전체 등급 시스템 */}
                            <Box>
                                <Text fontWeight="semibold" mb={3}>
                                    전체 등급 시스템
                                </Text>
                                <SimpleGrid columns={2} spacing={3}>
                                    {tiers.map((tier) => (
                                        <Box
                                            key={tier.id}
                                            p={3}
                                            border="1px solid"
                                            borderColor={tier.id === currentTier.id ? `${tier.color}.300` : borderColor}
                                            borderRadius="md"
                                            bg={tier.id === currentTier.id ? `${tier.color}.50` : 'transparent'}
                                        >
                                            <HStack spacing={2} mb={2}>
                                                <Icon as={tier.icon} color={`${tier.color}.500`} boxSize={4} />
                                                <Text fontSize="sm" fontWeight="medium">
                                                    {tier.displayName}
                                                </Text>
                                                {tier.id === currentTier.id && (
                                                    <Badge colorScheme={tier.color} size="sm">현재</Badge>
                                                )}
                                            </HStack>
                                            <Text fontSize="xs" color={textColor}>
                                                {tier.minPoints.toLocaleString()}+ 포인트
                                            </Text>
                                        </Box>
                                    ))}
                                </SimpleGrid>
                            </Box>
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <HStack spacing={2}>
                            <Button variant="ghost" onClick={onClose}>
                                닫기
                            </Button>
                            {nextTier && currentTier.progressToNext >= 100 && (
                                <Button colorScheme="purple" onClick={handleUpgrade}>
                                    등급 업그레이드
                                </Button>
                            )}
                        </HStack>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default UserTierSystem;
