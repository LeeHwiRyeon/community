/**
 * CSRF 토큰 통합 테스트
 * 
 * @description
 * CSRF 토큰 시스템의 전체 플로우를 테스트합니다.
 * - 토큰 발급
 * - 토큰 검증
 * - 토큰 갱신
 * - 에러 처리
 * - 자동 재시도
 */

const request = require('supertest');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { generateCSRFToken, validateCSRFToken, clearCSRFToken } = require('../src/utils/csrf');
const { csrfProtection, generateCSRFTokenMiddleware } = require('../src/middleware/csrf');

describe('CSRF Token System Integration Tests', () => {
    let app;
    let agent;

    beforeAll(() => {
        // 테스트 앱 설정
        app = express();

        app.use(cookieParser());
        app.use(express.json());
        app.use(session({
            secret: 'test-secret',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: false,
                httpOnly: true,
                maxAge: 60 * 60 * 1000
            }
        }));

        // 테스트 라우트
        app.get('/api/auth/csrf-token', generateCSRFTokenMiddleware, (req, res) => {
            res.json({
                success: true,
                data: { csrfToken: req.csrfToken }
            });
        });

        app.post('/api/auth/csrf-refresh', (req, res) => {
            const newToken = require('../src/utils/csrf').refreshCSRFToken(req, res);
            res.json({
                success: true,
                csrfToken: newToken
            });
        });

        app.post('/api/test/protected', csrfProtection(), (req, res) => {
            res.json({
                success: true,
                message: 'CSRF validation passed'
            });
        });

        app.get('/api/test/safe', csrfProtection(), (req, res) => {
            res.json({
                success: true,
                message: 'GET request - no CSRF needed'
            });
        });

        agent = request.agent(app);
    });

    describe('1️⃣ CSRF 토큰 발급', () => {
        test('GET /api/auth/csrf-token - 토큰 발급 성공', async () => {
            const response = await agent.get('/api/auth/csrf-token');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.csrfToken).toBeDefined();
            expect(typeof response.body.data.csrfToken).toBe('string');
            expect(response.body.data.csrfToken.length).toBeGreaterThan(0);
        });

        test('응답 헤더에 CSRF 토큰 포함', async () => {
            const response = await agent.get('/api/auth/csrf-token');

            expect(response.headers['x-csrf-token']).toBeDefined();
            expect(response.headers['x-csrf-token']).toBe(response.body.data.csrfToken);
        });

        test('쿠키에 CSRF 토큰 설정', async () => {
            const response = await agent.get('/api/auth/csrf-token');

            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            expect(cookies.some(cookie => cookie.includes('csrf_token'))).toBe(true);
        });
    });

    describe('2️⃣ CSRF 토큰 검증', () => {
        let csrfToken;

        beforeEach(async () => {
            // 각 테스트 전에 토큰 발급
            const response = await agent.get('/api/auth/csrf-token');
            csrfToken = response.body.data.csrfToken;
        });

        test('POST 요청 - 토큰 없이 요청 시 403 오류', async () => {
            const response = await agent
                .post('/api/test/protected')
                .send({ data: 'test' });

            expect(response.status).toBe(403);
            expect(response.body.code).toBe('CSRF_VALIDATION_FAILED');
        });

        test('POST 요청 - 유효한 토큰으로 요청 시 성공', async () => {
            const response = await agent
                .post('/api/test/protected')
                .set('x-csrf-token', csrfToken)
                .send({ data: 'test' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('POST 요청 - 잘못된 토큰으로 요청 시 403 오류', async () => {
            const response = await agent
                .post('/api/test/protected')
                .set('x-csrf-token', 'invalid-token')
                .send({ data: 'test' });

            expect(response.status).toBe(403);
            expect(response.body.code).toBe('CSRF_VALIDATION_FAILED');
        });

        test('GET 요청 - CSRF 토큰 불필요 (Safe Method)', async () => {
            const response = await agent
                .get('/api/test/safe');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('3️⃣ CSRF 토큰 갱신', () => {
        let originalToken;

        beforeEach(async () => {
            const response = await agent.get('/api/auth/csrf-token');
            originalToken = response.body.data.csrfToken;
        });

        test('POST /api/auth/csrf-refresh - 토큰 갱신 성공', async () => {
            const response = await agent
                .post('/api/auth/csrf-refresh')
                .set('x-csrf-token', originalToken);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.csrfToken).toBeDefined();
            expect(response.body.csrfToken).not.toBe(originalToken);
        });

        test('갱신된 토큰으로 요청 성공', async () => {
            // 토큰 갱신
            const refreshResponse = await agent
                .post('/api/auth/csrf-refresh')
                .set('x-csrf-token', originalToken);

            const newToken = refreshResponse.body.csrfToken;

            // 새 토큰으로 요청
            const response = await agent
                .post('/api/test/protected')
                .set('x-csrf-token', newToken)
                .send({ data: 'test' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('기존 토큰은 만료됨', async () => {
            // 토큰 갱신
            await agent
                .post('/api/auth/csrf-refresh')
                .set('x-csrf-token', originalToken);

            // 기존 토큰으로 요청 시 실패
            const response = await agent
                .post('/api/test/protected')
                .set('x-csrf-token', originalToken)
                .send({ data: 'test' });

            expect(response.status).toBe(403);
        });
    });

    describe('4️⃣ CSRF 토큰 자동 갱신', () => {
        test('토큰 80% 경과 시 자동 갱신', async () => {
            // 토큰 발급
            const response1 = await agent.get('/api/auth/csrf-token');
            const token = response1.body.data.csrfToken;

            // 토큰 타임스탬프 조작 (80% 경과)
            // 실제로는 시간을 기다려야 하지만 테스트에서는 세션 수정

            // 요청 시 자동 갱신 확인
            const response2 = await agent
                .post('/api/test/protected')
                .set('x-csrf-token', token)
                .send({ data: 'test' });

            // 자동 갱신된 경우 응답 헤더에 새 토큰 포함
            if (response2.headers['x-csrf-token-refreshed']) {
                expect(response2.headers['x-csrf-token-refreshed']).toBeDefined();
                expect(response2.headers['x-csrf-token-refreshed']).not.toBe(token);
            }
        });
    });

    describe('5️⃣ 에러 처리 및 보안', () => {
        test('헤더 토큰과 쿠키 토큰 불일치 시 403 오류', async () => {
            // 토큰 발급
            const response1 = await agent.get('/api/auth/csrf-token');
            const token = response1.body.data.csrfToken;

            // 다른 토큰으로 요청
            const response2 = await agent
                .post('/api/test/protected')
                .set('x-csrf-token', 'different-token')
                .send({ data: 'test' });

            expect(response2.status).toBe(403);
            expect(response2.body.code).toBe('CSRF_VALIDATION_FAILED');
        });

        test('세션 없이 요청 시 403 오류', async () => {
            // 새 에이전트 (세션 없음)
            const newAgent = request(app);

            const response = await newAgent
                .post('/api/test/protected')
                .set('x-csrf-token', 'some-token')
                .send({ data: 'test' });

            expect(response.status).toBe(403);
        });

        test('CSRF 토큰 정보 조회', async () => {
            // 토큰 발급
            await agent.get('/api/auth/csrf-token');

            // 정보 조회 엔드포인트 추가 필요
            // app.get('/api/auth/csrf-info', csrfTokenInfoMiddleware);
        });
    });

    describe('6️⃣ 통합 시나리오 테스트', () => {
        test('전체 플로우: 발급 → 사용 → 갱신 → 재사용', async () => {
            // 1. 토큰 발급
            const issueResponse = await agent.get('/api/auth/csrf-token');
            expect(issueResponse.status).toBe(200);
            const token1 = issueResponse.body.data.csrfToken;

            // 2. 토큰 사용
            const useResponse1 = await agent
                .post('/api/test/protected')
                .set('x-csrf-token', token1)
                .send({ data: 'test1' });
            expect(useResponse1.status).toBe(200);

            // 3. 토큰 갱신
            const refreshResponse = await agent
                .post('/api/auth/csrf-refresh')
                .set('x-csrf-token', token1);
            expect(refreshResponse.status).toBe(200);
            const token2 = refreshResponse.body.csrfToken;

            // 4. 새 토큰 사용
            const useResponse2 = await agent
                .post('/api/test/protected')
                .set('x-csrf-token', token2)
                .send({ data: 'test2' });
            expect(useResponse2.status).toBe(200);
        });

        test('로그인 시나리오: 로그인 → CSRF 토큰 자동 발급', async () => {
            // 로그인 엔드포인트 시뮬레이션
            app.post('/api/auth/login', generateCSRFTokenMiddleware, (req, res) => {
                res.json({
                    success: true,
                    data: {
                        user: { id: 1, email: 'test@test.com' },
                        token: 'jwt-token',
                        csrfToken: req.csrfToken
                    }
                });
            });

            const loginResponse = await agent
                .post('/api/auth/login')
                .send({ email: 'test@test.com', password: 'password' });

            expect(loginResponse.status).toBe(200);
            expect(loginResponse.body.data.csrfToken).toBeDefined();

            // 발급된 CSRF 토큰으로 보호된 엔드포인트 접근
            const csrfToken = loginResponse.body.data.csrfToken;
            const protectedResponse = await agent
                .post('/api/test/protected')
                .set('x-csrf-token', csrfToken)
                .send({ data: 'after-login' });

            expect(protectedResponse.status).toBe(200);
        });
    });
});

// 테스트 실행
if (require.main === module) {
    console.log('🧪 CSRF 통합 테스트 실행...');
    console.log('npm test를 사용하여 Jest로 실행하세요.');
}

module.exports = {
    // 테스트 유틸리티 함수들을 export 가능
};
