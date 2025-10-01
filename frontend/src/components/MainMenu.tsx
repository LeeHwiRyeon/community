import React from 'react';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Divider } from '@mui/material';
import {
    Home as HomeIcon,
    Newspaper as NewsIcon,
    SportsEsports as GameIcon,
    LiveTv as StreamingIcon,
    Palette as CosplayIcon,
    TrendingUp as TrendingIcon,
    Chat as ChatIcon,
    Star as StarIcon,
    People as PeopleIcon,
    ShoppingBag as ShopIcon,
    Settings as SettingsIcon,
    Person as PersonIcon
} from '@mui/icons-material';

// 사용자 타입 정의
type UserType = 'news' | 'game' | 'streaming' | 'cosplay';

// 메뉴 아이템 인터페이스
interface MenuItem {
    id: string;
    label: string;
    icon: React.ReactElement;
    path: string;
    subItems?: MenuItem[];
}

// 메인 메뉴 컴포넌트 Props
interface MainMenuProps {
    userType: UserType;
    onNavigate: (path: string) => void;
}

// 사용자 타입별 메뉴 아이템 생성
const getMenuItems = (userType: UserType): MenuItem[] => {
    switch (userType) {
        case 'news':
            return [
                {
                    id: 'home',
                    label: '홈',
                    icon: <HomeIcon />,
                    path: '/news/home'
                },
                {
                    id: 'news-center',
                    label: '뉴스 센터',
                    icon: <NewsIcon />,
                    path: '/news/center',
                    subItems: [
                        { id: 'trending', label: '트렌딩 뉴스', icon: <TrendingIcon />, path: '/news/trending' },
                        { id: 'categories', label: '카테고리별 뉴스', icon: <NewsIcon />, path: '/news/categories' },
                        { id: 'search', label: '뉴스 검색', icon: <TrendingIcon />, path: '/news/search' }
                    ]
                },
                {
                    id: 'discussion',
                    label: '토론방',
                    icon: <ChatIcon />,
                    path: '/news/discussion',
                    subItems: [
                        { id: 'politics', label: '시사 토론', icon: <ChatIcon />, path: '/news/discussion/politics' },
                        { id: 'economy', label: '정치 토론', icon: <ChatIcon />, path: '/news/discussion/economy' },
                        { id: 'society', label: '경제 토론', icon: <ChatIcon />, path: '/news/discussion/society' }
                    ]
                },
                {
                    id: 'profile',
                    label: '프로필',
                    icon: <PersonIcon />,
                    path: '/news/profile'
                },
                {
                    id: 'settings',
                    label: '설정',
                    icon: <SettingsIcon />,
                    path: '/news/settings'
                }
            ];

        case 'game':
            return [
                {
                    id: 'home',
                    label: '홈',
                    icon: <HomeIcon />,
                    path: '/game/home'
                },
                {
                    id: 'game-center',
                    label: '게임 센터',
                    icon: <GameIcon />,
                    path: '/game/center',
                    subItems: [
                        { id: 'snake', label: 'Snake', icon: <GameIcon />, path: '/game/snake' },
                        { id: 'tetris', label: 'Tetris', icon: <GameIcon />, path: '/game/tetris' },
                        { id: 'pong', label: 'Pong', icon: <GameIcon />, path: '/game/pong' },
                        { id: 'memory', label: 'Memory', icon: <GameIcon />, path: '/game/memory' },
                        { id: 'breakout', label: 'Breakout', icon: <GameIcon />, path: '/game/breakout' },
                        { id: 'quiz', label: 'Quiz', icon: <GameIcon />, path: '/game/quiz' }
                    ]
                },
                {
                    id: 'leaderboard',
                    label: '리더보드',
                    icon: <StarIcon />,
                    path: '/game/leaderboard',
                    subItems: [
                        { id: 'overall', label: '전체 순위', icon: <StarIcon />, path: '/game/leaderboard/overall' },
                        { id: 'game-specific', label: '게임별 순위', icon: <StarIcon />, path: '/game/leaderboard/game' },
                        { id: 'achievements', label: '업적 현황', icon: <StarIcon />, path: '/game/leaderboard/achievements' }
                    ]
                },
                {
                    id: 'discussion',
                    label: '게임 토론',
                    icon: <ChatIcon />,
                    path: '/game/discussion',
                    subItems: [
                        { id: 'strategy', label: '게임 공략', icon: <ChatIcon />, path: '/game/discussion/strategy' },
                        { id: 'competition', label: '순위 경쟁', icon: <ChatIcon />, path: '/game/discussion/competition' },
                        { id: 'events', label: '이벤트', icon: <ChatIcon />, path: '/game/discussion/events' }
                    ]
                },
                {
                    id: 'profile',
                    label: '프로필',
                    icon: <PersonIcon />,
                    path: '/game/profile'
                },
                {
                    id: 'settings',
                    label: '설정',
                    icon: <SettingsIcon />,
                    path: '/game/settings'
                }
            ];

        case 'streaming':
            return [
                {
                    id: 'home',
                    label: '홈',
                    icon: <HomeIcon />,
                    path: '/streaming/home'
                },
                {
                    id: 'live-center',
                    label: '라이브 센터',
                    icon: <StreamingIcon />,
                    path: '/streaming/live',
                    subItems: [
                        { id: 'live-streams', label: '실시간 방송', icon: <StreamingIcon />, path: '/streaming/live/streams' },
                        { id: 'schedule', label: '방송 일정', icon: <StreamingIcon />, path: '/streaming/live/schedule' },
                        { id: 'recommended', label: '추천 방송', icon: <StarIcon />, path: '/streaming/live/recommended' }
                    ]
                },
                {
                    id: 'teams',
                    label: '연결된 팀',
                    icon: <PeopleIcon />,
                    path: '/streaming/teams',
                    subItems: [
                        { id: 'gaming-team', label: '게임 팀', icon: <GameIcon />, path: '/streaming/teams/gaming' },
                        { id: 'creator-team', label: '크리에이터 팀', icon: <StreamingIcon />, path: '/streaming/teams/creator' },
                        { id: 'music-team', label: '음악 팀', icon: <StreamingIcon />, path: '/streaming/teams/music' }
                    ]
                },
                {
                    id: 'chat',
                    label: '채팅',
                    icon: <ChatIcon />,
                    path: '/streaming/chat',
                    subItems: [
                        { id: 'global-chat', label: '글로벌 채팅', icon: <ChatIcon />, path: '/streaming/chat/global' },
                        { id: 'team-chat', label: '팀 채팅', icon: <ChatIcon />, path: '/streaming/chat/team' },
                        { id: 'vip-chat', label: 'VIP 채팅', icon: <StarIcon />, path: '/streaming/chat/vip' }
                    ]
                },
                {
                    id: 'profile',
                    label: '프로필',
                    icon: <PersonIcon />,
                    path: '/streaming/profile'
                },
                {
                    id: 'settings',
                    label: '설정',
                    icon: <SettingsIcon />,
                    path: '/streaming/settings'
                }
            ];

        case 'cosplay':
            return [
                {
                    id: 'home',
                    label: '홈',
                    icon: <HomeIcon />,
                    path: '/cosplay/home'
                },
                {
                    id: 'portfolio',
                    label: '포트폴리오',
                    icon: <PaletteIcon />,
                    path: '/cosplay/portfolio',
                    subItems: [
                        { id: 'my-works', label: '내 작품', icon: <PaletteIcon />, path: '/cosplay/portfolio/my-works' },
                        { id: 'popular', label: '인기 작품', icon: <StarIcon />, path: '/cosplay/portfolio/popular' },
                        { id: 'featured', label: '우수 작품', icon: <StarIcon />, path: '/cosplay/portfolio/featured' }
                    ]
                },
                {
                    id: 'shop',
                    label: '상점',
                    icon: <ShopIcon />,
                    path: '/cosplay/shop',
                    subItems: [
                        { id: 'costumes', label: '의상', icon: <ShopIcon />, path: '/cosplay/shop/costumes' },
                        { id: 'props', label: '소품', icon: <ShopIcon />, path: '/cosplay/shop/props' },
                        { id: 'makeup', label: '메이크업', icon: <ShopIcon />, path: '/cosplay/shop/makeup' }
                    ]
                },
                {
                    id: 'teams',
                    label: '연결된 팀',
                    icon: <PeopleIcon />,
                    path: '/cosplay/teams',
                    subItems: [
                        { id: 'cosplay-team', label: '코스프레 팀', icon: <PaletteIcon />, path: '/cosplay/teams/cosplay' },
                        { id: 'photographer-team', label: '포토그래퍼 팀', icon: <PaletteIcon />, path: '/cosplay/teams/photographer' },
                        { id: 'makeup-team', label: '메이크업 팀', icon: <PaletteIcon />, path: '/cosplay/teams/makeup' }
                    ]
                },
                {
                    id: 'gallery-chat',
                    label: '갤러리 채팅',
                    icon: <ChatIcon />,
                    path: '/cosplay/gallery-chat',
                    subItems: [
                        { id: 'work-discussion', label: '작품 토론', icon: <ChatIcon />, path: '/cosplay/gallery-chat/work' },
                        { id: 'tips', label: '팁 공유', icon: <ChatIcon />, path: '/cosplay/gallery-chat/tips' },
                        { id: 'events', label: '이벤트', icon: <ChatIcon />, path: '/cosplay/gallery-chat/events' }
                    ]
                },
                {
                    id: 'profile',
                    label: '프로필',
                    icon: <PersonIcon />,
                    path: '/cosplay/profile'
                },
                {
                    id: 'settings',
                    label: '설정',
                    icon: <SettingsIcon />,
                    path: '/cosplay/settings'
                }
            ];

        default:
            return [];
    }
};

