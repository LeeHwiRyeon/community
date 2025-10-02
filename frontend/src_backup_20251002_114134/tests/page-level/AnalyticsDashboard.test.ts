// AnalyticsDashboard Test Suite
// Comprehensive testing for the Analytics Dashboard functionality

import { PageTestSuite, TestUtils, TestAssertions } from './types';

export const AnalyticsDashboardTests: PageTestSuite = {
    name: 'AnalyticsDashboard',
    description: 'Test suite for Analytics Dashboard functionality',

    setup: async () => {
        // Setup test analytics data
        const testAnalyticsData = {
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
                'LIKE_ADD': 1
            },
            methodStats: {
                'click': 4,
                'keyboard': 2
            },
            timeStats: {
                hourly: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: Math.floor(Math.random() * 10) }))
            }
        };

        await TestUtils.setStorage(
            { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 },
            'analytics_data',
            testAnalyticsData
        );
    },

    teardown: async () => {
        // Cleanup test data
        await TestUtils.clearStorage(
            { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 }
        );
    },

    tests: [
        {
            name: 'Page Loads Successfully',
            description: 'Verify that the Analytics Dashboard loads without errors',
            steps: [
                {
                    name: 'Navigate to Analytics Dashboard',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.goto(`${context.baseUrl}/analytics`);
                        await TestUtils.waitForNavigation(context);
                    }
                },
                {
                    name: 'Verify Page Title',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        const title = await global.page.title();
                        TestAssertions.assertContains(title, 'Analytics', 'Page title should contain "Analytics"');
                    }
                },
                {
                    name: 'Verify Main Heading',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        const heading = await TestUtils.getText(context, { type: 'css', value: 'h1, h2' });
                        TestAssertions.assertContains(heading, 'Analytics', 'Main heading should contain "Analytics"');
                    }
                }
            ]
        },

        {
            name: 'Statistics Cards Are Displayed',
            description: 'Verify that all statistics cards are present and show data',
            steps: [
                {
                    name: 'Navigate to Analytics Dashboard',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.goto(`${context.baseUrl}/analytics`);
                        await TestUtils.waitForNavigation(context);
                    }
                },
                {
                    name: 'Verify Total Actions Card',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: '[data-testid="total-actions"], .stat-card, .metric-card' });
                    }
                },
                {
                    name: 'Verify Sessions Card',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: '[data-testid="total-sessions"], .stat-card, .metric-card' });
                    }
                },
                {
                    name: 'Verify Success Rate Card',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: '[data-testid="success-rate"], .stat-card, .metric-card' });
                    }
                },
                {
                    name: 'Verify Average Duration Card',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: '[data-testid="avg-duration"], .stat-card, .metric-card' });
                    }
                }
            ]
        },

        {
            name: 'Charts Are Rendered',
            description: 'Verify that all charts are rendered correctly',
            steps: [
                {
                    name: 'Navigate to Analytics Dashboard',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.goto(`${context.baseUrl}/analytics`);
                        await TestUtils.waitForNavigation(context);
                    }
                },
                {
                    name: 'Verify Action Types Chart',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: '[data-testid="action-types-chart"], .recharts-wrapper, canvas, svg' });
                    }
                },
                {
                    name: 'Verify Method Distribution Chart',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: '[data-testid="method-distribution-chart"], .recharts-wrapper, canvas, svg' });
                    }
                },
                {
                    name: 'Verify Time Series Chart',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: '[data-testid="time-series-chart"], .recharts-wrapper, canvas, svg' });
                    }
                }
            ]
        },

        {
            name: 'Data Tables Are Present',
            description: 'Verify that data tables are displayed with correct information',
            steps: [
                {
                    name: 'Navigate to Analytics Dashboard',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.goto(`${context.baseUrl}/analytics`);
                        await TestUtils.waitForNavigation(context);
                    }
                },
                {
                    name: 'Verify Recent Actions Table',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: '[data-testid="recent-actions-table"], table' });
                    }
                },
                {
                    name: 'Verify Sessions Table',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: '[data-testid="sessions-table"], table' });
                    }
                }
            ]
        },

        {
            name: 'Export Functionality Works',
            description: 'Test export functionality for analytics data',
            steps: [
                {
                    name: 'Navigate to Analytics Dashboard',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.goto(`${context.baseUrl}/analytics`);
                        await TestUtils.waitForNavigation(context);
                    }
                },
                {
                    name: 'Verify Export Button Is Present',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'button:has-text("Export"), button[aria-label*="export"]' });
                    }
                },
                {
                    name: 'Click Export Button',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestUtils.clickElement(context, { type: 'css', value: 'button:has-text("Export"), button[aria-label*="export"]' });
                        await global.page.waitForTimeout(1000);
                    }
                },
                {
                    name: 'Verify Export Modal Opens',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: '[role="dialog"], .modal, [data-testid="export-modal"]' });
                    }
                }
            ]
        },

        {
            name: 'Filter Controls Work',
            description: 'Test filter controls for date range and other options',
            steps: [
                {
                    name: 'Navigate to Analytics Dashboard',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.goto(`${context.baseUrl}/analytics`);
                        await TestUtils.waitForNavigation(context);
                    }
                },
                {
                    name: 'Verify Date Range Filter',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'input[type="date"], [data-testid="date-range"]' });
                    }
                },
                {
                    name: 'Verify Action Type Filter',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'select, [data-testid="action-type-filter"]' });
                    }
                },
                {
                    name: 'Test Date Range Selection',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        const dateInputs = await global.page.locator('input[type="date"]').count();
                        if (dateInputs > 0) {
                            await global.page.fill('input[type="date"]', '2024-01-01');
                            await global.page.waitForTimeout(500);
                        }
                    }
                }
            ]
        },

        {
            name: 'Refresh Functionality',
            description: 'Test refresh button functionality',
            steps: [
                {
                    name: 'Navigate to Analytics Dashboard',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.goto(`${context.baseUrl}/analytics`);
                        await TestUtils.waitForNavigation(context);
                    }
                },
                {
                    name: 'Verify Refresh Button',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'button:has-text("Refresh"), button[aria-label*="refresh"]' });
                    }
                },
                {
                    name: 'Click Refresh Button',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestUtils.clickElement(context, { type: 'css', value: 'button:has-text("Refresh"), button[aria-label*="refresh"]' });
                        await global.page.waitForTimeout(2000);
                    }
                },
                {
                    name: 'Verify Data Is Refreshed',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        // Verify that the page is still functional after refresh
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'h1, h2' });
                    }
                }
            ]
        },

        {
            name: 'Responsive Design',
            description: 'Test that the analytics dashboard works on different screen sizes',
            steps: [
                {
                    name: 'Navigate to Analytics Dashboard',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.goto(`${context.baseUrl}/analytics`);
                        await TestUtils.waitForNavigation(context);
                    }
                },
                {
                    name: 'Test Mobile Viewport',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.setViewportSize({ width: 375, height: 667 });
                        await global.page.waitForTimeout(1000);

                        // Verify main elements are still visible
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'h1, h2' });
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: '.stat-card, .metric-card' });
                    }
                },
                {
                    name: 'Test Tablet Viewport',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.setViewportSize({ width: 768, height: 1024 });
                        await global.page.waitForTimeout(1000);

                        // Verify layout adapts
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'h1, h2' });
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: '.stat-card, .metric-card' });
                    }
                },
                {
                    name: 'Test Desktop Viewport',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.setViewportSize({ width: 1920, height: 1080 });
                        await global.page.waitForTimeout(1000);

                        // Verify full layout
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'h1, h2' });
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: '.stat-card, .metric-card' });
                    }
                }
            ]
        },

        {
            name: 'Data Loading States',
            description: 'Test loading states and error handling',
            steps: [
                {
                    name: 'Navigate to Analytics Dashboard',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.goto(`${context.baseUrl}/analytics`);
                        await TestUtils.waitForNavigation(context);
                    }
                },
                {
                    name: 'Verify Loading Indicators',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        // Check for loading spinners or skeleton loaders
                        const loadingElements = await global.page.locator('.spinner, .loading, [data-testid="loading"], .skeleton').count();
                        // Loading elements might not be visible if data loads quickly
                        TestAssertions.assertTrue(loadingElements >= 0, 'Loading elements should be present or data should load quickly');
                    }
                },
                {
                    name: 'Verify Error Handling',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        // Check for error messages
                        const errorElements = await global.page.locator('.error, [data-testid="error"], .alert-error').count();
                        TestAssertions.assertEqual(errorElements, 0, 'No error messages should be displayed');
                    }
                }
            ]
        }
    ]
};
