/**
 * 암호화된 메시지 테이블 마이그레이션
 * 
 * @description
 * 엔드-투-엔드 암호화(E2EE) 메시지를 저장하기 위한 테이블 생성
 * - AES-256-GCM 암호화된 메시지 저장
 * - ECDH P-256 키 교환 메타데이터
 * - 암호화 버전 관리
 */

import { query } from '../db.js';
import logger from '../logger.js';

/**
 * 마이그레이션 UP
 * encrypted_messages 테이블 생성
 */
export async function up() {
    logger.info('🔧 [Migration] Creating encrypted_messages table...');

    try {
        // 1. encrypted_messages 테이블 생성
        await query(`
            CREATE TABLE IF NOT EXISTS encrypted_messages (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                
                -- 메시지 관계
                message_id BIGINT NOT NULL COMMENT '원본 메시지 ID (chat_messages.id)',
                room_id VARCHAR(100) NOT NULL COMMENT '채팅방 ID',
                sender_id BIGINT NOT NULL COMMENT '발신자 ID',
                recipient_id BIGINT NULL COMMENT '수신자 ID (DM의 경우)',
                
                -- 암호화 데이터
                encrypted_content TEXT NOT NULL COMMENT 'AES-GCM 암호화된 메시지 (Base64)',
                iv VARCHAR(32) NOT NULL COMMENT 'Initialization Vector (Base64)',
                auth_tag VARCHAR(32) NOT NULL COMMENT 'Authentication Tag (Base64)',
                
                -- 키 교환 메타데이터
                sender_public_key TEXT NOT NULL COMMENT '발신자 ECDH 공개키 (Base64)',
                encryption_version VARCHAR(10) DEFAULT 'v1' COMMENT '암호화 버전',
                key_algorithm VARCHAR(20) DEFAULT 'ECDH-P256' COMMENT '키 교환 알고리즘',
                encryption_algorithm VARCHAR(20) DEFAULT 'AES-256-GCM' COMMENT '암호화 알고리즘',
                
                -- 메타데이터
                is_deleted TINYINT(1) DEFAULT 0 COMMENT '삭제 여부',
                deleted_at TIMESTAMP NULL COMMENT '삭제 시간',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
                
                -- 인덱스
                INDEX idx_message_id (message_id),
                INDEX idx_room_sender (room_id, sender_id),
                INDEX idx_sender_time (sender_id, created_at),
                INDEX idx_recipient_time (recipient_id, created_at),
                INDEX idx_encryption_version (encryption_version)
                
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='엔드-투-엔드 암호화 메시지 저장소';
        `);

        logger.info('✅ [Migration] encrypted_messages table created successfully');

        // 2. user_encryption_keys 테이블 생성 (사용자 공개키 저장)
        await query(`
            CREATE TABLE IF NOT EXISTS user_encryption_keys (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                
                -- 사용자 정보
                user_id BIGINT NOT NULL UNIQUE COMMENT '사용자 ID',
                
                -- 키 정보
                public_key TEXT NOT NULL COMMENT 'ECDH 공개키 (Base64)',
                key_algorithm VARCHAR(20) DEFAULT 'ECDH-P256' COMMENT '키 알고리즘',
                key_version VARCHAR(10) DEFAULT 'v1' COMMENT '키 버전',
                
                -- 키 상태
                is_active TINYINT(1) DEFAULT 1 COMMENT '활성 여부',
                expires_at TIMESTAMP NULL COMMENT '만료 시간',
                
                -- 메타데이터
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
                
                -- 인덱스
                INDEX idx_user_active (user_id, is_active),
                INDEX idx_key_version (key_version)
                
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='사용자 암호화 공개키 저장소';
        `);

        logger.info('✅ [Migration] user_encryption_keys table created successfully');

        // 3. encryption_audit_log 테이블 생성 (암호화 작업 감사 로그)
        await query(`
            CREATE TABLE IF NOT EXISTS encryption_audit_log (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                
                -- 작업 정보
                user_id BIGINT NOT NULL COMMENT '사용자 ID',
                action VARCHAR(50) NOT NULL COMMENT '작업 유형 (encrypt, decrypt, key_exchange)',
                resource_type VARCHAR(50) NOT NULL COMMENT '리소스 유형 (message, file)',
                resource_id VARCHAR(100) NULL COMMENT '리소스 ID',
                
                -- 암호화 정보
                encryption_version VARCHAR(10) NULL COMMENT '암호화 버전',
                algorithm VARCHAR(50) NULL COMMENT '사용된 알고리즘',
                
                -- 결과
                status VARCHAR(20) NOT NULL COMMENT '상태 (success, failure)',
                error_message TEXT NULL COMMENT '오류 메시지 (실패 시)',
                
                -- 메타데이터
                ip_address VARCHAR(45) NULL COMMENT 'IP 주소',
                user_agent TEXT NULL COMMENT 'User Agent',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
                
                -- 인덱스
                INDEX idx_user_time (user_id, created_at),
                INDEX idx_action_time (action, created_at),
                INDEX idx_status (status)
                
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='암호화 작업 감사 로그';
        `);

        logger.info('✅ [Migration] encryption_audit_log table created successfully');

        logger.info('🎉 [Migration] All encryption tables created successfully!');
        return { success: true };

    } catch (error) {
        logger.error('❌ [Migration] Failed to create encryption tables:', error);
        throw error;
    }
}

/**
 * 마이그레이션 DOWN
 * encrypted_messages 테이블 삭제
 */
export async function down() {
    logger.info('🔧 [Migration] Dropping encryption tables...');

    try {
        // 역순으로 삭제 (의존성 고려)
        await query('DROP TABLE IF EXISTS encryption_audit_log');
        logger.info('✅ [Migration] encryption_audit_log table dropped');

        await query('DROP TABLE IF EXISTS user_encryption_keys');
        logger.info('✅ [Migration] user_encryption_keys table dropped');

        await query('DROP TABLE IF EXISTS encrypted_messages');
        logger.info('✅ [Migration] encrypted_messages table dropped');

        logger.info('🎉 [Migration] All encryption tables dropped successfully!');
        return { success: true };

    } catch (error) {
        logger.error('❌ [Migration] Failed to drop encryption tables:', error);
        throw error;
    }
}

/**
 * 마이그레이션 실행
 */
if (import.meta.url === `file://${process.argv[1]}`) {
    const action = process.argv[2];

    if (action === '--down') {
        down()
            .then(() => {
                logger.info('✅ Migration DOWN completed');
                process.exit(0);
            })
            .catch((error) => {
                logger.error('❌ Migration DOWN failed:', error);
                process.exit(1);
            });
    } else {
        up()
            .then(() => {
                logger.info('✅ Migration UP completed');
                process.exit(0);
            })
            .catch((error) => {
                logger.error('❌ Migration UP failed:', error);
                process.exit(1);
            });
    }
}
