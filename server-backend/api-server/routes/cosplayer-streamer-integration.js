const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// 코스플레이어-스트리머 연동 시스템 클래스
class CosplayerStreamerIntegration {
    constructor() {
        this.collaborations = new Map();
        this.events = new Map();
        this.fanClubs = new Map();
        this.messages = new Map();
        this.notifications = new Map();
        this.analytics = new Map();
    }

    // 협업 이벤트 생성
    createCollaboration(collaborationData) {
        const collaboration = {
            id: uuidv4(),
            title: collaborationData.title,
            description: collaborationData.description,
            type: collaborationData.type, // 'cosplay_stream', 'event_promotion', 'cross_promotion'
            cosplayerId: collaborationData.cosplayerId,
            streamerId: collaborationData.streamerId,
            status: 'pending', // 'pending', 'approved', 'rejected', 'active', 'completed'
            startDate: collaborationData.startDate,
            endDate: collaborationData.endDate,
            budget: collaborationData.budget || 0,
            requirements: collaborationData.requirements || [],
            deliverables: collaborationData.deliverables || [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.collaborations.set(collaboration.id, collaboration);
        return collaboration;
    }

    // 협업 이벤트 승인/거부
    updateCollaborationStatus(collaborationId, status, notes = '') {
        const collaboration = this.collaborations.get(collaborationId);
        if (!collaboration) return null;

        collaboration.status = status;
        collaboration.notes = notes;
        collaboration.updatedAt = new Date();

        // 상태 변경 알림 생성
        this.createNotification({
            userId: status === 'approved' ? collaboration.cosplayerId : collaboration.streamerId,
            type: 'collaboration_status_update',
            title: `협업 이벤트 ${status === 'approved' ? '승인' : '거부'}됨`,
            message: `"${collaboration.title}" 협업이 ${status === 'approved' ? '승인' : '거부'}되었습니다.`,
            data: { collaborationId, status }
        });

        return collaboration;
    }

    // 통합 이벤트 생성
    createIntegratedEvent(eventData) {
        const event = {
            id: uuidv4(),
            title: eventData.title,
            description: eventData.description,
            type: eventData.type, // 'cosplay_showcase', 'streaming_event', 'collaboration_event'
            organizerId: eventData.organizerId,
            participants: eventData.participants || [], // [{id, type, role}]
            startDate: eventData.startDate,
            endDate: eventData.endDate,
            location: eventData.location,
            isOnline: eventData.isOnline || false,
            maxParticipants: eventData.maxParticipants || 100,
            currentParticipants: 0,
            status: 'scheduled', // 'scheduled', 'ongoing', 'completed', 'cancelled'
            tags: eventData.tags || [],
            requirements: eventData.requirements || [],
            rewards: eventData.rewards || [],
            streamUrl: eventData.streamUrl || '',
            socialMedia: eventData.socialMedia || {},
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.events.set(event.id, event);
        return event;
    }

    // 이벤트 참가 신청
    joinEvent(eventId, userId, userType, applicationData = {}) {
        const event = this.events.get(eventId);
        if (!event) return null;

        if (event.currentParticipants >= event.maxParticipants) {
            return { success: false, message: '이벤트 정원이 마감되었습니다.' };
        }

        const participant = {
            id: uuidv4(),
            userId,
            userType, // 'cosplayer', 'streamer', 'viewer'
            role: applicationData.role || 'participant',
            applicationData,
            joinDate: new Date(),
            status: 'pending' // 'pending', 'approved', 'rejected'
        };

        event.participants.push(participant);
        event.currentParticipants++;
        event.updatedAt = new Date();

        // 참가 신청 알림
        this.createNotification({
            userId: event.organizerId,
            type: 'event_join_request',
            title: '새로운 참가 신청',
            message: `${userType}가 "${event.title}" 이벤트 참가를 신청했습니다.`,
            data: { eventId, participantId: participant.id }
        });

        return { success: true, participant };
    }

    // 팬클럽 생성
    createFanClub(fanClubData) {
        const fanClub = {
            id: uuidv4(),
            name: fanClubData.name,
            description: fanClubData.description,
            ownerId: fanClubData.ownerId,
            ownerType: fanClubData.ownerType, // 'cosplayer', 'streamer'
            members: [],
            moderators: [],
            rules: fanClubData.rules || [],
            categories: fanClubData.categories || [],
            isPublic: fanClubData.isPublic !== false,
            maxMembers: fanClubData.maxMembers || 1000,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.fanClubs.set(fanClub.id, fanClub);
        return fanClub;
    }

    // 팬클럽 가입
    joinFanClub(fanClubId, userId, userType) {
        const fanClub = this.fanClubs.get(fanClubId);
        if (!fanClub) return null;

        if (fanClub.members.length >= fanClub.maxMembers) {
            return { success: false, message: '팬클럽 정원이 마감되었습니다.' };
        }

        const member = {
            id: uuidv4(),
            userId,
            userType,
            joinDate: new Date(),
            status: 'active',
            level: 'member' // 'member', 'vip', 'moderator'
        };

        fanClub.members.push(member);
        fanClub.updatedAt = new Date();

        return { success: true, member };
    }

    // 메시지 전송
    sendMessage(messageData) {
        const message = {
            id: uuidv4(),
            senderId: messageData.senderId,
            senderType: messageData.senderType,
            recipientId: messageData.recipientId,
            recipientType: messageData.recipientType,
            content: messageData.content,
            type: messageData.type || 'text', // 'text', 'image', 'file', 'collaboration_invite'
            attachments: messageData.attachments || [],
            isRead: false,
            createdAt: new Date()
        };

        this.messages.set(message.id, message);

        // 실시간 알림
        this.createNotification({
            userId: messageData.recipientId,
            type: 'new_message',
            title: '새로운 메시지',
            message: `${messageData.senderType}로부터 메시지가 도착했습니다.`,
            data: { messageId: message.id }
        });

        return message;
    }

    // 알림 생성
    createNotification(notificationData) {
        const notification = {
            id: uuidv4(),
            userId: notificationData.userId,
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            data: notificationData.data || {},
            isRead: false,
            priority: notificationData.priority || 'normal', // 'low', 'normal', 'high', 'urgent'
            createdAt: new Date()
        };

        this.notifications.set(notification.id, notification);
        return notification;
    }

    // 분석 데이터 수집
    collectAnalytics(analyticsData) {
        const analytics = {
            id: uuidv4(),
            userId: analyticsData.userId,
            userType: analyticsData.userType,
            eventType: analyticsData.eventType,
            data: analyticsData.data,
            timestamp: new Date()
        };

        this.analytics.set(analytics.id, analytics);
        return analytics;
    }

    // 사용자별 통계 조회
    getUserStats(userId, userType) {
        const userCollaborations = Array.from(this.collaborations.values())
            .filter(c => c.cosplayerId === userId || c.streamerId === userId);

        const userEvents = Array.from(this.events.values())
            .filter(e => e.organizerId === userId || e.participants.some(p => p.userId === userId));

        const userFanClubs = Array.from(this.fanClubs.values())
            .filter(f => f.ownerId === userId || f.members.some(m => m.userId === userId));

        const userMessages = Array.from(this.messages.values())
            .filter(m => m.senderId === userId || m.recipientId === userId);

        const userNotifications = Array.from(this.notifications.values())
            .filter(n => n.userId === userId);

        return {
            collaborations: {
                total: userCollaborations.length,
                active: userCollaborations.filter(c => c.status === 'active').length,
                completed: userCollaborations.filter(c => c.status === 'completed').length
            },
            events: {
                total: userEvents.length,
                organized: userEvents.filter(e => e.organizerId === userId).length,
                participated: userEvents.filter(e => e.participants.some(p => p.userId === userId)).length
            },
            fanClubs: {
                owned: userFanClubs.filter(f => f.ownerId === userId).length,
                joined: userFanClubs.filter(f => f.members.some(m => m.userId === userId)).length
            },
            messages: {
                sent: userMessages.filter(m => m.senderId === userId).length,
                received: userMessages.filter(m => m.recipientId === userId).length,
                unread: userMessages.filter(m => m.recipientId === userId && !m.isRead).length
            },
            notifications: {
                total: userNotifications.length,
                unread: userNotifications.filter(n => !n.isRead).length
            }
        };
    }

    // 인기 콘텐츠 조회
    getPopularContent(limit = 10) {
        const collaborations = Array.from(this.collaborations.values())
            .filter(c => c.status === 'completed')
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, limit);

        const events = Array.from(this.events.values())
            .filter(e => e.status === 'completed')
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, limit);

        return {
            collaborations,
            events,
            totalCollaborations: this.collaborations.size,
            totalEvents: this.events.size,
            totalFanClubs: this.fanClubs.size
        };
    }
}

// 전역 인스턴스
const integration = new CosplayerStreamerIntegration();

// 미들웨어: 인증 확인
const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
    }
    req.user = { id: 'user1', type: 'cosplayer' };
    next();
};

