const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');

// 커뮤니티 허브 시스템 - 뉴스, 게임, 스트리머, 코스프레 고도화
const communityData = {
    news: {
        id: 'news_community',
        name: '뉴스 커뮤니티',
        description: '실시간 뉴스와 토론이 활발한 커뮤니티',
        category: 'news',
        memberCount: 15420,
        activeUsers: 3240,
        dailyPosts: 156,
        trendingTopics: [
            { topic: '기술 뉴스', posts: 45, engagement: 89 },
            { topic: '게임 업데이트', posts: 32, engagement: 76 },
            { topic: '코스프레 이벤트', posts: 28, engagement: 82 },
            { topic: '스트리밍 소식', posts: 24, engagement: 71 }
        ],
        popularTags: ['기술', '게임', '코스프레', '스트리밍', '이벤트'],
        recentActivity: [
            { type: 'post', title: '새로운 AI 기술 발표', author: 'tech_user', time: '2분 전', views: 234 },
            { type: 'comment', title: '게임 업데이트에 대한 의견', author: 'gamer_pro', time: '5분 전', likes: 12 },
            { type: 'post', title: '코스프레 대회 결과', author: 'cosplay_master', time: '8분 전', views: 189 }
        ],
        features: ['실시간 뉴스', '토론 게시판', '뉴스레터', '알림 시스템'],
        uiTheme: 'news_theme',
        layout: 'news_layout'
    },
    games: {
        id: 'games_community',
        name: '게임 커뮤니티',
        description: '게이머들이 모여 정보를 공유하고 함께 플레이하는 커뮤니티',
        category: 'games',
        memberCount: 28450,
        activeUsers: 5670,
        dailyPosts: 234,
        trendingTopics: [
            { topic: '새 게임 리뷰', posts: 67, engagement: 92 },
            { topic: '게임 팁 공유', posts: 54, engagement: 88 },
            { topic: '멀티플레이어 매칭', posts: 43, engagement: 85 },
            { topic: '게임 개발 소식', posts: 38, engagement: 79 }
        ],
        popularTags: ['RPG', 'FPS', 'MOBA', '인디게임', '멀티플레이어'],
        recentActivity: [
            { type: 'post', title: '새로운 RPG 게임 리뷰', author: 'rpg_fan', time: '1분 전', views: 456 },
            { type: 'comment', title: '게임 팁 공유', author: 'pro_gamer', time: '3분 전', likes: 23 },
            { type: 'post', title: '멀티플레이어 매칭 요청', author: 'team_player', time: '6분 전', views: 123 }
        ],
        features: ['게임 센터', '리더보드', '업적 시스템', '멀티플레이어'],
        uiTheme: 'gaming_theme',
        layout: 'gaming_layout'
    },
    streaming: {
        id: 'streaming_community',
        name: '스트리밍 커뮤니티',
        description: '스트리머와 시청자들이 소통하고 콘텐츠를 공유하는 커뮤니티',
        category: 'streaming',
        memberCount: 19230,
        activeUsers: 3840,
        dailyPosts: 187,
        trendingTopics: [
            { topic: '라이브 방송', posts: 52, engagement: 94 },
            { topic: '스트리밍 팁', posts: 41, engagement: 87 },
            { topic: '콘텐츠 아이디어', posts: 36, engagement: 83 },
            { topic: '장비 리뷰', posts: 29, engagement: 78 }
        ],
        popularTags: ['라이브', '게임방송', '토크쇼', '음악', '교육'],
        recentActivity: [
            { type: 'post', title: '새로운 스트리밍 장비 리뷰', author: 'streamer_pro', time: '2분 전', views: 345 },
            { type: 'comment', title: '라이브 방송 팁', author: 'live_master', time: '4분 전', likes: 18 },
            { type: 'post', title: '콘텐츠 아이디어 공유', author: 'content_creator', time: '7분 전', views: 267 }
        ],
        features: ['라이브 방송', '채팅 시스템', '구독 관리', '수익화 도구'],
        uiTheme: 'streaming_theme',
        layout: 'streaming_layout'
    },
    cosplay: {
        id: 'cosplay_community',
        name: '코스프레 커뮤니티',
        description: '코스플레이어들이 의상과 포트폴리오를 공유하는 커뮤니티',
        category: 'cosplay',
        memberCount: 12890,
        activeUsers: 2560,
        dailyPosts: 143,
        trendingTopics: [
            { topic: '의상 제작', posts: 38, engagement: 91 },
            { topic: '포토샵', posts: 32, engagement: 86 },
            { topic: '이벤트 참가', posts: 28, engagement: 84 },
            { topic: '의상 리뷰', posts: 25, engagement: 79 }
        ],
        popularTags: ['의상제작', '포토샵', '이벤트', '캐릭터', '소품'],
        recentActivity: [
            { type: 'post', title: '새로운 의상 제작 과정', author: 'cosplay_artist', time: '3분 전', views: 289 },
            { type: 'comment', title: '포토샵 팁 공유', author: 'photo_editor', time: '5분 전', likes: 15 },
            { type: 'post', title: '이벤트 참가 후기', author: 'event_goer', time: '9분 전', views: 198 }
        ],
        features: ['포트폴리오 갤러리', '의상 관리', '이벤트 관리', 'AI 추천'],
        uiTheme: 'cosplay_theme',
        layout: 'cosplay_layout'
    }
};

