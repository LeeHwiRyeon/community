import sqliteDb from './config/sqlite-db.js';
import dotenv from 'dotenv';
dotenv.config();

let pool;

export async function ensureDatabase() {
    if (process.env.USE_MOCK_DB === '1') {
        console.log('[db] Using mock mode');
        return;
    }
    console.log('[db] Using SQLite');
}

export function getPool() {
    if (process.env.USE_MOCK_DB === '1') return null;
    if (!pool) pool = sqliteDb;
    return pool;
}

export async function query(sql, params = []) {
    if (process.env.USE_MOCK_DB === '1') {
        console.log('[db] Mock mode: query skipped');
        return [];
    }
    
    try {
        const p = getPool();
        if (!p) return [];
        
        const isSelect = /^\s*SELECT/i.test(sql);
        
        if (isSelect) {
            const [rows] = p.query(sql, params);
            return rows;
        } else {
            const [result] = p.execute(sql, params);
            return result;
        }
    } catch (e) {
        console.error('[db.query.error]', e.message);
        throw e;
    }
}

export async function initSchema() {
    console.log('[db] SQLite schema initialized');
}

export default { ensureDatabase, getPool, query, initSchema };
