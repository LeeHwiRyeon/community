import { getPool } from '../src/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration(filename) {
    const pool = getPool();
    const filePath = path.join(__dirname, '../migrations', filename);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`\n🔄 실행 중: ${filename}`);

    // 마이그레이션 파일별로 개별 처리
    if (filename === 'add_online_status.sql') {
        return await runOnlineStatusMigration(pool);
    } else if (filename === 'add_moderator_tools.sql') {
        return await runModeratorToolsMigration(pool);
    }
}

async function runOnlineStatusMigration(pool) {
    console.log('📝 온라인 상태 테이블 생성 중...');

    try {
        // 1. user_online_status 테이블 생성
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_online_status (
                user_id INT PRIMARY KEY,
                is_online BOOLEAN DEFAULT FALSE,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'offline' COMMENT 'online, offline, away, busy',
                device_type VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_is_online (is_online),
                INDEX idx_last_seen (last_seen),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 온라인 상태 추적'
        `);
        console.log('  ✅ user_online_status 테이블 생성');

        // 2. users 테이블 컬럼 추가 (이미 존재하면 스킵)
        try {
            await pool.query(`
                ALTER TABLE users 
                ADD COLUMN show_online_status BOOLEAN DEFAULT TRUE COMMENT '온라인 상태 공개 여부'
            `);
            console.log('  ✅ users.show_online_status 컬럼 추가');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('  ⚠️  show_online_status 컬럼 이미 존재 (스킵)');
            } else {
                throw error;
            }
        }

        try {
            await pool.query(`
                ALTER TABLE users 
                ADD COLUMN last_activity TIMESTAMP NULL COMMENT '마지막 활동 시간'
            `);
            console.log('  ✅ users.last_activity 컬럼 추가');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('  ⚠️  last_activity 컬럼 이미 존재 (스킵)');
            } else {
                throw error;
            }
        }

        // 3. 뷰 생성
        await pool.query(`
            CREATE OR REPLACE VIEW online_users_summary AS
            SELECT 
                COUNT(*) as total_online,
                COUNT(CASE WHEN status = 'online' THEN 1 END) as actively_online,
                COUNT(CASE WHEN status = 'away' THEN 1 END) as away,
                COUNT(CASE WHEN status = 'busy' THEN 1 END) as busy,
                COUNT(CASE WHEN device_type = 'mobile' THEN 1 END) as mobile_users,
                COUNT(CASE WHEN device_type = 'desktop' THEN 1 END) as desktop_users
            FROM user_online_status
            WHERE is_online = TRUE 
            AND last_heartbeat > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        `);
        console.log('  ✅ online_users_summary 뷰 생성');

        console.log('✅ 온라인 상태 마이그레이션 완료\n');
    } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('  ⚠️  테이블이 이미 존재합니다 (스킵)\n');
        } else {
            throw error;
        }
    }
}

async function runModeratorToolsMigration(pool) {
    console.log('📝 모더레이터 도구 테이블 생성 중...');

    const tables = [
        {
            name: 'moderator_roles',
            sql: `CREATE TABLE IF NOT EXISTS moderator_roles (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                board_id INT NULL COMMENT 'NULL이면 전체 게시판 모더레이터',
                role VARCHAR(50) NOT NULL DEFAULT 'moderator' COMMENT 'moderator, admin, super_admin',
                permissions JSON COMMENT '권한 목록 (JSON 배열)',
                assigned_by INT NOT NULL,
                expires_at TIMESTAMP NULL COMMENT '권한 만료일',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_user_id (user_id),
                INDEX idx_board_id (board_id),
                INDEX idx_is_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        },
        {
            name: 'user_warnings',
            sql: `CREATE TABLE IF NOT EXISTS user_warnings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                moderator_id INT NOT NULL,
                reason TEXT NOT NULL,
                severity VARCHAR(20) DEFAULT 'low' COMMENT 'low, medium, high, critical',
                post_id INT NULL,
                comment_id INT NULL,
                expires_at TIMESTAMP NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_user_id (user_id),
                INDEX idx_severity (severity),
                INDEX idx_is_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        },
        {
            name: 'user_bans',
            sql: `CREATE TABLE IF NOT EXISTS user_bans (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                moderator_id INT NOT NULL,
                ban_type VARCHAR(20) DEFAULT 'temporary' COMMENT 'temporary, permanent, shadow',
                reason TEXT NOT NULL,
                board_id INT NULL COMMENT 'NULL이면 전체 차단',
                start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_time TIMESTAMP NULL COMMENT 'NULL이면 영구 차단',
                appeal_count INT DEFAULT 0,
                last_appeal_at TIMESTAMP NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_user_id (user_id),
                INDEX idx_ban_type (ban_type),
                INDEX idx_is_active (is_active),
                INDEX idx_end_time (end_time)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        },
        {
            name: 'content_reports',
            sql: `CREATE TABLE IF NOT EXISTS content_reports (
                id INT PRIMARY KEY AUTO_INCREMENT,
                reporter_id INT NOT NULL,
                reported_user_id INT NOT NULL,
                content_type VARCHAR(20) NOT NULL COMMENT 'post, comment, message, user',
                content_id INT NOT NULL,
                reason VARCHAR(255) NOT NULL,
                description TEXT,
                status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending, reviewing, resolved, rejected',
                priority VARCHAR(20) DEFAULT 'normal' COMMENT 'low, normal, high, urgent',
                assigned_moderator_id INT NULL,
                resolution_action VARCHAR(50),
                resolution_note TEXT,
                resolved_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (assigned_moderator_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_status (status),
                INDEX idx_priority (priority),
                INDEX idx_content (content_type, content_id),
                INDEX idx_reporter (reporter_id),
                INDEX idx_reported_user (reported_user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        },
        {
            name: 'moderator_actions',
            sql: `CREATE TABLE IF NOT EXISTS moderator_actions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                moderator_id INT NOT NULL,
                action_type VARCHAR(50) NOT NULL COMMENT 'ban, unban, delete, restore, warn, etc',
                target_type VARCHAR(20) NOT NULL COMMENT 'user, post, comment, report',
                target_id INT NOT NULL,
                reason TEXT,
                details JSON COMMENT '추가 세부 정보',
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_moderator_id (moderator_id),
                INDEX idx_action_type (action_type),
                INDEX idx_target (target_type, target_id),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        }
    ];

    for (const table of tables) {
        try {
            await pool.query(table.sql);
            console.log(`  ✅ ${table.name} 테이블 생성`);
        } catch (error) {
            if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                console.log(`  ⚠️  ${table.name} 테이블 이미 존재 (스킵)`);
            } else {
                throw error;
            }
        }
    }

    // 뷰 생성
    try {
        await pool.query(`
            CREATE OR REPLACE VIEW moderator_statistics AS
            SELECT 
                u.id as user_id,
                u.username,
                u.display_name,
                COUNT(ma.id) as total_actions,
                COUNT(CASE WHEN ma.action_type = 'ban' THEN 1 END) as ban_count,
                COUNT(CASE WHEN ma.action_type = 'warn' THEN 1 END) as warn_count,
                COUNT(CASE WHEN ma.action_type = 'delete' THEN 1 END) as delete_count,
                MAX(ma.created_at) as last_action_at
            FROM users u
            INNER JOIN moderator_roles mr ON u.id = mr.user_id
            LEFT JOIN moderator_actions ma ON u.id = ma.moderator_id
            WHERE mr.is_active = TRUE
            GROUP BY u.id, u.username, u.display_name
        `);
        console.log('  ✅ moderator_statistics 뷰 생성');

        await pool.query(`
            CREATE OR REPLACE VIEW pending_reports_summary AS
            SELECT 
                status,
                priority,
                content_type,
                COUNT(*) as count
            FROM content_reports
            WHERE status = 'pending'
            GROUP BY status, priority, content_type
        `);
        console.log('  ✅ pending_reports_summary 뷰 생성');
    } catch (error) {
        console.log('  ⚠️  뷰 생성 중 오류:', error.message);
    }

    console.log('✅ 모더레이터 도구 마이그레이션 완료\n');
}

async function verifyMigration() {
    const pool = getPool();

    console.log('🔍 마이그레이션 검증 중...\n');

    try {
        // 온라인 상태 테이블 확인
        const [onlineStatus] = await pool.query(
            "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'user_online_status'"
        );
        console.log(`  ${onlineStatus[0].count ? '✅' : '❌'} user_online_status 테이블`);

        // 모더레이터 테이블 확인
        const moderatorTables = [
            'moderator_roles',
            'user_warnings',
            'user_bans',
            'content_reports',
            'moderator_actions'
        ];

        for (const tableName of moderatorTables) {
            const [result] = await pool.query(
                `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`,
                [tableName]
            );
            console.log(`  ${result[0].count ? '✅' : '❌'} ${tableName} 테이블`);
        }

        // 뷰 확인
        const views = [
            'online_users_summary',
            'moderator_statistics',
            'pending_reports_summary'
        ];

        for (const viewName of views) {
            const [result] = await pool.query(
                `SELECT COUNT(*) as count FROM information_schema.views WHERE table_schema = DATABASE() AND table_name = ?`,
                [viewName]
            );
            console.log(`  ${result[0].count ? '✅' : '❌'} ${viewName} 뷰`);
        }

        // users 테이블에 show_online_status 컬럼 확인
        const [columnResult] = await pool.query(
            "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'show_online_status'"
        );
        console.log(`  ${columnResult[0].count ? '✅' : '❌'} users.show_online_status 컬럼`);

        console.log('\n✅ 검증 완료!\n');
    } catch (error) {
        console.error('❌ 검증 실패:', error.message);
        throw error;
    }
}

async function main() {
    try {
        console.log('🚀 Phase 2 데이터베이스 마이그레이션 시작...\n');
        console.log('📁 마이그레이션 파일:');
        console.log('   1. add_online_status.sql');
        console.log('   2. add_moderator_tools.sql\n');

        await runMigration('add_online_status.sql');
        await runMigration('add_moderator_tools.sql');

        await verifyMigration();

        console.log('✅ 모든 마이그레이션이 성공적으로 완료되었습니다!');
        console.log('\n📌 다음 단계:');
        console.log('   1. 서버 재시작: npm run dev');
        console.log('   2. API 테스트: /api/moderator/stats');
        console.log('   3. 프론트엔드 확인: ModeratorDashboard 접근\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ 마이그레이션 실패:', error.message);
        console.error('\n💡 해결 방법:');
        console.error('   1. MySQL 서버가 실행 중인지 확인');
        console.error('   2. .env 파일의 DB 설정 확인');
        console.error('   3. PHASE2_MIGRATION_GUIDE.md의 롤백 섹션 참조\n');
        process.exit(1);
    }
}

main();
