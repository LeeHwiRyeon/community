import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../server.js';
import {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    TranslationError,
    globalErrorHandler,
    notFoundHandler,
    asyncHandler
} from '../middleware/errorHandler.js';

describe('Error Handler Middleware', () => {
    let app;
    let server;

    beforeEach(async () => {
        app = createApp();
        server = app.listen(0);
    });

    afterEach(() => {
        if (server) {
            server.close();
        }
    });

    describe('Custom Error Classes', () => {
        it('should create AppError with default values', () => {
            const error = new AppError('Test error');
            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(500);
            expect(error.code).toBe('APP_ERROR');
            expect(error.isOperational).toBe(true);
        });

        it('should create AppError with custom values', () => {
            const error = new AppError('Custom error', 400, 'CUSTOM_ERROR');
            expect(error.message).toBe('Custom error');
            expect(error.statusCode).toBe(400);
            expect(error.code).toBe('CUSTOM_ERROR');
        });

        it('should create ValidationError', () => {
            const error = new ValidationError('Validation failed');
            expect(error.message).toBe('Validation failed');
            expect(error.statusCode).toBe(400);
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.name).toBe('ValidationError');
        });

        it('should create AuthenticationError', () => {
            const error = new AuthenticationError();
            expect(error.message).toBe('Authentication required');
            expect(error.statusCode).toBe(401);
            expect(error.code).toBe('AUTHENTICATION_ERROR');
        });

        it('should create AuthorizationError', () => {
            const error = new AuthorizationError();
            expect(error.message).toBe('Insufficient permissions');
            expect(error.statusCode).toBe(403);
            expect(error.code).toBe('AUTHORIZATION_ERROR');
        });

        it('should create NotFoundError', () => {
            const error = new NotFoundError();
            expect(error.message).toBe('Resource not found');
            expect(error.statusCode).toBe(404);
            expect(error.code).toBe('NOT_FOUND');
        });

        it('should create ConflictError', () => {
            const error = new ConflictError();
            expect(error.message).toBe('Resource conflict');
            expect(error.statusCode).toBe(409);
            expect(error.code).toBe('CONFLICT');
        });

        it('should create RateLimitError', () => {
            const error = new RateLimitError();
            expect(error.message).toBe('Rate limit exceeded');
            expect(error.statusCode).toBe(429);
            expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
        });

        it('should create TranslationError', () => {
            const error = new TranslationError();
            expect(error.message).toBe('Translation failed');
            expect(error.statusCode).toBe(500);
            expect(error.code).toBe('TRANSLATION_ERROR');
        });
    });

    describe('Global Error Handler', () => {
        it('should handle generic errors', async () => {
            app.get('/test-error', (req, res, next) => {
                throw new Error('Test error');
            });

            const response = await request(app).get('/test-error');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toBe('Test error');
            expect(response.body.error.code).toBe('INTERNAL_ERROR');
        });

        it('should handle AppError', async () => {
            app.get('/test-app-error', (req, res, next) => {
                throw new AppError('App error', 400, 'APP_ERROR');
            });

            const response = await request(app).get('/test-app-error');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toBe('App error');
            expect(response.body.error.code).toBe('APP_ERROR');
        });

        it('should handle ValidationError', async () => {
            app.get('/test-validation-error', (req, res, next) => {
                throw new ValidationError('Validation failed');
            });

            const response = await request(app).get('/test-validation-error');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toBe('Validation failed');
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should handle AuthenticationError', async () => {
            app.get('/test-auth-error', (req, res, next) => {
                throw new AuthenticationError();
            });

            const response = await request(app).get('/test-auth-error');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
        });

        it('should handle AuthorizationError', async () => {
            app.get('/test-authz-error', (req, res, next) => {
                throw new AuthorizationError();
            });

            const response = await request(app).get('/test-authz-error');

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTHORIZATION_ERROR');
        });

        it('should handle NotFoundError', async () => {
            app.get('/test-not-found-error', (req, res, next) => {
                throw new NotFoundError();
            });

            const response = await request(app).get('/test-not-found-error');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NOT_FOUND');
        });

        it('should handle ConflictError', async () => {
            app.get('/test-conflict-error', (req, res, next) => {
                throw new ConflictError();
            });

            const response = await request(app).get('/test-conflict-error');

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('CONFLICT');
        });

        it('should handle RateLimitError', async () => {
            app.get('/test-rate-limit-error', (req, res, next) => {
                throw new RateLimitError();
            });

            const response = await request(app).get('/test-rate-limit-error');

            expect(response.status).toBe(429);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
        });

        it('should handle TranslationError', async () => {
            app.get('/test-translation-error', (req, res, next) => {
                throw new TranslationError();
            });

            const response = await request(app).get('/test-translation-error');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('TRANSLATION_ERROR');
        });

        it('should include stack trace in development', async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            app.get('/test-dev-error', (req, res, next) => {
                throw new Error('Development error');
            });

            const response = await request(app).get('/test-dev-error');

            expect(response.status).toBe(500);
            expect(response.body.error.stack).toBeDefined();

            process.env.NODE_ENV = originalEnv;
        });

        it('should not include stack trace in production', async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            app.get('/test-prod-error', (req, res, next) => {
                throw new Error('Production error');
            });

            const response = await request(app).get('/test-prod-error');

            expect(response.status).toBe(500);
            expect(response.body.error.stack).toBeUndefined();
            expect(response.body.error.message).toBe('An error occurred');

            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('Not Found Handler', () => {
        it('should handle 404 for undefined routes', async () => {
            const response = await request(app).get('/undefined-route');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toBe('Route not found');
            expect(response.body.error.code).toBe('NOT_FOUND');
        });
    });

    describe('Async Handler', () => {
        it('should catch async errors', async () => {
            app.get('/test-async-error', asyncHandler(async (req, res) => {
                throw new Error('Async error');
            }));

            const response = await request(app).get('/test-async-error');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toBe('Async error');
        });

        it('should handle successful async operations', async () => {
            app.get('/test-async-success', asyncHandler(async (req, res) => {
                res.json({ success: true, message: 'Success' });
            }));

            const response = await request(app).get('/test-async-success');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Success');
        });
    });
});
