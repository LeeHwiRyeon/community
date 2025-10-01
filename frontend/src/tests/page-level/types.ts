// Page-Level Test Types and Interfaces

export interface TestConfig {
    suites?: string[];
    tests?: string[];
    timeout: number;
    retries: number;
    parallel: boolean;
    verbose: boolean;
    headless: boolean;
    baseUrl: string;
}

export interface TestStep {
    name: string;
    action: () => Promise<void>;
    timeout?: number;
    retries?: number;
}

export interface TestCase {
    name: string;
    description?: string;
    skip?: boolean;
    timeout?: number;
    retries?: number;
    steps: TestStep[];
    setup?: () => Promise<void>;
    teardown?: () => Promise<void>;
}

export interface PageTestSuite {
    name: string;
    description?: string;
    setup?: () => Promise<void>;
    teardown?: () => Promise<void>;
    tests: TestCase[];
}

export interface TestResult {
    suiteName: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    duration: number;
    tests: TestCaseResult[];
    timestamp: string;
    error?: string;
}

export interface TestCaseResult {
    name: string;
    status: 'pending' | 'passed' | 'failed' | 'skipped';
    duration: number;
    error: string | null;
    steps: TestStepResult[];
    timestamp: string;
}

export interface TestStepResult {
    name: string;
    status: 'pending' | 'passed' | 'failed';
    duration: number;
    error: string | null;
    timestamp: string;
}

export interface TestReport {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    duration: number;
    suites: TestResult[];
    timestamp: string;
    version: string;
}

export interface PageTestContext {
    page: any; // Playwright page object
    browser: any; // Playwright browser object
    context: any; // Playwright context object
    baseUrl: string;
    timeout: number;
}

export interface ElementSelector {
    type: 'css' | 'xpath' | 'text' | 'role' | 'label';
    value: string;
    timeout?: number;
}

export interface ActionOptions {
    timeout?: number;
    retries?: number;
    waitFor?: 'load' | 'domcontentloaded' | 'networkidle';
    force?: boolean;
}

export interface AssertionOptions {
    timeout?: number;
    message?: string;
    soft?: boolean;
}

// Test utility functions
export class TestUtils {
    static async waitForElement(
        context: PageTestContext,
        selector: ElementSelector,
        options: ActionOptions = {}
    ): Promise<any> {
        const { page, timeout } = context;
        const waitTimeout = options.timeout || timeout;

        try {
            switch (selector.type) {
                case 'css':
                    return await page.waitForSelector(selector.value, { timeout: waitTimeout });
                case 'xpath':
                    return await page.waitForSelector(`xpath=${selector.value}`, { timeout: waitTimeout });
                case 'text':
                    return await page.waitForSelector(`text=${selector.value}`, { timeout: waitTimeout });
                case 'role':
                    return await page.getByRole(selector.value as any);
                case 'label':
                    return await page.getByLabel(selector.value);
                default:
                    throw new Error(`Unsupported selector type: ${selector.type}`);
            }
        } catch (error) {
            throw new Error(`Element not found: ${selector.value} (${selector.type})`);
        }
    }

    static async clickElement(
        context: PageTestContext,
        selector: ElementSelector,
        options: ActionOptions = {}
    ): Promise<void> {
        const element = await this.waitForElement(context, selector, options);
        await element.click();
    }

    static async typeText(
        context: PageTestContext,
        selector: ElementSelector,
        text: string,
        options: ActionOptions = {}
    ): Promise<void> {
        const element = await this.waitForElement(context, selector, options);
        await element.fill(text);
    }

    static async getText(
        context: PageTestContext,
        selector: ElementSelector,
        options: ActionOptions = {}
    ): Promise<string> {
        const element = await this.waitForElement(context, selector, options);
        return await element.textContent();
    }

    static async getAttribute(
        context: PageTestContext,
        selector: ElementSelector,
        attribute: string,
        options: ActionOptions = {}
    ): Promise<string | null> {
        const element = await this.waitForElement(context, selector, options);
        return await element.getAttribute(attribute);
    }

