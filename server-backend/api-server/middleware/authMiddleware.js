const advancedAuthService = require('../services/advancedAuthService');
const logger = require('../../utils/logger');

// JWT 토큰 검증 미들웨어
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: '액세스 토큰이 필요합니다.'
            });
        }

        const decoded = advancedAuthService.verifyToken(token, 'access');
        const session = advancedAuthService.sessions.get(decoded.sessionId);

        if (!session || !session.isActive) {
            return res.status(401).json({
                success: false,
                message: '유효하지 않은 세션입니다.'
            });
        }

        // 세션 만료 확인
        if (new Date() > new Date(session.expiresAt)) {
            session.isActive = false;
            advancedAuthService.sessions.set(session.id, session);
            return res.status(401).json({
                success: false,
                message: '세션이 만료되었습니다.'
            });
        }

        // 사용자 정보 확인
        const user = advancedAuthService.users.get(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: '사용자 계정이 비활성화되었습니다.'
            });
        }

        // 세션 활동 업데이트
        session.lastActivityAt = new Date().toISOString();
        advancedAuthService.sessions.set(session.id, session);

        // 요청 객체에 사용자 정보 추가
        req.user = {
            userId: decoded.userId,
            sessionId: decoded.sessionId,
            role: decoded.role,
            permissions: decoded.permissions
        };

        next();
    } catch (error) {
        logger.error('Token authentication error:', error);
        return res.status(401).json({
            success: false,
            message: '유효하지 않은 토큰입니다.'
        });
    }
};

// 권한 확인 미들웨어
const requirePermission = (permission) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: '인증이 필요합니다.'
                });
            }

            const hasPermission = advancedAuthService.hasPermission(req.user.userId, permission);
            if (!hasPermission) {
                // 감사 로그
                advancedAuthService.logAuditEvent('access.denied', req.user.userId, {
                    permission,
                    path: req.path,
                    method: req.method
                });

                return res.status(403).json({
                    success: false,
                    message: '이 작업을 수행할 권한이 없습니다.'
                });
            }

            next();
        } catch (error) {
            logger.error('Permission check error:', error);
            return res.status(500).json({
                success: false,
                message: '권한 확인 중 오류가 발생했습니다.'
            });
        }
    };
};

// 역할 확인 미들웨어
const requireRole = (role) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: '인증이 필요합니다.'
                });
            }

            const hasRole = advancedAuthService.hasRole(req.user.userId, role);
            if (!hasRole) {
                // 감사 로그
                advancedAuthService.logAuditEvent('access.denied', req.user.userId, {
                    requiredRole: role,
                    userRole: req.user.role,
                    path: req.path,
                    method: req.method
                });

                return res.status(403).json({
                    success: false,
                    message: '이 작업을 수행할 권한이 없습니다.'
                });
            }

            next();
        } catch (error) {
            logger.error('Role check error:', error);
            return res.status(500).json({
                success: false,
                message: '역할 확인 중 오류가 발생했습니다.'
            });
        }
    };
};

// 역할 레벨 확인 미들웨어
const requireRoleLevel = (minLevel) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: '인증이 필요합니다.'
                });
            }

            const hasRequiredLevel = advancedAuthService.hasRoleLevel(req.user.userId, minLevel);
            if (!hasRequiredLevel) {
                // 감사 로그
                advancedAuthService.logAuditEvent('access.denied', req.user.userId, {
                    requiredLevel: minLevel,
                    userRole: req.user.role,
                    path: req.path,
                    method: req.method
                });

                return res.status(403).json({
                    success: false,
                    message: '이 작업을 수행할 권한이 없습니다.'
                });
            }

            next();
        } catch (error) {
            logger.error('Role level check error:', error);
            return res.status(500).json({
                success: false,
                message: '역할 레벨 확인 중 오류가 발생했습니다.'
            });
        }
    };
};

// 선택적 인증 미들웨어 (토큰이 있으면 검증, 없어도 통과)
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = advancedAuthService.verifyToken(token, 'access');
        const session = advancedAuthService.sessions.get(decoded.sessionId);

        if (session && session.isActive && new Date() <= new Date(session.expiresAt)) {
            const user = advancedAuthService.users.get(decoded.userId);
            if (user && user.isActive) {
                req.user = {
                    userId: decoded.userId,
                    sessionId: decoded.sessionId,
                    role: decoded.role,
                    permissions: decoded.permissions
                };
            }
        }

        next();
    } catch (error) {
        // 토큰이 유효하지 않아도 계속 진행
        req.user = null;
        next();
    }
};

// 관리자 권한 확인 미들웨어
const requireAdmin = requireRoleLevel(90);

// 슈퍼 관리자 권한 확인 미들웨어
const requireSuperAdmin = requireRoleLevel(100);