// 사용자 행동 데이터 기반 UI/UX 추천
const userBehaviorData = {
    'news_user': {
        preferences: ['실시간 뉴스', '토론', '알림'],
        activityPattern: 'morning_heavy',
        engagementLevel: 'high',
        favoriteFeatures: ['trending_topics', 'recent_activity', 'newsletter'],
        uiPreferences: {
            layout: 'compact',
            theme: 'professional',
            notifications: 'high'
        }
    },
    'gaming_user': {
        preferences: ['게임 리뷰', '팁 공유', '멀티플레이어'],
        activityPattern: 'evening_heavy',
        engagementLevel: 'very_high',
        favoriteFeatures: ['leaderboard', 'achievements', 'multiplayer'],
        uiPreferences: {
            layout: 'gaming_focused',
            theme: 'dark',
            notifications: 'medium'
        }
    },
    'streaming_user': {
        preferences: ['라이브 방송', '채팅', '콘텐츠'],
        activityPattern: 'flexible',
        engagementLevel: 'high',
        favoriteFeatures: ['live_streaming', 'chat_system', 'monetization'],
        uiPreferences: {
            layout: 'streaming_optimized',
            theme: 'vibrant',
            notifications: 'high'
        }
    },
    'cosplay_user': {
        preferences: ['포트폴리오', '의상 관리', '이벤트'],
        activityPattern: 'weekend_heavy',
        engagementLevel: 'medium',
        favoriteFeatures: ['portfolio_gallery', 'costume_database', 'event_management'],
        uiPreferences: {
            layout: 'gallery_focused',
            theme: 'creative',
            notifications: 'low'
        }
    }
};

// 커뮤니티별 맞춤형 UI/UX 생성
const generateCustomUI = (communityType, userType) => {
    const community = communityData[communityType];
    const userBehavior = userBehaviorData[userType] || userBehaviorData['news_user'];

    return {
        layout: {
            primary: community.layout,
            secondary: userBehavior.uiPreferences.layout,
            responsive: true,
            accessibility: true
        },
        theme: {
            primary: community.uiTheme,
            secondary: userBehavior.uiPreferences.theme,
            colors: getThemeColors(communityType, userBehavior.uiPreferences.theme),
            typography: getTypography(communityType)
        },
        features: {
            enabled: community.features,
            prioritized: userBehavior.favoriteFeatures,
            customizations: getFeatureCustomizations(communityType, userType)
        },
        navigation: {
            structure: getNavigationStructure(communityType),
            shortcuts: getNavigationShortcuts(userBehavior.preferences),
            breadcrumbs: true
        },
        content: {
            display: getContentDisplay(communityType),
            filtering: getContentFiltering(communityType),
            sorting: getContentSorting(userBehavior.activityPattern)
        },
        notifications: {
            level: userBehavior.uiPreferences.notifications,
            channels: getNotificationChannels(communityType),
            timing: getNotificationTiming(userBehavior.activityPattern)
        }
    };
};