// 협업 이벤트 생성
router.post('/collaborations', authenticateUser, async (req, res) => {
    try {
        const collaboration = integration.createCollaboration({
            ...req.body,
            cosplayerId: req.user.type === 'cosplayer' ? req.user.id : req.body.cosplayerId,
            streamerId: req.user.type === 'streamer' ? req.user.id : req.body.streamerId
        });

        res.status(201).json({
            success: true,
            message: '협업 이벤트가 생성되었습니다.',
            data: collaboration
        });
    } catch (error) {
        console.error('협업 이벤트 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '협업 이벤트 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 협업 이벤트 상태 업데이트
router.put('/collaborations/:id/status', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const collaboration = integration.updateCollaborationStatus(id, status, notes);

        if (!collaboration) {
            return res.status(404).json({
                success: false,
                message: '협업 이벤트를 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '협업 이벤트 상태가 업데이트되었습니다.',
            data: collaboration
        });
    } catch (error) {
        console.error('협업 이벤트 상태 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '협업 이벤트 상태 업데이트 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 통합 이벤트 생성
router.post('/events', authenticateUser, async (req, res) => {
    try {
        const event = integration.createIntegratedEvent({
            ...req.body,
            organizerId: req.user.id
        });

        res.status(201).json({
            success: true,
            message: '통합 이벤트가 생성되었습니다.',
            data: event
        });
    } catch (error) {
        console.error('통합 이벤트 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '통합 이벤트 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 이벤트 참가 신청
router.post('/events/:id/join', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { userType, applicationData } = req.body;

        const result = integration.joinEvent(id, req.user.id, userType, applicationData);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: '이벤트를 찾을 수 없습니다.'
            });
        }

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        res.json({
            success: true,
            message: '이벤트 참가 신청이 완료되었습니다.',
            data: result.participant
        });
    } catch (error) {
        console.error('이벤트 참가 신청 오류:', error);
        res.status(500).json({
            success: false,
            message: '이벤트 참가 신청 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 팬클럽 생성
router.post('/fan-clubs', authenticateUser, async (req, res) => {
    try {
        const fanClub = integration.createFanClub({
            ...req.body,
            ownerId: req.user.id,
            ownerType: req.user.type
        });

        res.status(201).json({
            success: true,
            message: '팬클럽이 생성되었습니다.',
            data: fanClub
        });
    } catch (error) {
        console.error('팬클럽 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '팬클럽 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 팬클럽 가입
router.post('/fan-clubs/:id/join', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { userType } = req.body;

        const result = integration.joinFanClub(id, req.user.id, userType);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: '팬클럽을 찾을 수 없습니다.'
            });
        }

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        res.json({
            success: true,
            message: '팬클럽 가입이 완료되었습니다.',
            data: result.member
        });
    } catch (error) {
        console.error('팬클럽 가입 오류:', error);
        res.status(500).json({
            success: false,
            message: '팬클럽 가입 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 메시지 전송
router.post('/messages', authenticateUser, async (req, res) => {
    try {
        const message = integration.sendMessage({
            ...req.body,
            senderId: req.user.id,
            senderType: req.user.type
        });

        res.status(201).json({
            success: true,
            message: '메시지가 전송되었습니다.',
            data: message
        });
    } catch (error) {
        console.error('메시지 전송 오류:', error);
        res.status(500).json({
            success: false,
            message: '메시지 전송 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 알림 조회
router.get('/notifications', authenticateUser, async (req, res) => {
    try {
        const notifications = Array.from(integration.notifications.values())
            .filter(n => n.userId === req.user.id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        console.error('알림 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 사용자 통계 조회
router.get('/stats/:userId', authenticateUser, async (req, res) => {
    try {
        const { userId } = req.params;
        const { userType } = req.query;

        const stats = integration.getUserStats(userId, userType);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('사용자 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '사용자 통계 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 인기 콘텐츠 조회
router.get('/popular-content', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const popularContent = integration.getPopularContent(parseInt(limit));

        res.json({
            success: true,
            data: popularContent
        });
    } catch (error) {
        console.error('인기 콘텐츠 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '인기 콘텐츠 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

module.exports = router;