// 중재자 권한 확인 미들웨어
const requireModerator = requireRoleLevel(70);

// 사용자 자신의 리소스 확인 미들웨어
const requireOwnership = (resourceUserIdParam = 'userId') => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: '인증이 필요합니다.'
                });
            }

            const resourceUserId = req.params[resourceUserIdParam];
            const isOwner = req.user.userId === resourceUserId;
            const isAdmin = advancedAuthService.hasRoleLevel(req.user.userId, 90);

            if (!isOwner && !isAdmin) {
                // 감사 로그
                advancedAuthService.logAuditEvent('access.denied', req.user.userId, {
                    reason: 'ownership_required',
                    resourceUserId,
                    path: req.path,
                    method: req.method
                });

                return res.status(403).json({
                    success: false,
                    message: '자신의 리소스에만 접근할 수 있습니다.'
                });
            }

            next();
        } catch (error) {
            logger.error('Ownership check error:', error);
            return res.status(500).json({
                success: false,
                message: '소유권 확인 중 오류가 발생했습니다.'
            });
        }
    };
};

// API 키 인증 미들웨어
const authenticateApiKey = (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            return res.status(401).json({
                success: false,
                message: 'API 키가 필요합니다.'
            });
        }

        // API 키 검증 로직 (실제 구현에서는 데이터베이스에서 확인)
        const validApiKeys = process.env.VALID_API_KEYS ? process.env.VALID_API_KEYS.split(',') : [];

        if (!validApiKeys.includes(apiKey)) {
            return res.status(401).json({
                success: false,
                message: '유효하지 않은 API 키입니다.'
            });
        }

        req.apiKey = apiKey;
        next();
    } catch (error) {
        logger.error('API key authentication error:', error);
        return res.status(401).json({
            success: false,
            message: 'API 키 인증 중 오류가 발생했습니다.'
        });
    }
};

// 요청 속도 제한 미들웨어
const rateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
    const requests = new Map();

    return (req, res, next) => {
        try {
            const clientId = req.ip || req.connection.remoteAddress;
            const now = Date.now();
            const windowStart = now - windowMs;

            // 클라이언트별 요청 기록 정리
            if (requests.has(clientId)) {
                const clientRequests = requests.get(clientId).filter(time => time > windowStart);
                requests.set(clientId, clientRequests);
            } else {
                requests.set(clientId, []);
            }

            const clientRequests = requests.get(clientId);

            if (clientRequests.length >= maxRequests) {
                return res.status(429).json({
                    success: false,
                    message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
                });
            }

            // 현재 요청 기록
            clientRequests.push(now);
            requests.set(clientId, clientRequests);

            next();
        } catch (error) {
            logger.error('Rate limit error:', error);
            next(); // 오류가 발생해도 요청을 계속 진행
        }
    };
};

// 로그인 시도 제한 미들웨어
const loginRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
    const attempts = new Map();

    return (req, res, next) => {
        try {
            const clientId = req.ip || req.connection.remoteAddress;
            const now = Date.now();
            const windowStart = now - windowMs;

            // 클라이언트별 시도 기록 정리
            if (attempts.has(clientId)) {
                const clientAttempts = attempts.get(clientId).filter(time => time > windowStart);
                attempts.set(clientId, clientAttempts);
            } else {
                attempts.set(clientId, []);
            }

            const clientAttempts = attempts.get(clientId);

            if (clientAttempts.length >= maxAttempts) {
                return res.status(429).json({
                    success: false,
                    message: '로그인 시도 한도를 초과했습니다. 15분 후 다시 시도해주세요.'
                });
            }

            // 현재 시도 기록
            clientAttempts.push(now);
            attempts.set(clientId, clientAttempts);

            next();
        } catch (error) {
            logger.error('Login rate limit error:', error);
            next();
        }
    };
};

// 감사 로깅 미들웨어
const auditLog = (action) => {
    return (req, res, next) => {
        try {
            const originalSend = res.send;

            res.send = function (data) {
                // 응답 후 감사 로그 기록
                if (req.user) {
                    advancedAuthService.logAuditEvent(action, req.user.userId, {
                        path: req.path,
                        method: req.method,
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent'),
                        statusCode: res.statusCode
                    });
                }

                originalSend.call(this, data);
            };

            next();
        } catch (error) {
            logger.error('Audit log error:', error);
            next();
        }
    };
};

module.exports = {
    authenticateToken,
    requirePermission,
    requireRole,
    requireRoleLevel,
    optionalAuth,
    requireAdmin,
    requireSuperAdmin,
    requireModerator,
    requireOwnership,
    authenticateApiKey,
    rateLimit,
    loginRateLimit,
    auditLog
};