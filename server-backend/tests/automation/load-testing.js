const axios = require('axios');
const { performance } = require('perf_hooks');

/**
 * 부하 테스트 자동화
 * - 동시 사용자 시뮬레이션
 * - 메모리 사용량 모니터링
 * - 응답 시간 측정
 * - 에러율 계산
 */

class LoadTester {
    constructor(baseURL = 'http://localhost:5002') {
        this.baseURL = baseURL;
        this.results = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            maxResponseTime: 0,
            minResponseTime: Infinity,
            errors: [],
            memoryUsage: [],
            cpuUsage: []
        };
    }

    async runLoadTest(options = {}) {
        const {
            concurrentUsers = 10,
            duration = 30, // seconds
            rampUpTime = 5, // seconds
            testScenarios = ['posts', 'search', 'trending']
        } = options;

        console.log(`🚀 부하 테스트 시작...`);
        console.log(`동시 사용자: ${concurrentUsers}`);
        console.log(`테스트 시간: ${duration}초`);
        console.log(`램프업 시간: ${rampUpTime}초`);
        console.log(`테스트 시나리오: ${testScenarios.join(', ')}\n`);

        const startTime = Date.now();
        const endTime = startTime + (duration * 1000);
        
        // 메모리 모니터링 시작
        this.startMemoryMonitoring();
        
        // 동시 사용자 시뮬레이션
        const userPromises = [];
        for (let i = 0; i < concurrentUsers; i++) {
            const delay = (rampUpTime * 1000 * i) / concurrentUsers;
            userPromises.push(this.simulateUser(i, delay, endTime, testScenarios));
        }

        await Promise.all(userPromises);
        
        // 메모리 모니터링 중지
        this.stopMemoryMonitoring();
        
        this.calculateResults();
        this.printResults();
        
        return this.results;
    }

    async simulateUser(userId, delay, endTime, testScenarios) {
        // 램프업 지연
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        const userResults = {
            requests: 0,
            successful: 0,
            failed: 0,
            responseTimes: []
        };

        while (Date.now() < endTime) {
            const scenario = testScenarios[Math.floor(Math.random() * testScenarios.length)];
            const result = await this.executeScenario(scenario, userId);
            
            userResults.requests++;
            if (result.success) {
                userResults.successful++;
                userResults.responseTimes.push(result.responseTime);
            } else {
                userResults.failed++;
                this.results.errors.push(result.error);
            }

            // 요청 간 랜덤 지연 (1-3초)
            const delay = Math.random() * 2000 + 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // 결과 집계
        this.results.totalRequests += userResults.requests;
        this.results.successfulRequests += userResults.successful;
        this.results.failedRequests += userResults.failed;
        
        if (userResults.responseTimes.length > 0) {
            const userAvgTime = userResults.responseTimes.reduce((a, b) => a + b, 0) / userResults.responseTimes.length;
            this.results.maxResponseTime = Math.max(this.results.maxResponseTime, Math.max(...userResults.responseTimes));
            this.results.minResponseTime = Math.min(this.results.minResponseTime, Math.min(...userResults.responseTimes));
        }
    }

    async executeScenario(scenario, userId) {
        const startTime = performance.now();
        
        try {
            let response;
            
            switch (scenario) {
                case 'posts':
                    response = await axios.get(`${this.baseURL}/api/posts`, {
                        timeout: 10000,
                        headers: { 'User-Agent': `LoadTest-User-${userId}` }
                    });
                    break;
                    
                case 'search':
                    const searchQueries = ['test', 'community', 'javascript', 'react', 'nodejs'];
                    const query = searchQueries[Math.floor(Math.random() * searchQueries.length)];
                    response = await axios.get(`${this.baseURL}/api/search?q=${encodeURIComponent(query)}`, {
                        timeout: 10000,
                        headers: { 'User-Agent': `LoadTest-User-${userId}` }
                    });
                    break;
                    
                case 'trending':
                    response = await axios.get(`${this.baseURL}/api/posts/trending`, {
                        timeout: 10000,
                        headers: { 'User-Agent': `LoadTest-User-${userId}` }
                    });
                    break;
                    
                case 'profile':
                    response = await axios.get(`${this.baseURL}/api/users/profile`, {
                        timeout: 10000,
                        headers: { 'User-Agent': `LoadTest-User-${userId}` }
                    });
                    break;
                    
                default:
                    response = await axios.get(`${this.baseURL}/api/posts`, {
                        timeout: 10000,
                        headers: { 'User-Agent': `LoadTest-User-${userId}` }
                    });
            }
            
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            return {
                success: true,
                responseTime: responseTime,
                status: response.status
            };
            
        } catch (error) {
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            return {
                success: false,
                responseTime: responseTime,
                error: `${scenario}: ${error.message}`
            };
        }
    }

    startMemoryMonitoring() {
        this.memoryInterval = setInterval(() => {
            const memUsage = process.memoryUsage();
            this.results.memoryUsage.push({
                timestamp: Date.now(),
                rss: memUsage.rss,
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                external: memUsage.external
            });
        }, 1000); // 1초마다 측정
    }

    stopMemoryMonitoring() {
        if (this.memoryInterval) {
            clearInterval(this.memoryInterval);
        }
    }

    calculateResults() {
        if (this.results.totalRequests > 0) {
            this.results.averageResponseTime = this.results.maxResponseTime > 0 ? 
                (this.results.maxResponseTime + this.results.minResponseTime) / 2 : 0;
        }
        
        // 메모리 사용량 통계 계산
        if (this.results.memoryUsage.length > 0) {
            const rssValues = this.results.memoryUsage.map(m => m.rss);
            const heapUsedValues = this.results.memoryUsage.map(m => m.heapUsed);
            
            this.results.memoryStats = {
                maxRSS: Math.max(...rssValues),
                avgRSS: rssValues.reduce((a, b) => a + b, 0) / rssValues.length,
                maxHeapUsed: Math.max(...heapUsedValues),
                avgHeapUsed: heapUsedValues.reduce((a, b) => a + b, 0) / heapUsedValues.length
            };
        }
    }

    printResults() {
        console.log('\n📊 부하 테스트 결과');
        console.log('='.repeat(60));
        console.log(`총 요청 수: ${this.results.totalRequests}`);
        console.log(`성공한 요청: ${this.results.successfulRequests}`);
        console.log(`실패한 요청: ${this.results.failedRequests}`);
        console.log(`성공률: ${((this.results.successfulRequests / this.results.totalRequests) * 100).toFixed(2)}%`);
        console.log(`에러율: ${((this.results.failedRequests / this.results.totalRequests) * 100).toFixed(2)}%`);
        
        console.log('\n⏱️  응답 시간 통계');
        console.log('-'.repeat(30));
        console.log(`평균 응답 시간: ${this.results.averageResponseTime.toFixed(2)}ms`);
        console.log(`최대 응답 시간: ${this.results.maxResponseTime.toFixed(2)}ms`);
        console.log(`최소 응답 시간: ${this.results.minResponseTime === Infinity ? 'N/A' : this.results.minResponseTime.toFixed(2)}ms`);
        
        if (this.results.memoryStats) {
            console.log('\n💾 메모리 사용량 통계');
            console.log('-'.repeat(30));
            console.log(`최대 RSS: ${(this.results.memoryStats.maxRSS / 1024 / 1024).toFixed(2)}MB`);
            console.log(`평균 RSS: ${(this.results.memoryStats.avgRSS / 1024 / 1024).toFixed(2)}MB`);
            console.log(`최대 힙 사용량: ${(this.results.memoryStats.maxHeapUsed / 1024 / 1024).toFixed(2)}MB`);
            console.log(`평균 힙 사용량: ${(this.results.memoryStats.avgHeapUsed / 1024 / 1024).toFixed(2)}MB`);
        }
        
        if (this.results.errors.length > 0) {
            console.log('\n🚨 에러 목록 (최대 10개)');
            console.log('-'.repeat(30));
            this.results.errors.slice(0, 10).forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
            if (this.results.errors.length > 10) {
                console.log(`... 및 ${this.results.errors.length - 10}개 추가 에러`);
            }
        }
        
        // 성능 평가
        console.log('\n🎯 성능 평가');
        console.log('-'.repeat(30));
        const successRate = (this.results.successfulRequests / this.results.totalRequests) * 100;
        const avgResponseTime = this.results.averageResponseTime;
        
        if (successRate >= 99 && avgResponseTime <= 200) {
            console.log('✅ 우수: 높은 성공률과 빠른 응답 시간');
        } else if (successRate >= 95 && avgResponseTime <= 500) {
            console.log('⚠️  보통: 개선이 필요한 성능');
        } else {
            console.log('❌ 개선 필요: 낮은 성공률 또는 느린 응답 시간');
        }
    }
}

// 테스트 실행
if (require.main === module) {
    const tester = new LoadTester();
    
    // 다양한 부하 테스트 시나리오
    const scenarios = [
        { concurrentUsers: 10, duration: 30, testScenarios: ['posts', 'search'] },
        { concurrentUsers: 50, duration: 60, testScenarios: ['posts', 'search', 'trending'] },
        { concurrentUsers: 100, duration: 120, testScenarios: ['posts', 'search', 'trending', 'profile'] }
    ];
    
    async function runAllScenarios() {
        for (let i = 0; i < scenarios.length; i++) {
            console.log(`\n🔄 시나리오 ${i + 1}/${scenarios.length} 실행 중...`);
            await tester.runLoadTest(scenarios[i]);
            
            if (i < scenarios.length - 1) {
                console.log('\n⏳ 다음 시나리오까지 10초 대기...');
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }
    }
    
    runAllScenarios().then(() => {
        console.log('\n🎉 모든 부하 테스트 완료!');
        process.exit(0);
    }).catch(error => {
        console.error('❌ 부하 테스트 실패:', error);
        process.exit(1);
    });
}

module.exports = LoadTester;

