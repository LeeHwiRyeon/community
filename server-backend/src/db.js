import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

let pool;
// DB 존재하지 않을 때 생성하는 헬퍼 (최초 1회)
export async function ensureDatabase() {
    // 모의 데이터 모드인 경우 DB 초기화 건너뛰기
    if (process.env.USE_MOCK_DB === '1' || process.env.ENV_ALLOW_MOCK === '1') {
        console.log('[db] Using mock mode, skipping database initialization');
        return;
    }
    
    const baseConfig = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        multipleStatements: true
    };
    const dbName = process.env.DB_NAME;
    const tmp = await mysql.createConnection(baseConfig);
    try {
        await tmp.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);
    } finally { await tmp.end(); }
}
export function getPool() {
    // 모의 데이터 모드인 경우 null 반환
    if (process.env.USE_MOCK_DB === '1' || process.env.ENV_ALLOW_MOCK === '1') {
        return null;
    }
    
    if (!pool) {
        // NOTE: auth_gssapi_client 오류 발생 시 서버 계정 플러그인을 mysql_native_password 등으로 변경 필요.
        // 필요 시 mysql2 authPlugins 커스터마이징 가능 (여기서는 기본설정 유지).
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            connectionLimit: 10,
            namedPlaceholders: true,
            charset: 'utf8mb4',
            collation: 'utf8mb4_general_ci',
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true
        });
    }
    return pool;
}

export async function query(sql, params) {
    // 모의 데이터 모드인 경우 빈 배열 반환
    if (process.env.USE_MOCK_DB === '1' || process.env.ENV_ALLOW_MOCK === '1') {
        console.log('[db] Mock mode: query skipped -', sql.substring(0, 50));
        return [];
    }
    
    try {
        const p = getPool();
        if (!p) return [];
        const [rows] = await p.execute(sql, params);
        return rows;
    } catch (e) {
        console.error('[db.query.error]', e.message, 'SQL=', sql.slice(0, 120));
        throw e;
    }
}

export async function initSchema() {
    // 모의 데이터 모드인 경우 스키마 초기화 건너뛰기
    if (process.env.USE_MOCK_DB === '1' || process.env.ENV_ALLOW_MOCK === '1') {
        console.log('[db] Mock mode: schema initialization skipped');
        return;
    }
    
    // boards
    await query(`CREATE TABLE IF NOT EXISTS boards (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    ordering INT DEFAULT 1000,
    deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    // posts
    await query(`CREATE TABLE IF NOT EXISTS posts (
    id VARCHAR(64) PRIMARY KEY,
    board_id VARCHAR(64) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content MEDIUMTEXT,
    date DATE,
    tag VARCHAR(100),
    thumb VARCHAR(500),
    author VARCHAR(100),
    category VARCHAR(200),
    deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_posts_board FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    // views
    await query(`CREATE TABLE IF NOT EXISTS post_views (
    post_id VARCHAR(64) PRIMARY KEY,
    views INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_views_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    // indexes
    await query('CREATE INDEX IF NOT EXISTS idx_posts_board_date ON posts(board_id, date)');
    await query('CREATE INDEX IF NOT EXISTS idx_posts_board_deleted ON posts(board_id, deleted)');
    // FULLTEXT (best-effort) - ignore errors if engine/version unsupported
    try { await query('ALTER TABLE posts ADD FULLTEXT INDEX ft_posts_title_content (title, content)'); }
    catch (e) {
        const msg = (e && e.message) || '';
        if (/Duplicate key name/.test(msg)) {
            console.warn('[schema] FULLTEXT index already exists (ft_posts_title_content)');
        } else {
            console.warn('[schema] FULLTEXT index add skipped:', msg);
        }
    }

    // --- New: users (basic) ---
    await query(`CREATE TABLE IF NOT EXISTS users (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            display_name VARCHAR(200),
            email VARCHAR(320) UNIQUE,
            role VARCHAR(32) DEFAULT 'user',
            status VARCHAR(32) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    // Safe alter: ensure role column exists (in case of older deployments) & backfill default
    try {
        const cols = await query("SHOW COLUMNS FROM users LIKE 'role'");
        if (!cols.length) {
            await query("ALTER TABLE users ADD COLUMN role VARCHAR(32) DEFAULT 'user'");
            console.log('[schema] added role column to users');
        }
    } catch (e) { console.warn('[schema] role column check failed', e.message); }

    // user_social_identities: maps OAuth providers to users
    await query(`CREATE TABLE IF NOT EXISTS user_social_identities (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT NOT NULL,
            provider VARCHAR(32) NOT NULL,
            provider_user_id VARCHAR(190) NOT NULL,
            email_at_provider VARCHAR(320),
            profile_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_user_social_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY uq_provider_user (provider, provider_user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // announcements: time window controlled messages
    await query(`CREATE TABLE IF NOT EXISTS announcements (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            slug VARCHAR(120) UNIQUE,
            title VARCHAR(300) NOT NULL,
            body MEDIUMTEXT,
            starts_at DATETIME,
            ends_at DATETIME NULL,
            priority INT DEFAULT 100,
        active TINYINT DEFAULT 1,
        deleted TINYINT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_ann_active_window (active, starts_at, ends_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // events: scheduled items
    await query(`CREATE TABLE IF NOT EXISTS events (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(300) NOT NULL,
            body MEDIUMTEXT,
            starts_at DATETIME,
            ends_at DATETIME,
            location VARCHAR(300),
            status VARCHAR(32) DEFAULT 'planned',
            meta_json TEXT,
            deleted TINYINT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_events_status_start (status, starts_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // --- History tables (append-only) ---
    await query(`CREATE TABLE IF NOT EXISTS announcement_history (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            announcement_id BIGINT,
            action VARCHAR(32),
            snapshot MEDIUMTEXT,
            actor_user_id BIGINT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_ann_hist_announcement (announcement_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await query(`CREATE TABLE IF NOT EXISTS event_history (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            event_id BIGINT,
            action VARCHAR(32),
            snapshot MEDIUMTEXT,
            actor_user_id BIGINT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_event_hist_event (event_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // --- Auth audit table ---
    await query(`CREATE TABLE IF NOT EXISTS auth_audit (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT NULL,
            provider VARCHAR(32) NULL,
            event VARCHAR(64) NOT NULL,
            ip VARCHAR(100),
            user_agent VARCHAR(300),
            detail_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_auth_audit_user (user_id, created_at),
            INDEX idx_auth_audit_event (event, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // --- Chat messages table ---
    await query(`CREATE TABLE IF NOT EXISTS chat_messages (
            id VARCHAR(100) PRIMARY KEY,
            room_id VARCHAR(100) NOT NULL,
            user_id BIGINT NULL,
            username VARCHAR(200) NOT NULL,
            content TEXT NOT NULL,
            deleted TINYINT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_chat_room_time (room_id, created_at),
            INDEX idx_chat_user (user_id, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}
