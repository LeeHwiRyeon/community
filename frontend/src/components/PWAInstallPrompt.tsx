import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    HStack,
    Icon,
    Text,
    useToast,
    Slide,
    IconButton,
    VStack,
} from '@chakra-ui/react';
import { FiDownload, FiX, FiSmartphone } from 'react-icons/fi';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const toast = useToast();

    useEffect(() => {
        // 이미 PWA로 실행 중인지 확인
        const checkStandalone = () => {
            const isStandaloneMode =
                window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone ||
                document.referrer.includes('android-app://');

            setIsStandalone(isStandaloneMode);
        };

        checkStandalone();

        // PWA 설치 이벤트 리스너
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // 이전에 무시했는지 확인 (7일 동안 다시 표시하지 않음)
            const dismissedDate = localStorage.getItem('pwa-install-dismissed');
            if (dismissedDate) {
                const daysSinceDismissed = Math.floor(
                    (Date.now() - parseInt(dismissedDate)) / (1000 * 60 * 60 * 24)
                );
                if (daysSinceDismissed < 7) {
                    return;
                }
            }

            // 3초 후에 프롬프트 표시
            setTimeout(() => {
                setIsVisible(true);
            }, 3000);
        };

        // 설치 완료 이벤트
        const handleAppInstalled = () => {
            setIsVisible(false);
            setDeferredPrompt(null);
            localStorage.removeItem('pwa-install-dismissed');

            toast({
                title: '설치 완료! 🎉',
                description: '앱이 성공적으로 설치되었습니다.',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [toast]);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                toast({
                    title: '설치 중...',
                    description: '앱 설치가 진행 중입니다.',
                    status: 'info',
                    duration: 3000,
                });
            } else {
                toast({
                    title: '설치 취소됨',
                    description: '나중에 다시 설치하실 수 있습니다.',
                    status: 'warning',
                    duration: 3000,
                });
            }
        } catch (error) {
            console.error('PWA 설치 오류:', error);
            toast({
                title: '설치 실패',
                description: '앱 설치 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
            });
        }

        setDeferredPrompt(null);
        setIsVisible(false);
    };

    const handleDismiss = () => {
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
        setIsVisible(false);

        toast({
            title: '나중에 설치하기',
            description: '설정 메뉴에서 언제든 설치할 수 있습니다.',
            status: 'info',
            duration: 3000,
        });
    };

    // 이미 설치되었거나 프롬프트가 없으면 표시하지 않음
    if (!isVisible || isStandalone || !deferredPrompt) {
        return null;
    }

    return (
        <Slide direction="bottom" in={isVisible} style={{ zIndex: 1000 }}>
            <Box
                p={4}
                bg="linear-gradient(135deg, #2196F3 0%, #1976D2 100%)"
                color="white"
                shadow="2xl"
                borderTopRadius="lg"
            >
                <HStack justify="space-between" align="start" spacing={4}>
                    {/* 아이콘 */}
                    <Box
                        p={3}
                        bg="whiteAlpha.300"
                        borderRadius="md"
                        display={{ base: 'none', md: 'block' }}
                    >
                        <Icon as={FiSmartphone} boxSize={6} />
                    </Box>

                    {/* 메시지 */}
                    <VStack align="start" flex={1} spacing={1}>
                        <Text fontWeight="bold" fontSize="lg">
                            앱으로 설치하기
                        </Text>
                        <Text fontSize="sm" opacity={0.9}>
                            홈 화면에 추가하여 더 빠르고 편리하게 이용하세요
                        </Text>
                    </VStack>

                    {/* 버튼 */}
                    <HStack spacing={2}>
                        <Button
                            colorScheme="whiteAlpha"
                            size="md"
                            leftIcon={<Icon as={FiDownload} />}
                            onClick={handleInstall}
                            _hover={{ bg: 'whiteAlpha.300' }}
                        >
                            설치
                        </Button>
                        <IconButton
                            aria-label="닫기"
                            icon={<Icon as={FiX} />}
                            variant="ghost"
                            colorScheme="whiteAlpha"
                            size="md"
                            onClick={handleDismiss}
                            _hover={{ bg: 'whiteAlpha.200' }}
                        />
                    </HStack>
                </HStack>

                {/* 혜택 표시 */}
                <HStack mt={3} spacing={4} fontSize="xs" opacity={0.85}>
                    <Text>✓ 오프라인 사용</Text>
                    <Text>✓ 빠른 실행</Text>
                    <Text>✓ 푸시 알림</Text>
                </HStack>
            </Box>
        </Slide>
    );
};

export default PWAInstallPrompt;
