/**
 * Bug Request Loop Prevention Service
 * 버그 요청 루프 방지 서비스
 * 
 * 기능:
 * - 요청 루프 감지 및 차단
 * - 지능형 요청 제한
 * - 자동 복구 시스템
 * - 요청 패턴 분석
 */

const { logger } = require('../utils/logger');
const { performanceMonitor } = require('../utils/performance-monitor');

class BugRequestLoopPreventionService {
    constructor() {
        this.requestCounts = new Map(); // 사용자별 요청 수
        this.requestTimestamps = new Map(); // 요청 타임스탬프
        this.blockedUsers = new Set(); // 차단된 사용자
        this.requestPatterns = new Map(); // 요청 패턴
        this.autoRecoveryQueue = new Map(); // 자동 복구 큐

        // 제한 설정
        this.maxRequestsPerMinute = 10;
        this.maxRequestsPerHour = 50;
        this.maxRequestsPerDay = 200;
        this.blockDuration = 30 * 60 * 1000; // 30분
        this.autoRecoveryDelay = 5 * 60 * 1000; // 5분

        this.startMonitoring();
        this.startAutoRecovery();
    }

    /**
     * 요청 루프 확인
     */
    async checkRequestLoop(userId, bugData, requestId) {
        try {
            const now = Date.now();

            // 1. 차단된 사용자 확인
            if (this.blockedUsers.has(userId)) {
                logger.warn(`차단된 사용자 요청: ${userId}`);
                return {
                    allowed: false,
                    reason: 'user_blocked',
                    message: '사용자가 일시적으로 차단되었습니다.',
                    retryAfter: this.getRetryAfter(userId)
                };
            }

            // 2. 요청 빈도 확인
            const frequencyCheck = this.checkRequestFrequency(userId, now);
            if (!frequencyCheck.allowed) {
                logger.warn(`요청 빈도 초과: ${userId} - ${frequencyCheck.reason}`);
                this.blockUser(userId, frequencyCheck.reason);
                return {
                    allowed: false,
                    reason: frequencyCheck.reason,
                    message: frequencyCheck.message,
                    retryAfter: this.blockDuration
                };
            }

            // 3. 요청 패턴 분석
            const patternCheck = this.analyzeRequestPattern(userId, bugData, now);
            if (patternCheck.isLoop) {
                logger.warn(`요청 루프 감지: ${userId} - ${patternCheck.reason}`);
                this.blockUser(userId, 'request_loop');
                return {
                    allowed: false,
                    reason: 'request_loop',
                    message: '요청 루프가 감지되었습니다.',
                    retryAfter: this.blockDuration
                };
            }

            // 4. 중복 요청 확인
            const duplicateCheck = this.checkDuplicateRequest(userId, bugData, now);
            if (duplicateCheck.isDuplicate) {
                logger.warn(`중복 요청 감지: ${userId} - ${duplicateCheck.reason}`);
                return {
                    allowed: false,
                    reason: 'duplicate_request',
                    message: '중복 요청입니다.',
                    retryAfter: 60 * 1000 // 1분
                };
            }

            // 5. 요청 기록
            this.recordRequest(userId, bugData, requestId, now);

            return {
                allowed: true,
                reason: null,
                message: '요청이 허용되었습니다.',
                retryAfter: 0
            };

        } catch (error) {
            logger.error(`요청 루프 확인 오류: ${error.message}`);
            return {
                allowed: false,
                reason: 'error',
                message: '요청 처리 중 오류가 발생했습니다.',
                retryAfter: 60 * 1000
            };
        }
    }

    /**
     * 요청 빈도 확인
     */
    checkRequestFrequency(userId, now) {
        if (!this.requestCounts.has(userId)) {
            this.requestCounts.set(userId, {
                minute: [],
                hour: [],
                day: []
            });
        }

        const counts = this.requestCounts.get(userId);

        // 최근 1분 내 요청 수
        const recentMinute = counts.minute.filter(timestamp => now - timestamp < 60 * 1000);
        if (recentMinute.length >= this.maxRequestsPerMinute) {
            return {
                allowed: false,
                reason: 'rate_limit_minute',
                message: `분당 최대 ${this.maxRequestsPerMinute}회 요청을 초과했습니다.`
            };
        }

        // 최근 1시간 내 요청 수
        const recentHour = counts.hour.filter(timestamp => now - timestamp < 60 * 60 * 1000);
        if (recentHour.length >= this.maxRequestsPerHour) {
            return {
                allowed: false,
                reason: 'rate_limit_hour',
                message: `시간당 최대 ${this.maxRequestsPerHour}회 요청을 초과했습니다.`
            };
        }

        // 최근 24시간 내 요청 수
        const recentDay = counts.day.filter(timestamp => now - timestamp < 24 * 60 * 60 * 1000);
        if (recentDay.length >= this.maxRequestsPerDay) {
            return {
                allowed: false,
                reason: 'rate_limit_day',
                message: `일일 최대 ${this.maxRequestsPerDay}회 요청을 초과했습니다.`
            };
        }

        return { allowed: true };
    }

