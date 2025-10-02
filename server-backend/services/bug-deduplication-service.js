/**
 * Bug Deduplication Service
 * 버그 중복 요청 방지 서비스
 * 
 * 기능:
 * - 실시간 중복 버그 감지
 * - 지능형 버그 매칭
 * - 중복 요청 자동 차단
 * - 버그 통합 관리
 */

const { logger } = require('../utils/logger');
const { performanceMonitor } = require('../utils/performance-monitor');

class BugDeduplicationService {
    constructor() {
        this.duplicateCache = new Map();
        this.bugPatterns = new Map();
        this.similarityThreshold = 0.8; // 80% 유사도
        this.cacheTTL = 24 * 60 * 60 * 1000; // 24시간
        this.maxCacheSize = 10000;
        this.requestHistory = new Map();
        this.blockedRequests = new Set();

        this.initializeBugPatterns();
        this.startCleanupProcess();
    }

    /**
     * 버그 패턴 초기화
     */
    initializeBugPatterns() {
        // 일반적인 버그 패턴들
        this.bugPatterns.set('server_error', {
            patterns: [
                /500\s+Internal\s+Server\s+Error/i,
                /Internal\s+Server\s+Error/i,
                /서버\s+내부\s+오류/i
            ],
            keywords: ['500', 'internal', 'server', 'error', '서버', '오류'],
            weight: 0.9
        });

        this.bugPatterns.set('database_error', {
            patterns: [
                /Database\s+connection\s+failed/i,
                /SQL\s+error/i,
                /데이터베이스\s+연결\s+실패/i
            ],
            keywords: ['database', 'sql', 'connection', 'failed', '데이터베이스', '연결'],
            weight: 0.9
        });

        this.bugPatterns.set('memory_leak', {
            patterns: [
                /Memory\s+leak\s+detected/i,
                /Out\s+of\s+memory/i,
                /메모리\s+누수/i
            ],
            keywords: ['memory', 'leak', 'out', '메모리', '누수'],
            weight: 0.8
        });

        this.bugPatterns.set('authentication_error', {
            patterns: [
                /Authentication\s+failed/i,
                /Login\s+failed/i,
                /인증\s+실패/i
            ],
            keywords: ['auth', 'login', 'failed', '인증', '로그인'],
            weight: 0.7
        });

        this.bugPatterns.set('file_upload_error', {
            patterns: [
                /File\s+upload\s+failed/i,
                /Upload\s+error/i,
                /파일\s+업로드\s+실패/i
            ],
            keywords: ['file', 'upload', 'failed', '파일', '업로드'],
            weight: 0.6
        });
    }

    /**
     * 버그 중복 확인
     */
    async checkDuplicateBug(bugData, reporterId) {
        try {
            const startTime = Date.now();

            // 1. 기본 중복 확인 (제목, 설명 기반)
            const basicDuplicate = await this.checkBasicDuplicate(bugData);
            if (basicDuplicate) {
                logger.warn(`기본 중복 버그 감지: ${bugData.title}`);
                return {
                    isDuplicate: true,
                    reason: 'basic_duplicate',
                    duplicateBugId: basicDuplicate.id,
                    confidence: 0.9
                };
            }

            // 2. 패턴 기반 중복 확인
            const patternDuplicate = await this.checkPatternDuplicate(bugData);
            if (patternDuplicate) {
                logger.warn(`패턴 기반 중복 버그 감지: ${bugData.title}`);
                return {
                    isDuplicate: true,
                    reason: 'pattern_duplicate',
                    duplicateBugId: patternDuplicate.id,
                    confidence: patternDuplicate.confidence
                };
            }

            // 3. 유사도 기반 중복 확인
            const similarityDuplicate = await this.checkSimilarityDuplicate(bugData);
            if (similarityDuplicate) {
                logger.warn(`유사도 기반 중복 버그 감지: ${bugData.title}`);
                return {
                    isDuplicate: true,
                    reason: 'similarity_duplicate',
                    duplicateBugId: similarityDuplicate.id,
                    confidence: similarityDuplicate.confidence
                };
            }

            // 4. 요청 빈도 확인
            const frequencyCheck = this.checkRequestFrequency(reporterId, bugData);
            if (frequencyCheck.isSpam) {
                logger.warn(`스팸 요청 감지: ${reporterId} - ${bugData.title}`);
                return {
                    isDuplicate: true,
                    reason: 'spam_request',
                    duplicateBugId: null,
                    confidence: 1.0
                };
            }

            // 5. 중복이 아닌 경우 캐시에 추가
            this.addToCache(bugData, reporterId);

            const processingTime = Date.now() - startTime;
            logger.info(`중복 확인 완료: ${bugData.title} - ${processingTime}ms`);

            return {
                isDuplicate: false,
                reason: null,
                duplicateBugId: null,
                confidence: 0
            };

        } catch (error) {
            logger.error(`중복 확인 오류: ${error.message}`);
            return {
                isDuplicate: false,
                reason: 'error',
                duplicateBugId: null,
                confidence: 0
            };
        }
    }

