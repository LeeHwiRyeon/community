const os = require('os');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');
const mongoose = require('mongoose');

const execAsync = promisify(exec);

class SystemMonitor {
    constructor() {
        this.metrics = {
            system: {},
            application: {},
            database: {},
            performance: {},
            errors: []
        };

        this.alerts = [];
        this.thresholds = {
            cpu: 80, // CPU usage percentage
            memory: 85, // Memory usage percentage
            disk: 90, // Disk usage percentage
            responseTime: 2000, // Response time in ms
            errorRate: 5, // Error rate percentage
            dbConnections: 80 // Database connections percentage
        };

        this.startMonitoring();
    }

    // Start monitoring loop
    startMonitoring() {
        // Monitor every 30 seconds
        setInterval(() => {
            this.collectMetrics();
        }, 30000);

        // Check alerts every 10 seconds
        setInterval(() => {
            this.checkAlerts();
        }, 10000);

        // Clean old metrics every hour
        setInterval(() => {
            this.cleanOldMetrics();
        }, 3600000);
    }

    // Collect system metrics
    async collectMetrics() {
        try {
            await Promise.all([
                this.collectSystemMetrics(),
                this.collectApplicationMetrics(),
                this.collectDatabaseMetrics(),
                this.collectPerformanceMetrics()
            ]);
        } catch (error) {
            console.error('Error collecting metrics:', error);
            this.recordError('METRICS_COLLECTION_ERROR', error.message);
        }
    }

    // System-level metrics
    async collectSystemMetrics() {
        const cpus = os.cpus();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;

        // CPU usage calculation
        let cpuUsage = 0;
        if (this.metrics.system.cpu) {
            const prevCpu = this.metrics.system.cpu;
            const cpuTimes = cpus.map(cpu => {
                const times = Object.values(cpu.times);
                return times.reduce((a, b) => a + b, 0);
            });
            const totalCpuTime = cpuTimes.reduce((a, b) => a + b, 0);
            const idleCpuTime = cpus.reduce((a, cpu) => a + cpu.times.idle, 0);

            const prevTotalCpuTime = prevCpu.totalCpuTime || 0;
            const prevIdleCpuTime = prevCpu.idleCpuTime || 0;

            const totalCpuTimeDiff = totalCpuTime - prevTotalCpuTime;
            const idleCpuTimeDiff = idleCpuTime - prevIdleCpuTime;

            cpuUsage = totalCpuTimeDiff > 0 ?
                ((totalCpuTimeDiff - idleCpuTimeDiff) / totalCpuTimeDiff) * 100 : 0;
        }

        this.metrics.system = {
            cpu: {
                usage: Math.round(cpuUsage * 100) / 100,
                cores: cpus.length,
                totalCpuTime: cpus.reduce((a, cpu) => {
                    const times = Object.values(cpu.times);
                    return a + times.reduce((b, c) => b + c, 0);
                }, 0),
                idleCpuTime: cpus.reduce((a, cpu) => a + cpu.times.idle, 0)
            },
            memory: {
                total: totalMem,
                used: usedMem,
                free: freeMem,
                usage: Math.round((usedMem / totalMem) * 100 * 100) / 100
            },
            uptime: os.uptime(),
            loadAverage: os.loadavg(),
            platform: os.platform(),
            arch: os.arch(),
            hostname: os.hostname()
        };

        // Disk usage
        try {
            const diskUsage = await this.getDiskUsage();
            this.metrics.system.disk = diskUsage;
        } catch (error) {
            console.warn('Could not get disk usage:', error.message);
        }
    }

    // Application-level metrics
    async collectApplicationMetrics() {
        const memUsage = process.memoryUsage();

        this.metrics.application = {
            memory: {
                rss: memUsage.rss,
                heapTotal: memUsage.heapTotal,
                heapUsed: memUsage.heapUsed,
                external: memUsage.external,
                arrayBuffers: memUsage.arrayBuffers
            },
            uptime: process.uptime(),
            pid: process.pid,
            version: process.version,
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version
        };
    }

