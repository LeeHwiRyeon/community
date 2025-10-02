import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';

interface PWAInstallPrompt {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
    isInstallable: boolean;
    isInstalled: boolean;
    isOnline: boolean;
    isStandalone: boolean;
    installPrompt: PWAInstallPrompt | null;
    updateAvailable: boolean;
    registration: ServiceWorkerRegistration | null;
}

export const usePWA = () => {
    const [pwaState, setPwaState] = useState<PWAState>({
        isInstallable: false,
        isInstalled: false,
        isOnline: navigator.onLine,
        isStandalone: window.matchMedia('(display-mode: standalone)').matches,
        installPrompt: null,
        updateAvailable: false,
        registration: null
    });

    const toast = useToast();

    // 설치 프롬프트 감지
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setPwaState(prev => ({
                ...prev,
                isInstallable: true,
                installPrompt: e as any
            }));
        };

        const handleAppInstalled = () => {
            setPwaState(prev => ({
                ...prev,
                isInstalled: true,
                isInstallable: false,
                installPrompt: null
            }));

            toast({
                title: '앱이 설치되었습니다!',
                description: '홈 화면에서 앱을 찾을 수 있습니다.',
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

    // 온라인 상태 감지
    useEffect(() => {
        const handleOnline = () => setPwaState(prev => ({ ...prev, isOnline: true }));
        const handleOffline = () => setPwaState(prev => ({ ...prev, isOnline: false }));

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // 서비스 워커 등록
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    setPwaState(prev => ({ ...prev, registration }));

                    // 업데이트 감지
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    setPwaState(prev => ({ ...prev, updateAvailable: true }));
                                }
                            });
                        }
                    });
                })
                .catch((error) => {
                    console.error('Service Worker 등록 실패:', error);
                });
        }
    }, []);

    // 앱 설치
    const installApp = useCallback(async () => {
        if (!pwaState.installPrompt) {
            toast({
                title: '설치할 수 없습니다',
                description: '이 앱은 이미 설치되었거나 설치할 수 없습니다.',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return false;
        }

        try {
            await pwaState.installPrompt.prompt();
            const choiceResult = await pwaState.installPrompt.userChoice;

            if (choiceResult.outcome === 'accepted') {
                toast({
                    title: '앱 설치 중...',
                    description: '잠시만 기다려주세요.',
                    status: 'info',
                    duration: 3000,
                    isClosable: true,
                });
            }

            return choiceResult.outcome === 'accepted';
        } catch (error) {
            console.error('앱 설치 오류:', error);
            toast({
                title: '설치 실패',
                description: '앱 설치 중 오류가 발생했습니다.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            return false;
        }
    }, [pwaState.installPrompt, toast]);

    // 앱 업데이트
    const updateApp = useCallback(async () => {
        if (!pwaState.registration || !pwaState.updateAvailable) {
            return false;
        }

        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration && registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });

                toast({
                    title: '앱 업데이트 중...',
                    description: '페이지를 새로고침합니다.',
                    status: 'info',
                    duration: 3000,
                    isClosable: true,
                });

                // 페이지 새로고침
                setTimeout(() => {
                    window.location.reload();
                }, 1000);

                return true;
            }
        } catch (error) {
            console.error('앱 업데이트 오류:', error);
            toast({
                title: '업데이트 실패',
                description: '앱 업데이트 중 오류가 발생했습니다.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }

        return false;
    }, [pwaState.registration, pwaState.updateAvailable, toast]);

    // 오프라인 데이터 동기화
    const syncOfflineData = useCallback(async () => {
        if (!pwaState.isOnline || !pwaState.registration) {
            return false;
        }

        try {
            // 백그라운드 동기화 트리거
            if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('background-sync');

                toast({
                    title: '데이터 동기화 중...',
                    description: '오프라인 데이터를 동기화합니다.',
                    status: 'info',
                    duration: 3000,
                    isClosable: true,
                });
            }

            return true;
        } catch (error) {
            console.error('데이터 동기화 오류:', error);
            return false;
        }
    }, [pwaState.isOnline, pwaState.registration, toast]);

    // 푸시 알림 권한 요청
    const requestNotificationPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            toast({
                title: '알림을 지원하지 않습니다',
                description: '이 브라우저는 알림을 지원하지 않습니다.',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'denied') {
            toast({
                title: '알림이 차단되었습니다',
                description: '브라우저 설정에서 알림을 허용해주세요.',
                status: 'warning',
                duration: 5000,
                isClosable: true,
            });
            return false;
        }

        try {
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                toast({
                    title: '알림이 활성화되었습니다',
                    description: '새로운 알림을 받을 수 있습니다.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                return true;
            } else {
                toast({
                    title: '알림이 거부되었습니다',
                    description: '나중에 설정에서 알림을 활성화할 수 있습니다.',
                    status: 'info',
                    duration: 3000,
                    isClosable: true,
                });
                return false;
            }
        } catch (error) {
            console.error('알림 권한 요청 오류:', error);
            return false;
        }
    }, [toast]);

    // PWA 기능 확인
    const checkPWASupport = useCallback(() => {
        const features = {
            serviceWorker: 'serviceWorker' in navigator,
            pushManager: 'PushManager' in window,
            notification: 'Notification' in window,
            backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
            webAppManifest: 'onbeforeinstallprompt' in window,
            indexedDB: 'indexedDB' in window,
            webShare: 'share' in navigator,
            webShareTarget: 'serviceWorker' in navigator && 'share' in navigator
        };

        return features;
    }, []);

    // 공유 기능
    const shareContent = useCallback(async (data: ShareData) => {
        if (!('share' in navigator)) {
            toast({
                title: '공유를 지원하지 않습니다',
                description: '이 브라우저는 공유 기능을 지원하지 않습니다.',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return false;
        }

        try {
            await navigator.share(data);
            return true;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('공유 오류:', error);
                toast({
                    title: '공유 실패',
                    description: '콘텐츠 공유 중 오류가 발생했습니다.',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
            return false;
        }
    }, [toast]);

    return {
        ...pwaState,
        installApp,
        updateApp,
        syncOfflineData,
        requestNotificationPermission,
        checkPWASupport,
        shareContent
    };
};
