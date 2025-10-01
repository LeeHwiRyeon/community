/**
 * 버그 추적 시스템
 * 
 * 이 모듈은 버그의 생성, 추적, 관리, 해결을 위한
 * 포괄적인 버그 추적 시스템을 제공합니다.
 */

import { query } from '../db.js';
import { sendSlackNotification, sendEmailNotification } from '../notifications/index.js';

// 버그 심각도 상수
export const SEVERITY = {
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low'
};

// 버그 상태 상수
export const STATUS = {
    NEW: 'New',
    ASSIGNED: 'Assigned',
    IN_PROGRESS: 'In Progress',
    TESTING: 'Testing',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
    REOPENED: 'Reopened',
    DUPLICATE: 'Duplicate',
    WONT_FIX: 'Won\'t Fix'
};

// 버그 카테고리 상수
export const CATEGORY = {
    FRONTEND: 'Frontend',
    BACKEND: 'Backend',
    DATABASE: 'Database',
    PERFORMANCE: 'Performance',
    SECURITY: 'Security',
    INTEGRATION: 'Integration',
    INFRASTRUCTURE: 'Infrastructure'
};

/**
 * 버그 생성
 */
export async function createBug(bugData, reporterId) {
    const {
        title,
        description,
        severity = SEVERITY.MEDIUM,
        category = CATEGORY.BACKEND,
        environment = 'production',
        browser = 'unknown',
        os = 'unknown',
        steps_to_reproduce = '',
        expected_result = '',
        actual_result = '',
        attachments = [],
        tags = []
    } = bugData;

    // 우선순위 자동 계산
    const priority = calculatePriority(severity, category);

    // 자동 태그 생성
    const autoTags = generateAutoTags(title, description, category);
    const allTags = [...new Set([...tags, ...autoTags])];

    // 예상 해결 시간 계산
    const estimated_hours = calculateEstimatedHours(severity, category);

    try {
        const result = await query(`
      INSERT INTO bugs (
        title, description, severity, priority, category,
        reporter_id, environment, browser, os,
        steps_to_reproduce, expected_result, actual_result,
        estimated_hours, tags, attachments, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            title, description, severity, priority, category,
            reporterId, environment, browser, os,
            steps_to_reproduce, expected_result, actual_result,
            estimated_hours, JSON.stringify(allTags), JSON.stringify(attachments), STATUS.NEW
        ]);

        const bugId = result.insertId;

        // 히스토리 기록
        await recordBugHistory(bugId, 'status', null, STATUS.NEW, reporterId);
        await recordBugHistory(bugId, 'priority', null, priority, reporterId);

        // 알림 전송
        await sendBugNotification(bugId, 'created');

        // 자동 할당 (규칙 기반)
        const assigneeId = await getAutoAssignee(category, severity);
        if (assigneeId) {
            await assignBug(bugId, assigneeId, reporterId);
        }

        return {
            id: bugId,
            title,
            severity,
            priority,
            category,
            status: STATUS.NEW,
            estimated_hours
        };

    } catch (error) {
        console.error('버그 생성 실패:', error);
        throw new Error('버그 생성에 실패했습니다.');
    }
}

/**
 * 버그 조회
 */
export async function getBug(bugId) {
    try {
        const bugs = await query(`
      SELECT 
        b.*,
        r.username as reporter_name,
        r.email as reporter_email,
        a.username as assignee_name,
        a.email as assignee_email
      FROM bugs b
      LEFT JOIN users r ON b.reporter_id = r.id
      LEFT JOIN users a ON b.assignee_id = a.id
      WHERE b.id = ?
    `, [bugId]);

        if (bugs.length === 0) {
            throw new Error('버그를 찾을 수 없습니다.');
        }

        const bug = bugs[0];

        // JSON 필드 파싱
        bug.tags = JSON.parse(bug.tags || '[]');
        bug.attachments = JSON.parse(bug.attachments || '[]');

        return bug;

    } catch (error) {
        console.error('버그 조회 실패:', error);
        throw error;
    }
}

/**
 * 버그 목록 조회
 */
export async function getBugs(filters = {}) {
    const {
        page = 1,
        limit = 20,
        status,
        severity,
        category,
        assignee_id,
        reporter_id,
        priority,
        search,
        sort_by = 'created_at',
        sort_order = 'DESC'
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
        whereClause += ' AND b.status = ?';
        params.push(status);
    }

    if (severity) {
        whereClause += ' AND b.severity = ?';
        params.push(severity);
    }

    if (category) {
        whereClause += ' AND b.category = ?';
        params.push(category);
    }

    if (assignee_id) {
        whereClause += ' AND b.assignee_id = ?';
        params.push(assignee_id);
    }

    if (reporter_id) {
        whereClause += ' AND b.reporter_id = ?';
        params.push(reporter_id);
    }

    if (priority) {
        whereClause += ' AND b.priority = ?';
        params.push(priority);
    }

    if (search) {
        whereClause += ' AND (b.title LIKE ? OR b.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    const offset = (page - 1) * limit;

    try {
        const bugs = await query(`
      SELECT 
        b.id, b.title, b.description, b.severity, b.priority, b.category,
        b.status, b.created_at, b.updated_at, b.resolved_at,
        b.estimated_hours, b.actual_hours,
        r.username as reporter_name,
        a.username as assignee_name
      FROM bugs b
      LEFT JOIN users r ON b.reporter_id = r.id
      LEFT JOIN users a ON b.assignee_id = a.id
      ${whereClause}
      ORDER BY b.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

        // 총 개수 조회
        const countResult = await query(`
      SELECT COUNT(*) as total
      FROM bugs b
      ${whereClause}
    `, params);

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        return {
            bugs: bugs.map(bug => ({
                ...bug,
                tags: JSON.parse(bug.tags || '[]'),
                attachments: JSON.parse(bug.attachments || '[]')
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };

    } catch (error) {
        console.error('버그 목록 조회 실패:', error);
        throw error;
    }
}

/**
 * 버그 수정
 */
export async function updateBug(bugId, updateData, userId) {
    const allowedFields = [
        'title', 'description', 'severity', 'priority', 'category',
        'environment', 'browser', 'os', 'steps_to_reproduce',
        'expected_result', 'actual_result', 'tags', 'attachments'
    ];

    const updates = [];
    const params = [];

    for (const [field, value] of Object.entries(updateData)) {
        if (allowedFields.includes(field)) {
            updates.push(`${field} = ?`);
            params.push(typeof value === 'object' ? JSON.stringify(value) : value);
        }
    }

    if (updates.length === 0) {
        throw new Error('수정할 필드가 없습니다.');
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(bugId);

    try {
        await query(`
      UPDATE bugs 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params);

        // 히스토리 기록
        for (const [field, value] of Object.entries(updateData)) {
            if (allowedFields.includes(field)) {
                await recordBugHistory(bugId, field, null, value, userId);
            }
        }

        return await getBug(bugId);

    } catch (error) {
        console.error('버그 수정 실패:', error);
        throw error;
    }
}

/**
 * 버그 상태 변경
 */
export async function updateBugStatus(bugId, newStatus, userId, comment = '') {
    const validStatuses = Object.values(STATUS);

    if (!validStatuses.includes(newStatus)) {
        throw new Error('유효하지 않은 상태입니다.');
    }

    try {
        // 현재 상태 조회
        const currentBug = await getBug(bugId);
        const oldStatus = currentBug.status;

        // 상태 업데이트
        await query(`
      UPDATE bugs 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newStatus, bugId]);

        // 해결/완료 시간 기록
        if (newStatus === STATUS.RESOLVED) {
            await query(`
        UPDATE bugs 
        SET resolved_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [bugId]);
        } else if (newStatus === STATUS.CLOSED) {
            await query(`
        UPDATE bugs 
        SET closed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [bugId]);
        }

        // 히스토리 기록
        await recordBugHistory(bugId, 'status', oldStatus, newStatus, userId);

        // 댓글 추가
        if (comment) {
            await addBugComment(bugId, comment, userId, true);
        }

        // 알림 전송
        await sendBugNotification(bugId, 'status_changed');

        return await getBug(bugId);

    } catch (error) {
        console.error('버그 상태 변경 실패:', error);
        throw error;
    }
}

/**
 * 버그 할당
 */
export async function assignBug(bugId, assigneeId, userId) {
    try {
        // 현재 담당자 조회
        const currentBug = await getBug(bugId);
        const oldAssigneeId = currentBug.assignee_id;

        // 담당자 업데이트
        await query(`
      UPDATE bugs 
      SET assignee_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [assigneeId, STATUS.ASSIGNED, bugId]);

        // 히스토리 기록
        await recordBugHistory(bugId, 'assignee_id', oldAssigneeId, assigneeId, userId);
        await recordBugHistory(bugId, 'status', currentBug.status, STATUS.ASSIGNED, userId);

        // 알림 전송
        await sendBugNotification(bugId, 'assigned');

        return await getBug(bugId);

    } catch (error) {
        console.error('버그 할당 실패:', error);
        throw error;
    }
}

/**
 * 버그 댓글 추가
 */
export async function addBugComment(bugId, comment, userId, isInternal = false) {
    try {
        await query(`
      INSERT INTO bug_comments (bug_id, user_id, comment, is_internal)
      VALUES (?, ?, ?, ?)
    `, [bugId, userId, comment, isInternal]);

        // 알림 전송 (내부 댓글이 아닌 경우)
        if (!isInternal) {
            await sendBugNotification(bugId, 'comment_added');
        }

        return { success: true };

    } catch (error) {
        console.error('댓글 추가 실패:', error);
        throw error;
    }
}

/**
 * 버그 댓글 조회
 */
export async function getBugComments(bugId, includeInternal = false) {
    try {
        let whereClause = 'WHERE bug_id = ?';
        const params = [bugId];

        if (!includeInternal) {
            whereClause += ' AND is_internal = FALSE';
        }

        const comments = await query(`
      SELECT 
        c.*,
        u.username,
        u.email
      FROM bug_comments c
      LEFT JOIN users u ON c.user_id = u.id
      ${whereClause}
      ORDER BY c.created_at ASC
    `, params);

        return comments;

    } catch (error) {
        console.error('댓글 조회 실패:', error);
        throw error;
    }
}

/**
 * 버그 히스토리 조회
 */
export async function getBugHistory(bugId) {
    try {
        const history = await query(`
      SELECT 
        h.*,
        u.username as changed_by_name
      FROM bug_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.bug_id = ?
      ORDER BY h.changed_at ASC
    `, [bugId]);

        return history;

    } catch (error) {
        console.error('히스토리 조회 실패:', error);
        throw error;
    }
}

/**
 * 버그 통계 조회
 */
export async function getBugStats(timeRange = '7d') {
    const timeFilter = getTimeFilter(timeRange);

    try {
        const stats = await query(`
      SELECT 
        severity,
        status,
        COUNT(*) as count,
        AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) as avg_resolution_time
      FROM bugs 
      WHERE created_at >= ?
      GROUP BY severity, status
    `, [timeFilter]);

        const total = stats.reduce((sum, row) => sum + row.count, 0);
        const resolved = stats.filter(row => row.status === STATUS.RESOLVED).reduce((sum, row) => sum + row.count, 0);
        const avgResolutionTime = stats
            .filter(row => row.avg_resolution_time)
            .reduce((sum, row) => sum + row.avg_resolution_time, 0) / stats.length || 0;

        return {
            total,
            resolved,
            open: total - resolved,
            resolutionRate: total > 0 ? (resolved / total * 100).toFixed(1) : 0,
            avgResolutionTime: Math.round(avgResolutionTime),
            bySeverity: groupBy(stats, 'severity'),
            byStatus: groupBy(stats, 'status')
        };

    } catch (error) {
        console.error('통계 조회 실패:', error);
        throw error;
    }
}

/**
 * 우선순위 계산
 */
function calculatePriority(severity, category) {
    const severityWeight = {
        [SEVERITY.CRITICAL]: 4,
        [SEVERITY.HIGH]: 3,
        [SEVERITY.MEDIUM]: 2,
        [SEVERITY.LOW]: 1
    };

    const categoryWeight = {
        [CATEGORY.SECURITY]: 4,
        [CATEGORY.PERFORMANCE]: 3,
        [CATEGORY.BACKEND]: 2,
        [CATEGORY.FRONTEND]: 2,
        [CATEGORY.DATABASE]: 2,
        [CATEGORY.INTEGRATION]: 1,
        [CATEGORY.INFRASTRUCTURE]: 1
    };

    const priority = severityWeight[severity] * categoryWeight[category];
    return Math.min(priority, 4);
}

/**
 * 자동 태그 생성
 */
function generateAutoTags(title, description, category) {
    const tags = [category.toLowerCase()];

    const text = `${title} ${description}`.toLowerCase();

    const keywordTags = {
        'login': 'authentication',
        'password': 'authentication',
        'error': 'error-handling',
        'slow': 'performance',
        'crash': 'stability',
        'mobile': 'mobile',
        'desktop': 'desktop',
        'api': 'api',
        'database': 'database',
        'ui': 'ui',
        'ux': 'ux',
        'memory': 'memory',
        'cpu': 'cpu',
        'network': 'network'
    };

    for (const [keyword, tag] of Object.entries(keywordTags)) {
        if (text.includes(keyword)) {
            tags.push(tag);
        }
    }

    return [...new Set(tags)];
}

/**
 * 예상 해결 시간 계산
 */
function calculateEstimatedHours(severity, category) {
    const baseHours = {
        [SEVERITY.CRITICAL]: 8,
        [SEVERITY.HIGH]: 4,
        [SEVERITY.MEDIUM]: 2,
        [SEVERITY.LOW]: 1
    };

    const categoryMultiplier = {
        [CATEGORY.SECURITY]: 1.5,
        [CATEGORY.PERFORMANCE]: 1.3,
        [CATEGORY.BACKEND]: 1.0,
        [CATEGORY.FRONTEND]: 0.8,
        [CATEGORY.DATABASE]: 1.2,
        [CATEGORY.INTEGRATION]: 1.1,
        [CATEGORY.INFRASTRUCTURE]: 1.4
    };

    return baseHours[severity] * categoryMultiplier[category];
}

/**
 * 자동 담당자 할당
 */
async function getAutoAssignee(category, severity) {
    try {
        // 카테고리별 전문가 매핑
        const categoryExperts = {
            [CATEGORY.FRONTEND]: 'frontend_team',
            [CATEGORY.BACKEND]: 'backend_team',
            [CATEGORY.DATABASE]: 'database_team',
            [CATEGORY.PERFORMANCE]: 'performance_team',
            [CATEGORY.SECURITY]: 'security_team',
            [CATEGORY.INTEGRATION]: 'integration_team',
            [CATEGORY.INFRASTRUCTURE]: 'infrastructure_team'
        };

        const team = categoryExperts[category];
        if (!team) return null;

        // 팀 내에서 현재 작업량이 적은 담당자 선택
        const assignees = await query(`
      SELECT 
        u.id,
        COUNT(b.id) as current_bugs
      FROM users u
      LEFT JOIN bugs b ON u.id = b.assignee_id AND b.status IN ('New', 'Assigned', 'In Progress')
      WHERE u.role = ?
      GROUP BY u.id
      ORDER BY current_bugs ASC
      LIMIT 1
    `, [team]);

        return assignees.length > 0 ? assignees[0].id : null;

    } catch (error) {
        console.error('자동 담당자 할당 실패:', error);
        return null;
    }
}

/**
 * 히스토리 기록
 */
async function recordBugHistory(bugId, fieldName, oldValue, newValue, changedBy) {
    try {
        await query(`
      INSERT INTO bug_history (bug_id, field_name, old_value, new_value, changed_by)
      VALUES (?, ?, ?, ?, ?)
    `, [bugId, fieldName, oldValue, newValue, changedBy]);

    } catch (error) {
        console.error('히스토리 기록 실패:', error);
    }
}

/**
 * 버그 알림 전송
 */
async function sendBugNotification(bugId, action) {
    try {
        const bug = await getBug(bugId);

        const notifications = {
            created: {
                title: `새 버그 보고됨: ${bug.title}`,
                message: `심각도: ${bug.severity}, 우선순위: ${bug.priority}, 카테고리: ${bug.category}`,
                color: getSeverityColor(bug.severity)
            },
            assigned: {
                title: `버그 할당됨: ${bug.title}`,
                message: `담당자: ${bug.assignee_name || '미할당'}`,
                color: 'info'
            },
            status_changed: {
                title: `버그 상태 변경: ${bug.title}`,
                message: `새 상태: ${bug.status}`,
                color: getStatusColor(bug.status)
            },
            comment_added: {
                title: `댓글 추가됨: ${bug.title}`,
                message: `새 댓글이 추가되었습니다.`,
                color: 'info'
            }
        };

        const notification = notifications[action];
        if (notification) {
            // Slack 알림
            await sendSlackNotification({
                text: notification.title,
                attachments: [{
                    color: notification.color,
                    fields: [{
                        title: '설명',
                        value: notification.message,
                        short: false
                    }]
                }]
            });
        }

    } catch (error) {
        console.error('알림 전송 실패:', error);
    }
}

/**
 * 심각도별 색상
 */
function getSeverityColor(severity) {
    const colors = {
        [SEVERITY.CRITICAL]: 'danger',
        [SEVERITY.HIGH]: 'warning',
        [SEVERITY.MEDIUM]: 'info',
        [SEVERITY.LOW]: 'good'
    };
    return colors[severity] || 'info';
}

/**
 * 상태별 색상
 */
function getStatusColor(status) {
    const colors = {
        [STATUS.NEW]: 'info',
        [STATUS.ASSIGNED]: 'warning',
        [STATUS.IN_PROGRESS]: 'warning',
        [STATUS.TESTING]: 'info',
        [STATUS.RESOLVED]: 'good',
        [STATUS.CLOSED]: 'good',
        [STATUS.REOPENED]: 'warning',
        [STATUS.DUPLICATE]: 'info',
        [STATUS.WONT_FIX]: 'danger'
    };
    return colors[status] || 'info';
}

/**
 * 시간 필터 생성
 */
function getTimeFilter(timeRange) {
    const now = new Date();
    const ranges = {
        '1d': new Date(now.getTime() - 24 * 60 * 60 * 1000),
        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    };

    return ranges[timeRange] || ranges['7d'];
}

/**
 * 배열 그룹화
 */
function groupBy(array, key) {
    return array.reduce((groups, item) => {
        const group = item[key];
        groups[group] = groups[group] || [];
        groups[group].push(item);
        return groups;
    }, {});
}

export default {
    createBug,
    getBug,
    getBugs,
    updateBug,
    updateBugStatus,
    assignBug,
    addBugComment,
    getBugComments,
    getBugHistory,
    getBugStats,
    SEVERITY,
    STATUS,
    CATEGORY
};

