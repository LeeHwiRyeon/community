/**
 * Online Status Routes
 * 온라인 상태 관리 REST API
 * 
 * @author AUTOAGENTS
 * @date 2025-11-11
 */

import express from 'express';
import { authenticateToken } from '../auth/jwt.js';
import logger from '../logger.js';
import { onlineStatusManager } from '../sockets/online-status-socket.js';

const router = express.Router();

/**
 * GET /api/online-status
 * 온라인 사용자 목록 조회
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const users = onlineStatusManager.getOnlineUsers();

        res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        logger.error('Error fetching online users:', error);
        res.status(500).json({
            success: false,
            error: '온라인 사용자 목록을 불러오는데 실패했습니다.'
        });
    }
});

/**
 * GET /api/online-status/:userId
 * 특정 사용자 상태 조회
 */
router.get('/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const status = onlineStatusManager.getUserStatus(parseInt(userId, 10));

        if (!status) {
            return res.json({
                success: true,
                online: false,
                status: 'offline'
            });
        }

        res.json({
            success: true,
            online: true,
            ...status
        });
    } catch (error) {
        logger.error('Error fetching user status:', error);
        res.status(500).json({
            success: false,
            error: '사용자 상태를 불러오는데 실패했습니다.'
        });
    }
});

/**
 * POST /api/online-status/heartbeat
 * 하트비트 전송 (연결 유지)
 */
router.post('/heartbeat', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        await onlineStatusManager.updateHeartbeat(userId);

        res.json({
            success: true,
            message: '하트비트가 업데이트되었습니다.',
            timestamp: Date.now()
        });
    } catch (error) {
        logger.error('Error updating heartbeat:', error);
        res.status(500).json({
            success: false,
            error: '하트비트 업데이트에 실패했습니다.'
        });
    }
});

/**
 * GET /api/online-status/stats
 * 온라인 상태 통계
 */
router.get('/stats/summary', authenticateToken, async (req, res) => {
    try {
        const users = onlineStatusManager.getOnlineUsers();

        const stats = {
            total: users.length,
            byStatus: {
                online: users.filter(u => u.status === 'online').length,
                away: users.filter(u => u.status === 'away').length,
                busy: users.filter(u => u.status === 'busy').length
            }
        };

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        logger.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: '통계를 불러오는데 실패했습니다.'
        });
    }
});

export default router;
