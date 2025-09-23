// API 응답 타입 정의
export interface ApiResponse<T = any> {
    data?: T;
    error?: string;
    detail?: string;
}

// 게시판 타입
export interface Board {
    id: string;
    title: string;
    ordering?: number;
    deleted?: number;
    created_at?: string;
    updated_at?: string;
}

// 게시글 타입
export interface Post {
    id: string;
    board_id: string;
    title: string;
    content?: string;
    date?: string;
    tag?: string;
    thumb?: string;
    author?: string;
    category?: string;
    views?: number;
    comments?: number;
    likes?: number;
    deleted?: number;
    created_at?: string;
    updated_at?: string;
    isHot?: boolean;
    isNew?: boolean;
}

// 사용자 타입
export interface User {
    id: number;
    display_name?: string;
    email?: string;
    role?: 'user' | 'moderator' | 'admin';
    status?: 'active' | 'inactive';
    created_at?: string;
    updated_at?: string;
}

// 인증 관련 타입
export interface AuthResponse {
    provider: string;
    userId: number;
    access: string;
    refresh: string;
    access_expires_in: number;
    refresh_expires_in: number;
    legacyToken?: string;
    linked: boolean;
}

export interface LoginProvider {
    id: string;
    name: string;
    enabled: boolean;
}

// 목록 조회 매개변수
export interface PostListParams {
    q?: string;
    page?: number;
    limit?: number;
    approx?: boolean;
}

// 게시글 생성/수정 데이터
export interface CreatePostData {
    title: string;
    content?: string;
    author?: string;
    category?: string;
    tag?: string;
    thumb?: string;
}

export interface UpdatePostData extends Partial<CreatePostData> { }

// 게시판 생성/수정 데이터
export interface CreateBoardData {
    id: string;
    title: string;
    ordering?: number;
}

export interface UpdateBoardData {
    title?: string;
    ordering?: number;
}

// 공지사항 타입
export interface Announcement {
    id: number;
    slug?: string;
    title: string;
    body?: string;
    starts_at?: string;
    ends_at?: string;
    priority?: number;
    active?: number;
    deleted?: number;
    created_at?: string;
    updated_at?: string;
}

// 이벤트 타입
export interface Event {
    id: number;
    title: string;
    body?: string;
    starts_at?: string;
    ends_at?: string;
    status?: string;
    deleted?: number;
    created_at?: string;
    updated_at?: string;
}

// 메트릭 타입
export interface Metrics {
    runtime?: any;
    views?: any;
    clients?: any;
    auth?: any;
}

// 클라이언트 메트릭 데이터
export interface ClientMetricData {
    name: 'LCP' | 'CLS' | 'FID' | 'INP' | 'LAF';
    value: number;
}

export interface ClientMetricsPayload {
    metrics: ClientMetricData[];
}