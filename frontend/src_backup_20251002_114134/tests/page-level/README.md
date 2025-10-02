# Page-Level Test Suite

Comprehensive page-level testing system for all action generator features using Playwright.

## Overview

This test suite provides end-to-end testing for all pages and components in the action generator system, including:

- **ActionTestPage** - Action button functionality and pagination
- **AnalyticsDashboard** - Analytics visualization and data display
- **BulkActionsPanel** - Bulk action execution and management
- **SchedulerDashboard** - Scheduled action management
- **TemplateDashboard** - Template creation and execution
- **AdvancedActionDashboard** - Comprehensive dashboard functionality
- **HomePage** - Main homepage functionality
- **Header** - Navigation and header components
- **ActionButtons** - Individual action button components
- **PaginationControls** - Pagination and navigation controls

## Features

### 🚀 **Comprehensive Testing**
- **Page Load Tests** - Verify pages load without errors
- **Component Tests** - Test individual component functionality
- **Interaction Tests** - Test user interactions and workflows
- **Responsive Tests** - Test on different screen sizes
- **Performance Tests** - Test page performance and loading times

### 🎯 **Advanced Test Capabilities**
- **Real Browser Testing** - Uses Playwright for real browser automation
- **Screenshot Capture** - Automatic screenshots on test failures
- **Video Recording** - Optional video recording of test execution
- **Network Monitoring** - Monitor API calls and network requests
- **Console Logging** - Capture and analyze browser console logs

### 📊 **Test Management**
- **Parallel Execution** - Run tests in parallel for faster execution
- **Retry Logic** - Automatic retry of failed tests
- **Test Filtering** - Run specific test suites or individual tests
- **Test Reporting** - Comprehensive HTML, JSON, and CSV reports
- **CI/CD Integration** - Ready for continuous integration

## Quick Start

### 1. Setup

```bash
# Install test dependencies
npm run test:page-level:setup

# Or manually
cd src/tests/page-level
npm install
npx playwright install
```

### 2. Run Tests

```bash
# Run all tests
npm run test:page-level

# Run with browser UI visible
npm run test:page-level:headed

# Run specific test suite
npm run test:page-level --suite ActionTestPage

# Run specific test
npm run test:page-level --test "Page Loads Successfully"

# Run smoke tests (critical functionality only)
npm run test:page-level:smoke

# Run all tests in parallel
npm run test:page-level:all
```

### 3. Prerequisites

- **Frontend Server Running** - Ensure the frontend server is running on `http://localhost:5002`
- **Node.js** - Version 16 or higher
- **Playwright** - Will be installed automatically during setup

## Test Configuration

### Environment Configuration

```typescript
// Development environment (default)
{
  baseUrl: 'http://localhost:5002',
  timeout: 30000,
  headless: true,
  viewport: { width: 1920, height: 1080 }
}

// Mobile environment
{
  baseUrl: 'http://localhost:5002',
  timeout: 30000,
  headless: true,
  viewport: { width: 375, height: 667 }
}
```

### Test Profiles

```bash
# Smoke tests (quick, critical functionality)
npm run test:page-level --profile smoke

# Regression tests (full test suite)
npm run test:page-level --profile regression

# Performance tests (load and performance testing)
npm run test:page-level --profile performance

# Mobile tests (mobile-specific testing)
npm run test:page-level --profile mobile
```

## Test Structure

### Test Suite Organization

```
src/tests/page-level/
├── PageTestRunner.ts          # Main test runner
├── types.ts                   # Type definitions and utilities
├── testConfig.ts              # Test configuration
├── runTests.ts                # Test execution script
├── package.json               # Test dependencies
├── README.md                  # This file
├── reports/                   # Test reports (generated)
├── screenshots/               # Screenshots (generated)
└── test-suites/               # Individual test suites
    ├── ActionTestPage.test.ts
    ├── AnalyticsDashboard.test.ts
    ├── BulkActionsPanel.test.ts
    ├── SchedulerDashboard.test.ts
    ├── TemplateDashboard.test.ts
    ├── AdvancedActionDashboard.test.ts
    ├── HomePage.test.ts
    ├── Header.test.ts
    ├── ActionButtons.test.ts
    └── PaginationControls.test.ts
```

### Test Case Structure

```typescript
{
  name: 'Test Case Name',
  description: 'Test case description',
  steps: [
    {
      name: 'Step 1',
      action: async () => {
        // Test action
      }
    },
    {
      name: 'Step 2',
      action: async () => {
        // Test action
      }
    }
  ]
}
```

## Writing Tests

### Basic Test Example

```typescript
{
  name: 'Page Loads Successfully',
  description: 'Verify that the page loads without errors',
  steps: [
    {
      name: 'Navigate to page',
      action: async () => {
        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
        await global.page.goto(`${context.baseUrl}/action-test`);
        await TestUtils.waitForNavigation(context);
      }
    },
    {
      name: 'Verify page title',
      action: async () => {
        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
        const title = await global.page.title();
        TestAssertions.assertContains(title, 'Action', 'Page title should contain "Action"');
      }
    }
  ]
}
```

