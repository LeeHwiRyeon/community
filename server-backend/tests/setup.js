// Jest setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_JSON = '1';

// Global test utilities
global.testUtils = {
    createMockRequest: (overrides = {}) => ({
        method: 'GET',
        url: '/test',
        headers: {},
        body: {},
        ...overrides
    }),

    createMockResponse: () => {
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            setHeader: jest.fn().mockReturnThis(),
            getHeader: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
        };
        return res;
    },

    createMockNext: () => jest.fn(),
};