const authService = require('../../server-backend/services/authService');
const { User } = require('../../server-backend/models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 모의 객체 설정
jest.mock('../../server-backend/models/User');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            // Given
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User'
            };

            User.query.mockReturnValue({
                where: jest.fn().mockReturnThis(),
                first: jest.fn().mockResolvedValue(null) // 사용자가 존재하지 않음
            });

            bcrypt.hash.mockResolvedValue('hashed-password');

            User.query.mockReturnValue({
                insertAndFetch: jest.fn().mockResolvedValue({
                    id: 'user-123',
                    email: userData.email,
                    name: userData.name,
                    password_hash: 'hashed-password'
                })
            });

            // When
            const result = await authService.register(userData);

            // Then
            expect(result.success).toBe(true);
            expect(result.data.email).toBe(userData.email);
            expect(result.data.name).toBe(userData.name);
            expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
        });

        it('should return error if user already exists', async () => {
            // Given
            const userData = {
                email: 'existing@example.com',
                password: 'password123',
                name: 'Test User'
            };

            User.query.mockReturnValue({
                where: jest.fn().mockReturnThis(),
                first: jest.fn().mockResolvedValue({
                    id: 'existing-user',
                    email: userData.email
                })
            });

            // When
            const result = await authService.register(userData);

            // Then
            expect(result.success).toBe(false);
            expect(result.message).toBe('이미 존재하는 이메일입니다.');
        });

        it('should handle registration errors', async () => {
            // Given
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User'
            };

            User.query.mockReturnValue({
                where: jest.fn().mockReturnThis(),
                first: jest.fn().mockRejectedValue(new Error('Database error'))
            });

            // When
            const result = await authService.register(userData);

            // Then
            expect(result.success).toBe(false);
            expect(result.message).toBe('회원가입 중 오류가 발생했습니다.');
        });
    });

    describe('login', () => {
        it('should login user successfully with valid credentials', async () => {
            // Given
            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            };

            const mockUser = {
                id: 'user-123',
                email: loginData.email,
                name: 'Test User',
                password_hash: 'hashed-password',
                status: 'active'
            };

            User.query.mockReturnValue({
                where: jest.fn().mockReturnThis(),
                first: jest.fn().mockResolvedValue(mockUser)
            });

            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('mock-jwt-token');

            // When
            const result = await authService.login(loginData);

            // Then
            expect(result.success).toBe(true);
            expect(result.data.token).toBe('mock-jwt-token');
            expect(result.data.user.email).toBe(loginData.email);
            expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password_hash);
        });

        it('should return error for invalid email', async () => {
            // Given
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'password123'
            };

            User.query.mockReturnValue({
                where: jest.fn().mockReturnThis(),
                first: jest.fn().mockResolvedValue(null)
            });

            // When
            const result = await authService.login(loginData);

            // Then
            expect(result.success).toBe(false);
            expect(result.message).toBe('이메일 또는 비밀번호가 올바르지 않습니다.');
        });

        it('should return error for invalid password', async () => {
            // Given
            const loginData = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            const mockUser = {
                id: 'user-123',
                email: loginData.email,
                password_hash: 'hashed-password',
                status: 'active'
            };

            User.query.mockReturnValue({
                where: jest.fn().mockReturnThis(),
                first: jest.fn().mockResolvedValue(mockUser)
            });

            bcrypt.compare.mockResolvedValue(false);

            // When
            const result = await authService.login(loginData);

            // Then
            expect(result.success).toBe(false);
            expect(result.message).toBe('이메일 또는 비밀번호가 올바르지 않습니다.');
        });

        it('should return error for inactive user', async () => {
            // Given
            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            };

            const mockUser = {
                id: 'user-123',
                email: loginData.email,
                password_hash: 'hashed-password',
                status: 'inactive'
            };

            User.query.mockReturnValue({
                where: jest.fn().mockReturnThis(),
                first: jest.fn().mockResolvedValue(mockUser)
            });

            // When
            const result = await authService.login(loginData);

            // Then
            expect(result.success).toBe(false);
            expect(result.message).toBe('비활성화된 계정입니다.');
        });
    });

    describe('verifyToken', () => {
        it('should verify valid token successfully', () => {
            // Given
            const token = 'valid-token';
            const decoded = { userId: 'user-123', email: 'test@example.com' };

            jwt.verify.mockReturnValue(decoded);

            // When
            const result = authService.verifyToken(token);

            // Then
            expect(result.success).toBe(true);
            expect(result.data).toEqual(decoded);
            expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
        });

        it('should return error for invalid token', () => {
            // Given
            const token = 'invalid-token';

            jwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            // When
            const result = authService.verifyToken(token);

            // Then
            expect(result.success).toBe(false);
            expect(result.message).toBe('유효하지 않은 토큰입니다.');
        });

        it('should return error for expired token', () => {
            // Given
            const token = 'expired-token';

            jwt.verify.mockImplementation(() => {
                const error = new Error('Token expired');
                error.name = 'TokenExpiredError';
                throw error;
            });

            // When
            const result = authService.verifyToken(token);

            // Then
            expect(result.success).toBe(false);
            expect(result.message).toBe('만료된 토큰입니다.');
        });
    });

    describe('changePassword', () => {
        it('should change password successfully', async () => {
            // Given
            const userId = 'user-123';
            const currentPassword = 'oldpassword';
            const newPassword = 'newpassword';

            const mockUser = {
                id: userId,
                password_hash: 'old-hashed-password'
            };

            User.query.mockReturnValue({
                findById: jest.fn().mockResolvedValue(mockUser)
            });

            bcrypt.compare.mockResolvedValue(true);
            bcrypt.hash.mockResolvedValue('new-hashed-password');

            User.query.mockReturnValue({
                findById: jest.fn().mockReturnThis(),
                patch: jest.fn().mockResolvedValue({ id: userId })
            });

            // When
            const result = await authService.changePassword(userId, currentPassword, newPassword);

            // Then
            expect(result.success).toBe(true);
            expect(result.message).toBe('비밀번호가 성공적으로 변경되었습니다.');
            expect(bcrypt.compare).toHaveBeenCalledWith(currentPassword, mockUser.password_hash);
            expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
        });

        it('should return error for incorrect current password', async () => {
            // Given
            const userId = 'user-123';
            const currentPassword = 'wrongpassword';
            const newPassword = 'newpassword';

            const mockUser = {
                id: userId,
                password_hash: 'old-hashed-password'
            };

            User.query.mockReturnValue({
                findById: jest.fn().mockResolvedValue(mockUser)
            });

            bcrypt.compare.mockResolvedValue(false);

            // When
            const result = await authService.changePassword(userId, currentPassword, newPassword);

            // Then
            expect(result.success).toBe(false);
            expect(result.message).toBe('현재 비밀번호가 올바르지 않습니다.');
        });

        it('should return error if user not found', async () => {
            // Given
            const userId = 'nonexistent-user';
            const currentPassword = 'oldpassword';
            const newPassword = 'newpassword';

            User.query.mockReturnValue({
                findById: jest.fn().mockResolvedValue(null)
            });

            // When
            const result = await authService.changePassword(userId, currentPassword, newPassword);

            // Then
            expect(result.success).toBe(false);
            expect(result.message).toBe('사용자를 찾을 수 없습니다.');
        });
    });

    describe('resetPassword', () => {
        it('should reset password successfully', async () => {
            // Given
            const email = 'test@example.com';
            const newPassword = 'newpassword';

            const mockUser = {
                id: 'user-123',
                email: email
            };

            User.query.mockReturnValue({
                where: jest.fn().mockReturnThis(),
                first: jest.fn().mockResolvedValue(mockUser)
            });

            bcrypt.hash.mockResolvedValue('new-hashed-password');

            User.query.mockReturnValue({
                where: jest.fn().mockReturnThis(),
                patch: jest.fn().mockResolvedValue({ id: 'user-123' })
            });

            // When
            const result = await authService.resetPassword(email, newPassword);

            // Then
            expect(result.success).toBe(true);
            expect(result.message).toBe('비밀번호가 성공적으로 재설정되었습니다.');
        });

        it('should return error if user not found', async () => {
            // Given
            const email = 'nonexistent@example.com';
            const newPassword = 'newpassword';

            User.query.mockReturnValue({
                where: jest.fn().mockReturnThis(),
                first: jest.fn().mockResolvedValue(null)
            });

            // When
            const result = await authService.resetPassword(email, newPassword);

            // Then
            expect(result.success).toBe(false);
            expect(result.message).toBe('사용자를 찾을 수 없습니다.');
        });
    });
});