// 사용자 타입별 테마 클래스
const getThemeClass = (userType: UserType): string => {
    return `${userType}-theme`;
};

// 사용자 타입별 제목
const getTitle = (userType: UserType): string => {
    switch (userType) {
        case 'news':
            return '📰 뉴스 커뮤니티';
        case 'game':
            return '🎮 게임 커뮤니티';
        case 'streaming':
            return '📺 스트리밍 커뮤니티';
        case 'cosplay':
            return '🎭 코스프레 커뮤니티';
        default:
            return '커뮤니티';
    }
};

// 메인 메뉴 컴포넌트
const MainMenu: React.FC<MainMenuProps> = ({ userType, onNavigate }) => {
    const menuItems = getMenuItems(userType);
    const themeClass = getThemeClass(userType);
    const title = getTitle(userType);

    return (
        <Box className={`main-menu ${themeClass}`} sx={{
            width: 280,
            height: '100vh',
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            overflow: 'auto'
        }}>
            {/* 메뉴 헤더 */}
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" component="h2" sx={{
                    fontWeight: 'bold',
                    textAlign: 'center',
                    color: 'primary.main'
                }}>
                    {title}
                </Typography>
            </Box>

            {/* 메뉴 아이템 */}
            <List sx={{ p: 0 }}>
                {menuItems.map((item, index) => (
                    <React.Fragment key={item.id}>
                        <ListItem disablePadding>
                            <ListItemButton
                                onClick={() => onNavigate(item.path)}
                                sx={{
                                    py: 1.5,
                                    '&:hover': {
                                        bgcolor: 'action.hover'
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        fontSize: '0.9rem',
                                        fontWeight: 500
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>

                        {/* 서브 메뉴 */}
                        {item.subItems && (
                            <Box sx={{ pl: 4 }}>
                                {item.subItems.map((subItem) => (
                                    <ListItem key={subItem.id} disablePadding>
                                        <ListItemButton
                                            onClick={() => onNavigate(subItem.path)}
                                            sx={{
                                                py: 1,
                                                '&:hover': {
                                                    bgcolor: 'action.hover'
                                                }
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 32 }}>
                                                {subItem.icon}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={subItem.label}
                                                primaryTypographyProps={{
                                                    fontSize: '0.8rem',
                                                    fontWeight: 400
                                                }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </Box>
                        )}

                        {/* 구분선 */}
                        {index < menuItems.length - 1 && (
                            <Divider sx={{ my: 1 }} />
                        )}
                    </React.Fragment>
                ))}
            </List>
        </Box>
    );
};

export default MainMenu;
