/**
 * API Types and Interfaces
 * Comprehensive type definitions for all API interactions
 */

// Base API Response
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ApiError;
    message?: string;
}

// Error Types
export interface ApiError {
    message: string;
    status?: number;
    code?: string;
    details?: any;
    timestamp: string;
}

// User Types
export interface User {
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatar?: string;
    bio?: string;
    level: number;
    experience: number;
    badges: Badge[];
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
    isOnline: boolean;
    preferences: UserPreferences;
    stats: UserStats;
}

export interface UserPreferences {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notifications: NotificationSettings;
    privacy: PrivacySettings;
}

export interface NotificationSettings {
    email: boolean;
    push: boolean;
    inApp: boolean;
    mentions: boolean;
    replies: boolean;
    follows: boolean;
    likes: boolean;
}

export interface PrivacySettings {
    profileVisibility: 'public' | 'friends' | 'private';
    showEmail: boolean;
    showOnlineStatus: boolean;
    allowDirectMessages: boolean;
}

export interface UserStats {
    postsCount: number;
    commentsCount: number;
    likesReceived: number;
    followersCount: number;
    followingCount: number;
    reputation: number;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    earnedAt: string;
}

// Post Types
export interface Post {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    author: User;
    board: Board;
    category?: Category;
    tags: Tag[];
    attachments: Attachment[];
    votes: VoteSummary;
    comments: CommentSummary;
    views: number;
    isPinned: boolean;
    isLocked: boolean;
    isDraft: boolean;
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
    readBy: string[]; // User IDs who have read this post
}

export interface PostSummary {
    id: string;
    title: string;
    excerpt: string;
    author: UserSummary;
    board: BoardSummary;
    category?: CategorySummary;
    tags: Tag[];
    votes: VoteSummary;
    comments: CommentSummary;
    views: number;
    isPinned: boolean;
    isLocked: boolean;
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
    isRead: boolean;
}

export interface PostCreateRequest {
    title: string;
    content: string;
    boardId: string;
    categoryId?: string;
    tags: string[];
    attachments?: string[];
    isDraft?: boolean;
}

export interface PostUpdateRequest {
    title?: string;
    content?: string;
    categoryId?: string;
    tags?: string[];
    attachments?: string[];
    isDraft?: boolean;
}

// Board Types
export interface Board {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    isPublic: boolean;
    isActive: boolean;
    rules: string[];
    moderators: User[];
    categories: Category[];
    stats: BoardStats;
    createdAt: string;
    updatedAt: string;
}

export interface BoardSummary {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    isPublic: boolean;
    stats: BoardStats;
}

export interface BoardStats {
    postsCount: number;
    commentsCount: number;
    membersCount: number;
    activeUsersCount: number;
}

// Category Types
export interface Category {
    id: string;
    name: string;
    description: string;
    color: string;
    icon: string;
    boardId: string;
    isActive: boolean;
    postCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface CategorySummary {
    id: string;
    name: string;
    description: string;
    color: string;
    icon: string;
    postCount: number;
}

// Comment Types
export interface Comment {
    id: string;
    content: string;
    author: User;
    postId: string;
    parentId?: string;
    replies: Comment[];
    votes: VoteSummary;
    isEdited: boolean;
    editedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CommentSummary {
    count: number;
    latest?: {
        id: string;
        author: UserSummary;
        content: string;
        createdAt: string;
    };
}

export interface CommentCreateRequest {
    content: string;
    postId: string;
    parentId?: string;
}

export interface CommentUpdateRequest {
    content: string;
}

// Vote Types
export interface Vote {
    id: string;
    userId: string;
    postId?: string;
    commentId?: string;
    type: 'up' | 'down';
    createdAt: string;
}

export interface VoteSummary {
    upvotes: number;
    downvotes: number;
    userVote?: 'up' | 'down';
    score: number;
}

// Tag Types
export interface Tag {
    id: string;
    name: string;
    color: string;
    description?: string;
    usageCount: number;
    createdAt: string;
}

// Attachment Types
export interface Attachment {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    thumbnailUrl?: string;
    uploadedBy: User;
    uploadedAt: string;
    metadata?: AttachmentMetadata;
}

export interface AttachmentMetadata {
    width?: number;
    height?: number;
    duration?: number; // for videos
    format?: string;
}

// Search Types
export interface SearchQuery {
    q: string;
    boardId?: string;
    categoryId?: string;
    tags?: string[];
    authorId?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: 'relevance' | 'date' | 'votes' | 'views';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export interface SearchResult {
    posts: PostSummary[];
    users: UserSummary[];
    boards: BoardSummary[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

// Notification Types
export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
    isRead: boolean;
    createdAt: string;
    readAt?: string;
}

export type NotificationType =
    | 'post_liked'
    | 'post_commented'
    | 'comment_liked'
    | 'comment_replied'
    | 'user_followed'
    | 'user_mentioned'
    | 'post_approved'
    | 'post_rejected'
    | 'system_announcement';

// Pagination Types
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

// Form Types
export interface LoginForm {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface RegisterForm {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    agreeToTerms: boolean;
}

export interface ProfileUpdateForm {
    displayName: string;
    bio: string;
    avatar?: File;
    preferences: UserPreferences;
}

// API Request/Response Types
export interface LoginRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface LoginResponse {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: number;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    agreeToTerms: boolean;
}

export interface RegisterResponse {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: number;
}

// Translation Types
export interface TranslationRequest {
    text: string;
    sourceLang?: string;
    targetLang: string;
    cache?: boolean;
}

export interface TranslationResponse {
    success: boolean;
    translatedText: string;
    sourceLang: string;
    targetLang: string;
}

export interface LanguageDetectionRequest {
    text: string;
}

export interface LanguageDetectionResponse {
    success: boolean;
    language: string;
    confidence: number;
}

// Utility Types
export interface UserSummary {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    level: number;
    isOnline: boolean;
}

export interface BoardSummary {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    isPublic: boolean;
    stats: BoardStats;
}

export interface CategorySummary {
    id: string;
    name: string;
    description: string;
    color: string;
    icon: string;
    postCount: number;
}

// Filter Types
export interface PostFilter {
    boardId?: string;
    categoryId?: string;
    authorId?: string;
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
    isPinned?: boolean;
    isDraft?: boolean;
    sortBy?: 'date' | 'votes' | 'views' | 'comments';
    sortOrder?: 'asc' | 'desc';
}

export interface UserFilter {
    search?: string;
    level?: number;
    isOnline?: boolean;
    sortBy?: 'username' | 'level' | 'reputation' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}

// Analytics Types
export interface AnalyticsData {
    period: 'day' | 'week' | 'month' | 'year';
    metrics: {
        posts: number;
        comments: number;
        users: number;
        views: number;
        votes: number;
    };
    trends: {
        posts: TrendData[];
        comments: TrendData[];
        users: TrendData[];
        views: TrendData[];
    };
}

export interface TrendData {
    date: string;
    value: number;
}

// WebSocket Types
export interface WebSocketMessage {
    type: string;
    data: any;
    timestamp: string;
}

export interface WebSocketEvent {
    type: 'post_created' | 'post_updated' | 'post_deleted' | 'comment_created' | 'user_online' | 'user_offline';
    data: any;
    timestamp: string;
}

// All types are already exported above with individual export statements
