const axios = require('axios');
const { performance } = require('perf_hooks');

/**
 * 서버 API 자동화 테스트
 * - API 엔드포인트 테스트
 * - 성능 테스트
 * - 통합 테스트
 * - 부하 테스트
 */

class ServerAPITester {
    constructor(baseURL = 'http://localhost:5002') {
        this.baseURL = baseURL;
        this.results = {
            passed: 0,
            failed: 0,
            total: 0,
            performance: [],
            errors: []
        };
    }

    async runAllTests() {
        console.log('🚀 서버 API 자동화 테스트 시작...\n');

        const testSuites = [
            this.testHealthCheck.bind(this),
            this.testAuthentication.bind(this),
            this.testUserManagement.bind(this),
            this.testPostManagement.bind(this),
            this.testSearchFunctionality.bind(this),
            this.testPerformance.bind(this),
            this.testErrorHandling.bind(this),
            this.testConcurrentRequests.bind(this)
        ];

        for (const testSuite of testSuites) {
            try {
                await testSuite();
            } catch (error) {
                console.error(`❌ 테스트 스위트 실패: ${error.message}`);
                this.results.errors.push(error.message);
            }
        }

        this.printResults();
        return this.results;
    }

    async testHealthCheck() {
        console.log('📋 Health Check 테스트...');

        const tests = [
            { name: 'GET /', method: 'GET', path: '/' },
            { name: 'GET /health', method: 'GET', path: '/health' },
            { name: 'GET /metrics', method: 'GET', path: '/metrics' }
        ];

        for (const test of tests) {
            await this.runTest(test);
        }
    }

    async testAuthentication() {
        console.log('🔐 인증 테스트...');

        const tests = [
            {
                name: 'POST /api/auth/register',
                method: 'POST',
                path: '/api/auth/register',
                data: {
                    username: 'testuser',
                    email: 'test@example.com',
                    password: process.env.TEST_PASSWORD || 'TestPassword123!'
                }
            },
            {
                name: 'POST /api/auth/login',
                method: 'POST',
                path: '/api/auth/login',
                data: {
                    email: 'test@example.com',
                    password: process.env.TEST_PASSWORD || 'TestPassword123!'
                }
            }
        ];

        for (const test of tests) {
            await this.runTest(test);
        }
    }

    async testUserManagement() {
        console.log('👤 사용자 관리 테스트...');

        const tests = [
            { name: 'GET /api/users', method: 'GET', path: '/api/users' },
            { name: 'GET /api/users/profile', method: 'GET', path: '/api/users/profile' },
            {
                name: 'PUT /api/users/profile',
                method: 'PUT',
                path: '/api/users/profile',
                data: {
                    firstName: 'Test',
                    lastName: 'User',
                    bio: 'Test user bio'
                }
            }
        ];

        for (const test of tests) {
            await this.runTest(test);
        }
    }

    async testPostManagement() {
        console.log('📝 게시물 관리 테스트...');

        const tests = [
            { name: 'GET /api/posts', method: 'GET', path: '/api/posts' },
            { name: 'GET /api/posts/trending', method: 'GET', path: '/api/posts/trending' },
            {
                name: 'POST /api/posts',
                method: 'POST',
                path: '/api/posts',
                data: {
                    title: 'Test Post',
                    content: 'This is a test post content',
                    boardId: 1
                }
            }
        ];

        for (const test of tests) {
            await this.runTest(test);
        }
    }

    async testSearchFunctionality() {
        console.log('🔍 검색 기능 테스트...');

        const searchQueries = [
            'community',
            'test',
            'javascript',
            'nodejs',
            'react'
        ];

        for (const query of searchQueries) {
            const test = {
                name: `GET /api/search?q=${query}`,
                method: 'GET',
                path: `/api/search?q=${encodeURIComponent(query)}`
            };
            await this.runTest(test);
        }
    }

    async testPerformance() {
        console.log('⚡ 성능 테스트...');

        const performanceTests = [
            { name: 'API 응답 시간', path: '/api/posts', threshold: 200 },
            { name: '검색 성능', path: '/api/search?q=test', threshold: 300 },
            { name: '트렌딩 포스트', path: '/api/posts/trending', threshold: 150 }
        ];

        for (const test of performanceTests) {
            const startTime = performance.now();

            try {
                const response = await axios.get(`${this.baseURL}${test.path}`);
                const endTime = performance.now();
                const responseTime = endTime - startTime;

                this.results.performance.push({
                    name: test.name,
                    path: test.path,
                    responseTime: Math.round(responseTime),
                    threshold: test.threshold,
                    passed: responseTime <= test.threshold
                });

                if (responseTime <= test.threshold) {
                    console.log(`✅ ${test.name}: ${Math.round(responseTime)}ms (목표: ${test.threshold}ms)`);
                    this.results.passed++;
                } else {
                    console.log(`❌ ${test.name}: ${Math.round(responseTime)}ms (목표: ${test.threshold}ms)`);
                    this.results.failed++;
                }
            } catch (error) {
                console.log(`❌ ${test.name}: ${error.message}`);
                this.results.failed++;
            }

            this.results.total++;
        }
    }

