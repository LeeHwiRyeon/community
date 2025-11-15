-- 모더레이터 권한 테이블
CREATE TABLE IF NOT EXISTS moderator_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    board_id INT NULL COMMENT '특정 게시판 모더레이터 (NULL이면 전체)',
    role VARCHAR(50) NOT NULL DEFAULT 'moderator' COMMENT 'moderator, admin, super_admin',
    permissions JSON COMMENT '권한 목록 (배열)',
    assigned_by INT NOT NULL COMMENT '임명한 관리자',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL COMMENT '권한 만료일',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_board_id (board_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='모더레이터 권한 관리';

-- 사용자 경고 테이블
CREATE TABLE IF NOT EXISTS user_warnings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '경고받은 사용자',
    moderator_id INT NOT NULL COMMENT '경고한 모더레이터',
    reason VARCHAR(500) NOT NULL COMMENT '경고 사유',
    severity VARCHAR(20) NOT NULL DEFAULT 'low' COMMENT 'low, medium, high, critical',
    post_id INT NULL COMMENT '관련 게시물 (있는 경우)',
    comment_id INT NULL COMMENT '관련 댓글 (있는 경우)',
    expires_at TIMESTAMP NULL COMMENT '경고 만료일',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 경고 기록';

-- 사용자 차단/밴 테이블
CREATE TABLE IF NOT EXISTS user_bans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '차단된 사용자',
    moderator_id INT NOT NULL COMMENT '차단한 모더레이터',
    ban_type VARCHAR(20) NOT NULL DEFAULT 'temporary' COMMENT 'temporary, permanent, shadow',
    reason TEXT NOT NULL COMMENT '차단 사유',
    board_id INT NULL COMMENT '특정 게시판 차단 (NULL이면 전체)',
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL COMMENT '차단 종료 시간 (영구차단은 NULL)',
    is_active BOOLEAN DEFAULT TRUE,
    appeal_count INT DEFAULT 0 COMMENT '이의신청 횟수',
    last_appeal_at TIMESTAMP NULL COMMENT '마지막 이의신청 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_active (is_active),
    INDEX idx_end_time (end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 차단 기록';

-- 콘텐츠 신고 테이블
CREATE TABLE IF NOT EXISTS content_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id INT NOT NULL COMMENT '신고자',
    reported_user_id INT NOT NULL COMMENT '신고된 사용자',
    content_type VARCHAR(20) NOT NULL COMMENT 'post, comment, message, user',
    content_id INT NOT NULL COMMENT '신고된 콘텐츠 ID',
    reason VARCHAR(50) NOT NULL COMMENT '신고 사유 (spam, harassment, inappropriate, etc.)',
    description TEXT COMMENT '상세 설명',
    status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending, reviewing, resolved, rejected',
    priority VARCHAR(20) DEFAULT 'normal' COMMENT 'low, normal, high, urgent',
    assigned_moderator_id INT NULL COMMENT '담당 모더레이터',
    resolution_action VARCHAR(50) NULL COMMENT '처리 결과 (warning, content_removed, user_banned, etc.)',
    resolution_note TEXT NULL COMMENT '처리 상세',
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_moderator_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_content_type_id (content_type, content_id),
    INDEX idx_reporter_id (reporter_id),
    INDEX idx_reported_user_id (reported_user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='콘텐츠 신고';

-- 모더레이터 활동 로그
CREATE TABLE IF NOT EXISTS moderator_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moderator_id INT NOT NULL,
    action_type VARCHAR(50) NOT NULL COMMENT 'warn, ban, unban, delete_post, delete_comment, etc.',
    target_type VARCHAR(20) NOT NULL COMMENT 'user, post, comment',
    target_id INT NOT NULL,
    reason TEXT,
    details JSON COMMENT '추가 상세 정보',
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_moderator_id (moderator_id),
    INDEX idx_action_type (action_type),
    INDEX idx_target_type_id (target_type, target_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='모더레이터 활동 로그';

-- 모더레이터 통계 뷰
CREATE OR REPLACE VIEW moderator_statistics AS
SELECT 
    m.user_id,
    u.username,
    u.display_name,
    COUNT(DISTINCT ma.id) as total_actions,
    COUNT(DISTINCT CASE WHEN ma.action_type = 'warn' THEN ma.id END) as warnings_issued,
    COUNT(DISTINCT CASE WHEN ma.action_type = 'ban' THEN ma.id END) as bans_issued,
    COUNT(DISTINCT CASE WHEN ma.action_type LIKE 'delete_%' THEN ma.id END) as content_removed,
    COUNT(DISTINCT CASE WHEN cr.status = 'resolved' THEN cr.id END) as reports_resolved,
    MAX(ma.created_at) as last_action_at
FROM moderator_roles m
INNER JOIN users u ON m.user_id = u.id
LEFT JOIN moderator_actions ma ON m.user_id = ma.moderator_id
LEFT JOIN content_reports cr ON m.user_id = cr.assigned_moderator_id
WHERE m.is_active = TRUE
GROUP BY m.user_id, u.username, u.display_name;

-- 미처리 신고 통계 뷰
CREATE OR REPLACE VIEW pending_reports_summary AS
SELECT 
    status,
    priority,
    content_type,
    COUNT(*) as count,
    MIN(created_at) as oldest_report,
    MAX(created_at) as newest_report
FROM content_reports
WHERE status IN ('pending', 'reviewing')
GROUP BY status, priority, content_type;