    static async isVisible(
        context: PageTestContext,
        selector: ElementSelector,
        options: ActionOptions = {}
    ): Promise<boolean> {
        try {
            const element = await this.waitForElement(context, selector, options);
            return await element.isVisible();
        } catch {
            return false;
        }
    }

    static async isEnabled(
        context: PageTestContext,
        selector: ElementSelector,
        options: ActionOptions = {}
    ): Promise<boolean> {
        try {
            const element = await this.waitForElement(context, selector, options);
            return await element.isEnabled();
        } catch {
            return false;
        }
    }

    static async waitForNavigation(
        context: PageTestContext,
        options: ActionOptions = {}
    ): Promise<void> {
        const { page } = context;
        const waitFor = options.waitFor || 'load';
        await page.waitForLoadState(waitFor);
    }

    static async takeScreenshot(
        context: PageTestContext,
        name: string,
        options: { fullPage?: boolean; path?: string } = {}
    ): Promise<string> {
        const { page } = context;
        const path = options.path || `screenshots/${name}-${Date.now()}.png`;
        await page.screenshot({
            path,
            fullPage: options.fullPage || false
        });
        return path;
    }

    static async scrollToElement(
        context: PageTestContext,
        selector: ElementSelector,
        options: ActionOptions = {}
    ): Promise<void> {
        const element = await this.waitForElement(context, selector, options);
        await element.scrollIntoViewIfNeeded();
    }

    static async waitForText(
        context: PageTestContext,
        text: string,
        options: ActionOptions = {}
    ): Promise<void> {
        const { page } = context;
        const timeout = options.timeout || context.timeout;
        await page.waitForSelector(`text=${text}`, { timeout });
    }

    static async waitForUrl(
        context: PageTestContext,
        url: string | RegExp,
        options: ActionOptions = {}
    ): Promise<void> {
        const { page } = context;
        const timeout = options.timeout || context.timeout;
        await page.waitForURL(url, { timeout });
    }

    static async clearStorage(
        context: PageTestContext
    ): Promise<void> {
        const { page } = context;
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    }

    static async setStorage(
        context: PageTestContext,
        key: string,
        value: any
    ): Promise<void> {
        const { page } = context;
        await page.evaluate(({ key, value }) => {
            localStorage.setItem(key, JSON.stringify(value));
        }, { key, value });
    }

    static async getStorage(
        context: PageTestContext,
        key: string
    ): Promise<any> {
        const { page } = context;
        return await page.evaluate((key) => {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        }, key);
    }

    static async mockApiResponse(
        context: PageTestContext,
        url: string | RegExp,
        response: any,
        status: number = 200
    ): Promise<void> {
        const { page } = context;
        await page.route(url, async (route) => {
            await route.fulfill({
                status,
                contentType: 'application/json',
                body: JSON.stringify(response)
            });
        });
    }

    static async interceptApiCall(
        context: PageTestContext,
        url: string | RegExp,
        handler: (request: any) => Promise<void>
    ): Promise<void> {
        const { page } = context;
        await page.route(url, handler);
    }
}

// Assertion utilities
export class TestAssertions {
    static assertEqual(
        actual: any,
        expected: any,
        message?: string,
        options: AssertionOptions = {}
    ): void {
        if (actual !== expected) {
            const errorMessage = message || `Expected ${expected}, but got ${actual}`;
            if (options.soft) {
                console.warn(`Assertion failed: ${errorMessage}`);
            } else {
                throw new Error(errorMessage);
            }
        }
    }

    static assertNotEqual(
        actual: any,
        expected: any,
        message?: string,
        options: AssertionOptions = {}
    ): void {
        if (actual === expected) {
            const errorMessage = message || `Expected not to be ${expected}, but got ${actual}`;
            if (options.soft) {
                console.warn(`Assertion failed: ${errorMessage}`);
            } else {
                throw new Error(errorMessage);
            }
        }
    }

    static assertTrue(
        condition: boolean,
        message?: string,
        options: AssertionOptions = {}
    ): void {
        if (!condition) {
            const errorMessage = message || 'Expected condition to be true';
            if (options.soft) {
                console.warn(`Assertion failed: ${errorMessage}`);
            } else {
                throw new Error(errorMessage);
            }
        }
    }

