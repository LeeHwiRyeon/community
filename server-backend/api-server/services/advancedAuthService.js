const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const logger = require('../utils/logger');

// Validate JWT secrets
if (!process.env.JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET not set in environment variables');
    process.exit(1);
}

class AdvancedAuthService {
    constructor() {
        this.users = new Map();
        this.sessions = new Map();
        this.roles = new Map();
        this.permissions = new Map();
        this.auditLogs = new Map();
        this.failedAttempts = new Map();
        this.lockedAccounts = new Map();
        this.twoFactorSecrets = new Map();
        this.passwordResetTokens = new Map();
        this.emailVerificationTokens = new Map();

        this.initializeDefaultRoles();
        this.initializeDefaultPermissions();
        this.initializeSecurityPolicies();
    }

    // 기본 역할 초기화
    initializeDefaultRoles() {
        const defaultRoles = [
            {
                id: 'super_admin',
                name: 'Super Administrator',
                description: '시스템 전체 관리자',
                level: 100,
                permissions: ['*'], // 모든 권한
                isSystem: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'admin',
                name: 'Administrator',
                description: '관리자',
                level: 90,
                permissions: [
                    'user.manage',
                    'content.manage',
                    'system.monitor',
                    'analytics.view',
                    'settings.manage'
                ],
                isSystem: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'moderator',
                name: 'Moderator',
                description: '중재자',
                level: 70,
                permissions: [
                    'content.moderate',
                    'user.moderate',
                    'reports.manage',
                    'analytics.view'
                ],
                isSystem: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'premium_user',
                name: 'Premium User',
                description: '프리미엄 사용자',
                level: 50,
                permissions: [
                    'content.create',
                    'content.edit_own',
                    'content.delete_own',
                    'analytics.view_own',
                    'premium.features'
                ],
                isSystem: false,
                createdAt: new Date().toISOString()
            },
            {
                id: 'user',
                name: 'User',
                description: '일반 사용자',
                level: 30,
                permissions: [
                    'content.create',
                    'content.edit_own',
                    'content.delete_own',
                    'profile.manage'
                ],
                isSystem: false,
                createdAt: new Date().toISOString()
            },
            {
                id: 'guest',
                name: 'Guest',
                description: '게스트',
                level: 10,
                permissions: [
                    'content.view',
                    'profile.view_public'
                ],
                isSystem: false,
                createdAt: new Date().toISOString()
            }
        ];

        defaultRoles.forEach(role => {
            this.roles.set(role.id, role);
        });
    }

    // 기본 권한 초기화
    initializeDefaultPermissions() {
        const defaultPermissions = [
            // 사용자 관리
            { id: 'user.create', name: '사용자 생성', category: 'user' },
            { id: 'user.read', name: '사용자 조회', category: 'user' },
            { id: 'user.update', name: '사용자 수정', category: 'user' },
            { id: 'user.delete', name: '사용자 삭제', category: 'user' },
            { id: 'user.manage', name: '사용자 관리', category: 'user' },
            { id: 'user.moderate', name: '사용자 중재', category: 'user' },

            // 콘텐츠 관리
            { id: 'content.create', name: '콘텐츠 생성', category: 'content' },
            { id: 'content.read', name: '콘텐츠 조회', category: 'content' },
            { id: 'content.update', name: '콘텐츠 수정', category: 'content' },
            { id: 'content.delete', name: '콘텐츠 삭제', category: 'content' },
            { id: 'content.edit_own', name: '자신의 콘텐츠 수정', category: 'content' },
            { id: 'content.delete_own', name: '자신의 콘텐츠 삭제', category: 'content' },
            { id: 'content.moderate', name: '콘텐츠 중재', category: 'content' },
            { id: 'content.manage', name: '콘텐츠 관리', category: 'content' },

            // 시스템 관리
            { id: 'system.monitor', name: '시스템 모니터링', category: 'system' },
            { id: 'system.configure', name: '시스템 설정', category: 'system' },
            { id: 'system.maintain', name: '시스템 유지보수', category: 'system' },

            // 분석 및 보고서
            { id: 'analytics.view', name: '분석 조회', category: 'analytics' },
            { id: 'analytics.view_own', name: '자신의 분석 조회', category: 'analytics' },
            { id: 'reports.generate', name: '보고서 생성', category: 'analytics' },
            { id: 'reports.manage', name: '보고서 관리', category: 'analytics' },

            // 설정 관리
            { id: 'settings.view', name: '설정 조회', category: 'settings' },
            { id: 'settings.manage', name: '설정 관리', category: 'settings' },

            // 프로필 관리
            { id: 'profile.manage', name: '프로필 관리', category: 'profile' },
            { id: 'profile.view_public', name: '공개 프로필 조회', category: 'profile' },

            // 프리미엄 기능
            { id: 'premium.features', name: '프리미엄 기능', category: 'premium' }
        ];

        defaultPermissions.forEach(permission => {
            this.permissions.set(permission.id, permission);
        });
    }

