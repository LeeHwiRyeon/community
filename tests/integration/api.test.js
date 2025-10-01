const request = require('supertest');
const app = require('../../server-backend/app');
const mongoose = require('mongoose');
const User = require('../../server-backend/src/models/User');
const Todo = require('../../server-backend/src/models/Todo');

describe('API Integration Tests', () => {
    let authToken;
    let testUser;
    let testTodo;

    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/community_test');

        // Create test user
        testUser = new User({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        });
        await testUser.save();

        // Get auth token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });

        authToken = loginResponse.body.data.token;
    });

    afterAll(async () => {
        // Clean up test data
        await User.deleteMany({});
        await Todo.deleteMany({});
        await mongoose.connection.close();
    });

    describe('Authentication API', () => {
        test('POST /api/auth/register - should create new user', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'New User',
                    email: 'newuser@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe('newuser@example.com');
        });

        test('POST /api/auth/login - should authenticate user', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();
        });

        test('POST /api/auth/login - should reject invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('TODO API', () => {
        beforeEach(async () => {
            // Create test TODO
            testTodo = new Todo({
                title: 'Test TODO',
                description: 'Test description',
                assignee: testUser._id,
                creator: testUser._id,
                priority: 3,
                category: 'feature'
            });
            await testTodo.save();
        });

        afterEach(async () => {
            await Todo.deleteMany({});
        });

        test('GET /api/todos - should return todos list', async () => {
            const response = await request(app)
                .get('/api/todos')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.pagination).toBeDefined();
        });

        test('POST /api/todos - should create new todo', async () => {
            const todoData = {
                title: 'New Test TODO',
                description: 'New test description',
                assignee: testUser._id.toString(),
                priority: 4,
                category: 'bug'
            };

            const response = await request(app)
                .post('/api/todos')
                .set('Authorization', `Bearer ${authToken}`)
                .send(todoData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(todoData.title);
        });

        test('GET /api/todos/:id - should return specific todo', async () => {
            const response = await request(app)
                .get(`/api/todos/${testTodo._id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data._id).toBe(testTodo._id.toString());
        });

        test('PUT /api/todos/:id - should update todo', async () => {
            const updateData = {
                title: 'Updated Test TODO',
                status: 'in_progress'
            };

            const response = await request(app)
                .put(`/api/todos/${testTodo._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(updateData.title);
            expect(response.body.data.status).toBe(updateData.status);
        });

        test('PATCH /api/todos/:id/status - should change todo status', async () => {
            const response = await request(app)
                .patch(`/api/todos/${testTodo._id}/status`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ status: 'completed' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('completed');
        });

        test('POST /api/todos/:id/comments - should add comment', async () => {
            const commentData = {
                content: 'Test comment'
            };

            const response = await request(app)
                .post(`/api/todos/${testTodo._id}/comments`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(commentData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.comments).toHaveLength(1);
        });

        test('DELETE /api/todos/:id - should delete todo', async () => {
            const response = await request(app)
                .delete(`/api/todos/${testTodo._id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Verify todo is deleted
            const getResponse = await request(app)
                .get(`/api/todos/${testTodo._id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(getResponse.status).toBe(404);
        });
    });

    describe('File Upload API', () => {
        test('POST /api/upload - should upload file', async () => {
            const response = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from('test file content'), 'test.txt');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.file).toBeDefined();
        });

        test('GET /api/upload - should list user files', async () => {
            const response = await request(app)
                .get('/api/upload')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.files).toBeInstanceOf(Array);
        });
    });

    describe('Error Handling', () => {
        test('should return 401 for unauthorized requests', async () => {
            const response = await request(app)
                .get('/api/todos');

            expect(response.status).toBe(401);
        });

        test('should return 400 for invalid data', async () => {
            const response = await request(app)
                .post('/api/todos')
                .set('Authorization', `Bearer ${authToken}`)
                .send({}); // Empty data

            expect(response.status).toBe(400);
        });

        test('should return 404 for non-existent resources', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/todos/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
        });
    });
});
