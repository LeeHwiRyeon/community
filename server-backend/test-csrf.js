/**
 * CSRF Token 구현 테스트
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function testCSRF() {
    console.log('🧪 CSRF Token Implementation Test\n');
    console.log('='.repeat(80));

    try {
        // Test 1: CSRF 토큰 발급
        console.log('\n[Test 1] CSRF 토큰 발급 테스트');
        console.log('-'.repeat(80));

        const tokenResponse = await axios.get(`${BASE_URL}/api/auth/csrf-token`, {
            withCredentials: true
        });

        console.log('✅ CSRF 토큰 발급 성공');
        console.log(`   상태 코드: ${tokenResponse.status}`);
        console.log(`   응답 데이터:`, JSON.stringify(tokenResponse.data, null, 2));

        const csrfToken = tokenResponse.data.token;
        const cookies = tokenResponse.headers['set-cookie'];

        console.log(`\n   토큰 길이: ${csrfToken ? csrfToken.length : 0} characters`);
        console.log(`   쿠키 설정: ${cookies ? cookies.length : 0} cookies`);
        if (cookies) {
            cookies.forEach(cookie => {
                console.log(`     - ${cookie.split(';')[0]}`);
            });
        }

        // Test 2: CSRF 토큰 없이 POST 요청 (실패 예상)
        console.log('\n[Test 2] CSRF 토큰 없이 POST 요청 (실패 예상)');
        console.log('-'.repeat(80));

        try {
            await axios.post(`${BASE_URL}/api/posts`, {
                title: 'Test Post',
                content: 'Test Content'
            }, {
                withCredentials: true
            });
            console.log('❌ 예상과 다르게 요청 성공 (토큰 없이)');
        } catch (error) {
            if (error.response && error.response.status === 403) {
                console.log('✅ CSRF 검증 실패 (예상된 동작)');
                console.log(`   상태 코드: ${error.response.status}`);
                console.log(`   오류 메시지: ${error.response.data.message || error.response.data.error}`);
            } else {
                console.log(`⚠️  다른 오류 발생: ${error.message}`);
            }
        }

        // Test 3: CSRF 토큰과 함께 POST 요청 (성공 예상)
        console.log('\n[Test 3] CSRF 토큰과 함께 POST 요청');
        console.log('-'.repeat(80));

        // 먼저 로그인하여 인증 토큰 얻기
        let authToken = null;
        try {
            const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
                email: 'test@example.com',
                password: 'test123'
            }, {
                withCredentials: true
            });
            authToken = loginResponse.data.token;
            console.log('   로그인 성공 (테스트용)');
        } catch (loginError) {
            console.log('   ⚠️  로그인 실패 (테스트 계정 없음) - 스킵');
        }

        if (csrfToken) {
            try {
                const headers = {
                    'X-CSRF-Token': csrfToken
                };
                if (authToken) {
                    headers['Authorization'] = `Bearer ${authToken}`;
                }

                await axios.post(`${BASE_URL}/api/posts`, {
                    title: 'Test Post with CSRF',
                    content: 'Test Content'
                }, {
                    headers,
                    withCredentials: true
                });
                console.log('✅ CSRF 토큰과 함께 요청 성공');
            } catch (error) {
                if (error.response) {
                    console.log(`⚠️  요청 실패 (다른 이유): ${error.response.status} - ${error.response.data.message || error.response.data.error}`);
                } else {
                    console.log(`⚠️  요청 실패: ${error.message}`);
                }
            }
        }

        // Test 4: GET 요청은 CSRF 검증 면제 확인
        console.log('\n[Test 4] GET 요청 CSRF 면제 확인');
        console.log('-'.repeat(80));

        try {
            const getResponse = await axios.get(`${BASE_URL}/api/posts`, {
                withCredentials: true
            });
            console.log('✅ GET 요청 성공 (CSRF 토큰 불필요)');
            console.log(`   상태 코드: ${getResponse.status}`);
        } catch (error) {
            if (error.response) {
                console.log(`⚠️  GET 요청 실패: ${error.response.status}`);
            } else {
                console.log(`⚠️  GET 요청 실패: ${error.message}`);
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('🎉 CSRF 테스트 완료\n');

    } catch (error) {
        console.error('\n❌ 테스트 중 오류 발생:', error.message);
        if (error.response) {
            console.error('   응답 데이터:', error.response.data);
        }
    }
}

// 서버가 준비될 때까지 대기
async function waitForServer(maxRetries = 10, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await axios.get(`${BASE_URL}/api/health`, { timeout: 2000 });
            console.log('✅ 서버 연결 확인\n');
            return true;
        } catch (error) {
            if (i === maxRetries - 1) {
                console.error('❌ 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.');
                return false;
            }
            console.log(`⏳ 서버 대기 중... (${i + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// 메인 실행
(async () => {
    console.log('🚀 CSRF 구현 테스트 시작...\n');

    const serverReady = await waitForServer();
    if (!serverReady) {
        process.exit(1);
    }

    await testCSRF();
})();
