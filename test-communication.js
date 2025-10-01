const http = require('http');

/**
 * 통신 테스트 스크립트
 */
class CommunicationTest {
    constructor(serverUrl = 'http://localhost:3000') {
        this.serverUrl = serverUrl;
    }

    /**
     * HTTP 요청 전송
     */
    async sendRequest(path, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.serverUrl);
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(body);
                        resolve({
                            statusCode: res.statusCode,
                            data: jsonData
                        });
                    } catch (error) {
                        resolve({
                            statusCode: res.statusCode,
                            data: body
                        });
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    /**
     * 헬스 체크
     */
    async healthCheck() {
        try {
            console.log('🔍 서버 헬스 체크 중...');
            const response = await this.sendRequest('/health');

            if (response.statusCode === 200) {
                console.log('✅ 서버 정상 작동');
                console.log('📊 서버 상태:', response.data);
                return true;
            } else {
                console.log('❌ 서버 오류:', response.statusCode);
                return false;
            }
        } catch (error) {
            console.error('❌ 헬스 체크 실패:', error.message);
            return false;
        }
    }

    /**
     * Task 생성 테스트
     */
    async createTask(content, priority = 'medium', category = 'general') {
        try {
            console.log(`📝 Task 생성 테스트: ${content}`);
            const response = await this.sendRequest('/api/tasks', 'POST', {
                content: content,
                priority: priority,
                category: category
            });

            if (response.statusCode === 200 && response.data.success) {
                console.log('✅ Task 생성 성공');
                console.log('📋 생성된 Task:', response.data.task);
                return response.data.task;
            } else {
                console.log('❌ Task 생성 실패:', response.data);
                return null;
            }
        } catch (error) {
            console.error('❌ Task 생성 오류:', error.message);
            return null;
        }
    }

    /**
     * Task 목록 조회
     */
    async getTasks() {
        try {
            console.log('📋 Task 목록 조회 중...');
            const response = await this.sendRequest('/api/tasks');

            if (response.statusCode === 200 && response.data.success) {
                console.log('✅ Task 목록 조회 성공');
                console.log(`📊 총 Task 수: ${response.data.tasks.length}개`);
                return response.data.tasks;
            } else {
                console.log('❌ Task 목록 조회 실패:', response.data);
                return [];
            }
        } catch (error) {
            console.error('❌ Task 목록 조회 오류:', error.message);
            return [];
        }
    }

    /**
     * 통신 테스트
     */
    async testCommunication() {
        try {
            console.log('📡 통신 테스트 중...');
            const response = await this.sendRequest('/api/communication/test', 'POST', {
                message: '통신 테스트 메시지'
            });

            if (response.statusCode === 200 && response.data.success) {
                console.log('✅ 통신 테스트 성공');
                console.log('📡 응답:', response.data.message);
                return true;
            } else {
                console.log('❌ 통신 테스트 실패:', response.data);
                return false;
            }
        } catch (error) {
            console.error('❌ 통신 테스트 오류:', error.message);
            return false;
        }
    }

    /**
     * 전체 테스트 실행
     */
    async runAllTests() {
        console.log('🚀 통합 통신 시스템 테스트 시작');
        console.log('=====================================');

        // 1. 헬스 체크
        const healthOk = await this.healthCheck();
        if (!healthOk) {
            console.log('❌ 서버가 응답하지 않습니다. 테스트를 중단합니다.');
            return;
        }

        console.log('');

        // 2. 통신 테스트
        await this.testCommunication();

        console.log('');

        // 3. Task 생성 테스트
        const task1 = await this.createTask('통합 통신 시스템 테스트', 'high', 'testing');
        const task2 = await this.createTask('한글 UTF8 안전 테스트', 'medium', 'testing');
        const task3 = await this.createTask('이진데이터 저장 테스트', 'urgent', 'database');

        console.log('');

        // 4. Task 목록 조회
        const tasks = await this.getTasks();

        console.log('');
        console.log('🎉 모든 테스트 완료!');
        console.log(`📊 총 ${tasks.length}개의 Task가 생성되었습니다.`);
    }
}

// CLI 실행
if (require.main === module) {
    const test = new CommunicationTest();
    test.runAllTests().catch(console.error);
}

module.exports = CommunicationTest;