    /**
     * 기본 중복 확인
     */
    async checkBasicDuplicate(bugData) {
        const key = this.generateBasicKey(bugData);
        const cached = this.duplicateCache.get(key);

        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.bugInfo;
        }

        return null;
    }

    /**
     * 패턴 기반 중복 확인
     */
    async checkPatternDuplicate(bugData) {
        const text = `${bugData.title} ${bugData.description}`.toLowerCase();

        for (const [patternName, patternInfo] of this.bugPatterns) {
            let matchCount = 0;
            let totalWeight = 0;

            // 패턴 매칭
            for (const pattern of patternInfo.patterns) {
                if (pattern.test(text)) {
                    matchCount++;
                    totalWeight += patternInfo.weight;
                }
            }

            // 키워드 매칭
            for (const keyword of patternInfo.keywords) {
                if (text.includes(keyword.toLowerCase())) {
                    matchCount++;
                    totalWeight += patternInfo.weight * 0.5;
                }
            }

            // 매칭 점수 계산
            const matchScore = (matchCount * totalWeight) / (patternInfo.patterns.length + patternInfo.keywords.length);

            if (matchScore > this.similarityThreshold) {
                // 유사한 버그 찾기
                const similarBug = await this.findSimilarBugByPattern(patternName, bugData);
                if (similarBug) {
                    return {
                        id: similarBug.id,
                        confidence: matchScore
                    };
                }
            }
        }

        return null;
    }

    /**
     * 유사도 기반 중복 확인
     */
    async checkSimilarityDuplicate(bugData) {
        const text = `${bugData.title} ${bugData.description}`;
        const textVector = this.textToVector(text);

        for (const [key, cached] of this.duplicateCache) {
            if (Date.now() - cached.timestamp > this.cacheTTL) {
                continue;
            }

            const cachedText = `${cached.bugInfo.title} ${cached.bugInfo.description}`;
            const cachedVector = this.textToVector(cachedText);

            const similarity = this.calculateCosineSimilarity(textVector, cachedVector);

            if (similarity > this.similarityThreshold) {
                return {
                    id: cached.bugInfo.id,
                    confidence: similarity
                };
            }
        }

        return null;
    }

    /**
     * 요청 빈도 확인
     */
    checkRequestFrequency(reporterId, bugData) {
        const now = Date.now();
        const key = `${reporterId}_${this.generateBasicKey(bugData)}`;

        if (!this.requestHistory.has(key)) {
            this.requestHistory.set(key, []);
        }

        const requests = this.requestHistory.get(key);

        // 최근 1시간 내 요청만 유지
        const recentRequests = requests.filter(timestamp => now - timestamp < 60 * 60 * 1000);
        recentRequests.push(now);
        this.requestHistory.set(key, recentRequests);

        // 스팸 감지 규칙
        const isSpam = recentRequests.length > 5; // 1시간 내 5회 이상
        const isRapidSpam = recentRequests.length > 3 &&
            recentRequests[recentRequests.length - 1] - recentRequests[recentRequests.length - 4] < 5 * 60 * 1000; // 5분 내 3회 이상

        return {
            isSpam: isSpam || isRapidSpam,
            requestCount: recentRequests.length,
            lastRequest: recentRequests[recentRequests.length - 1]
        };
    }

    /**
     * 텍스트를 벡터로 변환
     */
    textToVector(text) {
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2);

        const vector = new Map();
        words.forEach(word => {
            vector.set(word, (vector.get(word) || 0) + 1);
        });

        return vector;
    }

    /**
     * 코사인 유사도 계산
     */
    calculateCosineSimilarity(vector1, vector2) {
        const keys = new Set([...vector1.keys(), ...vector2.keys()]);
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (const key of keys) {
            const val1 = vector1.get(key) || 0;
            const val2 = vector2.get(key) || 0;

            dotProduct += val1 * val2;
            norm1 += val1 * val1;
            norm2 += val2 * val2;
        }

        if (norm1 === 0 || norm2 === 0) {
            return 0;
        }

        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    /**
     * 패턴별 유사 버그 찾기
     */
    async findSimilarBugByPattern(patternName, bugData) {
        // 실제 구현에서는 데이터베이스에서 검색
        // 여기서는 캐시에서 검색
        for (const [key, cached] of this.duplicateCache) {
            if (cached.pattern === patternName &&
                Date.now() - cached.timestamp < this.cacheTTL) {
                return cached.bugInfo;
            }
        }
        return null;
    }

    /**
     * 캐시에 추가
     */
    addToCache(bugData, reporterId) {
        const key = this.generateBasicKey(bugData);
        const pattern = this.detectPattern(bugData);

        this.duplicateCache.set(key, {
            timestamp: Date.now(),
            bugInfo: {
                id: `bug_${Date.now()}`,
                title: bugData.title,
                description: bugData.description,
                severity: bugData.severity,
                category: bugData.category
            },
            pattern: pattern,
            reporterId: reporterId
        });

        // 캐시 크기 제한
        if (this.duplicateCache.size > this.maxCacheSize) {
            const firstKey = this.duplicateCache.keys().next().value;
            this.duplicateCache.delete(firstKey);
        }
    }

    /**
     * 기본 키 생성
     */
    generateBasicKey(bugData) {
        const title = bugData.title.toLowerCase().replace(/[^\w\s]/g, '');
        const description = bugData.description.toLowerCase().replace(/[^\w\s]/g, '');
        return `${title}_${description}`.substring(0, 100);
    }

    /**
     * 패턴 감지
     */
    detectPattern(bugData) {
        const text = `${bugData.title} ${bugData.description}`.toLowerCase();

        for (const [patternName, patternInfo] of this.bugPatterns) {
            for (const pattern of patternInfo.patterns) {
                if (pattern.test(text)) {
                    return patternName;
                }
            }
        }

        return 'unknown';
    }

    /**
     * 중복 버그 통합
     */
    async mergeDuplicateBugs(originalBugId, duplicateBugId) {
        try {
            // 실제 구현에서는 데이터베이스에서 버그 통합
            logger.info(`중복 버그 통합: ${duplicateBugId} -> ${originalBugId}`);

            // 통합 이력 기록
            await this.recordMergeHistory(originalBugId, duplicateBugId);

            return {
                success: true,
                message: '중복 버그가 성공적으로 통합되었습니다.'
            };
        } catch (error) {
            logger.error(`버그 통합 실패: ${error.message}`);
            return {
                success: false,
                message: '버그 통합에 실패했습니다.'
            };
        }
    }

    /**
     * 통합 이력 기록
     */
    async recordMergeHistory(originalBugId, duplicateBugId) {
        // 실제 구현에서는 데이터베이스에 기록
        logger.info(`통합 이력 기록: ${duplicateBugId} -> ${originalBugId}`);
    }

    /**
     * 중복 요청 차단
     */
    blockDuplicateRequest(requestId, reason) {
        this.blockedRequests.add(requestId);
        logger.warn(`중복 요청 차단: ${requestId} - ${reason}`);
    }

    /**
     * 차단된 요청 확인
     */
    isRequestBlocked(requestId) {
        return this.blockedRequests.has(requestId);
    }

    /**
     * 정리 프로세스 시작
     */
    startCleanupProcess() {
        setInterval(() => {
            this.cleanupExpiredCache();
        }, 60 * 60 * 1000); // 1시간마다 정리
    }

    /**
     * 만료된 캐시 정리
     */
    cleanupExpiredCache() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, cached] of this.duplicateCache) {
            if (now - cached.timestamp > this.cacheTTL) {
                this.duplicateCache.delete(key);
                cleanedCount++;
            }
        }

        // 요청 이력 정리
        for (const [key, requests] of this.requestHistory) {
            const recentRequests = requests.filter(timestamp => now - timestamp < 24 * 60 * 60 * 1000);
            if (recentRequests.length === 0) {
                this.requestHistory.delete(key);
            } else {
                this.requestHistory.set(key, recentRequests);
            }
        }

        logger.info(`캐시 정리 완료: ${cleanedCount}개 항목 제거`);
    }

    /**
     * 통계 정보 조회
     */
    getStatistics() {
        return {
            cacheSize: this.duplicateCache.size,
            requestHistorySize: this.requestHistory.size,
            blockedRequestsCount: this.blockedRequests.size,
            patternsCount: this.bugPatterns.size,
            similarityThreshold: this.similarityThreshold,
            cacheTTL: this.cacheTTL
        };
    }

    /**
     * 중복 확인 결과 조회
     */
    getDuplicateCheckResult(bugData, reporterId) {
        const key = this.generateBasicKey(bugData);
        const cached = this.duplicateCache.get(key);

        if (cached) {
            return {
                isDuplicate: true,
                duplicateBugId: cached.bugInfo.id,
                confidence: 0.9,
                reason: 'cached_duplicate'
            };
        }

        return {
            isDuplicate: false,
            duplicateBugId: null,
            confidence: 0,
            reason: null
        };
    }
}

module.exports = BugDeduplicationService;
