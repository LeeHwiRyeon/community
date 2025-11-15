const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const advancedAuthService = require('../services/advancedAuthService');

// 사용자 등록
router.post('/register', async (req, res) => {
    try {
        const {
            email,
            password,
            username,
            firstName,
            lastName,
            role = 'user',
            twoFactorEnabled = false
        } = req.body;

        if (!email || !password || !username || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: '모든 필수 필드를 입력해주세요.'
            });
        }

        const result = await advancedAuthService.registerUser({
            email,
            password,
            username,
            firstName,
            lastName,
            role,
            twoFactorEnabled
        });

        res.status(201).json(result);
    } catch (error) {
        logger.error('User registration error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 사용자 로그인
router.post('/login', async (req, res) => {
    try {
        const { email, password, twoFactorCode, rememberMe = false } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: '이메일과 비밀번호를 입력해주세요.'
            });
        }

        const result = await advancedAuthService.loginUser(email, password, twoFactorCode, rememberMe);

        if (result.requiresTwoFactor) {
            return res.status(200).json(result);
        }

        res.json(result);
    } catch (error) {
        logger.error('User login error:', error);
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
});

// 로그아웃
router.post('/logout', (req, res) => {
    try {
        const { sessionId } = req.body;

        if (sessionId) {
            // 세션 무효화 로직
            advancedAuthService.logAuditEvent('user.logout', req.user?.userId, { sessionId });
        }

        res.json({
            success: true,
            message: '로그아웃되었습니다.'
        });
    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: '로그아웃 중 오류가 발생했습니다.'
        });
    }
});

// 토큰 갱신
router.post('/refresh', (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: '리프레시 토큰이 필요합니다.'
            });
        }

        const decoded = advancedAuthService.verifyToken(refreshToken, 'refresh');
        const session = advancedAuthService.sessions.get(decoded.sessionId);

        if (!session || !session.isActive) {
            return res.status(401).json({
                success: false,
                message: '유효하지 않은 세션입니다.'
            });
        }

        // 새 액세스 토큰 생성
        const newAccessToken = advancedAuthService.generateAccessToken(session.userId, session.id);

        res.json({
            success: true,
            accessToken: newAccessToken
        });
    } catch (error) {
        logger.error('Token refresh error:', error);
        res.status(401).json({
            success: false,
            message: '토큰 갱신에 실패했습니다.'
        });
    }
});

