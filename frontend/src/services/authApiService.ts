/**
 * 인증 API 서비스
 * 
 * @description
 * 백엔드 인증 API와 통신하는 서비스
 * CSRF 토큰 자동 처리 포함
 */

import { apiClient, setTokens, clearTokens, setCSRFToken, clearCSRFToken } from '../utils/apiClient';

/**
 * 로그인 요청 데이터
 */
export interface LoginRequest {
    email: string;
    password: string;
}

/**
 * 회원가입 요청 데이터
 */
export interface RegisterRequest {
    email: string;
    password: string;
    username: string;
    displayName?: string;
}

/**
 * 인증 응답 데이터
 */
export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        user: {
            id: string;
            email: string;
            username: string;
            displayName: string;
        };
        token: string;
        csrfToken: string;
    };
}

/**
 * 사용자 정보
 */
export interface UserInfo {
    id: string;
    email: string;
    username: string;
    displayName: string;
}

/**
 * 로그인
 * 
 * @param credentials - 로그인 정보
 * @returns 인증 응답
 * 
 * @example
 * try {
 *     const response = await authApiService.login({
 *         email: 'user@example.com',
 *         password: 'password123'
 *     });
 *     
 *     console.log('Logged in:', response.data.user);
 *     // 토큰 자동 저장됨
 * } catch (error) {
 *     console.error('Login failed:', error);
 * }
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
        const response = await apiClient.post('/api/auth/login', credentials);

        if (response.success) {
            const { token, csrfToken } = response.data;

            // JWT 토큰 저장
            setTokens(token, token); // access & refresh (현재는 동일)

            // CSRF 토큰 저장
            if (csrfToken) {
                setCSRFToken(csrfToken);
            }

            console.log('✅ Login successful');
        }

        return response;
    } catch (error) {
        console.error('❌ Login failed:', error);
        throw error;
    }
}

/**
 * 회원가입
 * 
 * @param userData - 회원가입 정보
 * @returns 인증 응답
 * 
 * @example
 * try {
 *     const response = await authApiService.register({
 *         email: 'newuser@example.com',
 *         password: 'securepass123',
 *         username: 'newuser',
 *         displayName: 'New User'
 *     });
 *     
 *     console.log('Registered:', response.data.user);
 * } catch (error) {
 *     console.error('Registration failed:', error);
 * }
 */
export async function register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
        const response = await apiClient.post('/api/auth/register', userData);

        if (response.success) {
            const { token, csrfToken } = response.data;

            // JWT 토큰 저장
            setTokens(token, token);

            // CSRF 토큰 저장
            if (csrfToken) {
                setCSRFToken(csrfToken);
            }

            console.log('✅ Registration successful');
        }

        return response;
    } catch (error) {
        console.error('❌ Registration failed:', error);
        throw error;
    }
}

/**
 * 로그아웃
 * 
 * @description
 * 서버에 로그아웃 요청하여 토큰 블랙리스트에 등록하고 로컬 토큰 제거
 * Access Token과 Refresh Token 모두 블랙리스트에 등록됨
 * 
 * @example
 * await authApiService.logout();
 * console.log('Logged out - tokens blacklisted');
 */
export async function logoutApi(): Promise<void> {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    try {
        // 서버에 로그아웃 요청 (토큰 블랙리스트 등록)
        if (accessToken) {
            await apiClient.post('/api/auth/logout', {
                refresh: refreshToken
            });
            console.log('✅ Logout successful - tokens blacklisted on server');
        } else {
            console.log('⚠️ No access token found - clearing local storage only');
        }
    } catch (error: any) {
        console.error('❌ Logout API failed:', error);

        // 네트워크 오류나 서버 오류 시에도 로컬 토큰은 제거
        if (error?.response?.status === 401) {
            console.log('⚠️ Token already invalid - clearing local storage');
        } else {
            console.warn('⚠️ Logout API failed but clearing local tokens anyway');
        }
    } finally {
        // 항상 로컬 토큰 제거 (API 실패 시에도)
        clearTokens();
        clearCSRFToken();
        console.log('🚪 Logged out - local tokens cleared');
    }
}

/**
 * 토큰 검증
 * 
 * @param token - JWT 토큰
 * @returns 사용자 정보
 * 
 * @example
 * try {
 *     const user = await authApiService.verifyToken(token);
 *     console.log('Token valid:', user);
 * } catch (error) {
 *     console.error('Token invalid');
 * }
 */
export async function verifyToken(token: string): Promise<UserInfo> {
    try {
        const response = await apiClient.get('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.success) {
            return response.data.user;
        }

        throw new Error('Token verification failed');
    } catch (error) {
        console.error('❌ Token verification failed:', error);
        throw error;
    }
}

/**
 * CSRF 토큰 수동 갱신
 * 
 * @description
 * 일반적으로 자동 갱신되지만, 필요 시 수동 갱신 가능
 * 
 * @example
 * await authApiService.refreshCSRF();
 * console.log('CSRF token refreshed');
 */
export async function refreshCSRF(): Promise<void> {
    try {
        const response = await apiClient.post('/api/auth/csrf-refresh');

        if (response.success) {
            setCSRFToken(response.csrfToken);
            console.log('✅ CSRF token refreshed');
        }
    } catch (error) {
        console.error('❌ CSRF refresh failed:', error);
        throw error;
    }
}

/**
 * 인증 API 서비스
 */
export const authApiService = {
    login,
    register,
    logout: logoutApi,
    verifyToken,
    refreshCSRF
};
