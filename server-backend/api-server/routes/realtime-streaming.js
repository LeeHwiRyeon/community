const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// 실시간 스트리밍 시스템 클래스
class RealtimeStreamingSystem {
    constructor() {
        this.streams = new Map();
        this.rooms = new Map();
        this.users = new Map();
        this.sessions = new Map();
        this.streamIdCounter = 1;
    }

    // 스트림 생성
    createStream(streamData) {
        const streamId = `stream_${this.streamIdCounter++}`;
        const stream = {
            id: streamId,
            title: streamData.title,
            description: streamData.description || '',
            type: streamData.type || 'live', // 'live', 'meeting', 'screen_share', 'ar_vr'
            status: 'preparing',
            hostId: streamData.hostId,
            participants: new Set([streamData.hostId]),
            viewers: new Set(),
            maxParticipants: streamData.maxParticipants || 100,
            maxViewers: streamData.maxViewers || 1000,
            isPublic: streamData.isPublic || true,
            isRecording: false,
            recordingUrl: null,
            thumbnail: null,
            tags: streamData.tags || [],
            category: streamData.category || 'general',
            quality: streamData.quality || '720p',
            bitrate: streamData.bitrate || 2500,
            resolution: streamData.resolution || '1280x720',
            fps: streamData.fps || 30,
            audioEnabled: streamData.audioEnabled !== false,
            videoEnabled: streamData.videoEnabled !== false,
            chatEnabled: streamData.chatEnabled !== false,
            reactionsEnabled: streamData.reactionsEnabled !== false,
            screenShareEnabled: streamData.screenShareEnabled !== false,
            arVrEnabled: streamData.arVrEnabled || false,
            createdAt: new Date(),
            startedAt: null,
            endedAt: null,
            duration: 0,
            stats: {
                totalViews: 0,
                peakViewers: 0,
                totalReactions: 0,
                totalChats: 0,
                averageWatchTime: 0
            }
        };

        this.streams.set(streamId, stream);
        return stream;
    }

    // 스트림 시작
    startStream(streamId) {
        const stream = this.streams.get(streamId);
        if (!stream) return null;

        stream.status = 'live';
        stream.startedAt = new Date();

        // WebRTC 연결 설정
        this.setupWebRTCConnection(streamId);

        return stream;
    }

    // 스트림 종료
    endStream(streamId) {
        const stream = this.streams.get(streamId);
        if (!stream) return null;

        stream.status = 'ended';
        stream.endedAt = new Date();
        stream.duration = stream.endedAt - stream.startedAt;

        // 리소스 정리
        this.cleanupStream(streamId);

        return stream;
    }

    // 사용자 참여
    joinStream(streamId, userId, userData) {
        const stream = this.streams.get(streamId);
        if (!stream) return null;

        const user = {
            id: userId,
            name: userData.name,
            avatar: userData.avatar,
            role: userData.role || 'viewer',
            joinedAt: new Date(),
            isActive: true,
            permissions: userData.permissions || []
        };

        this.users.set(userId, user);

        if (user.role === 'participant') {
            if (stream.participants.size < stream.maxParticipants) {
                stream.participants.add(userId);
            } else {
                return { error: '최대 참여자 수 초과' };
            }
        } else {
            if (stream.viewers.size < stream.maxViewers) {
                stream.viewers.add(userId);
                stream.stats.totalViews++;
                stream.stats.peakViewers = Math.max(stream.stats.peakViewers, stream.viewers.size);
            } else {
                return { error: '최대 시청자 수 초과' };
            }
        }

        return { success: true, user, stream };
    }

    // 사용자 퇴장
    leaveStream(streamId, userId) {
        const stream = this.streams.get(streamId);
        if (!stream) return null;

        stream.participants.delete(userId);
        stream.viewers.delete(userId);

        const user = this.users.get(userId);
        if (user) {
            user.isActive = false;
        }

        return { success: true };
    }

    // 화면 공유 시작
    startScreenShare(streamId, userId, shareData) {
        const stream = this.streams.get(streamId);
        if (!stream || !stream.screenShareEnabled) return null;

        const screenShare = {
            id: uuidv4(),
            streamId,
            userId,
            type: shareData.type || 'screen', // 'screen', 'window', 'tab'
            resolution: shareData.resolution || '1920x1080',
            fps: shareData.fps || 30,
            bitrate: shareData.bitrate || 5000,
            startedAt: new Date(),
            isActive: true
        };

        stream.screenShare = screenShare;
        return screenShare;
    }

