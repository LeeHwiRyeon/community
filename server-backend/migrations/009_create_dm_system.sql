-- DM (Direct Message) System Database Schema
-- 작성일: 2025년 11월 11일

-- 1. dm_conversations 테이블 (대화방)
CREATE TABLE IF NOT EXISTS dm_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant1_id BIGINT NOT NULL,
    participant2_id BIGINT NOT NULL,
    last_message_id INT DEFAULT NULL,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_participant1 (participant1_id),
    INDEX idx_participant2 (participant2_id),
    INDEX idx_participants (participant1_id, participant2_id),
    INDEX idx_last_message (last_message_at DESC),
    
    -- Foreign Keys
    FOREIGN KEY (participant1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (participant2_id) REFERENCES users(id) ON DELETE CASCADE
    
    -- Note: Unique constraint for conversation pairs handled at application level
    -- MariaDB LEAST/GREATEST in UNIQUE KEY not supported in all versions
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create index for finding conversations
CREATE INDEX idx_conversation_pair ON dm_conversations(participant1_id, participant2_id);

-- 2. direct_messages 테이블 (메시지)
CREATE TABLE IF NOT EXISTS direct_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    message_type ENUM('text', 'image', 'file', 'system') DEFAULT 'text',
    
    -- 첨부파일 정보
    attachment_url VARCHAR(500) DEFAULT NULL,
    attachment_name VARCHAR(255) DEFAULT NULL,
    attachment_size INT DEFAULT NULL,
    attachment_type VARCHAR(100) DEFAULT NULL,
    
    -- 상태 정보
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL DEFAULT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    deleted_by BIGINT DEFAULT NULL,
    
    -- 메타데이터
    reply_to_id INT DEFAULT NULL,
    edited_at TIMESTAMP NULL DEFAULT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_conversation (conversation_id, created_at DESC),
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_read_status (receiver_id, is_read),
    INDEX idx_deleted (is_deleted),
    FULLTEXT INDEX ft_content (content),
    
    -- Foreign Keys
    FOREIGN KEY (conversation_id) REFERENCES dm_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_id) REFERENCES direct_messages(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 완료 메시지
SELECT 'DM System Database Schema Created Successfully!' as status;
