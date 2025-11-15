/**
 * Logger utility for consistent logging across the application
 */

const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

class Logger {
    constructor(context = 'APP') {
        this.context = context;
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
        return `[${timestamp}] [${level}] [${this.context}] ${message} ${metaStr}`;
    }

    error(message, meta = {}) {
        console.error(this.formatMessage(LOG_LEVELS.ERROR, message, meta));
    }

    warn(message, meta = {}) {
        console.warn(this.formatMessage(LOG_LEVELS.WARN, message, meta));
    }

    info(message, meta = {}) {
        console.info(this.formatMessage(LOG_LEVELS.INFO, message, meta));
    }

    debug(message, meta = {}) {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(this.formatMessage(LOG_LEVELS.DEBUG, message, meta));
        }
    }
}

// Create default logger instance
const logger = new Logger();

// Factory function to create logger with custom context
function createLogger(context) {
    return new Logger(context);
}

export default logger;
export { Logger, createLogger };
