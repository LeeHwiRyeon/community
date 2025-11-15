/**
 * Elasticsearch Client Configuration
 * 
 * Elasticsearch 연결 설정 및 클라이언트 관리
 * - 싱글톤 패턴으로 Elasticsearch 연결 관리
 * - 자동 재연결 및 에러 핸들링
 * - 인덱스 생성 및 매핑 설정
 */

import { Client } from '@elastic/elasticsearch';

class ElasticsearchClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.indices = {
            posts: 'community_posts',
            comments: 'community_comments'
        };
    }

    /**
     * Elasticsearch 클라이언트 초기화 및 연결
     */
    async connect() {
        if (this.isConnected && this.client) {
            console.log('✅ Elasticsearch already connected');
            return this.client;
        }

        try {
            // Elasticsearch 연결 설정
            const esConfig = {
                node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
                maxRetries: 5,
                requestTimeout: 60000,
                sniffOnStart: false,
            };

            // Elasticsearch 클라이언트 생성
            this.client = new Client(esConfig);

            // 연결 테스트
            const health = await this.client.cluster.health();
            console.log(`✅ Elasticsearch connected (Status: ${health.status})`);
            this.isConnected = true;

            // 인덱스 초기화
            await this.initializeIndices();

            return this.client;
        } catch (error) {
            console.error('❌ Elasticsearch connection failed:', error.message);
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * 인덱스 초기화 (매핑 설정)
     */
    async initializeIndices() {
        try {
            await this.createPostsIndex();
            await this.createCommentsIndex();
            console.log('✅ Elasticsearch indices initialized');
        } catch (error) {
            console.error('❌ Failed to initialize indices:', error.message);
        }
    }

    /**
     * 게시글 인덱스 생성
     */
    async createPostsIndex() {
        const indexName = this.indices.posts;

        try {
            const exists = await this.client.indices.exists({ index: indexName });

            if (exists) {
                console.log(`📋 Index ${indexName} already exists`);
                return;
            }

            await this.client.indices.create({
                index: indexName,
                body: {
                    settings: {
                        number_of_shards: 1,
                        number_of_replicas: 0,
                        analysis: {
                            analyzer: {
                                korean_analyzer: {
                                    type: 'custom',
                                    tokenizer: 'standard',
                                    filter: ['lowercase']
                                }
                            }
                        }
                    },
                    mappings: {
                        properties: {
                            id: { type: 'keyword' },
                            board_id: { type: 'keyword' },
                            user_id: { type: 'integer' },
                            username: { type: 'keyword' },
                            title: {
                                type: 'text',
                                analyzer: 'korean_analyzer',
                                fields: {
                                    keyword: { type: 'keyword' }
                                }
                            },
                            content: {
                                type: 'text',
                                analyzer: 'korean_analyzer'
                            },
                            tags: { type: 'keyword' },
                            category: { type: 'keyword' },
                            is_published: { type: 'boolean' },
                            is_pinned: { type: 'boolean' },
                            view_count: { type: 'integer' },
                            like_count: { type: 'integer' },
                            comment_count: { type: 'integer' },
                            created_at: { type: 'date' },
                            updated_at: { type: 'date' }
                        }
                    }
                }
            });

            console.log(`✅ Created index: ${indexName}`);
        } catch (error) {
            console.error(`❌ Failed to create index ${indexName}:`, error.message);
            throw error;
        }
    }

    /**
     * 댓글 인덱스 생성
     */
    async createCommentsIndex() {
        const indexName = this.indices.comments;

        try {
            const exists = await this.client.indices.exists({ index: indexName });

            if (exists) {
                console.log(`📋 Index ${indexName} already exists`);
                return;
            }

            await this.client.indices.create({
                index: indexName,
                body: {
                    settings: {
                        number_of_shards: 1,
                        number_of_replicas: 0,
                        analysis: {
                            analyzer: {
                                korean_analyzer: {
                                    type: 'custom',
                                    tokenizer: 'standard',
                                    filter: ['lowercase']
                                }
                            }
                        }
                    },
                    mappings: {
                        properties: {
                            id: { type: 'keyword' },
                            post_id: { type: 'keyword' },
                            user_id: { type: 'integer' },
                            username: { type: 'keyword' },
                            content: {
                                type: 'text',
                                analyzer: 'korean_analyzer'
                            },
                            parent_id: { type: 'keyword' },
                            is_deleted: { type: 'boolean' },
                            created_at: { type: 'date' },
                            updated_at: { type: 'date' }
                        }
                    }
                }
            });

            console.log(`✅ Created index: ${indexName}`);
        } catch (error) {
            console.error(`❌ Failed to create index ${indexName}:`, error.message);
            throw error;
        }
    }

    /**
     * Elasticsearch 클라이언트 가져오기
     */
    getClient() {
        if (!this.client || !this.isConnected) {
            throw new Error('Elasticsearch client not connected. Call connect() first.');
        }
        return this.client;
    }

    /**
     * 연결 종료
     */
    async disconnect() {
        if (this.client && this.isConnected) {
            try {
                await this.client.close();
                console.log('✅ Elasticsearch connection closed');
                this.isConnected = false;
                this.client = null;
            } catch (error) {
                console.error('❌ Error closing Elasticsearch connection:', error.message);
                this.isConnected = false;
                this.client = null;
            }
        }
    }

    /**
     * 연결 상태 확인
     */
    isReady() {
        return this.isConnected && this.client !== null;
    }

    /**
     * 클러스터 상태 확인
     */
    async getClusterHealth() {
        try {
            const client = this.getClient();
            return await client.cluster.health();
        } catch (error) {
            console.error('❌ Error getting cluster health:', error.message);
            return null;
        }
    }

    /**
     * 인덱스 통계
     */
    async getIndexStats(indexName) {
        try {
            const client = this.getClient();
            return await client.indices.stats({ index: indexName });
        } catch (error) {
            console.error(`❌ Error getting stats for ${indexName}:`, error.message);
            return null;
        }
    }

    /**
     * 인덱스 삭제 (개발 환경에서만)
     */
    async deleteIndex(indexName) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Cannot delete index in production');
        }

        try {
            const client = this.getClient();
            await client.indices.delete({ index: indexName });
            console.log(`✅ Deleted index: ${indexName}`);
        } catch (error) {
            console.error(`❌ Failed to delete index ${indexName}:`, error.message);
            throw error;
        }
    }

    /**
     * 모든 인덱스 리빌드 (개발 환경에서만)
     */
    async rebuildIndices() {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Cannot rebuild indices in production');
        }

        try {
            // 기존 인덱스 삭제
            for (const indexName of Object.values(this.indices)) {
                const exists = await this.client.indices.exists({ index: indexName });
                if (exists) {
                    await this.deleteIndex(indexName);
                }
            }

            // 인덱스 재생성
            await this.initializeIndices();
            console.log('✅ All indices rebuilt');
        } catch (error) {
            console.error('❌ Failed to rebuild indices:', error.message);
            throw error;
        }
    }
}

// 싱글톤 인스턴스 생성
const elasticsearchClient = new ElasticsearchClient();

export default elasticsearchClient;
