#!/usr/bin/env node
import dotenv from 'dotenv';
import { ensureDatabase, getPool, query } from '../../src/db.js';

dotenv.config();

const isMock = process.env.USE_MOCK_DB === '1' || process.env.ENV_ALLOW_MOCK === '1';

async function ensureColumn(table, column, definition) {
    const rows = await query(`SHOW COLUMNS FROM ${table} LIKE '${column}'`);
    if (!rows || rows.length === 0) {
        await query(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
        console.log(`[migration] added column ${column} to ${table}`);
    }
}

async function applyMigration() {
    if (isMock) {
        console.log('[migration] mock mode enabled, skipping apply');
        return;
    }

    await ensureDatabase();
    getPool();

    await ensureColumn('users', 'rpg_level', 'rpg_level INT NOT NULL DEFAULT 1');
    await ensureColumn('users', 'rpg_xp', 'rpg_xp INT NOT NULL DEFAULT 0');
    await ensureColumn('users', 'last_levelup_at', 'last_levelup_at TIMESTAMP NULL');

    await query(`CREATE TABLE IF NOT EXISTS user_stats (
        user_id BIGINT PRIMARY KEY,
        posts_count INT DEFAULT 0,
        comments_count INT DEFAULT 0,
        likes_received INT DEFAULT 0,
        badges_count INT DEFAULT 0,
        activity_score INT GENERATED ALWAYS AS (posts_count * 4 + comments_count * 2 + likes_received) STORED,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_stats_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await query('CREATE INDEX IF NOT EXISTS idx_user_stats_activity ON user_stats(activity_score)');

    await query(`CREATE TABLE IF NOT EXISTS user_badges (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        badge_code VARCHAR(32) NOT NULL,
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_badges_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY uq_user_badge (user_id, badge_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await query('CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at)');

    console.log('[migration] RPG profile schema applied');
}

async function rollbackMigration() {
    if (isMock) {
        console.log('[migration] mock mode enabled, skipping rollback');
        return;
    }

    await ensureDatabase();
    getPool();

    const drops = [
        "ALTER TABLE users DROP COLUMN rpg_level",
        "ALTER TABLE users DROP COLUMN rpg_xp",
        "ALTER TABLE users DROP COLUMN last_levelup_at"
    ];

    for (const sql of drops) {
        try {
            await query(sql);
            console.log(`[migration] executed: ${sql}`);
        } catch (err) {
            const code = err && err.code;
            const msg = err && err.message ? err.message : String(err);
            if (code === 'ER_BAD_FIELD_ERROR' || code === 'ER_CANT_DROP_FIELD_OR_KEY' || /check that column/i.test(msg)) {
                console.warn(`[migration] rollback notice (ignored): ${msg}`);
                continue;
            }
            throw err;
        }
    }

    await query('DROP TABLE IF EXISTS user_badges');
    await query('DROP TABLE IF EXISTS user_stats');

    console.log('[migration] RPG profile schema rolled back');
}

async function main() {
    const down = process.argv.includes('--down');
    try {
        if (down) {
            await rollbackMigration();
        } else {
            await applyMigration();
        }
    } catch (err) {
        console.error('[migration] failed:', err);
        process.exitCode = 1;
    } finally {
        const pool = getPool();
        if (pool && pool.end) {
            await pool.end();
        }
    }
}

main();
