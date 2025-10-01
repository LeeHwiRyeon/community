const UserService = require('../../server-backend/api-server/services/userService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('UserService', () => {
    let userService;
    let mockConnection;
    let mockQuery;

    beforeEach(() => {
        mockQuery = jest.fn();
        mockConnection = {
            execute: mockQuery,
        };
        userService = new UserService(mockConnection);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createUser', () => {
        it('should create a new user with hashed password', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            };

            const hashedPassword = 'hashed_password_123';
            bcrypt.hash.mockResolvedValue(hashedPassword);
            mockQuery.mockResolvedValue([{ insertId: '123' }]);

            const result = await userService.createUser(userData);

            expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO users'),
                expect.arrayContaining([
                    userData.username,
                    userData.email,
                    hashedPassword,
                ])
            );
            expect(result).toEqual({
                id: '123',
                username: userData.username,
                email: userData.email,
                role: 'user',
                status: 'active',
            });
        });

        it('should handle duplicate email error', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            };

            bcrypt.hash.mockResolvedValue('hashed_password');
            mockQuery.mockRejectedValue(new Error('Duplicate entry for email'));

            await expect(userService.createUser(userData))
                .rejects
                .toThrow('Duplicate entry for email');
        });

        it('should handle duplicate username error', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            };

            bcrypt.hash.mockResolvedValue('hashed_password');
            mockQuery.mockRejectedValue(new Error('Duplicate entry for username'));

            await expect(userService.createUser(userData))
                .rejects
                .toThrow('Duplicate entry for username');
        });
    });

    describe('authenticateUser', () => {
        it('should authenticate user with valid credentials', async () => {
            const email = 'test@example.com';
            const password = 'password123';
            const hashedPassword = 'hashed_password_123';
            const user = {
                id: '123',
                username: 'testuser',
                email: email,
                password_hash: hashedPassword,
                role: 'user',
                status: 'active',
            };

            mockQuery.mockResolvedValue([[user]]);
            bcrypt.compare.mockResolvedValue(true);

            const result = await userService.authenticateUser(email, password);

            expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
            expect(result).toEqual({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status,
            });
        });

        it('should return null for invalid password', async () => {
            const email = 'test@example.com';
            const password = 'wrongpassword';
            const hashedPassword = 'hashed_password_123';
            const user = {
                id: '123',
                username: 'testuser',
                email: email,
                password_hash: hashedPassword,
                role: 'user',
                status: 'active',
            };

            mockQuery.mockResolvedValue([[user]]);
            bcrypt.compare.mockResolvedValue(false);

            const result = await userService.authenticateUser(email, password);

            expect(result).toBeNull();
        });

        it('should return null for non-existent user', async () => {
            const email = 'nonexistent@example.com';
            const password = 'password123';

            mockQuery.mockResolvedValue([[]]);

            const result = await userService.authenticateUser(email, password);

            expect(result).toBeNull();
        });

        it('should return null for inactive user', async () => {
            const email = 'test@example.com';
            const password = 'password123';
            const user = {
                id: '123',
                username: 'testuser',
                email: email,
                password_hash: 'hashed_password_123',
                role: 'user',
                status: 'inactive',
            };

            mockQuery.mockResolvedValue([[user]]);

            const result = await userService.authenticateUser(email, password);

            expect(result).toBeNull();
        });
    });

    describe('getUserById', () => {
        it('should return user by id', async () => {
            const userId = '123';
            const user = {
                id: userId,
                username: 'testuser',
                email: 'test@example.com',
                role: 'user',
                status: 'active',
            };

            mockQuery.mockResolvedValue([[user]]);

            const result = await userService.getUserById(userId);

            expect(result).toEqual(user);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('SELECT'),
                [userId]
            );
        });

        it('should return null for non-existent user', async () => {
            const userId = '999';

            mockQuery.mockResolvedValue([[]]);

            const result = await userService.getUserById(userId);

            expect(result).toBeNull();
        });
    });

    describe('getUserByEmail', () => {
        it('should return user by email', async () => {
            const email = 'test@example.com';
            const user = {
                id: '123',
                username: 'testuser',
                email: email,
                role: 'user',
                status: 'active',
            };

            mockQuery.mockResolvedValue([[user]]);

            const result = await userService.getUserByEmail(email);

            expect(result).toEqual(user);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('SELECT'),
                [email]
            );
        });
    });

    describe('updateUser', () => {
        it('should update user information', async () => {
            const userId = '123';
            const updateData = {
                username: 'updateduser',
                email: 'updated@example.com',
                bio: 'Updated bio',
            };

            mockQuery.mockResolvedValue([{ affectedRows: 1 }]);

            const result = await userService.updateUser(userId, updateData);

            expect(result).toBe(true);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE users'),
                expect.arrayContaining([
                    updateData.username,
                    updateData.email,
                    updateData.bio,
                    userId,
                ])
            );
        });

        it('should return false for non-existent user', async () => {
            const userId = '999';
            const updateData = { username: 'updateduser' };

            mockQuery.mockResolvedValue([{ affectedRows: 0 }]);

            const result = await userService.updateUser(userId, updateData);

            expect(result).toBe(false);
        });
    });

    describe('changePassword', () => {
        it('should change user password', async () => {
            const userId = '123';
            const newPassword = 'newpassword123';
            const hashedPassword = 'new_hashed_password';

            bcrypt.hash.mockResolvedValue(hashedPassword);
            mockQuery.mockResolvedValue([{ affectedRows: 1 }]);

            const result = await userService.changePassword(userId, newPassword);

            expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
            expect(result).toBe(true);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE users'),
                expect.arrayContaining([hashedPassword, userId])
            );
        });

        it('should return false for non-existent user', async () => {
            const userId = '999';
            const newPassword = 'newpassword123';

            bcrypt.hash.mockResolvedValue('hashed_password');
            mockQuery.mockResolvedValue([{ affectedRows: 0 }]);

            const result = await userService.changePassword(userId, newPassword);

            expect(result).toBe(false);
        });
    });

    describe('deleteUser', () => {
        it('should soft delete user', async () => {
            const userId = '123';

            mockQuery.mockResolvedValue([{ affectedRows: 1 }]);

            const result = await userService.deleteUser(userId);

            expect(result).toBe(true);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE users'),
                expect.arrayContaining([userId])
            );
        });

        it('should return false for non-existent user', async () => {
            const userId = '999';

            mockQuery.mockResolvedValue([{ affectedRows: 0 }]);

            const result = await userService.deleteUser(userId);

            expect(result).toBe(false);
        });
    });

    describe('getUsers', () => {
        it('should return users with pagination', async () => {
            const mockUsers = [
                { id: '1', username: 'user1', email: 'user1@example.com' },
                { id: '2', username: 'user2', email: 'user2@example.com' },
            ];

            mockQuery.mockResolvedValue([mockUsers]);

            const result = await userService.getUsers({ page: 1, limit: 10 });

            expect(result).toEqual(mockUsers);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('SELECT'),
                expect.any(Array)
            );
        });

        it('should apply filters', async () => {
            const mockUsers = [];
            mockQuery.mockResolvedValue([mockUsers]);

            await userService.getUsers({
                page: 1,
                limit: 10,
                role: 'admin',
                status: 'active',
            });

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('WHERE'),
                expect.arrayContaining(['admin', 'active'])
            );
        });
    });

    describe('updateUserRole', () => {
        it('should update user role', async () => {
            const userId = '123';
            const newRole = 'moderator';

            mockQuery.mockResolvedValue([{ affectedRows: 1 }]);

            const result = await userService.updateUserRole(userId, newRole);

            expect(result).toBe(true);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE users'),
                expect.arrayContaining([newRole, userId])
            );
        });

        it('should return false for non-existent user', async () => {
            const userId = '999';
            const newRole = 'moderator';

            mockQuery.mockResolvedValue([{ affectedRows: 0 }]);

            const result = await userService.updateUserRole(userId, newRole);

            expect(result).toBe(false);
        });
    });

    describe('updateUserStatus', () => {
        it('should update user status', async () => {
            const userId = '123';
            const newStatus = 'suspended';

            mockQuery.mockResolvedValue([{ affectedRows: 1 }]);

            const result = await userService.updateUserStatus(userId, newStatus);

            expect(result).toBe(true);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE users'),
                expect.arrayContaining([newStatus, userId])
            );
        });

        it('should return false for non-existent user', async () => {
            const userId = '999';
            const newStatus = 'suspended';

            mockQuery.mockResolvedValue([{ affectedRows: 0 }]);

            const result = await userService.updateUserStatus(userId, newStatus);

            expect(result).toBe(false);
        });
    });

    describe('generateToken', () => {
        it('should generate JWT token', () => {
            const user = {
                id: '123',
                username: 'testuser',
                email: 'test@example.com',
                role: 'user',
            };

            const token = 'generated_jwt_token';
            jwt.sign.mockReturnValue(token);

            const result = userService.generateToken(user);

            expect(jwt.sign).toHaveBeenCalledWith(
                {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            expect(result).toBe(token);
        });
    });

    describe('verifyToken', () => {
        it('should verify JWT token', () => {
            const token = 'valid_jwt_token';
            const decoded = {
                id: '123',
                username: 'testuser',
                email: 'test@example.com',
                role: 'user',
            };

            jwt.verify.mockReturnValue(decoded);

            const result = userService.verifyToken(token);

            expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
            expect(result).toEqual(decoded);
        });

        it('should return null for invalid token', () => {
            const token = 'invalid_jwt_token';

            jwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            const result = userService.verifyToken(token);

            expect(result).toBeNull();
        });
    });
});