    static assertFalse(
        condition: boolean,
        message?: string,
        options: AssertionOptions = {}
    ): void {
        if (condition) {
            const errorMessage = message || 'Expected condition to be false';
            if (options.soft) {
                console.warn(`Assertion failed: ${errorMessage}`);
            } else {
                throw new Error(errorMessage);
            }
        }
    }

    static assertContains(
        container: string,
        substring: string,
        message?: string,
        options: AssertionOptions = {}
    ): void {
        if (!container.includes(substring)) {
            const errorMessage = message || `Expected "${container}" to contain "${substring}"`;
            if (options.soft) {
                console.warn(`Assertion failed: ${errorMessage}`);
            } else {
                throw new Error(errorMessage);
            }
        }
    }

    static assertNotContains(
        container: string,
        substring: string,
        message?: string,
        options: AssertionOptions = {}
    ): void {
        if (container.includes(substring)) {
            const errorMessage = message || `Expected "${container}" not to contain "${substring}"`;
            if (options.soft) {
                console.warn(`Assertion failed: ${errorMessage}`);
            } else {
                throw new Error(errorMessage);
            }
        }
    }

    static assertGreaterThan(
        actual: number,
        expected: number,
        message?: string,
        options: AssertionOptions = {}
    ): void {
        if (actual <= expected) {
            const errorMessage = message || `Expected ${actual} to be greater than ${expected}`;
            if (options.soft) {
                console.warn(`Assertion failed: ${errorMessage}`);
            } else {
                throw new Error(errorMessage);
            }
        }
    }

    static assertLessThan(
        actual: number,
        expected: number,
        message?: string,
        options: AssertionOptions = {}
    ): void {
        if (actual >= expected) {
            const errorMessage = message || `Expected ${actual} to be less than ${expected}`;
            if (options.soft) {
                console.warn(`Assertion failed: ${errorMessage}`);
            } else {
                throw new Error(errorMessage);
            }
        }
    }

    static assertArrayLength(
        array: any[],
        expectedLength: number,
        message?: string,
        options: AssertionOptions = {}
    ): void {
        if (array.length !== expectedLength) {
            const errorMessage = message || `Expected array length ${expectedLength}, but got ${array.length}`;
            if (options.soft) {
                console.warn(`Assertion failed: ${errorMessage}`);
            } else {
                throw new Error(errorMessage);
            }
        }
    }

    static assertElementVisible(
        context: PageTestContext,
        selector: ElementSelector,
        message?: string,
        options: ActionOptions = {}
    ): Promise<void> {
        return TestUtils.isVisible(context, selector, options).then(isVisible => {
            if (!isVisible) {
                const errorMessage = message || `Element ${selector.value} is not visible`;
                throw new Error(errorMessage);
            }
        });
    }

    static assertElementNotVisible(
        context: PageTestContext,
        selector: ElementSelector,
        message?: string,
        options: ActionOptions = {}
    ): Promise<void> {
        return TestUtils.isVisible(context, selector, options).then(isVisible => {
            if (isVisible) {
                const errorMessage = message || `Element ${selector.value} should not be visible`;
                throw new Error(errorMessage);
            }
        });
    }

    static assertElementEnabled(
        context: PageTestContext,
        selector: ElementSelector,
        message?: string,
        options: ActionOptions = {}
    ): Promise<void> {
        return TestUtils.isEnabled(context, selector, options).then(isEnabled => {
            if (!isEnabled) {
                const errorMessage = message || `Element ${selector.value} is not enabled`;
                throw new Error(errorMessage);
            }
        });
    }

    static assertElementDisabled(
        context: PageTestContext,
        selector: ElementSelector,
        message?: string,
        options: ActionOptions = {}
    ): Promise<void> {
        return TestUtils.isEnabled(context, selector, options).then(isEnabled => {
            if (isEnabled) {
                const errorMessage = message || `Element ${selector.value} should be disabled`;
                throw new Error(errorMessage);
            }
        });
    }
}
