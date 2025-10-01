// Prometheus 메트릭 수집 미들웨어
const client = require('prom-client');

// 메트릭 레지스트리 생성
const register = new client.Registry();

// 기본 메트릭 수집
client.collectDefaultMetrics({ register });

// 커스텀 메트릭 정의
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

const databaseQueryDuration = new client.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5]
});

const cacheHitRate = new client.Gauge({
  name: 'cache_hit_rate',
  help: 'Cache hit rate percentage',
  labelNames: ['cache_type']
});

const memoryUsage = new client.Gauge({
  name: 'memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type']
});

const cpuUsage = new client.Gauge({
  name: 'cpu_usage_percent',
  help: 'CPU usage percentage'
});

// 메트릭을 레지스트리에 등록
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(databaseQueryDuration);
register.registerMetric(cacheHitRate);
register.registerMetric(memoryUsage);
register.registerMetric(cpuUsage);

// HTTP 요청 메트릭 수집 미들웨어
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
};

// 데이터베이스 쿼리 메트릭 수집 함수
const recordDatabaseQuery = (queryType, table, duration) => {
  databaseQueryDuration
    .labels(queryType, table)
    .observe(duration);
};

// 캐시 히트율 업데이트 함수
const updateCacheHitRate = (cacheType, hitRate) => {
  cacheHitRate
    .labels(cacheType)
    .set(hitRate);
};

// 메모리 사용량 업데이트 함수
const updateMemoryUsage = () => {
  const memUsage = process.memoryUsage();
  
  memoryUsage.labels('rss').set(memUsage.rss);
  memoryUsage.labels('heapTotal').set(memUsage.heapTotal);
  memoryUsage.labels('heapUsed').set(memUsage.heapUsed);
  memoryUsage.labels('external').set(memUsage.external);
};

// CPU 사용량 업데이트 함수
const updateCpuUsage = () => {
  const cpuUsagePercent = process.cpuUsage();
  const totalCpuUsage = (cpuUsagePercent.user + cpuUsagePercent.system) / 1000000; // 마이크로초를 초로 변환
  
  cpuUsage.set(totalCpuUsage);
};

// 활성 연결 수 업데이트 함수
const updateActiveConnections = (count) => {
  activeConnections.set(count);
};

// 정기적으로 시스템 메트릭 업데이트
setInterval(() => {
  updateMemoryUsage();
  updateCpuUsage();
}, 5000); // 5초마다 업데이트

module.exports = {
  register,
  metricsMiddleware,
  recordDatabaseQuery,
  updateCacheHitRate,
  updateActiveConnections,
  httpRequestDuration,
  httpRequestTotal,
  activeConnections,
  databaseQueryDuration,
  cacheHitRate,
  memoryUsage,
  cpuUsage
};
