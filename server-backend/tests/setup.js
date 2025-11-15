/**
 * Jest Test Setup
 * 테스트 환경 설정
 */

// 환경 변수 설정
process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.DB_USER = process.env.TEST_DB_USER || 'root';
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || '';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'community_test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing';

// 타임아웃 설정
jest.setTimeout(10000);

// 콘솔 경고 무시 (선택적)
global.console = {
    ...console,
    warn: jest.fn(), // 경고 무시
    error: jest.fn(), // 에러 로그 무시 (필요시 주석 해제)
};

// 테스트 전역 변수
global.testConfig = {
    apiUrl: 'http://localhost:3001',
    testTimeout: 5000
};

// Cleanup 함수
global.cleanupDatabase = async (pool) => {
    try {
        await pool.query('DELETE FROM blocked_users');
        await pool.query('DELETE FROM post_shares');
        await pool.query('DELETE FROM mentions');
        await pool.query('DELETE FROM follows');
        await pool.query('DELETE FROM comments');
        await pool.query('DELETE FROM posts');
        await pool.query('DELETE FROM users WHERE email LIKE "%test%"');
    } catch (error) {
        console.error('Database cleanup failed:', error);
    }
};
