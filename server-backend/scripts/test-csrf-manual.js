#!/usr/bin/env node

/**
 * CSRF 수동 테스트 스크립트
 * 
 * @description
 * 실제 서버에 대한 CSRF 토큰 시스템 수동 테스트
 * 서버가 실행 중이어야 합니다.
 */

const fetch = require('node-fetch');
const { CookieJar } = require('tough-cookie');
const { Headers } = require('node-fetch');

const BASE_URL = process.env.API_URL || 'http://localhost:50000';

// 쿠키 저장소
const cookieJar = new CookieJar();

// Fetch with cookies
async function fetchWithCookies(url, options = {}) {
    // 쿠키 가져오기
    const cookies = await cookieJar.getCookies(url);
    const cookieHeader = cookies.map(c => `${c.key}=${c.value}`).join('; ');

    const headers = new Headers(options.headers || {});
    if (cookieHeader) {
        headers.set('Cookie', cookieHeader);
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    // 쿠키 저장
    const setCookieHeaders = response.headers.raw()['set-cookie'];
    if (setCookieHeaders) {
        for (const cookie of setCookieHeaders) {
            await cookieJar.setCookie(cookie, url);
        }
    }

    return response;
}

// 테스트 결과 출력
function printResult(testName, passed, details = '') {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${testName}`);
    if (details) {
        console.log(`   ${details}`);
    }
}

// 테스트 시작
async function runTests() {
    console.log('\n🧪 CSRF 토큰 시스템 수동 테스트\n');
    console.log(`서버: ${BASE_URL}\n`);

    let csrfToken = null;

    try {
        // ========================================
        // 테스트 1: CSRF 토큰 발급
        // ========================================
        console.log('📝 테스트 1: CSRF 토큰 발급');

        const tokenResponse = await fetchWithCookies(`${BASE_URL}/api/auth/csrf-token`);
        const tokenData = await tokenResponse.json();

        const test1Pass = tokenResponse.status === 200 && tokenData.data?.csrfToken;
        printResult(
            'GET /api/auth/csrf-token',
            test1Pass,
            test1Pass ? `토큰: ${tokenData.data.csrfToken.substring(0, 20)}...` : '토큰 발급 실패'
        );

        if (!test1Pass) {
            console.error('\n❌ 토큰 발급 실패. 서버가 실행 중인지 확인하세요.\n');
            process.exit(1);
        }

        csrfToken = tokenData.data.csrfToken;
        console.log('');

        // ========================================
        // 테스트 2: CSRF 토큰 없이 POST 요청 (실패해야 함)
        // ========================================
        console.log('📝 테스트 2: CSRF 토큰 없이 POST 요청');

        const noTokenResponse = await fetchWithCookies(`${BASE_URL}/api/test/protected`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: 'data' })
        });

        const test2Pass = noTokenResponse.status === 403;
        printResult(
            'POST without CSRF token',
            test2Pass,
            test2Pass ? '예상대로 403 오류 발생' : `예상과 다름: ${noTokenResponse.status}`
        );
        console.log('');

        // ========================================
        // 테스트 3: CSRF 토큰으로 POST 요청 (성공해야 함)
        // ========================================
        console.log('📝 테스트 3: CSRF 토큰으로 POST 요청');

        const withTokenResponse = await fetchWithCookies(`${BASE_URL}/api/test/protected`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken
            },
            body: JSON.stringify({ test: 'data' })
        });

        const test3Pass = withTokenResponse.status === 200;
        printResult(
            'POST with valid CSRF token',
            test3Pass,
            test3Pass ? '요청 성공' : `예상과 다름: ${withTokenResponse.status}`
        );
        console.log('');

        // ========================================
        // 테스트 4: 잘못된 CSRF 토큰 (실패해야 함)
        // ========================================
        console.log('📝 테스트 4: 잘못된 CSRF 토큰');

        const invalidTokenResponse = await fetchWithCookies(`${BASE_URL}/api/test/protected`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': 'invalid-token-123'
            },
            body: JSON.stringify({ test: 'data' })
        });

        const test4Pass = invalidTokenResponse.status === 403;
        printResult(
            'POST with invalid CSRF token',
            test4Pass,
            test4Pass ? '예상대로 403 오류 발생' : `예상과 다름: ${invalidTokenResponse.status}`
        );
        console.log('');

        // ========================================
        // 테스트 5: CSRF 토큰 갱신
        // ========================================
        console.log('📝 테스트 5: CSRF 토큰 갱신');

        const refreshResponse = await fetchWithCookies(`${BASE_URL}/api/auth/csrf-refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken
            }
        });

        const refreshData = await refreshResponse.json();
        const newToken = refreshData.csrfToken;

        const test5Pass = refreshResponse.status === 200 && newToken && newToken !== csrfToken;
        printResult(
            'POST /api/auth/csrf-refresh',
            test5Pass,
            test5Pass ? `새 토큰: ${newToken.substring(0, 20)}...` : '토큰 갱신 실패'
        );
        console.log('');

        // ========================================
        // 테스트 6: 갱신된 토큰으로 요청
        // ========================================
        console.log('📝 테스트 6: 갱신된 토큰으로 요청');

        const newTokenResponse = await fetchWithCookies(`${BASE_URL}/api/test/protected`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': newToken
            },
            body: JSON.stringify({ test: 'data' })
        });

        const test6Pass = newTokenResponse.status === 200;
        printResult(
            'POST with refreshed token',
            test6Pass,
            test6Pass ? '요청 성공' : `예상과 다름: ${newTokenResponse.status}`
        );
        console.log('');

        // ========================================
        // 테스트 7: GET 요청 (CSRF 토큰 불필요)
        // ========================================
        console.log('📝 테스트 7: GET 요청 (CSRF 토큰 불필요)');

        const getResponse = await fetchWithCookies(`${BASE_URL}/api/test/safe`);

        const test7Pass = getResponse.status === 200;
        printResult(
            'GET without CSRF token',
            test7Pass,
            test7Pass ? 'GET 요청은 CSRF 검증 불필요' : `예상과 다름: ${getResponse.status}`
        );
        console.log('');

        // ========================================
        // 테스트 결과 요약
        // ========================================
        console.log('\n📊 테스트 결과 요약');
        console.log('─'.repeat(50));

        const allTests = [test1Pass, test2Pass, test3Pass, test4Pass, test5Pass, test6Pass, test7Pass];
        const passedCount = allTests.filter(t => t).length;
        const totalCount = allTests.length;

        console.log(`✅ 통과: ${passedCount}/${totalCount}`);
        console.log(`❌ 실패: ${totalCount - passedCount}/${totalCount}`);

        if (passedCount === totalCount) {
            console.log('\n🎉 모든 테스트 통과!\n');
            process.exit(0);
        } else {
            console.log('\n⚠️  일부 테스트 실패\n');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ 테스트 중 오류 발생:', error.message);
        console.error('\n서버가 실행 중인지 확인하세요:', BASE_URL);
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
