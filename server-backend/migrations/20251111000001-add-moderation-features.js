/**
 * Migration: Add moderation features
 * 모더레이션 기능을 위한 테이블 및 컬럼 추가
 * 
 * @author AUTOAGENTS
 * @date 2025-11-11
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'community'
};

async function up() {
    const connection = await mysql.createConnection(dbConfig);

    try {
        console.log('🔄 Starting moderation features migration...');

        // moderation_logs 테이블 생성
        console.log('Creating moderation_logs table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS moderation_logs (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                moderator_id BIGINT NOT NULL,
                action_type ENUM(
                    'delete', 'delete_permanent', 'restore',
                    'ban', 'unban', 'restrict', 'unrestrict',
                    'warn', 'flag', 'unflag'
                ) NOT NULL,
                target_type ENUM('post', 'comment', 'user') NOT NULL,
                target_id BIGINT NOT NULL,
                reason TEXT,
                metadata JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_moderator (moderator_id),
                INDEX idx_target (target_type, target_id),
                INDEX idx_created (created_at),
                FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // reports 테이블 생성
        console.log('Creating reports table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS reports (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                reporter_id BIGINT NOT NULL,
                reported_user_id BIGINT,
                target_type ENUM('post', 'comment', 'user') NOT NULL,
                target_id BIGINT NOT NULL,
                reason ENUM(
                    'spam', 'harassment', 'hate_speech', 'violence',
                    'illegal_content', 'misinformation', 'other'
                ) NOT NULL,
                description TEXT,
                status ENUM('pending', 'reviewing', 'resolved', 'rejected') DEFAULT 'pending',
                reviewed_by BIGINT,
                reviewed_at DATETIME,
                resolution_note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_reporter (reporter_id),
                INDEX idx_target (target_type, target_id),
                INDEX idx_status (status),
                FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
                FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
                FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // users 테이블에 컬럼 추가
        console.log('Adding moderation columns to users table...');
        const addColumns = [
            { name: 'is_banned', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'banned_until', type: 'DATETIME' },
            { name: 'banned_reason', type: 'TEXT' },
            { name: 'is_restricted', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'restriction_settings', type: 'JSON' }
        ];

        for (const col of addColumns) {
            try {
                await connection.execute(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
                console.log(`  ✓ Added ${col.name}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`  - ${col.name} already exists`);
                } else {
                    throw err;
                }
            }
        }

        // posts 테이블에 컬럼 추가
        console.log('Adding moderation columns to posts table...');
        const postColumns = [
            { name: 'is_flagged', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'deleted_at', type: 'DATETIME' }
        ];

        for (const col of postColumns) {
            try {
                await connection.execute(`ALTER TABLE posts ADD COLUMN ${col.name} ${col.type}`);
                console.log(`  ✓ Added ${col.name}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`  - ${col.name} already exists`);
                } else {
                    throw err;
                }
            }
        }

        // posts 인덱스 추가
        try {
            await connection.execute(`ALTER TABLE posts ADD INDEX idx_is_flagged (is_flagged)`);
            console.log('  ✓ Added index on is_flagged');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('  - Index on is_flagged already exists');
            } else {
                throw err;
            }
        }

        console.log('✅ Moderation features migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

async function down() {
    const connection = await mysql.createConnection(dbConfig);

    try {
        console.log('🔄 Reverting moderation features migration...');

        // 인덱스 제거
        try {
            await connection.execute(`ALTER TABLE posts DROP INDEX idx_is_flagged`);
        } catch (err) {
            console.log('Index idx_is_flagged does not exist');
        }

        // 테이블 삭제
        await connection.execute(`DROP TABLE IF EXISTS reports`);
        await connection.execute(`DROP TABLE IF EXISTS moderation_logs`);

        // users 컬럼 제거
        const userColumns = ['is_banned', 'banned_until', 'banned_reason', 'is_restricted', 'restriction_settings'];
        for (const col of userColumns) {
            try {
                await connection.execute(`ALTER TABLE users DROP COLUMN ${col}`);
            } catch (err) {
                console.log(`Column ${col} does not exist`);
            }
        }

        // posts 컬럼 제거
        const postColumns = ['is_flagged', 'deleted_at'];
        for (const col of postColumns) {
            try {
                await connection.execute(`ALTER TABLE posts DROP COLUMN ${col}`);
            } catch (err) {
                console.log(`Column ${col} does not exist`);
            }
        }

        console.log('✅ Rollback completed successfully!');
    } catch (error) {
        console.error('❌ Rollback failed:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// CLI 실행
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const command = process.argv[2];

    if (command === '--down') {
        down().catch(console.error);
    } else {
        up().catch(console.error);
    }
}
