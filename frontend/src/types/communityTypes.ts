export interface CommunityType {
    id: string;
    name: string;
    description: string;
    type: CommunityCategory;
    theme: CommunityTheme;
    layout: CommunityLayout;
    features: CommunityFeature[];
    rules: CommunityRule[];
    statistics: CommunityStatistics;
    createdAt: string;
    updatedAt: string;
    memberCount: number;
    isActive: boolean;
}

export enum CommunityCategory {
    GENERAL = 'general',           // 일반 커뮤니티
    TECH = 'tech',                 // 기술 커뮤니티
    GAMING = 'gaming',             // 게임 커뮤니티
    STUDY = 'study',               // 학습 커뮤니티
    BUSINESS = 'business',         // 비즈니스 커뮤니티
    CREATIVE = 'creative',         // 창작 커뮤니티
    LIFESTYLE = 'lifestyle',       // 라이프스타일 커뮤니티
    NEWS = 'news',                 // 뉴스 커뮤니티
    SPORTS = 'sports',             // 스포츠 커뮤니티
    ENTERTAINMENT = 'entertainment' // 엔터테인먼트 커뮤니티
}

export interface CommunityTheme {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    fontFamily: string;
    borderRadius: string;
    shadow: string;
}

export interface CommunityLayout {
    headerStyle: 'minimal' | 'detailed' | 'banner' | 'hero';
    sidebarPosition: 'left' | 'right' | 'none';
    contentLayout: 'grid' | 'list' | 'magazine' | 'timeline';
    cardStyle: 'default' | 'minimal' | 'detailed' | 'compact';
    navigationStyle: 'tabs' | 'sidebar' | 'breadcrumb' | 'floating';
}

export interface CommunityFeature {
    id: string;
    name: string;
    enabled: boolean;
    position: number;
    config: Record<string, any>;
}

export interface CommunityRule {
    id: string;
    title: string;
    description: string;
    type: 'required' | 'recommended' | 'prohibited';
    category: 'content' | 'behavior' | 'format' | 'security';
}

export interface CommunityStatistics {
    totalMembers: number;
    activeMembers: number;
    totalPosts: number;
    totalComments: number;
    postsToday: number;
    commentsToday: number;
    topCategories: Array<{
        name: string;
        count: number;
        percentage: number;
    }>;
    memberGrowth: Array<{
        date: string;
        count: number;
    }>;
    activityTrend: Array<{
        date: string;
        posts: number;
        comments: number;
    }>;
}

