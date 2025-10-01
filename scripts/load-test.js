/**
 * Load Testing Script for Community Hub
 * Tests application performance under various load conditions
 */

const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');

class LoadTester {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'http://localhost:3001';
        this.concurrency = options.concurrency || 10;
        this.duration = options.duration || 60; // seconds
        this.rampUp = options.rampUp || 10; // seconds
        this.results = {
            requests: 0,
            errors: 0,
            responseTimes: [],
            throughput: 0,
            errorRate: 0
        };
        this.isRunning = false;
    }

    /**
     * Make HTTP request
     */
    async makeRequest(endpoint, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const startTime = performance.now();
            const url = new URL(endpoint, this.baseUrl);

            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'LoadTester/1.0'
                }
            };

            const client = url.protocol === 'https:' ? https : http;
            const req = client.request(options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    const endTime = performance.now();
                    const responseTime = endTime - startTime;

                    resolve({
                        statusCode: res.statusCode,
                        responseTime: responseTime,
                        data: responseData,
                        success: res.statusCode >= 200 && res.statusCode < 400
                    });
                });
            });

            req.on('error', (err) => {
                const endTime = performance.now();
                const responseTime = endTime - startTime;

                reject({
                    error: err.message,
                    responseTime: responseTime,
                    success: false
                });
            });

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    /**
     * Test specific endpoint
     */
    async testEndpoint(endpoint, method = 'GET', data = null) {
        try {
            const result = await this.makeRequest(endpoint, method, data);
            this.results.requests++;
            this.results.responseTimes.push(result.responseTime);

            if (!result.success) {
                this.results.errors++;
            }

            return result;
        } catch (error) {
            this.results.requests++;
            this.results.errors++;
            this.results.responseTimes.push(error.responseTime || 0);
            return error;
        }
    }

    /**
     * Run concurrent requests
     */
    async runConcurrentRequests(endpoints) {
        const promises = [];

        for (let i = 0; i < this.concurrency; i++) {
            const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
            promises.push(this.testEndpoint(endpoint));
        }

        await Promise.all(promises);
    }

    /**
     * Calculate statistics
     */
    calculateStats() {
        const responseTimes = this.results.responseTimes;
        const sortedTimes = responseTimes.sort((a, b) => a - b);

        const stats = {
            totalRequests: this.results.requests,
            totalErrors: this.results.errors,
            errorRate: (this.results.errors / this.results.requests) * 100,
            throughput: this.results.requests / this.duration,
            avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
            minResponseTime: Math.min(...responseTimes),
            maxResponseTime: Math.max(...responseTimes),
            p50ResponseTime: this.percentile(sortedTimes, 50),
            p90ResponseTime: this.percentile(sortedTimes, 90),
            p95ResponseTime: this.percentile(sortedTimes, 95),
            p99ResponseTime: this.percentile(sortedTimes, 99)
        };

        return stats;
    }

    /**
     * Calculate percentile
     */
    percentile(sortedArray, p) {
        const index = Math.ceil((p / 100) * sortedArray.length) - 1;
        return sortedArray[index] || 0;
    }

    /**
     * Run load test
     */
    async runLoadTest() {
        console.log('🚀 Starting Load Test...');
        console.log(`Base URL: ${this.baseUrl}`);
        console.log(`Concurrency: ${this.concurrency}`);
        console.log(`Duration: ${this.duration}s`);
        console.log(`Ramp-up: ${this.rampUp}s`);
        console.log('');

        this.isRunning = true;
        const startTime = performance.now();

        // Define test endpoints
        const endpoints = [
            '/api/health',
            '/api/posts',
            '/api/boards',
            '/api/users',
            '/api/search?q=test'
        ];

        // Ramp-up phase
        console.log('📈 Ramp-up phase...');
        const rampUpInterval = setInterval(async () => {
            if (!this.isRunning) {
                clearInterval(rampUpInterval);
                return;
            }

            await this.runConcurrentRequests(endpoints);
        }, 1000);

        // Wait for ramp-up
        await new Promise(resolve => setTimeout(resolve, this.rampUp * 1000));
        clearInterval(rampUpInterval);

        // Main test phase
        console.log('🔥 Main test phase...');
        const testInterval = setInterval(async () => {
            if (!this.isRunning) {
                clearInterval(testInterval);
                return;
            }

            await this.runConcurrentRequests(endpoints);
        }, 100);

        // Wait for test duration
        await new Promise(resolve => setTimeout(resolve, this.duration * 1000));

        this.isRunning = false;
        clearInterval(testInterval);

        const endTime = performance.now();
        const totalTime = (endTime - startTime) / 1000;

        // Calculate and display results
        const stats = this.calculateStats();

        console.log('\n📊 Load Test Results');
        console.log('==================');
        console.log(`Total Time: ${totalTime.toFixed(2)}s`);
        console.log(`Total Requests: ${stats.totalRequests}`);
        console.log(`Total Errors: ${stats.totalErrors}`);
        console.log(`Error Rate: ${stats.errorRate.toFixed(2)}%`);
        console.log(`Throughput: ${stats.throughput.toFixed(2)} req/s`);
        console.log('');
        console.log('Response Time Statistics:');
        console.log(`  Average: ${stats.avgResponseTime.toFixed(2)}ms`);
        console.log(`  Minimum: ${stats.minResponseTime.toFixed(2)}ms`);
        console.log(`  Maximum: ${stats.maxResponseTime.toFixed(2)}ms`);
        console.log(`  50th percentile: ${stats.p50ResponseTime.toFixed(2)}ms`);
        console.log(`  90th percentile: ${stats.p90ResponseTime.toFixed(2)}ms`);
        console.log(`  95th percentile: ${stats.p95ResponseTime.toFixed(2)}ms`);
        console.log(`  99th percentile: ${stats.p99ResponseTime.toFixed(2)}ms`);

        // Performance assessment
        console.log('\n🎯 Performance Assessment:');
        if (stats.errorRate > 5) {
            console.log('❌ High error rate detected - system may be overloaded');
        } else if (stats.p95ResponseTime > 2000) {
            console.log('⚠️  High response times detected - performance issues');
        } else if (stats.throughput < 10) {
            console.log('⚠️  Low throughput - system may be underperforming');
        } else {
            console.log('✅ Performance looks good!');
        }

        return stats;
    }

    /**
     * Run stress test
     */
    async runStressTest() {
        console.log('💪 Starting Stress Test...');

        const stressLevels = [5, 10, 20, 50, 100];
        const results = [];

        for (const level of stressLevels) {
            console.log(`\nTesting with ${level} concurrent users...`);

            this.concurrency = level;
            this.results = { requests: 0, errors: 0, responseTimes: [], throughput: 0, errorRate: 0 };

            const startTime = performance.now();
            await this.runLoadTest();
            const endTime = performance.now();

            const stats = this.calculateStats();
            results.push({
                concurrency: level,
                ...stats
            });

            // Wait between tests
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        console.log('\n📈 Stress Test Results Summary:');
        console.log('Concurrency | Requests | Errors | Error Rate | Throughput | Avg Response');
        console.log('------------|----------|--------|------------|------------|-------------');

        results.forEach(result => {
            console.log(`${result.concurrency.toString().padStart(11)} | ${result.totalRequests.toString().padStart(8)} | ${result.totalErrors.toString().padStart(6)} | ${result.errorRate.toFixed(2).padStart(10)}% | ${result.throughput.toFixed(2).padStart(10)} req/s | ${result.avgResponseTime.toFixed(2).padStart(11)}ms`);
        });

        return results;
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};

    // Parse command line arguments
    for (let i = 0; i < args.length; i += 2) {
        const key = args[i].replace('--', '');
        const value = args[i + 1];

        if (key === 'url') options.baseUrl = value;
        if (key === 'concurrency') options.concurrency = parseInt(value);
        if (key === 'duration') options.duration = parseInt(value);
        if (key === 'rampup') options.rampUp = parseInt(value);
    }

    const tester = new LoadTester(options);

    if (args.includes('--stress')) {
        tester.runStressTest().catch(console.error);
    } else {
        tester.runLoadTest().catch(console.error);
    }
}

module.exports = LoadTester;
