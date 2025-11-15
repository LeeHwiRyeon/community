import WebSocket, { WebSocketServer } from 'ws';
import { enhancedLogger } from './enhanced-logger.js';
import jwt from 'jsonwebtoken';

export function setupLogStreaming(server) {
    // WebSocket 서버 생성
    const wss = new WebSocketServer({
        server,
        path: '/api/logs/stream'
    });

    wss.on('connection', (ws, request) => {
        const ip = request.socket.remoteAddress;

        enhancedLogger.info('log.stream.connected', {
            ip,
            clientCount: wss.clients.size
        });

        // 인증 체크
        if (process.env.NODE_ENV === 'production') {
            // 프로덕션 환경에서는 인증 토큰 검증 필수
            const authToken = new URL(request.url, 'http://localhost').searchParams.get('token');
            if (!authToken || !isValidLogToken(authToken)) {
                ws.close(1008, 'Unauthorized');
                return;
            }
        }

        // 클라이언트를 실시간 로거에 등록
        enhancedLogger.addRealtimeClient(ws);

        // 연결 시 환영 메시지
        ws.send(JSON.stringify({
            type: 'welcome',
            timestamp: new Date().toISOString(),
            message: 'Connected to real-time log stream',
            config: {
                logLevel: process.env.LOG_LEVEL || 'info',
                jsonMode: process.env.LOG_JSON === '1'
            }
        }));

        // 연결 해제 시 정리
        ws.on('close', () => {
            enhancedLogger.info('log.stream.disconnected', {
                ip,
                clientCount: wss.clients.size - 1
            });
        });

        // 에러 처리
        ws.on('error', (error) => {
            enhancedLogger.warn('log.stream.error', {
                ip,
                error: error.message
            });
        });

        // 클라이언트로부터 메시지 수신 (필터링 등 제어용)
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                handleLogStreamMessage(ws, message);
            } catch (error) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid message format'
                }));
            }
        });
    });

    return wss;
}

function handleLogStreamMessage(ws, message) {
    switch (message.type) {
        case 'filter':
            // 로그 레벨 필터링 설정
            ws.logFilter = message.filter;
            ws.send(JSON.stringify({
                type: 'ack',
                message: 'Filter applied',
                filter: message.filter
            }));
            break;

        case 'ping':
            ws.send(JSON.stringify({
                type: 'pong',
                timestamp: new Date().toISOString()
            }));
            break;

        default:
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Unknown message type'
            }));
    }
}

function isValidLogToken(token) {
    // JWT 토큰 검증
    try {
        jwt.verify(token, process.env.JWT_SECRET);
        return true;
    } catch (error) {
        // JWT 실패 시 환경 변수 토큰으로 폴백
        const validTokens = process.env.LOG_STREAM_TOKENS?.split(',') || [];
        return validTokens.includes(token);
    }
}

// HTTP 엔드포인트로도 로그 조회 가능
export function setupLogEndpoints(app) {
    // 최근 로그 조회
    app.get('/api/logs/recent', async (req, res) => {
        try {
            const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
            const level = req.query.level;

            const logs = await getRecentLogs(limit, level);

            res.json({
                success: true,
                logs,
                count: logs.length,
                limit
            });
        } catch (error) {
            enhancedLogger.error('log.api.recent.error', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve logs'
            });
        }
    });

    // 로그 검색
    app.get('/api/logs/search', async (req, res) => {
        try {
            const query = req.query.q;
            const level = req.query.level;
            const limit = Math.min(parseInt(req.query.limit) || 100, 1000);

            if (!query) {
                return res.status(400).json({
                    success: false,
                    error: 'Query parameter required'
                });
            }

            const logs = await searchLogs(query, level, limit);

            res.json({
                success: true,
                logs,
                count: logs.length,
                query,
                level
            });
        } catch (error) {
            enhancedLogger.error('log.api.search.error', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Failed to search logs'
            });
        }
    });

    // 로그 통계
    app.get('/api/logs/stats', async (req, res) => {
        try {
            const stats = await getLogStats();

            res.json({
                success: true,
                stats
            });
        } catch (error) {
            enhancedLogger.error('log.api.stats.error', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve log stats'
            });
        }
    });
}

async function getRecentLogs(limit, level) {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const logFile = path.join(__dirname, '../logs/runtime.log');

    try {
        const content = await fs.promises.readFile(logFile, 'utf8');
        const lines = content.trim().split('\n');

        let logs = lines
            .filter(line => line.trim())
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            })
            .filter(log => log !== null);

        // 레벨 필터링
        if (level) {
            logs = logs.filter(log => log.level === level);
        }

        // 최신순으로 정렬하고 제한
        return logs
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);

    } catch (error) {
        return [];
    }
}

async function searchLogs(query, level, limit) {
    const logs = await getRecentLogs(limit * 2, level); // 검색을 위해 더 많이 가져옴

    const searchRegex = new RegExp(query, 'i');

    return logs
        .filter(log => {
            const searchText = JSON.stringify(log);
            return searchRegex.test(searchText);
        })
        .slice(0, limit);
}

async function getLogStats() {
    const logs = await getRecentLogs(10000); // 최근 10,000개 로그 분석

    const stats = {
        total: logs.length,
        byLevel: {},
        byHour: {},
        recentErrors: 0,
        avgPerMinute: 0
    };

    // 레벨별 통계
    logs.forEach(log => {
        stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
    });

    // 시간별 통계 (최근 24시간)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    logs
        .filter(log => new Date(log.timestamp) > oneDayAgo)
        .forEach(log => {
            const hour = new Date(log.timestamp).getHours();
            stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
        });

    // 최근 에러 수 (최근 1시간)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    stats.recentErrors = logs
        .filter(log => log.level === 'error' && new Date(log.timestamp) > oneHourAgo)
        .length;

    // 분당 평균 로그 수
    const recentLogs = logs.filter(log => new Date(log.timestamp) > oneHourAgo);
    stats.avgPerMinute = Math.round(recentLogs.length / 60 * 100) / 100;

    return stats;
}