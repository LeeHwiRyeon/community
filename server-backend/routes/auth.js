const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

/**
 * 인증 라우트
 */
module.exports = (db, redis) => {
    const router = express.Router();

    // JWT 시크릿 키
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

    /**
     * 회원가입
     */
    router.post('/register', async (req, res) => {
        try {
            const { email, password, username, displayName } = req.body;

            // 입력 검증
            if (!email || !password || !username) {
                return res.status(400).json({
                    success: false,
                    message: '이메일, 비밀번호, 사용자명은 필수입니다.'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: '비밀번호는 최소 6자 이상이어야 합니다.'
                });
            }

            // 이메일 중복 확인
            const [existingUser] = await db.execute(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (existingUser.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: '이미 사용 중인 이메일입니다.'
                });
            }

            // 사용자명 중복 확인
            const [existingUsername] = await db.execute(
                'SELECT id FROM users WHERE username = ?',
                [username]
            );

            if (existingUsername.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: '이미 사용 중인 사용자명입니다.'
                });
            }

            // 비밀번호 해시화
            const passwordHash = await bcrypt.hash(password, 12);

            // 사용자 생성
            const userId = uuidv4();
            await db.execute(
                'INSERT INTO users (id, email, password_hash, username, display_name, provider) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, email, passwordHash, username, displayName || username, 'local']
            );

            // JWT 토큰 생성
            const token = jwt.sign(
                { userId, email, username },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            res.status(201).json({
                success: true,
                message: '회원가입이 완료되었습니다.',
                data: {
                    user: {
                        id: userId,
                        email,
                        username,
                        displayName: displayName || username
                    },
                    token
                }
            });

        } catch (error) {
            console.error('회원가입 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    });

    /**
     * 로그인
     */
    router.post('/login', async (req, res) => {
        try {
            const { email, password } = req.body;

            // 입력 검증
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: '이메일과 비밀번호를 입력해주세요.'
                });
            }

            // 사용자 조회
            const [users] = await db.execute(
                'SELECT id, email, password_hash, username, display_name, is_active FROM users WHERE email = ?',
                [email]
            );

            if (users.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: '이메일 또는 비밀번호가 올바르지 않습니다.'
                });
            }

            const user = users[0];

            // 계정 활성화 확인
            if (!user.is_active) {
                return res.status(401).json({
                    success: false,
                    message: '비활성화된 계정입니다.'
                });
            }

            // 비밀번호 확인
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: '이메일 또는 비밀번호가 올바르지 않습니다.'
                });
            }

            // JWT 토큰 생성
            const token = jwt.sign(
                { userId: user.id, email: user.email, username: user.username },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            // Redis에 토큰 저장 (선택적)
            if (redis) {
                await redis.setEx(`token:${user.id}`, 86400, token); // 24시간
            }

            res.json({
                success: true,
                message: '로그인 성공',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        displayName: user.display_name
                    },
                    token
                }
            });

        } catch (error) {
            console.error('로그인 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    });

    /**
     * 토큰 검증
     */
    router.get('/verify', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: '토큰이 제공되지 않았습니다.'
                });
            }

            // JWT 토큰 검증
            const decoded = jwt.verify(token, JWT_SECRET);

            // 사용자 정보 조회
            const [users] = await db.execute(
                'SELECT id, email, username, display_name, is_active FROM users WHERE id = ?',
                [decoded.userId]
            );

            if (users.length === 0 || !users[0].is_active) {
                return res.status(401).json({
                    success: false,
                    message: '유효하지 않은 토큰입니다.'
                });
            }

            res.json({
                success: true,
                data: {
                    user: {
                        id: users[0].id,
                        email: users[0].email,
                        username: users[0].username,
                        displayName: users[0].display_name
                    }
                }
            });

        } catch (error) {
            console.error('토큰 검증 오류:', error);
            res.status(401).json({
                success: false,
                message: '유효하지 않은 토큰입니다.'
            });
        }
    });

    /**
     * 로그아웃
     */
    router.post('/logout', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (token && redis) {
                const decoded = jwt.decode(token);
                if (decoded && decoded.userId) {
                    await redis.del(`token:${decoded.userId}`);
                }
            }

            res.json({
                success: true,
                message: '로그아웃되었습니다.'
            });

        } catch (error) {
            console.error('로그아웃 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    });

    return router;
};
