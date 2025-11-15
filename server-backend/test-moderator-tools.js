/**
 * Moderator Tools Test Script
 * 모더레이터 기능 테스트 스크립트
 * 
 * @author AUTOAGENTS
 * @date 2025-11-11
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

// 테스트용 토큰 (실제 테스트 시 유효한 모더레이터 토큰으로 변경 필요)
const MODERATOR_TOKEN = 'YOUR_MODERATOR_TOKEN_HERE';
const ADMIN_TOKEN = 'YOUR_ADMIN_TOKEN_HERE';

const headers = {
    'Authorization': `Bearer ${MODERATOR_TOKEN}`,
    'Content-Type': 'application/json'
};

// 색상 출력을 위한 유틸
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, method, url, data = null) {
    try {
        log(`\n📝 Testing: ${name}`, 'blue');
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            headers,
            ...(data && { data })
        };

        const response = await axios(config);
        log(`✅ Success (${response.status})`, 'green');
        console.log(JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        log(`❌ Error: ${error.response?.status || error.message}`, 'red');
        if (error.response?.data) {
            console.log(JSON.stringify(error.response.data, null, 2));
        }
        return null;
    }
}

async function runTests() {
    log('🚀 Starting Moderator Tools Tests\n', 'yellow');

    // 1. 게시물 관리 테스트
    log('='.repeat(60), 'yellow');
    log('1. POST MANAGEMENT TESTS', 'yellow');
    log('='.repeat(60), 'yellow');

    // 게시물 목록 조회 (전체)
    await testEndpoint(
        'Get all posts',
        'GET',
        '/moderator/posts'
    );

    // 게시물 목록 조회 (신고된 것만)
    await testEndpoint(
        'Get reported posts',
        'GET',
        '/moderator/posts?status=reported'
    );

    // 게시물 목록 조회 (플래그된 것만)
    await testEndpoint(
        'Get flagged posts',
        'GET',
        '/moderator/posts?status=flagged'
    );

    // 게시물 소프트 삭제 (실제 테스트 시 유효한 post_id로 변경)
    await testEndpoint(
        'Soft delete post',
        'POST',
        '/moderator/posts/1/delete',
        {
            reason: '스팸 게시물로 판단됨',
            permanent: false
        }
    );

    // 게시물 복구
    await testEndpoint(
        'Restore post',
        'POST',
        '/moderator/posts/1/restore'
    );

    // 2. 댓글 관리 테스트
    log('\n' + '='.repeat(60), 'yellow');
    log('2. COMMENT MANAGEMENT TESTS', 'yellow');
    log('='.repeat(60), 'yellow');

    // 댓글 목록 조회
    await testEndpoint(
        'Get all comments',
        'GET',
        '/moderator/comments'
    );

    // 댓글 삭제
    await testEndpoint(
        'Delete comment',
        'POST',
        '/moderator/comments/1/delete',
        {
            reason: '부적절한 내용 포함'
        }
    );

    // 댓글 복구
    await testEndpoint(
        'Restore comment',
        'POST',
        '/moderator/comments/1/restore'
    );

    // 3. 사용자 관리 테스트
    log('\n' + '='.repeat(60), 'yellow');
    log('3. USER MANAGEMENT TESTS', 'yellow');
    log('='.repeat(60), 'yellow');

    // 사용자 목록 조회
    await testEndpoint(
        'Get all users',
        'GET',
        '/moderator/users'
    );

    // 사용자 검색
    await testEndpoint(
        'Search users',
        'GET',
        '/moderator/users?search=test'
    );

    // 사용자 임시 차단 (7일)
    await testEndpoint(
        'Ban user temporarily',
        'POST',
        '/moderator/users/2/ban',
        {
            reason: '반복적인 규칙 위반',
            duration: 7
        }
    );

    // 사용자 차단 해제
    await testEndpoint(
        'Unban user',
        'POST',
        '/moderator/users/2/unban'
    );

    // 사용자 제한 (게시 금지)
    await testEndpoint(
        'Restrict user posting',
        'POST',
        '/moderator/users/2/restrict',
        {
            type: 'post',
            reason: '저품질 게시물 반복 작성'
        }
    );

    // 사용자 제한 해제
    await testEndpoint(
        'Unrestrict user',
        'POST',
        '/moderator/users/2/unrestrict'
    );

    // 4. 로그 및 통계 테스트
    log('\n' + '='.repeat(60), 'yellow');
    log('4. LOGS & STATISTICS TESTS', 'yellow');
    log('='.repeat(60), 'yellow');

    // 모더레이션 로그 조회
    await testEndpoint(
        'Get moderation logs',
        'GET',
        '/moderator/logs'
    );

    // 특정 모더레이터의 로그
    await testEndpoint(
        'Get logs by moderator',
        'GET',
        '/moderator/logs?moderatorId=1'
    );

    // 특정 타겟의 로그
    await testEndpoint(
        'Get logs by target',
        'GET',
        '/moderator/logs?targetType=post&targetId=1'
    );

    // 통계 조회
    await testEndpoint(
        'Get dashboard statistics',
        'GET',
        '/moderator/stats'
    );

    log('\n✅ All tests completed!\n', 'green');
}

// 권한 테스트 (모더레이터 권한이 없는 사용자로 테스트)
async function testUnauthorized() {
    log('\n🔒 Testing unauthorized access\n', 'yellow');

    const unauthorizedHeaders = {
        'Authorization': 'Bearer INVALID_TOKEN',
        'Content-Type': 'application/json'
    };

    try {
        const response = await axios.get(`${BASE_URL}/moderator/posts`, {
            headers: unauthorizedHeaders
        });
        log('❌ Should have been unauthorized!', 'red');
    } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            log('✅ Correctly rejected unauthorized access', 'green');
        } else {
            log(`❌ Unexpected error: ${error.message}`, 'red');
        }
    }
}

// 메인 실행
(async () => {
    if (MODERATOR_TOKEN === 'YOUR_MODERATOR_TOKEN_HERE') {
        log('⚠️  Please set MODERATOR_TOKEN in the script before running tests', 'red');
        log('   You can get a token by:');
        log('   1. Login as a moderator user');
        log('   2. Copy the JWT token from the response');
        log('   3. Update the MODERATOR_TOKEN variable in this script\n');
        process.exit(1);
    }

    await runTests();
    await testUnauthorized();
})();
