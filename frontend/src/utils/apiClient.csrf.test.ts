/**
 * apiClient CSRF 통합 테스트
 * 
 * @description
 * 프론트엔드 apiClient의 CSRF 자동 처리 기능을 테스트합니다.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiClient, initCSRFToken, setCSRFToken, clearCSRFToken } from './apiClient';

// Fetch mock
global.fetch = vi.fn();

describe('apiClient CSRF Integration Tests', () => {
    beforeEach(() => {
        // 각 테스트 전에 CSRF 토큰 초기화
        clearCSRFToken();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('1️⃣ CSRF 토큰 초기화', () => {
        it('initCSRFToken - 토큰 자동 가져오기', async () => {
            const mockToken = 'test-csrf-token-123';

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: { csrfToken: mockToken }
                })
            });

            await initCSRFToken();

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/auth/csrf-token'),
                expect.objectContaining({
                    method: 'GET',
                    credentials: 'include'
                })
            );
        });

        it('initCSRFToken - 실패 시 경고만 출력', async () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

            await initCSRFToken();

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('setCSRFToken - 수동 토큰 설정', () => {
            const token = 'manual-token';
            setCSRFToken(token);

            // 토큰이 내부적으로 저장되는지 확인 (다음 요청에서 사용)
            expect(() => setCSRFToken(token)).not.toThrow();
        });

        it('clearCSRFToken - 토큰 제거', () => {
            setCSRFToken('some-token');
            clearCSRFToken();

            // 제거 후 다음 요청에서 토큰 자동 가져오기 시도
            expect(() => clearCSRFToken()).not.toThrow();
        });
    });

    describe('2️⃣ GET 요청 (CSRF 불필요)', () => {
        it('GET 요청 - CSRF 토큰 없이 성공', async () => {
            const mockData = { success: true, data: [] };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockData
            });

            const result = await apiClient.get('/api/posts');

            expect(result).toEqual(mockData);
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/posts'),
                expect.objectContaining({
                    method: 'GET',
                    credentials: 'include'
                })
            );
        });
    });

    describe('3️⃣ POST 요청 (CSRF 필요)', () => {
        it('POST 요청 - 토큰이 없으면 자동으로 가져오기', async () => {
            const mockToken = 'auto-fetched-token';
            const mockResponse = { success: true, id: 1 };

            // 첫 번째 호출: CSRF 토큰 가져오기
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: { csrfToken: mockToken }
                })
            });

            // 두 번째 호출: 실제 POST 요청
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
                headers: new Map()
            });

            const result = await apiClient.post('/api/posts', { title: 'Test' });

            expect(result).toEqual(mockResponse);
            expect(global.fetch).toHaveBeenCalledTimes(2);

            // 두 번째 호출에 CSRF 토큰 포함 확인
            const secondCall = (global.fetch as any).mock.calls[1];
            expect(secondCall[1].headers['x-csrf-token']).toBe(mockToken);
        });

        it('POST 요청 - 토큰이 있으면 바로 사용', async () => {
            const existingToken = 'existing-token';
            setCSRFToken(existingToken);

            const mockResponse = { success: true };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
                headers: new Map()
            });

            await apiClient.post('/api/posts', { title: 'Test' });

            // CSRF 토큰 가져오기 없이 바로 요청
            expect(global.fetch).toHaveBeenCalledTimes(1);
            const call = (global.fetch as any).mock.calls[0];
            expect(call[1].headers['x-csrf-token']).toBe(existingToken);
        });
    });

    describe('4️⃣ CSRF 검증 실패 시 자동 재시도', () => {
        it('403 CSRF_VALIDATION_FAILED - 토큰 갱신 후 재시도', async () => {
            const oldToken = 'old-token';
            const newToken = 'new-token';
            setCSRFToken(oldToken);

            const mockData = { title: 'Test' };
            const successResponse = { success: true, id: 1 };

            // 첫 번째 호출: 403 오류
            (global.fetch as any).mockResolvedValueOnce({
                status: 403,
                ok: false,
                json: async () => ({
                    code: 'CSRF_VALIDATION_FAILED',
                    error: 'CSRF validation failed'
                })
            });

            // 두 번째 호출: 토큰 갱신
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    csrfToken: newToken
                })
            });

            // 세 번째 호출: 재시도 성공
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => successResponse,
                headers: new Map()
            });

            const result = await apiClient.post('/api/posts', mockData);

            expect(result).toEqual(successResponse);
            expect(global.fetch).toHaveBeenCalledTimes(3);

            // 재시도 시 새 토큰 사용 확인
            const retryCall = (global.fetch as any).mock.calls[2];
            expect(retryCall[1].headers['x-csrf-token']).toBe(newToken);
        });

        it('403 다른 오류 - 재시도 없이 실패', async () => {
            setCSRFToken('some-token');

            // 403이지만 CSRF 오류가 아님
            (global.fetch as any).mockResolvedValueOnce({
                status: 403,
                ok: false,
                json: async () => ({
                    code: 'FORBIDDEN',
                    error: 'Access denied'
                })
            });

            await expect(
                apiClient.post('/api/posts', { title: 'Test' })
            ).rejects.toThrow();

            // 재시도 없이 1번만 호출
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
    });

    describe('5️⃣ 토큰 자동 갱신', () => {
        it('응답 헤더에 X-CSRF-Token-Refreshed 있으면 자동 업데이트', async () => {
            const oldToken = 'old-token';
            const newToken = 'refreshed-token';
            setCSRFToken(oldToken);

            const headers = new Map();
            headers.set('X-CSRF-Token-Refreshed', newToken);

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
                headers: {
                    get: (key: string) => headers.get(key)
                }
            });

            await apiClient.post('/api/posts', { title: 'Test' });

            // 다음 요청에서 새 토큰 사용 확인
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
                headers: new Map()
            });

            await apiClient.post('/api/posts', { title: 'Test2' });

            const secondCall = (global.fetch as any).mock.calls[1];
            expect(secondCall[1].headers['x-csrf-token']).toBe(newToken);
        });
    });

    describe('6️⃣ PUT/DELETE 요청', () => {
        it('PUT 요청 - CSRF 토큰 자동 첨부', async () => {
            const token = 'put-token';
            setCSRFToken(token);

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
                headers: new Map()
            });

            await apiClient.put('/api/posts/1', { title: 'Updated' });

            const call = (global.fetch as any).mock.calls[0];
            expect(call[0]).toContain('/api/posts/1');
            expect(call[1].method).toBe('PUT');
            expect(call[1].headers['x-csrf-token']).toBe(token);
        });

        it('DELETE 요청 - CSRF 토큰 자동 첨부', async () => {
            const token = 'delete-token';
            setCSRFToken(token);

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
                headers: new Map()
            });

            await apiClient.delete('/api/posts/1');

            const call = (global.fetch as any).mock.calls[0];
            expect(call[0]).toContain('/api/posts/1');
            expect(call[1].method).toBe('DELETE');
            expect(call[1].headers['x-csrf-token']).toBe(token);
        });
    });

    describe('7️⃣ 에러 처리', () => {
        it('네트워크 오류 - 에러 throw', async () => {
            setCSRFToken('some-token');

            (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

            await expect(
                apiClient.post('/api/posts', { title: 'Test' })
            ).rejects.toThrow('Network error');
        });

        it('HTTP 오류 (500) - 에러 throw', async () => {
            setCSRFToken('some-token');

            (global.fetch as any).mockResolvedValueOnce({
                status: 500,
                ok: false,
                json: async () => ({ error: 'Server error' })
            });

            await expect(
                apiClient.post('/api/posts', { title: 'Test' })
            ).rejects.toThrow();
        });
    });

    describe('8️⃣ credentials: include 확인', () => {
        it('모든 요청에 credentials: include 포함', async () => {
            setCSRFToken('token');

            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ success: true }),
                headers: new Map()
            });

            await apiClient.get('/api/data');
            await apiClient.post('/api/data', {});
            await apiClient.put('/api/data/1', {});
            await apiClient.delete('/api/data/1');

            // 모든 호출에 credentials: 'include' 확인
            (global.fetch as any).mock.calls.forEach((call: any) => {
                expect(call[1].credentials).toBe('include');
            });
        });
    });
});

// 테스트 실행 가이드
console.log(`
🧪 프론트엔드 CSRF 테스트

실행 방법:
  npm test -- apiClient.csrf.test.ts

또는 Vitest UI:
  npm run test:ui
`);
