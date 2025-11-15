import { getPool } from '../db.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('ModeratorService');

class ModeratorService {
    /**
     * 사용자에게 모더레이터 권한 부여
     */
    async assignModeratorRole(userId, assignedBy, boardId = null, role = 'moderator', permissions = [], expiresAt = null) {
        const pool = getPool();

        try {
            const query = `
                INSERT INTO moderator_roles 
                    (user_id, board_id, role, permissions, assigned_by, expires_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            const [result] = await pool.query(query, [
                userId,
                boardId,
                role,
                JSON.stringify(permissions),
                assignedBy,
                expiresAt
            ]);

            await this.logModeratorAction(assignedBy, 'assign_moderator', 'user', userId,
                `모더레이터 권한 부여: ${role}`);

            logger.info(`모더레이터 권한 부여: user_id=${userId}, role=${role}`);

            return {
                success: true,
                moderatorRoleId: result.insertId
            };
        } catch (error) {
            logger.error('모더레이터 권한 부여 실패:', error);
            throw error;
        }
    }

    /**
     * 모더레이터 권한 확인
     */
    async checkModeratorPermission(userId, boardId = null, requiredPermission = null) {
        const pool = getPool();

        try {
            const query = `
                SELECT id, role, permissions, board_id, expires_at
                FROM moderator_roles
                WHERE user_id = ?
                    AND is_active = TRUE
                    AND (board_id = ? OR board_id IS NULL)
                    AND (expires_at IS NULL OR expires_at > NOW())
            `;

            const [roles] = await pool.query(query, [userId, boardId]);

            if (roles.length === 0) {
                return { hasPermission: false, role: null };
            }

            const role = roles[0];

            // 권한 체크
            if (requiredPermission) {
                const permissions = JSON.parse(role.permissions || '[]');
                if (!permissions.includes(requiredPermission) && role.role !== 'super_admin') {
                    return { hasPermission: false, role: role.role };
                }
            }

            return {
                hasPermission: true,
                role: role.role,
                boardId: role.board_id
            };
        } catch (error) {
            logger.error('권한 확인 실패:', error);
            throw error;
        }
    }

    /**
     * 사용자 경고 발행
     */
    async issueWarning(userId, moderatorId, reason, severity = 'low', postId = null, commentId = null, expiresAt = null) {
        const pool = getPool();

        try {
            const query = `
                INSERT INTO user_warnings 
                    (user_id, moderator_id, reason, severity, post_id, comment_id, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await pool.query(query, [
                userId, moderatorId, reason, severity, postId, commentId, expiresAt
            ]);

            await this.logModeratorAction(moderatorId, 'warn', 'user', userId, reason);

            // 경고 횟수 확인
            const [warnings] = await pool.query(`
                SELECT COUNT(*) as count
                FROM user_warnings
                WHERE user_id = ? AND is_active = TRUE
            `, [userId]);

            logger.info(`경고 발행: user_id=${userId}, severity=${severity}, total_warnings=${warnings[0].count}`);

            return {
                success: true,
                warningId: result.insertId,
                totalWarnings: warnings[0].count
            };
        } catch (error) {
            logger.error('경고 발행 실패:', error);
            throw error;
        }
    }

    /**
     * 사용자 차단
     */
    async banUser(userId, moderatorId, reason, banType = 'temporary', endTime = null, boardId = null) {
        const pool = getPool();

        try {
            // 기존 활성 차단 확인
            const [existingBans] = await pool.query(`
                SELECT id FROM user_bans
                WHERE user_id = ? AND is_active = TRUE
                    AND (board_id = ? OR board_id IS NULL)
            `, [userId, boardId]);

            if (existingBans.length > 0) {
                throw new Error('이미 차단된 사용자입니다');
            }

            const query = `
                INSERT INTO user_bans 
                    (user_id, moderator_id, ban_type, reason, board_id, end_time)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            const [result] = await pool.query(query, [
                userId, moderatorId, banType, reason, boardId, endTime
            ]);

            await this.logModeratorAction(moderatorId, 'ban', 'user', userId,
                `차단: ${banType} - ${reason}`);

            logger.info(`사용자 차단: user_id=${userId}, type=${banType}`);

            return {
                success: true,
                banId: result.insertId,
                banType,
                endTime
            };
        } catch (error) {
            logger.error('사용자 차단 실패:', error);
            throw error;
        }
    }

    /**
     * 사용자 차단 해제
     */
    async unbanUser(userId, moderatorId, reason) {
        const pool = getPool();

        try {
            const query = `
                UPDATE user_bans
                SET is_active = FALSE, updated_at = NOW()
                WHERE user_id = ? AND is_active = TRUE
            `;

            const [result] = await pool.query(query, [userId]);

            if (result.affectedRows === 0) {
                throw new Error('활성 차단 기록을 찾을 수 없습니다');
            }

            await this.logModeratorAction(moderatorId, 'unban', 'user', userId, reason);

            logger.info(`차단 해제: user_id=${userId}`);

            return { success: true };
        } catch (error) {
            logger.error('차단 해제 실패:', error);
            throw error;
        }
    }

    /**
     * 콘텐츠 신고 접수
     */
    async reportContent(reporterId, reportedUserId, contentType, contentId, reason, description = null) {
        const pool = getPool();

        try {
            // 중복 신고 확인 (24시간 이내)
            const [existingReports] = await pool.query(`
                SELECT id FROM content_reports
                WHERE reporter_id = ?
                    AND content_type = ?
                    AND content_id = ?
                    AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
            `, [reporterId, contentType, contentId]);

            if (existingReports.length > 0) {
                throw new Error('이미 신고한 콘텐츠입니다');
            }

            // 우선순위 자동 결정 (같은 콘텐츠 신고 횟수 기반)
            const [reportCount] = await pool.query(`
                SELECT COUNT(*) as count
                FROM content_reports
                WHERE content_type = ? AND content_id = ?
            `, [contentType, contentId]);

            let priority = 'normal';
            if (reportCount[0].count >= 10) priority = 'urgent';
            else if (reportCount[0].count >= 5) priority = 'high';

            const query = `
                INSERT INTO content_reports 
                    (reporter_id, reported_user_id, content_type, content_id, reason, description, priority)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await pool.query(query, [
                reporterId, reportedUserId, contentType, contentId, reason, description, priority
            ]);

            logger.info(`콘텐츠 신고: type=${contentType}, id=${contentId}, priority=${priority}`);

            return {
                success: true,
                reportId: result.insertId,
                priority
            };
        } catch (error) {
            logger.error('콘텐츠 신고 실패:', error);
            throw error;
        }
    }

    /**
     * 신고 목록 조회 (모더레이터용)
     */
    async getReports(status = null, priority = null, contentType = null, limit = 50, offset = 0) {
        const pool = getPool();

        try {
            let whereConditions = [];
            let params = [];

            if (status) {
                whereConditions.push('cr.status = ?');
                params.push(status);
            }
            if (priority) {
                whereConditions.push('cr.priority = ?');
                params.push(priority);
            }
            if (contentType) {
                whereConditions.push('cr.content_type = ?');
                params.push(contentType);
            }

            const whereClause = whereConditions.length > 0
                ? 'WHERE ' + whereConditions.join(' AND ')
                : '';

            const query = `
                SELECT 
                    cr.*,
                    reporter.username as reporter_username,
                    reporter.display_name as reporter_display_name,
                    reported.username as reported_username,
                    reported.display_name as reported_display_name,
                    mod.username as moderator_username
                FROM content_reports cr
                INNER JOIN users reporter ON cr.reporter_id = reporter.id
                INNER JOIN users reported ON cr.reported_user_id = reported.id
                LEFT JOIN users mod ON cr.assigned_moderator_id = mod.id
                ${whereClause}
                ORDER BY 
                    FIELD(cr.priority, 'urgent', 'high', 'normal', 'low'),
                    cr.created_at DESC
                LIMIT ? OFFSET ?
            `;

            params.push(limit, offset);

            const [reports] = await pool.query(query, params);

            // 총 개수
            const countQuery = `
                SELECT COUNT(*) as total
                FROM content_reports cr
                ${whereClause}
            `;
            const [countResult] = await pool.query(countQuery, params.slice(0, -2));

            return {
                reports,
                total: countResult[0].total,
                limit,
                offset
            };
        } catch (error) {
            logger.error('신고 목록 조회 실패:', error);
            throw error;
        }
    }

    /**
     * 신고 처리
     */
    async resolveReport(reportId, moderatorId, action, note = null) {
        const pool = getPool();

        try {
            const query = `
                UPDATE content_reports
                SET status = 'resolved',
                    assigned_moderator_id = ?,
                    resolution_action = ?,
                    resolution_note = ?,
                    resolved_at = NOW()
                WHERE id = ?
            `;

            await pool.query(query, [moderatorId, action, note, reportId]);

            await this.logModeratorAction(moderatorId, 'resolve_report', 'report', reportId,
                `신고 처리: ${action}`);

            logger.info(`신고 처리 완료: report_id=${reportId}, action=${action}`);

            return { success: true };
        } catch (error) {
            logger.error('신고 처리 실패:', error);
            throw error;
        }
    }

    /**
     * 모더레이터 활동 로그 기록
     */
    async logModeratorAction(moderatorId, actionType, targetType, targetId, reason, details = null, ipAddress = null, userAgent = null) {
        const pool = getPool();

        try {
            const query = `
                INSERT INTO moderator_actions 
                    (moderator_id, action_type, target_type, target_id, reason, details, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            await pool.query(query, [
                moderatorId,
                actionType,
                targetType,
                targetId,
                reason,
                details ? JSON.stringify(details) : null,
                ipAddress,
                userAgent
            ]);
        } catch (error) {
            logger.error('모더레이터 활동 로그 기록 실패:', error);
            // 로그 실패는 메인 작업 실패로 전파하지 않음
        }
    }

    /**
     * 모더레이터 통계 조회
     */
    async getModeratorStatistics(moderatorId = null) {
        const pool = getPool();

        try {
            const whereClause = moderatorId ? 'WHERE user_id = ?' : '';
            const params = moderatorId ? [moderatorId] : [];

            const [stats] = await pool.query(`
                SELECT * FROM moderator_statistics
                ${whereClause}
                ORDER BY total_actions DESC
            `, params);

            return moderatorId ? stats[0] : stats;
        } catch (error) {
            logger.error('모더레이터 통계 조회 실패:', error);
            throw error;
        }
    }

    /**
     * 미처리 신고 통계
     */
    async getPendingReportsSummary() {
        const pool = getPool();

        try {
            const [summary] = await pool.query(`
                SELECT * FROM pending_reports_summary
                ORDER BY 
                    FIELD(priority, 'urgent', 'high', 'normal', 'low'),
                    count DESC
            `);

            return summary;
        } catch (error) {
            logger.error('미처리 신고 통계 조회 실패:', error);
            throw error;
        }
    }

    /**
     * 사용자 차단 상태 확인
     */
    async checkUserBanStatus(userId, boardId = null) {
        const pool = getPool();

        try {
            const [bans] = await pool.query(`
                SELECT *
                FROM user_bans
                WHERE user_id = ?
                    AND is_active = TRUE
                    AND (board_id = ? OR board_id IS NULL)
                    AND (end_time IS NULL OR end_time > NOW())
            `, [userId, boardId]);

            if (bans.length === 0) {
                return { isBanned: false };
            }

            const ban = bans[0];
            return {
                isBanned: true,
                banType: ban.ban_type,
                reason: ban.reason,
                endTime: ban.end_time,
                isPermanent: ban.ban_type === 'permanent' || !ban.end_time
            };
        } catch (error) {
            logger.error('차단 상태 확인 실패:', error);
            throw error;
        }
    }
}

export default new ModeratorService();
