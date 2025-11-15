/**
 * Database Migration Runner
 * Executes pending SQL migration files
 */

import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'community',
    multipleStatements: true
};

// Migration files to execute
const migrations = [
    {
        name: '007_create_notifications_table',
        path: path.join(__dirname, '../migrations/007_create_notifications_table.sql')
    },
    {
        name: '008_create_user_profile_v2',
        path: path.join(__dirname, '../migrations/008_create_user_profile_v2.sql')
    },
    {
        name: '009_create_dm_system',
        path: path.join(__dirname, '../migrations/009_create_dm_system.sql')
    },
    {
        name: '010_create_group_chat_system',
        path: path.join(__dirname, '../migrations/010_create_group_chat_system.sql')
    }
    // Skipped: 006_dashboard_schema - incompatible with current DB schema
];

async function runMigrations() {
    let connection;

    try {
        console.log('🔌 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database:', dbConfig.database);

        // Create migrations tracking table if not exists
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_migration_name (migration_name)
      )
    `);
        console.log('✅ Migrations tracking table ready');

        // Check and run each migration
        for (const migration of migrations) {
            console.log(`\n📄 Checking migration: ${migration.name}`);

            // Check if already executed
            const [rows] = await connection.execute(
                'SELECT * FROM schema_migrations WHERE migration_name = ?',
                [migration.name]
            );

            if (rows.length > 0) {
                console.log(`⏭️  Migration already executed: ${migration.name}`);
                continue;
            }

            // Read SQL file
            console.log(`📖 Reading: ${migration.path}`);
            const sql = await fs.readFile(migration.path, 'utf8');

            // Execute migration
            console.log(`⚙️  Executing migration: ${migration.name}...`);
            await connection.query(sql);

            // Record migration
            await connection.execute(
                'INSERT INTO schema_migrations (migration_name) VALUES (?)',
                [migration.name]
            );

            console.log(`✅ Migration completed: ${migration.name}`);
        }

        console.log('\n🎉 All migrations completed successfully!');

        // Show table summary
        console.log('\n📊 Database Tables:');
        const [tables] = await connection.query('SHOW TABLES');
        tables.forEach((table, index) => {
            const tableName = Object.values(table)[0];
            console.log(`   ${index + 1}. ${tableName}`);
        });

    } catch (error) {
        console.error('\n❌ Migration failed:');
        console.error('Error:', error.message);
        console.error('SQL State:', error.sqlState);
        console.error('Error Code:', error.code);
        console.error('Stack:', error.stack);

        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n💡 Tip: Check your database credentials in .env file');
            console.error('   DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 Tip: Make sure MySQL server is running');
            console.error('   Windows: net start MySQL80');
            console.error('   macOS: brew services start mysql');
        }

        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run migrations
console.log('🚀 Starting database migrations...\n');
runMigrations();
