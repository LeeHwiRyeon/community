import logger from '../../logger.js';

describe('Logger', () => {
    const originalConsole = global.console;
    let consoleOutput = [];

    beforeEach(() => {
        consoleOutput = [];
        global.console = {
            ...originalConsole,
            log: (...args) => {
                consoleOutput.push(['log', ...args]);
                originalConsole.log(...args);
            },
            warn: (...args) => {
                consoleOutput.push(['warn', ...args]);
                originalConsole.warn(...args);
            },
            error: (...args) => {
                consoleOutput.push(['error', ...args]);
                originalConsole.error(...args);
            },
            info: (...args) => {
                consoleOutput.push(['info', ...args]);
                originalConsole.info(...args);
            }
        };
    });

    afterEach(() => {
        global.console = originalConsole;
    });

    describe('info', () => {
        it('should log info messages', () => {
            logger.info('test message', { key: 'value' });

            expect(consoleOutput.length).toBeGreaterThan(0);
            const lastOutput = consoleOutput[consoleOutput.length - 1];
            expect(lastOutput[0]).toBe('info');
            expect(lastOutput[1]).toContain('test message');
        });

        it('should handle JSON logging when LOG_JSON=1', () => {
            process.env.LOG_JSON = '1';
            logger.info('json test', { test: 'data' });

            const lastOutput = consoleOutput[consoleOutput.length - 1];
            expect(lastOutput[0]).toBe('info');
            // Should contain JSON-like output
            expect(lastOutput[1]).toMatch(/test.*data/);
            process.env.LOG_JSON = '0';
        });
    });

    describe('error', () => {
        it('should log error messages', () => {
            const testError = new Error('test error');
            logger.error('error occurred', { error: testError.message });

            expect(consoleOutput.length).toBeGreaterThan(0);
            const lastOutput = consoleOutput[consoleOutput.length - 1];
            expect(lastOutput[0]).toBe('error');
        });
    });

    describe('warn', () => {
        it('should log warning messages', () => {
            logger.warn('warning message', { code: 'WARN001' });

            expect(consoleOutput.length).toBeGreaterThan(0);
            const lastOutput = consoleOutput[consoleOutput.length - 1];
            expect(lastOutput[0]).toBe('warn');
        });
    });
});