// 테마 색상 생성
const getThemeColors = (communityType, theme) => {
    const colorSchemes = {
        news: {
            professional: { primary: '#1976d2', secondary: '#424242', accent: '#ff9800' },
            vibrant: { primary: '#e91e63', secondary: '#607d8b', accent: '#4caf50' }
        },
        games: {
            dark: { primary: '#9c27b0', secondary: '#212121', accent: '#00e676' },
            gaming_focused: { primary: '#ff5722', secondary: '#263238', accent: '#ffeb3b' }
        },
        streaming: {
            vibrant: { primary: '#f44336', secondary: '#37474f', accent: '#2196f3' },
            streaming_optimized: { primary: '#673ab7', secondary: '#455a64', accent: '#ffc107' }
        },
        cosplay: {
            creative: { primary: '#e91e63', secondary: '#5d4037', accent: '#ff9800' },
            gallery_focused: { primary: '#9c27b0', secondary: '#3e2723', accent: '#4caf50' }
        }
    };

    return colorSchemes[communityType]?.[theme] || colorSchemes.news.professional;
};

// 타이포그래피 설정
const getTypography = (communityType) => {
    const typographySchemes = {
        news: { fontFamily: 'Roboto', fontSize: '14px', lineHeight: '1.6' },
        games: { fontFamily: 'Orbitron', fontSize: '16px', lineHeight: '1.4' },
        streaming: { fontFamily: 'Open Sans', fontSize: '15px', lineHeight: '1.5' },
        cosplay: { fontFamily: 'Lato', fontSize: '14px', lineHeight: '1.6' }
    };

    return typographySchemes[communityType] || typographySchemes.news;
};

// 기능 커스터마이제이션
const getFeatureCustomizations = (communityType, userType) => {
    const customizations = {
        news: {
            news_user: { trendingTopics: 'expanded', recentActivity: 'highlighted', newsletter: 'prominent' },
            default: { trendingTopics: 'standard', recentActivity: 'standard', newsletter: 'standard' }
        },
        games: {
            gaming_user: { leaderboard: 'expanded', achievements: 'highlighted', multiplayer: 'prominent' },
            default: { leaderboard: 'standard', achievements: 'standard', multiplayer: 'standard' }
        },
        streaming: {
            streaming_user: { liveStreaming: 'expanded', chatSystem: 'highlighted', monetization: 'prominent' },
            default: { liveStreaming: 'standard', chatSystem: 'standard', monetization: 'standard' }
        },
        cosplay: {
            cosplay_user: { portfolioGallery: 'expanded', costumeDatabase: 'highlighted', eventManagement: 'prominent' },
            default: { portfolioGallery: 'standard', costumeDatabase: 'standard', eventManagement: 'standard' }
        }
    };

    return customizations[communityType]?.[userType] || customizations[communityType]?.default || {};
};

// 네비게이션 구조
const getNavigationStructure = (communityType) => {
    const structures = {
        news: ['홈', '뉴스', '토론', '알림', '설정'],
        games: ['홈', '게임센터', '리더보드', '업적', '멀티플레이어'],
        streaming: ['홈', '라이브', '채팅', '구독', '수익화'],
        cosplay: ['홈', '포트폴리오', '의상관리', '이벤트', '갤러리']
    };

    return structures[communityType] || structures.news;
};

