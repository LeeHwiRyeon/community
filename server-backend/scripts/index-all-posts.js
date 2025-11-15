/**
 * 게시물 Elasticsearch 대량 인덱싱 스크립트
 * 
 * MySQL 데이터베이스의 모든 게시물을 Elasticsearch에 인덱싱합니다.
 * 초기 데이터 마이그레이션이나 재인덱싱 시 사용합니다.
 * 
 * 사용법:
 *   node scripts/index-all-posts.js
 */

import mysql from 'mysql2/promise';
import searchService from '../src/services/search-service.js';
import * as dotenv from 'dotenv';

dotenv.config();

// 데이터베이스 연결 설정
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'community_platform'
};

async function indexAllPosts() {
    let connection;

    try {
        console.log('🚀 게시물 인덱싱 시작...');

        // Elasticsearch 초기화
        await searchService.initialize();
        console.log('✅ Elasticsearch 연결 성공');

        // MySQL 연결
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ MySQL 연결 성공');

        // 게시물 조회 (JOIN으로 작성자 이름 포함)
        const [rows] = await connection.query(`
      SELECT 
        p.id,
        p.title,
        p.content,
        p.category,
        p.tags,
        p.author_id,
        u.username as author_name,
        p.view_count,
        p.like_count,
        p.comment_count,
        p.created_at,
        p.updated_at
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.deleted_at IS NULL
      ORDER BY p.id ASC
    `);

        const posts = rows;
        console.log(`📊 총 ${posts.length}개의 게시물을 찾았습니다.`);

        if (posts.length === 0) {
            console.log('ℹ️  인덱싱할 게시물이 없습니다.');
            return;
        }

        // 배치 단위로 인덱싱 (1000개씩)
        const batchSize = 1000;
        let indexed = 0;

        for (let i = 0; i < posts.length; i += batchSize) {
            const batch = posts.slice(i, i + batchSize);

            // 태그 파싱 (JSON 문자열 → 배열)
            const processedBatch = batch.map(post => ({
                ...post,
                tags: post.tags ? JSON.parse(post.tags) : []
            }));

            await searchService.bulkIndexPosts(processedBatch);
            indexed += batch.length;

            console.log(`⏳ 진행: ${indexed}/${posts.length} (${Math.round(indexed / posts.length * 100)}%)`);
        }

        console.log('✅ 모든 게시물 인덱싱 완료!');

        // 통계 출력
        console.log('\n📈 인덱싱 통계:');
        console.log(`  - 총 게시물 수: ${posts.length}`);
        console.log(`  - 인덱싱 완료: ${indexed}`);
        console.log(`  - 배치 크기: ${batchSize}`);
        console.log(`  - 배치 수: ${Math.ceil(posts.length / batchSize)}`);

    } catch (error) {
        console.error('❌ 인덱싱 실패:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 MySQL 연결 종료');
        }
    }
}

// 스크립트 실행
indexAllPosts()
    .then(() => {
        console.log('\n✅ 스크립트 실행 완료');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ 스크립트 실행 실패:', error);
        process.exit(1);
    });
