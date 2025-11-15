/**
 * 사용자 프로필 v2 타입 정의
 */

export interface UserProfile {
    id: number;
    username: string;
    email: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    github_url: string | null;
    twitter_url: string | null;
    linkedin_url: string | null;
    avatar_url: string | null;
    banner_image: string | null;
    theme_preference: 'light' | 'dark' | 'auto';
    show_email: boolean;
    show_location: boolean;
    last_seen_at: string | null;
    created_at: string;
}

export interface UserStatistics {
    reputation_score: number;
    level: number;
    experience_points: number;
    total_posts: number;
    total_views: number;
    total_likes_received: number;
    total_comments_received: number;
    total_comments: number;
    total_likes_given: number;
    current_streak: number;
    longest_streak: number;
    last_activity_date: string | null;
    total_badges: number;
    total_achievements: number;
}

export interface UserBadge {
    badge_type: string;
    badge_icon: string;
    badge_color: string;
    earned_at: string;
    is_displayed: boolean;
    display_order: number;
}

export interface UserAchievement {
    achievement_type: string;
    milestone_value: number;
    title: string;
    description: string;
    icon: string;
    achieved_at: string;
    is_notified: boolean;
}

export interface ActivityLog {
    activity_date: string;
    posts_count: number;
    comments_count: number;
    likes_count: number;
    views_received: number;
    was_active: boolean;
}

export interface FullProfile {
    user: UserProfile;
    statistics: UserStatistics;
    badges: UserBadge[];
    achievements: UserAchievement[];
    activityLog: ActivityLog[];
}

export interface ProfileUpdateData {
    bio?: string;
    location?: string;
    website?: string;
    github_url?: string;
    twitter_url?: string;
    linkedin_url?: string;
    banner_image?: string;
    theme_preference?: 'light' | 'dark' | 'auto';
    show_email?: boolean;
    show_location?: boolean;
}

export interface LeaderboardUser {
    id: number;
    username: string;
    avatar_url: string | null;
    reputation_score: number;
    level: number;
    experience_points: number;
    total_posts: number;
    total_likes_received: number;
    total_badges: number;
    total_achievements: number;
}
