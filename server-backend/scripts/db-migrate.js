#!/usr/bin/env node
/**
 * 데이터베이스 마이그레이션 스크립트
 * 프로덕션 배포 시 안전하게 DB 스키마 업데이트
 * 
 * @version 1.0.0
 * @date 2025-11-09
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI 색상 코드
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

const log = {
    title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
};

/**
 * 마이그레이션 정의
 */
const migrations = [
    {
        id: '20251109_encryption_tables',
        description: '암호화 시스템 테이블 추가',
        up: async (connection) => {
            // user_key_pairs 테이블
            await connection.execute(`
        CREATE TABLE IF NOT EXISTS user_key_pairs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          public_key TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_key (user_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
            log.success('user_key_pairs 테이블 생성 완료');

            // encrypted_messages 테이블
            await connection.execute(`
        CREATE TABLE IF NOT EXISTS encrypted_messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          message_id INT NOT NULL,
          encrypted_content TEXT NOT NULL,
          encryption_iv VARCHAR(255) NOT NULL,
          encryption_salt VARCHAR(255),
          sender_public_key_id INT,
          recipient_public_key_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_message (message_id),
          FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
          INDEX idx_message_id (message_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
            log.success('encrypted_messages 테이블 생성 완료');

            // encryption_audit_logs 테이블
            await connection.execute(`
        CREATE TABLE IF NOT EXISTS encryption_audit_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          action VARCHAR(100) NOT NULL,
          details TEXT,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_id (user_id),
          INDEX idx_action (action),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
            log.success('encryption_audit_logs 테이블 생성 완료');

            // messages 테이블에 is_encrypted 컬럼 추가
            const [columns] = await connection.execute(`
        SHOW COLUMNS FROM messages LIKE 'is_encrypted'
      `);

            if (columns.length === 0) {
                await connection.execute(`
          ALTER TABLE messages 
          ADD COLUMN is_encrypted BOOLEAN DEFAULT FALSE,
          ADD INDEX idx_is_encrypted (is_encrypted)
        `);
                log.success('messages.is_encrypted 컬럼 추가 완료');
            } else {
                log.info('messages.is_encrypted 컬럼이 이미 존재합니다.');
            }
        },
        down: async (connection) => {
            await connection.execute('DROP TABLE IF EXISTS encryption_audit_logs');
            await connection.execute('DROP TABLE IF EXISTS encrypted_messages');
            await connection.execute('DROP TABLE IF EXISTS user_key_pairs');

            const [columns] = await connection.execute(`
        SHOW COLUMNS FROM messages LIKE 'is_encrypted'
      `);

            if (columns.length > 0) {
                await connection.execute(`
          ALTER TABLE messages DROP COLUMN is_encrypted
        `);
            }

            log.success('암호화 테이블 삭제 완료');
        }
    },
    {
        id: '20251109_performance_indexes',
        description: '성능 최적화 인덱스 추가',
        up: async (connection) => {
            // users 테이블 인덱스
            try {
                await connection.execute(`
          CREATE INDEX idx_users_email ON users(email)
        `);
                log.success('users.email 인덱스 생성 완료');
            } catch (error) {
                if (error.code === 'ER_DUP_KEYNAME') {
                    log.info('users.email 인덱스가 이미 존재합니다.');
                } else {
                    throw error;
                }
            }

            // messages 테이블 복합 인덱스
            try {
                await connection.execute(`
          CREATE INDEX idx_messages_room_created ON messages(room_id, created_at DESC)
        `);
                log.success('messages 복합 인덱스 생성 완료');
            } catch (error) {
                if (error.code === 'ER_DUP_KEYNAME') {
                    log.info('messages 복합 인덱스가 이미 존재합니다.');
                } else {
                    throw error;
                }
            }

            // rooms 테이블 인덱스
            try {
                await connection.execute(`
          CREATE INDEX idx_rooms_type_active ON rooms(type, is_active)
        `);
                log.success('rooms 복합 인덱스 생성 완료');
            } catch (error) {
                if (error.code === 'ER_DUP_KEYNAME') {
                    log.info('rooms 복합 인덱스가 이미 존재합니다.');
                } else {
                    throw error;
                }
            }
        },
        down: async (connection) => {
            await connection.execute('DROP INDEX idx_users_email ON users');
            await connection.execute('DROP INDEX idx_messages_room_created ON messages');
            await connection.execute('DROP INDEX idx_rooms_type_active ON rooms');
            log.success('성능 인덱스 삭제 완료');
        }
    }
];

/**
 * 마이그레이션 히스토리 테이블 생성
 */
async function ensureMigrationTable(connection) {
    await connection.execute(`
    CREATE TABLE IF NOT EXISTS migration_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      migration_id VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      execution_time_ms INT,
      status ENUM('success', 'failed', 'rolled_back') DEFAULT 'success',
      error_message TEXT,
      INDEX idx_migration_id (migration_id),
      INDEX idx_executed_at (executed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

/**
 * 실행된 마이그레이션 조회
 */
async function getExecutedMigrations(connection) {
    const [rows] = await connection.execute(
        'SELECT migration_id FROM migration_history WHERE status = ? ORDER BY executed_at',
        ['success']
    );
    return rows.map(row => row.migration_id);
}

/**
 * 마이그레이션 실행
 */
async function runMigration(connection, migration, direction = 'up') {
    const startTime = Date.now();

    try {
        log.info(`실행 중: ${migration.description} (${migration.id})`);

        await connection.beginTransaction();

        if (direction === 'up') {
            await migration.up(connection);

            // 히스토리 기록
            await connection.execute(
                `INSERT INTO migration_history 
         (migration_id, description, execution_time_ms, status) 
         VALUES (?, ?, ?, ?)`,
                [migration.id, migration.description, Date.now() - startTime, 'success']
            );
        } else {
            await migration.down(connection);

            // 히스토리 업데이트
            await connection.execute(
                `UPDATE migration_history 
         SET status = ?, execution_time_ms = ? 
         WHERE migration_id = ?`,
                ['rolled_back', Date.now() - startTime, migration.id]
            );
        }

        await connection.commit();

        log.success(
            `완료: ${migration.description} (${(Date.now() - startTime)}ms)`
        );

        return true;
    } catch (error) {
        await connection.rollback();

        log.error(`실패: ${migration.description}`);
        log.error(`오류: ${error.message}`);

        // 실패 기록
        await connection.execute(
            `INSERT INTO migration_history 
       (migration_id, description, execution_time_ms, status, error_message) 
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       status = ?, error_message = ?, execution_time_ms = ?`,
            [
                migration.id,
                migration.description,
                Date.now() - startTime,
                'failed',
                error.message,
                'failed',
                error.message,
                Date.now() - startTime
            ]
        );

        return false;
    }
}

/**
 * 데이터베이스 백업 생성
 */
async function createBackup(connection) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFile = path.join(__dirname, `../../backups/db_backup_${timestamp}.sql`);

    log.info('데이터베이스 백업 생성 중...');

    const backupDir = path.dirname(backupFile);
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    // mysqldump 명령어 생성
    const dumpCommand = `mysqldump -h${process.env.DB_HOST} -u${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME}`;

    log.warning('수동 백업 명령어:');
    console.log(`  ${dumpCommand} > ${backupFile}\n`);

    return backupFile;
}

/**
 * 메인 함수
 */
async function main() {
    console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════╗
║        🗄️  데이터베이스 마이그레이션 v1.0.0          ║
╚═══════════════════════════════════════════════════════╝${colors.reset}
  `);

    const args = process.argv.slice(2);
    const command = args[0] || 'up';
    const targetMigration = args[1];

    let connection;

    try {
        // 데이터베이스 연결
        log.info('데이터베이스 연결 중...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            multipleStatements: true
        });
        log.success('데이터베이스 연결 성공');

        // 마이그레이션 테이블 생성
        await ensureMigrationTable(connection);

        if (command === 'status') {
            // 마이그레이션 상태 확인
            const executed = await getExecutedMigrations(connection);

            log.title('📊 마이그레이션 상태');
            migrations.forEach(migration => {
                const isExecuted = executed.includes(migration.id);
                if (isExecuted) {
                    log.success(`${migration.id}: ${migration.description}`);
                } else {
                    log.warning(`${migration.id}: ${migration.description} (미실행)`);
                }
            });
        } else if (command === 'up') {
            // 마이그레이션 실행
            const executed = await getExecutedMigrations(connection);
            const pending = migrations.filter(m => !executed.includes(m.id));

            if (pending.length === 0) {
                log.info('실행할 마이그레이션이 없습니다.');
                return;
            }

            log.title(`📈 ${pending.length}개의 마이그레이션 실행`);

            // 백업 생성 권장
            log.warning('⚠️  백업을 먼저 생성하는 것을 권장합니다!');
            await createBackup(connection);

            let successCount = 0;
            for (const migration of pending) {
                const success = await runMigration(connection, migration, 'up');
                if (success) {
                    successCount++;
                } else {
                    log.error('마이그레이션 실패로 중단합니다.');
                    break;
                }
            }

            log.title('✅ 마이그레이션 완료');
            log.info(`성공: ${successCount}/${pending.length}`);
        } else if (command === 'down') {
            // 롤백
            const executed = await getExecutedMigrations(connection);

            if (executed.length === 0) {
                log.info('롤백할 마이그레이션이 없습니다.');
                return;
            }

            const migrationId = targetMigration || executed[executed.length - 1];
            const migration = migrations.find(m => m.id === migrationId);

            if (!migration) {
                log.error(`마이그레이션을 찾을 수 없습니다: ${migrationId}`);
                return;
            }

            log.warning(`⚠️  롤백 실행: ${migration.description}`);
            log.warning('이 작업은 데이터를 삭제할 수 있습니다!');

            await runMigration(connection, migration, 'down');
        } else {
            log.error('알 수 없는 명령어입니다.');
            console.log('\n사용법:');
            console.log('  node db-migrate.js status              # 마이그레이션 상태 확인');
            console.log('  node db-migrate.js up                  # 미실행 마이그레이션 실행');
            console.log('  node db-migrate.js down [migration_id] # 마이그레이션 롤백');
        }
    } catch (error) {
        log.error(`오류 발생: ${error.message}`);
        console.error(error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// 스크립트 실행
main().catch(error => {
    console.error('예기치 않은 오류:', error);
    process.exit(1);
});
