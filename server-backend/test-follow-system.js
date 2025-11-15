/**
 * Follow System Test Script
 * 팔로우 시스템 테스트
 * 
 * @author AUTOAGENTS
 * @date 2025-11-11
 */

import axios from 'axios';

const API_URL = 'http://localhost:3001/api';
let authToken = null;
let testUserId = null;
let targetUserId = null;

// 색상 출력을 위한 ANSI 코드
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logTest(testName) {
    console.log(`\n${colors.cyan}━━━ ${testName} ━━━${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, colors.green);
}

function logError(message) {
    log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
    log(`ℹ️  ${message}`, colors.blue);
}

// 1. 테스트 사용자 로그인
async function loginTestUser() {
    logTest('테스트 사용자 로그인');

    try {
        // 첫 번째 사용자로 로그인
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: 'test@example.com',
            password: 'test1234'
        });

        authToken = response.data.token;
        testUserId = response.data.user.id;

        logSuccess(`로그인 성공: ${response.data.user.username} (ID: ${testUserId})`);
        logInfo(`토큰: ${authToken.substring(0, 20)}...`);
    } catch (error) {
        logError(`로그인 실패: ${error.response?.data?.error || error.message}`);
        if (error.response) {
            console.log('Response status:', error.response.status);
            console.log('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

// 2. 팔로우할 대상 사용자 찾기
async function findTargetUser() {
    logTest('팔로우 대상 사용자 찾기');

    try {
        const response = await axios.get(`${API_URL}/users`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        // 자기 자신이 아닌 첫 번째 사용자를 선택
        const targetUser = response.data.users.find(u => u.id !== testUserId);

        if (!targetUser) {
            logError('팔로우할 대상 사용자가 없습니다');
            throw new Error('No target user found');
        }

        targetUserId = targetUser.id;
        logSuccess(`대상 사용자 발견: ${targetUser.username} (ID: ${targetUserId})`);
    } catch (error) {
        logError(`사용자 검색 실패: ${error.response?.data?.error || error.message}`);
        throw error;
    }
}

// 3. 사용자 팔로우
async function followUser() {
    logTest('사용자 팔로우');

    try {
        const response = await axios.post(
            `${API_URL}/follow/${targetUserId}`,
            {},
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        logSuccess(`팔로우 성공: ${response.data.followedUsername}`);
        logInfo(`응답: ${JSON.stringify(response.data)}`);
    } catch (error) {
        logError(`팔로우 실패: ${error.response?.data?.error || error.message}`);
        throw error;
    }
}

// 4. 팔로우 상태 확인
async function checkFollowStatus() {
    logTest('팔로우 상태 확인');

    try {
        const response = await axios.get(
            `${API_URL}/follow/${targetUserId}/status`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        logSuccess('팔로우 상태 조회 성공');
        logInfo(`팔로잉 여부: ${response.data.isFollowing}`);
        logInfo(`팔로워 여부: ${response.data.isFollower}`);
        logInfo(`맞팔로우 여부: ${response.data.isMutual}`);
    } catch (error) {
        logError(`상태 확인 실패: ${error.response?.data?.error || error.message}`);
        throw error;
    }
}

// 5. 내 팔로잉 목록 조회
async function getMyFollowing() {
    logTest('내 팔로잉 목록 조회');

    try {
        const response = await axios.get(
            `${API_URL}/follow/${testUserId}/following`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        logSuccess(`팔로잉 ${response.data.following.length}명 조회`);
        response.data.following.forEach(user => {
            logInfo(`  - ${user.username} (팔로워 ${user.followers_count}명)`);
        });
    } catch (error) {
        logError(`팔로잉 목록 조회 실패: ${error.response?.data?.error || error.message}`);
        throw error;
    }
}

// 6. 대상 사용자의 팔로워 목록 조회
async function getTargetFollowers() {
    logTest('대상 사용자의 팔로워 목록 조회');

    try {
        const response = await axios.get(
            `${API_URL}/follow/${targetUserId}/followers`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        logSuccess(`팔로워 ${response.data.followers.length}명 조회`);
        response.data.followers.forEach(user => {
            logInfo(`  - ${user.username} (맞팔: ${user.is_following_back})`);
        });
    } catch (error) {
        logError(`팔로워 목록 조회 실패: ${error.response?.data?.error || error.message}`);
        throw error;
    }
}

// 7. 추천 사용자 조회
async function getSuggestions() {
    logTest('추천 사용자 조회');

    try {
        const response = await axios.get(
            `${API_URL}/follow/suggestions`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        logSuccess(`추천 사용자 ${response.data.suggestions.length}명`);
        response.data.suggestions.forEach(user => {
            logInfo(`  - ${user.username} (팔로워 ${user.followers_count}명, 공통 ${user.mutual_connections}명)`);
        });
    } catch (error) {
        logError(`추천 조회 실패: ${error.response?.data?.error || error.message}`);
        throw error;
    }
}

// 8. 팔로우 알림 조회
async function getNotifications() {
    logTest('팔로우 알림 조회');

    try {
        const response = await axios.get(
            `${API_URL}/follow/notifications`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        logSuccess(`알림 ${response.data.notifications.length}개 조회 (읽지 않음: ${response.data.unread})`);
        response.data.notifications.slice(0, 5).forEach(notif => {
            const status = notif.is_read ? '읽음' : '읽지 않음';
            logInfo(`  - ${notif.follower_username}님이 팔로우 [${status}]`);
        });
    } catch (error) {
        logError(`알림 조회 실패: ${error.response?.data?.error || error.message}`);
        // 알림이 없는 경우 에러가 아님
        if (error.response?.status !== 404) {
            throw error;
        }
    }
}

// 9. 중복 팔로우 시도 (실패해야 정상)
async function tryDuplicateFollow() {
    logTest('중복 팔로우 시도 (오류 예상)');

    try {
        await axios.post(
            `${API_URL}/follow/${targetUserId}`,
            {},
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        logError('중복 팔로우가 허용되었습니다 (버그!)');
    } catch (error) {
        if (error.response?.status === 400) {
            logSuccess(`중복 팔로우 방지 작동: ${error.response.data.error}`);
        } else {
            logError(`예상치 못한 오류: ${error.response?.data?.error || error.message}`);
        }
    }
}

// 10. 자기 자신 팔로우 시도 (실패해야 정상)
async function trySelfFollow() {
    logTest('자기 자신 팔로우 시도 (오류 예상)');

    try {
        await axios.post(
            `${API_URL}/follow/${testUserId}`,
            {},
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        logError('자기 자신 팔로우가 허용되었습니다 (버그!)');
    } catch (error) {
        if (error.response?.status === 400) {
            logSuccess(`자기 팔로우 방지 작동: ${error.response.data.error}`);
        } else {
            logError(`예상치 못한 오류: ${error.response?.data?.error || error.message}`);
        }
    }
}

// 11. 사용자 언팔로우
async function unfollowUser() {
    logTest('사용자 언팔로우');

    try {
        const response = await axios.delete(
            `${API_URL}/follow/${targetUserId}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        logSuccess('언팔로우 성공');
        logInfo(`응답: ${JSON.stringify(response.data)}`);
    } catch (error) {
        logError(`언팔로우 실패: ${error.response?.data?.error || error.message}`);
        throw error;
    }
}

