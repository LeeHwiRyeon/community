/**
 * API 서비스 유틸리티
 * 백엔드 API와의 통신을 담당
 */

// API 기본 URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

// 공통 응답 타입
export interface ApiResponse<T = any> {
    success: boolean
    message?: string
    data?: T
    error?: string
}

// API 클라이언트 클래스
class ApiClient {
    private baseURL: string
    private defaultHeaders: Record<string, string>

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        }
    }

    // 토큰 설정
    setToken(token: string | null) {
        if (token) {
            this.defaultHeaders['Authorization'] = `Bearer ${token}`
        } else {
            delete this.defaultHeaders['Authorization']
        }
    }

    // 공통 요청 메서드
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        try {
            const url = `${this.baseURL}${endpoint}`
            const config: RequestInit = {
                ...options,
                headers: {
                    ...this.defaultHeaders,
                    ...options.headers
                }
            }

            const response = await fetch(url, config)
            const data = await response.json()

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || `HTTP ${response.status}: ${response.statusText}`,
                    error: data.error
                }
            }

            return data
        } catch (error) {
            console.error('API 요청 오류:', error)
            return {
                success: false,
                message: '네트워크 오류가 발생했습니다.',
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }

    // GET 요청
    async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
        const url = new URL(`${this.baseURL}${endpoint}`)
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, String(value))
                }
            })
        }

        return this.request<T>(url.pathname + url.search, {
            method: 'GET'
        })
    }

    // POST 요청
    async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined
        })
    }

    // PUT 요청
    async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined
        })
    }

    // DELETE 요청
    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'DELETE'
        })
    }

    // 파일 업로드
    async upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
        const headers = { ...this.defaultHeaders }
        delete headers['Content-Type'] // FormData는 자동으로 설정됨

        return this.request<T>(endpoint, {
            method: 'POST',
            headers,
            body: formData
        })
    }
}

// API 클라이언트 인스턴스
export const apiClient = new ApiClient()

// 인증 관련 API
export const authApi = {
    // 로그인
    login: (credentials: { email: string; password: string }) =>
        apiClient.post('/api/auth/login', credentials),

    // 회원가입
    register: (credentials: {
        email: string;
        password: string;
        username: string;
        displayName?: string
    }) => apiClient.post('/api/auth/register', credentials),

    // 토큰 검증
    verify: () => apiClient.get('/api/auth/verify'),

    // 로그아웃
    logout: () => apiClient.post('/api/auth/logout')
}

// 게시판 관련 API
export const boardsApi = {
    // 게시판 목록 조회
    getBoards: (params?: { category?: string; active?: boolean }) =>
        apiClient.get('/api/boards', params),

    // 특정 게시판 조회
    getBoard: (boardId: string) =>
        apiClient.get(`/api/boards/${boardId}`),

    // 게시판 생성 (관리자)
    createBoard: (data: {
        id: string;
        name: string;
        description?: string;
        category?: string;
        sortOrder?: number
    }) => apiClient.post('/api/boards', data),

    // 게시판 수정 (관리자)
    updateBoard: (boardId: string, data: {
        name?: string;
        description?: string;
        category?: string;
        sortOrder?: number;
        isActive?: boolean;
    }) => apiClient.put(`/api/boards/${boardId}`, data),

    // 게시판 삭제 (관리자)
    deleteBoard: (boardId: string) =>
        apiClient.delete(`/api/boards/${boardId}`)
}

// 게시글 관련 API
export const postsApi = {
    // 게시글 목록 조회
    getPosts: (params?: {
        boardId?: string;
        page?: number;
        limit?: number;
        sort?: string;
        order?: 'ASC' | 'DESC';
        search?: string;
        isPublished?: boolean;
    }) => apiClient.get('/api/posts', params),

    // 특정 게시글 조회
    getPost: (postId: string) =>
        apiClient.get(`/api/posts/${postId}`),

    // 게시글 생성
    createPost: (data: {
        boardId: string;
        title: string;
        content: string;
        contentType?: string;
        userId: string;
    }) => apiClient.post('/api/posts', data),

    // 게시글 수정
    updatePost: (postId: string, data: {
        title?: string;
        content?: string;
        contentType?: string;
        isPublished?: boolean;
        isPinned?: boolean;
    }) => apiClient.put(`/api/posts/${postId}`, data),

    // 게시글 삭제
    deletePost: (postId: string) =>
        apiClient.delete(`/api/posts/${postId}`)
}

// 댓글 관련 API
export const commentsApi = {
    // 댓글 목록 조회
    getComments: (params: {
        postId: string;
        page?: number;
        limit?: number;
        parentId?: string | null;
    }) => apiClient.get('/api/comments', params),

    // 특정 댓글 조회
    getComment: (commentId: string) =>
        apiClient.get(`/api/comments/${commentId}`),

    // 댓글 생성
    createComment: (data: {
        postId: string;
        content: string;
        userId: string;
        parentId?: string;
    }) => apiClient.post('/api/comments', data),

    // 댓글 수정
    updateComment: (commentId: string, data: {
        content: string;
    }) => apiClient.put(`/api/comments/${commentId}`, data),

    // 댓글 삭제
    deleteComment: (commentId: string) =>
        apiClient.delete(`/api/comments/${commentId}`)
}

// 파일 업로드 관련 API
export const uploadApi = {
    // 파일 업로드
    uploadFiles: (formData: FormData) =>
        apiClient.upload('/api/upload', formData),

    // 첨부파일 목록 조회
    getAttachments: (params?: {
        postId?: string;
        commentId?: string;
        userId?: string;
    }) => apiClient.get('/api/upload', params),

    // 첨부파일 삭제
    deleteAttachment: (attachmentId: string) =>
        apiClient.delete(`/api/upload/${attachmentId}`),

    // 파일 다운로드 URL 생성
    getDownloadUrl: (filename: string) =>
        `${API_BASE_URL}/api/upload/download/${filename}`
}

// 헬스 체크
export const healthApi = {
    check: () => apiClient.get('/health')
}

// 토큰 관리 헬퍼
export const tokenManager = {
    setToken: (token: string) => {
        apiClient.setToken(token)
        localStorage.setItem('auth_token', token)
    },

    getToken: () => {
        return localStorage.getItem('auth_token')
    },

    removeToken: () => {
        apiClient.setToken(null)
        localStorage.removeItem('auth_token')
    },

    // 초기화 시 토큰 설정
    init: () => {
        const token = localStorage.getItem('auth_token')
        if (token) {
            apiClient.setToken(token)
        }
    }
}

// 초기화
tokenManager.init()

export default apiClient