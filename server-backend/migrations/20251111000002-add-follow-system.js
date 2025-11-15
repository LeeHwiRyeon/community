/**
 * Follow System Database Migration
 * 팔로우 시스템을 위한 데이터베이스 마이그레이션
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
        console.log('🔄 Starting follow system migration...');

        // follows 테이블 생성
        console.log('Creating follows table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS follows (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                follower_id BIGINT NOT NULL COMMENT '팔로우하는 사용자 ID',
                following_id BIGINT NOT NULL COMMENT '팔로우 대상 사용자 ID',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                UNIQUE KEY uk_follow_relationship (follower_id, following_id),
                INDEX idx_follower (follower_id),
                INDEX idx_following (following_id),
                INDEX idx_created (created_at),
                
                FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
                FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='사용자 팔로우 관계 테이블'
        `);

        // follow_notifications 테이블 생성
        console.log('Creating follow_notifications table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS follow_notifications (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                user_id BIGINT NOT NULL COMMENT '알림을 받는 사용자 ID',
                follower_id BIGINT NOT NULL COMMENT '팔로우한 사용자 ID',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                read_at DATETIME,
                
                INDEX idx_user (user_id, is_read),
                INDEX idx_created (created_at),
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
                FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='팔로우 알림 테이블'
        `);

        // users 테이블에 캐시 컬럼 추가
        console.log('Adding cache columns to users table...');
        const cacheColumns = [
            { name: 'followers_count', type: 'INT DEFAULT 0 COMMENT "팔로워 수"' },
            { name: 'following_count', type: 'INT DEFAULT 0 COMMENT "팔로잉 수"' }
        ];

        for (const col of cacheColumns) {
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

        // 인덱스 추가
        try {
            await connection.execute(`ALTER TABLE users ADD INDEX idx_followers_count (followers_count)`);
            console.log('  ✓ Added index on followers_count');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('  - Index on followers_count already exists');
            } else {
                throw err;
            }
        }

        // 기존 팔로우 데이터로 캐시 초기화 (있을 경우)
        console.log('Initializing follower/following counts...');
        await connection.execute(`
            UPDATE users u
            SET followers_count = (
                SELECT COUNT(*) FROM follows WHERE following_id = u.id
            ),
            following_count = (
                SELECT COUNT(*) FROM follows WHERE follower_id = u.id
            )
        `);

        console.log('✅ Follow system migration completed successfully!');
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
        console.log('🔄 Reverting follow system migration...');

        // 테이블 삭제
        await connection.execute(`DROP TABLE IF EXISTS follow_notifications`);
        await connection.execute(`DROP TABLE IF EXISTS follows`);

        // users 테이블 인덱스 제거
        try {
            await connection.execute(`ALTER TABLE users DROP INDEX idx_followers_count`);
        } catch (err) {
            console.log('Index idx_followers_count does not exist');
        }

        // users 테이블 컬럼 제거
        const columns = ['followers_count', 'following_count'];
        for (const col of columns) {
            try {
                await connection.execute(`ALTER TABLE users DROP COLUMN ${col}`);
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
