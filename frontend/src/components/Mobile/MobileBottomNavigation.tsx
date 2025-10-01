import React from 'react';
import {
    Box,
    HStack,
    IconButton,
    Text,
    Badge,
    useColorModeValue,
    useBreakpointValue
} from '@chakra-ui/react';
import {
    HomeIcon,
    SearchIcon,
    ChatIcon,
    BellIcon,
    UserIcon,
    StarIcon
} from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

interface MobileBottomNavigationProps {
    user?: {
        id: string;
        notifications?: number;
    };
}

const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({ user }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const activeColor = useColorModeValue('blue.500', 'blue.300');
    const inactiveColor = useColorModeValue('gray.500', 'gray.400');

    // 하단 네비게이션 아이템
    const bottomNavItems = [
        {
            id: 'home',
            label: t('navigation.home'),
            icon: HomeIcon,
            path: '/'
        },
        {
            id: 'communities',
            label: t('navigation.communities'),
            icon: StarIcon,
            path: '/communities'
        },
        {
            id: 'search',
            label: t('navigation.search'),
            icon: SearchIcon,
            path: '/search'
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
        }
    ];

    const handleNavigation = (path: string) => {
        navigate(path);
    };

    const isActivePath = (path: string) => {
        return location.pathname === path;
    };

    // 모바일에서만 표시
    const isMobile = useBreakpointValue({ base: true, md: false });

    if (!isMobile) {
        return null;
    }

    return (
        <Box
            position="fixed"
            bottom={0}
            left={0}
            right={0}
            bg={bgColor}
            borderTop="1px solid"
            borderColor={borderColor}
            zIndex={1000}
            px={2}
            py={1}
            display={{ base: 'block', md: 'none' }}
        >
            <HStack spacing={0} justify="space-around" align="center">
                {bottomNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isActivePath(item.path);
                    const color = isActive ? activeColor : inactiveColor;

                    return (
                        <Box key={item.id} position="relative">
                            <IconButton
                                aria-label={item.label}
                                icon={<Icon />}
                                variant="ghost"
                                size="lg"
                                color={color}
                                onClick={() => handleNavigation(item.path)}
                                _hover={{
                                    bg: 'transparent',
                                    transform: 'scale(1.1)'
                                }}
                                _active={{
                                    bg: 'transparent',
                                    transform: 'scale(0.95)'
                                }}
                                transition="all 0.2s"
                            />

                            {/* 배지 */}
                            {item.badge && item.badge > 0 && (
                                <Badge
                                    position="absolute"
                                    top={1}
                                    right={1}
                                    colorScheme="red"
                                    borderRadius="full"
                                    fontSize="xs"
                                    minW="18px"
                                    h="18px"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    {item.badge > 99 ? '99+' : item.badge}
                                </Badge>
                            )}

                            {/* 활성 상태 표시 */}
                            {isActive && (
                                <Box
                                    position="absolute"
                                    bottom={-1}
                                    left="50%"
                                    transform="translateX(-50%)"
                                    w="4px"
                                    h="4px"
                                    bg={activeColor}
                                    borderRadius="full"
                                />
                            )}
                        </Box>
                    );
                })}
            </HStack>
        </Box>
    );
};

export default MobileBottomNavigation;
