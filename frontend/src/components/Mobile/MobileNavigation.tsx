import React, { useState, useEffect } from 'react';
import {
    Box,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    useDisclosure,
    IconButton,
    VStack,
    HStack,
    Text,
    Badge,
    Avatar,
    Divider,
    Button,
    useColorModeValue,
    useBreakpointValue,
    Collapse,
    useToast
} from '@chakra-ui/react';
import {
    HamburgerIcon,
    CloseIcon,
    BellIcon,
    SettingsIcon,
    ChatIcon,
    SearchIcon,
    HomeIcon,
    UserIcon,
    StarIcon,
    InfoIcon
} from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

interface MobileNavigationProps {
    user?: {
        id: string;
        name: string;
        avatar?: string;
        notifications?: number;
    };
    onLogout?: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ user, onLogout }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const textColor = useColorModeValue('gray.600', 'gray.300');

    // 온라인 상태 감지
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // 네비게이션 메뉴 아이템
    const menuItems = [
        {
            id: 'home',
            label: t('navigation.home'),
            icon: HomeIcon,
            path: '/',
            badge: null
        },
        {
            id: 'communities',
            label: t('navigation.communities'),
            icon: StarIcon,
            path: '/communities',
            badge: null
        },
        {
            id: 'chat',
            label: t('navigation.chat'),
            icon: ChatIcon,
            path: '/chat',
            badge: user?.notifications || 0
        },
        {
            id: 'notifications',
            label: t('navigation.notifications'),
            icon: BellIcon,
            path: '/notifications',
            badge: user?.notifications || 0
        },
        {
            id: 'search',
            label: t('navigation.search'),
            icon: SearchIcon,
            path: '/search',
            badge: null
        }
    ];

    // 사용자 메뉴 아이템
    const userMenuItems = [
        {
            id: 'profile',
            label: t('navigation.profile'),
            icon: UserIcon,
            path: '/profile'
        },
        {
            id: 'settings',
            label: t('navigation.settings'),
            icon: SettingsIcon,
            path: '/settings'
        },
        {
            id: 'about',
            label: t('navigation.about'),
            icon: InfoIcon,
            path: '/about'
        }
    ];

    const handleNavigation = (path: string) => {
        navigate(path);
        onClose();
    };

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
            toast({
                title: t('auth.logoutSuccess'),
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        }
        onClose();
    };

    const isActivePath = (path: string) => {
        return location.pathname === path;
    };

    return (
        <>
            {/* 햄버거 메뉴 버튼 */}
            <IconButton
                aria-label="메뉴 열기"
                icon={<HamburgerIcon />}
                variant="ghost"
                size="lg"
                onClick={onOpen}
                display={{ base: 'flex', md: 'none' }}
            />

            {/* 모바일 드로어 */}
            <Drawer isOpen={isOpen} onClose={onClose} placement="left" size="xs">
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader borderBottomWidth="1px" borderColor={borderColor}>
                        <HStack spacing={3}>
                            <Avatar
                                size="sm"
                                src={user?.avatar}
                                name={user?.name}
                                bg="blue.500"
                            />
                            <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="bold">
                                    {user?.name || t('common.guest')}
                                </Text>
                                <HStack spacing={2}>
                                    <Box
                                        w={2}
                                        h={2}
                                        borderRadius="full"
                                        bg={isOnline ? 'green.500' : 'red.500'}
                                    />
                                    <Text fontSize="xs" color={textColor}>
                                        {isOnline ? t('common.online') : t('common.offline')}
                                    </Text>
                                </HStack>
                            </VStack>
                        </HStack>
                    </DrawerHeader>

                    <DrawerBody p={0}>
                        <VStack spacing={0} align="stretch">
                            {/* 메인 메뉴 */}
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = isActivePath(item.path);

    return (
                                    <Button
                                        key={item.id}
                                        variant="ghost"
                                        justifyContent="flex-start"
                                        h="60px"
                                        px={4}
                                        borderRadius={0}
                                        bg={isActive ? 'blue.50' : 'transparent'}
                                        color={isActive ? 'blue.600' : textColor}
                                        fontWeight={isActive ? 'bold' : 'normal'}
                                        onClick={() => handleNavigation(item.path)}
                                        _hover={{
                                            bg: isActive ? 'blue.50' : 'gray.50'
                                        }}
                                    >
                                        <HStack spacing={3} w="full">
                                            <Icon boxSize={5} />
                                            <Text flex={1} textAlign="left">
                                                {item.label}
                                            </Text>
                                            {item.badge && item.badge > 0 && (
                                                <Badge colorScheme="red" borderRadius="full">
                                                    {item.badge > 99 ? '99+' : item.badge}
                                                </Badge>
                                            )}
                                        </HStack>
                                    </Button>
                                );
                            })}

                            <Divider />

                            {/* 사용자 메뉴 */}
                            {user && (
                                <>
                                    <Button
                                        variant="ghost"
                                        justifyContent="flex-start"
                                        h="50px"
                                        px={4}
                                        borderRadius={0}
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                    >
                                        <HStack spacing={3} w="full">
                                            <UserIcon boxSize={5} />
                                            <Text flex={1} textAlign="left">
                                                {t('navigation.account')}
                                            </Text>
                                        </HStack>
                                    </Button>

                                    <Collapse in={showUserMenu} animateOpacity>
                                        <VStack spacing={0} align="stretch">
                                            {userMenuItems.map((item) => {
                                                const Icon = item.icon;
                                                const isActive = isActivePath(item.path);

                return (
                                                    <Button
                                                        key={item.id}
                                                        variant="ghost"
                                                        justifyContent="flex-start"
                                                        h="50px"
                                                        px={8}
                                                        borderRadius={0}
                                                        bg={isActive ? 'blue.50' : 'transparent'}
                                                        color={isActive ? 'blue.600' : textColor}
                                                        fontWeight={isActive ? 'bold' : 'normal'}
                                                        onClick={() => handleNavigation(item.path)}
                                                        _hover={{
                                                            bg: isActive ? 'blue.50' : 'gray.50'
                                                        }}
                                                    >
                                                        <HStack spacing={3} w="full">
                                                            <Icon boxSize={4} />
                                                            <Text flex={1} textAlign="left">
                                {item.label}
                            </Text>
                                                        </HStack>
                                                    </Button>
                );
            })}
                                        </VStack>
                                    </Collapse>

                                    <Divider />

                                    <Button
                                        variant="ghost"
                                        justifyContent="flex-start"
                                        h="50px"
                                        px={4}
                                        borderRadius={0}
                                        color="red.500"
                                        onClick={handleLogout}
                                        _hover={{
                                            bg: 'red.50'
                                        }}
                                    >
                                        <HStack spacing={3} w="full">
                                            <CloseIcon boxSize={5} />
                                            <Text flex={1} textAlign="left">
                                                {t('auth.logout')}
                                            </Text>
                                        </HStack>
                                    </Button>
                                </>
                            )}

                            {/* 오프라인 상태 표시 */}
                            {!isOnline && (
                                <Box
                                    bg="orange.50"
                                    border="1px solid"
                                    borderColor="orange.200"
                                    borderRadius="md"
                                    p={3}
                                    mx={4}
                                    mt={4}
                                >
                                    <Text fontSize="sm" color="orange.700" textAlign="center">
                                        {t('common.offlineMode')}
                                    </Text>
        </Box>
                            )}
                        </VStack>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </>
    );
};

export default MobileNavigation;