    // 보안 정책 초기화
    initializeSecurityPolicies() {
        this.securityPolicies = {
            password: {
                minLength: 8,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSpecialChars: true,
                maxAge: 90, // 일
                historyCount: 5
            },
            session: {
                maxAge: 24 * 60 * 60 * 1000, // 24시간
                refreshThreshold: 60 * 60 * 1000, // 1시간
                maxConcurrent: 5
            },
            login: {
                maxAttempts: 5,
                lockoutDuration: 15 * 60 * 1000, // 15분
                maxAttemptsPerHour: 10
            },
            twoFactor: {
                enabled: true,
                backupCodes: 10,
                gracePeriod: 7 * 24 * 60 * 60 * 1000 // 7일
            },
            audit: {
                logAllActions: true,
                retentionDays: 365,
                sensitiveActions: ['user.delete', 'role.assign', 'permission.grant']
            }
        };
    }

    // 사용자 등록
    async registerUser(userData) {
        try {
            const {
                email,
                password,
                username,
                firstName,
                lastName,
                role = 'user',
                twoFactorEnabled = false
            } = userData;

            // 이메일 중복 확인
            if (this.isEmailExists(email)) {
                throw new Error('이미 등록된 이메일입니다.');
            }

            // 사용자명 중복 확인
            if (this.isUsernameExists(username)) {
                throw new Error('이미 사용 중인 사용자명입니다.');
            }

            // 비밀번호 강도 검증
            this.validatePassword(password);

            // 비밀번호 해시화
            const hashedPassword = await bcrypt.hash(password, 12);
            const salt = crypto.randomBytes(32).toString('hex');

            // 사용자 생성
            const userId = this.generateUserId();
            const user = {
                id: userId,
                email: email.toLowerCase(),
                username,
                firstName,
                lastName,
                password: hashedPassword,
                salt,
                role,
                twoFactorEnabled,
                emailVerified: false,
                isActive: true,
                createdAt: new Date().toISOString(),
                lastLoginAt: null,
                passwordChangedAt: new Date().toISOString(),
                failedLoginAttempts: 0,
                lockedUntil: null
            };

            this.users.set(userId, user);

            // 이메일 인증 토큰 생성
            const emailToken = this.generateEmailVerificationToken(userId);
            this.emailVerificationTokens.set(emailToken, {
                userId,
                email,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간
            });

            // 감사 로그
            this.logAuditEvent('user.register', userId, { email, username });

            logger.info(`User registered: ${email}`);
            return {
                success: true,
                userId,
                emailToken,
                message: '사용자가 성공적으로 등록되었습니다.'
            };

        } catch (error) {
            logger.error('User registration failed:', error);
            throw error;
        }
    }

