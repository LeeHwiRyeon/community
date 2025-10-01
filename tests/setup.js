const { logger } = require('../server-backend/utils/logger');

// 테스트 환경 설정
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_NAME = 'community_platform_test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

// 로거 설정 (테스트 중에는 로그 출력 안함)
logger.level = 'error';

// 전역 테스트 설정
beforeAll(async () => {
    // 테스트 데이터베이스 초기화
    await setupTestDatabase();
});

afterAll(async () => {
    // 테스트 데이터베이스 정리
    await cleanupTestDatabase();
});

beforeEach(() => {
    // 각 테스트 전에 실행
    jest.clearAllMocks();
});

afterEach(() => {
    // 각 테스트 후에 실행
    // 필요시 정리 작업
});

// 테스트 데이터베이스 설정
async function setupTestDatabase() {
    try {
        // 실제로는 테스트 데이터베이스 연결 및 초기화
        console.log('테스트 데이터베이스 설정 완료');
    } catch (error) {
        console.error('테스트 데이터베이스 설정 실패:', error);
    }
}

// 테스트 데이터베이스 정리
async function cleanupTestDatabase() {
    try {
        // 실제로는 테스트 데이터 정리
        console.log('테스트 데이터베이스 정리 완료');
    } catch (error) {
        console.error('테스트 데이터베이스 정리 실패:', error);
    }
}

// 테스트 헬퍼 함수들
global.testHelpers = {
    // 테스트 사용자 생성
    createTestUser: (overrides = {}) => ({
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        status: 'active',
        ...overrides
    }),

    // 테스트 게시글 생성
    createTestPost: (overrides = {}) => ({
        id: 'test-post-123',
        title: 'Test Post',
        content: 'Test Content',
        authorId: 'test-user-123',
        category: 'technology',
        tags: ['test'],
        ...overrides
    }),

    // 테스트 댓글 생성
    createTestComment: (overrides = {}) => ({
        id: 'test-comment-123',
        postId: 'test-post-123',
        authorId: 'test-user-123',
        content: 'Test Comment',
        ...overrides
    }),

    // JWT 토큰 생성
    generateTestToken: (payload = {}) => {
        const jwt = require('jsonwebtoken');
        return jwt.sign(
            { userId: 'test-user-123', email: 'test@example.com', ...payload },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
    },

    // API 요청 헬퍼
    makeRequest: async (app, method, url, data = null, token = null) => {
        const request = require('supertest');
        let req = request(app)[method](url);

        if (token) {
            req = req.set('Authorization', `Bearer ${token}`);
        }

        if (data) {
            req = req.send(data);
        }

        return req;
    }
};