    // Database metrics
    async collectDatabaseMetrics() {
        try {
            const connection = mongoose.connection;

            this.metrics.database = {
                readyState: connection.readyState,
                host: connection.host,
                port: connection.port,
                name: connection.name,
                collections: Object.keys(connection.collections).length,
                models: Object.keys(connection.models).length
            };

            // Get database stats if available
            if (connection.readyState === 1) {
                try {
                    const stats = await connection.db.stats();
                    this.metrics.database.stats = {
                        collections: stats.collections,
                        dataSize: stats.dataSize,
                        storageSize: stats.storageSize,
                        indexes: stats.indexes,
                        indexSize: stats.indexSize
                    };
                } catch (error) {
                    console.warn('Could not get database stats:', error.message);
                }
            }
        } catch (error) {
            console.warn('Could not collect database metrics:', error.message);
        }
    }

    // Performance metrics
    collectPerformanceMetrics() {
        // This would be populated by the performance middleware
        // For now, we'll track basic performance data
        const now = Date.now();

        if (!this.metrics.performance.requests) {
            this.metrics.performance = {
                requests: 0,
                totalResponseTime: 0,
                averageResponseTime: 0,
                slowRequests: 0,
                errors: 0,
                lastUpdated: now
            };
        }

        this.metrics.performance.lastUpdated = now;
    }