    /**
     * 요청 패턴 분석
     */
    analyzeRequestPattern(userId, bugData, now) {
        if (!this.requestPatterns.has(userId)) {
            this.requestPatterns.set(userId, []);
        }

        const patterns = this.requestPatterns.get(userId);

        // 최근 10분 내 패턴만 분석
        const recentPatterns = patterns.filter(p => now - p.timestamp < 10 * 60 * 1000);

        // 동일한 제목의 반복 요청 확인
        const sameTitleRequests = recentPatterns.filter(p =>
            p.bugData.title === bugData.title
        );

        if (sameTitleRequests.length >= 3) {
            return {
                isLoop: true,
                reason: 'same_title_repeated',
                pattern: 'title_repetition'
            };
        }

        // 동일한 설명의 반복 요청 확인
        const sameDescriptionRequests = recentPatterns.filter(p =>
            p.bugData.description === bugData.description
        );

        if (sameDescriptionRequests.length >= 2) {
            return {
                isLoop: true,
                reason: 'same_description_repeated',
                pattern: 'description_repetition'
            };
        }

        // 짧은 간격의 연속 요청 확인
        const rapidRequests = recentPatterns.filter(p =>
            now - p.timestamp < 30 * 1000 // 30초 내
        );

        if (rapidRequests.length >= 5) {
            return {
                isLoop: true,
                reason: 'rapid_requests',
                pattern: 'rapid_fire'
            };
        }

        // 유사한 버그 카테고리의 반복 요청 확인
        const sameCategoryRequests = recentPatterns.filter(p =>
            p.bugData.category === bugData.category
        );

        if (sameCategoryRequests.length >= 5) {
            return {
                isLoop: true,
                reason: 'same_category_repeated',
                pattern: 'category_repetition'
            };
        }

        return { isLoop: false };
    }

    /**
     * 중복 요청 확인
     */
    checkDuplicateRequest(userId, bugData, now) {
        const key = `${userId}_${this.generateRequestKey(bugData)}`;

        if (!this.requestTimestamps.has(key)) {
            return { isDuplicate: false };
        }

        const lastRequest = this.requestTimestamps.get(key);
        const timeDiff = now - lastRequest;

        // 5분 내 동일한 요청은 중복으로 간주
        if (timeDiff < 5 * 60 * 1000) {
            return {
                isDuplicate: true,
                reason: 'recent_duplicate',
                timeDiff: timeDiff
            };
        }

        return { isDuplicate: false };
    }

    /**
     * 요청 기록
     */
    recordRequest(userId, bugData, requestId, now) {
        // 요청 수 카운트 업데이트
        if (!this.requestCounts.has(userId)) {
            this.requestCounts.set(userId, {
                minute: [],
                hour: [],
                day: []
            });
        }

        const counts = this.requestCounts.get(userId);
        counts.minute.push(now);
        counts.hour.push(now);
        counts.day.push(now);

        // 패턴 기록
        if (!this.requestPatterns.has(userId)) {
            this.requestPatterns.set(userId, []);
        }

        this.requestPatterns.get(userId).push({
            timestamp: now,
            bugData: bugData,
            requestId: requestId
        });

        // 중복 확인용 타임스탬프 기록
        const key = `${userId}_${this.generateRequestKey(bugData)}`;
        this.requestTimestamps.set(key, now);

        logger.info(`요청 기록됨: ${userId} - ${bugData.title}`);
    }

    /**
     * 사용자 차단
     */
    blockUser(userId, reason) {
        this.blockedUsers.add(userId);

        // 자동 복구 스케줄링
        setTimeout(() => {
            this.autoRecoveryQueue.set(userId, {
                reason: reason,
                blockedAt: Date.now(),
                attempts: 0
            });
        }, this.autoRecoveryDelay);

        logger.warn(`사용자 차단됨: ${userId} - ${reason}`);
    }

    /**
     * 사용자 차단 해제
     */
    unblockUser(userId) {
        this.blockedUsers.delete(userId);

        // 요청 기록 초기화
        this.requestCounts.delete(userId);
        this.requestPatterns.delete(userId);

        logger.info(`사용자 차단 해제됨: ${userId}`);
    }

    /**
     * 자동 복구 시작
     */
    startAutoRecovery() {
        setInterval(() => {
            this.processAutoRecovery();
        }, 60 * 1000); // 1분마다 확인
    }

    /**
     * 자동 복구 처리
     */
    processAutoRecovery() {
        const now = Date.now();

        for (const [userId, recoveryInfo] of this.autoRecoveryQueue) {
            if (now - recoveryInfo.blockedAt > this.blockDuration) {
                // 차단 시간이 지났으면 자동 복구 시도
                this.attemptAutoRecovery(userId, recoveryInfo);
            }
        }
    }

