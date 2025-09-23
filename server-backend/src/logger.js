import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_DIR = path.join(__dirname, '../logs');
if (!fs.existsSync(LOG_DIR)) {
    try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch (e) { /* ignore */ }
}

const LOG_FILE = path.join(LOG_DIR, 'runtime.log');
const JSON_MODE = process.env.LOG_JSON === '1';

// Korean timezone formatting
function ts() {
    const now = new Date();
    // Korea Standard Time (UTC+9)
    const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return kstTime.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' KST');
}

function truncateStrings(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const out = Array.isArray(obj) ? [] : {};
    for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (typeof v === 'string') {
            out[k] = v.length > 400 ? v.slice(0, 400) + '...' : v;
        } else if (v && typeof v === 'object') {
            out[k] = truncateStrings(v);
        } else {
            out[k] = v;
        }
    }
    return out;
}

function writeLine(level, msg, meta) {
    if (JSON_MODE) {
        const rec = { ts: ts(), level, msg, ...(meta ? truncateStrings(meta) : {}) };
        const json = JSON.stringify(rec);
        try { fs.appendFileSync(LOG_FILE, json + '\n'); } catch { /* ignore */ }
        console.log(json);
    } else {
        const line = `${level.toUpperCase()} ${msg}${meta ? ' ' + safeMeta(meta) : ''}`;
        const out = `[${ts()}] ${line}`;
        try { fs.appendFileSync(LOG_FILE, out + '\n'); } catch { /* ignore */ }
        console.log(out);
    }
}

export const logger = {
    info: (msg, meta) => writeLine('info', msg, meta),
    warn: (msg, meta) => writeLine('warn', msg, meta),
    error: (msg, meta) => writeLine('error', msg, meta),
    event: (code, meta) => writeLine('evt', code, meta)
};

function safeMeta(meta) {
    try {
        return JSON.stringify(meta, (_, v) => {
            if (typeof v === 'string' && v.length > 400) return v.slice(0, 400) + '...';
            return v;
        });
    } catch { return ''; }
}

export default logger;