// 네비게이션 단축키
const getNavigationShortcuts = (preferences) => {
    return preferences.map(pref => ({
        key: pref.charAt(0).toUpperCase(),
        action: pref,
        description: `${pref} 바로가기`
    }));
};

// 콘텐츠 표시 방식
const getContentDisplay = (communityType) => {
    const displays = {
        news: { type: 'list', density: 'compact', preview: 'summary' },
        games: { type: 'grid', density: 'comfortable', preview: 'thumbnail' },
        streaming: { type: 'card', density: 'spacious', preview: 'video' },
        cosplay: { type: 'gallery', density: 'comfortable', preview: 'image' }
    };

    return displays[communityType] || displays.news;
};

// 콘텐츠 필터링
const getContentFiltering = (communityType) => {
    const filters = {
        news: ['카테고리', '날짜', '인기도', '태그'],
        games: ['장르', '플랫폼', '인기도', '업적'],
        streaming: ['카테고리', '라이브상태', '인기도', '구독자수'],
        cosplay: ['캐릭터', '이벤트', '인기도', '태그']
    };

    return filters[communityType] || filters.news;
};

// 콘텐츠 정렬
const getContentSorting = (activityPattern) => {
    const sortingOptions = {
        morning_heavy: ['최신순', '인기도순', '댓글순'],
        evening_heavy: ['인기도순', '최신순', '조회순'],
        flexible: ['추천순', '최신순', '인기도순'],
        weekend_heavy: ['인기도순', '댓글순', '최신순']
    };

    return sortingOptions[activityPattern] || sortingOptions.flexible;
};

// 알림 채널
const getNotificationChannels = (communityType) => {
    const channels = {
        news: ['브라우저', '이메일', '모바일'],
        games: ['브라우저', '게임내', '모바일'],
        streaming: ['브라우저', '채팅', '모바일'],
        cosplay: ['브라우저', '이메일']
    };

    return channels[communityType] || channels.news;
};

// 알림 타이밍
const getNotificationTiming = (activityPattern) => {
    const timings = {
        morning_heavy: { start: '08:00', end: '12:00', frequency: 'high' },
        evening_heavy: { start: '18:00', end: '24:00', frequency: 'high' },
        flexible: { start: '09:00', end: '22:00', frequency: 'medium' },
        weekend_heavy: { start: '10:00', end: '23:00', frequency: 'low' }
    };

    return timings[activityPattern] || timings.flexible;
};

// 커뮤니티 허브 메인 페이지
router.get('/', (req, res) => {
    const { userType = 'news_user' } = req.query;

    const hubData = {
        communities: Object.values(communityData).map(community => ({
            ...community,
            customUI: generateCustomUI(community.category, userType)
        })),
        userBehavior: userBehaviorData[userType],
        recommendations: generateRecommendations(userType),
        statistics: {
            totalCommunities: Object.keys(communityData).length,
            totalMembers: Object.values(communityData).reduce((sum, c) => sum + c.memberCount, 0),
            totalActiveUsers: Object.values(communityData).reduce((sum, c) => sum + c.activeUsers, 0),
            totalDailyPosts: Object.values(communityData).reduce((sum, c) => sum + c.dailyPosts, 0)
        }
    };

    logger.info(`커뮤니티 허브 데이터 생성: ${userType}`);
    res.json({ success: true, data: hubData });
});

// 특정 커뮤니티 상세 정보
router.get('/:communityId', (req, res) => {
    const { communityId } = req.params;
    const { userType = 'news_user' } = req.query;

    const community = communityData[communityId];
    if (!community) {
        return res.status(404).json({ success: false, message: '커뮤니티를 찾을 수 없습니다.' });
    }

    const communityDetail = {
        ...community,
        customUI: generateCustomUI(community.category, userType),
        userBehavior: userBehaviorData[userType],
        analytics: generateCommunityAnalytics(communityId),
        recommendations: generateCommunityRecommendations(communityId, userType)
    };

    logger.info(`커뮤니티 상세 정보 조회: ${communityId} (${userType})`);
    res.json({ success: true, data: communityDetail });
});

