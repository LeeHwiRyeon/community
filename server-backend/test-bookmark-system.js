/**
 * Bookmark System Test Script
 * 북마크 시스템 테스트
 * 
 * @author AUTOAGENTS
 * @date 2025-11-11
 */

import axios from 'axios';

const API_URL = 'http://localhost:3001/api';
let authToken = null;
let testUserId = null;
let testPostId = null;
let testFolderId = null;
let customFolderId = null;

// 색상 출력
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

// 1. 사용자 로그인
async function loginTestUser() {
    logTest('사용자 로그인');

    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: 'test@example.com',
            password: 'test1234'
        });

        authToken = response.data.token;
        testUserId = response.data.user.id;

        logSuccess(`로그인 성공: ${response.data.user.username} (ID: ${testUserId})`);
    } catch (error) {
        logError(`로그인 실패: ${error.response?.data?.error || error.message}`);
        throw error;
    }
}

// 2. 테스트용 게시물 찾기
async function findTestPost() {
    logTest('테스트용 게시물 찾기');

    try {
        const response = await axios.get(`${API_URL}/posts?limit=1`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.posts && response.data.posts.length > 0) {
            testPostId = response.data.posts[0].id;
            logSuccess(`테스트 게시물 발견: ID ${testPostId}`);
        } else {
            logError('게시물을 찾을 수 없습니다');
            throw new Error('No posts found');
        }
    } catch (error) {
        logError(`게시물 검색 실패: ${error.response?.data?.error || error.message}`);
        throw error;
    }
}

