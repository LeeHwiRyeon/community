/**
 * 🧭 브레드크럼 네비게이션 컴포넌트
 * 
 * 트리형 구조의 계층적 네비게이션을 제공
 * 홈페이지 → 커뮤니티 허브 → 커뮤니티 → 게시판 → 게시글
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Breadcrumbs,
    Link,
    Typography,
    Box,
    Chip,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Home as HomeIcon,
    Groups as CommunitiesIcon,
    Article as NewsIcon,
    SportsEsports as GamesIcon,
    LiveTv as StreamingIcon,
    TheaterComedy as CosplayIcon,
    Forum as BoardIcon,
    Description as PostIcon,
    NavigateNext as NavigateNextIcon
} from '@mui/icons-material';

interface BreadcrumbItem {
    label: string;
    path: string;
    icon?: React.ReactNode;
    color?: string;
}

const BreadcrumbNavigation: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // 커뮤니티 정보 매핑
    const communityInfo: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
        news: { name: '뉴스 커뮤니티', icon: <NewsIcon />, color: '#2196F3' },
        games: { name: '게임 커뮤니티', icon: <GamesIcon />, color: '#9C27B0' },
        streaming: { name: '방송국 커뮤니티', icon: <StreamingIcon />, color: '#FF5722' },
        cosplay: { name: '코스프레 커뮤니티', icon: <CosplayIcon />, color: '#E91E63' }
    };

    // 게시판 정보 매핑
    const boardInfo: Record<string, string> = {
        'notice': '공지사항',
        'live-news': '실시간 뉴스',
        'news-discussion': '뉴스 토론',
        'newsletter': '뉴스레터',
        'settings': '알림 설정',
        'news': '게임 뉴스',
        'reviews': '게임 리뷰',
        'guides': '공략 가이드',
        'esports': 'e스포츠',
        'discussion': '자유 토론',
        'events': '이벤트',
        'live': '라이브 방송',
        'schedule': '방송 일정',
        'chat': '실시간 채팅',
        'subscribers': '구독자 관리',
        'monetization': '수익화 도구',
        'analytics': '방송 통계',
        'portfolio': '포트폴리오 갤러리',
        'costumes': '의상 관리',
        'event-participation': '이벤트 참가',
        'tutorials': '튜토리얼',
        'shop': '의상 상점',
        'ai-recommendations': 'AI 추천'
    };

    // 현재 경로를 기반으로 브레드크럼 생성
    const generateBreadcrumbs = (): BreadcrumbItem[] => {
        const pathSegments = location.pathname.split('/').filter(Boolean);
        const breadcrumbs: BreadcrumbItem[] = [];

        // 홈페이지
        breadcrumbs.push({
            label: '홈페이지',
            path: '/',
            icon: <HomeIcon />,
            color: '#666'
        });

        // 커뮤니티 허브
        if (pathSegments.length > 0) {
            breadcrumbs.push({
                label: '커뮤니티 허브',
                path: '/communities',
                icon: <CommunitiesIcon />,
                color: '#2196F3'
            });
        }

        // 커뮤니티
        if (pathSegments.length > 1 && pathSegments[0] === 'communities') {
            const communityId = pathSegments[1];
            const community = communityInfo[communityId];

            if (community) {
                breadcrumbs.push({
                    label: community.name,
                    path: `/communities/${communityId}`,
                    icon: community.icon,
                    color: community.color
                });
            }
        }

        // 게시판
        if (pathSegments.length > 2 && pathSegments[0] === 'communities') {
            const boardId = pathSegments[2];
            const boardName = boardInfo[boardId] || boardId;

            breadcrumbs.push({
                label: boardName,
                path: `/communities/${pathSegments[1]}/${boardId}`,
                icon: <BoardIcon />,
                color: '#9C27B0'
            });
        }

        // 게시글 (posts 경로인 경우)
        if (pathSegments[0] === 'posts' && pathSegments[1]) {
            breadcrumbs.push({
                label: '게시글 상세',
                path: `/posts/${pathSegments[1]}`,
                icon: <PostIcon />,
                color: '#FF5722'
            });
        }

        return breadcrumbs;
    };

    const breadcrumbs = generateBreadcrumbs();

    const handleBreadcrumbClick = (path: string) => {
        navigate(path);
    };

    // 홈페이지에서는 브레드크럼을 표시하지 않음
    if (location.pathname === '/') {
        return null;
    }

    return (
        <Box sx={{
            py: 2,
            px: 2,
            bgcolor: 'grey.50',
            borderBottom: '1px solid',
            borderColor: 'divider'
        }}>
            <Breadcrumbs
                separator={<NavigateNextIcon fontSize="small" />}
                aria-label="breadcrumb navigation"
                sx={{
                    '& .MuiBreadcrumbs-separator': {
                        color: 'text.secondary'
                    }
                }}
            >
                {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1;

                    return (
                        <Box key={item.path} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {item.icon && (
                                <Tooltip title={item.label}>
                                    <IconButton
                                        size="small"
                                        sx={{
                                            color: item.color,
                                            '&:hover': { bgcolor: `${item.color}20` }
                                        }}
                                    >
                                        {item.icon}
                                    </IconButton>
                                </Tooltip>
                            )}

                            {isLast ? (
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 'bold',
                                        color: item.color || 'text.primary'
                                    }}
                                >
                                    {item.label}
                                </Typography>
                            ) : (
                                <Link
                                    component="button"
                                    variant="body2"
                                    onClick={() => handleBreadcrumbClick(item.path)}
                                    sx={{
                                        color: item.color || 'primary.main',
                                        textDecoration: 'none',
                                        '&:hover': {
                                            textDecoration: 'underline',
                                            color: item.color || 'primary.dark'
                                        },
                                        fontWeight: 'medium'
                                    }}
                                >
                                    {item.label}
                                </Link>
                            )}
                        </Box>
                    );
                })}
            </Breadcrumbs>

            {/* 현재 경로 표시 */}
            <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: 'block' }}
            >
                현재 위치: {location.pathname}
            </Typography>
        </Box>
    );
};

export default BreadcrumbNavigation;