// 사용자 맞춤형 추천 생성
const generateRecommendations = (userType) => {
    const userBehavior = userBehaviorData[userType];
    const recommendations = [];

    Object.values(communityData).forEach(community => {
        const score = calculateRecommendationScore(community, userBehavior);
        if (score > 0.6) {
            recommendations.push({
                community: community,
                score: score,
                reason: getRecommendationReason(community, userBehavior)
            });
        }
    });

    return recommendations.sort((a, b) => b.score - a.score);
};

// 추천 점수 계산
const calculateRecommendationScore = (community, userBehavior) => {
    let score = 0;

    // 관심사 매칭
    const interestMatch = userBehavior.preferences.some(pref =>
        community.features.some(feature => feature.toLowerCase().includes(pref.toLowerCase()))
    );
    if (interestMatch) score += 0.4;

    // 활동 패턴 매칭
    const activityMatch = community.category === 'games' && userBehavior.activityPattern === 'evening_heavy';
    if (activityMatch) score += 0.3;

    // 참여도 매칭
    const engagementMatch = userBehavior.engagementLevel === 'high' && community.activeUsers > 3000;
    if (engagementMatch) score += 0.3;

    return Math.min(score, 1.0);
};

// 추천 이유 생성
const getRecommendationReason = (community, userBehavior) => {
    const reasons = [];

    if (userBehavior.preferences.includes('실시간 뉴스') && community.category === 'news') {
        reasons.push('실시간 뉴스 관심사와 일치');
    }
    if (userBehavior.preferences.includes('게임 리뷰') && community.category === 'games') {
        reasons.push('게임 관련 관심사와 일치');
    }
    if (userBehavior.preferences.includes('라이브 방송') && community.category === 'streaming') {
        reasons.push('스트리밍 관심사와 일치');
    }
    if (userBehavior.preferences.includes('포트폴리오') && community.category === 'cosplay') {
        reasons.push('코스프레 관심사와 일치');
    }

    return reasons.join(', ') || '활동 패턴과 일치';
};

// 커뮤니티 분석 데이터 생성
const generateCommunityAnalytics = (communityId) => {
    const community = communityData[communityId];
    return {
        growth: {
            memberGrowth: Math.floor(Math.random() * 20) + 5, // 5-25%
            postGrowth: Math.floor(Math.random() * 30) + 10, // 10-40%
            engagementGrowth: Math.floor(Math.random() * 15) + 8 // 8-23%
        },
        demographics: {
            ageGroups: {
                '18-24': Math.floor(Math.random() * 30) + 20,
                '25-34': Math.floor(Math.random() * 40) + 30,
                '35-44': Math.floor(Math.random() * 20) + 15,
                '45+': Math.floor(Math.random() * 10) + 5
            },
            genderDistribution: {
                male: Math.floor(Math.random() * 20) + 40,
                female: Math.floor(Math.random() * 20) + 40,
                other: Math.floor(Math.random() * 5) + 5
            }
        },
        activity: {
            peakHours: getPeakHours(communityId),
            popularContent: getPopularContent(communityId),
            userRetention: Math.floor(Math.random() * 20) + 70 // 70-90%
        }
    };
};

// 피크 시간 생성
const getPeakHours = (communityId) => {
    const peakHours = {
        news: [9, 10, 11, 14, 15, 16],
        games: [19, 20, 21, 22, 23],
        streaming: [20, 21, 22, 23, 0],
        cosplay: [10, 11, 12, 13, 14, 15]
    };

    return peakHours[communityId] || peakHours.news;
};

