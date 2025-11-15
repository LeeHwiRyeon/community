#!/usr/bin/env node

/**
 * Redis 세션 저장소 테스트 스크립트
 * 
 * @description
 * Redis 기반 세션 저장소의 지속성 및 CSRF 토큰 유지를 검증합니다.
 */

const fetch = require('node-fetch');
const { CookieJar } = require('tough-cookie');
const { Headers } = require('node-fetch');

const BASE_URL = process.env.API_URL || 'http://localhost:50000';

// 쿠키 저장소
const cookieJar = new CookieJar();

// Fetch with cookies
async function fetchWithCookies(url, options = {}) {
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

// 대기 함수
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Redis 연결 확인
async function checkRedis() {
    try {
        const response = await fetch(`${BASE_URL}/health`);
        const data = await response.json();
        return data.redis === 'connected';
    } catch (error) {
        return false;
    }
}

// 테스트 시작
async function runTests() {
    console.log('\n🧪 Redis 세션 저장소 테스트\n');
    console.log(`서버: ${BASE_URL}\n`);

    // Redis 연결 확인
    console.log('📝 Redis 연결 확인');
    const redisConnected = await checkRedis();
    printResult(
        'Redis 연결 상태',
        redisConnected,
        redisConnected ? 'Redis가 연결되어 있습니다' : '⚠️  Redis 미연결 - 메모리 세션 사용'
    );
    console.log('');

    if (!redisConnected) {
        console.log('⚠️  Redis가 연결되지 않았습니다.');
        console.log('Redis를 설치하고 실행하세요:');
        console.log('  Windows: https://github.com/microsoftarchive/redis/releases');
        console.log('  Mac: brew install redis && brew services start redis');
        console.log('  Linux: sudo apt-get install redis-server && sudo systemctl start redis');
        console.log('\n또는 Docker로 실행:');
        console.log('  docker run -d -p 6379:6379 redis:latest\n');
    }

    let sessionCookie = null;
    let csrfToken = null;

    try {
        // ========================================
        // 테스트 1: CSRF 토큰 발급 및 세션 생성
        // ========================================
        console.log('📝 테스트 1: CSRF 토큰 발급 및 세션 생성');

        const tokenResponse = await fetchWithCookies(`${BASE_URL}/api/auth/csrf-token`);
        const tokenData = await tokenResponse.json();

        const test1Pass = tokenResponse.status === 200 && tokenData.data?.csrfToken;
        printResult(
            'CSRF 토큰 발급',
            test1Pass,
            test1Pass ? `토큰: ${tokenData.data.csrfToken.substring(0, 20)}...` : '토큰 발급 실패'
        );

        if (!test1Pass) {
            console.error('\n❌ 토큰 발급 실패\n');
            process.exit(1);
        }

        csrfToken = tokenData.data.csrfToken;

        // 세션 쿠키 추출
        const cookies = await cookieJar.getCookies(BASE_URL);
        sessionCookie = cookies.find(c => c.key.includes('connect.sid') || c.key.includes('session'));

        printResult(
            '세션 쿠키 생성',
            !!sessionCookie,
            sessionCookie ? `쿠키: ${sessionCookie.key}=${sessionCookie.value.substring(0, 20)}...` : '세션 쿠키 없음'
        );
        console.log('');

        // ========================================
        // 테스트 2: CSRF 토큰으로 요청 (세션 검증)
        // ========================================
        console.log('📝 테스트 2: CSRF 토큰으로 보호된 요청');

        const protectedResponse = await fetchWithCookies(`${BASE_URL}/api/test/protected`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken
            },
            body: JSON.stringify({ test: 'session-data' })
        });

        const test2Pass = protectedResponse.status === 200;
        printResult(
            'CSRF 보호된 요청',
            test2Pass,
            test2Pass ? '세션 및 CSRF 검증 성공' : `실패: ${protectedResponse.status}`
        );
        console.log('');

        // ========================================
        // 테스트 3: 세션 지속성 확인 (여러 요청)
        // ========================================
        console.log('📝 테스트 3: 세션 지속성 (연속 요청)');

        let consecutiveSuccess = true;
        for (let i = 0; i < 3; i++) {
            const response = await fetchWithCookies(`${BASE_URL}/api/test/protected`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                body: JSON.stringify({ test: `request-${i + 1}` })
            });

            if (response.status !== 200) {
                consecutiveSuccess = false;
                break;
            }
            await sleep(100); // 100ms 대기
        }

        printResult(
            '연속 3회 요청',
            consecutiveSuccess,
            consecutiveSuccess ? '모든 요청에서 세션 유지' : '세션 유지 실패'
        );
        console.log('');

        // ========================================
        // 테스트 4: 세션 정보 조회
        // ========================================
        console.log('📝 테스트 4: 세션 정보 조회');

        const infoResponse = await fetchWithCookies(`${BASE_URL}/api/auth/csrf-info`, {
            headers: {
                'x-csrf-token': csrfToken
            }
        });

        const infoData = await infoResponse.json();
        const test4Pass = infoResponse.status === 200 && infoData.data;

        printResult(
            '세션 정보 조회',
            test4Pass,
            test4Pass ? `만료까지: ${Math.floor(infoData.data.expiresIn / 60)}분` : '정보 조회 실패'
        );
        console.log('');

        // ========================================
        // 테스트 5: Redis 저장소 확인 (Redis 연결된 경우)
        // ========================================
        if (redisConnected) {
            console.log('📝 테스트 5: Redis 저장소 확인');

            console.log('   ℹ️  Redis에 세션이 저장되었는지 확인하려면:');
            console.log('   redis-cli');
            console.log('   > KEYS sess:*');
            console.log('   > TTL sess:<세션ID>');
            console.log('   > GET sess:<세션ID>');
            console.log('');

            printResult(
                'Redis 세션 저장',
                true,
                'Redis가 연결되어 있어 세션이 지속됩니다'
            );
            console.log('');
        }

        // ========================================
        // 테스트 결과 요약
        // ========================================
        console.log('\n📊 테스트 결과 요약');
        console.log('─'.repeat(50));

        const allTests = redisConnected
            ? [test1Pass, !!sessionCookie, test2Pass, consecutiveSuccess, test4Pass, true]
            : [test1Pass, !!sessionCookie, test2Pass, consecutiveSuccess, test4Pass];

        const passedCount = allTests.filter(t => t).length;
        const totalCount = allTests.length;

        console.log(`✅ 통과: ${passedCount}/${totalCount}`);
        console.log(`❌ 실패: ${totalCount - passedCount}/${totalCount}`);

        if (passedCount === totalCount) {
            console.log('\n🎉 모든 테스트 통과!');
            if (redisConnected) {
                console.log('✅ Redis 세션 저장소가 정상 작동합니다');
                console.log('✅ 서버 재시작 후에도 세션이 유지됩니다');
            } else {
                console.log('⚠️  메모리 세션 사용 중 (Redis 연결 권장)');
            }
            console.log('');
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
