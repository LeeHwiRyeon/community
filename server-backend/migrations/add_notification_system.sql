-- =====================================================
-- Phase 3: 실시간 알림 시스템 마이그레이션
-- 파일: add_notification_system.sql
-- 작성일: 2025-11-12
-- =====================================================

USE community;

-- =====================================================
-- 1. 알림 타입 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type_name VARCHAR(50) UNIQUE NOT NULL COMMENT '알림 타입 이름',
  description VARCHAR(255) COMMENT '알림 설명',
  icon VARCHAR(50) COMMENT 'Material Icons 아이콘 이름',
  color VARCHAR(20) DEFAULT 'blue' COMMENT '알림 색상',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_type_name (type_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='알림 타입 정의';

-- 기본 알림 타입 데이터
INSERT INTO notification_types (type_name, description, icon, color) VALUES
('new_follower', '새로운 팔로워', 'person_add', 'blue'),
('new_comment', '새 댓글', 'comment', 'green'),
('comment_reply', '댓글 답글', 'reply', 'green'),
('post_like', '게시물 좋아요', 'thumb_up', 'red'),
('comment_like', '댓글 좋아요', 'thumb_up', 'red'),
('mention', '멘션', 'alternate_email', 'purple'),
('moderator_warning', '모더레이터 경고', 'warning', 'orange'),
('moderator_ban', '차단 알림', 'block', 'red'),
('moderator_action', '모더레이터 조치', 'gavel', 'orange'),
('system', '시스템 알림', 'notifications', 'gray'),
('board_follow', '팔로우한 게시판 새 글', 'article', 'blue'),
('user_follow', '팔로우한 사용자 새 글', 'person', 'blue'),
('bookmark', '북마크 관련', 'bookmark', 'yellow');

-- =====================================================
-- 2. 알림 메인 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '수신자 ID',
  type_id INT NOT NULL COMMENT '알림 타입 ID',
  
  -- 알림 내용
  title VARCHAR(255) NOT NULL COMMENT '알림 제목',
  message TEXT COMMENT '알림 메시지',
  link VARCHAR(500) COMMENT '알림 클릭 시 이동할 링크',
  
  -- 발신자 정보 (비정규화 - 성능 최적화)
  sender_id INT COMMENT '발신자 ID',
  sender_name VARCHAR(100) COMMENT '발신자 이름 (스냅샷)',
  sender_avatar VARCHAR(500) COMMENT '발신자 아바타 (스냅샷)',
  
  -- 상태 관리
  is_read BOOLEAN DEFAULT FALSE COMMENT '읽음 여부',
  is_deleted BOOLEAN DEFAULT FALSE COMMENT '삭제 여부',
  
  -- 메타데이터 (JSON)
  metadata JSON COMMENT '추가 데이터 (게시물 ID, 댓글 ID 등)',
  
  -- 타임스탬프
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
  read_at TIMESTAMP NULL COMMENT '읽은 시간',
  
  -- 인덱스
  INDEX idx_user_created (user_id, created_at DESC),
  INDEX idx_user_unread (user_id, is_read, is_deleted, created_at DESC),
  INDEX idx_type (type_id),
  INDEX idx_sender (sender_id),
  
  -- 외래 키
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (type_id) REFERENCES notification_types(id),
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사용자 알림'
PARTITION BY RANGE (YEAR(created_at)) (
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p2026 VALUES LESS THAN (2027),
  PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- =====================================================
-- 3. 알림 설정 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL COMMENT '사용자 ID',
  
  -- 전역 설정
  email_enabled BOOLEAN DEFAULT TRUE COMMENT '이메일 알림',
  push_enabled BOOLEAN DEFAULT TRUE COMMENT '푸시 알림',
  sound_enabled BOOLEAN DEFAULT TRUE COMMENT '알림 소리',
  
  -- 타입별 활성화
  new_follower_enabled BOOLEAN DEFAULT TRUE,
  new_comment_enabled BOOLEAN DEFAULT TRUE,
  comment_reply_enabled BOOLEAN DEFAULT TRUE,
  post_like_enabled BOOLEAN DEFAULT TRUE,
  comment_like_enabled BOOLEAN DEFAULT TRUE,
  mention_enabled BOOLEAN DEFAULT TRUE,
  moderator_warning_enabled BOOLEAN DEFAULT TRUE,
  moderator_ban_enabled BOOLEAN DEFAULT TRUE,
  moderator_action_enabled BOOLEAN DEFAULT TRUE,
  system_enabled BOOLEAN DEFAULT TRUE,
  board_follow_enabled BOOLEAN DEFAULT TRUE,
  user_follow_enabled BOOLEAN DEFAULT TRUE,
  bookmark_enabled BOOLEAN DEFAULT TRUE,
  
  -- 조용한 시간 (Do Not Disturb)
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME DEFAULT '22:00:00' COMMENT '조용한 시간 시작',
  quiet_hours_end TIME DEFAULT '08:00:00' COMMENT '조용한 시간 종료',
  
  -- 타임스탬프
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- 외래 키
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사용자별 알림 설정';

-- =====================================================
-- 4. 알림 배치 (대량 알림용)
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_batches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  batch_name VARCHAR(255) NOT NULL COMMENT '배치 이름',
  type_id INT NOT NULL COMMENT '알림 타입',
  
  -- 타겟팅
  target_type ENUM('all', 'followers', 'custom') DEFAULT 'all' COMMENT '대상 타입',
  target_user_ids JSON COMMENT '대상 사용자 ID 목록 (custom인 경우)',
  
  -- 알림 내용
  title VARCHAR(255) NOT NULL,
  message TEXT,
  link VARCHAR(500),
  metadata JSON,
  
  -- 발송 상태
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  total_recipients INT DEFAULT 0 COMMENT '총 수신자 수',
  sent_count INT DEFAULT 0 COMMENT '발송 완료 수',
  
  -- 스케줄링
  scheduled_at TIMESTAMP NULL COMMENT '예약 시간',
  started_at TIMESTAMP NULL COMMENT '발송 시작 시간',
  completed_at TIMESTAMP NULL COMMENT '발송 완료 시간',
  
  created_by INT NOT NULL COMMENT '생성자 (관리자)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_status (status),
  INDEX idx_scheduled (scheduled_at),
  FOREIGN KEY (type_id) REFERENCES notification_types(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='대량 알림 배치';

-- =====================================================
-- 5. 뷰: 알림 통계
-- =====================================================

CREATE OR REPLACE VIEW v_notification_stats AS
SELECT 
  user_id,
  COUNT(*) as total_notifications,
  SUM(CASE WHEN is_read = FALSE AND is_deleted = FALSE THEN 1 ELSE 0 END) as unread_count,
  SUM(CASE WHEN is_deleted = TRUE THEN 1 ELSE 0 END) as deleted_count,
  MAX(CASE WHEN is_read = FALSE THEN created_at END) as latest_unread_at,
  MAX(created_at) as last_notification_at
FROM notifications
GROUP BY user_id;

-- =====================================================
-- 6. 뷰: 최근 알림 (상세 정보)
-- =====================================================

CREATE OR REPLACE VIEW v_recent_notifications AS
SELECT 
  n.id,
  n.user_id,
  n.title,
  n.message,
  n.link,
  n.is_read,
  n.created_at,
  n.read_at,
  
  -- 알림 타입
  nt.type_name,
  nt.icon,
  nt.color,
  
  -- 발신자 정보
  n.sender_id,
  COALESCE(n.sender_name, u.username) as sender_name,
  COALESCE(n.sender_avatar, u.avatar_url) as sender_avatar,
  
  -- 메타데이터
  n.metadata
FROM notifications n
JOIN notification_types nt ON n.type_id = nt.id
LEFT JOIN users u ON n.sender_id = u.id
WHERE n.is_deleted = FALSE
ORDER BY n.created_at DESC;

-- =====================================================
-- 7. 뷰: 타입별 알림 통계
-- =====================================================

CREATE OR REPLACE VIEW v_notification_type_stats AS
SELECT 
  nt.type_name,
  nt.description,
  nt.icon,
  nt.color,
  COUNT(n.id) as total_count,
  COUNT(CASE WHEN n.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as last_24h_count,
  COUNT(CASE WHEN n.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as last_7d_count,
  AVG(TIMESTAMPDIFF(MINUTE, n.created_at, n.read_at)) as avg_read_time_minutes
FROM notification_types nt
LEFT JOIN notifications n ON nt.id = n.type_id
GROUP BY nt.id, nt.type_name, nt.description, nt.icon, nt.color;

-- =====================================================
-- 8. 트리거: 알림 생성 시 자동 처리
-- =====================================================

DELIMITER $$

CREATE TRIGGER tr_notification_after_insert
AFTER INSERT ON notifications
FOR EACH ROW
BEGIN
  -- 발신자 정보가 없으면 자동으로 채우기
  IF NEW.sender_id IS NOT NULL AND NEW.sender_name IS NULL THEN
    UPDATE notifications n
    JOIN users u ON u.id = NEW.sender_id
    SET 
      n.sender_name = u.username,
      n.sender_avatar = u.avatar_url
    WHERE n.id = NEW.id;
  END IF;
END$$

DELIMITER ;

-- =====================================================
-- 9. 저장 프로시저: 알림 생성 헬퍼
-- =====================================================

DELIMITER $$

CREATE PROCEDURE sp_create_notification(
  IN p_user_id INT,
  IN p_type_name VARCHAR(50),
  IN p_title VARCHAR(255),
  IN p_message TEXT,
  IN p_link VARCHAR(500),
  IN p_sender_id INT,
  IN p_metadata JSON
)
BEGIN
  DECLARE v_type_id INT;
  
  -- 타입 ID 조회
  SELECT id INTO v_type_id FROM notification_types WHERE type_name = p_type_name;
  
  -- 알림 생성
  INSERT INTO notifications (
    user_id, type_id, title, message, link, sender_id, metadata
  ) VALUES (
    p_user_id, v_type_id, p_title, p_message, p_link, p_sender_id, p_metadata
  );
  
  SELECT LAST_INSERT_ID() as notification_id;
END$$

DELIMITER ;

-- =====================================================
-- 10. 저장 프로시저: 오래된 알림 정리
-- =====================================================

DELIMITER $$

CREATE PROCEDURE sp_cleanup_old_notifications(
  IN p_days_to_keep INT
)
BEGIN
  DECLARE v_deleted_count INT;
  
  -- 삭제된 알림 중 오래된 것 물리 삭제
  DELETE FROM notifications
  WHERE is_deleted = TRUE 
    AND created_at < DATE_SUB(NOW(), INTERVAL p_days_to_keep DAY);
  
  SET v_deleted_count = ROW_COUNT();
  
  SELECT v_deleted_count as deleted_count;
END$$

DELIMITER ;

-- =====================================================
-- 11. 이벤트: 자동 정리 (매일 자정 실행)
-- =====================================================

-- 이벤트 스케줄러 활성화
SET GLOBAL event_scheduler = ON;

CREATE EVENT IF NOT EXISTS evt_cleanup_notifications
ON SCHEDULE EVERY 1 DAY
STARTS TIMESTAMP(CURRENT_DATE, '00:00:00')
DO
  CALL sp_cleanup_old_notifications(90);  -- 90일 이상 된 삭제 알림 제거

-- =====================================================
-- 12. 샘플 데이터 (개발용)
-- =====================================================

-- 테스트용 알림 설정 생성 (모든 사용자)
INSERT IGNORE INTO notification_settings (user_id)
SELECT id FROM users;

-- =====================================================
-- 마이그레이션 완료
-- =====================================================

SELECT 'Phase 3: 실시간 알림 시스템 마이그레이션 완료!' as message;
SELECT '- notification_types: 13개 타입' as info;
SELECT '- notifications: 메인 테이블 (파티션)' as info;
SELECT '- notification_settings: 사용자 설정' as info;
SELECT '- notification_batches: 대량 알림' as info;
SELECT '- 3개 뷰, 1개 트리거, 2개 프로시저, 1개 이벤트' as info;