    // 사용자 로그인
    async loginUser(email, password, twoFactorCode = null, rememberMe = false) {
        try {
            const user = this.findUserByEmail(email);
            if (!user) {
                throw new Error('사용자를 찾을 수 없습니다.');
            }

            // 계정 잠금 확인
            if (this.isAccountLocked(user.id)) {
                throw new Error('계정이 잠겨있습니다. 잠시 후 다시 시도해주세요.');
            }

            // 비밀번호 확인
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                await this.handleFailedLogin(user.id);
                throw new Error('잘못된 비밀번호입니다.');
            }

            // 2FA 확인
            if (user.twoFactorEnabled) {
                if (!twoFactorCode) {
                    return {
                        success: false,
                        requiresTwoFactor: true,
                        message: '2단계 인증 코드가 필요합니다.'
                    };
                }

                const isValidTwoFactor = this.verifyTwoFactorCode(user.id, twoFactorCode);
                if (!isValidTwoFactor) {
                    await this.handleFailedLogin(user.id);
                    throw new Error('잘못된 2단계 인증 코드입니다.');
                }
            }

            // 로그인 성공 처리
            await this.handleSuccessfulLogin(user.id);

            // 세션 생성
            const session = await this.createSession(user.id, rememberMe);

            // JWT 토큰 생성
            const accessToken = this.generateAccessToken(user.id, session.id);
            const refreshToken = this.generateRefreshToken(session.id);

            // 감사 로그
            this.logAuditEvent('user.login', user.id, { email, rememberMe });

            logger.info(`User logged in: ${email}`);
            return {
                success: true,
                user: this.sanitizeUser(user),
                accessToken,
                refreshToken,
                sessionId: session.id,
                expiresAt: session.expiresAt
            };

        } catch (error) {
            logger.error('User login failed:', error);
            throw error;
        }
    }

    // 2FA 설정
    async setupTwoFactor(userId) {
        try {
            const user = this.users.get(userId);
            if (!user) {
                throw new Error('사용자를 찾을 수 없습니다.');
            }

            // TOTP 시크릿 생성
            const secret = speakeasy.generateSecret({
                name: `Community Platform (${user.email})`,
                issuer: 'Community Platform'
            });

            this.twoFactorSecrets.set(userId, secret.base32);

            // QR 코드 생성
            const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

            // 백업 코드 생성
            const backupCodes = this.generateBackupCodes();

            return {
                success: true,
                secret: secret.base32,
                qrCodeUrl,
                backupCodes,
                manualEntryKey: secret.base32
            };

        } catch (error) {
            logger.error('Two-factor setup failed:', error);
            throw error;
        }
    }

    // 2FA 활성화
    async enableTwoFactor(userId, token) {
        try {
            const user = this.users.get(userId);
            if (!user) {
                throw new Error('사용자를 찾을 수 없습니다.');
            }

            const secret = this.twoFactorSecrets.get(userId);
            if (!secret) {
                throw new Error('2FA 설정이 필요합니다.');
            }

            // 토큰 검증
            const isValid = speakeasy.totp.verify({
                secret: secret,
                encoding: 'base32',
                token: token,
                window: 2
            });

            if (!isValid) {
                throw new Error('잘못된 인증 코드입니다.');
            }

            // 2FA 활성화
            user.twoFactorEnabled = true;
            user.twoFactorSecret = secret;
            this.users.set(userId, user);

            // 임시 시크릿 제거
            this.twoFactorSecrets.delete(userId);

            // 감사 로그
            this.logAuditEvent('user.two_factor_enabled', userId);

            logger.info(`Two-factor authentication enabled for user: ${userId}`);
            return { success: true, message: '2단계 인증이 활성화되었습니다.' };

        } catch (error) {
            logger.error('Two-factor enable failed:', error);
            throw error;
        }
    }

    // 2FA 코드 검증
    verifyTwoFactorCode(userId, token) {
        const user = this.users.get(userId);
        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            return false;
        }

        return speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 2
        });
    }

    // 백업 코드 생성
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
        }
        return codes;
    }

    // 세션 생성
    async createSession(userId, rememberMe = false) {
        const sessionId = this.generateSessionId();
        const expiresAt = new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));

        const session = {
            id: sessionId,
            userId,
            createdAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
            lastActivityAt: new Date().toISOString(),
            ipAddress: null,
            userAgent: null,
            isActive: true
        };

        this.sessions.set(sessionId, session);
        return session;
    }

    // JWT 액세스 토큰 생성
    generateAccessToken(userId, sessionId) {
        const user = this.users.get(userId);
        const role = this.roles.get(user.role);

        return jwt.sign(
            {
                userId,
                sessionId,
                role: user.role,
                permissions: role.permissions,
                type: 'access'
            },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );
    }

    // JWT 리프레시 토큰 생성
    generateRefreshToken(sessionId) {
        return jwt.sign(
            { sessionId, type: 'refresh' },
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
    }

    // 토큰 검증
    verifyToken(token, type = 'access') {
        try {
            const secret = type === 'access'
                ? process.env.JWT_SECRET
                : (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

            const decoded = jwt.verify(token, secret);

            if (decoded.type !== type) {
                throw new Error('Invalid token type');
            }

            return decoded;
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    // 권한 확인
    hasPermission(userId, permission) {
        const user = this.users.get(userId);
        if (!user) return false;

        const role = this.roles.get(user.role);
        if (!role) return false;

        // 슈퍼 관리자는 모든 권한
        if (role.permissions.includes('*')) return true;

        // 특정 권한 확인
        return role.permissions.includes(permission);
    }

    // 역할 확인
    hasRole(userId, roleName) {
        const user = this.users.get(userId);
        if (!user) return false;

        return user.role === roleName;
    }

    // 역할 레벨 확인
    hasRoleLevel(userId, requiredLevel) {
        const user = this.users.get(userId);
        if (!user) return false;

        const role = this.roles.get(user.role);
        if (!role) return false;

        return role.level >= requiredLevel;
    }

    // 사용자 역할 변경
    async changeUserRole(userId, newRole, changedBy) {
        try {
            const user = this.users.get(userId);
            if (!user) {
                throw new Error('사용자를 찾을 수 없습니다.');
            }

            const role = this.roles.get(newRole);
            if (!role) {
                throw new Error('존재하지 않는 역할입니다.');
            }

            const oldRole = user.role;
            user.role = newRole;
            this.users.set(userId, user);

            // 감사 로그
            this.logAuditEvent('user.role_changed', userId, {
                oldRole,
                newRole,
                changedBy
            });

            logger.info(`User role changed: ${userId} from ${oldRole} to ${newRole}`);
            return { success: true, message: '사용자 역할이 변경되었습니다.' };

        } catch (error) {
            logger.error('Role change failed:', error);
            throw error;
        }
    }

    // 비밀번호 변경
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = this.users.get(userId);
            if (!user) {
                throw new Error('사용자를 찾을 수 없습니다.');
            }

            // 현재 비밀번호 확인
            const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidCurrentPassword) {
                throw new Error('현재 비밀번호가 올바르지 않습니다.');
            }

            // 새 비밀번호 강도 검증
            this.validatePassword(newPassword);

            // 비밀번호 히스토리 확인
            await this.checkPasswordHistory(userId, newPassword);

            // 새 비밀번호 해시화
            const hashedNewPassword = await bcrypt.hash(newPassword, 12);
            user.password = hashedNewPassword;
            user.passwordChangedAt = new Date().toISOString();
            this.users.set(userId, user);

            // 모든 세션 무효화
            await this.invalidateUserSessions(userId);

            // 감사 로그
            this.logAuditEvent('user.password_changed', userId);

            logger.info(`Password changed for user: ${userId}`);
            return { success: true, message: '비밀번호가 변경되었습니다.' };

        } catch (error) {
            logger.error('Password change failed:', error);
            throw error;
        }
    }

    // 비밀번호 재설정
    async resetPassword(email) {
        try {
            const user = this.findUserByEmail(email);
            if (!user) {
                // 보안을 위해 사용자가 존재하지 않아도 성공 응답
                return { success: true, message: '비밀번호 재설정 이메일이 전송되었습니다.' };
            }

            // 재설정 토큰 생성
            const resetToken = this.generatePasswordResetToken(user.id);
            this.passwordResetTokens.set(resetToken, {
                userId: user.id,
                email: user.email,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1시간
            });

            // 감사 로그
            this.logAuditEvent('user.password_reset_requested', user.id, { email });

            logger.info(`Password reset requested for: ${email}`);
            return {
                success: true,
                resetToken,
                message: '비밀번호 재설정 이메일이 전송되었습니다.'
            };

        } catch (error) {
            logger.error('Password reset failed:', error);
            throw error;
        }
    }

    // 비밀번호 재설정 완료
    async confirmPasswordReset(resetToken, newPassword) {
        try {
            const resetData = this.passwordResetTokens.get(resetToken);
            if (!resetData || new Date() > resetData.expiresAt) {
                throw new Error('유효하지 않거나 만료된 재설정 토큰입니다.');
            }

            const user = this.users.get(resetData.userId);
            if (!user) {
                throw new Error('사용자를 찾을 수 없습니다.');
            }

            // 새 비밀번호 강도 검증
            this.validatePassword(newPassword);

            // 비밀번호 히스토리 확인
            await this.checkPasswordHistory(user.id, newPassword);

            // 새 비밀번호 설정
            const hashedNewPassword = await bcrypt.hash(newPassword, 12);
            user.password = hashedNewPassword;
            user.passwordChangedAt = new Date().toISOString();
            this.users.set(user.id, user);

            // 재설정 토큰 삭제
            this.passwordResetTokens.delete(resetToken);

            // 모든 세션 무효화
            await this.invalidateUserSessions(user.id);

            // 감사 로그
            this.logAuditEvent('user.password_reset_completed', user.id);

            logger.info(`Password reset completed for user: ${user.id}`);
            return { success: true, message: '비밀번호가 성공적으로 재설정되었습니다.' };

        } catch (error) {
            logger.error('Password reset confirmation failed:', error);
            throw error;
        }
    }

    // 감사 로그 기록
    logAuditEvent(action, userId, details = {}) {
        const auditLog = {
            id: this.generateAuditId(),
            action,
            userId,
            details,
            timestamp: new Date().toISOString(),
            ipAddress: details.ipAddress || null,
            userAgent: details.userAgent || null
        };

        this.auditLogs.set(auditLog.id, auditLog);
    }

    // 감사 로그 조회
    getAuditLogs(filters = {}, limit = 100) {
        let logs = Array.from(this.auditLogs.values());

        // 필터 적용
        if (filters.userId) {
            logs = logs.filter(log => log.userId === filters.userId);
        }
        if (filters.action) {
            logs = logs.filter(log => log.action === filters.action);
        }
        if (filters.startDate) {
            logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
        }

        return logs
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    // 보안 통계
    getSecurityStats() {
        const totalUsers = this.users.size;
        const activeUsers = Array.from(this.users.values()).filter(u => u.isActive).length;
        const twoFactorUsers = Array.from(this.users.values()).filter(u => u.twoFactorEnabled).length;
        const lockedUsers = Array.from(this.users.values()).filter(u => u.lockedUntil && new Date(u.lockedUntil) > new Date()).length;
        const totalSessions = this.sessions.size;
        const activeSessions = Array.from(this.sessions.values()).filter(s => s.isActive).length;

        return {
            totalUsers,
            activeUsers,
            twoFactorUsers,
            lockedUsers,
            totalSessions,
            activeSessions,
            twoFactorRate: totalUsers > 0 ? (twoFactorUsers / totalUsers) * 100 : 0,
            lockoutRate: totalUsers > 0 ? (lockedUsers / totalUsers) * 100 : 0
        };
    }

    // 유틸리티 메서드들
    findUserByEmail(email) {
        return Array.from(this.users.values()).find(u => u.email === email.toLowerCase());
    }

    isEmailExists(email) {
        return this.findUserByEmail(email) !== undefined;
    }

    isUsernameExists(username) {
        return Array.from(this.users.values()).some(u => u.username === username);
    }

    isAccountLocked(userId) {
        const user = this.users.get(userId);
        return user && user.lockedUntil && new Date(user.lockedUntil) > new Date();
    }

    async handleFailedLogin(userId) {
        const user = this.users.get(userId);
        if (!user) return;

        user.failedLoginAttempts += 1;

        if (user.failedLoginAttempts >= this.securityPolicies.login.maxAttempts) {
            user.lockedUntil = new Date(Date.now() + this.securityPolicies.login.lockoutDuration);
        }

        this.users.set(userId, user);
    }

    async handleSuccessfulLogin(userId) {
        const user = this.users.get(userId);
        if (!user) return;

        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
        user.lastLoginAt = new Date().toISOString();
        this.users.set(userId, user);
    }

    async invalidateUserSessions(userId) {
        const userSessions = Array.from(this.sessions.values()).filter(s => s.userId === userId);
        userSessions.forEach(session => {
            session.isActive = false;
            this.sessions.set(session.id, session);
        });
    }

    validatePassword(password) {
        const policy = this.securityPolicies.password;

        if (password.length < policy.minLength) {
            throw new Error(`비밀번호는 최소 ${policy.minLength}자 이상이어야 합니다.`);
        }

        if (policy.requireUppercase && !/[A-Z]/.test(password)) {
            throw new Error('비밀번호에 대문자가 포함되어야 합니다.');
        }

        if (policy.requireLowercase && !/[a-z]/.test(password)) {
            throw new Error('비밀번호에 소문자가 포함되어야 합니다.');
        }

        if (policy.requireNumbers && !/\d/.test(password)) {
            throw new Error('비밀번호에 숫자가 포함되어야 합니다.');
        }

        if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            throw new Error('비밀번호에 특수문자가 포함되어야 합니다.');
        }
    }

    async checkPasswordHistory(userId, newPassword) {
        // 실제 구현에서는 비밀번호 히스토리를 데이터베이스에서 확인
        // 여기서는 간단히 구현
        return true;
    }

    sanitizeUser(user) {
        const { password, salt, twoFactorSecret, ...sanitized } = user;
        return sanitized;
    }

    generateUserId() {
        return 'user_' + crypto.randomBytes(16).toString('hex');
    }

    generateSessionId() {
        return 'session_' + crypto.randomBytes(32).toString('hex');
    }

    generateEmailVerificationToken(userId) {
        return 'email_' + crypto.randomBytes(32).toString('hex');
    }

    generatePasswordResetToken(userId) {
        return 'reset_' + crypto.randomBytes(32).toString('hex');
    }

    generateAuditId() {
        return 'audit_' + crypto.randomBytes(16).toString('hex');
    }
}

module.exports = new AdvancedAuthService();

