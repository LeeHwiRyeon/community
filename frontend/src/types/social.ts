/**
 * Social Features Type Definitions
 * 소셜 기능 관련 TypeScript 타입
 */

// ============================================
// Follow Types
// ============================================

export interface User {
    id: number;
    username: string;
    display_name?: string;
    profile_picture?: string;
    bio?: string;
    followers_count?: number;
    following_count?: number;
}

export interface FollowRelationship {
    id: number;
    follower_id: number;
    following_id: number;
    created_at: string;
}

export interface FollowerUser extends User {
    followed_at: string;
}

export interface FollowingUser extends User {
    followed_at: string;
}

export interface FollowersResponse {
    followers: FollowerUser[];
    total: number;
    limit: number;
    offset: number;
}

export interface FollowingResponse {
    following: FollowingUser[];
    total: number;
    limit: number;
    offset: number;
}

export interface FollowStats {
    user_id: number;
    username?: string;
    followers_count: number;
    following_count: number;
}

export interface FollowStatus {
    isFollowing: boolean;
    isMutual: boolean;
    userId: number;
}

export interface FollowSuggestion extends User {
    mutual_friends: number;
}

export interface FollowSuggestionsResponse {
    suggestions: FollowSuggestion[];
}

// ============================================
// Mention Types
// ============================================

export interface Mention {
    id: number;
    post_id?: number;
    comment_id?: number;
    mentioned_user_id: number;
    mentioned_by_user_id: number;
    content: string;
    created_at: string;
}

export interface MentionUser extends User {
    mentioned_at: string;
}

// ============================================
// Mention Types
// ============================================

export interface Mention {
    id: number;
    post_id?: number;
    comment_id?: number;
    mentioned_user_id: number;
    mentioned_by_user_id: number;
    context: string;
    created_at: string;
    is_read: boolean;
    read_at?: string;
    mentioned_by_username: string;
    mentioned_by_display_name: string;
    mentioned_by_profile_picture?: string;
    post_title?: string;
    post_content?: string;
    comment_content?: string;
}

export interface MentionRequest {
    content: string;
    postId?: number;
    commentId?: number;
}

export interface MentionsResponse {
    mentions: Mention[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}

export interface MentionCreateResponse {
    success: boolean;
    mentionsCreated: number;
    mentionedUsers: string[];
    message?: string;
}

export interface UserSearchResult {
    id: number;
    username: string;
    display_name: string;
    profile_picture?: string;
    reputation: number;
}

export interface UserSearchResponse {
    users: UserSearchResult[];
}

// ============================================
// Share Types
// ============================================

export type SharePlatform = 'twitter' | 'facebook' | 'linkedin' | 'reddit' | 'whatsapp' | 'telegram' | 'clipboard' | 'other';

export interface ShareRequest {
    platform: SharePlatform;
}

export interface ShareResponse {
    success: boolean;
    shareId: number;
    message: string;
}

export interface ShareStats {
    post_id: number;
    total_shares: number;
    twitter_shares: number;
    facebook_shares: number;
    linkedin_shares: number;
    clipboard_shares: number;
    last_shared_at?: string;
}

export interface TrendingShare {
    post_id: number;
    share_count: number;
    unique_sharers: number;
    title: string;
    content: string;
    author_username: string;
    author_display_name: string;
}

export interface TrendingSharesResponse {
    shares: TrendingShare[];
    limit: number;
    days: number;
}

export interface UserShare {
    id: number;
    post_id: number;
    platform: SharePlatform;
    created_at: string;
    post_title: string;
    post_content: string;
    post_author_username: string;
}

export interface UserSharesResponse {
    shares: UserShare[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}

export interface GlobalShareStats {
    total_shares: number;
    unique_posts_shared: number;
    unique_sharers: number;
    twitter_total: number;
    facebook_total: number;
    linkedin_total: number;
    clipboard_total: number;
}

// ============================================
// Block Types
// ============================================

export interface BlockedUser {
    id: number;
    blocker_id: number;
    blocked_id: number;
    reason?: string;
    created_at: string;
    username: string;
    display_name?: string;
    profile_picture?: string;
    bio?: string;
}

export interface BlockRequest {
    reason?: string;
}

export interface BlockedUsersResponse {
    blocked: BlockedUser[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}

export interface BlockStatus {
    isBlocked: boolean;
    iBlockedThem: boolean;
    theyBlockedMe: boolean;
}

export interface BlockStats {
    blocked_count: number;
    blocked_by_count: number;
}

export interface BlockResponse {
    success: boolean;
    blockId: number;
    blockedUser: BlockedUser;
    message: string;
}

export interface UnblockResponse {
    success: boolean;
    message: string;
}

// ============================================
// API Response Types
// ============================================

export interface FollowResponse {
    success: boolean;
    message: string;
    followId?: number;
    followedUser?: User;
}

export interface UnfollowResponse {
    success: boolean;
    message: string;
}

export interface ApiError {
    error: string;
    errors?: Array<{
        msg: string;
        param: string;
        location: string;
    }>;
}