    /**
     * 자동 복구 시도
     */
    attemptAutoRecovery(userId, recoveryInfo) {
        recoveryInfo.attempts++;

        if (recoveryInfo.attempts > 3) {
            // 3회 시도 후에도 복구 실패하면 수동 개입 필요
            logger.error(`자동 복구 실패: ${userId} - ${recoveryInfo.reason}`);
            this.autoRecoveryQueue.delete(userId);
            return;
        }

        // 복구 조건 확인
        if (this.canRecover(userId)) {
            this.unblockUser(userId);
            this.autoRecoveryQueue.delete(userId);
            logger.info(`자동 복구 성공: ${userId}`);
        } else {
            // 다음 시도까지 대기
            setTimeout(() => {
                this.attemptAutoRecovery(userId, recoveryInfo);
            }, 5 * 60 * 1000); // 5분 후 재시도
        }
    }

    /**
     * 복구 가능 여부 확인
     */
    canRecover(userId) {
        // 최근 1시간 내 요청이 없으면 복구 가능
        const now = Date.now();
        const counts = this.requestCounts.get(userId);

        if (!counts) {
            return true;
        }

        const recentRequests = counts.hour.filter(timestamp =>
            now - timestamp < 60 * 60 * 1000
        );

        return recentRequests.length === 0;
    }

    /**
     * 요청 키 생성
     */
    generateRequestKey(bugData) {
        const title = bugData.title.toLowerCase().replace(/[^\w\s]/g, '');
        const description = bugData.description.toLowerCase().replace(/[^\w\s]/g, '');
        return `${title}_${description}`.substring(0, 50);
    }

    /**
     * 재시도 시간 계산
     */
    getRetryAfter(userId) {
        if (!this.blockedUsers.has(userId)) {
            return 0;
        }

        return this.blockDuration;
    }

    /**
     * 모니터링 시작
     */
    startMonitoring() {
        setInterval(() => {
            this.cleanupExpiredData();
        }, 10 * 60 * 1000); // 10분마다 정리
    }

    /**
     * 만료된 데이터 정리
     */
    cleanupExpiredData() {
        const now = Date.now();
        let cleanedCount = 0;

        // 요청 수 카운트 정리
        for (const [userId, counts] of this.requestCounts) {
            counts.minute = counts.minute.filter(timestamp => now - timestamp < 60 * 1000);
            counts.hour = counts.hour.filter(timestamp => now - timestamp < 60 * 60 * 1000);
            counts.day = counts.day.filter(timestamp => now - timestamp < 24 * 60 * 60 * 1000);

            if (counts.minute.length === 0 && counts.hour.length === 0 && counts.day.length === 0) {
                this.requestCounts.delete(userId);
                cleanedCount++;
            }
        }

        // 패턴 정리
        for (const [userId, patterns] of this.requestPatterns) {
            const recentPatterns = patterns.filter(p => now - p.timestamp < 24 * 60 * 60 * 1000);
            if (recentPatterns.length === 0) {
                this.requestPatterns.delete(userId);
                cleanedCount++;
            } else {
                this.requestPatterns.set(userId, recentPatterns);
            }
        }

        // 타임스탬프 정리
        for (const [key, timestamp] of this.requestTimestamps) {
            if (now - timestamp > 24 * 60 * 60 * 1000) {
                this.requestTimestamps.delete(key);
                cleanedCount++;
            }
        }

        logger.info(`데이터 정리 완료: ${cleanedCount}개 항목 제거`);
    }

    /**
     * 통계 정보 조회
     */
    getStatistics() {
        return {
            blockedUsersCount: this.blockedUsers.size,
            activeUsersCount: this.requestCounts.size,
            totalRequests: Array.from(this.requestCounts.values())
                .reduce((sum, counts) => sum + counts.day.length, 0),
            autoRecoveryQueueSize: this.autoRecoveryQueue.size,
            maxRequestsPerMinute: this.maxRequestsPerMinute,
            maxRequestsPerHour: this.maxRequestsPerHour,
            maxRequestsPerDay: this.maxRequestsPerDay
        };
    }

    /**
     * 사용자 상태 조회
     */
    getUserStatus(userId) {
        const isBlocked = this.blockedUsers.has(userId);
        const counts = this.requestCounts.get(userId);
        const patterns = this.requestPatterns.get(userId);

        return {
            isBlocked: isBlocked,
            requestCounts: counts || { minute: [], hour: [], day: [] },
            patternCount: patterns ? patterns.length : 0,
            retryAfter: isBlocked ? this.getRetryAfter(userId) : 0
        };
    }

    /**
     * 수동 차단 해제
     */
    manualUnblockUser(userId) {
        this.unblockUser(userId);
        this.autoRecoveryQueue.delete(userId);
        logger.info(`수동 차단 해제됨: ${userId}`);
    }
}

module.exports = BugRequestLoopPreventionService;
