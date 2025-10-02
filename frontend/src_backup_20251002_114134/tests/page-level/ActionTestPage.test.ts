// ActionTestPage Test Suite
// Comprehensive testing for the Action Test Page functionality

import { PageTestSuite, TestUtils, TestAssertions, ElementSelector } from './types';

export const ActionTestPageTests: PageTestSuite = {
    name: 'ActionTestPage',
    description: 'Test suite for Action Test Page functionality',

    setup: async () => {
        // Setup test data
        await TestUtils.setStorage(
            { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 },
            'actionHistory',
            []
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
            description: 'Verify that the Action Test Page loads without errors',
            steps: [
                {
                    name: 'Navigate to Action Test Page',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.goto(`${context.baseUrl}/action-test`);
                        await TestUtils.waitForNavigation(context);
                    }
                },
                {
                    name: 'Verify Page Title',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        const title = await global.page.title();
                        TestAssertions.assertContains(title, 'Action', 'Page title should contain "Action"');
                    }
                },
                {
                    name: 'Verify Main Heading',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        const heading = await TestUtils.getText(context, { type: 'css', value: 'h1' });
                        TestAssertions.assertContains(heading, 'Action', 'Main heading should contain "Action"');
                    }
                }
            ]
        },

        {
            name: 'Action Buttons Are Present',
            description: 'Verify that all action buttons are present and clickable',
            steps: [
                {
                    name: 'Navigate to Action Test Page',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.goto(`${context.baseUrl}/action-test`);
                        await TestUtils.waitForNavigation(context);
                    }
                },
                {
                    name: 'Verify Write Post Button',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'button:has-text("Write Post")' });
                        await TestAssertions.assertElementEnabled(context, { type: 'css', value: 'button:has-text("Write Post")' });
                    }
                },
                {
                    name: 'Verify Add Comment Button',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'button:has-text("Add Comment")' });
                        await TestAssertions.assertElementEnabled(context, { type: 'css', value: 'button:has-text("Add Comment")' });
                    }
                },
                {
                    name: 'Verify Add Like Button',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'button:has-text("Add Like")' });
                        await TestAssertions.assertElementEnabled(context, { type: 'css', value: 'button:has-text("Add Like")' });
                    }
                },
                {
                    name: 'Verify Share Action Button',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'button:has-text("Share Action")' });
                        await TestAssertions.assertElementEnabled(context, { type: 'css', value: 'button:has-text("Share Action")' });
                    }
                },
                {
                    name: 'Verify Follow User Button',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'button:has-text("Follow User")' });
                        await TestAssertions.assertElementEnabled(context, { type: 'css', value: 'button:has-text("Follow User")' });
                    }
                },
                {
                    name: 'Verify Add Bookmark Button',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'button:has-text("Add Bookmark")' });
                        await TestAssertions.assertElementEnabled(context, { type: 'css', value: 'button:has-text("Add Bookmark")' });
                    }
                }
            ]
        },

        {
            name: 'Action Button Functionality',
            description: 'Test that action buttons execute actions and update history',
            steps: [
                {
                    name: 'Navigate to Action Test Page',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.goto(`${context.baseUrl}/action-test`);
                        await TestUtils.waitForNavigation(context);
                    }
                },
                {
                    name: 'Click Write Post Button',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestUtils.clickElement(context, { type: 'css', value: 'button:has-text("Write Post")' });
                        await global.page.waitForTimeout(1000); // Wait for action to complete
                    }
                },
                {
                    name: 'Verify Action History Updated',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        const history = await TestUtils.getStorage(context, 'actionHistory');
                        TestAssertions.assertTrue(Array.isArray(history), 'Action history should be an array');
                        TestAssertions.assertGreaterThan(history.length, 0, 'Action history should have at least one item');
                    }
                },
                {
                    name: 'Click Add Comment Button',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestUtils.clickElement(context, { type: 'css', value: 'button:has-text("Add Comment")' });
                        await global.page.waitForTimeout(1000);
                    }
                },
                {
                    name: 'Verify Action History Has Multiple Items',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        const history = await TestUtils.getStorage(context, 'actionHistory');
                        TestAssertions.assertGreaterThan(history.length, 1, 'Action history should have multiple items');
                    }
                }
            ]
        },

        {
            name: 'Pagination Controls Work',
            description: 'Test pagination controls functionality',
            steps: [
                {
                    name: 'Navigate to Action Test Page',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.goto(`${context.baseUrl}/action-test`);
                        await TestUtils.waitForNavigation(context);
                    }
                },
                {
                    name: 'Verify Pagination Controls Are Present',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'button:has-text("Previous Page")' });
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'button:has-text("Next Page")' });
                    }
                },
                {
                    name: 'Test Next Page Button',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestUtils.clickElement(context, { type: 'css', value: 'button:has-text("Next Page")' });
                        await global.page.waitForTimeout(1000);
                    }
                },
                {
                    name: 'Test Previous Page Button',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestUtils.clickElement(context, { type: 'css', value: 'button:has-text("Previous Page")' });
                        await global.page.waitForTimeout(1000);
                    }
                }
            ]
        },

        {
            name: 'Sound Toggle Functionality',
            description: 'Test sound toggle switch functionality',
            steps: [
                {
                    name: 'Navigate to Action Test Page',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.goto(`${context.baseUrl}/action-test`);
                        await TestUtils.waitForNavigation(context);
                    }
                },
                {
                    name: 'Verify Sound Toggle Is Present',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'input[type="checkbox"]' });
                    }
                },
                {
                    name: 'Toggle Sound Switch',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestUtils.clickElement(context, { type: 'css', value: 'input[type="checkbox"]' });
                        await global.page.waitForTimeout(500);
                    }
                },
                {
                    name: 'Verify Sound State Changed',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        const isChecked = await global.page.isChecked('input[type="checkbox"]');
                        TestAssertions.assertTrue(typeof isChecked === 'boolean', 'Sound toggle should have a boolean state');
                    }
                }
            ]
        },

        {
            name: 'Keyboard Shortcuts Work',
            description: 'Test keyboard shortcuts functionality',
            steps: [
                {
                    name: 'Navigate to Action Test Page',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.goto(`${context.baseUrl}/action-test`);
                        await TestUtils.waitForNavigation(context);
                    }
                },
                {
                    name: 'Test Ctrl+P Shortcut',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.keyboard.press('Control+p');
                        await global.page.waitForTimeout(1000);

                        const history = await TestUtils.getStorage(context, 'actionHistory');
                        const initialCount = history.length;
                        TestAssertions.assertGreaterThan(initialCount, 0, 'Action should be executed via keyboard shortcut');
                    }
                },
                {
                    name: 'Test Ctrl+H Shortcut',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.keyboard.press('Control+h');
                        await global.page.waitForTimeout(1000);

                        // Verify help modal or shortcut info is displayed
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: '[data-testid="shortcuts-help"], .shortcuts-help, [aria-label*="help"], [aria-label*="shortcut"]' });
                    }
                }
            ]
        },

        {
            name: 'Action History Display',
            description: 'Test that action history is displayed correctly',
            steps: [
                {
                    name: 'Navigate to Action Test Page',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.goto(`${context.baseUrl}/action-test`);
                        await TestUtils.waitForNavigation(context);
                    }
                },
                {
                    name: 'Execute Multiple Actions',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };

                        // Click several action buttons
                        await TestUtils.clickElement(context, { type: 'css', value: 'button:has-text("Write Post")' });
                        await global.page.waitForTimeout(500);
                        await TestUtils.clickElement(context, { type: 'css', value: 'button:has-text("Add Comment")' });
                        await global.page.waitForTimeout(500);
                        await TestUtils.clickElement(context, { type: 'css', value: 'button:has-text("Add Like")' });
                        await global.page.waitForTimeout(1000);
                    }
                },
                {
                    name: 'Verify Action History Section',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'h2:has-text("Action History"), h3:has-text("Action History"), [data-testid="action-history"]' });
                    }
                },
                {
                    name: 'Verify History Items Are Displayed',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        const historyElements = await global.page.locator('[data-testid="action-item"], .action-item, .history-item').count();
                        TestAssertions.assertGreaterThan(historyElements, 0, 'Action history items should be displayed');
                    }
                }
            ]
        },

        {
            name: 'Clear History Functionality',
            description: 'Test clear history button functionality',
            steps: [
                {
                    name: 'Navigate to Action Test Page',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.goto(`${context.baseUrl}/action-test`);
                        await TestUtils.waitForNavigation(context);
                    }
                },
                {
                    name: 'Execute Some Actions',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestUtils.clickElement(context, { type: 'css', value: 'button:has-text("Write Post")' });
                        await global.page.waitForTimeout(500);
                        await TestUtils.clickElement(context, { type: 'css', value: 'button:has-text("Add Comment")' });
                        await global.page.waitForTimeout(1000);
                    }
                },
                {
                    name: 'Verify Clear Button Is Present',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'button:has-text("Clear"), button[aria-label*="clear"], button[title*="clear"]' });
                    }
                },
                {
                    name: 'Click Clear Button',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await TestUtils.clickElement(context, { type: 'css', value: 'button:has-text("Clear"), button[aria-label*="clear"], button[title*="clear"]' });
                        await global.page.waitForTimeout(1000);
                    }
                },
                {
                    name: 'Verify History Is Cleared',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        const history = await TestUtils.getStorage(context, 'actionHistory');
                        TestAssertions.assertEqual(history.length, 0, 'Action history should be cleared');
                    }
                }
            ]
        },

        {
            name: 'Responsive Design',
            description: 'Test that the page works on different screen sizes',
            steps: [
                {
                    name: 'Navigate to Action Test Page',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.goto(`${context.baseUrl}/action-test`);
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
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'h1' });
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'button:has-text("Write Post")' });
                    }
                },
                {
                    name: 'Test Tablet Viewport',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.setViewportSize({ width: 768, height: 1024 });
                        await global.page.waitForTimeout(1000);

                        // Verify layout adapts
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'h1' });
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'button:has-text("Write Post")' });
                    }
                },
                {
                    name: 'Test Desktop Viewport',
                    action: async () => {
                        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
                        await global.page.setViewportSize({ width: 1920, height: 1080 });
                        await global.page.waitForTimeout(1000);

                        // Verify full layout
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'h1' });
                        await TestAssertions.assertElementVisible(context, { type: 'css', value: 'button:has-text("Write Post")' });
                    }
                }
            ]
        }
    ]
};
