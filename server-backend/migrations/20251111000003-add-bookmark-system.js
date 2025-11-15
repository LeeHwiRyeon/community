/**
 * Bookmark System Migration
 * 북마크 시스템 데이터베이스 마이그레이션
 * 
 * @author AUTOAGENTS
 * @date 2025-11-11
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'community'
};

async function runMigration() {
    let connection;

    try {
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('🔄 Starting bookmark system migration...\n');

        // 1. bookmark_folders 테이블 생성
        console.log('Creating bookmark_folders table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS bookmark_folders (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                user_id BIGINT NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                color VARCHAR(20) DEFAULT '#1976d2',
                icon VARCHAR(50) DEFAULT '📁',
                is_default BOOLEAN DEFAULT FALSE,
                display_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_folders (user_id),
                INDEX idx_display_order (display_order)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ bookmark_folders table created\n');

        // 2. bookmarks 테이블 생성
        console.log('Creating bookmarks table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS bookmarks (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                user_id BIGINT NOT NULL,
                folder_id BIGINT,
                item_type ENUM('post', 'comment') NOT NULL,
                item_id BIGINT NOT NULL,
                note TEXT,
                tags JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (folder_id) REFERENCES bookmark_folders(id) ON DELETE SET NULL,
                UNIQUE KEY uk_bookmark (user_id, item_type, item_id),
                INDEX idx_user_bookmarks (user_id),
                INDEX idx_folder_bookmarks (folder_id),
                INDEX idx_item (item_type, item_id),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ bookmarks table created\n');

        // 3. posts 테이블에 bookmark_count 컬럼 추가
        console.log('Adding bookmark_count to posts table...');
        try {
            await connection.execute(`
                ALTER TABLE posts 
                ADD COLUMN bookmark_count INT DEFAULT 0
            `);
            console.log('✓ Added bookmark_count column\n');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  bookmark_count column already exists\n');
            } else {
                throw error;
            }
        }

        // 4. comments 테이블에 bookmark_count 컬럼 추가 (테이블이 존재하는 경우)
        console.log('Checking comments table...');
        const [commentsTables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'comments'
        `, [DB_CONFIG.database]);

        if (commentsTables.length > 0) {
            console.log('Adding bookmark_count to comments table...');
            try {
                await connection.execute(`
                    ALTER TABLE comments 
                    ADD COLUMN bookmark_count INT DEFAULT 0
                `);
                console.log('✓ Added bookmark_count column\n');
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log('⚠️  bookmark_count column already exists\n');
                } else {
                    throw error;
                }
            }
        } else {
            console.log('⚠️  comments table does not exist, skipping...\n');
        }

        // 5. posts 테이블에 인덱스 추가
        console.log('Adding index on posts.bookmark_count...');
        try {
            await connection.execute(`
                CREATE INDEX idx_posts_bookmark_count ON posts(bookmark_count)
            `);
            console.log('✓ Added index on posts.bookmark_count\n');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  Index already exists\n');
            } else {
                throw error;
            }
        }

        // 6. 기존 사용자들에게 기본 폴더 생성
        console.log('Creating default folders for existing users...');
        const [users] = await connection.execute('SELECT id FROM users');

        for (const user of users) {
            await connection.execute(`
                INSERT IGNORE INTO bookmark_folders (user_id, name, description, is_default, display_order)
                VALUES (?, '북마크', '기본 북마크 폴더', TRUE, 0)
            `, [user.id]);
        }
        console.log(`✓ Created default folders for ${users.length} users\n`);

        console.log('✅ Bookmark system migration completed successfully!\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function rollbackMigration() {
    let connection;

    try {
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('🔄 Rolling back bookmark system migration...\n');

        // 테이블 삭제 (역순)
        await connection.execute('DROP TABLE IF EXISTS bookmarks');
        console.log('✓ Dropped bookmarks table');

        await connection.execute('DROP TABLE IF EXISTS bookmark_folders');
        console.log('✓ Dropped bookmark_folders table');

        // 컬럼 삭제
        try {
            await connection.execute('ALTER TABLE posts DROP COLUMN bookmark_count');
            console.log('✓ Dropped posts.bookmark_count column');
        } catch (error) {
            if (error.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
                throw error;
            }
        }

        try {
            await connection.execute('ALTER TABLE comments DROP COLUMN bookmark_count');
            console.log('✓ Dropped comments.bookmark_count column');
        } catch (error) {
            if (error.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
                throw error;
            }
        }

        console.log('\n✅ Rollback completed successfully!\n');

    } catch (error) {
        console.error('❌ Rollback failed:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// 실행
const isRollback = process.argv.includes('--down');

if (isRollback) {
    rollbackMigration()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
} else {
    runMigration()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
