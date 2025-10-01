const request = require('supertest');
const app = require('../../server-backend/api-server/server');
const { User } = require('../../server-backend/models/User');
const { Post } = require('../../server-backend/models/Post');

// 모의 객체 설정
jest.mock('../../server-backend/models/User');
jest.mock('../../server-backend/models/Post');

describe('Posts API Integration Tests', () => {
    let authToken;
    let testUser;

    beforeAll(async () => {
        // 테스트 사용자 생성
        testUser = {
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'user',
            status: 'active'
        };

        // 인증 토큰 생성
        const jwt = require('jsonwebtoken');
        authToken = jwt.sign(
            { userId: testUser.id, email: testUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/posts', () => {
        it('should return posts list with pagination', async () => {
            // Given
            const mockPosts = [
                {
                    id: 'post-1',
                    title: 'Test Post 1',
                    content: 'Test Content 1',
                    author_id: 'test-user-123',
                    category: 'technology',
                    views: 10,
                    likes: 5,
                    created_at: new Date('2024-09-28T10:00:00Z')
                },
                {
                    id: 'post-2',
                    title: 'Test Post 2',
                    content: 'Test Content 2',
                    author_id: 'test-user-123',
                    category: 'gaming',
                    views: 20,
                    likes: 10,
                    created_at: new Date('2024-09-28T11:00:00Z')
                }
            ];

            Post.query.mockReturnValue({
                withGraphFetched: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                offset: jest.fn().mockResolvedValue(mockPosts)
            });

            Post.query.mockResolvedValueOnce({ resultSize: 2 });

            // When
            const response = await request(app)
                .get('/api/posts?page=1&limit=10')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Then
            expect(response.body.success).toBe(true);
            expect(response.body.data.posts).toHaveLength(2);
            expect(response.body.data.pagination.page).toBe(1);
            expect(response.body.data.pagination.limit).toBe(10);
            expect(response.body.data.pagination.total).toBe(2);
        });

        it('should filter posts by category', async () => {
            // Given
            const mockPosts = [
                {
                    id: 'post-1',
                    title: 'Tech Post',
                    category: 'technology',
                    author_id: 'test-user-123'
                }
            ];

            Post.query.mockReturnValue({
                where: jest.fn().mockReturnThis(),
                withGraphFetched: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                offset: jest.fn().mockResolvedValue(mockPosts)
            });

            Post.query.mockResolvedValueOnce({ resultSize: 1 });

            // When
            const response = await request(app)
                .get('/api/posts?category=technology')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Then
            expect(response.body.success).toBe(true);
            expect(response.body.data.posts).toHaveLength(1);
            expect(response.body.data.posts[0].category).toBe('technology');
        });

        it('should search posts by keyword', async () => {
            // Given
            const mockPosts = [
                {
                    id: 'post-1',
                    title: 'React Tutorial',
                    content: 'Learn React basics',
                    author_id: 'test-user-123'
                }
            ];

            Post.query.mockReturnValue({
                whereRaw: jest.fn().mockReturnThis(),
                withGraphFetched: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                offset: jest.fn().mockResolvedValue(mockPosts)
            });

            Post.query.mockResolvedValueOnce({ resultSize: 1 });

            // When
            const response = await request(app)
                .get('/api/posts?search=react')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Then
            expect(response.body.success).toBe(true);
            expect(response.body.data.posts).toHaveLength(1);
        });

        it('should return 401 without authentication', async () => {
            // When
            const response = await request(app)
                .get('/api/posts')
                .expect(401);

            // Then
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('인증이 필요합니다.');
        });
    });

    describe('POST /api/posts', () => {
        it('should create a new post successfully', async () => {
            // Given
            const postData = {
                title: 'New Test Post',
                content: 'This is a test post content',
                category: 'technology',
                tags: ['test', 'javascript']
            };

            const mockPost = {
                id: 'new-post-123',
                ...postData,
                author_id: testUser.id,
                views: 0,
                likes: 0,
                created_at: new Date()
            };

            Post.query.mockReturnValue({
                insertAndFetch: jest.fn().mockResolvedValue(mockPost)
            });

            // When
            const response = await request(app)
                .post('/api/posts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(postData)
                .expect(201);

            // Then
            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(postData.title);
            expect(response.body.data.content).toBe(postData.content);
            expect(response.body.data.category).toBe(postData.category);
        });

        it('should return 400 for invalid post data', async () => {
            // Given
            const invalidPostData = {
                title: '', // 빈 제목
                content: 'Test content'
            };

            // When
            const response = await request(app)
                .post('/api/posts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidPostData)
                .expect(400);

            // Then
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('제목을 입력하세요');
        });

        it('should return 401 without authentication', async () => {
            // Given
            const postData = {
                title: 'Test Post',
                content: 'Test Content',
                category: 'technology'
            };

            // When
            const response = await request(app)
                .post('/api/posts')
                .send(postData)
                .expect(401);

            // Then
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('인증이 필요합니다.');
        });
    });

    describe('GET /api/posts/:id', () => {
        it('should return a specific post', async () => {
            // Given
            const postId = 'post-123';
            const mockPost = {
                id: postId,
                title: 'Test Post',
                content: 'Test Content',
                author_id: 'test-user-123',
                category: 'technology',
                views: 10,
                likes: 5,
                created_at: new Date()
            };

            Post.query.mockReturnValue({
                findById: jest.fn().mockReturnThis(),
                withGraphFetched: jest.fn().mockResolvedValue(mockPost)
            });

            // When
            const response = await request(app)
                .get(`/api/posts/${postId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Then
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(postId);
            expect(response.body.data.title).toBe('Test Post');
        });

        it('should return 404 for non-existent post', async () => {
            // Given
            const postId = 'non-existent-post';

            Post.query.mockReturnValue({
                findById: jest.fn().mockReturnThis(),
                withGraphFetched: jest.fn().mockResolvedValue(null)
            });

            // When
            const response = await request(app)
                .get(`/api/posts/${postId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            // Then
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('게시글을 찾을 수 없습니다.');
        });
    });

    describe('PUT /api/posts/:id', () => {
        it('should update a post successfully', async () => {
            // Given
            const postId = 'post-123';
            const updateData = {
                title: 'Updated Post Title',
                content: 'Updated content'
            };

            const mockPost = {
                id: postId,
                ...updateData,
                author_id: testUser.id,
                updated_at: new Date()
            };

            Post.query.mockReturnValue({
                findById: jest.fn().mockResolvedValue({
                    id: postId,
                    author_id: testUser.id
                })
            });

            Post.query.mockReturnValue({
                findById: jest.fn().mockReturnThis(),
                patch: jest.fn().mockResolvedValue(mockPost)
            });

            // When
            const response = await request(app)
                .put(`/api/posts/${postId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            // Then
            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(updateData.title);
            expect(response.body.data.content).toBe(updateData.content);
        });

        it('should return 403 for unauthorized update', async () => {
            // Given
            const postId = 'post-123';
            const updateData = {
                title: 'Updated Post Title'
            };

            Post.query.mockReturnValue({
                findById: jest.fn().mockResolvedValue({
                    id: postId,
                    author_id: 'other-user-123' // 다른 사용자의 게시글
                })
            });

            // When
            const response = await request(app)
                .put(`/api/posts/${postId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(403);

            // Then
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('게시글을 수정할 권한이 없습니다.');
        });
    });

    describe('DELETE /api/posts/:id', () => {
        it('should delete a post successfully', async () => {
            // Given
            const postId = 'post-123';

            Post.query.mockReturnValue({
                findById: jest.fn().mockResolvedValue({
                    id: postId,
                    author_id: testUser.id
                })
            });

            Post.query.mockReturnValue({
                findById: jest.fn().mockReturnThis(),
                patch: jest.fn().mockResolvedValue({ id: postId })
            });

            // When
            const response = await request(app)
                .delete(`/api/posts/${postId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Then
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('게시글이 삭제되었습니다.');
        });

        it('should return 404 for non-existent post', async () => {
            // Given
            const postId = 'non-existent-post';

            Post.query.mockReturnValue({
                findById: jest.fn().mockResolvedValue(null)
            });

            // When
            const response = await request(app)
                .delete(`/api/posts/${postId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            // Then
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('게시글을 찾을 수 없습니다.');
        });
    });

    describe('POST /api/posts/:id/like', () => {
        it('should like a post successfully', async () => {
            // Given
            const postId = 'post-123';
            const mockPost = {
                id: postId,
                likes: 5
            };

            Post.query.mockReturnValue({
                findById: jest.fn().mockResolvedValue(mockPost)
            });

            Post.query.mockReturnValue({
                findById: jest.fn().mockReturnThis(),
                patch: jest.fn().mockResolvedValue({ id: postId, likes: 6 })
            });

            // When
            const response = await request(app)
                .post(`/api/posts/${postId}/like`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Then
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('게시글에 좋아요를 눌렀습니다.');
        });

        it('should return 404 for non-existent post', async () => {
            // Given
            const postId = 'non-existent-post';

            Post.query.mockReturnValue({
                findById: jest.fn().mockResolvedValue(null)
            });

            // When
            const response = await request(app)
                .post(`/api/posts/${postId}/like`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            // Then
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('게시글을 찾을 수 없습니다.');
        });
    });
});
