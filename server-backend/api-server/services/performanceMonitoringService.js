// 성능 모니터링 서비스
const os = require('os');
const { performance } = require('perf_hooks');

class PerformanceMonitoringService {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0
      },
      database: {
        queries: 0,
        averageQueryTime: 0,
        slowQueries: 0
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0
      },
      system: {
        memoryUsage: 0,
        cpuUsage: 0,
        uptime: 0
      }
    };
    
    this.responseTimes = [];
    this.queryTimes = [];
    this.startTime = Date.now();
  }

  // HTTP 요청 메트릭 업데이트
  recordRequest(method, route, statusCode, responseTime) {
    this.metrics.requests.total++;
    
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }
    
    this.responseTimes.push(responseTime);
    
    // 최근 100개 요청의 평균 응답 시간 계산
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
    
    this.metrics.requests.averageResponseTime = 
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
  }

  // 데이터베이스 쿼리 메트릭 업데이트
  recordDatabaseQuery(queryType, table, queryTime) {
    this.metrics.database.queries++;
    
    this.queryTimes.push(queryTime);
    
    // 최근 100개 쿼리의 평균 시간 계산
    if (this.queryTimes.length > 100) {
      this.queryTimes.shift();
    }
    
    this.metrics.database.averageQueryTime = 
      this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;
    
    // 느린 쿼리 카운트 (1초 이상)
    if (queryTime > 1) {
      this.metrics.database.slowQueries++;
    }
  }

  // 캐시 메트릭 업데이트
  recordCacheHit() {
    this.metrics.cache.hits++;
    this.updateCacheHitRate();
  }

  recordCacheMiss() {
    this.metrics.cache.misses++;
    this.updateCacheHitRate();
  }

  updateCacheHitRate() {
    const total = this.metrics.cache.hits + this.metrics.cache.misses;
    this.metrics.cache.hitRate = total > 0 ? (this.metrics.cache.hits / total) * 100 : 0;
  }

  // 시스템 메트릭 업데이트
  updateSystemMetrics() {
    const memUsage = process.memoryUsage();
    this.metrics.system.memoryUsage = Math.round(memUsage.heapUsed / 1024 / 1024); // MB
    this.metrics.system.cpuUsage = this.getCpuUsage();
    this.metrics.system.uptime = Math.round((Date.now() - this.startTime) / 1000); // 초
  }

  // CPU 사용률 계산
  getCpuUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    return Math.round(100 - (100 * totalIdle / totalTick));
  }

  // 성능 보고서 생성
  generateReport() {
    this.updateSystemMetrics();
    
    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      recommendations: this.generateRecommendations()
    };
  }

  // 성능 개선 권장사항 생성
  generateRecommendations() {
    const recommendations = [];
    
    // 응답 시간 권장사항
    if (this.metrics.requests.averageResponseTime > 1) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: '평균 응답 시간이 1초를 초과합니다. 캐싱 및 데이터베이스 최적화를 고려하세요.',
        currentValue: `${this.metrics.requests.averageResponseTime.toFixed(2)}초`,
        targetValue: '1초 이하'
      });
    }
    
    // 데이터베이스 쿼리 권장사항
    if (this.metrics.database.averageQueryTime > 0.5) {
      recommendations.push({
        type: 'database',
        priority: 'high',
        message: '데이터베이스 쿼리 시간이 느립니다. 인덱스 최적화를 고려하세요.',
        currentValue: `${this.metrics.database.averageQueryTime.toFixed(2)}초`,
        targetValue: '0.5초 이하'
      });
    }
    
    // 캐시 히트율 권장사항
    if (this.metrics.cache.hitRate < 80) {
      recommendations.push({
        type: 'cache',
        priority: 'medium',
        message: '캐시 히트율이 낮습니다. 캐싱 전략을 재검토하세요.',
        currentValue: `${this.metrics.cache.hitRate.toFixed(1)}%`,
        targetValue: '80% 이상'
      });
    }
    
    // 메모리 사용량 권장사항
    if (this.metrics.system.memoryUsage > 500) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        message: '메모리 사용량이 높습니다. 메모리 누수를 확인하세요.',
        currentValue: `${this.metrics.system.memoryUsage}MB`,
        targetValue: '500MB 이하'
      });
    }
    
    // 에러율 권장사항
    const errorRate = this.metrics.requests.total > 0 ? 
      (this.metrics.requests.failed / this.metrics.requests.total) * 100 : 0;
    
    if (errorRate > 5) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        message: '에러율이 높습니다. 에러 로그를 확인하고 문제를 해결하세요.',
        currentValue: `${errorRate.toFixed(1)}%`,
        targetValue: '5% 이하'
      });
    }
    
    return recommendations;
  }

  // 메트릭 리셋
  resetMetrics() {
    this.metrics = {
      requests: { total: 0, successful: 0, failed: 0, averageResponseTime: 0 },
      database: { queries: 0, averageQueryTime: 0, slowQueries: 0 },
      cache: { hits: 0, misses: 0, hitRate: 0 },
      system: { memoryUsage: 0, cpuUsage: 0, uptime: 0 }
    };
    
    this.responseTimes = [];
    this.queryTimes = [];
    this.startTime = Date.now();
  }
}

module.exports = new PerformanceMonitoringService();
