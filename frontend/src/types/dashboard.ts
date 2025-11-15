/**
 * Dashboard Type Definitions
 * 대시보드 관련 TypeScript 타입 정의
 */

export interface DashboardOverview {
    totalUsers: number;
    totalUsersChange: string;
    activeUsersToday: number;
    activeUsersChange: string;
    totalPosts: number;
    postsToday: number;
    postsChange: string;
    totalComments: number;
    commentsToday: number;
    commentsChange: string;
    totalLikes: number;
    likesToday: number;
    likesChange: string;
    totalViews: number;
    viewsToday: number;
    viewsChange: string;
}

export interface TimeSeriesDataPoint {
    stat_date: string;
    active_users?: number;
    new_posts?: number;
    new_comments?: number;
    new_likes?: number;
    new_views?: number;
    value?: number;
    new_value?: number;
}

export interface TimeSeriesData {
    days: number;
    metric: 'users' | 'posts' | 'comments' | 'likes' | 'views' | 'all';
    timeseries: TimeSeriesDataPoint[];
}

export interface LeaderboardEntry {
    rank: number;
    user_id: number;
    username: string;
    email: string;
    avatar_url: string | null;
    count?: number;
    total_views?: number;
    total_likes?: number;
    posts_commented?: number;
    posts_liked?: number;
    points?: number;
    level?: number;
    post_count?: number;
    comment_count?: number;
    total_likes_received?: number;
}

export interface LeaderboardData {
    type: 'posts' | 'comments' | 'likes' | 'reputation';
    limit: number;
    days: number;
    period: string;
    leaderboard: LeaderboardEntry[];
}

export interface CategoryStat {
    category_id: number;
    category_name: string;
    description: string | null;
    total_posts: number;
    total_comments: number;
    total_likes: number;
    total_views: number;
    avg_active_users: number;
    percentage: string;
}

export interface CategoryStatsData {
    days: number;
    period: string;
    categories: CategoryStat[];
}

export type ActivityType =
    | 'post_created'
    | 'comment_created'
    | 'like_added'
    | 'post_viewed'
    | 'login'
    | 'logout';

export type TargetType = 'post' | 'comment' | 'user' | 'system';

export interface ActivityFeedItem {
    id: number;
    user_id: number;
    username: string;
    avatar_url: string | null;
    activity_type: ActivityType;
    target_type: TargetType | null;
    target_id: number | null;
    target_title: string | null;
    created_at: string;
    activity_description: string;
}

export interface ActivityFeedData {
    limit: number;
    hours: number;
    period: string;
    activities: ActivityFeedItem[];
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface RefreshStatsRequest {
    date?: string;
}

export interface RefreshStatsResponse {
    success: boolean;
    message: string;
    date: string;
}

// 차트 데이터 타입
export interface ChartDataPoint {
    date: string;
    value: number;
    label: string;
}

export interface PieChartDataPoint {
    name: string;
    value: number;
    percentage: number;
    color: string;
}

// 컴포넌트 Props 타입
export interface OverviewCardsProps {
    overview: DashboardOverview | null;
    loading: boolean;
}

export interface ActivityChartProps {
    data: TimeSeriesDataPoint[];
    metric: string;
    loading: boolean;
}

export interface LeaderboardTableProps {
    data: LeaderboardEntry[];
    type: string;
    loading: boolean;
    onTypeChange: (type: string) => void;
}

export interface CategoryPieChartProps {
    data: CategoryStat[];
    loading: boolean;
}

export interface ActivityFeedProps {
    activities: ActivityFeedItem[];
    loading: boolean;
    onRefresh: () => void;
}