### Advanced Test Example

```typescript
{
  name: 'User Interaction Workflow',
  description: 'Test complete user interaction workflow',
  steps: [
    {
      name: 'Navigate to page',
      action: async () => {
        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
        await global.page.goto(`${context.baseUrl}/action-test`);
        await TestUtils.waitForNavigation(context);
      }
    },
    {
      name: 'Click action button',
      action: async () => {
        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
        await TestUtils.clickElement(context, { type: 'css', value: 'button:has-text("Write Post")' });
        await global.page.waitForTimeout(1000);
      }
    },
    {
      name: 'Verify action executed',
      action: async () => {
        const context = { page: global.page, browser: global.browser, context: global.context, baseUrl: 'http://localhost:5002', timeout: 30000 };
        const history = await TestUtils.getStorage(context, 'actionHistory');
        TestAssertions.assertGreaterThan(history.length, 0, 'Action should be added to history');
      }
    }
  ]
}
```

## Test Utilities

### Element Selection

```typescript
// CSS selector
{ type: 'css', value: 'button[data-testid="submit"]' }

// XPath selector
{ type: 'xpath', value: '//button[contains(text(), "Submit")]' }

// Text selector
{ type: 'text', value: 'Submit' }

// Role selector
{ type: 'role', value: 'button' }

// Label selector
{ type: 'label', value: 'Submit Button' }
```

### Common Actions

```typescript
// Click element
await TestUtils.clickElement(context, selector);

// Type text
await TestUtils.typeText(context, selector, 'Hello World');

// Get text content
const text = await TestUtils.getText(context, selector);

// Check visibility
const isVisible = await TestUtils.isVisible(context, selector);

// Wait for element
await TestUtils.waitForElement(context, selector);
```

### Assertions

```typescript
// Text assertions
TestAssertions.assertEqual(actual, expected, 'Values should be equal');
TestAssertions.assertContains(text, substring, 'Text should contain substring');

// Element assertions
await TestAssertions.assertElementVisible(context, selector);
await TestAssertions.assertElementEnabled(context, selector);

// Array assertions
TestAssertions.assertArrayLength(array, 5, 'Array should have 5 items');
```

## Test Reports

### HTML Report

```bash
npm run test:page-level --export html
```

Generates a comprehensive HTML report with:
- Test execution summary
- Detailed test results
- Screenshots of failures
- Performance metrics
- Timeline visualization

### JSON Report

```bash
npm run test:page-level --export json
```

Generates a machine-readable JSON report for CI/CD integration.

### CSV Report

```bash
npm run test:page-level --export csv
```

Generates a CSV report for spreadsheet analysis.

## CI/CD Integration

### GitHub Actions

```yaml
name: Page-Level Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run dev &
      - run: npm run test:page-level:setup
      - run: npm run test:page-level:ci
```

### Local CI

```bash
# Run tests in CI mode
npm run test:page-level:ci

# Run with specific configuration
npm run test:page-level --headless --quiet --timeout 60000 --retries 3
```

## Troubleshooting

### Common Issues

1. **Frontend Server Not Running**
   ```
   Error: Frontend server is not running at http://localhost:5002
   Solution: Start the frontend server with `npm run dev`
   ```

2. **Playwright Browsers Not Installed**
   ```
   Error: Browser not found
   Solution: Run `npx playwright install`
   ```

3. **Test Timeouts**
   ```
   Error: Test execution timed out
   Solution: Increase timeout with `--timeout 60000`
   ```

4. **Element Not Found**
   ```
   Error: Element not found: button[data-testid="submit"]
   Solution: Check selector and ensure element exists
   ```

### Debug Mode

```bash
# Run with debug output
npm run test:page-level --verbose

# Run with browser UI
npm run test:page-level --headed

# Run single test for debugging
npm run test:page-level --test "Specific Test Name"
```

## Best Practices

### 1. Test Organization
- Group related tests in the same test suite
- Use descriptive test names
- Keep tests independent and isolated

### 2. Element Selection
- Prefer data-testid attributes over CSS selectors
- Use semantic selectors when possible
- Avoid brittle selectors that change frequently

### 3. Test Data
- Use consistent test data across tests
- Clean up test data after each test
- Mock external dependencies when possible

### 4. Performance
- Use parallel execution for independent tests
- Optimize test execution time
- Monitor test performance over time

### 5. Maintenance
- Update tests when UI changes
- Remove obsolete tests
- Keep test utilities up to date

## Contributing

### Adding New Tests

1. Create a new test file in the appropriate directory
2. Follow the existing test structure and naming conventions
3. Add the test suite to the main test runner
4. Update documentation as needed

### Test Guidelines

- Write tests that are reliable and maintainable
- Use meaningful assertions and error messages
- Test both positive and negative scenarios
- Include edge cases and error conditions

## Support

For questions or issues with the page-level test suite:

1. Check the troubleshooting section
2. Review test logs and reports
3. Check the main project documentation
4. Create an issue in the project repository

---

**Happy Testing! 🚀**