// 12. 언팔로우 후 상태 확인
async function checkUnfollowStatus() {
    logTest('언팔로우 후 상태 확인');

    try {
        const response = await axios.get(
            `${API_URL}/follow/${targetUserId}/status`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (!response.data.isFollowing) {
            logSuccess('언팔로우 상태 확인 완료');
        } else {
            logError('언팔로우 후에도 팔로잉 상태입니다 (버그!)');
        }
    } catch (error) {
        logError(`상태 확인 실패: ${error.response?.data?.error || error.message}`);
        throw error;
    }
}

// 메인 테스트 실행
async function runAllTests() {
    console.log('\n' + '='.repeat(60));
    log('팔로우 시스템 테스트 시작', colors.yellow);
    console.log('='.repeat(60));

    try {
        await loginTestUser();
        await findTargetUser();
        await followUser();
        await checkFollowStatus();
        await getMyFollowing();
        await getTargetFollowers();
        await getSuggestions();
        await getNotifications();
        await tryDuplicateFollow();
        await trySelfFollow();
        await unfollowUser();
        await checkUnfollowStatus();

        console.log('\n' + '='.repeat(60));
        logSuccess('모든 테스트 통과! ✨');
        console.log('='.repeat(60) + '\n');
    } catch (error) {
        console.log('\n' + '='.repeat(60));
        logError('테스트 실패');
        console.log('='.repeat(60) + '\n');
        process.exit(1);
    }
}

// 테스트 실행
runAllTests();
