// Page-Level Test Configuration
// Centralized configuration for all page-level tests

import { TestConfig } from './types';

export interface TestEnvironment {
    name: string;
    baseUrl: string;
    timeout: number;
    headless: boolean;
    viewport: {
        width: number;
        height: number;
    };
    userAgent?: string;
}

export interface TestSuiteConfig {
    name: string;
    enabled: boolean;
    timeout: number;
    retries: number;
    parallel: boolean;
    tags: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface TestDataConfig {
    mockApi: boolean;
    useRealData: boolean;
    dataPath: string;
    cleanupAfter: boolean;
}

export const testEnvironments: Record<string, TestEnvironment> = {
    development: {
        name: 'Development',
        baseUrl: 'http://localhost:5002',
        timeout: 30000,
        headless: true,
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },

    staging: {
        name: 'Staging',
        baseUrl: 'https://staging.example.com',
        timeout: 45000,
        headless: true,
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },

    production: {
        name: 'Production',
        baseUrl: 'https://example.com',
        timeout: 60000,
        headless: true,
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },

    mobile: {
        name: 'Mobile',
        baseUrl: 'http://localhost:5002',
        timeout: 30000,
        headless: true,
        viewport: { width: 375, height: 667 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    },

    tablet: {
        name: 'Tablet',
        baseUrl: 'http://localhost:5002',
        timeout: 30000,
        headless: true,
        viewport: { width: 768, height: 1024 },
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    }
};

export const testSuiteConfigs: Record<string, TestSuiteConfig> = {
    ActionTestPage: {
        name: 'ActionTestPage',
        enabled: true,
        timeout: 30000,
        retries: 2,
        parallel: false,
        tags: ['action', 'test', 'page'],
        priority: 'high'
    },

    AnalyticsDashboard: {
        name: 'AnalyticsDashboard',
        enabled: true,
        timeout: 45000,
        retries: 2,
        parallel: false,
        tags: ['analytics', 'dashboard', 'charts'],
        priority: 'high'
    },

    BulkActionsPanel: {
        name: 'BulkActionsPanel',
        enabled: true,
        timeout: 60000,
        retries: 3,
        parallel: false,
        tags: ['bulk', 'actions', 'panel'],
        priority: 'medium'
    },

    SchedulerDashboard: {
        name: 'SchedulerDashboard',
        enabled: true,
        timeout: 60000,
        retries: 2,
        parallel: false,
        tags: ['scheduler', 'dashboard', 'time'],
        priority: 'medium'
    },

    TemplateDashboard: {
        name: 'TemplateDashboard',
        enabled: true,
        timeout: 45000,
        retries: 2,
        parallel: false,
        tags: ['templates', 'dashboard', 'workflow'],
        priority: 'medium'
    },

    AdvancedActionDashboard: {
        name: 'AdvancedActionDashboard',
        enabled: true,
        timeout: 90000,
        retries: 3,
        parallel: false,
        tags: ['advanced', 'dashboard', 'comprehensive'],
        priority: 'critical'
    },

    HomePage: {
        name: 'HomePage',
        enabled: true,
        timeout: 30000,
        retries: 2,
        parallel: false,
        tags: ['home', 'page', 'main'],
        priority: 'critical'
    },

    Header: {
        name: 'Header',
        enabled: true,
        timeout: 15000,
        retries: 2,
        parallel: false,
        tags: ['header', 'navigation', 'component'],
        priority: 'high'
    },

    ActionButtons: {
        name: 'ActionButtons',
        enabled: true,
        timeout: 30000,
        retries: 2,
        parallel: false,
        tags: ['buttons', 'actions', 'component'],
        priority: 'high'
    },

    PaginationControls: {
        name: 'PaginationControls',
        enabled: true,
        timeout: 30000,
        retries: 2,
        parallel: false,
        tags: ['pagination', 'controls', 'component'],
        priority: 'medium'
    }
};

export const testDataConfig: TestDataConfig = {
    mockApi: true,
    useRealData: false,
    dataPath: './test-data',
    cleanupAfter: true
};

export const defaultTestConfig: TestConfig = {
    suites: undefined,
    tests: undefined,
    timeout: 30000,
    retries: 2,
    parallel: false,
    verbose: true,
    headless: true,
    baseUrl: 'http://localhost:5002'
};

export const ciTestConfig: TestConfig = {
    suites: undefined,
    tests: undefined,
    timeout: 60000,
    retries: 3,
    parallel: true,
    verbose: false,
    headless: true,
    baseUrl: 'http://localhost:5002'
};

export const developmentTestConfig: TestConfig = {
    suites: undefined,
    tests: undefined,
    timeout: 30000,
    retries: 1,
    parallel: false,
    verbose: true,
    headless: false,
    baseUrl: 'http://localhost:5002'
};

// Test data templates
export const testDataTemplates = {
    actionHistory: [
        {
            id: 'test-action-1',
            actionType: 'POST_CREATE',
            actionString: 'POST_CREATE-2024-01-01T00:00:00.000Z-test123-{"title":"Test Post","content":"Test content"}',
            uniqueId: 'test-action-1',
            success: true,
            timestamp: new Date().toISOString(),
            sessionId: 'test-session-1',
            method: 'click',
            message: 'Post created successfully',
            data: { title: 'Test Post', content: 'Test content' },
            duration: 150
        },
        {
            id: 'test-action-2',
            actionType: 'COMMENT_ADD',
            actionString: 'COMMENT_ADD-2024-01-01T00:01:00.000Z-test456-{"postId":"post-1","commentContent":"Test comment"}',
            uniqueId: 'test-action-2',
            success: true,
            timestamp: new Date(Date.now() + 60000).toISOString(),
            sessionId: 'test-session-1',
            method: 'keyboard',
            message: 'Comment added successfully',
            data: { postId: 'post-1', commentContent: 'Test comment' },
            duration: 200
        }
    ],

    analyticsData: {
        sessions: [
            {
                id: 'session-1',
                startTime: new Date().toISOString(),
                endTime: new Date(Date.now() + 3600000).toISOString(),
                actions: 5,
                method: 'click'
            },
            {
                id: 'session-2',
                startTime: new Date().toISOString(),
                endTime: new Date(Date.now() + 7200000).toISOString(),
                actions: 8,
                method: 'keyboard'
            }
        ],
        actionStats: {
            'POST_CREATE': 3,
            'COMMENT_ADD': 2,
            'LIKE_ADD': 1,
            'SHARE_ACTION': 1,
            'FOLLOW_USER': 1,
            'BOOKMARK_ADD': 1
        },
        methodStats: {
            'click': 4,
            'keyboard': 2,
            'api': 1
        },
        timeStats: {
            hourly: Array.from({ length: 24 }, (_, i) => ({
                hour: i,
                count: Math.floor(Math.random() * 10)
            }))
        }
    },

    scheduledActions: [
        {
            id: 'scheduled-1',
            actionType: 'createPost',
            name: 'Daily Post Creation',
            description: 'Create a daily post automatically',
            scheduledTime: new Date(Date.now() + 3600000).toISOString(),
            status: 'pending',
            repeatType: 'daily',
            priority: 'medium',
            enabled: true,
            createdBy: 'test-user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 0,
            rating: 4.5,
            difficulty: 'beginner',
            estimatedDuration: 5,
            tags: ['daily', 'post', 'automation'],
            actions: [],
            variables: [],
            settings: {
                allowCustomization: true,
                allowVariableOverride: true,
                requireConfirmation: true,
                showProgress: true,
                enableNotifications: true,
                autoSave: true
            },
            metadata: {
                version: '1.0.0',
                author: 'Test User',
                compatibility: ['all'],
                lastTested: new Date().toISOString()
            },
            isDefault: false,
            isPublic: false
        }
    ],

    templates: [
        {
            id: 'template-1',
            name: 'Test Template',
            description: 'A test template for testing purposes',
            category: 'testing',
            tags: ['test', 'template'],
            actions: [
                {
                    id: 'action-1',
                    actionType: 'createPost',
                    name: 'Create Test Post',
                    order: 1,
                    required: true,
                    settings: { delay: 1000 }
                }
            ],
            variables: [
                {
                    id: 'var-1',
                    name: 'Test Variable',
                    type: 'string',
                    description: 'A test variable',
                    defaultValue: 'test value',
                    required: true
                }
            ],
            settings: {
                allowCustomization: true,
                allowVariableOverride: true,
                requireConfirmation: true,
                showProgress: true,
                enableNotifications: true,
                autoSave: true
            },
            metadata: {
                version: '1.0.0',
                author: 'Test User',
                compatibility: ['all'],
                lastTested: new Date().toISOString()
            },
            isDefault: false,
            isPublic: false,
            createdBy: 'test-user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 0,
            rating: 4.0,
            difficulty: 'beginner',
            estimatedDuration: 5
        }
    ]
};

// Test execution profiles
export const testProfiles = {
    smoke: {
        name: 'Smoke Tests',
        description: 'Quick smoke tests for critical functionality',
        suites: ['ActionTestPage', 'HomePage', 'Header'],
        timeout: 15000,
        retries: 1,
        parallel: true
    },

    regression: {
        name: 'Regression Tests',
        description: 'Full regression test suite',
        suites: undefined, // All suites
        timeout: 30000,
        retries: 2,
        parallel: false
    },

    performance: {
        name: 'Performance Tests',
        description: 'Performance and load testing',
        suites: ['AdvancedActionDashboard', 'AnalyticsDashboard'],
        timeout: 120000,
        retries: 1,
        parallel: false
    },

    mobile: {
        name: 'Mobile Tests',
        description: 'Mobile-specific testing',
        suites: undefined, // All suites
        timeout: 30000,
        retries: 2,
        parallel: false,
        environment: 'mobile'
    },

    accessibility: {
        name: 'Accessibility Tests',
        description: 'Accessibility compliance testing',
        suites: ['ActionTestPage', 'HomePage', 'Header'],
        timeout: 45000,
        retries: 2,
        parallel: false
    }
};

export function getTestConfig(profile: string = 'regression'): TestConfig {
    const profileConfig = testProfiles[profile as keyof typeof testProfiles];
    if (!profileConfig) {
        throw new Error(`Unknown test profile: ${profile}`);
    }

    return {
        ...defaultTestConfig,
        suites: profileConfig.suites,
        timeout: profileConfig.timeout,
        retries: profileConfig.retries,
        parallel: profileConfig.parallel
    };
}

export function getEnvironmentConfig(environment: string = 'development'): TestEnvironment {
    const envConfig = testEnvironments[environment];
    if (!envConfig) {
        throw new Error(`Unknown environment: ${environment}`);
    }

    return envConfig;
}
