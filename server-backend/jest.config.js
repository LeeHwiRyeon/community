export default {
    preset: null,
    testEnvironment: 'node',
    extensionsToTreatAsEsm: [],
    injectGlobals: true,
    globals: {
        'ts-jest': {
            useESM: true,
        },
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {},
    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.js',
        '<rootDir>/src/**/*.test.js',
        '<rootDir>/tests/**/*.test.js'
    ],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/index.js',
        '!src/server.js',
        '!src/**/__tests__/**',
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testTimeout: 10000, // Increase timeout for async tests
};