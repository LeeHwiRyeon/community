import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getPool, initSchema, query } from '../src/db.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function main() {
    await initSchema();
    const boardsPath = path.resolve(__dirname, '../../data/boards.json');
    const postsPath = path.resolve(__dirname, '../../data/posts.json');
    const boards = JSON.parse(fs.readFileSync(boardsPath, 'utf-8'));
    const postsMap = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));

    // Insert boards
    for (const b of boards) {
        await query('INSERT IGNORE INTO boards(id,title,ordering) VALUES(?,?,?)', [b.id, b.title, b.order || 1000]);
    }
    let count = 0;
    for (const [bid, arr] of Object.entries(postsMap)) {
        for (const p of arr) {
            await query('INSERT IGNORE INTO posts(id,board_id,title,content,date,tag,thumb,author,category) VALUES(?,?,?,?,?,?,?,?,?)', [
                p.id, bid, p.title, p.content || '', p.date || null, p.tag || '', p.thumb || '', p.author || '익명', p.category || ''
            ]);
            count++;
        }
    }
    console.log('Import complete boards=', boards.length, 'posts=', count);
}
// CLI 실행 시만 직접 호출
if (process.argv[1] && process.argv[1].endsWith('import-initial.js')) {
    main().catch(e => { console.error(e); process.exit(1); });
}

export default main;