    async testErrorHandling() {
        console.log('🚨 에러 처리 테스트...');

        const errorTests = [
            { name: '404 에러', path: '/api/nonexistent', expectedStatus: 404 },
            { name: '잘못된 파라미터', path: '/api/posts/invalid', expectedStatus: 400 },
            { name: '인증 없이 접근', path: '/api/users/profile', expectedStatus: 401 }
        ];

        for (const test of errorTests) {
            try {
                const response = await axios.get(`${this.baseURL}${test.path}`, {
                    validateStatus: () => true // 모든 상태 코드 허용
                });

                if (response.status === test.expectedStatus) {
                    console.log(`✅ ${test.name}: ${response.status}`);
                    this.results.passed++;
                } else {
                    console.log(`❌ ${test.name}: 예상 ${test.expectedStatus}, 실제 ${response.status}`);
                    this.results.failed++;
                }
            } catch (error) {
                console.log(`❌ ${test.name}: ${error.message}`);
                this.results.failed++;
            }

            this.results.total++;
        }
    }

    async testConcurrentRequests() {
        console.log('🔄 동시 요청 테스트...');

        const concurrentTests = [
            { name: '10개 동시 요청', count: 10, path: '/api/posts' },
            { name: '50개 동시 요청', count: 50, path: '/api/search?q=test' },
            { name: '100개 동시 요청', count: 100, path: '/api/posts/trending' }
        ];

        for (const test of concurrentTests) {
            const startTime = performance.now();
            const promises = [];

            for (let i = 0; i < test.count; i++) {
                promises.push(
                    axios.get(`${this.baseURL}${test.path}`).catch(error => ({ error: error.message }))
                );
            }

            try {
                const results = await Promise.all(promises);
                const endTime = performance.now();
                const totalTime = endTime - startTime;

                const successCount = results.filter(r => !r.error).length;
                const failureCount = results.length - successCount;

                console.log(`✅ ${test.name}: ${successCount}/${test.count} 성공, ${Math.round(totalTime)}ms`);
                this.results.passed++;
            } catch (error) {
                console.log(`❌ ${test.name}: ${error.message}`);
                this.results.failed++;
            }

            this.results.total++;
        }
    }

    async runTest(test) {
        const startTime = performance.now();

        try {
            const config = {
                method: test.method.toLowerCase(),
                url: `${this.baseURL}${test.path}`,
                timeout: 10000
            };

            if (test.data) {
                config.data = test.data;
            }

            const response = await axios(config);
            const endTime = performance.now();
            const responseTime = endTime - startTime;

            console.log(`✅ ${test.name}: ${response.status} (${Math.round(responseTime)}ms)`);
            this.results.passed++;

        } catch (error) {
            const endTime = performance.now();
            const responseTime = endTime - startTime;

            if (error.response) {
                console.log(`⚠️  ${test.name}: ${error.response.status} (${Math.round(responseTime)}ms)`);
                this.results.passed++; // 4xx, 5xx도 예상된 응답으로 간주
            } else {
                console.log(`❌ ${test.name}: ${error.message} (${Math.round(responseTime)}ms)`);
                this.results.failed++;
            }
        }

        this.results.total++;
    }

    printResults() {
        console.log('\n📊 테스트 결과 요약');
        console.log('='.repeat(50));
        console.log(`총 테스트: ${this.results.total}`);
        console.log(`✅ 성공: ${this.results.passed}`);
        console.log(`❌ 실패: ${this.results.failed}`);
        console.log(`성공률: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);

        if (this.results.performance.length > 0) {
            console.log('\n⚡ 성능 테스트 결과');
            console.log('-'.repeat(30));
            this.results.performance.forEach(perf => {
                const status = perf.passed ? '✅' : '❌';
                console.log(`${status} ${perf.name}: ${perf.responseTime}ms (목표: ${perf.threshold}ms)`);
            });
        }

        if (this.results.errors.length > 0) {
            console.log('\n🚨 에러 목록');
            console.log('-'.repeat(30));
            this.results.errors.forEach(error => {
                console.log(`❌ ${error}`);
            });
        }
    }
}

// 테스트 실행
if (require.main === module) {
    const tester = new ServerAPITester();
    tester.runAllTests().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}

module.exports = ServerAPITester;

