// Prometheus 메트릭 엔드포인트
const express = require('express');
const router = express.Router();
const { register } = require('../middleware/metricsMiddleware');

// Prometheus 메트릭 엔드포인트
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error.message);
  }
});

// 헬스 체크 엔드포인트
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      environment: process.env.NODE_ENV || 'development'
    };

    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 성능 메트릭 요약 엔드포인트
router.get('/performance', async (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    const performance = {
      uptime: uptime,
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
      },
      cpu: {
        usage: process.cpuUsage()
      },
      timestamp: new Date().toISOString()
    };

    res.json(performance);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
