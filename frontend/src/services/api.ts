import type {
    ApiResponse,
    Board,
    Post,
    User,
    AuthResponse,
    LoginProvider,
    PostListParams,
    CreatePostData,
    UpdatePostData,
    CreateBoardData,
    UpdateBoardData,
    Announcement,
    Event,
    Metrics,
    ClientMetricsPayload
} from '../types/api';

// API 기본 설정
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:50000';
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || '/api';
const AUTH_ENDPOINT = import.meta.env.VITE_AUTH_ENDPOINT || '/api/auth';

// 토큰 관리
class TokenManager {
    private accessToken: string | null = null;
    private refreshToken: string | null = null;

    setTokens(access: string, refresh: string) {
        this.accessToken = access;
        this.refreshToken = refresh;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
    }

    getAccessToken(): string | null {
        if (!this.accessToken) {
            this.accessToken = localStorage.getItem('access_token');
        }
        return this.accessToken;
    }

    getRefreshToken(): string | null {
        if (!this.refreshToken) {
            this.refreshToken = localStorage.getItem('refresh_token');
        }
        return this.refreshToken;
    }

    clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }

    isAuthenticated(): boolean {
        return !!this.getAccessToken();
    }
}

export const tokenManager = new TokenManager();

// HTTP 클라이언트 클래스
class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers: HeadersInit = {
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Charset': 'utf-8',
            ...options.headers,
        };

        // 인증 토큰 추가
        const token = tokenManager.getAccessToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (!response.ok) {
                // 401 오류 시 토큰 갱신 시도
                if (response.status === 401 && token) {
                    const refreshed = await this.refreshAccessToken();
                    if (refreshed) {
                        // 재시도
                        headers['Authorization'] = `Bearer ${tokenManager.getAccessToken()}`;
                        const retryResponse = await fetch(url, {
                            ...options,
                            headers,
                        });
                        if (retryResponse.ok) {
                            const data = await retryResponse.json();
                            return { data };
                        }
                    }
                }

                const errorData = await response.json();
                return {
                    error: errorData.error || 'Request failed',
                    detail: errorData.detail,
                };
            }

            const data = await response.json();
            return { data };
        } catch (error) {
            return {
                error: 'Network error',
                detail: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    private async refreshAccessToken(): Promise<boolean> {
        const refreshToken = tokenManager.getRefreshToken();
        if (!refreshToken) return false;

        try {
            const response = await fetch(`${this.baseUrl}${AUTH_ENDPOINT}/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh: refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                tokenManager.setTokens(data.access, data.refresh);
                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }

        tokenManager.clearTokens();
        return false;
    }

    // GET 요청
    async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined) {
                    url.searchParams.append(key, String(params[key]));
                }
            });
        }
        return this.request<T>(url.pathname + url.search);
    }

    // POST 요청
    async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    // PATCH 요청
    async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    // DELETE 요청
    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'DELETE',
        });
    }
}

// API 클라이언트 인스턴스
const apiClient = new ApiClient(API_BASE_URL);

// 인증 API
export const authApi = {
    // 사용 가능한 로그인 제공자 목록
    getProviders: (): Promise<ApiResponse<LoginProvider[]>> =>
        apiClient.get(`${AUTH_ENDPOINT}/providers`),

    // 로그인 URL 가져오기 (OAuth)
    getLoginUrl: (provider: string): Promise<ApiResponse<{ url: string }>> =>
        apiClient.get(`${AUTH_ENDPOINT}/login/${provider}`),

    // 현재 사용자 정보
    getMe: (): Promise<ApiResponse<User>> =>
        apiClient.get(`${AUTH_ENDPOINT}/me`),

    // 토큰 갱신
    refreshToken: (refreshToken: string): Promise<ApiResponse<AuthResponse>> =>
        apiClient.post(`${AUTH_ENDPOINT}/refresh`, { refresh: refreshToken }),

    // 로그아웃
    logout: () => {
        tokenManager.clearTokens();
    },
};

// 게시판 API
export const boardsApi = {
    // 게시판 목록
    getAll: (): Promise<ApiResponse<Board[]>> =>
        apiClient.get(`${API_ENDPOINT}/boards`),

    // 게시판 생성
    create: (data: CreateBoardData): Promise<ApiResponse<Board>> =>
        apiClient.post(`${API_ENDPOINT}/boards`, data),

    // 게시판 수정
    update: (id: string, data: UpdateBoardData): Promise<ApiResponse<Board>> =>
        apiClient.patch(`${API_ENDPOINT}/boards/${id}`, data),

    // 게시판 삭제
    delete: (id: string): Promise<ApiResponse<void>> =>
        apiClient.delete(`${API_ENDPOINT}/boards/${id}`),
};

// 게시글 API
export const postsApi = {
    // 게시판별 게시글 목록
    getByBoard: (boardId: string, params?: PostListParams): Promise<ApiResponse<Post[]>> =>
        apiClient.get(`${API_ENDPOINT}/boards/${boardId}/posts`, params),

    // 게시글 상세
    getById: (postId: string): Promise<ApiResponse<Post>> =>
        apiClient.get(`${API_ENDPOINT}/posts/${postId}`),

    // 게시글 생성
    create: (boardId: string, data: CreatePostData): Promise<ApiResponse<Post>> =>
        apiClient.post(`${API_ENDPOINT}/boards/${boardId}/posts`, data),

    // 게시글 수정
    update: (boardId: string, postId: string, data: UpdatePostData): Promise<ApiResponse<Post>> =>
        apiClient.patch(`${API_ENDPOINT}/boards/${boardId}/posts/${postId}`, data),

    // 게시글 삭제
    delete: (boardId: string, postId: string): Promise<ApiResponse<void>> =>
        apiClient.delete(`${API_ENDPOINT}/boards/${boardId}/posts/${postId}`),

    // 조회수 증가
    incrementView: (postId: string): Promise<ApiResponse<void>> =>
        apiClient.post(`${API_ENDPOINT}/posts/${postId}/view`),

    // 전체 게시글 맵 (관리용)
    getMap: (): Promise<ApiResponse<Record<string, Post[]>>> =>
        apiClient.get(`${API_ENDPOINT}/posts-map`),
};

// 공지사항 API
export const announcementsApi = {
    // 공지사항 목록
    getAll: (params?: { active?: boolean }): Promise<ApiResponse<Announcement[]>> =>
        apiClient.get(`${API_ENDPOINT}/announcements`, params),

    // 공지사항 상세
    getById: (id: number): Promise<ApiResponse<Announcement>> =>
        apiClient.get(`${API_ENDPOINT}/announcements/${id}`),

    // 공지사항 생성 (관리자 권한 필요)
    create: (data: Partial<Announcement>): Promise<ApiResponse<Announcement>> =>
        apiClient.post(`${API_ENDPOINT}/announcements`, data),

    // 공지사항 수정 (관리자 권한 필요)
    update: (id: number, data: Partial<Announcement>): Promise<ApiResponse<Announcement>> =>
        apiClient.patch(`${API_ENDPOINT}/announcements/${id}`, data),

    // 공지사항 삭제 (관리자 권한 필요)
    delete: (id: number): Promise<ApiResponse<void>> =>
        apiClient.delete(`${API_ENDPOINT}/announcements/${id}`),
};

// 이벤트 API
export const eventsApi = {
    // 이벤트 목록
    getAll: (params?: { status?: string }): Promise<ApiResponse<Event[]>> =>
        apiClient.get(`${API_ENDPOINT}/events`, params),

    // 이벤트 상세
    getById: (id: number): Promise<ApiResponse<Event>> =>
        apiClient.get(`${API_ENDPOINT}/events/${id}`),

    // 이벤트 생성 (관리자 권한 필요)
    create: (data: Partial<Event>): Promise<ApiResponse<Event>> =>
        apiClient.post(`${API_ENDPOINT}/events`, data),

    // 이벤트 수정 (관리자 권한 필요)
    update: (id: number, data: Partial<Event>): Promise<ApiResponse<Event>> =>
        apiClient.patch(`${API_ENDPOINT}/events/${id}`, data),

    // 이벤트 삭제 (관리자 권한 필요)
    delete: (id: number): Promise<ApiResponse<void>> =>
        apiClient.delete(`${API_ENDPOINT}/events/${id}`),
};

// 메트릭 API
export const metricsApi = {
    // 메트릭 데이터 (JSON)
    get: (): Promise<ApiResponse<Metrics>> =>
        apiClient.get('/metrics'),

    // 헬스 체크
    health: (verbose?: boolean): Promise<ApiResponse<any>> =>
        apiClient.get('/health', verbose ? { verbose: 1 } : undefined),

    // 라이브니스 체크
    live: (): Promise<ApiResponse<any>> =>
        apiClient.get('/live'),

    // 준비 상태 체크
    ready: (): Promise<ApiResponse<any>> =>
        apiClient.get('/ready'),

    // 클라이언트 메트릭 전송
    sendClientMetrics: (data: ClientMetricsPayload): Promise<ApiResponse<void>> =>
        apiClient.post('/client-metric', data),

    // 클라이언트 메트릭 조회
    getClientMetrics: (): Promise<ApiResponse<any>> =>
        apiClient.get('/client-metric'),
};

// 디버그 API
export const debugApi = {
    // 뷰 배치 강제 flush
    flushViews: (): Promise<ApiResponse<void>> =>
        apiClient.post('/debug/flush-views'),
};

// 사용자 API (관리자 기능)
export const usersApi = {
    // 사용자 역할 변경 (관리자 권한 필요)
    updateRole: (userId: number, role: 'user' | 'moderator' | 'admin'): Promise<ApiResponse<User>> =>
        apiClient.post(`${AUTH_ENDPOINT}/users/${userId}/role`, { role }),
};

// 통합 API 객체
export const api = {
    auth: authApi,
    boards: boardsApi,
    posts: postsApi,
    announcements: announcementsApi,
    events: eventsApi,
    metrics: metricsApi,
    debug: debugApi,
    users: usersApi,
    tokenManager,
};