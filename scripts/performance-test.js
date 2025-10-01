// 성능 테스트 스크립트
const axios = require('axios');
const { performance } = require('perf_hooks');

const API_BASE_URL = 'http://localhost:50000/api';

// 테스트 설정
const TEST_CONFIG = {
  concurrentUsers: 10,
  requestsPerUser: 20,
  testDuration: 30000, // 30초
  endpoints: [
    { path: '/health-check', method: 'GET', weight: 30 },
    { path: '/posts', method: 'GET', weight: 25 },
    { path: '/users', method: 'GET', weight: 20 },
    { path: '/boards', method: 'GET', weight: 15 },
    { path: '/metrics/performance', method: 'GET', weight: 10 }
  ]
};

class PerformanceTester {
  constructor() {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errors: [],
      startTime: null,
      endTime: null
    };
  }

  // 랜덤 엔드포인트 선택
  selectRandomEndpoint() {
    const totalWeight = TEST_CONFIG.endpoints.reduce((sum, ep) => sum + ep.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const endpoint of TEST_CONFIG.endpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        return endpoint;
      }
    }
    
    return TEST_CONFIG.endpoints[0];
  }

  // 단일 요청 실행
  async executeRequest() {
    const endpoint = this.selectRandomEndpoint();
    const start = performance.now();
    
    try {
      const response = await axios({
        method: endpoint.method,
        url: `${API_BASE_URL}${endpoint.path}`,
        timeout: 5000
      });
      
      const end = performance.now();
      const responseTime = end - start;
      
      this.results.totalRequests++;
      this.results.successfulRequests++;
      this.results.responseTimes.push(responseTime);
      
      return {
        success: true,
        responseTime,
        statusCode: response.status,
        endpoint: endpoint.path
      };
    } catch (error) {
      const end = performance.now();
      const responseTime = end - start;
      
      this.results.totalRequests++;
      this.results.failedRequests++;
      this.results.errors.push({
        error: error.message,
        endpoint: endpoint.path,
        responseTime
      });
      
      return {
        success: false,
        responseTime,
        error: error.message,
        endpoint: endpoint.path
      };
    }
  }

  // 동시 사용자 시뮬레이션
  async simulateUser(userId) {
    const userResults = [];
    
    for (let i = 0; i < TEST_CONFIG.requestsPerUser; i++) {
      const result = await this.executeRequest();
      userResults.push(result);
      
      // 요청 간 간격 (100-500ms)
      await new Promise(resolve => 
        setTimeout(resolve, Math.random() * 400 + 100)
      );
    }
    
    return userResults;
  }

  // 성능 테스트 실행
  async runTest() {
    console.log('🚀 성능 테스트 시작...');
    console.log(`📊 설정: ${TEST_CONFIG.concurrentUsers}명의 사용자, 각 ${TEST_CONFIG.requestsPerUser}개 요청`);
    
    this.results.startTime = Date.now();
    
    // 동시 사용자 시뮬레이션
    const userPromises = [];
    for (let i = 0; i < TEST_CONFIG.concurrentUsers; i++) {
      userPromises.push(this.simulateUser(i + 1));
    }
    
    // 모든 사용자 완료 대기
    await Promise.all(userPromises);
    
    this.results.endTime = Date.now();
    
    // 결과 분석
    this.analyzeResults();
  }

  // 결과 분석
  analyzeResults() {
    const duration = (this.results.endTime - this.results.startTime) / 1000;
    const successRate = (this.results.successfulRequests / this.results.totalRequests) * 100;
    
    // 응답 시간 통계
    const responseTimes = this.results.responseTimes.sort((a, b) => a - b);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = responseTimes[0];
    const maxResponseTime = responseTimes[responseTimes.length - 1];
    const p50ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.5)];
    const p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)];
    const p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)];
    
    // RPS (Requests Per Second) 계산
    const rps = this.results.totalRequests / duration;
    
    console.log('\n📊 성능 테스트 결과');
    console.log('='.repeat(50));
    console.log(`⏱️  테스트 기간: ${duration.toFixed(2)}초`);
    console.log(`📈 총 요청 수: ${this.results.totalRequests}`);
    console.log(`✅ 성공한 요청: ${this.results.successfulRequests}`);
    console.log(`❌ 실패한 요청: ${this.results.failedRequests}`);
    console.log(`📊 성공률: ${successRate.toFixed(2)}%`);
    console.log(`🚀 RPS: ${rps.toFixed(2)}`);
    console.log('\n📈 응답 시간 통계');
    console.log('-'.repeat(30));
    console.log(`평균: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`최소: ${minResponseTime.toFixed(2)}ms`);
    console.log(`최대: ${maxResponseTime.toFixed(2)}ms`);
    console.log(`P50: ${p50ResponseTime.toFixed(2)}ms`);
    console.log(`P95: ${p95ResponseTime.toFixed(2)}ms`);
    console.log(`P99: ${p99ResponseTime.toFixed(2)}ms`);
    
    // 성능 평가
    this.evaluatePerformance(avgResponseTime, successRate, rps);
    
    // 에러 분석
    if (this.results.errors.length > 0) {
      console.log('\n❌ 에러 분석');
      console.log('-'.repeat(30));
      const errorGroups = {};
      this.results.errors.forEach(error => {
        const key = `${error.endpoint}: ${error.error}`;
        errorGroups[key] = (errorGroups[key] || 0) + 1;
      });
      
      Object.entries(errorGroups).forEach(([error, count]) => {
        console.log(`${error}: ${count}회`);
      });
    }
  }

  // 성능 평가
  evaluatePerformance(avgResponseTime, successRate, rps) {
    console.log('\n🎯 성능 평가');
    console.log('-'.repeat(30));
    
    // 응답 시간 평가
    if (avgResponseTime < 100) {
      console.log('✅ 응답 시간: 우수 (< 100ms)');
    } else if (avgResponseTime < 500) {
      console.log('⚠️  응답 시간: 양호 (100-500ms)');
    } else if (avgResponseTime < 1000) {
      console.log('⚠️  응답 시간: 보통 (500ms-1s)');
    } else {
      console.log('❌ 응답 시간: 개선 필요 (> 1s)');
    }
    
    // 성공률 평가
    if (successRate >= 99) {
      console.log('✅ 성공률: 우수 (≥ 99%)');
    } else if (successRate >= 95) {
      console.log('⚠️  성공률: 양호 (95-99%)');
    } else if (successRate >= 90) {
      console.log('⚠️  성공률: 보통 (90-95%)');
    } else {
      console.log('❌ 성공률: 개선 필요 (< 90%)');
    }
    
    // RPS 평가
    if (rps >= 100) {
      console.log('✅ 처리량: 우수 (≥ 100 RPS)');
    } else if (rps >= 50) {
      console.log('⚠️  처리량: 양호 (50-100 RPS)');
    } else if (rps >= 20) {
      console.log('⚠️  처리량: 보통 (20-50 RPS)');
    } else {
      console.log('❌ 처리량: 개선 필요 (< 20 RPS)');
    }
  }
}

// 테스트 실행
async function runPerformanceTest() {
  const tester = new PerformanceTester();
  
  try {
    await tester.runTest();
  } catch (error) {
    console.error('❌ 성능 테스트 실행 실패:', error);
  }
}

// 스크립트가 직접 실행된 경우
if (require.main === module) {
  runPerformanceTest();
}

module.exports = { PerformanceTester, runPerformanceTest };