// 2FA 설정
router.post('/two-factor/setup', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '사용자 ID가 필요합니다.'
            });
        }

        const result = await advancedAuthService.setupTwoFactor(userId);

        res.json(result);
    } catch (error) {
        logger.error('Two-factor setup error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 2FA 활성화
router.post('/two-factor/enable', async (req, res) => {
    try {
        const { userId, token } = req.body;

        if (!userId || !token) {
            return res.status(400).json({
                success: false,
                message: '사용자 ID와 인증 코드가 필요합니다.'
            });
        }

        const result = await advancedAuthService.enableTwoFactor(userId, token);

        res.json(result);
    } catch (error) {
        logger.error('Two-factor enable error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 2FA 비활성화
router.post('/two-factor/disable', async (req, res) => {
    try {
        const { userId, password, twoFactorCode } = req.body;

        if (!userId || !password) {
            return res.status(400).json({
                success: false,
                message: '사용자 ID와 비밀번호가 필요합니다.'
            });
        }

        const user = advancedAuthService.users.get(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        // 비밀번호 확인
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: '비밀번호가 올바르지 않습니다.'
            });
        }

        // 2FA 코드 확인
        if (user.twoFactorEnabled) {
            if (!twoFactorCode) {
                return res.status(400).json({
                    success: false,
                    message: '2단계 인증 코드가 필요합니다.'
                });
            }

            const isValidTwoFactor = advancedAuthService.verifyTwoFactorCode(userId, twoFactorCode);
            if (!isValidTwoFactor) {
                return res.status(401).json({
                    success: false,
                    message: '잘못된 2단계 인증 코드입니다.'
                });
            }
        }

        // 2FA 비활성화
        user.twoFactorEnabled = false;
        user.twoFactorSecret = null;
        advancedAuthService.users.set(userId, user);

        // 감사 로그
        advancedAuthService.logAuditEvent('user.two_factor_disabled', userId);

        res.json({
            success: true,
            message: '2단계 인증이 비활성화되었습니다.'
        });
    } catch (error) {
        logger.error('Two-factor disable error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 비밀번호 변경
router.post('/change-password', async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;

        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: '모든 필드를 입력해주세요.'
            });
        }

        const result = await advancedAuthService.changePassword(userId, currentPassword, newPassword);

        res.json(result);
    } catch (error) {
        logger.error('Password change error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 비밀번호 재설정 요청
router.post('/reset-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: '이메일을 입력해주세요.'
            });
        }

        const result = await advancedAuthService.resetPassword(email);

        res.json(result);
    } catch (error) {
        logger.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 비밀번호 재설정 완료
router.post('/confirm-reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({
                success: false,
                message: '재설정 토큰과 새 비밀번호를 입력해주세요.'
            });
        }

        const result = await advancedAuthService.confirmPasswordReset(resetToken, newPassword);

        res.json(result);
    } catch (error) {
        logger.error('Password reset confirmation error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 사용자 역할 변경
router.post('/change-role', async (req, res) => {
    try {
        const { userId, newRole, changedBy } = req.body;

        if (!userId || !newRole || !changedBy) {
            return res.status(400).json({
                success: false,
                message: '사용자 ID, 새 역할, 변경자 정보가 필요합니다.'
            });
        }

        const result = await advancedAuthService.changeUserRole(userId, newRole, changedBy);

        res.json(result);
    } catch (error) {
        logger.error('Role change error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 권한 확인
router.post('/check-permission', (req, res) => {
    try {
        const { userId, permission } = req.body;

        if (!userId || !permission) {
            return res.status(400).json({
                success: false,
                message: '사용자 ID와 권한이 필요합니다.'
            });
        }

        const hasPermission = advancedAuthService.hasPermission(userId, permission);

        res.json({
            success: true,
            hasPermission
        });
    } catch (error) {
        logger.error('Permission check error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 역할 확인
router.post('/check-role', (req, res) => {
    try {
        const { userId, role } = req.body;

        if (!userId || !role) {
            return res.status(400).json({
                success: false,
                message: '사용자 ID와 역할이 필요합니다.'
            });
        }

        const hasRole = advancedAuthService.hasRole(userId, role);

        res.json({
            success: true,
            hasRole
        });
    } catch (error) {
        logger.error('Role check error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 사용자 정보 조회
router.get('/user/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const user = advancedAuthService.users.get(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        const sanitizedUser = advancedAuthService.sanitizeUser(user);
        const role = advancedAuthService.roles.get(user.role);

        res.json({
            success: true,
            user: {
                ...sanitizedUser,
                roleInfo: role
            }
        });
    } catch (error) {
        logger.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 역할 목록 조회
router.get('/roles', (req, res) => {
    try {
        const roles = Array.from(advancedAuthService.roles.values());

        res.json({
            success: true,
            data: roles
        });
    } catch (error) {
        logger.error('Get roles error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 권한 목록 조회
router.get('/permissions', (req, res) => {
    try {
        const permissions = Array.from(advancedAuthService.permissions.values());

        res.json({
            success: true,
            data: permissions
        });
    } catch (error) {
        logger.error('Get permissions error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 감사 로그 조회
router.get('/audit-logs', (req, res) => {
    try {
        const { userId, action, startDate, endDate, limit = 100 } = req.query;

        const filters = {
            userId,
            action,
            startDate,
            endDate
        };

        const logs = advancedAuthService.getAuditLogs(filters, parseInt(limit));

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        logger.error('Get audit logs error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 보안 통계 조회
router.get('/security-stats', (req, res) => {
    try {
        const stats = advancedAuthService.getSecurityStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Get security stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 활성 세션 조회
router.get('/sessions/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const sessions = Array.from(advancedAuthService.sessions.values())
            .filter(session => session.userId === userId && session.isActive);

        res.json({
            success: true,
            data: sessions
        });
    } catch (error) {
        logger.error('Get sessions error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 세션 무효화
router.post('/invalidate-session', (req, res) => {
    try {
        const { sessionId, userId } = req.body;

        if (sessionId) {
            const session = advancedAuthService.sessions.get(sessionId);
            if (session) {
                session.isActive = false;
                advancedAuthService.sessions.set(sessionId, session);
            }
        } else if (userId) {
            advancedAuthService.invalidateUserSessions(userId);
        } else {
            return res.status(400).json({
                success: false,
                message: '세션 ID 또는 사용자 ID가 필요합니다.'
            });
        }

        res.json({
            success: true,
            message: '세션이 무효화되었습니다.'
        });
    } catch (error) {
        logger.error('Invalidate session error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 계정 잠금 해제
router.post('/unlock-account', (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '사용자 ID가 필요합니다.'
            });
        }

        const user = advancedAuthService.users.get(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        user.lockedUntil = null;
        user.failedLoginAttempts = 0;
        advancedAuthService.users.set(userId, user);

        // 감사 로그
        advancedAuthService.logAuditEvent('user.account_unlocked', userId);

        res.json({
            success: true,
            message: '계정이 잠금 해제되었습니다.'
        });
    } catch (error) {
        logger.error('Unlock account error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 이메일 인증
router.post('/verify-email', (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: '인증 토큰이 필요합니다.'
            });
        }

        const verificationData = advancedAuthService.emailVerificationTokens.get(token);
        if (!verificationData || new Date() > verificationData.expiresAt) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않거나 만료된 인증 토큰입니다.'
            });
        }

        const user = advancedAuthService.users.get(verificationData.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        user.emailVerified = true;
        advancedAuthService.users.set(user.id, user);

        // 인증 토큰 삭제
        advancedAuthService.emailVerificationTokens.delete(token);

        // 감사 로그
        advancedAuthService.logAuditEvent('user.email_verified', user.id);

        res.json({
            success: true,
            message: '이메일이 성공적으로 인증되었습니다.'
        });
    } catch (error) {
        logger.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;

