// API 클라이언트 유틸리티
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * CSRF 토큰 관리
 */
let csrfToken: string | null = null;
let csrfTokenFetching: Promise<string> | null = null;
let csrfTokenExpiry: number = 0; // 토큰 만료 시간 (timestamp)

/**
 * CSRF 토큰 캐시 유효성 확인
 */
function isCSRFTokenValid(): boolean {
    if (!csrfToken) return false;

    // 만료 시간이 설정되어 있고, 아직 만료되지 않았으면 유효
    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5분 버퍼 (만료 5분 전에 갱신)

    return csrfTokenExpiry > 0 && now < (csrfTokenExpiry - bufferTime);
}

/**
 * CSRF 토큰 가져오기 (캐싱 포함)
 */
async function fetchCSRFToken(): Promise<string> {
    // 캐시된 토큰이 유효하면 재사용
    if (isCSRFTokenValid()) {
        console.log('🔄 Using cached CSRF token');
        return csrfToken!;
    }

    // 이미 가져오는 중이면 같은 Promise 반환 (중복 요청 방지)
    if (csrfTokenFetching) {
        return csrfTokenFetching;
    }

    csrfTokenFetching = (async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/csrf-token`, {
                method: 'GET',
                credentials: 'include' // 쿠키 포함
            });

            if (!response.ok) {
                throw new Error(`CSRF token fetch failed: ${response.status}`);
            }

            const data = await response.json();
            csrfToken = data.data?.csrfToken || data.csrfToken;

            // 토큰 만료 시간 설정 (1시간)
            csrfTokenExpiry = Date.now() + (60 * 60 * 1000);

            console.log('✅ CSRF token fetched successfully');
            return csrfToken!;
        } catch (error) {
            console.error('❌ Failed to fetch CSRF token:', error);
            throw error;
        } finally {
            csrfTokenFetching = null;
        }
    })();

    return csrfTokenFetching;
}

/**
 * CSRF 토큰 초기화
 */
export async function initCSRFToken(): Promise<void> {
    try {
        await fetchCSRFToken();
    } catch (error) {
        console.warn('⚠️ CSRF token initialization failed:', error);
    }
}

/**
 * CSRF 토큰 설정 (로그인/회원가입 시)
 */
export function setCSRFToken(token: string): void {
    csrfToken = token;
    csrfTokenExpiry = Date.now() + (60 * 60 * 1000); // 1시간
    console.log('🔐 CSRF token set');
}

/**
 * CSRF 토큰 제거 (로그아웃 시)
 */
export function clearCSRFToken(): void {
    csrfToken = null;
    csrfTokenExpiry = 0;
    console.log('🧹 CSRF token cleared');
}

/**
 * CSRF 토큰 갱신
 */
async function refreshCSRFToken(): Promise<string> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/csrf-refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`CSRF token refresh failed: ${response.status}`);
        }

        const data = await response.json();
        csrfToken = data.csrfToken;
        csrfTokenExpiry = Date.now() + (60 * 60 * 1000); // 1시간

        console.log('🔄 CSRF token refreshed');
        return csrfToken!;
    } catch (error) {
        console.error('❌ Failed to refresh CSRF token:', error);
        // 갱신 실패 시 새로 가져오기
        return fetchCSRFToken();
    }
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Set tokens in localStorage
 */
export function setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

/**
 * Clear tokens from localStorage
 */
export function clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Logout - Blacklist tokens and clear local storage
 */
export async function logout(): Promise<void> {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    // Call backend logout endpoint to blacklist tokens
    if (accessToken) {
        try {
            await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'x-csrf-token': csrfToken || ''
                },
                credentials: 'include',
                body: JSON.stringify({
                    refresh: refreshToken
                })
            });
            console.log('✅ Logout successful - tokens blacklisted');
        } catch (error) {
            console.error('❌ Logout API call failed:', error);
            // Still clear local tokens even if API call fails
        }
    }

    // Clear tokens from local storage
    clearTokens();
    clearCSRFToken();
    console.log('🚪 Logged out - local tokens cleared');
}

/**
 * Handle 401 Unauthorized errors (token expired/revoked)
 * Automatically logout and redirect to login page
 */
async function handleUnauthorized(error: any): Promise<void> {
    if (error?.response?.status === 401) {
        const errorData = error.response?.data || {};
        let userMessage = '인증이 만료되었습니다. 다시 로그인해 주세요.';

        // 토큰 블랙리스트 등록된 경우
        if (errorData.code === 'TOKEN_REVOKED') {
            console.warn('🚫 Token has been revoked - automatic logout');
            userMessage = '보안을 위해 로그아웃되었습니다. 다시 로그인해 주세요.';
        }
        // 토큰 만료된 경우
        else if (errorData.code === 'TOKEN_EXPIRED') {
            console.warn('⏰ Token has expired - automatic logout');
            userMessage = '로그인 시간이 만료되었습니다. 다시 로그인해 주세요.';
        }
        // 기타 401 에러
        else {
            console.warn('⚠️ Unauthorized - automatic logout');
        }

        // 사용자에게 알림 (선택적)
        if (typeof window !== 'undefined' && window.alert) {
            window.alert(userMessage);
        }

        // 로컬 토큰 제거
        clearTokens();
        clearCSRFToken();

        // 로그인 페이지로 리다이렉트 (현재 경로 저장)
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
            sessionStorage.setItem('redirectAfterLogin', currentPath);
            window.location.href = '/login';
        }
    }
}

/**
 * Handle CSRF validation errors with user-friendly messages
 */
async function handleCSRFError(error: any): Promise<void> {
    if (error?.response?.status === 403) {
        const errorData = error.response?.data || {};

        if (errorData.code === 'CSRF_VALIDATION_FAILED' || errorData.code === 'CSRF_INVALID') {
            console.warn('⚠️ CSRF validation failed');

            // 사용자 친화적 메시지
            const userMessage = '보안 검증에 실패했습니다. 페이지를 새로고침하고 다시 시도해 주세요.';

            if (typeof window !== 'undefined' && window.alert) {
                window.alert(userMessage);
            }
        }
    }
}/**
 * Enhanced fetch with automatic error handling
 */
async function fetchWithErrorHandling(url: string, options: RequestInit): Promise<Response> {
    try {
        const response = await fetch(url, options);

        // 401 에러 처리
        if (response.status === 401) {
            const errorData = await response.json().catch(() => ({}));
            await handleUnauthorized({
                response: {
                    status: 401,
                    data: errorData
                }
            });
            throw new Error('Unauthorized - logged out');
        }

        return response;
    } catch (error) {
        // 네트워크 오류 등
        throw error;
    }
}

export const apiClient = {
    async get(url: string, config?: any) {
        const accessToken = getAccessToken();

        const response = await fetchWithErrorHandling(`${API_BASE_URL}${url}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
                ...config?.headers,
            },
            credentials: 'include',
            ...config,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    },

    async post(url: string, data?: any, config?: any) {
        // CSRF 토큰이 없으면 가져오기
        if (!csrfToken) {
            await fetchCSRFToken();
        }

        const accessToken = getAccessToken();

        const response = await fetchWithErrorHandling(`${API_BASE_URL}${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken || '',
                ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
                ...config?.headers,
            },
            credentials: 'include',
            body: data ? JSON.stringify(data) : undefined,
            ...config,
        });

        // CSRF 검증 실패 시 토큰 갱신 후 재시도
        if (response.status === 403) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.code === 'CSRF_VALIDATION_FAILED' || errorData.code === 'CSRF_INVALID') {
                console.warn('⚠️ CSRF validation failed, refreshing token and retrying...');

                try {
                    await refreshCSRFToken();

                    // 재시도
                    const retryResponse = await fetchWithErrorHandling(`${API_BASE_URL}${url}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-csrf-token': csrfToken || '',
                            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
                            ...config?.headers,
                        },
                        credentials: 'include',
                        body: data ? JSON.stringify(data) : undefined,
                        ...config,
                    });

                    if (!retryResponse.ok) {
                        throw new Error(`HTTP error! status: ${retryResponse.status}`);
                    }

                    return retryResponse.json();
                } catch (error) {
                    console.error('❌ CSRF token refresh and retry failed:', error);
                    await handleCSRFError({ response: { status: 403, data: errorData } });
                    throw error;
                }
            }
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 응답 헤더에서 갱신된 CSRF 토큰 확인
        const refreshedToken = response.headers.get('X-CSRF-Token-Refreshed');
        if (refreshedToken) {
            csrfToken = refreshedToken;
            console.log('🔄 CSRF token auto-refreshed from response');
        }

        return response.json();
    },

    async put(url: string, data?: any, config?: any) {
        // CSRF 토큰이 없으면 가져오기
        if (!csrfToken) {
            await fetchCSRFToken();
        }

        const accessToken = getAccessToken();

        const response = await fetchWithErrorHandling(`${API_BASE_URL}${url}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken || '',
                ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
                ...config?.headers,
            },
            credentials: 'include',
            body: data ? JSON.stringify(data) : undefined,
            ...config,
        });

        // CSRF 검증 실패 시 처리 (POST와 동일)
        if (response.status === 403) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.code === 'CSRF_VALIDATION_FAILED' || errorData.code === 'CSRF_INVALID') {
                console.warn('⚠️ CSRF validation failed, refreshing token and retrying...');

                try {
                    await refreshCSRFToken();

                    const retryResponse = await fetchWithErrorHandling(`${API_BASE_URL}${url}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-csrf-token': csrfToken || '',
                            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
                            ...config?.headers,
                        },
                        credentials: 'include',
                        body: data ? JSON.stringify(data) : undefined,
                        ...config,
                    });

                    if (!retryResponse.ok) {
                        throw new Error(`HTTP error! status: ${retryResponse.status}`);
                    }

                    return retryResponse.json();
                } catch (error) {
                    console.error('❌ CSRF token refresh and retry failed:', error);
                    await handleCSRFError({ response: { status: 403, data: errorData } });
                    throw error;
                }
            }
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    },

    async delete(url: string, config?: any) {
        // CSRF 토큰이 없으면 가져오기
        if (!csrfToken) {
            await fetchCSRFToken();
        }

        const accessToken = getAccessToken();

        const response = await fetchWithErrorHandling(`${API_BASE_URL}${url}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken || '',
                ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
                ...config?.headers,
            },
            credentials: 'include',
            ...config,
        });

        // CSRF 검증 실패 시 처리 (POST와 동일)
        if (response.status === 403) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.code === 'CSRF_VALIDATION_FAILED' || errorData.code === 'CSRF_INVALID') {
                console.warn('⚠️ CSRF validation failed, refreshing token and retrying...');

                try {
                    await refreshCSRFToken();

                    const retryResponse = await fetchWithErrorHandling(`${API_BASE_URL}${url}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-csrf-token': csrfToken || '',
                            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
                            ...config?.headers,
                        },
                        credentials: 'include',
                        ...config,
                    });

                    if (!retryResponse.ok) {
                        throw new Error(`HTTP error! status: ${retryResponse.status}`);
                    }

                    return retryResponse.json();
                } catch (error) {
                    console.error('❌ CSRF token refresh and retry failed:', error);
                    await handleCSRFError({ response: { status: 403, data: errorData } });
                    throw error;
                }
            }
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    },
};
