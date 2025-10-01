const Redis = require('redis');

class MessageQueue {
    constructor() {
        this.redis = Redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || null
        });

        this.redis.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });

        this.redis.connect();
    }

    // 스트림에 메시지 추가
    async addMessage(streamName, message) {
        try {
            const id = await this.redis.xAdd(streamName, '*', message);
            console.log(`Message added to ${streamName} with ID: ${id}`);
            return id;
        } catch (error) {
            console.error('Error adding message:', error);
            throw error;
        }
    }

    // 스트림에서 메시지 읽기
    async readMessages(streamName, consumerGroup, consumerName, count = 10) {
        try {
            const messages = await this.redis.xReadGroup(
                consumerGroup,
                consumerName,
                { key: streamName, id: '>' },
                { COUNT: count, BLOCK: 1000 }
            );
            return messages;
        } catch (error) {
            console.error('Error reading messages:', error);
            throw error;
        }
    }

    // 소비자 그룹 생성
    async createConsumerGroup(streamName, groupName) {
        try {
            await this.redis.xGroupCreate(streamName, groupName, '0', {
                MKSTREAM: true
            });
            console.log(`Consumer group ${groupName} created for stream ${streamName}`);
        } catch (error) {
            if (error.message.includes('BUSYGROUP')) {
                console.log(`Consumer group ${groupName} already exists`);
            } else {
                console.error('Error creating consumer group:', error);
                throw error;
            }
        }
    }

    // 메시지 처리 완료 확인
    async ackMessage(streamName, groupName, messageId) {
        try {
            await this.redis.xAck(streamName, groupName, messageId);
            console.log(`Message ${messageId} acknowledged`);
        } catch (error) {
            console.error('Error acknowledging message:', error);
            throw error;
        }
    }

    // 스트림 정보 조회
    async getStreamInfo(streamName) {
        try {
            const info = await this.redis.xInfo('STREAM', streamName);
            return info;
        } catch (error) {
            console.error('Error getting stream info:', error);
            throw error;
        }
    }

    // 스트림 길이 조회
    async getStreamLength(streamName) {
        try {
            const length = await this.redis.xLen(streamName);
            return length;
        } catch (error) {
            console.error('Error getting stream length:', error);
            throw error;
        }
    }

    // 스트림 정리 (오래된 메시지 삭제)
    async trimStream(streamName, maxLength = 1000) {
        try {
            const trimmed = await this.redis.xTrim(streamName, 'MAXLEN', '~', maxLength);
            console.log(`Stream ${streamName} trimmed, removed ${trimmed} messages`);
            return trimmed;
        } catch (error) {
            console.error('Error trimming stream:', error);
            throw error;
        }
    }
}

// 이벤트 타입 정의
const EventTypes = {
    USER_REGISTERED: 'user.registered',
    USER_LOGIN: 'user.login',
    USER_LOGOUT: 'user.logout',
    POST_CREATED: 'post.created',
    POST_UPDATED: 'post.updated',
    POST_DELETED: 'post.deleted',
    COMMENT_CREATED: 'comment.created',
    COMMENT_UPDATED: 'comment.updated',
    COMMENT_DELETED: 'comment.deleted',
    CHAT_MESSAGE: 'chat.message',
    NOTIFICATION_SEND: 'notification.send',
    NOTIFICATION_READ: 'notification.read',
    FILE_UPLOADED: 'file.uploaded',
    FILE_DELETED: 'file.deleted',
    VOTE_CAST: 'vote.cast',
    TAG_CREATED: 'tag.created',
    TAG_UPDATED: 'tag.updated',
    TAG_DELETED: 'tag.deleted',
    BOARD_CREATED: 'board.created',
    BOARD_UPDATED: 'board.updated',
    BOARD_DELETED: 'board.deleted',
    SYSTEM_ERROR: 'system.error',
    SYSTEM_WARNING: 'system.warning',
    SYSTEM_INFO: 'system.info'
};

// 스트림 이름 정의
const StreamNames = {
    USER_EVENTS: 'user-events',
    POST_EVENTS: 'post-events',
    COMMENT_EVENTS: 'comment-events',
    CHAT_EVENTS: 'chat-events',
    NOTIFICATION_EVENTS: 'notification-events',
    FILE_EVENTS: 'file-events',
    VOTE_EVENTS: 'vote-events',
    TAG_EVENTS: 'tag-events',
    BOARD_EVENTS: 'board-events',
    SYSTEM_EVENTS: 'system-events'
};

// 소비자 그룹 이름 정의
const ConsumerGroups = {
    NOTIFICATION_SERVICE: 'notification-service',
    ANALYTICS_SERVICE: 'analytics-service',
    AUDIT_SERVICE: 'audit-service',
    CACHE_SERVICE: 'cache-service',
    SEARCH_SERVICE: 'search-service'
};

module.exports = {
    MessageQueue,
    EventTypes,
    StreamNames,
    ConsumerGroups
};
