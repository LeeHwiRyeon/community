/**
 * DM System Migration Script for SQLite
 * 기존 direct_messages 테이블을 dm_conversations와 새 구조로 마이그레이션
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file path
const DB_PATH = join(__dirname, '../data/community.db');

console.log('🔄 Starting DM System Migration...');
console.log(`📂 Database: ${DB_PATH}`);

try {
    const db = new Database(DB_PATH);
    db.pragma('foreign_keys = OFF'); // 마이그레이션 중 외래 키 제약 비활성화

    // 트랜잭션 시작
    db.exec('BEGIN TRANSACTION');

    console.log('1️⃣ Backing up old direct_messages table...');
    
    // 기존 direct_messages 테이블을 백업
    db.exec(`
        DROP TABLE IF EXISTS direct_messages_backup;
        CREATE TABLE IF NOT EXISTS direct_messages_backup AS 
        SELECT * FROM direct_messages;
    `);
    
    console.log('2️⃣ Creating dm_conversations table...');
    
    // dm_conversations 테이블 생성
    db.exec(`
        DROP TABLE IF EXISTS dm_conversations;
        CREATE TABLE dm_conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            participant1_id INTEGER NOT NULL,
            participant2_id INTEGER NOT NULL,
            last_message_id INTEGER DEFAULT NULL,
            last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (participant1_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (participant2_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);

    console.log('3️⃣ Creating indexes for dm_conversations...');
    
    db.exec(`
        CREATE INDEX idx_dm_conv_participant1 ON dm_conversations(participant1_id);
        CREATE INDEX idx_dm_conv_participant2 ON dm_conversations(participant2_id);
        CREATE INDEX idx_dm_conv_pair ON dm_conversations(participant1_id, participant2_id);
        CREATE INDEX idx_dm_conv_last_message ON dm_conversations(last_message_at DESC);
    `);

    console.log('4️⃣ Dropping old direct_messages table...');
    
    // 기존 direct_messages 테이블 삭제
    db.exec('DROP TABLE IF EXISTS direct_messages');

    console.log('5️⃣ Creating new direct_messages table...');
    
    // 새 direct_messages 테이블 생성
    db.exec(`
        CREATE TABLE direct_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text', 'image', 'file', 'system')),
            
            -- 첨부파일 정보
            attachment_url TEXT,
            attachment_name TEXT,
            attachment_size INTEGER,
            attachment_type TEXT,
            
            -- 상태 정보
            is_read INTEGER DEFAULT 0,
            read_at DATETIME,
            is_deleted INTEGER DEFAULT 0,
            deleted_at DATETIME,
            deleted_by INTEGER,
            
            -- 메타데이터
            reply_to_id INTEGER,
            edited_at DATETIME,
            
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            
            FOREIGN KEY (conversation_id) REFERENCES dm_conversations(id) ON DELETE CASCADE,
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (reply_to_id) REFERENCES direct_messages(id) ON DELETE SET NULL
        );
    `);

    console.log('6️⃣ Creating indexes for direct_messages...');
    
    db.exec(`
        CREATE INDEX idx_dm_conversation ON direct_messages(conversation_id, created_at DESC);
        CREATE INDEX idx_dm_sender ON direct_messages(sender_id);
        CREATE INDEX idx_dm_receiver ON direct_messages(receiver_id);
        CREATE INDEX idx_dm_read_status ON direct_messages(receiver_id, is_read);
        CREATE INDEX idx_dm_deleted ON direct_messages(is_deleted);
    `);

    console.log('7️⃣ Migrating data from backup (if any)...');
    
    // 백업 테이블에 데이터가 있는지 확인
    const hasData = db.prepare('SELECT COUNT(*) as count FROM direct_messages_backup').get();
    
    if (hasData && hasData.count > 0) {
        console.log(`   Found ${hasData.count} messages to migrate...`);
        
        // 고유한 대화 쌍 찾기 및 대화방 생성
        const conversations = db.prepare(`
            SELECT DISTINCT
                CASE WHEN sender_id < receiver_id THEN sender_id ELSE receiver_id END as participant1_id,
                CASE WHEN sender_id < receiver_id THEN receiver_id ELSE sender_id END as participant2_id,
                MAX(created_at) as last_message_at
            FROM direct_messages_backup
            GROUP BY participant1_id, participant2_id
        `).all();

        console.log(`   Creating ${conversations.length} conversations...`);
        
        const insertConv = db.prepare(`
            INSERT INTO dm_conversations (participant1_id, participant2_id, last_message_at)
            VALUES (?, ?, ?)
        `);

        for (const conv of conversations) {
            insertConv.run(conv.participant1_id, conv.participant2_id, conv.last_message_at);
        }

        // 메시지 마이그레이션
        console.log('   Migrating messages...');
        
        const messages = db.prepare('SELECT * FROM direct_messages_backup ORDER BY id').all();
        const insertMsg = db.prepare(`
            INSERT INTO direct_messages (
                conversation_id, sender_id, receiver_id, content, 
                is_read, created_at, message_type
            )
            SELECT 
                (SELECT id FROM dm_conversations 
                 WHERE (participant1_id = ? AND participant2_id = ?) 
                    OR (participant1_id = ? AND participant2_id = ?)
                 LIMIT 1),
                ?, ?, ?, ?, ?, 'text'
        `);

        for (const msg of messages) {
            const smaller = msg.sender_id < msg.receiver_id ? msg.sender_id : msg.receiver_id;
            const larger = msg.sender_id < msg.receiver_id ? msg.receiver_id : msg.sender_id;
            insertMsg.run(
                smaller, larger, larger, smaller,
                msg.sender_id, msg.receiver_id, msg.message,
                msg.is_read || 0, msg.created_at
            );
        }

        console.log(`   Migrated ${messages.length} messages!`);
    } else {
        console.log('   No existing messages to migrate.');
    }

    // 커밋
    db.exec('COMMIT');
    
    // 외래 키 다시 활성화
    db.pragma('foreign_keys = ON');
    
    // 백업 테이블 삭제 (선택적)
    // db.exec('DROP TABLE IF EXISTS direct_messages_backup');
    
    db.close();
    
    console.log('✅ DM System Migration completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log('   - dm_conversations table created');
    console.log('   - direct_messages table upgraded');
    console.log('   - All indexes created');
    console.log('   - Data migrated (if any)');
    console.log('');
    console.log('🚀 You can now start the server!');

} catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
}
