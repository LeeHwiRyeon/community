/**
 * SQLite Schema Fix
 * Adds missing columns to existing tables
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data', 'community.db');

async function fixSchema() {
    console.log('🔧 SQLite Schema Fix Starting...\n');

    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    try {
        // Check if tag column exists
        const userColumns = await db.all("PRAGMA table_info(users)");
        const hasTag = userColumns.some(col => col.name === 'tag');

        if (!hasTag) {
            console.log('➕ Adding tag column to users table...');
            await db.exec(`
                ALTER TABLE users ADD COLUMN tag TEXT;
            `);

            // Generate unique tags for existing users
            const users = await db.all('SELECT username FROM users');
            for (const user of users) {
                const tag = Math.floor(1000 + Math.random() * 9000).toString();
                await db.run(
                    'UPDATE users SET tag = ? WHERE username = ?',
                    [tag, user.username]
                );
            }
            console.log('✅ Tag column added and populated');
        } else {
            console.log('✓ Tag column already exists');
        }

        // Check if notifications has tag column (if needed)
        const notifColumns = await db.all("PRAGMA table_info(notifications)");
        const notifHasTag = notifColumns.some(col => col.name === 'tag');

        if (!notifHasTag) {
            console.log('➕ Adding tag column to notifications table...');
            await db.exec(`
                ALTER TABLE notifications ADD COLUMN tag TEXT;
            `);
            console.log('✅ Tag column added to notifications');
        } else {
            console.log('✓ Tag column already exists in notifications');
        }

        // Create index on username for better performance
        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
            CREATE INDEX IF NOT EXISTS idx_users_tag ON users(tag);
        `);
        console.log('✅ Indexes created');

        console.log('\n🎉 Schema fix completed successfully!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await db.close();
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    fixSchema().catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
}

export default fixSchema;
