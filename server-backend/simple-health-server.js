const express = require('express');
const app = express();
const PORT = 50000;

// CORS 설정
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Health check 엔드포인트 (빠른 응답)
app.get('/api/health-check', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Health check 엔드포인트 (간단한 버전)
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 루트 경로
app.get('/', (req, res) => {
    res.json({
        message: 'Community Platform Health Server',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            healthCheck: '/api/health-check'
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Health server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health-check`);
    console.log(`📍 Health: http://localhost:${PORT}/api/health`);
    console.log(`📍 Root: http://localhost:${PORT}/`);
});