// 인기 콘텐츠 생성
const getPopularContent = (communityId) => {
    const popularContent = {
        news: ['기술 뉴스', '게임 업데이트', '코스프레 이벤트'],
        games: ['게임 리뷰', '팁 공유', '멀티플레이어'],
        streaming: ['라이브 방송', '스트리밍 팁', '콘텐츠 아이디어'],
        cosplay: ['의상 제작', '포토샵', '이벤트 참가']
    };

    return popularContent[communityId] || popularContent.news;
};

// 커뮤니티별 추천 생성
const generateCommunityRecommendations = (communityId, userType) => {
    const community = communityData[communityId];
    const userBehavior = userBehaviorData[userType];

    return {
        content: getContentRecommendations(communityId, userBehavior),
        users: getUserRecommendations(communityId, userBehavior),
        features: getFeatureRecommendations(communityId, userBehavior),
        events: getEventRecommendations(communityId, userBehavior)
    };
};

// 콘텐츠 추천
const getContentRecommendations = (communityId, userBehavior) => {
    const contentRecommendations = {
        news: ['최신 기술 뉴스', '인기 토론 주제', '뉴스레터 구독'],
        games: ['새 게임 리뷰', '게임 팁 모음', '멀티플레이어 매칭'],
        streaming: ['라이브 방송 시청', '스트리밍 가이드', '콘텐츠 아이디어'],
        cosplay: ['포트폴리오 갤러리', '의상 제작 가이드', '이벤트 참가']
    };

    return contentRecommendations[communityId] || contentRecommendations.news;
};

// 사용자 추천
const getUserRecommendations = (communityId, userBehavior) => {
    return [
        { name: '활발한 사용자', reason: '높은 참여도', match: 95 },
        { name: '전문가 사용자', reason: '전문 지식 공유', match: 88 },
        { name: '신규 사용자', reason: '비슷한 관심사', match: 82 }
    ];
};

// 기능 추천
const getFeatureRecommendations = (communityId, userBehavior) => {
    const featureRecommendations = {
        news: ['뉴스레터 구독', '알림 설정', '토론 참여'],
        games: ['업적 달성', '리더보드 참여', '멀티플레이어'],
        streaming: ['라이브 방송', '채팅 참여', '구독 관리'],
        cosplay: ['포트폴리오 업로드', '의상 관리', '이벤트 참가']
    };

    return featureRecommendations[communityId] || featureRecommendations.news;
};

// 이벤트 추천
const getEventRecommendations = (communityId, userBehavior) => {
    const eventRecommendations = {
        news: ['뉴스 토론회', '기술 세미나', '뉴스레터 발행'],
        games: ['게임 대회', '멀티플레이어 이벤트', '업적 챌린지'],
        streaming: ['라이브 방송 이벤트', '스트리밍 워크샵', '구독자 이벤트'],
        cosplay: ['코스프레 대회', '의상 제작 워크샵', '포토샵 세션']
    };

    return eventRecommendations[communityId] || eventRecommendations.news;
};

// 사용자 행동 데이터 업데이트
router.post('/user-behavior', (req, res) => {
    const { userId, communityId, action, data } = req.body;

    // 사용자 행동 데이터 업데이트 로직
    logger.info(`사용자 행동 데이터 업데이트: ${userId} - ${communityId} - ${action}`);

    res.json({
        success: true,
        message: '사용자 행동 데이터가 업데이트되었습니다.',
        data: { userId, communityId, action, timestamp: new Date().toISOString() }
    });
});

// 커뮤니티 통계 업데이트
router.post('/analytics', (req, res) => {
    const { communityId, metrics } = req.body;

    // 커뮤니티 통계 업데이트 로직
    logger.info(`커뮤니티 통계 업데이트: ${communityId}`);

    res.json({
        success: true,
        message: '커뮤니티 통계가 업데이트되었습니다.',
        data: { communityId, metrics, timestamp: new Date().toISOString() }
    });
});

module.exports = router;
