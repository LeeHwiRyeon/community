/**
 * Add tag column to posts table
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data', 'community.db');

async function addTagColumn() {
    console.log('🔧 Adding tag column to posts table...\n');

    const db = new Database(dbPath);

    try {
        // Check if tag column exists
        const columns = db.prepare("PRAGMA table_info(posts)").all();
        const hasTag = columns.some(col => col.name === 'tag');

        if (!hasTag) {
            console.log('➕ Adding tag column to posts table...');
            db.exec(`
                ALTER TABLE posts ADD COLUMN tag TEXT;
            `);
            console.log('✅ Tag column added to posts');

            // Set default value for existing mock posts if any
            const result = db.prepare("UPDATE posts SET tag = 'mock' WHERE tag IS NULL AND created_at < datetime('now', '-7 days')").run();
            console.log(`✅ Updated ${result.changes} existing posts`);
        } else {
            console.log('✓ Tag column already exists in posts');
        }

        console.log('\n🎉 Posts table update completed!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        db.close();
    }
}

addTagColumn().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
