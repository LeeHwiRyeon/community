#!/usr/bin/env node

import dotenv from 'dotenv';
import { ensureDatabase, initSchema, query } from '../src/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function setupDatabase() {
    console.log('🔄 Setting up database...');

    try {
        // 1. 데이터베이스 생성
        console.log('📦 Creating database if not exists...');
        await ensureDatabase();

        // 2. 스키마 초기화
        console.log('🏗️  Initializing schema...');
        await initSchema();

        // 3. 초기 데이터 삽입
        console.log('📝 Inserting initial data...');
        await insertInitialData();

        console.log('✅ Database setup complete!');
    } catch (error) {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    }
}

async function insertInitialData() {
    // 게시판 데이터
    const boardsPath = path.resolve(__dirname, '../../data/boards.json');
    const postsPath = path.resolve(__dirname, '../../data/posts.json');

    if (fs.existsSync(boardsPath)) {
        console.log('📋 Inserting boards...');
        const boards = JSON.parse(fs.readFileSync(boardsPath, 'utf-8'));
        for (const board of boards) {
            await query('INSERT IGNORE INTO boards(id,title,ordering) VALUES(?,?,?)',
                [board.id, board.title, board.order || 1000]);
        }
        console.log(`✅ Inserted ${boards.length} boards`);
    }

    if (fs.existsSync(postsPath)) {
        console.log('📄 Inserting posts...');
        const postsMap = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));
        let totalPosts = 0;

        for (const [boardId, posts] of Object.entries(postsMap)) {
            for (const post of posts) {
                await query('INSERT IGNORE INTO posts(id,board_id,title,content,date,tag,thumb,author,category) VALUES(?,?,?,?,?,?,?,?,?)', [
                    post.id, boardId, post.title, post.content || '', post.date || null,
                    post.tag || '', post.thumb || '', post.author || '익명', post.category || ''
                ]);
                totalPosts++;
            }
        }
        console.log(`✅ Inserted ${totalPosts} posts`);
    }

    // 기본 사용자 생성 (관리자)
    console.log('👤 Creating default admin user...');
    try {
        await query('INSERT IGNORE INTO users(display_name, email, role) VALUES(?, ?, ?)',
            ['관리자', 'admin@community.local', 'admin']);
        console.log('✅ Default admin user created');
    } catch (error) {
        console.log('⚠️  Admin user creation skipped (may already exist)');
    }
}

// CLI 실행
if (process.argv[1] && process.argv[1].endsWith('setup-db.js')) {
    setupDatabase();
}

export default setupDatabase;