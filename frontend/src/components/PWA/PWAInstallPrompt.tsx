import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    VStack,
    HStack,
    Text,
    Image,
    IconButton,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    useToast,
    Badge,
    Divider,
    List,
    ListItem,
    ListIcon,
    useColorModeValue
} from '@chakra-ui/react';
import {
    DownloadIcon,
    CloseIcon,
    CheckIcon,
    ExternalLinkIcon,
    StarIcon,
    BellIcon,
    SecurityIcon
} from '@chakra-ui/icons';
import { usePWA } from '../../hooks/usePWA';
import { useTranslation } from 'react-i18next';

interface PWAInstallPromptProps {
    showBadge?: boolean;
    variant?: 'banner' | 'modal' | 'button';
    onInstall?: () => void;
    onDismiss?: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
    showBadge = true,
    variant = 'banner',
    onInstall,
    onDismiss
}) => {
    const { t } = useTranslation();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [isInstalling, setIsInstalling] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    const {
        isInstallable,
        isInstalled,
        isOnline,
        isStandalone,
        installApp,
        checkPWASupport
    } = usePWA();

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const textColor = useColorModeValue('gray.600', 'gray.300');

    // 로컬 스토리지에서 닫기 상태 확인
    useEffect(() => {
        const dismissedState = localStorage.getItem('pwa-install-dismissed');
        if (dismissedState === 'true') {
            setDismissed(true);
        }
    }, []);

    // 설치 가능 상태가 되면 자동으로 표시 (배너만)
    useEffect(() => {
        if (isInstallable && !isInstalled && !isStandalone && !dismissed && variant === 'banner') {
            onOpen();
        }
    }, [isInstallable, isInstalled, isStandalone, dismissed, variant, onOpen]);

    const handleInstall = async () => {
        setIsInstalling(true);

        try {
            const success = await installApp();
            if (success) {
                onInstall?.();
                onClose();
                setDismissed(true);
                localStorage.setItem('pwa-install-dismissed', 'true');
            }
        } catch (error) {
            console.error('설치 오류:', error);
            toast({
                title: '설치 실패',
                description: '앱 설치 중 오류가 발생했습니다.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsInstalling(false);
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem('pwa-install-dismissed', 'true');
        onDismiss?.();
        onClose();
    };

    const handleLearnMore = () => {
        window.open('https://web.dev/progressive-web-apps/', '_blank');
    };

    const pwaFeatures = [
        {
            icon: DownloadIcon,
            title: t('pwa.features.offline'),
            description: t('pwa.features.offlineDesc')
        },
        {
            icon: BellIcon,
            title: t('pwa.features.notifications'),
            description: t('pwa.features.notificationsDesc')
        },
        {
            icon: StarIcon,
            title: t('pwa.features.homeScreen'),
            description: t('pwa.features.homeScreenDesc')
        },
        {
            icon: SecurityIcon,
            title: t('pwa.features.secure'),
            description: t('pwa.features.secureDesc')
        }
    ];

    // 이미 설치되었거나 설치할 수 없는 경우 표시하지 않음
    if (isInstalled || !isInstallable || isStandalone) {
        return null;
    }

    // 배지만 표시
    if (variant === 'button' && showBadge) {
        return (
            <Badge
                colorScheme="blue"
                variant="solid"
                borderRadius="full"
                px={2}
                py={1}
                fontSize="xs"
                cursor="pointer"
                onClick={onOpen}
                _hover={{ bg: 'blue.600' }}
            >
                {t('pwa.installAvailable')}
            </Badge>
        );
    }

    // 배너 형태
    if (variant === 'banner') {
        return (
            <Box
                position="fixed"
                bottom={4}
                left={4}
                right={4}
                bg={bgColor}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="lg"
                boxShadow="lg"
                p={4}
                zIndex={1000}
                display={{ base: 'block', md: 'none' }}
            >
                <HStack spacing={3} align="start">
                    <Image
                        src="/icons/icon-72x72.png"
                        alt="App Icon"
                        boxSize="48px"
                        borderRadius="lg"
                    />
                    <VStack align="start" spacing={2} flex={1}>
                        <Text fontWeight="bold" fontSize="sm">
                            {t('pwa.installTitle')}
                        </Text>
                        <Text fontSize="xs" color={textColor}>
                            {t('pwa.installDescription')}
                        </Text>
                        <HStack spacing={2}>
                            <Button
                                size="sm"
                                colorScheme="blue"
                                leftIcon={<DownloadIcon />}
                                onClick={handleInstall}
                                isLoading={isInstalling}
                                loadingText={t('pwa.installing')}
                            >
                                {t('pwa.install')}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleDismiss}
                            >
                                {t('common.later')}
                            </Button>
                        </HStack>
                    </VStack>
                    <IconButton
                        aria-label="닫기"
                        icon={<CloseIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={handleDismiss}
                    />
                </HStack>
            </Box>
        );
    }

    // 모달 형태
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <HStack spacing={3}>
                        <Image
                            src="/icons/icon-72x72.png"
                            alt="App Icon"
                            boxSize="40px"
                            borderRadius="lg"
                        />
                        <VStack align="start" spacing={0}>
                            <Text fontSize="lg" fontWeight="bold">
                                {t('pwa.installTitle')}
                            </Text>
                            <Text fontSize="sm" color={textColor}>
                                {t('pwa.installSubtitle')}
                            </Text>
                        </VStack>
                    </HStack>
                </ModalHeader>
                <ModalCloseButton />

                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <Text fontSize="sm" color={textColor}>
                            {t('pwa.installDescription')}
                        </Text>

                        <Divider />

                        <VStack spacing={3} align="stretch">
                            <Text fontWeight="semibold" fontSize="sm">
                                {t('pwa.features.title')}
                            </Text>
                            <List spacing={2}>
                                {pwaFeatures.map((feature, index) => (
                                    <ListItem key={index}>
                                        <HStack spacing={3} align="start">
                                            <ListIcon as={feature.icon} color="blue.500" />
                                            <VStack align="start" spacing={0}>
                                                <Text fontSize="sm" fontWeight="medium">
                                                    {feature.title}
                                                </Text>
                                                <Text fontSize="xs" color={textColor}>
                                                    {feature.description}
                                                </Text>
                                            </VStack>
                                        </HStack>
                                    </ListItem>
                                ))}
                            </List>
                        </VStack>

                        {!isOnline && (
                            <Box
                                bg="orange.50"
                                border="1px solid"
                                borderColor="orange.200"
                                borderRadius="md"
                                p={3}
                            >
                                <Text fontSize="xs" color="orange.700">
                                    {t('pwa.offlineWarning')}
                                </Text>
                            </Box>
                        )}
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <HStack spacing={2} w="full">
                        <Button
                            variant="ghost"
                            onClick={handleLearnMore}
                            leftIcon={<ExternalLinkIcon />}
                            size="sm"
                        >
                            {t('pwa.learnMore')}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleDismiss}
                            size="sm"
                        >
                            {t('common.later')}
                        </Button>
                        <Button
                            colorScheme="blue"
                            onClick={handleInstall}
                            isLoading={isInstalling}
                            loadingText={t('pwa.installing')}
                            leftIcon={<DownloadIcon />}
                            size="sm"
                            flex={1}
                        >
                            {t('pwa.install')}
                        </Button>
                    </HStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default PWAInstallPrompt;
