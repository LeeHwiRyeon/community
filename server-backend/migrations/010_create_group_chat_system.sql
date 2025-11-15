-- Migration 010: Group Chat System
-- Created: 2025-11-11
-- Description: 그룹 채팅 시스템을 위한 테이블 생성

-- 1. 그룹 채팅방 테이블
CREATE TABLE IF NOT EXISTS group_chats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    avatar_url VARCHAR(255),
    owner_id BIGINT NOT NULL,
    max_members INT DEFAULT 100,
    is_private BOOLEAN DEFAULT FALSE,
    invite_code VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_owner (owner_id),
    INDEX idx_private (is_private),
    INDEX idx_invite_code (invite_code),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 그룹 멤버 테이블
CREATE TABLE IF NOT EXISTS group_members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role ENUM('admin', 'moderator', 'member') DEFAULT 'member',
    nickname VARCHAR(50),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP NULL,
    is_muted BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    banned_until TIMESTAMP NULL,
    
    FOREIGN KEY (group_id) REFERENCES group_chats(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_group_member (group_id, user_id),
    INDEX idx_group (group_id),
    INDEX idx_user (user_id),
    INDEX idx_role (role),
    INDEX idx_joined (joined_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 그룹 메시지 테이블
CREATE TABLE IF NOT EXISTS group_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    message_type ENUM('text', 'image', 'file', 'system') DEFAULT 'text',
    file_url VARCHAR(255),
    file_name VARCHAR(255),
    file_size INT,
    reply_to BIGINT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (group_id) REFERENCES group_chats(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to) REFERENCES group_messages(id) ON DELETE SET NULL,
    INDEX idx_group (group_id),
    INDEX idx_user (user_id),
    INDEX idx_created (created_at),
    INDEX idx_reply (reply_to),
    INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 그룹 메시지 읽음 상태 테이블
CREATE TABLE IF NOT EXISTS group_message_reads (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (message_id) REFERENCES group_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_message_read (message_id, user_id),
    INDEX idx_message (message_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 그룹 초대 테이블
CREATE TABLE IF NOT EXISTS group_invitations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT NOT NULL,
    inviter_id BIGINT NOT NULL,
    invitee_id BIGINT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected', 'expired') DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    responded_at TIMESTAMP NULL,
    
    FOREIGN KEY (group_id) REFERENCES group_chats(id) ON DELETE CASCADE,
    FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invitee_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_pending_invite (group_id, invitee_id, status),
    INDEX idx_group (group_id),
    INDEX idx_invitee (invitee_id),
    INDEX idx_status (status),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 그룹 설정 테이블
CREATE TABLE IF NOT EXISTS group_settings (
    group_id BIGINT PRIMARY KEY,
    allow_member_invite BOOLEAN DEFAULT TRUE,
    require_approval BOOLEAN DEFAULT FALSE,
    message_retention_days INT DEFAULT 0, -- 0 = unlimited
    max_message_length INT DEFAULT 5000,
    allow_file_upload BOOLEAN DEFAULT TRUE,
    allowed_file_types VARCHAR(255) DEFAULT 'image,video,document',
    max_file_size_mb INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (group_id) REFERENCES group_chats(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 그룹 통계 뷰
CREATE OR REPLACE VIEW group_stats AS
SELECT 
    gc.id as group_id,
    gc.name,
    COUNT(DISTINCT gm.user_id) as member_count,
    COUNT(DISTINCT gmsg.id) as message_count,
    MAX(gmsg.created_at) as last_message_at,
    gc.created_at
FROM group_chats gc
LEFT JOIN group_members gm ON gc.id = gm.group_id AND gm.is_banned = FALSE
LEFT JOIN group_messages gmsg ON gc.id = gmsg.group_id AND gmsg.deleted_at IS NULL
WHERE gc.deleted_at IS NULL
GROUP BY gc.id, gc.name, gc.created_at;
