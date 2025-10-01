const PostService = require('../../server-backend/api-server/services/postService');
const mysql = require('mysql2/promise');

// Mock 데이터베이스 연결
jest.mock('mysql2/promise');

describe('PostService', () => {
    let postService;
    let mockConnection;
    let mockQuery;

    beforeEach(() => {
        mockQuery = jest.fn();
        mockConnection = {
            execute: mockQuery,
        };
        postService = new PostService(mockConnection);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getPosts', () => {
        it('should return posts with pagination', async () => {
            const mockPosts = [
                {
                    id: '1',
                    title: 'Test Post 1',
                    content: 'Content 1',
                    author_id: 'user1',
                    board_id: 'board1',
                    created_at: '2024-07-29T10:00:00Z',
                },
                {
                    id: '2',
                    title: 'Test Post 2',
                    content: 'Content 2',
                    author_id: 'user2',
                    board_id: 'board1',
                    created_at: '2024-07-29T11:00:00Z',
                },
            ];

            mockQuery.mockResolvedValue([mockPosts]);

            const result = await postService.getPosts({ page: 1, limit: 10 });

            expect(result).toEqual(mockPosts);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('SELECT'),
                expect.any(Array)
            );
        });

        it('should handle database errors', async () => {
            mockQuery.mockRejectedValue(new Error('Database connection failed'));

            await expect(postService.getPosts({ page: 1, limit: 10 }))
                .rejects
                .toThrow('Database connection failed');
        });

        it('should apply search filters', async () => {
            const mockPosts = [];
            mockQuery.mockResolvedValue([mockPosts]);

            await postService.getPosts({
                page: 1,
                limit: 10,
                search: 'test',
                category: 'tech'
            });

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('WHERE'),
                expect.arrayContaining(['%test%', 'tech'])
            );
        });
    });

    describe('getPostById', () => {
        it('should return a single post', async () => {
            const mockPost = {
                id: '1',
                title: 'Test Post',
                content: 'Test Content',
                author_id: 'user1',
                board_id: 'board1',
            };

            mockQuery.mockResolvedValue([[mockPost]]);

            const result = await postService.getPostById('1');

            expect(result).toEqual(mockPost);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('SELECT'),
                ['1']
            );
        });

        it('should return null for non-existent post', async () => {
            mockQuery.mockResolvedValue([[]]);

            const result = await postService.getPostById('999');

            expect(result).toBeNull();
        });
    });

    describe('createPost', () => {
        it('should create a new post', async () => {
            const postData = {
                title: 'New Post',
                content: 'New Content',
                author_id: 'user1',
                board_id: 'board1',
                category: 'tech',
                tags: ['javascript', 'nodejs'],
            };

            mockQuery.mockResolvedValue([{ insertId: '123' }]);

            const result = await postService.createPost(postData);

            expect(result).toEqual({ id: '123', ...postData });
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('INSERT'),
                expect.arrayContaining([
                    postData.title,
                    postData.content,
                    postData.author_id,
                    postData.board_id,
                    postData.category,
                    JSON.stringify(postData.tags),
                ])
            );
        });

        it('should handle creation errors', async () => {
            const postData = {
                title: 'New Post',
                content: 'New Content',
                author_id: 'user1',
                board_id: 'board1',
            };

            mockQuery.mockRejectedValue(new Error('Duplicate entry'));

            await expect(postService.createPost(postData))
                .rejects
                .toThrow('Duplicate entry');
        });
    });

    describe('updatePost', () => {
        it('should update an existing post', async () => {
            const postId = '1';
            const updateData = {
                title: 'Updated Post',
                content: 'Updated Content',
            };

            mockQuery.mockResolvedValue([{ affectedRows: 1 }]);

            const result = await postService.updatePost(postId, updateData);

            expect(result).toBe(true);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE'),
                expect.arrayContaining([updateData.title, updateData.content, postId])
            );
        });

        it('should return false for non-existent post', async () => {
            const postId = '999';
            const updateData = { title: 'Updated Post' };

            mockQuery.mockResolvedValue([{ affectedRows: 0 }]);

            const result = await postService.updatePost(postId, updateData);

            expect(result).toBe(false);
        });
    });

    describe('deletePost', () => {
        it('should soft delete a post', async () => {
            const postId = '1';

            mockQuery.mockResolvedValue([{ affectedRows: 1 }]);

            const result = await postService.deletePost(postId);

            expect(result).toBe(true);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE'),
                expect.arrayContaining([postId])
            );
        });

        it('should return false for non-existent post', async () => {
            const postId = '999';

            mockQuery.mockResolvedValue([{ affectedRows: 0 }]);

            const result = await postService.deletePost(postId);

            expect(result).toBe(false);
        });
    });

    describe('incrementViewCount', () => {
        it('should increment view count', async () => {
            const postId = '1';

            mockQuery.mockResolvedValue([{ affectedRows: 1 }]);

            const result = await postService.incrementViewCount(postId);

            expect(result).toBe(true);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE'),
                [postId]
            );
        });
    });

    describe('getPostsByAuthor', () => {
        it('should return posts by specific author', async () => {
            const authorId = 'user1';
            const mockPosts = [
                { id: '1', title: 'Post 1', author_id: authorId },
                { id: '2', title: 'Post 2', author_id: authorId },
            ];

            mockQuery.mockResolvedValue([mockPosts]);

            const result = await postService.getPostsByAuthor(authorId, { page: 1, limit: 10 });

            expect(result).toEqual(mockPosts);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('WHERE author_id = ?'),
                expect.arrayContaining([authorId])
            );
        });
    });

    describe('getPostsByBoard', () => {
        it('should return posts by specific board', async () => {
            const boardId = 'board1';
            const mockPosts = [
                { id: '1', title: 'Post 1', board_id: boardId },
                { id: '2', title: 'Post 2', board_id: boardId },
            ];

            mockQuery.mockResolvedValue([mockPosts]);

            const result = await postService.getPostsByBoard(boardId, { page: 1, limit: 10 });

            expect(result).toEqual(mockPosts);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('WHERE board_id = ?'),
                expect.arrayContaining([boardId])
            );
        });
    });

    describe('searchPosts', () => {
        it('should search posts by keyword', async () => {
            const keyword = 'javascript';
            const mockPosts = [
                { id: '1', title: 'JavaScript Tutorial', content: 'Learn JavaScript' },
            ];

            mockQuery.mockResolvedValue([mockPosts]);

            const result = await postService.searchPosts(keyword, { page: 1, limit: 10 });

            expect(result).toEqual(mockPosts);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('LIKE'),
                expect.arrayContaining([`%${keyword}%`])
            );
        });
    });

    describe('getPopularPosts', () => {
        it('should return popular posts', async () => {
            const mockPosts = [
                { id: '1', title: 'Popular Post 1', like_count: 100 },
                { id: '2', title: 'Popular Post 2', like_count: 90 },
            ];

            mockQuery.mockResolvedValue([mockPosts]);

            const result = await postService.getPopularPosts({ limit: 10 });

            expect(result).toEqual(mockPosts);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('ORDER BY'),
                expect.any(Array)
            );
        });
    });

    describe('getRecentPosts', () => {
        it('should return recent posts', async () => {
            const mockPosts = [
                { id: '1', title: 'Recent Post 1', created_at: '2024-07-29T12:00:00Z' },
                { id: '2', title: 'Recent Post 2', created_at: '2024-07-29T11:00:00Z' },
            ];

            mockQuery.mockResolvedValue([mockPosts]);

            const result = await postService.getRecentPosts({ limit: 10 });

            expect(result).toEqual(mockPosts);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('ORDER BY created_at DESC'),
                expect.any(Array)
            );
        });
    });
});