    // Get disk usage
    async getDiskUsage() {
        try {
            if (process.platform === 'win32') {
                const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
                const lines = stdout.split('\n').filter(line => line.trim());
                const diskInfo = {};

                for (let i = 1; i < lines.length; i++) {
                    const parts = lines[i].trim().split(/\s+/);
                    if (parts.length >= 3) {
                        const caption = parts[0];
                        const freeSpace = parseInt(parts[1]) || 0;
                        const size = parseInt(parts[2]) || 0;

                        if (size > 0) {
                            diskInfo[caption] = {
                                total: size,
                                free: freeSpace,
                                used: size - freeSpace,
                                usage: Math.round(((size - freeSpace) / size) * 100 * 100) / 100
                            };
                        }
                    }
                }

                return diskInfo;
            } else {
                const { stdout } = await execAsync('df -h');
                const lines = stdout.split('\n').slice(1);
                const diskInfo = {};

                lines.forEach(line => {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 6) {
                        const filesystem = parts[0];
                        const total = parts[1];
                        const used = parts[2];
                        const available = parts[3];
                        const usage = parts[4];
                        const mounted = parts[5];

                        diskInfo[mounted] = {
                            filesystem,
                            total,
                            used,
                            available,
                            usage: parseInt(usage) || 0
                        };
                    }
                });

                return diskInfo;
            }
        } catch (error) {
            console.warn('Could not get disk usage:', error.message);
            return {};
        }
    }

    // Check for alerts
    checkAlerts() {
        const alerts = [];

        // CPU usage alert
        if (this.metrics.system.cpu?.usage > this.thresholds.cpu) {
            alerts.push({
                type: 'CPU_HIGH',
                severity: 'warning',
                message: `High CPU usage: ${this.metrics.system.cpu.usage}%`,
                value: this.metrics.system.cpu.usage,
                threshold: this.thresholds.cpu,
                timestamp: new Date().toISOString()
            });
        }

        // Memory usage alert
        if (this.metrics.system.memory?.usage > this.thresholds.memory) {
            alerts.push({
                type: 'MEMORY_HIGH',
                severity: 'warning',
                message: `High memory usage: ${this.metrics.system.memory.usage}%`,
                value: this.metrics.system.memory.usage,
                threshold: this.thresholds.memory,
                timestamp: new Date().toISOString()
            });
        }

        // Disk usage alert
        Object.entries(this.metrics.system.disk || {}).forEach(([mount, info]) => {
            if (info.usage > this.thresholds.disk) {
                alerts.push({
                    type: 'DISK_HIGH',
                    severity: 'warning',
                    message: `High disk usage on ${mount}: ${info.usage}%`,
                    value: info.usage,
                    threshold: this.thresholds.disk,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Database connection alert
        if (this.metrics.database?.readyState !== 1) {
            alerts.push({
                type: 'DATABASE_DISCONNECTED',
                severity: 'critical',
                message: 'Database connection lost',
                value: this.metrics.database?.readyState,
                threshold: 1,
                timestamp: new Date().toISOString()
            });
        }

        // Process alerts
        alerts.forEach(alert => {
            this.processAlert(alert);
        });
    }

    // Process individual alert
    processAlert(alert) {
        // Check if this alert already exists (avoid spam)
        const existingAlert = this.alerts.find(a =>
            a.type === alert.type &&
            (Date.now() - new Date(a.timestamp).getTime()) < 300000 // 5 minutes
        );

        if (!existingAlert) {
            this.alerts.push(alert);
            this.sendAlert(alert);
        }
    }

    // Send alert (implement based on your notification system)
    sendAlert(alert) {
        console.log(`ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);

        // Here you would integrate with your notification system:
        // - Send email
        // - Send Slack message
        // - Send SMS
        // - Log to external monitoring service

        // Example: Log to file
        this.logAlert(alert);
    }

    // Log alert to file
    async logAlert(alert) {
        try {
            const logEntry = `${new Date().toISOString()} [${alert.severity}] ${alert.type}: ${alert.message}\n`;
            await fs.appendFile('logs/alerts.log', logEntry);
        } catch (error) {
            console.error('Could not log alert:', error);
        }
    }

    // Record error
    recordError(type, message, stack = null) {
        const error = {
            type,
            message,
            stack,
            timestamp: new Date().toISOString(),
            pid: process.pid
        };

        this.metrics.errors.push(error);

        // Keep only last 100 errors
        if (this.metrics.errors.length > 100) {
            this.metrics.errors = this.metrics.errors.slice(-100);
        }
    }

    // Clean old metrics
    cleanOldMetrics() {
        // Remove alerts older than 1 hour
        const oneHourAgo = Date.now() - 3600000;
        this.alerts = this.alerts.filter(alert =>
            new Date(alert.timestamp).getTime() > oneHourAgo
        );

        // Remove errors older than 24 hours
        const oneDayAgo = Date.now() - 86400000;
        this.metrics.errors = this.metrics.errors.filter(error =>
            new Date(error.timestamp).getTime() > oneDayAgo
        );
    }

    // Get current metrics
    getMetrics() {
        return {
            ...this.metrics,
            alerts: this.alerts,
            timestamp: new Date().toISOString()
        };
    }

    // Get health status
    getHealthStatus() {
        const criticalAlerts = this.alerts.filter(a => a.severity === 'critical');
        const warningAlerts = this.alerts.filter(a => a.severity === 'warning');

        let status = 'healthy';
        if (criticalAlerts.length > 0) {
            status = 'critical';
        } else if (warningAlerts.length > 0) {
            status = 'warning';
        }

        return {
            status,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            alerts: {
                critical: criticalAlerts.length,
                warning: warningAlerts.length,
                total: this.alerts.length
            },
            metrics: this.metrics
        };
    }

    // Update performance metrics (called by middleware)
    updatePerformanceMetrics(data) {
        if (!this.metrics.performance) {
            this.metrics.performance = {
                requests: 0,
                totalResponseTime: 0,
                averageResponseTime: 0,
                slowRequests: 0,
                errors: 0,
                lastUpdated: Date.now()
            };
        }

        this.metrics.performance.requests += data.requests || 0;
        this.metrics.performance.totalResponseTime += data.totalResponseTime || 0;
        this.metrics.performance.slowRequests += data.slowRequests || 0;
        this.metrics.performance.errors += data.errors || 0;

        if (this.metrics.performance.requests > 0) {
            this.metrics.performance.averageResponseTime =
                Math.round(this.metrics.performance.totalResponseTime / this.metrics.performance.requests);
        }

        this.metrics.performance.lastUpdated = Date.now();
    }
}

// Create singleton instance
const monitor = new SystemMonitor();

module.exports = monitor;
