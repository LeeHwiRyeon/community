const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const Redis = require('redis');

// Redis client for caching
let redisClient;

// Initialize Redis connection
const initRedis = async () => {
    try {
        redisClient = Redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD
        });

        await redisClient.connect();
        console.log('Redis connected successfully');
    } catch (error) {
        console.warn('Redis connection failed, using memory cache:', error.message);
    }
};

// Memory cache fallback
const memoryCache = new Map();
const CACHE_TTL = 300000; // 5 minutes

// Cache middleware
const cacheMiddleware = (duration = 300) => {
    return async (req, res, next) => {
        const key = `cache:${req.originalUrl}:${JSON.stringify(req.query)}`;

        try {
            // Try Redis first
            if (redisClient) {
                const cached = await redisClient.get(key);
                if (cached) {
                    return res.json(JSON.parse(cached));
                }
            } else {
                // Fallback to memory cache
                const cached = memoryCache.get(key);
                if (cached && Date.now() - cached.timestamp < duration * 1000) {
                    return res.json(cached.data);
                }
            }

            // Store original res.json
            const originalJson = res.json;
            res.json = function (data) {
                // Cache the response
                const cacheData = {
                    data: data,
                    timestamp: Date.now()
                };

                if (redisClient) {
                    redisClient.setEx(key, duration, JSON.stringify(data));
                } else {
                    memoryCache.set(key, cacheData);
                }

                // Call original res.json
                originalJson.call(this, data);
            };

            next();
        } catch (error) {
            console.error('Cache error:', error);
            next();
        }
    };
};

// Database query optimization middleware
const queryOptimization = (req, res, next) => {
    // Add query optimization hints
    req.queryOptimization = {
        limit: Math.min(parseInt(req.query.limit) || 20, 100),
        skip: (parseInt(req.query.page) - 1) * (parseInt(req.query.limit) || 20) || 0,
        sort: req.query.sortBy || 'createdAt',
        order: req.query.sortOrder === 'asc' ? 1 : -1
    };

    next();
};

// Response time tracking
const responseTime = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;

        // Log slow requests
        if (duration > 1000) {
            console.warn(`Slow request: ${req.method} ${req.originalUrl} - ${duration}ms`);
        }

        // Add response time header
        res.set('X-Response-Time', `${duration}ms`);
    });

    next();
};

// Rate limiting
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: { error: message },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                error: message,
                retryAfter: Math.round(windowMs / 1000)
            });
        }
    });
};

// API rate limiting
const apiRateLimit = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    1000, // 1000 requests per window
    'Too many requests from this IP, please try again later'
);

// Auth rate limiting
const authRateLimit = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5, // 5 login attempts per window
    'Too many authentication attempts, please try again later'
);

// Upload rate limiting
const uploadRateLimit = createRateLimit(
    60 * 60 * 1000, // 1 hour
    100, // 100 uploads per hour
    'Too many file uploads, please try again later'
);

// Slow down middleware
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // Allow 50 requests per 15 minutes, then...
    delayMs: 500 // Add 500ms delay per request above delayAfter
});

// Security headers
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false
});

// Database connection pooling optimization
const optimizeDatabase = (mongoose) => {
    mongoose.set('bufferCommands', false);
    mongoose.set('bufferMaxEntries', 0);

    // Connection options
    const options = {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4, // Use IPv4, skip trying IPv6
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        minPoolSize: 5 // Maintain a minimum of 5 socket connections
    };

    return options;
};

// Memory usage monitoring
const memoryMonitor = (req, res, next) => {
    const memUsage = process.memoryUsage();
    const memUsageMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
    };

    // Add memory usage to response headers
    res.set('X-Memory-Usage', JSON.stringify(memUsageMB));

    // Log high memory usage
    if (memUsageMB.heapUsed > 500) { // 500MB threshold
        console.warn(`High memory usage: ${memUsageMB.heapUsed}MB`);
    }

    next();
};

// Cleanup memory cache periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            memoryCache.delete(key);
        }
    }
}, 60000); // Clean up every minute

// Performance metrics collection
const performanceMetrics = {
    requests: 0,
    totalResponseTime: 0,
    slowRequests: 0,
    errors: 0,

    recordRequest: (responseTime) => {
        performanceMetrics.requests++;
        performanceMetrics.totalResponseTime += responseTime;

        if (responseTime > 1000) {
            performanceMetrics.slowRequests++;
        }
    },

    recordError: () => {
        performanceMetrics.errors++;
    },

    getStats: () => {
        const avgResponseTime = performanceMetrics.requests > 0
            ? performanceMetrics.totalResponseTime / performanceMetrics.requests
            : 0;

        return {
            totalRequests: performanceMetrics.requests,
            averageResponseTime: Math.round(avgResponseTime),
            slowRequests: performanceMetrics.slowRequests,
            errorRate: performanceMetrics.requests > 0
                ? (performanceMetrics.errors / performanceMetrics.requests * 100).toFixed(2) + '%'
                : '0%'
        };
    }
};

// Metrics collection middleware
const metricsCollection = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const responseTime = Date.now() - start;
        performanceMetrics.recordRequest(responseTime);

        if (res.statusCode >= 400) {
            performanceMetrics.recordError();
        }
    });

    next();
};

// Health check endpoint
const healthCheck = (req, res) => {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    const performance = performanceMetrics.getStats();

    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.round(uptime),
        memory: {
            rss: Math.round(memUsage.rss / 1024 / 1024),
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
        },
        performance,
        redis: redisClient ? 'connected' : 'disconnected'
    });
};

module.exports = {
    initRedis,
    cacheMiddleware,
    queryOptimization,
    responseTime,
    apiRateLimit,
    authRateLimit,
    uploadRateLimit,
    speedLimiter,
    securityHeaders,
    optimizeDatabase,
    memoryMonitor,
    metricsCollection,
    healthCheck,
    performanceMetrics
};