    // 화면 공유 종료
    stopScreenShare(streamId, userId) {
        const stream = this.streams.get(streamId);
        if (!stream || !stream.screenShare) return null;

        stream.screenShare.isActive = false;
        stream.screenShare.endedAt = new Date();

        return { success: true };
    }

    // AR/VR 세션 시작
    startARVRSession(streamId, userId, sessionData) {
        const stream = this.streams.get(streamId);
        if (!stream || !stream.arVrEnabled) return null;

        const session = {
            id: uuidv4(),
            streamId,
            userId,
            type: sessionData.type || 'ar', // 'ar', 'vr', 'mixed'
            device: sessionData.device || 'mobile', // 'mobile', 'headset', 'desktop'
            capabilities: sessionData.capabilities || [],
            startedAt: new Date(),
            isActive: true
        };

        this.sessions.set(session.id, session);
        return session;
    }

    // AR/VR 세션 종료
    endARVRSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        session.isActive = false;
        session.endedAt = new Date();

        return { success: true };
    }

    // 채팅 메시지 전송
    sendChatMessage(streamId, userId, message) {
        const stream = this.streams.get(streamId);
        if (!stream || !stream.chatEnabled) return null;

        const chatMessage = {
            id: uuidv4(),
            streamId,
            userId,
            message: message.text,
            type: message.type || 'text', // 'text', 'emoji', 'reaction', 'system'
            timestamp: new Date(),
            isModerated: false
        };

        stream.stats.totalChats++;
        return chatMessage;
    }

    // 반응 전송
    sendReaction(streamId, userId, reaction) {
        const stream = this.streams.get(streamId);
        if (!stream || !stream.reactionsEnabled) return null;

        const reactionData = {
            id: uuidv4(),
            streamId,
            userId,
            reaction: reaction.type, // 'like', 'love', 'laugh', 'wow', 'sad', 'angry'
            timestamp: new Date()
        };

        stream.stats.totalReactions++;
        return reactionData;
    }

    // 녹화 시작
    startRecording(streamId) {
        const stream = this.streams.get(streamId);
        if (!stream) return null;

        stream.isRecording = true;
        stream.recordingUrl = `recordings/${streamId}_${Date.now()}.mp4`;

        return { success: true, recordingUrl: stream.recordingUrl };
    }

    // 녹화 중지
    stopRecording(streamId) {
        const stream = this.streams.get(streamId);
        if (!stream) return null;

        stream.isRecording = false;

        return { success: true };
    }

    // WebRTC 연결 설정
    setupWebRTCConnection(streamId) {
        const stream = this.streams.get(streamId);
        if (!stream) return;

        // WebRTC 설정
        const rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };

        stream.rtcConfig = rtcConfig;
    }

    // 스트림 정리
    cleanupStream(streamId) {
        const stream = this.streams.get(streamId);
        if (!stream) return;

        // 모든 참여자 및 시청자 제거
        stream.participants.clear();
        stream.viewers.clear();

        // 화면 공유 정리
        if (stream.screenShare) {
            stream.screenShare.isActive = false;
        }

        // AR/VR 세션 정리
        for (const [sessionId, session] of this.sessions) {
            if (session.streamId === streamId) {
                session.isActive = false;
            }
        }
    }

    // 스트림 목록 조회
    getStreams(filters = {}) {
        let streams = Array.from(this.streams.values());

        if (filters.status) {
            streams = streams.filter(s => s.status === filters.status);
        }

        if (filters.type) {
            streams = streams.filter(s => s.type === filters.type);
        }

        if (filters.category) {
            streams = streams.filter(s => s.category === filters.category);
        }

        if (filters.isPublic !== undefined) {
            streams = streams.filter(s => s.isPublic === filters.isPublic);
        }

        return streams.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // 스트림 통계
    getStreamStats(streamId) {
        const stream = this.streams.get(streamId);
        if (!stream) return null;

        return {
            ...stream.stats,
            currentViewers: stream.viewers.size,
            currentParticipants: stream.participants.size,
            duration: stream.startedAt ?
                (stream.endedAt ? stream.duration : Date.now() - stream.startedAt) : 0
        };
    }

    // 전체 통계
    getOverallStats() {
        const streams = Array.from(this.streams.values());
        const activeStreams = streams.filter(s => s.status === 'live');
        const totalViewers = activeStreams.reduce((sum, s) => sum + s.viewers.size, 0);
        const totalParticipants = activeStreams.reduce((sum, s) => sum + s.participants.size, 0);

        return {
            totalStreams: streams.length,
            activeStreams: activeStreams.length,
            totalViewers,
            totalParticipants,
            totalUsers: this.users.size,
            totalSessions: this.sessions.size
        };
    }
}

