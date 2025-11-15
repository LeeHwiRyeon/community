/**
 * 프론트엔드-백엔드 통합 테스트
 * 프론트엔드가 백엔드 API를 제대로 호출하는지 확인
 */

const baseURL = 'http://localhost:3000';
const apiURL = 'http://localhost:3001/api';

let passed = 0;
let failed = 0;
let skipped = 0;

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✓ ${message}`, 'green');
    passed++;
}

function logError(message, error) {
    log(`✗ ${message}`, 'red');
    if (error) {
        log(`  오류: ${error.message}`, 'gray');
    }
    failed++;
}

function logSkip(message) {
    log(`⏭️ ${message}`, 'yellow');
    skipped++;
}

async function testBackendHealth() {
    try {
        const response = await fetch(`${apiURL}/health`);
        if (response.ok) {
            const data = await response.json();
            logSuccess(`백엔드 서버 정상 동작 (포트: ${data.port || '확인 불가'})`);
            return true;
        } else {
            logError('백엔드 서버 응답 오류', new Error(`Status: ${response.status}`));
            return false;
        }
    } catch (error) {
        logError('백엔드 서버 연결 실패', error);
        return false;
    }
}

async function testFrontendProxyBoards() {
    try {
        // 프론트엔드를 통해 API 호출 (프록시 테스트)
        const response = await fetch(`${baseURL}/api/boards`);
        if (response.ok) {
            const boards = await response.json();
            if (Array.isArray(boards) && boards.length > 0) {
                logSuccess(`프론트엔드 프록시를 통한 게시판 조회 성공 (${boards.length}개)`);
                log(`  첫 번째 게시판: "${boards[0].title}" (ID: ${boards[0].id})`, 'cyan');
                return boards[0].id;
            } else {
                logError('게시판 데이터가 비어있음');
                return null;
            }
        } else {
            logError('프론트엔드 프록시 게시판 조회 실패', new Error(`Status: ${response.status}`));
            return null;
        }
    } catch (error) {
        logError('프론트엔드 프록시 연결 실패', error);
        return null;
    }
}

async function testFrontendProxyPosts(boardId) {
    try {
        const response = await fetch(`${baseURL}/api/boards/${boardId}/posts?offset=0&limit=10`);
        if (response.ok) {
            const data = await response.json();
            if (data.items && Array.isArray(data.items)) {
                logSuccess(`프론트엔드 프록시를 통한 게시글 조회 성공 (${data.items.length}개, 전체: ${data.total}개)`);
                if (data.items.length > 0) {
                    log(`  최신 게시글: "${data.items[0].title}" (작성자: ${data.items[0].author})`, 'cyan');
                    return data.items[0].id;
                }
                return null;
            } else {
                logError('게시글 응답 형식 오류', new Error('items 배열이 없음'));
                return null;
            }
        } else {
            logError('프론트엔드 프록시 게시글 조회 실패', new Error(`Status: ${response.status}`));
            return null;
        }
    } catch (error) {
        logError('프론트엔드 프록시 게시글 조회 연결 실패', error);
        return null;
    }
}

async function testFrontendProxyPostDetail(postId) {
    try {
        const response = await fetch(`${baseURL}/api/posts/${postId}`);
        if (response.ok) {
            const post = await response.json();
            if (post && post.id) {
                logSuccess(`프론트엔드 프록시를 통한 게시글 상세 조회 성공`);
                log(`  제목: "${post.title}"`, 'cyan');
                log(`  작성자: ${post.author}, 조회수: ${post.views}`, 'cyan');
                return true;
            } else {
                logError('게시글 상세 응답 형식 오류');
                return false;
            }
        } else {
            logError('프론트엔드 프록시 게시글 상세 조회 실패', new Error(`Status: ${response.status}`));
            return false;
        }
    } catch (error) {
        logError('프론트엔드 프록시 게시글 상세 조회 연결 실패', error);
        return false;
    }
}

async function testFrontendProxyComments(postId) {
    try {
        const response = await fetch(`${baseURL}/api/posts/${postId}/comments`);
        if (response.ok) {
            const comments = await response.json();
            if (Array.isArray(comments)) {
                logSuccess(`프론트엔드 프록시를 통한 댓글 조회 성공 (${comments.length}개)`);
                if (comments.length > 0) {
                    log(`  첫 번째 댓글: "${comments[0].content.substring(0, 50)}..." (작성자: ${comments[0].author})`, 'cyan');
                } else {
                    log(`  댓글이 없습니다.`, 'gray');
                }
                return true;
            } else {
                logError('댓글 응답 형식 오류', new Error('배열이 아님'));
                return false;
            }
        } else {
            logError('프론트엔드 프록시 댓글 조회 실패', new Error(`Status: ${response.status}`));
            return false;
        }
    } catch (error) {
        logError('프론트엔드 프록시 댓글 조회 연결 실패', error);
        return false;
    }
}

async function testDirectBackendAccess() {
    try {
        const response = await fetch(`${apiURL}/boards`);
        if (response.ok) {
            logSuccess('백엔드 직접 접근 가능 (CORS 설정 정상)');
            return true;
        } else {
            logError('백엔드 직접 접근 실패', new Error(`Status: ${response.status}`));
            return false;
        }
    } catch (error) {
        logError('백엔드 직접 접근 연결 실패', error);
        return false;
    }
}

async function runTests() {
    log('\n' + '='.repeat(80), 'bright');
    log('프론트엔드-백엔드 통합 테스트 시작', 'bright');
    log('='.repeat(80) + '\n', 'bright');

    log('📋 테스트 대상:', 'cyan');
    log(`  프론트엔드: ${baseURL}`, 'gray');
    log(`  백엔드 API: ${apiURL}\n`, 'gray');

    // 1. 백엔드 헬스 체크
    log('1️⃣ 백엔드 서버 상태 확인', 'yellow');
    const backendHealthy = await testBackendHealth();
    console.log();

    if (!backendHealthy) {
        log('❌ 백엔드 서버가 실행 중이 아닙니다. 테스트를 중단합니다.', 'red');
        return;
    }

    // 2. 프론트엔드 프록시 테스트 - 게시판 목록
    log('2️⃣ 프론트엔드 프록시 테스트 - 게시판 목록', 'yellow');
    const firstBoardId = await testFrontendProxyBoards();
    console.log();

    if (!firstBoardId) {
        log('⚠️ 게시판 목록 조회 실패. 다음 테스트를 건너뜁니다.', 'yellow');
    } else {
        // 3. 프론트엔드 프록시 테스트 - 게시글 목록
        log('3️⃣ 프론트엔드 프록시 테스트 - 게시글 목록', 'yellow');
        const firstPostId = await testFrontendProxyPosts(firstBoardId);
        console.log();

        if (!firstPostId) {
            log('⚠️ 게시글 목록 조회 실패. 다음 테스트를 건너뜁니다.', 'yellow');
        } else {
            // 4. 프론트엔드 프록시 테스트 - 게시글 상세
            log('4️⃣ 프론트엔드 프록시 테스트 - 게시글 상세', 'yellow');
            await testFrontendProxyPostDetail(firstPostId);
            console.log();

            // 5. 프론트엔드 프록시 테스트 - 댓글 목록
            log('5️⃣ 프론트엔드 프록시 테스트 - 댓글 목록', 'yellow');
            await testFrontendProxyComments(firstPostId);
            console.log();
        }
    }

    // 6. 백엔드 직접 접근 테스트
    log('6️⃣ 백엔드 직접 접근 테스트 (CORS)', 'yellow');
    await testDirectBackendAccess();
    console.log();

    // 결과 요약
    log('\n' + '='.repeat(80), 'bright');
    log('테스트 결과 요약', 'bright');
    log('='.repeat(80), 'bright');
    log(`성공: ${passed}개`, 'green');
    log(`실패: ${failed}개`, failed > 0 ? 'red' : 'gray');
    log(`건너뜀: ${skipped}개`, skipped > 0 ? 'yellow' : 'gray');

    if (failed === 0) {
        log('\n🎉 모든 테스트 통과! 프론트엔드와 백엔드가 정상적으로 연동되고 있습니다.', 'green');
        log('✅ 브라우저에서 http://localhost:3000 접속하여 실제 UI를 확인하세요.\n', 'cyan');
    } else {
        log('\n⚠️ 일부 테스트 실패. 위의 오류 메시지를 확인하세요.\n', 'red');
    }
}

// 테스트 실행
runTests().catch(error => {
    log(`\n❌ 테스트 실행 중 예외 발생: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});