// 커뮤니티 타입별 기본 설정
export const COMMUNITY_TYPE_CONFIGS: Record<CommunityCategory, Partial<CommunityType>> = {
    [CommunityCategory.GENERAL]: {
        theme: {
            primaryColor: '#3b82f6',
            secondaryColor: '#64748b',
            backgroundColor: '#ffffff',
            textColor: '#1e293b',
            accentColor: '#06b6d4',
            fontFamily: 'Inter, sans-serif',
            borderRadius: '8px',
            shadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        },
        layout: {
            headerStyle: 'detailed',
            sidebarPosition: 'left',
            contentLayout: 'list',
            cardStyle: 'default',
            navigationStyle: 'tabs'
        },
        features: [
            { id: 'recent-posts', name: '최신 게시글', enabled: true, position: 1, config: {} },
            { id: 'popular-posts', name: '인기 게시글', enabled: true, position: 2, config: {} },
            { id: 'categories', name: '카테고리', enabled: true, position: 3, config: {} },
            { id: 'members', name: '멤버', enabled: true, position: 4, config: {} }
        ]
    },
    [CommunityCategory.TECH]: {
        theme: {
            primaryColor: '#10b981',
            secondaryColor: '#6b7280',
            backgroundColor: '#f8fafc',
            textColor: '#111827',
            accentColor: '#3b82f6',
            fontFamily: 'JetBrains Mono, monospace',
            borderRadius: '6px',
            shadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        },
        layout: {
            headerStyle: 'minimal',
            sidebarPosition: 'right',
            contentLayout: 'grid',
            cardStyle: 'detailed',
            navigationStyle: 'sidebar'
        },
        features: [
            { id: 'code-snippets', name: '코드 스니펫', enabled: true, position: 1, config: {} },
            { id: 'tech-news', name: '기술 뉴스', enabled: true, position: 2, config: {} },
            { id: 'tutorials', name: '튜토리얼', enabled: true, position: 3, config: {} },
            { id: 'qna', name: 'Q&A', enabled: true, position: 4, config: {} },
            { id: 'projects', name: '프로젝트', enabled: true, position: 5, config: {} }
        ]
    },
    [CommunityCategory.GAMING]: {
        theme: {
            primaryColor: '#8b5cf6',
            secondaryColor: '#a78bfa',
            backgroundColor: '#0f0f23',
            textColor: '#e2e8f0',
            accentColor: '#f59e0b',
            fontFamily: 'Orbitron, sans-serif',
            borderRadius: '12px',
            shadow: '0 8px 32px rgba(139, 92, 246, 0.3)'
        },
        layout: {
            headerStyle: 'hero',
            sidebarPosition: 'left',
            contentLayout: 'magazine',
            cardStyle: 'detailed',
            navigationStyle: 'floating'
        },
        features: [
            { id: 'game-reviews', name: '게임 리뷰', enabled: true, position: 1, config: {} },
            { id: 'gaming-news', name: '게임 뉴스', enabled: true, position: 2, config: {} },
            { id: 'tournaments', name: '토너먼트', enabled: true, position: 3, config: {} },
            { id: 'guilds', name: '길드', enabled: true, position: 4, config: {} },
            { id: 'streams', name: '스트리밍', enabled: true, position: 5, config: {} }
        ]
    },
    [CommunityCategory.STUDY]: {
        theme: {
            primaryColor: '#2563eb',
            secondaryColor: '#64748b',
            backgroundColor: '#fefefe',
            textColor: '#1e293b',
            accentColor: '#059669',
            fontFamily: 'Source Sans Pro, sans-serif',
            borderRadius: '4px',
            shadow: '0 2px 4px rgba(0, 0, 0, 0.06)'
        },
        layout: {
            headerStyle: 'detailed',
            sidebarPosition: 'left',
            contentLayout: 'list',
            cardStyle: 'compact',
            navigationStyle: 'breadcrumb'
        },
        features: [
            { id: 'study-materials', name: '학습 자료', enabled: true, position: 1, config: {} },
            { id: 'study-groups', name: '스터디 그룹', enabled: true, position: 2, config: {} },
            { id: 'exams', name: '시험 정보', enabled: true, position: 3, config: {} },
            { id: 'progress-tracking', name: '진도 추적', enabled: true, position: 4, config: {} },
            { id: 'discussions', name: '토론', enabled: true, position: 5, config: {} }
        ]
    },
    [CommunityCategory.BUSINESS]: {
        theme: {
            primaryColor: '#1f2937',
            secondaryColor: '#6b7280',
            backgroundColor: '#ffffff',
            textColor: '#111827',
            accentColor: '#dc2626',
            fontFamily: 'Roboto, sans-serif',
            borderRadius: '2px',
            shadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
        },
        layout: {
            headerStyle: 'minimal',
            sidebarPosition: 'right',
            contentLayout: 'grid',
            cardStyle: 'minimal',
            navigationStyle: 'tabs'
        },
        features: [
            { id: 'market-analysis', name: '시장 분석', enabled: true, position: 1, config: {} },
            { id: 'networking', name: '네트워킹', enabled: true, position: 2, config: {} },
            { id: 'job-postings', name: '채용 공고', enabled: true, position: 3, config: {} },
            { id: 'industry-news', name: '업계 뉴스', enabled: true, position: 4, config: {} },
            { id: 'events', name: '이벤트', enabled: true, position: 5, config: {} }
        ]
    },
    [CommunityCategory.CREATIVE]: {
        theme: {
            primaryColor: '#ec4899',
            secondaryColor: '#f472b6',
            backgroundColor: '#fef7ff',
            textColor: '#581c87',
            accentColor: '#a855f7',
            fontFamily: 'Playfair Display, serif',
            borderRadius: '16px',
            shadow: '0 10px 25px rgba(236, 72, 153, 0.1)'
        },
        layout: {
            headerStyle: 'banner',
            sidebarPosition: 'none',
            contentLayout: 'magazine',
            cardStyle: 'detailed',
            navigationStyle: 'floating'
        },
        features: [
            { id: 'gallery', name: '갤러리', enabled: true, position: 1, config: {} },
            { id: 'showcase', name: '쇼케이스', enabled: true, position: 2, config: {} },
            { id: 'collaborations', name: '협업', enabled: true, position: 3, config: {} },
            { id: 'contests', name: '공모전', enabled: true, position: 4, config: {} },
            { id: 'tutorials', name: '튜토리얼', enabled: true, position: 5, config: {} }
        ]
    },
    [CommunityCategory.LIFESTYLE]: {
        theme: {
            primaryColor: '#f59e0b',
            secondaryColor: '#fbbf24',
            backgroundColor: '#fffbeb',
            textColor: '#92400e',
            accentColor: '#10b981',
            fontFamily: 'Poppins, sans-serif',
            borderRadius: '20px',
            shadow: '0 4px 14px rgba(245, 158, 11, 0.15)'
        },
        layout: {
            headerStyle: 'detailed',
            sidebarPosition: 'left',
            contentLayout: 'timeline',
            cardStyle: 'default',
            navigationStyle: 'tabs'
        },
        features: [
            { id: 'daily-life', name: '일상 공유', enabled: true, position: 1, config: {} },
            { id: 'tips', name: '팁 & 노하우', enabled: true, position: 2, config: {} },
            { id: 'reviews', name: '리뷰', enabled: true, position: 3, config: {} },
            { id: 'recommendations', name: '추천', enabled: true, position: 4, config: {} },
            { id: 'events', name: '이벤트', enabled: true, position: 5, config: {} }
        ]
    },
    [CommunityCategory.NEWS]: {
        theme: {
            primaryColor: '#dc2626',
            secondaryColor: '#ef4444',
            backgroundColor: '#ffffff',
            textColor: '#111827',
            accentColor: '#1f2937',
            fontFamily: 'Georgia, serif',
            borderRadius: '0px',
            shadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        },
        layout: {
            headerStyle: 'banner',
            sidebarPosition: 'right',
            contentLayout: 'list',
            cardStyle: 'detailed',
            navigationStyle: 'tabs'
        },
        features: [
            { id: 'breaking-news', name: '속보', enabled: true, position: 1, config: {} },
            { id: 'categories', name: '카테고리', enabled: true, position: 2, config: {} },
            { id: 'trending', name: '트렌딩', enabled: true, position: 3, config: {} },
            { id: 'opinions', name: '의견', enabled: true, position: 4, config: {} },
            { id: 'fact-check', name: '팩트체크', enabled: true, position: 5, config: {} }
        ]
    },
    [CommunityCategory.SPORTS]: {
        theme: {
            primaryColor: '#059669',
            secondaryColor: '#10b981',
            backgroundColor: '#f0fdf4',
            textColor: '#064e3b',
            accentColor: '#dc2626',
            fontFamily: 'Oswald, sans-serif',
            borderRadius: '8px',
            shadow: '0 4px 6px rgba(5, 150, 105, 0.1)'
        },
        layout: {
            headerStyle: 'hero',
            sidebarPosition: 'left',
            contentLayout: 'grid',
            cardStyle: 'detailed',
            navigationStyle: 'tabs'
        },
        features: [
            { id: 'scores', name: '경기 결과', enabled: true, position: 1, config: {} },
            { id: 'schedules', name: '일정', enabled: true, position: 2, config: {} },
            { id: 'teams', name: '팀 정보', enabled: true, position: 3, config: {} },
            { id: 'players', name: '선수 정보', enabled: true, position: 4, config: {} },
            { id: 'discussions', name: '토론', enabled: true, position: 5, config: {} }
        ]
    },
    [CommunityCategory.ENTERTAINMENT]: {
        theme: {
            primaryColor: '#7c3aed',
            secondaryColor: '#a855f7',
            backgroundColor: '#faf5ff',
            textColor: '#581c87',
            accentColor: '#ec4899',
            fontFamily: 'Montserrat, sans-serif',
            borderRadius: '12px',
            shadow: '0 8px 25px rgba(124, 58, 237, 0.15)'
        },
        layout: {
            headerStyle: 'banner',
            sidebarPosition: 'right',
            contentLayout: 'magazine',
            cardStyle: 'detailed',
            navigationStyle: 'floating'
        },
        features: [
            { id: 'reviews', name: '리뷰', enabled: true, position: 1, config: {} },
            { id: 'recommendations', name: '추천', enabled: true, position: 2, config: {} },
            { id: 'discussions', name: '토론', enabled: true, position: 3, config: {} },
            { id: 'events', name: '이벤트', enabled: true, position: 4, config: {} },
            { id: 'fan-art', name: '팬아트', enabled: true, position: 5, config: {} }
        ]
    }
};
