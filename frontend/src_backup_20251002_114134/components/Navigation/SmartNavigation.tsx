import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    IconButton,
    Badge,
    Tooltip,
    useColorModeValue,
    Collapse,
    useDisclosure,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider,
    Avatar,
    Button,
    Input,
    InputGroup,
    InputLeftElement,
    useToast,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    useBreakpointValue
} from '@chakra-ui/react';
import {
    SearchIcon,
    BellIcon,
    SettingsIcon,
    UserIcon,
    ChevronDownIcon,
    HamburgerIcon,
    CloseIcon,
    HomeIcon,
    StarIcon,
    ChatIcon,
    InfoIcon,
    HelpIcon,
    LogOutIcon,
    MoonIcon,
    SunIcon
} from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationItem {
    id: string;
    label: string;
    icon: any;
    path: string;
    badge?: number;
    children?: NavigationItem[];
    requiresAuth?: boolean;
    userTier?: string[];
    isNew?: boolean;
}

interface SmartNavigationProps {
    user?: {
        id: string;
        name: string;
        avatar?: string;
        tier: string;
        notifications: number;
    };
    onLogout?: () => void;
    onSearch?: (query: string) => void;
}

const SmartNavigation: React.FC<SmartNavigationProps> = ({
    user,
    onLogout,
    onSearch
}) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [searchQuery, setSearchQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const isMobile = useBreakpointValue({ base: true, md: false });
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const textColor = useColorModeValue('gray.600', 'gray.300');

    // 네비게이션 아이템 정의
    const navigationItems: NavigationItem[] = useMemo(() => [
        {
            id: 'home',
            label: t('navigation.home'),
            icon: HomeIcon,
            path: '/',
            requiresAuth: false
        },
        {
            id: 'communities',
            label: t('navigation.communities'),
            icon: StarIcon,
            path: '/communities',
            requiresAuth: false,
            children: [
                {
                    id: 'my-communities',
                    label: t('navigation.myCommunities'),
                    icon: StarIcon,
                    path: '/communities/my',
                    requiresAuth: true
                },
                {
                    id: 'discover',
                    label: t('navigation.discover'),
                    icon: SearchIcon,
                    path: '/communities/discover',
                    requiresAuth: false
                }
            ]
        },
        {
            id: 'chat',
            label: t('navigation.chat'),
            icon: ChatIcon,
            path: '/chat',
            requiresAuth: true,
            badge: user?.notifications || 0
        },
        {
            id: 'notifications',
            label: t('navigation.notifications'),
            icon: BellIcon,
            path: '/notifications',
            requiresAuth: true,
            badge: user?.notifications || 0
        }
    ], [t, user?.notifications]);

    // 사용자 메뉴 아이템
    const userMenuItems: NavigationItem[] = useMemo(() => [
        {
            id: 'profile',
            label: t('navigation.profile'),
            icon: UserIcon,
            path: '/profile',
            requiresAuth: true
        },
        {
            id: 'settings',
            label: t('navigation.settings'),
            icon: SettingsIcon,
            path: '/settings',
            requiresAuth: true
        },
        {
            id: 'help',
            label: t('navigation.help'),
            icon: HelpIcon,
            path: '/help',
            requiresAuth: false
        },
        {
            id: 'about',
            label: t('navigation.about'),
            icon: InfoIcon,
            path: '/about',
            requiresAuth: false
        }
    ], [t]);

    // 최근 검색어 로드
    useEffect(() => {
        const saved = localStorage.getItem('recent-searches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
    }, []);

    // 검색어 저장
    const saveSearchQuery = (query: string) => {
        if (query.trim() && !recentSearches.includes(query)) {
            const newSearches = [query, ...recentSearches].slice(0, 5);
            setRecentSearches(newSearches);
            localStorage.setItem('recent-searches', JSON.stringify(newSearches));
        }
    };

    // 검색 처리
    const handleSearch = (query: string) => {
        if (query.trim()) {
            saveSearchQuery(query);
            if (onSearch) {
                onSearch(query);
            } else {
                navigate(`/search?q=${encodeURIComponent(query)}`);
            }
            setSearchQuery('');
            setIsSearchFocused(false);
        }
    };

    // 네비게이션 아이템 클릭
    const handleNavigation = (item: NavigationItem) => {
        if (item.requiresAuth && !user) {
            toast({
                title: '로그인이 필요합니다',
                description: '이 기능을 사용하려면 로그인해주세요.',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            navigate('/login');
            return;
        }

        // 사용자 등급 확인
        if (item.userTier && user && !item.userTier.includes(user.tier)) {
            toast({
                title: '권한이 없습니다',
                description: '이 기능을 사용하려면 더 높은 등급이 필요합니다.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        navigate(item.path);
        if (isMobile) {
            onClose();
        }
    };

    // 활성 경로 확인
    const isActivePath = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    // 네비게이션 아이템 렌더링
    const renderNavigationItem = (item: NavigationItem, isSubItem = false) => {
        const isActive = isActivePath(item.path);
        const hasChildren = item.children && item.children.length > 0;

        return (
            <Box key={item.id}>
                <Button
                    variant="ghost"
                    justifyContent="flex-start"
                    h={isSubItem ? "40px" : "50px"}
                    px={isSubItem ? 8 : 4}
                    borderRadius={isSubItem ? "md" : "lg"}
                    bg={isActive ? 'blue.50' : 'transparent'}
                    color={isActive ? 'blue.600' : textColor}
                    fontWeight={isActive ? 'bold' : 'normal'}
                    onClick={() => !hasChildren && handleNavigation(item)}
                    _hover={{
                        bg: isActive ? 'blue.50' : 'gray.50'
                    }}
                    leftIcon={
                        <HStack spacing={2}>
                            <item.icon boxSize={isSubItem ? 4 : 5} />
                            {item.isNew && (
                                <Badge colorScheme="red" size="sm" borderRadius="full">
                                    NEW
                                </Badge>
                            )}
                        </HStack>
                    }
                    rightIcon={
                        hasChildren ? <ChevronDownIcon boxSize={4} /> :
                            item.badge && item.badge > 0 ? (
                                <Badge colorScheme="red" borderRadius="full" minW="20px" h="20px">
                                    {item.badge > 99 ? '99+' : item.badge}
                                </Badge>
                            ) : undefined
                    }
                >
                    {item.label}
                </Button>

                {/* 하위 메뉴 */}
                {hasChildren && (
                    <Collapse in={isActive} animateOpacity>
                        <VStack spacing={1} align="stretch" mt={2}>
                            {item.children!.map(child => renderNavigationItem(child, true))}
                        </VStack>
                    </Collapse>
                )}
            </Box>
        );
    };

    // 데스크톱 네비게이션
    const DesktopNavigation = () => (
        <Box
            bg={bgColor}
            borderBottom="1px solid"
            borderColor={borderColor}
            px={6}
            py={4}
            shadow="sm"
        >
            <HStack spacing={6} justify="space-between">
                {/* 로고 및 메인 네비게이션 */}
                <HStack spacing={6}>
                    <Text fontSize="xl" fontWeight="bold" color="blue.600" cursor="pointer" onClick={() => navigate('/')}>
                        Community
                    </Text>

                    <HStack spacing={2}>
                        {navigationItems.map(item => renderNavigationItem(item))}
                    </HStack>
                </HStack>

                {/* 검색바 */}
                <Box flex={1} maxW="400px">
                    <InputGroup>
                        <InputLeftElement>
                            <SearchIcon color="gray.400" />
                        </InputLeftElement>
                        <Input
                            placeholder="검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                        />
                    </InputGroup>

                    {/* 검색 제안 */}
                    {isSearchFocused && (searchQuery || recentSearches.length > 0) && (
                        <Box
                            position="absolute"
                            top="100%"
                            left="0"
                            right="0"
                            bg={bgColor}
                            border="1px solid"
                            borderColor={borderColor}
                            borderRadius="md"
                            shadow="lg"
                            zIndex={1000}
                            mt={1}
                        >
                            {searchQuery && (
                                <Box p={2}>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        leftIcon={<SearchIcon />}
                                        onClick={() => handleSearch(searchQuery)}
                                        w="full"
                                        justifyContent="flex-start"
                                    >
                                        "{searchQuery}" 검색
                                    </Button>
                                </Box>
                            )}

                            {recentSearches.length > 0 && (
                                <>
                                    <Box px={2} py={1} borderTop="1px solid" borderColor={borderColor}>
                                        <Text fontSize="xs" color={textColor} fontWeight="semibold">
                                            최근 검색어
                                        </Text>
                                    </Box>
                                    {recentSearches.map((search, index) => (
                                        <Button
                                            key={index}
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleSearch(search)}
                                            w="full"
                                            justifyContent="flex-start"
                                        >
                                            {search}
                                        </Button>
                                    ))}
                                </>
                            )}
                        </Box>
                    )}
                </Box>

                {/* 사용자 메뉴 */}
                <HStack spacing={2}>
                    {user ? (
                        <>
                            <Tooltip label="알림">
                                <IconButton
                                    aria-label="알림"
                                    icon={<BellIcon />}
                                    variant="ghost"
                                    onClick={() => navigate('/notifications')}
                                >
                                    {user.notifications > 0 && (
                                        <Badge
                                            position="absolute"
                                            top={1}
                                            right={1}
                                            colorScheme="red"
                                            borderRadius="full"
                                            minW="18px"
                                            h="18px"
                                        >
                                            {user.notifications > 99 ? '99+' : user.notifications}
                                        </Badge>
                                    )}
                                </IconButton>
                            </Tooltip>

                            <Menu>
                                <MenuButton as={Button} variant="ghost" rightIcon={<ChevronDownIcon />}>
                                    <HStack spacing={2}>
                                        <Avatar size="sm" src={user.avatar} name={user.name} />
                                        <Text fontSize="sm" fontWeight="medium">
                                            {user.name}
                                        </Text>
                                    </HStack>
                                </MenuButton>
                                <MenuList>
                                    {userMenuItems.map(item => (
                                        <MenuItem
                                            key={item.id}
                                            icon={<item.icon />}
                                            onClick={() => handleNavigation(item)}
                                        >
                                            {item.label}
                                        </MenuItem>
                                    ))}
                                    <MenuDivider />
                                    <MenuItem icon={<LogOutIcon />} onClick={onLogout}>
                                        로그아웃
                                    </MenuItem>
                                </MenuList>
                            </Menu>
                        </>
                    ) : (
                        <HStack spacing={2}>
                            <Button variant="ghost" onClick={() => navigate('/login')}>
                                로그인
                            </Button>
                            <Button colorScheme="blue" onClick={() => navigate('/register')}>
                                회원가입
                            </Button>
                        </HStack>
                    )}
                </HStack>
            </HStack>
        </Box>
    );

    // 모바일 네비게이션
    const MobileNavigation = () => (
        <>
            <Box
                bg={bgColor}
                borderBottom="1px solid"
                borderColor={borderColor}
                px={4}
                py={3}
                shadow="sm"
            >
                <HStack justify="space-between">
                    <Text fontSize="lg" fontWeight="bold" color="blue.600">
                        Community
                    </Text>
                    <HStack spacing={2}>
                        <IconButton
                            aria-label="검색"
                            icon={<SearchIcon />}
                            variant="ghost"
                            onClick={() => navigate('/search')}
                        />
                        <IconButton
                            aria-label="메뉴"
                            icon={<HamburgerIcon />}
                            variant="ghost"
                            onClick={onOpen}
                        />
                    </HStack>
                </HStack>
            </Box>

            <Drawer isOpen={isOpen} onClose={onClose} placement="left" size="xs">
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader>
                        <HStack spacing={3}>
                            {user ? (
                                <>
                                    <Avatar size="sm" src={user.avatar} name={user.name} />
                                    <VStack align="start" spacing={0}>
                                        <Text fontSize="sm" fontWeight="bold">
                                            {user.name}
                                        </Text>
                                        <Text fontSize="xs" color={textColor}>
                                            {user.tier} 등급
                                        </Text>
                                    </VStack>
                                </>
                            ) : (
                                <Text fontSize="lg" fontWeight="bold">
                                    메뉴
                                </Text>
                            )}
                        </HStack>
                    </DrawerHeader>

                    <DrawerBody p={0}>
                        <VStack spacing={0} align="stretch">
                            {navigationItems.map(item => renderNavigationItem(item))}

                            <Box p={4} borderTop="1px solid" borderColor={borderColor}>
                                <Text fontSize="sm" fontWeight="semibold" mb={2} color={textColor}>
                                    계정
                                </Text>
                                {userMenuItems.map(item => renderNavigationItem(item))}
                            </Box>
                        </VStack>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </>
    );

    return isMobile ? <MobileNavigation /> : <DesktopNavigation />;
};

export default SmartNavigation;
