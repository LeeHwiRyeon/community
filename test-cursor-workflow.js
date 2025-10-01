const axios = require('axios');

/**
 * Cursor 워크플로우 테스트 스크립트
 * HTTP API를 직접 호출하여 테스트
 */
async function testCursorWorkflow() {
    const apiUrl = 'http://localhost:3000';

    try {
        console.log('🚀 Cursor 워크플로우 테스트 시작');
        console.log('=====================================');

        // 1. 헬스 체크
        console.log('1️⃣ 헬스 체크 중...');
        const healthResponse = await axios.get(`${apiUrl}/health`);
        console.log('✅ 헬스 체크 성공:', healthResponse.data);

        // 2. 워크플로우 생성 요청
        console.log('\n2️⃣ 워크플로우 생성 요청 중...');
        const workflowData = {
            message: 'React 앱 개발 - 사용자 인증, 대시보드, API 연동',
            type: 'workflow',
            metadata: {
                source: 'test',
                timestamp: new Date().toISOString()
            }
        };

        console.log('📤 요청 데이터:', JSON.stringify(workflowData, null, 2));

        const workflowResponse = await axios.post(`${apiUrl}/api/cursor/request`, workflowData);

        console.log('📥 응답 상태:', workflowResponse.status);
        console.log('📥 응답 데이터:', JSON.stringify(workflowResponse.data, null, 2));

        if (workflowResponse.data.success) {
            console.log('✅ 워크플로우 생성 성공!');
            console.log(`📋 워크플로우 ID: ${workflowResponse.data.workflow.id}`);
            console.log(`📝 생성된 작업 수: ${workflowResponse.data.tasks.length}개`);
            console.log(`📋 생성된 TODO 수: ${workflowResponse.data.todos.length}개`);
        } else {
            console.error('❌ 워크플로우 생성 실패:', workflowResponse.data.error);
        }

        // 3. 상태 확인
        console.log('\n3️⃣ 상태 확인 중...');
        const statsResponse = await axios.get(`${apiUrl}/api/cursor/stats`);
        console.log('📊 현재 상태:', statsResponse.data);

        // 4. 워크플로우 목록 조회
        console.log('\n4️⃣ 워크플로우 목록 조회 중...');
        const workflowsResponse = await axios.get(`${apiUrl}/api/cursor/workflows`);
        console.log('📋 워크플로우 목록:', workflowsResponse.data);

        console.log('\n✅ 모든 테스트 완료!');

    } catch (error) {
        console.error('❌ 테스트 오류:', error.message);
        if (error.response) {
            console.error('❌ 응답 오류:', error.response.status, error.response.data);
        }
        if (error.request) {
            console.error('❌ 요청 오류:', error.request);
        }
    }
}

// 테스트 실행
if (require.main === module) {
    testCursorWorkflow();
}

module.exports = testCursorWorkflow;
