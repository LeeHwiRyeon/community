const request = require('supertest');
const app = require('../../server-backend/api-server/server');
const mysql = require('mysql2/promise');

// Mock database connection
jest.mock('mysql2/promise');

describe('Authentication Integration Tests', () => {
    let mockConnection;
    let mockQuery;

    beforeAll(async () => {
        mockQuery = jest.fn();
        mockConnection = {
            execute: mockQuery,
        };

        // Mock the database connection
        mysql.createConnection.mockResolvedValue(mockConnection);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            };

            // Mock successful user creation
            mockQuery.mockResolvedValueOnce([{ insertId: '123' }]);

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.username).toBe(userData.username);
            expect(response.body.data.email).toBe(userData.email);
            expect(response.body.data).not.toHaveProperty('password');
        });

        it('should return 400 for invalid input data', async () => {
            const invalidData = {
                username: 'a', // Too short
                email: 'invalid-email',
                password: '123', // Too short
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });

        it('should return 409 for duplicate email', async () => {
            const userData = {
                username: 'testuser',
                email: 'existing@example.com',
                password: 'password123',
            };

            // Mock duplicate email error
            mockQuery.mockRejectedValueOnce(new Error('Duplicate entry for email'));

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('이미 사용 중인 이메일');
        });

        it('should return 409 for duplicate username', async () => {
            const userData = {
                username: 'existinguser',
                email: 'test@example.com',
                password: 'password123',
            };

            // Mock duplicate username error
            mockQuery.mockRejectedValueOnce(new Error('Duplicate entry for username'));

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('이미 사용 중인 사용자명');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123',
            };

            const mockUser = {
                id: '123',
                username: 'testuser',
                email: 'test@example.com',
                password_hash: 'hashed_password',
                role: 'user',
                status: 'active',
            };

            // Mock user lookup
            mockQuery.mockResolvedValueOnce([[mockUser]]);
            // Mock password comparison (this would be mocked in the service layer)
            // Mock token generation
            mockQuery.mockResolvedValueOnce([{ insertId: '456' }]); // For session creation

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data.user).toHaveProperty('id');
            expect(response.body.data.user).not.toHaveProperty('password_hash');
        });

        it('should return 401 for invalid credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'wrongpassword',
            };

            const mockUser = {
                id: '123',
                username: 'testuser',
                email: 'test@example.com',
                password_hash: 'hashed_password',
                role: 'user',
                status: 'active',
            };

            // Mock user lookup
            mockQuery.mockResolvedValueOnce([[mockUser]]);
            // Mock password comparison failure

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('잘못된 이메일 또는 비밀번호');
        });

        it('should return 401 for non-existent user', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'password123',
            };

            // Mock no user found
            mockQuery.mockResolvedValueOnce([[]]);

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('잘못된 이메일 또는 비밀번호');
        });

        it('should return 401 for inactive user', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123',
            };

            const mockUser = {
                id: '123',
                username: 'testuser',
                email: 'test@example.com',
                password_hash: 'hashed_password',
                role: 'user',
                status: 'inactive',
            };

            // Mock inactive user
            mockQuery.mockResolvedValueOnce([[mockUser]]);

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('비활성화된 계정');
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout successfully with valid token', async () => {
            const token = 'valid_jwt_token';

            // Mock token verification
            // Mock session deletion
            mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('로그아웃');
        });

        it('should return 401 for invalid token', async () => {
            const token = 'invalid_jwt_token';

            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${token}`)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('유효하지 않은 토큰');
        });

        it('should return 401 for missing token', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('액세스 토큰이 필요');
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return current user info with valid token', async () => {
            const token = 'valid_jwt_token';
            const mockUser = {
                id: '123',
                username: 'testuser',
                email: 'test@example.com',
                role: 'user',
                status: 'active',
            };

            // Mock token verification
            // Mock user lookup
            mockQuery.mockResolvedValueOnce([[mockUser]]);

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockUser);
        });

        it('should return 401 for invalid token', async () => {
            const token = 'invalid_jwt_token';

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('유효하지 않은 토큰');
        });
    });

    describe('POST /api/auth/refresh', () => {
        it('should refresh token successfully', async () => {
            const refreshToken = 'valid_refresh_token';
            const mockUser = {
                id: '123',
                username: 'testuser',
                email: 'test@example.com',
                role: 'user',
                status: 'active',
            };

            // Mock refresh token verification
            // Mock user lookup
            mockQuery.mockResolvedValueOnce([[mockUser]]);
            // Mock new token generation
            mockQuery.mockResolvedValueOnce([{ insertId: '789' }]); // For new session

            const response = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data).toHaveProperty('refreshToken');
        });

        it('should return 401 for invalid refresh token', async () => {
            const refreshToken = 'invalid_refresh_token';

            const response = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('유효하지 않은 리프레시 토큰');
        });
    });

    describe('POST /api/auth/forgot-password', () => {
        it('should send password reset email for valid email', async () => {
            const email = 'test@example.com';
            const mockUser = {
                id: '123',
                username: 'testuser',
                email: email,
            };

            // Mock user lookup
            mockQuery.mockResolvedValueOnce([[mockUser]]);
            // Mock reset token creation
            mockQuery.mockResolvedValueOnce([{ insertId: '101' }]);

            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('비밀번호 재설정');
        });

        it('should return 404 for non-existent email', async () => {
            const email = 'nonexistent@example.com';

            // Mock no user found
            mockQuery.mockResolvedValueOnce([[]]);

            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email })
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('사용자를 찾을 수 없습니다');
        });
    });

    describe('POST /api/auth/reset-password', () => {
        it('should reset password with valid token', async () => {
            const resetData = {
                token: 'valid_reset_token',
                newPassword: 'newpassword123',
            };

            const mockUser = {
                id: '123',
                username: 'testuser',
                email: 'test@example.com',
            };

            // Mock token verification
            // Mock user lookup
            mockQuery.mockResolvedValueOnce([[mockUser]]);
            // Mock password update
            mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
            // Mock token invalidation
            mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

            const response = await request(app)
                .post('/api/auth/reset-password')
                .send(resetData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('비밀번호가 재설정');
        });

        it('should return 400 for invalid token', async () => {
            const resetData = {
                token: 'invalid_reset_token',
                newPassword: 'newpassword123',
            };

            const response = await request(app)
                .post('/api/auth/reset-password')
                .send(resetData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('유효하지 않은 토큰');
        });

        it('should return 400 for weak password', async () => {
            const resetData = {
                token: 'valid_reset_token',
                newPassword: '123', // Too weak
            };

            const response = await request(app)
                .post('/api/auth/reset-password')
                .send(resetData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('비밀번호는 최소 8자');
        });
    });
});