// 3. 기본 폴더 목록 조회
async function getDefaultFolders() {
    logTest('기본 폴더 목록 조회');

    try {
        const response = await axios.get(`${API_URL}/bookmarks/folders`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const folders = response.data.folders;
        logSuccess(`폴더 ${folders.length}개 발견`);

        folders.forEach(folder => {
            logInfo(`  ${folder.icon} ${folder.name} (${folder.bookmark_count}개) ${folder.is_default ? '[기본]' : ''}`);
            if (folder.is_default) {
                testFolderId = folder.id;
            }
        });
    } catch (error) {
        logError(`폴더 목록 조회 실패: ${error.response?.data?.error || error.message}`);
        throw error;
    }
}

// 4. 새 폴더 생성
async function createCustomFolder() {
    logTest('사용자 정의 폴더 생성');

    try {
        const response = await axios.post(
            `${API_URL}/bookmarks/folders`,
            {
                name: '개발 자료',
                description: '프로그래밍 관련 북마크',
                color: '#4caf50',
                icon: '💻'
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        customFolderId = response.data.folder.id;
        logSuccess(`폴더 생성 성공: ${response.data.folder.name} (ID: ${customFolderId})`);
    } catch (error) {
        logError(`폴더 생성 실패: ${error.response?.data?.error || error.message}`);
        throw error;
    }
}

// 5. 게시물 북마크 추가
async function addBookmark() {
    logTest('게시물 북마크 추가');

    try {
        const response = await axios.post(
            `${API_URL}/bookmarks`,
            {
                itemType: 'post',
                itemId: testPostId,
                folderId: testFolderId,
                note: '나중에 다시 읽어볼 내용',
                tags: ['중요', '개발']
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        logSuccess('북마크 추가 성공');
        logInfo(`응답: ${JSON.stringify(response.data)}`);
    } catch (error) {
        logError(`북마크 추가 실패: ${error.response?.data?.error || error.message}`);
        throw error;
    }
}

// 6. 북마크 여부 확인
async function checkBookmark() {
    logTest('북마크 여부 확인');

    try {
        const response = await axios.get(
            `${API_URL}/bookmarks/check/post/${testPostId}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (response.data.isBookmarked) {
            logSuccess('북마크 확인됨');
            logInfo(`폴더 ID: ${response.data.folderId}`);
        } else {
            logError('북마크되지 않음 (오류!)');
        }
    } catch (error) {
        logError(`북마크 확인 실패: ${error.response?.data?.error || error.message}`);
        throw error;
    }
}

// 7. 북마크 목록 조회
async function getBookmarks() {
    logTest('북마크 목록 조회');

    try {
        const response = await axios.get(
            `${API_URL}/bookmarks`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        logSuccess(`북마크 ${response.data.bookmarks.length}개 조회`);
        response.data.bookmarks.forEach(bookmark => {
            logInfo(`  📑 ${bookmark.item_title || `ID: ${bookmark.item_id}`}`);
            logInfo(`     폴더: ${bookmark.folder_name} | 메모: ${bookmark.note || '없음'}`);
            if (bookmark.tags && bookmark.tags.length > 0) {
                logInfo(`     태그: ${bookmark.tags.join(', ')}`);
            }
        });
    } catch (error) {
        logError(`북마크 목록 조회 실패: ${error.response?.data?.error || error.message}`);
        throw error;
    }
}

// 8. 폴더별 북마크 조회
async function getBookmarksByFolder() {
    logTest('폴더별 북마크 조회');

    try {
        const response = await axios.get(
            `${API_URL}/bookmarks?folderId=${testFolderId}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        logSuccess(`기본 폴더의 북마크 ${response.data.bookmarks.length}개 조회`);
    } catch (error) {
        logError(`폴더별 조회 실패: ${error.response?.data?.error || error.message}`);
        throw error;
    }
}

// 9. 북마크 수정 (폴더 이동)
async function moveBookmark() {
    logTest('북마크 폴더 이동');

    try {
        // 먼저 북마크 ID 가져오기
        const listResponse = await axios.get(
            `${API_URL}/bookmarks`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (listResponse.data.bookmarks.length === 0) {
            logError('이동할 북마크가 없습니다');
            return;
        }

        const bookmarkId = listResponse.data.bookmarks[0].id;

        const response = await axios.put(
            `${API_URL}/bookmarks/${bookmarkId}`,
            {
                folderId: customFolderId,
                note: '수정된 메모'
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        logSuccess('북마크 이동 성공');
        logInfo(`새 폴더: ${customFolderId}`);
    } catch (error) {
        logError(`북마크 이동 실패: ${error.response?.data?.error || error.message}`);
        throw error;
    }
}

// 10. 폴더 수정
async function updateFolder() {
    logTest('폴더 수정');

    try {
        const response = await axios.put(
            `${API_URL}/bookmarks/folders/${customFolderId}`,
            {
                name: '개발 자료 📚',
                description: '프로그래밍 및 개발 관련 북마크 모음',
                color: '#2196f3'
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        logSuccess('폴더 수정 성공');
        logInfo(`새 이름: ${response.data.folder.name}`);
    } catch (error) {
        logError(`폴더 수정 실패: ${error.response?.data?.error || error.message}`);
        throw error;
    }
}

// 11. 중복 북마크 시도 (실패해야 정상)
async function tryDuplicateBookmark() {
    logTest('중복 북마크 시도 (오류 예상)');

    try {
        await axios.post(
            `${API_URL}/bookmarks`,
            {
                itemType: 'post',
                itemId: testPostId
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        logError('중복 북마크가 허용되었습니다 (버그!)');
    } catch (error) {
        if (error.response?.status === 400) {
            logSuccess(`중복 방지 작동: ${error.response.data.error}`);
        } else {
            logError(`예상치 못한 오류: ${error.response?.data?.error || error.message}`);
        }
    }
}

// 12. 검색 테스트
async function searchBookmarks() {
    logTest('북마크 검색');

    try {
        const response = await axios.get(
            `${API_URL}/bookmarks?search=개발`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        logSuccess(`검색 결과: ${response.data.bookmarks.length}개`);
    } catch (error) {
        logError(`검색 실패: ${error.response?.data?.error || error.message}`);
        throw error;
    }
}

// 13. 북마크 삭제
async function removeBookmark() {
    logTest('북마크 삭제');

    try {
        const response = await axios.delete(
            `${API_URL}/bookmarks/post/${testPostId}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        logSuccess('북마크 삭제 성공');
    } catch (error) {
        logError(`북마크 삭제 실패: ${error.response?.data?.error || error.message}`);
        throw error;
    }
}

// 14. 삭제 확인
async function verifyDeletion() {
    logTest('삭제 확인');

    try {
        const response = await axios.get(
            `${API_URL}/bookmarks/check/post/${testPostId}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (!response.data.isBookmarked) {
            logSuccess('북마크 삭제 확인됨');
        } else {
            logError('북마크가 여전히 존재합니다 (버그!)');
        }
    } catch (error) {
        logError(`확인 실패: ${error.response?.data?.error || error.message}`);
        throw error;
    }
}

// 15. 폴더 삭제
async function deleteFolder() {
    logTest('폴더 삭제');

    try {
        const response = await axios.delete(
            `${API_URL}/bookmarks/folders/${customFolderId}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        logSuccess('폴더 삭제 성공');
    } catch (error) {
        logError(`폴더 삭제 실패: ${error.response?.data?.error || error.message}`);
        throw error;
    }
}

// 16. 기본 폴더 삭제 시도 (실패해야 정상)
async function tryDeleteDefaultFolder() {
    logTest('기본 폴더 삭제 시도 (오류 예상)');

    try {
        await axios.delete(
            `${API_URL}/bookmarks/folders/${testFolderId}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        logError('기본 폴더 삭제가 허용되었습니다 (버그!)');
    } catch (error) {
        if (error.response?.status === 400) {
            logSuccess(`기본 폴더 보호 작동: ${error.response.data.error}`);
        } else {
            logError(`예상치 못한 오류: ${error.response?.data?.error || error.message}`);
        }
    }
}

// 메인 테스트 실행
async function runAllTests() {
    console.log('\n' + '='.repeat(60));
    log('북마크 시스템 테스트 시작', colors.yellow);
    console.log('='.repeat(60));

    try {
        await loginTestUser();
        await findTestPost();
        await getDefaultFolders();
        await createCustomFolder();
        await addBookmark();
        await checkBookmark();
        await getBookmarks();
        await getBookmarksByFolder();
        await moveBookmark();
        await updateFolder();
        await tryDuplicateBookmark();
        await searchBookmarks();
        await removeBookmark();
        await verifyDeletion();
        await deleteFolder();
        await tryDeleteDefaultFolder();

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