// 전역 스트리밍 시스템 인스턴스
const streamingSystem = new RealtimeStreamingSystem();

// 미들웨어: 인증 확인
const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
    }
    req.user = { id: 'user1', role: 'admin' };
    next();
};

// 스트림 생성
router.post('/streams', authenticateUser, async (req, res) => {
    try {
        const stream = streamingSystem.createStream(req.body);

        res.status(201).json({
            success: true,
            message: '스트림이 생성되었습니다.',
            data: stream
        });
    } catch (error) {
        console.error('스트림 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '스트림 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 스트림 시작
router.post('/streams/:id/start', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const stream = streamingSystem.startStream(id);

        if (!stream) {
            return res.status(404).json({
                success: false,
                message: '스트림을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '스트림이 시작되었습니다.',
            data: stream
        });
    } catch (error) {
        console.error('스트림 시작 오류:', error);
        res.status(500).json({
            success: false,
            message: '스트림 시작 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 스트림 종료
router.post('/streams/:id/end', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const stream = streamingSystem.endStream(id);

        if (!stream) {
            return res.status(404).json({
                success: false,
                message: '스트림을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '스트림이 종료되었습니다.',
            data: stream
        });
    } catch (error) {
        console.error('스트림 종료 오류:', error);
        res.status(500).json({
            success: false,
            message: '스트림 종료 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 스트림 참여
router.post('/streams/:id/join', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, userData } = req.body;

        const result = streamingSystem.joinStream(id, userId, userData);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: '스트림을 찾을 수 없습니다.'
            });
        }

        if (result.error) {
            return res.status(400).json({
                success: false,
                message: result.error
            });
        }

        res.json({
            success: true,
            message: '스트림에 참여했습니다.',
            data: result
        });
    } catch (error) {
        console.error('스트림 참여 오류:', error);
        res.status(500).json({
            success: false,
            message: '스트림 참여 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 화면 공유 시작
router.post('/streams/:id/screen-share', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, shareData } = req.body;

        const screenShare = streamingSystem.startScreenShare(id, userId, shareData);

        if (!screenShare) {
            return res.status(404).json({
                success: false,
                message: '스트림을 찾을 수 없거나 화면 공유가 비활성화되어 있습니다.'
            });
        }

        res.json({
            success: true,
            message: '화면 공유가 시작되었습니다.',
            data: screenShare
        });
    } catch (error) {
        console.error('화면 공유 시작 오류:', error);
        res.status(500).json({
            success: false,
            message: '화면 공유 시작 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// AR/VR 세션 시작
router.post('/streams/:id/ar-vr', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, sessionData } = req.body;

        const session = streamingSystem.startARVRSession(id, userId, sessionData);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: '스트림을 찾을 수 없거나 AR/VR이 비활성화되어 있습니다.'
            });
        }

        res.json({
            success: true,
            message: 'AR/VR 세션이 시작되었습니다.',
            data: session
        });
    } catch (error) {
        console.error('AR/VR 세션 시작 오류:', error);
        res.status(500).json({
            success: false,
            message: 'AR/VR 세션 시작 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 스트림 목록 조회
router.get('/streams', async (req, res) => {
    try {
        const { status, type, category, isPublic } = req.query;
        const streams = streamingSystem.getStreams({ status, type, category, isPublic });

        res.json({
            success: true,
            data: streams
        });
    } catch (error) {
        console.error('스트림 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '스트림 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 스트림 통계 조회
router.get('/streams/:id/stats', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const stats = streamingSystem.getStreamStats(id);

        if (!stats) {
            return res.status(404).json({
                success: false,
                message: '스트림을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('스트림 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '스트림 통계 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 전체 통계 조회
router.get('/stats', async (req, res) => {
    try {
        const stats = streamingSystem.getOverallStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('전체 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '전체 통계 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

module.exports = router;
