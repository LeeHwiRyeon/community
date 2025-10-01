// API 연동 시스템
class APIIntegrationSystem {
    constructor() {
        this.baseURL = 'http://localhost:5000'; // 백엔드 API URL
        this.wsURL = 'ws://localhost:5000'; // WebSocket URL
        this.isConnected = false;
        this.websocket = null;
        this.retryCount = 0;
        this.maxRetries = 5;

        this.init();
    }

    // 초기화
    init() {
        this.setupWebSocket();
        this.setupEventListeners();
    }

    // WebSocket 연결 설정
    setupWebSocket() {
        try {
            this.websocket = new WebSocket(this.wsURL + '/realtime');

            this.websocket.onopen = () => {
                console.log('WebSocket 연결 성공');
                this.isConnected = true;
                this.retryCount = 0;
                this.onConnectionChange(true);

                // 연결 후 채널 구독
                this.subscribeToChannels();
            };

            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            };

            this.websocket.onclose = () => {
                console.log('WebSocket 연결 종료');
                this.isConnected = false;
                this.onConnectionChange(false);
                this.attemptReconnect();
            };

            this.websocket.onerror = (error) => {
                console.error('WebSocket 오류:', error);
                this.isConnected = false;
                this.onConnectionChange(false);
            };
        } catch (error) {
            console.error('WebSocket 연결 실패:', error);
            this.isConnected = false;
            this.onConnectionChange(false);
        }
    }

    // 채널 구독
    subscribeToChannels() {
        const channels = ['users', 'news', 'posts', 'analytics', 'system'];
        channels.forEach(channel => {
            this.websocket.send(JSON.stringify({
                type: 'subscribe',
                channel: channel
            }));
        });
    }

    // 재연결 시도
    attemptReconnect() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`재연결 시도 ${this.retryCount}/${this.maxRetries}`);

            setTimeout(() => {
                this.setupWebSocket();
            }, 2000 * this.retryCount); // 지수 백오프
        } else {
            console.error('최대 재연결 시도 횟수 초과');
        }
    }

    // 연결 상태 변경 이벤트
    onConnectionChange(connected) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.className = `status-indicator ${connected ? 'status-online' : 'status-offline'}`;
            statusElement.textContent = connected ? '연결됨' : '연결 끊김';
        }
    }

    // WebSocket 메시지 처리
    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'user_update':
                this.handleUserUpdate(data.payload);
                break;
            case 'news_update':
                this.handleNewsUpdate(data.payload);
                break;
            case 'post_update':
                this.handlePostUpdate(data.payload);
                break;
            case 'analytics_update':
                this.handleAnalyticsUpdate(data.payload);
                break;
            case 'system_update':
                this.handleSystemUpdate(data.payload);
                break;
            default:
                console.log('알 수 없는 메시지 타입:', data.type);
        }
    }

    // 사용자 업데이트 처리
    handleUserUpdate(data) {
        if (window.updateUserData) {
            window.updateUserData();
        }
    }

    // 뉴스 업데이트 처리
    handleNewsUpdate(data) {
        if (window.updateNewsData) {
            window.updateNewsData();
        }
    }

    // 게시글 업데이트 처리
    handlePostUpdate(data) {
        if (window.updateRandomData) {
            window.updateRandomData();
        }
    }

    // 분석 데이터 업데이트 처리
    handleAnalyticsUpdate(data) {
        if (window.updateRandomData) {
            window.updateRandomData();
        }
    }

    // 시스템 업데이트 처리
    handleSystemUpdate(data) {
        if (window.updateSystemData) {
            window.updateSystemData();
        }
    }

    // HTTP API 호출
    async apiCall(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const mergedOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, mergedOptions);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API 호출 실패 (${endpoint}):`, error);
            throw error;
        }
    }

    // 사용자 데이터 가져오기
    async getUsers(limit = 100, offset = 0) {
        try {
            return await this.apiCall(`/api/users?limit=${limit}&offset=${offset}`);
        } catch (error) {
            console.error('사용자 데이터 가져오기 실패:', error);
            return [];
        }
    }

    // 뉴스 데이터 가져오기
    async getNews(limit = 20, offset = 0) {
        try {
            return await this.apiCall(`/api/news?limit=${limit}&offset=${offset}`);
        } catch (error) {
            console.error('뉴스 데이터 가져오기 실패:', error);
            return [];
        }
    }

    // 게시글 데이터 가져오기
    async getPosts(limit = 50, offset = 0) {
        try {
            return await this.apiCall(`/api/posts?limit=${limit}&offset=${offset}`);
        } catch (error) {
            console.error('게시글 데이터 가져오기 실패:', error);
            return [];
        }
    }

    // 댓글 데이터 가져오기
    async getComments(postId = null, limit = 50, offset = 0) {
        try {
            const endpoint = postId
                ? `/api/posts/${postId}/comments?limit=${limit}&offset=${offset}`
                : `/api/comments?limit=${limit}&offset=${offset}`;
            return await this.apiCall(endpoint);
        } catch (error) {
            console.error('댓글 데이터 가져오기 실패:', error);
            return [];
        }
    }

    // 분석 데이터 가져오기
    async getAnalytics() {
        try {
            return await this.apiCall('/api/analytics');
        } catch (error) {
            console.error('분석 데이터 가져오기 실패:', error);
            return null;
        }
    }

    // 시스템 데이터 가져오기
    async getSystemData() {
        try {
            return await this.apiCall('/api/system');
        } catch (error) {
            console.error('시스템 데이터 가져오기 실패:', error);
            return null;
        }
    }

    // 뉴스 생성
    async createNews(newsData) {
        try {
            return await this.apiCall('/api/news', {
                method: 'POST',
                body: JSON.stringify(newsData)
            });
        } catch (error) {
            console.error('뉴스 생성 실패:', error);
            throw error;
        }
    }

    // 뉴스 수정
    async updateNews(id, updates) {
        try {
            return await this.apiCall(`/api/news/${id}`, {
                method: 'PUT',
                body: JSON.stringify(updates)
            });
        } catch (error) {
            console.error('뉴스 수정 실패:', error);
            throw error;
        }
    }

    // 뉴스 삭제
    async deleteNews(id) {
        try {
            return await this.apiCall(`/api/news/${id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('뉴스 삭제 실패:', error);
            throw error;
        }
    }

    // 뉴스 발행
    async publishNews(id) {
        try {
            return await this.apiCall(`/api/news/${id}/publish`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('뉴스 발행 실패:', error);
            throw error;
        }
    }

    // 통계 데이터 가져오기
    async getStats() {
        try {
            return await this.apiCall('/api/stats');
        } catch (error) {
            console.error('통계 데이터 가져오기 실패:', error);
            return null;
        }
    }

    // 실시간 데이터 구독
    subscribeToUpdates(type) {
        if (this.websocket && this.isConnected) {
            this.websocket.send(JSON.stringify({
                type: 'subscribe',
                data: { type }
            }));
        }
    }

    // 실시간 데이터 구독 해제
    unsubscribeFromUpdates(type) {
        if (this.websocket && this.isConnected) {
            this.websocket.send(JSON.stringify({
                type: 'unsubscribe',
                data: { type }
            }));
        }
    }

    // 연결 상태 확인
    isWebSocketConnected() {
        return this.isConnected && this.websocket && this.websocket.readyState === WebSocket.OPEN;
    }

    // 연결 종료
    disconnect() {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        this.isConnected = false;
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 페이지 언로드 시 연결 종료
        window.addEventListener('beforeunload', () => {
            this.disconnect();
        });

        // 페이지 가시성 변경 시 연결 상태 확인
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // 페이지가 숨겨졌을 때
                console.log('페이지가 숨겨짐 - 연결 유지');
            } else {
                // 페이지가 다시 보일 때
                console.log('페이지가 다시 보임 - 연결 상태 확인');
                if (!this.isWebSocketConnected()) {
                    this.setupWebSocket();
                }
            }
        });
    }
}

// 전역 인스턴스 생성
window.apiIntegration = new APIIntegrationSystem();

// 내보내기 (Node.js 환경에서 사용할 경우)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIIntegrationSystem;
}
