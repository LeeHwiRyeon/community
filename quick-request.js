const IntegratedOwnerRequest = require('./integrated-owner-request');

/**
 * 빠른 요청 처리 스크립트
 * pause 없이 바로 실행
 */
async function quickRequest() {
    const processor = new IntegratedOwnerRequest();

    // 명령행 인수 처리
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log('❌ 요청 내용을 입력해주세요.');
        console.log('사용법: node quick-request.js "요청 내용"');
        console.log('예시: node quick-request.js "버그 수정해줘"');
        process.exit(1);
    }

    const content = args.join(' ');

    try {
        await processor.processOwnerRequest(content);
        console.log('\n🎉 처리 완료!');
    } catch (error) {
        console.error('\n❌ 처리 중 오류 발생:', error.message);
        process.exit(1);
    }
}

// 실행
quickRequest();
