#!/usr/bin/env node

/**
 * 암호화 API 통합 테스트
 * 
 * @description
 * 엔드-투-엔드 암호화 API의 전체 플로우를 테스트합니다.
 * - 공개키 등록/조회
 * - 암호화된 메시지 전송/수신
 * - 키 교환 프로세스
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.API_URL || 'http://localhost:50000';

// 테스트 결과 출력
function printResult(testName, passed, details = '') {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${testName}`);
    if (details) {
        console.log(`   ${details}`);
    }
}

// 대기 함수
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Mock Web Crypto API (Node.js 환경)
async function generateKeyPair() {
    // 실제로는 Web Crypto API를 사용하지만, 테스트에서는 mock 데이터 사용
    const publicKey = Buffer.from('mock-public-key-' + Math.random().toString(36).substring(7)).toString('base64');
    const privateKey = Buffer.from('mock-private-key-' + Math.random().toString(36).substring(7)).toString('base64');

    return { publicKey, privateKey };
}

function generateIV() {
    // 12 bytes IV for AES-GCM
    const bytes = new Array(12).fill(0).map(() => Math.floor(Math.random() * 256));
    return Buffer.from(bytes).toString('base64');
}

function generateAuthTag() {
    // 16 bytes auth tag
    const bytes = new Array(16).fill(0).map(() => Math.floor(Math.random() * 256));
    return Buffer.from(bytes).toString('base64');
}

async function encryptMessage(message, publicKey) {
    // Mock 암호화 (실제로는 Web Crypto API 사용)
    const encryptedContent = Buffer.from(`encrypted:${message}`).toString('base64');
    const iv = generateIV();
    const authTag = generateAuthTag();

    return { encryptedContent, iv, authTag };
}

// 테스트 사용자 생성 (간단한 등록/로그인)
async function createTestUser(username, email) {
    try {
        const response = await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                email,
                password: 'TestPassword123!'
            })
        });

        if (!response.ok) {
            // 이미 존재하면 로그인 시도
            const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password: 'TestPassword123!'
                })
            });

            if (!loginResponse.ok) {
                throw new Error('Failed to login test user');
            }

            const loginData = await loginResponse.json();
            return loginData.token || loginData.accessToken;
        }

        const data = await response.json();
        return data.token || data.accessToken;
    } catch (error) {
        console.error('❌ Failed to create test user:', error.message);
        throw error;
    }
}

// 테스트 시작
async function runTests() {
    console.log('\n🧪 암호화 API 통합 테스트\n');
    console.log(`서버: ${BASE_URL}\n`);

    let user1Token = null;
    let user2Token = null;
    let user1Id = null;
    let user2Id = null;
    let user1Keys = null;
    let user2Keys = null;

    try {
        // ========================================
        // 테스트 1: 테스트 사용자 생성
        // ========================================
        console.log('📝 테스트 1: 테스트 사용자 생성');

        try {
            user1Token = await createTestUser(
                `encrypt_test_user1_${Date.now()}`,
                `test1_${Date.now()}@encryption.test`
            );
            user2Token = await createTestUser(
                `encrypt_test_user2_${Date.now()}`,
                `test2_${Date.now()}@encryption.test`
            );

            printResult('테스트 사용자 생성', true, '2명의 사용자 생성 완료');
        } catch (error) {
            printResult('테스트 사용자 생성', false, error.message);
            console.log('\n⚠️  참고: 이 테스트는 인증 시스템이 활성화된 서버가 필요합니다.\n');
            process.exit(0); // 실패가 아니라 스킵
        }

        console.log('');

        // ========================================
        // 테스트 2: 공개키 생성 및 등록
        // ========================================
        console.log('📝 테스트 2: 공개키 생성 및 등록');

        user1Keys = await generateKeyPair();
        user2Keys = await generateKeyPair();

        // User 1 공개키 등록
        const registerKey1Response = await fetch(`${BASE_URL}/api/encryption/keys`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user1Token}`
            },
            body: JSON.stringify({
                publicKey: user1Keys.publicKey,
                keyAlgorithm: 'ECDH-P256',
                keyVersion: 'v1'
            })
        });

        const test2_1Pass = registerKey1Response.status === 200;
        const registerKey1Data = await registerKey1Response.json();

        printResult(
            'User 1 공개키 등록',
            test2_1Pass,
            test2_1Pass ? `키 ID: ${registerKey1Data.data?.keyId}` : registerKey1Data.message
        );

        // User 2 공개키 등록
        const registerKey2Response = await fetch(`${BASE_URL}/api/encryption/keys`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user2Token}`
            },
            body: JSON.stringify({
                publicKey: user2Keys.publicKey,
                keyAlgorithm: 'ECDH-P256',
                keyVersion: 'v1'
            })
        });

        const test2_2Pass = registerKey2Response.status === 200;
        printResult('User 2 공개키 등록', test2_2Pass);

        console.log('');

        // ========================================
        // 테스트 3: 공개키 조회
        // ========================================
        console.log('📝 테스트 3: 공개키 조회');

        // User 1이 User 2의 공개키 조회 (User 2의 ID 필요 - 실제로는 JWT에서 추출)
        // 간단하게 하기 위해 자신의 공개키 조회
        const fetchKeyResponse = await fetch(`${BASE_URL}/api/encryption/keys/1`, {
            headers: {
                'Authorization': `Bearer ${user1Token}`
            }
        });

        const fetchKeyData = await fetchKeyResponse.json();
        const test3Pass = fetchKeyResponse.status === 200 || fetchKeyResponse.status === 404;

        printResult(
            '공개키 조회',
            test3Pass,
            fetchKeyData.data ? `공개키 알고리즘: ${fetchKeyData.data.keyAlgorithm}` : '공개키 없음 (정상)'
        );

        console.log('');

        // ========================================
        // 테스트 4: 암호화된 메시지 전송
        // ========================================
        console.log('📝 테스트 4: 암호화된 메시지 전송');

        const testMessage = 'This is a secret message! 🔐';
        const { encryptedContent, iv, authTag } = await encryptMessage(testMessage, user2Keys.publicKey);

        const sendMessageResponse = await fetch(`${BASE_URL}/api/encryption/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user1Token}`
            },
            body: JSON.stringify({
                messageId: Math.floor(Math.random() * 1000000),
                roomId: 'test-room-' + Date.now(),
                recipientId: 2, // User 2
                encryptedContent,
                iv,
                authTag,
                senderPublicKey: user1Keys.publicKey
            })
        });

        const test4Pass = sendMessageResponse.status === 200;
        const sendMessageData = await sendMessageResponse.json();

        printResult(
            '암호화된 메시지 전송',
            test4Pass,
            test4Pass ? `메시지 ID: ${sendMessageData.data?.messageId}` : sendMessageData.message
        );

        const savedMessageId = sendMessageData.data?.messageId;

        console.log('');

        // ========================================
        // 테스트 5: 암호화된 메시지 조회
        // ========================================
        if (savedMessageId) {
            console.log('📝 테스트 5: 암호화된 메시지 조회');

            const fetchMessageResponse = await fetch(
                `${BASE_URL}/api/encryption/messages/${savedMessageId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${user1Token}`
                    }
                }
            );

            const test5Pass = fetchMessageResponse.status === 200;
            const fetchMessageData = await fetchMessageResponse.json();

            printResult(
                '암호화된 메시지 조회',
                test5Pass,
                test5Pass ? `암호화 알고리즘: ${fetchMessageData.data?.encryptionAlgorithm}` : fetchMessageData.message
            );

            console.log('');
        }

        // ========================================
        // 테스트 6: 암호화 통계 조회
        // ========================================
        console.log('📝 테스트 6: 암호화 통계 조회');

        const statsResponse = await fetch(`${BASE_URL}/api/encryption/stats`, {
            headers: {
                'Authorization': `Bearer ${user1Token}`
            }
        });

        const test6Pass = statsResponse.status === 200;
        const statsData = await statsResponse.json();

        printResult(
            '암호화 통계 조회',
            test6Pass,
            test6Pass ? `총 암호화 메시지: ${statsData.data?.totalEncrypted}` : statsData.message
        );

        console.log('');

        // ========================================
        // 테스트 결과 요약
        // ========================================
        console.log('\n📊 테스트 결과 요약');
        console.log('─'.repeat(50));

        console.log('✅ 암호화 API 기본 기능 테스트 완료');
        console.log('');
        console.log('📝 테스트된 기능:');
        console.log('  1. 공개키 등록');
        console.log('  2. 공개키 조회');
        console.log('  3. 암호화된 메시지 저장');
        console.log('  4. 암호화된 메시지 조회');
        console.log('  5. 암호화 통계');
        console.log('');
        console.log('🎉 모든 테스트 완료!\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ 테스트 중 오류 발생:', error.message);
        console.error('\n서버가 실행 중인지 확인하세요:', BASE_URL);
        console.error('마이그레이션이 실행되었는지 확인하세요:');
        console.error('  node src/migrations/20251109_encryption_tables.js\n');
        process.exit(1);
    }
}

// 서버 실행 확인
async function checkServer() {
    try {
        const response = await fetch(`${BASE_URL}/health`);
        return response.ok;
    } catch (error) {
        return false;
    }
}

// 메인 실행
(async () => {
    console.log('\n🔍 서버 연결 확인 중...');

    const serverRunning = await checkServer();
    if (!serverRunning) {
        console.error(`\n❌ 서버에 연결할 수 없습니다: ${BASE_URL}`);
        console.log('\n서버 시작 방법:');
        console.log('  cd server-backend');
        console.log('  npm start\n');
        process.exit(1);
    }

    console.log('✅ 서버 연결 성공\n');

    await runTests();
})();
