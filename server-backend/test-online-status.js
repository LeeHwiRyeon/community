/**
 * Online Status Feature Test
 * 온라인 상태 기능 테스트
 * 
 * @author AUTOAGENTS
 * @date 2025-11-11
 */

import { io } from 'socket.io-client';
import axios from 'axios';

const BASE_URL = 'http://localhost:3001';
const SOCKET_URL = 'http://localhost:3001';

// 테스트용 사용자 토큰 (실제 환경에서는 로그인으로 받아야 함)
// 이 테스트를 실행하기 전에 먼저 로그인하여 토큰을 받아야 합니다
const TEST_TOKEN = process.env.TEST_TOKEN || 'your-jwt-token-here';

console.log('🧪 온라인 상태 기능 테스트 시작\n');

/**
 * REST API 테스트
 */
async function testRESTAPI() {
    console.log('📡 REST API 테스트...\n');

    try {
        // 1. 온라인 사용자 목록 조회
        console.log('1️⃣  온라인 사용자 목록 조회');
        const listResponse = await axios.get(`${BASE_URL}/api/online-status`, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`
            }
        });
        console.log('✅ 응답:', listResponse.data);
        console.log(`   총 ${listResponse.data.count}명 온라인\n`);

        // 2. 특정 사용자 상태 조회 (자기 자신)
        console.log('2️⃣  자신의 상태 조회 (userId=1)');
        const statusResponse = await axios.get(`${BASE_URL}/api/online-status/1`, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`
            }
        });
        console.log('✅ 응답:', statusResponse.data);
        console.log('');

        // 3. 통계 조회
        console.log('3️⃣  온라인 상태 통계 조회');
        const statsResponse = await axios.get(`${BASE_URL}/api/online-status/stats/summary`, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`
            }
        });
        console.log('✅ 응답:', statsResponse.data);
        console.log('');

        // 4. 하트비트 전송
        console.log('4️⃣  하트비트 전송');
        const heartbeatResponse = await axios.post(
            `${BASE_URL}/api/online-status/heartbeat`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${TEST_TOKEN}`
                }
            }
        );
        console.log('✅ 응답:', heartbeatResponse.data);
        console.log('');

        console.log('✅ REST API 테스트 완료!\n');
        return true;
    } catch (error) {
        console.error('❌ REST API 테스트 실패:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Socket.IO 테스트
 */
async function testSocketIO() {
    console.log('🔌 Socket.IO 테스트...\n');

    return new Promise((resolve) => {
        const socket = io(SOCKET_URL, {
            auth: {
                token: TEST_TOKEN
            },
            transports: ['websocket', 'polling']
        });

        let testsPassed = 0;
        const totalTests = 5;

        // 연결 성공
        socket.on('connect', () => {
            console.log('1️⃣  Socket 연결 성공:', socket.id);
            testsPassed++;
        });

        // 연결 확인 이벤트
        socket.on('connected', (data) => {
            console.log('2️⃣  연결 확인 이벤트 수신:', data);
            testsPassed++;

            // 온라인 사용자 목록 요청
            console.log('\n3️⃣  온라인 사용자 목록 요청');
            socket.emit('online:list');
        });

        // 온라인 사용자 목록 수신
        socket.on('online:users', (data) => {
            console.log('✅ 온라인 사용자 목록 수신:', data);
            testsPassed++;

            // 상태 변경 테스트
            console.log('\n4️⃣  상태를 "away"로 변경');
            socket.emit('status:update', { status: 'away' });
        });

        // 상태 업데이트 확인
        socket.on('status:updated', (data) => {
            console.log('✅ 상태 변경 완료:', data);
            testsPassed++;

            // 하트비트 테스트
            console.log('\n5️⃣  하트비트 전송');
            socket.emit('heartbeat');
        });

        // 하트비트 응답
        socket.on('heartbeat:ack', (data) => {
            console.log('✅ 하트비트 응답:', data);
            testsPassed++;

            // 테스트 완료
            console.log(`\n✅ Socket.IO 테스트 완료! (${testsPassed}/${totalTests} 통과)\n`);

            // 연결 종료
            socket.disconnect();
            resolve(testsPassed === totalTests);
        });

        // 사용자 상태 변경 브로드캐스트 수신
        socket.on('user:status', (data) => {
            console.log('📢 사용자 상태 변경 브로드캐스트:', data);
        });

        // 연결 에러
        socket.on('connect_error', (error) => {
            console.error('❌ Socket 연결 실패:', error.message);
            resolve(false);
        });

        // 일반 에러
        socket.on('error', (error) => {
            console.error('❌ Socket 에러:', error);
        });

        // 연결 종료
        socket.on('disconnect', (reason) => {
            console.log('🔌 Socket 연결 종료:', reason);
        });

        // 타임아웃 (30초)
        setTimeout(() => {
            console.log('\n⏱️  테스트 타임아웃');
            socket.disconnect();
            resolve(false);
        }, 30000);
    });
}

/**
 * 메인 테스트 실행
 */
async function runTests() {
    console.log('═'.repeat(60));
    console.log('온라인 상태 기능 통합 테스트');
    console.log('═'.repeat(60));
    console.log('');

    // 토큰 확인
    if (TEST_TOKEN === 'your-jwt-token-here') {
        console.log('⚠️  경고: TEST_TOKEN 환경 변수를 설정하세요!');
        console.log('사용법: TEST_TOKEN=your-token node test-online-status.js\n');
        console.log('또는 먼저 로그인하여 토큰을 받으세요:\n');
        console.log('curl -X POST http://localhost:3001/api/auth/login \\');
        console.log('  -H "Content-Type: application/json" \\');
        console.log('  -d \'{"email":"test@example.com","password":"yourpassword"}\'\n');
        process.exit(1);
    }

    try {
        // REST API 테스트
        const restSuccess = await testRESTAPI();

        // Socket.IO 테스트
        const socketSuccess = await testSocketIO();

        // 결과 출력
        console.log('═'.repeat(60));
        console.log('테스트 결과');
        console.log('═'.repeat(60));
        console.log(`REST API: ${restSuccess ? '✅ 성공' : '❌ 실패'}`);
        console.log(`Socket.IO: ${socketSuccess ? '✅ 성공' : '❌ 실패'}`);
        console.log('═'.repeat(60));
        console.log('');

        process.exit(restSuccess && socketSuccess ? 0 : 1);
    } catch (error) {
        console.error('❌ 테스트 실패:', error);
        process.exit(1);
    }
}

// 테스트 실행
runTests();
